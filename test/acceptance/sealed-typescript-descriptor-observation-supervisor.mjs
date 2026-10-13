// Fixed owned engineering control only. No native-agent, compiler-check or seal authority.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
const here=fileURLToPath(import.meta.url),root=path.dirname(path.dirname(path.dirname(here)));
const node='/Users/mariosiric/.nvm/versions/node/v22.13.0/bin/node';
const control=path.join(root,'test/acceptance/sealed-typescript-fixed-campaign-descriptor-control.mjs');
const pins={node:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',control:'27954ebb40965a2fa3de917cd1b405068819b1ba5ea7bf54d9b98078cd4514ee'};
const cap=65536,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw Error('FIXED_DESCRIPTOR_SUPERVISOR_UNKNOWN');};
const guard=value=>{if(!value)fail();};
const inode=s=>[s.dev,s.ino,s.mode,s.uid,s.gid,s.nlink].map(String).join(':');
// Owned artifact directory structure only; its nlink can change on our own
// output creation. This is not compiler-input membership or file identity.
const directoryIdentity=s=>[s.dev,s.ino,s.mode,s.uid,s.gid].map(String).join(':');
const mark=s=>[inode(s),s.size,s.mtimeNs,s.ctimeNs].map(String).join(':');
// Engineering-only admission on the pinned Darwin/ARM64/Node profile. The
// actual env-i observation admitted only this UID-bound zero-encoding CF key.
// CF-1153.18/CFRuntime.c:866 explains a potential initializer setenv; it does
// not establish the initializer implementation of the current installed OS.
export function descriptorSupervisorEnvironmentAllowed(env,uid){
 if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||!Number.isSafeInteger(uid)||uid<=0)return false;
 const expected=`0x${uid.toString(16).toUpperCase()}:0x0:0x0`;
 return Object.keys(env).every(key=>key==='REDUE_FIXED_DESCRIPTOR_SUPERVISOR'?env[key]==='1':
  key==='__CF_USER_TEXT_ENCODING'&&env[key]===expected);
}
export function interpretDescriptorProcessLine(text){
 const matched=typeof text==='string'&&text.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]{3} [A-Za-z]{3}\s+\d{1,2} \d{2}:\d{2}:\d{2} \d{4})\s*$/);
 if(!matched)return null;const [pid,ppid,pgid,uid]=matched.slice(1,5).map(Number);
 if(![pid,ppid,pgid,uid].every(Number.isSafeInteger)||pid<=0||ppid<0||pgid<=0||uid<=0)return null;
 return{pid,ppid,pgid,uid,start:matched[5]};
}
const same=(a,b)=>!!a&&!!b&&['pid','ppid','pgid','uid','start'].every(key=>a[key]===b[key]);
export function descriptorSignalEligible(observed,current,parent){
 return same(observed,current)&&!!parent&&observed.ppid===parent.pid&&observed.uid===parent.uid&&observed.pgid===observed.pid;
}
function interpretCapture(bytes,life){
 if(!life.closed||life.exitCode!==0||life.signal!==null||life.stderrBytes!==0)return null;
 try{guard(Buffer.from(bytes.toString('utf8')).equals(bytes));const rows=bytes.toString('utf8').split('\n').filter(line=>line.startsWith('# {')).map(line=>JSON.parse(line.slice(2)));
 const result=rows.find(row=>row.scope==='STANDALONE_OWNED_DESCRIPTOR_PARENT_DATA_ONLY');
 guard(rows.length===1&&result&&result.schema===1&&result.outcome==='FIXED_SYNTHETIC_SLOTS_ABSENT_AND_SAME_PID_OBSERVED'&&result.reaped===true&&result.timedOut===false&&result.exitCode===0&&result.signal===null);
 guard(result.workerReport?.outcome===result.outcome&&result.workerReport.compileAttempts===2&&result.workerReport.compileResults===2&&result.workerReport.armAttempts===2&&result.workerReport.armResults===2);
 for(const value of [result,result.workerReport])guard(value.sealed===false&&value.reuseEligible===false&&value.nativeAgentLaunches===0&&value.models===0&&value.compilerCheckExecutions===0&&value.receiptWrites===0&&value.inferencePermitted===false&&value.nativeEnforcement==='NOT_ESTABLISHED'&&value.noInheritedWritableHandlesVerified===false);
 return result;}catch{return null;}
}
// Private fixed-operation composition. Tests supply in-memory operations by VM;
// no exported execution API accepts paths, commands, argv or operation callbacks.
async function observe(io){
 const began=io.now();let last=began,unknown=false,timedOut=false,launched=false,closed=false,cleanup=false,capture=null,main=null,parent=null,launchAttempted=false,candidatePID=null;
 const syncLaunch=()=>{const life=io.lifecycle();launchAttempted=launchAttempted||life.launchAttempted===true;launched=launched||life.spawnObserved===true;
  if(Number.isSafeInteger(life.spawnPID)&&life.spawnPID>0){if(candidatePID!==null&&candidatePID!==life.spawnPID)unknown=true;else candidatePID=life.spawnPID;}};
 const workers=new Map(),elapsed=()=>{const now=io.now();guard(Number.isFinite(now)&&now>=last&&now>=began);last=now;return now-began;};
 const bounded=async action=>{guard(elapsed()<30000);const value=await io.bound(action,30000-elapsed());guard(elapsed()<30000);return value;};
 const inspect=async()=>{const current=await io.process(main.pid);if(!same(main,current)){if(current!==null||!io.lifecycle().closed)unknown=true;return current;}
  const ids=await io.children(main.pid);for(const id of ids){const row=await io.process(id);if(!row||row.ppid!==main.pid||row.uid!==parent.uid||row.pgid!==row.pid){unknown=true;continue;}
   const old=workers.get(id);if(old&&!same(old,row))unknown=true;else workers.set(id,row);}
  return current;};
 const clean=async(until=Math.min(io.now()+5000,began+35000))=>{let ok=false;
  const step=async action=>{const remaining=until-io.now();guard(remaining>0);const value=await io.bound(action,remaining);guard(io.now()<until);return value;};
  while(io.now()<until){
   syncLaunch();
   if(!main&&candidatePID!==null&&parent){const freshParent=await step(()=>io.process(parent.pid)),fresh=await step(()=>io.process(candidatePID));
    if(same(parent,freshParent)&&fresh&&fresh.pid===candidatePID&&fresh.ppid===parent.pid&&fresh.uid===parent.uid&&fresh.pgid===fresh.pid)main=fresh;
    else{unknown=true;return false;}}
   if(main){const current=await step(()=>io.process(main.pid));if(same(main,current))await step(inspect);else if(current!==null)unknown=true;
    for(const row of workers.values()){const freshParent=await step(()=>io.process(main.pid)),fresh=await step(()=>io.process(row.pid));
     if(descriptorSignalEligible(row,fresh,freshParent)&&same(main,freshParent))await step(()=>io.signalGroup(row.pid));
     else if(await step(()=>io.groupExists(row.pid)))unknown=true;}
    const freshParent=await step(()=>io.process(parent.pid)),fresh=await step(()=>io.process(main.pid));
    if(descriptorSignalEligible(main,fresh,freshParent)&&same(parent,freshParent))await step(()=>io.signalGroup(main.pid));
    else if(await step(()=>io.groupExists(main.pid)))unknown=true;
    if(io.lifecycle().closed&&!(await step(()=>io.groupExists(main.pid)))&&!(await step(()=>Promise.all([...workers.keys()].map(pid=>io.groupExists(pid))))).some(Boolean)){ok=true;break;}
   }else{ok=!launchAttempted&&!launched&&candidatePID===null;break;}
   await step(()=>io.wait(10));
  }return ok;
 };
 try{guard(Number.isFinite(began));await bounded(()=>io.preflight());parent=await bounded(()=>io.process(io.parentPID()));guard(parent!==null);capture=await bounded(()=>io.openCapture());
  await bounded(async()=>{const child=await io.launch(capture,began+30000);syncLaunch();guard(Number.isSafeInteger(child.pid)&&child.pid>0&&candidatePID===child.pid&&launched);});
  await bounded(async()=>{const observed=await io.process(candidatePID);guard(observed&&observed.pid===candidatePID&&observed.ppid===parent.pid&&observed.uid===parent.uid&&observed.pgid===observed.pid);main=observed;});
  while(!io.lifecycle().closed){await bounded(inspect);if(unknown||io.lifecycle().error)fail();await bounded(()=>io.wait(10));}
  closed=true;await bounded(inspect);guard(!unknown);cleanup=await bounded(clean);guard(cleanup&&!unknown);const saved=await bounded(()=>io.persist(capture));
  guard(saved?.bytes&&saved.bytes.length<=cap&&saved.sha256===sha(saved.bytes));const result=interpretCapture(saved.bytes,io.lifecycle());guard(result!==null);
  const final={schema:1,scope:'FIXED_DESCRIPTOR_SUPERVISOR_ENGINEERING_ONLY',outcome:'FIXED_DESCRIPTOR_OBSERVATION_SAVED',elapsedMs:elapsed(),savedFile:saved.file,sha256:saved.sha256,bytes:saved.bytes.length,childClosed:closed,ownedGroupsAbsent:cleanup,observation:result,sealed:false,reuseEligible:false};
  await bounded(()=>io.ack(capture,saved,final));guard(elapsed()<30000);return{...final,elapsedMs:elapsed()};
 }catch{unknown=true;io.cancelLaunch();syncLaunch();try{timedOut=elapsed()>=30000;}catch{timedOut=true;}const cleanupUntil=Math.min(io.now()+5000,began+35000);
  try{guard(cleanupUntil>io.now());cleanup=await io.bound(()=>clean(cleanupUntil),cleanupUntil-io.now());}catch{cleanup=false;}
  try{if(capture){guard(cleanupUntil>io.now());await io.bound(()=>io.abandon(capture),cleanupUntil-io.now());}}catch{cleanup=false;}
  syncLaunch();return{schema:1,scope:'FIXED_DESCRIPTOR_SUPERVISOR_ENGINEERING_ONLY',outcome:'UNKNOWN',elapsedMs:(()=>{try{return elapsed();}catch{return null;}})(),timedOut,launchAttempted,launched,spawnPID:candidatePID,childClosed:closed||io.lifecycle().closed,ownedGroupsAbsent:cleanup,savedFile:capture?.file??null,sealed:false,reuseEligible:false};
 }
}
function actualOperations(){
 let child=null,cancelled=false,life={closed:false,exitCode:null,signal:null,stderrBytes:0,error:false,launchAttempted:false,spawnObserved:false,spawnPID:null},pending=Promise.resolve(),captureBytes=0;
 const bound=(action,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('DEADLINE')),ms);Promise.resolve().then(action).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
 const command=(file,args)=>new Promise((resolve,reject)=>execFile(file,args,{env:{},encoding:'utf8',timeout:500,maxBuffer:4096},(error,stdout)=>error?reject(error):resolve(stdout)));
 const processRow=async pid=>{try{return interpretDescriptorProcessLine(await command('/bin/ps',['-o','pid=,ppid=,pgid=,uid=,lstart=','-p',String(pid)]));}catch{return null;}};
 const lineage=async file=>{const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=await fsp.lstat(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());guard((s.uid===0n||s.uid===BigInt(process.getuid()))&&(s.mode&0o0022n)===0n);rows.push([at,directoryIdentity(s)]);if(at===path.dirname(at))return rows;}};
 const privateDirectory=async()=>{const dir=path.join(root,'.local/portable-evidence'),s=await fsp.lstat(dir,{bigint:true});guard(await fsp.realpath(dir)===dir&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return{dir,identity:directoryIdentity(s),lineage:await lineage(path.join(dir,'leaf'))};};
 const currentDirectory=async row=>{const now=await privateDirectory();guard(row.dir===now.dir&&row.identity===now.identity&&JSON.stringify(row.lineage)===JSON.stringify(now.lineage));};
 const readPinned=async(file,pin,limit)=>{guard(await fsp.realpath(file)===file);const before=await fsp.lstat(file,{bigint:true}),parents=await lineage(file);guard(before.isFile()&&!before.isSymbolicLink()&&before.uid===BigInt(process.getuid())&&before.nlink===1n&&(before.mode&0o6022n)===0n&&before.size>0n&&before.size<=BigInt(limit));
  const fd=await fsp.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);try{guard(mark(await fd.stat({bigint:true}))===mark(before));const hash=createHash('sha256'),buffer=Buffer.alloc(65536);let at=0;
   while(at<Number(before.size)){const {bytesRead}=await fd.read(buffer,0,Math.min(buffer.length,Number(before.size)-at),at);guard(bytesRead>0);hash.update(buffer.subarray(0,bytesRead));at+=bytesRead;}
   guard(hash.digest('hex')===pin&&mark(await fd.stat({bigint:true}))===mark(before)&&mark(await fsp.lstat(file,{bigint:true}))===mark(before)&&JSON.stringify(await lineage(file))===JSON.stringify(parents));
  }finally{await fd.close();}};
 const named=async c=>{await currentDirectory(c.directory);const s=await fsp.lstat(c.file,{bigint:true});guard(await fsp.realpath(c.file)===c.file&&inode(s)===c.identity&&s.isFile()&&!s.isSymbolicLink());return s;};
 const readback=async(fd,c,size)=>{const before=await fd.stat({bigint:true});guard(mark(before)===mark(await named(c))&&before.size===BigInt(size));const bytes=Buffer.alloc(size);let at=0;while(at<size){const read=await fd.read(bytes,at,size-at,at);guard(read.bytesRead>0);at+=read.bytesRead;}
  guard(mark(await fd.stat({bigint:true}))===mark(before)&&mark(await named(c))===mark(before));return bytes;};
 return{now:()=>performance.now(),parentPID:()=>process.pid,bound,process:processRow,cancelLaunch:()=>{cancelled=true;},
  children:async pid=>{let output;try{output=await command('/usr/bin/pgrep',['-P',String(pid)]);}catch(error){if(error?.code===1)return[];throw error;}guard(/^\d+(?:\n\d+)*\n?$/.test(output));const ids=output.trim().split('\n').map(Number);guard(ids.length<=8&&ids.every(id=>Number.isSafeInteger(id)&&id>0));return ids;},
  groupExists:async pid=>{try{process.kill(-pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}},
  signalGroup:async pid=>{try{process.kill(-pid,'SIGKILL');}catch(error){if(error.code!=='ESRCH')throw error;}},wait:ms=>new Promise(resolve=>setTimeout(resolve,ms)),lifecycle:()=>({...life}),
  preflight:async()=>{guard(process.argv.length===2&&path.resolve(process.argv[1])===here&&descriptorSupervisorEnvironmentAllowed(process.env,process.getuid()));guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===node&&process.getuid()>0&&process.getuid()===process.geteuid());await readPinned(node,pins.node,128*1024*1024);await readPinned(control,pins.control,128*1024);await privateDirectory();},
  openCapture:async()=>{const directory=await privateDirectory(),file=path.join(directory.dir,'owned-descriptor-control-'+randomUUID()+'.tap');await currentDirectory(directory);
   const fd=await fsp.open(file,fs.constants.O_RDWR|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);
   try{guard(!cancelled);const s=await fd.stat({bigint:true});guard(s.isFile()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);const c={file,fd,identity:inode(s),directory};await named(c);guard(!cancelled);return c;}catch(error){await fd.close();throw error;}},
  launch:async(c,deadline)=>{await readPinned(control,pins.control,128*1024);await currentDirectory(c.directory);guard(!cancelled&&Number.isFinite(deadline)&&performance.now()<deadline);life.launchAttempted=true;child=spawn(node,[control],{cwd:root,env:{REDUE_STANDALONE_CAMPAIGN_DESCRIPTORS:'1'},stdio:['ignore','pipe','pipe'],detached:true});if(Number.isSafeInteger(child.pid)&&child.pid>0)life.spawnPID=child.pid;
   child.on('error',()=>{life.error=true;});child.on('close',(code,signal)=>{life.closed=true;life.exitCode=code;life.signal=signal;});
   child.stderr.on('data',bytes=>{life.stderrBytes=Math.min(cap+1,life.stderrBytes+bytes.length);if(life.stderrBytes>cap)life.error=true;});child.stderr.on('error',()=>{life.error=true;});
   child.stdout.on('error',()=>{life.error=true;});child.stdout.on('data',bytes=>{if(cancelled){life.error=true;return;}if(!Buffer.isBuffer(bytes)||bytes.length>cap-captureBytes){life.error=true;return;}const at=captureBytes;captureBytes+=bytes.length;
    pending=pending.then(async()=>{guard(!cancelled&&c.fd);await named(c);guard(!cancelled&&c.fd);const write=await c.fd.write(bytes,0,bytes.length,at);guard(write.bytesWritten===bytes.length);}).catch(()=>{life.error=true;});});
   return await new Promise((resolve,reject)=>{child.once('spawn',()=>{life.spawnObserved=true;if(Number.isSafeInteger(child.pid)&&child.pid>0)life.spawnPID=child.pid;resolve({pid:child.pid});});child.once('error',reject);});},
  persist:async c=>{await pending;guard(!life.error);await c.fd.sync();await currentDirectory(c.directory);
   const directoryFD=await fsp.open(c.directory.dir,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|(fs.constants.O_DIRECTORY||0));try{guard(directoryIdentity(await directoryFD.stat({bigint:true}))===c.directory.identity);await directoryFD.sync();await currentDirectory(c.directory);}finally{await directoryFD.close();}
   await named(c);const bytes=await readback(c.fd,c,captureBytes);await c.fd.close();c.fd=null;
   const fd=await fsp.open(c.file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);try{const namedBytes=await readback(fd,c,captureBytes);guard(namedBytes.equals(bytes));}finally{await fd.close();}await named(c);return{file:c.file,bytes,sha256:sha(bytes)};},
  ack:async(c,saved,final)=>{await named(c);guard(saved.sha256===sha(saved.bytes));
   // Exit0 plus this flushed ACK and persisted bytes are required together.
   // Its elapsed field is explicitly pre-ACK; observe checks the full deadline afterward.
   const report={...final,elapsedBeforeAckMs:final.elapsedMs};delete report.elapsedMs;
   await new Promise((resolve,reject)=>process.stdout.write(JSON.stringify(report)+'\n',error=>error?reject(error):resolve()));},
  abandon:async c=>{await pending;if(c.fd){await c.fd.close();c.fd=null;}}
 };
}
export async function runFixedDescriptorObservationSupervisor(){return observe(actualOperations());}
// Direct invocation guard. Unselected runs do not inspect files or launch processes.
if(process.argv[1]&&path.resolve(process.argv[1])===here){
 if(process.env.REDUE_FIXED_DESCRIPTOR_SUPERVISOR!=='1')console.log(JSON.stringify({scope:'FIXED_DESCRIPTOR_SUPERVISOR_ENGINEERING_ONLY',outcome:'NOT_SELECTED',sealed:false,reuseEligible:false}));
 else{const result=await runFixedDescriptorObservationSupervisor();
  if(result.outcome==='UNKNOWN'){try{await Promise.race([new Promise(resolve=>process.stdout.write(JSON.stringify(result)+'\n',resolve)),new Promise(resolve=>setTimeout(resolve,Math.min(100,Math.max(0,35000-(result.elapsedMs??35000)))))]);}catch{}process.exit(74);}
  else process.exit(0);
 }
}
