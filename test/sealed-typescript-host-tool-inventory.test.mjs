import test from 'node:test';import assert from 'node:assert/strict';
import {publicDeveloperPath} from './acceptance/sealed-typescript-host-tool-inventory.mjs';
test('public tool inventory path classifier never authorizes arbitrary, normalized-away or credential paths',()=>{
 for(const [file,kind] of [['/Applications/Xcode_26.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang','CLANG'],['/Library/Developer/CommandLineTools/usr/bin/ld','LD'],['/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.0.sdk','SDK']])assert(publicDeveloperPath(file,kind));
 for(const file of ['/private/credential/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/../secret/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/A\nB/usr/bin/clang','/Applications/Xcode.app/Contents/Developer/SDKs/MacOSX.sdk/extra','/Library/Developer/CommandLineTools/usr/bin/clang;evil'])for(const kind of ['CLANG','LD','SDK','OTHER'])assert.equal(publicDeveloperPath(file,kind),false);
});

// Source/in-memory IO controls only. No actual inventory, xcrun, compiler,
// helper, native/model, credential or workflow operation is selected here.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-host-tool-inventory.mjs',import.meta.url),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex'),literal='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk',selected='/Applications/Xcode_26.0.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.0.sdk';
const headers=['sys/stdio.h','sys/fcntl.h','fcntl.h','sys/mman.h','sys/stat.h','stdio.h','errno.h','unistd.h'];
const requiredTools={clang:'/Library/Developer/CommandLineTools/usr/bin/clang',ld:'/Library/Developer/CommandLineTools/usr/bin/ld'},selectedTools={clang:'/Applications/Xcode_26.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang',ld:'/Applications/Xcode_26.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ld'};
const installedSdk='/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk',cltAlias='/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk';
const inspectionTool='/Library/Developer/CommandLineTools/usr/bin/llvm-objdump';
const stock=['/private/etc/profile','/private/etc/bashrc','/bin/bash','/usr/libexec/path_helper'];
function mock(){
 let ino=1,fd=100;const nodes=new Map(),fds=new Map(),state={opens:[],reads:[],realpaths:[],calls:[],selected,selectedTools:{...requiredTools},failPath:null,failCode:'ENOENT',afterRead:null,result:null,link:'private/etc',noncanonicalPath:null,failOpenPath:null,failReadPath:null,fdIdentityPath:null,failClosePath:null,afterClose:null,lookupAliases:new Map(),cltLink:'MacOSX26.5.sdk',cltRealpath:installedSdk,virtualFile:null,afterReadlink:null,afterRealpath:null};
 const put=(p,kind='f',body='PUBLIC_MOCK',uid=0)=>nodes.set(p,{kind,body:Buffer.from(body),dev:1n,ino:BigInt(ino++),uid:BigInt(uid),gid:20n,mode:kind==='d'?0o40755n:kind==='l'?0o120777n:0o100644n,nlink:1n,size:BigInt(Buffer.byteLength(body)),mtimeNs:1n,ctimeNs:1n});
 const parents=p=>{for(let a=path.posix.dirname(p);;a=path.posix.dirname(a)){if(!nodes.has(a))put(a,'d','',0);if(a===path.posix.dirname(a))return;}};
 for(const p of ['/usr/bin/xcrun','/runtime/node','/Library/Developer/CommandLineTools/usr/bin/clang','/Library/Developer/CommandLineTools/usr/bin/ld',inspectionTool,...stock]){parents(p);put(p,'f',p==='/runtime/node'?'MOCK_NODE':'PUBLIC_MOCK',p==='/runtime/node'?501:0);}
 for(const sdk of [selected,literal,installedSdk])for(const name of headers){const p=sdk+'/usr/include/'+name;parents(p);put(p,'f',sdk+' '+name);}
 put('/etc','l','private/etc');put(cltAlias,'l','MacOSX26.5.sdk');
 const stat=p=>{if(p===state.failPath)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:state.failCode});const row=nodes.get(p);if(!row)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:'ENOENT'});return {...row,isFile:()=>row.kind==='f',isDirectory:()=>row.kind==='d',isSymbolicLink:()=>row.kind==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:1,O_NONBLOCK:2},lstatSync:stat,realpathSync:p=>{state.realpaths.push(p);stat(state.lookupAliases.get(p)||p);const value=state.lookupAliases.get(p)||(p==='/etc'?'/private/etc':p===cltAlias?(nodes.get(p).kind==='d'?cltAlias:state.cltRealpath):p===state.noncanonicalPath&&state.realpaths.filter(v=>v===p).length>1?p+'.alias':p);state.afterRealpath?.(p);return value;},readlinkSync:p=>{assert(['/etc',cltAlias].includes(p));const value=p==='/etc'?state.link:state.cltLink;state.afterReadlink?.(p);return value;},
  openSync(p,flags){assert.equal(flags,3);if(p===state.failOpenPath)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:'EACCES'});stat(p);state.opens.push(p);const n=fd++;fds.set(n,p);return n;},fstatSync:n=>{const p=fds.get(n),row=stat(p);if(p===state.fdIdentityPath)row.ino++;return row;},
  readSync(n,b,o,l,p){const file=fds.get(n);if(file===state.failReadPath)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:'EIO'});state.reads.push(file);if(file===state.virtualFile){b.fill(0,o,o+l);state.afterRead?.(file);return l;}const r=nodes.get(file),count=r.body.copy(b,o,p,Math.min(p+l,r.body.length));state.afterRead?.(file);return count;},closeSync:n=>{assert(fds.has(n));const p=fds.get(n);fds.delete(n);state.afterClose?.(p);if(p===state.failClosePath)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:'EIO'});}};
 const spawn=(file,argv,opts)=>{assert.equal(file,'/usr/bin/xcrun');assert.deepEqual(opts,{env:{},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});state.calls.push([...argv]);return state.result??{pid:1234,status:0,signal:null,stderr:'',stdout:(argv[0]==='--sdk'?state.selected:state.selectedTools[argv[1]])+'\n'};};
 const p={platform:'darwin',arch:'arm64',version:'v22.13.0',execPath:'/runtime/node',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20};
 const code=source.slice(0,source.indexOf('if(process.argv[1]')).replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replace('5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',sha('MOCK_NODE'));
 const inventory=Function('fs','path','os','createHash','spawnSync','process',code+';return inventoryPublicSealedTools;')(io,path,{release:()=> 'SYNTHETIC_OS_NOT_ACCEPTANCE'},createHash,spawn,p);
 return {inventory,state,nodes,fds,put,parents,process:p};
}
function noAuthority(report){assert.equal(report.profileApproved,false);for(const k of ['sealed','reuseEligible'])assert.equal(report[k],false);for(const k of ['models','nativeAgentLaunches','compilerCheckExecutions'])assert.equal(report[k],0);assert.equal(JSON.stringify(report).includes('PROTECTED_PRIVATE_ERROR'),false);assert.equal(Object.hasOwn(report,'environment'),false);assert.equal(report.inspectionTool.scope,'OBSERVATIONAL_NOT_EXECUTION_ACCEPTED');assert.equal(Object.hasOwn(report.inspectionTool,'version'),false);assert.equal(Object.hasOwn(report.inspectionTool,'executionAccepted'),false);}
test('fixed mocks capture selected and requiredSDK independently plus allstdio/startup publicfiles',()=>{
 const m=mock(),r=m.inventory();noAuthority(r);assert.equal(r.outcome,'PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED');assert.equal(r.phase,'COMPLETE');assert.equal(r.sdk.canonical,selected);assert.equal(r.requiredSdk.canonical,literal);assert.notEqual(r.sdk.headers['stdio.h'].sha256,r.requiredSdk.headers['stdio.h'].sha256);assert.deepEqual(Object.keys(r.sdk.headers),headers);assert.deepEqual(Object.keys(r.requiredSdk.headers),headers);assert.deepEqual(Object.keys(r.stockStartup),stock);assert.equal(r.etcAlias.canonicalMatch,true);assert.equal(m.fds.size,0);
 assert.deepEqual(m.state.calls,[['--find','clang'],['--find','ld'],['--sdk','macosx','--show-sdk-path']]);assert(m.state.opens.every(p=>p!=='/etc'&&p!=='/private/etc'));assert(r.stockStartup['/bin/bash'].stat.regularFile);assert.equal(r.requiredSdk.headers['errno.h'].stat.singleLink,true);
});
test('same selectedSDK text still performs independent requiredSDK reads without granting match',()=>{
 const m=mock();m.state.selected=literal;const r=m.inventory();noAuthority(r);assert.equal(r.sdk.canonical,r.requiredSdk.canonical);assert.equal(m.state.opens.filter(p=>p===literal+'/usr/include/unistd.h').length,2);
});
for(const code of ['ENOENT','EACCES','EPERM','ENOTDIR','EIO'])test(`requiredSDK ${code} retains other publicfacts asUNKNOWN`,()=>{
 const m=mock();m.state.failPath=literal;m.state.failCode=code;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'COMPLETE_WITH_UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_SDK_FILES',code}]);assert.equal(Object.keys(r.sdk.headers).length,8);assert.equal(Object.keys(r.stockStartup).length,4);assert.equal(r.requiredSdk.observationPhase,'DIRECTORY_METADATA');assert.equal(m.fds.size,0);
});
for(const p of [selected+'/usr/include/stdio.h',literal+'/usr/include/errno.h',...stock])test('fixed missing publicfile is boundedUNKNOWN with partialfacts, never bodylogging',()=>{
 const m=mock();m.state.failPath=p;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert(r.failures.some(v=>v.code==='ENOENT'));assert.equal(m.fds.size,0);assert(!m.state.opens.includes(p));
});
test('late installedheader contentidentity mutation isUNKNOWN and closes fd',()=>{
 const m=mock(),file=literal+'/usr/include/unistd.h';m.state.afterRead=p=>{if(p===file)m.nodes.get(file).ino++;};const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.requiredSdk.observationPhase,'HEADER:unistd.h');assert.equal(m.fds.size,0);
});
test('SDK/header symlink substitution is not normalized into observedfiles',()=>{
 const m=mock(),file=literal+'/usr/include/stdio.h';m.nodes.get(file).kind='l';const r=m.inventory();assert.equal(r.outcome,'UNKNOWN');assert(!m.state.opens.includes(file));noAuthority(r);
});
test('unexpected /etc alias neither follows nor emits arbitrary target',()=>{
 const m=mock();m.state.link='/Users/owner/PROTECTED_CREDENTIAL';const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.etcAlias,null);assert.equal(m.state.realpaths.includes('/etc'),false);assert.equal(JSON.stringify(r).includes('PROTECTED_CREDENTIAL'),false);
});
for(const result of [{pid:1234,status:1,signal:null,stdout:'',stderr:'PRIVATE_TOOL_ERROR'},{pid:1234,status:0,signal:'SIGKILL',stdout:selected+'\n',stderr:''},{pid:1234,status:0,signal:null,stdout:'/private/credential/SDK/MacOSX27.0.sdk\n',stderr:''}])test('existing xcrun metadata protocol failure doesnot execute returned tools or exposepayloads',()=>{
 const m=mock();m.state.result=result;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'SELECTED_TOOL_PATHS');assert.equal(JSON.stringify(r).includes('PRIVATE_TOOL_ERROR'),false);assert.equal(m.state.calls.length,1);
});
test('unsupported platform or injected options cannot request additional paths',()=>{
 const m=mock();m.process.platform='linux';assert.equal(m.inventory().outcome,'UNKNOWN');assert.equal(m.state.opens.length,0);assert.equal(m.inventory({path:'/owner/private'}).outcome,'UNKNOWN');assert.equal(m.state.calls.length,0);
});
test('source performs fixed hashes/aliasmetadata only, no directorybody walk or envdump/newexecution',()=>{
 assert.doesNotMatch(source,/process\.env|readdir|readFileSync|copyFile|writeFile|mkdtemp|spawn\(|execFile|fetch\(|http\.request/);assert.equal((source.match(/spawnSync\(/g)??[]).length,1);assert(source.includes("spawnSync('/usr/bin/xcrun'"));
});

test('selected Xcode tools and literal required CLT tools retain independent canonical identity and bytes',()=>{
 const m=mock();for(const name of ['clang','ld']){m.state.selectedTools[name]=selectedTools[name];m.parents(selectedTools[name]);m.put(selectedTools[name],'f','SELECTED_XCODE_'+name);}
 const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED');for(const name of ['clang','ld']){assert.equal(r.tools[name].canonical,selectedTools[name]);assert.equal(r.requiredTools[name].canonical,requiredTools[name]);assert.notEqual(r.tools[name].sha256,r.requiredTools[name].sha256);}assert.equal(m.fds.size,0);
});
for(const name of ['clang','ld'])test('missing literal CLT '+name+' is UNKNOWN while selected Xcode bytes remain observed',()=>{
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.nodes.delete(requiredTools[name]);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'COMPLETE_WITH_UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'ENOENT'},...(name==='clang'?[{phase:'OBSERVATIONAL_CLT_CLANG',code:'ENOENT'}]:[])]);assert(r.tools[name].sha256);assert.deepEqual(r.requiredTools[name],{canonical:requiredTools[name],observationPhase:'CANONICAL_PATH'});assert.equal(Object.keys(r.stockStartup).length,4);assert.equal(m.fds.size,0);
});
for(const name of ['clang','ld'])test('late required CLT '+name+' mutation remains UNKNOWN despite valid selected Xcode bytes',()=>{
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.state.afterRead=p=>{if(p===requiredTools[name])m.nodes.get(p).ino++;};const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'UNSUPPORTED_OR_CHANGED',guardReason:'CLOSING_FD_IDENTITY_CHANGED'},...(name==='clang'?[{phase:'OBSERVATIONAL_CLT_CLANG',code:'UNSUPPORTED_OR_CHANGED',guardReason:'CLOSING_FD_IDENTITY_CHANGED'}]:[])]);assert(r.tools[name].sha256);assert.equal(m.fds.size,0);
});
for(const [name,limit]of [['clang',128*1024*1024],['ld',16*1024*1024]])test('required CLT '+name+' uses actual builder bound, not broader selected-tool bound',()=>{
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.nodes.get(requiredTools[name]).size=BigInt(limit+1);if(name==='clang')m.state.virtualFile=requiredTools.clang;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'UNSUPPORTED_OR_CHANGED',guardReason:'SIZE_UNSUPPORTED'}]);assert.equal(m.state.opens.filter(p=>p===requiredTools[name]).length,name==='clang'?1:0);assert.equal(m.fds.size,0);
});

