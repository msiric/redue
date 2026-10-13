// Data-only materialization for a separately enforced execution recipe.
// Fresh inodes and ownership do NOT seal this tree against same-UID writers.
// Internal caller MUST independently derive this manifest from local inputs;
// an imported manifest is never execution or filesystem authority.
// Requires a trusted, quiescent PRE-AGENT preparation phase and a separately
// reviewed preparer filesystem boundary. Path/fingerprint checks detect races;
// they are NOT atomic read confinement or credential/privacy isolation.
// This private stage is ephemeral: no crash durability/recovery is promised.
// A prior summary cannot authorize lost/incomplete copies after a crash; fresh
// checked preparation and recipient validation remain necessary.
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
function exactOptions(options,fullDirectories=false){
  const keys=fullDirectories?['root','manifest','parent','directoryInventory']:['root','manifest','parent'];if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||
  Reflect.ownKeys(options).length!==keys.length||!keys.every(key=>Object.hasOwn(options,key)))fail('TREE_OPTIONS');
  const out={};for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(options,key);if(!Object.hasOwn(descriptor,'value'))fail('TREE_OPTIONS');out[key]=descriptor.value;}return out;
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
function safeRegular(stat,source=false){if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==uid()||stat.nlink<1n||(!source&&stat.nlink!==1n)||(stat.mode&0o7000n)!==0n)fail('TREE_FILE');
  if(stat.size>BigInt(TYPESCRIPT_TREE_LIMITS.fileBytes))fail('TREE_LIMIT');}
