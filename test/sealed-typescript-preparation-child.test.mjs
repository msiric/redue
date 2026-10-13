import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHash} from 'node:crypto';import test from 'node:test';import assert from 'node:assert/strict';import {Readable} from 'node:stream';import {spawn,spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {parsePreparationInput,consumePreparationInput,PREPARATION_BYTES,summarizePreparationMaterialization} from './acceptance/sealed-typescript-preparation-child.mjs';
const child=fileURLToPath(new URL('./acceptance/sealed-typescript-preparation-child.mjs',import.meta.url));
const bytes=value=>Buffer.from(value),valid='{"root":"/owned/project","manifest":[["a.ts","'+'a'.repeat(64)+'"]],"parent":"/owned/private"}';
test('restricted grammar parses exactly three known fields and string pairs',()=>{const parsed=parsePreparationInput(bytes(valid));assert.equal(Object.getPrototypeOf(parsed),null);assert.deepEqual({...parsed},{root:'/owned/project',manifest:[['a.ts','a'.repeat(64)]],parent:'/owned/private'});
  const alternate=JSON.stringify({parent:'/p',manifest:[],root:'/r'});assert.deepEqual({...parsePreparationInput(bytes(alternate))},{parent:'/p',manifest:[],root:'/r'});
});
for(const [name,value] of [
  ['duplicate key','{"root":"/r","root":"/other","parent":"/p","manifest":[]}'],
  ['escaped duplicate key','{"root":"/r","r\\u006fot":"/other","parent":"/p","manifest":[]}'],
  ['unknown key','{"root":"/r","parent":"/p","manifest":[],"command":"node"}'],
  ['missing key','{"root":"/r","parent":"/p"}'],['top array','[]'],['nested object','{"root":{},"parent":"/p","manifest":[]}'],
  ['number root','{"root":0,"parent":"/p","manifest":[]}'],['boolean root','{"root":true,"parent":"/p","manifest":[]}'],
  ['non-pair','{"root":"/r","parent":"/p","manifest":[["a"]]}'],['extra pair value','{"root":"/r","parent":"/p","manifest":[["a","b","c"]]}'],
  ['malformed escape','{"root":"\\x","parent":"/p","manifest":[]}'],['trailing bytes',valid+' true'],['trailing comma','{"root":"/r","parent":"/p","manifest":[],}'],
  ['unpaired surrogate','{"root":"\\ud800","parent":"/p","manifest":[]}'],['overlong root','{"root":"/'+'a'.repeat(4096)+'","parent":"/p","manifest":[]}'],
])test(`preparation schema refuses ${name} before materialization`,()=>assert.throws(()=>parsePreparationInput(bytes(value)),{code:'PREPARATION_SCHEMA'}));
test('UTF8/BOM and byte limits fail closed',()=>{assert.throws(()=>parsePreparationInput(Buffer.from([0xff])),{code:'PREPARATION_INPUT'});assert.throws(()=>parsePreparationInput(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),bytes(valid)])),{code:'PREPARATION_SCHEMA'});assert.throws(()=>parsePreparationInput(Buffer.alloc(PREPARATION_BYTES+1)),{code:'PREPARATION_INPUT_SIZE'});});
test('fixed consumer completes EOF before returning even a syntactically complete prefix',async()=>{const stream=new Readable({read(){}});let completed=false;const pending=consumePreparationInput(stream).then(value=>{completed=true;return value;});stream.push(bytes(valid));await new Promise(resolve=>setImmediate(resolve));assert.equal(completed,false);stream.push(null);assert.equal((await pending).toString(),valid);});
test('oversize and interrupted consumers produce static input reasons',async()=>{await assert.rejects(()=>consumePreparationInput(Readable.from([Buffer.alloc(PREPARATION_BYTES),Buffer.from('x')])),{code:'PREPARATION_INPUT_SIZE'});const stream=new Readable({read(){}}),pending=consumePreparationInput(stream);stream.destroy(Error('/PRIVATE/NONSECRET-CANARY'));await assert.rejects(()=>pending,{code:'PREPARATION_INPUT'});});
const invoke=(input,args=[])=>spawnSync(process.execPath,[child,...args],{input,encoding:'utf8',timeout:5000,maxBuffer:PREPARATION_BYTES+1024});
test('harmless child rejects argv/malformed/oversize data with no raw stderr',()=>{for(const [input,args,code] of [['{}',['--execute'],'PREPARATION_ARGUMENTS'],['{"private":"NONSECRET-CANARY"}',[],'PREPARATION_SCHEMA'],[Buffer.alloc(PREPARATION_BYTES+1),[],'PREPARATION_INPUT_SIZE']]){
  const result=invoke(input,args);assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,74);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{schema:3,ok:false,reason_code:code});assert(!result.stdout.includes('NONSECRET-CANARY'));
}});
test('leaf refusal is sanitized and performs no setup for an empty manifest',()=>{const result=invoke('{"root":"/NONSECRET-CANARY","parent":"/NEVER-CREATED","manifest":[]}');assert.equal(result.status,74);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{schema:3,ok:false,reason_code:'TREE_MANIFEST'});});
test('partial-input child emits no result; caller cancellation yields no preparation result',async()=>{const processChild=spawn(process.execPath,[child],{stdio:['pipe','pipe','pipe']});let stdout='',stderr='';processChild.stdout.on('data',value=>stdout+=value);processChild.stderr.on('data',value=>stderr+=value);processChild.stdin.on('error',()=>{});
  const closed=new Promise((resolve,reject)=>{processChild.once('error',reject);processChild.once('close',(code,signal)=>resolve({code,signal}));});processChild.stdin.write(valid);
  try{await new Promise(resolve=>setTimeout(resolve,100));assert.equal(stdout,'');assert.equal(stderr,'');assert.equal(processChild.kill('SIGTERM'),true);assert.deepEqual(await closed,{code:null,signal:'SIGTERM'});assert.equal(stdout,'');assert.equal(stderr,'');}finally{if(processChild.exitCode===null&&processChild.signalCode===null)processChild.kill('SIGKILL');}
});

