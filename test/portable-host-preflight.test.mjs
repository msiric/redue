import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {collectPortableHostPreflight,portablePreconditionMatches,runPortableGatedTrial} from './acceptance/portable-host-preflight.mjs';

const cwd=path.resolve(os.tmpdir(),'REDUE path Ω with spaces');
const config=path.join(cwd,'redue.config.json'),state=path.join(cwd,'owned state');
const digest='a'.repeat(64);
function status({freshness='CURRENT',result='PASS',eligible=true}={}){
  return {schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness,result,
    reuse_eligible:eligible,invocation:null,evidence_source:'imported',
    imported_evidence:{digest,origin_run_id:'origin-1',result,acceptance:'manual-digest-v1'}}]};
}
function doctor(host='codex'){
  return {schema:1,command:{matches_invocation:true},project:{config,state},
    control:{reachable:true,classification:'reachable'},state_access:{status:'readable'},
    hosts:[{host,executable:'host',version:'test version',installed:true,integrity:'intact'}]};
}
function collect({host='codex',d=doctor(host),s=status(),syncExit=0,cli='redue',onCommand=()=>{}}={}){
  return collectPortableHostPreflight({host,config,check:'typecheck',state,cwd,cli,
    execute:(_file,args)=>{
      onCommand(args);
      if(args.includes('--version'))return {status:0,stdout:'candidate version'};
      if(args.includes('doctor'))return {status:0,stdout:JSON.stringify(d)};
      return {status:args.includes('--sync')?syncExit:0,stdout:JSON.stringify(s)};
    }});
}

test('portable preflight queries one caller-aware decision without a cached ritual',()=>{
  const commands=[],report=collect({onCommand:args=>commands.push(args)});
  assert.equal(report.eligible,true);
  assert.equal(report.prerequisites.ready,true);
  assert.equal(report.behavior_verified,false);
  assert.equal(report.boundary.verified_by_helper,false);
  assert.equal(commands.filter(args=>args.includes('status')).length,1);
  assert(commands.at(-1).includes('--sync'));
  assert.equal(portablePreconditionMatches(report,'eligible',{evidenceId:digest,runId:'origin-1',state}),true);
  assert.equal(portablePreconditionMatches(report,'eligible',{evidenceId:'b'.repeat(64)}),false);
  assert.equal(portablePreconditionMatches(report,'eligible',{runId:'a different receipt'}),false);
  assert.equal(report.runId,'origin-1');assert.equal(report.evidenceId,digest);
  assert(commands.every(args=>!args.includes('run')&&!args.includes('start')));
});

test('missing prerequisites, wrong resources and a later failed query stop every model launch',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-gate-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const sentinel=path.join(dir,'model-launched');
  const launch=()=>spawnSync(process.execPath,['-e','require("node:fs").writeFileSync(process.argv[1],"launched")',sentinel]);
  const absent=collect({cli:null});
  const conflict=doctor();conflict.hosts[0].integrity='conflict';
  const missingHost=doctor();missingHost.hosts[0].version=null;
  const wrongConfig=doctor();wrongConfig.project.config=path.join(cwd,'different.json');
  const wrongState=doctor();wrongState.project.state=path.join(cwd,'another state');
  const wrongCli=doctor();wrongCli.command.matches_invocation=false;
  for(const report of [absent,collect({d:conflict}),collect({d:missingHost}),collect({d:wrongConfig}),
    collect({d:wrongState}),collect({d:wrongCli}),collect({syncExit:2}),null,{}]){
    let recorded=0;
    const result=await runPortableGatedTrial({preflight:()=>report,expected:'eligible',
      requirements:{evidenceId:digest,runId:'origin-1',state},record:()=>recorded++,launch});
    assert.equal(result.launched,false);
    assert.equal(recorded,1);
    assert.equal(fs.existsSync(sentinel),false);
  }
  assert.equal((await runPortableGatedTrial({preflight:()=>collect(),expected:'eligible',
    requirements:{evidenceId:digest},record:()=>{},launch})).launched,true);
  assert.equal(fs.existsSync(sentinel),true);
});

test('negative trials require their declared state and never gain import authority from a name',()=>{
  const stale=collect({s:status({freshness:'STALE',eligible:false})});
  assert(portablePreconditionMatches(stale,'stale'));
  assert(!portablePreconditionMatches(stale,'eligible'));
  assert(!portablePreconditionMatches(stale,'failed'));
  const failed=collect({s:status({result:'FAIL',eligible:false})});
  assert(portablePreconditionMatches(failed,'failed'));
  const unknown=collect({s:status({freshness:'UNVERIFIED',eligible:false})});
  assert(portablePreconditionMatches(unknown,'unverified'));
  const d=doctor();d.control={reachable:false,classification:'endpoint_missing'};
  const unavailable=status({freshness:'UNVERIFIED',eligible:false});unavailable.observation.healthy=false;
  const report=collect({d,s:unavailable,syncExit:2});
  assert(portablePreconditionMatches(report,'unavailable'));
  assert.equal(report.commands.filter(c=>c.args.includes('status')).length,2);
  const local=status();local.checks[0].evidence_source='local';local.checks[0].invocation={runId:'local-1'};
  assert(!portablePreconditionMatches(collect({s:local}),'eligible',{evidenceId:digest}));
  assert(portablePreconditionMatches(collect({s:local}),'eligible',{runId:'local-1'}));
  const inconsistent=status();inconsistent.checks[0].imported_evidence.origin_run_id='different-origin';
  assert(!portablePreconditionMatches(collect({s:inconsistent}),'eligible',{evidenceId:digest,runId:'origin-1'}));
  const inventedExecution=status();inventedExecution.checks[0].invocation={runId:'origin-1'};
  assert(!portablePreconditionMatches(collect({s:inventedExecution}),'eligible',{evidenceId:digest,runId:'origin-1'}));
});

test('both host mechanisms use the same gate; command errors and malformed JSON are bounded and redacted',()=>{
  assert(portablePreconditionMatches(collect({host:'claude'}),'eligible',{evidenceId:digest}));
  const report=collectPortableHostPreflight({host:'claude',config,check:'typecheck',cwd,cli:'redue',
    execute:()=>({status:null,error:{code:'ETIMEDOUT'},stdout:'sensitive malformed output',stderr:'private diagnostics'})});
  assert.equal(report.prerequisites.ready,false);
  assert.equal(report.eligible,false);
  assert.equal(report.commands.length,3);
  assert(report.commands.every(c=>c.error==='ETIMEDOUT'&&c.response===null));
  assert(!JSON.stringify(report).includes('sensitive'));
  assert(!JSON.stringify(report).includes('private diagnostics'));
});

test('failed evidence recording refuses launch even after a successful preflight',async()=>{
  let launched=false;
  await assert.rejects(runPortableGatedTrial({preflight:()=>collect(),expected:'eligible',
    record:()=>{throw Error('cannot preserve precondition evidence');},launch:()=>{launched=true;}}));
  assert.equal(launched,false);
});
