import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertSmokeRootCwd,summarizeSmokeEconomics} from './acceptance/portable-smoke-economics.mjs';
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
