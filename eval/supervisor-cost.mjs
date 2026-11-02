// What the Linux network supervisor costs a test suite (`census.mjs
// --supervisor-cost`): the suite alternately plain, in the product's sandbox
// with the network open (no supervisor), and in the sandbox with --loopback
// (supervised), three rounds. Medians, statuses, and the connects the
// supervisor handled. Research only; the product does not use this file.
import fs from 'node:fs';
import path from 'node:path';
import {sh, tmpRoot} from './lib.mjs';
import {sandboxArgv, sandboxEnv, sandboxPlaces, sandboxSupport, systemPlaces, testCounts} from '../src/sandbox.mjs';

const median = list => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

export function supervisorCost({dir, argv, env, check, timeout = 600_000, rounds = 3}) {
  const support = sandboxSupport();
  if (support.issue || support.mode !== 'landlock') return {issue: support.issue ?? 'the supervisor runs on Linux'};
  const scratch = fs.mkdtempSync(path.join(tmpRoot, 'supervisor-cost-')), home = path.join(scratch, 'home'), tmp = path.join(scratch, 'tmp');
  fs.mkdirSync(home); fs.mkdirSync(tmp);
  const stats = path.join(scratch, 'stats.json');
  const reads = [dir, home, tmp, ...sandboxPlaces(check, env, dir), ...systemPlaces];
  const supervised = sandboxArgv('landlock', argv, {reads, tmp, python: support.python, stats, network: 'loopback', writes: [dir, home, tmp]});
  const open = supervised.filter(arg => arg !== '--loopback');
  const sandboxEnvironment = sandboxEnv(check, env, {root: dir, home, tmp});
  const out = {plain: [], open: [], supervised: [], connects: [], status: {}};
  try {
    for (let round = 0; round < rounds; round++) for (const [name, cmd, runEnv] of [['plain', argv, env], ['open', open, sandboxEnvironment], ['supervised', supervised, sandboxEnvironment]]) {
      fs.rmSync(stats, {force: true});
      const r = sh(cmd[0], cmd.slice(1), {cwd: dir, env: runEnv, timeout});
      out[name].push(r.ms);
      out.status[name] = r.timedOut ? 'timeout' : r.status;
      out[`${name}Counts`] = testCounts(r.stdout + '\n' + r.stderr);
      if (name === 'supervised') { let s = null; try { s = JSON.parse(fs.readFileSync(stats, 'utf8')); } catch {} out.connects.push(s?.connects ?? 0); out.supervisor = s?.supervisor ?? null; }
    }
  } finally { fs.rmSync(scratch, {recursive: true, force: true}); }
  out.median = {plain: median(out.plain), open: median(out.open), supervised: median(out.supervised)};
  return out;
}
