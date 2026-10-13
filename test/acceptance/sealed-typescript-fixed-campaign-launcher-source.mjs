// Disabled campaign-only C source data. No compiler, process or configuration IO.
// Trusted/quiescent source/SDK reads are not an immutable native namespace.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const version='campaign-stdio-only-setexec@1',sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
const templatePin='7bef186e33e3d4ed3c2e7588632e3d808c4fba11a9949abe7324031a719ff90c';
const headerPins=Object.freeze({'spawn.h':'2d90f16beec60b2080553613234f004b58f384003feaa5eb809fe5e91b42b884','sys/spawn.h':'988afa3a6d7a1ce18df118d234240c02eff0715b5712784ac28b44e7f66254dc'});
const minted=new WeakMap(),sha=body=>createHash('sha256').update(body).digest('hex');
const guard=value=>{if(!value)throw Error('CAMPAIGN_LAUNCHER_SOURCE_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function read(file,owner,pin){let fd,row,failed=false;try{guard(fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined&&fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=1048576n);
 fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const bytes=Buffer.alloc(Number(s.size)+1);let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(n===0)break;guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const body=bytes.subarray(0,at),source=body.toString('utf8');guard(at===Number(s.size)&&Buffer.from(source).equals(body)&&sha(body)===pin&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));row={file,owner,pin,source,mark:mark(s),lineage};named(row);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);return row;}
function sdkIdentity(){try{const s=fs.lstatSync(sdk,{bigint:true});guard(fs.realpathSync(sdk)===sdk&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o22n)===0n);return JSON.stringify([parentMark(s),parents(sdk)]);}catch{guard(false);}}
function current(record){guard(sdkIdentity()===record.sdkIdentity);for(const row of record.rows){const next=read(row.file,row.owner,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.lineage)===JSON.stringify(row.lineage));}guard(sdkIdentity()===record.sdkIdentity);for(const row of record.rows)named(row);}
const authority=fields=>freeze({schema:1,scope:'DISABLED_FIXED_CAMPAIGN_LAUNCHER_SOURCE_DATA_ONLY',...fields,commands:[],inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
export function prepareSealedTypeScriptFixedCampaignLauncherSource(options){
 guard(arguments.length===1&&options&&Object.getPrototypeOf(options)===Object.prototype&&Reflect.ownKeys(options).length===1&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,'hostBase')??{},'value'));
 const h=options.hostBase;guard(typeof h==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&typeof process.getuid==='function'&&process.getuid()>0);
 // Static source/SDK leaves only. The engineering builder requires live private
 // assets/source/artifacts/copies before calling; this public data reader grants
 // no permission to use a source proposal or a caller's hostBase as authority.
 const identity=sdkIdentity(),rows=[read(fileURLToPath(new URL('./sealed-typescript-fixed-campaign-launcher.c',import.meta.url)),process.getuid(),templatePin),...Object.entries(headerPins).map(([name,pin])=>read(sdk+'/usr/include/'+name,0,pin))];
 const bindings={node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry:h+'/prefix/native-probes/paired-stage-campaign.mjs',launcher:h+'/prefix/native-probes/paired-stage-campaign-launch'};
 let source=rows[0].source;for(const[token,value]of [['NODE',bindings.node],['ENTRY',bindings.entry],['LAUNCHER',bindings.launcher]]){const marker='__REVIEWED_FIXED_CAMPAIGN_'+token+'__';guard(source.split(marker).length===2);source=source.replace(marker,value);}guard(!/__REVIEWED_[A-Z_]+__/.test(source)&&Buffer.byteLength(source)<=65536);
 const record={rows,sdkIdentity:identity};current(record);const result=authority({disabled:true,version,bindings,source,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source),templateSha256:templatePin,requiredSdkHeaderPins:headerPins,completeSdkClosure:'NOT_ESTABLISHED',descriptorScope:'C_TO_NODE_NONSTDIO_ONLY',stdioOwnership:'NOT_ESTABLISHED',devNullMetadataPermission:'NOT_OBSERVED'});minted.set(result,record);return result;
}
export function verifySealedTypeScriptFixedCampaignLauncherSource(proposal){const record=minted.get(proposal),unknown=()=>authority({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();try{current(record);return authority({outcome:'CAMPAIGN_LAUNCHER_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',version,sourceSha256:proposal.sourceSha256,templateSha256:templatePin});}catch{record.invalid=true;return unknown();}}
