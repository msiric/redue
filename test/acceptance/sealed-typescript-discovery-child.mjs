// Disabled fixed acceptance frontend. Parent must establish the restricted view,
// current reviewed runtime/compiler/code and staged identity BEFORE execution.
// No imported paths/commands/settings select a loader or execution mechanism.
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {probeSealedTypeScriptProgram} from './sealed-typescript-program-probe.mjs';
const self=fileURLToPath(import.meta.url);
if(process.argv[1]===self){
 let observation;
 try{
  if(process.argv.length!==3||process.execArgv.length!==0||process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||!/^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(process.cwd())))throw Error();
  observation=probeSealedTypeScriptProgram({root:process.cwd(),script:process.argv[2]});
  const bytes=JSON.stringify({schema:1,scope:'FIXED_STAGED_API_OBSERVATIONS_ONLY',observation,compilerVerificationExecuted:false,nativeAgentEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false})+'\n';
  if(Buffer.byteLength(bytes)>8*1024*1024)throw Error();process.stdout.write(bytes);process.exitCode=74;
 }catch{process.stdout.write('{"schema":1,"scope":"FIXED_STAGED_API_OBSERVATIONS_ONLY","outcome":"UNKNOWN","reason":"STAGED_API_OBSERVATION_UNAVAILABLE","compilerVerificationExecuted":false,"sealed":false,"reuseEligible":false}\n');process.exitCode=74;}
}
