#!/usr/bin/env node
// CI replay study, the part that reads repositories: for each repo in
// ci-replay-repos.json, lists the last runs (up to --runs, created before the
// list's `before`) of the workflows that run a typecheck, lint or test, and at
// each run's commit computes the study's keys:
//   a. the exact git tree (for a pull_request run, the merge of its head into
//      the default branch as it stood when the run started);
//   b. that tree without the documentation sandbox-v3 hides (git-ignored
//      files are not in a fresh checkout; the lockfile is tracked);
//   c. per workspace package: its files, its workspace dependencies' files,
//      every file outside the packages (root config) and the lockfile.
// It also maps each workflow job's steps to checks, with the packages each
// runs on and whether it could be decided before dependencies install.
// Job timings come from the API afterwards (ci-replay-jobs.mjs), and
// ci-replay-report.mjs joins both. Nothing here runs a repository's code, but
// it clones public repositories, so like the other eval entry points that do,
// it runs on CI.
//
//   node eval/ci-replay.mjs [--shard i/n] [--runs 300] [owner/name ...]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';
import picomatch from 'picomatch';
import {entryPoint, evalDir, localDir, tmpRoot, readJson, slug} from './lib.mjs';
import {parseTree, docsOf, entriesKey, sha, parseYaml, workflowJobs, workflowTriggers, classifyRun, installIssues, actionIssues, sideEffect,
  workspacePackages, matrixValues} from './ci-replay-lib.mjs';
entryPoint(import.meta, {ci: true});

