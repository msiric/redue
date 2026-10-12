import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {renderNativeDiagnosticAssets,normalizedNativeDiagnosticAsset,nativeDiagnosticTemplateDigests,sha} from './acceptance/portable-native-diagnostic-assets.mjs';
import {buildDiagnosticSettings,nativeDiagnosticArgv,nativeDiagnosticEnvironment,createNativeDiagnosticTrace,sanitizeCollection,diagnosticOutcome,collectNativeDiagnostic,requireNativeDiagnosticActivation,requireDiagnosticWorkflow,PINNED_READONLY_BASH_HEADS,selectedStartupSourcesAbsent,classifyNativeRemoteSentinel,validateNativePostStartupSources,POST_REMOTE_SENTINEL_RULE} from './acceptance/portable-claude-diagnostic.mjs';
const bindings={base:'/private/tmp/redue-claude-diagnostic-Abc123',node:'/approved/runtime/bin/node'};
const plan=buildDiagnosticSettings({...bindings,native:'/approved/native/claude'});
const sessionID='12345678-1234-4234-8234-123456789abc';
const init={type:'system',subtype:'init',cwd:plan.assets.code,claude_code_version:'2.1.187',apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[],session_id:sessionID};
const id='toolu_01ABC123';
const assistant=input=>({type:'assistant',parent_tool_use_id:null,message:{id:'msg_1',role:'assistant',content:[{type:'tool_use',name:'Bash',id,input:input??{command:plan.command,timeout:15000}}]}});
const names=['custom_env_sentinel_absent','synthetic_protected_read_denied','synthetic_outside_write_denied','one_synthetic_socket_allowed','other_synthetic_socket_denied','owned_direct_loopback_denied'];
const expected=['ABSENT','DENIED_PERMISSION_ERROR','DENIED_PERMISSION_ERROR','EXPECTED_RESPONSE','DENIED_PERMISSION_ERROR','DENIED_PERMISSION_ERROR'];
function collection(passed=true,exit=passed?0:1){const rows=names.map((name,i)=>({name,passed:passed||i!==1,reason_code:!passed&&i===1?'ACCESS_SUCCEEDED':expected[i]}));
 return {scope:'CHECKER_COLLECTION_ONLY',checks:{checks_passed:passed,checks:rows},checker_exit_code:exit,checker_signal:null,exit_observation:'SUPERVISOR_CHILD_CLOSE_EVENT',timed_out:false};}
const result=(c=collection(),overrides={})=>({type:'user',parent_tool_use_id:null,message:{role:'user',content:[{type:'tool_result',tool_use_id:id,content:JSON.stringify(c),...overrides}]}});
const final={type:'result',num_turns:2,is_error:false,subtype:'success'};
const complete={nativeExit:0,nativeSignal:null,timedOut:false,controlsBefore:true,controlsAfter:true,sourceCurrent:true,probeDelta:[1,0,0],collectionMatches:true,reaped:true,cleanupComplete:true};
function trace(events=[init,assistant(),result(),final]){const t=createNativeDiagnosticTrace({command:plan.command,cwd:plan.assets.code});for(const e of events)t.consume(e);return t.snapshot();}

