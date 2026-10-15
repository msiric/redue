// Fixed native diagnostic child entry; separate from the preparation-only CLI.
// Emit one bounded data summary, never the native wire, body, command or env.
import {writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runFixedNativeEnclosureDiagnostic} from './sealed-typescript-enclosure-provisioning.mjs';

const reasons=new Set([
  'ACTIVATION_OR_RUNTIME_UNAVAILABLE', 'PINNED_RUNTIME_OR_ENVIRONMENT_UNAVAILABLE',
  'GENUINE_PREPARATION_UNAVAILABLE', 'ORIGINAL_COMMAND_OR_STARTUP_UNAVAILABLE',
  'EXCLUSIVE_SETTINGS_OR_BINDINGS_UNAVAILABLE', 'PRE_NATIVE_CURRENTNESS_UNAVAILABLE',
  'NATIVE_COLLECTION_UNAVAILABLE', 'POST_NATIVE_ENDPOINT_OR_STARTUP_UNAVAILABLE',
  'NATIVE_INTERPRETATION_UNAVAILABLE', 'CLOCK_UNAVAILABLE',
  'OVERALL_BUDGET_OR_CANCELLATION', 'SYNTACTIC_NATIVE_COLLECTION_ONLY',
]);
const signals=new Set([
  'SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGIOT','SIGBUS',
  'SIGFPE','SIGKILL','SIGUSR1','SIGSEGV','SIGUSR2','SIGPIPE','SIGALRM','SIGTERM',
  'SIGCHLD','SIGCONT','SIGSTOP','SIGTSTP','SIGTTIN','SIGTTOU','SIGURG','SIGXCPU',
  'SIGXFSZ','SIGVTALRM','SIGPROF','SIGWINCH','SIGIO','SIGINFO','SIGSYS',
]);
const integer=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max?v:null;

// Only the fixed controller supplies this value. There is no report import,
// callback, command selection or public summary projection interface.
function summary(r){
  const known=r?.schema===1
    &&r.scope==='UNWIRED_FIXED_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY'
    &&['UNKNOWN','FAIL'].includes(r.outcome)
    &&r.nativeAuthenticated===false&&r.originAuthority===false
    &&r.receiptAuthority===false&&r.recordAdoptionAuthority===false
    &&r.sealed===false&&r.reuseEligible===false;
  if(!known)r=null;
  const p=r?.preparation,o=r?.observation,attempted=r?.preparationAttempted===true;
  const failed=!!(r&&r.outcome==='FAIL'&&o?.outcome==='FAIL'
    &&o.reportedAssertionOutcome==='FAIL');
  const complete=!!(p?.outcome==='BUILT_NOT_EXECUTED'
    &&p.buildAttemptCount===8&&p.buildResultCount===8&&p.observedProcessCount===8
    &&p.compilerBuildOutcome==='EXIT_ZERO'&&Array.isArray(p.builds)&&p.builds.length===8
    &&p.builds.every(row=>row.pidObserved===true&&row.completed===true
      &&row.status===0&&row.signal===null&&row.spawnError==='NONE'));
  const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.exec(v)?.[0]===v?v:null;
  return {
    schema:1,scope:'FIXED_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY',
    interpretation:'fixed-native-enclosure-child-summary@1',
    reportStatus:r?'CONTROLLER_RETURNED':'RESULT_UNAVAILABLE',
    outcome:failed?'FAIL':'UNKNOWN',reportedAssertionOutcome:failed?'FAIL':'UNKNOWN',
    reason:r&&reasons.has(r.reason)?r.reason:'CONTROLLER_RESULT_UNAVAILABLE',
    preparationAttempted:r?attempted:null,
    preparationOutcome:p&&['BUILT_NOT_EXECUTED','UNKNOWN'].includes(p.outcome)?p.outcome:null,
    preparationBuildAttemptCount:integer(p?.buildAttemptCount,8),
    preparationBuildResultCount:integer(p?.buildResultCount,8),
    preparationObservedProcessCount:integer(p?.observedProcessCount,8),
    preparationProcessesComplete:r?(!attempted||complete):false,
    compilerBuildOutcome:['EXIT_ZERO','EXIT_NONZERO','UNKNOWN'].includes(p?.compilerBuildOutcome)
      ?p.compilerBuildOutcome:'UNKNOWN',
    nativeSpawnAttempts:integer(r?.nativeSpawnAttempts,1),
    nativeLaunches:integer(r?.nativeLaunches,1),
    models:r?.models===0?0:null,helperExecutions:r?.helperExecutions===0?0:null,
    nativeSpawnObserved:r?r.nativeSpawnObserved===true:null,
    nativeExit:integer(r?.nativeExit,255),
    nativeSignal:signals.has(r?.nativeSignal)?r.nativeSignal:null,
    nativeCloseObserved:r?r.nativeCloseObserved===true:null,
    nativeReaped:r?r.nativeReaped===true:null,
    timedOut:r?r.timedOut===true:null,cancelled:r?r.cancelled===true:null,
    overallBudgetExceeded:typeof r?.overallBudgetExceeded==='boolean'?r.overallBudgetExceeded:null,
    milliseconds:typeof r?.milliseconds==='number'&&Number.isFinite(r.milliseconds)
      &&r.milliseconds>=0&&r.milliseconds<120000?r.milliseconds:null,
    traceSyntaxValid:o?.traceSyntaxValid===true,
    completionDataValid:o?.completionDataValid===true,
    commandSha256:sha(o?.commandSha256),
    parsedBodySha256:o?.body?createHash('sha256').update(JSON.stringify(o.body)).digest('hex'):null,
    bodyDigestScope:'PARSED_BODY_SERIALIZATION_NOT_ORIGINAL_WIRE',bodyRetained:false,
    publicDataOnly:true,nativeAuthenticated:false,nativeEnforcement:'NOT_ESTABLISHED',
    nativeIntervalBarrier:'NOT_ESTABLISHED',detachedDescendantClosure:'UNKNOWN',
    resources:'RETAINED_NOT_DELETED',originAuthority:false,receiptAuthority:false,
    recordAdoptionAuthority:false,sealed:false,reuseEligible:false,
  };
}

// Fixed FD1 and one bounded line. No terminal automation or custom entry mode.
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  let result;
  try{
    if(process.argv.length!==2)throw Error('NOT_SELECTED');
    result=summary(await runFixedNativeEnclosureDiagnostic());
  }catch{
    result=summary(null);
  }
  const body=Buffer.from(JSON.stringify(result)+'\n');
  if(body.length>4096)throw Error('FIXED_NATIVE_SUMMARY_LIMIT');
  let offset=0;
  while(offset<body.length){
    const count=writeSync(1,body,offset,body.length-offset);
    if(!Number.isInteger(count)||count<1)throw Error('FIXED_NATIVE_SUMMARY_WRITE');
    offset+=count;
  }
  process.exitCode=result.reportStatus==='CONTROLLER_RETURNED'?0:74;
}
