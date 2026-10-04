// Presentation consumes evidence; it never grants applicability.
export function checkLabel(row) {
  return row.result==='FAIL'?'FAILED':row.freshness;
}
export function explanation(row) {
  const reason=row.reason||'No verification evidence is available.';
  if(reason==='no receipt')return 'No execution has been recorded. Run this check when verification is needed.';
  if(reason==='declared inputs match')return 'Recorded evidence still applies to the declared inputs.';
  if(reason==='execution environment context not supplied')return 'Cached status cannot confirm your execution context. Use --sync if worthwhile, or rerun the check.';
  if(/requires? a synchronized content read/.test(reason))return 'Cached status cannot establish applicability here. Use --sync if worthwhile, or rerun the check.';
  if(reason.startsWith('input coverage unresolved: '))return 'Recording-only: '+reason.slice(27);
  if(/input plan (rebuilding|indexing)|observer initialization|input observation reconciliation pending/.test(reason))
    return 'Checking inputs after startup or changes. Wait for observation to finish, then query again.';
  if(/observer (heartbeat|process|stopping)/.test(reason))return 'Observer unavailable. Run redue start; previous outcomes remain recorded.';
  return reason;
}
export function renderStatus(value,{short=false}={}) {
  if(short)return `REDUE ${String(value.state||'unverified').toUpperCase()}`;
  const lines=[];
  for(const row of value.checks||[]) {
    const label=checkLabel(row),symbol=label==='CURRENT'&&row.result==='PASS'?'✓':label==='FAILED'?'✗':'?';
    const mark=label==='STALE'?'⚠':symbol;
    const historical=row.result?` / ${row.result}`:'';
    lines.push(`${mark} ${row.name}  ${label}${historical}`);
    if(label!=='CURRENT')lines.push(`  ${row.result==='FAIL'?`Historical failure; applicability ${row.freshness}. `:''}${explanation(row)}`);
  }
  if(!lines.length)lines.push('UNVERIFIED — observation is initializing; no check state is available yet.');
  if(!value.observation?.healthy)lines.push('Observation unavailable or pending. Previous results are not reusable.');
  return lines.join('\n');
}
export function renderExplain(value,name) {
  const rows=name?value.checks.filter(row=>row.name===name):value.checks;
  return rows.map(row=>{
    const lines=[`${row.name}: ${checkLabel(row)}${row.result?` / ${row.result}`:''}`];
    if(row.result==='FAIL')lines.push(`Historical failure; applicability: ${row.freshness}.`);
    lines.push(explanation(row));
    if(row.changed_inputs?.length)lines.push('Relevant inputs changed:',...row.changed_inputs.map(file=>`  ${file}`));
    if(row.freshness==='STALE')lines.push(`Due again when verification is needed: redue run ${JSON.stringify(row.name)}`);
    if(row.invocation)lines.push(`Last invocation: ${row.invocation.status}`+
      (Number.isFinite(row.invocation.durationMs)?` (${(row.invocation.durationMs/1000).toFixed(2)}s)`:'')+'.');
    return lines.join('\n');
  }).join('\n\n');
}
export function renderRun(value) {
  const label=value.result==='FAIL'?'FAILED':value.result||String(value.invocation).toUpperCase();
  const lines=[`${value.check}: ${label} recorded.`];
  if(value.invocation!=='exited')lines.push(`Invocation ${value.invocation}; no reusable passing evidence.`);
  else if(!value.coverage_qualified)lines.push('Applicability remains UNVERIFIED: input coverage is incomplete.');
  else if(!value.stable)lines.push('Applicability remains UNVERIFIED: inputs changed or observation was unavailable during execution.');
  else lines.push('Inspect redue status before reusing this evidence. Cached status may require --sync to establish applicability.');
  return lines.join('\n');
}
