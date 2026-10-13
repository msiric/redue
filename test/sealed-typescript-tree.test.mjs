import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {materializeSealedTypeScriptTree,materializeSealedTypeScriptTreeWithDirectories,captureSealedTypeScriptDirectoryInventory,validateSealedTypeScriptDirectoryInventory,TYPESCRIPT_TREE_LIMITS} from '../src/sealed-typescript-tree.mjs';
import {canonical} from '../src/portable-envelope.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const supported={skip:typeof process.getuid==='function'&&fs.constants.O_NOFOLLOW!==undefined?false:'No reviewed no-follow/UID file primitives'};
function fixture(){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-materialization-'))),root=path.join(base,'project'),parent=path.join(base,'private-stage');fs.mkdirSync(root);fs.mkdirSync(parent,{mode:0o700});
  const write=(rel,bytes='export const a = 1;\n',mode=0o644)=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{mode});fs.chmodSync(file,mode);return file;};
  const typed=rel=>{const file=path.join(root,rel),stat=fs.lstatSync(file,{bigint:true});return hash(`file:${stat.mode}:${rel.startsWith('node_modules/')&&stat.nlink>1n?`${stat.nlink}:`:''}${hash(fs.readFileSync(file))}`);};
  const rows=names=>names.map(rel=>[rel,typed(rel)]).sort(([a],[b])=>a<b?-1:a>b?1:0);
  return{base,root,parent,write,typed,rows,remove:()=>fs.rmSync(base,{recursive:true,force:true})};}
