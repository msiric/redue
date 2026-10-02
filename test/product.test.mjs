import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {acquireRunLock,inspectRunLock,recoverRunLock} from '../src/run-lock.mjs';

const bin=path.resolve('bin/vstate.mjs');
const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
function put(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
function fixture(options={}){
  const base=fs.mkdtempSync('/tmp/vstate-product-'),root=path.join(base,'project'),
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
  put(path.join(root,'vstate.config.json'),JSON.stringify({schema:1,checks:[check]},null,2));
  return {base,root,state,config:path.join(root,'vstate.config.json'),
    env:{...process.env,VSTATE_HISTORY_TIMEOUT_MS:'1000',VSTATE_TEST_FAULTS:'1',
      VSTATE_START_READY_WAIT_MS:'10000',
      VSTATE_TEST_HISTORY_FAULT_FILE:path.join(state,'history-fault'),
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
function row(f){return status(f).checks[0];}
function withFixture(t,options){const f=fixture(options);t.after(()=>{
  try{call(f,'stop');}catch{}try{call(f,'remove-state');}catch{}f.cleanup();});return f;}
const events=f=>fs.readFileSync(path.join(f.state,'events.jsonl'),'utf8').trim()
  .split('\n').filter(Boolean).map(line=>JSON.parse(line));
async function until(f,predicate,limitMs=10000){const started=Date.now();
  while(Date.now()-started<limitMs){const value=status(f);
    if(predicate(value))return value;
    await new Promise(resolve=>setTimeout(resolve,80));}
  assert.fail('status did not converge: '+JSON.stringify(status(f))+
    '\nrecent events: '+JSON.stringify(events(f).slice(-20)));}
function oracle(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

test('short startup wait reports owned initialization instead of a false launch failure',async t=>{
  const f=withFixture(t);f.env.VSTATE_START_READY_WAIT_MS='100';
  const started=JSON.parse(ok(f,'start').stdout);
  assert.equal(typeof started.ready,'boolean');
  if(!started.ready)assert.equal(started.health.healthy,false);
  const usable=await until(f,value=>value.observation.healthy);
  assert.equal(usable.checks[0].freshness,'UNVERIFIED');
});

test('receipt survives unrelated changes; source, generated, installed and absence changes stale it',t=>{
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
  assert.equal(row(f).freshness,'STALE');
  assert.equal(fs.readFileSync(firstRun,'utf8'),immutable);
  assert(fs.readdirSync(path.join(f.state,'runs-v1')).length>=4);
});

test('failed outcome, caller identity, observer loss and restart remain conservative',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  const altered={...process.env,PATH:process.env.PATH+':/tmp/unrelated-vstate-bin'};
  const same=spawnSync(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{encoding:'utf8',cwd:f.root,env:altered});
  assert.equal(same.status,0);assert.equal(JSON.parse(same.stdout).checks[0].freshness,'CURRENT');
  const shadow=path.join(f.base,'shadow');put(path.join(shadow,'node'),'#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(shadow,'node'),0o755);
  const changed=spawnSync(process.execPath,[bin,'--config',f.config,'--state-dir',f.state,
    'status','--sync','--json'],{encoding:'utf8',cwd:f.root,
    env:{...process.env,PATH:shadow+':'+process.env.PATH}});
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
  fs.symlinkSync('../workspace/pkg',path.join(f.root,'node_modules/pkg'));
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].installedInputs=['node_modules/pkg/**'];
  put(f.config,JSON.stringify(config));
  const started=ok(f,'start');
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

test('healthy history fast path preserves evidence after unrelated edit',t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const first=row(f).invocation.runId;
  const before=events(f).filter(e=>e.kind==='history_query_completed').length;
  put(path.join(f.root,'notes.md'),'unrelated\n');
  const after=status(f);
  assert.equal(after.checks[0].freshness,'CURRENT');
  assert.equal(after.checks[0].invocation.runId,first);
  assert(events(f).filter(e=>e.kind==='history_query_completed').length>before);
});

for(const fault of ['hang','fail'])test(`history ${fault} falls back to deterministic reconciliation`,async t=>{
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
  put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  assert.equal((await until(f,s=>s.checks[0].freshness==='CURRENT')).checks[0].invocation.runId,runId);
  put(path.join(f.root,'notes.md'),'outside contract');assert.equal(row(f).freshness,'CURRENT');
  const installed=path.join(f.root,'node_modules/pkg/index.js');
  const old=oracle(installed);put(installed,'module.exports=9;\n');
  assert.notEqual(oracle(installed),old);
  assert.equal(row(f).freshness,'STALE');ok(f,'run','check');
  assert.equal(row(f).freshness,'CURRENT',JSON.stringify(status(f).checks[0]));
  put(path.join(f.root,'node_modules/optional/index.js'),'module.exports=1;\n');
  assert.equal(row(f).freshness,'STALE');
});

test('fresh reconciliation detects membership and linked installed-target replacement',async t=>{
  const f=withFixture(t,{absent:true});
  put(path.join(f.root,'workspace/a/index.js'),'module.exports=1;\n');
  put(path.join(f.root,'workspace/b/index.js'),'module.exports=2;\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'),{recursive:true});
  fs.symlinkSync('../workspace/a',path.join(f.root,'node_modules/pkg'));
  const config=JSON.parse(fs.readFileSync(f.config));
  config.checks[0].installedInputs=['node_modules/pkg/**','node_modules/optional/**'];
  put(f.config,JSON.stringify(config));
  ok(f,'start');ok(f,'run','check');assert.equal(row(f).freshness,'CURRENT');
  put(path.join(f.state,'drop-events'),'1');
  put(path.join(f.root,'generated/new.txt'),'new member\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'));
  fs.symlinkSync('../workspace/b',path.join(f.root,'node_modules/pkg'));
  put(path.join(f.root,'node_modules/optional/index.js'),'now present\n');
  put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  const result=await until(f,s=>s.checks[0].freshness==='STALE');
  assert.equal(result.checks[0].result,'PASS');
  assert(fs.existsSync(path.join(f.root,'generated/new.txt')));
  assert.equal(fs.readlinkSync(path.join(f.root,'node_modules/pkg')),'../workspace/b');
  assert(fs.existsSync(path.join(f.root,'node_modules/optional/index.js')));
});

test('missed deletion is found by independent fresh reconciliation',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const generated=path.join(f.root,'generated/data.txt');
  assert(fs.existsSync(generated));
  put(path.join(f.state,'drop-events'),'1');
  fs.unlinkSync(generated);assert(!fs.existsSync(generated));
  put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  const item=(await until(f,s=>s.checks[0].freshness==='STALE')).checks[0];
  assert.equal(item.result,'PASS');
  assert.match(item.reason,/generated\/data.txt changed/);
});

test('failed reconciliation stays UNVERIFIED, preserves PASS, and restart repairs it',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  put(path.join(f.state,'reconcile-fault'),'1');
  put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  const failedAt=Date.now();
  while(!events(f).some(e=>e.kind==='reconciliation_failed')&&Date.now()-failedAt<5000)
    await new Promise(resolve=>setTimeout(resolve,50));
  assert(events(f).some(e=>e.kind==='reconciliation_failed'));
  const item=row(f);assert.equal(item.freshness,'UNVERIFIED');
  assert.equal(item.result,'PASS');assert.equal(item.invocation.runId,runId);
  assert.match(item.reason,/deterministic reconciliation failed/);
  await new Promise(resolve=>setTimeout(resolve,900));
  assert.equal(events(f).filter(e=>e.kind==='reconciliation_started').length,2);
  fs.unlinkSync(path.join(f.state,'reconcile-fault'));
  fs.unlinkSync(path.join(f.state,'history-fault'));
  ok(f,'stop');ok(f,'start');
  assert.equal(row(f).freshness,'CURRENT',JSON.stringify(status(f).checks[0]));
  assert.equal(row(f).invocation.runId,runId);
});

test('hung history does not block cached status or stop',async t=>{
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

test('checkout root replacement reattaches and reconciles before retaining CURRENT',async t=>{
  const f=withFixture(t);ok(f,'start');ok(f,'run','check');
  const runId=row(f).invocation.runId;
  const moved=path.join(f.base,'old-project');
  fs.renameSync(f.root,moved);fs.cpSync(moved,f.root,{recursive:true});
  const result=await until(f,s=>s.checks[0].freshness==='CURRENT'&&
    events(f).some(e=>e.kind==='reconciliation_completed'),10000);
  assert.equal(result.checks[0].invocation.runId,runId);
  assert(events(f).some(e=>e.kind==='observation_root_replaced'));
});

test('external installed-input root replacement is reconciled',async t=>{
  const f=withFixture(t),external=path.join(f.base,'external');
  put(path.join(external,'pkg/index.js'),'module.exports=1;\n');
  fs.rmSync(path.join(f.root,'node_modules/pkg'),{recursive:true});
  fs.symlinkSync('../../external/pkg',path.join(f.root,'node_modules/pkg'));
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
