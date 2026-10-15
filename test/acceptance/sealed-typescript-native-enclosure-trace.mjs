// Pure, fixed native187 BODY/TRACE syntax only. Original wire bytes are checked;
// public binding/completion JSON never authenticates a native process, interval,
// helper, origin or producer. No execution, filesystem, environment or model IO.
import {createHash} from 'node:crypto';
import {parseDirectNativeFrame,LIMITS} from './portable-claude-diagnostic.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {isNativeStdioDiagnosticData} from './sealed-typescript-native-stdio-probe.mjs';
import {parseSealedTypeScriptBaseExchangeResult as baseParse,createSealedTypeScriptBaseExchangeResultLatch as baseLatch} from './sealed-typescript-base-exchange-result.mjs';
import {parseSealedTypeScriptStageExchangeResult as exchangeParse,createSealedTypeScriptStageExchangeResultLatch as exchangeLatch} from './sealed-typescript-stage-exchange-result.mjs';
import {parseSealedTypeScriptStageResult as stageParse,createSealedTypeScriptStageResultLatch as stageLatch} from './sealed-typescript-stage-result.mjs';
import {parseSealedTypeScriptMapResult as mapParse,createSealedTypeScriptMapResultLatch as mapLatch} from './sealed-typescript-map-result.mjs';
export const NATIVE_ENCLOSURE_TRACE_INTERPRETATION='native187-fixed-enclosure-body-trace@1';
export const NATIVE_ENCLOSURE_BODY_BYTES=32694; // 32768 minus exact 74-byte private RDE2 header.
const roles=['whole_base','stage_exchange','node_stage','mapper'],exits=[74,74,1,74],stdoutLimits=[4096,4096,8192,4096];
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const reasons=new Set(['CLOCK_UNAVAILABLE','ACTOR_DEADLINE','DIRECT_KILL_UNAVAILABLE','ORIGINAL_END_UNAVAILABLE','ACTOR_REAP_DEADLINE','ACTOR_OUTPUT_LIMIT','ACTOR_START_OR_EXECUTION_ERROR','ACTOR_STDOUT_ERROR','ACTOR_STDERR_ERROR','ACTOR_STDERR_TYPE','ACTOR_STDERR_LIMIT','SPAWN_NOT_OBSERVED','KERNEL_CLOSE_UNAVAILABLE','ACTOR_PROTOCOL_UNAVAILABLE','ACTOR_COLLECTION_INCOMPLETE','ACTOR_START_FAILURE','ORIGINAL_BEGIN_UNAVAILABLE','REPORTED_ASSERTION_FAILED','FIXED_CANARY_COLLECTED_NOT_NATIVE_AUTHENTICATED']);
const freeze=v=>{if(v&&typeof v==='object'){for(const c of Object.values(v))freeze(c);Object.freeze(v);}return v;};
const authority=fields=>freeze({schema:1,scope:'FIXED_NATIVE_ENCLOSURE_BODY_TRACE_DATA_ONLY',interpretation:NATIVE_ENCLOSURE_TRACE_INTERPRETATION,...fields,
 publicDataOnly:true,nativeAuthenticated:false,nativeEnforcement:'NOT_ESTABLISHED',helperKernelClose:'NOT_AUTHENTICATED',helperReap:'NOT_AUTHENTICATED',nativeIntervalBarrier:'NOT_ESTABLISHED',originAuthority:false,receiptAuthority:false,recordAdoptionAuthority:false,sealed:false,reuseEligible:false});
