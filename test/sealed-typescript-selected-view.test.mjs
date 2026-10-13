// Owned harmless local data, not actual debugger/compiler/native/model evidence.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {canonical} from '../src/portable-envelope.mjs';import {InputIndex} from '../src/index.mjs';
import {sealedTypeScriptManifest,prepareSealedTypeScriptSelectedView} from '../src/sealed-typescript-manifest.mjs';
import {SEALED_TYPESCRIPT_SELECTION,captureSealedTypeScriptSelection,bindSealedTypeScriptSelection,invalidateSealedTypeScriptSelection,checkSealedTypeScriptSelectionInput,materializeSealedTypeScriptSelectedView} from '../src/sealed-typescript-tree.mjs';
const patterns=()=>[...SEALED_TYPESCRIPT_SELECTION.sourcePatterns];
function fixture(){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-selected-view-'))),root=path.join(base,'source'),parent=path.join(base,'stage');fs.mkdirSync(root);fs.mkdirSync(parent,{mode:0o700});
 const put=(rel,body='NONSECRET harmless bytes')=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);return file;};
 put('package.json','{"scripts":{"typecheck":"tsc --noEmit"}}');put('package-lock.json','{}');put('tsconfig.json','{}');put('src/a.ts','export const a=1;');put('node_modules/example/lib.d.ts','declare const value:number;');put('unselected.txt');
 return{base,root,parent,put,options:()=>({root,parent,sourcePatterns:patterns()}),remove:()=>fs.rmSync(base,{recursive:true,force:true})};}
