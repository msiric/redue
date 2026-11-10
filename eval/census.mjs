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
//   --all-recipes, plain `init` instead: every recipe, as `redue setup` uses;
//   with --compare-general also a second pass with the general recipe only,
//   and with --compare-direct one with the direct test recipe only (plain
//   `init` tries the sandbox first for tests).
//   After the runs, the project's build, test, typecheck and lint scripts run
//   plainly, and status is asked again (afterOthers). On Linux with
//   strace, each run is traced: for a recorded check, programs the recorder
//   did not see are listed (eval/program-check.mjs); for a sandboxed check,
//   reads the receipt does not hold (eval/sandbox-check.mjs). Either is flagged. --keep-traces keeps
//   each run's strace output and run record under .local/eval/census-traces/.
//   --build-first (with --product): run the project's build script once
//   before init, as a developer's checkout has it built.
//   --install-scripts installs as users do, with dependencies' install
//   scripts (esbuild's links its binary), on a disposable CI runner only.
//   --init-timing: only the plain `init --dry-run`, with up to an hour, and
//   how long it took (row.init.plain.ms): init runs each sandboxed check
//   inside and outside the sandbox first. --redue-version V runs that
//   published REDUE for it instead of this checkout's, to compare.
//   --sandbox: instead of timing, run the typecheck, lint, test and build
//   scripts plainly and inside OS sandboxes, alternated (eval/sandbox.mjs).
//
// Clones the default branch, installs with the repo's package manager
// (through Corepack, install scripts skipped), runs `init --dry-run --json`
// plainly and with each direct recipe, then each script once (typecheck
// twice, to see a task cache). Writes .local/eval/census-*.json.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {checkoutRedue, evalDir, harnessEnv, localDir, readJson, sh, slug, stamp, tmpRoot, entryPoint} from './lib.mjs';
import {analyzeRun, compareRuns, hasStrace, recordedRun, snapshot} from './recorded-run.mjs';
import {productChecks} from './product-runs.mjs';
import {sandboxModes, sandboxSuite} from './sandbox.mjs';
import {hiddenEntries, sandboxEnvironment} from '../src/sandbox.mjs';
import {testHiding} from './test-hiding.mjs';
import {supervisorCost} from './supervisor-cost.mjs';
import {runOverhead} from './run-overhead.mjs';
entryPoint(import.meta, {ci: true});

// --python: the Python census (eval/python-census.mjs), from the same workflow.
if (process.argv.includes('--python')) {
  const r = spawnSync(process.execPath, [path.join(evalDir, 'python-census.mjs'), ...process.argv.slice(2)], {stdio: 'inherit'});
  process.exit(r.status ?? 1);
}

const argv = process.argv.slice(2);
const shardArg = argv.includes('--shard') ? argv[argv.indexOf('--shard') + 1] : null;
const initOnly = argv.includes('--init-only'), recorded = argv.includes('--recorded'), product = argv.includes('--product'),
  initTiming = argv.includes('--init-timing'), keepTraces = argv.includes('--keep-traces'), allRecipes = argv.includes('--all-recipes'), testHidingMode = argv.includes('--test-hiding'), supervisorCostMode = argv.includes('--supervisor-cost'), overheadMode = argv.includes('--overhead'),
  installScripts = argv.includes('--install-scripts'), sandbox = argv.includes('--sandbox'), buildFirst = argv.includes('--build-first');
// --run-limit=SECONDS: each product `redue run`'s limit (default 600).
const runLimit = 1000 * (Number(argv.find(a => a.startsWith('--run-limit='))?.slice('--run-limit='.length)) || 600);
let names = argv.filter((arg, i) => !arg.startsWith('-') && !['--shard', '--redue-version'].includes(argv[i - 1]));
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

