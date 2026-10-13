// Pure constructor controls only; no rendering, native, mapping, model or CI.
import test from 'node:test';import assert from 'node:assert/strict';
import {prepareSealedTypeScriptNativeComposition as prepare} from './acceptance/sealed-typescript-native-composition.mjs';
const options=()=>({base:'/private/tmp/redue-ci-recipient-Abcd1234',node:'/reviewed/node',checkerSha256:'a'.repeat(64),mapperRenderedSourceSha256:'b'.repeat(64),mapperBinarySha256:'c'.repeat(64),exchangeRenderedSourceSha256:'e'.repeat(64),exchangeBinarySha256:'f'.repeat(64),settingsSha256:'d'.repeat(64)});
const reject=value=>assert.throws(()=>prepare(value),error=>error?.code==='SEALED_NATIVE_COMPOSITION_INVALID');
test('fixed binding proposal orders three exact diagnostic routes with pristine exchange inventory first',()=>{
  const input=options(),result=prepare(input),stageParent=input.base+'/sealed-inputs',writable=input.base+'/Checkout 空间';
  assert.equal(result.checkerBindings.stageParent,stageParent);assert(result.checkerBindings.stage.startsWith(stageParent+'/redue-materialization-'));
  assert(result.checkerBindings.allowedWorkspace.startsWith(writable+'/'));assert(result.mapperBindings.workspace.startsWith(writable+'/'));assert(result.mapperBindings.stage.startsWith(stageParent+'/'));
  assert.equal(result.checkerBindings.caseWriteCanary,input.base+'/SEALED-INPUTS/redue-materialization-Canary/write-canary.txt');
  assert.equal(result.checkerBindings.parentSymlinkAlias,writable+'/.sealed-native-canaries/stage-parent-alias');
  assert.equal(result.checkerBindings.parentSymlinkWriteCanary,writable+'/.sealed-native-canaries/stage-parent-alias/redue-materialization-Canary/write-canary.txt');
  assert.deepEqual(result.exchangeBindings,{base:input.base});
  assert.deepEqual(result.proposedCommands,[[input.base+'/prefix/native-probes/sealed-typescript-exchange-sentinel'],[input.node,input.base+'/prefix/native-probes/sealed-typescript-native-sentinel.mjs'],[input.base+'/prefix/native-probes/sealed-typescript-map-sentinel']]);
  assert(result.prerequisites.includes('PRISTINE_EXCHANGE_CONTROL_INVENTORY_BEFORE_NODE_WORKSPACE_MUTATIONS'));
  assert.deepEqual(result.commands,[]);
  assert.equal(result.nativeSettings.expectedProtectedCodeRoot,input.base+'/prefix');assert.equal(result.nativeSettings.expectedProtectedParent,stageParent);
  assert.equal(result.nativeSettings.sha256,input.settingsSha256);assert.equal(result.nativeSettings.effectiveMatch,'NOT_OBSERVED');
});
test('data construction grants no route, settings mutation, filesystem/native/model or sealing authority',()=>{
  const result=prepare(options());assert.equal(result.disabled,true);assert.equal(result.nativeLaunches,0);assert.equal(result.modelLaunches,0);assert.equal(result.filesystemAuthorityAdded,false);
  assert.equal(result.originalSixCheckClosure,'SEPARATE_UNCHANGED');assert.equal(result.assertionComposition,'UNKNOWN');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
  assert.equal(Object.hasOwn(result,'settings_proposed'),false);assert.equal(Object.hasOwn(result,'allowWrite'),false);assert(Object.isFrozen(result.proposedCommands[0]));
});
test('missing case/symlink/atomic-parent/mapping assertions and current mapper binary verification remain explicit',()=>{
  const result=prepare(options());assert(result.prerequisites.includes('MAPPER_RENDERED_BINARY_AND_PHYSICAL_CURRENCY_NOT_VERIFIED'));
  assert.deepEqual(result.missingAssertions,['STAGE_CASE_ALIAS_WRITE_DENIAL_NOT_OBSERVED','STAGE_SYMLINK_PARENT_ALIAS_WRITE_DENIAL_NOT_OBSERVED','STAGE_PARENT_ATOMIC_EXCHANGE_DENIAL_NOT_OBSERVED','WHOLE_BASE_ATOMIC_EXCHANGE_NOT_IMPLEMENTED','MAP_SHARED_COMPOSITION_NOT_OBSERVED']);
  assert.equal(result.classificationRules.parentOperation,'RENAME_AWAY_ONLY_NOT_ATOMIC_EXCHANGE');assert.equal(result.classificationRules.readonlyMappingError,'OS_DESCRIPTOR_CONSTRAINT_NOT_SANDBOX_DENIAL');
});
test('source and binary digests are only explicit local references, never inferred verified from hashes',()=>{
  const result=prepare(options());assert.equal(result.artifacts.mapper.renderedSourceSha256,'b'.repeat(64));assert.equal(result.artifacts.mapper.binarySha256,'c'.repeat(64));
  assert.equal(result.artifacts.mapper.templateSha256,'14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070');assert.equal(Object.hasOwn(result.artifacts,'verified'),false);
  assert.equal(result.artifacts.exchange.templateSha256,'507dc2fb45adb9d7df293eccf18874fbfb101d4b25f2ace932899be6f2198d72');
  assert.equal(result.artifacts.exchange.renderedSourceSha256,'e'.repeat(64));assert.equal(result.artifacts.exchange.binarySha256,'f'.repeat(64));
  assert(result.prerequisites.includes('CURRENT_PROTECTED_ARTIFACT_RUNTIME_AND_SETTINGS_BYTES'));
});
test('unknown path/argv/settings/grant options cannot extend the fixed scope',()=>{
  for(const extra of [{commands:[['arbitrary']]},{outsideAlias:'/elsewhere'},{settings:{allowWrite:['/']}},{apply:true},{nativeEnforcement:true}])reject({...options(),...extra});
  for(const base of ['/tmp/other','/private/tmp/redue-ci-recipient-Abcd1234/','/private/tmp/redue-ci-recipient-TooLong99','/private/tmp/redue-ci-recipient-Abcd1234/../other'])reject({...options(),base});
});
test('bad node spelling, digest shape and getters refuse without calling supplied accessors',()=>{
  for(const node of ['relative','/reviewed/../node','/reviewed/node/','/reviewed/\ud800','/reviewed/\u0000'])reject({...options(),node});
  for(const value of ['', 'A'.repeat(64),'x'.repeat(65),true])reject({...options(),mapperBinarySha256:value});
  let calls=0;const value=options();Object.defineProperty(value,'node',{get(){calls++;return'/reviewed/node';}});reject(value);assert.equal(calls,0);
});
test('whole-parent destructive assertion is always deferred without an authoritative fresh synthetic-only inventory',()=>{
  const result=prepare(options());assert.deepEqual(result.commands,[]);
  assert.equal(result.nativeRouteAdmission,'REFUSED_PENDING_SYNTHETIC_ONLY_INVENTORY');assert.equal(result.parentDestructiveAssertions,'DEFERRED_RESOURCE_PRESERVATION');
  assert.equal(result.preservation.preparedStages,'MUST_NOT_RENAME_REPLACE_OR_MODIFY');assert.equal(result.preservation.stateAndReceipts,'MUST_REMAIN_UNTOUCHED');
  assert(result.prerequisites.includes('FRESH_SYNTHETIC_ONLY_STAGE_AND_CANARY_NAMESPACES'));
  assert(result.prerequisites.includes('UNRELATED_HOST_STATE_RECEIPTS_AND_AUTH_ASSETS_UNINSPECTED_AND_PRESERVED'));
  assert(result.prerequisites.includes('BOUNDED_AUTHORITATIVE_PARENT_INVENTORY_BEFORE_DESTRUCTIVE_ASSERTION'));
  for(const claim of [{fresh:true},{syntheticOnly:true},{noRealStage:true},{parentEntries:[]},{preparedStagePresent:false}])reject({...options(),...claim});
});
