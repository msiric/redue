import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {renderStatus,renderExplain,renderRun} from '../src/presentation.mjs';
import {readCachedStatus} from '../src/cached-state.mjs';

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
  const cache={schema:1,state:'current',current:1,updated_at:now,expires_at:now+2500,
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
  assert.equal(readCachedStatus(dir,checks).checks[0].result,null);
});
