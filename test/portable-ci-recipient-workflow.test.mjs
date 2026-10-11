// Disabled route controls, not live CI authentication/approval or model evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
const syntheticOwner={OWNER_REGISTRY_SOURCE:'a'.repeat(40),OWNER_REGISTRY_SHA256:job.env.OWNER_REGISTRY_SHA256,
 OWNER_POLICY_DIGEST:proposal.policyDigest};
function run(changes={}){return spawnSync(process.execPath,['--input-type=module','-e',script],{
 env:{...job.env,...syntheticOwner,...changes},encoding:'utf8',timeout:2000,maxBuffer:32768});}
function failure(changes,code){const r=run(changes);assert.ifError(r.error);assert.equal(r.signal,null);
 assert(Number.isInteger(r.status));assert.notEqual(r.status,0);assert(r.stderr.includes(code));assert.equal(r.stdout,'');}
test('recipient proposal stays disabled outside active workflow directory with read-only permissions',()=>{
 assert(!fs.existsSync('.github/workflows/portable-ci-recipient.yml'));
 assert.equal(job.if,'${{ false }}');assert.equal(job['runs-on'],'macos-26');
 assert.deepEqual(workflow.on,{push:{branches:['dev/portable-ci-recipient']}});
 assert.deepEqual(workflow.permissions,{contents:'read',actions:'read',attestations:'read'});
 assert(job.steps.length>6);assert.equal(job.steps[0].id,'prerequisites');
 assert(job.steps.at(-1).run.includes('--apply'));assert(job.steps.filter(step=>step.uses).every(step=>/@[a-f0-9]{40}$/.test(step.uses)));
 assert(!Object.hasOwn(job.env,'OWNER_RECIPIENT_APPROVAL_SHA256'));
 assert(!bytes.includes(Buffer.from('id-token: write')));assert(!bytes.includes(Buffer.from('upload-artifact@')));
});
test('as-shipped missing owner policy fails before any artifact/verifier/model process',()=>{
 const r=spawnSync(process.execPath,['--input-type=module','-e',script],{env:job.env,encoding:'utf8',timeout:2000,maxBuffer:32768});
 assert.ifError(r.error);assert.notEqual(r.status,0);assert.equal(r.stdout,'');assert(r.stderr.includes('RECIPIENT_OWNER_PREREQUISITE_MISSING'));
});
test('synthetic descriptor syntax pass is explicitly not authorization and job still stops',()=>{
 const r=run();assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
 assert.equal(r.stdout.trim(),'RECIPIENT_DESCRIPTOR_COMPLETE_NOT_AUTHORIZED');assert.equal(job.if,'${{ false }}');
 assert(job.steps.at(-1).run.includes('portable-ci-machine-recipient.mjs'));assert(job.env.OWNER_REGISTRY_SOURCE.startsWith('OWNER_'));
});
for(const key of ['SELECTED_RUN','SELECTED_ATTEMPT','SELECTED_SOURCE','SELECTED_SIGNER','SELECTED_ARTIFACT_ID',
 'SELECTED_ARCHIVE_SHA256','SELECTED_EVIDENCE_SHA256','SELECTED_EVIDENCE_DIGEST','SELECTED_BUNDLE_SHA256',
 'SELECTED_PACKAGE_SHA256','SELECTED_MANIFEST_SHA256','SELECTED_INTERPRETATION','GH_ARCHIVE_SHA256','GH_EXECUTABLE_SHA256','SELECTED_REPOSITORY','SELECTED_WORKFLOW','SELECTED_REF'])
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

