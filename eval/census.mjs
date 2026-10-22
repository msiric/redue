#!/usr/bin/env node
// Census of public TypeScript repos: what `redue init` makes of each, and how
// long its typecheck, lint, build and test scripts take. Research data for
// choosing what to support next; it records, it does not judge.
//
//   node eval/census.mjs --shard 3/20        # repos in eval/census-repos.json
//   node eval/census.mjs owner/name ...
//   --init-only: skip the scripts; what init makes of each repo is the
//   progress metric, and running the scripts is what takes long.
//
// Clones the default branch, installs with the repo's package manager
// (through Corepack, install scripts skipped), runs `init --dry-run --json`
// plainly and with each direct recipe, then each script once (typecheck
// twice, to see a task cache). Writes .local/eval/census-*.json.
import fs from 'node:fs';
import path from 'node:path';
import {checkoutRedue, evalDir, harnessEnv, localDir, readJson, sh, slug, stamp, tmpRoot} from './lib.mjs';

const argv = process.argv.slice(2);
const shardArg = argv.includes('--shard') ? argv[argv.indexOf('--shard') + 1] : null;
const initOnly = argv.includes('--init-only');
let names = argv.filter((arg, i) => !arg.startsWith('-') && argv[i - 1] !== '--shard');
if (!names.length) {
  names = readJson(path.join(evalDir, 'census-repos.json')).repos;
  if (shardArg) { const [k, n] = shardArg.split('/').map(Number); names = names.filter((_, i) => i % n === k - 1); }
}
const env = harnessEnv({COREPACK_ENABLE_DOWNLOAD_PROMPT: '0', COREPACK_ENABLE_STRICT: '0', HUSKY: '0',
  NEXT_TELEMETRY_DISABLED: '1', TURBO_TELEMETRY_DISABLED: '1', NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_TUI: 'false'});
const run = (cmd, args, cwd, timeout) => sh(cmd, args, {cwd, env, timeout});
const tail = (r, n = 600) => (r.stderr + '\n' + r.stdout).trim().slice(-n);

function packageManager(dir, pkg) {
  const declared = typeof pkg.packageManager === 'string' ? pkg.packageManager.split('@') : null;
  const has = file => fs.existsSync(path.join(dir, file));
  const locks = [has('package-lock.json') || has('npm-shrinkwrap.json') ? 'npm' : null, has('pnpm-lock.yaml') ? 'pnpm' : null,
    has('yarn.lock') ? 'yarn' : null, has('bun.lock') || has('bun.lockb') ? 'bun' : null].filter(Boolean);
  return {name: declared?.[0] ?? (locks.length === 1 ? locks[0] : locks.length ? 'conflict' : 'npm'), version: declared?.[1]?.split('+')[0] ?? null, locks};
}

function install(dir, pm) {
  const frozen = pm.locks.includes(pm.name);
  switch (pm.name) {
    case 'npm': return run('npm', [frozen ? 'ci' : 'install', '--ignore-scripts', '--no-audit', '--no-fund'], dir, 900_000);
    case 'pnpm': return run('corepack', ['pnpm', 'install', ...(frozen ? ['--frozen-lockfile'] : []), '--ignore-scripts'], dir, 900_000);
    case 'yarn': return pm.version && !pm.version.startsWith('1.') ?
      run('corepack', ['yarn', 'install', ...(frozen ? ['--immutable'] : []), '--mode=skip-build'], dir, 900_000) :
      run('corepack', ['yarn', 'install', ...(frozen ? ['--frozen-lockfile'] : []), '--ignore-scripts'], dir, 900_000);
    default: return {status: null, ms: 0, stdout: '', stderr: `no installer for ${pm.name}`};
  }
}

function init(dir, ...args) {
  const r = run(process.execPath, [checkoutRedue, '--config', path.join(dir, '.census.redue.json'), 'init', '--dry-run', '--json', ...args], dir, 120_000);
  try {
    const out = JSON.parse(r.stdout);
    return {issue: out.issue, layout: out.installation_layout, pm: out.package_manager, pmVersion: out.version, workspaces: out.workspaces,
      ambiguous: out.ambiguous, checks: (out.checks ?? []).map(c => ({name: c.name, script: c.script, workspace: c.workspace, level: c.level, reason: c.reason}))};
  } catch { return {error: `exit ${r.status}: ${tail(r, 400)}`}; }
}

