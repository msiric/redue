#!/usr/bin/env node
// CI replay study, the report: joins ci-replay.mjs's keys with
// ci-replay-jobs.mjs's timings and counts the check runs, and the check
// job-minutes, that an earlier passing run of the same check with the same
// key could have answered. Earlier: its step finished before this job
// started. Same check: same workflow, same job display name (so the same OS
// and matrix values), same step. Allowed sources: for a pull request, its
// earlier runs and default-branch pushes; for a default-branch push, earlier
// pushes and the runs of the pull request it merged (from the commit
// message); for a merge-queue run, its pull request's runs, earlier queue
// runs of it, and default-branch pushes.
//
// A job whose every check is answered, that decides before installing
// dependencies and has no deploy-like step, saves its whole duration;
// otherwise the answered check steps save their own time (key c: a step over
// several packages saves its share of answered packages, assuming equal cost).
//
// Monorepos are the repos with 5 or more workspace packages.
//
//   node eval/ci-replay-report.mjs [--need NEEDED.json] [--json OUT.json] DIR...
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {entryPoint, readJson, slug} from './lib.mjs';
entryPoint(import.meta);

const argv = process.argv.slice(2);
const option = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const needOut = option('--need'), jsonOut = option('--json');
const gz = file => JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
const files = argv.flatMap(dir => fs.readdirSync(dir, {recursive: true}).map(String).filter(f => /replay-.*\.json\.gz$/.test(path.basename(f))).map(f => path.join(dir, f)));
const byRepo = new Map();
for (const file of files) {
  const data = gz(file), dir = path.dirname(file);
  const jobsFile = path.join(dir, `jobs-${slug(data.repo)}.json.gz`), imagesFile = path.join(dir, `images-${slug(data.repo)}.json`);
  if (!fs.existsSync(jobsFile)) { console.error(`${data.repo}: no jobs file; run ci-replay-jobs.mjs first`); continue; }
  byRepo.set(data.repo, {data, jobs: gz(jobsFile), images: fs.existsSync(imagesFile) ? readJson(imagesFile) : null});
}

const ms = (a, b) => a && b ? Math.max(0, Date.parse(b) - Date.parse(a)) : 0;
const synthetic = /^(Set up job|Complete job|Post .*|Initialize containers|Stop containers|Set up runner|Set up runner .*)$/;
const re = new Map();
const regex = pattern => { if (!re.has(pattern)) { try { re.set(pattern, new RegExp(`^${pattern}$`, 's')); } catch { re.set(pattern, /^$/); } } return re.get(pattern); };

// API steps for a workflow job's steps: by position when the counts agree,
// else by name in order.
function alignSteps(yamlSteps, apiSteps) {
  const real = apiSteps.filter(s => !synthetic.test(s.name));
  if (real.length === yamlSteps.length) return yamlSteps.map((_, i) => real[i]);
  const out = [];
  let from = 0;
  for (const step of yamlSteps) {
    let found = null;
    for (let i = from; i < real.length; i++) {
      const name = real[i].name;
      const hit = step.pattern != null ? regex(step.pattern).test(name) : step.defaultName ? name.startsWith(step.defaultName.slice(0, 40)) || step.defaultName.startsWith(name.slice(0, 40)) : false;
      if (hit) { found = real[i]; from = i + 1; break; }
    }
    out.push(found);
  }
  return out;
}

