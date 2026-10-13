// Fixed mapper data/lifecycle classification only; no execution or provenance.
// READ_ONLY_FD_CONSTRAINT_OBSERVED is an OS descriptor constraint, NOT a sandbox
// denial. Neither nominal rows nor caller-supplied exit facts establish a seal.
import {parsePortableJson} from '../../src/portable-envelope.mjs';
const names=Object.freeze(['fixed_fixture_precondition','workspace_rw_shared_change_restore','staged_rdwr_acquisition','staged_readonly_shared_read_mprotect_write','staged_readonly_shared_write_map','staged_identity_and_body_preserved','owned_descriptors_and_mappings_closed']);
const errors=new Set(['NONE','EPERM','EACCES','ENOENT','ENOTDIR','ELOOP','EINVAL','ENOMEM','ENODEV','ENXIO','EIO','EINTR','EMFILE','ENFILE','EBADF','OTHER']);
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fail=()=>{throw Object.assign(Error('MAP_RESULT_INVALID'),{code:'MAP_RESULT_INVALID'});};
function shape(value,keys){if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')&&d.enumerable;}))fail();}
const is=(row,classification,errno='NONE')=>row.classification===classification&&row.errno_code===errno;
const skipped=row=>is(row,'NOT_PERFORMED');
const unknown=row=>row.classification==='UNKNOWN_OR_UNAVAILABLE';
const grant=row=>is(row,'ACCESS_SUCCEEDED');
const failed=rows=>rows[1].classification==='ASSERTION_FAILED'||grant(rows[2])||['ASSERTION_FAILED','ACCESS_SUCCEEDED'].includes(rows[3].classification)||grant(rows[4])||rows[5].classification==='ASSERTION_FAILED';
const nominal=rows=>is(rows[0],'FRESH_SINGLE_LINK_MARKER_FILES_OBSERVED')&&is(rows[1],'SHARED_CHANGE_AND_RESTORE_OBSERVED')&&rows[2].classification==='DENIED_PERMISSION_ERROR'&&['EPERM','EACCES'].includes(rows[2].errno_code)&&is(rows[3],'READ_ONLY_FD_CONSTRAINT_OBSERVED','EACCES')&&is(rows[4],'READ_ONLY_FD_CONSTRAINT_OBSERVED','EACCES')&&is(rows[5],'IDENTITY_AND_BODY_PRESERVED')&&is(rows[6],'OWNED_DESCRIPTORS_AND_MAPPINGS_CLOSED');
export function parseSealedTypeScriptMapResult(bytes){
 try{if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||Buffer.byteLength(bytes)===0||Buffer.byteLength(bytes)>4096)fail();const v=parsePortableJson(bytes);
  shape(v,['schema','scope','result','checks','native_boundary_verified','fresh_stage_and_no_inherited_rw_handles_verified','sealed','reuseEligible']);
  if(v.schema!==1||v.scope!=='SYNTHETIC_SHARED_MAPPING_PROBE_RESULTS'||!['UNKNOWN','FAIL'].includes(v.result)||v.native_boundary_verified!==false||v.fresh_stage_and_no_inherited_rw_handles_verified!==false||v.sealed!==false||v.reuseEligible!==false||!Array.isArray(v.checks)||v.checks.length!==7)fail();
  for(let at=0;at<7;at++){const row=v.checks[at];shape(row,['name','classification','errno_code']);if(row.name!==names[at]||!errors.has(row.errno_code))fail();}
  const [fixture,control,rdwr,readMap,writeMap,preserved,cleanup]=v.checks;
  if(is(fixture,'EXACT_REVIEWED_FIXTURE_ROUTE_REQUIRED')){
   if(!v.checks.slice(1).every(skipped))fail();
  }else{
   if(!(is(fixture,'FRESH_SINGLE_LINK_MARKER_FILES_OBSERVED')||unknown(fixture)))fail();
   if(!(is(cleanup,'OWNED_DESCRIPTORS_AND_MAPPINGS_CLOSED')||unknown(cleanup)&&cleanup.errno_code!=='NONE'))fail();
   if(unknown(fixture)){
    if(!v.checks.slice(1,6).every(skipped))fail();
   }else{
    if(!(is(control,'SHARED_CHANGE_AND_RESTORE_OBSERVED')||control.classification==='ASSERTION_FAILED'||unknown(control)))fail();
    if(!(is(preserved,'IDENTITY_AND_BODY_PRESERVED')||is(preserved,'ASSERTION_FAILED')||unknown(preserved)&&preserved.errno_code!=='NONE'))fail();
    if(!is(control,'SHARED_CHANGE_AND_RESTORE_OBSERVED')){
     if(![rdwr,readMap,writeMap].every(skipped))fail();
    }else if(skipped(rdwr)){
     // A successful workspace control can still lose cleanup, preventing entry
     // to staged_checks. It does not become a performed denial observation.
     if(!unknown(cleanup)||![readMap,writeMap].every(skipped))fail();
    }else{
     if(!(grant(rdwr)||rdwr.classification==='DENIED_PERMISSION_ERROR'&&['EPERM','EACCES'].includes(rdwr.errno_code)||unknown(rdwr)&&!['EPERM','EACCES'].includes(rdwr.errno_code)))fail();
     if(skipped(readMap)){
      // Only the initial fixture revalidation (explicit errno 0) returns before
      // the read-map row. An ordinary open failure proceeds to that row.
      if(!is(rdwr,'UNKNOWN_OR_UNAVAILABLE')||!skipped(writeMap))fail();
     }else{
      if(!(grant(readMap)||is(readMap,'ASSERTION_FAILED')||is(readMap,'READ_ONLY_FD_CONSTRAINT_OBSERVED','EACCES')||unknown(readMap)))fail();
      if(skipped(writeMap)){if(!is(readMap,'UNKNOWN_OR_UNAVAILABLE'))fail();}
      else if(!(grant(writeMap)||is(writeMap,'READ_ONLY_FD_CONSTRAINT_OBSERVED','EACCES')||unknown(writeMap)&&writeMap.errno_code!=='EACCES'))fail();
     }
    }
   }
  }
  if(v.result!==(failed(v.checks)?'FAIL':'UNKNOWN'))fail();
  return freeze({schema:1,scope:v.scope,result:v.result,checks:v.checks.map(row=>({name:row.name,classification:row.classification,errno_code:row.errno_code})),native_boundary_verified:false,fresh_stage_and_no_inherited_rw_handles_verified:false,sealed:false,reuseEligible:false});
 }catch{fail();}
}
function lifecycle(v){shape(v,['exitCode','signal','exitObserved','timedOut']);if(!(v.exitCode===null||Number.isInteger(v.exitCode)&&!Object.is(v.exitCode,-0)&&v.exitCode>=0&&v.exitCode<=255)||!(v.signal===null||signals.has(v.signal))||typeof v.exitObserved!=='boolean'||typeof v.timedOut!=='boolean'||v.exitCode!==null&&v.signal!==null)fail();return{exitCode:v.exitCode,signal:v.signal,exitObserved:v.exitObserved,timedOut:v.timedOut};}
export function createSealedTypeScriptMapResultLatch(){
 let result=null,knownFail=null,process=null,error=null,observations=0;
 const snapshot=()=>freeze({schema:1,scope:'MAP_RESULT_DATA_ONLY',outcome:knownFail?'FAIL':'UNKNOWN',helperResult:knownFail?'FAIL':result?.result??null,
  implementedAssertionsOutcome:knownFail?'FAIL':!error&&result&&process?.exitObserved&&process.exitCode===74&&process.signal===null&&!process.timedOut&&nominal(result.checks)?'ALL_IMPLEMENTED_ROWS_OBSERVED':'UNKNOWN',
  checks:knownFail?.checks??result?.checks??null,lifecycleOutcome:process?.exitObserved?process.signal!==null?'SIGNALLED':process.exitCode===74&&!process.timedOut?'EXPECTED_CHILD_EXIT_74_OBSERVED':process.exitCode!==null?'OTHER_CHILD_EXIT_OBSERVED':'UNKNOWN':'UNKNOWN',
  exitCode:process?.exitCode??null,signal:process?.signal??null,timedOut:process?.timedOut??null,reason_code:error??(process?.exitObserved&&process.exitCode===74&&process.signal===null&&!process.timedOut?'HELPER_RESULT_OBSERVED_NOT_NATIVE_AUTHENTICATED':'LIFECYCLE_UNAVAILABLE'),observations,native_boundary_verified:false,fresh_stage_and_no_inherited_rw_handles_verified:false,sealed:false,reuseEligible:false});
 return Object.freeze({observe(bytes,observedLifecycle={exitCode:null,signal:null,exitObserved:false,timedOut:false}){
  observations=Math.min(2,observations+1);if(observations!==1)error??='MULTIPLE_RESULTS';
  try{const parsed=parseSealedTypeScriptMapResult(bytes);result=parsed;if(parsed.result==='FAIL')knownFail??=parsed;}catch{error??='RESULT_INVALID';}
  try{process=lifecycle(observedLifecycle);}catch{process=null;error??='LIFECYCLE_INVALID';}
  return snapshot();},snapshot});
}
