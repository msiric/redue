import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkpointBaselineDiagnostics,summarizeCheckpointBaseline} from './acceptance/checkpoint-diagnostics.mjs';

test('checkpoint diagnostics expose only bounded static outcomes, phases and ordinal correlations',()=>{
  const privateValue='secret-private-path-or-url',uuid='11111111-1111-1111-1111-111111111111';
  const result=summarizeCheckpointBaseline({baseline:{freshness:'UNVERIFIED',reason:privateValue,context:{token:privateValue}},
    receipt:{result:'PASS',stable:false,invocation:{status:'exited',argv:privateValue},checkpoint:{status:'unavailable_or_changed',startRevision:126,endRevision:126,
      issues:['end checkpoint unavailable',privateValue]}},journal:[{kind:'history_timeout',phase:'root replay',generation:uuid,deadline_ms:300,message:privateValue,repository:privateValue}],
    timings:[{phase:'history.complete',request:uuid,generation:uuid,ms:301,environment:privateValue},{phase:privateValue,ms:3}]});
  assert.equal(result.result,'PASS');assert.equal(result.stable,false);assert.deepEqual(result.checkpoint.issues,['end checkpoint unavailable','OTHER_PRIVATE_ISSUE']);
  assert.equal(result.events[0].deadline_ms,300);assert.equal(result.timings[0].request,1);assert.equal(result.timings[0].generation,1);
  assert(!JSON.stringify(result).includes(privateValue));assert(!JSON.stringify(result).includes(uuid));
});
test('unknown diagnostic values are never promoted to health or applicability',()=>{
  const result=summarizeCheckpointBaseline({baseline:{freshness:'GREEN'},receipt:{result:'OK',stable:'true',invocation:{status:'finished'},checkpoint:{issues:'secret'}},
    journal:[{kind:'private',phase:'secret'}],timings:[{phase:'cli.end_checkpoint',ms:Infinity,available:2,healthy:'true',request:'secret'}]});
  assert.equal(result.freshness,'UNKNOWN');assert.equal(result.result,null);assert.equal(result.stable,false);assert.equal(result.invocation_status,null);
  assert.deepEqual(result.events,[]);assert.equal(result.timings[0].ms,null);assert.equal(result.timings[0].available,null);assert.equal(result.timings[0].healthy,null);
});
test('bounded diagnostic reads tolerate absent, malformed and oversized files without exposing content',t=>{
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'redue-checkpoint-diag-'));t.after(()=>fs.rmSync(state,{recursive:true,force:true}));
  const f={state},baseline={freshness:'UNVERIFIED'};assert.deepEqual(checkpointBaselineDiagnostics(f,baseline).events,[]);
  fs.writeFileSync(path.join(state,'events.jsonl'),'malformed-private-record\n');
  fs.writeFileSync(path.join(state,'checkpoint-timing.jsonl'),'private'.repeat(40000));
  fs.writeFileSync(path.join(state,'receipts-v1.json'),'private'.repeat(40000));
  const result=checkpointBaselineDiagnostics(f,baseline);assert.deepEqual(result.events,[]);assert.deepEqual(result.timings,[]);assert.equal(result.result,null);
  fs.unlinkSync(path.join(state,'receipts-v1.json'));fs.mkdirSync(path.join(state,'receipts-v1.json'));
  assert.equal(checkpointBaselineDiagnostics(f,baseline).result,null);
});
