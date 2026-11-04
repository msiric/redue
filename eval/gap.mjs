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
// Segments that change no files: readers without -i, -delete, tee or a
// redirection to a file, git's reading commands, and checks without a fix flag.
const quiet = /^(grep|rg|cat|echo|printf|head|tail|less|ls|find|sed|awk|wc|which|type|command|diff|sort|jq|true|false|test|\[|pwd|cd)$/;
const gitReads = /^git\s+(status|diff|log|show|grep|rev-parse|ls-files|blame|branch\s*$)/;
const fixing = /(^|\s)(--fix|--write|-u|--update(-snapshots)?|format(?!\s+--check|\s.*--check))(\s|=|$)/;
const fileRedirect = /(^|[^0-9&>])>>?\s*(?!\/dev\/|&)[\w./"'-]/;

// The simple commands of a Bash command, each without heredoc bodies, leading
// variable assignments, subshell parentheses, and time, timeout or `uv run`
// wrappers. `cd DIR` segments are dropped.
export function segments(command) {
  const lines = command.replace(/\\\n/g, ' ').split('\n'), kept = [];
  for (let i = 0; i < lines.length; i++) {
    kept.push(lines[i]);
    for (const m of lines[i].matchAll(/<<-?\s*(['"]?)([\w-]+)\1/g)) {
      while (i + 1 < lines.length && lines[i + 1].replace(/^\t+/, '') !== m[2]) i++;
      i++;
    }
  }
  const prefix = /^(\(+\s*|\w+=("[^"]*"|'[^']*'|\S*)\s+|(time|nice|timeout\s+(-\S+\s+)*\S+|(uv|poetry)\s+run(\s+--?[\w-]+(=\S+)?)*)\s+)/;
  return split(kept.join('\n')).map(s => {
    s = s.trim();
    for (let before = null; before !== s;) { before = s; s = s.replace(prefix, ''); }
    return s.replace(/[\s)]+$/, '');
  }).filter(s => s && !/^cd(\s|$)/.test(s));
}

// Splits at ||, &&, ;, | and newlines outside quotes.
function split(text) {
  const parts = [];
  let current = '', quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote) quote = null; else if (c === '\\' && quote === '"') current += text[i++]; current += c; continue; }
    if (c === '"' || c === "'") { quote = c; current += c; continue; }
    if (c === '\\') { current += c + (text[++i] ?? ''); continue; }
    if (c === ';' || c === '\n' || c === '|' || c === '&' && text[i + 1] === '&') {
      parts.push(current); current = '';
      if (text[i + 1] === c) i++;
      continue;
    }
    current += c;
  }
  return [...parts, current];
}

// Whether a segment may change files in the checkout.
export function writes(segment, repo) {
  const program = segment.split(/\s+/)[0].replace(/^.*\//, '');
  if (fileRedirect.test(segment) || /\s-i(\s|$|\.)|-delete|-exec/.test(segment)) return true;
  if (program === 'git') return !gitReads.test(segment);
  if (quiet.test(program)) return false;
  if (/\s(--check|--dry-run)(\s|$)/.test(segment) && !fixing.test(segment)) return false;
  return !Object.keys(checksOf(segment, repo)).length || fixing.test(segment);
}

// Arguments that narrow a run to some files or tests.
const narrowing = /^(-k|-t|--testNamePattern|--testPathPattern|--grep|--filter|--lf|--last-failed)(=|$)/;
const pathArg = token => /::/.test(token) || /\.(py|pyi|ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(token) || /^[\w.@-]*\/[\w./@*-]*$/.test(token);

// Vitest and Jest take any bare argument as a test file filter (pytest's
// bare arguments are directories, such as the whole `tests`).
const jsTest = /(^|[\s/])(vitest|jest)(\s|$)|^(npm|pnpm|yarn)\s+(run\s+)?test/;
const valueFlag = /^(--reporter|--config|-c|--project|--pool|--environment|--root|--dir|--outputFile|--maxWorkers|--shard|--testTimeout)$/;
const filtersFiles = (tokens, repo) => tokens.some((t, i) => !t.startsWith('-') && !valueFlag.test(tokens[i - 1] ?? '') &&
  !['run', 'exec', 'npx', 'vitest', 'jest', repo.testScript].includes(t) && !/^test(:[\w:-]+)?$|^\d?>|^&/.test(t));

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
    result[kind] = tokens.some(t => narrowing.test(t) || pathArg(t) && !t.startsWith('-')) ||
      kind === 'test' && jsTest.test(segment) && filtersFiles(tokens, repo);
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

// Whether a call's output says the program or script a segment names is not
// there: then that check did not run.
const absent = (segment, text) => segment.split(/\s+/).map(t => t.replace(/^['"]|['"]$/g, '').replace(/^.*\//, ''))
  .filter(t => /^[\w.:-]{2,}$/.test(t)).some(t => {
    const name = t.replace(/[.]/g, '\\.');
    return new RegExp(`(^|[\\s/:])${name}: (command )?not found|No module named '?${name}\\b|Missing script: "?${name}\\b|` +
      `ERR_PNPM_NO_SCRIPT[^\\n]*\\b${name}\\b|Failed to spawn: \`${name}\``).test(text);
  });

// One session's gap record. `treeLog` is tree-hook.mjs's output, the tree
// before each tool call; `same(tree)` says whether a tree equals `finalTree`
// outside documentation files. A Bash call's tree after it ran is the tree
// before the next assistant message's first tool call, or the final tree.
// A check in a command that also changes files ran on the tree before the
// call when no segment before it may write, on the tree after the call when
// no segment after it may, and on an unknown tree otherwise.
export function gapOf({transcript, treeLog, repo, same, finalTree}) {
  const messages = fs.existsSync(transcript) ? fs.readFileSync(transcript, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  }) : [];
  const trees = new Map((fs.existsSync(treeLog) ? fs.readFileSync(treeLog, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) : [])
    .map(row => [row.id, row.tree]));
  const results = new Map(), calls = [], groups = [];
  for (const [n, m] of messages.entries()) for (const part of Array.isArray(m.message?.content) ? m.message.content : []) {
    if (m.type === 'assistant' && part.type === 'tool_use') {
      const group = m.message.id ?? `#${n}`;
      if (groups.at(-1)?.group !== group) groups.push({group, first: part.id});
      calls.push({id: part.id, name: part.name, command: String(part.input?.command ?? ''), group: groups.length - 1});
    }
    if (m.type === 'user' && part.type === 'tool_result') results.set(part.tool_use_id, {error: part.is_error === true, text: textOf(part.content)});
  }
  const bash = calls.filter(c => c.name === 'Bash');
  const sameCache = new Map();
  const onFinal = tree => {
    if (!tree) return null;
    if (tree === finalTree) return true;
    if (!sameCache.has(tree)) sameCache.set(tree, same(tree));
    return sameCache.get(tree);
  };
  const runs = [];
  for (const call of bash) {
    const parts = segments(call.command), found = parts.map(part => checksOf(part, repo));
    if (!found.some(f => Object.keys(f).length)) continue;
    const result = results.get(call.id), wrote = parts.map(part => writes(part, repo));
    const before = trees.get(call.id) ?? null, next = groups[call.group + 1];
    const after = next ? trees.get(next.first) ?? null : finalTree;
    // A short error that says the program or script is not there: nothing ran.
    const none = result ? result.error && result.text.length < 600 && missing.test(result.text) : false;
    const checks = {};
    for (const [i, f] of found.entries()) for (const [kind, scoped] of Object.entries(f)) {
      const earlier = wrote.slice(0, i).some(Boolean), later = wrote.slice(i + 1).some(Boolean);
      const tree = !earlier ? before : !later ? after : null;
      const run = {scoped, side: !earlier ? 'before' : !later ? 'after' : 'unknown', final: onFinal(tree),
        missing: none || Boolean(result && absent(parts[i], result.text))};
      // Keep the run that counts most: real, whole, on the final tree.
      const rank = r => (r.missing ? 0 : 4) + (r.final ? 2 : 0) + (r.scoped ? 0 : 1);
      if (!checks[kind] || rank(run) > rank(checks[kind])) checks[kind] = run;
    }
    runs.push({command: call.command.slice(0, 2000), checks, before, after,
      error: result?.error ?? null, tail: result ? result.text.slice(-400) : null});
  }
  const all = runs.flatMap(r => Object.entries(r.checks)).filter(([, c]) => !c.missing);
  const final = messages.findLast(m => m.type === 'result');
  const text = typeof final?.result === 'string' ? final.result : '';
  return {
    bash_calls: bash.length, hooked: bash.filter(c => trees.has(c.id)).length, tool_calls: calls.length, runs,
    checks: Object.fromEntries(kinds.map(kind => [kind, {
      ran: all.some(([k]) => k === kind),
      final_any: all.some(([k, c]) => k === kind && c.final),
      final_full: all.some(([k, c]) => k === kind && c.final && !c.scoped),
      unknown: all.some(([k, c]) => k === kind && c.final === null),
    }])),
    final_text: text,
    claims: claimsOf(text),
  };
}
