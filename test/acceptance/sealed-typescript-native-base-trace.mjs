// Fixed diagnostic native-event interpretation only. No native/auth/model launch.
// This cannot prove current code, effective permissions, account or namespace.
import {parsePortableJson} from '../../src/portable-envelope.mjs';
import {parseSealedTypeScriptBaseExchangeResult} from './sealed-typescript-base-exchange-result.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const reason=new Set(['RESULT_INVALID','MULTIPLE_RESULTS','LIFECYCLE_INVALID','HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS','LIFECYCLE_UNAVAILABLE','CHILD_COLLECTION_INCOMPLETE']);
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const fields=['schema','scope','outcome','helperResult','implementedAssertionsOutcome','checks','lifecycleOutcome','exitCode','signal','timedOut','reason_code','observations','nativeEnforcement','noInheritedWritableHandlesVerified','sealed','reuseEligible','collectionComplete','sourceProvenance'];
const fail=()=>{throw Object.assign(Error('NATIVE_BASE_RESULT_INVALID'),{code:'NATIVE_BASE_RESULT_INVALID'});};
function collection(content,isError){
 const pieces=typeof content==='string'?[content]:Array.isArray(content)&&content.every(p=>p?.type==='text'&&typeof p.text==='string')?content.map(p=>p.text):null;
 // Pinned native187 JL/d_o/qye nonzero Bash format only. No arbitrary line
 // scanning, hidden stderr, truncation marker or extra document is discarded.
 if(!pieces||pieces.length!==1||Buffer.byteLength(pieces[0])>8192)fail();
 let text=pieces[0],wrapper=null;const prefix=/^Exit code (1|74)\n/.exec(text);if(prefix){wrapper=Number(prefix[1]);text=text.slice(prefix[0].length);}const v=parsePortableJson(text);if(v?.scope!=='BASE_EXCHANGE_RESULT_DATA_ONLY')fail();
 if(Object.keys(v).length!==fields.length||!fields.every(key=>Object.hasOwn(v,key))||v.schema!==1||!['FAIL','UNKNOWN'].includes(v.outcome)||
  !['FAIL','UNKNOWN',null].includes(v.helperResult)||!['FAIL','UNKNOWN','ALL_IMPLEMENTED_ROWS_OBSERVED'].includes(v.implementedAssertionsOutcome)||
  !['SIGNALLED','EXPECTED_CHILD_EXIT_74_OBSERVED','OTHER_CHILD_EXIT_OBSERVED','UNKNOWN'].includes(v.lifecycleOutcome)||
  !(v.exitCode===null||Number.isInteger(v.exitCode)&&v.exitCode>=0&&v.exitCode<=255)||!(v.signal===null||signals.has(v.signal))||v.signal!==null&&v.exitCode!==null||
  !(v.timedOut===null||typeof v.timedOut==='boolean')||!reason.has(v.reason_code)||![0,1].includes(v.observations)||typeof v.collectionComplete!=='boolean'||
  v.nativeEnforcement!=='NOT_ESTABLISHED'||v.noInheritedWritableHandlesVerified!==false||v.sealed!==false||v.reuseEligible!==false||v.sourceProvenance!=='NOT_ESTABLISHED_BY_COLLECTION')fail();
 let helper=null;if(v.checks!==null)helper=parseSealedTypeScriptBaseExchangeResult(JSON.stringify({schema:1,scope:'SYNTHETIC_WHOLE_BASE_ATOMIC_EXCHANGE_PROBE_RESULTS',result:v.helperResult,checks_passed:false,checks:v.checks,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false}));
 const failed=helper?.result==='FAIL';if(v.outcome!==(failed?'FAIL':'UNKNOWN')||v.helperResult!==(helper?.result??null)||helper&&v.observations!==1)fail();
 const expected=v.lifecycleOutcome==='EXPECTED_CHILD_EXIT_74_OBSERVED';
 if(expected&&(v.exitCode!==74||v.signal!==null||v.timedOut!==false)||v.lifecycleOutcome==='SIGNALLED'&&(v.signal===null||v.exitCode!==null)||v.lifecycleOutcome==='OTHER_CHILD_EXIT_OBSERVED'&&v.exitCode===null)fail();
 if(v.reason_code==='HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS'&&!expected||v.reason_code==='LIFECYCLE_UNAVAILABLE'&&expected||
  v.collectionComplete&&(v.timedOut!==false||v.lifecycleOutcome==='UNKNOWN')||
  v.collectionComplete&&!['RESULT_INVALID',expected?'HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS':'LIFECYCLE_UNAVAILABLE'].includes(v.reason_code))fail();
 const observed=v.collectionComplete&&expected&&helper?.checks.slice(0,5).every(row=>row.result==='PASS'&&row.attempted)&&v.reason_code==='HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS';
 if(v.implementedAssertionsOutcome!==(failed?'FAIL':observed?'ALL_IMPLEMENTED_ROWS_OBSERVED':'UNKNOWN')||!v.collectionComplete&&v.reason_code!=='CHILD_COLLECTION_INCOMPLETE')fail();
 return Object.freeze({observed:Object.freeze({...v,checks:helper?.checks??null}),wrapperConsistent:wrapper===null||isError===true&&wrapper===(v.outcome==='FAIL'?1:74)});
}
export function createSealedTypeScriptNativeBaseTrace({command,cwd}){
 // Caller must derive this from its live private reviewed command proposal.
 const hosts=typeof command==='string'?/^'\/private\/tmp\/redue-ci-recipient-([a-f0-9]{8})\/runtime\/node-v22\.13\.0-darwin-arm64\/bin\/node' '\/private\/tmp\/redue-ci-recipient-([a-f0-9]{8})\/prefix\/native-probes\/base-exchange-collect\.mjs'$/.exec(command):null;
 if(!hosts||hosts[1]!==hosts[2]||typeof cwd!=='string'||!/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}\/Checkout 空间\/\.sealed-native-canaries$/.test(cwd))fail();
 let init=false,error=null,session=null,tool=null,result=null,knownFail=null,final=null;const messages=new Set();
 const reject=code=>{error??=code;};
 const consume=value=>{
  if(error)return; // Irreversible refusal, preserving any already reported FAIL.
  if(!value||typeof value!=='object'||Array.isArray(value)){reject('NATIVE_EVENT_INVALID');return;}
  if(final){if(value.type!=='rate_limit_event')reject('NATIVE_EVENT_AFTER_FINAL');return;}
  if(init&&Object.hasOwn(value,'session_id')&&value.session_id!==session){reject('NATIVE_SESSION_INVALID');return;}
  if(value.type==='system'&&value.subtype==='init'){
   if(init||value.claude_code_version!==REVIEWED_CLAUDE_NATIVE.version||value.cwd!==cwd||value.apiKeySource!=='none'||value.permissionMode!=='dontAsk'||JSON.stringify(value.tools)!=='["Bash"]'||!Array.isArray(value.plugins)||value.plugins.length||!Array.isArray(value.mcp_servers)||value.mcp_servers.length||!uuid.test(value.session_id??'')){reject('NATIVE_CONTEXT_INVALID');return;}init=true;session=value.session_id;return;
  }
  if(value.type==='assistant'){
   if(!init||value.parent_tool_use_id!==null||value.message?.role!=='assistant'||typeof value.message.id!=='string'||value.message.id.length>128||!Array.isArray(value.message.content)){reject('NATIVE_ASSISTANT_INVALID');return;}
   messages.add(value.message.id);if(messages.size>4){reject('NATIVE_TURN_LIMIT');return;}
   for(const item of value.message.content){if(!['tool_use','text','thinking','redacted_thinking'].includes(item?.type)){reject('NATIVE_ASSISTANT_CONTENT_UNREVIEWED');return;}if(item.type==='tool_use'){
    const input=item.input;if(tool||item.name!=='Bash'||!/^toolu_[A-Za-z0-9]{6,100}$/.test(item.id??'')||!input||typeof input!=='object'||Array.isArray(input)||input.command!==command||Object.keys(input).some(k=>!['command','timeout','description'].includes(k))||Object.hasOwn(input,'timeout')&&(!Number.isInteger(input.timeout)||input.timeout<1||input.timeout>15000)){reject('NATIVE_TOOL_INVALID');return;}tool={id:item.id};
   }}return;
  }
  if(value.type==='user'){
   if(value.parent_tool_use_id!==null||value.message?.role!=='user'||!Array.isArray(value.message.content)){reject('NATIVE_USER_INVALID');return;}
   for(const item of value.message.content){if(!['tool_result','text'].includes(item?.type)){reject('NATIVE_USER_CONTENT_UNREVIEWED');return;}if(item.type==='tool_result'){
    if(!init||!tool||result||item.tool_use_id!==tool.id||item.is_error!==undefined&&typeof item.is_error!=='boolean'){reject('NATIVE_RESULT_ID_INVALID');return;}
    try{const classified=collection(item.content,item.is_error),observed=classified.observed;if(observed.outcome==='FAIL')knownFail??=observed;if(!classified.wrapperConsistent){reject('NATIVE_RESULT_INVALID');return;}result={id:item.tool_use_id,tool_is_error:item.is_error===true,collection:observed};}catch{reject('NATIVE_RESULT_INVALID');}
   }}return;
  }
  if(value.type==='result'){
   if(!Number.isInteger(value.num_turns)||value.num_turns<1||value.num_turns>4||typeof value.is_error!=='boolean'){reject('NATIVE_FINAL_INVALID');return;}
   const success=value.subtype==='success'&&!value.is_error;
   if(success&&(!init||!tool||!result)){reject('NATIVE_FINAL_BEFORE_RESULT');return;}final={turns:value.num_turns,success};return;
  }
  if(value.type==='system'&&value.subtype==='thinking_tokens'&&init&&!error&&!final&&value.session_id===session&&Object.keys(value).length===6&&['type','subtype','estimated_tokens','estimated_tokens_delta','uuid','session_id'].every(k=>Object.hasOwn(value,k))&&uuid.test(value.uuid??'')&&[value.estimated_tokens,value.estimated_tokens_delta].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000)&&value.estimated_tokens_delta<=value.estimated_tokens)return;
  if(value.type!=='rate_limit_event')reject('NATIVE_EVENT_UNREVIEWED');
 };
 return Object.freeze({consume,snapshot:()=>({scope:'FIXED_NATIVE_BASE_TRACE_DATA_ONLY',init,error,tool,result,final,assistantMessages:messages.size,reportedFailedAssertion:knownFail,
  nativeProcessOutcome:'REQUIRES_PARENT_CLOSE_OBSERVATION',sourceAndAccountAuthority:'NOT_ESTABLISHED_BY_TRACE',sealed:false,reuseEligible:false})});
}
