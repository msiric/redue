// Fixed reviewed engineering build for a LIVE privately minted fixture only.
// No native helper is executed; success is compiled-assets data, never PASS,
// sandbox, sealing or reuse authority. Partial owned artifacts are retained.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptSyntheticFixture,sealedTypeScriptSyntheticFixtureOriginalAvailable} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal,prepareSealedTypeScriptNativeAssetsProposalForReviewedCI} from './sealed-typescript-native-assets-proposal.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),guard=(condition)=>{if(!condition)throw Error('BUILD_PRECONDITION_UNKNOWN');};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function bounded(file,owner,limit,pin=null){
  guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
  const lineage=parents(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let digest,arm64Header=false;
  try{guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const h=createHash('sha256'),b=Buffer.alloc(65536);let at=0;while(at<Number(s.size)){const asked=Math.min(b.length,Number(s.size)-at),n=fs.readSync(fd,b,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked);if(at===0&&n>=12)arm64Header=b.readUInt32LE(0)===0xfeedfacf&&b.readUInt32LE(4)===0x0100000c;h.update(b.subarray(0,n));at+=n;}digest=h.digest('hex');guard(!pin||digest===pin);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));}finally{fs.closeSync(fd);}
  guard(mark(fs.lstatSync(file,{bigint:true}))===mark(s)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return {file,owner,limit,digest,mark:mark(s),lineage,arm64Header};
}
function current(row){const after=bounded(row.file,row.owner,row.limit,row.digest);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
function ownedDirectory(file){guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return parentMark(s);}
export function sealedAssetsBuildCompleted(r){return Number.isInteger(r.pid)&&r.pid>0&&!r.error&&r.status===0&&r.signal===null;}
const safeSignals=new Set(['SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGILL','SIGINT']);
export function sealedAssetsBuildProcessSummary(r){return {pidObserved:Number.isInteger(r.pid)&&r.pid>0,status:Number.isInteger(r.status)&&r.status>=0&&r.status<=255?r.status:null,signal:r.signal===null?null:safeSignals.has(r.signal)?r.signal:'UNKNOWN',spawnError:r.error?'UNKNOWN':'NONE',completed:sealedAssetsBuildCompleted(r),stdoutBytes:Buffer.byteLength(r.stdout??''),stderrBytes:Buffer.byteLength(r.stderr??'')};}

const mintedBuilds=new WeakMap();
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
// Only fixed H code/runtime rows. Compiler, SDK and home runtime stay outer
// prerequisites; no directory-wide H closure or new currentness is claimed.
export function sealedTypeScriptNativeAssetsBuildOriginalInputs(build){
 const record=mintedBuilds.get(build);if(arguments.length!==1||!record||record.invalid||!sealedTypeScriptSyntheticFixtureOriginalAvailable(record.fixture))return null;
 return freeze({base:record.base,directories:[[record.base,record.baseIdentity],...record.identities].map(([file,mark])=>({file,mark,full:false})),files:record.rows.filter(row=>row.file.startsWith(record.base+'/')).map(row=>({file:row.file,mark:row.mark,digest:row.digest,limit:row.limit,lineage:row.lineage.map(row=>[...row])}))});
}
export function buildSealedTypeScriptNativeAssets(options){return buildFixedAssets(options,false);}
export function buildSealedTypeScriptNativeAssetsForReviewedCI(options){if(arguments.length!==1)throw Object.assign(Error('BUILD_OPTIONS'),{code:'BUILD_OPTIONS'});return buildFixedAssets(options,true);}
function buildFixedAssets(options,ci){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'fixture')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'fixture'),'value'))throw Object.assign(Error('BUILD_OPTIONS'),{code:'BUILD_OPTIONS'});
 const {fixture}=options;
 const observations=[];let finished=false,mintedRecord=null,dispatchAttemptCount=0,ownerReport={schema:1,scope:'LOCAL_SYNTHETIC_ASSETS_BUILD_UNKNOWN',base:null,builds:observations,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false};
 try{
  const observed=verifySealedTypeScriptSyntheticFixture(fixture);guard(observed.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&observed.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'&&observed.receiverBasePolicyMatch===true);
  ownerReport.base=fixture.base;
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  // CI binds the ACTUAL current canonical runtime, never a guessed toolcache
  // path. Its exact bytes/size and endpoint identity remain private rows.
  const node=ci?process.execPath:path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node');guard(process.execPath===node);
  if(ci){guard(typeof node==='string'&&path.isAbsolute(node)&&path.normalize(node)===node&&process.execArgv.length===0&&!Object.keys(process.env).some(key=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(key)));guard(fs.realpathSync(node)===node&&fs.lstatSync(node,{bigint:true}).size===121593488n);}
  const runtime=bounded(node,process.getuid(),128*1024*1024,'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc');
  const proposal=(ci?prepareSealedTypeScriptNativeAssetsProposalForReviewedCI:prepareSealedTypeScriptNativeAssetsProposal)({fixture}),base=proposal.base,baseIdentity=ownedDirectory(base),tool=proposal.toolchain;
  const compiler=bounded(proposal.proposedBuilds[0].executable,0,128*1024*1024,tool.clangSha256);
  const linker=bounded('/Library/Developer/CommandLineTools/usr/bin/ld',0,16*1024*1024,'374d9f0713bce2c8a9e1e82bde51615d5433516a10d99b63107eb6ee70542e4c');
  if(ci)guard(fs.lstatSync(compiler.file,{bigint:true}).size===124676976n&&fs.lstatSync(linker.file,{bigint:true}).size===2749664n);
  guard(fs.realpathSync(tool.sdk)===tool.sdk);const sdkStat=fs.lstatSync(tool.sdk,{bigint:true});guard(sdkStat.isDirectory()&&!sdkStat.isSymbolicLink()&&sdkStat.uid===0n&&(sdkStat.mode&0o22n)===0n);const sdkIdentity=parentMark(sdkStat);
  const headers=Object.entries(tool.headerPins).map(([rel,pin])=>bounded(tool.sdk+'/usr/include/'+rel,0,1024*1024,pin));
  const directories=[base+'/prefix',base+'/prefix/native-probes',base+'/runtime',base+'/runtime/node-v22.13.0-darwin-arm64',base+'/runtime/node-v22.13.0-darwin-arm64/bin'];
  const identities=[];for(const file of directories){fs.mkdirSync(file,{mode:0o700});identities.push([file,ownedDirectory(file)]);}
  fs.copyFileSync(node,proposal.bindings.node,fs.constants.COPYFILE_EXCL);fs.chmodSync(proposal.bindings.node,0o755);current(runtime);
  const copied=bounded(proposal.bindings.node,process.getuid(),128*1024*1024,runtime.digest);
  const sources=[];for(const row of proposal.sources){fs.writeFileSync(row.file,row.source,{flag:'wx',mode:0o600});sources.push(bounded(row.file,process.getuid(),1024*1024,row.sha256));}
  const artifacts=[];
  for(const operation of proposal.proposedBuilds){
   guard(verifySealedTypeScriptSyntheticFixture(fixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');current(compiler);current(linker);for(const row of [...headers,...sources,copied])current(row);
   guard(ownedDirectory(base)===baseIdentity&&identities.every(([file,before])=>ownedDirectory(file)===before)&&parentMark(fs.lstatSync(tool.sdk,{bigint:true}))===sdkIdentity);
   dispatchAttemptCount++;const result=spawnSync(operation.executable,operation.argv,{cwd:base+'/prefix/native-probes',env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});
   observations.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));const output=operation.argv.at(-1);const binary=bounded(output,process.getuid(),2*1024*1024);
   guard(binary.arm64Header);current(binary);artifacts.push(binary);
  }
  for(const row of [runtime,compiler,linker,...headers,...sources,copied,...artifacts])current(row);guard(verifySealedTypeScriptSyntheticFixture(fixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&ownedDirectory(base)===baseIdentity&&identities.every(([file,before])=>ownedDirectory(file)===before));
  const report={schema:1,scope:'LOCAL_SYNTHETIC_ASSETS_BUILT_NOT_EXECUTED',base,baseIdentity,sources:sources.map(row=>({file:row.file,sha256:row.digest})),binaries:artifacts.map(row=>({file:row.file,sha256:row.digest})),nodeSha256:copied.digest,builds:observations,templateSha256:proposal.sources.map(row=>row.templateSha256),fixtureCurrent:true,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false};
  if(ci)report.fixtureProfileId='fixed-native-assets-ci-sdk26.5-toolpair-a@1';
  ownerReport=report;
  mintedRecord={fixture,base,baseIdentity,identities,sdk:tool.sdk,sdkIdentity,rows:[runtime,compiler,linker,...headers,...sources,copied,...artifacts]};
  finished=true;
 }catch{/* Static UNKNOWN report retains partial build observations, no raw error. */}
 const result=freeze({schema:1,outcome:finished?'ASSETS_BUILT_NOT_EXECUTED':'UNKNOWN',report:ownerReport,dispatchAttemptCount,commands:[],recordAdoptionAuthority:false,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false});
 if(finished)mintedBuilds.set(result,mintedRecord);return result;
}

// Read-only, one privately minted build only. Not a receipt, certificate, cached
// applicability decision or persistent-record adoption route. Observed failure
// irreversibly invalidates this mint; restored labels cannot revive it.
function nativeBuildBoundary(record){guard(verifySealedTypeScriptSyntheticFixture(record.fixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&ownedDirectory(record.base)===record.baseIdentity&&record.identities.every(([file,before])=>ownedDirectory(file)===before)&&fs.realpathSync(record.sdk)===record.sdk&&parentMark(fs.lstatSync(record.sdk,{bigint:true}))===record.sdkIdentity);}
function nativeBuildNamedRows(record){for(const row of record.rows)guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
export function verifySealedTypeScriptNativeAssetsBuild(build){
 const record=mintedBuilds.get(build);const unknown=()=>freeze({schema:1,scope:'OBSERVED_BUILD_DATA_ONLY',outcome:'UNKNOWN',commands:[],sealed:false,reuseEligible:false});
 if(!record||record.invalid)return unknown();
 try{nativeBuildBoundary(record);for(const row of record.rows)current(row);nativeBuildBoundary(record);
  // Catch changes after a row's hash while later fixed rows were validated.
  nativeBuildNamedRows(record);nativeBuildBoundary(record);
  return freeze({schema:1,scope:'OBSERVED_BUILD_DATA_ONLY',outcome:'ASSETS_BUILD_CURRENTLY_OBSERVED',base:record.base,commands:[],sealed:false,reuseEligible:false});
 }catch{record.invalid=true;return unknown();}
}

// Compose one exchange-assets observation, not a reusable certificate/cache.
// The complete private native row set is hashed before synchronous inspection.
// Each late barrier checks that exact set and fixture/SDK/root ancestry again;
// it is unusable after this call and cannot select a different build. Required
// ctime/inode/lineage checks retain the trusted/quiescent-parent limitation:
// this is not atomic content protection against a hostile filesystem.
const activeBuildObservations=new WeakMap();
export function observeSealedTypeScriptNativeAssetsBuild(build,inspect){
 const enclosing=activeBuildObservations.get(build);if(enclosing){enclosing.failed=true;guard(false);}
 guard(arguments.length===2&&typeof inspect==='function'&&Object.getPrototypeOf(inspect)===Function.prototype);
 const record=mintedBuilds.get(build);guard(record&&!record.invalid);
 const operation={failed:false};activeBuildObservations.set(build,operation);let active=true;
 const barrier=()=>{guard(active&&!record.invalid&&!operation.failed);try{nativeBuildBoundary(record);nativeBuildNamedRows(record);nativeBuildBoundary(record);nativeBuildNamedRows(record);}catch(error){record.invalid=true;throw error;}};
 try{guard(verifySealedTypeScriptNativeAssetsBuild(build).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');guard(inspect(barrier)===undefined&&!operation.failed);barrier();}
 finally{active=false;activeBuildObservations.delete(build);}
}
