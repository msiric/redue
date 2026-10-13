// Data-only disabled render/build proposal. Trusted/quiescent filesystem reads
// are not hostile-ancestor confinement. No file is written or code executed.
// Actual compiler/SDK/binary currency and native enforcement remain unproved.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
const pins=Object.freeze({
  checker:'d206de2e8fa469768aecec6e7bf276a935a0071c470aa5b1ad053de6dd649671',
  mapper:'14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070',
  exchange:'507dc2fb45adb9d7df293eccf18874fbfb101d4b25f2ace932899be6f2198d72'});
const names={checker:'sealed-typescript-native-sentinel.mjs',mapper:'sealed-typescript-map-sentinel.c',exchange:'sealed-typescript-exchange-sentinel.c'};
const sha=value=>createHash('sha256').update(value).digest('hex');
const error=code=>Object.assign(Error(code),{code});
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const identity=stat=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
function ancestors(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const stat=fs.lstatSync(at,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink())throw error('NATIVE_ASSETS_SOURCE_CHANGED');rows.push([at,[stat.dev,stat.ino,stat.mode,stat.uid,stat.gid].map(String).join(':')]);if(at===path.dirname(at))return rows;}}
function regular(stat){return stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1n&&stat.size>0n&&stat.size<=1048576n&&typeof process.getuid==='function'&&stat.uid===BigInt(process.getuid())&&(stat.mode&0o22n)===0n;}
function readTemplate(key){const file=fileURLToPath(new URL('./'+names[key],import.meta.url));let fd,failure,result;
  try{if(fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(file)!==file)throw error('NATIVE_ASSETS_SOURCE_CHANGED');
    const parents=ancestors(file),named=fs.lstatSync(file,{bigint:true});if(!regular(named))throw error('NATIVE_ASSETS_SOURCE_CHANGED');
    fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);const before=fs.fstatSync(fd,{bigint:true});if(!regular(before)||identity(before)!==identity(named))throw error('NATIVE_ASSETS_SOURCE_CHANGED');
    const bytes=Buffer.alloc(Number(before.size)+1);let count=0;
    while(count<bytes.length){const got=fs.readSync(fd,bytes,count,bytes.length-count,count);if(got===0)break;if(!Number.isInteger(got)||got<0||got>bytes.length-count)throw error('NATIVE_ASSETS_SOURCE_UNAVAILABLE');count+=got;}
    const body=bytes.subarray(0,count),text=body.toString('utf8');if(count!==Number(before.size)||!Buffer.from(text).equals(body)||sha(body)!==pins[key])throw error('NATIVE_ASSETS_TEMPLATE_MISMATCH');
    if(identity(fs.fstatSync(fd,{bigint:true}))!==identity(before)||identity(fs.lstatSync(file,{bigint:true}))!==identity(before)||JSON.stringify(ancestors(file))!==JSON.stringify(parents))throw error('NATIVE_ASSETS_SOURCE_CHANGED');result=text;
  }catch(cause){failure=error(['NATIVE_ASSETS_SOURCE_CHANGED','NATIVE_ASSETS_TEMPLATE_MISMATCH'].includes(cause?.code)?cause.code:'NATIVE_ASSETS_SOURCE_UNAVAILABLE');}
  finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure??=error('NATIVE_ASSETS_SOURCE_UNAVAILABLE');}}
  if(failure)throw failure;return result;
}
function replaceOnce(source,token,value){if(source.split(token).length!==2)throw error('NATIVE_ASSETS_TEMPLATE_MISMATCH');return source.replace(token,value);}
function cPath(value){if(typeof value!=='string'||!path.isAbsolute(value)||path.normalize(value)!==value||Buffer.byteLength(value)>4096||Buffer.from(value).toString('utf8')!==value||/[\u0000-\u001f\u007f\\:]/u.test(value))throw error('NATIVE_ASSETS_BINDINGS');
  return [...Buffer.from(value)].map(byte=>byte===34?'\\"':byte>=32&&byte<=126?String.fromCharCode(byte):'\\'+byte.toString(8).padStart(3,'0')).join('');}
