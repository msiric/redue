// Fixed reviewed engineering build for a LIVE privately minted fixture only.
// No native helper is executed; success is compiled-assets data, never PASS,
// sandbox, sealing or reuse authority. Partial owned artifacts are retained.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal} from './sealed-typescript-native-assets-proposal.mjs';
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

const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function buildSealedTypeScriptNativeAssets(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'fixture')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'fixture'),'value'))throw Object.assign(Error('BUILD_OPTIONS'),{code:'BUILD_OPTIONS'});
 const {fixture}=options;
 const observations=[];let finished=false,ownerReport={schema:1,scope:'LOCAL_SYNTHETIC_ASSETS_BUILD_UNKNOWN',base:null,builds:observations,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false};
 try{
  const observed=verifySealedTypeScriptSyntheticFixture(fixture);guard(observed.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&observed.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'&&observed.receiverBasePolicyMatch===true);
  ownerReport.base=fixture.base;
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  const node=path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node');guard(process.execPath===node);
  const runtime=bounded(node,process.getuid(),128*1024*1024,'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc');
  const proposal=prepareSealedTypeScriptNativeAssetsProposal({fixture}),base=proposal.base,baseIdentity=ownedDirectory(base),tool=proposal.toolchain;
  const compiler=bounded(proposal.proposedBuilds[0].executable,0,128*1024*1024,tool.clangSha256);
  const linker=bounded('/Library/Developer/CommandLineTools/usr/bin/ld',0,16*1024*1024,'374d9f0713bce2c8a9e1e82bde51615d5433516a10d99b63107eb6ee70542e4c');
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
   const result=spawnSync(operation.executable,operation.argv,{cwd:base+'/prefix/native-probes',env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});
   observations.push(sealedAssetsBuildProcessSummary(result));guard(sealedAssetsBuildCompleted(result));const output=operation.argv.at(-1);const binary=bounded(output,process.getuid(),2*1024*1024);
   guard(binary.arm64Header);current(binary);artifacts.push(binary);
  }
  for(const row of [runtime,compiler,linker,...headers,...sources,copied,...artifacts])current(row);guard(verifySealedTypeScriptSyntheticFixture(fixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&ownedDirectory(base)===baseIdentity&&identities.every(([file,before])=>ownedDirectory(file)===before));
  const report={schema:1,scope:'LOCAL_SYNTHETIC_ASSETS_BUILT_NOT_EXECUTED',base,baseIdentity,sources:sources.map(row=>({file:row.file,sha256:row.digest})),binaries:artifacts.map(row=>({file:row.file,sha256:row.digest})),nodeSha256:copied.digest,builds:observations,templateSha256:proposal.sources.map(row=>row.templateSha256),fixtureCurrent:true,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false};
  ownerReport=report;
  finished=true;
 }catch{/* Static UNKNOWN report retains partial build observations, no raw error. */}
 return freeze({schema:1,outcome:finished?'ASSETS_BUILT_NOT_EXECUTED':'UNKNOWN',report:ownerReport,commands:[],recordAdoptionAuthority:false,compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false});
}
