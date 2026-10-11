// One mechanistic sample, not a benchmark framework or a saved-run estimate.
import assert from 'node:assert/strict';
import path from 'node:path';
export function assertSmokeRootCwd(root,cwd,realpath){
  assert(typeof cwd==='string'&&cwd.length>0,'Declared runtime working directory required');
  assert.equal(realpath(path.resolve(root,cwd)),realpath(root),'Resolved compiler working directory must be the owned root');
}
// Static stage plus allowlisted returned state; never forward human reasons or
// arbitrary producer metadata into a public failure report.
export function smokeEvidenceObservation(stage,status,commandIndex){
  assert(typeof stage==='string'&&/^[a-z-]+$/.test(stage));
  assert(Number.isInteger(commandIndex)&&commandIndex>=0);
  const selected=Array.isArray(status?.checks)?status.checks.find(check=>check?.name==='typecheck'):null;
  const allowed=(value,list)=>list.includes(value)?value:null;
  const identity=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)?value:null;
  const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value)?value:null;
  return {stage,command_index:commandIndex,schema:status?.schema===1?1:null,
    observation_healthy:typeof status?.observation?.healthy==='boolean'?status.observation.healthy:null,
    freshness:allowed(selected?.freshness,['CURRENT','STALE','UNVERIFIED']),
    result:allowed(selected?.result,['PASS','FAIL']),reuse_eligible:selected?.reuse_eligible===true,
    reason_code:typeof selected?.reason_code==='string'&&/^[A-Z][A-Z0-9_]{0,95}$/.test(selected.reason_code)?selected.reason_code:null,
    run_id:identity(selected?.invocation?.runId),
    evidence_source:allowed(selected?.evidence_source,['local','imported']),
    imported_digest:digest(selected?.imported_evidence?.digest),
    origin_run_id:identity(selected?.imported_evidence?.origin_run_id)};
}
export function summarizeSmokeEconomics(commands,elapsed){
  assert(Array.isArray(commands)&&commands.length>0);
  assert(Number.isFinite(elapsed)&&elapsed>=0,'Actual complete workflow wall time required');
  for(const c of commands){
    assert(typeof c.phase==='string'&&/^[a-z-]+$/.test(c.phase),'Static public phase label required');
    assert(Number.isFinite(c.milliseconds)&&c.milliseconds>=0,'Measured command time required');
  }
  const workflow=commands.filter(c=>c.scope==='portable-workflow'),plain=commands.filter(c=>c.scope==='plain-baseline');
  assert.equal(workflow.filter(c=>c.phase==='wrapped-portable-execution').length,1);
  assert.equal(workflow.filter(c=>c.phase==='wrapped-local-execution').length,1);
  assert.deepEqual(plain.map(c=>c.phase),['plain-initial-compiler','plain-relevant-compiler']);
  assert([...workflow,...plain].every(c=>c.exit_status===0&&!c.error_code),'Failed samples cannot support a cost comparison');
  const total=rows=>rows.reduce((sum,c)=>sum+c.milliseconds,0);
  return {scope:'one controlled same-machine complete sequence',samples:1,
    sequence:'portable record, final query, export preview/export/inspect, import preview/apply, synchronized/cached/unrelated/relevant queries, required local run/final query, restart/inherited query',
    complete_workflow_wall_ms:elapsed,workflow_command_ms:total(workflow),workflow_command_count:workflow.length,
    plain_initial_compiler_ms:plain[0].milliseconds,plain_relevant_compiler_ms:plain[1].milliseconds,plain_two_required_compilations_ms:total(plain),
    added_command_ms_vs_two_required_compilations:total(workflow)-total(plain),
    recorded_executions:2,matched_plain_obligations:2,
    baseline_order:'initial plain before portable recording; relevant plain after complete workflow; normal caches unchanged',
    model_trials:0,avoided_verification_executions:'NOT_ESTABLISHED_BY_MECHANICS',
    model_and_tool_transport_cost:'NOT_MEASURED',whole_task_benefit:'NOT_ESTABLISHED',
    interpretation:'queries are inspections, not automatically avoided verification; setup/control/cleanup timings are separately retained; no distribution or causal adoption claim'};
}
