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
import {authorizeCIImport} from '../src/portable-ci-authorization.mjs';
import {importEvidence} from '../src/portable-store.mjs';
import {readPortableCatalog,portableCatalogMatches} from '../src/portable-catalog.mjs';
import {decidePortableEvidence} from '../src/portable-applicability.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const ownerTests={skip:typeof process.getuid!=='function'};
function facts(){return {schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
  command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('definition')},
  platform:{os:'darwin',arch:'arm64',release:'25.1.0'},
  runtime:{version:'v22.13.0',sha256:hash('node'),sharedObjects:[]},
  compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},
  context:{NODE_ENV:hash('absent')},files:[['package.json',hash('manifest')]],
  discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/index.ts',hash('source')]],queriesSha256:hash('queries')}};}
function fixture(t){
  const directory=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-catalog-'))),
    state=path.join(directory,'redue-state'),root=path.join(directory,'project'),configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(state,{mode:0o700});fs.mkdirSync(root);fs.writeFileSync(configFile,'{}');
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',config:configFile,root,state}));
  const captured=facts(),envelope=result=>encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:randomUUID(),check:'producer-typecheck',result,invocation:{status:'exited',exitCode:result==='PASS'?0:1,signal:null},complete:true},facts:captured});
  const pass=envelope('PASS'),fail=envelope('FAIL'),bytes=Buffer.from(canonical(fail)+'\n'),artifactFile=path.join(directory,'evidence.json');fs.writeFileSync(artifactFile,bytes);
  const expected={configFile,root},importOptions={state,...expected,check:'typecheck'};
  importEvidence({...importOptions,bytes:canonical(pass),acceptDigest:pass.digest,apply:true});
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
    repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',ref:'refs/heads/main',
    sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:hash(bytes),evidenceDigest:fail.digest,
    evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};
  const differentPolicy={...policy,artifactSha256:hash('different-artifact'),evidenceDigest:hash('different-evidence')};
  const policyFile=path.join(state,'portable-producers-v1.json'),registry={schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy,differentPolicy]};
  const registryBytes=canonical(registry);fs.writeFileSync(policyFile,registryBytes,{mode:0o600});
  const snapshot=readProducerPolicySnapshot(policyFile),ghExecutable=path.join(directory,'reviewed-gh');fs.writeFileSync(ghExecutable,'controlled fixture gh');
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  // Controlled post-verification fixture, not live CI/signature acceptance.
  const output=[{attestation:{bundle:{controlledFixture:true},bundle_url:''},verificationResult:{
    mediaType:'application/vnd.dev.sigstore.verificationresult+json;version=0.1',
    statement:{_type:'https://in-toto.io/Statement/v1',subject:[{name:'redue-portable-evidence.json',digest:{sha256:policy.artifactSha256}}],
      predicateType:CI_PREDICATE_TYPE,predicate:{schema:1,evidenceDigest:fail.digest,evidenceInterpretation:PORTABLE_INTERPRETATION}},
    signature:{certificate:{subjectAlternativeName:san,issuer:policy.issuer,buildSignerURI:san,buildSignerDigest:policy.signerCommit,
      runnerEnvironment:'github-hosted',sourceRepositoryURI:'https://github.com/msiric/redue',sourceRepositoryDigest:policy.sourceCommit,
      sourceRepositoryRef:policy.ref,sourceRepositoryIdentifier:policy.repositoryId,sourceRepositoryOwnerURI:'https://github.com/msiric',
      sourceRepositoryOwnerIdentifier:policy.ownerId,sourceRepositoryVisibilityAtSigning:'public',buildTrigger:'workflow_dispatch'}},
    verifiedTimestamps:[{type:'Tlog',uri:'https://rekor.sigstore.dev',timestamp:'2026-10-10T00:00:00Z'}]}}];
  let verifierCalls=0;t.mock.method(childProcess,'execFileSync',(_file,args)=>{verifierCalls++;return args[0]==='--version'?'gh version 2.79.0\n':canonical(output);});
  const token=authorizeCIImport({state,...expected,policySnapshot:snapshot,policyDigest:snapshot.policies[0].digest,
    artifactFile,ghExecutable,ghExecutableSha256:hash('controlled fixture gh')});
  importEvidence({...importOptions,bytes,ciAuthorization:token,apply:true});
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const decide=catalog=>decidePortableEvidence({check:'typecheck',facts:captured,snapshot:catalog,
    prerequisites:{originIntervalSupported:true,understood:true,observationHealthy:true,callerValidated:true,complete:true}});
  return {state,expected,pass,fail,policyFile,registry,registryBytes,decide,differentPolicyDigest:snapshot.policies[1].digest,calls:()=>verifierCalls};
}

test('current authenticated FAIL conflicts with old manual PASS without assuming producer order',ownerTests,t=>{
  const f=fixture(t),catalog=readPortableCatalog(f.state,f.expected);
  assert.equal(catalog.error,undefined);assert.equal(catalog.records.length,2);
  assert.equal(portableCatalogMatches(f.state,f.expected,catalog.revision),true);
  const decision=f.decide(catalog);assert.equal(decision.reason,'PORTABLE_APPLICABLE_CONFLICT');
  assert.equal(decision.reuse_eligible,false);assert.equal(decision.local_reuse_blocked,true);
  assert.deepEqual(new Set(decision.applicable.map(item=>item.origin.result)),new Set(['PASS','FAIL']));
  assert.equal(f.calls(),2,'catalog inspection does not launch authentication');
});

