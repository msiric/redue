import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {readProducerPolicySnapshot} from '../src/portable-producer-policy.mjs';
import {ciRecipientOptions,preflightCIRecipient,runCIRecipient} from './acceptance/portable-ci-recipient.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex'),ownerTests={skip:typeof process.getuid!=='function'};
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ci-recipient-'))),root=path.join(base,'checkout 空间'),state=path.join(base,'redue-state');
  fs.mkdirSync(root);fs.mkdirSync(state,{mode:0o700});
  const config=path.join(root,'redue.config.json'),runtime=path.join(state,'project-runtime-v1.json');
  fs.writeFileSync(config,canonical({schema:1,checks:[{name:'typecheck',recipe:'typescript-direct'}]}));
  fs.writeFileSync(runtime,canonical({schema:1,root,state,checks:[{name:'typecheck',qualification:'npm-typescript-direct-v1'}]}));
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),canonical({schema:1,kind:'vstate-product-alpha',root,state,config:runtime}));
  const facts={schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('definition')},
    platform:{os:'darwin',arch:'arm64',release:'25.6.0'},runtime:{version:'v22.13.0',sha256:hash('node'),sharedObjects:[]},
    compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},context:{},
    files:[['package.json',hash('manifest')]],discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/a.ts',hash('source')]],queriesSha256:hash('queries')}};
  const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:randomUUID(),check:'producer-check',result:'PASS',invocation:{status:'exited',exitCode:0,signal:null},complete:true},facts});
  const artifact=path.join(base,'redue-portable-evidence.json'),bytes=Buffer.from(canonical(envelope)+'\n');fs.writeFileSync(artifact,bytes);
  const cli=path.join(base,'installed-redue.mjs'),gh=path.join(base,'reviewed-gh');fs.writeFileSync(cli,'controlled CLI fixture');fs.writeFileSync(gh,'controlled gh fixture');
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',
    workflow:'.github/workflows/portable-evidence.yml',ref:'refs/heads/main',sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:hash(bytes),
    evidenceDigest:envelope.digest,evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};
  const policyFile=path.join(state,'portable-producers-v1.json'),registry={schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy]};
  fs.writeFileSync(policyFile,canonical(registry),{mode:0o600});
  const options={'--cli-entry':cli,'--cli-sha256':hash('controlled CLI fixture'),'--config':config,'--state':state,'--root':root,'--artifact':artifact,
    '--policy-digest':readProducerPolicySnapshot(policyFile).policies[0].digest,'--source':policy.sourceCommit,'--signer':policy.signerCommit,
    '--gh-executable':gh,'--gh-sha256':hash('controlled gh fixture')};
  const imported={digest:envelope.digest,origin_run_id:envelope.statement.predicate.origin.runId,result:'PASS',acceptance:'github-ci-v1'};
  // These are controlled CLI-response fixtures, NOT live signature, machine,
  // compiler, or agent evidence. Actual deployed execution remains queued.
  const responses={ready:{schema:1,observation:{healthy:true},checks:[{name:'typecheck',verification_recipe:'npm-direct-typescript@1'}]},
    preview:{apply:false,producer_verified:false,producer_accepted:false,digest:envelope.digest},
    applied:{producer_verified:true,producer_accepted:true,reuse_eligible:false,acceptance:'github-ci-v1',digest:envelope.digest},
    visible:{schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness:'CURRENT',result:'PASS',reuse_eligible:true,evidence_source:'imported',invocation:null,imported_evidence:imported}]},afterPreview:null};
  const calls=[];t.mock.method(childProcess,'spawnSync',(file,args)=>{
    calls.push({file,args});let response;
    if(args.includes('import')){response=args.includes('--apply')?responses.applied:responses.preview;if(!args.includes('--apply'))responses.afterPreview?.();}
    else response=calls.length===1?responses.ready:responses.visible;
    return {status:0,stdout:canonical(response),stderr:''};
  });t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  return {base,root,state,runtime,policy,registry,policyFile,artifact,cli,gh,envelope,options,responses,calls};
}
function zeroLaunch(f){assert.equal(f.calls.length,0,'failed prerequisite launches no CLI/verifier/model process');}

test('default recipient preflight is read-only and grants neither authentication nor applicability',ownerTests,t=>{
  const f=fixture(t),before=fs.readdirSync(f.state).sort(),report=runCIRecipient(f.options);
  assert.equal(report.applied,false);assert.equal(report.preconditions,'READY');assert.equal(report.applicability,'NOT_EVALUATED');
  assert.equal(report.producer_verified,false);assert.equal(report.producer_accepted,false);assert.equal(report.recipient_reuse_eligible,false);assert.equal(report.models_launched,0);
  assert.deepEqual(fs.readdirSync(f.state).sort(),before);zeroLaunch(f);
});
for(const missing of ['absent','malformed','unapproved','unsafe-permissions'])
  test(`policy ${missing} fails closed with zero verifier/model processes`,ownerTests,t=>{
    const f=fixture(t),original=fs.readFileSync(f.policyFile);
    if(missing==='absent')fs.unlinkSync(f.policyFile);
    if(missing==='malformed')fs.writeFileSync(f.policyFile,'{"schema":');
    if(missing==='unapproved')f.options['--policy-digest']=hash('not-owner-approved');
    if(missing==='unsafe-permissions')fs.chmodSync(f.policyFile,0o620);
    assert.throws(()=>runCIRecipient({...f.options,'--apply':true}));zeroLaunch(f);
    assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
    if(missing==='absent')assert(!fs.existsSync(f.policyFile),'import never initializes policy');
    else if(missing==='unapproved')assert.deepEqual(fs.readFileSync(f.policyFile),original);
  });
