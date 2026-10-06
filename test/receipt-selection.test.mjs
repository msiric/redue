import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {atomicJson,commitReceipt,readReceipts,readReceiptSnapshot,receiptRevision} from '../src/state-store.mjs';
import {readCachedStatus} from '../src/cached-state.mjs';

function fixture(t){
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'redue-selector-'));
  t.after(()=>fs.rmSync(state,{recursive:true,force:true}));
  const receipt={result:'PASS',stable:true,invocation:{runId:randomUUID(),status:'exited',exitCode:0}};
  commitReceipt(state,'check',receipt);
  const immutable=path.join(state,'runs-v1',receipt.invocation.runId+'.json');
  const bytes=fs.readFileSync(immutable);
  const now=Date.now(),cache={schema:1,state:'current',current:1,observed_failed:0,
    updated_at:now,expires_at:now+3000,pid:process.pid,receipt_revision:receiptRevision(state),
    observation:{healthy:true},checks:[{name:'check',result:'PASS',freshness:'CURRENT',
      reuse_eligible:true,invocation:receipt.invocation}]};
  atomicJson(path.join(state,'status.json'),cache);
  return {state,receipt,immutable,bytes,selector:path.join(state,'receipts-v1.json'),
    cached:()=>readCachedStatus(state,[{name:'check'}]),
    assertImmutable:()=>assert.deepEqual(fs.readFileSync(immutable),bytes)};
}

test('missing receipt selector cannot reuse cached evidence and leaves immutable runs intact',t=>{
  const f=fixture(t);fs.unlinkSync(f.selector);
  assert.deepEqual(readReceiptSnapshot(f.state).value,{schema:1,checks:{}});
  const row=f.cached().checks[0];assert.equal(row.freshness,'UNVERIFIED');
  assert.equal(row.reuse_eligible,false);assert.equal(row.result,null);
  f.assertImmutable();
  atomicJson(f.selector,{schema:1,checks:{check:f.receipt}});
  assert.equal(f.cached().checks[0].result,'PASS');
  assert.equal(f.cached().checks[0].freshness,'UNVERIFIED');
});

test('malformed and incompatible receipt selectors are unavailable, not absent',t=>{
  const f=fixture(t);
  for(const text of ['not JSON','null','[]','{"schema":99,"checks":{}}',
    '{"schema":1,"checks":[]}','{"schema":1,"checks":null}']){
    fs.writeFileSync(f.selector,text);
    assert.throws(()=>readReceiptSnapshot(f.state));
    const row=f.cached().checks[0];assert.equal(row.freshness,'UNVERIFIED');
    assert.equal(row.reuse_eligible,false);assert.equal(row.invocation.runId,f.receipt.invocation.runId);
    assert.match(row.reason,/latest receipt unavailable; prior outcome only/);
    f.assertImmutable();
  }
  atomicJson(f.selector,{schema:1,checks:{check:f.receipt}});
  assert.equal(readReceiptSnapshot(f.state).value.checks.check.result,'PASS');
  assert.equal(f.cached().checks[0].reuse_eligible,false);
});

test('receipt read and metadata access errors preserve explicitly historical outcomes and recover',t=>{
  const f=fixture(t),latest={...f.receipt,result:'FAIL',stable:false,
    invocation:{...f.receipt.invocation,runId:randomUUID(),exitCode:1}};
  commitReceipt(f.state,'check',latest);
  for(const method of ['readFileSync','statSync']){
    const original=fs[method];
    fs[method]=function(file,...args){
      if(file===f.selector)throw Object.assign(Error('injected receipt access denial'),{code:'EACCES'});
      return original.call(this,file,...args);
    };
    try{
      assert.throws(()=>readReceiptSnapshot(f.state),/access denial/);
      const row=f.cached().checks[0];assert.equal(row.reuse_eligible,false);
      assert.equal(row.freshness,'UNVERIFIED');
      // Metadata denial can still leave the selector readable as history only;
      // content-read denial retains the older cached historical selection.
      assert.equal(row.result,method==='statSync'?'FAIL':'PASS');
      assert.equal(row.invocation.runId,method==='statSync'?latest.invocation.runId:f.receipt.invocation.runId);
      assert.match(row.reason,/latest receipt unavailable; prior outcome only/);
    }finally{fs[method]=original;}
    const recovered=f.cached();assert.equal(recovered.checks[0].result,'FAIL');
    assert.equal(recovered.checks[0].invocation.runId,latest.invocation.runId);
    assert.equal(recovered.checks[0].reuse_eligible,false);assert.equal(recovered.observed_failed,1);
  }
  f.assertImmutable();
});

test('stable failed selection cannot authorize reuse and immutable records cannot be overwritten',t=>{
  const f=fixture(t),failed={...f.receipt,result:'FAIL',stable:true,
    invocation:{...f.receipt.invocation,runId:randomUUID(),exitCode:1}};
  commitReceipt(f.state,'check',failed);
  const failureFile=path.join(f.state,'runs-v1',failed.invocation.runId+'.json');
  const failureBytes=fs.readFileSync(failureFile),row=f.cached().checks[0];
  assert.equal(row.result,'FAIL');assert.equal(row.reuse_eligible,false);
  assert.equal(row.invocation.runId,failed.invocation.runId);
  assert.throws(()=>commitReceipt(f.state,'check',{...failed,result:'PASS'}),/EEXIST/);
  assert.equal(readReceipts(f.state).checks.check.result,'FAIL');
  assert.deepEqual(fs.readFileSync(failureFile),failureBytes);f.assertImmutable();
});

