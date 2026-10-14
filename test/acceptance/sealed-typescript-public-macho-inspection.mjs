// Fixed public source inspection only. Targets are read, never executed.
// Actual source-tool byte observation: run38579790669 on two approved VMs.
// Upstream reference (not a claim of fork equivalence): LLVM llvmorg-21-init/21.1.0
// llvm/tools/llvm-objdump/{llvm-objdump.cpp,MachODump.cpp,ObjdumpOpts.td}.
// Endpoint hashes/metadata are trusted-quiescent observations, not interval,
// Apple-authenticity, loader, branch-equivalence, sandbox or seal proof.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const TOOL='/Library/Developer/CommandLineTools/usr/bin/llvm-objdump';
const TOOL_PIN='1dcc1432db4d828cf8cd71a84cb8d9bf63a7ca80b5eeec711a9e5f13a3f5f98e';
const TARGETS=[['bash','/bin/bash','16303dedab719ddb63efd9dd68092a0da37b397bfd4fcb856d5f1c86c5ee414b',2*1024*1024,16*1024*1024],
 ['path_helper','/usr/libexec/path_helper','c6213c2dfc123f4bade31383a918129a98bb9dfcac9a606f994a9e26a1a78255',256*1024,1024*1024]];
const FLAGS=['--no-debuginfod','--macho','--arch=arm64e','--private-headers','--syms','--bind','--indirect-symbols','--disassemble'];
const ERRORS=new Set(['ENOENT','EACCES','EPERM','ENOTDIR','ELOOP','EINVAL','EBADF','EIO','ETIMEDOUT','ENOBUFS']);
const SIGNALS=new Set(['SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGINT']);
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const directoryMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const sha=v=>createHash('sha256').update(v).digest('hex');
const failures=new WeakMap();
const guard=(v,reason)=>{if(!v){const e=Error('PUBLIC_INSPECTION_UNKNOWN');failures.set(e,reason);throw e;}};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){
 const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o22n)===0n,'PUBLIC_ANCESTOR_UNSUPPORTED');
 guard(fs.realpathSync(at)===at,'PUBLIC_ANCESTOR_NONCANONICAL');rows.push([at,directoryMark(s)]);if(at===path.dirname(at))return rows;
}}
function named(r){guard(fs.realpathSync(r.file)===r.file&&mark(fs.lstatSync(r.file,{bigint:true}))===r.mark&&JSON.stringify(parents(r.file))===JSON.stringify(r.parents),'PUBLIC_IDENTITY_CHANGED');}
function hashFd(r,deadline){guard(mark(fs.fstatSync(r.fd,{bigint:true}))===r.mark,'PUBLIC_FD_CHANGED');
 const hash=createHash('sha256'),bytes=Buffer.alloc(65536);let at=0;
 while(at<r.size){deadline();const requested=Math.min(bytes.length,r.size-at),n=fs.readSync(r.fd,bytes,0,requested,at);guard(Number.isInteger(n)&&n>0&&n<=requested,'PUBLIC_READ_INVALID');hash.update(bytes.subarray(0,n));at+=n;}
 guard(mark(fs.fstatSync(r.fd,{bigint:true}))===r.mark,'PUBLIC_FD_CHANGED');guard(hash.digest('hex')===r.pin,'PUBLIC_DIGEST_CHANGED');named(r);
}
function openPublic(file,pin,limit,rows,deadline){guard(fs.realpathSync(file)===file,'PUBLIC_NONCANONICAL');const s=fs.lstatSync(file,{bigint:true});
 guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===0n&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit),'PUBLIC_FILE_UNSUPPORTED');
 const r={file,pin,size:Number(s.size),mark:mark(s),parents:parents(file)};
 r.fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);rows.push(r);hashFd(r,deadline);return r;
}
function cwdIdentity(cwd){guard(/^\/private\/tmp\/redue-public-macho-[A-Za-z0-9]{6}$/.test(cwd),'CWD_PATH_UNSUPPORTED');
 const s=fs.lstatSync(cwd,{bigint:true});guard(fs.realpathSync(cwd)===cwd&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n,'CWD_UNSUPPORTED');
 guard(fs.readdirSync(cwd).length===0,'CWD_NOT_EMPTY');return directoryMark(s);
}
function text(bytes,limit){guard(Buffer.isBuffer(bytes)&&bytes.length<=limit,'OUTPUT_UNAVAILABLE_OR_TRUNCATED');const value=bytes.toString('utf8');
 guard(Buffer.from(value,'utf8').equals(bytes)&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value),'OUTPUT_ENCODING_UNSUPPORTED');return value;
}
function classifyStderr(bytes){
 // llvmorg-21.1.0 MachODump.cpp#L7674 and WithColor.cpp#L101 emit
 // this exact complete line (same warning in llvmorg-21-init).
 // Dynamic target/initialization diagnostics, mixed or partial output and ANSI
 // are deliberately OTHER; none of these classifications authorizes completion.
 const value=bytes.toString('utf8');if(!Buffer.from(value,'utf8').equals(bytes))return 'OTHER';
 return /^(?:llvm-objdump: warning: invalid instruction encoding\n)+$/.test(value)?'INVALID_INSTRUCTION_ENCODING':'OTHER';
}
function optionsObserved(help){return FLAGS.every(flag=>{
 const name=flag.split('=')[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[\\s,])'+name+'(?=[=\\s,]|$)','m').test(help);
});}
function targetOutputObserved(value){
 // Recognize only this fixed human-readable Mach-O layout. Other formats remain
 // UNKNOWN; tokens in symbols or other output regions cannot supply these facts.
 const lines=value.split(/\r?\n/).map(line=>line.trim()),headers=[];
 for(let i=0;i<lines.length;i++)if(lines[i]==='Mach header')headers.push(i);
 if(headers.length!==1)return false;const h=headers[0];
 const columns=(lines[h+1]??'').split(/[ \t]+/),row=(lines[h+2]??'').split(/[ \t]+/);
 if(columns.join(' ')!=='magic cputype cpusubtype caps filetype ncmds sizeofcmds flags'||row.length<8||
  row[0]!=='MH_MAGIC_64'||row[1]!=='ARM64'||row[2]!=='E'||!/^PAC[0-9A-F]{2}$/.test(row[3])||row[4]!=='EXECUTE'||
  !/^[0-9]+$/.test(row[5])||!/^[0-9]+$/.test(row[6])||!row.slice(7).every(flag=>/^[A-Z0-9_]+$/.test(flag)))return false;
 // LLVM21.1.0 MachODump.cpp#L2154 disassembles before private headers;
 // #L7702 emits colon-addressed instructions. Bind the two regions separately.
 const sections=[];for(let i=0;i<lines.length;i++)if(lines[i]==='(__TEXT,__text) section')sections.push(i);
 if(sections.length!==1)return false;
 for(let i=sections[0]+1;i<lines.length;i++){
  const line=lines[i];if(line==='')continue;
  // Only ordinary labels may precede the first instruction. Any other header,
  // section/symbol-table region or unsupported line ends this fixed region.
  if(/^(?:SYMBOL TABLE|Symbol table|Indirect symbols|Indirect symbol table|Bind table|Mach header)\b/.test(line))return false;
  if(/^[0-9a-fA-F]{8,16}:[ \t]+(?:[0-9a-fA-F]{2}[ \t]+){0,4}[a-zA-Z][a-zA-Z0-9.]*\b/.test(line))return true;
  if(/^[A-Za-z_.$][A-Za-z0-9_.$]*:$/.test(line))continue;
  return false;
 }
 return false;
}

