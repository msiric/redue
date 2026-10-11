// One mechanistic sample, not a benchmark framework or a saved-run estimate.
import assert from 'node:assert/strict';
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
