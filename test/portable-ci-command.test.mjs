import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {portableCommand} from '../src/portable-command.mjs';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {CI_PREDICATE_TYPE} from '../src/portable-ci-trust.mjs';
import {readProducerPolicySnapshot} from '../src/portable-producer-policy.mjs';
import {readImportedSnapshot} from '../src/portable-store.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const ownerTests={skip:typeof process.getuid!=='function'};
const errorCode=code=>error=>error.code===code;
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-command-'))),
    root=path.join(base,'checkout 空间'),state=path.join(base,'redue-state'),configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});fs.mkdirSync(path.join(state,'runs-v1'));
  const publicConfig={schema:1,packageManager:'npm',checks:[{name:'compiler',script:'typecheck'}]},
    runtime={schema:1,root,state,checks:[{name:'compiler',command:['node','local-tsc','--noEmit']}]},ownerConfig=path.join(state,'project-runtime-v1.json');
  fs.writeFileSync(configFile,canonical(publicConfig));fs.writeFileSync(ownerConfig,canonical(runtime));
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',root,state,config:ownerConfig}));
  const localRun=randomUUID(),local={schema:1,checks:{compiler:{result:'FAIL',invocation:{runId:localRun,status:'exited',exitCode:2,signal:null},stable:true}}};
  fs.writeFileSync(path.join(state,'receipts-v1.json'),canonical(local));fs.writeFileSync(path.join(state,'runs-v1',localRun+'.json'),canonical({schema:1,check:'compiler',receipt:local.checks.compiler}));
  const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:randomUUID(),check:'producer-check',result:'FAIL',invocation:{status:'exited',exitCode:1,signal:null},complete:false},facts:null});
  const bytes=Buffer.from(canonical(envelope)+'\n'),artifactFile=path.join(base,'evidence 空间.json');fs.writeFileSync(artifactFile,bytes);
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
    repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',ref:'refs/heads/main',
    sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:hash(bytes),evidenceDigest:envelope.digest,
    evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};
  const registry={schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy]},policyFile=path.join(state,'portable-producers-v1.json');
  fs.writeFileSync(policyFile,canonical(registry),{mode:0o600});
  const policyDigest=readProducerPolicySnapshot(policyFile).policies[0].digest,
    ghExecutable=path.join(base,'reviewed gh'),ghSha=hash('controlled fixture gh');fs.writeFileSync(ghExecutable,'controlled fixture gh');
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  // Controlled verifier output: not real signature/account/CI evidence.
  const output=[{attestation:{bundle:{controlledFixture:true},bundle_url:''},verificationResult:{
    mediaType:'application/vnd.dev.sigstore.verificationresult+json;version=0.1',
    statement:{_type:'https://in-toto.io/Statement/v1',subject:[{name:'redue-portable-evidence.json',digest:{sha256:policy.artifactSha256}}],
      predicateType:CI_PREDICATE_TYPE,predicate:{schema:1,evidenceDigest:envelope.digest,evidenceInterpretation:PORTABLE_INTERPRETATION}},
    signature:{certificate:{subjectAlternativeName:san,issuer:policy.issuer,buildSignerURI:san,buildSignerDigest:policy.signerCommit,
      runnerEnvironment:'github-hosted',sourceRepositoryURI:'https://github.com/msiric/redue',sourceRepositoryDigest:policy.sourceCommit,
      sourceRepositoryRef:policy.ref,sourceRepositoryIdentifier:policy.repositoryId,sourceRepositoryOwnerURI:'https://github.com/msiric',
      sourceRepositoryOwnerIdentifier:policy.ownerId,sourceRepositoryVisibilityAtSigning:'public',buildTrigger:'workflow_dispatch'}},
    verifiedTimestamps:[{type:'Tlog',uri:'https://rekor.sigstore.dev',timestamp:'2026-10-10T00:00:00Z'}]}}];
  const response={calls:[],afterVerify:null};t.mock.method(childProcess,'execFileSync',(file,args)=>{
    response.calls.push({file,args});if(args[0]==='--version')return 'gh version 2.79.0\n';response.afterVerify?.();return canonical(output);
  });t.mock.method(console,'log',()=>{});t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const args=['import',artifactFile,'--check','compiler','--ci-policy-digest',policyDigest,'--gh-executable',ghExecutable,'--gh-sha256',ghSha,'--json'];
  return {base,root,state,configFile,publicConfig,runtime,ownerConfig,envelope,artifactFile,policyFile,registry,policyDigest,ghExecutable,ghSha,output,response,args};
}
function noImport(f){for(const name of ['portable-imports-v1.json','portable-import-pending-v1.json','portable-evidence-v1','run.lock'])assert(!fs.existsSync(path.join(f.state,name)),name);}

test('explicit CI preview reads local policy but performs no verifier, writes or new acceptance',ownerTests,async t=>{
  const f=fixture(t),before=fs.readdirSync(f.state).sort(),result=await portableCommand(f.args,f);
  assert.equal(result.apply,false);assert.equal(result.proposed_acceptance,'github-ci-v1');assert.equal(result.selected_policy_digest,f.policyDigest);
  assert.equal(result.acceptance,'untrusted');assert.equal(result.producer_verified,false);assert.equal(result.producer_accepted,false);assert.equal(result.reuse_eligible,false);
  assert.equal(f.response.calls.length,0);assert.deepEqual(fs.readdirSync(f.state).sort(),before);noImport(f);
});

