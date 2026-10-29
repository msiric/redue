// Research: run a check inside an OS sandbox that allows reads only in the
// checkout, installed packages, the toolchain, a fresh temp directory and
// system directories, and no network beyond loopback. Used by
// `census.mjs --sandbox` and `python-census.mjs --sandbox`.
//
// macOS: Seatbelt (sandbox-exec); denials come from the unified log.
// Linux: Landlock (eval/sandbox/landlock.py; reads and executes, and with
// ABI >= 4 every TCP connect, loopback included), bubblewrap (only the
// allowed places mounted, a network namespace with loopback), and an
// observe mode: strace with seccomp-bpf, unsandboxed, that lists what a
// run read outside the allowed places.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import {spawn} from 'node:child_process';
import {evalDir, sh, tmpRoot} from './lib.mjs';

const home = os.homedir();
const real = p => { try { return fs.realpathSync(p); } catch { return null; } };
const exists = p => { try { fs.lstatSync(p); return true; } catch { return false; } };
const which = (name, env) => sh('sh', ['-c', `command -v ${name}`], {env, timeout: 10_000}).stdout.trim() || null;
const landlockPy = path.join(evalDir, 'sandbox', 'landlock.py');

export const system = process.platform === 'darwin' ?
  ['/usr', '/bin', '/sbin', '/System', '/Library', '/Applications', '/opt/homebrew', '/private/etc', '/private/var/db', '/private/var/select', '/dev'] :
  ['/usr', '/bin', '/sbin', '/lib', '/lib32', '/lib64', '/libx32', '/etc', '/proc', '/sys', '/dev', '/run'];

// What this machine can run.
export function sandboxModes() {
  const modes = {};
  if (process.platform === 'darwin') {
    modes.seatbelt = sh('sandbox-exec', ['-p', '(version 1)(allow default)', '/usr/bin/true'], {timeout: 20_000}).status === 0;
  } else if (process.platform === 'linux') {
    try { modes.landlock = JSON.parse(sh('python3', [landlockPy, '--probe'], {timeout: 20_000}).stdout); } catch { modes.landlock = null; }
    const b = sh('bwrap', ['--ro-bind', '/', '/', '--unshare-net', '--dev', '/dev', '/bin/true'], {timeout: 20_000});
    modes.bwrap = b.status === 0 ? true : (b.stderr || b.error || '').trim().slice(0, 200) || false;
    modes.observe = sh('strace', ['--seccomp-bpf', '-f', '-qq', '-o', '/dev/null', '-e', 'trace=openat', '/bin/true'], {timeout: 20_000}).status === 0;
  }
  return modes;
}

// The toolchain: the runtime, package managers and the stores they install
// from, wherever they live, found from PATH and their default locations.
export function toolchain(env, argv0) {
  const places = new Set([path.dirname(path.dirname(fs.realpathSync(process.execPath)))]);
  const add = p => { const r = p && real(p); if (r) places.add(r); };
  // An install root (bin/..), or the program alone when bin/.. is a shared
  // prefix such as ~/.local or /usr/local.
  const addRoot = file => { const root = path.dirname(path.dirname(file)); add([home, path.join(home, '.local'), '/usr/local', '/usr', '/opt/homebrew', '/'].includes(root) ? file : root); };
  for (const name of ['node', 'npm', 'npx', 'corepack', 'pnpm', 'yarn', 'bun', 'uv', 'uvx', 'poetry', 'pdm', 'pipenv', 'python3']) {
    const found = which(name, env);
    if (found && real(found)) addRoot(real(found));
  }
  if (argv0 && path.isAbsolute(argv0) && real(argv0)) addRoot(real(argv0));
  const cache = process.platform === 'darwin' ? path.join(home, 'Library', 'Caches') : env.XDG_CACHE_HOME || path.join(home, '.cache');
  for (const p of [env.COREPACK_HOME, path.join(home, '.cache', 'node', 'corepack'), path.join(cache, 'node', 'corepack'),
    path.join(home, '.yarn', 'berry'), path.join(home, '.local', 'share', 'pnpm'), path.join(home, 'Library', 'pnpm'),
    env.UV_CACHE_DIR, path.join(home, '.cache', 'uv'), path.join(cache, 'uv'), path.join(home, '.local', 'share', 'uv'),
    path.join(home, '.local', 'pipx'), path.join(home, '.local', 'share', 'pipx')]) if (p) add(p);
  return [...places].filter(p => p !== '/' && p !== home && !home.startsWith(p + '/'));
}