const digest=value=>createHash('sha256').update(value).digest('hex');
function localFullFixture(count=3){return Object.freeze({schema:1,interpretation:'redue-typescript-materialization@2',root:'/owned/stage',
  sourceManifestDigest:'1'.repeat(64),materializedManifestDigest:'2'.repeat(64),sourceAliasGroupsDigest:'3'.repeat(64),
  sourceFiles:Array.from({length:count},(_,at)=>[`node_modules/pkg/file-${at}`,'4'.repeat(64)]),
  materializedFiles:Array.from({length:count},(_,at)=>[`node_modules/pkg/file-${at}`,'5'.repeat(64)]),
  sourceAliasGroups:count>=2?[['node_modules/pkg/file-0','node_modules/pkg/file-1']]:[],
  physical:Array.from({length:count},(_,at)=>[`node_modules/pkg/file-${at}`,`7:${at+8}`,`7:${at+8}:33188:501:1:20:100:200`]),
  bytes:count*20,identity:'7:8',sealed:false,reuseEligible:false});}
test('summary@2 separates source/materialized identities and exactly counts logical aliases',()=>{
  const full=localFullFixture(),summary=summarizePreparationMaterialization(full);
  assert.deepEqual(summary,{schema:1,interpretation:'redue-typescript-materialization-summary@2',root:'/owned/stage',
    sourceManifestDigest:'1'.repeat(64),materializedManifestDigest:'2'.repeat(64),fileCount:3,
    physicalDigest:digest(JSON.stringify(full.physical)),sourceAliasGroupsDigest:'3'.repeat(64),sourceAliasGroupCount:1,
    sourceAliasEntryCount:2,bytes:60,identity:'7:8',sealed:false,reuseEligible:false});
  for(const field of ['files','sourceFiles','materializedFiles','physical','sourceAliasGroups','manifestDigest'])assert(!Object.hasOwn(summary,field));
});
test('summary alias counts distinguish no aliases and multiple complete logical groups',()=>{
  const full=localFullFixture(8);assert.deepEqual([summarizePreparationMaterialization({...full,sourceAliasGroups:[]}).sourceAliasGroupCount,summarizePreparationMaterialization({...full,sourceAliasGroups:[]}).sourceAliasEntryCount],[0,0]);
  const summary=summarizePreparationMaterialization({...full,sourceAliasGroups:[['a','b'],['c','d','e']]});assert.equal(summary.sourceAliasGroupCount,2);assert.equal(summary.sourceAliasEntryCount,5);
});
test('33,345-row local result produces bounded compact audit output without source path arrays',()=>{
  const full=localFullFixture(33345),summary=summarizePreparationMaterialization(full),encoded=JSON.stringify({schema:3,ok:true,materialization:summary});
  assert.equal(summary.fileCount,33345);assert.equal(summary.physicalDigest,digest(JSON.stringify(full.physical)));assert.equal(summary.sourceAliasEntryCount,2);
  assert(Buffer.byteLength(encoded)<PREPARATION_BYTES);assert(Buffer.byteLength(encoded)<2048);assert(!encoded.includes('node_modules/pkg/file-'));
  assert.equal(summary.sealed,false);assert.equal(summary.reuseEligible,false);
});

