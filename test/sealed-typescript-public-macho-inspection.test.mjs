// Harmless in-memory source/process controls only; no public tool or target runs.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {inspectFixedNativeStartupPublicBinaries} from './acceptance/sealed-typescript-public-macho-inspection.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-public-macho-inspection.mjs',import.meta.url),'utf8');
const tool='/Library/Developer/CommandLineTools/usr/bin/llvm-objdump',bash='/bin/bash',helper='/usr/libexec/path_helper',cwd='/private/tmp/redue-public-macho-ABC123';
const flags=['--no-debuginfod','--macho','--arch=arm64e','--private-headers','--syms','--bind','--indirect-symbols','--disassemble'];
const version='LLVM version 21.1.8\n',help=flags.map(v=>'  '+v+' public option').join('\n')+'\n';
const output='Mach header\n magic cputype cpusubtype\n MH_MAGIC_64 ARM64 ARM64E\n(__TEXT,__text) section\n000000010000abcd ret\n';
const sha=body=>createHash('sha256').update(body).digest('hex');
function mock(){
 let ino=1,fd=20,now=0n;const nodes=new Map(),fds=new Map(),state={calls:[],reads:[],removed:0,closeCount:0,afterRead:null,afterCall:null,afterRealpath:null,result:null,fail:null,output,help,version};
 const put=(file,kind='d',body='',uid=0n,mode=kind==='d'?0o40755n:0o100755n)=>nodes.set(file,{kind,body:Buffer.from(body),dev:1n,ino:BigInt(ino++),uid,gid:0n,mode,nlink:1n,size:BigInt(Buffer.byteLength(body)),mtimeNs:1n,ctimeNs:1n});
 const parents=file=>{for(let at=path.dirname(file);;at=path.dirname(at)){if(!nodes.has(at))put(at);if(at===path.dirname(at))break;}};
 for(const file of [tool,bash,helper]){parents(file);put(file,'f','MOCK '+file);}put('/private');put('/private/tmp','d','',0n,0o41777n);
 let code=source.replace(/^import .*;$/gm,'').replaceAll('export function ','function ');
 for(const [pin,file]of [['1dcc1432db4d828cf8cd71a84cb8d9bf63a7ca80b5eeec711a9e5f13a3f5f98e',tool],['16303dedab719ddb63efd9dd68092a0da37b397bfd4fcb856d5f1c86c5ee414b',bash],['c6213c2dfc123f4bade31383a918129a98bb9dfcac9a606f994a9e26a1a78255',helper]])code=code.replaceAll(pin,sha(nodes.get(file).body));
 const stat=file=>{if(state.fail==='stat')throw Object.assign(Error('SECRET'),{code:'EACCES'});const r=nodes.get(file);if(!r)throw Object.assign(Error('SECRET'),{code:'ENOENT'});return {...r,isDirectory:()=>r.kind==='d',isFile:()=>r.kind==='f',isSymbolicLink:()=>r.kind==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:1,O_NONBLOCK:2},lstatSync:stat,realpathSync:file=>{if(state.afterRealpath)state.afterRealpath(file);return state.fail==='realpath'?file+'-alias':file;},
  openSync(file,mode){assert.equal(mode,3);if(state.fail==='open')throw Object.assign(Error('SECRET'),{code:'EPERM'});stat(file);const n=fd++;fds.set(n,file);return n;},fstatSync:n=>stat(fds.get(n)),
  readSync(n,b,offset,length,position){const file=fds.get(n);state.reads.push(file);if(state.fail==='read')return 0;const r=nodes.get(file),count=r.body.copy(b,offset,position,Math.min(position+length,r.body.length));if(state.afterRead)state.afterRead(file,position);return count;},
  closeSync(n){state.closeCount++;fds.delete(n);if(state.fail==='close')throw Error('SECRET');},mkdtempSync:prefix=>{assert.equal(prefix,'/private/tmp/redue-public-macho-');put(cwd,'d','',501n,0o40700n);return cwd;},
  chmodSync(file,mode){assert.equal(file,cwd);assert.equal(mode,0o700);nodes.get(cwd).mode=0o40700n;},readdirSync:file=>{assert.equal(file,cwd);return state.fail==='occupied'?['owned-new-file']:[];},
  rmdirSync(file){assert.equal(file,cwd);state.removed++;nodes.delete(file);if(state.fail==='rmdir')throw Error('SECRET');}};
 const proc={platform:'darwin',arch:'arm64',version:'v22.13.0',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20,hrtime:{bigint:()=>now}};
 const spawn=(file,argv,options)=>{state.calls.push({file,argv,options});if(state.afterCall)state.afterCall(argv);return state.result??{pid:123,status:0,signal:null,stdout:Buffer.from(argv[0]==='--version'?state.version:argv[0]==='--help'?state.help:state.output),stderr:Buffer.alloc(0)};};
 const run=Function('fs','path','createHash','spawnSync','process',code+';return inspectFixedNativeStartupPublicBinaries;')(io,path.posix,createHash,spawn,proc);
 return {run,nodes,fds,state,proc,advance:ms=>{now+=BigInt(ms)*1000000n;}};
}
function noAuthority(v){for(const key of ['profileApproved','sealed','reuseEligible'])assert.equal(v[key],false);for(const key of ['models','nativeAgentLaunches','targetExecutions','compilerCheckExecutions'])assert.equal(v[key],0);for(const key of ['behavior','appleAuthenticity','nativeEnforcement','completeSdkClosure'])assert.equal(v[key],'NOT_ESTABLISHED');assert.equal(v.publicOutputUntrusted,true);}

