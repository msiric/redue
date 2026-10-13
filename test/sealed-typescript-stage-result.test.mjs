// Static protocol/lifecycle fixtures and pure checker control-flow comparisons.
// No sentinel IO adapter, real fixture, checker entrypoint, child or model runs.
import test from 'node:test';import assert from 'node:assert/strict';
import {parseSealedTypeScriptStageResult as parse,createSealedTypeScriptStageResultLatch as latch} from './acceptance/sealed-typescript-stage-result.mjs';
import {runSealedTypeScriptNativeSentinel as pureReport} from './acceptance/sealed-typescript-native-sentinel.mjs';
const row=(name,result,reason_code,attempted=true)=>({name,result,reason_code,attempted});
const same=name=>row(name,'PASS','FIXTURE_MATCHED'),denied=name=>row(name,'PASS','DENIED_PERMISSION_ERROR');
const missing=name=>row(name,'NOT_IMPLEMENTED','NOT_IMPLEMENTED',false);
const notPerformed=(name,reason='NOT_PERFORMED_PREREQUISITE_UNKNOWN')=>row(name,'NOT_PERFORMED',reason,false);
const mandatory=['MAP_SHARED_WRITABLE_MAPPING_DENIED','STAGE_PARENT_ATOMIC_EXCHANGE_DENIED','BASE_ATOMIC_EXCHANGE_DENIED'];
function good(){return{schema:1,scope:'SYNTHETIC_STAGED_TREE_BOUNDARY_PROBE_RESULTS',result:'UNKNOWN',checks_passed:false,implemented_checks_passed:true,
 checks:[same('fresh_synthetic_fixture_readable'),row('owned_workspace_write_permitted','PASS','ACCESS_SUCCEEDED'),same('case_alias_resolves_to_same_stage_canary'),denied('stage_case_alias_write_denied'),
  denied('stage_file_write_denied'),denied('stage_file_chmod_denied'),denied('stage_file_unlink_denied'),denied('stage_file_rename_denied'),denied('stage_parent_replacement_denied'),denied('outside_hardlink_creation_denied'),
  notPerformed('write_through_created_alias_denied','NOT_PERFORMED_PREREQUISITE_DENIED'),row('owned_workspace_parent_symlink_creation_control','PASS','ACCESS_SUCCEEDED'),same('parent_symlink_resolves_to_same_stage_canary'),denied('stage_parent_symlink_alias_write_denied'),same('stage_fixture_identity_and_bytes_preserved'),
  missing('map_shared_writable_mapping_denied'),missing('stage_parent_atomic_exchange_denied'),missing('base_atomic_exchange_denied')],unperformed_assertions:[...mandatory,'NOT_PERFORMED_PREREQUISITE_DENIED'],
 native_tool_boundary:'REQUIRES_ACTUAL_NATIVE_HOST_TRACE_AND_LIVE_FIXTURE_GATES',real_credentials_opened:false,compiler_executions:0,model_actions_requested:0,network_actions_requested:0,sealed:false,reuseEligible:false};}
