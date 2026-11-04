// What REDUE adds to a quick sandboxed check (`census.mjs --overhead`,
// `census.mjs --python --overhead`): after init and a ready observer, each
// sandboxed check alternately plain and through `redue run`, five rounds, with
// REDUE's timing trace for each run. Also the parts of a sandboxed run's setup
// on their own (git's lists of ignored files and documentation, the sandbox
// probe, the launcher around /bin/true), Node's start (`redue --version`), a
// synchronized status, and the Claude Code hook's answer for the check's
// command. Medians in ms. Research only; the product does not use this file.
import fs from 'node:fs';
import path from 'node:path';
import {sh, readJson, tmpRoot, checkoutRedue} from './lib.mjs';
import {projectState} from '../src/project-location.mjs';
import {hiddenDocs, hiddenEntries, isSandboxed, sandboxArgv, sandboxContext, sandboxPlaces, sandboxSupport, systemPlaces} from '../src/sandbox.mjs';

const median = list => { const s = list.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const wait = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const timed = fn => { const started = performance.now(); const value = fn(); return {ms: Math.round(performance.now() - started), value}; };

// `plain(check)`: the argv a developer would run for the check, or null.
export function runOverhead({dir, config, env, plain, rounds = 5}) {
  const run = (cmd, args, extra = {}, timeout = 600_000) => sh(cmd, args, {cwd: dir, env: {...env, ...extra}, timeout});
  const redue = (args, extra = {}, timeout = 600_000) => run(process.execPath, [checkoutRedue, '--config', config, ...args], extra, timeout);
  const json = r => { try { return JSON.parse(r.stdout); } catch { return null; } };
  const out = {checks: {}};
  const init = redue(['init', '--json'], {}, 1_200_000);
  const value = json(init);
  if (!value?.written) return {...out, error: `init wrote no config: ${(init.stderr || init.stdout).slice(-300)}`};
  const checks = readJson(config).checks.filter(c => isSandboxed(c.qualification));
  out.init = value.checks.map(c => ({name: c.name, level: c.level}));
  if (!checks.length) { fs.rmSync(config, {force: true}); return {...out, error: 'no sandboxed check'}; }
  redue(['start']);
  let status = null;
  for (const deadline = Date.now() + 600_000; Date.now() < deadline; wait(1000)) {
    status = json(redue(['status', '--sync', '--json'], {}, 300_000));
    if (status?.observation?.healthy) break;
  }
  if (!status?.observation?.healthy) { out.error = `observer: ${status?.observation?.reason ?? 'unavailable'}`; redue(['stop']); redue(['remove-state']); return out; }
  const root = fs.realpathSync(dir), state = projectState(root, config);
  // The hook needs Claude Code's setup record and settings in the checkout.
  const agent = redue(['agent', 'setup', 'claude', '--apply', '--json']);
  out.agentSetup = agent.status;
  out.node = median([0, 1, 2].map(() => run(process.execPath, [checkoutRedue, '--version']).ms));
  out.status = median([0, 1, 2].map(() => redue(['status', '--sync', '--json']).ms));
  out.cachedStatus = median([0, 1, 2].map(() => redue(['status', '--cached', '--json']).ms));
  // Setup parts, in this process: the second sandboxSupport call is cached.
  const support = timed(() => sandboxSupport());
  out.parts = {supportProbe: support.ms, mode: support.value.mode ?? support.value.issue,
    hiddenEntries: median([0, 1, 2].map(() => timed(() => hiddenEntries(root)).ms)), hiddenCount: hiddenEntries(root)?.length ?? null,
    hiddenDocs: median([0, 1, 2].map(() => timed(() => hiddenDocs(root)).ms)), docsCount: hiddenDocs(root)?.length ?? null};
  if (support.value.mode) {
    const scratch = fs.mkdtempSync(path.join(tmpRoot, 'overhead-')), home = path.join(scratch, 'home'), tmp = path.join(scratch, 'tmp');
    fs.mkdirSync(home); fs.mkdirSync(tmp);
    const reads = [root, home, tmp, ...sandboxPlaces(checks[0], env, root), ...systemPlaces];
    const hidden = (hiddenEntries(root) ?? []).map(rel => path.join(root, rel.replace(/\/$/, '')));
    const docs = hiddenDocs(root) ?? [];
    const launcher = sandboxArgv(support.value.mode, ['/usr/bin/true'], {reads, tmp, python: support.value.python, hidden, docs: {root, entries: docs}});
    out.parts.trueLaunched = median([0, 1, 2, 3, 4].map(() => run(launcher[0], launcher.slice(1)).ms));
    out.parts.truePlain = median([0, 1, 2, 3, 4].map(() => run('/usr/bin/true', []).ms));
    out.parts.context = median([0, 1, 2].map(() => timed(() => sandboxContext(checks[0], env, root)).ms));
    fs.rmSync(scratch, {recursive: true, force: true});
  }
  for (const check of checks) {
    const argv = plain(check), profile = path.join(tmpRoot, `overhead-profile-${process.pid}.txt`);
    const row = out.checks[check.name] = {kind: check.kind, plainArgv: argv, plain: [], redue: [], phases: {}, exits: {plain: [], redue: []}};
    for (let round = 0; round < rounds; round++) {
      if (argv) { const p = run(argv[0], argv.slice(1)); row.plain.push(p.ms); row.exits.plain.push(p.status); }
      fs.rmSync(profile, {force: true});
      const r = redue(['run', check.name, '--json'], {REDUE_DECISION_PROFILE: '1', REDUE_DECISION_PROFILE_FILE: profile});
      row.redue.push(r.ms); row.exits.redue.push(r.status);
      let text = ''; try { text = fs.readFileSync(profile, 'utf8'); } catch {}
      for (const line of text.split('\n')) {
        if (!line.startsWith('REDUE_TIMING ')) continue;
        let t; try { t = JSON.parse(line.slice(13)); } catch { continue; }
        if (t.phase.startsWith('cli.') && Number.isFinite(t.ms)) (row.phases[t.phase] ??= []).push(t.ms);
      }
    }
    row.median = {plain: median(row.plain), redue: median(row.redue)};
    row.median.overhead = row.median.plain === null || row.median.redue === null ? null : row.median.redue - row.median.plain;
    row.phases = Object.fromEntries(Object.entries(row.phases).map(([phase, list]) => [phase, median(list)]));
    // The hook's answer for the check's own command (CURRENT now: a skip).
    if (argv && agent.status === 0) {
      const command = argv.map(arg => arg.startsWith(dir + path.sep) ? path.relative(dir, arg) : arg).join(' ');
      const input = JSON.stringify({hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command}, cwd: root, session_id: 'overhead'});
      const hook = [0, 1, 2].map(() => sh(process.execPath, [checkoutRedue, 'agent', 'hook', 'claude'], {cwd: dir, env, input, timeout: 60_000}));
      row.hook = {ms: median(hook.map(h => h.ms)), command, decision: hook.at(-1).stdout.includes('"deny"') ? 'skip' : hook.at(-1).stdout.includes('updatedInput') ? 'rewrite' : 'allow'};
    }
    fs.rmSync(profile, {force: true});
  }
  out.statusAfter = json(redue(['status', '--sync', '--json']))?.checks?.map(c => ({name: c.name, freshness: c.freshness, result: c.result})) ?? null;
  redue(['stop']); redue(['remove-state']);
  return out;
}
