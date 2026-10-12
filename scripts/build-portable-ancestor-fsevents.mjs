// Explicit build only; never launches the resulting collector.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {readBoundedPortableFile} from '../src/portable-command.mjs';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const fail=code=>{throw Object.assign(Error(code),{code});};
export function buildPortableAncestorFSEvents(output,options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(key=>!['diagnostic','diagnosticDrain'].includes(key)))fail('ANCESTOR_BUILD_USAGE');
  const boolean=key=>{const descriptor=Object.getOwnPropertyDescriptor(options,key);if(!descriptor)return false;
    if(!Object.hasOwn(descriptor,'value')||typeof descriptor.value!=='boolean')fail('ANCESTOR_BUILD_USAGE');return descriptor.value;};
  const diagnostic=boolean('diagnostic'),diagnosticDrain=boolean('diagnosticDrain');
  if(diagnosticDrain&&!diagnostic)fail('ANCESTOR_BUILD_USAGE');
  if(process.platform!=='darwin'||process.arch!=='arm64'||!path.isAbsolute(output)||path.resolve(output)!==output)fail('ANCESTOR_BUILD_PLATFORM');
  const parent=path.dirname(output);let part=path.parse(parent).root;const identities=[];
  for(const item of parent.slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,item);const stat=fs.lstatSync(part);if(!stat.isDirectory()||stat.isSymbolicLink())fail('ANCESTOR_BUILD_PATH');identities.push([part,stat.dev,stat.ino]);}
  if(fs.existsSync(output))fail('ANCESTOR_BUILD_EXISTS');
  const source=fileURLToPath(new URL('../src/portable-ancestor-fsevents.cc',import.meta.url));
  const sourceBefore=fs.lstatSync(source,{bigint:true});
  if(!sourceBefore.isFile()||sourceBefore.isSymbolicLink()||sourceBefore.nlink!==1n)fail('ANCESTOR_BUILD_PATH');
  const sourceBytes=readBoundedPortableFile(source);
  const compilerVersion=spawnSync('/usr/bin/xcrun',['clang++','--version'],{encoding:'utf8',timeout:5000,maxBuffer:65536});
  if(compilerVersion.error||compilerVersion.signal||compilerVersion.status!==0)fail('ANCESTOR_BUILD_FAILED');
  const flags=['-std=c++17','-O2','-fblocks','-arch','arm64','-mmacosx-version-min=13.0',...(diagnostic?['-DREDUE_ANCESTOR_DIAGNOSTIC']:[]),...(diagnosticDrain?['-DREDUE_ANCESTOR_DIAGNOSTIC_DRAIN']:[])];
  const temporary=fs.mkdtempSync(path.join(parent,'.ancestor-build-'));fs.chmodSync(temporary,0o700);
  try{
    const compiled=path.join(temporary,'collector');
    const result=spawnSync('/usr/bin/xcrun',['clang++',...flags,source,'-framework','CoreServices','-o',compiled],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
    if(result.error||result.signal||result.status!==0)fail('ANCESTOR_BUILD_FAILED');
    const sourceAfter=fs.lstatSync(source,{bigint:true});
    if(sourceBefore.dev!==sourceAfter.dev||sourceBefore.ino!==sourceAfter.ino||sourceBefore.ctimeNs!==sourceAfter.ctimeNs||!sourceBytes.equals(readBoundedPortableFile(source)))fail('ANCESTOR_BUILD_CHANGED');
    for(const [file,dev,ino] of identities){const stat=fs.lstatSync(file);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.dev!==dev||stat.ino!==ino)fail('ANCESTOR_BUILD_CHANGED');}
    const bytes=readBoundedPortableFile(compiled);fs.writeFileSync(output,bytes,{flag:'wx',mode:0o700});
    if(!bytes.equals(readBoundedPortableFile(output)))fail('ANCESTOR_BUILD_CHANGED');
    for(const [file,dev,ino] of identities){const stat=fs.lstatSync(file);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.dev!==dev||stat.ino!==ino)fail('ANCESTOR_BUILD_CHANGED');}
    const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
    return {schema:1,mode:diagnosticDrain?'diagnostic-drain':diagnostic?'diagnostic':'production',sourceSha256:sha(sourceBytes),executableSha256:sha(bytes),bytes:bytes.length,compilerVersion:compilerVersion.stdout.split('\n')[0].slice(0,256),flags,started:false};
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const tail=process.argv.slice(4).join(' ');
  if(process.argv[2]!=='--output'||!['','--diagnostic','--diagnostic --diagnostic-drain'].includes(tail)||![4,5,6].includes(process.argv.length))fail('ANCESTOR_BUILD_USAGE');
  console.log(JSON.stringify(buildPortableAncestorFSEvents(process.argv[3],{diagnostic:tail!=='',diagnosticDrain:tail==='--diagnostic --diagnostic-drain'})));
}
