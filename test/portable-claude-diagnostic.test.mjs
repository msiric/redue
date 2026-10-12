import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {renderNativeDiagnosticAssets,normalizedNativeDiagnosticAsset,nativeDiagnosticTemplateDigests,sha} from './acceptance/portable-native-diagnostic-assets.mjs';
import {buildDiagnosticSettings,nativeDiagnosticArgv,nativeDiagnosticEnvironment,createNativeDiagnosticTrace,sanitizeCollection,diagnosticOutcome,collectNativeDiagnostic,requireNativeDiagnosticActivation,requireDiagnosticWorkflow} from './acceptance/portable-claude-diagnostic.mjs';
const bindings={base:'/private/tmp/redue-claude-diagnostic-Abc123',node:'/approved/runtime/bin/node'};
const plan=buildDiagnosticSettings({...bindings,native:'/approved/native/claude'});
const init={type:'system',subtype:'init',cwd:plan.assets.code,claude_code_version:'2.1.187',apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[]};
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
