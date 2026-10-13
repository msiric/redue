// Source and in-memory native-stream controls only. No C compilation, native
// agent, model, actual endpoint, compiler execution or enforcement test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readNativeStdioProbeSource,nativeStdioProbeCommand,interpretNativeStdioProbeTrace,NATIVE_STDIO_SOURCE_SHA256,NATIVE_STDIO_INTERPRETATION} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-native-profile.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-probe.c',import.meta.url),'utf8');
const binding={hostBase:'/private/tmp/redue-ci-recipient-01234567',helperSha256:'a'.repeat(64),sourceSha256:NATIVE_STDIO_SOURCE_SHA256,nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256};
const command=nativeStdioProbeCommand(binding.hostBase),cwd=binding.hostBase+'/prefix/native-probes',id='toolu_01234567';
const complete={sourceCurrent:true,helperCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,sourceSha256:binding.sourceSha256,helperSha256:binding.helperSha256,nativeSha256:binding.nativeSha256,nativeExit:0,nativeSignal:null,timedOut:false,reaped:true,startupPreconditions:true};
const clone=value=>JSON.parse(JSON.stringify(value));
const metadata=()=>({schema:1,scope:'NATIVE_STDIO_METADATA_ONLY',pid:1234,dev_null:{lstat:'OK',type:'CHARACTER'},fd0_matches_dev_null:true,
 descriptors:[{fd:0,fstat:'OK',type:'CHARACTER',fcntl:'OK',access:'READ_ONLY'},{fd:1,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'},{fd:2,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'}]});
const marker=status=>({schema:1,scope:'NATIVE_STDIO_SHELL_STATUS_ONLY',status});
const text=(row=metadata(),status=0)=>JSON.stringify(row)+'\n\n'+JSON.stringify(marker(status))+'\n';
function events(content=text()){
 return [{type:'system',subtype:'init',claude_code_version:REVIEWED_CLAUDE_NATIVE.version,cwd,apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[],session_id:'12345678-1234-4234-8234-123456789abc'},
 {type:'assistant',session_id:'12345678-1234-4234-8234-123456789abc',parent_tool_use_id:null,message:{role:'assistant',id:'msg_1',content:[{type:'tool_use',name:'Bash',id,input:{command,timeout:15000}}]}},
 {type:'user',session_id:'12345678-1234-4234-8234-123456789abc',parent_tool_use_id:null,message:{role:'user',content:[{type:'tool_result',tool_use_id:id,content}]}},
 {type:'result',session_id:'12345678-1234-4234-8234-123456789abc',num_turns:2,is_error:false,subtype:'success'}];
}
const observe=(e=events(),b=binding,c=complete)=>interpretNativeStdioProbeTrace(e,b,c);
function authority(row){assert.equal(row.scope,'NATIVE_STDIO_PRECONDITION_ONLY');assert.equal(row.interpretation,NATIVE_STDIO_INTERPRETATION);for(const k of ['sealed','reuseEligible'])assert.equal(row[k],false);for(const k of ['nativeEnforcement','stdioOwnership','preMainLoader'])assert.equal(row[k],'NOT_ESTABLISHED');}

