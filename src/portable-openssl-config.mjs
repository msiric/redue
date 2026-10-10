// Portable-only startup prerequisite for the reviewed official Node 22.13.0
// darwin-arm64 executable. This does not change local receipts or process.env.
// Node/OpenSSL parse the complete default config before selecting nodejs_conf.
// Only this independently reviewed exact system template (or verified absence)
// is supported: this is not a general OpenSSL configuration interpreter.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const DEFAULT_OPENSSL_CONFIG='/System/Library/OpenSSL/openssl.cnf';
export const OPENSSL_CONFIG_INTERPRETATION='node-22.13.0-darwin-openssl-default@1';
export const REVIEWED_OPENSSL_TEMPLATE_SHA256='87d46eaa3376f42435f09976bd866461d4661753470423aa785f0942916db3fa';
const LIMIT=64*1024,HOME_LIMIT=4096;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw Object.assign(Error('Reviewed OpenSSL startup configuration unavailable'),{code:'PORTABLE_OPENSSL_UNSUPPORTED'});};
const same=(a,b)=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].every(key=>a[key]===b[key]);
const absentDigest=hash(Buffer.from('redue-openssl-default-absent@1'));

export function portableOpenSSLContextIssue(env=process.env){
  // Presence is refused even if the value is empty. This makes alias handling
  // explicit without asserting every alias is recognized by POSIX OpenSSL.
  if(Object.keys(env).some(key=>/^OPENSSL_(?:CONF|MODULES|CONF_INCLUDE)$/i.test(key)))return 'portable-openssl-override-unsupported';
  if(Object.hasOwn(env,'HOME')){
    const home=env.HOME;
    if(typeof home!=='string'||!home.isWellFormed()||home.includes('\0')||Buffer.byteLength(home)>HOME_LIMIT)
      return 'portable-openssl-home-unsupported';
  }
  return null;
}

export function classifyDefaultOpenSSL(bytes,env=process.env){
  if(portableOpenSSLContextIssue(env)||!Buffer.isBuffer(bytes)||bytes.length>LIMIT)fail();
  const sha256=hash(bytes);
  if(sha256!==REVIEWED_OPENSSL_TEMPLATE_SHA256)fail();
  // Reviewed template has no .include/.pragma, selected nodejs_conf/default
  // openssl_conf modules, or provider directives. Its only environment lookup
  // is $ENV::HOME in an unused RANDFILE value; absent HOME falls back to the
  // template's earlier literal HOME. Other expansions use earlier literal dir.
  // Expansion copies values without reparsing and is bounded by the HOME limit.
  return Object.freeze({interpretation:OPENSSL_CONFIG_INTERPRETATION,kind:'reviewed-template',sha256});
}

function ancestors(){
  const result=[];let current=path.dirname(DEFAULT_OPENSSL_CONFIG);
  while(true){
    const stat=fs.lstatSync(current,{bigint:true});
    if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0n||(stat.mode&0o022n)!==0n)fail();
    result.push([current,stat]);if(current===path.dirname(current))break;current=path.dirname(current);
  }
  return result;
}
function unchangedParents(parents){for(const [file,before] of parents)if(!same(before,fs.lstatSync(file,{bigint:true})))fail();}

// Fixed locally selected path, never an artifact-supplied path. File/absence is
// revalidated at every capture/recipient validation; no result is cached here.
// The OS remains trusted: this is not atomic protection against privileged
// modification of already mapped runtime memory or every concurrent file race.
export function inspectDefaultOpenSSL({env=process.env}={}){
  if(portableOpenSSLContextIssue(env))fail();
  let descriptor;
  try{
    const parents=ancestors();let before;
    try{before=fs.lstatSync(DEFAULT_OPENSSL_CONFIG,{bigint:true});}
    catch(error){
      if(error.code!=='ENOENT')fail();
      unchangedParents(parents);
      try{fs.lstatSync(DEFAULT_OPENSSL_CONFIG,{bigint:true});fail();}catch(error){if(error.code!=='ENOENT')fail();}
      unchangedParents(parents);
      return Object.freeze({interpretation:OPENSSL_CONFIG_INTERPRETATION,kind:'absent',sha256:absentDigest});
    }
    if(!before.isFile()||before.isSymbolicLink()||before.uid!==0n||before.nlink!==1n||
      (before.mode&0o022n)!==0n||before.size<0n||before.size>BigInt(LIMIT))fail();
    descriptor=fs.openSync(DEFAULT_OPENSSL_CONFIG,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(descriptor,{bigint:true});
    if(!opened.isFile()||!same(before,opened))fail();
    const bytes=Buffer.alloc(Number(opened.size));let position=0;
    while(position<bytes.length){const read=fs.readSync(descriptor,bytes,position,bytes.length-position,position);if(read<=0)fail();position+=read;}
    const result=classifyDefaultOpenSSL(bytes,env);
    if(!same(opened,fs.fstatSync(descriptor,{bigint:true}))||!same(opened,fs.lstatSync(DEFAULT_OPENSSL_CONFIG,{bigint:true})))fail();
    unchangedParents(parents);return result;
  }catch{fail();}finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
