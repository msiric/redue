// Opt-in trusted/quiescent PRE-NATIVE observation only. Eight fixed C builds;
// no built helper, TypeScript check, native agent, model or receipt executes.
// Private mints stay in this process and are NOT restorable from its report.
import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const scope='FIXED_ENCLOSURE_PROVISIONING_OBSERVATION_ONLY',profile='fixed-enclosure-local-sdk27@1';
const guard=value=>{if(!value)throw Error('FIXED_ENCLOSURE_PREPARATION_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const authority={compilerCheckExecutions:0,helperExecutions:0,nativeAgentLaunches:0,models:0,receiptWrites:0,recordAdoptionAuthority:false,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false};
// Injection supports deterministic source controls ONLY. The executable branch
// fixes every operation below; there is no CLI command/path/config dispatcher.
export async function observeFixedEnclosurePreparation({ready,load,now}){
 const begun=now();let last=begun,reason='PRECONDITION_UNAVAILABLE',failedPhase=null,completed=false,attempts=0;const phases=[],builds=[],ownedRootNames=[],newFileDigests=[];
 const tick=()=>{const n=now();guard(Number.isFinite(begun)&&begun>=0&&Number.isFinite(n)&&n>=last&&n-begun<30000);last=n;return n;};
 const phase=async(name,action)=>{reason='PHASE_UNAVAILABLE';failedPhase=name;const began=tick();try{const value=await action();tick();phases.push({name,elapsedMs:last-began,outcome:'COMPLETED'});return value;}catch{try{tick();}catch{}phases.push({name,elapsedMs:Number.isFinite(last)&&last>=began?last-began:null,outcome:'UNKNOWN'});throw Error('PHASE_UNAVAILABLE');}};
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
  const preparedNullSource=await phase('preparedNull',()=>{const value=op.prepareNull({hostBase:host.base});guard(value.disabled===true&&value.version==='campaign-prepared-devnull-setexec@2'&&value.sealed===false&&value.reuseEligible===false);return value;});
  const source=await phase('enclosureSource',()=>{const value=op.prepareEnclosure({...original,projection,preparedNullSource});guard(value.version==='fixed-canary-finite-enclosure-source@2');return requireOutcome(value,'FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED');});
  const built=await phase('enclosureBuilds',()=>{const value=op.buildEnclosure({source});requireBuild(value,2);return requireOutcome(value,'BUILT_NOT_EXECUTED');});
  await phase('enclosureCurrent',()=>requireOutcome(op.verifyEnclosure(built),'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
  await phase('finalValidation',()=>{guard(builds.length===8&&attempts===8&&new Set(ownedRootNames.map(row=>row.name)).size===3&&built.report?.profileId===profile&&built.report.sourceVersion==='fixed-canary-finite-enclosure-source@2'&&built.report.files.length===6);for(let index=0;index<6;index++){const row=built.report.files[index];guard(typeof row.digest==='string'&&/^[a-f0-9]{64}$/.test(row.digest));newFileDigests.push({index,sha256:row.digest});}requireOutcome(op.verifyEnclosure(built),'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');});
  tick();completed=true;failedPhase=null;reason='BUILT_NOT_EXECUTED';
 }catch{/* Preserve known partial roots, phase costs and true process facts. */}
 let result={schema:1,scope,profile,outcome:completed?'BUILT_NOT_EXECUTED':'UNKNOWN',reason_code:reason,failedPhase,phases,ownedRootNames,builds,buildAttemptCount:attempts,buildResultCount:builds.length,observedProcessCount:builds.filter(row=>row.pidObserved).length,compilerBuildOutcome:builds.some(row=>row.pidObserved&&row.status>0&&row.signal===null&&row.spawnError==='NONE')?'EXIT_NONZERO':builds.length===8&&builds.every(row=>row.completed)?'EXIT_ZERO':'UNKNOWN',newFileDigests,elapsedMs:Number.isFinite(last)&&Number.isFinite(begun)&&last>=begun?last-begun:null,privateMints:'PROCESS_LOCAL_NOT_ADOPTABLE_FROM_REPORT',newCodeCurrentness:'PRE_NATIVE_ENDPOINTS_ONLY',nativeIntervalBarrier:'NOT_ESTABLISHED',completeSdkClosure:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',...authority};
 // Serialization and final report validation also consume the same body budget.
 try{guard(Buffer.byteLength(JSON.stringify(result))<=65536);tick();result={...result,elapsedMs:last-begun};}catch{result={...result,outcome:'UNKNOWN',reason_code:'FINAL_REPORT_OR_BUDGET_UNAVAILABLE'};}
 return freeze(result);
}
async function fixedOperations(){
 const pair=await import('./sealed-typescript-base-exchange-pair.mjs'),fixture=await import('./sealed-typescript-synthetic-fixture.mjs'),assets=await import('./sealed-typescript-base-exchange-assets.mjs'),paired=await import('./sealed-typescript-paired-stage-source.mjs'),copies=await import('./sealed-typescript-fixed-campaign-copies.mjs'),nullSource=await import('./sealed-typescript-fixed-campaign-prepared-null-source.mjs'),enclosure=await import('./sealed-typescript-fixed-campaign-enclosure-source.mjs'),build=await import('./sealed-typescript-fixed-campaign-enclosure-build.mjs');
 return{preparePair:pair.prepareSealedTypeScriptBaseExchangePair,createHost:fixture.createSealedTypeScriptCIBootstrap,prepareHostFixture:fixture.prepareSealedTypeScriptCISyntheticFixture,buildAssets:assets.buildSealedTypeScriptBaseExchangeAssets,verifyAssets:assets.verifySealedTypeScriptBaseExchangeAssets,preparePairedSource:paired.prepareSealedTypeScriptPairedStageSource,buildPaired:assets.buildSealedTypeScriptPairedStageArtifacts,verifyPaired:assets.verifySealedTypeScriptPairedStageArtifacts,provisionCopies:copies.provisionSealedTypeScriptFixedCampaignCopies,verifyCopies:copies.verifySealedTypeScriptFixedCampaignCopies,buildLauncher:assets.buildSealedTypeScriptFixedCampaignLauncher,verifyLauncher:assets.verifySealedTypeScriptFixedCampaignLauncherBuild,prepareProjection:assets.prepareSealedTypeScriptFixedCanaryProtectedInputProjection,prepareNull:nullSource.prepareSealedTypeScriptFixedCampaignPreparedNullSource,prepareEnclosure:enclosure.prepareSealedTypeScriptFixedCampaignEnclosureSource,buildEnclosure:build.buildSealedTypeScriptFixedCampaignEnclosure,verifyEnclosure:build.verifySealedTypeScriptFixedCampaignEnclosureBuild};
}
const here=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===here){
 if(process.argv.length!==3||process.argv[2]!=='--fixed-preparation-child'){process.stdout.write(JSON.stringify({schema:1,scope,outcome:'NOT_SELECTED',...authority})+'\n');}
 else{const result=await observeFixedEnclosurePreparation({now:()=>performance.now(),load:fixedOperations,ready:()=>process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node')&&process.execArgv.length===0&&['getuid','geteuid','getgid','getegid'].every(k=>typeof process[k]==='function')&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&!Object.keys(process.env).some(k=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(k))});process.exitCode=result.outcome==='BUILT_NOT_EXECUTED'?0:74;process.stdout.on('error',()=>{process.exitCode=74;});process.stdout.write(JSON.stringify(result)+'\n');}
}
