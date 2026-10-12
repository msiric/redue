// Synthetic resource-bound controls, not compiler qualification, real portable
// execution, model behavior, or proof that the matched runtime completes in time.
import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {createPortableBudget,portableProbeDeadlineMs,portableCacheDeadlineMs,portableDecisionDeadlineMs} from '../src/portable-budget.mjs';
import {portableProbeFacts,portableCallerProof,capturePortableFacts} from '../src/portable-facts.mjs';

const timeout=error=>error.code==='PORTABLE_PROBE_TIMEOUT';
test('portable resource bounds specify distinct nested inspection and decision limits',()=>{
  assert.equal(portableProbeDeadlineMs,30000);assert.equal(portableCacheDeadlineMs,25000);assert.equal(portableDecisionDeadlineMs,45000);
  assert(portableCacheDeadlineMs<portableProbeDeadlineMs&&portableProbeDeadlineMs<portableDecisionDeadlineMs);
});
test('one private monotonic budget is consumed across all checks instead of renewed per check',()=>{
  let now=0;const budget=createPortableBudget(()=>now);
  assert(Object.isFrozen(budget));assert.deepEqual(Object.keys(budget),['remaining']);
  assert.equal(budget.remaining(),30000);
  now=12500;assert.equal(budget.remaining(),17500);
  now=29999;assert.equal(budget.remaining(),1);
  now=30000;assert.throws(()=>budget.remaining(),timeout);
  now=30001;assert.throws(()=>budget.remaining(),timeout);
});
test('independent origin beginning and ending budgets do not inherit an exhausted decision budget',()=>{
  let now=0;const start=createPortableBudget(()=>now);now=30000;assert.throws(()=>start.remaining(),timeout);
  const end=createPortableBudget(()=>now);assert.equal(end.remaining(),30000);
  now=60000;assert.throws(()=>end.remaining(),timeout);
});
test('fractional remaining milliseconds never become zero, negative, or an enlarged child timeout',()=>{
  let now=100;const budget=createPortableBudget(()=>now);
  for(const elapsed of [0.1,123.45,29998.9]){now=100+elapsed;const remaining=budget.remaining();
    assert(Number.isInteger(remaining)&&remaining>0&&remaining<=30000);}
  now=30099.9;assert.throws(()=>budget.remaining(),timeout,'sub-millisecond time is not rounded into extra authority');
  now=30100;assert.throws(()=>budget.remaining(),timeout);
});
for(const invalid of [NaN,Infinity,-Infinity,-1])
  test(`invalid monotonic clock (${String(invalid)}) yields conservative expiry`,()=>{
    assert.throws(()=>createPortableBudget(()=>invalid).remaining(),timeout);
  });
for(const invalid of [NaN,Infinity,-Infinity])
  test(`a clock becoming ${String(invalid)} permanently withholds remaining authority`,()=>{
    let now=0;const budget=createPortableBudget(()=>now);now=invalid;assert.throws(()=>budget.remaining(),timeout);
    now=1;assert.throws(()=>budget.remaining(),timeout);
  });
test('a clock reversal cannot extend or revive an expired shared budget',()=>{
  let now=100;const budget=createPortableBudget(()=>now);now=120;assert.equal(budget.remaining(),29980);
  now=110;assert.throws(()=>budget.remaining(),timeout);
  now=125;assert.throws(()=>budget.remaining(),timeout);
  let next=0;const expired=createPortableBudget(()=>next);next=30000;assert.throws(()=>expired.remaining(),timeout);
  next=1;assert.throws(()=>expired.remaining(),timeout);
});
test('expired caller, capture and facts budgets launch no validation process',t=>{
  let launches=0;t.mock.method(childProcess,'spawnSync',()=>{launches++;throw Error('No child after expired budget');});syncBuiltinESMExports();
  t.after(()=>{t.mock.restoreAll();syncBuiltinESMExports();});
  let now=0;const budget=createPortableBudget(()=>now);now=30000;
  // Deliberately unsupported synthetic plan: expiry must precede inspection,
  // not masquerade as a reviewed compiler or a successful probe response.
  assert.throws(()=>portableProbeFacts({}, {budget}),timeout);
  assert.throws(()=>portableCallerProof({},budget),timeout);
  assert.throws(()=>capturePortableFacts({},null,null,budget),timeout);
  assert.equal(launches,0);
});
test('actual controlled child obeys the remaining hard timeout without a compiler/project substitution',()=>{
  let now=0;const budget=createPortableBudget(()=>now);now=29950;
  const remaining=budget.remaining();assert.equal(remaining,50);
  // Standalone resource fault injection only. It never enters a REDUE recipe,
  // reads project inputs, creates evidence, or measures useful verification cost.
  const result=childProcess.spawnSync(process.execPath,['-e','setInterval(()=>{},1000)'],
    {timeout:remaining,stdio:'ignore',windowsHide:true});
  assert.equal(result.error?.code,'ETIMEDOUT');assert.equal(result.status,null);
  assert(result.signal,'Timed-out controlled child must not report a completed outcome');
});