test('render changes only literal path/hash bindings of both reviewed assets',()=>{
 assert.deepEqual(nativeDiagnosticTemplateDigests,{checker:'e55a30e93e4658605d2a018fbda603426c085549d522d51d898e6f2a70e57e92',collector:'187b4a16b8663f5f206d30b76d107b5d6b5f16e882e828b49c5533c2dd5c8090'});
 for(const b of [bindings,{base:'/private/tmp/redue-claude-diagnostic-Zyx987',node:'/approved/other/bin/node'}]){
  const r=renderNativeDiagnosticAssets(b);
  assert.equal(sha(normalizedNativeDiagnosticAsset(r.checkerBytes,{...b,checkerSHA:r.checkerSHA})),nativeDiagnosticTemplateDigests.checker);
  assert.equal(sha(normalizedNativeDiagnosticAsset(r.collectorBytes,{...b,checkerSHA:r.checkerSHA})),nativeDiagnosticTemplateDigests.collector);
  assert.equal(r.checkerSHA,sha(r.checkerBytes));assert.ok(r.collectorBytes.toString().includes(r.checkerSHA));
  assert.equal(r.checkerBytes.toString().includes('/Users/'),false);
 }
 assert.throws(()=>renderNativeDiagnosticAssets({...bindings,node:"/bad/'/node"}));
 assert.throws(()=>renderNativeDiagnosticAssets({...bindings,base:'/private/tmp/arbitrary'}));
});
test('one exact Bash command, read-only code and parents, one socket, strict credentials and no wider grants',()=>{
 const s=plan.settings;assert.deepEqual(s.permissions.allow,[`Bash(${plan.command})`]);assert.deepEqual(s.sandbox.filesystem.allowWrite,[]);
 for(const file of [bindings.base,bindings.node,'/approved/runtime/bin','/approved/native/claude','/approved/native'])assert.ok(s.sandbox.filesystem.denyWrite.includes(file));
 assert.ok(s.sandbox.filesystem.denyRead.includes(plan.assets.host));assert.ok(s.sandbox.filesystem.denyRead.includes('~/Library/Keychains'));
 assert.deepEqual(s.sandbox.excludedCommands,[]);assert.equal(s.sandbox.failIfUnavailable,true);assert.equal(s.sandbox.allowUnsandboxedCommands,false);
 assert.deepEqual(s.sandbox.network.allowUnixSockets,[plan.assets.socket]);assert.deepEqual(s.sandbox.network.allowedDomains,[]);
 assert.equal(s.sandbox.network.allowAllUnixSockets,false);assert.equal(s.sandbox.network.allowLocalBinding,false);
 assert.ok(s.sandbox.credentials.envVars.some(v=>v.name==='CLAUDE_CODE_OAUTH_TOKEN'&&v.mode==='deny'));
 assert.deepEqual(s.enabledPlugins,{});assert.equal(s.disableAllHooks,true);
});
test('four turns, one text prompt and no queue/resume/background/bare/SDK activation',()=>{
 const argv=nativeDiagnosticArgv(plan);assert.equal(argv[argv.indexOf('--max-turns')+1],'4');
 assert.equal(argv[argv.indexOf('--setting-sources')+1],'');assert.equal(argv[argv.indexOf('--tools')+1],'Bash');
 assert.equal(argv[argv.indexOf('--output-format')+1],'stream-json');
 for(const arg of ['--input-format','--resume','--continue','--bare','--dangerously-skip-permissions','--plugin-dir','--agent'])assert.equal(argv.includes(arg),false);
 assert.throws(()=>requireNativeDiagnosticActivation({approved:true,localPassed:true,capacity:true}),{code:'DIAGNOSTIC_WORKFLOW_OR_CAPACITY'});
});
test('curated host env preserves proxies but cannot forward runner/GH/provider/preload credentials',()=>{
 // Inert lexical data only; no authentication-key value is put in a real process.
 const env={HOME:'/owner',PATH:'/usr/bin',RUNNER_TRACKING_ID:'nonsecret-owned-runner-marker',CLAUDE_CODE_OAUTH_TOKEN:'MOCK_DATA_ONLY_NOT_A_CREDENTIAL',GITHUB_TOKEN:'PRIVATE_CANARY',GH_TOKEN:'PRIVATE_CANARY',ACTIONS_RUNTIME_TOKEN:'PRIVATE_CANARY',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'PRIVATE_CANARY',HTTPS_PROXY:'https://proxy.example.test:443'};
 const projected=nativeDiagnosticEnvironment(env,{host:plan.assets.host});assert.equal(projected.HTTPS_PROXY,env.HTTPS_PROXY);assert.equal(projected.RUNNER_TRACKING_ID,env.RUNNER_TRACKING_ID);
 for(const k of ['GITHUB_TOKEN','GH_TOKEN','ACTIONS_RUNTIME_TOKEN','ACTIONS_ID_TOKEN_REQUEST_TOKEN'])assert.equal(Object.hasOwn(projected,k),false);
 assert.equal(projected.CLAUDE_CODE_OAUTH_TOKEN,env.CLAUDE_CODE_OAUTH_TOKEN);assert.equal(projected.DISABLE_UPDATES,'1');
 for(const key of ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_PROFILE','ANTHROPIC_CUSTOM_HEADERS','CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR','CLAUDE_BG_AUTH_SNAPSHOT_PATH','CLAUDE_CODE_USE_VERTEX','CLAUDE_SECURESTORAGE_CONFIG_DIR','NODE_OPTIONS','OPENSSL_CONF','DYLD_INSERT_LIBRARIES','BASH_ENV'])
  assert.throws(()=>nativeDiagnosticEnvironment({...env,[key]:''},{host:plan.assets.host}),{code:'DIAGNOSTIC_AUTH_OR_RUNTIME_OVERRIDE'});
 assert.throws(()=>nativeDiagnosticEnvironment({}, {host:plan.assets.host}),{code:'DIAGNOSTIC_OAUTH_MISSING'});
});
test('only actual assistant tool_use and matching native user tool_result qualifies, never model prose',()=>{
 const t=trace();assert.equal(diagnosticOutcome(t,complete).collection_status,'PASS');assert.equal(t.tool.id,t.result.id);
 const prose=trace([init,{type:'assistant',parent_tool_use_id:null,message:{id:'msg_1',role:'assistant',content:[{type:'text',text:JSON.stringify(collection())}]}},final]);
 assert.equal(diagnosticOutcome(prose,complete).collection_status,'UNKNOWN');
 assert.equal(trace([init,assistant(),result(collection(),{tool_use_id:'toolu_Wrong123'}),final]).error,'NATIVE_RESULT_ID');
 assert.equal(trace([init,assistant({command:'cat secret'}),result(),final]).error,'NATIVE_TOOL_SCOPE');
 assert.equal(trace([init,assistant({...assistant().message.content[0].input,dangerouslyDisableSandbox:true})]).error,'NATIVE_TOOL_SCOPE');
 assert.equal(trace([init,assistant(),assistant(),result(),final]).error,'NATIVE_TOOL_SCOPE');
});
test('wrong init, inherited API, plugin/MCP and turn excess are irreversible refusals',()=>{
 for(const bad of [{apiKeySource:'apiKey'},{tools:['Bash','Read']},{mcp_servers:[{name:'external'}]},{plugins:[{name:'external'}]},{claude_code_version:'2.1.146'},{cwd:'/elsewhere'}])
  assert.equal(diagnosticOutcome(trace([{...init,...bad},assistant(),result(),final]),complete).collection_status,'UNKNOWN');
 const turns=[init];for(let i=0;i<5;i++)turns.push({type:'assistant',parent_tool_use_id:null,message:{id:`msg_${i}`,role:'assistant',content:[]}});
 assert.equal(trace(turns).error,'NATIVE_TURN_LIMIT');assert.equal(trace([init,assistant(),result(),{...final,num_turns:5}]).error,'NATIVE_FINAL_RESULT');
});
test('negative rows and actual nonzero or signal survive lifecycle uncertainty',()=>{
 const failed=trace([init,assistant(),result(collection(false),{is_error:true}),final]);
 const completeFail=diagnosticOutcome(failed,complete);assert.equal(completeFail.collection_status,'FAIL');assert.equal(completeFail.assertion_outcome,'FAIL');assert.equal(completeFail.checker_exit_code,1);
 const unknown=diagnosticOutcome(failed,{...complete,reaped:false});assert.equal(unknown.collection_status,'UNKNOWN');assert.equal(unknown.assertion_outcome,'FAIL');assert.equal(unknown.checker_exit_code,1);
 assert.equal(diagnosticOutcome(trace([init,assistant(),result(collection(true,1)),final]),complete).collection_status,'FAIL');
 const signalled={...collection(),checker_exit_code:null,checker_signal:'SIGABRT'};assert.equal(sanitizeCollection(signalled).process_outcome,'SIGNALLED');
 assert.equal(diagnosticOutcome(trace([init,assistant(),result(signalled),final]),complete).collection_status,'UNKNOWN');
 assert.equal(sanitizeCollection({...collection(),checker_signal:'SIGKILL'}),null);assert.equal(sanitizeCollection({...collection(),checker_exit_code:false}),null);
});
test('missing/malformed outputs, changed source, closed controls, wrong protocol delta and failed cleanup never green',()=>{
 for(const bad of [null,[],{}, {...collection(),checks:{checks_passed:true,checks:[]}}, {...collection(),exit_observation:'MODEL_SAYS_EXIT_ZERO'}])assert.equal(sanitizeCollection(bad),null);
 for(const override of [{controlsBefore:false},{controlsAfter:false},{sourceCurrent:false},{probeDelta:[0,0,0]},{probeDelta:[1,1,0]},{collectionMatches:false},{reaped:false},{cleanupComplete:false},{timedOut:true},{nativeExit:1}])
  assert.equal(diagnosticOutcome(trace(),{...complete,...override}).collection_status,'UNKNOWN');
 assert.equal(diagnosticOutcome(trace([init,assistant(),final]),complete).collection_status,'UNKNOWN');
});
function mockChild(events,{exit=0,signal=null,hang=false}={}){
 const c=new EventEmitter();c.stdout=new PassThrough();c.stderr=new PassThrough();c.exitCode=null;c.signalCode=null;c.kills=[];
 c.kill=s=>{c.kills.push(s);c.signalCode=s;queueMicrotask(()=>c.emit('close',null,s));return true;};
 queueMicrotask(()=>{for(const event of events)c.stdout.write(typeof event==='string'?event:JSON.stringify(event)+'\n');if(!hang){c.exitCode=exit;c.signalCode=signal;c.emit('close',exit,signal);}});return c;
}
test('mock native child collection retains only sanitized stream and genuine mocked close classification',async()=>{
 const observed=await collectNativeDiagnostic(()=>mockChild([init,assistant(),result(),final]),{command:plan.command,cwd:plan.assets.code,timeoutMs:100,cleanupMs:20});
 assert.equal(observed.native_exit_observed,true);assert.equal(observed.owned_native_reaped,true);assert.equal(observed.native_exit_code,0);assert.equal(observed.trace.result.collection.checker_exit_code,0);
 assert.equal(observed.raw_stdout_retained,false);assert.equal(observed.raw_stderr_retained,false);assert.equal(JSON.stringify(observed).includes('MOCK_DATA'),false);
});
test('mock startup error, partial output, timeout and oversized output remain UNKNOWN',async()=>{
 const missing=await collectNativeDiagnostic(()=>{throw Error('PRIVATE_CANARY');},{command:plan.command,cwd:plan.assets.code,timeoutMs:20,cleanupMs:10});
 assert.equal(missing.trace.error,'NATIVE_START_FAILURE');assert.equal(missing.native_exit_observed,false);
 const partial=await collectNativeDiagnostic(()=>mockChild(['{"partial":']),{command:plan.command,cwd:plan.assets.code,timeoutMs:20,cleanupMs:10});assert.equal(partial.trace.error,'NATIVE_STREAM_INCOMPLETE');
 const large=await collectNativeDiagnostic(()=>mockChild(['x'.repeat(65537)]),{command:plan.command,cwd:plan.assets.code,timeoutMs:20,cleanupMs:10});assert.equal(large.trace.error,'NATIVE_STREAM_LIMIT');
 let c;const timeout=await collectNativeDiagnostic(()=>c=mockChild([],{hang:true}),{command:plan.command,cwd:plan.assets.code,timeoutMs:5,cleanupMs:20});assert.equal(timeout.timed_out,true);assert.equal(timeout.native_signal,'SIGTERM');assert.deepEqual(c.kills,['SIGTERM']);
 assert.equal(JSON.stringify(missing).includes('PRIVATE_CANARY'),false);
});

const source='a'.repeat(40);
const workflowEnv=()=>({GITHUB_ACTIONS:'true',GITHUB_RUN_ATTEMPT:'1',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'msiric/redue',GITHUB_REF:'refs/heads/dev/portable-claude-diagnostic',GITHUB_ACTOR:'msiric',REDUE_CHECKED_SOURCE:source,REDUE_CLAUDE_INCLUDED_DIAGNOSTIC_CAPACITY:'4-turn-120s-included-only'});
function ownerFact(){return {schema:1,scope:'OWNER_ATTESTED_PERSONAL_SUBSCRIPTION_NO_MANAGED_POLICY',owner:'msiric',repository:'msiric/redue',ref:'refs/heads/dev/portable-claude-diagnostic',source,native_sha256:'a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3',account_kind:'personal-pro',organization_membership:'none',applicable_managed_policy:'none',reviewed_at:new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),included_capacity:'4-turn-120s-included-only'};}
test('exact owner policy statement is conditional provenance, not boolean permission or empirical enforcement',()=>{
 const env={...workflowEnv(),REDUE_CLAUDE_ACCOUNT_POLICY_FACT:JSON.stringify(ownerFact())};
 const accepted=requireNativeDiagnosticActivation({env,source});assert.equal(accepted.provenance,'OWNER_STATEMENT_PROTECTED_WORKFLOW_INPUT');assert.match(accepted.digest,/^[a-f0-9]{64}$/);
 for(const fact of [null,[],true,{}, {...ownerFact(),account_kind:'team'}, {...ownerFact(),organization_membership:'enterprise'}, {...ownerFact(),applicable_managed_policy:'unknown'}, {...ownerFact(),source:'b'.repeat(40)}, {...ownerFact(),native_sha256:'b'.repeat(64)}, {...ownerFact(),reviewed_at:'2000-01-01T00:00:00Z'}, {...ownerFact(),approved:true}])
  assert.throws(()=>requireNativeDiagnosticActivation({env:{...env,REDUE_CLAUDE_ACCOUNT_POLICY_FACT:JSON.stringify(fact)},source}));
 assert.throws(()=>requireNativeDiagnosticActivation({env:workflowEnv(),source}),{code:'DIAGNOSTIC_OWNER_POLICY_FACT_MISSING'});
 for(const changed of [{GITHUB_RUN_ATTEMPT:undefined},{GITHUB_RUN_ATTEMPT:'2'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_REF:'refs/heads/main'},{GITHUB_ACTOR:'other'},{REDUE_CHECKED_SOURCE:'b'.repeat(40)},{REDUE_CLAUDE_INCLUDED_DIAGNOSTIC_CAPACITY:'unlimited'}])
  assert.throws(()=>requireDiagnosticWorkflow({...env,...changed},source),{code:'DIAGNOSTIC_WORKFLOW_OR_CAPACITY'});
});
test('mock malformed native trace stops and escalates promptly without waiting full execution budget',async()=>{
 const c=new EventEmitter();c.stdout=new PassThrough();c.stderr=new PassThrough();c.exitCode=null;c.signalCode=null;c.kills=[];
 c.kill=signal=>{c.kills.push(signal);if(signal==='SIGKILL'){c.signalCode=signal;queueMicrotask(()=>c.emit('close',null,signal));}return true;};
 queueMicrotask(()=>c.stdout.write('not-json\n'));
 const r=await collectNativeDiagnostic(()=>c,{command:plan.command,cwd:plan.assets.code,timeoutMs:1000,cleanupMs:20});
 assert.equal(r.trace.error,'NATIVE_STREAM_MALFORMED');assert.deepEqual(c.kills,['SIGTERM','SIGKILL']);assert.equal(r.owned_native_reaped,true);assert.ok(r.milliseconds<500);
 assert.equal(r.native_process_spawn_observed,false);
});

