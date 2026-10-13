// Pure injected controls: no stage, subprocess, helper, native agent or state.
import test from 'node:test';
import assert from 'node:assert/strict';
import {observeStagedCompilerCli} from './sealed-typescript-staged-cli-observation.test.mjs';

const cwd = '/mock/owned', local = cwd + '/.local/portable-evidence';
const root = local + '/sealed-debugger-parent-ephemeral-ABC123/redue-materialization-DEF456';
const metadata = (kind, overrides = {}) => ({
  dev: 1n, ino: kind === 'directory' ? 2n : 3n, mode: kind === 'directory' ? 0o40755n : 0o100600n,
  uid: 501n, gid: 20n, nlink: kind === 'directory' ? 2n : 1n,
  size: 0n, mtimeNs: 10n, ctimeNs: 10n,
  isDirectory: () => kind === 'directory', isFile: () => kind === 'file',
  isSymbolicLink: () => kind === 'symlink', ...overrides
});
function harness() {
  const calls = {profile: [], spawn: [], reads: [], closes: [], diagnostics: [], writes: []};
  const state = {parent: metadata('directory'), body: null, file: null, afterRead: false, time: 0};
  const proposal = {sealed: false, reuseEligible: false, nativeAgentEnforcement: 'NOT_TESTED',
    command: ['/reviewed/node', root + '/node_modules/typescript/lib/tsc.js', '--noEmit'],
    node: '/reviewed/node', profile: '(reviewed engineering profile)', profileSha256: 'profile-pin',
    compiler: {digest: 'compiler-pin'}, nodeSha256: 'node-pin'};
  const filesystem = {
    constants: {O_RDONLY: 0, O_NOFOLLOW: 256, O_NONBLOCK: 4},
    lstatSync(file, options) {
      assert.deepEqual(options, {bigint: true});
      if (file === local) return {...state.parent};
      assert.equal(file, state.file);
      return metadata('file', {size: BigInt(state.body.length)});
    },
    realpathSync: file => file,
    writeFileSync(file, body, options) {
      assert.deepEqual(options, {mode: 0o600, flag: 'wx'});
      state.file = file; state.body = Buffer.from(body); calls.writes.push(file);
      state.parent = {...state.parent, size: 1n, mtimeNs: 11n, ctimeNs: 11n};
    },
    openSync(file, flags) { assert.equal(file, state.file); assert.equal(flags, 260); return 42; },
    fstatSync(fd, options) {
      assert.equal(fd, 42); assert.deepEqual(options, {bigint: true});
      return metadata('file', {size: BigInt(state.body.length)});
    },
    readSync(fd, buffer, offset, length, position) {
      assert.equal(fd, 42); assert.equal(position, offset);
      assert(length <= state.body.length + 1); calls.reads.push({offset, length});
      state.afterRead = true;
      const bytes = state.body.subarray(position, position + length);
      bytes.copy(buffer, offset); return bytes.length;
    },
    closeSync(fd) { assert.equal(fd, 42); calls.closes.push(fd); }
  };
  const options = {environment: {REDUE_OWNED_STAGED_TREE: root}, cwd, uid: 501, filesystem,
    selectProfile(input) { calls.profile.push(input); return proposal; },
    spawn(command, args, config) {
      calls.spawn.push({command, args, config});
      return {status: 0, signal: null, pid: 123, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0)};
    },
    now: () => state.time, uuid: () => 'fixed-mock-id', diagnostic: text => calls.diagnostics.push(JSON.parse(text))};
  return {calls, state, proposal, filesystem, options, run: () => observeStagedCompilerCli(options)};
}
function noAuthority(report) {
  for (const name of ['nativeLaunches', 'models', 'receiptWrites']) assert.equal(report[name], 0);
  for (const name of ['sealed', 'reuseEligible']) assert.equal(report[name], false);
}
function unknownRecord(observed, h) {
  assert.equal(observed.completed, false); assert.equal(observed.recordVerified, false);
  assert.equal(h.calls.diagnostics.at(-1).scope, 'STAGED_CLI_RECORD_UNKNOWN');
  assert.equal(h.calls.diagnostics.at(-1).sha256, undefined); noAuthority(observed.report);
}

