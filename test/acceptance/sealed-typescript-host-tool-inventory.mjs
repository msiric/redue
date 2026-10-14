// Storage-free public-tool inventory for the approved standard macOS VM.
// No compiler/helper/native/model execution, credentials, signing or authority.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const guard=(x,reason)=>{if(!x){const error=Error('PUBLIC_TOOL_INVENTORY_UNKNOWN');if(reason)error.inventoryGuard=reason;throw error;}};
const mark=s=>['dev','ino','uid','gid','mode','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
function lineage(file,rootOnly=false){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());if(rootOnly){guard(s.uid===0n,'OWNER_MISMATCH');guard((s.mode&0o22n)===0n,'PERMISSIONS_UNSUPPORTED');}rows.push([at,['dev','ino','uid','gid','mode'].map(k=>String(s[k])).join(':')]);if(at===path.dirname(at))return rows;}}
function publicFile(file,owner,limit,result={}){
 result.observationPhase='CANONICAL_PATH';result.metadata={canonicalMatch:fs.realpathSync(file)===file};guard(result.metadata.canonicalMatch,'NON_CANONICAL');
 result.observationPhase='FILE_METADATA';const s=fs.lstatSync(file,{bigint:true});
 result.metadata={...result.metadata,type:s.isSymbolicLink()?'SYMLINK':s.isFile()?'REGULAR_FILE':s.isDirectory()?'DIRECTORY':'OTHER',
  byteSize:s.size>=0n&&s.size<=BigInt(Number.MAX_SAFE_INTEGER)?Number(s.size):null,
  owner:s.uid===0n?'ROOT':s.uid===BigInt(process.getuid())?'CALLER':'OTHER',ownerMatches:s.uid===BigInt(owner),singleLink:s.nlink===1n,
  permissionsAccepted:(s.mode&0o6022n)===0n,size:s.size<=0n?'EMPTY_OR_INVALID':s.size>BigInt(limit)?'OVER_LIMIT':'WITHIN_LIMIT'};
 guard(s.isFile()&&!s.isSymbolicLink(),'FILE_TYPE_UNSUPPORTED');guard(s.uid===BigInt(owner),'OWNER_MISMATCH');guard(s.nlink===1n,'LINK_COUNT_UNSUPPORTED');
 guard((s.mode&0o6022n)===0n,'PERMISSIONS_UNSUPPORTED');guard(s.size>0n&&s.size<=BigInt(limit),'SIZE_UNSUPPORTED');
 result.observationPhase='ANCESTOR_METADATA';const before=lineage(file);
 result.observationPhase='OPEN_READ_ONLY';const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK),hash=createHash('sha256');result.fdClose='NOT_OBSERVED';
 try{result.observationPhase='START_FD_IDENTITY';guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})),'OPEN_FD_IDENTITY_CHANGED');
  result.observationPhase='BODY_HASH';const bytes=Buffer.alloc(65536);let at=0;while(at<Number(s.size)){const asked=Math.min(bytes.length,Number(s.size)-at),n=fs.readSync(fd,bytes,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked,'BODY_READ_INVALID');hash.update(bytes.subarray(0,n));at+=n;}
  result.observationPhase='CLOSING_FD_IDENTITY';guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})),'CLOSING_FD_IDENTITY_CHANGED');
 }finally{fs.closeSync(fd);result.fdClose='CLOSED';}
 result.observationPhase='CLOSING_NAME_IDENTITY';guard(mark(s)===mark(fs.lstatSync(file,{bigint:true})),'CLOSING_NAME_IDENTITY_CHANGED');
 result.observationPhase='CLOSING_ANCESTOR_IDENTITY';guard(JSON.stringify(before)===JSON.stringify(lineage(file)),'CLOSING_ANCESTOR_IDENTITY_CHANGED');
 Object.assign(result,{sha256:hash.digest('hex'),bytes:Number(s.size),owner:owner===0?'ROOT':'CALLER',stat:{regularFile:true,singleLink:true,permissionBits:Number(s.mode&0o7777n),canonical:true,closingIdentityChecked:true}});result.observationPhase='COMPLETE';return result;
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
 guard(fs.realpathSync(CLT_SDK_ALIAS)===canonical,'NON_CANONICAL');result.aliasPhase='COMPLETE';
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
  requiredSdk:{canonical:REQUIRED_SDK,headers:{}},observedClt:{scope:'OBSERVATIONAL_NOT_BUILD_ACCEPTED',clang:{canonical:REQUIRED_TOOLS[0][1]},sdk:{lookup:CLT_SDK_ALIAS,headers:{}}},failures:[],stockStartup:{},etcAlias:null,profileApproved:false,models:0,nativeAgentLaunches:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false};
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
  report.sdk={...sdk,headers:{}};
  for(const [slot,result]of [['SELECTED_SDK_FILES',report.sdk],['REQUIRED_LITERAL_SDK_FILES',report.requiredSdk]])try{sdkFiles(result.canonical,result);}catch(error){noteFailure(error,slot);}
  for(const [file,limit]of [['/private/etc/profile',4096],['/private/etc/bashrc',4096],['/bin/bash',2*1024*1024],['/usr/libexec/path_helper',256*1024]])try{publicFile(file,0,limit,report.stockStartup[file]={});}catch(error){noteFailure(error,'STOCK_STARTUP:'+file);}
  try{report.etcAlias=etcAlias();}catch(error){noteFailure(error,'ETC_ALIAS_METADATA');}
  if(report.failures.length===0){report.outcome='PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED';phase='COMPLETE';}else phase='COMPLETE_WITH_UNKNOWN';
 }catch(error){noteFailure(error,phase);/* Never raw exceptions or environments. */}
 report.phase=phase;
 return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 guard(process.argv.length===2);const report=inventoryPublicSealedTools();process.stdout.write(JSON.stringify(report)+'\n');process.exitCode=report.outcome==='PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED'?0:74;
}
