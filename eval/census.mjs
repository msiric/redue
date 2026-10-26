#!/usr/bin/env node
// Census of public TypeScript repos: what `redue init` makes of each, and how
// long its typecheck, lint, build and test scripts take. Research data for
// choosing what to support next; it records, it does not judge.
//
//   node eval/census.mjs --shard 3/20        # repos in eval/census-repos.json
//   node eval/census.mjs owner/name ...    # also with --shard
//   --init-only: skip the scripts; what init makes of each repo is the
//   progress metric, and running the scripts is what takes long.
//   --recorded: instead of timing, run the typecheck, lint and test scripts
//   twice each under REDUE's run recorder through the package manager
//   (eval/recorded-run.mjs), for a general Node-script recipe.
//   --product: instead of timing, let the product decide: `init --recipe
//   node-script`, then `redue run` twice for each typecheck, lint and test
//   check it writes, and the receipts and status after each. With
//   --all-recipes, plain `init` instead: every recipe, as `redue setup` uses. On Linux with
//   strace, each run is traced, and programs the recorder did not see are
//   listed per run (eval/program-check.mjs) and flagged. --keep-traces keeps
//   each run's strace output and run record under .local/eval/census-traces/.
//   --install-scripts installs as users do, with dependencies' install
//   scripts (esbuild's links its binary), on a disposable CI runner only.
//
// Clones the default branch, installs with the repo's package manager
// (through Corepack, install scripts skipped), runs `init --dry-run --json`
// plainly and with each direct recipe, then each script once (typecheck
// twice, to see a task cache). Writes .local/eval/census-*.json.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {checkoutRedue, evalDir, harnessEnv, localDir, readJson, sh, slug, stamp, tmpRoot} from './lib.mjs';
import {analyzeRun, compareRuns, hasStrace, recordedRun, snapshot} from './recorded-run.mjs';
import {unrecordedPrograms} from './program-check.mjs';
import {projectState} from '../src/project-location.mjs';

const argv = process.argv.slice(2);
const shardArg = argv.includes('--shard') ? argv[argv.indexOf('--shard') + 1] : null;
const initOnly = argv.includes('--init-only'), recorded = argv.includes('--recorded'), product = argv.includes('--product'),
  keepTraces = argv.includes('--keep-traces'), allRecipes = argv.includes('--all-recipes'),
  installScripts = argv.includes('--install-scripts');
