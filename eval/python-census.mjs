#!/usr/bin/env node
// Census of public Python repos: research data for Python support. For each
// repo: the package manager and how long installing takes, and for each test,
// typecheck and lint command it runs (eval/py-audit/inspect_project.py), two
// timed runs, one run under the audit-hook prototype (eval/py-audit/
// sitecustomize.py) and strace, and for tests one run with the network off.
// It records; it does not judge.
//
//   node eval/census.mjs --python --recorded --shard 3/40   # on CI (eval.yml)
//   node eval/python-census.mjs owner/name ...              # Linux, with sudo
//
// --recorded only makes eval.yml install strace. --hook-cost also times warm
// runs with and without the hook, alternated. --sandbox instead runs each
// check plainly and inside OS sandboxes, alternated (eval/sandbox.mjs). Writes
// .local/eval/python-census-*.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import {evalDir, harnessEnv, localDir, readJson, sh, slug, stamp, tmpRoot} from './lib.mjs';
import {sandboxModes, sandboxSuite} from './sandbox.mjs';

const argv = process.argv.slice(2), sandbox = argv.includes('--sandbox');
const shardArg = argv.includes('--shard') ? argv[argv.indexOf('--shard') + 1] : null;
let names = argv.filter((arg, i) => !arg.startsWith('-') && argv[i - 1] !== '--shard');
if (!names.length) names = readJson(path.join(evalDir, 'python-census-repos.json')).repos;
if (shardArg) { const [k, n] = shardArg.split('/').map(Number); names = names.filter((_, i) => i % n === k - 1); }

const hookDir = path.join(evalDir, 'py-audit');
const base = harnessEnv({PIP_DISABLE_PIP_VERSION_CHECK: '1', POETRY_VIRTUALENVS_IN_PROJECT: 'true', PIPENV_VENV_IN_PROJECT: '1',
  PIPENV_YES: '1', UV_NO_PROGRESS: '1', PYTHONUNBUFFERED: '1', FORCE_COLOR: '0', NO_COLOR: '1'});
for (const key of ['PYTHONPATH', 'PYTHONHOME', 'VIRTUAL_ENV', 'CONDA_PREFIX']) delete base[key];
const run = (cmd, args, cwd, timeout, env = base) => sh(cmd, args, {cwd, env, timeout});
const tail = (r, n = 600) => (r.stderr + '\n' + r.stdout).trim().slice(-n);
const which = name => run('sh', ['-c', `command -v ${name}`], os.homedir(), 10_000).stdout.trim() || null;

// On a CI runner, the package managers users pick, through pipx.
function tools() {
  if (!process.env.GITHUB_ACTIONS) return;
  if (!which('pipx') && process.platform === 'darwin') console.error(`brew install pipx: exit ${run('brew', ['install', 'pipx'], os.homedir(), 600_000).status}`);
  for (const name of ['uv', 'poetry', 'pdm', 'pipenv'])
    if (!which(name)) console.error(`pipx install ${name}: exit ${run('pipx', ['install', name], os.homedir(), 300_000).status}`);
}
const strace = !!which('strace');
const offline = process.platform === 'linux' && run('sudo', ['-n', 'unshare', '--net', 'true'], os.homedir(), 20_000).status === 0;

