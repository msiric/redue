// The same fail-conservative cached reader serves the CLI and execution layer.
import fs from 'node:fs';
import path from 'node:path';
import {processAlive} from './process-liveness.mjs';
const unknown=(reason,checks)=>({schema:1,state:'unverified',current:0,stale:0,failed:0,observed_failed:0,
  unverified:checks.length,
  checks:checks.map(c=>({name:c.name,result:null,freshness:'UNVERIFIED',reason,
    invocation:null,changed_inputs:[],reuse_eligible:false})),
  observation:{healthy:false,reason}});
export function unavailableCached(state,reason,checks=[]) {
  try {const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    const checks=(value.checks||[]).map(row=>({...row,freshness:'UNVERIFIED',
      reason,reuse_eligible:false,declared_inputs_match:null}));
    return {...value,state:'unverified',current:0,stale:0,failed:0,
      unverified:Math.max(1,checks.length),checks,
      observation:{...value.observation,healthy:false,reason}};
  }catch{return unknown(reason,checks);}
}
export function readCachedStatus(state,checks=[]) {
  try{const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    if(Date.now()>=value.updated_at&&Date.now()<=value.expires_at&&
      value.expires_at-value.updated_at<=3000){
      if(processAlive(value.pid))return value;
      return unavailableCached(state,'observer process unavailable',checks);}
  }catch{}
  return unavailableCached(state,'observer heartbeat expired or unavailable',checks);
}
