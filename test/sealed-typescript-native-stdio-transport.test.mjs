// Transport/source-format MOCKS only. No C build/helper, native agent, model,
// credential, settings application or enforcement operation runs in this suite.
import test from 'node:test';import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';import {PassThrough} from 'node:stream';
import {collectDirectNativeStdioDiagnostic,interpretCollectedDirectNativeStdioDiagnostic,collectDirectNativeStartupWitnessDiagnostic,interpretCollectedDirectNativeStartupWitnessDiagnostic,collectExecNativeStartupWitnessDiagnostic,interpretCollectedExecNativeStartupWitnessDiagnostic} from './acceptance/portable-claude-diagnostic.mjs';
import {nativeStdioDirectCommand,NATIVE_STDIO_SOURCE_SHA256} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
import {NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,NATIVE_STARTUP_WITNESS_FIELDS,NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION,nativeExecStartupWitnessCommand} from './acceptance/sealed-typescript-native-startup-witness.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-native-profile.mjs';
const hostBase='/private/tmp/redue-ci-recipient-01234567',cwd=hostBase+'/prefix/native-probes',command=nativeStdioDirectCommand(hostBase);
const source='a'.repeat(40),session='12345678-1234-4234-8234-123456789abc',id='toolu_01234567';
const binding={hostBase,helperSha256:'b'.repeat(64),sourceSha256:NATIVE_STDIO_SOURCE_SHA256,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256};
const completion=()=>({sourceCurrent:true,helperCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256,nativeSha256:binding.nativeSha256,nativeExit:0,nativeSignal:null,timedOut:false,reaped:true,startupPreconditions:true,noHooksCurrent:true,controlledShellStartup:true});
function activation(){return {source,env:{GITHUB_ACTIONS:'true',GITHUB_RUN_ATTEMPT:'1',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'msiric/redue',GITHUB_REF:'refs/heads/dev/portable-claude-diagnostic',GITHUB_ACTOR:'msiric',REDUE_CHECKED_SOURCE:source,REDUE_CLAUDE_INCLUDED_DIAGNOSTIC_CAPACITY:'4-turn-120s-included-only',REDUE_CLAUDE_ACCOUNT_POLICY_FACT:JSON.stringify({schema:1,scope:'OWNER_ATTESTED_PERSONAL_SUBSCRIPTION_NO_MANAGED_POLICY',owner:'msiric',repository:'msiric/redue',ref:'refs/heads/dev/portable-claude-diagnostic',source,native_sha256:REVIEWED_CLAUDE_NATIVE.sha256,account_kind:'personal-pro',organization_membership:'none',applicable_managed_policy:'none',reviewed_at:new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),included_capacity:'4-turn-120s-included-only'})}};}
function frames(){
 const metadata={schema:1,scope:'NATIVE_STDIO_METADATA_ONLY',pid:1234,dev_null:{lstat:'OK',type:'CHARACTER'},fd0_matches_dev_null:true,descriptors:[{fd:0,fstat:'OK',type:'CHARACTER',fcntl:'OK',access:'READ_ONLY'},{fd:1,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'},{fd:2,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'}]};
 const raw={stdout:JSON.stringify(metadata)+'\n',stderr:'',interrupted:false,isImage:false,noOutputExpected:false};
 return [{type:'system',subtype:'init',claude_code_version:'2.1.187',cwd,apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[],session_id:session},
 {type:'assistant',session_id:session,parent_tool_use_id:null,message:{role:'assistant',id:'msg_1',content:[{type:'text',text:'PRIVATE_MODEL_CANARY'},{type:'tool_use',name:'Bash',id,input:{command,timeout:15000}}]}},
 {type:'user',session_id:session,parent_tool_use_id:null,uuid:'34567890-1234-4234-8234-123456789abc',timestamp:'2026-10-13T21:00:00.000Z',message:{role:'user',content:[{type:'tool_result',tool_use_id:id,content:raw.stdout.trimEnd(),is_error:false}]},tool_use_result:raw},
 {type:'result',session_id:session,subtype:'success',is_error:false,num_turns:2,total_cost_usd:0.00123}];
}
function child(events,{exit=0,signal=null,hang=false,stderr='',ignoreTerm=false,emitSpawn=true}={}){
 const c=new EventEmitter();c.stdout=new PassThrough();c.stderr=new PassThrough();c.exitCode=null;c.signalCode=null;c.kills=[];
 c.kill=s=>{c.kills.push(s);if(s==='SIGTERM'&&ignoreTerm)return true;c.signalCode=s;queueMicrotask(()=>c.emit('close',null,s));return true;};
 queueMicrotask(()=>{if(emitSpawn)c.emit('spawn');for(const e of events)c.stdout.write(typeof e==='string'||Buffer.isBuffer(e)?e:JSON.stringify(e)+'\n');if(stderr)c.stderr.write(stderr);if(!hang){c.exitCode=exit;c.signalCode=signal;c.emit('close',exit,signal);}});return c;
}
const collect=(events=frames(),opts={},extra={})=>collectDirectNativeStdioDiagnostic(()=>child(events,opts),{binding,activation:activation(),timeoutMs:100,cleanupMs:20,...extra});
const interpret=(collected,current=completion())=>interpretCollectedDirectNativeStdioDiagnostic(collected,current);
function noAuthority(v){assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);for(const k of ['nativeEnforcement','stdioOwnership','preMainLoader'])assert.equal(v[k],'NOT_ESTABLISHED');for(const k of ['helperKernelClose','helperReap','helperSignal'])assert.equal(v[k],'NOT_OBSERVED');}
test('fixed mock raw/native-format frames reach052B only after actual mocked outerclose and post-close facts',async()=>{
 const r=await collect();assert(Object.isFrozen(r));assert.equal(r.native_exit_code,0);assert.equal(r.native_exit_observed,true);assert.equal(r.owned_native_reaped,true);assert.equal(r.raw_frames_returned,false);assert.equal(r.raw_frames_persisted,false);assert.equal(r.transport_error,null);assert.equal(r.native_process_spawn_observed,true);assert.equal(r.sealed,false);assert.equal(r.reuseEligible,false);assert.equal(r.nativeEnforcement,'NOT_ESTABLISHED');
 assert.equal(JSON.stringify(r).includes('PRIVATE_MODEL_CANARY'),false);assert.equal(Object.hasOwn(r,'trace'),false);
 const v=interpret(r);noAuthority(v);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');assert.equal(JSON.stringify(v).includes('PRIVATE_MODEL_CANARY'),false);
 assert.equal(interpret(r).outcome,'UNKNOWN'); // Single-use, including successful consume.
});
test('source-predicted regular output descriptors remain incompatible, not repaired',async()=>{
 const e=frames();const m=JSON.parse(e[2].tool_use_result.stdout);m.descriptors[1].type='REGULAR';m.descriptors[2].type='REGULAR';e[2].tool_use_result.stdout=JSON.stringify(m);e[2].message.content[0].content=e[2].tool_use_result.stdout;
 const v=interpret(await collect(e));noAuthority(v);assert.equal(v.outcome,'OBSERVED_INCOMPATIBLE');
});
test('copied, serialized, foreign and missing collection objects cannot adopt private frames',async()=>{
 const r=await collect();for(const copied of [JSON.parse(JSON.stringify(r)),{...r},{},null,undefined])assert.equal(interpret(copied).outcome,'UNKNOWN');assert.equal(interpret(r).outcome,'OBSERVED_COMPATIBLE');
});
for(const key of ['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','startupPreconditions','noHooksCurrent','controlledShellStartup'])test(`missing/failed post-close ${key} irrevocably consumes context asUNKNOWN`,async()=>{
 for(const value of [undefined,false]){const r=await collect(),c=completion();if(value===undefined)delete c[key];else c[key]=value;const v=interpret(r,c);noAuthority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(interpret(r).outcome,'UNKNOWN');}
});
test('accessor-bearing external facts are not executed or accepted',async()=>{
 let reads=0;const c=completion();Object.defineProperty(c,'controlledShellStartup',{get(){reads++;return true;},enumerable:true});assert.equal(interpret(await collect(),c).outcome,'UNKNOWN');assert.equal(reads,0);
});
for(const [exit,signal] of [[1,null],[74,null],[null,'SIGTERM'],[0,'UNREVIEWED_SIGNAL'],[-1,null],[256,null],[0,'SIGKILL']])test(`actual mockclose ${exit}/${signal} cannot be overridden by completionJSON`,async()=>{
 const r=await collect(frames(),{exit,signal}),v=interpret(r,completion());noAuthority(v);assert.equal(v.outcome,'UNKNOWN');
});
for(const raw of ['{"partial":','not-json\n','x'.repeat(65537),Buffer.from([0xff,10])])test('partial/malformed/oversized/nonUTF8 stream staysredactedUNKNOWN',async()=>{
 const r=await collect([raw]),v=interpret(r);assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('not-json'),false);assert(r.transport_error);noAuthority(v);
});
for(const mutated of ['duplicate','escaped_duplicate'])test(`duplicate ${mutated} actualstream keys cannot be discarded by JSON.parse`,async()=>{
 const e=frames();const raw=JSON.stringify(e[2]).replace('"is_error":false',mutated==='duplicate'?'"is_error":true,"is_error":false':'"is_error":true,"is_err\\u006fr":false');e[2]=raw+'\n';const r=await collect(e);assert.equal(r.transport_error,'NATIVE_STREAM_MALFORMED');assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('integer/fractional/exponent incidental cost values and numeric strings preserve actualtrace semantics',async()=>{
 for(const cost of [1,0.123,1e-9]){const e=frames();e[3].total_cost_usd=cost;e[1].message.content[0].text='quoted key 12e4 \\" duplicate is_error 2.3';assert.equal(interpret(await collect(e)).outcome,'OBSERVED_COMPATIBLE');}
});
test('bounded frame count, stderr and stdout limits terminate withoutpublishing payloads',async()=>{
 for(const [events,opts,reason] of [[Array.from({length:65},()=>({type:'rate_limit_event'})),{},'NATIVE_FRAME_LIMIT'],[[],{stderr:'SECRET'.repeat(400000)},'NATIVE_STDERR_LIMIT'],[['x'.repeat(65537)],{},'NATIVE_STREAM_LIMIT']]){const r=await collect(events,opts);assert.equal(r.transport_error,reason);assert.equal(interpret(r).outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('SECRET'),false);}
});
test('timeout, kill escalation and cancellation use existing boundedownedchildcleanup',async()=>{
 let c;const r=await collectDirectNativeStdioDiagnostic(()=>c=child(frames(),{hang:true,ignoreTerm:true}),{binding,activation:activation(),timeoutMs:5,cleanupMs:30});assert.equal(r.timed_out,true);assert.equal(r.owned_native_reaped,true);assert.equal(r.native_exit_observed,true);assert.deepEqual(c.kills,['SIGTERM','SIGKILL']);assert.equal(interpret(r).outcome,'UNKNOWN'); // Actual mock close observed after escalation inside cleanup cap.
 const escalated=await collectDirectNativeStdioDiagnostic(()=>c=child(['not-json\n'],{hang:true,ignoreTerm:true}),{binding,activation:activation(),timeoutMs:100,cleanupMs:20});assert.equal(escalated.owned_native_reaped,true);assert.deepEqual(c.kills,['SIGTERM','SIGKILL']);assert.equal(interpret(escalated).outcome,'UNKNOWN');
 const early=new AbortController();early.abort();let launches=0;const skipped=await collectDirectNativeStdioDiagnostic(()=>{launches++;return child([]);},{binding,activation:activation(),timeoutMs:100,cleanupMs:20,signal:early.signal});assert.equal(launches,0);assert.equal(skipped.transport_error,'NATIVE_CANCELLED');assert.equal(interpret(skipped).outcome,'UNKNOWN');
 const live=new AbortController();const p=collectDirectNativeStdioDiagnostic(()=>child(frames(),{hang:true}),{binding,activation:activation(),timeoutMs:100,cleanupMs:20,signal:live.signal});live.abort();assert.equal(interpret(await p).outcome,'UNKNOWN');
});
test('startup throw, missing close and source-data-only labels never supply observation',async()=>{
 const r=await collectDirectNativeStdioDiagnostic(()=>{throw Error('PRIVATE_CANARY');},{binding,activation:activation(),timeoutMs:10,cleanupMs:5});assert.equal(r.native_exit_observed,false);assert.equal(r.owned_native_reaped,false);assert.equal(r.transport_error,'NATIVE_START_FAILURE');assert.equal(interpret(r).outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('PRIVATE_CANARY'),false);
 const missing=await collect([],{hang:true,ignoreTerm:true},{timeoutMs:5,cleanupMs:1});assert.equal(interpret(missing).outcome,'UNKNOWN');
});
test('invalid activation, identity, alternatecommand or limits launchzero mockedchildren',()=>{
 let launches=0;const create=()=>{launches++;return child([]);};
 const base={binding,activation:activation(),timeoutMs:100,cleanupMs:20};
 for(const override of [{binding:{}},{binding:{...binding,nativeSha256:'c'.repeat(64)}},{binding:{...binding,hostBase:hostBase+'\n'}},{activation:{}},{activation:{source,env:{}}},{activation:{...activation(),extra:true}},{command:'anything'},{argv:[]},{timeoutMs:120000},{cleanupMs:5001}])assert.throws(()=>collectDirectNativeStdioDiagnostic(create,{...base,...override}));
 assert.equal(launches,0);
});

test('activation accessors and symbols are refused without reading or launch',()=>{
 let reads=0,launches=0;const a=activation();Object.defineProperty(a,'source',{get(){reads++;return source;},enumerable:true});
 const create=()=>{launches++;return child([]);};assert.throws(()=>collectDirectNativeStdioDiagnostic(create,{binding,activation:a}));
 const b=activation();b[Symbol('extra')]='ignored';assert.throws(()=>collectDirectNativeStdioDiagnostic(create,{binding,activation:b}));assert.equal(reads,0);assert.equal(launches,0);
});
for(const [key,value] of [['command',command+' --other'],['command','echo PRIVATE_CANARY'],['timeout',15001],['timeout',undefined]])test(`mock tool ${key} outsidefixedroute staysUNKNOWN`,async()=>{
 const e=frames();if(value===undefined)delete e[1].message.content[1].input[key];else e[1].message.content[1].input[key]=value;const v=interpret(await collect(e));assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(v).includes('PRIVATE_CANARY'),false);noAuthority(v);
});
test('framing floats are accepted without admitting nonfinite trace semantics or duplicate fractional keys',async()=>{
 const e=frames();e[3]=JSON.stringify(e[3]).replace('0.00123','1e999')+'\n';assert.equal(interpret(await collect(e)).outcome,'UNKNOWN');
 const f=frames();f[3]=JSON.stringify(f[3]).replace('"total_cost_usd":0.00123','"total_cost_usd":1e-3,"total_cost_usd":1e-4')+'\n';const r=await collect(f);assert.equal(r.transport_error,'NATIVE_STREAM_MALFORMED');assert.equal(interpret(r).outcome,'UNKNOWN');
});

test('missing outerspawn and nonempty discarded outerstderr cannot establish nativecompletion',async()=>{
 const absent=await collect(frames(),{emitSpawn:false});assert.equal(absent.transport_error,'NATIVE_SPAWN_NOT_OBSERVED');assert.equal(interpret(absent).outcome,'UNKNOWN');
 const warning=await collect(frames(),{stderr:'PRIVATE_NATIVE_WARNING'});assert.equal(warning.transport_error,'NATIVE_STDERR_PRESENT');assert.equal(interpret(warning).outcome,'UNKNOWN');assert.equal(JSON.stringify(warning).includes('PRIVATE_NATIVE_WARNING'),false);
});

// Delays below are explicit event-loop fault injection, never economics evidence.
const blockFor=ms=>{const until=performance.now()+ms;while(performance.now()<until){}};
for(const cleanupMs of [1,2,5,30,500])test(`supported cleanup${cleanupMs}ms performs forcekill before completion`,async()=>{
 let c;const r=await collectDirectNativeStdioDiagnostic(()=>c=child(frames(),{hang:true,ignoreTerm:true}),{binding,activation:activation(),timeoutMs:5,cleanupMs});assert.equal(r.timed_out,true);assert(c.kills.includes('SIGTERM'));assert(c.kills.includes('SIGKILL'));assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('delayedcreate and closemicrotask cannot defeat the actual monotonic work deadline',async()=>{
 const r=await collectDirectNativeStdioDiagnostic(()=>{blockFor(40);return child(frames());},{binding,activation:activation(),timeoutMs:5,cleanupMs:30});assert(r.milliseconds>=40);assert.equal(r.timed_out,true);assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('eventloop delay before completed close also latches elapsed work deadline',async()=>{
 const r=await collectDirectNativeStdioDiagnostic(()=>{const c=child(frames());c.prependListener('close',()=>blockFor(30));return c;},{binding,activation:activation(),timeoutMs:5,cleanupMs:30});assert(r.milliseconds>=30);assert.equal(r.timed_out,true);assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('forcedkill without actual close stays unreapedUNKNOWN despite attempted cleanup',async()=>{
 let c;const r=await collectDirectNativeStdioDiagnostic(()=>{c=child([],{hang:true});c.kill=s=>{c.kills.push(s);return true;};return c;},{binding,activation:activation(),timeoutMs:5,cleanupMs:5});assert(c.kills.includes('SIGKILL'));assert.equal(r.owned_native_reaped,false);assert.equal(r.native_exit_observed,false);assert.equal(r.native_exit_code,null);assert.equal(r.native_signal,null);assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('cancellation inside create cannot strand the subsequently returned owned child',async()=>{
 const abort=new AbortController();let c;const r=await collectDirectNativeStdioDiagnostic(()=>{abort.abort();return c=child(frames(),{hang:true,ignoreTerm:true});},{binding,activation:activation(),timeoutMs:100,cleanupMs:20,signal:abort.signal});assert(c.kills.includes('SIGKILL'));assert.equal(r.transport_error,'NATIVE_CANCELLED');assert.equal(interpret(r).outcome,'UNKNOWN');
});
test('spawnerror waits for actual close or bounded forcekill, not invented reaping',async()=>{
 let c;const r=await collectDirectNativeStdioDiagnostic(()=>{c=child([],{hang:true,ignoreTerm:true});queueMicrotask(()=>c.emit('error',Error('PRIVATE_START_ERROR')));return c;},{binding,activation:activation(),timeoutMs:100,cleanupMs:20});assert.deepEqual(c.kills,['SIGTERM','SIGKILL']);assert.equal(r.owned_native_reaped,true);assert.equal(r.transport_error,'NATIVE_START_FAILURE');assert.equal(interpret(r).outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('PRIVATE_START_ERROR'),false);
});

test('invalid monotonicclock beforecreate launcheszero children and remainsUNKNOWN',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'performance');let calls=0;
 try{Object.defineProperty(globalThis,'performance',{value:{now:()=>NaN},configurable:true});const r=await collectDirectNativeStdioDiagnostic(()=>{calls++;return child([]);},{binding,activation:activation(),timeoutMs:100,cleanupMs:20});assert.equal(calls,0);assert.equal(r.transport_error,'NATIVE_CLOCK_UNKNOWN');assert.equal(r.timed_out,true);assert.equal(r.milliseconds,null);assert.equal(interpret(r).outcome,'UNKNOWN');}
 finally{Object.defineProperty(globalThis,'performance',original);}
});
test('nonmonotonicclock aftercreate irrevocably latchesUNKNOWN',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'performance');let reads=0;
 try{Object.defineProperty(globalThis,'performance',{value:{now:()=>++reads<3?reads:-1},configurable:true});const r=await collect();assert.equal(r.transport_error,'NATIVE_CLOCK_UNKNOWN');assert.equal(r.timed_out,true);assert.equal(r.milliseconds,null);assert.equal(interpret(r).outcome,'UNKNOWN');}
 finally{Object.defineProperty(globalThis,'performance',original);}
});

const witnessBinding={...binding,sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION};
function witnessFrames(){const e=frames(),m=JSON.parse(e[2].tool_use_result.stdout);m.scope='NATIVE_CHILD_STARTUP_WITNESS_ONLY';m.startup=Object.fromEntries(NATIVE_STARTUP_WITNESS_FIELDS.map(k=>[k,true]));e[2].tool_use_result.stdout=JSON.stringify(m)+'\n';e[2].message.content[0].content=e[2].tool_use_result.stdout.trimEnd();return e;}
const witnessCompletion=()=>{const {controlledShellStartup,...c}=completion();return {...c,sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION};};
const witnessCollect=(e=witnessFrames(),opts={},extra={})=>collectDirectNativeStartupWitnessDiagnostic(()=>child(e,opts),{binding:witnessBinding,activation:activation(),timeoutMs:100,cleanupMs:20,...extra});
const witnessInterpret=(r,c=witnessCompletion())=>interpretCollectedDirectNativeStartupWitnessDiagnostic(r,c);
test('witness private mock collection has separate source contract, authenticating foreground-format checks and no global startup authority',async()=>{
 const r=await witnessCollect(),v=witnessInterpret(r);noAuthority(v);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.controlledShellStartup,'NOT_ESTABLISHED');assert.equal(v.pathHelperProcessing,'NOT_ESTABLISHED');assert.equal(v.metadata.startup.home_matches,true);assert.equal(witnessInterpret(r).outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('PRIVATE_MODEL_CANARY'),false);
});
test('old/witness private collections cannot cross-adopt and attempted adoption consumes records',async()=>{
 const w=await witnessCollect();assert.equal(interpret(w).reason,'COLLECTED_NATIVE_CONTRACT_MISMATCH');assert.equal(witnessInterpret(w).outcome,'UNKNOWN');
 const old=await collect();assert.equal(witnessInterpret(old).reason,'COLLECTED_NATIVE_CONTRACT_MISMATCH');assert.equal(interpret(old).outcome,'UNKNOWN');
});
test('witness copied collection or JSON facts cannot manufacture live private observations',async()=>{
 const r=await witnessCollect();for(const v of [{...r},JSON.parse(JSON.stringify(r)),{},null])assert.equal(witnessInterpret(v).outcome,'UNKNOWN');assert.equal(witnessInterpret(r).outcome,'OBSERVED_COMPATIBLE');
});
for(const key of NATIVE_STARTUP_WITNESS_FIELDS)test('witness collected child '+key+' false remains incompatible',async()=>{
 const e=witnessFrames(),m=JSON.parse(e[2].tool_use_result.stdout);m.startup[key]=false;e[2].tool_use_result.stdout=JSON.stringify(m);e[2].message.content[0].content=e[2].tool_use_result.stdout;
 const v=witnessInterpret(await witnessCollect(e));assert.equal(v.outcome,'OBSERVED_INCOMPATIBLE');noAuthority(v);
});
test('witness old source, old completion/global true, malformed raw output and lifecycle loss cannot gain compatibility',async()=>{
 let launches=0;assert.throws(()=>collectDirectNativeStartupWitnessDiagnostic(()=>{launches++;return child([]);},{binding,activation:activation()}));assert.throws(()=>collectDirectNativeStdioDiagnostic(()=>{launches++;return child([]);},{binding:witnessBinding,activation:activation()}));assert.equal(launches,0);
 for(const c of [completion(),{...witnessCompletion(),controlledShellStartup:true},{...witnessCompletion(),sourceCurrent:false},{...witnessCompletion(),noHooksCurrent:false}])assert.equal(witnessInterpret(await witnessCollect(),c).outcome,'UNKNOWN');
 for(const opts of [{emitSpawn:false},{exit:74},{signal:'SIGKILL'},{stderr:'PRIVATE_SECRET'}]){const v=witnessInterpret(await witnessCollect(undefined,opts));assert.equal(v.outcome,'UNKNOWN');noAuthority(v);assert.equal(JSON.stringify(v).includes('PRIVATE_SECRET'),false);}
 const e=witnessFrames();e[2].tool_use_result.stdout='{"schema":';assert.equal(witnessInterpret(await witnessCollect(e)).outcome,'UNKNOWN');
});
test('witness source-only labels cannot bypass cancellation or actual native close',async()=>{
 const abort=new AbortController();abort.abort();let launches=0;
 const r=await collectDirectNativeStartupWitnessDiagnostic(()=>{launches++;return child([]);},{binding:witnessBinding,activation:activation(),signal:abort.signal,timeoutMs:5,cleanupMs:5});assert.equal(launches,0);assert.equal(witnessInterpret(r).outcome,'UNKNOWN');
 const t=await witnessCollect(undefined,{hang:true,ignoreTerm:true},{timeoutMs:5,cleanupMs:5});assert.equal(t.timed_out,true);assert.equal(witnessInterpret(t).outcome,'UNKNOWN');
});

const execBinding={...witnessBinding,interpretation:NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION};
const execFrames=()=>{const e=witnessFrames();e[1].message.content[1].input.command=nativeExecStartupWitnessCommand(hostBase);return e;};
const execCompletion=()=>({...witnessCompletion(),interpretation:NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION});
const execCollect=(e=execFrames(),opts={},extra={})=>collectExecNativeStartupWitnessDiagnostic(()=>child(e,opts),{binding:execBinding,activation:activation(),timeoutMs:100,cleanupMs:20,...extra});
const execInterpret=(r,c=execCompletion())=>interpretCollectedExecNativeStartupWitnessDiagnostic(r,c);
test('exec fixed private collection cannot adopt old source/command/interpretation or be adopted by historical collectors',async()=>{
 const r=await execCollect(),v=execInterpret(r);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');noAuthority(v);assert.equal(execInterpret(r).outcome,'UNKNOWN');
 for(const [create,consume,retry]of [[execCollect,interpret,execInterpret],[execCollect,witnessInterpret,execInterpret],[collect,execInterpret,interpret],[witnessCollect,execInterpret,witnessInterpret]]){const r=await create();assert.equal(consume(r).reason,'COLLECTED_NATIVE_CONTRACT_MISMATCH');assert.equal(retry(r).outcome,'UNKNOWN');}
 let calls=0;for(const b of [binding,witnessBinding])assert.throws(()=>collectExecNativeStartupWitnessDiagnostic(()=>{calls++;return child([]);},{binding:b,activation:activation()}));assert.equal(calls,0);
 assert.equal(execInterpret(await execCollect(witnessFrames())).outcome,'UNKNOWN');assert.equal(execInterpret(await execCollect(),witnessCompletion()).outcome,'UNKNOWN');
});
test('exec mock transport retains strict foreground/raw/lifecycle and single-use private disposal',async()=>{
 for(const opts of [{exit:7},{signal:'SIGTERM'},{emitSpawn:false},{stderr:'PRIVATE'}])assert.equal(execInterpret(await execCollect(undefined,opts)).outcome,'UNKNOWN');
 const e=execFrames();e[2].tool_use_result='Error: Exit code 0';assert.equal(execInterpret(await execCollect(e)).outcome,'UNKNOWN');
 const r=await execCollect();for(const copy of [{...r},JSON.parse(JSON.stringify(r)),{},null])assert.equal(execInterpret(copy).outcome,'UNKNOWN');assert.equal(execInterpret(r).outcome,'OBSERVED_COMPATIBLE');
 const abort=new AbortController();abort.abort();let calls=0;const cancelled=await collectExecNativeStartupWitnessDiagnostic(()=>{calls++;return child([]);},{binding:execBinding,activation:activation(),signal:abort.signal,timeoutMs:5,cleanupMs:5});assert.equal(calls,0);assert.equal(execInterpret(cancelled).outcome,'UNKNOWN');
});
