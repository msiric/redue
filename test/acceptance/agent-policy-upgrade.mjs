// Exact installed packages: prior owned instructions -> candidate update/removal.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {readArtifact} from './package-artifact.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {findExecutable} from '../../src/executable-lookup.mjs';
const at=process.argv.indexOf('--manifest');assert(at>=0);
const candidate=readArtifact(path.resolve(process.argv[at+1]));
const priorAt=process.argv.indexOf('--prior');const prior=priorAt<0?'@redue/cli@0.1.0-alpha.5':path.resolve(process.argv[priorAt+1]);
const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-policy-'))),root=path.join(base,'Project é space');
const old=path.join(base,'old'),next=path.join(base,'next');
const binary=p=>path.join(p,...(process.platform==='win32'?['redue.cmd']:['bin','redue']));
const env={...process.env};
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
    const before=read(file),skillBefore=read(skill);assert.match(skillBefore,/Query ordinary/);
    cli(next,['agent','setup',host,'--dry-run']);assert.equal(read(file),before);assert.equal(read(skill),skillBefore);
    cli(next,['agent','setup',host,'--apply']);assert.match(read(skill),/npm-typescript-direct-v1/);assert.match(read(file),/caller-aware sync/);
    const once=read(file);cli(next,['agent','setup',host,'--apply']);assert.equal(read(file),once);
    cli(next,['agent','remove',host,'--apply']);assert.equal(read(file),'User policy before.\r\nUser policy after.\n');
    cli(old,['agent','setup',host,'--apply']);fs.appendFileSync(path.join(root,skill),'User changed managed policy.\n');
    const edited=read(skill),instruction=read(file);
    for(const action of ['setup','remove'])assert.equal(cli(next,['agent',action,host,'--apply'],false).status,2);
    assert.equal(read(skill),edited);assert.equal(read(file),instruction);assert.equal(read('redue.config.json'),config);
  }
  console.log(JSON.stringify({platform:process.platform,node:process.version,sha256:candidate.sha256,prior,hosts:['codex','claude'],intactUpdate:true,preview:true,idempotent:true,userTextPreserved:true,modifiedManagedRefused:true,configPreserved:true}));
}finally{fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