const entryRefusal=()=>({schema:1,scope:'PROPOSAL_ONLY',result:'UNKNOWN',reason_code:'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED',sealed:false,reuseEligible:false});
const data=value=>JSON.stringify(value),closed={exitCode:1,signal:null,exitObserved:true,timedOut:false};
const reject=fn=>assert.throws(fn,error=>error.code==='STAGE_RESULT_INVALID'&&error.message==='STAGE_RESULT_INVALID');
const find=(v,name)=>v.checks.find(row=>row.name===name);
const finish=v=>{v.result=v.checks.some(row=>row.result==='FAIL')?'FAIL':'UNKNOWN';v.implemented_checks_passed=v.checks.filter(row=>row.attempted).every(row=>row.result==='PASS');return v;};
const failure=()=>{const v=good();Object.assign(find(v,'stage_file_write_denied'),{result:'FAIL',reason_code:'ACCESS_SUCCEEDED'});return finish(v);};
const falseAuthority=v=>{assert.equal(v.outcome==='PASS',false);assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.noInheritedWritableHandlesVerified,false);assert.equal(v.recordAdoptionAuthority,false);assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);};
function pureIO(){return{fixtureProbe:async()=>'FIXTURE_MATCHED',allowedWriteProbe:async()=>'ACCESS_SUCCEEDED',caseAliasProbe:async()=>'FIXTURE_MATCHED',caseWriteProbe:async()=>'DENIED_PERMISSION_ERROR',writeProbe:async()=>'DENIED_PERMISSION_ERROR',chmodProbe:async()=>'DENIED_PERMISSION_ERROR',unlinkProbe:async()=>'DENIED_PERMISSION_ERROR',renameProbe:async()=>'DENIED_PERMISSION_ERROR',parentReplacementProbe:async()=>'DENIED_PERMISSION_ERROR',hardlinkProbe:async()=>'DENIED_PERMISSION_ERROR',aliasWriteProbe:async()=>'DENIED_PERMISSION_ERROR',parentSymlinkProbe:async()=>'ACCESS_SUCCEEDED',parentSymlinkFixtureProbe:async()=>'FIXTURE_MATCHED',parentSymlinkWriteProbe:async()=>'DENIED_PERMISSION_ERROR',stageIntegrityProbe:async()=>'FIXTURE_MATCHED'};}
test('independent nominal 18-row fixture preserves exact missing assertions and never establishes native/global PASS',()=>{
 const v=parse(data(good()));assert.deepEqual(JSON.parse(JSON.stringify(v)),good());assert(Object.isFrozen(v.checks[0]));assert(Object.isFrozen(v.unperformed_assertions));
 const s=latch().observe(data(good()),closed);assert.equal(s.scope,'STAGE_RESULT_DATA_ONLY');assert.equal(s.outcome,'UNKNOWN');assert.equal(s.checkerResult,'UNKNOWN');assert.equal(s.implementedAssertionsOutcome,'ALL_IMPLEMENTED_ROWS_OBSERVED');assert.equal(s.lifecycleOutcome,'EXPECTED_CHILD_EXIT_1_OBSERVED');falseAuthority(s);
});
test('source pure report matches independent nominal fixture without invoking real checker IO',async()=>{assert.deepEqual(await pureReport(pureIO()),good());});
for(const at of [0,1])for(const [reason,result] of [['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['DENIED_PERMISSION_ERROR','FAIL'],['ASSERTION_FAILED','FAIL'],['FIXTURE_MATCHED','FAIL'],['ACCESS_SUCCEEDED','FAIL']]){
 if(at===0&&reason==='FIXTURE_MATCHED'||at===1&&reason==='ACCESS_SUCCEEDED')continue;
 test('exact prerequisite early exit '+at+'/'+reason,()=>{const v=good();v.checks=v.checks.slice(0,at+1);Object.assign(v.checks[at],{reason_code:reason,result});v.unperformed_assertions=['STAGE_OPERATIONS_PREREQUISITE_NOT_ESTABLISHED','MAP_SHARED_WRITABLE_MAPPING_DENIED'];finish(v);assert.equal(parse(data(v)).checks.length,at+1);assert.equal(latch().observe(data(v),closed).implementedAssertionsOutcome,result==='FAIL'?'FAIL':'UNKNOWN');
 const bad=structuredClone(v);bad.checks.push(same('case_alias_resolves_to_same_stage_canary'));reject(()=>parse(data(bad)));});
}
for(const [reason,result] of [['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['DENIED_PERMISSION_ERROR','FAIL'],['ASSERTION_FAILED','FAIL'],['ACCESS_SUCCEEDED','FAIL']])test('case alias '+reason+' requires an unattempted write and exact reason list',()=>{
 const v=good();Object.assign(find(v,'case_alias_resolves_to_same_stage_canary'),{reason_code:reason,result});v.checks[3]=notPerformed('stage_case_alias_write_denied');v.unperformed_assertions=[...mandatory,'CASE_ALIAS_PREREQUISITE_NOT_ESTABLISHED','NOT_PERFORMED_PREREQUISITE_DENIED'];finish(v);assert.equal(parse(data(v)).result,result==='FAIL'?'FAIL':'UNKNOWN');const bad=structuredClone(v);bad.checks[3]=denied('stage_case_alias_write_denied');reject(()=>parse(data(bad)));
});
for(const [reason,result] of [['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['ASSERTION_FAILED','FAIL'],['FIXTURE_MATCHED','FAIL']])test('hardlink '+reason+' must not claim alias denial or creation',()=>{
 const v=good();Object.assign(find(v,'outside_hardlink_creation_denied'),{reason_code:reason,result});v.checks[10]=notPerformed('write_through_created_alias_denied');v.unperformed_assertions=[...mandatory,'NOT_PERFORMED_PREREQUISITE_UNKNOWN'];finish(v);assert.equal(parse(data(v)).result,result==='FAIL'?'FAIL':'UNKNOWN');const bad=structuredClone(v);bad.checks[10]=denied('write_through_created_alias_denied');reject(()=>parse(data(bad)));
});
for(const [aliasReason,aliasResult] of [['DENIED_PERMISSION_ERROR','PASS'],['ACCESS_SUCCEEDED','FAIL'],['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['ASSERTION_FAILED','FAIL'],['FIXTURE_MATCHED','FAIL']])test('successful hardlink is FAIL and requires actual alias write '+aliasReason,()=>{
 const v=good();Object.assign(find(v,'outside_hardlink_creation_denied'),{reason_code:'ACCESS_SUCCEEDED',result:'FAIL'});v.checks[10]=row('write_through_created_alias_denied',aliasResult,aliasReason);v.unperformed_assertions=[...mandatory];finish(v);const s=latch().observe(data(v),closed);assert.equal(s.outcome,'FAIL');assert.equal(s.checks[9].reason_code,'ACCESS_SUCCEEDED');const bad=structuredClone(v);bad.checks[10]=notPerformed('write_through_created_alias_denied');reject(()=>parse(data(bad)));
});
for(const [reason,result] of [['DENIED_PERMISSION_ERROR','UNKNOWN'],['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['ASSERTION_FAILED','FAIL'],['FIXTURE_MATCHED','FAIL']])test('symlink creation '+reason+' yields 17 rows without a fabricated resolution probe',()=>{
 const v=good();Object.assign(find(v,'owned_workspace_parent_symlink_creation_control'),{reason_code:reason,result});v.checks.splice(12,1);v.checks[12]=notPerformed('stage_parent_symlink_alias_write_denied',reason==='DENIED_PERMISSION_ERROR'?'NOT_PERFORMED_PREREQUISITE_DENIED':'NOT_PERFORMED_PREREQUISITE_UNKNOWN');v.unperformed_assertions.push('PARENT_SYMLINK_ALIAS_PREREQUISITE_NOT_ESTABLISHED');finish(v);assert.equal(parse(data(v)).checks.length,17);const bad=structuredClone(v);bad.checks.splice(12,0,same('parent_symlink_resolves_to_same_stage_canary'));reject(()=>parse(data(bad)));
});
for(const [reason,result] of [['DENIED_PERMISSION_ERROR','FAIL'],['UNKNOWN_OR_UNAVAILABLE','UNKNOWN'],['ASSERTION_FAILED','FAIL'],['ACCESS_SUCCEEDED','FAIL']])test('symlink resolution '+reason+' keeps 18 rows but no alias write attempt',()=>{
 const v=good();Object.assign(find(v,'parent_symlink_resolves_to_same_stage_canary'),{reason_code:reason,result});v.checks[13]=notPerformed('stage_parent_symlink_alias_write_denied');v.unperformed_assertions.push('PARENT_SYMLINK_ALIAS_PREREQUISITE_NOT_ESTABLISHED');finish(v);assert.equal(parse(data(v)).result,result==='FAIL'?'FAIL':'UNKNOWN');const bad=structuredClone(v);bad.checks[13]=denied('stage_parent_symlink_alias_write_denied');reject(()=>parse(data(bad)));
});
for(const method of Object.keys(pureIO()))for(const reason of ['FIXTURE_MATCHED','ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','ASSERTION_FAILED','UNKNOWN_OR_UNAVAILABLE'])test('pure fixed checker branch remains understood '+method+'/'+reason,async()=>{
 const io=pureIO();io[method]=async()=>reason;if(method==='aliasWriteProbe')io.hardlinkProbe=async()=>'ACCESS_SUCCEEDED';const v=await pureReport(io);assert.deepEqual(JSON.parse(JSON.stringify(parse(data(v)))),v);assert.equal(latch().observe(data(v),closed).outcome,v.result);});
for(const errorCode of ['EPERM','EACCES','ENOENT','ELOOP','EXDEV','EIO','ETIMEDOUT','ENOSYS',undefined])test('errors remain checker classifications, never broadened OS denial '+errorCode,async()=>{
 const io=pureIO();io.writeProbe=async()=>{throw Object.assign(Error('PRIVATE_BODY'),{code:errorCode});};const v=await pureReport(io),parsed=parse(data(v));assert.equal(find(parsed,'stage_file_write_denied').reason_code,['EPERM','EACCES'].includes(errorCode)?'DENIED_PERMISSION_ERROR':'UNKNOWN_OR_UNAVAILABLE');assert(!JSON.stringify(parsed).includes('PRIVATE_BODY'));
});
test('exact unsupported route is separate UNKNOWN data and cannot become implemented/native evidence',()=>{
 const parsed=parse(data(entryRefusal()));assert.deepEqual(JSON.parse(JSON.stringify(parsed)),entryRefusal());const s=latch().observe(data(parsed),closed);assert.equal(s.checks,null);assert.equal(s.unperformedAssertions,null);assert.equal(s.implementedAssertionsOutcome,'UNKNOWN');assert.equal(s.reason_code,'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED');falseAuthority(s);
 for(const mutate of [v=>v.reason_code='OTHER',v=>v.result='FAIL',v=>v.result='PASS',v=>v.schema=2,v=>v.checks=[],v=>v.sealed=true,v=>v.reuseEligible=true]){const v=entryRefusal();mutate(v);reject(()=>parse(data(v)));}
});
test('strict UTF8, EOF, duplicate decoded keys, bounds and input type',()=>{
 for(const v of ['',data(good())+'x',data(good())+'\n'+data(good()),data(good()).replace('"schema":1','"schema":1,"schema":1'),data(good()).replace('"schema":1','"schema":1,"\\u0073chema":1'),Buffer.from([255]),Buffer.from([0xc0,0x80]),' '.repeat(8193),{},null,42,true,new DataView(new ArrayBuffer(1)),data(good()).replace('"UNKNOWN"','"\\ud800"')])reject(()=>parse(v));
 assert.equal(parse(Buffer.from(data(good())+'\n')).result,'UNKNOWN');assert.equal(parse(new Uint8Array(Buffer.from(data(good())))).result,'UNKNOWN');
});
for(const key of ['schema','scope','result','checks_passed','implemented_checks_passed','native_tool_boundary','real_credentials_opened','compiler_executions','model_actions_requested','network_actions_requested','sealed','reuseEligible'])test('each top-level contract field rejects unknown/contradictory '+key,()=>{
 const v=good();v[key]=key==='schema'?2:key==='scope'?'OTHER':key==='result'?'PASS':key==='native_tool_boundary'?'ESTABLISHED':key==='implemented_checks_passed'?false:true;reject(()=>parse(data(v)));
});
test('unknown/prototype keys never survive as data or invoke accessors',()=>{
 for(const key of ['__proto__','constructor','prototype','secret','private']){const v=JSON.parse(data(good()));Object.defineProperty(v,key,{value:'PRIVATE_BODY',enumerable:true});reject(()=>parse(data(v)));}
 let called=0;const v={get schema(){called++;throw Error('PRIVATE_BODY');}};reject(()=>parse(v));assert.equal(called,0);
});
for(const mutate of [v=>v.checks.pop(),v=>v.checks.reverse(),v=>v.checks.push(v.checks[0]),v=>v.checks[2].extra='PRIVATE_BODY',v=>v.checks[2].name='OTHER',v=>v.checks[2].reason_code='EPERM',v=>v.checks[2].attempted=false,v=>v.checks[2].attempted=1,v=>delete v.checks[2].result,v=>v.checks[15].result='PASS',v=>v.checks[15].attempted=true,v=>v.checks[15].reason_code='UNKNOWN_OR_UNAVAILABLE',v=>v.result='FAIL',v=>v.implemented_checks_passed=false,v=>v.unperformed_assertions.pop(),v=>v.unperformed_assertions.reverse(),v=>v.unperformed_assertions.push(v.unperformed_assertions[0]),v=>v.unperformed_assertions[0]='OTHER',v=>v.unperformed_assertions[0]={secret:'PRIVATE_BODY'}])test('row order/reason/attempt or exact missing list contradiction refuses '+String(mutate),()=>{const v=good();mutate(v);reject(()=>parse(data(v)));});
for(const life of [{exitCode:0,signal:null,exitObserved:true,timedOut:false},{exitCode:74,signal:null,exitObserved:true,timedOut:false},{...closed,exitObserved:false},{...closed,timedOut:true},{exitCode:null,signal:'SIGKILL',exitObserved:true,timedOut:false},{exitCode:null,signal:null,exitObserved:false,timedOut:false}])test('unexpected/incomplete lifecycle never completes implemented rows '+data(life),()=>{
 const v=latch().observe(data(good()),life);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.implementedAssertionsOutcome,'UNKNOWN');falseAuthority(v);
});
test('missing lifecycle or output stays UNKNOWN; cleanup alone cannot provide assertion evidence',()=>{
 const empty=latch().snapshot();assert.equal(empty.outcome,'UNKNOWN');assert.equal(empty.checks,null);assert.equal(empty.observations,0);falseAuthority(empty);
 const v=latch().observe(data(good()));assert.equal(v.implementedAssertionsOutcome,'UNKNOWN');assert.equal(v.reason_code,'LIFECYCLE_UNAVAILABLE');
 const missingOutput=latch().observe(undefined,closed);assert.equal(missingOutput.outcome,'UNKNOWN');assert.equal(missingOutput.checks,null);assert.equal(missingOutput.reason_code,'RESULT_INVALID');
 const extraCleanup=latch().observe(data(good()),{...closed,cleanupConfirmed:true});assert.equal(extraCleanup.reason_code,'LIFECYCLE_INVALID');assert.equal(extraCleanup.implementedAssertionsOutcome,'UNKNOWN');
});
test('lifecycle shape/accessor/prototype validation is read-only and redacted',()=>{
 let calls=0;const accessor={...closed};Object.defineProperty(accessor,'exitCode',{get(){calls++;throw Error('PRIVATE_BODY');},enumerable:true});
 for(const life of [accessor,Object.create(closed),{...closed,signal:'PRIVATE_BODY'},{...closed,signal:'SIGKILL'},{...closed,exitCode:256},{...closed,exitCode:-1},{...closed,exitCode:1.5},{...closed,exitObserved:1},{...closed,timedOut:null},{...closed,extra:'PRIVATE_BODY'}]){
  const v=latch().observe(data(failure()),life);assert.equal(v.outcome,'FAIL');assert.equal(v.reason_code,'LIFECYCLE_INVALID');assert(!JSON.stringify(v).includes('PRIVATE_BODY'));falseAuthority(v);
 }assert.equal(calls,0);
});
test('validated FAIL survives later malformed/partial/route/multiple reports and all lifecycle uncertainty',()=>{
 const state=latch();assert.equal(state.observe(data(failure()),closed).outcome,'FAIL');for(const [output,life] of [['{"result":"FAIL","private":"PRIVATE_BODY"}',{}],[undefined,undefined],[data(good()),{...closed,timedOut:true}],[data(entryRefusal()),{exitCode:null,signal:'SIGKILL',exitObserved:true,timedOut:false}]]){
  const s=state.observe(output,life);assert.equal(s.outcome,'FAIL');assert.equal(s.checkerResult,'FAIL');assert.equal(s.implementedAssertionsOutcome,'FAIL');assert.equal(find(s,'stage_file_write_denied').reason_code,'ACCESS_SUCCEEDED');assert.equal(s.observations,2);assert(!JSON.stringify(s).includes('PRIVATE_BODY'));falseAuthority(s);
 }assert.equal(state.snapshot().outcome,'FAIL');
});
test('known failed access remains FAIL when final integrity reports cleanup uncertainty',()=>{
 const v=failure();Object.assign(find(v,'stage_fixture_identity_and_bytes_preserved'),{result:'UNKNOWN',reason_code:'UNKNOWN_OR_UNAVAILABLE'});finish(v);const s=latch().observe(data(v),{exitCode:null,signal:null,exitObserved:false,timedOut:true});assert.equal(s.outcome,'FAIL');assert.equal(find(s,'stage_fixture_identity_and_bytes_preserved').result,'UNKNOWN');falseAuthority(s);
});
test('malformed or contradictory alleged FAIL never latches an assertion',()=>{
 for(const output of ['{"result":"FAIL"}',data(failure()).slice(0,-1),data(failure()).replace('"result":"FAIL"','"result":"UNKNOWN"')]){const s=latch().observe(output,closed);assert.equal(s.outcome,'UNKNOWN');assert.equal(s.checkerResult,null);assert.equal(s.checks,null);assert.equal(s.reason_code,'RESULT_INVALID');}
});
test('valid failure after earlier malformed output is retained without gaining lifecycle authority',()=>{
 const s=latch();s.observe('PRIVATE_BODY',closed);const v=s.observe(data(failure()),closed);assert.equal(v.outcome,'FAIL');assert.equal(v.implementedAssertionsOutcome,'FAIL');assert.equal(v.reason_code,'RESULT_INVALID');assert.equal(v.observations,2);falseAuthority(v);
});
test('duplicate nominal reports cannot masquerade as one native execution',()=>{
 const s=latch();s.observe(data(good()),closed);const v=s.observe(data(good()),closed);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.implementedAssertionsOutcome,'UNKNOWN');assert.equal(v.reason_code,'MULTIPLE_RESULTS');assert.equal(v.observations,2);assert(Object.isFrozen(v.checks[0]));falseAuthority(v);
});
for(const caseReason of ['FIXTURE_MATCHED','UNKNOWN_OR_UNAVAILABLE','ASSERTION_FAILED'])for(const linkReason of ['DENIED_PERMISSION_ERROR','ACCESS_SUCCEEDED','UNKNOWN_OR_UNAVAILABLE'])for(const symlinkReason of ['ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','ASSERTION_FAILED'])test('interacting control branches preserve exact order/missing-list '+caseReason+'/'+linkReason+'/'+symlinkReason,async()=>{
 const io=pureIO();io.caseAliasProbe=async()=>caseReason;io.hardlinkProbe=async()=>linkReason;io.parentSymlinkProbe=async()=>symlinkReason;const v=await pureReport(io);assert.equal(parse(data(v)).result,v.result);
 if(caseReason==='ASSERTION_FAILED'||linkReason==='ACCESS_SUCCEEDED'||symlinkReason==='ASSERTION_FAILED')assert.equal(v.result,'FAIL');else assert.equal(v.result,'UNKNOWN');
});
test('all required source protocol fields are mandatory and no route/report hybrid is accepted',()=>{
 for(const key of Object.keys(good())){const v=good();delete v[key];reject(()=>parse(data(v)));}
 for(const key of Object.keys(entryRefusal())){const v=entryRefusal();delete v[key];reject(()=>parse(data(v)));}
 const hybrid={...good(),scope:'PROPOSAL_ONLY',reason_code:'EXACT_REVIEWED_CHECKER_ROUTE_REQUIRED'};reject(()=>parse(data(hybrid)));
});
test('snapshot arrays/data cannot be mutated to erase a known failed assertion',()=>{
 const state=latch(),v=state.observe(data(failure()),closed);assert.throws(()=>{v.checks[4].result='PASS';},TypeError);assert.throws(()=>{v.unperformedAssertions.length=0;},TypeError);assert.throws(()=>{v.outcome='UNKNOWN';},TypeError);assert.equal(state.snapshot().outcome,'FAIL');
});