for(const change of ['revision','removed','malformed','unsafe-permissions','controlled-unreadable'])
  test(`CI policy ${change} withholds whole catalog authority and cannot resurrect old PASS`,ownerTests,t=>{
    const f=fixture(t),before=readPortableCatalog(f.state,f.expected);
    const selectedBefore=fs.readFileSync(path.join(f.state,'portable-imports-v1.json'));
    let restore=()=>{fs.writeFileSync(f.policyFile,f.registryBytes,{mode:0o600});fs.chmodSync(f.policyFile,0o600);};
    if(change==='revision')fs.writeFileSync(f.policyFile,canonical({...f.registry,revision:2}));
    if(change==='removed')fs.unlinkSync(f.policyFile);
    if(change==='malformed')fs.writeFileSync(f.policyFile,'{"schema":');
    if(change==='unsafe-permissions')fs.chmodSync(f.policyFile,0o620);
    if(change==='controlled-unreadable'){
      const open=fs.openSync,hook=t.mock.method(fs,'openSync',(file,...args)=>{
        if(file===f.policyFile)throw Object.assign(new Error('controlled access denial'),{code:'EACCES'});return open(file,...args);
      });restore=()=>hook.mock.restore();
    }
    const invalid=readPortableCatalog(f.state,f.expected);
    assert.equal(invalid.revision,null);assert.equal(invalid.error.code,'PORTABLE_PRODUCER_POLICY_UNAVAILABLE');
    assert.equal(invalid.records.length,2);assert(invalid.records.some(item=>item.digest===f.fail.digest&&item.acceptance==='github-ci-v1'));
    assert.equal(portableCatalogMatches(f.state,f.expected,before.revision),false);
    const decision=f.decide(invalid);assert.equal(decision.reason,'PORTABLE_CATALOG_UNAVAILABLE');assert.equal(decision.reuse_eligible,false);
    assert.deepEqual(fs.readFileSync(path.join(f.state,'portable-imports-v1.json')),selectedBefore);
    restore();const recovered=readPortableCatalog(f.state,f.expected);
    assert.equal(recovered.revision,before.revision);assert.equal(recovered.error,undefined);
    assert.equal(f.decide(recovered).reason,'PORTABLE_APPLICABLE_CONFLICT','restoration does not manufacture new PASS or local execution');
    assert.equal(f.calls(),2);
  });

test('untrusted artifact cannot supply a policy pathname or poison a valid manual record',ownerTests,t=>{
  const f=fixture(t);fs.unlinkSync(f.policyFile);
  const selected=path.join(f.state,'portable-imports-v1.json'),value=JSON.parse(fs.readFileSync(selected));
  const record=value.records.find(item=>item.acceptance==='github-ci-v1');
  record.ciBinding.policy.path=path.join(f.state,'artifact-selected-policy.json');fs.writeFileSync(selected,canonical(value));
  const catalog=readPortableCatalog(f.state,f.expected);assert.equal(catalog.revision,null);assert(catalog.error);
  assert.equal(f.decide(catalog).reuse_eligible,false);assert.equal(f.calls(),2);
});

for(const drift of ['outer-artifact','refresh','selected-policy'])
  test(`valid-shaped persisted CI ${drift} drift cannot gain authority from unrelated current policy`,ownerTests,t=>{
    const f=fixture(t),before=readPortableCatalog(f.state,f.expected),file=path.join(f.state,'portable-imports-v1.json'),bytes=fs.readFileSync(file);
    const selected=JSON.parse(bytes),record=selected.records.find(item=>item.acceptance==='github-ci-v1');
    if(drift==='outer-artifact')record.ciBinding.authentication.artifactSha256=hash('not-the-authenticated-artifact');
    if(drift==='refresh')record.ciBinding.authentication.refresh='offline-identified';
    if(drift==='selected-policy')record.ciBinding.policy.policyDigest=f.differentPolicyDigest;
    fs.writeFileSync(file,canonical(selected));
    const catalog=readPortableCatalog(f.state,f.expected);
    assert.equal(catalog.revision,null);assert.equal(catalog.error.code,'PORTABLE_PRODUCER_POLICY_UNAVAILABLE');
    assert.equal(catalog.records.length,2,'accepted FAIL is retained, not discarded to reveal old PASS');
    assert.equal(portableCatalogMatches(f.state,f.expected,before.revision),false);
    assert.equal(f.decide(catalog).reuse_eligible,false);
    fs.writeFileSync(file,bytes);const recovered=readPortableCatalog(f.state,f.expected);
    assert.equal(recovered.error,undefined);assert.equal(recovered.records.length,2);
    assert.equal(f.decide(recovered).reason,'PORTABLE_APPLICABLE_CONFLICT');
    assert.equal(portableCatalogMatches(f.state,f.expected,before.revision),false,'changed selector identity never restores a prior publication token');
    assert.equal(f.calls(),2,'currency checks never rerun verifier implicitly');
  });
