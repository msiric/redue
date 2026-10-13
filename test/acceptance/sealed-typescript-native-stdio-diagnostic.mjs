// Fixed test-only native187 stdio observation, not REDUE verification/sealing.
// One live process composes preparation + native collection. No saved context,
// imported artifact, arbitrary command/path/argv or settings override is adopted.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture,verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {buildNativeStdioProbe,verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {prepareNativeStdioStartup,verifyNativeStdioStartup} from './sealed-typescript-native-stdio-startup.mjs';
import {prepareDirectNativeStdioProbeCommand} from './sealed-typescript-native-stdio-command.mjs';
import {nativeStdioDirectCommand,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {requireNativeDiagnosticActivation,nativeDiagnosticEnvironment,nativeDiagnosticArgv,selectedStartupSourcesAbsent,validateNativePostStartupSources,POST_REMOTE_SENTINEL_RULE,readOwnedDiagnosticFile,putOwnedDiagnosticFile,validateOwnedDiagnosticManifest,collectDirectNativeStdioDiagnostic,interpretCollectedDirectNativeStdioDiagnostic} from './portable-claude-diagnostic.mjs';
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
 guard(arguments.length===1&&options&&Object.getPrototypeOf(options)===Object.prototype&&Reflect.ownKeys(options).every(k=>['env','source','signal'].includes(k)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value'))&&
  ['env','source'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')));
 const {env,source,signal}=options;let phase='ACTIVATION_OR_PROFILE_UNAVAILABLE',base=null,baseId=null,observed=null,interpreted=null,launched=false,cleanup='NOT_NEEDED',reason=null;
 let fixture,build,startup,proposal,manifest,nativeEnv,argv,binding,ownerFact,pre=null,post=null,remotePolicyEstablished=false;
 const started=performance.now();let last=started,deadline=null;
 const remaining=()=>{const now=performance.now();guard(Number.isFinite(now)&&Number.isFinite(last)&&now>=last&&deadline!==null);last=now;return deadline-now;};
 const bounded=fn=>{guard(remaining()>0&&!signal?.aborted);const value=fn();guard(remaining()>0&&!signal?.aborted);return value;};
 try{
  ownerFact=requireNativeDiagnosticActivation({env,source});
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&!Object.hasOwn(env,'SIMPLE')&&!signal?.aborted);
  const elapsed=Date.now()-Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS);guard(Number.isSafeInteger(Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS))&&elapsed>=0&&elapsed<115000);
  deadline=started+120000-elapsed;
  // Fixed preprovisioned public binary from the reviewed workflow. It is read,
  // never downloaded, copied, relogged or selected by CLI arguments here.
  phase='NATIVE_BINDING_UNAVAILABLE';const nativeBase=env.REDUE_DIAGNOSTIC_BASE;
  guard(typeof nativeBase==='string'&&/^\/private\/tmp\/redue-claude-diagnostic-[A-Za-z0-9]{6}$/.test(nativeBase));
  const native=nativeBase+'/native/claude';
  const nativeShape=()=>{const st=bounded(()=>fs.lstatSync(native));guard(st.isFile()&&!st.isSymbolicLink()&&st.uid===process.getuid()&&st.nlink===1&&(st.mode&0o7777)===0o700);};nativeShape();
  const nativeRow=bounded(()=>readOwnedDiagnosticFile(native,224*1024*1024));guard(nativeRow.digest===REVIEWED_CLAUDE_NATIVE.sha256);
  // Validate forbidden authentication/runtime overrides BEFORE owned preparation.
  bounded(()=>nativeDiagnosticEnvironment(env,{host:nativeBase}));
  phase='LIVE_FIXTURE_UNAVAILABLE';const bootstrap=bounded(()=>createSealedTypeScriptCIBootstrap());guard(bootstrap.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');base=bootstrap.base;baseId=bounded(()=>ownBase(base));
  fixture=bounded(()=>prepareSealedTypeScriptCISyntheticFixture(bootstrap));guard(fixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
  phase='LIVE_BUILD_UNAVAILABLE';build=bounded(()=>buildNativeStdioProbe({fixture}));guard(build.outcome==='BUILT_NOT_EXECUTED');
  phase='LIVE_STARTUP_UNAVAILABLE';startup=bounded(()=>prepareNativeStdioStartup({fixture,build}));guard(startup.outcome==='STARTUP_PREPARED_NOT_LAUNCHED');
  const host=base+'/claude-host',assets={host,code:build.cwd};
  proposal=bounded(()=>prepareDirectNativeStdioProbeCommand({build,claudeExecutable:native,claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version}));
  guard(proposal.command_proposed===nativeStdioDirectCommand(base)&&proposal.cwd_proposed===build.cwd&&proposal.settings_file_proposed===host+'/settings.json'&&build.sourceSha256===NATIVE_STDIO_SOURCE_SHA256);
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
   guard(actualBindings());nativeShape();bounded(()=>validateOwnedDiagnosticManifest(manifest));nativeShape();
   const f=bounded(()=>verifySealedTypeScriptSyntheticFixture(fixture)),b=bounded(()=>verifyNativeStdioProbeBuild(build)),s=bounded(()=>verifyNativeStdioStartup(startup,when));
   guard(f.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&b.outcome==='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'&&s.outcome==='STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY'&&f.base===base&&b.hostBase===base&&s.hostBase===base);
   bounded(()=>requireNativeDiagnosticActivation({env,source}));return {sourceBasisCurrent:s.sourceBasisCurrent===true,actualBindingsApplied:actualBindings()};
  };
  phase='PRE_NATIVE_SOURCE_UNAVAILABLE';bounded(()=>selectedStartupSourcesAbsent(assets));pre=current('BEFORE_NATIVE');guard(remaining()>5000);
  binding={hostBase:base,sourceSha256:build.sourceSha256,helperSha256:build.helperSha256,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256};
  phase='NATIVE_COLLECTION_UNAVAILABLE';observed=await collectDirectNativeStdioDiagnostic(()=>{
   // Final same-process late currency precedes the sole actual native spawn.
   bounded(()=>selectedStartupSourcesAbsent(assets));current('BEFORE_NATIVE');guard(remaining()>5000);launched=true;
   const child=spawn(native,argv,{cwd:build.cwd,env:nativeEnv,detached:true,stdio:['ignore','pipe','pipe']});
   child.kill=sig=>{if(child.exitCode!==null||child.signalCode!==null||!Number.isInteger(child.pid))return false;try{process.kill(-child.pid,sig);return true;}catch{return false;}};return child;
  },{binding,activation:{env,source},timeoutMs:Math.min(115000,Math.floor(remaining()-5000)),cleanupMs:5000,signal});
  guard(observed.owned_native_reaped===true&&observed.native_exit_observed===true&&observed.native_exit_code===0&&observed.native_signal===null&&observed.timed_out===false&&!observed.transport_error);
  phase='POST_NATIVE_SOURCE_UNAVAILABLE';guard(remaining()>0);post=current('AFTER_NATIVE');
  guard(bounded(()=>validateNativePostStartupSources(assets))==='EXACT_NATIVE_EMPTY_SENTINEL');remotePolicyEstablished=true;
  // The052B flag is intentionally NOT certified by source/profile/config facts.
  // Actual metadata is retained, but enforcement remains a separate observation.
  interpreted=interpretCollectedDirectNativeStdioDiagnostic(observed,{sourceCurrent:true,helperCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,
   sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256,nativeSha256:binding.nativeSha256,
   startupPreconditions:true,noHooksCurrent:true,controlledShellStartup:false});
  guard(remaining()>0);
 }catch{reason=phase;}
 finally{
  // Always consume private frames once, even if post-currency failed. Never
  // reinterpret a serialized collection or keep a raw model transcript.
  if(observed&&!interpreted)interpreted=interpretCollectedDirectNativeStdioDiagnostic(observed,{});
  if(baseId){
   if(launched&&observed?.owned_native_reaped!==true)cleanup='RETAINED_NATIVE_CLOSE_UNKNOWN';
   else try{guard(remaining()>0&&ownBase(base)===baseId);fs.rmSync(base,{recursive:true,force:false});guard(remaining()>0);cleanup='OWNED_FRESH_BASE_REMOVED';}
   catch{cleanup='UNKNOWN';reason??='OWNED_CLEANUP_UNAVAILABLE';}
  }
 }
 const ended=performance.now(),clockKnown=Number.isFinite(ended)&&ended>=last;
 return authority({source:typeof source==='string'&&/^[a-f0-9]{40}$/.test(source)?source:null,nativeVersion:REVIEWED_CLAUDE_NATIVE.version,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256,
  outcome:reason?'UNKNOWN':interpreted?.outcome??'UNKNOWN',reason:reason??interpreted?.reason??'PRECONDITION_UNAVAILABLE',
  observation:interpreted??null,nativeLaunchAttempted:launched,nativeSpawnObserved:observed?.native_process_spawn_observed??false,
  nativeExit:observed?.native_exit_code??null,nativeSignal:observed?.native_signal??null,nativeCloseObserved:observed?.native_exit_observed??false,nativeReaped:observed?.owned_native_reaped??false,timedOut:observed?.timed_out??false,jobDeadlineExceeded:deadline===null?null:clockKnown?ended>=deadline:'UNKNOWN',milliseconds:clockKnown?ended-started:null,nativeMilliseconds:observed?.milliseconds??null,
  sourceStartupBefore:pre,sourceStartupAfter:post,remotePolicyRule:remotePolicyEstablished?POST_REMOTE_SENTINEL_RULE:null,
  accountFactDigest:ownerFact?.digest??null,helperSha256:typeof build?.helperSha256==='string'&&/^[a-f0-9]{64}$/.test(build.helperSha256)?build.helperSha256:null,buildOutcome:build?.outcome??'NOT_STARTED',buildAttemptCount:build?.dispatchAttemptCount??0,cleanup});
}
async function main(signal){const args=process.argv.slice(2);guard(args.length===3&&args[0]==='--run'&&args[1]==='--source');return runFixedNativeStdioDiagnostic({env:process.env,source:args[2],signal});}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const abort=new AbortController(),cancel=()=>abort.abort();for(const sig of ['SIGINT','SIGTERM','SIGHUP'])process.on(sig,cancel);
 main(abort.signal).then(report=>{console.log(JSON.stringify(report));process.exitCode=report.outcome==='OBSERVED_COMPATIBLE'?0:2;})
 .catch(()=>{console.log(JSON.stringify(authority({outcome:'UNKNOWN',reason:'FIXED_ENTRY_UNAVAILABLE'})));process.exitCode=2;})
 .finally(()=>{for(const sig of ['SIGINT','SIGTERM','SIGHUP'])process.removeListener(sig,cancel);});
}
