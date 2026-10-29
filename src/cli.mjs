#!/usr/bin/env node
import {builtInProbe,probeFloorMs,publishedDeadline} from './probe-deadline.mjs';
import fs from 'node:fs';
import {directQualification,directInterpretation,observedNpmContext} from './direct-typescript.mjs';
import {directRunCertificateAllowed,directRunCertificate,directRunRecordable,directRunRecording,probeQuestions,validateRunRecord} from './direct-run-certificate.mjs';
import {queryAnswer,runFactChange} from './typescript-list.mjs';
import {patternMatcher} from './glob.mjs';
import {observedBy} from './installed-observation.mjs';
import {changedFiles,coverageReadable,gitIgnored,recordedEnvironment,testEnvironmentIssue,testGuardConfig,testRunGuard,testRunFacts,sharedInstalledFile,testsInterpretation,testsQualification} from './test-direct.mjs';
import {childProgram,lookup,pnpmConfigFiles,scriptCaches,scriptInstalledPaths,scriptInterpretation,scriptQualification,scriptRunFacts,pnpmNameless,toolOutput,toolchainDirs} from './node-script.mjs';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {processAlive} from './process-liveness.mjs';
import {controlEndpoint} from './control-endpoint.mjs';
import {samePath,withinPath,realObservedPath} from './path-identity.mjs';
import {findExecutable} from './executable-lookup.mjs';
import {windowsLaunch} from './windows-command.mjs';
import {terminateWindowsTree} from './windows-process.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {assertOwnedStatePlacement} from './owned-state.mjs';
import {permittedRoots} from './installed-inputs.mjs';
import {acquireRunLock,inspectRunLock,recoverRunLock} from './run-lock.mjs';
import {atomicJson,commitReceipt,readReceipts,receiptRevision} from './state-store.mjs';
import {timing,profiling,mark,traceContext} from './decision-profile.mjs';
import {readCachedStatus,unavailableCached} from './cached-state.mjs';
import {renderRun} from './presentation.mjs';

mark('cli.loaded');
const here=path.dirname(fileURLToPath(import.meta.url));
const [configArg,action,name]=process.argv.slice(2);
if(!configArg||!action)throw Error('internal usage: cli.mjs CONFIG ACTION [check]');
const configStarted=performance.now();
const configFile=path.resolve(configArg), config=JSON.parse(fs.readFileSync(configFile));
const maintenance=['stop','uninstall'].includes(action);
const root=maintenance?path.resolve(config.root):realObservedPath(config.root), state=path.resolve(config.state),
  endpoint=controlEndpoint(state),socket=endpoint.address;
assertOwnedStatePlacement(config);
if(withinPath(state,root))throw Error('state must be outside checkout');
if([path.parse(state).root,os.homedir(),path.dirname(os.homedir())]
  .some(value=>samePath(value,state))||
  !/^(?:vstate|redue)-/.test(path.basename(state)))
  throw Error('state directory name must start with redue- (or legacy vstate-); use a dedicated directory outside the checkout');
const ownerFile=path.join(state,'vstate-owner-v1.json');
timing('cli.config_resolution',configStarted);
// A native Windows decision reconciles declared contents instead of trusting
// watcher history. The measured 6k-file pnpm workspace can legitimately need
// more than the former 15 s default; uncertainty still wins on expiry.
// A decision can include a full probe, whose deadline the observer publishes.
// Read when a wait starts, so a deadline the previous decision raised counts.
const decisionBaseMs=process.platform==='win32'?30000:15000;
function publishedProbeDeadline() {
  try{return publishedDeadline(JSON.parse(fs.readFileSync(path.join(state,'status.json'),'utf8')).probe_deadline_ms);}
  catch{return 0;}
}
// The wait for a decision, read when it starts: the base at once, and the
// published deadline when status.json has been read. That file is rewritten
// at every decision, and a first read of a fresh file is slow where a scanner
// checks files as they are opened, so it is read off the main thread while
// the call runs. An override is exact.
const decisionWait=override=>override?{timeout:Number(override),deadline:null}:{timeout:decisionBaseMs,
  deadline:fs.promises.readFile(path.join(state,'status.json'),'utf8')
    .then(text=>Math.max(decisionBaseMs,publishedDeadline(JSON.parse(text).probe_deadline_ms)+10000),()=>decisionBaseMs)};
const digest=value=>createHash('sha256').update(value).digest('hex');
function nodeIdentity() {const real=fs.realpathSync(process.execPath),st=fs.statSync(real,{bigint:true});
  return digest(JSON.stringify([real,process.version,...['dev','ino','mode','size','mtimeNs','ctimeNs']
    .map(key=>String(st[key]))]));}
