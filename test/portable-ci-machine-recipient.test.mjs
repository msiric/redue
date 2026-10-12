// Controlled fresh-state preparation tests; no live verifier/VM/model acceptance.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import childProcess from 'node:child_process';import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {requireFreshCIObserver} from './acceptance/portable-ci-recipient.mjs';
import {ciMachineOptions,ciMachinePreflight,runCIMachineRecipient,provisionExactCIRegistry} from './acceptance/portable-ci-machine-recipient.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex'),owned={skip:typeof process.getuid!=='function'};
function fixture(t){
 const base=fs.realpathSync(fs.mkdtempSync('/tmp/redue-ci-recipient-')),data=fs.realpathSync(fs.mkdtempSync('/tmp/redue-ci-data-'));
 t.after(()=>{fs.rmSync(base,{recursive:true,force:true});fs.rmSync(data,{recursive:true,force:true});});
 const input=path.join(data,'input');fs.mkdirSync(input,{mode:0o700});
 const facts={schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},platform:{os:'darwin',arch:'arm64',release:'25.6.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},context:{},files:[['src/a.ts',hash('file')]],discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/a.ts',hash('file')]],queriesSha256:hash('query')}};
 const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,origin:{runId:randomUUID(),check:'typecheck',result:'PASS',complete:true,invocation:{status:'exited',exitCode:0,signal:null}},facts}),evidence=canonical(envelope),bundle='controlled bundle',tarball=path.join(data,'candidate.tgz'),gh=path.join(data,'gh');fs.writeFileSync(tarball,'controlled tar');fs.writeFileSync(gh,'controlled gh');
 const profile={platform:facts.platform,runtime:facts.runtime,compiler:facts.compiler},manifest={schema:1,source:'1'.repeat(40),package_sha256:hash('controlled tar'),package_filename:'candidate.tgz',evidence_sha256:hash(evidence),evidence_digest:envelope.digest,bundle_sha256:hash(bundle),origin_run_id:envelope.statement.predicate.origin.runId,interpretation:PORTABLE_INTERPRETATION,scope:'controlled-noLib-direct-typescript',run_id:'123',run_attempt:'1',boot_identity:hash('boot'),node_physical_identity:hash('physical'),profile,profile_digest:hash(canonical(profile))};
 fs.writeFileSync(path.join(input,'manifest.json'),canonical(manifest));fs.writeFileSync(path.join(input,'redue-portable-evidence.json'),evidence);fs.writeFileSync(path.join(input,'attestation-bundle.json'),bundle);
 const policy={...JSON.parse(fs.readFileSync('docs/contributor/portable-ci-producer-policy-proposal.json')).policy,sourceCommit:manifest.source,signerCommit:manifest.source,artifactSha256:hash(evidence),evidenceDigest:envelope.digest},registry={schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy]},registryFile=path.join(data,'registry.json'),bytes=Buffer.from(canonical(registry));fs.writeFileSync(registryFile,bytes,{mode:0o600});
 const options={'--base':base,'--tarball':tarball,'--sha256':hash('controlled tar'),'--source':manifest.source,'--input':input,'--registry':registryFile,'--registry-sha256':hash(bytes),'--policy-digest':hash(canonical(policy)),'--gh-executable':gh,'--gh-sha256':hash('controlled gh'),'--run':'123','--attempt':'1','--manifest-sha256':hash(canonical(manifest))};
 const calls=[];t.mock.method(childProcess,'spawnSync',(...args)=>{calls.push(args);throw Error('Unexpected subprocess');});return {base,data,input,manifest,registryFile,bytes,options,calls};
}
test('machine preparation preview writes nothing and launches zero processes',owned,t=>{const f=fixture(t),report=runCIMachineRecipient(f.options);assert.equal(report.applied,false);assert.equal(report.producer_accepted,false);assert.equal(report.models_launched,0);assert.deepEqual(fs.readdirSync(f.base),[]);assert.equal(f.calls.length,0);});
for(const kind of ['registry-missing','registry-sha','policy','offline','artifact','bundle','source','tar','verifier','occupied','extra-file'])test(`machine ${kind} prerequisite fails with zero launches`,owned,t=>{
 const f=fixture(t);if(kind==='registry-missing')fs.unlinkSync(f.registryFile);if(kind==='registry-sha')f.options['--registry-sha256']=hash('wrong');if(kind==='policy')f.options['--policy-digest']=hash('wrong');
 if(kind==='offline'){const r=JSON.parse(f.bytes);r.policies[0].refresh='offline-identified';r.policies[0].bundleSha256=f.manifest.bundle_sha256;const b=canonical(r);fs.writeFileSync(f.registryFile,b);f.options['--registry-sha256']=hash(b);f.options['--policy-digest']=hash(canonical(r.policies[0]));}
 if(kind==='artifact')fs.appendFileSync(path.join(f.input,'redue-portable-evidence.json'),' ');if(kind==='bundle')fs.appendFileSync(path.join(f.input,'attestation-bundle.json'),' ');if(kind==='source')f.options['--source']='2'.repeat(40);
 if(kind==='tar')fs.appendFileSync(f.options['--tarball'],'changed');if(kind==='verifier')fs.appendFileSync(f.options['--gh-executable'],'changed');if(kind==='occupied')fs.writeFileSync(path.join(f.base,'user'),'preserve');if(kind==='extra-file')fs.writeFileSync(path.join(f.input,'extra'),'unknown');
 const codes={'registry-missing':'PORTABLE_FILE_UNAVAILABLE','registry-sha':'CI_MACHINE_REGISTRY',policy:'CI_MACHINE_REGISTRY',offline:'CI_MACHINE_REGISTRY',artifact:'CI_MACHINE_TRANSFER',bundle:'CI_MACHINE_TRANSFER',source:'CI_MACHINE_TRANSFER',tar:'CI_MACHINE_BYTES',verifier:'CI_MACHINE_BYTES',occupied:'CI_MACHINE_OCCUPIED','extra-file':'CI_MACHINE_TRANSFER'};assert.throws(()=>runCIMachineRecipient({...f.options,'--apply':true}),{code:codes[kind]});assert.equal(f.calls.length,0);assert(!fs.existsSync(path.join(f.base,'redue-state')));
});
test('exact explicit registry copy requires owned matching fresh state and refuses repeat',owned,t=>{
 const f=fixture(t),root=path.join(f.base,'Checkout 空间'),state=path.join(f.base,'redue-state'),configFile=path.join(state,'project-runtime-v1.json');fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',root,state,config:configFile}));
 const args={state,root,configFile,bytes:f.bytes,sha256:hash(f.bytes)};assert.throws(()=>provisionExactCIRegistry(args));assert(!fs.existsSync(path.join(state,'portable-producers-v1.json')));
 provisionExactCIRegistry({...args,apply:true});const file=path.join(state,'portable-producers-v1.json');assert(fs.readFileSync(file).equals(f.bytes));assert.equal(fs.statSync(file).mode&0o777,0o600);assert.throws(()=>provisionExactCIRegistry({...args,apply:true}));assert.equal(f.calls.length,0);
});
for(const kind of ['owner','external-root','symlink','wrong-bytes'])test(`registry ${kind} refuses without overwriting`,owned,t=>{
 const f=fixture(t),root=path.join(f.base,'Checkout 空间'),state=path.join(f.base,'redue-state'),configFile=path.join(state,'project-runtime-v1.json');fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',root:kind==='owner'?f.data:root,state,config:configFile}));
 if(kind==='symlink')fs.symlinkSync(f.registryFile,path.join(state,'portable-producers-v1.json'));assert.throws(()=>provisionExactCIRegistry({state,root:kind==='external-root'?f.data:root,configFile,bytes:f.bytes,sha256:kind==='wrong-bytes'?hash('wrong'):hash(f.bytes),apply:true}));assert.equal(f.calls.length,0);assert(fs.readFileSync(f.registryFile).equals(f.bytes));
});
test('unknown/duplicated options do not become authority',()=>{assert.throws(()=>ciMachineOptions(['--trust','yes']));assert.throws(()=>ciMachineOptions(['--apply','--apply']));});

