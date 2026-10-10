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