let names = argv.filter((arg, i) => !arg.startsWith('-') && argv[i - 1] !== '--shard');
if (!names.length) names = readJson(path.join(evalDir, 'census-repos.json')).repos;
// Named repos are sharded too, so CI can rerun a list across its shards.
if (shardArg) { const [k, n] = shardArg.split('/').map(Number); names = names.filter((_, i) => i % n === k - 1); }
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
  const frozen = pm.locks.includes(pm.name), skip = flag => installScripts ? [] : [flag];
  switch (pm.name) {
    case 'npm': return run('npm', [frozen ? 'ci' : 'install', ...skip('--ignore-scripts'), '--no-audit', '--no-fund'], dir, 900_000);
    case 'pnpm': return run('corepack', ['pnpm', 'install', ...(frozen ? ['--frozen-lockfile'] : []), ...skip('--ignore-scripts')], dir, 900_000);
    case 'yarn': return pm.version && !pm.version.startsWith('1.') ?
      run('corepack', ['yarn', 'install', ...(frozen ? ['--immutable'] : []), ...skip('--mode=skip-build')], dir, 900_000) :
      run('corepack', ['yarn', 'install', ...(frozen ? ['--frozen-lockfile'] : []), ...skip('--ignore-scripts')], dir, 900_000);
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

// Each picked typecheck, lint and test script, run twice under the recorder
// through the project's package manager, with update notifications off.
function recordScripts(dir, pm, row) {
  const out = {strace: hasStrace};
  for (const kind of ['typecheck', 'lint', 'test']) {
    const script = row.scripts[kind];
    if (!script) continue;
    if (!row.install.pass) { out[kind] = {script: script.name, notRun: 'install failed'}; continue; }
    if (!['npm', 'pnpm', 'yarn'].includes(pm.name)) { out[kind] = {script: script.name, notRun: `package manager ${pm.name}`}; continue; }
    const argv = pm.name === 'npm' ? ['npm', 'run', script.name] : ['corepack', pm.name, 'run', script.name];
    const runEnv = {...env, npm_config_update_notifier: 'false'};
    const runs = [];
    let before = snapshot(dir);
    for (const n of [1, 2]) {
      const result = recordedRun({root: dir, argv, env: runEnv, timeout: 600_000, label: `${kind}${n}`});
      const after = snapshot(dir, before);
      runs.push({...result, ...analyzeRun(result, {root: dir, before, after, env: runEnv})});
      before = after;
    }
    const verdict = compareRuns(runs[0], runs[1]);
    out[kind] = {script: script.name, text: script.text, pass: runs.map(r => r.status === 0), timedOut: runs.some(r => r.timedOut),
      ms: runs.map(r => r.ms), reasons: verdict.reasons, qualifies: verdict.reasons.length === 0 && !runs.some(r => r.timedOut),
      shellCommands: runs[0].shellCommands, shellStatic: runs.every(r => r.shellStatic), envReads: runs[0].envReads,
      outputs: runs[0].outputs.size, tail: runs.find(r => r.tail)?.tail, earlierOutputs: verdict.earlierOutputs,
      examples: runs.map(r => r.examples), outsidePaths: runs.map(r => r.outsidePaths)};
    console.error(`  ${kind} ${script.name}: ${out[kind].qualifies ? 'QUALIFIES' : out[kind].reasons.join('; ') || 'timeout'}`);
  }
  return out;
}

// The general recipe as the product applies it: init's checks, two recorded
// runs each, and what the receipts and status say after each run.
function productRuns(dir, row) {
  // REDUE's own state location: a long --state-dir would not fit a Unix socket path.
  const config = path.join(dir, '.census.redue.json');
  const redue = (args, timeout = 120_000) => run(process.execPath, [checkoutRedue, '--config', config, ...args], dir, timeout);
  const json = r => { try { return JSON.parse(r.stdout); } catch { return null; } };
  const out = {};
  if (!row.install.pass) return {notRun: 'install failed'};
  const init = json(redue(['init', ...(allRecipes ? [] : ['--recipe', 'node-script']), '--json']));
  if (!init) return {error: 'init failed'};
  out.init = {issue: init.issue, pm: init.package_manager, pmVersion: init.version};
  const checks = (init.checks ?? []).filter(c => ['typecheck', 'lint', 'test'].includes(c.name));
  for (const c of checks) out[c.name] = {script: c.script, level: c.level, reason: c.level === 'ready' ? undefined : c.reason,
    recipe: c.level === 'ready' ? (c.reason || '').split(/[:;(]/)[0].trim() : undefined,
    text: readJson(path.join(dir, 'package.json')).scripts?.[c.script]};
  const ready = checks.filter(c => c.level === 'ready');
  if (!ready.length || !init.written) return out;
  redue(['start']);
  // The observer indexes the whole checkout first.
  const deadline = Date.now() + 600_000;
  let status = null;
  while (Date.now() < deadline) {
    status = json(redue(['status', '--sync', '--json'], 300_000));
    if (status?.observation?.healthy) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  if (!status?.observation?.healthy) {
    out.observer = status?.observation?.reason ?? 'unavailable';
    // A link the plan refused: where it leads, and the checks that matched it.
    const link = /symlink unsupported: (\S+)/.exec(out.observer)?.[1];
    if (link) {
      const at = path.join(dir, link), info = {};
      try { info.readlink = fs.readlinkSync(at); info.real = path.relative(dir, fs.realpathSync(at)); info.directory = fs.statSync(at).isDirectory(); } catch (e) { info.error = e.code; }
      try { info.checks = readJson(config).checks.map(c => ({name: c.name, qualification: c.qualification, workspace: c.workspace,
        installedInputs: (c.installedInputs ?? []).filter(p => !p.startsWith('!'))})); } catch {}
      out.observerLink = info;
    }
    redue(['stop']); redue(['remove-state']); return out;
  }
  for (const c of ready) {
    const runs = [];
    for (const n of [1, 2]) {
      // Files the run touched, for a run that is not stable.
      const mark = path.join(tmpRoot, 'census-run-mark');
      fs.writeFileSync(mark, '');
      // Traced on Linux: programs the recorder did not see.
      let r, unrecorded;
      if (hasStrace) {
        // Hard links stay on the state's file system.
        const state = projectState(fs.realpathSync(dir), config), work = fs.mkdtempSync(path.join(tmpRoot, 'census-trace-')),
          trace = path.join(work, 'strace'), copy = fs.mkdtempSync(path.join(path.dirname(state), 'census-record-'));
        const keeper = spawn(process.execPath, [path.join(evalDir, 'record-keeper.mjs'), state, copy], {stdio: 'ignore'});
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
        // -D: strace is not the run's parent, so a detached descendant does not hold the run open.
        r = sh('strace', ['-D', '-f', '-qq', '-s', '4096', '-e', 'trace=execve,execveat,clone,clone3,fork,vfork', '-o', trace,
          process.execPath, checkoutRedue, '--config', config, 'run', c.name, '--json'], {cwd: dir, env, timeout: 600_000});
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
        keeper.kill();
        unrecorded = unrecordedPrograms(trace, copy) ?? 'trace or record unavailable';
        if (keepTraces) {
          const kept = path.join(localDir, 'census-traces', slug(row.name), `${c.name}-${n}`);
          fs.mkdirSync(kept, {recursive: true});
          try { fs.copyFileSync(trace, path.join(kept, 'strace')); fs.cpSync(copy, path.join(kept, 'record'), {recursive: true}); } catch {}
        }
        fs.rmSync(work, {recursive: true, force: true}); fs.rmSync(copy, {recursive: true, force: true});
      } else r = redue(['run', c.name, '--json'], 600_000);
      const touched = () => run('find', ['.', '-newer', mark, '-not', '-path', './.git/*', '-not', '-name', '.census.redue.json'], dir)
        .stdout.split('\n').filter(Boolean).slice(0, 40);
      const now = json(redue(['status', '--sync', '--json'], 300_000))?.checks?.find(x => x.name === c.name);
      let receipt = null; try { receipt = readJson(path.join(projectState(fs.realpathSync(dir), config), 'receipts-v1.json')).checks?.[c.name]; } catch {}
      runs.push({exit: r.status, timedOut: r.timedOut, ms: r.ms, result: receipt?.result ?? null, stable: receipt?.stable ?? null,
        guardIssues: receipt?.guardIssues ?? null, checkpointIssues: receipt?.checkpoint?.issues ?? null, fingerprint: receipt?.fingerprint ?? null,
        freshness: now?.freshness ?? null, reason: now?.reason ?? null, tail: r.status === 0 ? undefined : tail(r, 300),
        touched: receipt?.stable === false ? touched() : undefined, unrecorded});
      // Critical when the run was trusted anyway: stable, with no guard issue.
      const trusted = receipt?.stable === true && Array.isArray(receipt.guardIssues) && !receipt.guardIssues.length;
      if (unrecorded?.length) {
        // A trusted run the check could not cover does not count as checked.
        runs.at(-1).unrecordedCritical = trusted;
        console.error(`  ${runs.at(-1).unrecordedCritical ? 'CRITICAL ' : ''}UNRECORDED PROGRAMS in ${c.name} run ${n}: ${typeof unrecorded === 'string' ? unrecorded : unrecorded.map(u => `${u.how} ${u.program}`).join(', ')}`);
      }
    }
    const [first, second] = runs;
    // A trusted run that started a program the recorder missed does not
    // qualify. Recipes that do not record (direct TypeScript) have no guard issues.
    const qualifies = !runs.some(x => x.timedOut || x.unrecordedCritical) && second.stable === true && !(second.guardIssues ?? []).length &&
      second.freshness === 'CURRENT' && first.fingerprint !== null && first.fingerprint === second.fingerprint;
    Object.assign(out[c.name], {runs, qualifies, pass: runs.map(x => x.result === 'PASS')});
    console.error(`  ${c.name} ${c.script}: ${qualifies ? 'QUALIFIES' : second.reason || 'not qualified'}`);
  }
  redue(['stop']);redue(['remove-state']);
  return out;
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
    if (!row.install.pass || initOnly || recorded || product) continue;
    row.timings[kind] = timeScript(dir, pm, picked[0], timeout);
  }
  if (row.timings.typecheck) row.timings.typecheckAgain = timeScript(dir, pm, row.scripts.typecheck.name, 600_000);
  if (recorded) row.recorded = recordScripts(dir, pm, row);
  if (product) row.product = productRuns(dir, row);
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