function pathExecutableIdentity(name) {
  try{const real=findExecutable(name),st=real&&fs.statSync(real,{bigint:true});
    if(st?.isFile())return digest(JSON.stringify([real,...['dev','ino','mode','size','mtimeNs','ctimeNs']
      .map(key=>String(st[key]))]));}
  catch{}
  return digest('<unavailable>');
}
// The variables each test check's last run read directly (see testRunGuard).
const readsFile=path.join(state,'environment-reads-v1.json');
function environmentReads() {
  try{const value=JSON.parse(fs.readFileSync(readsFile,'utf8'));return value?.schema===1&&value.checks||{};}catch{return {};}
}
const recordedRecipes=[testsQualification,scriptQualification];
function contextHashes() {const reads=config.checks.some(check=>recordedRecipes.includes(check.qualification))?environmentReads():{};
  return Object.fromEntries(config.checks.map(check=>[
  check.name,Object.fromEntries([...(check.environment?.variables||[])
    .map(key=>[key,digest(process.env[key]??'<unset>')]),
    ...(check.environment?.prefixes||[]).map(prefix=>[
      `__vstate_env_prefix_${prefix.toLowerCase()}__`,digest(JSON.stringify(
        Object.entries(process.env).filter(([key])=>
          key.toLowerCase().startsWith(prefix.toLowerCase()))
          .sort(([a],[b])=>a.localeCompare(b))))]),
    ...(check.environment?.pathExecutables||[]).map(name=>[
      `__vstate_path_executable_${name}__`,pathExecutableIdentity(name)]),
    ...(check.environment?.executableIdentity?[['__vstate_node_identity__',nodeIdentity()]]:[]),
    // The variables the last test run read directly, compared here: which
    // list was compared, and the first variable whose value now differs.
    // Control requests are small, so the values stay out of them.
    ...(reads[check.name]?[['__redue_env_reads__',digest(JSON.stringify(reads[check.name]))],
      ['__redue_env_changed__',Object.keys(reads[check.name]).find(key=>
        (process.env[key]===undefined?'<unset>':digest(process.env[key]))!==reads[check.name][key])||'']]:[])])]));}