const withFixture=fn=>{const f=fixture();try{return fn(f);}finally{f.remove();}};
const patch=(key,replace,fn)=>{const original=fs[key];fs[key]=replace(original);try{return fn();}finally{fs[key]=original;}};
function legacy(f){const index=new InputIndex({root:f.root,plans:{preparation:{id:SEALED_TYPESCRIPT_SELECTION.planId,patterns:patterns(),sourcePatterns:patterns(),additivePatterns:['node_modules/**']}}},{trackGit:false,includeInstalled:true});index.coldScan();assert.equal(index.unavailable,null);return sealedTypeScriptManifest(f.root,Object.fromEntries(index.files));}
test('metadata-first fixed selection is equivalent to the retained coldScan selector on controlled nonGit data',()=>withFixture(f=>{
 f.put('src/extra.tsx');f.put('declarations/generated.d.ts');f.put('node_modules/other/data.dat');const expected=legacy(f),result=prepareSealedTypeScriptSelectedView(f.options());assert.deepEqual(result.sourceFiles,expected);assert.equal(result.interpretation,'redue-typescript-selected-prepared-view@1');assert.equal(result.stageDirectoryInventory.interpretation,'redue-typescript-directory-inventory@1');
 assert(!fs.existsSync(path.join(result.root,'unselected.txt')));for(const flag of ['sourceNamespaceEquivalent','nativeViewVerified','sealed','reuseEligible'])assert.equal(result[flag],false);assert(Object.isFrozen(result.stageDirectoryInventory));
}));
test('only actual staged ancestors exist; unselected empty source directories are not claimed equivalent',()=>withFixture(f=>{
 fs.mkdirSync(path.join(f.root,'empty/nested'),{recursive:true});const result=prepareSealedTypeScriptSelectedView(f.options());assert(!fs.existsSync(path.join(result.root,'empty')));assert(result.stageDirectoryInventory.directories.some(([rel])=>rel==='src'));assert.equal(result.sourceNamespaceEquivalent,false);
}));
test('fixed Git omission never opens Git or unselected bodies, including case variants',()=>withFixture(f=>{
 for(const name of ['.git','.Git','.GIT'])f.put(name+'/config.json','NONSECRET synthetic Git canary');let forbidden=0;
 patch('openSync',original=>(file,...args)=>{if(typeof file==='string'&&(file.startsWith(f.root+'/.git/')||file.startsWith(f.root+'/.Git/')||file.startsWith(f.root+'/.GIT/')||file===path.join(f.root,'unselected.txt')))forbidden++;return original(file,...args);},()=>{
  const result=prepareSealedTypeScriptSelectedView(f.options());assert(!result.sourceFiles.some(([rel])=>rel.toLowerCase().startsWith('.git/')));assert(!result.stageDirectoryInventory.directories.some(([rel])=>rel.toLowerCase().startsWith('.git')));
 });assert.equal(forbidden,0);
}));
test('unselected stable body edit during selection does not change the prepared view',()=>withFixture(f=>{
 const expected=legacy(f);let changed=false;patch('openSync',original=>(file,...args)=>{if(!changed&&file===path.join(f.root,'src/a.ts')){changed=true;fs.appendFileSync(path.join(f.root,'unselected.txt'),' changed unconsumed body');}return original(file,...args);},()=>{const result=prepareSealedTypeScriptSelectedView(f.options());assert.deepEqual(result.sourceFiles,expected);});assert(changed);
}));
for(const kind of ['source','declaration','installed-lib','resolution-candidate'])test(`new matching ${kind} during selection is refused before stage creation`,()=>withFixture(f=>{
 let changed=false;patch('openSync',original=>(file,...args)=>{if(!changed&&file===path.join(f.root,'src/a.ts')){changed=true;f.put(kind==='source'?'src/new.ts':kind==='declaration'?'generated.d.ts':kind==='installed-lib'?'node_modules/example/new.d.ts':'node_modules/new-package/package.json');}return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),error=>['TREE_SELECTION_CHANGED','TREE_DIRECTORY_CHANGED'].includes(error.code)));assert(changed);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
for(const kind of ['rename','remove','restore'])test(`${kind} source membership during copying is refused and partial stage retained`,()=>withFixture(f=>{
 let changed=false;patch('writeSync',original=>(...args)=>{const n=original(...args);if(!changed){changed=true;const a=path.join(f.root,'src/a.ts');if(kind==='rename')fs.renameSync(a,path.join(f.root,'src/b.ts'));if(kind==='remove')fs.unlinkSync(a);if(kind==='restore'){f.put('src/transient.ts');fs.unlinkSync(path.join(f.root,'src/transient.ts'));}}return n;},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),error=>['TREE_SELECTION_CHANGED','TREE_CHANGED','TREE_UNAVAILABLE'].includes(error.code)));assert(changed);assert.equal(fs.readdirSync(f.parent).length,1);
}));
test('selected source body change-and-restore after initial metadata is not a continuing selection proof',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=capture.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');const body=fs.readFileSync(path.join(f.root,'src/a.ts'));fs.writeFileSync(path.join(f.root,'src/a.ts'),'changed');fs.writeFileSync(path.join(f.root,'src/a.ts'),body);assert.throws(()=>bindSealedTypeScriptSelection(capture,names),{code:'TREE_SELECTION_CHANGED'});assert.throws(()=>bindSealedTypeScriptSelection(capture,names),{code:'TREE_SELECTION_OPTIONS'});
}));
test('unsupported source alias and incomplete hardlink group refuse before any aliased body read',()=>withFixture(f=>{
 const target=path.join(f.base,'outside-canary');fs.writeFileSync(target,'NONSECRET');fs.symlinkSync(target,path.join(f.root,'alias.ts'));let bodies=0;
 patch('openSync',original=>(file,...args)=>{if(file===path.join(f.root,'alias.ts')||file===target)bodies++;return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options())));assert.equal(bodies,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
 fs.unlinkSync(path.join(f.root,'alias.ts'));fs.linkSync(path.join(f.root,'src/a.ts'),target+'.link');patch('openSync',original=>(file,...args)=>{bodies++;return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),{code:'TREE_FILE'}));assert.equal(bodies,0);
}));
test('complete installed hardlinks and canonical nested npm shims retain existing representations',()=>withFixture(f=>{
 f.put('node_modules/pkg/cli.js');fs.linkSync(path.join(f.root,'node_modules/pkg/cli.js'),path.join(f.root,'node_modules/pkg/other.js'));fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.symlinkSync('../pkg/cli.js',path.join(f.root,'node_modules/.bin/tool'));
 const expected=legacy(f),result=prepareSealedTypeScriptSelectedView(f.options());assert.deepEqual(result.sourceFiles,expected);assert.equal(fs.readlinkSync(path.join(result.root,'node_modules/.bin/tool')),'../pkg/cli.js');assert.deepEqual(result.sourceAliasGroups,[['node_modules/pkg/cli.js','node_modules/pkg/other.js']]);
}));
test('a canonical-looking npm shim into omitted Git is rejected before target body hashing',()=>withFixture(f=>{
 f.put('node_modules/pkg/.Git/cli.js','NONSECRET');fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.symlinkSync('../pkg/.Git/cli.js',path.join(f.root,'node_modules/.bin/tool'));let bodies=0;patch('openSync',original=>(file,...args)=>{if(typeof file==='string'&&file.includes('/.Git/'))bodies++;return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),{code:'TREE_SYMLINK'}));assert.equal(bodies,0);
}));
test('serialized captures, changed names, unknown selectors and getters never provide preparation authority',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent});let accesses=0;patch('lstatSync',original=>(...args)=>{accesses++;return original(...args);},()=>{
  assert.throws(()=>bindSealedTypeScriptSelection(JSON.parse(JSON.stringify(capture)),['src/a.ts']),{code:'TREE_SELECTION_OPTIONS'});
  assert.throws(()=>materializeSealedTypeScriptSelectedView({...capture},[]),{code:'TREE_SELECTION_OPTIONS'});
 });assert.equal(accesses,0);let getters=0;const options={parent:f.parent,sourcePatterns:patterns()};Object.defineProperty(options,'root',{get(){getters++;return f.root;}});assert.throws(()=>prepareSealedTypeScriptSelectedView(options),{code:'TREE_SELECTION_OPTIONS'});assert.equal(getters,0);
 for(const extra of [['!src/**'],['.git/**']])assert.throws(()=>prepareSealedTypeScriptSelectedView({...f.options(),sourcePatterns:[...patterns(),...extra]}),{code:'TREE_SELECTION_UNSUPPORTED'});
 const supplied=patterns();Object.defineProperty(supplied,Symbol.iterator,{value(){getters++;throw Error('NO_CALLER_ITERATOR');}});assert.throws(()=>prepareSealedTypeScriptSelectedView({...f.options(),sourcePatterns:supplied}),{code:'TREE_SELECTION_UNSUPPORTED'});assert.equal(getters,0);
}));
test('per-input guard refuses a late alias before InputIndex can open its body',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=capture.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');bindSealedTypeScriptSelection(capture,names);fs.unlinkSync(path.join(f.root,'src/a.ts'));fs.symlinkSync(path.join(f.root,'unselected.txt'),path.join(f.root,'src/a.ts'));
 assert.throws(()=>checkSealedTypeScriptSelectionInput(capture,'src/a.ts'),{code:'TREE_CHANGED'});assert.throws(()=>checkSealedTypeScriptSelectionInput(capture,'src/a.ts'),{code:'TREE_SELECTION_OPTIONS'});
}));
test('stage membership addition during closing source scan cannot publish a selected view',()=>withFixture(f=>{
 let staged=false,changed=false;patch('opendirSync',original=>(file,...args)=>{if(typeof file==='string'&&file.startsWith(f.parent+'/redue-materialization-'))staged=true;
  if(staged&&!changed&&file===f.root){changed=true;const stage=path.join(f.parent,fs.readdirSync(f.parent)[0]);fs.mkdirSync(path.join(stage,'late-empty'));}return original(file,...args);
 },()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),error=>['TREE_CHANGED','TREE_SELECTION_CHANGED','TREE_DIRECTORY_CHANGED'].includes(error.code)));assert(changed);
}));
test('capture rejects unsafe source/parent ownership and permission denial without body work',()=>withFixture(f=>{
 let calls=0;patch('openSync',original=>(...args)=>{calls++;return original(...args);},()=>{
  fs.chmodSync(f.parent,0o755);assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),{code:'TREE_OWNERSHIP'});fs.chmodSync(f.parent,0o700);
  patch('opendirSync',original=>(file,...args)=>{if(file===f.root)throw Object.assign(Error('NONSECRET'),{code:'EPERM'});return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),{code:'TREE_SELECTION_UNAVAILABLE'}));
 });assert.equal(calls,0);
}));

