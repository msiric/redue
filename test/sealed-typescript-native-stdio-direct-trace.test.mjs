// Mock/native-format source controls only. No build, native/helper/model, settings,
// secret, network, descriptor contents or actual enforcement operation runs.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {interpretDirectNativeStdioProbeTrace,interpretDirectNativeStartupWitnessTrace,NATIVE_STARTUP_WITNESS_DIRECT_INTERPRETATION,NATIVE_STDIO_DIRECT_INTERPRETATION,NATIVE_STDIO_FOREGROUND_SOURCE} from './acceptance/sealed-typescript-native-stdio-direct-trace.mjs';
import {nativeStdioDirectCommand,nativeStdioProbeCommand,parseNativeStdioMetadata,NATIVE_STDIO_SOURCE_SHA256} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
import {prepareDirectNativeStdioProbeCommand} from './acceptance/sealed-typescript-native-stdio-command.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './acceptance/sealed-typescript-closed-read-policy.mjs';
import {nativeDiagnosticArgv} from './acceptance/portable-claude-diagnostic.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-native-profile.mjs';
import {NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,NATIVE_STARTUP_WITNESS_FIELDS} from './acceptance/sealed-typescript-native-startup-witness.mjs';
import {parsePortableJson} from '../src/portable-envelope.mjs';
const hostBase='/private/tmp/redue-ci-recipient-01234567',command=nativeStdioDirectCommand(hostBase),cwd=hostBase+'/prefix/native-probes';
const session='12345678-1234-4234-8234-123456789abc',foreign='23456789-1234-4234-8234-123456789abc',id='toolu_01234567';
const binding={hostBase,helperSha256:'a'.repeat(64),sourceSha256:NATIVE_STDIO_SOURCE_SHA256,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256};
const completion={sourceCurrent:true,helperCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256,nativeSha256:binding.nativeSha256,nativeExit:0,nativeSignal:null,timedOut:false,reaped:true,startupPreconditions:true,noHooksCurrent:true,controlledShellStartup:true};
const metadata=()=>({schema:1,scope:'NATIVE_STDIO_METADATA_ONLY',pid:1234,dev_null:{lstat:'OK',type:'CHARACTER'},fd0_matches_dev_null:true,descriptors:[{fd:0,fstat:'OK',type:'CHARACTER',fcntl:'OK',access:'READ_ONLY'},{fd:1,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'},{fd:2,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'}]});
const clone=v=>JSON.parse(JSON.stringify(v));
function events(value=metadata()){
 const raw={stdout:JSON.stringify(value)+'\n',stderr:'',interrupted:false,isImage:false,noOutputExpected:false};
 return [{type:'system',subtype:'init',claude_code_version:'2.1.187',cwd,apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[],session_id:session},
  {type:'assistant',session_id:session,parent_tool_use_id:null,message:{role:'assistant',id:'msg_1',content:[{type:'tool_use',name:'Bash',id,input:{command,timeout:15000}}]}},
  {type:'user',session_id:session,parent_tool_use_id:null,uuid:'34567890-1234-4234-8234-123456789abc',timestamp:'2026-10-13T21:00:00.000Z',message:{role:'user',content:[{type:'tool_result',tool_use_id:id,content:raw.stdout.trimEnd(),is_error:false}]},tool_use_result:raw},
  {type:'result',session_id:session,subtype:'success',is_error:false,num_turns:2}];
}
const observe=(e=events(),b=binding,c=completion)=>interpretDirectNativeStdioProbeTrace(e,b,c);
function authority(v){assert.equal(v.scope,'SINGLE_DIRECT_NATIVE_STDIO_PRECONDITION_ONLY');assert.equal(v.interpretation,NATIVE_STDIO_DIRECT_INTERPRETATION);for(const k of ['sealed','reuseEligible'])assert.equal(v[k],false);for(const k of ['helperKernelClose','helperReap','helperSignal'])assert.equal(v[k],'NOT_OBSERVED');for(const k of ['nativeEnforcement','stdioOwnership','preMainLoader'])assert.equal(v[k],'NOT_ESTABLISHED');assert.equal(Object.hasOwn(v,'helperExitCode'),false);}

