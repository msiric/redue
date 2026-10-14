// Fixed test-only native187 stdio observation, not REDUE verification/sealing.
// One live process composes preparation + native collection. No saved context,
// imported artifact, arbitrary command/path/argv or settings override is adopted.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture,verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {buildNativeStdioProbeForReviewedCI,buildNativeStartupWitnessForReviewedCI,verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {prepareNativeStdioStartup,prepareNativeStartupWitnessStartup,verifyNativeStdioStartup} from './sealed-typescript-native-stdio-startup.mjs';
import {prepareDirectNativeStdioProbeCommand,prepareDirectNativeStartupWitnessCommand} from './sealed-typescript-native-stdio-command.mjs';
import {nativeStdioDirectCommand,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';
import {NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION} from './sealed-typescript-native-startup-witness.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {requireNativeDiagnosticActivation,nativeDiagnosticEnvironment,nativeDiagnosticArgv,selectedStartupSourcesAbsent,validateNativePostStartupSources,POST_REMOTE_SENTINEL_RULE,readOwnedDiagnosticFile,putOwnedDiagnosticFile,validateOwnedDiagnosticManifest,collectDirectNativeStdioDiagnostic,interpretCollectedDirectNativeStdioDiagnostic,collectDirectNativeStartupWitnessDiagnostic,interpretCollectedDirectNativeStartupWitnessDiagnostic} from './portable-claude-diagnostic.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const fail=()=>{throw Error('FIXED_NATIVE_STDIO_DIAGNOSTIC_UNAVAILABLE');};
const guard=v=>{if(!v)fail();};
const identity=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const ownBase=base=>{const s=fs.lstatSync(base);guard(fs.realpathSync(base)===base&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid()&&(s.mode&0o7777)===0o700);return identity(s);};
const authority=fields=>Object.freeze({schema:1,scope:'FIXED_SINGLE_DIRECT_NATIVE_STDIO_DIAGNOSTIC_ONLY',...fields,
 nativeEnforcement:'NOT_ESTABLISHED',controlledShellEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',
 completeSdkClosure:'NOT_ESTABLISHED',helperKernelClose:'NOT_OBSERVED',helperReap:'NOT_OBSERVED',helperSignal:'NOT_OBSERVED',
 sealed:false,reuseEligible:false,portableApplicability:'NOT_TESTED',agentReuse:'NOT_TESTED',rawTranscriptRetained:false,rawStderrRetained:false});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function requiredArgsApplied(argv,required){
 let from=0;for(let i=0;i<required.length;i++){const at=argv.indexOf(required[i],from);if(at<0)return false;
  if(i+1<required.length&&!required[i+1].startsWith('--')){if(argv[at+1]!==required[++i])return false;from=at+2;}else from=at+1;
 }return true;
}
// Options are trusted host inputs, not proof of environment protection. The
// registered protected workflow/source review remains an external prerequisite.
// This function accepts NO child factory, native path, prompt, policy or context.
export async function runFixedNativeStdioDiagnostic(options){
 guard(arguments.length===1);return runFixedDirectDiagnostic(options,false);
}
// Source preparation only: not wired to the CLI/workflow. The same protected
// activation/capacity, native policy, currentness and process bounds still apply.
export async function runFixedNativeStartupWitnessDiagnostic(options){
 guard(arguments.length===1);return runFixedDirectDiagnostic(options,true);
}
async function runFixedDirectDiagnostic(options,witness){
 guard(options&&Object.getPrototypeOf(options)===Object.prototype&&Reflect.ownKeys(options).every(k=>['env','source','signal'].includes(k)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value'))&&
  ['env','source'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')));
 const buildFixed=witness?buildNativeStartupWitnessForReviewedCI:buildNativeStdioProbeForReviewedCI,
  prepareStartup=witness?prepareNativeStartupWitnessStartup:prepareNativeStdioStartup,
  prepareCommand=witness?prepareDirectNativeStartupWitnessCommand:prepareDirectNativeStdioProbeCommand,
  collect=witness?collectDirectNativeStartupWitnessDiagnostic:collectDirectNativeStdioDiagnostic,
  interpret=witness?interpretCollectedDirectNativeStartupWitnessDiagnostic:interpretCollectedDirectNativeStdioDiagnostic,
  sourcePin=witness?NATIVE_STARTUP_WITNESS_SOURCE_SHA256:NATIVE_STDIO_SOURCE_SHA256,
  buildRule=witness?'redue-native-child-startup-witness-preauth-build@1':'redue-native-stdio-preauth-build@2';
 const diagnosticNames=['SELECTED_STARTUP_SOURCE_ABSENCE','ACTUAL_BINDINGS','NATIVE_FILE_SHAPE','MANIFEST_VALIDATION','FIXTURE_VALIDATION','BUILD_VALIDATION','STARTUP_VALIDATION','FIXTURE_RESULT_MATCH','BUILD_RESULT_MATCH','STARTUP_RESULT_MATCH','ACCOUNT_VALIDATION','PRELAUNCH_BUDGET'];
 const diagnosticCodes=new Set(['EACCES','EPERM','ENOENT','ENOTDIR','ELOOP','EINVAL','EIO','DIAGNOSTIC_STARTUP_SOURCE_PRESENT','DIAGNOSTIC_SOURCE_CHANGED','DIAGNOSTIC_JOB_DEADLINE','DIAGNOSTIC_WORKFLOW_OR_CAPACITY','DIAGNOSTIC_OWNER_POLICY_FACT_MISSING','DIAGNOSTIC_OWNER_POLICY_FACT_INVALID','DIAGNOSTIC_OWNER_POLICY_FACT_STALE']);
 const diagnosticRoles=new Set(['SYSTEM_MANAGED_JSON','SYSTEM_MANAGED_DIRECTORY','SYSTEM_MANAGED_PLIST','USER_MANAGED_PLIST','ISOLATED_REMOTE_SETTINGS','ISOLATED_CREDENTIAL_STORE','PROJECT_CLAUDE_DIRECTORY','PROJECT_MCP_FILE','PROJECT_INSTRUCTION_FILE','REMOTE_API_KEY_PATH']);
 const guardCounts=Object.fromEntries(diagnosticNames.map(name=>[name,{attempted:0,returned:0}]));let guardFailure=null,guardResultFields=null;
 // Closed diagnostic classes only. Never retain error messages, cause objects,
 // exception stacks, environment values or paths. Return counts mean only that
 // the call returned; verifier result-field matching is separately required.
 const diagnosed=(name,fn)=>{
  guardCounts[name].attempted++;
  try{const value=fn();guardCounts[name].returned++;return value;}
  catch(error){
   if(guardFailure===null){let code,role;try{code=Object.getOwnPropertyDescriptor(error??{},'code')?.value;role=Object.getOwnPropertyDescriptor(error??{},'startupSourceRole')?.value;}catch{}
    guardFailure={guard:name,phase,code:diagnosticCodes.has(code)?code:'UNCLASSIFIED',startupSourceRole:diagnosticRoles.has(role)?role:null};}
   throw error;
  }
 };
 const {env,source,signal}=options;let phase='ACTIVATION_OR_PROFILE_UNAVAILABLE',base=null,baseId=null,observed=null,interpreted=null,launched=false,cleanup='NOT_NEEDED',reason=null;
 let fixture,build,startup,proposal,manifest,nativeEnv,argv,binding,ownerFact,pre=null,post=null,remotePolicyEstablished=false,buildRequested=false;
 const started=performance.now();let last=started,deadline=null;
 const remaining=()=>{const now=performance.now();guard(Number.isFinite(now)&&Number.isFinite(last)&&now>=last&&deadline!==null);last=now;return deadline-now;};
 const bounded=fn=>{guard(remaining()>0&&!signal?.aborted);const value=fn();guard(remaining()>0&&!signal?.aborted);return value;};
 try{
  ownerFact=diagnosed('ACCOUNT_VALIDATION',()=>requireNativeDiagnosticActivation({env,source}));
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&!Object.hasOwn(env,'SIMPLE')&&!signal?.aborted);
  const elapsed=Date.now()-Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS);guard(Number.isSafeInteger(Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS))&&elapsed>=0&&elapsed<115000);
  deadline=started+120000-elapsed;
  // Fixed preprovisioned public binary from the reviewed workflow. It is read,
  // never downloaded, copied, relogged or selected by CLI arguments here.
  phase='NATIVE_BINDING_UNAVAILABLE';const nativeBase=env.REDUE_DIAGNOSTIC_BASE;
  guard(typeof nativeBase==='string'&&/^\/private\/tmp\/redue-claude-diagnostic-[A-Za-z0-9]{6}$/.test(nativeBase));
  const native=nativeBase+'/native/claude';
  const nativeShape=()=>diagnosed('NATIVE_FILE_SHAPE',()=>{const st=bounded(()=>fs.lstatSync(native));guard(st.isFile()&&!st.isSymbolicLink()&&st.uid===process.getuid()&&st.nlink===1&&(st.mode&0o7777)===0o700);});nativeShape();
  const nativeRow=bounded(()=>readOwnedDiagnosticFile(native,224*1024*1024));guard(nativeRow.digest===REVIEWED_CLAUDE_NATIVE.sha256);
  // Validate forbidden authentication/runtime overrides BEFORE owned preparation.
  bounded(()=>nativeDiagnosticEnvironment(env,{host:nativeBase}));
  phase='LIVE_FIXTURE_UNAVAILABLE';const bootstrap=bounded(()=>{
   // Preparation may create a namespace before returning UNKNOWN or throwing.
   // Until its successful result AND canonical owned identity are established,
   // retain unknown resources; never adopt or remove a partial returned base.
   cleanup='BOOTSTRAP_RESOURCES_UNKNOWN_RETAINED';return createSealedTypeScriptCIBootstrap();
  });guard(bootstrap.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');base=bootstrap.base;baseId=bounded(()=>ownBase(base));
  fixture=bounded(()=>prepareSealedTypeScriptCISyntheticFixture(bootstrap));guard(fixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
  phase='LIVE_BUILD_UNAVAILABLE';build=bounded(()=>{
   // Retain a returned build observation before the post-call budget check.
   // A throw leaves execution count unknown, not a fabricated zero attempt.
   buildRequested=true;build=buildFixed({fixture});return build;
  });guard(build.outcome==='BUILT_NOT_EXECUTED'&&build.profileId==='redue-native-stdio-preauth-ci-sdk26.5@1'&&build.buildInterpretation===buildRule&&build.sourceSha256===sourcePin);
  phase='LIVE_STARTUP_UNAVAILABLE';startup=bounded(()=>prepareStartup({fixture,build}));guard(startup.outcome==='STARTUP_PREPARED_NOT_LAUNCHED');
  const host=base+'/claude-host',assets={host,code:build.cwd};
  proposal=bounded(()=>prepareCommand({build,claudeExecutable:native,claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version}));
  guard(proposal.build_profile_id===build.profileId&&proposal.build_interpretation===build.buildInterpretation&&proposal.source_sha256===sourcePin&&(!witness||proposal.witness_interpretation===NATIVE_STARTUP_WITNESS_INTERPRETATION)&&proposal.command_proposed===nativeStdioDirectCommand(base)&&proposal.cwd_proposed===build.cwd&&proposal.settings_file_proposed===host+'/settings.json'&&build.sourceSha256===sourcePin);
  phase='FIXED_SETTINGS_UNAVAILABLE';const settings=structuredClone(proposal.settings_proposed);
  // NONbare OAuth requires closing auto-memory and managed instructions/rules.
  Object.assign(settings,startup.requiredSettings);
  settings.sandbox.credentials.envVars.push({name:'REDUE_PREFLIGHT_SENTINEL',mode:'deny'});
  // '~' now resolves to the isolated HOME. Retain original credential denials as
  // absolute restrictions too; never read original credential locations.
  guard(typeof env.HOME==='string'&&path.isAbsolute(env.HOME)&&path.normalize(env.HOME)===env.HOME&&!/[\0\r\n]/.test(env.HOME));
  for(const tail of ['Library/Keychains','.ssh','.aws','.npmrc','.claude','.config','.git-credentials'])settings.sandbox.filesystem.denyRead.push(path.join(env.HOME,tail));
  settings.sandbox.filesystem.denyWrite.push(path.join(env.HOME,'Library/Keychains'));
  const settingsBytes=Buffer.from(JSON.stringify(settings)+'\n');bounded(()=>putOwnedDiagnosticFile(proposal.settings_file_proposed,settingsBytes));
  const settingsRow=bounded(()=>readOwnedDiagnosticFile(proposal.settings_file_proposed,262144));guard(settingsRow.digest===hash(settingsBytes));
  manifest={base,native,files:[{file:native,digest:nativeRow.digest,fingerprint:nativeRow.fingerprint},{file:proposal.settings_file_proposed,digest:settingsRow.digest,fingerprint:settingsRow.fingerprint}]};
  nativeEnv={...bounded(()=>nativeDiagnosticEnvironment(env,{host})),...startup.environmentBindings};
  argv=nativeDiagnosticArgv({settingsFile:proposal.settings_file_proposed,command:proposal.command_proposed});
  // Exact applied data, not a claim that native enforcement has been measured.
  const actualBindings=()=>equal(Object.fromEntries(Object.keys(startup.environmentBindings).map(k=>[k,nativeEnv[k]])),startup.environmentBindings)&&
   startup.requiredAbsentEnvironmentKeys.every(k=>!Object.hasOwn(nativeEnv,k))&&startup.forbiddenArgv.every(k=>!argv.includes(k))&&requiredArgsApplied(argv,startup.requiredArgv)&&
   equal(argv,nativeDiagnosticArgv({settingsFile:proposal.settings_file_proposed,command:proposal.command_proposed}))&&
   Object.keys(startup.requiredSettings).every(k=>equal(settings[k],startup.requiredSettings[k]));
  const current=(when)=>{
   guardResultFields={phase,when,fixture:null,build:null,startup:null};
   diagnosed('ACTUAL_BINDINGS',()=>guard(actualBindings()));nativeShape();diagnosed('MANIFEST_VALIDATION',()=>bounded(()=>validateOwnedDiagnosticManifest(manifest)));nativeShape();
   // Preserve the existing f -> b -> s validation call order. A returned UNKNOWN
   // is not a thrown validation failure and is refused by its own match guard.
   const f=diagnosed('FIXTURE_VALIDATION',()=>bounded(()=>verifySealedTypeScriptSyntheticFixture(fixture))),b=diagnosed('BUILD_VALIDATION',()=>bounded(()=>verifyNativeStdioProbeBuild(build))),s=diagnosed('STARTUP_VALIDATION',()=>bounded(()=>verifyNativeStdioStartup(startup,when)));
   // Only matches for predicates already required here; no observed values.
   guardResultFields.fixture={outcome:f.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',base:f.base===base};
   guardResultFields.build={outcome:b.outcome==='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',profileId:b.profileId===build.profileId,buildInterpretation:b.buildInterpretation===build.buildInterpretation,sourceSha256:b.sourceSha256===sourcePin,hostBase:b.hostBase===base};
   guardResultFields.startup={sourceSha256:s.sourceSha256===sourcePin,buildInterpretation:s.buildInterpretation===buildRule,outcome:s.outcome==='STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY',hostBase:s.hostBase===base};
   diagnosed('FIXTURE_RESULT_MATCH',()=>guard(Object.values(guardResultFields.fixture).every(v=>v===true)));
   diagnosed('BUILD_RESULT_MATCH',()=>guard(Object.values(guardResultFields.build).every(v=>v===true)));
   diagnosed('STARTUP_RESULT_MATCH',()=>guard(Object.values(guardResultFields.startup).every(v=>v===true)));
   diagnosed('ACCOUNT_VALIDATION',()=>bounded(()=>requireNativeDiagnosticActivation({env,source})));return {sourceBasisCurrent:s.sourceBasisCurrent===true,actualBindingsApplied:actualBindings()};
  };
  phase='PRE_NATIVE_SOURCE_UNAVAILABLE';diagnosed('SELECTED_STARTUP_SOURCE_ABSENCE',()=>bounded(()=>selectedStartupSourcesAbsent(assets)));pre=current('BEFORE_NATIVE');diagnosed('PRELAUNCH_BUDGET',()=>guard(remaining()>5000));
  binding={...(witness?{interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION}:{}),hostBase:base,sourceSha256:build.sourceSha256,helperSha256:build.helperSha256,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256};
  phase='NATIVE_COLLECTION_UNAVAILABLE';observed=await collect(()=>{
   // Final same-process late currency precedes the sole actual native spawn.
   diagnosed('SELECTED_STARTUP_SOURCE_ABSENCE',()=>bounded(()=>selectedStartupSourcesAbsent(assets)));current('BEFORE_NATIVE');diagnosed('PRELAUNCH_BUDGET',()=>guard(remaining()>5000));launched=true;
   const child=spawn(native,argv,{cwd:build.cwd,env:nativeEnv,detached:true,stdio:['ignore','pipe','pipe']});
   child.kill=sig=>{if(child.exitCode!==null||child.signalCode!==null||!Number.isInteger(child.pid))return false;try{process.kill(-child.pid,sig);return true;}catch{return false;}};return child;
  },{binding,activation:{env,source},timeoutMs:Math.min(115000,Math.floor(remaining()-5000)),cleanupMs:5000,signal});
  guard(observed.owned_native_reaped===true&&observed.native_exit_observed===true&&observed.native_exit_code===0&&observed.native_signal===null&&observed.timed_out===false&&!observed.transport_error);
  phase='POST_NATIVE_SOURCE_UNAVAILABLE';guard(remaining()>0);post=current('AFTER_NATIVE');
  guard(bounded(()=>validateNativePostStartupSources(assets))==='EXACT_NATIVE_EMPTY_SENTINEL');remotePolicyEstablished=true;
  // Old052B controlledShellStartup remains false. The new witness reports
  // only actual child bindings/stdio after matching native trace and currency;
  // neither route certifies global startup, pre-main reads or enforcement.
  interpreted=interpret(observed,{sourceCurrent:true,helperCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,
   sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256,nativeSha256:binding.nativeSha256,
   startupPreconditions:true,noHooksCurrent:true,...(witness?{interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION}:{controlledShellStartup:false})});
  guard(remaining()>0);
 }catch{reason=phase;}
 finally{
  // Always consume private frames once, even if post-currency failed. Never
  // reinterpret a serialized collection or keep a raw model transcript.
  if(observed&&!interpreted)interpreted=interpret(observed,{});
  if(baseId){
   if(launched&&observed?.owned_native_reaped!==true)cleanup='RETAINED_NATIVE_CLOSE_UNKNOWN';
   else try{guard(remaining()>0&&ownBase(base)===baseId);fs.rmSync(base,{recursive:true,force:false});guard(remaining()>0);cleanup='OWNED_FRESH_BASE_REMOVED';}
   catch{cleanup='UNKNOWN';reason??='OWNED_CLEANUP_UNAVAILABLE';}
  }
 }
 const ended=performance.now(),clockKnown=Number.isFinite(ended)&&ended>=last;
 return authority({...(witness?{scope:'FIXED_SINGLE_DIRECT_NATIVE_CHILD_STARTUP_WITNESS_DIAGNOSTIC_ONLY',witnessInterpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION}:{}),source:typeof source==='string'&&/^[a-f0-9]{40}$/.test(source)?source:null,nativeVersion:REVIEWED_CLAUDE_NATIVE.version,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256,
  outcome:reason?'UNKNOWN':interpreted?.outcome??'UNKNOWN',reason:reason??interpreted?.reason??'PRECONDITION_UNAVAILABLE',
  observation:interpreted??null,nativeLaunchAttempted:launched,nativeSpawnObserved:observed?.native_process_spawn_observed??false,
  nativeExit:observed?.native_exit_code??null,nativeSignal:observed?.native_signal??null,nativeCloseObserved:observed?.native_exit_observed??false,nativeReaped:observed?.owned_native_reaped??false,timedOut:observed?.timed_out??false,jobDeadlineExceeded:deadline===null?null:clockKnown?ended>=deadline:'UNKNOWN',milliseconds:clockKnown?ended-started:null,nativeMilliseconds:observed?.milliseconds??null,
  guardDiagnostics:{schema:1,scope:'STATIC_GUARD_CLASSES_AND_CALL_COUNTS_ONLY',failure:guardFailure,counts:guardCounts,resultFields:guardResultFields},sourceStartupBefore:pre,sourceStartupAfter:post,remotePolicyRule:remotePolicyEstablished?POST_REMOTE_SENTINEL_RULE:null,
  accountFactDigest:ownerFact?.digest??null,helperSha256:typeof build?.helperSha256==='string'&&/^[a-f0-9]{64}$/.test(build.helperSha256)?build.helperSha256:null,buildProfileId:build?.profileId??null,buildInterpretation:build?.buildInterpretation??null,buildRequested,buildOutcome:build?.outcome??(buildRequested?'UNKNOWN':'NOT_STARTED'),buildAttemptCount:Number.isInteger(build?.dispatchAttemptCount)&&build.dispatchAttemptCount>=0&&build.dispatchAttemptCount<=1?build.dispatchAttemptCount:buildRequested?null:0,cleanup});
}
async function main(signal){const args=process.argv.slice(2);guard(args.length===3&&args[0]==='--run'&&args[1]==='--source');return runFixedNativeStdioDiagnostic({env:process.env,source:args[2],signal});}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const abort=new AbortController(),cancel=()=>abort.abort();for(const sig of ['SIGINT','SIGTERM','SIGHUP'])process.on(sig,cancel);
 main(abort.signal).then(report=>{console.log(JSON.stringify(report));process.exitCode=report.outcome==='OBSERVED_COMPATIBLE'?0:2;})
 .catch(()=>{console.log(JSON.stringify(authority({outcome:'UNKNOWN',reason:'FIXED_ENTRY_UNAVAILABLE'})));process.exitCode=2;})
 .finally(()=>{for(const sig of ['SIGINT','SIGTERM','SIGHUP'])process.removeListener(sig,cancel);});
}
