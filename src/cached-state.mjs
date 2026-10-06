// The same fail-conservative cached reader serves the CLI and execution layer.
import fs from 'node:fs';
import path from 'node:path';
import {processAlive} from './process-liveness.mjs';
import {readReceiptSnapshot,receiptRevision} from './state-store.mjs';
const unknown=(reason,checks)=>({schema:1,state:'unverified',current:0,stale:0,failed:0,observed_failed:0,
  unverified:checks.length,
  checks:checks.map(c=>({name:c.name,result:null,freshness:'UNVERIFIED',reason,
    invocation:null,changed_inputs:[],reuse_eligible:false})),
  observation:{healthy:false,reason}});
export function unavailableCached(state,reason,checks=[]) {
  let value;try{value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));}
  catch{value=unknown(reason,checks);}
  let receipts=null,revision=null;
  try{const snapshot=readReceiptSnapshot(state);receipts=snapshot.value.checks;revision=snapshot.revision;}
  catch(error){reason+=`; latest receipt unavailable; prior outcome only: ${error.message}`;}
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
export function readCachedStatus(state,checks=[]) {
  try{const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    if(typeof value.receipt_revision!=='string')
      return unavailableCached(state,'receipt selection is unconfirmed; synchronize status or restart an older observer',checks);
    if(value.receipt_revision!==receiptRevision(state))
      return unavailableCached(state,'receipt selection changed; synchronize status to evaluate the latest outcome',checks);
    if(Date.now()>=value.updated_at&&Date.now()<=value.expires_at&&
      value.expires_at-value.updated_at<=3000){
      if(processAlive(value.pid))return value;
      return unavailableCached(state,'observer process unavailable',checks);}
  }catch{}
  return unavailableCached(state,'observer heartbeat expired or unavailable',checks);
}
