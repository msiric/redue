#!/usr/bin/env node
// A/B runs of headless Claude Code sessions with and without REDUE.
//
//   node eval/run.mjs --pilot                  # tasks marked "pilot" in eval/tasks.json
//   node eval/run.mjs --repo NAME --task ID    # narrow the selection
//
// Options: --arms control,redue  --model claude-sonnet-5-5  --max-turns 30
//          --redue PATH (REDUE entry for the REDUE arm; default: this checkout)
//          --keep (keep each run's clone)  --out DIR
//
// Every run gets a fresh clone at the repo's pinned commit, `npm ci
// --ignore-scripts`, and its own `claude -p` session. The REDUE arm also runs
// init, agent setup claude --apply, start and one `redue run typecheck` before
// the session: the receipt stands for an earlier session's passing check.
// Afterwards plain tsc (and quick tests) check the final tree, and each skipped
// typecheck is rerun with plain tsc on the tree it was skipped on.
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {checkoutRedue, evalDir, freshClone, harnessEnv, localDir, plainTsc, readJson, redue, sh, slug, stamp,
  tmpRoot, checkStatus, must, waitReady} from './lib.mjs';
import {writeWrapper} from './wrapper.mjs';
import {analyze} from './analyze.mjs';
import {report} from './report.mjs';

const {values: opt} = parseArgs({options: {
  pilot: {type: 'boolean'}, repo: {type: 'string'}, task: {type: 'string'}, arms: {type: 'string', default: 'control,redue'},
  model: {type: 'string', default: 'claude-sonnet-5-5'}, 'max-turns': {type: 'string', default: '30'},
  redue: {type: 'string', default: checkoutRedue}, keep: {type: 'boolean'}, out: {type: 'string'},
}});
const entry = path.resolve(opt.redue);
const repos = readJson(path.join(evalDir, 'repos.json')).repos;
const tasks = readJson(path.join(evalDir, 'tasks.json')).tasks;
const selected = tasks.filter(t => (!opt.pilot || t.pilot) && (!opt.repo || t.repo === opt.repo) && (!opt.task || t.id === opt.task));
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

// Plain tsc on the tree a typecheck was skipped on, with the run's node_modules.
function verifyTree(dir, tree, scratch) {
  fs.rmSync(scratch, {recursive: true, force: true});
  fs.mkdirSync(scratch, {recursive: true});
  must(sh('sh', ['-c', `git archive ${tree} | tar -x -C "${scratch}"`], {cwd: dir}), 'git archive');
  must(sh('cp', ['-cR', path.join(dir, 'node_modules'), path.join(scratch, 'node_modules')]), 'copy node_modules');
  const result = plainTsc(scratch);
  fs.rmSync(scratch, {recursive: true, force: true});
  return result;
}

function expectations(dir, task) {
  return (task.expect || []).map(e => {
    let text = '';
    try { text = fs.readFileSync(path.join(dir, e.file), 'utf8'); } catch {}
    const ok = e.includes !== undefined ? text.includes(e.includes) : e.excludes !== undefined ? !text.includes(e.excludes) :
      e.matches !== undefined ? new RegExp(e.matches, 'm').test(text) : false;
    return {...e, ok};
  });
}

function runOne(task, repo, arm, index) {
  const id = `${String(index).padStart(2, '0')}-${slug(repo.name)}-${task.id}-${arm}`;
  const dir = path.join(tmpRoot, 'runs', id, 'repo');
  try { return runSession(task, repo, arm, id); }
  finally { if (arm === 'redue' && fs.existsSync(dir)) redue(entry, dir, 'stop'); }
}

