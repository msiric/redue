#!/usr/bin/env node
// Install spike: does a frozen install give the same installed tree on two
// fresh runners? For each repo ci-replay-repos.json marks `spike`, clones the
// default branch as it stood at the list's `before`, installs from its
// lockfile (npm ci, pnpm install --frozen-lockfile or uv sync --frozen) with
// install scripts on, as CI runs them, and writes a manifest of what the
// install left: every file in node_modules and .venv, and every file outside
// them git does not track, with its type, exec bit, size and SHA-256 (a link:
// its target). Each copy (--copy 1, --copy 2) runs on its own runner;
// install-spike-report.mjs compares them. With --keep FILE (repo -> paths,
// from the report), it also saves those files, so the next pair's report
// can show how they differ.
//
//   node eval/install-spike.mjs --copy N [--shard i/n] [--keep FILE] [owner/name ...]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {entryPoint, evalDir, localDir, tmpRoot, readJson, slug, sh, harnessEnv} from './lib.mjs';
entryPoint(import.meta, {ci: true});

const argv = process.argv.slice(2);
const option = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const copy = option('--copy') || '1', shard = option('--shard'), keepFile = option('--keep');
const keep = keepFile ? readJson(keepFile) : {};
const config = readJson(path.join(evalDir, 'ci-replay-repos.json'));
let repos = config.repos.filter(r => r.spike);
// Repo names; eval.yml's default args (--pilot) are not one.
const names = argv.filter(a => a.includes('/'));
if (names.length) repos = config.repos.filter(r => names.includes(r.name));
if (shard) { const [i, n] = shard.split('/').map(Number); repos = repos.filter((_, at) => at % n === i - 1); }
const out = path.join(localDir, 'install-spike');
fs.mkdirSync(out, {recursive: true});
const env = harnessEnv({CI: 'true', COREPACK_ENABLE_DOWNLOAD_PROMPT: '0', COREPACK_ENABLE_STRICT: '0'});
const version = (cmd, args, cwd) => { const r = sh(cmd, args, {cwd, env, timeout: 120_000}); return r.status === 0 ? r.stdout.trim().split('\n').pop() : null; };

function hashFile(file, size) {
  const h = createHash('sha256');
  if (size < 64 * 1024 * 1024) h.update(fs.readFileSync(file));
  else { const fd = fs.openSync(file, 'r'), buf = Buffer.alloc(1 << 20); let n; while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n)); fs.closeSync(fd); }
  return h.digest('hex');
}
// Every entry beneath `dir`, as `rel\ttype\tmode\tsize\thash`.
function walk(root, dir, lines) {
  let names;
  try { names = fs.readdirSync(path.join(root, dir), {withFileTypes: true}); } catch { return; }
  for (const d of names) {
    const rel = dir ? `${dir}/${d.name}` : d.name, abs = path.join(root, rel);
    if (d.isSymbolicLink()) { lines.push(`${rel}\tl\t\t\t${fs.readlinkSync(abs)}`); continue; }
    if (d.isDirectory()) { lines.push(`${rel}\td\t\t\t`); walk(root, rel, lines); continue; }
    if (!d.isFile()) { lines.push(`${rel}\to\t\t\t`); continue; }
    const st = fs.statSync(abs);
    lines.push(`${rel}\tf\t${st.mode & 0o111 ? 'x' : ''}\t${st.size}\t${hashFile(abs, st.size)}`);
  }
}
// Packages under node_modules with an install script or a native build.
function installScripts(root) {
  const found = [];
  const look = dir => {
    let names; try { names = fs.readdirSync(path.join(root, dir), {withFileTypes: true}); } catch { return; }
    for (const d of names) {
      if (!d.isDirectory() || d.name === '.bin') continue;
      const rel = `${dir}/${d.name}`;
      if (d.name.startsWith('@')) { look(rel); continue; }
      if (d.name === '.pnpm') { for (const v of fs.readdirSync(path.join(root, rel), {withFileTypes: true})) if (v.isDirectory()) look(`${rel}/${v.name}/node_modules`); continue; }
      try {
        const json = JSON.parse(fs.readFileSync(path.join(root, rel, 'package.json'), 'utf8'));
        const scripts = ['preinstall', 'install', 'postinstall'].filter(s => json.scripts?.[s]);
        const gyp = fs.existsSync(path.join(root, rel, 'binding.gyp'));
        if (scripts.length || gyp) found.push({dir: rel, name: json.name, version: json.version, scripts: Object.fromEntries(scripts.map(s => [s, json.scripts[s]])), gyp});
      } catch {}
      if (fs.existsSync(path.join(root, rel, 'node_modules'))) look(`${rel}/node_modules`);
    }
  };
  const all = [];
  for (const nm of nodeModulesDirs(root)) look(nm);
  for (const f of found) if (!all.some(x => x.dir === f.dir)) all.push(f);
  return all;
}
function nodeModulesDirs(root, dir = '', depth = 0, out = []) {
  let names; try { names = fs.readdirSync(path.join(root, dir), {withFileTypes: true}); } catch { return out; }
  for (const d of names) {
    if (!d.isDirectory() || d.name === '.git') continue;
    const rel = dir ? `${dir}/${d.name}` : d.name;
    if (d.name === 'node_modules') out.push(rel);
    else if (depth < 4) nodeModulesDirs(root, rel, depth + 1, out);
  }
  return out;
}

