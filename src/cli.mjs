#!/usr/bin/env node
import fs from 'node:fs';
import {directQualification,directInterpretation,observedNpmContext} from './direct-typescript.mjs';
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
import {atomicJson,commitReceipt,receiptRevision} from './state-store.mjs';
import {timing,profiling,mark,traceContext} from './decision-profile.mjs';
import {readCachedStatus,unavailableCached} from './cached-state.mjs';
import {renderRun} from './presentation.mjs';

mark('cli.loaded');
const here=path.dirname(fileURLToPath(import.meta.url));
const [configArg,action,name]=process.argv.slice(2);
if(!configArg||!action)throw Error('internal usage: cli.mjs CONFIG ACTION [check]');
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
// A native Windows decision reconciles declared contents instead of trusting
// watcher history. The measured 6k-file pnpm workspace can legitimately need
// more than the former 15 s default; uncertainty still wins on expiry.
const decisionDeadlineMs=process.platform==='win32'?30000:15000;
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
function contextHashes() {return Object.fromEntries(config.checks.map(check=>[
  check.name,Object.fromEntries([...(check.environment?.variables||[])
    .map(key=>[key,digest(process.env[key]??'<unset>')]),
    ...(check.environment?.prefixes||[]).map(prefix=>[
      `__vstate_env_prefix_${prefix.toLowerCase()}__`,digest(JSON.stringify(
        Object.entries(process.env).filter(([key])=>
          key.toLowerCase().startsWith(prefix.toLowerCase()))
          .sort(([a],[b])=>a.localeCompare(b))))]),
    ...(check.environment?.pathExecutables||[]).map(name=>[
      `__vstate_path_executable_${name}__`,pathExecutableIdentity(name)]),
    ...(check.environment?.executableIdentity?[['__vstate_node_identity__',nodeIdentity()]]:[])])]));}
