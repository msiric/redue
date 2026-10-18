#!/usr/bin/env node
// Checks whether public repos qualify for the eval: single-package npm,
// reviewed TypeScript installed, a direct-TypeScript typecheck REDUE can make
// CURRENT, plain tsc passing, and how long tsc and the tests take.
//
//   node eval/screen.mjs                      # repos in eval/repos.json
//   node eval/screen.mjs owner/name[@commit] ...
//
// Without a commit it uses the newest commit whose package-lock.json pins a
// reviewed TypeScript. Prints a table and writes .local/eval/screen-*.json.
import fs from 'node:fs';
import path from 'node:path';
import {checkoutRedue, evalDir, freshClone, installedTypeScript, localDir, mirror, plainTsc, readJson,
  redue, reviewedTypeScript, sh, slug, stamp, tmpRoot, checkStatus, waitReady} from './lib.mjs';

const args = process.argv.slice(2);
const repos = args.length ? args.map(arg => {
  const [name, commit] = arg.split('@');
  return {name, url: `https://github.com/${name}.git`, commit};
}) : readJson(path.join(evalDir, 'repos.json')).repos;

function lockTypeScript(dir, rev) {
  const r = sh('git', ['show', `${rev}:package-lock.json`], {cwd: dir});
  try { return JSON.parse(r.stdout).packages?.['node_modules/typescript']?.version ?? null; } catch { return null; }
}

// Newest first-parent commit whose lockfile pins a reviewed TypeScript: the
// commit just before the lockfile next changed. Looks at 80 lockfile changes.
function pickCommit(dir) {
  const head = sh('git', ['rev-parse', 'origin/HEAD'], {cwd: dir}).stdout.trim();
  const revs = sh('git', ['log', '--first-parent', '-n', '80', '--format=%H', 'origin/HEAD', '--', 'package-lock.json'], {cwd: dir}).stdout.trim().split('\n');
  const i = revs.findIndex(rev => reviewedTypeScript.includes(lockTypeScript(dir, rev)));
  if (i < 0) return null;
  return i === 0 ? head : sh('git', ['rev-parse', `${revs[i - 1]}~1`], {cwd: dir}).stdout.trim();
}

function screen(repo) {
  const row = {name: repo.name, url: repo.url, commit: repo.commit ?? null, qualified: false, reasons: []};
  try { return screenInto(repo, row); } catch (error) { row.reasons.push(error.message.split('\n')[0]); return row; }
}

function screenInto(repo, row) {
  const fail = reason => { row.reasons.push(reason); return row; };
  const source = mirror(repo);
  row.commit ??= pickCommit(source);
  if (!row.commit) return fail('no recent commit pins a reviewed TypeScript');
  row.commit_date = sh('git', ['show', '-s', '--format=%cs', row.commit], {cwd: source}).stdout.trim();
  const dir = path.join(tmpRoot, 'screen', slug(repo.name));
  try { freshClone(repo, row.commit, dir); } catch (error) {
    const lines = error.message.split('\n');
    return fail([lines[0], lines.find(l => /npm error (?!code|\s*$)/.test(l))].filter(Boolean).join(': '));
  }
  const pkg = readJson(path.join(dir, 'package.json'));
  if (pkg.workspaces) return fail('npm workspaces');
  row.typescript = installedTypeScript(dir);
  if (!reviewedTypeScript.includes(row.typescript)) return fail(`TypeScript ${row.typescript} is not reviewed`);
  row.ts_files = sh('git', ['ls-files', '*.ts', '*.tsx', '*.mts', '*.cts'], {cwd: dir}).stdout.split('\n').filter(Boolean).length;

  const first = plainTsc(dir), second = plainTsc(dir);
  row.tsc_ms = [first.ms, second.ms];
  if (!second.pass) return fail(`plain tsc fails: ${second.output.split('\n').find(Boolean)}`);

  const init = redue(checkoutRedue, dir, 'init', '--recipe', 'typescript-direct', '--check', 'typecheck', '--json');
  let check;
  try { check = JSON.parse(init.stdout).checks?.find(c => c.name === 'typecheck'); } catch {}
  row.script = check?.script ? `${check.script}: ${pkg.scripts?.[check.script]}` : null;
  if (init.status !== 0 || check?.level !== 'ready') return fail(`init: ${check?.reason || (init.stderr || init.stdout).slice(-300)}`);
  try {
    redue(checkoutRedue, dir, 'start');
    row.index_ms = waitReady(checkoutRedue, dir);
    const run = redue(checkoutRedue, dir, 'run', 'typecheck');
    row.redue_run_ms = run.ms;
    const status = checkStatus(checkoutRedue, dir);
    row.status = `${status.freshness}/${status.result}`;
    if (status.freshness !== 'CURRENT' || status.result !== 'PASS' || status.reuse_eligible !== true)
      return fail(`after redue run: ${row.status}: ${status.reason || status.error}`);
  } finally { redue(checkoutRedue, dir, 'remove-state'); }

  if (pkg.scripts?.test) {
    const test = sh('npm', ['test', '--silent'], {cwd: dir, timeout: 180_000});
    row.test = {pass: test.status === 0, ms: test.ms, timed_out: test.signal === 'SIGTERM'};
  }
  row.qualified = true;
  return row;
}

const rows = [];
for (const repo of repos) {
  process.stderr.write(`screening ${repo.name} ...\n`);
  rows.push(screen(repo));
  const r = rows.at(-1);
  console.log([r.qualified ? 'OK  ' : 'NO  ', r.name, r.commit?.slice(0, 10) ?? '-', r.commit_date ?? '-', `ts ${r.typescript ?? '-'}`,
    `files ${r.ts_files ?? '-'}`, `tsc ${r.tsc_ms?.join('/') ?? '-'} ms`, r.status ?? '',
    r.test ? `test ${r.test.pass ? 'pass' : r.test.timed_out ? 'timeout' : 'fail'} ${r.test.ms} ms` : 'no test',
    r.index_ms ? `index ${r.index_ms} ms` : '', r.script ?? '', r.reasons.join('; ')].join('  '));
}
fs.mkdirSync(localDir, {recursive: true});
const file = path.join(localDir, `screen-${stamp()}.json`);
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
console.log(`\nwrote ${file}`);
