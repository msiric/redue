// Exact installed candidate mechanics. No model launch, account changes or normal
// installations. The controlled noLib project is not useful-project adoption.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {assertSmokeRootCwd,assertOrdinaryPostImportOutcome,finishOwnedSmokeBase,smokeEvidenceObservation,summarizeSmokeEconomics} from './portable-smoke-economics.mjs';
const options={};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];
  assert(!Object.hasOwn(options,key),'Explicit unique artifact options required');
  if(key==='--economics'){options[key]=true;continue;}
  const value=process.argv[++i];
  assert(['--tarball','--sha256','--source','--baseline'].includes(key)&&value,'Explicit unique artifact options required');options[key]=value;
}
assert(options['--tarball']&&/^[a-f0-9]{64}$/.test(options['--sha256']||'')&&/^[a-f0-9]{7,40}$/.test(options['--source']||''),
  'Use --tarball FILE --sha256 SHA256 --source COMMIT [--baseline @redue/cli@VERSION] [--economics]');
const tarball=path.resolve(options['--tarball']),bytes=fs.readFileSync(tarball),
  checksum=createHash('sha256').update(bytes).digest('hex');
assert.equal(checksum,options['--sha256'],'Exact candidate checksum mismatch: no installation launched');
assert.equal(process.platform,'darwin','This preliminary portable profile has macOS-only acceptance');
assert.equal(process.arch,'arm64','This preliminary portable profile has ARM64-only acceptance');
// macOS's default per-user tmp path can exceed Unix socket limits. Canonicalize
// an owned short temporary directory; do not use a symlink as a state target.
const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'redue-pe-installed-'))),
  prefix=path.join(base,'candidate-prefix'),baselinePrefix=path.join(base,'published-prefix'),
  origin=path.join(base,'Origin 空间'),recipient=path.join(base,'Recipient 空间'),
  originState=path.join(base,'redue-origin'),recipientState=path.join(base,'redue-recipient'),npm=findExecutable('npm');
const env={...process.env},observations=[],commandTimings=[],servedStatusObservations=[];
let timingScope='setup',workflowStarted=null,workflowElapsed=null,finalReport,acceptanceFailure;
const put=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);};
function exec(command,{cwd=base,failure=false,phase='setup-or-compatibility',project=null}={}){
  const launch=windowsLaunch(command),started=performance.now(),result=spawnSync(launch.file,launch.args,
    {...launch.options,cwd,env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  const milliseconds=performance.now()-started;
  commandTimings.push({scope:timingScope,phase,project,milliseconds,exit_status:result.status,error_code:result.error?.code??null});
  if(!failure)assert.equal(result.status,0,`Owned acceptance command failed (${result.error?.code||result.status}): ${result.stderr}\n${result.stdout}`);
  return {...result,milliseconds};
}
const binary=path.join(prefix,'bin','redue'),oldBinary=path.join(baselinePrefix,'bin','redue');
function cli(root,state,...args){
  const phase=args[0]==='evidence'?`evidence-${args[1]}${args.includes('--dry-run')||args[1]==='import'&&!args.includes('--apply')?'-preview':args.includes('--apply')?'-apply':''}`:
    args[0]==='run'?`wrapped-${args.includes('--portable')?'portable':'local'}-execution`:
    args[0]==='status'?`status-${args.includes('--sync')?'synchronized':'cached'}`:`redue-${args[0]}`;
  return exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,...args],{cwd:root,phase,project:root===origin?'origin':'recipient'});
}
const json=(root,state,...args)=>JSON.parse(cli(root,state,...args,'--json').stdout);
const agent=(binaryAt,root,...args)=>exec([binaryAt,'--config',path.join(root,'redue.config.json'),'agent',...args],{cwd:root,phase:`agent-${args[0]}-${args[1]}${args.includes('--dry-run')?'-preview':''}`});
function plainCompilerCommand(root,state){
  const publicCheck=JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'))).checks.find(check=>check.name==='typecheck');
  assert.deepEqual(publicCheck.command,['@node','@typescript-compiler:.','--noEmit']);
  const runtime=JSON.parse(fs.readFileSync(path.join(state,'project-runtime-v1.json'))),check=runtime.checks.find(check=>check.name==='typecheck');
  assert.equal(runtime.root,root);assert.equal(runtime.state,state);
  assert.equal(check.qualification,'npm-typescript-direct-v1');assertSmokeRootCwd(runtime.root,check.cwd,fs.realpathSync);
  assert.equal(check.command.length,3);assert.equal(check.command[2],'--noEmit');
  assert.equal(fs.realpathSync(check.command[0]),fs.realpathSync(process.execPath),'Same actual Node runtime required');
  assert.equal(fs.realpathSync(check.command[1]),fs.realpathSync(path.join(root,'node_modules/typescript/lib/tsc.js')));
  return check.command;
}
function row(root,state,stage){const result=cli(root,state,'status','--sync','--json'),status=JSON.parse(result.stdout),selected=status.checks.find(c=>c.name==='typecheck');
  servedStatusObservations.push(smokeEvidenceObservation(stage,status,commandTimings.length-1));
  assert.equal(status.schema,1);assert.equal(status.observation.healthy,true);return {selected,milliseconds:result.milliseconds};}
