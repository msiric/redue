// The census's cross-check of a sandboxed run (Linux): what the run read,
// from strace, against what REDUE observed. Every file a sandboxed process
// read, listed or executed in the checkout must be an input the receipt
// holds, a runner cache the recipe trusts, or a file the run wrote first.
// Outside the checkout, it must be beneath a place the sandbox allows. A
// trusted run (stable, CURRENT afterwards) that read anything else is
// critical. Reads in .git, which tools see but REDUE does not observe, are
// listed apart (`git`), to measure how often a check depends on them.
// Research only; the product does not use this file.
//
//   trace: strace -f -qq -y -s 4096 -e trace=<sandboxTraceCalls> -o FILE redue run CHECK
import fs from 'node:fs';
import path from 'node:path';
import picomatch from 'picomatch';
import {sandboxCaches} from '../src/sandbox.mjs';

export const sandboxTraceCalls = 'execve,open,openat,openat2,stat,lstat,newfstatat,statx,access,faccessat,faccessat2,chdir,getdents64,connect,clone,clone3,fork,vfork';
const cache = picomatch(sandboxCaches, {dot: true});
// Installed runner caches and build info the recipe leaves out of node_modules.
const installedCache = picomatch(['**/node_modules/{.cache,.vite,.vite-temp,.vitest,.vitest-cache}/**', '**/node_modules/**/*.tsbuildinfo',
  '.venv/**/__pycache__/**', '.venv/bin/python*', '.venv/bin/pypy*', '.venv/bin/𝜋thon*'], {dot: true});

// The sandboxed processes' calls in a trace: what the Landlock launcher
// starts, once it has restricted itself, and their descendants (the
// launcher's own reads come before that). Each: {name, ok, error, file,
// kind, args, address}, `kind` one of exec, read, write, list, probe, connect;
// `file` absolute. A probe is a stat or access call, or a failed open.
export function* sandboxedCalls(trace, root) {
  const lines = fs.readFileSync(trace, 'utf8').split('\n');
  const procs = new Map(), pending = new Map(), inside = new Set(), launchers = new Set();
  const cwdOf = pid => procs.get(pid) ?? root;
  for (const line of lines) {
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const pid = Number(m[1]); let body = m[2];
    if (body.endsWith('<unfinished ...>')) { pending.set(pid, body.slice(0, -16)); continue; }
    const resumed = /^<\.\.\. \w+ resumed>(.*)$/.exec(body);
    if (resumed) { body = (pending.get(pid) ?? '') + resumed[1]; pending.delete(pid); }
    const call = /^(\w+)\((.*)\)\s+=\s+(-?\d+|\?)(<[^>]*>)?\s*(\w+)?/.exec(body);
    if (!call) continue;
    const [, name, args, ret, retPath, error] = call, ok = ret !== '-1' && ret !== '?';
    const strs = [...args.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1].replace(/\\(.)/g, '$1'));
    if (name === 'execve' && ok && strs.some(s => s.endsWith('/landlock.py'))) launchers.add(pid);
    if (/^(clone3?|fork|vfork)$/.test(name) && Number(ret) > 0) {
      procs.set(Number(ret), cwdOf(pid));
      if (inside.has(pid) || launchers.has(pid)) inside.add(Number(ret));
      continue;
    }
    if (!inside.has(pid)) continue;
    const dirfd = /^(-?\d+|AT_FDCWD)(<([^>]*)>)?/.exec(args);
    const resolve = rel => path.resolve(rel.startsWith('/') ? '/' : dirfd?.[3] ?? cwdOf(pid), rel);
    if (name === 'chdir' && ok) procs.set(pid, resolve(strs[0]));
    else if (name === 'execve' && ok) yield {name, ok, error, file: resolve(strs[0]), kind: 'exec', args};
    else if (/^open(at2?)?$/.test(name) && strs.length) {
      const file = retPath ? retPath.slice(1, -1) : resolve(strs[0]);
      if (!ok) yield {name, ok, error, file, kind: 'probe', args};
      else if (/O_WRONLY|O_RDWR|O_CREAT/.test(args) && !/O_RDONLY/.test(args)) {
        yield {name, ok, error, file, kind: 'write', args};
        if (/O_RDWR/.test(args)) yield {name, ok, error, file, kind: 'read', args};
      } else yield {name, ok, error, file, kind: /O_DIRECTORY/.test(args) ? 'list' : 'read', args};
    } else if (/^(stat|lstat|newfstatat|statx|access|faccessat2?)$/.test(name) && strs.length)
      yield {name, ok, error, file: resolve(strs[0]), kind: 'probe', args};
    else if (name === 'getdents64' && dirfd?.[3]) yield {name, ok, error, file: dirfd[3], kind: 'list', args};
    else if (name === 'connect' && ok) {
      const addr = /inet_addr\("([^"]+)"\)|inet_pton\(AF_INET6, "([^"]+)"/.exec(args);
      yield {name, ok, error, kind: 'connect', address: addr?.[1] ?? addr?.[2], args};
    }
  }
}