function install(dir, info) {
  const steps = [];
  const step = (cmd, args, timeout = 600_000) => { const r = run(cmd, args, dir, timeout); steps.push({cmd: [cmd, ...args].join(' '), status: r.status, ms: r.ms, tail: r.status ? tail(r, 400) : undefined}); return r.status === 0; };
  // Fall back to fewer extras when every extra does not install.
  const first = (...tries) => tries.some(([cmd, args]) => step(cmd, args));
  const groups = info.groups.flatMap(g => ['--group', g]);
  switch (info.pm) {
    case 'uv':
      if (info.locks.includes('uv')) first(['uv', ['sync', '--frozen', '--all-extras', '--all-groups']], ['uv', ['sync', '--frozen', '--all-groups']], ['uv', ['sync', '--frozen']]);
      else first(['uv', ['sync', '--all-extras', '--all-groups']], ['uv', ['sync', '--all-groups']], ['uv', ['sync']]);
      break;
    case 'poetry':
      first(['poetry', ['install', '--no-interaction', '--all-extras', '--all-groups']], ['poetry', ['install', '--no-interaction', '--all-groups']], ['poetry', ['install', '--no-interaction']]);
      break;
    case 'pdm': first(['pdm', ['install', '-G', ':all']], ['pdm', ['install']]); break;
    case 'pipenv': first(['pipenv', ['install', '--dev']]); break;
    case 'pip': {
      // pip's layout, installed with uv's pip interface for speed.
      const python = info.python ? ['--python', info.python] : [];
      if (!step('uv', ['venv', '.venv', ...python])) break;
      const reqs = info.requirements.filter(f => /(^|\/)requirements\.txt$|test|dev|lint|ci|check|typ/i.test(f) && !/doc/i.test(f));
      const wanted = info.extras.filter(e => /test|dev|lint|typ|check|ci|all/i.test(e) && !/doc/i.test(e));
      const local = info.project || info.setupPy ? [`.${wanted.length ? `[${wanted.join(',')}]` : ''}`] : [];
      const tryInstall = (extra, more) => step('uv', ['pip', 'install', '--python', '.venv/bin/python', ...extra, ...more]);
      const editable = local.length ? ['-e', local[0]] : [];
      const ok = tryInstall([...editable, ...reqs.flatMap(f => ['-r', f])], groups) || tryInstall([...editable, ...reqs.flatMap(f => ['-r', f])], []) ||
        (local.length && tryInstall(['-e', '.'], []));
      if (!ok && !local.length && !reqs.length) steps.push({cmd: 'nothing to install', status: 0, ms: 0});
      break;
    }
    default: steps.push({cmd: `no installer for ${info.pm}`, status: null, ms: 0});
  }
  const venv = path.join(dir, '.venv');
  return {steps, pass: steps.length > 0 && steps.at(-1).status === 0 && fs.existsSync(path.join(venv, 'bin', 'python')), ms: steps.reduce((t, s) => t + s.ms, 0), venv};
}

function venvEnv(venv, extra = {}) {
  return {...base, VIRTUAL_ENV: venv, PATH: `${path.join(venv, 'bin')}:${base.PATH}`, ...extra};
}

// The command a check runs: the project's own line when it is a plain one,
// else the tool's default form.
function command(check, venv, dir) {
  const bin = name => fs.existsSync(path.join(venv, 'bin', name)) ? path.join(venv, 'bin', name) : null;
  const plain = check.args && check.penalty < 10 ? check.args : null;
  const targets = () => {
    if (fs.existsSync(path.join(dir, 'src'))) return ['src'];
    const pkgs = fs.readdirSync(dir).filter(n => !/^(tests?|docs?|examples?|scripts?|benchmarks?)$/.test(n) && fs.existsSync(path.join(dir, n, '__init__.py')));
    return pkgs.length ? pkgs : ['.'];
  };
  const tool = check.tool;
  let args, via = 'venv';
  const viaUvx = (pkg, exe, more = []) => { via = 'uvx'; return ['uvx', '--from', pkg, exe, ...more]; };
  switch (tool) {
    case 'pytest': args = [path.join(venv, 'bin', 'python'), '-m', 'pytest', ...(plain ?? [])]; break;
    case 'unittest': args = [path.join(venv, 'bin', 'python'), '-m', 'unittest', ...(plain ?? ['discover'])]; break;
    case 'mypy': args = [...(bin('mypy') ? [bin('mypy')] : viaUvx('mypy', 'mypy', ['--python-executable', path.join(venv, 'bin', 'python')])),
      ...(plain ?? (check.mypyFiles ? [] : targets()))]; break;
    case 'pyright': case 'basedpyright': args = [...(bin(tool) ? [bin(tool)] : viaUvx(tool, tool)), ...(plain ?? [])]; break;
    case 'ty': args = [...(bin('ty') ? [bin('ty')] : viaUvx('ty', 'ty')), 'check', ...(plain ?? [])]; break;
    case 'pyrefly': args = [...(bin('pyrefly') ? [bin('pyrefly')] : viaUvx('pyrefly', 'pyrefly')), 'check', ...(plain ?? [])]; break;
    case 'ruff': args = [...(bin('ruff') ? [bin('ruff')] : viaUvx('ruff', 'ruff')), 'check', ...(plain ?? [])]; break;
    case 'flake8': args = [...(bin('flake8') ? [bin('flake8')] : viaUvx('flake8', 'flake8')), ...(plain ?? [])]; break;
    case 'pylint': args = [...(bin('pylint') ? [bin('pylint')] : viaUvx('pylint', 'pylint')), ...(plain ?? targets())]; break;
    default: return null;
  }
  return {argv: args, via, fromProject: !!plain};
}

