// Mock/native-format source controls only. No build, native/helper/model, settings,
// secret, network, descriptor contents or actual enforcement operation runs.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {interpretDirectNativeStdioProbeTrace,interpretDirectNativeStartupWitnessTrace,NATIVE_STARTUP_WITNESS_DIRECT_INTERPRETATION,NATIVE_STDIO_DIRECT_INTERPRETATION,NATIVE_STDIO_FOREGROUND_SOURCE,interpretExecNativeStartupWitnessTrace,NATIVE_EXEC_STARTUP_WITNESS_DIRECT_INTERPRETATION} from './acceptance/sealed-typescript-native-stdio-direct-trace.mjs';
import {nativeStdioDirectCommand,nativeStdioProbeCommand,parseNativeStdioMetadata,isNativeStdioDiagnosticData,NATIVE_STDIO_SOURCE_SHA256} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
import {prepareDirectNativeStdioProbeCommand} from './acceptance/sealed-typescript-native-stdio-command.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './acceptance/sealed-typescript-closed-read-policy.mjs';
import {nativeDiagnosticArgv} from './acceptance/portable-claude-diagnostic.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-native-profile.mjs';
import {parseNativeStartupWitness,NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,NATIVE_STARTUP_WITNESS_FIELDS,NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION,nativeExecStartupWitnessCommand} from './acceptance/sealed-typescript-native-startup-witness.mjs';
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