test('mock valid direct test:types observation keeps exact command, environment, cap and false authority', async () => {
  const h = harness(), observed = await h.run();
  assert.equal(observed.completed, true); assert.equal(observed.recordVerified, true);
  assert.equal(observed.report.result, 'PASS'); assert.equal(observed.report.compilerInvocationAttempts, 1);
  assert.equal(observed.report.compilerVerificationExecutions, 1); noAuthority(observed.report);
  assert.deepEqual(h.calls.profile, [{root, script: 'test:types'}, {root, script: 'test:types'}]);
  assert.equal(h.calls.spawn.length, 1);
  const [{command, args, config}] = h.calls.spawn;
  assert.equal(command, '/usr/bin/sandbox-exec');
  assert.deepEqual(args, ['-p', h.proposal.profile, ...h.proposal.command]);
  assert.equal(config.env, h.options.environment); assert.equal(config.cwd, root);
  assert.equal(config.timeout, 30000); assert.equal(config.killSignal, 'SIGKILL');
  assert.equal(config.maxBuffer, 1024 * 1024); assert.deepEqual(config.stdio, ['ignore', 'pipe', 'pipe']);
  assert.match(h.calls.diagnostics[0].sha256, /^[a-f0-9]{64}$/); assert.equal(h.calls.closes.length, 1);
});

for (const [name, alter] of [
  ['symlink leaf', h => { h.state.parent = metadata('symlink'); }],
  ['noncanonical ancestor alias', h => { h.filesystem.realpathSync = file => file === local ? '/mock/alias' : file; }],
  ['wrong owner', h => { h.state.parent.uid = 502n; }],
  ['group writable', h => { h.state.parent.mode = 0o40775n; }],
  ['world writable', h => { h.state.parent.mode = 0o40757n; }],
  ['regular file selector', h => { h.state.parent = metadata('file'); }]
]) test('mock unsafe raw evidence selector launches zero compiler processes: ' + name, async () => {
  const h = harness(); alter(h); const observed = await h.run();
  assert.equal(h.calls.profile.length, 0); assert.equal(h.calls.spawn.length, 0);
  assert.equal(observed.report.compilerInvocationAttempts, 0); assert.equal(h.calls.writes.length, 0);
  assert.equal(observed.report.result, 'UNKNOWN'); unknownRecord(observed, h);
});

test('mock selector replacement during profile selection is refused before spawn', async () => {
  const h = harness(); h.options.selectProfile = input => {
    h.calls.profile.push(input); h.state.parent.ino = 99n; return h.proposal;
  };
  const observed = await h.run();
  assert.equal(h.calls.profile.length, 1); assert.equal(h.calls.spawn.length, 0);
  assert.equal(observed.report.compilerInvocationAttempts, 0); assert.equal(observed.completed, false);
});

test('mock synchronous spawn throw retains one attempted invocation and no observed execution', async () => {
  const h = harness(); h.options.spawn = () => { h.calls.spawn.push('throw'); throw Error('PRIVATE MOCK ERROR'); };
  const observed = await h.run();
  assert.equal(observed.completed, false); assert.equal(observed.recordVerified, true);
  assert.equal(observed.report.compilerInvocationAttempts, 1); assert.equal(h.calls.spawn.length, 1);
  assert.equal(observed.report.compilerVerificationExecutions, 0); assert.equal(observed.report.result, 'UNKNOWN');
  assert.equal(observed.report.processObserved, false); assert.equal(observed.report.processReaped, false);
  assert.equal(h.calls.diagnostics[0].compilerInvocationAttempts, 1);
  assert.equal(JSON.parse(h.state.body).compilerInvocationAttempts, 1);
  assert(!h.state.body.includes('PRIVATE MOCK ERROR')); noAuthority(observed.report);
});

test('mock expired deadline before spawn options produces zero attempts', async () => {
  const h = harness(); h.options.selectProfile = () => { h.state.time = 30000; return h.proposal; };
  const observed = await h.run();
  assert.equal(h.calls.spawn.length, 0); assert.equal(observed.report.compilerInvocationAttempts, 0);
  assert.equal(observed.report.result, 'UNKNOWN'); assert.equal(observed.completed, false);
});

test('mock deadline expiry evaluating spawn options is not counted as an attempt', async () => {
  const h = harness(); let ticks = 0;
  h.options.now = () => ++ticks === 6 ? 30000 : 0;
  const observed = await h.run();
  assert.equal(h.calls.spawn.length, 0); assert.equal(observed.report.compilerInvocationAttempts, 0);
  assert.equal(observed.completed, false);
});

