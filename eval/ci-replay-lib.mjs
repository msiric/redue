// Shared parts of the CI replay study (ci-replay.mjs on CI, the jobs fetcher
// and the report on a developer's machine). Pure functions over workflow
// files, commands and git listings: nothing here runs a repository's code.
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import picomatch from 'picomatch';
import {docPatterns, namedDocsLimit} from '../src/sandbox.mjs';

export const sha = text => createHash('sha256').update(text).digest('hex').slice(0, 24);

// ---- Documentation, as sandbox-v3 hides it (hiddenDocs in src/sandbox.mjs):
// tracked regular files docPatterns names; LICENSE* and CHANGELOG* files only
// while there are at most namedDocsLimit of them.
const docMatch = picomatch(docPatterns, {dot: true});
const byExtension = picomatch(docPatterns.filter(pattern => !/LICENSE|CHANGELOG/.test(pattern)), {dot: true});
export function docsOf(entries) {
  const docs = new Set(entries.filter(e => e.mode !== '120000' && e.mode !== '160000' && docMatch(e.path)).map(e => e.path));
  const named = [...docs].filter(rel => !byExtension(rel));
  if (named.length > namedDocsLimit) for (const rel of named) docs.delete(rel);
  return docs;
}
// `git ls-tree -r -z` output: {mode, oid, path}.
export function parseTree(text) {
  return text.split('\0').filter(Boolean).map(line => {
    const tab = line.indexOf('\t'), [mode, , oid] = line.slice(0, tab).split(' ');
    return {mode, oid, path: line.slice(tab + 1)};
  });
}
export const entriesKey = entries => sha(entries.map(e => `${e.mode} ${e.oid} ${e.path}`).join('\n'));

// ---- Commands -------------------------------------------------------------
const kindWords = {
  typecheck: /^(typecheck|type-check|check-types|types|typings?|tsc|mypy|pyright|ty|check:types?|types:check|ts:check|tsc:check|lint:types?|type|typecheck:.*|.*:typecheck|.*:types)$/,
  lint: /^(lint|lint:.*|.*:lint|eslint|format:check|fmt:check|check-format|check:format|prettier|prettier:check|style|ruff|flake8|biome|format-check|lint-.*|pre-commit|precommit|check-lint|static)$/,
  test: /^(test|tests|test:.*|.*:test|unit|unittest|unit-tests?|e2e|integration|pytest|spec|coverage|cov|test-.*|tests-.*|ci-test|cover|py|py\d+.*|pypy\d*.*)$/,
};
const tools = {
  typecheck: ['tsc', 'tsgo', 'vue-tsc', 'svelte-check', 'mypy', 'dmypy', 'pyright', 'basedpyright', 'pytype', 'ty'],
  lint: ['eslint', 'oxlint', 'prettier', 'ruff', 'flake8', 'pylint', 'black', 'isort', 'stylelint', 'dprint', 'pre-commit', 'prek',
    'codespell', 'yamllint', 'actionlint', 'shellcheck', 'markdownlint', 'markdownlint-cli2', 'biome', 'xo', 'standard', 'knip', 'sherif', 'publint', 'syncpack'],
  test: ['vitest', 'jest', 'mocha', 'ava', 'playwright', 'cypress', 'pytest', 'py.test', 'tap', 'karma', 'wdio', 'uvu', 'c8', 'nyc', 'tox', 'nox'],
};
const toolKind = new Map(Object.entries(tools).flatMap(([kind, names]) => names.map(name => [name, kind])));
// A tool word that only checks with a flag or subcommand.
function toolCheck(argv) {
  const [tool, ...rest] = argv, base = tool.split('/').pop();
  if (base === 'node' && rest.includes('--test')) return 'test';
  if (['bun', 'deno'].includes(base) && rest[0] === 'test') return 'test';
  if (base === 'deno' && (rest[0] === 'check' || rest[0] === 'lint')) return rest[0] === 'check' ? 'typecheck' : 'lint';
  if (base === 'astro' && rest[0] === 'check') return 'typecheck';
  if (base === 'python' || base === 'python3') {
    const m = rest.indexOf('-m');
    if (m >= 0) return toolCheck([rest[m + 1] || '', ...rest.slice(m + 2)]);
    return null;
  }
  const kind = toolKind.get(base);
  if (!kind) return null;
  if (base === 'prettier') return rest.some(a => a === '--check' || a === '-c' || a === '--list-different' || a === '-l') ? 'lint' : null;
  if (base === 'black' || base === 'isort') return rest.some(a => /^--check|^-c$|^--diff$/.test(a)) ? 'lint' : null;
  if (base === 'ruff') return rest[0] === 'format' ? rest.includes('--check') || rest.includes('--diff') ? 'lint' : null : 'lint';
  if (base === 'biome') return ['lint', 'check', 'ci', 'format'].includes(rest[0]) && (rest[0] !== 'format' || !rest.includes('--write')) ? 'lint' : null;
  if (base === 'ty') return rest[0] === 'check' ? 'typecheck' : null;
  if (base === 'playwright') return rest[0] === 'test' ? 'test' : null;
  if (base === 'cypress') return rest[0] === 'run' ? 'test' : null;
  return kind;
}
const pmBuiltins = new Set(['install', 'i', 'ci', 'add', 'remove', 'rm', 'uninstall', 'exec', 'dlx', 'x', 'create', 'init', 'publish', 'pack', 'link',
  'unlink', 'update', 'up', 'upgrade', 'outdated', 'audit', 'config', 'set', 'store', 'fetch', 'rebuild', 'prune', 'dedupe', 'why', 'list', 'ls',
  'info', 'view', 'version', 'cache', 'import', 'patch', 'patch-commit', 'setup', 'env', 'deploy', 'licenses', 'help', 'login', 'whoami', 'npm',
  'plugin', 'constraints', 'dedupe', 'explain', 'node', 'bin', 'root', 'prefix', 'workspaces', 'approve-builds', 'self-update']);