test('mock cancellation before launch creates no child; during launch reaps and never qualifies',async()=>{
 const first=new AbortController();first.abort();let calls=0;
 const denied=await collectNativeDiagnostic(()=>{calls++;throw Error();},{command:plan.command,cwd:plan.assets.code,timeoutMs:100,cleanupMs:20,signal:first.signal});
 assert.equal(calls,0);assert.equal(denied.trace.error,'NATIVE_CANCELLED');assert.equal(denied.native_process_spawn_observed,false);
 const live=new AbortController();let c;
 const pending=collectNativeDiagnostic(()=>c=mockChild([],{hang:true}),{command:plan.command,cwd:plan.assets.code,timeoutMs:100,cleanupMs:20,signal:live.signal});
 live.abort();const stopped=await pending;assert.equal(stopped.trace.error,'NATIVE_CANCELLED');assert.equal(stopped.owned_native_reaped,true);assert.deepEqual(c.kills,['SIGTERM']);
 assert.equal(diagnosticOutcome(stopped.trace,{...complete,nativeSignal:stopped.native_signal}).collection_status,'UNKNOWN');
});

test('native hook evidence and unknown system authority events irrevocably withhold PASS',()=>{
 for(const subtype of ['hook_started','hook_progress','hook_response','unknown_policy_event']){
  const t=trace([init,{type:'system',subtype,private_field:'PRIVATE_CANARY'},assistant(),result(),final]);
  assert.equal(t.error,subtype==='unknown_policy_event'?'NATIVE_SYSTEM_CONTEXT_UNKNOWN':'NATIVE_STARTUP_HOOK_OBSERVED');
  assert.equal(diagnosticOutcome(t,complete).collection_status,'UNKNOWN');assert.equal(JSON.stringify(t).includes('PRIVATE_CANARY'),false);
 }
});

