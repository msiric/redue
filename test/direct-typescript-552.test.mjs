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
 // Discovery and multi-run recording cases need independent harness envelopes.
 // Complementary patterns cover every macOS case exactly once; no product
 // operation deadline or assertion changes, and each group retains 180 seconds.
 const recording='(?:wrapped |actual compiler interval )';
 const groups=[
  ['test/direct-typescript.test.mjs',null],
  ['test/macos-direct-probe.test.mjs',`^(?!${recording})`],
  ['test/macos-direct-probe.test.mjs',`^${recording}`],
 ];
 for(const [file,pattern] of groups){
  const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',
   ...(pattern?['--test-name-pattern',pattern]:[]),file],{
   env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),REDUE_TEST_COMPILER_PACKAGE:compiler},
   encoding:'utf8',timeout:180000,maxBuffer:8e6});
  assert.equal(r.status,0,`${file} ${pattern||'all'}: ${r.error?.code||r.signal||''}\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout,/# tests [1-9][0-9]*/,'nested suite must actually execute');
 }
});
