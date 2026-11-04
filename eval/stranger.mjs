#!/usr/bin/env node
// Stranger test: can someone set up REDUE from the README alone? For each
// named repo, a fresh headless Claude Code session gets a copy of README.md
// and a fresh clone of a project it has not seen, with no REDUE installed,
// and is asked to set REDUE up for Claude Code by following the README. The
// harness records the time, every shell command, failed tool calls, the
// session's own report, and what was set up at the end, then uninstalls
// REDUE before the next repo.
//
// With --follow-up, a second fresh session in the same clone then makes a
// small docs edit and checks that the project still typechecks and its tests
// pass, without being told about REDUE: each of its commands is classed as
// skipped by REDUE's hook, run through REDUE, asked of REDUE, or run plainly.
// Each command the hook skipped is then run plainly on the files the session
// left; a skip whose plain run fails is critical. With --source-change, the
// same session is then asked to make a small source change and check again,
// and its skips are checked the same way.
//
// Each Bash command's time comes from the transcript's timestamps. At the end
// each check in redue.config.json runs plainly twice, timed.
//
//   node eval/stranger.mjs owner/name [owner/name ...] [--npm] [--follow-up [--source-change]] [--out DIR] [--model M]
//
// REDUE is installed from a tarball of this checkout (npm pack): the README
// copy names that tarball in its install command, the one line that differs
// from what a stranger reads. With --npm, the README is unchanged and REDUE
// comes from npm as it says.
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {claudeSession, harnessEnv, localDir, must, redactDir, repoRoot, sessionAuth, sh, slug, stamp, tmpRoot, entryPoint} from './lib.mjs';
entryPoint(import.meta, {ci: true});

const {values: opt, positionals: names} = parseArgs({allowPositionals: true, options: {
  out: {type: 'string'}, model: {type: 'string', default: 'claude-sonnet-5-5'}, 'max-turns': {type: 'string', default: '80'},
  npm: {type: 'boolean'}, 'follow-up': {type: 'boolean'}, 'source-change': {type: 'boolean'}}});
if (!names.length) { console.error('name at least one owner/name repo'); process.exit(2); }
const out = path.resolve(opt.out ?? path.join(localDir, `stranger-${stamp()}`));
fs.mkdirSync(out, {recursive: true});
const work = path.join(tmpRoot, 'stranger');
fs.rmSync(work, {recursive: true, force: true}); fs.mkdirSync(work, {recursive: true});

// The README, naming the tarball unless REDUE comes from npm.
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
const install = 'npm install --global @redue/cli@alpha';
if (!readme.includes(install)) { console.error(`README.md does not contain "${install}"`); process.exit(2); }
const readmeCopy = path.join(work, 'README.md');
if (opt.npm) fs.writeFileSync(readmeCopy, readme);
else {
  const packed = JSON.parse(must(sh('npm', ['pack', '--json', '--pack-destination', work], {cwd: repoRoot}), 'npm pack').stdout)[0];
  fs.writeFileSync(readmeCopy, readme.replaceAll(install, `npm install --global ${path.join(work, packed.filename)}`));
}

// No REDUE anywhere on PATH before the session installs it.
const env = harnessEnv();
env.PATH = (env.PATH || '').split(path.delimiter).filter(dir => dir && !fs.existsSync(path.join(dir, 'redue'))).join(path.delimiter);
const tools = 'Bash,Read,Edit,Write,Glob,Grep';
const prompt = `You found a tool called REDUE and want to try it with Claude Code on the project in your current directory.
Its README is at ${readmeCopy}. Use only that README for anything about REDUE: do not read REDUE's source code,
its package contents or other documentation, and do not search the web. The project's dependencies may not be installed yet.
Follow the README to set REDUE up for this project, as far as the README takes you.
When you are done, or stuck, end with a short report: the steps you took, what worked, where the README was unclear,
wrong or missing something, and the output of \`redue status\` if you got that far.`;

const followUp = `In this project, add one harmless line at the end of README.md (for example a short note).
Then make sure the project still typechecks and that its tests still pass, using the project's usual scripts.
End with a short report: each command you ran, and what it did.`;
const sourceChange = `Now make one small, safe change to the project's source code (not its tests or docs), for example a clearer
docstring or error message in one module. Then make sure again that the project still typechecks and that its tests still pass,
using the project's usual scripts. End with a short report: each command you ran, and what it did.`;
const text = content => String(Array.isArray(content) ? content.map(item => item.text ?? '').join('') : content ?? '');