function typedRegular(mode,content,nlink=1n,installed=false){return hash(`file:${mode}:${installed&&nlink>1n?`${nlink}:`:''}${content}`);}
function inspectFile(file,expected,{write,sourceRecord}={}){const parents=directories(path.dirname(file)),before=fs.lstatSync(file,{bigint:true});safeRegular(before,!!sourceRecord);
  if(sourceRecord){recheck(sourceRecord);if(fingerprint(before)!==sourceRecord.fingerprint)fail('TREE_CHANGED');}
  let descriptor;try{descriptor=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|(fs.constants.O_NONBLOCK??0));const opened=fs.fstatSync(descriptor,{bigint:true});safeRegular(opened,!!sourceRecord);
    if(fingerprint(before)!==fingerprint(opened))fail('TREE_CHANGED');sameDirectories(parents);
    const digest=createHash('sha256'),buffer=Buffer.allocUnsafe(65536);let offset=0;
    while(offset<Number(opened.size)){const count=fs.readSync(descriptor,buffer,0,Math.min(buffer.length,Number(opened.size)-offset),offset);if(!count)fail('TREE_CHANGED');digest.update(buffer.subarray(0,count));write?.(buffer.subarray(0,count));offset+=count;}
    if(fs.readSync(descriptor,buffer,0,1,offset)!==0)fail('TREE_CHANGED');
    const after=fs.lstatSync(file,{bigint:true});sameDirectories(parents);
    if(fingerprint(opened)!==fingerprint(fs.fstatSync(descriptor,{bigint:true}))||fingerprint(opened)!==fingerprint(after))fail('TREE_CHANGED');
    const rawDigest=digest.digest('hex'),typed=typedRegular(opened.mode,rawDigest,opened.nlink,!!sourceRecord&&sourceRecord.rel.startsWith('node_modules/'));
    if(typed!==expected)fail('TREE_DIGEST');return{file,parents,fingerprint:fingerprint(after),identity:identity(after),mode:Number(after.mode&0o777n),bytes:offset,materializedDigest:typedRegular(opened.mode,rawDigest)};
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
function shimDigest(rel,target,targetRel,manifest){return hash(canonical({kind:'npm-file-shim',target:targetRel,content:manifest.get(targetRel),links:[{path:rel,targetHash:hash(target)}]}));}
function shim(root,rel,expected,manifest,sourceRecords=null){const file=path.join(root,rel),parents=directories(path.dirname(file)),before=fs.lstatSync(file,{bigint:true});
  if(!before.isSymbolicLink()||before.uid!==uid()||before.nlink!==1n)fail('TREE_SYMLINK');
  const target=fs.readlinkSync(file),{physical,relative:targetRel}=sealedNpmShimTarget(root,rel,target);
  if(!relative(targetRel)||!manifest.has(targetRel))fail('TREE_SYMLINK');directories(path.dirname(physical));const targetStat=fs.lstatSync(physical,{bigint:true});safeRegular(targetStat,!!sourceRecords);
  if(sourceRecords){const targetRecord=sourceRecords.get(targetRel);if(!targetRecord||targetRecord.symbolic)fail('TREE_FILE');recheck(targetRecord);if(fingerprint(targetStat)!==targetRecord.fingerprint)fail('TREE_CHANGED');}
  const actual=shimDigest(rel,target,targetRel,manifest);
  if(actual!==expected)fail('TREE_DIGEST');sameDirectories(parents);const after=fs.lstatSync(file,{bigint:true});
  if(fingerprint(before)!==fingerprint(after)||fs.readlinkSync(file)!==target)fail('TREE_CHANGED');
  return{file,parents,fingerprint:fingerprint(after),identity:identity(after),target,targetRel,bytes:0};
}
function recheck(record){sameDirectories(record.parents);const stat=fs.lstatSync(record.file,{bigint:true});if(fingerprint(stat)!==record.fingerprint||record.target!==undefined&&fs.readlinkSync(record.file)!==record.target)fail('TREE_CHANGED');}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

// Explicit full-root metadata/name inventory. No source bodies are read here;
// no ignored namespace is silently removed. These data are not an import token
// or a hostile-writer read boundary. Preparation still requires confinement.
const directoryInterpretation='redue-typescript-directory-inventory@1';
const directoryInventoryBytes=8*1024*1024;
const directoryDigest=rows=>{try{return hash(canonical({interpretation:directoryInterpretation,directories:rows}));}catch{fail('TREE_DIRECTORY_LIMIT');}};
const sorted=(a,b)=>a<b?-1:a>b?1:0;
function plainData(value,keys){if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(value,key)??{},'value')))fail('TREE_DIRECTORY_MANIFEST');}
function dataArray(value,max){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('TREE_DIRECTORY_MANIFEST');for(let at=0;at<value.length;at++)if(!Object.hasOwn(Object.getOwnPropertyDescriptor(value,String(at))??{},'value'))fail('TREE_DIRECTORY_MANIFEST');return value;}
export function validateSealedTypeScriptDirectoryInventory(value){
 plainData(value,['schema','interpretation','directories','digest','directoryCount','entryCount']);
 if(value.schema!==1||value.interpretation!==directoryInterpretation||!Number.isSafeInteger(value.directoryCount)||value.directoryCount<1||value.directoryCount>TYPESCRIPT_TREE_LIMITS.directories||!Number.isSafeInteger(value.entryCount)||value.entryCount<0||value.entryCount>TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories||typeof value.digest!=='string'||! /^[a-f0-9]{64}$/.test(value.digest))fail('TREE_DIRECTORY_MANIFEST');
 const rows=[],names=new Map();let previous=null,count=0,bytes=0;
 for(const row of dataArray(value.directories,TYPESCRIPT_TREE_LIMITS.directories)){dataArray(row,2);if(row.length!==2)fail('TREE_DIRECTORY_MANIFEST');const [rel,entries]=row;
  if(typeof rel!=='string'||rel!==''&&!relative(rel)||previous!==null&&rel<=previous||previous===null&&rel!=='')fail('TREE_DIRECTORY_MANIFEST');previous=rel;let last='';const copied=[];
  bytes+=Buffer.byteLength(JSON.stringify(rel))+5;if(bytes>directoryInventoryBytes)fail('TREE_DIRECTORY_LIMIT');
  for(const entry of dataArray(entries,TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories)){dataArray(entry,2);if(entry.length!==2)fail('TREE_DIRECTORY_MANIFEST');const [name,kind]=entry;
   if(!relative(name)||name.includes('/')||name<=last||!['directory','file','symlink'].includes(kind))fail('TREE_DIRECTORY_MANIFEST');last=name;if(++count>TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_DIRECTORY_LIMIT');bytes+=Buffer.byteLength(JSON.stringify(entry))+1;if(bytes>directoryInventoryBytes)fail('TREE_DIRECTORY_LIMIT');copied.push([name,kind]);}
  names.set(rel,new Map(copied));rows.push([rel,copied]);
 }
 if(rows.length!==value.directoryCount||count!==value.entryCount)fail('TREE_DIRECTORY_MANIFEST');
 for(const [rel,entries]of rows){if(rel!==''){const parent=path.posix.dirname(rel)==='.'?'':path.posix.dirname(rel);if(names.get(parent)?.get(path.posix.basename(rel))!=='directory')fail('TREE_DIRECTORY_MANIFEST');}
  for(const [name,kind]of entries)if(kind==='directory'&&!names.has(rel?rel+'/'+name:name))fail('TREE_DIRECTORY_MANIFEST');}
 if(directoryDigest(rows)!==value.digest)fail('TREE_DIRECTORY_MANIFEST');
 return freeze({schema:1,interpretation:directoryInterpretation,directories:rows,digest:value.digest,directoryCount:rows.length,entryCount:count});
}
function inspectDirectoryInventory(root){
 absolute(root);const rootParents=directories(root),rootStat=fs.lstatSync(root,{bigint:true}),records=[],rows=[],physical=new Set();let entries=0,bytes=0;
 const walk=rel=>{if(rel!==''&&!relative(rel)||rows.length>=TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_DIRECTORY_LIMIT');const file=rel?path.join(root,rel):root,stat=fs.lstatSync(file,{bigint:true});
  if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid()||stat.dev!==rootStat.dev||(stat.mode&0o7000n)!==0n||fs.realpathSync(file)!==file||physical.has(identity(stat)))fail('TREE_DIRECTORY_CHANGED');physical.add(identity(stat));
  const children=[],record={file,fingerprint:fingerprint(stat)},opened=fs.opendirSync(file);records.push(record);rows.push([rel,children]);bytes+=Buffer.byteLength(JSON.stringify(rel))+5;if(bytes>directoryInventoryBytes)fail('TREE_DIRECTORY_LIMIT');
  const descendants=[];try{let entry;while((entry=opened.readSync())!==null){if(++entries>TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_DIRECTORY_LIMIT');if(!relative(entry.name)||entry.name.includes('/'))fail('TREE_DIRECTORY_MANIFEST');
   const child=path.join(file,entry.name),s=fs.lstatSync(child,{bigint:true}),kind=s.isSymbolicLink()?'symlink':s.isDirectory()?'directory':s.isFile()?'file':null;if(!kind)fail('TREE_FILE');
   bytes+=Buffer.byteLength(JSON.stringify([entry.name,kind]))+1;if(bytes>directoryInventoryBytes)fail('TREE_DIRECTORY_LIMIT');children.push([entry.name,kind]);if(kind==='directory')descendants.push(rel?rel+'/'+entry.name:entry.name);else records.push({file:child,fingerprint:fingerprint(s)});
  }}finally{opened.closeSync();}
  children.sort(([a],[b])=>sorted(a,b));if(children.some(([name],at)=>at>0&&name===children[at-1][0]))fail('TREE_DIRECTORY_CHANGED');
  if(fingerprint(fs.lstatSync(file,{bigint:true}))!==record.fingerprint)fail('TREE_DIRECTORY_CHANGED');for(const child of descendants.sort(sorted))walk(child);
 };
 walk('');rows.sort(([a],[b])=>sorted(a,b));records.sort((a,b)=>sorted(a.file,b.file));sameDirectories(rootParents);for(const record of records)if(fingerprint(fs.lstatSync(record.file,{bigint:true}))!==record.fingerprint)fail('TREE_DIRECTORY_CHANGED');sameDirectories(rootParents);
 return{value:validateSealedTypeScriptDirectoryInventory({schema:1,interpretation:directoryInterpretation,directories:rows,digest:directoryDigest(rows),directoryCount:rows.length,entryCount:entries}),records,rootParents};
}
// A closing metadata group follows all terminal source/stage validation work.
// Full inventories remain authoritative for names/types; these retained complete
// records also bind membership-sensitive directory fingerprints (not merely
// inode/mode/UID). This detects late changes before this barrier under the same
// trusted/quiescent prerequisite, and is NOT atomic hostile-writer confinement.
function closeDirectoryInventories(snapshots){
 for(const snapshot of snapshots)sameDirectories(snapshot.rootParents);
 for(const snapshot of snapshots)for(const record of snapshot.records)
  if(fingerprint(fs.lstatSync(record.file,{bigint:true}))!==record.fingerprint)fail('TREE_DIRECTORY_CHANGED');
 for(const snapshot of snapshots)sameDirectories(snapshot.rootParents);
}
function directoryInventoryCurrent(root,before){const after=inspectDirectoryInventory(root);if(canonical(after.value)!==canonical(before.value)||canonical(after.records)!==canonical(before.records))fail('TREE_DIRECTORY_CHANGED');sameDirectories(before.rootParents);return after;}
export function captureSealedTypeScriptDirectoryInventory(root){try{return inspectDirectoryInventory(root).value;}catch(error){if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_UNAVAILABLE');}}

function materialize(options,fullDirectories=false){

  const selected=exactOptions(options,fullDirectories),root=absolute(selected.root),parent=absolute(selected.parent),rows=manifestRows(selected.manifest),manifest=new Map(rows),declaredDirectories=fullDirectories?validateSealedTypeScriptDirectoryInventory(selected.directoryInventory):null;
  if(withinPath(parent,root)||withinPath(root,parent))fail('TREE_PLACEMENT');
  const rootParents=directories(root),parentParents=directories(parent),rootStat=fs.lstatSync(root,{bigint:true}),parentStat=fs.lstatSync(parent,{bigint:true});
  // Case aliases (and other existing physical aliases) can defeat lexical
  // containment even when realpath preserves their spelling.
  const containsPhysical=(rows,stat)=>rows.some(([,id])=>id.split(':').slice(0,2).join(':')===identity(stat));
  if(containsPhysical(parentParents,rootStat)||containsPhysical(rootParents,parentStat))fail('TREE_PLACEMENT');
  if(rootStat.uid!==uid()||parentStat.uid!==uid()||(parentStat.mode&0o777n)!==0o700n)fail('TREE_OWNERSHIP');
  if(!onlyChild(parent,null))fail('TREE_PARENT_OCCUPIED');sameDirectories(parentParents);
  const directorySnapshot=fullDirectories?inspectDirectoryInventory(root):null;
  if(directorySnapshot){if(canonical(directorySnapshot.value)!==canonical(declaredDirectories))fail('TREE_DIRECTORY_CHANGED');
   // Refuse incomplete declarations; in particular an excluded .git tree is
   // not silently copied or ignored. No undeclared body is opened.
   const leaves=directorySnapshot.value.directories.flatMap(([rel,entries])=>entries.filter(([,kind])=>kind!=='directory').map(([name])=>rel?rel+'/'+name:name)).sort(sorted);
   if(canonical(leaves)!==canonical(rows.map(([rel])=>rel)))fail('TREE_DIRECTORY_COVERAGE');
  }

  // Metadata for the COMPLETE local manifest precedes every source body read.
  // Count real directory entries, not case-alias spellings of the same name.
  const source=[],byName=new Map(),groups=new Map(),parentNames=new Map();let bytes=0;
  for(const [rel,digest] of rows){const file=path.join(root,rel),parents=directories(path.dirname(file)),stat=fs.lstatSync(file,{bigint:true});
    if(stat.isSymbolicLink()){if(stat.uid!==uid()||stat.nlink!==1n)fail('TREE_SYMLINK');}
    else{safeRegular(stat,true);bytes+=Number(stat.size);if(bytes>TYPESCRIPT_TREE_LIMITS.totalBytes)fail('TREE_LIMIT');}
    const parentFile=path.dirname(file),parentStat=fs.lstatSync(parentFile,{bigint:true}),basename=path.basename(file);
    if(!parentStat.isDirectory()||parentStat.isSymbolicLink())fail('TREE_PATH');sameDirectories(parents);
    const record={rel,digest,file,parents,fingerprint:fingerprint(stat),identity:identity(stat),nlink:stat.nlink,
      entryKey:`${identity(parentStat)}:${basename}`,bytes:Number(stat.isFile()?stat.size:0n),symbolic:stat.isSymbolicLink()};
    source.push(record);byName.set(rel,record);
    let directory=root;for(const component of rel.split('/')){if(!parentNames.has(directory))parentNames.set(directory,new Set());parentNames.get(directory).add(component);directory=path.join(directory,component);}
    if(!record.symbolic){if(!groups.has(record.identity))groups.set(record.identity,[]);groups.get(record.identity).push(record);}
  }
  const checkNames=()=>{let enumerated=0;for(const [directory,wanted] of parentNames){const found=new Set(),opened=fs.opendirSync(directory);
    try{let entry;while((entry=opened.readSync())!==null){if(++enumerated>TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_LIMIT');if(wanted.has(entry.name))found.add(entry.name);}}
    finally{opened.closeSync();}if(found.size!==wanted.size)fail('TREE_FILE');}};checkNames();
  const entryKeys=new Set();for(const record of source){if(entryKeys.has(record.entryKey))fail('TREE_FILE');entryKeys.add(record.entryKey);recheck(record);}
  // A complete count is meaningful only under the stated trusted/quiescent
  // preparation prerequisite; it is not a hostile-writer alias-exclusion proof.
  const sourceAliasGroups=[];for(const members of groups.values()){
    const first=members[0];if(BigInt(members.length)!==first.nlink||members.some(record=>record.nlink!==first.nlink||record.fingerprint!==first.fingerprint))fail('TREE_FILE');
    if(members.length>1)sourceAliasGroups.push(members.map(record=>record.rel).sort());
  }
  sourceAliasGroups.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  const checkSources=()=>{sameDirectories(rootParents);if(directorySnapshot)directoryInventoryCurrent(root,directorySnapshot);for(const record of source)recheck(record);};
  checkSources();sameDirectories(parentParents);
  for(const record of source){
    if(record.symbolic)Object.assign(record,shim(root,record.rel,record.digest,manifest,byName));
    else Object.assign(record,inspectFile(record.file,record.digest,{sourceRecord:record}));
  }
  checkSources();sameDirectories(parentParents);
  // Source installed hashes retain their nlink term. Fresh copies deliberately
  // have independent single-link hashes; shims bind that new target digest.
  const materializedManifest=new Map(source.filter(record=>!record.symbolic).map(record=>[record.rel,record.materializedDigest]));
  for(const record of source.filter(record=>record.symbolic))materializedManifest.set(record.rel,shimDigest(record.rel,record.target,record.targetRel,materializedManifest));
  const materializedRows=rows.map(([rel])=>[rel,materializedManifest.get(rel)]);
  let stage=null,stageId=null;const destination=[];const destinationIdentities=new Set();const madeDirectories=new Map(),sourceIdentities=new Set(source.map(record=>record.identity));
  const ensureDirectory=rel=>{let current=stage;for(const part of rel.split('/').filter(Boolean)){current=path.join(current,part);if(!madeDirectories.has(current)){
      if(madeDirectories.size>=TYPESCRIPT_TREE_LIMITS.directories)fail('TREE_LIMIT');fs.mkdirSync(current,{mode:0o700});const stat=fs.lstatSync(current,{bigint:true});if(!stat.isDirectory()||stat.uid!==uid()||stat.isSymbolicLink())fail('TREE_CHANGED');madeDirectories.set(current,directoryIdentity(stat));}
      const stat=fs.lstatSync(current,{bigint:true});if(directoryIdentity(stat)!==madeDirectories.get(current)||!stat.isDirectory()||stat.isSymbolicLink())fail('TREE_CHANGED');}};
  const checkStage=()=>{sameDirectories(parentParents);if(!onlyChild(parent,path.basename(stage)))fail('TREE_CHANGED');sameDirectories(parentParents);const stat=fs.lstatSync(stage,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid()||(stat.mode&0o777n)!==0o700n||identity(stat)!==stageId)fail('TREE_CHANGED');};
  const checkDirectories=()=>{for(const [file,id] of madeDirectories){const st=fs.lstatSync(file,{bigint:true});if(!st.isDirectory()||st.isSymbolicLink()||directoryIdentity(st)!==id||st.uid!==uid())fail('TREE_CHANGED');}};
  try{stage=fs.mkdtempSync(path.join(parent,'redue-materialization-'));fs.chmodSync(stage,0o700);stageId=identity(fs.lstatSync(stage,{bigint:true}));
    if(directorySnapshot)for(const [rel]of directorySnapshot.value.directories)if(rel!==''){checkStage();ensureDirectory(rel);}
    for(const record of source.filter(record=>record.target===undefined)){
      checkStage();sameDirectories(rootParents);recheck(record);const directory=path.posix.dirname(record.rel);if(directory!=='.')ensureDirectory(directory);const file=path.join(stage,record.rel);let descriptor;
      try{descriptor=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);const created=fs.fstatSync(descriptor,{bigint:true});
        if(!created.isFile()||created.nlink!==1n||created.uid!==uid()||sourceIdentities.has(identity(created))||destinationIdentities.has(identity(created)))fail('TREE_CHANGED');destinationIdentities.add(identity(created));
        inspectFile(record.file,record.digest,{sourceRecord:record,write:buffer=>{let offset=0;while(offset<buffer.length){const count=fs.writeSync(descriptor,buffer,offset,buffer.length-offset);if(!count)fail('TREE_CHANGED');offset+=count;}}});
        fs.fchmodSync(descriptor,record.mode);checkStage();const after=fs.fstatSync(descriptor,{bigint:true});if(identity(after)!==identity(created)||fingerprint(after)!==fingerprint(fs.lstatSync(file,{bigint:true})))fail('TREE_CHANGED');
      }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}checkStage();sameDirectories(rootParents);recheck(record);const digest=materializedManifest.get(record.rel);destination.push({rel:record.rel,digest,...inspectFile(file,digest)});
    }
    for(const record of source.filter(record=>record.target!==undefined)){
      checkStage();sameDirectories(rootParents);recheck(record);ensureDirectory(path.posix.dirname(record.rel));const file=path.join(stage,record.rel);fs.symlinkSync(record.target,file);checkStage();
      const digest=materializedManifest.get(record.rel),copied=shim(stage,record.rel,digest,materializedManifest);
      if(sourceIdentities.has(copied.identity)||destinationIdentities.has(copied.identity))fail('TREE_CHANGED');destinationIdentities.add(copied.identity);destination.push({rel:record.rel,digest,...copied});sameDirectories(rootParents);recheck(record);}
    checkSources();for(const record of source){if(record.symbolic)shim(root,record.rel,record.digest,manifest,byName);else inspectFile(record.file,record.digest,{sourceRecord:record});}
    checkSources();for(const record of destination){recheck(record);if(record.target===undefined)inspectFile(record.file,record.digest);else shim(stage,record.rel,record.digest,materializedManifest);}
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
    checkNames();checkSources();
    const copiedDirectories=directorySnapshot?inspectDirectoryInventory(stage):null;
    if(copiedDirectories&&canonical(copiedDirectories.value)!==canonical(directorySnapshot.value))fail('TREE_DIRECTORY_CHANGED');
    if(directorySnapshot){directoryInventoryCurrent(root,directorySnapshot);directoryInventoryCurrent(stage,copiedDirectories);checkSources();checkStage();checkDirectories();for(const record of destination)recheck(record);closeDirectoryInventories([directorySnapshot,copiedDirectories]);}
    const directoryFacts=directorySnapshot?{sourceDirectories:directorySnapshot.value.directories,materializedDirectories:copiedDirectories.value.directories,sourceDirectoryInventoryDigest:directorySnapshot.value.digest,materializedDirectoryInventoryDigest:copiedDirectories.value.digest,directoryCount:directorySnapshot.value.directoryCount,directoryEntryCount:directorySnapshot.value.entryCount}:{};
    return freeze({schema:1,interpretation:fullDirectories?'redue-typescript-materialization@3':'redue-typescript-materialization@2',...directoryFacts,root:stage,sourceManifestDigest:hash(canonical(rows)),sourceFiles:rows,
      materializedManifestDigest:hash(canonical(materializedRows)),materializedFiles:materializedRows,sourceAliasGroups,sourceAliasGroupsDigest:hash(canonical(sourceAliasGroups)),bytes,
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

// Explicit @3 opt-in: complete directory/leaf membership is required, including
// empty directories. @2 remains file-only; neither route creates a native seal.
export function materializeSealedTypeScriptTreeWithDirectories(options){
 try{return materialize(options,true);}catch(error){if(typeof error?.code==='string'&&error.code.startsWith('TREE_'))throw error;fail('TREE_UNAVAILABLE');}
}

// Fixed selected-input preparation only. These private captures do not travel,
// certify a native seal, or authorize imported paths. Old @2/@3 are unchanged.
// Endpoint fingerprints cannot prove an unobserved hostile change-and-restore
// interval. An enclosing immutable native view remains a separate prerequisite.
export const SEALED_TYPESCRIPT_SELECTION=freeze({interpretation:'redue-typescript-selected-inputs@1',
 planId:'owned-declared-plus-installed-data-preparation',sourcePatterns:['package.json','package-lock.json','tsconfig.json','**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}','!node_modules/**','!.git/**'],
 additivePatterns:['node_modules/**'],trackGit:false,includeInstalled:true});
const selections=new WeakMap(),gitPath=value=>value.split('/').some(part=>part.toLowerCase()==='.git');
const selectedNamespace=value=>value.directories.filter(([rel])=>!gitPath(rel)).map(([rel,entries])=>[rel,entries.filter(([name])=>name.toLowerCase()!=='.git')]);
function selectionState(capture,phase){const state=selections.get(capture);if(!state||state.phase!==phase){if(state)state.phase='INVALID';fail('TREE_SELECTION_OPTIONS');}return state;}
function selectionCurrent(state){const current=inspectDirectoryInventory(state.root);
 if(canonical(selectedNamespace(current.value))!==canonical(selectedNamespace(state.snapshot.value)))fail('TREE_SELECTION_CHANGED');
 const selected=new Set(state.names||[]),currentRecords=new Map(current.records.map(record=>[record.file,record.fingerprint]));
 for(const record of state.snapshot.records){const rel=path.relative(state.root,record.file).split(path.sep).join('/');
  if(gitPath(rel))continue;const isDirectory=state.directoryNames.has(rel);
  if((isDirectory||selected.has(rel))&&currentRecords.get(record.file)!==record.fingerprint)fail('TREE_SELECTION_CHANGED');}
 sameDirectories(state.snapshot.rootParents);return current;
}
function selectedInput(state,rel){const record=state.inputRecords.get(rel);if(!record)fail('TREE_SELECTION_OPTIONS');recheck(record);
 const actual=fs.realpathSync(record.file);if(record.target===undefined&&actual!==record.file||gitPath(actual))fail('TREE_SELECTION_UNSUPPORTED');
 if(record.target!==undefined){const target=state.inputRecords.get(record.targetRel);if(!target||target.symbolic)fail('TREE_SELECTION_UNSUPPORTED');recheck(target);if(fs.realpathSync(target.file)!==target.file)fail('TREE_SELECTION_UNSUPPORTED');}
}
export function captureSealedTypeScriptSelection(options){try{
 plainData(options,['root','parent']);const root=absolute(options.root),parent=absolute(options.parent);
 if(gitPath(root)||withinPath(parent,root)||withinPath(root,parent))fail('TREE_SELECTION_UNSUPPORTED');
 const rootParents=directories(root),parentParents=directories(parent),rootStat=fs.lstatSync(root,{bigint:true}),parentStat=fs.lstatSync(parent,{bigint:true});
 const physicalContains=(rows,stat)=>rows.some(([,id])=>id.split(':').slice(0,2).join(':')===identity(stat));
 if(physicalContains(parentParents,rootStat)||physicalContains(rootParents,parentStat))fail('TREE_PLACEMENT');
 if(rootStat.uid!==uid()||parentStat.uid!==uid()||(parentStat.mode&0o777n)!==0o700n)fail('TREE_OWNERSHIP');if(!onlyChild(parent,null))fail('TREE_PARENT_OCCUPIED');
 const snapshot=inspectDirectoryInventory(root),namespace=selectedNamespace(snapshot.value),candidates=namespace.flatMap(([rel,entries])=>entries.filter(([,kind])=>kind!=='directory').map(([name,kind])=>[rel?rel+'/'+name:name,kind])).sort(([a],[b])=>sorted(a,b));
 const capture=freeze({schema:1,interpretation:'redue-typescript-selection-capture@1',candidates,sealed:false,reuseEligible:false});
 selections.set(capture,{root,parent,snapshot,directoryNames:new Set(namespace.map(([rel])=>rel)),phase:'CAPTURED'});sameDirectories(rootParents);sameDirectories(parentParents);return capture;
 }catch(error){if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_SELECTION_UNAVAILABLE');}
}
export function bindSealedTypeScriptSelection(capture,names){
 const state=selectionState(capture,'CAPTURED');state.phase='BINDING';try{
  dataArray(names,TYPESCRIPT_TREE_LIMITS.files);if(!names.length)fail('TREE_MANIFEST');let previous='';const candidates=new Map(capture.candidates);
  for(const rel of names){if(!relative(rel)||rel<=previous||gitPath(rel)||!candidates.has(rel))fail('TREE_SELECTION_OPTIONS');previous=rel;}
  state.names=[...names];selectionCurrent(state);const records=new Map(),groups=new Map();let bytes=0;
  for(const rel of names){const file=path.join(state.root,rel),parents=directories(path.dirname(file)),stat=fs.lstatSync(file,{bigint:true});
   const symbolic=stat.isSymbolicLink();if(symbolic){if(stat.uid!==uid()||stat.nlink!==1n)fail('TREE_SYMLINK');}else{safeRegular(stat,true);bytes+=Number(stat.size);if(bytes>TYPESCRIPT_TREE_LIMITS.totalBytes)fail('TREE_LIMIT');}
   const record={rel,file,parents,fingerprint:fingerprint(stat),identity:identity(stat),nlink:stat.nlink,symbolic};records.set(rel,record);
   if(!symbolic){if(!groups.has(record.identity))groups.set(record.identity,[]);groups.get(record.identity).push(record);}
  }
  for(const members of groups.values())if(BigInt(members.length)!==members[0].nlink||members.some(record=>record.nlink!==members[0].nlink||record.fingerprint!==members[0].fingerprint))fail('TREE_FILE');
  for(const record of records.values())if(record.symbolic){const target=fs.readlinkSync(record.file),resolved=sealedNpmShimTarget(state.root,record.rel,target);
   if(gitPath(resolved.relative)||!records.has(resolved.relative)||records.get(resolved.relative).symbolic)fail('TREE_SYMLINK');Object.assign(record,{target,targetRel:resolved.relative});}
  state.inputRecords=records;for(const rel of names)selectedInput(state,rel);selectionCurrent(state);
  if(state.phase!=='BINDING')fail('TREE_SELECTION_OPTIONS');state.phase='READING';
 }catch(error){state.phase='INVALID';if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_SELECTION_UNAVAILABLE');}
}
export function invalidateSealedTypeScriptSelection(capture){const state=selections.get(capture);if(!state)fail('TREE_SELECTION_OPTIONS');state.phase='INVALID';}
export function checkSealedTypeScriptSelectionInput(capture,rel){const state=selectionState(capture,'READING');state.phase='CHECKING';try{selectedInput(state,rel);if(state.phase!=='CHECKING')fail('TREE_SELECTION_OPTIONS');state.phase='READING';}catch(error){state.phase='INVALID';if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_SELECTION_UNAVAILABLE');}}
export function materializeSealedTypeScriptSelectedView(capture,manifest){
 const state=selectionState(capture,'READING');state.phase='COPYING';try{
  const rows=manifestRows(manifest);if(canonical(rows.map(([rel])=>rel))!==canonical(state.names))fail('TREE_SELECTION_OPTIONS');selectionCurrent(state);for(const rel of state.names)selectedInput(state,rel);
  const materialized=materialize({root:state.root,parent:state.parent,manifest:rows}),stage=inspectDirectoryInventory(materialized.root);
  const expected=new Map([['',new Map()]]),kinds=new Map(capture.candidates);
  for(const rel of state.names){const parts=rel.split('/');let dir='';for(let at=0;at<parts.length;at++){const name=parts[at],last=at===parts.length-1;expected.get(dir).set(name,last?kinds.get(rel):'directory');if(!last){dir=dir?dir+'/'+name:name;if(!expected.has(dir))expected.set(dir,new Map());}}}
  const expectedRows=[...expected].sort(([a],[b])=>sorted(a,b)).map(([rel,entries])=>[rel,[...entries].sort(([a],[b])=>sorted(a,b))]);
  if(canonical(stage.value.directories)!==canonical(expectedRows))fail('TREE_SELECTION_CHANGED');selectionCurrent(state);for(const rel of state.names)selectedInput(state,rel);closeDirectoryInventories([stage]);selectionCurrent(state);
  // Close retained original selected/directory metadata after the last stage
  // work. Unselected body timestamps are deliberately not verification inputs.
  const records=state.snapshot.records.filter(record=>{const rel=path.relative(state.root,record.file).split(path.sep).join('/');return !gitPath(rel)&&(state.directoryNames.has(rel)||state.inputRecords.has(rel));});
  closeDirectoryInventories([{rootParents:state.snapshot.rootParents,records},stage]);
  if(state.phase!=='COPYING')fail('TREE_SELECTION_OPTIONS');state.phase='SPENT';
  return freeze({...materialized,interpretation:'redue-typescript-selected-prepared-view@1',selectionDefinitionSha256:hash(canonical(SEALED_TYPESCRIPT_SELECTION)),stageDirectoryInventory:stage.value,
   sourceNamespaceEquivalent:false,nativeViewVerified:false,sealed:false,reuseEligible:false});
 }catch(error){state.phase='INVALID';if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_SELECTION_UNAVAILABLE');}
}
