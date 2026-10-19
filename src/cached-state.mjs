// The same fail-conservative cached reader serves the CLI and execution layer.
import fs from 'node:fs';
import path from 'node:path';
import {processAlive} from './process-liveness.mjs';
import {readReceipts,readReceiptSnapshot,receiptRevision} from './state-store.mjs';
import {runFactReason} from './typescript-list.mjs';
const unknown=(reason,checks)=>({schema:1,state:'unverified',current:0,stale:0,failed:0,observed_failed:0,
  unverified:checks.length,
  checks:checks.map(c=>({name:c.name,result:null,freshness:'UNVERIFIED',reason,
    invocation:null,changed_inputs:[],reuse_eligible:false})),
  observation:{healthy:false,reason}});
export function unavailableCached(state,reason,checks=[]) {
  let value;try{value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));}
  catch{value=unknown(reason,checks);}
  if(!value||!Array.isArray(value.checks))value=unknown(reason,checks);
  let receipts=null,revision=null;
  try{const snapshot=readReceiptSnapshot(state);receipts=snapshot.value.checks;revision=snapshot.revision;}
  catch(error){reason+=`; latest receipt unavailable; prior outcome only: ${error.message}`;
    try{receipts=readReceipts(state).checks;}catch{/* retain cached historical rows */}}
  const rows=(value.checks||[]).map(row=>{
    const latest=receipts?.[row.name];
    return {...row,...(receipts?{result:latest?.result||null,invocation:latest?.invocation||null,
      target_provenance:latest?.target||null,coverage_at_run:latest?.coverage||null}:{}),
      freshness:'UNVERIFIED',reason,reuse_eligible:false,declared_inputs_match:null};
  });
  return {...value,receipt_revision:revision,state:'unverified',current:0,stale:0,failed:0,
    observed_failed:rows.filter(row=>row.result==='FAIL').length,
    unverified:Math.max(1,rows.length),checks:rows,
    observation:{...value.observation,healthy:false,reason}};
}
// The summary counts of a status answer, from its rows.
export function statusSummary(checks) {
  const count=test=>checks.filter(test).length,failed=count(r=>r.freshness==='CURRENT'&&r.result==='FAIL'),
    stale=count(r=>r.freshness==='STALE'),unverified=count(r=>r.freshness==='UNVERIFIED')||(!checks.length?1:0);
  return {state:failed?'failed':unverified?'unverified':stale?'stale':'current',
    current:count(r=>r.freshness==='CURRENT'&&r.result==='PASS'),failed,
    observed_failed:count(r=>r.result==='FAIL'),stale,unverified};
}
// A stored CURRENT answer is only as old as its publish. Run facts are asked
// again here, from the receipts the answer was about, so no cached answer says
// CURRENT without them checked now.
function withRunFacts(state,value,checks) {
  if(!value.checks.some(row=>row.freshness==='CURRENT'&&row.run_facts))return value;
  const snapshot=readReceiptSnapshot(state);
  if(snapshot.revision!==value.receipt_revision)
    return unavailableCached(state,'receipt selection changed; synchronize status to evaluate the latest outcome',checks);
  const rows=value.checks.map(row=>{
    const reason=row.freshness==='CURRENT'&&row.run_facts?runFactReason(snapshot.value.checks[row.name]?.runFacts):null;
    return reason?{...row,freshness:'STALE',reuse_eligible:false,changed_inputs:[],reason}:row;
  });
  return rows.every((row,i)=>row===value.checks[i])?value:{...value,checks:rows,...statusSummary(rows)};
}
export function readCachedStatus(state,checks=[]) {
  try{const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    if(typeof value.receipt_revision!=='string')
      return unavailableCached(state,'receipt selection is unconfirmed; synchronize status or restart an older observer',checks);
    if(value.receipt_revision!==receiptRevision(state))
      return unavailableCached(state,'receipt selection changed; synchronize status to evaluate the latest outcome',checks);
    if(Date.now()>=value.updated_at&&Date.now()<=value.expires_at&&
      value.expires_at-value.updated_at<=3000){
      if(processAlive(value.pid))return withRunFacts(state,value,checks);
      return unavailableCached(state,'observer process unavailable',checks);}
  }catch{}
  return unavailableCached(state,'observer heartbeat expired or unavailable',checks);
}
