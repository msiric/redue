// Pure profile-construction controls. No compiler, sandbox, agent or model.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {createHash} from 'node:crypto';
const text=fs.readFileSync(new URL('./acceptance/sealed-typescript-compiler-profile.mjs',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replace('export function ','function ')+';globalThis.invoke=sealedCompilerFixtureProfile;';
function invoke(scenario={},input){
  let reads=0,projectCalls=0;const root='/owned/private/redue-materialization-ABC123',parent=path.dirname(root),node='/reviewed/node';
  const stat=file=>({uid:scenario.badOwner&&file===root?502n:501n,dev:1n,ino:BigInt(file.length),
    mode:scenario.badMode&&file===parent?0o40755n:0o40700n,
    isSymbolicLink:()=>scenario.symlink===file,isDirectory:()=>!file.endsWith('/node')&&!file.endsWith('/tsc.js'),isFile:()=>file===node||file.endsWith('/tsc.js')});
  const mockFs={realpathSync:file=>scenario.alias===file?file+'.alias':file,lstatSync:stat,readFileSync:()=>{reads++;return 'NODE';}};
  const crypto=()=>({update(){return this;},digest:()=>scenario.badNode?'0'.repeat(64):'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'});
  const context=vm.createContext({fs:mockFs,path,os:{release:()=>scenario.release||'25.6.0'},createHash:crypto,
    process:{platform:scenario.platform||'darwin',arch:scenario.arch||'arm64',version:scenario.version||'v22.13.0',getuid:()=>501,execPath:node},
    directProject:(selected,script)=>{projectCalls++;if(scenario.projectFailure)throw Object.assign(Error('ENVIRONMENT_REFUSED'),{code:'ENVIRONMENT_REFUSED'});
      assert.equal(selected,root);assert.equal(script,'test:types');return {tsRoot:root+'/node_modules/typescript',entry:root+'/node_modules/typescript/lib/tsc.js',version:scenario.compiler||'5.5.2',digest:'a'.repeat(64)};},Buffer});
  vm.runInContext(text,context);let value,error;try{value=context.invoke(input===undefined?vm.runInContext(`({root:${JSON.stringify(root)},script:'test:types'})`,context):input);}catch(e){error=e.code;}
  return {value,error,reads,projectCalls};
}
test('fixed readonly compiler proposal never grants stage writes, network, shell or sealing',()=>{
  const r=invoke();assert.equal(r.error,undefined);assert.match(r.value.profile,/\(deny default\)/);
  assert.equal(r.value.profile.match(/\(allow file-write\*/g).length,1);assert(r.value.profile.includes('(allow file-write* (literal "/dev/null"))'));
  assert(!r.value.profile.includes('network'));assert(!r.value.profile.includes('process-fork'));
  assert.deepEqual(Array.from(r.value.command),['/reviewed/node','/owned/private/redue-materialization-ABC123/node_modules/typescript/lib/tsc.js','--noEmit']);
  assert.equal(r.value.sealed,false);assert.equal(r.value.reuseEligible,false);assert.equal(r.value.environmentUnchanged,true);
  assert.equal(r.value.executesOnConstruction,false);assert.equal(r.value.nativeAgentEnforcement,'NOT_TESTED');assert(Object.isFrozen(r.value.command));
});
test('root and parent ownership/mode/physical aliases refuse before any project code',()=>{
  for(const scenario of [{badOwner:true},{badMode:true},{alias:'/owned/private/redue-materialization-ABC123'},{symlink:'/owned/private'}]){
    const r=invoke(scenario);assert(r.error);assert.equal(r.projectCalls,0);
  }
});
test('unsupported actual profile or Node identity refuses',()=>{
  for(const scenario of [{platform:'linux'},{arch:'x64'},{version:'v22.14.0'},{release:'25.7.0'},{badNode:true}]){
    const r=invoke(scenario);assert(r.error);assert.equal(r.projectCalls,0);
  }
});
test('whole compiler and existing environment/script guard errors propagate conservatively',()=>{
  assert.equal(invoke({compiler:'5.6.3'}).error,'STAGED_COMPILER_IMPLEMENTATION');
  assert.equal(invoke({projectFailure:true}).error,'ENVIRONMENT_REFUSED');
});
test('arbitrary executor and accessors cannot become profile authority',()=>{
  let called=0;for(const input of [{root:'/x',script:'test:types',command:['/bin/sh']},{get root(){called++;return '/x';},script:'test:types'}]){
    const r=invoke({},input);assert.equal(r.error,'STAGED_COMPILER_OPTIONS');assert.equal(r.reads,0);assert.equal(r.projectCalls,0);
  }assert.equal(called,0);
});
