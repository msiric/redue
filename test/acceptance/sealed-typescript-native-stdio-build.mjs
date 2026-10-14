// Fixed PRE-AUTH engineering build only. No native/helper/model/check executes.
// Live private fixture -> one exact C build -> private currentness binding.
// Hashes and canonical metadata are trusted/quiescent observations, not an
// immutable namespace, loader guarantee, seal or persistent adoption authority.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal} from './sealed-typescript-native-assets-proposal.mjs';
import {sealedAssetsBuildProcessSummary} from './sealed-typescript-native-assets-build.mjs';
import {readNativeStdioProbeSource,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';

const minted=new WeakMap();
const fail=()=>{throw Error('NATIVE_STDIO_BUILD_UNKNOWN');};
const guard=value=>{if(!value)fail();};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const authority=fields=>freeze({schema:1,scope:'FIXED_PREAUTH_NATIVE_STDIO_BUILD_DATA_ONLY',...fields,commands:[],
 helperExecutions:0,nativeLaunches:0,models:0,recordAdoptionAuthority:false,completeSdkClosure:'NOT_ESTABLISHED',
 nativeEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
const nodePin='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const clang='/Library/Developer/CommandLineTools/usr/bin/clang',linker='/Library/Developer/CommandLineTools/usr/bin/ld';
const clangPin='1590ac950a3d627817d09ade5cb60b2115f17a72182a3141e010b4bcc482a0c9';
const linkerPin='374d9f0713bce2c8a9e1e82bde51615d5433516a10d99b63107eb6ee70542e4c';
const sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
const extraHeaders=Object.freeze({
 'stdio.h':'d2220614f42d3cb678ae0de176ba0ab3256e15fb45b3efdb5d17b8ac1f6a4b54',
 'errno.h':'ff95a158e0799dcf0622e83882e64d88f1783b98a91d9b206bcba2a12f8425e6',
 'unistd.h':'8d535079658f063bcef358ef4c1c1b52b8e88dacfc22cbf4db0f6bf8abe40637'});
const localHeaders={
 'sys/stdio.h':'a8078ae1cba1a46a66d0de6fe7f13bbc969cdb7e78fc2d4b9a5c5cdaaf16126b',
 'sys/fcntl.h':'9aca8ca87031ab7b670617e5af8b15a0cad8f34f7ab3bdb5dd799eb153b3ad0e',
 'fcntl.h':'289f3be20c07d8eae5589f43994cfdb5fb33b3b099a6aee67f63e00d90039a8f',
 'sys/mman.h':'07adbf7f11a601e6461ca508a2deca037103008600608f8dbe93a4b0887d46e9',
 'sys/stat.h':'1546ce7485287bec0d15a643ef5d5f882d21272f2f089fed71c36457e609b92a',...extraHeaders};
const LOCAL_PROFILE=freeze({id:'redue-native-stdio-preauth-local-sdk27@1',clangPin,linkerPin,sdk,clangLimit:128*1024*1024,headerPins:localHeaders});
// Approved standard-runner distribution observations, not Apple signature or
// whole SDK/loader proof. Two independent jobs in actual run38560378792 matched:
// https://github.com/msiric/redue/actions/runs/38560378792
// Reports SHAfcc04973a3cda710f6fb6ecae2468c8bb1cc3d349648bf041d5b2a1ce2b89f3d;
// image macos-26-arm64/20260907.0351 source691bdc2593839b6bd2615aaa9718ca646ec3d4a6.
// No record/runner label is adopted at runtime: exact current bytes and private
// fixture/currentness gates below must independently pass before the fixed build.
const CI_PROFILE=freeze({id:'redue-native-stdio-preauth-ci-sdk26.5@1',clangPin:'f30550eab15fdf5ab8c0dc54c52679711241e5d4b636b027e18c09fef531775d',
 linkerPin:'28d85b9af18c923db12e0b4ce70b80ee217f2b7cade0e872baa9e8ddc396c08d',sdk:'/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk',clangLimit:290664032,
 headerPins:{...localHeaders,'sys/fcntl.h':'805fd8c695f8e5e1c327b6852382cc5533738bbfd8f18bc11f850531166e4fe8','sys/stat.h':'31c8f252b05785343ca577c007657c0fbab45a182b60fc5b73994c621dc318d4'}});
const BUILD_INTERPRETATION='redue-native-stdio-preauth-build@2';
const flags=sdk=>['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0','-isysroot',sdk];

function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.parents)&&fs.realpathSync(row.file)===row.file);}
function bounded(file,owner,limit,pin){
 guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);
 guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
 let fd,row,failure=false;
 try{
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));
  const hash=createHash('sha256'),bytes=Buffer.alloc(65536);let count=0,arm64=false;
  while(count<Number(s.size)){const requested=Math.min(bytes.length,Number(s.size)-count),n=fs.readSync(fd,bytes,0,requested,count);guard(Number.isInteger(n)&&n>0&&n<=requested);
   if(count===0&&n>=12)arm64=bytes.readUInt32LE(0)===0xfeedfacf&&bytes.readUInt32LE(4)===0x0100000c;hash.update(bytes.subarray(0,n));count+=n;}
  const digest=hash.digest('hex');guard((pin===null||digest===pin)&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));
  row={file,owner,limit,pin:digest,mark:mark(s),parents:lineage,arm64};named(row);
 }catch{failure=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure=true;}}
 guard(!failure);return row;
}
function current(row){const next=bounded(row.file,row.owner,row.limit,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.parents)===JSON.stringify(row.parents));}
function owned(file){guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return JSON.stringify([parentMark(s),parents(file)]);}
function fixtureCurrent(fixture){const v=verifySealedTypeScriptSyntheticFixture(fixture);
 guard(v.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&v.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'&&v.receiverBasePolicyMatch===true&&v.ownedHandlesClosed===true&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(v.base));return v;
}
function sdkIdentity(sdk){const s=fs.lstatSync(sdk,{bigint:true});guard(fs.realpathSync(sdk)===sdk&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o6022n)===0n);return JSON.stringify([parentMark(s),parents(sdk)]);}
function boundary(record){guard(JSON.stringify(fixtureCurrent(record.fixture))===record.fixtureObservation&&sdkIdentity(record.profile.sdk)===record.sdkIdentity);for(const [file,id] of record.directories)guard(owned(file)===id);}
function completeCurrent(record){
 guard(!record.invalid);boundary(record);for(const row of record.rows)current(row);
 boundary(record);for(const row of record.rows)named(row);boundary(record);for(const row of record.rows)named(row);guard(!record.invalid);
}
function absent(file){try{fs.lstatSync(file,{bigint:true});}catch(e){guard(e?.code==='ENOENT');return;}fail();}
function putSource(file,bytes){let fd,failure=false;
 try{
  fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);
  const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);
  let count=0;while(count<bytes.length){const n=fs.writeSync(fd,bytes,count,bytes.length-count,count);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-count);count+=n;}
  fs.fsyncSync(fd);
 }catch{failure=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure=true;}}
 guard(!failure);
}

