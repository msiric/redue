// A caller validates discovery, never an execution outcome. No persistent cache.
// The direct compiler run records the answers it received (run-recorder.cjs);
// those answers, not a separate probe, show it consumed the certified inputs.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {timing} from './decision-profile.mjs';
import {directCompiler,directContextHash,directEnvironmentIssue} from './direct-typescript.mjs';
import {withinPath} from './path-identity.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function directRunCertificateAllowed(selected) {
  return ['darwin','linux'].includes(process.platform)&&selected.qualification==='npm-typescript-direct-v1'&&
    selected.probes?.length===1&&
    selected.probes[0][1]===fileURLToPath(new URL('direct-typescript-probe.mjs',import.meta.url))&&
    !(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_FULL_RUN_PROBES==='1');
}
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
    typeof c.queryData!=='string'||c.queryData.length>512*1024)
    return fallback('certificate_unavailable');
  // The compile runs in this process's environment; the daemon's is never substituted.
  if(directEnvironmentIssue())return fallback('environment_unsupported');
  try{
    const argv=selected.probes[0];
    const value=hash(JSON.stringify([[argv,0,hash(c.output),c.stderrHash]]));
    if(value!==snapshot.probeHash)return fallback('probe_identity_changed');
    // Bytes were verified by the daemon's full probe; its toolchain identity
    // check at the start and end snapshots covers later changes.
    const compiler=directCompiler(root,{verify:false});
    if(selected.command[1]!==compiler.entry)return fallback('command_unsupported');
    const queries=JSON.parse(inflateSync(Buffer.from(c.queryData,'base64'),{maxOutputLength:8*1024*1024}));
    if(!Array.isArray(queries)||!queries.length)return fallback('certificate_invalid');
    timing('cli.run_certificate',started,{outcome:'available',queries:queries.length});
    return {value,queries,context:c.context,compiler};
  }catch{return fallback('certificate_invalid');}
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
// Null when every answer the run received agrees with the certified state,
// otherwise why not. The compiler is deterministic given its context and its
// answers, so a run whose answers all agree computed the certified result.
// Each answer needs at least one certificate fact about it. Paths inside the
// compiler tree are covered by the daemon's toolchain identity instead. tsc
// also stats a case-swapped copy of its own path to detect case sensitivity;
// only that one stat is exempt.
export function runRecordIssue(record,certificate) {
  if(record?.schema!==1||!Array.isArray(record.facts))return 'record unavailable';
  if(record.unsupported)return `unsupported ${record.unsupported}`;
  if(record.conflict)return `answer changed during the run: ${record.conflict}`;
  const {compiler,queries}=certificate;
  if(record.main!==compiler.entry||!Array.isArray(record.node)||
    directContextHash(compiler,record.node)!==certificate.context)return 'execution context changed';
  const inCompiler=file=>withinPath(file,compiler.tsRoot)||
    file!==compiler.entry&&file.toLowerCase()===compiler.entry.toLowerCase();
  const facts=new Map();
  for(const query of queries){if(!facts.has(query[1]))facts.set(query[1],[]);facts.get(query[1]).push(query);}
  for(const [kind,file,answer] of record.facts){
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
    if(!checks.some(value=>value!==undefined))return `${kind} ${file} is not in the discovery certificate`;
    if(checks.includes(false))return `${kind} ${file} differs from the discovery certificate`;
  }
  return null;
}
// Compares the record run-recorder.cjs wrote to fd 3.
export function validateRunRecord(text,certificate) {
  const started=performance.now();
  let record=null;
  try{record=JSON.parse(text);}catch{}
  let issue;
  try{issue=runRecordIssue(record,certificate);}catch{issue='record unreadable';}
  timing('cli.run_recording',started,{outcome:issue?'rejected':'validated',
    facts:record?.facts?.length||0,...(issue?{reason:issue}:{})});
  return issue;
}
