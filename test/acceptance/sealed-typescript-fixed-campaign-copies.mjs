// Fixed H-only copies from live private preparer inputs. No proposal adoption,
// helper execution, permission proof, mint restoration or crash-recovery claim.
// Trusted, quiescent parents and a reviewed module loader remain prerequisites.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {prepareSealedTypeScriptFixedCampaignSource} from './sealed-typescript-fixed-campaign.mjs';
const minted=new WeakMap(),sha=value=>createHash('sha256').update(value).digest('hex');
const fields=['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'];
const guard=value=>{if(!value)throw Error('CAMPAIGN_COPY_UNAVAILABLE');};
const mark=s=>fields.map(k=>String(s[k])).join(':'),dirMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const specs=[
 ['sealed-typescript-base-exchange-result.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','be2d30edf40597f52a6a9e919b5a3ee26e15bf0dc9f942badda0fb54db10b05d'],
 ['sealed-typescript-stage-exchange-result.mjs','test/acceptance/sealed-typescript-stage-exchange-result.mjs','dc86c11a62ef22563d63ea0541185b86b14910a029c67c9b3f58eec4a52b6654'],
 ['sealed-typescript-stage-result.mjs','test/acceptance/sealed-typescript-stage-result.mjs','7c6f7685314deeac8de6974604b0dae8154286262e0e2cbc7a6fda41a84e6813'],
 ['sealed-typescript-map-result.mjs','test/acceptance/sealed-typescript-map-result.mjs','d19e3d1f33394b74c2771207d24ed3697ba1665e1e0d5f49564ecb80e0dcce13'],
 ['../../src/portable-envelope.mjs','src/portable-envelope.mjs','3a10d9546b5b71ceb99121412471f250676cb71a2c943532ddec39a3ac836482'],
];
const generator=['sealed-typescript-fixed-campaign.mjs','9984ffa1719401dd5cf3ab2b10313d8e9606524fac361905d31fb14172860f21'];
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,dirMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function directory(file){const s=fs.lstatSync(file,{bigint:true});guard(fs.realpathSync(file)===file&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return{file,mark:dirMark(s),lineage:parents(file)};}
function directoryCurrent(row){const after=directory(row.file);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
function read(file,expected,copy=false){
 const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);guard(fs.realpathSync(file)===file&&s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&s.size>0n&&s.size<=1048576n&&(copy?(s.mode&0o7777n)===0o600n:(s.mode&0o6022n)===0n));
 let fd,row,failed=false;try{fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const bytes=Buffer.alloc(Number(s.size)+1);let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(n===0)break;guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const body=bytes.subarray(0,at),source=body.toString('utf8');guard(at===Number(s.size)&&Buffer.from(source).equals(body)&&sha(body)===expected&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));row={file,mark:mark(s),lineage,source,sourceBytes:at,sha256:expected};named(row);}catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);return row;
}
function observe(inputs){
 // The renderer validates the original live private pair/assets before exposing
 // bindings. This leaf never accepts that renderer's serialized/public output.
 const proposal=prepareSealedTypeScriptFixedCampaignSource(inputs),h=proposal.hostBase;
 guard(proposal.scope==='DISABLED_FIXED_CAMPAIGN_SOURCE_DATA_ONLY'&&proposal.disabled===true&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&[proposal.baseA,proposal.baseB].every(v=>/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(v))&&new Set([proposal.baseA,proposal.baseB,h]).size===3);
 guard(proposal.entry===h+'/prefix/native-probes/paired-stage-campaign.mjs'&&proposal.node===h+'/runtime/node-v22.13.0-darwin-arm64/bin/node'&&proposal.cwd===proposal.baseA+'/Checkout 空间/.sealed-native-canaries');
 guard(JSON.stringify(proposal.dependencyPins)===JSON.stringify(specs.map(([name,,pin])=>({name,sha256:pin}))));
 guard(typeof proposal.source==='string'&&proposal.sourceBytes>0&&proposal.sourceBytes<=65536&&Number.isInteger(proposal.sourceBytes)&&Buffer.byteLength(proposal.source)===proposal.sourceBytes&&Buffer.from(proposal.source).toString('utf8')===proposal.source&&/^[a-f0-9]{64}$/.test(proposal.sourceSha256)&&sha(proposal.source)===proposal.sourceSha256);
 const prepared=read(fileURLToPath(new URL(generator[0],import.meta.url)),generator[1]);
 const dependencies=specs.map(([name,leaf,pin])=>({...read(fileURLToPath(new URL(name,import.meta.url)),pin),destination:h+'/prefix/'+leaf}));
 return{proposal,prepared,dependencies};
}
function sourceCurrent(record){const next=observe(record.inputs);guard(JSON.stringify(next)===JSON.stringify(record.before));return next;}
function authority(fields){return freeze({schema:1,scope:'FIXED_CAMPAIGN_COPIES_DATA_ONLY',...fields,commands:[],helperExecutions:0,nativeLaunches:0,models:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});}
export function provisionSealedTypeScriptFixedCampaignCopies(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||!['assetsBuild','pairedArtifacts','pairedSource'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Object.assign(Error('CAMPAIGN_COPY_OPTIONS'),{code:'CAMPAIGN_COPY_OPTIONS'});
 const inputs=Object.freeze({assetsBuild:options.assetsBuild,pairedArtifacts:options.pairedArtifacts,pairedSource:options.pairedSource});
 let reason='SOURCE_UNAVAILABLE',fileCreateCount=0,directoryCreateCount=0,fileSyncCount=0,record=null,report=null;
 try{const before=observe(inputs),h=before.proposal.hostBase;reason='BINDINGS_UNAVAILABLE';guard(typeof process.getuid==='function'&&typeof process.geteuid==='function'&&typeof process.getgid==='function'&&typeof process.getegid==='function'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&['O_NOFOLLOW','O_NONBLOCK','O_CREAT','O_EXCL','O_WRONLY'].every(k=>fs.constants[k]!==undefined));
  const directories=[h,h+'/prefix',h+'/prefix/native-probes'].map(directory),boundary=()=>{for(const row of directories)directoryCurrent(row);};
  reason='CREATE_UNAVAILABLE';for(const file of [h+'/prefix/test',h+'/prefix/test/acceptance',h+'/prefix/src']){boundary();fs.mkdirSync(file,{mode:0o700});directoryCreateCount++;directories.push(directory(file));boundary();}
  const sources=[...before.dependencies.map(row=>({file:row.destination,source:row.source,sourceBytes:row.sourceBytes,sha256:row.sha256})),{file:before.proposal.entry,source:before.proposal.source,sourceBytes:before.proposal.sourceBytes,sha256:before.proposal.sourceSha256}],rows=[];
  for(const source of sources){boundary();const lineage=parents(source.file);let fd,written,failed=false;try{fd=fs.openSync(source.file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);fileCreateCount++;const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);boundary();const bytes=Buffer.from(source.source);let at=0;while(at<bytes.length){const n=fs.writeSync(fd,bytes,at,bytes.length-at,at);guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}fs.fsyncSync(fd);fileSyncCount++;const after=fs.fstatSync(fd,{bigint:true});guard(['dev','ino','mode','uid','gid','nlink'].every(k=>after[k]===s[k])&&after.size===BigInt(source.sourceBytes));written=mark(after);guard(mark(fs.lstatSync(source.file,{bigint:true}))===written&&JSON.stringify(parents(source.file))===JSON.stringify(lineage));}catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);
   reason='READBACK_UNAVAILABLE';const row=read(source.file,source.sha256,true);guard(row.source===source.source&&row.mark===written&&JSON.stringify(row.lineage)===JSON.stringify(lineage));rows.push(row);boundary();reason='CREATE_UNAVAILABLE';}
  reason='BOUNDARY_CHANGED';record={inputs,before,directories,rows};sourceCurrent(record);for(const row of rows){const after=read(row.file,row.sha256,true);guard(JSON.stringify(after)===JSON.stringify(row));}boundary();sourceCurrent(record);boundary();for(const row of rows)named(row);named(before.prepared);for(const row of before.dependencies)named(row);
  report={bindings:{baseA:before.proposal.baseA,baseB:before.proposal.baseB,hostBase:h,node:before.proposal.node,entry:before.proposal.entry,cwd:before.proposal.cwd,campaignSha256:before.proposal.sourceSha256},files:rows.map(({file,sha256,sourceBytes,mark,lineage})=>({file,sha256,sourceBytes,mark,lineage})),fileBytesSynced:true,namespaceCrashRecoveryEstablished:false,launcherProvisioned:false};
 }catch{record=null;/* Keep true partial counts/paths; never delete, adopt or retry. */}
 const result=authority({outcome:report?'CAMPAIGN_COPIES_OBSERVED_NOT_EXECUTED':'UNKNOWN',reason_code:report?'COPIES_OBSERVED':reason,fileCreateCount,directoryCreateCount,fileSyncCount,report});if(record)minted.set(result,record);return result;
}
export function verifySealedTypeScriptFixedCampaignCopies(copies){
 const record=minted.get(copies),unknown=()=>authority({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();
 try{sourceCurrent(record);for(const row of record.directories)directoryCurrent(row);for(const row of record.rows)guard(JSON.stringify(read(row.file,row.sha256,true))===JSON.stringify(row));sourceCurrent(record);for(const row of record.directories)directoryCurrent(row);for(const row of record.rows)named(row);named(record.before.prepared);for(const row of record.before.dependencies)named(row);return authority({outcome:'CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',...copies.report.bindings});}catch{record.invalid=true;return unknown();}
}
// Linkage is private identity only, not currentness, child authentication or a seal.
export function sealedTypeScriptFixedCampaignCopiesMatchDerivation(copies,assetsBuild,pairedArtifacts,pairedSource){const record=minted.get(copies);return arguments.length===4&&!!record&&!record.invalid&&record.inputs.assetsBuild===assetsBuild&&record.inputs.pairedArtifacts===pairedArtifacts&&record.inputs.pairedSource===pairedSource;}
