// Separately selected engineering setup (three C builds) plus one launcher build.
// The old copies observation is untouched. No fixed code/helper/native executes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const guard=value=>{if(!value)throw Error('BASE_COLLECTOR_LAUNCHER_OBSERVATION_UNKNOWN');};
const sha=body=>createHash('sha256').update(body).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(s[key])).join(':');
const identity=s=>['dev','ino','mode','uid','gid'].map(key=>String(s[key])).join(':');

// Lexical injection only for authored controls; executable selection/imports are
// fixed below. No serialized descriptors or previously saved mint are accepted.
export async function observeSealedTypeScriptBaseCollectorLauncher({cwd,uid,filesystem,now,uuid,diagnostic,platformReady,loadOperations,phaseCapture=false}){
 let begun;try{begun=now();}catch{begun=NaN;}
 let last=begun,totalElapsedMs=null,clockUnavailable=!Number.isFinite(begun),budgetExceeded=false,completed=false,recordVerified=false;
 const tick=()=>{
  let at;try{at=now();}catch{clockUnavailable=true;totalElapsedMs=null;throw Error('OBSERVATION_CLOCK_UNAVAILABLE');}
  if(!Number.isFinite(at)||!Number.isFinite(begun)||at<last||!Number.isFinite(at-begun)){clockUnavailable=true;totalElapsedMs=null;}
  else{last=at;if(!clockUnavailable)totalElapsedMs=at-begun;if(totalElapsedMs>=30000)budgetExceeded=true;}
  guard(!clockUnavailable&&!budgetExceeded);return at;
 };
 const remaining=()=>{tick();guard(30000-totalElapsedMs>=1);return Math.floor(30000-totalElapsedMs);};
 const local=path.resolve(cwd,'.local/portable-evidence');
 const directory=()=>{
  const s=filesystem.lstatSync(local,{bigint:true});
  guard(Number.isInteger(uid)&&uid>0&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(uid)&&
   (s.mode&0o22n)===0n&&filesystem.realpathSync(local)===local);
  guard(mark(filesystem.lstatSync(local,{bigint:true}))===mark(s));return s;
 };
 // Bounded ancestor metadata only: no body reads or directory enumeration.
 // This observed lineage barrier is not atomic hostile-ancestor confinement.
 const ancestorLineage=()=>{
  const rows=[];
  for(let at=path.dirname(local);;at=path.dirname(at)){
   guard(rows.length<64);const s=filesystem.lstatSync(at,{bigint:true});
   guard(s.isDirectory()&&!s.isSymbolicLink()&&filesystem.realpathSync(at)===at);
   guard(identity(filesystem.lstatSync(at,{bigint:true}))===identity(s));rows.push([at,identity(s)]);
   if(at===path.dirname(at))return rows;
  }
 };
 const lineageCurrent=before=>{guard(before&&JSON.stringify(ancestorLineage())===JSON.stringify(before));};
 // Optional engineering breadcrumb FD. Open before the selector snapshot so
 // creating its one leaf cannot invalidate that snapshot. Kernel writeSync is
 // used directly, not TAP buffering. Marks neither prove action invocation nor
 // completion, power-loss durability or atomic hostile-ancestor confinement.
 // expose process counters, values, errors or private fixture paths.
 const capture={selected:phaseCapture===true,fd:undefined,file:null,name:null,bytesWritten:0,recordsWritten:0,failed:false,mark:null,identity:null,parentIdentity:null,lineage:null};
 const capturePhases=new Set(['testBody','selectorSnapshot','preconditions','operationImports','freshPair','freshHost','freshHostFixture',
  'prerequisiteThreeBuilds','prerequisiteCurrency','sourceDerivation','fourCollectorCopies','copyCurrency','oneLauncherBuild','launcherCurrency',
  'persistence','recordReadback','publication','finalRecordBarrier']);
 const captureRegular=(s,size)=>s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(uid)&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===BigInt(size);
 const captureNamedCurrent=s=>{
  guard(mark(filesystem.lstatSync(capture.file,{bigint:true}))===mark(s)&&filesystem.realpathSync(capture.file)===capture.file);
  guard(identity(directory())===capture.parentIdentity);lineageCurrent(capture.lineage);
 };
 const captureOpen=()=>{
  const parent=directory(),lineage=ancestorLineage();remaining();
  guard(['O_WRONLY','O_CREAT','O_EXCL','O_NOFOLLOW','O_NONBLOCK'].every(key=>filesystem.constants[key]!==undefined));
  const nonce=uuid();guard(typeof nonce==='string'&&/^[A-Za-z0-9-]{1,64}$/.test(nonce));
  capture.name='base-collector-launcher-phases-'+nonce+'.jsonl';capture.file=path.join(local,capture.name);
  remaining();capture.fd=filesystem.openSync(capture.file,filesystem.constants.O_WRONLY|filesystem.constants.O_CREAT|filesystem.constants.O_EXCL|filesystem.constants.O_NOFOLLOW|filesystem.constants.O_NONBLOCK,0o600);
  const opened=filesystem.fstatSync(capture.fd,{bigint:true});guard(captureRegular(opened,0));
  capture.identity=identity(opened);capture.mark=mark(opened);capture.parentIdentity=identity(parent);capture.lineage=lineage;
  captureNamedCurrent(opened);remaining();
 };
 const captureMark=(name,edge)=>{
  if(!capture.selected)return;
  try{
   guard(!capture.failed&&capture.fd!==undefined&&capturePhases.has(name)&&
    (name==='testBody'?edge==='entered':['validation','before','after'].includes(edge))&&capture.recordsWritten<64);
   const opened=filesystem.fstatSync(capture.fd,{bigint:true});
   guard(captureRegular(opened,capture.bytesWritten)&&mark(opened)===capture.mark&&identity(opened)===capture.identity);
   remaining();const bytes=Buffer.from(JSON.stringify({schema:1,phase:name,edge,elapsedMs:totalElapsedMs})+'\n');
   guard(bytes.length<=256&&capture.bytesWritten+bytes.length<=16384);let at=0;
   while(at<bytes.length){remaining();const n=filesystem.writeSync(capture.fd,bytes,at,bytes.length-at,capture.bytesWritten);
    guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;capture.bytesWritten+=n;
    if(at===bytes.length)capture.recordsWritten++;remaining();}
   const after=filesystem.fstatSync(capture.fd,{bigint:true});guard(captureRegular(after,capture.bytesWritten)&&identity(after)===capture.identity);
   captureNamedCurrent(after);capture.mark=mark(after);remaining();
  }catch{capture.failed=true;throw Error('OBSERVATION_PHASE_CAPTURE_UNKNOWN');}
 };
 const captureSnapshot=()=>({selected:capture.selected,recordName:capture.name,bytesWritten:capture.bytesWritten,recordsWritten:capture.recordsWritten,
  outcome:capture.selected?'UNKNOWN':'NOT_SELECTED',authority:false});
 const phaseCostsMs={};
 const report={schema:1,scope:'ENGINEERING_FRESH_BASE_COLLECTOR_LAUNCHER_BUILD_ONLY',
  prerequisiteSetup:'FRESH_PAIR_H_AND_THREE_C_BUILDS_REQUIRED',buildSequenceOutcome:'UNKNOWN',phaseCostsMs,
  pair:null,host:null,hostFixtureOutcome:null,prerequisiteBuild:null,prerequisiteCurrency:null,source:null,copies:null,copyCurrency:null,
  launcherBuild:null,launcherCurrency:null,prerequisiteBuilderCalled:false,copierCalled:false,launcherBuilderCalled:false,
  compilerBuildOutcome:'UNKNOWN',helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,
  nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false};
 let selector,selectorLineage,persistenceStarted=false;
 const phase=async(name,action)=>{
  const start=tick();
  try{captureMark(name,'validation');if(selector&&!persistenceStarted)guard(mark(directory())===mark(selector));
  lineageCurrent(selectorLineage);
  // Filesystem validation can consume or invalidate the clock budget. Sample
  // only after it finishes, immediately before the corresponding action.
  remaining();captureMark(name,'before');
  if(capture.selected){if(selector&&!persistenceStarted)guard(mark(directory())===mark(selector));lineageCurrent(selectorLineage);}
  remaining();
  const value=await action();captureMark(name,'after');if(selector&&!persistenceStarted)guard(mark(directory())===mark(selector));
   lineageCurrent(selectorLineage);
   phaseCostsMs[name]=tick()-start;return value;}
  catch{try{tick();}catch{/* Keep a finite historical phase duration even when late. */}
   phaseCostsMs[name]=clockUnavailable?null:last-start;throw Error('OBSERVATION_PHASE_UNKNOWN');}
 };
 const count=(called,value,key)=>called?(Number.isInteger(value?.[key])&&value[key]>=0?value[key]:null):0;
 const counters=()=>{
  const prerequisiteAttempts=count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'dispatchAttemptCount');
  const launcherAttempts=count(report.launcherBuilderCalled,report.launcherBuild,'dispatchAttemptCount');
  return{prerequisiteBuildAttempts:prerequisiteAttempts,launcherBuildAttempts:launcherAttempts,
   compilerBuildAttempts:prerequisiteAttempts===null||launcherAttempts===null?null:prerequisiteAttempts+launcherAttempts,
   prerequisiteBuildResults:count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'dispatchResultCount'),
   launcherBuildResults:count(report.launcherBuilderCalled,report.launcherBuild,'dispatchResultCount'),
   prerequisitePidObservedCount:count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'observedProcessCount'),
   launcherPidObservedCount:count(report.launcherBuilderCalled,report.launcherBuild,'observedProcessCount'),
   collectorCopyFileCount:count(report.copierCalled,report.copies,'fileCreateCount'),
   launcherSourceWriteAttempts:count(report.launcherBuilderCalled,report.launcherBuild,'sourceWriteAttempts'),
   launcherSourceWriteCompleted:report.launcherBuild?.sourceWriteCompleted===true,
   launcherSourceFileCount:report.launcherBuild?.sourceWriteCompleted===true?1:!report.launcherBuilderCalled||report.launcherBuild?.sourceWriteAttempts===0?0:null};
 };
 const trueExits=(build,expected)=>{
  guard(build.dispatchAttemptCount===expected&&build.dispatchResultCount===expected&&build.observedProcessCount===expected&&
   build.builds.length===expected&&build.builds.every(row=>row.pidObserved===true&&row.completed===true&&row.status===0&&row.signal===null&&row.spawnError==='NONE'));
  guard(build.commands.length===0&&build.sealed===false&&build.reuseEligible===false);
 };
 const historicalFailure=()=>[report.prerequisiteBuild,report.launcherBuild].some(build=>build?.builds?.some(row=>
  row.pidObserved===true&&Number.isInteger(row.status)&&row.status>0&&row.status<=255&&row.signal===null&&row.spawnError==='NONE'));
 try{
  remaining();if(capture.selected){try{captureOpen();captureMark('testBody','entered');}catch{capture.failed=true;throw Error('OBSERVATION_PHASE_CAPTURE_UNKNOWN');}}
  captureMark('selectorSnapshot','validation');remaining();captureMark('selectorSnapshot','before');remaining();
  selector=directory(); // RAW local guard BEFORE any platform probe/import/fixture/build.
  selectorLineage=ancestorLineage();guard(mark(directory())===mark(selector));lineageCurrent(selectorLineage);captureMark('selectorSnapshot','after');
  remaining();guard(filesystem.constants.O_NOFOLLOW!==undefined&&filesystem.constants.O_NONBLOCK!==undefined);
  await phase('preconditions',()=>{guard(platformReady()===true);});
  const operations=await phase('operationImports',loadOperations);
  guard(mark(directory())===mark(selector));remaining();
  const pair=await phase('freshPair',()=>{const value=operations.preparePair();report.pair={outcome:value.outcome,baseA:value.baseA,baseB:value.baseB};return value;});
  guard(pair.outcome==='BASE_EXCHANGE_PAIR_PREPARED');
  const host=await phase('freshHost',()=>{const value=operations.createHost();report.host={outcome:value.outcome,base:value.base};return value;});
  guard(host.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');
  const hostFixture=await phase('freshHostFixture',()=>{const value=operations.prepareHostFixture(host);report.hostFixtureOutcome=value.outcome;return value;});
  guard(hostFixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
  const assets=await phase('prerequisiteThreeBuilds',()=>{report.prerequisiteBuilderCalled=true;return report.prerequisiteBuild=operations.buildAssets({pair,hostFixture});});
  guard(assets.outcome==='BUILT_NOT_EXECUTED');trueExits(assets,3);
  await phase('prerequisiteCurrency',()=>{report.prerequisiteCurrency=operations.verifyAssets(assets);guard(report.prerequisiteCurrency.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');});
  const source=await phase('sourceDerivation',()=>{const value=operations.prepareSource(assets);report.source={scope:value.scope,disabled:value.disabled,bindings:value.bindings,launcherSource:{file:value.proposedLauncher.file,sha256:value.proposedLauncher.sha256,sourceBytes:value.proposedLauncher.sourceBytes,templateSha256:value.proposedLauncher.templateSha256}};return value;});
  const copies=await phase('fourCollectorCopies',()=>{report.copierCalled=true;return report.copies=operations.provisionCopies(source);});
  guard(copies.outcome==='COLLECTOR_COPIES_OBSERVED_NOT_EXECUTED'&&copies.fileCreateCount===4&&copies.directoryCreateCount===3);
  await phase('copyCurrency',()=>{report.copyCurrency=operations.verifyCopies(copies);guard(report.copyCurrency.outcome==='COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'&&
   report.copyCurrency.hostBase===host.base&&report.copyCurrency.baseA===pair.baseA&&report.copyCurrency.baseB===pair.baseB);});
  const launch=await phase('oneLauncherBuild',()=>{report.launcherBuilderCalled=true;return report.launcherBuild=operations.buildLauncher({assets,source,copies});});
  guard(launch.outcome==='LAUNCHER_BUILT_NOT_EXECUTED');trueExits(launch,1);guard(launch.sourceWriteAttempts===1&&launch.sourceWriteCompleted===true);
  await phase('launcherCurrency',()=>{report.launcherCurrency=operations.verifyLauncher(launch);guard(report.launcherCurrency.outcome==='LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'&&
   report.launcherCurrency.hostBase===host.base&&report.launcherCurrency.baseA===pair.baseA&&report.launcherCurrency.baseB===pair.baseB&&
   report.launcherCurrency.launcherSha256===launch.report.binary.sha256&&report.launcherCurrency.launcherSourceSha256===launch.report.source.sha256);});
  remaining();report.buildSequenceOutcome='BUILT_NOT_EXECUTED';report.compilerBuildOutcome='EXIT_ZERO';completed=true;
 }catch{/* Actual partial data/counters survive; no raw exception/environment/transcript. */}
 if(historicalFailure())report.compilerBuildOutcome='EXIT_NONZERO';
 else if([[report.prerequisiteBuild,3],[report.launcherBuild,1]].every(([build,count])=>build&&
  build.dispatchResultCount===count&&build.observedProcessCount===count&&build.builds?.length===count&&
  build.builds.every(row=>row.pidObserved===true&&row.completed===true&&row.status===0&&row.signal===null&&row.spawnError==='NONE')))
  report.compilerBuildOutcome='EXIT_ZERO';
 report.counters=counters();report.phaseCostsMs={...phaseCostsMs};report.elapsedMs=clockUnavailable?null:totalElapsedMs;
 report.elapsedMsScope='PRE_PERSISTENCE_SNAPSHOT';report.phaseCostsScope='THROUGH_PRE_RECORD_VALIDATION';
 report.observationCompleted=false;report.recordVerified=false;report.phaseCapture=captureSnapshot();
 let recordName=null,recordSha256=null,namedSnapshot,recordParentSnapshot;
 try{
  remaining();const parentBefore=directory(),saveLineage=ancestorLineage();lineageCurrent(selectorLineage);
  // Retain even early refusals without requiring a newly minted fixture label.
  const file=path.join(local,'base-collector-launcher-observation-'+uuid()+'.json'),body=Buffer.from(JSON.stringify(report)+'\n');
  guard(body.length<=65536&&filesystem.constants.O_NOFOLLOW!==undefined&&filesystem.constants.O_NONBLOCK!==undefined);
  persistenceStarted=true;
  await phase('persistence',()=>{filesystem.writeFileSync(file,body,{mode:0o600,flag:'wx'});});
  const parent=directory();recordParentSnapshot=parent;guard(identity(parent)===identity(parentBefore));lineageCurrent(saveLineage);
  await phase('recordReadback',()=>{
   const named=filesystem.lstatSync(file,{bigint:true});namedSnapshot=named;
   const regular=s=>s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(uid)&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===BigInt(body.length);
   guard(regular(named)&&filesystem.realpathSync(file)===file);
   remaining();const fd=filesystem.openSync(file,filesystem.constants.O_RDONLY|filesystem.constants.O_NOFOLLOW|filesystem.constants.O_NONBLOCK);
   try{
    remaining();const opened=filesystem.fstatSync(fd,{bigint:true});guard(regular(opened)&&mark(opened)===mark(named));
    const read=Buffer.alloc(body.length+1);let at=0;
    while(at<read.length){remaining();const n=filesystem.readSync(fd,read,at,read.length-at,at);remaining();guard(Number.isInteger(n)&&n>=0&&n<=read.length-at);if(n===0)break;at+=n;}
    guard(at===body.length&&read.subarray(0,at).equals(body)&&mark(filesystem.fstatSync(fd,{bigint:true}))===mark(opened));remaining();
   }finally{filesystem.closeSync(fd);}
   remaining();lineageCurrent(saveLineage);guard(mark(filesystem.lstatSync(file,{bigint:true}))===mark(named)&&mark(directory())===mark(parent));remaining();
  });
  recordName=path.basename(file);recordSha256=sha(body);
  const summary=JSON.stringify({scope:report.scope,buildSequenceOutcome:report.buildSequenceOutcome,compilerBuildOutcome:report.compilerBuildOutcome,
   ...counters(),recordName,sha256:recordSha256,phaseCostsMs:{...phaseCostsMs,publication:null,finalRecordBarrier:null},
   elapsedMs:totalElapsedMs,elapsedMsScope:'PRE_PUBLICATION_SNAPSHOT',observationStatus:'PENDING_FINAL_BUDGET_CHECK',
   observationCompleted:false,recordVerified:false,helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,sealed:false,reuseEligible:false,phaseCapture:captureSnapshot()});
  remaining();await phase('publication',()=>diagnostic(summary));
  await phase('finalRecordBarrier',()=>{lineageCurrent(saveLineage);guard(mark(filesystem.lstatSync(file,{bigint:true}))===mark(namedSnapshot)&&mark(directory())===mark(parent));});
  tick();recordVerified=true;
 }catch{
  completed=false;recordVerified=false;
  diagnostic(JSON.stringify({scope:'BASE_COLLECTOR_LAUNCHER_RECORD_UNKNOWN',compilerBuildOutcome:report.compilerBuildOutcome,...counters(),
   observationCompleted:false,recordVerified:false,helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,sealed:false,reuseEligible:false}));
  try{tick();}catch{/* Failed publication cannot repair budget/clock/currentness. */}
 }
 if(capture.selected&&capture.fd!==undefined){
  const closeStarted=last;let closeFailed=false;
  try{const s=filesystem.fstatSync(capture.fd,{bigint:true});guard(captureRegular(s,capture.bytesWritten)&&mark(s)===capture.mark);
   captureNamedCurrent(s);remaining();}catch{closeFailed=true;}
  finally{try{filesystem.closeSync(capture.fd);}catch{closeFailed=true;}capture.fd=undefined;}
  try{remaining();guard(!capture.failed&&!closeFailed);const s=filesystem.lstatSync(capture.file,{bigint:true});guard(mark(s)===capture.mark);captureNamedCurrent(s);
   // Capture finalization is later work: it cannot hide a changed saved record.
   if(recordVerified)guard(mark(filesystem.lstatSync(path.join(local,recordName),{bigint:true}))===mark(namedSnapshot)&&mark(directory())===mark(recordParentSnapshot));
   remaining();}
  catch{capture.failed=true;completed=false;recordVerified=false;
   diagnostic(JSON.stringify({scope:'BASE_COLLECTOR_LAUNCHER_RECORD_UNKNOWN',compilerBuildOutcome:report.compilerBuildOutcome,...counters(),
    observationCompleted:false,recordVerified:false,helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,sealed:false,reuseEligible:false,phaseCapture:captureSnapshot()}));
   try{tick();}catch{/* Capture failure remains UNKNOWN. */}
  }
  phaseCostsMs.phaseCaptureClose=clockUnavailable?null:last-closeStarted;
 }
 const finalTimingScope=capture.selected?'THROUGH_PUBLICATION_FINAL_RECORD_BARRIER_AND_CAPTURE_CLOSE':'THROUGH_PUBLICATION_AND_FINAL_RECORD_BARRIER';
 return{completed,recordVerified,report,recordName,recordSha256,phaseCapture:captureSnapshot(),totalElapsedMs,totalElapsedMsScope:finalTimingScope,
  phaseCostsMs,phaseCostsScope:finalTimingScope,outcome:clockUnavailable||budgetExceeded||!recordVerified?'UNKNOWN':completed?'BUILT_NOT_EXECUTED':historicalFailure()?'FAIL':'UNKNOWN',
  observationStatus:clockUnavailable?'CLOCK_UNAVAILABLE':budgetExceeded?'BUDGET_EXCEEDED':completed&&recordVerified?'BUILT_NOT_EXECUTED':'UNKNOWN'};
}

// Default selection and importing mocks perform no fixture/probe/build/readback.
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
test('fresh three prerequisite builds and one fixed launcher build only; no fixed code executes',{
 skip:process.env.REDUE_BASE_COLLECTOR_LAUNCHER_BUILD==='1'?false:'Actual launcher build observation not selected; no fixture or process'
},async t=>{
 const observed=await observeSealedTypeScriptBaseCollectorLauncher({cwd:process.cwd(),uid:typeof process.getuid==='function'?process.getuid():undefined,
  filesystem:fs,now:()=>performance.now(),uuid:randomUUID,diagnostic:message=>t.diagnostic(message),
  phaseCapture:process.env.REDUE_BASE_COLLECTOR_LAUNCHER_PHASE_CAPTURE==='1',
  platformReady:()=>process.env.REDUE_BASE_COLLECTOR_COPIES!=='1'&&process.env.REDUE_BASE_ASSETS_BUILD!=='1'&&
   process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&
   ['getuid','geteuid','getgid','getegid'].every(key=>typeof process[key]==='function')&&
   process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid(),
  loadOperations:async()=>{
   const pair=await import('./acceptance/sealed-typescript-base-exchange-pair.mjs');
   const fixture=await import('./acceptance/sealed-typescript-synthetic-fixture.mjs');
   const assets=await import('./acceptance/sealed-typescript-base-exchange-assets.mjs');
   const source=await import('./acceptance/sealed-typescript-base-collector-source.mjs');
   const copies=await import('./acceptance/sealed-typescript-base-collector-copies.mjs');
   return{preparePair:pair.prepareSealedTypeScriptBaseExchangePair,createHost:fixture.createSealedTypeScriptCIBootstrap,
    prepareHostFixture:fixture.prepareSealedTypeScriptCISyntheticFixture,buildAssets:assets.buildSealedTypeScriptBaseExchangeAssets,
    verifyAssets:assets.verifySealedTypeScriptBaseExchangeAssets,prepareSource:source.prepareSealedTypeScriptBaseCollectorSource,
    provisionCopies:copies.provisionSealedTypeScriptBaseCollectorCopies,verifyCopies:copies.verifySealedTypeScriptBaseCollectorCopies,
    buildLauncher:assets.buildSealedTypeScriptBaseCollectorLauncher,verifyLauncher:assets.verifySealedTypeScriptBaseCollectorLauncherBuild};
  }});
 assert.equal(observed.completed,true,'BASE_COLLECTOR_LAUNCHER_OBSERVATION_UNKNOWN');
});
