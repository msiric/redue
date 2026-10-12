// Final owner-review candidate controls. Never installs a workflow or policy.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
const source='a23843e171f206e404574d97a59b2d86abc9a0c0';
const disabled=YAML.parse(fs.readFileSync('docs/contributor/portable-ci-recipient-workflow.yml','utf8'));
const proposed=YAML.parse(fs.readFileSync('docs/contributor/portable-ci-recipient-enable-proposal.yml','utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('owner-review recipient candidate is not installed and has one exact read-only trigger',()=>{
 assert(!fs.existsSync('.github/workflows/portable-ci-recipient.yml'));
 assert.deepEqual(proposed.on,{push:{branches:['dev/portable-ci-recipient']}});
 assert.equal(proposed.jobs.recipient.if,"github.repository == 'msiric/redue' && github.event_name == 'push' && github.ref == 'refs/heads/dev/portable-ci-recipient'");
 assert.deepEqual(proposed.permissions,{contents:'read',actions:'read',attestations:'read'});
 assert.equal(Object.keys(proposed.jobs).length,1);
 const bytes=fs.readFileSync('docs/contributor/portable-ci-recipient-enable-proposal.yml');
 assert(!bytes.includes(Buffer.from('id-token: write')));assert(!bytes.includes(Buffer.from('upload-artifact')));
 assert(!bytes.includes(Buffer.from('secrets.')));assert(!bytes.includes(Buffer.from('copilot-requests')));
});
test('final source and registry pins cannot follow a moving trigger checkout',()=>{
 const job=proposed.jobs.recipient;
 assert.equal(job.env.OWNER_REGISTRY_SOURCE,source);
 const checkouts=job.steps.filter(step=>step.uses?.startsWith('actions/checkout@'));
 assert.equal(checkouts.length,2);assert.equal(checkouts[0].with.ref,source);
 assert.equal(checkouts[1].with.ref,job.env.SELECTED_SOURCE);
 assert(checkouts.every(step=>step.with['persist-credentials']===false));
 assert.equal(hash(fs.readFileSync('docs/contributor/portable-ci-producer-registry-proposal.json')),job.env.OWNER_REGISTRY_SHA256);
 assert.equal(job.env.OWNER_POLICY_DIGEST,'bab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6');
});
test('enabling candidate preserves all reviewed downstream validation and apply steps',()=>{
 const old=disabled.jobs.recipient,newer=proposed.jobs.recipient;
 assert.deepEqual(newer.env,{...old.env,OWNER_REGISTRY_SOURCE:source});
 assert.deepEqual(newer.steps.slice(2),old.steps.slice(2));
 assert.deepEqual(newer.steps[1],{...old.steps[1],with:{...old.steps[1].with,ref:source}});
 // Only owner-review commentary changes in the prerequisite data validator.
 const stripComments=script=>script.split('\n').filter(line=>!line.trim().startsWith('//')).join('\n');
 assert.equal(stripComments(newer.steps[0].run),stripComments(old.steps[0].run));
 assert.equal(newer['runs-on'],'macos-26');assert.equal(newer['timeout-minutes'],20);
});
test('independent recipient proposal cannot change already approved signer bytes',()=>{
 assert.equal(hash(fs.readFileSync('.github/workflows/portable-evidence.yml')),'5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924');
});