function withFixture(fn){const f=fixture();try{return fn(f);}finally{f.remove();}}
function patch(key,replacement,fn){const original=fs[key];fs[key]=replacement(original);try{return fn();}finally{fs[key]=original;}}
test('materializes verified fresh independent inodes without claiming sealing or reuse',supported,()=>withFixture(f=>{
  f.write('a.ts');f.write('node_modules/typescript/bin/tsc','#!/usr/bin/env node\n',0o755);const manifest=f.rows(['a.ts','node_modules/typescript/bin/tsc']);
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});assert.equal(result.schema,1);assert.equal(result.interpretation,'redue-typescript-materialization@2');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);assert.deepEqual(result.sourceFiles,manifest);assert.equal(result.sourceManifestDigest,hash(canonical(manifest)));assert.deepEqual(result.materializedFiles,manifest);assert.equal(result.materializedManifestDigest,hash(canonical(manifest)));assert.deepEqual(result.sourceAliasGroups,[]);assert(Object.isFrozen(result)&&Object.isFrozen(result.sourceFiles)&&Object.isFrozen(result.materializedFiles));
  for(const [rel] of manifest){const source=fs.statSync(path.join(f.root,rel)),copied=fs.statSync(path.join(result.root,rel));assert.notEqual(source.ino,copied.ino);assert.equal(copied.nlink,1);assert.equal(source.mode,copied.mode);assert(fs.readFileSync(path.join(f.root,rel)).equals(fs.readFileSync(path.join(result.root,rel))));}
  fs.writeFileSync(path.join(f.root,'a.ts'),'changed source');assert.equal(fs.readFileSync(path.join(result.root,'a.ts'),'utf8'),'export const a = 1;\n');
  fs.writeFileSync(path.join(result.root,'a.ts'),'same UID can still write');assert.equal(result.sealed,false,'ownership is not enforcement');
}));
test('preserves only a single internal npm-file shim with manifest-listed regular target',supported,()=>withFixture(f=>{
  f.write('node_modules/typescript/bin/tsc','console.log(1)\n',0o755);fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.symlinkSync('../typescript/bin/tsc',path.join(f.root,'node_modules/.bin/tsc'));
  const target='node_modules/typescript/bin/tsc',rel='node_modules/.bin/tsc',digest=hash(canonical({kind:'npm-file-shim',target,content:f.typed(target),links:[{path:rel,targetHash:hash('../typescript/bin/tsc')}]}));
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,digest],[target,f.typed(target)]]});assert.equal(fs.readlinkSync(path.join(result.root,rel)),'../typescript/bin/tsc');assert.equal(fs.readFileSync(path.join(result.root,rel),'utf8'),'console.log(1)\n');assert.notEqual(fs.lstatSync(path.join(result.root,rel)).ino,fs.lstatSync(path.join(f.root,rel)).ino);
}));
test('preserves nested installed npm bin shim within its exact owning container',supported,()=>withFixture(f=>{
  const target='node_modules/tool/node_modules/semver/bin/semver.js',rel='node_modules/tool/node_modules/.bin/semver',link='../semver/bin/semver.js';
  f.write(target,'console.log(1)\n',0o755);fs.mkdirSync(path.dirname(path.join(f.root,rel)),{recursive:true});fs.symlinkSync(link,path.join(f.root,rel));
  const digest=hash(canonical({kind:'npm-file-shim',target,content:f.typed(target),links:[{path:rel,targetHash:hash(link)}]}));
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,digest],[target,f.typed(target)]]});
  assert.equal(fs.readlinkSync(path.join(result.root,rel)),link);assert.equal(fs.readFileSync(path.join(result.root,rel),'utf8'),'console.log(1)\n');
  assert.notEqual(fs.lstatSync(path.join(result.root,rel)).ino,fs.lstatSync(path.join(f.root,rel)).ino);assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
}));
test('nested bin shims cannot cross containers, source prefixes or canonical target syntax',supported,()=>withFixture(f=>{
  const rel='node_modules/tool/node_modules/.bin/tool';f.write('node_modules/other/cli.js');f.write('source.ts');f.write('node_modules/tool/node_modules/pkg/cli.js');fs.mkdirSync(path.dirname(path.join(f.root,rel)),{recursive:true});
  for(const link of ['../../../other/cli.js','../../../../source.ts','../pkg/./cli.js','../pkg/sub/../cli.js','../pkg//cli.js','../.bin/plain']){
    fs.symlinkSync(link,path.join(f.root,rel));const manifest=[[rel,hForRefusal()],...f.rows(['node_modules/other/cli.js','node_modules/tool/node_modules/pkg/cli.js','source.ts'])].sort(([a],[b])=>a<b?-1:a>b?1:0);
    assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_SYMLINK'});fs.unlinkSync(path.join(f.root,rel));assert.deepEqual(fs.readdirSync(f.parent),[]);
  }
  function hForRefusal(){return'a'.repeat(64);}
}));
test('nested internal target ancestor aliases and link chains remain unsupported',supported,()=>withFixture(f=>{
  const rel='node_modules/tool/node_modules/.bin/tool',target='node_modules/tool/node_modules/pkg/cli.js';f.write(target);fs.mkdirSync(path.dirname(path.join(f.root,rel)),{recursive:true});
  const pkg=path.dirname(path.join(f.root,target));fs.renameSync(pkg,pkg+'.saved');fs.symlinkSync(pkg+'.saved',pkg);fs.symlinkSync('../pkg/cli.js',path.join(f.root,rel));
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,'a'.repeat(64)],[target,'b'.repeat(64)]]}),{code:'TREE_PATH'});
  fs.unlinkSync(pkg);fs.renameSync(pkg+'.saved',pkg);fs.unlinkSync(path.join(f.root,target));fs.symlinkSync('other.js',path.join(f.root,target));
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[rel,'a'.repeat(64)],[target,'b'.repeat(64)]]}),{code:'TREE_FILE'});assert.deepEqual(fs.readdirSync(f.parent),[]);
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
test('physical case-alias containment is rejected even if lexical paths differ',supported,()=>withFixture(f=>{
  f.write('a.ts');const inside=path.join(f.root,'private-stage');fs.mkdirSync(inside,{mode:0o700});const alias=path.join(f.base,'PROJECT','private-stage');
  if(!fs.existsSync(alias))return;assert.equal(fs.statSync(alias).ino,fs.statSync(inside).ino);
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:alias,manifest:f.rows(['a.ts'])}),{code:'TREE_PLACEMENT'});assert.deepEqual(fs.readdirSync(inside),[]);
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
  patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.writeFileSync(path.join(f.parent,stage,'a.ts'),'altered copied bytes');}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_DIGEST'}));assert(changed);
}));
test('parent replacement is refused without ambiguous deletion',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;fs.renameSync(f.parent,f.parent+'.old');fs.mkdirSync(f.parent,{mode:0o700});}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);assert.equal(fs.readdirSync(f.parent+'.old').length,1);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('staging parent permission changes during copying are refused',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;fs.chmodSync(f.parent,0o755);}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('extra files or directories in the fresh stage cannot be hidden behind manifest equality',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.mkdirSync(path.join(f.parent,stage,'unexpected'));}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('file/count bounds reject before materialization without copying sparse oversize bytes',supported,()=>withFixture(f=>{
  const file=f.write('large');const fd=fs.openSync(file,'r+');try{fs.ftruncateSync(fd,TYPESCRIPT_TREE_LIMITS.fileBytes+1);}finally{fs.closeSync(fd);}
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[['large','a'.repeat(64)]]}),{code:'TREE_LIMIT'});
  assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:new Array(TYPESCRIPT_TREE_LIMITS.files+1)}),{code:'TREE_MANIFEST'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('failure retains partial stages and never invokes recursive pathname cleanup',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false,removals=0;
  patch('rmSync',original=>(...args)=>{removals++;return original(...args);},()=>
    patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.writeFileSync(path.join(f.parent,stage,'a.ts'),'changed');}},()=>
      assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_DIGEST'})));
  assert.equal(removals,0);assert.equal(fs.readdirSync(f.parent).length,1);
}));
test('final stage enumeration uses bounded iterator reads, never bulk readdir',supported,()=>withFixture(f=>{
  f.write('a.ts');f.write('nested/b.ts');const manifest=f.rows(['a.ts','nested/b.ts']);let iteratorReads=0;
  patch('readdirSync',()=>()=>{throw Error('BULK_DIRECTORY_FORBIDDEN');},()=>
    patch('opendirSync',original=>(file,...args)=>{const directory=original(file,...args),read=directory.readSync.bind(directory);directory.readSync=()=>{iteratorReads++;return read();};return directory;},()=>{
      const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});assert.deepEqual(result.sourceFiles,manifest);
    }));assert(iteratorReads>0);
}));
test('metadata pass catches the historical restored-ancestor trigger earlier without claiming read isolation',supported,()=>withFixture(f=>{
  const file=f.write('sub/a.ts','original input\n'),manifest=f.rows(['sub/a.ts']),sub=path.dirname(file),outside=path.join(f.base,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'a.ts'),'NONSECRET outside canary\n');
  let lstats=0,swapped=false,outsideFd=null,seen=false;
  patch('lstatSync',original=>(target,...args)=>{if(target===file&&++lstats===2){fs.renameSync(sub,sub+'.saved');fs.symlinkSync(outside,sub);swapped=true;}return original(target,...args);},()=>
    patch('openSync',original=>(target,...args)=>{const fd=original(target,...args);if(target===file&&swapped){outsideFd=fd;fs.unlinkSync(sub);fs.renameSync(sub+'.saved',sub);swapped=false;}return fd;},()=>
      patch('readSync',original=>(fd,buffer,...args)=>{const count=original(fd,buffer,...args);if(fd===outsideFd&&count>0&&buffer.subarray(0,count).toString().includes('NONSECRET outside canary'))seen=true;return count;},()=>
        assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}))));
  assert.equal(seen,false,'this particular historical trigger is now caught before reading; no atomic read-confinement claim');assert.deepEqual(fs.readdirSync(f.parent),[]);
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
test('nested shim materialization exactly matches the new explicit sealed manifest',supported,async()=>{
  const {sealedTypeScriptManifest}=await import('../src/sealed-typescript-manifest.mjs'),{fileHash}=await import('../src/index.mjs');
  return withFixture(f=>{const target='node_modules/tool/node_modules/semver/bin/semver.js',rel='node_modules/tool/node_modules/.bin/semver';
    f.write('a.ts');f.write(target,'console.log(1)\n',0o755);fs.mkdirSync(path.dirname(path.join(f.root,rel)),{recursive:true});fs.symlinkSync('../semver/bin/semver.js',path.join(f.root,rel));
    const names=['a.ts',rel,target],observed=Object.fromEntries(names.map(name=>[name,fileHash(f.root,name,name.startsWith('node_modules/')).hash]));
    const manifest=sealedTypeScriptManifest(f.root,observed),result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
    const copied=Object.fromEntries(names.map(name=>[name,fileHash(result.root,name,name.startsWith('node_modules/')).hash]));assert.deepEqual(sealedTypeScriptManifest(result.root,copied),manifest);
  });
});
test('streams a compiler-sized file above the envelope read cap without raising it',supported,()=>withFixture(f=>{
  f.write('node_modules/typescript/lib/typescript.js',Buffer.alloc(8*1024*1024+1,0x61));
  const manifest=f.rows(['node_modules/typescript/lib/typescript.js']),result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
  assert.equal(result.bytes,8*1024*1024+1);assert.equal(fs.statSync(path.join(result.root,manifest[0][0])).nlink,1);
}));

