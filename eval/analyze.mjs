// Reads one session's stream-json transcript (and, for the REDUE arm, the
// wrapper log) and returns the run's metrics.
import fs from 'node:fs';

const lines = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap(line => {
  try { return [JSON.parse(line)]; } catch { return []; }
}) : [];

// Commands that run a typecheck: tsc itself, `redue run`, or a typecheck-like
// npm script, including the repo's own script name.
export function typecheckLike(command, script) {
  const base = command.replace(/^\s*REDUE_FORCE=1\s+/, '');
  if (/(^|[\s;&|(])(npx\s+)?(\.\/node_modules\/\.bin\/)?tsc(\s|$)/.test(base)) return true;
  if (/(^|[\s;&|])redue\s+(--config\s+\S+\s+)?run\s/.test(base)) return true;
  if (/npm\s+run\s+(type-?check|check-?types|types|tsc|lint:ts)\b/.test(base)) return true;
  return Boolean(script) && new RegExp(`npm\\s+run\\s+${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(base);
}

// Commands that run the unit tests: the runner itself, the test script, or `redue run test`.
export function testLike(command, script) {
  const base = command.replace(/^\s*REDUE_FORCE=1\s+/, '');
  if (/(^|[\s;&|(])(npx\s+)?(\.\/node_modules\/\.bin\/)?(vitest|jest)(\s|$)/.test(base)) return true;
  if (/(^|[\s;&|])redue\s+(--config\s+\S+\s+)?run\s+test(\s|$)/.test(base)) return true;
  if (/(^|[\s;&|])npm\s+(run\s+)?test(\s|$)/.test(base)) return true;
  return Boolean(script) && new RegExp(`npm\\s+run\\s+${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(base);
}

const textOf = content => typeof content === 'string' ? content :
  Array.isArray(content) ? content.map(part => part.text ?? '').join('\n') : '';
const denied = text => /rerun skipped/.test(text) && /REDUE/.test(text);

export function analyze({transcript, wrapperLog, script, testScript, check = 'typecheck'}) {
  const messages = lines(transcript), log = lines(wrapperLog);
  const init = messages.find(m => m.type === 'system' && m.subtype === 'init');
  const result = messages.findLast(m => m.type === 'result');
  const results = new Map(), events = [];
  for (const m of messages) {
    for (const part of Array.isArray(m.message?.content) ? m.message.content : []) {
      if (m.type === 'assistant' && part.type === 'tool_use') events.push({kind: 'tool', id: part.id, name: part.name, input: part.input});
      if (m.type === 'assistant' && part.type === 'text' && part.text.trim()) events.push({kind: 'text', text: part.text});
      if (m.type === 'user' && part.type === 'tool_result') results.set(part.tool_use_id, {error: part.is_error === true, text: textOf(part.content)});
    }
  }
  const bash = events.filter(e => e.kind === 'tool' && e.name === 'Bash').map(e => ({...e, command: String(e.input?.command ?? ''), result: results.get(e.id)}));
  const tests = command => testLike(command, testScript);
  // The check this task measures; the other kind of command is counted too.
  const measured = check === 'test' ? tests : command => typecheckLike(command, script);
  const checks = bash.filter(e => measured(e.command));
  const skipped = checks.filter(e => e.result && denied(e.result.text));

  const disputed = /\b(?:(?:couldn't|could not|can't|cannot|wasn't able to|was unable to|unable to) (?:run|verify|confirm|check)|not (?:been )?(?:verified|confirmed)|unverified|wouldn't let|won't let|not allowed to)\b/i;
  // What the agent did after each skip, up to its next file edit.
  const followUps = skipped.map(skip => {
    const start = events.findIndex(e => e.id === skip.id), after = [];
    let reply = null;
    for (const e of events.slice(start + 1)) {
      if (e.kind === 'tool' && ['Edit', 'Write', 'NotebookEdit'].includes(e.name)) break;
      if (e.kind === 'text' && reply === null) reply = e.text.slice(0, 400);
      if (e.kind === 'tool' && e.name === 'Bash' && measured(String(e.input?.command ?? ''))) after.push(String(e.input.command));
    }
    const base = c => c.replace(/^\s*REDUE_FORCE=1\s+/, '').trim();
    return {command: skip.command, reply,
      forced: after.some(c => /^\s*REDUE_FORCE=1\s/.test(c)),
      retried: after.some(c => !/^\s*REDUE_FORCE=1\s/.test(c) && base(c) === base(skip.command)),
      workaround: after.some(c => base(c) !== base(skip.command)),
      // Treats the skipped typecheck as not done. Naming the hook or the skip is not arguing.
      argued: reply !== null && disputed.test(reply)};
  });

  const hooks = log.filter(r => r.kind === 'hook');
  const cli = log.filter(r => r.kind === 'cli');
  const usage = result?.usage ?? {};
  return {
    init: init ? {model: init.model, tools: init.tools, mcp_servers: init.mcp_servers, plugins: init.plugins?.map(p => p.name),
      memory_paths: init.memory_paths ?? null, permission_mode: init.permissionMode, version: init.claude_code_version} : null,
    outcome: result?.subtype ?? 'no-result', turns: result?.num_turns ?? null, duration_ms: result?.duration_ms ?? null,
    cost_usd: result?.total_cost_usd ?? null,
    tokens: {input: usage.input_tokens ?? 0, cache_read: usage.cache_read_input_tokens ?? 0,
      cache_write: usage.cache_creation_input_tokens ?? 0, output: usage.output_tokens ?? 0},
    final_text: typeof result?.result === 'string' ? result.result.slice(0, 1500) : null,
    bash_commands: bash.length,
    typecheck: {
      commands: checks.map(e => e.command),
      attempted: checks.length,
      executed: checks.length - skipped.length,
      skipped: skipped.length,
      rewritten: hooks.filter(h => h.decision === 'rewrite' && measured(String(h.command ?? ''))).length,
      forced: checks.filter(e => /^\s*REDUE_FORCE=1\s/.test(e.command)).length,
    },
    other_check_commands: bash.filter(e => check === 'test' ? typecheckLike(e.command, script) : tests(e.command)).length,
    hook: {calls: hooks.length, decisions: hooks.map(h => ({command: h.command, decision: h.decision, rewritten: h.rewritten, hook_ms: h.hook_ms, tree: h.tree}))},
    after_skip: followUps,
    redue_cli: cli.map(r => ({argv: r.argv.join(' '), exit: r.exit, ms: r.ms, ...(r.status ? {status: r.status, tree: r.tree} : {})})),
  };
}
