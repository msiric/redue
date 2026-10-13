// Exact admission source with bounded in-memory filesystem/loader/hash mocks.
// No TypeScript, real Git/credential bodies, native process or model is loaded.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const source=fs.readFileSync(new URL('../src/direct-typescript.mjs',import.meta.url),'utf8');
const stripped=source.replace(/^import .*;\n/gm,'').replaceAll('export const ','const ').replaceAll('export function ','function ');
const construct=Function('fs','path','createHash','createRequire','realObservedPath','withinPath','process',stripped+'\nreturn {directProject,directCompiler};');
const root='/owned/stage',tsRoot=root+'/node_modules/typescript',pkg=root+'/package.json',manifest=tsRoot+'/package.json',lib=tsRoot+'/lib';
const reviewed='953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816';
function fixture({git,wholeMatch=true,aliases={},missing=[],symlinks=[],denied={},afterDirectory}={}){
 const body=[],metadata=[],resolution=[],closed=[],directories=new Set([root,root+'/node_modules',tsRoot,lib]),files=new Set([pkg,manifest,lib+'/tsc.js',lib+'/typescript.js']);
 if(git){directories.add(tsRoot+'/'+git);files.add(tsRoot+'/'+git+'/config');}
  const stat=file=>{metadata.push(file);if(denied[file])throw Object.assign(Error('NONSECRET'),{code:denied[file]});if(missing.includes(file))throw Object.assign(Error('NONSECRET'),{code:'ENOENT'});
  if(!files.has(file)&&!directories.has(file))throw Object.assign(Error('NONSECRET'),{code:'ENOENT'});return{isDirectory:()=>directories.has(file),isFile:()=>files.has(file),isSymbolicLink:()=>symlinks.includes(file),size:20,uid:501,nlink:1};};
 const rows=dir=>{const names=[...directories,...files].filter(file=>file!==dir&&path.dirname(file)===dir).map(file=>path.basename(file)).sort();return names.map(name=>({name,isDirectory:()=>directories.has(dir+'/'+name),isFile:()=>files.has(dir+'/'+name),isSymbolicLink:()=>symlinks.includes(dir+'/'+name)}));};
 const io={lstatSync:stat,statSync:stat,realpathSync:file=>{stat(file);return aliases[file]??file;},existsSync:file=>file===root+'/package-lock.json',
  readFileSync(file){body.push(file);if(file===pkg)return Buffer.from(JSON.stringify({scripts:{typecheck:'tsc --noEmit'}}));if(file===manifest)return Buffer.from('{"version":"5.5.2"}');return Buffer.from('NONSECRET synthetic implementation bytes');},
  readdirSync(dir){const result=rows(dir);afterDirectory?.(dir,{files,directories});return result;},
  opendirSync(dir){const result=rows(dir);afterDirectory?.(dir,{files,directories});let at=0;return{readSync:()=>result[at++]??null,closeSync(){closed.push(dir);}};}};
 const process={platform:'darwin',version:'v22.13.0',versions:{node:'22.13.0'},env:{},allowedNodeEnvironmentFlags:new Set()};
 const crypto=()=>{let whole=false;return{update(value){if(typeof value==='string'&&value.includes('\0'))whole=true;return this;},digest(){return whole?(wholeMatch?reviewed:'0'.repeat(64)):'a'.repeat(64);}};};
 const api=construct(io,path,crypto,()=>({resolve(spec){resolution.push(spec);return manifest;}}),file=>io.realpathSync(file),(file,base)=>file===base||file.startsWith(base+'/'),process);
 return{...api,body,metadata,resolution,closed,files,directories,io};
}
for(const git of ['.git','.Git','.GIT'])test(`sealed admission refuses ${git} implementation namespace before any Git body hash`,()=>{
 const f=fixture({git,wholeMatch:false});let error;try{f.directProject(root,'typecheck',{verify:true,sealedNamespace:true});}catch(e){error=e;}assert(!f.body.some(file=>file.toLowerCase().includes('/.git/')),'NO_GIT_BODY_READ');assert.equal(error?.code,'SEALED_PROBE_GIT_UNSUPPORTED');
});