function record(step,selected,milliseconds){observations.push({step,milliseconds,freshness:selected.freshness,result:selected.result,
  reuse_eligible:selected.reuse_eligible,run_id:selected.invocation?.runId??null,
  evidence_source:selected.evidence_source??null,imported_evidence:selected.imported_evidence??null});}
try{
  exec([npm,'install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',tarball],{phase:'candidate-package-install'});
  const installed=path.join(prefix,'lib','node_modules','@redue','cli'),metadata=JSON.parse(fs.readFileSync(path.join(installed,'package.json')));
  assert.equal(metadata.name,'@redue/cli');assert.deepEqual(metadata.bin,{redue:'./bin/redue.mjs'});
  for(const file of ['src/portable-command.mjs','src/portable-envelope.mjs','src/portable-store.mjs','docs/user/portable-evidence.md','src/agent-policy.md'])
    assert(fs.statSync(path.join(installed,file)).isFile(),`Missing installed portable asset: ${file}`);
  assert.match(exec([binary,'--help'],{phase:'installed-help'}).stdout,/evidence import FILE --check CHECK/);
  assert.equal(exec([binary,'--version'],{phase:'installed-version'}).stdout.trim(),metadata.version);
  const baseline=options['--baseline']||'@redue/cli@0.1.0-alpha.10',
    policyUpgrade=JSON.parse(exec([process.execPath,fileURLToPath(new URL('./portable-policy-upgrade.mjs',import.meta.url)),
      '--entry',path.join(installed,'bin','redue.mjs'),'--baseline',baseline],{phase:'published-policy-upgrade-helper'}).stdout);
  assert.equal(policyUpgrade.model_trials,0);assert.equal(policyUpgrade.observers_started,0);
  assert.equal(policyUpgrade.checks_executed,0);assert.equal(policyUpgrade.observations.length,4);
  fs.mkdirSync(origin);put(path.join(origin,'package.json'),JSON.stringify({name:'portable-installed-control',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit'},devDependencies:{typescript:'5.6.3'}}));
  put(path.join(origin,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true,noLib:true,target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
  put(path.join(origin,'src/globals.d.ts'),'interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
  put(path.join(origin,'src/a.ts'),'export const value: number = 1;\n');put(path.join(origin,'.gitignore'),'node_modules/\n');
  put(path.join(origin,'AGENTS.md'),'Owner Codex instruction.\n');put(path.join(origin,'CLAUDE.md'),'Owner Claude instruction.\n');
  exec([npm,'install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:origin,phase:'origin-dependency-install'});
  exec(['git','init','-q'],{cwd:origin,phase:'origin-git-init'});
  const preview=json(origin,originState,'init','--recipe','typescript-direct','--check','typecheck','--dry-run');
  assert.equal(preview.written,false);assert(!fs.existsSync(path.join(origin,'redue.config.json')));
  assert.equal(preview.checks[0].level,'ready');cli(origin,originState,'init','--recipe','typescript-direct','--check','typecheck');
  // Upgrade the project-owned instructions from the actual published policy.
  exec([npm,'install','--global','--prefix',baselinePrefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',baseline],{phase:'published-package-install'});
  for(const host of ['codex','claude']){
    const dry=JSON.parse(agent(oldBinary,origin,'setup',host,'--dry-run','--json').stdout);assert.equal(dry.applied,false);
    agent(oldBinary,origin,'setup',host,'--apply','--json');
    const before=fs.readFileSync(path.join(origin,host==='codex'?'AGENTS.md':'CLAUDE.md'));
    const update=JSON.parse(agent(binary,origin,'setup',host,'--dry-run','--json').stdout);assert.equal(update.applied,false);
    assert.deepEqual(fs.readFileSync(path.join(origin,host==='codex'?'AGENTS.md':'CLAUDE.md')),before);
    agent(binary,origin,'setup',host,'--apply','--json');
    const intact=JSON.parse(agent(binary,origin,'setup',host,'--apply','--json').stdout);assert.deepEqual(intact.changes,[]);
    const skill=path.join(origin,host==='codex'?'.agents/skills/redue-verification/SKILL.md':'.claude/skills/redue-verification/SKILL.md'),saved=fs.readFileSync(skill);
    fs.appendFileSync(skill,'\nOwner edit inside managed skill.\n');const edited=fs.readFileSync(skill);
    for(const action of ['setup','remove']){
      const refusal=exec([binary,'--config',path.join(origin,'redue.config.json'),'agent',action,host,'--apply','--json'],{cwd:origin,failure:true,phase:`agent-edited-${action}-refusal`});
      assert.notEqual(refusal.status,0);assert.deepEqual(fs.readFileSync(skill),edited);
    }
    // Restore only the experiment's own test edit; no owner's file is repaired.
    fs.writeFileSync(skill,saved);
  }
  fs.cpSync(origin,recipient,{recursive:true,filter:file=>!['node_modules','.git'].includes(path.relative(origin,file).split(path.sep)[0])});
  exec([npm,'ci','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:recipient,phase:'recipient-dependency-install'});exec(['git','init','-q'],{cwd:recipient,phase:'recipient-git-init'});
  for(const [root,state] of [[origin,originState],[recipient,recipientState]]){
    const doctor=json(root,state,'agent','doctor');assert.equal(doctor.behavior_verified,false);assert(doctor.hosts.every(host=>host.integrity==='intact'));
    cli(root,state,'start');
  }
  cli(origin,originState,'run','typecheck');
  const originHistory=new Map(fs.readdirSync(path.join(originState,'runs-v1')).map(name=>[name,fs.readFileSync(path.join(originState,'runs-v1',name))]));
  const oldFile=path.join(base,'old-local.evidence.json'),old=json(origin,originState,'evidence','export','typecheck','--output',oldFile);
  assert.equal(old.origin.complete,false);assert.equal(JSON.parse(fs.readFileSync(oldFile)).statement.predicate.facts,null);
  if(options['--economics']){
    const plain=plainCompilerCommand(origin,originState);
    timingScope='plain-baseline';
    exec(plain,{cwd:origin,phase:'plain-initial-compiler'});
    timingScope='portable-workflow';workflowStarted=performance.now();
  }
  const recorded=cli(origin,originState,'run','typecheck','--portable'),initial=row(origin,originState,'origin-portable-final');
  assert.equal(initial.selected.reuse_eligible,true);record('origin wrapped portable execution',initial.selected,recorded.milliseconds);
  const id=initial.selected.invocation.runId,immutable=fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),
    artifact=path.join(base,'portable.evidence.json');
  const exportPreview=json(origin,originState,'evidence','export','typecheck','--output',artifact,'--dry-run');
  assert.equal(exportPreview.written,false);assert.equal(exportPreview.origin.complete,true);assert(!fs.existsSync(artifact));assert(exportPreview.disclosed_paths.includes('src/globals.d.ts'));
  const exported=json(origin,originState,'evidence','export','typecheck','--output',artifact);assert.equal(exported.origin.complete,true);
  // Inspect has no project/config and cannot accept the producer.
  const inspected=JSON.parse(exec([binary,'evidence','inspect',artifact,'--json'],{cwd:base,phase:'evidence-inspect'}).stdout);
  assert.equal(inspected.producer_accepted,false);assert.equal(inspected.reuse_eligible,false);
  const importPreview=json(recipient,recipientState,'evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest);
  assert.equal(importPreview.apply,false);assert(!fs.existsSync(path.join(recipientState,'portable-imports-v1.json')));
  const imported=json(recipient,recipientState,'evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest,'--apply');
  assert.equal(imported.producer_accepted,true);assert.equal(imported.reuse_eligible,false);assert(!fs.existsSync(path.join(recipientState,'runs-v1')));
  const current=row(recipient,recipientState,'recipient-imported-baseline');assert.equal(current.selected.freshness,'CURRENT');assert.equal(current.selected.result,'PASS');assert.equal(current.selected.reuse_eligible,true);
  assert.equal(current.selected.evidence_source,'imported');assert.equal(current.selected.invocation,null);assert.equal(current.selected.imported_evidence.origin_run_id,id);
  record('recipient independent local applicability',current.selected,current.milliseconds);assert(!fs.existsSync(path.join(recipientState,'runs-v1')));
  const cached=json(recipient,recipientState,'status');servedStatusObservations.push(smokeEvidenceObservation('recipient-cached',cached,commandTimings.length-1));assert.equal(cached.checks[0].reuse_eligible,false);
  put(path.join(recipient,'notes.md'),'Unrelated documentation.\n');const unrelated=row(recipient,recipientState,'recipient-unrelated');assert.equal(unrelated.selected.reuse_eligible,true);
  record('unrelated edit',unrelated.selected,unrelated.milliseconds);
  put(path.join(recipient,'src/a.ts'),'export const value: number = 2;\n');const stale=row(recipient,recipientState,'recipient-relevant');assert.equal(stale.selected.freshness,'STALE');assert.equal(stale.selected.reuse_eligible,false);
  record('relevant edit',stale.selected,stale.milliseconds);assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
  if(options['--economics']){
    const importFile=path.join(recipientState,'portable-imports-v1.json'),importedHistory=fs.readFileSync(importFile);
    const rerun=cli(recipient,recipientState,'run','typecheck'),fresh=row(recipient,recipientState,'recipient-required-run-final');
    assertOrdinaryPostImportOutcome(fresh.selected,id);
    const recipientId=fresh.selected.invocation.runId,recipientRecord=fs.readFileSync(path.join(recipientState,'runs-v1',recipientId+'.json'));
    const stored=JSON.parse(recipientRecord);assert.equal(stored.schema,1);assert.equal(stored.check,'typecheck');
    assert.equal(stored.receipt.result,'PASS');assert.equal(stored.receipt.invocation.runId,recipientId);
    assert.equal(stored.receipt.invocation.status,'exited');assert.equal(stored.receipt.invocation.exitCode,0);assert.equal(stored.receipt.stable,true);
    assert.equal(stored.receipt.invocation.argvHash,createHash('sha256').update(JSON.stringify(plainCompilerCommand(recipient,recipientState))).digest('hex'));
    assert.equal(stored.receipt.portable,undefined,'Ordinary rerun must not silently capture portable evidence');
    assert.deepEqual(fs.readFileSync(importFile),importedHistory,'Local rerun must preserve imported history');
    record('required local rerun',fresh.selected,rerun.milliseconds);record('required rerun final query',fresh.selected,fresh.milliseconds);
    cli(recipient,recipientState,'stop');cli(recipient,recipientState,'start');
    const restarted=row(recipient,recipientState,'recipient-restart-inherited');
    assertOrdinaryPostImportOutcome(restarted.selected,id);
    assert.equal(restarted.selected.invocation.runId,recipientId);
    assert.deepEqual(fs.readFileSync(path.join(recipientState,'runs-v1',recipientId+'.json')),recipientRecord);
    assert.deepEqual(fs.readFileSync(importFile),importedHistory);assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
    record('restart retained non-reusable local outcome',restarted.selected,restarted.milliseconds);
    workflowElapsed=performance.now()-workflowStarted;
    timingScope='plain-baseline';
    exec(plainCompilerCommand(recipient,recipientState),{cwd:recipient,phase:'plain-relevant-compiler'});
    timingScope='ownership-and-history-controls';
  }
  // Removal preserves unrelated instructions, other host content and history.
  for(const [host,file,expected] of [['codex','AGENTS.md','Owner Codex instruction.\n'],['claude','CLAUDE.md','Owner Claude instruction.\n']]){
    const dry=JSON.parse(agent(binary,origin,'remove',host,'--dry-run','--json').stdout);assert.equal(dry.applied,false);
    agent(binary,origin,'remove',host,'--apply','--json');assert.equal(fs.readFileSync(path.join(origin,file),'utf8'),expected);
    if(host==='codex')assert(fs.existsSync(path.join(origin,'.claude/skills/redue-verification/SKILL.md')));
    assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
  }
  for(const [name,contents] of originHistory)assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',name)),contents);
  assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
  finalReport={schema:1,source:options['--source'],candidate_filename:path.basename(tarball),candidate_sha256:checksum,
    package:metadata.name,metadata_version:metadata.version,not_public_alpha10_bytes:true,platform:process.platform,arch:process.arch,node:process.version,
    published_policy_baseline:baseline,installed_policy_ownership:policyUpgrade.observations,
    installed_mechanics:'PASS',history_preserved_before_owned_teardown:true,observations,served_status_observations:servedStatusObservations,command_timings:commandTimings,model_behavior:'NOT RUN',two_machine:'NOT RUN',
    coverage:'controlled noLib same-host project; complete observed globals; default-library external queries remain unsupported',
    cleanup:'owned observers/prefixes/checkouts only; origin/import/local records were preserved until disposable experiment teardown'};
  if(options['--economics'])finalReport.economics=summarizeSmokeEconomics(commandTimings,workflowElapsed);
 }catch(error){
  acceptanceFailure=error;
  finalReport={schema:1,source:options['--source'],candidate_sha256:checksum,installed_mechanics:'FAILED',
    reason_code:'INSTALLED_SMOKE_PRECONDITION_OR_COMMAND_FAILED',observations,served_status_observations:servedStatusObservations,command_timings:commandTimings,model_behavior:'NOT RUN',two_machine:'NOT RUN'};
}finally{
  timingScope='cleanup';
  for(const [root,state] of [[origin,originState],[recipient,recipientState]])if(fs.existsSync(root)&&fs.existsSync(binary))
    exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,'stop'],{cwd:root,failure:true,phase:'cleanup-observer-stop'});
  // Only this function created this base. No pilot state or historical handoff is touched.
  const cleanup=finishOwnedSmokeBase(base,{economics:options['--economics']===true,failed:!!acceptanceFailure});
  if(cleanup.retained){
    finalReport.cleanup='OWNED_ECONOMICS_FAILURE_RETAINED_AFTER_OBSERVER_STOP_ATTEMPTS';
    finalReport.retained_evidence={owner_private_report:cleanup.owner_private_report};
    process.stderr.write(`Owned economics experiment retained: ${base}\n`);
  }
}

if(!acceptanceFailure||options['--economics'])console.log(JSON.stringify(finalReport));
if(acceptanceFailure)throw acceptanceFailure;
