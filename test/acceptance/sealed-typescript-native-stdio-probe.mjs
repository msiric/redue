// Fixed source and native187 trace interpretation only. No compiler, native
// process, model, settings, environment, endpoint or credential IO at import.
// A caller must separately establish approved build bytes, effective startup
// policy/capacity and complete bounded native-process collection. This module
// cannot grant those properties or any seal/receipt/reuse authority.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parsePortableJson} from '../../src/portable-envelope.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';

export const NATIVE_STDIO_SOURCE_SHA256='198bbba21317925945355e2dba67df006920fd1d0273b8f9a1804ce965c7a1ed';
export const NATIVE_STDIO_INTERPRETATION='native187-direct-bash-stdio-metadata@1';
const sha=value=>createHash('sha256').update(value).digest('hex');
const hash=/^[a-f0-9]{64}$/;
const errors=new Set(['EBADF','EACCES','EPERM','EINTR','EINVAL','ENOENT','ENOTDIR','ELOOP','OTHER_ERROR']);
const types=new Set(['REGULAR','DIRECTORY','CHARACTER','BLOCK','FIFO','SOCKET','SYMLINK','UNKNOWN']);
const access=new Set(['READ_ONLY','WRITE_ONLY','READ_WRITE','UNKNOWN']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const fingerprints=s=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const fail=()=>{throw Error('NATIVE_STDIO_SOURCE_UNKNOWN');};
const authority=fields=>Object.freeze({schema:1,scope:'NATIVE_STDIO_PRECONDITION_ONLY',interpretation:NATIVE_STDIO_INTERPRETATION,...fields,
  nativeEnforcement:'NOT_ESTABLISHED',stdioOwnership:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});

// Reads only this literal source leaf. No caller-selected file or SDK/body tree.
// The future fixed builder must verify its own reviewed toolchain/SDK identity.
export function readNativeStdioProbeSource(){
 const file=fileURLToPath(new URL('./sealed-typescript-native-stdio-probe.c',import.meta.url));let fd;
 try{
  if(typeof process.getuid!=='function'||fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(file)!==file)fail();
  const before=fs.lstatSync(file,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.uid!==BigInt(process.getuid())||before.nlink!==1n||(before.mode&0o6022n)!==0n||before.size<=0n||before.size>65536n)fail();
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  if(fingerprints(fs.fstatSync(fd,{bigint:true}))!==fingerprints(before))fail();
  const bytes=Buffer.alloc(Number(before.size)+1);let count=0;
  while(count<bytes.length){const n=fs.readSync(fd,bytes,count,bytes.length-count,count);if(n===0)break;if(!Number.isInteger(n)||n<0||n>bytes.length-count)fail();count+=n;}
  const body=bytes.subarray(0,count),source=body.toString('utf8');
  if(count!==Number(before.size)||!Buffer.from(source).equals(body)||sha(body)!==NATIVE_STDIO_SOURCE_SHA256||
    fingerprints(fs.fstatSync(fd,{bigint:true}))!==fingerprints(before)||fingerprints(fs.lstatSync(file,{bigint:true}))!==fingerprints(before)||fs.realpathSync(file)!==file)fail();
  fs.closeSync(fd);fd=undefined;
  return authority({source,sourceSha256:NATIVE_STDIO_SOURCE_SHA256,sourceBytes:count,commands:[],compiled:false});
 }catch{fail();}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{}}
}

// Restricted reviewed location, real shell quoting. The shell observes its direct
// C child's wait status, then exits with it. >=128 cannot distinguish a normal
// high exit code from signal encoding and remains ambiguous. No exec supervisor.
export function nativeStdioProbeCommand(hostBase){
 if(typeof hostBase!=='string'||!/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(hostBase))throw Error('NATIVE_STDIO_BINDING_UNKNOWN');
 const helper=hostBase+'/prefix/native-probes/native-stdio-probe';
 return `'${helper.replaceAll("'","'\\''")}'\nredue_stdio_status=$?\nprintf '\\n{"schema":1,"scope":"NATIVE_STDIO_SHELL_STATUS_ONLY","status":%d}\\n' "$redue_stdio_status"\nexit "$redue_stdio_status"`;
}

