// Disabled campaign-only C source data. No compiler, process or configuration IO.
// Trusted/quiescent source/SDK reads are not an immutable native namespace.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const version='campaign-prepared-devnull-setexec@1',sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
const templatePin='de6b9561b60ea9c255be7d2972b47e72c42e3deda054a3cdf5946614b240e14e';
const headerPins=Object.freeze({'spawn.h':'2d90f16beec60b2080553613234f004b58f384003feaa5eb809fe5e91b42b884','sys/spawn.h':'988afa3a6d7a1ce18df118d234240c02eff0715b5712784ac28b44e7f66254dc'});
const minted=new WeakMap(),sha=body=>createHash('sha256').update(body).digest('hex');
const guard=value=>{if(!value)throw Error('CAMPAIGN_PREPARED_NULL_SOURCE_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function read(file,owner,pin){let fd,row,failed=false;try{guard(fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined&&fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=1048576n);
 fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const bytes=Buffer.alloc(Number(s.size)+1);let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(n===0)break;guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const body=bytes.subarray(0,at),source=body.toString('utf8');guard(at===Number(s.size)&&Buffer.from(source).equals(body)&&sha(body)===pin&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));row={file,owner,pin,source,mark:mark(s),lineage};named(row);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);return row;}
function sdkIdentity(){try{const s=fs.lstatSync(sdk,{bigint:true});guard(fs.realpathSync(sdk)===sdk&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o22n)===0n);return JSON.stringify([parentMark(s),parents(sdk)]);}catch{guard(false);}}
// Fixed metadata only: no open/read of /dev/null and no caller-supplied tuple.
// Endpoints during trusted/quiescent preparation do not prove an immutable interval.
const unsigned=(value,max)=>{guard(typeof value==='bigint'&&value>=0n&&value<=max);return value.toString(10);};
function nullSnapshot(){const s=fs.lstatSync('/dev/null',{bigint:true});guard(s.isCharacterDevice()&&!s.isSymbolicLink()&&typeof s.mode==='bigint'&&(s.mode&0o170000n)===0o020000n);
 const tuple={dev:unsigned(s.dev,2147483647n),ino:unsigned(s.ino,18446744073709551615n),rdev:unsigned(s.rdev,2147483647n)};return{tuple,mark:mark(s)};}
function nullIdentity(){try{const file='/dev/null';guard(fs.realpathSync(file)===file);const before=nullSnapshot(),lineage=parents(file),identity=JSON.stringify([before,lineage]);guard(fs.realpathSync(file)===file&&JSON.stringify(nullSnapshot())===JSON.stringify(before)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return{tuple:before.tuple,identity};
 }catch{guard(false);}}
function currentNull(record){guard(nullIdentity().identity===record.nullIdentity);}
function current(record){currentNull(record);guard(sdkIdentity()===record.sdkIdentity);for(const row of record.rows){const next=read(row.file,row.owner,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.lineage)===JSON.stringify(row.lineage));}guard(sdkIdentity()===record.sdkIdentity);for(const row of record.rows)named(row);currentNull(record);}
const authority=fields=>freeze({schema:1,scope:'DISABLED_FIXED_CAMPAIGN_PREPARED_NULL_SOURCE_DATA_ONLY',...fields,commands:[],inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
export function prepareSealedTypeScriptFixedCampaignPreparedNullSource(options){
 guard(arguments.length===1&&options&&Object.getPrototypeOf(options)===Object.prototype&&Reflect.ownKeys(options).length===1&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,'hostBase')??{},'value'));
 const h=options.hostBase;guard(typeof h==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&typeof process.getuid==='function'&&process.getuid()>0);
 // Separate disabled source data only; no builder or execution route adopts it.
 // The caller's hostBase supplies no filesystem or provisioning authority.
 const preparedNull=nullIdentity(),identity=sdkIdentity(),rows=[read(fileURLToPath(new URL('./sealed-typescript-fixed-campaign-prepared-null.c',import.meta.url)),process.getuid(),templatePin),...Object.entries(headerPins).map(([name,pin])=>read(sdk+'/usr/include/'+name,0,pin))];
 const bindings={node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry:h+'/prefix/native-probes/paired-stage-campaign.mjs',launcher:h+'/prefix/native-probes/paired-stage-campaign-launch'};
 let source=rows[0].source;for(const[token,value]of [['NODE',bindings.node],['ENTRY',bindings.entry],['LAUNCHER',bindings.launcher]]){const marker='__REVIEWED_FIXED_CAMPAIGN_'+token+'__';guard(source.split(marker).length===2);source=source.replace(marker,value);}for(const [token,value] of Object.entries(preparedNull.tuple)){const marker='__REVIEWED_FIXED_CAMPAIGN_NULL_'+token.toUpperCase()+'__';guard(source.split(marker).length===2&&/^(0|[1-9][0-9]*)$/.test(value));source=source.replace(marker,value);}guard(!/__REVIEWED_[A-Z_]+__/.test(source)&&Buffer.byteLength(source)<=65536);
 const record={rows,sdkIdentity:identity,nullIdentity:preparedNull.identity};current(record);const result=authority({disabled:true,version,bindings,source,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source),templateSha256:templatePin,requiredSdkHeaderPins:headerPins,completeSdkClosure:'NOT_ESTABLISHED',descriptorScope:'C_TO_NODE_NONSTDIO_ONLY',stdioOwnership:'NOT_ESTABLISHED',devNullMetadataPermission:'PREPARATION_ENDPOINTS_ONLY',preparedNullIdentityScope:'TRUSTED_QUIESCENT_PREPARATION_ENDPOINTS_ONLY',captureNamespace:'NOT_ESTABLISHED',fifoParentOwnership:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED'});minted.set(result,record);return result;
}
export function verifySealedTypeScriptFixedCampaignPreparedNullSource(proposal){const record=minted.get(proposal),unknown=()=>authority({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();try{current(record);guard(!record.invalid);return authority({outcome:'CAMPAIGN_PREPARED_NULL_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',version,sourceSha256:proposal.sourceSha256,templateSha256:templatePin});}catch{record.invalid=true;return unknown();}}
