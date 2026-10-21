// Runs the shared direct-recipe contract suite against one reviewed compiler
// fixture. This is test selection, never product auto-selection.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {directTypeScriptFixtureGroups} from './direct-typescript-fixture-groups.mjs';

export function runFixtureSuite(version){
 const compiler=path.resolve(`test/fixtures/typescript-${version.replaceAll('.','-')}/node_modules/typescript`);
 assert.equal(JSON.parse(fs.readFileSync(path.join(compiler,'package.json'))).version,version,
  'Run npm test (or its pretest fixture installation) before this isolated suite');
 assert.equal(JSON.parse(fs.readFileSync('node_modules/typescript/package.json')).version,'5.6.3');
 if(process.platform!=='win32')assert.equal(fs.realpathSync('node_modules/.bin/tsc'),
  fs.realpathSync('node_modules/typescript/bin/tsc'),'fixture must not replace the main compiler shim');
 // A negative name-pattern matches the enclosing file test and therefore its
 // children. Skip the positive recording prefix for discovery instead. Both
 // groups keep every assertion and the same independent envelopes: 180 s, and
 // 300 s on Windows, whose runners took 108-180 s for the full group in
 // October 2026 with no code change behind the spread.
 for(const [file,selection] of directTypeScriptFixtureGroups){
  const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',
   ...selection,file],{
   env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),REDUE_TEST_COMPILER_PACKAGE:compiler},
   encoding:'utf8',timeout:process.platform==='win32'?300000:180000,maxBuffer:8e6});
  assert.equal(r.status,0,`${file} ${selection.join(' ')||'all'}: ${r.error?.code||r.signal||''}\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout,/# tests [1-9][0-9]*/,'nested suite must actually execute');
 }
}
