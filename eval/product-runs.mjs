// The census's product runs (`census.mjs --product`, `python-census.mjs
// --product`): the checks init wrote, two `redue run`s each, and what the
// receipts and status say after each. On Linux with strace, each run is
// traced. A recorded check (general and test recipes) is checked for programs
// the recorder did not see (program-check.mjs); a sandboxed check for reads
// the receipt does not hold (sandbox-check.mjs). Either makes a trusted run
// critical.
//
// Then `others`, the project's other checks (its build, tests, typecheck and
// lint, run plainly as a developer would), and status once more: whether each
// check stayed CURRENT through them (`afterOthers`). The sandboxed recipe
// counts git-ignored files as inputs, so build and test outputs can make it
// STALE; this measures how often.
//
// For the fix, two options are measured on each sandboxed check:
// (b) hide git-ignored files (but installed trees and caches) from the run:
//   init's trial with them hidden (hidden-trial.mjs), after the two runs and
//   again after the other checks; it would stay CURRENT when both trials
//   agree and everything the other checks changed is git-ignored. On Linux
//   the second trial is traced, for what the run still saw of hidden entries
//   (hiddenExposure).
// (a) count only the ignored files the run read (Linux, from the second
//   run's strace): it would stay CURRENT when no changed ignored file was
//   read or looked up, no listed directory gained an ignored entry, and no
//   native addon loaded. That it also needs every program recorded is for
//   the analysis to join from the general-recipe pass.
// `changes` classifies every file the other checks changed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {evalDir, localDir, readJson, sh, slug, tmpRoot, checkoutRedue} from './lib.mjs';
import {hasStrace} from './recorded-run.mjs';
import {unrecordedPrograms} from './program-check.mjs';
import {crossCheck, hiddenExposure, sandboxTraceCalls} from './sandbox-check.mjs';
import {projectState} from '../src/project-location.mjs';
import {sandboxCaches, sandboxPlaces, systemPlaces} from '../src/sandbox.mjs';
import picomatch from 'picomatch';

const wait = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const tail = (r, n = 600) => (r.stderr + '\n' + r.stdout).trim().slice(-n);
const installedTree = /(?:^|\/)(?:node_modules|\.venv)(?:\/|$)/;
const cache = picomatch(sandboxCaches, {dot: true});
const examples = list => ({count: list.length, examples: list.slice(0, 6)});