function xcodeSelected(m){for(const name of ['clang','ld']){m.state.selectedTools[name]=selectedTools[name];m.parents(selectedTools[name]);m.put(selectedTools[name],'f','SELECTED_XCODE_'+name);}}
function partialAfterSelectedRejection(m,r,reason){
 noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'COMPLETE_WITH_UNKNOWN');assert.equal(r.tools.clang.canonical,selectedTools.clang);assert.equal(r.tools.clang.sha256,undefined);assert.equal(r.tools.ld.canonical,selectedTools.ld);assert(r.tools.ld.sha256);
 assert.deepEqual(r.failures,[{phase:'SELECTED_TOOL_BYTES:clang',code:'UNSUPPORTED_OR_CHANGED',guardReason:reason}]);
 for(const name of ['clang','ld'])assert(r.requiredTools[name].sha256);assert.equal(Object.keys(r.sdk.headers).length,8);assert.equal(Object.keys(r.requiredSdk.headers).length,8);assert.equal(Object.keys(r.stockStartup).length,4);assert.equal(r.etcAlias.canonicalMatch,true);assert.equal(m.fds.size,0);
}
for(const [label,change,reason,key,value]of [
 ['directory',row=>row.kind='d','FILE_TYPE_UNSUPPORTED','type','DIRECTORY'],
 ['symlink',row=>row.kind='l','FILE_TYPE_UNSUPPORTED','type','SYMLINK'],
 ['caller owner',row=>row.uid=501n,'OWNER_MISMATCH','owner','CALLER'],
 ['multiple links',row=>row.nlink=2n,'LINK_COUNT_UNSUPPORTED','singleLink',false],
 ['writable mode',row=>row.mode=0o100666n,'PERMISSIONS_UNSUPPORTED','permissionsAccepted',false],
 ['empty file',row=>row.size=0n,'SIZE_UNSUPPORTED','size','EMPTY_OR_INVALID'],
 ['oversized file',row=>row.size=BigInt(256*1024*1024+1),'SIZE_UNSUPPORTED','size','OVER_LIMIT'],
])test('selected '+label+' rejection retains fixed public facts and precise nonsecret metadata without bodyread',()=>{
 const m=mock();xcodeSelected(m);change(m.nodes.get(selectedTools.clang));const r=m.inventory();partialAfterSelectedRejection(m,r,reason);assert.equal(r.tools.clang.observationPhase,'FILE_METADATA');assert.equal(r.tools.clang.metadata[key],value);assert(!m.state.opens.includes(selectedTools.clang));assert(!m.state.reads.includes(selectedTools.clang));
});
test('noncanonical selected file reports only mismatch, retains original canonical lookup and other fixed groups',()=>{
 const m=mock();xcodeSelected(m);m.state.noncanonicalPath=selectedTools.clang;const r=m.inventory();partialAfterSelectedRejection(m,r,'NON_CANONICAL');assert.equal(r.tools.clang.observationPhase,'CANONICAL_PATH');assert.deepEqual(r.tools.clang.metadata,{canonicalMatch:false});assert(!m.state.opens.includes(selectedTools.clang));assert(!JSON.stringify(r).includes('.alias'));
});
test('selected read-only open denial preserves actual closed error code and fixed-group observations',()=>{
 const m=mock();xcodeSelected(m);m.state.failOpenPath=selectedTools.clang;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.tools.clang.canonical,selectedTools.clang);assert.equal(r.tools.clang.observationPhase,'OPEN_READ_ONLY');assert.deepEqual(r.failures,[{phase:'SELECTED_TOOL_BYTES:clang',code:'EACCES'}]);assert(!m.state.reads.includes(selectedTools.clang));assert(r.requiredTools.clang.sha256);assert(r.stockStartup['/bin/bash'].sha256);
});
test('selected starting fd identity mismatch reads no body and preserves actual closure observation',()=>{
 const m=mock();xcodeSelected(m);m.state.fdIdentityPath=selectedTools.clang;const r=m.inventory();partialAfterSelectedRejection(m,r,'OPEN_FD_IDENTITY_CHANGED');assert.equal(r.tools.clang.observationPhase,'START_FD_IDENTITY');assert.equal(r.tools.clang.fdClose,'CLOSED');assert(!m.state.reads.includes(selectedTools.clang));
});
test('selected body read failure keeps EIO distinct from guard refusal without raw exception output',()=>{
 const m=mock();xcodeSelected(m);m.state.failReadPath=selectedTools.clang;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.tools.clang.observationPhase,'BODY_HASH');assert.equal(r.tools.clang.fdClose,'CLOSED');assert.deepEqual(r.failures,[{phase:'SELECTED_TOOL_BYTES:clang',code:'EIO'}]);assert.equal(r.tools.clang.sha256,undefined);assert(r.requiredTools.ld.sha256);assert.equal(m.fds.size,0);
});
test('selected post-read fd change keeps precise closing failure and does not publish hash',()=>{
 const m=mock();xcodeSelected(m);m.state.afterRead=p=>{if(p===selectedTools.clang)m.nodes.get(p).ino++;};const r=m.inventory();partialAfterSelectedRejection(m,r,'CLOSING_FD_IDENTITY_CHANGED');assert.equal(r.tools.clang.observationPhase,'CLOSING_FD_IDENTITY');assert.equal(r.tools.clang.fdClose,'CLOSED');
});
for(const ancestor of [false,true])test('selected closing '+(ancestor?'ancestor':'name')+' change remains UNKNOWN with precise static reason',()=>{
 const m=mock();xcodeSelected(m);m.state.afterClose=p=>{if(p===selectedTools.clang)m.nodes.get(ancestor?path.dirname(p):p).ino++;};const r=m.inventory();partialAfterSelectedRejection(m,r,ancestor?'CLOSING_ANCESTOR_IDENTITY_CHANGED':'CLOSING_NAME_IDENTITY_CHANGED');assert.equal(r.tools.clang.observationPhase,ancestor?'CLOSING_ANCESTOR_IDENTITY':'CLOSING_NAME_IDENTITY');
});
test('failed selected fd close never becomes claimed successful closure or a published hash',()=>{
 const m=mock();xcodeSelected(m);m.state.failClosePath=selectedTools.clang;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.tools.clang.fdClose,'NOT_OBSERVED');assert.equal(r.tools.clang.sha256,undefined);assert.deepEqual(r.failures,[{phase:'SELECTED_TOOL_BYTES:clang',code:'EIO'}]);assert(r.requiredTools.clang.sha256);assert.equal(Object.keys(r.stockStartup).length,4);
});