// Files a run wrote, grouped: caches, the venv, outputs.
function written(dir, mark) {
  const r = run('find', ['.', '-newer', mark, '-type', 'f', '-not', '-path', './.git/*'], dir, 120_000);
  const groups = {};
  for (const file of r.stdout.split('\n').filter(Boolean).map(f => f.slice(2))) {
    const parts = file.split('/');
    const key = parts.includes('__pycache__') ? (parts[0] === '.venv' ? '.venv/**/__pycache__' : '**/__pycache__') :
      parts[0] === '.venv' ? `.venv/${parts.slice(1, 4).join('/')}` : parts[0].startsWith('.') || parts.length === 1 ? parts[0] : `${parts[0]}/${parts[1] ?? ''}`;
    groups[key] = (groups[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 25));
}

function junit(file) {
  let text; try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const cases = {};
  for (const m of text.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attr = name => new RegExp(`\\b${name}="([^"]*)"`).exec(m[1])?.[1] ?? '';
    const body = m[3] ?? '';
    cases[`${attr('classname')}::${attr('name')}`] = /<(failure|error)\b/.test(body) ? 'fail' : /<skipped\b/.test(body) ? 'skip' : 'pass';
  }
  return cases;
}

function timedRun(dir, cmd, env, timeout, label) {
  const mark = path.join(tmpRoot, `py-census-mark-${label}`);
  fs.writeFileSync(mark, '');
  const r = run(cmd.argv[0], cmd.argv.slice(1), dir, timeout, env);
  return {status: r.status, timedOut: r.timedOut, ms: r.ms, written: written(dir, mark), tail: r.status === 0 ? undefined : tail(r, 400),
    summary: (/(=+ .*(passed|failed|error|no tests ran).* =+)$/m.exec(r.stdout) ?? /Found \d+ errors?.*|Success: no issues found.*|All checks passed!|\d+ errors?, \d+ warnings?.*/m.exec(r.stdout + r.stderr))?.[0]};
}

// The network-off run: a new network namespace with only loopback, as this user.
function offlineRun(dir, cmd, env, timeout) {
  const vars = Object.entries(env).filter(([k]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k)).map(([k, v]) => `${k}=${v}`);
  const r = run('sudo', ['-n', 'unshare', '--net', '--', 'sh', '-c', 'ip link set lo up && u=$0 g=$1 && shift && exec setpriv --reuid="$u" --regid="$g" --init-groups -- "$@"',
    String(process.getuid()), String(process.getgid()), '/usr/bin/env', '-i', ...vars, ...cmd.argv], dir, timeout, env);
  return {status: r.status, timedOut: r.timedOut, ms: r.ms, tail: r.status === 0 ? undefined : tail(r, 400)};
}

// strace: per process, the files opened, stat'ed and listed, and programs run.
// Calls before the hook marks itself installed (a stat of /.redue-py-audit-ready)
// are interpreter startup and the hook's own imports, counted apart.
async function readTrace(file, cwd) {
  const procs = new Map(), proc = pid => procs.get(pid) ?? procs.set(pid, {opens: new Set(), stats: new Map(), lists: new Set(), exec: null, cwd, hooked: false, startup: 0}).get(pid);
  const pending = new Map();
  const rl = readline.createInterface({input: fs.createReadStream(file), crlfDelay: Infinity});
  for await (let line of rl) {
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const pid = Number(m[1]); let body = m[2];
    if (body.endsWith('<unfinished ...>')) { pending.set(pid, body.slice(0, -'<unfinished ...>'.length)); continue; }
    const resumed = /^<\.\.\. \w+ resumed>(.*)$/.exec(body);
    if (resumed) { body = (pending.get(pid) ?? '') + resumed[1]; pending.delete(pid); }
    const call = /^(\w+)\((.*)\)\s+=\s+(-?\d+|\?)(<[^>]*>)?\s*(\w+)?/.exec(body);
    if (!call) continue;
    const [, name, args, ret, retPath, errno] = call, p = proc(pid);
    const strs = [...args.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1].replace(/\\(.)/g, '$1'));
    const dirfd = /^(-?\d+|AT_FDCWD)(<([^>]*)>)?/.exec(args);
    const resolve = rel => rel.startsWith('/') ? rel : path.resolve(dirfd?.[3] ?? p.cwd ?? '/', rel);
    if (name === 'execve' && ret === '0') { p.exec = strs[0]; p.argv = strs.slice(1, 6); p.hooked = false; }
    else if (/^(clone3?|fork|vfork)$/.test(name) && Number(ret) > 0) { const child = proc(Number(ret)); Object.assign(child, {cwd: p.cwd, parent: pid, exec: p.exec, hooked: p.hooked}); }
    else if (name === 'chdir' && ret === '0') p.cwd = resolve(strs[0]);
    else if (!p.hooked) { if (strs[0] === '/.redue-py-audit-ready') p.hooked = true; else p.startup++; }
    else if ((name === 'openat' || name === 'open') && strs.length) {
      if (ret !== '-1' && retPath && !/O_DIRECTORY/.test(args)) p.opens.add(retPath.slice(1, -1));
      else if (ret === '-1') p.stats.set(resolve(strs[0]), errno ?? 'ERR');
    } else if (/^(stat|lstat|newfstatat|statx|access|faccessat2?|readlink|readlinkat)$/.test(name) && strs.length && strs[0] !== '')
      p.stats.set(resolve(strs[0]), ret === '-1' ? errno ?? 'ERR' : 'ok');
    else if (name === 'getdents64' && dirfd?.[3]) p.lists.add(dirfd[3]);
  }
  return procs;
}