test('complete installed source aliases produce separate single-link materialized manifests',supported,()=>withFixture(f=>{
  const a='node_modules/pkg/a',b='node_modules/pkg/b';f.write(a,'same executable bytes',0o755);fs.linkSync(path.join(f.root,a),path.join(f.root,b));const manifest=f.rows([a,b]);
  const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
  assert.deepEqual(result.sourceFiles,manifest);assert.equal(result.sourceManifestDigest,hash(canonical(manifest)));assert.deepEqual(result.sourceAliasGroups,[[a,b]]);
  assert.equal(result.sourceAliasGroupsDigest,hash(canonical([[a,b]])));assert.notEqual(result.sourceManifestDigest,result.materializedManifestDigest);
  const materialized=manifest.map(([rel])=>[rel,hash(`file:${fs.statSync(path.join(result.root,rel),{bigint:true}).mode}:${hash(fs.readFileSync(path.join(result.root,rel)))}`)]);
  assert.deepEqual(result.materializedFiles,materialized);assert.equal(result.materializedManifestDigest,hash(canonical(materialized)));
  const source=fs.statSync(path.join(f.root,a));const copies=[a,b].map(rel=>fs.statSync(path.join(result.root,rel)));
  assert.equal(source.nlink,2);assert.equal(copies[0].nlink,1);assert.equal(copies[1].nlink,1);assert.notEqual(copies[0].ino,copies[1].ino);for(const copy of copies)assert.notEqual(copy.ino,source.ino);
  assert.equal(result.bytes,2*Buffer.byteLength('same executable bytes'));assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
  assert(Object.isFrozen(result.sourceAliasGroups[0]));assert(!Object.hasOwn(result,'files'));assert(!Object.hasOwn(result,'manifestDigest'));
}));
test('incomplete internal or external source alias groups refuse before any body or stage',supported,()=>{
  for(const outside of [false,true])withFixture(f=>{const a='node_modules/pkg/a',b='node_modules/pkg/b';f.write(a);fs.linkSync(path.join(f.root,a),path.join(f.root,b));
    if(outside)fs.linkSync(path.join(f.root,a),path.join(f.base,'outside-alias'));const manifest=f.rows(outside?[a,b]:[a]);let bodyOpens=0;
    patch('openSync',original=>(file,...args)=>{if(String(file).startsWith(f.root+path.sep))bodyOpens++;return original(file,...args);},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'}));
    assert.equal(bodyOpens,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
  });
});
test('the whole source namespace is checked before reading an earlier ordinary file',supported,()=>withFixture(f=>{
  f.write('a.ts');const a='node_modules/pkg/a';f.write(a);fs.linkSync(path.join(f.root,a),path.join(f.base,'outside-alias'));const manifest=f.rows(['a.ts',a]);let reads=0;
  patch('readSync',original=>(...args)=>{reads++;return original(...args);},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'}));assert.equal(reads,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('a source alias group cannot omit the installed nlink from its typed digest',supported,()=>withFixture(f=>{
  const a='node_modules/pkg/a',b='node_modules/pkg/b';f.write(a);fs.linkSync(path.join(f.root,a),path.join(f.root,b));const stat=fs.statSync(path.join(f.root,a),{bigint:true});
  const wrong=hash(`file:${stat.mode}:${hash(fs.readFileSync(path.join(f.root,a)))}`);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest:[[a,wrong],[b,wrong]]}),{code:'TREE_DIGEST'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('case alias spellings cannot count one actual entry twice to hide an outside link',supported,t=>withFixture(f=>{
  const a='node_modules/pkg/a',alias='node_modules/pkg/A';f.write(a);if(!fs.existsSync(path.join(f.root,alias))){t.skip('Requires case-insensitive filesystem');return;}
  fs.linkSync(path.join(f.root,a),path.join(f.base,'outside-alias'));const manifest=f.rows([alias,a]);let reads=0;
  patch('readSync',original=>(...args)=>{reads++;return original(...args);},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'}));assert.equal(reads,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('case-aliased ancestor spellings are refused even for different actual leaf entries',supported,t=>withFixture(f=>{
  const a='node_modules/pkg/a',b='node_modules/PKG/b';f.write(a);if(!fs.existsSync(path.join(f.root,'node_modules/PKG'))){t.skip('Requires case-insensitive filesystem');return;}
  f.write(b);const manifest=f.rows([a,b]);assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('added aliases during a copy invalidate the group and retain the partial stage',supported,()=>withFixture(f=>{
  const a='node_modules/pkg/a',b='node_modules/pkg/b';f.write(a);fs.linkSync(path.join(f.root,a),path.join(f.root,b));const manifest=f.rows([a,b]);let changed=false;
  patch('writeSync',original=>(fd,...args)=>{const count=original(fd,...args);if(!changed){changed=true;fs.linkSync(path.join(f.root,a),path.join(f.base,'new-alias'));}return count;},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);assert.equal(fs.readdirSync(f.parent).length,1);
}));
test('removed and restored alias during a copy remains a changed source group',supported,()=>withFixture(f=>{
  const a='node_modules/pkg/a',b='node_modules/pkg/b';f.write(a);fs.linkSync(path.join(f.root,a),path.join(f.root,b));const manifest=f.rows([a,b]);let changed=false;
  patch('writeSync',original=>(fd,...args)=>{const count=original(fd,...args);if(!changed){changed=true;fs.unlinkSync(path.join(f.root,b));fs.linkSync(path.join(f.root,a),path.join(f.root,b));}return count;},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_CHANGED'}));assert(changed);
}));
test('copied files cannot acquire shared destination inodes',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let changed=false;
  patch('fchmodSync',original=>(fd,mode)=>{original(fd,mode);if(!changed){changed=true;const stage=fs.readdirSync(f.parent)[0];fs.linkSync(path.join(f.parent,stage,'a.ts'),path.join(f.parent,stage,'extra'));}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'}));assert(changed);
}));
test('an npm shim binds source alias content and independently regenerated copied content',supported,async()=>{
  const {sealedTypeScriptManifest}=await import('../src/sealed-typescript-manifest.mjs'),{fileHash}=await import('../src/index.mjs');
  return withFixture(f=>{const a='node_modules/pkg/a.js',b='node_modules/pkg/b.js',rel='node_modules/.bin/pkg';f.write(a,'console.log(1)\n',0o755);fs.linkSync(path.join(f.root,a),path.join(f.root,b));
    fs.mkdirSync(path.dirname(path.join(f.root,rel)));fs.symlinkSync('../pkg/a.js',path.join(f.root,rel));const names=[rel,a,b];
    const observed=Object.fromEntries(names.map(name=>[name,fileHash(f.root,name,true).hash])),manifest=sealedTypeScriptManifest(f.root,observed);
    const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});
    const copied=Object.fromEntries(names.map(name=>[name,fileHash(result.root,name,true).hash])),materialized=sealedTypeScriptManifest(result.root,copied);
    assert.deepEqual(result.sourceFiles,manifest);assert.deepEqual(result.materializedFiles,materialized);assert.notDeepEqual(materialized,manifest);
    assert.notEqual(new Map(materialized).get(rel),new Map(manifest).get(rel));assert.equal(fs.readlinkSync(path.join(result.root,rel)),'../pkg/a.js');
  });
});
test('metadata-aware hostile ancestor swaps can still read outside before refusing',supported,()=>withFixture(f=>{
  const file=f.write('sub/a.ts','original input\n'),manifest=f.rows(['sub/a.ts']),sub=path.dirname(file),outside=path.join(f.base,'outside');
  fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'a.ts'),'NONSECRET metadata canary\n');let outsideFd=null,seen=false;
  const outsideAt=fn=>{fs.renameSync(sub,sub+'.saved');fs.symlinkSync(outside,sub);try{return fn();}finally{fs.unlinkSync(sub);fs.renameSync(sub+'.saved',sub);}};
  patch('lstatSync',original=>(target,...args)=>target===file?outsideAt(()=>original(target,...args)):original(target,...args),()=>
    patch('openSync',original=>(target,...args)=>{if(target!==file)return original(target,...args);return outsideAt(()=>{outsideFd=original(target,...args);return outsideFd;});},()=>
      patch('readSync',original=>(fd,buffer,...args)=>{const count=original(fd,buffer,...args);if(fd===outsideFd&&count>0&&buffer.subarray(0,count).toString().includes('NONSECRET metadata canary'))seen=true;return count;},()=>
        assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_DIGEST'}))));
  assert.equal(seen,true,'metadata/group checks still are not an atomic read sandbox against hostile writers');assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('source directory case rename during copying fails final exact namespace check',supported,t=>withFixture(f=>{
  const rel='node_modules/pkg/a';f.write(rel);const original=path.join(f.root,'node_modules/pkg'),alias=path.join(f.root,'node_modules/PKG');
  if(!fs.existsSync(alias)){t.skip('Requires case-insensitive filesystem');return;}const manifest=f.rows([rel]);let changed=false;
  patch('fchmodSync',originalSync=>(fd,mode)=>{originalSync(fd,mode);if(!changed){changed=true;fs.renameSync(original,alias);}},()=>assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_FILE'}));assert(changed);
}));
test('metadata namespace enumeration is bounded before any source body reads',supported,()=>withFixture(f=>{
  f.write('a.ts');const manifest=f.rows(['a.ts']);let reads=0,entries=0;
  patch('readSync',original=>(...args)=>{reads++;return original(...args);},()=>
    patch('opendirSync',original=>(file,...args)=>{const directory=original(file,...args);if(file===f.root)directory.readSync=()=>{entries++;return{name:'undeclared'};};return directory;},()=>
      assert.throws(()=>materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest}),{code:'TREE_LIMIT'})));
  assert.equal(entries,TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories+1);assert.equal(reads,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));

test('ephemeral copies need no per-file fsync and still independently read back every copied file',supported,()=>withFixture(f=>{
  f.write('a.ts');f.write('node_modules/pkg/b');const manifest=f.rows(['a.ts','node_modules/pkg/b']);let synchronizations=0,copiedOpens=0;
  patch('fsyncSync',()=>()=>{synchronizations++;throw Error('Unexpected stage durability operation');},()=>
    patch('openSync',original=>(file,...args)=>{if(String(file).startsWith(f.parent+path.sep)&&((args[0]&fs.constants.O_WRONLY)===0))copiedOpens++;return original(file,...args);},()=>{
      const result=materializeSealedTypeScriptTree({root:f.root,parent:f.parent,manifest});assert.deepEqual(result.sourceFiles,manifest);assert.deepEqual(result.materializedFiles,manifest);assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
    }));
  assert.equal(synchronizations,0);assert.equal(copiedOpens,manifest.length*2,'each fresh copy is fully hashed after copying and again before publication');
}));

// @3 is an explicit locally derived complete directory/leaf inventory. It is
// still trusted/quiescent materialization, not hostile-writer read confinement.
const inventory=directories=>({schema:1,interpretation:'redue-typescript-directory-inventory@1',directories,
  digest:hash(canonical({interpretation:'redue-typescript-directory-inventory@1',directories})),directoryCount:directories.length,entryCount:directories.reduce((n,[,entries])=>n+entries.length,0)});
const fullOptions=(f,names)=>({root:f.root,parent:f.parent,manifest:f.rows(names),directoryInventory:captureSealedTypeScriptDirectoryInventory(f.root)});
test('@3 preserves complete directory names/types including nested empty directories separately from bytes',supported,()=>withFixture(f=>{
 f.write('src/a.ts');fs.mkdirSync(path.join(f.root,'empty/nested'),{recursive:true});const options=fullOptions(f,['src/a.ts']),result=materializeSealedTypeScriptTreeWithDirectories(options);
 assert.equal(result.interpretation,'redue-typescript-materialization@3');assert.deepEqual(result.sourceDirectories,[['',[['empty','directory'],['src','directory']]],['empty',[['nested','directory']]],['empty/nested',[]],['src',[['a.ts','file']]]]);
 assert.deepEqual(result.materializedDirectories,result.sourceDirectories);assert.equal(result.directoryCount,4);assert.equal(result.directoryEntryCount,4);
 assert.equal(result.sourceDirectoryInventoryDigest,options.directoryInventory.digest);assert.equal(result.materializedDirectoryInventoryDigest,options.directoryInventory.digest);assert.notEqual(result.sourceDirectoryInventoryDigest,result.sourceManifestDigest);
 assert(fs.statSync(path.join(result.root,'empty/nested')).isDirectory());assert(Object.isFrozen(result.sourceDirectories[0][1]));assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
}));
test('@2 remains file-only and cannot silently adopt full directory inventory',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);assert.throws(()=>materializeSealedTypeScriptTree(options),{code:'TREE_OPTIONS'});
 const {directoryInventory,...old}=options,result=materializeSealedTypeScriptTree(old);assert.equal(result.interpretation,'redue-typescript-materialization@2');assert(!Object.hasOwn(result,'sourceDirectories'));assert(!fs.existsSync(path.join(result.root,'empty')));
}));
test('@3 incomplete declared leaf coverage refuses before source bodies or stage creation',supported,()=>withFixture(f=>{
 f.write('a.ts');f.write('.git/config','SYNTHETIC_NONSECRET_NOT_TO_BE_READ');const options=fullOptions(f,['a.ts']);let bodyOpens=0;
 patch('openSync',original=>(file,...args)=>{if(typeof file==='string'&&file.startsWith(f.root+'/'))bodyOpens++;return original(file,...args);},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_COVERAGE'}));
 assert.equal(bodyOpens,0);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('@3 directory-only changes alter directory identity without changing selected file bytes',supported,()=>withFixture(f=>{
 f.write('a.ts');const options=fullOptions(f,['a.ts']);fs.mkdirSync(path.join(f.root,'empty'));assert.notEqual(captureSealedTypeScriptDirectoryInventory(f.root).digest,options.directoryInventory.digest);
 assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_CHANGED'});assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('directory inventory validates canonical topology, ordering and exact data shapes before filesystem use',()=>{
 const good=inventory([['',[['a.ts','file'],['d','directory']]],['d',[]]]);assert.deepEqual(validateSealedTypeScriptDirectoryInventory(good),good);
 const bad=[{...good,schema:2},{...good,interpretation:'redue-typescript-directory-inventory@0'},{...good,extra:true},{...good,directoryCount:1},{...good,entryCount:1},{...good,digest:'a'.repeat(64)},
  inventory([]),inventory([['d',[]]]),inventory([['',[]],['d',[]]]),inventory([['',[['d','directory']]]]),inventory([['',[['d','file']]],['d',[]]]),
  inventory([['',[['z','file'],['a','file']]]]),inventory([['',[['a','file'],['a','file']]]]),inventory([['',[['x','directory']]],['x',[]],['x',[]]]),
  inventory([['',[['x','pipe']]]]),inventory([['',[['../x','file']]]]),inventory([['',[['a/b','file']]]]),inventory([['',[['a\\b','file']]]]),inventory([['',[['x\0','file']]]]),{...inventory([['',[]]]),directories:[['',[['\ud800','file']]]],entryCount:1}];
 for(const value of bad)assert.throws(()=>validateSealedTypeScriptDirectoryInventory(value),{code:'TREE_DIRECTORY_MANIFEST'});
});
test('directory inventory never invokes accessors or accepts inherited/sparse/custom arrays',()=>{
 const good=inventory([['',[]]]);let invoked=0;const getter={...good};Object.defineProperty(getter,'directories',{get(){invoked++;return good.directories;}});
 const nested=inventory([['',[]]]);Object.defineProperty(nested.directories[0],'0',{get(){invoked++;return'';}});
 const inherited=Object.assign(Object.create({trust:true}),good),sparse={...good,directories:new Array(1)},custom={...good,directories:Object.assign([['',[]]],{other:true})};
 for(const value of [getter,nested,inherited,sparse,custom])assert.throws(()=>validateSealedTypeScriptDirectoryInventory(value),{code:'TREE_DIRECTORY_MANIFEST'});assert.equal(invoked,0);
});
test('metadata capture never opens file contents or follows unsupported symbolic leaves',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.symlinkSync('/NONSECRET-OUTSIDE',path.join(f.root,'alias'));let opens=0;
 const result=patch('openSync',original=>(...args)=>{opens++;return original(...args);},()=>captureSealedTypeScriptDirectoryInventory(f.root));
 assert.equal(opens,0);assert.deepEqual(result.directories,[['',[['a.ts','file'],['alias','symlink']]]]);assert(Object.isFrozen(result));
 assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories({root:f.root,parent:f.parent,manifest:[...f.rows(['a.ts']),['alias','a'.repeat(64)]],directoryInventory:result}),{code:'TREE_SYMLINK'});
}));
for(const operation of ['opendirSync','lstatSync','realpathSync'])test(`inventory ${operation} permission denial is never treated as absence`,supported,()=>withFixture(f=>{
 f.write('a.ts');patch(operation,original=>(file,...args)=>{if(file===f.root)throw Object.assign(Error('NONSECRET'),{code:'EPERM'});return original(file,...args);},()=>assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_UNAVAILABLE'}));
}));
test('directory symlink substitution and duplicate physical directories are refused',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);const empty=path.join(f.root,'empty');fs.rmdirSync(empty);fs.symlinkSync(f.base,empty);
 assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_CHANGED'});assert.deepEqual(fs.readdirSync(f.parent),[]);
 fs.unlinkSync(empty);fs.mkdirSync(empty);fs.mkdirSync(path.join(f.root,'other'));const originalStat=fs.lstatSync(empty,{bigint:true});
 patch('lstatSync',original=>(file,...args)=>file===path.join(f.root,'other')?originalStat:original(file,...args),()=>assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_DIRECTORY_CHANGED'}));
}));
test('inventory iteration order is not authority and harmless reordering yields the same digest',supported,()=>withFixture(f=>{
 f.write('z');f.write('a');fs.mkdirSync(path.join(f.root,'empty'));const before=captureSealedTypeScriptDirectoryInventory(f.root),options=fullOptions(f,['a','z']);
 patch('opendirSync',original=>(file,...args)=>{const d=original(file,...args);if(file!==f.root)return d;const rows=[];let row;while((row=d.readSync())!==null)rows.push(row);rows.reverse();let i=0;return{readSync:()=>rows[i++]??null,closeSync:()=>d.closeSync()};},()=>{
  // The synthetic order alternates, while directory names/types remain fixed.
  assert.deepEqual(captureSealedTypeScriptDirectoryInventory(f.root),before);
 });
 assert.equal(materializeSealedTypeScriptTreeWithDirectories(options).sourceDirectoryInventoryDigest,before.digest);
}));
for(const mutation of ['add','remove','rename','restore'])test(`@3 detects ${mutation} directory membership during file reads`,supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);let changed=false;
 patch('readSync',original=>(...args)=>{const n=original(...args);if(!changed){changed=true;const empty=path.join(f.root,'empty');if(mutation==='add')fs.mkdirSync(path.join(f.root,'new'));if(mutation==='remove')fs.rmdirSync(empty);if(mutation==='rename')fs.renameSync(empty,empty+'2');if(mutation==='restore'){fs.mkdirSync(path.join(f.root,'transient'));fs.rmdirSync(path.join(f.root,'transient'));}}return n;},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_CHANGED'}));
 assert(changed);assert.deepEqual(fs.readdirSync(f.parent),[]);
}));
test('@3 source empty-directory replacement with identical membership is detected',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);let changed=false;
 patch('readSync',original=>(...args)=>{const n=original(...args);if(!changed){changed=true;const empty=path.join(f.root,'empty');fs.renameSync(empty,path.join(f.base,'retained-empty'));fs.mkdirSync(empty);}return n;},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_CHANGED'}));assert(changed);
}));
for(const mutation of ['remove','extra','replace'])test(`@3 detects ${mutation} staged empty directory and retains partial stage`,supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);let changed=false;
 patch('fchmodSync',original=>(...args)=>{const n=original(...args);if(!changed){changed=true;const stage=path.join(f.parent,fs.readdirSync(f.parent)[0]),empty=path.join(stage,'empty');if(mutation==='remove')fs.rmdirSync(empty);if(mutation==='extra')fs.mkdirSync(path.join(stage,'extra'));if(mutation==='replace'){fs.renameSync(empty,path.join(f.base,'retained-stage-empty'));fs.mkdirSync(empty,{mode:0o700});}}return n;},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),error=>['TREE_CHANGED','TREE_DIRECTORY_CHANGED','TREE_UNAVAILABLE'].includes(error.code)));assert(changed);assert.equal(fs.readdirSync(f.parent).length,1);
}));
test('inventory enumeration closes its descriptor on read failure and does not accept partial rows',supported,()=>withFixture(f=>{
 f.write('a.ts');let closed=0;patch('opendirSync',original=>(file,...args)=>{const d=original(file,...args);if(file!==f.root)return d;return{readSync(){throw Object.assign(Error('READ'),{code:'EACCES'});},closeSync(){closed++;return d.closeSync();}};},()=>assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_UNAVAILABLE'}));assert.equal(closed,1);
}));
test('inventory count overflow is bounded without body reads and closes the iterator',supported,()=>withFixture(f=>{
 f.write('a.ts');let calls=0,closed=0;patch('opendirSync',original=>(file,...args)=>{if(file!==f.root)return original(file,...args);return{readSync(){calls++;return{name:'a.ts'};},closeSync(){closed++;}};},()=>assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_DIRECTORY_LIMIT'}));assert.equal(calls,TYPESCRIPT_TREE_LIMITS.files+TYPESCRIPT_TREE_LIMITS.directories+1);assert.equal(closed,1);
}));
test('@3 preserves existing complete installed hardlink semantics without copying aliases',supported,()=>withFixture(f=>{
 f.write('node_modules/pkg/a');fs.linkSync(path.join(f.root,'node_modules/pkg/a'),path.join(f.root,'node_modules/pkg/b'));fs.mkdirSync(path.join(f.root,'unused'));const options=fullOptions(f,['node_modules/pkg/a','node_modules/pkg/b']),result=materializeSealedTypeScriptTreeWithDirectories(options);
 assert.deepEqual(result.sourceAliasGroups,[['node_modules/pkg/a','node_modules/pkg/b']]);assert.notEqual(fs.statSync(path.join(result.root,'node_modules/pkg/a')).ino,fs.statSync(path.join(result.root,'node_modules/pkg/b')).ino);assert.equal(result.directoryCount,4);assert.equal(result.sealed,false);
}));

test('@3 invalid options or inventory refuse before any path inspection',()=>{
 let calls=0;patch('lstatSync',original=>(...args)=>{calls++;return original(...args);},()=>{
  for(const options of [null,{root:'/NO',parent:'/NO2',manifest:[['a','a'.repeat(64)]]},{root:'/NO',parent:'/NO2',manifest:[['a','a'.repeat(64)]],directoryInventory:{trust:true}},
   {root:'/NO',parent:'/NO2',manifest:[['a','a'.repeat(64)]],directoryInventory:inventory([['',[]]]),extra:true}])assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options));
 });assert.equal(calls,0);
});
test('file/directory collision and escaped topology cannot bind a copied namespace',()=>{
 for(const rows of [[['',[['a','file']]],['a',[]]],[['',[['a','directory']]],['a',[['b','directory']]],['a/b',[]],['a/b/../c',[]]],
  [['',[['a','directory']]],['a',[]],['z',[]]],[['',[['a','directory']]],['a',[['b','directory']]]]])assert.throws(()=>validateSealedTypeScriptDirectoryInventory(inventory(rows)),{code:'TREE_DIRECTORY_MANIFEST'});
});
test('full directory data are separately bounded and malformed counts cannot cause reads',()=>{
 const good=inventory([['',[]]]);for(const patch of [{directoryCount:100001},{entryCount:200001},{directoryCount:-1},{entryCount:NaN},{digest:'A'.repeat(64)},{directoryCount:'1'}])assert.throws(()=>validateSealedTypeScriptDirectoryInventory({...good,...patch}),{code:'TREE_DIRECTORY_MANIFEST'});
});
test('@3 preserves fully declared internal npm shim topology and empty bin siblings',supported,()=>withFixture(f=>{
 const target='node_modules/typescript/bin/tsc',rel='node_modules/.bin/tsc',link='../typescript/bin/tsc';f.write(target,'// nonsecret compiler fixture',0o755);fs.mkdirSync(path.join(f.root,'node_modules/.bin'));fs.mkdirSync(path.join(f.root,'node_modules/.bin/empty'));fs.symlinkSync(link,path.join(f.root,rel));
 const manifest=[[rel,hash(canonical({kind:'npm-file-shim',target,content:f.typed(target),links:[{path:rel,targetHash:hash(link)}]}))],[target,f.typed(target)]],directoryInventory=captureSealedTypeScriptDirectoryInventory(f.root);
 const result=materializeSealedTypeScriptTreeWithDirectories({root:f.root,parent:f.parent,manifest,directoryInventory});assert.equal(fs.readlinkSync(path.join(result.root,rel)),link);assert(fs.statSync(path.join(result.root,'node_modules/.bin/empty')).isDirectory());assert.equal(result.materializedDirectoryInventoryDigest,directoryInventory.digest);
}));
test('source membership mutation while the final copied inventory is read is rejected by the late source barrier',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);let changed=false;
 patch('realpathSync',original=>(file,...args)=>{const value=original(file,...args);if(!changed&&typeof file==='string'&&file.startsWith(f.parent+'/redue-materialization-')&&file.endsWith('/empty')){changed=true;fs.mkdirSync(path.join(f.root,'late'));}return value;},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),{code:'TREE_DIRECTORY_CHANGED'}));assert(changed);
}));
test('stage membership mutation during the late source inventory recheck cannot publish success',supported,()=>withFixture(f=>{
 f.write('a.ts');fs.mkdirSync(path.join(f.root,'empty'));const options=fullOptions(f,['a.ts']);let stageSeen=false,changed=false;
 patch('realpathSync',original=>(file,...args)=>{const value=original(file,...args);if(typeof file==='string'&&file.startsWith(f.parent+'/redue-materialization-')&&file.endsWith('/empty'))stageSeen=true;
  if(stageSeen&&!changed&&file===path.join(f.root,'empty')){changed=true;const stage=path.join(f.parent,fs.readdirSync(f.parent)[0]);fs.rmdirSync(path.join(stage,'empty'));}return value;},()=>assert.throws(()=>materializeSealedTypeScriptTreeWithDirectories(options),error=>['TREE_DIRECTORY_CHANGED','TREE_CHANGED','TREE_UNAVAILABLE'].includes(error.code)));assert(changed);
}));
test('metadata iterator close failure is UNKNOWN/refusal, not a complete inventory',supported,()=>withFixture(f=>{
 f.write('a.ts');patch('opendirSync',original=>(file,...args)=>{const d=original(file,...args);if(file!==f.root)return d;return{readSync:()=>d.readSync(),closeSync(){d.closeSync();throw Object.assign(Error('NONSECRET'),{code:'EIO'});}};},()=>assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_UNAVAILABLE'}));
}));
test('directory inventory refuses canonical aliases and overdeep owned topology',supported,()=>withFixture(f=>{
 f.write('a.ts');const alias=path.join(f.base,'alias');fs.symlinkSync(f.root,alias);assert.throws(()=>captureSealedTypeScriptDirectoryInventory(alias),{code:'TREE_PATH'});
 let current=f.root;for(let i=0;i<=TYPESCRIPT_TREE_LIMITS.depth;i++){current=path.join(current,'d');fs.mkdirSync(current);}assert.throws(()=>captureSealedTypeScriptDirectoryInventory(f.root),{code:'TREE_DIRECTORY_LIMIT'});
}));
