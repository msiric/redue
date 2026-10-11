// Disabled route controls, not live CI authentication/approval or model evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {canonical} from '../src/portable-envelope.mjs';
import {validateCIPolicy} from '../src/portable-ci-trust.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const name='docs/contributor/portable-ci-recipient-workflow.yml';
const bytes=fs.readFileSync(name),workflow=YAML.parse(bytes.toString()),job=workflow.jobs.recipient;
const script=job.steps[0].run.split("node --input-type=module <<'JS'\n")[1].split('\nJS')[0];
const proposal=JSON.parse(fs.readFileSync('docs/contributor/portable-ci-producer-policy-proposal.json'));
const syntheticOwner={OWNER_REGISTRY_SOURCE:'a'.repeat(40),OWNER_REGISTRY_SHA256:'b'.repeat(64),
 OWNER_POLICY_DIGEST:proposal.policyDigest,OWNER_RECIPIENT_APPROVAL_SHA256:'c'.repeat(64)};
function run(changes={}){return spawnSync(process.execPath,['--input-type=module','-e',script],{
 env:{...job.env,...syntheticOwner,...changes},encoding:'utf8',timeout:2000,maxBuffer:32768});}
function failure(changes,code){const r=run(changes);assert.ifError(r.error);assert.equal(r.signal,null);
 assert.notEqual(r.status,0);assert(r.stderr.includes(code));assert.equal(r.stdout,'');}
test('recipient proposal stays disabled outside active workflow directory with read-only permissions',()=>{
 assert(!fs.existsSync('.github/workflows/portable-ci-recipient.yml'));
 assert.equal(job.if,'${{ false }}');assert.equal(job['runs-on'],'macos-26');
 assert.deepEqual(workflow.on,{push:{branches:['dev/portable-ci-recipient']}});
 assert.deepEqual(workflow.permissions,{contents:'read',actions:'read',attestations:'read'});
 assert.equal(job.steps.length,2);assert.equal(job.steps[0].id,'prerequisites');
 assert(job.steps[1].run.includes('exit 1'));assert(!job.steps.some(step=>step.uses));
 assert(!bytes.includes(Buffer.from('id-token: write')));assert(!bytes.includes(Buffer.from('upload-artifact@')));
});
test('as-shipped missing owner policy fails before any artifact/verifier/model process',()=>{
 const r=spawnSync(process.execPath,['--input-type=module','-e',script],{env:job.env,encoding:'utf8',timeout:2000,maxBuffer:32768});
 assert.ifError(r.error);assert.notEqual(r.status,0);assert.equal(r.stdout,'');assert(r.stderr.includes('RECIPIENT_OWNER_PREREQUISITE_MISSING'));
});
test('synthetic descriptor syntax pass is explicitly not authorization and job still stops',()=>{
 const r=run();assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
 assert.equal(r.stdout.trim(),'RECIPIENT_DESCRIPTOR_COMPLETE_NOT_AUTHORIZED');assert.equal(job.if,'${{ false }}');
 assert(job.steps[1].run.includes('RECIPIENT_OWNER_PROVISIONING_NOT_IMPLEMENTED'));
});
for(const key of ['SELECTED_RUN','SELECTED_ATTEMPT','SELECTED_SOURCE','SELECTED_SIGNER','SELECTED_ARTIFACT_ID',
 'SELECTED_ARCHIVE_SHA256','SELECTED_EVIDENCE_SHA256','SELECTED_EVIDENCE_DIGEST','SELECTED_BUNDLE_SHA256',
 'SELECTED_PACKAGE_SHA256','SELECTED_INTERPRETATION','GH_ARCHIVE_SHA256','GH_EXECUTABLE_SHA256','SELECTED_REPOSITORY','SELECTED_WORKFLOW','SELECTED_REF'])
 test(`different selected ${key} fails before downstream work`,()=>failure({[key]:'different'},'RECIPIENT_SELECTED_ARTIFACT_MISMATCH'));
for(const key of Object.keys(syntheticOwner))
 test(`missing owner ${key} fails closed`,()=>failure({[key]:''},'RECIPIENT_OWNER_PREREQUISITE_MISSING'));
test('offline refresh cannot weaken the exact proposed online requirement',()=>failure({OWNER_REFRESH:'offline-identified'},'RECIPIENT_OWNER_PREREQUISITE_MISSING'));
test('exact read-only policy proposal matches selected artifact and current policy schema without becoming registry',()=>{
 assert.equal(proposal.status,'PROPOSED_NOT_APPROVED');assert(!Object.hasOwn(proposal,'policies'));assert(!Object.hasOwn(proposal,'revision'));
 const policy=validateCIPolicy(proposal.policy);assert.equal(hash(canonical(policy)),proposal.policyDigest);
 assert.equal(policy.sourceCommit,job.env.SELECTED_SOURCE);assert.equal(policy.signerCommit,job.env.SELECTED_SIGNER);
 assert.equal(policy.artifactSha256,job.env.SELECTED_EVIDENCE_SHA256);assert.equal(policy.evidenceDigest,job.env.SELECTED_EVIDENCE_DIGEST);
 assert.equal(policy.evidenceInterpretation,job.env.SELECTED_INTERPRETATION);assert.equal(policy.refresh,'required');assert.equal(policy.bundleSha256,null);
 assert.equal(proposal.workflowRun,job.env.SELECTED_RUN);assert.equal(proposal.workflowAttempt,job.env.SELECTED_ATTEMPT);
 assert.equal(proposal.artifactId,job.env.SELECTED_ARTIFACT_ID);assert.equal(proposal.archiveSha256,job.env.SELECTED_ARCHIVE_SHA256);
});
