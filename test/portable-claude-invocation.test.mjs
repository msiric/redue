import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareClaudeReceiverInvocation, requireClaudeReceiverActivation, REVIEWED_CLAUDE_NATIVE } from './acceptance/portable-claude-invocation.mjs';

const options = {
  base: '/private/tmp/redue-ci-recipient-Abc12345',
  claudeExecutable: '/private/tmp/approved-native/claude',
  claudeSha256: REVIEWED_CLAUDE_NATIVE.sha256, claudeVersion: REVIEWED_CLAUDE_NATIVE.version,
};

test('receiver proposal is permanently disabled and never claims host authority', () => {
  const p = prepareClaudeReceiverInvocation(options);
  assert.equal(p.disabled, true);
  assert.equal(p.model_launches, 0);
  assert.equal(p.status, 'PROPOSAL_ONLY');
  assert.equal(p.native_version_proposed, '2.1.187');
  assert.equal(p.native_binary_verified_by_adapter, false);
  assert.equal(Object.hasOwn(p, 'actual_local_version'), false);
  assert.ok(p.blockers.includes('MATCHED_VM_CREDENTIAL_ISOLATION_NOT_VERIFIED'));
  assert.ok(p.blockers.includes('MATCHED_VM_NATIVE_MODEL_TOOL_BOUNDARY_NOT_VERIFIED'));
  assert.ok(p.blockers.includes('MATCHED_VM_SUBSCRIPTION_AUTH_AND_INCLUDED_CAPACITY_NOT_ESTABLISHED'));
  assert.equal(p.blockers.includes('NATIVE_VERSION_LACKS_CREDENTIAL_DENY'), false);
  for (const claim of [{}, { reviewed: true }, { helpPassed: true, keyPresent: true }, { activated: true }]) {
    assert.throws(() => requireClaudeReceiverActivation(claim), { code: 'CLAUDE_RECEIVER_ACTIVATION_NOT_APPROVED' });
  }
});

test('proposal bounds inference, admits only Bash, and preserves project instruction discovery', () => {
  const p = prepareClaudeReceiverInvocation(options);
  assert.ok(p.argv_proposed.includes('--max-turns'));
  assert.equal(p.max_turns_proposed, 8);
  assert.equal(p.parent_timeout_ms_proposed, 300000);
  assert.equal(p.argv_proposed[p.argv_proposed.indexOf('--tools') + 1], 'Bash');
  assert.equal(p.argv_proposed[p.argv_proposed.indexOf('--permission-mode') + 1], 'dontAsk');
  for (const forbidden of ['--bare', '--dangerously-skip-permissions', '--allow-dangerously-skip-permissions', '--disable-slash-commands', '--system-prompt']) {
    assert.equal(p.argv_proposed.includes(forbidden), false);
  }
  assert.deepEqual(p.settings_proposed.enabledPlugins, {});
  assert.equal(p.settings_proposed.disableAllHooks, true);
});

test('no unsandboxed retry, other sockets, network tools, or secret-bearing child environment is proposed', () => {
  const p = prepareClaudeReceiverInvocation(options);
  const s = p.settings_proposed.sandbox;
  assert.equal(s.enabled, true);
  assert.equal(s.failIfUnavailable, true);
  assert.equal(s.allowUnsandboxedCommands, false);
  assert.equal(s.autoAllowBashIfSandboxed, false);
  assert.deepEqual(s.excludedCommands, []);
  assert.deepEqual(s.network.allowUnixSockets, [`${options.base}/redue-state/observer.sock`]);
  assert.equal(s.network.allowAllUnixSockets, false);
  assert.equal(s.network.allowLocalBinding, false);
  assert.deepEqual(s.network.allowedDomains, []);
  assert.ok(s.credentials.envVars.some(x => x.name === 'CLAUDE_CODE_OAUTH_TOKEN' && x.mode === 'deny'));
  assert.ok(s.filesystem.denyWrite.includes(`${options.base}/redue-state/portable-producers-v1.json`));
  assert.equal(JSON.stringify(p).includes('secret-token-value'), false);
});

test('artifact paths, secret values, global scope, unknown approvals, and expanded budgets cannot enter proposal', () => {
  const bad = [
    { base: '/Users/owner' }, { base: `${options.base}/../different` },
    { base: '/tmp/redue-ci-recipient-Abc12345' }, { claudeExecutable: 'claude' },
    { claudeExecutable: '/private/tmp/../usr/bin/claude' }, { claudeExecutable: '/' },
    { claudeExecutable: '/Users/owner' }, { claudeExecutable: '/private/tmp/approved-native' },
    { claudeSha256: 'bad' },
    { claudeVersion: '2.1.146' }, { claudeVersion: '2.1.186' },
    { claudeVersion: '2.1.260' }, { claudeVersion: '2.1.999' },
    { claudeSha256: 'a'.repeat(64) }, { claudeSha256: REVIEWED_CLAUDE_NATIVE.sha256.toUpperCase() }, { maxTurns: 9 }, { timeoutMs: 300001 },
    { oauthToken: 'secret-token-value' }, { apply: true }, { reviewed: true },
  ];
  for (const override of bad) assert.throws(() => prepareClaudeReceiverInvocation({ ...options, ...override }), { code: 'CLAUDE_RECEIVER_PROPOSAL_INVALID' });
});


test('local synthetic success, supplied approval or capacity cannot activate matched-VM model execution', () => {
  const p = prepareClaudeReceiverInvocation(options);
  for (const claim of [p, { localSyntheticPassed: true, nativeVersion: '2.1.187' },
    { credentialsDenied: true, subscriptionReady: true, observerReady: true }]) {
    assert.throws(() => requireClaudeReceiverActivation(claim), { code: 'CLAUDE_RECEIVER_ACTIVATION_NOT_APPROVED' });
  }
  assert.throws(() => prepareClaudeReceiverInvocation({ ...options, localSyntheticPassed: true }),
    { code: 'CLAUDE_RECEIVER_PROPOSAL_INVALID' });
  assert.equal(p.disabled, true);
  assert.equal(p.model_launches, 0);
  assert.ok(p.blockers.includes('MATCHED_RECIPIENT_AND_EXPECTED_EVIDENCE_PREFLIGHT_REQUIRED'));
});


test('credential/settings/native leaves stay protected without widening parent grants', () => {
  const p = prepareClaudeReceiverInvocation(options), f = p.settings_proposed.sandbox.filesystem;
  assert.deepEqual(f.allowWrite, [`${options.base}/Checkout 空间`, `${options.base}/redue-state`]);
  assert.ok(f.denyRead.includes('~/Library/Keychains'));
  assert.ok(f.denyWrite.includes('~/Library/Keychains'));
  assert.ok(f.denyRead.includes(p.settings_file_proposed));
  assert.ok(f.denyWrite.includes(p.settings_file_proposed));
  assert.ok(f.denyWrite.includes(options.claudeExecutable));
  assert.equal(f.denyWrite.includes('/'), false);
  assert.equal(f.denyWrite.includes('/private/tmp'), false);
  assert.equal(f.denyWrite.includes('/private/tmp/approved-native'), false);
  assert.ok(p.blockers.includes('MATCHED_VM_NATIVE_CODE_AND_STARTUP_POLICY_NOT_VERIFIED'));
});
