// Storage-free public-tool inventory for the approved standard macOS VM.
// No compiler/helper/native/model execution, credentials, signing or authority.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const guard=(x,reason)=>{if(!x){const error=Error('PUBLIC_TOOL_INVENTORY_UNKNOWN');if(reason)error.inventoryGuard=reason;throw error;}};
const mark=s=>['dev','ino','uid','gid','mode','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
function lineage(file,rootOnly=false,tick=()=>{}){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){tick();const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());if(rootOnly){guard(s.uid===0n,'OWNER_MISMATCH');guard((s.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');}rows.push([at,['dev','ino','uid','gid','mode'].map(k=>String(s[k])).join(':')]);if(at===path.dirname(at))return rows;}}
function publicFile(file,owner,limit,result={},tick=()=>{},retained){
 tick();result.observationPhase='CANONICAL_PATH';result.metadata={canonicalMatch:fs.realpathSync(file)===file};guard(result.metadata.canonicalMatch,'NON_CANONICAL');
 result.observationPhase='FILE_METADATA';const s=fs.lstatSync(file,{bigint:true});
 result.metadata={...result.metadata,type:s.isSymbolicLink()?'SYMLINK':s.isFile()?'REGULAR_FILE':s.isDirectory()?'DIRECTORY':'OTHER',
  byteSize:s.size>=0n&&s.size<=BigInt(Number.MAX_SAFE_INTEGER)?Number(s.size):null,
  owner:s.uid===0n?'ROOT':s.uid===BigInt(process.getuid())?'CALLER':'OTHER',ownerMatches:s.uid===BigInt(owner),singleLink:s.nlink===1n,
  permissionsAccepted:(s.mode&0o6022n)===0n,size:s.size<=0n?'EMPTY_OR_INVALID':s.size>BigInt(limit)?'OVER_LIMIT':'WITHIN_LIMIT'};
 guard(s.isFile()&&!s.isSymbolicLink(),'FILE_TYPE_UNSUPPORTED');guard(s.uid===BigInt(owner),'OWNER_MISMATCH');guard(s.nlink===1n,'LINK_COUNT_UNSUPPORTED');
 guard((s.mode&0o6022n)===0n,'PERMISSIONS_UNSUPPORTED');guard(s.size>0n&&s.size<=BigInt(limit),'SIZE_UNSUPPORTED');
 result.observationPhase='ANCESTOR_METADATA';const before=lineage(file,false,tick);
 result.observationPhase='OPEN_READ_ONLY';const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK),hash=createHash('sha256');result.fdClose='NOT_OBSERVED';
 try{result.observationPhase='START_FD_IDENTITY';guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})),'OPEN_FD_IDENTITY_CHANGED');
  result.observationPhase='BODY_HASH';const bytes=Buffer.alloc(65536);let at=0;while(at<Number(s.size)){tick();const asked=Math.min(bytes.length,Number(s.size)-at),n=fs.readSync(fd,bytes,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked,'BODY_READ_INVALID');hash.update(bytes.subarray(0,n));at+=n;}
  tick();result.observationPhase='CLOSING_FD_IDENTITY';guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})),'CLOSING_FD_IDENTITY_CHANGED');
 }finally{fs.closeSync(fd);result.fdClose='CLOSED';}
 tick();result.observationPhase='CLOSING_NAME_IDENTITY';guard(mark(s)===mark(fs.lstatSync(file,{bigint:true})),'CLOSING_NAME_IDENTITY_CHANGED');
 result.observationPhase='CLOSING_ANCESTOR_IDENTITY';guard(JSON.stringify(before)===JSON.stringify(lineage(file,false,tick)),'CLOSING_ANCESTOR_IDENTITY_CHANGED');
 Object.assign(result,{sha256:hash.digest('hex'),bytes:Number(s.size),owner:owner===0?'ROOT':'CALLER',stat:{regularFile:true,singleLink:true,permissionBits:Number(s.mode&0o7777n),canonical:true,closingIdentityChecked:true}});result.observationPhase='COMPLETE';if(retained)Object.assign(retained,{file,owner,limit,initial:mark(s),lineage:before});return result;
}
export function publicDeveloperPath(file,kind){
 if(typeof file!=='string'||file.length>4096||/[\u0000-\u0020\u007f]/u.test(file)||path.posix.normalize(file)!==file)return false;
 const prefix='(?:/Library/Developer/CommandLineTools|/Applications/Xcode(?:_[A-Za-z0-9.]+)?\\.app/Contents/Developer)';
 return new RegExp('^'+prefix+(kind==='SDK'?'(?:/[^/]+)*/MacOSX[0-9.]*\\.sdk':kind==='CLANG'?'(?:/[^/]+)*/usr/bin/clang':kind==='LD'?'(?:/[^/]+)*/usr/bin/ld':'(?!)')+'$').test(file);
}
function resolvePublicTool(argv,kind){
 const result=spawnSync('/usr/bin/xcrun',argv,{env:{},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});
 guard(Number.isInteger(result.pid)&&result.pid>0&&!result.error&&result.status===0&&result.signal===null&&result.stderr==='');
 const value=result.stdout;guard(typeof value==='string'&&value.endsWith('\n')&&value.split('\n').length===2);
 const lookup=value.slice(0,-1);guard(publicDeveloperPath(lookup,kind));
 const canonical=fs.realpathSync(lookup);guard(publicDeveloperPath(canonical,kind));return {lookup,canonical};
}
const REQUIRED_TOOLS=[['clang','/Library/Developer/CommandLineTools/usr/bin/clang',128*1024*1024],['ld','/Library/Developer/CommandLineTools/usr/bin/ld',16*1024*1024]];
const INSPECTION_TOOL='/Library/Developer/CommandLineTools/usr/bin/llvm-objdump';
const CLT_SDK_ALIAS='/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk';
const REQUIRED_SDK='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
const SDK_HEADERS=['sys/stdio.h','sys/fcntl.h','fcntl.h','sys/mman.h','sys/stat.h','stdio.h','errno.h','unistd.h'];
const FILE_GUARD_REASONS=new Set(['NON_CANONICAL','FILE_TYPE_UNSUPPORTED','OWNER_MISMATCH','LINK_COUNT_UNSUPPORTED','PERMISSIONS_UNSUPPORTED','SIZE_UNSUPPORTED','OPEN_FD_IDENTITY_CHANGED','BODY_READ_INVALID','CLOSING_FD_IDENTITY_CHANGED','CLOSING_NAME_IDENTITY_CHANGED','CLOSING_ANCESTOR_IDENTITY_CHANGED','SDK_ALIAS_TARGET_UNSUPPORTED','SDK_ALIAS_IDENTITY_CHANGED']);
const FILE_ERROR_CODES=new Set(['ENOENT','EACCES','EPERM','ENOTDIR','ELOOP','EINVAL','EBADF','EMFILE','ENFILE','EIO']);
function sdkFiles(sdk,result){
 result.observationPhase='DIRECTORY_METADATA';const selected=fs.lstatSync(sdk,{bigint:true});
 result.directory={type:selected.isSymbolicLink()?'SYMLINK':selected.isDirectory()?'DIRECTORY':selected.isFile()?'REGULAR_FILE':'OTHER',owner:selected.uid===0n?'ROOT':selected.uid===BigInt(process.getuid())?'CALLER':'OTHER',
  rootOwned:selected.uid===0n,permissionBits:Number(selected.mode&0o7777n),permissionsAccepted:(selected.mode&0o22n)===0n,canonical:null,closingIdentityChecked:false};
 guard(selected.isDirectory()&&!selected.isSymbolicLink(),'FILE_TYPE_UNSUPPORTED');guard(selected.uid===0n,'OWNER_MISMATCH');guard((selected.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');
 result.directory.canonical=fs.realpathSync(sdk)===sdk;guard(result.directory.canonical,'NON_CANONICAL');const parents=lineage(sdk);
 for(const name of SDK_HEADERS){result.observationPhase='HEADER:'+name;publicFile(sdk+'/usr/include/'+name,0,1024*1024,result.headers[name]={});}
 result.observationPhase='CLOSING_DIRECTORY';
 guard(mark(fs.lstatSync(sdk,{bigint:true}))===mark(selected),'CLOSING_NAME_IDENTITY_CHANGED');guard(JSON.stringify(lineage(sdk))===JSON.stringify(parents),'CLOSING_ANCESTOR_IDENTITY_CHANGED');result.directory.closingIdentityChecked=true;result.observationPhase='COMPLETE';
}
function installedCltSdk(result){
 result.aliasPhase='PARENT_METADATA';const parents=lineage(CLT_SDK_ALIAS,true);
 result.aliasPhase='ALIAS_METADATA';const before=fs.lstatSync(CLT_SDK_ALIAS,{bigint:true});guard(before.uid===0n,'OWNER_MISMATCH');let target,canonical;
 if(before.isSymbolicLink()){
  guard(before.nlink===1n,'LINK_COUNT_UNSUPPORTED');result.aliasPhase='ALIAS_TARGET';target=fs.readlinkSync(CLT_SDK_ALIAS);
  guard(typeof target==='string'&&target.length<=64&&/^MacOSX[0-9]+(?:\.[0-9]+){0,2}\.sdk$/.test(target),'SDK_ALIAS_TARGET_UNSUPPORTED');
  canonical=path.dirname(CLT_SDK_ALIAS)+'/'+target;result.targetClassification='VERSIONED_RELATIVE_SIBLING';
 }else{guard(before.isDirectory(),'FILE_TYPE_UNSUPPORTED');guard((before.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');canonical=CLT_SDK_ALIAS;result.targetClassification='UNVERSIONED_REAL_DIRECTORY';}
 result.aliasPhase='DESTINATION_METADATA';const destination=fs.lstatSync(canonical,{bigint:true});guard(destination.isDirectory()&&!destination.isSymbolicLink(),'FILE_TYPE_UNSUPPORTED');guard(destination.uid===0n,'OWNER_MISMATCH');guard((destination.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');
 result.aliasPhase='DESTINATION_CANONICAL';guard(fs.realpathSync(CLT_SDK_ALIAS)===canonical,'NON_CANONICAL');result.canonical=canonical;sdkFiles(canonical,result);
 result.aliasPhase='ALIAS_CLOSURE';guard(mark(fs.lstatSync(CLT_SDK_ALIAS,{bigint:true}))===mark(before),'SDK_ALIAS_IDENTITY_CHANGED');
 if(target!==undefined)guard(fs.readlinkSync(CLT_SDK_ALIAS)===target,'SDK_ALIAS_IDENTITY_CHANGED');
 guard(mark(fs.lstatSync(canonical,{bigint:true}))===mark(destination),'CLOSING_NAME_IDENTITY_CHANGED');guard(JSON.stringify(lineage(CLT_SDK_ALIAS,true))===JSON.stringify(parents),'CLOSING_ANCESTOR_IDENTITY_CHANGED');
 guard(fs.realpathSync(CLT_SDK_ALIAS)===canonical,'NON_CANONICAL');guard(mark(fs.lstatSync(CLT_SDK_ALIAS,{bigint:true}))===mark(before),'SDK_ALIAS_IDENTITY_CHANGED');result.aliasPhase='COMPLETE';
}
function etcAlias(){
 const before=fs.lstatSync('/etc',{bigint:true});guard(before.isSymbolicLink()&&before.uid===0n&&before.nlink===1n);
 // Do not follow or publish an unexpected target, which could name private data.
 guard(fs.readlinkSync('/etc')==='private/etc');guard(fs.realpathSync('/etc')==='/private/etc');
 const target=fs.lstatSync('/private/etc',{bigint:true});guard(target.isDirectory()&&!target.isSymbolicLink()&&target.uid===0n);
 guard(mark(fs.lstatSync('/etc',{bigint:true}))===mark(before));
 return {symbolicLink:true,rootOwned:true,targetClassification:'EXPECTED_PRIVATE_ETC',canonicalMatch:true,closingIdentityChecked:true};
}
export function inventoryPublicSealedTools(){
 let phase='PROFILE',report={schema:1,scope:'PUBLIC_HOST_TOOL_INVENTORY_ONLY',outcome:'UNKNOWN',platform:process.platform,arch:process.arch,node:process.version,release:os.release(),tools:{},requiredTools:{},
  requiredSdk:{canonical:REQUIRED_SDK,headers:{}},observedClt:{scope:'OBSERVATIONAL_NOT_BUILD_ACCEPTED',clang:{canonical:REQUIRED_TOOLS[0][1]},sdk:{lookup:CLT_SDK_ALIAS,headers:{}}},inspectionTool:{scope:'OBSERVATIONAL_NOT_EXECUTION_ACCEPTED',canonical:INSPECTION_TOOL},failures:[],stockStartup:{},etcAlias:null,profileApproved:false,models:0,nativeAgentLaunches:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false};
 const noteFailure=(error,currentPhase)=>report.failures.push({phase:currentPhase,code:FILE_ERROR_CODES.has(error?.code)?error.code:'UNSUPPORTED_OR_CHANGED',...(FILE_GUARD_REASONS.has(error?.inventoryGuard)?{guardReason:error.inventoryGuard}:{})});
 try{
  guard(arguments.length===0);
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  // Only public system tools and the already selected official runtime. Paths
  // returned by xcrun are data; never execute them or accept arbitrary paths.
  phase='XCRUN';report.tools.xcrun=publicFile('/usr/bin/xcrun',0,1024*1024);
  phase='NODE';const runtime=fs.realpathSync(process.execPath);report.tools.node=publicFile(runtime,process.getuid(),128*1024*1024);
  guard(report.tools.node.sha256==='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc');
  phase='SELECTED_TOOL_PATHS';const clang=resolvePublicTool(['--find','clang'],'CLANG'),ld=resolvePublicTool(['--find','ld'],'LD'),sdk=resolvePublicTool(['--sdk','macosx','--show-sdk-path'],'SDK');
  report.tools.clang={...clang};report.tools.ld={...ld};
  for(const [name,file,limit]of [['clang',clang.canonical,256*1024*1024],['ld',ld.canonical,32*1024*1024]])try{publicFile(file,0,limit,report.tools[name]);}catch(error){noteFailure(error,'SELECTED_TOOL_BYTES:'+name);}
  // Independent fixed groups retain partial facts even when the literal SDK
  // is absent. No dynamic file enumeration, imported paths or profile approval.
  for(const [name,file,limit]of REQUIRED_TOOLS){const result=report.requiredTools[name]={canonical:file};try{publicFile(file,0,limit,result);}catch(error){noteFailure(error,'REQUIRED_LITERAL_TOOL:'+name);}}
  try{publicFile(REQUIRED_TOOLS[0][1],0,512*1024*1024,report.observedClt.clang);}catch(error){noteFailure(error,'OBSERVATIONAL_CLT_CLANG');}
  try{installedCltSdk(report.observedClt.sdk);}catch(error){noteFailure(error,'OBSERVATIONAL_CLT_SDK');}
  // Fixed public bytes only. No invocation, version claim, alias or fallback.
  try{publicFile(INSPECTION_TOOL,0,256*1024*1024,report.inspectionTool);}catch(error){noteFailure(error,'OBSERVATIONAL_INSPECTION_TOOL');}
  report.sdk={...sdk,headers:{}};
  for(const [slot,result]of [['SELECTED_SDK_FILES',report.sdk],['REQUIRED_LITERAL_SDK_FILES',report.requiredSdk]])try{sdkFiles(result.canonical,result);}catch(error){noteFailure(error,slot);}
  for(const [file,limit]of [['/private/etc/profile',4096],['/private/etc/bashrc',4096],['/bin/bash',2*1024*1024],['/usr/libexec/path_helper',256*1024]])try{publicFile(file,0,limit,report.stockStartup[file]={});}catch(error){noteFailure(error,'STOCK_STARTUP:'+file);}
  try{report.etcAlias=etcAlias();}catch(error){noteFailure(error,'ETC_ALIAS_METADATA');}
  if(report.failures.length===0){report.outcome='PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED';phase='COMPLETE';}else phase='COMPLETE_WITH_UNKNOWN';
 }catch(error){noteFailure(error,phase);/* Never raw exceptions or environments. */}
 report.phase=phase;
 return report;
}
// Fixed storage-free CI observation, not compiler/profile/native acceptance.
// No supplied paths, callbacks, environment values, discovery or subprocesses.
const CI_ENCLOSURE_SDK='/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk';
const CI_ENCLOSURE_HEADERS=Object.freeze(['spawn.h','sys/spawn.h','sys/wait.h','signal.h','sys/signal.h','poll.h','sys/poll.h','time.h','_time.h','stdint.h','sys/time.h']);
export function observeFixedCIEnclosureHeaders(){
 const started=performance.now();let last=started,clockValid=true,phase='PROFILE';
 const report={schema:1,scope:'FIXED_CI_ENCLOSURE_PUBLIC_HEADERS_OBSERVATION_ONLY',outcome:'UNKNOWN',phase,
  runtime:'UNKNOWN',sdk:{status:'NOT_ATTEMPTED',phase:'NOT_STARTED',code:null,guardReason:null},rows:[],elapsedMs:null,
  budget:'TEN_SECOND_MONOTONIC_CHECKPOINTS_NOT_OS_INTERRUPT',profileApproved:false,profileMatchEstablished:false,signing:false,producerTrust:false,sealed:false,runnable:false,reuseEligible:false,models:0,nativeAgentLaunches:0,compilerCheckExecutions:0};
 const tick=()=>{let value;try{value=performance.now();}catch{clockValid=false;guard(false,'MONOTONIC_BUDGET_UNAVAILABLE');}if(!(Number.isFinite(started)&&started>=0&&Number.isFinite(value)&&value>=last)){clockValid=false;guard(false,'MONOTONIC_BUDGET_UNAVAILABLE');}last=value;guard(value-started<10000,'MONOTONIC_BUDGET_UNAVAILABLE');};
 const reason=error=>({code:FILE_ERROR_CODES.has(error?.code)?error.code:'UNSUPPORTED_OR_CHANGED',guardReason:FILE_GUARD_REASONS.has(error?.inventoryGuard)||['MONOTONIC_BUDGET_UNAVAILABLE','RUNTIME_BYTES_UNSUPPORTED','REPORT_SIZE_UNSUPPORTED'].includes(error?.inventoryGuard)?error.inventoryGuard:null});
 const names=['NODE','CLANG','LD',...CI_ENCLOSURE_HEADERS.map(name=>'HEADER:'+name)];
 const retained=[];for(const name of names)report.rows.push({name,status:'NOT_ATTEMPTED',phase:'NOT_STARTED',sha256:null,bytes:null,code:null,guardReason:null,fdClose:'NOT_OBSERVED'});
 const observe=(index,file,owner,limit,rootParents=false)=>{tick();const row=report.rows[index],raw={},original={};row.status='UNKNOWN';try{
   if(rootParents)lineage(file,true,tick);
   publicFile(file,owner,limit,raw,tick,original);
   if(index===0)guard(raw.sha256==='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc','RUNTIME_BYTES_UNSUPPORTED');
   tick();row.status='PUBLIC_BYTES_OBSERVED_NOT_ACCEPTED';row.sha256=raw.sha256;row.bytes=raw.bytes;retained.push({row,original,rootParents});
  }catch(error){Object.assign(row,reason(error));}finally{row.phase=raw.observationPhase??'ANCESTOR_METADATA';row.fdClose=raw.fdClose??'NOT_OBSERVED';}tick();return row.status==='PUBLIC_BYTES_OBSERVED_NOT_ACCEPTED';};
 try{
  tick();guard(arguments.length===0&&process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execArgv.length===0&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  guard(!Object.keys(process.env).some(key=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(key)));
  phase='RUNTIME';tick();guard(typeof process.execPath==='string'&&path.isAbsolute(process.execPath)&&path.normalize(process.execPath)===process.execPath&&fs.realpathSync(process.execPath)===process.execPath,'NON_CANONICAL');
  guard(observe(0,process.execPath,process.getuid(),128*1024*1024));report.runtime='PINNED_CURRENT_EXECUTABLE_BYTES_OBSERVED';
  phase='TOOLS';observe(1,'/Library/Developer/CommandLineTools/usr/bin/clang',0,512*1024*1024,true);observe(2,'/Library/Developer/CommandLineTools/usr/bin/ld',0,32*1024*1024,true);
  phase='SDK';let sdkOriginal=null,sdkParents=null;report.sdk.status='UNKNOWN';try{
   report.sdk.phase='DIRECTORY_METADATA';tick();const initial=fs.lstatSync(CI_ENCLOSURE_SDK,{bigint:true});guard(initial.isDirectory()&&!initial.isSymbolicLink(),'FILE_TYPE_UNSUPPORTED');guard(initial.uid===0n,'OWNER_MISMATCH');guard((initial.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');
   report.sdk.phase='CANONICAL_PATH';guard(fs.realpathSync(CI_ENCLOSURE_SDK)===CI_ENCLOSURE_SDK,'NON_CANONICAL');sdkParents=lineage(CI_ENCLOSURE_SDK,true,tick);sdkOriginal=mark(initial);report.sdk.phase='START_OBSERVED';
  }catch(error){Object.assign(report.sdk,reason(error));}
  if(sdkOriginal!==null){for(let index=0;index<CI_ENCLOSURE_HEADERS.length;index++)observe(index+3,CI_ENCLOSURE_SDK+'/usr/include/'+CI_ENCLOSURE_HEADERS[index],0,1024*1024,true);}
  phase='FINAL_VALIDATION';for(const {row,original,rootParents}of retained){tick();try{
   guard(fs.realpathSync(original.file)===original.file,'NON_CANONICAL');guard(mark(fs.lstatSync(original.file,{bigint:true}))===original.initial,'CLOSING_NAME_IDENTITY_CHANGED');guard(JSON.stringify(lineage(original.file,rootParents,tick))===JSON.stringify(original.lineage),'CLOSING_ANCESTOR_IDENTITY_CHANGED');guard(fs.realpathSync(original.file)===original.file,'NON_CANONICAL');guard(mark(fs.lstatSync(original.file,{bigint:true}))===original.initial,'CLOSING_NAME_IDENTITY_CHANGED');
  }catch(error){row.status='UNKNOWN';row.phase='FINAL_ENDPOINT_VALIDATION';Object.assign(row,reason(error));}tick();}
  if(sdkOriginal!==null){report.sdk.phase='FINAL_ENDPOINT_VALIDATION';try{tick();guard(fs.realpathSync(CI_ENCLOSURE_SDK)===CI_ENCLOSURE_SDK,'NON_CANONICAL');guard(mark(fs.lstatSync(CI_ENCLOSURE_SDK,{bigint:true}))===sdkOriginal,'CLOSING_NAME_IDENTITY_CHANGED');guard(JSON.stringify(lineage(CI_ENCLOSURE_SDK,true,tick))===JSON.stringify(sdkParents),'CLOSING_ANCESTOR_IDENTITY_CHANGED');guard(fs.realpathSync(CI_ENCLOSURE_SDK)===CI_ENCLOSURE_SDK,'NON_CANONICAL');guard(mark(fs.lstatSync(CI_ENCLOSURE_SDK,{bigint:true}))===sdkOriginal,'CLOSING_NAME_IDENTITY_CHANGED');tick();report.sdk.status='ENDPOINT_METADATA_OBSERVED_NOT_ACCEPTED';report.sdk.phase='COMPLETE';}catch(error){Object.assign(report.sdk,reason(error));}}
  tick();if(report.rows.every(row=>row.status==='PUBLIC_BYTES_OBSERVED_NOT_ACCEPTED')&&report.sdk.status==='ENDPOINT_METADATA_OBSERVED_NOT_ACCEPTED'){report.outcome='PUBLIC_BYTES_OBSERVED_NOT_ACCEPTED';phase='COMPLETE';}
 }catch(error){report.failure=reason(error);}
 report.phase=phase;report.elapsedMs=clockValid&&Number.isFinite(Math.round((last-started)*1000)/1000)?Math.round((last-started)*1000)/1000:null;
 // 14 fixed rows, each <=448 encoded bytes; SDK<=320; wrapper<=1024.
 // 14*448+320+1024=7,616 bytes, inside the independent 8KiB output cap.
 try{tick();guard(Buffer.byteLength(JSON.stringify(report)+'\n')<=8192,'REPORT_SIZE_UNSUPPORTED');tick();report.elapsedMs=Math.round((last-started)*1000)/1000;}catch(error){if(report.outcome!=='UNKNOWN'||!report.failure){report.phase='REPORT';report.failure=reason(error);}report.outcome='UNKNOWN';report.elapsedMs=clockValid&&Number.isFinite(Math.round((last-started)*1000)/1000)?Math.round((last-started)*1000)/1000:null;}
 return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 guard(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--fixed-ci-enclosure-headers');const fixed=process.argv.length===3,report=fixed?observeFixedCIEnclosureHeaders():inventoryPublicSealedTools();process.stdout.write(JSON.stringify(report)+'\n');process.exitCode=report.outcome===(fixed?'PUBLIC_BYTES_OBSERVED_NOT_ACCEPTED':'PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED')?0:74;
}
