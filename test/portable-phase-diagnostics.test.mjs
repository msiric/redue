import test from 'node:test';import assert from 'node:assert/strict';
import {summarizePortablePhases,readPortablePhases,summarizeSealedLauncherPhases} from './acceptance/portable-phase-diagnostics.mjs';
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

const launcherLine=(phase,at,extra={})=>line({at:1,monoNs:String(at),pid:123,phase,ms:.1,rssMiB:50.5,...extra});
test('engineering launcher collection is complete only for the full reviewed path; never authority',()=>{
  const pair=p=>[`launcher_${p}_before`,`launcher_${p}_after`];
  const dependency=['launcher_dependencies_before',...pair('assets_currency'),...pair('source_currency'),...pair('copies_currency'),'launcher_dependencies_after'];
  const boundary=['launcher_boundary_before',...dependency,'launcher_boundary_after'];
  const phases=['launcher_build_before',...dependency,...boundary,...pair('tool_proposal'),...boundary,...pair('new_paths_absent'),
    ...pair('source_create'),...pair('source_read'),...boundary,...pair('source_current'),...pair('output_absent'),...boundary,
    ...pair('source_named'),...pair('compiler'),...pair('output_read'),...boundary,...pair('source_current'),...pair('binary_current'),
    ...boundary,...pair('source_current'),...pair('binary_current'),...boundary,...pair('final_roots'),...pair('final_new_rows'),'launcher_build_after'];
  assert.equal(phases.length,110);
  const bodies=phases.map((p,i)=>launcherLine(p,i+1,p==='launcher_compiler_after'?
    {dispatchAttempts:1,dispatchResults:1,observedProcesses:1,status:0,signal:null,spawnError:'NONE',completed:1}:{work:'private_context'}));
  const r=summarizeSealedLauncherPhases(Buffer.from(bodies.join('')));assert.equal(r.collection,'COMPLETE');assert.equal(r.rows.length,110);
  assert.equal(r.rows.find(x=>x.phase==='launcher_compiler_after').status,0);assert.equal(r.authority,false);
  assert.equal(r.sealed,false);assert.equal(r.reuseEligible,false);assert(!JSON.stringify(r).includes('private_context'));
  for(const altered of [bodies.slice(1),bodies.slice(0,-1),bodies.filter((_,i)=>i!==2&&i!==3),[bodies[0],bodies.at(-1)]])
    assert.equal(summarizeSealedLauncherPhases(Buffer.from(altered.join(''))).collection,'UNKNOWN');
});
test('partial launcher marks retain known exit facts while missing or contradictory collection stays UNKNOWN',()=>{
  for(const tail of ['',launcherLine('launcher_build_after',3,{dispatchAttempts:1,dispatchResults:1,observedProcesses:1,status:1,signal:null})]){
    const r=summarizeSealedLauncherPhases(Buffer.from(launcherLine('launcher_build_before',1)+launcherLine('launcher_compiler_before',2)+tail));
    assert.equal(r.collection,'UNKNOWN');assert.equal(r.available,true);assert.equal(r.authority,false);
    if(tail)assert.equal(r.rows.at(-1).status,1);
  }
});
for(const [name,body]of Object.entries({missing:'',invalidUtf8:Buffer.from([0xff]),oversize:Buffer.alloc(65537),
  manyLines:Buffer.from('\n'.repeat(258)),duplicate:Buffer.from('REDUE_TIMING {"phase":"launcher_build_before","phase":"launcher_build_after"}\n'),
  wrongPhase:Buffer.from(launcherLine('CURRENT',1)),wrongSignal:Buffer.from(launcherLine('launcher_build_before',1,{signal:'SECRET_VALUE'})),
  privateData:Buffer.from(launcherLine('launcher_build_before',1,{path:'https://secret.invalid/PRIVATE'})),
  contextObject:Buffer.from(launcherLine('launcher_build_before',1,{work:{private:'SECRET_VALUE'}})),
  status:Buffer.from(launcherLine('launcher_build_before',1,{status:256})),counter:Buffer.from(launcherLine('launcher_build_before',1,{dispatchAttempts:2})),
  counts:Buffer.from(launcherLine('launcher_build_before',1,{dispatchAttempts:0,dispatchResults:1,observedProcesses:1})),
  negativeTime:Buffer.from(launcherLine('launcher_build_before',1,{ms:-1})),prototype:Buffer.from('REDUE_TIMING {"phase":"launcher_build_before","__proto__":{}}\n')}))
  test('launcher projection refuses '+name+' without exposing data',()=>{
    const r=summarizeSealedLauncherPhases(typeof body==='string'?Buffer.from(body):body);assert.equal(r.collection,'UNKNOWN');
    assert.equal(r.authority,false);assert(!JSON.stringify(r).includes('SECRET_VALUE'));assert(!JSON.stringify(r).includes('secret.invalid'));
  });
test('late malformed, truncated, decreasing clock or changed-process rows never manufacture completion',()=>{
  const before=launcherLine('launcher_build_before',2),after=launcherLine('launcher_build_after',3);
  for(const tail of ['REDUE_TIMING {bad\n',after.trimEnd(),launcherLine('launcher_build_after',1),
    launcherLine('launcher_build_after',3,{pid:124}),'ignored\n']){
    const r=summarizeSealedLauncherPhases(Buffer.from(before+tail));assert.equal(r.collection,'UNKNOWN');assert.equal(r.rows[0].phase,'launcher_build_before');
  }
  const extra=summarizeSealedLauncherPhases(Buffer.from(before+after+'REDUE_TIMING {bad\n'));assert.equal(extra.collection,'UNKNOWN');
});