test('rejected system event capture classifies only pinned static names and cannot admit events or leak values',()=>{
 for(const subtype of ['status','session_state_changed','turn_starting','notification','hook_started','PRIVATE_CANARY',null,{},'status\nPRIVATE_CANARY']){
  for(const beforeInit of [true,false]){
   const event={type:'system',subtype,status:'PRIVATE_CANARY',permissionMode:'PRIVATE_CANARY',text:'PRIVATE_CANARY',session_id:'PRIVATE_CANARY'};
   const t=trace([...(beforeInit?[]:[init]),event,init,assistant(),result(),final]);
   assert.deepEqual(t.rejected_system_event,{subtype_code:['status','session_state_changed','turn_starting','notification','hook_started'].includes(subtype)?subtype:'UNREVIEWED_SUBTYPE',phase:beforeInit?'BEFORE_VALIDATED_INIT':'AFTER_VALIDATED_INIT'});
   assert.equal(diagnosticOutcome(t,complete).collection_status,'UNKNOWN');
   assert.equal(JSON.stringify(t).includes('PRIVATE_CANARY'),false);
  }
 }
 const first=trace([init,{type:'system',subtype:'status'},{type:'system',subtype:'hook_started'}]);
 assert.equal(first.rejected_system_event.subtype_code,'status');
 assert.equal(first.error,'NATIVE_SYSTEM_CONTEXT_UNKNOWN');
 assert.equal(trace().rejected_system_event,null);
});

