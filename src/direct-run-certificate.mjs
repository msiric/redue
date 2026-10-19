// A caller validates discovery, never an execution outcome. No persistent cache.
// The direct compiler run records the answers it received (run-recorder.cjs);
// those answers, not a separate probe, show it consumed the certified inputs.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {timing} from './decision-profile.mjs';
import {directCompiler,directContextHash,directEnvironmentIssue,directProbeOutput,directProbeValue} from './direct-typescript.mjs';
import {withinPath} from './path-identity.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
// Whether a direct run is recorded at all: on macOS and Linux, always, so its
// run facts are known even when full probes check it.
export function directRunRecordable(selected) {
  return ['darwin','linux'].includes(process.platform)&&selected.qualification==='npm-typescript-direct-v1'&&
    selected.probes?.length===1&&
    selected.probes[0][1]===fileURLToPath(new URL('direct-typescript-probe.mjs',import.meta.url));
}
// Whether a recorded run may replace the probes (tests can force full probes).
export function directRunCertificateAllowed(selected) {
  return directRunRecordable(selected)&&
    !(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_FULL_RUN_PROBES==='1');
}
// The incremental build-info file the plan leaves out of the inputs, if any.
export const buildInfoPath=plan=>typeof plan?.buildInfo==='string'?path.join(plan.root,plan.buildInfo):null;
// The start snapshot's discovery certificate, checked without a child process.
// Returns what a recorded run is compared against, or null for full probes.
export function directRunCertificate(plan,selected,snapshot,root) {
  const started=performance.now(),c=snapshot?.discoveryCertificate;
  const fallback=reason=>{timing('cli.run_certificate',started,{outcome:'fallback',reason});return null;};
  if(!directRunCertificateAllowed(selected))return fallback('unsupported');
  if(!snapshot?.observationHealthy||!c||c.schema!==2||c.planId!==plan.id||
    c.planId!==snapshot.planId||c.cwd!==plan.cwd||
    c.probeDefinition!==hash(JSON.stringify(selected.probes))||
    ![c.output,c.context,c.stderrHash].every(s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s))||
    typeof c.queryData!=='string'||c.queryData.length>1024*1024)
    return fallback('certificate_unavailable');
  // The compile runs in this process's environment; the daemon's is never substituted.
  if(directEnvironmentIssue())return fallback('environment_unsupported');
  try{
    const argv=selected.probes[0];
    const value=directProbeValue(argv,c.output,c.stderrHash);
    if(value!==snapshot.probeHash)return fallback('probe_identity_changed');
    // Bytes were verified by the daemon's full probe; its toolchain identity
    // check at the start and end snapshots covers later changes.
    const compiler=directCompiler(root,{verify:false});
    if(selected.command[1]!==compiler.entry)return fallback('command_unsupported');
    const queries=JSON.parse(inflateSync(Buffer.from(c.queryData,'base64'),{maxOutputLength:8*1024*1024}));
    if(!Array.isArray(queries)||!queries.length)return fallback('certificate_invalid');
    timing('cli.run_certificate',started,{outcome:'available',queries:queries.length});
    return {value,queries,context:c.context,compiler,buildInfo:buildInfoPath(plan)};
  }catch{return fallback('certificate_invalid');}
}
// The last probe's questions, sent for a run checked by full probes. They only
// show which of the run's lookups are run facts; the full probes, not these,
// establish the result.
export function probeQuestions(plan,selected,snapshot,root) {
  const q=snapshot?.probeQuestions;
  if(!directRunRecordable(selected)||typeof q?.queryData!=='string'||
    q.queryData.length>1024*1024||typeof q.context!=='string')return null;
  try{const queries=JSON.parse(inflateSync(Buffer.from(q.queryData,'base64'),{maxOutputLength:8*1024*1024}));
    if(!Array.isArray(queries)||!queries.length)return null;
    return {queries,context:q.context,compiler:directCompiler(root,{verify:false}),buildInfo:buildInfoPath(plan)};}
  catch{return null;}
}
// Without a start certificate, the daemon may offer to build one from this run's
// recording at the end checkpoint. Returns its token, or null for full probes.
export function directRunRecording(plan,selected,snapshot,root) {
  const token=snapshot?.recordedCertificate;
  if(!directRunCertificateAllowed(selected)||!snapshot.observationHealthy||
    typeof token!=='string'||!/^[0-9a-f-]{36}$/.test(token)||snapshot.planId!==plan.id||directEnvironmentIssue())
    return null;
  try{if(selected.command[1]!==directCompiler(root,{verify:false}).entry)return null;}catch{return null;}
  return token;
}
// Answers derived from a recorded raw listing, exactly as queryAnswer computes them.
function derived(kind,entries,options) {
  if(entries===null)return null;
  if(kind==='entries')return entries.map(([name,type])=>[name,type==='d'?'d':type==='l'?'l':'f']).sort();
  const resolved=entries.flatMap(([name,type,target])=>type!=='l'?[[name,type]]:target?[[name,target]]:[]);
  if(kind==='directories'){
    if(entries.some(([,type,target])=>type==='l'&&!target))return null;
    return resolved.filter(([,type])=>type==='d').map(([name])=>name).sort();
  }
  const suffixes=options?.extensions?.map(value=>value.toLowerCase());
  return resolved.flatMap(([name,type])=>type==='d'?[[name,'d']]:
    type==='f'&&(!suffixes||suffixes.some(value=>name.toLowerCase().endsWith(value)))?[[name,'f']]:[]).sort();
}
// What one certificate fact says about a recorded stat answer: true, false, or
// null when it says nothing. A parent listing that does not name the path only
// rules some answers out, so it must agree but does not count as cover.
function statAgrees([kind,file,answer,options],target,result) {
  if(file===target){
    // queryAnswer reports a missing path as null, not false.
    if(answer===null)return ['fileExists','directoryExists','readFile'].includes(kind)?result===null:null;
    if(kind==='fileExists')return result!==null&&(result==='f')===answer;
    if(kind==='directoryExists')return result!==null&&(result==='d')===answer;
    if(kind==='readFile')return result==='f';
    return null;
  }
  if(file!==path.dirname(target)||!Array.isArray(answer))return null;
  const name=path.basename(target);
  if(kind==='directories')return answer.includes(name)?result==='d':result==='d'?false:undefined;
  if(kind==='entries'){const entry=answer.find(row=>row[0]===name);
    return !entry?result===null:entry[1]==='l'?null:entry[1]===result;}
  if(kind==='listing'){const entry=answer.find(row=>row[0]===name);
    if(entry)return entry[1]===result;
    const suffixes=options?.extensions?.map(value=>value.toLowerCase());
    const listed=!suffixes||suffixes.some(value=>name.toLowerCase().endsWith(value));
    return result==='d'||listed&&result==='f'?false:undefined;}
  return null;
}
const withinCompiler=compiler=>file=>withinPath(file,compiler.tsRoot)||
  file!==compiler.entry&&file.toLowerCase()===compiler.entry.toLowerCase();