function readHook(dir) {
  const procs = new Map();
  for (const file of fs.readdirSync(dir)) {
    const pid = Number(file.split('.')[0]), p = {opens: new Set(), stats: new Set(), lists: new Set(), env: new Set(), net: [], exec: [], modules: [], start: null, complete: false, envCopiers: []};
    for (const line of fs.readFileSync(path.join(dir, file), 'utf8').split('\n')) {
      let r; try { r = JSON.parse(line); } catch { continue; }
      if (r[0] === 'start') p.start = {executable: r[1], argv: r[2], prefix: r[4], basePrefix: r[5], version: r[6]};
      else if (r[0] === 'open') p.opens.add(path.normalize(r[1]));
      else if (r[0] === 'stat') p.stats.add(path.normalize(r[1]));
      else if (r[0] === 'list') p.lists.add(path.normalize(r[1]));
      else if (r[0] === 'env') { p.env.add(r[1]); if (r[2]) p.envCopiers.push(r[2].slice(0, 2).join(' < ')); }
      else if (r[0] === 'net') p.net.push([r[1], r[2]]);
      else if (r[0] === 'exec') p.exec.push(r[2]?.[0] ?? r[3]);
      else if (r[0] === 'modules') { p.modules = r[1]; p.complete = true; }
    }
    procs.set(pid, p);
  }
  return procs;
}

const real = file => { try { return fs.realpathSync(file); } catch { return path.normalize(file); } };

