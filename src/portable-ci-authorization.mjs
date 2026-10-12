// Process-local authentication authorization, never constructible from imported
// JSON. This does not write policy, grant recipient applicability or persist a
// reusable authorization token. The CLI supplies locally selected owned paths.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical,parseEnvelope,PortableEnvelopeError} from './portable-envelope.mjs';
import {verifyCIArtifact} from './portable-ci-trust.mjs';
import {revalidateProducerPolicySnapshot} from './portable-producer-policy.mjs';
const minted=new WeakMap(),HEX=/^[a-f0-9]{64}$/;
export const CI_ACCEPTANCE_INTERPRETATION='redue-github-ci-acceptance@1';
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=(code,message)=>{throw new PortableEnvelopeError(code,message);};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function recipient(value){
  if(!value||!['state','configFile','root'].every(key=>typeof value[key]==='string'&&path.isAbsolute(value[key])&&!value[key].includes('\0')))
    fail('PORTABLE_CI_ACCEPTANCE','Select the local recipient configuration and owned state');
  return Object.freeze(Object.fromEntries(['state','configFile','root'].map(key=>[key,path.resolve(value[key])])));
}
const registry=scope=>path.join(scope.state,'portable-producers-v1.json');

// Persisted metadata is descriptive, not an authorization. Every recipient
// decision must separately establish currency from its authoritative registry.
export function validateCIImportBinding(value){
  if(!exact(value,['schema','interpretation','policy','authentication'])||value.schema!==1||value.interpretation!==CI_ACCEPTANCE_INTERPRETATION||
    !exact(value.policy,['revision','contentDigest','policyDigest'])||!Number.isSafeInteger(value.policy.revision)||value.policy.revision<1||
    !['contentDigest','policyDigest'].every(key=>typeof value.policy[key]==='string'&&HEX.test(value.policy[key]))||
    !exact(value.authentication,['verification','artifactSha256','evidenceDigest','verifierSha256','refresh'])||
    value.authentication.verification!=='github-cli-2.79@1'||!['required','offline-identified'].includes(value.authentication.refresh)||
    !['artifactSha256','evidenceDigest','verifierSha256'].every(key=>typeof value.authentication[key]==='string'&&HEX.test(value.authentication[key])))
    fail('PORTABLE_CI_ACCEPTANCE','Persisted CI acceptance metadata is incompatible');
  return value;
}

export function authorizeCIImport({state,configFile,root,policySnapshot,policyDigest,artifactFile,bundleFile=null,ghExecutable,ghExecutableSha256}){
  const scope=recipient({state,configFile,root});
  if(typeof policyDigest!=='string'||!HEX.test(policyDigest)||
    !revalidateProducerPolicySnapshot(policySnapshot,{expectedFile:registry(scope)}))
    fail('PORTABLE_CI_POLICY_CHANGED','The selected authoritative producer policy is unavailable or changed');
  const selected=policySnapshot.policies.find(item=>item.digest===policyDigest);
  if(!selected)fail('PORTABLE_CI_ACCEPTANCE','Select one explicitly approved current producer policy');
  const report=verifyCIArtifact({artifactFile,policy:selected.policy,bundleFile,ghExecutable,ghExecutableSha256});
  if(report.policyDigest!==policyDigest||!revalidateProducerPolicySnapshot(policySnapshot,{expectedFile:registry(scope)}))
    fail('PORTABLE_CI_POLICY_CHANGED','Producer policy changed during authentication');
  const binding=validateCIImportBinding({schema:1,interpretation:CI_ACCEPTANCE_INTERPRETATION,
    policy:{revision:policySnapshot.revision,contentDigest:policySnapshot.contentDigest,policyDigest},
    authentication:{verification:report.verification,artifactSha256:report.artifactSha256,evidenceDigest:report.evidenceDigest,
      verifierSha256:report.verifierSha256,refresh:report.refresh}});
  Object.freeze(binding.policy);Object.freeze(binding.authentication);Object.freeze(binding);
  const token=Object.freeze({schema:1,verification:report.verification,evidenceDigest:report.evidenceDigest,
    producer_verified:true,producer_accepted:false,reuse_eligible:false});
  minted.set(token,{scope,policySnapshot,binding});return token;
}

// Called repeatedly by the store at durable acceptance barriers, under its run
// lock. Exact original artifact bytes AND canonical meaning must match; the
// immutable store may use canonical encoding, but does not forge raw provenance.
export function resolveCIImportAuthorization(token,{state,configFile,root,bytes}){
  const authority=minted.get(token),scope=recipient({state,configFile,root});
  if(!authority||canonical(scope)!==canonical(authority.scope))
    fail('PORTABLE_CI_ACCEPTANCE','Authenticated CI authorization is missing or belongs to another recipient');
  if(!revalidateProducerPolicySnapshot(authority.policySnapshot,{expectedFile:registry(scope)}))
    fail('PORTABLE_CI_POLICY_CHANGED','Authoritative producer policy changed before acceptance completed');
  const envelope=parseEnvelope(bytes);
  if(sha(bytes)!==authority.binding.authentication.artifactSha256||envelope.digest!==authority.binding.authentication.evidenceDigest)
    fail('PORTABLE_CI_ACCEPTANCE','Authenticated authorization does not bind these exact artifact bytes and meaning');
  return authority.binding;
}
