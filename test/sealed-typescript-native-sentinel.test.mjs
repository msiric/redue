import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {constants as F} from 'node:fs';
import {SEALED_SENTINEL_BINDINGS as B,runSealedTypeScriptNativeSentinel,sealedTypeScriptSentinelIO,
  classifySealedSentinelError,sealedSentinelRuntimeUnsupported,sealedSentinelRouteAllowed} from './acceptance/sealed-typescript-native-sentinel.mjs';
const marker=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
const good=()=>({fixtureProbe:async()=>'FIXTURE_MATCHED',allowedWriteProbe:async()=>'ACCESS_SUCCEEDED',
  caseAliasProbe:async()=>'FIXTURE_MATCHED',caseWriteProbe:async()=>'DENIED_PERMISSION_ERROR',
  parentSymlinkProbe:async()=>'ACCESS_SUCCEEDED',parentSymlinkFixtureProbe:async()=>'FIXTURE_MATCHED',parentSymlinkWriteProbe:async()=>'DENIED_PERMISSION_ERROR',
  writeProbe:async()=>'DENIED_PERMISSION_ERROR',chmodProbe:async()=>'DENIED_PERMISSION_ERROR',unlinkProbe:async()=>'DENIED_PERMISSION_ERROR',
  renameProbe:async()=>'DENIED_PERMISSION_ERROR',parentReplacementProbe:async()=>'DENIED_PERMISSION_ERROR',hardlinkProbe:async()=>'DENIED_PERMISSION_ERROR',
  aliasWriteProbe:async()=>assert.fail('A denied hardlink must launch no alias write'),stageIntegrityProbe:async()=>'FIXTURE_MATCHED'});
test('nominal fixed operation denials are partial UNKNOWN while shared mapping remains unimplemented',async()=>{
  const report=await runSealedTypeScriptNativeSentinel(good());assert.equal(report.result,'UNKNOWN');assert.equal(report.checks_passed,false);assert.equal(report.implemented_checks_passed,true);
  assert.equal(report.checks.length,18);assert.equal(report.sealed,false);assert.equal(report.reuseEligible,false);assert.equal(report.compiler_executions,0);assert.equal(report.model_actions_requested,0);
  assert.deepEqual(report.checks.find(row=>row.name==='write_through_created_alias_denied'),{name:'write_through_created_alias_denied',result:'NOT_PERFORMED',reason_code:'NOT_PERFORMED_PREREQUISITE_DENIED',attempted:false});
  assert.deepEqual(report.checks.find(row=>row.name==='map_shared_writable_mapping_denied'),{name:'map_shared_writable_mapping_denied',result:'NOT_IMPLEMENTED',reason_code:'NOT_IMPLEMENTED',attempted:false});
});
for(const method of ['writeProbe','caseWriteProbe','parentSymlinkWriteProbe','chmodProbe','unlinkProbe','renameProbe','parentReplacementProbe','hardlinkProbe'])test(`unexpected successful ${method} latches FAIL`,async()=>{
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
  const io=good();io[method]=async()=>code;let launched=0;for(const name of ['writeProbe','caseWriteProbe','parentSymlinkProbe','parentSymlinkWriteProbe','chmodProbe','unlinkProbe','renameProbe','parentReplacementProbe','hardlinkProbe','aliasWriteProbe'])io[name]=async()=>{launched++;return'ACCESS_SUCCEEDED';};
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
  states.set(B.caseWriteCanary,states.get(B.writeCanary));
  states.set(B.caseWriteCanary.slice(0,B.caseWriteCanary.lastIndexOf('/')),states.get(B.stage));
  states.set(B.caseWriteCanary.slice(0,B.caseWriteCanary.lastIndexOf('/stage/')),states.get(B.stageParent));
  const error=code=>Object.assign(Error('NONSECRET-MOCK-DETAIL'),{code});
  const denied=async(name,...args)=>{calls.push([name,...args]);throw error('EPERM');};
  const mock={lstat:async file=>{calls.push(['lstat',file]);const value=states.get(file);if(!value)throw error('ENOENT');return value.stat;},
    open:async(file,flags)=>{calls.push(['open',file,flags]);const state=states.get(file);if(!state)throw error('ENOENT');if((flags&F.O_WRONLY)!==0&&file!==B.allowedWrite)throw error('EPERM');
      return{stat:async()=>state.stat,read:async(buffer,offset,length,position)=>{state.bytes.copy(buffer,offset,position,position+length);return{bytesRead:Math.min(length,state.bytes.length-position)};},
        write:async(buffer,offset,length,position)=>{buffer.copy(state.bytes,position,offset,offset+length);return{bytesWritten:length};},close:async()=>{calls.push(['close',file]);}};},
    symlink:async(target,file,type)=>{calls.push(['symlink',target,file,type]);states.set(file,{stat:{...stats(),isFile:()=>false,isSymbolicLink:()=>true},target});states.set(B.parentSymlinkWriteCanary,states.get(B.writeCanary));},
    readlink:async file=>{calls.push(['readlink',file]);if(!states.has(file))throw error('ENOENT');return states.get(file).target;},
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

test('successful protected write stays FAIL when descriptor close and final audit are uncertain',supported,async()=>{
  const f=fixtureMock(),open=f.mock.open;f.mock.open=async(file,flags)=>{
    if(file===B.writeCanary&&(flags&F.O_WRONLY)!==0)return{write:async()=>({bytesWritten:1}),close:async()=>{throw f.error('EPERM');}};
    return open(file,flags);
  };
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'FAIL');
  assert.equal(report.checks.find(row=>row.name==='stage_file_write_denied').reason_code,'ACCESS_SUCCEEDED');
  assert.equal(report.checks.find(row=>row.name==='stage_fixture_identity_and_bytes_preserved').reason_code,'UNKNOWN_OR_UNAVAILABLE');
});
test('successful alias write is retained despite close uncertainty',supported,async()=>{
  const f=fixtureMock(),open=f.mock.open;f.mock.link=async(a,b)=>{const state=f.states.get(a);state.stat.nlink=2n;f.states.set(b,state);};
  f.mock.open=async(file,flags)=>file===B.outsideAlias?{write:async()=>({bytesWritten:1}),close:async()=>{throw f.error('EIO');}}:open(file,flags);
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'FAIL');
  assert.equal(report.checks.find(row=>row.name==='outside_hardlink_creation_denied').reason_code,'ACCESS_SUCCEEDED');
  assert.equal(report.checks.find(row=>row.name==='write_through_created_alias_denied').reason_code,'ACCESS_SUCCEEDED');
});
test('an observed failed write assertion is not erased by close failure',supported,async()=>{
  const f=fixtureMock(),open=f.mock.open;f.mock.open=async(file,flags)=>file===B.writeCanary&&(flags&F.O_WRONLY)!==0?{write:async()=>({bytesWritten:0}),close:async()=>{throw f.error('EIO');}}:open(file,flags);
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'FAIL');assert.equal(report.checks.find(row=>row.name==='stage_file_write_denied').reason_code,'ASSERTION_FAILED');
});

