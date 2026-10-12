// One fixed restricted diagnostic child; no materialization or recipe authority.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {preparationDataManifest,SEALED_PREPARATION_LIMITS,SEALED_PREPARATION_SIGNALS} from './sealed-typescript-preparation.mjs';
import {sealedPreparationDiagnosticProfile} from './sealed-typescript-preparation-diagnostic-profile.mjs';
import {PREPARATION_DIAGNOSTIC_LIMITS} from './sealed-typescript-preparation-diagnostic.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),fail=()=>{throw Error('DIAGNOSTIC_DATA_INVALID');};
const methods=new Set(['lstatSync','openSync','fstatSync','readSync','writeSync','fsyncSync','closeSync','mkdirSync','chmodSync','fchmodSync','symlinkSync','readlinkSync','realpathSync','opendirSync','directoryreadSync','directorycloseSync']);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
export function parsePreparationDiagnosticFrames(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>PREPARATION_DIAGNOSTIC_LIMITS.bytes)fail();
 let text;try{text=new TextDecoder('utf8',{fatal:true}).decode(bytes);}catch{fail();}
 if(!text)return [];if(!text.endsWith('\n'))fail();const lines=text.slice(0,-1).split('\n');
 if(lines.length>PREPARATION_DIAGNOSTIC_LIMITS.frames)fail();const frames=[];let previous=-1;
 for(const line of lines){let row;try{row=JSON.parse(line);}catch{fail();}
  if(JSON.stringify(row)!==line||!exact(row,['schema','scope','elapsedMs','final','stats'])||row.schema!==1||
   row.scope!=='PREPARATION_OPERATION_DIAGNOSTIC_ONLY'||!Number.isFinite(row.elapsedMs)||row.elapsedMs<previous||row.elapsedMs<0||
   typeof row.final!=='boolean'||frames.at(-1)?.final||!exact(row.stats,['source','stage','boundary']))fail();
  for(const group of ['source','stage','boundary']){
   if(!row.stats[group]||typeof row.stats[group]!=='object'||Array.isArray(row.stats[group]))fail();
   for(const [kind,values] of Object.entries(row.stats[group])){
    if(!methods.has(kind)||!Array.isArray(values)||values.length!==5||
     values.some(n=>!Number.isFinite(n)||n<0)||![0,3,4].every(i=>Number.isSafeInteger(values[i]))||values[0]<1||values[3]>values[0]||values[2]>values[1]||
     !['readSync','writeSync'].includes(kind)&&values[4]!==0)fail();
    const old=frames.at(-1)?.stats[group][kind];if(old&&values.some((n,i)=>n<old[i]))fail();
   }
   for(const kind of Object.keys(frames.at(-1)?.stats[group]||{}))if(!Object.hasOwn(row.stats[group],kind))fail();
  }
  previous=row.elapsedMs;frames.push(row);
 }return frames;
}
function binding(p){const ids=new Map();
 for(const file of [p.source,p.parent,p.node,...p.code.map(([file])=>file)])for(let current=file;;current=path.dirname(current)){
  const st=fs.lstatSync(current,{bigint:true});if(st.isSymbolicLink()||fs.realpathSync(current)!==current)fail();
  ids.set(current,['dev','ino','mode','uid'].map(k=>String(st[k])).join(':'));if(path.dirname(current)===current)break;
 }
 if(hash(fs.readFileSync(p.node))!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'||
  p.code.some(([file,sha])=>hash(fs.readFileSync(file))!==sha))fail();
 const config=path.join(p.source,'redue.config.json'),st=fs.lstatSync(config,{bigint:true});
 if(!st.isFile()||st.isSymbolicLink()||st.uid!==BigInt(process.getuid())||st.nlink!==1n||fs.realpathSync(config)!==config)fail();
 return JSON.stringify({ids:[...ids],config:hash(fs.readFileSync(config)),configIdentity:['dev','ino','mode','uid','nlink'].map(k=>String(st[k]))});
}
export function diagnoseSealedTypeScriptPreparation(options){
 const started=performance.now();let previous=started,exhausted=!Number.isFinite(started)||started<0;
 const remaining=()=>{const n=performance.now();if(exhausted||!Number.isFinite(n)||n<previous){exhausted=true;fail();}previous=n;
  const left=Math.floor(SEALED_PREPARATION_LIMITS.milliseconds-(n-started));if(!Number.isFinite(left)||left<1){exhausted=true;fail();}return left;};
 remaining();
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||
  !['source','parent','manifest'].every(k=>Object.hasOwn(options,k)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,k),'value')))fail();
 const manifest=preparationDataManifest(options.manifest),p=sealedPreparationDiagnosticProfile({source:options.source,parent:options.parent}),
  input=JSON.stringify({root:p.source,parent:p.parent,manifest});
 if(Buffer.byteLength(input)>SEALED_PREPARATION_LIMITS.inputBytes)fail();const before=binding(p);remaining();
 const child=spawnSync('/usr/bin/sandbox-exec',['-p',p.profile,p.node,p.child],{cwd:p.parent,env:{},input,timeout:remaining(),killSignal:'SIGKILL',maxBuffer:SEALED_PREPARATION_LIMITS.outputBytes});
 const signals=new Set(SEALED_PREPARATION_SIGNALS),exit=Number.isInteger(child.status)&&child.status>=0&&child.status<=255?child.status:null;
 let frames=[],collection='UNKNOWN',bindingsCurrent=false,deadline='UNKNOWN',summaryValid=false;
 try{frames=parsePreparationDiagnosticFrames(child.stderr);collection=frames.length?'STRUCTURED_METRICS_ONLY':'MISSING';}catch{}
 try{const text=new TextDecoder('utf8',{fatal:true}).decode(child.stdout),out=JSON.parse(text);
  summaryValid=JSON.stringify(out)+'\n'===text&&exact(out,['schema','scope','outcome','frames','bytes','sealed','reuseEligible'])&&
   out.schema===1&&out.scope==='PREPARATION_DIAGNOSTIC_ONLY'&&out.outcome==='DATA_OPERATION_FINISHED_NOT_SEALED'&&
   out.frames===frames.length&&out.bytes===child.stderr.length&&out.sealed===false&&out.reuseEligible===false;
 }catch{}
 try{bindingsCurrent=binding(p)===before;}catch{}
 try{remaining();deadline='WITHIN_LIMIT';}catch{deadline='EXCEEDED_OR_UNKNOWN';}
 // Raw stderr/stdout/spawn errors never leave this fixed diagnostic boundary.
 const result={schema:1,scope:'PREPARATION_DIAGNOSTIC_ONLY',outcome:'UNKNOWN',sealing:'NOT_TESTED',reuseEligible:false,
  diagnosticOperationFinished:summaryValid&&exit===0&&!child.signal&&!child.error&&bindingsCurrent&&deadline==='WITHIN_LIMIT'&&frames.at(-1)?.final===true,
  childExit:exit,childSignal:child.signal===null?null:signals.has(child.signal)?child.signal:'UNKNOWN_SIGNAL',
  childReaped:Number.isInteger(child.pid)&&child.pid>0&&(exit!==null||signals.has(child.signal)),
  frames,collection,summaryValid,bindingsCurrent,deadline,elapsedMs:Number.isFinite(previous-started)?previous-started:null,
  profileSha256:p.sha256,code:p.code,partialStageDisposition:'RETAINED',compilerExecutions:0,models:0};
 const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 freeze(result);
 try{remaining();return Object.freeze({...result,elapsedMs:previous-started});}
 catch{return Object.freeze({...result,diagnosticOperationFinished:false,deadline:'EXCEEDED_OR_UNKNOWN',elapsedMs:null});}
}
