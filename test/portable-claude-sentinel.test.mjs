import assert from 'node:assert/strict';
import test from 'node:test';
import {EventEmitter} from 'node:events';
import fs from 'node:fs/promises';
import {runNativeSentinel,probeSentinelConnection,classifySentinelError,sentinelRuntimeUnsupported,SENTINEL_BINDINGS as B} from './acceptance/portable-claude-sentinel.mjs';
const safe=()=>({sentinelPresent:()=>false,readProbe:async()=> 'DENIED_PERMISSION_ERROR',writeProbe:async()=> 'DENIED_PERMISSION_ERROR',allowedSocketProbe:async()=> 'EXPECTED_RESPONSE',deniedSocketProbe:async()=> 'DENIED_PERMISSION_ERROR',directNetworkProbe:async()=> 'DENIED_PERMISSION_ERROR'});
test('held-stable synthetic adapter results never become inference or real credential authority',async()=>{
 const report=await runNativeSentinel(safe());assert.equal(report.checks_passed,true);assert.equal(report.checks.length,6);
 assert.equal(report.can_infer,false);assert.equal(report.redue_authority_exercised,false);assert.equal(report.real_credentials_opened,false);
});
test('every missing/refused/timed-out/accessible target fails closed with redacted static results',async()=>{
 for(const key of ['readProbe','writeProbe','deniedSocketProbe','directNetworkProbe'])for(const code of ['UNKNOWN_OR_UNAVAILABLE','ACCESS_SUCCEEDED','ENOENT','ECONNREFUSED','ETIMEDOUT','PRIVATE_SECRET_TOKEN']){
  const io=safe();io[key]=async()=>code;const report=await runNativeSentinel(io);assert.equal(report.checks_passed,false);
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE_SECRET_TOKEN|ECONNREFUSED|ETIMEDOUT|ENOENT/);
 }
 for(const value of ['UNKNOWN_OR_UNAVAILABLE','UNEXPECTED_RESPONSE','ACCESS_SUCCEEDED']){
  const io=safe();io.allowedSocketProbe=async()=>value;assert.equal((await runNativeSentinel(io)).checks_passed,false);
 }
 const io=safe();io.sentinelPresent=()=>true;assert.equal((await runNativeSentinel(io)).checks_passed,false);
 io.sentinelPresent=()=>{throw Error('private credential value');};const report=await runNativeSentinel(io);
 assert.equal(report.checks_passed,false);assert(!JSON.stringify(report).includes('private credential value'));
});
test('proposed exact settings delta retains strict sandbox and exposes one literal checker only',async()=>{
 const settings=JSON.parse(await fs.readFile(new URL('../docs/contributor/portable-claude-sentinel-settings.json',import.meta.url),'utf8'));
 assert.deepEqual(settings.permissions.allow,[`Bash(${B.node} '${B.checker}')`]);assert(!settings.permissions.deny.includes('Bash'));
 for(const tool of ['Read','Write','Edit','WebFetch','WebSearch','Agent','Task','LSP','Glob','Grep'])assert(settings.permissions.deny.includes(tool));
 assert.equal(settings.sandbox.enabled,true);assert.equal(settings.sandbox.failIfUnavailable,true);assert.equal(settings.sandbox.allowUnsandboxedCommands,false);
 assert.equal(settings.sandbox.autoAllowBashIfSandboxed,false);assert.deepEqual(settings.sandbox.excludedCommands,[]);
 assert.deepEqual(settings.sandbox.network.allowUnixSockets,[B.allowedSocket]);assert.equal(settings.sandbox.network.allowAllUnixSockets,false);
 assert.deepEqual(settings.sandbox.network.allowedDomains,[]);assert.deepEqual(settings.sandbox.network.deniedDomains,['*']);assert.equal(settings.sandbox.network.strictAllowlist,true);assert.equal(settings.sandbox.network.allowLocalBinding,false);
 assert(settings.sandbox.filesystem.denyRead.includes(B.protectedCanary.replace('/read-canary.txt','')));
 assert(settings.sandbox.filesystem.denyWrite.includes('__REVIEWED_BASE__'));
 assert(settings.sandbox.filesystem.denyWrite.includes('__REVIEWED_NODE_DIRECTORY__'));
 assert(settings.sandbox.filesystem.denyWrite.includes(B.checker));assert(settings.sandbox.filesystem.denyWrite.some(x=>B.outsideWrite.startsWith(x+'/')));
 assert.deepEqual(settings.sandbox.credentials.envVars,[{name:'REDUE_PREFLIGHT_SENTINEL',mode:'deny'}]);assert.equal(settings.disableAllHooks,true);assert.deepEqual(settings.enabledPlugins,{});
 assert.equal(B.directHost,'127.0.0.1');assert.equal(B.directPort,38187);assert.equal(B.request,'REDUE_SENTINEL_PING\n');
});

