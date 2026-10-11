// Disabled until exact proposal/fixture/settings review and owner approval.
// Results alone do not prove which host boundary executed this checker.
import fs from 'node:fs/promises';
import {constants as F} from 'node:fs';
import net from 'node:net';
import {fileURLToPath} from 'node:url';

const base='__REVIEWED_BASE__';
export const SENTINEL_BINDINGS=Object.freeze({
  node:'__REVIEWED_NODE__',
  checker:base+'/workspace/redue-native-sentinel.mjs',
  protectedCanary:base+'/native-sentinel-resources/protected/read-canary.txt',
  outsideWrite:base+'/native-sentinel-resources/outside/write-canary.txt',
  allowedSocket:base+'/native-sentinel-resources/allowed.sock',
  deniedSocket:base+'/native-sentinel-resources/denied.sock',
  directHost:'127.0.0.1',directPort:38187,
  request:'REDUE_SENTINEL_PING\n',response:'REDUE_SENTINEL_OK\n',
});
const DENIAL_CODES=new Set(['EACCES','EPERM']);
const RUNTIME_OVERRIDE_KEYS=Object.freeze(['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH','DYLD_INSERT_LIBRARIES','DYLD_LIBRARY_PATH','DYLD_FRAMEWORK_PATH']);
export const classifySentinelError=error=>DENIAL_CODES.has(error?.code)?'DENIED_PERMISSION_ERROR':'UNKNOWN_OR_UNAVAILABLE';
export const sentinelRuntimeUnsupported=env=>RUNTIME_OVERRIDE_KEYS.some(key=>Object.hasOwn(env,key))||Object.keys(env).some(key=>key.startsWith('DYLD_'));
const classification=classifySentinelError;
export async function runNativeSentinel(io){
  const checks=[];
  const check=async(name,probe,expected)=>{
    let result;try{result=await probe();}catch{result='UNKNOWN_OR_UNAVAILABLE';}
    // Neither OS error text nor arbitrary adapter values leave this boundary.
    const code=['ABSENT','PRESENT','ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','UNKNOWN_OR_UNAVAILABLE','EXPECTED_RESPONSE','UNEXPECTED_RESPONSE'].includes(result)?result:'UNKNOWN_OR_UNAVAILABLE';
    checks.push({name,passed:code===expected,reason_code:code});
  };
  await check('custom_env_sentinel_absent',()=>io.sentinelPresent()?'PRESENT':'ABSENT','ABSENT');
  await check('synthetic_protected_read_denied',()=>io.readProbe(),'DENIED_PERMISSION_ERROR');
  await check('synthetic_outside_write_denied',()=>io.writeProbe(),'DENIED_PERMISSION_ERROR');
  await check('one_synthetic_socket_allowed',()=>io.allowedSocketProbe(),'EXPECTED_RESPONSE');
  await check('other_synthetic_socket_denied',()=>io.deniedSocketProbe(),'DENIED_PERMISSION_ERROR');
  await check('owned_direct_loopback_denied',()=>io.directNetworkProbe(),'DENIED_PERMISSION_ERROR');
  return {schema:1,scope:'SYNTHETIC_NATIVE_BOUNDARY_PROBE_RESULTS',checks_passed:checks.every(c=>c.passed),checks,
    native_tool_boundary:'REQUIRES_ACTUAL_NATIVE_HOST_TRACE_AND_LIVE_FIXTURE_GATES',
    real_credentials_opened:false,redue_authority_exercised:false,model_actions_requested:0,
    can_infer:false,portable_applicability:'NOT_TESTED'};
}
export function probeSentinelConnection({path,host,port},expectResponse,{Socket=net.Socket,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  return new Promise(resolve=>{
    const socket=new Socket();let done=false,deadline,received=Buffer.alloc(0);
    const finish=code=>{if(done)return;done=true;if(deadline!==undefined)clearTimer(deadline);socket.destroy();resolve(code);};
    deadline=setTimer(()=>finish('UNKNOWN_OR_UNAVAILABLE'),1000);
    socket.on('error',error=>finish(classification(error)));
    socket.on('end',()=>finish('UNEXPECTED_RESPONSE'));
    socket.on('connect',()=>{
      if(!expectResponse){finish('ACCESS_SUCCEEDED');return;}
      socket.write(SENTINEL_BINDINGS.request);
    });
    socket.on('data',chunk=>{
      received=Buffer.concat([received,chunk]);
      if(received.length>64){finish('UNEXPECTED_RESPONSE');return;}
      const expected=Buffer.from(SENTINEL_BINDINGS.response);
      if(received.equals(expected))finish('EXPECTED_RESPONSE');
      else if(received.length>=expected.length)finish('UNEXPECTED_RESPONSE');
    });
    try{socket.connect(path?{path}:{host,port});}catch(error){finish(classification(error));}
    });
}
export function nativeSentinelIO(){
  const fileProbe=async(file,flags)=>{
    let handle;try{handle=await fs.open(file,flags,0o600);return 'ACCESS_SUCCEEDED';}
    catch(error){return classification(error);}finally{if(handle)await handle.close();}
  };

  return {
    sentinelPresent:()=>Object.hasOwn(process.env,'REDUE_PREFLIGHT_SENTINEL'),
    readProbe:()=>fileProbe(SENTINEL_BINDINGS.protectedCanary,F.O_RDONLY|F.O_NOFOLLOW|F.O_NONBLOCK),
    writeProbe:()=>fileProbe(SENTINEL_BINDINGS.outsideWrite,F.O_WRONLY|F.O_CREAT|F.O_EXCL|F.O_NOFOLLOW|F.O_NONBLOCK),
    allowedSocketProbe:()=>probeSentinelConnection({path:SENTINEL_BINDINGS.allowedSocket},true),
    deniedSocketProbe:()=>probeSentinelConnection({path:SENTINEL_BINDINGS.deniedSocket},false),
    directNetworkProbe:()=>probeSentinelConnection({host:SENTINEL_BINDINGS.directHost,port:SENTINEL_BINDINGS.directPort},false),
  };
}
// Author tests import pure adapters; no native/process/socket/filesystem probe is
// launched at import. Execution is only the reviewed literal local destination.
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  if(process.argv.length!==2||process.argv[1]!==SENTINEL_BINDINGS.checker||
    process.execPath!==SENTINEL_BINDINGS.node||process.version!=='v22.13.0'||sentinelRuntimeUnsupported(process.env)){
    console.log(JSON.stringify({schema:1,scope:'PROPOSAL_ONLY',reason_code:'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED',can_infer:false}));
    process.exitCode=1;
  }else{
    const report=await runNativeSentinel(nativeSentinelIO());console.log(JSON.stringify(report));process.exitCode=report.checks_passed?0:1;
  }
}
