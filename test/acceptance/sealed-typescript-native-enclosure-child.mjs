// Fixed native diagnostic child entry; separate from the preparation-only CLI.
// Emit one bounded data summary, never the native wire, body, command or env.
import {writeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runFixedNativeEnclosureDiagnostic,runFixedCINativeEnclosureDiagnostic} from './sealed-typescript-enclosure-provisioning.mjs';

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

// Role-local assertion IDs are literal names from the strict original body
// parsers, not caller labels. Compact tuples preserve observed classifications
// within the existing4KiB summary: [nameIndex,result,attempted-or-errno].
const checkerNames=[
 ['synthetic_base_pair_identities_observed','synthetic_exchange_inventory_observed','workspace_atomic_exchange_and_restore_control','base_atomic_exchange_denied','base_pair_identities_preserved','other_native_stage_assertions'],
 ['synthetic_exchange_inventory_observed','workspace_atomic_exchange_and_restore_control','stage_parent_atomic_exchange_denied','stage_parent_identity_and_inventory_preserved','base_atomic_exchange_denied'],
 ['fresh_synthetic_fixture_readable','owned_workspace_write_permitted','case_alias_resolves_to_same_stage_canary','stage_case_alias_write_denied','stage_file_write_denied','stage_file_chmod_denied','stage_file_unlink_denied','stage_file_rename_denied','stage_parent_replacement_denied','outside_hardlink_creation_denied','write_through_created_alias_denied','owned_workspace_parent_symlink_creation_control','parent_symlink_resolves_to_same_stage_canary','stage_parent_symlink_alias_write_denied','stage_fixture_identity_and_bytes_preserved','map_shared_writable_mapping_denied','stage_parent_atomic_exchange_denied','base_atomic_exchange_denied'],
 ['fixed_fixture_precondition','workspace_rw_shared_change_restore','staged_rdwr_acquisition','staged_readonly_shared_read_mprotect_write','staged_readonly_shared_write_map','staged_identity_and_body_preserved','owned_descriptors_and_mappings_closed'],
];
function checkerSummary(observation){
 const b=observation?.body,matched=typeof observation?.toolUseId==='string'&&/^toolu_[A-Za-z0-9]{6,100}$/.test(observation.toolUseId)
  &&typeof observation.commandSha256==='string'&&/^[a-f0-9]{64}$/.test(observation.commandSha256);
 const phases=matched&&b?.scope==='ENCLOSED_FIXED_CANARY_DIAGNOSTICS_ONLY'&&Array.isArray(b.phases)?b.phases:null;
 return {checkerInterpretation:'native187-enclosure-checker-rows@1',toolExecutionMatched:!!(matched&&phases),
  toolUseIdSha256:matched&&phases?createHash('sha256').update(observation.toolUseId).digest('hex'):null,
  checkerBegin:phases?b.begin:null,checkerEnd:phases?b.end:null,checkerLaunchedCount:phases?b.launchedCount:null,checkerClosedCount:phases?b.closedCount:null,
  checkerPhases:phases?phases.map((p,at)=>({role:p.role,assertionOutcome:p.outcome,process:[p.spawnObserved,p.closeObserved,p.exitObserved,p.exitCode,p.signal],implementedAssertionsOutcome:p.implementedAssertionsOutcome,
   checks:p.checks.map(row=>[checkerNames[at].indexOf(row.name),at===3?row.classification:row.result,at===3?row.errno_code:row.attempted])})):null};
}

// Only the fixed controller supplies this value. There is no report import,
// callback, command selection or public summary projection interface.
function summary(r,ci=false){
  const known=r?.schema===1
    &&r.scope===(ci?'FIXED_CI_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY':'UNWIRED_FIXED_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY')
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
    schema:1,scope:ci?'FIXED_CI_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY':'FIXED_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY',
    interpretation:ci?'fixed-ci-native-enclosure-child-summary@1':'fixed-native-enclosure-child-summary@1',
    ...(ci?checkerSummary(o):{}),
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
    if(process.argv.length===2)result=summary(await runFixedNativeEnclosureDiagnostic());
    else if(process.argv.length===3&&process.argv[2]==='--fixed-ci-native-child')result=summary(await runFixedCINativeEnclosureDiagnostic(),true);
    else throw Error('NOT_SELECTED');
  }catch{
    result=summary(null,process.argv.length===3&&process.argv[2]==='--fixed-ci-native-child');
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
