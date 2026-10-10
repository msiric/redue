// Test-only failure diagnostics. No engine decisions, recovery, retries or writes.
import fs from 'node:fs';
import path from 'node:path';
import {readReceipts} from '../../src/state-store.mjs';
const limit=256*1024;
const issues=new Set(['start checkpoint unavailable','end checkpoint unavailable','start observation unavailable',
  'end observation unavailable','prelaunch observation unavailable','declared environment changed during execution',
  'declared state probe unavailable or changed','observer generation changed during execution',
  'input plan rebuilt during execution','declared input event occurred during execution',
  'declared inputs changed or were not observed']);
const events=new Set(['history_query_completed','history_timeout','history_unavailable','observation_gap',
  'reconciliation_started','reconciliation_completed','reconciliation_failed','plan_rebuilt','plan_validated','plan_failed']);
const phases=new Set(['initial snapshot','external initial snapshot','root replay','external replay']);
const timingPhases=new Set(['cli.start_checkpoint','cli.end_checkpoint','cli.prelaunch_checkpoint','cli.probe',
  'cli.compiler_execution','cli.run_total','history.submit','history.complete','history.worker_loaded',
  'history.snapshot_start','history.snapshot_complete','history.events_complete','server.request_received',
  'server.decision_start','server.request_complete','daemon.request_catch_up','daemon.request_probes',
  'daemon.request_total','daemon.probe_launch','daemon.probe_complete','daemon.probe_context_validation']);
const integer=value=>Number.isSafeInteger(value)&&value>=0?value:null;
function boundedLines(file){
  let fd;try{const before=fs.lstatSync(file);if(!before.isFile()||before.isSymbolicLink()||before.size>limit)return [];
    fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|(fs.constants.O_NONBLOCK||0));
    const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.dev!==before.dev||stat.ino!==before.ino||stat.size>limit)return [];
    const bytes=Buffer.alloc(stat.size);if(fs.readSync(fd,bytes,0,bytes.length,0)!==bytes.length)return [];
    return bytes.toString('utf8').split('\n').filter(Boolean).slice(-512);
  }catch{return [];}finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function summarizeCheckpointBaseline({baseline,receipt,journal=[],timings=[]}){
  const generations=new Map(),requests=new Map(),ordinal=(map,value)=>{
    if(typeof value!=='string'||!/^[a-f0-9-]{36}$/i.test(value))return null;
    if(!map.has(value))map.set(value,map.size+1);return map.get(value);
  };
  return {freshness:['CURRENT','STALE','UNVERIFIED'].includes(baseline?.freshness)?baseline.freshness:'UNKNOWN',
    result:['PASS','FAIL'].includes(receipt?.result)?receipt.result:null,stable:receipt?.stable===true,
    invocation_status:['exited','interrupted','start_failed'].includes(receipt?.invocation?.status)?receipt.invocation.status:null,
    checkpoint:{status:['stable','unavailable_or_changed'].includes(receipt?.checkpoint?.status)?receipt.checkpoint.status:null,
      start_revision:integer(receipt?.checkpoint?.startRevision),end_revision:integer(receipt?.checkpoint?.endRevision),
      issues:(Array.isArray(receipt?.checkpoint?.issues)?receipt.checkpoint.issues:[]).slice(0,32).map(value=>issues.has(value)?value:'OTHER_PRIVATE_ISSUE')},
    events:journal.slice(-64).filter(row=>events.has(row?.kind)).map(row=>({kind:row.kind,
      generation:ordinal(generations,row.generation),phase:phases.has(row.phase)?row.phase:null,
      deadline_ms:integer(row.deadline_ms),events:integer(row.events)})),
    timings:timings.slice(-512).filter(row=>timingPhases.has(row?.phase)).map(row=>({phase:row.phase,
      request:ordinal(requests,row.request),generation:ordinal(generations,row.generation),
      ms:typeof row.ms==='number'&&Number.isFinite(row.ms)&&row.ms>=0&&row.ms<=120000?row.ms:null,
      deadline_ms:integer(row.deadlineMs),available:[0,1].includes(row.available)?row.available:null,
      healthy:typeof row.healthy==='boolean'?row.healthy:null,history_disabled:typeof row.historyDisabled==='boolean'?row.historyDisabled:null}))};
}
export function checkpointBaselineDiagnostics(f,baseline){
  let receipt=null;try{receipt=readReceipts(f.state).checks.typecheck;}catch{}
  const parse=lines=>lines.flatMap(line=>{try{return [JSON.parse(line.replace(/^REDUE_TIMING /,''))];}catch{return [];}});
  return summarizeCheckpointBaseline({baseline,receipt,journal:parse(boundedLines(path.join(f.state,'events.jsonl'))),
    timings:parse(boundedLines(path.join(f.state,'checkpoint-timing.jsonl')))});
}
