import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {runGatedTrial} from './acceptance/agent-trial-gate.mjs';
const report=(freshness='CURRENT',result='PASS',eligible=true)=>({schema:1,check:'x',cli:'redue',eligible,
  commands:[{exit:0,response:{schema:1,observation:{healthy:true},checks:[{name:'x',freshness,result,reuse_eligible:eligible}]}}]});
test('failed/throwing/malformed/wrong preflight launches no model process',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-gate-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const mark=path.join(dir,'launched');let recorded=0;
  const launch=()=>spawnSync(process.execPath,['-e','require("fs").writeFileSync(process.argv[1],"launched")',mark]);
  for(const preflight of [()=>report('STALE','PASS',false),()=>null,()=>({}),()=>{throw Error('offline');},
    ()=>({...report(),commands:[]}),()=>({...report(),commands:[{exit:2,response:report().commands[0].response}]})]){
    assert.equal((await runGatedTrial({preflight,expected:'eligible',record:()=>recorded++,launch})).launched,false);
    assert(!fs.existsSync(mark));
  }
  assert.equal(recorded,6);
  assert.equal((await runGatedTrial({preflight:()=>report(),expected:'eligible',record:()=>{},launch})).launched,true);
  assert(fs.existsSync(mark));
});
test('negative trials require their own explicit precondition, never arbitrary failure',async()=>{
  let launches=0;const run=(r,expected)=>runGatedTrial({preflight:()=>r,expected,record:()=>{},launch:()=>launches++});
  assert((await run(report('STALE','PASS',false),'stale')).launched);
  assert(!(await run(report(),'stale')).launched);
  assert(!(await run(report('UNVERIFIED','PASS',false),'stale')).launched);
  assert((await run(report('UNVERIFIED','PASS',false),'unverified')).launched);
  assert((await run(report('CURRENT','FAIL',false),'failed')).launched);
  assert(!(await run(report('UNVERIFIED','PASS',false),'failed')).launched);
  const denied={schema:1,cli:'redue',check:'x',eligible:false,commands:[
    {response:{control:{reachable:false}}},
    {args:['status','--json'],response:{schema:1,observation:{healthy:false},checks:[{name:'x',reuse_eligible:false}]}},
    {exit:2,response:null}]};
  assert((await run(denied,'unavailable')).launched);
  assert(!(await run({...denied,commands:[]},'unavailable')).launched);
  assert(!(await run(report(),'unavailable')).launched);
  assert.equal(launches,4);
});
test('record failure also stops launch rather than losing precondition evidence',async()=>{
  let launched=false;
  await assert.rejects(runGatedTrial({preflight:()=>report(),expected:'eligible',record:()=>{throw Error('write failed');},launch:()=>{launched=true;}}));
  assert.equal(launched,false);
});
