// Harness tests ONLY: in-memory callbacks, no control selector, C compilation,
// native agent, model, credential, network, sandbox or enforcement observation.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {interpretDescriptorProcessLine,descriptorSignalEligible} from './acceptance/sealed-typescript-descriptor-observation-supervisor.mjs';
const source=new URL('./acceptance/sealed-typescript-descriptor-observation-supervisor.mjs',import.meta.url),body=fs.readFileSync(source,'utf8');
const context=vm.createContext({Buffer,Number,Object,JSON,Error,Promise,Map,Set,path,createHash,process:{getuid:()=>501},fileURLToPath});
vm.runInContext(body.slice(0,body.indexOf('// Direct invocation guard.')).replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(source.href)).replaceAll('export ','')+'\nglobalThis.runHarness=observe;',context);
const parent={pid:10,ppid:1,pgid:10,uid:501,start:'Mon Oct 12 12:00:00 2026'},main={pid:20,ppid:10,pgid:20,uid:501,start:'Mon Oct 12 12:00:01 2026'},worker={pid:30,ppid:20,pgid:30,uid:501,start:'Mon Oct 12 12:00:02 2026'};
const falseAuthority={sealed:false,reuseEligible:false,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false};
function harness(options={}){
 let clock=0,launched=false,waits=0,closed=false,mainAlive=true,workerAlive=true,mainReads=0,attempted=false,spawnObserved=false,spawnPID=null,cancelled=false;const events=[];
 const report={schema:1,scope:'STANDALONE_OWNED_DESCRIPTOR_PARENT_DATA_ONLY',outcome:'FIXED_SYNTHETIC_SLOTS_ABSENT_AND_SAME_PID_OBSERVED',reaped:true,timedOut:false,exitCode:0,signal:null,...falseAuthority,
  workerReport:{outcome:'FIXED_SYNTHETIC_SLOTS_ABSENT_AND_SAME_PID_OBSERVED',compileAttempts:2,compileResults:2,armAttempts:2,armResults:2,...falseAuthority}};
 if(options.forgedAuthority)report.sealed=true;
 const bytes=options.oversize?Buffer.alloc(65537):Buffer.from('# '+JSON.stringify(report)+'\n'),hash=createHash('sha256').update(bytes).digest('hex');
 const io={now:()=>clock,parentPID:()=>10,cancelLaunch:()=>{cancelled=true;events.push(['cancel']);},bound:async(action,ms)=>{events.push(['bound',ms]);return action();},
  preflight:async()=>{events.push(['preflight']);if(options.preflight)throw Error();},
  openCapture:async()=>{events.push(['open']);if(options.privateDirectory)throw Error();return{file:'OWNED_MOCK_TAP'};},
  launch:async()=>{assert.equal(cancelled,false);attempted=true;if(options.dispatchFailure)throw Error('MOCK_DISPATCH');launched=true;spawnObserved=true;spawnPID=20;events.push(['launch']);if(options.launchCrossesDeadline)clock=30000;return{pid:20};},
  process:async pid=>{events.push(['process',pid]);if(pid===10)return parent;
   if(pid===20){mainReads++;if(options.identityCrossesDeadline&&mainReads===1)clock=30000;if(options.identityUnavailable)return null;return mainAlive?options.mainMismatch&&mainReads>1?{...main,start:'REUSED'}:main:null;}
   if(pid===30)return workerAlive?options.workerMismatch?{...worker,ppid:1}:worker:null;return null;},
  children:async pid=>{events.push(['children',pid]);return workerAlive?[30]:[];},
  signalGroup:async pid=>{events.push(['signal',pid]);if(pid===20){mainAlive=false;closed=true;}if(pid===30)workerAlive=false;},
  groupExists:async pid=>{events.push(['group',pid]);return options.residual?true:pid===20?mainAlive:pid===30?workerAlive:false;},
  wait:async ms=>{clock+=options.timeout?10000:ms;waits++;if(!options.timeout&&waits>=2){mainAlive=false;workerAlive=false;closed=true;}},
  lifecycle:()=>({launchAttempted:attempted,spawnObserved,spawnPID,closed,exitCode:options.exitCode??0,signal:options.signal??null,stderrBytes:options.stderr??0,error:false}),
  persist:async()=>{events.push(['persist']);if(options.persistFailure)throw Error();if(options.persistDelay)clock+=30000;
   return{file:'OWNED_MOCK_TAP',bytes:options.missingResult?Buffer.from('no checker output'):bytes,sha256:options.wrongHash?'bad':hash};},
  ack:async()=>{events.push(['ack']);if(options.ackFailure)throw Error();if(options.ackDelay)clock+=30000;if(options.clockReversed)clock=-1;},abandon:async()=>{events.push(['abandon']);}};
 return{io,events,result:()=>context.runHarness(io),launched:()=>launched,cancelled:()=>cancelled,advance:value=>{clock=value;}};
}
test('process metadata parser excludes arguments/environment and rejects malformed identifiers',()=>{
 assert.deepEqual(interpretDescriptorProcessLine('20 10 20 501 Mon Oct 12 12:00:01 2026\n'),main);
 for(const text of ['', '20 10 20 0 Mon Oct 12 12:00:01 2026','0 10 20 501 Mon Oct 12 12:00:01 2026','20 10 20 501 Mon Oct 12 12:00:01 2026 --secret','9999999999999999999 10 20 501 Mon Oct 12 12:00:01 2026'])assert.equal(interpretDescriptorProcessLine(text),null);
});
test('signals require current PID/PPID/PGID/UID/start identity and the actual parent',()=>{
 assert.equal(descriptorSignalEligible(worker,worker,main),true);
 for(const delta of [{pid:31},{ppid:1},{pgid:20},{uid:502},{start:'REUSED'}])assert.equal(descriptorSignalEligible(worker,{...worker,...delta},main),false);
 assert.equal(descriptorSignalEligible(worker,worker,null),false);assert.equal(descriptorSignalEligible(worker,worker,parent),false);
});
test('mock complete capture persists/readbacks before acknowledgement; cleanup is not its result',async()=>{
 const h=harness(),result=await h.result();assert.equal(result.outcome,'FIXED_DESCRIPTOR_OBSERVATION_SAVED');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
 assert(h.events.findIndex(row=>row[0]==='persist')<h.events.findIndex(row=>row[0]==='ack'));assert.equal(result.ownedGroupsAbsent,true);
});
for(const option of ['preflight','privateDirectory'])test('mock '+option+' refusal launches zero controls',async()=>{
 const h=harness({[option]:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(h.launched(),false);assert(!h.events.some(row=>row[0]==='signal'));
});
for(const option of ['persistFailure','missingResult','wrongHash','ackFailure','persistDelay','ackDelay','clockReversed','forgedAuthority','oversize'])test('mock '+option+' cannot yield PASS from cleanup',async()=>{
 const h=harness({[option]:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
});
for(const option of ['mainMismatch','workerMismatch'])test('mock '+option+' never signals the unverified identity',async()=>{
 const h=harness({[option]:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');const forbidden=option==='mainMismatch'?20:30;assert(!h.events.some(row=>row[0]==='signal'&&row[1]===forbidden));
});
test('mock timeout reaps only currently verified owned groups in worker-before-parent order',async()=>{
 const h=harness({timeout:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.timedOut,true);
 const signals=h.events.filter(row=>row[0]==='signal').map(row=>row[1]);assert.deepEqual(signals,[30,20]);assert(!h.events.some(row=>row[0]==='persist'));
});
test('mock residual group is UNKNOWN and cannot justify stale-leader signalling',async()=>{
 const h=harness({residual:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.ownedGroupsAbsent,false);assert(!h.events.some(row=>row[0]==='signal'));
});
for(const option of [{exitCode:74},{signal:'SIGKILL'},{stderr:1}])test('mock non-successful process outcome is not evidence',async()=>{assert.equal((await harness(option).result()).outcome,'UNKNOWN');});
test('source routes are fixed and unselected entry precedes observation',()=>{
 assert(body.includes("env:{REDUE_STANDALONE_CAMPAIGN_DESCRIPTORS:'1'}"));assert(!body.includes('process.env.'+'NODE_OPTIONS'));assert(body.includes("env:{}"));
 assert(body.includes("fs.constants.O_EXCL|fs.constants.O_NOFOLLOW"));assert(body.includes('await directoryFD.sync()'));assert(body.includes("Object.keys(process.env).every(key=>key==='REDUE_FIXED_DESCRIPTOR_SUPERVISOR')"));assert(body.includes('await c.fd.sync()'));assert(body.includes('namedBytes.equals(bytes)'));
 assert(body.includes("if(process.env.REDUE_FIXED_DESCRIPTOR_SUPERVISOR!=='1')"));assert(body.includes("faac5b91e434694a07e43f645de343ef34cfcf54c73e3efe73502457612e1a16"));
});

for(const option of ['launchCrossesDeadline','identityCrossesDeadline'])test('mock '+option+' retains actual launch/PID and freshly verifies cleanup',async()=>{
 const h=harness({[option]:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.launchAttempted,true);assert.equal(result.launched,true);assert.equal(result.spawnPID,20);
 assert.equal(result.ownedGroupsAbsent,true);assert(h.events.filter(row=>row[0]==='process'&&row[1]===20).length>=2);
 assert.deepEqual(h.events.filter(row=>row[0]==='signal').map(row=>row[1]),[30,20]);assert(!h.events.some(row=>row[0]==='persist'));
});
test('mock actual launch with unavailable identity cannot signal or claim absence',async()=>{
 const h=harness({launchCrossesDeadline:true,identityUnavailable:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.launched,true);assert.equal(result.spawnPID,20);assert.equal(result.ownedGroupsAbsent,false);assert(!h.events.some(row=>row[0]==='signal'));
});

test('mock dispatch attempt without a spawn observation is not proof of group absence',async()=>{
 const h=harness({dispatchFailure:true}),result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(result.launchAttempted,true);assert.equal(result.launched,false);assert.equal(result.spawnPID,null);assert.equal(result.ownedGroupsAbsent,false);assert(!h.events.some(row=>row[0]==='signal'));
});
test('mock timed-out asynchronous prelaunch completion cannot spawn after cleanup',async()=>{
 const h=harness(),launch=h.io.launch;let release,started=false,rejected=false;
 const gate=new Promise(resolve=>{release=resolve;});
 h.io.launch=async()=>{started=true;await gate;if(h.cancelled())throw Error('CANCELLED_PRELAUNCH');return launch();};
 h.io.bound=async action=>{const pending=Promise.resolve().then(action);await Promise.resolve();
  if(started&&!rejected){rejected=true;h.advance(30000);pending.catch(()=>{});throw Error('MOCK_DEADLINE');}return pending;};
 const result=await h.result();assert.equal(result.outcome,'UNKNOWN');assert.equal(h.cancelled(),true);assert.equal(result.launchAttempted,false);assert.equal(result.launched,false);assert.equal(result.ownedGroupsAbsent,true);
 release();await Promise.resolve();await Promise.resolve();assert.equal(h.launched(),false);assert(!h.events.some(row=>row[0]==='launch'||row[0]==='signal'));
});
test('actual prelaunch source checks both private cancellation and absolute deadline before spawn',()=>{
 assert(body.indexOf('guard(!cancelled&&Number.isFinite(deadline)&&performance.now()<deadline)')<body.indexOf('child=spawn(node,[control]'));
 assert(body.includes('io.cancelLaunch();syncLaunch()'));
});

test('mock actual capture cancelled during its final named await closes the late FD',async()=>{
 let opened=false,closed=0,gateStarted=false,release;const gate=new Promise(resolve=>{release=resolve;});
 const repo=path.dirname(path.dirname(path.dirname(fileURLToPath(source)))),dir=path.join(repo,'.local/portable-evidence'),file=path.join(dir,'owned-descriptor-control-MOCK.tap');
 const stat=directory=>({dev:1n,ino:directory?1n:2n,mode:directory?0o40700n:0o100600n,uid:501n,gid:20n,nlink:1n,size:0n,mtimeNs:1n,ctimeNs:1n,
  isDirectory:()=>directory,isFile:()=>!directory,isSymbolicLink:()=>false});
 const fd={stat:async()=>stat(false),close:async()=>{closed++;}};
 const mockFS={lstat:async at=>{if(opened&&at===dir&&!gateStarted){gateStarted=true;await gate;}return stat(at!==file);},realpath:async at=>at,open:async()=>{opened=true;return fd;}};
 const code=body.slice(0,body.indexOf('// Direct invocation guard.')).replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(source.href)).replaceAll('export ','');
 const api=Function('fs','fsp','path','fileURLToPath','createHash','randomUUID','spawn','execFile','process','performance',code+';return actualOperations();')(
  fs,mockFS,path,fileURLToPath,createHash,()=> 'MOCK',()=>{throw Error('NO_SPAWN');},()=>{throw Error('NO_COMMAND');},{getuid:()=>501},{now:()=>0});
 const pending=api.openCapture();await new Promise(setImmediate);assert.equal(gateStarted,true);api.cancelLaunch();release();
 await assert.rejects(pending,/FIXED_DESCRIPTOR_SUPERVISOR_UNKNOWN/);assert.equal(closed,1);
});
