// TEST-ONLY explicit native build. This helper never starts the resulting guard.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const fail=code=>{throw Object.assign(Error(code),{code});};
export function buildPortableVnodeGuard(output){
  if(arguments.length!==1)fail('VNODE_BUILD_USAGE');
  if(process.platform!=='darwin'||process.arch!=='arm64'||typeof output!=='string'||!path.isAbsolute(output)||path.resolve(output)!==output)fail('VNODE_BUILD_PLATFORM');
  const parent=path.dirname(output);let part=path.parse(parent).root;const identities=[];
  for(const item of parent.slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,item);const stat=fs.lstatSync(part);if(!stat.isDirectory()||stat.isSymbolicLink())fail('VNODE_BUILD_PATH');identities.push([part,stat.dev,stat.ino]);}
  if(fs.existsSync(output))fail('VNODE_BUILD_EXISTS');
  const source=fileURLToPath(new URL('../fixtures/portable-vnode-guard.cc',import.meta.url));
  const before=fs.lstatSync(source,{bigint:true});if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n)fail('VNODE_BUILD_PATH');
  const sourceBytes=readBoundedPortableFile(source);
  const version=spawnSync('/usr/bin/xcrun',['clang++','--version'],{encoding:'utf8',timeout:5000,maxBuffer:65536});
  if(version.error||version.signal||version.status!==0)fail('VNODE_BUILD_FAILED');
  const flags=['-std=c++17','-O2','-arch','arm64','-mmacosx-version-min=13.0'];
  const temporary=fs.mkdtempSync(path.join(parent,'.vnode-build-'));fs.chmodSync(temporary,0o700);
  try{const compiled=path.join(temporary,'guard');const result=spawnSync('/usr/bin/xcrun',['clang++',...flags,source,'-o',compiled],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
    if(result.error||result.signal||result.status!==0)fail('VNODE_BUILD_FAILED');
    const after=fs.lstatSync(source,{bigint:true});if(before.dev!==after.dev||before.ino!==after.ino||before.ctimeNs!==after.ctimeNs||!sourceBytes.equals(readBoundedPortableFile(source)))fail('VNODE_BUILD_CHANGED');
    for(const [file,dev,ino] of identities){const stat=fs.lstatSync(file);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.dev!==dev||stat.ino!==ino)fail('VNODE_BUILD_CHANGED');}
    const bytes=readBoundedPortableFile(compiled);fs.writeFileSync(output,bytes,{flag:'wx',mode:0o700});
    if(!bytes.equals(readBoundedPortableFile(output)))fail('VNODE_BUILD_CHANGED');
    for(const [file,dev,ino] of identities){const stat=fs.lstatSync(file);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.dev!==dev||stat.ino!==ino)fail('VNODE_BUILD_CHANGED');}
    const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
    return{schema:1,mode:'test-only-vnode',sourceSha256:sha(sourceBytes),executableSha256:sha(bytes),bytes:bytes.length,compilerVersion:version.stdout.split('\n')[0].slice(0,256),flags,started:false};
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(process.argv.length!==4||process.argv[2]!=='--output')fail('VNODE_BUILD_USAGE');
  console.log(JSON.stringify(buildPortableVnodeGuard(process.argv[3])));
}