for (const key of ['API_TOKEN', 'PASSWORD', 'SECRET', 'CREDENTIAL', 'API_KEY', 'AUTH_KEY', 'PRIVATE_KEY',
  'NODE_OPTIONS', 'NODE_PATH', 'NODE_REPL_EXTERNAL_MODULE', 'BASH_ENV', 'ENV',
  'DYLD_INSERT_LIBRARIES', 'LD_PRELOAD', 'OPENSSL_CONF', 'CLAUDE_CONFIG_DIR', 'ANTHROPIC_BASE_URL']) {
  test('mock original environment refusal before compiler selection: ' + key, async () => {
    const h = harness(); h.options.environment[key] = 'PRIVATE MOCK VALUE'; const observed = await h.run();
    assert.equal(h.calls.profile.length, 0); assert.equal(h.calls.spawn.length, 0);
    assert.equal(observed.report.compilerInvocationAttempts, 0); assert.equal(observed.completed, false);
    assert(!h.state.body.includes('PRIVATE MOCK VALUE')); noAuthority(observed.report);
  });
}

test('mock profile refusal prevents altered command or weakened enforcement claims', async () => {
  for (const alter of [p => { p.command.push('--incremental'); }, p => { p.command[2] = '--emit'; },
    p => { p.sealed = true; }, p => { p.reuseEligible = true; }, p => { p.nativeAgentEnforcement = 'PASS'; }]) {
    const h = harness(); alter(h.proposal); const observed = await h.run();
    assert.equal(h.calls.spawn.length, 0); assert.equal(observed.report.compilerInvocationAttempts, 0);
    assert.equal(observed.completed, false); noAuthority(observed.report);
  }
});

test('mock bounded readback handles short FD reads before publishing a verified digest', async () => {
  const h = harness(), read = h.filesystem.readSync;
  h.filesystem.readSync = (fd, buffer, offset, length, position) => read(fd, buffer, offset, Math.min(length, 17), position);
  const observed = await h.run();
  assert.equal(observed.recordVerified, true); assert.equal(observed.completed, true);
  assert(h.calls.reads.length > 2); assert.equal(h.calls.closes.length, 1);
});

for (const [name, alter] of [
  ['FD changed after read', h => { const stat = h.filesystem.fstatSync; h.filesystem.fstatSync = (...args) =>
    ({...stat(...args), ctimeNs: h.state.afterRead ? 12n : 10n}); }],
  ['named file replaced after read', h => { const stat = h.filesystem.lstatSync; h.filesystem.lstatSync = (file, options) =>
    ({...stat(file, options), ...(file !== local && h.state.afterRead ? {ino: 99n} : {})}); }],
  ['parent metadata changed after read', h => { const stat = h.filesystem.lstatSync; h.filesystem.lstatSync = (file, options) =>
    ({...stat(file, options), ...(file === local && h.state.afterRead ? {ctimeNs: 12n} : {})}); }],
  ['parent replaced after read', h => { const stat = h.filesystem.lstatSync; h.filesystem.lstatSync = (file, options) =>
    ({...stat(file, options), ...(file === local && h.state.afterRead ? {ino: 99n} : {})}); }],
  ['truncated read', h => { h.filesystem.readSync = () => 0; }],
  ['invalid read count', h => { h.filesystem.readSync = () => -1; }],
  ['record growth beyond bounded buffer', h => { const read = h.filesystem.readSync; h.filesystem.readSync = (...args) => {
    const n = read(...args); if (n === 0) { args[1][args[2]] = 1; return 1; } return n;
  }; }],
  ['altered readback bytes', h => { const read = h.filesystem.readSync; h.filesystem.readSync = (...args) => {
    const n = read(...args); if (n > 0) args[1][args[2]] ^= 1; return n;
  }; }],
  ['close failure', h => { h.filesystem.closeSync = () => { throw Error('MOCK CLOSE FAILURE'); }; }]
]) test('mock readback withholds verified digest on ' + name, async () => {
  const h = harness(); alter(h); const observed = await h.run();
  unknownRecord(observed, h); assert.equal(observed.report.result, 'PASS');
  assert.equal(observed.report.compilerInvocationAttempts, 1);
});

for (const [name, child] of [
  ['nonzero exit', {status: 1, signal: null, pid: 123}],
  ['signal exit', {status: null, signal: 'SIGKILL', pid: 123}],
  ['unobserved child', {status: 0, signal: null}],
  ['spawn error result', {status: 0, signal: null, pid: 123, error: Error('PRIVATE MOCK ERROR')}]
]) test('mock incomplete or failed child cannot become engineering PASS: ' + name, async () => {
  const h = harness(); h.options.spawn = () => child; const observed = await h.run();
  assert.equal(observed.completed, false); assert.equal(observed.recordVerified, true);
  assert.equal(observed.report.compilerInvocationAttempts, 1);
  assert.equal(observed.report.compilerVerificationExecutions, 0);
  assert.equal(observed.report.result, name === 'nonzero exit' ? 'PROCESS_EXIT_NONZERO' : 'UNKNOWN');
  noAuthority(observed.report);
});