test('queued registry bytes are exact required-refresh proposal, never implicitly approved',()=>{
 const bytes=fs.readFileSync('docs/contributor/portable-ci-producer-registry-proposal.json'),registry=JSON.parse(bytes);
 assert.equal(hash(bytes),job.env.OWNER_REGISTRY_SHA256);assert.equal(registry.interpretation,'redue-producer-policy-registry@1');assert.equal(registry.revision,1);
 assert.deepEqual(registry.policies,[proposal.policy]);assert.equal(hash(canonical(registry.policies[0])),job.env.OWNER_POLICY_DIGEST);
 assert.equal(job.if,'${{ false }}');
});
test('download gate has bounded subprocess I/O and fixed nonexecuting artifact members',()=>{
 const code=job.steps.find(step=>step.id==='download').run;
 assert(code.includes('selectors.DefaultSelector()'));assert(code.includes('deadline=time.monotonic()+30'));assert(code.includes('DOWNLOAD_LIMIT'));
 assert(code.includes('p.kill();p.wait()'));assert(code.includes('ARTIFACT_ARCHIVE'));assert(code.includes('ARTIFACT_MEMBERS'));assert(code.includes('ARTIFACT_MEMBER_BYTES'));
 assert(!code.includes('extractall'));assert(!code.includes('gh auth'));assert(!code.includes('upload'));
});

test('recipient reads the existing approved signer artifact name without changing signer bytes',()=>{
 const signer=YAML.parse(fs.readFileSync('.github/workflows/portable-evidence.yml','utf8'));
 const upload=signer.jobs.signer.steps.find(step=>step.uses?.startsWith('actions/upload-artifact@'));
 assert.equal(upload.with.name,'portable-ci-authenticated-${{ github.run_id }}-${{ github.run_attempt }}');
 assert(job.steps.find(step=>step.id==='download').run.includes("f'portable-ci-authenticated-{run}-{attempt}'"));
 assert.equal(hash(fs.readFileSync('.github/workflows/portable-evidence.yml')),'5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924');
});
// Execute the queued data-only download script with controlled HTTPS/API bytes.
// Native verifier and artifact signatures are not executed or authenticated here.
const downloadCode=job.steps.find(step=>step.id==='download').run.split("python3 <<'PYTHON'\n")[1].split('\nPYTHON')[0];
const controlledDownload=`import os,sys,pathlib,json,hashlib,zipfile,io,stat,urllib.request,subprocess
controlbase=pathlib.Path(os.environ['CONTROLLED_BASE']);kind=os.environ['CONTROLLED_KIND'];env=os.environ
h=lambda b:hashlib.sha256(b).hexdigest()
def zipbytes(files):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w') as z:
  for name,value in files.items():
   i=zipfile.ZipInfo(name);i.create_system=3;i.external_attr=(stat.S_IFREG|0o600)<<16;z.writestr(i,value)
 return b.getvalue()
leaf=b'controlled native verifier bytes, never executed'
ghzip=zipbytes({'gh_2.79.0_macOS_arm64/bin/gh':leaf});env['GH_ARCHIVE_SHA256']=h(ghzip);env['GH_EXECUTABLE_SHA256']=h(leaf)
files={'redue-portable-evidence.json':b'e'*20160,'attestation-bundle.json':b'b'*10505,'manifest.json':b'm'*3209}
for name,key in [('redue-portable-evidence.json','SELECTED_EVIDENCE_SHA256'),('attestation-bundle.json','SELECTED_BUNDLE_SHA256'),('manifest.json','SELECTED_MANIFEST_SHA256')]:env[key]=h(files[name])
archive=zipbytes(files);env['SELECTED_ARCHIVE_SHA256']=h(archive)
if kind=='extra-member':archive=zipbytes({**files,'extra':b'never execute'});env['SELECTED_ARCHIVE_SHA256']=h(archive)
if kind=='changed-member':archive=zipbytes({**files,'manifest.json':b'x'*3209});env['SELECTED_ARCHIVE_SHA256']=h(archive)
registry=b'controlled separately selected registry bytes';env['OWNER_REGISTRY_SHA256']=h(registry)
run={'id':int(env['SELECTED_RUN']),'run_attempt':int(env['SELECTED_ATTEMPT']),'status':'completed','conclusion':'success','event':'push','head_branch':'dev/portable-evidence','head_sha':env['SELECTED_SOURCE'],'path':env['SELECTED_WORKFLOW']}
meta={'id':int(env['SELECTED_ARTIFACT_ID']),'expired':False,'name':'portable-ci-authenticated-'+env['SELECTED_RUN']+'-'+env['SELECTED_ATTEMPT'],'size_in_bytes':34300,'digest':'sha256:'+env['SELECTED_ARCHIVE_SHA256'],'workflow_run':{'id':int(env['SELECTED_RUN']),'head_sha':env['SELECTED_SOURCE'],'repository_id':1403689333,'head_repository_id':1403689333,'head_branch':'dev/portable-evidence'}}
if kind=='wrong-source':run['head_sha']='f'*40
if kind=='wrong-attempt':run['run_attempt']=2
if kind=='failed-run':run['conclusion']='failure'
if kind=='fork':run['head_branch']='unapproved-fork'
if kind=='wrong-workflow':run['path']='unapproved.yml'
if kind=='wrong-artifact':meta['id']=7
if kind=='artifact-fork':meta['workflow_run']['head_repository_id']=7
if kind=='expired':meta['expired']=True
if kind=='wrong-archive':archive+=b'changed'
if kind=='changed-registry':registry+=b'changed'
resources={'run':json.dumps(run).encode(),'meta':json.dumps(meta).encode(),'archive':archive,'registry':registry}
for name,b in resources.items():(controlbase/name).write_bytes(b)
class Response:
 def __enter__(self):return io.BytesIO(ghzip)
 def __exit__(self,*args):return False
urllib.request.urlopen=lambda *a,**k:Response()
original=subprocess.Popen
calls=[]
def fake(args,**kwargs):
 calls.append(args)
 endpoint=args[-1]
 key='run' if '/attempts/' in endpoint else 'archive' if endpoint.endswith('/zip') else 'registry' if '/contents/' in endpoint else 'meta'
 return original([sys.executable,'-c','import pathlib,sys;sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())',str(controlbase/key)],**kwargs)
subprocess.Popen=fake
try:exec(compile(os.environ['CONTROLLED_SCRIPT'],'queued-recipient-download','exec'))
finally:(controlbase/'calls.json').write_text(json.dumps(calls))
`;

