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
export function directEnvironmentIssue(env=process.env){
  if(![22,24].includes(Number(process.versions.node.split('.')[0])))return 'direct-node-version-unsupported';
  if(env.VSCODE_INSPECTOR_OPTIONS)return 'direct-execution-environment-unsupported';
  for(const [key,value] of Object.entries(env)){
    // The 5.5.2 API can require this unreviewed module during probe loading.
    // Reject even empty/case aliases; do not mutate the caller's environment.
    if(/^TS_ETW_MODULE_PATH$/i.test(key))return 'direct-execution-environment-unsupported';
    if(/^NODE_/i.test(key)){
      // Node 22.13.0 predates env-proxy initialization. This injected flag is
      // inert there, but remains strictly fingerprinted as NODE_ context.
      if(key==='NODE_USE_ENV_PROXY'&&value==='1'&&process.version==='v22.13.0'&&
        !process.allowedNodeEnvironmentFlags.has('--use-env-proxy'))continue;
      if(key==='NODE_ENV'&&['','production','test'].includes(value))continue;
      if(value!=='')return 'direct-execution-environment-unsupported';
    }
    if(/^(DYLD_|LD_|TSGO_|TSC_)/i.test(key)&&value!=='')return 'direct-execution-environment-unsupported';
  }
  return null;
}
// Fixed narrowing rule for the disabled sealed preparation probe only. There is
// no caller-defined exclusion, callback or verification bypass. The enclosing
// immutable native read view remains required; these named metadata checks are
// not atomic confinement against concurrent namespace replacement.
function sealedNamespaceGuard(root){
 const reject=()=>fail('SEALED_PROBE_GIT_UNSUPPORTED');
 const lexical=file=>{if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file||Buffer.byteLength(file)>4096||/[\u0000-\u001f\u007f]/u.test(file))reject();
  if(file.replaceAll('\\','/').split('/').some(part=>part.toLowerCase()==='.git'))reject();if(!withinPath(file,root))reject();};
 lexical(root);
 const named=(file,directory)=>{lexical(file);let current=root;const parts=path.relative(root,file).split(path.sep).filter(Boolean),names=[root];
  for(const part of parts){current=path.join(current,part);names.push(current);}
  for(let at=0;at<names.length;at++){const name=names[at];lexical(name);const stat=fs.lstatSync(name);
   if(stat.isSymbolicLink()||at===names.length-1&&!directory&&stat.nlink!==1||at<names.length-1&&!stat.isDirectory()||at===names.length-1&&!(directory?stat.isDirectory():stat.isFile()))reject();
   const actual=realObservedPath(name);lexical(actual);if(actual!==name)reject();}
 };
 return{directory:file=>named(file,true),file:file=>named(file,false)};
}
function sealedCompilerFiles(tsRoot,guard){
 const files=[];let count=0,directories=0;
 const walk=(dir,relative='')=>{if(++directories>100000||relative.split('/').length>64)fail('direct-typescript-implementation-unreviewed');guard.directory(dir);
  const opened=fs.opendirSync(dir);try{let entry;while((entry=opened.readSync())!==null){
   if(++count>200000||typeof entry.name!=='string'||!entry.name||entry.name.includes('/')||entry.name.includes('\\')||entry.name==='.'||entry.name==='..')fail('direct-typescript-implementation-unreviewed');
   const name=relative?relative+'/'+entry.name:entry.name,full=path.join(dir,entry.name);
   if(entry.isDirectory()){guard.directory(full);walk(full,name);}else if(entry.isFile()){guard.file(full);if(files.length>=100000)fail('direct-typescript-implementation-unreviewed');files.push([name,full]);}
   else fail('direct-typescript-implementation-unreviewed');
  }}finally{opened.closeSync();}};walk(tsRoot);return files;
}
export function directCompiler(root,{verify=true,sealedNamespace=false}={}){
  if(![true,false].includes(sealedNamespace)||sealedNamespace&&verify!==true)fail('direct-typescript-implementation-unreviewed');
  const guard=sealedNamespace?sealedNamespaceGuard(root):null;
  // Validate expected local candidates BEFORE Node resolution, which can perform
  // internal package-JSON reads before returning a resolved manifest path.
  if(guard){guard.directory(root);guard.file(path.join(root,'package.json'));guard.directory(path.join(root,'node_modules'));guard.directory(path.join(root,'node_modules/typescript'));guard.file(path.join(root,'node_modules/typescript/package.json'));}
  root=realObservedPath(root);
  const manifest=createRequire(path.join(root,'package.json')).resolve('typescript/package.json');
  if(guard){if(manifest!==path.join(root,'node_modules/typescript/package.json'))fail('direct-typescript-layout-unsupported');guard.file(manifest);}
  const tsRoot=path.dirname(realObservedPath(manifest));
  if(!withinPath(tsRoot,root)||tsRoot!==realObservedPath(path.join(root,'node_modules/typescript')))
    fail('direct-typescript-layout-unsupported');
  const version=JSON.parse(fs.readFileSync(manifest)).version,spec=reviewed[version];
  if(!spec)fail('direct-typescript-version-unsupported');
  if(verify){
    const files=guard?sealedCompilerFiles(tsRoot,guard):[];
    const walk=(dir,relative='')=>{
      for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
        const name=relative?relative+'/'+entry.name:entry.name,full=path.join(dir,entry.name);
        if(entry.isDirectory())walk(full,name);
        else if(entry.isFile())files.push([name,full]);
        else fail('direct-typescript-implementation-unreviewed');
      }
    };if(!guard)walk(tsRoot);
    const digest=createHash('sha256');
    for(const [name,file] of files.sort(([a],[b])=>a<b?-1:a>b?1:0)){if(guard)guard.file(file);digest.update(name+'\0'+hash(fs.readFileSync(file))+'\0');}
    if(digest.digest('hex')!==spec.digest)fail('direct-typescript-implementation-unreviewed');
  }
  return {tsRoot,version,entry:path.join(tsRoot,spec.entry),digest:spec.digest};
}
export function directProject(root,script,{verify=true,sealedNamespace=false}={}){
  if(![true,false].includes(sealedNamespace)||sealedNamespace&&verify!==true)fail('direct-typescript-implementation-unreviewed');
  if(sealedNamespace){const guard=sealedNamespaceGuard(root);guard.directory(root);guard.file(path.join(root,'package.json'));}
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  if(pkg.workspaces||pkg.packageManager&&!/^npm@/.test(pkg.packageManager)||
    !['package-lock.json','npm-shrinkwrap.json'].some(file=>fs.existsSync(path.join(root,file)))||
    ['yarn.lock','pnpm-lock.yaml','bun.lock','bun.lockb'].some(file=>fs.existsSync(path.join(root,file))))
    fail('direct-npm-project-unsupported');
  if(pkg.scripts?.[script]?.trim()!=='tsc --noEmit'||pkg.scripts?.['pre'+script]||pkg.scripts?.['post'+script])
    fail('typecheck-script-changed');
  const issue=directEnvironmentIssue();if(issue)fail(issue);
  return directCompiler(root,sealedNamespace?{verify,sealedNamespace:true}:{verify});
}
// Provenance only: retain a digest, never proxy URLs/credentials or a raw dump.
// No npm process runs in this recipe; these keys are not compiler applicability.
export function observedNpmContext(env=process.env){
  return hash(JSON.stringify(Object.entries(env).filter(([key])=>/^npm_/i.test(key)||/^(?:https?_proxy|all_proxy|no_proxy)$/i.test(key)).sort(([a],[b])=>a<b?-1:a>b?1:0)));
}
