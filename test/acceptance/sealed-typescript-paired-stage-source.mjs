// Disabled source DATA only. Reuse existing reviewed assertion templates, bind
// canaries to current synthetic A and put proposed code under separate H.
// No file write/build/helper/native/model, auth/settings or protocol aggregation.
// Real control writes/restores change private fixture fingerprints: NEVER revive
// or reinterpret old pair/source/build mints after such an operation.
import {verifySealedTypeScriptBaseExchangePair} from './sealed-typescript-base-exchange-pair.mjs';
import {verifySealedTypeScriptBaseExchangeAssets} from './sealed-typescript-base-exchange-assets.mjs';
import {prepareSealedTypeScriptNativeAssetsProposal} from './sealed-typescript-native-assets-proposal.mjs';
import {createHash} from 'node:crypto';
const fail=()=>{throw Object.assign(Error('PAIRED_STAGE_SOURCE_UNAVAILABLE'),{code:'PAIRED_STAGE_SOURCE_UNAVAILABLE'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const sha=value=>createHash('sha256').update(value).digest('hex');
const names={checker:'sealed-typescript-paired-stage-node.mjs',mapper:'sealed-typescript-paired-stage-map.c',exchange:'sealed-typescript-paired-stage-exchange.c'};
function observe(pair,assetsBuild){const p=verifySealedTypeScriptBaseExchangePair(pair),h=verifySealedTypeScriptBaseExchangeAssets(assetsBuild);
 if(p.outcome!=='BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED'||p.scope!=='FIXED_CI_SYNTHETIC_BASE_EXCHANGE_PAIR_MECHANICS_ONLY'||h.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'||h.scope!=='OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY'||p.baseA!==h.baseA||p.baseB!==h.baseB||![p.baseA,p.baseB,h.hostBase].every(value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value))||new Set([p.baseA,p.baseB,h.hostBase]).size!==3)fail();return{pair:p,assets:h};}
export function prepareSealedTypeScriptPairedStageSource(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||!['pair','assetsBuild'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
 const {pair,assetsBuild}=options,before=observe(pair,assetsBuild),base=before.pair.baseA,hostBase=before.assets.hostBase;
 // Access to pair.fixture is after actual private brand/currentness validation.
 const original=prepareSealedTypeScriptNativeAssetsProposal({fixture:pair.fixture});
 if(original.base!==base||original.scope!=='FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY'||original.sources.length!==3)fail();
 const node=hostBase+'/runtime/node-v22.13.0-darwin-arm64/bin/node',code=hostBase+'/prefix/native-probes',bindings={...original.bindings,node,checker:code+'/'+names.checker};
 const sources=original.sources.map((row,at)=>{const kind=['checker','mapper','exchange'][at];if(row.kind!==kind||row.file!==base+'/prefix/native-probes/'+({checker:'sealed-typescript-native-sentinel.mjs',mapper:'sealed-typescript-map-sentinel.c',exchange:'sealed-typescript-exchange-sentinel.c'})[kind]||sha(row.source)!==row.sha256||row.bytes!==Buffer.byteLength(row.source))fail();let source=row.source;
  if(kind==='checker'){const old='export const SEALED_SENTINEL_BINDINGS=Object.freeze('+JSON.stringify(original.bindings)+');';if(source.split(old).length!==2)fail();source=source.replace(old,'export const SEALED_SENTINEL_BINDINGS=Object.freeze('+JSON.stringify(bindings)+');');}
  if(Buffer.byteLength(source)>1048576)fail();return{kind,file:code+'/'+names[kind],templateSha256:row.templateSha256,source,sha256:sha(source),sourceBytes:Buffer.byteLength(source)};
 });
 if(JSON.stringify(observe(pair,assetsBuild))!==JSON.stringify(before))fail();
 return freeze({schema:1,scope:'DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY',disabled:true,baseA:base,baseB:before.pair.baseB,hostBase,node,bindings,sources,
  commands:[],helperExecutions:0,nativeLaunches:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false,
  blockers:['CURRENT_PROTECTED_SOURCE_AND_BINARY_COPIES_NOT_PROVISIONED','EFFECTIVE_NATIVE_VIEW_AND_SAME_BOUNDARY_NOT_OBSERVED','FRESH_SYNTHETIC_PAIR_PER_ROUTE_REQUIRED','CONTROL_WRITES_RESTORES_INVALIDATE_ORIGINAL_PRIVATE_FIXTURE_MINT','DISTINCT_NODE_MAPPING_STAGE_EXCHANGE_PROTOCOLS_NOT_COMPOSED','OTHER_NATIVE_STAGE_ASSERTIONS_REMAIN_NOT_IMPLEMENTED'],
  preservesExistingAssertions:true,assertionAggregation:'NOT_ESTABLISHED',originalSixCheckClosure:'SEPARATE_UNCHANGED'});
}
