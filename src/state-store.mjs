import fs from 'node:fs';
import path from 'node:path';

export const STATE_SCHEMA=1;

export function atomicJson(file,value){
  const temp=file+`.`+process.pid+`.tmp`;
  fs.writeFileSync(temp,JSON.stringify(value),{mode:0o600});
  fs.renameSync(temp,file);
}

export function readReceipts(state){
  let value;
  try{value=JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'),'utf8'));}
  catch(e){if(e.code==='ENOENT')return {schema:STATE_SCHEMA,checks:{}};throw e;}
  if(value.schema!==STATE_SCHEMA||!value.checks||typeof value.checks!=='object')
    throw Error(`incompatible receipt state in ${state}; inspect or remove only this vstate state directory`);
  return value;
}

export function commitReceipt(state,name,receipt){
  const prior=readReceipts(state),runId=receipt.invocation?.runId;
  if(!/^[0-9a-f-]{36}$/.test(runId||''))throw Error('receipt lacks a valid run ID');
  const runs=path.join(state,'runs-v1');
  fs.mkdirSync(runs,{recursive:true,mode:0o700});
  // One immutable outcome per invocation. Never overwrite an existing run.
  fs.writeFileSync(path.join(runs,runId+'.json'),
    JSON.stringify({schema:STATE_SCHEMA,check:name,receipt}),{flag:'wx',mode:0o600});
  prior.checks[name]=receipt;
  atomicJson(path.join(state,'receipts-v1.json'),prior);
}
