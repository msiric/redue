#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {assertOwnedStatePlacement} from './owned-state.mjs';
import {permittedRoots} from './installed-inputs.mjs';
import {acquireRunLock,inspectRunLock,recoverRunLock} from './run-lock.mjs';
import {atomicJson,commitReceipt} from './state-store.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const [configArg,action,name]=process.argv.slice(2);
if(!configArg||!action)throw Error('internal usage: cli.mjs CONFIG ACTION [check]');
const configFile=path.resolve(configArg), config=JSON.parse(fs.readFileSync(configFile));
const root=fs.realpathSync(config.root), state=path.resolve(config.state), socket=path.join(state,'observer.sock');
assertOwnedStatePlacement(config);
if(state===root||state.startsWith(root+path.sep))throw Error('state must be outside checkout');
if([path.parse(state).root,os.homedir(),path.dirname(os.homedir())].includes(state)||
  !path.basename(state).startsWith('vstate-'))
  throw Error('state must be a dedicated vstate development directory');
const ownerFile=path.join(state,'vstate-owner-v1.json');
const digest=value=>createHash('sha256').update(value).digest('hex');
function nodeIdentity() {const real=fs.realpathSync(process.execPath),st=fs.statSync(real,{bigint:true});
  return digest(JSON.stringify([real,process.version,...['dev','ino','mode','size','mtimeNs','ctimeNs']
    .map(key=>String(st[key]))]));}
