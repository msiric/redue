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
import {buildSealedTypeScriptNativeAssets,verifySealedTypeScriptNativeAssetsBuild,sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary} from './sealed-typescript-native-assets-build.mjs';
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
  boundary();guard(verifySealedTypeScriptNativeAssetsBuild(record.hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(record.source);current(record.binary);boundary();
  guard(verifySealedTypeScriptNativeAssetsBuild(record.hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(record.source);current(record.binary);boundary();
  for(const row of [record.source,record.binary])namedCurrent(row);
  return freeze({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:record.initialPair.baseA,baseB:record.initialPair.baseB,hostBase:record.roots[2][0],commands:[],sealed:false,reuseEligible:false});
 }catch{record.invalid=true;return unknown();}
}
