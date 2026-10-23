// One package-manager script run under REDUE's run recorder, for the census
// (`census.mjs --recorded`): what a general recipe for any Node-based script
// would see. Research only; the product does not use this file.
//
// The run is `npm run NAME` (or `pnpm`/`yarn` through Corepack) with the test
// recorder preloaded in every Node process. On Linux, when strace is
// installed, it also records every program the run executed, which the
// recorder cannot see behind a shell. Before and after, it hashes the whole
// checkout (minus .git and node_modules) and lists installed files newer than
// the run's start.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {testRecorder} from '../src/test-direct.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
export const hasStrace = process.platform === 'linux' && spawnSync('strace', ['-V']).status === 0;

// Runner and package-manager caches: written by honest tools keyed on their
// own inputs, so they are not inputs of the check.
export const cachePath = rel => /(^|\/)(\.cache|\.vite|\.vitest|\.turbo|\.nx|\.swc|\.jest-cache|\.parcel-cache|\.angular\/cache|\.next\/cache|\.tmp)(\/|$)|\.tsbuildinfo$|(^|\/)\.(eslint|stylelint|prettier)cache$/.test(rel);

// Every node_modules directory in the checkout, not descending into them.
export function modulesDirs(root) {
  const found = [];
  (function walk(dir) {
    let entries; try { entries = fs.readdirSync(dir, {withFileTypes: true}); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.git') continue;
      if (entry.name === 'node_modules') found.push(path.join(dir, entry.name)); else walk(path.join(dir, entry.name));
    }
  })(root);
  return found;
}

// rel -> content digest (or link target) for the checkout minus .git and
// node_modules. Unchanged identities reuse the previous digest.
export function snapshot(root, previous = new Map()) {
  const files = new Map(), ids = new Map();
  (function walk(dir) {
    let entries; try { entries = fs.readdirSync(dir, {withFileTypes: true}); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name), rel = path.relative(root, full).split(path.sep).join('/');
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.isSymbolicLink()) { try { files.set(rel, 'link:' + fs.readlinkSync(full)); } catch {} continue; }
      if (!entry.isFile()) continue;
      let st; try { st = fs.statSync(full, {bigint: true}); } catch { continue; }
      const id = `${st.ino}:${st.size}:${st.mtimeNs}:${st.ctimeNs}`, old = previous.ids?.get(rel);
      if (old && old[0] === id) { files.set(rel, old[1]); ids.set(rel, old); continue; }
      try { const digest = sha(fs.readFileSync(full)); files.set(rel, digest); ids.set(rel, [id, digest]); } catch {}
    }
  })(root);
  files.ids = ids;
  return files;
}

const changes = (before, after) => [...new Set([...before.keys(), ...after.keys()])]
  .filter(rel => before.get(rel) !== after.get(rel)).map(rel => [rel, !after.has(rel) ? 'deleted' : !before.has(rel) ? 'created' : 'modified']);

// Installed files created or changed since `marker` (find -newer / -cnewer).
function installedChanges(root, dirs, marker) {
  if (!dirs.length) return [];
  const out = spawnSync('find', [...dirs, '(', '-newer', marker, '-o', '-cnewer', marker, ')', '-type', 'f'],
    {encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 300_000});
  return (out.stdout || '').split('\n').filter(Boolean).map(file => path.relative(root, file).split(path.sep).join('/'));
}

