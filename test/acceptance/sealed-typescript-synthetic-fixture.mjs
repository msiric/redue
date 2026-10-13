// Trusted/quiescent local fixture preparation only, not a hostile-parent read or
// write sandbox. No real source/stage/state/receipts/auth/code are copied, no
// settings are changed and no command is launched. Failed partial bases stay put.
// A private mint binds actual construction; labels/serialized descriptors cannot
// establish freshness. Initial owned-0700-parent mechanics do NOT admit CI's
// /private/tmp bootstrap or prove compatibility with receiver's absolute base.
import fs from 'node:fs';import path from 'node:path';import {randomBytes} from 'node:crypto';
const minted=new WeakMap(),marker=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
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
  const uid=principal();sameParents(record.parents);const directories=[];
  for(const [file,names] of record.inventory){const before=directory(file,uid);if(JSON.stringify(entries(file))!==JSON.stringify(names))fail();directories.push([file,before]);}
  const files=[],inodes=new Set();for(const file of record.files){const fingerprint=fileRecord(file,uid),inode=fingerprint.split(':').slice(0,2).join(':');if(inodes.has(inode))fail();inodes.add(inode);files.push([file,fingerprint]);}
  for(const [file,before] of directories)if(directory(file,uid)!==before)fail();sameParents(record.parents);
  return {directories,files};
}
export function prepareSealedTypeScriptSyntheticFixture(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'parent')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'parent'),'value'))throw Object.assign(Error('SYNTHETIC_FIXTURE_OPTIONS'),{code:'SYNTHETIC_FIXTURE_OPTIONS'});
  const {parent}=options;let base=null;
  try{
    const uid=principal();directory(parent,uid);const parentIdentity=directory(parent,uid),ancestors=parents(parent);
    const candidate=path.join(parent,'redue-ci-recipient-'+randomBytes(4).toString('hex'));fs.mkdirSync(candidate,{mode:0o700});base=candidate;
    if(directory(parent,uid).split(':').slice(0,4).join(':')!==parentIdentity.split(':').slice(0,4).join(':'))fail();sameParents(ancestors);
    const checkout=base+'/Checkout 空间',workspace=checkout+'/.sealed-native-canaries',stageParent=base+'/sealed-inputs',stage=stageParent+'/redue-materialization-Canary';
    for(const file of [checkout,workspace,stageParent,stage])fs.mkdirSync(file,{mode:0o700});
    const files=[...expectedFiles.map(name=>stage+'/'+name),workspace+'/write-canary.txt',workspace+'/map-canary.txt'];
    for(const file of files){let fd,failure;try{fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o644);
        fs.fchmodSync(fd,0o644);if(fs.writeSync(fd,marker,0,marker.length,0)!==marker.length)fail();}
      catch(error){failure=error;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch(error){failure??=error;}}if(failure)throw failure;}
    const inventory=[[base,['Checkout 空间','sealed-inputs'].sort()],[checkout,['.sealed-native-canaries']],[workspace,['map-canary.txt','write-canary.txt']],[stageParent,['redue-materialization-Canary']],[stage,[...expectedFiles].sort()]];
    const record={base,parent,parents:parents(base),inventory,files};const snapshot=inspect(record);
    const result=immutable({schema:1,scope:'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',outcome:'SYNTHETIC_FIXTURE_PREPARED',base,
      layout:{checkout,workspace,stageParent,stage},receiverBasePolicyMatch:/^\/private\/tmp\/redue-ci-recipient-[A-Za-z0-9]{8}$/.test(base),
      knownCanaryFiles:files.map(file=>path.relative(base,file).split(path.sep).join('/')),ownedHandlesClosed:true,
      noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
    minted.set(result,{...record,snapshot});return result;
  }catch{return unknown(base);}
}
export function verifySealedTypeScriptSyntheticFixture(fixture){
  const record=minted.get(fixture);if(!record)return unknown(null,'SYNTHETIC_FIXTURE_NOT_MINTED');
  if(record.invalid)return unknown(record.base);
  try{const snapshot=inspect(record);if(JSON.stringify(snapshot)!==JSON.stringify(record.snapshot))fail();
    return immutable({schema:1,scope:'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',base:record.base,
      receiverBasePolicyMatch:fixture.receiverBasePolicyMatch,ownedHandlesClosed:true,noInheritedWritableHandlesVerified:false,nativePolicyVerified:false,sealed:false,reuseEligible:false});
  }catch{record.invalid=true;return unknown(record.base);}
}
