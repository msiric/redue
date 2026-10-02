import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
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
    cleanup(){fs.rmSync(base,{recursive:true,force:true});}};
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--config',f.config,
  '--state-dir',f.state,...args],{encoding:'utf8',cwd:f.root,timeout:30000});}
function ok(f,...args){const out=call(f,...args);
  assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}\n${out.stdout}`);return out;}
function status(f){return JSON.parse(ok(f,'status','--sync','--json').stdout);}
function row(f){return status(f).checks[0];}
function withFixture(t,options){const f=fixture(options);t.after(()=>{
  try{call(f,'stop');}catch{}try{call(f,'remove-state');}catch{}f.cleanup();});return f;}

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