// Final program image per process, and the process that started it, from
// `strace -f -e trace=execve,clone,clone3,fork,vfork`. A thread's clones
// count for its process.
function programs(file) {
  let text = ''; try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  // strace splits a call another process interrupted into two lines, and a
  // child's first line can come before its parent's clone returns.
  const pending = new Map(), lines = [];
  for (let line of text.split('\n')) {
    const pid = /^(\d+)\s/.exec(line)?.[1];
    if (!pid) continue;
    if (line.endsWith('<unfinished ...>')) { pending.set(pid, line.slice(0, -'<unfinished ...>'.length)); continue; }
    const resumed = /^\d+\s+<\.\.\. \w+ resumed>(.*)$/.exec(line);
    if (resumed) { line = (pending.get(pid) ?? `${pid} ?(`) + resumed[1]; pending.delete(pid); }
    lines.push(line);
  }
  const parentOf = new Map(), processOf = new Map();
  for (const line of lines) {
    const fork = /^(\d+)\s+(clone3?|v?fork)\(.*= (\d+)$/.exec(line);
    if (fork) (/CLONE_THREAD/.test(line) ? processOf : parentOf).set(fork[3], fork[1]);
  }
  const owner = pid => processOf.has(pid) ? owner(processOf.get(pid)) : pid;
  // Each process runs its parent's image until it execs.
  const current = new Map(), last = new Map();
  const imageOf = pid => current.get(pid) ?? (parentOf.has(pid) ? imageOf(owner(parentOf.get(pid))) : null);
  for (const line of lines) {
    const exec = /^(\d+)\s+execve\("((?:[^"\\]|\\.)*)", \[(.*?)\], .*\)\s*= 0$/.exec(line);
    if (!exec) continue;
    const pid = owner(exec[1]);
    const argv = [...exec[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => { try { return JSON.parse(`"${m[1].replace(/\\x([0-9a-f]{2})/gi, '\\u00$1')}"`); } catch { return m[1]; } });
    const from = last.get(pid)?.parent ?? (parentOf.has(pid) ? imageOf(owner(parentOf.get(pid))) : null);
    const program = {file: exec[2], argv, parent: from ? {file: from.file, argv: from.argv} : null};
    current.set(pid, program);
    // The final image per process: a shebang script, then the interpreter
    // it execs, counts as the interpreter.
    last.set(pid, program);
  }
  return [...last.values()];
}

