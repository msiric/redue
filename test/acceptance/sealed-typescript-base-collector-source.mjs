// Disabled fixed collector source DATA only. Never writes, launches or adopts a
// serialized build. Exact copied public dependencies preserve their imports.
// A reviewed enclosing parent still owns native identity/effective policy/auth,
// capacity, protected copies and supervision. Reads require trusted/quiescent
// ancestry; these descriptor checks are not hostile-parent read confinement.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {verifySealedTypeScriptBaseExchangeAssets} from './sealed-typescript-base-exchange-assets.mjs';
const pins=Object.freeze([
 ['./sealed-typescript-base-child-collection.mjs','test/acceptance/sealed-typescript-base-child-collection.mjs','e9c8fdb40201c25e84bef78b8b04b00850e738e663234183966d45f65006bdb3'],
 ['./sealed-typescript-base-exchange-result.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','be2d30edf40597f52a6a9e919b5a3ee26e15bf0dc9f942badda0fb54db10b05d'],
 ['../../src/portable-envelope.mjs','src/portable-envelope.mjs','3a10d9546b5b71ceb99121412471f250676cb71a2c943532ddec39a3ac836482']]);
const mintedSources=new WeakMap();
const sha=value=>createHash('sha256').update(value).digest('hex'),limit=1024*1024;
const fail=code=>{throw Object.assign(Error(code),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(s[key])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink())fail('BASE_COLLECTOR_SOURCE_CHANGED');rows.push([at,['dev','ino','mode','uid','gid'].map(key=>String(s[key])).join(':')]);if(at===path.dirname(at))return rows;}}
function current(row){if(mark(fs.lstatSync(row.file,{bigint:true}))!==row.mark||JSON.stringify(parents(row.file))!==JSON.stringify(row.lineage))fail('BASE_COLLECTOR_SOURCE_CHANGED');}
function dependency(relative,pin){let fd,row,failure;try{const file=fileURLToPath(new URL(relative,import.meta.url));
 if(typeof process.getuid!=='function'||fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(file)!==file)fail('BASE_COLLECTOR_SOURCE_CHANGED');
 const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);if(!s.isFile()||s.isSymbolicLink()||s.uid!==BigInt(process.getuid())||s.nlink!==1n||(s.mode&0o6022n)!==0n||s.size<=0n||s.size>BigInt(limit))fail('BASE_COLLECTOR_SOURCE_CHANGED');
 fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);if(mark(fs.fstatSync(fd,{bigint:true}))!==mark(s))fail('BASE_COLLECTOR_SOURCE_CHANGED');
 const bytes=Buffer.alloc(Number(s.size)+1);let count=0;while(count<bytes.length){const n=fs.readSync(fd,bytes,count,bytes.length-count,count);if(n===0)break;if(!Number.isInteger(n)||n<0||n>bytes.length-count)fail('BASE_COLLECTOR_SOURCE_UNAVAILABLE');count+=n;}
 const body=bytes.subarray(0,count),source=body.toString('utf8');if(count!==Number(s.size)||!Buffer.from(source).equals(body)||sha(body)!==pin)fail('BASE_COLLECTOR_DEPENDENCY_MISMATCH');
 if(mark(fs.fstatSync(fd,{bigint:true}))!==mark(s))fail('BASE_COLLECTOR_SOURCE_CHANGED');row={file,mark:mark(s),lineage,source,sha256:pin};current(row);
 }catch(error){failure=['BASE_COLLECTOR_SOURCE_CHANGED','BASE_COLLECTOR_DEPENDENCY_MISMATCH'].includes(error?.code)?error.code:'BASE_COLLECTOR_SOURCE_UNAVAILABLE';}
 finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure??='BASE_COLLECTOR_SOURCE_UNAVAILABLE';}}if(failure)fail(failure);return row;}
