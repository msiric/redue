import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {acquireRunLock,inspectRunLock,recoverRunLock} from '../src/run-lock.mjs';
import {processAlive} from '../src/process-liveness.mjs';
import {controlEndpoint} from '../src/control-endpoint.mjs';

const bin=path.resolve('bin/redue.mjs');
const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
function put(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
const linkDir=(target,link)=>fs.symlinkSync(process.platform==='win32'?
  path.resolve(path.dirname(link),target):target,link,
  process.platform==='win32'?'junction':'dir');
function fixture(options={}){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-product-')),root=path.join(base,'project'),
    state=path.join(base,'vstate-state');
  fs.mkdirSync(root);
  put(path.join(root,'package.json'),'{"name":"vstate-public-fixture","version":"1"}\n');
  put(path.join(root,'src/input.txt'),'PASS\n');
  put(path.join(root,'generated/data.txt'),'generated-1\n');
  put(path.join(root,'node_modules/pkg/index.js'),'module.exports=1;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  put(path.join(root,'check.cjs'),options.script||
    "const fs=require('node:fs');fs.readFileSync('generated/data.txt');"+
    "fs.readFileSync('node_modules/pkg/index.js');"+
    "process.exitCode=fs.readFileSync('src/input.txt','utf8').startsWith('FAIL')?1:0;\n");
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['add','package.json','.gitignore','src','generated','check.cjs'],{cwd:root});
  const check={name:'check',command:['@node','check.cjs'],
    inputs:['src/**','check.cjs','package.json'],
    generatedInputs:['generated/**'],
    installedInputs:['node_modules/**'],
    environment:{pathExecutables:['node'],executableIdentity:true},
    coverage:Object.fromEntries(categories.map(k=>[k,true])),
    coverageReview:Object.fromEntries(categories.map(k=>[k,'reviewed fixture contract']))};
  if(options.absent)check.installedInputs.push('node_modules/optional/**');
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[check]},null,2));
  return {base,root,state,config:path.join(root,'redue.config.json'),
    env:{...process.env,VSTATE_HISTORY_TIMEOUT_MS:'1000',VSTATE_TEST_FAULTS:'1',
      VSTATE_START_READY_WAIT_MS:'10000',
      VSTATE_TEST_HISTORY_FAULT_FILE:path.join(state,'history-fault'),
      VSTATE_TEST_LINUX_GAP_FILE:path.join(state,'linux-gap'),
      VSTATE_TEST_LINUX_HANG_FILE:path.join(state,'linux-hang'),
      VSTATE_TEST_WINDOWS_GAP_FILE:path.join(state,'windows-gap'),
      VSTATE_TEST_RECONCILE_FAULT_FILE:path.join(state,'reconcile-fault'),
      VSTATE_TEST_DROP_EVENTS_FILE:path.join(state,'drop-events')},
    cleanup(){fs.rmSync(base,{recursive:true,force:true});}};
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--config',f.config,
  '--state-dir',f.state,...args],{encoding:'utf8',cwd:f.root,timeout:30000,env:f.env});}