// A shell text, split into simple commands: argv with environment
// assignments and quoting removed. Good enough for CI steps, not a shell.
export function commands(text) {
  const out = [];
  const joined = String(text).replace(/\\\r?\n/g, ' ');
  for (const line of joined.split(/\r?\n/)) {
    const bare = line.replace(/(^|\s)#.*$/, '').trim();
    if (!bare) continue;
    for (const part of bare.split(/\s*(?:&&|\|\||;|\||\$\(|`|\))\s*/)) {
      const argv = (part.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(a => a.replace(/^["']|["']$/g, ''));
      while (argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[0])) argv.shift();
      if (argv.length) out.push(argv);
    }
  }
  return out;
}
// Wrappers that run the command after them.
function unwrap(argv) {
  for (let guard = 0; guard < 8 && argv.length; guard++) {
    const [first, ...rest] = argv, base = first.split('/').pop();
    if (['sudo', 'time', 'xvfb-run', 'env', 'exec', 'command', 'nice', 'cross-env', 'dotenv', 'npx', 'bunx', 'pnpx'].includes(base) ||
      base === 'timeout' && rest.length) {
      let i = 0;
      while (i < rest.length && (rest[i].startsWith('-') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[i]) || base === 'timeout' && i === 0 && /^\d/.test(rest[i]))) {
        if (rest[i] === '--') { i++; break; }
        i++;
      }
      argv = rest.slice(i); continue;
    }
    if (['uv', 'poetry', 'pdm', 'pipenv', 'rye'].includes(base) && rest[0] === 'run') {
      let i = 1;
      while (i < rest.length && rest[i].startsWith('-')) { i += /^--(with|extra|group|package|directory|python|env|project|only-group|with-requirements|index|config-file)$/.test(rest[i]) ? 2 : 1; }
      argv = rest.slice(i); continue;
    }
    if (['pnpm', 'yarn'].includes(base) && ['exec', 'dlx'].includes(rest[0])) { argv = rest.slice(1).filter(a => !a.startsWith('-')); continue; }
    if (base === 'uvx' || base === 'pipx' && rest[0] === 'run') { argv = (base === 'uvx' ? rest : rest.slice(1)).filter(a => !a.startsWith('-')); if (argv[0]) argv[0] = argv[0].split(/[@=]/)[0]; continue; }
    break;
  }
  return argv;
}
const flagValue = (argv, names) => {
  for (let i = 0; i < argv.length; i++) {
    for (const name of names) {
      if (argv[i] === name && argv[i + 1] !== undefined) return argv[i + 1];
      if (argv[i].startsWith(name + '=')) return argv[i].slice(name.length + 1);
    }
  }
  return null;
};
const flagValues = (argv, names) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) for (const name of names) {
    if (argv[i] === name && argv[i + 1] !== undefined) out.push(argv[i + 1]);
    else if (argv[i].startsWith(name + '=')) out.push(argv[i].slice(name.length + 1));
  }
  return out;
};
// The task names a runner invocation asks for, and the packages it picks:
// {targets, scope}. scope: {all: true} (every package), {affected: true},
// {filters: [...]}, {dir}, or null (the current directory).
function runner(argv) {
  const [first, ...rest] = argv, base = first.split('/').pop();
  const positional = rest.filter((a, i) => !a.startsWith('-') && !(i > 0 && /^(--filter|-F|-w|--workspace|--scope|-p|--projects|-t|--target|--targets|--dir|-C|--cwd|--prefix|--parallel|--concurrency|--package)$/.test(rest[i - 1])));
  if (['npm'].includes(base)) {
    const sub = positional[0];
    const ws = flagValues(rest, ['-w', '--workspace']), all = rest.includes('--workspaces') || rest.includes('-ws');
    const dir = flagValue(rest, ['--prefix', '-C']);
    const scope = all ? {all: true} : ws.length ? {filters: ws} : dir ? {dir} : null;
    if (sub === 'test' || sub === 't' || sub === 'tst') return {targets: ['test'], scope, script: true};
    if (sub === 'run' || sub === 'run-script' || sub === 'rum' || sub === 'urn') return positional[1] ? {targets: [positional[1]], scope, script: true} : null;
    return null;
  }
  if (base === 'pnpm' || base === 'yarn' || base === 'bun') {
    const filters = flagValues(rest, ['--filter', '-F']);
    const recursive = rest.includes('-r') || rest.includes('--recursive') || rest.some(a => a === '-ws');
    const dir = flagValue(rest, ['--dir', '-C', '--cwd']);
    let args = positional;
    if (base === 'yarn' && args[0] === 'workspace' && args[1]) return {targets: [args[2] === 'run' ? args[3] : args[2]].filter(Boolean), scope: {filters: [args[1]]}, script: true};
    if (base === 'yarn' && args[0] === 'workspaces' && (args[1] === 'foreach' || args[1] === 'run')) {
      const i = args.indexOf('run');
      const from = flagValues(rest, ['--from', '--include']);
      return {targets: [i >= 0 ? args[i + 1] : args[2]].filter(Boolean), scope: from.length ? {filters: from} : {all: true}, script: true};
    }
    if (base === 'bun' && args[0] !== 'run') return null;
    if (args[0] === 'run' || args[0] === 'run-script') args = args.slice(1);
    else if (pmBuiltins.has(args[0])) return null;
    if (!args[0]) return null;
    const scope = filters.length ? {filters} : recursive ? {all: true} : dir ? {dir} : null;
    return {targets: [args[0]], scope, script: true};
  }
  if (base === 'turbo') {
    const args = positional[0] === 'run' ? positional.slice(1) : positional;
    const filters = flagValues(rest, ['--filter', '-F']);
    const affected = rest.includes('--affected') || filters.some(f => /\[.*\]/.test(f));
    return {targets: args.filter(a => !a.includes('/')), scope: affected ? {affected: true} : filters.length ? {filters} : {all: true}, task: true};
  }
  if (base === 'nx') {
    const targets = [];
    for (let i = 0; i < rest.length; i++) if (/^(-t|--target|--targets)$/.test(rest[i])) { for (let j = i + 1; j < rest.length && !rest[j].startsWith('-'); j++) targets.push(...rest[j].split(',')); }
      else if (/^(--target|--targets)=/.test(rest[i])) targets.push(...rest[i].split('=')[1].split(','));
    if (positional[0] === 'affected') return {targets: targets.length ? targets : [flagValue(rest, ['--target']) || positional[1]].filter(Boolean), scope: {affected: true}, task: true};
    if (positional[0] === 'run-many') {
      const projects = flagValues(rest, ['-p', '--projects']).flatMap(p => p.split(','));
      return {targets, scope: projects.length ? {filters: projects} : {all: true}, task: true};
    }
    if (positional[0] === 'run' && positional[1]?.includes(':')) { const [project, target] = positional[1].split(':'); return {targets: [target], scope: {filters: [project]}, task: true}; }
    if (positional[0]?.includes(':')) { const [project, target] = positional[0].split(':'); return {targets: [target], scope: {filters: [project]}, task: true}; }
    if (positional[0] && positional[1]) return {targets: [positional[0]], scope: {filters: [positional[1]]}, task: true};
    return null;
  }
  if (base === 'lerna' && positional[0] === 'run') {
    const scopes = flagValues(rest, ['--scope']);
    return {targets: [positional[1]].filter(Boolean), scope: rest.includes('--since') ? {affected: true} : scopes.length ? {filters: scopes} : {all: true}, task: true};
  }
  if (base === 'make' || base === 'just' || base === 'task' || base === 'mise' && positional[0] === 'run') {
    const dir = flagValue(rest, ['-C', '--directory', '-d', '--justfile']);
    const targets = (base === 'mise' ? positional.slice(1) : positional).filter(a => !a.includes('='));
    return {targets, scope: dir ? {dir: dir.replace(/\/(justfile|Makefile)$/i, '')} : null, task: true};
  }
  if (base === 'nox') return {targets: flagValues(rest, ['-s', '--session', '--sessions', '-e']).flatMap(s => s.split(',')).concat(rest.includes('-t') ? [] : []), scope: null, task: true, runsTests: !rest.includes('-s') && !rest.includes('--session')};
  if (base === 'tox') { const envs = flagValues(rest, ['-e', '--env']).flatMap(s => s.split(',')); return {targets: envs.length ? envs : ['test'], scope: null, task: true}; }
  if (base === 'hatch' && positional[0] === 'test') return {targets: ['test'], scope: null, task: true};
  if (base === 'hatch' && positional[0] === 'run' && positional[1]) {
    const [env, script] = positional[1].includes(':') ? positional[1].split(':') : [null, positional[1]];
    if (!positional[1].includes(':') && toolKind.has(positional[1])) return null;
    return {targets: [script, env].filter(Boolean), scope: null, task: true};
  }
  if (base === 'hatch' && positional[0] === 'fmt') return {targets: ['lint'], scope: null, task: true};
  return null;
}
const nameKind = name => {
  const word = String(name).toLowerCase().replace(/^\.?\/?/, '');
  return Object.keys(kindWords).filter(kind => kindWords[kind].test(word));
};
const notCheck = /^(build|install|deploy|release|publish|clean|dev|start|serve|prepare|postinstall|generate|codegen|docs|bootstrap|setup|changeset|version|format|fmt|fix|lint:fix|lint-fix|format:fix|bench|benchmark)(:|$)/;
// The kinds of check a step's commands run (a Set of 'typecheck', 'lint',
// 'test'), with the scope each runs in. `scripts(dir)` gives the npm scripts
// of the package.json in `dir` ('' is the root), or null.
export function classifyRun(text, {scripts = () => null, dir = ''} = {}) {
  const found = [];
  let cwd = dir;
  const visit = (argv0, at, depth, scopeIn) => {
    const argv = unwrap(argv0);
    if (!argv.length) return;
    const base = argv[0].split('/').pop();
    if (base === 'cd' && argv[1]) { cwd = joinDir(at, argv[1]); return; }
    const run = runner(argv);
    if (run) {
      const scope = run.scope ? run.scope.dir ? {dir: joinDir(at, run.scope.dir)} : run.scope : scopeIn;
      for (const target of run.targets) {
        if (!target || notCheck.test(target)) continue;
        const own = run.script && !scope?.all && !scope?.filters && !scope?.affected ? scripts(scope?.dir ?? at)?.[target] : null;
        if (own && depth < 4) {
          const before = found.length;
          for (const inner of commands(own)) visit(inner, scope?.dir ?? at, depth + 1, scope);
          if (found.length > before) continue;
        }
        const kinds = nameKind(target);
        if (!kinds.length && run.runsTests) kinds.push('test');
        for (const kind of kinds) found.push({kind, scope: scope ?? (at ? {dir: at} : null), target});
      }
      return;
    }
    const kind = toolCheck(argv);
    if (kind) found.push({kind, scope: scopeIn ?? (at ? {dir: at} : null), target: base, paths: argv.slice(1).filter(a => !a.startsWith('-') && /[/.]/.test(a))});
  };
  for (const argv of commands(text)) visit(argv, cwd, 0, null);
  return found;
}
const joinDir = (at, rel) => {
  if (/\$\{\{|\$[A-Z_]/.test(rel)) return rel;
  const parts = (rel.startsWith('/') ? [] : at ? at.split('/') : []);
  for (const piece of rel.replace(/^\/+/, '').split('/')) {
    if (!piece || piece === '.') continue;
    if (piece === '..') parts.pop(); else parts.push(piece);
  }
  return parts.join('/');
};

// What a step before a check does with dependencies: installs from a lock,
// installs without one, or fetches a tool by name only. `has(path)`: whether
// the tree holds that file. `pinned(path)`: whether a requirements file pins
// every line.
export function installIssues(text, {has = () => false, pinned = () => false, dir = ''} = {}) {
  const issues = [], installs = [];
  for (const argv0 of commands(text)) {
    const argv = argv0[0] === 'sudo' ? argv0.slice(1) : argv0, [first, ...rest] = argv, base = first.split('/').pop();
    const lock = name => has(dir ? `${dir}/${name}` : name) || has(name);
    if (base === 'npm' && (rest[0] === 'ci' || rest[0] === 'clean-install')) { installs.push('npm ci'); continue; }
    if (base === 'npm' && ['install', 'i', 'add'].includes(rest[0])) {
      const named = rest.slice(1).filter(a => !a.startsWith('-'));
      if (rest.includes('-g') || rest.includes('--global')) { if (named.some(a => !/@\d/.test(a.replace(/^@/, '')))) issues.push('global npm tool without a version'); continue; }
      issues.push(named.length ? 'npm install of named packages' : 'npm install, not npm ci'); continue;
    }
    if (base === 'pnpm' && ['install', 'i'].includes(rest[0])) { if (rest.includes('--no-frozen-lockfile') || !lock('pnpm-lock.yaml')) issues.push('pnpm install without a frozen lockfile'); else installs.push('pnpm'); continue; }
    if (base === 'pnpm' && rest[0] === 'add' && (rest.includes('-g') || rest.includes('--global'))) { issues.push('global pnpm tool'); continue; }
    if (base === 'yarn' && (rest.length === 0 || rest[0] === 'install' || rest[0]?.startsWith('--'))) {
      if (!lock('yarn.lock')) issues.push('yarn install without yarn.lock');
      else if (!(rest.includes('--frozen-lockfile') || rest.includes('--immutable') || has('.yarnrc.yml'))) issues.push('yarn install without --frozen-lockfile');
      else installs.push('yarn');
      continue;
    }
    if (base === 'bun' && (rest[0] === 'install' || rest[0] === 'i')) { if (rest.includes('--frozen-lockfile') || rest.includes('--ci')) installs.push('bun'); else issues.push('bun install without --frozen-lockfile'); continue; }
    if (base === 'uv' && rest[0] === 'sync') { if (rest.includes('--upgrade') || rest.includes('-U') || !lock('uv.lock')) issues.push('uv sync without uv.lock'); else installs.push('uv'); continue; }
    if ((base === 'uv' && rest[0] === 'pip' && rest[1] === 'install') || /^pip3?(\.\d+)?$/.test(base) && rest[0] === 'install' || (base === 'python' || base === 'python3') && rest[0] === '-m' && rest[1] === 'pip' && rest[2] === 'install') {
      const args = base === 'uv' ? rest.slice(2) : base.startsWith('pip') ? rest.slice(1) : rest.slice(3);
      const files = flagValues(args, ['-r', '--requirement']), constraints = flagValues(args, ['-c', '--constraint']);
      const named = args.filter((a, i) => !a.startsWith('-') && !['-r', '--requirement', '-c', '--constraint', '-e', '--editable', '--index-url', '-i', '--extra-index-url', '-f', '--find-links', '--python'].includes(args[i - 1]));
      const editable = flagValues(args, ['-e', '--editable']);
      const ok = files.every(f => pinned(joinDir(dir, f))) && named.every(a => /==/.test(a) || /\.whl$/.test(a)) && (!editable.length && !named.some(a => a === '.' || a.startsWith('.[')) || constraints.some(f => pinned(joinDir(dir, f))));
      if (named.length === 1 && /^(pip|setuptools|wheel|uv|pipx|virtualenv)$/.test(named[0])) continue;
      if (ok) installs.push('pip pinned'); else issues.push('pip install without pins');
      continue;
    }
    if (base === 'poetry' && (rest[0] === 'install' || rest[0] === 'sync')) { if (lock('poetry.lock')) installs.push('poetry'); else issues.push('poetry install without poetry.lock'); continue; }
    if (base === 'pdm' && (rest[0] === 'install' || rest[0] === 'sync')) { if (lock('pdm.lock')) installs.push('pdm'); else issues.push('pdm install without pdm.lock'); continue; }
    if (base === 'pipenv' && rest[0] === 'install' || base === 'pipenv' && rest[0] === 'sync') { if (rest.includes('--deploy') || rest[0] === 'sync') installs.push('pipenv'); else issues.push('pipenv install without --deploy'); continue; }
    if (base === 'uv' && rest[0] === 'tool' && rest[1] === 'install' || base === 'pipx' && rest[0] === 'install') { if (rest.slice(2).some(a => !a.startsWith('-') && !/[=@]=?\d/.test(a))) issues.push('tool installed without a version'); continue; }
    if (base === 'uvx' || base === 'pipx' && rest[0] === 'run') { const tool = (base === 'uvx' ? rest : rest.slice(1)).find(a => !a.startsWith('-')); if (tool && !/[=@]=?\d/.test(tool)) issues.push('uvx or pipx tool without a version'); continue; }
    if ((base === 'curl' || base === 'wget') && /\|\s*(ba)?sh/.test(text)) { issues.push('installer fetched with curl'); continue; }
    if (base === 'tox' || base === 'nox' || base === 'hatch' && rest[0] !== 'version') { issues.push('tox, nox or hatch builds its environments'); continue; }
  }
  return {issues: [...new Set(issues)], installs};
}
// An action that installs dependencies, as its inputs ask.
export function actionIssues(uses, w = {}, {has = () => false} = {}) {
  const name = String(uses).split('@')[0].toLowerCase();
  if (/^actions\/(checkout|cache|upload-artifact|download-artifact|github-script|setup-node|setup-python|setup-go|setup-java|setup-dotnet)$/.test(name)) return {issues: [], installs: []};
  if (name === 'pnpm/action-setup') return w.run_install && w.run_install !== 'false' ? has('pnpm-lock.yaml') ? {issues: [], installs: ['pnpm']} : {issues: ['pnpm install without a frozen lockfile'], installs: []} : {issues: [], installs: []};
  if (/^(astral-sh\/setup-uv|oven-sh\/setup-bun|denoland\/setup-deno|actions-rust-lang\/.*|dtolnay\/rust-toolchain|docker\/setup-.*|pre-commit\/action)$/.test(name)) return {issues: [], installs: []};
  if (name === 'bahmutov/npm-install' || name === 'cypress-io/github-action') return {issues: [], installs: ['npm ci']};
  if (/^(snok\/install-poetry|abatilo\/actions-poetry)$/.test(name)) return {issues: [], installs: []};
  return {issues: [], installs: [], opaque: name.startsWith('./') ? null : name};
}
const deployLike = /\b(deploy|publish|release|docker push|gh pr comment|gh release|npm publish|twine upload|vercel|netlify|wrangler|firebase deploy|aws s3|gsutil|surge)\b/i;
const deployAction = /(deploy|release|publish|pages|docker\/build-push|comment|upload-pages|semantic-release|changesets\/action|codecov|coveralls)/i;
export const sideEffect = (step) => step.run ? deployLike.test(step.run) : step.uses ? deployAction.test(step.uses) && !/codecov|coveralls/i.test(step.uses) : false;

// ---- Workflows ------------------------------------------------------------
export function parseYaml(text) {
  try { return YAML.parse(text, {maxAliasCount: -1, uniqueKeys: false, strict: false}) ?? null; } catch { return null; }
}
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A display-name pattern for a name with ${{ }} expressions.
export function namePattern(name) {
  const parts = String(name).split(/\$\{\{[\s\S]*?\}\}/);
  return parts.map(escapeRe).join('.*?');
}
export const literalLength = name => String(name).replace(/\$\{\{[\s\S]*?\}\}/g, '').length;
const triggers = on => typeof on === 'string' ? [on] : Array.isArray(on) ? on : on && typeof on === 'object' ? Object.keys(on) : [];
export const workflowTriggers = doc => triggers(doc?.on ?? doc?.true);
// The matrix values a ${{ matrix.X }} expression may take, when they are written out.
function matrixValues(matrix, key) {
  if (!matrix || typeof matrix !== 'object') return null;
  const base = Array.isArray(matrix[key]) ? matrix[key] : [];
  const extra = Array.isArray(matrix.include) ? matrix.include.map(e => e?.[key]).filter(v => v !== undefined) : [];
  const values = [...base, ...extra].filter(v => typeof v === 'string' || typeof v === 'number').map(String);
  return values.length ? [...new Set(values)] : null;
}
// A workflow's jobs, with their steps: the parts the study needs. `read(path)`
// gives another file of the tree (a called workflow, a local composite
// action), or null. `caller`: the calling job's display name.
export function workflowJobs(doc, {read = () => null, caller = null, depth = 0} = {}) {
  const jobs = [];
  if (!doc?.jobs || typeof doc.jobs !== 'object') return jobs;
  for (const [id, job] of Object.entries(doc.jobs)) {
    if (!job || typeof job !== 'object') continue;
    const display = job.name ? String(job.name) : id;
    const matrix = job.strategy?.matrix;
    const hasMatrix = matrix && (typeof matrix === 'string' || Object.keys(matrix).length > 0);
    const pattern = namePattern(display) + (hasMatrix && !/\$\{\{[^}]*matrix\./.test(display) ? '( \\(.*\\))?' : '');
    const full = caller ? `${caller} / ${pattern}` : pattern;
    if (typeof job.uses === 'string') {
      if (job.uses.startsWith('./') && depth < 3) {
        const called = parseYaml(read(job.uses.replace(/^\.\//, '').split('@')[0]) || '');
        jobs.push(...workflowJobs(called, {read, caller: full, depth: depth + 1}).map(j => ({...j, callerId: id})));
      }
      continue;
    }
    const steps = [];
    const runsOn = JSON.stringify(job['runs-on'] ?? '');
    const dir = job.defaults?.run?.['working-directory'] ?? '';
    for (const [index, step] of (Array.isArray(job.steps) ? job.steps : []).entries()) {
      if (!step || typeof step !== 'object') continue;
      const entry = {index, name: step.name != null ? String(step.name) : null, dir: step['working-directory'] ?? dir};
      if (typeof step.run === 'string') entry.run = step.run;
      if (typeof step.uses === 'string') {
        entry.uses = step.uses;
        entry.with = step.with && typeof step.with === 'object' ? Object.fromEntries(Object.entries(step.with).map(([k, v]) => [k, String(v)])) : {};
        if (step.uses.startsWith('./') && depth < 3) {
          const action = parseYaml(read(`${step.uses.replace(/^\.\//, '').replace(/\/$/, '')}/action.yml`) || read(`${step.uses.replace(/^\.\//, '').replace(/\/$/, '')}/action.yaml`) || '');
          const inner = Array.isArray(action?.runs?.steps) ? action.runs.steps : [];
          entry.composite = inner.map(s => ({run: typeof s?.run === 'string' ? s.run : null, uses: typeof s?.uses === 'string' ? s.uses : null,
            with: s?.with && typeof s.with === 'object' ? Object.fromEntries(Object.entries(s.with).map(([k, v]) => [k, String(v)])) : {}, dir: s?.['working-directory'] ?? ''}));
        }
      }
      entry.displayPattern = entry.name != null ? namePattern(entry.name) : null;
      entry.defaultName = entry.run ? `Run ${entry.run.trim().split(/\r?\n/)[0]}` : entry.uses ? `Run ${entry.uses}` : null;
      steps.push(entry);
    }
    jobs.push({id, display, pattern: full, literal: literalLength(display) + (caller ? 100 : 0), runsOn, services: Boolean(job.services), container: Boolean(job.container),
      matrixKeys: matrix && typeof matrix === 'object' ? Object.keys(matrix).filter(k => k !== 'include' && k !== 'exclude') : [],
      matrix: matrix && typeof matrix === 'object' ? matrix : null, steps});
  }
  return jobs;
}
export {matrixValues};

// ---- Workspaces -----------------------------------------------------------
// The packages of a tree: {dir, name, deps: [names]} for a Node workspace
// (package.json workspaces, pnpm-workspace.yaml, lerna.json) or a Python one
// ([tool.uv.workspace] members, or several pyproject.toml projects).
// `read(path)` gives a tracked file's text.
export function workspacePackages(paths, read) {
  const pathSet = new Set(paths);
  const globsOf = () => {
    const globs = [];
    const root = safeJson(read('package.json'));
    const ws = root?.workspaces;
    if (Array.isArray(ws)) globs.push(...ws); else if (Array.isArray(ws?.packages)) globs.push(...ws.packages);
    if (pathSet.has('pnpm-workspace.yaml')) { const doc = parseYaml(read('pnpm-workspace.yaml') || ''); if (Array.isArray(doc?.packages)) globs.push(...doc.packages); }
    if (pathSet.has('lerna.json')) { const doc = safeJson(read('lerna.json')); if (Array.isArray(doc?.packages)) globs.push(...doc.packages); }
    return globs.filter(g => typeof g === 'string');
  };
  const node = globsOf();
  const packages = [];
  if (node.length) {
    const include = node.filter(g => !g.startsWith('!')).map(g => g.replace(/^\.\//, '').replace(/\/$/, ''));
    const exclude = node.filter(g => g.startsWith('!')).map(g => g.slice(1).replace(/^\.\//, '').replace(/\/$/, ''));
    const isIn = picomatch(include, {dot: false}), isOut = exclude.length ? picomatch(exclude) : () => false;
    for (const p of paths) {
      if (!p.endsWith('/package.json') || p.includes('node_modules/')) continue;
      const dir = p.slice(0, -'/package.json'.length);
      if (!isIn(dir) || isOut(dir)) continue;
      const json = safeJson(read(p));
      if (!json) continue;
      const deps = Object.keys({...json.dependencies, ...json.devDependencies, ...json.peerDependencies, ...json.optionalDependencies});
      packages.push({dir, name: json.name || dir, deps, scripts: json.scripts && typeof json.scripts === 'object' ? Object.keys(json.scripts) : []});
    }
    return {kind: 'node', packages: linkDeps(packages)};
  }
  const rootToml = pathSet.has('pyproject.toml') ? read('pyproject.toml') || '' : '';
  const members = tomlArray(tomlTable(rootToml, 'tool.uv.workspace'), 'members');
  const excluded = tomlArray(tomlTable(rootToml, 'tool.uv.workspace'), 'exclude');
  let dirs;
  if (members.length) {
    const isIn = picomatch(members.map(g => g.replace(/^\.\//, '').replace(/\/$/, ''))), isOut = excluded.length ? picomatch(excluded.map(g => g.replace(/^\.\//, '').replace(/\/$/, ''))) : () => false;
    dirs = paths.filter(p => p.endsWith('/pyproject.toml')).map(p => p.slice(0, -'/pyproject.toml'.length)).filter(d => isIn(d) && !isOut(d));
  } else {
    dirs = paths.filter(p => p.endsWith('/pyproject.toml') && p.split('/').length <= 5 && !/(^|\/)(tests?|testing|fixtures?|examples?|docs?|templates?|cookbook|benchmarks?|scripts)\//.test(p))
      .map(p => p.slice(0, -'/pyproject.toml'.length));
    if (dirs.length < 3) return {kind: null, packages: []};
  }
  for (const dir of dirs) {
    const text = read(`${dir}/pyproject.toml`) || '';
    const name = normalizePy(tomlString(tomlTable(text, 'project'), 'name') || tomlString(tomlTable(text, 'tool.poetry'), 'name') || dir);
    const depStrings = [...tomlStrings(tomlTable(text, 'project'), 'dependencies'), ...tomlAllStrings(tomlTable(text, 'project.optional-dependencies')),
      ...tomlAllStrings(tomlTable(text, 'dependency-groups'))].map(s => normalizePy(s.split(/[\s<>=!~;[(@]/)[0]));
    const poetry = [...tomlKeys(tomlTable(text, 'tool.poetry.dependencies')), ...tomlKeys(tomlTable(text, 'tool.poetry.group.dev.dependencies')), ...tomlKeys(tomlTable(text, 'tool.poetry.group.test.dependencies'))].map(normalizePy);
    const pathDeps = [...text.matchAll(/path\s*=\s*"([^"]+)"/g)].map(m => joinDir(dir, m[1]));
    packages.push({dir, name, deps: [...new Set([...depStrings, ...poetry])], pathDeps, scripts: []});
  }
  return {kind: 'python', packages: linkDeps(packages)};
}
function linkDeps(packages) {
  const byName = new Map(packages.map(p => [p.name, p])), byDir = new Map(packages.map(p => [p.dir, p]));
  for (const p of packages) p.links = [...new Set([...p.deps.filter(d => byName.has(d) && d !== p.name), ...(p.pathDeps || []).map(d => byDir.get(d)?.name).filter(Boolean)])];
  return packages.map(({dir, name, links, scripts}) => ({dir, name, links, scripts}));
}
const safeJson = text => { try { return JSON.parse(text); } catch { return null; } };
export const normalizePy = name => String(name).toLowerCase().replace(/[-_.]+/g, '-');
// A small TOML reader: enough for names, dependency arrays and tables.
function tomlTable(text, table) {
  const out = [];
  let on = table === '';
  for (const line of String(text).split(/\r?\n/)) {
    const header = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(#.*)?$/);
    if (header) { on = header[1].replace(/"/g, '') === table; continue; }
    if (on) out.push(line);
  }
  return out.join('\n');
}
function tomlValue(body, key) {
  const m = body.match(new RegExp(`^\\s*"?${escapeRe(key)}"?\\s*=\\s*`, 'm'));
  if (!m) return null;
  const rest = body.slice(m.index + m[0].length);
  if (rest[0] !== '[') return rest.split(/\r?\n/)[0];
  let depth = 0, inString = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (inString) { if (c === inString && rest[i - 1] !== '\\') inString = null; continue; }
    if (c === '"' || c === "'") inString = c;
    else if (c === '#') { const nl = rest.indexOf('\n', i); if (nl < 0) break; i = nl; }
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return rest.slice(0, i + 1);
  }
  return rest;
}
const quoted = text => [...String(text ?? '').matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'/g)].map(m => m[1] ?? m[2]);
const tomlArray = (body, key) => quoted(tomlValue(body, key));
const tomlStrings = tomlArray;
const tomlString = (body, key) => quoted(tomlValue(body, key))[0] ?? null;
const tomlAllStrings = body => quoted(body.split(/\r?\n/).filter(l => !/^\s*#/.test(l)).map(l => l.replace(/^\s*[\w.-]+\s*=\s*/, '')).join('\n'));
const tomlKeys = body => body.split(/\r?\n/).map(l => l.match(/^\s*"?([A-Za-z0-9_.-]+)"?\s*=/)?.[1]).filter(Boolean).filter(k => k !== 'python');
