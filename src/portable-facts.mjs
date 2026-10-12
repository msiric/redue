// Portable comparison is an extra, versioned representation of the existing
// direct contract. It is not an execution receipt or an alternative input engine.
import {requirePortableOriginInterval} from './portable-origin-interval.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {canonical,digestPayload,PORTABLE_INTERPRETATION} from './portable-envelope.mjs';
import {directInterpretation,directQualification,directEnvironment,directProject} from './direct-typescript.mjs';
import {sha} from './plan.mjs';
import {withinPath} from './path-identity.mjs';
import {fileURLToPath} from 'node:url';
import {fileHash} from './index.mjs';
import {resolveLinks} from './installed-inputs.mjs';
import {timing,mark,traceId,traceScope,traceEnvironment,profiling} from './decision-profile.mjs';
import {portableProbeDeadlineMs} from './portable-budget.mjs';

export const portableInterpretation=PORTABLE_INTERPRETATION;
const fail=code=>{throw Object.assign(Error(code),{code});};
export function portableRelative(root,file){
  if(!path.isAbsolute(file)||!withinPath(file,root))fail('PORTABLE_EXTERNAL_INPUT');
  const rel=path.relative(root,file).split(path.sep).join('/');
  if(rel==='')return '.';
  if(rel.includes('\\')||rel.includes(':'))fail('PORTABLE_PATH');
  // Initial profile rejects links in every component, not just the leaf.
  let current=root;
  for(const component of rel.split('/')){
    current=path.join(current,component);
    try{if(fs.lstatSync(current).isSymbolicLink())fail('PORTABLE_SYMLINK');}
    catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;}
  }
  return rel;
}
export function portableDiscovery(root,facts){
  if(!Array.isArray(facts.queries)||!facts.queries.length)fail('PORTABLE_DISCOVERY_INCOMPLETE');
  const normalize=value=>{
    // Compiler query args retain undefined positions explicitly in
    // undefinedArguments; null is the existing wire representation.
    if(value===undefined)return null;
    if(typeof value==='string'&&path.isAbsolute(value))return portableRelative(root,value);
    if(Array.isArray(value))return value.map(normalize);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalize(item)]));
    return value;
  };
  const queries=facts.queries.map(normalize).sort((a,b)=>canonical(a)<canonical(b)?-1:canonical(a)>canonical(b)?1:0);
  const pairs=values=>values.map(([rel,hash])=>{
    if(portableRelative(root,path.join(root,rel))!==rel||rel==='.')fail('PORTABLE_PATH');
    return [rel,hash];}).sort(([a],[b])=>a<b?-1:a>b?1:0);
  return {configs:pairs(facts.configs),files:pairs(facts.files),queriesSha256:sha(canonical(queries))};
}
export function portableRecipe(plan){
  if(plan.qualification!==directQualification||plan.unresolved?.length||
    plan.externalObservationRoots?.length||plan.environment?.pathExecutables?.length||
    canonical(plan.environment)!==canonical(directEnvironment)||plan.probes?.length!==1||
    plan.probes[0].length!==4||plan.probes[0][0]!==process.execPath||
    plan.probes[0][1]!==fileURLToPath(new URL('./direct-typescript-probe.mjs',import.meta.url))||
    plan.probes[0][2]!==plan.root||plan.cwd!==plan.root||plan.command?.length!==3||
    plan.command[0]!==process.execPath||plan.command[2]!=='--noEmit')fail('PORTABLE_CONTRACT_UNSUPPORTED');
  // Resolve and verify the actual installed implementation before assigning the
  // portable compiler token; shape alone cannot authorize an arbitrary child.
  if(plan.command[1]!==directProject(plan.root,plan.probes[0][3]).entry)
    fail('PORTABLE_CONTRACT_UNSUPPORTED');
  const definition={interpretation:directInterpretation,script:plan.probes[0][3],
    command:['@node','@typescript-compiler:.','--noEmit'],cwd:'.',
    source:plan.sourcePatterns,additive:plan.additivePatterns,
    installed:plan.declaredInstalledInputs,generated:plan.declaredGeneratedInputs,
    environment:plan.environment};
  if(canonical(plan.declaredInstalledInputs)!==canonical(['node_modules/**'])||
    plan.declaredGeneratedInputs?.length||
    !['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}','package.json','tsconfig.json'].every(pattern=>plan.sourcePatterns.includes(pattern))||
    plan.sourcePatterns.some(pattern=>pattern.startsWith('!')&&!['!node_modules/**','!.git/**'].includes(pattern)))
    fail('PORTABLE_COVERAGE_UNSUPPORTED');
  return {interpretation:directInterpretation,script:definition.script,
    command:definition.command,definitionSha256:sha(canonical(definition))};
}
export function portableManifest(root,observed){
  const files=Object.entries(observed).sort(([a],[b])=>a<b?-1:a>b?1:0);
  return files.map(([rel,hash])=>{
    const file=path.join(root,rel);
    if(!withinPath(file,root)||rel.includes('\\')||rel.includes(':'))fail('PORTABLE_PATH');
    const before=fs.lstatSync(file,{bigint:true});
    if(before.isSymbolicLink()){
      // Ordinary npm command shims: exact relative link topology and target
      // contents remain inputs. Source/directory/external aliases are excluded.
      if(!rel.startsWith('node_modules/.bin/')||path.isAbsolute(fs.readlinkSync(file)))fail('PORTABLE_SYMLINK');
      portableRelative(root,path.dirname(file));
      const resolution=resolveLinks(file,root,[],true);
      if(!resolution.physical)fail('PORTABLE_SYMLINK');
      const target=portableRelative(root,resolution.physical);
      if(!Object.hasOwn(observed,target)||fs.lstatSync(resolution.physical).isSymbolicLink())fail('PORTABLE_COVERAGE_UNSUPPORTED');
      if(fileHash(root,rel,true,before).hash!==hash)fail('PORTABLE_INPUT_CHANGED');
      return [rel,sha(canonical({kind:'npm-file-shim',target,content:observed[target],
        links:resolution.links.map(link=>({path:path.relative(root,link.path).split(path.sep).join('/'),targetHash:link.targetHash}))}))];
    }
    if(portableRelative(root,file)!==rel||!before.isFile()||
      fileHash(root,rel,rel.startsWith('node_modules/'),before).hash!==hash)fail('PORTABLE_INPUT_CHANGED');
    return [rel,hash];
  });
}
export function portableProbeFailureCode(probe){
  if(probe.error?.code==='ETIMEDOUT')return 'PORTABLE_PROBE_TIMEOUT';
  return probe.stderr?.match(/^VSTATE_REASON:(PORTABLE_[A-Z_]+)$/m)?.[1]||'PORTABLE_PROBE_UNAVAILABLE';
}
export function portableProbeFacts(plan,{budget,runtimeCertificate=null}={}){
  let timeout=Math.min(portableProbeDeadlineMs,budget?.remaining()??portableProbeDeadlineMs);
  if(!Number.isSafeInteger(timeout)||timeout<1)fail('PORTABLE_PROBE_TIMEOUT');
  const recipe=portableRecipe(plan);
  timeout=Math.min(timeout,budget?.remaining()??portableProbeDeadlineMs);
  if(!Number.isSafeInteger(timeout)||timeout<1)fail('PORTABLE_PROBE_TIMEOUT');
  const probe=traceScope({work:profiling?traceId():undefined},()=>{
    const started=performance.now();mark('portable_probe.launch',{deadlineMs:timeout});
    const privateInput=runtimeCertificate===null?null:JSON.stringify(runtimeCertificate);
    if(privateInput!==null&&Buffer.byteLength(privateInput)>128*1024)fail('PORTABLE_PROBE_UNAVAILABLE');
    const result=spawnSync(plan.probes[0][0],[...plan.probes[0].slice(1),'--redue-portable',...(privateInput===null?[]:['--redue-private-runtime-certificate'])],
      {cwd:plan.cwd,env:traceEnvironment(),encoding:'utf8',input:privateInput??undefined,timeout,maxBuffer:8*1024*1024,stdio:[privateInput===null?'ignore':'pipe','pipe','pipe']});
    timing('portable_probe.complete',started,{available:!result.error&&!result.signal&&result.status===0?1:0,
      timedOut:result.error?.code==='ETIMEDOUT'?1:0});return result;
  });
  if(probe.error||probe.signal||probe.status!==0){
    fail(portableProbeFailureCode(probe));
  }
  const {privateRuntimeCertificate,...discovered}=JSON.parse(probe.stdout);
  if(discovered.schema!==1)fail('PORTABLE_INTERPRETATION_UNSUPPORTED');
  budget?.remaining();
  return {recipe,discovered,runtimeCertificate:privateRuntimeCertificate??null};
}
export function portableCallerProof(plan,budget){
  budget?.remaining();requirePortableOriginInterval();
  const {recipe,discovered}=portableProbeFacts(plan,{budget});
  const proof=sha(canonical({recipe,discovered}));budget?.remaining();return proof;
}
export function portableApplicabilityContext(context,runtime){
  if(!context||typeof context!=='object'||Array.isArray(context)||
    !/^[a-f0-9]{64}$/.test(context.__vstate_node_identity__??''))fail('PORTABLE_CALLER_UNVERIFIED');
  // Only this reviewed direct recipe reaches this projection. Raw origin
  // environment hashes stay immutable and remain the start/end stability guard.
  return {...context,__vstate_node_identity__:sha(canonical(runtime))};
}
export function capturePortableValidation(plan,snapshot,context,budget,runtimeCertificate=null){
  budget?.remaining();
  if(snapshot?.observationHealthy!==true||!snapshot.files)fail('PORTABLE_OBSERVATION_INCOMPLETE');
  requirePortableOriginInterval();
  const manifestStarted=performance.now(),files=portableManifest(plan.root,snapshot.files);
  timing('portable_facts.manifest',manifestStarted,{files:files.length});
  const {recipe,discovered,runtimeCertificate:learned}=portableProbeFacts(plan,{budget,runtimeCertificate});
  for(const [rel] of [...discovered.discovery.configs,...discovered.discovery.files])
    if(!Object.hasOwn(snapshot.files,rel))fail('PORTABLE_COVERAGE_UNSUPPORTED');
  const facts={schema:1,recipe,platform:{os:process.platform,arch:process.arch,release:os.release()},
    runtime:discovered.runtime,compiler:discovered.compiler,
    context:portableApplicabilityContext(context,discovered.runtime),files,discovery:discovered.discovery};
  budget?.remaining();return {facts,runtimeCertificate:learned};
}
export const portableFactsProof=facts=>sha(canonical({recipe:facts.recipe,discovered:{schema:1,runtime:facts.runtime,compiler:facts.compiler,discovery:facts.discovery}}));
export const samePortableFacts=(a,b)=>a!==null&&b!==null&&canonical(a)===canonical(b);
export const portableFactsDigest=facts=>digestPayload(facts);

// Public/origin/caller capture never accepts cached runtime authority.
export function capturePortableFacts(plan,snapshot,context,budget){return capturePortableValidation(plan,snapshot,context,budget).facts;}
