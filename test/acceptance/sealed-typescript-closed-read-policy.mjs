// Disabled native187 canary proposal, not a recipient invocation or seal.
// No inspection, settings write, process, credentials or imported paths.
// Global directory metadata/native startup exceptions differ from the engineering
// SBPL view. Exact effective-view observations are still required.
import {prepareSealedClaudeReceiverPolicy} from './sealed-typescript-claude-policy.mjs';

const keys=['base','claudeExecutable','claudeSha256','claudeVersion'];
const fail=()=>{throw Object.assign(Error('SEALED_CLOSED_READ_POLICY_INVALID'),{code:'SEALED_CLOSED_READ_POLICY_INVALID'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedTypeScriptClosedReadCanaryPolicy(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==keys.length||
    !keys.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
  let receiver;
  try{receiver=prepareSealedClaudeReceiverPolicy({...options,
    stagedRoot:options.base+'/sealed-inputs/redue-materialization-Canary'});}catch{fail();}
  const settings=structuredClone(receiver.settings_proposed),base=options.base;
  const code=base+'/prefix/native-probes';
  // Fixed locally provisioned resources, never a configurable ignore/read list.
  // Lexical construction does NOT establish canonical physical/case disjointness.
  const node=base+'/runtime/node-v22.13.0-darwin-arm64/bin/node';
  const readLeaves=[node,'/bin/bash',code+'/sealed-typescript-native-sentinel.mjs',
    code+'/sealed-typescript-map-sentinel',code+'/sealed-typescript-exchange-sentinel'];
  // The fixed synthetic inventory checker requires readdir as well as metadata.
  // Native187 allowRead uses subpath semantics, so these directories must be
  // actually fresh, bounded SYNTHETIC-ONLY inventories before any use. Never
  // apply this diagnostic view to an existing prepared stage or host namespace.
  // It is not the future compiler-only read view and never admits a command.
  const inventoryReadRoots=[receiver.stageParent,base+'/Checkout 空间/.sealed-native-canaries'];
  const filesystem=settings.sandbox.filesystem;
  filesystem.denyRead.push('/');
  filesystem.allowRead=[...inventoryReadRoots,...readLeaves];
  // No command admission until exact resources, effective read view and safe
  // synthetic inventory are independently established. In particular, this
  // profile cannot yet serve the REDUE wrapper/config/state read obligations.
  settings.permissions.allow=[];
  filesystem.denyWrite.push(base+'/runtime',...readLeaves);
  return freeze({schema:1,scope:'SEALED_NATIVE_CLOSED_BODY_READ_CANARY_PROPOSAL_ONLY',
    interpretation:'redue-native187-closed-read-canary@2',disabled:true,
    nativeVersion:receiver.native_version_proposed,
    nativeSha256:receiver.executable_sha256_proposed,
    stagedRoot:receiver.stagedRoot,readLeaves,inventoryReadRoots,settings_proposed:settings,
    settingsDelta:{addedDenyRead:['/'],addedAllowRead:[...inventoryReadRoots,...readLeaves],
      addedDenyWrite:[base+'/runtime',...readLeaves],removedCommandAllows:receiver.settings_proposed.permissions.allow},
    commands:[],nativeLaunches:0,modelLaunches:0,
    runtimeReadScope:'NO_BROAD_OS_LIBRARY_REALLOW; STARTUP_NOT_ESTABLISHED',
    nativeMetadataScope:'PINNED_NATIVE_GLOBAL_DIRECTORY_METADATA_AND_LITERAL_ROOT_EXCEPTION',
    blockers:['PHYSICAL_CASE_FIRMLINK_AND_CREDENTIAL_DISJOINTNESS_NOT_VERIFIED',
      'CURRENT_NODE_SHELL_CODE_AND_ANCESTOR_BINDINGS_NOT_VERIFIED',
      'OS_RUNTIME_STARTUP_REQUIREMENTS_NOT_ESTABLISHED',
      'FRESH_SYNTHETIC_ONLY_INVENTORY_NOT_VERIFIED',
      'SYNTHETIC_ONLY_DIRECTORY_BODY_READ_SCOPE_NOT_VERIFIED',
      'NATIVE_CLOSED_READ_AND_STAGE_WRITE_ENFORCEMENT_NOT_OBSERVED',
      'COMPILER_NAMESPACE_AND_CLI_INPUT_COMPLETENESS_NOT_ESTABLISHED',
      'REDUE_WRAPPER_CONFIG_AND_STATE_READ_OBLIGATIONS_NOT_MODELLED'],
    physicalBindingsVerified:false,namespaceVerified:false,sealed:false,reuseEligible:false,
    inferencePermitted:false,actualNativeEnforcement:'NOT_TESTED'});
}
