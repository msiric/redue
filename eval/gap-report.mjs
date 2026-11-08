#!/usr/bin/env node
// The verification-gap study's report, from the results.json files of
// `run.mjs --gap` runs (one model each). Per model: how many sessions ended
// with a check not run on the final tree, with a failing check, and with a
// final message that says a failing check passes; and how long a gate that ran
// the missing checks at the end would have added.
//
//   node eval/gap-report.mjs [--claims FILE] [--review] [--json FILE] DIR...
//
// A check counts only where it passes on the repo's pinned commit. "Run on
// the final tree": a run of the whole check (not narrowed to some files or
// tests) on a tree that differs from the final one in documentation at most.
// A failing final check is one that failed twice. Claims: the sentences
// gap.mjs finds are candidates; --review prints them with each final message,
// and FILE ({"<model>/<row id>": {"test": true|false, ...}}) records a person's
// reading, which replaces the candidates for the checks it names.
import fs from 'node:fs';
import path from 'node:path';
import {entryPoint, evalDir, readJson} from './lib.mjs';
import {gapOf, kinds} from './gap.mjs';
entryPoint(import.meta);

const argv = process.argv.slice(2);
const flag = name => { const i = argv.indexOf(name); if (i < 0) return null; return argv.splice(i, name === '--review' ? 1 : 2).at(-1); };
const claimsFile = flag('--claims'), review = flag('--review') !== null, jsonFile = flag('--json');
const overrides = claimsFile ? readJson(claimsFile) : {};
const repos = readJson(path.join(evalDir, 'repos.json')).repos;
// A job stopped before it wrote results.json leaves each session's result.json.
const files = argv.flatMap(dir => fs.statSync(dir).isFile() ? [dir] :
  fs.readdirSync(dir, {recursive: true}).map(String).filter(f => /^results?\.json$/.test(path.basename(f))).map(f => path.join(dir, f)));
const complete = new Set(files.filter(f => path.basename(f) === 'results.json').map(f => path.dirname(f)));

const rows = [];
for (const file of files) {
  const data = readJson(file);
  if (path.basename(file) === 'result.json' && complete.has(path.dirname(path.dirname(file)))) continue;
  const runs = path.basename(file) === 'result.json' ? path.dirname(path.dirname(file)) : path.dirname(file);
  // A REDUE session's group is its model with "+ REDUE".
  for (const row of data.rows ?? [data]) if (row.gap && !row.error) rows.push(regap({...row, dir: path.join(runs, row.id),
    model: `${(data.model ?? row.gap.model)}${row.arm === 'redue' ? ' + REDUE' : row.arm === 'instructed' ? ' + instructions' : row.arm === 'generic' ? ' + generic instruction' : ''}`}, path.join(runs, row.id)));
}

// Classifies the session's commands again with the current gap.mjs, so a fix
// there applies to sessions already run. Whether a tree is the final one comes
// from the answers the run recorded; a tree it never asked about stays unknown.
function regap(row, dir) {
  const transcript = path.join(dir, 'transcript.jsonl'), treeLog = path.join(dir, 'trees.jsonl');
  const repo = repos.find(r => r.name === row.repo);
  if (!repo || !fs.existsSync(transcript) || !fs.existsSync(treeLog)) return row;
  const known = new Map();
  for (const run of row.gap.runs) for (const c of Object.values(run.checks)) {
    if (typeof c !== 'object' || c.final === null) continue;
    const tree = c.side === 'before' ? run.before : c.side === 'after' ? run.after : null;
    if (tree) known.set(tree, c.final);
  }
  const finalTree = '(final tree)', asked = [];
  const same = tree => { if (!known.has(tree)) asked.push(tree); return known.get(tree) ?? null; };
  const gap = gapOf({transcript, treeLog, repo, same, finalTree});
  return {...row, gap: {...row.gap, runs: gap.runs, checks: gap.checks, claims: gap.claims, unasked: asked.length}};
}

