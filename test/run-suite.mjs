// npm test: every test file, several at a time where there are cores to spare.
// Tests start observers and compilers, and some wait on timing (the 2 s racy
// window, probe deadlines, FSEvents history), so two cores stay free: a
// 3-core CI macOS runner runs one file at a time, a 4-core runner two, a
// larger machine four. REDUE_TEST_CONCURRENCY overrides. Extra arguments go
// to node --test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const files=fs.readdirSync('test').filter(name=>name.endsWith('.test.mjs')).sort().map(name=>path.join('test',name));
const concurrency=Number(process.env.REDUE_TEST_CONCURRENCY)||Math.max(1,Math.min(4,os.availableParallelism()-2));
// Children see the concurrency: the fixture suites allow more time when other
// files run beside them (helpers/direct-typescript-fixture-suite.mjs).
const result=spawnSync(process.execPath,['--test',`--test-concurrency=${concurrency}`,...process.argv.slice(2),...files],
  {stdio:'inherit',env:{...process.env,REDUE_TEST_CONCURRENCY:String(concurrency)}});
process.exitCode=result.status??1;