// Only JSON data, not getters/prototypes or model-provided executable callbacks.
function data(value,depth=0){
 if(depth>12)return false;
 if(value===null||typeof value==='boolean')return true;
 if(typeof value==='number')return Number.isFinite(value);
 if(typeof value==='string')return value.length<=65536;
 if(typeof value!=='object'||!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype)return false;
 const keys=Reflect.ownKeys(value);if(keys.length>128)return false;
 return keys.every(key=>typeof key==='string'&&(Array.isArray(value)&&key==='length'||Object.hasOwn(Object.getOwnPropertyDescriptor(value,key)??{},'value')&&Object.getOwnPropertyDescriptor(value,key).enumerable===true&&data(Object.getOwnPropertyDescriptor(value,key).value,depth+1)));
}
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
function sanitizeReport(value){
 if(!exact(value,['schema','scope','pid','dev_null','fd0_matches_dev_null','descriptors'])||value.schema!==1||value.scope!=='NATIVE_STDIO_METADATA_ONLY'||
  !Number.isSafeInteger(value.pid)||value.pid<1||value.pid>2147483647||!exact(value.dev_null,['lstat','type'])||
  !(value.dev_null.lstat==='OK'||errors.has(value.dev_null.lstat))||!types.has(value.dev_null.type)||
  value.dev_null.lstat!=='OK'&&value.dev_null.type!=='UNKNOWN'||!(value.fd0_matches_dev_null===null||typeof value.fd0_matches_dev_null==='boolean')||
  !Array.isArray(value.descriptors)||value.descriptors.length!==3)return null;
 for(let fd=0;fd<3;fd++){
  const r=value.descriptors[fd];if(!exact(r,['fd','fstat','type','fcntl','access'])||r.fd!==fd||!(r.fstat==='OK'||errors.has(r.fstat))||
    !(r.fcntl==='OK'||errors.has(r.fcntl))||!types.has(r.type)||!access.has(r.access)||r.fstat!=='OK'&&r.type!=='UNKNOWN'||r.fcntl!=='OK'&&r.access!=='UNKNOWN')return null;
 }
 const metadataAvailable=value.dev_null.lstat==='OK'&&value.descriptors[0].fstat==='OK';
 if(metadataAvailable?typeof value.fd0_matches_dev_null!=='boolean':value.fd0_matches_dev_null!==null)return null;
 if(value.fd0_matches_dev_null===true&&(value.dev_null.type!=='CHARACTER'||value.descriptors[0].type!=='CHARACTER'))return null;
 return JSON.parse(JSON.stringify(value));
}
function collection(content){
 const pieces=typeof content==='string'?[content]:Array.isArray(content)&&content.every(v=>exact(v,['type','text'])&&v.type==='text'&&typeof v.text==='string')?content.map(v=>v.text):null;
 if(!pieces)return null;
 const lines=pieces.join('\n').split(/\r?\n/).filter(v=>v.trim());if(lines.length!==2||lines.some(v=>Buffer.byteLength(v)>4096))return null;
 try{
  const report=sanitizeReport(parsePortableJson(lines[0])),status=parsePortableJson(lines[1]);
  if(!report||!exact(status,['schema','scope','status'])||status.schema!==1||status.scope!=='NATIVE_STDIO_SHELL_STATUS_ONLY'||!Number.isInteger(status.status)||status.status<0||status.status>255)return null;
  return {report,shellStatus:status.status};
 }catch{return null;}
}

