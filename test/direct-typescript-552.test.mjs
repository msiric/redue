// Run the same positive/adversarial contract suite against the newly reviewed
// official implementation. This is test selection, never product auto-selection.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('TypeScript 5.5.2 obeys the existing direct and guarded-discovery contract',()=>{
 const r=spawnSync(process.execPath,['--test','--test-concurrency=1',
  'test/direct-typescript.test.mjs','test/macos-direct-probe.test.mjs'],{
   env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),REDUE_TEST_COMPILER_PACKAGE:'typescript-5-5-2'},
   encoding:'utf8',timeout:180000,maxBuffer:8e6});
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.match(r.stdout,/# tests 1[0-9]/,'nested suite must actually execute');
});
