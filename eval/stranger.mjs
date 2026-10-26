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
//
//   node eval/stranger.mjs owner/name [owner/name ...] [--npm] [--follow-up] [--out DIR] [--model M]
//
// REDUE is installed from a tarball of this checkout (npm pack): the README
// copy names that tarball in its install command, the one line that differs
// from what a stranger reads. With --npm, the README is unchanged and REDUE
// comes from npm as it says.
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {claudeSession, harnessEnv, localDir, must, redactDir, repoRoot, sessionAuth, sh, slug, stamp, tmpRoot} from './lib.mjs';

const {values: opt, positionals: names} = parseArgs({allowPositionals: true, options: {
  out: {type: 'string'}, model: {type: 'string', default: 'claude-sonnet-5-5'}, 'max-turns': {type: 'string', default: '80'},
  npm: {type: 'boolean'}, 'follow-up': {type: 'boolean'}}});
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
const text = content => String(Array.isArray(content) ? content.map(item => item.text ?? '').join('') : content ?? '');

// One headless session: its time, commands, failed calls and report.
async function session(prompt, dir, runDir, name) {
  const run = await claudeSession(['-p', prompt, '--model', opt.model, '--max-turns', opt['max-turns'],
    '--output-format', 'stream-json', '--verbose', '--no-session-persistence',
    '--setting-sources', 'project,local', '--settings', JSON.stringify({autoMemoryEnabled: false}),
    '--strict-mcp-config', '--mcp-config', JSON.stringify({mcpServers: {}}),
    '--tools', tools, '--allowedTools', tools, '--permission-mode', 'dontAsk'],
  {cwd: dir, env: {...env, ...sessionAuth()}, timeout: 40 * 60_000});
  fs.writeFileSync(path.join(runDir, `${name}.jsonl`), run.stdout);
  const messages = run.stdout.split('\n').flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const calls = new Map(), results = new Map(), out = {ms: run.ms, exit: run.status, signal: run.signal, commands: [], failed: []};
  for (const message of messages) for (const part of message.message?.content ?? []) {
    if (part.type === 'tool_use') { calls.set(part.id, part); if (part.name === 'Bash') out.commands.push(part.input?.command); }
    if (part.type === 'tool_result') {
      results.set(part.tool_use_id, part);
      if (part.is_error) { const call = calls.get(part.tool_use_id);
        out.failed.push({tool: call?.name, input: call?.name === 'Bash' ? call.input?.command : call?.input?.file_path ?? null, output: text(part.content).slice(0, 600)}); }
    }
  }
  const result = messages.findLast(message => message.type === 'result');
  Object.assign(out, {turns: result?.num_turns ?? null, report: result?.result ?? null, cost_usd: result?.total_cost_usd ?? null, calls, results});
  return out;
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
    Object.assign(row, {ms: setup.ms, exit: setup.exit, signal: setup.signal, commands: setup.commands, failed: setup.failed,
      turns: setup.turns, report: setup.report, cost_usd: setup.cost_usd});
    // What the session itself last saw from redue status, in its own environment.
    const statusCall = [...calls.values()].filter(call => call.name === 'Bash' && /\bredue status\b/.test(call.input?.command ?? '')).at(-1);
    row.session_status = statusCall && outputs.has(statusCall.id) ? text(outputs.get(statusCall.id).content).slice(-1500) : null;
    // What was set up, asked of the REDUE the session installed. The harness
    // environment differs from the session's, so freshness here can differ.
    const redue = (...args) => sh('redue', args, {cwd: dir, env});
    row.installed = sh('sh', ['-c', 'command -v redue'], {env}).stdout.trim() || null;
    row.files = Object.fromEntries(['redue.config.json', '.claude/settings.local.json', 'CLAUDE.md']
      .map(file => [file, fs.existsSync(path.join(dir, file))]));
    // redue setup's record, one per checkout in the Git directory.
    row.files.setupRecord = fs.readdirSync(path.join(dir, '.git')).some(file => /^redue-setup-[0-9a-f]{16}\.json$/.test(file));
    if (row.installed) {
      try { row.status = JSON.parse(redue('status', '--sync', '--json').stdout).checks.map(c => ({name: c.name, freshness: c.freshness, result: c.result, reason: c.reason})); } catch {}
      try { const doctor = JSON.parse(redue('agent', 'doctor', 'claude', '--json').stdout); row.hook = doctor.hosts?.[0]?.hook ?? null; } catch {}
    }
    // A second session, which knows nothing about REDUE beyond what setup
    // put in the project, edits docs and runs the checks.
    if (opt['follow-up'] && row.installed) {
      const next = await session(followUp, dir, runDir, 'follow-up');
      row.follow_up = {ms: next.ms, turns: next.turns, cost_usd: next.cost_usd, report: next.report, failed: next.failed,
        commands: next.commands.map((command, i) => {
          const call = [...next.calls.values()].filter(part => part.name === 'Bash')[i], result = call && next.results.get(call.id);
          const output = text(result?.content);
          const outcome = result?.is_error && /REDUE/.test(output) ? 'skipped by REDUE' :
            /\brecorded\./.test(output) ? 'run through REDUE' : /^\s*redue\s+(status|explain|detail)\b/.test(command ?? '') ? 'asked REDUE' :
            result?.is_error ? 'failed' : 'plain';
          return {command, outcome, output: output.slice(-400)};
        })};
      try { row.follow_up.status = JSON.parse(redue('status', '--sync', '--json').stdout).checks.map(c => ({name: c.name, freshness: c.freshness, result: c.result})); } catch {}
    }
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
  follow_up: r.follow_up?.commands.map(c => c.outcome).join(', '), error: r.error})), null, 1));
