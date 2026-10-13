import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {fileHash} from '../src/index.mjs';
import {portableManifest} from '../src/portable-facts.mjs';
import {sealedTypeScriptManifest,sealedTypeScriptDirectoryInventory} from '../src/sealed-typescript-manifest.mjs';
function fixture(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-sealed-manifest-')));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('retains nested single-file npm shim topology without extending legacy portable admission',t=>{
  const root=fixture(t),target='node_modules/example/node_modules/tool/bin/check.js',
    shim='node_modules/example/node_modules/.bin/check';
  fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});fs.mkdirSync(path.dirname(path.join(root,shim)));
  fs.writeFileSync(path.join(root,target),'// NONSECRET fixture');fs.symlinkSync('../tool/bin/check.js',path.join(root,shim));
  const observed=Object.fromEntries([shim,target].map(rel=>[rel,fileHash(root,rel,true).hash]));
  assert.throws(()=>portableManifest(root,observed),{code:'PORTABLE_SYMLINK'});
  const result=sealedTypeScriptManifest(root,observed);assert.equal(result.length,2);assert.equal(result[1][0],target);
  assert.equal(result[1][1],observed[target]);assert.notEqual(result[0][1],observed[shim]);
  fs.unlinkSync(path.join(root,shim));fs.symlinkSync('../tool/bin/./check.js',path.join(root,shim));
  const updated={...observed,[shim]:fileHash(root,shim,true).hash};
  assert.throws(()=>sealedTypeScriptManifest(root,updated),{code:'PORTABLE_SYMLINK'},'noncanonical dot topology is refused');
});
test('unlisted, external and chained nested shims do not gain a declared input',t=>{
  const root=fixture(t),shim='node_modules/example/node_modules/.bin/check';
  fs.mkdirSync(path.dirname(path.join(root,shim)),{recursive:true});
  fs.symlinkSync('/dev/null',path.join(root,shim));
  assert.throws(()=>sealedTypeScriptManifest(root,{[shim]:'a'.repeat(64)}),{code:'PORTABLE_SYMLINK'});
  fs.unlinkSync(path.join(root,shim));fs.symlinkSync('../tool/missing.js',path.join(root,shim));
  assert.throws(()=>sealedTypeScriptManifest(root,{[shim]:'a'.repeat(64)}),{code:'PORTABLE_COVERAGE_UNSUPPORTED'});
  const alias='node_modules/example/node_modules/tool/alias.js';fs.mkdirSync(path.dirname(path.join(root,alias)));fs.symlinkSync('../missing.js',path.join(root,alias));
  fs.unlinkSync(path.join(root,shim));fs.symlinkSync('../tool/alias.js',path.join(root,shim));
  assert.throws(()=>sealedTypeScriptManifest(root,{[shim]:'a'.repeat(64),[alias]:'b'.repeat(64)}),{code:'PORTABLE_SYMLINK'});
});

test('explicit directory inventory includes empty directories and unselected names without changing file selection',t=>{
 const root=fixture(t);fs.mkdirSync(path.join(root,'empty/nested'),{recursive:true});fs.writeFileSync(path.join(root,'a.ts'),'NONSECRET selected');fs.writeFileSync(path.join(root,'unselected.txt'),'NONSECRET unselected');
 const observed={'a.ts':fileHash(root,'a.ts',true).hash},files=sealedTypeScriptManifest(root,observed),directories=sealedTypeScriptDirectoryInventory(root);
 assert.deepEqual(files,[['a.ts',observed['a.ts']]]);assert.deepEqual(directories.directories,[['',[['a.ts','file'],['empty','directory'],['unselected.txt','file']]],['empty',[['nested','directory']]],['empty/nested',[]]]);
 assert.equal(directories.interpretation,'redue-typescript-directory-inventory@1');assert.equal(directories.directoryCount,3);assert.equal(directories.entryCount,4);assert(!Object.hasOwn(directories,'root'));assert(!Object.hasOwn(directories,'sealed'));
});
