// Trusted/quiescent data preparation ONLY. No host/auth/settings/state assets,
// callback, serialized adoption, code build/launch or native permission proof.
// Failed partial bases stay intact. This initial mint must NOT survive later
// build additions: exact known-public-asset finalization remains a separate gate.
import fs from 'node:fs';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture,verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
const minted=new WeakMap(),scope='FIXED_CI_SYNTHETIC_BASE_EXCHANGE_PAIR_MECHANICS_ONLY';
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fail=()=>{throw Error('BASE_EXCHANGE_PAIR_UNAVAILABLE');};
const canonical=value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value);
const fields=['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'];
const fingerprint=stat=>fields.map(key=>String(stat[key])).join(':');
function data(stat){return Object.fromEntries(fields.map(key=>[key,String(stat[key])]));}
function principal(){if(!['getuid','geteuid','getgid','getegid'].every(key=>typeof process[key]==='function')||process.getuid()===0||process.getuid()!==process.geteuid()||process.getgid()!==process.getegid())fail();return BigInt(process.getuid());}
function parents(){const rows=[];for(const file of ['/','/private','/private/tmp']){const stat=fs.lstatSync(file,{bigint:true});if(fs.realpathSync(file)!==file||!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0n||
 (file==='/private/tmp'?(stat.mode&0o7777n)!==0o1777n:((stat.mode&0o22n)!==0n||(stat.mode&0o7000n)!==0n)))fail();rows.push([file,['dev','ino','mode','uid','gid'].map(key=>String(stat[key])).join(':')]);}return rows;}
function names(file){const dir=fs.opendirSync(file),result=[];let failure;try{for(;;){const item=dir.readSync();if(!item)break;if(result.length===32)fail();result.push(item.name);}}catch(error){failure=error;}finally{try{dir.closeSync();}catch(error){failure??=error;}}if(failure)throw failure;return result.sort();}
function directory(file,uid){const stat=fs.lstatSync(file,{bigint:true});if(fs.realpathSync(file)!==file||!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid||(stat.mode&0o7777n)!==0o700n)fail();return stat;}
function inventory(base){const work='Checkout 空间/.sealed-native-canaries',stage='sealed-inputs/redue-materialization-Canary';
 const markers=['chmod-canary.txt','hardlink-canary.txt','map-canary.txt','rename-canary.txt','unlink-canary.txt','write-canary.txt'];
 return {directories:[['',['Checkout 空间','sealed-inputs']],['Checkout 空间',['.sealed-native-canaries']],[work,['exchange-control-a','exchange-control-b','map-canary.txt','stage-parent-exchange','write-canary.txt']],['sealed-inputs',['redue-materialization-Canary']],[stage,markers],...[work+'/exchange-control-a',work+'/exchange-control-b',work+'/stage-parent-exchange'].map(rel=>[rel,['identity-canary.txt']])],files:[...markers.map(name=>stage+'/'+name),work+'/write-canary.txt',work+'/map-canary.txt',...[work+'/exchange-control-a',work+'/exchange-control-b',work+'/stage-parent-exchange'].map(rel=>rel+'/identity-canary.txt')].map(rel=>base+'/'+rel)};
}
function inspect(record){const uid=principal(),ancestry=parents();if(JSON.stringify(ancestry)!==JSON.stringify(record.parents))fail();
 if(verifySealedTypeScriptSyntheticFixture(record.fixture).outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED')fail();
 const rows=[],inodes=new Set(),structure=inventory(record.baseA);
 for(const [rel,expected] of structure.directories){const file=record.baseA+(rel?'/'+rel:''),stat=directory(file,uid),key=stat.dev+':'+stat.ino;if(inodes.has(key))fail();inodes.add(key);if(JSON.stringify(names(file))!==JSON.stringify([...expected].sort()))fail();rows.push([file,fingerprint(stat)]);}
 const sibling=directory(record.baseB,uid),key=sibling.dev+':'+sibling.ino;if(inodes.has(key)||names(record.baseB).length!==0)fail();rows.push([record.baseB,fingerprint(sibling)]);
 const base=directory(record.baseA,uid);if(base.dev!==sibling.dev)fail();
 for(const file of structure.files){const stat=fs.lstatSync(file,{bigint:true}),inode=stat.dev+':'+stat.ino;if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==uid||stat.nlink!==1n||(stat.mode&0o7777n)!==0o644n||stat.dev!==base.dev||inodes.has(inode))fail();inodes.add(inode);rows.push([file,fingerprint(stat)]);}
 for(const [file,before] of rows)if(fingerprint(fs.lstatSync(file,{bigint:true}))!==before)fail();
 if(JSON.stringify(parents())!==JSON.stringify(ancestry)||verifySealedTypeScriptSyntheticFixture(record.fixture).outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED')fail();
 return {rows,baseA:data(base),baseB:data(sibling)};
}
const unknown=(baseA=null,baseB=null)=>freeze({schema:1,scope,outcome:'UNKNOWN',baseA,baseB,commands:[],nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
export function prepareSealedTypeScriptBaseExchangePair(){
 if(arguments.length!==0)throw Object.assign(Error('BASE_EXCHANGE_PAIR_OPTIONS'),{code:'BASE_EXCHANGE_PAIR_OPTIONS'});
 let baseA=null,baseB=null;
 try{principal();const ancestry=parents(),a=createSealedTypeScriptCIBootstrap();if(canonical(a.base))baseA=a.base;if(a.outcome!=='CI_SYNTHETIC_BOOTSTRAP_PREPARED'||!baseA)fail();
  const b=createSealedTypeScriptCIBootstrap();if(canonical(b.base))baseB=b.base;if(b.outcome!=='CI_SYNTHETIC_BOOTSTRAP_PREPARED'||!baseB||baseA===baseB)fail();
  const fixture=prepareSealedTypeScriptCISyntheticFixture(a);if(fixture.outcome!=='SYNTHETIC_FIXTURE_PREPARED'||fixture.base!==baseA)fail();
  const record={baseA,baseB,fixture,parents:ancestry},snapshot=inspect(record);
  const result=freeze({schema:1,scope,outcome:'BASE_EXCHANGE_PAIR_PREPARED',baseA,baseB,fixture,bindings:{baseA:snapshot.baseA,baseB:snapshot.baseB},commands:[],nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});
  minted.set(result,{...record,snapshot});return result;
 }catch{return unknown(baseA,baseB);}
}
export function verifySealedTypeScriptBaseExchangePair(pair){
 const record=minted.get(pair);if(!record||record.invalid)return unknown();
 try{const current=inspect(record);if(JSON.stringify(current)!==JSON.stringify(record.snapshot))fail();return freeze({schema:1,scope,outcome:'BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED',baseA:record.baseA,baseB:record.baseB,bindings:{baseA:current.baseA,baseB:current.baseB},commands:[],nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});}
 catch{record.invalid=true;return unknown(record.baseA,record.baseB);}
}
