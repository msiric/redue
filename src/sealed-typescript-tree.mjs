// Data-only materialization for a separately enforced execution recipe.
// Fresh inodes and ownership do NOT seal this tree against same-UID writers.
// Internal caller MUST independently derive this manifest from local inputs;
// an imported manifest is never execution or filesystem authority.
// Requires a trusted, quiescent PRE-AGENT preparation phase and a separately
// reviewed preparer filesystem boundary. Path/fingerprint checks detect races;
// they are NOT atomic read confinement or credential/privacy isolation.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical} from './portable-envelope.mjs';
import {withinPath} from './path-identity.mjs';
import {sealedNpmShimTarget} from './sealed-typescript-shim.mjs';

export const TYPESCRIPT_TREE_LIMITS=Object.freeze({files:100000,fileBytes:64*1024*1024,
  totalBytes:512*1024*1024,pathBytes:4096,depth:64,directories:100000});
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
const identity=stat=>`${stat.dev}:${stat.ino}`;
const directoryIdentity=stat=>`${stat.dev}:${stat.ino}:${stat.mode}:${stat.uid}`;
const fingerprint=stat=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
const uid=()=>{if(typeof process.getuid!=='function'||fs.constants.O_NOFOLLOW===undefined)fail('TREE_PLATFORM');return BigInt(process.getuid());};
function relative(value){return typeof value==='string'&&value.length>0&&Buffer.byteLength(value)<=TYPESCRIPT_TREE_LIMITS.pathBytes&&
  Buffer.from(value).toString('utf8')===value&&!/[\u0000-\u001f\u007f\\:]/u.test(value)&&!value.startsWith('/')&&
  value.split('/').length<=TYPESCRIPT_TREE_LIMITS.depth&&value.split('/').every(part=>part&&part!=='.'&&part!=='..');}
function absolute(value){if(typeof value!=='string'||!path.isAbsolute(value)||path.resolve(value)!==value)fail('TREE_PATH');return value;}
function directories(file){let current=path.parse(file).root;const rows=[];
  for(const part of file.slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const stat=fs.lstatSync(current,{bigint:true});
    if(!stat.isDirectory()||stat.isSymbolicLink())fail('TREE_PATH');rows.push([current,directoryIdentity(stat)]);}
  return rows;
}
function sameDirectories(rows){for(const [file,id] of rows){const stat=fs.lstatSync(file,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||directoryIdentity(stat)!==id)fail('TREE_CHANGED');}}
function onlyChild(parent,name){const directory=fs.opendirSync(parent);try{const first=directory.readSync();return name===null?first===null:first?.name===name&&directory.readSync()===null;}finally{directory.closeSync();}}
function exactOptions(options){if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||
  Reflect.ownKeys(options).length!==3||!['root','manifest','parent'].every(key=>Object.hasOwn(options,key)))fail('TREE_OPTIONS');
  const out={};for(const key of ['root','manifest','parent']){const descriptor=Object.getOwnPropertyDescriptor(options,key);if(!Object.hasOwn(descriptor,'value'))fail('TREE_OPTIONS');out[key]=descriptor.value;}return out;
}
function manifestRows(value){if(!Array.isArray(value)||value.length<1||value.length>TYPESCRIPT_TREE_LIMITS.files)fail('TREE_MANIFEST');
  if(Reflect.ownKeys(value).some(key=>key!=='length'&&(typeof key!=='string'||! /^(?:0|[1-9][0-9]*)$/.test(key)||Number(key)>=value.length)))fail('TREE_MANIFEST');
  const rows=[];let previous='';for(let at=0;at<value.length;at++){const entry=Object.getOwnPropertyDescriptor(value,String(at));if(!entry||!Object.hasOwn(entry,'value'))fail('TREE_MANIFEST');
    const row=entry.value;if(!Array.isArray(row)||row.length!==2||Reflect.ownKeys(row).some(key=>!['0','1','length'].includes(key)))fail('TREE_MANIFEST');
    const a=Object.getOwnPropertyDescriptor(row,'0'),b=Object.getOwnPropertyDescriptor(row,'1');if(!a||!b||!Object.hasOwn(a,'value')||!Object.hasOwn(b,'value'))fail('TREE_MANIFEST');
    const rel=a.value,digest=b.value;if(!relative(rel)||typeof digest!=='string'||! /^[a-f0-9]{64}$/.test(digest)||rel<=previous)fail('TREE_MANIFEST');
    previous=rel;rows.push([rel,digest]);}
  const names=new Set(rows.map(([rel])=>rel));for(const [rel] of rows){let parent=path.posix.dirname(rel);while(parent!=='.'){if(names.has(parent))fail('TREE_MANIFEST');parent=path.posix.dirname(parent);}}
  return rows;
}
function safeRegular(stat){if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==uid()||stat.nlink!==1n||(stat.mode&0o7000n)!==0n)fail('TREE_FILE');
  if(stat.size>BigInt(TYPESCRIPT_TREE_LIMITS.fileBytes))fail('TREE_LIMIT');}
