// Explicit, owner-provisioned CI observation scope. Environment labels alone
// grant nothing. This is not producer trust and cannot establish applicability.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical,parsePortableJson} from './portable-envelope.mjs';
const interpretation='redue-ci-ancestor-observation@1',minted=new WeakMap();
const fail=code=>{throw Object.assign(Error(code),{code});};
const within=(file,root)=>file===root||file.startsWith(root+'/');
const equal=(a,b)=>['dev','ino','uid','mode','nlink','size','mtimeNs','ctimeNs'].every(k=>a[k]===b[k]);
function physical(file,{directory=false}={}){
 if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file||!/^\/[\x20-\x7e]+$/.test(file)||/[\\:]/.test(file))fail('PORTABLE_ANCESTOR_CAPABILITY_PATH');
 let current='/';const parents=[];
 for(const part of file.slice(1).split('/')){
  current=path.join(current,part);const s=fs.lstatSync(current,{bigint:true});
  if(s.isSymbolicLink()||(current!==file||directory)&&!s.isDirectory())fail('PORTABLE_ANCESTOR_CAPABILITY_PATH');
  parents.push([current,String(s.dev),String(s.ino),String(s.uid),String(s.mode)]);
 }
 if(fs.realpathSync(file)!==file)fail('PORTABLE_ANCESTOR_CAPABILITY_PATH');
 return {stat:fs.lstatSync(file,{bigint:true}),parents};
}
function read(file,root,state,env){
 if(process.platform!=='darwin'||process.arch!=='arm64'||typeof process.getuid!=='function'||
  env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='msiric/redue'||env.RUNNER_OS!=='macOS'||
  !/^refs\/heads\/dev\/portable-(?:recipient-decision|ordinary-boundary|ci-recipient)$/.test(env.GITHUB_REF||'')||
  !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'')||!/^\d+$/.test(env.GITHUB_RUN_ID||'')||env.GITHUB_RUN_ATTEMPT!=='1')
  fail('PORTABLE_ANCESTOR_CAPABILITY_HOST');
 if(within(file,root)||within(file,state))fail('PORTABLE_ANCESTOR_CAPABILITY_PLACEMENT');
 const before=physical(file),uid=BigInt(process.getuid());
 if(!before.stat.isFile()||before.stat.uid!==uid||before.stat.mode%512n!==384n||before.stat.nlink!==1n||before.stat.size>8192n)
  fail('PORTABLE_ANCESTOR_CAPABILITY_OWNER');
 for(const [parent,,,,mode] of before.parents.slice(0,-1)){
  const s=fs.lstatSync(parent,{bigint:true}),sticky=s.uid===0n&&(s.mode&0o1000n)!==0n;
  if(s.uid!==uid&&s.uid!==0n||(BigInt(mode)&0o022n)!==0n&&!sticky)fail('PORTABLE_ANCESTOR_CAPABILITY_OWNER');
 }
 const nearest=fs.lstatSync(path.dirname(file),{bigint:true});
 if(nearest.uid!==uid||(nearest.mode&0o077n)!==0n)fail('PORTABLE_ANCESTOR_CAPABILITY_OWNER');
 const r=physical(root,{directory:true}),s=physical(state,{directory:true});
 if(r.stat.uid!==uid||s.stat.uid!==uid||within(state,root)||within(root,state))fail('PORTABLE_ANCESTOR_CAPABILITY_PLACEMENT');
 let fd;try{
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  const opened=fs.fstatSync(fd,{bigint:true});if(!equal(before.stat,opened))fail('PORTABLE_ANCESTOR_CAPABILITY_CHANGED');
  const bytes=Buffer.alloc(Number(opened.size));let offset=0;
  while(offset<bytes.length){const n=fs.readSync(fd,bytes,offset,bytes.length-offset,offset);if(!n)fail('PORTABLE_ANCESTOR_CAPABILITY_CHANGED');offset+=n;}
  const after=physical(file);if(!equal(opened,fs.fstatSync(fd,{bigint:true}))||!equal(opened,after.stat)||canonical(before.parents)!==canonical(after.parents))fail('PORTABLE_ANCESTOR_CAPABILITY_CHANGED');
  const rootAfter=physical(root,{directory:true}),stateAfter=physical(state,{directory:true});
  // Directory membership changes are normal inputs; physical ancestry/ownership
  // replacement is not repaired by endpoint restoration during this generation.
  if(canonical(r.parents)!==canonical(rootAfter.parents)||canonical(s.parents)!==canonical(stateAfter.parents))fail('PORTABLE_ANCESTOR_CAPABILITY_CHANGED');
  const value=parsePortableJson(bytes),expected={schema:1,interpretation,repository:'msiric/redue',
   ref:env.GITHUB_REF,source:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID,attempt:1,root,state,
   rootIdentity:[String(r.stat.dev),String(r.stat.ino)],stateIdentity:[String(s.stat.dev),String(s.stat.ino)],
   scope:'locally-derived-ancestor-npm-resolution-only',retention:'scope-ids-and-serials-only'};
  if(canonical(value)!==canonical(expected))fail('PORTABLE_ANCESTOR_CAPABILITY_BINDING');
  return {file,root,state,stat:opened,parents:canonical(before.parents),digest:createHash('sha256').update(bytes).digest('hex'),env:Object.fromEntries(['GITHUB_ACTIONS','GITHUB_REPOSITORY','RUNNER_OS','GITHUB_REF','GITHUB_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'].map(key=>[key,env[key]]))};
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function readAncestorObservationCapability(file,{root,state,env=process.env}={}){
 try{const record=read(file,root,state,env),token=Object.freeze({interpretation,scope:record.digest});minted.set(token,record);return token;}
 catch(error){if(/^PORTABLE_ANCESTOR_CAPABILITY_[A-Z_]+$/.test(error.code??''))throw error;
  fail('PORTABLE_ANCESTOR_CAPABILITY_UNAVAILABLE');}
}
export function ancestorObservationCapabilityCurrent(token){
 const before=minted.get(token);if(!before)return false;
 try{const now=read(before.file,before.root,before.state,before.env);
  if(equal(before.stat,now.stat)&&before.parents===now.parents&&before.digest===now.digest)return true;
 }catch{}
 minted.delete(token);return false; // recovery requires a separately established generation
}
export function ancestorObservationResources(token){
 if(!ancestorObservationCapabilityCurrent(token))fail('PORTABLE_ANCESTOR_CAPABILITY_UNAVAILABLE');
 const {root,state,file}=minted.get(token);return Object.freeze({root,state,file});
}
