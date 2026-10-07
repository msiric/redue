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
export function history(root,cursor,backend,deadlineMs,faultFile) {
  const next=cursor+'.'+randomUUID()+'.next';
  return new Promise((resolve,reject)=>{
    mark('history.submit',{deadlineMs});
    const worker=fork(workerFile,[root,fs.existsSync(cursor)?cursor:'',next,backend,
      faultFile||''],{stdio:['ignore','ignore','ignore','ipc'],env:traceEnvironment()});
    let settled=false,abandoned=false;
    const finish=(error,value)=>{
      if(settled)return;settled=true;mark('history.complete',{childPid:worker.pid,outcome:error?.code||error?.name||'ok',events:value?.length});clearTimeout(timer);
      worker.kill('SIGKILL');
      if(error){abandoned=true;try{fs.unlinkSync(next);}catch{}
        reject(error);return;}
      try{fs.renameSync(next,cursor);resolve(value);}
      catch(e){try{fs.unlinkSync(next);}catch{}reject(e);}
    };
    const timer=setTimeout(()=>{
      const e=Error(`history query did not settle within ${deadlineMs} ms`);
      e.code='ETIMEDOUT';finish(e);
    },deadlineMs);
    worker.on('message',message=>message.ok?finish(null,message.changes):
      finish(Object.assign(Error(message.error),{code:message.code})));
    worker.once('error',e=>finish(e));
    worker.once('exit',(code,signal)=>{
      if(abandoned)try{fs.unlinkSync(next);}catch{}
      if(!settled)finish(Error(`history helper exited ${code??signal}`));
    });
  });
}
