// Fixed engineering build ONLY. Requires two live private brands, stores all
// public code/runtime/binaries under H and never writes either synthetic A/B.
// No helper execution, model, account, policy or serialized-record adoption.
// Parent reads require a trusted/quiescent filesystem; O_NOFOLLOW leaf checks
// are not hostile-ancestor read confinement or a native enforcement proof.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptBaseExchangePair,sealedTypeScriptBaseExchangePairOriginalInputs} from './sealed-typescript-base-exchange-pair.mjs';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptBaseExchangeSource} from './sealed-typescript-base-exchange-source.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal,prepareSealedTypeScriptNativeAssetsProposalForReviewedCI} from './sealed-typescript-native-assets-proposal.mjs';
import {prepareSealedTypeScriptBaseCollectorSource,verifySealedTypeScriptBaseCollectorSource,sealedTypeScriptBaseCollectorSourceMatchesAssets} from './sealed-typescript-base-collector-source.mjs';
import {verifySealedTypeScriptBaseCollectorCopies,sealedTypeScriptBaseCollectorCopiesMatchSource} from './sealed-typescript-base-collector-copies.mjs';
import {buildSealedTypeScriptNativeAssets,buildSealedTypeScriptNativeAssetsForReviewedCI,verifySealedTypeScriptNativeAssetsBuild,observeSealedTypeScriptNativeAssetsBuild,sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary,sealedTypeScriptNativeAssetsBuildOriginalInputs} from './sealed-typescript-native-assets-build.mjs';
import {verifySealedTypeScriptPairedStageSource,sealedTypeScriptPairedStageSourceMatchesDerivation} from './sealed-typescript-paired-stage-source.mjs';
import {verifySealedTypeScriptFixedCampaignCopies,sealedTypeScriptFixedCampaignCopiesMatchDerivation,sealedTypeScriptFixedCampaignCopiesOriginalInputs} from './sealed-typescript-fixed-campaign-copies.mjs';
import {prepareSealedTypeScriptFixedCampaignLauncherSource,verifySealedTypeScriptFixedCampaignLauncherSource} from './sealed-typescript-fixed-campaign-launcher-source.mjs';
import {mark as profileMark,profiling} from '../../src/decision-profile.mjs';
const mintedAssets=new WeakMap();
const activeBaseAssetsObservations=new WeakMap();
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
export function buildSealedTypeScriptBaseExchangeAssets(options){return buildFixedBaseAssets(options,false);}
export function buildSealedTypeScriptBaseExchangeAssetsForReviewedCI(options){if(arguments.length!==1)throw Object.assign(Error('BASE_EXCHANGE_ASSETS_OPTIONS'),{code:'BASE_EXCHANGE_ASSETS_OPTIONS'});return buildFixedBaseAssets(options,true);}
function buildFixedBaseAssets(options,ci){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||!['pair','hostFixture'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))throw Object.assign(Error('BASE_EXCHANGE_ASSETS_OPTIONS'),{code:'BASE_EXCHANGE_ASSETS_OPTIONS'});
 const {pair,hostFixture}=options,builds=[],prepareProposal=ci?prepareSealedTypeScriptNativeAssetsProposalForReviewedCI:prepareSealedTypeScriptNativeAssetsProposal;let reason='PAIR_UNAVAILABLE',report=null,mintedRecord=null,hostDispatchAttempts=0,thirdDispatchAttempts=0;
 try{const initialPair=verifySealedTypeScriptBaseExchangePair(pair);guard(initialPair.outcome==='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED');reason='HOST_UNAVAILABLE';const host=verifySealedTypeScriptSyntheticFixture(hostFixture);guard(host.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&host.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY');
  const base=host.base;guard(/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(base)&&base!==initialPair.baseA&&base!==initialPair.baseB);
  const roots=[initialPair.baseA,initialPair.baseB,base].map(file=>[file,rootIdentity(file)]);guard(new Set(roots.map(([,row])=>row.inode)).size===3);
  const boundary=()=>{guard(JSON.stringify(verifySealedTypeScriptBaseExchangePair(pair))===JSON.stringify(initialPair)&&verifySealedTypeScriptSyntheticFixture(hostFixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');for(const [file,before] of roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));};
  reason='HOST_BUILD_UNAVAILABLE';boundary();hostDispatchAttempts=null;const hostBuild=(ci?buildSealedTypeScriptNativeAssetsForReviewedCI:buildSealedTypeScriptNativeAssets)({fixture:hostFixture});guard(Number.isInteger(hostBuild.dispatchAttemptCount)&&hostBuild.dispatchAttemptCount>=0&&hostBuild.dispatchAttemptCount<=2);hostDispatchAttempts=hostBuild.dispatchAttemptCount;builds.push(...hostBuild.report.builds);guard(hostBuild.outcome==='ASSETS_BUILT_NOT_EXECUTED');
  reason='BOUNDARY_CHANGED';boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');const rendered=prepareSealedTypeScriptBaseExchangeSource(pair),proposal=prepareProposal({fixture:hostFixture});
  const file=base+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel.c',output=file.slice(0,-2);guard(rendered.sourceBytes>0&&rendered.sourceBytes<=65536&&sha(rendered.source)===rendered.sourceSha256);
  fs.writeFileSync(file,rendered.source,{flag:'wx',mode:0o600});const source=bounded(file,65536,rendered.sourceSha256);
  boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(source);
  const operation=proposal.proposedBuilds[1],argv=[...operation.argv.slice(0,-3),file,'-o',output];reason='EXECUTION_UNAVAILABLE';thirdDispatchAttempts++;const result=spawnSync(operation.executable,argv,{cwd:base+'/prefix/native-probes',env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});builds.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));
  reason='OUTPUT_UNAVAILABLE';const binary=bounded(output,2*1024*1024);guard(binary.arm64Header);reason='BOUNDARY_CHANGED';current(source);current(binary);boundary();guard(verifySealedTypeScriptNativeAssetsBuild(hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(source);current(binary);boundary();
  // Later row hashing/boundaries must not hide a changed earlier new file.
  // This is an observed metadata barrier, not atomic hostile-writer protection.
  for(const row of [source,binary])namedCurrent(row);
  mintedRecord={pair,hostFixture,hostBuild,prepareProposal,initialPair,roots,source,binary};
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
 const enclosing=activeBaseAssetsObservations.get(build);if(enclosing){try{enclosing.barrier();return baseAssetsObserved(record);}catch{enclosing.failed=true;record.invalid=true;return unknown();}}
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


function baseAssetsBoundary(record){guard(JSON.stringify(verifySealedTypeScriptBaseExchangePair(record.pair))===JSON.stringify(record.initialPair)&&verifySealedTypeScriptSyntheticFixture(record.hostFixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');for(const[file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));}
function baseAssetsNamedRows(record){for(const row of [record.source,record.binary])namedCurrent(row);}
function baseAssetsObserved(record){return freeze({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:record.initialPair.baseA,baseB:record.initialPair.baseB,hostBase:record.roots[2][0],commands:[],sealed:false,reuseEligible:false});}
// Same private build, one synchronous call only. Full native/base hashing is
// unchanged before enabling nested metadata observations. The live native
// barrier is not a cached success; fixtures, inventories, SDK, rows and ancestry
// remain checked every time. Consumer files must be checked AFTER this closes.
export function observeSealedTypeScriptBaseExchangeAssets(build,inspect){
 const enclosing=activeBaseAssetsObservations.get(build),record=mintedAssets.get(build);if(enclosing){enclosing.failed=true;if(record)record.invalid=true;guard(false);}
 guard(arguments.length===2&&typeof inspect==='function'&&Object.getPrototypeOf(inspect)===Function.prototype&&record&&!record.invalid);
 const operation={failed:false,enabled:false,barrier:null};let active=true;
 operation.barrier=()=>{try{guard(active&&operation.enabled&&!operation.failed&&!record.invalid);baseAssetsBoundary(record);operation.nativeBarrier();baseAssetsNamedRows(record);baseAssetsBoundary(record);operation.nativeBarrier();baseAssetsNamedRows(record);}catch(error){operation.failed=true;record.invalid=true;throw error;}};
 activeBaseAssetsObservations.set(build,operation);
 try{observeSealedTypeScriptNativeAssetsBuild(record.hostBuild,nativeBarrier=>{
   baseAssetsBoundary(record);current(record.source);current(record.binary);baseAssetsBoundary(record);nativeBarrier();
   current(record.source);current(record.binary);baseAssetsBoundary(record);nativeBarrier();baseAssetsNamedRows(record);
   operation.nativeBarrier=nativeBarrier;operation.enabled=true;guard(inspect(operation.barrier)===undefined&&!operation.failed);operation.barrier();operation.enabled=false;
  });baseAssetsBoundary(record);baseAssetsNamedRows(record);guard(!operation.failed&&!record.invalid);
 }catch(error){operation.failed=true;record.invalid=true;throw error;}finally{active=false;operation.enabled=false;operation.nativeBarrier=null;activeBaseAssetsObservations.delete(build);}
}


// Same fixed proposal definition selected by the ORIGINAL asset mint, bound
// to its ORIGINAL pair only. Public labels cannot choose a compiler profile.
// Selection is NOT asset currency: paired-source retains its independent full
// before/after currency checks. The returned proposal says NOT_VERIFIED.
export function prepareSealedTypeScriptBaseExchangeOriginalPairAssetsProposal(assetsBuild,pair){
 const original=mintedAssets.get(assetsBuild);
 if(arguments.length!==2||!original||original.invalid||original.pair!==pair)return null;
 try{return original.prepareProposal({fixture:original.pair.fixture});
 }catch{original.invalid=true;return null;}
}

// Fixed pre-build, read-only selection from the ORIGINAL live asset mint. This
// exports data, not a tool-adoption capability or continuing build authority.
// Full original native hashes precede the fixed proposal; named barriers close
// that same synchronous observation. SDK currentness/closure labels stay honest.
const buildToolchainData=fields=>freeze({schema:1,scope:'ORIGINAL_BASE_EXCHANGE_BUILD_TOOLCHAIN_DATA_ONLY',...fields,
 commands:[],executionAuthority:'NONE',recordAdoptionAuthority:false,compilerCheckExecutions:0,helperExecutions:0,
 nativeAgentLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
export function prepareSealedTypeScriptBaseExchangeBuildToolchain(assetsBuild){
 const original=mintedAssets.get(assetsBuild);
 if(arguments.length!==1||!original||original.invalid)return buildToolchainData({outcome:'UNKNOWN'});
 try{let selected;
  observeSealedTypeScriptNativeAssetsBuild(original.hostBuild,nativeBarrier=>{
   baseAssetsBoundary(original);current(original.source);current(original.binary);nativeBarrier();baseAssetsNamedRows(original);
   const proposal=original.prepareProposal({fixture:original.hostFixture});
   guard(proposal.scope==='FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY'&&proposal.base===original.roots[2][0]&&proposal.proposedBuilds.length===2);
   selected={base:proposal.base,proposedBuilds:proposal.proposedBuilds,toolchain:proposal.toolchain};
   baseAssetsBoundary(original);current(original.source);current(original.binary);nativeBarrier();baseAssetsNamedRows(original);
  });
  baseAssetsBoundary(original);baseAssetsNamedRows(original);
  return buildToolchainData({outcome:'BUILD_TOOLCHAIN_ORIGINAL_INPUTS_CURRENTLY_OBSERVED_DATA_ONLY',...selected});
 }catch{original.invalid=true;return buildToolchainData({outcome:'UNKNOWN'});}
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
  const toolProposal=original.prepareProposal({fixture:original.hostFixture});
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

// Exact original host fixture identity only; no currency or permission grant.
export function sealedTypeScriptBaseExchangeAssetsMatchHostFixture(assets,hostFixture){
 const record=mintedAssets.get(assets);return arguments.length===2&&!!record&&!record.invalid&&record.hostFixture===hostFixture;
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
 let assets,source;
 const inspect=()=>{assets=verifySealedTypeScriptBaseExchangeAssets(record.assetsBuild);source=verifySealedTypeScriptPairedStageSource(record.proposal);};
 // A fresh independent group hashes the original rows once in the existing
 // synchronous scope. Inside an ALREADY owned group, both verifiers still
 // demand its live barriers; map presence alone grants no currency. Never
 // open a nested public observation or retain this scope across writes/builds.
 // These remain trusted/quiescent endpoints, not hostile-writer protection.
 if(activeBaseAssetsObservations.has(record.assetsBuild))inspect();
 else observeSealedTypeScriptBaseExchangeAssets(record.assetsBuild,inspect);
 // No result escapes an owned observation before its closing barriers.
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
  const tool=original.prepareProposal({fixture:original.hostFixture});guard(tool.scope==='FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY'&&tool.base===h&&tool.bindings.node===before.source.node&&tool.proposedBuilds.length===2);
  const flags=['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0','-isysroot',tool.toolchain.sdk];
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


// Fixed campaign-specific launcher, not adoption of the old base launcher. The
// original private H toolchain and exact current copies remain prerequisites.
// File/namespace guards require trusted quiescent parents, not hostile-writer
// confinement; neither building nor currentness establishes native enforcement.
const mintedCampaignLaunchers=new WeakMap();
const fixedCampaignLauncherByAssets=new WeakMap();
const campaignLauncherAuthority=fields=>freeze({schema:1,scope:'FIXED_CAMPAIGN_LAUNCHER_BUILD_DATA_ONLY',...fields,commands:[],recordAdoptionAuthority:false,compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
function campaignLauncherDependencies(record){
 const original=mintedAssets.get(record.assetsBuild);
 guard(original&&!original.invalid&&sealedTypeScriptPairedStageSourceMatchesDerivation(record.pairedSource,original.pair,record.assetsBuild)&&sealedTypeScriptPairedStageArtifactsMatchDerivation(record.pairedArtifacts,record.assetsBuild,record.pairedSource)&&sealedTypeScriptFixedCampaignCopiesMatchDerivation(record.copies,record.assetsBuild,record.pairedArtifacts,record.pairedSource));
 let assets,source,artifacts,template=null;observeSealedTypeScriptBaseExchangeAssets(record.assetsBuild,()=>{assets=verifySealedTypeScriptBaseExchangeAssets(record.assetsBuild);source=verifySealedTypeScriptPairedStageSource(record.pairedSource);artifacts=verifySealedTypeScriptPairedStageArtifacts(record.pairedArtifacts);
 guard(assets.scope==='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY'&&assets.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'&&source.scope==='DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY'&&source.outcome==='PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&artifacts.scope==='PAIRED_STAGE_ENGINEERING_ARTIFACTS_DATA_ONLY'&&artifacts.outcome==='PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED');
 guard(['baseA','baseB','hostBase'].every(k=>assets[k]===source[k]&&assets[k]===artifacts[k])&&JSON.stringify(source.bindings)===JSON.stringify(artifacts.bindings));
 if(record.templateSource){guard(sealedTypeScriptBaseCollectorSourceMatchesAssets(record.templateSource,record.assetsBuild));template=verifySealedTypeScriptBaseCollectorSource(record.templateSource);guard(template.scope==='DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY'&&template.outcome==='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&['baseA','baseB','hostBase'].every(k=>assets[k]===template[k]));}
 });
 // A separate copies scope closes before this consumer is accepted. No nested
 // consumer result or implicit observation joining can outlive an outer scope.
 const copies=verifySealedTypeScriptFixedCampaignCopies(record.copies);guard(copies.scope==='FIXED_CAMPAIGN_COPIES_DATA_ONLY'&&copies.outcome==='CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'&&['baseA','baseB','hostBase'].every(k=>assets[k]===copies[k]));
 return{assets,source,artifacts,copies,template};
}
function campaignLauncherBoundary(record){guard(JSON.stringify(campaignLauncherDependencies(record))===JSON.stringify(record.before));if(record.launcherSourceProposal){const observed=verifySealedTypeScriptFixedCampaignLauncherSource(record.launcherSourceProposal);guard(observed.outcome==='CAMPAIGN_LAUNCHER_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&observed.version==='campaign-stdio-only-setexec@1'&&observed.sourceSha256===record.launcherSourceProposal.sourceSha256&&observed.templateSha256===record.launcherSourceProposal.templateSha256);}for(const[file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));}
function campaignLauncherFilesCurrent(record){
 campaignLauncherBoundary(record);current(record.source);current(record.binary);campaignLauncherBoundary(record);
 current(record.source);current(record.binary);campaignLauncherBoundary(record);
 for(const[file,before]of record.roots)guard(JSON.stringify(rootIdentity(file))===JSON.stringify(before));
 // All original/template/copy guards finish before these final new-row checks.
 for(const row of [record.source,record.binary])namedCurrent(row);
}
export function buildSealedTypeScriptFixedCampaignLauncher(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==4||!['assetsBuild','pairedSource','pairedArtifacts','copies'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Object.assign(Error('CAMPAIGN_LAUNCHER_BUILD_OPTIONS'),{code:'CAMPAIGN_LAUNCHER_BUILD_OPTIONS'});
 const {assetsBuild,pairedSource,pairedArtifacts,copies}=options,builds=[];let reason='PRIVATE_DERIVATION_UNAVAILABLE',record=null,report=null,dispatchAttemptCount=0,sourceWriteAttempts=0,fileCreateCount=0,fileSyncCount=0,sourceWriteCompleted=false;
 try{
  const candidate={assetsBuild,pairedSource,pairedArtifacts,copies},initial=campaignLauncherDependencies(candidate),h=initial.assets.hostBase,original=mintedAssets.get(assetsBuild);
  guard(typeof process.getuid==='function'&&process.getuid()>0&&['O_RDONLY','O_WRONLY','O_CREAT','O_EXCL','O_NOFOLLOW','O_NONBLOCK'].every(k=>fs.constants[k]!==undefined)&&[initial.assets.baseA,initial.assets.baseB,h].every(v=>/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(v))&&new Set([initial.assets.baseA,initial.assets.baseB,h]).size===3);
  reason='LAUNCHER_BINDINGS_UNAVAILABLE';const node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=h+'/prefix/native-probes/paired-stage-campaign.mjs',output=h+'/prefix/native-probes/paired-stage-campaign-launch',file=output+'.c';
  guard(initial.copies.node===node&&initial.copies.entry===entry&&initial.copies.cwd===initial.assets.baseA+'/Checkout 空间/.sealed-native-canaries'&&/^[a-f0-9]{64}$/.test(initial.copies.campaignSha256));
  // Retain the unchanged collector source as a current private original
  // dependency. Its retired entry/output are never built or selected here.
  const templateSource=prepareSealedTypeScriptBaseCollectorSource(assetsBuild);candidate.templateSource=templateSource;const before=campaignLauncherDependencies(candidate),template=templateSource.proposedLauncher,old=before.template.bindings;
  guard(template.disabled===true&&template.templateSha256==='11a1092b2c94e723833e4b3cf2188b4db886f86adccbb3f962ce16ba019b4068'&&template.file===h+'/prefix/native-probes/base-exchange-collect-launch.c'&&template.output===h+'/prefix/native-probes/base-exchange-collect-launch'&&old.node===node&&old.entry===h+'/prefix/native-probes/base-exchange-collect.mjs'&&old.launcher===template.output&&old.launcherSource===template.file&&old.launcherSourceSha256===template.sha256&&old.nodeSha256==='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'&&typeof template.source==='string'&&Number.isInteger(template.sourceBytes)&&template.sourceBytes>0&&template.sourceBytes<=65536&&Buffer.byteLength(template.source)===template.sourceBytes&&Buffer.from(template.source).toString('utf8')===template.source&&sha(template.source)===template.sha256);
  guard(template.source.split(old.entry).length===2&&template.source.split(old.launcher).length===2);
  // Campaign-only source/SDK derivation; the old collector template remains
  // unchanged and current as an original private dependency, never selected.
  const launcherSourceProposal=prepareSealedTypeScriptFixedCampaignLauncherSource({hostBase:h});
  guard(launcherSourceProposal.scope==='DISABLED_FIXED_CAMPAIGN_LAUNCHER_SOURCE_DATA_ONLY'&&launcherSourceProposal.disabled===true&&launcherSourceProposal.version==='campaign-stdio-only-setexec@1'&&launcherSourceProposal.bindings.node===node&&launcherSourceProposal.bindings.entry===entry&&launcherSourceProposal.bindings.launcher===output&&launcherSourceProposal.templateSha256==='7bef186e33e3d4ed3c2e7588632e3d808c4fba11a9949abe7324031a719ff90c');
  const text=launcherSourceProposal.source,sourceSha256=sha(text),sourceBytes=Buffer.byteLength(text);guard(sourceSha256===launcherSourceProposal.sourceSha256&&sourceBytes===launcherSourceProposal.sourceBytes&&sourceBytes>0&&sourceBytes<=65536&&!/__REVIEWED_[A-Z_]+__/.test(text));candidate.launcherSourceProposal=launcherSourceProposal;
  const roots=[initial.assets.baseA,initial.assets.baseB,h,h+'/prefix',h+'/prefix/native-probes'].map(at=>[at,rootIdentity(at)]);Object.assign(candidate,{before,roots});campaignLauncherBoundary(candidate);
  const tool=original.prepareProposal({fixture:original.hostFixture}),flags=['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0','-isysroot',tool.toolchain.sdk];
  guard(tool.scope==='FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY'&&tool.base===h&&tool.bindings.node===node&&tool.proposedBuilds.length===2);for(let at=0;at<2;at++){const op=tool.proposedBuilds[at],oldFile=h+'/prefix/native-probes/'+['sealed-typescript-map-sentinel.c','sealed-typescript-exchange-sentinel.c'][at];guard(op.disabled===true&&op.executable==='/Library/Developer/CommandLineTools/usr/bin/clang'&&JSON.stringify(op.argv)===JSON.stringify([...flags,oldFile,'-o',oldFile.slice(0,-2)]));}
  campaignLauncherBoundary(candidate);absent(file);absent(output);reason='SOURCE_CREATE_UNAVAILABLE';const lineage=parents(file);let fd,writtenMark,failed=false;
  try{sourceWriteAttempts++;fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);fileCreateCount++;const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);const bytes=Buffer.from(text);let at=0;while(at<bytes.length){const n=fs.writeSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}fs.fsyncSync(fd);fileSyncCount++;const s2=fs.fstatSync(fd,{bigint:true});guard(['dev','ino','mode','uid','gid','nlink'].every(k=>s2[k]===s[k])&&s2.size===BigInt(sourceBytes));writtenMark=mark(s2);guard(mark(fs.lstatSync(file,{bigint:true}))===writtenMark&&JSON.stringify(parents(file))===JSON.stringify(lineage));}catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);sourceWriteCompleted=true;
  campaignLauncherBoundary(candidate);reason='SOURCE_READBACK_UNAVAILABLE';const newSource=bounded(file,65536,sourceSha256);guard(newSource.mark===writtenMark&&JSON.stringify(newSource.lineage)===JSON.stringify(lineage)&&(fs.lstatSync(file,{bigint:true}).mode&0o7777n)===0o600n);campaignLauncherBoundary(candidate);current(newSource);campaignLauncherBoundary(candidate);absent(output);namedCurrent(newSource);
  reason='COMPILER_BUILD_UNAVAILABLE';dispatchAttemptCount++;const result=spawnSync(tool.proposedBuilds[1].executable,[...flags,file,'-o',output],{cwd:h+'/prefix/native-probes',env:{TMPDIR:h},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});builds.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));campaignLauncherBoundary(candidate);
  reason='BINARY_READBACK_UNAVAILABLE';const binary=bounded(output,2*1024*1024);guard(binary.arm64Header);Object.assign(candidate,{source:newSource,binary});reason='BOUNDARY_CHANGED';campaignLauncherFilesCurrent(candidate);
  record=candidate;report={baseA:initial.assets.baseA,baseB:initial.assets.baseB,hostBase:h,bindings:{baseA:initial.assets.baseA,baseB:initial.assets.baseB,hostBase:h,node,entry,cwd:initial.copies.cwd,campaignSha256:initial.copies.campaignSha256,launcher:output,launcherSource:file,launcherSourceSha256:sourceSha256,nodeSha256:old.nodeSha256},source:{file,sha256:newSource.digest,mark:newSource.mark,lineage:newSource.lineage},binary:{file:output,sha256:binary.digest,mark:binary.mark,lineage:binary.lineage},templateSha256:launcherSourceProposal.templateSha256,baseCollectorTemplateSha256:template.templateSha256,descriptorBoundaryVersion:launcherSourceProposal.version,descriptorScope:'C_TO_NODE_NONSTDIO_ONLY',stdioOwnership:'NOT_ESTABLISHED',devNullMetadataPermission:'NOT_OBSERVED',requiredSdkHeaderPins:launcherSourceProposal.requiredSdkHeaderPins,completeSdkClosure:'NOT_ESTABLISHED',namespaceCrashRecoveryEstablished:false};
 }catch{/* Static phases and real returned process facts only; partial H stays. */}
 const result=campaignLauncherAuthority({outcome:report?'CAMPAIGN_LAUNCHER_BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:report?'BUILT_NOT_EXECUTED':reason,report,builds,sourceWriteAttempts,fileCreateCount,fileSyncCount,sourceWriteCompleted,dispatchAttemptCount,dispatchResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved===true).length});if(record){mintedCampaignLaunchers.set(result,record);fixedCampaignLauncherByAssets.set(assetsBuild,result);}return result;
}
export function verifySealedTypeScriptFixedCampaignLauncherBuild(build){const record=mintedCampaignLaunchers.get(build),unknown=()=>campaignLauncherAuthority({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();try{campaignLauncherFilesCurrent(record);return campaignLauncherAuthority({outcome:'CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:record.before.assets.baseA,baseB:record.before.assets.baseB,hostBase:record.before.assets.hostBase,bindings:build.report.bindings,launcherSha256:record.binary.digest,launcherSourceSha256:record.source.digest});}catch{record.invalid=true;return unknown();}}
export function sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation(build,assetsBuild,pairedSource,pairedArtifacts,copies){const record=mintedCampaignLaunchers.get(build);return arguments.length===5&&!!record&&!record.invalid&&record.assetsBuild===assetsBuild&&record.pairedSource===pairedSource&&record.pairedArtifacts===pairedArtifacts&&record.copies===copies;}

// DISABLED, fixed four-actor canary projection. This is deliberately distinct
// from every full original fixture/build verifier above. Original snapshots are
// selected before actors; END never adopts a new baseline or repairs an owner.
// Concrete controls: base/exchange sentinel control() swaps/restores workspace
// exchange-control-a/b (directory ctime changes); native-sentinel allowedWrite
// changes workspace/write-canary.txt and creates stage-parent-alias; map-sentinel
// workspace_control() changes/restores workspace/map-canary.txt. Those workspace
// children, entry membership, size/nlink/mtime/ctime are excluded. Workspace's
// own dev/ino/mode/uid/gid and FULL original A/Checkout/B directory marks remain.
// Exact A/Checkout/B inventory is TRUSTED_PRE_NATIVE_ONLY; these later metadata
// guards do NOT establish root inventory/membership/input continuity. This
// canary-only design requires the separately reviewed fixed-actor sources plus
// trusted original preparation, never arbitrary actors or compiler applicability.
// Protected parent/stage inventory/full markers and fixed H code ARE retained.
// stage-alias.txt (hardlink destination) must stay absent. The ONE optional END
// symlink has a fixed target and must resolve the original protected identity.
// This claims no H-wide closure, compiler namespace, atomic hostile-writer
// confinement, actor/session closure, interval, native enforcement or origin.
const mintedProtectedProjections=new WeakMap(),protectedProjectionOwners=new WeakSet();
const protectedProjectionVersion='fixed-canary-original-input-projection@3';
const protectedComparatorPin='af57959d2524d976971234585236f4fecd680e3e47520dfec9f35252ade77411';
const protectedMarker='REDUE_SEALED_SYNTHETIC_CANARY\n';
const projectionAuthority=fields=>freeze({schema:1,scope:'DISABLED_FIXED_CANARY_PROTECTED_INPUT_PROJECTION_DATA_ONLY',inputScope:'DIAGNOSTIC_FIXED_CANARY_ONLY',...fields,disabled:true,runnable:false,commands:[],executionAuthority:'NONE',recordAdoptionAuthority:false,compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,rootInventory:'TRUSTED_PRE_NATIVE_ONLY',rootMembershipContinuity:'NOT_ESTABLISHED',inputContinuity:'NOT_ESTABLISHED',fixedActorSourceClosure:'REQUIRED_SEPARATE_PREMISE',futureActorChanges:'REQUIRE_NEW_REVIEW',interval:'NOT_ESTABLISHED',allActorsGone:'NOT_ESTABLISHED',compilerOrigin:'NOT_ESTABLISHED',compilerSeal:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
function protectedOriginalIngredients(inputs){
 const {assetsBuild,pairedSource,pairedArtifacts,copies}=inputs,assets=mintedAssets.get(assetsBuild),paired=mintedPairedArtifacts.get(pairedArtifacts),launcherBuild=fixedCampaignLauncherByAssets.get(assetsBuild),launcher=mintedCampaignLaunchers.get(launcherBuild);
 // All four private derivations are rejected BEFORE any public-path I/O or
 // public capability property access. These fixed queries do no filesystem IO.
 guard(assets&&!assets.invalid&&paired&&!paired.invalid&&launcher&&!launcher.invalid&&launcher.assetsBuild===assetsBuild&&launcher.pairedSource===pairedSource&&launcher.pairedArtifacts===pairedArtifacts&&launcher.copies===copies&&paired.assetsBuild===assetsBuild&&paired.proposal===pairedSource&&paired.pair===assets.pair&&sealedTypeScriptPairedStageSourceMatchesDerivation(pairedSource,assets.pair,assetsBuild)&&sealedTypeScriptFixedCampaignCopiesMatchDerivation(copies,assetsBuild,pairedArtifacts,pairedSource));
 const pair=sealedTypeScriptBaseExchangePairOriginalInputs(assets.pair),native=sealedTypeScriptNativeAssetsBuildOriginalInputs(assets.hostBuild),copied=sealedTypeScriptFixedCampaignCopiesOriginalInputs(copies,assetsBuild,pairedArtifacts,pairedSource);
 guard(pair&&native&&copied&&native.base===assets.roots[2][0]&&pair.baseA===assets.initialPair.baseA&&pair.baseB===assets.initialPair.baseB);
 return{assets,paired,pair,native,copied,launcher,launcherBuild};
}
function projectedOriginalFacts(parts){
 const {assets,paired,pair,native,copied,launcher}=parts,h=native.base;
 guard(new Set([pair.baseA,pair.baseB,h]).size===3&&[pair.baseA,pair.baseB,h].every(v=>/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(v))&&pair.files.length===6&&native.files.length===6&&paired.rows.length===5&&copied.files.length===6);
 const own=row=>({file:row.file,mark:row.mark,digest:row.digest,limit:row.limit,lineage:row.lineage.map(row=>[...row])});
 const files=[...pair.files.map(row=>({...row,digest:sha(protectedMarker),limit:Buffer.byteLength(protectedMarker)})),...native.files.map(own),own(assets.source),own(assets.binary),...paired.rows.map(own),...copied.files.map(own),own(launcher.source),own(launcher.binary)];
 const directories=new Map();
 const add=row=>{const old=directories.get(row.file);if(old){guard(old.mark.split(':').slice(0,5).join(':')===row.mark.split(':').slice(0,5).join(':'));if(row.full)directories.set(row.file,{file:row.file,mark:row.mark,full:true});}else directories.set(row.file,{file:row.file,mark:row.mark,full:row.full});};
 for(const row of [...pair.directories,...native.directories,...copied.directories])add(row);
 for(const row of [...files,...copied.directories])for(const [file,mark]of row.lineage??[])add({file,mark,full:false});
 const inodes=new Set();for(const row of [...directories.values(),...files]){const inode=row.mark.split(':').slice(0,2).join(':');guard(!inodes.has(inode));inodes.add(inode);}
 guard(files.slice(6).every(row=>row.file.startsWith(h+'/'))&&new Set(files.map(row=>row.file)).size===files.length);
 const trustedPreNativeMembership=pair.membership.filter(([file])=>[pair.baseA,pair.baseA+'/Checkout 空间',pair.baseB].includes(file)),protectedMembership=pair.membership.filter(([file])=>[pair.baseA+'/sealed-inputs',pair.baseA+'/sealed-inputs/redue-materialization-Canary'].includes(file));
 guard(trustedPreNativeMembership.length===3&&protectedMembership.length===2);
 return freeze({version:protectedProjectionVersion,baseA:pair.baseA,baseB:pair.baseB,hostBase:h,directories:[...directories.values()],files,trustedPreNativeMembership,protectedMembership,absent:pair.absent,caseAliases:pair.caseAliases,workspaceAlias:pair.workspaceAlias});
}
// Self-contained reviewed implementation. Its only lexical dependencies are
// fixed trusted Node builtins fs/createHash/Buffer. The generated module closes
// over original constants; no caller manifest/path/callback/expected hash API.
function compareFixedOriginalProtectedInputs(original,phase){
 const fields=['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'],mark=s=>fields.map(k=>String(s[k])).join(':'),identity=s=>fields.slice(0,5).map(k=>String(s[k])).join(':'),check=value=>{if(!value)throw Error('FIXED_ORIGINAL_INPUT_UNKNOWN');};
 const absent=file=>{try{fs.lstatSync(file,{bigint:true});}catch(error){if(error?.code==='ENOENT')return;throw error;}check(false);};
 const directory=row=>{const s=fs.lstatSync(row.file,{bigint:true});check(s.isDirectory()&&!s.isSymbolicLink()&&fs.realpathSync(row.file)===row.file&&(row.full?mark(s):identity(s))===row.mark);};
 const named=row=>{const s=fs.lstatSync(row.file,{bigint:true});check(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1n&&mark(s)===row.mark&&fs.realpathSync(row.file)===row.file);};
 const membership=([file,expected])=>{let dir,failed=false;try{dir=fs.opendirSync(file);const found=[];for(;;){const entry=dir.readSync();if(!entry)break;check(found.length<expected.length);found.push(entry.name);}check(JSON.stringify(found.sort())===JSON.stringify(expected));}catch{failed=true;}finally{if(dir!==undefined)try{dir.closeSync();}catch{failed=true;}}check(!failed);};
 const aliases=()=>{for(const row of original.caseAliases){if(!row.present){absent(row.file);continue;}const s=fs.lstatSync(row.file,{bigint:true});check(!s.isSymbolicLink()&&(row.directory?s.isDirectory():s.isFile())&&mark(s)===row.mark&&typeof fs.realpathSync.native==='function'&&fs.realpathSync.native(row.file)===row.target);}
  const alias=original.workspaceAlias;if(phase==='BEGIN'){absent(alias.file);return;}let s;try{s=fs.lstatSync(alias.file,{bigint:true});}catch(error){if(error?.code==='ENOENT')return;throw error;}
  check(s.isSymbolicLink()&&s.uid===BigInt(alias.mark.split(':')[3])&&s.nlink===1n&&fs.readlinkSync(alias.file)===alias.target&&fs.realpathSync(alias.file)===alias.target);
  const target=fs.lstatSync(alias.file+'/redue-materialization-Canary/write-canary.txt',{bigint:true});check(target.isFile()&&!target.isSymbolicLink()&&mark(target)===alias.mark);
 };
 const metadata=()=>{for(const row of original.directories)directory(row);for(const row of original.files)named(row);for(const row of original.protectedMembership)membership(row);for(const file of original.absent)absent(file);aliases();};
 check(phase==='BEGIN'||phase==='END');check(fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined);metadata();
 for(const row of original.files){named(row);let fd,failed=false;try{const expected=row.mark.split(':'),size=BigInt(expected[6]);check(size>0n&&size<=BigInt(row.limit));fd=fs.openSync(row.file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);check(mark(fs.fstatSync(fd,{bigint:true}))===row.mark);
   const hash=createHash('sha256'),bytes=Buffer.alloc(65536);let at=0;while(at<Number(size)){const asked=Math.min(bytes.length,Number(size)-at),n=fs.readSync(fd,bytes,0,asked,at);check(Number.isInteger(n)&&n>0&&n<=asked);hash.update(bytes.subarray(0,n));at+=n;}check(hash.digest('hex')===row.digest&&mark(fs.fstatSync(fd,{bigint:true}))===row.mark);
  }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}check(!failed);named(row);
 }metadata();return true;
}
function protectedProjectionSource(original){
 const implementation=Function.prototype.toString.call(compareFixedOriginalProtectedInputs),implementationSha256=sha(implementation);
 guard(implementationSha256===protectedComparatorPin);
 const source=`// DISABLED diagnostic fixed canary only; no actor or execution route.\n// A/Checkout/B inventory is TRUSTED_PRE_NATIVE_ONLY. Full original marks and\n// fixed child identities do not establish root membership/input continuity,\n// CURRENT or compiler sealing. Fixed actor sources and trusted preparation\n// remain separate premises; future actors require a new scope review.\nimport fs from 'node:fs';\nimport {createHash} from 'node:crypto';\nconst freeze=${Function.prototype.toString.call(freeze)},original=freeze(${JSON.stringify(original)}),compare=${implementation};\nlet began=false,ended=false,failed=false;\nexport const fixedCanaryProtectedInputs=Object.freeze({begin(){if(began||ended||failed){failed=true;return false;}began=true;try{return compare(original,'BEGIN');}catch{failed=true;return false;}},end(){if(!began||ended||failed){failed=true;return false;}ended=true;try{return compare(original,'END');}catch{failed=true;return false;}}});\n`;
 return{source,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source),implementationSha256};
}
export function prepareSealedTypeScriptFixedCanaryProtectedInputProjection(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==4||!['assetsBuild','pairedSource','pairedArtifacts','copies'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Object.assign(Error('PROTECTED_INPUT_PROJECTION_OPTIONS'),{code:'PROTECTED_INPUT_PROJECTION_OPTIONS'});
 const inputs={assetsBuild:options.assetsBuild,pairedSource:options.pairedSource,pairedArtifacts:options.pairedArtifacts,copies:options.copies};
 try{const parts=protectedOriginalIngredients(inputs);guard(!protectedProjectionOwners.has(inputs.assetsBuild));
  // One original mint attempt per owner. An observed failure cannot be hidden
  // by another projection, restored bytes/timestamps or a fresh public report.
  protectedProjectionOwners.add(inputs.assetsBuild);
  const before=campaignLauncherDependencies(inputs);guard(before.assets.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'&&verifySealedTypeScriptFixedCampaignLauncherBuild(parts.launcherBuild).outcome==='CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');
  const original=projectedOriginalFacts(parts);compareFixedOriginalProtectedInputs(original,'BEGIN');
  const rendered=protectedProjectionSource(original);guard(rendered.sourceBytes>0&&rendered.sourceBytes<=131072&&sha(rendered.source)===rendered.sourceSha256);
  protectedOriginalIngredients(inputs);compareFixedOriginalProtectedInputs(original,'BEGIN');
  const result=projectionAuthority({outcome:'ORIGINAL_PROTECTED_INPUT_PROJECTION_PREPARED',version:protectedProjectionVersion,projectionSha256:sha(JSON.stringify(original)),...rendered,caseAliasControl:original.caseAliases.every(row=>row.present)?'ORIGINAL_FIXED_ALIAS_MATCHES':'UNSUPPORTED_ORIGINAL_CASE_ALIAS_ABSENCE',hostDirectoryClosure:'NOT_ESTABLISHED',nativeReadView:'ALL_FIXED_H_SOURCE_CONTENT_READ_AUTHORITY_NOT_ESTABLISHED',requiredComparatorOperations:['FIXED_PROTECTED_PARENT_AND_STAGE_MEMBERSHIP_READS','FIXED_ORIGINAL_H_CODE_SOURCE_RUNTIME_BINARY_CONTENT_READS','FULL_ORIGINAL_A_CHECKOUT_B_AND_FIXED_ANCESTRY_METADATA_AND_ALIAS_READS'],blockers:['CURRENT_NATIVE_READ_VIEW_DOES_NOT_ADMIT_ALL_FIXED_H_SOURCE_READS','ENCLOSING_ACTOR_SESSION_AND_CANCELLATION_CLOSURE_NOT_ESTABLISHED','COMPILER_NAMESPACE_AND_FRESH_PRODUCER_BINDINGS_NOT_ESTABLISHED']});
  mintedProtectedProjections.set(result,{inputs,original,sourceSha256:rendered.sourceSha256,implementationSha256:rendered.implementationSha256});return result;
 }catch{return projectionAuthority({outcome:'UNKNOWN',version:protectedProjectionVersion});}
}
export function verifySealedTypeScriptFixedCanaryProtectedInputProjection(projection){
 const record=mintedProtectedProjections.get(projection),unknown=()=>projectionAuthority({outcome:'UNKNOWN',version:protectedProjectionVersion});if(arguments.length!==1||!record||record.invalid)return unknown();
 try{protectedOriginalIngredients(record.inputs);guard(sha(Function.prototype.toString.call(compareFixedOriginalProtectedInputs))===protectedComparatorPin&&record.implementationSha256===protectedComparatorPin&&sha(projection.source)===record.sourceSha256);compareFixedOriginalProtectedInputs(record.original,'END');protectedOriginalIngredients(record.inputs);
  return projectionAuthority({outcome:'FIXED_CANARY_ORIGINAL_INPUT_GUARDS_OBSERVED',version:protectedProjectionVersion,projectionSha256:sha(JSON.stringify(record.original)),sourceSha256:record.sourceSha256});
 }catch{record.invalid=true;return unknown();}
}

// Fixed ORIGINAL nonsecret H code/runtime/source names, selected only by the
// live projection owner. This is not currency, a read grant, or a manifest API.
export function sealedTypeScriptFixedCanaryProtectedInputProjectionHCodeReadLeaves(projection){
 const record=mintedProtectedProjections.get(projection),unknown=()=>projectionAuthority({outcome:'UNKNOWN',version:protectedProjectionVersion,currency:'NOT_CHECKED'});
 if(arguments.length!==1||!record||record.invalid)return unknown();
 const readLeaves=record.original.files.slice(6).map(row=>row.file);
 // Original private facts contain exactly six stage canaries followed by these
 // 21 distinct H leaves. No caller-selected name, subset or parent is accepted.
 if(record.original.version!==protectedProjectionVersion||readLeaves.length!==21||new Set(readLeaves).size!==21||!readLeaves.every(file=>file.startsWith(record.original.hostBase+'/')))return unknown();
 return projectionAuthority({outcome:'FIXED_ORIGINAL_H_CODE_READ_LEAVES_DATA_ONLY',version:protectedProjectionVersion,hostBase:record.original.hostBase,readLeaves,currency:'NOT_CHECKED'});
}

// Private identity linkage only. Callers must separately verify currency;
// this neither observes files nor renews/adopts projection or input authority.
export function sealedTypeScriptFixedCanaryProtectedInputProjectionMatchesDerivation(projection,assetsBuild,pairedSource,pairedArtifacts,copies){
 const record=mintedProtectedProjections.get(projection);
 return arguments.length===5&&!!record&&!record.invalid&&record.inputs.assetsBuild===assetsBuild&&record.inputs.pairedSource===pairedSource&&record.inputs.pairedArtifacts===pairedArtifacts&&record.inputs.copies===copies;
}
