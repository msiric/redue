// Disabled fixed native187 command proposal only. No permissions are applied,
// no settings/authentication/file IO and no native/model/helper starts here.
// An exact compound permission string does NOT prove native piecewise admission.
import {verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {nativeStdioProbeCommand,nativeStdioDirectCommand,NATIVE_STDIO_SOURCE_SHA256} from './sealed-typescript-native-stdio-probe.mjs';
import {NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION} from './sealed-typescript-native-startup-witness.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './sealed-typescript-closed-read-policy.mjs';
import {nativeDiagnosticArgv} from './portable-claude-diagnostic.mjs';

const keys=['build','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Error('NATIVE_STDIO_COMMAND_UNAVAILABLE');};
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
export function prepareNativeStdioProbeCommand(options){
 if(arguments.length!==1)fail();return prepareCommand(options,false);
}
export function prepareDirectNativeStdioProbeCommand(options){
 if(arguments.length!==1)fail();return prepareCommand(options,true);
}
export function prepareDirectNativeStartupWitnessCommand(options){
 if(arguments.length!==1)fail();return prepareCommand(options,true,true);
}
function prepareCommand(options,direct,witness=false){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==keys.length||!keys.every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))fail();
 const first=verifyNativeStdioProbeBuild(options.build);
 if(first.outcome!=='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'||first.sourceSha256!==(witness?NATIVE_STARTUP_WITNESS_SOURCE_SHA256:NATIVE_STDIO_SOURCE_SHA256)||first.buildInterpretation!==(witness?'redue-native-child-startup-witness-preauth-build@1':'redue-native-stdio-preauth-build@2'))fail();
 const base=first.hostBase,helper=base+'/prefix/native-probes/native-stdio-probe';
 if(first.helper!==helper||first.cwd!==base+'/prefix/native-probes')fail();
 const command=direct?nativeStdioDirectCommand(base):nativeStdioProbeCommand(base);
 const policy=prepareSealedTypeScriptClosedReadCanaryPolicy({base,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion});
 const settings=structuredClone(policy.settings_proposed),settingsFile=base+'/claude-host/settings.json';
 // Replace no deny rule. In particular Bash(printf:*) remains denied. The old
 // compound route is retained as disabled history; direct uses no shell marker.
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
 return freeze({schema:1,scope:witness?'DISABLED_SINGLE_DIRECT_NATIVE_STARTUP_WITNESS_COMMAND_PROPOSAL_ONLY':direct?'DISABLED_SINGLE_DIRECT_NATIVE_STDIO_COMMAND_PROPOSAL_ONLY':'DISABLED_FIXED_NATIVE_STDIO_COMMAND_PROPOSAL_ONLY',disabled:true,
  ...(witness?{witness_interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION}:{}),hostBase:base,command_proposed:command,cwd_proposed:first.cwd,settings_file_proposed:settingsFile,settings_proposed:settings,argv_proposed:argv,
  native_executable_proposed:options.claudeExecutable,native_version_proposed:options.claudeVersion,native_sha256_proposed:options.claudeSha256,
  source_sha256:first.sourceSha256,helper_sha256:first.helperSha256,build_profile_id:first.profileId,build_interpretation:first.buildInterpretation,
  source_command_admission:direct?'SINGLE_LITERAL_COMMAND_REQUIRES_EFFECTIVE_ADMISSION':'EXPECTED_DENIED_IF_NATIVE_PARSES_PRINTF_SUBCOMMAND',
  max_turns_proposed:4,parent_timeout_ms_proposed:120000,tool_timeout_ms_proposed:15000,
  exact_read_leaves:['/bin/bash',helper],read_denials_retained:true,credential_denials_retained:true,
  metadata_scope:witness?'CHILD_BINDING_BOOLEANS_DESCRIPTORS_0_1_2_AND_LITERAL_DEV_NULL_ONLY':'DESCRIPTORS_0_1_2_AND_LITERAL_DEV_NULL_ONLY',
  blockers:[...policy.blockers,'ACTUAL_CURRENT_NATIVE_AND_CONTROLLED_STARTUP_CLOSURE_REQUIRED','SOURCE_BOUND_PROTECTED_ACCOUNT_FACT_AND_INCLUDED_CAPACITY_REQUIRED',
   ...(direct?['EXACT_SINGLE_DIRECT_BASH_ADMISSION_NOT_OBSERVED','SOURCE_DERIVED_FOREGROUND_RAW_AND_RENDERED_RESULT_REQUIRED']:['EXACT_COMPOUND_BASH_ADMISSION_WITH_EXISTING_DENY_FAMILIES_NOT_OBSERVED','COMPOUND_PRINTF_SUBCOMMAND_HAS_RETAINED_DENY_RULE','ACTUAL_MATCHING_NATIVE_TOOL_AND_SHELL_EXIT_COLLECTION_REQUIRED']),
   'DEV_NULL_METADATA_PERMISSION_NOT_OBSERVED','PRE_MAIN_LOADER_AND_PARENT_HELD_HANDLES_NOT_VERIFIED'],
  commands:[],helperExecutions:0,nativeLaunches:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',
  preMainLoader:'NOT_ESTABLISHED',stdioOwnership:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
}