for (const repo of repos) {
  const result = {repo: repo.name, copy, runner: {imageOS: process.env.ImageOS, imageVersion: process.env.ImageVersion, runnerName: process.env.RUNNER_NAME, arch: process.env.RUNNER_ARCH}};
  const dir = path.join(tmpRoot, 'spike', slug(repo.name));
  try {
    fs.rmSync(dir, {recursive: true, force: true});
    fs.mkdirSync(path.dirname(dir), {recursive: true});
    const clone = sh('git', ['clone', '-q', '--filter=blob:none', '--no-checkout', `https://github.com/${repo.name}.git`, dir], {env, timeout: 30 * 60_000});
    if (clone.status !== 0) throw Error(`clone: ${clone.stderr}`);
    const commit = sh('git', ['rev-list', '-1', `--before=${config.before}`, 'HEAD'], {cwd: dir, env}).stdout.trim();
    const co = sh('git', ['checkout', '-q', commit], {cwd: dir, env, timeout: 30 * 60_000});
    if (co.status !== 0) throw Error(`checkout: ${co.stderr}`);
    result.commit = commit;
    const has = f => fs.existsSync(path.join(dir, f));
    const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('package-lock.json') ? 'npm' : has('uv.lock') ? 'uv' : null;
    result.pm = pm;
    if (!pm) throw Error('no package-lock.json, pnpm-lock.yaml or uv.lock at the root');
    const cmd = pm === 'npm' ? ['npm', ['ci', '--no-audit', '--no-fund']] : pm === 'pnpm' ? ['corepack', ['pnpm', 'install', '--frozen-lockfile']] : ['uv', ['sync', '--frozen']];
    result.command = [cmd[0], ...cmd[1]].join(' ');
    result.versions = {node: version('node', ['--version'], dir), npm: version('npm', ['--version'], dir), pnpm: pm === 'pnpm' ? version('corepack', ['pnpm', '--version'], dir) : null,
      uv: version('uv', ['--version'], dir)};
    const install = sh(cmd[0], cmd[1], {cwd: dir, env, timeout: 45 * 60_000});
    result.install = {status: install.status, ms: Math.round(install.ms ?? 0), timedOut: install.timedOut, tail: (install.stderr || '').slice(-1500) + (install.stdout || '').slice(-1500)};
    if (pm === 'uv') result.versions.python = version(path.join(dir, '.venv', 'bin', 'python'), ['--version'], dir);
    const lines = [];
    const roots = pm === 'uv' ? ['.venv'] : nodeModulesDirs(dir);
    for (const r of roots) { lines.push(`${r}\td\t\t\t`); walk(dir, r, lines); }
    // What else the install left in the checkout: files git does not track.
    const status = sh('git', ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory', '--no-empty-directory'], {cwd: dir, env}).stdout.split('\0').filter(Boolean)
      .filter(rel => !roots.some(r => rel === r + '/' || rel.startsWith(r + '/')) && !/(^|\/)node_modules\/$/.test(rel));
    const untracked = sh('git', ['ls-files', '-z', '--others', '--exclude-standard', '--directory'], {cwd: dir, env}).stdout.split('\0').filter(Boolean);
    for (const rel of [...new Set([...status, ...untracked])]) {
      const clean = rel.replace(/\/$/, '');
      if (roots.includes(clean)) continue;
      const st = fs.lstatSync(path.join(dir, clean));
      if (st.isDirectory()) { lines.push(`${clean}\td\t\t\t`); walk(dir, clean, lines); }
      else if (st.isSymbolicLink()) lines.push(`${clean}\tl\t\t\t${fs.readlinkSync(path.join(dir, clean))}`);
      else lines.push(`${clean}\tf\t${st.mode & 0o111 ? 'x' : ''}\t${st.size}\t${hashFile(path.join(dir, clean), st.size)}`);
    }
    result.entries = lines.length;
    result.installScripts = pm === 'uv' ? [] : installScripts(dir);
    fs.writeFileSync(path.join(out, `manifest-${slug(repo.name)}-${copy}.tsv.gz`), zlib.gzipSync(lines.sort().join('\n')));
    const kept = (keep[repo.name] || []).filter(rel => !rel.includes('..'));
    if (kept.length) {
      const keepDir = path.join(out, `kept-${slug(repo.name)}-${copy}`);
      for (const rel of kept.slice(0, 400)) {
        try {
          const st = fs.lstatSync(path.join(dir, rel));
          if (!st.isFile() || st.size > 2 * 1024 * 1024) continue;
          fs.mkdirSync(path.dirname(path.join(keepDir, rel)), {recursive: true});
          fs.copyFileSync(path.join(dir, rel), path.join(keepDir, rel));
        } catch {}
      }
    }
    console.log(`${repo.name}: ${pm} exit ${install.status} in ${Math.round(result.install.ms / 1000)} s, ${lines.length} entries`);
  } catch (error) {
    result.error = String(error.message).slice(0, 2000);
    console.log(`${repo.name}: ${result.error}`);
  }
  fs.writeFileSync(path.join(out, `spike-${slug(repo.name)}-${copy}.json`), JSON.stringify(result, null, 1));
  fs.rmSync(dir, {recursive: true, force: true});
}
