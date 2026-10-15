// Trusted/quiescent data preparation ONLY. No host/auth/settings/state assets,
// callback, serialized adoption, code build/launch or native permission proof.
// Failed partial bases stay intact. BOTH bases remain strictly synthetic:
// code/build/host assets belong in a separate owned namespace, never this pair.
import fs from 'node:fs';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture,verifySealedTypeScriptSyntheticFixture,sealedTypeScriptSyntheticFixtureOriginalAvailable} from './sealed-typescript-synthetic-fixture.mjs';
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
// Capture ONLY these locally known case spellings at original construction.
// Absence is retained as unsupported case-control topology, never compatibility.
function originalCaseAliases(base,snapshot){
 const rows=new Map(snapshot.rows),relative=['sealed-inputs','sealed-inputs/redue-materialization-Canary','sealed-inputs/redue-materialization-Canary/write-canary.txt'];
 return relative.map(rel=>{const target=base+'/'+rel,file=base+'/'+rel.replace('sealed-inputs','SEALED-INPUTS');let stat;
  try{stat=fs.lstatSync(file,{bigint:true});}catch(error){if(error?.code==='ENOENT')return{file,present:false};throw error;}
  // Node22.13's JS realpath retains non-symlink component spelling. Native
  // realpath must resolve THIS fixed alias to its exact original target;
  // absence/errors/alternate targets are not case-folded or admitted.
  if(stat.isSymbolicLink()||fingerprint(stat)!==rows.get(target)||typeof fs.realpathSync.native!=='function'||fs.realpathSync.native(file)!==target)fail();
  return{file,target,mark:rows.get(target),present:true,directory:rel!==relative[2]};
 });
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
  const caseAliases=originalCaseAliases(baseA,snapshot);if(verifySealedTypeScriptSyntheticFixture(fixture).outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'||JSON.stringify(inspect(record))!==JSON.stringify(snapshot))fail();
  minted.set(result,{...record,snapshot,caseAliases});return result;
 }catch{return unknown(baseA,baseB);}
}
export function verifySealedTypeScriptBaseExchangePair(pair){
 const record=minted.get(pair);if(!record||record.invalid)return unknown();
 try{const current=inspect(record);if(JSON.stringify(current)!==JSON.stringify(record.snapshot))fail();return freeze({schema:1,scope,outcome:'BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED',baseA:record.baseA,baseB:record.baseB,bindings:{baseA:current.baseA,baseB:current.baseB},commands:[],nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false});}
 catch{record.invalid=true;return unknown(record.baseA,record.baseB);}
}

// Fixed original projection ingredients, never a caller-selected inventory.
// This query performs no I/O and does not revive an observed owner failure.
// Workspace contents/entries/timestamps are intentionally mutable controls;
// its directory identity and original trusted Checkout inventory remain bound
// data; this export grants no post-actor root inventory/continuity observation.
export function sealedTypeScriptBaseExchangePairOriginalInputs(pair){
 const record=minted.get(pair);if(arguments.length!==1||!record||record.invalid||!sealedTypeScriptSyntheticFixtureOriginalAvailable(record.fixture))return null;
 const a=record.baseA,b=record.baseB,work=a+'/Checkout 空间/.sealed-native-canaries',stage=a+'/sealed-inputs/redue-materialization-Canary',rows=new Map(record.snapshot.rows);
 const identity=file=>({file,mark:rows.get(file).split(':').slice(0,5).join(':'),full:false});
 const directories=[...record.parents.map(([file,mark])=>({file,mark,full:false})),...['','/Checkout 空间','/sealed-inputs','/sealed-inputs/redue-materialization-Canary'].map(rel=>({file:a+rel,mark:rows.get(a+rel),full:true})),identity(work),{file:b,mark:rows.get(b),full:true}];
 const membership=[[a,['Checkout 空间','sealed-inputs']],[a+'/Checkout 空间',['.sealed-native-canaries']],[a+'/sealed-inputs',['redue-materialization-Canary']],[stage,['chmod-canary.txt','hardlink-canary.txt','map-canary.txt','rename-canary.txt','unlink-canary.txt','write-canary.txt']],[b,[]]];
 return freeze({baseA:a,baseB:b,directories,membership,files:membership[3][1].map(name=>({file:stage+'/'+name,mark:rows.get(stage+'/'+name),marker:true})),absent:[a+'/sealed-inputs-replaced',stage+'/rename-destination.txt',work+'/stage-alias.txt'],caseAliases:record.caseAliases.map(row=>({...row})),workspaceAlias:{file:work+'/stage-parent-alias',target:a+'/sealed-inputs',canary:stage+'/write-canary.txt',mark:rows.get(stage+'/write-canary.txt')}});
}
