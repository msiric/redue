// Test-only explicit fresh-machine CI recipient. Never an automatic policy writer.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {canonical,parseEnvelope,parsePortableJson} from '../../src/portable-envelope.mjs';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
import {validateCIPolicy} from '../../src/portable-ci-trust.mjs';
import {writeControlledPortableProject,readMachineHostFacts,requireImportedEligibility} from './portable-machine.mjs';
import {runCIRecipient,readCIRecipientProject,requireFreshCIObserver} from './portable-ci-recipient.mjs';
const sha=v=>createHash('sha256').update(v).digest('hex'),HEX=/^[a-f0-9]{64}$/;
const fail=code=>{throw Object.assign(Error('Explicit CI machine recipient prerequisite failed'),{code});};
const flags=['--base','--tarball','--sha256','--source','--input','--registry','--registry-sha256','--policy-digest','--gh-executable','--gh-sha256','--run','--attempt','--manifest-sha256'];
export function ciMachineOptions(args){
 const out={};for(let at=0;at<args.length;at++){const key=args[at];if(![...flags,'--apply'].includes(key)||Object.hasOwn(out,key))fail('CI_MACHINE_OPTIONS');
 if(key==='--apply'){out[key]=true;continue;}const value=args[++at];if(!value||value.startsWith('--'))fail('CI_MACHINE_OPTIONS');out[key]=value;}
 for(const key of flags)if(typeof out[key]!=='string')fail('CI_MACHINE_OPTIONS');
 for(const key of ['--base','--tarball','--input','--registry','--gh-executable'])if(!path.isAbsolute(out[key])||out[key].includes('\0'))fail('CI_MACHINE_OPTIONS');
 for(const key of ['--sha256','--registry-sha256','--policy-digest','--gh-sha256','--manifest-sha256'])if(!HEX.test(out[key]))fail('CI_MACHINE_OPTIONS');
 if(!/^[a-f0-9]{40}$/.test(out['--source'])||!(/^[1-9][0-9]{0,15}$/.test(out['--run']))||!(/^[1-9][0-9]{0,8}$/.test(out['--attempt'])))fail('CI_MACHINE_OPTIONS');return out;
}
function directory(dir,{empty=false}={}){
 if(typeof process.getuid!=='function'||fs.realpathSync(dir)!==dir)fail('CI_MACHINE_PATH');
 const identities=[];let current=path.parse(dir).root;const pieces=dir.slice(current.length).split(path.sep).filter(Boolean);
 for(let at=0;at<pieces.length;at++){current=path.join(current,pieces[at]);const s=fs.lstatSync(current);
  if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid()&&s.uid!==0||(s.mode&0o022)!==0&&!(s.uid===0&&(s.mode&0o1000)!==0))fail('CI_MACHINE_PATH');
  if(at===pieces.length-1&&(s.uid!==process.getuid()||(s.mode&0o022)!==0))fail('CI_MACHINE_PATH');identities.push([current,s.dev,s.ino,s.uid,s.mode]);}
 if(empty&&fs.readdirSync(dir).length)fail('CI_MACHINE_OCCUPIED');return canonical(identities);
}
const fingerprint=s=>canonical(['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])));
function largeRegularBytes(file,limit){
 const parent=path.dirname(file),parents=directory(parent),before=fs.lstatSync(file,{bigint:true});let fd;
 if(fs.realpathSync(file)!==file||!before.isFile()||before.nlink!==1n||before.size>BigInt(limit))fail('CI_MACHINE_FILE');
 try{fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));const opened=fs.fstatSync(fd,{bigint:true});
 if(!opened.isFile()||fingerprint(before)!==fingerprint(opened))fail('CI_MACHINE_FILE');const bytes=Buffer.alloc(Number(opened.size));let at=0;while(at<bytes.length){const n=fs.readSync(fd,bytes,at,bytes.length-at,at);if(!n)fail('CI_MACHINE_FILE');at+=n;}
 if(fingerprint(opened)!==fingerprint(fs.fstatSync(fd,{bigint:true}))||fingerprint(opened)!==fingerprint(fs.lstatSync(file,{bigint:true}))||directory(parent)!==parents)fail('CI_MACHINE_FILE');return bytes;
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function ciMachinePreflight(options){
 const o=ciMachineOptions(Object.entries(options).flatMap(([k,v])=>v===true?[k]:[k,v]));directory(o['--base'],{empty:true});directory(o['--input']);
 if(!/^redue-ci-recipient-[a-zA-Z0-9_-]{1,24}$/.test(path.basename(o['--base']))||o['--base'].length>70)fail('CI_MACHINE_PATH');
 const names=['attestation-bundle.json','manifest.json','redue-portable-evidence.json'];
 if(canonical(fs.readdirSync(o['--input']).sort())!==canonical(names))fail('CI_MACHINE_TRANSFER');
 const evidence=readBoundedPortableFile(path.join(o['--input'],names[2]),{limit:1024*1024}),bundle=readBoundedPortableFile(path.join(o['--input'],names[0]),{limit:1024*1024}),
 manifestBytes=readBoundedPortableFile(path.join(o['--input'],names[1]),{limit:16384}),manifest=parsePortableJson(manifestBytes),envelope=parseEnvelope(evidence),p=envelope.statement.predicate;
 if(sha(manifestBytes)!==o['--manifest-sha256']||canonical(Object.keys(manifest).sort())!==canonical(['schema','source','package_sha256','package_filename','evidence_sha256','evidence_digest','bundle_sha256','origin_run_id','interpretation','scope','run_id','run_attempt','boot_identity','node_physical_identity','profile','profile_digest'].sort())||manifest.schema!==1||manifest.source!==o['--source']||manifest.package_sha256!==o['--sha256']||manifest.evidence_sha256!==sha(evidence)||
 manifest.evidence_digest!==envelope.digest||manifest.bundle_sha256!==sha(bundle)||manifest.origin_run_id!==p.origin.runId||
 manifest.interpretation!==p.interpretation||!p.origin.complete||p.origin.result!=='PASS'||manifest.scope!=='controlled-noLib-direct-typescript'||
 manifest.run_id!==o['--run']||manifest.run_attempt!==o['--attempt']||
 !HEX.test(manifest.boot_identity||'')||!HEX.test(manifest.node_physical_identity||'')||
 canonical(manifest.profile)!==canonical({platform:p.facts.platform,runtime:p.facts.runtime,compiler:p.facts.compiler})||sha(canonical(manifest.profile))!==manifest.profile_digest)fail('CI_MACHINE_TRANSFER');
 const registryBytes=readBoundedPortableFile(o['--registry'],{limit:65536}),registry=parsePortableJson(registryBytes);
 if(sha(registryBytes)!==o['--registry-sha256']||canonical(Object.keys(registry).sort())!==canonical(['interpretation','policies','revision','schema'])||
 registry.schema!==1||registry.interpretation!=='redue-producer-policy-registry@1'||registry.revision!==1||!Array.isArray(registry.policies)||registry.policies.length!==1)fail('CI_MACHINE_REGISTRY');
 const policy=validateCIPolicy(registry.policies[0]);if(sha(canonical(policy))!==o['--policy-digest']||policy.refresh!=='required'||policy.bundleSha256!==null||
 policy.sourceCommit!==o['--source']||policy.signerCommit!==o['--source']||policy.artifactSha256!==sha(evidence)||policy.evidenceDigest!==envelope.digest||policy.evidenceInterpretation!==p.interpretation)fail('CI_MACHINE_REGISTRY');
 if(sha(readBoundedPortableFile(o['--tarball']))!==o['--sha256']||sha(largeRegularBytes(o['--gh-executable'],128*1024*1024))!==o['--gh-sha256'])fail('CI_MACHINE_BYTES');
 return {options:o,registryBytes,policy,envelope,manifest};
}
export function provisionExactCIRegistry({state,root,configFile,bytes,sha256,apply=false}){
 if(!apply)fail('CI_MACHINE_EXPLICIT_APPLY');directory(state);directory(root);
 if(path.dirname(state)!==path.dirname(root)||path.basename(state)!=='redue-state'||path.basename(root)!=='Checkout 空间'||!/^redue-ci-recipient-[a-zA-Z0-9_-]{1,24}$/.test(path.basename(path.dirname(state))))fail('CI_MACHINE_OWNERSHIP');
 const ownerFile=path.join(state,'vstate-owner-v1.json'),ownerBefore=fs.lstatSync(ownerFile,{bigint:true}),stateBefore=directory(state),rootBefore=directory(root),ownerBytes=readBoundedPortableFile(ownerFile,{limit:8192});
 const expected={schema:1,kind:'vstate-product-alpha',config:configFile,root,state},owner=parsePortableJson(ownerBytes);
 const unchanged=()=>directory(state)===stateBefore&&directory(root)===rootBefore&&fingerprint(fs.lstatSync(ownerFile,{bigint:true}))===fingerprint(ownerBefore)&&readBoundedPortableFile(ownerFile,{limit:8192}).equals(ownerBytes);
 if(configFile!==path.join(state,'project-runtime-v1.json')||canonical(owner)!==canonical(expected)||sha(bytes)!==sha256||!unchanged())fail('CI_MACHINE_OWNERSHIP');
 for(const name of ['receipts-v1.json','runs-v1','portable-imports-v1.json','portable-import-pending-v1.json','portable-evidence-v1']){try{fs.lstatSync(path.join(state,name));fail('CI_MACHINE_HISTORY');}catch(error){if(error.code!=='ENOENT')throw error;}}
 const target=path.join(state,'portable-producers-v1.json');let fd,written;
 try{fd=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|(fs.constants.O_NOFOLLOW??0),0o600);
 const opened=fs.fstatSync(fd,{bigint:true});if(!opened.isFile()||opened.nlink!==1n||opened.uid!==BigInt(process.getuid())||(opened.mode&0o777n)!==0o600n)fail('CI_MACHINE_REGISTRY');
 fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);written=fs.fstatSync(fd,{bigint:true});
 if(!unchanged()||fingerprint(written)!==fingerprint(fs.lstatSync(target,{bigint:true})))fail('CI_MACHINE_OWNERSHIP');
 }finally{if(fd!==undefined)fs.closeSync(fd);}
 if(!readBoundedPortableFile(target,{limit:65536}).equals(bytes)||fingerprint(written)!==fingerprint(fs.lstatSync(target,{bigint:true}))||!unchanged())fail('CI_MACHINE_OWNERSHIP');
}
// The live resource never escapes an awaited trusted engineering supervisor.
// Imported data cannot select callbacks, execute code, authorize a model or
// change trust. Abrupt host termination still needs its owner's process cleanup.
function openCIMachineRecipientPhase(options){
 const checked=ciMachinePreflight(options),o=checked.options,base=o['--base'],root=path.join(base,'Checkout 空间'),state=path.join(base,'redue-state'),prefix=path.join(base,'prefix'),calls=[];
 const preview={schema:1,applied:false,preconditions:'READY_NOT_APPROVED',models_launched:0,producer_accepted:false,calls};
 if(!o['--apply'])return {preview};
 if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||os.release()!=='25.6.0')fail('CI_MACHINE_PROFILE');
 const exec=(kind,file,args,{cwd=base,allowFailure=false}={})=>{const start=performance.now(),r=childProcess.spawnSync(file,args,{cwd,env:process.env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 calls.push({kind,milliseconds:performance.now()-start,status:r.status,error_code:r.error?.code??null});if(!allowFailure&&(r.status!==0||r.error||r.signal))fail('CI_MACHINE_COMMAND');return r;};
 let started=false,lifecycle='preparing',host,configBytes,configIdentity,rootIdentity,cliDigest,stateIdentity,ownerBytes,ownerIdentity;
 const config=path.join(root,'redue.config.json'),cli=path.join(prefix,'lib/node_modules/@redue/cli/bin/redue.mjs');
 const verifyCLI=()=>{if(sha(readBoundedPortableFile(cli,{limit:65536}))!==cliDigest)fail('CI_MACHINE_CLI_CHANGED');};
 const redue=(...args)=>{verifyCLI();return exec('redue',process.execPath,[cli,'--config',config,'--state-dir',state,...args],{cwd:root});},json=(...args)=>parsePortableJson(redue(...args,'--json').stdout);
 const close=(strict=false)=>{
  if(lifecycle==='closed')return;lifecycle='closed';if(!started)return;started=false;
  verifyCLI();const stopped=exec('owned-stop',process.execPath,[cli,'--config',config,'--state-dir',state,'stop'],{cwd:root,allowFailure:true});
  if(strict){
   if(stopped.status!==0||stopped.error||stopped.signal)fail('CI_MACHINE_CLEANUP');
   let answer;try{answer=parsePortableJson(stopped.stdout);}catch{fail('CI_MACHINE_CLEANUP');}
   if(answer.ok!==true)fail('CI_MACHINE_CLEANUP');
   try{fs.lstatSync(path.join(state,'observer.lock'));fail('CI_MACHINE_CLEANUP');}catch(error){if(error.code!=='ENOENT')throw error;}
  }
 };
 try{
  host=readMachineHostFacts(base,{spawn:childProcess.spawnSync});exec('install','npm',['install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',o['--tarball']]);
  cliDigest=sha(readBoundedPortableFile(cli,{limit:65536}));
  const installed=path.dirname(path.dirname(cli)),script=`import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';const h=v=>createHash('sha256').update(v).digest('hex'),node=fs.realpathSync(process.execPath),s=fs.statSync(node,{bigint:true});const b=spawnSync('/usr/sbin/sysctl',['-n','kern.bootsessionuuid'],{encoding:'utf8',timeout:3000,maxBuffer:4096});if(b.status!==0||!(/^[a-fA-F0-9-]{36}$/.test(b.stdout.trim())))throw Error('BOOT');const {portableRuntime}=await import(pathToFileURL(path.join(process.argv[1],'src/portable-runtime.mjs')));console.log(JSON.stringify({runtime:portableRuntime(),boot:h(b.stdout.trim()),physical:h(JSON.stringify({dev:String(s.dev),file:node,ino:String(s.ino),mtime:String(s.mtimeNs)}))}));`;
  const proof=parsePortableJson(exec('reviewed-runtime',process.execPath,['--input-type=module','-e',script,installed]).stdout);
  if(canonical(proof.runtime)!==canonical(checked.manifest.profile.runtime)||proof.boot===checked.manifest.boot_identity||proof.physical===checked.manifest.node_physical_identity)fail('CI_MACHINE_INDEPENDENT_PROFILE');
  writeControlledPortableProject(root);exec('dependencies','npm',['install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:root});exec('checkout','git',['init','-q'],{cwd:root});
  const preview=json('init','--recipe','typescript-direct','--check','typecheck','--dry-run');if(preview.written!==false||preview.checks[0]?.level!=='ready')fail('CI_MACHINE_SETUP');
  redue('init','--recipe','typescript-direct','--check','typecheck');
  configBytes=readBoundedPortableFile(config,{limit:65536});configIdentity=fingerprint(fs.lstatSync(config,{bigint:true}));rootIdentity=directory(root);lifecycle='prepared';
 }catch(error){error.machine_recipient_calls=calls;close();throw error;}
 const active=()=>{if(lifecycle!=='eligible')fail('CI_MACHINE_LIFECYCLE');};
 const bindings=()=>{
  verifyCLI();if(directory(root)!==rootIdentity||!readBoundedPortableFile(config,{limit:65536}).equals(configBytes)||fingerprint(fs.lstatSync(config,{bigint:true}))!==configIdentity)fail('CI_MACHINE_PREPARATION_CHANGED');
  if(ownerBytes){const ownerFile=path.join(state,'vstate-owner-v1.json');if(directory(state)!==stateIdentity||!readBoundedPortableFile(ownerFile,{limit:8192}).equals(ownerBytes)||fingerprint(fs.lstatSync(ownerFile,{bigint:true}))!==ownerIdentity)fail('CI_MACHINE_OWNERSHIP');}
 };
 const paths=Object.freeze({base,root,state,prefix,config,cli});
 return {paths,calls,close,activate(){
  if(lifecycle!=='prepared')fail('CI_MACHINE_LIFECYCLE');
  // Guidance preparation must not replace the selected config or initialize a
  // different state/observer/history before the fresh owned baseline.
  bindings();
  try{fs.lstatSync(state);fail('CI_MACHINE_PREPARATION_CHANGED');}catch(error){if(error.code!=='ENOENT')throw error;}
  started=true;lifecycle='observing';redue('start');
  readCIRecipientProject({configFile:config,root,state,cliEntry:cli});
  const ownerFile=path.join(state,'vstate-owner-v1.json');ownerBytes=readBoundedPortableFile(ownerFile,{limit:8192});ownerIdentity=fingerprint(fs.lstatSync(ownerFile,{bigint:true}));stateIdentity=directory(state);
  requireFreshCIObserver(json('status','--sync'));
  // Re-read selected exact inputs after setup. Base is now intentionally occupied;
  // raw registry must still match before the only explicit new-state policy copy.
  const current=readBoundedPortableFile(o['--registry'],{limit:65536});if(!current.equals(checked.registryBytes))fail('CI_MACHINE_REGISTRY');
  provisionExactCIRegistry({state,root,configFile:path.join(state,'project-runtime-v1.json'),bytes:current,sha256:o['--registry-sha256'],apply:true});
  const result=runCIRecipient({'--cli-entry':cli,'--cli-sha256':sha(readBoundedPortableFile(cli,{limit:65536})),'--config':config,'--state':state,'--root':root,
   '--artifact':path.join(o['--input'],'redue-portable-evidence.json'),'--policy-digest':o['--policy-digest'],'--source':o['--source'],'--signer':o['--source'],
   '--gh-executable':o['--gh-executable'],'--gh-sha256':o['--gh-sha256'],'--apply':true});

  lifecycle='eligible';return {...result,host_facts:host,independent_boot:true,raw_node_identity_differs:true,setup_calls:calls,
    scope:'Authenticated controlled noLib CLI preparation; supervising actions require separate authority.'};
 },status(){active();bindings();const value=json('status','--sync');bindings();return value;},restart(){
  active();redue('stop');started=true;redue('start');
 }};
}
export function runCIMachineRecipient(options){
 const phase=openCIMachineRecipientPhase(options);if(phase.preview)return phase.preview;
 const {root,state}=phase.paths;
 try{
  const result=phase.activate(),identity={digest:result.evidence_digest,originRunId:result.origin_run_id};
  fs.writeFileSync(path.join(root,'notes.md'),'Unrelated documentation.\n');requireImportedEligibility(phase.status(),identity);
  phase.restart();requireImportedEligibility(phase.status(),identity);
  fs.writeFileSync(path.join(root,'src/a.ts'),'export const value: number = 2;\n');const changed=phase.status().checks.find(c=>c.name==='typecheck');
  if(changed?.freshness!=='STALE'||changed.reuse_eligible!==false||fs.existsSync(path.join(state,'runs-v1')))fail('CI_MACHINE_INVALIDATION');
  return {...result,unrelated_reuse:true,restart_inherited:true,relevant_edit_stale:true,equivalent_receiver_execution:false,
    scope:'Authenticated controlled noLib CLI handoff; no agent models or useful-project/field claim.'};
 }catch(error){error.machine_recipient_calls=phase.calls;throw error;}
 finally{phase.close();}
}
// Awaited callbacks share this cap; existing synchronous child hard deadlines
// remain in force. Trusted callbacks must yield and consume the supplied signal
// for their own children; this is not preemption of arbitrary JS or sandboxing.
export const heldCIMachineRecipientTimeoutMs=300000;
export async function withHeldCIMachineRecipient(options,{prepare,supervise,signal,timeoutMs=heldCIMachineRecipientTimeoutMs}={}){
 if(typeof prepare!=='function'||typeof supervise!=='function'||signal!==undefined&&!(signal instanceof AbortSignal)||
   !Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>heldCIMachineRecipientTimeoutMs)fail('CI_MACHINE_SUPERVISOR');
 if(signal?.aborted)fail('CI_MACHINE_ABORTED');
 const controller=new AbortController(),deadline=performance.now()+timeoutMs;
 const abort=()=>controller.abort(Object.assign(Error('Owned recipient supervision cancelled'),{code:'CI_MACHINE_ABORTED'}));
 signal?.addEventListener('abort',abort,{once:true});let phase,failure;
 const awaitBound=callback=>{
  if(signal?.aborted)abort();if(controller.signal.aborted)throw controller.signal.reason;
  const remaining=Math.ceil(deadline-performance.now());if(remaining<=0)fail('CI_MACHINE_TIMEOUT');
  let timer,ended;
  const waiting=new Promise((resolve,reject)=>{
   ended=()=>reject(controller.signal.reason);timer=setTimeout(()=>controller.abort(Object.assign(Error('Owned recipient supervision deadline exhausted'),{code:'CI_MACHINE_TIMEOUT'})),remaining);
   controller.signal.addEventListener('abort',ended,{once:true});
   Promise.resolve().then(()=>{if(controller.signal.aborted)throw controller.signal.reason;return callback();}).then(resolve,reject);
  });
  return waiting.finally(()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',ended);});
 };
 try{
  phase=openCIMachineRecipientPhase(options);if(phase.preview)return phase.preview;
  // Caller-owned reviewed instruction setup finishes BEFORE observer/import.
  // This helper never fabricates doctor output or installed-policy authority.
  await awaitBound(()=>prepare(phase.paths,Object.freeze({signal:controller.signal})));
  if(signal?.aborted)abort();if(controller.signal.aborted)throw controller.signal.reason;
  if(performance.now()>=deadline)fail('CI_MACHINE_TIMEOUT');
  const preparation=phase.activate(),baseline=phase.status();
  requireImportedEligibility(baseline,{digest:preparation.evidence_digest,originRunId:preparation.origin_run_id});
  if(baseline.checks.find(c=>c.name==='typecheck')?.imported_evidence?.acceptance!=='github-ci-v1'||fs.existsSync(path.join(phase.paths.state,'runs-v1')))fail('CI_MACHINE_INVALIDATION');
  const supervision=await awaitBound(()=>supervise(Object.freeze({paths:phase.paths,baseline,signal:controller.signal,status:()=>{
   if(controller.signal.aborted)throw controller.signal.reason;return phase.status();
  }})));
  if(signal?.aborted)abort();if(controller.signal.aborted)throw controller.signal.reason;
  if(performance.now()>=deadline)fail('CI_MACHINE_TIMEOUT');
  return {schema:1,prepared_eligible:true,supervised_lifecycle_closed:true,preparation,supervision};
 }catch(error){failure=error;error.machine_recipient_calls=phase?.calls??[];throw error;}
 finally{
  signal?.removeEventListener('abort',abort);if(!controller.signal.aborted)controller.abort(Object.assign(Error('Owned recipient supervision ended'),{code:'CI_MACHINE_CLOSED'}));
  try{if(phase&&!phase.preview)phase.close(true);}catch(error){error.machine_recipient_calls=phase.calls;if(failure)failure.cleanup_code=error.code??'CI_MACHINE_CLEANUP';else throw error;}
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(runCIMachineRecipient(ciMachineOptions(process.argv.slice(2)))));}
 catch(e){console.error(JSON.stringify({schema:1,code:e.code??'CI_MACHINE_ASSERTION',models_launched:0,calls:e.machine_recipient_calls??[],recipient_calls:e.recipient_calls??[]}));process.exitCode=1;}}