test('mock missing no-follow support prevents any observation-record write', async () => {
  const h = harness(); delete h.filesystem.constants.O_NOFOLLOW;
  const observed = await h.run(); unknownRecord(observed, h); assert.equal(h.calls.writes.length, 0);
});

test('mock replacement parent during record creation withholds verified digest', async () => {
  const h = harness(), write = h.filesystem.writeFileSync;
  h.filesystem.writeFileSync = (...args) => { write(...args); h.state.parent.ino = 99n; };
  const observed = await h.run(); unknownRecord(observed, h); assert.equal(h.calls.reads.length, 0);
});

test('mock opened FD identity mismatch fails before reading and closes it', async () => {
  const h = harness(), stat = h.filesystem.fstatSync;
  h.filesystem.fstatSync = (...args) => ({...stat(...args), ino: 99n});
  const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(h.calls.reads.length, 0); assert.equal(h.calls.closes.length, 1);
});

// Reviewer counterexamples target work after the historical compiler PASS.
// Advancing only these injected operations cannot be treated as in-budget success.
const advanceDuring = (h, phase, value) => {
  if (phase === 'diagnostic publication') {
    const publish = h.options.diagnostic;
    h.options.diagnostic = text => { publish(text); h.state.time = value; };
  } else if (phase === 'result validation') {
    const select = h.options.selectProfile;
    h.options.selectProfile = input => {
      const result = select(input); if (h.calls.profile.length === 2) h.state.time = value;
      return result;
    };
  } else {
    const method = {write: 'writeFileSync', read: 'readSync', close: 'closeSync',
      'final named stat': 'lstatSync', 'final parent stat': 'lstatSync'}[phase];
    const operation = h.filesystem[method];
    h.filesystem[method] = (...args) => {
      const result = operation(...args);
      if (phase === 'final named stat' ? args[0] !== local && h.state.afterRead :
        phase === 'final parent stat' ? args[0] === local && h.state.afterRead : true) h.state.time = value;
      return result;
    };
  }
};
for (const phase of ['result validation', 'write', 'read', 'close', 'final named stat', 'final parent stat', 'diagnostic publication']) {
  for (const elapsed of [30000, 30001]) test('mock total budget refuses ' + elapsed + 'ms during ' + phase, async () => {
    const h = harness(); advanceDuring(h, phase, elapsed); const observed = await h.run();
    unknownRecord(observed, h);
    assert.equal(observed.observationStatus, 'BUDGET_EXCEEDED'); assert.equal(observed.totalElapsedMs, elapsed);
    assert.equal(observed.totalElapsedMsScope, 'THROUGH_DIAGNOSTIC_PUBLICATION');
    assert.equal(observed.report.processResult, 'PASS'); assert.equal(observed.report.compilerInvocationAttempts, 1);
    assert.equal(h.calls.diagnostics.at(-1).compilerInvocationAttempts, 1);
    assert.equal(h.calls.diagnostics.at(-1).processResult, 'PASS');
    for (const published of h.calls.diagnostics) {
      assert.equal(published.observationCompleted, false); assert.equal(published.recordVerified, false);
    }
    if (phase !== 'result validation') {
      assert.equal(observed.report.result, 'PASS'); assert.equal(h.calls.writes.length, 1);
      const saved = JSON.parse(h.state.body);
      assert.equal(saved.result, 'PASS'); assert.equal(saved.elapsedMs, 0);
      assert.equal(saved.elapsedMsScope, 'PRE_PERSISTENCE_SNAPSHOT');
      assert.equal(saved.observationStatus, 'PENDING_PERSISTENCE_AND_FINAL_BUDGET_CHECK');
      assert.equal(saved.observationCompleted, false); assert.equal(saved.recordVerified, false);
    } else {
      assert.equal(observed.report.result, 'UNKNOWN'); assert.equal(h.calls.writes.length, 0);
    }
  });
}

for (const [name, value] of [['NaN', NaN], ['infinity', Infinity], ['non-number', '0'], ['backwards', 99]]) {
  for (const phase of ['result validation', 'write', 'read', 'close', 'final parent stat', 'diagnostic publication']) {
    test('mock invalid clock refuses ' + name + ' during ' + phase, async () => {
      const h = harness(); h.state.time = 100; advanceDuring(h, phase, value);
      const observed = await h.run(); unknownRecord(observed, h);
      assert.equal(observed.observationStatus, 'CLOCK_UNAVAILABLE'); assert.equal(observed.totalElapsedMs, null);
      assert.equal(observed.report.processResult, 'PASS'); assert.equal(observed.report.compilerInvocationAttempts, 1);
      for (const published of h.calls.diagnostics) {
        assert.equal(published.observationCompleted, false); assert.equal(published.recordVerified, false);
      }
    });
  }
}

