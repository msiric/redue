// Disabled campaign-only C source data. No compiler, process or configuration IO.
// Trusted/quiescent source/SDK reads are not an immutable native namespace.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {sealedTypeScriptBaseExchangeAssetsFixtureProfile,sealedTypeScriptBaseExchangeAssetsMatchHostBase,verifySealedTypeScriptBaseExchangeAssets} from './sealed-typescript-base-exchange-assets.mjs';
const version='campaign-prepared-devnull-setexec@2',sdk='/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk';
export const SEALED_TYPESCRIPT_PREPARED_NULL_IDENTITY_INTERPRETATION='prepared-null-device-endpoints@1';
const templatePin='ecff1f5d828aa83e1050da066f1f8037fef3f7c15949cae45674371ae85ea35b';
const headerPins=Object.freeze({'spawn.h':'2d90f16beec60b2080553613234f004b58f384003feaa5eb809fe5e91b42b884','sys/spawn.h':'988afa3a6d7a1ce18df118d234240c02eff0715b5712784ac28b44e7f66254dc'});
const ciSdk='/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk';
const ciHeaderPins=Object.freeze({...headerPins,'sys/spawn.h':'8e73a88c3f63dae77ebf831737942e82ee7c78a7af1446fdbb1ee7ac6804a7e4'});
const minted=new WeakMap(),sha=body=>createHash('sha256').update(body).digest('hex');
const guard=value=>{if(!value)throw Error('CAMPAIGN_PREPARED_NULL_SOURCE_UNKNOWN');};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
// ONLY the prepared character-device endpoint projects volatile timestamps.
// The C template selects dev/ino/rdev/type and descriptor access, never device
// mtime/ctime or content. All structural fields/canonical ancestry remain; this
// says nothing about an interval. Source/SDK full marks above stay unchanged.
const nullDeviceMark=s=>['dev','ino','mode','uid','gid','nlink','size'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.lineage));}
function read(file,owner,pin){let fd,row,failed=false;try{guard(fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined&&fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=1048576n);
 fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const bytes=Buffer.alloc(Number(s.size)+1);let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(n===0)break;guard(Number.isInteger(n)&&n>0&&n<=bytes.length-at);at+=n;}const body=bytes.subarray(0,at),source=body.toString('utf8');guard(at===Number(s.size)&&Buffer.from(source).equals(body)&&sha(body)===pin&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));row={file,owner,pin,source,mark:mark(s),lineage};named(row);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);return row;}
function sdkIdentity(selectedSdk=sdk){try{const s=fs.lstatSync(selectedSdk,{bigint:true});guard(fs.realpathSync(selectedSdk)===selectedSdk&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o22n)===0n);return JSON.stringify([parentMark(s),parents(selectedSdk)]);}catch{guard(false);}}
// Fixed metadata only: no open/read of /dev/null and no caller-supplied tuple.
// Endpoints during trusted/quiescent preparation do not prove an immutable interval.
// Pinned Node 22.13.0 exposes signed BigInt64 stat slots. Darwin dev_t is
// signed32; accept only ino_t's verified nonnegative signed64 subset. Negative
// inode/high-bit representations remain UNKNOWN; never reinterpret or normalize.
const integer=(stat,key,min,max)=>{const field=Object.getOwnPropertyDescriptor(stat,key);guard(field&&Object.hasOwn(field,'value'));const value=field.value;guard(typeof value==='bigint'&&value>=min&&value<=max);return value.toString(10);};
function nullSnapshot(){const s=fs.lstatSync('/dev/null',{bigint:true});guard(s.isCharacterDevice()&&!s.isSymbolicLink()&&typeof s.mode==='bigint'&&(s.mode&0o170000n)===0o020000n);
 const tuple={dev:integer(s,'dev',-2147483648n,2147483647n),ino:integer(s,'ino',0n,9223372036854775807n),rdev:integer(s,'rdev',-2147483648n,2147483647n)};return{tuple,mark:nullDeviceMark(s)};}
