// Parent behavioral controls use only in-memory VM filesystem/profile/child mocks.
// They never invoke sandbox-exec, spawn a preparer, copy source files or execute a compiler.
// The canonical bridge fixes test VM realms only; real parent validation is unchanged.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {canonical} from '../src/portable-envelope.mjs';
import {PREPARATION_REASON_CODES,summarizePreparationMaterialization} from './acceptance/sealed-typescript-preparation-child.mjs';
const digest=v=>crypto.createHash('sha256').update(v).digest('hex');
function run(scenario={}){
 const manifest=scenario.manifest||[['a.ts','a'.repeat(64)]],source='/owned/source',parent='/owned/stage',node='/reviewed/node',file='/reviewed/child',stage=parent+'/redue-materialization-Ab12Cd';
 const tree={schema:1,interpretation:'redue-typescript-materialization-summary@2',root:stage,sourceManifestDigest:digest(canonical(manifest)),materializedManifestDigest:digest(canonical(manifest)),sourceAliasGroupsDigest:digest(canonical([])),sourceAliasGroupCount:0,sourceAliasEntryCount:0,fileCount:manifest.length,physicalDigest:'b'.repeat(64),bytes:1,identity:'1:21',sealed:false,reuseEligible:false};
 scenario.tree?.(tree);let spawned=0,clockAt=0,opts=null,invocation=null,after=false;
 const ino=new Map([[source,10],[parent,20],[node,30],[file,31],[stage,21]]);
 const mode=p=>p===stage&&scenario.stageFile?0o100600:p===stage&&scenario.stageWrongMode?0o40755:p===stage||p===parent?0o40700:p===node||p===file?0o100600:0o40755;
 const fakeFs={lstatSync:p=>({dev:1n,ino:BigInt(ino.get(p)||99)+((p===source&&scenario.sourceChanged||p===parent&&scenario.parentChanged||p===node&&scenario.nodeReplaced)&&after?1n:0n),mode:BigInt(mode(p)),uid:p===stage&&scenario.stageWrongOwner?502n:501n,isSymbolicLink:()=>false,isDirectory:()=>((mode(p)&0o170000)===0o40000)}),realpathSync:p=>p,readFileSync:p=>Buffer.from(p===node?(scenario.nodeChanged&&after?'MUTATED_NODE':'NODE'):scenario.codeChanged&&after?'MUTATED':'CODE')};
 const fakeCrypto=()=>{let bytes=Buffer.alloc(0);return{update(v){bytes=Buffer.concat([bytes,Buffer.from(v)]);return this;},digest(){return bytes.toString()==='NODE'?'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc':digest(bytes);}};};
 const profile={source,parent,node,child:file,profile:'FIXED_TEST_PROFILE',sha256:digest('profile'),code:[[file,digest('CODE')]]};
 const fakeSpawn=(exe,args,options)=>{spawned++;opts=options;invocation={exe,args};after=true;const output=scenario.refusal?{schema:3,ok:false,reason_code:scenario.reason||'TREE_DIGEST'}:{schema:3,ok:true,materialization:tree};
  return{pid:1234,status:scenario.refusal?74:0,signal:null,stderr:'',...scenario.child,stdout:scenario.stdout?.(output)||JSON.stringify(output)+'\n'};};
 const clock=()=>scenario.times?scenario.times[Math.min(clockAt++,scenario.times.length-1)]:0;
 let text=fs.readFileSync(new URL('./acceptance/sealed-typescript-preparation.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const ','const ').replaceAll('export function ','function ');
 text+='\nglobalThis.invoke=prepareSealedTypeScriptInputs;';
 const canonicalBridge=value=>canonical(JSON.parse(JSON.stringify(value)));
 const context=vm.createContext({fs:fakeFs,path,createHash:fakeCrypto,spawnSync:fakeSpawn,sealedPreparationProfile:()=>profile,canonical:canonicalBridge,PREPARATION_REASON_CODES,performance:{now:clock},process:{getuid:()=>501},Buffer});vm.runInContext(text,context);
 context.input=JSON.stringify({source,parent,manifest});let value,error;try{value=vm.runInContext('invoke(JSON.parse(input))',context);}catch(e){error=e.code;}
 return {value,error,spawned,opts,invocation};
}

test('compact success is immutable data only with empty env and fixed kill',()=>{const r=run();assert.equal(r.value.outcome,'MATERIALIZED_NOT_SEALED');for(const key of ['sealed','executable','reuseEligible'])assert.equal(r.value[key],false);assert(Object.isFrozen(r.value.materialization));assert.equal(r.opts.killSignal,'SIGKILL');assert.deepEqual(Object.keys(r.opts.env),[]);assert.equal(r.invocation.exe,'/usr/bin/sandbox-exec');assert.deepEqual(Array.from(r.invocation.args),['-p','FIXED_TEST_PROFILE','/reviewed/node','/reviewed/child']);});
test('summary rejects changed schema/digest/count/physical shape/flags/extra and full old arrays',()=>{for(const patch of [{schema:2},{interpretation:'redue-typescript-materialization@1'},{sourceManifestDigest:'b'.repeat(64)},{materializedManifestDigest:'b'.repeat(64)},{sourceAliasGroupCount:1},{sourceAliasEntryCount:1},{sourceAliasGroupsDigest:'b'.repeat(64)},{manifestDigest:'a'.repeat(64)},{fileCount:2},{fileCount:'1'},{physicalDigest:'x'},{sealed:true},{reuseEligible:true},{files:[]},{physical:[]}])assert.equal(run({tree:t=>Object.assign(t,patch)}).value.outcome,'UNKNOWN');});
test('actual stage type and reported identity still require matching owned directory',()=>{for(const scenario of [{stageFile:true},{stageWrongMode:true},{stageWrongOwner:true}])assert.equal(run(scenario).value.outcome,'UNKNOWN');assert.equal(run({tree:t=>t.identity='1:99'}).value.outcome,'UNKNOWN');});
test('physical digest is bounded audit only and cannot make result sealed',()=>{const r=run({tree:t=>t.physicalDigest='c'.repeat(64)});assert.equal(r.value.outcome,'MATERIALIZED_NOT_SEALED');assert.equal(r.value.sealed,false);assert.equal(r.value.reuseEligible,false);});
test('finite refusal preserves exit74; old schema and invented enum refuse',()=>{assert.equal(run({refusal:true}).value.outcome,'REFUSED');assert.equal(run({refusal:true,reason:'TREE_PRIVATE_CANARY'}).value.outcome,'UNKNOWN');assert.equal(run({refusal:true,stdout:o=>JSON.stringify({...o,schema:1})+'\n'}).value.outcome,'UNKNOWN');});
test('retired protocol and interpretation cannot be admitted after source alias identity changes',()=>{
 for(const schema of [1,2,4])assert.equal(run({stdout:o=>JSON.stringify({...o,schema})+'\n'}).value.outcome,'UNKNOWN');
 assert.equal(run({tree:t=>t.interpretation='redue-typescript-materialization-summary@1'}).value.outcome,'UNKNOWN');
 assert.equal(run({refusal:true,stdout:o=>JSON.stringify({...o,schema:2})+'\n'}).value.outcome,'UNKNOWN');
});
test('source alias audit is bounded and separate from materialized or reusable authority',()=>{
 const manifest=[['node_modules/a','a'.repeat(64)],['node_modules/b','b'.repeat(64)]];
 const tree=t=>Object.assign(t,{sourceAliasGroupCount:1,sourceAliasEntryCount:2,
   sourceAliasGroupsDigest:digest(canonical([manifest.map(([name])=>name)])),materializedManifestDigest:'c'.repeat(64)});
 const good=run({manifest,tree});assert.equal(good.value.outcome,'MATERIALIZED_NOT_SEALED');
 assert.notEqual(good.value.materialization.sourceManifestDigest,good.value.materialization.materializedManifestDigest);
 assert.equal(good.value.reuseEligible,false);
 for(const patch of [{sourceAliasGroupCount:2},{sourceAliasGroupCount:-1},{sourceAliasGroupCount:0.5},
   {sourceAliasEntryCount:1},{sourceAliasEntryCount:3},{sourceAliasEntryCount:'2'},
   {sourceAliasGroupsDigest:'invalid'},{sourceAliasGroups:[]}])
   assert.equal(run({manifest,tree:t=>{tree(t);Object.assign(t,patch);}}).value.outcome,'UNKNOWN');
});
test('current source parent runtime and code binding remains mandatory',()=>{for(const scenario of [{sourceChanged:true},{parentChanged:true},{nodeChanged:true},{nodeReplaced:true},{codeChanged:true}])assert.equal(run(scenario).value.reason,'PREPARATION_BINDING_CHANGED');});
test('duplicate keys and multiple frames refuse',()=>{for(const stdout of [o=>JSON.stringify(o)+'\n{}\n',o=>JSON.stringify(o).replace('"ok":true','"ok":false,"ok":true')+'\n'])assert.equal(run({stdout}).value.outcome,'UNKNOWN');});
test('invalid/reversing/exhausted clock launches zero; final deadline drops data',()=>{for(const times of [[0,NaN],[0,Infinity],[0,100,50],[0,120000]])assert.equal(run({times}).spawned,0);for(const times of [[0,0,0,0,0,119999,120001],[0,0,0,0,0,0,119999,120001]]){const r=run({times});assert.equal(r.value.outcome,'UNKNOWN');assert.equal(r.value.materialization,undefined);assert.equal(r.value.elapsedMs,null);}});
test('signal observation remains precise and private unknown signals withheld',()=>{for(const signal of ['SIGIOT','SIGSYS','SIGHUP'])assert.equal(run({child:{status:null,signal}}).value.childReaped,true);const r=run({child:{status:null,signal:'PRIVATE_CANARY'}});assert.equal(r.value.childReaped,false);assert.equal(r.value.childSignal,'UNKNOWN_SIGNAL');assert(!JSON.stringify(r.value).includes('PRIVATE_CANARY'));});
test('large mock leaf yields a small schema3 summary without exposing physical rows',async()=>{
 const text=fs.readFileSync(new URL('./acceptance/sealed-typescript-preparation-child.mjs',import.meta.url),'utf8');
 const main=text.slice(text.indexOf('async function main()'),text.lastIndexOf('if(process.argv[1]'));
 const physical=Array.from({length:33345},(_,i)=>['node_modules/NONSECRET-'+i,'1:'+i,'1:'+i+':33152:501:1:1:1:1']);
 const materialization={root:'/owned/stage/redue-materialization-Ab12Cd',sourceManifestDigest:'a'.repeat(64),materializedManifestDigest:'a'.repeat(64),sourceAliasGroups:[],sourceAliasGroupsDigest:digest(canonical([])),sourceFiles:physical.map(row=>[row[0],'b'.repeat(64)]),materializedFiles:physical.map(row=>[row[0],'b'.repeat(64)]),physical,bytes:123,identity:'1:21',sealed:false,reuseEligible:false};
 let output='';const proc={argv:['node','fixed-child'],stdin:{},stdout:{on(){},write(value,cb){output+=value;cb();}},exitCode:null};
 const context=vm.createContext({process:proc,Buffer,PREPARATION_BYTES:8*1024*1024,consumePreparationInput:async()=>Buffer.from('{}'),parsePreparationInput:()=>({}),materializeSealedTypeScriptTree:()=>materialization,summarizePreparationMaterialization,safeCode:e=>e.code,fail:code=>{throw{code};}});
 await vm.runInContext(main+';main()',context);const value=JSON.parse(output);
 assert.equal(proc.exitCode,0);assert.equal(value.schema,3);assert.equal(value.materialization.fileCount,33345);assert.equal(value.materialization.physicalDigest,digest(JSON.stringify(physical)));assert.equal(value.materialization.sealed,false);assert.equal(value.materialization.reuseEligible,false);assert(Buffer.byteLength(output)<1024);assert(!output.includes('NONSECRET'));assert(!Object.hasOwn(value.materialization,'physical'));assert(!Object.hasOwn(value.materialization,'sourceFiles'));assert(!Object.hasOwn(value.materialization,'materializedFiles'));assert.equal(value.materialization.sourceAliasGroupCount,0);assert.equal(value.materialization.sourceAliasEntryCount,0);
});
