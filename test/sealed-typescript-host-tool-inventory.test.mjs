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
const stock=['/private/etc/profile','/private/etc/bashrc','/bin/bash','/usr/libexec/path_helper'];
function mock(){
 let ino=1,fd=100;const nodes=new Map(),fds=new Map(),state={opens:[],reads:[],realpaths:[],calls:[],selected,selectedTools:{...requiredTools},failPath:null,failCode:'ENOENT',afterRead:null,result:null,link:'private/etc'};
 const put=(p,kind='f',body='PUBLIC_MOCK',uid=0)=>nodes.set(p,{kind,body:Buffer.from(body),dev:1n,ino:BigInt(ino++),uid:BigInt(uid),gid:20n,mode:kind==='d'?0o40755n:kind==='l'?0o120777n:0o100644n,nlink:1n,size:BigInt(Buffer.byteLength(body)),mtimeNs:1n,ctimeNs:1n});
 const parents=p=>{for(let a=path.posix.dirname(p);;a=path.posix.dirname(a)){if(!nodes.has(a))put(a,'d','',0);if(a===path.posix.dirname(a))return;}};
 for(const p of ['/usr/bin/xcrun','/runtime/node','/Library/Developer/CommandLineTools/usr/bin/clang','/Library/Developer/CommandLineTools/usr/bin/ld',...stock]){parents(p);put(p,'f',p==='/runtime/node'?'MOCK_NODE':'PUBLIC_MOCK',p==='/runtime/node'?501:0);}
 for(const sdk of [selected,literal])for(const name of headers){const p=sdk+'/usr/include/'+name;parents(p);put(p,'f',sdk+' '+name);}
 put('/etc','l','private/etc');
 const stat=p=>{if(p===state.failPath)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:state.failCode});const row=nodes.get(p);if(!row)throw Object.assign(Error('PROTECTED_PRIVATE_ERROR'),{code:'ENOENT'});return {...row,isFile:()=>row.kind==='f',isDirectory:()=>row.kind==='d',isSymbolicLink:()=>row.kind==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:1,O_NONBLOCK:2},lstatSync:stat,realpathSync:p=>{state.realpaths.push(p);stat(p);return p==='/etc'?'/private/etc':p;},readlinkSync:p=>{assert.equal(p,'/etc');return state.link;},
  openSync(p,flags){assert.equal(flags,3);stat(p);state.opens.push(p);const n=fd++;fds.set(n,p);return n;},fstatSync:n=>stat(fds.get(n)),
  readSync(n,b,o,l,p){const file=fds.get(n);state.reads.push(file);const r=nodes.get(file),count=r.body.copy(b,o,p,Math.min(p+l,r.body.length));state.afterRead?.(file);return count;},closeSync:n=>{assert(fds.has(n));fds.delete(n);}};
 const spawn=(file,argv,opts)=>{assert.equal(file,'/usr/bin/xcrun');assert.deepEqual(opts,{env:{},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});state.calls.push([...argv]);return state.result??{pid:1234,status:0,signal:null,stderr:'',stdout:(argv[0]==='--sdk'?state.selected:state.selectedTools[argv[1]])+'\n'};};
 const p={platform:'darwin',arch:'arm64',version:'v22.13.0',execPath:'/runtime/node',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20};
 const code=source.slice(0,source.indexOf('if(process.argv[1]')).replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replace('5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',sha('MOCK_NODE'));
 const inventory=Function('fs','path','os','createHash','spawnSync','process',code+';return inventoryPublicSealedTools;')(io,path,{release:()=> 'SYNTHETIC_OS_NOT_ACCEPTANCE'},createHash,spawn,p);
 return {inventory,state,nodes,fds,put,parents,process:p};
}
function noAuthority(report){assert.equal(report.profileApproved,false);for(const k of ['sealed','reuseEligible'])assert.equal(report[k],false);for(const k of ['models','nativeAgentLaunches','compilerCheckExecutions'])assert.equal(report[k],0);assert.equal(JSON.stringify(report).includes('PROTECTED_PRIVATE_ERROR'),false);assert.equal(Object.hasOwn(report,'environment'),false);}
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
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.nodes.delete(requiredTools[name]);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(r.phase,'COMPLETE_WITH_UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'ENOENT'}]);assert(r.tools[name].sha256);assert.deepEqual(r.requiredTools[name],{canonical:requiredTools[name]});assert.equal(Object.keys(r.stockStartup).length,4);assert.equal(m.fds.size,0);
});
for(const name of ['clang','ld'])test('late required CLT '+name+' mutation remains UNKNOWN despite valid selected Xcode bytes',()=>{
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.state.afterRead=p=>{if(p===requiredTools[name])m.nodes.get(p).ino++;};const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'UNSUPPORTED_OR_CHANGED'}]);assert(r.tools[name].sha256);assert.equal(m.fds.size,0);
});
for(const [name,limit]of [['clang',128*1024*1024],['ld',16*1024*1024]])test('required CLT '+name+' uses actual builder bound, not broader selected-tool bound',()=>{
 const m=mock();for(const n of ['clang','ld']){m.state.selectedTools[n]=selectedTools[n];m.parents(selectedTools[n]);m.put(selectedTools[n],'f','SELECTED_XCODE_'+n);}m.nodes.get(requiredTools[name]).size=BigInt(limit+1);const r=m.inventory();noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.failures,[{phase:'REQUIRED_LITERAL_TOOL:'+name,code:'UNSUPPORTED_OR_CHANGED'}]);assert(!m.state.opens.includes(requiredTools[name]));assert.equal(m.fds.size,0);
});