test('a caught observed membership failure cannot be repaired by restoring its names',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=capture.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');f.put('src/new.ts');assert.throws(()=>bindSealedTypeScriptSelection(capture,names),{code:'TREE_SELECTION_CHANGED'});fs.unlinkSync(path.join(f.root,'src/new.ts'));assert.throws(()=>bindSealedTypeScriptSelection(capture,names),{code:'TREE_SELECTION_OPTIONS'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('capture accessors, sparse names and mismatched manifests are refused before body reading',()=>withFixture(f=>{
 let getters=0;const options={parent:f.parent};Object.defineProperty(options,'root',{get(){getters++;return f.root;}});assert.throws(()=>captureSealedTypeScriptSelection(options));assert.equal(getters,0);
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent});assert.throws(()=>bindSealedTypeScriptSelection(capture,new Array(1)));assert.throws(()=>bindSealedTypeScriptSelection(capture,['src/a.ts']),{code:'TREE_SELECTION_OPTIONS'});
 const second=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=second.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');bindSealedTypeScriptSelection(second,names);const manifest=legacy(f).slice(1);assert.throws(()=>materializeSealedTypeScriptSelectedView(second,manifest),{code:'TREE_SELECTION_OPTIONS'});assert.throws(()=>checkSealedTypeScriptSelectionInput(second,names[0]),{code:'TREE_SELECTION_OPTIONS'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('per-input reentrance latches invalidation even if the filesystem hook catches it',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=capture.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');bindSealedTypeScriptSelection(capture,names);let attempted=false;
 patch('lstatSync',original=>(file,...args)=>{if(!attempted&&file===path.join(f.root,'src/a.ts')){attempted=true;try{checkSealedTypeScriptSelectionInput(capture,'src/a.ts');}catch{}}return original(file,...args);},()=>assert.throws(()=>checkSealedTypeScriptSelectionInput(capture,'src/a.ts'),{code:'TREE_SELECTION_OPTIONS'}));assert(attempted);assert.throws(()=>checkSealedTypeScriptSelectionInput(capture,'src/a.ts'),{code:'TREE_SELECTION_OPTIONS'});
}));
test('explicit abandonment is irreversible and grants no filesystem permission',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent});invalidateSealedTypeScriptSelection(capture);let calls=0;patch('lstatSync',original=>(...args)=>{calls++;return original(...args);},()=>assert.throws(()=>bindSealedTypeScriptSelection(capture,['src/a.ts']),{code:'TREE_SELECTION_OPTIONS'}));assert.equal(calls,0);assert.throws(()=>invalidateSealedTypeScriptSelection({...capture}),{code:'TREE_SELECTION_OPTIONS'});
}));

