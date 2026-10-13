// Opt-in fixed engineering observation: fresh A/B/H, three prerequisite builds
// and two paired C builds. No built code, checker, helper, TypeScript or model runs.
// Trusted/quiescent parent reads are NOT hostile-ancestor/native confinement.
// An enclosing reviewed parent must enforce 30s wall time and reap its owned
// process group within 5s: sampling here cannot interrupt blocked synchronous IO.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {fileURLToPath} from 'node:url';import {createHash,randomUUID} from 'node:crypto';
const guard=value=>{if(!value)throw Error('PAIRED_STAGE_OBSERVATION_UNKNOWN');};
const sha=body=>createHash('sha256').update(body).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(s[key])).join(':');
const identity=s=>['dev','ino','mode','uid','gid'].map(key=>String(s[key])).join(':');
const authorityFalse=Object.freeze({commands:Object.freeze([]),helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,receiptWrites:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
// Injection exists only for deterministic authored controls. The selected test
// below fixes all real operations, selector, code paths, runtime and environment.
export async function observeSealedTypeScriptPairedStageArtifacts({cwd,uid,filesystem,now,uuid,diagnostic,platformReady,loadOperations}){
 let begun;try{begun=now();}catch{begun=NaN;}
 let last=begun,elapsedMs=null,clockUnavailable=!Number.isFinite(begun),budgetExceeded=false,completed=false,recordVerified=false,selector,lineage,persisting=false;
 const costs={},local=path.resolve(cwd,'.local/portable-evidence');
 const tick=()=>{let value;try{value=now();}catch{clockUnavailable=true;elapsedMs=null;throw Error('CLOCK_UNKNOWN');}
  if(!Number.isFinite(value)||!Number.isFinite(begun)||value<last||!Number.isFinite(value-begun)){clockUnavailable=true;elapsedMs=null;}
  else{last=value;if(!clockUnavailable)elapsedMs=value-begun;if(elapsedMs>=30000)budgetExceeded=true;}
  guard(!clockUnavailable&&!budgetExceeded);return value;};
 const directory=()=>{const s=filesystem.lstatSync(local,{bigint:true});guard(Number.isInteger(uid)&&uid>0&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(uid)&&(s.mode&0o22n)===0n&&filesystem.realpathSync(local)===local&&mark(filesystem.lstatSync(local,{bigint:true}))===mark(s));return s;};
 const ancestors=()=>{const rows=[];for(let at=path.dirname(local);;at=path.dirname(at)){guard(rows.length<64);const s=filesystem.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&filesystem.realpathSync(at)===at&&identity(filesystem.lstatSync(at,{bigint:true}))===identity(s));rows.push([at,identity(s)]);if(at===path.dirname(at))return rows;}};
 const lineageCurrent=before=>guard(before&&JSON.stringify(ancestors())===JSON.stringify(before));
 const token=()=>{const value=uuid();guard(typeof value==='string'&&/^[a-f0-9-]{1,64}$/.test(value));return value;};
 const regular=(s,size)=>s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(uid)&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===BigInt(size);
 const writeFlags=()=>{guard(['O_WRONLY','O_CREAT','O_EXCL','O_NOFOLLOW','O_NONBLOCK'].every(key=>filesystem.constants[key]!==undefined));return filesystem.constants.O_WRONLY|filesystem.constants.O_CREAT|filesystem.constants.O_EXCL|filesystem.constants.O_NOFOLLOW|filesystem.constants.O_NONBLOCK;};
 const phases=new Set(['preconditions','operationImports','freshPair','freshHost','hostFixture','prerequisiteThreeBuilds','prerequisiteCurrency','pairedSource','pairedTwoBuilds','pairedCurrency','persistence','recordReadback','publication','finalRecordBarrier','phaseCaptureClose']);
 const trace={fd:undefined,file:null,name:null,bytes:0,rows:0,mark:null,identity:null,parent:null,lineage:null,failed:false};
 const traceNamed=s=>{guard(mark(filesystem.lstatSync(trace.file,{bigint:true}))===mark(s)&&filesystem.realpathSync(trace.file)===trace.file&&identity(directory())===trace.parent);lineageCurrent(trace.lineage);};
 const traceOpen=()=>{tick();const parent=directory(),parents=ancestors();tick();const file=path.join(local,'paired-stage-artifact-phases-'+token()+'.jsonl');tick();trace.fd=filesystem.openSync(file,writeFlags(),0o600);trace.file=file;trace.name=path.basename(file);
  const s=filesystem.fstatSync(trace.fd,{bigint:true});guard(regular(s,0));trace.mark=mark(s);trace.identity=identity(s);trace.parent=identity(parent);trace.lineage=parents;traceNamed(s);tick();};
 const traceMark=(phase,edge)=>{try{guard(trace.fd!==undefined&&!trace.failed&&phases.has(phase)&&['validation','before','after'].includes(edge)&&trace.rows<48);
  const before=filesystem.fstatSync(trace.fd,{bigint:true});guard(regular(before,trace.bytes)&&mark(before)===trace.mark&&identity(before)===trace.identity);traceNamed(before);tick();
  const bytes=Buffer.from(JSON.stringify({schema:1,phase,edge,elapsedMs})+'\n');guard(bytes.length<=256&&trace.bytes+bytes.length<=16384);let at=0;
  while(at<bytes.length){tick();const n=filesystem.writeSync(trace.fd,bytes,at,bytes.length-at,trace.bytes);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;trace.bytes+=n;tick();}
  trace.rows++;const after=filesystem.fstatSync(trace.fd,{bigint:true});guard(regular(after,trace.bytes)&&identity(after)===trace.identity);traceNamed(after);trace.mark=mark(after);tick();
 }catch{trace.failed=true;throw Error('TRACE_UNKNOWN');}};
 const selectorCurrent=()=>{guard(selector&&identity(directory())===identity(selector));if(!persisting)guard(mark(directory())===mark(selector));lineageCurrent(lineage);tick();};
 const phase=async(name,action)=>{const start=tick();try{traceMark(name,'validation');selectorCurrent();traceMark(name,'before');selectorCurrent();tick();const value=await action();traceMark(name,'after');selectorCurrent();costs[name]=tick()-start;return value;}
  catch{try{tick();}catch{/* Preserve only observed historical duration. */}costs[name]=clockUnavailable?null:last-start;throw Error('PHASE_UNKNOWN');}};
 const report={schema:1,scope:'ENGINEERING_FRESH_PAIRED_STAGE_ARTIFACTS_SNAPSHOT',...authorityFalse,prerequisiteBuilderCalled:false,pairedBuilderCalled:false,prerequisiteBuild:null,pairedBuild:null,pair:null,host:null,hostFixtureOutcome:null,source:null,prerequisiteCurrency:null,pairedCurrency:null,buildSequenceOutcome:'UNKNOWN',compilerBuildOutcome:'UNKNOWN'};
 const count=(called,build,key,max)=>called?(Number.isInteger(build?.[key])&&build[key]>=0&&build[key]<=max?build[key]:null):0;
 const counters=()=>{const prerequisite=count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'dispatchAttemptCount',3),paired=count(report.pairedBuilderCalled,report.pairedBuild,'dispatchAttemptCount',2);return{
  prerequisiteBuildAttempts:prerequisite,pairedBuildAttempts:paired,compilerBuildAttempts:prerequisite===null||paired===null?null:prerequisite+paired,
  prerequisiteBuildResults:count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'dispatchResultCount',3),pairedBuildResults:count(report.pairedBuilderCalled,report.pairedBuild,'dispatchResultCount',2),
  prerequisitePidObservedCount:count(report.prerequisiteBuilderCalled,report.prerequisiteBuild,'observedProcessCount',3),pairedPidObservedCount:count(report.pairedBuilderCalled,report.pairedBuild,'observedProcessCount',2),pairedSourceWriteAttempts:count(report.pairedBuilderCalled,report.pairedBuild,'sourceWriteAttempts',3),pairedSourceFileCount:count(report.pairedBuilderCalled,report.pairedBuild,'fileCreateCount',3)};};
 const exitedZero=(build,n)=>build&&build.dispatchAttemptCount===n&&build.dispatchResultCount===n&&build.observedProcessCount===n&&Array.isArray(build.builds)&&build.builds.length===n&&build.builds.every(row=>row?.pidObserved===true&&row.completed===true&&row.status===0&&row.signal===null&&row.spawnError==='NONE');
 const requireZero=(build,n)=>{guard(exitedZero(build,n));guard(Array.isArray(build.commands)&&build.commands.length===0&&build.sealed===false&&build.reuseEligible===false);};
 const history=()=>[report.prerequisiteBuild,report.pairedBuild].some(build=>Array.isArray(build?.builds)&&build.builds.some(row=>row?.pidObserved===true&&Number.isInteger(row.status)&&row.status>0&&row.status<=255&&row.signal===null&&row.spawnError==='NONE'))?'EXIT_NONZERO':exitedZero(report.prerequisiteBuild,3)&&exitedZero(report.pairedBuild,2)?'EXIT_ZERO':'UNKNOWN';
 let recordName=null,recordSha256=null,recordFile=null,namedRecord=null,recordParent=null,recordLineage=null;
 const recordBarrier=()=>{guard(recordFile&&namedRecord&&recordParent);lineageCurrent(recordLineage);guard(mark(filesystem.lstatSync(recordFile,{bigint:true}))===mark(namedRecord)&&mark(directory())===mark(recordParent));tick();};
 try{
  try{tick();traceOpen();selector=directory();lineage=ancestors();selectorCurrent();
   await phase('preconditions',()=>guard(platformReady()===true));const operations=await phase('operationImports',loadOperations);
   const pair=await phase('freshPair',()=>{const value=operations.preparePair();report.pair={outcome:value.outcome,baseA:value.baseA,baseB:value.baseB};return value;});guard(pair.outcome==='BASE_EXCHANGE_PAIR_PREPARED');
   const host=await phase('freshHost',()=>{const value=operations.createHost();report.host={outcome:value.outcome,base:value.base};return value;});guard(host.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');
   const hostFixture=await phase('hostFixture',()=>{const value=operations.prepareHostFixture(host);report.hostFixtureOutcome=value.outcome;return value;});guard(hostFixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
   const assets=await phase('prerequisiteThreeBuilds',()=>{report.prerequisiteBuilderCalled=true;return report.prerequisiteBuild=operations.buildAssets({pair,hostFixture});});guard(assets.outcome==='BUILT_NOT_EXECUTED');requireZero(assets,3);
   await phase('prerequisiteCurrency',()=>{report.prerequisiteCurrency=operations.verifyAssets(assets);guard(report.prerequisiteCurrency.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');});
   const source=await phase('pairedSource',()=>{const value=operations.prepareSource({pair,assetsBuild:assets});guard(value.scope==='DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY'&&value.disabled===true&&value.baseA===pair.baseA&&value.baseB===pair.baseB&&value.hostBase===host.base);report.source={scope:value.scope,disabled:value.disabled,baseA:value.baseA,baseB:value.baseB,hostBase:value.hostBase,bindings:value.bindings,sources:value.sources.map(row=>({kind:row.kind,file:row.file,sha256:row.sha256,sourceBytes:row.sourceBytes,templateSha256:row.templateSha256}))};return value;});
   const built=await phase('pairedTwoBuilds',()=>{report.pairedBuilderCalled=true;return report.pairedBuild=operations.buildPaired({assetsBuild:assets,source});});guard(built.outcome==='BUILT_NOT_EXECUTED');requireZero(built,2);guard(built.sourceWriteAttempts===3&&built.fileCreateCount===3);
   await phase('pairedCurrency',()=>{report.pairedCurrency=operations.verifyPaired(built);guard(report.pairedCurrency.outcome==='PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'&&report.pairedCurrency.baseA===pair.baseA&&report.pairedCurrency.baseB===pair.baseB&&report.pairedCurrency.hostBase===host.base&&JSON.stringify(report.pairedCurrency.bindings)===JSON.stringify(built.report.bindings));});
   tick();report.buildSequenceOutcome='BUILT_NOT_EXECUTED';completed=true;
  }catch{/* Retain true partial data; never raw exception, environment or code. */}
  report.compilerBuildOutcome=history();report.counters=counters();report.elapsedMs=clockUnavailable?null:elapsedMs;report.elapsedMsScope='PRE_PERSISTENCE_SNAPSHOT';report.phaseCostsMs={...costs};report.phaseCostsScope='THROUGH_PRE_RECORD_VALIDATION';report.observationCompleted=false;report.recordVerified=false;report.phaseCapture={recordName:trace.name,recordsWritten:trace.rows,bytesWritten:trace.bytes,outcome:'UNKNOWN',authority:false};
  try{
   tick();guard(trace.fd!==undefined&&!trace.failed&&selector&&lineage);selectorCurrent();const parentBefore=directory();recordLineage=ancestors();
   recordFile=path.join(local,'paired-stage-artifact-observation-'+token()+'.json');selectorCurrent();const body=Buffer.from(JSON.stringify(report)+'\n');guard(body.length>0&&body.length<=65536);persisting=true;
   await phase('persistence',()=>{let fd;try{tick();fd=filesystem.openSync(recordFile,writeFlags(),0o600);const before=filesystem.fstatSync(fd,{bigint:true});guard(regular(before,0));let at=0;
    while(at<body.length){tick();const n=filesystem.writeSync(fd,body,at,body.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=body.length-at);at+=n;tick();}
    const after=filesystem.fstatSync(fd,{bigint:true});guard(regular(after,body.length)&&identity(after)===identity(before));tick();filesystem.fsyncSync(fd);tick();guard(mark(filesystem.lstatSync(recordFile,{bigint:true}))===mark(after));
   }finally{if(fd!==undefined)filesystem.closeSync(fd);tick();}});
   recordParent=directory();guard(identity(recordParent)===identity(parentBefore));lineageCurrent(recordLineage);
   await phase('recordReadback',()=>{namedRecord=filesystem.lstatSync(recordFile,{bigint:true});guard(regular(namedRecord,body.length)&&filesystem.realpathSync(recordFile)===recordFile&&filesystem.constants.O_RDONLY!==undefined);tick();let fd;
    try{fd=filesystem.openSync(recordFile,filesystem.constants.O_RDONLY|filesystem.constants.O_NOFOLLOW|filesystem.constants.O_NONBLOCK);const opened=filesystem.fstatSync(fd,{bigint:true});guard(regular(opened,body.length)&&mark(opened)===mark(namedRecord));const bytes=Buffer.alloc(body.length+1);let at=0;
     while(at<bytes.length){tick();const n=filesystem.readSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>=0&&n<=bytes.length-at);tick();if(n===0)break;at+=n;}
     guard(at===body.length&&bytes.subarray(0,at).equals(body)&&mark(filesystem.fstatSync(fd,{bigint:true}))===mark(opened));tick();
    }finally{if(fd!==undefined)filesystem.closeSync(fd);tick();}recordBarrier();});
   recordName=path.basename(recordFile);recordSha256=sha(body);await phase('publication',()=>diagnostic(JSON.stringify({scope:'PAIRED_STAGE_OBSERVATION_PRE_FINAL_SNAPSHOT',...authorityFalse,compilerBuildOutcome:report.compilerBuildOutcome,counters:counters(),recordName,sha256:recordSha256,observationCompleted:false,recordVerified:false,elapsedMs,elapsedMsScope:'PRE_PUBLICATION_SNAPSHOT',phaseCostsMs:{...costs,publication:null},phaseCapture:{recordName:trace.name,recordsWritten:trace.rows,bytesWritten:trace.bytes,outcome:'UNKNOWN',authority:false}})));
   await phase('finalRecordBarrier',recordBarrier);tick();recordVerified=true;
  }catch{completed=false;recordVerified=false;try{diagnostic(JSON.stringify({scope:'PAIRED_STAGE_OBSERVATION_UNKNOWN',...authorityFalse,compilerBuildOutcome:report.compilerBuildOutcome,counters:counters(),observationCompleted:false,recordVerified:false}));}catch{/* Publication cannot repair missing evidence. */}try{tick();}catch{}}
 }finally{
  const closeStart=last;let closeFailed=false;
  if(trace.fd!==undefined){try{traceMark('phaseCaptureClose','before');const before=filesystem.fstatSync(trace.fd,{bigint:true});guard(regular(before,trace.bytes)&&mark(before)===trace.mark);traceNamed(before);tick();filesystem.fsyncSync(trace.fd);tick();guard(mark(filesystem.fstatSync(trace.fd,{bigint:true}))===trace.mark);traceNamed(before);tick();}catch{closeFailed=true;}
   finally{try{filesystem.closeSync(trace.fd);}catch{closeFailed=true;}trace.fd=undefined;}
   try{tick();guard(!trace.failed&&!closeFailed);const named=filesystem.lstatSync(trace.file,{bigint:true});guard(mark(named)===trace.mark);traceNamed(named);if(recordVerified)recordBarrier();tick();}catch{completed=false;recordVerified=false;trace.failed=true;try{diagnostic(JSON.stringify({scope:'PAIRED_STAGE_OBSERVATION_UNKNOWN',...authorityFalse,compilerBuildOutcome:report.compilerBuildOutcome,counters:counters(),observationCompleted:false,recordVerified:false}));}catch{}try{tick();}catch{}}
  }else{completed=false;recordVerified=false;}
  costs.phaseCaptureClose=clockUnavailable?null:last-closeStart;
 }
 return{schema:1,scope:'ENGINEERING_PAIRED_STAGE_OBSERVATION_FINAL_STATE',...authorityFalse,outcome:completed&&recordVerified&&!clockUnavailable&&!budgetExceeded?'BUILT_NOT_EXECUTED':'UNKNOWN',completed:completed&&recordVerified&&!clockUnavailable&&!budgetExceeded,recordVerified:recordVerified&&!clockUnavailable&&!budgetExceeded,recordName,recordSha256,report,counters:counters(),phaseCostsMs:costs,totalElapsedMs:clockUnavailable?null:elapsedMs,totalElapsedMsScope:'OBSERVATION_BODY_THROUGH_PUBLICATION_RECORD_BARRIERS_AND_PHASE_CAPTURE_CLOSE',observationStatus:clockUnavailable?'CLOCK_UNAVAILABLE':budgetExceeded?'BUDGET_EXCEEDED':completed&&recordVerified?'BUILT_NOT_EXECUTED':'UNKNOWN',phaseCapture:{recordName:trace.name,recordsWritten:trace.rows,bytesWritten:trace.bytes,outcome:'UNKNOWN',authority:false}};
}
// Default is SKIP before any directory, fixture, import or build. No selector
// silently chooses this route; no existing observation wrapper is modified.
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))test('fresh three prerequisite plus two paired C builds; no built code executes',{
 skip:process.env.REDUE_PAIRED_STAGE_ARTIFACTS_BUILD==='1'?false:'Paired-stage engineering observation not selected; no fixture or process'
},async t=>{
 const observed=await observeSealedTypeScriptPairedStageArtifacts({cwd:process.cwd(),uid:typeof process.getuid==='function'?process.getuid():undefined,filesystem:fs,now:()=>performance.now(),uuid:randomUUID,diagnostic:message=>t.diagnostic(message),
  platformReady:()=>!['REDUE_SYNTHETIC_ASSETS_BUILD','REDUE_BASE_ASSETS_BUILD','REDUE_BASE_COLLECTOR_COPIES','REDUE_BASE_COLLECTOR_LAUNCHER_BUILD'].some(key=>process.env[key]==='1')&&
   process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node')&&
   ['getuid','geteuid','getgid','getegid'].every(key=>typeof process[key]==='function')&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&
   !Object.keys(process.env).some(key=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(key)),
  loadOperations:async()=>{const pair=await import('./acceptance/sealed-typescript-base-exchange-pair.mjs'),fixture=await import('./acceptance/sealed-typescript-synthetic-fixture.mjs'),assets=await import('./acceptance/sealed-typescript-base-exchange-assets.mjs'),source=await import('./acceptance/sealed-typescript-paired-stage-source.mjs');
   return{preparePair:pair.prepareSealedTypeScriptBaseExchangePair,createHost:fixture.createSealedTypeScriptCIBootstrap,prepareHostFixture:fixture.prepareSealedTypeScriptCISyntheticFixture,buildAssets:assets.buildSealedTypeScriptBaseExchangeAssets,verifyAssets:assets.verifySealedTypeScriptBaseExchangeAssets,prepareSource:source.prepareSealedTypeScriptPairedStageSource,buildPaired:assets.buildSealedTypeScriptPairedStageArtifacts,verifyPaired:assets.verifySealedTypeScriptPairedStageArtifacts};}});
 assert.equal(observed.completed,true,'PAIRED_STAGE_OBSERVATION_UNKNOWN');
});
