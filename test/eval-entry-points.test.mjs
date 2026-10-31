import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Eval entry points: importing one never starts it, and the ones that run
// third-party code start only on a CI runner. Each check runs with an empty
// PATH, so a guard that failed could not reach git or a package manager.
const evalDir = path.resolve('eval');
const files = fs.readdirSync(evalDir).filter(file => file.endsWith('.mjs')).map(file => path.join(evalDir, file));
const text = file => fs.readFileSync(file, 'utf8');
const ci = ['census', 'python-census', 'run', 'screen', 'stranger', 'hidden-trial', 'group-run', 'pnpm-shim-templates', 'sandbox-nesting']
  .map(name => path.join(evalDir, `${name}.mjs`));
const env = {PATH: '', ...process.platform === 'win32' ? {SystemRoot: process.env.SystemRoot} : {}};

test('every eval file that exports nothing is a guarded entry point', () => {
  for (const file of files.filter(file => !/^export /m.test(text(file))))
    assert.match(text(file), /^entryPoint\(import\.meta/m, path.basename(file));
  for (const file of ci) assert.match(text(file), /entryPoint\(import\.meta, \{ci: true/, path.basename(file));
});

test('an entry point that runs third-party code refuses to start off a CI runner', () => {
  for (const file of ci) {
    const r = spawnSync(process.execPath, [file, 'owner/name'], {env, encoding: 'utf8', timeout: 30_000});
    assert.equal(r.status, 2, `${path.basename(file)}: ${r.stderr}`);
    assert.match(r.stderr, /runs third-party code .* runs only on a CI runner \(GITHUB_ACTIONS=true\)/, path.basename(file));
  }
});

test('importing an entry point throws before it starts, on a CI runner too', () => {
  for (const file of files.filter(file => text(file).includes('entryPoint(import.meta'))) {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(file).href)})`],
      {env: {...env, GITHUB_ACTIONS: 'true'}, encoding: 'utf8', timeout: 30_000});
    assert.notEqual(r.status, 0, path.basename(file));
    assert.match(r.stderr, /is a command: run it with node, do not import it/, path.basename(file));
  }
});

test('report.mjs stays importable for run.mjs', async () => {
  assert.equal(typeof (await import('../eval/report.mjs')).report, 'function');
});