test('OS error discriminator and runtime-presence guard cannot authorize unknown or preload context',()=>{
 for(const code of ['EACCES','EPERM'])assert.equal(classifySentinelError({code}),'DENIED_PERMISSION_ERROR');
 for(const code of ['ENOENT','ECONNREFUSED','ETIMEDOUT','EEXIST','ENOTSOCK','PRIVATE_SECRET_TOKEN',undefined])assert.equal(classifySentinelError({code}),'UNKNOWN_OR_UNAVAILABLE');
 assert.equal(sentinelRuntimeUnsupported({}),false);
 for(const key of ['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH','DYLD_INSERT_LIBRARIES','DYLD_LIBRARY_PATH','DYLD_FRAMEWORK_PATH','DYLD_FALLBACK_LIBRARY_PATH','DYLD_VERSIONED_LIBRARY_PATH','OPENSSL_CONF','OPENSSL_MODULES'])assert.equal(sentinelRuntimeUnsupported({[key]:''}),true);
});

test('connection deadline is absolute despite partial replies and cleanup is bounded',async()=>{
 let socket,expire,cancelled=0;
 class FakeSocket extends EventEmitter {constructor(){super();socket=this;}connect(){this.emit('connect');}write(){}destroy(){this.destroyed=true;}}
 const timers={Socket:FakeSocket,setTimer:(fn,ms)=>{assert.equal(ms,1000);expire=fn;return 7;},clearTimer:id=>{assert.equal(id,7);cancelled++;}};
 const result=probeSentinelConnection({path:'synthetic-test-only'},true,timers);
 socket.emit('data',Buffer.from('REDUE_'));socket.emit('data',Buffer.from('SENTINEL_'));
 assert.equal(cancelled,0);expire();assert.equal(await result,'UNKNOWN_OR_UNAVAILABLE');assert.equal(socket.destroyed,true);assert.equal(cancelled,1);
 socket.emit('data',null);assert.equal(cancelled,1);
 const success=probeSentinelConnection({path:'synthetic-test-only'},true,timers);
 socket.emit('data',Buffer.from(B.response));assert.equal(await success,'EXPECTED_RESPONSE');assert.equal(cancelled,2);
 const rejected=probeSentinelConnection({path:'synthetic-test-only'},false,timers);
 // Fake connect succeeded: inaccessible-target test may not call this denial.
 assert.equal(await rejected,'ACCESS_SUCCEEDED');assert.equal(cancelled,3);
 const oversized=probeSentinelConnection({path:'synthetic-test-only'},true,timers);
 socket.emit('data',Buffer.alloc(65));assert.equal(await oversized,'UNEXPECTED_RESPONSE');assert.equal(cancelled,4);
 socket.emit('data',null);assert.equal(cancelled,4);
});

test('durable binding uses two short socket basenames and quoted single checker argument',()=>{
 assert(B.allowedSocket.endsWith('/a.sock'));assert(B.deniedSocket.endsWith('/d.sock'));
 // Reviewed durable private base length91; short suffix keeps sockaddr_un payload below104 bytes.
 assert(91+Buffer.byteLength('/a.sock')<104);assert(91+Buffer.byteLength('/d.sock')<104);
});
