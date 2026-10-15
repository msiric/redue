// Preparation CLI is opt-in trusted/quiescent PRE-NATIVE observation only:
// eight fixed C builds, no built helper, TypeScript check, native agent, model
// or receipt execution. Separate fixed native exports require their own gates.
// Private mints stay in this process and are NOT restorable from its report.
// Driver CLI stays preparation-only; the separate fixed native child owns
// literal opt-in native modes. This module never adopts a public report.
// Preparation profile@2 explicitly permits 60s body; this does not change the
// SDK27@1 enclosure builder's own 30s budget or any native/checker/model limit.
import {isNativeError} from 'node:util/types';import {writeSync} from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import * as fixedCost from './sealed-typescript-preparation-cost.mjs';
import fs from 'node:fs';import {spawn} from 'node:child_process';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {requireNativeDiagnosticActivation,nativeDiagnosticEnvironment,selectedStartupSourcesAbsent,validateNativePostStartupSources,readOwnedDiagnosticFile,putOwnedDiagnosticFile,validateOwnedDiagnosticManifest,collectNativeEnclosureDiagnostic,interpretCollectedNativeEnclosureDiagnostic,NODE_SHA} from './portable-claude-diagnostic.mjs';
import {prepareSealedTypeScriptNativeEnclosureCommand} from './sealed-typescript-native-enclosure-command.mjs';
import {prepareNativeEnclosureStartup,verifyNativeEnclosureStartup} from './sealed-typescript-native-enclosure-startup.mjs';
import {sealedTypeScriptBaseExchangeAssetsFixtureProfile} from './sealed-typescript-base-exchange-assets.mjs';
import {observeSealedTypeScriptFixedCampaignEnclosurePostNativeEndpoint} from './sealed-typescript-fixed-campaign-enclosure-build.mjs';
const scope='FIXED_ENCLOSURE_PROVISIONING_OBSERVATION_ONLY',profile='fixed-enclosure-preparation-local-sdk27@2',buildProfile='fixed-enclosure-local-sdk27@1';
const ciPreparationProfile='fixed-enclosure-preparation-ci-sdk26.5-toolpair-a@1',ciBuildProfile='fixed-enclosure-ci-sdk26.5-toolpair-a@1',ciFixtureProfile='fixed-native-assets-ci-sdk26.5-toolpair-a@1';
const enclosureRefusalStages=Object.freeze(['OPTIONS','ORIGINAL_DERIVATION','PREPARED_NULL_CURRENT','INITIAL_ORIGINAL_CURRENT','PROJECTION_INTERPRETATION','CAMPAIGN_RENDER','DERIVED_BINDINGS','COLLECTOR_FUNCTION_PIN','C_TEMPLATE_READ','COLLECTOR_TEMPLATE_READ','LAUNCHER_REBIND','ENCLOSURE_REBIND','FINAL_ORIGINAL_CURRENT','SOURCE_RESULT']);
const originalCurrentRefusalStages=Object.freeze(['DERIVATION','PROJECTION_CURRENT','PREPARED_NULL_CURRENT','PROJECTION_RESULT','PREPARED_NULL_RESULT','C_SOURCE_READ','C_SOURCE_IDENTITY','COLLECTOR_SOURCE_READ','COLLECTOR_SOURCE_IDENTITY','C_SOURCE_NAMED','COLLECTOR_SOURCE_NAMED']);
const ownStaticRefusal=(error,key,stages)=>{const descriptor=Object.getOwnPropertyDescriptor(error,key);return descriptor&&Object.hasOwn(descriptor,'value')&&descriptor.enumerable===true&&descriptor.writable===false&&descriptor.configurable===false&&typeof descriptor.value==='string'&&stages.includes(descriptor.value)?descriptor.value:null;};
const guard=value=>{if(!value)throw Error('FIXED_ENCLOSURE_PREPARATION_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const preparedContexts=new WeakMap();
const authority={compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,receiptWrites:0,recordAdoptionAuthority:false,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false};
// Injection supports deterministic source controls ONLY. The executable branch
// fixes every operation below; there is no CLI command/path/config dispatcher.
// Progress carries only newly returned facts, never inferred dispatch counts.
// The CLI synchronously drains each BEGIN on fixed stdout before its action;
// parent clocks/caps, not child timing or this report, control the lifetime.
export async function observeFixedEnclosurePreparation(options){return prepareFixedSequence(options,null);}
// Separate fixed CI entry points. Mock observers never capture private originals.
export async function observeFixedCIEnclosurePreparation(options){return prepareFixedSequence(options,null,true);}
export async function prepareFixedCIEnclosurePreparation(){
 guard(arguments.length===0);
 return prepareFixedSequence({ready:fixedCIReady,load:fixedCIOperations,now:()=>performance.now()},null,true);
}
async function prepareFixedSequence({ready,load,now,observeProgress=()=>{}},captureOriginals,ci=false){
 const begun=now();let last=begun,reason='PRECONDITION_UNAVAILABLE',failedPhase=null,completed=false,attempts=0,enclosureSourceRefusal=null,originalCurrentRefusal=null;const phases=[],builds=[],ownedRootNames=[],newFileDigests=[];let sequence=0,rootCursor=0,buildCursor=0,progressFailed=false,originals=null;
 const tick=()=>{const n=now();guard(Number.isFinite(begun)&&begun>=0&&Number.isFinite(n)&&n>=last&&n-begun<60000);last=n;return n;};
 const progress=(kind,name,index,began,outcome)=>{const frame={schema:1,protocol:'fixed-enclosure-progress@2',kind,sequence:sequence++,phaseIndex:index,name,elapsedMs:Math.round((last-begun)*1000)/1000,phaseElapsedMs:kind==='BEGIN'?null:Math.round((last-began)*1000)/1000,outcome,newRoots:ownedRootNames.slice(rootCursor),newBuilds:builds.slice(buildCursor),buildAttemptCount:attempts,buildResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved).length,compilerBuildOutcome:builds.some(row=>row.pidObserved&&row.status>0&&row.signal===null&&row.spawnError==='NONE')?'EXIT_NONZERO':'UNKNOWN',countsMeaning:'RETURNED_OBSERVATIONS_LOWER_BOUND',activeDispatchCount:'UNKNOWN'};try{observeProgress(freeze(frame));rootCursor=ownedRootNames.length;buildCursor=builds.length;}catch{progressFailed=true;throw Error('PROGRESS_UNAVAILABLE');}};
 const phase=async(name,action)=>{reason='PHASE_UNAVAILABLE';failedPhase=name;const began=tick(),index=phases.length;progress('BEGIN',name,index,began,'IN_PROGRESS');try{const value=await action();tick();phases.push({name,elapsedMs:last-began,outcome:'COMPLETED'});progress('END',name,index,began,'COMPLETED');return value;}catch(error){if(name==='enclosureSource'&&isNativeError(error)){enclosureSourceRefusal=ownStaticRefusal(error,'refusalStage',enclosureRefusalStages);if(['INITIAL_ORIGINAL_CURRENT','FINAL_ORIGINAL_CURRENT'].includes(enclosureSourceRefusal))originalCurrentRefusal=ownStaticRefusal(error,'originalCurrentRefusal',originalCurrentRefusalStages);}try{tick();}catch{}if(phases.length===index)phases.push({name,elapsedMs:Number.isFinite(last)&&last>=began?last-began:null,outcome:'UNKNOWN'});if(!progressFailed)progress('END',name,index,began,'UNKNOWN');throw Error('PHASE_UNAVAILABLE');}};
 const root=(role,base)=>{guard(typeof base==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(base));ownedRootNames.push({role,name:path.basename(base)});};
 const requireOutcome=(value,outcome)=>{guard(value?.outcome===outcome&&value.sealed===false&&value.reuseEligible===false);return value;};
 const requireBuild=(value,count)=>{
  const actual=value?.builds;guard(Array.isArray(actual)&&actual.length<=count);const dispatch=value?.dispatchAttemptCount;guard(Number.isInteger(dispatch)&&dispatch>=0&&dispatch<=count);attempts+=dispatch;
  for(const row of actual){guard(row&&typeof row.pidObserved==='boolean'&&typeof row.completed==='boolean'&&(row.status===null||Number.isInteger(row.status)&&row.status>=0&&row.status<=255)&&(row.signal===null||['SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGILL','SIGINT','UNKNOWN'].includes(row.signal))&&['NONE','UNKNOWN'].includes(row.spawnError)&&Number.isSafeInteger(row.stdoutBytes)&&row.stdoutBytes>=0&&Number.isSafeInteger(row.stderrBytes)&&row.stderrBytes>=0);builds.push({pidObserved:row.pidObserved,status:row.status,signal:row.signal,spawnError:row.spawnError,completed:row.completed,stdoutBytes:row.stdoutBytes,stderrBytes:row.stderrBytes});}
  guard(dispatch===count&&actual.length===count&&actual.every(row=>row.pidObserved&&row.completed&&row.status===0&&row.signal===null&&row.spawnError==='NONE'));
 };
 try{
  tick();guard(ready()===true);tick();const op=await phase('operationImports',load);
  const pair=await phase('freshPair',()=>{const value=op.preparePair();root('A',value.baseA);root('B',value.baseB);return requireOutcome(value,'BASE_EXCHANGE_PAIR_PREPARED');});
  const host=await phase('freshHost',()=>{const value=op.createHost();root('H',value.base);return requireOutcome(value,'CI_SYNTHETIC_BOOTSTRAP_PREPARED');});
  const fixture=await phase('hostFixture',()=>requireOutcome(op.prepareHostFixture(host),'SYNTHETIC_FIXTURE_PREPARED'));
  const assets=await phase('prerequisiteBuilds',()=>{const value=op.buildAssets({pair,hostFixture:fixture});requireBuild(value,3);return requireOutcome(value,'BUILT_NOT_EXECUTED');});
  await phase('prerequisiteCurrent',()=>requireOutcome(op.verifyAssets(assets),'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'));
  const pairedSource=await phase('pairedSource',()=>{const value=op.preparePairedSource({pair,assetsBuild:assets});guard(value.disabled===true&&value.sealed===false&&value.reuseEligible===false);return value;});
  const pairedArtifacts=await phase('pairedBuilds',()=>{const value=op.buildPaired({assetsBuild:assets,source:pairedSource});requireBuild(value,2);return requireOutcome(value,'BUILT_NOT_EXECUTED');});
  await phase('pairedCurrent',()=>requireOutcome(op.verifyPaired(pairedArtifacts),'PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'));
  const inputs={assetsBuild:assets,pairedSource,pairedArtifacts};
  const copies=await phase('campaignCopies',()=>requireOutcome(op.provisionCopies(inputs),'CAMPAIGN_COPIES_OBSERVED_NOT_EXECUTED'));
  await phase('copiesCurrent',()=>requireOutcome(op.verifyCopies(copies),'CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'));
  const original={...inputs,copies};
  const launcher=await phase('oldLauncherBuild',()=>{const value=op.buildLauncher(original);requireBuild(value,1);return requireOutcome(value,'CAMPAIGN_LAUNCHER_BUILT_NOT_EXECUTED');});
  await phase('oldLauncherCurrent',()=>requireOutcome(op.verifyLauncher(launcher),'CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
  const projection=await phase('originalProjection',()=>requireOutcome(op.prepareProjection(original),'ORIGINAL_PROTECTED_INPUT_PROJECTION_PREPARED'));
  const preparedNullSource=await phase('preparedNull',()=>{const value=op.prepareNull(ci?{hostBase:host.base,assetsBuild:assets}:{hostBase:host.base});guard(value.disabled===true&&value.version==='campaign-prepared-devnull-setexec@2'&&value.sealed===false&&value.reuseEligible===false);return value;});
  const source=await phase('enclosureSource',()=>{const value=op.prepareEnclosure({...original,projection,preparedNullSource});guard(value.version==='fixed-canary-finite-enclosure-source@2'&&(!ci||value.fixtureProfileId===ciFixtureProfile));return requireOutcome(value,'FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED');});
  const built=await phase('enclosureBuilds',()=>{const value=op.buildEnclosure({source});requireBuild(value,2);return requireOutcome(value,'BUILT_NOT_EXECUTED');});
  await phase('enclosureCurrent',()=>requireOutcome(op.verifyEnclosure(built),'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
  await phase('finalValidation',()=>{guard(builds.length===8&&attempts===8&&new Set(ownedRootNames.map(row=>row.name)).size===3&&built.report?.profileId===(ci?ciBuildProfile:buildProfile)&&built.report.sourceVersion==='fixed-canary-finite-enclosure-source@2'&&built.report.files.length===6);for(let index=0;index<6;index++){const row=built.report.files[index];guard(typeof row.digest==='string'&&/^[a-f0-9]{64}$/.test(row.digest));newFileDigests.push({index,sha256:row.digest});}requireOutcome(op.verifyEnclosure(built),'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');});
  if(captureOriginals!==null)originals={pair,host,hostFixture:fixture,assetsBuild:assets,pairedSource,pairedArtifacts,copies,launcher,projection,preparedNullSource,enclosureSource:source,enclosureBuild:built,operations:op};
  tick();guard(!progressFailed);completed=true;failedPhase=null;reason='BUILT_NOT_EXECUTED';
 }catch{/* Preserve known partial roots, phase costs and true process facts. */}
 let result={schema:1,scope,profile:ci?ciPreparationProfile:profile,bodyBudgetMs:60000,cleanupBudgetMs:5000,totalBudgetMs:65000,outcome:completed?'BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:reason,failedPhase,enclosureSourceRefusal,originalCurrentRefusal,phases,ownedRootNames,builds,buildAttemptCount:attempts,buildResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved).length,compilerBuildOutcome:builds.some(row=>row.pidObserved&&row.status>0&&row.signal===null&&row.spawnError==='NONE')?'EXIT_NONZERO':builds.length===8&&builds.every(row=>row.pidObserved&&row.completed&&row.status===0&&row.signal===null&&row.spawnError==='NONE')?'EXIT_ZERO':'UNKNOWN',newFileDigests,elapsedMs:Number.isFinite(last)&&Number.isFinite(begun)&&last>=begun?last-begun:null,privateMints:'PROCESS_LOCAL_NOT_ADOPTABLE_FROM_REPORT',newCodeCurrentness:'PRE_NATIVE_ENDPOINTS_ONLY',nativeIntervalBarrier:'NOT_ESTABLISHED',completeSdkClosure:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',...authority};
 // Serialization and final report validation also consume the same body budget.
 try{guard(Buffer.byteLength(JSON.stringify(result))<=65536);tick();result={...result,elapsedMs:last-begun};}catch{result={...result,outcome:'UNKNOWN',reason_code:'FINAL_REPORT_OR_BUDGET_UNAVAILABLE'};}
 const report=freeze(result);if(captureOriginals!==null&&report.outcome==='BUILT_NOT_EXECUTED')captureOriginals(originals,report,tick);return report;
}
function fixedReady(){return process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node')&&process.execArgv.length===0&&['getuid','geteuid','getgid','getegid'].every(k=>typeof process[k]==='function')&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&!Object.keys(process.env).some(k=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(k));}
// Fixture readiness only: not a CI host match, SDK closure or origin proof.
// Hash the CURRENT canonical reviewed runtime; never guess a toolcache/nvm path.
function fixedCIReady(){
 try{
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execArgv.length===0
   &&['getuid','geteuid','getgid','getegid'].every(k=>typeof process[k]==='function')
   &&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  guard(!Object.keys(process.env).some(k=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV|SIMPLE|REDUE_DECISION_PROFILE|REDUE_DECISION_PROFILE_FILE|REDUE_PROFILE_CONTEXT)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(k)));
  const node=process.execPath;
  guard(typeof node==='string'&&path.isAbsolute(node)&&path.normalize(node)===node&&fs.realpathSync(node)===node);
  const mark=row=>['dev','ino','mode','uid','nlink','size','mtimeMs','ctimeMs'].map(k=>String(row[k])).join(':');
  const before=fs.lstatSync(node);
  guard(before.isFile()&&!before.isSymbolicLink()&&before.uid===process.getuid()&&before.nlink===1
   &&before.size===121593488&&(before.mode&0o6022)===0);
  const observed=readOwnedDiagnosticFile(node,121593488);
  guard(observed.digest===NODE_SHA&&observed.fingerprint===mark(before)
   &&mark(fs.lstatSync(node))===mark(before)&&fs.realpathSync(node)===node);
  return true;
 }catch{return false;}
}
// No supplied options, imported report, callback, path, command or environment.
// Private capture is per invocation and cannot be enabled by the mockable API.
export async function prepareFixedEnclosureContext(){
 guard(arguments.length===0);return prepareFixedContext(false);
}
export async function prepareFixedCIEnclosureContext(){
 guard(arguments.length===0);return prepareFixedContext(true);
}
async function prepareFixedContext(ci){
 let captured=null;
 const report=await prepareFixedSequence({ready:ci?fixedCIReady:fixedReady,load:ci?fixedCIOperations:fixedOperations,now:()=>performance.now()},(originals,preparedReport,tick)=>{captured={originals,preparedReport,tick};},ci);
 let context=null;
 if(report.outcome==='BUILT_NOT_EXECUTED'){try{guard(captured&&captured.preparedReport===report);const r=captured.originals,o=r.operations;
  guard(o.assetsMatchPair(r.assetsBuild,r.pair)&&o.assetsMatchHostFixture(r.assetsBuild,r.hostFixture)&&o.pairedSourceMatches(r.pairedSource,r.pair,r.assetsBuild)&&o.pairedArtifactsMatch(r.pairedArtifacts,r.assetsBuild,r.pairedSource)&&o.copiesMatch(r.copies,r.assetsBuild,r.pairedArtifacts,r.pairedSource)&&o.launcherMatches(r.launcher,r.assetsBuild,r.pairedSource,r.pairedArtifacts,r.copies)&&o.projectionMatches(r.projection,r.assetsBuild,r.pairedSource,r.pairedArtifacts,r.copies)&&o.sourceMatches(r.enclosureSource,r.assetsBuild,r.pairedSource,r.pairedArtifacts,r.copies,r.projection,r.preparedNullSource)&&o.buildMatches(r.enclosureBuild,r.enclosureSource));
  captured.tick();context=Object.freeze(Object.create(null));preparedContexts.set(context,Object.freeze({pair:r.pair,hostFixture:r.hostFixture,assetsBuild:r.assetsBuild,pairedSource:r.pairedSource,pairedArtifacts:r.pairedArtifacts,copies:r.copies,projection:r.projection,preparedNullSource:r.preparedNullSource,enclosureSource:r.enclosureSource,enclosureBuild:r.enclosureBuild}));
 }catch{return freeze({report:{...report,outcome:'UNKNOWN',reason_code:'FINAL_REPORT_OR_BUDGET_UNAVAILABLE'},context:null});}}
 return freeze({report,context});
}
// Identity only: no currency, read permission, native launch or execution GO.
// Future consumption stays private; there is deliberately no getter/adoption API.
export function isFixedEnclosurePreparationContext(value){return arguments.length===1&&preparedContexts.has(value);}
// Fixed local/CI diagnostic composition. Only separate literal opt-in child
// modes invoke it; a report never transfers private originals. The reviewed
// hard parent and actual prerequisites remain required. Not a seal/receipt producer.
export async function runFixedNativeEnclosureDiagnostic(){guard(arguments.length===0);return runFixedNativeDiagnostic(false);}
export async function runFixedCINativeEnclosureDiagnostic(){guard(arguments.length===0);return runFixedNativeDiagnostic(true);}
async function runFixedNativeDiagnostic(ci){
 const env=process.env,source=env.REDUE_CHECKED_SOURCE,started=performance.now(),cancelled=new AbortController();
 let last=started,clockFailed=false,deadline=null,timer=null,phase='ACTIVATION_OR_RUNTIME_UNAVAILABLE',reason=null;
 let preparation=null,resourcesAttempted=false,originals=null,startup=null,proposal=null,manifest=null,observed=null,observation=null,consumed=false;
 let launchAttempts=0,pre=false,post=false,nativeEnv=null,argv=null,settings=null;
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),digest=v=>createHash('sha256').update(v).digest('hex');
 const clock=()=>{const now=performance.now();if(!Number.isFinite(started)||started<0||!Number.isFinite(now)||!Number.isFinite(last)||now<last)clockFailed=true;guard(!clockFailed);last=now;return now;};
 const remaining=()=>{guard(deadline!==null);return deadline-clock();};
 const available=()=>guard(remaining()>0&&!cancelled.signal.aborted);
 const bounded=fn=>{available();const value=fn();available();return value;};
 const cancel=()=>cancelled.abort();
 const requiredArgs=(args,required)=>{let from=0;for(let at=0;at<required.length;at++){const found=args.indexOf(required[at],from);if(found<0)return false;if(at+1<required.length&&!required[at+1].startsWith('--')){if(args[found+1]!==required[++at])return false;from=found+2;}else from=found+1;}return true;};
 try{
  clock();requireNativeDiagnosticActivation({env,source});guard((ci?fixedCIReady():fixedReady())&&!Object.hasOwn(env,'SIMPLE'));
  guard(typeof env.REDUE_DIAGNOSTIC_JOB_STARTED_MS==='string'&&/^[0-9]{10,16}$/.test(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS));
  const jobStart=Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS),elapsed=Date.now()-jobStart;
  guard(Number.isSafeInteger(jobStart)&&Number.isFinite(elapsed)&&elapsed>=0&&elapsed<115000);deadline=started+120000-elapsed;available();
  const nativeBase=env.REDUE_DIAGNOSTIC_BASE;guard(typeof nativeBase==='string'&&/^\/private\/tmp\/redue-claude-diagnostic-[A-Za-z0-9]{6}$/.exec(nativeBase)?.[0]===nativeBase);
  const native=nativeBase+'/native/claude';
  guard(typeof env.HOME==='string'&&path.isAbsolute(env.HOME)&&path.normalize(env.HOME)===env.HOME&&!/[\0\r\n]/.test(env.HOME));const originalHome=env.HOME;
  phase='PINNED_RUNTIME_OR_ENVIRONMENT_UNAVAILABLE';
  bounded(()=>nativeDiagnosticEnvironment(env,{host:nativeBase}));
  guard(bounded(()=>readOwnedDiagnosticFile(process.execPath,128*1024*1024)).digest===NODE_SHA);
  const nativeShape=()=>{const row=fs.lstatSync(native);guard(fs.realpathSync(native)===native&&row.isFile()&&!row.isSymbolicLink()&&row.uid===process.getuid()&&row.nlink===1&&(row.mode&0o7777)===0o700);};
  bounded(nativeShape);const nativeRow=bounded(()=>readOwnedDiagnosticFile(native,224*1024*1024));guard(nativeRow.digest===REVIEWED_CLAUDE_NATIVE.sha256);bounded(nativeShape);
  for(const signal of ['SIGINT','SIGTERM','SIGHUP'])process.on(signal,cancel);
  timer=setTimeout(cancel,Math.max(0,remaining()));
  phase='GENUINE_PREPARATION_UNAVAILABLE';resourcesAttempted=true;
  const prepared=await (ci?prepareFixedCIEnclosureContext():prepareFixedEnclosureContext());
  // Consume FIRST, synchronously after preparation: no await, public report
  // validation, clock, path or resource operation can precede this deletion.
  originals=preparedContexts.get(prepared.context);preparedContexts.delete(prepared.context);
  preparation=prepared.report;available();guard(originals&&preparation.outcome==='BUILT_NOT_EXECUTED');
  const selectedBuild=ci?ciBuildProfile:buildProfile,selectedPreparation=ci?ciPreparationProfile:profile;
  guard(preparation.profile===selectedPreparation&&sealedTypeScriptBaseExchangeAssetsFixtureProfile(originals.assetsBuild)===(ci?ciFixtureProfile:'fixed-native-assets-local-sdk27@1'));
  guard(originals.enclosureBuild.report.profileId===selectedBuild&&(ci?originals.enclosureSource.fixtureProfileId===ciFixtureProfile:originals.enclosureSource.fixtureProfileId===undefined));
  const commandOptions={...originals,claudeExecutable:native,claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version};
  phase='ORIGINAL_COMMAND_OR_STARTUP_UNAVAILABLE';
  proposal=bounded(()=>prepareSealedTypeScriptNativeEnclosureCommand(commandOptions));
  guard(proposal.scope==='DISABLED_FIXED_NATIVE_ENCLOSURE_COMMAND_PROPOSAL_ONLY'&&proposal.preparation_profile_proposed===selectedBuild&&proposal.parent_timeout_ms_proposed===120000&&proposal.max_turns_proposed===4&&proposal.tool_timeout_ms_proposed===15000);
  startup=bounded(()=>prepareNativeEnclosureStartup(originals));
  const host=originals.enclosureSource.bindings.hostBase,assets={host:host+'/claude-host',code:proposal.cwd_proposed};
  guard(startup.outcome==='STARTUP_PREPARED_NOT_LAUNCHED'&&startup.hostBase===host&&startup.buildProfileId===selectedBuild&&proposal.settings_file_proposed===assets.host+'/settings.json');
  const appliedSettings=()=>{const value=structuredClone(proposal.settings_proposed);Object.assign(value,startup.requiredSettings);
   value.sandbox.credentials.envVars.push({name:'REDUE_PREFLIGHT_SENTINEL',mode:'deny'});
   for(const tail of ['Library/Keychains','.ssh','.aws','.npmrc','.claude','.config','.git-credentials'])value.sandbox.filesystem.denyRead.push(path.join(originalHome,tail));
   value.sandbox.filesystem.denyWrite.push(path.join(originalHome,'Library/Keychains'));return value;
  };
  phase='EXCLUSIVE_SETTINGS_OR_BINDINGS_UNAVAILABLE';settings=freeze(appliedSettings());const settingsBytes=Buffer.from(JSON.stringify(settings)+'\n');
  bounded(()=>putOwnedDiagnosticFile(proposal.settings_file_proposed,settingsBytes));const settingsRow=bounded(()=>readOwnedDiagnosticFile(proposal.settings_file_proposed,262144));guard(settingsRow.digest===digest(settingsBytes));
  manifest={base:host,native,files:[{file:native,digest:nativeRow.digest,fingerprint:nativeRow.fingerprint},{file:proposal.settings_file_proposed,digest:settingsRow.digest,fingerprint:settingsRow.fingerprint}]};
  nativeEnv=Object.freeze({...bounded(()=>nativeDiagnosticEnvironment(env,{host:assets.host})),...startup.environmentBindings});argv=Object.freeze([...proposal.argv_proposed]);
  const actualBindings=()=>env.HOME===originalHome&&equal(nativeEnv,{...nativeDiagnosticEnvironment(env,{host:assets.host}),...startup.environmentBindings})&&equal(settings,appliedSettings())&&equal(argv,proposal.argv_proposed)&&startup.requiredAbsentEnvironmentKeys.every(key=>!Object.hasOwn(nativeEnv,key))&&startup.forbiddenArgv.every(arg=>!argv.includes(arg))&&requiredArgs(argv,startup.requiredArgv);
  const startupCurrent=when=>{const s=bounded(()=>verifyNativeEnclosureStartup(startup,when));guard(s.outcome==='STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY'&&s.phase===when&&s.hostBase===host&&s.buildProfileId===selectedBuild&&s.sourceBasisCurrent===true&&s.sourceVersion===originals.enclosureSource.version&&s.projectionVersion===originals.projection.version&&s.projectionSha256===originals.enclosureSource.projectionSha256);return true;};
  const prelaunch=()=>{
   bounded(()=>guard(actualBindings()));bounded(()=>selectedStartupSourcesAbsent(assets));bounded(nativeShape);bounded(()=>validateOwnedDiagnosticManifest(manifest));bounded(nativeShape);
   guard(equal(bounded(()=>prepareSealedTypeScriptNativeEnclosureCommand(commandOptions)),proposal));startupCurrent('BEFORE_NATIVE');
   bounded(()=>requireNativeDiagnosticActivation({env,source}));guard(remaining()>5000&&!cancelled.signal.aborted);pre=true;
  };
  phase='PRE_NATIVE_CURRENTNESS_UNAVAILABLE';prelaunch();
  const binding={hostBase:host,baseA:originals.enclosureSource.bindings.baseA,command:proposal.command_proposed,cwd:proposal.cwd_proposed,sourceVersion:originals.enclosureSource.version,projectionVersion:originals.projection.version,projectionSha256:originals.enclosureSource.projectionSha256,binarySha256:proposal.binary_sha256_proposed,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256,nativeVersion:REVIEWED_CLAUDE_NATIVE.version,transportInterpretation:'finite-enclosure-normal-collection@2'};
  phase='NATIVE_COLLECTION_UNAVAILABLE';
  observed=await collectNativeEnclosureDiagnostic(()=>{guard(launchAttempts===0);prelaunch();launchAttempts++;return spawn(native,argv,{cwd:proposal.cwd_proposed,env:nativeEnv,detached:false,stdio:['ignore','pipe','pipe']});},{binding,activation:{env,source},timeoutMs:Math.min(115000,Math.floor(remaining()-5000)),cleanupMs:5000,signal:cancelled.signal});
  guard(observed.owned_native_reaped===true&&observed.native_exit_observed===true&&observed.native_exit_code===0&&observed.native_signal===null&&observed.timed_out===false&&!observed.transport_error);available();
  phase='POST_NATIVE_ENDPOINT_OR_STARTUP_UNAVAILABLE';
  // Intentional actor controls retire the full pair/tool/build/command checks.
  // Only ORIGINAL six-code endpoint + original startup AFTER + manifest remain.
  const endpoint=bounded(()=>observeSealedTypeScriptFixedCampaignEnclosurePostNativeEndpoint(originals.enclosureBuild));
  guard(endpoint.scope==='FIXED_CANARY_ENCLOSURE_CODE_ENDPOINT_DATA_ONLY'&&endpoint.outcome==='ENCLOSURE_CODE_POST_NATIVE_ENDPOINT_CURRENTLY_OBSERVED'&&endpoint.observationPhase==='POST_NATIVE_ENDPOINT'&&endpoint.observationExtent==='ENDPOINT_ONLY_NOT_INTERVAL'&&endpoint.nativeIntervalBarrier==='NOT_ESTABLISHED'&&endpoint.hostBase===host&&endpoint.projectionSha256===binding.projectionSha256&&equal(endpoint.files,originals.enclosureBuild.report.files));
  startupCurrent('AFTER_NATIVE');bounded(()=>guard(actualBindings()));bounded(nativeShape);bounded(()=>validateOwnedDiagnosticManifest(manifest));bounded(nativeShape);
  guard(bounded(()=>validateNativePostStartupSources(assets))==='EXACT_NATIVE_EMPTY_SENTINEL');post=true;
  phase='NATIVE_INTERPRETATION_UNAVAILABLE';consumed=true;
  observation=await interpretCollectedNativeEnclosureDiagnostic(observed,{sourceCurrent:true,enclosureCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,startupPreconditions:pre,noHooksCurrent:true,postNativeEndpointCurrent:post,sourceVersion:binding.sourceVersion,projectionVersion:binding.projectionVersion,projectionSha256:binding.projectionSha256,binarySha256:binding.binarySha256,nativeSha256:binding.nativeSha256,transportInterpretation:binding.transportInterpretation});available();
 }catch{reason=clockFailed?'CLOCK_UNAVAILABLE':phase;}
 finally{
  // The async consumer deletes before its first await. Attempt exactly once
  // even on failed postconditions, cancellation or an expired overall budget.
  if(observed&&!consumed){consumed=true;try{observation=await interpretCollectedNativeEnclosureDiagnostic(observed,{});}catch{reason??='NATIVE_INTERPRETATION_UNAVAILABLE';}}
  if(timer!==null)clearTimeout(timer);for(const signal of ['SIGINT','SIGTERM','SIGHUP'])process.removeListener(signal,cancel);
 }
 try{clock();available();}catch{reason??=clockFailed?'CLOCK_UNAVAILABLE':'OVERALL_BUDGET_OR_CANCELLATION';}
 if(reason&&observation)observation=freeze({...observation,completionDataValid:false});
 return freeze({schema:1,scope:ci?'FIXED_CI_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY':'UNWIRED_FIXED_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY',outcome:observation?.outcome==='FAIL'?'FAIL':'UNKNOWN',reason:reason??'SYNTACTIC_NATIVE_COLLECTION_ONLY',preparation,observation,
  preparationAttempted:resourcesAttempted,nativeSpawnAttempts:launchAttempts,nativeSpawnObserved:observed?.native_process_spawn_observed??false,nativeExit:observed?.native_exit_code??null,nativeSignal:observed?.native_signal??null,nativeCloseObserved:observed?.native_exit_observed??false,nativeReaped:observed?.owned_native_reaped??false,timedOut:observed?.timed_out??false,
  milliseconds:clockFailed?null:last-started,overallBudgetExceeded:deadline===null||clockFailed?null:last>=deadline,cancelled:cancelled.signal.aborted,remainingBudgetMs:deadline===null||clockFailed?null:Math.max(0,deadline-last),resources:resourcesAttempted?'RETAINED_NOT_DELETED':'NOT_CREATED',detachedDescendantClosure:'UNKNOWN',nativeLaunches:observed?.native_process_spawn_observed===true?1:launchAttempts?null:0,models:launchAttempts?null:0,helperExecutions:launchAttempts?null:0,
  publicDataOnly:true,nativeAuthenticated:false,nativeEnforcement:'NOT_ESTABLISHED',nativeIntervalBarrier:'NOT_ESTABLISHED',completeSdkClosure:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',hostedCompatibility:'NOT_ESTABLISHED',originAuthority:false,receiptAuthority:false,recordAdoptionAuthority:false,sealed:false,reuseEligible:false,rawTranscriptRetained:false,rawStderrRetained:false});
}
async function fixedOperations(){return fixedSelectedOperations(false);}
async function fixedCIOperations(){return fixedSelectedOperations(true);}
async function fixedSelectedOperations(ci){
 const pair=await import('./sealed-typescript-base-exchange-pair.mjs'),fixture=await import('./sealed-typescript-synthetic-fixture.mjs'),assets=await import('./sealed-typescript-base-exchange-assets.mjs'),paired=await import('./sealed-typescript-paired-stage-source.mjs'),copies=await import('./sealed-typescript-fixed-campaign-copies.mjs'),nullSource=await import('./sealed-typescript-fixed-campaign-prepared-null-source.mjs'),enclosure=await import('./sealed-typescript-fixed-campaign-enclosure-source.mjs'),build=await import('./sealed-typescript-fixed-campaign-enclosure-build.mjs');
 return{preparePair:pair.prepareSealedTypeScriptBaseExchangePair,createHost:fixture.createSealedTypeScriptCIBootstrap,prepareHostFixture:fixture.prepareSealedTypeScriptCISyntheticFixture,buildAssets:ci?assets.buildSealedTypeScriptBaseExchangeAssetsForReviewedCI:assets.buildSealedTypeScriptBaseExchangeAssets,verifyAssets:assets.verifySealedTypeScriptBaseExchangeAssets,preparePairedSource:paired.prepareSealedTypeScriptPairedStageSource,buildPaired:assets.buildSealedTypeScriptPairedStageArtifacts,verifyPaired:assets.verifySealedTypeScriptPairedStageArtifacts,provisionCopies:copies.provisionSealedTypeScriptFixedCampaignCopies,verifyCopies:copies.verifySealedTypeScriptFixedCampaignCopies,buildLauncher:assets.buildSealedTypeScriptFixedCampaignLauncher,verifyLauncher:assets.verifySealedTypeScriptFixedCampaignLauncherBuild,prepareProjection:assets.prepareSealedTypeScriptFixedCanaryProtectedInputProjection,prepareNull:ci?nullSource.prepareSealedTypeScriptFixedCampaignPreparedNullSourceForReviewedCI:nullSource.prepareSealedTypeScriptFixedCampaignPreparedNullSource,prepareEnclosure:ci?enclosure.prepareSealedTypeScriptFixedCampaignEnclosureSourceForReviewedCI:enclosure.prepareSealedTypeScriptFixedCampaignEnclosureSource,buildEnclosure:ci?build.buildSealedTypeScriptFixedCampaignEnclosureForReviewedCI:build.buildSealedTypeScriptFixedCampaignEnclosure,verifyEnclosure:build.verifySealedTypeScriptFixedCampaignEnclosureBuild,assetsMatchPair:assets.sealedTypeScriptBaseExchangeAssetsMatchPair,assetsMatchHostFixture:assets.sealedTypeScriptBaseExchangeAssetsMatchHostFixture,pairedSourceMatches:paired.sealedTypeScriptPairedStageSourceMatchesDerivation,pairedArtifactsMatch:assets.sealedTypeScriptPairedStageArtifactsMatchDerivation,copiesMatch:copies.sealedTypeScriptFixedCampaignCopiesMatchDerivation,launcherMatches:assets.sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation,projectionMatches:assets.sealedTypeScriptFixedCanaryProtectedInputProjectionMatchesDerivation,sourceMatches:enclosure.sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation,buildMatches:build.sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource};
}
const here=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===here){
 if(process.argv.length!==3||!['--fixed-preparation-child','--fixed-ci-preparation-child'].includes(process.argv[2])){process.stdout.write(JSON.stringify({schema:1,scope,outcome:'NOT_SELECTED',...authority})+'\n');}
 else{const ci=process.argv[2]==='--fixed-ci-preparation-child';let written=0;const emit=frame=>{const body=Buffer.from(JSON.stringify(frame)+'\n');const limit=frame.kind==='FINAL'?16384:1024+frame.newBuilds.length*256+frame.newRoots.length*128;guard(body.length<=limit&&written+body.length<=65536);let at=0;while(at<body.length){const count=writeSync(1,body,at,body.length-at);guard(count>0);at+=count;written+=count;}};const options={observeProgress:emit,now:()=>performance.now(),load:ci?fixedCIOperations:fixedOperations,ready:ci?fixedCIReady:fixedReady};const costContext=ci?fixedCost.startFixedCIPreparationCostCapture():null;const result=ci?await observeFixedCIEnclosurePreparation(options):await observeFixedEnclosurePreparation(options);if(ci)fixedCost.finishFixedCIPreparationCostCapture(costContext);process.exitCode=result.outcome==='BUILT_NOT_EXECUTED'?0:74;try{emit({schema:1,protocol:'fixed-enclosure-progress@2',kind:'FINAL',report:result});}catch{process.exitCode=74;}}
}