// What the hook missed in the Python processes it loaded into, by place.
function compare(trace, hook, {dir, venv, basePrefix, ignore}) {
  const place = file => file.startsWith(venv + '/') ? 'venv' : file.startsWith(dir + '/') ? 'checkout' : basePrefix && file.startsWith(basePrefix + '/') ? 'interpreter' :
    /^\/(proc|sys|dev)\//.test(file) ? 'proc-sys-dev' : /^\/(usr|lib|lib64|etc|bin|sbin)\//.test(file) ? 'system' : file.startsWith(os.homedir() + '/') ? 'home' : /^\/tmp\//.test(file) ? 'tmp' : 'other';
  const kindOf = file => /\.(so(\.\d+)*|pyd)$/.test(file) ? 'shared-library' : /\.pyc$/.test(file) ? 'pyc' : /\.py$/.test(file) ? 'py' : 'data';
  const missed = {opens: {}, statOnly: {}, lists: {}}, examples = {opens: {}, statOnly: {}, lists: {}};
  const add = (bucket, key, file) => {
    if (ignore.some(prefix => file.startsWith(prefix + '/') || file === prefix)) return;
    missed[bucket][key] = (missed[bucket][key] ?? 0) + 1;
    const list = examples[bucket][key] ??= [];
    if (list.length < 8 && !/^(system|proc-sys-dev)/.test(key)) list.push(file.startsWith(dir + '/') ? path.relative(dir, file) : file);
  };
  // The import system looks for a module as a package, an extension, source
  // and bytecode in each sys.path directory.
  const probe = file => /\.(cpython-\d+[^/]*\.so|abi3\.so|so|py|pyc|pyw|pth)$/.test(file) || /\/__init__[^/]*$/.test(file) || /\/__pycache__(\/|$)/.test(file);
  let pythonProcs = 0, hookedOpens = 0, startupCalls = 0, incomplete = 0;
  const native = {};
  for (const [pid, t] of trace) {
    const h = hook.get(pid);
    if (h && !h.complete) { incomplete++; continue; }
    if (!h) {
      if (t.exec && !/python/.test(path.basename(t.exec)) && !trace.get(t.parent)?.exec?.endsWith(path.basename(t.exec)))
        native[path.basename(t.exec)] = (native[path.basename(t.exec)] ?? 0) + 1;
      continue;
    }
    pythonProcs++; startupCalls += t.startup;
    const opened = new Set([...h.opens].map(real)), modules = new Set(h.modules.map(real));
    hookedOpens += opened.size;
    const listed = new Set([...h.lists].map(real)), statted = new Set([...h.stats].map(real));
    for (const file of t.opens) if (!opened.has(file) && !modules.has(file)) add('opens', `${place(file)} ${kindOf(file)}`, file);
    for (const [file, result] of t.stats) {
      if (t.opens.has(file) || opened.has(file) || statted.has(file) || listed.has(path.dirname(file)) || modules.has(file)) continue;
      add('statOnly', `${place(file)} ${result === 'ok' ? 'found' : 'absent'}${probe(file) ? ' import-probe' : ''}`, file);
    }
    for (const d of t.lists) if (!listed.has(d)) add('lists', place(d), d);
  }
  const sort = o => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  return {pythonProcs, incomplete, hookedOpens, startupCalls, missedOpens: sort(missed.opens), missedStatOnly: sort(missed.statOnly), missedLists: sort(missed.lists), examples, native: sort(native)};
}

async function tracedRun(dir, cmd, env, timeout, venv) {
  const work = fs.mkdtempSync(path.join(tmpRoot, 'py-census-trace-')), audit = path.join(work, 'audit'), trace = path.join(work, 'strace');
  fs.mkdirSync(audit);
  const hooked = {...env, PYTHONPATH: hookDir, REDUE_PY_AUDIT_DIR: audit};
  const argv = strace ? ['strace', '-f', '-qq', '-y', '-s', '4096', '-o', trace, '-e',
    'trace=execve,open,openat,stat,lstat,newfstatat,statx,access,faccessat,faccessat2,readlink,readlinkat,chdir,clone,clone3,fork,vfork,getdents64', ...cmd.argv] : cmd.argv;
  const r = run(argv[0], argv.slice(1), dir, timeout, hooked);
  const out = {status: r.status, timedOut: r.timedOut, ms: r.ms};
  try {
    const hook = readHook(audit);
    const procs = [...hook.values()];
    const env = new Set(procs.flatMap(p => [...p.env]));
    const net = procs.flatMap(p => p.net).map(([event, target]) => `${event} ${target}`);
    out.hook = {processes: procs.length, versions: [...new Set(procs.map(p => p.start?.version))], env: [...env].sort(),
      net: [...new Set(net)].slice(0, 40), envCopiers: [...new Set(procs.flatMap(p => p.envCopiers))].slice(0, 10), remoteNet: net.some(n => !/localhost|127\.0\.0\.1|::1|0\.0\.0\.0|\/|None|^socket\.bind/.test(n)),
      programs: [...new Set(procs.flatMap(p => p.exec).filter(Boolean).map(p => path.basename(p)))].slice(0, 40),
      checkoutOpens: [...new Set(procs.flatMap(p => [...p.opens]).filter(f => f.startsWith(dir + '/') && !f.startsWith(venv + '/')).map(f => {
        const rel = path.relative(dir, f).split('/'); return rel.includes('__pycache__') ? '**/__pycache__' : rel[0].startsWith('.') ? rel[0] : rel.length > 1 ? `${rel[0]}/` : rel[0];
      }))].slice(0, 40)};
    const basePrefix = procs.find(p => p.start?.basePrefix)?.start.basePrefix;
    if (strace && fs.existsSync(trace)) out.compare = compare(await readTrace(trace, real(dir)), hook, {dir: real(dir), venv: real(venv), basePrefix: basePrefix && real(basePrefix), ignore: [real(hookDir), real(work)]});
  } catch (error) { out.analysisError = String(error.stack ?? error).slice(0, 600); }
  fs.rmSync(work, {recursive: true, force: true});
  return out;
}