for(const changed of ['source','signer','artifact','cli','configuration','ownership','local-outcome'])
  test(`recipient ${changed} mismatch launches no verification or model`,ownerTests,t=>{
    const f=fixture(t);
    if(changed==='source')f.options['--source']='3'.repeat(40);
    if(changed==='signer')f.options['--signer']='3'.repeat(40);
    if(changed==='artifact')fs.appendFileSync(f.artifact,' ');
    if(changed==='cli')fs.appendFileSync(f.cli,'replacement');
    if(changed==='configuration'){const runtime=JSON.parse(fs.readFileSync(f.runtime));runtime.checks[0].qualification='explicit';fs.writeFileSync(f.runtime,canonical(runtime));}
    if(changed==='ownership'){const file=path.join(f.state,'vstate-owner-v1.json'),owner=JSON.parse(fs.readFileSync(file));fs.writeFileSync(file,canonical({...owner,root:f.root+'-other'}));}
    if(changed==='local-outcome')fs.writeFileSync(path.join(f.state,'receipts-v1.json'),canonical({schema:1,checks:{typecheck:{result:'FAIL'}}}));
    assert.throws(()=>runCIRecipient({...f.options,'--apply':true}));zeroLaunch(f);
  });

test('explicit controlled recipient route consumes current CLI responses and never launches equivalent verification',ownerTests,t=>{
  const f=fixture(t),policyBefore=fs.readFileSync(f.policyFile),report=runCIRecipient({...f.options,'--apply':true});
  assert.equal(report.models_launched,0);assert.equal(report.applied,true);assert.equal(report.recipient_reuse_eligible,true);assert.equal(report.globally_latest,false);
  assert.equal(report.visible_evidence.imported_evidence.origin_run_id,f.envelope.statement.predicate.origin.runId);
  assert.deepEqual(report.calls.map(call=>call.operation),['recipient preflight','CI preview','authenticated CI import','recipient applicability']);
  assert.equal(f.calls.length,4);assert(f.calls.every(call=>call.file===process.execPath&&call.args[0]===f.cli&&!call.args.includes('run')));
  const applied=f.calls[2].args;assert(applied.includes('--apply'));assert(applied.includes(f.options['--policy-digest']));assert(applied.includes(f.gh));assert(!applied.includes('--accept-digest'));
  assert.deepEqual(fs.readFileSync(f.policyFile),policyBefore);assert(!fs.existsSync(path.join(f.state,'runs-v1')));
});

test('unavailable observer gate stops before import authentication; no model is ever started',ownerTests,t=>{
  const f=fixture(t);f.responses.ready.observation.healthy=false;
  assert.throws(()=>runCIRecipient({...f.options,'--apply':true}),{code:'CI_RECIPIENT_OBSERVER'});
  assert.equal(f.calls.length,1);assert(!f.calls[0].args.includes('import'));
});
test('policy change after preview blocks explicit apply instead of reconstructing authorization',ownerTests,t=>{
  const f=fixture(t);f.responses.afterPreview=()=>fs.writeFileSync(f.policyFile,canonical({...f.registry,revision:2}));
  assert.throws(()=>runCIRecipient({...f.options,'--apply':true}),{code:'CI_RECIPIENT_CHANGED'});
  assert.equal(f.calls.length,2);assert(!f.calls.some(call=>call.args.includes('--apply')));
});
test('agent-visible non-eligible or wrongly attributed response cannot pass recipient acceptance',ownerTests,t=>{
  const f=fixture(t);f.responses.visible.checks[0].reuse_eligible=false;
  assert.throws(()=>runCIRecipient({...f.options,'--apply':true}));assert.equal(f.calls.length,4);
  assert(!f.calls.some(call=>call.args.includes('run')));
});

test('options require explicit apply and exact owner-selected identities, with no policy-path or model option',()=>{
  assert.throws(()=>ciRecipientOptions(['--policy-file','remote-policy.json']),{code:'CI_RECIPIENT_OPTIONS'});
  assert.throws(()=>ciRecipientOptions(['--model','any']),{code:'CI_RECIPIENT_OPTIONS'});
  assert.throws(()=>ciRecipientOptions(['--apply','--apply']),{code:'CI_RECIPIENT_OPTIONS'});
});

test('offline identified acceptance requires the exact owner-selected bundle before any process',ownerTests,t=>{
  const f=fixture(t),bundle=path.join(f.base,'attestation.jsonl');fs.writeFileSync(bundle,'controlled offline fixture');
  const policy={...f.policy,refresh:'offline-identified',bundleSha256:hash(fs.readFileSync(bundle))};
  fs.writeFileSync(f.policyFile,canonical({...f.registry,policies:[policy]}));
  f.options['--policy-digest']=readProducerPolicySnapshot(f.policyFile).policies[0].digest;
  assert.throws(()=>runCIRecipient({...f.options,'--apply':true}),{code:'CI_RECIPIENT_BUNDLE'});zeroLaunch(f);
  f.options['--bundle']=bundle;assert.equal(preflightCIRecipient(f.options).refresh,'offline-identified');zeroLaunch(f);
  fs.appendFileSync(bundle,'changed');assert.throws(()=>runCIRecipient({...f.options,'--apply':true}),{code:'CI_RECIPIENT_BUNDLE'});zeroLaunch(f);
});

test('online refresh does not silently become offline when a bundle is supplied',ownerTests,t=>{
  const f=fixture(t),bundle=path.join(f.base,'attestation.jsonl');fs.writeFileSync(bundle,'controlled offline fixture');
  assert.throws(()=>runCIRecipient({...f.options,'--bundle':bundle,'--apply':true}),{code:'CI_RECIPIENT_BUNDLE'});zeroLaunch(f);
});
