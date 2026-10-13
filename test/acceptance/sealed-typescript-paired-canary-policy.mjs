// DISABLED synthetic-only native proposal. Test pair A/B cannot hold host,
// auth/state/config/build files; separate private host H owns public code and
// native configuration. No paths/digests from imported evidence select resources.
import {verifySealedTypeScriptBaseExchangePair} from './sealed-typescript-base-exchange-pair.mjs';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';
import {prepareSealedTypeScriptClosedReadCanaryPolicy} from './sealed-typescript-closed-read-policy.mjs';
const fields=['pair','hostFixture','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('PAIRED_CANARY_POLICY_INVALID'),{code:'PAIRED_CANARY_POLICY_INVALID'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedTypeScriptPairedCanaryPolicy(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||!fields.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
 const {pair,hostFixture,claudeExecutable,claudeSha256,claudeVersion}=options;
 // Private brands/current observations BEFORE accessing caller object paths.
 const paired=verifySealedTypeScriptBaseExchangePair(pair),host=verifySealedTypeScriptSyntheticFixture(hostFixture);
 if(paired.outcome!=='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED'||host.outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'||host.receiverBasePolicyMatch!==true)fail();
 const base=hostFixture.base;if(base===paired.baseA||base===paired.baseB)fail();
 const proposal=prepareSealedTypeScriptClosedReadCanaryPolicy({base,claudeExecutable,claudeSha256,claudeVersion});
 const settings=structuredClone(proposal.settings_proposed),workspace=paired.baseA+'/Checkout 空间/.sealed-native-canaries',stageParent=paired.baseA+'/sealed-inputs';
 const code=base+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel';
 // Narrower diagnostic command set, write root and socket grant. Native's
// builtin metadata/startup exceptions remain disclosed, not edited here.
 settings.permissions.allow=[];
 settings.sandbox.filesystem.allowWrite=[workspace];
 settings.sandbox.filesystem.allowRead=[stageParent,workspace,'/bin/bash',code];
 settings.sandbox.filesystem.denyWrite.push(stageParent,code);
 settings.sandbox.network.allowUnixSockets=[];
 if(verifySealedTypeScriptBaseExchangePair(pair).outcome!=='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED'||verifySealedTypeScriptSyntheticFixture(hostFixture).outcome!=='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED')fail();
 return freeze({schema:1,scope:'SYNTHETIC_PAIRED_NATIVE_BASE_EXCHANGE_POLICY_PROPOSAL_ONLY',interpretation:'redue-native187-paired-base-canary@1',disabled:true,
  baseA:paired.baseA,baseB:paired.baseB,hostBase:base,cwd:workspace,code,
  settings_proposed:settings,commands:[],nativeLaunches:0,models:0,
  permitsSiblingBodyRead:false,permitsParentBodyRead:false,pairMayContainHostAssets:false,
  originalCredentialDenialsRetained:true,originalReadDenialsRetained:true,
  nativeMetadataScope:proposal.nativeMetadataScope,
  blockers:['CURRENT_CODE_AND_SETTINGS_PHYSICAL_BINDINGS_REQUIRED','HOST_AUTH_AND_PAIR_PHYSICAL_DISJOINTNESS_REQUIRED',
   'EXACT_NATIVE_WRITE_AND_READ_VIEW_NOT_OBSERVED','NATIVE_ENTRY_AND_EFFECTIVE_CONFIGURATION_NOT_OBSERVED',
   'PREPARER_REAPED_AND_NO_INHERITED_WRITABLE_PAIR_HANDLES_REQUIRED','ACTUAL_BASE_EXCHANGE_ASSERTIONS_NOT_OBSERVED'],
  inferencePermitted:false,nativeEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false});
}
