// Engineering loader observation only: not Claude, Bun equivalence, compiler,
// credential enforcement or a seal. Default invocation launches no process.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {prepareClaude187GeneratorProposal} from './acceptance/portable-claude-generator-proposal.mjs';

const native='/Users/mariosiric/Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187/bin/claude';
const node='/Users/mariosiric/.nvm/versions/node/v22.13.0/bin/node';
const launcher='/usr/bin/sandbox-exec';
const nodeSha='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const launcherSha='c7d6609ce2b87a538ffd0d92b6be7de64dbc919b6845cc16b92f7c57e2658fdf';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const dirMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const guard=(condition,code)=>{if(!condition)throw Object.assign(Error(code),{code});};
const phases=new Set(['STARTUP_PATH_UNKNOWN','STARTUP_ARTIFACT_UNKNOWN','STARTUP_ARTIFACT_CHANGED','STARTUP_PARENT_UNKNOWN','STARTUP_PARENT_CHANGED','STARTUP_PLATFORM_UNKNOWN','STARTUP_TEMP_UNKNOWN','STARTUP_GENERATOR_UNKNOWN','STARTUP_GENERATOR_PROTOCOL_UNKNOWN','STARTUP_SOURCE_CHANGED','STARTUP_CLEANUP_UNKNOWN','ENGINEERING_NODE_STARTUP_UNKNOWN']);
const errorCodes=new Set(['EPERM','EACCES','ENOENT','ENOTDIR','ELOOP','EINVAL','EIO','EBADF','EMFILE','ENFILE','ETIMEDOUT']);
function reason(error){const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'code'):null;return d&&Object.hasOwn(d,'value')&&(phases.has(d.value)||errorCodes.has(d.value))?d.value:'UNKNOWN';}
function binding(file,expected,owner,limit){
  guard(fs.realpathSync(file)===file,'STARTUP_PATH_UNKNOWN');const named=fs.lstatSync(file,{bigint:true});
  guard(named.isFile()&&!named.isSymbolicLink()&&named.nlink===1n&&named.uid===BigInt(owner)&&(named.mode&0o6022n)===0n&&named.size>0n&&named.size<=BigInt(limit),'STARTUP_ARTIFACT_UNKNOWN');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  try{guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(named),'STARTUP_ARTIFACT_CHANGED');
    const hash=createHash('sha256'),buffer=Buffer.alloc(65536);let at=0;while(at<Number(named.size)){const requested=Math.min(buffer.length,Number(named.size)-at),count=fs.readSync(fd,buffer,0,requested,at);guard(Number.isInteger(count)&&count>0&&count<=requested,'STARTUP_ARTIFACT_UNKNOWN');hash.update(buffer.subarray(0,count));at+=count;}
    guard(hash.digest('hex')===expected,'STARTUP_ARTIFACT_UNKNOWN');guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(named),'STARTUP_ARTIFACT_CHANGED');
  }finally{fs.closeSync(fd);}
  guard(mark(fs.lstatSync(file,{bigint:true}))===mark(named),'STARTUP_ARTIFACT_CHANGED');
  const parents=[];for(let p=path.dirname(file);;p=path.dirname(p)){const st=fs.lstatSync(p,{bigint:true});guard(st.isDirectory()&&!st.isSymbolicLink(),'STARTUP_PARENT_UNKNOWN');parents.push([p,dirMark(st)]);if(p===path.dirname(p))break;}
  return {file,expected,owner,limit,mark:mark(named),parents};
}
function unchanged(before){const after=binding(before.file,before.expected,before.owner,before.limit);guard(after.mark===before.mark,'STARTUP_ARTIFACT_CHANGED');guard(JSON.stringify(after.parents)===JSON.stringify(before.parents),'STARTUP_PARENT_CHANGED');}
function ownedDir(file){const s=fs.lstatSync(file,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n&&fs.realpathSync(file)===file,'STARTUP_PARENT_UNKNOWN');return {file,mark:dirMark(s)};}
function dirCurrent(row){guard(ownedDir(row.file).mark===row.mark,'STARTUP_PARENT_CHANGED');}
const signals=new Set(['SIGKILL','SIGABRT','SIGSEGV','SIGTERM','SIGBUS','SIGILL','SIGINT']);
function processObservation(result){const pid=Number.isInteger(result.pid)&&result.pid>0,status=Number.isInteger(result.status)&&result.status>=0&&result.status<=255?result.status:null,signal=result.signal===null?null:signals.has(result.signal)?result.signal:'UNKNOWN';return {pidObserved:pid,status,signal,spawnError:result.error?reason(result.error):'NONE',reaped:pid&&!result.error&&((status!==null&&signal===null)||(status===null&&signals.has(signal)))};}

