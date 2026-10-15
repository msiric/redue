// Trusted/quiescent local fixture preparation only, not a hostile-parent read or
// write sandbox. No real source/stage/state/receipts/auth/code are copied, no
// settings are changed and no command is launched. Failed partial bases stay put.
// A private mint binds actual construction; labels/serialized descriptors cannot
// establish freshness. Initial owned-0700-parent mechanics do NOT admit CI's
// /private/tmp bootstrap or prove compatibility with receiver's absolute base.
// The separate fixed CI bootstrap below admits only placement mechanics. Its
// private token must stay in the same trusted process through host setup; it is
// not a CI/profile/permission proof and does not establish inherited-handle absence.
import fs from 'node:fs';import path from 'node:path';import {randomBytes} from 'node:crypto';
const minted=new WeakMap(),bootstraps=new WeakMap(),marker=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
const expectedFiles=['write-canary.txt','chmod-canary.txt','unlink-canary.txt','rename-canary.txt','hardlink-canary.txt','map-canary.txt'];
const fail=()=>{throw Error('SYNTHETIC_FIXTURE_UNAVAILABLE');};
const physical=value=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(value[key])).join(':');
const unknown=(base=null,reason='SYNTHETIC_FIXTURE_UNAVAILABLE')=>Object.freeze({schema:1,scope:'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',outcome:'UNKNOWN',reason,base,receiverBasePolicyMatch:false,ownedHandlesClosed:false,noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
const immutable=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))immutable(child);Object.freeze(value);}return value;};
function principal(){if(!['getuid','geteuid','getgid','getegid'].every(key=>typeof process[key]==='function')||process.getuid()===0||process.getuid()!==process.geteuid()||process.getgid()!==process.getegid())fail();return BigInt(process.getuid());}
function canonical(value){return typeof value==='string'&&path.isAbsolute(value)&&path.normalize(value)===value&&value!=='/'&&!value.endsWith('/')&&Buffer.byteLength(value)<=4096&&Buffer.from(value).toString('utf8')===value&&!/[\u0000-\u001f\u007f\\:]/u.test(value);}
function directory(file,uid){if(!canonical(file)||fs.realpathSync(file)!==file)fail();const stat=fs.lstatSync(file,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid||(stat.mode&0o7777n)!==0o700n)fail();return physical(stat);}
function parents(file){const result=[];for(let at=path.dirname(file);;at=path.dirname(at)){const stat=fs.lstatSync(at,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink())fail();result.push([at,`${stat.dev}:${stat.ino}:${stat.mode}:${stat.uid}`]);if(at===path.dirname(at))return result;}}
function sameParents(rows){for(const [file,identity] of rows){const stat=fs.lstatSync(file,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||`${stat.dev}:${stat.ino}:${stat.mode}:${stat.uid}`!==identity)fail();}}
function entries(file){const dir=fs.opendirSync(file),names=[];let failure;
  try{for(;;){const entry=dir.readSync();if(!entry)break;if(names.length===64)fail();names.push(entry.name);}}
  catch(error){failure=error;}finally{try{dir.closeSync();}catch(error){failure??=error;}}
  if(failure)throw failure;return names.sort();
}
function fileRecord(file,uid){const named=fs.lstatSync(file,{bigint:true});if(!named.isFile()||named.isSymbolicLink()||named.uid!==uid||named.nlink!==1n||(named.mode&0o7777n)!==0o644n||named.size!==BigInt(marker.length))fail();
  let fd,failure,result;
  try{fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);const before=fs.fstatSync(fd,{bigint:true});if(physical(before)!==physical(named))fail();
    const body=Buffer.alloc(marker.length+1),count=fs.readSync(fd,body,0,body.length,0);if(count!==marker.length||!body.subarray(0,count).equals(marker))fail();
    const after=fs.fstatSync(fd,{bigint:true}),afterNamed=fs.lstatSync(file,{bigint:true});if(physical(before)!==physical(after)||physical(before)!==physical(afterNamed))fail();result=physical(before);
  }catch(error){failure=error;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch(error){failure??=error;}}
  if(failure)throw failure;return result;
}
function inspect(record){
  const uid=principal();sameParents(record.parents);if(record.ciAncestors)sameCIParents(record.ciAncestors);const directories=[];
  for(const file of record.absentPaths??[])absent(file);
  for(const [file,identity] of record.boundDirectories??[])if(ownedIdentity(file,uid)!==identity)fail();
  for(const [file,names] of record.inventory){const before=directory(file,uid);if(JSON.stringify(entries(file))!==JSON.stringify(names))fail();directories.push([file,before]);}
  const files=[],inodes=new Set();for(const file of record.files){const fingerprint=fileRecord(file,uid),inode=fingerprint.split(':').slice(0,2).join(':');if(inodes.has(inode))fail();inodes.add(inode);files.push([file,fingerprint]);}
  for(const [file,before] of directories)if(directory(file,uid)!==before)fail();sameParents(record.parents);
  for(const [file,identity] of record.boundDirectories??[])if(ownedIdentity(file,uid)!==identity)fail();
  for(const file of record.absentPaths??[])absent(file);if(record.ciAncestors)sameCIParents(record.ciAncestors);
  return {directories,files};
}
export function prepareSealedTypeScriptSyntheticFixture(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'parent')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'parent'),'value'))throw Object.assign(Error('SYNTHETIC_FIXTURE_OPTIONS'),{code:'SYNTHETIC_FIXTURE_OPTIONS'});
  const {parent}=options;let base=null;
  try{
    const uid=principal();directory(parent,uid);const parentIdentity=directory(parent,uid),ancestors=parents(parent);
    const candidate=path.join(parent,'redue-ci-recipient-'+randomBytes(4).toString('hex'));fs.mkdirSync(candidate,{mode:0o700});base=candidate;
    if(directory(parent,uid).split(':').slice(0,4).join(':')!==parentIdentity.split(':').slice(0,4).join(':'))fail();sameParents(ancestors);
    const paths=layout(base),{checkout,workspace,stageParent,stage,exchangePartner,exchangeControlA,exchangeControlB}=paths;
    for(const file of [checkout,workspace,stageParent,stage,exchangePartner,exchangeControlA,exchangeControlB])fs.mkdirSync(file,{mode:0o700});
    const files=canaryFiles(paths);
    writeMarkers(files);
    const inventory=[[base,['Checkout 空间','sealed-inputs'].sort()],[checkout,['.sealed-native-canaries']],...syntheticInventory(paths)];
    const record={base,parent,parents:parents(base),inventory,files};const snapshot=inspect(record);
    const result=immutable({schema:1,scope:'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',outcome:'SYNTHETIC_FIXTURE_PREPARED',base,
      layout:paths,receiverBasePolicyMatch:/^\/private\/tmp\/redue-ci-recipient-[A-Za-z0-9]{8}$/.test(base),
      knownCanaryFiles:files.map(file=>path.relative(base,file).split(path.sep).join('/')),ownedHandlesClosed:true,
      noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
    minted.set(result,{...record,snapshot});return result;
  }catch{return unknown(base);}
}
export function verifySealedTypeScriptSyntheticFixture(fixture){
  const record=minted.get(fixture);if(!record)return unknown(null,'SYNTHETIC_FIXTURE_NOT_MINTED');
  if(record.invalid)return record.scope===ciScope?ciUnknown(record.base):unknown(record.base);
  try{const snapshot=inspect(record);if(JSON.stringify(snapshot)!==JSON.stringify(record.snapshot))fail();
    return immutable({schema:1,scope:record.scope??'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',base:record.base,
      receiverBasePolicyMatch:fixture.receiverBasePolicyMatch,ownedHandlesClosed:true,noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
  }catch{record.invalid=true;return record.scope===ciScope?ciUnknown(record.base):unknown(record.base);}
}

// Private-brand/loss query only: no filesystem read or renewed observation.
// Consumers still need their own fixed original facts and required reads.
export function sealedTypeScriptSyntheticFixtureOriginalAvailable(fixture){
 const record=minted.get(fixture);return arguments.length===1&&!!record&&!record.invalid;
}

// Fixed receiver placement only. No arbitrary parent, process callback, host
// settings or serialized bootstrap proof is accepted by these two entrypoints.
const ciScope='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY';
const identity=stat=>['dev','ino','mode','uid','gid'].map(key=>String(stat[key])).join(':');
const ciUnknown=(base=null,reason='CI_SYNTHETIC_FIXTURE_UNAVAILABLE')=>immutable({...unknown(base,reason),scope:ciScope,nativePolicyVerified:false});
function ownedIdentity(file,uid){
  if(!canonical(file)||fs.realpathSync(file)!==file)fail();const stat=fs.lstatSync(file,{bigint:true});
  if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid||(stat.mode&0o7777n)!==0o700n)fail();return identity(stat);
}
function fixedCIParents(){
  const result=[];
  for(const file of ['/','/private','/private/tmp']){
    const stat=fs.lstatSync(file,{bigint:true});
    if(fs.realpathSync(file)!==file||!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0n)fail();
    if(file==='/private/tmp'?(stat.mode&0o7777n)!==0o1777n:((stat.mode&0o22n)!==0n||(stat.mode&0o7000n)!==0n))fail();
    result.push([file,identity(stat)]);
  }
  return result;
}
function sameCIParents(rows){if(JSON.stringify(fixedCIParents())!==JSON.stringify(rows))fail();}
function absent(file){try{fs.lstatSync(file,{bigint:true});}catch(error){if(error?.code==='ENOENT')return;throw error;}fail();}
function layout(base){const checkout=base+'/Checkout 空间',workspace=checkout+'/.sealed-native-canaries',stageParent=base+'/sealed-inputs';
  return {checkout,workspace,stageParent,stage:stageParent+'/redue-materialization-Canary',exchangePartner:workspace+'/stage-parent-exchange',exchangeControlA:workspace+'/exchange-control-a',exchangeControlB:workspace+'/exchange-control-b'};}
function canaryFiles(paths){return [...expectedFiles.map(name=>paths.stage+'/'+name),paths.workspace+'/write-canary.txt',paths.workspace+'/map-canary.txt',...[paths.exchangePartner,paths.exchangeControlA,paths.exchangeControlB].map(file=>file+'/identity-canary.txt')];}
function syntheticInventory(paths){return [[paths.workspace,['exchange-control-a','exchange-control-b','map-canary.txt','stage-parent-exchange','write-canary.txt']],
  [paths.stageParent,['redue-materialization-Canary']],[paths.stage,[...expectedFiles].sort()],...[paths.exchangePartner,paths.exchangeControlA,paths.exchangeControlB].map(file=>[file,['identity-canary.txt']])];}
function writeMarkers(files){
  for(const file of files){let fd,failure;
    try{fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o644);
      fs.fchmodSync(fd,0o644);if(fs.writeSync(fd,marker,0,marker.length,0)!==marker.length)fail();}
    catch(error){failure=error;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch(error){failure??=error;}}
    if(failure)throw failure;
  }
}
export function createSealedTypeScriptCIBootstrap(){
  if(arguments.length!==0)throw Object.assign(Error('CI_SYNTHETIC_FIXTURE_OPTIONS'),{code:'CI_SYNTHETIC_FIXTURE_OPTIONS'});
  let base=null;
  try{
    const uid=principal(),ancestors=fixedCIParents();
    const candidate='/private/tmp/redue-ci-recipient-'+randomBytes(4).toString('hex');
    fs.mkdirSync(candidate,{mode:0o700});base=candidate;const baseIdentity=ownedIdentity(base,uid);
    sameCIParents(ancestors);if(ownedIdentity(base,uid)!==baseIdentity)fail();
    const token=immutable({schema:1,scope:ciScope,outcome:'CI_SYNTHETIC_BOOTSTRAP_PREPARED',base,
      receiverBasePolicyMatch:true,ownedHandlesClosed:true,noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
    bootstraps.set(token,{base,baseIdentity,ancestors,uid});return token;
  }catch{return ciUnknown(base,'CI_SYNTHETIC_BOOTSTRAP_UNAVAILABLE');}
}
export function prepareSealedTypeScriptCISyntheticFixture(bootstrap){
  if(arguments.length!==1)throw Object.assign(Error('CI_SYNTHETIC_FIXTURE_OPTIONS'),{code:'CI_SYNTHETIC_FIXTURE_OPTIONS'});
  const boot=bootstraps.get(bootstrap);if(!boot)return ciUnknown(null,'CI_SYNTHETIC_BOOTSTRAP_NOT_MINTED');
  if(boot.used||boot.invalid)return ciUnknown(boot.base,'CI_SYNTHETIC_BOOTSTRAP_ALREADY_USED_OR_UNKNOWN');
  // Consume before any work: uncertainty or a partial write cannot be repaired
  // by reusing this token and relabeling a preexisting namespace as fresh.
  boot.used=true;
  try{
    const uid=principal();if(uid!==boot.uid)fail();sameCIParents(boot.ancestors);if(ownedIdentity(boot.base,uid)!==boot.baseIdentity)fail();
    const paths=layout(boot.base),{checkout,workspace,stageParent,stage}=paths;
    // Never enumerate/read unrelated host setup, state or credential assets.
    // Whole-parent rename's destination is also required absent before a later
    // reviewed destructive assertion; no overwrite or replacement is prepared.
    absent(stageParent);absent(boot.base+'/sealed-inputs-replaced');
    try{fs.lstatSync(checkout,{bigint:true});ownedIdentity(checkout,uid);}
    catch(error){if(error?.code!=='ENOENT')throw error;fs.mkdirSync(checkout,{mode:0o700});}
    const checkoutIdentity=ownedIdentity(checkout,uid);absent(workspace);
    sameCIParents(boot.ancestors);if(ownedIdentity(boot.base,uid)!==boot.baseIdentity)fail();
    for(const file of [workspace,stageParent,stage,paths.exchangePartner,paths.exchangeControlA,paths.exchangeControlB])fs.mkdirSync(file,{mode:0o700});
    const files=canaryFiles(paths);writeMarkers(files);
    const inventory=syntheticInventory(paths);
    const record={scope:ciScope,base:boot.base,ciAncestors:boot.ancestors,parents:parents(boot.base),absentPaths:[boot.base+'/sealed-inputs-replaced'],boundDirectories:[[boot.base,boot.baseIdentity],[checkout,checkoutIdentity]],inventory,files};
    sameCIParents(boot.ancestors);const snapshot=inspect(record);
    const result=immutable({schema:1,scope:ciScope,outcome:'SYNTHETIC_FIXTURE_PREPARED',base:boot.base,layout:paths,
      receiverBasePolicyMatch:true,knownCanaryFiles:files.map(file=>path.relative(boot.base,file).split(path.sep).join('/')),
      ownedHandlesClosed:true,noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
    minted.set(result,{...record,snapshot});return result;
  }catch{boot.invalid=true;return ciUnknown(boot.base);}
}
