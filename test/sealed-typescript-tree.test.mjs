import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {materializeSealedTypeScriptTree,TYPESCRIPT_TREE_LIMITS} from '../src/sealed-typescript-tree.mjs';
import {canonical} from '../src/portable-envelope.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const supported={skip:typeof process.getuid==='function'&&fs.constants.O_NOFOLLOW!==undefined?false:'No reviewed no-follow/UID file primitives'};
function fixture(){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-materialization-'))),root=path.join(base,'project'),parent=path.join(base,'private-stage');fs.mkdirSync(root);fs.mkdirSync(parent,{mode:0o700});
  const write=(rel,bytes='export const a = 1;\n',mode=0o644)=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{mode});fs.chmodSync(file,mode);return file;};
  const typed=rel=>{const file=path.join(root,rel),stat=fs.lstatSync(file,{bigint:true});return hash(`file:${stat.mode}:${hash(fs.readFileSync(file))}`);};
  const rows=names=>names.map(rel=>[rel,typed(rel)]).sort(([a],[b])=>a<b?-1:a>b?1:0);
  return{base,root,parent,write,typed,rows,remove:()=>fs.rmSync(base,{recursive:true,force:true})};}
function withFixture(fn){const f=fixture();try{return fn(f);}finally{f.remove();}}
function patch(key,replacement,fn){const original=fs[key];fs[key]=replacement(original);try{return fn();}finally{fs[key]=original;}}
test('materializes verified fresh independent inodes without claiming sealing or reuse',supported,()=>withFixture(f=>{
  f.write('a.ts');f.write('node_modules/typescript/bin/tsc','#!/usr/bin/env node\n',0o755);const manifest=f.rows(['a.ts','node_modules/typescript/bin/tsc']);
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});assert.equal(result.schema,1);assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);assert.deepEqual(result.files,manifest);assert.equal(result.manifestDigest,hash(canonical(manifest)));assert(Object.isFrozen(result)&&Object.isFrozen(result.files));
  for(const [rel] of manifest){const source=fs.statSync(path.join(f.root,rel)),copied=fs.statSync(path.join(result.root,rel));assert.notEqual(source.ino,copied.ino);assert.equal(copied.nlink,1);assert.equal(source.mode,copied.mode);assert(fs.readFileSync(path.join(f.root,rel)).equals(fs.readFileSync(path.join(result.root,rel))));}
  fs.writeFileSync(path.join(f.root,'a.ts'),'changed source');assert.equal(fs.readFileSync(path.join(result.root,'a.ts'),'utf8'),'export const a = 1;\n');
  fs.writeFileSync(path.join(result.root,'a.ts'),'same UID can still write');assert.equal(result.sealed,false,'ownership is not enforcement');
}));
test('preserves only a single internal npm-file shim with manifest-listed regular target',supported,()=>withFixture(f=>{
  f.write('node_modules/typescript/bin/tsc','console.log(1)\n',0o755);fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.symlinkSync('../typescript/bin/tsc',path.join(f.root,'node_modules/.bin/tsc'));
  const target='node_modules/typescript/bin/tsc',rel='node_modules/.bin/tsc',digest=hash(canonical({kind:'npm-file-shim',target,content:f.typed(target),links:[{path:rel,targetHash:hash('../typescript/bin/tsc')}]}));
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,digest],[target,f.typed(target)]]});assert.equal(fs.readlinkSync(path.join(result.root,rel)),'../typescript/bin/tsc');assert.equal(fs.readFileSync(path.join(result.root,rel),'utf8'),'console.log(1)\n');assert.notEqual(fs.lstatSync(path.join(result.root,rel)).ino,fs.lstatSync(path.join(f.root,rel)).ino);
}));
for(const rel of ['/a.ts','../a.ts','a/../b.ts','a//b.ts','a/./b.ts','a.ts/','a\\b.ts','a:b.ts','a\0b.ts','\ud800.ts'])test(`refuses unsafe manifest path ${JSON.stringify(rel)}`,supported,()=>withFixture(f=>{assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,'a'.repeat(64)]]}),{code:'TREE_MANIFEST'});assert.deepEqual(fs.readdirSync(f.parent),[]);}));
test('refuses sortedness/duplicates/prefix collisions and non-data manifest fields',supported,()=>withFixture(f=>{
  for(const manifest of [[],[['b','a'.repeat(64)],['a','b'.repeat(64)]],[['a','a'.repeat(64)],['a','a'.repeat(64)]],[['a','a'.repeat(64)],['a/b','a'.repeat(64)]],[["a",'x']],new Array(1)])assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_MANIFEST'});
  let calls=0;const row=[];Object.defineProperty(row,'0',{get(){calls++;return'a';}});row[1]='a'.repeat(64);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[row]}),{code:'TREE_MANIFEST'});assert.equal(calls,0);
  const manifest=[['a','a'.repeat(64)]];manifest.extra=true;assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_MANIFEST'});
}));
test('unknown options/getters are refused without invoking caller behavior',()=>{for(const options of [null,[],{root:'/a',parent:'/b',manifest:[],trust:true}])assert.throws(()=>materializeSealedTypeScriptTree(options),{code:'TREE_OPTIONS'});
  let calls=0;const options={parent:'/b',manifest:[]};Object.defineProperty(options,'root',{get(){calls++;return'/a';}});assert.throws(()=>materializeSealedTypeScriptTree(options),{code:'TREE_OPTIONS'});assert.equal(calls,0);
});
test('source or destination ancestor aliases and overlapping placement refuse',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.root,manifest}),{code:'TREE_PLACEMENT'});
  fs.mkdirSync(path.join(f.root,'stage'),{mode:0o700});assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:path.join(f.root,'stage'),manifest}),{code:'TREE_PLACEMENT'});
  const alias=path.join(f.base,'alias');fs.symlinkSync(f.parent,alias);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:alias,manifest}),{code:'TREE_PATH'});
  fs.chmodSync(f.parent,0o755);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_OWNERSHIP'});
}));
test('source digest mismatch fails before any stage exists',supported,()=>withFixture(f=>{f.write('a.ts');assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['a.ts','a'.repeat(64)]]}),{code:'TREE_DIGEST'});assert.deepEqual(fs.readdirSync(f.parent),[]);}));
test('dedicated parent must be fresh and preserves preexisting owner files',supported,()=>withFixture(f=>{f.write('a.ts');fs.writeFileSync(path.join(f.parent,'owner-file'),'preserve');assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:f.rows(['a.ts'])}),{code:'TREE_PARENT_OCCUPIED'});assert.equal(fs.readFileSync(path.join(f.parent,'owner-file'),'utf8'),'preserve');}));
test('source hardlinks/special permission bits and non-file objects are conservative',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);fs.linkSync(path.join(f.root,'a.ts'),path.join(f.base,'hardlink'));assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'});fs.unlinkSync(path.join(f.base,'hardlink'));
  fs.chmodSync(path.join(f.root,'a.ts'),0o4644);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'});fs.chmodSync(path.join(f.root,'a.ts'),0o644);
  fs.mkdirSync(path.join(f.root,'dir'));assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['dir','a'.repeat(64)]]}),{code:'TREE_FILE'});
}));
test('unsupported source links/external links/directory links and unlisted shim targets refuse',supported,()=>withFixture(f=>{
  f.write('target');fs.symlinkSync('target',path.join(f.root,'alias'));assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['alias','a'.repeat(64)]]}),{code:'TREE_SYMLINK'});
  fs.mkdirSync(path.join(f.root,'node_modules/.bin'),{recursive:true});fs.symlinkSync('../../../outside',path.join(f.root,'node_modules/.bin/tsc'));assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['node_modules/.bin/tsc','a'.repeat(64)]]}),{code:'TREE_SYMLINK'});
  fs.unlinkSync(path.join(f.root,'node_modules/.bin/tsc'));fs.symlinkSync('../../target',path.join(f.root,'node_modules/.bin/tsc'));assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['node_modules/.bin/tsc','a'.repeat(64)]]}),{code:'TREE_SYMLINK'});
}));
test('source replacement in the open gap is detected even with identical bytes',supported,()=>withFixture(f=>{
  const target=f.write('a.ts'),manifest=f.rows(['a.ts']);let changed=false;
  patch('openSync',original=>(file,...args)=>{if(file===target&&!changed){changed=true;fs.renameSync(target,target+'.old');fs.copyFileSync(target+'.old',target);}return original(file,...args);},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('changed source during copy and changed copied bytes cannot publish a verified result',supported,()=>withFixture(f=>{
  const file=f.write('a.ts'),manifest=f.rows(['a.ts']);let changed=false;
  patch('writeSync',original=>(fd,...args)=>{const count=original(fd,...args);if(!changed){changed=true;fs.appendFileSync(file,'// raced\n');}return count;},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('destination mutation before final digest validation refuses',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fsyncSync',original=>fd=>{original(fd);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.writeFileSync(path.join(f.parent,stage,'a.ts'),'altered copied bytes');}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_DIGEST'}));assert(changed);
}));
test('parent replacement is refused without ambiguous deletion',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fsyncSync',original=>fd=>{original(fd);if(!changed){changed=true;fs.renameSync(f.parent,f.parent+'.old');fs.mkdirSync(f.parent,{mode:0o700});}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);assert.equal(fs.readdirSync(f.parent+'.old').length,1);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('staging parent permission changes during copying are refused',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fsyncSync',original=>fd=>{original(fd);if(!changed){changed=true;fs.chmodSync(f.parent,0o755);}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('extra files or directories in the fresh stage cannot be hidden behind manifest equality',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fsyncSync',original=>fd=>{original(fd);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.mkdirSync(path.join(f.parent,stage,'unexpected'));}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('file/count bounds reject before materialization without copying sparse oversize bytes',supported,()=>withFixture(f=>{
  const file=f.write('large');const fd=fs.openSync(file,'r+');try{fs.ftruncateSync(fd,TYPESCRIPT_TREE_LIMITS.fileBytes+1);}finally{fs.closeSync(fd);}
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['large','a'.repeat(64)]]}),{code:'TREE_LIMIT'});
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:new Array(TYPESCRIPT_TREE_LIMITS.files+1)}),{code:'TREE_MANIFEST'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('uses the existing portableManifest representation on both original and fresh copy',supported,async()=>{
  const {portableManifest}=await import('../src/portable-facts.mjs'),{fileHash}=await import('../src/index.mjs');
  return withFixture(f=>{f.write('a.ts');f.write('node_modules/typescript/bin/tsc','console.log(1)\n',0o755);
    fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.symlinkSync('../typescript/bin/tsc',path.join(f.root,'node_modules/.bin/tsc'));
    const observed=Object.fromEntries(['a.ts','node_modules/.bin/tsc','node_modules/typescript/bin/tsc'].map(rel=>[rel,fileHash(f.root,rel,rel.startsWith('node_modules/')).hash]));
    const manifest=portableManifest(f.root,observed),result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
    const copied=Object.fromEntries(Object.keys(observed).map(rel=>[rel,fileHash(result.root,rel,rel.startsWith('node_modules/')).hash]));
    assert.deepEqual(portableManifest(result.root,copied),manifest);
  });
});
test('streams a compiler-sized file above the envelope read cap without raising it',supported,()=>withFixture(f=>{
  f.write('node_modules/typescript/lib/typescript.js',Buffer.alloc(8*1024*1024+1,0x61));
  const manifest=f.rows(['node_modules/typescript/lib/typescript.js']),result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
  assert.equal(result.bytes,8*1024*1024+1);assert.equal(fs.statSync(path.join(result.root,manifest[0][0])).nlink,1);
}));
