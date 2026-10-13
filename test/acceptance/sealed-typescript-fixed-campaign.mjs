// Disabled fixed native campaign source/collection only. Live preparer mints
// never cross into the rendered child. Protected copies, launcher/command,
// effective native boundary, parent supervision and handle proof are separate.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {verifySealedTypeScriptBaseExchangeAssets,verifySealedTypeScriptPairedStageArtifacts,sealedTypeScriptPairedStageArtifactsMatchDerivation} from './sealed-typescript-base-exchange-assets.mjs';
import {verifySealedTypeScriptPairedStageSource} from './sealed-typescript-paired-stage-source.mjs';
import {parseSealedTypeScriptBaseExchangeResult,createSealedTypeScriptBaseExchangeResultLatch} from './sealed-typescript-base-exchange-result.mjs';
import {parseSealedTypeScriptStageExchangeResult,createSealedTypeScriptStageExchangeResultLatch} from './sealed-typescript-stage-exchange-result.mjs';
import {parseSealedTypeScriptStageResult,createSealedTypeScriptStageResultLatch} from './sealed-typescript-stage-result.mjs';
import {parseSealedTypeScriptMapResult,createSealedTypeScriptMapResultLatch} from './sealed-typescript-map-result.mjs';
const roles=Object.freeze(['whole_base','stage_exchange','node_stage','mapper']);
const parses=[parseSealedTypeScriptBaseExchangeResult,parseSealedTypeScriptStageExchangeResult,parseSealedTypeScriptStageResult,parseSealedTypeScriptMapResult];
const latches=[createSealedTypeScriptBaseExchangeResultLatch,createSealedTypeScriptStageExchangeResultLatch,createSealedTypeScriptStageResultLatch,createSealedTypeScriptMapResultLatch];
const exits=[74,74,1,74],limits=[4096,4096,8192,4096];
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const sha=value=>createHash('sha256').update(value).digest('hex');
// Lexical factory is for the fixed renderer below and synthetic tests only.
// No argv/path/options dispatcher, mint adoption or native authentication exists.
export function collectSealedTypeScriptFixedCampaign(create){
 if(arguments.length!==1||typeof create!=='function'||Object.getPrototypeOf(create)!==Function.prototype)throw Error('CAMPAIGN_FACTORY_INVALID');
 return new Promise(resolve=>{
  const clock=()=>{try{const n=performance.now();return Number.isFinite(n)&&n>=0?n:null;}catch{return null;}};
  const started=clock(),phases=[];let active=null,done=false,timedOut=false,error=null,last=started,stderrTotal=0;
  const current=()=>{const n=clock();if(n===null||last===null||n<last){error??='CAMPAIGN_CLOCK_UNAVAILABLE';return null;}last=n;if(n-started>=14000){timedOut=true;error??='CAMPAIGN_DEADLINE';}return n;};
  const stop=()=>{try{if(active?.child&&active.child.exitCode===null&&active.child.signalCode===null)active.child.kill('SIGKILL');}catch{error??='CHILD_KILL_UNAVAILABLE';}};
  const append=(state,exitCode=null,signal=null,close=false)=>{
   if(state.appended)return;state.appended=true;
   const validCode=Number.isInteger(exitCode)&&exitCode>=0&&exitCode<=255?exitCode:null,validSignal=signals.has(signal)?signal:null;
   let pid=null;try{pid=state.child?.pid;}catch{state.error??='CHILD_LIFECYCLE_INVALID';}
   const reaped=close&&state.spawn&&Number.isInteger(pid)&&pid>0&&((validCode!==null&&signal===null)||(exitCode===null&&validSignal!==null));
   if(close&&!reaped)state.error??='CHILD_LIFECYCLE_INVALID';
   current();const observation=latches[state.at]().observe(state.bytes,{exitCode:validCode,signal:validSignal,exitObserved:reaped,timedOut});
   const failed=state.failed??(observation.outcome==='FAIL'?observation:null);
   const complete=reaped&&validCode===exits[state.at]&&signal===null&&!timedOut&&!error&&!state.error&&state.stderr===0;
   phases.push({role:roles[state.at],attempted:true,outcome:failed?'FAIL':'UNKNOWN',implementedAssertionsOutcome:failed?'FAIL':complete?observation.implementedAssertionsOutcome:'UNKNOWN',checks:failed?.checks??observation.checks,
    expectedExitCode:exits[state.at],exitCode:validCode,signal:validSignal,exitObserved:reaped,spawnObserved:state.spawn,reaped,timedOut,stdoutBytes:state.bytes.length,stderrBytes:state.stderr,reason_code:state.error??error??(complete?'EXPECTED_CHILD_CLOSE_OBSERVED':'CHILD_COLLECTION_INCOMPLETE')});
  };
  const finish=()=>{
   if(done)return;current();if(active&&!active.appended)append(active);done=true;clearTimeout(deadline);clearTimeout(reap);
   for(let at=phases.length;at<4;at++)phases.push({role:roles[at],attempted:false,outcome:'UNKNOWN',implementedAssertionsOutcome:'UNKNOWN',checks:null,expectedExitCode:exits[at],exitCode:null,signal:null,exitObserved:false,spawnObserved:false,reaped:false,timedOut,stdoutBytes:0,stderrBytes:0,reason_code:'NOT_PERFORMED_AFTER_UNESTABLISHED_PREREQUISITE'});
   const result=()=>({schema:1,scope:'FIXED_ORDERED_CAMPAIGN_DIAGNOSTICS_ONLY',outcome:phases.some(p=>p.outcome==='FAIL')?'FAIL':'UNKNOWN',implementedProtocolsOutcome:!error&&!timedOut&&phases.every(p=>p.implementedAssertionsOutcome==='ALL_IMPLEMENTED_ROWS_OBSERVED')?'ALL_IMPLEMENTED_PROTOCOL_ROWS_OBSERVED':'UNKNOWN',phases,elapsedMs:error!=='CAMPAIGN_CLOCK_UNAVAILABLE'&&started!==null&&last!==null&&last>=started?last-started:null,timedOut,reason_code:error??(phases.some(p=>p.outcome==='FAIL')?'REPORTED_ASSERTION_FAILED':phases.every(p=>p.attempted)?'FIXED_PROTOCOLS_COLLECTED_NOT_NATIVE_AUTHENTICATED':'CAMPAIGN_STOPPED_UNKNOWN'),ownedChildCleanupRequired:phases.some(p=>p.attempted&&!p.reaped),rawOutputRetained:false,sourceProvenance:'NOT_ESTABLISHED_BY_COLLECTION',nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
   let report=freeze(result());current();
   // Collection/freeze work also belongs to the same deadline. Late or broken
   // clocks cannot certify completeness after timers were blocked by JS work.
   if(error||timedOut)report=freeze({...result(),phases:phases.map(p=>({...p,timedOut,implementedAssertionsOutcome:p.outcome==='FAIL'?'FAIL':'UNKNOWN'})),implementedProtocolsOutcome:'UNKNOWN'});
   resolve(report);
  };
  // One pair of absolute campaign timers. Never renew either for a new helper.
  const deadline=setTimeout(()=>{timedOut=true;error??='CAMPAIGN_DEADLINE';stop();if(!active)finish();},14000);
  const reap=setTimeout(()=>{timedOut=true;error??='CAMPAIGN_REAP_DEADLINE';stop();finish();},14500);
  const launch=at=>{
   current();if(error||timedOut){finish();return;}
   const s={at,child:null,spawn:false,bytes:Buffer.alloc(0),stderr:0,error:null,failed:null,appended:false};active=s;
   try{
    s.child=create(roles[at]);
    s.child.on('error',()=>{s.error??='CHILD_START_FAILURE';stop();});
    s.child.on('spawn',()=>{try{s.spawn=Number.isInteger(s.child.pid)&&s.child.pid>0;}catch{s.error??='CHILD_LIFECYCLE_INVALID';}if(s.error||error||timedOut)stop();});
    s.child.stdout.on('error',()=>{s.error??='CHILD_IO_UNAVAILABLE';stop();});s.child.stderr.on('error',()=>{s.error??='CHILD_IO_UNAVAILABLE';stop();});
    s.child.stdout.on('data',chunk=>{
     if(done||s.appended)return;
     if(!Buffer.isBuffer(chunk)||chunk.length>limits[at]-s.bytes.length){s.error??='CHILD_OUTPUT_LIMIT';stop();return;}
     s.bytes=Buffer.concat([s.bytes,chunk]);
     // Preserve a fully validated failed document if later I/O/malformed output
     // destroys collection completeness. No partial/invalid FAIL is promoted.
     try{const parsed=parses[at](s.bytes);if(parsed.result==='FAIL')s.failed??=parsed;}catch{}
    });
    s.child.stderr.on('data',chunk=>{if(done||s.appended)return;if(!Buffer.isBuffer(chunk)){s.error??='CHILD_STDERR_TYPE';stop();return;}s.stderr=Math.min(4097,s.stderr+chunk.length);stderrTotal=Math.min(4097,stderrTotal+chunk.length);if(stderrTotal>4096){s.error??='CHILD_STDERR_LIMIT';stop();}});
    s.child.on('close',(code,signal)=>{
     if(done||s.appended)return;append(s,code,signal,true);active=null;
     const observed=phases.at(-1);if(observed.outcome==='FAIL'||observed.implementedAssertionsOutcome!=='ALL_IMPLEMENTED_ROWS_OBSERVED'||at===3){finish();return;}launch(at+1);
    });
   }catch{s.error??='CHILD_START_FAILURE';stop();if(!s.child){append(s);active=null;finish();}}
  };
  if(started===null){error='CAMPAIGN_CLOCK_UNAVAILABLE';finish();}else launch(0);
 });
}

const pins=[
 ['sealed-typescript-base-exchange-result.mjs','be2d30edf40597f52a6a9e919b5a3ee26e15bf0dc9f942badda0fb54db10b05d'],
 ['sealed-typescript-stage-exchange-result.mjs','dc86c11a62ef22563d63ea0541185b86b14910a029c67c9b3f58eec4a52b6654'],
 ['sealed-typescript-stage-result.mjs','7c6f7685314deeac8de6974604b0dae8154286262e0e2cbc7a6fda41a84e6813'],
 ['sealed-typescript-map-result.mjs','d19e3d1f33394b74c2771207d24ed3697ba1665e1e0d5f49564ecb80e0dcce13'],
 ['../../src/portable-envelope.mjs','3a10d9546b5b71ceb99121412471f250676cb71a2c943532ddec39a3ac836482'],
];
const fail=()=>{throw Object.assign(Error('CAMPAIGN_SOURCE_UNAVAILABLE'),{code:'CAMPAIGN_SOURCE_UNAVAILABLE'});};
const statFields=['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'];
const same=(a,b)=>statFields.every(k=>String(a[k])===String(b[k]));
function lineage(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink())fail();rows.push([at,['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':')]);if(at===path.dirname(at))return rows;}}
function dependencies(){return pins.map(([name,pin])=>{const file=fileURLToPath(new URL(name,import.meta.url)),s=fs.lstatSync(file,{bigint:true}),parents=lineage(file);if(fs.realpathSync(file)!==file||!s.isFile()||s.uid!==BigInt(process.getuid())||s.nlink!==1n||(s.mode&0o6022n)!==0n||s.size<=0n||s.size>1048576n)fail();const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let bytes;try{if(!same(s,fs.fstatSync(fd,{bigint:true})))fail();const buffer=Buffer.alloc(Number(s.size)+1);let count=0;while(count<buffer.length){const n=fs.readSync(fd,buffer,count,buffer.length-count,count);if(n===0)break;if(!Number.isInteger(n)||n<0||n>buffer.length-count)fail();count+=n;}bytes=buffer.subarray(0,count);if(count!==Number(s.size)||!same(s,fs.fstatSync(fd,{bigint:true})))fail();}finally{fs.closeSync(fd);}if(sha(bytes)!==pin||!same(s,fs.lstatSync(file,{bigint:true}))||JSON.stringify(lineage(file))!==JSON.stringify(parents))fail();return{file,name,pin,stat:s,parents,bytes};});}
export function prepareSealedTypeScriptFixedCampaignSource(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||!['assetsBuild','pairedArtifacts','pairedSource'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))fail();
 const {assetsBuild,pairedArtifacts,pairedSource}=options;
 const observe=()=>{if(!sealedTypeScriptPairedStageArtifactsMatchDerivation(pairedArtifacts,assetsBuild,pairedSource))fail();const a=verifySealedTypeScriptBaseExchangeAssets(assetsBuild),p=verifySealedTypeScriptPairedStageArtifacts(pairedArtifacts),s=verifySealedTypeScriptPairedStageSource(pairedSource);if(a.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'||p.outcome!=='PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'||s.outcome!=='PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'||!['baseA','baseB','hostBase'].every(k=>a[k]===p[k]&&a[k]===s[k])||JSON.stringify(p.bindings)!==JSON.stringify(s.bindings))fail();return{a,p,s};};
 const before=observe(),h=before.a.hostBase,a=before.a.baseA,b=before.a.baseB;
 if(![a,b,h].every(v=>/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(v))||new Set([a,b,h]).size!==3)fail();
 const node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=h+'/prefix/native-probes/paired-stage-campaign.mjs',cwd=a+'/Checkout 空间/.sealed-native-canaries';
 const actors=[{role:roles[0],file:h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel',args:[],fileSha256:assetsBuild.report?.binary?.sha256},{role:roles[1],file:h+'/prefix/native-probes/sealed-typescript-paired-stage-exchange',args:[],fileSha256:pairedArtifacts.report?.binaries?.[1]?.sha256},{role:roles[2],file:node,args:[h+'/prefix/native-probes/sealed-typescript-paired-stage-node.mjs'],fileSha256:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',argumentSha256:pairedArtifacts.report?.sources?.[0]?.sha256},{role:roles[3],file:h+'/prefix/native-probes/sealed-typescript-paired-stage-map',args:[],fileSha256:pairedArtifacts.report?.binaries?.[0]?.sha256}];
 if(actors.some(row=>!/^[a-f0-9]{64}$/.test(row.fileSha256))||!/^[a-f0-9]{64}$/.test(actors[2].argumentSha256))fail();
 if(before.p.bindings.node!==node||before.p.bindings.checker!==actors[2].args[0]||assetsBuild.report?.binary?.file!==actors[0].file||pairedArtifacts.report?.sources?.[0]?.file!==actors[2].args[0]||pairedArtifacts.report?.binaries?.[0]?.file!==actors[3].file||pairedArtifacts.report?.binaries?.[1]?.file!==actors[1].file)fail();
 const deps=dependencies(),functionSource=Function.prototype.toString.call(collectSealedTypeScriptFixedCampaign);
 const source=`// Disabled fixed campaign child; no serialized mint is an input.\nimport {spawn} from 'node:child_process';\nimport {parseSealedTypeScriptBaseExchangeResult,createSealedTypeScriptBaseExchangeResultLatch} from '../test/acceptance/sealed-typescript-base-exchange-result.mjs';\nimport {parseSealedTypeScriptStageExchangeResult,createSealedTypeScriptStageExchangeResultLatch} from '../test/acceptance/sealed-typescript-stage-exchange-result.mjs';\nimport {parseSealedTypeScriptStageResult,createSealedTypeScriptStageResultLatch} from '../test/acceptance/sealed-typescript-stage-result.mjs';\nimport {parseSealedTypeScriptMapResult,createSealedTypeScriptMapResultLatch} from '../test/acceptance/sealed-typescript-map-result.mjs';\nconst roles=Object.freeze(${JSON.stringify(roles)}),parses=[parseSealedTypeScriptBaseExchangeResult,parseSealedTypeScriptStageExchangeResult,parseSealedTypeScriptStageResult,parseSealedTypeScriptMapResult],latches=[createSealedTypeScriptBaseExchangeResultLatch,createSealedTypeScriptStageExchangeResultLatch,createSealedTypeScriptStageResultLatch,createSealedTypeScriptMapResultLatch],exits=[74,74,1,74],limits=[4096,4096,8192,4096],signals=new Set(${JSON.stringify([...signals])}),freeze=${Function.prototype.toString.call(freeze)};\nconst collect=${functionSource},actors=Object.freeze(${JSON.stringify(actors)});\nlet result={schema:1,scope:'FIXED_ORDERED_CAMPAIGN_DIAGNOSTICS_ONLY',outcome:'UNKNOWN',reason_code:'EXACT_REVIEWED_CAMPAIGN_ROUTE_REQUIRED',nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false};\ntry{if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||process.execPath!==${JSON.stringify(node)}||process.execArgv.length||process.argv.length!==2||process.argv[1]!==${JSON.stringify(entry)}||process.cwd()!==${JSON.stringify(cwd)}||Object.keys(process.env).some(k=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(k)))throw Error();result=await collect(role=>{const selected=actors[roles.indexOf(role)];return spawn(selected.file,selected.args,{cwd:${JSON.stringify(cwd)},env:process.env,stdio:['ignore','pipe','pipe']});});}catch{}\nprocess.exitCode=result.outcome==='FAIL'?1:74;try{process.stdout.on('error',()=>{});process.stdout.write(JSON.stringify(result)+'\\n',()=>{});}catch{}\n`;
 if(Buffer.byteLength(source)>65536||JSON.stringify(observe())!==JSON.stringify(before))fail();
 for(const d of deps)if(!same(d.stat,fs.lstatSync(d.file,{bigint:true}))||JSON.stringify(lineage(d.file))!==JSON.stringify(d.parents))fail();
 return freeze({schema:1,scope:'DISABLED_FIXED_CAMPAIGN_SOURCE_DATA_ONLY',disabled:true,baseA:a,baseB:b,hostBase:h,entry,node,cwd,actors,source,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source),dependencyPins:deps.map(d=>({name:d.name,sha256:d.pin})),commands:[],nativeLaunches:0,helperExecutions:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false,blockers:['CURRENT_PROTECTED_CAMPAIGN_COPY_AND_PRE_NODE_LAUNCHER_NOT_PROVISIONED','EXACT_NATIVE_COMMAND_AND_TOOL_RESULT_NOT_BOUND','PREPARER_AND_INHERITED_HANDLE_PROOF_REQUIRED','SOURCE_DATA_DOES_NOT_CONSUME_OR_ADOPT_PRIVATE_PREPARER_MINTS']});
}