test('only exact direct command and actual raw/rendered native-format mock support source-derived zero',()=>{
 const v=observe();authority(v);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');assert.equal(v.exitInterpretationSource,REVIEWED_CLAUDE_NATIVE.sha256);assert.equal(v.toolUseId,id);assert.deepEqual(v.metadata,metadata());assert.equal(Object.hasOwn(v,'shellStatus'),false);
 assert(Object.isFrozen(v.metadata));assert(Object.isFrozen(v.metadata.descriptors[1]));assert.throws(()=>{v.metadata.descriptors[1].type='REGULAR';},TypeError);
 assert.equal(command,`'${hostBase}/prefix/native-probes/native-stdio-probe'`);assert.equal(command.includes('\n'),false);assert.notEqual(command,nativeStdioProbeCommand(hostBase));
 const module=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-direct-trace.mjs',import.meta.url),'utf8');assert.doesNotMatch(module,/interpretNativeStdioProbeTrace|NATIVE_STDIO_SHELL_STATUS_ONLY|spawn|execSync|readFile|process\.env/);
});
test('fixed public source digest table remains documentary data, not evaluated native code',()=>{
 assert.equal(NATIVE_STDIO_FOREGROUND_SOURCE.nativeSha256,REVIEWED_CLAUDE_NATIVE.sha256);assert(Object.isFrozen(NATIVE_STDIO_FOREGROUND_SOURCE));
 for(const [name,row] of Object.entries(NATIVE_STDIO_FOREGROUND_SOURCE)){if(name==='nativeSha256')continue;assert(Object.isFrozen(row));assert(Number.isInteger(row.offset)&&row.offset>0);assert(Number.isInteger(row.bytes)&&row.bytes>0);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
});
test('actual normal user frame timestamp and UUID are framing metadata, never freshness authority',()=>{
 const e=events();assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');e[2].isSynthetic=false;assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');
 e[2].timestamp='2000-01-01T00:00:00.000Z';assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE'); // No TTL or origin-freshness promise.
});
for(const value of [undefined,null,'','2026-10-13T21:00:00Z','2026-10-13T21:00:00.000+00:00','2026-02-30T00:00:00.000Z','2026-10-13T25:00:00.000Z','2026-10-13T21:00:00.000Z\n',0,{}])test('missing/noncanonical native timestamp is UNKNOWN',()=>{
 const e=events();if(value===undefined)delete e[2].timestamp;else e[2].timestamp=value;assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const value of [undefined,null,'','34567890-1234-4234-8234-123456789abc\n','34567890-1234-3234-8234-123456789abc','34567890-1234-4234-7234-123456789abc','34567890-1234-4234-8234-123456789ABC',0,{}])test('missing/noncanonical native random UUID is UNKNOWN',()=>{
 const e=events();if(value===undefined)delete e[2].uuid;else e[2].uuid=value;assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const value of [true,null,'false',0,{}])test('synthetic or unsupported native isSynthetic frame is UNKNOWN',()=>{
 const e=events();e[2].isSynthetic=value;assert.equal(observe(e).outcome,'UNKNOWN');
});
test('final newline cannot alias a literal base, digest, session or tool identity',()=>{
 assert.throws(()=>nativeStdioDirectCommand(hostBase+'\n'),/NATIVE_STDIO_BINDING_UNKNOWN/);
 assert.equal(observe(events(),{...binding,helperSha256:binding.helperSha256+'\n'},{...completion,helperSha256:binding.helperSha256+'\n'}).outcome,'UNKNOWN');
 let e=events();for(const row of e)row.session_id+='\n';assert.equal(observe(e).outcome,'UNKNOWN');
 e=events();e[1].message.content[0].id+='\n';e[2].message.content[0].tool_use_id+='\n';assert.equal(observe(e).outcome,'UNKNOWN');
});
test('strict parsed null-prototype JSON frames are accepted as data; no model callbacks',()=>{
 assert.equal(observe(parsePortableJson(JSON.stringify(events())),parsePortableJson(JSON.stringify(binding)),parsePortableJson(JSON.stringify(completion))).outcome,'OBSERVED_COMPATIBLE');
 let reads=0;const b={...binding};Object.defineProperty(b,'helperSha256',{get(){reads++;return binding.helperSha256;},enumerable:true});assert.equal(observe(events(),b).outcome,'UNKNOWN');assert.equal(reads,0);
});
for(const fd of [1,2])for(const type of ['REGULAR','SOCKET','CHARACTER','DIRECTORY','BLOCK','SYMLINK'])test(`actual ${fd} ${type} metadata is incompatible with unchanged FIFO campaign guard`,()=>{
 const row=metadata();row.descriptors[fd].type=type;const v=observe(events(row));authority(v);assert.equal(v.outcome,'OBSERVED_INCOMPATIBLE');assert.equal(v.metadata.descriptors[fd].type,type);assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');
});
test('source-predicted regular stdout/stderr is explicitly incompatible, not permission to repair endpoints',()=>{
 const row=metadata();row.descriptors[1].type='REGULAR';row.descriptors[2].type='REGULAR';assert.equal(observe(events(row)).outcome,'OBSERVED_INCOMPATIBLE');
});
for(const key of ['stdout','stderr','interrupted','isImage','noOutputExpected'])test(`missing normal call.data ${key} is UNKNOWN`,()=>{
 const e=events();delete e[2].tool_use_result[key];assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const [key,value] of Object.entries({backgroundTaskId:'TASK',backgroundedByUser:false,dangerouslyDisableSandbox:false,returnCodeInterpretation:'nonzero accepted',structuredContent:[],persistedOutputPath:'/unread/path',persistedOutputSize:123,staleReadFileStateHint:'HINT',ghRateLimitHint:'HINT',gitOperation:{},rawOutputPath:'/unread/raw',exitCode:0}))test(`optional/foreign ${key} field cannot borrow the normal completion rule`,()=>{
 const e=events();e[2].tool_use_result[key]=value;assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const [key,value] of Object.entries({stdout:'',stderr:'PRIVATE ERROR',interrupted:true,isImage:true,noOutputExpected:true}))test(`abandoned/special output ${key} cannot establish source-derived zero`,()=>{
 const e=events();e[2].tool_use_result[key]=value;const v=observe(e);assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(v).includes('PRIVATE ERROR'),false);
});
test('native error false, final/native exit0 or prose alone never supply a foreground completion',()=>{
 let e=events();delete e[2].tool_use_result;assert.equal(observe(e).outcome,'UNKNOWN');
 e=events();e[1].message.content=[{type:'text',text:JSON.stringify(metadata())}];e.splice(2,1);assert.equal(observe(e).outcome,'UNKNOWN');
 e=events();e[2].message.content[0].is_error=true;assert.equal(observe(e).outcome,'UNKNOWN');
 e=events();delete e[2].message.content[0].is_error;assert.equal(observe(e).outcome,'UNKNOWN');
});
test('exact native string renderer must match raw stdout; text arrays, prefixes and hook-updated output are refused',()=>{
 for(const content of ['', 'Exit code 74\n'+JSON.stringify(metadata()),JSON.stringify({...metadata(),pid:2345}),[{type:'text',text:JSON.stringify(metadata())}]]){const e=events();e[2].message.content[0].content=content;assert.equal(observe(e).outcome,'UNKNOWN');}
 const e=events();e[2].tool_use_result.stdout='\n\n'+e[2].tool_use_result.stdout+' \n';e[2].message.content[0].content=e[2].tool_use_result.stdout.replace(/^(\s*\n)+/,'').trimEnd();assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');
});
test('duplicate keys or multiple documents in raw/rendered output are UNKNOWN, never favorable last value',()=>{
 for(const raw of [JSON.stringify(metadata()).replace('"pid":1234','"pid":0,"pid":1234'),JSON.stringify(metadata()).replace('"pid":1234','"pid":0,"p\\u0069d":1234'),JSON.stringify(metadata())+'\n'+JSON.stringify(metadata()),JSON.stringify(metadata())+'\n{"status":0}',JSON.stringify(metadata()).slice(0,-5)]){
  const e=events();e[2].tool_use_result.stdout=raw;e[2].message.content[0].content=raw;assert.equal(observe(e).outcome,'UNKNOWN');assert.equal(parseNativeStdioMetadata(raw),null);
 }
});
for(const index of [1,2,3])for(const mode of ['missing','foreign'])test(`native event ${index} ${mode} session cannot bind`,()=>{
 const e=events();if(mode==='missing')delete e[index].session_id;else e[index].session_id=foreign;assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const change of [e=>e[0].claude_code_version='OTHER',e=>e[0].cwd='/other',e=>e[0].tools.push('Read'),e=>e[0].plugins.push({name:'other'}),e=>e[0].mcp_servers.push({name:'other'}),e=>e[0].apiKeySource='apiKey',e=>e[1].message.content[0].input.command=nativeStdioProbeCommand(hostBase),e=>e[1].message.content[0].input.command='node supervisor.mjs',e=>delete e[1].message.content[0].input.timeout,e=>e[1].message.content[0].input.timeout=15001,e=>e[1].message.content[0].input.description={},e=>e[1].message.content[0].input.run_in_background=false,e=>e[1].message.content[0].input.dangerouslyDisableSandbox=false,e=>e[2].parent_tool_use_id='subagent',e=>e[2].isReplay=false,e=>e[2].message.content[0].tool_use_id='toolu_foreign123',e=>e[3].num_turns=5,e=>e[3].subtype='error'])test('other product/command/context cannot use reviewed normal foreground interpretation',()=>{
 const e=events();change(e);assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const index of [0,1,2,3])test(`missing, duplicate or reordered event ${index} is incomplete`,()=>{
 let e=events();e.splice(index,1);assert.equal(observe(e).outcome,'UNKNOWN');e=events();e.splice(index+1,0,clone(e[index]));assert.equal(observe(e).outcome,'UNKNOWN');
});
test('after-final extra tool/result or unreviewed system output irreversibly refuses',()=>{
 const e=events();e.push(clone(e[1]));assert.equal(observe(e).outcome,'UNKNOWN');
 for(const subtype of ['hook_started','hook_response','permission_denied','api_retry']){const e=events();e.splice(1,0,{type:'system',subtype,session_id:session});assert.equal(observe(e).outcome,'UNKNOWN');}
});
for(const [key,value] of Object.entries({sourceCurrent:false,helperCurrent:false,reviewedBuildMatches:false,nativeCurrent:false,nativeExit:null,nativeSignal:'SIGKILL',timedOut:true,reaped:false,startupPreconditions:false,noHooksCurrent:false,controlledShellStartup:false,sourceSha256:'b'.repeat(64),helperSha256:'b'.repeat(64),nativeSha256:'b'.repeat(64)}))test(`missing actual external ${key} keeps mock metadata nonauthoritative`,()=>{
 const v=observe(events(),binding,{...completion,[key]:value});authority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);
});
test('missing/error metadata stays UNKNOWN while separately retaining narrowly derived command outcome',()=>{
 const row=metadata();row.dev_null={lstat:'EPERM',type:'UNKNOWN'};row.fd0_matches_dev_null=null;const v=observe(events(row));assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'DESCRIPTOR_METADATA_UNAVAILABLE');assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');authority(v);
});
test('forged build labels cannot construct a real native policy proposal',()=>{
 assert.throws(()=>prepareDirectNativeStdioProbeCommand({build:{hostBase},claudeExecutable:'/approved/native/claude',claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:'2.1.187'}),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);
});
test('direct-only mock proposal removes only marker command while retaining all security denials',()=>{
 const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-command.mjs',import.meta.url),'utf8'),build=Object.freeze({mockOnly:true}),observed={outcome:'BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',buildInterpretation:'redue-native-stdio-preauth-build@2',hostBase,helper:hostBase+'/prefix/native-probes/native-stdio-probe',cwd,sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256};
 const api=Function('verifyNativeStdioProbeBuild','nativeStdioProbeCommand','nativeStdioDirectCommand','NATIVE_STDIO_SOURCE_SHA256','NATIVE_STARTUP_WITNESS_SOURCE_SHA256','NATIVE_STARTUP_WITNESS_INTERPRETATION','prepareSealedTypeScriptClosedReadCanaryPolicy','nativeDiagnosticArgv',source.replace(/^import .*;$/gm,'').replaceAll('export function ','function ')+';return {direct:prepareDirectNativeStdioProbeCommand,old:prepareNativeStdioProbeCommand};')
 (value=>value===build?observed:{outcome:'UNKNOWN'},nativeStdioProbeCommand,nativeStdioDirectCommand,NATIVE_STDIO_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,prepareSealedTypeScriptClosedReadCanaryPolicy,nativeDiagnosticArgv);
 const options={build,claudeExecutable:'/approved/native/claude',claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:'2.1.187'},p=api.direct(options),old=api.old(options);
 assert.equal(p.command_proposed,command);assert.equal(old.command_proposed,nativeStdioProbeCommand(hostBase));assert.equal(p.inferencePermitted,false);assert.equal(p.disabled,true);assert.equal(p.sealed,false);assert.equal(p.reuseEligible,false);
 assert.deepEqual(p.settings_proposed.permissions.deny,old.settings_proposed.permissions.deny);assert(p.settings_proposed.permissions.deny.includes('Bash(printf:*)'));
 assert.deepEqual(p.settings_proposed.sandbox,old.settings_proposed.sandbox);assert.deepEqual(p.settings_proposed.permissions.allow,[`Bash(${command})`]);
 assert(p.blockers.includes('EXACT_SINGLE_DIRECT_BASH_ADMISSION_NOT_OBSERVED'));assert(p.blockers.includes('SOURCE_DERIVED_FOREGROUND_RAW_AND_RENDERED_RESULT_REQUIRED'));
 assert.equal(p.parent_timeout_ms_proposed,120000);assert.equal(p.tool_timeout_ms_proposed,15000);assert.equal(p.max_turns_proposed,4);assert.deepEqual(p.commands,[]);
});

const witnessBinding={...binding,sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION};
const witnessCompletion=()=>{const {controlledShellStartup,...c}=completion;return {...c,sourceSha256:NATIVE_STARTUP_WITNESS_SOURCE_SHA256,interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION};};
const witnessMetadata=()=>({...metadata(),scope:'NATIVE_CHILD_STARTUP_WITNESS_ONLY',startup:Object.fromEntries(NATIVE_STARTUP_WITNESS_FIELDS.map(k=>[k,true]))});
const witnessObserve=(e=events(witnessMetadata()),b=witnessBinding,c=witnessCompletion())=>interpretDirectNativeStartupWitnessTrace(e,b,c);
function witnessAuthority(v){assert.equal(v.scope,'SINGLE_DIRECT_NATIVE_CHILD_STARTUP_WITNESS_PRECONDITION_ONLY');assert.equal(v.interpretation,NATIVE_STARTUP_WITNESS_DIRECT_INTERPRETATION);for(const k of ['nativeEnforcement','preMainLoader','controlledShellStartup','pathHelperProcessing'])assert.equal(v[k],'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);}
test('witness actual-format mock child context/stdio can match only with separate exact source and live completion',()=>{
 const v=witnessObserve();witnessAuthority(v);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');assert.deepEqual(v.metadata,witnessMetadata());assert(Object.isFrozen(v.metadata.startup));
 assert.equal(observe(events(witnessMetadata()),witnessBinding,witnessCompletion()).outcome,'UNKNOWN');assert.equal(witnessObserve(events(),binding,completion).outcome,'UNKNOWN');
});
for(const field of NATIVE_STARTUP_WITNESS_FIELDS)test('witness child '+field+' mismatch is explicit incompatible, absent is unknown',()=>{
 const v=witnessMetadata();v.startup[field]=false;const r=witnessObserve(events(v));witnessAuthority(r);assert.equal(r.outcome,'OBSERVED_INCOMPATIBLE');
 delete v.startup[field];assert.equal(witnessObserve(events(v)).outcome,'UNKNOWN');
});
for(const field of ['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','startupPreconditions','noHooksCurrent','reaped'])test('witness missing or failed actual-current '+field+' is unknown',()=>{
 for(const value of [undefined,false]){const c=witnessCompletion();if(value===undefined)delete c[field];else c[field]=value;const v=witnessObserve(undefined,undefined,c);witnessAuthority(v);assert.equal(v.outcome,'UNKNOWN');}
});
test('witness original/unknown interpretation, extra global startup claim and forged native result remain unknown',()=>{
 for(const b of [{...witnessBinding,sourceSha256:NATIVE_STDIO_SOURCE_SHA256},{...witnessBinding,interpretation:'OTHER'},{...witnessBinding,interpretation:NATIVE_STARTUP_WITNESS_INTERPRETATION+'\n'}])assert.equal(witnessObserve(undefined,b).outcome,'UNKNOWN');
 for(const c of [{...witnessCompletion(),controlledShellStartup:true},{...witnessCompletion(),interpretation:'OTHER'},{...witnessCompletion(),nativeExit:74},{...witnessCompletion(),nativeSignal:'SIGKILL'}])assert.equal(witnessObserve(undefined,undefined,c).outcome,'UNKNOWN');
 const e=events(witnessMetadata());e[2].message.content[0].content='Model says startup passed';assert.equal(witnessObserve(e).outcome,'UNKNOWN');e[2].message.content[0].content=e[2].tool_use_result.stdout.trimEnd();e[2].tool_use_result.stderr='PRIVATE';const r=witnessObserve(e);assert.equal(r.outcome,'UNKNOWN');assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
});

test('witness accessor facts, missing interpretation and source-only startup statements supply no actual observations',()=>{
 let reads=0;const c=witnessCompletion();Object.defineProperty(c,'interpretation',{get(){reads++;return NATIVE_STARTUP_WITNESS_INTERPRETATION;},enumerable:true});assert.equal(witnessObserve(undefined,undefined,c).outcome,'UNKNOWN');assert.equal(reads,0);
 const b={...witnessBinding};delete b.interpretation;assert.equal(witnessObserve(undefined,b).outcome,'UNKNOWN');
 const d=witnessCompletion();delete d.interpretation;assert.equal(witnessObserve(undefined,undefined,d).outcome,'UNKNOWN');
 for(const field of ['helperSha256','sourceSha256','nativeSha256']){const d=witnessCompletion();d[field]='e'.repeat(64);assert.equal(witnessObserve(undefined,undefined,d).outcome,'UNKNOWN');}
 assert.equal(witnessObserve([]).outcome,'UNKNOWN');
 const e=events(witnessMetadata());e.push({type:'system',subtype:'hook_started',session_id:session});assert.equal(witnessObserve(e).outcome,'UNKNOWN');
});