// The certificate question that asks again what a run's stat, realpath or
// package.json read answered, in queryAnswer's terms; null when it cannot be asked again.
function runFact(kind,file,answer) {
  if(kind==='stat')return answer===null||answer==='f'?['fileExists',file,answer&&true]:
    answer==='d'?['directoryExists',file,true]:null;
  if(kind==='realpath')return answer===null||typeof answer==='string'?['realpath',file,answer]:null;
  // Declaration checks read the package.json of each dependency they resolve.
  // Its content hash is asked again like any other run fact; other reads are not.
  if(kind==='read'&&path.basename(file)==='package.json')
    return answer===null||typeof answer==='string'?['readFile',file,answer]:null;
  return null;
}
// Null when every answer the run received agrees with the certified state,
// otherwise why not. The compiler is deterministic given its context and its
// answers, so a run whose answers all agree computed the certified result.
// Each answer needs at least one certificate fact about it. Paths inside the
// compiler tree are covered by the daemon's toolchain identity instead. tsc
// also stats a case-swapped copy of its own path to detect case sensitivity;
// only that one stat is exempt.
// With a `facts` array, a stat or realpath the probe never asked about is
// added to it instead (declaration diagnostics resolve module paths that
// building the program does not), as is a read of a package.json. The receipt
// keeps those run facts, and status asks them again before every CURRENT
// answer. Any other uncovered read, and any directory listing, is an issue.
// The record's facts without the build-info file an incremental run reads and
// writes, or {issue} when the run wrote anything else. That file is compiler
// state, not an input. A directory tsc created for it was missing when tsc
// checked it, so that check goes too; every other check stays.
export function withoutBuildInfo(facts,buildInfo) {
  const created=new Set(facts.filter(([kind])=>kind==='mkdir').map(([,file])=>file));
  for(const [kind,file] of facts){
    if(kind==='write'&&file!==buildInfo)return {issue:`the compiler wrote ${file}`};
    if(kind==='mkdir'&&!buildInfo?.startsWith(file+path.sep))return {issue:`the compiler created ${file}`};
  }
  return {facts:facts.filter(([kind,file])=>kind!=='write'&&kind!=='mkdir'&&file!==buildInfo&&
    !(kind==='stat'&&created.has(file)))};
}
export function runRecordIssue(record,certificate,runFacts=null) {
  if(record?.schema!==1||!Array.isArray(record.facts))return 'record unavailable';
  if(record.unsupported)return `unsupported ${record.unsupported}`;
  if(record.conflict)return `answer changed during the run: ${record.conflict}`;
  const {compiler,queries}=certificate,kept=withoutBuildInfo(record.facts,certificate.buildInfo||null);
  if(kept.issue)return kept.issue;
  if(record.main!==compiler.entry||!Array.isArray(record.node)||
    directContextHash(compiler,record.node)!==certificate.context)return 'execution context changed';
  const inCompiler=withinCompiler(compiler);
  const facts=new Map();
  for(const query of queries){if(!facts.has(query[1]))facts.set(query[1],[]);facts.get(query[1]).push(query);}
  for(const [kind,file,answer] of kept.facts){
    if(inCompiler(file))continue;
    const known=facts.get(file)||[];
    let checks=[];
    if(kind==='read')checks=known.filter(q=>q[0]==='readFile')
      .map(q=>JSON.stringify(q[2])===JSON.stringify(answer));
    else if(kind==='realpath')checks=known.filter(q=>q[0]==='realpath')
      .map(q=>q[2]===answer);
    else if(kind==='readdir')checks=known.filter(q=>['listing','directories','entries'].includes(q[0]))
      .map(q=>JSON.stringify(derived(q[0],answer,q[3]))===JSON.stringify(q[2]));
    else if(kind==='stat')checks=[...known,...(facts.get(path.dirname(file))||[])]
      .map(q=>statAgrees(q,file,answer)).filter(value=>value!==null);
    else return `unknown answer ${kind}`;
    if(!checks.some(value=>value!==undefined)){
      const fact=runFacts&&runFact(kind,file,answer);
      if(fact){runFacts.push(fact);continue;}
      return `${kind} ${file} is not in the discovery certificate`;
    }
    if(checks.includes(false))return `${kind} ${file} differs from the discovery certificate`;
    // Covered only by a listing of its directory: a later probe may keep the
    // same program while that listing changes, so the run's own lookup stays
    // a run fact.
    if(kind==='stat'&&runFacts&&!known.length){const fact=runFact(kind,file,answer);if(fact)runFacts.push(fact);}
  }
  return null;
}
// Compares the record run-recorder.cjs wrote to fd 3. Run facts go to `facts`.
export function validateRunRecord(text,certificate,facts=[]) {
  const started=performance.now();
  let record=null;
  try{record=JSON.parse(text);}catch{}
  let issue;
  try{issue=runRecordIssue(record,certificate,facts);}catch{issue='record unreadable';}
  timing('cli.run_recording',started,{outcome:issue?'rejected':'validated',
    facts:record?.facts?.length||0,runFacts:facts.length,...(issue?{reason:issue}:{})});
  return issue;
}
// A certificate for the current inputs, built from a recorded run and the
// certificate of the last full probe, or {issue}. The run must read the same
// files, with the same configuration, and every answer it received must be
// covered by the old questions or be a run fact; only file contents may differ.
// Run facts stay out of this certificate: the receipt keeps them, and status
// asks them again for every answer. The program
// layout is then the same, so the output is rebuilt as the probe computes it.
// Limit: a file whose role changes (a package.json newly imported as a module)
// keeps its old role, so a later full probe can report the check STALE.
export function recordedCertificate(text,cache,compiler,buildInfo=null) {
  let record=null;
  try{record=JSON.parse(text);}catch{}
  if(record?.schema!==1||!Array.isArray(record.facts))return {issue:'record unavailable'};
  if(!cache?.layout||!cache.queries?.length)return {issue:'no previous layout'};
  const kept=withoutBuildInfo(record.facts,buildInfo);
  if(kept.issue)return {issue:kept.issue};
  const inCompiler=withinCompiler(compiler),reads=new Map();
  const before=new Map(cache.queries.filter(q=>q[0]==='readFile'&&!inCompiler(q[1])).map(q=>[q[1],q[2]]));
  for(const [kind,file,answer] of kept.facts)if(kind==='read'&&!inCompiler(file)){
    if(answer!==null&&typeof answer!=='string')return {issue:`read ${file} failed`};
    // A package.json only declaration checks read is a run fact, not a program read.
    if(!before.has(file)&&path.basename(file)==='package.json')continue;
    reads.set(file,answer);
  }
  if(reads.size!==before.size||[...before.keys()].some(file=>!reads.has(file)))
    return {issue:'the run read different files'};
  if(cache.layout.configs.some(([file])=>!reads.has(file)||reads.get(file)!==before.get(file)))
    return {issue:'configuration changed'};
  // Lib files are in the compiler tree: their bytes are covered by its identity,
  // but which of them the program loads must not change.
  const libs=list=>[...new Set(list.filter(file=>inCompiler(file)&&file.endsWith('.d.ts')))].sort();
  if(!Array.isArray(record.compilerReads)||JSON.stringify(libs(record.compilerReads))!==
    JSON.stringify(libs(cache.queries.filter(q=>q[0]==='readFile').map(q=>q[1]))))
    return {issue:'the run loaded different lib files'};
  const changed=new Set([...reads].filter(([file,answer])=>before.get(file)!==answer).map(([file])=>file));
  const queries=cache.queries.map(q=>q[0]==='readFile'&&changed.has(q[1])?[q[0],q[1],reads.get(q[1]),...q.slice(3)]:q);
  // Run facts belong to the receipt, which the caller builds; they do not
  // change the program layout.
  const issue=runRecordIssue({...record,facts:kept.facts},{compiler,queries,context:cache.context},[]);
  if(issue)return {issue};
  const files=[];
  for(const [file,digest] of cache.layout.files){
    if(!changed.has(file)){files.push([file,digest]);continue;}
    let bytes;
    try{bytes=fs.readFileSync(file);}catch{return {issue:`${file} unreadable`};}
    // The same answer the compiler received (queryAnswer's readFile).
    if(hash(JSON.stringify(bytes.toString('utf8')))!==reads.get(file))return {issue:`${file} changed after the run`};
    files.push([file,hash(bytes)]);
  }
  const layout={...cache.layout,files};
  return {queries,layout,output:directProbeOutput(layout),changed};
}