test('explicit apply authenticates exact artifact and retains local outcomes without claiming recipient CURRENT',ownerTests,async t=>{
  const f=fixture(t),selected=fs.readFileSync(path.join(f.state,'receipts-v1.json')),history=fs.readdirSync(path.join(f.state,'runs-v1'));
  const result=await portableCommand([...f.args,'--apply'],f);assert.equal(result.acceptance,'github-ci-v1');assert.equal(result.producer_verified,true);
  assert.equal(result.producer_accepted,true);assert.equal(result.reuse_eligible,false);assert.equal(f.response.calls.length,2);
  assert(f.response.calls.every(call=>call.file===f.ghExecutable));
  const record=readImportedSnapshot(f.state,{configFile:f.ownerConfig,root:f.root}).records[0];
  assert.equal(record.check,'compiler');assert.equal(record.envelope.statement.predicate.origin.check,'producer-check');
  assert.equal(record.envelope.statement.predicate.origin.result,'FAIL');assert.equal(record.ciBinding.authentication.evidenceDigest,f.envelope.digest);
  assert.deepEqual(fs.readFileSync(path.join(f.state,'receipts-v1.json')),selected);assert.deepEqual(fs.readdirSync(path.join(f.state,'runs-v1')),history);
});

test('partial, conflicting, malformed or relative CI options refuse before authentication',ownerTests,async t=>{
  const f=fixture(t),base=['import',f.artifactFile,'--check','compiler'];
  for(const extra of [
    ['--ci-policy-digest',f.policyDigest],['--gh-executable',f.ghExecutable],['--bundle',f.artifactFile],
    ['--ci-policy-digest',f.policyDigest,'--gh-executable',f.ghExecutable,'--gh-sha256','invalid'],
    ['--ci-policy-digest',f.policyDigest,'--gh-executable','relative-gh','--gh-sha256',f.ghSha],
    ['--ci-policy-digest',f.policyDigest,'--gh-executable',f.ghExecutable,'--gh-sha256',f.ghSha,'--bundle','relative-bundle'],
    ['--ci-policy-digest',f.policyDigest,'--gh-executable',f.ghExecutable,'--gh-sha256',f.ghSha,'--accept-digest',f.envelope.digest],
    ['--ci-policy-digest',f.policyDigest,'--ci-policy-digest',f.policyDigest,'--gh-executable',f.ghExecutable,'--gh-sha256',f.ghSha]
  ])await assert.rejects(portableCommand([...base,...extra,'--apply'],f),errorCode('PORTABLE_USAGE'));
  assert.equal(f.response.calls.length,0);noImport(f);
});

test('unknown local check, mismatched ownership and absent policy cannot launch a verifier',ownerTests,async t=>{
  const f=fixture(t),args=f.args.map(value=>value==='compiler'?'not-configured':value);
  await assert.rejects(portableCommand([...args,'--apply'],f),errorCode('PORTABLE_CHECK'));
  const ownerFile=path.join(f.state,'vstate-owner-v1.json'),owner=fs.readFileSync(ownerFile);
  fs.writeFileSync(ownerFile,canonical({...JSON.parse(owner),root:f.root+'-other'}));
  await assert.rejects(portableCommand([...f.args,'--apply'],f),errorCode('PORTABLE_OWNERSHIP'));fs.writeFileSync(ownerFile,owner);
  const missing=f.args.map(value=>value===f.policyDigest?hash('not-approved'):value);
  await assert.rejects(portableCommand([...missing,'--apply'],f),errorCode('PORTABLE_CI_ACCEPTANCE'));
  assert.equal(f.response.calls.length,0);noImport(f);
});

test('bad verified subject or policy change during authentication stores no accepted import',ownerTests,async t=>{
  const f=fixture(t),subject=f.output[0].verificationResult.statement.subject[0].digest.sha256;
  f.output[0].verificationResult.statement.subject[0].digest.sha256=hash('other-artifact');
  await assert.rejects(portableCommand([...f.args,'--apply'],f));noImport(f);
  f.output[0].verificationResult.statement.subject[0].digest.sha256=subject;
  f.response.afterVerify=()=>fs.writeFileSync(f.policyFile,canonical({...f.registry,revision:2}));
  await assert.rejects(portableCommand([...f.args,'--apply'],f),errorCode('PORTABLE_CI_POLICY_CHANGED'));noImport(f);
});

test('artifact altered between command read and authentication cannot receive the verified token',ownerTests,async t=>{
  const f=fixture(t),snapshot=fs.readFileSync(f.artifactFile),open=fs.openSync;let changed=false;
  const hook=t.mock.method(fs,'openSync',(file,...args)=>{
    // Command first reads the file; verifier then reads the same path again.
    if(file===f.ghExecutable&&!changed){changed=true;fs.appendFileSync(f.artifactFile,' ');}return open(file,...args);
  });
  await assert.rejects(portableCommand([...f.args,'--apply'],f));hook.mock.restore();assert(changed);noImport(f);
  assert.notDeepEqual(fs.readFileSync(f.artifactFile),snapshot);
});
