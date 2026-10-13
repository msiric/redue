// Pure, DISABLED composition proposal. No filesystem/settings/policy writes,
// source rendering, native launch, credentials, model or imported-code execution.
// All supplied digests are LOCAL review references, not verified authority.
import {posix as path} from 'node:path';
const fields=['base','node','checkerSha256','mapperRenderedSourceSha256','mapperBinarySha256',
  'exchangeRenderedSourceSha256','exchangeBinarySha256','settingsSha256'];
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const fail=()=>{throw Object.assign(Error('SEALED_NATIVE_COMPOSITION_INVALID'),{code:'SEALED_NATIVE_COMPOSITION_INVALID'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedTypeScriptNativeComposition(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==fields.length||
    !fields.every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
  const {base,node,checkerSha256,mapperRenderedSourceSha256,mapperBinarySha256,
    exchangeRenderedSourceSha256,exchangeBinarySha256,settingsSha256}=options;
  if(typeof base!=='string'||!/^\/private\/tmp\/redue-ci-recipient-[A-Za-z0-9]{8}$/.test(base)||
    typeof node!=='string'||!path.isAbsolute(node)||path.normalize(node)!==node||node.endsWith('/')||
    Buffer.byteLength(node)>4096||Buffer.from(node).toString('utf8')!==node||/[\u0000-\u001f\u007f\\:]/u.test(node)||
    ![checkerSha256,mapperRenderedSourceSha256,mapperBinarySha256,
      exchangeRenderedSourceSha256,exchangeBinarySha256,settingsSha256].every(sha))fail();
  const stageParent=base+'/sealed-inputs',stage=stageParent+'/redue-materialization-Canary';
  const workspace=base+'/Checkout 空间/.sealed-native-canaries',code=base+'/prefix/native-probes';
  const checker=code+'/sealed-typescript-native-sentinel.mjs',mapper=code+'/sealed-typescript-map-sentinel';
  const exchange=code+'/sealed-typescript-exchange-sentinel';
  const bindings={node,checker,stageParent,stage,
    writeCanary:stage+'/write-canary.txt',chmodCanary:stage+'/chmod-canary.txt',unlinkCanary:stage+'/unlink-canary.txt',
    renameCanary:stage+'/rename-canary.txt',renameDestination:stage+'/rename-destination.txt',hardlinkCanary:stage+'/hardlink-canary.txt',
    parentReplacement:base+'/sealed-inputs-replaced',allowedWorkspace:workspace,allowedWrite:workspace+'/write-canary.txt',outsideAlias:workspace+'/stage-alias.txt',
    caseWriteCanary:base+'/SEALED-INPUTS/redue-materialization-Canary/write-canary.txt',
    parentSymlinkAlias:workspace+'/stage-parent-alias',
    parentSymlinkWriteCanary:workspace+'/stage-parent-alias/redue-materialization-Canary/write-canary.txt'};
  return freeze({schema:1,scope:'SEALED_NATIVE_STAGE_COMPOSITION_PROPOSAL_ONLY',disabled:true,
    checkerBindings:bindings,mapperBindings:{workspace:workspace+'/map-canary.txt',stage:stage+'/map-canary.txt'},
    exchangeBindings:{base},
    // The checker contains a destructive rename of this WHOLE parent. Do not
    // expose runnable commands: it may also contain an existing prepared stage.
    // A caller's label/digest/boolean cannot prove a synthetic-only namespace.
    // Exchange requires pristine control inventory. It must precede Node's
    // deliberately writable controls; the private mint is not a post-run seal.
    commands:[],proposedCommands:[[exchange],[node,checker],[mapper]],
    nativeRouteAdmission:'REFUSED_PENDING_SYNTHETIC_ONLY_INVENTORY',
    parentDestructiveAssertions:'DEFERRED_RESOURCE_PRESERVATION',
    preservation:{preparedStages:'MUST_NOT_RENAME_REPLACE_OR_MODIFY',stateAndReceipts:'MUST_REMAIN_UNTOUCHED',freshnessClaim:'CALLER_LABEL_OR_BOOLEAN_IS_NOT_PROOF'},
    artifacts:{node:{version:'v22.13.0',sha256:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'},
      checker:{renderedSha256:checkerSha256},mapper:{templateSha256:'14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070',renderedSourceSha256:mapperRenderedSourceSha256,binarySha256:mapperBinarySha256},
      exchange:{templateSha256:'06e5da5dca906063762410f40bea9b7f99662cb6a62934ee50749a7b41162e48',renderedSourceSha256:exchangeRenderedSourceSha256,binarySha256:exchangeBinarySha256}},
    nativeSettings:{file:base+'/claude-host/settings.json',sha256:settingsSha256,
      expectedProtectedParent:stageParent,expectedWritableRoot:base+'/Checkout 空间',expectedProtectedCodeRoot:base+'/prefix',effectiveMatch:'NOT_OBSERVED'},
    originalSixCheckClosure:'SEPARATE_UNCHANGED',assertionComposition:'UNKNOWN',
    prerequisites:['FRESH_SYNTHETIC_ONLY_STAGE_AND_CANARY_NAMESPACES',
      'UNRELATED_HOST_STATE_RECEIPTS_AND_AUTH_ASSETS_UNINSPECTED_AND_PRESERVED',
      'BOUNDED_AUTHORITATIVE_PARENT_INVENTORY_BEFORE_DESTRUCTIVE_ASSERTION',
      'CURRENT_PROTECTED_ARTIFACT_RUNTIME_AND_SETTINGS_BYTES',
      'EXACT_THREE_NATIVE_PROBES_UNDER_SAME_EFFECTIVE_SANDBOX_AND_CREDENTIAL_DENIAL',
      'PRISTINE_EXCHANGE_CONTROL_INVENTORY_BEFORE_NODE_WORKSPACE_MUTATIONS',
      'READABLE_FRESH_SINGLE_LINK_OWNED_MARKERS_AND_DIFFERENT_WORKSPACE_STAGE_INODES',
      'EQUAL_REAL_EFFECTIVE_UID_AND_GID', 'SAME_DEVICE_FOR_STAGE_FILE_AND_OUTSIDE_HARDLINK_DESTINATION',
      'PREPARER_REAPED_WITH_NO_INHERITED_WRITABLE_STAGE_HANDLES_OR_MAPPINGS',
      'CURRENT_PROTECTED_STAGE_PARENT_AND_ANCESTOR_IDENTITIES',
      'NODE_FIXED_BINDINGS_RENDERED_AND_INDEPENDENTLY_REVIEWED',
      'MAPPER_RENDERED_BINARY_AND_PHYSICAL_CURRENCY_NOT_VERIFIED',
      'EXCHANGE_RENDERED_BINARY_AND_PHYSICAL_CURRENCY_NOT_VERIFIED'],
    missingAssertions:['STAGE_CASE_ALIAS_WRITE_DENIAL_NOT_OBSERVED',
      'STAGE_SYMLINK_PARENT_ALIAS_WRITE_DENIAL_NOT_OBSERVED',
      'STAGE_PARENT_ATOMIC_EXCHANGE_DENIAL_NOT_OBSERVED',
      'WHOLE_BASE_ATOMIC_EXCHANGE_NOT_IMPLEMENTED',
      'MAP_SHARED_COMPOSITION_NOT_OBSERVED'],
    classificationRules:{permissionDenial:['EPERM','EACCES'],missingOrCrossDevice:'UNKNOWN',
      linkDeniedAliasWrite:'NOT_PERFORMED_PREREQUISITE_DENIED',linkSucceeded:'FAIL_LATCHED_THEN_SEPARATE_ALIAS_WRITE',
      parentOperation:'RENAME_AWAY_ONLY_NOT_ATOMIC_EXCHANGE',readonlyMappingError:'OS_DESCRIPTOR_CONSTRAINT_NOT_SANDBOX_DENIAL',
      positivelyObservedMutationOrGrant:'FAIL_NOT_ERASED_BY_CLEANUP_UNKNOWN'},
    nativeLaunches:0,modelLaunches:0,filesystemAuthorityAdded:false,nativeEnforcement:'NOT_OBSERVED',sealed:false,reuseEligible:false});
}