export function buildNativeStdioProbe(options){
 if(arguments.length!==1)throw Error('NATIVE_STDIO_BUILD_OPTIONS');return buildFixedProfile(options,LOCAL_PROFILE);
}
export function buildNativeStdioProbeForReviewedCI(options){
 if(arguments.length!==1)throw Error('NATIVE_STDIO_BUILD_OPTIONS');return buildFixedProfile(options,CI_PROFILE);
}
function buildFixedProfile(options,profile){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'fixture')??{},'value'))throw Error('NATIVE_STDIO_BUILD_OPTIONS');
 let record=null,build=null,attempts=0,base=null,reason='FIXTURE_UNAVAILABLE';
 try{
  const first=fixtureCurrent(options.fixture);base=first.base;reason='PROFILE_UNAVAILABLE';
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined);
  if(profile===LOCAL_PROFILE){const tool=prepareSealedTypeScriptNativeAssetsProposal({fixture:options.fixture}).toolchain;
   guard(tool.clangSha256===profile.clangPin&&tool.sdk===profile.sdk&&JSON.stringify({...tool.headerPins,...extraHeaders})===JSON.stringify(profile.headerPins));}
  const sourceProfile=readNativeStdioProbeSource();guard(sourceProfile.sourceSha256===NATIVE_STDIO_SOURCE_SHA256);
  const template=fileURLToPath(new URL('./sealed-typescript-native-stdio-probe.c',import.meta.url));
  const rows=[bounded(process.execPath,process.getuid(),128*1024*1024,nodePin),bounded(clang,0,profile.clangLimit,profile.clangPin),bounded(linker,0,16*1024*1024,profile.linkerPin),
   bounded(template,process.getuid(),65536,NATIVE_STDIO_SOURCE_SHA256),...Object.entries(profile.headerPins).map(([name,pin])=>bounded(profile.sdk+'/usr/include/'+name,0,1048576,pin))];
  record={profile,fixture:options.fixture,fixtureObservation:JSON.stringify(first),sdkIdentity:sdkIdentity(profile.sdk),directories:[[base,owned(base)]],rows};
  reason='OUTPUT_NAMESPACE_UNAVAILABLE';completeCurrent(record);
  const prefix=base+'/prefix',directory=prefix+'/native-probes';absent(prefix);fs.mkdirSync(prefix,{mode:0o700});record.directories.push([prefix,owned(prefix)]);
  fs.mkdirSync(directory,{mode:0o700});record.directories.push([directory,owned(directory)]);
  const sourceFile=directory+'/native-stdio-probe.c',helper=directory+'/native-stdio-probe';absent(sourceFile);absent(helper);
  completeCurrent(record);putSource(sourceFile,Buffer.from(sourceProfile.source));record.rows.push(bounded(sourceFile,process.getuid(),65536,NATIVE_STDIO_SOURCE_SHA256));
  reason='COMPILER_BUILD_UNAVAILABLE';completeCurrent(record);attempts++;
  const result=spawnSync(clang,[...flags(profile.sdk),sourceFile,'-o',helper],{cwd:directory,env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});
  const pidObserved=Number.isInteger(result.pid)&&result.pid>0&&result.pid<=2147483647;
  const completed=pidObserved&&!result.error&&result.status===0&&result.signal===null;
  build={...sealedAssetsBuildProcessSummary(result),pidObserved,completed};guard(completed);
  reason='OUTPUT_IDENTITY_UNAVAILABLE';const binary=bounded(helper,process.getuid(),2*1024*1024,null);guard(binary.arm64&&(fs.lstatSync(helper,{bigint:true}).mode&0o100n)!==0n);
  record.rows.push(binary);completeCurrent(record);reason='BUILT_NOT_EXECUTED';
  const value=authority({profileId:profile.id,buildInterpretation:BUILD_INTERPRETATION,outcome:'BUILT_NOT_EXECUTED',reason,hostBase:base,sourceSha256:NATIVE_STDIO_SOURCE_SHA256,helperSha256:binary.pin,
   sourceFile,helper,cwd:directory,dispatchAttemptCount:attempts,build,compilerCheckExecutions:0});
  minted.set(value,record);return value;
 }catch{return authority({profileId:profile.id,buildInterpretation:BUILD_INTERPRETATION,outcome:'UNKNOWN',reason,hostBase:base,dispatchAttemptCount:attempts,build,compilerCheckExecutions:0});}
}

export function verifyNativeStdioProbeBuild(value){
 const record=minted.get(value);if(!record||record.invalid)return authority({outcome:'UNKNOWN'});
 try{completeCurrent(record);return authority({profileId:record.profile.id,buildInterpretation:BUILD_INTERPRETATION,outcome:'BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',hostBase:value.hostBase,sourceSha256:value.sourceSha256,helperSha256:value.helperSha256,helper:value.helper,cwd:value.cwd});}
 catch{record.invalid=true;return authority({outcome:'UNKNOWN'});}
}