function current(fixture){const value=verifySealedTypeScriptSyntheticFixture(fixture);
  if(value.outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'||value.scope!=='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'||value.receiverBasePolicyMatch!==true||value.ownedHandlesClosed!==true||!/^\/private\/tmp\/redue-ci-recipient-[A-Za-z0-9]{8}$/.test(value.base))throw error('NATIVE_ASSETS_FIXTURE_UNAVAILABLE');return JSON.stringify(value);}
export function prepareSealedTypeScriptNativeAssetsProposal(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'fixture')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'fixture'),'value'))throw error('NATIVE_ASSETS_OPTIONS');
  const {fixture}=options,before=current(fixture),base=fixture.base,code=base+'/prefix/native-probes',node=base+'/runtime/node-v22.13.0-darwin-arm64/bin/node';
  const stageParent=base+'/sealed-inputs',stage=stageParent+'/redue-materialization-Canary',workspace=base+'/Checkout 空间/.sealed-native-canaries';
  const bindings={node,checker:code+'/'+names.checker,stageParent,stage,writeCanary:stage+'/write-canary.txt',chmodCanary:stage+'/chmod-canary.txt',unlinkCanary:stage+'/unlink-canary.txt',renameCanary:stage+'/rename-canary.txt',renameDestination:stage+'/rename-destination.txt',hardlinkCanary:stage+'/hardlink-canary.txt',parentReplacement:base+'/sealed-inputs-replaced',allowedWorkspace:workspace,allowedWrite:workspace+'/write-canary.txt',outsideAlias:workspace+'/stage-alias.txt',caseWriteCanary:base+'/SEALED-INPUTS/redue-materialization-Canary/write-canary.txt',parentSymlinkAlias:workspace+'/stage-parent-alias',parentSymlinkWriteCanary:workspace+'/stage-parent-alias/redue-materialization-Canary/write-canary.txt'};
  let checker=readTemplate('checker');checker=replaceOnce(checker,"const base='__REVIEWED_SENTINEL_BASE__';",'const base='+JSON.stringify(base)+';');
  const start=checker.indexOf('export const SEALED_SENTINEL_BINDINGS=Object.freeze({'),end=checker.indexOf('\n});',start);
  if(start<0||end<start||checker.indexOf('export const SEALED_SENTINEL_BINDINGS=',start+1)>=0)throw error('NATIVE_ASSETS_TEMPLATE_MISMATCH');
  checker=checker.slice(0,start)+'export const SEALED_SENTINEL_BINDINGS=Object.freeze('+JSON.stringify(bindings)+');'+checker.slice(end+4);
  const mapper=replaceOnce(replaceOnce(readTemplate('mapper'),'__REVIEWED_WRITABLE_WORKSPACE_MAP_CANARY__',cPath(workspace+'/map-canary.txt')),'__REVIEWED_STAGED_MAP_CANARY__',cPath(stage+'/map-canary.txt'));
  const exchange=replaceOnce(readTemplate('exchange'),'__REVIEWED_EXCHANGE_BASE__',cPath(base));
  if(current(fixture)!==before)throw error('NATIVE_ASSETS_FIXTURE_UNAVAILABLE');
  const clang='/Library/Developer/CommandLineTools/usr/bin/clang',sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk',flags=['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0'];
  const sources=Object.entries({checker,mapper,exchange}).map(([kind,source])=>({kind,file:code+'/'+names[kind],templateSha256:pins[kind],source,sha256:sha(source),bytes:Buffer.byteLength(source)}));
  return freeze({schema:1,scope:'FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY',disabled:true,base,bindings,sources,
    proposedBuilds:['mapper','exchange'].map(kind=>({disabled:true,executable:clang,argv:[...flags,'-isysroot',sdk,code+'/'+names[kind],'-o',code+'/'+names[kind].slice(0,-2)]})),
    toolchain:{clangVersion:'21.0.0',clangSha256:'1590ac950a3d627817d09ade5cb60b2115f17a72182a3141e010b4bcc482a0c9',sdk,headerPins:{'sys/stdio.h':'a8078ae1cba1a46a66d0de6fe7f13bbc969cdb7e78fc2d4b9a5c5cdaaf16126b','sys/fcntl.h':'9aca8ca87031ab7b670617e5af8b15a0cad8f34f7ab3bdb5dd799eb153b3ad0e','fcntl.h':'289f3be20c07d8eae5589f43994cfdb5fb33b3b099a6aee67f63e00d90039a8f','sys/mman.h':'07adbf7f11a601e6461ca508a2deca037103008600608f8dbe93a4b0887d46e9','sys/stat.h':'1546ce7485287bec0d15a643ef5d5f882d21272f2f089fed71c36457e609b92a'},currentness:'NOT_VERIFIED',completeSdkClosure:'NOT_ESTABLISHED'},
    ordering:'SEPARATE_FRESH_FIXTURE_PER_ROUTE_REQUIRES_REVIEW',commands:[],nativeLaunches:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
}
