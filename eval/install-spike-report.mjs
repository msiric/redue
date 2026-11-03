#!/usr/bin/env node
// Install spike, the report: compares the two copies' manifests of each repo
// (install-spike.mjs) and sorts the entries that differ: package-manager
// metadata, Python bytecode and install records, packages with install
// scripts or native builds, platform packages, and the rest by package.
// With --keep FILE it writes {repo: [paths]} of differing files, for a second
// pair that saves them (install-spike.mjs --keep).
//
//   node eval/install-spike-report.mjs [--keep FILE] DIR...
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {entryPoint, readJson} from './lib.mjs';
entryPoint(import.meta);

const argv = process.argv.slice(2);
const at = argv.indexOf('--keep');
const keepOut = at >= 0 ? argv.splice(at, 2)[1] : null;
const all = argv.flatMap(dir => fs.readdirSync(dir, {recursive: true}).map(String).map(f => path.join(dir, f)));
const results = new Map();
for (const file of all.filter(f => /spike-.*-[12]\.json$/.test(path.basename(f)))) {
  const r = readJson(file);
  const manifest = all.find(f => path.basename(f) === path.basename(file).replace(/^spike-/, 'manifest-').replace(/\.json$/, '.tsv.gz'));
  if (!results.has(r.repo)) results.set(r.repo, {});
  results.get(r.repo)[r.copy] = {...r, manifest};
}
const load = file => {
  const map = new Map();
  if (!file) return map;
  for (const line of zlib.gunzipSync(fs.readFileSync(file)).toString().split('\n')) {
    if (!line) continue;
    const [rel, type, mode, size, hash] = line.split('\t');
    map.set(rel, {type, mode, size, hash});
  }
  return map;
};
// The installed package a path belongs to.
function packageOf(rel) {
  const parts = rel.split('/');
  const i = parts.lastIndexOf('node_modules');
  if (i >= 0 && parts[i + 1]) return parts[i + 1].startsWith('@') ? `${parts[i + 1]}/${parts[i + 2] ?? ''}` : parts[i + 1];
  const site = parts.indexOf('site-packages');
  if (site >= 0 && parts[site + 1]) return parts[site + 1].replace(/-[^-]+\.dist-info$/, '').replace(/\.(dist-info|libs|pth)$/, '');
  return parts.slice(0, 2).join('/');
}
const category = (rel, scripted) => {
  if (/(^|\/)node_modules\/(\.package-lock\.json|\.modules\.yaml|\.pnpm\/lock\.yaml|\.pnpm-workspace-state.*|\.yarn-integrity|\.yarn-state\.yml)$/.test(rel)) return 'package-manager metadata';
  if (/(^|\/)node_modules\/\.cache\//.test(rel) || /(^|\/)\.cache\//.test(rel)) return 'caches';
  if (/__pycache__\/|\.pyc$/.test(rel)) return 'Python bytecode';
  if (/\.dist-info\/(RECORD|INSTALLER|direct_url\.json|uv_cache\.json|REQUESTED)$/.test(rel)) return 'Python install records';
  if (/^\.venv\/(pyvenv\.cfg|bin\/)/.test(rel)) return 'virtualenv scripts and config';
  if (/(linux|darwin|win32|musl|gnu|x64|arm64)/.test(packageOf(rel)) && /node_modules/.test(rel)) return 'platform packages';
  if (scripted.has(packageOf(rel))) return 'packages with install scripts';
  if (!/(^|\/)(node_modules|\.venv)\//.test(rel)) return 'outside node_modules and .venv';
  return 'other';
};
const lines = [], keep = {};
const summary = [];
for (const [repo, copies] of [...results].sort()) {
  const one = copies['1'], two = copies['2'];
  if (!one || !two) { lines.push(`## ${repo}`, '', `one copy missing`, ''); continue; }
  const failed = [one, two].filter(c => c.error || c.install?.status !== 0);
  lines.push(`## ${repo}`, '', `${one.pm}: \`${one.command}\` at ${one.commit?.slice(0, 10)}; images ${one.runner.imageVersion} / ${two.runner.imageVersion}; install ${Math.round((one.install?.ms ?? 0) / 1000)} s / ${Math.round((two.install?.ms ?? 0) / 1000)} s; versions ${JSON.stringify(one.versions)}${JSON.stringify(one.versions) === JSON.stringify(two.versions) ? '' : ' vs ' + JSON.stringify(two.versions)}`);
  if (failed.length) { lines.push('', `install failed: ${failed.map(c => `copy ${c.copy}: ${c.error || `exit ${c.install?.status}: ${(c.install?.tail || '').slice(-400)}`}`).join('; ')}`, ''); summary.push({repo, pm: one.pm, identical: null, failed: true}); continue; }
  const a = load(one.manifest), b = load(two.manifest);
  const scripted = new Set([...(one.installScripts || []), ...(two.installScripts || [])].map(p => p.name));
  const diffs = [];
  for (const [rel, x] of a) { const y = b.get(rel); if (!y) diffs.push({rel, how: 'only in copy 1'}); else if (x.type !== y.type || x.mode !== y.mode || x.hash !== y.hash) diffs.push({rel, how: x.hash !== y.hash ? 'content' : x.type !== y.type ? 'type' : 'exec bit'}); }
  for (const rel of b.keys()) if (!a.has(rel)) diffs.push({rel, how: 'only in copy 2'});
  const byCategory = {};
  for (const d of diffs) { const c = category(d.rel, scripted); (byCategory[c] ??= []).push(d); }
  summary.push({repo, pm: one.pm, entries: a.size, identical: diffs.length === 0, differing: diffs.length, categories: Object.fromEntries(Object.entries(byCategory).map(([c, l]) => [c, l.length])), installScripts: scripted.size});
  lines.push('', diffs.length ? `${diffs.length} of ${a.size} entries differ:` : `identical: ${a.size} entries`);
  for (const [c, list] of Object.entries(byCategory).sort((x, y) => y[1].length - x[1].length)) {
    const pkgs = {};
    for (const d of list) pkgs[packageOf(d.rel)] = (pkgs[packageOf(d.rel)] || 0) + 1;
    lines.push(`- ${c}: ${list.length} (${Object.entries(pkgs).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([p, n]) => `${p} ${n}`).join(', ')})`);
    for (const d of list.slice(0, 5)) lines.push(`  - ${d.how}: ${d.rel}`);
  }
  if (scripted.size) lines.push(`- packages with install scripts: ${[...scripted].slice(0, 20).join(', ')}${scripted.size > 20 ? ` and ${scripted.size - 20} more` : ''}`);
  keep[repo] = diffs.filter(d => d.how === 'content').map(d => d.rel).slice(0, 400);
  lines.push('');
}
console.log(['| repo | pm | entries | identical | differing | categories |', '|---|---|---|---|---|---|',
  ...summary.map(s => `| ${s.repo} | ${s.pm} | ${s.entries ?? '-'} | ${s.failed ? 'install failed' : s.identical ? 'yes' : 'no'} | ${s.differing ?? '-'} | ${Object.entries(s.categories || {}).map(([c, n]) => `${c} ${n}`).join('; ')} |`),
  '', ...lines].join('\n'));
if (keepOut) fs.writeFileSync(keepOut, JSON.stringify(keep, null, 1));
