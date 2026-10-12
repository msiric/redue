// Read every selected envelope, not merely selector metadata. This guard is an
// independent authority domain from local receipt selection.
import fs from 'node:fs';
import path from 'node:path';
import {readImportedSnapshot} from './portable-store.mjs';
import {producerPolicyBindingCurrent} from './portable-producer-policy.mjs';
function present(file){try{fs.lstatSync(file);return true;}catch(error){return error.code!=='ENOENT';}}
export function readPortableCatalog(state,expected){
  const selector=present(path.join(state,'portable-imports-v1.json')),pending=present(path.join(state,'portable-import-pending-v1.json'));
  if(!selector&&!pending){
    if(present(path.join(state,'portable-evidence-v1')))return {revision:null,records:[],error:{
      code:'PORTABLE_SELECTION_MISSING',reason:'Persisted portable evidence has no readable selection; owner inspection is required'}};
    return {revision:'none',records:[]};
  }
  const snapshot=readImportedSnapshot(state,expected);
  if(snapshot.error)return snapshot;
  // Persisted authentication is history, not continuing producer authority.
  // Withhold the entire decision on revoked accepted evidence: silently
  // dropping an accepted FAIL could resurrect an older PASS.
  if(snapshot.records.some(record=>record.acceptance==='github-ci-v1'&&
    !producerPolicyBindingCurrent(path.join(state,'portable-producers-v1.json'),record.ciBinding.policy,{
      evidenceDigest:record.digest,evidenceInterpretation:record.envelope.statement.predicate.interpretation,
      artifactSha256:record.ciBinding.authentication.artifactSha256,refresh:record.ciBinding.authentication.refresh})))
    return {revision:null,records:snapshot.records,error:{code:'PORTABLE_PRODUCER_POLICY_UNAVAILABLE',
      reason:'Current authoritative producer policy does not authorize previously accepted CI evidence'}};
  return snapshot;
}
export function portableCatalogMatches(state,expected,revision){
  const current=readPortableCatalog(state,expected);
  return !current.error&&typeof revision==='string'&&current.revision===revision;
}