function runSession(task, repo, arm, id) {
  const runDir = path.join(out, id), work = path.join(tmpRoot, 'runs', id), dir = path.join(work, 'repo');
  fs.mkdirSync(runDir, {recursive: true});
  const row = {id, repo: repo.name, commit: repo.commit, task: task.id, kind: task.kind, arm, setup: {}};
  console.log(`\n== ${id}`);
  let started = performance.now();
  freshClone(repo, repo.commit, dir);
  row.setup.clone_ms = Math.round(performance.now() - started);

  const log = path.join(runDir, 'redue-calls.jsonl'), bin = path.join(work, 'bin');
  const env = harnessEnv({PATH: pathWithout(arm === 'redue' ? bin : null)});
  if (arm === 'redue') {
    writeWrapper(bin, entry, log);
    const step = (label, ...argv) => {
      const r = must(sh(path.join(bin, 'redue'), argv, {cwd: dir, env}), `redue ${argv.join(' ')}`);
      row.setup[label] = r.ms;
    };
    step('init_ms', 'init', '--recipe', 'typescript-direct', '--check', 'typecheck');
    step('agent_setup_ms', 'agent', 'setup', 'claude', '--apply');
    step('start_ms', 'start');
    row.setup.index_ms = waitReady(entry, dir, {env});
    step('seed_run_ms', 'run', 'typecheck');
    row.setup.seed_status = checkStatus(entry, dir);
    fs.renameSync(log, path.join(runDir, 'setup-calls.jsonl'));
  }
  const baseTree = treeOf(dir);

  const args = ['-p', task.prompt, '--model', opt.model, '--max-turns', opt['max-turns'],
    '--output-format', 'stream-json', '--verbose', '--no-session-persistence',
    '--setting-sources', 'project,local', '--settings', JSON.stringify({autoMemoryEnabled: false}),
    '--strict-mcp-config', '--mcp-config', JSON.stringify({mcpServers: {}}),
    '--tools', tools, '--allowedTools', tools, '--permission-mode', 'dontAsk'];
  fs.writeFileSync(path.join(runDir, 'session.json'), JSON.stringify({cwd: dir, args}, null, 2) + '\n');
  started = performance.now();
  const session = sh('claude', args, {cwd: dir, env, timeout: 45 * 60_000});
  row.wall_ms = Math.round(performance.now() - started);
  row.exit = session.status ?? session.signal;
  fs.writeFileSync(path.join(runDir, 'transcript.jsonl'), session.stdout);
  if (session.stderr) fs.writeFileSync(path.join(runDir, 'stderr.txt'), session.stderr);

  // Independent checks on the final state.
  if (arm === 'redue') {
    row.final_status = checkStatus(entry, dir);
    redue(entry, dir, 'stop');
  }
  const finalTree = treeOf(dir);
  const diff = sh('git', ['diff', '--stat', baseTree, finalTree], {cwd: dir}).stdout;
  fs.writeFileSync(path.join(runDir, 'diff.patch'), sh('git', ['diff', baseTree, finalTree], {cwd: dir}).stdout);
  row.changed_files = sh('git', ['diff', '--name-only', baseTree, finalTree], {cwd: dir}).stdout.split('\n').filter(Boolean);
  row.diff_stat = diff.trim().split('\n').at(-1) || '';
  const tsc = plainTsc(dir);
  row.final_tsc = {pass: tsc.pass, ms: tsc.ms};
  if (!tsc.pass) fs.writeFileSync(path.join(runDir, 'final-tsc.txt'), tsc.output);
  if (repo.test) {
    const test = sh('sh', ['-c', repo.test], {cwd: dir, timeout: 300_000});
    row.tests = {pass: test.status === 0, ms: test.ms};
    if (test.status !== 0) fs.writeFileSync(path.join(runDir, 'tests.txt'), (test.stdout + test.stderr).slice(-8000));
  }
  row.expect = expectations(dir, task);

  row.metrics = analyze({transcript: path.join(runDir, 'transcript.jsonl'), wrapperLog: log, script: repo.script});
  // A skipped typecheck must pass when plain tsc runs on the tree it was skipped on.
  row.skip_checks = row.metrics.hook.decisions.filter(d => d.decision === 'deny').map(d => {
    const result = d.tree ? verifyTree(dir, d.tree, path.join(work, 'skip-check')) : null;
    return {command: d.command, tree: d.tree, tsc_pass: result?.pass ?? null};
  });
  row.critical = [
    ...(row.final_status?.freshness === 'CURRENT' && row.final_status.result === 'PASS' && !tsc.pass ?
      ['final status CURRENT/PASS but plain tsc fails'] : []),
    ...row.skip_checks.filter(s => s.tsc_pass !== true).map(s => s.tsc_pass === false ?
      `skipped "${s.command}" but plain tsc fails on that tree` : `skipped "${s.command}" but its tree could not be checked`),
  ];
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(row, null, 2) + '\n');
  if (!opt.keep) fs.rmSync(work, {recursive: true, force: true});
  const m = row.metrics;
  console.log(`   ${m.outcome}, ${Math.round(row.wall_ms / 1000)} s, ${m.turns} turns, $${m.cost_usd?.toFixed(2)}, ` +
    `typecheck ${m.typecheck.attempted} attempted / ${m.typecheck.skipped} skipped / ${m.typecheck.rewritten} rewritten, ` +
    `final tsc ${tsc.pass ? 'pass' : 'FAIL'}${row.critical.length ? `, CRITICAL: ${row.critical.join('; ')}` : ''}`);
  return row;
}

const rows = [];
let index = 0;
for (const task of selected) {
  const repo = repos.find(r => r.name === task.repo);
  if (!repo) throw new Error(`task ${task.id}: unknown repo ${task.repo}`);
  // Alternate which arm goes first, so machine drift does not favour one arm.
  const arms = opt.arms.split(',');
  if (index / arms.length % 2 === 1) arms.reverse();
  for (const arm of arms) {
    try { rows.push(runOne(task, repo, arm, ++index)); }
    catch (error) {
      console.error(`   run failed: ${error.message}`);
      rows.push({id: `${index}-${slug(repo.name)}-${task.id}-${arm}`, repo: repo.name, task: task.id, kind: task.kind, arm, error: error.message});
    }
  }
}
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({model: opt.model, max_turns: +opt['max-turns'], redue: entry, rows}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'results.md'), report(rows, {model: opt.model, maxTurns: opt['max-turns'], out}));
console.log(`\nwrote ${path.join(out, 'results.md')}`);
