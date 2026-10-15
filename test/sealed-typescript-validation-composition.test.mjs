// Actual verifier bodies with only in-memory filesystem/private-mint injections.
// No compiler, fixtures, native process, model, or executable is launched.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const nativeSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-assets-build.mjs',import.meta.url),'utf8');
const exchangeSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-base-exchange-assets.mjs',import.meta.url),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const strip=s=>s.replace(/^import .*;$/gm,line=>line.startsWith('import * as fixedCost ')?'const fixedCost={beginFixedCIPreparationCost:()=>null,endFixedCIPreparationCost:()=>{},fixedCIPreparationGuardStage:()=>{},fixedCIPreparationRefusal:()=>{}};':'').replaceAll('export function ','function ');
function harness(){
 const nodes=new Map(),handles=new Map();let inode=1,fd=10,hook=()=>{},fixtureHook=()=>{};
 const state={reads:[],fixtureReads:0},put=(file,dir=false,body=Buffer.alloc(0),uid=501n,mode=dir?0o40700n:0o100600n)=>{
  nodes.set(file,{dev:1n,ino:BigInt(inode++),uid,gid:20n,mode,nlink:1n,size:BigInt(body.length),mtimeNs:1n,ctimeNs:1n,body:Buffer.from(body),dir});};
 for(const at of ['/','/H','/A','/B'])put(at,true);put('/SDK',true,Buffer.alloc(0),0n,0o40755n);
 for(const at of Array.from({length:8},(_,i)=>'/H/native-'+i).concat(['/H/exchange.c','/H/exchange']))put(at,false,Buffer.from(at));
 const stat=file=>{const row=nodes.get(file);if(!row)throw Object.assign(Error('MOCK_MISSING'),{code:'ENOENT'});return{...row,isFile:()=>!row.dir,isDirectory:()=>row.dir,isSymbolicLink:()=>false};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:131072,O_NONBLOCK:4},realpathSync:file=>file,lstatSync:stat,
  openSync(file,flags){assert.equal(flags,131076);const id=fd++;handles.set(id,file);return id;},fstatSync:id=>stat(handles.get(id)),
  readSync(id,buffer,offset,length,position){const file=handles.get(id),row=nodes.get(file);state.reads.push(file);hook(file,position);
   return row.body.copy(buffer,offset,position,Math.min(position+length,row.body.length));},closeSync:id=>{assert(handles.has(id));handles.delete(id);}};
 const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
 const dirMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
 const parents=file=>{const out=[];for(let at=path.posix.dirname(file);;at=path.posix.dirname(at)){out.push([at,dirMark(stat(at))]);if(at===path.posix.dirname(at))return out;}};
 const row=file=>({file,owner:501,limit:1024,digest:sha(nodes.get(file).body),mark:mark(stat(file)),lineage:parents(file)});
 const native={},exchange={},nativeRecord={fixture:{},base:'/H',baseIdentity:dirMark(stat('/H')),identities:[],sdk:'/SDK',sdkIdentity:dirMark(stat('/SDK')),rows:Array.from({length:8},(_,i)=>row('/H/native-'+i))};
 const nativeMap=new WeakMap([[native,nativeRecord]]);
 const nativeCode=strip(nativeSource).replace('const mintedBuilds=new WeakMap();','const mintedBuilds=nativeMap;');
 const nativeAPI=Function('fs','path','os','createHash','spawnSync','verifySealedTypeScriptSyntheticFixture','prepareSealedTypeScriptNativeAssetsProposal','nativeMap','process',nativeCode+';return {verify:verifySealedTypeScriptNativeAssetsBuild,observe:observeSealedTypeScriptNativeAssetsBuild};')(
  io,path.posix,{},createHash,()=>{throw Error('NO_PROCESS');},()=>{state.fixtureReads++;fixtureHook();return{outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'};},()=>{throw Error('NO_PROPOSAL');},nativeMap,{getuid:()=>501});
 const initialPair={outcome:'BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED',baseA:'/A',baseB:'/B'};
 const root=file=>({inode:stat(file).dev+':'+stat(file).ino,identity:dirMark(stat(file)),parents:parents(file)});
 const exchangeRecord={pair:{},hostFixture:{},hostBuild:native,initialPair,roots:['/A','/B','/H'].map(file=>[file,root(file)]),source:row('/H/exchange.c'),binary:row('/H/exchange')};
 const exchangeMap=new WeakMap([[exchange,exchangeRecord]]);
 const exchangeCode=strip(exchangeSource).replace('const mintedAssets=new WeakMap();','const mintedAssets=exchangeMap;');
 const createExchange=code=>Function('fs','path','createHash','verifySealedTypeScriptBaseExchangePair','verifySealedTypeScriptSyntheticFixture','observeSealedTypeScriptNativeAssetsBuild','verifySealedTypeScriptNativeAssetsBuild','exchangeMap','process',code+';return verifySealedTypeScriptBaseExchangeAssets;')(
  io,path.posix,createHash,()=>initialPair,()=>({outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'}),nativeAPI.observe,nativeAPI.verify,exchangeMap,{getuid:()=>501});
 const exchangeVerify=createExchange(exchangeCode);
 // Held-stable regression reference: only restore the prior three full native
 // verifier calls. This is not the expected-outcome oracle for adversarial cases.
 const referenceCode=exchangeCode.replace(/observeSealedTypeScriptNativeAssetsBuild\(record.hostBuild,lateNativeBarrier=>\{[\s\S]*?\n  \}\);/,`guard(verifySealedTypeScriptNativeAssetsBuild(record.hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(record.source);current(record.binary);boundary();
  guard(verifySealedTypeScriptNativeAssetsBuild(record.hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');current(record.source);current(record.binary);boundary();
  guard(verifySealedTypeScriptNativeAssetsBuild(record.hostBuild).outcome==='ASSETS_BUILD_CURRENTLY_OBSERVED');`);
 assert.notEqual(referenceCode,exchangeCode);
 const referenceVerify=createExchange(referenceCode);
 const mutate=file=>{nodes.get(file).body[0]^=1;nodes.get(file).ctimeNs++;};
 return{...nativeAPI,exchangeVerify,referenceVerify,native,exchange,nativeRecord,exchangeRecord,nodes,handles,state,mutate,hook:value=>{hook=value;},fixtureHook:value=>{fixtureHook=value;}};
}
const assertCurrent=value=>{assert.equal(value.outcome,'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);assert.deepEqual(value.commands,[]);};
test('one exchange CURRENT call full-hashes all eight native rows once, and two new rows twice; a new call hashes anew',()=>{
 const h=harness();assertCurrent(h.exchangeVerify(h.exchange));assert.deepEqual(h.state.reads,[...Array.from({length:8},(_,i)=>'/H/native-'+i),'/H/exchange.c','/H/exchange','/H/exchange.c','/H/exchange']);
 assert.equal(h.handles.size,0);const old=h.state.reads.length;assertCurrent(h.exchangeVerify(h.exchange));assert.equal(h.state.reads.length,old*2);assert.equal(h.handles.size,0);
});
for(const at of [0,3,7])test('native mutation during full read '+at+' invalidates both observations permanently',()=>{
 const h=harness();h.hook(file=>{if(file==='/H/native-'+at)h.mutate(file);});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);assert.equal(h.exchangeRecord.invalid,true);assert.equal(h.handles.size,0);
 h.hook(()=>{});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.verify(h.native).outcome,'UNKNOWN');
});
for(const at of [0,3,7])test('native mutation after its hash during later native read '+at+' is caught by complete late native barrier',()=>{
 const h=harness();h.hook(file=>{if(file==='/H/native-7')h.mutate('/H/native-'+at);});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);assert.equal(h.handles.size,0);
});
for(const at of [0,3,7])for(const moment of [1,2,3,4])test('native row '+at+' mutation during exchange read '+moment+' invalidates and cannot revive',()=>{
 const h=harness();let count=0;h.hook(file=>{if(file.startsWith('/H/exchange')&&++count===moment)h.mutate('/H/native-'+at);});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);assert.equal(h.exchangeRecord.invalid,true);assert.equal(h.handles.size,0);
 h.hook(()=>{});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');
});
for(const file of ['/H/exchange.c','/H/exchange'])for(const moment of [1,2,3,4])test('new row '+file+' changed at exchange read '+moment+' is never current',()=>{
 const h=harness();let count=0;h.hook(read=>{if(read.startsWith('/H/exchange')&&++count===moment)h.mutate(file);});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.exchangeRecord.invalid,true);assert.equal(h.handles.size,0);
});
test('content mismatch with identical synthetic metadata fails the full native baseline hash',()=>{
 const h=harness();h.nodes.get('/H/native-3').body[0]^=1;assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);
});
for(const file of ['/H','/SDK','/A','/B'])test('root/SDK replacement '+file+' during last exchange read is conservative',()=>{
 const h=harness();let count=0;h.hook(read=>{if(read.startsWith('/H/exchange')&&++count===4)h.nodes.get(file).ino++;});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.exchangeRecord.invalid,true);
});
test('final fixture check changing original row is caught by the post-fixture metadata barrier',()=>{
 const h=harness();h.fixtureHook(()=>{if(h.state.fixtureReads===9)h.mutate('/H/native-0');});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);
});
test('fixed synchronous inspection cannot return a truthy value, Promise, or thenable as an accepted observation',()=>{
 for(const result of [true,{},Promise.resolve(),{get then(){throw Error('MUST_NOT_READ');}}]){const h=harness();assert.throws(()=>h.observe(h.native,()=>result));assert.equal(h.nativeRecord.invalid,undefined);assert.equal(h.handles.size,0);}
});
test('async/generator/invalid inspection is rejected before full reads or callback execution',()=>{
 for(const callback of [async()=>{},function*(){},null,{},()=>{}]){const h=harness();if(typeof callback==='function'&&Object.getPrototypeOf(callback)===Function.prototype){assert.throws(()=>h.observe(h.native,callback,'extra'));}else assert.throws(()=>h.observe(h.native,callback));assert.equal(h.state.reads.length,0);}
});
test('escaping barrier has no continuing authority after synchronous return or thrown inspection',()=>{
 for(const throwing of [false,true]){const h=harness();let saved;const perform=()=>h.observe(h.native,barrier=>{saved=barrier;if(throwing)throw Error('SYNTHETIC_INSPECTION_FAILURE');});if(throwing)assert.throws(perform);else assert.equal(perform(),undefined);
  const old=h.state.fixtureReads;assert.throws(()=>saved());assert.equal(h.state.fixtureReads,old);assert.equal(h.nativeRecord.invalid,undefined);assert.equal(h.verify(h.native).outcome,'ASSETS_BUILD_CURRENTLY_OBSERVED');}
});
test('same-build reentry poisons the enclosing composition even when the inner exception is caught',()=>{
 const h=harness();assert.throws(()=>h.observe(h.native,()=>{assert.throws(()=>h.observe(h.native,()=>{}));}));assert.equal(h.nativeRecord.invalid,undefined);assert.equal(h.verify(h.native).outcome,'ASSETS_BUILD_CURRENTLY_OBSERVED');
});
test('mismatched or copied native mint cannot run inspection or borrow another observation',()=>{
 const h=harness();let called=0;for(const value of [{},JSON.parse(JSON.stringify(h.native)),h.exchange])assert.throws(()=>h.observe(value,()=>{called++;}));assert.equal(called,0);assert.equal(h.state.reads.length,0);
});
test('metadata failure during inspection permanently invalidates only the relevant native mint',()=>{
 const h=harness();assert.throws(()=>h.observe(h.native,barrier=>{h.mutate('/H/native-1');barrier();}));assert.equal(h.nativeRecord.invalid,true);const reads=h.state.reads.length;assert.throws(()=>h.observe(h.native,()=>{}));assert.equal(h.state.reads.length,reads);assert.equal(h.handles.size,0);
});
for(const unrelated of [false,true])test('held-stable full-reference decision agrees, including unrelated file membership '+unrelated,()=>{
 const optimized=harness(),full=harness();if(unrelated){for(const h of [optimized,full])h.nodes.set('/README-unrelated',{...h.nodes.get('/H/native-0'),body:Buffer.from('unrelated')});}
 assert.deepEqual(optimized.exchangeVerify(optimized.exchange),full.referenceVerify(full.exchange));assert.equal(optimized.state.reads.length,12);assert.equal(full.state.reads.length,28);
});
for(const at of [0,1,2,3,4,5,6,7])test('each independently owned native row '+at+' requires real matching bytes at scope entry',()=>{
 const h=harness();h.nodes.get('/H/native-'+at).body[0]^=1;assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.nativeRecord.invalid,true);
});
for(const at of [0,3,7])test('read failure during native row '+at+' cannot invoke inspection and closes its own descriptor',()=>{
 const h=harness();let called=0;h.hook(file=>{if(file==='/H/native-'+at)throw Error('SYNTHETIC_IO_FAILURE');});assert.throws(()=>h.observe(h.native,()=>{called++;}));assert.equal(called,0);assert.equal(h.nativeRecord.invalid,true);assert.equal(h.handles.size,0);
});
test('a swallowed late-barrier failure still prevents completion and future mint revival',()=>{
 const h=harness();assert.throws(()=>h.observe(h.native,barrier=>{h.mutate('/H/native-2');assert.throws(barrier);}));assert.equal(h.nativeRecord.invalid,true);assert.equal(h.verify(h.native).outcome,'UNKNOWN');
});
test('exchange-owned exception does not falsely assert that a separately current native build changed',()=>{
 const h=harness();h.hook(file=>{if(file==='/H/exchange.c')throw Error('SYNTHETIC_EXCHANGE_FAILURE');});assert.equal(h.exchangeVerify(h.exchange).outcome,'UNKNOWN');assert.equal(h.exchangeRecord.invalid,true);assert.equal(h.nativeRecord.invalid,undefined);h.hook(()=>{});assert.equal(h.verify(h.native).outcome,'ASSETS_BUILD_CURRENTLY_OBSERVED');
});
test('metadata barriers do not claim content protection against hostile unchanged-metadata mutation',()=>{
 const h=harness();let at=0;h.hook(file=>{if(file.startsWith('/H/exchange')&&++at===1)h.nodes.get('/H/native-0').body[0]^=1;});
 // Deliberately violates the documented trusted/quiescent phase. This positive
 // data-only observation is NOT sealing; a later independent full hash rejects.
 assertCurrent(h.exchangeVerify(h.exchange));assert.equal(h.verify(h.native).outcome,'UNKNOWN');
});
test('independent full verifier failure caught inside inspection cannot restore enclosing observation',()=>{
 const h=harness();assert.throws(()=>h.observe(h.native,()=>{
  const row=h.nodes.get('/H/native-3'),old=Buffer.from(row.body);row.body[0]^=1;
  assert.equal(h.verify(h.native).outcome,'UNKNOWN');row.body=old;
 }));assert.equal(h.nativeRecord.invalid,true);assert.equal(h.verify(h.native).outcome,'UNKNOWN');assert.equal(h.handles.size,0);
});
