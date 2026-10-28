// Versioned, explicit offline compiler recipe. No package manager is executed.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {normalizedPath,racyUntil,realObservedPath,withinPath} from './path-identity.mjs';
import {cachedTarball,lockedPackage,matchTarball,npmCacheDir,registryPackage,tarballFiles} from './npm-integrity.mjs';
import {runConfig,tscRun} from './typescript-invocation.mjs';
export const directInterpretation='npm-direct-typescript@1';
export const directQualification='npm-typescript-direct-v1';
const reviewed={
  '5.5.2':{entry:'lib/tsc.js',digest:'953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816'},
  '5.6.3':{entry:'lib/tsc.js',digest:'e674b5dc4dac50f6e91be30094aeea983a1f340231717e62b0b6199ae3049eb2'},
  '5.9.3':{entry:'lib/_tsc.js',digest:'d1b32e75475710fdc85102b1365254d84ceb192d3639d962c53fe1355ce274ca'},
  '6.0.2':{entry:'lib/_tsc.js',digest:'273e16620fe23362e085980d6dd822e1315d81ba792221c9b6008755fdafccdd'},
  '6.0.3':{entry:'lib/_tsc.js',digest:'e0a6519f0d0a90125b7fd3bdbbcf700e167656beb3baf8aca8ed8bc037494537'},
};
export const reviewedTypeScriptVersions=Object.keys(reviewed);
const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const directEnvironment={variables:['NODE_ENV','NODE_OPTIONS','NODE_PATH','NODE_COMPILE_CACHE','VSCODE_INSPECTOR_OPTIONS'],
  prefixes:['NODE_','DYLD_','LD_','TSGO_','TSC_','TS_ETW_'],executableIdentity:true};
// NODE_OPTIONS flags that only size the V8 heap or pick TLS/DNS behavior; the
// reviewed compilers open no network connections. Anything else, including any
// code loader (--require, --import, --loader), is unclassified.
const inertNodeOptions=[/^--max-(?:old|semi)-space-size=\d+$/,/^--use-(?:openssl|bundled|system)-ca$/,
  /^--dns-result-order=(?:ipv4first|ipv6first|verbatim)$/];
