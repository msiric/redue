#!/usr/bin/env node
// A/B runs of headless Claude Code sessions with and without REDUE.
//
//   node eval/run.mjs --pilot                  # tasks marked "pilot" in eval/tasks.json
//   node eval/run.mjs --repo NAME[,NAME] --task ID[,ID]    # narrow the selection
//
// Options: --arms control,redue  --runs 3 (sessions per arm and task)
//          --model claude-sonnet-5-5  --max-turns 30
//          --redue PATH (REDUE entry for the REDUE arm; default: this checkout)
//          --keep (keep each run's clone)  --out DIR
//          --profile (REDUE arm: write REDUE's timing trace to each run's profile.jsonl)
//          --diag (REDUE arm: the wrapper logs what status said when the hook did not skip)
//          --arms ...,instructed (no REDUE; CLAUDE.md asks the agent to run the repo's
//                 typecheck, lint and tests on its final code before it finishes)
//          --arms ...,generic (no REDUE; CLAUDE.md asks the same without naming commands)
//          --gap (the verification-gap study: records the tree each Bash command ran on,
//                 runs the repo's checks on its pinned commit once, reruns a failing
//                 final check once, and writes what the session verified; gap.mjs)
//
// Every run gets a fresh clone at the repo's pinned commit, `npm ci
// --ignore-scripts`, and its own `claude -p` session. A task measures its
// `check`: the typecheck (default), the unit tests or the lint. The REDUE arm also runs
// init, agent setup claude --apply, start and one `redue run CHECK` before the
// session: the receipt stands for an earlier session's passing check.
// Afterwards plain tsc (and quick tests) check the final tree. Each skipped
// check, and each `status --sync` that answered CURRENT, is checked with a
// plain run on the tree it was about: tsc or the lint once, or the tests three times.
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {checkoutRedue, claudeSession, evalDir, freshClone, harnessEnv, localDir, plainTests, plainTsc, RateLimited, readJson, redue, sh, slug, stamp,
  tmpRoot, checkStatus, must, waitReady, sessionAuth, redactDir, receiptOf, touchedSince, entryPoint} from './lib.mjs';
import {writeWrapper} from './wrapper.mjs';
import {analyze} from './analyze.mjs';
import {report} from './report.mjs';
import {checksOf, docLike, gapOf, segments} from './gap.mjs';
entryPoint(import.meta, {ci: true});

const {values: opt} = parseArgs({options: {
  pilot: {type: 'boolean'}, repo: {type: 'string'}, task: {type: 'string'}, arms: {type: 'string', default: 'control,redue'},
  runs: {type: 'string', default: '3'},
  model: {type: 'string', default: 'claude-sonnet-5-5'}, 'max-turns': {type: 'string', default: '30'},
  redue: {type: 'string', default: checkoutRedue}, keep: {type: 'boolean'}, out: {type: 'string'}, profile: {type: 'boolean'}, diag: {type: 'boolean'},
  gap: {type: 'boolean'},
}});
const entry = path.resolve(opt.redue);
const repos = readJson(path.join(evalDir, 'repos.json')).repos;
const tasks = readJson(path.join(evalDir, 'tasks.json')).tasks;
const selected = tasks.filter(t => (!opt.pilot || t.pilot) && (!opt.repo || opt.repo.split(',').includes(t.repo)) && (!opt.task || opt.task.split(',').includes(t.id)));
if (!selected.length) { console.error('no tasks selected'); process.exit(2); }
const out = path.resolve(opt.out || path.join(localDir, `run-${stamp()}`));
fs.mkdirSync(out, {recursive: true});
const tools = 'Bash,Read,Edit,Write,Glob,Grep,Skill';

// PATH without any directory that already provides `redue`.
function pathWithout(extra) {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(d => d && !fs.existsSync(path.join(d, 'redue')));
  return [extra, ...dirs].filter(Boolean).join(path.delimiter);
}

