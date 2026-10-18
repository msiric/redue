// Shared helpers for the agent A/B harness (eval/). Nothing here is part of
// the published package.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cleanEnv} from '../bench/env.mjs';
import {reviewedTypeScriptVersions} from '../src/direct-typescript.mjs';

export const evalDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(evalDir, '..');
export const localDir = path.join(repoRoot, '.local', 'eval');
export const tmpRoot = path.join(fs.realpathSync(os.tmpdir()), 'redue-eval');
export const reviewedTypeScript = reviewedTypeScriptVersions;
export const checkoutRedue = path.join(repoRoot, 'bin', 'redue.mjs');

// The bench's NODE_* cleanup, minus the variables that tie a child process to
// the Claude Code session that started this script and the owner's telemetry
// and credentials. ZDOTDIR points zsh (the agent's Bash tool) at an empty
// directory, so the owner's zsh startup files don't run.
const personal = /^(CLAUDECODE|CLAUDE_CODE_.*|CLAUDE_PID|CLAUDE_EFFORT|OTEL_.*|COPILOT_OTEL_.*|DOMOREEXP_.*|NPM_TOKEN|GH_TOKEN|GITHUB_TOKEN)$/;
export function harnessEnv(extra = {}) {
  const env = cleanEnv();
  for (const key of Object.keys(env)) if (personal.test(key)) delete env[key];
  const zdotdir = path.join(tmpRoot, 'zdotdir');
  fs.mkdirSync(zdotdir, {recursive: true});
  return {...env, ZDOTDIR: zdotdir, CI: '1', ...extra};
}

export function sh(cmd, args, {cwd, env = harnessEnv(), timeout = 600_000, input} = {}) {
  const started = performance.now();
  const out = spawnSync(cmd, args, {cwd, env, timeout, input, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});
  return {status: out.status, signal: out.signal, stdout: out.stdout || '', stderr: out.stderr || '',
    ms: Math.round(performance.now() - started), error: out.error?.message};
}

export function must(result, label) {
  if (result.status !== 0) throw new Error(`${label}: exit ${result.status ?? result.signal}${result.error ? ` (${result.error})` : ''}\n${(result.stderr || result.stdout).slice(-1500)}`);
  return result;
}

export const slug = name => name.replace(/[^A-Za-z0-9._-]+/g, '_');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// A blobless mirror per repo, so each run's fresh clone is local and fast.
export function mirror(repo) {
  const dir = path.join(tmpRoot, 'mirrors', slug(repo.name));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(path.dirname(dir), {recursive: true});
    must(sh('git', ['clone', '-q', '--filter=blob:none', '--no-checkout', repo.url, dir]), `clone ${repo.url}`);
  }
  return dir;
}

// Fresh clone at the pinned commit with dependencies installed. Install
// scripts are skipped in both arms: these are third-party repos.
export function freshClone(repo, commit, dir) {
  fs.rmSync(dir, {recursive: true, force: true});
  // A local clone cannot fetch blobs the blobless mirror lacks, so the mirror
  // checks the commit out first, which fetches them.
  const source = mirror(repo);
  must(sh('git', ['-c', 'advice.detachedHead=false', 'checkout', '-q', '--force', '--detach', commit], {cwd: source}), `mirror checkout ${commit}`);
  must(sh('git', ['clone', '-q', '--no-checkout', source, dir]), 'local clone');
  must(sh('git', ['-c', 'advice.detachedHead=false', 'checkout', '-q', commit], {cwd: dir}), `checkout ${commit}`);
  const dirty = sh('git', ['status', '--porcelain'], {cwd: dir}).stdout.trim();
  if (dirty) throw new Error(`checkout ${commit} incomplete: ${dirty.split('\n')[0]}`);
  must(sh('npm', ['ci', '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund'], {cwd: dir, timeout: 900_000}), 'npm ci');
  return dir;
}

export function installedTypeScript(dir) {
  try { return readJson(path.join(dir, 'node_modules/typescript/package.json')).version; } catch { return null; }
}

export function plainTsc(dir) {
  const r = sh(process.execPath, [path.join(dir, 'node_modules/typescript/bin/tsc'), '--noEmit'], {cwd: dir, timeout: 600_000});
  return {pass: r.status === 0, ms: r.ms, output: (r.stdout + r.stderr).slice(-3000)};
}

export function redue(entry, dir, ...argv) {
  return sh(process.execPath, [entry, ...argv], {cwd: dir});
}

export function checkStatus(entry, dir) {
  const r = redue(entry, dir, 'status', '--sync', '--json');
  try {
    const status = JSON.parse(r.stdout), row = status.checks?.find(c => c.name === 'typecheck');
    return {freshness: row?.freshness, result: row?.result, reuse_eligible: row?.reuse_eligible,
      reason: row?.reason, healthy: status.observation?.healthy};
  } catch { return {error: `exit ${r.status}: ${(r.stderr || r.stdout).slice(-400)}`}; }
}

// `redue run` refuses to record until the observer's first index is done.
export function waitReady(entry, dir, {timeout = 15 * 60_000, env} = {}) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const r = sh(process.execPath, [entry, 'status', '--json'], {cwd: dir, env});
    let observation = null;
    try { observation = JSON.parse(r.stdout).observation; } catch {}
    if (observation?.healthy === true) return Math.round(performance.now() - started);
    if (observation?.phase === 'unavailable') throw new Error(`observation unavailable after ${Math.round((performance.now() - started) / 1000)} s: ${observation.reason}`);
    sh('sleep', ['1']);
  }
  throw new Error(`observer not ready after ${timeout / 1000} s`);
}

// In CI the session authenticates with CLAUDE_CODE_OAUTH_TOKEN, which
// harnessEnv strips with the other CLAUDE_CODE_* variables. Only the claude
// process gets it back.
export function sessionAuth() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    key === 'CLAUDE_CODE_OAUTH_TOKEN' || key.startsWith('CLAUDE_CODE_RETRY_WATCHDOG')));
}

// The agent's Bash tool could print its environment. Results get uploaded,
// so replace the token wherever it appears in them.
export function redactDir(dir) {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!token || token.length < 8) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true, recursive: true})) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name), text = fs.readFileSync(file, 'utf8');
    if (text.includes(token)) fs.writeFileSync(file, text.split(token).join('<redacted>'));
  }
}
