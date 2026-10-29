#!/usr/bin/env node
// Research: can a check be sandboxed from inside Claude Code's own sandbox?
// Runs each sandbox's smallest command plainly and under Claude Code's
// sandbox runtime (`srt`, @anthropic-ai/sandbox-runtime, its default
// settings), and writes .local/eval/sandbox-nesting-<platform>.json.
//
//   node eval/sandbox-nesting.mjs        # on a CI runner (eval.yml, shard 1)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {evalDir, localDir, sh} from './lib.mjs';

const landlock = path.join(evalDir, 'sandbox', 'landlock.py');
const srtVersion = '0.0.81';
const prefix = fs.mkdtempSync(path.join(os.tmpdir(), 'srt-'));
const installed = sh('npm', ['install', '--prefix', prefix, `@anthropic-ai/sandbox-runtime@${srtVersion}`, '--no-audit', '--no-fund'], {timeout: 300_000});
const srt = path.join(prefix, 'node_modules', '.bin', 'srt');
const probes = process.platform === 'darwin' ? {
  seatbelt: ['sandbox-exec', '-p', '(version 1)(allow default)', '/usr/bin/true'],
  'seatbelt deny': ['sandbox-exec', '-p', '(version 1)(allow default)(deny file-read* (subpath "/Users"))', '/bin/ls', os.homedir()],
} : {
  'landlock probe': ['python3', landlock, '--probe'],
  landlock: ['python3', landlock, '--read', '/', '--no-tcp', '--', '/bin/true'],
  'landlock deny': ['python3', landlock, '--read', '/usr', '--read', '/lib', '--read', '/lib64', '--read', '/bin', '--', '/bin/ls', os.homedir()],
  bwrap: ['bwrap', '--ro-bind', '/', '/', '--unshare-net', '--dev', '/dev', '/bin/true'],
  strace: ['strace', '-f', '-qq', '-o', '/dev/null', '/bin/true'],
  'strace seccomp-bpf': ['strace', '--seccomp-bpf', '-f', '-qq', '-o', '/dev/null', '-e', 'trace=openat', '/bin/true'],
};
const result = {platform: process.platform, release: os.release(), srt: srtVersion, install: installed.status, plain: {}, inSrt: {}};
for (const [name, argv] of Object.entries(probes)) {
  const short = r => ({status: r.status, out: (r.stdout + r.stderr).trim().slice(-300)});
  result.plain[name] = short(sh(argv[0], argv.slice(1), {timeout: 60_000}));
  result.inSrt[name] = short(sh(srt, ['--', ...argv], {timeout: 60_000}));
}
fs.mkdirSync(localDir, {recursive: true});
fs.writeFileSync(path.join(localDir, `sandbox-nesting-${process.platform}.json`), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify(result, null, 1));
