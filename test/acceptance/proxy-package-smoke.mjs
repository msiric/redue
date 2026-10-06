// Pin the reviewed npm interpretation in an owned prefix on every package OS.
// This is test setup, not a product/global package-manager change.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-proxy-npm-'));
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
function run(argv,selectedEnv=env){const launch=windowsLaunch(argv),r=spawnSync(launch.file,launch.args,
  {...launch.options,env:selectedEnv,stdio:'inherit',timeout:180000});assert.equal(r.status,0,r.error?.message);}
try{
  run([findExecutable('npm'),'install','--global','--prefix',base,'npm@10.9.2','--no-audit','--no-fund']);
  const key=Object.keys(env).find(key=>key.toLowerCase()==='path')||'PATH';
  const selected={...env,[key]:path.join(base,process.platform==='win32'?'':'bin')+path.delimiter+env[key]};
  run([process.execPath,'--test','--test-name-pattern=npm 10.9.2 proxy','test/onboarding.test.mjs'],selected);
  run([process.execPath,'test/acceptance/package-smoke.mjs',...process.argv.slice(2),'--proxy-context'],selected);
}finally{fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
