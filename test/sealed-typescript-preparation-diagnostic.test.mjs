import test from 'node:test';import assert from 'node:assert/strict';
import {measurePreparationOperations,PREPARATION_DIAGNOSTIC_LIMITS} from './acceptance/sealed-typescript-preparation-diagnostic.mjs';
function fake(){return Object.fromEntries(['lstatSync','openSync','fstatSync','readSync','writeSync','fsyncSync','closeSync','mkdirSync','chmodSync','fchmodSync','symlinkSync','readlinkSync','realpathSync','opendirSync']
 .map(name=>[name,(...args)=>name==='openSync'?10:name==='readSync'||name==='writeSync'?3:name==='opendirSync'?{readSync(){return null;},closeSync(){}}:undefined]));}
test('fixed counters retain operations and failures without arguments/body/error values',()=>{
 const io=fake(),original=io.openSync,frames=[];let n=0;
 const r=measurePreparationOperations({root:'/owned/source',parent:'/owned/stage'},()=>{
  const fd=io.openSync('/owned/source/NONSECRET_PATH');io.readSync(fd,Buffer.from('NONSECRET_BODY'));io.closeSync(fd);
  const dest=io.openSync('/owned/stage/file');io.writeSync(dest,Buffer.from('NONSECRET_BODY'));io.fsyncSync(dest);io.closeSync(dest);
  io.lstatSync('/outside/NONSECRET_PATH');const d=io.opendirSync('/owned/source');d.readSync();d.closeSync();return 123;
 },frame=>frames.push(JSON.parse(frame)),{io,clock:()=>n+=1000});
 assert.equal(r.result,123);assert.equal(io.openSync,original);assert(r.clockValid);
 const last=frames.at(-1);assert(last.final);assert.equal(last.stats.source.readSync[4],3);assert.equal(last.stats.stage.writeSync[4],3);
 assert.equal(last.stats.stage.fsyncSync[0],1);assert.equal(last.stats.boundary.lstatSync[0],1);
 assert.equal(last.stats.source.directoryreadSync[0],1);assert(!JSON.stringify(frames).includes('NONSECRET'));
});
test('a thrown operation restores originals and does not certify success',()=>{
 const io=fake(),original=io.openSync,frames=[];let n=0;io.lstatSync=()=>{throw Object.assign(Error('NONSECRET_ERROR'),{code:'EPERM'});};
 assert.throws(()=>measurePreparationOperations({root:'/r',parent:'/p'},()=>io.lstatSync('/r/a'),f=>frames.push(f),{io,clock:()=>n+=5000}),{code:'EPERM'});
 assert.equal(io.openSync,original);assert(!frames.join('').includes('NONSECRET'));assert.equal(JSON.parse(frames.at(-1)).stats.source.lstatSync[3],1);
 assert.equal(JSON.parse(frames.at(-1)).final,true);
});
test('retained directory methods restore on success, close and thrown operations',()=>{
 for(const failed of [false,true]){const io=fake(),dir={readSync(){return null;},closeSync(){}},read=dir.readSync,close=dir.closeSync;io.opendirSync=()=>dir;
  const operation=()=>{io.opendirSync('/r');if(failed)throw Object.assign(Error('NONSECRET'),{code:'EPERM'});return dir;};
  if(failed)assert.throws(()=>measurePreparationOperations({root:'/r',parent:'/p'},operation,()=>{}, {io,clock:()=>0}),{code:'EPERM'});
  else assert.equal(measurePreparationOperations({root:'/r',parent:'/p'},operation,()=>{}, {io,clock:()=>0}).result,dir);
  assert.equal(dir.readSync,read);assert.equal(dir.closeSync,close);
 }
});
test('observer failure never masks operation result or thrown failure',()=>{
 const io=fake();let n=0;const emit=()=>{throw Error('NONSECRET_OBSERVER_ERROR');};
 const r=measurePreparationOperations({root:'/r',parent:'/p'},()=>{io.lstatSync('/r');return 7;},emit,{io,clock:()=>n+=5000});
 assert.equal(r.result,7);assert.equal(r.streamValid,false);
 assert.throws(()=>measurePreparationOperations({root:'/r',parent:'/p'},()=>{io.lstatSync('/r');throw Object.assign(Error('NONSECRET_OPERATION'),{code:'EPERM'});},emit,{io,clock:()=>n+=5000}),{code:'EPERM'});
});
test('a broken clock suppresses diagnostics without replacing primitive results',()=>{
 const io=fake();let calls=0;
 const r=measurePreparationOperations({root:'/r',parent:'/p'},()=>io.openSync('/r/a'),()=>{},
  {io,clock:()=>{if(calls++>0)throw Error('NONSECRET_CLOCK');return 0;}});
 assert.equal(r.result,10);assert.equal(r.clockValid,false);assert.equal(r.frames,0);
});
test('bounded frames and bytes retain no authority and invalid clocks suppress diagnostic values',()=>{
 const io=fake(),frames=[];let n=0;
 const r=measurePreparationOperations({root:'/r',parent:'/p'},()=>{for(let i=0;i<1000;i++)io.lstatSync('/r/a');},f=>frames.push(f),{io,clock:()=>n+=5000});
 assert(r.frames<=PREPARATION_DIAGNOSTIC_LIMITS.frames);assert(r.bytes<=PREPARATION_DIAGNOSTIC_LIMITS.bytes);
 assert(frames.every(f=>JSON.parse(f).scope==='PREPARATION_OPERATION_DIAGNOSTIC_ONLY'));
 const bad=[];let call=0;const invalid=measurePreparationOperations({root:'/r',parent:'/p'},()=>io.lstatSync('/r/a'),f=>bad.push(f),{io,clock:()=>call++?NaN:0});
 assert.equal(invalid.clockValid,false);assert.deepEqual(bad,[]);
});