// A run's places: what it may read, the fresh temp directory it writes to,
// and for a Python venv, the interpreter it was made from.
export function places({dir, env, argv0, python}) {
  const temp = fs.mkdtempSync(path.join(tmpRoot, 'sbx-tmp-'));
  const tools = toolchain(env, argv0);
  if (python) {
    const base = sh(python, ['-c', 'import sys;print(sys.base_prefix)'], {env, timeout: 30_000}).stdout.trim();
    if (base && real(base)) tools.push(real(base));
  }
  const sys = system.filter(exists);
  return {checkout: real(dir), temp, toolchain: [...new Set(tools)], system: sys, systemReal: [...new Set([...sys, ...sys.map(real).filter(Boolean)])]};
}

export function placeOf(file, p) {
  const under = (f, d) => f === d || f.startsWith(d + '/');
  if (under(file, p.checkout)) return 'checkout';
  if (under(file, p.temp)) return 'temp';
  if (p.toolchain.some(d => under(file, d))) return 'toolchain';
  if ((p.systemReal ?? p.system).some(d => under(file, d))) return 'system';
  if (/^\/(private\/)?tmp(\/|$)|^\/(private\/)?var\/folders\//.test(file)) return 'other temp';
  if (under(file, home)) {
    const rel = path.relative(home, file);
    return /^(\.cache|Library\/Caches|\.npm|\.local\/share|\.yarn|\.pnpm-store|\.cargo|\.rustup)(\/|$)/.test(rel) ? 'home cache' :
      /^(\.config|\.[\w.-]+rc|\.gitconfig|\.ssh|\.netrc|\.pypirc|Library\/(Preferences|Application Support))(\/|$)/.test(rel) ? 'home config' : 'home other';
  }
  return 'other';
}

const sandboxEnv = (env, p) => ({...env, TMPDIR: p.temp, TMP: p.temp, TEMP: p.temp});
// HOME in an empty folder, so user configuration reads as absent instead of
// denied; the stores the toolchain keeps under the real HOME stay where they are.
function homeEnv(env, p) {
  const fresh = path.join(p.temp, 'home'), cache = process.platform === 'darwin' ? path.join(home, 'Library', 'Caches') : path.join(home, '.cache');
  fs.mkdirSync(fresh, {recursive: true});
  const keep = {COREPACK_HOME: [path.join(home, '.cache', 'node', 'corepack'), path.join(cache, 'node', 'corepack')], UV_CACHE_DIR: [path.join(home, '.cache', 'uv'), path.join(cache, 'uv')],
    UV_PYTHON_INSTALL_DIR: [path.join(home, '.local', 'share', 'uv', 'python')], YARN_GLOBAL_FOLDER: [path.join(home, '.yarn', 'berry')],
    npm_config_store_dir: [path.join(home, '.local', 'share', 'pnpm', 'store'), path.join(home, 'Library', 'pnpm', 'store')],
    CARGO_HOME: [path.join(home, '.cargo')], RUSTUP_HOME: [path.join(home, '.rustup')]};
  const pinned = Object.fromEntries(Object.entries(keep).map(([k, list]) => [k, env[k] ?? list.find(exists)]).filter(([, v]) => v));
  return {...sandboxEnv(env, p), ...pinned, HOME: fresh, XDG_CONFIG_HOME: path.join(fresh, '.config'), XDG_CACHE_HOME: path.join(fresh, '.cache'), XDG_DATA_HOME: path.join(fresh, '.local', 'share')};
}
const readPlaces = p => [p.checkout, p.temp, ...p.toolchain, ...p.system];
const ancestors = list => [...new Set(list.flatMap(d => { const out = []; for (let x = path.dirname(d); x !== '/' && x !== '.'; x = path.dirname(x)) out.push(x); return out; }))];

export function seatbeltProfile(p) {
  const q = s => JSON.stringify(s);
  const reads = readPlaces(p).flatMap(d => [d, real(d)]).filter(Boolean);
  return ['(version 1)', '(allow default)', '(deny file-read* process-exec*)',
    `(allow file-read* process-exec* ${[...new Set(reads)].map(d => `(subpath ${q(d)})`).join(' ')} (literal "/") (literal "/etc") (literal "/var") (literal "/tmp"))`,
    `(allow file-read-metadata ${ancestors(reads).map(d => `(literal ${q(d)})`).join(' ')})`,
    '(deny network-outbound)', '(allow network-outbound (remote ip "localhost:*") (remote unix-socket))'].join('\n');
}

function bwrapArgs(p, cwd) {
  const args = ['--die-with-parent', '--unshare-net', '--unshare-pid', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp'];
  const ro = [...p.toolchain, ...p.system.filter(d => !['/proc', '/dev'].includes(d))], rw = [p.checkout, p.temp];
  const all = [...ro.map(d => [d, '--ro-bind']), ...rw.map(d => [d, '--bind'])].sort((a, b) => a[0].length - b[0].length);
  for (const [d, how] of all) {
    const st = fs.lstatSync(d, {throwIfNoEntry: false});
    if (!st) continue;
    if (st.isSymbolicLink()) args.push('--symlink', fs.readlinkSync(d), d);
    else args.push(how, d, d);
  }
  return [...args, '--chdir', cwd, '--'];
}

// Unified-log lines for Seatbelt denials while a run is going on.
function denialWatcher() {
  const child = spawn('/usr/bin/log', ['stream', '--style', 'ndjson', '--predicate', 'sender == "Sandbox"'], {stdio: ['ignore', 'pipe', 'ignore']});
  const lines = [];
  let pending = '';
  child.stdout.on('data', d => { pending += d; const parts = pending.split('\n'); pending = parts.pop(); lines.push(...parts); });
  return async () => {
    await new Promise(r => setTimeout(r, 2500));
    child.kill();
    const denials = [];
    for (const line of lines) {
      let m; try { m = JSON.parse(line).eventMessage; } catch { continue; }
      const d = /Sandbox: (.+?)\((\d+)\) deny\(\d+\) (\S+) (.*)$/.exec(m ?? '');
      if (d && /^(file-read|process-exec|network-outbound)/.test(d[3])) denials.push({process: d[1], op: d[3], target: d[4]});
    }
    return denials;
  };
}

// One run in a mode: 'plain', 'seatbelt', 'seatbelt-home', 'landlock', 'bwrap' or 'observe'.
export async function sandboxRun(mode, {argv, cwd, env, timeout, p, trace, watch}) {
  let cmd = argv, runEnv = env, stop;
  if (mode === 'seatbelt' || mode === 'seatbelt-home') { cmd = ['sandbox-exec', '-p', seatbeltProfile(p), ...argv]; runEnv = mode === 'seatbelt' ? sandboxEnv(env, p) : homeEnv(env, p); if (watch) { stop = denialWatcher(); await new Promise(r => setTimeout(r, 2000)); } }
  else if (mode === 'landlock') { cmd = ['python3', landlockPy, ...readPlaces(p).flatMap(d => ['--read', d]), '--no-tcp', '--', ...argv]; runEnv = sandboxEnv(env, p); }
  else if (mode === 'bwrap') { cmd = ['bwrap', ...bwrapArgs(p, cwd), ...argv]; runEnv = sandboxEnv(env, p); }
  else if (mode === 'observe') cmd = ['strace', '--seccomp-bpf', '-f', '-qq', '-y', '-s', '4096', '-o', trace, '-e',
    'trace=execve,open,openat,openat2,stat,lstat,newfstatat,statx,access,faccessat,faccessat2,readlink,readlinkat,chdir,getdents64,connect,clone,clone3,fork,vfork', ...argv];
  const r = sh(cmd[0], cmd.slice(1), {cwd, env: runEnv, timeout});
  const out = {status: r.status, timedOut: r.timedOut, ms: r.ms, out: (r.stderr + '\n' + r.stdout).trim().slice(-500)};
  if (stop) out.denials = await stop();
  return out;
}

// From an observe trace: what the run read, listed or executed outside the
// allowed places, whether it existed, and the remote addresses it connected to.
export async function readObserved(file, p, cwd) {
  const procs = new Map(), proc = pid => procs.get(pid) ?? procs.set(pid, {cwd, exec: null}).get(pid), pending = new Map();
  const outside = new Map(), programs = new Map(), net = new Set();
  const note = (file, op, ok) => {
    const where = placeOf(file, p);
    if (['checkout', 'temp', 'toolchain', 'system'].includes(where)) return;
    const key = `${where}\t${file}`, e = outside.get(key) ?? {ops: new Set(), exists: false};
    e.ops.add(op); if (ok) e.exists = true; outside.set(key, e);
  };
  const rl = readline.createInterface({input: fs.createReadStream(file), crlfDelay: Infinity});
  for await (const line of rl) {
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const pid = Number(m[1]); let body = m[2];
    if (body.endsWith('<unfinished ...>')) { pending.set(pid, body.slice(0, -16)); continue; }
    const resumed = /^<\.\.\. \w+ resumed>(.*)$/.exec(body);
    if (resumed) { body = (pending.get(pid) ?? '') + resumed[1]; pending.delete(pid); }
    const call = /^(\w+)\((.*)\)\s+=\s+(-?\d+|\?)(<[^>]*>)?\s*(\w+)?/.exec(body);
    if (!call) continue;
    const [, name, args, ret, retPath, errno] = call, pr = proc(pid);
    const strs = [...args.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1].replace(/\\(.)/g, '$1'));
    const dirfd = /^(-?\d+|AT_FDCWD)(<([^>]*)>)?/.exec(args);
    const resolve = rel => path.resolve(rel.startsWith('/') ? '/' : dirfd?.[3] ?? pr.cwd ?? '/', rel);
    const ok = ret !== '-1';
    if (name === 'execve') { if (ok) { pr.exec = strs[0]; programs.set(path.basename(strs[0]), resolve(strs[0])); } note(resolve(strs[0]), 'exec', ok); }
    else if (/^(clone3?|fork|vfork)$/.test(name) && Number(ret) > 0) Object.assign(proc(Number(ret)), {cwd: pr.cwd});
    else if (name === 'chdir' && ok) pr.cwd = resolve(strs[0]);
    else if (/^open(at2?)?$/.test(name) && strs.length) {
      if (/O_WRONLY/.test(args) && !/O_RDWR/.test(args)) continue;
      note(ok && retPath ? retPath.slice(1, -1) : resolve(strs[0]), /O_DIRECTORY/.test(args) ? 'list' : 'read', ok && errno !== 'ENOENT');
    } else if (/^(stat|lstat|newfstatat|statx|access|faccessat2?|readlink|readlinkat)$/.test(name) && strs.length && strs[0] !== '') note(resolve(strs[0]), 'stat', ok);
    else if (name === 'getdents64' && dirfd?.[3]) note(dirfd[3], 'list', true);
    else if (name === 'connect') {
      const addr = /inet_addr\("([^"]+)"\)|inet_pton\(AF_INET6, "([^"]+)"/.exec(args), port = /htons\((\d+)\)/.exec(args)?.[1];
      const a = addr?.[1] ?? addr?.[2];
      if (a && !/^(127\.|::1$|::ffff:127\.|0\.0\.0\.0|::$)/.test(a)) net.add(`${a}:${port}`);
    }
  }
  const byPlace = {}, examples = {};
  for (const [key, e] of outside) {
    const [where, f] = key.split('\t'), kind = `${where} ${e.exists ? 'existing' : 'absent'}${e.ops.has('read') || e.ops.has('exec') || e.ops.has('list') ? '' : ' stat-only'}`;
    byPlace[kind] = (byPlace[kind] ?? 0) + 1;
    (examples[kind] ??= []).length < 12 && examples[kind].push(f);
  }
  return {outside: byPlace, examples, net: [...net].slice(0, 20), programs: Object.fromEntries([...programs].slice(0, 60))};
}

// The census measurement for one check: plain and sandboxed runs alternated,
// and on Linux one observed run. `perRun` adds arguments to a run and reads
// per-test results back (pytest's junit XML), when the caller has them.
export async function sandboxSuite({argv, cwd, env, timeout, modes, python, perRun}) {
  const p = places({dir: cwd, env, argv0: argv[0], python});
  const order = process.platform === 'darwin' ? (modes.seatbelt ? ['seatbelt', 'seatbelt-home'] : []) :
    [...(modes.landlock?.abi ? ['landlock'] : []), ...(modes.bwrap === true ? ['bwrap'] : [])];
  const out = {places: {toolchain: p.toolchain}, runs: {plain: []}};
  for (const mode of order) out.runs[mode] = [];
  const one = async (mode, n) => {
    const extra = perRun ? perRun.args(`${mode}-${n}`) : [];
    const r = await sandboxRun(mode, {argv: [...argv, ...extra], cwd, env, timeout, p, watch: n === 1});
    if (perRun) r.tests = perRun.read(`${mode}-${n}`);
    return r;
  };
  for (const n of [1, 2]) {
    out.runs.plain.push(await one('plain', n));
    if (out.runs.plain.at(-1).timedOut) break;
    for (const mode of order) out.runs[mode].push(await one(mode, n));
    if (n === 1 && modes.observe) {
      const trace = path.join(tmpRoot, `${path.basename(p.temp)}.strace`);
      const r = await sandboxRun('observe', {argv, cwd, env, timeout: timeout * 2, p, trace});
      try { Object.assign(r, await readObserved(trace, p, p.checkout)); } catch (error) { r.analysisError = String(error).slice(0, 300); }
      fs.rmSync(trace, {force: true});
      out.observe = r;
    }
  }
  fs.rmSync(p.temp, {recursive: true, force: true});
  // Same result: every sandboxed run exits as the plain runs did, and they agree.
  const plain = out.runs.plain.map(r => r.status);
  out.plainStable = plain.length === 2 && plain[0] === plain[1];
  out.same = Object.fromEntries(order.map(mode => [mode, out.runs[mode].length > 0 && out.runs[mode].every(r => plain.includes(r.status))]));
  if (perRun) {
    const base = out.runs.plain.at(-1)?.tests;
    if (base) out.testsDiffer = Object.fromEntries(order.map(mode => {
      const t = out.runs[mode][0]?.tests;
      return [mode, t ? Object.keys(base).filter(k => base[k] === 'pass' && t[k] && t[k] !== 'pass').slice(0, 15) : null];
    }));
  }
  const best = list => list.length ? Math.min(...list.map(r => r.ms)) : null;
  out.ms = Object.fromEntries(Object.entries(out.runs).map(([k, v]) => [k, best(v)]));
  if (out.observe) out.ms.observe = out.observe.ms;
  for (const v of Object.values(out.runs)) for (const r of v) if (r.status === 0 && plain.every(s => s === 0)) delete r.out;
  return out;
}
