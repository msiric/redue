// Entry prerequisite controls only; importing the helper starts no collector.
import test from 'node:test';import assert from 'node:assert/strict';
import vm from 'node:vm';import fs from 'node:fs';
const text=fs.readFileSync(new URL('./acceptance/portable-ancestor-stream.mjs',import.meta.url),'utf8');
const source=text.slice(text.indexOf('export function ancestorStreamPrerequisites'),text.indexOf('\nconst fail=')).replace('export function','function');
const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'msiric/redue',RUNNER_OS:'macOS',GITHUB_REF:'refs/heads/dev/portable-ordinary-boundary',GITHUB_RUN_ATTEMPT:'1',GITHUB_RUN_ID:'123',GITHUB_SHA:'a'.repeat(40)};
function control({profile=true,uid=501,euid=uid,gid=20,egid=gid}={}){
 const context={portableRuntimeSupported:()=>profile,process:{env,getuid:()=>uid,geteuid:()=>euid,getgid:()=>gid,getegid:()=>egid}};
 vm.createContext(context);vm.runInContext(source+'\nthis.check=ancestorStreamPrerequisites;',context);return context.check;
}
test('synthetic exact approved CI profile is necessary, not machine acceptance',()=>{
 assert.equal(control()(env),true);for(const value of [{profile:false},{uid:0},{euid:0},{egid:0}])assert.equal(control(value)(env),false);
});
test('every workflow/attempt/resource label is checked before real collector use',()=>{
 for(const [key,value] of Object.entries(env)){
  const wrong={...env,[key]:key==='GITHUB_RUN_ATTEMPT'?'2':'invalid'};assert.equal(control()(wrong),false,key);
  const missing={...env};delete missing[key];assert.equal(control()(missing),false,key);
 }
 assert.equal(control()({}),false);
});