function typedRegular(mode,content){return hash(`file:${mode}:${content}`);}
function inspectFile(file,expected,write){const parents=directories(path.dirname(file)),before=fs.lstatSync(file,{bigint:true});safeRegular(before);
  let descriptor;try{descriptor=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|(fs.constants.O_NONBLOCK??0));const opened=fs.fstatSync(descriptor,{bigint:true});safeRegular(opened);
    if(fingerprint(before)!==fingerprint(opened))fail('TREE_CHANGED');sameDirectories(parents);
    const digest=createHash('sha256'),buffer=Buffer.allocUnsafe(65536);let offset=0;
    while(offset<Number(opened.size)){const count=fs.readSync(descriptor,buffer,0,Math.min(buffer.length,Number(opened.size)-offset),offset);if(!count)fail('TREE_CHANGED');digest.update(buffer.subarray(0,count));write?.(buffer.subarray(0,count));offset+=count;}
    if(fs.readSync(descriptor,buffer,0,1,offset)!==0)fail('TREE_CHANGED');
    const after=fs.lstatSync(file,{bigint:true});sameDirectories(parents);
    if(fingerprint(opened)!==fingerprint(fs.fstatSync(descriptor,{bigint:true}))||fingerprint(opened)!==fingerprint(after))fail('TREE_CHANGED');
    const typed=typedRegular(opened.mode,digest.digest('hex'));if(typed!==expected)fail('TREE_DIGEST');return{file,parents,fingerprint:fingerprint(after),identity:identity(after),mode:Number(after.mode&0o777n),bytes:offset};
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
function shim(root,rel,expected,manifest){const file=path.join(root,rel),parents=directories(path.dirname(file)),before=fs.lstatSync(file,{bigint:true});
  if(!before.isSymbolicLink()||before.uid!==uid()||before.nlink!==1n)fail('TREE_SYMLINK');
  const target=fs.readlinkSync(file),{physical,relative:targetRel}=sealedNpmShimTarget(root,rel,target);
  if(!relative(targetRel)||!manifest.has(targetRel))fail('TREE_SYMLINK');directories(path.dirname(physical));const targetStat=fs.lstatSync(physical,{bigint:true});safeRegular(targetStat);
  const actual=hash(canonical({kind:'npm-file-shim',target:targetRel,content:manifest.get(targetRel),links:[{path:rel,targetHash:hash(target)}]}));
  if(actual!==expected)fail('TREE_DIGEST');sameDirectories(parents);const after=fs.lstatSync(file,{bigint:true});
  if(fingerprint(before)!==fingerprint(after)||fs.readlinkSync(file)!==target)fail('TREE_CHANGED');
  return{file,parents,fingerprint:fingerprint(after),identity:identity(after),target,targetRel,bytes:0};
}
function recheck(record){sameDirectories(record.parents);const stat=fs.lstatSync(record.file,{bigint:true});if(fingerprint(stat)!==record.fingerprint||record.target!==undefined&&fs.readlinkSync(record.file)!==record.target)fail('TREE_CHANGED');}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

function materialize(options){
  const selected=exactOptions(options),root=absolute(selected.root),parent=absolute(selected.parent),rows=manifestRows(selected.manifest),manifest=new Map(rows);
  if(withinPath(parent,root)||withinPath(root,parent))fail('TREE_PLACEMENT');
  const rootParents=directories(root),parentParents=directories(parent),rootStat=fs.lstatSync(root,{bigint:true}),parentStat=fs.lstatSync(parent,{bigint:true});
  // Case aliases (and other existing physical aliases) can defeat lexical
  // containment even when realpath preserves their spelling.
  const containsPhysical=(rows,stat)=>rows.some(([,id])=>id.split(':').slice(0,2).join(':')===identity(stat));
  if(containsPhysical(parentParents,rootStat)||containsPhysical(rootParents,parentStat))fail('TREE_PLACEMENT');
  if(rootStat.uid!==uid()||parentStat.uid!==uid()||(parentStat.mode&0o777n)!==0o700n)fail('TREE_OWNERSHIP');
  if(!onlyChild(parent,null))fail('TREE_PARENT_OCCUPIED');sameDirectories(parentParents);
  const source=[];let bytes=0;for(const [rel,digest] of rows){const file=path.join(root,rel),stat=fs.lstatSync(file,{bigint:true});
    const record=stat.isSymbolicLink()?shim(root,rel,digest,manifest):inspectFile(file,digest);
    bytes+=record.bytes;if(bytes>TYPESCRIPT_TREE_LIMITS.totalBytes)fail('TREE_LIMIT');source.push({rel,digest,...record});}
  sameDirectories(rootParents);sameDirectories(parentParents);
  let stage=null,stageId=null;const destination=[];const madeDirectories=new Map(),sourceIdentities=new Set(source.map(record=>record.identity));
  const ensureDirectory=rel=>{let current=stage;for(const part of rel.split('/').filter(Boolean)){current=path.join(current,part);if(!madeDirectories.has(current)){
      if(madeDirectories.size>=TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_LIMIT');fs.mkdirSync(current,{mode:0o700});const stat=fs.lstatSync(current,{bigint:true});if(!stat.isDirectory()||stat.uid!==uid()||stat.isSymbolicLink())fail('TREE_CHANGED');madeDirectories.set(current,directoryIdentity(stat));}
      const stat=fs.lstatSync(current,{bigint:true});if(directoryIdentity(stat)!==madeDirectories.get(current)||!stat.isDirectory()||stat.isSymbolicLink())fail('TREE_CHANGED');}};
  const checkStage=()=>{sameDirectories(parentParents);if(!onlyChild(parent,path.basename(stage)))fail('TREE_CHANGED');sameDirectories(parentParents);const stat=fs.lstatSync(stage,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid()||(stat.mode&0o777n)!==0o700n||identity(stat)!==stageId)fail('TREE_CHANGED');};
  const checkDirectories=()=>{for(const [file,id] of madeDirectories){const st=fs.lstatSync(file,{bigint:true});if(!st.isDirectory()||st.isSymbolicLink()||directoryIdentity(st)!==id||st.uid!==uid())fail('TREE_CHANGED');}};
  try{stage=fs.mkdtempSync(path.join(parent,'redue-materialization-'));fs.chmodSync(stage,0o700);stageId=identity(fs.lstatSync(stage,{bigint:true}));
    for(const record of source.filter(record=>record.target===undefined)){
      checkStage();recheck(record);const directory=path.posix.dirname(record.rel);if(directory!=='.')ensureDirectory(directory);const file=path.join(stage,record.rel);let descriptor;
      try{descriptor=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);const created=fs.fstatSync(descriptor,{bigint:true});
        if(!created.isFile()||created.nlink!==1n||created.uid!==uid()||sourceIdentities.has(identity(created)))fail('TREE_CHANGED');
        inspectFile(record.file,record.digest,buffer=>{let offset=0;while(offset<buffer.length){const count=fs.writeSync(descriptor,buffer,offset,buffer.length-offset);if(!count)fail('TREE_CHANGED');offset+=count;}});
        fs.fchmodSync(descriptor,record.mode);fs.fsyncSync(descriptor);checkStage();const after=fs.fstatSync(descriptor,{bigint:true});if(identity(after)!==identity(created)||fingerprint(after)!==fingerprint(fs.lstatSync(file,{bigint:true})))fail('TREE_CHANGED');
      }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}checkStage();destination.push({rel:record.rel,digest:record.digest,...inspectFile(file,record.digest)});
    }
    for(const record of source.filter(record=>record.target!==undefined)){
      checkStage();recheck(record);ensureDirectory(path.posix.dirname(record.rel));const file=path.join(stage,record.rel);fs.symlinkSync(record.target,file);checkStage();
      const copied=shim(stage,record.rel,record.digest,manifest);if(sourceIdentities.has(copied.identity))fail('TREE_CHANGED');destination.push({rel:record.rel,digest:record.digest,...copied});}
    for(const record of source)recheck(record);for(const record of destination){recheck(record);if(record.target===undefined)inspectFile(record.file,record.digest);else shim(stage,record.rel,record.digest,manifest);}
    sameDirectories(rootParents);checkStage();
    // Bounded enumeration only; never allocate an unbounded directory listing.
    const actual=[];let entries=0,directoryCount=0;const walk=directory=>{const opened=fs.opendirSync(directory);try{let entry;
      while((entry=opened.readSync())!==null){
        if(++entries>TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_LIMIT');
        const file=path.join(directory,entry.name),stat=fs.lstatSync(file,{bigint:true});if(stat.isDirectory()){
          if(++directoryCount>TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_LIMIT');if(!madeDirectories.has(file))fail('TREE_CHANGED');walk(file);
        }else{const rel=path.relative(stage,file).split(path.sep).join('/');if(!manifest.has(rel)||actual.length>=rows.length)fail('TREE_CHANGED');actual.push(rel);}
      }
    }finally{opened.closeSync();}};walk(stage);actual.sort();
    if(canonical(actual)!==canonical(rows.map(([rel])=>rel)))fail('TREE_CHANGED');checkStage();checkDirectories();for(const record of destination)recheck(record);
    return freeze({schema:1,interpretation:'redue-typescript-materialization@1',root:stage,manifestDigest:hash(canonical(rows)),files:rows,bytes,
      identity:stageId,physical:destination.sort((a,b)=>a.rel<b.rel?-1:a.rel>b.rel?1:0).map(record=>[record.rel,record.identity,record.fingerprint]),sealed:false,reuseEligible:false});
  }catch(error){
    // Always retain a failed partial stage. A pathname-based recursive cleanup
    // could cross a replaced ancestor after its last validation. The caller
    // must inspect/reclaim remnants separately under its reviewed ownership
    // boundary; these byte limits are per attempt, not a cumulative disk quota.
    if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_UNAVAILABLE');
  }
}
export function materializeSealedTypeScriptTree(options){
  try{return materialize(options);}catch(error){if(typeof error?.code==='string'&&error.code.startsWith('TREE_'))throw error;fail('TREE_UNAVAILABLE');}
}