const keys = ['a', 'b', 'c'];
const units = [], allMs = {};
const stats = {apiJobs: 0, matchedJobs: 0, checkJobs: 0, checkSteps: 0, alignedSteps: 0, runsWithError: 0, runsNoJobs: 0, treeKinds: {}};
for (const [repo, {data, jobs, images}] of byRepo) {
  const parses = data.parses, trees = data.trees;
  // Branch lineages that belong to a pull request.
  const prOfBranch = new Map();
  for (const run of data.runs) if (run.prs?.[0]?.n) prOfBranch.set(`${run.headRepo}:${run.branch}`, run.prs[0].n);
  for (const run of data.runs) {
    if (run.error || !run.parse) { stats.runsWithError++; continue; }
    stats.treeKinds[run.treeKind] = (stats.treeKinds[run.treeKind] || 0) + 1;
    const parse = parses[run.parse], tree = trees[run.tree], apiJobs = jobs[run.id];
    if (!apiJobs?.length) { stats.runsNoJobs++; continue; }
    let situation, lineage;
    const pr = run.prs?.[0]?.n ?? prOfBranch.get(`${run.headRepo}:${run.branch}`) ?? null;
    if (run.event === 'push' && run.branch === data.main) { situation = 'main'; lineage = 'main'; }
    else if (run.event === 'merge_group') { situation = 'queue'; lineage = run.pr ? `pr:${run.pr}` : `queue:${run.branch}`; }
    else if (run.event === 'pull_request' || run.event === 'pull_request_target' || pr) { situation = 'pr'; lineage = pr ? `pr:${pr}` : `branch:${run.headRepo}:${run.branch}`; }
    else { situation = 'branch'; lineage = `branch:${run.headRepo}:${run.branch}`; }
    for (const job of apiJobs) {
      stats.apiJobs++;
      if (!['success', 'failure'].includes(job.conclusion)) continue;
      allMs[repo] = (allMs[repo] || 0) + ms(job.started, job.completed);
      const candidates = parse.jobs.filter(j => regex(j.pattern).test(job.name));
      if (!candidates.length) continue;
      stats.matchedJobs++;
      const yamlJob = candidates.sort((x, y) => y.literal - x.literal)[0];
      if (!yamlJob.checks) continue;
      stats.checkJobs++;
      const aligned = alignSteps(yamlJob.steps, job.steps);
      const jobUnits = [];
      for (const [i, step] of yamlJob.steps.entries()) {
        if (!step.kinds) continue;
        stats.checkSteps++;
        const api = aligned[i];
        if (!api || !['success', 'failure'].includes(api.conclusion)) continue;
        stats.alignedSteps++;
        let u = step.units;
        if (u && u.matrix) {
          const inside = job.name.match(/\(([^)]*)\)\s*$/)?.[1]?.split(',').map(s => s.trim()) ?? [];
          const value = Object.keys(u.values).find(v => inside.includes(v)) ?? Object.keys(u.values).find(v => job.name.includes(v));
          u = value !== undefined ? u.values[value] : 'root';
        }
        const parts = Array.isArray(u) && u.length && data.monorepo?.n ? u : null;
        const keyC = parts ? parts.map(name => `${name}:${tree.pkgKeys?.[name] ?? tree.keyB}`) : [`*:${tree.keyB}`];
        const label = step.name ?? step.defaultName ?? `#${step.index}`;
        jobUnits.push({repo, run: run.id, job: job.id, situation, lineage, pr: run.pr ?? pr, event: run.event,
          identity: `${run.workflow}|${job.name}|${label}`, kinds: step.kinds, byName: Boolean(step.byName), result: api.conclusion,
          stepMs: ms(api.started, api.completed), jobStarted: job.started, stepCompleted: api.completed, jobCompleted: job.completed,
          keyA: run.tree, keyB: tree.keyB, keyC, pre: step.pre, image: images ? images[job.id] ?? null : null, os: (job.labels || []).join(','),
          partsCount: keyC.length, scoped: parts ? 'packages' : u === 'affected' ? 'affected' : 'root'});
      }
      if (!jobUnits.length) continue;
      const jobMs = ms(job.started, job.completed), pure = !yamlJob.side;
      for (const unit of jobUnits) Object.assign(unit, {jobMs, pure, jobChecks: jobUnits.length});
      units.push(...jobUnits);
    }
  }
}