test('public lookup text is retained separately from its validated public canonical tool path',()=>{
 const m=mock();xcodeSelected(m);const lookup='/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang';m.state.selectedTools.clang=lookup;m.state.lookupAliases.set(lookup,selectedTools.clang);const r=m.inventory();noAuthority(r);assert.equal(r.tools.clang.lookup,lookup);assert.equal(r.tools.clang.canonical,selectedTools.clang);assert(r.tools.clang.sha256);assert.equal(r.sdk.lookup,selected);
});
for(const lookup of ['/Users/owner/private/usr/bin/clang','/private/credential/SDK/MacOSX27.0.sdk','/Applications/Xcode.app/Contents/Developer/../private/usr/bin/clang'])test('nonpublic original lookup is rejected before filesystem resolution and never emitted',()=>{
 const m=mock();m.state.result={pid:1234,status:0,signal:null,stderr:'',stdout:lookup+'\n'};const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'SELECTED_TOOL_PATHS');assert(!m.state.realpaths.includes(lookup));assert(!JSON.stringify(r).includes(lookup));assert.equal(m.state.calls.length,1);
});
for(const [size,value]of [[0n,0],[-1n,null],[BigInt(Number.MAX_SAFE_INTEGER)+1n,null]])test('file size metadata uses exact safe integer or null and never loses precision',()=>{
 const m=mock();m.nodes.get(requiredTools.clang).size=size;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.tools.clang.metadata.byteSize,value);assert.equal(r.requiredTools.clang.metadata.byteSize,value);assert.equal(r.observedClt.clang.metadata.byteSize,value);assert(!m.state.opens.includes(requiredTools.clang));
});
test('over128MiB root CLT observation does not change original builder limit or grant build acceptance',()=>{
 const m=mock();xcodeSelected(m);const size=128*1024*1024+1;m.nodes.get(requiredTools.clang).size=BigInt(size);m.state.virtualFile=requiredTools.clang;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:clang',code:'UNSUPPORTED_OR_CHANGED',guardReason:'SIZE_UNSUPPORTED'}]);assert.equal(r.requiredTools.clang.metadata.byteSize,size);assert.equal(r.requiredTools.clang.sha256,undefined);assert.equal(r.observedClt.scope,'OBSERVATIONAL_NOT_BUILD_ACCEPTED');assert.equal(r.observedClt.clang.bytes,size);assert(r.observedClt.clang.sha256);assert.equal(m.state.opens.filter(p=>p===requiredTools.clang).length,1);
});
test('over512MiB root CLT file is metadata only and rejected under both unchanged and observational caps',()=>{
 const m=mock();xcodeSelected(m);const size=512*1024*1024+1;m.nodes.get(requiredTools.clang).size=BigInt(size);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.observedClt.clang.metadata.byteSize,size);assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:clang',code:'UNSUPPORTED_OR_CHANGED',guardReason:'SIZE_UNSUPPORTED'},{phase:'OBSERVATIONAL_CLT_CLANG',code:'UNSUPPORTED_OR_CHANGED',guardReason:'SIZE_UNSUPPORTED'}]);assert(!m.state.opens.includes(requiredTools.clang));assert.equal(r.observedClt.clang.sha256,undefined);
});
for(const [change,reason,key,value]of [[row=>row.uid=501n,'OWNER_MISMATCH','owner','CALLER'],[row=>row.kind='f','FILE_TYPE_UNSUPPORTED','type','REGULAR_FILE'],[row=>row.mode=0o40777n,'PERMISSIONS_UNSUPPORTED','permissionsAccepted',false]])test('SDK directory refusal retains closed nonsecret metadata before header body reads',()=>{
 const m=mock();change(m.nodes.get(selected));const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.sdk.directory[key],value);assert.equal(r.sdk.directory.canonical,null);assert.equal(r.sdk.directory.closingIdentityChecked,false);assert.deepEqual(r.failures,[{phase:'SELECTED_SDK_FILES',code:'UNSUPPORTED_OR_CHANGED',guardReason:reason}]);assert(!m.state.opens.some(p=>p.startsWith(selected+'/usr/include/')));assert.equal(Object.keys(r.observedClt.sdk.headers).length,8);
});
for(const target of ['/private/credential','../MacOSX26.5.sdk','MacOSX26.5.sdk/extra','MacOSX26.5.sdk\n','MacOSX26.5.sdk\0','MacOSX.sdk','MacOSX%2F26.sdk','MacOSX'+('1'.repeat(65))+'.sdk'])test('fixed CLT alias rejects malformed or outside target before follow or publication',()=>{
 const m=mock();m.state.cltLink=target;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_CLT_SDK',code:'UNSUPPORTED_OR_CHANGED',guardReason:'SDK_ALIAS_TARGET_UNSUPPORTED'}]);assert.equal(r.observedClt.sdk.canonical,undefined);assert(!m.state.realpaths.includes(cltAlias));assert(!m.state.opens.some(p=>p.startsWith(installedSdk+'/usr/include/')));assert.equal(Object.hasOwn(r.observedClt.sdk,'target'),false);if(target!=='MacOSX.sdk')assert(!JSON.stringify(r.observedClt.sdk).includes(target));
});
for(const [change,reason]of [[row=>row.kind='l','FILE_TYPE_UNSUPPORTED'],[row=>row.uid=501n,'OWNER_MISMATCH'],[row=>row.mode=0o40777n,'PERMISSIONS_UNSUPPORTED']])test('CLT alias destination must be root-owned nonwritable real directory before follow',()=>{
 const m=mock();change(m.nodes.get(installedSdk));const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_CLT_SDK',code:'UNSUPPORTED_OR_CHANGED',guardReason:reason}]);assert(!m.state.realpaths.includes(cltAlias));assert(!m.state.opens.some(p=>p.startsWith(installedSdk+'/usr/include/')));
});
test('CLT alias root-owned ancestor guard rejects caller-owned namespace without target body reads',()=>{
 const m=mock();m.nodes.get(path.dirname(cltAlias)).uid=501n;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert(r.failures.some(f=>f.phase==='OBSERVATIONAL_CLT_SDK'&&f.guardReason==='OWNER_MISMATCH'));assert(!m.state.realpaths.includes(cltAlias));assert(!m.state.opens.some(p=>p.startsWith(installedSdk+'/usr/include/')));
});
test('unversioned real CLT SDK directory is measured without inventing a version or satisfying absent literalSDK27',()=>{
 const m=mock();m.put(cltAlias,'d','');for(const name of headers){const p=cltAlias+'/usr/include/'+name;m.parents(p);m.put(p,'f','UNVERSIONED '+name);}m.nodes.delete(literal);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_SDK_FILES',code:'ENOENT'}]);assert.equal(r.observedClt.sdk.targetClassification,'UNVERSIONED_REAL_DIRECTORY');assert.equal(r.observedClt.sdk.canonical,cltAlias);assert.equal(r.observedClt.sdk.aliasPhase,'COMPLETE');assert.equal(Object.keys(r.observedClt.sdk.headers).length,8);assert.equal(r.requiredSdk.canonical,literal);
});
for(const change of ['aliasIdentity','aliasText','destination','ancestor'])test('installed CLT '+change+' change during header capture leaves truthful partial observations UNKNOWN',()=>{
 const m=mock();let changed=false;m.state.afterRead=p=>{if(p===installedSdk+'/usr/include/unistd.h'&&!changed){changed=true;if(change==='aliasText')m.state.cltLink='MacOSX26.6.sdk';else m.nodes.get(change==='aliasIdentity'?cltAlias:change==='destination'?installedSdk:path.dirname(cltAlias)).ino++;}};const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_CLT_SDK',code:'UNSUPPORTED_OR_CHANGED',guardReason:change.startsWith('alias')?'SDK_ALIAS_IDENTITY_CHANGED':'CLOSING_ANCESTOR_IDENTITY_CHANGED'}]);assert.notEqual(r.observedClt.sdk.aliasPhase,'COMPLETE');assert.equal(m.fds.size,0);
});
test('CLT alias canonical mismatch never publishes outside destination or reads its headers',()=>{
 const m=mock();m.state.cltRealpath='/private/credential';const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_CLT_SDK',code:'UNSUPPORTED_OR_CHANGED',guardReason:'NON_CANONICAL'}]);assert.equal(r.observedClt.sdk.canonical,undefined);assert(!JSON.stringify(r).includes('/private/credential'));assert(!m.state.opens.some(p=>p.startsWith(installedSdk+'/usr/include/')));
});
test('valid observed CLT versioned alias retains absent original SDK27 and all authority refusals',()=>{
 const m=mock();m.nodes.delete(literal);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.observedClt.scope,'OBSERVATIONAL_NOT_BUILD_ACCEPTED');assert.equal(r.observedClt.sdk.canonical,installedSdk);assert.equal(r.observedClt.sdk.targetClassification,'VERSIONED_RELATIVE_SIBLING');assert.equal(r.observedClt.sdk.aliasPhase,'COMPLETE');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_SDK_FILES',code:'ENOENT'}]);assert.equal(m.state.calls.length,3);assert.equal(Object.keys(r.observedClt.sdk.headers).length,8);
});

