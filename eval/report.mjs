// Renders run results as one markdown table with both arms side by side.
//
//   node eval/report.mjs .local/eval/run-*/      # re-render from result.json files
import fs from 'node:fs';
import path from 'node:path';

const sec = ms => ms == null ? '-' : (ms / 1000).toFixed(0);
const usd = n => n == null ? '-' : `$${n.toFixed(2)}`;
const kTok = t => t ? `${Math.round((t.input + t.cache_read + t.cache_write) / 1000)}k/${(t.output / 1000).toFixed(1)}k` : '-';
const yes = v => v === true ? 'pass' : v === false ? '**FAIL**' : '-';

function cell(row) {
  if (!row) return Array(10).fill('-');
  if (row.error) return ['error', ...Array(9).fill('-')];
  const m = row.metrics, tc = m.typecheck;
  const after = m.after_skip;
  const reactions = [after.filter(a => a.forced).length && `${after.filter(a => a.forced).length} force`,
    after.filter(a => a.retried).length && `${after.filter(a => a.retried).length} retry`,
    after.filter(a => a.workaround).length && `${after.filter(a => a.workaround).length} other cmd`,
    after.filter(a => a.argued).length && `${after.filter(a => a.argued).length} argued`].filter(Boolean).join(', ') || '-';
  const expectOk = row.expect.length ? row.expect.every(e => e.ok) : null;
  return [
    m.outcome === 'success' ? sec(row.wall_ms) : `${sec(row.wall_ms)} (${m.outcome})`,
    m.turns ?? '-', usd(m.cost_usd), kTok(m.tokens),
    `${tc.attempted}/${tc.executed}/${tc.skipped}/${tc.rewritten}`,
    tc.forced ? `${tc.forced}` : '0', reactions,
    yes(row.final_tsc?.pass), row.tests ? yes(row.tests.pass) : '-', yes(expectOk),
  ];
}

export function report(rows, {model, maxTurns, out} = {}) {
  const keys = [...new Map(rows.map(r => [`${r.repo}|${r.task}`, r])).values()];
  const head = ['wall s', 'turns', 'cost', 'tok in/out', 'tc att/exec/skip/rewr', 'FORCE', 'after skip', 'tsc', 'tests', 'task'];
  const lines = [];
  const critical = rows.flatMap(r => (r.critical || []).map(c => `- **${r.id}**: ${c}`));
  lines.push(`# REDUE agent A/B results`, '');
  lines.push(`Model ${model ?? '?'}, max ${maxTurns ?? '?'} turns, ${rows.length} runs.${out ? ` Raw transcripts: \`${out}/<run>/transcript.jsonl\`.` : ''}`, '');
  lines.push(critical.length ? `## CRITICAL\n\n${critical.join('\n')}\n` : 'Critical checks: none. No run had a skipped typecheck or a final CURRENT/PASS that plain tsc rejects.\n');
  lines.push(`| repo | task | kind | ${head.map(h => `ctl ${h}`).join(' | ')} | ${head.map(h => `REDUE ${h}`).join(' | ')} |`);
  lines.push(`|${'---|'.repeat(3 + head.length * 2)}`);
  for (const key of keys) {
    const pair = arm => rows.find(r => r.repo === key.repo && r.task === key.task && r.arm === arm);
    lines.push(`| ${key.repo.split('/')[1]} | ${key.task} | ${key.kind} | ${cell(pair('control')).join(' | ')} | ${cell(pair('redue')).join(' | ')} |`);
  }
  const total = arm => {
    const ok = rows.filter(r => r.arm === arm && r.metrics);
    const sum = f => ok.reduce((a, r) => a + (f(r) || 0), 0);
    return `${arm}: ${sec(sum(r => r.wall_ms))} s, ${usd(sum(r => r.metrics.cost_usd))}, ` +
      `${sum(r => r.metrics.typecheck.executed)} typechecks executed, ${sum(r => r.metrics.typecheck.skipped)} skipped, ` +
      `${ok.filter(r => r.final_tsc?.pass).length}/${ok.length} final tsc pass`;
  };
  lines.push('', `Totals: ${total('control')}; ${total('redue')}.`, '');
  lines.push('`tc att/exec/skip/rewr`: typecheck commands the agent attempted / that ran / the hook skipped / the hook rewrote to `redue run`.',
    '`FORCE`: commands prefixed with `REDUE_FORCE=1`. `after skip`: what the agent did after a skip, before its next edit.',
    '`tsc`, `tests`, `task`: independent checks of the final tree. REDUE-arm setup time (init, setup, start, seed run) is not in `wall s`; see each result.json.', '');
  const replies = rows.flatMap(r => (r.metrics?.after_skip || []).filter(a => a.reply).map(a => `- ${r.id}: ${a.reply.replace(/\s+/g, ' ').slice(0, 300)}`));
  if (replies.length) lines.push('## Agent text after each skip', '', ...replies, '');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = path.resolve(process.argv[2] || '.');
  const results = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
  process.stdout.write(report(results.rows, {model: results.model, maxTurns: results.max_turns, out: dir}));
}
