// Writes the `redue` command a REDUE-arm session finds on PATH. It runs the
// real CLI and appends one JSON line per call to the run's log. For the Claude
// hook it records the decision; on a deny it also snapshots the working tree
// (a git tree object, nothing in the checkout changes) so the skipped check
// can be verified afterwards.
import fs from 'node:fs';
import path from 'node:path';

const body = (entry, log) => `#!${process.execPath}
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {spawnSync} = require('node:child_process');
const entry = ${JSON.stringify(entry)}, log = ${JSON.stringify(log)};
const argv = process.argv.slice(2), started = Date.now(), cwd = process.cwd();
const write = row => fs.appendFileSync(log, JSON.stringify({at: started, ms: Date.now() - started, cwd, argv, ...row}) + '\\n');
if (argv.join(' ') === 'agent hook claude') {
  const input = fs.readFileSync(0, 'utf8');
  const out = spawnSync(process.execPath, [entry, ...argv], {input, encoding: 'utf8'});
  process.stdout.write(out.stdout || '');
  const hookMs = Date.now() - started;
  let command = null, root = cwd, hook = null;
  try { const parsed = JSON.parse(input); command = parsed.tool_input?.command ?? null; root = parsed.cwd || cwd; } catch {}
  try { hook = out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : null; } catch {}
  const decision = !hook ? 'allow' : hook.updatedInput ? 'rewrite' : hook.permissionDecision;
  let tree = null;
  if (decision === 'deny') {
    const index = path.join(os.tmpdir(), 'redue-eval-index-' + process.pid);
    const env = {...process.env, GIT_INDEX_FILE: index};
    // Start from the checkout's index so git can reuse its stat cache.
    try { fs.copyFileSync(path.join(root, '.git', 'index'), index); } catch {}
    if (spawnSync('git', ['add', '-A'], {cwd: root, env}).status === 0)
      tree = spawnSync('git', ['write-tree'], {cwd: root, env, encoding: 'utf8'}).stdout.trim() || null;
    fs.rmSync(index, {force: true});
  }
  write({kind: 'hook', hook_ms: hookMs, command, decision, rewritten: hook?.updatedInput?.command ?? null, reason: hook?.permissionDecisionReason ?? null, tree, exit: out.status});
  process.exit(out.status ?? 1);
}
const out = spawnSync(process.execPath, [entry, ...argv], {stdio: 'inherit'});
write({kind: 'cli', exit: out.status});
process.exit(out.status ?? 1);
`;

export function writeWrapper(binDir, entry, log) {
  fs.mkdirSync(binDir, {recursive: true});
  const file = path.join(binDir, 'redue');
  fs.writeFileSync(file, body(entry, log), {mode: 0o755});
  return file;
}