// completion is the enclosing trusted harness's actual native process/build
// observation, not a field in model output. Supplying these data in a mock is
// parser evidence only. No configuration or claimed prose can establish them.
export function interpretNativeStdioProbeTrace(events,binding,completion){
 const unknown=(reason,fields={})=>authority({outcome:'UNKNOWN',reason,...fields});
 if(!data(events)||!data(binding)||!data(completion)||!Array.isArray(events)||events.length>64||Buffer.byteLength(JSON.stringify(events))>2097152)return unknown('INPUT_UNAVAILABLE');
 if(!exact(binding,['hostBase','helperSha256','sourceSha256','nativeSha256'])||!hash.test(binding.helperSha256??'')||binding.sourceSha256!==NATIVE_STDIO_SOURCE_SHA256||binding.nativeSha256!==REVIEWED_CLAUDE_NATIVE.sha256)return unknown('IDENTITY_BINDING_UNKNOWN');
 let command;try{command=nativeStdioProbeCommand(binding.hostBase);}catch{return unknown('IDENTITY_BINDING_UNKNOWN');}
 const cwd=binding.hostBase+'/prefix/native-probes';let init=false,session=null,tool=null,result=null,final=null,reason=null;const messages=new Set();
 const reject=code=>{reason??=code;};
 for(const event of events){
  if(!event||typeof event!=='object'||Array.isArray(event)){reject('STREAM_MALFORMED');continue;}
  if(event.type==='system'&&event.subtype==='init'){
   if(init||event.claude_code_version!==REVIEWED_CLAUDE_NATIVE.version||event.cwd!==cwd||event.apiKeySource!=='none'||event.permissionMode!=='dontAsk'||
     JSON.stringify(event.tools)!=='["Bash"]'||!Array.isArray(event.mcp_servers)||event.mcp_servers.length||!Array.isArray(event.plugins)||event.plugins.length||!uuid.test(event.session_id??'')){reject('NATIVE_INITIAL_CONTEXT');continue;}
   init=true;session=event.session_id;continue;
  }
  if(event.type==='assistant'){
   if(!init||final||event.session_id!==session||event.parent_tool_use_id!==null||event.message?.role!=='assistant'||typeof event.message.id!=='string'||!Array.isArray(event.message.content)){reject('NATIVE_ASSISTANT_CONTEXT');continue;}
   messages.add(event.message.id);if(messages.size>4){reject('NATIVE_TURN_LIMIT');continue;}
   for(const item of event.message.content)if(item?.type==='tool_use'){
    const input=item.input;
    if(tool||item.name!=='Bash'||!/^toolu_[A-Za-z0-9]{6,100}$/.test(item.id??'')||!input||typeof input!=='object'||Array.isArray(input)||input.command!==command||
      Object.keys(input).some(k=>!['command','timeout','description'].includes(k))||!Object.hasOwn(input,'timeout')||!Number.isInteger(input.timeout)||input.timeout<1||input.timeout>15000||
      Object.hasOwn(input,'description')&&typeof input.description!=='string'){reject('NATIVE_TOOL_SCOPE');continue;}
    tool={id:item.id,commandSha256:sha(command)};
   }continue;
  }
  if(event.type==='user'){
   if(!init||final||event.session_id!==session||event.parent_tool_use_id!==null||event.message?.role!=='user'||!Array.isArray(event.message.content)){reject('NATIVE_RESULT_CONTEXT');continue;}
   for(const item of event.message.content)if(item?.type==='tool_result'){
    if(!tool||result||item.tool_use_id!==tool.id||item.is_error!==undefined&&typeof item.is_error!=='boolean'){reject('NATIVE_RESULT_ID');continue;}
    const parsed=collection(item.content);if(!parsed){reject('METADATA_OR_STATUS_MISSING');continue;}
    result={...parsed,isError:item.is_error===true};
   }continue;
  }
  if(event.type==='result'){
   if(!init||final||event.session_id!==session||!Number.isInteger(event.num_turns)||event.num_turns<1||event.num_turns>4||typeof event.is_error!=='boolean'){reject('NATIVE_FINAL_CONTEXT');continue;}
   final={success:event.subtype==='success'&&!event.is_error};continue;
  }
  if(event.type==='system'&&event.subtype==='thinking_tokens'&&init&&!final&&exact(event,['type','subtype','estimated_tokens','estimated_tokens_delta','uuid','session_id'])&&
    uuid.test(event.uuid??'')&&event.session_id===session&&typeof event.estimated_tokens==='number'&&event.estimated_tokens>=0&&event.estimated_tokens<=1000000&&
    typeof event.estimated_tokens_delta==='number'&&event.estimated_tokens_delta>=0&&event.estimated_tokens_delta<=event.estimated_tokens)continue;
  if(event.type!=='rate_limit_event')reject('NATIVE_STREAM_UNKNOWN');
 }
 if(reason||!init||!tool||!result||!final?.success)return unknown(reason??'NATIVE_TRACE_INCOMPLETE');
 const reported={metadata:result.report,shellStatus:result.shellStatus,toolUseId:tool.id,commandSha256:tool.commandSha256,helperSha256:binding.helperSha256};
 if(!exact(completion,['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','sourceSha256','helperSha256','nativeSha256','nativeExit','nativeSignal','timedOut','reaped','startupPreconditions'])||
   completion.sourceCurrent!==true||completion.helperCurrent!==true||completion.reviewedBuildMatches!==true||completion.nativeCurrent!==true||completion.nativeExit!==0||completion.nativeSignal!==null||
   completion.sourceSha256!==binding.sourceSha256||completion.helperSha256!==binding.helperSha256||completion.nativeSha256!==binding.nativeSha256||
   completion.timedOut!==false||completion.reaped!==true||completion.startupPreconditions!==true)return unknown('EXTERNAL_NATIVE_OR_BUILD_PRECONDITION_MISSING',reported);
 if(result.shellStatus!==0||result.isError)return unknown(result.shellStatus>=128?'AMBIGUOUS_SHELL_STATUS':'HELPER_EXIT_NOT_ZERO',reported);
 const r=result.report;
 if(r.dev_null.lstat!=='OK'||r.dev_null.type==='UNKNOWN'||r.descriptors.some(d=>d.fstat!=='OK'||d.fcntl!=='OK'||d.type==='UNKNOWN'||d.access==='UNKNOWN'))return unknown('DESCRIPTOR_METADATA_UNAVAILABLE',reported);
 const compatible=r.fd0_matches_dev_null===true&&r.descriptors[0].access==='READ_ONLY'&&r.descriptors.slice(1).every(d=>d.type==='FIFO'&&d.access==='WRITE_ONLY');
 return authority({outcome:compatible?'OBSERVED_COMPATIBLE':'OBSERVED_INCOMPATIBLE',reason:'DIRECT_NATIVE_BASH_METADATA_AND_SHELL_ZERO_OBSERVED',...reported,helperProcessOutcome:'EXIT_ZERO'});
}
