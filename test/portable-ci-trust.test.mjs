import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope} from '../src/portable-envelope.mjs';
import {verifyCIArtifact,validateCIPolicy,ciVerifyArguments,CI_PREDICATE_TYPE} from '../src/portable-ci-trust.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
function fixture(t){
  const directory=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-trust-'))),
    artifactFile=path.join(directory,'redue-portable-evidence.json');
  const envelope=encodeEnvelope({schema:1,interpretation:'redue-portable-direct-typescript@1',
    origin:{runId:randomUUID(),check:'typecheck',result:'PASS',invocation:{status:'exited',exitCode:0,signal:null},complete:false},facts:null});
  fs.writeFileSync(artifactFile,canonical(envelope));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
    repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',
    ref:'refs/heads/main',sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),
    artifactSha256:hash(fs.readFileSync(artifactFile)),evidenceDigest:envelope.digest,
    evidenceInterpretation:'redue-portable-direct-typescript@1',refresh:'required',bundleSha256:null};
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  // Controlled post-verification fixture derived from pinned gh/sigstore output
  // types. It is NOT a signed bundle or live CI authentication demonstration.
  const output=[{attestation:{bundle:{controlledFixture:true},bundle_url:''},verificationResult:{
    mediaType:'application/vnd.dev.sigstore.verificationresult+json;version=0.1',
    statement:{_type:'https://in-toto.io/Statement/v1',subject:[{name:'redue-portable-evidence.json',digest:{sha256:policy.artifactSha256}}],
      predicateType:CI_PREDICATE_TYPE,predicate:{schema:1,evidenceDigest:envelope.digest,evidenceInterpretation:policy.evidenceInterpretation}},
    signature:{certificate:{certificateIssuer:'controlled fixture issuer',subjectAlternativeName:san,issuer:policy.issuer,
      buildSignerURI:san,buildSignerDigest:policy.signerCommit,runnerEnvironment:'github-hosted',
      sourceRepositoryURI:'https://github.com/msiric/redue',sourceRepositoryDigest:policy.sourceCommit,
      sourceRepositoryRef:policy.ref,sourceRepositoryIdentifier:policy.repositoryId,
      sourceRepositoryOwnerURI:'https://github.com/msiric',sourceRepositoryOwnerIdentifier:policy.ownerId,
      sourceRepositoryVisibilityAtSigning:'public',buildTrigger:'workflow_dispatch'}},
    verifiedTimestamps:[{type:'Tlog',uri:'https://rekor.sigstore.dev',timestamp:'2026-10-10T00:00:00Z'}]}}];
  const calls=[];
  const response={output,version:'gh version 2.79.0 (2025-09-08)\n',error:null,afterVerify:null};
  t.mock.method(childProcess,'execFileSync',(executable,args,options)=>{
    calls.push({executable,args,options});
    if(args[0]==='--version')return response.version;
    if(response.error)throw response.error;
    response.afterVerify?.();return typeof response.output==='string'?response.output:JSON.stringify(response.output);
  });
  const options={artifactFile,policy,ghExecutable:path.join(directory,'reviewed-gh')};
  return {directory,options,policy,response,calls,envelope};
}
test('explicit controlled verifier matches every identity and digest without accepting import',t=>{
  const f=fixture(t),report=verifyCIArtifact(f.options);
  assert.equal(report.producer_verified,true);assert.equal(report.producer_accepted,false);assert.equal(report.reuse_eligible,false);
  assert.equal(report.globally_latest,false);assert.equal(report.evidenceDigest,f.envelope.digest);
  assert.equal(f.calls.length,2);const args=f.calls[1].args;
  for(const flag of ['--hostname','--repo','--cert-identity','--cert-oidc-issuer','--source-ref','--source-digest',
    '--signer-digest','--deny-self-hosted-runners','--predicate-type','--digest-alg','--format'])assert(args.includes(flag));
  assert(!args.includes('--signer-workflow'),'mutually exclusive identity flags are not combined');
  assert.equal(f.calls[1].options.timeout,30000);assert.equal(f.calls[1].options.maxBuffer,1024*1024);
});
test('unreviewed policy/fork route fails before launching verification',t=>{
  const f=fixture(t);
  for(const mutation of [p=>p.ref='refs/pull/1/merge',p=>p.refresh='allow-any-offline',p=>p.workflow='../external.yml',
    p=>p.repository='--owner evil',p=>p.evidenceInterpretation='redue-portable-direct-typescript@2',
    p=>p.issuer='https://issuer.example',p=>p.autoTrust=true]){
    const policy={...f.policy};mutation(policy);assert.throws(()=>verifyCIArtifact({...f.options,policy}));
  }
  assert.equal(f.calls.length,0);assert.throws(()=>validateCIPolicy({...f.policy,sourceCommit:'latest'}));
});
test('every certificate mismatch is rejected despite a successful controlled process',t=>{
  const f=fixture(t),original=JSON.stringify(f.response.output);
  for(const [key,value] of Object.entries({issuer:'https://wrong.example',subjectAlternativeName:'https://github.com/fork/redue/other@refs/heads/main',
    buildSignerURI:'https://github.com/msiric/redue/wrong.yml@refs/heads/main',buildSignerDigest:'3'.repeat(40),
    runnerEnvironment:'self-hosted',sourceRepositoryURI:'https://github.com/fork/redue',sourceRepositoryRef:'refs/heads/other',
    sourceRepositoryDigest:'4'.repeat(40),sourceRepositoryIdentifier:'different-id',sourceRepositoryOwnerIdentifier:'different-owner',
    sourceRepositoryVisibilityAtSigning:'private',buildTrigger:'pull_request_target'})){
    f.response.output=JSON.parse(original);f.response.output[0].verificationResult.signature.certificate[key]=value;
    assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_IDENTITY',key);
  }
});
test('subject/recipe/timestamp and unknown output data do not gain authority from exit zero',t=>{
  const f=fixture(t),original=JSON.stringify(f.response.output);
  for(const mutation of [r=>r.statement.subject[0].digest.sha256=hash('other'),r=>r.statement.subject[0].name='other.json',
    r=>r.statement.predicateType='https://slsa.dev/provenance/v1',r=>r.statement.predicate.evidenceDigest=hash('other'),
    r=>r.statement.predicate.evidenceInterpretation='redue-portable-direct-typescript@2',r=>r.verifiedTimestamps=[],
    r=>r.verifiedTimestamps[0].type='CurrentTime',r=>r.trusted=true]){
    f.response.output=JSON.parse(original);mutation(f.response.output[0].verificationResult);assert.throws(()=>verifyCIArtifact(f.options));
  }
  f.response.output='[]';assert.throws(()=>verifyCIArtifact(f.options));
  f.response.output=original.slice(0,-3);assert.throws(()=>verifyCIArtifact(f.options));
  f.response.output=original.replace('"schema":1','"schema":1,"schema":2');assert.throws(()=>verifyCIArtifact(f.options));
});
test('unavailable required refresh, timeout and unreviewed tool return no acceptance',t=>{
  const f=fixture(t);f.response.error=Object.assign(new Error('private path and secret-bearing message'),{code:'ETIMEDOUT'});
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_REFRESH'&&!error.message.includes('secret'));
  f.response.error=null;f.response.version='gh version 2.80.0\n';
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_TOOL');
});
test('artifact mutation and changed/truncated inputs are rejected before or after verification',t=>{
  const f=fixture(t);fs.appendFileSync(f.options.artifactFile,' ');
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_SUBJECT');assert.equal(f.calls.length,0);
  fs.writeFileSync(f.options.artifactFile,canonical(f.envelope));
  f.response.afterVerify=()=>fs.appendFileSync(f.options.artifactFile,' ');
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_CHANGED');
  fs.writeFileSync(f.options.artifactFile,'{');assert.throws(()=>verifyCIArtifact(f.options));
});
test('offline identification requires exact explicit bundle and never claims remote freshness',t=>{
  const f=fixture(t),bundleFile=path.join(f.directory,'bundle.json');fs.writeFileSync(bundleFile,'{"controlled":"fixture"}');
  assert.throws(()=>verifyCIArtifact({...f.options,bundleFile}),error=>error.code==='PORTABLE_CI_REFRESH');
  const policy={...f.policy,refresh:'offline-identified',bundleSha256:hash(fs.readFileSync(bundleFile))};
  assert.throws(()=>ciVerifyArguments({artifactFile:f.options.artifactFile,policy}),error=>error.code==='PORTABLE_CI_REFRESH');
  const report=verifyCIArtifact({...f.options,policy,bundleFile});assert.equal(report.refresh,'offline-identified');
  assert.equal(report.globally_latest,false);assert.equal(report.producer_accepted,false);assert.match(report.limitation,/not queried/);
  const args=f.calls.at(-1).args;assert.equal(args[args.indexOf('--bundle')+1],bundleFile);
  fs.appendFileSync(bundleFile,' ');assert.throws(()=>verifyCIArtifact({...f.options,policy,bundleFile}),error=>error.code==='PORTABLE_CI_SUBJECT');
});
