// Disabled fixed synthetic stage checker: no compiler, shell, mapper or model.
// Exact rendered bytes, owned fixture and actual native route require review.
// Results do not establish the host boundary; MAP_SHARED remains unimplemented.
// The existing portable-vnode-interval fixed mapper uses r+b + mmap.ACCESS_WRITE.
// A reviewed interpreter/helper identity and SAME native execution boundary are
// prerequisites before reusing that pattern here. O_RDONLY or MAP_PRIVATE is
// not a writable MAP_SHARED assertion; no mapper/executor is provided below.
import fs from 'node:fs/promises';
import {constants as F} from 'node:fs';
import {fileURLToPath} from 'node:url';

const base='__REVIEWED_SENTINEL_BASE__';
export const SEALED_SENTINEL_BINDINGS=Object.freeze({
  node:'__REVIEWED_NODE__',checker:base+'/workspace/sealed-typescript-native-sentinel.mjs',
  stageParent:base+'/protected-stage-parent',stage:base+'/protected-stage-parent/stage',
  writeCanary:base+'/protected-stage-parent/stage/write-canary.txt',
  chmodCanary:base+'/protected-stage-parent/stage/chmod-canary.txt',
  unlinkCanary:base+'/protected-stage-parent/stage/unlink-canary.txt',
  renameCanary:base+'/protected-stage-parent/stage/rename-canary.txt',
  renameDestination:base+'/protected-stage-parent/stage/rename-destination.txt',
  hardlinkCanary:base+'/protected-stage-parent/stage/hardlink-canary.txt',
  parentReplacement:base+'/protected-stage-parent-replaced',
  allowedWorkspace:base+'/allowed-workspace',allowedWrite:base+'/allowed-workspace/write-canary.txt',
  outsideAlias:base+'/allowed-workspace/stage-alias.txt',
});
const CANARY=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
const codes=new Set(['FIXTURE_MATCHED','ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','ASSERTION_FAILED','UNKNOWN_OR_UNAVAILABLE']);
export const classifySealedSentinelError=error=>['EACCES','EPERM'].includes(error?.code)?'DENIED_PERMISSION_ERROR':'UNKNOWN_OR_UNAVAILABLE';
export function sealedSentinelRuntimeUnsupported(env){
  const keys=Object.keys(env).map(key=>key.toUpperCase());return keys.some(key=>['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH'].includes(key)||key.startsWith('DYLD_')||key.startsWith('OPENSSL_'));
}
export function sealedSentinelRouteAllowed({argv,execPath,version,execArgv,env}){
  // This is a pure route comparison, not a native sandbox/owner approval token.
  return Object.values(SEALED_SENTINEL_BINDINGS).every(value=>value.startsWith('/')&&!value.includes('__REVIEWED_')&&!/[\u0000-\u001f\u007f\\]/.test(value))&&
    Array.isArray(argv)&&Array.isArray(execArgv)&&execArgv.length===0&&argv.length===2&&argv[1]===SEALED_SENTINEL_BINDINGS.checker&&execPath===SEALED_SENTINEL_BINDINGS.node&&version==='v22.13.0'&&!sealedSentinelRuntimeUnsupported(env);
}
export async function runSealedTypeScriptNativeSentinel(io){
  const checks=[];
  const check=async(name,method,expected)=>{let code;try{code=await io[method]();}catch(error){code=classifySealedSentinelError(error);}
    if(!codes.has(code))code='UNKNOWN_OR_UNAVAILABLE';const result=code==='UNKNOWN_OR_UNAVAILABLE'?'UNKNOWN':code===expected?'PASS':'FAIL';
    const row={name,result,reason_code:code,attempted:true};checks.push(row);return row;
  };
  // If the intended fresh synthetic fixture is not established, launch no
  // destructive assertion. Denied-everything and missing fixtures are not green.
  const fixture=await check('fresh_synthetic_fixture_readable','fixtureProbe','FIXTURE_MATCHED');
  if(fixture.result!=='PASS')return report(checks,['STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED','MAP_SHARED_WRITABLE_MAPPING_DENIED']);
  const allowed=await check('owned_workspace_write_permitted','allowedWriteProbe','ACCESS_SUCCEEDED');
  if(allowed.result!=='PASS')return report(checks,['STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED','MAP_SHARED_WRITABLE_MAPPING_DENIED']);
  await check('stage_file_write_denied','writeProbe','DENIED_PERMISSION_ERROR');
  await check('stage_file_chmod_denied','chmodProbe','DENIED_PERMISSION_ERROR');
  await check('stage_file_unlink_denied','unlinkProbe','DENIED_PERMISSION_ERROR');
  await check('stage_file_rename_denied','renameProbe','DENIED_PERMISSION_ERROR');
  await check('stage_parent_replacement_denied','parentReplacementProbe','DENIED_PERMISSION_ERROR');
  const link=await check('outside_hardlink_creation_denied','hardlinkProbe','DENIED_PERMISSION_ERROR');
  const unperformed=['MAP_SHARED_WRITABLE_MAPPING_DENIED'];
  if(link.reason_code==='ACCESS_SUCCEEDED')await check('write_through_created_alias_denied','aliasWriteProbe','DENIED_PERMISSION_ERROR');
  else{const reason=link.reason_code==='DENIED_PERMISSION_ERROR'?'NOT_PERFORMED_PREREQUISITE_DENIED':'NOT_PERFORMED_PREREQUISITE_UNKNOWN';
    checks.push({name:'write_through_created_alias_denied',result:'NOT_PERFORMED',reason_code:reason,attempted:false});unperformed.push(reason);}
  await check('stage_fixture_identity_and_bytes_preserved','stageIntegrityProbe','FIXTURE_MATCHED');
  checks.push({name:'map_shared_writable_mapping_denied',result:'NOT_IMPLEMENTED',reason_code:'NOT_IMPLEMENTED',attempted:false});
  return report(checks,unperformed);
}
function report(checks,unperformed){return{schema:1,scope:'SYNTHETIC_STAGED_TREE_BOUNDARY_PROBE_RESULTS',
  result:checks.some(row=>row.result==='FAIL')?'FAIL':'UNKNOWN',checks_passed:false,
  implemented_checks_passed:checks.filter(row=>row.attempted).every(row=>row.result==='PASS'),checks,unperformed_assertions:unperformed,
  native_tool_boundary:'REQUIRES_ACTUAL_NATIVE_HOST_TRACE_AND_LIVE_FIXTURE_GATES',real_credentials_opened:false,
  compiler_executions:0,model_actions_requested:0,network_actions_requested:0,sealed:false,reuseEligible:false};}
