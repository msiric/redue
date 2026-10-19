// The direct test recipe's guard. A recorded test run treats the whole
// checkout as its inputs (the plan), so the recorder (test-recorder.cjs) only
// has to show that the run used nothing else: no excluded or unobserved file
// content, nothing outside the project but lookups that can be asked again,
// no network, no environment variable outside the compared list, and no
// process that escaped the recorder.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import micromatch from './glob.mjs';
import {runFact} from './direct-run-certificate.mjs';
import {queryAnswer} from './typescript-list.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
export const testRecorder=fileURLToPath(new URL('test-recorder.cjs',import.meta.url));
// Compared by the caller-context machinery: a change makes a result STALE.
export const testEnvironment={variables:['TZ','LANG','CI','FORCE_COLOR','NO_COLOR'],
  prefixes:['NODE_','LC_','VITE_','VITEST_','JEST_','DYLD_','LD_'],executableIdentity:true};
// Variables that change only how output looks. Color switches are compared
// instead: snapshots can capture colored output.
export const presentationVariables=['TERM','TERM_PROGRAM','TERM_PROGRAM_VERSION','COLORTERM',
  'FORCE_TTY','COLUMNS','LINES','AI_AGENT','REDUE_RUN_RECORD'];
const issueLimit=20,factLimit=10000;

// The guard file the recorder reads: where to write, what counts as the
// checkout and as temporary space, and digests of the caller's environment.
export function testGuardConfig(dir,root,env=process.env) {
  const tmp=[...new Set([path.resolve(os.tmpdir()),fs.realpathSync(os.tmpdir())])];
  return {schema:1,dir,root,tmp,
    env:Object.fromEntries(Object.entries(env).filter(([,value])=>typeof value==='string').map(([key,value])=>[key,digest(value)]))};
}

// The environment a recorded run starts with: the caller's, plus the preload.
// Node splits NODE_OPTIONS on spaces and honours double quotes.
export function recordedEnvironment(guardFile,env=process.env) {
  const preload=`--require "${testRecorder.replace(/["\\]/g,'\\$&')}"`;
  return {...env,NODE_OPTIONS:env.NODE_OPTIONS?`${env.NODE_OPTIONS} ${preload}`:preload,REDUE_RUN_RECORD:guardFile};
}

