// Disabled fixed native collector command; it never provisions or dispatches.
// Same-process private source/build derivation is necessary, not sufficient:
// actual protected copies, native/auth/effective-policy gates remain mandatory.
import {prepareSealedTypeScriptNativeBaseCommand} from './sealed-typescript-native-base-command.mjs';
import {verifySealedTypeScriptBaseCollectorSource} from './sealed-typescript-base-collector-source.mjs';
const fields=['pair','hostFixture','assetsBuild','collectorSource','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('NATIVE_BASE_COLLECTOR_UNAVAILABLE'),{code:'NATIVE_BASE_COLLECTOR_UNAVAILABLE'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedTypeScriptNativeBaseCollectorCommand(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||!fields.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
 const {collectorSource,...directOptions}=options;
 const first=verifySealedTypeScriptBaseCollectorSource(collectorSource);
 if(first.outcome!=='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED')fail();
 const direct=prepareSealedTypeScriptNativeBaseCommand(directOptions),b=first.bindings;
 const h=first.hostBase,entry=h+'/prefix/native-probes/base-exchange-collect.mjs',node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node';
 const leaves=['test/acceptance/sealed-typescript-base-child-collection.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','src/portable-envelope.mjs','native-probes/base-exchange-collect.mjs'].map(name=>h+'/prefix/'+name);
 if(!b||b.baseA!==first.baseA||b.baseB!==first.baseB||b.hostBase!==h||b.node!==node||b.entry!==entry||
  direct.cwd_proposed!==first.baseA+'/Checkout 空间/.sealed-native-canaries'||direct.settings_file_proposed!==h+'/claude-host/settings.json'||
  direct.binary_sha256_proposed!==b.helperSha256||direct.command_proposed!=="'"+b.helper+"'"||
  !Array.isArray(collectorSource.proposedSources)||collectorSource.proposedSources.length!==4||collectorSource.proposedSources.some((row,at)=>row.file!==leaves[at]))fail();
 const command="'"+node+"' '"+entry+"'",settings=structuredClone(direct.settings_proposed);
 settings.permissions.allow=[`Bash(${command})`];
 for(const file of [node,...leaves])if(!settings.sandbox.filesystem.allowRead.includes(file))settings.sandbox.filesystem.allowRead.push(file);
 // Whole H is already write-denied. Do not add directories/body read grants,
 // sockets, network, startup overrides, permissions or credential exceptions.
 const argv=[...direct.argv_proposed];argv[argv.length-1]=`Run this fixed synthetic diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: ${command}\nDo not execute another command, retry, run in background, delegate or inspect credentials. Report its result only. If unavailable, stop.`;
 // This closes source/build currency AFTER direct-policy and data construction.
 const last=verifySealedTypeScriptBaseCollectorSource(collectorSource);
 if(last.outcome!==first.outcome||last.baseA!==first.baseA||last.baseB!==first.baseB||last.hostBase!==h||JSON.stringify(last.bindings)!==JSON.stringify(b))fail();
 return freeze({...direct,scope:'DISABLED_FIXED_NATIVE_BASE_COLLECTOR_COMMAND_PROPOSAL_ONLY',command_proposed:command,argv_proposed:argv,settings_proposed:settings,
  exact_added_read_leaves:[node,...leaves],helper_lifecycle:'REQUIRES_ACTUAL_REVIEWED_COLLECTOR_CLOSE_AND_MATCHING_NATIVE_TOOL_RESULT',
  blockers:[...direct.blockers,'CURRENT_PROTECTED_COLLECTOR_COPIES_NOT_PROVISIONED','NATIVE_RESULT_AND_COLLECTOR_PROTOCOL_NOT_OBSERVED'],
  commands:[],nativeLaunches:0,models:0,disabled:true,inferencePermitted:false,sealed:false,reuseEligible:false});
}
