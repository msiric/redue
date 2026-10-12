import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {constants as F} from 'node:fs';
import {SEALED_SENTINEL_BINDINGS as B,runSealedTypeScriptNativeSentinel,sealedTypeScriptSentinelIO,
  classifySealedSentinelError,sealedSentinelRuntimeUnsupported,sealedSentinelRouteAllowed} from './acceptance/sealed-typescript-native-sentinel.mjs';
const marker=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
const good=()=>({fixtureProbe:async()=>'FIXTURE_MATCHED',allowedWriteProbe:async()=>'ACCESS_SUCCEEDED',
  writeProbe:async()=>'DENIED_PERMISSION_ERROR',chmodProbe:async()=>'DENIED_PERMISSION_ERROR',unlinkProbe:async()=>'DENIED_PERMISSION_ERROR',
  renameProbe:async()=>'DENIED_PERMISSION_ERROR',parentReplacementProbe:async()=>'DENIED_PERMISSION_ERROR',hardlinkProbe:async()=>'DENIED_PERMISSION_ERROR',
  aliasWriteProbe:async()=>assert.fail('A denied hardlink must launch no alias write'),stageIntegrityProbe:async()=>'FIXTURE_MATCHED'});
test('nominal fixed operation denials are partial UNKNOWN while shared mapping remains unimplemented',async()=>{
  const report=await runSealedTypeScriptNativeSentinel(good());assert.equal(report.result,'UNKNOWN');assert.equal(report.checks_passed,false);assert.equal(report.implemented_checks_passed,true);
  assert.equal(report.checks.length,11);assert.equal(report.sealed,false);assert.equal(report.reuseEligible,false);assert.equal(report.compiler_executions,0);assert.equal(report.model_actions_requested,0);
  assert.deepEqual(report.checks.find(row=>row.name==='write_through_created_alias_denied'),{name:'write_through_created_alias_denied',result:'NOT_PERFORMED',reason_code:'NOT_PERFORMED_PREREQUISITE_DENIED',attempted:false});
  assert.deepEqual(report.checks.at(-1),{name:'map_shared_writable_mapping_denied',result:'NOT_IMPLEMENTED',reason_code:'NOT_IMPLEMENTED',attempted:false});
});
for(const method of ['writeProbe','chmodProbe','unlinkProbe','renameProbe','parentReplacementProbe','hardlinkProbe'])test(`unexpected successful ${method} latches FAIL`,async()=>{
  const io=good();io[method]=async()=>'ACCESS_SUCCEEDED';let alias=0;io.aliasWriteProbe=async()=>{alias++;return'DENIED_PERMISSION_ERROR';};const report=await runSealedTypeScriptNativeSentinel(io);
  assert.equal(report.result,'FAIL');assert(report.checks.some(row=>row.result==='FAIL'));assert.equal(alias,method==='hardlinkProbe'?1:0);assert.equal(report.sealed,false);
});
test('successful link and alias write retain separate failure outcomes',async()=>{
  const io=good();io.hardlinkProbe=async()=>'ACCESS_SUCCEEDED';io.aliasWriteProbe=async()=>'ACCESS_SUCCEEDED';io.stageIntegrityProbe=async()=>'ASSERTION_FAILED';
  const report=await runSealedTypeScriptNativeSentinel(io);assert.equal(report.result,'FAIL');
  assert.equal(report.checks.find(row=>row.name==='outside_hardlink_creation_denied').result,'FAIL');assert.equal(report.checks.find(row=>row.name==='write_through_created_alias_denied').result,'FAIL');
  assert.equal(report.checks.find(row=>row.name==='stage_fixture_identity_and_bytes_preserved').result,'FAIL');
});
for(const code of ['ENOENT','EXDEV','ELOOP','ETIMEDOUT','ENOSYS',undefined])test(`${code} is unavailable, never permission denial`,async()=>{
  assert.equal(classifySealedSentinelError({code}),'UNKNOWN_OR_UNAVAILABLE');const io=good();io.hardlinkProbe=async()=>{throw Object.assign(Error('NONSECRET-CANARY'),{code});};
  const report=await runSealedTypeScriptNativeSentinel(io);assert.equal(report.result,'UNKNOWN');assert.equal(report.checks.find(row=>row.name==='outside_hardlink_creation_denied').result,'UNKNOWN');
  assert.equal(report.checks.find(row=>row.name==='write_through_created_alias_denied').reason_code,'NOT_PERFORMED_PREREQUISITE_UNKNOWN');assert(!JSON.stringify(report).includes('NONSECRET-CANARY'));
});
test('only EPERM and EACCES classify a permission error',()=>{for(const code of ['EPERM','EACCES'])assert.equal(classifySealedSentinelError({code}),'DENIED_PERMISSION_ERROR');});
for(const [method,code] of [['fixtureProbe','UNKNOWN_OR_UNAVAILABLE'],['fixtureProbe','DENIED_PERMISSION_ERROR'],['fixtureProbe','ASSERTION_FAILED'],['allowedWriteProbe','DENIED_PERMISSION_ERROR'],['allowedWriteProbe','UNKNOWN_OR_UNAVAILABLE']])test(`failed prerequisite ${method}/${code} performs no destructive operation`,async()=>{
  const io=good();io[method]=async()=>code;let launched=0;for(const name of ['writeProbe','chmodProbe','unlinkProbe','renameProbe','parentReplacementProbe','hardlinkProbe','aliasWriteProbe'])io[name]=async()=>{launched++;return'ACCESS_SUCCEEDED';};
  const report=await runSealedTypeScriptNativeSentinel(io);assert.equal(launched,0);assert.equal(report.checks_passed,false);assert(report.unperformed_assertions.includes('STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED'));
});
test('unknown adapter values and missing methods cannot leak or become denied PASS',async()=>{
  const io=good();io.writeProbe=async()=>({private:'NONSECRET'});delete io.chmodProbe;const report=await runSealedTypeScriptNativeSentinel(io);assert.equal(report.result,'UNKNOWN');
  for(const name of ['stage_file_write_denied','stage_file_chmod_denied'])assert.equal(report.checks.find(row=>row.name===name).result,'UNKNOWN');assert(!JSON.stringify(report).includes('NONSECRET'));
});
test('unrendered exact route is denied and case aliases of runtime overrides are refused',()=>{
  assert.equal(sealedSentinelRouteAllowed({argv:['node',B.checker],execPath:B.node,version:'v22.13.0',execArgv:[],env:{}}),false);
  for(const key of ['NODE_OPTIONS','node_options','Node_Path','DYLD_INSERT_LIBRARIES','dyld_custom','OPENSSL_CONF','openssl_armcap','LD_PRELOAD'])assert.equal(sealedSentinelRuntimeUnsupported({[key]:'NONSECRET'}),true);
  assert.equal(sealedSentinelRuntimeUnsupported({PATH:'/normal'}),false);
});
test('data-only rendering control requires fixed Node/version/checker/no extra argv',async()=>{
  const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-sentinel.mjs',import.meta.url),'utf8').replaceAll('__REVIEWED_SENTINEL_BASE__','/reviewed/base').replaceAll('__REVIEWED_NODE__','/reviewed/node');
  const rendered=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const route={argv:['ignored','/reviewed/base/workspace/sealed-typescript-native-sentinel.mjs'],execPath:'/reviewed/node',version:'v22.13.0',execArgv:[],env:{}};
  assert.equal(rendered.sealedSentinelRouteAllowed(route),true);
  for(const bad of [{argv:[...route.argv,'--target=/elsewhere']},{execPath:'/other/node'},{execPath:'/REVIEWED/node'},{argv:['ignored','/reviewed/base/workspace/SEALED-TYPESCRIPT-native-sentinel.mjs']},{version:'v22.23.3'},{execArgv:['--require=unreviewed']},{env:{NODE_OPTIONS:'--require=unreviewed'}}])assert.equal(rendered.sealedSentinelRouteAllowed({...route,...bad}),false);
});
const supported={skip:typeof process.getuid==='function'&&F.O_NOFOLLOW!==undefined&&F.O_NONBLOCK!==undefined?false:'No reviewed UID/no-follow/nonblock primitives'};
function fixtureMock(){let ino=20n;const states=new Map(),calls=[];
  const stats=(directory=false)=>({dev:7n,ino:ino++,mode:directory?0o40700n:0o100644n,uid:BigInt(process.getuid()),nlink:directory?2n:1n,size:directory?0n:BigInt(marker.length),mtimeNs:1n,ctimeNs:1n,isFile:()=>!directory,isDirectory:()=>directory,isSymbolicLink:()=>false});
  for(const key of ['stageParent','stage','allowedWorkspace'])states.set(B[key],{stat:stats(true)});
  for(const key of ['writeCanary','chmodCanary','unlinkCanary','renameCanary','hardlinkCanary','allowedWrite'])states.set(B[key],{stat:stats(),bytes:Buffer.from(marker)});
  const error=code=>Object.assign(Error('NONSECRET-MOCK-DETAIL'),{code});
  const denied=async(name,...args)=>{calls.push([name,...args]);throw error('EPERM');};
  const mock={lstat:async file=>{calls.push(['lstat',file]);const value=states.get(file);if(!value)throw error('ENOENT');return value.stat;},
    open:async(file,flags)=>{calls.push(['open',file,flags]);const state=states.get(file);if(!state)throw error('ENOENT');if((flags&F.O_WRONLY)!==0&&file!==B.allowedWrite)throw error('EPERM');
      return{stat:async()=>state.stat,read:async(buffer,offset,length,position)=>{state.bytes.copy(buffer,offset,position,position+length);return{bytesRead:Math.min(length,state.bytes.length-position)};},
        write:async(buffer,offset,length,position)=>{buffer.copy(state.bytes,position,offset,offset+length);return{bytesWritten:length};},close:async()=>{calls.push(['close',file]);}};},
    chmod:async(...args)=>denied('chmod',...args),unlink:async(...args)=>denied('unlink',...args),rename:async(...args)=>denied('rename',...args),link:async(...args)=>denied('link',...args)};
  return{mock,states,calls,error};
}
test('mock native IO checks readable fresh controls then fixed denied operations without actual filesystem activity',supported,async()=>{
  const f=fixtureMock(),report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.implemented_checks_passed,true);assert.equal(report.result,'UNKNOWN');
  assert(f.calls.some(([op,file])=>op==='open'&&file===B.allowedWrite));assert(f.calls.some(([op,a,b])=>op==='rename'&&a===B.stageParent&&b===B.parentReplacement));
  assert(f.calls.some(([op,a,b])=>op==='link'&&a===B.hardlinkCanary&&b===B.outsideAlias));assert(!f.calls.some(([op,file])=>op==='open'&&file===B.outsideAlias));
  for(const [op,,flags] of f.calls)if(op==='open'){assert.equal(flags&F.O_NOFOLLOW,F.O_NOFOLLOW);assert.equal(flags&F.O_NONBLOCK,F.O_NONBLOCK);}
});
for(const [name,mutate,expected] of [
  ['missing file',f=>f.states.delete(B.writeCanary),'UNKNOWN_OR_UNAVAILABLE'],['preexisting alias',f=>f.states.set(B.outsideAlias,{stat:f.states.get(B.writeCanary).stat}),'ASSERTION_FAILED'],
  ['source hardlink',f=>f.states.get(B.writeCanary).stat.nlink=2n,'ASSERTION_FAILED'],['wrong canary',f=>f.states.get(B.writeCanary).bytes.fill(0x61),'ASSERTION_FAILED'],
  ['symlink directory',f=>f.states.get(B.stageParent).stat.isSymbolicLink=()=>true,'ASSERTION_FAILED'],['wrong directory mode',f=>f.states.get(B.stage).stat.mode=0o40755n,'ASSERTION_FAILED'],
])test(`mock fixture ${name} blocks every destructive assertion`,supported,async()=>{
  const f=fixtureMock();mutate(f);const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.checks_passed,false);assert.equal(report.checks[0].reason_code,expected);
  assert(!f.calls.some(([op,,flags])=>['chmod','unlink','rename','link'].includes(op)||op==='open'&&(flags&F.O_WRONLY)!==0));
});
test('same-byte replacement, chmod and alias nlink changes fail final physical audit',supported,async()=>{
  for(const mutation of [stat=>stat.ino+=100n,stat=>stat.mode=0o100600n,stat=>stat.nlink=2n]){
    const f=fixtureMock(),io=sealedTypeScriptSentinelIO(f.mock);assert.equal(await io.fixtureProbe(),'FIXTURE_MATCHED');mutation(f.states.get(B.writeCanary).stat);assert.equal(await io.stageIntegrityProbe(),'ASSERTION_FAILED');
  }
});
test('a successful mocked link triggers fixed alias write and reports changed original stage identity',supported,async()=>{
  const f=fixtureMock();f.mock.link=async(a,b)=>{f.calls.push(['link',a,b]);const state=f.states.get(a);state.stat.nlink=2n;f.states.set(b,state);};
  const open=f.mock.open;f.mock.open=async(file,flags)=>file===B.outsideAlias?{write:async()=>({bytesWritten:1}),close:async()=>{f.calls.push(['close',file]);}}:open(file,flags);
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'FAIL');
  assert.equal(report.checks.find(row=>row.name==='write_through_created_alias_denied').reason_code,'ACCESS_SUCCEEDED');assert.equal(report.checks.find(row=>row.name==='stage_fixture_identity_and_bytes_preserved').reason_code,'ASSERTION_FAILED');
});
test('mock close error remains UNKNOWN rather than fabricated permission denial',supported,async()=>{
  const f=fixtureMock(),open=f.mock.open;f.mock.open=async(...args)=>{const handle=await open(...args);handle.close=async()=>{throw f.error('EPERM');};return handle;};
  const io=sealedTypeScriptSentinelIO(f.mock);assert.equal(await io.allowedWriteProbe(),'UNKNOWN_OR_UNAVAILABLE');
});
