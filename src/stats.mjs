// `redue stats`: what REDUE did for each check, from a local log. The hook,
// `run --if-due` and recorded runs append one line each to stats-v1.jsonl in
// the project's state: a skip (with the skipped run's duration), a recorded
// run, or a check that was due (STALE or UNVERIFIED, with the reason). The log
// stays on this machine and goes away with `redue remove-state`.
import fs from 'node:fs';
import path from 'node:path';

export const statsFile=state=>path.join(state,'stats-v1.jsonl');

// Never fails the command it is called from.
export function note(state,entry){
  try{fs.appendFileSync(statsFile(state),JSON.stringify({at:Date.now(),...entry})+'\n',{mode:0o600});}catch{}
}

// A skip of `name`, from a status row that allowed it.
export const skipNote=(status,name,via)=>{
  const ms=status?.checks?.find(row=>row?.name===name)?.invocation?.durationMs;
  return {kind:'skip',check:name,via,savedMs:Number.isFinite(ms)&&ms>=0?ms:null};
};
// A check about to run because its last result does not apply, or null.
export const dueNote=(status,name)=>{
  const row=status?.observation?.healthy===true?status.checks?.find(item=>item?.name===name):null;
  return row&&row.freshness!=='CURRENT'?{kind:'due',check:name,freshness:row.freshness,reason:row.reason??null}:null;
};

// Run ids, hashes and digits in a reason say nothing about its kind.
const reasonKind=reason=>String(reason??'no reason').replace(/[0-9a-f]{8}(?:-?[0-9a-f]{4,})+|[0-9a-f]{12,}/g,'…').slice(0,160);

export function readStats(state,names=[]){
  let text='';try{text=fs.readFileSync(statsFile(state),'utf8');}catch{}
  // Configured checks first, in config order, then any the log still names.
  const checks=new Map();
  const row=name=>{let value=checks.get(name);
    if(!value)checks.set(name,value={name,skips:0,savedMs:0,runs:0,passed:0,failed:0,runMs:0,stale:0,unverified:0,reasons:{}});
    return value;};
  for(const name of names)row(name);
  let since=null;
  for(const line of text.split('\n')){
    let entry;try{entry=JSON.parse(line);}catch{continue;}
    if(typeof entry?.check!=='string')continue;
    since??=entry.at;
    const value=row(entry.check);
    if(entry.kind==='skip'){value.skips++;value.savedMs+=entry.savedMs??0;}
    else if(entry.kind==='run'){value.runs++;value.runMs+=entry.ms??0;
      if(entry.result==='PASS')value.passed++;else if(entry.result==='FAIL')value.failed++;}
    else if(entry.kind==='due'&&entry.freshness==='STALE')value.stale++;
    else if(entry.kind==='due'&&entry.freshness==='UNVERIFIED'){value.unverified++;
      const kind=reasonKind(entry.reason);value.reasons[kind]=(value.reasons[kind]??0)+1;}
  }
  const list=[...checks.values()].map(({reasons,...value})=>({...value,
    topUnverified:Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([reason,count])=>({reason,count}))}));
  return {schema:1,since:since===null?null:new Date(since).toISOString(),checks:list};
}

export const duration=ms=>!ms?'0s':ms<60_000?`${(ms/1000).toFixed(ms<10_000?1:0)}s`:
  ms<3_600_000?`${Math.floor(ms/60_000)}m ${Math.round(ms%60_000/1000)}s`:`${Math.floor(ms/3_600_000)}h ${Math.round(ms%3_600_000/60_000)}m`;

export function renderStats(value){
  if(!value.since)return 'No skips or recorded runs yet.';
  const head=['check','skips','saved','runs','pass','fail','stale','unverified'];
  const rows=value.checks.map(c=>[c.name,c.skips,duration(c.savedMs),c.runs,c.passed,c.failed,c.stale,c.unverified].map(String));
  const total=value.checks.reduce((sum,c)=>({skips:sum.skips+c.skips,savedMs:sum.savedMs+c.savedMs}),{skips:0,savedMs:0});
  const widths=head.map((h,i)=>Math.max(h.length,...rows.map(r=>r[i].length)));
  const line=r=>r.map((cell,i)=>i?cell.padStart(widths[i]):cell.padEnd(widths[i])).join('  ');
  const lines=[`Since ${value.since.slice(0,10)}: ${total.skips} skips saved ${duration(total.savedMs)}.`,'',line(head),...rows.map(line)];
  const reasons=value.checks.filter(c=>c.topUnverified.length);
  if(reasons.length){lines.push('','Why checks were UNVERIFIED when they were due:');
    for(const c of reasons)for(const r of c.topUnverified)lines.push(`  ${c.name}  ${r.count}×  ${r.reason}`);}
  lines.push('','Saved is the duration of the run each skip reused.');
  return lines.join('\n');
}
