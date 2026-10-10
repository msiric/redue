// Queued explicit CI recipient acceptance. No installation, policy creation,
// observer startup, signing, or model launch. The installed recipient engine,
// not this harness, independently establishes applicability.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import childProcess from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {canonical,parseEnvelope,parsePortableJson} from '../../src/portable-envelope.mjs';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
import {readProducerPolicySnapshot,revalidateProducerPolicySnapshot} from '../../src/portable-producer-policy.mjs';
import {readImportedSnapshot} from '../../src/portable-store.mjs';
import {requireImportedEligibility} from './portable-machine.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex'),HEX=/^[a-f0-9]{64}$/,COMMIT=/^[a-f0-9]{40}$/;
const fail=code=>{throw Object.assign(Error('CI recipient prerequisite or acceptance is unavailable'),{code});};
const paths=['--cli-entry','--config','--state','--root','--artifact','--gh-executable'];
const digests=['--cli-sha256','--policy-digest','--gh-sha256'];
const commits=['--source','--signer'];
export function ciRecipientOptions(args){
  const out={};
  for(let at=0;at<args.length;at++){
    const flag=args[at];
    if(![...paths,...digests,...commits,'--bundle','--apply'].includes(flag)||Object.hasOwn(out,flag))fail('CI_RECIPIENT_OPTIONS');
    if(flag==='--apply'){out[flag]=true;continue;}
    const value=args[++at];if(!value||value.startsWith('--'))fail('CI_RECIPIENT_OPTIONS');out[flag]=value;
  }
  if(paths.some(key=>typeof out[key]!=='string'||!path.isAbsolute(out[key])||out[key].includes('\0'))||
    digests.some(key=>!HEX.test(out[key]??''))||commits.some(key=>!COMMIT.test(out[key]??''))||
    out['--bundle']&&(!path.isAbsolute(out['--bundle'])||out['--bundle'].includes('\0')))fail('CI_RECIPIENT_OPTIONS');
  return out;
}
function regularCanonical(file){
  try{const stat=fs.lstatSync(file);if(fs.realpathSync(file)!==file||!stat.isFile()||stat.nlink!==1)fail('CI_RECIPIENT_FILE');}
  catch{fail('CI_RECIPIENT_FILE');}
}
function noLocalExecution(state){
  const runs=path.join(state,'runs-v1'),receipts=path.join(state,'receipts-v1.json');
  try{const stat=fs.lstatSync(runs);if(!stat.isDirectory()||stat.isSymbolicLink()||fs.readdirSync(runs).length)fail('CI_RECIPIENT_LOCAL_EXECUTION');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  try{fs.lstatSync(receipts);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  const selected=parsePortableJson(readBoundedPortableFile(receipts));
  if(selected.schema!==1||!selected.checks||Object.keys(selected.checks).length)fail('CI_RECIPIENT_LOCAL_EXECUTION');
  return sha(canonical(selected));
}
export function preflightCIRecipient(input){
  const options=ciRecipientOptions(Object.entries(input).flatMap(([key,value])=>value===true?[key]:[key,value]));
  const state=options['--state'],root=options['--root'],runtimeFile=path.join(state,'project-runtime-v1.json');
  const snapshot=readProducerPolicySnapshot(path.join(state,'portable-producers-v1.json'));
  const selected=snapshot.policies.find(item=>item.digest===options['--policy-digest']);
  if(!selected)fail('CI_RECIPIENT_POLICY');
  const bytes=readBoundedPortableFile(options['--artifact'],{limit:1024*1024}),envelope=parseEnvelope(bytes),p=envelope.statement.predicate,policy=selected.policy;
  if(policy.sourceCommit!==options['--source']||policy.signerCommit!==options['--signer']||policy.artifactSha256!==sha(bytes)||
    policy.evidenceDigest!==envelope.digest||policy.evidenceInterpretation!==p.interpretation||!p.origin.complete||p.origin.result!=='PASS')fail('CI_RECIPIENT_IDENTITY');
  if(policy.refresh==='offline-identified'){
    if(!options['--bundle']||sha(readBoundedPortableFile(options['--bundle']))!==policy.bundleSha256)fail('CI_RECIPIENT_BUNDLE');
  }else if(options['--bundle'])fail('CI_RECIPIENT_BUNDLE');
  // No verifier process is started here. The real applied CLI authentication
  // independently checks the entire selected native gh binary before execution.
  regularCanonical(options['--gh-executable']);
  if(sha(readBoundedPortableFile(options['--cli-entry'],{limit:65536}))!==options['--cli-sha256'])fail('CI_RECIPIENT_CLI');
  const config=parsePortableJson(readBoundedPortableFile(options['--config'],{limit:65536})),
    runtime=parsePortableJson(readBoundedPortableFile(runtimeFile,{limit:65536}));
  if(config.schema!==1||!Array.isArray(config.checks)||!config.checks.some(check=>check.name==='typecheck')||
    runtime.schema!==1||runtime.root!==root||runtime.state!==state||!Array.isArray(runtime.checks)||
    !runtime.checks.some(check=>check.name==='typecheck'&&check.qualification==='npm-typescript-direct-v1'))fail('CI_RECIPIENT_PROJECT');
  const imports=readImportedSnapshot(state,{configFile:runtimeFile,root});if(imports.error)fail('CI_RECIPIENT_OWNERSHIP');
  if(imports.records.length)fail('CI_RECIPIENT_ALREADY_IMPORTED');
  const history=noLocalExecution(state);
  if(!revalidateProducerPolicySnapshot(snapshot,{expectedFile:path.join(state,'portable-producers-v1.json')}))fail('CI_RECIPIENT_POLICY');
  return {options,snapshot,history,envelope,artifactSha256:sha(bytes),evidenceDigest:envelope.digest,
    originRunId:p.origin.runId,refresh:policy.refresh};
}
export function runCIRecipient(options){
  const initial=preflightCIRecipient(options),calls=[],state=initial.options['--state'],root=initial.options['--root'];
  const report={schema:1,source:initial.options['--source'],signer:initial.options['--signer'],artifact_sha256:initial.artifactSha256,
    evidence_digest:initial.evidenceDigest,origin_run_id:initial.originRunId,policy_digest:initial.options['--policy-digest'],
    policy_revision:initial.snapshot.revision,refresh:initial.refresh,globally_latest:false,models_launched:0,
    cli_entry_sha256:initial.options['--cli-sha256'],gh_executable_sha256:initial.options['--gh-sha256'],
    producer_verified:false,producer_accepted:false,recipient_reuse_eligible:false,calls};
  try {
  if(!initial.options['--apply'])return {...report,applied:false,preconditions:'READY',applicability:'NOT_EVALUATED'};
  const invoke=(operation,args)=>{
    if(sha(readBoundedPortableFile(initial.options['--cli-entry'],{limit:65536}))!==initial.options['--cli-sha256'])fail('CI_RECIPIENT_CLI');
    const started=performance.now(),result=childProcess.spawnSync(process.execPath,[initial.options['--cli-entry'],
      '--config',initial.options['--config'],'--state-dir',state,...args,'--json'],{cwd:root,env:process.env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
    calls.push({operation,milliseconds:performance.now()-started,status:result.status,error_code:result.error?.code??null});
    if(result.status!==0)fail('CI_RECIPIENT_COMMAND');
    try{return parsePortableJson(result.stdout);}catch{fail('CI_RECIPIENT_RESPONSE');}
  };
  const ready=invoke('recipient preflight',['status','--sync']);
  if(ready.schema!==1||ready.observation?.healthy!==true||!ready.checks?.some(check=>check.name==='typecheck'&&check.verification_recipe==='npm-direct-typescript@1'))fail('CI_RECIPIENT_OBSERVER');
  const args=['evidence','import',initial.options['--artifact'],'--check','typecheck','--ci-policy-digest',initial.options['--policy-digest'],
    '--gh-executable',initial.options['--gh-executable'],'--gh-sha256',initial.options['--gh-sha256'],
    ...(initial.options['--bundle']?['--bundle',initial.options['--bundle']]:[])];
  const preview=invoke('CI preview',args);
  if(preview.apply!==false||preview.producer_verified!==false||preview.producer_accepted!==false||preview.digest!==initial.evidenceDigest)fail('CI_RECIPIENT_PREVIEW');
  const current=preflightCIRecipient(initial.options);
  if(current.artifactSha256!==initial.artifactSha256||current.evidenceDigest!==initial.evidenceDigest||current.history!==initial.history||
    current.snapshot.contentDigest!==initial.snapshot.contentDigest||current.snapshot.revision!==initial.snapshot.revision)fail('CI_RECIPIENT_CHANGED');
  const accepted=invoke('authenticated CI import',[...args,'--apply']);
  if(accepted.producer_verified!==true||accepted.producer_accepted!==true||accepted.reuse_eligible!==false||accepted.acceptance!=='github-ci-v1'||accepted.digest!==initial.evidenceDigest)fail('CI_RECIPIENT_ACCEPTANCE');
  const visible=invoke('recipient applicability',['status','--sync']);
  const check=requireImportedEligibility(visible,{digest:initial.evidenceDigest,originRunId:initial.originRunId});
  if(check.imported_evidence.acceptance!=='github-ci-v1'||noLocalExecution(state)!==initial.history)fail('CI_RECIPIENT_LOCAL_EXECUTION');
  return {...report,applied:true,producer_verified:true,producer_accepted:true,recipient_reuse_eligible:true,
    equivalent_receiver_execution:false,applicability:'CURRENT',visible_evidence:{schema:visible.schema,healthy:visible.observation.healthy,
      freshness:check.freshness,result:check.result,reuse_eligible:check.reuse_eligible,evidence_source:check.evidence_source,
      invocation:check.invocation,imported_evidence:check.imported_evidence},
    limitation:'No model launched. Compiler evidence only; no whole-package installation or globally-latest claim.'};
  } catch(error) { error.recipient_calls=calls;throw error; }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(runCIRecipient(ciRecipientOptions(process.argv.slice(2)))));}
  catch(error){console.error(JSON.stringify({schema:1,result:'FAILED_PRECONDITION_OR_ACCEPTANCE',code:error.code??'ASSERTION',models_launched:0,calls:error.recipient_calls??[]}));process.exitCode=1;}
}