// One variable's effect on the direct compiler: null when it cannot change what
// tsc reads or reports. Accepted values stay fingerprinted as NODE_ context.
export function directVariableIssue(key,value){
  const unsupported='direct-execution-environment-unsupported';
  // The 5.5.2 API can require this unreviewed module during probe loading.
  // Reject even empty/case aliases; do not mutate the caller's environment.
  if(/^TS_ETW_MODULE_PATH$/i.test(key)||/^VSCODE_INSPECTOR_OPTIONS$/i.test(key)&&value)return unsupported;
  if(/^NODE_/i.test(key)){
    // Node 22.13.0 predates env-proxy initialization. This injected flag is
    // inert there, but remains strictly fingerprinted as NODE_ context.
    if(key==='NODE_USE_ENV_PROXY'&&value==='1'&&process.version==='v22.13.0'&&
      !process.allowedNodeEnvironmentFlags.has('--use-env-proxy'))return null;
    if(key==='NODE_ENV'&&['','production','test'].includes(value))return null;
    // PEM data for TLS roots, not code.
    if(key==='NODE_EXTRA_CA_CERTS')return null;
    // Only bare CommonJS requires consult it; the reviewed compilers make one,
    // source-map-support, and only under NODE_ENV=development.
    if(key==='NODE_PATH')return null;
    // No quotes or escapes, so Node splits the value exactly as this does.
    if(key==='NODE_OPTIONS'&&/^[A-Za-z0-9=._ -]*$/.test(value)&&
      value.split(' ').filter(Boolean).every(flag=>inertNodeOptions.some(re=>re.test(flag))))return null;
    if(value!=='')return unsupported;
  }
  if(/^(DYLD_|LD_|TSGO_|TSC_)/i.test(key)&&value!=='')return unsupported;
  return null;
}
export function directEnvironmentIssue(env=process.env){
  if(![22,24].includes(Number(process.versions.node.split('.')[0])))return 'direct-node-version-unsupported';
  for(const [key,value] of Object.entries(env)){const issue=directVariableIssue(key,value);if(issue)return issue;}
  return null;
}
export function directCompiler(root,{verify=true}={}){
  root=realObservedPath(root);
  const manifest=createRequire(path.join(root,'package.json')).resolve('typescript/package.json');
  const tsRoot=path.dirname(realObservedPath(manifest));
  if(!withinPath(tsRoot,root)||tsRoot!==realObservedPath(path.join(root,'node_modules/typescript')))
    fail('direct-typescript-layout-unsupported');
  const version=JSON.parse(fs.readFileSync(manifest)).version;
  if(!reviewed[version])return lockedCompiler(root,tsRoot,version,verify);
  const spec=reviewed[version];
  if(verify){
    const files=[];
    const walk=(dir,relative='')=>{
      for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
        const name=relative?relative+'/'+entry.name:entry.name,full=path.join(dir,entry.name);
        if(entry.isDirectory())walk(full,name);
        else if(entry.isFile())files.push([name,full]);
        else fail('direct-typescript-implementation-unreviewed');
      }
    };walk(tsRoot);
    const digest=createHash('sha256');
    for(const [name,file] of files.sort(([a],[b])=>a<b?-1:a>b?1:0))digest.update(name+'\0'+hash(fs.readFileSync(file))+'\0');
    if(digest.digest('hex')!==spec.digest)fail('direct-typescript-implementation-unreviewed');
  }
  return {root,tsRoot,version,entry:path.join(tsRoot,spec.entry),digest:spec.digest};
}
// A TypeScript 5.x or 6.0 the lockfile records: the installed package must be
// the registry's `typescript` at that version, holding exactly the files of
// the tarball npm cached under the lockfile's integrity. Its identity is that
// integrity. The entry is lib/_tsc.js where the package has one (5.7 and
// later), as for the reviewed versions, else lib/tsc.js. A verified tree is
// remembered per process while its files keep their identity.
const verifiedTrees=new Map();
function treeIdentity(tsRoot){
  const parts=[],now=Date.now();
  const walk=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
    const full=path.join(folder,entry.name),st=fs.lstatSync(full,{bigint:true});
    if(racyUntil(st)>now)return null;
    parts.push([full,st.dev,st.ino,st.size,st.mtimeNs,st.ctimeNs].join(':'));
    if(entry.isDirectory()&&walk(full)===null)return null;
  }};
  try{if(walk(tsRoot)===null)return null;}catch{return null;}
  return hash(parts.sort().join('\n'));
}
function lockedCompiler(root,tsRoot,version,verify){
  if(!/^(?:5\.\d+|6\.0)\.\d+$/.test(version))fail('direct-typescript-version-unsupported');
  let locked;try{locked=lockedPackage(root,'typescript');}
  catch(e){fail(['npm-lockfile-unreadable','npm-shrinkwrap-unsupported'].includes(e.code)?e.code:'direct-typescript-lockfile-integrity-missing');}
  if(locked.version!==version)fail('direct-typescript-lockfile-version-differs');
  if(!registryPackage(locked,'typescript',version)||
    JSON.parse(fs.readFileSync(path.join(tsRoot,'package.json'),'utf8')).name!=='typescript')
    fail('direct-typescript-lockfile-source-unsupported');
  if(verify){
    const tree=treeIdentity(tsRoot);
    if(!tree||verifiedTrees.get(locked.integrity)!==tree){
      matchTarball(tsRoot,tarballFiles(cachedTarball(npmCacheDir(root),locked.integrity)));
      if(tree)verifiedTrees.set(locked.integrity,tree);
    }
  }
  const entry=fs.existsSync(path.join(tsRoot,'lib','_tsc.js'))?'lib/_tsc.js':'lib/tsc.js';
  return {root,tsRoot,version,entry:path.join(tsRoot,entry),digest:hash('npm-integrity\0'+locked.integrity)};
}
// The direct probe's output: root, script, configuration and program files with
// their byte digests, and the execution context. A recorded run rebuilds it from
// the same layout (direct-run-certificate.mjs).
export function directProbeOutput({root,script,configs,files,context,buildInfo}){
  const named=list=>list.map(([file,digest])=>[hash(file),digest]);
  return hash(JSON.stringify({root,script,configs:named(configs),files:named(files),...context,
    ...(buildInfo?{buildInfo}:{})}));
}
// The build-info file an incremental root config makes tsc read and write,
// as {file} relative to the root, {} when not incremental, or {issue}. The
// probe and the plan both use this rule. It must be inside the checkout, end
// in .tsbuildinfo (the only write the run recorder allows) and contain no glob
// characters (the plan excludes it with a pattern). An option that makes the
// result depend on the build-info history is refused.
export function buildInfoFor(ts,options,root) {
  if(!options?.incremental)return {};
  if(options.assumeChangesOnlyAffectDirectDependencies)return {issue:'typescript-incremental-unsound'};
  const file=ts.getTsBuildInfoEmitOutputFilePath?.(options);
  if(!file||!withinPath(path.resolve(file),root))return {issue:'typescript-buildinfo-outside-repository'};
  const relative=path.relative(root,path.resolve(file)).split(path.sep).join('/');
  if(!relative.endsWith('.tsbuildinfo')||/[*?[\]{}()!+@,]/.test(relative))return {issue:'typescript-buildinfo-name-unsupported'};
  return {file:relative};
}
// The config a run's arguments name, relative to the root, or null.
export const directConfig=(root,args)=>runConfig(root,args);
// The plan's build-info file, or null. The compiler is loaded only when the
// run's config sets incremental or extends another config.
export function directBuildInfo(root,run) {
  const name=directConfig(root,run.args);if(!name)return null;
  const config=path.join(root,name);
  let raw;try{raw=fs.readFileSync(config,'utf8');}catch{return null;}
  if(!/"(?:incremental|extends)"\s*:/.test(raw))return null;
  const compiler=directProject(root,run,{verify:false}),ts=createRequire(import.meta.url)(compiler.tsRoot);
  const parsed=ts.getParsedCommandLineOfConfigFile(config,{},{...ts.sys,onUnRecoverableConfigFileDiagnostic(){}});
  return parsed?.options?.composite?null:buildInfoFor(ts,parsed?.options,root).file??null;
}
// The probe value the daemon stores for one direct probe's checkpoint output.
export function directProbeValue(argv,output,stderrHash){
  return hash(JSON.stringify([[argv,0,hash(output),stderrHash]]));
}
// The execution context a direct probe certifies and a recorded run must match.
export function directContextHash(compiler,node){
  return hash(JSON.stringify({interpretation:directInterpretation,compiler:compiler.digest,
    entry:compiler.entry,node}));
}
// Vitest writes its results under node_modules/.vite/vitest at every run. The
// recipe does not observe them. A compiler that asks about anything under
// node_modules/.vite, is told a path there (realpath), or lists node_modules,
// could see them, so its result is UNVERIFIED.
export const directInstalledInputs=Object.freeze(['node_modules/**','!node_modules/.vite/vitest/**']);
const listings=new Set(['readdir','listing','directories','entries','readDirectory']);
// The first path of [kind, file, answer] questions that does, or null. Kinds
// are a recorded run's (readdir) or a probe's. Compared without case: a
// case-insensitive mount reaches .vite under any spelling.
export function viteCacheQuestion(root,questions){
  const fold=value=>normalizedPath(value).toLowerCase();
  const modules=fold(path.join(root,'node_modules')),cache=path.join(modules,'.vite');
  for(const [kind,file,answer] of questions){
    if(typeof file!=='string')continue;
    const at=fold(file);
    if(withinPath(at,cache)||at===modules&&listings.has(kind))return file;
    if(kind==='realpath'&&typeof answer==='string'&&withinPath(fold(answer),cache))return answer;
  }
  return null;
}
// The compiler for one check run {script, part, args}: script null for a
// check init proposed without one. The run must pass --noEmit and name a
// config inside the root.
export function directProject(root,run,{verify=true}={}){
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  if(pkg.workspaces||pkg.packageManager&&!/^npm@/.test(pkg.packageManager)||
    !['package-lock.json','npm-shrinkwrap.json'].some(file=>fs.existsSync(path.join(root,file)))||
    ['yarn.lock','pnpm-lock.yaml','bun.lock','bun.lockb'].some(file=>fs.existsSync(path.join(root,file))))
    fail('direct-npm-project-unsupported');
  const own=tscRun(pkg.scripts,run).run;
  if(!own?.noEmit)fail('typecheck-script-changed');
  const config=directConfig(root,run.args);
  if(!config||!fs.existsSync(path.join(root,config)))fail('typescript-config-unavailable');
  const issue=directEnvironmentIssue();if(issue)fail(issue);
  return {...directCompiler(root,{verify}),config};
}
// Provenance only: retain a digest, never proxy URLs/credentials or a raw dump.
// No npm process runs in this recipe; these keys are not compiler applicability.
export function observedNpmContext(env=process.env){
  return hash(JSON.stringify(Object.entries(env).filter(([key])=>/^npm_/i.test(key)||/^(?:https?_proxy|all_proxy|no_proxy)$/i.test(key)).sort(([a],[b])=>a<b?-1:a>b?1:0)));
}