// Endpoint-consistency fault injection only: unchanged returned target text is
// insufficient when the alias identity changed during a closing operation.
for(const operation of ['readlink','realpath'])test('CLT alias replacement during final '+operation+' cannot be reported COMPLETE',()=>{
 const m=mock();let calls=0;m.state[operation==='readlink'?'afterReadlink':'afterRealpath']=p=>{if(p===cltAlias&&++calls===2)m.nodes.get(cltAlias).ino++;};
 const r=m.inventory();noAuthority(r);assert.equal(calls,2);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.observedClt.sdk.aliasPhase,'ALIAS_CLOSURE');assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_CLT_SDK',code:'UNSUPPORTED_OR_CHANGED',guardReason:'SDK_ALIAS_IDENTITY_CHANGED'}]);assert.equal(m.fds.size,0);
});

function inspectionFailure(m,r,reason,code='UNSUPPORTED_OR_CHANGED'){
 noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'COMPLETE_WITH_UNKNOWN');assert.equal(r.inspectionTool.canonical,inspectionTool);assert.equal(r.inspectionTool.sha256,undefined);
 assert.deepEqual(r.failures,[{phase:'OBSERVATIONAL_INSPECTION_TOOL',code,...(reason?{guardReason:reason}:{})}]);
 assert(r.observedClt.clang.sha256);assert.equal(r.observedClt.sdk.aliasPhase,'COMPLETE');assert.equal(Object.keys(r.sdk.headers).length,8);assert.equal(Object.keys(r.requiredSdk.headers).length,8);assert.equal(Object.keys(r.stockStartup).length,4);assert.equal(r.etcAlias.canonicalMatch,true);
 assert.deepEqual(m.state.calls,[['--find','clang'],['--find','ld'],['--sdk','macosx','--show-sdk-path']]);assert.equal(m.fds.size,0);
}
test('fixed inspection tool captures only public bytes with no invocation, version assumption or authority',()=>{
 const m=mock(),r=m.inventory();noAuthority(r);assert.equal(r.outcome,'PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED');assert.equal(r.inspectionTool.canonical,inspectionTool);assert.equal(r.inspectionTool.observationPhase,'COMPLETE');assert.equal(r.inspectionTool.fdClose,'CLOSED');assert.equal(r.inspectionTool.sha256,sha('PUBLIC_MOCK'));assert.equal(r.inspectionTool.bytes,Buffer.byteLength('PUBLIC_MOCK'));assert.equal(r.inspectionTool.owner,'ROOT');assert(r.inspectionTool.stat.closingIdentityChecked);
 assert.equal(m.state.opens.filter(p=>p===inspectionTool).length,1);assert.equal(m.state.reads.filter(p=>p===inspectionTool).length,1);assert.deepEqual(m.state.calls,[['--find','clang'],['--find','ld'],['--sdk','macosx','--show-sdk-path']]);assert.equal(m.fds.size,0);
 const allowed=new Set(['/usr/bin/xcrun','/runtime/node',...Object.values(requiredTools),inspectionTool,...stock,...[selected,literal,installedSdk].flatMap(sdk=>headers.map(name=>sdk+'/usr/include/'+name))]);assert(m.state.opens.every(p=>allowed.has(p)));
 assert.equal(JSON.stringify(r).includes('PUBLIC_MOCK'),false);assert.doesNotMatch(source,/codesign|llvm-objdump.*--|--disassemble|--version|--macho|--debuginfod/);
});
for(const code of ['ENOENT','EACCES','EPERM','ENOTDIR','EIO'])test(`inspection tool ${code} preserves every prior fixed group without a fallback`,()=>{
 const m=mock();m.state.failPath=inspectionTool;m.state.failCode=code;const r=m.inventory();inspectionFailure(m,r,null,code);assert.equal(r.inspectionTool.observationPhase,'CANONICAL_PATH');assert(!m.state.opens.includes(inspectionTool));assert(!m.state.reads.includes(inspectionTool));
});
test('inspection tool alias cannot follow a private target body or publish its path',()=>{
 const m=mock(),privateTarget='/private/PROTECTED_CREDENTIAL';m.put(privateTarget,'f','PROTECTED_BODY',501);m.state.lookupAliases.set(inspectionTool,privateTarget);const r=m.inventory();inspectionFailure(m,r,'NON_CANONICAL');assert.deepEqual(r.inspectionTool.metadata,{canonicalMatch:false});assert(!m.state.opens.includes(inspectionTool));assert(!m.state.opens.includes(privateTarget));assert(!m.state.reads.includes(privateTarget));assert(!JSON.stringify(r).includes(privateTarget));assert(!JSON.stringify(r).includes('PROTECTED_BODY'));
});
for(const [label,change,reason]of [
 ['directory',row=>row.kind='d','FILE_TYPE_UNSUPPORTED'],['symlink',row=>row.kind='l','FILE_TYPE_UNSUPPORTED'],
 ['caller owner',row=>row.uid=501n,'OWNER_MISMATCH'],['multiple links',row=>row.nlink=2n,'LINK_COUNT_UNSUPPORTED'],
 ['writable mode',row=>row.mode|=0o22n,'PERMISSIONS_UNSUPPORTED'],['setuid mode',row=>row.mode|=0o4000n,'PERMISSIONS_UNSUPPORTED'],
 ['empty file',row=>row.size=0n,'SIZE_UNSUPPORTED'],['oversized file',row=>row.size=BigInt(256*1024*1024+1),'SIZE_UNSUPPORTED'],
])test('inspection tool '+label+' rejection opens no body and preserves fixed partial facts',()=>{
 const m=mock();change(m.nodes.get(inspectionTool));const r=m.inventory();inspectionFailure(m,r,reason);assert.equal(r.inspectionTool.observationPhase,'FILE_METADATA');assert(!m.state.opens.includes(inspectionTool));assert(!m.state.reads.includes(inspectionTool));
});
test('inspection tool exact 256MiB bound is streamed in finite 64KiB reads',()=>{
 const m=mock(),size=256*1024*1024;m.nodes.get(inspectionTool).size=BigInt(size);m.state.virtualFile=inspectionTool;const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED');assert.equal(r.inspectionTool.bytes,size);assert.equal(r.inspectionTool.observationPhase,'COMPLETE');assert.equal(m.state.reads.filter(p=>p===inspectionTool).length,size/65536);assert.equal(m.state.opens.filter(p=>p===inspectionTool).length,1);assert.equal(m.fds.size,0);
});
for(const [field,phase,reason,code]of [
 ['failOpenPath','OPEN_READ_ONLY',null,'EACCES'],['fdIdentityPath','START_FD_IDENTITY','OPEN_FD_IDENTITY_CHANGED','UNSUPPORTED_OR_CHANGED'],
 ['failReadPath','BODY_HASH',null,'EIO'],['failClosePath','CLOSING_FD_IDENTITY',null,'EIO'],
])test('inspection tool '+field+' remains UNKNOWN and never publishes a hash',()=>{
 const m=mock();m.state[field]=inspectionTool;const r=m.inventory();inspectionFailure(m,r,reason,code);assert.equal(r.inspectionTool.observationPhase,phase);if(field==='failClosePath')assert.equal(r.inspectionTool.fdClose,'NOT_OBSERVED');else if(field!=='failOpenPath')assert.equal(r.inspectionTool.fdClose,'CLOSED');if(field==='fdIdentityPath')assert(!m.state.reads.includes(inspectionTool));
});
test('inspection tool changed during its body read cannot publish a hash',()=>{
 const m=mock();m.state.afterRead=p=>{if(p===inspectionTool)m.nodes.get(p).ino++;};const r=m.inventory();inspectionFailure(m,r,'CLOSING_FD_IDENTITY_CHANGED');assert.equal(r.inspectionTool.fdClose,'CLOSED');
});
for(const ancestor of [false,true])test('inspection tool closing '+(ancestor?'ancestor':'name')+' mutation cannot publish a hash',()=>{
 const m=mock();m.state.afterClose=p=>{if(p===inspectionTool)m.nodes.get(ancestor?path.dirname(p):p).ino++;};const r=m.inventory();inspectionFailure(m,r,ancestor?'CLOSING_ANCESTOR_IDENTITY_CHANGED':'CLOSING_NAME_IDENTITY_CHANGED');assert.equal(r.inspectionTool.fdClose,'CLOSED');
});
test('inspection tool success cannot erase historical selected or literal prerequisite refusals',()=>{
 const m=mock();xcodeSelected(m);m.nodes.get(selectedTools.clang).uid=501n;m.nodes.delete(literal);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert(r.inspectionTool.sha256);assert.deepEqual(r.failures,[{phase:'SELECTED_TOOL_BYTES:clang',code:'UNSUPPORTED_OR_CHANGED',guardReason:'OWNER_MISMATCH'},{phase:'REQUIRED_LITERAL_SDK_FILES',code:'ENOENT'}]);assert.equal(m.state.calls.length,3);assert.equal(m.fds.size,0);
});
