// Exact installed candidate mechanics. No model launch, account changes or normal
// installations. The controlled noLib project is not useful-project adoption.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
const options={};
for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i],value=process.argv[i+1];
  assert(['--tarball','--sha256','--source','--baseline'].includes(key)&&value&&!Object.hasOwn(options,key),'Explicit unique artifact options required');options[key]=value;}
assert(options['--tarball']&&/^[a-f0-9]{64}$/.test(options['--sha256']||'')&&/^[a-f0-9]{7,40}$/.test(options['--source']||''),
  'Use --tarball FILE --sha256 SHA256 --source COMMIT [--baseline @redue/cli@VERSION]');
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
const env={...process.env},observations=[];
const put=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);};
function exec(command,{cwd=base,failure=false}={}){
  const launch=windowsLaunch(command),started=performance.now(),result=spawnSync(launch.file,launch.args,
    {...launch.options,cwd,env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  if(!failure)assert.equal(result.status,0,`Owned acceptance command failed (${result.error?.code||result.status}): ${result.stderr}\n${result.stdout}`);
  return {...result,milliseconds:performance.now()-started};
}
const binary=path.join(prefix,'bin','redue'),oldBinary=path.join(baselinePrefix,'bin','redue');
function cli(root,state,...args){return exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,...args],{cwd:root});}
const json=(root,state,...args)=>JSON.parse(cli(root,state,...args,'--json').stdout);
const agent=(binaryAt,root,...args)=>exec([binaryAt,'--config',path.join(root,'redue.config.json'),'agent',...args],{cwd:root});
function row(root,state){const result=cli(root,state,'status','--sync','--json'),status=JSON.parse(result.stdout),selected=status.checks.find(c=>c.name==='typecheck');
  assert.equal(status.schema,1);assert.equal(status.observation.healthy,true);return {selected,milliseconds:result.milliseconds};}
function record(step,selected,milliseconds){observations.push({step,milliseconds,freshness:selected.freshness,result:selected.result,
  reuse_eligible:selected.reuse_eligible,run_id:selected.invocation?.runId??null,
  evidence_source:selected.evidence_source??null,imported_evidence:selected.imported_evidence??null});}
