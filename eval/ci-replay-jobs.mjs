#!/usr/bin/env node
// CI replay study: the job and step timings of the runs ci-replay.mjs listed,
// from the GitHub API, and with --images the runner image each listed job ran
// on (from the first lines of its log). Reads only API data, so it runs
// anywhere with GH_TOKEN. Writes jobs-REPO.json.gz (images-REPO.json) next to
// each replay-REPO.json.gz, and skips repos it already has.
//
//   node eval/ci-replay-jobs.mjs DIR...
//   node eval/ci-replay-jobs.mjs --images NEEDED.json DIR...   (NEEDED: {repo: [job ids]})
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {entryPoint, readJson, slug} from './lib.mjs';
entryPoint(import.meta);

const argv = process.argv.slice(2);
const at = argv.indexOf('--images');
const needed = at >= 0 ? readJson(argv.splice(at, 2)[1]) : null;
const token = process.env.GH_TOKEN;
if (!token) { console.error('GH_TOKEN is not set'); process.exit(2); }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let remaining = 5000, reset = 0;
async function get(url, {raw = false, headers = {}} = {}) {
  for (let attempt = 0; ; attempt++) {
    if (remaining < 30 && reset * 1000 > Date.now()) { console.log(`rate limit: waiting ${Math.round((reset * 1000 - Date.now()) / 1000)} s`); await sleep(reset * 1000 - Date.now() + 3000); remaining = 5000; }
    let r;
    try {
      r = await fetch(url.startsWith('http') ? url : `https://api.github.com/${url}`, {redirect: raw ? 'manual' : 'follow',
        headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...headers}});
    } catch (error) { if (attempt < 5) { await sleep(3000 * (attempt + 1)); continue; } throw error; }
    if (r.headers.get('x-ratelimit-remaining')) { remaining = Number(r.headers.get('x-ratelimit-remaining')); reset = Number(r.headers.get('x-ratelimit-reset')); }
    if (raw && r.status === 302) return r.headers.get('location');
    if (r.ok) return raw ? null : r.json();
    if (r.status === 404 || r.status === 410) return null;
    if ((r.status === 403 || r.status === 429) && remaining === 0) continue;
    if (attempt < 5) { await sleep(3000 * (attempt + 1)); continue; }
    throw Error(`${url}: ${r.status}`);
  }
}
async function pool(items, size, work) {
  let next = 0;
  await Promise.all(Array.from({length: size}, async () => { while (next < items.length) { const i = next++; await work(items[i], i); } }));
}
const files = argv.flatMap(dir => fs.readdirSync(dir, {recursive: true}).map(String).filter(f => /replay-.*\.json\.gz$/.test(path.basename(f))).map(f => path.join(dir, f)));

for (const file of files) {
  const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
  const dir = path.dirname(file);
  if (needed) {
    const ids = needed[data.repo] || [];
    const target = path.join(dir, `images-${slug(data.repo)}.json`);
    const images = fs.existsSync(target) ? readJson(target) : {};
    const todo = ids.filter(id => !(id in images));
    await pool(todo, 6, async id => {
      const location = await get(`repos/${data.repo}/actions/jobs/${id}/logs`, {raw: true});
      if (!location) { images[id] = null; return; }
      try {
        const r = await fetch(location, {headers: {Range: 'bytes=0-12000'}});
        const text = await r.text();
        const image = text.match(/Image: (\S+)/)?.[1], version = text.match(/Version: (\S+)/)?.[1];
        images[id] = image || version ? `${image} ${version}` : /self-hosted|Runner name: '(?!GitHub Actions)/i.test(text) ? 'self-hosted' : 'unknown';
      } catch { images[id] = null; }
    });
    fs.writeFileSync(target, JSON.stringify(images));
    console.log(`${data.repo}: ${todo.length} images fetched, ${remaining} API calls left`);
    continue;
  }
  const target = path.join(dir, `jobs-${slug(data.repo)}.json.gz`);
  if (fs.existsSync(target)) { console.log(`${data.repo}: have it`); continue; }
  const jobs = {};
  await pool(data.runs, 8, async run => {
    const list = [];
    for (let page = 1; page <= 5; page++) {
      const r = await get(`repos/${data.repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100&page=${page}`);
      if (!r) break;
      list.push(...r.jobs);
      if (r.jobs.length < 100) break;
    }
    jobs[run.id] = list.map(j => ({id: j.id, name: j.name, conclusion: j.conclusion, started: j.started_at, completed: j.completed_at, labels: j.labels,
      runner: j.runner_name, group: j.runner_group_name, attempt: j.run_attempt,
      steps: (j.steps || []).map(s => ({n: s.number, name: s.name, conclusion: s.conclusion, started: s.started_at, completed: s.completed_at}))}));
  });
  fs.writeFileSync(target, zlib.gzipSync(JSON.stringify(jobs)));
  console.log(`${data.repo}: jobs for ${Object.keys(jobs).length} runs, ${remaining} API calls left`);
}