// {observer} when the observer never became ready, else {checks: {name: {...}}}.
export function productChecks({dir, config, names, env, label, keepTraces = false, others = []}) {
  const run = (cmd, args, timeout) => sh(cmd, args, {cwd: dir, env, timeout});
  const redue = (args, timeout = 120_000) => run(process.execPath, [checkoutRedue, '--config', config, ...args], timeout);
  const json = r => { try { return JSON.parse(r.stdout); } catch { return null; } };
  const out = {checks: {}};
  redue(['start']);
  // The observer indexes the whole checkout first.
  const deadline = Date.now() + 600_000;
  let status = null;
  while (Date.now() < deadline) {
    status = json(redue(['status', '--sync', '--json'], 300_000));
    if (status?.observation?.healthy) break;
    wait(2000);
  }
  if (!status?.observation?.healthy) {
    out.observer = status?.observation?.reason ?? 'unavailable';
    // A link the plan refused: where it leads, and the checks that matched it.
    const link = /symlink unsupported: (\S+)/.exec(out.observer)?.[1];
    if (link) {
      const at = path.join(dir, link), info = {};
      try { info.readlink = fs.readlinkSync(at); info.real = path.relative(dir, fs.realpathSync(at)); info.directory = fs.statSync(at).isDirectory(); } catch (e) { info.error = e.code; }
      try { info.checks = readJson(config).checks.map(c => ({name: c.name, qualification: c.qualification, workspace: c.workspace,
        installedInputs: (c.installedInputs ?? []).filter(p => !p.startsWith('!'))})); } catch {}
      out.observerLink = info;
    }
    redue(['stop']); redue(['remove-state']); return out;
  }
  const root = fs.realpathSync(dir), state = projectState(root, config);
  const git = (...args) => run('git', args, 300_000).stdout.split('\0').filter(Boolean);
  // hidden-trial.mjs for the check `name`, traced into `trace` when given.
  const hiddenTrial = (name, trace = null) => {
    const check = readJson(config).checks.find(c => c.name === name);
    const args = [path.join(evalDir, 'hidden-trial.mjs'), root, JSON.stringify(check)];
    const r = trace ? sh('strace', ['-f', '-qq', '-y', '-s', '4096', '-e', `trace=${sandboxTraceCalls}`, '-o', trace, process.execPath, ...args],
      {cwd: dir, env, timeout: 1_300_000}) : sh(process.execPath, args, {cwd: dir, env, timeout: 1_300_000});
    let value; try { value = JSON.parse(r.stdout.trim().split('\n').at(-1)); } catch { return {error: tail(r, 300)}; }
    const {entries = [], ...rest} = value;
    const out = {...rest, entries: examples(entries)};
    if (trace) try { out.exposure = hiddenExposure(trace, {root, hidden: entries}); } catch (e) { out.exposure = {error: String(e.message).slice(0, 200)}; }
    return out;
  };
  const readSets = new Map(), hidden = new Map();
  for (const name of names) {
    const runtime = readJson(path.join(state, 'project-runtime-v1.json')).checks.find(c => c.name === name);
    const sandboxed = runtime?.qualification === 'sandbox-v1';
    const runs = [];
    for (const n of [1, 2]) {
      // Files the run touched, for a run that is not stable.
      const mark = path.join(tmpRoot, 'census-run-mark');
      fs.writeFileSync(mark, '');
      let r, unrecorded, reads;
      const work = hasStrace ? fs.mkdtempSync(path.join(tmpRoot, 'census-trace-')) : null, trace = work && path.join(work, 'strace');
      if (hasStrace && sandboxed) {
        r = sh('strace', ['-D', '-f', '-qq', '-y', '-s', '4096', '-e', `trace=${sandboxTraceCalls}`, '-o', trace,
          process.execPath, checkoutRedue, '--config', config, 'run', name, '--json'], {cwd: dir, env, timeout: 600_000});
      } else if (hasStrace) {
        // Hard links stay on the state's file system.
        const copy = fs.mkdtempSync(path.join(path.dirname(state), 'census-record-'));
        const keeper = spawn(process.execPath, [path.join(evalDir, 'record-keeper.mjs'), state, copy], {stdio: 'ignore'});
        wait(300);
        // -D: strace is not the run's parent, so a detached descendant does not hold the run open.
        r = sh('strace', ['-D', '-f', '-qq', '-s', '4096', '-e', 'trace=execve,execveat,clone,clone3,fork,vfork', '-o', trace,
          process.execPath, checkoutRedue, '--config', config, 'run', name, '--json'], {cwd: dir, env, timeout: 600_000});
        wait(500);
        keeper.kill();
        unrecorded = unrecordedPrograms(trace, copy) ?? 'trace or record unavailable';
        if (keepTraces) { const kept = path.join(localDir, 'census-traces', slug(label), `${name}-${n}`); fs.mkdirSync(kept, {recursive: true});
          try { fs.cpSync(copy, path.join(kept, 'record'), {recursive: true}); } catch {} }
        fs.rmSync(copy, {recursive: true, force: true});
      } else r = redue(['run', name, '--json'], 600_000);
      const touched = () => run('find', ['.', '-newer', mark, '-not', '-path', './.git/*', '-not', '-name', path.basename(config)])
        .stdout.split('\n').filter(Boolean).slice(0, 40);
      const now = json(redue(['status', '--sync', '--json'], 300_000))?.checks?.find(x => x.name === name);
      let receipt = null; try { receipt = readJson(path.join(state, 'receipts-v1.json')).checks?.[name]; } catch {}
      if (hasStrace && sandboxed) {
        try {
          const allowed = [state, ...sandboxPlaces(runtime, env, root), ...systemPlaces];
          const {paths, addon, ...checked} = crossCheck(trace, {root, files: receipt?.files ?? {}, allowed,
            allowedPrefixes: [path.join(fs.realpathSync(os.tmpdir()), 'redue-run-')], collect: true});
          reads = {...checked, addon};
          if (n === 2) readSets.set(name, {paths, addon});
        } catch (error) { reads = {error: String(error.message).slice(0, 200), findings: ['trace unavailable']}; }
      }
      if (keepTraces && trace) { const kept = path.join(localDir, 'census-traces', slug(label), `${name}-${n}`); fs.mkdirSync(kept, {recursive: true});
        try { fs.copyFileSync(trace, path.join(kept, 'strace')); } catch {} }
      if (work) fs.rmSync(work, {recursive: true, force: true});
      runs.push({exit: r.status, timedOut: r.timedOut, ms: r.ms, result: receipt?.result ?? null, stable: receipt?.stable ?? null,
        guardIssues: receipt?.guardIssues ?? null, checkpointIssues: receipt?.checkpoint?.issues ?? null, fingerprint: receipt?.fingerprint ?? null,
        sandbox: receipt?.sandbox ?? null, freshness: now?.freshness ?? null, reason: now?.reason ?? null, tail: r.status === 0 ? undefined : tail(r, 300),
        touched: receipt?.stable === false ? touched() : undefined, unrecorded, reads});
      // Critical when the run was trusted anyway: stable, with no guard issue.
      // The program check reads the test recorder's record, so it applies to
      // the recipes that have a guard (general and test recipes), as before
      // this module: a direct TypeScript run has none.
      const trusted = receipt?.stable === true && !(receipt.guardIssues ?? []).length;
      if (unrecorded?.length) {
        runs.at(-1).unrecordedCritical = trusted && Array.isArray(receipt.guardIssues);
        console.error(`  ${trusted ? 'CRITICAL ' : ''}UNRECORDED PROGRAMS in ${name} run ${n}: ${typeof unrecorded === 'string' ? unrecorded : unrecorded.map(u => `${u.how} ${u.program}`).join(', ')}`);
      }
      if (reads?.findings?.length) {
        runs.at(-1).readsCritical = trusted;
        console.error(`  ${trusted ? 'CRITICAL ' : ''}SANDBOXED READS in ${name} run ${n}: ${reads.findings.slice(0, 8).join('; ')}`);
      }
    }
    const [first, second] = runs;
    // A trusted run the cross-check could not cover does not qualify.
    const qualifies = !runs.some(x => x.timedOut || x.unrecordedCritical || x.readsCritical) && second.stable === true && !(second.guardIssues ?? []).length &&
      second.freshness === 'CURRENT' && first.fingerprint !== null && first.fingerprint === second.fingerprint;
    out.checks[name] = {qualification: runtime?.qualification ?? null, runs, qualifies, pass: runs.map(x => x.result === 'PASS')};
    if (sandboxed && others.length) hidden.set(name, {before: hiddenTrial(name)});
    console.error(`  ${name}: ${qualifies ? 'QUALIFIES' : second.reason || 'not qualified'}`);
  }
  if (others.length && Object.keys(out.checks).length) {
    // What is there before the other checks run: tracked files, ignored ones
    // outside the installed trees, and every directory that holds either.
    const mark = path.join(tmpRoot, 'census-others-mark');
    fs.writeFileSync(mark, '');
    const ignoredOf = () => new Set(git('ls-files', '-z', '--others', '--ignored', '--exclude-standard').filter(rel => !installedTree.test(rel)));
    const tracked = new Set(git('ls-files', '-z')), ignoredBefore = ignoredOf(), untrackedBefore = new Set(git('ls-files', '-z', '--others', '--exclude-standard'));
    const before = new Set();
    for (const rel of [...tracked, ...ignoredBefore, ...untrackedBefore]) for (let at = rel; at !== '.'; at = path.dirname(at)) before.add(at);
    out.others = others.map(({label: what, argv, timeout}) => {
      const r = sh(argv[0], argv.slice(1), {cwd: dir, env, timeout});
      return {label: what, exit: r.status, timedOut: r.timedOut, ms: r.ms};
    });
    // The observer catches up with what they wrote first: a pending
    // reconciliation or inspection, or a timed-out call, is not an answer yet.
    const transient = /reconciliation pending|pending content inspection|synchronization timeout|observation is initializing/;
    let now = null;
    for (const until = Date.now() + 120_000; Date.now() < until; wait(2000)) {
      now = json(redue(['status', '--sync', '--json'], 300_000));
      if (now?.observation?.healthy && !now.checks?.some(x => transient.test(x.reason ?? ''))) break;
    }
    // Every file they changed or made, by class, and what they removed.
    const changedFiles = run('find', ['.', '-newer', mark, '-type', 'f', '-not', '-path', './.git/*'], 300_000).stdout.split('\n')
      .filter(Boolean).map(rel => rel.replace(/^\.\//, '')).filter(rel => rel !== path.basename(config));
    const ignoredAfter = ignoredOf(), c = {tracked: [], untracked: [], installed: [], cache: [], ignored: []};
    for (const rel of changedFiles) c[tracked.has(rel) ? 'tracked' : installedTree.test(rel) ? 'installed' : cache(rel) ? 'cache' :
      ignoredAfter.has(rel) ? 'ignored' : 'untracked'].push(rel);
    const trackedDeleted = git('ls-files', '-z', '--deleted'), ignoredRemoved = [...ignoredBefore].filter(rel => !ignoredAfter.has(rel) && !cache(rel));
    const ignoredCreated = c.ignored.filter(rel => !ignoredBefore.has(rel));
    out.changes = {files: changedFiles.length, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, examples(v)])),
      trackedDeleted: examples(trackedDeleted), ignoredCreated: examples(ignoredCreated), ignoredRemoved: examples(ignoredRemoved)};
    // Inputs under both options: tracked, untracked but not ignored, installed.
    const kept = c.tracked.length + c.untracked.length + c.installed.length + trackedDeleted.length;
    for (const [name, value] of Object.entries(out.checks)) {
      const row = now?.checks?.find(x => x.name === name);
      value.afterOthers = {freshness: row?.freshness ?? null, reason: row?.reason ?? null, changed: row?.changed_inputs?.slice(0, 5) ?? []};
      const current = value.afterOthers.freshness === 'CURRENT';
      // STALE only on files, all of them ignored ones.
      const onlyIgnored = value.afterOthers.freshness === 'STALE' && value.afterOthers.changed.length > 0 && kept === 0;
      const h = hidden.get(name);
      if (h) {
        const work = hasStrace ? fs.mkdtempSync(path.join(tmpRoot, 'census-hidden-')) : null;
        h.after = hiddenTrial(name, work && path.join(work, 'strace'));
        if (work) fs.rmSync(work, {recursive: true, force: true});
        value.optionB = {...h, stays: Boolean(h.before.same && h.after.same && (current || onlyIgnored))};
      }
      const read = readSets.get(name);
      if (read) {
        const changedIgnored = [...c.ignored, ...ignoredRemoved];
        const touched = changedIgnored.filter(rel => read.paths.read.has(rel) || read.paths.probed.has(rel));
        // A new ignored entry in a directory the run listed.
        const listed = ignoredCreated.filter(rel => {
          for (let child = rel, at = path.dirname(rel); ; child = at, at = path.dirname(at)) {
            const dirRel = at === '.' ? '' : at;
            if (read.paths.listed.has(dirRel) && !before.has(child)) return true;
            if (at === '.') return false;
          }
        });
        value.optionA = {touched: examples(touched), listed: examples(listed), addon: read.addon,
          stays: Boolean(current || onlyIgnored && !touched.length && !listed.length && !read.addon)};
      }
    }
    console.error(`  after ${others.map(o => o.label).join(', ')}: ${Object.entries(out.checks).map(([name, v]) => `${name} ${v.afterOthers.freshness}`).join(', ')}`);
  }
  redue(['stop']); redue(['remove-state']);
  return out;
}
