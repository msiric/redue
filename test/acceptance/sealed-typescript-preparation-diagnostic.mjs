// Fixed data-only preparation diagnostic. Never used as recipe authority.
// No paths, content, arguments, environments or raw errors enter the stream.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {materializeSealedTypeScriptTree} from '../../src/sealed-typescript-tree.mjs';
import {consumePreparationInput,parsePreparationInput,PREPARATION_REASON_CODES} from './sealed-typescript-preparation-child.mjs';
export const PREPARATION_DIAGNOSTIC_LIMITS=Object.freeze({frames:32,bytes:65536,intervalMs:4000});
const methods=['lstatSync','openSync','fstatSync','readSync','writeSync','fsyncSync','closeSync','mkdirSync','chmodSync','fchmodSync','symlinkSync','readlinkSync','realpathSync','opendirSync'];
const known=new Set(PREPARATION_REASON_CODES);
const round=value=>Math.round(value*1000)/1000;
const inside=(file,root)=>typeof file==='string'&&(file===root||file.startsWith(root+'/'));
export function measurePreparationOperations({root,parent},operation,emit,{clock=()=>performance.now(),io=fs}={}){
 const start=clock(),stats={source:{},stage:{},boundary:{}},fds=new Map(),restores=[];
 let valid=Number.isFinite(start)&&start>=0,previous=start,last=start,frames=0,bytes=0;
 const now=()=>{const n=clock();if(!Number.isFinite(n)||n<previous)valid=false;previous=n;return n;};
 const group=arg=>typeof arg==='number'?(fds.get(arg)||'boundary'):inside(arg,root)?'source':inside(arg,parent)?'stage':'boundary';
 const snapshot=final=>{
  const n=now();if(!valid||frames>=PREPARATION_DIAGNOSTIC_LIMITS.frames||!final&&n-last<PREPARATION_DIAGNOSTIC_LIMITS.intervalMs)return;
  const record={schema:1,scope:'PREPARATION_OPERATION_DIAGNOSTIC_ONLY',elapsedMs:round(n-start),final,stats};
  const frame=JSON.stringify(record)+'\n';if(Buffer.byteLength(frame)>PREPARATION_DIAGNOSTIC_LIMITS.bytes-bytes)return;
  bytes+=Buffer.byteLength(frame);frames++;last=n;emit(frame);
 };
 const measured=(kind,selected,call)=>{const before=now();let failed=false,result;
  try{return result=call();}catch(error){failed=true;throw error;}finally{
   const after=now(),entry=stats[selected][kind]??=(/* calls, totalMs, maxMs, errors, bytes */[0,0,0,0,0]);
   entry[0]++;if(valid){const elapsed=after-before;entry[1]=round(entry[1]+elapsed);entry[2]=Math.max(entry[2],round(elapsed));}
   if(failed)entry[3]++;else if(['readSync','writeSync'].includes(kind)&&Number.isSafeInteger(result)&&result>=0)entry[4]+=result;
   snapshot(false);
  }};
 try{
  for(const kind of methods){const original=io[kind];if(typeof original!=='function')throw Error('DIAGNOSTIC_PRIMITIVE_UNAVAILABLE');
   io[kind]=function(...args){const selected=group(args[0]);return measured(kind,selected,()=>{
    const value=original.apply(io,args);if(kind==='openSync'&&Number.isSafeInteger(value))fds.set(value,selected);
    if(kind==='closeSync')fds.delete(args[0]);
    if(kind==='opendirSync')for(const name of ['readSync','closeSync']){const originalMethod=value[name].bind(value);
     value[name]=(...callArgs)=>measured('directory'+name,selected,()=>originalMethod(...callArgs));}
    return value;});};restores.push(()=>io[kind]=original);
  }
  const result=operation();snapshot(true);return{result,clockValid:valid,frames,bytes};
 }finally{for(const restore of restores.reverse())restore();}
}
async function main(){let code=74;
 try{if(process.argv.length!==2)throw Object.assign(Error('PREPARATION_ARGUMENTS'),{code:'PREPARATION_ARGUMENTS'});
  const options=parsePreparationInput(await consumePreparationInput(process.stdin));
  const measured=measurePreparationOperations(options,()=>materializeSealedTypeScriptTree(options),frame=>process.stderr.write(frame));
  code=measured.clockValid?0:74;
  process.stdout.write(JSON.stringify({schema:1,scope:'PREPARATION_DIAGNOSTIC_ONLY',outcome:code===0?'DATA_OPERATION_FINISHED_NOT_SEALED':'UNKNOWN',
   frames:measured.frames,bytes:measured.bytes,sealed:false,reuseEligible:false})+'\n');
 }catch(error){process.stdout.write(JSON.stringify({schema:1,scope:'PREPARATION_DIAGNOSTIC_ONLY',outcome:'UNKNOWN',
   reason:known.has(error?.code)?error.code:'PREPARATION_FAILED',sealed:false,reuseEligible:false})+'\n');}
 process.exitCode=code;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
