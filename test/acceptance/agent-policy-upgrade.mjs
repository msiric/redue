// Exact installed packages: prior owned instructions -> candidate update/removal.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {readArtifact} from './package-artifact.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {findExecutable} from '../../src/executable-lookup.mjs';
const at=process.argv.indexOf('--manifest');assert(at>=0);
const candidate=readArtifact(path.resolve(process.argv[at+1]));
const priorAt=process.argv.indexOf('--prior');
const priorArgument=priorAt<0?'@redue/cli@0.1.0-alpha.6':process.argv[priorAt+1];
assert(priorArgument,'--prior requires a package coordinate or tarball');
const prior=/^@redue\/cli@0\.1\.0-alpha\.\d+$/.test(priorArgument)?priorArgument:path.resolve(priorArgument);
const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'rp-'))),root=path.join(base,'Project é space');
const old=path.join(base,'old'),next=path.join(base,'next');
const binary=p=>path.join(p,...(process.platform==='win32'?['redue.cmd']:['bin','redue']));
const env={...process.env,HOME:path.join(base,'home'),LOCALAPPDATA:path.join(base,'local'),XDG_STATE_HOME:path.join(base,'state'),VSTATE_START_READY_WAIT_MS:'10000'};
function call(argv,cwd=base,ok=true){const cmd=windowsLaunch(argv),r=spawnSync(cmd.file,cmd.args,{...cmd.options,cwd,env,encoding:'utf8',timeout:120000});if(ok)assert.equal(r.status,0,r.stderr+r.stdout);return r;}
const cli=(prefix,args,ok=true)=>call([binary(prefix),...args],root,ok);
const write=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
try{
  for(const [prefix,source] of [[old,prior],[next,candidate.file]])call([findExecutable('npm'),'install','--global','--prefix',prefix,source,'--no-audit','--no-fund','--registry=https://registry.npmjs.org']);
  fs.mkdirSync(root);call(['git','init','-q'],root);
  const config=JSON.stringify({schema:1,checks:[{name:'not_named_typecheck',command:['@node','check.mjs'],inputs:['src/**']}]});write(path.join(root,'redue.config.json'),config);
  for(const [host,file,skill] of [['codex','AGENTS.md','.agents/skills/redue-verification/SKILL.md'],['claude','CLAUDE.md','.claude/skills/redue-verification/SKILL.md']]){
    const read=f=>fs.readFileSync(path.join(root,f),'utf8');write(path.join(root,file),'User policy before.\r\n');
    cli(old,['agent','setup',host,'--apply']);fs.appendFileSync(path.join(root,file),'User policy after.\n');
    const before=read(file),skillBefore=read(skill);assert.match(skillBefore,/Query ordinary|npm-typescript-direct-v1/);
    cli(next,['agent','setup',host,'--dry-run']);assert.equal(read(file),before);assert.equal(read(skill),skillBefore);
    cli(next,['agent','setup',host,'--apply']);assert.match(read(skill),/npm-typescript-direct-v1/);assert.match(read(file),/caller-aware sync/);
    const once=read(file);cli(next,['agent','setup',host,'--apply']);assert.equal(read(file),once);
    cli(next,['agent','remove',host,'--apply']);assert.equal(read(file),'User policy before.\r\nUser policy after.\n');
    cli(old,['agent','setup',host,'--apply']);fs.appendFileSync(path.join(root,skill),'User changed managed policy.\n');
    const edited=read(skill),instruction=read(file);
    for(const action of ['setup','remove'])assert.equal(cli(next,['agent',action,host,'--apply'],false).status,2);
    assert.equal(read(skill),edited);assert.equal(read(file),instruction);assert.equal(read('redue.config.json'),config);
  }
  // Real same-prefix upgrade, with the existing config/state and immutable run.
  const upgrade=path.join(base,'upgrade');fs.mkdirSync(upgrade);fs.mkdirSync(path.join(upgrade,'src'));
  write(path.join(upgrade,'package.json'),JSON.stringify({name:'owned-policy-upgrade',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'},devDependencies:{typescript:'5.6.3'}}));
  write(path.join(upgrade,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true},include:['src']}));
  write(path.join(upgrade,'src/index.ts'),'export const x: number = 1;');
  call(['git','init','-q'],upgrade);call([findExecutable('npm'),'install','--no-audit','--no-fund','--registry=https://registry.npmjs.org'],upgrade);
  const live=args=>call([binary(old),'--config','redue.config.json',...args],upgrade);
  let ownedState;
  try{
    live(['init','--recipe','typescript-direct']);live(['agent','setup','codex','--apply']);
    const configBefore=fs.readFileSync(path.join(upgrade,'redue.config.json'));
    const doctor=JSON.parse(live(['agent','doctor','codex','--json']).stdout);ownedState=doctor.project.state;assert(ownedState.startsWith(base+path.sep));
    live(['start']);live(['run','typecheck']);
    const before=JSON.parse(live(['status','--sync','--json']).stdout).checks[0];assert(before.reuse_eligible);
    const run=path.join(ownedState,'runs-v1',before.invocation.runId+'.json'),digest=()=>createHash('sha256').update(fs.readFileSync(run)).digest('hex'),original=digest();
    live(['stop']);assert(!fs.existsSync(path.join(ownedState,'observer.lock')));
    call([findExecutable('npm'),'install','--global','--prefix',old,candidate.file,'--no-audit','--no-fund','--registry=https://registry.npmjs.org']);
    const instruction=path.join(upgrade,'AGENTS.md'),priorInstruction=fs.readFileSync(instruction);
    live(['agent','setup','codex','--dry-run']);assert.deepEqual(fs.readFileSync(instruction),priorInstruction);
    live(['agent','setup','codex','--apply']);live(['start']);
    const after=JSON.parse(live(['status','--sync','--json']).stdout).checks[0];
    assert.equal(after.invocation.runId,before.invocation.runId);assert.equal(after.result,'PASS');assert.equal(digest(),original);
    assert.deepEqual(fs.readFileSync(path.join(upgrade,'redue.config.json')),configBefore);
    assert.equal(JSON.parse(live(['agent','doctor','codex','--json']).stdout).project.state,ownedState);
    // Pilot exit removes only owned instructions/install; historical evidence stays.
    live(['agent','remove','codex','--dry-run']);
    assert(fs.existsSync(instruction));
    live(['agent','remove','codex','--apply']);live(['stop']);
    call([findExecutable('npm'),'uninstall','--global','--prefix',old,'@redue/cli','--no-audit','--no-fund']);
    assert.equal(digest(),original);assert(fs.existsSync(ownedState));
    assert.deepEqual(fs.readFileSync(path.join(upgrade,'redue.config.json')),configBefore);
    assert(!fs.existsSync(binary(old)));
    // Reinstall only this disposable prefix so its owned test state can be cleaned.
    call([findExecutable('npm'),'install','--global','--prefix',old,candidate.file,'--no-audit','--no-fund','--registry=https://registry.npmjs.org']);
    // Setup metadata is an input: do not promise retained CURRENT or erase history.
    console.log(JSON.stringify({samePrefixUpgrade:true,prior,candidateSha256:candidate.sha256,receiptPreserved:true,configStatePreserved:true,pilotExitPreservesEvidence:true,afterSetup:after.freshness}));
  }finally{if(ownedState){live(['stop']);live(['remove-state']);}}
  console.log(JSON.stringify({platform:process.platform,node:process.version,sha256:candidate.sha256,prior,hosts:['codex','claude'],intactUpdate:true,preview:true,idempotent:true,userTextPreserved:true,modifiedManagedRefused:true,configPreserved:true}));
}finally{fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