// Earlier passing runs of each check, by identity, oldest first.
const byIdentity = new Map();
for (const u of units) { if (!byIdentity.has(u.identity)) byIdentity.set(u.identity, []); byIdentity.get(u.identity).push(u); }
for (const list of byIdentity.values()) list.sort((x, y) => Date.parse(x.stepCompleted) - Date.parse(y.stepCompleted));
const allowed = (target, source) => {
  if (target.situation === 'pr') return source.lineage === target.lineage ? 'same-pr' : source.situation === 'main' ? 'main' : null;
  if (target.situation === 'main') return source.situation === 'main' ? 'main' : target.pr && source.lineage === `pr:${target.pr}` ? 'same-pr' : null;
  if (target.situation === 'queue') return source.lineage === target.lineage ? 'same-pr' : source.situation === 'main' ? 'main' : null;
  return source.lineage === target.lineage ? 'same-pr' : source.situation === 'main' ? 'main' : null;
};
const needed = {};
const need = (u) => { (needed[u.repo] ??= new Set()).add(u.job); };
// For each unit and key: the share of it an earlier source answers (0..1),
// where from, and with the runner image in the key.
for (const u of units) {
  u.reuse = {};
  const earlier = byIdentity.get(u.identity).filter(s => s !== u && s.result === 'success' && Date.parse(s.stepCompleted) <= Date.parse(u.jobStarted) && allowed(u, s));
  for (const key of keys) {
    for (const withImage of [false, true]) {
      const sameImage = s => !withImage || u.image && s.image && u.image === s.image;
      let answered = 0, from = new Set();
      if (key === 'c') {
        for (const part of u.keyC) {
          const s = earlier.find(s => s.keyC.includes(part) && sameImage(s));
          if (s) { answered++; from.add(allowed(u, s)); }
        }
        answered /= u.keyC.length;
      } else {
        const field = key === 'a' ? 'keyA' : 'keyB';
        const sources = earlier.filter(s => s[field] === u[field] && sameImage(s));
        if (sources.length) { answered = 1; from = new Set(sources.map(s => allowed(u, s))); }
        if (!withImage && sources.length && key !== 'a') { need(u); for (const s of sources.slice(-5)) need(s); }
      }
      if (!withImage && key === 'c' && answered > 0) {
        need(u);
        for (const part of u.keyC) for (const s of earlier.filter(s => s.keyC.includes(part)).slice(-3)) need(s);
      }
      u.reuse[`${key}${withImage ? '+img' : ''}`] = {share: answered, from: [...from]};
    }
  }
}
if (needOut) {
  fs.writeFileSync(needOut, JSON.stringify(Object.fromEntries(Object.entries(needed).map(([repo, set]) => [repo, [...set]]))));
  console.error(`wrote ${needOut}: ${Object.values(needed).reduce((n, s) => n + s.size, 0)} jobs`);
}

// Minutes: per job, the whole job when every check in it is answered, it
// decides before install and has no deploy-like step; else the steps' share.
function saved(list, variant) {
  const jobs = new Map();
  for (const u of list) { if (!jobs.has(u.job)) jobs.set(u.job, []); jobs.get(u.job).push(u); }
  let total = 0, save = 0, whole = 0;
  for (const group of jobs.values()) {
    const jobMs = group[0].jobMs;
    total += jobMs;
    const full = group.every(u => u.reuse[variant].share === 1);
    if (full && group[0].pure && group.every(u => u.pre?.ok) && group.length === group[0].jobChecks) { save += jobMs; whole += jobMs; }
    else save += Math.min(jobMs, group.reduce((n, u) => n + u.stepMs * u.reuse[variant].share, 0));
  }
  return {total, save, whole};
}
const pct = (a, b) => b ? `${(100 * a / b).toFixed(1)}%` : '-';
const minutes = x => (x / 60000).toFixed(0);
const variants = ['a', 'b', 'c', 'a+img', 'b+img', 'c+img'];
function summarize(list) {
  const out = {checkRuns: list.length, minutes: 0};
  for (const v of variants) {
    const full = list.filter(u => u.reuse[v].share === 1);
    const m = saved(list, v);
    out.minutes = m.total;
    out[v] = {runs: full.length, runShare: list.length ? full.length / list.length : 0, minutesSaved: m.save, minuteShare: m.total ? m.save / m.total : 0, wholeJobMinutes: m.whole,
      beforeInstall: full.filter(u => u.pre?.ok).length, failedButAnswered: full.filter(u => u.result === 'failure').length,
      fromSamePr: full.filter(u => u.reuse[v].from.includes('same-pr')).length, fromMainOnly: full.filter(u => !u.reuse[v].from.includes('same-pr') && u.reuse[v].from.includes('main')).length};
  }
  out.preInstallShare = list.length ? list.filter(u => u.pre?.ok).length / list.length : 0;
  out.byNameShare = list.length ? list.filter(u => u.byName).length / list.length : 0;
  return out;
}

