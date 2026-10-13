// Data-only reader for the fixed five-row stage-exchange C protocol. Parsing
// and caller-supplied lifecycle facts never authenticate a tool/native boundary.
// The missing whole-base assertion keeps every non-failing aggregate UNKNOWN.
import {parsePortableJson} from '../../src/portable-envelope.mjs';
const names=Object.freeze(['synthetic_exchange_inventory_observed','workspace_atomic_exchange_and_restore_control','stage_parent_atomic_exchange_denied','stage_parent_identity_and_inventory_preserved','base_atomic_exchange_denied']);
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fail=()=>{throw Object.assign(Error('STAGE_EXCHANGE_RESULT_INVALID'),{code:'STAGE_EXCHANGE_RESULT_INVALID'});};
function shape(value,keys){if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')&&d.enumerable;}))fail();}
const ordinary=row=>row.attempted===true&&({PASS:'FIXTURE_MATCHED',FAIL:'ASSERTION_FAILED',UNKNOWN:'UNKNOWN_OR_UNAVAILABLE'})[row.result]===row.reason_code;
const skipped=row=>row.result==='NOT_PERFORMED'&&row.reason_code==='UNKNOWN_OR_UNAVAILABLE'&&row.attempted===false;
export function parseSealedTypeScriptStageExchangeResult(bytes){
 try{if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||Buffer.byteLength(bytes)===0||Buffer.byteLength(bytes)>4096)fail();const value=parsePortableJson(bytes);
  shape(value,['schema','scope','result','checks_passed','checks','nativeEnforcement','noInheritedWritableHandlesVerified','sealed','reuseEligible']);
  if(value.schema!==1||value.scope!=='SYNTHETIC_STAGE_ATOMIC_EXCHANGE_PROBE_RESULTS'||!['UNKNOWN','FAIL'].includes(value.result)||value.checks_passed!==false||value.nativeEnforcement!=='NOT_ESTABLISHED'||value.noInheritedWritableHandlesVerified!==false||value.sealed!==false||value.reuseEligible!==false||!Array.isArray(value.checks)||value.checks.length!==5)fail();
  for(let at=0;at<5;at++){const row=value.checks[at];shape(row,['name','result','reason_code','attempted']);if(row.name!==names[at]||typeof row.attempted!=='boolean')fail();}
  const [initial,control,exchange,final,missing]=value.checks;
  if(!ordinary(initial)||missing.result!=='NOT_IMPLEMENTED'||missing.reason_code!=='NOT_IMPLEMENTED'||missing.attempted!==false)fail();
  if(initial.result==='PASS'){
   if(control.attempted!==true||!['PASS','FAIL','UNKNOWN'].includes(control.result)||control.reason_code!==(control.result==='PASS'?'ATOMIC_EXCHANGE_AND_RESTORE_OBSERVED':control.result==='FAIL'?'ASSERTION_FAILED':'UNKNOWN_OR_UNAVAILABLE'))fail();
  }else if(!skipped(control))fail();
  if(control.result==='PASS'){
   if(!ordinary(final))fail();
   if(exchange.attempted){if(!['PASS','FAIL','UNKNOWN'].includes(exchange.result)||({PASS:'DENIED_PERMISSION_ERROR',FAIL:'ACCESS_SUCCEEDED',UNKNOWN:'UNKNOWN_OR_UNAVAILABLE'})[exchange.result]!==exchange.reason_code)fail();}
   else if(!skipped(exchange)||final.result==='PASS')fail();
  }else if(!skipped(exchange)||!skipped(final))fail();
  if(value.result!==(value.checks.some(row=>row.result==='FAIL')?'FAIL':'UNKNOWN'))fail();
  return freeze({schema:1,scope:value.scope,result:value.result,checks_passed:false,checks:value.checks.map(row=>({name:row.name,result:row.result,reason_code:row.reason_code,attempted:row.attempted})),nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
 }catch{fail();}
}
function lifecycle(value){shape(value,['exitCode','signal','exitObserved','timedOut']);if(!(value.exitCode===null||Number.isInteger(value.exitCode)&&!Object.is(value.exitCode,-0)&&value.exitCode>=0&&value.exitCode<=255)||!(value.signal===null||signals.has(value.signal))||typeof value.exitObserved!=='boolean'||typeof value.timedOut!=='boolean'||value.exitCode!==null&&value.signal!==null)fail();
 return{exitCode:value.exitCode,signal:value.signal,exitObserved:value.exitObserved,timedOut:value.timedOut};}
export function createSealedTypeScriptStageExchangeResultLatch(){
 let result=null,knownFail=null,process=null,error=null,observations=0;
 const snapshot=()=>freeze({schema:1,scope:'STAGE_EXCHANGE_RESULT_DATA_ONLY',outcome:knownFail?'FAIL':'UNKNOWN',helperResult:knownFail?'FAIL':result?.result??null,
  implementedAssertionsOutcome:knownFail?'FAIL':!error&&result&&process?.exitObserved&&process.exitCode===74&&process.signal===null&&!process.timedOut&&result.checks.slice(0,4).every(row=>row.result==='PASS'&&row.attempted)?'ALL_IMPLEMENTED_ROWS_OBSERVED':'UNKNOWN',
  checks:knownFail?.checks??result?.checks??null,lifecycleOutcome:process?.exitObserved?process.signal!==null?'SIGNALLED':process.exitCode===74&&!process.timedOut?'EXPECTED_CHILD_EXIT_74_OBSERVED':process.exitCode!==null?'OTHER_CHILD_EXIT_OBSERVED':'UNKNOWN':'UNKNOWN',
  exitCode:process?.exitCode??null,signal:process?.signal??null,timedOut:process?.timedOut??null,reason_code:error??(process?.exitObserved&&process.exitCode===74&&process.signal===null&&!process.timedOut?'HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS':'LIFECYCLE_UNAVAILABLE'),observations,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
 return Object.freeze({observe(bytes,observedLifecycle={exitCode:null,signal:null,exitObserved:false,timedOut:false}){
  observations=Math.min(2,observations+1);if(observations!==1)error??='MULTIPLE_RESULTS';
  try{const parsed=parseSealedTypeScriptStageExchangeResult(bytes);result=parsed;if(parsed.result==='FAIL')knownFail??=parsed;}catch{error??='RESULT_INVALID';}
  try{process=lifecycle(observedLifecycle);}catch{process=null;error??='LIFECYCLE_INVALID';}
  return snapshot();},snapshot});
}
