// Read-only protocol data. No checker, fixture, native/tool authentication or
// sealing is performed. Reviewed checker template SHA-256:
// d206de2e8fa469768aecec6e7bf276a935a0071c470aa5b1ad053de6dd649671.
// The pinned checker always exits 1; its implemented
// rows never complete the currently missing mapping/atomic-exchange assertions.
import {parsePortableJson} from '../../src/portable-envelope.mjs';
const scope='SYNTHETIC_STAGED_TREE_BOUNDARY_PROBE_RESULTS';
const toolBoundary='REQUIRES_ACTUAL_NATIVE_HOST_TRACE_AND_LIVE_FIXTURE_GATES';
const codes=new Set(['FIXTURE_MATCHED','ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','ASSERTION_FAILED','UNKNOWN_OR_UNAVAILABLE']);
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fail=()=>{throw Object.assign(Error('STAGE_RESULT_INVALID'),{code:'STAGE_RESULT_INVALID'});};
function shape(value,keys){if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')))fail();}
export function parseSealedTypeScriptStageResult(bytes){
 try{if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||Buffer.byteLength(bytes)===0||Buffer.byteLength(bytes)>8192)fail();const value=parsePortableJson(bytes);
  if(value?.scope==='PROPOSAL_ONLY'){
   shape(value,['schema','scope','result','reason_code','sealed','reuseEligible']);
   if(value.schema!==1||value.result!=='UNKNOWN'||value.reason_code!=='EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED'||value.sealed!==false||value.reuseEligible!==false)fail();
   return freeze({schema:1,scope:'PROPOSAL_ONLY',result:'UNKNOWN',reason_code:'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED',sealed:false,reuseEligible:false});
  }
  shape(value,['schema','scope','result','checks_passed','implemented_checks_passed','checks','unperformed_assertions','native_tool_boundary','real_credentials_opened','compiler_executions','model_actions_requested','network_actions_requested','sealed','reuseEligible']);
  if(value.schema!==1||value.scope!==scope||!['FAIL','UNKNOWN'].includes(value.result)||value.checks_passed!==false||typeof value.implemented_checks_passed!=='boolean'||value.native_tool_boundary!==toolBoundary||value.real_credentials_opened!==false||value.compiler_executions!==0||value.model_actions_requested!==0||value.network_actions_requested!==0||value.sealed!==false||value.reuseEligible!==false||!Array.isArray(value.checks)||![1,2,17,18].includes(value.checks.length)||!Array.isArray(value.unperformed_assertions))fail();
  let at=0;
  const take=name=>{const row=value.checks[at++];shape(row,['name','result','reason_code','attempted']);if(row.name!==name)fail();return row;};
  const ordinary=(name,expected,creationControl=false)=>{const row=take(name);if(row.attempted!==true||!codes.has(row.reason_code)||row.result!==(row.reason_code==='UNKNOWN_OR_UNAVAILABLE'||creationControl&&row.reason_code==='DENIED_PERMISSION_ERROR'?'UNKNOWN':row.reason_code===expected?'PASS':'FAIL'))fail();return row;};
  const skip=(name,reason)=>{const row=take(name);if(row.result!=='NOT_PERFORMED'||row.reason_code!==reason||row.attempted!==false)fail();};
  const missing=name=>{const row=take(name);if(row.result!=='NOT_IMPLEMENTED'||row.reason_code!=='NOT_IMPLEMENTED'||row.attempted!==false)fail();};
  const prerequisiteMissing=['STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED','MAP_SHARED_WRITABLE_MAPPING_DENIED'];
  const fixture=ordinary('fresh_synthetic_fixture_readable','FIXTURE_MATCHED');let unperformed;
  if(fixture.result!=='PASS')unperformed=prerequisiteMissing;
  else{
   const allowed=ordinary('owned_workspace_write_permitted','ACCESS_SUCCEEDED');
   if(allowed.result!=='PASS')unperformed=prerequisiteMissing;
   else{
    const caseAlias=ordinary('case_alias_resolves_to_same_stage_canary','FIXTURE_MATCHED');
    if(caseAlias.result==='PASS')ordinary('stage_case_alias_write_denied','DENIED_PERMISSION_ERROR');
    else skip('stage_case_alias_write_denied','NOT_PERFORMED_PREREQUISITE_UNKNOWN');
    for(const name of ['stage_file_write_denied','stage_file_chmod_denied','stage_file_unlink_denied','stage_file_rename_denied','stage_parent_replacement_denied'])ordinary(name,'DENIED_PERMISSION_ERROR');
    const link=ordinary('outside_hardlink_creation_denied','DENIED_PERMISSION_ERROR');
    unperformed=['MAP_SHARED_WRITABLE_MAPPING_DENIED','STAGE_PARENT_ATOMIC_EXCHANGE_DENIED','BASE_ATOMIC_EXCHANGE_DENIED'];
    if(caseAlias.result!=='PASS')unperformed.push('CASE_ALIAS_PREREQUISITE_NOT_ESTABLISHED');
    if(link.reason_code==='ACCESS_SUCCEEDED')ordinary('write_through_created_alias_denied','DENIED_PERMISSION_ERROR');
    else{const reason=link.reason_code==='DENIED_PERMISSION_ERROR'?'NOT_PERFORMED_PREREQUISITE_DENIED':'NOT_PERFORMED_PREREQUISITE_UNKNOWN';skip('write_through_created_alias_denied',reason);unperformed.push(reason);}
    const symlink=ordinary('owned_workspace_parent_symlink_creation_control','ACCESS_SUCCEEDED',true);
    const ready=symlink.result==='PASS'?ordinary('parent_symlink_resolves_to_same_stage_canary','FIXTURE_MATCHED'):null;
    if(ready?.result==='PASS')ordinary('stage_parent_symlink_alias_write_denied','DENIED_PERMISSION_ERROR');
    else{skip('stage_parent_symlink_alias_write_denied',symlink.reason_code==='DENIED_PERMISSION_ERROR'?'NOT_PERFORMED_PREREQUISITE_DENIED':'NOT_PERFORMED_PREREQUISITE_UNKNOWN');unperformed.push('PARENT_SYMLINK_ALIAS_PREREQUISITE_NOT_ESTABLISHED');}
    ordinary('stage_fixture_identity_and_bytes_preserved','FIXTURE_MATCHED');
    for(const name of ['map_shared_writable_mapping_denied','stage_parent_atomic_exchange_denied','base_atomic_exchange_denied'])missing(name);
   }
  }
  if(at!==value.checks.length||JSON.stringify(value.unperformed_assertions)!==JSON.stringify(unperformed)||value.result!==(value.checks.some(row=>row.result==='FAIL')?'FAIL':'UNKNOWN')||value.implemented_checks_passed!==value.checks.filter(row=>row.attempted).every(row=>row.result==='PASS'))fail();
  return freeze({schema:1,scope,result:value.result,checks_passed:false,implemented_checks_passed:value.implemented_checks_passed,
   checks:value.checks.map(row=>({name:row.name,result:row.result,reason_code:row.reason_code,attempted:row.attempted})),unperformed_assertions:[...unperformed],native_tool_boundary:toolBoundary,
   real_credentials_opened:false,compiler_executions:0,model_actions_requested:0,network_actions_requested:0,sealed:false,reuseEligible:false});
 }catch{fail();}
}
function lifecycle(value){shape(value,['exitCode','signal','exitObserved','timedOut']);if(!(value.exitCode===null||Number.isInteger(value.exitCode)&&value.exitCode>=0&&value.exitCode<=255)||!(value.signal===null||signals.has(value.signal))||typeof value.exitObserved!=='boolean'||typeof value.timedOut!=='boolean'||value.exitCode!==null&&value.signal!==null)fail();return{exitCode:value.exitCode,signal:value.signal,exitObserved:value.exitObserved,timedOut:value.timedOut};}
export function createSealedTypeScriptStageResultLatch(){
 let result=null,knownFail=null,process=null,error=null,observations=0;
 const complete=()=>process?.exitObserved&&process.exitCode===1&&process.signal===null&&!process.timedOut;
 const snapshot=()=>freeze({schema:1,scope:'STAGE_RESULT_DATA_ONLY',outcome:knownFail?'FAIL':'UNKNOWN',checkerResult:knownFail?'FAIL':result?.result??null,
  implementedAssertionsOutcome:knownFail?'FAIL':!error&&result?.scope===scope&&result.implemented_checks_passed&&complete()?'ALL_IMPLEMENTED_ROWS_OBSERVED':'UNKNOWN',
  checks:knownFail?.checks??result?.checks??null,unperformedAssertions:knownFail?.unperformed_assertions??result?.unperformed_assertions??null,
  lifecycleOutcome:process?.exitObserved?process.signal!==null?'SIGNALLED':complete()?'EXPECTED_CHILD_EXIT_1_OBSERVED':process.exitCode!==null?'OTHER_CHILD_EXIT_OBSERVED':'UNKNOWN':'UNKNOWN',
  exitCode:process?.exitCode??null,signal:process?.signal??null,timedOut:process?.timedOut??null,
  reason_code:error??(result?.scope==='PROPOSAL_ONLY'?'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED':result&&complete()?'CHECKER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS':'LIFECYCLE_UNAVAILABLE'),observations,
  nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,recordAdoptionAuthority:false,sealed:false,reuseEligible:false});
 return Object.freeze({observe(bytes,observedLifecycle={exitCode:null,signal:null,exitObserved:false,timedOut:false}){
  observations=Math.min(2,observations+1);if(observations!==1)error??='MULTIPLE_RESULTS';
  try{const parsed=parseSealedTypeScriptStageResult(bytes);result=parsed;if(parsed.result==='FAIL')knownFail??=parsed;}catch{error??='RESULT_INVALID';}
  try{process=lifecycle(observedLifecycle);}catch{process=null;error??='LIFECYCLE_INVALID';}
  return snapshot();},snapshot});
}
