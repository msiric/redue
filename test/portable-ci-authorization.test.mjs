import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {CI_PREDICATE_TYPE} from '../src/portable-ci-trust.mjs';
import {readProducerPolicySnapshot} from '../src/portable-producer-policy.mjs';
import {authorizeCIImport,resolveCIImportAuthorization,validateCIImportBinding} from '../src/portable-ci-authorization.mjs';
import {importEvidence,readImportedSnapshot} from '../src/portable-store.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const ownerTests={skip:typeof process.getuid!=='function'};
function fixture(t){
  const directory=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-authorization-'))),
    state=path.join(directory,'redue-state'),root=path.join(directory,'project'),configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(state,{mode:0o700});fs.mkdirSync(root);fs.writeFileSync(configFile,'{}');
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',config:configFile,root,state}));
  const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:randomUUID(),check:'typecheck',result:'FAIL',invocation:{status:'exited',exitCode:1,signal:null},complete:false},facts:null});
  // The authenticated raw bytes intentionally differ from store canonical bytes.
  const bytes=Buffer.from(canonical(envelope)+'\n'),artifactFile=path.join(directory,'redue-portable-evidence.json');fs.writeFileSync(artifactFile,bytes);
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
    repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',ref:'refs/heads/main',
    sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:hash(bytes),evidenceDigest:envelope.digest,
    evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};
  const policyFile=path.join(state,'portable-producers-v1.json'),registry={schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy]};
  const writeRegistry=value=>fs.writeFileSync(policyFile,canonical(value),{mode:0o600});writeRegistry(registry);
  const policySnapshot=readProducerPolicySnapshot(policyFile),policyDigest=policySnapshot.policies[0].digest;
  const ghExecutable=path.join(directory,'reviewed-gh'),ghExecutableSha256=hash('controlled fixture gh');fs.writeFileSync(ghExecutable,'controlled fixture gh');
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  // Controlled verified-output fixture, NOT a live signed CI demonstration.
  const output=[{attestation:{bundle:{controlledFixture:true},bundle_url:''},verificationResult:{
    mediaType:'application/vnd.dev.sigstore.verificationresult+json;version=0.1',
    statement:{_type:'https://in-toto.io/Statement/v1',subject:[{name:'redue-portable-evidence.json',digest:{sha256:policy.artifactSha256}}],
      predicateType:CI_PREDICATE_TYPE,predicate:{schema:1,evidenceDigest:envelope.digest,evidenceInterpretation:PORTABLE_INTERPRETATION}},
    signature:{certificate:{subjectAlternativeName:san,issuer:policy.issuer,buildSignerURI:san,buildSignerDigest:policy.signerCommit,
      runnerEnvironment:'github-hosted',sourceRepositoryURI:'https://github.com/msiric/redue',sourceRepositoryDigest:policy.sourceCommit,
      sourceRepositoryRef:policy.ref,sourceRepositoryIdentifier:policy.repositoryId,sourceRepositoryOwnerURI:'https://github.com/msiric',
      sourceRepositoryOwnerIdentifier:policy.ownerId,sourceRepositoryVisibilityAtSigning:'public',buildTrigger:'workflow_dispatch'}},
    verifiedTimestamps:[{type:'Tlog',uri:'https://rekor.sigstore.dev',timestamp:'2026-10-10T00:00:00Z'}]}}];
  const response={afterVerify:null,calls:0};t.mock.method(childProcess,'execFileSync',(_file,args)=>{
    response.calls++;if(args[0]==='--version')return 'gh version 2.79.0\n';response.afterVerify?.();return canonical(output);
  });
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const options={state,root,configFile,policySnapshot,policyDigest,artifactFile,ghExecutable,ghExecutableSha256};
  const importOptions={state,root,configFile,check:'local-typecheck',bytes};
  return {directory,state,root,configFile,bytes,envelope,policyFile,registry,writeRegistry,response,options,importOptions};
}
test('explicit authenticated token is process-local, recipient-scoped, and binds original raw bytes and meaning',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options);assert.equal(token.producer_accepted,false);assert.equal(token.reuse_eligible,false);
  const binding=resolveCIImportAuthorization(token,f.importOptions);assert.equal(binding.authentication.artifactSha256,hash(f.bytes));
  assert.equal(binding.authentication.evidenceDigest,f.envelope.digest);assert.ok(Object.isFrozen(binding));
  assert.throws(()=>resolveCIImportAuthorization(JSON.parse(JSON.stringify(token)),f.importOptions),{code:'PORTABLE_CI_ACCEPTANCE'});
  assert.throws(()=>resolveCIImportAuthorization(token,{...f.importOptions,root:f.root+'-other'}),{code:'PORTABLE_CI_ACCEPTANCE'});
  assert.throws(()=>resolveCIImportAuthorization(token,{...f.importOptions,bytes:canonical(f.envelope)}),{code:'PORTABLE_CI_ACCEPTANCE'});
  assert.equal(f.response.calls,2);
});
test('forged or wrong-registry snapshots and missing selected policies launch no verifier',ownerTests,t=>{
  const f=fixture(t);assert.throws(()=>authorizeCIImport({...f.options,policySnapshot:JSON.parse(JSON.stringify(f.options.policySnapshot))}));
  assert.throws(()=>authorizeCIImport({...f.options,policyDigest:hash('not-approved')}));
  const other=path.join(f.state,'other-registry.json');fs.writeFileSync(other,canonical(f.registry),{mode:0o600});
  assert.throws(()=>authorizeCIImport({...f.options,policySnapshot:readProducerPolicySnapshot(other)}),{code:'PORTABLE_CI_POLICY_CHANGED'});
  assert.equal(f.response.calls,0);
});
test('policy mutation during authentication mints no authorization and changes no imports',ownerTests,t=>{
  const f=fixture(t);f.response.afterVerify=()=>f.writeRegistry({...f.registry,revision:2});
  assert.throws(()=>authorizeCIImport(f.options),{code:'PORTABLE_CI_POLICY_CHANGED'});
  assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
});
test('authenticated preview writes nothing and apply preserves exact historical outcome without local execution inference',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options),before=fs.readdirSync(f.state).sort();
  const preview=importEvidence({...f.importOptions,ciAuthorization:token});assert.equal(preview.acceptance,'github-ci-v1');
  assert.deepEqual(fs.readdirSync(f.state).sort(),before);assert.equal(f.response.calls,2,'store preview performs no verifier calls');
  importEvidence({...f.importOptions,ciAuthorization:token,apply:true});
  const record=readImportedSnapshot(f.state,f).records[0];assert.equal(record.acceptance,'github-ci-v1');
  assert.equal(record.envelope.statement.predicate.origin.result,'FAIL');assert.equal(record.ciBinding.authentication.evidenceDigest,f.envelope.digest);
  assert(!JSON.stringify(record.ciBinding).includes(f.state));assert(!JSON.stringify(record.ciBinding).includes(f.configFile));
  importEvidence({...f.importOptions,apply:true});assert.equal(readImportedSnapshot(f.state,f).records[0].acceptance,'github-ci-v1');
  assert.throws(()=>importEvidence({...f.importOptions,acceptDigest:f.envelope.digest,apply:true}),{code:'PORTABLE_ACCEPTANCE'});
  assert.equal(f.response.calls,2,'ordinary repeat never authenticates or grants new trust');
});
test('revocation before apply or repeated accepted import refuses without clearing the accepted history',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options);importEvidence({...f.importOptions,ciAuthorization:token,apply:true});
  const selector=path.join(f.state,'portable-imports-v1.json'),before=fs.readFileSync(selector);
  f.writeRegistry({...f.registry,revision:2,policies:[]});
  assert.throws(()=>importEvidence({...f.importOptions,ciAuthorization:token,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});
  assert.throws(()=>importEvidence({...f.importOptions,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});
  assert.deepEqual(fs.readFileSync(selector),before);assert.equal(readImportedSnapshot(f.state,f).records[0].envelope.statement.predicate.origin.result,'FAIL');
});
test('policy is revalidated after acquiring the existing run lock, before any import writes',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options),mkdir=fs.mkdirSync;
  const hook=t.mock.method(fs,'mkdirSync',(file,options)=>{
    const result=mkdir(file,options);if(file===path.join(f.state,'run.lock'))f.writeRegistry({...f.registry,revision:2,policies:[]});return result;
  });
  assert.throws(()=>importEvidence({...f.importOptions,ciAuthorization:token,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});hook.mock.restore();
  for(const name of ['portable-imports-v1.json','portable-import-pending-v1.json','portable-evidence-v1','run.lock'])assert(!fs.existsSync(path.join(f.state,name)));
});
test('revocation after selector persistence leaves incomplete guard and exact accepted FAIL transaction intact',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options),rename=fs.renameSync;
  const hook=t.mock.method(fs,'renameSync',(from,to)=>{rename(from,to);if(to===path.join(f.state,'portable-imports-v1.json'))f.writeRegistry({...f.registry,revision:2,policies:[]});});
  assert.throws(()=>importEvidence({...f.importOptions,ciAuthorization:token,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});hook.mock.restore();
  const pending=path.join(f.state,'portable-import-pending-v1.json'),saved=fs.readFileSync(pending);
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  assert.equal(JSON.parse(saved).selection.records[0].acceptance,'github-ci-v1');
  assert.throws(()=>importEvidence({...f.importOptions,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});assert.deepEqual(fs.readFileSync(pending),saved);
  f.writeRegistry(f.registry);const fresh=authorizeCIImport({...f.options,policySnapshot:readProducerPolicySnapshot(f.policyFile)});
  importEvidence({...f.importOptions,ciAuthorization:fresh,apply:true});assert(!fs.existsSync(pending));
  assert.equal(readImportedSnapshot(f.state,f).records[0].envelope.statement.predicate.origin.result,'FAIL');
});
test('interrupted accepted CI FAIL cannot be repaired by replaying an older manually accepted PASS',ownerTests,t=>{
  const f=fixture(t),predicate=JSON.parse(JSON.stringify(f.envelope.statement.predicate));
  predicate.origin.runId=randomUUID();predicate.origin.result='PASS';predicate.origin.invocation.exitCode=0;
  const old=encodeEnvelope(predicate),oldOptions={...f.importOptions,bytes:canonical(old),acceptDigest:old.digest,apply:true};importEvidence(oldOptions);
  const token=authorizeCIImport(f.options),rename=fs.renameSync;
  const hook=t.mock.method(fs,'renameSync',(from,to)=>{rename(from,to);if(to===path.join(f.state,'portable-imports-v1.json'))f.writeRegistry({...f.registry,revision:2,policies:[]});});
  assert.throws(()=>importEvidence({...f.importOptions,ciAuthorization:token,apply:true}),{code:'PORTABLE_CI_POLICY_CHANGED'});hook.mock.restore();
  const pending=path.join(f.state,'portable-import-pending-v1.json'),before=fs.readFileSync(pending);
  assert.throws(()=>importEvidence(oldOptions),{code:'PORTABLE_IMPORT_INCOMPLETE'});
  assert.deepEqual(fs.readFileSync(pending),before);assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  assert.equal(JSON.parse(before).selection.records.length,2);assert.ok(JSON.parse(before).selection.records.some(record=>record.digest===f.envelope.digest&&record.acceptance==='github-ci-v1'));
});
test('first pending CI acceptance recovers only the exact intended authenticated import',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options),rename=fs.renameSync;
  const hook=t.mock.method(fs,'renameSync',(from,to)=>{if(to===path.join(f.state,'portable-imports-v1.json'))throw Object.assign(Error('controlled failure'),{code:'EIO'});return rename(from,to);});
  assert.throws(()=>importEvidence({...f.importOptions,ciAuthorization:token,apply:true}),{code:'PORTABLE_IMPORT_FAILED'});hook.mock.restore();
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  assert.throws(()=>importEvidence({...f.importOptions,apply:true}),{code:'PORTABLE_IMPORT_INCOMPLETE'});
  importEvidence({...f.importOptions,ciAuthorization:token,apply:true});assert.equal(readImportedSnapshot(f.state,f).records[0].acceptance,'github-ci-v1');
  assert.equal(f.response.calls,2,'exact transaction retry does not automatically repeat authentication');
});
test('persisted CI metadata is strict descriptive binding, never a mintable token',ownerTests,t=>{
  const f=fixture(t),token=authorizeCIImport(f.options),binding=resolveCIImportAuthorization(token,f.importOptions);
  for(const mutate of [b=>b.policy.revision=0,b=>b.policy.path=f.policyFile,b=>b.authentication.evidenceDigest='wrong',
    b=>b.authentication.verification='trust-me',b=>b.authentication.refresh='allow-stale',b=>b.extra=true]){
    const copy=JSON.parse(JSON.stringify(binding));mutate(copy);assert.throws(()=>validateCIImportBinding(copy),{code:'PORTABLE_CI_ACCEPTANCE'});
  }
  importEvidence({...f.importOptions,ciAuthorization:token,apply:true});
  const file=path.join(f.state,'portable-imports-v1.json'),value=JSON.parse(fs.readFileSync(file));value.records[0].ciBinding.authentication.evidenceDigest=hash('other');
  fs.writeFileSync(file,canonical(value));assert.equal(readImportedSnapshot(f.state,f).records.length,0);
});
