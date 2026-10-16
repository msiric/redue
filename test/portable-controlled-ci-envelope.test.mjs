// Synthetic data/parser/command fixtures only. No CI job, authentication,
// compiler execution, origin guarantee or recipient applicability is established.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonical,digestPayload,encodeEnvelope,parseEnvelope,inspectEnvelope,inspectEvidenceEnvelope,
  CONTROLLED_CI_PREDICATE_TYPE,CONTROLLED_CI_INTERPRETATION,PORTABLE_INTERPRETATION,
  PORTABLE_LIMITS,PortableEnvelopeError} from '../src/portable-envelope.mjs';
import {portableCommand} from '../src/portable-command.mjs';
import {importEvidence} from '../src/portable-store.mjs';
import {decidePortableEvidence} from '../src/portable-applicability.mjs';
import {validateCIPolicy,verifyCIArtifact} from '../src/portable-ci-trust.mjs';
import {readProducerPolicySnapshot} from '../src/portable-producer-policy.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
function predicate(){return {schema:1,interpretation:CONTROLLED_CI_INTERPRETATION,
  origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'PASS',
    invocation:{status:'exited',exitCode:0,signal:null},complete:true},
  assurance:{interpretation:'redue-controlled-ci-assurance@1',model:'TRUSTED_QUIESCENT_ISOLATED_JOB',
    sealing:'NOT_CLAIMED',hostRuntimeProfile:{interpretation:'redue-controlled-ci-host-runtime-profile@1',
      match:'RECIPIENT_MUST_ESTABLISH_EXACT_MATCH',sha256:hash('synthetic declared profile, not admitted')}},
  facts:{schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
    command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('synthetic recipe')},
    platform:{os:'darwin',arch:'arm64',release:'26.0.0'},
    runtime:{version:'v22.13.0',sha256:hash('synthetic runtime'),sharedObjects:[]},
    compiler:{version:'5.5.2',sha256:hash('synthetic compiler'),entry:'node_modules/typescript/lib/tsc.js'},
    context:{NODE_ENV:hash('absent')},files:[['package.json',hash('synthetic manifest')],['src/check.ts',hash('synthetic source')]],
    discovery:{configs:[['tsconfig.json',hash('synthetic config')]],files:[['src/check.ts',hash('synthetic source')]],queriesSha256:hash('synthetic queries')}}};}
// There is intentionally no production controlled-CI encoder/export path. Build
// test bytes explicitly; a computed digest is integrity, never authentication.
function envelope(p=predicate(),type=CONTROLLED_CI_PREDICATE_TYPE){const statement={_type:'https://in-toto.io/Statement/v1',
  subject:[{name:'redue-evidence',digest:{sha256:hash(canonical(p))}}],predicateType:type,predicate:p};
  return{schema:1,statement,digest:digestPayload(statement)};}
const bytes=(p=predicate(),type=CONTROLLED_CI_PREDICATE_TYPE)=>canonical(envelope(p,type));
const code=expected=>error=>error instanceof PortableEnvelopeError&&error.code===expected;
function noAuthority(report){assert.equal(report.claim_only,true);assert.equal(report.producer_accepted,false);
  assert.equal(report.reuse_eligible,false);assert.equal(report.freshness,'UNVERIFIED');
  assert.equal(report.producer_assurance,'NOT_VERIFIED');assert.equal(report.recipient_applicability,'NOT_ESTABLISHED');
  assert.equal(report.checking_input_coverage,'NOT_ESTABLISHED');assert.match(report.limitation,/not sealing/);
  assert.match(report.limitation,/cannot be imported or reused/);}
function fixture(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-controlled-ci-')));
  fs.chmodSync(base,0o700);const root=path.join(base,'project'),state=path.join(base,'redue-state');
  fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});const configFile=path.join(state,'project-runtime-v1.json');
  const runtime={schema:1,root,state,checks:[{name:'typecheck',command:['node','local-tsc','--noEmit']}]},
    publicConfig={schema:1,packageManager:'npm',checks:[{name:'typecheck',script:'typecheck'}]};
  fs.writeFileSync(configFile,canonical(runtime));fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),
    canonical({schema:1,kind:'vstate-product-alpha',config:configFile,root,state}));
  const file=path.join(base,'synthetic-controlled-ci.json');fs.writeFileSync(file,bytes());
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));t.mock.method(console,'log',()=>{});
  return{base,root,state,file,configFile,runtime,publicConfig};}
function policy(record,raw){return {schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
  repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',
  ref:'refs/heads/main',sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:hash(raw),
  evidenceDigest:record.digest,evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};}