test('pinned native read-only families are explicitly denied before fallback without changing grants',()=>{
 const s=plan.settings;
 assert.deepEqual(s.permissions.allow,[`Bash(${plan.command})`]);
 assert.equal(new Set(PINNED_READONLY_BASH_HEADS).size,PINNED_READONLY_BASH_HEADS.length);
 for(const head of PINNED_READONLY_BASH_HEADS)assert.ok(s.permissions.deny.includes(`Bash(${head}:*)`));
 for(const head of ['cat','ls','pwd','git','docker','rg','sed','jq','xargs','[[','node','python','printf','sleep'])assert.ok(PINNED_READONLY_BASH_HEADS.includes(head));
 assert.equal(PINNED_READONLY_BASH_HEADS.some(head=>head.startsWith('/')||head==='*'),false);
 assert.ok(plan.command.startsWith("'/approved/runtime/bin/node' "));assert.equal(s.permissions.deny.includes(`Bash(${plan.command})`),false);
 assert.deepEqual(s.sandbox.network.allowUnixSockets,[plan.assets.socket]);assert.deepEqual(s.sandbox.filesystem.allowWrite,[]);
});

test('rejected API retry reports pinned categories and bounded protocol numbers without accepting retries',()=>{
 for(const error of ['overloaded','rate_limit','authentication_failed','server_error','unknown','PRIVATE_CANARY',null,{},'https://PRIVATE_CANARY']){
  const t=trace([init,{type:'system',subtype:'api_retry',attempt:1,max_retries:10,retry_delay_ms:500,error_status:401,error,private_field:'PRIVATE_CANARY'},assistant(),result(),final]);
  assert.deepEqual(t.rejected_system_event,{subtype_code:'api_retry',phase:'AFTER_VALIDATED_INIT',api_retry:{category:['overloaded','rate_limit','authentication_failed','server_error','unknown'].includes(error)?error:'UNREVIEWED_CATEGORY',http_status:401,attempt:1,max_retries:10,retry_delay_ms:500}});
  assert.equal(t.error,'NATIVE_SYSTEM_CONTEXT_UNKNOWN');assert.equal(diagnosticOutcome(t,complete).collection_status,'UNKNOWN');
  assert.equal(JSON.stringify(t).includes('PRIVATE_CANARY'),false);
 }
 for(const error_status of [null,{},'PRIVATE_CANARY',true,0,99,600,Infinity,NaN]){
  const t=trace([{type:'system',subtype:'api_retry',error:'unknown',error_status,attempt:'PRIVATE_CANARY',max_retries:1001,retry_delay_ms:-1}]);
  assert.deepEqual(t.rejected_system_event.api_retry,{category:'unknown',http_status:error_status===null?null:'UNAVAILABLE',attempt:'UNAVAILABLE',max_retries:'UNAVAILABLE',retry_delay_ms:'UNAVAILABLE'});
  assert.equal(t.rejected_system_event.phase,'BEFORE_VALIDATED_INIT');assert.equal(JSON.stringify(t).includes('PRIVATE_CANARY'),false);
 }
 const t=trace([init,{type:'system',subtype:'api_retry',error:'server_error',error_status:503,attempt:1,max_retries:2,retry_delay_ms:0},{type:'system',subtype:'api_retry',error:'authentication_failed',error_status:401,attempt:2,max_retries:2,retry_delay_ms:0}]);
 assert.equal(t.rejected_system_event.api_retry.http_status,503);
});