test('pinned fixed C source observes only three metadata descriptors and literal devnull',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),NATIVE_STDIO_SOURCE_SHA256);
 assert.match(source,/fd < 3/);assert.match(source,/fstat\(fd, &descriptors\[fd\]\)/);assert.match(source,/fcntl\(fd, F_GETFL\)/);
 assert.equal((source.match(/lstat\(/g)||[]).length,1);assert.match(source,/lstat\("\/dev\/null", &expected\)/);
 assert.doesNotMatch(source,/\b(?:read|open|close|dup|dup2|execve|fork|system|popen|setenv|getenv|clearenv|socket|connect)\s*\(/);
 assert.match(source,/write\(STDOUT_FILENO,/);assert.equal((source.match(/getpid\(/g)||[]).length,1);
 assert.match(source,/argc != 1/);assert.match(source,/_exit\(74\)/);assert.match(source,/_exit\(0\)/);
 assert.match(source,/metadata_ok\[fd\] = ok/);assert.match(source,/null_ok && metadata_ok\[0\]/);
 assert.doesNotMatch(source,/metadata\[0\]\[0\]/); // OTHER_ERROR must not read uninitialized stat.
 assert.doesNotMatch(source,/st_(?:ino|dev|rdev)\s*,/); // Identity values never serialized.
});
test('actual read-only source read matches exact source bytes without compiling or executing C',()=>{
 const v=readNativeStdioProbeSource();authority(v);assert.equal(v.source,source);assert.equal(v.sourceSha256,NATIVE_STDIO_SOURCE_SHA256);assert.equal(v.sourceBytes,Buffer.byteLength(source));assert.equal(v.compiled,false);assert.deepEqual(v.commands,[]);
});
test('fixed Bash directly runs C, captures its status and exits with same status; no shell supervisor',()=>{
 assert.equal(command,`'${binding.hostBase}/prefix/native-probes/native-stdio-probe'\nredue_stdio_status=$?\nprintf '\\n{"schema":1,"scope":"NATIVE_STDIO_SHELL_STATUS_ONLY","status":%d}\\n' "$redue_stdio_status"\nexit "$redue_stdio_status"`);
 assert.doesNotMatch(command,/\b(?:node|python|bash|sh|eval|exec)\b/);
 for(const value of [null,{},'/other','/private/tmp/redue-ci-recipient-01234567/..','/private/tmp/redue-ci-recipient-01234567;true',"/private/tmp/redue-ci-recipient-0123456'"])
  assert.throws(()=>nativeStdioProbeCommand(value),/NATIVE_STDIO_BINDING_UNKNOWN/);
});
test('complete mock pinned stream only establishes reported compatible stdio precondition',()=>{
 const v=observe();authority(v);assert.equal(v.outcome,'OBSERVED_COMPATIBLE');assert.equal(v.helperProcessOutcome,'EXIT_ZERO');assert.equal(v.shellStatus,0);assert.equal(v.toolUseId,id);assert.deepEqual(v.metadata,metadata());assert.equal(v.helperSha256,binding.helperSha256);
});
for(const fd of [1,2])for(const type of ['SOCKET','REGULAR','DIRECTORY','CHARACTER','BLOCK','SYMLINK'])test(`truthful incompatible descriptor ${fd} ${type} never repairs endpoint`,()=>{
 const m=metadata();m.descriptors[fd].type=type;const v=observe(events(text(m)));authority(v);assert.equal(v.outcome,'OBSERVED_INCOMPATIBLE');assert.equal(v.metadata.descriptors[fd].type,type);
});
for(const fd of [0,1,2])for(const mode of ['READ_ONLY','WRITE_ONLY','READ_WRITE'])if(mode!==(fd===0?'READ_ONLY':'WRITE_ONLY'))test(`actual mode mismatch ${fd} ${mode} remains incompatible`,()=>{
 const m=metadata();m.descriptors[fd].access=mode;assert.equal(observe(events(text(m))).outcome,'OBSERVED_INCOMPATIBLE');
});
test('different character stdin or devnull symlink is incompatible, not silently reopened',()=>{
 let m=metadata();m.fd0_matches_dev_null=false;assert.equal(observe(events(text(m))).outcome,'OBSERVED_INCOMPATIBLE');
 m=metadata();m.dev_null.type='SYMLINK';m.fd0_matches_dev_null=false;assert.equal(observe(events(text(m))).outcome,'OBSERVED_INCOMPATIBLE');
});
for(const code of ['EBADF','EACCES','EPERM','EINTR','EINVAL','ENOENT','ENOTDIR','ELOOP','OTHER_ERROR'])test(`metadata error ${code} remains UNKNOWN without raw error text`,()=>{
 const m=metadata();m.dev_null={lstat:code,type:'UNKNOWN'};m.fd0_matches_dev_null=null;const v=observe(events(text(m)));assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'DESCRIPTOR_METADATA_UNAVAILABLE');assert.equal(v.metadata.dev_null.lstat,code);
});
for(const fd of [0,1,2])for(const op of ['fstat','fcntl'])test(`missing descriptor ${fd} ${op} result remains unknown`,()=>{
 const m=metadata();m.descriptors[fd][op]='EBADF';m.descriptors[fd][op==='fstat'?'type':'access']='UNKNOWN';if(fd===0&&op==='fstat')m.fd0_matches_dev_null=null;assert.equal(observe(events(text(m))).outcome,'UNKNOWN');
});
for(const status of [1,74,127,128,137,255])test(`shell status ${status} retained without inventing a signal`,()=>{
 const v=observe(events(text(metadata(),status)));assert.equal(v.outcome,'UNKNOWN');assert.equal(v.shellStatus,status);assert.equal(v.reason,status>=128?'AMBIGUOUS_SHELL_STATUS':'HELPER_EXIT_NOT_ZERO');assert.equal(Object.hasOwn(v,'helperSignal'),false);
});
for(const content of ['',JSON.stringify(metadata()),JSON.stringify(marker(0)),text()+JSON.stringify(marker(0)),JSON.stringify(marker(0))+'\n'+JSON.stringify(metadata()),'model says PASS\n'+text(),text()+'TRAILING',text().slice(0,-8),'x'.repeat(65537)])test('missing/duplicate/reversed/partial output or prose is UNKNOWN',()=>{
 assert.equal(observe(events(content)).outcome,'UNKNOWN');
});
test('model prose cannot replace actual matching tool use and result',()=>{
 const e=events();e[1].message.content=[{type:'text',text:text()}];e.splice(2,1);assert.equal(observe(e).outcome,'UNKNOWN');
});
test('text content blocks preserve exact two-line order but reject nontext blocks',()=>{
 const e=events();e[2].message.content[0].content=[{type:'text',text:JSON.stringify(metadata())},{type:'text',text:JSON.stringify(marker(0))}];assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');
 e[2].message.content[0].content.push({type:'image',text:'private'});assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const change of [e=>e[0].claude_code_version='OTHER',e=>e[0].apiKeySource='apiKey',e=>e[0].permissionMode='bypassPermissions',e=>e[0].cwd='/other',e=>e[0].tools.push('Read'),e=>e[0].mcp_servers.push({name:'unreviewed'}),e=>e[0].plugins.push({name:'unreviewed'}),e=>e[1].message.content[0].input.command='node proxy-supervisor.mjs',e=>e[1].message.content[0].input.timeout=15001,e=>e[1].message.content[0].input.dangerouslyDisableSandbox=true,e=>e[2].message.content[0].tool_use_id='toolu_other123',e=>e[2].message.content[0].is_error=true,e=>e[3].num_turns=5,e=>e[3].is_error=true,e=>e[3].subtype='error'])test('native context, fixed command and complete event identity are necessary',()=>{
 const e=events();change(e);assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const missing of [0,1,2,3])test(`missing native event ${missing} cannot establish a precondition`,()=>{
 const e=events();e.splice(missing,1);assert.equal(observe(e).outcome,'UNKNOWN');
});
test('duplicate tool, result, init and out-of-order result permanently refuse',()=>{
 for(const index of [0,1,2,3]){const e=events();e.splice(index+1,0,clone(e[index]));assert.equal(observe(e).outcome,'UNKNOWN');}
 const e=events();[e[1],e[2]]=[e[2],e[1]];assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const [key,value] of Object.entries({sourceCurrent:false,helperCurrent:false,reviewedBuildMatches:false,nativeCurrent:false,nativeExit:74,nativeSignal:'SIGKILL',timedOut:true,reaped:false,startupPreconditions:false}))test(`external actual ${key} precondition missing keeps parser result UNKNOWN`,()=>{
 const v=observe(events(),binding,{...complete,[key]:value});authority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'EXTERNAL_NATIVE_OR_BUILD_PRECONDITION_MISSING');
});
test('unknown native/tool status cannot be filled by source existence or cleanup alone',()=>{
 for(const c of [null,{}, {...complete,nativeExit:null}, {...complete,extra:true}])assert.equal(observe(events(),binding,c).outcome,'UNKNOWN');
});
for(const field of ['sourceSha256','helperSha256','nativeSha256'])test(`outer observed ${field} must match fixed tool/code identity`,()=>{
 assert.equal(observe(events(),binding,{...complete,[field]:'b'.repeat(64)}).outcome,'UNKNOWN');
 const c={...complete};delete c[field];assert.equal(observe(events(),binding,c).outcome,'UNKNOWN');
});
for(const field of ['helperSha256','sourceSha256','nativeSha256'])test(`wrong or absent ${field} cannot bind tool output`,()=>{
 const b={...binding,[field]:'INVALID'};assert.equal(observe(events(),b).outcome,'UNKNOWN');delete b[field];assert.equal(observe(events(),b).outcome,'UNKNOWN');
});
test('malformed rows, foreign PID and unsupported error/access data are never accepted',()=>{
 for(const change of [m=>m.pid=0,m=>m.pid=2147483648,m=>m.pid='1234',m=>m.extra=true,m=>m.dev_null.lstat='PRIVATE_SECRET',m=>m.descriptors[1].fd=2,m=>m.descriptors[0].extra='private',m=>m.descriptors[1].type='TTY',m=>m.descriptors[1].access='EXTERNAL',m=>m.fd0_matches_dev_null=null,m=>m.dev_null.lstat='EPERM',m=>m.descriptors[0].type='REGULAR']){
  const m=metadata();change(m);const v=observe(events(text(m)));assert.equal(v.outcome,'UNKNOWN');assert.equal(Object.hasOwn(v,'metadata'),false);
 }
 for(const status of [-1,256,0.5,'0',null])assert.equal(observe(events(JSON.stringify(metadata())+'\n'+JSON.stringify(marker(status)))).outcome,'UNKNOWN');
});
test('untrusted getters/prototypes are refused without access or side effects',()=>{
 let n=0;const b={...binding};Object.defineProperty(b,'helperSha256',{get(){n++;return binding.helperSha256;},enumerable:true});assert.equal(observe(events(),b).outcome,'UNKNOWN');assert.equal(n,0);
 const e=events();Object.setPrototypeOf(e[1],{unexpected:true});assert.equal(observe(e).outcome,'UNKNOWN');
});
test('unsupported system event remains unknown; reviewed bounded thinking is not tool evidence',()=>{
 let e=events();e.splice(1,0,{type:'system',subtype:'hook_started'});assert.equal(observe(e).outcome,'UNKNOWN');
 e=events();e.splice(1,0,{type:'system',subtype:'thinking_tokens',estimated_tokens:2,estimated_tokens_delta:2,uuid:'23456789-1234-4234-8234-123456789abc',session_id:e[0].session_id});assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');
 e[1].session_id='OTHER';assert.equal(observe(e).outcome,'UNKNOWN');
});
for(const index of [1,2,3])for(const change of ['foreign','missing'])test(`relevant native event ${index} session ${change} is rejected`,()=>{
 const e=events();if(change==='foreign')e[index].session_id='23456789-1234-4234-8234-123456789abc';else delete e[index].session_id;
 assert.equal(observe(e).outcome,'UNKNOWN');
});
test('timeout must be explicitly bounded; optional description is text only',()=>{
 for(const value of [undefined,null,0,15001,0.5,'15000',Infinity]){
  const e=events(),input=e[1].message.content[0].input;if(value===undefined)delete input.timeout;else input.timeout=value;
  assert.equal(observe(e).outcome,'UNKNOWN');
 }
 for(const value of [null,{},[],1,true]){const e=events();e[1].message.content[0].input.description=value;assert.equal(observe(e).outcome,'UNKNOWN');}
 for(const value of ['', 'Observe only fixed nonsecret descriptor metadata']){const e=events();e[1].message.content[0].input.description=value;assert.equal(observe(e).outcome,'OBSERVED_COMPATIBLE');}
});
test('contradictory or escaped duplicate JSON fields cannot choose a favorable last value',()=>{
 const duplicates=[
  JSON.stringify(metadata())+'\n{"schema":1,"scope":"NATIVE_STDIO_SHELL_STATUS_ONLY","status":74,"status":0}',
  JSON.stringify(metadata())+'\n{"schema":1,"scope":"NATIVE_STDIO_SHELL_STATUS_ONLY","status":74,"sta\\u0074us":0}',
  JSON.stringify(metadata()).replace('"pid":1234','"pid":0,"pid":1234')+'\n'+JSON.stringify(marker(0)),
  JSON.stringify(metadata()).replace('"type":"FIFO"','"type":"SOCKET","type":"FIFO"')+'\n'+JSON.stringify(marker(0)),
  JSON.stringify(metadata()).replace('"fd0_matches_dev_null":true','"fd0_matches_dev_null":false,"fd0_matches_dev_null":true')+'\n'+JSON.stringify(marker(0)),
 ];
 for(const content of duplicates)assert.equal(observe(events(content)).outcome,'UNKNOWN');
});
