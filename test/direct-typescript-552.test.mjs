// Run the same positive/adversarial contract suite against the newly reviewed
// official implementation. This is test selection, never product auto-selection.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
test('TypeScript 5.5.2 obeys the existing direct and guarded-discovery contract',()=>{
 const compiler=path.resolve('test/fixtures/typescript-5-5-2/node_modules/typescript');
 assert.equal(JSON.parse(fs.readFileSync(path.join(compiler,'package.json'))).version,'5.5.2',
  'Run npm test (or its pretest fixture installation) before this isolated suite');
 assert.equal(JSON.parse(fs.readFileSync('node_modules/typescript/package.json')).version,'5.6.3');
 if(process.platform!=='win32')assert.equal(fs.realpathSync('node_modules/.bin/tsc'),
  fs.realpathSync('node_modules/typescript/bin/tsc'),'fixture must not replace the main compiler shim');
 // Each declared macOS case belongs to one explicit group. Prove the partition
 // with this actual Node process before running real suites. Registration-only
 // does not execute fixtures, compiler checks, or observers.
 const cleanEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>
  !['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID','REDUE_TEST_DIRECT_GROUP','REDUE_TEST_DIRECT_REGISTRATION'].includes(key)));
 const names={};
 for(const group of ['all','discovery','recording']){
  const r=spawnSync(process.execPath,['test/macos-direct-probe.test.mjs'],{
   env:{...cleanEnv,REDUE_TEST_DIRECT_GROUP:group,REDUE_TEST_DIRECT_REGISTRATION:'1'},
   encoding:'utf8',timeout:10000,maxBuffer:1e6});
  assert.equal(r.status,0,`registration ${group}: ${r.error?.code||r.signal||''}\n${r.stdout}${r.stderr}`);
  names[group]=JSON.parse(r.stdout);assert(Array.isArray(names[group]));
 }
 assert.equal(names.all.length,11,'every existing direct macOS case remains declared');
 assert.equal(names.discovery.length,8);assert.equal(names.recording.length,3);
 assert.equal(new Set([...names.discovery,...names.recording]).size,names.all.length,'no case executes in both groups');
 assert.deepEqual([...names.discovery,...names.recording].sort(),[...names.all].sort(),'no case is lost');
 // Separate harness envelopes retain the same 180-second limit. Execution uses
 // no name patterns; injected registration-only/group controls are removed.
 const groups=[
  ['test/direct-typescript.test.mjs',null],
  ['test/macos-direct-probe.test.mjs','discovery'],
  ['test/macos-direct-probe.test.mjs','recording'],
 ];
 for(const [file,group] of groups){
  const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',
   file],{
   env:{...cleanEnv,...(group?{REDUE_TEST_DIRECT_GROUP:group}:{}),REDUE_TEST_COMPILER_PACKAGE:compiler},
   encoding:'utf8',timeout:180000,maxBuffer:8e6});
  assert.equal(r.status,0,`${file} ${group||'all'}: ${r.error?.code||r.signal||''}\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout,/# tests [1-9][0-9]*/,'nested suite must actually execute');
 }
});