try{
  exec([npm,'install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',tarball]);
  const installed=path.join(prefix,'lib','node_modules','@redue','cli'),metadata=JSON.parse(fs.readFileSync(path.join(installed,'package.json')));
  assert.equal(metadata.name,'@redue/cli');assert.deepEqual(metadata.bin,{redue:'./bin/redue.mjs'});
  for(const file of ['src/portable-command.mjs','src/portable-envelope.mjs','src/portable-store.mjs','docs/user/portable-evidence.md','src/agent-policy.md'])
    assert(fs.statSync(path.join(installed,file)).isFile(),`Missing installed portable asset: ${file}`);
  assert.match(exec([binary,'--help']).stdout,/evidence import FILE --check CHECK/);
  assert.equal(exec([binary,'--version']).stdout.trim(),metadata.version);
  fs.mkdirSync(origin);put(path.join(origin,'package.json'),JSON.stringify({name:'portable-installed-control',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit'},devDependencies:{typescript:'5.6.3'}}));
  put(path.join(origin,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true,noLib:true,target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
  put(path.join(origin,'src/globals.d.ts'),'interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
  put(path.join(origin,'src/a.ts'),'export const value: number = 1;\n');put(path.join(origin,'.gitignore'),'node_modules/\n');
  put(path.join(origin,'AGENTS.md'),'Owner Codex instruction.\n');put(path.join(origin,'CLAUDE.md'),'Owner Claude instruction.\n');
  exec([npm,'install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:origin});
  exec(['git','init','-q'],{cwd:origin});
  const preview=json(origin,originState,'init','--recipe','typescript-direct','--check','typecheck','--dry-run');
  assert.equal(preview.written,false);assert(!fs.existsSync(path.join(origin,'redue.config.json')));
  assert.equal(preview.checks[0].level,'ready');cli(origin,originState,'init','--recipe','typescript-direct','--check','typecheck');
  // Upgrade the project-owned instructions from the actual published policy.
  const baseline=options['--baseline']||'@redue/cli@0.1.0-alpha.10';
  exec([npm,'install','--global','--prefix',baselinePrefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',baseline]);
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
      const refusal=exec([binary,'--config',path.join(origin,'redue.config.json'),'agent',action,host,'--apply','--json'],{cwd:origin,failure:true});
      assert.notEqual(refusal.status,0);assert.deepEqual(fs.readFileSync(skill),edited);
    }
    // Restore only the experiment's own test edit; no owner's file is repaired.
    fs.writeFileSync(skill,saved);
  }
  fs.cpSync(origin,recipient,{recursive:true,filter:file=>!['node_modules','.git'].includes(path.relative(origin,file).split(path.sep)[0])});
  exec([npm,'ci','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:recipient});exec(['git','init','-q'],{cwd:recipient});
  for(const [root,state] of [[origin,originState],[recipient,recipientState]]){
    const doctor=json(root,state,'agent','doctor');assert.equal(doctor.behavior_verified,false);assert(doctor.hosts.every(host=>host.integrity==='intact'));
    cli(root,state,'start');
  }
  cli(origin,originState,'run','typecheck');
  const oldFile=path.join(base,'old-local.evidence.json'),old=json(origin,originState,'evidence','export','typecheck','--output',oldFile);
  assert.equal(old.origin.complete,false);assert.equal(JSON.parse(fs.readFileSync(oldFile)).statement.predicate.facts,null);
  const recorded=cli(origin,originState,'run','typecheck','--portable'),initial=row(origin,originState);
  assert.equal(initial.selected.reuse_eligible,true);record('origin wrapped portable execution',initial.selected,recorded.milliseconds);
  const id=initial.selected.invocation.runId,immutable=fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),
    artifact=path.join(base,'portable.evidence.json');
  const exportPreview=json(origin,originState,'evidence','export','typecheck','--output',artifact,'--dry-run');
  assert.equal(exportPreview.written,false);assert.equal(exportPreview.origin.complete,true);assert(!fs.existsSync(artifact));assert(exportPreview.disclosed_paths.includes('src/globals.d.ts'));
  const exported=json(origin,originState,'evidence','export','typecheck','--output',artifact);assert.equal(exported.origin.complete,true);
  // Inspect has no project/config and cannot accept the producer.
  const inspected=JSON.parse(exec([binary,'evidence','inspect',artifact,'--json'],{cwd:base}).stdout);
  assert.equal(inspected.producer_accepted,false);assert.equal(inspected.reuse_eligible,false);
  const importPreview=json(recipient,recipientState,'evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest);
  assert.equal(importPreview.apply,false);assert(!fs.existsSync(path.join(recipientState,'portable-imports-v1.json')));
  const imported=json(recipient,recipientState,'evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest,'--apply');
  assert.equal(imported.producer_accepted,true);assert.equal(imported.reuse_eligible,false);assert(!fs.existsSync(path.join(recipientState,'runs-v1')));
  const current=row(recipient,recipientState);assert.equal(current.selected.freshness,'CURRENT');assert.equal(current.selected.result,'PASS');assert.equal(current.selected.reuse_eligible,true);
  assert.equal(current.selected.evidence_source,'imported');assert.equal(current.selected.invocation,null);assert.equal(current.selected.imported_evidence.origin_run_id,id);
  record('recipient independent local applicability',current.selected,current.milliseconds);assert(!fs.existsSync(path.join(recipientState,'runs-v1')));
  const cached=json(recipient,recipientState,'status');assert.equal(cached.checks[0].reuse_eligible,false);
  put(path.join(recipient,'notes.md'),'Unrelated documentation.\n');const unrelated=row(recipient,recipientState);assert.equal(unrelated.selected.reuse_eligible,true);
  record('unrelated edit',unrelated.selected,unrelated.milliseconds);
  put(path.join(recipient,'src/a.ts'),'export const value: number = 2;\n');const stale=row(recipient,recipientState);assert.equal(stale.selected.freshness,'STALE');assert.equal(stale.selected.reuse_eligible,false);
  record('relevant edit',stale.selected,stale.milliseconds);assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
  // Removal preserves unrelated instructions, other host content and history.
  for(const [host,file,expected] of [['codex','AGENTS.md','Owner Codex instruction.\n'],['claude','CLAUDE.md','Owner Claude instruction.\n']]){
    const dry=JSON.parse(agent(binary,origin,'remove',host,'--dry-run','--json').stdout);assert.equal(dry.applied,false);
    agent(binary,origin,'remove',host,'--apply','--json');assert.equal(fs.readFileSync(path.join(origin,file),'utf8'),expected);
    if(host==='codex')assert(fs.existsSync(path.join(origin,'.claude/skills/redue-verification/SKILL.md')));
    assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',id+'.json')),immutable);
  }
  console.log(JSON.stringify({schema:1,source:options['--source'],candidate_filename:path.basename(tarball),candidate_sha256:checksum,
    package:metadata.name,metadata_version:metadata.version,not_public_alpha10_bytes:true,platform:process.platform,arch:process.arch,node:process.version,
    published_policy_baseline:baseline,installed_mechanics:'PASS',observations,model_behavior:'NOT RUN',two_machine:'NOT RUN',
    coverage:'controlled noLib same-host project; complete observed globals; default-library external queries remain unsupported',
    cleanup:'owned observers/prefixes/checkouts only; source historical record was preserved until disposable experiment teardown'}));
}finally{
  for(const [root,state] of [[origin,originState],[recipient,recipientState]])if(fs.existsSync(root)&&fs.existsSync(binary))
    exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,'stop'],{cwd:root,failure:true});
  // Only this function created this base. No pilot state or historical handoff is touched.
  fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