function downloadFixture(t,kind){
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-download-'))),output=path.join(base,'environment');t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const result=spawnSync('python3',['-c',controlledDownload],{env:{...process.env,...job.env,...syntheticOwner,RUNNER_TEMP:base,GITHUB_ENV:output,CONTROLLED_BASE:base,CONTROLLED_KIND:kind,CONTROLLED_SCRIPT:downloadCode},encoding:'utf8',timeout:5000,maxBuffer:32768});
 assert.ifError(result.error);assert.equal(result.signal,null);assert(Number.isInteger(result.status));assert(fs.existsSync(path.join(base,'calls.json')),result.stderr);return {base,output,result,calls:JSON.parse(fs.readFileSync(path.join(base,'calls.json')))};
}
const posixDownload={skip:process.platform==='win32'?'Queued macOS data-only pipe/deadline contract; Windows runtime not claimed':false};
test('queued downloader executes controlled exact bindings without running artifact or verifier code',posixDownload,t=>{
 const f=downloadFixture(t,'valid');assert.equal(f.result.status,0,f.result.stderr);assert.equal(f.calls.length,4);
 assert(f.calls.every(args=>args[1]==='api'));assert(fs.existsSync(f.output));
 assert.deepEqual(fs.readdirSync(path.join(f.base,'redue-ci-transfer','artifact')).sort(),['attestation-bundle.json','manifest.json','redue-portable-evidence.json']);
});
for(const kind of ['wrong-source','wrong-attempt','failed-run','fork','wrong-workflow','wrong-artifact','artifact-fork','expired','wrong-archive','extra-member','changed-member','changed-registry'])
 test(`queued downloader ${kind} fails before provisioning/import`,posixDownload,t=>{
  const f=downloadFixture(t,kind);assert.notEqual(f.result.status,0);assert(!fs.existsSync(f.output));
  assert(f.calls.every(args=>args[1]==='api'));assert(!fs.existsSync(path.join(f.base,'redue-state')));
 });
