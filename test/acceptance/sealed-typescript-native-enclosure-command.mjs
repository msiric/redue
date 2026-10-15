// DISABLED finite native-canary command composition. No settings/provisioning,
// process, credential, environment or model operation occurs in this module.
// Private same-process original capabilities select every resource; a command
// proposal or its policy hash cannot establish native authority or enforcement.
import {createHash} from 'node:crypto';import {posix as path} from 'node:path';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-native-profile.mjs';
import {prepareSealedTypeScriptNativeBaseCommand} from './sealed-typescript-native-base-command.mjs';
import {sealedTypeScriptBaseExchangeAssetsMatchPair,sealedTypeScriptBaseExchangeAssetsMatchHostFixture,sealedTypeScriptBaseExchangeAssetsFixtureProfile,sealedTypeScriptFixedCanaryProtectedInputProjectionHCodeReadLeaves} from './sealed-typescript-base-exchange-assets.mjs';
import {sealedTypeScriptPairedStageSourceMatchesDerivation} from './sealed-typescript-paired-stage-source.mjs';
import {sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation} from './sealed-typescript-fixed-campaign-enclosure-source.mjs';
import {sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource,verifySealedTypeScriptFixedCampaignEnclosureBuild} from './sealed-typescript-fixed-campaign-enclosure-build.mjs';
const fields=['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('NATIVE_ENCLOSURE_COMMAND_UNAVAILABLE'),{code:'NATIVE_ENCLOSURE_COMMAND_UNAVAILABLE'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const transport={interpretation:'finite-enclosure-normal-collection@2',frame:'RDE2',completeCollectionExit:0,incompleteCollectionExit:74,collectorExit:{E:74,F:1},assertionAuthority:'JSON_BODY_ONLY_NOT_OUTER_EXIT',nativeResultAcceptance:'NOT_TESTED'};
export function prepareSealedTypeScriptNativeEnclosureCommand(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||!fields.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,key)??{},'value')))fail();
 const {pair,hostFixture,assetsBuild,pairedSource,pairedArtifacts,copies,projection,preparedNullSource,enclosureSource,enclosureBuild}=options;
 try{
  // Primitive, lexical native options only: no coercion, path read or account IO.
  if(typeof options.claudeExecutable!=='string'||!path.isAbsolute(options.claudeExecutable)||/[\0\r\n]/.test(options.claudeExecutable)||path.normalize(options.claudeExecutable)!==options.claudeExecutable||path.basename(options.claudeExecutable)!=='claude'||options.claudeSha256!==REVIEWED_CLAUDE_NATIVE.sha256||options.claudeVersion!==REVIEWED_CLAUDE_NATIVE.version)fail();
  // Identity checks touch only private maps and precede ALL public capability
  // properties, original policy reads and full PRE_NATIVE filesystem checks.
  const fixtureProfile=sealedTypeScriptBaseExchangeAssetsFixtureProfile(assetsBuild);
  if(fixtureProfile!=='fixed-native-assets-local-sdk27@1'&&fixtureProfile!=='fixed-native-assets-ci-sdk26.5-toolpair-b@1'&&fixtureProfile!=='fixed-native-assets-ci-sdk26.5-toolpair-a@1')fail();
  const ci=fixtureProfile!=='fixed-native-assets-local-sdk27@1',preparationProfile=ci?(fixtureProfile==='fixed-native-assets-ci-sdk26.5-toolpair-a@1'?'fixed-enclosure-ci-sdk26.5-toolpair-a@1':'fixed-enclosure-ci-sdk26.5-toolpair-b@1'):'fixed-enclosure-local-sdk27@1';
  const linked=()=>sealedTypeScriptBaseExchangeAssetsFixtureProfile(assetsBuild)===fixtureProfile&&sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation(enclosureSource,assetsBuild,pairedSource,pairedArtifacts,copies,projection,preparedNullSource)&&sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource(enclosureBuild,enclosureSource)&&sealedTypeScriptBaseExchangeAssetsMatchPair(assetsBuild,pair)&&sealedTypeScriptBaseExchangeAssetsMatchHostFixture(assetsBuild,hostFixture)&&sealedTypeScriptPairedStageSourceMatchesDerivation(pairedSource,pair,assetsBuild);
  const observe=()=>{if(!linked())fail();const v=verifySealedTypeScriptFixedCampaignEnclosureBuild(enclosureBuild);if(v.scope!=='FIXED_CANARY_ENCLOSURE_POSTBUILD_DATA_ONLY'||v.outcome!=='ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'||v.originalRowsScope!=='POSTBUILD_PRE_NATIVE_ENDPOINTS_ONLY'||v.nativeIntervalBarrier!=='NOT_ESTABLISHED'||!linked())fail();return v;};
  const first=observe(),binding=enclosureSource.bindings,{baseA:a,baseB:b,hostBase:h}=binding;
  if(![a,b,h].every(value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value))||new Set([a,b,h]).size!==3)fail();
  const code=h+'/prefix/native-probes',self=code+'/paired-stage-enclosure',launcher=code+'/paired-stage-enclosed-campaign-launch',cwd=a+'/Checkout 空间/.sealed-native-canaries',baseCode=code+'/sealed-typescript-base-exchange-sentinel';
  const six=[code+'/paired-stage-enclosed-original-inputs.mjs',code+'/paired-stage-enclosed-campaign.mjs',launcher+'.c',self+'.c',launcher,self];
  if(enclosureSource.scope!=='DISABLED_FIXED_CANARY_FINITE_ENCLOSURE_SOURCE_DATA_ONLY'||enclosureSource.version!=='fixed-canary-finite-enclosure-source@2'||enclosureSource.disabled!==true||enclosureSource.runnable!==false||enclosureSource.executionAuthority!=='NONE'||enclosureBuild.report.profileId!==preparationProfile||(ci?enclosureSource.fixtureProfileId!==fixtureProfile:enclosureSource.fixtureProfileId!==undefined)||projection.version!=='fixed-canary-original-input-projection@3'||!hash(enclosureSource.projectionSha256)||projection.projectionSha256!==enclosureSource.projectionSha256||!same(enclosureSource.collectionTransport,transport)||
   binding.node!==h+'/runtime/node-v22.13.0-darwin-arm64/bin/node'||binding.entry!==six[1]||binding.projectionEntry!==six[0]||binding.launcher!==launcher||binding.self!==self||binding.cwd!==cwd||!same(first.bindings,binding)||first.hostBase!==h||!Array.isArray(enclosureSource.files)||enclosureSource.files.length!==4||!Array.isArray(first.files)||first.files.length!==6||first.files.some((row,at)=>row.file!==six[at]||!hash(row.digest))||enclosureSource.files.some((row,at)=>row.file!==six[at]||row.sourceSha256!==first.files[at].digest))fail();
  const original=sealedTypeScriptFixedCanaryProtectedInputProjectionHCodeReadLeaves(projection);
  if(original.outcome!=='FIXED_ORIGINAL_H_CODE_READ_LEAVES_DATA_ONLY'||original.version!=='fixed-canary-original-input-projection@3'||original.hostBase!==h||original.currency!=='NOT_CHECKED'||!Array.isArray(original.readLeaves)||original.readLeaves.length!==21||new Set(original.readLeaves).size!==21||!original.readLeaves.every(file=>typeof file==='string'&&file.startsWith(h+'/'))||original.readLeaves.some(file=>six.includes(file)))fail();
  const directOptions={pair,hostFixture:options.hostFixture,assetsBuild,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion};
  const direct=prepareSealedTypeScriptNativeBaseCommand(directOptions),settings=structuredClone(direct.settings_proposed),s=settings.sandbox,f=s?.filesystem,n=s?.network;
  if(direct.scope!=='DISABLED_FIXED_NATIVE_BASE_COMMAND_PROPOSAL_ONLY'||direct.disabled!==true||direct.inferencePermitted!==false||direct.sealed!==false||direct.reuseEligible!==false||direct.command_proposed!=="'"+baseCode+"'"||direct.cwd_proposed!==cwd||direct.settings_file_proposed!==h+'/claude-host/settings.json'||direct.host_config_directory_proposed!==h+'/claude-host/claude-config'||direct.gh_config_directory_proposed!==h+'/claude-host/gh-config'||direct.max_turns_proposed!==4||direct.parent_timeout_ms_proposed!==120000||direct.tool_timeout_ms_proposed!==15000||
   !same(settings.permissions.allow,['Bash('+direct.command_proposed+')'])||!same(f?.allowRead,[a+'/sealed-inputs',cwd,'/bin/bash',baseCode])||!same(f?.allowWrite,[cwd])||!f.denyRead.includes('/')||!f.denyRead.includes(h+'/claude-host')||!f.denyWrite.includes(h)||s.enabled!==true||s.failIfUnavailable!==true||s.allowUnsandboxedCommands!==false||s.autoAllowBashIfSandboxed!==false||!same(s.excludedCommands,[])||!same(n?.allowedDomains,[])||!same(n.deniedDomains,['*'])||!same(n.allowUnixSockets,[])||n.allowAllUnixSockets!==false||n.allowLocalBinding!==false||n.strictAllowlist!==true||settings.disableAllHooks!==true||!same(settings.enabledPlugins,{}))fail();
  // Preserve every existing credential/read/write/socket/network denial; ONLY
  // replace the one literal admission and append the original 27 code leaves.
  const command="exec '"+self+"'",readLeaves=[...original.readLeaves,...six];
  settings.permissions.allow=['Bash('+command+')'];
  for(const file of readLeaves)if(!f.allowRead.includes(file))f.allowRead.push(file);
  const argv=[...direct.argv_proposed];
  argv[argv.length-1]='Run this fixed synthetic diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: '+command+'\nDo not execute another command, retry, run in background, delegate or inspect credentials. Report its result only. If unavailable, stop.';
  const settingsSha256=createHash('sha256').update(JSON.stringify(settings)).digest('hex');
  // No new path/policy reads after the final full PRE_NATIVE build barrier.
  const finalDirect=prepareSealedTypeScriptNativeBaseCommand(directOptions);
  if(!same(finalDirect,direct))fail();
  const last=observe();if(!same(last,first))fail();
  return freeze({...direct,scope:'DISABLED_FIXED_NATIVE_ENCLOSURE_COMMAND_PROPOSAL_ONLY',runnable:false,executionAuthority:'NONE',command_proposed:command,argv_proposed:argv,settings_proposed:settings,settings_sha256_proposed:settingsSha256,policyHashAuthority:'NONE',
   exact_code_read_leaves:readLeaves,exact_executable_leaf:self,argv0_proposed:self,binary_sha256_proposed:first.files[5].digest,projection_sha256_proposed:enclosureSource.projectionSha256,collection_transport_proposed:transport,
   validationPhase:'PRE_NATIVE_ONLY',preparation_profile_proposed:preparationProfile,hostedCompatibility:'NOT_ESTABLISHED',recordAdoptionAuthority:false,helper_lifecycle:'NOT_OBSERVED',nativeEnforcement:'NOT_TESTED',
   blockers:[...direct.blockers,'EFFECTIVE_EXACT_27_CODE_LEAF_READ_VIEW_AND_HOST_WRITE_BARRIER_NOT_ESTABLISHED','CURRENT_NATIVE_STARTUP_AND_CONTROL_CONFIGURATION_NOT_ESTABLISHED','ENCLOSURE_PRE_MAIN_LOADER_AND_COMPLETE_SDK_PROFILE_NOT_ESTABLISHED',ci?'CI_PREPARATION_IS_NOT_COMPLETE_HOSTED_COMPATIBILITY':'LOCAL_SDK27_PREPARATION_IS_NOT_HOSTED_SDK26_5_COMPATIBILITY','ACTUAL_ENCLOSURE_AND_ORIGINAL_BEGIN_END_LIFECYCLE_NOT_OBSERVED','SAME_PROCESS_CONTROLLER_AND_STRICT_NATIVE_TRACE_COLLECTION_NOT_IMPLEMENTED','NO_INHERITED_WRITABLE_CODE_HANDLES_NOT_ESTABLISHED'],
   commands:[],nativeLaunches:0,models:0,disabled:true,inferencePermitted:false,sealed:false,reuseEligible:false});
 }catch{fail();}
}
