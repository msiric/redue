// Fixed native187 foreground interpretation only. No native/helper/model/file IO.
// Actual public native user.tool_use_result + matching renderer are mandatory.
// This source-derived command-zero claim is NOT C kernel-close, signal or reap
// observation. No prose, mock, config or cleanup result proves enforcement/seal.
import {createHash} from 'node:crypto';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {nativeStdioDirectCommand,parseNativeStdioMetadata,isNativeStdioDiagnosticData,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';

import {parseNativeStartupWitness,NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,NATIVE_STARTUP_WITNESS_FIELDS} from './sealed-typescript-native-startup-witness.mjs';
export const NATIVE_STARTUP_WITNESS_DIRECT_INTERPRETATION='native187-direct-bash-child-startup-foreground@1';
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
// Post-refusal shape metadata only, for previously validated plain JSON. No
// body/value, arbitrary key name, path, length or hash is retained. Diagnostics
// never admit this shape. Non-object containers expose no element/key details.
function foregroundShapeSummary(event,item,raw){
 const known=['stdout','stderr','interrupted','rawOutputPath','isImage','backgroundTaskId','backgroundedByUser','dangerouslyDisableSandbox','returnCodeInterpretation','noOutputExpected','structuredContent','persistedOutputPath','persistedOutputSize','staleReadFileStateHint','ghRateLimitHint','gitOperation'];
 const present=Object.hasOwn(event,'tool_use_result'),kind=!present?'absent':raw===null?'null':Array.isArray(raw)?'array':typeof raw;
 const object=kind==='object',descriptor=Object.getOwnPropertyDescriptor(item,'is_error');
 return {rawOwnPropertyPresent:present,rawContainerKind:kind,knownFieldPresence:Object.fromEntries(known.map(key=>[key,object&&Object.hasOwn(raw,key)])),
  unknownKeysPresent:object&&Object.keys(raw).some(key=>!known.includes(key)),
  itemIsErrorState:!descriptor?'MISSING':!Object.hasOwn(descriptor,'value')?'UNSUPPORTED':descriptor.value===false?'FALSE':descriptor.value===true?'TRUE':'UNSUPPORTED',
  ...(kind==='string'?{...foregroundErrorFormat(raw),errorMarkers:foregroundErrorMarkers(raw)}:{})};
}
// Finite string-format diagnostics only, not native error identity, cause,
// sandbox enforcement or process-observed exit. Never retain any body/prefix.
function foregroundErrorFormat(raw){
 let errorFormat='OTHER',formatDerivedExitCode=null;
 if(raw==='Error: Sandbox is required but failed to initialize. Restart to retry.')errorFormat='EXACT_REQUIRED_SANDBOX_INIT_LITERAL';
 else if(raw==='Error: Sandbox is enabled but failed to initialize. Sandboxing is disabled for the rest of this session; restart to retry.')errorFormat='EXACT_ENABLED_SANDBOX_INIT_LITERAL';
 else if(raw.startsWith('Error calling tool (Bash): '))errorFormat='OUTER_BASH_CALL_ERROR_PREFIX';
 else {const matched=/^Error: Exit code (0|[1-9][0-9]{0,2})(?:\n|$)/.exec(raw);
  if(matched&&Number(matched[1])<=255){errorFormat='SHELL_EXIT_FIRST_LINE_FORMAT';formatDerivedExitCode=Number(matched[1]);}}
 return {errorFormat,formatDerivedExitCode};
}
// Fixed public-token presence only. No normalization or retained body, value,
// path, length, hash or dynamic name. Text may mimic every marker: these flags
// prove no output origin, helper execution, actual exit, permission or cause.
function foregroundErrorMarkers(raw){
 return {sandboxExec:raw.includes('sandbox-exec:'),sandboxApply:raw.includes('sandbox_apply:'),
  operationNotPermitted:raw.includes('Operation not permitted'),permissionDenied:raw.includes('Permission denied'),
  noSuchFile:raw.includes('No such file or directory'),commandNotFound:raw.includes('command not found'),
  badInterpreter:raw.includes('bad interpreter'),cannotExecute:raw.includes('cannot execute'),cannotOpen:raw.includes('cannot open'),
  unboundVariable:raw.includes('unbound variable'),syntaxError:raw.includes('syntax error'),readOnlyFilesystem:raw.includes('Read-only file system'),
  dyld:raw.includes('dyld['),libraryNotLoaded:raw.includes('Library not loaded'),bashPath:raw.includes('/bin/bash'),
  helperLeaf:raw.includes('/native-stdio-probe'),nativeTmpPrefix:raw.includes('/tmp/claude-'),cwdLeaf:raw.includes('/cwd-'),
  snapshotDirectory:raw.includes('/shell-snapshots/'),pathHelper:raw.includes('/usr/libexec/path_helper'),
  profile:raw.includes('/etc/profile'),privateProfile:raw.includes('/private/etc/profile'),devNull:raw.includes('/dev/null'),
  helperMetadataScope:raw.includes('"scope":"NATIVE_CHILD_STARTUP_WITNESS_ONLY"')};
}
// Native headless nonallow history is not a final-denial or execution proof.
// Inspect only after primary raw-shape refusal, never to satisfy final/metadata.
function foregroundNonallowHistory(events,init,session,tool){
 const result=(status,matchingAcceptedToolNonallowRecord=null)=>({status,matchingAcceptedToolNonallowRecord});
 if(!init||!tool)return result('UNAVAILABLE');
 const candidates=events.filter(event=>event?.type==='result');if(candidates.length!==1)return result('UNAVAILABLE');
 const event=candidates[0];
 if(event.session_id!==session||typeof event.subtype!=='string'||!Number.isInteger(event.num_turns)||event.num_turns<1||event.num_turns>4||typeof event.is_error!=='boolean'||!Object.hasOwn(event,'permission_denials'))return result('UNAVAILABLE');
 const rows=event.permission_denials;if(!Array.isArray(rows))return result('MALFORMED');if(rows.length>64)return result('LIMIT_EXCEEDED');
 let match=false;
 for(const row of rows){
  if(!exact(row,['tool_name','tool_use_id','tool_input'])||typeof row.tool_name!=='string'||typeof row.tool_use_id!=='string'||row.tool_input===null||typeof row.tool_input!=='object'||Array.isArray(row.tool_input)||![Object.prototype,null].includes(Object.getPrototypeOf(row.tool_input)))return result('MALFORMED');
  if(row.tool_use_id===tool.id){if(row.tool_name!=='Bash')return result('MALFORMED');match=true;}
 }
 return result('OBSERVED',match);
}
function foregroundResult(event,item,witness,reportRefusal){
 const refused=(classification,value)=>{if(value)reportRefusal(classification,classification==='RAW_SHAPE_INVALID'?foregroundShapeSummary(event,item,raw):null);return value;};
 const raw=event.tool_use_result;
 // Each wrapper observes only its original reached predicate; no extra raw
 // access or unperformed assertion. Labels never contain native/model values.
 if(refused('RAW_SHAPE_INVALID',!exact(raw,['stdout','stderr','interrupted','isImage','noOutputExpected']))||refused('STDOUT_NOT_STRING',typeof raw.stdout!=='string')||refused('STDOUT_TOO_LARGE',Buffer.byteLength(raw.stdout)>4096)||refused('STDERR_NOT_EMPTY',raw.stderr!=='')||
   refused('INTERRUPTED_FLAG',raw.interrupted!==false)||refused('IMAGE_FLAG',raw.isImage!==false)||refused('NO_OUTPUT_EXPECTED_FLAG',raw.noOutputExpected!==false)||refused('TOOL_RESULT_ERROR_FLAG',item.is_error!==false)||refused('RENDERED_NOT_STRING',typeof item.content!=='string'))return null;
 const rendered=raw.stdout.replace(/^(\s*\n)+/,'').trimEnd();
 if(refused('RENDERED_MISMATCH',item.content!==rendered)||refused('RENDERED_TOO_LARGE',Buffer.byteLength(rendered)>4096))return null;
 const parse=witness?parseNativeStartupWitness:parseNativeStdioMetadata;
 const metadata=parse(raw.stdout),also=parse(item.content);
 // Both original parser calls above are mandatory even if the first fails.
 if(refused('RAW_METADATA_PARSE_FAILED',!metadata)||refused('RENDERED_METADATA_PARSE_FAILED',!also)||refused('METADATA_MISMATCH',JSON.stringify(metadata)!==JSON.stringify(also)))return null;
 return metadata;
}

// completion supplies actual outer native close + independently current build
// and controlled startup facts. JSON booleans from a model are not that evidence.
export function interpretDirectNativeStdioProbeTrace(events,binding,completion){return interpretFixedDirectTrace(events,binding,completion,false);}
// Child environment + stdio only. This does not prove controlled pre-main
// startup, credential protection or a seal; source/mock labels cannot supply it.
export function interpretDirectNativeStartupWitnessTrace(events,binding,completion){return interpretFixedDirectTrace(events,binding,completion,true);}
function interpretFixedDirectTrace(events,binding,completion,witness){
 const scopedAuthority=fields=>authority(witness?{scope:'SINGLE_DIRECT_NATIVE_CHILD_STARTUP_WITNESS_PRECONDITION_ONLY',interpretation:NATIVE_STARTUP_WITNESS_DIRECT_INTERPRETATION,
   controlledShellStartup:'NOT_ESTABLISHED',pathHelperProcessing:'NOT_ESTABLISHED',...fields}:fields);
 const unknown=(reason,fields={})=>scopedAuthority({outcome:'UNKNOWN',reason,...fields});
 if(!isNativeStdioDiagnosticData(events)||!isNativeStdioDiagnosticData(binding)||!isNativeStdioDiagnosticData(completion)||!Array.isArray(events)||events.length>64||
   Buffer.byteLength(JSON.stringify(events))>2097152)return unknown('INPUT_UNAVAILABLE');
 if(!exact(binding,witness?['hostBase','helperSha256','sourceSha256','nativeSha256','interpretation']:['hostBase','helperSha256','sourceSha256','nativeSha256'])||!full(hash,binding.helperSha256)||binding.sourceSha256!==(witness?NATIVE_STARTUP_WITNESS_SOURCE_SHA256:NATIVE_STDIO_SOURCE_SHA256)||witness&&binding.interpretation!==NATIVE_STARTUP_WITNESS_INTERPRETATION||binding.nativeSha256!==REVIEWED_CLAUDE_NATIVE.sha256)return unknown('IDENTITY_BINDING_UNKNOWN');
 let command;try{command=nativeStdioDirectCommand(binding.hostBase);}catch{return unknown('IDENTITY_BINDING_UNKNOWN');}
 const cwd=binding.hostBase+'/prefix/native-probes';let init=false,session=null,tool=null,metadata=null,final=null,reason=null,toolItemsObserved=0,toolScopeRefusal=null,foregroundRefusalClass=null,foregroundShape=null;const messages=new Set();
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
    toolItemsObserved++;const input=item.input;let refusalClass=null;
    // Classify only the first actually reached refusing operand, preserving the
    // original OR/property access order. No command, key/name/ID, description or
    // model text is retained. A prior accepted request proves no execution.
    const refused=(classification,value)=>{if(value)refusalClass=classification;return value;};
    if(refused('DUPLICATE_TOOL_REQUEST',tool)||refused('TOOL_NAME_MISMATCH',item.name!=='Bash')||refused('TOOL_ID_SHAPE',!full(/^toolu_[A-Za-z0-9]{6,100}$/,item.id))||
     refused('INPUT_ABSENT',!input)||refused('INPUT_NOT_OBJECT',typeof input!=='object')||refused('INPUT_ARRAY',Array.isArray(input))||
     refused('COMMAND_MISMATCH',input.command!==command)||refused('INPUT_EXTRA_KEYS',Object.keys(input).some(k=>!['command','timeout','description'].includes(k)))||
     refused('TIMEOUT_MISSING',!Object.hasOwn(input,'timeout'))||refused('TIMEOUT_NOT_INTEGER',!Number.isInteger(input.timeout))||refused('TIMEOUT_BELOW_MINIMUM',input.timeout<1)||
     refused('TIMEOUT_ABOVE_MAXIMUM',input.timeout>15000)||refused('DESCRIPTION_NOT_STRING',Object.hasOwn(input,'description')&&typeof input.description!=='string')){
     toolScopeRefusal??={schema:1,scope:'STATIC_NATIVE_TOOL_REFUSAL_ONLY',classification:refusalClass,toolItemOrdinal:toolItemsObserved,priorAcceptedToolRequest:tool!==null};
     reject('NATIVE_TOOL_SCOPE');continue;
    }
    tool={id:item.id,commandSha256:sha(command)};
   }continue;
  }
  if(event.type==='user'){
   if(!init||final||metadata||event.session_id!==session||event.parent_tool_use_id!==null||event.message?.role!=='user'||!Array.isArray(event.message.content)||event.message.content.length!==1||
     !full(randomUuid,event.uuid)||!normalTimestamp(event.timestamp)||Object.hasOwn(event,'isSynthetic')&&event.isSynthetic!==false||
     Object.keys(event).some(k=>!['type','session_id','parent_tool_use_id','message','tool_use_result','uuid','timestamp','isSynthetic'].includes(k))){reject('NATIVE_RESULT_CONTEXT');continue;}
   const item=event.message.content[0];
   if(!tool||!exact(item,['type','tool_use_id','content','is_error'])||item.type!=='tool_result'||item.tool_use_id!==tool.id){reject('NATIVE_RESULT_ID');continue;}
   let refusalClass=null,shape=null;const result=foregroundResult(event,item,witness,(classification,summary)=>{refusalClass=classification;shape=summary;});if(!result){if(foregroundRefusalClass===null){foregroundRefusalClass=refusalClass;foregroundShape=shape;}reject('FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');continue;}metadata=result;continue;
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
 if(reason||!init||!tool||!metadata||!final?.success)return unknown(reason??'NATIVE_TRACE_INCOMPLETE',reason==='NATIVE_TOOL_SCOPE'?{toolScopeRefusal}:reason==='FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE'?{foregroundRefusalClass,...(foregroundRefusalClass==='RAW_SHAPE_INVALID'?{foregroundShape,nativeNonallowHistory:foregroundNonallowHistory(events,init,session,tool)}:{})}:{});
 const observed={metadata,toolUseId:tool.id,commandSha256:tool.commandSha256,helperSha256:binding.helperSha256};
 const completionKeys=['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','sourceSha256','helperSha256','nativeSha256','nativeExit','nativeSignal','timedOut','reaped','startupPreconditions','noHooksCurrent',witness?'interpretation':'controlledShellStartup'];
 if(!exact(completion,completionKeys)||
  completion.sourceCurrent!==true||completion.helperCurrent!==true||completion.reviewedBuildMatches!==true||completion.nativeCurrent!==true||completion.sourceSha256!==binding.sourceSha256||completion.helperSha256!==binding.helperSha256||completion.nativeSha256!==binding.nativeSha256||
  completion.nativeExit!==0||completion.nativeSignal!==null||completion.timedOut!==false||completion.reaped!==true||completion.startupPreconditions!==true||completion.noHooksCurrent!==true||(witness?completion.interpretation!==NATIVE_STARTUP_WITNESS_INTERPRETATION:completion.controlledShellStartup!==true))return unknown('EXTERNAL_NATIVE_BUILD_OR_STARTUP_PRECONDITION_MISSING',observed);
 const process={helperProcessOutcome:'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO',exitInterpretationSource:NATIVE_STDIO_FOREGROUND_SOURCE.nativeSha256};
 if(metadata.dev_null.lstat!=='OK'||metadata.dev_null.type==='UNKNOWN'||metadata.descriptors.some(r=>r.fstat!=='OK'||r.fcntl!=='OK'||r.type==='UNKNOWN'||r.access==='UNKNOWN'))return unknown('DESCRIPTOR_METADATA_UNAVAILABLE',{...observed,...process});
 const childMatches=!witness||NATIVE_STARTUP_WITNESS_FIELDS.every(k=>metadata.startup[k]===true);
 const compatible=childMatches&&metadata.fd0_matches_dev_null===true&&metadata.descriptors[0].access==='READ_ONLY'&&metadata.descriptors.slice(1).every(r=>r.type==='FIFO'&&r.access==='WRITE_ONLY');
 return scopedAuthority({outcome:compatible?'OBSERVED_COMPATIBLE':'OBSERVED_INCOMPATIBLE',reason:witness?'SINGLE_DIRECT_NATIVE_FOREGROUND_CHILD_CONTEXT_AND_METADATA_OBSERVED':'SINGLE_DIRECT_NATIVE_FOREGROUND_METADATA_OBSERVED',...observed,...process});
}
