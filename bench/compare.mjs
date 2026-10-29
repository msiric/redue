#!/usr/bin/env node
// Run bench/run.mjs for several REDUE builds on one bench project, interleaved
// round by round so machine drift hits every build alike, and report medians.
//
//   node bench/compare.mjs <bench-dir> --build NAME=path/to/bin/redue.mjs ...
//        [--rounds 3] [--idle 20] [--repeat 3]
//        [--gate BASELINE=CANDIDATE] [--metrics M,M] [--budget M=LIMIT ...]
//
// --gate exits 1 when CANDIDATE returns a wrong state, launches a probe while
// idle, or is slower than BASELINE on one of --metrics by more than its
// tolerance below. --budget also exits 1 when CANDIDATE's median of M is not
// below LIMIT. Prints one `BENCH_COMPARE {...}` line.
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2);
const values = name => args.flatMap((a, i) => a === name ? [args[i + 1]] : []);
const one = (name, fallback) => values(name)[0] ?? fallback;
const valueFlags = new Set(['--build', '--rounds', '--idle', '--repeat', '--gate', '--metrics', '--budget']);
const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1])) || '');
const builds = values('--build').map(spec => {
  const at = spec.indexOf('=');
  return {name: spec.slice(0, at), redue: path.resolve(spec.slice(at + 1))};
});
const rounds = Number(one('--rounds', 3)), idle = one('--idle', '20'), repeat = one('--repeat', '3');
const gate = one('--gate', null)?.split('=');
if (!builds.length || builds.some(b => !b.name) || gate && gate.some(name => !builds.find(b => b.name === name))) {
  console.error('usage: node bench/compare.mjs <bench-dir> --build NAME=bin/redue.mjs ... [--gate BASE=CANDIDATE]');
  process.exit(2);
}
const metrics = ['plainTscMs', 'runMs', 'runOverheadPct', 'cachedStatusMs', 'warmSyncMs', 'warmSyncOverCachedMs',
  'unrelatedEditSyncMs', 'relevantEditSyncMs', 'runAfterEditMs', 'runAfterEditOverheadPct', 'idleProbeLaunches'];
// How much slower than the baseline a candidate may be. On GitHub's runners
// three-round medians of warm sync stayed within 20 ms between rounds, and run
// overhead within 7 points on Linux; on macOS runners run overhead swung by
// 50 points, so bench.yml checks it on Linux only. Metrics with one sample a
// round (after-edit timings) are reported, not checked.
const tolerance = {warmSyncOverCachedMs: 30, runOverheadPct: 5};
const checked = one('--metrics', 'warmSyncOverCachedMs,runOverheadPct').split(',');
const budgets = Object.fromEntries(values('--budget').map(spec => spec.split('=')).map(([key, limit]) => [key, Number(limit)]));
if (checked.some(key => !(key in tolerance)) || Object.entries(budgets).some(([key, limit]) => !metrics.includes(key) || !(limit > 0))) {
  console.error(`--metrics takes ${Object.keys(tolerance).join(', ')}; --budget takes METRIC=LIMIT`); process.exit(2);
}
const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run.mjs');
const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
const results = Object.fromEntries(builds.map(b => [b.name, []]));
const wrong = new Set();

for (let round = 0; round < rounds; round++) {
  // Rotate the order so no build always runs first.
  const order = builds.map((_, i) => builds[(i + round) % builds.length]);
  for (const build of order) {
    const out = spawnSync(process.execPath, [runner, dir, '--redue', build.redue, '--idle', idle, '--repeat', repeat],
      {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
    const line = (out.stdout || '').split('\n').find(l => l.startsWith('BENCH_RESULT '));
    const result = line ? JSON.parse(line.slice('BENCH_RESULT '.length)) : null;
    if (!result || out.status !== 0 || !result.statesCorrect) {
      wrong.add(build.name);
      console.log(`round ${round + 1} ${build.name}: FAILED (exit ${out.status})\n${(out.stdout + out.stderr).slice(-2000)}`);
      continue;
    }
    results[build.name].push(result);
    console.log(`round ${round + 1} ${build.name}: warm sync +${result.warmSyncOverCachedMs} ms, ` +
      `run ${result.runOverheadPct}%, run after edit ${result.runAfterEditOverheadPct}%, idle probes ${result.idleProbeLaunches}`);
  }
}

const summary = Object.fromEntries(builds.map(({name}) => [name, Object.fromEntries(metrics.map(key =>
  [key, results[name].length ? median(results[name].map(r => r[key])) : null]))]));
console.log('\nMedians:');
console.log(`  ${'metric'.padEnd(26)}${builds.map(b => b.name.padStart(12)).join('')}`);
for (const key of metrics) console.log(`  ${key.padEnd(26)}${builds.map(b => String(summary[b.name][key]).padStart(12)).join('')}`);

const problems = [];
if (gate) {
  const [base, candidate] = gate.map(name => summary[name]);
  if (wrong.has(gate[1]) || !results[gate[1]].length) problems.push(`${gate[1]} returned a wrong state or failed`);
  else {
    if (results[gate[1]].some(r => r.idleProbeLaunches > 0)) problems.push(`${gate[1]} launched probes while idle`);
    if (base.warmSyncMs !== null) for (const key of checked)
      if (candidate[key] > base[key] + tolerance[key])
        problems.push(`${key} ${candidate[key]} vs ${base[key]} for ${gate[0]} (allowed +${tolerance[key]})`);
    for (const [key, limit] of Object.entries(budgets))
      if (!(candidate[key] < limit)) problems.push(`${key} ${candidate[key]} (budget < ${limit})`);
  }
}
console.log(`\nBENCH_COMPARE ${JSON.stringify({rounds, summary, wrong: [...wrong], problems})}`);
if (problems.length) { console.error(`\nBlocked:\n  ${problems.join('\n  ')}`); process.exitCode = 1; }