// One headless session: its time, commands, failed calls and report.
async function session(prompt, dir, runDir, name, {keep = false, resume = null} = {}) {
  // Every hook decision, with the hook's reason (REDUE_HOOK_LOG).
  const hookLog = path.join(runDir, `${name}-hooks.jsonl`);
  fs.rmSync(hookLog, {force: true});
  const run = await claudeSession(['-p', prompt, '--model', opt.model, '--max-turns', opt['max-turns'],
    '--output-format', 'stream-json', '--verbose', ...keep ? [] : ['--no-session-persistence'], ...resume ? ['--resume', resume] : [],
    '--setting-sources', 'project,local', '--settings', JSON.stringify({autoMemoryEnabled: false}),
    '--strict-mcp-config', '--mcp-config', JSON.stringify({mcpServers: {}}),
    '--tools', tools, '--allowedTools', tools, '--permission-mode', 'dontAsk'],
  {cwd: dir, env: {...env, ...sessionAuth(), REDUE_HOOK_LOG: hookLog}, timeout: 40 * 60_000});
  fs.writeFileSync(path.join(runDir, `${name}.jsonl`), run.stdout);
  const messages = run.stdout.split('\n').flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const calls = new Map(), results = new Map(), started = new Map(), took = new Map(),
    out = {ms: run.ms, exit: run.status, signal: run.signal, commands: [], failed: []};
  for (const message of messages) for (const part of message.message?.content ?? []) {
    if (part.type === 'tool_use') {
      calls.set(part.id, part); started.set(part.id, Date.parse(message.timestamp));
      if (part.name === 'Bash') out.commands.push(part.input?.command);
    }
    if (part.type === 'tool_result') {
      results.set(part.tool_use_id, part);
      const ms = Date.parse(message.timestamp) - started.get(part.tool_use_id);
      if (Number.isFinite(ms)) took.set(part.tool_use_id, ms);
      if (part.is_error) { const call = calls.get(part.tool_use_id);
        out.failed.push({tool: call?.name, input: call?.name === 'Bash' ? call.input?.command : call?.input?.file_path ?? null, output: text(part.content).slice(0, 600)}); }
    }
  }
  const result = messages.findLast(message => message.type === 'result');
  let hooks = [];
  try { hooks = fs.readFileSync(hookLog, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch {}
  // Each Bash command with its output and time, from the transcript's timestamps.
  out.bash = [...calls.values()].filter(call => call.name === 'Bash').map(call => ({command: call.input?.command, ms: took.get(call.id) ?? null,
    error: results.get(call.id)?.is_error ?? null, output: text(results.get(call.id)?.content)}));
  Object.assign(out, {turns: result?.num_turns ?? null, report: result?.result ?? null, cost_usd: result?.total_cost_usd ?? null, calls, results,
    session_id: result?.session_id ?? null,
    hooks: hooks.map(({command, decision, why, ms}) => ({command, decision, why, ms}))});
  return out;
}

// One follow-up turn: how each command went, REDUE's status after it, and each
// command the hook skipped run plainly on the files the turn left (it edits
// before it checks): a skip whose plain run fails is critical.
function turn(next, dir) {
  const row = {ms: next.ms, turns: next.turns, cost_usd: next.cost_usd, report: next.report, failed: next.failed, hooks: next.hooks,
    commands: next.bash.map(({command, ms, error, output}) => {
      const outcome = error && /REDUE/.test(output) ? 'skipped by REDUE' :
        /\brecorded\./.test(output) ? 'run through REDUE' : /^\s*redue\s+(status|explain|detail)\b/.test(command ?? '') ? 'asked REDUE' :
        error ? 'failed' : 'plain';
      return {command, outcome, ms, output: output.slice(-400)};
    })};
  try { row.status = JSON.parse(sh('redue', ['status', '--sync', '--json'], {cwd: dir, env}).stdout).checks.map(c => ({name: c.name, freshness: c.freshness, result: c.result, reason: c.reason})); } catch {}
  row.skip_checks = row.commands.filter(c => c.outcome === 'skipped by REDUE').map(({command}) => {
    const plain = sh('bash', ['-o', 'pipefail', '-c', command], {cwd: dir, env, timeout: 900_000});
    return {command, plain_exit: plain.status, ms: plain.ms, ...plain.status === 0 ? {} : {tail: (plain.stdout + plain.stderr).slice(-1500)}};
  });
  row.critical = row.skip_checks.filter(c => c.plain_exit !== 0).map(c => `skipped "${c.command}" but it fails when run plainly`);
  return row;
}

// Each check in redue.config.json run plainly twice, timed. Commands that
// start with an @ placeholder are left out.
function plainChecks(dir) {
  let checks = [];
  try { checks = JSON.parse(fs.readFileSync(path.join(dir, 'redue.config.json'), 'utf8')).checks ?? []; } catch { return null; }
  return checks.filter(c => Array.isArray(c.command) && !String(c.command[0]).startsWith('@')).map(c => {
    const runs = [0, 1].map(() => sh(c.command[0], c.command.slice(1), {cwd: path.join(dir, c.cwd ?? '.'), env, timeout: 900_000}));
    return {name: c.name, command: c.command, ms: runs.map(r => r.ms), exit: runs.map(r => r.status),
      ...runs[1].status === 0 ? {} : {tail: (runs[1].stdout + runs[1].stderr).slice(-1500)}};
  });
}

const results = [];
for (const name of names) {
  const id = slug(name), dir = path.join(work, id), runDir = path.join(out, id);
  fs.mkdirSync(runDir, {recursive: true});
  const row = {repo: name};
  try {
    must(sh('git', ['clone', '-q', '--depth', '1', `https://github.com/${name}.git`, dir]), `clone ${name}`);
    row.commit = sh('git', ['rev-parse', 'HEAD'], {cwd: dir}).stdout.trim();
    const setup = await session(prompt, dir, runDir, 'setup');
    const {calls, results: outputs} = setup;
    Object.assign(row, {ms: setup.ms, exit: setup.exit, signal: setup.signal, commands: setup.commands, failed: setup.failed, hooks: setup.hooks,
      turns: setup.turns, report: setup.report, cost_usd: setup.cost_usd});
    // What the session itself last saw from redue status, in its own environment.
    const statusCall = [...calls.values()].filter(call => call.name === 'Bash' && /\bredue status\b/.test(call.input?.command ?? '')).at(-1);
    row.session_status = statusCall && outputs.has(statusCall.id) ? text(outputs.get(statusCall.id).content).slice(-1500) : null;
    // Every setup or init command the session ran, with its time and output.
    row.init = setup.bash.filter(b => /\bredue\s+(setup|init)\b/.test(b.command ?? ''))
      .map(b => ({command: b.command, ms: b.ms, error: b.error, output: b.output.slice(-4000)}));
    row.command_ms = setup.bash.map(b => ({command: String(b.command).slice(0, 200), ms: b.ms}));
    // What was set up, asked of the REDUE the session installed. The harness
    // environment differs from the session's, so freshness here can differ.
    const redue = (...args) => sh('redue', args, {cwd: dir, env});
    row.installed = sh('sh', ['-c', 'command -v redue'], {env}).stdout.trim() || null;
    row.files = Object.fromEntries(['redue.config.json', '.claude/settings.local.json', 'CLAUDE.md']
      .map(file => [file, fs.existsSync(path.join(dir, file))]));
    // redue setup's record, one per checkout in the Git directory.
    row.files.setupRecord = fs.readdirSync(path.join(dir, '.git')).some(file => /^redue-setup-[0-9a-f]{16}\.json$/.test(file));
    if (row.installed) {
      row.version = redue('--version').stdout.trim();
      try { row.status = JSON.parse(redue('status', '--sync', '--json').stdout).checks.map(c => ({name: c.name, freshness: c.freshness, result: c.result, reason: c.reason})); } catch {}
      try { const doctor = JSON.parse(redue('agent', 'doctor', 'claude', '--json').stdout); row.hook = doctor.hosts?.[0]?.hook ?? null; } catch {}
    }
    // A second session, which knows nothing about REDUE beyond what setup
    // put in the project, edits docs and runs the checks.
    if (opt['follow-up'] && row.installed) {
      const first = await session(followUp, dir, runDir, 'follow-up', {keep: opt['source-change']});
      row.follow_up = turn(first, dir);
      if (opt['source-change'] && first.session_id)
        row.source_change = turn(await session(sourceChange, dir, runDir, 'source-change', {keep: true, resume: first.session_id}), dir);
    }
    if (row.installed) row.plain = plainChecks(dir);
    if (row.installed) redue('stop');
  } catch (error) { row.error = String(error.message).slice(0, 1500); }
  // The next session starts without REDUE again.
  sh('npm', ['uninstall', '--global', '@redue/cli'], {env});
  results.push(row);
  console.error(`${name}: ${row.error ? 'harness error' : `${Math.round((row.ms ?? 0) / 1000)} s, ${row.commands?.length ?? 0} commands, ${row.failed?.length ?? 0} failed calls`}`);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
}
redactDir(out);
console.log(JSON.stringify(results.map(r => ({repo: r.repo, s: Math.round((r.ms ?? 0) / 1000), commands: r.commands?.length, failed: r.failed?.length,
  status: r.status?.map(c => `${c.name}:${c.freshness}`).join(' '), hook: r.hook,
  follow_up: r.follow_up?.commands.map(c => c.outcome).join(', '), source_change: r.source_change?.commands.map(c => c.outcome).join(', '),
  critical: [...r.follow_up?.critical ?? [], ...r.source_change?.critical ?? []], error: r.error})), null, 1));
