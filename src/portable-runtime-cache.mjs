// Proposed content profile, not yet an applicability rule. Format reviewed at
// apple-oss-distributions/dyld fd8d0c4d52320ebf64db34f3cb280310d905c5ae.
// Numeric wire offsets are not a copy of Apple's implementation. Never consume
// a producer-supplied cache path; the caller supplies its native actual cache.
// This inspector assumes the trusted OS maps its protected canonical cache to
// the native loaded UUID. It does not defend against a compromised OS/root.
// The cooperative deadline is checked between reads; the enclosing probe must
// retain its process deadline. This module does not authorize applicability.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const HEADER=552,ENTRY=56,MAX_BASE=8*1024*1024,MAX_MEMBER=3*1024**3,MAX_TOTAL=12*1024**3;
const MAGIC=Buffer.from('dyld_v1  arm64e\0');
const fail=()=>{throw Object.assign(Error('Reviewed cache content profile unavailable'),{code:'PORTABLE_RUNTIME_UNSUPPORTED'});};
const hex=bytes=>bytes.toString('hex'),equalStat=(a,b)=>['dev','ino','mode','size','mtimeNs','ctimeNs'].every(key=>a[key]===b[key]);
export function parseCacheMembers(bytes,loadedUUID){
  if(!Buffer.isBuffer(bytes)||bytes.length<HEADER||bytes.length>MAX_BASE||
    !bytes.subarray(0,16).equals(MAGIC)||bytes.readUInt32LE(16)!==HEADER||
    bytes.readUInt32LE(216)!==1||!/^[a-f0-9]{32}$/.test(loadedUUID??'')||
    hex(bytes.subarray(88,104))!==loadedUUID)fail();
  // Bound this initial parser to the observed modern fileSuffix format. Older
  // 24-byte entries and future headers require review, not a guessed filename.
  const offset=bytes.readUInt32LE(392),count=bytes.readUInt32LE(396);
  if(offset<HEADER||count<1||count>32||offset+count*ENTRY>bytes.length)fail();
  const suffixes=new Set(),uuids=new Set([loadedUUID]),members=[{suffix:'',uuid:loadedUUID}];
  for(let i=0;i<count;i++){
    const at=offset+i*ENTRY,uuid=hex(bytes.subarray(at,at+16)),raw=bytes.subarray(at+24,at+ENTRY),end=raw.indexOf(0);
    if(end<1||raw.subarray(end).some(byte=>byte!==0))fail();
    const suffix=raw.subarray(0,end).toString('ascii');
    if(!/^\.\d{2}(?:\.dyld(?:data|readonly|linkedit))?$/.test(suffix)||
      !raw.subarray(0,end).equals(Buffer.from(suffix,'ascii'))||suffixes.has(suffix)||
      uuid==='0'.repeat(32)||uuids.has(uuid))fail();
    suffixes.add(suffix);uuids.add(uuid);members.push({suffix,uuid});
  }
  // A separate symbols file is not part of this reviewed initial profile.
  if(bytes.subarray(400,416).some(byte=>byte!==0))fail();
  return members;
}
function opened(file){
  let descriptor;
  try{
    const before=fs.lstatSync(file,{bigint:true});
    if(!before.isFile()||before.isSymbolicLink()||before.uid!==0n||(before.mode&0o022n)!==0n||
      before.size<104n||before.size>BigInt(MAX_MEMBER))fail();
    descriptor=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const stat=fs.fstatSync(descriptor,{bigint:true});
    if(!stat.isFile()||!equalStat(before,stat))fail();
    return {file,descriptor,stat};
  }catch(error){if(descriptor!==undefined)fs.closeSync(descriptor);fail();}
}
function unchanged(member){
  if(!equalStat(member.stat,fs.fstatSync(member.descriptor,{bigint:true}))||
    !equalStat(member.stat,fs.lstatSync(member.file,{bigint:true})))fail();
}
export function inspectCacheContents(cache){
  if(cache?.overridden!==false||cache?.interposed!==false||!path.isAbsolute(cache.file??'')||
    cache.file!=='/System/Volumes/Preboot/Cryptexes/OS/System/Library/dyld/dyld_shared_cache_arm64e')fail();
  // The native path must identify this reviewed protected OS location; never
  // permit an arbitrary same-named cache under a user-controlled directory.
  try{if(fs.realpathSync(cache.file)!==cache.file)fail();}catch{fail();}
  const openedFiles=[],started=performance.now();
  try{
    const base=opened(cache.file);openedFiles.push(base);
    if(base.stat.size>BigInt(MAX_BASE))fail();
    const bytes=Buffer.alloc(Number(base.stat.size));
    if(fs.readSync(base.descriptor,bytes,0,bytes.length,0)!==bytes.length)fail();
    unchanged(base);const members=parseCacheMembers(bytes,cache.uuid);
    let total=base.stat.size;
    for(const member of members.slice(1)){
      const current=opened(cache.file+member.suffix);openedFiles.push(current);total+=current.stat.size;
      if(total>BigInt(MAX_TOTAL))fail();
      const header=Buffer.alloc(104);
      if(fs.readSync(current.descriptor,header,0,104,0)!==104||
        !header.subarray(0,16).equals(MAGIC)||hex(header.subarray(88,104))!==member.uuid)fail();
    }
    const chunk=Buffer.alloc(8*1024*1024),files=[];
    for(let i=0;i<openedFiles.length;i++){
      const member=openedFiles[i],hash=createHash('sha256');let position=0;
      while(position<Number(member.stat.size)){
        if(performance.now()-started>10000)fail();
        const length=Math.min(chunk.length,Number(member.stat.size)-position),read=fs.readSync(member.descriptor,chunk,0,length,position);
        if(read!==length)fail();hash.update(chunk.subarray(0,read));position+=read;
      }
      unchanged(member);files.push([members[i].suffix||'base',hash.digest('hex')]);
    }
    // Recheck every earlier member after the last member has been consumed.
    for(const member of openedFiles)unchanged(member);
    if(performance.now()-started>10000)fail();
    return {interpretation:'darwin-arm64e-full-cache-content@1',files,totalBytes:Number(total)};
  }catch{fail();}
  finally{for(const member of openedFiles)fs.closeSync(member.descriptor);}
}