test('unselected leaf rename and type change still invalidate complete selection membership',()=>{
 for(const kind of ['rename','type'])withFixture(f=>{
  let changed=false;patch('openSync',original=>(file,...args)=>{if(!changed&&file===path.join(f.root,'src/a.ts')){changed=true;const old=path.join(f.root,'unselected.txt');if(kind==='rename')fs.renameSync(old,path.join(f.root,'still-unselected.txt'));else{fs.unlinkSync(old);fs.symlinkSync('src/a.ts',old);}}return original(file,...args);},()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),error=>['TREE_SELECTION_CHANGED','TREE_DIRECTORY_CHANGED'].includes(error.code)));assert(changed);assert.deepEqual(fs.readdirSync(f.parent),[]);
 });
});
test('late stage membership after complete staged inventory is caught by closing fingerprints',()=>withFixture(f=>{
 let stageWalks=0,closingSourceWalks=0,changed=false;patch('opendirSync',original=>(file,...args)=>{
  if(typeof file==='string'&&file.startsWith(f.parent+'/redue-materialization-')&&path.dirname(file)===f.parent)stageWalks++;
  if(stageWalks>=2&&file===f.root&&++closingSourceWalks===2){changed=true;const stage=path.join(f.parent,fs.readdirSync(f.parent)[0]);fs.mkdirSync(path.join(stage,'after-inventory'));}return original(file,...args);
 },()=>assert.throws(()=>prepareSealedTypeScriptSelectedView(f.options()),{code:'TREE_DIRECTORY_CHANGED'}));assert(changed);
}));
test('a completed private selection cannot be used for a second copy or new input guard',()=>withFixture(f=>{
 const capture=captureSealedTypeScriptSelection({root:f.root,parent:f.parent}),names=capture.candidates.map(([rel])=>rel).filter(rel=>rel!=='unselected.txt');bindSealedTypeScriptSelection(capture,names);const manifest=legacy(f);const result=materializeSealedTypeScriptSelectedView(capture,manifest);assert.equal(result.reuseEligible,false);
 assert.throws(()=>materializeSealedTypeScriptSelectedView(capture,manifest),{code:'TREE_SELECTION_OPTIONS'});assert.throws(()=>checkSealedTypeScriptSelectionInput(capture,names[0]),{code:'TREE_SELECTION_OPTIONS'});
}));
