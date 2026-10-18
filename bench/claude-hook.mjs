#!/usr/bin/env node
// Scripted check of the Claude Code typecheck hook on a bench project
// (create one with bench/setup.mjs). It installs the hook, records a PASS, then
// feeds PreToolUse input to `redue agent hook claude`, the command Claude Code runs:
// the hook must deny after a doc-only edit and allow after a source edit.
//
//   node bench/claude-hook.mjs <bench-dir>
//
// Prints a HOOK_RESULT JSON line and exits 1 if any decision is wrong. Removes
// the agent integration and restores the edited files afterwards.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cleanEnv} from './env.mjs';

const dir = path.resolve(process.argv[2] || '');
const redue = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/redue.mjs');
if (!fs.existsSync(path.join(dir, 'redue.config.json'))) {
  console.error('usage: node bench/claude-hook.mjs <bench-dir>  (create one with bench/setup.mjs)'); process.exit(2);
}
if (fs.existsSync(path.join(dir, '.redue/agents/claude.json'))) {
  console.error('claude agent integration already set up here; remove it first'); process.exit(2);
}
const env = cleanEnv();
const failures = [], decisions = [];
const cli = (...argv) => {
  const out = spawnSync(process.execPath, [redue, ...argv], {cwd: dir, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (out.status !== 0) failures.push(`redue ${argv.join(' ')}: exit ${out.status}: ${(out.stderr || '').slice(-400)}`);
  return out;
};
function decide(label, command, wanted) {
  const started = performance.now();
  const out = spawnSync(process.execPath, [redue, 'agent', 'hook', 'claude'], {cwd: dir, env, encoding: 'utf8',
    input: JSON.stringify({hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command}, cwd: dir})});
  const ms = Math.round(performance.now() - started);
  let got = `exit ${out.status}`;
  if (out.status === 0) try { got = out.stdout ? JSON.parse(out.stdout).hookSpecificOutput.permissionDecision : 'allow'; } catch {}
  const ok = got === wanted;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${got} in ${ms} ms${ok ? '' : ` (expected ${wanted})`}`);
  if (got === 'deny') console.log(`       ${JSON.parse(out.stdout).hookSpecificOutput.permissionDecisionReason}`);
  if (!ok) failures.push(`${label}: got ${got}, expected ${wanted}`);
  const sync = cli('status', '--sync', '--json'), row = JSON.parse(sync.stdout || '{}').checks?.[0];
  decisions.push({label, command, decision: got, ms, status_after: `${row?.freshness}/${row?.result}: ${row?.reason}`});
}
const restore = () => execFileSync('git', ['checkout', '-q', '--', 'src/m3.ts', 'docs/notes.md'], {cwd: dir});

console.log(`Bench: ${dir}\nREDUE: ${redue}\n`);
cli('stop');
try {
  cli('agent', 'setup', 'claude', '--apply');
  const hooks = JSON.parse(fs.readFileSync(path.join(dir, '.claude/settings.local.json'), 'utf8')).hooks.PreToolUse;
  console.log(`Installed if rules: ${hooks.flatMap(group => group.hooks.map(h => h.if)).join(', ')}`);
  cli('start');
  const readyBy = Date.now() + 120000;
  while (Date.now() < readyBy) {
    try { const j = JSON.parse(cli('status', '--json').stdout); if (j.observation?.healthy && j.observation?.phase === 'ready') break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  cli('run', 'typecheck');
  decide('after PASS', 'npm run typecheck', 'deny');
  fs.appendFileSync(path.join(dir, 'docs/notes.md'), '\nDoc-only edit.\n');
  decide('after doc-only edit', 'npm run typecheck 2>&1 | tail -n 20', 'deny');
  decide('direct compiler form', 'npx tsc --noEmit', 'deny');
  decide('REDUE_FORCE=1', 'REDUE_FORCE=1 npm run typecheck', 'allow');
  fs.appendFileSync(path.join(dir, 'src/m3.ts'), '\nexport const hookEdit = 1;\n');
  decide('after source edit', 'npm run typecheck', 'allow');
} finally {
  try { restore(); } catch {}
  cli('stop');
  cli('agent', 'remove', 'claude', '--apply');
}
console.log(`\nHOOK_RESULT ${JSON.stringify({decisions, failures})}`);
if (failures.length) { console.error('\nFailures:\n  ' + failures.join('\n  ')); process.exitCode = 1; }
