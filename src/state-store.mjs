import fs from 'node:fs';
import path from 'node:path';

export const STATE_SCHEMA=1;

export function atomicJson(file,value){
  const temp=file+`.`+process.pid+`.tmp`;
  fs.writeFileSync(temp,JSON.stringify(value),{mode:0o600});
  // Windows readers and AV can briefly hold the replaced name open. Keep the
  // old complete file until replacement succeeds; never delete it first.
  for(let attempt=0;;attempt++)try{fs.renameSync(temp,file);break;}catch(e){
    if(process.platform!=='win32'||!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt===9)
      throw e;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10*(attempt+1));
  }
}

export function readReceipts(state){
  let value;
  try{value=JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'),'utf8'));}
  catch(e){if(e.code==='ENOENT')return {schema:STATE_SCHEMA,checks:{}};throw e;}
  if(!value||typeof value!=='object'||Array.isArray(value)||value.schema!==STATE_SCHEMA||
    !value.checks||typeof value.checks!=='object'||Array.isArray(value.checks))
    throw Error(`incompatible receipt state in ${state}; inspect or remove only this vstate state directory`);
  return value;
}

// This identity detects replacement of REDUE's owned, atomically written receipt
// selector. It is not an input-content fingerprint or permission to reuse inputs.
export function receiptRevision(state){
  // A failed/crashed owned writer may have persisted a new immutable outcome
  // without replacing the selector. Never certify its older selection.
  try {fs.lstatSync(path.join(state,'receipt-selection-pending-v1.json'));
    throw Error('receipt selection update incomplete; inspect the failed run, then record a new execution to recover');
  }catch(error){if(error.code!=='ENOENT')throw error;}
  try {const stat=fs.statSync(path.join(state,'receipts-v1.json'),{bigint:true});
    if(!stat.isFile())throw Error('receipt selector is not a file');
    return JSON.stringify(['dev','ino','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])));
  }catch(error){if(error.code==='ENOENT')return 'absent';throw error;}
}

export function readReceiptSnapshot(state){
  const revision=receiptRevision(state),value=readReceipts(state);
  if(receiptRevision(state)!==revision)
    throw Error('receipt selection changed during read; retry status');
  return {revision,value};
}

export function commitReceipt(state,name,receipt){
  const prior=readReceipts(state),runId=receipt.invocation?.runId;
  if(!/^[0-9a-f-]{36}$/.test(runId||''))throw Error('receipt lacks a valid run ID');
  const runs=path.join(state,'runs-v1');
  fs.mkdirSync(runs,{recursive:true,mode:0o700});
  // The caller holds the state run lock. Leave this marker on any write failure;
  // only a later successful owned commit may clear it. No journal scan guesses
  // which incomplete execution should become the selected evidence.
  const pending=path.join(state,'receipt-selection-pending-v1.json');
  let updates={schema:STATE_SCHEMA,checks:{}};
  try {updates=JSON.parse(fs.readFileSync(pending,'utf8'));
    if(updates?.schema!==STATE_SCHEMA||!updates.checks||typeof updates.checks!=='object'||Array.isArray(updates.checks))
      throw Error('incompatible incomplete receipt update; inspect owned state before recording');
  }catch(error){if(error.code!=='ENOENT')throw error;}
  updates.checks[name]={runId};
  atomicJson(pending,updates);
  // One immutable outcome per invocation. Never overwrite an existing run.
  fs.writeFileSync(path.join(runs,runId+'.json'),
    JSON.stringify({schema:STATE_SCHEMA,check:name,receipt}),{flag:'wx',mode:0o600});
  prior.checks[name]=receipt;
  atomicJson(path.join(state,'receipts-v1.json'),prior);
  delete updates.checks[name];
  if(Object.keys(updates.checks).length)atomicJson(pending,updates);
  else fs.unlinkSync(pending);
}
