import {inflateSync,deflateSync} from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Worker} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';
import {subscribe,hasHistory,backend} from './platform-observation.mjs';
import {controlEndpoint} from './control-endpoint.mjs';
import {observedRelative,withinPath,realObservedPath,racyWindowMs} from './path-identity.mjs';
import micromatch from './glob.mjs';
import {sha} from './plan.mjs';
import {InputIndex,dehydrateIndex} from './index.mjs';
import {permittedRoots} from './installed-inputs.mjs';
import {assertOwnedStatePlacement} from './owned-state.mjs';
import {atomicJson,readReceipts,readReceiptSnapshot,receiptRevision} from './state-store.mjs';
import {history,closeHistory} from './observation.mjs';
import {inputKey,planGuard,toolchainKey} from './decision-validation.mjs';
import {queriesHold,runFactReason as runFactChanged} from './typescript-list.mjs';
import {nextProbeHint,probeDeadline,probeFloorMs} from './probe-deadline.mjs';
import {statusSummary} from './cached-state.mjs';
import {directProject,directProbeValue,reviewedTypeScriptVersions} from './direct-typescript.mjs';
import {buildInfoPath,recordedCertificate} from './direct-run-certificate.mjs';
import {timing,mark,traceBase,traceContext,traceScope,traceEnvironment,traceId} from './decision-profile.mjs';

const configFile=path.resolve(process.argv[2]);
const config=JSON.parse(fs.readFileSync(configFile));
const root=realObservedPath(config.root), state=path.resolve(config.state);
assertOwnedStatePlacement(config);
let rootIdentity=fs.statSync(root,{bigint:true});
if(withinPath(state,root))throw Error('state must be outside checkout');
fs.mkdirSync(state,{recursive:true,mode:0o700});
const endpoint=controlEndpoint(state),socket=endpoint.address,
  lock=path.join(state,'observer.lock');
fs.mkdirSync(lock); // Existing lock requires operator inspection; never steal it.
fs.writeFileSync(path.join(lock,'pid'),String(process.pid),{mode:0o600});
const generation=randomUUID(), startedAt=Date.now();
traceBase({generation,work:'startup'});
let index, receipts={}, watcher, healthy=false, reason='initial reconciliation', stopping=false;
let receiptStateError=null;
let receiptStateRevision=null;
const external=new Map();
for(const check of config.checks)for(const boundary of permittedRoots(root,check.allowedExternalRoots||[]))
  if(!external.has(boundary))external.set(boundary,{root:boundary,watcher:null,index:null,
    healthy:false,gap:false,reason:'external observation initializing',pending:new Set(),
    recoveryDelay:1000,
    snapshot:path.join(state,`external-${sha(boundary).slice(0,16)}.snapshot`)});
let pending=new Set(), pendingChecks=new Set(), flushTimer, planDirty=false, planning=false, lastObservation=0;
let decisionRequests=0;
let decisionSequence=0;
let inputEventSerial=new Map();
// The last input-event paths per check, with their serials, so a test run can
// show that every event during it was one of its own outputs.
const inputEventPaths=new Map(),eventPathLimit=10000;
let diagnosticInputEvents=0;
let synchronizing=null;
let installedRecheck=null;
let historyDisabled=!hasHistory,recoveryTimer=null,recovering=false,recoveryAttempts=0;
let identityChanged=false;
let identityGapKey=null;
let triggerHashes=new Map();
let candidateDescendants=new Map();
let workspacePatterns=(()=>{const w=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).workspaces;
  return Array.isArray(w)?w:w?.packages||[];})();
let planningWorker=null;
let validatedPlan=null;
let gapDuringPlan=false;
const snapshotPath=path.join(state,'fs-events.snapshot');
const metrics={notifications:0,flushes:0,reconciliations:0,planRebuilds:0,gaps:0,
  maxQueue:0,historyQueries:0,historyTimeouts:0,startupAt:startedAt};
const historyDeadlineMs=Math.max(100,Number(process.env.VSTATE_HISTORY_TIMEOUT_MS||5000));
const reconciliationDeadlineMs=Math.max(1000,
  Number(process.env.VSTATE_RECONCILE_TIMEOUT_MS||120000));