// The working tree as a git tree object, without touching the checkout's index.
function treeOf(dir) {
  const index = path.join(dir, '.git', 'redue-eval-index');
  fs.copyFileSync(path.join(dir, '.git', 'index'), index);
  const env = harnessEnv({GIT_INDEX_FILE: index});
  must(sh('git', ['add', '-A'], {cwd: dir, env}), 'git add');
  const tree = must(sh('git', ['write-tree'], {cwd: dir, env}), 'write-tree').stdout.trim();
  fs.rmSync(index, {force: true});
  return tree;
}

// A Python repo's check on a tree, in the run's own checkout once the session
// is over: its .venv links into the checkout (an editable install), so a copy
// elsewhere would check the wrong files. Tests run three times, as in
// verifyTree.
function verifyInPlace(dir, tree, command, tests = false) {
  must(sh('git', ['clean', '-fdq'], {cwd: dir}), 'git clean');
  must(sh('git', ['read-tree', '--reset', '-u', tree], {cwd: dir}), 'git read-tree');
  if (!tests) return plainTests(dir, command);
  const runs = [0, 1, 2].map(() => plainTests(dir, command).pass);
  return {pass: runs.every(Boolean) ? true : runs.some(Boolean) ? null : false, runs};
}

// Plain tsc, the repo's lint once, or its tests three times, on a tree an
// answer was about, with the run's node_modules. Tests that disagree across
// the three runs are flaky, not a REDUE error.
function verifyTree(dir, tree, scratch, repo, testCommand = null, lintCommand = null) {
  fs.rmSync(scratch, {recursive: true, force: true});
  fs.mkdirSync(scratch, {recursive: true});
  must(sh('sh', ['-c', `git archive ${tree} | tar -x -C "${scratch}"`], {cwd: dir}), 'git archive');
  // Copy-on-write clone where the filesystem supports it.
  must(sh('cp', [process.platform === 'darwin' ? '-cR' : '-a', ...(process.platform === 'linux' ? ['--reflink=auto'] : []),
    path.join(dir, 'node_modules'), path.join(scratch, 'node_modules')]), 'copy node_modules');
  // The files the clone got from install scripts (freshClone).
  if (repo.afterInstall) must(sh('sh', ['-c', repo.afterInstall], {cwd: scratch, timeout: 900_000}), repo.afterInstall);
  let result;
  if (lintCommand) result = plainTests(scratch, lintCommand);
  else if (testCommand) {
    const runs = [0, 1, 2].map(() => plainTests(scratch, testCommand).pass);
    result = {pass: runs.every(Boolean) ? true : runs.some(Boolean) ? null : false, runs};
  } else result = repo.typecheck ? plainTests(scratch, repo.typecheck) : plainTsc(scratch);
  fs.rmSync(scratch, {recursive: true, force: true});
  return result;
}

function expectations(dir, task, changed) {
  return (task.expect || []).map(e => {
    if (e.unchanged) return {...e, ok: changed.length === 0};
    let text = '';
    try { text = fs.readFileSync(path.join(dir, e.file), 'utf8'); } catch {}
    const ok = e.includes !== undefined ? text.includes(e.includes) : e.excludes !== undefined ? !text.includes(e.excludes) :
      e.matches !== undefined ? new RegExp(e.matches, 'm').test(text) : false;
    return {...e, ok};
  });
}

async function runOne(task, repo, arm, index, rep) {
  const id = `${String(index).padStart(2, '0')}-${slug(repo.name)}-${task.id}-${arm}-${rep}`;
  const dir = path.join(tmpRoot, 'runs', id, 'repo');
  try { return await runSession(task, repo, arm, id); }
  finally { if (arm === 'redue' && fs.existsSync(dir)) redue(entry, dir, 'stop'); }
}

