#!/usr/bin/env node
// Replay a realistic agent cycle against a bench project and report latency,
// correctness of the returned states, and idle background work.
//
//   node bench/run.mjs <bench-dir> [--redue path/to/bin/redue.mjs] [--idle 20]
//                      [--repeat 3] [--enforce]
//
// Exit codes: 0 = states correct (budgets reported), 1 = wrong state or error,
// 3 = states correct but a budget missed (only with --enforce).
// Prints a human table and one machine-readable `BENCH_RESULT {...}` line.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cleanEnv, strippedKeys, keptNodeKeys} from './env.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const valueFlags = new Set(['--redue', '--idle', '--repeat']);
const positional = args.filter((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1]));
const dir = path.resolve(positional[0] || '');
const redue = path.resolve(flag('--redue', path.join(path.dirname(fileURLToPath(import.meta.url)), '../bin/redue.mjs')));
const idleSeconds = Number(flag('--idle', 20));
const repeat = Number(flag('--repeat', 3));
const enforce = args.includes('--enforce');
if (!fs.existsSync(path.join(dir, 'redue.config.json'))) {
  console.error('usage: node bench/run.mjs <bench-dir>  (create one with bench/setup.mjs)'); process.exit(2);
}

const profile = path.join(os.tmpdir(), `redue-bench-profile-${process.pid}.jsonl`);
const env = cleanEnv({REDUE_DECISION_PROFILE: '1', REDUE_DECISION_PROFILE_FILE: profile});
const tsc = path.join(dir, 'node_modules/typescript/lib/tsc.js');
const rows = [], failures = [];
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function exec(argv, {quiet = true} = {}) {
  const started = performance.now();
  const out = spawnSync(process.execPath, argv, {cwd: dir, env, encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024, stdio: quiet ? 'pipe' : 'inherit'});
  return {ms: performance.now() - started, status: out.status, stdout: out.stdout || '', stderr: out.stderr || ''};
}
const cli = (...argv) => exec([redue, ...argv]);
function timed(label, argv, times = 1) {
  const samples = [];
  let last;
  for (let i = 0; i < times; i++) {
    last = exec(argv);
    if (last.status !== 0) failures.push(`${label}: exit ${last.status}: ${last.stderr.slice(-400)}`);
    samples.push(last.ms);
  }
  rows.push([label, samples]);
  return {samples, last};
}
function state() {
  const out = cli('status', '--sync', '--json');
  try {
    const check = JSON.parse(out.stdout).checks[0];
    return `${check.freshness}/${check.result}/${check.reuse_eligible ? 'eligible' : 'not-eligible'}`;
  } catch { return `unreadable (exit ${out.status})`; }
}
function expect(label, wanted) {
  const got = state();
  const ok = got === wanted;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${got}${ok ? '' : ` (expected ${wanted})`}`);
  if (!ok) failures.push(`${label}: got ${got}, expected ${wanted}`);
}
const profileLines = () => fs.existsSync(profile) ? fs.readFileSync(profile, 'utf8').split('\n').filter(Boolean) : [];
const append = (file, text) => fs.appendFileSync(path.join(dir, file), text);
const restore = () => execFileSync('git', ['checkout', '-q', '--', 'src/m3.ts', 'docs/notes.md'], {cwd: dir});

const stripped = strippedKeys();
if (stripped.length) console.log(`Removed from benchmark environment: ${stripped.join(', ')}`);
const kept = keptNodeKeys();
if (kept.length) console.log(`Node settings kept: ${kept.map(key => `${key}=${process.env[key]}`).join(' ')}`);
console.log(`Bench: ${dir}\nREDUE: ${redue}\nNode ${process.version} on ${process.platform}/${process.arch}\n`);

cli('stop'); cli('remove-state');
try {
  timed('start observer', [redue, 'start']);
  const readyBy = Date.now() + 120000;
  while (Date.now() < readyBy) {
    const out = cli('status', '--json');
    try { const j = JSON.parse(out.stdout); if (j.observation?.healthy && j.observation?.phase === 'ready') break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }

  const plain = timed('plain tsc --noEmit', [tsc, '--noEmit'], repeat);
  timed('redue run (records baseline)', [redue, 'run', 'typecheck']);
  const run = timed('redue run (repeat)', [redue, 'run', 'typecheck'], repeat);
  const cached = timed('status (cached)', [redue, 'status', '--json'], 5);
  const sync = timed('status --sync (warm)', [redue, 'status', '--sync', '--json'], 5);
  console.log('States:');
  expect('after run', 'CURRENT/PASS/eligible');

  const before = profileLines().length;
  await new Promise(r => setTimeout(r, idleSeconds * 1000));
  const idleLines = profileLines().slice(before).map(l => { try { return JSON.parse(l.replace(/^REDUE_TIMING /, '')); } catch { return {}; } });
  const idleProbeLaunches = idleLines.filter(r => r.phase === 'daemon.probe_launch').length;

  append('docs/notes.md', `\nnote ${Date.now()}\n`);
  const unrelated = timed('status --sync (after unrelated edit)', [redue, 'status', '--sync', '--json']);
  expect('unrelated doc edit', 'CURRENT/PASS/eligible');
  append('src/m3.ts', `\nexport const touched${Date.now()} = 1;\n`);
  const relevant = timed('status --sync (after relevant edit)', [redue, 'status', '--sync', '--json']);
  expect('relevant source edit (immediately)', 'STALE/PASS/not-eligible');
  const edited = timed('redue run (after edit)', [redue, 'run', 'typecheck']);
  expect('after rerun', 'CURRENT/PASS/eligible');

  console.log('\nTimings (ms):');
  for (const [label, samples] of rows)
    console.log(`  ${label.padEnd(40)} median ${median(samples).toFixed(0).padStart(7)}   [${samples.map(s => s.toFixed(0)).join(', ')}]`);

  const result = {
    platform: `${process.platform}/${process.arch}`, node: process.version,
    plainTscMs: Math.round(median(plain.samples)),
    runMs: Math.round(median(run.samples)),
    runOverheadPct: Math.round((median(run.samples) / median(plain.samples) - 1) * 100),
    cachedStatusMs: Math.round(median(cached.samples)),
    warmSyncMs: Math.round(median(sync.samples)),
    warmSyncOverCachedMs: Math.round(median(sync.samples) - median(cached.samples)),
    unrelatedEditSyncMs: Math.round(unrelated.samples[0]),
    relevantEditSyncMs: Math.round(relevant.samples[0]),
    runAfterEditMs: Math.round(edited.samples[0]),
    runAfterEditOverheadPct: Math.round((edited.samples[0] / median(plain.samples) - 1) * 100),
    idleSeconds, idleProbeLaunches,
    statesCorrect: failures.length === 0,
  };
  const budgets = {
    'warm sync adds < 100 ms over cached status': result.warmSyncOverCachedMs < 100,
    'no probe processes while idle': idleProbeLaunches === 0,
    'redue run overhead < 10% of plain tsc': result.runOverheadPct < 10,
  };
  console.log('\nBudgets:');
  for (const [name, ok] of Object.entries(budgets)) console.log(`  ${ok ? 'met   ' : 'MISSED'} ${name}`);
  console.log(`\nBENCH_RESULT ${JSON.stringify({...result, budgets})}`);
  if (failures.length) { console.error('\nFailures:\n  ' + failures.join('\n  ')); process.exitCode = 1; }
  else if (enforce && Object.values(budgets).includes(false)) process.exitCode = 3;
} finally {
  try { restore(); } catch {}
  cli('stop');
  fs.rmSync(profile, {force: true});
}
