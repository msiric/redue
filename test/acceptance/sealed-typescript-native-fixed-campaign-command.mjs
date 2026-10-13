// Disabled exact native campaign binding. Private preparer identity/currentness
// selects resources; neither this proposal nor its hashes grants execution.
// The launcher guards precede Node, not the launcher's own pre-main loader.
import {prepareSealedTypeScriptNativeBaseCommand} from './sealed-typescript-native-base-command.mjs';
import {verifySealedTypeScriptBaseExchangeAssets,verifySealedTypeScriptPairedStageArtifacts,sealedTypeScriptPairedStageArtifactsMatchDerivation,verifySealedTypeScriptFixedCampaignLauncherBuild,sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation} from './sealed-typescript-base-exchange-assets.mjs';
import {verifySealedTypeScriptPairedStageSource,sealedTypeScriptPairedStageSourceMatchesDerivation} from './sealed-typescript-paired-stage-source.mjs';
import {verifySealedTypeScriptFixedCampaignCopies,sealedTypeScriptFixedCampaignCopiesMatchDerivation} from './sealed-typescript-fixed-campaign-copies.mjs';
import {prepareSealedTypeScriptFixedCampaignSource} from './sealed-typescript-fixed-campaign.mjs';

const fields=['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','campaignLauncherBuild','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('NATIVE_FIXED_CAMPAIGN_UNAVAILABLE'),{code:'NATIVE_FIXED_CAMPAIGN_UNAVAILABLE'});};
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const nodePin='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const dependencyNames=['sealed-typescript-base-exchange-result.mjs','sealed-typescript-stage-exchange-result.mjs','sealed-typescript-stage-result.mjs','sealed-typescript-map-result.mjs','../../src/portable-envelope.mjs'];
const copyNames=['test/acceptance/sealed-typescript-base-exchange-result.mjs','test/acceptance/sealed-typescript-stage-exchange-result.mjs','test/acceptance/sealed-typescript-stage-result.mjs','test/acceptance/sealed-typescript-map-result.mjs','src/portable-envelope.mjs','native-probes/paired-stage-campaign.mjs'];

export function prepareSealedTypeScriptNativeFixedCampaignCommand(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||
  !fields.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,key)??{},'value')))fail();
 const {pair,assetsBuild,pairedSource,pairedArtifacts,copies,campaignLauncherBuild}=options;
 try{
  // Reject forged/serialized/mixed capabilities before caller-visible paths.
  const linked=()=>sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation(campaignLauncherBuild,assetsBuild,pairedSource,pairedArtifacts,copies)&&
   sealedTypeScriptPairedStageSourceMatchesDerivation(pairedSource,pair,assetsBuild)&&
   sealedTypeScriptPairedStageArtifactsMatchDerivation(pairedArtifacts,assetsBuild,pairedSource)&&
   sealedTypeScriptFixedCampaignCopiesMatchDerivation(copies,assetsBuild,pairedArtifacts,pairedSource);
  const observe=()=>{
   if(!linked())fail();
   const assets=verifySealedTypeScriptBaseExchangeAssets(assetsBuild),source=verifySealedTypeScriptPairedStageSource(pairedSource),
    artifacts=verifySealedTypeScriptPairedStageArtifacts(pairedArtifacts),copied=verifySealedTypeScriptFixedCampaignCopies(copies),
    launch=verifySealedTypeScriptFixedCampaignLauncherBuild(campaignLauncherBuild);
   if(assets.scope!=='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY'||assets.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'||
    source.scope!=='DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY'||source.outcome!=='PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'||
    artifacts.scope!=='PAIRED_STAGE_ENGINEERING_ARTIFACTS_DATA_ONLY'||artifacts.outcome!=='PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'||
    copied.scope!=='FIXED_CAMPAIGN_COPIES_DATA_ONLY'||copied.outcome!=='CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'||
    launch.scope!=='FIXED_CAMPAIGN_LAUNCHER_BUILD_DATA_ONLY'||launch.outcome!=='CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'||
    !['baseA','baseB','hostBase'].every(key=>[source,artifacts,copied,launch].every(row=>row[key]===assets[key]))||!same(source.bindings,artifacts.bindings))fail();
   return {assets,source,artifacts,copied,launch};
  };
  const first=observe(),a=first.assets.baseA,b=first.assets.baseB,h=first.assets.hostBase;
  if(![a,b,h].every(value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value))||new Set([a,b,h]).size!==3)fail();
  const node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=h+'/prefix/native-probes/paired-stage-campaign.mjs',
   launcher=h+'/prefix/native-probes/paired-stage-campaign-launch',cwd=a+'/Checkout 空间/.sealed-native-canaries';
  const rendered=prepareSealedTypeScriptFixedCampaignSource({assetsBuild,pairedArtifacts,pairedSource});
  const directOptions={pair,hostFixture:options.hostFixture,assetsBuild,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion};
  const direct=prepareSealedTypeScriptNativeBaseCommand(directOptions),binding=first.launch.bindings,built=campaignLauncherBuild.report,
   leaves=copyNames.map(name=>h+'/prefix/'+name),rows=copies.report?.files;
  const actors=[
   {role:'whole_base',file:h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel',args:[],fileSha256:assetsBuild.report?.binary?.sha256},
   {role:'stage_exchange',file:h+'/prefix/native-probes/sealed-typescript-paired-stage-exchange',args:[],fileSha256:pairedArtifacts.report?.binaries?.[1]?.sha256},
   {role:'node_stage',file:node,args:[h+'/prefix/native-probes/sealed-typescript-paired-stage-node.mjs'],fileSha256:nodePin,argumentSha256:pairedArtifacts.report?.sources?.[0]?.sha256},
   {role:'mapper',file:h+'/prefix/native-probes/sealed-typescript-paired-stage-map',args:[],fileSha256:pairedArtifacts.report?.binaries?.[0]?.sha256}
  ];
  if(rendered.scope!=='DISABLED_FIXED_CAMPAIGN_SOURCE_DATA_ONLY'||rendered.disabled!==true||
   !['baseA','baseB','hostBase'].every(key=>rendered[key]===first.assets[key])||rendered.node!==node||rendered.entry!==entry||rendered.cwd!==cwd||
   !hash(rendered.sourceSha256)||!same(rendered.actors,actors)||actors.some(row=>!hash(row.fileSha256))||!hash(actors[2].argumentSha256)||
   !Array.isArray(rendered.dependencyPins)||rendered.dependencyPins.length!==5||rendered.dependencyPins.some((row,at)=>row.name!==dependencyNames[at]||!hash(row.sha256))||
   assetsBuild.report?.binary?.file!==actors[0].file||pairedArtifacts.report?.sources?.[0]?.file!==actors[2].args[0]||
   pairedArtifacts.report?.binaries?.[0]?.file!==actors[3].file||pairedArtifacts.report?.binaries?.[1]?.file!==actors[1].file||
   first.source.node!==node||first.source.bindings?.node!==node||first.source.bindings?.checker!==actors[2].args[0]||
   first.copied.node!==node||first.copied.entry!==entry||first.copied.cwd!==cwd||first.copied.campaignSha256!==rendered.sourceSha256||
   !Array.isArray(rows)||rows.length!==6||rows.some((row,at)=>row.file!==leaves[at]||row.sha256!==(at===5?rendered.sourceSha256:rendered.dependencyPins[at].sha256))||
   !same(copies.report.bindings,{baseA:a,baseB:b,hostBase:h,node,entry,cwd,campaignSha256:rendered.sourceSha256})||
   !binding||!['baseA','baseB','hostBase'].every(key=>binding[key]===first.assets[key])||binding.node!==node||binding.nodeSha256!==nodePin||
   binding.entry!==entry||binding.cwd!==cwd||binding.campaignSha256!==rendered.sourceSha256||binding.launcher!==launcher||binding.launcherSource!==launcher+'.c'||
   !hash(binding.launcherSourceSha256)||first.launch.launcherSourceSha256!==binding.launcherSourceSha256||!hash(first.launch.launcherSha256)||
   !built||built.hostBase!==h||built.baseA!==a||built.baseB!==b||!same(built.bindings,binding)||
   built.source?.file!==binding.launcherSource||built.source.sha256!==binding.launcherSourceSha256||built.binary?.file!==launcher||built.binary.sha256!==first.launch.launcherSha256||
   direct.command_proposed!=="'"+actors[0].file+"'"||direct.binary_sha256_proposed!==actors[0].fileSha256||direct.cwd_proposed!==cwd||
   direct.settings_file_proposed!==h+'/claude-host/settings.json'||direct.max_turns_proposed!==4||direct.parent_timeout_ms_proposed!==120000||direct.tool_timeout_ms_proposed!==15000||
   !direct.settings_proposed.sandbox.filesystem.denyWrite.includes(h))fail();
  const command="'"+launcher+"'",settings=structuredClone(direct.settings_proposed);
  settings.permissions.allow=['Bash('+command+')'];
  const added=[node,...leaves,actors[1].file,actors[2].args[0],actors[3].file,launcher];
  for(const file of added)if(!settings.sandbox.filesystem.allowRead.includes(file))settings.sandbox.filesystem.allowRead.push(file);
  const argv=[...direct.argv_proposed];
  argv[argv.length-1]='Run this fixed synthetic diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: '+command+'\nDo not execute another command, retry, run in background, delegate or inspect credentials. Report its result only. If unavailable, stop.';
  // Dependency reads/policy cloning precede final original/copy/launcher currency.
  const lastRendered=prepareSealedTypeScriptFixedCampaignSource({assetsBuild,pairedArtifacts,pairedSource});
  if(!same(lastRendered,rendered))fail();
  const last=observe();if(!same(last,first))fail();
  return freeze({...direct,scope:'DISABLED_FIXED_NATIVE_CAMPAIGN_COMMAND_PROPOSAL_ONLY',command_proposed:command,argv_proposed:argv,settings_proposed:settings,
   binary_sha256_proposed:first.launch.launcherSha256,launcher_source_sha256_proposed:binding.launcherSourceSha256,campaign_sha256_proposed:rendered.sourceSha256,
   exact_added_read_leaves:added,exact_executable_leaf:launcher,actors_proposed:actors,
   helper_lifecycle:'REQUIRES_ACTUAL_FIXED_CAMPAIGN_CLOSE_AND_MATCHING_NATIVE_TOOL_RESULT',
   blockers:[...direct.blockers,...rendered.blockers,'CURRENT_PROTECTED_CAMPAIGN_LAUNCHER_COPIES_AND_PAIRED_ARTIFACTS_REQUIRED',
    'ENCLOSING_PARENT_MUST_PREVENT_LAUNCHER_PRE_MAIN_LOADER_INJECTION','INHERITED_HANDLES_NOT_VERIFIED',
    'CONTROL_WRITES_RESTORES_INVALIDATE_ORIGINAL_PRIVATE_FIXTURE_MINTS','OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED','NATIVE_RESULT_AND_FIXED_CAMPAIGN_PROTOCOL_NOT_OBSERVED'],
   commands:[],nativeLaunches:0,models:0,disabled:true,inferencePermitted:false,sealed:false,reuseEligible:false});
 }catch{fail();}
}
