// Correction changes only the immutable helper/registry checkout pin. No workflow enablement.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
const oldBytes=fs.readFileSync('docs/contributor/portable-ci-recipient-enable-proposal.yml');
const revisedBytes=fs.readFileSync('docs/contributor/portable-ci-recipient-corrected-proposal.yml');
const previous='a23843e171f206e404574d97a59b2d86abc9a0c0';
const corrected='a2f2ddc613d1a3d2dfbe5f4f04e97cd69584bc6b';
const hash=b=>createHash('sha256').update(b).digest('hex');
test('corrected recipient proposal preserves exact approved bytes except two helper source pins',()=>{
 assert.equal(hash(oldBytes),'ef237cbb411b0520791911503d3071a9a42f78502ac8f712406a11566482ef78');
 assert.equal(oldBytes.toString().split(previous).length-1,2);
 assert(revisedBytes.equals(Buffer.from(oldBytes.toString().replaceAll(previous,corrected))));
 const old=YAML.parse(oldBytes.toString()),next=YAML.parse(revisedBytes.toString());
 assert.deepEqual(next,{...old,jobs:{recipient:{...old.jobs.recipient,
   env:{...old.jobs.recipient.env,OWNER_REGISTRY_SOURCE:corrected},
   steps:old.jobs.recipient.steps.map((step,index)=>index===1?{...step,with:{...step.with,ref:corrected}}:step)}}});
});
test('correction leaves artifact, trust, permissions, runtime and full post-import controls unchanged',()=>{
 const job=YAML.parse(revisedBytes.toString()).jobs.recipient;
 assert.equal(job.env.SELECTED_SOURCE,'d04b872ee0e848e300c0cc9738ad761e48146acc');
 assert.equal(job.env.SELECTED_PACKAGE_SHA256,'8695b612a5c33dae945b2bc8df57cd68ca3eefb401aa0ef9ca2850d212979ea2');
 assert.equal(job.env.OWNER_POLICY_DIGEST,'bab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6');
 assert.equal(hash(fs.readFileSync('docs/contributor/portable-ci-producer-registry-proposal.json')),job.env.OWNER_REGISTRY_SHA256);
 assert(!fs.existsSync('.github/workflows/portable-ci-recipient.yml'));
 assert.equal(hash(fs.readFileSync('.github/workflows/portable-evidence.yml')),'5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924');
});
