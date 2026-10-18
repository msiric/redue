// Versioned, explicit offline compiler recipe. No package manager is executed.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {realObservedPath,withinPath} from './path-identity.mjs';
export const directInterpretation='npm-direct-typescript@1';
export const directQualification='npm-typescript-direct-v1';
const reviewed={
  '5.5.2':{entry:'lib/tsc.js',digest:'953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816'},
  '5.6.3':{entry:'lib/tsc.js',digest:'e674b5dc4dac50f6e91be30094aeea983a1f340231717e62b0b6199ae3049eb2'},
  '5.9.3':{entry:'lib/_tsc.js',digest:'d1b32e75475710fdc85102b1365254d84ceb192d3639d962c53fe1355ce274ca'},
};
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
  const version=JSON.parse(fs.readFileSync(manifest)).version,spec=reviewed[version];
  if(!spec)fail('direct-typescript-version-unsupported');
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
  return {tsRoot,version,entry:path.join(tsRoot,spec.entry),digest:spec.digest};
}
// The direct probe's output: root, script, configuration and program files with
// their byte digests, and the execution context. A recorded run rebuilds it from
// the same layout (direct-run-certificate.mjs).
export function directProbeOutput({root,script,configs,files,context}){
  const named=list=>list.map(([file,digest])=>[hash(file),digest]);
  return hash(JSON.stringify({root,script,configs:named(configs),files:named(files),...context}));
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
export function directProject(root,script,{verify=true}={}){
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  if(pkg.workspaces||pkg.packageManager&&!/^npm@/.test(pkg.packageManager)||
    !['package-lock.json','npm-shrinkwrap.json'].some(file=>fs.existsSync(path.join(root,file)))||
    ['yarn.lock','pnpm-lock.yaml','bun.lock','bun.lockb'].some(file=>fs.existsSync(path.join(root,file))))
    fail('direct-npm-project-unsupported');
  if(pkg.scripts?.[script]?.trim()!=='tsc --noEmit'||pkg.scripts?.['pre'+script]||pkg.scripts?.['post'+script])
    fail('typecheck-script-changed');
  const issue=directEnvironmentIssue();if(issue)fail(issue);
  return directCompiler(root,{verify});
}
// Provenance only: retain a digest, never proxy URLs/credentials or a raw dump.
// No npm process runs in this recipe; these keys are not compiler applicability.
export function observedNpmContext(env=process.env){
  return hash(JSON.stringify(Object.entries(env).filter(([key])=>/^npm_/i.test(key)||/^(?:https?_proxy|all_proxy|no_proxy)$/i.test(key)).sort(([a],[b])=>a<b?-1:a>b?1:0)));
}
