// Disabled fixed native command proposal, not an execution/credential adapter.
// Only live same-process pair/build capabilities select the synthetic targets.
// Reading this proposal, or matching its hashes, grants no native authority.
import {prepareSealedTypeScriptPairedCanaryPolicy} from './sealed-typescript-paired-canary-policy.mjs';
import {verifySealedTypeScriptBaseExchangeAssets} from './sealed-typescript-base-exchange-assets.mjs';
import {PINNED_READONLY_BASH_HEADS} from './portable-claude-native-profile.mjs';
const fields=['pair','hostFixture','assetsBuild','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('NATIVE_BASE_COMMAND_UNAVAILABLE'),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedTypeScriptNativeBaseCommand(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||!fields.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
 const {assetsBuild,...policyOptions}=options;
 // Validate private capability before reading any caller-visible report paths.
 const first=verifySealedTypeScriptBaseExchangeAssets(assetsBuild);
 if(first.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED')fail();
 const policy=prepareSealedTypeScriptPairedCanaryPolicy(policyOptions);
 if(first.baseA!==policy.baseA||first.baseB!==policy.baseB||first.hostBase!==policy.hostBase)fail();
 const binary=assetsBuild.report?.binary;
 if(!binary||binary.file!==policy.code||!/^[a-f0-9]{64}$/.test(binary.sha256)||
    assetsBuild.report.base!==policy.hostBase||!/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}\/prefix\/native-probes\/sealed-typescript-base-exchange-sentinel$/.test(binary.file))fail();
 // No args, substitutions, shell operators or imported command choice.
 const command="'"+policy.code+"'",settings=structuredClone(policy.settings_proposed);
 settings.permissions.allow=[`Bash(${command})`];
 for(const head of PINNED_READONLY_BASH_HEADS){const rule=`Bash(${head}:*)`;if(!settings.permissions.deny.includes(rule))settings.permissions.deny.push(rule);}
 const settingsFile=policy.hostBase+'/claude-host/settings.json';
 // The actual config/GH geometry must sit below the already denied host
 // namespace. Never borrow the old diagnostic's differently named directories.
 const hostConfig=policy.hostBase+'/claude-host';
 if(!settings.sandbox.filesystem.denyRead.includes(hostConfig))fail();
 if(!settings.sandbox.filesystem.denyWrite.includes(policy.hostBase))settings.sandbox.filesystem.denyWrite.push(policy.hostBase);
 const argv=['--print','--verbose','--output-format','stream-json','--max-turns','4','--permission-mode','dontAsk','--tools','Bash','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--settings',settingsFile,'--no-session-persistence',
  `Run this fixed synthetic diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: ${command}\nDo not execute another command, retry, run in background, delegate or inspect credentials. Report its result only. If unavailable, stop.`];
 // Policy validation may itself perform reads. The build's late named/code/
 // parent barrier must be the final validation, not precede more filesystem work.
 const finalPolicy=prepareSealedTypeScriptPairedCanaryPolicy(policyOptions);
 const last=verifySealedTypeScriptBaseExchangeAssets(assetsBuild);
 if(finalPolicy.code!==policy.code||last.outcome!==first.outcome||last.baseA!==first.baseA||last.baseB!==first.baseB||last.hostBase!==first.hostBase)fail();
 return freeze({schema:1,scope:'DISABLED_FIXED_NATIVE_BASE_COMMAND_PROPOSAL_ONLY',disabled:true,command_proposed:command,argv_proposed:argv,
  cwd_proposed:policy.cwd,settings_file_proposed:settingsFile,settings_proposed:settings,binary_sha256_proposed:binary.sha256,
  host_config_directory_proposed:hostConfig+'/claude-config',gh_config_directory_proposed:hostConfig+'/gh-config',
  policy_interpretation:policy.interpretation,max_turns_proposed:4,parent_timeout_ms_proposed:120000,tool_timeout_ms_proposed:15000,
  commands:[],nativeLaunches:0,models:0,inferencePermitted:false,sealed:false,reuseEligible:false,
  blockers:[...policy.blockers,'CURRENT_PINNED_NATIVE_AND_STARTUP_SOURCE_CLOSURE_REQUIRED','IN_PLACE_AUTH_NAMESPACE_AND_INCLUDED_CAPACITY_REQUIRED',
   'EFFECTIVE_LITERAL_COMMAND_ADMISSION_NOT_OBSERVED','INDEPENDENT_HELPER_EXIT_COLLECTION_NOT_ESTABLISHED'],
  helper_lifecycle:'NOT_OBSERVED',nativeEnforcement:'NOT_TESTED'});
}
