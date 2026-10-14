// Harmless registrar tests exercise actual Node selection, not compiler/runtime
// acceptance. They retain the current fixture names but execute no fixture body.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {directTypeScriptFixtureGroups} from './helpers/direct-typescript-fixture-groups.mjs';
const suite='test/macos-direct-probe.test.mjs';
const names=[...fs.readFileSync(new URL('./macos-direct-probe.test.mjs',import.meta.url),'utf8').matchAll(/^test\('([^']+)'/gm)].map(m=>m[1]);
function registrar(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'redue-fixture-selection-')),file=path.join(root,'registrar.test.mjs');
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(file,"import test from 'node:test';\n"+names.map(name=>'test('+JSON.stringify(name)+",()=>console.log('FIXTURE_BODY:'+"+JSON.stringify(name)+"));").join('\n'));
 return selection=>{
  const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',...selection,file],{
   env:Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),encoding:'utf8',timeout:10000,maxBuffer:100000});
  assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.equal(r.status,0,r.stderr+r.stdout);
  return r.stdout.split('\n').filter(line=>line.startsWith('# FIXTURE_BODY:')).map(line=>line.slice('# FIXTURE_BODY:'.length));
 };
}
test('negative name-pattern matches the enclosing file and admits recording children',t=>{
 const run=registrar(t);assert(names.length>0);assert.deepEqual(run(['--test-name-pattern','^(?!(?:wrapped |actual compiler interval ))']),names);
});
test('fixed complementary groups execute every current macOS fixture exactly once',t=>{
 const run=registrar(t),groups=directTypeScriptFixtureGroups.filter(([file])=>file===suite);
 assert.equal(groups.length,2);assert.equal(new Set(names).size,names.length);
 const selected=groups.map(([,selection])=>run(selection)),recording=names.filter(name=>/^(?:wrapped |actual compiler interval )/.test(name));
 assert(recording.length>0);assert.deepEqual(selected[0],names.filter(name=>!recording.includes(name)));assert.deepEqual(selected[1],recording);
 const counts=new Map(names.map(name=>[name,0]));for(const group of selected)for(const name of group){assert(counts.has(name));counts.set(name,counts.get(name)+1);}
 assert.deepEqual([...counts.values()],names.map(()=>1));
 assert.deepEqual(directTypeScriptFixtureGroups.filter(([file])=>file!==suite),[['test/direct-typescript.test.mjs',[]]]);
});
