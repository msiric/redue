// An installed npm package checked against what the lockfile recorded: the
// tarball npm cached under the lockfile's integrity (sha512, else sha1),
// unpacked in memory and compared file by file. Nothing is fetched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {npmrc} from './npmrc.mjs';
import {racyUntil} from './path-identity.mjs';

const fail=code=>{throw Object.assign(Error(code),{code});};
// npm's cache directory, as npm picks it: npm_config_cache, else `cache` in
// the project's .npmrc, then the user's (npm_config_userconfig or
// ~/.npmrc), else npm's default. A leading ~ is the home directory. The
// global npmrc is not read.
export function npmCacheDir(root=null,env=process.env,platform=process.platform,home=os.homedir()){
  const variable=name=>Object.entries(env).find(([key])=>key.toLowerCase()===name)?.[1];
  const expand=value=>path.resolve(value.replace(/^~(?=$|[\/])/,home));
  const configured=variable('npm_config_cache');
  if(configured)return expand(configured);
  for(const file of [root&&path.join(root,'.npmrc'),variable('npm_config_userconfig')||path.join(home,'.npmrc')].filter(Boolean)){
    let cache;try{cache=npmrc(file).cache;}catch{}
    if(typeof cache==='string'&&cache)return expand(cache);
  }
  return platform==='win32'?path.join(env.LOCALAPPDATA||path.join(home,'AppData','Local'),'npm-cache'):path.join(home,'.npm');
}
// The package-lock.json entry for an installed top-level package:
// {version, integrity, resolved, alias}. npm-shrinkwrap.json, which npm reads
// instead, is not modeled. Parsed entries are kept per process by the
// lockfile's identity: the daemon asks on every reuse check.
const lockfiles=new Map();
export function lockedPackage(root,name){
  if(fs.existsSync(path.join(root,'npm-shrinkwrap.json')))fail('npm-shrinkwrap-unsupported');
  const file=path.join(root,'package-lock.json');
  let st;try{st=fs.statSync(file,{bigint:true});}catch{fail('npm-lockfile-integrity-missing');}
  const identity=[st.dev,st.ino,st.size,st.mtimeNs,st.ctimeNs].join(':');
  let packages=lockfiles.get(file)?.identity===identity?lockfiles.get(file).packages:null;
  if(!packages){
    try{packages=JSON.parse(fs.readFileSync(file,'utf8'))?.packages;}catch{fail('npm-lockfile-unreadable');}
    // A lockfile changed within the racy window is read again next time.
    if(racyUntil(st)<=Date.now())lockfiles.set(file,{identity,packages});
  }
  const entry=packages?.[`node_modules/${name}`];
  if(!entry||typeof entry.version!=='string'||typeof entry.integrity!=='string')fail('npm-lockfile-integrity-missing');
  return {version:entry.version,integrity:entry.integrity,resolved:entry.resolved??null,alias:entry.name??null};
}
// Whether a lockfile entry is the registry's own package NAME at VERSION:
// no alias, and a tarball URL .../NAME/-/NAME-VERSION.tgz over https.
export const registryPackage=(entry,name,version)=>entry.alias===null&&typeof entry.resolved==='string'&&
  /^https:\/\//.test(entry.resolved)&&entry.resolved.endsWith(`/${name}/-/${name}-${version}.tgz`);
// The digest an SRI string names, as {algorithm, hex}: sha512, else sha1
// (some registries record only sha1; a collision needs a malicious party,
// which is outside REDUE's threat model). null for anything else.
export function sriDigest(integrity){
  const items=String(integrity).split(/\s+/);
  for(const [algorithm,length] of [['sha512',64],['sha1',20]]){
    const value=items.map(item=>new RegExp(`^${algorithm}-([A-Za-z0-9+/]+={0,2})$`).exec(item)?.[1]).find(Boolean);
    const bytes=value&&Buffer.from(value,'base64');
    if(bytes?.length===length)return {algorithm,hex:bytes.toString('hex')};
  }
  return null;
}
// The cached tarball for an integrity, checked against it.
export function cachedTarball(cache,integrity){
  const digest=sriDigest(integrity);
  if(!digest)fail('npm-lockfile-integrity-unsupported');
  const {algorithm,hex}=digest;
  let bytes;
  try{bytes=fs.readFileSync(path.join(cache,'_cacache','content-v2',algorithm,hex.slice(0,2),hex.slice(2,4),hex.slice(4)));}
  catch{fail('npm-tarball-uncached');}
  if(createHash(algorithm).update(bytes).digest('hex')!==hex)fail('npm-tarball-corrupt');
  return bytes;
}
// The regular files of a gzipped npm tarball, as Map(path below the top
// directory -> bytes). Links and special files are refused.
export function tarballFiles(gzipped){
  let tar;try{tar=zlib.gunzipSync(gzipped,{maxOutputLength:512*1024*1024});}catch{fail('npm-tarball-invalid');}
  const files=new Map();
  const text=(block,from,to)=>block.subarray(from,to).toString('utf8').replace(/\0[\s\S]*$/,'');
  let offset=0,longName=null,paxPath=null;
  while(offset+512<=tar.length){
    const header=tar.subarray(offset,offset+512);
    if(header.every(byte=>byte===0))break;
    const size=parseInt(text(header,124,136).trim()||'0',8),type=String.fromCharCode(header[156]||48);
    if(!Number.isSafeInteger(size)||size<0)fail('npm-tarball-invalid');
    const body=tar.subarray(offset+512,offset+512+size);
    offset+=512+Math.ceil(size/512)*512;
    if(type==='x'){
      // pax records: "LEN key=value\n"
      for(const record of body.toString('utf8').split('\n')){const match=/^\d+ path=(.*)$/.exec(record);if(match)paxPath=match[1];}
      continue;
    }
    if(type==='g')continue;
    if(type==='L'){longName=body.toString('utf8').replace(/\0[\s\S]*$/,'');continue;}
    const prefix=text(header,345,500);
    const name=paxPath??longName??(prefix?`${prefix}/${text(header,0,100)}`:text(header,0,100));
    paxPath=null;longName=null;
    if(type==='5')continue;
    if(!['0','7'].includes(type))fail('npm-tarball-link-unsupported');
    // npm strips the top directory (usually package/).
    const relative=name.split('/').slice(1).join('/');
    if(!relative||relative.split('/').some(part=>part===''||part==='.'||part==='..'))fail('npm-tarball-invalid');
    files.set(relative,body);
  }
  return files;
}
// Whether `dir` holds exactly the tarball's files, byte for byte; throws
// otherwise. About 120 ms for TypeScript 6 (140 files, 24 MB).
export function matchTarball(dir,files){
  let count=0;
  const walk=(folder,relative='')=>{
    let entries;try{entries=fs.readdirSync(folder,{withFileTypes:true});}catch{fail('direct-typescript-implementation-unreviewed');}
    for(const entry of entries){
      const name=relative?`${relative}/${entry.name}`:entry.name,full=path.join(folder,entry.name);
      if(entry.isDirectory()){walk(full,name);continue;}
      const expected=files.get(name);
      let same=false;try{same=entry.isFile()&&Boolean(expected)&&fs.readFileSync(full).equals(expected);}catch{}
      if(!same)fail('direct-typescript-implementation-unreviewed');
      count++;
    }
  };walk(dir);
  if(count!==files.size)fail('direct-typescript-implementation-unreviewed');
}
