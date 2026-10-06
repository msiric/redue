// The workflow selects the official Node 22.13.0 distribution, which bundles
// reviewed npm 10.9.2. npm self-installations can introduce internal symlinks
// outside the existing npm toolchain contract; do not alter that contract here.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
function run(argv){const launch=windowsLaunch(argv),r=spawnSync(launch.file,launch.args,
  {...launch.options,env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
  assert.equal(r.status,0,r.error?.message);return r.stdout;}
assert.equal(run([findExecutable('npm'),'--version']).trim(),'10.9.2');
run([process.execPath,'--test','test/npm-proxy-relevance.test.mjs']);
run([process.execPath,'--test','--test-name-pattern=npm 10.9.2 proxy','test/onboarding.test.mjs']);
run([process.execPath,'test/acceptance/package-smoke.mjs',...process.argv.slice(2),'--proxy-context']);
