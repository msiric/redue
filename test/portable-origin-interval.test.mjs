// Containment controls, not a native observation or real compiler reproduction.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {portableOriginIntervalPolicy,portableOriginIntervalReason as reason,
  portableOriginIntervalSupported,requirePortableOriginInterval,containPortableStatus} from '../src/portable-origin-interval.mjs';
import {capturePortableFacts,portableCallerProof} from '../src/portable-facts.mjs';
import {decidePortableEvidence} from '../src/portable-applicability.mjs';
const row=(name,extra={})=>({name,freshness:'CURRENT',result:'PASS',reuse_eligible:true,...extra});
const catalog={records:[{check:'compiler',acceptance:'github-ci-v1'}]};
test('no request, imported label, environment or lookalike can mint the unsupported origin capability',()=>{
 assert.equal(portableOriginIntervalPolicy,'redue-portable-origin-interval@1');
 for(const fake of [undefined,true,{supported:true},{observationHealthy:true}])assert.equal(portableOriginIntervalSupported(fake),false);
 assert.throws(requirePortableOriginInterval,{code:reason});
 assert.throws(()=>portableCallerProof({}),{code:reason});
 assert.throws(()=>capturePortableFacts({}, {files:{},observationHealthy:true},{}),{code:reason});
});
test('budgets and missing observation retain their prior conservative refusal',()=>{
 const expired={remaining:()=>{throw Object.assign(Error(),{code:'PORTABLE_PROBE_TIMEOUT'});}};
 assert.throws(()=>portableCallerProof({},expired),{code:'PORTABLE_PROBE_TIMEOUT'});
 assert.throws(()=>capturePortableFacts({},null,{},expired),{code:'PORTABLE_PROBE_TIMEOUT'});
 assert.throws(()=>capturePortableFacts({},null,{}),{code:'PORTABLE_OBSERVATION_INCOMPLETE'});
});
test('pure comparison requires a locally established origin interpretation prerequisite',()=>{
 const options={check:'compiler',facts:{},snapshot:{revision:'none',records:[]},
  prerequisites:{understood:true,callerValidated:true,observationHealthy:true,complete:true}};
 for(const value of [undefined,false,'true',{},portableOriginIntervalSupported()]){
  const result=decidePortableEvidence({...options,prerequisites:{...options.prerequisites,originIntervalSupported:value}});
  assert.equal(result.reason,reason);assert.equal(result.reuse_eligible,false);assert.equal(result.freshness,'UNVERIFIED');
 }
});
test('older observer green imported summaries are withdrawn without editing historical outcomes',()=>{
 const previous={checks:[row('compiler',{invocation:null,evidence_source:'imported',
  imported_evidence:{origin_run_id:'historical',result:'PASS'},portable_evidence:{selected:{run_id:'historical'},freshness:'CURRENT',reuse_eligible:true}}),row('unrelated')],
  current:2,failed:0,stale:0,unverified:0,state:'current',observation:{healthy:true}};
 const bytes=JSON.stringify(previous),result=containPortableStatus(previous,catalog);
 assert.equal(result.current,1);assert.equal(result.unverified,1);assert.equal(result.state,'unverified');
 assert.equal(result.checks[0].result,'PASS');assert.equal(result.checks[0].reuse_eligible,false);assert.equal(result.checks[0].reason_code,reason);
 assert.equal(result.checks[0].portable_evidence.reuse_eligible,false);assert.equal(result.checks[0].portable_evidence.selected.run_id,'historical');
 assert.equal(result.checks[0].imported_evidence.origin_run_id,'historical');assert.deepEqual(result.checks[1],previous.checks[1]);
 assert.equal(JSON.stringify(previous),bytes);assert.deepEqual(result.observation,previous.observation);
});
test('historical failure and local execution remain facts; unsupported portable evidence cannot hide either',()=>{
 const status={checks:[row('compiler',{result:'FAIL',invocation:{runId:'latest'},freshness:'UNVERIFIED',reuse_eligible:false}),row('other',{result:'FAIL'})]};
 const result=containPortableStatus(status,catalog);
 assert.equal(result.observed_failed,2);assert.equal(result.failed,1);assert.equal(result.state,'failed');
 assert.deepEqual(result.checks[0].invocation,{runId:'latest'});assert.equal(result.checks[0].result,'FAIL');
});
test('unaccepted, other-check and malformed catalogs cannot alter unrelated local status',()=>{
 const value={checks:[row('compiler')]};
 for(const records of [[],[{check:'compiler',acceptance:'untrusted'}],[{check:'other',acceptance:'manual-digest-v1'}],[{check:'compiler',acceptance:'future-trust'}]])
  assert.equal(containPortableStatus(value,{records}),value);
 assert.equal(containPortableStatus(value,{}),value);
});
test('all live capture, recipient, cached and synchronized/detail entrypoints use the local policy',()=>{
 const read=name=>fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
 assert.match(read('daemon.mjs'),/originIntervalSupported:portableOriginIntervalSupported\(\)/);
 assert.match(read('cached-state.mjs'),/return containPortableStatus\(value,catalog\)/);
 assert.match(read('cli.mjs'),/value=containPortableStatus\(value,catalog\)/);
 assert.match(read('portable-facts.mjs'),/budget\?\.remaining\(\);requirePortableOriginInterval\(\)/);
 assert.match(read('portable-facts.mjs'),/PORTABLE_OBSERVATION_INCOMPLETE'\);\s+requirePortableOriginInterval\(\)/);
});