function pathExecutableIdentity(name) {
  for(const folder of (process.env.PATH||'').split(path.delimiter)){
    if(!folder)continue;
    try{const candidate=path.join(folder,name);fs.accessSync(candidate,fs.constants.X_OK);
      const real=fs.realpathSync(candidate),st=fs.statSync(real,{bigint:true});
      if(!st.isFile())continue;
      return digest(JSON.stringify([real,...['dev','ino','mode','size','mtimeNs','ctimeNs']
        .map(key=>String(st[key]))]));}
    catch{}
  }
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
  const values=[];
  for(const argv of plan.probes||[]) {
    const out=spawnSync(argv[0],argv.slice(1),{cwd:plan.cwd,
      timeout:5000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe'],env:process.env});
    if(out.error||out.signal||out.status!==0)return null;
    values.push([argv,out.status,digest(out.stdout),digest(out.stderr)]);
  }
  return digest(JSON.stringify(values));
}
function owner(){
  fs.mkdirSync(state,{recursive:true,mode:0o700});
  const expected={schema:1,kind:'vstate-product-alpha',config:configFile,root,state};
  if(fs.existsSync(ownerFile)){
    const existing=JSON.parse(fs.readFileSync(ownerFile));
    if(JSON.stringify(existing)!==JSON.stringify(expected))throw Error('state ownership marker mismatch');
  } else {
    const allowed=configFile.startsWith(state+path.sep)?path.basename(configFile):null;
    if(fs.readdirSync(state).some(entry=>entry!==allowed))
      throw Error('unowned state directory is not empty; inspect before initializing');
    atomicJson(ownerFile,expected);
  }
}
const unknown=reason=>({schema:1,state:'unverified',current:0,stale:0,failed:0,observed_failed:0,
  unverified:config.checks.length,
  checks:config.checks.map(c=>({name:c.name,result:null,freshness:'UNVERIFIED',reason})),
  observation:{healthy:false,reason}});
function unavailableCached(reason) {
  try {const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    const checks=(value.checks||[]).map(row=>({...row,freshness:'UNVERIFIED',
      reason,reuse_eligible:false,declared_inputs_match:null}));
    return {...value,state:'unverified',current:0,stale:0,failed:0,
      unverified:Math.max(1,checks.length),checks,
      observation:{...value.observation,healthy:false,reason}};
  }catch{return unknown(reason);}
}
function call(message,timeout=5000) {
  return new Promise((resolve,reject)=>{
    let data='',done=false;const client=net.createConnection(socket);
    const timer=setTimeout(()=>{client.destroy();reject(Error('observer synchronization timeout'));},timeout);
    client.on('connect',()=>client.write(JSON.stringify(message)+'\n'));
    client.on('data',chunk=>data+=chunk);
    client.on('end',()=>{clearTimeout(timer);if(done)return;done=true;
      try{resolve(JSON.parse(data));}catch(e){reject(e);}});
    client.on('error',e=>{clearTimeout(timer);reject(e);});
  });
}
function cached() {
  try{const value=JSON.parse(fs.readFileSync(path.join(state,'status.json')));
    if(Date.now()>=value.updated_at&&Date.now()<=value.expires_at&&
      value.expires_at-value.updated_at<=3000){
      try{process.kill(value.pid,0);return value;}
      catch{return unavailableCached('observer process unavailable');}}
  }catch{}
  return unavailableCached('observer heartbeat expired or unavailable');
}
async function execute() {
  const selected=config.checks.find(c=>c.name===name);
  if(!selected)throw Error(`unknown check ${name}`);
  const runLock=acquireRunLock(state);
  let activeChild=null,requestedSignal=null;
  const forward=signal=>{requestedSignal=signal;
    if(activeChild&&activeChild.exitCode===null)activeChild.kill(signal);};
  const interrupt=()=>forward('SIGINT'),terminate=()=>forward('SIGTERM');
  process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
  try {
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
    const environmentBefore=contextHashes()[name],captureIssues=[],
      captureTimeout=Number(process.env.VSTATE_CAPTURE_TIMEOUT_MS||15000);
    let before=null,after=null;
    try{before=await call({action:'snapshot',name,contextHashes:contextHashes()},captureTimeout);}
    catch{captureIssues.push('start observation unavailable');}
    const snap=before?.snapshots?.[name];
    if(!snap||!snap.observationHealthy)captureIssues.push('start checkpoint unavailable');
    const probeBefore=probeHash({cwd:plan.cwd,probes:selected.probes||[]});
    const started=Date.now();
    const invocation=await new Promise(resolve=>{
      if(requestedSignal){resolve({status:'interrupted',exitCode:null,signal:requestedSignal});return;}
      let child,spawnError=null;
      try{runLock.phase('launching');
        child=spawn(command[0],command.slice(1),{cwd:plan.cwd,
        stdio:'inherit',env:process.env});}
      catch(e){resolve({status:'start_failed',exitCode:null,signal:null,errorCode:e.code||e.name});return;}
      activeChild=child;runLock.phase('running',child.pid??null);
      if(requestedSignal)forward(requestedSignal);
      child.on('error',e=>{spawnError=e.code||e.name;});
      child.on('close',(exit,signal)=>{
        activeChild=null;runLock.phase('finished');
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
    try{after=await call({action:'snapshot',name,contextHashes:contextHashes()},captureTimeout);}
    catch{captureIssues.push('end observation unavailable');}
    const end=after?.snapshots?.[name];
    if(!end||!end.observationHealthy)captureIssues.push('end checkpoint unavailable');
    const environmentAfter=contextHashes()[name],probeAfter=probeHash({cwd:plan.cwd,
      probes:selected.probes||[]});
    if(JSON.stringify(environmentBefore)!==JSON.stringify(environmentAfter))
      captureIssues.push('declared environment changed during execution');
    if(!probeBefore||!probeAfter||probeBefore!==snap?.probeHash||probeAfter!==end?.probeHash)
      captureIssues.push('declared state probe unavailable or changed');
    if(before?.observation?.generation!==after?.observation?.generation)
      captureIssues.push('observer generation changed during execution');
    if(snap?.planGeneration!==end?.planGeneration)
      captureIssues.push('input plan rebuilt during execution');
    if(!snap||!end||snap.planId!==end.planId||snap.fingerprint!==end.fingerprint||
      snap.revision!==end.revision)captureIssues.push('declared inputs changed or were not observed');
    const stable=captureIssues.length===0;
    const receipt={result,invocation,target,stable,fingerprintVersion:1,
      resolutionLinks:plan.resolutionLinks||[],
      coverage:{qualified:plan.unresolved.length===0,unresolved:plan.unresolved},
      checkpoint:{status:stable?'stable':'unavailable_or_changed',issues:captureIssues,
        startRevision:snap?.revision??null,endRevision:end?.revision??null},
      planId:snap?.planId??plan.id,fingerprint:snap?.fingerprint??null,
      provider:plan.provider,environmentHashes:environmentBefore,
      files:snap?.files??null,observerGeneration:before?.observation?.generation??null,
      startRevision:snap?.revision??null,endRevision:end?.revision??null};
    commitReceipt(state,name,receipt);
    try{await call({action:'reload'});}catch{/* next read remains conservative */}
    console.log(JSON.stringify({check:name,result,target:target.status,
      invocation:invocation.status,stable,coverage_qualified:receipt.coverage.qualified}));
    process.exitCode=invocation.status==='exited'?invocation.exitCode:
      invocation.status==='interrupted'?128+(os.constants.signals[invocation.signal]||1):127;
  }finally{
    process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
    runLock.release();}
}
async function main(){
  if(action==='init') {owner();
    console.log(JSON.stringify({root,state,config:configFile,executable:path.join(here,'cli.mjs')}));return;}
  if(action==='start'){
    if(Buffer.byteLength(socket)>100)
      throw Error(`state path is too long for a Unix control socket: ${state}; choose a shorter --state-dir`);
    owner();
    for(const check of config.checks)permittedRoots(root,check.allowedExternalRoots||[]);
    const observerLock=path.join(state,'observer.lock');
    if(fs.existsSync(observerLock)){
      const pid=Number(fs.readFileSync(path.join(observerLock,'pid')));
      let live=false;try{process.kill(pid,0);live=true;}catch(e){if(e.code!=='ESRCH')throw e;}
      if(live)throw Error(`observer already running at PID ${pid}`);
      // Only this development state/socket are owned here; never touch shared services.
      fs.rmSync(observerLock,{recursive:true});
      try{fs.unlinkSync(socket);}catch(e){if(e.code!=='ENOENT')throw e;}
    }
    const log=fs.openSync(path.join(state,'observer.log'),'a',0o600);
    const child=spawn(process.execPath,[path.join(here,'daemon.mjs'),configFile],
      {detached:true,stdio:['ignore',log,log]});child.unref();fs.closeSync(log);
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
        health:data.observation,ready:false}));return;}
    catch {throw Error('observer control did not become available; inspect owned observer.log');}
  }
  if(action==='run-lock-status'){
    console.log(JSON.stringify(inspectRunLock(state)));return;
  }
  if(action==='recover-run-lock'){
    owner();
    console.log(JSON.stringify(recoverRunLock(state,name==='--confirm-check-stopped')));return;
  }
  if(action==='stop'){
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
      let live=false;try{process.kill(pid,0);live=true;}catch(e){if(e.code!=='ESRCH')throw e;}
      if(live){await call({action:'stop'});
        for(let i=0;i<100&&fs.existsSync(path.join(state,'observer.lock'));i++)
          await new Promise(r=>setTimeout(r,100));
        if(fs.existsSync(path.join(state,'observer.lock')))throw Error('observer did not stop');}
    }
    fs.rmSync(state,{recursive:true,force:true});
    console.log(JSON.stringify({removed:state}));return;
  }
  if(action==='status'){console.log(JSON.stringify(cached()));return;}
  if(action==='sync'||action==='detail'){
    let value;try{value=await call({action:'sync',contextHashes:contextHashes()},
      Number(process.env.VSTATE_SYNC_TIMEOUT_MS||15000));}
    catch(e){value=unavailableCached(e.message);process.exitCode=2;}
    if(action==='sync')console.log(JSON.stringify(value));
    else for(const row of value.checks)console.log(`${row.name}: ${row.freshness}/${row.result||'NO RESULT'} — ${row.reason}`);
    return;
  }
  if(action==='metrics'){console.log(JSON.stringify(await call({action:'metrics'})));return;}
  if(action==='run'){await execute();return;}
  throw Error(`unknown action ${action}`);
}
main().catch(e=>{console.error(`vstate: ${e.message}`);process.exitCode=2;});
