// Exact proposal source with privately-branded-resource checks replaced ONLY
// in memory. This is not filesystem, native enforcement or pair preparation.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {prepareSealedTypeScriptPairedCanaryPolicy as actual} from './acceptance/sealed-typescript-paired-canary-policy.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy as closed} from './acceptance/sealed-typescript-closed-read-policy.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-paired-canary-policy.mjs',import.meta.url),'utf8');
const construct=Function('verifySealedTypeScriptBaseExchangePair','verifySealedTypeScriptSyntheticFixture','prepareSealedTypeScriptClosedReadCanaryPolicy','structuredClone',source.replace(/^import .*;$/gm,'').replace('export function ','function ')+';return prepareSealedTypeScriptPairedCanaryPolicy;');
const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333';
const native={claudeExecutable:h+'/native/claude',claudeSha256:'a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3',claudeVersion:'2.1.187'};
function fixture(){const pair=Object.freeze({}),hostFixture=Object.freeze({base:h});let pairs=0,hosts=0,policy=0;const state={pair:true,host:true};
 const build=construct(value=>({outcome:++pairs&&state.pair&&value===pair?'BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED':'UNKNOWN',baseA:a,baseB:b}),value=>({outcome:++hosts&&state.host&&value===hostFixture?'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED':'UNKNOWN',receiverBasePolicyMatch:true}),options=>{policy++;return closed(options);},structuredClone);
 return {pair,hostFixture,state,options:{pair,hostFixture,...native},build,counts:()=>({pairs,hosts,policy})};}
test('paired native proposal keeps auth/code elsewhere, with narrower grants and no admitted command',()=>{
 const f=fixture(),result=f.build(f.options),before=closed({base:h,...native}).settings_proposed,settings=result.settings_proposed;
 assert.deepEqual(settings.sandbox.filesystem.allowWrite,[a+'/Checkout 空间/.sealed-native-canaries']);
 assert.deepEqual(settings.sandbox.filesystem.allowRead,[a+'/sealed-inputs',a+'/Checkout 空间/.sealed-native-canaries','/bin/bash',h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel']);
 assert.deepEqual(settings.permissions.allow,[]);assert.deepEqual(settings.permissions.deny,before.permissions.deny);
 assert.deepEqual(settings.sandbox.credentials,before.sandbox.credentials);assert.deepEqual(settings.sandbox.filesystem.denyRead,before.sandbox.filesystem.denyRead);
 assert(before.sandbox.filesystem.denyWrite.every(file=>settings.sandbox.filesystem.denyWrite.includes(file)));assert(settings.sandbox.filesystem.denyWrite.includes(a+'/sealed-inputs'));
 assert.deepEqual(settings.sandbox.network,{...before.sandbox.network,allowUnixSockets:[]});assert.equal(settings.sandbox.allowUnsandboxedCommands,false);assert.equal(settings.sandbox.failIfUnavailable,true);
 assert.equal(result.cwd,a+'/Checkout 空间/.sealed-native-canaries');assert.equal(result.nativeEnforcement,'NOT_TESTED');assert.equal(result.disabled,true);assert.deepEqual(result.commands,[]);
 for(const key of ['sealed','reuseEligible','inferencePermitted','permitsSiblingBodyRead','permitsParentBodyRead','pairMayContainHostAssets'])assert.equal(result[key],false);assert(Object.isFrozen(settings));assert.deepEqual(f.counts(),{pairs:2,hosts:2,policy:1});
});
test('unbranded, edited, stale or getter resources never reach settings construction',()=>{
 for(const which of ['pair','host']){const f=fixture();f.state[which]=false;assert.throws(()=>f.build(f.options),{code:'PAIRED_CANARY_POLICY_INVALID'});assert.equal(f.counts().policy,0);}
 const f=fixture();assert.throws(()=>f.build({...f.options,pair:{}}),{code:'PAIRED_CANARY_POLICY_INVALID'});assert.equal(f.counts().policy,0);
 let accessed=false;assert.throws(()=>actual({...f.options,get pair(){accessed=true;return f.pair;}}),{code:'PAIRED_CANARY_POLICY_INVALID'});assert.equal(accessed,false);
 assert.throws(()=>actual({...f.options,trust:true}),{code:'PAIRED_CANARY_POLICY_INVALID'});
 assert.throws(()=>actual(f.options),{code:'PAIRED_CANARY_POLICY_INVALID'});assert.equal(f.counts().policy,0);
});
