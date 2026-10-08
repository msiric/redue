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
 // Bound each constituent suite independently. The expanded recording tests
 // exceeded the former combined 180-second test-harness envelope on CI; no
 // product operation deadline or test assertion is relaxed.
 for(const file of ['test/direct-typescript.test.mjs','test/macos-direct-probe.test.mjs']){
  const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',file],{
   env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),REDUE_TEST_COMPILER_PACKAGE:compiler},
   encoding:'utf8',timeout:180000,maxBuffer:8e6});
  assert.equal(r.status,0,`${file}: ${r.error?.code||r.signal||''}\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout,/# tests [1-9][0-9]*/,'nested suite must actually execute');
 }
});
