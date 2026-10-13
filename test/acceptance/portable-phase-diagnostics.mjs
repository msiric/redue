// Test-oriented projection of the existing opt-in profiler. No diagnostic is
// applicability evidence. Only fixed phase names and numeric counts leave CI.
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
const phases=new Set(['portable_probe.launch','portable_probe.complete','direct_probe.implementation',
  'portable_probe.runtime_start','portable_probe.runtime_complete','portable_probe.discovery_start','portable_probe.discovery_complete',
  'portable_runtime.start','portable_runtime.node_complete','portable_runtime.helper_complete','portable_runtime.openssl_complete',
  'portable_runtime.cache_complete','portable_runtime.complete','portable_cache.start','portable_cache.members',
  'portable_cache.member_start','portable_cache.progress','portable_cache.member_complete','portable_cache.complete']);
const numbers=['at','pid','ms','deadlineMs','available','timedOut','queries','loadedImages','members','totalBytes',
  'member','bytes','completedBytes','readMs','hashMs'];
export function summarizePortablePhases(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length>1024*1024)return {available:false,reason:'DIAGNOSTICS_UNAVAILABLE',rows:[]};
  const lines=bytes.toString('utf8').split('\n');
  if(lines.length>4096)return {available:false,reason:'DIAGNOSTICS_UNAVAILABLE',rows:[]};
  const rows=[];
  for(const line of lines){
    if(!line.startsWith('REDUE_TIMING '))continue;
    let source;try{source=JSON.parse(line.slice(13));}catch{continue;}
    if(!source||!phases.has(source.phase))continue;
    if(rows.length===512)return {available:false,reason:'DIAGNOSTICS_UNAVAILABLE',rows:[]};
    const row={phase:source.phase};
    if(typeof source.monoNs==='string'&&/^\d{1,24}$/.test(source.monoNs))row.monoNs=source.monoNs;
    if(typeof source.work==='string'&&/^[a-f0-9-]{36}$/.test(source.work))row.work=source.work;
    for(const key of numbers)if(typeof source[key]==='number'&&Number.isFinite(source[key])&&source[key]>=0)row[key]=source[key];
    rows.push(row);
  }
  return {available:rows.length>0,reason:rows.length?null:'DIAGNOSTICS_UNAVAILABLE',
    context:'instrumented controlled CI invocation; diagnostic flags present, verification environment otherwise preserved',rows};
}
export function readPortablePhases(file){
  try{return summarizePortablePhases(readBoundedPortableFile(file,{limit:1024*1024}));}
  catch{return {available:false,reason:'DIAGNOSTICS_UNAVAILABLE',rows:[]};}
}

// Pure, bounded readback of one engineering launcher build. The caller owns
// secure file collection; neither a complete log nor its outcomes grant authority.
const launcherParts=['build','dependencies','assets_currency','source_currency','copies_currency','boundary',
  'source_current','binary_current','final_roots','final_new_rows','tool_proposal','new_paths_absent',
  'source_create','source_read','output_absent','source_named','compiler','output_read'];
const launcherPhases=new Set(launcherParts.flatMap(p=>['before','after'].map(e=>`launcher_${p}_${e}`)));
const launcherCounts=['dispatchAttempts','dispatchResults','observedProcesses','completed','sourceWriteAttempts','sourceWriteCompleted'];
const launcherOutcomes=new Set(['BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED','SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',
  'COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED','LAUNCHER_BUILT_NOT_EXECUTED','UNKNOWN']);
const launcherSignals=new Set(['UNKNOWN','SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGILL','SIGINT']);
const launcherPair=p=>[`launcher_${p}_before`,`launcher_${p}_after`];
const launcherDependencies=['launcher_dependencies_before',...launcherPair('assets_currency'),...launcherPair('source_currency'),
  ...launcherPair('copies_currency'),'launcher_dependencies_after'];
