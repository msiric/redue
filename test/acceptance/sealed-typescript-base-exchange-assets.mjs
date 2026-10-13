// Fixed engineering build ONLY. Requires two live private brands, stores all
// public code/runtime/binaries under H and never writes either synthetic A/B.
// No helper execution, model, account, policy or serialized-record adoption.
// Parent reads require a trusted/quiescent filesystem; O_NOFOLLOW leaf checks
// are not hostile-ancestor read confinement or a native enforcement proof.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptBaseExchangePair} from './sealed-typescript-base-exchange-pair.mjs';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptBaseExchangeSource} from './sealed-typescript-base-exchange-source.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal} from './sealed-typescript-native-assets-proposal.mjs';
import {verifySealedTypeScriptBaseCollectorSource,sealedTypeScriptBaseCollectorSourceMatchesAssets} from './sealed-typescript-base-collector-source.mjs';
import {verifySealedTypeScriptBaseCollectorCopies,sealedTypeScriptBaseCollectorCopiesMatchSource} from './sealed-typescript-base-collector-copies.mjs';
import {buildSealedTypeScriptNativeAssets,verifySealedTypeScriptNativeAssetsBuild,observeSealedTypeScriptNativeAssetsBuild,sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary} from './sealed-typescript-native-assets-build.mjs';
import {verifySealedTypeScriptPairedStageSource,sealedTypeScriptPairedStageSourceMatchesDerivation} from './sealed-typescript-paired-stage-source.mjs';
import {mark as profileMark,profiling} from '../../src/decision-profile.mjs';
const mintedAssets=new WeakMap();
const sha=value=>createHash('sha256').update(value).digest('hex'),guard=value=>{if(!value)throw Error('BASE_EXCHANGE_ASSETS_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=stat=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
const parentMark=stat=>['dev','ino','mode','uid','gid'].map(key=>String(stat[key])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const stat=fs.lstatSync(at,{bigint:true});guard(stat.isDirectory()&&!stat.isSymbolicLink());rows.push([at,parentMark(stat)]);if(at===path.dirname(at))return rows;}}
// These guards cover ONLY the new source/output, not an arbitrary file API.
// Old runtime/toolchain/source/binary guards stay in the existing private build.
function bounded(file,limit,pin=null){guard(typeof process.getuid==='function'&&fs.realpathSync(file)===file);const stat=fs.lstatSync(file,{bigint:true});guard(stat.isFile()&&!stat.isSymbolicLink()&&stat.uid===BigInt(process.getuid())&&stat.nlink===1n&&(stat.mode&0o6022n)===0n&&stat.size>0n&&stat.size<=BigInt(limit));
 const lineage=parents(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let digest,arm64Header=false;
 try{guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(stat));const hash=createHash('sha256'),bytes=Buffer.alloc(65536);let at=0;while(at<Number(stat.size)){const asked=Math.min(bytes.length,Number(stat.size)-at),count=fs.readSync(fd,bytes,0,asked,at);guard(Number.isInteger(count)&&count>0&&count<=asked);if(at===0&&count>=12)arm64Header=bytes.readUInt32LE(0)===0xfeedfacf&&bytes.readUInt32LE(4)===0x0100000c;hash.update(bytes.subarray(0,count));at+=count;}digest=hash.digest('hex');guard(!pin||pin===digest);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(stat));}finally{fs.closeSync(fd);}
 guard(mark(fs.lstatSync(file,{bigint:true}))===mark(stat)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return{file,limit,digest,mark:mark(stat),lineage,arm64Header};}
function namedCurrent(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function current(row){const after=bounded(row.file,row.limit,row.digest);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
function rootIdentity(file){guard(fs.realpathSync(file)===file);const stat=fs.lstatSync(file,{bigint:true});guard(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.uid===BigInt(process.getuid())&&(stat.mode&0o7777n)===0o700n);return{inode:stat.dev+':'+stat.ino,identity:parentMark(stat),parents:parents(file)};}
export function buildSealedTypeScriptBaseExchangeAssets(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||!['pair','hostFixture'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))throw Object.assign(Error('BASE_EXCHANGE_ASSETS_OPTIONS'),{code:'BASE_EXCHANGE_ASSETS_OPTIONS'});
 const {pair,hostFixture}=options,builds=[];let reason='PAIR_UNAVAILABLE',report=null,mintedRecord=null,hostDispatchAttempts=0,thirdDispatchAttempts=0;
 try{const initialPair=verifySealedTypeScriptBaseExchangePair(pair);guard(initialPair.outcome==='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED');reason='HOST_UNAVAILABLE';const host=verifySealedTypeScriptSyntheticFixture(hostFixture);guard(host.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&host.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY');
  const base=host.base;guard(/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(base)&&base!==initialPair.baseA&&base!==initialPair.baseB);
  const roots=[initialPair.baseA,initialPair.baseB,base].map(file=>[file,rootIdentity(file)]);guard(new Set(roots.map(([,row])=>row.inode)).size===3);
  const boundary=()=>{guard(JSON.stringify(verifySealedTypeScriptBaseExchangePair(pair))===JSON.stringify(initialPair)&&verifySealedTypeScriptSyntheticFixture(hostFixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');for(const [file,before] of roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));};
  reason='HOST_BUILD_UNAVAILABLE';boundary();hostDispatchAttempts=null;const hostBuild=buildSealedTypeScriptNativeAssets({fixture:hostFixture});guard(Number.isInteger(hostBuild.dispatchAttemptCount)&&hostBuild.dispatchAttemptCount>=0&&hostBuild.dispatchAttemptCount<=2);hostDispatchAttempts=hostBuild.dispatchAttemptCount;builds.push(...hostBuild.report.builds);guard(hostBuild.outcome==='ASSETS_BUILT_NOT_EXECUTED');
  reason='BOUNDARY_CHANGED';boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');const rendered=prepareSealedTypeScriptBaseExchangeSource(pair),proposal=prepareSealedTypeScriptNativeAssetsProposal({fixture:hostFixture});
  const file=base+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel.c',output=file.slice(0,-2);guard(rendered.sourceBytes>0&&rendered.sourceBytes<=65536&&sha(rendered.source)===rendered.sourceSha256);
  fs.writeFileSync(file,rendered.source,{flag:'wx',mode:0o600});const source=bounded(file,65536,rendered.sourceSha256);
  boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(source);
  const operation=proposal.proposedBuilds[1],argv=[...operation.argv.slice(0,-3),file,'-o',output];reason='EXECUTION_UNAVAILABLE';thirdDispatchAttempts++;const result=spawnSync(operation.executable,argv,{cwd:base+'/prefix/native-probes',env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});builds.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));
  reason='OUTPUT_UNAVAILABLE';const binary=bounded(output,2*1024*1024);guard(binary.arm64Header);reason='BOUNDARY_CHANGED';current(source);current(binary);boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(source);current(binary);boundary();
  // Later row hashing/boundaries must not hide a changed earlier new file.
  // This is an observed metadata barrier, not atomic hostile-writer protection.
  for(const row of [source,binary])namedCurrent(row);
  mintedRecord={pair,hostFixture,hostBuild,initialPair,roots,source,binary};
  report={base,source:{file,sha256:source.digest,mark:source.mark,lineage:source.lineage},binary:{file:output,sha256:binary.digest,mark:binary.mark,lineage:binary.lineage},templateSha256:rendered.templateSha256};
 }catch{/* Only static phase codes and actual process summaries escape. Partial H remains. */}
 const result=freeze({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:report?'BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:report?'BUILT_NOT_EXECUTED':reason,report,builds,dispatchAttemptCount:hostDispatchAttempts===null?null:hostDispatchAttempts+thirdDispatchAttempts,dispatchResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved===true).length,commands:[],compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false});
 if(report)mintedAssets.set(result,mintedRecord);return result;
}

// Read-only currency of an in-process successful build mint. Serialized report
// fields cannot adopt, select or authorize a different A/B/H namespace. Changes
// permanently invalidate this mint; no continuing native/seal authority exists.
export function verifySealedTypeScriptBaseExchangeAssets(build){
 const record=mintedAssets.get(build),unknown=()=>freeze({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'UNKNOWN',commands:[],sealed:false,reuseEligible:false});
 if(!record||record.invalid)return unknown();
 try{const boundary=()=>{guard(JSON.stringify(verifySealedTypeScriptBaseExchangePair(record.pair))===JSON.stringify(record.initialPair)&&verifySealedTypeScriptSyntheticFixture(record.hostFixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');for(const [file,before] of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));};
  boundary();observeSealedTypeScriptNativeAssetsBuild(record.hostBuild,lateNativeBarrier=>{
   current(record.source);current(record.binary);boundary();lateNativeBarrier();
   current(record.source);current(record.binary);boundary();lateNativeBarrier();
  });
  // Same-call native hashes are composed with late all-row metadata barriers.
  // The last native barrier can still change an earlier new row: retain this
  // final named/ancestry check. Each independent verification hashes anew.
  for(const row of [record.source,record.binary])namedCurrent(row);
  return freeze({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:record.initialPair.baseA,baseB:record.initialPair.baseB,hostBase:record.roots[2][0],commands:[],sealed:false,reuseEligible:false});
 }catch{record.invalid=true;return unknown();}
}


// Fixed launcher-only engineering build. Source, four JS copies and original
// assets must be the same live private derivation; labels cannot adopt them.
// This never repeats the old three builds or executes the new launcher/Node.
// Existing host build currency supplies the pinned compiler/linker/SDK/runtime
// checks. The original trusted/quiescent ancestry limitation remains unchanged.
const mintedLauncherBuilds=new WeakMap();
const launcherAuthorityFalse=fields=>freeze({schema:1,scope:'FIXED_BASE_COLLECTOR_LAUNCHER_BUILD_DATA_ONLY',...fields,
 commands:[],recordAdoptionAuthority:false,compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,
 nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
// Existing best-effort diagnostics only. No availability claim or result gate:
// the outer observer owns bounded readback and labels absent frames UNKNOWN.
// Keep default/readonly currency uninstrumented; only this build passes true.
function launcherDiagnostic(active,phase,fields={}){if(active&&profiling)try{profileMark(phase,fields);}catch{/* Never replace guards or process facts. */}}
function launcherDependencies(record,diagnostics=false){
 launcherDiagnostic(diagnostics,'launcher_dependencies_before');
 guard(sealedTypeScriptBaseCollectorSourceMatchesAssets(record.proposal,record.assets)&&sealedTypeScriptBaseCollectorCopiesMatchSource(record.copies,record.proposal));
 launcherDiagnostic(diagnostics,'launcher_assets_currency_before');
 const assets=verifySealedTypeScriptBaseExchangeAssets(record.assets);
 launcherDiagnostic(diagnostics,'launcher_assets_currency_after',{outcome:assets.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'?'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED':'UNKNOWN'});
 launcherDiagnostic(diagnostics,'launcher_source_currency_before');
 const source=verifySealedTypeScriptBaseCollectorSource(record.proposal);
 launcherDiagnostic(diagnostics,'launcher_source_currency_after',{outcome:source.outcome==='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'?'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED':'UNKNOWN'});
 launcherDiagnostic(diagnostics,'launcher_copies_currency_before');
 const copies=verifySealedTypeScriptBaseCollectorCopies(record.copies);
 launcherDiagnostic(diagnostics,'launcher_copies_currency_after',{outcome:copies.outcome==='COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'?'COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED':'UNKNOWN'});
 guard(assets.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'&&assets.scope==='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY'&&
  source.outcome==='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&source.scope==='DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY'&&
  copies.outcome==='COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'&&copies.scope==='FIXED_COLLECTOR_COPIES_DATA_ONLY');
 guard(assets.hostBase===source.hostBase&&copies.hostBase===source.hostBase&&assets.baseA===source.baseA&&assets.baseB===source.baseB&&
  copies.baseA===source.baseA&&copies.baseB===source.baseB&&JSON.stringify(copies.bindings)===JSON.stringify(source.bindings));
 launcherDiagnostic(diagnostics,'launcher_dependencies_after');return{assets,source,copies};
}
function launcherBoundary(record,diagnostics=false){
 launcherDiagnostic(diagnostics,'launcher_boundary_before');
 guard(JSON.stringify(launcherDependencies(record,diagnostics))===JSON.stringify(record.before));
 for(const [file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));
 launcherDiagnostic(diagnostics,'launcher_boundary_after');
}
function launcherFilesCurrent(record,diagnostics=false){
 launcherBoundary(record,diagnostics);
 launcherDiagnostic(diagnostics,'launcher_source_current_before');current(record.source);launcherDiagnostic(diagnostics,'launcher_source_current_after');
 launcherDiagnostic(diagnostics,'launcher_binary_current_before');current(record.binary);launcherDiagnostic(diagnostics,'launcher_binary_current_after');
 launcherBoundary(record,diagnostics);
 launcherDiagnostic(diagnostics,'launcher_source_current_before');current(record.source);launcherDiagnostic(diagnostics,'launcher_source_current_after');
 launcherDiagnostic(diagnostics,'launcher_binary_current_before');current(record.binary);launcherDiagnostic(diagnostics,'launcher_binary_current_after');
 launcherBoundary(record,diagnostics);
 // Later original-source/copy/runtime hashes must not conceal earlier new rows.
 launcherDiagnostic(diagnostics,'launcher_final_roots_before');
 for(const [file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));
 launcherDiagnostic(diagnostics,'launcher_final_roots_after');
 launcherDiagnostic(diagnostics,'launcher_final_new_rows_before');
 for(const row of [record.source,record.binary])namedCurrent(row);
 launcherDiagnostic(diagnostics,'launcher_final_new_rows_after');
}
function absent(file){try{fs.lstatSync(file,{bigint:true});}catch(error){guard(error?.code==='ENOENT');return;}guard(false);}
export function buildSealedTypeScriptBaseCollectorLauncher(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||
  !['assets','source','copies'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))
  throw Object.assign(Error('BASE_COLLECTOR_LAUNCHER_BUILD_OPTIONS'),{code:'BASE_COLLECTOR_LAUNCHER_BUILD_OPTIONS'});
 const{assets,source:proposal,copies}=options,builds=[];
 let reason='PRIVATE_DERIVATION_UNAVAILABLE',report=null,record=null,dispatchAttemptCount=0,sourceWriteAttempts=0,sourceWriteCompleted=false;
 launcherDiagnostic(true,'launcher_build_before');
 try{
  const original=mintedAssets.get(assets);guard(original&&!original.invalid);
  const candidate={assets,proposal,copies},before=launcherDependencies(candidate,true),h=before.assets.hostBase;
  guard(typeof process.getuid==='function'&&process.getuid()>0&&['O_NOFOLLOW','O_NONBLOCK'].every(key=>fs.constants[key]!==undefined));
  guard(/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&h!==before.assets.baseA&&h!==before.assets.baseB);
  const file=h+'/prefix/native-probes/base-exchange-collect-launch.c',output=file.slice(0,-2),rendered=proposal.proposedLauncher,bindings=before.source.bindings;
  reason='LAUNCHER_BINDINGS_UNAVAILABLE';guard(rendered.disabled===true&&rendered.file===file&&rendered.output===output&&
   bindings.launcherSource===file&&bindings.launcher===output&&bindings.launcherSourceSha256===rendered.sha256&&
   Number.isInteger(rendered.sourceBytes)&&rendered.sourceBytes>0&&rendered.sourceBytes<=65536&&Buffer.byteLength(rendered.source)===rendered.sourceBytes&&sha(rendered.source)===rendered.sha256&&
   bindings.node===h+'/runtime/node-v22.13.0-darwin-arm64/bin/node'&&bindings.nodeSha256==='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'&&
   bindings.entry===h+'/prefix/native-probes/base-exchange-collect.mjs'&&bindings.collectorSha256===proposal.proposedSources[3].sha256);
  const roots=[h,h+'/prefix',h+'/prefix/native-probes'].map(at=>[at,rootIdentity(at)]);
  Object.assign(candidate,{before,roots});launcherBoundary(candidate,true);
  // Retrieve fixed reviewed argv via the original private host fixture only.
  launcherDiagnostic(true,'launcher_tool_proposal_before');
  const toolProposal=prepareSealedTypeScriptNativeAssetsProposal({fixture:original.hostFixture});
  guard(toolProposal.base===h&&toolProposal.bindings.node===bindings.node);
  launcherDiagnostic(true,'launcher_tool_proposal_after');
  const operation=toolProposal.proposedBuilds[1],argv=[...operation.argv.slice(0,-3),file,'-o',output];
  launcherBoundary(candidate,true);launcherDiagnostic(true,'launcher_new_paths_absent_before');absent(file);absent(output);launcherDiagnostic(true,'launcher_new_paths_absent_after');
  reason='SOURCE_CREATE_UNAVAILABLE';launcherDiagnostic(true,'launcher_source_create_before',{sourceWriteAttempts});
  sourceWriteAttempts++;fs.writeFileSync(file,rendered.source,{flag:'wx',mode:0o600});sourceWriteCompleted=true;
  launcherDiagnostic(true,'launcher_source_create_after',{sourceWriteAttempts,sourceWriteCompleted:1});
  launcherDiagnostic(true,'launcher_source_read_before');
  const newSource=bounded(file,65536,rendered.sha256);guard((fs.lstatSync(file,{bigint:true}).mode&0o7777n)===0o600n&&
   fs.lstatSync(file,{bigint:true}).size===BigInt(rendered.sourceBytes));
  launcherDiagnostic(true,'launcher_source_read_after');
  launcherBoundary(candidate,true);launcherDiagnostic(true,'launcher_source_current_before');current(newSource);launcherDiagnostic(true,'launcher_source_current_after');
  launcherDiagnostic(true,'launcher_output_absent_before');absent(output);launcherDiagnostic(true,'launcher_output_absent_after');
  launcherBoundary(candidate,true);launcherDiagnostic(true,'launcher_source_named_before');namedCurrent(newSource);launcherDiagnostic(true,'launcher_source_named_after');
  const childOptions={cwd:h+'/prefix/native-probes',env:{TMPDIR:h},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'};
  reason='COMPILER_BUILD_UNAVAILABLE';launcherDiagnostic(true,'launcher_compiler_before',{dispatchAttempts:dispatchAttemptCount,dispatchResults:builds.length,observedProcesses:0});
  dispatchAttemptCount++;const result=spawnSync(operation.executable,argv,childOptions);
  builds.push(sealedAssetsBuildProcessSummary(result));const observed=builds[0];
  launcherDiagnostic(true,'launcher_compiler_after',{dispatchAttempts:dispatchAttemptCount,dispatchResults:builds.length,observedProcesses:observed.pidObserved?1:0,
   status:observed.status,signal:observed.signal,spawnError:observed.spawnError,completed:observed.completed?1:0});
  guard(sealedAssetsBuildCompleted(result));
  reason='LAUNCHER_OUTPUT_UNAVAILABLE';launcherDiagnostic(true,'launcher_output_read_before');const binary=bounded(output,2*1024*1024);guard(binary.arm64Header);
  launcherDiagnostic(true,'launcher_output_read_after');
  Object.assign(candidate,{source:newSource,binary});reason='BOUNDARY_CHANGED';launcherFilesCurrent(candidate,true);
  record=candidate;report={base:h,bindings,source:{file,sha256:newSource.digest,mark:newSource.mark,lineage:newSource.lineage},
   binary:{file:output,sha256:binary.digest,mark:binary.mark,lineage:binary.lineage},templateSha256:rendered.templateSha256};
 }catch{/* Static phase/counters only. Every partial H artifact is retained. */}
 const result=launcherAuthorityFalse({outcome:report?'LAUNCHER_BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:report?'BUILT_NOT_EXECUTED':reason,
  report,builds,sourceWriteAttempts,sourceWriteCompleted,dispatchAttemptCount,dispatchResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved===true).length});
 if(record)mintedLauncherBuilds.set(result,record);
 launcherDiagnostic(true,'launcher_build_after',{outcome:result.outcome,dispatchAttempts:result.dispatchAttemptCount,dispatchResults:result.dispatchResultCount,
  observedProcesses:result.observedProcessCount,sourceWriteAttempts:result.sourceWriteAttempts,sourceWriteCompleted:result.sourceWriteCompleted?1:0});
 return result;
}
export function verifySealedTypeScriptBaseCollectorLauncherBuild(build){
 const record=mintedLauncherBuilds.get(build),unknown=()=>launcherAuthorityFalse({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();
 try{launcherFilesCurrent(record);return launcherAuthorityFalse({outcome:'LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',
  baseA:record.before.assets.baseA,baseB:record.before.assets.baseB,hostBase:record.before.assets.hostBase,bindings:record.before.source.bindings,
  launcherSha256:record.binary.digest,launcherSourceSha256:record.source.digest});
 }catch{record.invalid=true;return unknown();}
}

// Boolean private identity linkage only; no mint getter or serialized adoption.
// The caller must separately verify current launcher/source/assets/copy bytes.
export function sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation(build,assets,source){
 const record=mintedLauncherBuilds.get(build);
 return arguments.length===3&&!!record&&!record.invalid&&record.assets===assets&&record.proposal===source;
}

// Exact original pair linkage only. No private-record getter or public adoption.
export function sealedTypeScriptBaseExchangeAssetsMatchPair(assets,pair){
 const record=mintedAssets.get(assets);return arguments.length===2&&!!record&&!record.invalid&&record.pair===pair;
}

// Fixed A-target assertions under H; the original H-target binaries cannot be
// substituted. Engineering build data only: no copied Node/checker/helper runs.
// Trusted/quiescent ancestry is still required; these guards are not sealing.
const mintedPairedArtifacts=new WeakMap();
const pairedKinds=['checker','mapper','exchange'];
const pairedNames=['sealed-typescript-paired-stage-node.mjs','sealed-typescript-paired-stage-map.c','sealed-typescript-paired-stage-exchange.c'];
const pairedPins=['d206de2e8fa469768aecec6e7bf276a935a0071c470aa5b1ad053de6dd649671','14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070','06e5da5dca906063762410f40bea9b7f99662cb6a62934ee50749a7b41162e48'];
const pairedAuthorityFalse=fields=>freeze({schema:1,scope:'PAIRED_STAGE_ENGINEERING_ARTIFACTS_DATA_ONLY',...fields,commands:[],recordAdoptionAuthority:false,compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
function pairedDependencies(record){
 guard(sealedTypeScriptBaseExchangeAssetsMatchPair(record.assetsBuild,record.pair)&&sealedTypeScriptPairedStageSourceMatchesDerivation(record.proposal,record.pair,record.assetsBuild));
 const assets=verifySealedTypeScriptBaseExchangeAssets(record.assetsBuild),source=verifySealedTypeScriptPairedStageSource(record.proposal);
 guard(assets.scope==='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY'&&assets.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'&&source.scope==='DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY'&&source.outcome==='PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&assets.baseA===source.baseA&&assets.baseB===source.baseB&&assets.hostBase===source.hostBase&&source.node===source.hostBase+'/runtime/node-v22.13.0-darwin-arm64/bin/node');
 return{assets,source};
}
function pairedBoundary(record){guard(JSON.stringify(pairedDependencies(record))===JSON.stringify(record.before));for(const [file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));}
function pairedFilesCurrent(record){
 pairedBoundary(record);for(const row of record.rows)current(row);pairedBoundary(record);
 for(const row of record.rows)current(row);pairedBoundary(record);
 // Original/runtime/toolchain validation after all new-file full reads, then
 // every new named row. No inherited prior result grants continuing authority.
 for(const [file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));
 for(const row of record.rows)namedCurrent(row);
}
export function buildSealedTypeScriptPairedStageArtifacts(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||!['assetsBuild','source'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))throw Object.assign(Error('PAIRED_STAGE_ARTIFACTS_OPTIONS'),{code:'PAIRED_STAGE_ARTIFACTS_OPTIONS'});
 const {assetsBuild,source:proposal}=options,builds=[];let reason='PRIVATE_DERIVATION_UNAVAILABLE',report=null,record=null,dispatchAttemptCount=0,sourceWriteAttempts=0,fileCreateCount=0;
 try{
  const original=mintedAssets.get(assetsBuild);guard(original&&!original.invalid&&sealedTypeScriptPairedStageSourceMatchesDerivation(proposal,original.pair,assetsBuild));
  const candidate={assetsBuild,proposal,pair:original.pair},before=pairedDependencies(candidate),h=before.assets.hostBase;
  guard(typeof process.getuid==='function'&&process.getuid()>0&&['O_RDONLY','O_WRONLY','O_CREAT','O_EXCL','O_NOFOLLOW','O_NONBLOCK'].every(key=>fs.constants[key]!==undefined));
  guard(/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&h!==before.assets.baseA&&h!==before.assets.baseB&&proposal.disabled===true&&proposal.scope==='DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY'&&proposal.node===before.source.node&&JSON.stringify(proposal.bindings)===JSON.stringify(before.source.bindings));
  const sources=proposal.sources;guard(Array.isArray(sources)&&sources.length===3);
  for(let at=0;at<3;at++){const row=sources[at];guard(row&&Object.getPrototypeOf(row)===Object.prototype&&Reflect.ownKeys(row).length===6&&['kind','file','templateSha256','source','sha256','sourceBytes'].every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(row,key)??{},'value'))&&row.kind===pairedKinds[at]&&row.file===h+'/prefix/native-probes/'+pairedNames[at]&&row.templateSha256===pairedPins[at]&&typeof row.source==='string'&&Buffer.from(row.source).toString('utf8')===row.source&&Number.isInteger(row.sourceBytes)&&row.sourceBytes>0&&row.sourceBytes<=1048576&&row.sourceBytes===Buffer.byteLength(row.source)&&sha(row.source)===row.sha256);}
  const roots=[before.assets.baseA,before.assets.baseB,h,h+'/prefix',h+'/prefix/native-probes'].map(file=>[file,rootIdentity(file)]);
  Object.assign(candidate,{before,roots,rows:[]});pairedBoundary(candidate);
  const tool=prepareSealedTypeScriptNativeAssetsProposal({fixture:original.hostFixture});guard(tool.scope==='FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY'&&tool.base===h&&tool.bindings.node===before.source.node&&tool.proposedBuilds.length===2);
  const flags=['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0','-isysroot','/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk'];
  for(let at=0;at<2;at++){const operation=tool.proposedBuilds[at],oldFile=h+'/prefix/native-probes/'+['sealed-typescript-map-sentinel.c','sealed-typescript-exchange-sentinel.c'][at];guard(operation.disabled===true&&operation.executable==='/Library/Developer/CommandLineTools/usr/bin/clang'&&JSON.stringify(operation.argv)===JSON.stringify([...flags,oldFile,'-o',oldFile.slice(0,-2)]));}
  pairedBoundary(candidate);for(const row of sources)absent(row.file);for(const row of sources.slice(1))absent(row.file.slice(0,-2));
  reason='SOURCE_CREATE_UNAVAILABLE';for(const source of sources){
   pairedBoundary(candidate);for(const row of candidate.rows)namedCurrent(row);const lineage=parents(source.file);let fd,writtenMark,failure=false;
   try{sourceWriteAttempts++;fd=fs.openSync(source.file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);fileCreateCount++;
    const before=fs.fstatSync(fd,{bigint:true});guard(before.isFile()&&!before.isSymbolicLink()&&before.uid===BigInt(process.getuid())&&before.nlink===1n&&(before.mode&0o7777n)===0o600n&&before.size===0n);
    const bytes=Buffer.from(source.source);let at=0;while(at<bytes.length){const n=fs.writeSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}
    const after=fs.fstatSync(fd,{bigint:true});guard(['dev','ino','mode','uid','gid','nlink'].every(key=>after[key]===before[key])&&after.size===BigInt(source.sourceBytes));writtenMark=mark(after);guard(mark(fs.lstatSync(source.file,{bigint:true}))===writtenMark&&JSON.stringify(parents(source.file))===JSON.stringify(lineage));
   }catch{failure=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure=true;}}guard(!failure);
   reason='SOURCE_READBACK_UNAVAILABLE';const row=bounded(source.file,1048576,source.sha256);guard(row.mark===writtenMark&&JSON.stringify(row.lineage)===JSON.stringify(lineage)&&(fs.lstatSync(source.file,{bigint:true}).mode&0o7777n)===0o600n);candidate.rows.push(row);pairedBoundary(candidate);for(const row of candidate.rows)namedCurrent(row);reason='SOURCE_CREATE_UNAVAILABLE';
  }
  for(let at=0;at<2;at++){
   pairedBoundary(candidate);for(const row of candidate.rows)current(row);pairedBoundary(candidate);for(const row of candidate.rows)namedCurrent(row);
   const operation=tool.proposedBuilds[at],file=sources[at+1].file,output=file.slice(0,-2),argv=[...operation.argv.slice(0,-3),file,'-o',output];absent(output);
   reason='COMPILER_BUILD_UNAVAILABLE';dispatchAttemptCount++;const result=spawnSync(operation.executable,argv,{cwd:h+'/prefix/native-probes',env:{TMPDIR:h},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});
   builds.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));reason='BINARY_READBACK_UNAVAILABLE';const binary=bounded(output,2*1024*1024);guard(binary.arm64Header);candidate.rows.push(binary);
  }
  reason='BOUNDARY_CHANGED';pairedFilesCurrent(candidate);record=candidate;
  report={baseA:before.assets.baseA,baseB:before.assets.baseB,hostBase:h,bindings:before.source.bindings,sources:candidate.rows.slice(0,3).map((row,at)=>({kind:pairedKinds[at],file:row.file,sha256:row.digest,mark:row.mark,lineage:row.lineage,templateSha256:pairedPins[at]})),binaries:candidate.rows.slice(3).map((row,at)=>({kind:pairedKinds[at+1],file:row.file,sha256:row.digest,mark:row.mark,lineage:row.lineage}))};
 }catch{/* Static reason and true child summaries only. Partial H is preserved. */}
 const result=pairedAuthorityFalse({outcome:report?'BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:report?'BUILT_NOT_EXECUTED':reason,report,builds,sourceWriteAttempts,fileCreateCount,dispatchAttemptCount,dispatchResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved===true).length});
 if(record)mintedPairedArtifacts.set(result,record);return result;
}
export function verifySealedTypeScriptPairedStageArtifacts(build){
 const record=mintedPairedArtifacts.get(build),unknown=()=>pairedAuthorityFalse({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();
 try{pairedFilesCurrent(record);return pairedAuthorityFalse({outcome:'PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:record.before.assets.baseA,baseB:record.before.assets.baseB,hostBase:record.before.assets.hostBase,bindings:record.before.source.bindings});}
 catch{record.invalid=true;return unknown();}
}
export function sealedTypeScriptPairedStageArtifactsMatchDerivation(build,assetsBuild,source){
 const record=mintedPairedArtifacts.get(build);return arguments.length===3&&!!record&&!record.invalid&&record.assetsBuild===assetsBuild&&record.proposal===source;
}
