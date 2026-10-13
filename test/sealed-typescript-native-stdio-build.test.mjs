// In-memory author controls only. No real fixture, clang, C helper, native agent,
// model, configuration change, secret or endpoint operation is selected here.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildNativeStdioProbe,verifyNativeStdioProbeBuild} from './acceptance/sealed-typescript-native-stdio-build.mjs';
import {prepareNativeStdioProbeCommand} from './acceptance/sealed-typescript-native-stdio-command.mjs';
import {sealedAssetsBuildProcessSummary} from './acceptance/sealed-typescript-native-assets-build.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './acceptance/sealed-typescript-closed-read-policy.mjs';
import {nativeDiagnosticArgv} from './acceptance/portable-claude-diagnostic.mjs';
import {nativeStdioProbeCommand,NATIVE_STDIO_SOURCE_SHA256} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
import {REVIEWED_CLAUDE_NATIVE,PINNED_READONLY_BASH_HEADS} from './acceptance/portable-claude-native-profile.mjs';
const buildURL=new URL('./acceptance/sealed-typescript-native-stdio-build.mjs',import.meta.url),commandURL=new URL('./acceptance/sealed-typescript-native-stdio-command.mjs',import.meta.url);
const buildSource=fs.readFileSync(buildURL,'utf8'),commandSource=fs.readFileSync(commandURL,'utf8'),c=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-probe.c',import.meta.url),'utf8');
const sha=v=>createHash('sha256').update(v).digest('hex'),base='/private/tmp/redue-ci-recipient-12345678',sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
const template=fileURLToPath(new URL('./sealed-typescript-native-stdio-probe.c',buildURL)),directory=base+'/prefix/native-probes',helper=directory+'/native-stdio-probe';
function mock(){
 let ino=1,fd=100;const nodes=new Map(),fds=new Map(),fixture=Object.freeze({base}),state={dispatches:[],reads:0,opens:0,closed:0,writes:0,fsyncs:0,verifyCount:0,fixtureValid:true,afterRead:null,fail:null,result:null};
 const put=(file,kind,body=Buffer.alloc(0),owner=501,mode=kind==='d'?0o40700n:0o100600n)=>nodes.set(file,{kind,body:Buffer.from(body),dev:1n,ino:BigInt(ino++),mode,uid:BigInt(owner),gid:20n,nlink:1n,size:BigInt(body.length),mtimeNs:1n,ctimeNs:1n});
 const ensureParents=file=>{for(let at=path.posix.dirname(file);;at=path.posix.dirname(at)){if(!nodes.has(at))put(at,'d',Buffer.alloc(0),at.startsWith('/Library')||['/','/private','/private/tmp'].includes(at)?0:501,0o40755n);if(at===path.posix.dirname(at))break;}};
 const tool={clangSha256:'1590ac950a3d627817d09ade5cb60b2115f17a72182a3141e010b4bcc482a0c9',sdk,headerPins:{'sys/stdio.h':'a8078ae1cba1a46a66d0de6fe7f13bbc969cdb7e78fc2d4b9a5c5cdaaf16126b','sys/fcntl.h':'9aca8ca87031ab7b670617e5af8b15a0cad8f34f7ab3bdb5dd799eb153b3ad0e','fcntl.h':'289f3be20c07d8eae5589f43994cfdb5fb33b3b099a6aee67f63e00d90039a8f','sys/mman.h':'07adbf7f11a601e6461ca508a2deca037103008600608f8dbe93a4b0887d46e9','sys/stat.h':'1546ce7485287bec0d15a643ef5d5f882d21272f2f089fed71c36457e609b92a'}};
 const headers={...tool.headerPins,'stdio.h':'d2220614f42d3cb678ae0de176ba0ab3256e15fb45b3efdb5d17b8ac1f6a4b54','errno.h':'ff95a158e0799dcf0622e83882e64d88f1783b98a91d9b206bcba2a12f8425e6','unistd.h':'8d535079658f063bcef358ef4c1c1b52b8e88dacfc22cbf4db0f6bf8abe40637'};
 let source=buildSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replaceAll('import.meta.url',JSON.stringify(buildURL.href));
 const replacements=[['5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc','/runtime/node',Buffer.from('MOCK_PINNED_NODE'),501],['1590ac950a3d627817d09ade5cb60b2115f17a72182a3141e010b4bcc482a0c9','/Library/Developer/CommandLineTools/usr/bin/clang',Buffer.from('MOCK_PINNED_CLANG'),0],['374d9f0713bce2c8a9e1e82bde51615d5433516a10d99b63107eb6ee70542e4c','/Library/Developer/CommandLineTools/usr/bin/ld',Buffer.from('MOCK_PINNED_LD'),0]];
 for(const [pin,file,body,owner] of replacements){source=source.replaceAll(pin,sha(body));if(tool.clangSha256===pin)tool.clangSha256=sha(body);ensureParents(file);put(file,'f',body,owner,0o100755n);}
 ensureParents(template);put(template,'f',Buffer.from(c));
 for(const [name,pin] of Object.entries(headers)){const body=Buffer.from('MOCK_HEADER '+name),file=sdk+'/usr/include/'+name;source=source.replaceAll(pin,sha(body));if(Object.hasOwn(tool.headerPins,name))tool.headerPins[name]=sha(body);ensureParents(file);put(file,'f',body,0,0o100644n);}
 ensureParents(base);put(base,'d');const sdkRow=nodes.get(sdk);sdkRow.uid=0n;sdkRow.mode=0o40755n;
 const stat=file=>{if(state.fail==='stat')throw Error('PRIVATE');const row=nodes.get(file);if(!row)throw Object.assign(Error('PRIVATE'),{code:'ENOENT'});return {...row,isDirectory:()=>row.kind==='d',isFile:()=>row.kind==='f',isSymbolicLink:()=>row.kind==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:1,O_NONBLOCK:2,O_WRONLY:4,O_CREAT:8,O_EXCL:16},lstatSync:stat,realpathSync:file=>state.fail==='realpath'?file+'-ALIAS':file,
  openSync(file,flags,mode){state.opens++;if(state.fail==='open')throw Error('PRIVATE');if(flags===31){assert.equal(mode,0o600);assert(!nodes.has(file));put(file,'f');}else assert.equal(flags,3);stat(file);const n=fd++;fds.set(n,file);return n;},fstatSync:n=>stat(fds.get(n)),
  readSync(n,bytes,offset,length,position){state.reads++;if(state.fail==='read')return -1;const file=fds.get(n),row=nodes.get(file),count=row.body.copy(bytes,offset,position,Math.min(position+length,row.body.length));if(state.afterRead)state.afterRead(file,position);return count;},
  writeSync(n,bytes,offset,length,position){state.writes++;if(state.fail==='write')return 0;const row=nodes.get(fds.get(n));row.body=Buffer.concat([row.body,bytes.subarray(offset,offset+length)]);row.size=BigInt(row.body.length);return length;},
  fsyncSync(){state.fsyncs++;if(state.fail==='fsync')throw Error('PRIVATE');},closeSync(n){state.closed++;fds.delete(n);if(state.fail==='close')throw Error('PRIVATE');},
  mkdirSync(file,options){assert.equal(options.mode,0o700);assert(!nodes.has(file));if(state.fail==='mkdir')throw Error('PRIVATE');put(file,'d');}};
 const verify=value=>{state.verifyCount++;return value===fixture&&state.fixtureValid?{outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',scope:'FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY',receiverBasePolicyMatch:true,ownedHandlesClosed:true,base}:{outcome:'UNKNOWN'};};
 const spawn=(file,argv,options)=>{state.dispatches.push({file,argv,options});const bytes=Buffer.alloc(32);bytes.writeUInt32LE(0xfeedfacf,0);bytes.writeUInt32LE(0x0100000c,4);put(helper,'f',bytes,501,0o100700n);return state.result??{pid:1001,status:0,signal:null,stdout:'',stderr:''};};
 const api=Function('fs','path','fileURLToPath','createHash','spawnSync','verifySealedTypeScriptSyntheticFixture','prepareSealedTypeScriptNativeAssetsProposal','sealedAssetsBuildProcessSummary','readNativeStdioProbeSource','NATIVE_STDIO_SOURCE_SHA256','process',source+';return {build:buildNativeStdioProbe,verify:verifyNativeStdioProbeBuild};')
 (io,path.posix,fileURLToPath,createHash,spawn,verify,()=>({toolchain:tool}),sealedAssetsBuildProcessSummary,()=>({source:c,sourceSha256:NATIVE_STDIO_SOURCE_SHA256}),NATIVE_STDIO_SOURCE_SHA256,{platform:'darwin',arch:'arm64',version:'v22.13.0',execPath:'/runtime/node',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20});
 const commandAPI=Function('verifyNativeStdioProbeBuild','nativeStdioProbeCommand','prepareSealedTypeScriptClosedReadCanaryPolicy','nativeDiagnosticArgv',commandSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ')+';return prepareNativeStdioProbeCommand;')
 (api.verify,nativeStdioProbeCommand,options=>{const p=prepareSealedTypeScriptClosedReadCanaryPolicy(options);if(state.policyAfter)state.policyAfter();return p;},nativeDiagnosticArgv);
 return {...api,command:commandAPI,fixture,state,nodes,fds,headerPaths:Object.keys(headers).map(name=>sdk+'/usr/include/'+name)};
}
const options=build=>({build,claudeExecutable:'/approved/native/claude',claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version});
function authority(v){for(const k of ['sealed','reuseEligible','recordAdoptionAuthority'])if(Object.hasOwn(v,k))assert.equal(v[k],false);assert.deepEqual(v.commands,[]);for(const k of ['helperExecutions','nativeLaunches','models'])assert.equal(v[k],0);assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');}

test('only a privately minted fixture can reach filesystem or a build; serialized labels cannot',()=>{
 const v=buildNativeStdioProbe({fixture:{base}});authority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.hostBase,null);assert.equal(v.dispatchAttemptCount,0);assert.equal(verifyNativeStdioProbeBuild(v).outcome,'UNKNOWN');
 assert.throws(()=>prepareNativeStdioProbeCommand(options(v)),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);
});
test('strict data options refuse getters, prototypes, flags, command and environment inputs',()=>{
 let n=0;const getter={};Object.defineProperty(getter,'fixture',{get(){n++;return {};}});
 for(const v of [getter,Object.create(null),{},null,{fixture:null,env:{}},{fixture:null,source:'OTHER'},{fixture:null,executable:'/other'}])assert.throws(()=>buildNativeStdioProbe(v),/NATIVE_STDIO_BUILD_OPTIONS/);assert.equal(n,0);
 for(const v of [null,{},Object.create(null),{...options(null),env:{}},{...options(null),command:'OTHER'}])assert.throws(()=>prepareNativeStdioProbeCommand(v),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);
});
test('held-stable mock builds exactly one fixed observer, with no Node copy/unrelated builds',()=>{
 const m=mock(),v=m.build({fixture:m.fixture});authority(v);assert.equal(v.outcome,'BUILT_NOT_EXECUTED');assert.equal(v.helper,helper);assert.equal(v.cwd,directory);assert.equal(v.sourceSha256,NATIVE_STDIO_SOURCE_SHA256);assert.equal(v.dispatchAttemptCount,1);assert.equal(v.build.completed,true);assert.equal(m.state.dispatches.length,1);
 const d=m.state.dispatches[0];assert.equal(d.file,'/Library/Developer/CommandLineTools/usr/bin/clang');assert.deepEqual(d.argv.slice(-3),[directory+'/native-stdio-probe.c','-o',helper]);assert.deepEqual(d.options,{cwd:directory,env:{TMPDIR:base},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});assert.equal(m.state.fsyncs,1);assert.equal(m.fds.size,0);assert.equal(m.verify(v).outcome,'BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');
 assert.equal(m.verify(JSON.parse(JSON.stringify(v))).outcome,'UNKNOWN');assert.doesNotMatch(buildSource,/copyFile|execSync|rmSync|readdir|setenv|process\.env/);
});
for(const fault of ['realpath','stat','open','read','close','mkdir','write','fsync'])test(`mock ${fault} failure never compiles or adopts a partial result`,()=>{
 const m=mock();m.state.fail=fault;const v=m.build({fixture:m.fixture});authority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(m.state.dispatches.length,0);assert.equal(m.fds.size,0);
});
for(const result of [{pid:0,status:0,signal:null},{pid:2147483648,status:0,signal:null},{pid:1.5,status:0,signal:null},{pid:1,status:74,signal:null},{pid:1,status:null,signal:'SIGKILL'},{pid:1,status:0,signal:null,error:Error('PRIVATE')}])test('actual noncomplete build outcome cannot mint a usable artifact',()=>{
 const m=mock();m.state.result=result;const v=m.build({fixture:m.fixture});assert.equal(v.outcome,'UNKNOWN');assert.equal(v.dispatchAttemptCount,1);assert.equal(v.build.completed,false);assert.equal(v.build.pidObserved,Number.isInteger(result.pid)&&result.pid>0&&result.pid<=2147483647);assert.equal(JSON.stringify(v).includes('PRIVATE'),false);assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.fds.size,0);
});
test('occupied prefix and forged fixture launch zero compiler processes',()=>{
 const m=mock();m.nodes.set(base+'/prefix',{...m.nodes.get(base),ino:999n});assert.equal(m.build({fixture:m.fixture}).outcome,'UNKNOWN');assert.equal(m.state.dispatches.length,0);
 const other=mock();assert.equal(other.build({fixture:{base}}).outcome,'UNKNOWN');assert.equal(other.state.dispatches.length,0);
});
for(const target of ['/runtime/node','/Library/Developer/CommandLineTools/usr/bin/clang','/Library/Developer/CommandLineTools/usr/bin/ld',template,...['sys/stat.h','stdio.h','errno.h','unistd.h'].map(name=>sdk+'/usr/include/'+name),helper])for(const fault of ['bytes','inode','owner','mode','hardlink','symlink'])test(`currentness loss ${path.basename(target)} ${fault} irreversibly invalidates`,()=>{
 const m=mock(),v=m.build({fixture:m.fixture}),row=m.nodes.get(target),saved={...row,body:Buffer.from(row.body)};assert.equal(v.outcome,'BUILT_NOT_EXECUTED');
 if(fault==='bytes')row.body[0]^=1;else if(fault==='inode')row.ino++;else if(fault==='owner')row.uid=999n;else if(fault==='mode')row.mode|=0o22n;else if(fault==='hardlink')row.nlink=2n;else row.kind='l';
 assert.equal(m.verify(v).outcome,'UNKNOWN');Object.assign(row,saved);const reads=m.state.reads;assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.state.reads,reads);assert.equal(m.fds.size,0);
});
for(const target of [base,base+'/prefix',directory,sdk,path.dirname(template)])test(`current directory/ancestry ${path.basename(target)} replacement permanently refuses`,()=>{
 const m=mock(),v=m.build({fixture:m.fixture}),row=m.nodes.get(target);row.ino++;assert.equal(m.verify(v).outcome,'UNKNOWN');row.ino--;assert.equal(m.verify(v).outcome,'UNKNOWN');
});
test('late header read replacing an earlier template cannot mint a compiled observer',()=>{
 const m=mock();m.state.afterRead=(file,position)=>{if(file===m.headerPaths.at(-1)&&position===0)m.nodes.get(template).ino++;};const v=m.build({fixture:m.fixture});assert.equal(v.outcome,'UNKNOWN');assert.equal(m.state.dispatches.length,0);assert.equal(m.fds.size,0);
});
test('late helper hash replacing an earlier row refuses full currentness, even if digest remains same',()=>{
 const m=mock(),v=m.build({fixture:m.fixture});m.state.afterRead=(file,position)=>{if(file===helper&&position===0)m.nodes.get(template).ino++;};assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.fds.size,0);
});
test('nested failed verification latches outer currentness despite restoration',()=>{
 const m=mock(),v=m.build({fixture:m.fixture});let nested=false;m.state.afterRead=(file,position)=>{if(!nested&&file===helper&&position===0){nested=true;m.state.fixtureValid=false;assert.equal(m.verify(v).outcome,'UNKNOWN');m.state.fixtureValid=true;}};assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(nested,true);
});
test('disabled proposal preserves exact denials and narrows reads/writes/sockets without effective-admission claim',()=>{
 const m=mock(),v=m.build({fixture:m.fixture}),p=m.command(options(v));authority(p);assert.equal(p.disabled,true);assert.equal(p.inferencePermitted,false);assert.equal(p.command_proposed,nativeStdioProbeCommand(base));assert.equal(p.cwd_proposed,directory);
 const before=prepareSealedTypeScriptClosedReadCanaryPolicy({base,claudeExecutable:'/approved/native/claude',claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version}).settings_proposed;
 assert.deepEqual(p.settings_proposed.permissions.deny,before.permissions.deny);assert.deepEqual(p.settings_proposed.sandbox.credentials,before.sandbox.credentials);assert.deepEqual(p.settings_proposed.sandbox.filesystem.denyRead,before.sandbox.filesystem.denyRead);
 assert(PINNED_READONLY_BASH_HEADS.includes('printf'));assert(p.settings_proposed.permissions.deny.includes('Bash(printf:*)'));assert.deepEqual(p.settings_proposed.permissions.allow,[`Bash(${p.command_proposed})`]);assert.deepEqual(p.settings_proposed.sandbox.filesystem.allowWrite,[]);assert.deepEqual(p.settings_proposed.sandbox.filesystem.allowRead,['/bin/bash',helper]);assert.deepEqual(p.settings_proposed.sandbox.network.allowUnixSockets,[]);
 assert.equal(p.settings_proposed.sandbox.failIfUnavailable,true);assert.equal(p.settings_proposed.sandbox.allowUnsandboxedCommands,false);assert.deepEqual(p.settings_proposed.sandbox.excludedCommands,[]);assert.equal(p.settings_proposed.sandbox.network.allowAllUnixSockets,false);assert.equal(p.settings_proposed.sandbox.network.allowLocalBinding,false);
 assert.equal(p.argv_proposed[p.argv_proposed.indexOf('--max-turns')+1],'4');assert.equal(p.parent_timeout_ms_proposed,120000);assert.equal(p.tool_timeout_ms_proposed,15000);assert(p.blockers.includes('EXACT_COMPOUND_BASH_ADMISSION_WITH_EXISTING_DENY_FAMILIES_NOT_OBSERVED'));assert(p.blockers.includes('DEV_NULL_METADATA_PERMISSION_NOT_OBSERVED'));assert(Object.isFrozen(p.settings_proposed));
 assert.equal(p.source_command_admission,'EXPECTED_DENIED_IF_NATIVE_PARSES_PRINTF_SUBCOMMAND');assert(p.blockers.includes('COMPOUND_PRINTF_SUBCOMMAND_HAS_RETAINED_DENY_RULE'));
});
test('modified, foreign, serialized build and changed source cannot select a native command',()=>{
 const m=mock(),v=m.build({fixture:m.fixture});for(const value of [{},null,JSON.parse(JSON.stringify(v))])assert.throws(()=>m.command(options(value)),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);
 m.nodes.get(helper).body[0]^=1;assert.throws(()=>m.command(options(v)),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);
});
test('policy construction followed by a changed build cannot emit a current native proposal',()=>{
 const m=mock(),v=m.build({fixture:m.fixture});m.state.policyAfter=()=>{m.nodes.get(template).ino++;};assert.throws(()=>m.command(options(v)),/NATIVE_STDIO_COMMAND_UNAVAILABLE/);assert.equal(m.verify(v).outcome,'UNKNOWN');
});