const launcherBoundary=['launcher_boundary_before',...launcherDependencies,'launcher_boundary_after'];
// Exact reviewed successful instrumentation path. Losing both ends of a nested
// interval must not turn a shorter, balanced log into complete collection.
const launcherSequence=['launcher_build_before',...launcherDependencies,...launcherBoundary,...launcherPair('tool_proposal'),
  ...launcherBoundary,...launcherPair('new_paths_absent'),...launcherPair('source_create'),...launcherPair('source_read'),
  ...launcherBoundary,...launcherPair('source_current'),...launcherPair('output_absent'),...launcherBoundary,
  ...launcherPair('source_named'),...launcherPair('compiler'),...launcherPair('output_read'),
  ...launcherBoundary,...launcherPair('source_current'),...launcherPair('binary_current'),
  ...launcherBoundary,...launcherPair('source_current'),...launcherPair('binary_current'),
  ...launcherBoundary,...launcherPair('final_roots'),...launcherPair('final_new_rows'),'launcher_build_after'];
export function summarizeSealedLauncherPhases(bytes){
  const rows=[],stack=[];let valid=true,prior=null,pid=null;
  const result=()=>({scope:'ENGINEERING_LAUNCHER_DIAGNOSTICS_ONLY',collection:valid&&stack.length===0&&rows.length===launcherSequence.length&&
    rows.every((row,i)=>row.phase===launcherSequence[i])?'COMPLETE':'UNKNOWN',
    available:rows.length>0,rows,authority:false,sealed:false,reuseEligible:false});
  if(!Buffer.isBuffer(bytes)||bytes.length>65536)return result();
  let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{return result();}
  const lines=text.split('\n');if(lines.length>257)return result();
  if(lines.at(-1)==='')lines.pop();else valid=false;
  for(const line of lines){
    try{
      if(line.length>2048||!line.startsWith('REDUE_TIMING '))throw Error();
      const raw=line.slice(13),source=JSON.parse(raw);
      // Existing logger emits flat JSON.stringify records. Exact roundtrip also
      // rejects duplicate keys, alternate numeric spellings and trailing data.
      if(!source||Array.isArray(source)||JSON.stringify(source)!==raw||!launcherPhases.has(source.phase))throw Error();
      const allowed=new Set(['phase','at','monoNs','pid','ms','rssMiB','request','generation','work',
        ...launcherCounts,'status','signal','spawnError','outcome']);
      if(Object.keys(source).some(k=>!allowed.has(k))||typeof source.monoNs!=='string'||!/^\d{1,24}$/.test(source.monoNs)||
        !Number.isSafeInteger(source.pid)||source.pid<=0)throw Error();
      const mono=BigInt(source.monoNs);if(prior!==null&&mono<prior||pid!==null&&pid!==source.pid)throw Error();
      const row={phase:source.phase,monoNs:source.monoNs,pid:source.pid};
      for(const key of ['request','generation','work'])if(Object.hasOwn(source,key)&&
        (typeof source[key]!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(source[key])))throw Error();
      for(const key of ['at','ms','rssMiB'])if(Object.hasOwn(source,key)&&
        (typeof source[key]!=='number'||!Number.isFinite(source[key])||source[key]<0))throw Error();
      for(const key of launcherCounts)if(Object.hasOwn(source,key)){
        if(!Number.isInteger(source[key])||source[key]<0||source[key]>1)throw Error();row[key]=source[key];}
      if(launcherCounts.slice(0,3).every(k=>Object.hasOwn(source,k))&&
        !(source.observedProcesses<=source.dispatchResults&&source.dispatchResults<=source.dispatchAttempts))throw Error();
      if(Object.hasOwn(source,'status')){if(source.status!==null&&(!Number.isInteger(source.status)||source.status<0||source.status>255))throw Error();row.status=source.status;}
      if(Object.hasOwn(source,'signal')){if(source.signal!==null&&!launcherSignals.has(source.signal))throw Error();row.signal=source.signal;}
      if(Object.hasOwn(source,'spawnError')){if(!['NONE','UNKNOWN'].includes(source.spawnError))throw Error();row.spawnError=source.spawnError;}
      if(Object.hasOwn(source,'outcome')){if(!launcherOutcomes.has(source.outcome))throw Error();row.outcome=source.outcome;}
      const part=source.phase.slice(9).replace(/_(before|after)$/,'');
      if(source.phase.endsWith('_before'))stack.push(part);else if(stack.pop()!==part)valid=false;
      rows.push(row);prior=mono;pid=source.pid;
    }catch{valid=false;break;}
  }
  return result();
}
