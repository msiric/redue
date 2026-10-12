// Harmless injected-process harness. No production collector, watcher, Claude,
// model, real CI capability or broad subscription is started by these controls.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import vm from 'node:vm';
import {EventEmitter} from 'node:events';import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {AncestorProtocol,ancestorInitialization} from '../src/portable-ancestor-protocol.mjs';
const posix={skip:process.platform==='win32'?'POSIX physical-helper binding controls':false};
function harness({mode='normal',cap=true,deriveChange=false,host=true,profile=true,privileged=false,helperPrivilege=false}={}){
 let launches=0,kills=0,gaps=0,healthy=cap,serial=0;const timers=new Map();let id=0;
 const child=new EventEmitter();child.stdout=new EventEmitter();child.stdin=new EventEmitter();
 const output=o=>child.stdout.emit('data',Buffer.from(JSON.stringify({schema:1,...o})+'\n'));
 child.kill=()=>{kills++;child.emit('close',null,'SIGKILL');return true;};
 child.stdin.end=()=>{};
 child.stdin.write=bytes=>{const line=bytes.toString();queueMicrotask(()=>{
  if(line.startsWith('INIT ')){
   if(mode==='startup-hang')return;
   output({type:'ready',request:0,serial:0,uncertain:false});return;
  }
  const [type,n]=line.trim().split(' '),request=Number(n);
  if(mode==='malformed'&&type==='barrier'){child.stdout.emit('data',Buffer.from('{bad\n'));return;}
  if(mode==='gap'&&type==='barrier'){output({type:'uncertainty',code:'FSEVENTS_GAP',serial});return;}
  if(type==='close'){
   output({type:'closed',request,serial,uncertain:false});
   if(mode==='partial-close')child.stdout.emit('data',Buffer.from('{partial'));
   child.emit('close',0,null);return;
  }
  output({type:'barrier',request,serial,uncertain:false});
 });return true;};
 const root='/Users/runner/owned-checkout',state='/Users/runner/owned-redue-state',scopeDigest='a'.repeat(64);
 const here=new URL('../src/portable-ancestor-observer.mjs',import.meta.url);
 const source=fs.readFileSync(here,'utf8').replace(/^import [^\n]*\n/gm,'').replace('export async function ','async function ').replaceAll('import.meta.url',JSON.stringify(here.href));
 const testFs=Object.create(fs);
 testFs.lstatSync=(file,options)=>{const stat=fs.lstatSync(file,options);if(helperPrivilege&&String(file).endsWith('portable-ancestor-fsevents-darwin-arm64'))return new Proxy(stat,{get:(target,key)=>key==='mode'?target.mode|0o4000n:Reflect.get(target,key)});return stat;};
 const context={fs:testFs,path,os:{...os,homedir:()=>'/Users/runner'},createHash,randomUUID,fileURLToPath,URL,Buffer,
  process:{env:{GITHUB_ACTIONS:host?'true':'false',GITHUB_RUN_ID:'123'},getuid:()=>process.getuid(),geteuid:()=>privileged?process.getuid()+1:process.getuid(),getgid:()=>process.getgid(),getegid:()=>process.getgid()},
  ancestorObservationResources:()=>({root,state,file:'/Users/runner/Library/REDUE-Observer-Authority/123/scope.json'}),
  ancestorObservationCapabilityCurrent:()=>healthy,
  derivePortableRawQueryScopes:()=>{if(deriveChange)healthy=false;return {scopeDigest,scopes:[{candidate:root+'/src',descendants:true}]};},
  directEnvironmentIssue:()=>null,portableRuntimeSupported:()=>profile,AncestorProtocol,ancestorInitialization,
  spawn:()=>{launches++;return child;},
  setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;},clearTimeout:key=>timers.delete(key)};
 vm.createContext(context);vm.runInContext(source+'\nthis.open=openRawQueryObserver;',context);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 return {open:()=>context.open({},[],{onGap:()=>gaps++}),flush,expire:()=>{for(const {fn} of [...timers.values()])fn();},revoke:()=>{healthy=false;},
  stats:()=>({launches,kills,gaps}),change:()=>{serial++;output({type:'occurrence',scopeIds:[0],serial});}};
}
test('missing host capability or a changed provisioning during derivation launches no process',posix,async()=>{
 for(const options of [{host:false},{deriveChange:true},{profile:false},{privileged:true},{helperPrivilege:true}]){const h=harness(options);await assert.rejects(h.open());assert.equal(h.stats().launches,0);}
});
test('ready, raw changes, synchronized barriers and actual close outcome are distinct',posix,async()=>{
 const h=harness(),observer=await h.open(),first=await observer.barrier();assert.equal(first.serial,0);assert.equal(first.healthy,true);
 h.change();const changed=await observer.barrier();assert.equal(changed.serial,1);assert.equal(changed.generation,first.generation);
 const closed=await observer.close();assert.equal(closed.clean,true);assert.equal(closed.code,0);assert.equal(h.stats().launches,1);assert.equal(h.stats().kills,0);
});
test('startup timeout reaps only the owned mock and cannot return an observer',posix,async()=>{
 const h=harness({mode:'startup-hang'}),promise=h.open();await h.flush();h.expire();await assert.rejects(promise);
 assert.equal(h.stats().launches,1);assert.equal(h.stats().kills,1);assert.equal(h.stats().gaps,1);
});
test('malformed output, source revocation and native uncertainty irreversibly block barriers',posix,async()=>{
 for(const mode of ['malformed','gap','revoked']){
  const h=harness({mode}),observer=await h.open();if(mode==='revoked')h.revoke();
  await assert.rejects(observer.barrier());await assert.rejects(observer.barrier());
  const closed=await observer.close();assert.equal(closed.clean,false);assert.equal(h.stats().gaps,1);
 }
});
test('a closed row and zero exit cannot launder uncollected partial output',posix,async()=>{
 const h=harness({mode:'partial-close'}),observer=await h.open(),closed=await observer.close();
 assert.equal(closed.code,0);assert.equal(closed.clean,false);assert.equal(h.stats().gaps,1);
});
