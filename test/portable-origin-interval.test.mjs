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
test('real cached unavailable branches cannot retain nested green portable evidence',async t=>{
 const os=await import('node:os'),path=await import('node:path');
 const {atomicJson,receiptRevision}=await import('../src/state-store.mjs');
 const {readCachedStatus,unavailableCached}=await import('../src/cached-state.mjs');
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-interval-cache-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 atomicJson(path.join(base,'receipts-v1.json'),{schema:1,checks:{compiler:{result:'PASS',invocation:{runId:'historical'}}}});
 const now=Date.now(),cached={schema:1,checks:[row('compiler',{evidence_source:'imported',invocation:null,
  portable_evidence:{selected:{run_id:'historical'},freshness:'CURRENT',reuse_eligible:true}})],
  updated_at:now,expires_at:now+2500,pid:process.pid,receipt_revision:receiptRevision(base),observation:{healthy:true}};
 for(const patch of [{},{updated_at:now-5000,expires_at:now-1},{receipt_revision:'superseded'},{pid:2147483647}]){
  atomicJson(path.join(base,'status.json'),{...cached,...patch});
  for(const result of [readCachedStatus(base,[{name:'compiler'}]),unavailableCached(base,'controlled unavailable',[{name:'compiler'}])]){
   const check=result.checks[0];assert.equal(check.reuse_eligible,false);assert.equal(check.freshness,'UNVERIFIED');
   assert.equal(check.portable_evidence.reuse_eligible,false);assert.equal(check.portable_evidence.freshness,'UNVERIFIED');
   assert.equal(check.portable_evidence.selected.run_id,'historical');assert.equal(check.result,'PASS');
  }
 }
});
test('human and JSON recording summaries disclose incomplete portable capture separately from actual PASS',async()=>{
 const {renderRun}=await import('../src/presentation.mjs');
 const ordinary={check:'compiler',result:'PASS',invocation:'exited',stable:true,coverage_qualified:true};
 assert(!renderRun(ordinary).includes('Portable origin'));
 const rendered=renderRun({...ordinary,portable_complete:false,portable_reason:reason});
 assert.match(rendered,/PASS recorded/);assert.match(rendered,/Portable origin is incomplete/);assert(rendered.includes(reason));
 const cli=fs.readFileSync(new URL('../src/cli.mjs',import.meta.url),'utf8');
 assert.match(cli,/portable_complete:receipt\.portable\.complete/);assert.match(cli,/portable_reason:receipt\.portable\.reason/);
});
test('actual configured portable runs preserve PASS/FAIL and immutable history while withholding portable completeness', {timeout:120000},async t=>{
 const os=await import('node:os'),path=await import('node:path');
 const {spawnSync}=await import('node:child_process'),{createRequire}=await import('node:module');
 const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'redue-interval-run-'))),root=path.join(base,'project'),state=path.join(base,'redue-state');
 const put=(name,bytes)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
 put('package.json',JSON.stringify({name:'controlled-interval-refusal',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
 put('package-lock.json','{"lockfileVersion":3}');
 put('tsconfig.json',JSON.stringify({compilerOptions:{noEmit:true,noLib:true,strict:true,target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
 put('src/globals.d.ts','interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
 put('src/value.ts','export const value: number = 1;\n');put('.gitignore','node_modules/\n');
 const compiler=path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
 fs.cpSync(compiler,path.join(root,'node_modules/typescript'),{recursive:true});
 fs.mkdirSync(path.join(root,'node_modules/.bin'));
 if(process.platform==='win32')fs.writeFileSync(path.join(root,'node_modules/.bin/tsc.cmd'),'@node "%~dp0..\\typescript\\bin\\tsc" %*\r\n');
 else fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules/.bin/tsc'));
 const git=spawnSync('git',['init','-q'],{cwd:root,encoding:'utf8',timeout:5000});assert.equal(git.status,0);
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
 const bin=path.resolve('bin/redue.mjs');
 const call=(...args)=>spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env,encoding:'utf8',timeout:30000,maxBuffer:65536});
 t.after(()=>{const stopped=call('stop');assert.equal(stopped.status,0,'owned observer must stop before disposable cleanup');fs.rmSync(base,{recursive:true,force:true});});
 for(const args of [['init','--recipe','typescript-direct'],['start']]){const result=call(...args);assert.equal(result.status,0,result.stderr);}
 const first=call('run','typecheck','--portable','--json');assert.equal(first.status,0,first.stderr);
 const selected=()=>JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'))).checks.typecheck;
 const pass=selected(),immutable=path.join(state,'runs-v1',pass.invocation.runId+'.json'),original=fs.readFileSync(immutable);
 assert.equal(pass.result,'PASS');assert.equal(pass.invocation.status,'exited');assert.equal(pass.invocation.exitCode,0);
 assert.equal(pass.portable.complete,false);assert.equal(pass.portable.reason,reason);assert.equal(pass.portable.facts,null);
 assert.match(first.stdout,/"portable_complete":false/);assert(first.stdout.includes(reason));
 put('src/value.ts','export const value: number = "bad";\n');
 const failed=call('run','typecheck','--portable','--json');assert.equal(failed.status,2,failed.stderr);
 const fail=selected();assert.equal(fail.result,'FAIL');assert.equal(fail.invocation.status,'exited');assert.equal(fail.invocation.exitCode,2);
 assert.notEqual(fail.invocation.runId,pass.invocation.runId);assert.equal(fail.portable.complete,false);assert.equal(fail.portable.reason,reason);
 assert.deepEqual(fs.readFileSync(immutable),original);
 for(const args of [['stop'],['start']]){const result=call(...args);assert.equal(result.status,0,result.stderr);}
 const status=call('status','--sync','--json');assert.equal(status.status,0,status.stderr);
 const check=JSON.parse(status.stdout).checks[0];assert.equal(check.result,'FAIL');assert.equal(check.reuse_eligible,false);
 assert.equal(check.invocation.runId,fail.invocation.runId);assert.deepEqual(fs.readFileSync(immutable),original);
});
