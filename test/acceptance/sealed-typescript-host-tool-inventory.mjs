// Storage-free public-tool inventory for the approved standard macOS VM.
// No compiler/helper/native/model execution, credentials, signing or authority.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const guard=x=>{if(!x)throw Error('PUBLIC_TOOL_INVENTORY_UNKNOWN');};
const mark=s=>['dev','ino','uid','gid','mode','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
function lineage(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,['dev','ino','uid','gid','mode'].map(k=>String(s[k])).join(':')]);if(at===path.dirname(at))return rows;}}
function publicFile(file,owner,limit){
 guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
 const before=lineage(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK),hash=createHash('sha256');
 try{guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})));const bytes=Buffer.alloc(65536);let at=0;while(at<Number(s.size)){const asked=Math.min(bytes.length,Number(s.size)-at),n=fs.readSync(fd,bytes,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked);hash.update(bytes.subarray(0,n));at+=n;}guard(mark(s)===mark(fs.fstatSync(fd,{bigint:true})));}finally{fs.closeSync(fd);}
 guard(mark(s)===mark(fs.lstatSync(file,{bigint:true}))&&JSON.stringify(before)===JSON.stringify(lineage(file)));return {sha256:hash.digest('hex'),bytes:Number(s.size),owner:owner===0?'ROOT':'CALLER'};
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
 const canonical=fs.realpathSync(value.slice(0,-1));guard(publicDeveloperPath(canonical,kind));return canonical;
}
export function inventoryPublicSealedTools(){
 let report={schema:1,scope:'PUBLIC_HOST_TOOL_INVENTORY_ONLY',outcome:'UNKNOWN',platform:process.platform,arch:process.arch,node:process.version,release:os.release(),tools:{},models:0,nativeAgentLaunches:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false};
 try{
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  // Only public system tools and the already selected official runtime. Paths
  // returned by xcrun are data; never execute them or accept arbitrary paths.
  report.tools.xcrun=publicFile('/usr/bin/xcrun',0,1024*1024);
  const runtime=fs.realpathSync(process.execPath);report.tools.node=publicFile(runtime,process.getuid(),128*1024*1024);
  guard(report.tools.node.sha256==='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc');
  const clang=resolvePublicTool(['--find','clang'],'CLANG'),ld=resolvePublicTool(['--find','ld'],'LD'),sdk=resolvePublicTool(['--sdk','macosx','--show-sdk-path'],'SDK');
  report.tools.clang=publicFile(clang,0,256*1024*1024);report.tools.ld=publicFile(ld,0,32*1024*1024);
  const selected=fs.lstatSync(sdk,{bigint:true});guard(selected.isDirectory()&&!selected.isSymbolicLink()&&selected.uid===0n&&(selected.mode&0o22n)===0n);
  const parents=lineage(sdk);report.sdk={canonical:sdk,headers:{}};
  for(const name of ['sys/stdio.h','sys/fcntl.h','fcntl.h','sys/mman.h','sys/stat.h'])report.sdk.headers[name]=publicFile(sdk+'/usr/include/'+name,0,1024*1024);
  guard(mark(fs.lstatSync(sdk,{bigint:true}))===mark(selected)&&JSON.stringify(lineage(sdk))===JSON.stringify(parents));
  report.outcome='PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED';
 }catch{/* Keep completed public facts, never raw exceptions or environments. */}
 return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 guard(process.argv.length===2);const report=inventoryPublicSealedTools();process.stdout.write(JSON.stringify(report)+'\n');process.exitCode=report.outcome==='PUBLIC_TOOL_BYTES_OBSERVED_NOT_ACCEPTED'?0:74;
}