function probeHash(plan) {
  const started=performance.now();
  const values=[];
  // The observer's current deadline, so a large project's probe is not cut short.
  const timeout=Math.max(probeFloorMs(plan.qualification),publishedProbeDeadline());
  for(const argv of plan.probes||[]) {
    const out=spawnSync(argv[0],[...argv.slice(1),...(builtInProbe(argv)?[`--redue-deadline=${timeout}`]:[])],{cwd:plan.cwd,
      timeout,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe'],env:process.env});
    if(out.error||out.signal||out.status!==0){
      timing('cli.probe',started,{outcome:out.error?.code||out.signal||out.status||'error',
        commands:values.length+1});return null;}
    values.push([argv,out.status,digest(out.stdout),digest(out.stderr)]);
  }
  timing('cli.probe',started,{outcome:'ok',commands:values.length});
  return digest(JSON.stringify(values));
}
function owner(){
  fs.mkdirSync(state,{recursive:true,mode:0o700});
  const expected={schema:1,kind:'vstate-product-alpha',config:configFile,root,state};
  if(fs.existsSync(ownerFile)){
    const existing=JSON.parse(fs.readFileSync(ownerFile));
    if(JSON.stringify(existing)!==JSON.stringify(expected))throw Error('state ownership marker mismatch');
  } else {
    const allowed=withinPath(configFile,state)?path.basename(configFile):null;
    if(fs.readdirSync(state).some(entry=>entry!==allowed))
      throw Error('unowned state directory is not empty; inspect before initializing');
    atomicJson(ownerFile,expected);
  }
}
// deadline, when given, resolves to the whole wait in ms, which replaces
// timeout when it is longer.
function call(message,timeout=5000,deadline=null) {
  return new Promise((resolve,reject)=>{
    let data='',done=false;mark('client.control_connect',{deadlineMs:timeout});const client=net.createConnection(socket);
    const started=Date.now(),expire=()=>{mark('client.control_timeout');client.destroy();reject(Error('observer synchronization timeout'));};
    let timer=setTimeout(expire,timeout);
    deadline?.then(total=>{if(done||total<=timeout)return;mark('client.control_deadline',{deadlineMs:total});
      clearTimeout(timer);timer=setTimeout(expire,Math.max(0,total-(Date.now()-started)));});
    client.on('connect',()=>{mark('client.control_submit');client.write(JSON.stringify({...message,...(profiling?{diagnostic:traceContext()}: {})})+'\n');});
    client.on('data',chunk=>data+=chunk);
    client.on('end',()=>{mark('client.control_complete',{bytes:data.length});clearTimeout(timer);if(done)return;done=true;
      try{resolve(JSON.parse(data));}catch(e){reject(e);}});
    client.on('error',e=>{mark('client.control_error',{code:e.code});clearTimeout(timer);done=true;reject(e);});
  });
}
async function decisionCall(message,{timeout,deadline}) {
  let total=timeout;deadline?.then(value=>{total=Math.max(total,value);});
  const started=Date.now(),remaining=()=>Math.max(1,total-(Date.now()-started));
  try{return await call(message,timeout,deadline);}
  catch(error){
    if(process.platform!=='win32'||!['ENOENT','ECONNREFUSED','ECONNRESET'].includes(error.code))throw error;
    const pidFile=path.join(state,'observer.lock','pid');
    let pid=null;try{pid=Number(fs.readFileSync(pidFile));}catch{}
    const alive=Number.isSafeInteger(pid)&&pid>0?processAlive(pid):null;
    const diagnostic={at:Date.now(),kind:'control_connection_unavailable',code:error.code,
      pid,alive,remainingMs:remaining(),cached:cached().observation};
    try{fs.appendFileSync(path.join(state,'events.jsonl'),JSON.stringify(diagnostic)+'\n');}catch{}
    if(alive){
      // Exactly one reconnect. The sync operation still validates contents;
      // connection recovery by itself is never evidence of applicability.
      await new Promise(resolve=>setTimeout(resolve,100));
      return call(message,remaining());
    }
    if(alive!==false||!fs.existsSync(ownerFile)||inspectRunLock(state).state!=='absent')throw error;
    owner();
    const recovery=path.join(state,'control-recovery.json');
    try{fs.writeFileSync(recovery,JSON.stringify({pid,at:Date.now()}),{flag:'wx',mode:0o600});}
    catch{throw Error('automatic control recovery already attempted; inspect observer.log and run start');}
    const child=spawn(process.execPath,[fileURLToPath(import.meta.url),configFile,'start'],{
      cwd:os.tmpdir(),env:{...process.env,VSTATE_START_READY_WAIT_MS:String(Math.min(remaining(),10000))},
      stdio:'ignore'});
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{child.kill();reject(Error('control recovery start timeout'));},remaining());
      child.on('error',e=>{clearTimeout(timer);reject(e);});
      child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('control recovery start failed'));});
    });
    let value=await call(message,remaining());
    // Initialization may be honest UNVERIFIED. Never wait/retry an arbitrary
    // failure; only allow the normal started observer to finish its one index.
    while(!value.observation?.healthy&&
      ['discovery','indexing','reconciling','validating'].includes(value.observation?.phase)&&remaining()>100){
      await new Promise(resolve=>setTimeout(resolve,100));
      value=await call(message,remaining());
    }
    if(value.observation?.healthy)fs.unlinkSync(recovery);
    return value;
  }
}
const cached=()=>readCachedStatus(state,config.checks);
async function testRunBoundary(phase) {
  if(process.env.VSTATE_TEST_FAULTS!=='1'||process.env.VSTATE_TEST_RUN_BOUNDARY!==phase)return;
  const release=path.join(state,'test-run-release');
  fs.writeFileSync(path.join(state,'test-run-paused'),phase);
  const until=Date.now()+5000;
  while(!fs.existsSync(release)&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,10));
  if(!fs.existsSync(release))throw Error('test run boundary was not released');
}
async function execute() {
  const totalStarted=performance.now();
  const selected=config.checks.find(c=>c.name===name);
  if(!selected)throw Error(`unknown check ${name}`);
  // Recording uses existing state only. Never initialize or repair ownership
  // as a fallback for unavailable observation.
  const expectedOwner={schema:1,kind:'vstate-product-alpha',config:configFile,root,state};
  const existingOwner=JSON.parse(fs.readFileSync(ownerFile,'utf8'));
  if(JSON.stringify(existingOwner)!==JSON.stringify(expectedOwner))
    throw Error('state ownership marker mismatch');
  const lockStarted=performance.now(),runLock=acquireRunLock(state);
  timing('cli.run_lock',lockStarted);
  const captureIssues=[];
  let activeChild=null,requestedSignal=null,treeStop=null,preserveRunLock=false;
  const forward=signal=>{requestedSignal=signal;
    if(activeChild&&activeChild.exitCode===null){
      if(process.platform==='linux'&&activeChild.pid){
        try{process.kill(-activeChild.pid,signal);}
        catch(e){if(e.code!=='ESRCH')throw e;}
      }else if(process.platform==='win32'&&activeChild.pid){
        treeStop??=terminateWindowsTree(activeChild.pid).catch(e=>{
          captureIssues.push(`Windows check-tree cancellation unavailable: ${e.message}`);
          preserveRunLock=true;
          activeChild?.kill();
        });
      }else activeChild.kill(signal);
    }};
  const interrupt=()=>forward('SIGINT'),terminate=()=>forward('SIGTERM');
  process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
  const cancelMessage=message=>{if(message?.action==='cancel'&&
    ['SIGINT','SIGTERM'].includes(message.signal))forward(message.signal);};
  process.on('message',cancelMessage);
  try {
    if(!fs.existsSync(path.join(state,'plans-v1.json')))
      throw Error('observer input plan is not ready; wait for redue status to report ready');
    const resolutionStarted=performance.now();
    const plan=JSON.parse(fs.readFileSync(path.join(state,'plans-v1.json'))).plans[name];
    if(!plan)throw Error('selected input plan unavailable');
    if(plan.selectedConfigHash!==digest(JSON.stringify(selected)))
      throw Error('selected check configuration changed; restart observer before recording');
    const command=selected.command;
    if(!Array.isArray(command)||!command.length||!command.every(x=>typeof x==='string'&&x))
      throw Error('invalid execution argv');
    if(digest(JSON.stringify(command))!==plan.commandIdentity.argvHash)
      throw Error('execution argv differs from discovered plan');
    timing('cli.command_resolution',resolutionStarted);
    const runId=randomUUID();
    const contextStarted=performance.now();
    const environmentBefore=contextHashes()[name];
    const observedContext=selected.qualification===directQualification?{interpretation:directInterpretation,npmProxyDigest:observedNpmContext()}:null;
    timing('cli.context_before',contextStarted);
    const captureWait=decisionWait(process.env.VSTATE_CAPTURE_TIMEOUT_MS);
    let before=null,after=null;
    // Expensive state probes can take seconds. Keep the filesystem checkpoint
    // adjacent to process launch so a late notification from earlier work
    // does not enter the execution interval before the check even starts.
    const callerCertificate=directRunCertificateAllowed(selected);
    const probePlan={cwd:plan.cwd,probes:selected.probes||[],qualification:selected.qualification};
    let probeBefore=callerCertificate?null:probeHash(probePlan);
    const startSnapshotStarted=performance.now();
    try{before=await call({action:'snapshot',name,contextHashes:contextHashes(),
      ...(callerCertificate?{runCertificate:1}:{})},captureWait.timeout,captureWait.deadline);}
    catch(error){captureIssues.push('start observation unavailable'+
      (typeof error.code==='string'&&/^[A-Z0-9_]+$/.test(error.code)?` (${error.code})`:''));}
    timing('cli.start_checkpoint',startSnapshotStarted,{available:before?.snapshots?.[name]?1:0});
    // Missing discovery metadata can recover through a full probe. A missing
    // healthy start boundary cannot: freeze this decision before any recovery.
    // Only the reviewed direct recipe on macOS and Linux enters this shortcut.
    const unobservedDirectRun=callerCertificate&&
      before?.snapshots?.[name]?.observationHealthy!==true;
    if(unobservedDirectRun){
      captureIssues.push('qualification probes and end checkpoint not performed: no healthy start checkpoint');
      mark('cli.run_validation_skipped',{reason:'start_observation_unavailable',probes:2,endCheckpoint:1});
    }
    await testRunBoundary('after-start-checkpoint');
    // Start the observed interval before caller validation, not after it. Any
    // intervening edit (even restored before launch) remains disqualifying.
    // With a certificate, the compile records its own answers instead of two probes.
    // Without one after an edit, the recording can become the certificate at the
    // end checkpoint; that checkpoint probes in full if it cannot.
    let certificate=null,recording=null;
    if(callerCertificate&&!unobservedDirectRun){
      certificate=directRunCertificate(plan,selected,before?.snapshots?.[name],root);
      if(!certificate)recording=directRunRecording(plan,selected,before?.snapshots?.[name],root);
      probeBefore=certificate?.value??(recording?null:probeHash(probePlan));
    }
    // The record arrives on fd 3, so the compiler's environment is unchanged.
    // Every direct run is recorded: even one checked by full probes needs its
    // lookups outside the certificate, which no probe makes.
    const recorded=directRunRecordable(selected)&&!unobservedDirectRun;
    const launched=recorded?[command[0],'--require',path.join(here,'run-recorder.cjs'),
      ...command.slice(1)]:command;
    // A test run's processes record what the guard checks (test-recorder.cjs),
    // and so do a general recipe run's, through the package manager.
    const general=selected.qualification===scriptQualification;
    const testRun=recordedRecipes.includes(selected.qualification)&&['darwin','linux'].includes(process.platform);
    let testRecord=null,launchEnv=process.env,testFacts={},toolchain=[];
    if(testRun){
      // The package directory and installed node_modules, as the plan has them.
      try{testFacts=general?scriptRunFacts(root,selected):testRunFacts(root,selected);}
      catch(e){captureIssues.push(`${general?'script':'test'} run facts unavailable (${e.code||e.message})`);}
      const environmentIssue=testEnvironmentIssue();
      if(environmentIssue)captureIssues.push(environmentIssue);
      testRecord=path.join(state,`test-record-${runId}`);
      fs.mkdirSync(testRecord,{mode:0o700});
      const guardFile=path.join(testRecord,'guard.json'),guardConfig=testGuardConfig(testRecord,root,process.env,testFacts);
      if(general){toolchain=toolchainDirs();
        // The Node on PATH, which the environment identifies by its file.
        Object.assign(guardConfig,{installed:scriptInstalledPaths(root,testFacts.dirs||[]),toolchain,
          node:lookup('node',process.env.PATH,process.cwd())});}
      fs.writeFileSync(guardFile,JSON.stringify(guardConfig),{mode:0o600});
      launchEnv=recordedEnvironment(guardFile);
      // npm's and pnpm's update checks read state outside the checkout and the network.
      if(general)launchEnv.npm_config_update_notifier='false';
    }
    let runnerPid=null;
    const record=[];
    // A Windows full reconciliation may finish while queued watcher callbacks
    // are still arriving. Fold callbacks delivered before process launch into
    // the starting checkpoint; callbacks after launch still disqualify reuse.
    if(process.platform==='win32'&&before?.snapshots?.[name]?.observationHealthy){
      await new Promise(resolve=>setTimeout(resolve,100));
      const prelaunchStarted=performance.now();
      try{before=await call({action:'prelaunch',name,
        contextHashes:contextHashes()},Math.min(captureWait.timeout,5000));}
      catch{before=null;captureIssues.push('prelaunch observation unavailable');}
      timing('cli.prelaunch_checkpoint',prelaunchStarted,
        {available:before?.snapshots?.[name]?1:0});
    }
    const snap=before?.snapshots?.[name];
    if(!snap||!snap.observationHealthy)captureIssues.push('start checkpoint unavailable');
    await testRunBoundary('before-launch');
    const started=Date.now(),executionStarted=performance.now();
    const invocation=await new Promise(resolve=>{
      if(requestedSignal){resolve({status:'interrupted',exitCode:null,signal:requestedSignal});return;}
      let child,spawnError=null;
      try{runLock.phase('launching');
        const launch=windowsLaunch(launched);
        child=spawn(launch.file,launch.args,{cwd:plan.cwd,
        stdio:recorded?['inherit','inherit','inherit','pipe']:'inherit',env:launchEnv,
        detached:process.platform==='linux',...launch.options});
        child.stdio[3]?.on('data',chunk=>record.push(chunk));}
      catch(e){resolve({status:'start_failed',exitCode:null,signal:null,errorCode:e.code||e.name});return;}
      activeChild=child;runnerPid=child.pid??null;runLock.phase('running',child.pid??null);
      mark('cli.child_started',{childPid:child.pid});
      if(requestedSignal)forward(requestedSignal);
      child.on('error',e=>{spawnError=e.code||e.name;});
      child.on('close',async(exit,signal)=>{
        if(treeStop)await treeStop;
        if(process.platform==='linux'&&requestedSignal&&child.pid){
          // A verification command may have forked children in its process
          // group. Normal cancellation must reach them even if the leader has
          // already exited. Commands that daemonize into a new session remain
          // an explicit unsupported process boundary.
          try{process.kill(-child.pid,'SIGTERM');}
          catch(e){if(e.code!=='ESRCH')captureIssues.push('descendant stop uncertain');}
        }
        activeChild=null;if(!preserveRunLock)runLock.phase('finished');
        resolve({status:spawnError?'start_failed':signal||requestedSignal?'interrupted':'exited',
          exitCode:exit,signal:signal||requestedSignal||null,
          ...(spawnError?{errorCode:spawnError}:{})});
      });
    });
    const ended=Date.now();
    timing('cli.compiler_execution',executionStarted,{status:invocation.status,exit:invocation.exitCode});
    await testRunBoundary('after-exit');
    invocation.startedAt=started;invocation.durationMs=ended-started;
    invocation.argvHash=plan.commandIdentity.argvHash;
    invocation.argc=command.length;
    invocation.runId=runId;
    invocation.reporting='normal';
    const result=invocation.status==='exited'?(invocation.exitCode===0?'PASS':'FAIL'):null;
    const target={source:'direct-command',status:invocation.status==='exited'?'direct_executed':'unknown'};
    const afterContextStarted=performance.now(),environmentAfter=contextHashes()[name];
    timing('cli.context_after',afterContextStarted);
    let probeAfter=null;
    const recordText=Buffer.concat(record).toString('utf8');
    // Lookups the certificate does not cover, kept with the receipt.
    let runFacts=[];
    if(certificate){
      const issue=validateRunRecord(recordText,certificate,runFacts);
      if(issue)captureIssues.push(`compiler inputs differ from discovery certificate (${issue})`);
      probeAfter=certificate.value;
    }else if(!unobservedDirectRun&&!recording)probeAfter=probeHash(probePlan);
    let guard=null;
    if(testRecord){
      let coverage=null;if(!general)try{coverage=coverageReadable(root,testFacts);}catch{}
      const programs=general?{runner:{file:command[0],args:command.slice(1),cwd:plan.cwd,searchPath:process.env.PATH,
        env:{preload:true,bashEnv:Boolean(process.env.BASH_ENV)}},
        judge:(child,main)=>childProgram(child,{toolchain,parentMain:main}),trusted:scriptCaches}:null;
      guard=testRunGuard(testRecord,{root,sourcePatterns:plan.sourcePatterns||plan.patterns,files:snap?.files,
        runner:runnerPid,environment:selected.environment||{},coverage,programs});
      runFacts=guard.runFacts;
      // The pnpm executable reads its configuration natively: kept by content.
      if(guard.opaque)for(const file of pnpmConfigFiles())try{runFacts.push(['readFile',file,queryAnswer('readFile',file)]);}
        catch{guard.issues.push(`pnpm configuration ${file} cannot be read`);}
      // Hard links count only where the check observes them.
      // As the index matches: source patterns, or additive (installed) ones.
      const source=patternMatcher(plan.sourcePatterns||plan.patterns||[]),additive=patternMatcher(plan.additivePatterns||[]);
      const linkFacts=[],observed=observedBy(root,rel=>source(rel)||additive(rel));
      const shared=sharedInstalledFile(root,testFacts,path.join(state,'pnpm-store-links-v1.json'),{observed,facts:linkFacts});
      if(shared)guard.issues.push(`installed file ${shared.file} ${shared.reason}; a change through it is not observed`);
      else runFacts.push(...linkFacts);
      fs.rmSync(testRecord,{recursive:true,force:true});
    }
    // The daemon reads the recording from owned state; control requests are small.
    const recordFile=recording&&path.join(state,`run-record-${recording}.json`);
    if(recordFile)try{fs.writeFileSync(recordFile,recordText,{mode:0o600});}catch{}
    const endSnapshotStarted=performance.now();
    if(!unobservedDirectRun){
      // The start checkpoint's probe may have raised the deadline.
      const endWait=decisionWait(process.env.VSTATE_CAPTURE_TIMEOUT_MS);
      try{after=await call({action:'snapshot',name,contextHashes:contextHashes(),
        ...(testRun&&Number.isSafeInteger(snap?.inputEventSerial)?{sinceSerial:snap.inputEventSerial}:{}),
        ...(recording?{runCertificate:1,adopt:recording}:recorded&&!certificate?{runCertificate:1,runFacts:1}:{})},
        endWait.timeout,endWait.deadline);}
      catch{captureIssues.push('end observation unavailable');}
      finally{if(recordFile)fs.rmSync(recordFile,{force:true});}
      timing('cli.end_checkpoint',endSnapshotStarted,{available:after?.snapshots?.[name]?1:0});
    }
    const end=after?.snapshots?.[name];
    // A test run's own outputs: git-ignored files it created without reading
    // what was there (test/tmp). When they are the only observed change, the
    // run is kept with the end checkpoint, which includes them.
    let outputs=null;
    let eventsExplained=false,unexplained=end?.inputEventPaths||null;
    if(guard&&snap&&end&&snap.planId===end.planId&&snap.probeHash===end.probeHash&&snap.observationHealthy&&end.observationHealthy&&
      (snap.inputEventSerial===end.inputEventSerial||end.inputEventPathsComplete===true)){
      // A directory event is not an input change; a change to its files shows
      // in the end checkpoint's file map, which is compared too. A link is kept.
      const directory=rel=>{try{return fs.lstatSync(path.join(root,rel)).isDirectory();}catch{return false;}};
      const changed=changedFiles(snap.files,end.files),events=(end.inputEventPaths||[]).filter(rel=>!directory(rel));
      const touched=[...new Set([...changed,...events])].sort();
      const output=rel=>guard.isOutput(rel)||general&&(toolOutput(rel,guard)||pnpmNameless(rel,guard,root,[snap.files,end.files]));
      const ignored=touched.length&&touched.every(output)?gitIgnored(root,touched):new Set();
      unexplained=touched.filter(file=>!ignored.has(file));
      if(!unexplained.length){eventsExplained=true;if(changed.length)outputs=changed;}
    }
    // The end certificate, recorded or probed, must cover what this compile received.
    // With no input event, gap or content change in between, it also holds at the start.
    // A run checked by full probes is compared with it too, for its run facts.
    if(recorded&&!certificate){
      const endCertificate=directRunCertificate(plan,selected,end,root),
        questions=endCertificate||(!recording&&probeQuestions(plan,selected,end,root));
      if(!questions)captureIssues.push('no discovery certificate at the end checkpoint');
      else{
        const issue=validateRunRecord(recordText,questions,runFacts=[]);
        if(issue)captureIssues.push(`compiler inputs differ from discovery certificate (${issue})`);
        if(recording)probeBefore=probeAfter=endCertificate.value;
      }
    }
    // The receipt holds only run facts that still answer as they did during the run.
    runFacts.sort();
    if(runFacts.length>10000)captureIssues.push('too many lookups outside the discovery certificate');
    else{const changed=runFactChange(runFacts);
      if(changed)captureIssues.push(`a lookup outside the discovery certificate changed during execution: ${changed}`);}
    if(recording&&snap?.observationGaps!==end?.observationGaps)
      captureIssues.push('observation gap during execution');
    if(!unobservedDirectRun&&(!end||!end.observationHealthy))captureIssues.push('end checkpoint unavailable');
    if(JSON.stringify(environmentBefore)!==JSON.stringify(environmentAfter))
      captureIssues.push('declared environment changed during execution');
    if(!unobservedDirectRun&&(!probeBefore||!probeAfter||probeBefore!==(recording?end:snap)?.probeHash||
      probeAfter!==end?.probeHash))
      captureIssues.push('declared state probe unavailable or changed');
    if(before?.observation?.generation!==after?.observation?.generation)
      captureIssues.push('observer generation changed during execution');
    if(snap?.planGeneration!==end?.planGeneration)
      captureIssues.push('input plan rebuilt during execution');
    // The reason names up to five files the run did not explain, and a count of the rest.
    if(snap?.inputEventSerial!==end?.inputEventSerial&&!eventsExplained){
      const named=[...new Set(unexplained||[])],more=named.length-5,
        unrecorded=end?.inputEventPathsComplete===false?' (not every event path was kept)':'';
      captureIssues.push('declared input event occurred during execution'+(named.length?
        `: ${named.slice(0,5).join(', ')}${more>0?` and ${more} more`:''}`:'')+unrecorded);
    }
    // A recorded certificate changes only the probe part of the fingerprint.
    if(!outputs&&(!snap||!end||snap.planId!==end.planId||(recording?snap.inputKey!==end.inputKey:snap.fingerprint!==end.fingerprint)||
      snap.revision!==end.revision))captureIssues.push('declared inputs changed or were not observed');
    const stable=captureIssues.length===0;
    // Two runs on the same inputs, environment and plan that disagree make the
    // check nondeterministic until its inputs change.
    let nondeterministic=false;
    const declared=hashes=>Object.entries(hashes||{}).filter(([key])=>!key.startsWith('__redue_env_'));
    if(testRun&&stable&&result){
      const prior=readReceipts(state).checks[name];
      // A difference explained by inputs REDUE did not observe proves nothing.
      nondeterministic=Boolean(!guard?.issues.length&&prior?.stable&&!prior.guardIssues?.length&&prior.result&&prior.planId===(snap?.planId??plan.id)&&
        prior.fingerprint===((recording||outputs?end:snap)?.fingerprint??null)&&
        JSON.stringify(declared(prior.environmentHashes))===JSON.stringify(declared(environmentBefore))&&
        JSON.stringify(prior.runFacts||[])===JSON.stringify([...runFacts].sort())&&
        JSON.stringify(prior.environmentReads||{})===JSON.stringify(guard?.environmentReads||{})&&
        (prior.result!==result||prior.nondeterministic===true));
    }
    // A recorded run's receipt carries its run facts, even none; observers that
    // predate run facts do not reuse version 2.
    // The recipe that made the receipt, which status and the hook name.
    const receipt={result,invocation,target,stable,fingerprintVersion:recorded||testRun?2:1,recipe:selected.qualification||null,
      ...(recorded||testRun?{runFacts}:{}),
      ...(testRun?{verificationRecipe:general?scriptInterpretation:testsInterpretation,guardIssues:guard?.issues||['the run record is unavailable'],
        environmentReads:guard?.environmentReads||{},...(nondeterministic?{nondeterministic}:{})}:{}),
      resolutionLinks:plan.resolutionLinks||[],
      coverage:{qualified:plan.unresolved.length===0,unresolved:plan.unresolved},
      checkpoint:{status:stable?'stable':'unavailable_or_changed',issues:captureIssues,
        startRevision:snap?.revision??null,endRevision:end?.revision??null,
        ...(process.env.REDUE_PUBLIC_INPUT_TRACE==='1'?{
          startInputEventSerial:snap?.inputEventSerial??null,
          endInputEventSerial:end?.inputEventSerial??null}: {})},
      planId:snap?.planId??plan.id,fingerprint:(recording||outputs?end:snap)?.fingerprint??null,
      provider:plan.provider,environmentHashes:environmentBefore,
      ...(observedContext?{observedContext,verificationRecipe:directInterpretation}:{}),
      files:(outputs?end:snap)?.files??null,observerGeneration:before?.observation?.generation??null,
      startRevision:snap?.revision??null,endRevision:end?.revision??null};
    const persistenceStarted=performance.now();
    commitReceipt(state,name,receipt);
    if(testRun){const reads=environmentReads();reads[name]=receipt.environmentReads;atomicJson(readsFile,{schema:1,checks:reads});}
    timing('cli.receipt_persistence',persistenceStarted);
    const reloadStarted=performance.now();
    try{await call({action:'reload'});}catch{/* receipt revisions invalidate older status even when reload IPC is unavailable */}
    timing('cli.receipt_reload',reloadStarted);
    const summary={check:name,result,target:target.status,
      invocation:invocation.status,...(invocation.errorCode?{error_code:invocation.errorCode}:{}),
      stable,coverage_qualified:receipt.coverage.qualified};
    console.log(process.argv[5]==='--human'?renderRun(summary):JSON.stringify(summary));
    timing('cli.run_total',totalStarted,{stable:stable?1:0});
    process.exitCode=invocation.status==='exited'?invocation.exitCode:
      invocation.status==='interrupted'?128+(os.constants.signals[invocation.signal]||1):127;
  }finally{
    process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
    process.off('message',cancelMessage);
    if(process.connected)process.disconnect();
    if(!preserveRunLock)runLock.release();}
}
async function main(){
  if(action==='init') {owner();
    console.log(JSON.stringify({root,state,config:configFile,executable:path.join(here,'cli.mjs')}));return;}
  if(action==='start'){
    if(endpoint.filesystem&&Buffer.byteLength(socket)>100)
      throw Error(`state path is too long for a Unix control socket: ${state}; choose a shorter --state-dir`);
    owner();
    for(const check of config.checks)permittedRoots(root,check.allowedExternalRoots||[]);
    const observerLock=path.join(state,'observer.lock');
    if(fs.existsSync(observerLock)){
      const pid=Number(fs.readFileSync(path.join(observerLock,'pid')));
      if(processAlive(pid))throw Error(`observer already running at PID ${pid}`);
      // Only this development state/socket are owned here; never touch shared services.
      fs.rmSync(observerLock,{recursive:true});
      if(endpoint.filesystem)try{fs.unlinkSync(socket);}catch(e){if(e.code!=='ENOENT')throw e;}
    }
    const log=fs.openSync(path.join(state,'observer.log'),'a',0o600);
    const child=spawn(process.execPath,[path.join(here,'daemon.mjs'),configFile],
      {cwd:os.tmpdir(),detached:true,stdio:['ignore',log,log]});child.unref();fs.closeSync(log);
    const waitMs=Math.min(120000,Math.max(100,
      Number(process.env.VSTATE_START_READY_WAIT_MS||5000)));
    for(let i=0;i<Math.ceil(waitMs/100);i++){
      await new Promise(r=>setTimeout(r,100));
      const data=cached();
      if(data.observation?.healthy){console.log(JSON.stringify({pid:child.pid,state:data.state,
        health:data.observation,ready:true}));return;}
      if(child.exitCode!==null)break;
    }
    try {await call({action:'metrics'},1000);
      const data=cached();console.log(JSON.stringify({pid:child.pid,state:data.state,
        health:data.observation,ready:Boolean(data.observation?.healthy)}));return;}
    catch {
      let live=processAlive(child.pid);
      if(live&&fs.existsSync(path.join(observerLock,'pid')))
        live=Number(fs.readFileSync(path.join(observerLock,'pid')))==child.pid;
      if(live){console.log(JSON.stringify({pid:child.pid,state:'unverified',ready:false,
        health:{healthy:false,reason:'observer initialization pending; query status before relying on evidence'}}));
        return;}
      throw Error('observer control did not become available; inspect owned observer.log');
    }
  }
  if(action==='run-lock-status'){
    console.log(JSON.stringify(inspectRunLock(state)));return;
  }
  if(action==='recover-run-lock'){
    owner();
    console.log(JSON.stringify(recoverRunLock(state,name==='--confirm-check-stopped')));return;
  }
  if(action==='stop'){
    if(!fs.existsSync(ownerFile))throw Error('state ownership marker absent; refusing stop');
    owner();
    try{const answer=await call({action:'stop'});
      for(let i=0;i<100&&fs.existsSync(path.join(state,'observer.lock'));i++)
        await new Promise(r=>setTimeout(r,100));
      if(fs.existsSync(path.join(state,'observer.lock')))
        throw Error('observer did not stop within 10 seconds');
      console.log(JSON.stringify(answer));}
    catch(e){console.log(JSON.stringify({ok:false,state:'observer_unavailable',
      reason:e.code||e.message,recovery:'restore observed root and run start'}));}
    return;
  }
  if(action==='uninstall'){
    if(!fs.existsSync(ownerFile))throw Error('state ownership marker absent; refusing removal');
    owner();
    if(fs.existsSync(path.join(state,'observer.lock'))){
      const pid=Number(fs.readFileSync(path.join(state,'observer.lock','pid')));
      if(processAlive(pid)){await call({action:'stop'});
        for(let i=0;i<100&&fs.existsSync(path.join(state,'observer.lock'));i++)
          await new Promise(r=>setTimeout(r,100));
        if(fs.existsSync(path.join(state,'observer.lock')))throw Error('observer did not stop');}
    }
    fs.rmSync(state,{recursive:true,force:true});
    console.log(JSON.stringify({removed:state}));return;
  }
  if(action==='status'){console.log(JSON.stringify(cached()));return;}
  if(action==='sync'||action==='detail'){
    const started=performance.now();
    if(profiling&&config.checks.some(check=>check.qualification===directQualification)){
      const proxyShapes=Object.entries(process.env).filter(([key])=>/^npm_config_.*proxy$/i.test(key)).map(([key,value])=>{
        try{const url=new URL(value),portDigest=digest(url.port);url.port='';
          return {key,kind:'url',portDigest,withoutPortDigest:digest(url.href)};}
        catch{return {key,kind:value===''?'empty':'non-url',valueDigest:digest(value)};}
      });
      timing('cli.direct_context',started,{interpretation:directInterpretation,
        observedNpmDigest:observedNpmContext(),proxyShapes});
    }
    let value;try{value=await decisionCall({action:'sync',contextHashes:contextHashes()},
      decisionWait(process.env.VSTATE_SYNC_TIMEOUT_MS));
      // A client upgrade can encounter an older running observer. Its successful
      // control response does not establish that it evaluated the latest receipt.
      if(value.receipt_revision===null){
        value=unavailableCached(state,'latest receipt selection unavailable; inspect receipt state before reuse',config.checks);
      }else if(typeof value.receipt_revision!=='string'){
        value=unavailableCached(state,'observer cannot confirm latest receipt selection; stop and start the observer after upgrading',config.checks);
        process.exitCode=2;
      }else if(value.receipt_revision!==receiptRevision(state)){
        value=unavailableCached(state,'receipt selection changed during synchronization; retry synchronized status',config.checks);
        process.exitCode=2;
      }}
    catch(e){value=unavailableCached(state,e.message,config.checks);process.exitCode=2;}
    timing('cli.synchronized_status',started,{available:value.observation?.healthy?1:0});
    // In the front's process (bin/redue.mjs), the value is handed back.
    if(action==='sync'&&process.argv.includes('--value'))syncValue=value;
    else if(action==='sync')console.log(JSON.stringify(value));
    else for(const row of value.checks)console.log(`${row.name}: ${row.freshness}/${row.result||'NO RESULT'} — ${row.reason}`);
    return;
  }
  if(action==='metrics'){console.log(JSON.stringify(await call({action:'metrics'})));return;}
  if(action==='run'){await execute();return;}
  throw Error(`unknown action ${action}`);
}
export let syncValue=null;
export const finished=main().catch(e=>{console.error(`redue: ${e.message}`);process.exitCode=2;});