const shells = new Set(['sh', 'bash', 'dash', 'zsh']);
const builtins = new Set(['echo', 'true', 'false', 'exit', 'cd', 'test', '[', 'export', 'set', ':', 'printf', 'exec']);
const nodeLaunchers = new Set(['node', 'npm', 'npx', 'pnpm', 'pnpx', 'yarn', 'yarnpkg', 'corepack']);
// Whether a `sh -c` command is, by its text alone, only Node programs and
// shell builtins: what a product could check without tracing processes.
function staticallyNode(command, root, binDirs) {
  if (/[`$<>|*?(){}]|\\\n/.test(command.replace(/\|\|/g, '&&'))) return false;
  for (const part of command.split(/&&|\|\||;/)) {
    const words = part.trim().split(/\s+/).filter(Boolean);
    while (words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) words.shift();
    if (!words.length) continue;
    const name = words[0].replace(/^\.\/node_modules\/\.bin\//, '');
    if (builtins.has(name) || nodeLaunchers.has(name)) continue;
    const bin = binDirs.map(dir => path.join(dir, name)).find(file => fs.existsSync(file));
    if (!bin) return false;
    let head = ''; try { const real = fs.realpathSync(bin); head = /\.[cm]?js$/.test(real) ? '#!node' : fs.readFileSync(real, 'utf8').slice(0, 200); } catch { return false; }
    if (!/^#!.*\bnode\b/.test(head) && head !== '#!node') return false;
  }
  return true;
}

// Outside-the-checkout paths by who owns them.
function outsideKind(file, {nodePrefix, home}) {
  const under = dir => file === dir || file.startsWith(dir + path.sep);
  if (under(nodePrefix) || under(path.join(home, '.cache', 'node', 'corepack')) || process.env.COREPACK_HOME && under(process.env.COREPACK_HOME)) return 'toolchain';
  if (['.npm', '.local/state/pnpm', '.cache/pnpm', '.local/share/pnpm', '.yarn', '.cache/yarn', '.yarn-cache', 'Library/pnpm', 'Library/Caches/Yarn', 'Library/Caches/pnpm']
    .some(dir => under(path.join(home, dir)))) return 'package-manager state';
  if (/^\/(proc|sys|dev)\//.test(file)) return 'os';
  if (under(home) && /^\.(npmrc|yarnrc(\.yml)?|config)/.test(path.relative(home, file))) return 'user config';
  if (under('/etc')) return 'system config';
  return 'other';
}

// Runs `runner` (argv) in `root` under the recorder; returns the raw facts.
export function recordedRun({root, argv, env, timeout, label}) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `redue-recorded-${label}-`)), records = path.join(work, 'records');
  fs.mkdirSync(records);
  const dirs = modulesDirs(root), tmp = [...new Set([path.resolve(os.tmpdir()), fs.realpathSync(os.tmpdir())])];
  const guard = path.join(work, 'guard.json');
  fs.writeFileSync(guard, JSON.stringify({schema: 1, dir: records, root, tmp, installed: dirs, runnerData: [],
    env: Object.fromEntries(Object.entries(env).map(([key, value]) => [key, sha(value)]))}));
  const preload = `--require "${testRecorder}"`;
  const runEnv = {...env, NODE_OPTIONS: env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ${preload}` : preload, REDUE_RUN_RECORD: guard};
  const marker = path.join(work, 'marker');
  fs.writeFileSync(marker, '');
  const trace = path.join(work, 'strace');
  const [cmd, args] = hasStrace ? ['strace', ['-f', '-qq', '-s', '4096', '-e', 'trace=execve,clone,clone3,fork,vfork', '-o', trace, ...argv]] : [argv[0], argv.slice(1)];
  const started = performance.now();
  const out = spawnSync(cmd, args, {cwd: root, env: runEnv, timeout, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});
  const ms = Math.round(performance.now() - started);
  const rows = [];
  for (const name of fs.readdirSync(records)) {
    try { rows.push(fs.readFileSync(path.join(records, name), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))); }
    catch { rows.push([['U', 'unreadable record']]); }
  }
  const result = {ms, status: out.status, timedOut: out.signal === 'SIGTERM' || out.error?.code === 'ETIMEDOUT',
    tail: out.status === 0 ? undefined : ((out.stderr || '') + '\n' + (out.stdout || '')).trim().slice(-400),
    rows, programs: hasStrace ? programs(trace) : null, installedChanged: installedChanges(root, dirs, marker)};
  fs.rmSync(work, {recursive: true, force: true});
  return result;
}

