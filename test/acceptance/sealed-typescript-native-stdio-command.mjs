// Disabled fixed native187 command proposal only. No permissions are applied,
// no settings/authentication/file IO and no native/model/helper starts here.
// An exact compound permission string does NOT prove native piecewise admission.
import {verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {nativeStdioProbeCommand} from './sealed-typescript-native-stdio-probe.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './sealed-typescript-closed-read-policy.mjs';
import {nativeDiagnosticArgv} from './portable-claude-diagnostic.mjs';

const keys=['build','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Error('NATIVE_STDIO_COMMAND_UNAVAILABLE');};
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
export function prepareNativeStdioProbeCommand(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==keys.length||!keys.every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))fail();
 const first=verifyNativeStdioProbeBuild(options.build);
 if(first.outcome!=='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED')fail();
 const base=first.hostBase,helper=base+'/prefix/native-probes/native-stdio-probe';
 if(first.helper!==helper||first.cwd!==base+'/prefix/native-probes')fail();
 const command=nativeStdioProbeCommand(base);
 const policy=prepareSealedTypeScriptClosedReadCanaryPolicy({base,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion});
 const settings=structuredClone(policy.settings_proposed),settingsFile=base+'/claude-host/settings.json';
 // Replace no deny rule. In particular Bash(printf:*) remains denied. Native's
 // treatment of this entire fixed compound request is an UNOBSERVED prerequisite.
 settings.permissions.allow=[`Bash(${command})`];
 settings.sandbox.filesystem.allowWrite=[];
 settings.sandbox.filesystem.allowRead=['/bin/bash',helper];
 for(const file of [base,helper])if(!settings.sandbox.filesystem.denyWrite.includes(file))settings.sandbox.filesystem.denyWrite.push(file);
 settings.sandbox.network.allowUnixSockets=[];
 const argv=nativeDiagnosticArgv({settingsFile,command});
 // Pure settings/argv construction must precede the final full original/code/
 // compiler/SDK/helper/ancestor validation, never replace it.
 const last=verifyNativeStdioProbeBuild(options.build);
 if(JSON.stringify(first)!==JSON.stringify(last))fail();
 return freeze({schema:1,scope:'DISABLED_FIXED_NATIVE_STDIO_COMMAND_PROPOSAL_ONLY',disabled:true,
  hostBase:base,command_proposed:command,cwd_proposed:first.cwd,settings_file_proposed:settingsFile,settings_proposed:settings,argv_proposed:argv,
  native_executable_proposed:options.claudeExecutable,native_version_proposed:options.claudeVersion,native_sha256_proposed:options.claudeSha256,
  source_sha256:first.sourceSha256,helper_sha256:first.helperSha256,
  source_command_admission:'EXPECTED_DENIED_IF_NATIVE_PARSES_PRINTF_SUBCOMMAND',
  max_turns_proposed:4,parent_timeout_ms_proposed:120000,tool_timeout_ms_proposed:15000,
  exact_read_leaves:['/bin/bash',helper],read_denials_retained:true,credential_denials_retained:true,
  metadata_scope:'DESCRIPTORS_0_1_2_AND_LITERAL_DEV_NULL_ONLY',
  blockers:[...policy.blockers,'ACTUAL_CURRENT_NATIVE_AND_CONTROLLED_STARTUP_CLOSURE_REQUIRED','SOURCE_BOUND_PROTECTED_ACCOUNT_FACT_AND_INCLUDED_CAPACITY_REQUIRED',
   'EXACT_COMPOUND_BASH_ADMISSION_WITH_EXISTING_DENY_FAMILIES_NOT_OBSERVED','COMPOUND_PRINTF_SUBCOMMAND_HAS_RETAINED_DENY_RULE','DEV_NULL_METADATA_PERMISSION_NOT_OBSERVED',
   'PRE_MAIN_LOADER_AND_PARENT_HELD_HANDLES_NOT_VERIFIED','ACTUAL_MATCHING_NATIVE_TOOL_AND_SHELL_EXIT_COLLECTION_REQUIRED'],
  commands:[],helperExecutions:0,nativeLaunches:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',
  preMainLoader:'NOT_ESTABLISHED',stdioOwnership:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
}
