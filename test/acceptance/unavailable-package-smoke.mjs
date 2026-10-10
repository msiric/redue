// Install the exact artifact; run boundary tests through its public CLI module.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readArtifact} from './package-artifact.mjs';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
const at=process.argv.indexOf('--manifest');assert(at>=0);
const artifact=readArtifact(path.resolve(process.argv[at+1]));
const prefix=fs.mkdtempSync(path.join(os.tmpdir(),'redue-unavailable-package-'));
const binary=path.join(prefix,...(process.platform==='win32'?[]:['lib']),
  'node_modules',...artifact.metadata.name.split('/'),'bin','redue.mjs');
function call(argv,env=process.env){const c=windowsLaunch(argv),r=spawnSync(c.file,c.args,
  {...c.options,env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
  assert.equal(r.status,0,r.error?.message||r.signal);}
try{
  call([findExecutable('npm'),'install','--global','--prefix',prefix,artifact.file,
    '--no-audit','--no-fund','--registry=https://registry.npmjs.org']);
  assert(fs.existsSync(binary));
  call([process.execPath,'--test','--test-concurrency=1','test/run-ownership.test.mjs',
    'test/unavailable-direct-run.test.mjs'],{...process.env,REDUE_UNAVAILABLE_TEST_BIN:binary});
  console.log(JSON.stringify({sha256:artifact.sha256,platform:process.platform,
    unavailableOptimizationEnabled:process.platform==='darwin'}));
}finally{fs.rmSync(prefix,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
