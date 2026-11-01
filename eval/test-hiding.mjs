// Measurement before the sandboxed recipe takes tests (`census.mjs
// --test-hiding`, `python-census.mjs --test-hiding`): whether a test suite's
// result depends on git-ignored files, and on their existence alone. After
// the project's build, each suite runs:
//
//   present   plainly, with the build's outputs, twice (flaky: they differ)
//   hidden    in the product's sandbox with the git-ignored entries hidden
//             (hiddenEntries), the network open, so only hiding is measured
//   clean     plainly, with those entries moved out of the checkout, as on a
//             fresh CI checkout; they are moved back after
//
// present != clean: the suite depends on ignored files. hidden == clean: hiding
// gives what a clean checkout gives. present != clean but hidden == present:
// it acts on files it cannot read (whether they exist), which hiding does not
// cover. A pytest suite is compared per test (--junitxml); others by the
// counts their summary prints. Research only; the product does not use it.
import fs from 'node:fs';
import path from 'node:path';
import {sh, tmpRoot} from './lib.mjs';
import {hiddenEntries, sandboxArgv, sandboxEnv, sandboxPlaces, sandboxSupport, systemPlaces} from '../src/sandbox.mjs';

const ansi = /\u001b\[[0-9;]*m/g;
// The last count each summary line gives: pytest, Vitest, Jest, Mocha, node --test.
export function testCounts(text) {
  const plain = String(text).replace(ansi, '');
  const last = (...patterns) => { for (const re of patterns) { let m, v = null; const g = new RegExp(re, 'gim'); while ((m = g.exec(plain))) v = Number(m[1]); if (v !== null) return v; } return null; };
  return {passed: last('(\\d+) (?:passed|passing)\\b', '^# pass (\\d+)'), failed: last('(\\d+) (?:failed|failing)\\b', '^# fail (\\d+)'),
    skipped: last('(\\d+) (?:skipped|pending|todo)\\b', '^# skip (\\d+)')};
}
// pytest's per-test outcomes from a JUnit file: {id: pass|fail|skip}.
export function junitOutcomes(file) {
  let xml; try { xml = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const out = {};
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attr = name => new RegExp(`\\s${name}="([^"]*)"`).exec(m[1])?.[1] ?? '';
    const body = m[3] ?? '';
    out[`${attr('classname')}::${attr('name')}`] = /<skipped\b/.test(body) ? 'skip' : /<(failure|error)\b/.test(body) ? 'fail' : 'pass';
  }
  return out;
}

// What a run gave, for comparison.
const outcome = (r, tests) => ({status: r.timedOut ? 'timeout' : r.status, ms: r.ms, counts: testCounts(r.stdout + '\n' + r.stderr), tests,
  tail: r.status === 0 ? undefined : (r.stderr + '\n' + r.stdout).trim().slice(-400)});
const same = (a, b) => a && b && a.status === b.status && (a.tests && b.tests ?
  JSON.stringify(Object.entries(a.tests).sort()) === JSON.stringify(Object.entries(b.tests).sort()) :
  JSON.stringify(a.counts) === JSON.stringify(b.counts));
// The tests whose outcome differs between two runs (pytest).
const differing = (a, b) => a?.tests && b?.tests ? Object.keys({...a.tests, ...b.tests}).filter(t => a.tests[t] !== b.tests[t]).slice(0, 10) : undefined;

// `check`: what the product's sandbox needs to place and set up the run
// ({script, environment} or {command, environment}). `junit(label)`: extra
// argv that writes pytest's JUnit file, and where.
export function testHiding({dir, argv, env, check, timeout = 600_000, junit = null}) {
  const run = (label, cmd = argv, runEnv = env) => {
    const file = junit && path.join(tmpRoot, `test-hiding-${label}.xml`);
    const r = sh(cmd[0], [...cmd.slice(1), ...file ? [`--junitxml=${file}`] : []], {cwd: dir, env: runEnv, timeout});
    const tests = file ? junitOutcomes(file) : undefined;
    if (file) fs.rmSync(file, {force: true});
    return outcome(r, tests ?? undefined);
  };
  const out = {present: run('present'), again: run('again')};
  out.flaky = !same(out.present, out.again);
  const entries = hiddenEntries(dir);
  if (!entries) return {...out, issue: 'git cannot list the ignored files'};
  out.entries = {count: entries.length, examples: entries.slice(0, 8)};
  if (!entries.length) return out;
  // Hidden: the product's sandbox, with its network rules taken out.
  const support = sandboxSupport();
  if (support.issue) out.hiddenIssue = support.issue;
  else {
    const scratch = fs.mkdtempSync(path.join(tmpRoot, 'test-hiding-')), home = path.join(scratch, 'home'), tmp = path.join(scratch, 'tmp');
    fs.mkdirSync(home); fs.mkdirSync(tmp);
    const now = hiddenEntries(dir) ?? entries;
    const reads = [dir, home, tmp, ...sandboxPlaces(check, env, dir), ...systemPlaces];
    let cmd = sandboxArgv(support.mode, argv, {reads, tmp, python: support.python, hidden: now.map(rel => path.join(dir, rel.replace(/\/$/, '')))});
    if (support.mode === 'landlock') cmd = cmd.filter(arg => arg !== '--no-tcp');
    else cmd[2] = cmd[2].split('\n').filter(line => !/^\((?:deny|allow) network/.test(line)).join('\n');
    out.hidden = run('hidden', cmd, sandboxEnv(check, env, {root: dir, home, tmp}));
    fs.rmSync(scratch, {recursive: true, force: true});
  }
  // Clean: the entries moved out of the checkout, and back.
  const aside = fs.mkdtempSync(path.join(tmpRoot, 'test-hiding-aside-')), moved = [];
  try {
    for (const [i, rel] of (hiddenEntries(dir) ?? entries).entries()) {
      const from = path.join(dir, rel.replace(/\/$/, '')), to = path.join(aside, String(i));
      try { fs.renameSync(from, to); moved.push([from, to]); } catch {}
    }
    out.clean = run('clean');
  } finally {
    for (const [from, to] of moved) { fs.rmSync(from, {recursive: true, force: true}); fs.renameSync(to, from); }
    fs.rmSync(aside, {recursive: true, force: true});
  }
  out.dependsOnIgnored = !same(out.present, out.clean);
  out.hiddenLikeClean = same(out.hidden, out.clean);
  out.hiddenLikePresent = same(out.hidden, out.present);
  // Acts on ignored files it cannot read: what hiding would not cover.
  out.existenceOnly = Boolean(out.dependsOnIgnored && out.hiddenLikePresent && !out.hiddenLikeClean);
  out.differs = {clean: differing(out.present, out.clean), hidden: differing(out.present, out.hidden)};
  return out;
}
