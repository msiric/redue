// Exercise policy ownership against the actual published alpha, with no model,
// observer or verification invocation. --entry may be a source or installed bin.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
const options={};
for(let at=2;at<process.argv.length;at+=2){const key=process.argv[at],value=process.argv[at+1];
  assert(['--entry','--baseline'].includes(key)&&value&&!Object.hasOwn(options,key),'Use --entry REDUE_BIN_MJS --baseline @redue/cli@VERSION');options[key]=value;}
assert(options['--entry']&&options['--baseline'],'Explicit candidate entry and published baseline are required');
const entry=fs.realpathSync(path.resolve(options['--entry'])),base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-pe-policy-'))),
  prefix=path.join(base,'published-prefix'),npm=findExecutable('npm'),observations=[];
const put=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);};
function exec(argv,{cwd=base,failure=false}={}){
  const launch=windowsLaunch(argv),result=spawnSync(launch.file,launch.args,{...launch.options,cwd,env:{...process.env},
    encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  if(!failure)assert.equal(result.status,0,`Owned policy test command failed (${result.error?.code||result.status}): ${result.stderr}`);
  return result;
}
try{
  exec([npm,'install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',options['--baseline']]);
  const oldEntry=path.join(prefix,...(process.platform==='win32'?[]:['lib']),'node_modules','@redue','cli','bin','redue.mjs');
  for(const host of ['codex','claude'])for(const edited of [false,true]){
    const root=path.join(base,`${host} ${edited?'edited':'intact'} 空间`);fs.mkdirSync(root);
    const config=path.join(root,'redue.config.json'),instruction=host==='codex'?'AGENTS.md':'CLAUDE.md',
      skill=path.join(root,host==='codex'?'.agents/skills/redue-verification/SKILL.md':'.claude/skills/redue-verification/SKILL.md');
    put(config,JSON.stringify({schema:1,checks:[{name:'typecheck',command:['@node','check.mjs'],inputs:['src/**']}]}));
    put(path.join(root,instruction),'User instruction before.\n');
    const call=(selected,...args)=>exec([process.execPath,selected,'--config',config,'agent',...args],{cwd:root});
    call(oldEntry,'setup',host,'--apply','--json');
    fs.appendFileSync(path.join(root,instruction),'\nUser instruction after.\n');
    const oldSkill=fs.readFileSync(skill,'utf8');assert(!oldSkill.includes('imported_evidence.origin_run_id'));
    if(edited)fs.appendFileSync(skill,'\nUser managed-content edit.\n');
    const beforeInstruction=fs.readFileSync(path.join(root,instruction)),beforeSkill=fs.readFileSync(skill),
      beforeConfig=fs.readFileSync(config),beforeRecord=fs.readFileSync(path.join(root,'.redue','agents',host+'.json'));
    if(edited){
      for(const action of ['setup','remove']){
        const refusal=exec([process.execPath,entry,'--config',config,'agent',action,host,'--apply','--json'],{cwd:root,failure:true});
        assert.notEqual(refusal.status,0);assert.deepEqual(fs.readFileSync(skill),beforeSkill);
        assert.deepEqual(fs.readFileSync(path.join(root,instruction)),beforeInstruction);
        assert.deepEqual(fs.readFileSync(path.join(root,'.redue','agents',host+'.json')),beforeRecord);
      }
      observations.push({host,condition:'edited published policy',result:'refused setup/removal; exact bytes preserved'});
    }else{
      const preview=JSON.parse(call(entry,'setup',host,'--dry-run','--json').stdout);
      assert.equal(preview.applied,false);assert(preview.changes.some(row=>row.path.endsWith('/SKILL.md')&&row.operation==='update'));
      assert.deepEqual(fs.readFileSync(skill),beforeSkill);assert.deepEqual(fs.readFileSync(path.join(root,instruction)),beforeInstruction);
      const update=JSON.parse(call(entry,'setup',host,'--apply','--json').stdout);assert.equal(update.applied,true);
      assert(fs.readFileSync(skill,'utf8').includes('imported_evidence.origin_run_id'));
      assert.deepEqual(fs.readFileSync(path.join(root,instruction)),beforeInstruction);
      const repeated=JSON.parse(call(entry,'setup',host,'--apply','--json').stdout);assert.deepEqual(repeated.changes,[]);
      const removalPreview=JSON.parse(call(entry,'remove',host,'--dry-run','--json').stdout);assert.equal(removalPreview.applied,false);assert(fs.existsSync(skill));
      call(entry,'remove',host,'--apply','--json');assert(!fs.existsSync(skill));
      assert.equal(fs.readFileSync(path.join(root,instruction),'utf8'),'User instruction before.\n\nUser instruction after.\n');
      observations.push({host,condition:'intact published policy',result:'preview/update/idempotent/remove PASS; unrelated instructions preserved'});
    }
    assert.deepEqual(fs.readFileSync(config),beforeConfig);assert(!fs.existsSync(path.join(root,'node_modules')));
  }
  console.log(JSON.stringify({schema:1,published_baseline:options['--baseline'],observations,model_trials:0,
    observers_started:0,checks_executed:0,permissions_changed:false,cleanup:'owned disposable policy fixtures and installation only'}));
}finally{fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