const dirs=[['',[['a.ts','file'],['empty','directory']]],['empty',[]]];
const directoryData={schema:1,interpretation:'redue-typescript-directory-inventory@1',directories:dirs,
 digest:digest(JSON.stringify({directories:dirs,interpretation:'redue-typescript-directory-inventory@1'})),directoryCount:2,entryCount:2};
const fullInput=JSON.stringify({...JSON.parse(valid),directoryInventory:directoryData});
test('restricted grammar admits explicit bounded directory data without reinterpreting legacy three-field requests',()=>{
 const parsed=parsePreparationInput(bytes(fullInput));assert.deepEqual(parsed.directoryInventory,directoryData);assert(Object.isFrozen(parsed.directoryInventory));assert(!Object.hasOwn(parsePreparationInput(bytes(valid)),'directoryInventory'));
});
test('directory grammar rejects duplicate/unknown/nonnumeric/contradictory topology and malformed rows',()=>{
 const raw=JSON.stringify(directoryData),wrap=inventory=>valid.slice(0,-1)+',"directoryInventory":'+inventory+'}';
 for(const value of [raw.replace('"schema":1','"schema":1,"schema":1'),raw.replace('"schema":1','"schema":1,"trust":true'),
  raw.replace('"entryCount":2','"entryCount":2.0'),raw.replace('"entryCount":2','"entryCount":-2'),raw.replace('"entryCount":2','"entryCount":2e0'),raw.replace('"entryCount":2','"entryCount":"2"'),
  raw.replace('"directoryCount":2','"directoryCount":1'),raw.replace('"file"','"pipe"'),raw.replace('"directories":','"unknown":'),raw.replace('"a.ts","file"','"a.ts","file","extra"'),raw.replace('"empty",[]','"empty",[{}]'),raw.replace('"schema":1,',''),raw.replace('"empty","directory"','"empty","file"')])
  assert.throws(()=>parsePreparationInput(bytes(wrap(value))),{code:'PREPARATION_SCHEMA'});
 assert.throws(()=>parsePreparationInput(bytes(fullInput.slice(0,-1)+',"directoryInventory":'+raw+'}')),{code:'PREPARATION_SCHEMA'});
});
test('summary@3 binds compact directory identities and omits raw inventory arrays',()=>{
 const full={...localFullFixture(),interpretation:'redue-typescript-materialization@3',sourceDirectoryInventoryDigest:'a'.repeat(64),materializedDirectoryInventoryDigest:'a'.repeat(64),directoryCount:2,directoryEntryCount:2,sourceDirectories:dirs,materializedDirectories:dirs};
 const summary=summarizePreparationMaterialization(full);assert.equal(summary.interpretation,'redue-typescript-materialization-summary@3');assert.equal(summary.sourceDirectoryInventoryDigest,'a'.repeat(64));assert.equal(summary.materializedDirectoryInventoryDigest,'a'.repeat(64));assert.equal(summary.directoryCount,2);assert.equal(summary.directoryEntryCount,2);
 for(const field of ['directories','sourceDirectories','materializedDirectories','sourceFiles','physical'])assert(!Object.hasOwn(summary,field));assert.equal(summary.sealed,false);assert.equal(summary.reuseEligible,false);
});