test('exact controlled-CI claim is immutable inspect-only data with explicit unverified assumptions',()=>{
  const report=inspectEvidenceEnvelope(Buffer.from(bytes()));noAuthority(report);
  assert.equal(report.interpretation,CONTROLLED_CI_INTERPRETATION);assert.equal(report.evidence_understood,true);
  assert.equal(report.input_count,2);assert.equal(report.origin.result,'PASS');
  assert.equal(report.claimed_host_runtime.platform.os,'darwin');assert.equal(report.claimed_host_runtime.platform.arch,'arm64');
  assert.equal(report.claimed_host_runtime.runtime.version,'v22.13.0');assert.equal(report.claimed_host_runtime.compiler.version,'5.5.2');
  assert.equal(report.assurance.model,'TRUSTED_QUIESCENT_ISOLATED_JOB');
  assert.equal(report.assurance.hostRuntimeProfile.match,'RECIPIENT_MUST_ESTABLISH_EXACT_MATCH');
  assert(Object.isFrozen(report.assurance.hostRuntimeProfile));
  assert.throws(()=>{report.reuse_eligible=true;},TypeError);
});
for(const [label,change]of [
  ['schema',p=>p.schema=2],['interpretation',p=>p.interpretation+='-unknown'],
  ['assurance interpretation',p=>p.assurance.interpretation='unknown'],
  ['assurance model',p=>p.assurance.model='HOSTILE_WRITERS_SEALED'],
  ['sealing',p=>p.assurance.sealing='ENFORCED'],['assurance extra trust',p=>p.assurance.trusted=true],
  ['missing assurance',p=>delete p.assurance],['null assurance',p=>p.assurance=null],
  ['profile interpretation',p=>p.assurance.hostRuntimeProfile.interpretation='unknown'],
  ['profile match',p=>p.assurance.hostRuntimeProfile.match='ALREADY_MATCHED'],
  ['profile digest',p=>p.assurance.hostRuntimeProfile.sha256='not-a-hash'],
  ['profile extra field',p=>p.assurance.hostRuntimeProfile.accepted=true],
  ['profile missing field',p=>delete p.assurance.hostRuntimeProfile.match],
  ['runtime version',p=>p.facts.runtime.version='v22.14.0'],['architecture',p=>p.facts.platform.arch='x64'],
  ['platform',p=>p.facts.platform.os='linux'],['compiler',p=>p.facts.compiler.version='5.6.3'],
  ['absent facts',p=>{p.facts=null;p.origin.complete=false;}],
  ['contradictory PASS',p=>p.origin.invocation.exitCode=1],
  ['arbitrary command',p=>p.facts.recipe.command=['npm','test']],
  ['outside input',p=>p.facts.files[0][0]='../outside'],
  ['forged coverage',p=>p.facts.discovery.checkingComplete=true],
  ['claimed acceptance',p=>p.producer_accepted=true],['claimed current',p=>p.freshness='CURRENT']
])test('controlled-CI refuses '+label,()=>{const p=predicate();change(p);assert.throws(()=>inspectEvidenceEnvelope(bytes(p)),code('PORTABLE_SCHEMA'));});
test('strict type selection refuses ambiguous old/new meanings and never error-falls-back',()=>{
  assert.throws(()=>inspectEvidenceEnvelope(bytes(predicate(),'https://redue.dev/unknown')),code('PORTABLE_SCHEMA'));
  assert.throws(()=>inspectEvidenceEnvelope(bytes(predicate(),'https://redue.dev/attestation/direct-typescript/v1')),code('PORTABLE_SCHEMA'));
  const old=predicate();delete old.assurance;old.interpretation=PORTABLE_INTERPRETATION;
  assert.throws(()=>inspectEvidenceEnvelope(bytes(old)),code('PORTABLE_SCHEMA'));
  const changed=envelope();changed.statement.predicate.origin.check='edited';
  assert.throws(()=>inspectEvidenceEnvelope(canonical(changed)),code('PORTABLE_DIGEST'));
});
test('new bytes inherit strict duplicate-key, Unicode, numeric and bounded parsing',()=>{
  for(const [input,expected]of [[bytes().replace('"model":','"model":"TRUSTED_QUIESCENT_ISOLATED_JOB","mo\\u0064el":'),'PORTABLE_DUPLICATE_KEY'],
    [bytes().slice(0,-1),'PORTABLE_PARSE'],[bytes()+' trailing','PORTABLE_PARSE'],
    [bytes().replace('"schema":1','"schema":1.0'),'PORTABLE_NUMBER'],[Buffer.from([0xc0,0xaf]),'PORTABLE_UNICODE'],
    [Buffer.alloc(PORTABLE_LIMITS.bytes+1,32),'PORTABLE_SIZE'],
    ['['.repeat(PORTABLE_LIMITS.depth+2)+'0'+']'.repeat(PORTABLE_LIMITS.depth+2),'PORTABLE_DEPTH'],
    [JSON.stringify('a'.repeat(PORTABLE_LIMITS.string+1)),'PORTABLE_SIZE']])
    assert.throws(()=>inspectEvidenceEnvelope(input),code(expected));
});
test('claimed FAIL and incomplete origin remain historical claims, never eligibility',()=>{
  const fail=predicate();fail.origin.result='FAIL';fail.origin.invocation.exitCode=2;
  const failed=inspectEvidenceEnvelope(bytes(fail));assert.equal(failed.origin.result,'FAIL');noAuthority(failed);
  const incomplete=predicate();incomplete.origin.complete=false;
  noAuthority(inspectEvidenceEnvelope(bytes(incomplete)));
});
test('old @2 serialization, inspection and containment stay identical',()=>{
  const p={schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'FAIL',
      invocation:{status:'exited',exitCode:2,signal:null},complete:false},facts:null};
  const old=canonical(encodeEnvelope(p));assert.equal(hash(old),'8549a7131f45b6747ff30fa8a8029de4f149fc87a7dcee6e16d94a6eba83ee7d');
  assert.equal(parseEnvelope(old).digest,'d94a13487df4745d40f062f8f9d8286a87d0aa425879b830326e8f10989214eb');
  assert.deepEqual(inspectEvidenceEnvelope(old),inspectEnvelope(old));
  for(const call of [parseEnvelope,inspectEnvelope])assert.throws(()=>call(bytes()),code('PORTABLE_SCHEMA'));
  assert.throws(()=>encodeEnvelope(predicate()),code('PORTABLE_SCHEMA'));
});
test('existing evidence inspect --json works without a project and prints non-authority',async t=>{
  const f=fixture(t),printed=[];t.mock.method(console,'log',line=>printed.push(line));
  const report=await portableCommand(['inspect',f.file,'--json'],{configFile:null});noAuthority(report);
  assert.equal(report.action,'inspect');assert.equal(printed.length,1);assert.equal(canonical(JSON.parse(printed[0])),canonical(report));
  assert.deepEqual(fs.readdirSync(f.base).sort(),['project','redue-state','synthetic-controlled-ci.json']);
});
test('unsigned/manual import preview and apply reject the new interpretation before any state writes',async t=>{
  const f=fixture(t),raw=fs.readFileSync(f.file),record=envelope(),before=fs.readdirSync(f.state).sort();
  for(const apply of [false,true])for(const acceptDigest of [null,record.digest]){
    assert.throws(()=>importEvidence({...f,check:'typecheck',bytes:raw,apply,acceptDigest}),code('PORTABLE_SCHEMA'));
    const args=['import',f.file,'--check','typecheck','--json',...(apply?['--apply']:[]),...(acceptDigest?['--accept-digest',acceptDigest]:[])];
    await assert.rejects(portableCommand(args,f),code('PORTABLE_SCHEMA'));
    assert.deepEqual(fs.readdirSync(f.state).sort(),before);
  }
});
test('current CI policy cannot admit new semantics, and bound-old CI verifier rejects before subprocess',async t=>{
  const f=fixture(t),raw=fs.readFileSync(f.file),record=envelope(),oldPolicy=policy(record,raw);
  assert.throws(()=>validateCIPolicy({...oldPolicy,evidenceInterpretation:CONTROLLED_CI_INTERPRETATION}),code('PORTABLE_CI_POLICY'));
  let verifierCalls=0;t.mock.method(childProcess,'execFileSync',()=>{verifierCalls++;assert.fail('NO_VERIFIER');});
  assert.throws(()=>verifyCIArtifact({artifactFile:f.file,policy:oldPolicy}),code('PORTABLE_SCHEMA'));
  // A real local synthetic owner registry still binds @2, never the new claim.
  const policyFile=path.join(f.state,'portable-producers-v1.json');fs.writeFileSync(policyFile,
    canonical({schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[oldPolicy]}),{mode:0o600});
  const selected=readProducerPolicySnapshot(policyFile).policies[0].digest,before=fs.readdirSync(f.state).sort();
  for(const apply of [false,true])await assert.rejects(portableCommand(['import',f.file,'--check','typecheck',
    '--ci-policy-digest',selected,'--gh-executable',path.join(f.base,'not-executed-gh'),'--gh-sha256',hash('unexecuted'),
    '--json',...(apply?['--apply']:[])],f),code('PORTABLE_SCHEMA'));
  assert.equal(verifierCalls,0);assert.deepEqual(fs.readdirSync(f.state).sort(),before);
});
test('forged manual/CI catalog acceptance cannot establish recipient CURRENT from the new bytes',()=>{
  const p=predicate(),record=envelope(p);for(const acceptance of ['untrusted','manual-digest-v1','github-ci-v1']){
    const result=decidePortableEvidence({check:'typecheck',facts:p.facts,
      prerequisites:{originIntervalSupported:true,understood:true,observationHealthy:true,callerValidated:true,complete:true},
      snapshot:{revision:'synthetic',records:[{digest:record.digest,check:'typecheck',acceptance,envelope:record}]}});
    assert.equal(result.reuse_eligible,false);assert.equal(result.freshness,'UNVERIFIED');assert.equal(result.selected,null);
    if(acceptance!=='untrusted')assert.equal(result.reason,'PORTABLE_ACCEPTED_RECORD_INVALID');
  }
});