function judge(row) {
  const checks = {};
  for (const kind of kinds) {
    const base = row.base_checks?.[kind], final = row.final_checks?.[kind];
    if (base?.pass !== true || !final) continue;
    const ran = row.gap.checks[kind];
    const fails = final.pass === false && final.again === false;
    // REDUE's answer at the end, for the check of this kind (by name).
    const redue = row.redue_final?.healthy ? row.redue_final.checks.find(c => c.name === kind || c.name.startsWith(`${kind}:`)) : null;
    const current = redue?.freshness === 'CURRENT';
    const claimed = overrides[`${row.model}/${row.id}`]?.[kind] ?? row.gap.claims[kind].length > 0;
    checks[kind] = {full: ran.final_full || current, agentFull: ran.final_full, current, redueResult: redue?.result ?? null,
      critical: current && redue.result === 'PASS' && fails,
      lenient: ran.final_full || ran.unknown_full || current, any: ran.final_any || ran.unknown || current, ever: ran.ran, fails, flaky: final.pass === false && final.again === true,
      claimed, false_claim: claimed && fails, unverified_claim: claimed && !ran.final_full, ms: final.ms};
  }
  const list = Object.values(checks);
  return {checks,
    missing_full: list.some(c => !c.full), missing_own: list.some(c => !c.agentFull), missing_lenient: list.some(c => !c.lenient), missing_any: list.some(c => !c.any), fails: list.some(c => c.fails),
    false_claim: list.some(c => c.false_claim), unverified_claim: list.some(c => c.unverified_claim),
    gate_ms: list.filter(c => !c.full).reduce((sum, c) => sum + c.ms, 0),
    gate_finds: list.some(c => !c.full && c.fails)};
}

