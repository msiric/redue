import test from 'node:test';import assert from 'node:assert/strict';
import {prepareSealedClaudeReceiverPolicy} from './acceptance/sealed-typescript-claude-policy.mjs';
import {prepareClaudeReceiverInvocation,REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-invocation.mjs';
const base='/private/tmp/redue-ci-recipient-Abc12345';
const ordinary={base,claudeExecutable:'/private/tmp/approved-native/claude',
  claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version};
const options={...ordinary,stagedRoot:base+'/sealed-inputs/redue-materialization-Abc123'};
test('sealed proposal restricts only the exact dedicated parent and grants no new authority',()=>{
  const before=prepareClaudeReceiverInvocation(ordinary),after=prepareSealedClaudeReceiverPolicy(options);
  assert.equal(after.disabled,true);assert.equal(after.model_launches,0);assert.equal(after.inferencePermitted,false);
  for(const key of ['physicalBindingsVerified','namespaceVerified','sealed','reuseEligible'])assert.equal(after[key],false);
  assert.equal(after.actualNativeEnforcement,'NOT_TESTED');
  assert.deepEqual(after.settingsDelta,{addedDenyWrite:[base+'/sealed-inputs']});
  const expected=structuredClone(before.settings_proposed);expected.sandbox.filesystem.denyWrite.push(base+'/sealed-inputs');
  assert.deepEqual(after.settings_proposed,expected);
  assert.deepEqual(after.argv_proposed,before.argv_proposed);
  assert.deepEqual(after.settings_proposed.sandbox.filesystem.allowWrite,[before.cwd,base+'/redue-state']);
  assert(after.blockers.includes('CURRENT_STAGE_BINDINGS_AND_COMPLETE_COMPILER_NAMESPACE_NOT_VERIFIED'));
  assert(Object.isFrozen(after)&&Object.isFrozen(after.settings_proposed.sandbox.filesystem.denyWrite));
});
test('stage policy refuses aliases, foreign roots, broad parents and unbound child names',()=>{
  for(const stagedRoot of ['/',base,base+'/sealed-inputs',base+'/sealed-inputs/../redue-state',
    base+'/sealed-inputs/redue-materialization-Abc123/extra',base+'/sealed-inputs/redue-materialization-A',
    '/private/tmp/other/sealed-inputs/redue-materialization-Abc123',base+'/sealed-inputs/redue-materialization-Abc123\n',
    base+'/sealed-inputs//redue-materialization-Abc123'])
    assert.throws(()=>prepareSealedClaudeReceiverPolicy({...options,stagedRoot}),{code:'SEALED_CLAUDE_POLICY_INVALID'});
});
test('runtime pins, original command limits and nonsecret data-only options remain mandatory',()=>{
  for(const extra of [{claudeVersion:'2.1.999'},{claudeSha256:'a'.repeat(64)},{maxTurns:9},{timeoutMs:300001},
    {settings_proposed:{}},{allowWrite:['/']},{oauthToken:'NONSECRET-CANARY'},{stageParent:'/'}])
    assert.throws(()=>prepareSealedClaudeReceiverPolicy({...options,...extra}),{code:'SEALED_CLAUDE_POLICY_INVALID'});
  let calls=0;const getter={...options};Object.defineProperty(getter,'stagedRoot',{get(){calls++;return options.stagedRoot;}});
  assert.throws(()=>prepareSealedClaudeReceiverPolicy(getter),{code:'SEALED_CLAUDE_POLICY_INVALID'});assert.equal(calls,0);
  const symbol={...options,[Symbol('hidden')]:'canary'};
  assert.throws(()=>prepareSealedClaudeReceiverPolicy(symbol),{code:'SEALED_CLAUDE_POLICY_INVALID'});
});
