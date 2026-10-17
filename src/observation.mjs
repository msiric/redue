import fs from 'node:fs';
import {mark,traceEnvironment} from './decision-profile.mjs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Observation contract: live notifications establish continuity only while the
// subscription is healthy; history may accelerate catch-up; a fresh scan is
// the deterministic fallback. A failed history operation never updates cursor.
const workerFile=path.join(path.dirname(fileURLToPath(import.meta.url)),'history-worker.mjs');
// Each query runs in a fresh helper: a reused native history session can take
// ten times longer. The next helper is forked once a query settles, so its
// startup is off the decision path. A failed or late helper is killed.
let spare=null,queue=Promise.resolve(),closed=false;
// After the observer's last query no helper is kept or started.
export function closeHistory() {closed=true;spare?.kill('SIGKILL');spare=null;}
function startHelper() {
  const child=fork(workerFile,[],{stdio:['ignore','ignore','ignore','ipc'],env:traceEnvironment()});
  child.abandoned=new Set();child.on('error',()=>{});
  child.once('exit',()=>{if(spare===child)spare=null;
    child.reply?.({ok:false,lost:Error(`history helper exited ${child.exitCode??child.signalCode}`)});
    for(const next of child.abandoned)try{fs.unlinkSync(next);}catch{}});
  return child;
}
export function history(root,cursor,backend,deadlineMs,faultFile) {
  const run=()=>query(root,cursor,backend,deadlineMs,faultFile);
  const result=queue.then(run,run);queue=result.catch(()=>{});return result;
}
function query(root,cursor,backend,deadlineMs,faultFile) {
  const next=cursor+'.'+randomUUID()+'.next';
  return new Promise((resolve,reject)=>{
    mark('history.submit',{deadlineMs});
    const worker=spare??startHelper();spare=null;
    worker.ref();worker.channel?.ref();
    let settled=false;
    const finish=(error,value)=>{
      if(settled)return;settled=true;worker.reply=null;clearTimeout(timer);
      mark('history.complete',{childPid:worker.pid,outcome:error?.code||error?.name||'ok',events:value?.length});
      if(error)worker.abandoned.add(next);
      worker.kill('SIGKILL');
      // A failed query disables history for this observer; keep no helper.
      if(!closed&&!error){spare=startHelper();spare.unref();spare.channel?.unref();}
      if(error){try{fs.unlinkSync(next);}catch{}
        reject(error);return;}
      try{fs.renameSync(next,cursor);resolve(value);}
      catch(e){try{fs.unlinkSync(next);}catch{}reject(e);}
    };
    const timer=setTimeout(()=>{
      const e=Error(`history query did not settle within ${deadlineMs} ms`);
      e.code='ETIMEDOUT';finish(e);
    },deadlineMs);
    worker.reply=message=>message.lost?finish(message.lost):message.ok?finish(null,message.changes):
      finish(Object.assign(Error(message.error),{code:message.code}));
    worker.on('message',message=>worker.reply?.(message));
    try{worker.send({root,previous:fs.existsSync(cursor)?cursor:'',next,backend,faultFile:faultFile||''});}
    catch(e){finish(e);}
  });
}