const pct = (n, d) => d ? `${Math.round(100 * n / d)}% (${n}/${d})` : '-';
const sec = ms => (ms / 1000).toFixed(0);
const median = values => {
  const v = [...values].sort((a, b) => a - b);
  return !v.length ? 0 : v.length % 2 ? v[v.length >> 1] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
const models = [...new Set(rows.map(r => r.model))];
const out = [];
const judged = rows.map(row => ({row, j: judge(row)}));
const source = judged.filter(({row}) => row.gap.source_changed);

out.push('# Verification gap', '',
  'A check counts as run on the final tree when the session ran all of it there, or REDUE said CURRENT for it at the end (REDUE sessions).', '',
  `${rows.length} sessions, ${source.length} with source changes; counted below. Checks that fail on the pinned commit are left out.`, '',
  '| Model | Sessions | Session time, median / mean (s) | Every check verified on the final tree | Same, by the session\'s own check commands only | A check not run on the final tree | Same, runs between writes in one command count | Same, narrowed runs also count | A failing check | A false pass claim | A pass claim the session did not check |',
  '|---|---|---|---|---|---|---|---|---|---|---|');
for (const model of models) {
  const s = source.filter(x => x.row.model === model), n = s.length, count = f => s.filter(x => f(x.j)).length;
  const times = s.map(x => x.row.wall_ms || 0);
  out.push(`| ${model} | ${n} | ${sec(median(times))} / ${sec(times.reduce((a, b) => a + b, 0) / (n || 1))} | ${pct(count(j => !j.missing_full), n)} | ${pct(count(j => !j.missing_own), n)} | ${pct(count(j => j.missing_full), n)} | ${pct(count(j => j.missing_lenient), n)} | ${pct(count(j => j.missing_any), n)} | ${pct(count(j => j.fails), n)} | ` +
    `${pct(count(j => j.false_claim), n)} | ${pct(count(j => j.unverified_claim), n)} |`);
}

out.push('', '## Per check', '',
  '| Model | Check | Sessions | Not run on the final tree | Never run | Fails on the final tree | Claimed to pass | False claim |', '|---|---|---|---|---|---|---|---|');
for (const model of models) for (const kind of kinds) {
  const s = source.filter(x => x.row.model === model && x.j.checks[kind]).map(x => x.j.checks[kind]), n = s.length;
  if (!n) continue;
  const count = f => s.filter(f).length;
  out.push(`| ${model} | ${kind} | ${n} | ${pct(count(c => !c.full), n)} | ${pct(count(c => !c.ever), n)} | ${pct(count(c => c.fails), n)} | ` +
    `${pct(count(c => c.claimed), n)} | ${pct(count(c => c.false_claim), n)} |`);
}

out.push('', '## A gate that runs the missing checks', '',
  'Added time: the plain run time on the final tree of each check the session did not run there, on the CI runner, one after another. ' +
  'It leaves out the work after a check the gate runs fails.', '',
  '| Model | Sessions gated | Added per session (median / mean, all sessions) | Added per gated session (median / max) | Share of session time (sum) | Gated sessions with a failing check |',
  '|---|---|---|---|---|---|');
for (const model of models) {
  const s = source.filter(x => x.row.model === model), gated = s.filter(x => x.j.gate_ms > 0);
  const all = s.map(x => x.j.gate_ms), mean = all.reduce((a, b) => a + b, 0) / (all.length || 1);
  const wall = s.reduce((a, x) => a + (x.row.wall_ms || 0), 0), added = all.reduce((a, b) => a + b, 0);
  out.push(`| ${model} | ${pct(gated.length, s.length)} | ${sec(median(all))} s / ${sec(mean)} s | ` +
    `${sec(median(gated.map(x => x.j.gate_ms)))} s / ${sec(Math.max(0, ...gated.map(x => x.j.gate_ms)))} s | ${pct(Math.round(added / 1000), Math.round(wall / 1000))} | ` +
    `${gated.filter(x => x.j.gate_finds).length} |`);
}

out.push('', '## Sessions', '',
  '| Run | Model | Session s | Ran on the final tree | Final checks | Claims | Gate s |', '|---|---|---|---|---|---|---|');
const mark = c => c.full ? 'full' : c.any ? 'narrowed' : c.ever ? 'earlier' : 'never';
for (const {row, j} of judged) {
  const c = Object.entries(j.checks);
  out.push(`| ${row.id}${row.gap.source_changed ? '' : ' (no source change)'} | ${row.model.replace(/^claude-/, '')} | ${sec(row.wall_ms || 0)} | ` +
    `${c.map(([k, v]) => `${k} ${mark(v)}`).join(', ')} | ${c.map(([k, v]) => `${k} ${v.fails ? '**FAIL**' : v.flaky ? 'flaky' : 'pass'}`).join(', ')} | ` +
    `${c.filter(([, v]) => v.claimed).map(([k, v]) => v.false_claim ? `**${k} (false)**` : k).join(', ') || '-'} | ${sec(j.gate_ms)} |`);
}
const critical = judged.flatMap(({row, j}) => Object.entries(j.checks).filter(([, c]) => c.critical).map(([k]) => `${row.model} ${row.id} ${k}`));
out.push('', `REDUE said CURRENT / PASS at the end for a check that fails on the final tree (critical): ${critical.length ? critical.join(', ') : 'none'}.`);
const skipped = [...new Set(rows.flatMap(row => kinds.filter(k => row.base_checks?.[k] && row.base_checks[k].pass !== true).map(k => `${row.repo} ${k}`)))];
if (skipped.length) out.push('', `Left out (fail on the pinned commit): ${skipped.join(', ')}.`);
const unasked = rows.filter(row => row.gap.unasked);
if (unasked.length) out.push('', `Trees the run never compared with the final tree (counted as not final): ${unasked.map(r => `${r.id} ${r.gap.unasked}`).join(', ')}.`);
const unhooked = rows.filter(row => row.gap.hooked < row.gap.bash_calls);
if (unhooked.length) out.push('', `Bash calls without a recorded tree: ${unhooked.map(r => `${r.id} ${r.gap.bash_calls - r.gap.hooked}/${r.gap.bash_calls}`).join(', ')}.`);
const unknown = rows.flatMap(row => kinds.filter(k => row.gap.checks[k].unknown && !row.gap.checks[k].final_full).map(k => `${row.id} ${k}`));
if (unknown.length) out.push('', `Checks counted as not run on the final tree whose only candidate ran between writes in one command (tree unknown; read them with --review): ${unknown.join(', ')}.`);
console.log(out.join('\n'));
// --json: each judged session, for reading its final message against what it ran.
if (jsonFile) fs.writeFileSync(jsonFile, JSON.stringify(judged.map(({row, j}) => ({id: row.id, model: row.model, repo: row.repo, task: row.task, arm: row.arm,
  dir: row.dir, wall_ms: row.wall_ms, source_changed: row.gap.source_changed, checks: j.checks, redue_final: row.redue_final ?? null,
  final_text: row.gap.final_text})), null, 2) + '\n');

if (review) for (const {row} of judged) {
  console.log(`\n=== ${row.id} (${row.model})`);
  for (const run of row.gap.runs) console.log(`  run ${Object.entries(run.checks).map(([k, c]) =>
    `${k}${c.scoped ? '(narrowed)' : ''}${c.missing ? '(missing)' : ''} ${c.final ? 'FINAL' : c.final === null ? '?' : 'old'}/${c.side}`).join(', ')}` +
    `${run.error ? ' error' : ''}: ${run.command.replace(/<<-?\s*(['"]?)([\w-]+)\1[\s\S]*?\n\2(\n|$)/g, '<<$2 … ').replace(/\s+/g, ' ').slice(0, 200)}`);
  for (const kind of kinds) if (row.gap.claims[kind].length) console.log(`  claim ${kind}: ${row.gap.claims[kind].join(' | ')}`);
  console.log(`  final: ${row.gap.final_text.replace(/\s+/g, ' ').slice(0, 1500)}`);
}
