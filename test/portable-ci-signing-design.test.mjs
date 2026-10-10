// Execute only the proposed data validator, never signing or workflow actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const proposal=YAML.parse(fs.readFileSync('docs/contributor/portable-ci-signing-workflow.yml','utf8'));
const script=proposal.jobs.signer.steps.find(s=>s.id==='validate').run.split("python3 <<'PYTHON'\n")[1].split('\nPYTHON')[0];
function fixture(t){
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-sign-design-'))),dir=path.join(base,'redue-sign-input');
 fs.mkdirSync(dir);t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const facts={schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},
  platform:{os:'darwin',arch:'arm64',release:'25.6.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},
  compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},context:{},
  files:[['src/a.ts',hash('source')]],discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/a.ts',hash('source')]],queriesSha256:hash('queries')}};
 const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'PASS',complete:true,
  invocation:{status:'exited',exitCode:0,signal:null}},facts}),raw=canonical(envelope),profile={platform:facts.platform,runtime:facts.runtime,compiler:facts.compiler};
 const manifest={schema:1,source:'1'.repeat(40),package_sha256:hash('package'),evidence_sha256:hash(raw),evidence_digest:envelope.digest,
  origin_run_id:envelope.statement.predicate.origin.runId,profile_digest:hash(canonical(profile)),node_physical_identity:hash('physical'),boot_identity:hash('boot'),
  interpretation:PORTABLE_INTERPRETATION,profile,scope:'controlled-noLib-direct-typescript',package_filename:'owned.tgz'};
 fs.writeFileSync(path.join(dir,'redue-portable-evidence.json'),raw);fs.writeFileSync(path.join(dir,'manifest.json'),canonical(manifest));
 const run=()=>spawnSync('python3',['-c',script],{env:{...process.env,RUNNER_TEMP:base,GITHUB_SHA:manifest.source},encoding:'utf8',timeout:3000,maxBuffer:65536});
 return {base,dir,manifest,envelope,run};
}
test('disabled signer has minimal job permissions and no producer checkout',()=>{
 assert.deepEqual(proposal.jobs.signer.permissions,{contents:'read','id-token':'write',attestations:'write'});
 assert(!proposal.jobs.signer.steps.some(s=>s.uses?.startsWith('actions/checkout')));
});
const signerPlatform={skip:process.platform==='win32'?'Fixed Ubuntu signer requires POSIX descriptor primitives; not native Windows acceptance':false};
test('disabled POSIX signer validates fixed data without executing it',signerPlatform,t=>{
 const f=fixture(t),r=f.run();assert.ifError(r.error);assert.equal(r.signal,null);assert.equal(r.status,0,r.stderr);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.base,'redue-sign-predicate.json'))),{schema:1,evidenceDigest:f.envelope.digest,evidenceInterpretation:PORTABLE_INTERPRETATION});
});
for(const kind of ['duplicate','wrong-source','changed-subject','unknown-manifest','symlink','oversize','incomplete'])
 test(`signer data control ${kind} fails before any predicate/signing`,signerPlatform,t=>{
  const f=fixture(t),file=path.join(f.dir,'redue-portable-evidence.json'),manifestFile=path.join(f.dir,'manifest.json');
  if(kind==='duplicate')fs.writeFileSync(manifestFile,canonical(f.manifest).replace('"schema":1','"schema":1,"schema":1'));
  if(kind==='wrong-source')fs.writeFileSync(manifestFile,canonical({...f.manifest,source:'2'.repeat(40)}));
  if(kind==='unknown-manifest')fs.writeFileSync(manifestFile,canonical({...f.manifest,execute:'do not execute'}));
  if(kind==='changed-subject')fs.appendFileSync(file,' ');
  if(kind==='oversize')fs.writeFileSync(file,Buffer.alloc(1024*1024+1));
  if(kind==='symlink'){fs.renameSync(file,file+'.saved');fs.symlinkSync(file+'.saved',file);}
  if(kind==='incomplete'){const changed=structuredClone(f.envelope);changed.statement.predicate.origin.complete=false;fs.writeFileSync(file,canonical(changed));}
  const r=f.run();assert.ifError(r.error);assert.equal(r.signal,null);assert(Number.isInteger(r.status));assert.notEqual(r.status,0);assert(!fs.existsSync(path.join(f.base,'redue-sign-predicate.json')));
 });
