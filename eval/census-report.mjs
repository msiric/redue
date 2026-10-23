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