test('only exact bounded thinking progress in a validated native session is nonauthoritative transport data',()=>{
 const progress={type:'system',subtype:'thinking_tokens',estimated_tokens:2.5,estimated_tokens_delta:1.25,uuid:'87654321-1234-4234-8234-123456789abc',session_id:sessionID};
 const good=trace([init,progress,progress,assistant(),progress,result(),final]);
 assert.equal(good.thinking_progress_events,3);assert.equal(diagnosticOutcome(good,complete).collection_status,'PASS');
 assert.equal(Object.hasOwn(good,'estimated_tokens'),false);assert.equal(JSON.stringify(good).includes(sessionID),false);
 assert.equal(diagnosticOutcome(trace([init,progress,final]),complete).collection_status,'UNKNOWN');
 for(const bad of [{estimated_tokens:NaN},{estimated_tokens:Infinity},{estimated_tokens:-1},{estimated_tokens:1000001},{estimated_tokens:'PRIVATE_CANARY'},
  {estimated_tokens_delta:-1},{estimated_tokens_delta:3},{estimated_tokens_delta:null},{uuid:'PRIVATE_CANARY'}, {session_id:'PRIVATE_CANARY'},
  {session_id:'87654321-1234-4234-8234-123456789abc'}, {permissionMode:'PRIVATE_CANARY'},{extra:'PRIVATE_CANARY'}]){
  const t=trace([init,{...progress,...bad},assistant(),result(),final]);assert.equal(t.error,'NATIVE_SYSTEM_CONTEXT_UNKNOWN');
  assert.equal(diagnosticOutcome(t,complete).collection_status,'UNKNOWN');assert.equal(t.thinking_progress_events,0);assert.equal(JSON.stringify(t).includes('PRIVATE_CANARY'),false);
 }
 for(const events of [[progress,init,assistant(),result(),final],[{...init,session_id:undefined},progress,assistant(),result(),final],[init,assistant(),result(),final,progress],
  [init,{type:'system',subtype:'hook_started'},progress,assistant(),result(),final],[init,{type:'system',subtype:'api_retry'},progress,assistant(),result(),final]]){
  const t=trace(events);assert.equal(diagnosticOutcome(t,complete).collection_status,'UNKNOWN');assert.equal(t.thinking_progress_events,0);
 }
 const capped=trace([init,...Array(4097).fill(progress),assistant(),result(),final]);
 assert.equal(capped.thinking_progress_events,4096);assert.equal(capped.error,'NATIVE_SYSTEM_CONTEXT_UNKNOWN');assert.equal(diagnosticOutcome(capped,complete).collection_status,'UNKNOWN');
});