export function sealedTypeScriptSentinelIO(fileSystem=fs){
  const snapshots=new Map();let fixtureReady=false;
  const physical=stat=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
  const protectedFiles=[SEALED_SENTINEL_BINDINGS.writeCanary,SEALED_SENTINEL_BINDINGS.chmodCanary,SEALED_SENTINEL_BINDINGS.unlinkCanary,SEALED_SENTINEL_BINDINGS.renameCanary,SEALED_SENTINEL_BINDINGS.hardlinkCanary];
  const fixedDirectories=[SEALED_SENTINEL_BINDINGS.stageParent,SEALED_SENTINEL_BINDINGS.stage,SEALED_SENTINEL_BINDINGS.allowedWorkspace];
  const opened=async(file,flags,action)=>{let handle,result;try{handle=await fileSystem.open(file,flags,0o600);result=await action(handle);}
    catch(error){result=classifySealedSentinelError(error);}finally{if(handle)try{await handle.close();}catch{result='UNKNOWN_OR_UNAVAILABLE';}}return result;};
  const readCanary=async(file,capture=false)=>opened(file,F.O_RDONLY|F.O_NOFOLLOW|F.O_NONBLOCK,async handle=>{
    const before=await handle.stat({bigint:true});if(!before.isFile()||before.nlink!==1n||before.uid!==BigInt(process.getuid())||before.size!==BigInt(CANARY.length)||(before.mode&0o7777n)!==0o644n||!capture&&physical(before)!==snapshots.get(file))return'ASSERTION_FAILED';
    const buffer=Buffer.alloc(CANARY.length+1),{bytesRead}=await handle.read(buffer,0,buffer.length,0),after=await handle.stat({bigint:true});
    if(bytesRead!==CANARY.length||!buffer.subarray(0,bytesRead).equals(CANARY)||physical(before)!==physical(after))return'ASSERTION_FAILED';
    if(capture)snapshots.set(file,physical(before));return'FIXTURE_MATCHED';
  });
  const write=async(file)=>opened(file,F.O_WRONLY|F.O_NOFOLLOW|F.O_NONBLOCK,async handle=>{
    const {bytesWritten}=await handle.write(Buffer.from('!'),0,1,0);return bytesWritten===1?'ACCESS_SUCCEEDED':'ASSERTION_FAILED';
  });
  const operation=async fn=>{try{await fn();return'ACCESS_SUCCEEDED';}catch(error){return classifySealedSentinelError(error);}};
  return{
    fixtureProbe:async()=>{if(typeof process.getuid!=='function'||F.O_NOFOLLOW===undefined||F.O_NONBLOCK===undefined)return'UNKNOWN_OR_UNAVAILABLE';
      try{fixtureReady=false;snapshots.clear();for(const directory of fixedDirectories){
          const stat=await fileSystem.lstat(directory,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==BigInt(process.getuid())||(stat.mode&0o7777n)!==0o700n)return'ASSERTION_FAILED';snapshots.set(directory,physical(stat));}
        for(const file of [...protectedFiles,SEALED_SENTINEL_BINDINGS.allowedWrite]){
          const outcome=await readCanary(file,true);if(outcome!=='FIXTURE_MATCHED')return outcome;}
        for(const missing of [SEALED_SENTINEL_BINDINGS.renameDestination,SEALED_SENTINEL_BINDINGS.parentReplacement,SEALED_SENTINEL_BINDINGS.outsideAlias]){
          try{await fileSystem.lstat(missing);return'ASSERTION_FAILED';}catch(error){if(error?.code!=='ENOENT')return'UNKNOWN_OR_UNAVAILABLE';}}
        fixtureReady=true;return'FIXTURE_MATCHED';
      }catch{return'UNKNOWN_OR_UNAVAILABLE';}},
    stageIntegrityProbe:async()=>{if(!fixtureReady)return'UNKNOWN_OR_UNAVAILABLE';try{for(const directory of fixedDirectories){const stat=await fileSystem.lstat(directory,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||physical(stat)!==snapshots.get(directory))return'ASSERTION_FAILED';}
      for(const file of protectedFiles){const outcome=await readCanary(file);if(outcome!=='FIXTURE_MATCHED')return outcome;}return'FIXTURE_MATCHED';}catch{return'UNKNOWN_OR_UNAVAILABLE';}},
    allowedWriteProbe:()=>write(SEALED_SENTINEL_BINDINGS.allowedWrite),writeProbe:()=>write(SEALED_SENTINEL_BINDINGS.writeCanary),
    chmodProbe:()=>operation(()=>fileSystem.chmod(SEALED_SENTINEL_BINDINGS.chmodCanary,0o600)),
    unlinkProbe:()=>operation(()=>fileSystem.unlink(SEALED_SENTINEL_BINDINGS.unlinkCanary)),
    renameProbe:()=>operation(()=>fileSystem.rename(SEALED_SENTINEL_BINDINGS.renameCanary,SEALED_SENTINEL_BINDINGS.renameDestination)),
    parentReplacementProbe:()=>operation(()=>fileSystem.rename(SEALED_SENTINEL_BINDINGS.stageParent,SEALED_SENTINEL_BINDINGS.parentReplacement)),
    hardlinkProbe:()=>operation(()=>fileSystem.link(SEALED_SENTINEL_BINDINGS.hardlinkCanary,SEALED_SENTINEL_BINDINGS.outsideAlias)),
    aliasWriteProbe:()=>write(SEALED_SENTINEL_BINDINGS.outsideAlias),
  };
}
// Importing this file performs no filesystem probe. No stdin/options dispatcher
// or imported code can select targets. The checked-in placeholders fail closed.
if(import.meta.url.startsWith('file:')&&process.argv[1]===fileURLToPath(import.meta.url)){
  if(!sealedSentinelRouteAllowed({argv:process.argv,execPath:process.execPath,version:process.version,execArgv:process.execArgv,env:process.env})){
    console.log(JSON.stringify({schema:1,scope:'PROPOSAL_ONLY',result:'UNKNOWN',reason_code:'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED',sealed:false,reuseEligible:false}));process.exitCode=1;
  }else{const result=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO());console.log(JSON.stringify(result));process.exitCode=1;}
}