const argv = process.argv.slice(2);
const option = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const shard = option('--shard'), runLimit = Number(option('--runs') || 300);
const config = readJson(path.join(evalDir, 'ci-replay-repos.json'));
let repos = config.repos;
// Repo names; eval.yml's default args (--pilot) are not one.
const names = argv.filter(a => a.includes('/'));
if (names.length) repos = repos.filter(r => names.includes(r.name));
if (shard) { const [i, n] = shard.split('/').map(Number); repos = repos.filter((_, at) => at % n === i - 1); }
const before = config.before, events = new Set(['push', 'pull_request', 'pull_request_target', 'merge_group']);
const out = path.join(localDir, 'ci-replay');
fs.mkdirSync(out, {recursive: true});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function api(pathname) {
  for (let attempt = 0; ; attempt++) {
    let r;
    try {
      r = await fetch(`https://api.github.com/${pathname}`, {headers: {Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}});
    } catch (error) {
      if (attempt < 5) { console.log(`${pathname}: ${error.message} (${error.cause?.code ?? error.cause?.message}); retrying`); await sleep(5000 * (attempt + 1)); continue; }
      throw error;
    }
    if (r.ok) return r.json();
    if ((r.status === 403 || r.status === 429) && r.headers.get('x-ratelimit-remaining') === '0') {
      const wait = Number(r.headers.get('x-ratelimit-reset')) * 1000 - Date.now() + 5000;
      console.log(`rate limited; waiting ${Math.round(wait / 1000)} s`);
      await sleep(Math.max(wait, 5000)); continue;
    }
    if (attempt < 4 && (r.status >= 500 || r.status === 403 || r.status === 429)) { await sleep(5000 * (attempt + 1)); continue; }
    throw Error(`${pathname}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
}

function git(dir, args, {input, allow = false, encoding = 'utf8'} = {}) {
  const r = spawnSync('git', args, {cwd: dir, input: encoding === 'buffer' && input != null ? Buffer.from(input) : input, encoding: encoding === 'buffer' ? undefined : encoding, maxBuffer: 2 * 1024 * 1024 * 1024, timeout: 30 * 60_000,
    env: {...process.env, GIT_TERMINAL_PROMPT: '0'}});
  if (r.status !== 0 && !allow) throw Error(`git ${args.slice(0, 3).join(' ')}: ${String(r.stderr).slice(0, 300)}`);
  return r;
}

async function study(repo) {
  const started = Date.now();
  const meta = await api(`repos/${repo.name}`);
  const main = meta.default_branch;
  const dir = path.join(tmpRoot, 'ci-replay', slug(repo.name));
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(path.dirname(dir), {recursive: true});
  git(path.dirname(dir), ['clone', '-q', '--bare', '--filter=blob:limit=512k', '--single-branch', '--branch', main, `https://github.com/${repo.name}.git`, dir]);
  console.log(`${repo.name}: cloned in ${Math.round((Date.now() - started) / 1000)} s`);

  // Blob text by object id, cached; several at once through cat-file --batch.
  const blobCache = new Map();
  const loadBlobs = oids => {
    const missing = [...new Set(oids)].filter(oid => !blobCache.has(oid));
    for (let at = 0; at < missing.length; at += 2000) {
      const part = missing.slice(at, at + 2000);
      const r = git(dir, ['cat-file', '--batch'], {input: part.join('\n') + '\n', encoding: 'buffer', allow: true});
      const buf = r.stdout;
      let pos = 0;
      for (const oid of part) {
        const nl = buf.indexOf(10, pos);
        if (nl < 0) { blobCache.set(oid, null); continue; }
        const header = buf.subarray(pos, nl).toString();
        const [, type, size] = header.split(' ');
        if (!size || type === 'missing') { blobCache.set(oid, null); pos = nl + 1; continue; }
        const body = buf.subarray(nl + 1, nl + 1 + Number(size));
        blobCache.set(oid, type === 'blob' && Number(size) < 4 * 1024 * 1024 ? body.toString('utf8') : null);
        pos = nl + 1 + Number(size) + 1;
      }
    }
  };
  const blob = oid => { if (!blobCache.has(oid)) loadBlobs([oid]); return blobCache.get(oid); };

  // Trees: entries and keys, by tree id.
  const treeCache = new Map();
  const treeInfo = tree => {
    if (treeCache.has(tree)) return treeCache.get(tree);
    const entries = parseTree(git(dir, ['ls-tree', '-r', '-z', '--full-tree', tree]).stdout);
    const byPath = new Map(entries.map(e => [e.path, e]));
    const read = p => { const e = byPath.get(p); return e && e.mode !== '160000' && e.mode !== '120000' ? blob(e.oid) : null; };
    const docs = docsOf(entries);
    const kept = entries.filter(e => !docs.has(e.path));
    const pkgFiles = entries.filter(e => /(^|\/)(package\.json|pyproject\.toml)$/.test(e.path) && !e.path.includes('node_modules/'));
    loadBlobs(pkgFiles.map(e => e.oid));
    const ws = workspacePackages(entries.map(e => e.path), read);
    const packages = ws.packages.length >= 2 ? ws.packages : [];
    const pkgByDir = new Map(packages.map(p => [p.dir, p]));
    const own = new Map(packages.map(p => [p.name, []])), root = [];
    for (const e of kept) {
      let owner = null;
      for (let d = path.posix.dirname(e.path); d !== '.' && d !== ''; d = path.posix.dirname(d)) if (pkgByDir.has(d)) { owner = pkgByDir.get(d); break; }
      (owner ? own.get(owner.name) : root).push(e);
    }
    const ownKey = new Map([...own].map(([name, list]) => [name, entriesKey(list)]));
    const rootKey = entriesKey(root);
    const byName = new Map(packages.map(p => [p.name, p]));
    const closure = name => {
      const seen = new Set(), stack = [name];
      while (stack.length) { const n = stack.pop(); if (seen.has(n) || !byName.has(n)) continue; seen.add(n); stack.push(...byName.get(n).links); }
      return [...seen].sort();
    };
    const pkgKeys = Object.fromEntries(packages.map(p => [p.name, sha(rootKey + '\n' + closure(p.name).map(n => `${n} ${ownKey.get(n)}`).join('\n'))]));
    const info = {entries, byPath, read, kept, keyB: entriesKey(kept), docs: docs.size, ws: {kind: packages.length ? ws.kind : null, n: packages.length}, packages, byName, pkgByDir, pkgKeys, closure};
    treeCache.set(tree, info);
    // A large monorepo's listings do not all fit in memory: keep the last few.
    if (treeCache.size > 4) treeCache.delete(treeCache.keys().next().value);
    return info;
  };

  // A tree's workflow, as jobs with their check steps.
  const parseCache = new Map(), parses = {};
  const scriptsOf = info => d => {
    const text = info.read(d ? `${d}/package.json` : 'package.json');
    try { const s = JSON.parse(text)?.scripts; return s && typeof s === 'object' ? s : null; } catch { return null; }
  };
  const pinnedOf = info => p => {
    const text = info.read(p);
    if (text == null) return false;
    const lines = text.split(/\r?\n/).map(l => l.replace(/#.*$/, '').trim()).filter(l => l && !l.startsWith('-'));
    return lines.length > 0 && lines.every(l => /==/.test(l) || /^-r |^-c /.test(l));
  };
  const packageAt = (info, d) => {
    for (let at = d.replace(/\/$/, ''); at && at !== '.'; at = path.posix.dirname(at)) if (info.pkgByDir.has(at)) return info.pkgByDir.get(at).name;
    return null;
  };
  const resolveFilter = (info, filter) => {
    let f = String(filter).replace(/^["']|["']$/g, '');
    if (f.startsWith('!')) return [];
    const deps = f.endsWith('...'), dependents = f.startsWith('...');
    f = f.replace(/^\.\.\.\^?/, '').replace(/\^?\.\.\.$/, '').replace(/^\{(.*)\}$/, '$1');
    let picked = [];
    if (f.startsWith('./') || f.startsWith('{') || info.pkgByDir.has(f.replace(/^\.\//, '').replace(/\/$/, ''))) {
      const rel = f.replace(/^\.\//, '').replace(/\/$/, '');
      const isIn = picomatch(rel);
      picked = info.packages.filter(p => p.dir === rel || isIn(p.dir)).map(p => p.name);
    } else {
      const isIn = picomatch(f);
      picked = info.packages.filter(p => p.name === f || isIn(p.name) || p.name.endsWith('/' + f)).map(p => p.name);
    }
    if (deps) picked = [...new Set(picked.flatMap(n => info.closure(n)))];
    if (dependents) picked = [...new Set(picked.flatMap(n => info.packages.filter(p => info.closure(p.name).includes(n)).map(p => p.name)))];
    return picked;
  };
  // The packages one check finding runs on: 'root' (the whole tree),
  // 'affected', a list of package names, or {matrix, values}.
  const unitsOf = (info, job, finding) => {
    if (!info.packages.length) return 'root';
    const scope = finding.scope;
    if (!scope) return 'root';
    if (scope.affected) return 'affected';
    const matrixExpr = s => String(s).match(/\$\{\{\s*matrix\.([\w-]+)\s*\}\}/);
    const one = s => {
      if (s.all) {
        const having = info.packages.filter(p => p.scripts.includes(finding.target)).map(p => p.name);
        return having.length ? having : info.packages.map(p => p.name);
      }
      if (s.filters) { const picked = s.filters.flatMap(f => resolveFilter(info, f)); return picked.length ? [...new Set(picked)] : 'root'; }
      if (s.dir !== undefined) { const name = packageAt(info, s.dir); return name ? [name] : 'root'; }
      return 'root';
    };
    const text = JSON.stringify(scope), m = matrixExpr(text);
    if (m) {
      const values = matrixValues(job.matrix, m[1]);
      if (!values) return 'root';
      return {matrix: m[1], values: Object.fromEntries(values.map(v => [v, one(JSON.parse(text.replace(/\$\{\{\s*matrix\.[\w-]+\s*\}\}/g, v.replace(/"/g, ''))))]))};
    }
    return one(scope);
  };
  const actionKind = uses => {
    const name = String(uses).toLowerCase();
    if (/ruff-action|pre-commit\/action|super-linter|eslint|reviewdog|biome|oxlint|golangci|prettier-action|markdownlint|actionlint/.test(name)) return 'lint';
    if (/pyright-action|mypy/.test(name)) return 'typecheck';
    if (/cypress-io\/github-action/.test(name)) return 'test';
    return null;
  };
  const parse = (tree, wfPath) => {
    const cacheKey = `${tree}:${wfPath}`;
    if (parseCache.has(cacheKey)) return parseCache.get(cacheKey);
    const info = treeInfo(tree);
    const text = info.read(wfPath);
    const doc = text == null ? null : parseYaml(text);
    let result = null;
    if (doc) {
      const jobs = workflowJobs(doc, {read: info.read});
      const has = p => info.byPath.has(p), pinned = pinnedOf(info), scripts = scriptsOf(info);
      result = {triggers: workflowTriggers(doc), jobs: jobs.map(job => {
        let checks = 0;
        const steps = job.steps.map((step, at) => {
          const findings = [];
          if (step.run) findings.push(...classifyRun(step.run, {scripts, dir: step.dir}));
          for (const inner of step.composite || []) if (inner.run) findings.push(...classifyRun(inner.run, {scripts, dir: inner.dir || step.dir}));
          if (step.uses && actionKind(step.uses)) findings.push({kind: actionKind(step.uses), scope: null, target: step.uses});
          const base = {index: step.index, name: step.name, pattern: step.displayPattern, defaultName: step.defaultName?.slice(0, 200), side: sideEffect(step) || undefined};
          if (!findings.length) return base;
          checks++;
          const kinds = [...new Set(findings.map(f => f.kind))].sort();
          const each = findings.map(f => unitsOf(info, job, f));
          const units = each.includes('root') ? 'root' : each.find(u => u && u.matrix) || (each.includes('affected') ? 'affected' : [...new Set(each.flat())].sort());
          const issues = [], opaque = [], installs = [];
          const consider = (s, ownStep) => {
            if (s.run) { const r = installIssues(s.run, {has, pinned, dir: s.dir || ''}); issues.push(...r.issues); installs.push(...r.installs); }
            if (s.uses && !ownStep) { const r = actionIssues(s.uses, s.with, {has}); issues.push(...r.issues); installs.push(...r.installs); if (r.opaque) opaque.push(r.opaque); }
            for (const inner of s.composite || []) consider({...inner, dir: inner.dir || s.dir}, false);
          };
          for (const prior of job.steps.slice(0, at)) consider(prior, false);
          consider(step, true);
          return {...base, kinds, units, targets: [...new Set(findings.map(f => f.target))].slice(0, 6), pre: {ok: issues.length === 0, issues: [...new Set(issues)], opaque: [...new Set(opaque)], installs: [...new Set(installs)]}};
        });
        return {id: job.id, pattern: job.pattern, literal: job.literal, runsOn: job.runsOn, services: job.services || undefined, container: job.container || undefined,
          matrixKeys: job.matrixKeys, checks, steps: checks ? steps : undefined, side: checks ? steps.some(s => s.side) || undefined : undefined};
      })};
    }
    const id = result ? sha(JSON.stringify(result)) : null;
    if (id && !parses[id]) parses[id] = result;
    parseCache.set(cacheKey, id);
    return id;
  };

  // Workflows that run a check at the default branch's head, and their runs.
  const headTree = git(dir, ['rev-parse', `${main}^{tree}`]).stdout.trim();
  const workflows = (await api(`repos/${repo.name}/actions/workflows?per_page=100`)).workflows.filter(w => w.state === 'active' && w.path.startsWith('.github/workflows/'));
  // A workflow file gone from the head (renamed, removed) is read at its
  // latest run's commit.
  const kept = [];
  for (const w of workflows) {
    let id = parse(headTree, w.path);
    if (!id) {
      const last = (await api(`repos/${repo.name}/actions/workflows/${w.id}/runs?per_page=1&created=${encodeURIComponent('<=' + before)}`)).workflow_runs[0];
      if (last && (git(dir, ['cat-file', '-e', `${last.head_sha}^{commit}`], {allow: true}).status === 0 ||
        git(dir, ['fetch', '-q', '--filter=blob:limit=512k', 'origin', last.head_sha], {allow: true}).status === 0))
        id = parse(git(dir, ['rev-parse', `${last.head_sha}^{tree}`]).stdout.trim(), w.path);
    }
    const p = id && parses[id];
    if (p && p.jobs.some(j => j.checks > 0) && p.triggers.some(t => events.has(t))) kept.push(w);
  }
  console.log(`${repo.name}: ${kept.length} of ${workflows.length} workflows run checks: ${kept.map(w => w.path.split('/').pop()).join(', ')}`);
  let runs = [];
  for (const w of kept) {
    for (let page = 1; page <= Math.ceil(runLimit / 100); page++) {
      const list = (await api(`repos/${repo.name}/actions/workflows/${w.id}/runs?per_page=100&page=${page}&status=completed&created=${encodeURIComponent('<=' + before)}`)).workflow_runs;
      runs.push(...list.filter(r => events.has(r.event)));
      if (list.length < 100) break;
    }
  }
  runs.sort((x, y) => y.created_at.localeCompare(x.created_at));
  runs = runs.slice(0, runLimit).reverse();

  // The commits those runs ran: fetch the ones the clone lacks.
  const have = oid => git(dir, ['cat-file', '-e', `${oid}^{commit}`], {allow: true}).status === 0;
  const wanted = [...new Set(runs.map(r => r.head_sha))].filter(oid => !have(oid));
  const missing = new Set();
  for (let at = 0; at < wanted.length; at += 50) {
    const part = wanted.slice(at, at + 50);
    if (git(dir, ['fetch', '-q', '--filter=blob:limit=512k', 'origin', ...part], {allow: true}).status !== 0)
      for (const oid of part) if (git(dir, ['fetch', '-q', '--filter=blob:limit=512k', 'origin', oid], {allow: true}).status !== 0) missing.add(oid);
  }
  const history = git(dir, ['log', '--first-parent', '--format=%H %ct', main]).stdout.trim().split('\n').map(l => { const [h, t] = l.split(' '); return {h, t: Number(t)}; });
  const baseAt = iso => { const t = Date.parse(iso) / 1000; return history.find(c => c.t <= t)?.h ?? null; };
  const prOf = oid => {
    const text = git(dir, ['log', '-1', '--format=%s%n%b', oid], {allow: true}).stdout || '';
    return Number(text.match(/\(#(\d+)\)\s*$/m)?.[1] || text.match(/Merge pull request #(\d+)/)?.[1]) || null;
  };

  console.log(`${repo.name}: ${runs.length} runs listed, ${wanted.length - missing.size} commits fetched, ${missing.size} not fetchable, ${Math.round((Date.now() - started) / 1000)} s`);
  const rows = [], trees = {};
  for (const [n, r] of runs.entries()) {
    if (n % 50 === 49) console.log(`${repo.name}: ${n + 1} runs keyed, ${Math.round((Date.now() - started) / 1000)} s`);
    const row = {id: r.id, workflow: r.path, event: r.event, branch: r.head_branch, headRepo: r.head_repository?.full_name ?? null,
      prs: (r.pull_requests || []).map(p => ({n: p.number, base: p.base?.ref})), created: r.created_at, started: r.run_started_at, attempt: r.run_attempt,
      conclusion: r.conclusion, sha: r.head_sha};
    try {
      if (missing.has(r.head_sha)) { row.error = 'commit not fetchable'; rows.push(row); continue; }
      let tree, treeKind = 'head';
      const headTreeOf = git(dir, ['rev-parse', `${r.head_sha}^{tree}`]).stdout.trim();
      if (r.event === 'pull_request') {
        const baseRef = row.prs[0]?.base ?? main;
        const base = baseRef === main ? baseAt(r.run_started_at || r.created_at) : null;
        if (!base) { tree = headTreeOf; treeKind = 'head-other-base'; }
        else {
          const m = git(dir, ['merge-tree', '--write-tree', '--no-messages', base, r.head_sha], {allow: true});
          if (m.status === 0) { tree = m.stdout.trim().split('\n')[0]; treeKind = 'merge'; row.base = base; }
          else { tree = headTreeOf; treeKind = 'head-conflict'; }
        }
      } else tree = headTreeOf;
      if (r.event === 'pull_request_target') treeKind = 'target-head';
      if (r.event === 'push' && r.head_branch === main) row.pr = prOf(r.head_sha);
      if (r.event === 'merge_group') row.pr = Number(String(r.head_branch).match(/pr-(\d+)-/)?.[1]) || null;
      row.tree = tree; row.treeKind = treeKind;
      const info = treeInfo(tree);
      if (!trees[tree]) trees[tree] = {keyB: info.keyB, docs: info.docs, ws: info.ws, pkgKeys: info.pkgKeys};
      row.parse = parse(tree, r.path);
    } catch (error) { row.error = String(error.message).slice(0, 300); }
    rows.push(row);
  }
  const monorepo = treeInfo(headTree).ws;
  const result = {repo: repo.name, group: repo.group, size: repo.size, lang: repo.lang, agents: repo.agents || false, main, before, monorepo,
    workflows: kept.map(w => ({id: w.id, path: w.path, name: w.name})), runs: rows, trees, parses, seconds: Math.round((Date.now() - started) / 1000)};
  fs.writeFileSync(path.join(out, `replay-${slug(repo.name)}.json.gz`), zlib.gzipSync(JSON.stringify(result)));
  const errors = rows.filter(r => r.error).length;
  console.log(`${repo.name}: ${rows.length} runs, ${Object.keys(trees).length} trees, ${Object.keys(parses).length} workflow versions, ${errors} errors, packages ${monorepo.n}, ${result.seconds} s`);
  fs.rmSync(dir, {recursive: true, force: true});
}

for (const repo of repos) {
  try { await study(repo); } catch (error) {
    console.log(`${repo.name}: failed: ${error.stack}`);
    fs.writeFileSync(path.join(out, `replay-${slug(repo.name)}.error.txt`), String(error.stack));
  }
}