// Harmless owned-local materialization through the actual fixed child. No native
// sandbox/TypeScript/model execution and no claim of preparer confinement here.
test('actual explicit directory child preserves empty membership and publishes only schema4 compact data',t=>{
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-directory-child-'))),root=path.join(base,'source'),parent=path.join(base,'stage');t.after(()=>fs.rmSync(base,{recursive:true,force:true}));fs.mkdirSync(root);fs.mkdirSync(parent,{mode:0o700});fs.mkdirSync(path.join(root,'empty'));fs.writeFileSync(path.join(root,'a.ts'),'NONSECRET compiler-free input');
 const stat=fs.lstatSync(path.join(root,'a.ts'),{bigint:true}),manifest=[['a.ts',digest(`file:${stat.mode}:${digest(fs.readFileSync(path.join(root,'a.ts')))}`)]],childDirs=[['',[['a.ts','file'],['empty','directory']]],['empty',[]]],directoryInventory={schema:1,interpretation:'redue-typescript-directory-inventory@1',directories:childDirs,digest:digest(JSON.stringify({directories:childDirs,interpretation:'redue-typescript-directory-inventory@1'})),directoryCount:2,entryCount:2};
 const result=invoke(JSON.stringify({root,parent,manifest,directoryInventory}));assert.equal(result.status,0);assert.equal(result.signal,null);assert.equal(result.stderr,'');const output=JSON.parse(result.stdout);assert.equal(output.schema,4);assert.equal(output.ok,true);const summary=output.materialization;assert.equal(summary.interpretation,'redue-typescript-materialization-summary@3');assert.equal(summary.sourceDirectoryInventoryDigest,directoryInventory.digest);assert.equal(summary.materializedDirectoryInventoryDigest,directoryInventory.digest);assert.equal(summary.directoryCount,2);assert.equal(summary.directoryEntryCount,2);assert(fs.statSync(path.join(summary.root,'empty')).isDirectory());assert.equal(summary.sealed,false);assert.equal(summary.reuseEligible,false);assert(!Object.hasOwn(summary,'sourceDirectories'));
});
test('actual child refuses incomplete full-root coverage with schema4 before stage creation',t=>{
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-directory-child-'))),root=path.join(base,'source'),parent=path.join(base,'stage');t.after(()=>fs.rmSync(base,{recursive:true,force:true}));fs.mkdirSync(root);fs.mkdirSync(parent,{mode:0o700});fs.writeFileSync(path.join(root,'a.ts'),'NONSECRET');fs.writeFileSync(path.join(root,'omitted'),'NONSECRET omitted');
 const stat=fs.lstatSync(path.join(root,'a.ts'),{bigint:true}),manifest=[['a.ts',digest(`file:${stat.mode}:${digest('NONSECRET')}`)]],childDirs=[['',[['a.ts','file'],['omitted','file']]]],directoryInventory={schema:1,interpretation:'redue-typescript-directory-inventory@1',directories:childDirs,digest:digest(JSON.stringify({directories:childDirs,interpretation:'redue-typescript-directory-inventory@1'})),directoryCount:1,entryCount:2};
 const result=invoke(JSON.stringify({root,parent,manifest,directoryInventory}));assert.equal(result.status,74);assert.equal(result.signal,null);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{schema:4,ok:false,reason_code:'TREE_DIRECTORY_COVERAGE'});assert.deepEqual(fs.readdirSync(parent),[]);
});