test('startup-source refusal reports only a fixed role without reading bodies or changing presence/error refusal',()=>{
 const original=fs.lstatSync,paths=[],roles=['SYSTEM_MANAGED_JSON','SYSTEM_MANAGED_DIRECTORY','SYSTEM_MANAGED_PLIST','USER_MANAGED_PLIST','ISOLATED_REMOTE_SETTINGS','ISOLATED_CREDENTIAL_STORE','PROJECT_CLAUDE_DIRECTORY','PROJECT_MCP_FILE','PROJECT_INSTRUCTION_FILE','REMOTE_API_KEY_PATH'];
 const missing=()=>{throw Object.assign(Error('PRIVATE_CANARY'),{code:'ENOENT'});};
 try{
  fs.lstatSync=file=>{paths.push(file);return missing();};assert.equal(selectedStartupSourcesAbsent(plan.assets),true);assert.equal(paths.length,10);
  for(let i=0;i<10;i++){
   let calls=0;fs.lstatSync=()=>{if(calls++===i)return {};return missing();};
   assert.throws(()=>selectedStartupSourcesAbsent(plan.assets),{code:'DIAGNOSTIC_STARTUP_SOURCE_PRESENT',startupSourceRole:roles[i]});assert.equal(calls,i+1);
   fs.lstatSync=()=>{throw Object.assign(Error('PRIVATE_CANARY'),{code:'EPERM'});};
   assert.throws(()=>selectedStartupSourcesAbsent(plan.assets),{code:'EPERM',startupSourceRole:roles[0]});
  }
 }finally{fs.lstatSync=original;}
});

test('empty remote-cache observation is exact and owned; nonempty/unsafe files receive no policy or gate authority',{skip:process.platform==='win32'?'Native macOS diagnostic POSIX filesystem control':false},()=>{
 const host=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-native-empty-cache-')));fs.chmodSync(host,0o700);
 const dir=path.join(host,'claude-config');fs.mkdirSync(dir,{mode:0o700});const file=path.join(dir,'remote-settings.json');
 const observed=[];const original=fs.readSync;
 try{
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');
  fs.writeFileSync(file,'{}',{mode:0o600});
  fs.readSync=(fd,buf,offset,length,pos)=>{observed.push(length);return original(fd,buf,offset,length,pos);};
  assert.equal(classifyNativeRemoteSentinel({host}),'EXACT_NATIVE_EMPTY_SENTINEL');assert.ok(observed.every(n=>n<=3));
  for(const bytes of ['','[]','  ','{ }','{}\n','{"env":{"TOKEN":"PRIVATE_CANARY"}}']){
   observed.length=0;fs.writeFileSync(file,bytes);assert.equal(classifyNativeRemoteSentinel({host}),'NOT_REVIEWED_EMPTY_SENTINEL');
   if(bytes.length!==2)assert.equal(observed.length,0);
  }
  fs.writeFileSync(file,'{}');fs.chmodSync(file,0o644);observed.length=0;assert.equal(classifyNativeRemoteSentinel({host}),'NOT_REVIEWED_EMPTY_SENTINEL');assert.equal(observed.length,0);
  fs.chmodSync(file,0o600);const linked=path.join(host,'link');fs.linkSync(file,linked);assert.equal(classifyNativeRemoteSentinel({host}),'NOT_REVIEWED_EMPTY_SENTINEL');fs.unlinkSync(linked);
  fs.unlinkSync(file);fs.symlinkSync(path.join(host,'MISSING_NONSECRET_TARGET'),file);observed.length=0;assert.equal(classifyNativeRemoteSentinel({host}),'NOT_REVIEWED_EMPTY_SENTINEL');assert.equal(observed.length,0);
  fs.unlinkSync(file);fs.mkdirSync(file);assert.equal(classifyNativeRemoteSentinel({host}),'NOT_REVIEWED_EMPTY_SENTINEL');
 }finally{fs.readSync=original;fs.rmSync(host,{recursive:true,force:true});}
});

