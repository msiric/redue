// Fixed PRE-AUTH behavior observations only, never a native-agent boundary.
// Private live CI fixture/build/startup -> five fixed public target operations.
// Endpoint checks are trusted/quiescent, not hostile-interval or loader proof.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {verifyNativeStdioStartup} from './sealed-typescript-native-stdio-startup.mjs';
const PROFILE='redue-native-stdio-preauth-ci-sdk26.5@1',INTERPRETATION='redue-native187-ci-sdk26.5-bash-startup-source@1';
const PATH='/usr/bin:/bin:/usr/sbin:/sbin',MARK_A='/redue-preauth-path-A',MARK_B='/redue-preauth-path-B',MAN_B='/redue-preauth-man-B';
const SHELL_COMMAND='printf "PATH=%s\\nMANPATH_SET=%s\\n" "$PATH" "${MANPATH+x}"';
const ERRORS=new Set(['ENOENT','EACCES','EPERM','ENOTDIR','ELOOP','EINVAL','EBADF','EIO','ETIMEDOUT','ENOBUFS']);
const SIGNALS=new Set(['SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGINT']);
const used=new WeakSet(),fail=()=>{throw Error('PREAUTH_STARTUP_OBSERVATION_UNKNOWN');},guard=v=>{if(!v)fail();};
const sha=b=>createHash('sha256').update(b).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});
 guard(fs.realpathSync(at)===at&&s.isDirectory()&&!s.isSymbolicLink()&&((s.mode&0o6022n)===0n||at==='/private/tmp'&&s.uid===0n&&(s.mode&0o7777n)===0o1777n));rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function directory(file){const s=fs.lstatSync(file,{bigint:true});guard(fs.realpathSync(file)===file&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return JSON.stringify([parentMark(s),parents(file)]);}
function absent(file){try{fs.lstatSync(file,{bigint:true});}catch(e){guard(e?.code==='ENOENT');return;}fail();}
function fileCurrent(row){const s=fs.lstatSync(row.file,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===BigInt(row.bytes)&&fs.realpathSync(row.file)===row.file&&mark(s)===row.mark&&JSON.stringify(parents(row.file))===row.parents);
 let fd,failed=false;try{fd=fs.openSync(row.file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===row.mark);
 const bytes=Buffer.alloc(row.bytes);let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}
 const post=fs.fstatSync(fd,{bigint:true}),named=fs.lstatSync(row.file,{bigint:true});guard(sha(bytes)===row.pin&&post.isFile()&&!post.isSymbolicLink()&&named.isFile()&&!named.isSymbolicLink()&&mark(post)===row.mark&&mark(named)===row.mark&&fs.realpathSync(row.file)===row.file&&JSON.stringify(parents(row.file))===row.parents);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);}
function put(file,body){let fd,row,failed=false;try{const bytes=Buffer.from(body);guard(bytes.length>0&&bytes.length<=128);fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);
 let s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);
 let at=0;while(at<bytes.length){const n=fs.writeSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}fs.fsyncSync(fd);s=fs.fstatSync(fd,{bigint:true});
 guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.size===BigInt(bytes.length)&&s.nlink===1n&&(s.mode&0o7777n)===0o600n);row={file,bytes:bytes.length,pin:sha(bytes),mark:mark(s),parents:JSON.stringify(parents(file))};
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);fileCurrent(row);return row;}
function privateBinding(options){const f=verifySealedTypeScriptSyntheticFixture(options.fixture),b=verifyNativeStdioProbeBuild(options.build),s=verifyNativeStdioStartup(options.startup,'BEFORE_NATIVE');
 guard(f.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&f.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'&&f.ownedHandlesClosed===true&&f.receiverBasePolicyMatch===true&&
 b.outcome==='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'&&b.profileId===PROFILE&&b.buildInterpretation==='redue-native-stdio-preauth-build@2'&&s.outcome==='STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY'&&s.buildProfileId===PROFILE&&s.interpretation===INTERPRETATION&&s.sourceBasisCurrent===true&&
 /^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(f.base)&&b.hostBase===f.base&&s.hostBase===f.base);return {base:f.base,fingerprint:JSON.stringify([f,b,s])};}
