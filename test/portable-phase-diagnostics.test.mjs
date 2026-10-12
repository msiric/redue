import test from 'node:test';import assert from 'node:assert/strict';
import {summarizePortablePhases,readPortablePhases} from './acceptance/portable-phase-diagnostics.mjs';
import {controlledCiDiagnostics} from './acceptance/portable-machine.mjs';
const line=value=>'REDUE_TIMING '+JSON.stringify(value)+'\n';
test('phase projection retains partial timeout counts, never private data or authority',()=>{
  const privateValue='https://user:secret@private.invalid/source';
  const report=summarizePortablePhases(Buffer.from(line({phase:'portable_cache.progress',monoNs:'123456',work:'a'.repeat(36),
    member:1,completedBytes:134217728,readMs:12,hashMs:30,path:privateValue,env:privateValue,reason:privateValue,
    available:true,reuse_eligible:true,freshness:'CURRENT'})+line({phase:privateValue,ms:1})+'REDUE_TIMING {incomplete\n'));
  assert.equal(report.available,true);assert.equal(report.rows.length,1);
  assert.deepEqual(report.rows[0],{phase:'portable_cache.progress',monoNs:'123456',work:'a'.repeat(36),member:1,completedBytes:134217728,readMs:12,hashMs:30});
  assert(!JSON.stringify(report).includes(privateValue));assert.equal(report.reuse_eligible,undefined);
  assert(!report.rows.some(row=>row.phase==='portable_cache.complete'));
});
test('missing, oversized, too-many and malformed diagnostics cannot become a completed proof',()=>{
  for(const input of [null,Buffer.alloc(1024*1024+1),Buffer.from('\n'.repeat(4097)),
    Buffer.from(line({phase:'portable_probe.launch'}).repeat(513)),Buffer.from('REDUE_TIMING {bad\n')]){
    const r=summarizePortablePhases(input);assert.equal(r.available,false);assert.deepEqual(r.rows,[]);assert.equal(r.reason,'DIAGNOSTICS_UNAVAILABLE');}
  assert.equal(readPortablePhases('/definitely-missing-owned-diagnostic').available,false);
});
test('capture is limited to the approved fixed public task-branch push',()=>{
  const e={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'msiric/redue',GITHUB_REF:'refs/heads/dev/portable-evidence',GITHUB_EVENT_NAME:'push'};
  assert.equal(controlledCiDiagnostics(e),true);
  for(const k of Object.keys(e))assert.equal(controlledCiDiagnostics({...e,[k]:'other'}),false);
  assert.equal(controlledCiDiagnostics({}),false);
});
