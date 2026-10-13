// Disabled fixed native collector command; it never provisions or dispatches.
// Same-process private launcher/source/build derivation is necessary, not
// sufficient: protected copies, native/auth/effective-policy gates remain.
// Its C guard is before Node, not before the launcher's own pre-main loader.
import {prepareSealedTypeScriptNativeBaseCommand} from './sealed-typescript-native-base-command.mjs';
import {verifySealedTypeScriptBaseCollectorSource} from './sealed-typescript-base-collector-source.mjs';
import {verifySealedTypeScriptBaseCollectorLauncherBuild,sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation} from './sealed-typescript-base-exchange-assets.mjs';
const fields=['pair','hostFixture','assetsBuild','collectorSource','launcherBuild','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('NATIVE_BASE_COLLECTOR_UNAVAILABLE'),{code:'NATIVE_BASE_COLLECTOR_UNAVAILABLE'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function prepareSealedTypeScriptNativeBaseCollectorCommand(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||!fields.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
 const {collectorSource,launcherBuild,...directOptions}=options;
 // No caller-visible paths are consulted until private identity and currency.
 if(!sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation(launcherBuild,directOptions.assetsBuild,collectorSource))fail();
 const first=verifySealedTypeScriptBaseCollectorSource(collectorSource),launch=verifySealedTypeScriptBaseCollectorLauncherBuild(launcherBuild);
 if(first.outcome!=='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'||first.scope!=='DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY'||
  launch.outcome!=='LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'||launch.scope!=='FIXED_BASE_COLLECTOR_LAUNCHER_BUILD_DATA_ONLY')fail();
 const direct=prepareSealedTypeScriptNativeBaseCommand(directOptions),b=first.bindings;
 const h=first.hostBase,entry=h+'/prefix/native-probes/base-exchange-collect.mjs',node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',launcher=h+'/prefix/native-probes/base-exchange-collect-launch';
 const leaves=['test/acceptance/sealed-typescript-base-child-collection.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','src/portable-envelope.mjs','native-probes/base-exchange-collect.mjs'].map(name=>h+'/prefix/'+name);
 const built=launcherBuild.report,rendered=collectorSource.proposedLauncher;
 if(!b||b.baseA!==first.baseA||b.baseB!==first.baseB||b.hostBase!==h||b.node!==node||b.entry!==entry||
  b.helper!==h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel'||!hash(b.helperSha256)||
  b.nodeSha256!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'||!hash(b.collectorSha256)||
  b.launcher!==launcher||b.launcherSource!==launcher+'.c'||!hash(b.launcherSourceSha256)||
  launch.baseA!==first.baseA||launch.baseB!==first.baseB||launch.hostBase!==h||JSON.stringify(launch.bindings)!==JSON.stringify(b)||
  !hash(launch.launcherSha256)||launch.launcherSourceSha256!==b.launcherSourceSha256||
  !built||built.base!==h||JSON.stringify(built.bindings)!==JSON.stringify(b)||built.binary?.file!==launcher||built.binary.sha256!==launch.launcherSha256||
  built.source?.file!==b.launcherSource||built.source.sha256!==b.launcherSourceSha256||
  !rendered||rendered.disabled!==true||rendered.file!==b.launcherSource||rendered.output!==launcher||rendered.sha256!==b.launcherSourceSha256||
  direct.cwd_proposed!==first.baseA+'/Checkout 空间/.sealed-native-canaries'||direct.settings_file_proposed!==h+'/claude-host/settings.json'||
  direct.binary_sha256_proposed!==b.helperSha256||direct.command_proposed!=="'"+b.helper+"'"||
  !Array.isArray(collectorSource.proposedSources)||collectorSource.proposedSources.length!==4||collectorSource.proposedSources.some((row,at)=>row.file!==leaves[at]||!hash(row.sha256))||
  collectorSource.proposedSources[3].sha256!==b.collectorSha256)fail();
 const command="'"+launcher+"'",settings=structuredClone(direct.settings_proposed);
 settings.permissions.allow=[`Bash(${command})`];
 for(const file of [node,...leaves,launcher])if(!settings.sandbox.filesystem.allowRead.includes(file))settings.sandbox.filesystem.allowRead.push(file);
 // Whole H is already write-denied. No source C/directory, socket/network,
 // startup, permission, credential or direct Node fallback is added.
 const argv=[...direct.argv_proposed];argv[argv.length-1]=`Run this fixed synthetic diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: ${command}\nDo not execute another command, retry, run in background, delegate or inspect credentials. Report its result only. If unavailable, stop.`;
 // Launcher currency is FINAL after policy/data/source reads. Its existing
 // verifier closes original assets, same-source four copies and new file rows.
 const last=verifySealedTypeScriptBaseCollectorSource(collectorSource),lastLaunch=verifySealedTypeScriptBaseCollectorLauncherBuild(launcherBuild);
 if(JSON.stringify(last)!==JSON.stringify(first)||JSON.stringify(lastLaunch)!==JSON.stringify(launch))fail();
 return freeze({...direct,scope:'DISABLED_FIXED_NATIVE_BASE_COLLECTOR_COMMAND_PROPOSAL_ONLY',command_proposed:command,argv_proposed:argv,settings_proposed:settings,
  binary_sha256_proposed:launch.launcherSha256,helper_binary_sha256_proposed:b.helperSha256,launcher_source_sha256_proposed:b.launcherSourceSha256,
  exact_added_read_leaves:[node,...leaves,launcher],exact_executable_leaf:launcher,helper_lifecycle:'REQUIRES_ACTUAL_REVIEWED_COLLECTOR_CLOSE_AND_MATCHING_NATIVE_TOOL_RESULT',
  blockers:[...direct.blockers,'CURRENT_PROTECTED_COLLECTOR_LAUNCHER_AND_COPIES_NOT_ESTABLISHED','ENCLOSING_PARENT_MUST_PREVENT_LAUNCHER_PRE_MAIN_LOADER_INJECTION',
   'INHERITED_HANDLES_NOT_VERIFIED','OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED','NATIVE_RESULT_AND_COLLECTOR_PROTOCOL_NOT_OBSERVED'],
  commands:[],nativeLaunches:0,models:0,disabled:true,inferencePermitted:false,sealed:false,reuseEligible:false});
}