// The flags every session gets; only the prompt and turn limit differ. `hook`:
// a PreToolUse command for every tool call (--gap's tree-hook.mjs). `resume`:
// the session a task's next step continues; a task with steps keeps its
// sessions so a step can resume one.
const sessionArgs = (prompt, maxTurns, hook = null, {resume = null, persist = false} = {}) => ['-p', prompt, '--model', opt.model, '--max-turns', String(maxTurns),
  ...resume ? ['--resume', resume] : [], '--output-format', 'stream-json', '--verbose', ...persist ? [] : ['--no-session-persistence'],
  '--setting-sources', 'project,local', '--settings', JSON.stringify({autoMemoryEnabled: false,
    ...hook ? {hooks: {PreToolUse: [{matcher: '*', hooks: [{type: 'command', command: hook}]}]}} : {}}),
  '--strict-mcp-config', '--mcp-config', JSON.stringify({mcpServers: {}}),
  '--tools', tools, '--allowedTools', tools, '--permission-mode', 'dontAsk'];

// --gap: the repo's checks on a fresh clone of its pinned commit, once per
// repo, in the order the final checks run. A check that fails here fails
// before any session.
const baseRuns = new Map();
function baseChecks(repo) {
  if (baseRuns.has(repo.name)) return baseRuns.get(repo.name);
  const dir = path.join(tmpRoot, 'base', slug(repo.name));
  const one = r => ({pass: r.pass, ms: r.ms, ...r.pass ? {} : {tail: r.output.slice(-1500)}});
  let result;
  try {
    freshClone(repo, repo.commit, dir);
    result = {typecheck: one(repo.typecheck ? plainTests(dir, repo.typecheck) : plainTsc(dir)),
      ...repo.test ? {test: one(plainTests(dir, repo.test))} : {}, ...repo.lint ? {lint: one(plainTests(dir, repo.lint))} : {}};
  } catch (error) { result = {error: error.message}; }
  fs.rmSync(dir, {recursive: true, force: true});
  baseRuns.set(repo.name, result);
  return result;
}

// The session id a stream-json transcript names, or null.
function sessionIdOf(transcript) {
  for (const line of transcript.split('\n')) {
    try { const message = JSON.parse(line); if (typeof message.session_id === 'string') return message.session_id; } catch {}
  }
  return null;
}

// The checks of the `redue status --sync --json` answer in a session's
// transcript, or null.
function finalRedueStatus(transcript) {
  for (const line of transcript.split('\n')) {
    let message; try { message = JSON.parse(line); } catch { continue; }
    for (const part of Array.isArray(message.message?.content) ? message.message.content : []) {
      if (part.type !== 'tool_result') continue;
      const text = typeof part.content === 'string' ? part.content : (part.content || []).map(item => item.text ?? '').join('\n');
      const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      try { const value = JSON.parse(json); if (Array.isArray(value.checks)) return {healthy: value.observation?.healthy === true,
        checks: value.checks.map(c => ({name: c.name, freshness: c.freshness, result: c.result, reason: c.reason}))}; } catch {}
    }
  }
  return null;
}

