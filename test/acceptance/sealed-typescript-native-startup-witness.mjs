// Fixed witness source + closed JSON data only. No native/model/compiler starts.
// Successful parsing cannot certify the command boundary, startup, credentials,
// pre-main reads, path-helper execution, input sealing or future reuse.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parsePortableJson} from '../../src/portable-envelope.mjs';
import {parseNativeStdioMetadata,nativeStdioDirectCommand} from './sealed-typescript-native-stdio-probe.mjs';
export const NATIVE_STARTUP_WITNESS_SOURCE_SHA256='a2a439ccdb403a26c5b0491ceb27b2b60cfb3d53bccd2c53faa7ce1ca409741b';
export const NATIVE_STARTUP_WITNESS_INTERPRETATION='native187-direct-bash-child-startup-witness@1';
const sha=value=>createHash('sha256').update(value).digest('hex');
const fingerprints=s=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const fail=()=>{throw Error('NATIVE_STARTUP_WITNESS_SOURCE_UNKNOWN');};
const authority=fields=>Object.freeze({schema:1,scope:'NATIVE_CHILD_STARTUP_WITNESS_SOURCE_ONLY',interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION,...fields,
  nativeEnforcement:'NOT_ESTABLISHED',stdioOwnership:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});

// Reads only this literal source leaf. No caller-selected file or SDK/body tree.
// The future fixed builder must verify its own reviewed toolchain/SDK identity.
export function readNativeStartupWitnessSource(){
 const file=fileURLToPath(new URL('./sealed-typescript-native-startup-witness.c',import.meta.url));let fd;
 try{
  if(typeof process.getuid!=='function'||fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(file)!==file)fail();
  const before=fs.lstatSync(file,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.uid!==BigInt(process.getuid())||before.nlink!==1n||(before.mode&0o6022n)!==0n||before.size<=0n||before.size>65536n)fail();
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  if(fingerprints(fs.fstatSync(fd,{bigint:true}))!==fingerprints(before))fail();
  const bytes=Buffer.alloc(Number(before.size)+1);let count=0;
  while(count<bytes.length){const n=fs.readSync(fd,bytes,count,bytes.length-count,count);if(n===0)break;if(!Number.isInteger(n)||n<0||n>bytes.length-count)fail();count+=n;}
  const body=bytes.subarray(0,count),source=body.toString('utf8');
  if(count!==Number(before.size)||!Buffer.from(source).equals(body)||sha(body)!==NATIVE_STARTUP_WITNESS_SOURCE_SHA256||
    fingerprints(fs.fstatSync(fd,{bigint:true}))!==fingerprints(before)||fingerprints(fs.lstatSync(file,{bigint:true}))!==fingerprints(before)||fs.realpathSync(file)!==file)fail();
  fs.closeSync(fd);fd=undefined;
  return authority({source,sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,sourceBytes:count,commands:[],compiled:false});
 }catch{fail();}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{}}
}


export const NATIVE_STARTUP_WITNESS_FIELDS=Object.freeze(['entry_binding_valid','home_matches','root_matches','shell_matches','path_matches','manpath_absent','bash_env_absent','env_absent','ps1_absent','term_program_absent']);
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
// Unauthenticated parsed data only. Actual native tool/command, build/currentness,
// foreground result/exit and startup collection require separate reviewed binding.
export function parseNativeStartupWitness(bytes){
 try{
  if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||Buffer.byteLength(bytes)>4096)return null;
  const v=parsePortableJson(bytes);
  if(!exact(v,['schema','scope','pid','startup','dev_null','fd0_matches_dev_null','descriptors'])||v.schema!==1||v.scope!=='NATIVE_CHILD_STARTUP_WITNESS_ONLY'||
    !exact(v.startup,NATIVE_STARTUP_WITNESS_FIELDS)||!NATIVE_STARTUP_WITNESS_FIELDS.every(k=>typeof v.startup[k]==='boolean'))return null;
  const {startup,...metadata}=v;metadata.scope='NATIVE_STDIO_METADATA_ONLY';
  const parsed=parseNativeStdioMetadata(JSON.stringify(metadata));if(!parsed)return null;
  return Object.freeze({...parsed,scope:v.scope,startup:Object.freeze({...startup})});
 }catch{return null;}
}
export function nativeStartupWitnessBinding(hostBase){
 const command=nativeStdioDirectCommand(hostBase);
 return Object.freeze({schema:1,scope:'DISABLED_LITERAL_NATIVE_STARTUP_WITNESS_BINDING_ONLY',interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION,
  sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,commandSha256:sha(command),command_proposed:command,
  disabled:true,models:0,helperExecutions:0,inferencePermitted:false,controlledShellStartup:'NOT_EMPIRICALLY_OBSERVED',
  nativeEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
}
