import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {sha} from './plan.mjs';
import {inspectCacheProfile} from './portable-runtime-cache.mjs';
import {inspectDefaultOpenSSL} from './portable-openssl-config.mjs';
import {mark,timing} from './decision-profile.mjs';

const fail=()=>{throw Object.assign(Error('Reviewed loaded runtime identity unavailable'),{code:'PORTABLE_RUNTIME_UNSUPPORTED'});};
const fingerprint=stat=>['dev','ino','mode','uid','size','mtimeNs','ctimeNs'].map(key=>String(stat[key]));
const helperDigest='d16b6f14ed089c795bf763743a0212b9f4ee4dc2310c39a3231e038dc137dff3';
export const reviewedNodeDigest='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
export const portableRuntimeInterpretation='darwin-arm64-official-node22.13-content@2';
// Contract-specific content equivalence, never arbitrary Node/version labels.
// Trusted OS mappings and protected canonical system content remain prerequisites.
// Origin stability still compares the caller's raw executable metadata across
// the entire run; portable equality does not erase that local interval guard.
export const portableRuntimeSupported=()=>process.platform==='darwin'&&process.arch==='arm64'&&
  process.version==='v22.13.0'&&os.release()==='25.6.0';
function bytes(file){
  const before=fs.lstatSync(file,{bigint:true});let descriptor;
  if(!before.isFile()||before.isSymbolicLink()||before.size>128n*1024n*1024n)fail();
  try{
    descriptor=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(descriptor,{bigint:true});
    if(!opened.isFile()||JSON.stringify(fingerprint(before))!==JSON.stringify(fingerprint(opened)))fail();
    const content=Buffer.alloc(Number(opened.size));let at=0;
    while(at<content.length){const count=fs.readSync(descriptor,content,at,content.length-at,at);if(!count)fail();at+=count;}
    const digest=sha(content);
    if(JSON.stringify(fingerprint(opened))!==JSON.stringify(fingerprint(fs.fstatSync(descriptor,{bigint:true})))||
      JSON.stringify(fingerprint(before))!==JSON.stringify(fingerprint(fs.lstatSync(file,{bigint:true}))))fail();
    return {file,before,digest};
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
function unchanged(item){
  if(JSON.stringify(fingerprint(item.before))!==JSON.stringify(fingerprint(fs.lstatSync(item.file,{bigint:true}))))fail();
}
export function portableRuntimeInspection({certificate=null}={}){
  if(!portableRuntimeSupported()||process.getuid?.()===0||
    process.getuid?.()!==process.geteuid?.()||process.getgid?.()!==process.getegid?.())fail();
  const runtimeStarted=performance.now();mark('portable_runtime.start');
  const binary=fs.realpathSync(process.execPath),node=bytes(binary);
  timing('portable_runtime.node_complete',runtimeStarted);
  if(node.digest!==reviewedNodeDigest||(node.before.mode&0o6000n)!==0n)fail();
  const helper=fileURLToPath(new URL('./portable-runtime-darwin-arm64.node',import.meta.url)),helperBytes=bytes(helper);
  if(helperBytes.digest!==helperDigest)fail();
  mark('portable_runtime.helper_complete');
  let native,cache;
  try{native=createRequire(import.meta.url)(helper);cache=native.inspect();}catch{fail();}
  const openssl=inspectDefaultOpenSSL();mark('portable_runtime.openssl_complete');
  const imagesBefore=process.report.getReport().sharedObjects,imagesDigest=sha(JSON.stringify([...imagesBefore].sort()));
  const candidate=certificate?.schema===1&&certificate.loadedImagesDigest===imagesDigest?certificate.cache:null;
  const inspected=inspectCacheProfile(cache,{certificate:candidate}),content=inspected.content;mark('portable_runtime.cache_complete');
  const objects=process.report.getReport().sharedObjects,seen=new Set(),virtual=[],readable=[];
  if(sha(JSON.stringify([...objects].sort()))!==imagesDigest)fail();
  const allowed=new Map([[binary,node],[helper,helperBytes]]);
  for(const file of ['/usr/lib/system/libsystem_kernel.dylib','/usr/lib/system/libsystem_platform.dylib','/usr/lib/system/libsystem_pthread.dylib']){
    if(fs.realpathSync(file)!==file)fail();const item=bytes(file);
    if(item.before.uid!==0n||(item.before.mode&0o022n)!==0n)fail();allowed.set(file,item);
  }
  for(const file of objects){
    if(!fs.existsSync(file)){if(!native.contains(file))fail();virtual.push(file);continue;}
    const item=allowed.get(file),name=path.basename(file);
    if(!item||seen.has(name))fail();seen.add(name);readable.push([name,item.digest]);
  }
  if(seen.size!==allowed.size)fail();
  for(const item of allowed.values())unchanged(item);
  const after=native.inspect();
  if(JSON.stringify(after)!==JSON.stringify(cache)||JSON.stringify(inspectDefaultOpenSSL())!==JSON.stringify(openssl)||
    sha(JSON.stringify([...process.report.getReport().sharedObjects].sort()))!==imagesDigest)fail();
  const sharedObjects=[['portable-runtime-profile',sha(portableRuntimeInterpretation)],
    ['openssl-default',sha(JSON.stringify(openssl))],['dyld-virtual-images',sha(JSON.stringify(virtual.sort()))],
    ...content.files.map(([suffix,digest])=>['dyld-cache-'+suffix,digest]),...readable]
    .sort(([a],[b])=>a<b?-1:a>b?1:0);
  timing('portable_runtime.complete',runtimeStarted,{loadedImages:objects.length});
  return {runtime:{version:process.version,sha256:node.digest,sharedObjects},
    certificate:{schema:1,loadedImagesDigest:imagesDigest,cache:inspected.certificate},inspection:inspected.inspection};
}

// Origin and caller proofs retain independent full inspection.
export function portableRuntime(){return portableRuntimeInspection().runtime;}
