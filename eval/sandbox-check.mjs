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

// {checkout: {observed, cache, output, unobserved: [...], git: [...]}, outside: {allowed, other: [...]}, remote: [...]}
export function crossCheck(trace, {root, files, allowed}) {
  const lines = fs.readFileSync(trace, 'utf8').split('\n');
  const procs = new Map(), pending = new Map(), inside = new Set();
  const cwdOf = pid => procs.get(pid) ?? root;
  const out = {checkout: {observed: 0, cache: 0, output: 0, directories: 0, unobserved: new Set(), git: new Set()},
    outside: {allowed: 0, other: new Set()}, remote: new Set(), processes: 0};
  const written = new Set();
  const under = (file, dir) => file === dir || file.startsWith(dir + '/');
  const note = (file, kind) => {
    if (under(file, root)) {
      const rel = path.relative(root, file);
      if (!rel) return;
      if (rel === '.git' || rel.startsWith('.git/')) { out.checkout.git.add(rel); return; }
      if (kind === 'list') { out.checkout.directories++; return; }
      if (Object.hasOwn(files, rel)) out.checkout.observed++;
      else if (cache(rel) || installedCache(rel)) out.checkout.cache++;
      else if (written.has(rel)) out.checkout.output++;
      else out.checkout.unobserved.add(rel);
    } else if (allowed.some(dir => under(file, dir))) out.outside.allowed++;
    else out.outside.other.add(file);
  };
  for (const line of lines) {
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const pid = Number(m[1]); let body = m[2];
    if (body.endsWith('<unfinished ...>')) { pending.set(pid, body.slice(0, -16)); continue; }
    const resumed = /^<\.\.\. \w+ resumed>(.*)$/.exec(body);
    if (resumed) { body = (pending.get(pid) ?? '') + resumed[1]; pending.delete(pid); }
    const call = /^(\w+)\((.*)\)\s+=\s+(-?\d+|\?)(<[^>]*>)?\s*(\w+)?/.exec(body);
    if (!call) continue;
    const [, name, args, ret, retPath] = call, ok = ret !== '-1' && ret !== '?';
    const strs = [...args.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1].replace(/\\(.)/g, '$1'));
    // The sandboxed processes: the Landlock launcher and everything it starts.
    if (name === 'execve' && ok && strs.some(s => s.endsWith('/landlock.py'))) inside.add(pid);
    if (/^(clone3?|fork|vfork)$/.test(name) && Number(ret) > 0) {
      procs.set(Number(ret), cwdOf(pid));
      if (inside.has(pid)) inside.add(Number(ret));
      continue;
    }
    if (!inside.has(pid)) continue;
    const dirfd = /^(-?\d+|AT_FDCWD)(<([^>]*)>)?/.exec(args);
    const resolve = rel => path.resolve(rel.startsWith('/') ? '/' : dirfd?.[3] ?? cwdOf(pid), rel);
    if (name === 'chdir' && ok) procs.set(pid, resolve(strs[0]));
    else if (name === 'execve' && ok) { out.processes++; note(resolve(strs[0]), 'exec'); }
    else if (/^open(at2?)?$/.test(name) && strs.length && ok) {
      const file = retPath ? retPath.slice(1, -1) : resolve(strs[0]);
      // A file the run opens for writing first is its own output.
      if (/O_WRONLY|O_RDWR|O_CREAT/.test(args) && !/O_RDONLY/.test(args)) {
        if (under(file, root)) written.add(path.relative(root, file));
        if (!/O_RDWR/.test(args)) continue;
      }
      note(file, /O_DIRECTORY/.test(args) ? 'list' : 'read');
    } else if (name === 'getdents64' && dirfd?.[3]) note(dirfd[3], 'list');
    else if (name === 'connect' && ok) {
      const addr = /inet_addr\("([^"]+)"\)|inet_pton\(AF_INET6, "([^"]+)"/.exec(args), a = addr?.[1] ?? addr?.[2];
      if (a && !/^(127\.|::1$|::ffff:127\.)/.test(a)) out.remote.add(a);
    }
  }
  const list = set => [...set].slice(0, 30);
  return {processes: out.processes, checkout: {...out.checkout, unobserved: list(out.checkout.unobserved), git: list(out.checkout.git)},
    outside: {allowed: out.outside.allowed, other: list(out.outside.other)}, remote: list(out.remote),
    findings: [...[...out.checkout.unobserved].map(rel => `read ${rel}, which the receipt does not hold`),
      ...[...out.outside.other].map(file => `read ${file} outside the allowed places`),
      ...[...out.remote].map(a => `connected to ${a}`)].slice(0, 40)};
}
