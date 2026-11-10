#!/usr/bin/env node
// The slow-check study's report, from the results.json files of `run.mjs
// --gap` runs of tasks with steps (eval/tasks.json "steps"). Per arm, model
// and step: session time, the time spent in check commands (the Bash calls
// gap.mjs takes for a check, and redue run or verify), the share of steps that
// end with every check verified on that step's tree, and, in the REDUE arm,
// REDUE's skips and any CURRENT answer for a check that fails there.
//
//   node eval/steps-report.mjs DIR...
//
// A check counts where it passes on the repo's pinned commit. "Verified" is
// gap-report.mjs's: a full run on a tree that differs from the step's in
// documentation at most, or REDUE CURRENT for it at the step's end.
import fs from 'node:fs';
import path from 'node:path';
import {entryPoint, evalDir, readJson} from './lib.mjs';
import {checksOf, kinds, segments} from './gap.mjs';
entryPoint(import.meta);

const repos = readJson(path.join(evalDir, 'repos.json')).repos;
const files = process.argv.slice(2).flatMap(dir => fs.statSync(dir).isFile() ? [dir] :
  fs.readdirSync(dir, {recursive: true}).map(String).filter(f => path.basename(f) === 'results.json').map(f => path.join(dir, f)));
const lines = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap(line => {
  try { return [JSON.parse(line)]; } catch { return []; } }) : [];

// Time in check commands: each Bash call that runs a check, from its tool use
// to its result (transcript timestamps). `killed`: those Claude Code stopped at
// its command time limit; `limit`: those it moved to the background when they
// reached that limit; `background`: those the agent started in the background.
// A check that finishes in the background counts only up to that point.
const resultText = part => Array.isArray(part.content) ? part.content.map(c => c?.text ?? '').join('\n') : String(part.content ?? '');
function checkCalls(transcript, repo) {
  const uses = new Map(); let ms = 0, killed = 0, limit = 0, background = 0;
  for (const m of lines(transcript)) for (const part of Array.isArray(m.message?.content) ? m.message.content : []) {
    if (m.type === 'assistant' && part.type === 'tool_use' && part.name === 'Bash') {
      const command = String(part.input?.command ?? '');
      if (/\bredue\s+(run|verify)\b/.test(command) || segments(command).some(s => Object.keys(checksOf(s, repo)).length))
        uses.set(part.id, Date.parse(m.timestamp));
    }
    if (m.type === 'user' && part.type === 'tool_result' && uses.has(part.tool_use_id)) {
      ms += Date.parse(m.timestamp) - uses.get(part.tool_use_id);
      const text = resultText(part);
      if (/Command timed out/i.test(text)) killed++;
      else if (/did not complete within its \d+s timeout and was moved to the background/i.test(text)) limit++;
      else if (/running in background/i.test(text)) background++;
    }
  }
  return {ms, killed, limit, background};
}

const rows = [];
for (const file of files) {
  const data = readJson(file), runs = path.dirname(file);
  for (const row of data.rows ?? []) {
    if (row.error || !row.steps?.length || !row.gap) continue;
    const repo = repos.find(r => r.name === row.repo), dir = path.join(runs, row.id);
    const group = `${data.model}${row.arm === 'redue' ? ' + REDUE' : row.arm === 'instructed' ? ' + instructions' : row.arm === 'generic' ? ' + generic instruction' : ''}`;
    const counted = kinds.filter(k => row.base_checks?.[k]?.pass === true && row.final_checks?.[k]);
    if (!counted.length) continue;
    for (const [n, step] of row.steps.entries()) {
      const gap = row.steps.length > 1 ? step.gap : row.gap;
      const checks = step.final_checks ?? (n === row.steps.length - 1 ? row.final_checks : null);
      // Every status row of the kind (test, test:unit, ...) must say it.
      const variants = k => step.redue_final?.healthy ? step.redue_final.checks.filter(c => c.name === k || c.name.startsWith(`${k}:`)) : [];
      const says = (k, f) => variants(k).length > 0 && variants(k).every(f);
      const fails = k => checks?.[k]?.pass === false && checks[k].again === false;
      rows.push({group, task: row.task, repo: row.repo, step: n + 1, new: step.new, wall: step.wall_ms,
        ...(({ms, killed, limit, background}) => ({check: ms, killed, limit, background}))(checkCalls(path.join(dir, row.steps.length > 1 ? `transcript-${n + 1}.jsonl` : 'transcript.jsonl'), repo)),
        known: Boolean(checks),
        verified: counted.every(k => gap?.checks?.[k]?.final_full || says(k, c => c.freshness === 'CURRENT')),
        wrong: counted.filter(k => variants(k).some(c => c.freshness === 'CURRENT' && c.result === 'PASS') && fails(k)).map(k => `${row.id} step ${n + 1} ${k}`)});
    }
    // Skips across the run's steps, each checked with a plain run on its tree (run.mjs).
    rows.at(-1).skips = (row.skip_checks || []).length;
    rows.at(-1).critical = row.critical || [];
  }
}

const pct = (n, d) => d ? `${Math.round(100 * n / d)}% (${n}/${d})` : '-';
const sec = ms => (ms / 1000).toFixed(0);
const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);
const groups = [...new Set(rows.map(r => r.group))], positions = [...new Set(rows.map(r => r.step))].sort((a, b) => a - b);
const out = ['# Steps', '', '| Group | Step | Steps | Session time, total (s) | Check commands, total (s) | Check commands stopped at the time limit | Moved to the background at the limit | Started in the background | Every check verified at the step\'s end |', '|---|---|---|---|---|---|---|---|---|'];
for (const group of groups) for (const step of positions) {
  const s = rows.filter(r => r.group === group && r.step === step);
  if (!s.length) continue;
  out.push(`| ${group} | ${step} | ${s.length} | ${sec(sum(s, r => r.wall))} | ${sec(sum(s, r => r.check))} | ${sum(s, r => r.killed)} | ${sum(s, r => r.limit)} | ${sum(s, r => r.background)} | ${pct(s.filter(r => r.verified).length, s.length)} |`);
}
const wrong = rows.flatMap(r => r.wrong), critical = rows.flatMap(r => r.critical || []);
out.push('', `REDUE skips: ${sum(rows, r => r.skips || 0)}. CURRENT / PASS for a check that fails on the step's tree: ${wrong.length ? wrong.join(', ') : 'none'}.`,
  `Critical (a skip or CURRENT answer a plain run contradicts): ${critical.length ? critical.join('; ') : 'none'}.`);
const unknown = rows.filter(r => !r.known);
if (unknown.length) out.push('', `Steps whose tree differs from the final one in source and was not checked with plain runs (a wrong CURRENT there would not show): ${unknown.length}.`);
console.log(out.join('\n'));