function ok(f,...args){const out=call(f,...args);
  const log=fs.existsSync(path.join(f.state,'observer.log'))?
    fs.readFileSync(path.join(f.state,'observer.log'),'utf8').slice(-2000):'';
  assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}\n${out.stdout}\n${log}`);return out;}
function status(f){return JSON.parse(ok(f,'status','--sync','--json').stdout);}
function control(f,message){return new Promise((resolve,reject)=>{
  const client=net.createConnection(controlEndpoint(f.state).address);
  let data='';
  client.on('connect',()=>client.write(JSON.stringify(message)+'\n'));
  client.on('data',chunk=>data+=chunk);
  client.on('end',()=>{try{resolve(JSON.parse(data));}catch(error){reject(error);}});
  client.on('error',reject);
});}
function row(f){return status(f).checks[0];}
function withFixture(t,options){const f=fixture(options);t.after(()=>{
  try{call(f,'stop');}catch{}try{call(f,'remove-state');}catch{}f.cleanup();});return f;}
const events=f=>fs.readFileSync(path.join(f.state,'events.jsonl'),'utf8').trim()
  .split('\n').filter(Boolean).map(line=>JSON.parse(line));
function observationFault(f,kind='fail'){
  const target=process.platform==='linux'?'linux-gap':
    process.platform==='win32'?'windows-gap':'history-fault';
  put(path.join(f.state,target),
    process.platform==='linux'?(kind==='fail'?'inotify_overflow':kind):kind);
}
async function faultObserved(f,kind='fail'){
  const count=events(f).filter(e=>e.kind==='observation_gap').length;
  observationFault(f,kind);
  if(process.platform==='darwin'||process.platform==='win32'){status(f);return;}
  for(let n=0;n<100;n++){
    if(events(f).filter(e=>e.kind==='observation_gap').length>count)return;
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert.fail('observation fault was not reported');
}
async function until(f,predicate,limitMs=10000){const started=Date.now();
  while(Date.now()-started<limitMs){const value=status(f);
    if(predicate(value))return value;
    await new Promise(resolve=>setTimeout(resolve,80));}
  assert.fail('status did not converge: '+JSON.stringify(status(f))+
    '\nrecent events: '+JSON.stringify(events(f).slice(-20)));}
function oracle(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

test('short startup wait reports owned initialization instead of a false launch failure',async t=>{
  const f=withFixture(t);f.env.VSTATE_START_READY_WAIT_MS='100';
  const started=JSON.parse(ok(f,'start','--json').stdout);
  assert.equal(typeof started.ready,'boolean');
  if(!started.ready)assert.equal(started.health.healthy,false);
  const usable=await until(f,value=>value.observation.healthy);
  assert.equal(usable.checks[0].freshness,'UNVERIFIED');
});

test('Windows prelaunch checkpoint incorporates delivered input events without claiming synchronized CURRENT',
  {skip:process.platform!=='win32'},async t=>{
    const f=withFixture(t);ok(f,'start');
    const first=await control(f,{action:'snapshot',name:'check'});
    assert(first.snapshots?.check?.observationHealthy);
    put(path.join(f.root,'src/input.txt'),'PASS changed before command launch\n');
    let later;
    for(let n=0;n<100;n++){
      later=await control(f,{action:'prelaunch',name:'check'});
      if(later.snapshots?.check?.revision!==first.snapshots.check.revision)break;
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    assert.notEqual(later.snapshots?.check?.revision,first.snapshots.check.revision);
    assert.equal(later.checks[0].freshness,'UNVERIFIED');
    ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  });

test('receipt survives unrelated changes; source, generated, installed and absence changes stale it',async t=>{
  const f=withFixture(t,{absent:true});ok(f,'start');ok(f,'run','check');
  const first=row(f);assert.equal(first.freshness,'CURRENT');
  const firstRun=path.join(f.state,'runs-v1',first.invocation.runId+'.json');
  const immutable=fs.readFileSync(firstRun,'utf8');
  put(path.join(f.root,'notes.md'),'unrelated');assert.equal(row(f).freshness,'CURRENT');
  put(path.join(f.root,'src/input.txt'),'PASS changed\n');
  assert.match(row(f).reason,/src\/input.txt changed/);
  assert.equal(row(f).result,'PASS');ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  put(path.join(f.root,'generated/data.txt'),'generated-2\n');
  assert.equal(row(f).freshness,'STALE');ok(f,'run','check');
  put(path.join(f.root,'node_modules/pkg/index.js'),'module.exports=2;\n');
  assert.equal(row(f).freshness,'STALE');ok(f,'run','check');
  put(path.join(f.root,'node_modules/optional/index.js'),'module.exports=1;\n');
  assert.equal((await until(f,s=>s.checks[0].freshness==='STALE')).checks[0].freshness,'STALE');
  assert.equal(fs.readFileSync(firstRun,'utf8'),immutable);
  assert(fs.readdirSync(path.join(f.state,'runs-v1')).length>=4);
});

test('failed outcome, caller identity, observer loss and restart remain conservative',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  const altered={...process.env,PATH:process.env.PATH+path.delimiter+
    path.join(f.base,'unrelated-bin')};
  const same=spawnSync(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{encoding:'utf8',cwd:f.root,env:altered});
  assert.equal(same.status,0);assert.equal(JSON.parse(same.stdout).checks[0].freshness,'CURRENT');
  const shadow=path.join(f.base,'shadow'),shadowNode=path.join(shadow,
    process.platform==='win32'?'node.cmd':'node');
  put(shadowNode,process.platform==='win32'?'@echo off\r\nexit /b 0\r\n':
    '#!/bin/sh\nexit 0\n');
  fs.chmodSync(shadowNode,0o755);
  const changed=spawnSync(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{encoding:'utf8',cwd:f.root,
    env:{...process.env,PATH:shadow+path.delimiter+process.env.PATH}});
  assert.equal(changed.status,0);
  assert.equal(JSON.parse(changed.stdout).checks[0].freshness,'STALE');
  ok(f,'stop');const unavailable=JSON.parse(ok(f,'status','--json').stdout);
  assert.equal(unavailable.checks[0].freshness,'UNVERIFIED');
  ok(f,'start');assert.equal(row(f).freshness,'CURRENT');
  assert.equal(row(f).invocation.runId,runId);
  put(path.join(f.root,'src/input.txt'),'FAIL\n');
  assert.equal(call(f,'run','check').status,1);
  const failed=row(f);assert.equal(failed.result,'FAIL');
  assert.equal(failed.freshness,'CURRENT');assert.equal(status(f).state,'failed');
  put(path.join(f.root,'src/input.txt'),'PASS\n');
  assert.equal(row(f).freshness,'STALE');assert.equal(row(f).result,'FAIL');
});

test('changes during execution cannot yield CURRENT',t=>{
  const f=withFixture(t,{script:"const fs=require('node:fs');"+
    "fs.writeFileSync('src/input.txt','changed during execution\\n');"+
    "setTimeout(()=>{},300);\n"});
  ok(f,'start');ok(f,'run','check');
  const receipt=JSON.parse(fs.readFileSync(path.join(f.state,'receipts-v1.json'))).checks.check;
  assert.equal(receipt.result,'PASS');assert.equal(receipt.stable,false);
  assert.notEqual(row(f).freshness,'CURRENT');
});

test('abandoned lock is reclaimed only before child launch; cleanup preserves project storage',t=>{
  const f=withFixture(t);ok(f,'start');
  const lock=acquireRunLock(f.state);assert.equal(inspectRunLock(f.state).state,'live');
  assert.throws(()=>acquireRunLock(f.state),/live/);lock.release();
  const dir=path.join(f.state,'run.lock');fs.mkdirSync(dir);
  put(path.join(dir,'owner.json'),JSON.stringify({schema:1,token:'old',pid:2147483647,
    phase:'running',childPid:process.pid}));
  assert.equal(inspectRunLock(f.state).state,'uncertain');
  assert.throws(()=>acquireRunLock(f.state),/uncertain/);
  put(path.join(dir,'owner.json'),JSON.stringify({schema:1,token:'old',pid:2147483647,
    phase:'prepared',childPid:null}));
  const replacement=acquireRunLock(f.state);replacement.release();
  assert.equal(inspectRunLock(f.state).state,'absent');
  ok(f,'remove-state');assert(fs.existsSync(path.join(f.root,'node_modules/pkg/index.js')));
  assert(!fs.existsSync(f.state));
});

test('incomplete coverage records PASS without reusable CURRENT',t=>{
  const f=withFixture(t);const file=f.config,config=JSON.parse(fs.readFileSync(file));
  delete config.checks[0].coverage.runtime;
  delete config.checks[0].coverageReview.runtime;
  put(file,JSON.stringify(config));ok(f,'start');ok(f,'run','check');
  const item=row(f);assert.equal(item.result,'PASS');
  assert.equal(item.freshness,'UNVERIFIED');assert.equal(item.reuse_eligible,false);
});

test('linked installed target content is observed through its logical declaration',t=>{
  const f=withFixture(t);
  fs.mkdirSync(path.join(f.root,'workspace','pkg'),{recursive:true});
  put(path.join(f.root,'workspace/pkg/index.js'),'module.exports=1;\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'),{recursive:true});
  linkDir('../workspace/pkg',path.join(f.root,'node_modules/pkg'));
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].installedInputs=['node_modules/pkg/**'];
  put(f.config,JSON.stringify(config));
  const started=ok(f,'start','--json');
  assert.equal(JSON.parse(started.stdout).ready,true,
    started.stdout+'\n'+call(f,'status','--json').stdout+'\n'+
    fs.readFileSync(path.join(f.state,'events.jsonl'),'utf8'));
  ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  put(path.join(f.root,'workspace/pkg/index.js'),'module.exports=2;\n');
  assert.equal(row(f).freshness,'STALE');
  assert(fs.existsSync(path.join(f.root,'workspace/pkg/index.js')));
});

test('incompatible receipt schema withholds CURRENT and explains the state error',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  ok(f,'stop');
  put(path.join(f.state,'receipts-v1.json'),JSON.stringify({schema:99,checks:{}}));
  ok(f,'start');const item=row(f);
  assert.equal(item.freshness,'UNVERIFIED');
  assert.match(item.reason,/incompatible receipt state/);
});

test('configuration change cannot reuse old plan; stop remains available',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  assert.equal(row(f).freshness,'CURRENT');
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].inputs.push('notes.md');
  put(f.config,JSON.stringify(config));
  const outdated=call(f,'status','--sync','--json');
  assert.equal(outdated.status,2);
  assert.match(outdated.stderr,/config changed/);
  ok(f,'stop');ok(f,'start');
  assert.equal(row(f).freshness,'STALE');
  assert.match(row(f).reason,/input plan changed/);
});

test('change while observer is stopped is reconciled before CURRENT returns',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  assert.equal(row(f).freshness,'CURRENT');
  ok(f,'stop');put(path.join(f.root,'src/input.txt'),'PASS after downtime\n');
  ok(f,'start');const item=row(f);
  assert.equal(item.result,'PASS');assert.equal(item.freshness,'STALE');
  assert.match(item.reason,/src\/input.txt changed/);
});

test('healthy history fast path preserves evidence after unrelated edit',
  {skip:process.platform!=='darwin'},t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const first=row(f).invocation.runId;
  const before=events(f).filter(e=>e.kind==='history_query_completed').length;
  put(path.join(f.root,'notes.md'),'unrelated\n');
  const after=status(f);
  assert.equal(after.checks[0].freshness,'CURRENT');
  assert.equal(after.checks[0].invocation.runId,first);
  assert(events(f).filter(e=>e.kind==='history_query_completed').length>before);
});

for(const fault of ['hang','fail'])test(`history ${fault} falls back to deterministic reconciliation`,
  {skip:process.platform!=='darwin'},async t=>{
  const f=withFixture(t,{absent:true});ok(f,'start');ok(f,'run','check');
  const original=row(f).invocation.runId;
  put(path.join(f.state,'history-fault'),fault);
  const uncertain=status(f);
  assert.equal(uncertain.checks[0].freshness,'UNVERIFIED');
  assert.equal(uncertain.checks[0].result,'PASS');
  // Suppress test notifications to model a missed edit during the gap. The
  // independent file oracle, rather than the old index, establishes change.
  put(path.join(f.state,'drop-events'),'1');
  const source=path.join(f.root,'src/input.txt');
  const before=oracle(source);put(source,'PASS after missed edit\n');
  assert.notEqual(oracle(source),before);
  const recovered=await until(f,s=>s.checks[0].freshness==='STALE');
  assert.equal(recovered.checks[0].invocation.runId,original);
  assert.match(recovered.checks[0].reason,/src\/input.txt changed/);
  assert(events(f).some(e=>e.kind==='reconciliation_completed'));
  const count=events(f).filter(e=>e.kind==='history_timeout').length;
  for(let n=0;n<3;n++)status(f);
  assert.equal(events(f).filter(e=>e.kind==='history_timeout').length,count);
});

test('reconciliation preserves unchanged and unrelated inputs, then detects installed and absent inputs',async t=>{
  const f=withFixture(t,{absent:true});ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  await faultObserved(f);
  if(process.platform==='darwin')assert.equal(row(f).freshness,'UNVERIFIED');
  assert.equal((await until(f,s=>s.checks[0].freshness==='CURRENT')).checks[0].invocation.runId,runId);
  put(path.join(f.root,'notes.md'),'outside contract');assert.equal(row(f).freshness,'CURRENT');
  const installed=path.join(f.root,'node_modules/pkg/index.js');
  const old=oracle(installed);put(installed,'module.exports=9;\n');
  assert.notEqual(oracle(installed),old);
  assert.equal(row(f).freshness,'STALE');ok(f,'run','check');
  assert.equal(row(f).freshness,'CURRENT',JSON.stringify(status(f).checks[0]));
  put(path.join(f.root,'node_modules/optional/index.js'),'module.exports=1;\n');
  assert.equal((await until(f,s=>s.checks[0].freshness==='STALE')).checks[0].freshness,'STALE');
});

test('disabled macOS history requires a fresh checkpoint even after successful recovery',
  {skip:process.platform!=='darwin'},async t=>{
    const f=withFixture(t);ok(f,'start');ok(f,'run','check');
    const original=row(f).invocation.runId;
    await faultObserved(f);
    await until(f,s=>s.checks[0].freshness==='CURRENT');
    // Model an event not delivered before the decision, deterministically.
    put(path.join(f.state,'drop-events'),'1');
    put(path.join(f.root,'notes.md'),'unrelated');
    assert.equal(row(f).freshness,'CURRENT');
    const file=path.join(f.root,'node_modules/pkg/index.js'),before=oracle(file);
    put(file,'module.exports=11;\n');assert.notEqual(oracle(file),before);
    const result=row(f);assert.equal(result.freshness,'STALE');
    assert.equal(result.result,'PASS');assert.equal(result.invocation.runId,original);
  });

test('fresh reconciliation detects membership and linked installed-target replacement',async t=>{
  const f=withFixture(t,{absent:true});
  put(path.join(f.root,'workspace/a/index.js'),'module.exports=1;\n');
  put(path.join(f.root,'workspace/b/index.js'),'module.exports=2;\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'),{recursive:true});
  linkDir('../workspace/a',path.join(f.root,'node_modules/pkg'));
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].installedInputs=['node_modules/pkg/**','node_modules/optional/**'];
  put(f.config,JSON.stringify(config));
  ok(f,'start');ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  put(path.join(f.state,'drop-events'),'1');
  put(path.join(f.root,'generated/new.txt'),'new member\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'));
  linkDir('../workspace/b',path.join(f.root,'node_modules/pkg'));
  put(path.join(f.root,'node_modules/optional/index.js'),'now present\n');
  if(process.platform==='darwin'){
    await faultObserved(f);
    assert.equal(row(f).freshness,'UNVERIFIED');
  }
  const result=await until(f,s=>s.checks[0].freshness==='STALE');
  assert.equal(result.checks[0].result,'PASS');
  assert(fs.existsSync(path.join(f.root,'generated/new.txt')));
  assert.equal(fs.realpathSync(path.join(f.root,'node_modules/pkg')),
    fs.realpathSync(path.join(f.root,'workspace/b')));
  assert(fs.existsSync(path.join(f.root,'node_modules/optional/index.js')));
});

test('missed deletion is found by independent fresh reconciliation',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const generated=path.join(f.root,'generated/data.txt');
  assert(fs.existsSync(generated));
  put(path.join(f.state,'drop-events'),'1');
  fs.unlinkSync(generated);assert(!fs.existsSync(generated));
  await faultObserved(f);
  if(process.platform==='darwin')assert.equal(row(f).freshness,'UNVERIFIED');
  const item=(await until(f,s=>s.checks[0].freshness==='STALE')).checks[0];
  assert.equal(item.result,'PASS');
  assert.match(item.reason,/generated\/data.txt changed/);
});

test('failed reconciliation stays UNVERIFIED, preserves PASS, and restart repairs it',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  put(path.join(f.state,'reconcile-fault'),'1');
  await faultObserved(f);
  if(process.platform==='darwin')assert.equal(row(f).freshness,'UNVERIFIED');
  const failedAt=Date.now();
  while(!events(f).some(e=>e.kind==='reconciliation_failed')&&Date.now()-failedAt<5000)
    await new Promise(resolve=>setTimeout(resolve,50));
  assert(events(f).some(e=>e.kind==='reconciliation_failed'));
  // A synchronized query would itself start another Windows reconciliation.
  // Inspect the cached state to assert the completed failed attempt, while
  // permitting a second bounded recovery attempt to be in progress.
  let item;
  const failureReason=process.platform==='win32'?
    /(?:deterministic reconciliation failed|plan unavailable: injected reconciliation failure)/:
    /deterministic reconciliation failed/;
  for(let n=0;n<100;n++){
    item=JSON.parse(ok(f,'status','--json').stdout).checks[0];
    assert.equal(item.freshness,'UNVERIFIED');
    assert.equal(item.result,'PASS');assert.equal(item.invocation.runId,runId);
    if(failureReason.test(item.reason||''))break;
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert.match(item.reason,failureReason);
  await new Promise(resolve=>setTimeout(resolve,900));
  assert.equal(events(f).filter(e=>e.kind==='reconciliation_started').length,2);
  fs.unlinkSync(path.join(f.state,'reconcile-fault'));
  if(process.platform==='darwin')fs.unlinkSync(path.join(f.state,'history-fault'));
  ok(f,'stop');ok(f,'start');
  assert.equal(row(f).freshness,'CURRENT',JSON.stringify(status(f).checks[0]));
  assert.equal(row(f).invocation.runId,runId);
});

test('hung history does not block cached status or stop',
  {skip:process.platform!=='darwin'},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  put(path.join(f.state,'history-fault'),'hang');
  const child=spawn(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{cwd:f.root,env:f.env,stdio:'ignore'});
  await new Promise(resolve=>setTimeout(resolve,60));
  const began=performance.now();
  assert.equal(JSON.parse(ok(f,'status','--json').stdout).checks[0].result,'PASS');
  ok(f,'stop');
  assert(performance.now()-began<2500,'stop/status blocked by native history');
  await new Promise(resolve=>child.once('exit',resolve));
  assert.equal(JSON.parse(ok(f,'status','--json').stdout).checks[0].freshness,'UNVERIFIED');
});

test('Linux overflow, watch loss, and watch exhaustion withhold CURRENT then reconcile',
  {skip:process.platform!=='linux'},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  for(const cause of ['inotify_overflow','inotify_watch_lost','inotify_watch_add_failed']){
    await faultObserved(f,cause);
    const gap=events(f).findLast(e=>e.kind==='observation_gap');
    assert.equal(gap.classification,cause);
    const recovered=await until(f,s=>s.checks[0].freshness==='CURRENT'&&
      events(f).some(e=>e.kind==='reconciliation_completed'&&e.classification===cause));
    assert.equal(recovered.checks[0].invocation.runId,runId);
  }
});

test('Linux hung synchronization leaves cached status and stop responsive',
  {skip:process.platform!=='linux'},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  put(path.join(f.state,'linux-hang'),'1');
  const sync=spawn(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{cwd:f.root,env:f.env,stdio:'ignore'});
  await new Promise(resolve=>setTimeout(resolve,100));
  const began=performance.now();
  assert.equal(JSON.parse(ok(f,'status','--json').stdout).checks[0].result,'PASS');
  ok(f,'stop');
  assert(performance.now()-began<2500,'stop/status blocked by Linux observer barrier');
  await new Promise(resolve=>sync.once('exit',resolve));
  assert.equal(JSON.parse(ok(f,'status','--json').stdout).checks[0].freshness,'UNVERIFIED');
});

test('Linux cancellation reaches verification descendants and leaves no run lock',
  {skip:process.platform!=='linux'},async t=>{
  const f=withFixture(t,{script:"const cp=require('node:child_process'),fs=require('node:fs');"+
    "const child=cp.spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});"+
    "fs.writeFileSync('pids.json',JSON.stringify({leader:process.pid,descendant:child.pid}));"+
    "setInterval(()=>{},1000);\n"});
  ok(f,'start');
  const wrapper=spawn(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'run','check'],{cwd:f.root,env:f.env,stdio:'ignore'});
  t.after(()=>{try{wrapper.kill('SIGKILL');}catch{}});
  const pidsFile=path.join(f.root,'pids.json');
  for(let n=0;n<100&&!fs.existsSync(pidsFile);n++)
    await new Promise(resolve=>setTimeout(resolve,25));
  assert(fs.existsSync(pidsFile),'verification command did not launch');
  const pids=JSON.parse(fs.readFileSync(pidsFile));
  wrapper.kill('SIGTERM');
  const exited=await new Promise(resolve=>wrapper.once('exit',resolve));
  assert.equal(exited,143);
  const running=pid=>{try{
    const state=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(' ')[2];
    return state!=='Z'&&state!=='X';
  }catch{return false;}};
  for(let n=0;n<100&&(running(pids.leader)||running(pids.descendant));n++)
    await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(running(pids.leader),false);
  assert.equal(running(pids.descendant),false);
  assert.equal(inspectRunLock(f.state).state,'absent');
  const result=row(f);assert.equal(result.freshness,'UNVERIFIED');
  assert.equal(result.invocation.status,'interrupted');
});

test('Linux killed wrapper preserves an uncertain lock while child work survives',
  {skip:process.platform!=='linux'},async t=>{
  const f=withFixture(t,{script:"const cp=require('node:child_process'),fs=require('node:fs');"+
    "const child=cp.spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});"+
    "fs.writeFileSync('pids.json',JSON.stringify({leader:process.pid,descendant:child.pid}));"+
    "setInterval(()=>{},1000);\n"});
  ok(f,'start');
  const outer=spawn(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'run','check'],{cwd:f.root,env:f.env,stdio:'ignore'});
  let pids=null,owner=null;
  t.after(()=>{
    if(pids)try{process.kill(-pids.leader,'SIGKILL');}catch{}
    if(owner)try{process.kill(owner,'SIGKILL');}catch{}
    try{outer.kill('SIGKILL');}catch{}
  });
  for(let n=0;n<100;n++){
    const file=path.join(f.root,'pids.json');
    if(fs.existsSync(file)){pids=JSON.parse(fs.readFileSync(file));break;}
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert(pids,'verification command did not launch');
  owner=inspectRunLock(f.state).owner.pid;
  process.kill(owner,'SIGKILL');
  await new Promise(resolve=>outer.once('exit',resolve));
  assert.equal(inspectRunLock(f.state).state,'uncertain');
  process.kill(-pids.leader,'SIGTERM');
  const running=pid=>{try{
    return !['Z','X'].includes(fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(' ')[2]);
  }catch{return false;}};
  for(let n=0;n<100&&(running(pids.leader)||running(pids.descendant));n++)
    await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(running(pids.leader),false);
  assert.equal(running(pids.descendant),false);
  assert.equal(inspectRunLock(f.state).state,'uncertain');
  assert.equal(recoverRunLock(f.state,true).recovered,true);
  assert.equal(inspectRunLock(f.state).state,'absent');
});

test('Linux XDG state and case-sensitive Unicode paths keep cleanup scoped',
  {skip:process.platform!=='linux'},t=>{
  const f=fixture(),renamed=path.join(f.base,'project space-é');
  fs.renameSync(f.root,renamed);f.root=renamed;f.config=path.join(renamed,'redue.config.json');
  const xdg=path.join(f.base,'xdg-state');fs.mkdirSync(xdg);
  const invoke=(...args)=>spawnSync(process.execPath,[bin,'--config',f.config,...args],
    {encoding:'utf8',cwd:renamed,timeout:30000,env:{...f.env,XDG_STATE_HOME:xdg}});
  const start=invoke('start');assert.equal(start.status,0,start.stderr);
  t.after(()=>{invoke('stop');invoke('remove-state');f.cleanup();});
  const owned=path.join(xdg,'vstate');
  assert.equal(fs.readdirSync(owned).length,1);
  assert.equal(invoke('run','check').status,0);
  const fresh=()=>JSON.parse(invoke('status','--sync','--json').stdout).checks[0];
  assert.equal(fresh().freshness,'CURRENT');
  put(path.join(renamed,'src/Input.txt'),'unrelated case\n');
  const config=JSON.parse(fs.readFileSync(f.config));
  // The declared fixture glob includes both spellings, so the different-case
  // creation must stale it on a case-sensitive Linux filesystem.
  assert(config.checks[0].inputs.includes('src/**'));
  assert.equal(fresh().freshness,'STALE');
  assert(fs.existsSync(path.join(renamed,'src/input.txt')));
  assert(fs.existsSync(path.join(renamed,'src/Input.txt')));
  assert.equal(invoke('remove-state').status,0);
  assert(fs.existsSync(path.join(renamed,'src/Input.txt')));
  assert.equal(fs.readdirSync(owned).length,0);
});

test('Linux inaccessible declared input withholds CURRENT until reconciliation',
  {skip:process.platform!=='linux'||process.getuid?.()===0},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  const input=path.join(f.root,'src/input.txt');
  fs.chmodSync(input,0o000);
  const uncertain=await until(f,s=>s.checks[0].freshness==='UNVERIFIED');
  assert.equal(uncertain.checks[0].result,'PASS');
  assert.equal(uncertain.checks[0].invocation.runId,runId);
  fs.chmodSync(input,0o644);
  ok(f,'stop');ok(f,'start');
  assert.equal(row(f).freshness,'CURRENT');
});

test('Linux atomic replacement and delete/recreate change the declared input',
  {skip:process.platform!=='linux'},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const input=path.join(f.root,'src/input.txt');
  const old=oracle(input),replacement=path.join(f.root,'src/input.tmp');
  put(replacement,'PASS atomic replacement\n');
  fs.renameSync(replacement,input);
  assert.notEqual(oracle(input),old);
  assert.equal((await until(f,s=>s.checks[0].freshness==='STALE')).checks[0].result,'PASS');
  ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  fs.unlinkSync(input);
  assert.equal((await until(f,s=>s.checks[0].freshness==='STALE')).checks[0].result,'PASS');
  put(input,'PASS recreated\n');
  assert.equal(row(f).freshness,'STALE');
  ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
});

test('Linux/Windows daemon crash with a missed edit reconciles the historical receipt',
  {skip:!['linux','win32'].includes(process.platform)},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const prior=row(f);assert.equal(prior.freshness,'CURRENT');
  const pid=Number(fs.readFileSync(path.join(f.state,'observer.lock','pid'),'utf8'));
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,100));
  const down=JSON.parse(ok(f,'status','--json').stdout).checks[0];
  assert.equal(down.freshness,'UNVERIFIED');assert.equal(down.result,'PASS');
  put(path.join(f.root,'src/input.txt'),'PASS after daemon crash\n');
  ok(f,'start');
  const recovered=await until(f,s=>s.observation.healthy&&
    s.checks[0].freshness==='STALE');
  assert.equal(recovered.checks[0].invocation.runId,prior.invocation.runId);
  assert.match(recovered.checks[0].reason,/src\/input.txt changed/);
});

test('checkout root replacement reattaches and reconciles before retaining CURRENT',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'stop');
  // Retain the real child handle in this stress harness so native exit codes
  // and signals are observable even if JS cannot write its final event.
  const logFd=fs.openSync(path.join(f.state,'observer.log'),'a');
  const daemon=spawn(process.execPath,[path.resolve('src/daemon.mjs'),
    path.join(f.state,'project-runtime-v1.json')],{cwd:os.tmpdir(),env:f.env,
    stdio:['ignore',logFd,logFd]});fs.closeSync(logFd);
  let exited=null;daemon.on('exit',(code,signal)=>{exited={code,signal,at:Date.now()};});
  t.after(()=>{try{call(f,'stop');}catch{};if(daemon.exitCode===null)daemon.kill();});
  for(let n=0;n<100;n++){
    const cached=JSON.parse(ok(f,'status','--json').stdout);
    if(cached.observation.healthy)break;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  ok(f,'run','check');
  const runId=row(f).invocation.runId;
  for(let iteration=0;iteration<Number(process.env.REDUE_ROOT_STRESS||1);iteration++){
  const moved=path.join(f.base,'old-project-'+iteration);
  const before=events(f).length;
  fs.renameSync(f.root,moved);fs.cpSync(moved,f.root,{recursive:true});
  let result;
  try{result=await until(f,s=>s.observation.healthy&&
      s.checks[0].freshness==='CURRENT'&&
      // Windows may first fail an asynchronous recovery attempt and then
      // establish the same deterministic state through a decision-grade read.
      // Require a rebuilt plan after root replacement, not one event label.
      (()=>{const history=events(f).slice(before),at=history.findLastIndex(e=>
        e.kind==='observation_root_replaced');
        return at>=0&&history.slice(at+1).some(e=>e.kind==='plan_rebuilt');})(),10000);}
  catch(error){
    const pidFile=path.join(f.state,'observer.lock','pid');
    const pid=fs.existsSync(pidFile)?Number(fs.readFileSync(pidFile)):null;
    const log=fs.readFileSync(path.join(f.state,'observer.log'),'utf8').slice(-4000);
    throw Error(`root iteration ${iteration}: ${error.message}\nobserver alive: ${pid&&processAlive(pid)}\n`+
      `child exit: ${JSON.stringify(exited)}\nrecent events: ${JSON.stringify(events(f).slice(-12))}\nobserver log: ${log}`);
  }
  assert.equal(result.checks[0].invocation.runId,runId);
  assert(events(f).some(e=>e.kind==='observation_root_replaced'));
  fs.rmSync(moved,{recursive:true});
  }
});

test('external installed-input root replacement is reconciled',async t=>{
  const f=withFixture(t),external=path.join(f.base,'external');
  put(path.join(external,'pkg/index.js'),'module.exports=1;\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'),{recursive:true});
  linkDir('../../external/pkg',path.join(f.root,'node_modules/pkg'));
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].installedInputs=['node_modules/pkg/**'];
  config.checks[0].allowedExternalRoots=[external];
  put(f.config,JSON.stringify(config));
  ok(f,'start');ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  const moved=path.join(f.base,'old-external');
  fs.renameSync(external,moved);fs.cpSync(moved,external,{recursive:true});
  const item=(await until(f,s=>s.checks[0].freshness==='CURRENT'&&
    events(f).some(e=>e.kind==='reconciliation_completed'),10000)).checks[0];
  assert.equal(item.result,'PASS');
  assert(events(f).some(e=>e.kind==='external_observation_root_replaced'||
    e.kind==='observation_gap'));
  assert(fs.existsSync(path.join(external,'pkg/index.js')));
});


test('Windows missing control after dead daemon reconciles once without losing historical result',
  {skip:process.platform!=='win32'},async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const prior=row(f),pid=Number(fs.readFileSync(path.join(f.state,'observer.lock','pid')));
  process.kill(pid,'SIGKILL');await new Promise(resolve=>setTimeout(resolve,200));
  put(path.join(f.root,'src/input.txt'),'PASS changed while unavailable');
  const item=row(f);assert.equal(item.freshness,'STALE');assert.equal(item.result,'PASS');
  assert.equal(item.invocation.runId,prior.invocation.runId);
  assert(events(f).some(e=>e.kind==='control_connection_unavailable'&&e.alive===false));
});


test('explicit owned-state stop and removal work after the checkout is deleted',async t=>{
  const f=fixture();t.after(()=>f.cleanup());ok(f,'start');ok(f,'run','check');
  const pid=Number(fs.readFileSync(path.join(f.state,'observer.lock','pid')));
  fs.rmSync(f.root,{recursive:true});
  for(const command of ['stop','remove-state']){
    const result=spawnSync(process.execPath,[bin,'--state-dir',f.state,command],
      {cwd:os.tmpdir(),env:f.env,encoding:'utf8',timeout:15000});
    assert.equal(result.status,0,result.stderr);
  }
  assert(!fs.existsSync(f.state));
  for(let n=0;n<60&&processAlive(pid);n++)await new Promise(resolve=>setTimeout(resolve,50));
  assert(!processAlive(pid));
});


test('Windows replacement after failed recovery and successful sync starts a new bounded recovery',
  {skip:process.platform!=='win32'},async t=>{
  const f=withFixture(t);f.env.VSTATE_TEST_RECOVERY_FINALIZE_FAULT=path.join(f.state,'finalize-fault');
  ok(f,'start');ok(f,'run','check');const receipt=row(f).invocation.runId;
  put(f.env.VSTATE_TEST_RECOVERY_FINALIZE_FAULT,'fail');
  fs.renameSync(f.root,path.join(f.base,'first-root'));
  fs.cpSync(path.join(f.base,'first-root'),f.root,{recursive:true});
  for(let n=0;n<150;n++){
    if(events(f).filter(e=>e.kind==='reconciliation_failed').length>=2)break;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert(events(f).filter(e=>e.kind==='reconciliation_failed').length>=2);
  fs.unlinkSync(f.env.VSTATE_TEST_RECOVERY_FINALIZE_FAULT);
  const restored=await until(f,s=>s.checks[0].freshness==='CURRENT');
  assert.equal(restored.checks[0].invocation.runId,receipt);
  const gaps=events(f).filter(e=>e.kind==='observation_root_replaced').length;
  fs.renameSync(f.root,path.join(f.base,'second-root'));
  fs.cpSync(path.join(f.base,'second-root'),f.root,{recursive:true});
  const again=await until(f,s=>s.checks[0].freshness==='CURRENT'&&
    events(f).filter(e=>e.kind==='observation_root_replaced').length>gaps);
  assert.equal(again.checks[0].invocation.runId,receipt);
});


test('a completed scan cannot publish CURRENT while recovery is still finalizing',async t=>{
  const f=withFixture(t);f.env.VSTATE_TEST_RECOVERY_FINISH_DELAY='1500';
  ok(f,'start');ok(f,'run','check');const receipt=row(f).invocation.runId;
  await faultObserved(f);
  let finishing=false;
  for(let n=0;n<100;n++){
    const metrics=await control(f,{action:'metrics'});
    if(metrics.recovering&&metrics.metrics.planPhase==='ready'){finishing=true;break;}
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert(finishing,'did not reach the deterministic finalization boundary');
  const cached=JSON.parse(ok(f,'status','--json').stdout);
  assert.equal(cached.observation.healthy,false);
  assert.equal(cached.checks[0].freshness,'UNVERIFIED');
  const synchronized=status(f);assert.equal(synchronized.checks[0].freshness,'UNVERIFIED');
  assert.equal(synchronized.checks[0].result,'PASS');
  const recovered=await until(f,s=>s.checks[0].freshness==='CURRENT');
  assert.equal(recovered.checks[0].invocation.runId,receipt);
});
