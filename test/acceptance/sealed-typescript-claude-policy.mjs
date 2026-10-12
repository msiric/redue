// Pure, disabled proposal for the already approved native receiver resources.
// No settings write, filesystem inspection, launch, authentication or authority.
// Only local provisioning selects the stage. Imported paths are never authority.
import {posix as path} from 'node:path';
import {prepareClaudeReceiverInvocation} from './portable-claude-invocation.mjs';

const keys=['base','claudeExecutable','claudeSha256','claudeVersion','maxTurns','timeoutMs','stagedRoot'];
const fail=()=>{throw Object.assign(Error('SEALED_CLAUDE_POLICY_INVALID'),{code:'SEALED_CLAUDE_POLICY_INVALID'});};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function prepareSealedClaudeReceiverPolicy(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||
    Reflect.ownKeys(options).some(key=>!keys.includes(key))||
    !['base','claudeExecutable','claudeSha256','claudeVersion','stagedRoot'].every(key=>Object.hasOwn(options,key))||
    Reflect.ownKeys(options).some(key=>!Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail();
  const {stagedRoot,...invocationOptions}=options;
  // Construct the existing fixed receiver policy; do not accept a caller's
  // mutable settings, permission rules, credentials or imported descriptor.
  let receiver;try{receiver=prepareClaudeReceiverInvocation(invocationOptions);}catch{fail();}
  const stageParent=path.join(options.base,'sealed-inputs');
  if(typeof stagedRoot!=='string'||path.dirname(stagedRoot)!==stageParent||
    !/^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(stagedRoot))||
    path.normalize(stagedRoot)!==stagedRoot)fail();
  receiver.settings_proposed.sandbox.filesystem.denyWrite.push(stageParent);
  receiver.blockers.push('NATIVE_STAGE_AND_ANCESTOR_WRITE_DENIAL_NOT_OBSERVED',
    'CURRENT_STAGE_BINDINGS_AND_COMPLETE_COMPILER_NAMESPACE_NOT_VERIFIED');
  // Exact parent deny is additional restriction only. Native187 source adds
  // ancestor create/unlink guards; actual enforcement still needs observation.
  // It does not protect an unrelated ancestor/node_modules candidate by itself.
  return freeze({...receiver,scope:'SEALED_NATIVE_RECEIVER_POLICY_PROPOSAL_ONLY',
    stagedRoot,stageParent,recipe:'npm-sealed-typescript@1',
    settingsDelta:{addedDenyWrite:[stageParent]},
    physicalBindingsVerified:false,namespaceVerified:false,sealed:false,reuseEligible:false,
    inferencePermitted:false,actualNativeEnforcement:'NOT_TESTED'});
}