function nullIdentity(){try{const file='/dev/null';guard(fs.realpathSync(file)===file);const before=nullSnapshot(),lineage=parents(file),identity=JSON.stringify([before,lineage]);guard(fs.realpathSync(file)===file&&JSON.stringify(nullSnapshot())===JSON.stringify(before)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return{tuple:before.tuple,identity};
 }catch{guard(false);}}
function currentNull(record){guard(record.preparedNullIdentityInterpretation===SEALED_TYPESCRIPT_PREPARED_NULL_IDENTITY_INTERPRETATION);guard(nullIdentity().identity===record.nullIdentity);}
function current(record){currentNull(record);guard((!record.ci||sealedTypeScriptBaseExchangeAssetsFixtureProfile(record.assetsBuild)===record.fixtureProfileId)&&sdkIdentity(record.sdk)===record.sdkIdentity);for(const row of record.rows){const next=read(row.file,row.owner,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.lineage)===JSON.stringify(row.lineage));}guard((!record.ci||sealedTypeScriptBaseExchangeAssetsFixtureProfile(record.assetsBuild)===record.fixtureProfileId)&&sdkIdentity(record.sdk)===record.sdkIdentity);for(const row of record.rows)named(row);currentNull(record);}
const authority=fields=>freeze({schema:1,scope:'DISABLED_FIXED_CAMPAIGN_PREPARED_NULL_SOURCE_DATA_ONLY',...fields,commands:[],inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
export function prepareSealedTypeScriptFixedCampaignPreparedNullSource(options){guard(arguments.length===1);return prepareFixed(options,false);}
export function prepareSealedTypeScriptFixedCampaignPreparedNullSourceForReviewedCI(options){guard(arguments.length===1);return prepareFixed(options,true);}
function prepareFixed(options,ci){
 const keys=ci?['hostBase','assetsBuild']:['hostBase'];guard(options&&Object.getPrototypeOf(options)===Object.prototype&&Reflect.ownKeys(options).length===keys.length&&keys.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,key)??{},'value')));
 const h=options.hostBase;guard(typeof h==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(h)&&typeof process.getuid==='function'&&process.getuid()>0);
 const selectedSdk=ci?ciSdk:sdk,selectedPins=ci?ciHeaderPins:headerPins,fixtureProfileId=ci?sealedTypeScriptBaseExchangeAssetsFixtureProfile(options.assetsBuild):null;
 if(ci)guard(fixtureProfileId==='fixed-native-assets-ci-sdk26.5-toolpair-a@1'||fixtureProfileId==='fixed-native-assets-ci-sdk26.5-toolpair-b@1');
 if(ci){guard(sealedTypeScriptBaseExchangeAssetsFixtureProfile(options.assetsBuild)===fixtureProfileId&&sealedTypeScriptBaseExchangeAssetsMatchHostBase(options.assetsBuild,h));const original=verifySealedTypeScriptBaseExchangeAssets(options.assetsBuild);guard(original.outcome==='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'&&original.hostBase===h);}
 // Separate disabled source data only; no builder or execution route adopts it.
 // The caller's hostBase supplies no filesystem or provisioning authority.
 const preparedNull=nullIdentity(),identity=sdkIdentity(selectedSdk),rows=[read(fileURLToPath(new URL('./sealed-typescript-fixed-campaign-prepared-null.c',import.meta.url)),process.getuid(),templatePin),...Object.entries(selectedPins).map(([name,pin])=>read(selectedSdk+'/usr/include/'+name,0,pin))];
 const bindings={node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry:h+'/prefix/native-probes/paired-stage-campaign.mjs',launcher:h+'/prefix/native-probes/paired-stage-campaign-launch'};
 let source=rows[0].source;for(const[token,value]of [['NODE',bindings.node],['ENTRY',bindings.entry],['LAUNCHER',bindings.launcher]]){const marker='__REVIEWED_FIXED_CAMPAIGN_'+token+'__';guard(source.split(marker).length===2);source=source.replace(marker,value);}for(const [token,value] of Object.entries(preparedNull.tuple)){const marker='__REVIEWED_FIXED_CAMPAIGN_NULL_'+token.toUpperCase()+'__';guard(source.split(marker).length===2&&/^(0|-?[1-9][0-9]*)$/.test(value));source=source.replace(marker,value);}guard(!/__REVIEWED_[A-Z_]+__/.test(source)&&Buffer.byteLength(source)<=65536);
 const record={rows,sdk:selectedSdk,ci,fixtureProfileId,assetsBuild:ci?options.assetsBuild:null,sdkIdentity:identity,nullIdentity:preparedNull.identity,preparedNullIdentityInterpretation:SEALED_TYPESCRIPT_PREPARED_NULL_IDENTITY_INTERPRETATION};current(record);const result=authority({disabled:true,version,bindings,source,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source),templateSha256:templatePin,requiredSdkHeaderPins:selectedPins,...(ci?{fixtureProfileId}:{}),completeSdkClosure:'NOT_ESTABLISHED',descriptorScope:'C_TO_NODE_NONSTDIO_ONLY',stdioOwnership:'NOT_ESTABLISHED',devNullMetadataPermission:'PREPARATION_ENDPOINTS_ONLY',preparedNullIdentityScope:'TRUSTED_QUIESCENT_PREPARATION_ENDPOINTS_ONLY',preparedNullIdentityInterpretation:SEALED_TYPESCRIPT_PREPARED_NULL_IDENTITY_INTERPRETATION,captureNamespace:'NOT_ESTABLISHED',fifoParentOwnership:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED'});minted.set(result,record);return result;
}
export function verifySealedTypeScriptFixedCampaignPreparedNullSource(proposal){const record=minted.get(proposal),unknown=()=>authority({outcome:'UNKNOWN'});if(!record||record.invalid)return unknown();try{current(record);guard(!record.invalid);return authority({outcome:'CAMPAIGN_PREPARED_NULL_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',version,preparedNullIdentityInterpretation:SEALED_TYPESCRIPT_PREPARED_NULL_IDENTITY_INTERPRETATION,sourceSha256:proposal.sourceSha256,templateSha256:templatePin,...(record.ci?{fixtureProfileId:record.fixtureProfileId}:{} )});}catch{record.invalid=true;return unknown();}}

// Exact original CI source/asset identity only, not currentness.
export function sealedTypeScriptFixedCampaignPreparedNullSourceMatchesReviewedCIAssets(proposal,assetsBuild){const record=minted.get(proposal);return arguments.length===2&&!!record&&!record.invalid&&record.ci===true&&record.assetsBuild===assetsBuild;}
