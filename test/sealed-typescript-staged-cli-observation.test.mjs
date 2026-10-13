// One explicitly selected ENGINEERING compiler observation, never native-agent
// acceptance, origin capture, a PASS receipt or portable eligibility. No process
// or stage access when the actual observation is not selected.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';

const guard = value => { if (!value) throw Error('STAGED_CLI_PREREQUISITE_UNAVAILABLE'); };
const sha = value => createHash('sha256').update(value).digest('hex');
const fingerprint = stat => ['dev', 'ino', 'mode', 'uid', 'gid', 'nlink', 'size', 'mtimeNs', 'ctimeNs']
  .map(key => String(stat[key])).join(':');
const identity = stat => ['dev', 'ino', 'mode', 'uid', 'gid'].map(key => String(stat[key])).join(':');

// Injection is only for deterministic harness controls; it establishes no real
// compiler/native execution. The real test below supplies the actual operations.
export async function observeStagedCompilerCli({
  environment, cwd, uid, filesystem, selectProfile, spawn, now, uuid, diagnostic
}) {
  let begun;
  try { begun = now(); } catch { begun = NaN; }
  let last = begun, clockUnavailable = !Number.isFinite(begun), budgetExceeded = false, totalElapsedMs = null;
  const tick = () => {
    let at;
    try { at = now(); } catch { clockUnavailable = true; totalElapsedMs = null; throw Error('STAGED_CLI_CLOCK_UNAVAILABLE'); }
    if (!Number.isFinite(at) || !Number.isFinite(begun) || at < last || !Number.isFinite(at - begun)) {
      clockUnavailable = true; totalElapsedMs = null;
    } else {
      last = at;
      if (!clockUnavailable) totalElapsedMs = at - begun;
      if (totalElapsedMs >= 30000) budgetExceeded = true;
    }
    // Both failures latch: a later normal sample cannot repair an invalid clock
    // or resurrect an observation after its total deadline was exceeded.
    guard(!clockUnavailable && !budgetExceeded);
    return at;
  };
  const remaining = () => {
    tick();
    const n = 30000 - totalElapsedMs;
    guard(n >= 1);
    return Math.floor(n);
  };
  let completed = false, recordVerified = false;
  const report = {schema: 1, scope: 'ENGINEERING_STAGED_COMPILER_CLI_ONLY', result: 'UNKNOWN',
    processResult: 'UNKNOWN', resultScope: 'HISTORICAL_PROCESS_OUTCOME_ONLY',
    status: null, signal: null, processObserved: false, processReaped: false,
    compilerInvocationAttempts: 0, compilerVerificationExecutions: 0,
    nativeLaunches: 0, models: 0, receiptWrites: 0, environmentUnchanged: true,
    sealed: false, reuseEligible: false};
  const local = path.resolve(cwd, '.local/portable-evidence');
  const directory = () => {
    // Check the RAW selector before resolving it or selecting any compiler.
    const stat = filesystem.lstatSync(local, {bigint: true});
    guard(Number.isInteger(uid) && stat.isDirectory() && !stat.isSymbolicLink() &&
      stat.uid === BigInt(uid) && (stat.mode & 0o22n) === 0n && filesystem.realpathSync(local) === local);
    guard(fingerprint(filesystem.lstatSync(local, {bigint: true})) === fingerprint(stat));
    return stat;
  };
  try {
    remaining();
    // Reject rather than strip auth/preloads before supplying a real environment
    // to this engineering-only command. No environment value is published.
    guard(!Object.keys(environment).some(key => /TOKEN|PASSWORD|SECRET|CREDENTIAL|API_KEY|AUTH_KEY|PRIVATE_KEY/i.test(key) ||
      /^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$/i.test(key) ||
      /^(?:DYLD_|LD_|OPENSSL_|CLAUDE_|ANTHROPIC_)/i.test(key)));
    const selector = directory();
    const root = environment.REDUE_OWNED_STAGED_TREE;
    guard(typeof root === 'string' && filesystem.realpathSync(root) === root &&
      path.dirname(path.dirname(root)) === local &&
      /^sealed-debugger-parent-ephemeral-[A-Za-z0-9]{6}$/.test(path.basename(path.dirname(root))) &&
      /^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(root)));
    remaining();
    const proposal = await selectProfile({root, script: 'test:types'});
    guard(proposal.sealed === false && proposal.reuseEligible === false && proposal.nativeAgentEnforcement === 'NOT_TESTED' &&
      proposal.command.length === 3 && proposal.command[0] === proposal.node &&
      proposal.command[1] === root + '/node_modules/typescript/lib/tsc.js' && proposal.command[2] === '--noEmit');
    const before = JSON.stringify(proposal);
    remaining();
    guard(fingerprint(directory()) === fingerprint(selector));
    const started = tick();
    const args = ['-p', proposal.profile, ...proposal.command];
    const options = {cwd: root, env: environment, stdio: ['ignore', 'pipe', 'pipe'],
      timeout: remaining(), killSignal: 'SIGKILL', maxBuffer: 1024 * 1024};
    let child;
    // Options/deadline have succeeded: even a synchronous spawn throw is an
    // attempted invocation, without asserting a process existed or was reaped.
    report.compilerInvocationAttempts++;
    try {
      child = spawn('/usr/bin/sandbox-exec', args, options);
    } finally {
      try { report.commandElapsedMs = tick() - started; } catch { report.commandElapsedMs = null; }
    }
    report.status = Number.isInteger(child.status) ? child.status : null;
    report.signal = child.signal === null ? null :
      ['SIGKILL', 'SIGTERM', 'SIGABRT', 'SIGSEGV', 'SIGBUS', 'SIGILL'].includes(child.signal) ? child.signal : 'UNKNOWN';
    report.processObserved = Number.isInteger(child.pid) && child.pid > 0;
    report.processReaped = report.processObserved &&
      (Number.isInteger(child.status) || report.signal !== null && report.signal !== 'UNKNOWN');
    if (!child.error && report.processReaped && report.signal === null && Number.isInteger(child.status))
      report.processResult = child.status === 0 ? 'PASS' : 'PROCESS_EXIT_NONZERO';
    remaining();
    report.stdoutBytes = Buffer.isBuffer(child.stdout) ? child.stdout.length : 0;
    report.stderrBytes = Buffer.isBuffer(child.stderr) ? child.stderr.length : 0;
    report.profileSha256 = proposal.profileSha256;
    report.compilerSha256 = proposal.compiler.digest;
    report.nodeSha256 = proposal.nodeSha256;
    report.command = ['@node', '@stage/node_modules/typescript/lib/tsc.js', '--noEmit'];
    // This is a quiescent engineering currentness check, not an atomic input seal.
    remaining();
    guard(before === JSON.stringify(await selectProfile({root, script: 'test:types'})));
    remaining();
    guard(!child.error && report.processReaped && report.signal === null && Number.isInteger(child.status));
    report.result = child.status === 0 ? 'PASS' : 'PROCESS_EXIT_NONZERO';
    report.compilerVerificationExecutions = child.status === 0 ? 1 : 0;
    completed = child.status === 0;
  } catch { /* Preserve only observed outcome/counters; no source/error/env text. */ }
  // Saved bytes are a historical snapshot, never a final total-budget claim.
  // Persistence/publication cannot be timed in a record already written once.
  report.elapsedMs = clockUnavailable ? null : totalElapsedMs;
  report.elapsedMsScope = 'PRE_PERSISTENCE_SNAPSHOT';
  report.observationStatus = 'PENDING_PERSISTENCE_AND_FINAL_BUDGET_CHECK';
  report.observationCompleted = false;
  report.recordVerified = false;
  try {
    remaining();
    const parentBefore = directory();
    const file = path.join(local, 'staged-cli-observation-' + uuid() + '.json');
    const body = Buffer.from(JSON.stringify(report) + '\n');
    guard(body.length <= 65536 && filesystem.constants.O_NOFOLLOW !== undefined &&
      filesystem.constants.O_NONBLOCK !== undefined);
    remaining();
    filesystem.writeFileSync(file, body, {mode: 0o600, flag: 'wx'});
    remaining();
    const parent = directory();
    // Creating our record changes directory timestamps/size; ownership and
    // identity must persist, then full parent metadata stays fixed for readback.
    guard(identity(parent) === identity(parentBefore));
    const regular = stat => stat.isFile() && !stat.isSymbolicLink() && stat.uid === BigInt(uid) &&
      stat.nlink === 1n && (stat.mode & 0o7777n) === 0o600n && stat.size === BigInt(body.length);
    const named = filesystem.lstatSync(file, {bigint: true});
    guard(regular(named) && filesystem.realpathSync(file) === file);
    remaining();
    const fd = filesystem.openSync(file, filesystem.constants.O_RDONLY |
      filesystem.constants.O_NOFOLLOW | filesystem.constants.O_NONBLOCK);
    try {
      remaining();
      const opened = filesystem.fstatSync(fd, {bigint: true});
      guard(regular(opened) && fingerprint(opened) === fingerprint(named));
      const read = Buffer.alloc(body.length + 1);
      let count = 0;
      while (count < read.length) {
        remaining();
        const n = filesystem.readSync(fd, read, count, read.length - count, count);
        remaining();
        guard(Number.isInteger(n) && n >= 0 && n <= read.length - count);
        if (n === 0) break;
        count += n;
      }
      guard(count === body.length && read.subarray(0, count).equals(body));
      guard(fingerprint(filesystem.fstatSync(fd, {bigint: true})) === fingerprint(opened));
      remaining();
    } finally {
      filesystem.closeSync(fd);
    }
    remaining();
    guard(fingerprint(filesystem.lstatSync(file, {bigint: true})) === fingerprint(named) &&
      fingerprint(directory()) === fingerprint(parent));
    remaining();
    const summary = JSON.stringify({scope: report.scope, result: report.result, processResult: report.processResult,
      resultScope: report.resultScope, observationStatus: 'PENDING_FINAL_BUDGET_CHECK',
      observationCompleted: false, recordVerified: false,
      recordName: path.basename(file), sha256: sha(body),
      compilerInvocationAttempts: report.compilerInvocationAttempts,
      compilerVerificationExecutions: report.compilerVerificationExecutions,
      nativeLaunches: 0, models: 0, receiptWrites: 0, sealed: false, reuseEligible: false});
    remaining();
    // Publication itself can consume the remaining budget. Its summary therefore
    // makes only historical claims; success is returned after the final check.
    diagnostic(summary);
    tick();
    recordVerified = true;
  } catch {
    completed = false;
    recordVerified = false;
    diagnostic(JSON.stringify({scope: 'STAGED_CLI_RECORD_UNKNOWN', result: report.result,
      processResult: report.processResult, resultScope: report.resultScope,
      compilerInvocationAttempts: report.compilerInvocationAttempts,
      compilerVerificationExecutions: report.compilerVerificationExecutions,
      status: report.status, signal: report.signal, processObserved: report.processObserved, processReaped: report.processReaped,
      observationCompleted: false, recordVerified: false,
      nativeLaunches: 0, models: 0, receiptWrites: 0, sealed: false, reuseEligible: false}));
    try { tick(); } catch { /* A failure diagnostic cannot restore success. */ }
  }
  return {completed, recordVerified, report, totalElapsedMs, totalElapsedMsScope: 'THROUGH_DIAGNOSTIC_PUBLICATION',
    observationStatus: clockUnavailable ? 'CLOCK_UNAVAILABLE' : budgetExceeded ? 'BUDGET_EXCEEDED' :
      completed && recordVerified ? 'PASS' : 'UNKNOWN'};
}

// Importing the injected harness into mock controls never registers a real run.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
test('unchanged full staged CLI under reviewed engineering view; no native or receipt authority', {
  skip: process.env.REDUE_STAGED_CLI_OBSERVATION === '1' ? false : 'Actual staged CLI not selected; no stage or process'
}, async t => {
  const observed = await observeStagedCompilerCli({
    environment: process.env, cwd: process.cwd(), uid: typeof process.getuid === 'function' ? process.getuid() : undefined,
    filesystem: fs, spawn: spawnSync, now: () => performance.now(), uuid: randomUUID,
    selectProfile: async options => (await import('./acceptance/sealed-typescript-compiler-profile.mjs'))
      .sealedCompilerFixtureProfile(options), diagnostic: message => t.diagnostic(message)
  });
  assert.equal(observed.completed, true, 'STAGED_CLI_ENGINEERING_OBSERVATION_NOT_ESTABLISHED');
});