// What stops one run from qualifying, as reasons (empty: clean), plus facts
// the cross-run comparison needs.
export function analyzeRun(run, {root, before, after}) {
  const reasons = [], add = reason => { if (!reasons.includes(reason)) reasons.push(reason); };
  const nodePrefix = path.dirname(path.dirname(fs.realpathSync(process.execPath))), home = os.homedir();
  const reads = new Set(), produced = new Set(), made = [], outside = {}, headers = [];
  let envReads = 0;
  for (const rows of run.rows) {
    for (const [kind, ...value] of rows) {
      if (kind === 'H') headers.push(value[0]);
      else if (kind === 'U') add(`recorder: ${value[0]}`);
      else if (kind === 'N') add(`network: ${String(value[0]).replace(/:\d+$/, '')}`);
      else if (kind === 'R') { if (value[1]) reads.add(value[0]); }
      else if (kind === 'P') produced.add(value[0]);
      else if (kind === 'M') { const rel = path.relative(root, value[0]).split(path.sep).join('/'); if (!rel.startsWith('..')) made.push(rel); }
      else if (kind === 'E') envReads++;
      else if (kind === 'O') {
        const [question, file, answer] = value, where = outsideKind(file, {nodePrefix, home});
        if (where === 'toolchain' || where === 'package-manager state' || where === 'os') continue;
        // A missing path, a kind or a link resolution is a re-checkable fact;
        // a small read is kept by content; a listing or a large read is not.
        const fact = answer === null || question === 'stat' || question === 'realpath' ? 'lookup' :
          question === 'read' && typeof answer?.content === 'string' ? 'content' : 'unrecordable';
        (outside[fact] ??= new Set()).add(`${where}\t${question}\t${file}`);
      }
    }
  }
  if (!headers.length) add('no Node process loaded the recorder');
  for (const item of outside.unrecordable ?? []) { const [where, question] = item.split('\t'); add(`outside ${question === 'list' ? 'listing' : 'large read'}: ${where}`); }
  // Small outside files kept by content: a separate tier in the report.
  for (const item of outside.content ?? []) add(`outside file read: ${item.split('\t')[0]}`);
  // Programs other than Node and shells; Node processes without the recorder.
  let shellCommands = [];
  const others = [];
  if (run.programs) {
    for (const program of run.programs) {
      const base = path.basename(program.file);
      if (/^node(js)?$/.test(base)) continue;
      if (shells.has(base)) { const at = program.argv.indexOf('-c'); if (at >= 0) shellCommands.push(program.argv[at + 1]); continue; }
      if (base === 'strace') continue;
      add(`runs ${base}`);
      const short = argv => argv.join(' ').slice(0, 160);
      if (others.length < 25 && !others.some(o => o.program === base && o.parent === (program.parent ? path.basename(program.parent.file) : null)))
        others.push({program: base, argv: short(program.argv), parent: program.parent ? path.basename(program.parent.file) : null,
          parentArgv: program.parent ? short(program.parent.argv) : null});
    }
    const nodeCount = run.programs.filter(p => /^node(js)?$/.test(path.basename(p.file))).length;
    if (headers.filter(h => h.threadId === 0).length < nodeCount) add('a Node process did not load the recorder');
  }
  // Child processes the recorder saw start without a recorder header (only
  // when strace is unavailable: otherwise the program list says what they were).
  if (!run.programs) {
    const recorded = new Set(headers.filter(h => h.threadId === 0).map(h => h.pid));
    for (const rows of run.rows) for (const [kind, pid, file] of rows)
      if (kind === 'C' && !recorded.has(pid)) add(`runs ${path.basename(String(file))} (unrecorded)`);
  }
  const binDirs = modulesDirs(root).map(dir => path.join(dir, '.bin'));
  const shellStatic = shellCommands.every(command => staticallyNode(command, root, binDirs));
  // Checkout changes: recorded outputs, caches, or unexplained.
  const inMade = rel => made.some(dir => rel === dir || rel.startsWith(dir + '/'));
  const outputs = new Set(), unexplained = [];
  for (const [rel, how] of changes(before, after)) {
    if (cachePath(rel)) continue;
    if (how !== 'deleted' && (produced.has(rel) || inMade(rel))) {
      outputs.add(rel);
      if (reads.has(rel) && !inMade(rel)) add('rewrites a file it reads');
      continue;
    }
    unexplained.push([rel, how]);
  }
  for (const [, how] of unexplained) add(how === 'deleted' ? 'deletes checkout files' : 'changes checkout files without a recorded write');
  const installed = run.installedChanged.filter(rel => !cachePath(rel));
  if (installed.length) add('changes installed packages');
  return {reasons, reads, outputs, produced, envReads, shellCommands: shellCommands.length, shellStatic,
    examples: {programs: others, unexplained: unexplained.slice(0, 5), installed: installed.slice(0, 5),
      outside: Object.fromEntries(Object.entries(outside).map(([k, v]) => [k, [...v].slice(0, 8).map(item => item.split('\t').join(' '))]))}};
}

// Two runs of one script: each must be clean, and the second must not read
// what the first wrote (outside caches), so both saw the same inputs.
export function compareRuns(first, second) {
  const reasons = [...new Set([...first.reasons, ...second.reasons])];
  const earlier = [...second.reads].filter(rel => first.outputs.has(rel) && !second.produced.has(rel));
  if (earlier.length) reasons.push('reads output of the previous run');
  return {reasons, earlierOutputs: earlier.slice(0, 5)};
}