async function census(name, modes) {
  const row = {name, started: new Date().toISOString()};
  const dir = path.join(tmpRoot, 'py-census', slug(name));
  fs.rmSync(dir, {recursive: true, force: true});
  const clone = run('git', ['clone', '-q', '--depth', '1', name.includes('://') ? name : `https://github.com/${name}.git`, dir], tmpRoot, 600_000);
  if (clone.status !== 0) return {...row, error: `clone: ${tail(clone, 300)}`};
  row.commit = run('git', ['rev-parse', 'HEAD'], dir).stdout.trim();
  const inspected = run('python3', [path.join(hookDir, 'inspect_project.py'), dir], dir, 120_000);
  let info; try { info = JSON.parse(inspected.stdout); } catch { return {...row, error: `inspect: ${tail(inspected, 300)}`}; }
  row.info = info;
  if (!info.pm) { fs.rmSync(dir, {recursive: true, force: true}); return {...row, error: 'not a Python project'}; }
  const inst = install(dir, info);
  row.install = {pass: inst.pass, ms: inst.ms, steps: inst.steps};
  const venv = inst.venv;
  if (inst.pass) {
    const venvEnvironment = venvEnv(venv);
    const listed = run('uv', ['pip', 'list', '--python', path.join(venv, 'bin', 'python'), '--format', 'json'], dir, 60_000);
    try { row.packages = Object.fromEntries(JSON.parse(listed.stdout).filter(p => /^(pytest.*|mypy|pyright|basedpyright|ty|pyrefly|ruff|flake8|pylint|hypothesis|coverage|django|numpy|torch)$/i.test(p.name)).map(p => [p.name, p.version])); } catch {}
    row.python = run(path.join(venv, 'bin', 'python'), ['-c', 'import sys,platform;print(platform.python_version(), sys.base_prefix)'], dir, 30_000).stdout.trim();
    row.checks = {};
    for (const [kind, timeout] of [['test', 600_000], ['typecheck', 300_000], ['lint', 180_000]]) {
      for (const check of info.checks[kind] ?? []) {
        const cmd = command({...check, mypyFiles: info.mypyFiles}, venv, dir);
        if (!cmd) continue;
        const key = `${kind}:${check.tool}`, junitFile = path.join(tmpRoot, `py-census-${slug(name)}.xml`);
        const withJunit = (c, file) => check.tool === 'pytest' ? {...c, argv: [...c.argv, `--junitxml=${file}`]} : c;
        const out = row.checks[key] = {source: check.source, line: check.line, form: check.form, argv: cmd.argv.map(a => a.startsWith(dir) ? path.relative(dir, a) || '.' : a), via: cmd.via, fromProject: cmd.fromProject};
        console.error(`  ${key}: ${out.argv.join(' ')}`);
        if (modes) {
          // pytest's per-test results, in the checkout: bubblewrap's /tmp is private.
          const perRun = check.tool === 'pytest' ? {args: label => [`--junitxml=${path.join(dir, `.sbx-junit-${label}.xml`)}`],
            read: label => { const f = path.join(dir, `.sbx-junit-${label}.xml`), r = junit(f); fs.rmSync(f, {force: true}); return r; }} : null;
          Object.assign(out, await sandboxSuite({argv: cmd.argv, cwd: dir, env: venvEnvironment, timeout, modes, python: path.join(venv, 'bin', 'python'), perRun}));
          for (const v of Object.values(out.runs)) for (const r of v) if (r.tests) { r.testCount = Object.keys(r.tests).length; delete r.tests; }
          console.error(`  ${key}: plain ${out.runs.plain.map(r => r.status).join('/')} ${Object.entries(out.same).map(([m, same]) => `${m} ${same ? 'same' : 'DIFFERENT'}`).join(' ')}`);
          continue;
        }
        out.runs = [];
        for (const n of [1, 2]) {
          out.runs.push(timedRun(dir, withJunit(cmd, `${junitFile}.${n}`), venvEnvironment, timeout, `${kind}${n}`));
          if (out.runs.at(-1).timedOut) break;
        }
        if (check.tool === 'pytest') {
          const results = [1, 2].map(n => junit(`${junitFile}.${n}`));
          out.tests = results[1] ? Object.keys(results[1]).length : null;
          if (results[0] && results[1]) out.flaky = Object.keys(results[1]).filter(t => results[0][t] && results[0][t] !== results[1][t]).slice(0, 20);
        }
        if (out.runs.some(r => r.timedOut)) continue;
        // The hook's own cost: warm runs with and without it, alternated.
        if (process.argv.includes('--hook-cost')) {
          const audit = fs.mkdtempSync(path.join(tmpRoot, 'py-census-cost-'));
          const hooked = {...venvEnvironment, PYTHONPATH: hookDir, REDUE_PY_AUDIT_DIR: audit};
          out.hookCost = [];
          for (const n of [1, 2]) {
            const plain = run(cmd.argv[0], cmd.argv.slice(1), dir, timeout, venvEnvironment), withHook = run(cmd.argv[0], cmd.argv.slice(1), dir, timeout, hooked);
            out.hookCost.push({plain: plain.ms, hooked: withHook.ms, status: [plain.status, withHook.status]});
          }
          fs.rmSync(audit, {recursive: true, force: true});
        }
        out.traced = await tracedRun(dir, cmd, venvEnvironment, timeout * 2, venv);
        if (kind === 'test' && offline) {
          const c = withJunit(cmd, `${junitFile}.off`);
          out.offline = offlineRun(dir, c, venvEnvironment, timeout);
          const online = junit(`${junitFile}.2`), off = junit(`${junitFile}.off`);
          if (online && off) {
            out.offline.failedOnlyOffline = Object.keys(online).filter(t => online[t] === 'pass' && off[t] && off[t] !== 'pass');
            out.offline.skippedOnlyOffline = Object.keys(online).filter(t => online[t] === 'pass' && off[t] === 'skip').length;
            out.offline.failedOnlyOffline = {count: out.offline.failedOnlyOffline.length, examples: out.offline.failedOnlyOffline.slice(0, 10)};
          }
        }
        for (const f of fs.readdirSync(tmpRoot)) if (f.startsWith(`py-census-${slug(name)}.xml`)) fs.rmSync(path.join(tmpRoot, f), {force: true});
      }
    }
  }
  fs.rmSync(dir, {recursive: true, force: true});
  // A runner's disk holds a few ML installs, not a shard's.
  if (process.env.GITHUB_ACTIONS) run('uv', ['cache', 'clean'], tmpRoot, 300_000);
  return row;
}

