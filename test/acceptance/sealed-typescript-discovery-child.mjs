// Disabled fixed acceptance frontend. Parent must establish the restricted view,
// current reviewed runtime/compiler/code and staged identity BEFORE execution.
// No imported paths/commands/settings select a loader or execution mechanism.
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {probeSealedTypeScriptProgram} from './sealed-typescript-program-probe.mjs';
const self=fileURLToPath(import.meta.url);
// Only static local codes are emitted. No error message, path, environment or
// arbitrary compiler/source text crosses this failure channel.
const reasons=new Set(['SEALED_PROBE_OPTIONS','SEALED_PROBE_CWD','SEALED_PROBE_COMPILER','SEALED_PROBE_CACHED_API','SEALED_PROBE_API','SEALED_PROBE_CONFIG_OUTSIDE','SEALED_PROBE_SOURCE_OUTSIDE','SEALED_PROBE_CONFIG_LIMIT','SEALED_PROBE_CONFIG_UNSUPPORTED','SEALED_PROBE_OPTION_OUTSIDE','SEALED_PROBE_FILES','SEALED_PROBE_SUMMARY_LIMIT','SEALED_PROBE_FILE_ALIAS','SEALED_PROBE_GIT_UNSUPPORTED','SEALED_DISCOVERY_REENTRANT','SEALED_DISCOVERY_OPTIONS','SEALED_DISCOVERY_ASYNC','SEALED_DISCOVERY_FS','SEALED_DISCOVERY_CLOSED','SEALED_DISCOVERY_PHASE','SEALED_DISCOVERY_METHOD','SEALED_DISCOVERY_RESTORE','SEALED_FORWARDING_OPTIONS','SEALED_FORWARDING_DESCRIPTOR','SEALED_FORWARDING_METHOD']);
if(process.argv[1]===self){
 let observation;
 try{
  if(process.argv.length!==3||process.execArgv.length!==0||process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||!/^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(process.cwd())))throw Error();
  observation=probeSealedTypeScriptProgram({root:process.cwd(),script:process.argv[2]});
  const bytes=JSON.stringify({schema:1,scope:'FIXED_STAGED_API_OBSERVATIONS_ONLY',observation,compilerVerificationExecuted:false,nativeAgentEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false})+'\n';
  if(Buffer.byteLength(bytes)>8*1024*1024)throw Error();process.stdout.write(bytes);process.exitCode=74;
 }catch(error){const descriptor=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'code'):null;
  const reason=descriptor&&Object.hasOwn(descriptor,'value')&&reasons.has(descriptor.value)?descriptor.value:'STAGED_API_OBSERVATION_UNAVAILABLE';
  process.stdout.write(JSON.stringify({schema:1,scope:'FIXED_STAGED_API_OBSERVATIONS_ONLY',outcome:'UNKNOWN',reason,compilerVerificationExecuted:false,sealed:false,reuseEligible:false})+'\n');process.exitCode=74;}
}