test('post-native policy guard requires the exact negative sentinel and preserves every other source refusal',{skip:process.platform==='win32'?'Native macOS diagnostic POSIX filesystem control':false},()=>{
 const host=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-native-post-cache-')));fs.chmodSync(host,0o700);
 const dir=path.join(host,'claude-config');fs.mkdirSync(dir,{mode:0o700});const file=path.join(dir,'remote-settings.json'),code=path.join(host,'code');fs.mkdirSync(code,{mode:0o700});
 const original=fs.lstatSync,missing=()=>{throw Object.assign(Error('MOCK_MISSING'),{code:'ENOENT'});};
 const external=p=>p.startsWith('/Library/')||p.startsWith('/home/claude/');
 try{
  fs.lstatSync=p=>external(p)?missing():original(p);
  assert.throws(()=>validateNativePostStartupSources({host,code}),{code:'DIAGNOSTIC_REMOTE_POLICY_UNESTABLISHED',remoteCacheClass:'ABSENT'});
  fs.writeFileSync(file,'{}',{mode:0o600});
  assert.throws(()=>selectedStartupSourcesAbsent({host,code}),{code:'DIAGNOSTIC_STARTUP_SOURCE_PRESENT',startupSourceRole:'ISOLATED_REMOTE_SETTINGS'});
  assert.equal(validateNativePostStartupSources({host,code}),'EXACT_NATIVE_EMPTY_SENTINEL');assert.equal(POST_REMOTE_SENTINEL_RULE,'NATIVE187_FRESH_PRINT_ONE_FETCH_EMPTY_SENTINEL_V1');
  for(const [role,p] of [['SYSTEM_MANAGED_JSON','/Library/Application Support/ClaudeCode/managed-settings.json'],['SYSTEM_MANAGED_DIRECTORY','/Library/Application Support/ClaudeCode/managed-settings.d'],['SYSTEM_MANAGED_PLIST','/Library/Managed Preferences/com.anthropic.claudecode.plist'],['USER_MANAGED_PLIST',`/Library/Managed Preferences/${os.userInfo().username}/com.anthropic.claudecode.plist`],['REMOTE_API_KEY_PATH','/home/claude/.claude/remote/.api_key']]){
   fs.lstatSync=f=>f===p?{}:external(f)?missing():original(f);assert.throws(()=>validateNativePostStartupSources({host,code}),{code:'DIAGNOSTIC_STARTUP_SOURCE_PRESENT',startupSourceRole:role});
  }
  fs.lstatSync=p=>external(p)?missing():original(p);
  for(const [role,p] of [['ISOLATED_CREDENTIAL_STORE',path.join(dir,'.credentials.json')],['PROJECT_CLAUDE_DIRECTORY',path.join(code,'.claude')],['PROJECT_MCP_FILE',path.join(code,'.mcp.json')],['PROJECT_INSTRUCTION_FILE',path.join(code,'CLAUDE.md')]]){
   fs.writeFileSync(p,'NONSECRET_MOCK',{mode:0o600});assert.throws(()=>validateNativePostStartupSources({host,code}),{code:'DIAGNOSTIC_STARTUP_SOURCE_PRESENT',startupSourceRole:role});fs.unlinkSync(p);
  }
  for(const bytes of ['[]','  ','{ }','{}\n','{"permissions":{"allow":["Bash"]}}']){
   fs.writeFileSync(file,bytes);assert.throws(()=>validateNativePostStartupSources({host,code}),{code:'DIAGNOSTIC_STARTUP_SOURCE_PRESENT',startupSourceRole:'ISOLATED_REMOTE_SETTINGS',remoteCacheClass:'NOT_REVIEWED_EMPTY_SENTINEL'});
  }
 }finally{fs.lstatSync=original;fs.rmSync(host,{recursive:true,force:true});}
});


test('empty sentinel refuses replacement, growth, truncation and parent indirection',{skip:process.platform==='win32'?'Native macOS diagnostic POSIX filesystem control':false},()=>{
 const host=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-native-cache-race-')));fs.chmodSync(host,0o700);
 const dir=path.join(host,'claude-config');fs.mkdirSync(dir,{mode:0o700});const file=path.join(dir,'remote-settings.json');
 const originalRead=fs.readSync,originalStat=fs.fstatSync;
 try{
  fs.writeFileSync(file,'{}',{mode:0o600});let changed=false;
  fs.readSync=(...args)=>{if(!changed){changed=true;fs.appendFileSync(file,'X');}return originalRead(...args);};
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');fs.readSync=originalRead;
  fs.writeFileSync(file,'{}');changed=false;
  fs.readSync=(...args)=>{if(!changed){changed=true;fs.truncateSync(file,0);}return originalRead(...args);};
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');fs.readSync=originalRead;
  fs.writeFileSync(file,'{}');changed=false;
  fs.readSync=(...args)=>{if(!changed){changed=true;fs.renameSync(file,path.join(dir,'old'));fs.writeFileSync(file,'{}',{mode:0o600});}return originalRead(...args);};
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');fs.readSync=originalRead;
  fs.fstatSync=(...args)=>{const st=originalStat(...args);return Object.assign(Object.create(Object.getPrototypeOf(st)),st,{ino:st.ino+1});};
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');fs.fstatSync=originalStat;
  fs.renameSync(dir,path.join(host,'actual'));fs.symlinkSync(path.join(host,'actual'),dir);
  assert.equal(classifyNativeRemoteSentinel({host}),'UNKNOWN');
 }finally{fs.readSync=originalRead;fs.fstatSync=originalStat;fs.rmSync(host,{recursive:true,force:true});}
});