fs.mkdirSync(path.join(tmpRoot, 'py-census'), {recursive: true});
fs.mkdirSync(localDir, {recursive: true});
tools();
const file = path.join(localDir, `python-census-${shardArg ? shardArg.replace('/', 'of') + '-' : ''}${stamp()}.json`);
const rows = [];
console.error(`strace ${strace}, network-off runs ${offline}`);
const modes = sandbox ? sandboxModes() : null;
if (modes) console.error(`sandbox modes ${JSON.stringify(modes)}`);
for (const name of names) {
  process.stderr.write(`python census ${name} ...\n`);
  try { rows.push(await census(name, modes)); } catch (error) { rows.push({name, error: String(error.stack ?? error).slice(0, 600)}); }
  const r = rows.at(-1);
  console.log([r.name, r.error ?? '', r.info?.pm ?? '', r.install ? `install ${r.install.pass ? 'ok' : 'FAIL'} ${r.install.ms} ms` : '',
    ...Object.entries(r.checks ?? {}).map(([k, c]) => `${k} ${(c.runs?.plain ?? c.runs ?? []).map(x => x.timedOut ? 'timeout' : `${x.status === 0 ? 'ok' : 'fail'} ${x.ms}`).join('/')}`)].filter(Boolean).join('  '));
  if (modes) r.sandboxModes = modes;
  fs.writeFileSync(file, JSON.stringify(rows, null, 1) + '\n');
}
console.log(`\nwrote ${file}`);