test('verifier larger than envelope bound uses bounded reviewed binary inspection without launching it',owned,t=>{
 const f=fixture(t),bytes=Buffer.alloc(2*1024*1024,97);fs.writeFileSync(f.options['--gh-executable'],bytes);f.options['--gh-sha256']=hash(bytes);
 const report=runCIMachineRecipient(f.options);assert.equal(report.applied,false);assert.equal(f.calls.length,0);
});
test('owner marker replacement during durable policy copy refuses all continuation',owned,t=>{
 const f=fixture(t),root=path.join(f.base,'Checkout 空间'),state=path.join(f.base,'redue-state'),configFile=path.join(state,'project-runtime-v1.json');fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});
 const ownerFile=path.join(state,'vstate-owner-v1.json'),owner=canonical({schema:1,kind:'vstate-product-alpha',root,state,config:configFile});fs.writeFileSync(ownerFile,owner);
 const fsync=fs.fsyncSync;let swapped=false;t.mock.method(fs,'fsyncSync',fd=>{fsync(fd);if(!swapped){swapped=true;fs.renameSync(ownerFile,ownerFile+'.old');fs.writeFileSync(ownerFile,owner);}});
 assert.throws(()=>provisionExactCIRegistry({state,root,configFile,bytes:f.bytes,sha256:hash(f.bytes),apply:true}),{code:'CI_MACHINE_OWNERSHIP'});
 assert.equal(f.calls.length,0);assert(!fs.existsSync(path.join(state,'portable-imports-v1.json')));assert(!fs.existsSync(path.join(state,'runs-v1')));
});

for(const history of ['receipts-v1.json','runs-v1','portable-imports-v1.json','portable-import-pending-v1.json','portable-evidence-v1'])test(`policy provisioning refuses existing ${history} before copy`,owned,t=>{
 const f=fixture(t),root=path.join(f.base,'Checkout 空间'),state=path.join(f.base,'redue-state'),configFile=path.join(state,'project-runtime-v1.json');fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',root,state,config:configFile}));
 const file=path.join(state,history);fs.writeFileSync(file,'preserve');assert.throws(()=>provisionExactCIRegistry({state,root,configFile,bytes:f.bytes,sha256:hash(f.bytes),apply:true}),{code:'CI_MACHINE_HISTORY'});
 assert.equal(fs.readFileSync(file,'utf8'),'preserve');assert(!fs.existsSync(path.join(state,'portable-producers-v1.json')));assert.equal(f.calls.length,0);
});

test('machine observer uses the same receipt-free schema guard without recipe metadata',()=>{
 const status={schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness:'UNVERIFIED',result:null,invocation:null,reuse_eligible:false}]};
 assert.equal(requireFreshCIObserver(status),status.checks[0]);assert(!Object.hasOwn(status.checks[0],'verification_recipe'));
 status.observation.healthy=false;assert.throws(()=>requireFreshCIObserver(status),{code:'CI_RECIPIENT_OBSERVER'});
});
