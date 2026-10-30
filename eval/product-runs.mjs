// The census's product runs (`census.mjs --product`, `python-census.mjs
// --product`): the checks init wrote, two `redue run`s each, and what the
// receipts and status say after each. On Linux with strace, each run is
// traced. A recorded check (general and test recipes) is checked for programs
// the recorder did not see (program-check.mjs); a sandboxed check for reads
// the receipt does not hold (sandbox-check.mjs). Either makes a trusted run
// critical.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {evalDir, localDir, readJson, sh, slug, tmpRoot, checkoutRedue} from './lib.mjs';
import {hasStrace} from './recorded-run.mjs';
import {unrecordedPrograms} from './program-check.mjs';
import {crossCheck, sandboxTraceCalls} from './sandbox-check.mjs';
import {projectState} from '../src/project-location.mjs';
import {sandboxPlaces, systemPlaces} from '../src/sandbox.mjs';

const wait = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const tail = (r, n = 600) => (r.stderr + '\n' + r.stdout).trim().slice(-n);

// {observer} when the observer never became ready, else {checks: {name: {...}}}.
export function productChecks({dir, config, names, env, label, keepTraces = false}) {
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
          reads = crossCheck(trace, {root, files: receipt?.files ?? {}, allowed});
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
      const trusted = receipt?.stable === true && !(receipt.guardIssues ?? []).length;
      if (unrecorded?.length) {
        runs.at(-1).unrecordedCritical = trusted;
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
    console.error(`  ${name}: ${qualifies ? 'QUALIFIES' : second.reason || 'not qualified'}`);
  }
  redue(['stop']); redue(['remove-state']);
  return out;
}