function observed(build){const value=verifySealedTypeScriptBaseExchangeAssets(build);if(value.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'||value.scope!=='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY')fail('BASE_COLLECTOR_ASSETS_UNAVAILABLE');return value;}
export function prepareSealedTypeScriptBaseCollectorSource(build){
 if(arguments.length!==1)fail('BASE_COLLECTOR_SOURCE_OPTIONS');const before=observed(build);
 const {baseA,baseB,hostBase}=before;if(![baseA,baseB,hostBase].every(value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value))||new Set([baseA,baseB,hostBase]).size!==3)fail('BASE_COLLECTOR_BINDINGS');
 const node=hostBase+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=hostBase+'/prefix/native-probes/base-exchange-collect.mjs',helper=hostBase+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel',cwd=baseA+'/Checkout 空间/.sealed-native-canaries';
 // Paths are consulted only after the private verifier; report data never mints.
 if(build.report?.base!==hostBase||build.report?.binary?.file!==helper||!/^[a-f0-9]{64}$/.test(build.report?.binary?.sha256??''))fail('BASE_COLLECTOR_BINDINGS');
 const rows=pins.map(([relative,,pin])=>dependency(relative,pin));
 const source=`// Fixed reviewed native tool collector; no caller-selected child/arguments.\nimport {spawn} from 'node:child_process';\nimport {collectSealedTypeScriptBaseChild,classifySealedTypeScriptBaseChild} from '../test/acceptance/sealed-typescript-base-child-collection.mjs';\nconst publish=result=>{process.exitCode=result.outcome==='FAIL'?1:74;try{process.stdout.write(JSON.stringify(result)+'\\n');}catch{}};\nlet classified=classifySealedTypeScriptBaseChild(null);\ntry{\n if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||process.execPath!==${JSON.stringify(node)}||process.argv.length!==2||process.argv[1]!==${JSON.stringify(entry)}||Object.keys(process.env).some(key=>/^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE)$|^(?:DYLD_|LD_|OPENSSL_)/i.test(key)))throw Error();\n const collection=await collectSealedTypeScriptBaseChild(()=>spawn(${JSON.stringify(helper)},[],{cwd:${JSON.stringify(cwd)},stdio:['ignore','pipe','pipe']}));\n classified=classifySealedTypeScriptBaseChild(collection);\n}catch{}\npublish(classified);\n`;
 if(Buffer.byteLength(source)>65536)fail('BASE_COLLECTOR_BINDINGS');
 if(JSON.stringify(observed(build))!==JSON.stringify(before))fail('BASE_COLLECTOR_ASSETS_UNAVAILABLE');for(const row of rows)current(row);
 const result=freeze({schema:1,scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',disabled:true,bindings:{baseA,baseB,hostBase,node,entry,helper,helperSha256:build.report.binary.sha256,nodeSha256:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'},
  proposedSources:[...rows.map((row,at)=>({file:hostBase+'/prefix/'+pins[at][1],source:row.source,sourceBytes:Buffer.byteLength(row.source),sha256:row.sha256})),{file:entry,source,sourceBytes:Buffer.byteLength(source),sha256:sha(source)}],commands:[],nativeLaunches:0,helperExecutions:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false,
  blockers:['CURRENT_PINNED_NATIVE_EFFECTIVE_PROFILE_AUTH_AND_CAPACITY_REQUIRED','CURRENT_PROTECTED_SOURCE_AND_RUNTIME_COPIES_REQUIRED','TRUSTED_PARENT_SUPERVISION_REQUIRED','OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED']});
 mintedSources.set(result,{build,before,rows,bindings:result.bindings});return result;
}

// Private source derivation/currentness only. No protected copies exist by this
// observation, no serialized proposal adopts the mint, and failures latch.
export function verifySealedTypeScriptBaseCollectorSource(proposal){
 const record=mintedSources.get(proposal),unknown=()=>freeze({schema:1,scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',outcome:'UNKNOWN',commands:[],sealed:false,reuseEligible:false});
 if(!record||record.invalid)return unknown();
 try{if(JSON.stringify(observed(record.build))!==JSON.stringify(record.before))fail('BASE_COLLECTOR_ASSETS_UNAVAILABLE');
  for(let at=0;at<pins.length;at++){const row=dependency(pins[at][0],pins[at][2]);if(row.mark!==record.rows[at].mark||JSON.stringify(row.lineage)!==JSON.stringify(record.rows[at].lineage))fail('BASE_COLLECTOR_SOURCE_CHANGED');}
  if(JSON.stringify(observed(record.build))!==JSON.stringify(record.before))fail('BASE_COLLECTOR_ASSETS_UNAVAILABLE');for(const row of record.rows)current(row);
  return freeze({schema:1,scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',outcome:'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',baseA:record.bindings.baseA,baseB:record.bindings.baseB,hostBase:record.bindings.hostBase,bindings:record.bindings,commands:[],nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
 }catch{record.invalid=true;return unknown();}
}

