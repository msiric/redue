#!/usr/bin/env node
// The verification-gap study's PreToolUse hook for Bash (run.mjs --gap):
// records the working tree each command runs on, as a git tree object, and
// appends {id, tree, ms} to LOG. The checkout's index does not change. It
// prints nothing, so Claude Code goes on as if there were no hook.
//
//   node eval/tree-hook.mjs LOG CHECKOUT    (Claude Code passes the call on stdin)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {entryPoint} from './lib.mjs';
entryPoint(import.meta);

const [log, root] = process.argv.slice(2), started = Date.now();
let id = null;
try { id = JSON.parse(fs.readFileSync(0, 'utf8')).tool_use_id ?? null; } catch {}
const index = path.join(root, '.git', `redue-eval-hook-index-${process.pid}`);
const env = {...process.env, GIT_INDEX_FILE: index};
let tree = null;
// Start from the checkout's index so git can reuse its stat cache.
try { fs.copyFileSync(path.join(root, '.git', 'index'), index); } catch {}
if (spawnSync('git', ['add', '-A'], {cwd: root, env}).status === 0)
  tree = spawnSync('git', ['write-tree'], {cwd: root, env, encoding: 'utf8'}).stdout.trim() || null;
fs.rmSync(index, {force: true});
fs.appendFileSync(log, JSON.stringify({id, tree, ms: Date.now() - started}) + '\n');