const toolRefusalCases=[
 ['TOOL_NAME_MISMATCH',item=>item.name='PRIVATE_TOOL_NAME'],
 ['TOOL_ID_SHAPE',item=>item.id='PRIVATE_TOOL_ID'],
 ['INPUT_ABSENT',item=>item.input=null],
 ['INPUT_NOT_OBJECT',item=>item.input='PRIVATE_INPUT_VALUE'],
 ['INPUT_ARRAY',item=>item.input=[]],
 ['COMMAND_MISMATCH',item=>item.input.command='PRIVATE_COMMAND_VALUE'],
 ['INPUT_EXTRA_KEYS',item=>item.input.PRIVATE_KEY='PRIVATE_KEY_VALUE'],
 ['TIMEOUT_MISSING',item=>delete item.input.timeout],
 ['TIMEOUT_NOT_INTEGER',item=>item.input.timeout='PRIVATE_TIMEOUT_VALUE'],
 ['TIMEOUT_BELOW_MINIMUM',item=>item.input.timeout=0],
 ['TIMEOUT_ABOVE_MAXIMUM',item=>item.input.timeout=15001],
 ['DESCRIPTION_NOT_STRING',item=>item.input.description={value:'PRIVATE_DESCRIPTION_VALUE'}]
];
for(const witness of [false,true])for(const [classification,mutate]of toolRefusalCases)test('first fixed tool refusal '+classification+' '+(witness?'witness':'old'),()=>{
 const e=events(witness?witnessMetadata():metadata());mutate(e[1].message.content[0]);const v=witness?witnessObserve(e):observe(e);
 assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'NATIVE_TOOL_SCOPE');assert.deepEqual(v.toolScopeRefusal,{schema:1,scope:'STATIC_NATIVE_TOOL_REFUSAL_ONLY',classification,toolItemOrdinal:1,priorAcceptedToolRequest:false});assert(Object.isFrozen(v.toolScopeRefusal));assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
 if(witness)witnessAuthority(v);else authority(v);
});
for(const witness of [false,true])test('valid first request followed by invalid second records duplicate refusal, never helper execution '+(witness?'witness':'old'),()=>{
 const e=events(witness?witnessMetadata():metadata());e[1].message.content.push({...clone(e[1].message.content[0]),name:'PRIVATE_SECOND_NAME',id:'PRIVATE_SECOND_ID',input:null});
 const v=witness?witnessObserve(e):observe(e);assert.equal(v.reason,'NATIVE_TOOL_SCOPE');assert.equal(v.toolScopeRefusal.classification,'DUPLICATE_TOOL_REQUEST');assert.equal(v.toolScopeRefusal.toolItemOrdinal,2);assert.equal(v.toolScopeRefusal.priorAcceptedToolRequest,true);assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('first tool-scope refusal is latched despite a later accepted request and later duplicate',()=>{
 const e=events(witnessMetadata());e[1].message.content.unshift({...clone(e[1].message.content[0]),input:{command:'PRIVATE_FIRST_COMMAND',timeout:15000}});e[1].message.content.push(clone(e[1].message.content[1]));const v=witnessObserve(e);
 assert.equal(v.reason,'NATIVE_TOOL_SCOPE');assert.equal(v.toolScopeRefusal.classification,'COMMAND_MISMATCH');assert.equal(v.toolScopeRefusal.toolItemOrdinal,1);assert.equal(v.toolScopeRefusal.priorAcceptedToolRequest,false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('earlier non-tool refusal remains primary without attaching later tool diagnostics',()=>{
 const e=events(witnessMetadata());e[0].tools=['PRIVATE_WRONG_INITIAL_TOOL'];e[1].message.content[0].input.command='PRIVATE_COMMAND';const v=witnessObserve(e);assert.equal(v.reason,'NATIVE_INITIAL_CONTEXT');assert.equal(Object.hasOwn(v,'toolScopeRefusal'),false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('successful actual-format mocks gain no tool-refusal field or additional authority',()=>{
 for(const v of [observe(),witnessObserve()]){assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(Object.hasOwn(v,'toolScopeRefusal'),false);assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');}
});
for(const field of ['name','id','input'])test('accessor-bearing '+field+' is rejected before any scope classification/getter read',()=>{
 let reads=0;const e=events(witnessMetadata());Object.defineProperty(e[1].message.content[0],field,{enumerable:true,get(){reads++;throw Error('PRIVATE_ACCESSOR');}});const v=witnessObserve(e);assert.equal(v.reason,'INPUT_UNAVAILABLE');assert.equal(reads,0);assert.equal(Object.hasOwn(v,'toolScopeRefusal'),false);
});
for(const field of ['command','timeout','description'])test('input accessor '+field+' is never evaluated or retained',()=>{
 let reads=0;const e=events(witnessMetadata());Object.defineProperty(e[1].message.content[0].input,field,{enumerable:true,get(){reads++;throw Error('PRIVATE_ACCESSOR');}});const v=witnessObserve(e);assert.equal(v.reason,'INPUT_UNAVAILABLE');assert.equal(reads,0);assert.equal(Object.hasOwn(v,'toolScopeRefusal'),false);
});
// Conflicting invalid fields prove the original OR priority without exposing
// any of their values. No native tool/helper/model is run by these mocks.
for(const [expected,mutate]of [
 ['TOOL_NAME_MISMATCH',i=>{i.name='PRIVATE';i.id='PRIVATE';i.input=null;}],
 ['TOOL_ID_SHAPE',i=>{i.id='PRIVATE';i.input=null;}],
 ['COMMAND_MISMATCH',i=>{i.input.command='PRIVATE';i.input.PRIVATE=true;delete i.input.timeout;}],
 ['INPUT_EXTRA_KEYS',i=>{i.input.PRIVATE=true;delete i.input.timeout;}],
 ['TIMEOUT_MISSING',i=>{delete i.input.timeout;i.input.description={private:true};}],
 ['TIMEOUT_NOT_INTEGER',i=>{i.input.timeout='PRIVATE';i.input.description={private:true};}]
])test('original scope first-refusal priority '+expected,()=>{const e=events(witnessMetadata());mutate(e[1].message.content[0]);const v=witnessObserve(e);assert.equal(v.toolScopeRefusal.classification,expected);assert.equal(v.reason,'NATIVE_TOOL_SCOPE');assert.equal(JSON.stringify(v).includes('PRIVATE'),false);});

const foregroundRefusalCases=[
 ['RAW_SHAPE_INVALID',e=>delete e[2].tool_use_result],
 ['RAW_SHAPE_INVALID',e=>e[2].tool_use_result={PRIVATE_EXTRA:'PRIVATE_BODY'}],
 ['STDOUT_NOT_STRING',e=>e[2].tool_use_result.stdout={PRIVATE_BODY:true}],
 ['STDOUT_TOO_LARGE',e=>e[2].tool_use_result.stdout='PRIVATE_BODY'.repeat(400)],
 ['STDERR_NOT_EMPTY',e=>e[2].tool_use_result.stderr='PRIVATE_STDERR'],
 ['INTERRUPTED_FLAG',e=>e[2].tool_use_result.interrupted=true],
 ['IMAGE_FLAG',e=>e[2].tool_use_result.isImage=true],
 ['NO_OUTPUT_EXPECTED_FLAG',e=>e[2].tool_use_result.noOutputExpected=true],
 ['TOOL_RESULT_ERROR_FLAG',e=>e[2].message.content[0].is_error=true],
 ['RENDERED_NOT_STRING',e=>e[2].message.content[0].content={PRIVATE_BODY:true}],
 ['RENDERED_MISMATCH',e=>e[2].message.content[0].content='PRIVATE_RENDERED'],
 ['RAW_METADATA_PARSE_FAILED',e=>{e[2].tool_use_result.stdout='PRIVATE_NOT_METADATA';e[2].message.content[0].content='PRIVATE_NOT_METADATA';}]
];
for(const witness of [false,true])for(const [classification,mutate]of foregroundRefusalCases)test('primary foreground refusal '+classification+' '+(witness?'witness':'old'),()=>{
 const e=events(witness?witnessMetadata():metadata());mutate(e);const v=witness?witnessObserve(e):observe(e);assert.equal(v.reason,'FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');assert.equal(v.outcome,'UNKNOWN');assert.equal(v.foregroundRefusalClass,classification);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);if(witness)witnessAuthority(v);else authority(v);
});
test('only primary foreground reason carries first static label; later failures cannot overwrite it',()=>{
 const e=events(witnessMetadata());e[2].tool_use_result.stderr='PRIVATE_WARNING';const later=clone(e[2]);later.tool_use_result.interrupted=true;later.tool_use_result.stderr='';e.splice(3,0,later);const v=witnessObserve(e);assert.equal(v.reason,'FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');assert.equal(v.foregroundRefusalClass,'STDERR_NOT_EMPTY');
 const f=events(witnessMetadata());f[1].message.content[0].input.command='PRIVATE_COMMAND';f[2].tool_use_result.stderr='PRIVATE_WARNING';const r=witnessObserve(f);assert.equal(r.reason,'NATIVE_TOOL_SCOPE');assert.equal(Object.hasOwn(r,'foregroundRefusalClass'),false);assert.equal(JSON.stringify(r).includes('PRIVATE_'),false);
 for(const r of [observe(),witnessObserve()])assert.equal(Object.hasOwn(r,'foregroundRefusalClass'),false);
});
// Private source seam for predicate/order tests only. No helper/model/native
// execution or native acceptance. Parser/Buffer fault cases are synthetic.
const directSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-direct-trace.mjs',import.meta.url),'utf8');
const foregroundSource=directSource.slice(directSource.indexOf('function foregroundShapeSummary('),directSource.indexOf('// completion supplies'));
const exactForeground=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const newForeground=(parse=parseNativeStdioMetadata,buffer=Buffer)=>Function('exact','parseNativeStartupWitness','parseNativeStdioMetadata','Buffer',foregroundSource+';return foregroundResult;')(exactForeground,parse,parse,buffer);
// Exact bc50 foreground predicate reference; no acceptance or IO authority.
function priorForeground(event,item,witness,parse=parseNativeStdioMetadata,buffer=Buffer){
 const raw=event.tool_use_result;
 if(!exactForeground(raw,['stdout','stderr','interrupted','isImage','noOutputExpected'])||typeof raw.stdout!=='string'||buffer.byteLength(raw.stdout)>4096||raw.stderr!==''||raw.interrupted!==false||raw.isImage!==false||raw.noOutputExpected!==false||item.is_error!==false||typeof item.content!=='string')return null;
 const rendered=raw.stdout.replace(/^(\s*\n)+/,'').trimEnd();if(item.content!==rendered||buffer.byteLength(rendered)>4096)return null;
 const metadata=parse(raw.stdout),also=parse(item.content);if(!metadata||!also||JSON.stringify(metadata)!==JSON.stringify(also))return null;return metadata;
}
const seamData=()=>{const e=events();return {event:e[2],item:e[2].message.content[0]};};
test('old/new foreground return semantics match held-stable success and all real-shaped refusals',()=>{
 for(const witness of [false,true])for(const mutate of [()=>{},...foregroundRefusalCases.map(v=>v[1])]){const e=events(witness?witnessMetadata():metadata());mutate(e);const parse=witness?parseNativeStartupWitness:parseNativeStdioMetadata;let label=null;
  const before=priorForeground(e[2],e[2].message.content[0],witness,parse),after=newForeground(parse)(e[2],e[2].message.content[0],witness,v=>label=v);assert.deepEqual(after,before);if(before)assert.equal(label,null);
 }
});
for(const [classification,answers]of [['RAW_METADATA_PARSE_FAILED',[null,null]],['RENDERED_METADATA_PARSE_FAILED',[metadata(),null]],['METADATA_MISMATCH',[metadata(),{...metadata(),pid:5678}]]])test('both parser calls precede synthetic '+classification+' classification',()=>{
 const d=seamData();let calls=[];const parse=bytes=>{calls.push(bytes);return answers[calls.length-1];};let label=null;const result=newForeground(parse)(d.event,d.item,false,v=>label=v);assert.equal(result,null);assert.equal(label,classification);assert.deepEqual(calls,[d.event.tool_use_result.stdout,d.item.content]);
 calls=[];assert.equal(priorForeground(d.event,d.item,false,parse),null);assert.deepEqual(calls,[d.event.tool_use_result.stdout,d.item.content]);
});
test('unreachable normal renderer-size refusal retains exact predicate through synthetic bounded Buffer seam',()=>{
 const d=seamData();let calls=0,label=null;const buffer={byteLength:value=>++calls===2?4097:Buffer.byteLength(value)};assert.equal(newForeground(parseNativeStdioMetadata,buffer)(d.event,d.item,false,v=>label=v),null);assert.equal(label,'RENDERED_TOO_LARGE');assert.equal(calls,2);calls=0;assert.equal(priorForeground(d.event,d.item,false,parseNativeStdioMetadata,buffer),null);assert.equal(calls,2);
});
test('raw predicates preserve short-circuit getter access exactly under private source seam',()=>{
 for(const [field,label]of [['stdout','STDOUT_NOT_STRING'],['stderr','STDERR_NOT_EMPTY'],['interrupted','INTERRUPTED_FLAG'],['isImage','IMAGE_FLAG'],['noOutputExpected','NO_OUTPUT_EXPECTED_FLAG']]){
  const d=seamData(),raw=d.event.tool_use_result;let reads=0;const order=['stdout','stderr','interrupted','isImage','noOutputExpected'];raw[field]=field==='stdout'?null:field==='stderr'?'PRIVATE':true;
  for(const key of order.slice(order.indexOf(field)+1))Object.defineProperty(raw,key,{enumerable:true,get(){reads++;throw Error('PRIVATE_LATER_GETTER');}});
  assert.equal(priorForeground(d.event,d.item,false),null);assert.equal(reads,0);let code=null;assert.equal(newForeground()(d.event,d.item,false,v=>code=v),null);assert.equal(code,label);assert.equal(reads,0);
 }
});

const fixedRawShapeFields=['stdout','stderr','interrupted','rawOutputPath','isImage','backgroundTaskId','backgroundedByUser','dangerouslyDisableSandbox','returnCodeInterpretation','noOutputExpected','structuredContent','persistedOutputPath','persistedOutputSize','staleReadFileStateHint','ghRateLimitHint','gitOperation'];
const rawShapeEvents=()=>{const e=events(witnessMetadata());e[2].tool_use_result='PRIVATE_RAW_BODY';return e;};
for(const witness of [false,true])for(const [kind,raw]of [['absent',undefined],['null',null],['boolean',true],['number',123],['string','PRIVATE_RAW_BODY'],['array',['PRIVATE_ARRAY_BODY']],['object',{PRIVATE_UNKNOWN:'PRIVATE_RAW_BODY'}]])test('fixed raw container metadata '+kind+' '+(witness?'witness':'old'),()=>{
 const e=events(witness?witnessMetadata():metadata());if(kind==='absent')delete e[2].tool_use_result;else e[2].tool_use_result=raw;
 const v=witness?witnessObserve(e):observe(e);assert.equal(v.reason,'FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.foregroundShape.rawOwnPropertyPresent,kind!=='absent');assert.equal(v.foregroundShape.rawContainerKind,kind);assert.deepEqual(Object.keys(v.foregroundShape.knownFieldPresence),fixedRawShapeFields);assert(Object.values(v.foregroundShape.knownFieldPresence).every(value=>value===false));assert.equal(v.foregroundShape.unknownKeysPresent,kind==='object');assert.equal(v.foregroundShape.itemIsErrorState,'FALSE');assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);assert(Object.isFrozen(v.foregroundShape));assert.equal(v.nativeNonallowHistory.status,'UNAVAILABLE');assert.equal(v.nativeNonallowHistory.matchingAcceptedToolNonallowRecord,null);
});
for(const field of ['stdout','stderr','interrupted','isImage','noOutputExpected'])test('missing required raw '+field+' reports only fixed presence metadata',()=>{
 const e=events(witnessMetadata());delete e[2].tool_use_result[field];const v=witnessObserve(e);assert.equal(v.foregroundShape.knownFieldPresence[field],false);assert.equal(v.foregroundShape.unknownKeysPresent,false);assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');
});
for(const field of fixedRawShapeFields.filter(k=>!['stdout','stderr','interrupted','isImage','noOutputExpected'].includes(k)))test('known optional raw '+field+' remains refused without body collection',()=>{
 const e=events(witnessMetadata());e[2].tool_use_result[field]='PRIVATE_VALUE';const v=witnessObserve(e);assert.equal(v.foregroundShape.knownFieldPresence[field],true);assert.equal(v.foregroundShape.unknownKeysPresent,false);assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('first raw-shape summary cannot be overwritten by later shapes or earlier unrelated refusals',()=>{
 const e=rawShapeEvents(),later=clone(e[2]);later.tool_use_result={PRIVATE_UNKNOWN:true};e.splice(3,0,later);const v=witnessObserve(e);assert.equal(v.foregroundShape.rawContainerKind,'string');assert.equal(v.foregroundShape.unknownKeysPresent,false);
 const f=events(witnessMetadata());f[2].tool_use_result.stderr='PRIVATE_WARNING';const second=clone(f[2]);second.tool_use_result='PRIVATE_LATER_BODY';f.splice(3,0,second);const r=witnessObserve(f);assert.equal(r.foregroundRefusalClass,'STDERR_NOT_EMPTY');assert.equal(Object.hasOwn(r,'foregroundShape'),false);assert.equal(Object.hasOwn(r,'nativeNonallowHistory'),false);
 const g=rawShapeEvents();g[1].message.content[0].input.command='PRIVATE_COMMAND';const q=witnessObserve(g);assert.equal(q.reason,'NATIVE_TOOL_SCOPE');assert.equal(Object.hasOwn(q,'foregroundShape'),false);
 for(const q of [observe(),witnessObserve()]){assert.equal(Object.hasOwn(q,'foregroundShape'),false);assert.equal(Object.hasOwn(q,'nativeNonallowHistory'),false);}
});
for(const state of ['TRUE','FALSE','UNSUPPORTED'])test('raw-shape diagnostic item error closed state '+state,()=>{
 const e=rawShapeEvents();e[2].message.content[0].is_error=state==='TRUE'?true:state==='FALSE'?false:'PRIVATE_ERROR';const v=witnessObserve(e);assert.equal(v.foregroundShape.itemIsErrorState,state);assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('foreign raw-shape accessors are rejected before any getter read or shape/history diagnostic',()=>{
 let reads=0;for(const raw of [{get stdout(){reads++;throw Error('PRIVATE');}},{get PRIVATE_UNKNOWN(){reads++;throw Error('PRIVATE');}}]){const e=rawShapeEvents();e[2].tool_use_result=raw;const v=witnessObserve(e);assert.equal(v.reason,'INPUT_UNAVAILABLE');assert.equal(Object.hasOwn(v,'foregroundShape'),false);}assert.equal(reads,0);
});
const nonallowRow=(override={})=>({tool_name:'Bash',tool_use_id:id,tool_input:{PRIVATE_INPUT:'PRIVATE_BODY'},...override});
const withNonallow=(rows=[])=>{const e=rawShapeEvents();e[3].permission_denials=rows;return e;};
for(const [rows,match]of [[[],false],[[nonallowRow()],true],[[nonallowRow({tool_use_id:'toolu_OTHERID'})],false]])test('source-shaped nonallow history diagnostic observed matching '+match+' rows '+rows.length,()=>{
 const v=witnessObserve(withNonallow(rows));assert.deepEqual(v.nativeNonallowHistory,{status:'OBSERVED',matchingAcceptedToolNonallowRecord:match});assert.equal(v.outcome,'UNKNOWN');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
});
test('missing/foreign/duplicate/unreviewed final is unavailable rather than zero nonallow records',()=>{
 for(const mutate of [e=>delete e[3].permission_denials,e=>e[3].session_id=foreign,e=>e.push(clone(e[3])),e=>e[3].num_turns=5,e=>e[3].subtype=5,e=>e[3].is_error='PRIVATE',e=>e.pop()]){const e=withNonallow([]);mutate(e);const v=witnessObserve(e);assert.deepEqual(v.nativeNonallowHistory,{status:'UNAVAILABLE',matchingAcceptedToolNonallowRecord:null});assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.outcome,'UNKNOWN');}
});
for(const rows of [null,{},['PRIVATE_ROW'],[nonallowRow({tool_name:'PRIVATE_OTHER_NAME'})],[nonallowRow({tool_input:null})],[nonallowRow({tool_input:[]})],[nonallowRow({PRIVATE_EXTRA:true})],[{tool_name:'Bash',tool_use_id:id}]])test('malformed nonallow diagnostic remains nullable without names/inputs',()=>{
 const v=witnessObserve(withNonallow(rows));assert.deepEqual(v.nativeNonallowHistory,{status:'MALFORMED',matchingAcceptedToolNonallowRecord:null});assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);assert.equal(v.outcome,'UNKNOWN');
});
test('diagnostic nonallow cap does not alter original foreground refusal or reveal counts',()=>{
 const v=witnessObserve(withNonallow(Array.from({length:65},()=>nonallowRow())));assert.deepEqual(v.nativeNonallowHistory,{status:'LIMIT_EXCEEDED',matchingAcceptedToolNonallowRecord:null});assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.outcome,'UNKNOWN');
});
test('nonallow input getters never run; original data prerequisite refuses before diagnostics',()=>{
 let reads=0;const input={};Object.defineProperty(input,'PRIVATE',{enumerable:true,get(){reads++;throw Error('PRIVATE');}});const v=witnessObserve(withNonallow([nonallowRow({tool_input:input})]));assert.equal(v.reason,'INPUT_UNAVAILABLE');assert.equal(reads,0);assert.equal(Object.hasOwn(v,'nativeNonallowHistory'),false);
});

test('missing item error is diagnostic MISSING only in private shape seam; actual frame still refuses earlier',()=>{
 const e=rawShapeEvents();delete e[2].message.content[0].is_error;let classification=null,summary=null;
 assert.equal(newForeground()(e[2],e[2].message.content[0],false,(code,shape)=>{classification=code;summary=shape;}),null);assert.equal(classification,'RAW_SHAPE_INVALID');assert.equal(summary.itemIsErrorState,'MISSING');
 const v=witnessObserve(e);assert.equal(v.reason,'NATIVE_RESULT_ID');assert.equal(Object.hasOwn(v,'foregroundShape'),false);
});
test('nonallow diagnostic helper does not read input field values after record-type validation (private source seam)',()=>{
 const history=Function('exact',foregroundSource+';return foregroundNonallowHistory;')(exactForeground);let reads=0;const input={};Object.defineProperty(input,'PRIVATE',{enumerable:true,get(){reads++;throw Error('PRIVATE');}});
 const e=withNonallow([nonallowRow({tool_input:input})]);assert.deepEqual(history(e,true,session,{id}),{status:'OBSERVED',matchingAcceptedToolNonallowRecord:true});assert.equal(reads,0); // exported interpreter still rejects this non-JSON getter, tested above
});

const requiredSandboxLiteral='Error: Sandbox is required but failed to initialize. Restart to retry.';
const enabledSandboxLiteral='Error: Sandbox is enabled but failed to initialize. Sandboxing is disabled for the rest of this session; restart to retry.';
const formatCases=[
 [requiredSandboxLiteral,'EXACT_REQUIRED_SANDBOX_INIT_LITERAL',null],
 [enabledSandboxLiteral,'EXACT_ENABLED_SANDBOX_INIT_LITERAL',null],
 ['Error calling tool (Bash): PRIVATE_BODY','OUTER_BASH_CALL_ERROR_PREFIX',null],
 ['Error calling tool (Bash): ','OUTER_BASH_CALL_ERROR_PREFIX',null],
 ...[0,1,9,10,99,100,254,255].flatMap(code=>[[`Error: Exit code ${code}`,'SHELL_EXIT_FIRST_LINE_FORMAT',code],[`Error: Exit code ${code}\nPRIVATE_BODY`,'SHELL_EXIT_FIRST_LINE_FORMAT',code]]),
 ...[requiredSandboxLiteral+' PRIVATE_SUFFIX',enabledSandboxLiteral+' PRIVATE_SUFFIX',' '+requiredSandboxLiteral,requiredSandboxLiteral+'\n',enabledSandboxLiteral+'\r\n',requiredSandboxLiteral.toLowerCase(),'\u001b[31m'+requiredSandboxLiteral,
  'error calling tool (Bash): PRIVATE_BODY','Error calling tool (Bash):','Error calling tool (Bash) : PRIVATE_BODY',
  ' Error: Exit code 1','\u001b[31mError: Exit code 1','Error: Exit code 1\r\nPRIVATE_BODY','Error: Exit code 1\r','Error: Exit code 01','Error: Exit code 00','Error: Exit code -1','Error: Exit code +1','Error: Exit code 256','Error: Exit code 999','Error: Exit code 1000','Error: Exit code 999999999999999999999999','Error: Exit code 1 PRIVATE_BODY','Error: Exit code 1.0','error: Exit code 1','Error: exit code 1','InputValidationError: PRIVATE_BODY',
  JSON.stringify(witnessMetadata())].map(raw=>[raw,'OTHER',null])
];
for(const [index,[raw,errorFormat,code]]of formatCases.entries())test('finite raw-string error format case '+index+' '+errorFormat,()=>{
 for(const witness of [false,true]){const e=events(witness?witnessMetadata():metadata());e[2].tool_use_result=raw;const v=witness?witnessObserve(e):observe(e);
  assert.equal(v.reason,'FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.foregroundShape.rawContainerKind,'string');assert.equal(v.foregroundShape.errorFormat,errorFormat);assert.equal(v.foregroundShape.formatDerivedExitCode,code);assert.equal(v.outcome,'UNKNOWN');assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);assert.equal(Object.hasOwn(v,'helperExitCode'),false);assert.equal(Object.hasOwn(v,'nativeExit'),false);assert.equal(v.helperKernelClose,'NOT_OBSERVED');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
 }
});
test('format-derived zero followed by forged valid metadata never becomes process zero or PASS',()=>{
 const e=rawShapeEvents();e[2].tool_use_result='Error: Exit code 0\n'+JSON.stringify(witnessMetadata());const v=witnessObserve(e);assert.equal(v.foregroundShape.errorFormat,'SHELL_EXIT_FIRST_LINE_FORMAT');assert.equal(v.foregroundShape.formatDerivedExitCode,0);assert.equal(v.outcome,'UNKNOWN');assert.equal(Object.hasOwn(v,'metadata'),false);assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);assert.equal(v.helperKernelClose,'NOT_OBSERVED');
 const f=rawShapeEvents();f[2].tool_use_result='Error calling tool (Bash): '+JSON.stringify(witnessMetadata());const r=witnessObserve(f);assert.equal(r.foregroundShape.errorFormat,'OUTER_BASH_CALL_ERROR_PREFIX');assert.equal(r.foregroundShape.formatDerivedExitCode,null);assert.equal(r.outcome,'UNKNOWN');assert.equal(Object.hasOwn(r,'helperProcessOutcome'),false);
});
test('non-string shapes add no error-format fields, and earlier primary refusal/first shape still win',()=>{
 for(const raw of [null,true,123,[],{}]){const e=rawShapeEvents();e[2].tool_use_result=raw;const v=witnessObserve(e);assert.equal(Object.hasOwn(v.foregroundShape,'errorFormat'),false);assert.equal(Object.hasOwn(v.foregroundShape,'formatDerivedExitCode'),false);}
 const e=rawShapeEvents();e[2].tool_use_result=requiredSandboxLiteral;const later=clone(e[2]);later.tool_use_result='Error: Exit code 99';e.splice(3,0,later);const v=witnessObserve(e);assert.equal(v.foregroundShape.errorFormat,'EXACT_REQUIRED_SANDBOX_INIT_LITERAL');assert.equal(v.foregroundShape.formatDerivedExitCode,null);
 const f=rawShapeEvents();f[2].tool_use_result='Error: Exit code 7';f[1].message.content[0].input.command='PRIVATE_COMMAND';const r=witnessObserve(f);assert.equal(r.reason,'NATIVE_TOOL_SCOPE');assert.equal(Object.hasOwn(r,'foregroundShape'),false);
 for(const r of [observe(),witnessObserve()]){assert.equal(r.outcome,'OBSERVED_COMPATIBLE');assert.equal(Object.hasOwn(r,'foregroundShape'),false);}
});
test('excluding string-only diagnostics preserves the original fixed shape summary exactly',()=>{
 for(const [raw]of formatCases){const e=rawShapeEvents();e[2].tool_use_result=raw;const v=witnessObserve(e),{errorFormat,formatDerivedExitCode,errorMarkers,...priorShape}=v.foregroundShape;
  assert.deepEqual(priorShape,{rawOwnPropertyPresent:true,rawContainerKind:'string',knownFieldPresence:Object.fromEntries(fixedRawShapeFields.map(key=>[key,false])),unknownKeysPresent:false,itemIsErrorState:'FALSE'});
 }
});

// Fixed public-token diagnostic mocks only. Markers do not establish output
// origin, execution, actual exit, native enforcement, permissions or a cause.
const fixedErrorMarkers=[
 ['sandboxExec','sandbox-exec:'],['sandboxApply','sandbox_apply:'],['operationNotPermitted','Operation not permitted'],['permissionDenied','Permission denied'],
 ['noSuchFile','No such file or directory'],['commandNotFound','command not found'],['badInterpreter','bad interpreter'],['cannotExecute','cannot execute'],
 ['cannotOpen','cannot open'],['unboundVariable','unbound variable'],['syntaxError','syntax error'],['readOnlyFilesystem','Read-only file system'],
 ['dyld','dyld['],['libraryNotLoaded','Library not loaded'],['bashPath','/bin/bash'],['helperLeaf','/native-stdio-probe'],['nativeTmpPrefix','/tmp/claude-'],
 ['cwdLeaf','/cwd-'],['snapshotDirectory','/shell-snapshots/'],['pathHelper','/usr/libexec/path_helper'],['profile','/etc/profile'],
 ['privateProfile','/private/etc/profile'],['devNull','/dev/null'],['helperMetadataScope','"scope":"NATIVE_CHILD_STARTUP_WITNESS_ONLY"']
];
const errorMarkerSnapshot=(raw,witness=true)=>{const e=events(witness?witnessMetadata():metadata());e[2].tool_use_result=raw;return witness?witnessObserve(e):observe(e);};
const expectedErrorMarkers=raw=>Object.fromEntries(fixedErrorMarkers.map(([name,token])=>[name,raw.includes(token)]));
for(const [name,token]of fixedErrorMarkers)test('fixed error marker '+name+' matches literal case-sensitive substrings only',()=>{
 for(const witness of [false,true])for(const raw of [token,'PRIVATE_PREFIX'+token+'PRIVATE_SUFFIX',token.toUpperCase(),token.toLowerCase(),token.split('').join(' '),token.slice(0,1)+'\u001b[0m'+token.slice(1),token.slice(0,1)+'\r\n'+token.slice(1)]){
  const v=errorMarkerSnapshot(raw,witness),markers=v.foregroundShape.errorMarkers;
  assert.deepEqual(markers,expectedErrorMarkers(raw));assert.deepEqual(Object.keys(markers),fixedErrorMarkers.map(([key])=>key));assert(Object.values(markers).every(value=>typeof value==='boolean'));assert(Object.isFrozen(markers));
  assert.equal(v.reason,'FOREGROUND_RAW_OR_RENDERED_RESULT_UNAVAILABLE');assert.equal(v.foregroundRefusalClass,'RAW_SHAPE_INVALID');assert.equal(v.outcome,'UNKNOWN');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.reuseEligible,false);assert.equal(Object.hasOwn(v,'metadata'),false);assert.equal(Object.hasOwn(v,'helperProcessOutcome'),false);assert.equal(JSON.stringify(v).includes('PRIVATE_'),false);
 }
});
test('marker snapshot has a fixed boolean shape for empty/no-match/multiple tokens and never retains synthetic secrets or unknown paths',()=>{
 for(const raw of ['', 'PRIVATE_SYNTHETIC_SECRET_7820 /unknown/private-7820/token-value',fixedErrorMarkers.map(([,token])=>token).join('\n')+' PRIVATE_SYNTHETIC_SECRET_7820 /unknown/private-7820/token-value']){
  const v=errorMarkerSnapshot(raw),serialized=JSON.stringify(v);assert.deepEqual(v.foregroundShape.errorMarkers,expectedErrorMarkers(raw));assert.equal(serialized.includes('7820'),false);assert.equal(serialized.includes('/unknown/'),false);assert.equal(serialized.includes('token-value'),false);assert.equal(serialized.includes('PRIVATE_'),false);assert.equal(JSON.stringify(v.foregroundShape.errorMarkers).includes('NATIVE_CHILD_STARTUP_WITNESS_ONLY'),false);
 }
 assert(Object.values(errorMarkerSnapshot('').foregroundShape.errorMarkers).every(value=>value===false));
 assert(Object.values(errorMarkerSnapshot(fixedErrorMarkers.map(([,token])=>token).join('\n')).foregroundShape.errorMarkers).every(value=>value===true));
});
test('no error markers for non-string shapes, successful traces or earlier primary refusal; first snapshot remains authoritative',()=>{
 for(const raw of [null,true,123,[],{}]){const v=errorMarkerSnapshot(raw);assert.equal(Object.hasOwn(v.foregroundShape,'errorMarkers'),false);}
 const absent=rawShapeEvents();delete absent[2].tool_use_result;assert.equal(Object.hasOwn(witnessObserve(absent).foregroundShape,'errorMarkers'),false);
 for(const v of [observe(),witnessObserve()])assert.equal(Object.hasOwn(v,'foregroundShape'),false);
 const early=rawShapeEvents();early[1].message.content[0].input.command='PRIVATE_COMMAND';assert.equal(Object.hasOwn(witnessObserve(early),'foregroundShape'),false);
 const e=rawShapeEvents();e[2].tool_use_result='Permission denied';const later=clone(e[2]);later.tool_use_result='sandbox-exec:';e.splice(3,0,later);const v=witnessObserve(e);assert.deepEqual(v.foregroundShape.errorMarkers,expectedErrorMarkers('Permission denied'));
 const f=events(witnessMetadata());f[2].tool_use_result.stderr='PRIVATE_WARNING';const second=clone(f[2]);second.tool_use_result='sandbox-exec:';f.splice(3,0,second);assert.equal(Object.hasOwn(witnessObserve(f),'foregroundShape'),false);
});
test('forged exit-format and helper marker remain unknown without helper/process metadata or authority',()=>{
 const raw='Error: Exit code 1\n/native-stdio-probe '+JSON.stringify(witnessMetadata());
 for(const witness of [false,true]){const v=errorMarkerSnapshot(raw,witness);assert.equal(v.foregroundShape.errorFormat,'SHELL_EXIT_FIRST_LINE_FORMAT');assert.equal(v.foregroundShape.formatDerivedExitCode,1);assert.equal(v.foregroundShape.errorMarkers.helperLeaf,true);assert.equal(v.foregroundShape.errorMarkers.helperMetadataScope,true);assert.equal(v.outcome,'UNKNOWN');for(const key of ['metadata','helperProcessOutcome','helperExitCode','nativeExit'])assert.equal(Object.hasOwn(v,key),false);assert.equal(v.helperKernelClose,'NOT_OBSERVED');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);}
});
test('removing only errorMarkers preserves baseline foreground semantics and every prior diagnostic',()=>{
 const expression=',errorMarkers:foregroundErrorMarkers(raw)';assert.equal(foregroundSource.split(expression).length,2);
 const baseline=Function('exact','parseNativeStartupWitness','parseNativeStdioMetadata','Buffer',foregroundSource.replace(expression,'')+';return foregroundResult;')(exactForeground,parseNativeStartupWitness,parseNativeStdioMetadata,Buffer);
 for(const witness of [false,true])for(const mutate of [()=>{},...foregroundRefusalCases.map(([,change])=>change),...formatCases.map(([raw])=>e=>e[2].tool_use_result=raw),...fixedErrorMarkers.map(([,raw])=>e=>e[2].tool_use_result=raw)]){
  const e=events(witness?witnessMetadata():metadata());mutate(e);let before=null,after=null;
  const resultBefore=baseline(e[2],e[2].message.content[0],witness,(classification,summary)=>before={classification,summary});
  const resultAfter=newForeground(witness?parseNativeStartupWitness:parseNativeStdioMetadata)(e[2],e[2].message.content[0],witness,(classification,summary)=>after={classification,summary});
  if(after?.summary&&Object.hasOwn(after.summary,'errorMarkers')){const {errorMarkers,...prior}=after.summary;after={...after,summary:prior};}
  assert.deepEqual(resultAfter,resultBefore);assert.deepEqual(after,before);
 }
});

const execBinding={...witnessBinding,interpretation:NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION};
const execCompletion=()=>({...witnessCompletion(),interpretation:NATIVE_EXEC_STARTUP_WITNESS_INTERPRETATION});
const execEvents=(m=witnessMetadata())=>{const e=events(m);e[1].message.content[0].input.command=nativeExecStartupWitnessCommand(hostBase);return e;};
const execObserve=(e=execEvents(),b=execBinding,c=execCompletion())=>interpretExecNativeStartupWitnessTrace(e,b,c);
test('exec foreground contract is distinct while helper/source/child/FD assertions remain exact',()=>{
 const v=execObserve();assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.interpretation,NATIVE_EXEC_STARTUP_WITNESS_DIRECT_INTERPRETATION);assert.equal(v.commandSha256,createHash('sha256').update(nativeExecStartupWitnessCommand(hostBase)).digest('hex'));assert.deepEqual(v.metadata,witnessMetadata());assert.equal(v.helperProcessOutcome,'SOURCE_DERIVED_FOREGROUND_COMMAND_EXIT_ZERO');assert.equal(v.controlledShellStartup,'NOT_ESTABLISHED');assert.equal(v.pathHelperProcessing,'NOT_ESTABLISHED');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);
 for(const [e,b,c]of [[execEvents(),witnessBinding,execCompletion()],[execEvents(),execBinding,witnessCompletion()],[events(witnessMetadata()),execBinding,execCompletion()]])assert.equal(execObserve(e,b,c).outcome,'UNKNOWN');
 assert.equal(witnessObserve(execEvents(),execBinding,execCompletion()).outcome,'UNKNOWN');assert.equal(witnessObserve(execEvents()).reason,'NATIVE_TOOL_SCOPE');
});
for(const [name,change]of [...foregroundRefusalCases,...NATIVE_STARTUP_WITNESS_FIELDS.map(field=>['missing '+field,e=>{const m=witnessMetadata();delete m.startup[field];e[2].tool_use_result.stdout=JSON.stringify(m);e[2].message.content[0].content=e[2].tool_use_result.stdout;}])])test('exec fixed route preserves foreground refusal '+name,()=>{
 const e=execEvents();change(e);const v=execObserve(e);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);
});
for(const field of NATIVE_STARTUP_WITNESS_FIELDS)test('exec child mismatch '+field+' remains incompatible',()=>{const m=witnessMetadata();m.startup[field]=false;assert.equal(execObserve(execEvents(m)).outcome,'OBSERVED_INCOMPATIBLE');});
test('exec witness requires live completion and strict literal command without wrappers/redirects',()=>{
 for(const field of ['sourceCurrent','helperCurrent','reviewedBuildMatches','nativeCurrent','startupPreconditions','noHooksCurrent','reaped'])assert.equal(execObserve(undefined,undefined,{...execCompletion(),[field]:false}).outcome,'UNKNOWN');
 for(const command of [nativeStdioDirectCommand(hostBase),'exec '+nativeStdioDirectCommand(hostBase)+'; true','exec '+nativeStdioDirectCommand(hostBase)+' > /dev/null','env '+nativeExecStartupWitnessCommand(hostBase),nativeExecStartupWitnessCommand(hostBase)+'\n']){const e=execEvents();e[1].message.content[0].input.command=command;assert.equal(execObserve(e).reason,'NATIVE_TOOL_SCOPE');}
 for(const c of [{...execCompletion(),nativeExit:7},{...execCompletion(),nativeSignal:'SIGTERM'},{...execCompletion(),controlledShellStartup:true}])assert.equal(execObserve(undefined,undefined,c).outcome,'UNKNOWN');
});
