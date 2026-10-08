// Opt-in, bounded local diagnostics. Never include paths, command arguments,
// environment values, source, or probe output in a timing record.
import fs from 'node:fs';
import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID} from 'node:crypto';

const file=process.env.REDUE_DECISION_PROFILE_FILE;
export const profiling=process.env.REDUE_DECISION_PROFILE==='1'&&!!file;

const traces=new AsyncLocalStorage();
const safe=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value)?value:undefined;
const clean=value=>Object.fromEntries(['request','generation','work'].map(key=>[key,safe(value?.[key])]).filter(([,v])=>v));
let base={};
try{base=clean(JSON.parse(process.env.REDUE_PROFILE_CONTEXT||'{}'));}catch{}
export const traceContext=()=>profiling?{...base,...traces.getStore()}:{};
export function traceBase(value){if(profiling)base=clean(value);}
export const traceId=()=>randomUUID();
export const traceScope=(value,fn)=>profiling?traces.run({...traceContext(),...clean(value)},fn):fn();
export const traceEnvironment=()=>profiling?{...process.env,REDUE_PROFILE_CONTEXT:JSON.stringify(traceContext())}:process.env;
export function mark(phase,fields={}){timing(phase,performance.now(),fields);}

export function timing(phase,started,counts={}) {
  if(!profiling)return;
  const memory=process.memoryUsage();
  try{fs.appendFileSync(file,'REDUE_TIMING '+JSON.stringify({
      at:Date.now(),monoNs:process.hrtime.bigint().toString(),pid:process.pid,phase,...traceContext(),
      ms:Math.round((performance.now()-started)*10)/10,
      rssMiB:Math.round(memory.rss/1048576*10)/10,
      ...counts
    })+'\n');}
  catch{/* Diagnostics must never change probe or verification behavior. */}
}
