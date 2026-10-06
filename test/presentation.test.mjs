import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {renderStatus,renderExplain,renderRun} from '../src/presentation.mjs';
import {readCachedStatus} from '../src/cached-state.mjs';
import {atomicJson,receiptRevision,readReceiptSnapshot} from '../src/state-store.mjs';

test('presentation keeps outcome, applicability and reuse separate',()=>{
  const row={name:'typecheck',result:'PASS',freshness:'CURRENT',reuse_eligible:true,
    reason:'declared inputs match',changed_inputs:[]};
  const state={state:'current',observation:{healthy:true},checks:[row]};
  assert.match(renderStatus(state),/✓ typecheck  CURRENT \/ PASS/);
  row.freshness='STALE';row.reuse_eligible=false;row.changed_inputs=['src/main.ts'];
  row.reason='src/main.ts changed';
  assert.match(renderStatus(state),/⚠ typecheck  STALE \/ PASS/);
  assert.match(renderExplain(state,'typecheck'),/Relevant inputs changed:\n  src\/main.ts/);
  row.result='FAIL';
  assert.match(renderStatus(state),/✗ typecheck  FAILED \/ FAIL/);
  assert.match(renderExplain(state),/Historical failure; applicability: STALE/);
  row.freshness='UNVERIFIED';row.reason='execution environment context not supplied';
  assert.match(renderStatus(state),/Cached status cannot confirm/);
  assert.doesNotMatch(renderStatus(state),/✓/);
  assert.match(renderRun({check:'test',result:'PASS',invocation:'exited',coverage_qualified:false}),
    /PASS recorded\.[\s\S]*UNVERIFIED/);
});

test('ambient reader preserves outcomes but never expired or dead-observer CURRENT',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-cached-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const checks=[{name:'typecheck'}],now=Date.now();
  atomicJson(path.join(dir,'receipts-v1.json'),{schema:1,checks:{typecheck:{result:'PASS',
    invocation:{runId:'historical'}}}});
  const cache={schema:1,state:'current',current:1,updated_at:now,expires_at:now+2500,
    receipt_revision:receiptRevision(dir),
    pid:process.pid,observation:{healthy:true},checks:[{name:'typecheck',result:'PASS',
      freshness:'CURRENT',reuse_eligible:true,invocation:{runId:'historical'}}]};
  const save=()=>fs.writeFileSync(path.join(dir,'status.json'),JSON.stringify(cache));
  save();assert.equal(readCachedStatus(dir,checks).checks[0].freshness,'CURRENT');
  for(const patch of [{updated_at:now-10000,expires_at:now-1},
    {updated_at:now+10000,expires_at:now+11000},
    {updated_at:now,expires_at:now+100000},
    {updated_at:now,expires_at:now+2500,pid:2147483647}]) {
    Object.assign(cache,patch);save();const row=readCachedStatus(dir,checks).checks[0];
    assert.equal(row.freshness,'UNVERIFIED');assert.equal(row.result,'PASS');
    assert.equal(row.invocation.runId,'historical');assert.equal(row.reuse_eligible,false);
  }
  fs.unlinkSync(path.join(dir,'status.json'));
  assert.equal(readCachedStatus(dir,checks).checks[0].result,'PASS');
});

test('cached status detects later outcomes without IPC and rejects legacy or unreadable selection',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-cached-receipt-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'receipts-v1.json'),checks=[{name:'typecheck'}];
  atomicJson(file,{schema:1,checks:{typecheck:{result:'PASS',invocation:{runId:'old'}}}});
  const now=Date.now(),cache={schema:1,state:'current',current:1,updated_at:now,expires_at:now+2500,
    receipt_revision:receiptRevision(dir),pid:process.pid,observation:{healthy:true},
    checks:[{name:'typecheck',result:'PASS',freshness:'CURRENT',reuse_eligible:true,invocation:{runId:'old'}}]};
  const save=()=>atomicJson(path.join(dir,'status.json'),cache);
  save();assert.equal(readCachedStatus(dir,checks).checks[0].reuse_eligible,true);
  atomicJson(file,{schema:1,checks:{typecheck:{result:'FAIL',invocation:{runId:'new'},stable:false}}});
  let value=readCachedStatus(dir,checks),row=value.checks[0];
  assert.equal(row.result,'FAIL');assert.equal(row.invocation.runId,'new');
  assert.equal(row.freshness,'UNVERIFIED');assert.equal(row.reuse_eligible,false);
  assert.equal(value.observed_failed,1);
  delete cache.receipt_revision;save();row=readCachedStatus(dir,checks).checks[0];
  assert.equal(row.result,'FAIL');assert.equal(row.freshness,'UNVERIFIED');
  fs.writeFileSync(file,'malformed');row=readCachedStatus(dir,checks).checks[0];
  assert.equal(row.result,'PASS');assert.equal(row.invocation.runId,'old');
  assert.equal(row.reuse_eligible,false);assert.match(row.reason,/latest receipt unavailable; prior outcome only/);
});

test('receipt snapshot rejects selector replacement during its read',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-receipt-race-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'receipts-v1.json');atomicJson(file,{schema:1,checks:{}});
  const original=fs.readFileSync;
  fs.readFileSync=function(selected,...args){const value=original.call(this,selected,...args);
    if(selected===file)atomicJson(file,{schema:1,checks:{newer:{result:'FAIL'}}});return value;};
  try{assert.throws(()=>readReceiptSnapshot(dir),/changed during read/);}
  finally{fs.readFileSync=original;}
});
