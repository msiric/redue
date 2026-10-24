#!/usr/bin/env node
// node eval/group-run.mjs TIMEOUT_MS CMD [ARGS...]
//
// Runs CMD in its own process group and copies its output. On timeout it sends
// SIGTERM to the whole group, SIGKILL 10 s later, and exits 124. It exits when
// CMD exits, not when its output pipes close, so a grandchild that keeps them
// open cannot hold up the harness (what kept census shards running to the
// 5-hour job limit).
import {spawn} from 'node:child_process';

const [timeoutArg, cmd, ...args] = process.argv.slice(2);
const timeout = Number(timeoutArg);
const child = spawn(cmd, args, {stdio: ['inherit', 'pipe', 'pipe'], detached: true});
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
let timedOut = false;
const group = signal => { try { process.kill(-child.pid, signal); } catch {} };
const timer = setTimeout(() => {
  timedOut = true;
  process.stderr.write(`\ngroup-run: timed out after ${timeout} ms; stopping the process group\n`);
  group('SIGTERM');
  setTimeout(() => { group('SIGKILL'); finish(124); }, 10_000).unref();
}, timeout);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { group(signal); setTimeout(() => { group('SIGKILL'); process.exit(130); }, 10_000).unref(); });
child.on('error', error => { process.stderr.write(`group-run: ${error.message}\n`); finish(127); });
child.on('exit', (code, signal) => {
  clearTimeout(timer);
  // Whatever the group still runs is stopped with it.
  if (!timedOut) group('SIGKILL');
  finish(timedOut ? 124 : code ?? 128 + (signal === 'SIGKILL' ? 9 : 15));
});
let done = false, ended = 0;
for (const stream of [child.stdout, child.stderr]) stream.on('end', () => ended++);
function finish(code) {
  if (done) return; done = true;
  // Output CMD wrote is copied; pipes a grandchild still holds are waited for
  // 2 s at most.
  const started = Date.now();
  const exit = () => ended === 2 || Date.now() - started > 2000 ?
    process.stdout.write('', () => process.stderr.write('', () => process.exit(code))) : setTimeout(exit, 50);
  exit();
}
