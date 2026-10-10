// Pure recipient decision preparation. This module neither discovers inputs nor
// executes producer data. The caller supplies independently validated local facts
// and observation/caller prerequisites; imported facts can never supply those.
// local.facts must be null unless the selected receipt has complete portable
// capture under the current interpretation. resolvedCatalogRevision is supplied
// only when the identical catalog was independently bound at BOTH run boundaries;
// it is not inferred from arrival time, local execution, or a successful process.
import {canonical,parseEnvelope} from './portable-envelope.mjs';
const HEX=/^[a-f0-9]{64}$/;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const knownLocal=value=>plain(value)&&typeof value.present==='boolean'&&
  ['PASS','FAIL',null].includes(value.result)&&typeof value.stable==='boolean'&&
  ['exited','interrupted','start_failed',null].includes(value.invocationStatus)&&
  ['CURRENT','STALE','UNVERIFIED'].includes(value.applicability)&&
  (value.resolvedCatalogRevision===null||typeof value.resolvedCatalogRevision==='string');
function frozen(value){if(value&&typeof value==='object'){
  for(const child of Object.values(value))frozen(child);Object.freeze(value);}return value;}
function summary(record,predicate){return {digest:record.digest,check:record.check,
  run_id:predicate.origin.runId,origin:predicate.origin,acceptance:record.acceptance};}
export function decidePortableEvidence({check,facts,prerequisites,snapshot,local=null}){
  const historical=[],applicable=[],incomplete=[];
  // Returned data are isolated from the caller, including historical producer
  // facts. No imported command or statement is promoted to a local invocation.
  const localHistory=local?.present===true?{result:local.result??null,stable:local.stable===true,
    applicability:local.applicability??'UNVERIFIED',invocation_status:local.invocationStatus??null}:null;
  function decision(reason,{freshness='UNVERIFIED',result=null,selected=null,eligible=false,blockLocal=false}={}){
    return frozen({schema:1,reason,freshness,result,reuse_eligible:eligible,
      local_reuse_blocked:blockLocal,selected,applicable:[...applicable],historical:[...historical],incomplete:[...incomplete],
      local_historical:localHistory});
  }
  if(typeof check!=='string'||!check||!plain(snapshot)||!Array.isArray(snapshot.records)||
    snapshot.records.length>32||(typeof snapshot.revision!=='string'||!snapshot.revision)||snapshot.error)
    return decision('PORTABLE_CATALOG_UNAVAILABLE',{blockLocal:true});
  if(!plain(prerequisites)||['understood','observationHealthy','callerValidated','complete']
    .some(key=>prerequisites[key]!==true))return decision('PORTABLE_RECIPIENT_UNVERIFIED');
  let recipient;
  try{if(facts===null||!plain(facts))throw Error();recipient=canonical(facts);}
  catch{return decision('PORTABLE_RECIPIENT_FACTS_INVALID');}
  const seen=new Set();
  for(const record of snapshot.records){
    // Inspection-only imports have no authority over either imported or local
    // evidence, including a failure asserted by an unaccepted producer.
    // The authoritative catalog reader rechecks current CI policy before this
    // decision. Raw imported authentication claims never reach this boundary
    // as accepted records merely because an artifact contains them.
    if(!['manual-digest-v1','github-ci-v1'].includes(record?.acceptance))continue;
    if(record.check!==check)continue;
    let envelope;
    try{
      if(typeof record.digest!=='string'||!HEX.test(record.digest)||seen.has(record.digest))throw Error();
      seen.add(record.digest);envelope=parseEnvelope(canonical(record.envelope));
      if(envelope.digest!==record.digest)throw Error();
    }catch{return decision('PORTABLE_ACCEPTED_RECORD_INVALID',{blockLocal:true});}
    const predicate=envelope.statement.predicate,entry=summary(record,predicate);
    if(predicate.facts===null||!predicate.origin.complete){incomplete.push(entry);continue;}
    if(canonical(predicate.facts)!==recipient){historical.push(entry);continue;}
    applicable.push(entry);
  }
  if(local!==null&&!knownLocal(local))return decision('PORTABLE_LOCAL_SELECTION_INVALID',{blockLocal:true});
  let localSame=false,localDifferent=false;
  if(local?.present){
    try{if(local.facts!==null&&plain(local.facts)){
      const identity=canonical(local.facts);localSame=identity===recipient;localDifferent=!localSame;
    }}catch{return decision('PORTABLE_LOCAL_SELECTION_INVALID',{blockLocal:true});}
    // An explicit STALE assertion without independently differing complete facts
    // is not sufficient to escape a newer selected unavailable/unstable outcome.
    const staleHistorical=local.applicability==='STALE'&&localDifferent&&local.stable&&
      local.invocationStatus==='exited'&&['PASS','FAIL'].includes(local.result);
    if(!staleHistorical&&(!local.stable||local.invocationStatus!=='exited'||
      local.applicability!=='CURRENT'||!localSame||local.result!=='PASS'))
      return decision('PORTABLE_LOCAL_SELECTION_BARS_FALLBACK',{blockLocal:true});
  }
  const localCurrent=local?.present&&localSame&&local.stable&&local.invocationStatus==='exited'&&
    local.applicability==='CURRENT'&&local.result==='PASS';
  const locallyResolved=localCurrent&&local.resolvedCatalogRevision===snapshot.revision;
  const fails=applicable.filter(record=>record.origin.result==='FAIL');
  const passes=applicable.filter(record=>record.origin.result==='PASS');
  if(locallyResolved)return decision('PORTABLE_CATALOG_EXPLICITLY_RESOLVED_LOCALLY');
  if(incomplete.length)return decision('PORTABLE_ACCEPTED_ORIGIN_INCOMPLETE',{blockLocal:true});
  if(fails.length&&(passes.length||localCurrent))return decision('PORTABLE_APPLICABLE_CONFLICT',{blockLocal:true});
  if(applicable.length>1)return decision('PORTABLE_UNORDERED_ORIGINS',{blockLocal:true});
  if(localCurrent)return decision('PORTABLE_LOCAL_CURRENT_SELECTED');
  if(fails.length===1)return decision('PORTABLE_APPLICABLE_FAILURE',{
    freshness:'CURRENT',result:'FAIL',selected:fails[0]});
  if(passes.length===1)return decision('PORTABLE_RECIPIENT_CURRENT',{
    freshness:'CURRENT',result:'PASS',selected:passes[0],eligible:true});
  if(historical.length)return decision('PORTABLE_FACTS_DIFFER',{freshness:'STALE'});
  return decision('PORTABLE_NO_ACCEPTED_EVIDENCE');
}