const situations = ['pr', 'main', 'queue', 'branch'];
// A monorepo: 5 or more workspace packages at the default branch's head, as
// measured (the repo list's group is a guess made before).
const groups = {typical: [], monorepo: []};
for (const [repo, {data}] of byRepo) groups[(data.monorepo?.n ?? 0) >= 5 ? 'monorepo' : 'typical'].push(repo);
const report = {stats, groups: {}, repos: {}};
const lines = [];
const row = (label, s) => `| ${label} | ${s.checkRuns} | ${minutes(s.minutes)} | ${variants.map(v => `${pct(s[v].runs, s.checkRuns)} / ${pct(s[v].minutesSaved, s.minutes)}`).join(' | ')} |`;
const header = `| | check runs | job-min | ${variants.map(v => `key ${v} runs / min`).join(' | ')} |\n|---|---|---|${variants.map(() => '---').join('|')}|`;
lines.push(`Matching: ${stats.matchedJobs}/${stats.apiJobs} API jobs matched a workflow job; ${stats.checkJobs} check jobs; ${stats.alignedSteps}/${stats.checkSteps} check steps found in the API. Runs with errors ${stats.runsWithError}, without jobs ${stats.runsNoJobs}. Trees: ${JSON.stringify(stats.treeKinds)}`);
for (const [group, repos] of Object.entries(groups)) {
  const list = units.filter(u => repos.includes(u.repo));
  lines.push('', `## ${group} (${repos.length} repos)`, '', header, row('all', summarize(list)));
  report.groups[group] = {all: summarize(list)};
  for (const sit of situations) {
    const part = list.filter(u => u.situation === sit);
    if (!part.length) continue;
    report.groups[group][sit] = summarize(part);
    lines.push(row(sit, report.groups[group][sit]));
  }
  lines.push('', `Per repo (job-minute share, keys a / b / c, without image; with image for c):`, '', '| repo | packages | check runs | check job-min (share of all) | a | b | c | c+img | pre-install | before install (c) | failed but answered (b) | by step name |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const repo of repos) {
    const list2 = units.filter(u => u.repo === repo);
    const s = summarize(list2);
    report.repos[repo] = s;
    lines.push(`| ${repo} | ${byRepo.get(repo).data.monorepo?.n || 0} | ${s.checkRuns} | ${minutes(s.minutes)} (${pct(s.minutes, allMs[repo])}) | ${pct(s.a.minutesSaved, s.minutes)} | ${pct(s.b.minutesSaved, s.minutes)} | ${pct(s.c.minutesSaved, s.minutes)} | ${pct(s['c+img'].minutesSaved, s.minutes)} | ${pct(s.preInstallShare, 1)} | ${s.c.beforeInstall}/${s.c.runs} | ${s.b.failedButAnswered} | ${pct(s.byNameShare, 1)} |`);
  }
  const shares = repos.map(r => report.repos[r]).filter(s => s.checkRuns);
  const median = v => { const xs = shares.map(s => s[v].minuteShare).sort((x, y) => x - y); return xs.length ? xs[Math.floor((xs.length - 1) / 2)] : 0; };
  lines.push('', `Median repo job-minute share: ${variants.map(v => `${v} ${pct(median(v), 1)}`).join(', ')}`);
  report.groups[group].median = Object.fromEntries(variants.map(v => [v, median(v)]));
}
const issueCount = {};
for (const u of units) for (const issue of u.pre?.issues || []) issueCount[issue] = (issueCount[issue] || 0) + 1;
lines.push('', 'Why check runs could not be decided before install (check runs):', ...Object.entries(issueCount).sort((x, y) => y[1] - x[1]).map(([k, n]) => `- ${k}: ${n}`));
console.log(lines.join('\n'));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1));