test('atomic exchange is explicitly unimplemented, never represented by ordinary rename',async()=>{
  const report=await runSealedTypeScriptNativeSentinel(good());
  for(const name of ['stage_parent_atomic_exchange_denied','base_atomic_exchange_denied'])assert.deepEqual(report.checks.find(row=>row.name===name),{name,result:'NOT_IMPLEMENTED',reason_code:'NOT_IMPLEMENTED',attempted:false});
  assert(report.unperformed_assertions.includes('STAGE_PARENT_ATOMIC_EXCHANGE_DENIED'));assert(report.unperformed_assertions.includes('BASE_ATOMIC_EXCHANGE_DENIED'));assert.equal(report.result,'UNKNOWN');
});

test('mock case-sensitive missing spelling launches no case write and cannot claim a denial',supported,async()=>{
  const f=fixtureMock();f.states.delete(B.caseWriteCanary);const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));
  assert.equal(report.checks.find(row=>row.name==='case_alias_resolves_to_same_stage_canary').result,'UNKNOWN');
  assert.deepEqual(report.checks.find(row=>row.name==='stage_case_alias_write_denied'),{name:'stage_case_alias_write_denied',result:'NOT_PERFORMED',reason_code:'NOT_PERFORMED_PREREQUISITE_UNKNOWN',attempted:false});
  assert(!f.calls.some(([op,file,flags])=>op==='open'&&file===B.caseWriteCanary&&(flags&F.O_WRONLY)!==0));assert.equal(report.result,'UNKNOWN');
});

for(const mutation of ['symlink-parent','different-parent','different-file'])test(`mock case alias ${mutation} is not treated as a proved case-equivalent target`,supported,async()=>{
  const f=fixtureMock(),parent=B.caseWriteCanary.slice(0,B.caseWriteCanary.lastIndexOf('/stage/'));
  if(mutation==='symlink-parent')f.states.set(parent,{stat:{...f.states.get(B.stageParent).stat,isSymbolicLink:()=>true}});
  if(mutation==='different-parent')f.states.set(parent,{stat:{...f.states.get(B.stageParent).stat,ino:999n}});
  if(mutation==='different-file')f.states.set(B.caseWriteCanary,{stat:{...f.states.get(B.writeCanary).stat,ino:999n},bytes:Buffer.from(marker)});
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.checks.find(row=>row.name==='case_alias_resolves_to_same_stage_canary').reason_code,'ASSERTION_FAILED');
  assert.equal(report.checks.find(row=>row.name==='stage_case_alias_write_denied').attempted,false);assert.equal(report.result,'FAIL');
});