export function inspectFixedNativeStartupPublicBinaries(){
 const report={schema:1,interpretation:'redue-fixed-public-macho-inspection@2',scope:'PUBLIC_STATIC_SOURCE_INSPECTION_ONLY',outcome:'UNKNOWN',reason:'PROFILE_UNAVAILABLE',
  calls:[],targets:{},expectedToolSha256:TOOL_PIN,publicOutputUntrusted:true,behavior:'NOT_ESTABLISHED',appleAuthenticity:'NOT_ESTABLISHED',nativeEnforcement:'NOT_ESTABLISHED',
  completeSdkClosure:'NOT_ESTABLISHED',profileApproved:false,sealed:false,reuseEligible:false,models:0,nativeAgentLaunches:0,targetExecutions:0,compilerCheckExecutions:0,
  ownedDescriptorsClosed:false,ownedCwdCleanup:'NOT_CREATED'};
 const rows=[],cwdParents=[];let cwd=null,cwdMark=null,reason='PROFILE_UNAVAILABLE',uncertainChild=false;const started=process.hrtime.bigint();
 const deadline=()=>guard(process.hrtime.bigint()-started<120000000000n,'PARENT_DEADLINE');
 const cwdCurrent=()=>{guard(cwdIdentity(cwd)===cwdMark,'CWD_CHANGED');for(const [at,id]of cwdParents)guard(directoryMark(fs.lstatSync(at,{bigint:true}))===id&&fs.realpathSync(at)===at,'CWD_PARENT_CHANGED');};
 const current=()=>{deadline();cwdCurrent();for(const r of rows)hashFd(r,deadline);for(const r of rows)named(r);deadline();};
 const invoke=(role,argv,limit)=>{
  current();const before=process.hrtime.bigint();const r=spawnSync(TOOL,argv,{cwd,env:{},stdio:['ignore','pipe','pipe'],timeout:5000,maxBuffer:limit,killSignal:'SIGKILL'});
  const elapsed=process.hrtime.bigint()-before,code=Number.isInteger(r?.status)&&r.status>=0&&r.status<=255?r.status:null;
  const signal=r?.signal===null?null:SIGNALS.has(r?.signal)?r.signal:'UNKNOWN',error=r?.error?ERRORS.has(r.error.code)?r.error.code:'UNKNOWN':null;
  const call={role,argv:[...argv],pidObserved:Number.isInteger(r?.pid)&&r.pid>0&&r.pid<=2147483647,exitCode:code,signal,errorCode:error,
   elapsedMs:Number(elapsed)/1e6,stdout:null,stdoutSha256:null,stderrEmpty:null,stderrBytes:null,stderrSha256:null,stderrClassification:'UNAVAILABLE',complete:false};report.calls.push(call);
  // A timeout/error or missing outcome cannot establish child ownership closure.
  if(!call.pidObserved||error||code===null||signal!==null)uncertainChild=true;
  if(Buffer.isBuffer(r?.stderr)&&r.stderr.length<=limit){call.stderrBytes=r.stderr.length;call.stderrSha256=sha(r.stderr);call.stderrClassification=r.stderr.length===0?'EMPTY':classifyStderr(r.stderr);}
  const stdout=text(r?.stdout,limit);call.stdout=stdout;call.stdoutSha256=sha(r.stdout);const stderr=text(r?.stderr,limit);call.stderrEmpty=stderr==='';
  guard(call.pidObserved&&!error&&code===0&&signal===null&&elapsed<5000000000n&&stderr==='','TOOL_EXECUTION_INCOMPLETE');
  current();call.complete=true;return stdout;
 };
 try{
  guard(arguments.length===0&&process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined,'PROFILE_UNAVAILABLE');
  // Fixed public directory metadata only; sticky /private/tmp is the one writable
  // system parent allowed for our new private empty cwd, not a target ancestor.
  for(const at of ['/','/private','/private/tmp']){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&fs.realpathSync(at)===at&&(at==='/private/tmp'?(s.mode&0o7777n)===0o1777n:(s.mode&0o22n)===0n),'CWD_PARENT_UNSUPPORTED');cwdParents.push([at,directoryMark(s)]);}
  reason='PUBLIC_INPUT_UNAVAILABLE';openPublic(TOOL,TOOL_PIN,37016144,rows,deadline);
  for(const [name,file,pin,limit]of TARGETS){openPublic(file,pin,limit,rows,deadline);report.targets[name]={path:file,sha256:pin,outputObserved:false};}
  reason='CWD_UNAVAILABLE';cwd=fs.mkdtempSync('/private/tmp/redue-public-macho-');cwdMark=cwdIdentity(cwd);report.ownedCwdCleanup='PENDING';
  reason='VERSION_UNAVAILABLE';const version=invoke('version',['--version'],8192);guard(/\bLLVM\b[^\n]*\bversion\b/i.test(version),'VERSION_UNSUPPORTED');
  reason='HELP_UNAVAILABLE';const help=invoke('help',['--help'],65536);guard(optionsObserved(help),'OPTIONS_UNSUPPORTED');
  for(const [name,file,,,limit]of TARGETS){reason='TARGET_OUTPUT_UNAVAILABLE';const output=invoke(name,[...FLAGS,file],limit);guard(targetOutputObserved(output),'TARGET_ARCHITECTURE_OR_TEXT_UNOBSERVED');report.targets[name].outputObserved=true;}
  current();reason='PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF';report.outcome='PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF';
 }catch(e){reason=failures.get(e)??(ERRORS.has(e?.code)?e.code:reason);}
 finally{
  let closed=true;for(const r of rows)try{fs.closeSync(r.fd);}catch{closed=false;}report.ownedDescriptorsClosed=closed;if(!closed){reason='DESCRIPTOR_CLOSE_UNOBSERVED';report.outcome='UNKNOWN';}
  if(cwd){if(uncertainChild)report.ownedCwdCleanup='RETAINED_CHILD_CLOSURE_UNKNOWN';else try{cwdCurrent();fs.rmdirSync(cwd);report.ownedCwdCleanup='REMOVED_OWNED_EMPTY_CWD';}catch{report.ownedCwdCleanup='UNKNOWN';reason='CWD_CLEANUP_UNKNOWN';report.outcome='UNKNOWN';}}
 }
 report.reason=reason;return freeze(report);
}