const scriptPick = {
  typecheck: s => s.find(([k]) => /^(type-?check|check-?types|types|tsc|lint:types|types:check|check:types?)$/.test(k)) ??
    s.find(([, v]) => /(^|[\s&;])(vue-)?tsc(\s|$)/.test(v) && !/--watch|-w\b/.test(v)),
  lint: s => s.find(([k]) => k === 'lint') ?? s.find(([k]) => /^lint:(js|ts|code|eslint)$/.test(k)),
  build: s => s.find(([k]) => k === 'build'),
  test: s => s.find(([k]) => k === 'test' || k === 'test:unit') ,
};
const cached = out => /FULL TURBO|cache hit, replaying|existing outputs match the cache|read the output from the cache|\[local cache\]/i.test(out);

function timeScript(dir, pm, name, timeout) {
  const runner = pm.name === 'npm' ? ['npm', ['run', name]] : ['corepack', [pm.name, 'run', name]];
  const r = run(runner[0], runner[1], dir, timeout);
  return {ms: r.ms, pass: r.status === 0, timedOut: r.signal === 'SIGTERM', cached: cached(r.stdout + r.stderr), tail: r.status === 0 ? undefined : tail(r, 300)};
}

function census(name) {
  const row = {name, started: new Date().toISOString()};
  const dir = path.join(tmpRoot, 'census', slug(name));
  fs.rmSync(dir, {recursive: true, force: true});
  const clone = run('git', ['clone', '-q', '--depth', '1', `https://github.com/${name}.git`, dir], tmpRoot, 600_000);
  if (clone.status !== 0) return {...row, error: `clone: ${tail(clone, 300)}`};
  row.commit = run('git', ['rev-parse', 'HEAD'], dir).stdout.trim();
  let pkg;
  try { pkg = readJson(path.join(dir, 'package.json')); } catch { return {...row, error: 'no root package.json'}; }
  const pm = row.pm = packageManager(dir, pkg);
  const inst = install(dir, pm);
  row.install = {ms: inst.ms, pass: inst.status === 0, tail: inst.status === 0 ? undefined : tail(inst, 500)};
  const version = file => { try { return readJson(path.join(dir, 'node_modules', file, 'package.json')).version; } catch { return null; } };
  row.installed = {typescript: version('typescript'), vitest: version('vitest'), jest: version('jest'), eslint: version('eslint')};
  row.init = {plain: init(dir), typescript: init(dir, '--recipe', 'typescript-direct', '--check', 'typecheck'),
    tests: init(dir, '--recipe', 'tests-direct', '--check', 'test')};
  const scripts = Object.entries(pkg.scripts ?? {});
  // The root script init picked (a direct recipe's pick first), else a name match.
  const initPick = kind => [row.init.tests, row.init.typescript, row.init.plain].flatMap(r => r.checks ?? [])
    .find(c => c.name === kind && !c.workspace && pkg.scripts?.[c.script])?.script;
  row.scripts = {}; row.timings = {};
  for (const [kind, timeout] of [['build', 900_000], ['typecheck', 600_000], ['lint', 600_000], ['test', 600_000]]) {
    const picked = initPick(kind) ? [initPick(kind), pkg.scripts[initPick(kind)]] : scriptPick[kind](scripts);
    if (!picked) continue;
    row.scripts[kind] = {name: picked[0], text: picked[1]};
    if (!row.install.pass || initOnly) continue;
    row.timings[kind] = timeScript(dir, pm, picked[0], timeout);
  }
  if (row.timings.typecheck) row.timings.typecheckAgain = timeScript(dir, pm, row.scripts.typecheck.name, 600_000);
  fs.rmSync(dir, {recursive: true, force: true});
  return row;
}

fs.mkdirSync(path.join(tmpRoot, 'census'), {recursive: true});
fs.mkdirSync(localDir, {recursive: true});
const file = path.join(localDir, `census-${shardArg ? shardArg.replace('/', 'of') + '-' : ''}${stamp()}.json`);
const rows = [];
for (const name of names) {
  process.stderr.write(`census ${name} ...\n`);
  try { rows.push(census(name)); } catch (error) { rows.push({name, error: String(error.message).split('\n')[0]}); }
  const r = rows.at(-1);
  console.log([r.name, r.error ?? '', r.pm?.name ?? '', r.install ? `install ${r.install.pass ? 'ok' : 'FAIL'} ${r.install.ms} ms` : '',
    ...Object.entries(r.timings ?? {}).map(([k, t]) => `${k} ${t.pass ? 'ok' : t.timedOut ? 'timeout' : 'fail'} ${t.ms} ms`)].filter(Boolean).join('  '));
  fs.writeFileSync(file, JSON.stringify(rows, null, 1) + '\n');
}
console.log(`\nwrote ${file}`);