test('fixed sealed admission still hashes every reviewed file and loads no compiler or command',()=>{
 const f=fixture();const result=f.directProject(root,'typecheck',{verify:true,sealedNamespace:true});assert.equal(result.version,'5.5.2');assert.equal(result.digest,reviewed);assert.equal(result.entry,lib+'/tsc.js');
 assert.deepEqual(f.body,[pkg,manifest,lib+'/tsc.js',lib+'/typescript.js',manifest]);assert.deepEqual(f.resolution,['typescript/package.json']);assert.deepEqual(f.closed.sort(),[lib,tsRoot].sort());
});
test('ordinary default admission retains its original behavior and performs no sealed metadata/enumeration path',()=>{
 const f=fixture({git:'.git',wholeMatch:false});assert.throws(()=>f.directProject(root,'typecheck',{verify:true}),error=>error?.code==='direct-typescript-implementation-unreviewed');assert(f.body.includes(tsRoot+'/.git/config'));assert.deepEqual(f.closed,[]);
 const ordinary=fixture();ordinary.directProject(root,'typecheck',{verify:true});assert.deepEqual(ordinary.closed,[]);assert(!ordinary.metadata.includes(pkg));
});
test('sealed admission cannot skip whole implementation verification or select a custom narrowing policy',()=>{
 for(const options of [{verify:false,sealedNamespace:true},{verify:true,sealedNamespace:'yes'},{verify:true,sealedNamespace:null},{verify:true,sealedNamespace:()=>false}]){const f=fixture();assert.throws(()=>f.directProject(root,'typecheck',options));assert.deepEqual(f.body,[]);assert.deepEqual(f.resolution,[]);}
 const changed=fixture({wholeMatch:false});assert.throws(()=>changed.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='direct-typescript-implementation-unreviewed');assert(changed.body.includes(lib+'/typescript.js'));
});
test('expected package and compiler namespace aliases reject before Node internal package resolution',()=>{
 for(const target of [root,pkg,root+'/node_modules',tsRoot,manifest])for(const actual of [root+'/.GiT/alias','/outside/alias']){
  const f=fixture({aliases:{[target]:actual}});assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='SEALED_PROBE_GIT_UNSUPPORTED');assert.deepEqual(f.resolution,[]);assert(!f.body.includes(manifest));if(target===root||target===pkg)assert.deepEqual(f.body,[]);
 }
 for(const target of [pkg,tsRoot,manifest]){const f=fixture({symlinks:[target]});assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='SEALED_PROBE_GIT_UNSUPPORTED');assert.deepEqual(f.resolution,[]);assert(!f.body.includes(manifest));}
});
test('missing or denied expected local compiler never triggers fallback package resolution',()=>{
 for(const target of [root+'/node_modules',tsRoot,manifest])for(const code of ['ENOENT','EPERM','EACCES']){
  const f=fixture(code==='ENOENT'?{missing:[target]}:{denied:{[target]:code}});assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code===code);assert.deepEqual(f.resolution,[]);assert(!f.body.includes(manifest));
 }
});
test('aliases and hardlinks discovered immediately before each compiler body read refuse before that read',()=>{
 for(const kind of ['symbolic','hardlink','resolved-Git']){
  const f=fixture(),target=lib+'/typescript.js',original=f.io.lstatSync;let fileCalls=0;
  f.io.lstatSync=function(file){const stat=original(file);if(file===target&&++fileCalls>=2){if(kind==='symbolic')return {...stat,isSymbolicLink:()=>true};if(kind==='hardlink')return {...stat,nlink:2};}return stat;};
  if(kind==='resolved-Git'){const real=f.io.realpathSync;f.io.realpathSync=function(file){const value=real(file);return file===target&&fileCalls>=2?root+'/.git/config':value;};}
  assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='SEALED_PROBE_GIT_UNSUPPORTED');assert(!f.body.includes(target));
 }
});
test('iterator read/close faults retain conservative failure with no new admitted result',()=>{
 for(const operation of ['readSync','closeSync']){const f=fixture(),open=f.io.opendirSync;f.io.opendirSync=function(dir){const iterator=open(dir);return {...iterator,[operation](){if(operation==='closeSync')iterator.closeSync();throw Object.assign(Error('NONSECRET'),{code:'EIO'});}};};assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='EIO');assert(!f.body.includes(lib+'/typescript.js'));}
});
test('bounded namespace enumeration closes before overflow and hashes no uninspected member',()=>{
 const f=fixture();let calls=0,closed=0;f.io.opendirSync=function(){return{readSync(){calls++;return{name:'package.json',isDirectory:()=>false,isFile:()=>true};},closeSync(){closed++;}};};
 assert.throws(()=>f.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='direct-typescript-implementation-unreviewed');assert.equal(calls,100001);assert.equal(closed,1);assert.deepEqual(f.body,[pkg,manifest]);
});
test('a resolver result other than the checked exact local manifest is refused before reading it',()=>{
 const text=stripped+'\nreturn {directProject};',f=fixture(),process={platform:'darwin',version:'v22.13.0',versions:{node:'22.13.0'},env:{},allowedNodeEnvironmentFlags:new Set()},api=Function('fs','path','createHash','createRequire','realObservedPath','withinPath','process',text)(f.io,path,()=>{throw Error('HASH_NOT_EXPECTED');},()=>({resolve:()=>root+'/other/package.json'}),file=>f.io.realpathSync(file),(file,base)=>file===base||file.startsWith(base+'/'),process);
 assert.throws(()=>api.directProject(root,'typecheck',{verify:true,sealedNamespace:true}),error=>error?.code==='direct-typescript-layout-unsupported');assert.deepEqual(f.body,[pkg]);
});
