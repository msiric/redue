// Evaluation only. A failed setup/preflight cannot fall through to a model launch.
// Call this after all fixture/integration changes; do not use shell ';' sequencing.
export function preconditionMatches(report,expected){
  if(report?.schema!==1||!report.cli||!Array.isArray(report.commands))return false;
  const last=report.commands.at(-1),status=last?.response;
  const row=status?.checks?.find(r=>r.name===report.check);
  const supported=status?.schema===1&&status?.observation&&row;
  const eligible=Boolean(last?.exit===0&&supported&&status.observation.healthy===true&&
    row.freshness==='CURRENT'&&row.result==='PASS'&&row.reuse_eligible===true);
  if(expected==='eligible')return eligible&&report.eligible===true;
  if(eligible||report.eligible===true)return false;
  if(expected==='stale')return Boolean(last?.exit===0&&supported&&status.observation.healthy===true&&
    row.freshness==='STALE'&&row.result==='PASS'&&row.reuse_eligible===false);
  if(expected==='failed')return Boolean(last?.exit===0&&supported&&status.observation.healthy===true&&
    row.result==='FAIL'&&row.reuse_eligible===false);
  if(expected==='unverified')return Boolean(last?.exit===0&&supported&&status.observation.healthy===true&&
    row.freshness==='UNVERIFIED'&&row.reuse_eligible===false);
  if(expected==='unavailable'){
    const doctor=report.commands.find(c=>c.response?.control)?.response;
    const cached=report.commands.find(c=>c.args?.includes('status')&&!c.args?.includes('--sync'))?.response;
    return Boolean(doctor?.control?.reachable===false&&cached?.schema===1&&
      cached.observation?.healthy===false&&cached.checks?.some(c=>c.name===report.check&&c.reuse_eligible===false));
  }
  return false;
}
export async function runGatedTrial({preflight,expected,record,launch}){
  let report;
  try{report=await preflight();}
  catch(error){await record({launched:false,expected,reason:'preflight_error',error:error.code||error.name});return {launched:false};}
  const matched=preconditionMatches(report,expected);
  await record({launched:false,expected,matched,report});
  if(!matched)return {launched:false};
  // One explicit branch is the only route to launching the actual host process.
  const result=await launch();return {launched:true,result};
}