export function observeFixedPreauthStartupBehavior(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||!['fixture','build','startup'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Error('PREAUTH_STARTUP_OBSERVATION_OPTIONS');
 const report={schema:1,interpretation:'redue-fixed-preauth-startup-observation@1',scope:'PREAUTH_PUBLIC_CONTROLLED_STARTUP_OBSERVATION_ONLY',outcome:'UNKNOWN',reason:'PRIVATE_CI_BASIS_UNAVAILABLE',calls:[],
 nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false,profileApproved:false,recordAdoptionAuthority:false,controlledShellStartup:'NOT_EMPIRICALLY_OBSERVED',nativeEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',ownedCleanup:'NOT_CREATED'};
 const started=process.hrtime.bigint(),rows=[],dirs=[],inventory=[];let root=null,binding=null,uncertainChild=false,prepared=false,reason=report.reason;
 const deadline=()=>{if(process.hrtime.bigint()-started>=30000000000n){reason='PARENT_DEADLINE';fail();}};
 const ownCurrent=()=>{for(const [file,id]of dirs){guard(directory(file)===id);const names=fs.readdirSync(file);guard(Array.isArray(names)&&names.length<=4&&names.every(n=>typeof n==='string'&&/^[A-Za-z0-9.-]{1,32}$/.test(n))&&JSON.stringify(names.sort())===JSON.stringify(inventory.find(r=>r[0]===file)[1]));}for(const row of rows)fileCurrent(row);for(const [file,id]of dirs)guard(directory(file)===id);};
 const current=()=>{deadline();guard(privateBinding(options).fingerprint===binding.fingerprint);ownCurrent();deadline();};
 try{
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined);
  binding=privateBinding(options);deadline();guard(!used.has(options.startup));used.add(options.startup);
  root=binding.base+'/preauth-startup-controls';reason='OWNED_CONTROLS_UNAVAILABLE';absent(root);
  const a=root+'/root-a',b=root+'/root-b',home=root+'/home';
  const paths=[root,home,a,a+'/etc',a+'/etc/paths.d',a+'/etc/manpaths.d',b,b+'/etc',b+'/etc/paths.d',b+'/etc/manpaths.d'];
  for(const file of paths){deadline();fs.mkdirSync(file,{mode:0o700});dirs.push([file,directory(file)]);}
  for(const [file,body]of [[a+'/etc/paths',MARK_A+'\n'],[a+'/etc/manpaths','/redue-preauth-man-A\n'],[b+'/etc/paths',MARK_B+'\n'],[b+'/etc/manpaths',MAN_B+'\n']]){deadline();rows.push(put(file,body));}
  for(const file of paths)inventory.push([file,[...paths.slice(1),...rows.map(r=>r.file)].filter(p=>path.dirname(p)===file).map(p=>path.basename(p)).sort()]);prepared=true;report.ownedCleanup='PENDING';
  // Native credential policy is not used here: every child gets only these fixed
  // nonsecret data bindings, no inherited/authentication environment at all.
  const env=control=>({HOME:home,SHELL:'/bin/bash',PATH,PATH_HELPER_ROOT:control});
  const pathOutput=marker=>'PATH="'+marker+':'+PATH+'"; export PATH;\n';
  const shellOutput=marker=>'PATH='+marker+'\nMANPATH_SET=\n';
  const cases=[['ROOT_A','/usr/libexec/path_helper',['-s'],env(a),pathOutput(MARK_A)],['ROOT_B','/usr/libexec/path_helper',['-s'],env(b),pathOutput(MARK_B)],
   ['MANPATH_EMPTY','/usr/libexec/path_helper',['-s'],{...env(b),MANPATH:''},pathOutput(MARK_B)+'MANPATH="'+MAN_B+':"; export MANPATH;\n'],
   ['BASH_LOGIN','/bin/bash',['--login','-c',SHELL_COMMAND],env(a),shellOutput(MARK_A+':'+PATH)],['BASH_NONLOGIN','/bin/bash',['-c',SHELL_COMMAND],env(a),shellOutput(PATH)]];
  reason='FIXED_OPERATION_UNAVAILABLE';for(const [role,target,argv,environment,expected]of cases){current();const before=process.hrtime.bigint(),remaining=Number((30000000000n-(before-started))/1000000n);guard(remaining>0);
   uncertainChild=true;const r=spawnSync(target,argv,{cwd:home,env:environment,stdio:['ignore','pipe','pipe'],timeout:Math.min(5000,remaining),maxBuffer:4096,killSignal:'SIGKILL'}),elapsed=process.hrtime.bigint()-before;
   const code=Number.isInteger(r?.status)&&r.status>=0&&r.status<=255?r.status:null,signal=r?.signal===null?null:SIGNALS.has(r?.signal)?r.signal:'UNKNOWN',error=r?.error?ERRORS.has(r.error.code)?r.error.code:'UNKNOWN':null;
   const call={role,pidObserved:Number.isInteger(r?.pid)&&r.pid>0&&r.pid<=2147483647,exitCode:code,signal,errorCode:error,elapsedMs:Number(elapsed)/1e6,stdoutBytes:Buffer.isBuffer(r?.stdout)?r.stdout.length:null,stderrBytes:Buffer.isBuffer(r?.stderr)?r.stderr.length:null,expectedOutputObserved:false};report.calls.push(call);
   if(call.pidObserved&&!error&&code!==null&&signal===null)uncertainChild=false;
   guard(call.pidObserved&&!error&&code===0&&signal===null&&elapsed<5000000000n);deadline();
   guard(Buffer.isBuffer(r.stdout)&&r.stdout.length<=4096&&Buffer.isBuffer(r.stderr)&&r.stderr.length===0);current();
   reason='FIXED_OUTPUT_MISMATCH';guard(r.stdout.equals(Buffer.from(expected)));call.expectedOutputObserved=true;reason='FIXED_OPERATION_UNAVAILABLE';
  }
  current();report.outcome='PREAUTH_FIXED_BEHAVIOR_OBSERVED_NOT_NATIVE_PROOF';reason='FIXED_CASES_MATCHED';
 }catch{report.outcome='UNKNOWN';}
 finally{
  if(root){if(uncertainChild)report.ownedCleanup='RETAINED_CHILD_CLOSURE_UNKNOWN';else if(!prepared)report.ownedCleanup='RETAINED_INCOMPLETE_CONTROLS';else try{const cleanupStarted=process.hrtime.bigint();const cleanupDeadline=()=>guard(process.hrtime.bigint()-cleanupStarted<5000000000n&&process.hrtime.bigint()-started<35000000000n);cleanupDeadline();ownCurrent();cleanupDeadline();for(const row of rows){fileCurrent(row);cleanupDeadline();fs.unlinkSync(row.file);}for(const [file,id]of [...dirs].reverse()){guard(directory(file)===id&&fs.readdirSync(file).length===0);cleanupDeadline();fs.rmdirSync(file);}cleanupDeadline();report.ownedCleanup='REMOVED_OWNED_CONTROLS';}catch{report.ownedCleanup='UNKNOWN';report.outcome='UNKNOWN';reason='OWNED_CLEANUP_UNKNOWN';}}
 }
 report.reason=reason;return freeze(report);
}