// What the run used beyond its observed inputs. `files` maps each observed
// input (relative path) at the start checkpoint to its digest; `runner` is the
// PID of the process REDUE started. Returns {issues, runFacts, environmentUnset}.
export function testRunGuard(dir,{root,sourcePatterns,files,runner,environment=testEnvironment}) {
  // The recipe's variables and any the project declares are compared, not guarded.
  const compared=name=>(environment.variables||[]).includes(name)||
    (environment.prefixes||[]).some(prefix=>name.toLowerCase().startsWith(prefix.toLowerCase()));
  const issues=[],add=issue=>{if(!issues.includes(issue))issues.push(issue);};
  const positive=sourcePatterns.filter(p=>!p.startsWith('!')).map(p=>micromatch.matcher(p,{dot:true}));
  const negative=sourcePatterns.filter(p=>p.startsWith('!')).map(p=>micromatch.matcher(p.slice(1),{dot:true}));
  const included=rel=>positive.some(fn=>fn(rel))&&!negative.some(fn=>fn(rel));
  const observed=rel=>Object.hasOwn(files||{},rel);
  const headers=new Map(),records=[];
  let names=[];
  try{names=fs.readdirSync(dir).filter(name=>name.endsWith('.jsonl'));}
  catch{return {issues:['the run record is unavailable'],runFacts:[],environmentUnset:[]};}
  for(const name of names){
    let rows;
    try{rows=fs.readFileSync(path.join(dir,name),'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));}
    catch{add('a run record is unreadable');continue;}
    const header=rows[0]?.[0]==='H'?rows[0][1]:null;
    if(!header||!Number.isSafeInteger(header.pid)||!Number.isSafeInteger(header.threadId)){add('a run record is unreadable');continue;}
    headers.set(`${header.pid}-${header.threadId}`,header);
    records.push({header,rows:rows.slice(1)});
  }
  if(!headers.has(`${runner}-0`))add('the test runner did not load the REDUE recorder');
  // Answers per question; a question answered two ways changed during the run.
  const answers=new Map(),ask=(key,answer)=>{const set=answers.get(key)||new Set();set.add(JSON.stringify(answer));answers.set(key,set);};
  const reads=new Map(),produced=new Set(),created=new Set(),unset=new Set(),spawned=new Map();
  for(const {header,rows} of records){
    for(const row of rows){
      const [kind,...value]=Array.isArray(row)?row:[];
      if(kind==='U')add(`recorder: ${value[0]}`);
      else if(kind==='R')reads.set(value[0],reads.get(value[0])||value[1]===true);
      else if(kind==='P')produced.add(path.join(root,value[0]));
      else if(kind==='M')created.add(value[0]);
      else if(kind==='L')ask(`stat\0${value[0]}`,value[1]);
      else if(kind==='D')ask(`entries\0${value[0]}`,value[1]);
      else if(kind==='O')ask(`outside-${value[0]}\0${value[1]}`,value[2]);
      else if(kind==='E'){const [name,state]=value;
        if(compared(name)||presentationVariables.includes(name))continue;
        if(state==='set')add(`read environment variable ${name}`);else unset.add(name);}
      else if(kind==='N')add(`network: ${value[0]}`);
      else if(kind==='C'||kind==='S'){
        const list=spawned.get(header.pid)||[];list.push({pid:kind==='C'?value[0]:null,file:value[kind==='C'?1:0]});
        spawned.set(header.pid,list);}
      else if(kind==='T'){if(!headers.has(`${header.pid}-${value[0]}`))add('a worker thread did not load the REDUE recorder');}
      else if(kind!=='H')add('a run record is unreadable');
    }
  }
  // Every child must be a recorded Node process: by PID when known, otherwise
  // by the number of recorded processes whose parent started it.
  for(const [parent,children] of spawned){
    const recorded=[...headers.values()].filter(h=>h.threadId===0&&h.ppid===parent);
    const unknown=children.filter(child=>child.pid===null);
    for(const child of children)if(child.pid!==null&&!recorded.some(h=>h.pid===child.pid))
      add(`started ${path.basename(child.file)}, which REDUE does not record`);
    const matched=recorded.filter(h=>!children.some(child=>child.pid===h.pid)).length;
    if(unknown.length>matched)add(`started ${path.basename(unknown[0].file)}, which REDUE does not record`);
  }
  // Inside a directory the run created. A file the run wrote excuses nothing:
  // another process may have read it before the write. Listings may differ
  // by such files (listingAfter).
  const inCreated=full=>{for(let at=path.dirname(full);;at=path.dirname(at)){if(created.has(at))return true;if(path.dirname(at)===at)return false;}};
  const madeByRun=full=>created.has(full)||inCreated(full);
  const runFacts=[];
  const checkout=rel=>path.join(root,rel);
  // File content in the checkout must be an observed input.
  for(const [rel,found] of [...reads].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    if(inCreated(checkout(rel)))continue;
    if(!included(rel))add(`read ${rel}, which the check's inputs exclude`);
    else if(found&&!observed(rel))add(`read ${rel}, which REDUE does not observe (ignored by git)`);
    // A missing file may be ignored by git, so the index would not see it appear.
    else if(!found)runFacts.push(['fileExists',checkout(rel),null]);
  }
  for(const [key,set] of [...answers].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const [question,where]=key.split('\0');
    const answer=JSON.parse([...set][0]);
    if(question==='stat'||question==='entries'){
      const full=checkout(where);
      if(madeByRun(full))continue;
      if(set.size>1){add(`${where} changed during the run`);continue;}
      if(question==='stat'){
        // Observed files and directories: the index covers them. A missing
        // path may be ignored by git, so it stays a fact.
        if(included(where)&&(answer==='d'||observed(where)))continue;
        const fact=answer==='error'||answer==='o'?null:runFact('stat',full,answer);
        if(fact)runFacts.push(fact);else add(`lookup of ${where} gave ${answer}`);
        continue;
      }
      // A listing the run itself added to or removed from is kept as it is now.
      runFacts.push(['entries',full,answer==='error'?answer:listingAfter(full,answer,file=>madeByRun(file)||produced.has(file))]);
      continue;
    }
    const kind=question.slice('outside-'.length),file=where;
    if(madeByRun(file))continue;
    if(set.size>1){add(`${file} changed during the run`);continue;}
    const fact=answer==='error'?null:kind==='stat'||kind==='realpath'?runFact(kind,file,answer):
      answer===null?['fileExists',file,null]:null;
    if(fact)runFacts.push(fact);
    else add(kind==='read'?`read ${file}, outside the project`:kind==='list'?`listed ${file}, outside the project`:
      `${kind} of ${file} outside the project gave ${answer}`);
  }
  if(runFacts.length>factLimit)add('too many lookups during the run');
  return {issues:issues.length>issueLimit?[...issues.slice(0,issueLimit),`${issues.length-issueLimit} more`]:issues,
    runFacts:runFacts.length>factLimit?[]:[...new Map(runFacts.map(f=>[JSON.stringify(f),f])).values()],
    environmentUnset:[...unset].sort()};
}
// The listing now, when it differs from the run's only by entries the run made.
function listingAfter(full,during,madeByRun){
  let now;try{now=queryAnswer('entries',full);}catch{return during;}
  const own=entries=>Array.isArray(entries)?entries.filter(([name])=>!madeByRun(path.join(full,name))):entries;
  return JSON.stringify(own(now))===JSON.stringify(own(during))?now:during;
}