async function queryHistory(observedRoot,snapshot,phase) {
  try{const changes=await history(observedRoot,snapshot,backend,historyDeadlineMs,
    process.env.VSTATE_TEST_HISTORY_FAULT_FILE);
    metrics.historyQueries++;event('history_query_completed',{phase,events:changes.length});
    return changes;}
  catch(e){if(e.code==='ETIMEDOUT'){metrics.historyTimeouts++;
      event('history_timeout',{phase,deadline_ms:historyDeadlineMs});}
    throw e;}
}
const atomic=atomicJson;
function event(kind,fields={}) {
  fs.appendFileSync(path.join(state,'events.jsonl'),JSON.stringify({at:Date.now(),kind,generation,
    repository:root,...fields})+'\n');
}
function loadReceipts() {
  try {const snapshot=readReceiptSnapshot(state);receipts=snapshot.value.checks;
    receiptStateRevision=snapshot.revision;receiptStateError=null;}
  catch(e){receiptStateRevision=null;
    // A readable selector can still supply explicitly historical outcomes after
    // restart. The failed snapshot guard remains authoritative for applicability.
    try{receipts=readReceipts(state).checks;}catch{/* retain previous historical rows */}
    const next=`latest receipt unavailable; prior outcome only: ${e.message}`;
    if(receiptStateError!==next)event('receipt_state_unavailable',
      {classification:e.name||'Error'});
    receiptStateError=next;}
}
function refreshReceipts() {
  try {if(receiptStateRevision===null||receiptRevision(state)!==receiptStateRevision)loadReceipts();}
  catch {loadReceipts();}
}
function persistedPlan(bundle) {
  return {schema:1,provider:bundle.provider,root:bundle.root,discoveredAt:bundle.discoveredAt,
    workspaceCount:bundle.workspaceCount,configurationInputs:bundle.configurationInputs,
    plans:Object.fromEntries(Object.entries(bundle.plans).map(([name,plan])=>{
      const safe=structuredClone(plan);
      safe.commandIdentity={argvHash:sha(JSON.stringify(plan.command)),argc:plan.command.length,
        source:plan.executionProvenance};
      delete safe.command;delete safe.taskCommand;
      safe.probes=plan.probes.map(argv=>({argvHash:sha(JSON.stringify(argv)),argc:argv.length}));
      safe.taskGraph=safe.taskGraph.map(row=>{
        const item={...row,commandHash:sha(JSON.stringify(row.command??null)),
          optionsHash:sha(JSON.stringify(row.options??null))};
        delete item.command;delete item.options;return item;
      });
      return [name,safe];
    }))};
}
// Continuity for in-process certificate reuse: every observed change is applied.
// macOS needs its history cursor; Linux has the synchronize barrier in catchUp.
// Windows reconciles content at each decision and keeps its own reuse path.
function continuityBarrier() {
  return process.platform!=='win32'&&(process.platform!=='darwin'||hasHistory&&!historyDisabled)&&
    healthy&&watcher&&!planning&&!recovering&&!planDirty&&!index?.unavailable&&
    !pending.size&&!pendingChecks.size&&!external.size&&verifyRoot();
}
// The basis a full direct probe is checked against: plan guard, observation
// continuity, and the compiler tree and Node identity taken before the probe.
function certificateBasis(row) {
  const argv=row.plan.probes[0],compiler=directProject(argv[2],argv[3],{verify:false});
  return {guard:planGuard(index.bundle),gaps:metrics.gaps,
    compiler:JSON.stringify([compiler.tsRoot,compiler.entry,compiler.digest]),
    toolchain:toolchainKey(compiler.tsRoot,argv[0])};
}
// Returns null after reusing the last full probe, otherwise why a full probe is needed.
function reuseCertificate(row,key,allowReuse,forceFull,checked) {
  const started=performance.now(),cache=row.probeCache;
  if(forceFull)return 'forced_full_reference';
  if(!allowReuse||!continuityBarrier())return 'continuity_unavailable';
  if(row.plan.unresolved.length)return 'coverage_unresolved';
  if(!cache?.queries?.length)return 'no_validated_result';
  if(cache.input!==key)return 'inputs_changed';
  if(cache.gaps!==metrics.gaps)return 'observation_gap';
  let reason=null;
  try{const basis=checked.basis=certificateBasis(row);
    if(basis.guard!==cache.guard){planDirty=true;reason='plan_guard_changed';}
    else if(basis.compiler!==cache.compiler||basis.toolchain!==cache.toolchain)reason='toolchain_changed';
    else if(!queriesHold(cache.queries,cache.identities))reason='compiler_queries_changed';}
  catch{reason='validation_unavailable';}
  timing('daemon.probe_validation',started,{outcome:reason?'changed_or_unavailable':'reused',
    reason:reason||'content_and_context_unchanged',queries:cache.queries.length});
  if(reason)return reason;
  row.probeHash=cache.hash;row.probeAt=Date.now();row.probeError=null;
  metrics.probeReuses=(metrics.probeReuses||0)+1;
  return null;
}
// The current full-probe deadline for a check; see probe-deadline.mjs. Hints
// are kept per check name, so a plan rebuild (each Windows decision) keeps them.
const probeHints=new Map();
function fullProbeDeadline(row) {
  const run=receipts[row.plan.name]?.invocation;
  return probeDeadline({floor:probeFloorMs(row.plan.qualification),hint:probeHints.get(row.plan.name),
    runMs:run?.status==='exited'?run.durationMs:0});
}
function probe(row,allowReuse=false,{launch=true}={}) {
  const started=performance.now();
  const supported=new Map([
    ['typescript-noemit-v1','typescript-contract-probe.mjs'],
    ['npm-typescript-direct-v1','direct-typescript-probe.mjs'],
    ['yarn-workspace-tsc-v1','yarn-workspace-typecheck-probe.mjs'],
    ['pnpm-tsc-v1','pnpm-typecheck-probe.mjs']]);
  const expected=supported.get(row.plan.qualification);
  const builtIn=row.plan.probes.length===1&&expected&&
    row.plan.probes[0][1]===fileURLToPath(new URL(expected,import.meta.url));
  const inProcess=builtIn&&process.platform!=='win32'&&row.plan.qualification==='npm-typescript-direct-v1';
  const cacheable=builtIn&&(process.platform==='win32'||inProcess);
  const key=inputKey(row);
  const forceFull=process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_FULL_PROBES==='1';
  let fullReason=null;const checked={};
  if(inProcess){
    fullReason=reuseCertificate(row,key,allowReuse,forceFull,checked);
    if(!fullReason)return;
  }
  // Idle revalidation never launches a process. An unconfirmed result expires.
  if(!launch&&row.plan.probes.length)return;
  if(process.platform==='win32'&&cacheable&&allowReuse&&!forceFull&&row.probeCache?.input===key){
    const argv=row.plan.probes[0];
    mark('daemon.probe_launch',{mode:'certificate',deadlineMs:10000});
    const out=spawnSync(argv[0],[...argv.slice(1),'--redue-context'],{
      cwd:row.plan.cwd,timeout:10000,maxBuffer:1024*1024,env:traceEnvironment(),stdio:['ignore','pipe','pipe']});
    mark('daemon.probe_complete',{mode:'certificate',childPid:out.pid,exit:out.status,signal:out.signal,code:out.error?.code});
    metrics.probeContextProcesses=(metrics.probeContextProcesses||0)+1;
    if(!out.error&&!out.signal&&out.status===0&&out.stdout.toString()===row.probeCache.context){
      row.probeHash=row.probeCache.hash;row.probeAt=Date.now();row.probeError=null;
      metrics.probeReuses=(metrics.probeReuses||0)+1;
      timing('daemon.probe_context_validation',started,{outcome:'reused',reason:'content_and_context_unchanged'});
      return;
    }
    fullReason='context_or_compiler_queries_changed';
    timing('daemon.probe_context_validation',started,{outcome:'changed_or_unavailable'});
  }
  fullReason??=forceFull?'forced_full_reference':!cacheable?'generic_probe':
    !row.probeCache?'no_validated_result':row.probeCache.input!==key?'inputs_changed':'context_changed';
  if(row.plan.probes.length){
    timing('daemon.probe_reason',started,{reason:fullReason});
    metrics.fullProbeReasons??={};metrics.fullProbeReasons[fullReason]=(metrics.fullProbeReasons[fullReason]||0)+1;
    metrics.fullProbes=(metrics.fullProbes||0)+1;
  }
  // A failed or incomplete full probe must not leave an older certificate usable.
  let basis=checked.basis||null;
  if(inProcess){
    if(!basis)try{basis=certificateBasis(row);}catch{}
    if(row.probeCache?.guard&&basis&&basis.guard!==row.probeCache.guard)planDirty=true;
    row.probeCache=null;
  }
  const values=[];let checkpoint=null;
  // The slowest of this check's probes sets the hint for all of them.
  const deadline=fullProbeDeadline(row);let hint=0;
  const learn=()=>{if(hint)probeHints.set(row.plan.name,hint);};
  for(const argv of row.plan.probes) {
    const timeout=deadline,launched=performance.now();
    mark('daemon.probe_launch',{mode:'full',reason:fullReason,deadlineMs:timeout});
    // A built-in probe gets its deadline, so its inner compiler calls share it.
    const out=spawnSync(argv[0],[...argv.slice(1),...(cacheable?['--redue-checkpoint']:[]),
      ...(builtIn?[`--redue-deadline=${timeout}`]:[])],{cwd:row.plan.cwd,
      timeout,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe'],env:traceEnvironment()});
    mark('daemon.probe_complete',{mode:'full',childPid:out.pid,exit:out.status,signal:out.signal,code:out.error?.code});
    const timedOut=out.error?.code==='ETIMEDOUT';
    if(!out.error||timedOut)hint=Math.max(hint,nextProbeHint({durationMs:performance.now()-launched,deadlineMs:timeout,timedOut}));
    if(out.error||out.signal||out.status!==0) {
      learn();
      if(!row.probeError){row.revision++;row.lastReason='declared state probe became unavailable';}
      row.probeHash=null;row.probeAt=0;
      const code=['typescript-noemit-v1','npm-typescript-direct-v1','yarn-workspace-tsc-v1','pnpm-tsc-v1']
        .includes(row.plan.qualification)?
        /VSTATE_REASON:([a-z-]+)/.exec(out.stderr?.toString()||'')?.[1]:null;
      const explanations={
        'direct-typescript-implementation-unreviewed':'installed TypeScript bytes or membership differ from the reviewed compiler',
        'direct-typescript-version-unsupported':`direct compiler recipe supports reviewed TypeScript ${reviewedTypeScriptVersions.join(', ')} only`,
        'direct-execution-environment-unsupported':'direct compiler rejects development helpers, Node cache/preloads, and unreviewed runtime overrides',
        'direct-node-version-unsupported':'direct compiler recipe supports Node 22 and 24',
        'npm-launcher-unobserved-inputs':'npm launcher uses unobserved notifier inputs; execution is recording-only',
        'typecheck-script-changed':'typecheck script or lifecycle changed; rerun init or review it',
        'execution-environment-unsupported':'Node/npm preload or configuration environment is unsupported',
        'typescript-executable-changed':'local TypeScript executable changed or is missing',
        'typescript-config-unavailable':'TypeScript configuration cannot be resolved',
        'typescript-config-graph-unsupported':'TypeScript configuration extends, references, or uses compiler features outside this contract',
        'typescript-incremental-unsupported':'TypeScript composite compilation needs explicit review',
        'typescript-buildinfo-outside-repository':'TypeScript incremental build-info file is outside the observed repository',
        'typescript-incremental-unsound':'TypeScript assumeChangesOnlyAffectDirectDependencies makes an incremental result depend on build history',
        'typescript-buildinfo-name-unsupported':'TypeScript build-info file needs a plain name ending in .tsbuildinfo',
        'typescript-project-reference-consumed':'TypeScript program uses files of a referenced project, which plain tsc does not build',
        'typescript-config-outside-repository':'TypeScript configuration extends outside the observed repository',
        'typescript-plugin-unsupported':'TypeScript compiler plugin needs explicit review',
        'typescript-input-list-unavailable':'TypeScript input listing did not complete',
        'typescript-input-outside-repository':'TypeScript consumes files outside the observed repository',
        'npm-installation-layout-unsupported':'npm executable or installation layout is unsupported',
        'npm-installation-unobservable':'npm installation contains unobservable entries',
        'npm-configuration-unsupported':'npm script configuration needs review',
        'typescript-contract-unavailable':'TypeScript applicability probe could not establish inputs',
        'npm-proxy-version-unsupported':'npm proxy context is reviewed only for npm 10.9.2',
        'npm-proxy-context-ambiguous':'conflicting npm proxy environment keys require resolution',
        'npm-proxy-value-unsupported':'npm proxy environment contains an unsupported value',
        'workspace-execution-environment-unsupported':'Yarn/Node launcher environment override needs review',
        'yarn-toolchain-unavailable':'pinned Yarn version or executable is unavailable',
        'yarn-distribution-unobservable':'Corepack Yarn distribution cannot be inspected',
        'typescript-input-outside-workspace-contract':'TypeScript reads outside the selected workspace, declared dependency outputs, or installed roots',
        'workspace-typecheck-contract-unavailable':'workspace TypeScript applicability probe could not establish inputs'
        ,'pnpm-execution-environment-unsupported':'pnpm or Node launcher environment override needs review'
        ,'pnpm-distribution-unobservable':'pnpm executable contents cannot be observed'
        ,'pnpm-version-mismatch':'pnpm executable differs from the pinned version'
        ,'typescript-input-outside-pnpm-contract':'TypeScript reads outside the selected workspace, linked outputs, or installed inputs'
        ,'pnpm-input-coverage-unavailable':'pnpm installed-input coverage became unavailable; inspect check details'
        ,'pnpm-typecheck-contract-unavailable':'pnpm TypeScript input contract could not be established'
      };
      row.probeError=code?explanations[code]||`TypeScript applicability unavailable (${code})`:
        `probe unavailable: ${argv[0]} (${out.error?.code||out.signal||out.status})`;
      timing('daemon.probe',started,{outcome:out.error?.code||out.signal||out.status||'error',
        commands:values.length+1});return;
    }
    if(cacheable){
      try{checkpoint=JSON.parse(out.stdout);
        checkpoint.queries=checkpoint.queryData?JSON.parse(inflateSync(
          Buffer.from(checkpoint.queryData,'base64'),{maxOutputLength:8*1024*1024})):null;
        // Optional: without a layout, a run after an edit falls back to a full probe.
        try{checkpoint.layout=checkpoint.layoutData?JSON.parse(inflateSync(
          Buffer.from(checkpoint.layoutData,'base64'),{maxOutputLength:8*1024*1024})):null;}
        catch{checkpoint.layout=null;}
        if(!/^[a-f0-9]{64}$/.test(checkpoint.output)||!/^[a-f0-9]{64}$/.test(checkpoint.context))
          throw Error('invalid supported probe checkpoint');}
      catch{row.probeHash=null;row.probeAt=0;row.probeError='probe checkpoint unavailable';return;}
    }
    values.push([argv,out.status,sha(cacheable?checkpoint.output:out.stdout),sha(out.stderr)]);
  }
  learn();
  const value=sha(JSON.stringify(values));
  if((row.probeHash!==null&&row.probeHash!==value)||row.probeError){
    row.revision++;row.lastReason='declared state probe changed or recovered';}
  row.probeHash=value;row.probeAt=Date.now();row.probeError=null;
  if(checkpoint)row.probeCache=checkpoint.queries&&(!inProcess||basis)?{input:key,context:checkpoint.context,
    hash:value,queries:checkpoint.queries,...(inProcess?{schema:1,...basis,
      identities:new Map(),
      output:checkpoint.output,queryData:checkpoint.queryData,layout:checkpoint.layout,
      stderrHash:values[0][3]}: {})}:null;
  timing('daemon.probe',started,{outcome:'ok',commands:values.length,
    reusable:row.probeCache?1:0,queries:row.probeCache?.queries.length||0});
}
function applicableExternal(name) {return [...external.values()].filter(entry=>entry.index?.checks.has(name));}
function combinedSummary(name) {
  const base=index.summary(name),others=applicableExternal(name);
  return {...base,fingerprint:sha(JSON.stringify([base.fingerprint,
    ...others.map(entry=>[entry.root,entry.index.fingerprint(name)])])),
    revision:base.revision+others.reduce((sum,entry)=>sum+entry.index.summary(name).revision,0),
    files:base.files+others.reduce((sum,entry)=>sum+entry.index.summary(name).files,0)};
}
function combinedFiles(name) {
  const files=index.exportFiles(name);
  for(const entry of applicableExternal(name))for(const [rel,hash] of
    Object.entries(entry.index.exportFiles(name)))files[`external:${entry.root}:${rel}`]=hash;
  return files;
}
function describeChangedInput(plan,file) {
  const boundary=[...external.keys()].find(value=>file.startsWith(`external:${value}:`));
  const physical=boundary?path.join(boundary,file.slice(`external:${boundary}:`.length)):
    path.join(root,file);
  const matches=[...(plan.installedInstances||[]),...(plan.installedMappings||[])]
    .filter(mapping=>!mapping.logical?.startsWith('!')&&
      (physical===mapping.physical||physical.startsWith(mapping.physical+path.sep)))
    .map(mapping=>mapping.logical).slice(0,2);
  return file+' changed'+(matches.length?` (installed via ${matches.join(', ')})`:'');
}
function rows(contextHashes,synchronizedInstalled=false,synchronizedFilesystem=false) {
  if(!index)return [];
  return [...index.checks].map(([name,row])=>{
    const r=receipts[name], result=r?.result||null;
    const item={name,result,freshness:'UNVERIFIED',reason:'no receipt',changed_inputs:[],
      plan_id:row.plan.id,observed_at:lastObservation,
      invocation:r?.invocation||null,target_provenance:r?.target||null,
      ...(r?.verificationRecipe?{verification_recipe:r.verificationRecipe}:{}),
      coverage_at_run:r?.coverage||null,declared_inputs_match:null,reuse_eligible:false,
      ...(r?.runFacts?.length?{run_facts:r.runFacts.length}:{})};
    if(receiptStateError){item.reason=receiptStateError;return item;}
    if(!healthy||planning||recovering||index.unavailable){item.reason=
      (planning||recovering)?'input observation reconciliation pending':
        reason||index.unavailable||'observation unavailable';return item;}
    const outside=applicableExternal(name).find(entry=>!entry.healthy||entry.index.unavailable);
    if(outside){item.reason=outside.reason||`external observation unavailable: ${outside.index.unavailable}`;
      return item;}
    if(pendingChecks.has(name)){item.reason='filesystem change pending content inspection';return item;}
    if(r&&r.planId) item.declared_inputs_match=r.planId===row.plan.id&&
      r.fingerprint===combinedSummary(name).fingerprint;
    if(r&&!(r.fingerprintVersion===1||r.fingerprintVersion===2&&Array.isArray(r.runFacts))){
      item.reason='receipt uses earlier input-resolution format';return item;}
    if(row.plan.unresolved.length){
      const checkpoint=item.declared_inputs_match===false?
        r.planId!==row.plan.id?'; observed input plan changed':
          `; declared input checkpoint changed (${row.lastReason||'content or membership'})`:'';
      const probeIssue=row.probeError?`; state probe unavailable: ${row.probeError}`:'';
      item.reason='input coverage unresolved: '+row.plan.unresolved.join('; ')+checkpoint+probeIssue;
      return item;
    }
    if(row.probeError){item.reason=row.probeError;return item;}
    // The plan leaves out the build-info file it saw at start; the probe sees the current one.
    if(row.probeCache?.layout&&(row.probeCache.layout.buildInfo||null)!==(row.plan.buildInfo||null)){
      item.reason='the incremental build-info setting changed after the observer started; restart the observer';return item;}
    // An expired probe or missing execution context cannot confirm CURRENT, but
    // observed input content that already differs from the receipt is STALE.
    let unconfirmed=!row.probeAt||Date.now()-row.probeAt>10000?'state probe observation expired':null;
    if(row.plan.synchronizedInstalledRead&&!synchronizedInstalled){
      item.reason='installed inputs require a synchronized content read';return item;}
    if(process.platform==='win32'&&!synchronizedFilesystem){
      item.reason='Windows cached observation requires a synchronized content read';return item;}
    if(!r)return item;
    if(!r.coverage?.qualified){item.reason='coverage unresolved when execution was recorded';return item;}
    if(r.invocation?.status!=='exited'){
      item.reason=`invocation ${r.invocation?.status||'capture unavailable'}`;return item;}
    if(!['executed','failed','cache_hit','direct_executed'].includes(r.target?.status)){
      item.reason=`target execution ${r.target?.status||'unavailable'}`;return item;}
    if(r.target.status==='failed'&&result!=='FAIL'){
      item.reason='target failure conflicts with outer invocation outcome';return item;}
    if(!r.stable){const issues=r.checkpoint?.issues?.length?` (${r.checkpoint.issues.join('; ')})`:'';
      item.reason=`inputs changed during execution or observation gap${issues}`;return item;}
    const names=[...(row.plan.environment.variables||[]),
      ...(row.plan.environment.prefixes||[]).map(prefix=>
        `__vstate_env_prefix_${prefix.toLowerCase()}__`),
      ...(row.plan.environment.pathExecutables||[]).map(name=>
        `__vstate_path_executable_${name}__`),
      ...(row.plan.environment.executableIdentity?['__vstate_node_identity__']:[])];
    if(names.length&&!contextHashes?.[name])unconfirmed??='execution environment context not supplied';
    item.freshness='STALE';
    if(r.planId!==row.plan.id){
      const before=new Map((r.resolutionLinks||[]).map(link=>[link.path,link.targetHash]));
      const changed=(row.plan.resolutionLinks||[]).find(link=>before.get(link.path)!==link.targetHash);
      item.reason=changed?`installed input link changed: ${changed.path}`:'input plan changed';
      if(changed)item.changed_inputs=[changed.path];
    }
    else if(contextHashes?.[name]&&names.some(key=>contextHashes[name][key]!==r.environmentHashes?.[key]))
      item.reason='declared execution environment changed';
    // Every variable a test run read directly must have the same value. The
    // caller compares them and names the list it used; another list confirms nothing.
    else if(r.environmentReads&&contextHashes?.[name]&&
      (contextHashes[name].__redue_env_reads__!==sha(JSON.stringify(r.environmentReads))||contextHashes[name].__redue_env_changed__)){
      if(contextHashes[name].__redue_env_reads__!==sha(JSON.stringify(r.environmentReads))){
        item.freshness='UNVERIFIED';item.reason='environment variables the last run read were not compared';}
      else item.reason=`environment variable ${contextHashes[name].__redue_env_changed__} differs from the last run`;
    }
    else if(r.fingerprint!==combinedSummary(name).fingerprint) {
      const key=r.fingerprint+'\0'+combinedSummary(name).fingerprint;
      if(row.staleReasonKey!==key){
        let changed=row.lastReason;row.staleInputs=[];
        const candidate=changed?.endsWith(' changed')?changed.slice(0,-8):null;
        if(candidate&&r.files?.[candidate]!==index.files.get(candidate)){
          changed=describeChangedInput(row.plan,candidate);row.staleInputs=[candidate];}
        else {
          const current=combinedFiles(name);
          if(r.files)for(const f of new Set([...Object.keys(r.files),...Object.keys(current)]))
            if(r.files[f]!==current[f]){changed=describeChangedInput(row.plan,f);row.staleInputs=[f];break;}
        }
        row.staleReason=changed||
          (['typescript-noemit-v1','npm-typescript-direct-v1','yarn-workspace-tsc-v1','pnpm-tsc-v1']
            .includes(row.plan.qualification)?
            'TypeScript input set, generated file, or toolchain context changed':
            'declared input content or membership changed');
        row.staleReasonKey=key;
      }
      item.reason=row.staleReason;item.changed_inputs=row.staleInputs||[];
      if(unconfirmed&&!(r.files&&row.staleInputs?.length)){item.freshness='UNVERIFIED';
        item.reason=unconfirmed;item.changed_inputs=[];}
    } else if(unconfirmed){item.freshness='UNVERIFIED';item.reason=unconfirmed;
    // Lookups the run made outside the certificate are asked again for every
    // answer, cached or synchronized, before it can say CURRENT.
    // A direct run recorded before run facts may have made lookups no probe
    // asks; only Windows, which never records direct runs, keeps reusing them.
    } else if(r.fingerprintVersion===1&&r.verificationRecipe==='npm-direct-typescript@1'&&process.platform!=='win32'){
      item.freshness='UNVERIFIED';item.reason='receipt predates run facts; run the check again';
    } else if(r.runFacts&&(item.reason=runFactReason(r.runFacts))){item.changed_inputs=[];
    // A recorded test run that used something REDUE does not observe, or
    // whose result differed from an earlier run on the same inputs.
    } else if(r.guardIssues?.length){item.freshness='UNVERIFIED';
      item.reason=`the run used inputs REDUE does not observe: ${r.guardIssues.slice(0,3).join('; ')}`+
        (r.guardIssues.length>3?`; and ${r.guardIssues.length-3} more`:'');
    } else if(r.nondeterministic){item.freshness='UNVERIFIED';item.reason='runs on these exact inputs had different results';
    } else {item.freshness='CURRENT';item.reason=result==='FAIL'?'last command failed':'declared inputs match';
      item.reuse_eligible=result==='PASS';}
    return item;
  });
}
// Null when every run fact in a receipt answers as it did during the run.
function runFactReason(facts) {
  const started=performance.now(),reason=runFactChanged(facts);
  timing('daemon.run_facts',started,{facts:facts.length,changed:reason?1:0});
  return reason;
}
// The indexed inputs already differ from the latest receipt, so no probe result
// can make this check CURRENT. A sync answers STALE without a full probe. A run
// probes, or builds the certificate from its recording (adopt), and a revert
// makes the inputs match and probes again.
function knownStale(name,row) {
  const r=receipts[name];
  if(!r?.files||r.planId!==row.plan.id||row.probeError||pendingChecks.has(name)||
    row.probeCache?.input===inputKey(row))return false;
  const current=combinedFiles(name),files=Object.keys(current);
  return files.length!==Object.keys(r.files).length||files.some(file=>r.files[file]!==current[file]);
}
// A run can rebuild a certificate that no longer applies only because indexed
// inputs changed: same plan guard, compiler, toolchain and observation.
function adoptable(row) {
  const cache=row.probeCache;
  if(process.platform==='win32'||row.plan.qualification!=='npm-typescript-direct-v1'||
    row.plan.unresolved.length||row.probeError||cache?.schema!==1||!cache.layout||!cache.queries?.length||
    cache.input===inputKey(row)||cache.gaps!==metrics.gaps||!continuityBarrier())return false;
  try{const basis=certificateBasis(row);
    return basis.guard===cache.guard&&basis.compiler===cache.compiler&&basis.toolchain===cache.toolchain;}
  catch{return false;}
}
// The end checkpoint of a run that started without a certificate. Its recorded
// answers become the candidate certificate when nothing observed changed during
// the run. The probe that follows validates it, or runs in full as before.
function adopt(name,row,token) {
  const started=performance.now(),pending=row.adoption,file=path.join(state,`run-record-${token}.json`);
  row.adoption=null;
  let text=null;
  try{text=fs.readFileSync(file,'utf8');}catch{}
  const done=issue=>{timing('daemon.recorded_certificate',started,{outcome:issue?'rejected':'accepted',
    ...(issue?{reason:issue}:{})});return issue;};
  if(!pending||pending.token!==token||text===null)return done('recording unavailable');
  if(inputEventSerial.get(name)!==pending.serial||metrics.gaps!==pending.gaps||inputKey(row)!==pending.input||
    row.probeCache!==pending.cache||row.probeHash!==null)
    return done('inputs or certificate changed during the run');
  const cache=pending.cache,argv=row.plan.probes[0];
  let result;
  try{result=recordedCertificate(text,cache,directProject(argv[2],argv[3],{verify:false}),buildInfoPath(row.plan));}
  catch{return done('recording unreadable');}
  if(result.issue)return done(result.issue);
  const identities=new Map(cache.identities);
  for(const changed of result.changed)identities.delete(changed);
  row.probeCache={...cache,hash:directProbeValue(argv,result.output,cache.stderrHash),
    queries:result.queries,identities,output:result.output,layout:result.layout,input:pending.input,recorded:token,
    queryData:deflateSync(JSON.stringify(result.queries)).toString('base64')};
  metrics.recordedCertificates=(metrics.recordedCertificates||0)+1;
  return done(null);
}
function status(contextHashes,synchronizedInstalled=false,synchronizedFilesystem=false) {
  // Reload notifications accelerate visibility but are not required for it: a
  // wrapper may persist its outcome even when its control connection is denied.
  refreshReceipts();
  const checks=rows(contextHashes,synchronizedInstalled,synchronizedFilesystem);
  // A decision may run every check's probes in turn: callers wait for all of them.
  const probing=[...(index?.checks.values()||[])].filter(row=>row.plan.probes.length);
  const now=Date.now();return {schema:1,receipt_revision:receiptStateRevision,...statusSummary(checks),checks,
    ...(probing.length?{probe_deadline_ms:probing.reduce((sum,row)=>sum+fullProbeDeadline(row)*row.plan.probes.length,0)}:{}),
    observation:{healthy:healthy&&!planning&&!recovering&&!index?.unavailable,
      generation,observed_at:lastObservation,
      events:(index?.eventCount||0)+[...external.values()].reduce((n,e)=>n+(e.index?.eventCount||0),0),
      pending:pending.size+[...external.values()].reduce((n,e)=>n+e.pending.size,0),
      reason:healthy?index?.unavailable:reason,
      external:[...external.values()].filter(e=>e.index).map(e=>({root:e.root,
        healthy:e.healthy,reason:e.reason})),
      phase:recovering?'reconciling':metrics.planPhase||'initializing',scanned:metrics.planScannedFiles||0,
      total:metrics.planTotalFiles},
    updated_at:now,expires_at:now+3000,pid:process.pid};
}
function publish() {atomic(path.join(state,'status.json'),status());}
function hydrate(bundle,saved) {
  const next=new InputIndex(bundle,{trackGit:bundle.root===root,
    includeInstalled:bundle.root!==root});
  next.files=new Map(saved.files);
  for(const [alias,refs] of saved.aliasDependencies||[]){
    next.aliasDependencies.set(alias,new Set(refs));
    for(const reference of refs){
      if(!next.symlinkRefs.has(reference))next.symlinkRefs.set(reference,new Set());
      next.symlinkRefs.get(reference).add(alias);
    }
  }
  for(const rowData of saved.rows) {
    const row=next.checks.get(rowData.name);
    row.files=new Set(rowData.files);row.sum=Buffer.from(rowData.sum,'hex');
    row.revision=rowData.revision;row.lastReason=rowData.lastReason;
    for(const rel of row.files) {
      if(!next.members.has(rel))next.members.set(rel,new Set());
      next.members.get(rel).add(rowData.name);
    }
  }
  next.eventCount=saved.eventCount;next.rehashedFiles=saved.rehashedFiles;
  next.rehashedBytes=saved.rehashedBytes;next.profile=saved.profile;
  next.racy=new Map(saved.racy||[]);
  return next;
}
const dehydrate=dehydrateIndex;
function retainIndex() {
  if(!index||!healthy||planning||pending.size||planDirty||historyDisabled||
    !fs.existsSync(snapshotPath))return;
  const outside={};
  for(const entry of external.values()){
    if(!entry.index||!entry.healthy||entry.pending.size||!fs.existsSync(entry.snapshot))return;
    outside[entry.root]={cursor:sha(fs.readFileSync(entry.snapshot)),
      index:dehydrate(entry.index)};
  }
  const current=fs.statSync(root,{bigint:true});
  atomic(path.join(state,'index-v1.json'),{schema:1,root,
    identity:[String(current.dev),String(current.ino)],
    planIds:Object.fromEntries([...index.checks].map(([name,row])=>[name,row.plan.id])),
    cursor:sha(fs.readFileSync(snapshotPath)),external:outside,index:dehydrate(index)});
}
function buildInWorker(forceCold=false,reuse=null) {
  return new Promise((resolve,reject)=>{
    const workerStarted=performance.now();
    const file=path.join(path.dirname(fileURLToPath(import.meta.url)),'plan-worker.mjs');
    const worker=new Worker(file,{workerData:{config:configFile,state,forceCold,reuse,diagnostic:traceContext(),
      reconcileFaultFile:process.env.VSTATE_TEST_RECONCILE_FAULT_FILE}});
    planningWorker=worker;let settled=false;
    const deadline=setTimeout(()=>{
      if(settled)return;settled=true;planningWorker=null;
      worker.terminate().catch(()=>{});
      reject(Error(`deterministic reconciliation exceeded ${reconciliationDeadlineMs} ms`));
    },reconciliationDeadlineMs);
    worker.on('message',value=>{
      if(value.kind==='progress') {
        if(stopping||identityChanged||gapDuringPlan)return;
        metrics.planPhase=value.phase;metrics.planScannedFiles=value.scanned;
        metrics.planTotalFiles=value.total;
        if(value.discoveryMs!=null)metrics.lastDiscoveryMs=value.discoveryMs;
        reason='input plan indexing';publish();return;
      }
      if(settled)return;settled=true;clearTimeout(deadline);planningWorker=null;
      if(value.ok){value.workerRoundTripMs=performance.now()-workerStarted;
        resolve(value);}else reject(Error(value.error));});
    worker.once('error',error=>{if(!settled){settled=true;clearTimeout(deadline);
      planningWorker=null;reject(error);}});
    worker.once('exit',code=>{if(!settled){settled=true;clearTimeout(deadline);planningWorker=null;
      reject(Error(`input-plan worker exited ${code}`));}});
  });
}
async function refreshPlan({forceCold=false,reuse=false,skip=null}={}) {
  if(planning||stopping)return;
  const totalStarted=performance.now();
  const previousProbes=new Map([...(index?.checks||[])].map(([name,row])=>[name,row.probeCache]));
  const reusable=reuse&&healthy&&!planDirty&&!external.size&&validatedPlan&&
    [...index.checks.values()].every(row=>!row.plan.qualification||row.probeCache)?
    {...validatedPlan,bundle:index.bundle,
      queries:[...index.checks.values()].flatMap(row=>row.probeCache?.queries||[])}:null;
  planning=true;planDirty=false;gapDuringPlan=false;pending.clear();pendingChecks.clear();
  for(const entry of external.values())entry.gap=!entry.watcher;
  metrics.planPhase='discovery';metrics.planScannedFiles=0;metrics.planTotalFiles=null;
  healthy=false;reason='input plan rebuilding';publish();
  try {const workerStarted=performance.now();
    const built=await buildInWorker(forceCold,reusable);
    timing('daemon.plan_worker',workerStarted,{forceCold:forceCold?1:0,
      discoveryMs:Math.round(built.discoveryMs),indexingMs:Math.round(built.indexingMs),
      mode:built.restartMode});
    if(stopping)return;
    if(!verifyRoot()) {planning=false;metrics.planPhase='unavailable';publish();return;}
    if(gapDuringPlan){planning=false;observationGap('plan_gap');return;}
    const {bundle}=built;
    workspacePatterns=bundle.workspacePatterns||workspacePatterns;
    const hydrationStarted=performance.now();
    index=hydrate(bundle,built.index);
    validatedPlan=built.guard?{guard:built.guard,inputs:built.inputKeys}:null;
    if(built.planReused)for(const [name,row] of index.checks)
      row.probeCache=previousProbes.get(name);
    inputEventSerial=new Map([...index.checks.keys()].map(name=>
      [name,inputEventSerial.get(name)||0]));
    for(const entry of external.values()) {
      const data=built.external?.[entry.root];
      entry.index=data?hydrate({root:entry.root,plans:Object.fromEntries(
        Object.entries(bundle.plans).filter(([,plan])=>(plan.externalObservationRoots||
          Object.keys(plan.externalPatterns||{})).includes(entry.root))
          .map(([name,plan])=>[name,{...plan,patterns:plan.externalPatterns[entry.root],
            sourcePatterns:[],
            additivePatterns:plan.externalPatterns[entry.root]||[],
            installedPhysicalRoots:[]}]))},data):null;
      entry.healthy=false;entry.reason='external reconciliation pending';
    }
    metrics.lastHydrationMs=performance.now()-hydrationStarted;
    metrics.lastWorkerRoundTripMs=built.workerRoundTripMs;
    metrics.lastDiscoveryMs=built.discoveryMs;metrics.lastIndexingMs=built.indexingMs;
    metrics.restartMode=built.restartMode||'cold-index';
    metrics.planPhase='reconciling';
    if(!built.planReused)metrics.planRebuilds++;
    metrics.reconciliations++;
    // Linux attaches per-inode watches before rechecking installed hardlinks.
    // The Windows backend has no per-inode watchFiles implementation; the
    // just-completed cold index already read those bytes. Windows still
    // withholds cached CURRENT and reconciles at each decision-grade read.
    if(!hasHistory&&watcher&&process.platform!=='win32'){
      const inodeStarted=performance.now();
      const checked=[...index.checks].filter(([,row])=>
        row.plan.synchronizedInstalledRead).map(([name])=>name);
      const selected=new Set(checked);
      const files=[...index.files.keys()].filter(rel=>index.installedPath(rel)&&
        [...index.members.get(rel)||[]].some(name=>selected.has(name)))
        .map(rel=>path.join(root,rel));
      await watcher.watchFiles(files);
      metrics.installedInodeWatches=files.length;
      if(checked.length)metrics.initialInstalledRecheck=await index.recheckInstalled(checked);
      timing('daemon.installed_inode_setup',inodeStarted,{watches:files.length,
        recheckMs:Math.round(metrics.initialInstalledRecheck?.durationMs||0)});
    }
    triggerHashes=new Map([...bundle.workspaceManifests,...(bundle.configurationInputs||[]),
      ...Object.values(bundle.plans).flatMap(plan=>plan.resolutionTriggers||[]),
      'package.json','package-lock.json'].map(rel=>[rel,triggerHash(rel)]));
    candidateDescendants=new Map();
    for(const plan of Object.values(bundle.plans))for(const candidate of
      plan.resolutionCandidates||[])for(const observed of
        new Set([candidate.path,candidate.observedPath].filter(Boolean))){
      const parts=observed.split('/');
      for(let n=1;n<=parts.length;n++){
        const prefix=parts.slice(0,n).join('/');
        if(!candidateDescendants.has(prefix))candidateDescendants.set(prefix,new Set());
        candidateDescendants.get(prefix).add(observed);
      }
    }
    const persistenceStarted=performance.now();
    atomic(path.join(state,'plans-v1.json'),persistedPlan(bundle));
    metrics.lastPlanPersistenceMs=performance.now()-persistenceStarted;
    const probeStarted=performance.now();
    if(skip)refreshReceipts();
    for(const [name,row] of index.checks)if(!skip?.(name,row))probe(row,built.planReused);
    timing('daemon.plan_probes',probeStarted,{checks:index.checks.size});
    lastObservation=Date.now();
    event(built.planReused?'plan_validated':'plan_rebuilt',{checks:Object.keys(bundle.plans),workspace_count:bundle.workspaceCount});
    const catchUpStarted=performance.now();
    if(watcher&&(!historyDisabled||!hasHistory))try{await catchUp();}
      catch(e){planning=false;observationGap('historical_query',e);return;}
    metrics.lastCatchUpMs=performance.now()-catchUpStarted;
    if(gapDuringPlan){planning=false;observationGap('plan_gap');return;}
    if(planDirty) {
      pending.clear();planning=false;publish();setImmediate(refreshPlan);return;
    }
    planning=false;
    if(pending.size||[...external.values()].some(e=>e.pending.size))flush();
    if(!index.unavailable&&watcher&&!reason?.startsWith('input inspection unavailable')){
      healthy=true;reason=null;lastObservation=Date.now();}
    for(const entry of external.values())if(entry.index&&entry.watcher&&!entry.gap&&
      !entry.index.unavailable){
      entry.healthy=true;entry.reason=null;}
    if(healthy){identityChanged=false;identityGapKey=null;
      if(!recovering)recoveryAttempts=0;}
    metrics.planPhase=healthy?'ready':'unavailable';
  } catch(e) {if(!stopping){reason=`plan unavailable: ${e.message}`;
    metrics.planPhase='unavailable';event('plan_failed',{classification:e.name||'Error',reason:e.message});}}
  planning=false;publish();
  timing('daemon.plan_total',totalStarted,{forceCold:forceCold?1:0,
    healthy:healthy?1:0,files:index?.files.size||0});
}
function triggerHash(rel) {
  try{const file=path.isAbsolute(rel)?rel:path.join(root,rel),st=fs.lstatSync(file);
    if(st.isSymbolicLink())return sha('link:'+fs.readlinkSync(file));
    if(st.isDirectory())return sha('directory:'+String(st.dev)+':'+String(st.ino));
    return sha(fs.readFileSync(file));}
  catch(e){if(e.code==='ENOENT')return '<missing>';throw e;}
}
function triggerChanged(rel) {
  try{const current=triggerHash(rel),previous=triggerHashes.get(rel);
    if(current===previous)return false;
    triggerHashes.set(rel,current);return true;
  }catch(e){observationGap('plan_trigger_unreadable',e);return true;}
}
function workspaceManifest(rel) {
  return rel.endsWith('/package.json')&&
    micromatch.isMatch(path.posix.dirname(rel),workspacePatterns,{dot:true});
}
function planTrigger(rel) {
  return triggerHashes.has(rel)||rel==='package.json'||
    rel==='package-lock.json'||workspaceManifest(rel);
}
function candidateTriggerChanged(rel) {
  let changed=false;
  const descendants=candidateDescendants.get(rel);
  // A broad directory replacement can affect thousands of candidates. Fail
  // closed and rebuild instead of blocking the control loop on that event.
  if(descendants?.size>512)return true;
  for(const candidate of descendants||[])
    if(triggerChanged(candidate))changed=true;
  const parts=rel.split('/');
  for(let n=1;n<parts.length;n++){
    const candidate=parts.slice(0,n).join('/');
    if(triggerHashes.has(candidate)&&candidateDescendants.has(candidate)&&
      triggerChanged(candidate))changed=true;
  }
  return changed;
}
function flush() {
  clearTimeout(flushTimer);flushTimer=null;
  if(planning)return;
  if(!index||planDirty){pending.clear();for(const e of external.values())e.pending.clear();
    refreshPlan();return;}
  const wasHealthy=healthy;
  const paths=[...pending];pending.clear();metrics.flushes++;
  try {for(const rel of paths)index.updatePath(rel);
    for(const entry of external.values()){
      for(const rel of entry.pending)entry.index?.updatePath(rel);
      entry.pending.clear();
      if(entry.index?.unavailable){entry.healthy=false;entry.reason=entry.index.unavailable;
        externalGap(entry,'input_inspection');}}
    if(index.unavailable)throw Error(index.unavailable);
    pendingChecks.clear();healthy=wasHealthy&&Boolean(watcher)&&
      (historyDisabled||fs.existsSync(snapshotPath));
    if(healthy)reason=null;
    lastObservation=Date.now();
  } catch(e) {healthy=false;reason=`input inspection unavailable: ${e.message}`;
    metrics.gaps++;event('observation_gap',{classification:'input_inspection'});
    setTimeout(()=>{if(!stopping)refreshPlan();},1000);}
  publish();
}
function pnpmTopologyChanged(type,rel) {
  if(!config.checks.some(check=>check.qualification==='pnpm-tsc-v1')||
    !rel.split('/').includes('node_modules'))return false;
  if(type==='create'||type==='delete')return true;
  try{const stat=fs.lstatSync(path.join(root,rel));
    return stat.isDirectory()||stat.isSymbolicLink();}
  catch(e){return e.code==='ENOENT';}
}
function markInputEvent(name,rel,type,replay) {
  pendingChecks.add(name);
  // macOS delivers each edit twice: live, and again from history replay. The
  // live copy can arrive late, inside a later run. With history, count only the
  // replay copy: the history cursor places it in the right interval.
  if(!hasHistory||historyDisabled||replay){
    const serial=(inputEventSerial.get(name)||0)+1;
    inputEventSerial.set(name,serial);
    // Kept only for test checks; trimmed in batches.
    if(index?.checks.get(name)?.plan.qualification==='npm-tests-direct-v1'){
      const list=inputEventPaths.get(name)||[];list.push([serial,rel]);
      if(list.length>2*eventPathLimit)list.splice(0,list.length-eventPathLimit);inputEventPaths.set(name,list);
    }
  }
  // Disposable public CI only. Never enabled for normal/local repositories.
  if(process.env.REDUE_PUBLIC_INPUT_TRACE==='1'&&rel&&diagnosticInputEvents++<5000)
    event('public_input_notification',{path:rel,type:type||'unknown',planning,replay});
}
function notification(type,filename,replay=false) {
  metrics.notifications++;
  metrics.lastNotificationAt=Date.now();
  if(!filename){observationGap('unnamed_event');return;}
  const rel=filename.toString().split(path.sep).join('/');
  if(rel==='.git'||rel.startsWith('.git/'))return;
  if(planning) {
    if(index)for(const name of index.candidates(rel))
      if(index.matches(index.checks.get(name),rel))markInputEvent(name,rel,type,replay);
    pending.add(rel);metrics.maxQueue=Math.max(metrics.maxQueue,pending.size);
    if(planTrigger(rel)||candidateDescendants.has(rel)||pnpmTopologyChanged(type,rel))
      planDirty=true;
    if(pending.size>50000)observationGap('backlog_overflow');
    return;
  }
  try {if(fs.statSync(path.join(root,rel)).isDirectory()&&
    micromatch.isMatch(rel,workspacePatterns,{dot:true})&&
    fs.existsSync(path.join(root,rel,'package.json'))&&
    triggerChanged(rel+'/package.json'))planDirty=true;}
  catch(e){if(e.code!=='ENOENT') {healthy=false;reason='filesystem event path unavailable';publish();return;}}
  if(index&&[...index.checks.values()].some(row=>row.plan.patterns.includes(rel+'/package.json'))&&
    !fs.existsSync(path.join(root,rel))&&triggerChanged(rel+'/package.json'))planDirty=true;
  if(planTrigger(rel))
    if(triggerChanged(rel))planDirty=true;
  if(candidateTriggerChanged(rel))planDirty=true;
  // A newly installed package or nearer Node candidate may change a compiler
  // file list even when it was absent from the previous input plan. The store
  // outside this checkout is not observed and cannot cause this refresh.
  if(pnpmTopologyChanged(type,rel))planDirty=true;
  pending.add(rel);metrics.maxQueue=Math.max(metrics.maxQueue,pending.size);
  if(index) {
    for(const name of index.candidates(rel))
      if(index.matches(index.checks.get(name),rel))markInputEvent(name,rel,type,replay);
    for(const [prefix,names] of index.prefixes)
      if(prefix.startsWith(rel+'/'))for(const name of names)markInputEvent(name,rel,type,replay);
  }
  if(pending.size>50000){healthy=false;reason='observation backlog overflow';metrics.gaps++;
    event('observation_gap',{classification:'backlog_overflow'});publish();
    pending.clear();setTimeout(()=>refreshPlan(),100);return;}
  clearTimeout(flushTimer);flushTimer=setTimeout(flush,60);
  if(planDirty){healthy=false;reason='input plan possibly changed';}
  if(planDirty||pendingChecks.size)publish();
}
function externalNotification(entry,type,filename,replay=false) {
  metrics.notifications++;
  metrics.lastNotificationAt=Date.now();
  if(!filename){externalGap(entry,'unnamed_event');return;}
  const rel=filename.toString().split(path.sep).join('/');
  const absolute=path.join(entry.root,rel);
  if(planning&&entry.index)for(const name of entry.index.candidates(rel))
    if(entry.index.matches(entry.index.checks.get(name),rel))markInputEvent(name,`external:${entry.root}:${rel}`,type,replay);
  if(planTrigger(absolute)&&triggerChanged(absolute))planDirty=true;
  if(candidateTriggerChanged(absolute))planDirty=true;
  entry.pending.add(rel);metrics.maxQueue=Math.max(metrics.maxQueue,
    pending.size+[...external.values()].reduce((n,e)=>n+e.pending.size,0));
  if(entry.index) {
    for(const name of entry.index.candidates(rel))
      if(entry.index.matches(entry.index.checks.get(name),rel))markInputEvent(name,`external:${entry.root}:${rel}`,type,replay);
    for(const [prefix,names] of entry.index.prefixes)
      if(prefix.startsWith(rel+'/'))for(const name of names)markInputEvent(name,`external:${entry.root}:${rel}`,type,replay);
  }
  if(planDirty){healthy=false;reason='input plan possibly changed';}
  publish();clearTimeout(flushTimer);flushTimer=setTimeout(flush,60);
}
function externalGap(entry,classification,error) {
  entry.healthy=false;entry.gap=true;
  entry.reason=`external observation unavailable: ${classification}`;
  entry.watcher?.unsubscribe().catch(()=>{});entry.watcher=null;
  metrics.gaps++;event('observation_gap',{classification,external_root:entry.root,
    error_code:error?.code||null});publish();
  observationGap(`external_${classification}`,error);
}
function observationGap(classification,error) {
  if(planning)gapDuringPlan=true;
  // Once continuity is uncertain, a cursor is no longer authority. Do not
  // retry native history in this observer generation after reconciliation.
  historyDisabled=true;
  const cause=error?.message?` (${error.message})`:'';
  healthy=false;reason=`observation unavailable: ${classification}${cause}; deterministic reconciliation pending`;
  metrics.gaps++;
  event('observation_gap',{classification,error_code:error?.code||null});publish();
  // One bounded attempt per gap; a later independent gap may try again.
  if(!stopping&&!recovering&&!recoveryTimer&&recoveryAttempts<2)
    recoveryTimer=setTimeout(()=>recoverObservation(classification),100);
}
async function recoverObservation(classification) {
  recoveryTimer=null;if(stopping||recovering)return;
  recovering=true;recoveryAttempts++;
  event('reconciliation_started',{classification,attempt:recoveryAttempts});
  try {
    const waitStarted=Date.now();
    while(planning&&!stopping&&Date.now()-waitStarted<reconciliationDeadlineMs)
      await new Promise(resolve=>setTimeout(resolve,50));
    if(stopping)return;
    if(planning)throw Error('prior indexing did not settle before reconciliation deadline');
    const current=fs.statSync(root,{bigint:true});
    if(current.dev!==rootIdentity.dev||current.ino!==rootIdentity.ino){
      watcher?.unsubscribe().catch(()=>{});watcher=null;
      rootIdentity=current;identityChanged=true;
      event('observation_root_replaced');
    }
    if(!watcher)await attachWatch();
    if(!watcher)throw Error(`root subscription unavailable: ${reason}`);
    for(const entry of external.values()){
      const identity=fs.statSync(entry.root,{bigint:true});
      if(entry.watcher&&(identity.dev!==entry.identity?.dev||
        identity.ino!==entry.identity?.ino)){
        entry.watcher.unsubscribe().catch(()=>{});entry.watcher=null;
        event('external_observation_root_replaced',{external_root:entry.root});
      }
      if(!entry.watcher)await attachExternal(entry);
      if(!entry.watcher)throw Error(`external subscription unavailable: ${entry.root}`);
    }
    // The live subscriptions are attached before the fresh scan. Changes
    // delivered during indexing are queued and rechecked before health returns.
    await refreshPlan({forceCold:true});
    if(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_RECOVERY_FINISH_DELAY)
      await new Promise(resolve=>setTimeout(resolve,Math.min(2000,
        Number(process.env.VSTATE_TEST_RECOVERY_FINISH_DELAY)||0)));
    if(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_RECOVERY_FINALIZE_FAULT&&
      fs.existsSync(process.env.VSTATE_TEST_RECOVERY_FINALIZE_FAULT))
      throw Error('injected recovery finalization failure');
    if(!healthy||[...external.values()].some(entry=>entry.index&&!entry.healthy))
      throw Error(reason||'deterministic reconciliation unavailable');
    rootIdentity=fs.statSync(root,{bigint:true});identityChanged=false;
    recoveryAttempts=0;
    event('reconciliation_completed',{classification});
  }catch(e){healthy=false;reason=`deterministic reconciliation failed: ${e.message}; restart observer`;
    event('reconciliation_failed',{classification,error_code:e.code||e.name||'Error',
      reason:e.message,identityChanged,watcherAttached:Boolean(watcher),planPhase:metrics.planPhase});
    publish();
  }finally{recovering=false;publish();
    if(!healthy&&!stopping&&recoveryAttempts<2&&!recoveryTimer)
      recoveryTimer=setTimeout(()=>recoverObservation(classification),500);
  }
}
function verifyRoot() {
  let observed='unavailable';
  try {const current=fs.statSync(root,{bigint:true});
    if(current.dev===rootIdentity.dev&&current.ino===rootIdentity.ino)return true;
    observed=String(current.dev)+':'+String(current.ino);
  }catch(error){observed=error.code||'unavailable';}
  // Suppress repeats for the same failed identity, not all future root
  // replacements. A successful decision rebuild may follow a failed recovery.
  if(identityGapKey!==observed){identityGapKey=observed;identityChanged=true;healthy=false;
    if(!recovering)recoveryAttempts=0;
    watcher?.unsubscribe().catch(()=>{});watcher=null;
    observationGap('checkout_identity_changed');}
  return false;
}
async function catchUp() {
  if(!hasHistory){
    if(!verifyRoot())throw Error('checkout identity changed');
    if(!watcher)throw Error('filesystem observation unavailable');
    await watcher.synchronize();
    for(const entry of external.values())if(entry.index){
      if(!entry.watcher)throw Error(`external observation unavailable: ${entry.root}`);
      await entry.watcher.synchronize();
    }
    if(!planning&&(flushTimer||pending.size||planDirty||
      [...external.values()].some(entry=>entry.pending.size)))flush();
    lastObservation=Date.now();return;
  }
  if(historyDisabled)return;
  if(synchronizing){mark('daemon.catch_up_join');return synchronizing;}
  synchronizing=(async()=>{
    if(!verifyRoot())throw Error('checkout identity changed');
    if(!watcher)throw Error('subscription unavailable');
    if(!fs.existsSync(snapshotPath))throw Error('historical cursor missing');
    {
      const changes=await queryHistory(root,snapshotPath,'root replay');
      for(const change of changes)notification(change.type,path.relative(root,change.path),true);
      if(!planning&&(flushTimer||pending.size||planDirty))flush();
      for(const entry of external.values())if(entry.index) {
        try{
          const identity=fs.statSync(entry.root,{bigint:true});
          if(identity.dev!==entry.identity?.dev||identity.ino!==entry.identity?.ino)
            throw Error('external observation root identity changed');
          if(!entry.watcher||!fs.existsSync(entry.snapshot))throw Error('external cursor unavailable');
          const changes=await queryHistory(entry.root,entry.snapshot,'external replay');
          for(const change of changes)externalNotification(entry,change.type,
            path.relative(entry.root,change.path),true);
        }catch(e){if(e.code==='ETIMEDOUT')throw e;
          externalGap(entry,'historical_replay_failed',e);}
      }
      if(!planning&&(flushTimer||pending.size||planDirty||
        [...external.values()].some(e=>e.pending.size)))flush();
      lastObservation=Date.now();
    }
  })();
  try{return await synchronizing;}finally{synchronizing=null;}
}
function respond(client,value) {
  if(client.destroyed){event('control_reply_unavailable',{classification:'client_destroyed'});return;}
  try{const payload=JSON.stringify(value)+'\n';
    mark('server.response_constructed',{bytes:payload.length});
    client.end(payload,()=>mark('server.response_delivered'));client.vstateReplied=true;
    if(process.env.VSTATE_DEBUG_CONTROL==='1')event('control_reply_sent',{bytes:payload.length});}
  catch(e){event('control_reply_unavailable',{classification:e.name||'serialization_error'});
    if(!client.destroyed)client.end('{"error":"control response unavailable"}\n');}
}
async function request(message) {
  if(message.action==='stop'){setImmediate(shutdown);return {ok:true};}
  if(message.action==='metrics')return {generation,metrics,index:{files:index?.files.size,
    rehashedFiles:index?.rehashedFiles,rehashedBytes:index?.rehashedBytes,
    lastInputChangeAt:index?.lastChange,
    profile:index?.profile},external:[...external.values()].map(e=>({root:e.root,
      healthy:e.healthy,reason:e.reason,files:e.index?.files.size,
      rehashedFiles:e.index?.rehashedFiles,rehashedBytes:e.index?.rehashedBytes})),
    healthy,reason,planning,recovering,identityChanged,recoveryAttempts};
  if(message.action==='reload'){loadReceipts();publish();return {ok:true};}
  if(message.action==='sync'||message.action==='snapshot'||message.action==='prelaunch') {
    const totalStarted=performance.now();
    const decision=++decisionSequence;
    mark('server.decision_start',{decision,pending:pending.size,planDirty,planning,recovering,healthy,historyDisabled,decisionRequests,historyDeadlineMs,reconciliationDeadlineMs});
    timing('daemon.decision_reason',totalStarted,{decision,action:message.action,
      plan:process.platform==='win32'?'validate_dependencies_before_reuse':'existing_plan',
      probe:'reuse_only_with_identical_content_and_context',installed:'current_identity_required',
      planPhase:metrics.planPhase||'initializing',pending:pending.size,
      notifications:metrics.notifications,planRebuilds:metrics.planRebuilds});
    if(process.platform==='win32'&&process.env.VSTATE_TEST_FAULTS==='1'&&
      process.env.VSTATE_TEST_WINDOWS_GAP_FILE&&
      fs.existsSync(process.env.VSTATE_TEST_WINDOWS_GAP_FILE)){
      fs.unlinkSync(process.env.VSTATE_TEST_WINDOWS_GAP_FILE);
      observationGap('test_injected_windows_gap');
      return status();
    }
    if(planning||recovering)return status();
    // Without a usable continuity barrier, live-event delivery alone cannot
    // establish a decision checkpoint. This also applies after macOS history
    // has been disabled: a recovered subscription may still have queued events.
    const needsContentReconciliation=process.platform==='win32'||(hasHistory&&historyDisabled);
    if(needsContentReconciliation&&message.action!=='prelaunch'){
      // Windows probes inside the reconciliation, so a known-STALE sync skips it there.
      const started=performance.now();
      await refreshPlan({forceCold:true,reuse:true,skip:message.action==='sync'?knownStale:null});
      timing('daemon.request_content_validation',started,{healthy:healthy?1:0});}
    // Without synchronized installed reads, the continuity barrier runs once,
    // after probing: in-process validation reads the live filesystem, and the
    // barrier then applies every change before the response is computed.
    const deferBarrier=process.platform!=='win32'&&!needsContentReconciliation&&
      message.action!=='prelaunch'&&index&&healthy&&!planning&&![...index.checks].some(([name,row])=>
        row.plan.synchronizedInstalledRead&&(!message.name||message.name===name));
    if(healthy&&!deferBarrier)try{const started=performance.now();await catchUp();
      timing('daemon.request_catch_up',started);}catch(e){observationGap('historical_query',e);}
    if(flushTimer||pending.size||planDirty||[...external.values()].some(e=>e.pending.size))flush();
    let synchronizedInstalled=false;
    // A successful forced reconciliation has already hashed the
    // complete declared installed input set. A second full pass inside the
    // same request duplicates that work without creating an atomic snapshot.
    const validatedColdIndex=needsContentReconciliation&&message.action!=='prelaunch'&&
      healthy&&!planning&&
      !planDirty&&!index?.unavailable;
    if(index&&healthy&&!planning&&message.action!=='prelaunch'){
      const names=[...index.checks].filter(([name,row])=>
        row.plan.synchronizedInstalledRead&&(!message.name||message.name===name))
        .map(([name])=>name);
      if(names.length&&validatedColdIndex){
        synchronizedInstalled=true;
        timing('daemon.request_installed_from_reconcile',performance.now(),
          {checks:names.length,files:index.files.size});
      }else if(names.length)try{
        if(installedRecheck)await installedRecheck;
        const observedIndex=index;
        const recheckStarted=performance.now();
        installedRecheck=observedIndex.recheckInstalled(names);
        const result=await installedRecheck;
        metrics.lastInstalledRecheck=result;
        timing('daemon.request_installed_recheck',recheckStarted,
          {files:result.files,bytes:result.bytes});
        installedRecheck=null;
        await catchUp();
        if(flushTimer||pending.size||planDirty)flush();
        synchronizedInstalled=healthy&&!planning&&!planDirty&&!index.unavailable&&
          index===observedIndex;
      }catch(e){installedRecheck=null;observationGap('installed_recheck',e);}
    }
    const probeStarted=performance.now();
    // A run's start checkpoint skips the full probe when its recording can
    // replace the certificate; the end checkpoint offers that recording.
    let adoptIntent=false,recorded;const adopting=new Set();
    if(index&&healthy&&!validatedColdIndex&&message.action!=='prelaunch'){
      const continuous=continuityBarrier(),probed=index,gaps=metrics.gaps,decided=Date.now();
      const selected=[...index.checks].filter(([name])=>!message.name||message.name===name);
      if(message.action==='snapshot'&&typeof message.adopt==='string'&&/^[0-9a-f-]{36}$/.test(message.adopt)){
        const row=index.checks.get(message.name);
        recorded=row?adopt(message.name,row,message.adopt):'recording unavailable';
      }
      adoptIntent=message.action==='snapshot'&&message.runCertificate===1&&!message.adopt&&continuous;
      const keys=new Map(selected.map(([name,row])=>[name,inputKey(row)]));
      const skip=message.action==='sync'?knownStale:()=>false;
      if(message.action==='sync')refreshReceipts();
      // With a deferred barrier, validate in-process first and launch any full
      // probe only after the barrier, so a queued edit costs one probe, not two.
      for(const [name,row] of selected)if(!skip(name,row))probe(row,continuous,{launch:!deferBarrier&&!adoptIntent});
      if(continuous&&process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_MAC_PROBE_SIGNAL){
        fs.writeFileSync(process.env.VSTATE_TEST_MAC_PROBE_SIGNAL,'validated');
        await new Promise(resolve=>setTimeout(resolve,200));
      }
      // Validation and probes block JS event delivery. Finish with a continuity
      // barrier so queued edits/gaps cannot be published using the pre-probe index.
      if(continuous||deferBarrier)try{const started=performance.now();
        await catchUp();if(planDirty||pending.size||flushTimer)flush();
        timing('daemon.request_catch_up',started,{after:'probes'});
        // Rows not yet confirmed, or whose inputs moved meanwhile, are probed
        // from the barrier, as an undeferred decision would have done.
        // Decided once, after the barrier. The start probe value is already out
        // of date; clearing it means whichever probe comes next sets the value
        // for this unchanged interval without counting as a change during the run.
        if(adoptIntent&&index===probed&&healthy&&!planning)for(const [name,row] of selected)
          if(row.probeAt<decided&&adoptable(row)){
            adopting.add(name);row.probeHash=null;
            row.adoption={token:randomUUID(),serial:inputEventSerial.get(name)||0,gaps:metrics.gaps,
              input:inputKey(row),cache:row.probeCache};
          }
        const rest=index===probed&&healthy&&!planning?selected.filter(([name,row])=>!skip(name,row)&&
          !adopting.has(name)&&(row.probeAt<decided||metrics.gaps!==gaps||inputKey(row)!==keys.get(name))):[];
        const launched=metrics.fullProbes||0;
        for(const [,row] of rest)probe(row,continuityBarrier());
        if(continuous&&(metrics.fullProbes||0)>launched){await catchUp();if(planDirty||pending.size||flushTimer)flush();}
      }catch(e){observationGap('post_probe_history',e);}
    }
    timing('daemon.request_probes',probeStarted,{checks:index?.checks.size||0});
    lastObservation=Date.now();publish();
    // A run checkpoint never holds an installed identity from the racy window:
    // a same-size write in the same timestamp tick would keep it. Wait the
    // window out (at most 2 s), record those files again, and mark the
    // checkpoint unusable if one is still inside it.
    let racy=false;
    if(message.action==='snapshot'||message.action==='prelaunch'){
      const names=message.name?[message.name]:null;
      const indexes=()=>[index,...[...external.values()].map(e=>e.index)].filter(Boolean);
      const wait=Math.min(racyWindowMs,Math.max(0,...indexes().map(i=>i.racyUntil(names)))-Date.now());
      if(wait>0){metrics.racyWaits=(metrics.racyWaits||0)+1;await new Promise(resolve=>setTimeout(resolve,wait+5));}
      for(const i of indexes())i.settleRacy();
      racy=indexes().some(i=>i.racyUntil(names)>Date.now());
      if(racy)metrics.racyCheckpoints=(metrics.racyCheckpoints||0)+1;
    }
    const applicabilityStarted=performance.now();
    const data=status(message.contextHashes,synchronizedInstalled,
      process.platform==='win32'&&healthy&&!planning&&!planDirty);
    if(message.action==='snapshot'||message.action==='prelaunch') {
      data.snapshots={};for(const [name,row] of index?.checks||[])
        if(!message.name||message.name===name)
          data.snapshots[name]={...combinedSummary(name),files:combinedFiles(name),
          planGeneration:row.plan.id,
            inputEventSerial:inputEventSerial.get(name)||0,
            // Complete only when the oldest kept event follows the given serial.
            ...(Number.isSafeInteger(message.sinceSerial)?(()=>{const list=inputEventPaths.get(name)||[],
              since=message.sinceSerial,later=list.filter(([serial])=>serial>since);
              return {inputEventPaths:later.map(([,rel])=>rel),
                inputEventPathsComplete:(inputEventSerial.get(name)||0)-since===later.length};})():{}),
            probeHash:row.probeHash,inputKey:inputKey(row),observationGaps:metrics.gaps,
            observationHealthy:healthy&&!planning&&!recovering&&!racy&&applicableExternal(name).every(e=>e.healthy)};
      // Export only a currently guarded, check-specific discovery certificate.
      // The caller compares it with the answers its own compile received. Schema 2
      // certifies the realpath of every directory readDirectory visits. The
      // snapshot stays the start of the observed interval, including validation.
      if(message.runCertificate===1&&continuityBarrier()){
        const row=index?.checks.get(message.name),cache=row?.probeCache;
        // Also after an accepted recording: the caller compares its record with
        // this certificate and finds its run facts with it.
        if(row?.plan.qualification==='npm-typescript-direct-v1'&&
          !row.plan.unresolved.length&&cache?.schema===1&&cache.input===inputKey(row)&&
          cache.hash===row.probeHash&&cache.guard===planGuard(index.bundle)&&
          cache.output&&cache.queryData&&data.snapshots[message.name])
          data.snapshots[message.name].discoveryCertificate={schema:2,planId:row.plan.id,
            cwd:row.plan.cwd,probeDefinition:sha(JSON.stringify(row.plan.probes)),
            context:cache.context,output:cache.output,stderrHash:cache.stderrHash,
            queryData:cache.queryData};
      }
      // For a run checked by full probes: the last probe's questions, only to
      // find the run's lookups outside them. Never evidence for reuse.
      if(message.runFacts===1&&data.snapshots[message.name]){
        const row=index?.checks.get(message.name),cache=row?.probeCache;
        if(row?.plan.qualification==='npm-typescript-direct-v1'&&cache?.queryData&&
          typeof cache.context==='string'&&cache.input===inputKey(row)&&cache.hash===row.probeHash&&
          cache.guard===planGuard(index.bundle))
          data.snapshots[message.name].probeQuestions={context:cache.context,queryData:cache.queryData};
      }
      const row=index?.checks.get(message.name);
      if(adopting.has(message.name)&&row?.adoption&&data.snapshots[message.name])
        data.snapshots[message.name].recordedCertificate=row.adoption.token;
      if(typeof recorded==='string'&&data.snapshots[message.name])data.snapshots[message.name].recordingIssue=recorded;
    }
    timing('daemon.request_applicability',applicabilityStarted,{checks:data.checks.length});
    timing('daemon.request_total',totalStarted,{action:message.action,
      healthy:healthy?1:0});
    return data;
  }
  return {error:'unknown action'};
}
async function shutdown() {
  if(stopping)return;
  const retainEligible=healthy&&!historyDisabled&&!index?.unavailable&&!planDirty;
  stopping=true;healthy=false;reason='observer stopping';publish();
  event('observer_stopped',{pid:process.pid});clearTimeout(flushTimer);
  if(retainEligible&&index&&!planning&&watcher){
    try {await catchUp();
      if(pending.size||[...external.values()].some(e=>e.pending.size))flush();
      // The process was healthy before the stop request only if its index and
      // cursor can be retained. A failed catch-up leaves the old snapshot
      // unusable for optimistic restart.
      if(!index.unavailable&&fs.existsSync(snapshotPath)){
        healthy=true;retainIndex();healthy=false;}
    } catch(e){event('index_retention_unavailable',{classification:e.name||'Error'});}
  }
  closeHistory();planningWorker?.terminate().catch(()=>{});
  clearInterval(heartbeat);clearInterval(probeTimer);clearTimeout(recoveryTimer);
  watcher?.unsubscribe().catch(()=>{});server.close();
  for(const entry of external.values()){
    clearTimeout(entry.recovery);entry.watcher?.unsubscribe().catch(()=>{});}
  if(endpoint.filesystem)try{fs.unlinkSync(socket);}catch{}
  fs.rmSync(lock,{recursive:true,force:true});
  // A native watcher handle may remain wedged even after unsubscribe. State
  // and control ownership are already released; bound process shutdown.
  setTimeout(()=>process.exit(0),1000).unref();
}
const server=net.createServer(client=>{
  let text='',handled=false;
  client.on('error',e=>event('control_client_error',{error_code:e.code||e.name}));
  client.on('close',()=>{if(!client.vstateReplied)
    event('control_reply_unavailable',{classification:handled?'closed_without_reply':
      'closed_before_request',request_bytes:text.length});});
  client.on('data',d=>{
    if(handled)return;text+=d;if(text.length>4096){event('control_request_rejected',
      {classification:'request_too_large',request_bytes:text.length});client.destroy();return;}
    if(!text.includes('\n'))return;handled=true;
    try{const message=JSON.parse(text);
      const decision=message.action==='sync'||message.action==='snapshot';
      if(decision)decisionRequests++;
      traceScope({request:message.diagnostic?.request||traceId(),work:'request'},()=>{
        mark('server.request_received',{activeDecisions:decisionRequests});
        Promise.resolve(request(message)).then(v=>respond(client,v))
          .catch(e=>respond(client,{error:e.message}))
          .finally(()=>{mark('server.request_complete');if(decision)decisionRequests--;});});}
    catch(e){respond(client,{error:e.message});}
  });
});
async function attachWatch(){
  try {watcher=await subscribe(root,(error,changes)=>{
    if(error){observationGap(error.code||'subscription_error',error);
      watcher?.unsubscribe().catch(()=>{});watcher=null;
      return;}
    if(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_DROP_EVENTS_FILE&&
      fs.existsSync(process.env.VSTATE_TEST_DROP_EVENTS_FILE))return;
    for(const change of changes){const rel=observedRelative(root,change.path);
      if(rel===null){observationGap('event_outside_checkout');break;}
      notification(change.type,rel);}
  });
  } catch(e){watcher=null;observationGap(e.code||'subscription_start',e);}
}
async function attachExternal(entry) {
  try{entry.identity=fs.statSync(entry.root,{bigint:true});
    entry.watcher=await subscribe(entry.root,(error,changes)=>{
    if(error){entry.watcher?.unsubscribe().catch(()=>{});entry.watcher=null;
      externalGap(entry,error.code||'subscription_error',error);return;}
    if(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_DROP_EVENTS_FILE&&
      fs.existsSync(process.env.VSTATE_TEST_DROP_EVENTS_FILE))return;
    for(const change of changes){const rel=observedRelative(entry.root,change.path);
      if(rel===null){externalGap(entry,'event_outside_root');break;}
      externalNotification(entry,change.type,rel);}
  });}
  catch(e){entry.watcher=null;entry.reason=`external subscription unavailable: ${e.code||e.name}`;}
}
server.listen({path:socket,readableAll:false,writableAll:false},async()=>{
  const setupStarted=performance.now();
  if(endpoint.filesystem)fs.chmodSync(socket,0o600);
  event('control_listening',{pid:process.pid});
  loadReceipts();await attachWatch();
  if(hasHistory&&watcher&&!fs.existsSync(snapshotPath))try{
    await queryHistory(root,snapshotPath,'initial snapshot');}
    catch(e){historyDisabled=true;event('history_unavailable',{phase:'initial snapshot',
      error_code:e.code||e.name});}
  for(const entry of external.values()){
    await attachExternal(entry);
    if(!historyDisabled&&entry.watcher&&!fs.existsSync(entry.snapshot))try{
      await queryHistory(entry.root,entry.snapshot,'external initial snapshot');}
      catch(e){historyDisabled=true;event('history_unavailable',
        {phase:'external initial snapshot',error_code:e.code||e.name});}
  }
  metrics.initialObservationSetupMs=performance.now()-setupStarted;
  refreshPlan({forceCold:historyDisabled});
  event('observer_started',{pid:process.pid});publish();
});
const heartbeat=setInterval(()=>{
  verifyRoot();
  for(const entry of external.values())if(entry.watcher){
    try{const identity=fs.statSync(entry.root,{bigint:true});
      if(identity.dev!==entry.identity?.dev||identity.ino!==entry.identity?.ino)
        externalGap(entry,'root_identity_changed');}
    catch(e){externalGap(entry,'root_unavailable',e);}
  }
  publish();
},1000);
// Idle revalidation keeps probe results fresh for cached status without
// launching a process: certificates are replayed in-process, and one that no
// longer holds expires so the next decision runs the full probe. macOS history
// replay would fork, so cached status there relies on live notifications.
const probeTimer=setInterval(()=>traceScope({request:traceId(),work:'periodic'},async()=>{
  mark('server.periodic_start',{pending:pending.size,planDirty,planning,decisionRequests});
  // Windows cached reads are conservatively UNVERIFIED until a full decision
  // reconciliation, so idle revalidation cannot strengthen them.
  if(process.platform==='win32')return;
  if(healthy&&index&&!planning&&!recovering&&!decisionRequests){
    try{if(!hasHistory)await catchUp();}catch(e){observationGap('periodic_query',e);}
    if(healthy&&index&&!planning&&!recovering)
      for(const row of index.checks.values())probe(row,true,{launch:false});
    if(planDirty)flush();else publish();
  }
  mark('server.periodic_complete');
}),5000);
process.on('uncaughtExceptionMonitor',error=>{
  try{event('observer_uncaught_exception',{pid:process.pid,code:error.code||null,
    message:error.message,stack:error.stack});}catch{}
});
process.on('exit',code=>{try{event('observer_exit',{pid:process.pid,code,stopping,
  healthy,planning,recovering});}catch{}});
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
