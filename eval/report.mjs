// Renders run results as markdown: medians per task with savings and overhead
// side by side, REDUE's one-time setup cost, then every run.
//
//   node eval/report.mjs .local/eval/run-*/      # re-render from results.json
import fs from 'node:fs';
import path from 'node:path';

const sec = ms => ms == null ? '-' : (ms / 1000).toFixed(0);
const usd = n => n == null ? '-' : `$${n.toFixed(2)}`;
const tokensIn = t => t.input + t.cache_read + t.cache_write;
const kTok = t => t ? `${Math.round(tokensIn(t) / 1000)}k/${(t.output / 1000).toFixed(1)}k` : '-';
const k = n => n == null ? '-' : `${Math.round(n / 1000)}k`;
const signed = (n, f) => n == null ? '-' : n > 0 ? `+${f(n)}` : n < 0 ? `-${f(-n)}` : f(0);
const yes = v => v === true ? 'pass' : v === false ? '**FAIL**' : '-';
const median = values => {
  const v = values.filter(x => x != null).sort((a, b) => a - b);
  return !v.length ? null : v.length % 2 ? v[v.length >> 1] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
const sum = values => values.reduce((a, b) => a + (b || 0), 0);
// Every independent check of the run's final state passed.
const allPass = row => row.final_tsc?.pass === true && row.tests?.pass !== false && (row.expect || []).every(e => e.ok);

function runCells(row) {
  if (row.error) return ['error', ...Array(10).fill('-')];
  const m = row.metrics, tc = m.typecheck, after = m.after_skip;
  const count = f => after.filter(f).length;
  const reactions = [count(a => a.forced) && `${count(a => a.forced)} force`, count(a => a.retried) && `${count(a => a.retried)} retry`,
    count(a => a.workaround) && `${count(a => a.workaround)} other cmd`, count(a => a.argued) && `${count(a => a.argued)} argued`]
    .filter(Boolean).join(', ') || '-';
  const current = (row.sync_checks || []).filter(s => s.freshness === 'CURRENT');
  const expectOk = row.expect.length ? row.expect.every(e => e.ok) : null;
  return [
    m.outcome === 'success' ? sec(row.wall_ms) : `${sec(row.wall_ms)} (${m.outcome})`,
    m.turns ?? '-', kTok(m.tokens), usd(m.cost_usd),
    `${tc.attempted}/${tc.executed}/${tc.skipped}/${tc.rewritten}`, tc.forced ? `${tc.forced}` : '0', reactions,
    current.length ? `${current.filter(s => s.tsc_pass === (s.result === 'PASS')).length}/${current.length}` : '-',
    yes(row.final_tsc?.pass), row.tests ? yes(row.tests.pass) : '-', yes(expectOk),
  ];
}

export function report(rows, {model, max_turns, maxTurns = max_turns, runs, out} = {}) {
  const ok = rows.filter(r => r.metrics);
  const cells = [...new Map(rows.map(r => [`${r.repo}|${r.task}`, {repo: r.repo, task: r.task, kind: r.kind}])).values()];
  const of = (cell, arm) => ok.filter(r => r.repo === cell.repo && r.task === cell.task && r.arm === arm);
  const lines = [`# REDUE agent A/B results`, ''];
  lines.push(`Model ${model ?? '?'}, max ${maxTurns ?? '?'} turns, ${runs ?? '?'} runs per arm and task, ${rows.length} sessions` +
    `${rows.length - ok.length ? ` (${rows.length - ok.length} failed to run)` : ''}.` +
    `${out ? ` Raw transcripts: \`${out}/<run>/transcript.jsonl\`.` : ''}`, '');

  const critical = rows.flatMap(r => (r.critical || []).map(c => `- **${r.id}**: ${c}`));
  const skips = sum(ok.map(r => (r.skip_checks || []).length));
  const syncs = sum(ok.map(r => (r.sync_checks || []).filter(s => s.freshness === 'CURRENT').length));
  lines.push(critical.length ? `## CRITICAL\n\n${critical.join('\n')}\n` :
    `Critical checks: none. Plain tsc agreed with all ${skips} skipped typechecks, all ${syncs} CURRENT \`status --sync\` ` +
    `answers, and every final CURRENT/PASS, each on the tree it was about.\n`);

  // Medians per task. Savings are control minus REDUE; overhead is REDUE minus control.
  lines.push(`## Savings and overhead (median of ${runs ?? '?'} runs)`, '');
  lines.push('| repo | task | kind | wall s ctl | wall s REDUE | saved s | tokens ctl | tokens REDUE | token overhead | cost ctl | cost REDUE | typechecks run ctl/REDUE | skipped | all checks pass ctl/REDUE |');
  lines.push(`|${'---|'.repeat(14)}`);
  const totals = {ctlWall: 0, redueWall: 0, ctlTok: 0, redueTok: 0, ctlCost: 0, redueCost: 0};
  for (const cell of cells) {
    const ctl = of(cell, 'control'), red = of(cell, 'redue');
    const wall = rs => median(rs.map(r => r.wall_ms)), tok = rs => median(rs.map(r => tokensIn(r.metrics.tokens)));
    const cost = rs => median(rs.map(r => r.metrics.cost_usd));
    const [cw, rw, ct, rt, cc, rc] = [wall(ctl), wall(red), tok(ctl), tok(red), cost(ctl), cost(red)];
    totals.ctlWall += cw || 0; totals.redueWall += rw || 0; totals.ctlTok += ct || 0; totals.redueTok += rt || 0;
    totals.ctlCost += cc || 0; totals.redueCost += rc || 0;
    const executed = rs => sum(rs.map(r => r.metrics.typecheck.executed));
    lines.push(`| ${cell.repo.split('/')[1]} | ${cell.task} | ${cell.kind} | ${sec(cw)} | ${sec(rw)} | ` +
      `${cw != null && rw != null ? signed(cw - rw, sec) : '-'} | ${k(ct)} | ${k(rt)} | ${ct != null && rt != null ? signed(rt - ct, k) : '-'} | ` +
      `${usd(cc)} | ${usd(rc)} | ${executed(ctl)}/${executed(red)} | ${sum(red.map(r => r.metrics.typecheck.skipped))} | ` +
      `${ctl.filter(allPass).length}/${ctl.length} · ${red.filter(allPass).length}/${red.length} |`);
  }
  lines.push(`| **total** | | | ${sec(totals.ctlWall)} | ${sec(totals.redueWall)} | ${signed(totals.ctlWall - totals.redueWall, sec)} | ` +
    `${k(totals.ctlTok)} | ${k(totals.redueTok)} | ${signed(totals.redueTok - totals.ctlTok, k)} | ${usd(totals.ctlCost)} | ${usd(totals.redueCost)} | | | |`, '');
  lines.push('`wall s`: the agent session only. `tokens`: input tokens summed over turns, cache reads and writes included. ' +
    '`typechecks run`: summed over runs. `all checks pass`: plain tsc, quick tests and the task checks on the final tree.', '');

  // One-time cost of adopting REDUE in a checkout, outside the session time above.
  lines.push('## One-time setup (REDUE arm, median per repo)', '');
  lines.push('| repo | init + agent setup | start | first index | one-time total | seed typecheck | CLAUDE.md block | skill |');
  lines.push(`|${'---|'.repeat(8)}`);
  for (const repo of [...new Set(cells.map(c => c.repo))]) {
    const setups = ok.filter(r => r.repo === repo && r.arm === 'redue').map(r => r.setup);
    if (!setups.length) continue;
    const m = f => median(setups.map(f));
    const bytes = f => { const b = m(s => s.instruction_bytes ? f(s.instruction_bytes) : null); return b == null ? '-' : `${b} B (~${Math.round(b / 4)} tokens)`; };
    lines.push(`| ${repo.split('/')[1]} | ${(m(s => s.init_ms + s.agent_setup_ms) / 1000).toFixed(1)} s | ${sec(m(s => s.start_ms))} s | ` +
      `${(m(s => s.index_ms) / 1000).toFixed(1)} s | ${sec(m(s => s.init_ms + s.agent_setup_ms + s.start_ms + s.index_ms))} s | ` +
      `${sec(m(s => s.seed_run_ms))} s | ${bytes(b => b.block)} | ${bytes(b => b.skill)} |`);
  }
  lines.push('', 'The seed typecheck stands for an earlier session\'s passing check, so it is not overhead. ' +
    'The CLAUDE.md block is in context on every turn; the skill only after the agent reads it. Tokens estimated as bytes / 4.', '');

  lines.push('## Every run', '');
  const head = ['wall s', 'turns', 'tok in/out', 'cost', 'tc att/exec/skip/rewr', 'FORCE', 'after skip', 'CURRENT syncs ok', 'tsc', 'tests', 'task'];
  lines.push(`| run | ${head.join(' | ')} |`, `|${'---|'.repeat(head.length + 1)}`);
  for (const row of rows) lines.push(`| ${row.id} | ${runCells(row).join(' | ')} |`);
  lines.push('', '`tc att/exec/skip/rewr`: typecheck commands the agent attempted / that ran / the hook skipped / the hook rewrote to `redue run`. ' +
    '`FORCE`: commands prefixed with `REDUE_FORCE=1`. `after skip`: what the agent did after a skip, before its next edit; ' +
    '`argued` means its next text said the typecheck could not be run or verified. ' +
    '`CURRENT syncs ok`: CURRENT `status --sync` answers that plain tsc agreed with.', '');
  const replies = rows.flatMap(r => (r.metrics?.after_skip || []).filter(a => a.reply).map(a => `- ${r.id}: ${a.reply.replace(/\s+/g, ' ').slice(0, 300)}`));
  if (replies.length) lines.push('## Agent text after each skip', '', ...replies, '');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = path.resolve(process.argv[2] || '.');
  const {rows, ...meta} = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
  process.stdout.write(report(rows, {...meta, out: dir}));
}