async function runSession(task, repo, arm, id) {
  const runDir = path.join(out, id), work = path.join(tmpRoot, 'runs', id), dir = path.join(work, 'repo');
  fs.mkdirSync(runDir, {recursive: true});
  const check = task.check || 'typecheck';
  const row = {id, repo: repo.name, commit: repo.commit, task: task.id, kind: task.kind, check, arm, rep: +id.split('-').at(-1), setup: {}};
  console.log(`\n== ${id}`);
  let started = performance.now();
  freshClone(repo, repo.commit, dir);
  row.setup.clone_ms = Math.round(performance.now() - started);

  const log = path.join(runDir, 'redue-calls.jsonl'), bin = path.join(work, 'bin');
  const env = harnessEnv({PATH: pathWithout(arm === 'redue' ? bin : null),
    ...(opt.profile && arm === 'redue' ? {REDUE_DECISION_PROFILE: '1', REDUE_DECISION_PROFILE_FILE: path.join(runDir, 'profile.jsonl')} : {}),
    ...(opt.diag && arm === 'redue' ? {REDUE_EVAL_DIAG: '1'} : {})});
  if (arm === 'redue') {
    writeWrapper(bin, entry, log);
    // Setup runs each check inside and outside the sandbox; with slow checks that takes longer than sh's 10 minutes.
    const step = (label, ...argv) => {
      const r = must(sh(path.join(bin, 'redue'), argv, {cwd: dir, env, timeout: argv[0] === 'setup' ? 45 * 60_000 : undefined}), `redue ${argv.join(' ')}`);
      row.setup[label] = r.ms;
      // What setup said (which checks qualify and why) and the config it wrote.
      if (argv[0] === 'setup') {
        fs.writeFileSync(path.join(runDir, 'setup-output.txt'), r.stdout + r.stderr);
        if (fs.existsSync(path.join(dir, 'redue.config.json'))) fs.copyFileSync(path.join(dir, 'redue.config.json'), path.join(runDir, 'redue.config.json'));
      }
    };
    if (opt.gap) {
      // --gap: set up as a user would (every check init finds, the hooks, the
      // status line and the end-of-turn check), then `redue verify` in the
      // agent's own shell, so each check's receipt holds the environment the
      // agent's commands run in.
      step('setup_ms', 'setup', 'claude', '--yes');
      const seed = await claudeSession(sessionArgs('Run exactly this command from the project root, once, as a command of its own with nothing added before or after it, then report its exit status: redue verify', 5),
        {cwd: dir, env: {...env, ...sessionAuth()}, timeout: 30 * 60_000});
      fs.writeFileSync(path.join(runDir, 'seed-transcript.jsonl'), seed.stdout);
      if (seed.rateLimited) throw new RateLimited(seed.rateLimited);
      row.setup.seed_run_ms = seed.ms;
    } else {
    // A Python repo's checks come from the sandboxed recipe.
    step('init_ms', 'init', '--recipe', repo.install ? 'sandbox' : {test: 'tests-direct', lint: 'node-script'}[check] ?? 'typescript-direct', '--check', check);
    step('agent_setup_ms', 'agent', 'setup', 'claude', '--apply');
    step('start_ms', 'start');
    row.setup.index_ms = waitReady(entry, dir, {env});
    if (check !== 'typecheck' || repo.install) {
      // The seed is an earlier session's passing run: a short session runs
      // `redue run CHECK` in its Bash tool, so the run's environment (PATH
      // included) is the agent's. A sandboxed check (a Python repo's)
      // compares PATH too. Nothing may be chained to it.
      const mark = path.join(runDir, 'seed-mark');
      fs.writeFileSync(mark, '');
      const seed = await claudeSession(sessionArgs(`Run exactly this command from the project root, once, as a command of its own with nothing added before or after it, then report its exit status: redue run ${check}`, 5),
        {cwd: dir, env: {...env, ...sessionAuth()}, timeout: 15 * 60_000});
      fs.writeFileSync(path.join(runDir, 'seed-transcript.jsonl'), seed.stdout);
      if (seed.rateLimited) throw new RateLimited(seed.rateLimited);
      row.setup.seed_run_ms = seed.ms;
      const runs = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
        .filter(r => r.kind === 'cli' && r.argv.join(' ') === `run ${check}`) : [];
      if (!runs.length) throw new Error(`the seed session did not record a ${check} run`);
      row.setup.seed_status = {result: runs.at(-1).exit === 0 ? 'PASS' : 'FAIL', recorded_by: 'seed session'};
      // Why a seed run is not reusable, when it is not.
      row.setup.seed_receipt = receiptOf(dir, check);
      if (row.setup.seed_receipt?.stable === false) row.setup.seed_touched = touchedSince(dir, mark);
    } else {
      step('seed_run_ms', 'run', check);
      row.setup.seed_status = checkStatus(entry, dir, check, env);
      row.setup.seed_receipt = receiptOf(dir, check);
    }
    }
    // What the agent always has in context (the managed block) and reads on demand (the skill).
    const record = readJson(path.join(dir, '.redue', 'agents', 'claude.json'));
    row.setup.instruction_bytes = {block: Buffer.byteLength(record.block), skill: fs.statSync(path.join(dir, record.skill)).size};
    fs.renameSync(log, path.join(runDir, 'setup-calls.jsonl'));
  }
  // The instructed arm: what a project would write in CLAUDE.md instead of
  // installing REDUE, with the commands the final checks run.
  if (arm === 'instructed') {
    // A check that already fails on the pinned commit is left out, as a project would.
    const base = opt.gap ? baseChecks(repo) : {};
    const commands = [['typecheck', 'the typecheck', repo.typecheck ?? 'npx tsc --noEmit'], ['lint', 'the linter', repo.lint], ['test', 'the tests', repo.test]]
      .filter(([kind, , command]) => command && base[kind]?.pass !== false).map(([, what, command]) => [what, command]);
    const file = path.join(dir, 'CLAUDE.md'), before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    fs.writeFileSync(file, `${before}${before && !before.endsWith('\n') ? '\n' : ''}${before ? '\n' : ''}## Before you finish\n\n` +
      `Before you say you are done, run ${commands.map(([what, command]) => `${what} (\`${command}\`)`).join(', ').replace(/, ([^,]*)$/, ' and $1')} ` +
      'on your final code, and fix anything that fails.\n');
    row.setup.instruction = fs.readFileSync(file, 'utf8').slice(before.length);
  }
  // The generic arm: the instruction a user would write without looking up the commands.
  if (arm === 'generic') {
    const file = path.join(dir, 'CLAUDE.md'), before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    fs.writeFileSync(file, `${before}${before && !before.endsWith('\n') ? '\n' : ''}${before ? '\n' : ''}` +
      "Before you finish, run the project's typecheck, lint and tests.\n");
    row.setup.instruction = fs.readFileSync(file, 'utf8').slice(before.length);
  }
  const baseTree = treeOf(dir);

  // A task with `steps` runs them one after another in the same checkout:
  // each resumes the session before it, or starts a new one ("new": true), as
  // a person's next prompt or next session would. Each step keeps its own
  // transcript, tree log and, in the REDUE arm, REDUE's answer at its end.
  // A one-step task keeps the files' plain names.
  const steps = task.steps ?? [{prompt: task.prompt}];
  const suffix = n => steps.length > 1 ? `-${n + 1}` : '';
  row.steps = [];
  let sessionId = null;
  for (const [n, step] of steps.entries()) {
    const treeLog = path.join(runDir, `trees${suffix(n)}.jsonl`);
    const hook = opt.gap ? [process.execPath, path.join(evalDir, 'tree-hook.mjs'), treeLog, dir].map(a => JSON.stringify(a)).join(' ') : null;
    const args = sessionArgs(step.prompt, opt['max-turns'], hook, {resume: n && !step.new ? sessionId : null, persist: steps.length > 1});
    fs.writeFileSync(path.join(runDir, `session${suffix(n)}.json`), JSON.stringify({cwd: dir, args}, null, 2) + '\n');
    const session = await claudeSession(args, {cwd: dir, env: {...env, ...sessionAuth()}, timeout: 45 * 60_000});
    if (session.rateLimited) throw new RateLimited(session.rateLimited);
    fs.writeFileSync(path.join(runDir, `transcript${suffix(n)}.jsonl`), session.stdout);
    if (session.stderr) fs.writeFileSync(path.join(runDir, `stderr${suffix(n)}.txt`), session.stderr);
    sessionId = sessionIdOf(session.stdout) ?? sessionId;
    const stepRow = {wall_ms: session.ms, exit: session.status ?? session.signal, new: n === 0 || Boolean(step.new), tree: treeOf(dir)};
    // --gap: REDUE's answer for every check at the step's end, asked from the
    // agent's shell (a sandboxed check compares the environment it runs in).
    if (opt.gap && arm === 'redue') {
      const asked = await claudeSession(sessionArgs('Run exactly this command from the project root, once, as a command of its own with nothing added before or after it, then reply with one word, done: redue status --sync --json', 5),
        {cwd: dir, env: {...env, ...sessionAuth()}, timeout: 15 * 60_000});
      fs.writeFileSync(path.join(runDir, `final-status-transcript${suffix(n)}.jsonl`), asked.stdout);
      if (asked.rateLimited) throw new RateLimited(asked.rateLimited);
      stepRow.redue_final = finalRedueStatus(asked.stdout);
    }
    row.steps.push(stepRow);
  }
  row.wall_ms = row.steps.reduce((sum, step) => sum + step.wall_ms, 0);
  row.exit = row.steps.at(-1).exit;
  if (row.steps.at(-1).redue_final !== undefined) row.redue_final = row.steps.at(-1).redue_final;
  const transcriptFile = path.join(runDir, `transcript${suffix(steps.length - 1)}.jsonl`);
  const treeLog = path.join(runDir, `trees${suffix(steps.length - 1)}.jsonl`);
  // Independent checks on the final state.
  if (arm === 'redue') {
    row.final_status = checkStatus(entry, dir, check, env);
    row.final_receipt = receiptOf(dir, check);
    redue(entry, dir, 'stop');
  }
  const finalTree = treeOf(dir);
  const diff = sh('git', ['diff', '--stat', baseTree, finalTree], {cwd: dir}).stdout;
  fs.writeFileSync(path.join(runDir, 'diff.patch'), sh('git', ['diff', baseTree, finalTree], {cwd: dir}).stdout);
  row.changed_files = sh('git', ['diff', '--name-only', baseTree, finalTree], {cwd: dir}).stdout.split('\n').filter(Boolean);
  row.diff_stat = diff.trim().split('\n').at(-1) || '';
  // A Python repo's typecheck is its own command; REDUE's claim is about the
  // command its check runs, which skipped trees are checked with.
  const tsc = repo.typecheck ? plainTests(dir, repo.typecheck) : plainTsc(dir);
  let claimed = repo.typecheck;
  try { claimed = readJson(path.join(dir, 'redue.config.json')).checks.find(c => c.name === check).command.join(' '); } catch {}
  row.final_tsc = {pass: tsc.pass, ms: tsc.ms};
  if (!tsc.pass) fs.writeFileSync(path.join(runDir, 'final-tsc.txt'), tsc.output);
  if (repo.test) {
    const test = sh('sh', ['-c', repo.test], {cwd: dir, timeout: 300_000});
    row.tests = {pass: test.status === 0, ms: test.ms};
    if (test.status !== 0) fs.writeFileSync(path.join(runDir, 'tests.txt'), (test.stdout + test.stderr).slice(-8000));
  }
  if (repo.lint) {
    const lint = sh('sh', ['-c', repo.lint], {cwd: dir, timeout: 300_000});
    row.lint = {pass: lint.status === 0, ms: lint.ms};
    if (lint.status !== 0) fs.writeFileSync(path.join(runDir, 'lint.txt'), (lint.stdout + lint.stderr).slice(-8000));
  }
  row.expect = expectations(dir, task, row.changed_files);
  if (opt.gap) {
    // A failing final check runs once more: one that passes then is flaky.
    const again = command => plainTests(dir, command).pass;
    row.final_checks = {
      typecheck: {pass: tsc.pass, ms: tsc.ms, ...tsc.pass ? {} : {again: repo.typecheck ? again(repo.typecheck) : plainTsc(dir).pass}},
      ...row.tests ? {test: {...row.tests, ...row.tests.pass ? {} : {again: again(repo.test)}}} : {},
      ...row.lint ? {lint: {...row.lint, ...row.lint.pass ? {} : {again: again(repo.lint)}}} : {},
    };
    row.base_checks = baseChecks(repo);
    // Whether a tree equals `target` outside documentation files.
    const sameAs = target => tree => tree === target ||
      sh('git', ['diff', '--name-only', tree, target], {cwd: dir}).stdout.split('\n').filter(Boolean).every(docLike);
    const same = sameAs(finalTree);
    row.gap = gapOf({transcript: transcriptFile, treeLog, repo, same, finalTree});
    // Each step against the tree it ended on: what it ran there, and whether
    // that tree's checks pass (the final tree's, when the two differ in
    // documentation at most; otherwise run on that tree).
    if (steps.length > 1) for (const [n, step] of row.steps.entries()) {
      step.gap = gapOf({transcript: path.join(runDir, `transcript${suffix(n)}.jsonl`), treeLog: path.join(runDir, `trees${suffix(n)}.jsonl`),
        repo, same: sameAs(step.tree), finalTree: step.tree});
      step.source_changed = sh('git', ['diff', '--name-only', n ? row.steps[n - 1].tree : baseTree, step.tree], {cwd: dir}).stdout
        .split('\n').filter(Boolean).some(file => !docLike(file));
      step.final_checks = same(step.tree) ? row.final_checks : null;
    }
    row.gap.source_changed = row.changed_files.some(file => !docLike(file));
    row.gap.model = opt.model;
  }

  row.metrics = analyze({transcript: transcriptFile, wrapperLog: log, script: repo.script,
    testScript: repo.testScript, lintScript: repo.lintScript, check});
  const verified = new Map();
  // pass: true, false, or null for tests that disagreed with each other.
  // `kind`: the check to run; the task's own check unless a --gap skip names another.
  const tscOn = (tree, kind = check) => {
    const key = `${kind} ${tree}`;
    if (!verified.has(key)) verified.set(key, repo.install ? verifyInPlace(dir, tree, kind === 'lint' ? repo.lint : kind === 'test' ? repo.test : claimed, kind === 'test') :
      verifyTree(dir, tree, path.join(work, 'tree-check'), repo, kind === 'test' ? repo.test : null, kind === 'lint' ? repo.lint : null));
    return verified.get(key).pass;
  };
  const plainOf = kind => ({test: 'plain tests', lint: 'plain lint'}[kind] ?? 'plain tsc'), plain = plainOf(check);
  const flaky = (tree, kind = check) => kind === 'test' && verified.get(`${kind} ${tree}`)?.runs && verified.get(`${kind} ${tree}`).pass === null;
  // A skipped check must pass when it runs plainly on the tree it was skipped on.
  // Under --gap the skipped command says which check it was.
  const kindOf = command => (opt.gap ? segments(command).flatMap(s => Object.keys(checksOf(s, repo)))[0] : null) ?? check;
  row.skip_checks = row.metrics.hook.decisions.filter(d => d.decision === 'deny').map(d => {
    const kind = kindOf(d.command);
    return {command: d.command, kind, tree: d.tree, tsc_pass: d.tree ? tscOn(d.tree, kind) : null, flaky: d.tree ? flaky(d.tree, kind) : false};
  });
  // A CURRENT answer must match a plain run on the tree it was given for.
  row.sync_checks = row.metrics.redue_cli.filter(c => c.status).map(c => {
    const answer = c.status.find(s => s.name === check);
    return {argv: c.argv, freshness: answer?.freshness ?? null, result: answer?.result ?? null,
      reuse_eligible: answer?.reuse_eligible ?? null, tree: c.tree,
      tsc_pass: answer?.freshness === 'CURRENT' && c.tree ? tscOn(c.tree) : null,
      flaky: answer?.freshness === 'CURRENT' && c.tree ? flaky(c.tree) : false};
  });
  const finalPass = check === 'test' ? row.tests?.pass : check === 'lint' ? row.lint?.pass : tsc.pass;
  row.critical = [
    ...(row.final_status?.freshness === 'CURRENT' && row.final_status.result === 'PASS' && finalPass === false ?
      [`final status CURRENT/PASS but ${plain} fail`] : []),
    ...row.skip_checks.filter(s => s.tsc_pass !== true && !s.flaky).map(s => s.tsc_pass === false ?
      `skipped "${s.command}" but ${plainOf(s.kind)} fail on that tree` : `skipped "${s.command}" but its tree could not be checked`),
    ...row.sync_checks.filter(s => s.freshness === 'CURRENT' && !s.flaky && (s.tsc_pass === null || s.tsc_pass !== (s.result === 'PASS'))).map(s =>
      s.tsc_pass === null ? `"${s.argv}" said CURRENT but its tree could not be checked` :
        `"${s.argv}" said CURRENT/${s.result} but ${plain} ${s.tsc_pass ? 'pass' : 'fail'} on that tree`),
  ];
  row.flaky = [...row.skip_checks, ...row.sync_checks].filter(s => s.flaky).length;
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(row, null, 2) + '\n');
  redactDir(runDir);
  if (!opt.keep) fs.rmSync(work, {recursive: true, force: true});
  const m = row.metrics;
  console.log(`   ${m.outcome}, ${Math.round(row.wall_ms / 1000)} s, ${m.turns} turns, $${m.cost_usd?.toFixed(2)}, ` +
    `${check} ${m.typecheck.attempted} attempted / ${m.typecheck.skipped} skipped / ${m.typecheck.rewritten} rewritten, ` +
    `${row.sync_checks.filter(s => s.freshness === 'CURRENT').length} CURRENT syncs checked, ` +
    `final tsc ${tsc.pass ? 'pass' : 'FAIL'}${row.critical.length ? `, CRITICAL: ${row.critical.join('; ')}` : ''}`);
  return row;
}

const rows = [];
let index = 0, pair = 0, stopped = null;
for (const task of selected) {
  const repo = repos.find(r => r.name === task.repo);
  if (!repo) throw new Error(`task ${task.id}: unknown repo ${task.repo}`);
  for (let rep = 1; rep <= +opt.runs; rep++) {
    // Alternate which arm goes first, so machine drift does not favour one arm.
    const arms = opt.arms.split(',');
    if (pair++ % 2 === 1) arms.reverse();
    for (const arm of arms) {
      ++index;
      // A rate-limited session runs again after the limit resets (at most an
      // hour's wait, three attempts); it never counts as a slow session. A
      // limit that resets later than that (a weekly one) ends the run.
      if (stopped) break;
      for (let attempt = 1; ; attempt++) {
        try { rows.push(await runOne(task, repo, arm, index, rep)); break; }
        catch (error) {
          if (error instanceof RateLimited && error.delayMs > 60 * 60_000) {
            stopped = `${error.message}; the run stops here`;
            console.error(`   ${stopped}`);
            break;
          }
          if (error instanceof RateLimited && attempt < 3) {
            const wait = Math.min(error.delayMs + 60_000, 60 * 60_000);
            console.error(`   ${error.message}; waiting ${Math.round(wait / 60_000)} min, attempt ${attempt + 1}`);
            await new Promise(resolve => setTimeout(resolve, wait));
            continue;
          }
          console.error(`   run failed: ${error.message}`);
          rows.push({id: `${index}-${slug(repo.name)}-${task.id}-${arm}-${rep}`, repo: repo.name, task: task.id, kind: task.kind, arm, rep, error: error.message});
          break;
        }
      }
    }
  }
}
const meta = {model: opt.model, max_turns: +opt['max-turns'], runs: +opt.runs, redue: entry, ...(stopped ? {stopped} : {})};
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({...meta, rows}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'results.md'), report(rows, {...meta, out}));
redactDir(out);
console.log(`\nwrote ${path.join(out, 'results.md')}`);
