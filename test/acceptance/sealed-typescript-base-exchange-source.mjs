// Fixed data renderer only: no write/build/dispatch. Private pair validation is
// required before reading its paths. A/B stay strictly synthetic; public assets
// belong in a separately reviewed owned H. Trusted/quiescent template reads are
// not hostile-ancestor confinement or native enforcement/handle absence proof.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {verifySealedTypeScriptBaseExchangePair} from './sealed-typescript-base-exchange-pair.mjs';
const templatePin='bbf33beb65f373261c2227eb18a526d0212099526efd86668a281618199d1e98',limit=65536;
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fingerprint=stat=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const stat=fs.lstatSync(at,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink())fail('BASE_EXCHANGE_SOURCE_CHANGED');rows.push([at,['dev','ino','mode','uid','gid'].map(key=>String(stat[key])).join(':')]);if(at===path.dirname(at))return rows;}}
function regular(stat){return stat.isFile()&&!stat.isSymbolicLink()&&typeof process.getuid==='function'&&stat.uid===BigInt(process.getuid())&&stat.nlink===1n&&(stat.mode&0o6022n)===0n&&stat.size>0n&&stat.size<=BigInt(limit);}
function template(){const file=fileURLToPath(new URL('./sealed-typescript-base-exchange-sentinel.c',import.meta.url));let fd,value,failure;
 try{if(fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(file)!==file)fail('BASE_EXCHANGE_SOURCE_CHANGED');const ancestry=parents(file),named=fs.lstatSync(file,{bigint:true});if(!regular(named))fail('BASE_EXCHANGE_SOURCE_CHANGED');
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);const before=fs.fstatSync(fd,{bigint:true});if(!regular(before)||fingerprint(before)!==fingerprint(named))fail('BASE_EXCHANGE_SOURCE_CHANGED');
  const body=Buffer.alloc(Number(before.size)+1);let count=0;while(count<body.length){const n=fs.readSync(fd,body,count,body.length-count,count);if(n===0)break;if(!Number.isInteger(n)||n<0||n>body.length-count)fail('BASE_EXCHANGE_SOURCE_UNAVAILABLE');count+=n;}
  const bytes=body.subarray(0,count),text=bytes.toString('utf8');if(count!==Number(before.size)||!Buffer.from(text).equals(bytes)||sha(bytes)!==templatePin)fail('BASE_EXCHANGE_TEMPLATE_MISMATCH');
  if(fingerprint(fs.fstatSync(fd,{bigint:true}))!==fingerprint(before)||fingerprint(fs.lstatSync(file,{bigint:true}))!==fingerprint(before)||JSON.stringify(parents(file))!==JSON.stringify(ancestry))fail('BASE_EXCHANGE_SOURCE_CHANGED');value=text;
 }catch(error){failure=['BASE_EXCHANGE_SOURCE_CHANGED','BASE_EXCHANGE_TEMPLATE_MISMATCH'].includes(error?.code)?error.code:'BASE_EXCHANGE_SOURCE_UNAVAILABLE';}
 finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure??='BASE_EXCHANGE_SOURCE_UNAVAILABLE';}}
 if(failure)fail(failure);return value;
}
function observed(pair){const result=verifySealedTypeScriptBaseExchangePair(pair);if(result.outcome!=='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED'||result.scope!=='FIXED_CI_SYNTHETIC_BASE_EXCHANGE_PAIR_MECHANICS_ONLY')fail('BASE_EXCHANGE_PAIR_UNAVAILABLE');return result;}
function unsigned(value,maximum){if(typeof value!=='string'||!/^(0|[1-9][0-9]{0,19})$/.test(value)||BigInt(value)>maximum)fail('BASE_EXCHANGE_BINDINGS');return value+'ULL';}
function timestamp(value){if(typeof value!=='string'||!/^(-?[1-9][0-9]{0,28}|0)$/.test(value))fail('BASE_EXCHANGE_BINDINGS');const ns=BigInt(value),seconds=ns>=0n?ns/1000000000n:(ns-999999999n)/1000000000n,nanos=ns-seconds*1000000000n;
 if(seconds<-(1n<<63n)||seconds>(1n<<63n)-1n||nanos<0n||nanos>999999999n)fail('BASE_EXCHANGE_BINDINGS');return [seconds===-(1n<<63n)?'(-9223372036854775807LL - 1LL)':seconds+'LL',nanos+'LL'];}
export function prepareSealedTypeScriptBaseExchangeSource(pair){
 if(arguments.length!==1)fail('BASE_EXCHANGE_SOURCE_OPTIONS');const before=observed(pair),replacements=new Map();
 for(const side of ['A','B']){const file=before['base'+side];if(typeof file!=='string'||!/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(file))fail('BASE_EXCHANGE_BINDINGS');replacements.set('__REVIEWED_BASE_EXCHANGE_'+side+'__',file);
  const data=before.bindings['base'+side];for(const [field,name,max] of [['dev','DEV',2147483647n],['ino','INO',(1n<<64n)-1n],['mode','MODE',65535n],['uid','UID',4294967295n],['gid','GID',4294967295n],['nlink','NLINK',65535n],['size','SIZE',(1n<<63n)-1n]])replacements.set('__REVIEWED_BASE_'+side+'_'+name+'__',unsigned(data[field],max));
  for(const [field,name] of [['mtimeNs','MTIME'],['ctimeNs','CTIME']]){const [seconds,nanos]=timestamp(data[field]);replacements.set('__REVIEWED_BASE_'+side+'_'+name+'_SECONDS__',seconds);replacements.set('__REVIEWED_BASE_'+side+'_'+name+'_NANOSECONDS__',nanos);}
 }
 if(before.baseA===before.baseB)fail('BASE_EXCHANGE_BINDINGS');let source=template();for(const [token,value] of replacements){if(source.split(token).length!==2)fail('BASE_EXCHANGE_TEMPLATE_MISMATCH');source=source.replace(token,value);}
 if(/__REVIEWED_[A-Z_]+__/.test(source)||Buffer.byteLength(source)>limit)fail('BASE_EXCHANGE_TEMPLATE_MISMATCH');
 if(JSON.stringify(observed(pair))!==JSON.stringify(before))fail('BASE_EXCHANGE_PAIR_UNAVAILABLE');
 return freeze({schema:1,scope:'SYNTHETIC_WHOLE_BASE_EXCHANGE_SOURCE_DATA_ONLY',source,templateSha256:templatePin,sourceSha256:sha(source),sourceBytes:Buffer.byteLength(source),baseA:before.baseA,baseB:before.baseB,bindings:before.bindings,commands:[],nativeLaunches:0,nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
}
