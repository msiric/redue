// Opt-in pending configuration/proposal, not executable or portable authority. The enforced
// execution/namespace boundary must be established separately before activation.
import fs from 'node:fs';
import path from 'node:path';
import {directProject} from './direct-typescript.mjs';
import {canonical} from './portable-envelope.mjs';
import {createHash} from 'node:crypto';
import {portableRuntimeInterpretation} from './portable-runtime.mjs';

import {sealedTypeScriptInterpretation,sealedTypeScriptCommand,sealedTypeScriptPending} from './sealed-typescript-contract.mjs';
export {sealedTypeScriptInterpretation,sealedTypeScriptQualification,sealedTypeScriptCommand,sealedTypeScriptPending,assertPendingSealedTypeScriptCheck} from './sealed-typescript-contract.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
export function previewSealedTypeScriptRecipe(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||
    Reflect.ownKeys(options).length!==2||!['root','script'].every(key=>
      Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))
    fail('SEALED_RECIPE_OPTIONS');
  const {root,script}=options;
  if(typeof root!=='string'||!path.isAbsolute(root)||path.resolve(root)!==root||
    typeof script!=='string'||!script||/[\u0000-\u001f\u007f]/u.test(script))fail('SEALED_RECIPE_OPTIONS');
  if(fs.realpathSync(root)!==root||!fs.lstatSync(root).isDirectory())fail('SEALED_RECIPE_ROOT');
  // Existing implementation/environment/script checks run before assigning a
  // new obligation identity. Never authorize an arbitrary replacement by label.
  const compiler=directProject(root,script);
  if(compiler.version!=='5.5.2')fail('SEALED_COMPILER_UNSUPPORTED');
  const recipe={interpretation:sealedTypeScriptInterpretation,script,
    command:[...sealedTypeScriptCommand],
    cwd:'@sealed-root',compiler:{version:compiler.version,sha256:compiler.digest},
    requiredProfile:{platform:'darwin',arch:'arm64',release:'25.6.0',node:'v22.13.0',
      runtimeInterpretation:portableRuntimeInterpretation},
    obligation:'direct compiler verification of the explicitly prepared stable input tree',
    namespaceInterpretation:'pending-local-staged-query-validation@1'};
  return freeze({schema:1,recipe,
    definitionSha256:createHash('sha256').update(canonical(recipe)).digest('hex'),
    discoveredScript:'tsc --noEmit',packageJsonChanged:false,
    npmExecution:false,lifecycleExecution:false,existingChecksConverted:false,
    sealed:false,executable:false,reuseEligible:false,
    reason:sealedTypeScriptPending});
}
