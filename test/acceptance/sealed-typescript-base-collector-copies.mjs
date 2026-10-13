// Fixed H-only source-copy mechanics, not native protection or execution. Only
// live privately minted source data may select these four destinations. Partial
// H paths remain on failure; no cleanup/adoption or crash-recovery claim exists.
// Requires trusted/quiescent parents; checks are not hostile-ancestor confinement.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {verifySealedTypeScriptBaseCollectorSource} from './sealed-typescript-base-collector-source.mjs';
const mintedCopies=new WeakMap(),leaves=['test/acceptance/sealed-typescript-base-child-collection.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','src/portable-envelope.mjs','native-probes/base-exchange-collect.mjs'];
const sha=value=>createHash('sha256').update(value).digest('hex'),guard=value=>{if(!value)throw Error();};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(s[key])).join(':');
const dirMark=s=>['dev','ino','mode','uid','gid'].map(key=>String(s[key])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,dirMark(s)]);if(at===path.dirname(at))return rows;}}
function directory(file){guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return{file,mark:dirMark(s),lineage:parents(file)};}
function directoryCurrent(row){const after=directory(row.file);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
function namedCurrent(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function readback(file,source){const before=fs.lstatSync(file,{bigint:true}),lineage=parents(file);guard(fs.realpathSync(file)===file&&before.isFile()&&!before.isSymbolicLink()&&before.uid===BigInt(process.getuid())&&before.nlink===1n&&(before.mode&0o7777n)===0o600n&&before.size===BigInt(source.sourceBytes));let fd,row,failure=false;
 try{fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(before));const bytes=Buffer.alloc(source.sourceBytes+1);let at=0;
  while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(n===0)break;guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const body=bytes.subarray(0,at),text=body.toString('utf8');guard(at===source.sourceBytes&&Buffer.from(text).equals(body)&&sha(body)===source.sha256&&text===source.source&&mark(fs.fstatSync(fd,{bigint:true}))===mark(before));row={file,mark:mark(before),lineage,source};namedCurrent(row);
 }catch{failure=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure=true;}}guard(!failure);return row;}
function sourceCurrent(proposal,before){guard(JSON.stringify(verifySealedTypeScriptBaseCollectorSource(proposal))===JSON.stringify(before));}
function authorityFalse(fields){return freeze({schema:1,scope:'FIXED_COLLECTOR_COPIES_DATA_ONLY',...fields,commands:[],helperExecutions:0,nativeLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});}
export function provisionSealedTypeScriptBaseCollectorCopies(proposal){
 if(arguments.length!==1)throw Object.assign(Error('COLLECTOR_COPY_OPTIONS'),{code:'COLLECTOR_COPY_OPTIONS'});
 let reason='SOURCE_UNAVAILABLE',fileCreateCount=0,directoryCreateCount=0,record=null,report=null;
 try{const before=verifySealedTypeScriptBaseCollectorSource(proposal);guard(before.outcome==='SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'&&before.scope==='DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY');
  reason='BINDINGS_UNAVAILABLE';guard(typeof process.getuid==='function'&&typeof process.geteuid==='function'&&typeof process.getgid==='function'&&typeof process.getegid==='function'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&['O_NOFOLLOW','O_NONBLOCK','O_CREAT','O_EXCL','O_WRONLY'].every(key=>fs.constants[key]!==undefined));
  const h=before.hostBase;guard(/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&before.bindings.hostBase===h&&before.baseA!==h&&before.baseB!==h);
  guard(Array.isArray(proposal.proposedSources)&&proposal.proposedSources.length===4);const sources=proposal.proposedSources;
  for(let at=0;at<4;at++){const row=sources[at];guard(row&&Object.getPrototypeOf(row)===Object.prototype&&Reflect.ownKeys(row).length===4&&['file','source','sourceBytes','sha256'].every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(row,key)??{},'value'))&&row.file===h+'/prefix/'+leaves[at]&&typeof row.source==='string'&&Number.isInteger(row.sourceBytes)&&row.sourceBytes>0&&row.sourceBytes<=(at===3?65536:1048576)&&Buffer.byteLength(row.source)===row.sourceBytes&&Buffer.from(row.source).toString('utf8')===row.source&&/^[a-f0-9]{64}$/.test(row.sha256)&&sha(row.source)===row.sha256);}
  const directories=[h,h+'/prefix',h+'/prefix/native-probes'].map(directory),boundary=()=>{for(const row of directories)directoryCurrent(row);};
  reason='CREATE_UNAVAILABLE';for(const file of [h+'/prefix/test',h+'/prefix/test/acceptance',h+'/prefix/src']){boundary();fs.mkdirSync(file,{mode:0o700});directoryCreateCount++;directories.push(directory(file));boundary();}
  const rows=[];for(const source of sources){boundary();const lineage=parents(source.file);let fd,writtenMark,failed=false;try{fd=fs.openSync(source.file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);fileCreateCount++;const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);boundary();const bytes=Buffer.from(source.source);let at=0;while(at<bytes.length){const n=fs.writeSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const after=fs.fstatSync(fd,{bigint:true});guard(['dev','ino','mode','uid','gid','nlink'].every(key=>after[key]===s[key])&&after.size===BigInt(source.sourceBytes));writtenMark=mark(after);guard(mark(fs.lstatSync(source.file,{bigint:true}))===writtenMark&&JSON.stringify(parents(source.file))===JSON.stringify(lineage));
   }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);reason='READBACK_UNAVAILABLE';const row=readback(source.file,source);guard(row.mark===writtenMark&&JSON.stringify(row.lineage)===JSON.stringify(lineage));rows.push(row);boundary();reason='CREATE_UNAVAILABLE';}
  reason='BOUNDARY_CHANGED';for(const row of rows)readback(row.file,row.source);boundary();sourceCurrent(proposal,before);boundary();for(const row of rows)namedCurrent(row);
  record={proposal,before,directories,rows};report={bindings:before.bindings,files:rows.map(row=>({file:row.file,sha256:row.source.sha256,sourceBytes:row.source.sourceBytes,mark:row.mark,lineage:row.lineage}))};
 }catch{/* Static phase only; unknown or partially created paths are never deleted. */}
 const result=authorityFalse({outcome:report?'COLLECTOR_COPIES_OBSERVED_NOT_EXECUTED':'UNKNOWN',reason_code:report?'COPIES_OBSERVED':reason,fileCreateCount,directoryCreateCount,report});if(record)mintedCopies.set(result,record);return result;
}
export function verifySealedTypeScriptBaseCollectorCopies(copies){
 const record=mintedCopies.get(copies),unknown=()=>authorityFalse({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();
 try{sourceCurrent(record.proposal,record.before);for(const row of record.directories)directoryCurrent(row);for(const row of record.rows){const after=readback(row.file,row.source);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
  sourceCurrent(record.proposal,record.before);for(const row of record.directories)directoryCurrent(row);for(const row of record.rows)namedCurrent(row);
  return authorityFalse({outcome:'COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:record.before.baseA,baseB:record.before.baseB,hostBase:record.before.hostBase,bindings:record.before.bindings});
 }catch{record.invalid=true;return unknown();}
}

// Identity linkage only; matching H/hash labels from another source mint cannot
// select these copies. Currentness remains a separate mandatory observation.
export function sealedTypeScriptBaseCollectorCopiesMatchSource(copies,proposal){
 const record=mintedCopies.get(copies);return arguments.length===2&&!!record&&!record.invalid&&record.proposal===proposal;
}
