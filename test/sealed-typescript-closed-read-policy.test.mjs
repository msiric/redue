import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSealedTypeScriptClosedReadCanaryPolicy as prepare} from './acceptance/sealed-typescript-closed-read-policy.mjs';
import {prepareSealedClaudeReceiverPolicy} from './acceptance/sealed-typescript-claude-policy.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-invocation.mjs';
const base='/private/tmp/redue-ci-recipient-Abc12345';
const options={base,claudeExecutable:'/private/tmp/approved-native/claude',
  claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version};
test('closed canary view reduces body reads without admitting any command',()=>{
  const before=prepareSealedClaudeReceiverPolicy({...options,stagedRoot:base+'/sealed-inputs/redue-materialization-Canary'});
  const after=prepare(options),expected=structuredClone(before.settings_proposed);
  expected.sandbox.filesystem.denyRead.push('/');
  expected.sandbox.filesystem.allowRead=[after.stagedRoot,...after.readLeaves];
  expected.sandbox.filesystem.denyWrite.push(base+'/runtime',...after.readLeaves);
  expected.permissions.allow=[];
  assert.deepEqual(after.settings_proposed,expected);
  assert.deepEqual(after.commands,[]);assert.equal(after.disabled,true);
  for(const key of ['physicalBindingsVerified','namespaceVerified','sealed','reuseEligible','inferencePermitted'])assert.equal(after[key],false);
  assert.equal(after.modelLaunches,0);assert.equal(after.nativeLaunches,0);
  assert.equal(after.actualNativeEnforcement,'NOT_TESTED');
  assert(Object.isFrozen(after.settings_proposed.sandbox.filesystem.allowRead));
});
test('body reallows are fixed leaves and one stage, not broad or credential regions',()=>{
  const result=prepare(options),reads=result.settings_proposed.sandbox.filesystem.allowRead;
  assert.deepEqual(reads,[base+'/sealed-inputs/redue-materialization-Canary',
    base+'/runtime/node-v22.13.0-darwin-arm64/bin/node','/bin/bash',
    base+'/prefix/native-probes/sealed-typescript-native-sentinel.mjs',
    base+'/prefix/native-probes/sealed-typescript-map-sentinel']);
  for(const forbidden of ['/',base,base+'/Checkout 空间',base+'/claude-host',base+'/redue-state',
    '/System/Library','/usr/lib','~','~/.claude'])assert(!reads.includes(forbidden));
  assert(result.blockers.includes('REDUE_WRAPPER_CONFIG_AND_STATE_READ_OBLIGATIONS_NOT_MODELLED'));
  assert(result.blockers.includes('OS_RUNTIME_STARTUP_REQUIREMENTS_NOT_ESTABLISHED'));
});
test('no new resource arrays, authority booleans, alternate version or getters are accepted',()=>{
  for(const extra of [{allowRead:['/']},{readLeaves:['/']},{stagedRoot:'/'},{physicalBindingsVerified:true},
    {claudeSha256:'a'.repeat(64)},{claudeVersion:'2.1.999'},{maxTurns:8},{base:'/private/tmp/other'}])
    assert.throws(()=>prepare({...options,...extra}),{code:'SEALED_CLOSED_READ_POLICY_INVALID'});
  let invoked=0;const getter={...options};Object.defineProperty(getter,'base',{get(){invoked++;return base;}});
  assert.throws(()=>prepare(getter),{code:'SEALED_CLOSED_READ_POLICY_INVALID'});assert.equal(invoked,0);
  assert.throws(()=>prepare({...options,[Symbol('authority')]:true}),{code:'SEALED_CLOSED_READ_POLICY_INVALID'});
});