// --redue-version: that published REDUE, installed once (on CI runners only).
let initRedue = checkoutRedue;
if (argv.includes('--redue-version')) {
  const version = argv[argv.indexOf('--redue-version') + 1], prefix = path.join(tmpRoot, `redue-${version}`);
  const r = sh('npm', ['install', '--prefix', prefix, '--no-audit', '--no-fund', `@redue/cli@${version}`], {timeout: 300_000});
  if (r.status !== 0) throw Error(`cannot install @redue/cli@${version}: ${tail(r, 300)}`);
  initRedue = path.join(prefix, 'node_modules', '@redue', 'cli', 'bin', 'redue.mjs');
}
function init(dir, ...args) {
  const r = run(process.execPath, [initRedue, '--config', path.join(dir, '.census.redue.json'), 'init', '--dry-run', '--json', ...args], dir, initTiming ? 3_600_000 : 600_000);
  try {
    const out = JSON.parse(r.stdout), proposed = out.proposed_config?.checks ?? [];
    return {ms: r.ms, issue: out.issue, layout: out.installation_layout, pm: out.package_manager, pmVersion: out.version, workspaces: out.workspaces,
      ambiguous: out.ambiguous, checks: (out.checks ?? []).map(c => ({name: c.name, script: c.script, workspace: c.workspace, level: c.level, reason: c.reason,
        ...c.trial_runs ? {trial_runs: c.trial_runs} : {},
        // The failed trial's last sandboxed lines init kept in local state on this runner.
        ...(file => { if (!file) return {}; try { return {trial_tail: fs.readFileSync(file, 'utf8').split('\n').slice(0, 25)}; } catch { return {}; } })(
          /the sandboxed run's last lines are in (\S+?\.txt)/.exec(c.reason ?? '')?.[1]),
        qualification: proposed.find(p => p.name === c.name)?.qualification ?? null}))};
  } catch { return {ms: r.ms, timedOut: r.timedOut, error: `exit ${r.status}: ${tail(r, 400)}`}; }
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

// The product's recipes as it applies them: init's checks, two recorded runs
// each, and what the receipts and status say after each run (product-runs.mjs).
function productRuns(dir, row, recipeArgs = allRecipes ? [] : ['--recipe', 'node-script']) {
  // REDUE's own state location: a long --state-dir would not fit a Unix socket path.
  const config = path.join(dir, '.census.redue.json');
  const redue = (args, timeout = 120_000) => run(process.execPath, [checkoutRedue, '--config', config, ...args], dir, timeout);
  const json = r => { try { return JSON.parse(r.stdout); } catch { return null; } };
  const out = {};
  if (!row.install.pass) return {notRun: 'install failed'};
  // A second pass (--compare-general) writes its own config.
  fs.rmSync(config, {force: true});
  // --build-first: the project built once before init, as a developer's
  // checkout is (a monorepo's tests often import its packages' builds).
  if (buildFirst && row.scripts.build && !out.buildFirst) {
    const r = run(row.pm.name === 'npm' ? 'npm' : 'corepack', row.pm.name === 'npm' ? ['run', row.scripts.build.name] : [row.pm.name, 'run', row.scripts.build.name], dir, 900_000);
    out.buildFirst = {exit: r.status, ms: r.ms, timedOut: r.timedOut || false};
  }
  // init runs each sandboxed check inside and outside the sandbox: a large workspace's lint takes minutes.
  const initRun = redue(['init', ...recipeArgs, '--json'], 1_800_000), init = json(initRun);
  if (!init) return {error: 'init failed', initMs: initRun.ms, timedOut: initRun.timedOut};
  out.init = {ms: initRun.ms, issue: init.issue, pm: init.package_manager, pmVersion: init.version};
  const checks = (init.checks ?? []).filter(c => ['typecheck', 'lint', 'test'].includes(c.name.split(':')[0]));
  for (const c of checks) out[c.name] = {script: c.script, level: c.level, reason: c.level === 'ready' ? undefined : c.reason,
    recipe: c.level === 'ready' ? (c.reason || '').split(/[:;(]/)[0].trim() : undefined,
    text: readJson(path.join(dir, 'package.json')).scripts?.[c.script]};
  const ready = checks.filter(c => c.level === 'ready');
  if (!ready.length || !init.written) return out;
  // The project's other checks, run plainly in between: builds and tests write
  // git-ignored outputs.
  const pm = row.pm.name, others = ['build', 'test', 'typecheck', 'lint'].filter(kind => row.scripts[kind]).map(kind => ({label: kind,
    argv: pm === 'npm' ? ['npm', 'run', row.scripts[kind].name] : ['corepack', pm, 'run', row.scripts[kind].name], timeout: kind === 'build' ? 900_000 : 600_000}));
  const result = productChecks({dir, config, names: ready.map(c => c.name), env: {...env, npm_config_update_notifier: 'false'}, label: row.name, keepTraces, others, runLimit});
  if (result.others) out.others = result.others;
  if (result.changes) out.changes = result.changes;
  if (result.observer) return {...out, observer: result.observer, observerLink: result.observerLink};
  for (const [name, value] of Object.entries(result.checks)) Object.assign(out[name], value);
  return out;
}

// Each picked script through the project's package manager, plainly and
// sandboxed: same result, cost, and what it read outside the allowed places.
async function sandboxScripts(dir, pm, row, modes) {
  const out = {};
  for (const kind of ['typecheck', 'lint', 'test', 'build']) {
    const script = row.scripts[kind];
    if (!script || !row.install.pass || !['npm', 'pnpm', 'yarn'].includes(pm.name)) continue;
    const argv = pm.name === 'npm' ? ['npm', 'run', script.name] : ['corepack', pm.name, 'run', script.name];
    out[kind] = {script: script.name, text: script.text,
      ...await sandboxSuite({argv, cwd: dir, env: {...env, npm_config_update_notifier: 'false'}, timeout: kind === 'build' ? 900_000 : 600_000, modes})};
    console.error(`  ${kind} ${script.name}: plain ${out[kind].runs.plain.map(r => r.status).join('/')} ${Object.entries(out[kind].same).map(([m, same]) => `${m} ${same ? 'same' : 'DIFFERENT'}`).join(' ')}`);
  }
  return out;
}

async function census(name, modes) {
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
  // --hidden-stats: what sandbox-v2 would hide here, and the Landlock rules
  // that takes (landlock.py --hide's walk), printed before init runs.
  if (argv.includes('--hidden-stats')) {
    const entries = hiddenEntries(dir) ?? [], hidden = new Set(entries.map(rel => path.join(dir, rel.replace(/\/$/, ''))));
    const holders = new Set();
    for (const file of hidden) for (let at = path.dirname(file); !holders.has(at) && at !== path.dirname(at); at = path.dirname(at)) holders.add(at);
    let rules = 1;
    const grant = d => { let list; try { list = fs.readdirSync(d, {withFileTypes: true}); } catch { return; }
      for (const e of list) { const p = path.join(d, e.name); if (hidden.has(p) || e.isSymbolicLink()) continue; if (holders.has(p)) grant(p); else rules++; } };
    if (holders.has(dir)) grant(dir);
    row.hiddenStats = {entries: entries.length, rules, examples: entries.slice(0, 10)};
    console.log(`${name} hidden entries ${entries.length}, Landlock rules ${rules}`);
  }
  // With it, also memory, disk and the largest processes every 15 s while init runs.
  const monitor = argv.includes('--hidden-stats') ? spawn('sh', ['-c', 'while sleep 15; do date +%T; free -m | sed -n 2p; df -m / | tail -1; ps -eo rss,etime,args --sort=-rss | head -5 | cut -c1-160; done'],
    {stdio: ['ignore', 'inherit', 'inherit']}) : null;
  row.init = initTiming ? {plain: init(dir)} : {plain: init(dir), typescript: init(dir, '--recipe', 'typescript-direct', '--check', 'typecheck'),
    tests: init(dir, '--recipe', 'tests-direct', '--check', 'test')};
  if (initTiming) console.error(`  init ${row.init.plain.ms} ms${row.init.plain.timedOut ? ' (timed out)' : ''}: ${(row.init.plain.checks ?? []).map(c => `${c.name} ${c.qualification ?? c.level}`).join(', ')}`);
  monitor?.kill();
  const scripts = Object.entries(pkg.scripts ?? {});
  // The root script init picked (a direct recipe's pick first), else a name match.
  const initPick = kind => [row.init.tests, row.init.typescript, row.init.plain].flatMap(r => r?.checks ?? [])
    .find(c => c.name === kind && !c.workspace && pkg.scripts?.[c.script])?.script;
  row.scripts = {}; row.timings = {};
  for (const [kind, timeout] of [['build', 900_000], ['typecheck', 600_000], ['lint', 600_000], ['test', 600_000]]) {
    const picked = initPick(kind) ? [initPick(kind), pkg.scripts[initPick(kind)]] : scriptPick[kind](scripts);
    if (!picked) continue;
    row.scripts[kind] = {name: picked[0], text: picked[1]};
    if (!row.install.pass || initOnly || initTiming || recorded || product || sandbox || testHidingMode || supervisorCostMode || overheadMode) continue;
    row.timings[kind] = timeScript(dir, pm, picked[0], timeout);
  }
  if (row.timings.typecheck) row.timings.typecheckAgain = timeScript(dir, pm, row.scripts.typecheck.name, 600_000);
  if (recorded) row.recorded = recordScripts(dir, pm, row);
  if (product) row.product = productRuns(dir, row);
  // --overhead: each sandboxed check plain and through redue run (eval/run-overhead.mjs).
  if (overheadMode && row.install.pass && ['npm', 'pnpm', 'yarn'].includes(pm.name)) {
    row.overhead = runOverhead({dir, config: path.join(dir, '.census.redue.json'), env: {...env, npm_config_update_notifier: 'false'},
      plain: c => c.script ? [pm.name, 'run', c.script] : null});
    for (const [check, c] of Object.entries(row.overhead.checks ?? {})) console.error(`  overhead ${check}: plain ${c.median.plain} ms, redue run ${c.median.redue} ms, hook ${c.hook?.ms ?? '-'} ms (${c.hook?.decision ?? '-'})`);
    if (row.overhead.error) console.error(`  overhead: ${row.overhead.error}`);
  }
  // --supervisor-cost: the test script plain, sandboxed and supervised (eval/supervisor-cost.mjs).
  if (supervisorCostMode && row.install.pass && row.scripts.test && ['npm', 'pnpm', 'yarn'].includes(pm.name)) {
    const testArgv = pm.name === 'npm' ? ['npm', 'run', row.scripts.test.name] : ['corepack', pm.name, 'run', row.scripts.test.name];
    row.supervisorCost = {script: row.scripts.test.name, text: row.scripts.test.text, ...supervisorCost({dir, argv: testArgv,
      env: {...env, npm_config_update_notifier: 'false'}, check: {script: row.scripts.test.name, kind: 'test', environment: sandboxEnvironment(false, pm.name, 'test')}})};
    const c = row.supervisorCost;
    console.error(`  supervisor cost: plain ${c.median?.plain} ms, open ${c.median?.open} ms, supervised ${c.median?.supervised} ms; connects ${c.connects?.join('/')}; status ${JSON.stringify(c.status)}${c.issue ? ' ' + c.issue : ''}`);
  }
  // --test-hiding: the project's build, then its tests three ways (eval/test-hiding.mjs).
  if (testHidingMode && row.install.pass && row.scripts.test && ['npm', 'pnpm', 'yarn'].includes(pm.name)) {
    const script = name => pm.name === 'npm' ? ['npm', 'run', name] : ['corepack', pm.name, 'run', name];
    const testEnv = {...env, npm_config_update_notifier: 'false'};
    const build = row.scripts.build ? sh(script(row.scripts.build.name)[0], script(row.scripts.build.name).slice(1), {cwd: dir, env: testEnv, timeout: 900_000}) : null;
    row.testHiding = {script: row.scripts.test.name, text: row.scripts.test.text, build: build && {status: build.timedOut ? 'timeout' : build.status, ms: build.ms},
      ...testHiding({dir, argv: script(row.scripts.test.name), env: testEnv, timeout: 600_000,
        check: {script: row.scripts.test.name, kind: 'test', environment: sandboxEnvironment(false, pm.name)}})};
    const t = row.testHiding;
    console.error(`  tests: present ${t.present.status}${t.flaky ? ' (flaky)' : ''}, hidden ${t.hidden?.status ?? t.hiddenIssue ?? '-'}, clean ${t.clean?.status ?? '-'}; entries ${t.entries?.count ?? '-'}${t.existenceOnly ? '; EXISTENCE ONLY' : ''}`);
  }
  // --compare-general: the same repo again with the general recipe only, so
  // checks both recipes qualify can be compared.
  if (product && allRecipes && argv.includes('--compare-general')) row.productGeneral = productRuns(dir, row, ['--recipe', 'node-script']);
  if (product && allRecipes && argv.includes('--compare-direct')) row.productDirect = productRuns(dir, row, ['--recipe', 'tests-direct']);
  if (sandbox) row.sandbox = await sandboxScripts(dir, pm, row, modes);
  // A process the project left running can still be writing into it: keep the row.
  try { fs.rmSync(dir, {recursive: true, force: true, maxRetries: 5, retryDelay: 1000}); } catch (error) { row.cleanup = String(error.message).split('\n')[0]; }
  return row;
}

// --probe-network: what this runner allows a test sandbox (eval/sandbox/netprobe.py), and nothing else.
if (argv.includes('--probe-network')) {
  const probe = sh('python3', [path.join(evalDir, 'sandbox', 'netprobe.py')], {timeout: 300_000});
  console.log(probe.stdout || probe.stderr);
  fs.mkdirSync(localDir, {recursive: true});
  fs.writeFileSync(path.join(localDir, `netprobe-${process.platform}-${stamp()}.json`), probe.stdout || JSON.stringify({error: probe.stderr}));
  process.exit(0);
}
fs.mkdirSync(path.join(tmpRoot, 'census'), {recursive: true});
fs.mkdirSync(localDir, {recursive: true});
const file = path.join(localDir, `census-${shardArg ? shardArg.replace('/', 'of') + '-' : ''}${stamp()}.json`);
const rows = [];
const modes = sandbox ? sandboxModes() : null;
if (modes) console.error(`sandbox modes ${JSON.stringify(modes)}`);
for (const name of names) {
  process.stderr.write(`census ${name} ...\n`);
  try { rows.push(await census(name, modes)); } catch (error) { rows.push({name, error: String(error.message).split('\n')[0]}); }
  const r = rows.at(-1);
  console.log([r.name, r.error ?? '', r.pm?.name ?? '', r.install ? `install ${r.install.pass ? 'ok' : 'FAIL'} ${r.install.ms} ms` : '',
    ...Object.entries(r.timings ?? {}).map(([k, t]) => `${k} ${t.pass ? 'ok' : t.timedOut ? 'timeout' : 'fail'} ${t.ms} ms`)].filter(Boolean).join('  '));
  if (modes) r.sandboxModes = modes;
  fs.writeFileSync(file, JSON.stringify(rows, null, 1) + '\n');
}
console.log(`\nwrote ${file}`);
