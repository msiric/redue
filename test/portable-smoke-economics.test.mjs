import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertSmokeRootCwd,assertOrdinaryPostImportOutcome,finishOwnedSmokeBase,smokeEvidenceObservation,summarizeSmokeEconomics} from './acceptance/portable-smoke-economics.mjs';
const sample=()=>[
 {scope:'setup',phase:'candidate-package-install',milliseconds:999,exit_status:0,error_code:null},
 {scope:'plain-baseline',phase:'plain-initial-compiler',milliseconds:100,exit_status:0,error_code:null},
 {scope:'portable-workflow',phase:'wrapped-portable-execution',milliseconds:300,exit_status:0,error_code:null},
 {scope:'portable-workflow',phase:'status-synchronized',milliseconds:40,exit_status:0,error_code:null},
 {scope:'portable-workflow',phase:'wrapped-local-execution',milliseconds:200,exit_status:0,error_code:null},
 {scope:'plain-baseline',phase:'plain-relevant-compiler',milliseconds:110,exit_status:0,error_code:null},
 {scope:'cleanup',phase:'cleanup-observer-stop',milliseconds:20,exit_status:0,error_code:null},
];
test('complete command costs retain recording and rerun; actual wall time is not constructed from medians',()=>{
 const report=summarizeSmokeEconomics(sample(),600);
 assert.equal(report.workflow_command_ms,540);assert.equal(report.complete_workflow_wall_ms,600);
 assert.equal(report.plain_two_required_compilations_ms,210);assert.equal(report.added_command_ms_vs_two_required_compilations,330);
 assert.equal(report.recorded_executions,2);assert.equal(report.avoided_verification_executions,'NOT_ESTABLISHED_BY_MECHANICS');
 assert.equal(report.model_and_tool_transport_cost,'NOT_MEASURED');
});
test('missing, failed, fabricated or mislabeled samples fail rather than provide favorable comparison',()=>{
 for(const mutate of [rows=>rows.pop()&&rows.splice(5,1),rows=>rows[2].exit_status=1,rows=>rows[2].milliseconds=NaN,rows=>rows[2].phase='/private/path']){
  const rows=sample();mutate(rows);assert.throws(()=>summarizeSmokeEconomics(rows,600));
 }
 assert.throws(()=>summarizeSmokeEconomics(sample(),null));
});

test('runtime relative cwd resolves to the same canonical owned root, not a different directory',()=>{
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-smoke-cwd-')));
 const root=path.join(base,'root'),other=path.join(base,'other');fs.mkdirSync(root);fs.mkdirSync(other);fs.mkdirSync(path.join(root,'nested'));
 try{
  for(const cwd of ['.',root,'nested/..'])assert.doesNotThrow(()=>assertSmokeRootCwd(root,cwd,fs.realpathSync));
  for(const cwd of ['',null,undefined,4,'nested','../other',other])assert.throws(()=>assertSmokeRootCwd(root,cwd,fs.realpathSync));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});

test('served evidence is collected before a failing assertion and excludes hostile explanations',()=>{
 const status={schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness:'UNVERIFIED',result:'PASS',reuse_eligible:false,
  reason_code:'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK',reason:'secret https://private.invalid/token',
  invocation:{runId:'12345678-1234-1234-1234-123456789abc'},imported_evidence:{digest:'a'.repeat(64),origin_run_id:'private-path'},extra:'secret'}]};
 const rows=[];rows.push(smokeEvidenceObservation('recipient-required-run-final',status,7));
 assert.throws(()=>assert.equal(status.checks[0].freshness,'CURRENT'));
 assert.equal(rows[0].freshness,'UNVERIFIED');assert.equal(rows[0].result,'PASS');assert.equal(rows[0].reuse_eligible,false);
 assert.equal(rows[0].reason_code,'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK');assert.equal(rows[0].command_index,7);
 assert.equal(rows[0].origin_run_id,null);assert.doesNotMatch(JSON.stringify(rows),/secret|private/);
 status.checks[0].reason_code='secret https://private.invalid';status.checks[0].freshness='secret';
 const redacted=smokeEvidenceObservation('recipient-required-run-final',status,8);assert.equal(redacted.reason_code,null);assert.equal(redacted.freshness,null);
 status.checks[0].reason_code='PRIVATE_SECRET_TOKEN';
 assert.equal(smokeEvidenceObservation('recipient-required-run-final',status,9).reason_code,null);
 assert.throws(()=>smokeEvidenceObservation('private/path',status,8));
});

test('ordinary post-import PASS is historical and never reusable, including after restart',()=>{
 const selected={freshness:'UNVERIFIED',result:'PASS',reuse_eligible:false,reason_code:'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK',invocation:{runId:'new-local'}};
 assert.doesNotThrow(()=>assertOrdinaryPostImportOutcome(selected,'origin'));
 for(const patch of [{freshness:'CURRENT'},{reuse_eligible:true},{result:'FAIL'},{invocation:null},{evidence_source:'imported'},{reason_code:null},{invocation:{runId:'origin'}}])
  assert.throws(()=>assertOrdinaryPostImportOutcome({...selected,...patch},'origin'));
});
test('economics failure preserves actual owned receipt and checkout files; default cleanup remains intact',()=>{
 for(const flags of [{economics:true,failed:true},{economics:false,failed:true},{economics:true,failed:false}]){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-smoke-retain-'))),receipt=path.join(base,'immutable-receipt.json'),checkout=path.join(base,'source.ts');
  fs.writeFileSync(receipt,'owned immutable receipt');fs.writeFileSync(checkout,'owned source');
  try{
   const result=finishOwnedSmokeBase(base,flags);
   if(flags.economics&&flags.failed){
    assert.equal(result.retained,true);assert.equal(fs.readFileSync(receipt,'utf8'),'owned immutable receipt');assert.equal(fs.readFileSync(checkout,'utf8'),'owned source');
    const report=path.join(base,result.owner_private_report);assert.equal(JSON.parse(fs.readFileSync(report)).base,base);
    if(process.platform!=='win32')assert.equal(fs.statSync(report).mode&0o777,0o600);
    assert(!JSON.stringify(result).includes(base));
   }else{assert.equal(result.retained,false);assert.equal(fs.existsSync(base),false);}
  }finally{fs.rmSync(base,{recursive:true,force:true});}
 }
});
