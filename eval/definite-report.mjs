#!/usr/bin/env node
// How often status gives a definite answer: of the checks `census.mjs
// --product` (and `--python --product`) set up and ran, the share whose
// status was CURRENT or STALE rather than UNVERIFIED, after the second
// recorded run and again after the project's other checks ran. Per
// ecosystem and runner, and per recipe. Reads census-*.json and
// python-census-*.json files (CI shard artifacts).
//
//   node eval/definite-report.mjs DIR...
import fs from 'node:fs';
import path from 'node:path';
import {entryPoint, readJson} from './lib.mjs';
entryPoint(import.meta);

const files = process.argv.slice(2).flatMap(dir => fs.readdirSync(dir, {recursive: true}).map(String)
  .filter(f => /(^|\/)(python-)?census-[^/]*\.json$/.test(f)).map(f => path.join(dir, f)));
const rows = [];
for (const file of files) {
  const ecosystem = /python-census/.test(path.basename(file)) ? 'Python' : 'TypeScript', os = /macos/.test(file) ? 'macOS' : 'Linux';
  for (const row of readJson(file)) {
    const product = row?.product;
    if (!product) continue;
    // Python rows keep checks by name; TypeScript rows by kind.
    const checks = product.checks ?? Object.fromEntries(Object.entries(product).filter(([, value]) => Array.isArray(value?.runs)));
    for (const [name, check] of Object.entries(checks)) {
      if (!check?.runs?.length) continue;
      rows.push({group: `${ecosystem}, ${os}`, recipe: check.qualification ?? check.runs.at(-1).sandbox?.mode ?? 'unknown',
        repo: row.name, name, last: check.runs.at(-1).freshness ?? null, others: check.afterOthers?.freshness ?? null,
        reason: check.runs.at(-1).reason ?? null});
    }
  }
}
const definite = value => value === 'CURRENT' || value === 'STALE';
const pct = (n, d) => d ? `${Math.round(100 * n / d)}% (${n}/${d})` : '-';
const table = (label, key) => {
  const groups = [...new Set(rows.map(r => r[key]))].sort();
  const out = [`| ${label} | Checks | Definite after the second run | Definite after the other checks |`, '|---|---|---|---|'];
  for (const group of [...groups, 'All']) {
    const list = group === 'All' ? rows : rows.filter(r => r[key] === group), others = list.filter(r => r.others !== null);
    out.push(`| ${group} | ${list.length} | ${pct(list.filter(r => definite(r.last)).length, list.length)} | ${pct(others.filter(r => definite(r.others)).length, others.length)} |`);
  }
  return out.join('\n');
};
const reasons = {};
for (const r of rows.filter(r => !definite(r.last))) {
  const kind = String(r.reason ?? 'none').replace(/[0-9a-f]{12,}|\d+/g, '#').slice(0, 90);
  reasons[kind] = (reasons[kind] ?? 0) + 1;
}
console.log(['# Definite answers', '', `${rows.length} checks in ${new Set(rows.map(r => r.repo)).size} repositories.`, '',
  table('Census', 'group'), '', table('Recipe', 'recipe'), '', '## Why the rest were UNVERIFIED after the second run', '',
  ...Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([reason, n]) => `- ${n}× ${reason}`)].join('\n'));