test('failed selector replacement blocks reuse across other-check commits and preserves immutable outcomes',t=>{
  const f=fixture(t),pending=path.join(f.state,'receipt-selection-pending-v1.json');
  const outcome=result=>({...f.receipt,result,invocation:{...f.receipt.invocation,
    runId:randomUUID(),exitCode:result==='FAIL'?1:0}});
  const failedA=outcome('FAIL'),failedB=outcome('FAIL'),originalRename=fs.renameSync;
  fs.renameSync=function(from,to){
    if(to===f.selector)throw Object.assign(Error('injected selector replacement failure'),{code:'EACCES'});
    return originalRename.call(this,from,to);
  };
  try{
    assert.throws(()=>commitReceipt(f.state,'check',failedA),/selector replacement failure/);
    assert.throws(()=>commitReceipt(f.state,'other',failedB),/selector replacement failure/);
  }finally{fs.renameSync=originalRename;}
  const fileA=path.join(f.state,'runs-v1',failedA.invocation.runId+'.json'),
    fileB=path.join(f.state,'runs-v1',failedB.invocation.runId+'.json'),
    bytesA=fs.readFileSync(fileA),bytesB=fs.readFileSync(fileB);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(pending)).checks).sort(),['check','other']);
  assert.equal(readReceipts(f.state).checks.check.result,'PASS');
  assert.throws(()=>readReceiptSnapshot(f.state),/update incomplete/);
  let cached=f.cached().checks[0];assert.equal(cached.reuse_eligible,false);
  assert.equal(cached.freshness,'UNVERIFIED');assert.match(cached.reason,/update incomplete/);
  const unrelated=outcome('PASS');commitReceipt(f.state,'unrelated',unrelated);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(pending)).checks).sort(),['check','other']);
  assert.equal(f.cached().checks[0].reuse_eligible,false);
  const recoveredA=outcome('PASS');commitReceipt(f.state,'check',recoveredA);
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(pending)).checks),['other']);
  assert.throws(()=>readReceiptSnapshot(f.state),/update incomplete/);
  const recoveredB=outcome('PASS');commitReceipt(f.state,'other',recoveredB);
  assert(!fs.existsSync(pending));
  const latest=readReceiptSnapshot(f.state).value.checks;
  assert.equal(latest.check.invocation.runId,recoveredA.invocation.runId);
  assert.equal(latest.other.invocation.runId,recoveredB.invocation.runId);
  assert.equal(latest.unrelated.invocation.runId,unrelated.invocation.runId);
  assert.equal(f.cached().checks[0].reuse_eligible,false,'new selection still requires observer applicability evaluation');
  f.assertImmutable();assert.deepEqual(fs.readFileSync(fileA),bytesA);assert.deepEqual(fs.readFileSync(fileB),bytesB);
});

test('failure to clear the completed-update marker remains conservative until a successful commit',t=>{
  const f=fixture(t),pending=path.join(f.state,'receipt-selection-pending-v1.json'),
    latest={...f.receipt,result:'FAIL',invocation:{...f.receipt.invocation,runId:randomUUID(),exitCode:1}},
    originalUnlink=fs.unlinkSync;
  fs.unlinkSync=function(file){if(file===pending)throw Object.assign(Error('injected marker removal failure'),{code:'EACCES'});
    return originalUnlink.call(this,file);};
  try{assert.throws(()=>commitReceipt(f.state,'check',latest),/marker removal failure/);}
  finally{fs.unlinkSync=originalUnlink;}
  assert.equal(readReceipts(f.state).checks.check.invocation.runId,latest.invocation.runId);
  assert.throws(()=>receiptRevision(f.state),/update incomplete/);
  assert.equal(f.cached().checks[0].reuse_eligible,false);
  const recovered={...latest,invocation:{...latest.invocation,runId:randomUUID()}};
  commitReceipt(f.state,'check',recovered);assert(!fs.existsSync(pending));
  assert.equal(readReceiptSnapshot(f.state).value.checks.check.invocation.runId,recovered.invocation.runId);
  f.assertImmutable();
});

test('malformed incomplete-update marker cannot be silently cleared by a new commit',t=>{
  const f=fixture(t),pending=path.join(f.state,'receipt-selection-pending-v1.json'),
    selectedBytes=fs.readFileSync(f.selector);
  for(const text of ['not JSON','null','{"schema":99,"checks":{}}','{"schema":1,"checks":[]}']){
    fs.writeFileSync(pending,text);
    assert.throws(()=>receiptRevision(f.state),/update incomplete/);
    const next={...f.receipt,invocation:{...f.receipt.invocation,runId:randomUUID()}};
    assert.throws(()=>commitReceipt(f.state,'check',next));
    assert.equal(fs.readFileSync(pending,'utf8'),text);
    assert.deepEqual(fs.readFileSync(f.selector),selectedBytes);
    assert(!fs.existsSync(path.join(f.state,'runs-v1',next.invocation.runId+'.json')));
    assert.equal(f.cached().checks[0].reuse_eligible,false);f.assertImmutable();
  }
});