const guard=v=>{if(!v)throw Error('ENCLOSURE_DATA_INVALID');};
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const full=(pattern,v)=>typeof v==='string'&&pattern.exec(v)?.[0]===v;
const digest=v=>full(/^[a-f0-9]{64}$/,v),integer=v=>Number.isSafeInteger(v)&&!Object.is(v,-0)&&v>=0;
const hash=v=>createHash('sha256').update(v).digest('hex');
function bytes(value,limit){guard(typeof value==='string'||value instanceof Uint8Array);if(typeof value==='string'){guard(Buffer.byteLength(value)<=limit);const b=Buffer.from(value);guard(b.toString('utf8')===value);return b;}guard(value.byteLength<=limit);return Buffer.from(value);}
function data(value){try{return isNativeStdioDiagnosticData(value);}catch{return false;}}
// Fixed role-check projection validation, never a received actor
// envelope, runtime lifecycle observation or reconstructed origin fact.
function stageMissing(checks){
 const row=name=>checks.find(r=>r?.name===name);
 if(row('fresh_synthetic_fixture_readable')?.result!=='PASS'||row('owned_workspace_write_permitted')?.result!=='PASS')return ['STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED','MAP_SHARED_WRITABLE_MAPPING_DENIED'];
 const missing=['MAP_SHARED_WRITABLE_MAPPING_DENIED','STAGE_PARENT_ATOMIC_EXCHANGE_DENIED','BASE_ATOMIC_EXCHANGE_DENIED'];
 if(row('case_alias_resolves_to_same_stage_canary')?.result!=='PASS')missing.push('CASE_ALIAS_PREREQUISITE_NOT_ESTABLISHED');
 const link=row('outside_hardlink_creation_denied');if(link?.reason_code!=='ACCESS_SUCCEEDED')missing.push(link?.reason_code==='DENIED_PERMISSION_ERROR'?'NOT_PERFORMED_PREREQUISITE_DENIED':'NOT_PERFORMED_PREREQUISITE_UNKNOWN');
 if(row('parent_symlink_resolves_to_same_stage_canary')?.result!=='PASS')missing.push('PARENT_SYMLINK_ALIAS_PREREQUISITE_NOT_ESTABLISHED');
 return missing;
}
function roleChecks(at,checks){
 guard(Array.isArray(checks));const parsers=[baseParse,exchangeParse,stageParse,mapParse],latches=[baseLatch,exchangeLatch,stageLatch,mapLatch],accepted=[];
 for(const result of ['UNKNOWN','FAIL']){
  let envelope;
  if(at<2)envelope={schema:1,scope:at===0?'SYNTHETIC_WHOLE_BASE_ATOMIC_EXCHANGE_PROBE_RESULTS':'SYNTHETIC_STAGE_ATOMIC_EXCHANGE_PROBE_RESULTS',result,checks_passed:false,checks,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false};
  else if(at===2)envelope={schema:1,scope:'SYNTHETIC_STAGED_TREE_BOUNDARY_PROBE_RESULTS',result,checks_passed:false,implemented_checks_passed:checks.filter(r=>r?.attempted).every(r=>r.result==='PASS'),checks,unperformed_assertions:stageMissing(checks),native_tool_boundary:'REQUIRES_ACTUAL_NATIVE_HOST_TRACE_AND_LIVE_FIXTURE_GATES',real_credentials_opened:false,compiler_executions:0,model_actions_requested:0,network_actions_requested:0,sealed:false,reuseEligible:false};
  else envelope={schema:1,scope:'SYNTHETIC_SHARED_MAPPING_PROBE_RESULTS',result,checks,native_boundary_verified:false,fresh_stage_and_no_inherited_rw_handles_verified:false,sealed:false,reuseEligible:false};
  try{const wire=JSON.stringify(envelope),parsed=parsers[at](wire);if(JSON.stringify(parsed.checks)!==JSON.stringify(checks))continue;
   // Hypothetical expected lifecycle derives ONLY check-row nominality using
   // the existing authoritative latch. Its envelope/process fields are never
   // returned or used as actual received lifecycle, origin or completion facts.
   const nominal=latches[at]().observe(wire,{exitCode:exits[at],signal:null,exitObserved:true,timedOut:false}).implementedAssertionsOutcome==='ALL_IMPLEMENTED_ROWS_OBSERVED';
   accepted.push({failed:parsed.result==='FAIL',nominal});
  }catch{}
 }
 guard(accepted.length===1);return accepted[0];
}
export function parseNativeEnclosureBody(input){
 try{
  const wire=bytes(input,NATIVE_ENCLOSURE_BODY_BYTES);guard(wire.length>0);const v=parseDirectNativeFrame(wire);
  guard(exact(v,['schema','scope','outcome','reason_code','begin','end','launchedCount','closedCount','allLaunchedDirectActorsReaped','phases','timedOut','elapsedMs','ownedGroupCleanupRequired','fixedNoProcessCreationPremise','nativeEnforcement','sealed','reuseEligible']));
  guard(v.schema===1&&v.scope==='ENCLOSED_FIXED_CANARY_DIAGNOSTICS_ONLY'&&['UNKNOWN','FAIL'].includes(v.outcome)&&reasons.has(v.reason_code)&&v.begin===true&&typeof v.end==='boolean'&&typeof v.timedOut==='boolean'&&typeof v.allLaunchedDirectActorsReaped==='boolean'&&typeof v.ownedGroupCleanupRequired==='boolean'&&v.fixedNoProcessCreationPremise==='REQUIRES_EXACT_REVIEWED_ACTOR_AND_NODE_IMPLEMENTATIONS'&&v.nativeEnforcement==='NOT_ESTABLISHED'&&v.sealed===false&&v.reuseEligible===false);
  guard(integer(v.launchedCount)&&v.launchedCount>=1&&v.launchedCount<=4&&integer(v.closedCount)&&v.closedCount<=v.launchedCount&&Array.isArray(v.phases)&&v.phases.length===v.launchedCount);
  guard(v.elapsedMs===null?v.reason_code==='CLOCK_UNAVAILABLE':typeof v.elapsedMs==='number'&&Number.isFinite(v.elapsedMs)&&!Object.is(v.elapsedMs,-0)&&v.elapsedMs>=0&&v.elapsedMs<15000);
  let failures=0;
  for(let at=0;at<v.phases.length;at++){
   const p=v.phases[at];guard(exact(p,['role','spawnObserved','closeObserved','exitObserved','exitCode','signal','outcome','implementedAssertionsOutcome','checks','stdoutBytes','stderrBytes']));
   guard(p.role===roles[at]&&['spawnObserved','closeObserved','exitObserved'].every(k=>typeof p[k]==='boolean')&&(p.exitCode===null||integer(p.exitCode)&&p.exitCode<=255)&&(p.signal===null||signals.has(p.signal))&&!(p.exitCode!==null&&p.signal!==null)&&['UNKNOWN','FAIL'].includes(p.outcome)&&['UNKNOWN','FAIL','ALL_IMPLEMENTED_ROWS_OBSERVED'].includes(p.implementedAssertionsOutcome)&&integer(p.stdoutBytes)&&p.stdoutBytes>0&&p.stdoutBytes<=stdoutLimits[at]&&integer(p.stderrBytes));
   guard(!p.exitObserved||p.spawnObserved&&p.closeObserved&&(p.exitCode!==null||p.signal!==null));guard(p.closeObserved||!p.exitObserved&&p.exitCode===null&&p.signal===null);
   const checked=roleChecks(at,p.checks);guard(checked.failed===(p.outcome==='FAIL'));failures+=Number(checked.failed);
   const normal=p.spawnObserved&&p.closeObserved&&p.exitObserved&&p.exitCode===exits[at]&&p.signal===null&&p.stderrBytes===0;
   if(at<v.phases.length-1||v.outcome==='UNKNOWN')guard(normal&&checked.nominal&&p.outcome==='UNKNOWN'&&p.implementedAssertionsOutcome==='ALL_IMPLEMENTED_ROWS_OBSERVED');
   else{
    // FAIL is retained assertion data, not lifecycle completeness. A closed
    // actor's FAIL may precede a later END refusal; an unfinished actor's
    // validated failure is retained by finish() even when reap times out.
    // Closed FAIL still requires the original normal close predicates; no
    // missing close/END is invented and all aggregate guards remain below.
    guard(p.outcome==='FAIL');
    guard(p.closeObserved?p.implementedAssertionsOutcome==='UNKNOWN'||p.implementedAssertionsOutcome==='FAIL'&&normal:p.implementedAssertionsOutcome==='FAIL');
   }
  }
  const all=v.phases.every(p=>p.spawnObserved&&p.closeObserved&&p.exitObserved),closed=v.phases.filter(p=>p.closeObserved&&p.exitObserved).length;
  guard(v.closedCount===closed&&v.allLaunchedDirectActorsReaped===all&&failures===(v.outcome==='FAIL'?1:0));
  guard(!v.end||all&&!v.timedOut&&v.elapsedMs!==null&&v.elapsedMs<11000&&!v.ownedGroupCleanupRequired);
  if(v.outcome==='UNKNOWN')guard(v.launchedCount===4&&v.end&&!v.timedOut&&all&&!v.ownedGroupCleanupRequired&&v.reason_code==='FIXED_CANARY_COLLECTED_NOT_NATIVE_AUTHENTICATED');
  else{guard(!['FIXED_CANARY_COLLECTED_NOT_NATIVE_AUTHENTICATED','ORIGINAL_BEGIN_UNAVAILABLE'].includes(v.reason_code));guard(v.ownedGroupCleanupRequired===(v.reason_code!=='REPORTED_ASSERTION_FAILED'));if(v.reason_code==='REPORTED_ASSERTION_FAILED')guard(v.end&&all&&!v.timedOut&&v.phases.at(-1).implementedAssertionsOutcome==='FAIL');}
  return authority({outcome:v.outcome,bodySyntaxValid:true,reportedAssertionOutcome:v.outcome,body:v});
 }catch{return authority({outcome:'UNKNOWN',bodySyntaxValid:false,reportedAssertionOutcome:'UNKNOWN',reason:'BODY_INVALID'});}
}
const bindingKeys=['hostBase','baseA','command','cwd','sourceVersion','projectionVersion','projectionSha256','binarySha256','nativeSha256','nativeVersion','transportInterpretation'];
function validBinding(b){
 try{if(!data(b)||!exact(b,bindingKeys))return null;
 b=Object.fromEntries(bindingKeys.map(k=>[k,Object.getOwnPropertyDescriptor(b,k).value]));
 const root=/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/;
 const valid=full(root,b.hostBase)&&full(root,b.baseA)&&b.hostBase!==b.baseA&&b.command===`exec '${b.hostBase}/prefix/native-probes/paired-stage-enclosure'`&&b.cwd===b.baseA+'/Checkout 空间/.sealed-native-canaries'&&b.sourceVersion==='fixed-canary-finite-enclosure-source@2'&&b.projectionVersion==='fixed-canary-original-input-projection@3'&&digest(b.projectionSha256)&&digest(b.binarySha256)&&b.nativeSha256===REVIEWED_CLAUDE_NATIVE.sha256&&b.nativeVersion===REVIEWED_CLAUDE_NATIVE.version&&b.transportInterpretation==='finite-enclosure-normal-collection@2';
 return valid?Object.freeze(b):null;}catch{return null;}
}
const completionKeys=['sourceCurrent','enclosureCurrent','reviewedBuildMatches','nativeCurrent','startupPreconditions','noHooksCurrent','postNativeEndpointCurrent','sourceVersion','projectionVersion','projectionSha256','binarySha256','nativeSha256','transportInterpretation','nativeExit','nativeSignal','timedOut','reaped','nativeSpawnObserved','nativeCloseObserved','nativeMilliseconds'];
function validCompletion(c,b){
 try{if(!data(c)||!exact(c,completionKeys))return false;
 c=Object.fromEntries(completionKeys.map(k=>[k,Object.getOwnPropertyDescriptor(c,k).value]));
 return ['sourceCurrent','enclosureCurrent','reviewedBuildMatches','nativeCurrent','startupPreconditions','noHooksCurrent','postNativeEndpointCurrent','reaped','nativeSpawnObserved','nativeCloseObserved'].every(k=>c[k]===true)&&['sourceVersion','projectionVersion','projectionSha256','binarySha256','nativeSha256','transportInterpretation'].every(k=>c[k]===b[k])&&c.nativeExit===0&&c.nativeSignal===null&&c.timedOut===false&&typeof c.nativeMilliseconds==='number'&&Number.isFinite(c.nativeMilliseconds)&&c.nativeMilliseconds>=0&&!Object.is(c.nativeMilliseconds,-0)&&c.nativeMilliseconds<120000;}catch{return false;}
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,randomUuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function timestamp(v){if(!full(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/,v))return false;const ms=Date.parse(v);return Number.isFinite(ms)&&new Date(ms).toISOString()===v;}
function foreground(event,item){
 const raw=event.tool_use_result;
 if(!exact(raw,['stdout','stderr','interrupted','isImage','noOutputExpected'])||typeof raw.stdout!=='string'||Buffer.byteLength(raw.stdout)>NATIVE_ENCLOSURE_BODY_BYTES||raw.stderr!==''||raw.interrupted!==false||raw.isImage!==false||raw.noOutputExpected!==false||item.is_error!==false||typeof item.content!=='string')return null;
 const rendered=raw.stdout.replace(/^(\s*\n)+/,'').trimEnd();if(item.content!==rendered||Buffer.byteLength(item.content)>NATIVE_ENCLOSURE_BODY_BYTES)return null;
 const a=parseNativeEnclosureBody(raw.stdout),b=parseNativeEnclosureBody(item.content);
 return a.bodySyntaxValid&&b.bodySyntaxValid&&JSON.stringify(a.body)===JSON.stringify(b.body)?a:null;
}
// Original bounded NDJSON bytes only. Event arrays and reserialized caller
// objects are not accepted as a claim that duplicate wire keys were checked.
export function interpretNativeEnclosureTrace(input,binding,completion){
 let reason=null,init=false,session=null,tool=null,result=null,final=false,frameCount=0;const messages=new Set();
 const reject=v=>{reason??=v;};
 const response=()=>{
  const syntax=!reason&&init&&!!tool&&!!result&&final,completed=syntax&&validCompletion(completion,binding);
  return authority({outcome:result?.outcome==='FAIL'?'FAIL':'UNKNOWN',reportedAssertionOutcome:result?.outcome==='FAIL'?'FAIL':'UNKNOWN',traceSyntaxValid:syntax,completionDataValid:completed,reason:reason??(!syntax?'NATIVE_TRACE_INCOMPLETE':!completed?'COMPLETION_DATA_UNAVAILABLE':'SYNTACTIC_COLLECTION_ONLY'),body:result?.body??null,toolUseId:tool?.id??null,commandSha256:tool?hash(binding.command):null,frameCount});
 };
 const selectedBinding=validBinding(binding);if(!selectedBinding)return authority({outcome:'UNKNOWN',reportedAssertionOutcome:'UNKNOWN',traceSyntaxValid:false,completionDataValid:false,reason:'IDENTITY_BINDING_UNKNOWN'});
 binding=selectedBinding;
 let wire;try{wire=bytes(input,LIMITS.streamBytes);}catch{return authority({outcome:'UNKNOWN',reportedAssertionOutcome:'UNKNOWN',traceSyntaxValid:false,completionDataValid:false,reason:'WIRE_INPUT_UNAVAILABLE'});}
 let start=0;
 while(start<wire.length){
  const end=wire.indexOf(10,start);if(end<0){reject('NATIVE_STREAM_INCOMPLETE');break;}const line=wire.subarray(start,end);start=end+1;
  if(line.length>LIMITS.lineBytes||frameCount>=64){reject('NATIVE_STREAM_LIMIT');break;}frameCount++;
  let e;try{e=parseDirectNativeFrame(line);}catch{reject('NATIVE_STREAM_MALFORMED');break;}
  if(!data(e)||!e||typeof e!=='object'||Array.isArray(e)){reject('NATIVE_STREAM_MALFORMED');break;}
  if(e.type==='system'&&e.subtype==='init'){
   if(init||final||e.claude_code_version!==binding.nativeVersion||e.cwd!==binding.cwd||e.apiKeySource!=='none'||e.permissionMode!=='dontAsk'||JSON.stringify(e.tools)!=='["Bash"]'||!Array.isArray(e.mcp_servers)||e.mcp_servers.length||!Array.isArray(e.plugins)||e.plugins.length||!full(uuid,e.session_id)){reject('NATIVE_INITIAL_CONTEXT');break;}
   init=true;session=e.session_id;continue;
  }
  if(e.type==='assistant'){
   if(!init||final||e.session_id!==session||e.parent_tool_use_id!==null||e.message?.role!=='assistant'||typeof e.message.id!=='string'||e.message.id.length<1||e.message.id.length>128||!Array.isArray(e.message.content)){reject('NATIVE_ASSISTANT_CONTEXT');break;}
   messages.add(e.message.id);if(messages.size>4){reject('NATIVE_TURN_LIMIT');break;}
   for(const item of e.message.content){
    if(!['text','thinking','redacted_thinking','tool_use'].includes(item?.type)){reject('NATIVE_ASSISTANT_CONTENT');break;}
    if(item.type!=='tool_use')continue;const i=item.input;
    if(tool||item.name!=='Bash'||!full(/^toolu_[A-Za-z0-9]{6,100}$/,item.id)||!i||typeof i!=='object'||Array.isArray(i)||i.command!==binding.command||Object.keys(i).some(k=>!['command','timeout','description'].includes(k))||!Object.hasOwn(i,'timeout')||!Number.isInteger(i.timeout)||i.timeout<1||i.timeout>15000||Object.hasOwn(i,'description')&&typeof i.description!=='string'){reject('NATIVE_TOOL_SCOPE');break;}
    tool={id:item.id};
   }if(reason)break;continue;
  }
  if(e.type==='user'){
   if(!init||final||result||e.session_id!==session||e.parent_tool_use_id!==null||e.message?.role!=='user'||!Array.isArray(e.message.content)||e.message.content.length!==1||!full(randomUuid,e.uuid)||!timestamp(e.timestamp)||Object.hasOwn(e,'isSynthetic')&&e.isSynthetic!==false||Object.keys(e).some(k=>!['type','session_id','parent_tool_use_id','message','tool_use_result','uuid','timestamp','isSynthetic'].includes(k))){reject('NATIVE_RESULT_CONTEXT');break;}
   const item=e.message.content[0];if(!tool||!exact(item,['type','tool_use_id','content','is_error'])||item.type!=='tool_result'||item.tool_use_id!==tool.id){reject('NATIVE_RESULT_ID');break;}
   const parsed=foreground(e,item);if(!parsed){reject('FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');break;}result=parsed;continue;
  }
  if(e.type==='result'){
   if(!init||!tool||!result||final||e.session_id!==session||!Number.isInteger(e.num_turns)||e.num_turns<1||e.num_turns>4||e.subtype!=='success'||e.is_error!==false){reject('NATIVE_FINAL_CONTEXT');break;}final=true;continue;
  }
  if(e.type==='system'&&e.subtype==='thinking_tokens'&&init&&!final&&exact(e,['type','subtype','estimated_tokens','estimated_tokens_delta','uuid','session_id'])&&full(uuid,e.uuid)&&e.session_id===session&&typeof e.estimated_tokens==='number'&&Number.isFinite(e.estimated_tokens)&&e.estimated_tokens>=0&&e.estimated_tokens<=1000000&&typeof e.estimated_tokens_delta==='number'&&Number.isFinite(e.estimated_tokens_delta)&&e.estimated_tokens_delta>=0&&e.estimated_tokens_delta<=e.estimated_tokens)continue;
  if(e.type==='rate_limit_event'&&init&&!final&&(!Object.hasOwn(e,'session_id')||e.session_id===session))continue;
  reject('NATIVE_STREAM_UNKNOWN');break;
 }
 return response();
}
