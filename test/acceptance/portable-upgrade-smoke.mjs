// Installed compatibility/ownership acceptance on owned controlled fixtures only.
// No model, signer, permission change, ordinary installation or private source.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
import {writeControlledPortableProject,requireImportedEligibility} from './portable-machine.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function upgradeOptions(args){const out={};assert.equal(args.length%2,0);
  for(let i=0;i<args.length;i+=2){assert(['--tarball','--sha256','--source','--legacy-tarball','--legacy-sha256','--legacy-source','--evidence','--evidence-digest'].includes(args[i])&&
    args[i+1]&&!Object.hasOwn(out,args[i]));out[args[i]]=args[i+1];}
  for(const key of ['--tarball','--legacy-tarball','--evidence'])assert(path.isAbsolute(out[key]||''));
  for(const key of ['--sha256','--legacy-sha256','--evidence-digest'])assert(/^[a-f0-9]{64}$/.test(out[key]||''));
  for(const key of ['--source','--legacy-source'])assert(/^[a-f0-9]{40}$/.test(out[key]||''));return out;}
export function policyCommandArgs(binary,root,...args){
  return [binary,'--config',path.join(root,'redue.config.json'),'agent',...args];
}
export async function runUpgrade(o){
  for(const [file,digest] of [['--tarball','--sha256'],['--legacy-tarball','--legacy-sha256']])
    assert.equal(hash(readBoundedPortableFile(o[file])),o[digest],'Changed package: no process launched');
  // Structure/trust is checked again by the installed candidate; this is only an
  // explicitly selected controlled fixture, not acceptance of a downloaded URL.
  readBoundedPortableFile(o['--evidence'],{limit:1024*1024});
  assert.equal(process.platform,'darwin');assert.equal(process.arch,'arm64');assert.equal(process.version,'v22.13.0');
  const base=fs.realpathSync(fs.mkdtempSync('/tmp/redue-pe-upgrade-')),origin=path.join(base,'Origin 空间'),recipient=path.join(base,'Recipient 空间'),
    originState=path.join(base,'redue-origin'),recipientState=path.join(base,'redue-recipient'),legacyPrefix=path.join(base,'legacy'),prefix=path.join(base,'candidate'),publishedPrefix=path.join(base,'published');
  const entry=p=>path.join(p,'bin','redue'),current=entry(prefix),legacy=entry(legacyPrefix),published=entry(publishedPrefix),observations=[],calls=[];
  let originBinary=null,recipientStarted=false;
  function exec(argv,{cwd=base,failure=false}={}){const before=performance.now(),result=spawnSync(argv[0],argv.slice(1),
    {cwd,env:process.env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
    calls.push({kind:argv[0].endsWith('/redue')?'redue':path.basename(argv[0]),operation:argv[0].endsWith('/redue')?argv[5]??'help':null,
      milliseconds:performance.now()-before,status:result.status});
    if(!failure)assert.equal(result.status,0,`Controlled compatibility command failed: ${result.error?.code||result.status}`);return result;}
  const policy=(binary,root,...args)=>exec(policyCommandArgs(binary,root,...args),{cwd:root}),
    cli=(binary,root,state,...args)=>exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,...args],{cwd:root}),
    json=(binary,root,state,...args)=>JSON.parse(cli(binary,root,state,...args,'--json').stdout),
    sync=(root,state)=>json(current,root,state,'status','--sync');
  const selection=state=>fs.readFileSync(path.join(state,'receipts-v1.json'));
  function outcomeFiles(state){return Object.fromEntries(fs.readdirSync(path.join(state,'runs-v1')).sort().map(name=>[name,
    fs.readFileSync(path.join(state,'runs-v1',name)).toString('base64')]));}
  try{
    for(const [installPrefix,artifact] of [[legacyPrefix,o['--legacy-tarball']],[prefix,o['--tarball']],[publishedPrefix,'@redue/cli@0.1.0-alpha.10']])
      exec(['npm','install','--global','--prefix',installPrefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',artifact]);
    writeControlledPortableProject(origin);exec(['npm','install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:origin});exec(['git','init','-q'],{cwd:origin});
    cli(legacy,origin,originState,'init','--recipe','typescript-direct','--check','typecheck');
    const configBefore=fs.readFileSync(path.join(origin,'redue.config.json'));
    cli(legacy,origin,originState,'start');originBinary=legacy;cli(legacy,origin,originState,'run','typecheck','--portable');
    const oldStatus=json(legacy,origin,originState,'status','--sync'),oldCheck=oldStatus.checks[0];
    assert.equal(oldStatus.observation.healthy,true);assert.equal(oldCheck.result,'PASS');assert.equal(oldCheck.reuse_eligible,true);
    const oldRun=oldCheck.invocation.runId,oldRecord=fs.readFileSync(path.join(originState,'runs-v1',oldRun+'.json')),
      oldFile=path.join(base,'old-interpretation.json'),oldExport=json(legacy,origin,originState,'evidence','export','typecheck','--output',oldFile);
    assert.equal(oldExport.origin.complete,true);assert.equal(JSON.parse(fs.readFileSync(oldFile)).statement.predicate.interpretation,'redue-portable-direct-typescript@1');
    cli(legacy,origin,originState,'stop');originBinary=null;const selectedBefore=selection(originState);
    cli(current,origin,originState,'start');originBinary=current;const upgraded=sync(origin,originState);
    assert.equal(upgraded.checks[0].result,'PASS');assert.equal(upgraded.checks[0].invocation.runId,oldRun);
    assert.deepEqual(selection(originState),selectedBefore);assert.deepEqual(fs.readFileSync(path.join(originState,'runs-v1',oldRun+'.json')),oldRecord);
    assert.deepEqual(fs.readFileSync(path.join(origin,'redue.config.json')),configBefore);
    observations.push({case:'V18 same-state stop/start upgrade',historical_run_id:oldRun,historical_result:'PASS',history_preserved:true,
      freshness:upgraded.checks[0].freshness,local_reuse_eligible:upgraded.checks[0].reuse_eligible,portable_reinterpreted:false});
    fs.cpSync(origin,recipient,{recursive:true,filter:file=>!['node_modules','.git'].includes(path.relative(origin,file).split(path.sep)[0])});
    exec(['npm','ci','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:recipient});exec(['git','init','-q'],{cwd:recipient});
    cli(current,recipient,recipientState,'start');recipientStarted=true;
    const unsupportedArgs=['evidence','import',oldFile,'--check','typecheck','--accept-digest',oldExport.digest,'--apply','--json'];
    let refusal=exec([current,'--config',path.join(recipient,'redue.config.json'),'--state-dir',recipientState,...unsupportedArgs],{cwd:recipient,failure:true});
    assert.notEqual(refusal.status,0);assert(!fs.existsSync(path.join(recipientState,'portable-imports-v1.json')));assert(!fs.existsSync(path.join(recipientState,'runs-v1')));
    const unknown=sync(recipient,recipientState).checks[0];assert.equal(unknown.reuse_eligible,false);
    observations.push({case:'V18 obsolete real origin refused',origin_run_id:oldRun,import_exit:refusal.status,local_run_created:false});
    // A real applicable local failure cannot be hidden by replaying old PASS.
    fs.writeFileSync(path.join(recipient,'src/a.ts'),'export const value: string = 1;\n');
    const failed=exec([current,'--config',path.join(recipient,'redue.config.json'),'--state-dir',recipientState,'run','typecheck'],{cwd:recipient,failure:true});
    assert.notEqual(failed.status,0);const failCheck=sync(recipient,recipientState).checks[0];assert.equal(failCheck.result,'FAIL');assert.equal(failCheck.reuse_eligible,false);
    const failSelection=selection(recipientState),failHistory=outcomeFiles(recipientState);
    refusal=exec([current,'--config',path.join(recipient,'redue.config.json'),'--state-dir',recipientState,...unsupportedArgs],{cwd:recipient,failure:true});
    assert.notEqual(refusal.status,0);assert.deepEqual(selection(recipientState),failSelection);assert.deepEqual(outcomeFiles(recipientState),failHistory);
    const afterRefusal=sync(recipient,recipientState).checks[0];assert.equal(afterRefusal.result,'FAIL');assert.equal(afterRefusal.invocation.runId,failCheck.invocation.runId);assert.equal(afterRefusal.reuse_eligible,false);
    observations.push({case:'V15/V18 old PASS does not replace newer real FAIL',selected_run_id:failCheck.invocation.runId,selection_unchanged:true});
    // Use a separate explicitly selected recipient to test intact imported state
    // ownership during published-policy update/removal, not to erase the failure.
    cli(current,recipient,recipientState,'stop');recipientStarted=false;
    const policyRoot=path.join(base,'Policy recipient 空间'),policyState=path.join(base,'redue-policy-recipient');
    fs.cpSync(origin,policyRoot,{recursive:true,filter:file=>!['node_modules','.git'].includes(path.relative(origin,file).split(path.sep)[0])});
    exec(['npm','ci','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:policyRoot});exec(['git','init','-q'],{cwd:policyRoot});
    cli(current,policyRoot,policyState,'start');let policyStarted=true;
    try{
      const imported=json(current,policyRoot,policyState,'evidence','import',o['--evidence'],'--check','typecheck','--accept-digest',o['--evidence-digest'],'--apply');assert.equal(imported.producer_accepted,true);
      const eligible=sync(policyRoot,policyState),originRunId=eligible.checks[0].imported_evidence.origin_run_id;
      requireImportedEligibility(eligible,{digest:o['--evidence-digest'],originRunId});
      const importFile=path.join(policyState,'portable-imports-v1.json'),importBytes=fs.readFileSync(importFile),policyConfig=fs.readFileSync(path.join(policyRoot,'redue.config.json'));
      for(const [host,file,skillPath] of [['codex','AGENTS.md','.agents/skills/redue-verification/SKILL.md'],['claude','CLAUDE.md','.claude/skills/redue-verification/SKILL.md']]){
        fs.writeFileSync(path.join(policyRoot,file),'Owner instruction.\n');policy(published,policyRoot,'setup',host,'--apply','--json');
        policy(current,policyRoot,'setup',host,'--dry-run','--json');policy(current,policyRoot,'setup',host,'--apply','--json');
        const skill=path.join(policyRoot,skillPath),intact=fs.readFileSync(skill);fs.appendFileSync(skill,'\nOwned fixture edit inside managed content.\n');const edited=fs.readFileSync(skill);
        for(const operation of ['setup','remove']){const result=exec(policyCommandArgs(current,policyRoot,operation,host,'--apply','--json'),{cwd:policyRoot,failure:true});
          assert.notEqual(result.status,0);assert.deepEqual(fs.readFileSync(skill),edited);assert.deepEqual(fs.readFileSync(importFile),importBytes);}
        fs.writeFileSync(skill,intact);policy(current,policyRoot,'remove',host,'--apply','--json');
        assert.equal(fs.readFileSync(path.join(policyRoot,file),'utf8'),'Owner instruction.\n');assert.deepEqual(fs.readFileSync(importFile),importBytes);
        assert.deepEqual(fs.readFileSync(path.join(policyRoot,'redue.config.json')),policyConfig);assert(!fs.existsSync(path.join(policyState,'runs-v1')));
        observations.push({case:'installed policy update/edited refusal/removal',host,import_digest:o['--evidence-digest'],origin_run_id:originRunId,import_bytes_preserved:true});
      }
      // Setup changes may legitimately alter inputs; no unconditional CURRENT
      // promise across those edits. Query and record what the engine establishes.
      const afterPolicy=sync(policyRoot,policyState).checks[0];observations.push({case:'post-policy reassessment',freshness:afterPolicy.freshness,result:afterPolicy.result,reuse_eligible:afterPolicy.reuse_eligible});
    }finally{if(policyStarted)cli(current,policyRoot,policyState,'stop');}
    return {schema:1,source:o['--source'],candidate_sha256:o['--sha256'],legacy_source:o['--legacy-source'],legacy_sha256:o['--legacy-sha256'],
      observations,calls,models_launched:0,two_machine:'NOT RUN',authenticated_ci:'NOT RUN',receipt_deletion:false,cleanup:'owned disposable fixtures only'};
  }catch(error){error.upgrade_evidence={observations,calls};throw error;
  }finally{
    if(originBinary)exec([originBinary,'--config',path.join(origin,'redue.config.json'),'--state-dir',originState,'stop'],{cwd:origin,failure:true});
    if(recipientStarted)exec([current,'--config',path.join(recipient,'redue.config.json'),'--state-dir',recipientState,'stop'],{cwd:recipient,failure:true});
    fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(await runUpgrade(upgradeOptions(process.argv.slice(2)))));}
  catch(error){console.error(JSON.stringify({schema:1,result:'FAILED_PRECONDITION_OR_ACCEPTANCE',code:error.code??'ASSERTION',models_launched:0,attempt:error.upgrade_evidence??null}));process.exitCode=1;}
}