function probeHash(plan) {
  const started=performance.now();
  const values=[];
  for(const argv of plan.probes||[]) {
    const timeout=plan.qualification==='pnpm-tsc-v1'||
      (process.platform==='win32'&&['typescript-noemit-v1','npm-typescript-direct-v1','yarn-workspace-tsc-v1']
        .includes(plan.qualification))?10000:5000;
    const out=spawnSync(argv[0],argv.slice(1),{cwd:plan.cwd,
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
function call(message,timeout=5000) {
  return new Promise((resolve,reject)=>{
    let data='',done=false;mark('client.control_connect',{deadlineMs:timeout});const client=net.createConnection(socket);
    const timer=setTimeout(()=>{mark('client.control_timeout');client.destroy();reject(Error('observer synchronization timeout'));},timeout);
    client.on('connect',()=>{mark('client.control_submit');client.write(JSON.stringify({...message,...(profiling?{diagnostic:traceContext()}: {})})+'\n');});
    client.on('data',chunk=>data+=chunk);
    client.on('end',()=>{mark('client.control_complete',{bytes:data.length});clearTimeout(timer);if(done)return;done=true;
      try{resolve(JSON.parse(data));}catch(e){reject(e);}});
    client.on('error',e=>{mark('client.control_error',{code:e.code});clearTimeout(timer);reject(e);});
  });
}
async function decisionCall(message,timeout) {
  const started=Date.now(),remaining=()=>Math.max(1,timeout-(Date.now()-started));
  try{return await call(message,remaining());}
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
async function execute() {
  const totalStarted=performance.now();
  const selected=config.checks.find(c=>c.name===name);
  if(!selected)throw Error(`unknown check ${name}`);
  const runLock=acquireRunLock(state);
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
    const plan=JSON.parse(fs.readFileSync(path.join(state,'plans-v1.json'))).plans[name];
    if(!plan)throw Error('selected input plan unavailable');
    if(plan.selectedConfigHash!==digest(JSON.stringify(selected)))
      throw Error('selected check configuration changed; restart observer before recording');
    const command=selected.command;
    if(!Array.isArray(command)||!command.length||!command.every(x=>typeof x==='string'&&x))
      throw Error('invalid execution argv');
    if(digest(JSON.stringify(command))!==plan.commandIdentity.argvHash)
      throw Error('execution argv differs from discovered plan');
    const runId=randomUUID();
    const contextStarted=performance.now();
    const environmentBefore=contextHashes()[name];
    const observedContext=selected.qualification===directQualification?{interpretation:directInterpretation,npmProxyDigest:observedNpmContext()}:null;
    timing('cli.context_before',contextStarted);
    const
      captureTimeout=Number(process.env.VSTATE_CAPTURE_TIMEOUT_MS||decisionDeadlineMs);
    let before=null,after=null;
    // Expensive state probes can take seconds. Keep the filesystem checkpoint
    // adjacent to process launch so a late notification from earlier work
    // does not enter the execution interval before the check even starts.
    const probeBefore=probeHash({cwd:plan.cwd,probes:selected.probes||[],
      qualification:selected.qualification});
    const startSnapshotStarted=performance.now();
    try{before=await call({action:'snapshot',name,contextHashes:contextHashes()},captureTimeout);}
    catch{captureIssues.push('start observation unavailable');}
    timing('cli.start_checkpoint',startSnapshotStarted,{available:before?.snapshots?.[name]?1:0});
    // A Windows full reconciliation may finish while queued watcher callbacks
    // are still arriving. Fold callbacks delivered before process launch into
    // the starting checkpoint; callbacks after launch still disqualify reuse.
    if(process.platform==='win32'&&before?.snapshots?.[name]?.observationHealthy){
      await new Promise(resolve=>setTimeout(resolve,100));
      const prelaunchStarted=performance.now();
      try{before=await call({action:'prelaunch',name,
        contextHashes:contextHashes()},Math.min(captureTimeout,5000));}
      catch{before=null;captureIssues.push('prelaunch observation unavailable');}
      timing('cli.prelaunch_checkpoint',prelaunchStarted,
        {available:before?.snapshots?.[name]?1:0});
    }
    const snap=before?.snapshots?.[name];
    if(!snap||!snap.observationHealthy)captureIssues.push('start checkpoint unavailable');
    const started=Date.now();
    const invocation=await new Promise(resolve=>{
      if(requestedSignal){resolve({status:'interrupted',exitCode:null,signal:requestedSignal});return;}
      let child,spawnError=null;
      try{runLock.phase('launching');
        const launch=windowsLaunch(command);
        child=spawn(launch.file,launch.args,{cwd:plan.cwd,
        stdio:'inherit',env:process.env,detached:process.platform==='linux',
        ...launch.options});}
      catch(e){resolve({status:'start_failed',exitCode:null,signal:null,errorCode:e.code||e.name});return;}
      activeChild=child;runLock.phase('running',child.pid??null);
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
    invocation.startedAt=started;invocation.durationMs=ended-started;
    invocation.argvHash=plan.commandIdentity.argvHash;
    invocation.argc=command.length;
    invocation.runId=runId;
    invocation.reporting='normal';
    const result=invocation.status==='exited'?(invocation.exitCode===0?'PASS':'FAIL'):null;
    const target={source:'direct-command',status:invocation.status==='exited'?'direct_executed':'unknown'};
    const environmentAfter=contextHashes()[name],probeAfter=probeHash({cwd:plan.cwd,
      probes:selected.probes||[],qualification:selected.qualification});
    const endSnapshotStarted=performance.now();
    try{after=await call({action:'snapshot',name,contextHashes:contextHashes()},captureTimeout);}
    catch{captureIssues.push('end observation unavailable');}
    timing('cli.end_checkpoint',endSnapshotStarted,{available:after?.snapshots?.[name]?1:0});
    const end=after?.snapshots?.[name];
    if(!end||!end.observationHealthy)captureIssues.push('end checkpoint unavailable');
    if(JSON.stringify(environmentBefore)!==JSON.stringify(environmentAfter))
      captureIssues.push('declared environment changed during execution');
    if(!probeBefore||!probeAfter||probeBefore!==snap?.probeHash||probeAfter!==end?.probeHash)
      captureIssues.push('declared state probe unavailable or changed');
    if(before?.observation?.generation!==after?.observation?.generation)
      captureIssues.push('observer generation changed during execution');
    if(snap?.planGeneration!==end?.planGeneration)
      captureIssues.push('input plan rebuilt during execution');
    if(snap?.inputEventSerial!==end?.inputEventSerial)
      captureIssues.push('declared input event occurred during execution');
    if(!snap||!end||snap.planId!==end.planId||snap.fingerprint!==end.fingerprint||
      snap.revision!==end.revision)captureIssues.push('declared inputs changed or were not observed');
    const stable=captureIssues.length===0;
    const receipt={result,invocation,target,stable,fingerprintVersion:1,
      resolutionLinks:plan.resolutionLinks||[],
      coverage:{qualified:plan.unresolved.length===0,unresolved:plan.unresolved},
      checkpoint:{status:stable?'stable':'unavailable_or_changed',issues:captureIssues,
        startRevision:snap?.revision??null,endRevision:end?.revision??null,
        ...(process.env.REDUE_PUBLIC_INPUT_TRACE==='1'?{
          startInputEventSerial:snap?.inputEventSerial??null,
          endInputEventSerial:end?.inputEventSerial??null}: {})},
      planId:snap?.planId??plan.id,fingerprint:snap?.fingerprint??null,
      provider:plan.provider,environmentHashes:environmentBefore,
      ...(observedContext?{observedContext,verificationRecipe:directInterpretation}:{}),
      files:snap?.files??null,observerGeneration:before?.observation?.generation??null,
      startRevision:snap?.revision??null,endRevision:end?.revision??null};
    const persistenceStarted=performance.now();
    commitReceipt(state,name,receipt);
    timing('cli.receipt_persistence',persistenceStarted);
    try{await call({action:'reload'});}catch{/* receipt revisions invalidate older status even when reload IPC is unavailable */}
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
      Number(process.env.VSTATE_SYNC_TIMEOUT_MS||decisionDeadlineMs));
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
    if(action==='sync')console.log(JSON.stringify(value));
    else for(const row of value.checks)console.log(`${row.name}: ${row.freshness}/${row.result||'NO RESULT'} — ${row.reason}`);
    return;
  }
  if(action==='metrics'){console.log(JSON.stringify(await call({action:'metrics'})));return;}
  if(action==='run'){await execute();return;}
  throw Error(`unknown action ${action}`);
}
main().catch(e=>{console.error(`redue: ${e.message}`);process.exitCode=2;});