test('mock parent symlink creation denied means its write was not performed, not a write-denial PASS',supported,async()=>{
  const f=fixtureMock();f.mock.symlink=async(...args)=>{f.calls.push(['symlink',...args]);throw f.error('EPERM');};
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'UNKNOWN');
  assert.equal(report.checks.find(row=>row.name==='owned_workspace_parent_symlink_creation_control').result,'UNKNOWN');
  assert.deepEqual(report.checks.find(row=>row.name==='stage_parent_symlink_alias_write_denied'),{name:'stage_parent_symlink_alias_write_denied',result:'NOT_PERFORMED',reason_code:'NOT_PERFORMED_PREREQUISITE_DENIED',attempted:false});
  assert(!f.calls.some(([op,file])=>op==='open'&&file===B.parentSymlinkWriteCanary));
});

for(const mutation of ['wrong-target','unowned-link','wrong-canary'])test(`mock parent symlink ${mutation} blocks the alias write rather than reading another body`,supported,async()=>{
  const f=fixtureMock(),symlink=f.mock.symlink;f.mock.symlink=async(...args)=>{await symlink(...args);
    if(mutation==='wrong-target')f.states.get(B.parentSymlinkAlias).target='/NONSECRET-outside-stage';
    if(mutation==='unowned-link')f.states.get(B.parentSymlinkAlias).stat.uid+=1n;
    if(mutation==='wrong-canary')f.states.set(B.parentSymlinkWriteCanary,{stat:{...f.states.get(B.writeCanary).stat,ino:999n}});
  };
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.checks.find(row=>row.name==='parent_symlink_resolves_to_same_stage_canary').reason_code,'ASSERTION_FAILED');
  assert.equal(report.checks.find(row=>row.name==='stage_parent_symlink_alias_write_denied').attempted,false);assert.equal(report.result,'FAIL');
  assert(!f.calls.some(([op,file])=>op==='open'&&file===B.parentSymlinkWriteCanary));assert(!JSON.stringify(report).includes('NONSECRET-outside-stage'));
});

test('mock case-alias and parent-symlink-alias write grants stay FAIL through uncertain close',supported,async()=>{
  for(const target of [B.caseWriteCanary,B.parentSymlinkWriteCanary]){
    const f=fixtureMock(),open=f.mock.open;f.mock.open=async(file,flags)=>file===target&&(flags&F.O_WRONLY)!==0?{write:async()=>({bytesWritten:1}),close:async()=>{throw f.error('EIO');}}:open(file,flags);
    const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'FAIL');
    const name=target===B.caseWriteCanary?'stage_case_alias_write_denied':'stage_parent_symlink_alias_write_denied';assert.equal(report.checks.find(row=>row.name===name).reason_code,'ACCESS_SUCCEEDED');
    assert.equal(report.checks.find(row=>row.name==='stage_fixture_identity_and_bytes_preserved').reason_code,'UNKNOWN_OR_UNAVAILABLE');
  }
});

test('mock workspace metadata failure after successful link keeps construction observed but launches no alias write',supported,async()=>{
  const f=fixtureMock(),symlink=f.mock.symlink,lstat=f.mock.lstat;let created=false;
  f.mock.symlink=async(...args)=>{await symlink(...args);created=true;};f.mock.lstat=async(file,...args)=>{if(created&&file===B.allowedWorkspace)throw f.error('EIO');return lstat(file,...args);};
  const report=await runSealedTypeScriptNativeSentinel(sealedTypeScriptSentinelIO(f.mock));assert.equal(report.result,'UNKNOWN');
  assert.equal(report.checks.find(row=>row.name==='owned_workspace_parent_symlink_creation_control').reason_code,'ACCESS_SUCCEEDED');
  assert.equal(report.checks.find(row=>row.name==='parent_symlink_resolves_to_same_stage_canary').result,'UNKNOWN');assert.equal(report.checks.find(row=>row.name==='stage_parent_symlink_alias_write_denied').attempted,false);
  assert.equal(report.checks.find(row=>row.name==='stage_fixture_identity_and_bytes_preserved').result,'UNKNOWN');
});

test('mock final alias target replacement is detected without a new body read',supported,async()=>{
  const f=fixtureMock(),io=sealedTypeScriptSentinelIO(f.mock);assert.equal(await io.fixtureProbe(),'FIXTURE_MATCHED');
  assert.equal(await io.parentSymlinkProbe(),'ACCESS_SUCCEEDED');assert.equal(await io.parentSymlinkFixtureProbe(),'FIXTURE_MATCHED');
  f.states.get(B.parentSymlinkAlias).target='/NONSECRET-other';assert.equal(await io.stageIntegrityProbe(),'ASSERTION_FAILED');
  assert(!f.calls.some(([op,file])=>op==='open'&&file===B.parentSymlinkWriteCanary));
});
