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
  const response={output,version:'gh version 2.79.0 (2025-09-08)\n',error:null,afterVerify:null,afterVersion:null};
  t.mock.method(childProcess,'execFileSync',(executable,args,options)=>{
    calls.push({executable,args,options});
    if(args[0]==='--version'){response.afterVersion?.();return response.version;}
    if(response.error)throw response.error;
    response.afterVerify?.();return typeof response.output==='string'?response.output:JSON.stringify(response.output);
  });
  const ghExecutable=path.join(directory,'reviewed-gh'),ghExecutableSha256=hash('controlled fixture executable');
  fs.writeFileSync(ghExecutable,'controlled fixture executable');
  const options={artifactFile,policy,ghExecutable,ghExecutableSha256};
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

test('locally approved verifier bytes are required; matching version/output cannot authorize a substitute',t=>{
  const f=fixture(t);
  assert.throws(()=>verifyCIArtifact({...f.options,ghExecutableSha256:undefined}),error=>error.code==='PORTABLE_CI_TOOL');
  assert.throws(()=>verifyCIArtifact({...f.options,ghExecutableSha256:hash('other')}),error=>error.code==='PORTABLE_CI_TOOL');
  fs.writeFileSync(f.options.ghExecutable,'substituted process that would print correct version/output');
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_TOOL');
  assert.equal(f.calls.length,0);
  fs.writeFileSync(f.options.ghExecutable,'controlled fixture executable');
  f.response.afterVersion=()=>fs.appendFileSync(f.options.ghExecutable,'mutated');
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_TOOL');
  assert.equal(f.calls.length,1,'mutation between version/verification launches no verification');
  f.response.afterVersion=null;fs.writeFileSync(f.options.ghExecutable,'controlled fixture executable');
  f.response.afterVerify=()=>fs.appendFileSync(f.options.ghExecutable,'mutated');
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_TOOL');
});
test('all verified statements must match policy; a valid statement cannot mask another mismatched one',t=>{
  const f=fixture(t),good=JSON.parse(JSON.stringify(f.response.output[0]));
  const bad=JSON.parse(JSON.stringify(good));bad.verificationResult.signature.certificate.sourceRepositoryRef='refs/heads/fork';
  for(const entries of [[good,bad],[bad,good]]){
    f.response.output=entries;assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_IDENTITY');
  }
  const other=JSON.parse(JSON.stringify(good));other.verificationResult.statement.predicate.evidenceDigest=hash('different');
  f.response.output=[good,other];assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_RECIPE');
  f.response.output=[good,good];const report=verifyCIArtifact(f.options);
  assert.equal(report.verifiedAttestations,2);assert.equal(report.producer_accepted,false);
  assert.equal(report.reuse_eligible,false);assert.equal(report.local_policy_current,false);
});
test('missing or changed local policy is not replaced by an earlier successful verifier report',t=>{
  const f=fixture(t),report=verifyCIArtifact(f.options),before=f.calls.length;
  assert.equal(report.local_policy_current,false,'helper does not read the authoritative policy registry');
  assert.throws(()=>verifyCIArtifact({...f.options,policy:null}));
  assert.throws(()=>verifyCIArtifact({...f.options,policy:{...f.policy,sourceCommit:'3'.repeat(40)}}),
    error=>error.code==='PORTABLE_CI_IDENTITY');
  assert.equal(report.producer_accepted,false);assert.equal(report.reuse_eligible,false);
  assert(f.calls.length>before,'changed policy is verified independently, not by cached successful output');
});
test('explicit artifact/bundle/verifier reads refuse linked files and symlink ancestors',t=>{
  const f=fixture(t),linked=path.join(f.directory,'linked-artifact.json');fs.linkSync(f.options.artifactFile,linked);
  assert.throws(()=>verifyCIArtifact({...f.options,artifactFile:linked}),error=>error.code==='PORTABLE_CI_FILE');
  fs.unlinkSync(linked);const alias=path.join(f.directory,'alias');
  try{fs.symlinkSync(f.directory,alias,'dir');}catch(error){
    if(process.platform==='win32'&&error.code==='EPERM'){t.skip('symlink privilege unavailable');return;}throw error;
  }
  assert.throws(()=>verifyCIArtifact({...f.options,artifactFile:path.join(alias,'redue-portable-evidence.json')}),
    error=>error.code==='PORTABLE_CI_FILE');
  assert.throws(()=>verifyCIArtifact({...f.options,ghExecutable:path.join(alias,'reviewed-gh')}),error=>error.code==='PORTABLE_CI_FILE');
  const bundle=path.join(f.directory,'bundle.json');fs.writeFileSync(bundle,'{}');
  const policy={...f.policy,refresh:'offline-identified',bundleSha256:hash('{}')};
  assert.throws(()=>verifyCIArtifact({...f.options,policy,bundleFile:path.join(alias,'bundle.json')}),error=>error.code==='PORTABLE_CI_FILE');
  assert.equal(f.calls.length,0);
});

test('bounded input readers use nonblocking no-follow opens and reject changed file types before reading',t=>{
  const f=fixture(t),open=fs.openSync,fstat=fs.fstatSync;let checked=false;
  t.mock.method(fs,'openSync',function(file,flags,...args){
    if(file===f.options.artifactFile){
      if(fs.constants.O_NONBLOCK)assert.equal(flags&fs.constants.O_NONBLOCK,fs.constants.O_NONBLOCK);
      if(fs.constants.O_NOFOLLOW)assert.equal(flags&fs.constants.O_NOFOLLOW,fs.constants.O_NOFOLLOW);
      checked=true;
    }
    return open.call(fs,file,flags,...args);
  });
  t.mock.method(fs,'fstatSync',function(descriptor,...args){
    const stat=fstat.call(fs,descriptor,...args);
    if(checked)stat.isFile=()=>false;
    return stat;
  });
  assert.throws(()=>verifyCIArtifact(f.options),error=>error.code==='PORTABLE_CI_CHANGED');
  assert(checked);assert.equal(f.calls.length,0);
});