for (const value of [NaN, Infinity, '0']) test('mock invalid initial clock launches no compiler or record write: ' + String(value), async () => {
  const h = harness(); h.state.time = value; const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(observed.observationStatus, 'CLOCK_UNAVAILABLE'); assert.equal(observed.totalElapsedMs, null);
  assert.equal(h.calls.profile.length, 0); assert.equal(h.calls.spawn.length, 0); assert.equal(h.calls.writes.length, 0);
});

test('mock thrown clock during publication cannot certify success or lose historical attempt', async () => {
  const h = harness(), publish = h.options.diagnostic;
  h.options.now = () => { if (h.state.clockThrows) throw Error('PRIVATE CLOCK ERROR'); return h.state.time; };
  h.options.diagnostic = text => { publish(text); h.state.clockThrows = true; };
  const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(observed.observationStatus, 'CLOCK_UNAVAILABLE'); assert.equal(observed.totalElapsedMs, null);
  assert.equal(observed.report.processResult, 'PASS'); assert.equal(observed.report.compilerInvocationAttempts, 1);
  assert.equal(h.calls.writes.length, 1); assert(!h.state.body.includes('PRIVATE CLOCK ERROR'));
});

test('mock backwards clock latches despite a later valid sample', async () => {
  const h = harness(); h.state.time = 100;
  const read = h.filesystem.readSync;
  h.filesystem.readSync = (...args) => { const n = read(...args); h.state.time = 99; return n; };
  const close = h.filesystem.closeSync;
  h.filesystem.closeSync = (...args) => { close(...args); h.state.time = 101; };
  const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(observed.observationStatus, 'CLOCK_UNAVAILABLE'); assert.equal(observed.totalElapsedMs, null);
});

test('mock publication below total deadline can complete while saved bytes remain a historical snapshot', async () => {
  const h = harness(); advanceDuring(h, 'diagnostic publication', 29999);
  const observed = await h.run();
  assert.equal(observed.completed, true); assert.equal(observed.recordVerified, true);
  assert.equal(observed.observationStatus, 'PASS'); assert.equal(observed.totalElapsedMs, 29999);
  assert.equal(JSON.parse(h.state.body).elapsedMsScope, 'PRE_PERSISTENCE_SNAPSHOT');
  assert.equal(h.calls.diagnostics[0].observationStatus, 'PENDING_FINAL_BUDGET_CHECK');
  assert.equal(h.calls.diagnostics[0].observationCompleted, false); assert.equal(h.calls.diagnostics[0].recordVerified, false);
  assert.equal(h.calls.writes.length, 1); noAuthority(observed.report);
});

for (const [name, value, status] of [['late', 30101, 'BUDGET_EXCEEDED'], ['NaN', NaN, 'CLOCK_UNAVAILABLE'],
  ['backwards', 99, 'CLOCK_UNAVAILABLE']]) test('mock ' + name + ' clock at process return retains process outcome without total success', async () => {
  const h = harness(); h.state.time = 100; const spawn = h.options.spawn;
  h.options.spawn = (...args) => { const child = spawn(...args); h.state.time = value; return child; };
  const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(observed.observationStatus, status); assert.equal(observed.report.processResult, 'PASS');
  assert.equal(observed.report.processObserved, true); assert.equal(observed.report.processReaped, true);
  assert.equal(observed.report.compilerInvocationAttempts, 1); assert.equal(h.calls.writes.length, 0);
  assert.equal(h.calls.diagnostics.at(-1).compilerInvocationAttempts, 1);
  assert.equal(h.calls.diagnostics.at(-1).processResult, 'PASS');
});

test('mock thrown initial clock permits only an unknown diagnostic', async () => {
  const h = harness(); h.options.now = () => { throw Error('PRIVATE INITIAL CLOCK ERROR'); };
  const observed = await h.run(); unknownRecord(observed, h);
  assert.equal(observed.observationStatus, 'CLOCK_UNAVAILABLE'); assert.equal(observed.totalElapsedMs, null);
  assert.equal(h.calls.profile.length, 0); assert.equal(h.calls.spawn.length, 0); assert.equal(h.calls.writes.length, 0);
});
