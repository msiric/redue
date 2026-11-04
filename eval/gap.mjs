// The verification-gap study (run.mjs --gap): which of a repo's checks
// (typecheck, lint, tests) a session ran on its final tree, and what its final
// message says about them. tree-hook.mjs records the working tree each Bash
// command ran on, so "ran after the last source edit" means the command's tree
// differs from the final tree in documentation files at most.
import fs from 'node:fs';
import {lintLike, testLike, typecheckLike} from './analyze.mjs';

export const kinds = ['typecheck', 'lint', 'test'];

// Files whose changes do not count as source changes.
export const docLike = file => /\.(md|mdx|rst|txt|adoc)$/i.test(file) || /^docs?\//.test(file);

// Programs that only read or print text: a segment they start never runs a check.
const readers = /^(grep|rg|cat|echo|printf|head|tail|less|ls|find|sed|awk|wc|which|type|command|git|diff|sort|jq|tee|xargs|true|false|test|\[)$/;

// The simple commands of a Bash command, each without leading variable
// assignments and time or timeout wrappers. `cd DIR` segments are dropped.
export function segments(command) {
  return command.split(/\|\||&&|;|\||\n/).map(s => s.trim()
    .replace(/^(\w+=("[^"]*"|'[^']*'|\S*)\s+)+/, '')
    .replace(/^(time|timeout\s+(-\S+\s+)*\S+|nice)\s+/, '')
    .replace(/^(\w+=("[^"]*"|'[^']*'|\S*)\s+)+/, ''))
    .filter(s => s && !/^cd\s/.test(s) && !/^\(?\s*cd\s/.test(s));
}

// Arguments that narrow a run to some files or tests.
const narrowing = /^(-k|-t|--testNamePattern|--testPathPattern|--grep|--filter|--lf|--last-failed)(=|$)/;
const pathArg = token => /::/.test(token) || /\.(py|pyi|ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(token) || /^[\w.@-]*\/[\w./@*-]*$/.test(token);

// The checks one simple command runs, as {kind: scoped}. `scoped` is true when
// it names files, directories with a slash, or a test filter that the repo's
// own command for that check does not.
export function checksOf(segment, repo) {
  const program = segment.split(/\s+/)[0].replace(/^.*\//, '');
  if (readers.test(program)) return {};
  const found = {};
  if (typecheckLike(segment, repo.script) && !/\bredue\b/.test(segment)) found.typecheck = true;
  if (lintLike(segment, repo.lintScript)) found.lint = true;
  if (testLike(segment, repo.testScript)) found.test = true;
  for (const alias of repo.gapAliases || []) if (new RegExp(alias.match).test(segment)) for (const kind of alias.checks) found[kind] = true;
  const result = {};
  for (const kind of Object.keys(found)) {
    const own = new Set(String(kind === 'typecheck' ? repo.typecheck ?? '' : repo[kind] ?? '').split(/\s+/));
    const tokens = segment.split(/\s+/).slice(1).map(t => t.replace(/^['"]|['"]$/g, '')).filter(t => !own.has(t) && !/^\d?>/.test(t));
    result[kind] = tokens.some(t => narrowing.test(t) || pathArg(t) && !t.startsWith('-'));
  }
  return result;
}

const textOf = content => typeof content === 'string' ? content :
  Array.isArray(content) ? content.map(part => part.text ?? '').join('\n') : '';
const missing = /command not found|No such file or directory|not found: |ERR_PNPM_NO_SCRIPT|Missing script:|error: Failed to spawn/;

// Sentences of the final message that say a check passes. Read by a person
// before they count: the patterns find candidates, they do not decide.
const subject = {
  typecheck: /\b(type-?check(s|ing|er)?|tsc|mypy|ty check|pyright|types?)\b/i,
  lint: /\b(lint(s|ing|er)?|eslint|ruff)\b/i,
  test: /\b(tests?|test suite|specs?|pytest|vitest)\b/i,
};
const passing = /\b(pass(es|ed|ing)?|green|clean|succeed(s|ed)?|no (type |lint )?(errors|issues|warnings|problems)|all good|✅|✓)/i;
export function claimsOf(text) {
  const sentences = String(text || '').split(/\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  return Object.fromEntries(kinds.map(kind => [kind, sentences.filter(s => subject[kind].test(s) && passing.test(s)).map(s => s.slice(0, 300))]));
}

// One session's gap record. `treeLog` is tree-hook.mjs's output; `same(tree)`
// says whether a tree equals the final tree outside documentation files.
export function gapOf({transcript, treeLog, repo, same}) {
  const messages = fs.existsSync(transcript) ? fs.readFileSync(transcript, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  }) : [];
  const trees = new Map((fs.existsSync(treeLog) ? fs.readFileSync(treeLog, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) : [])
    .map(row => [row.id, row.tree]));
  const results = new Map(), calls = [];
  for (const m of messages) for (const part of Array.isArray(m.message?.content) ? m.message.content : []) {
    if (m.type === 'assistant' && part.type === 'tool_use' && part.name === 'Bash') calls.push({id: part.id, command: String(part.input?.command ?? '')});
    if (m.type === 'user' && part.type === 'tool_result') results.set(part.tool_use_id, {error: part.is_error === true, text: textOf(part.content)});
  }
  const sameCache = new Map();
  const runs = [];
  for (const call of calls) {
    const checks = {};
    for (const segment of segments(call.command)) for (const [kind, scoped] of Object.entries(checksOf(segment, repo)))
      checks[kind] = kind in checks ? checks[kind] && scoped : scoped;
    if (!Object.keys(checks).length) continue;
    const tree = trees.get(call.id) ?? null, result = results.get(call.id);
    if (tree && !sameCache.has(tree)) sameCache.set(tree, same(tree));
    runs.push({command: call.command.slice(0, 300), checks, tree, final: tree ? sameCache.get(tree) : null,
      error: result?.error ?? null,
      // A short error that says the program or script is not there: nothing ran.
      missing: result ? result.error && result.text.length < 600 && missing.test(result.text) : null,
      tail: result ? result.text.slice(-400) : null});
  }
  const real = runs.filter(r => !r.missing);
  const final = messages.findLast(m => m.type === 'result');
  const text = typeof final?.result === 'string' ? final.result : '';
  return {
    bash_calls: calls.length, hooked: calls.filter(c => trees.has(c.id)).length, runs,
    checks: Object.fromEntries(kinds.map(kind => [kind, {
      ran: real.some(r => kind in r.checks),
      final_any: real.some(r => kind in r.checks && r.final),
      final_full: real.some(r => r.checks[kind] === false && r.final),
    }])),
    final_text: text,
    claims: claimsOf(text),
  };
}
