#!/usr/bin/env node
// The census progress metric: of the repos with a root package.json, how many
// have a typecheck and a test check that `redue init` makes ready, at the root
// or in any workspace. Reads census-*.json files (CI shard artifacts).
//
//   node eval/census-report.mjs DIR...
import fs from 'node:fs';
import path from 'node:path';

const rows = new Map();
for (const dir of process.argv.slice(2))
  for (const file of fs.readdirSync(dir, {recursive: true}).filter(f => /census-.*\.json$/.test(path.basename(String(f)))))
    for (const row of JSON.parse(fs.readFileSync(path.join(dir, String(file)), 'utf8'))) rows.set(row.name, row);

// A chain's parts are NAME.1 ... NAME.n.
const kind = (name, words) => words.some(word => name.replace(/\.\d+$/, '') === word || name.replace(/\.\d+$/, '').endsWith(':' + word));
const typecheck = ['typecheck', 'type-check', 'check-types', 'types', 'tsc'], test = ['test', 'test:unit'];
const node = [...rows.values()].filter(row => row.error !== 'no root package.json');
const ready = (row, words) => ['plain', 'typescript', 'tests'].flatMap(k => row.init?.[k]?.checks ?? [])
  .filter(check => check.level === 'ready' && kind(check.name, words));
const count = (words, root) => node.filter(row => ready(row, words).some(check => !root || !check.name.includes(':'))).length;
console.log(`repos ${rows.size}, with a root package.json ${node.length}, errors ${node.filter(row => row.error).length}`);
console.log(`typecheck ready: ${count(typecheck)} (at the root ${count(typecheck, true)})`);
console.log(`tests ready: ${count(test)} (at the root ${count(test, true)})`);

// `census.mjs --recorded` rows: per check type, how many scripts would qualify
// for a general recipe (both recorded runs clean, same inputs), and why the
// rest do not. "Outside file read" is a separate tier: small files outside the
// checkout that REDUE could keep by content.
const recordedRows = node.filter(row => row.recorded);
if (recordedRows.length) {
  const tier = reason => reason.startsWith('outside file read:');
  // Package-manager launchers: pnpm's .bin shell shims run sed, uname and
  // dirname before exec'ing node; Corepack's pnpm runs ps and pnpm-native.
  const shell = argv => /^(\/(usr\/)?bin\/)?(sh|bash|dash)$/.test((argv || '').split(' ')[0]);
  const launcher = p => ['sed', 'uname', 'dirname', 'cygpath'].includes(p.program) && p.parent && !shell(p.parentArgv) ||
    ['ps', 'pnpm-native'].includes(p.program) && /corepack pnpm|bin\/pnpm/.test(p.parentArgv || '');
  const installedNative = p => /\/node_modules\//.test((p.argv || '').split(' ')[0]);
  const excused = (r, allowed) => {
    const programs = (r.examples ?? []).flatMap(e => e.programs ?? []);
    const ok = name => programs.filter(p => p.program === name).every(allowed);
    return !r.timedOut && r.reasons.every(reason => tier(reason) || reason.startsWith('runs ') && ok(reason.slice(5)));
  };
  for (const kindName of ['typecheck', 'lint', 'test']) {
    const all = recordedRows.map(row => [row, row.recorded[kindName]]).filter(([, r]) => r);
    const ran = all.filter(([, r]) => !r.notRun);
    const strict = ran.filter(([, r]) => r.qualifies);
    const facts = ran.filter(([, r]) => !r.timedOut && r.reasons.every(tier));
    const passing = list => list.filter(([, r]) => r.pass?.every(Boolean)).length;
    const launchers = ran.filter(([, r]) => excused(r, launcher)), native = ran.filter(([, r]) => excused(r, p => launcher(p) || installedNative(p)));
    console.log(`\n${kindName}: ${all.length} scripts, ${ran.length} run, qualify ${strict.length} (${passing(strict)} passing)` +
      `, with small outside files kept by content ${facts.length} (${passing(facts)} passing)` +
      `, and package-manager launchers ${launchers.length} (${passing(launchers)} passing)` +
      `, and native programs from installed packages ${native.length} (${passing(native)} passing)`);
    const counts = new Map();
    for (const [, r] of ran) for (const reason of new Set([...(r.timedOut ? ['timed out'] : []), ...r.reasons]))
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    for (const [reason, n] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(n).padStart(3)}  ${reason}`);
    const notRun = new Map();
    for (const [, r] of all.filter(([, r]) => r.notRun)) notRun.set(r.notRun, (notRun.get(r.notRun) ?? 0) + 1);
    if (notRun.size) console.log(`  not run: ${[...notRun].map(([k, n]) => `${k} ${n}`).join(', ')}`);
  }
}