test('fixed native-derived read view starts only pinned Node --version; engineering observation, never authority',{
  skip:process.env.REDUE_GENERATOR_STARTUP==='1'?false:'Reviewed engineering startup not selected; no process launched'
},t=>{
  let source,sourceBinding,dirs=[],reaped=true,failure=null,cleanup='NOT_CREATED';
  try{
    guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===node&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid(),'STARTUP_PLATFORM_UNKNOWN');
    const runtime=binding(node,nodeSha,process.getuid(),128*1024*1024),wrapper=binding(launcher,launcherSha,0,1024*1024);
    const proposal=prepareClaude187GeneratorProposal({native});
    guard(fs.realpathSync('/private/tmp')==='/private/tmp','STARTUP_TEMP_UNKNOWN');const tmp=fs.lstatSync('/private/tmp');guard(tmp.isDirectory()&&!tmp.isSymbolicLink()&&tmp.uid===0&&(tmp.mode&0o7777)===0o1777,'STARTUP_TEMP_UNKNOWN');
    const base=fs.realpathSync(fs.mkdtempSync('/private/tmp/redue-engineering-startup-'));fs.chmodSync(base,0o700);dirs.push(ownedDir(base));
    const home=base+'/home',cwd=base+'/cwd';fs.mkdirSync(home,{mode:0o700});dirs.push(ownedDir(home));fs.mkdirSync(cwd,{mode:0o700});dirs.push(ownedDir(cwd));
    source=base+'/public-generator.js';fs.writeFileSync(source,proposal.source,{mode:0o600,flag:'wx'});sourceBinding=binding(source,proposal.sourceSha256,process.getuid(),65536);
    // Actual source closure, four actual builtins and initializer; no custom
    // policy fragments or evidence-selected commands/configuration/code.
    const child=`import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
try{const fd=fs.openSync(process.argv[1],fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let code;try{const before=fs.fstatSync(fd,{bigint:true});if(!before.isFile()||before.nlink!==1n||before.size<=0n||before.size>65536n)throw Error();const bytes=Buffer.alloc(Number(before.size));let at=0;while(at<bytes.length){const count=fs.readSync(fd,bytes,at,bytes.length-at,at);if(!Number.isInteger(count)||count<=0||count>bytes.length-at)throw Error();at+=count;}const after=fs.fstatSync(fd,{bigint:true});if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||before.mtimeNs!==after.mtimeNs||before.ctimeNs!==after.ctimeNs||createHash('sha256').update(bytes).digest('hex')!==process.argv[2])throw Error();code=bytes.toString('utf8');}finally{fs.closeSync(fd);}const requireActual=createRequire(import.meta.url),allowed=new Set(['fs','path','os','child_process']);
const context=vm.createContext({process,require:name=>{if(!allowed.has(name))throw Error();return requireActual(name);}});
const script=new vm.Script(code+';g2i();k0d('+JSON.stringify({readConfig:{denyOnly:['/'],allowWithinDeny:[${JSON.stringify(node)}]},writeConfig:{allowOnly:[],denyWithinAllow:[]},needsNetworkRestriction:true,allowUnixSockets:[],allowAllUnixSockets:false,allowLocalBinding:false,allowMachLookup:[],allowPty:false,allowGitConfig:false,enableWeakerNetworkIsolation:false,allowAppleEvents:false,logTag:'REDUE_ENGINEERING_STARTUP'})+')');
const profile=script.runInContext(context,{timeout:1000});if(typeof profile!=='string'||Buffer.byteLength(profile)>65536||!profile.includes('(allow file-read* (literal "/"))')||profile.includes('(allow network*)'))throw Error();process.stdout.write(JSON.stringify({profile}));
}catch{process.stdout.write('{"result":"UNKNOWN"}');process.exitCode=74;}`;
    reaped=false;const generated=spawnSync(node,['--input-type=module','--eval',child,source,proposal.sourceSha256],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:131072,killSignal:'SIGKILL'});const generation=processObservation(generated);reaped=generation.reaped;
    guard(reaped&&generation.signal===null&&generation.status===0&&generated.stderr==='','STARTUP_GENERATOR_UNKNOWN');
    let value;try{value=JSON.parse(generated.stdout);}catch{throw Object.assign(Error(),{code:'STARTUP_GENERATOR_PROTOCOL_UNKNOWN'});}
    guard(value&&Object.keys(value).join(',')==='profile'&&typeof value.profile==='string'&&Buffer.byteLength(value.profile)<=65536,'STARTUP_GENERATOR_PROTOCOL_UNKNOWN');
    unchanged(runtime);unchanged(wrapper);unchanged(sourceBinding);for(const row of dirs)dirCurrent(row);guard(prepareClaude187GeneratorProposal({native}).sourceSha256===proposal.sourceSha256,'STARTUP_SOURCE_CHANGED');
    reaped=false;const result=spawnSync(launcher,['-p',value.profile,node,'--version'],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});const processResult=processObservation(result);reaped=processResult.reaped;
    unchanged(runtime);unchanged(wrapper);unchanged(sourceBinding);for(const row of dirs)dirCurrent(row);guard(prepareClaude187GeneratorProposal({native}).sourceSha256===proposal.sourceSha256,'STARTUP_SOURCE_CHANGED');
    t.diagnostic(JSON.stringify({schema:1,scope:'NATIVE_DERIVED_ENGINEERING_NODE_STARTUP_ONLY',...processResult,exactVersion:result.stdout==='v22.13.0\n',stdoutBytes:Buffer.byteLength(result.stdout??''),stderrBytes:Buffer.byteLength(result.stderr??''),profileSha256:sha(value.profile),nativeLaunches:0,models:0,compilerExecutions:0,nativeEnforcement:'NOT_ESTABLISHED',bunEquivalence:'NOT_ESTABLISHED',sealed:false,reuseEligible:false}));
    guard(reaped&&processResult.signal===null&&processResult.status===0&&result.stdout==='v22.13.0\n','ENGINEERING_NODE_STARTUP_UNKNOWN');
  }catch(error){failure=reason(error);}
  finally{
    if(dirs.length){cleanup='PRESERVED_UNKNOWN';try{guard(reaped&&sourceBinding,'STARTUP_CLEANUP_UNKNOWN');for(const row of dirs)dirCurrent(row);unchanged(sourceBinding);fs.unlinkSync(source);for(const row of [...dirs].reverse()){dirCurrent(row);fs.rmdirSync(row.file);}cleanup='OWNED_EMPTY_DIRECTORIES_REMOVED';}catch{failure??='STARTUP_CLEANUP_UNKNOWN';}}
  }
  t.diagnostic(JSON.stringify({scope:'ENGINEERING_STARTUP_LIFECYCLE_ONLY',cleanup,reaped,reason_code:failure??'NONE',nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false}));
  if(failure)assert.fail('ENGINEERING_STARTUP_'+failure);
});

test('finite process and failure reporting never exposes private messages or unknown status',()=>{
  const good=processObservation({pid:1,status:0,signal:null});assert.deepEqual(good,{pidObserved:true,status:0,signal:null,spawnError:'NONE',reaped:true});
  for(const status of [-1,256,'PRIVATE_STATUS',NaN]){const r=processObservation({pid:1,status,signal:null});assert.equal(r.status,null);assert.equal(r.reaped,false);}
  for(const signal of ['UNKNOWN','SIGKILL'])assert.equal(processObservation({pid:1,status:0,signal}).reaped,false);assert.equal(processObservation({pid:1,status:null,signal:'SIGKILL'}).reaped,true);
  const error=Object.assign(Error('PRIVATE_PATH_VALUE'),{code:'EACCES'});assert.equal(reason(error),'EACCES');assert.equal(processObservation({pid:1,status:null,signal:'SIGKILL',error}).reaped,false);
  let getters=0;const accessor={};Object.defineProperty(accessor,'code',{get(){getters++;return'PRIVATE';}});assert.equal(reason(accessor),'UNKNOWN');assert.equal(getters,0);assert(!JSON.stringify(processObservation({pid:1,status:0,signal:'PRIVATE_SIGNAL'})).includes('PRIVATE'));
});
