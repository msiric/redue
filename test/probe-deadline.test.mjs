import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {builtInProbe,nextProbeHint,probeDeadline,publishedDeadline} from '../src/probe-deadline.mjs';

// A full probe's deadline grows with the project instead of a fixed 5 s, and a
// probe that never finishes still ends with the check UNVERIFIED.
const bin=path.resolve('bin/redue.mjs');
const put=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];

test('the probe deadline is the larger of the probe hint and the last run, within floor and ceiling',()=>{
  assert.equal(probeDeadline({floor:5000,ceiling:60000}),5000);
  assert.equal(probeDeadline({floor:5000,hint:14000,ceiling:60000}),14000);
  assert.equal(probeDeadline({floor:5000,hint:4000,runMs:19000,ceiling:60000}),19000);
  assert.equal(probeDeadline({floor:5000,hint:240000,ceiling:60000}),60000);
  assert.equal(probeDeadline({floor:5000,hint:NaN,runMs:-1,ceiling:60000}),5000);
  assert.equal(nextProbeHint({durationMs:7000,deadlineMs:20000,timedOut:false}),14000);
  // A timeout doubles the deadline it ran out of.
  assert.equal(nextProbeHint({durationMs:5001,deadlineMs:5000,timedOut:true}),10000);
  // What the CLI accepts from status.json: whole milliseconds, never unbounded.
  assert.equal(publishedDeadline(7000.5),7001);assert.equal(publishedDeadline(3e9),600000);
  for(const value of [undefined,null,-1,0,'9000',NaN])assert.equal(publishedDeadline(value),0);
  // Only REDUE's own probe files get --redue-deadline, by exact path.
  assert(builtInProbe([process.execPath,path.resolve('src/direct-typescript-probe.mjs')]));
  assert(!builtInProbe([process.execPath,'/elsewhere/direct-typescript-probe.mjs']));
  assert(!builtInProbe(['node','probe.cjs']));
});

// A declared probe that waits as long as probe-delay says: a number of
// milliseconds, or "hang".
function fixture(t,env={}){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-pd-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-s');
  put(path.join(root,'package.json'),'{"name":"probe-deadline-fixture","version":"1"}\n');
  put(path.join(root,'check.cjs'),'process.exitCode=0;\n');put(path.join(root,'src/a.txt'),'a\n');
  put(path.join(base,'probe-delay'),'0');
  put(path.join(root,'probe.cjs'),`const delay=require('node:fs').readFileSync(${JSON.stringify(path.join(base,'probe-delay'))},'utf8').trim();
if(delay==='hang')setInterval(()=>{},1000);
else setTimeout(()=>process.stdout.write('stable state\\n'),Number(delay));\n`);
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'check',command:['@node','check.cjs'],
    inputs:['src/**','check.cjs','probe.cjs'],probes:[['@node','probe.cjs']],
    coverage:{...Object.fromEntries(categories.map(k=>[k,true])),probeContinuity:true},
    coverageReview:{...Object.fromEntries(categories.map(k=>[k,'reviewed fixture contract'])),probeContinuity:'reviewed fixture contract'}}]}));
  execFileSync('git',['init','-q'],{cwd:root});
  const f={base,root,state,env:{...process.env,VSTATE_START_READY_WAIT_MS:'10000',...env}};
  t.after(()=>{call(f,'stop');fs.rmSync(base,{recursive:true,force:true});});
  return f;
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--state-dir',f.state,...args],
  {cwd:f.root,env:f.env,encoding:'utf8',timeout:120000});}
function ok(f,...args){const out=call(f,...args);assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}${out.stdout}`);return out.stdout;}
const sync=f=>JSON.parse(call(f,'status','--sync','--json').stdout).checks[0];
const published=f=>JSON.parse(fs.readFileSync(path.join(f.state,'status.json'),'utf8')).probe_deadline_ms;

test('a probe slower than the 5 s floor gets a longer deadline and the check becomes CURRENT',
  {skip:process.platform==='win32'},async t=>{
  const f=fixture(t);ok(f,'start');
  fs.writeFileSync(path.join(f.base,'probe-delay'),'6500');
  const first=sync(f);
  assert.notEqual(first.freshness,'CURRENT');assert.match(first.reason,/probe unavailable.*ETIMEDOUT/,first.reason);
  assert.equal(published(f),10000,'the deadline doubles after a timeout');
  ok(f,'run','check');
  const row=sync(f);
  assert.equal(`${row.freshness}/${row.result}/${row.reuse_eligible}`,'CURRENT/PASS/true',row.reason);
  assert(published(f)>=13000,`deadline follows the probe: ${published(f)}`);
  // The observer was blocked for whole probes; on Linux that must not look like
  // a dead inotify helper.
  const events=fs.readFileSync(path.join(f.state,'events.jsonl'),'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(events.filter(e=>e.kind==='observation_gap'),[]);
});

test('a slow probe right after start is no observation gap',{skip:process.platform==='win32'},async t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.base,'probe-delay'),'4500');
  ok(f,'start');ok(f,'run','check');
  await new Promise(resolve=>setTimeout(resolve,2000));
  assert.equal(sync(f).freshness,'CURRENT');
  const events=fs.readFileSync(path.join(f.state,'events.jsonl'),'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(events.filter(e=>e.kind==='observation_gap'),[]);
});

test('a probe that never finishes is killed at its deadline and the check stays UNVERIFIED',
  {skip:process.platform==='win32'},async t=>{
  const f=fixture(t,{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_PROBE_CEILING_MS:'3000'});ok(f,'start');ok(f,'run','check');
  fs.writeFileSync(path.join(f.base,'probe-delay'),'hang');
  for(let n=0;n<3;n++){
    const started=Date.now(),row=sync(f),took=Date.now()-started;
    assert.equal(row.freshness,'UNVERIFIED',row.reason);assert.match(row.reason,/ETIMEDOUT/);
    assert(took<15000,`the ceiling bounds each decision: ${took} ms`);
  }
  assert.equal(published(f),3000);
  // The observer still answers once the hung probe is gone.
  fs.writeFileSync(path.join(f.base,'probe-delay'),'0');
  ok(f,'run','check');assert.equal(sync(f).freshness,'CURRENT');
});