test('fixed stable mocked output preserves every complete public byte and has no execution authority',()=>{
 const m=mock(),v=m.run();assert.equal(v.outcome,'PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF');noAuthority(v);assert.equal(v.calls.length,4);
 assert.deepEqual(m.state.calls.map(c=>c.argv),[['--version'],['--help'],[...flags,bash],[...flags,helper]]);
 for(const c of m.state.calls){assert.equal(c.file,tool);assert.deepEqual(c.options,{cwd,env:{},stdio:['ignore','pipe','pipe'],timeout:5000,maxBuffer:c.argv[0]==='--version'?8192:c.argv[0]==='--help'?65536:c.argv.at(-1)===bash?16*1024*1024:1024*1024,killSignal:'SIGKILL'});}
 assert.equal(v.calls[2].stdout,output);assert.equal(v.calls[2].stdoutSha256,sha(output));assert.equal(v.calls[2].stderrEmpty,true);assert.equal(v.targets.bash.outputObserved,true);assert.equal(v.ownedDescriptorsClosed,true);assert.equal(v.ownedCwdCleanup,'REMOVED_OWNED_EMPTY_CWD');assert.equal(m.fds.size,0);assert.equal(m.state.removed,1);assert(Object.isFrozen(v.calls[2]));
});
test('there is no path, environment, argv, pin or callback configuration input',()=>{
 const m=mock();for(const input of [undefined,{},null,{file:'/private/secret'},{env:{}},{callback:()=>{throw Error();}}]){assert.equal(m.run(input).outcome,'UNKNOWN');assert.equal(m.state.calls.length,0);assert.equal(m.state.reads.length,0);}
 assert.doesNotMatch(source,/process\.env|execSync|xcrun|readlinkSync|copyFile|writeFile|readFileSync|execFile/);
});
for(const target of [tool,bash,helper])for(const fault of ['owner','writable','hardlink','symlink','empty','overLimit','digest'])test(`fixed ${path.basename(target)} ${fault} guard prevents any subprocess`,()=>{
 const m=mock(),r=m.nodes.get(target);if(fault==='owner')r.uid=501n;else if(fault==='writable')r.mode|=0o22n;else if(fault==='hardlink')r.nlink=2n;else if(fault==='symlink')r.kind='l';else if(fault==='empty')r.size=0n;else if(fault==='overLimit')r.size=BigInt(target===tool?37016145:target===bash?2*1024*1024+1:256*1024+1);else r.body[0]^=1;
 const v=m.run();assert.equal(v.outcome,'UNKNOWN');noAuthority(v);assert.equal(m.state.calls.length,0);if(fault!=='digest')assert(!m.state.reads.includes(target));assert.equal(m.fds.size,0);
});
for(const fault of ['owner','mode','symlink','canonical'])test('public parent '+fault+' refuses before tool body',()=>{
 const m=mock(),r=m.nodes.get('/Library/Developer');if(fault==='owner')r.uid=501n;else if(fault==='mode')r.mode|=0o2n;else if(fault==='symlink')r.kind='l';else m.state.fail='realpath';assert.equal(m.run().outcome,'UNKNOWN');assert.equal(m.state.calls.length,0);assert.equal(m.state.reads.length,0);
});
for(const fault of ['stat','open','read','close','occupied','rmdir'])test('fixed filesystem '+fault+' failure remains redacted UNKNOWN',()=>{
 const m=mock();m.state.fail=fault;const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert(!JSON.stringify(v).includes('SECRET'));assert.equal(m.fds.size,0);noAuthority(v);
});
for(const flag of flags)test('absent public help option '+flag+' never falls back or invokes a target',()=>{
 const m=mock();m.state.help=flags.filter(v=>v!==flag).join('\n');const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'OPTIONS_UNSUPPORTED');assert.equal(v.calls.length,2);assert.equal(v.calls[1].stdout,m.state.help);
});
for(const out of ['', 'Mach header ARM64 ARM64E\n',output.replace('ARM64E','ARM64_ALL'),output.replace('(__TEXT,__text)','(__DATA,__data)'),output.replace('000000010000abcd ret','not-addressed text')])test('exit zero without expected architecture and addressed text is UNKNOWN',()=>{
 const m=mock();m.state.output=out;const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'TARGET_ARCHITECTURE_OR_TEXT_UNOBSERVED');assert.equal(v.calls.length,3);assert.equal(v.targets.bash.outputObserved,false);
});
for(const result of [{pid:0,status:0,signal:null},{pid:3,status:74,signal:null},{pid:3,status:null,signal:'SIGKILL'},{pid:3,status:0,signal:null,error:{code:'ETIMEDOUT',message:'SECRET'}},{pid:3,status:0,signal:null,error:{code:'ENOBUFS'}},{pid:3,status:0,signal:'SECRET'},{pid:3,status:0,signal:null,stderr:Buffer.from('private diagnostic')},{pid:3,status:0,signal:null,stdout:Buffer.from([0xff])}])test('incomplete subprocess outcome is not complete public inspection',()=>{
 const m=mock();m.state.result={stdout:Buffer.from(version),stderr:Buffer.alloc(0),...result};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.calls.length,1);assert.equal(v.calls[0].complete,false);assert(!JSON.stringify(v).includes('SECRET'));assert(!JSON.stringify(v).includes('private diagnostic'));noAuthority(v);assert.equal(m.fds.size,0);
});
for(const role of ['version','help',bash,helper])test('wall deadline after blocked '+role+' does not accept delayed exit zero',()=>{
 const m=mock();m.state.afterCall=argv=>{if(argv[0]===`--${role}`||argv.at(-1)===role)m.advance(5000);};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.calls.at(-1).complete,false);
});
for(const target of [tool,bash,helper,'/bin','/Library/Developer'])test('post-process replacement '+target+' refuses closed output',()=>{
 const m=mock();m.state.afterCall=()=>{m.nodes.get(target).ino++;};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.calls.length,1);assert.equal(v.calls[0].complete,false);assert.equal(m.fds.size,0);
});
test('late hashing mutation of an earlier target is caught by final named closure',()=>{
 const m=mock();let changed=false;m.state.afterRead=file=>{if(!changed&&file===helper){changed=true;m.nodes.get(tool).ino++;}};assert.equal(m.run().outcome,'UNKNOWN');assert.equal(m.state.calls.length,0);
});
test('output cap, UTF-8 and terminal-control faults remain UNKNOWN without retaining unsafe text',()=>{
 for(const body of [Buffer.alloc(8193,0x41),Buffer.from('LLVM version 21\u001b[31m\n')]){const m=mock();m.state.result={pid:3,status:0,signal:null,stdout:body,stderr:Buffer.alloc(0)};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.calls[0].stdout,null);}
});
test('timeout retains only the fresh owned namespace; cleanup cannot substitute for source observation',()=>{
 const m=mock();m.state.result={pid:3,status:null,signal:'SIGKILL',error:{code:'ETIMEDOUT'},stdout:Buffer.alloc(0),stderr:Buffer.alloc(0)};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.ownedCwdCleanup,'RETAINED_CHILD_CLOSURE_UNKNOWN');assert.equal(m.state.removed,0);assert.equal(m.fds.size,0);
});
test('parent and owned-cwd replacement cannot produce complete output or remove an uncertain namespace',()=>{
 for(const target of ['/private','/private/tmp',cwd]){const m=mock();m.state.afterCall=()=>{m.nodes.get(target).ino++;};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.calls.length,1);assert.equal(v.ownedCwdCleanup,'UNKNOWN');assert.equal(m.state.removed,0);assert.equal(m.fds.size,0);}
});
test('unsupported host cannot read any public bytes or dispatch a tool',()=>{
 for(const [key,value]of [['platform','linux'],['arch','x64'],['version','v22.23.2']]){const m=mock();m.proc[key]=value;const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'PROFILE_UNAVAILABLE');assert.equal(m.state.reads.length,0);assert.equal(m.state.calls.length,0);noAuthority(v);}
});
test('overall monotonic expiry during hashing launches no child',()=>{
 const m=mock();m.state.afterRead=()=>m.advance(120000);const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'PARENT_DEADLINE');assert.equal(m.state.calls.length,0);assert.equal(m.fds.size,0);
});
test('source format observation is intentionally not a symbol-resolution or branch-completeness claim',()=>{
 const m=mock();m.state.output=output+'undefined external symbol _public_import\n';const v=m.run();assert.equal(v.outcome,'PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF');assert.equal(v.calls[2].stdout,m.state.output);assert.equal(v.behavior,'NOT_ESTABLISHED');assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');
});
for(const target of [tool,bash,helper])test('post-process same-size public content change '+target+' cannot be accepted',()=>{
 const m=mock();m.state.afterCall=()=>{m.nodes.get(target).body[0]^=1;};const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'PUBLIC_DIGEST_CHANGED');assert.equal(v.calls.length,1);assert.equal(v.calls[0].complete,false);assert.equal(m.fds.size,0);
});
test('empty version or partial help produces no target subprocess and keeps public observations',()=>{
 const m=mock();m.state.version='public version text with no LLVM identifier\n';const v=m.run();assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'VERSION_UNSUPPORTED');assert.equal(v.calls.length,1);assert.equal(v.calls[0].stdout,m.state.version);
});
