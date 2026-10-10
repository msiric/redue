import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {createHash} from 'node:crypto';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {machineOptions,readMachineTransfer,requireImportedEligibility,runMachine,summarizeMachineOrigin} from './acceptance/portable-machine.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),source='1'.repeat(40),packageSha='2'.repeat(64);
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-machine-test-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const profile={platform:{os:'darwin',arch:'arm64',release:'25.6.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},
    compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'}};
  const predicate={schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'PASS',invocation:{status:'exited',exitCode:0,signal:null},complete:true},
    facts:{schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},
      ...profile,context:{},files:[['src/a.ts',hash('source')]],discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/a.ts',hash('source')]],queriesSha256:hash('queries')}}};
  const envelope=encodeEnvelope(predicate),evidence=canonical(envelope)+'\n',manifest={schema:1,source,package_sha256:packageSha,
    evidence_sha256:hash(evidence),evidence_digest:envelope.digest,origin_run_id:predicate.origin.runId,profile_digest:hash(canonical(profile)),
    node_physical_identity:hash('node physical'),boot_identity:hash('independent boot'),interpretation:PORTABLE_INTERPRETATION,
    profile,scope:'controlled-noLib-direct-typescript',package_filename:'redue-cli-0.1.0-alpha.10.tgz'};
  const put=value=>fs.writeFileSync(path.join(base,'manifest.json'),typeof value==='string'?value:canonical(value));put(manifest);
  fs.writeFileSync(path.join(base,'redue-portable-evidence.json'),evidence);return {base,manifest,envelope,put};
}
test('machine roles require exact artifact/source and explicit recipient acceptance',()=>{
  const common=['--tarball','/owned/candidate.tgz','--sha256',packageSha,'--source',source];
  assert.equal(machineOptions(['--role','producer',...common,'--output','/owned/output'])['--role'],'producer');
  assert.equal(machineOptions(['--role','receiver',...common,'--input','/owned/input','--controlled-accept-digest',hash('evidence')])['--role'],'receiver');
  for(const args of [['--role','producer',...common,'--output','relative'],['--role','receiver',...common,'--input','/owned/input'],
    ['--role','producer',...common,'--output','/owned/output','--controlled-accept-digest',hash('evidence')],
    ['--role','producer',...common,'--output','/owned/output','--execute','arbitrary'],['--role','producer',...common,'--source',source],
    ['--role','receiver',...common,'--input','/owned/input','--controlled-accept-digest','latest']])assert.throws(()=>machineOptions(args));
});
test('controlled transfer validates bounded exact bytes/identity without granting applicability',t=>{
  const f=fixture(t),report=readMachineTransfer(f.base,{source,packageSha256:packageSha});
  assert.equal(report.manifest.evidence_digest,f.envelope.digest);assert(report.bytes>0);
  assert.equal(report.reuse_eligible,undefined);assert.equal(report.producer_accepted,undefined);
  for(const [key,value] of [['source','3'.repeat(40)],['package_sha256',hash('replacement')],['evidence_sha256',hash('changed bytes')],
    ['evidence_digest',hash('changed meaning')],['origin_run_id','different'],['profile_digest',hash('different profile')],
    ['interpretation','obsolete@0'],['scope','trusted producer'],['package_filename','../candidate.tgz']]){
    f.put({...f.manifest,[key]:value});assert.throws(()=>readMachineTransfer(f.base,{source,packageSha256:packageSha}),key);}
  f.put({...f.manifest,producer_accepted:true});assert.throws(()=>readMachineTransfer(f.base,{source,packageSha256:packageSha}));
  f.put(canonical(f.manifest).replace('"schema":1','"schema":1,"schema":1'));assert.throws(()=>readMachineTransfer(f.base,{source,packageSha256:packageSha}));
  f.put(f.manifest);fs.writeFileSync(path.join(f.base,'observer.sock'),'authority must not travel');
  assert.throws(()=>readMachineTransfer(f.base,{source,packageSha256:packageSha}));fs.unlinkSync(path.join(f.base,'observer.sock'));
  const evidence=path.join(f.base,'redue-portable-evidence.json');fs.renameSync(evidence,evidence+'.saved');fs.symlinkSync(evidence+'.saved',evidence);
  fs.unlinkSync(evidence+'.saved');assert.throws(()=>readMachineTransfer(f.base,{source,packageSha256:packageSha}));
});
test('agent-visible applicability requirements reject unhealthy/mismatched/missing evidence',()=>{
  const digest=hash('digest'),originRunId='origin',status={schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness:'CURRENT',result:'PASS',
    reuse_eligible:true,evidence_source:'imported',invocation:null,imported_evidence:{digest,origin_run_id:originRunId}}]};
  assert.equal(requireImportedEligibility(status,{digest,originRunId}),status.checks[0]);
  for(const mutate of [s=>s.schema=0,s=>s.observation.healthy=false,s=>s.checks[0].freshness='UNVERIFIED',s=>s.checks[0].result='FAIL',
    s=>delete s.checks[0].reuse_eligible,s=>s.checks[0].invocation={runId:'local'},s=>s.checks[0].evidence_source='local',
    s=>s.checks[0].imported_evidence.digest=hash('other'),s=>s.checks[0].imported_evidence.origin_run_id='other']){
    const value=structuredClone(status);mutate(value);assert.throws(()=>requireImportedEligibility(value,{digest,originRunId}));}
});
test('failed artifact precondition launches no installation, check or model',async t=>{
  const f=fixture(t),tarball=path.join(f.base,'candidate.tgz');fs.writeFileSync(tarball,'wrong artifact');let launches=0;
  t.mock.method(childProcess,'spawnSync',()=>{launches++;throw Error('failed gate must launch nothing');});syncBuiltinESMExports();
  t.after(()=>{t.mock.restoreAll();syncBuiltinESMExports();});
  await assert.rejects(runMachine({'--role':'producer','--tarball':tarball,'--sha256':packageSha,'--source':source,'--output':f.base}));
  assert.equal(launches,0);
});

test('local CURRENT never repairs an incomplete portable origin and diagnostics disclose only static classes',()=>{
  const diagnostic=summarizeMachineOrigin({result:'PASS',stable:true,coverage:{qualified:true},invocation:{status:'exited'},
    portable:{schema:1,interpretation:'redue-portable-direct-typescript@2',complete:false,reason:'PORTABLE_PROBE_TIMEOUT',facts:{}},
    checkpoint:{status:'stable',issues:[]},freshness:'CURRENT',reuse_eligible:true});
  assert.equal(diagnostic.portable_complete,false);assert.equal(diagnostic.stable,true);assert.equal(diagnostic.reason,'PORTABLE_PROBE_TIMEOUT');
  const privateValue='https://user:secret@private.invalid/owned/source.ts';
  const redacted=summarizeMachineOrigin({portable:{reason:privateValue,interpretation:privateValue},checkpoint:{issues:[privateValue,'declared input event occurred during execution']}});
  assert(!JSON.stringify(redacted).includes(privateValue));assert.deepEqual(redacted.checkpoint_issue_codes,['OTHER_PRIVATE_ISSUE','INPUT_EVENT']);
  assert.equal(redacted.reason,'OTHER_PRIVATE_REASON');assert.equal(redacted.interpretation,null);assert.equal(redacted.portable_complete,false);
});
