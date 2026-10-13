// Fixed native187 foreground interpretation only. No native/helper/model/file IO.
// Actual public native user.tool_use_result + matching renderer are mandatory.
// This source-derived command-zero claim is NOT C kernel-close, signal or reap
// observation. No prose, mock, config or cleanup result proves enforcement/seal.
import {createHash} from 'node:crypto';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {nativeStdioDirectCommand,parseNativeStdioMetadata,isNativeStdioDiagnosticData,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';

export const NATIVE_STDIO_DIRECT_INTERPRETATION='native187-direct-bash-stdio-foreground@1';
// Independent051 pinned-public-source audit; no extracted code executes here.
export const NATIVE_STDIO_FOREGROUND_SOURCE=Object.freeze({nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256,
 rawSchema:Object.freeze({offset:204052151,bytes:3000,sha256:'f3274f78c52ed4b33500c768f7dd381cc42d96d11de7cae0ddefd261394b30be'}),
 normalCallData:Object.freeze({offset:204061917,bytes:640,sha256:'f18e1cb1c9a0402bb2de5abb62ae0db698040d598153ca77d3a535d0048bd39b'}),
 renderer:Object.freeze({offset:204057011,bytes:1460,sha256:'50f95425f5309845a8e12a804c46e5a44ab5b74e43dab0022251970b22ec99e1'}),
 streamSerializer:Object.freeze({offset:203759909,bytes:620,sha256:'3afc1c6647a059b6dffd0d4f28c18bb2686f3cf8a33a75f0d43f06fe6329d4ab'}),
 foregroundExitMap:Object.freeze({offset:206819820,bytes:3952,sha256:'b348aa0d04775bbeb369711ee390094abe349f657b1996290a0f67f89cda09c5'}),
 commandResultInterpretation:Object.freeze({offset:203958089,bytes:1800,sha256:'851550800ce59651537298052aaeadf8c9ab3e65b4cbfc696025eaf1bf39c736'}),
 bashCall:Object.freeze({offset:204057380,bytes:4930,sha256:'e9d139ea6239e6187533bb4ad795fe1ac92c8d753ffe2ae27739eb32e14ed20e'}),
 wrapper:Object.freeze({offset:200550111,bytes:2286,sha256:'b1be40cd129d27f6e1575e62240fa6aa8f4d602489047c2e847f27d8f49ec4df'}),
 postToolUseBoundary:Object.freeze({offset:203746350,bytes:4300,sha256:'cccbefdbb0cac3bb6a9d7e54c409b75eceb5ec5853f19cadab12fd823ba42129'})});
const sha=v=>createHash('sha256').update(v).digest('hex'),hash=/^[a-f0-9]{64}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const full=(pattern,value)=>typeof value==='string'&&pattern.exec(value)?.[0]===value;
const randomUuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function normalTimestamp(value){
 // Mn's normal native user frame uses Date.toISOString. This is framing only:
 // neither age, wall clock nor timestamp establishes freshness or origin facts.
 if(!full(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/,value))return false;
 const milliseconds=Date.parse(value);return Number.isFinite(milliseconds)&&new Date(milliseconds).toISOString()===value;
}
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const freeze=v=>{if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v);}return v;};
const authority=fields=>freeze({schema:1,scope:'SINGLE_DIRECT_NATIVE_STDIO_PRECONDITION_ONLY',interpretation:NATIVE_STDIO_DIRECT_INTERPRETATION,...fields,
 helperKernelClose:'NOT_OBSERVED',helperReap:'NOT_OBSERVED',helperSignal:'NOT_OBSERVED',
 nativeEnforcement:'NOT_ESTABLISHED',stdioOwnership:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
function foregroundResult(event,item){
 const raw=event.tool_use_result;
 if(!exact(raw,['stdout','stderr','interrupted','isImage','noOutputExpected'])||typeof raw.stdout!=='string'||Buffer.byteLength(raw.stdout)>4096||raw.stderr!==''||
   raw.interrupted!==false||raw.isImage!==false||raw.noOutputExpected!==false||item.is_error!==false||typeof item.content!=='string')return null;
 const rendered=raw.stdout.replace(/^(\s*\n)+/,'').trimEnd();
 if(item.content!==rendered||Buffer.byteLength(rendered)>4096)return null;
 const metadata=parseNativeStdioMetadata(raw.stdout),also=parseNativeStdioMetadata(item.content);
 if(!metadata||!also||JSON.stringify(metadata)!==JSON.stringify(also))return null;
 return metadata;
}

// completion supplies actual outer native close + independently current build
// and controlled startup facts. JSON booleans from a model are not that evidence.
export function interpretDirectNativeStdioProbeTrace(events,binding,completion){
 const unknown=(reason,fields={})=>authority({outcome:'UNKNOWN',reason,...fields});
 if(!isNativeStdioDiagnosticData(events)||!isNativeStdioDiagnosticData(binding)||!isNativeStdioDiagnosticData(completion)||!Array.isArray(events)||events.length>64||
   Buffer.byteLength(JSON.stringify(events))>2097152)return unknown('INPUT_UNAVAILABLE');
 if(!exact(binding,['hostBase','helperSha256','sourceSha256','nativeSha256'])||!full(hash,binding.helperSha256)||binding.sourceSha256!==NATIVE_STDIO_SOURCE_SHA256||binding.nativeSha256!==REVIEWED_CLAUDE_NATIVE.sha256)return unknown('IDENTITY_BINDING_UNKNOWN');
 let command;try{command=nativeStdioDirectCommand(binding.hostBase);}catch{return unknown('IDENTITY_BINDING_UNKNOWN');}
 const cwd=binding.hostBase+'/prefix/native-probes';let init=false,session=null,tool=null,metadata=null,final=null,reason=null;const messages=new Set();
 const reject=v=>{reason??=v;};
 for(const event of events){
  if(!event||typeof event!=='object'||Array.isArray(event)){reject('STREAM_MALFORMED');continue;}
  if(event.type==='system'&&event.subtype==='init'){
   if(init||final||event.claude_code_version!==REVIEWED_CLAUDE_NATIVE.version||event.cwd!==cwd||event.apiKeySource!=='none'||event.permissionMode!=='dontAsk'||JSON.stringify(event.tools)!=='["Bash"]'||
    !Array.isArray(event.mcp_servers)||event.mcp_servers.length||!Array.isArray(event.plugins)||event.plugins.length||!full(uuid,event.session_id)){reject('NATIVE_INITIAL_CONTEXT');continue;}
   init=true;session=event.session_id;continue;
  }
  if(event.type==='assistant'){
   if(!init||final||event.session_id!==session||event.parent_tool_use_id!==null||event.message?.role!=='assistant'||typeof event.message.id!=='string'||event.message.id.length>128||!Array.isArray(event.message.content)){reject('NATIVE_ASSISTANT_CONTEXT');continue;}
   messages.add(event.message.id);if(messages.size>4){reject('NATIVE_TURN_LIMIT');continue;}
   for(const item of event.message.content){
    if(!['text','thinking','redacted_thinking','tool_use'].includes(item?.type)){reject('NATIVE_ASSISTANT_CONTENT');continue;}
    if(item.type!=='tool_use')continue;
    const input=item.input;
    if(tool||item.name!=='Bash'||!full(/^toolu_[A-Za-z0-9]{6,100}$/,item.id)||!input||typeof input!=='object'||Array.isArray(input)||input.command!==command||Object.keys(input).some(k=>!['command','timeout','description'].includes(k))||
     !Object.hasOwn(input,'timeout')||!Number.isInteger(input.timeout)||input.timeout<1||input.timeout>15000||Object.hasOwn(input,'description')&&typeof input.description!=='string'){reject('NATIVE_TOOL_SCOPE');continue;}
    tool={id:item.id,commandSha256:sha(command)};
   }continue;
  }
  if(event.type==='user'){
   if(!init||final||metadata||event.session_id!==session||event.parent_tool_use_id!==null||event.message?.role!=='user'||!Array.isArray(event.message.content)||event.message.content.length!==1||
     !full(randomUuid,event.uuid)||!normalTimestamp(event.timestamp)||Object.hasOwn(event,'isSynthetic')&&event.isSynthetic!==false||
     Object.keys(event).some(k=>!['type','session_id','parent_tool_use_id','message','tool_use_result','uuid','timestamp','isSynthetic'].includes(k))){reject('NATIVE_RESULT_CONTEXT');continue;}
   const item=event.message.content[0];
   if(!tool||!exact(item,['type','tool_use_id','content','is_error'])||item.type!=='tool_result'||item.tool_use_id!==tool.id){reject('NATIVE_RESULT_ID');continue;}
   const result=foregroundResult(event,item);if(!result){reject('FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');continue;}metadata=result;continue;
  }
  if(event.type==='result'){
   if(!init||!tool||!metadata||final||event.session_id!==session||!Number.isInteger(event.num_turns)||event.num_turns<1||event.num_turns>4||typeof event.is_error!=='boolean'){reject('NATIVE_FINAL_CONTEXT');continue;}
   final={success:event.subtype==='success'&&!event.is_error};continue;
  }
  if(event.type==='system'&&event.subtype==='thinking_tokens'&&init&&!final&&exact(event,['type','subtype','estimated_tokens','estimated_tokens_delta','uuid','session_id'])&&full(uuid,event.uuid)&&event.session_id===session&&
   typeof event.estimated_tokens==='number'&&event.estimated_tokens>=0&&event.estimated_tokens<=1000000&&typeof event.estimated_tokens_delta==='number'&&event.estimated_tokens_delta>=0&&event.estimated_tokens_delta<=event.estimated_tokens)continue;
  if(event.type==='rate_limit_event'){if(Object.hasOwn(event,'session_id')&&event.session_id!==session)reject('NATIVE_SESSION_CONTEXT');continue;}
  reject('NATIVE_STREAM_UNKNOWN');
 }
 if(reason||!init||!tool||!metadata||!final?.success)return unknown(reason??'NATIVE_TRACE_INCOMPLETE');
 const observed={metadata,toolUseId:tool.id,commandSha256:tool.commandSha256,helperSha256:binding.helperSha256};
 if(!exact(completion,['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','sourceSha256','helperSha256','nativeSha256','nativeExit','nativeSignal','timedOut','reaped','startupPreconditions','noHooksCurrent','controlledShellStartup'])||
  completion.sourceCurrent!==true||completion.helperCurrent!==true||completion.reviewedBuildMatches!==true||completion.nativeCurrent!==true||completion.sourceSha256!==binding.sourceSha256||completion.helperSha256!==binding.helperSha256||completion.nativeSha256!==binding.nativeSha256||
  completion.nativeExit!==0||completion.nativeSignal!==null||completion.timedOut!==false||completion.reaped!==true||completion.startupPreconditions!==true||completion.noHooksCurrent!==true||completion.controlledShellStartup!==true)return unknown('EXTERNAL_NATIVE_BUILD_OR_STARTUP_PRECONDITION_MISSING',observed);
 const process={helperProcessOutcome:'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO',exitInterpretationSource:NATIVE_STDIO_FOREGROUND_SOURCE.nativeSha256};
 if(metadata.dev_null.lstat!=='OK'||metadata.dev_null.type==='UNKNOWN'||metadata.descriptors.some(r=>r.fstat!=='OK'||r.fcntl!=='OK'||r.type==='UNKNOWN'||r.access==='UNKNOWN'))return unknown('DESCRIPTOR_METADATA_UNAVAILABLE',{...observed,...process});
 const compatible=metadata.fd0_matches_dev_null===true&&metadata.descriptors[0].access==='READ_ONLY'&&metadata.descriptors.slice(1).every(r=>r.type==='FIFO'&&r.access==='WRITE_ONLY');
 return authority({outcome:compatible?'OBSERVED_COMPATIBLE':'OBSERVED_INCOMPATIBLE',reason:'SINGLE_DIRECT_NATIVE_FOREGROUND_METADATA_OBSERVED',...observed,...process});
}
