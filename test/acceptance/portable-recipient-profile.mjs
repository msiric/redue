// Fixed phase diagnosis on frozen exact bytes. No model, trust/signing, or broad matrix.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readArtifact} from './package-artifact.mjs';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
import {smokeEvidenceObservation} from './portable-smoke-economics.mjs';
const args=process.argv.slice(2);
assert.equal(args.length,2);assert.equal(args[0],'--manifest');
const artifact=readArtifact(path.resolve(args[1]));
assert.equal(artifact.sha256,'f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0');
assert.equal(artifact.metadata.version,'0.1.0-alpha.11');
assert.equal(fs.readFileSync(path.join(path.dirname(artifact.file),'source.txt'),'utf8').trim(),'08307d4ccf5a43d2339c4cb634dd0129c0fcc964');
assert.equal(process.platform,'darwin');assert.equal(process.arch,'arm64');assert.equal(process.version,'v22.13.0');
const base=fs.realpathSync(fs.mkdtempSync('/tmp/redue-recipient-profile-')),
 prefix=path.join(base,'prefix'),trace=path.join(base,'phases.jsonl'),binary=path.join(prefix,'bin','redue');
fs.writeFileSync(trace,'',{flag:'wx',mode:0o600});
const env={...process.env,REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:trace},commands=[],samples=[],statusObservations=[];
let active=null,failure=null,digest=null,originRunId=null,stage='setup',cleanupConfirmed=true;
const roles=['origin','recipient'],root=r=>path.join(base,r),state=r=>path.join(base,'redue-'+r),stopConfirmed=new Set();
function execute(argv,cwd,{role=null,action='setup',assertSuccess=true}={}){
 const before=performance.now(),r=spawnSync(argv[0],argv.slice(1),{cwd,env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
 const result={role,action,stage,sample:active,milliseconds:performance.now()-before,exit:r.status,signal:r.signal,timed_out:r.error?.code==='ETIMEDOUT'};
 commands.push(result);if(assertSuccess)assert.equal(r.status,0,'Fixed owned command failed; output intentionally withheld');return r;
}
const cli=(role,...argv)=>execute([binary,'--config',path.join(root(role),'redue.config.json'),'--state-dir',state(role),...argv],root(role),{role,action:argv[0]});
function stop(role){
 const r=cli(role,'stop','--json');const result=JSON.parse(r.stdout);
 assert.equal(result.ok,true,'Exact owned stop acknowledgment required');
 assert(!fs.existsSync(path.join(state(role),'observer.lock'))&&!fs.existsSync(path.join(state(role),'observer.sock')),'Stop boundary remains unresolved');
 stopConfirmed.add(role);
}
function inspectStatus(role){
 const r=execute([binary,'--config',path.join(root(role),'redue.config.json'),'--state-dir',state(role),'status','--sync','--json'],root(role),{role,action:'status',assertSuccess:false});
 let s=null;try{s=JSON.parse(r.stdout);}catch{}
 const observed=smokeEvidenceObservation(stage,s,commands.length-1);
 statusObservations.push({role,stage,sample:active,observed});
 assert.equal(r.status,0,'Status failure retained before outcome assertion');
 assert.equal(observed.schema,1);assert(observed.observation_healthy);assert.equal(observed.freshness,'CURRENT');assert.equal(observed.result,'PASS');assert(observed.reuse_eligible);
 return observed;
}
function write(rootDir,file,value){const p=path.join(rootDir,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);}
try{
 execute(['npm','install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',artifact.file],base);
 for(const role of roles){
  fs.mkdirSync(root(role));write(root(role),'package.json',JSON.stringify({name:'redue-recipient-phase-control',private:true,scripts:{typecheck:'tsc --noEmit'},devDependencies:{typescript:'5.6.3'}}));
  write(root(role),'tsconfig.json',JSON.stringify({compilerOptions:{strict:true,noEmit:true,noLib:true,target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
  write(root(role),'src/globals.d.ts','interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
  write(root(role),'src/index.ts','export const value: number = 1;\n');
  execute(['npm','install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],root(role));
  execute(['git','init','-q'],root(role));cli(role,'init','--recipe','typescript-direct','--check','typecheck');cli(role,'start');
 }
 stage='origin-baseline';cli('origin','run','typecheck','--portable');originRunId=inspectStatus('origin').run_id;
 const envelope=path.join(base,'profile-control.evidence.json');
 const exported=JSON.parse(cli('origin','evidence','export','typecheck','--output',envelope,'--json').stdout);
 assert.equal(exported.origin.complete,true);digest=exported.digest;
 stage='recipient-import';cli('recipient','evidence','import',envelope,'--check','typecheck','--accept-digest',digest,'--apply','--json');
 for(let session=1;session<=3;session++){
  active=null;stage='observer-session';if(session>1){stop('recipient');stopConfirmed.delete('recipient');cli('recipient','start');}
  for(let iteration=1;iteration<=2;iteration++){
   stage='recipient-query';active={session,iteration};const observed=inspectStatus('recipient');
   assert.equal(observed.evidence_source,'imported');assert.equal(observed.imported_digest,digest);assert.equal(observed.origin_run_id,originRunId);
   samples.push({...active,milliseconds:commands.at(-1).milliseconds,observed});
  }
 }
}catch{failure={stage,sample:active,reason_code:'FIXED_PRECONDITION_OR_COMMAND_FAILED'};}
finally{
 active=null;stage='cleanup';for(const role of roles)if(fs.existsSync(root(role))&&fs.existsSync(binary)){
  try{
   if(fs.existsSync(path.join(state(role),'project-runtime-v1.json')))stop(role);
   else if(!fs.existsSync(path.join(state(role),'observer.lock'))&&!fs.existsSync(path.join(state(role),'observer.sock')))stopConfirmed.add(role);
  }catch{cleanupConfirmed=false;failure??={stage,sample:null,reason_code:'OWNED_OBSERVER_STOP_FAILED'};}
 }
 // Project-independent opt-in records contain only static phase names/counts/identities.
 let phases=[],diagnosticsAvailable=false;
 try{
  const raw=readBoundedPortableFile(trace,{limit:1024*1024}),lines=raw.toString('utf8').split('\n');
  assert(lines.length<=4096);
  const phasesKnown=new Set(["certificate.input_complete", "certificate.input_start", "certificate.queries_complete", "certificate.queries_start", "cli.child_started", "cli.command_resolution", "cli.compiler_execution", "cli.config_resolution", "cli.context_after", "cli.context_before", "cli.direct_context", "cli.end_checkpoint", "cli.loaded", "cli.prelaunch_checkpoint", "cli.probe", "cli.receipt_persistence", "cli.receipt_reload", "cli.run_certificate", "cli.run_lock", "cli.run_total", "cli.run_validation_skipped", "cli.start_checkpoint", "cli.synchronized_status", "client.control_complete", "client.control_connect", "client.control_error", "client.control_submit", "client.control_timeout", "daemon.catch_up_join", "daemon.decision_reason", "daemon.installed_inode_setup", "daemon.plan_probes", "daemon.plan_total", "daemon.plan_worker", "daemon.probe", "daemon.probe_complete", "daemon.probe_context_validation", "daemon.probe_launch", "daemon.probe_reason", "daemon.request_applicability", "daemon.request_catch_up", "daemon.request_content_validation", "daemon.request_installed_from_reconcile", "daemon.request_installed_recheck", "daemon.request_probes", "daemon.request_total", "direct_probe.implementation", "direct_probe.query_validation", "history.complete", "history.events_complete", "history.snapshot_complete", "history.snapshot_start", "history.submit", "history.worker_loaded", "plan.installed_resolution", "plan.workspace_inputs", "pnpm.dependency_closure", "pnpm.hardlink_inspection", "pnpm.input_mapping", "pnpm.install_metadata", "pnpm.total_discovery", "pnpm.ts_config", "pnpm.ts_input_listing", "pnpm.workspace_discovery", "portable_cache.complete", "portable_cache.member_complete", "portable_cache.member_start", "portable_cache.members", "portable_cache.progress", "portable_cache.start", "portable_probe.complete", "portable_probe.discovery_complete", "portable_probe.discovery_start", "portable_probe.launch", "portable_probe.runtime_complete", "portable_probe.runtime_start", "portable_runtime.cache_complete", "portable_runtime.complete", "portable_runtime.helper_complete", "portable_runtime.node_complete", "portable_runtime.openssl_complete", "portable_runtime.start", "server.decision_start", "server.periodic_complete", "server.periodic_start", "server.request_complete", "server.request_received", "server.response_constructed", "server.response_delivered", "typescript_contract.list_files", "worker.compiler_queries", "worker.config_load", "worker.discovery_reason", "worker.plan_validation", "worker.retained_state_validation", "worker.total"]);
  const numeric=['at','pid','ms','rssMiB','deadlineMs','available','timedOut','queries','loadedImages','members','totalBytes','member','bytes','completedBytes','readMs','hashMs','decision','pending','decisionRequests','historyDeadlineMs','reconciliationDeadlineMs','notifications','planRebuilds','checks','files','commands','watches'];
  const booleans=['planDirty','planning','recovering','healthy','historyDisabled','matched'];
  for(const line of lines){
   if(!line.startsWith('REDUE_TIMING '))continue;
   const r=JSON.parse(line.slice(13));assert(r&&typeof r==='object'&&!Array.isArray(r));
   if(!phasesKnown.has(r.phase))continue;
   const row={phase:r.phase};
   if(typeof r.monoNs==='string'&&/^\d{1,24}$/.test(r.monoNs))row.monoNs=r.monoNs;
   for(const k of ['request','generation'])if(typeof r[k]==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(r[k]))row[k]=r[k];
   if(typeof r.work==='string'&&(['startup','client','request','periodic','checkpoint'].includes(r.work)||/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(r.work)))row.work=r.work;
   for(const k of numeric)if(typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0)row[k]=r[k];
   for(const k of booleans)if(typeof r[k]==='boolean')row[k]=r[k];
   phases.push(row);
  }
  diagnosticsAvailable=phases.length>0;
 }catch{phases=[];failure??={stage:'diagnostic-collection',sample:null,reason_code:'BOUNDED_DIAGNOSTICS_UNAVAILABLE'};}
 const stopped=cleanupConfirmed&&roles.every(role=>stopConfirmed.has(role)&&!fs.existsSync(path.join(state(role),'observer.lock'))&&!fs.existsSync(path.join(state(role),'observer.sock')));
 if(!stopped)failure??={stage:'cleanup',sample:null,reason_code:'OWNED_OBSERVER_STILL_PRESENT'};
 console.log(JSON.stringify({schema:1,scope:'FIXED_EXACT_CANDIDATE_PHASE_DIAGNOSIS',candidate_sha256:artifact.sha256,source:'08307d4ccf5a43d2339c4cb634dd0129c0fcc964',
  platform:process.platform,arch:process.arch,node:process.version,release:os.release(),predeclared:{sessions:3,queries_per_session:2},samples,statusObservations,commands,phases,diagnosticsAvailable,failure,cleanup:stopped?'OWNED_OBSERVERS_STOPPED':'OWNED_FIXTURE_RETAINED',
  model_trials:0,signing:false,trust_scope:'owned local exact digest only; not refreshed authenticated handoff',ordinary_project:'NOT_TESTED_BY_THIS_CONTROL'}));
 // Only the short base minted above, not existing state/receipts/pilot installations.
 if(stopped)fs.rmSync(base,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
if(failure)process.exitCode=1;