// {checkout: {observed, cache, output, unobserved: [...], git: [...]}, outside: {allowed, other: [...]}, remote: [...]}
// `allowedPrefixes`: path prefixes allowed beside the places (the run's own
// temporary directory, /tmp/redue-run-*). With `collect`, also `paths`: the
// checkout paths (relative) the run read, probed and listed, as Sets, and
// `addon`: whether it loaded a native Node addon (a .node file).
export function crossCheck(trace, {root, files, allowed, allowedPrefixes = [], collect = false}) {
  const out = {checkout: {observed: 0, cache: 0, output: 0, directories: 0, unobserved: new Set(), git: new Set()},
    outside: {allowed: 0, other: new Set()}, remote: new Set(), processes: 0};
  const paths = {read: new Set(), probed: new Set(), listed: new Set()};
  let addon = false;
  const written = new Set();
  const under = (file, dir) => file === dir || file.startsWith(dir + '/');
  const note = (file, kind) => {
    if (under(file, root)) {
      const rel = path.relative(root, file);
      // The checkout's root, opened or listed: a listing.
      if (!rel) { if (collect) paths.listed.add(''); return; }
      if (rel === '.git' || rel.startsWith('.git/')) { out.checkout.git.add(rel); return; }
      // A directory opened without O_DIRECTORY (Node's module lookup) is a listing.
      if (kind === 'list' || (() => { try { return fs.statSync(file).isDirectory(); } catch { return false; } })()) {
        out.checkout.directories++; if (collect) paths.listed.add(rel); return; }
      if (collect) paths.read.add(rel);
      if (Object.hasOwn(files, rel)) out.checkout.observed++;
      else if (cache(rel) || installedCache(rel)) out.checkout.cache++;
      else if (written.has(rel)) out.checkout.output++;
      else out.checkout.unobserved.add(rel);
    } else if (allowed.some(dir => under(file, dir)) || allowedPrefixes.some(prefix => file.startsWith(prefix))) out.outside.allowed++;
    else out.outside.other.add(file);
  };
  for (const call of sandboxedCalls(trace, root)) {
    if (call.kind === 'exec') { out.processes++; note(call.file, 'exec'); }
    // A file the run opens for writing first is its own output.
    else if (call.kind === 'write') { if (under(call.file, root)) written.add(path.relative(root, call.file)); }
    else if (call.kind === 'read' || call.kind === 'list') {
      if (call.kind === 'read' && call.file.endsWith('.node')) addon = true;
      note(call.file, call.kind);
    } else if (call.kind === 'probe') { if (collect && under(call.file, root) && call.file !== root) paths.probed.add(path.relative(root, call.file)); }
    else if (call.kind === 'connect' && call.address && !/^(127\.|::1$|::ffff:127\.)/.test(call.address)) out.remote.add(call.address);
  }
  const list = set => [...set].slice(0, 30);
  return {processes: out.processes, checkout: {...out.checkout, unobserved: list(out.checkout.unobserved), git: list(out.checkout.git)},
    outside: {allowed: out.outside.allowed, other: list(out.outside.other)}, remote: list(out.remote),
    ...collect ? {paths, addon} : {},
    findings: [...[...out.checkout.unobserved].map(rel => `read ${rel}, which the receipt does not hold`),
      ...[...out.outside.other].map(file => `read ${file} outside the allowed places`),
      ...[...out.remote].map(a => `connected to ${a}`)].slice(0, 40)};
}

// What a run with hidden entries (sandboxTrial's `hide`) still saw of them,
// on Linux, where Landlock restricts neither listing nor stat beneath a
// listable parent: successful stats and listings beneath a hidden entry, and
// successful reads, which would mean the sandbox let one through.
export function hiddenExposure(trace, {root, hidden}) {
  const beneath = hidden.map(rel => path.join(root, rel.replace(/\/$/, '')));
  const hit = file => beneath.some(dir => file === dir || file.startsWith(dir + '/'));
  const out = {stat: new Set(), listed: new Set(), read: new Set(), refused: 0};
  for (const call of sandboxedCalls(trace, root)) {
    if (!call.file || !hit(call.file)) continue;
    const rel = path.relative(root, call.file);
    if (call.kind === 'probe' && call.ok) out.stat.add(rel);
    else if (call.kind === 'probe' && call.error === 'EACCES') out.refused++;
    else if (call.kind === 'list') out.listed.add(rel);
    else if (call.kind === 'read' || call.kind === 'exec') out.read.add(rel);
  }
  const list = set => ({count: set.size, examples: [...set].slice(0, 8)});
  return {stat: list(out.stat), listed: list(out.listed), read: list(out.read), refused: out.refused};
}
