import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {controlEndpoint} from '../src/control-endpoint.mjs';

// Daemon decisions reuse the last full compiler probe only while its recorded
// questions still hold. These fixtures sit inside a private parent directory so
// lookups outside the checkout (ancestor node_modules) are under test control.
const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const sourceTypeScript=path.dirname(require.resolve((process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript')+'/package.json'));
const inProcess=process.platform!=='win32';
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-cert-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-state'),profile=path.join(base,'profile.jsonl');
  put(path.join(root,'package.json'),JSON.stringify({name:'certificate-fixture',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit'}}));
  put(path.join(root,'package-lock.json'),'{"name":"certificate-fixture","lockfileVersion":3}');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'// @ts-ignore optional missing module\nimport {x} from "optional";\nexport const value: number = 1;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.cpSync(sourceTypeScript,path.join(root,'node_modules/typescript'),{recursive:true});
  fs.mkdirSync(path.join(base,'node_modules/@types'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const env=Object.fromEntries(Object.entries(process.env)
    .filter(([key])=>!/^npm_config_/i.test(key)&&!/^NODE_/i.test(key)));
  const f={base,root,state,profile,env:{...env,VSTATE_START_READY_WAIT_MS:'10000',VSTATE_TEST_FAULTS:'1',
    VSTATE_HISTORY_TIMEOUT_MS:'1000',REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:profile,
    VSTATE_TEST_HISTORY_FAULT_FILE:path.join(state,'history-fault'),
    VSTATE_TEST_LINUX_GAP_FILE:path.join(state,'linux-gap'),
    VSTATE_TEST_WINDOWS_GAP_FILE:path.join(state,'windows-gap'),
    VSTATE_TEST_DROP_EVENTS_FILE:path.join(state,'drop-events')}};
  t.after(()=>{try{call(f,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  ok(f,'init','--recipe','typescript-direct');ok(f,'start');ok(f,'run','typecheck');
  return f;
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--state-dir',f.state,...args],
  {cwd:f.root,env:f.env,encoding:'utf8',timeout:45000});}
function ok(f,...args){const out=call(f,...args);
  assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}\n${out.stdout}`);return out.stdout;}
const sync=f=>JSON.parse(ok(f,'status','--sync','--json')).checks[0];
const cached=f=>JSON.parse(ok(f,'status','--json')).checks[0];
const state=r=>`${r.freshness}/${r.result}/${r.reuse_eligible?'eligible':'not-eligible'}`;
function metrics(f){return new Promise((resolve,reject)=>{
  const client=net.createConnection(controlEndpoint(f.state).address);let data='';
  client.on('connect',()=>client.write('{"action":"metrics"}\n'));client.on('data',chunk=>data+=chunk);
  client.on('end',()=>{try{const value=JSON.parse(data).metrics;
    resolve({full:value.fullProbes||0,reused:value.probeReuses||0,gaps:value.gaps||0});}catch(e){reject(e);}});
  client.on('error',reject);});}
const launches=f=>fs.existsSync(f.profile)?fs.readFileSync(f.profile,'utf8').split('\n')
  .filter(line=>line.includes('"phase":"daemon.probe_launch"')).length:0;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function settled(f){let value;for(let n=0;n<100;n++){value=sync(f);
  if(value.freshness==='CURRENT')return value;await wait(100);}return value;}

test('a compiler lookup outside the checkout that appears or disappears invalidates reuse',async t=>{
  const f=fixture(t);
  assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  const before=await metrics(f);
  put(path.join(f.base,'node_modules/optional/index.d.ts'),'export declare const x: string;\n');
  const appeared=sync(f);
  assert.notEqual(appeared.freshness,'CURRENT');assert.equal(appeared.reuse_eligible,false);
  fs.rmSync(path.join(f.base,'node_modules/optional'),{recursive:true});
  assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  const restored=await metrics(f);
  if(inProcess)assert(restored.full>=before.full+2,JSON.stringify({before,restored}));
  // A disappearing directory lookup changes no compiler input: a full probe
  // confirms that, and the outcome stays CURRENT.
  fs.rmSync(path.join(f.base,'node_modules/@types'),{recursive:true});
  assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  if(inProcess)assert.equal((await metrics(f)).full,restored.full+1);
});

test('idle observer launches no probe and a relevant edit is STALE immediately',async t=>{
  const f=fixture(t);
  assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  const before=await metrics(f);
  for(let n=0;n<3;n++)assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  const warm=await metrics(f);
  // Each read reuses the probe; the daemon's own periodic check may reuse it
  // once more in between. None launches a full probe.
  if(inProcess){assert.equal(warm.full,before.full);assert(warm.reused>=before.reused+3,JSON.stringify({before,warm}));}
  const idle=launches(f);await wait(6500);
  assert.equal(launches(f),idle,'no probe process while idle');
  // Windows cached status is UNVERIFIED by design until a synchronized read.
  // Cached reads carry no execution context, so an unchanged direct check is
  // UNVERIFIED there; only a synchronized read can confirm CURRENT.
  assert.equal(cached(f).freshness,'UNVERIFIED');
  const unedited=await metrics(f);
  fs.appendFileSync(path.join(f.root,'src/main.ts'),'export const edited = 2;\n');
  const edited=sync(f);
  // The inputs already differ from the receipt, so the answer is STALE without a probe.
  if(inProcess)assert.equal((await metrics(f)).full,unedited.full,'a known-STALE edit costs no full probe');
  if(process.platform==='darwin'){
    // Without live notifications only the decision's history barrier delivers
    // the edit. The check is already STALE, so no full probe follows the barrier.
    const queued=await metrics(f);put(path.join(f.state,'drop-events'),'');
    fs.appendFileSync(path.join(f.root,'src/main.ts'),'export const queued = 4;\n');
    assert.equal(state(sync(f)),'STALE/PASS/not-eligible');fs.rmSync(path.join(f.state,'drop-events'));
    assert.equal((await metrics(f)).full,queued.full,'a queued known-STALE edit costs no full probe');
  }
  assert.equal(state(edited),'STALE/PASS/not-eligible');assert.deepEqual(edited.changed_inputs,['src/main.ts']);
  if(inProcess){
    // Cached status keeps STALE once neither the probe nor execution context can
    // be confirmed: the observed inputs already differ from the receipt.
    fs.appendFileSync(path.join(f.root,'src/main.ts'),'export const again = 3;\n');
    const launched=launches(f);await wait(11000);
    const later=cached(f);
    assert.equal(state(later),'STALE/PASS/not-eligible');assert.deepEqual(later.changed_inputs,['src/main.ts']);
    assert.equal(launches(f),launched,'no probe process while idle after an edit');
  }
});

test('an observation gap forces a full probe before reuse resumes',async t=>{
  const f=fixture(t);
  assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
  const before=await metrics(f);
  const target=process.platform==='linux'?'linux-gap':process.platform==='win32'?'windows-gap':'history-fault';
  put(path.join(f.state,target),process.platform==='linux'?'inotify_overflow':'fail');
  if(process.platform==='linux')for(let n=0;n<100&&(await metrics(f)).gaps===before.gaps;n++)await wait(25);
  const recovered=await settled(f);
  fs.rmSync(path.join(f.state,target),{force:true});
  assert.equal(state(recovered),'CURRENT/PASS/eligible');
  const after=await metrics(f);
  assert(after.gaps>before.gaps,JSON.stringify({before,after}));
  assert(after.full>before.full,'the certificate from before the gap is not reused');
  if(process.platform==='linux'){
    // Reuse resumes from the new full probe: no other full probe, at least one
    // reuse. A decision already queued when `after` was read (a late gap
    // reconciliation) can add a second reuse, so the count is a floor.
    assert.equal(state(sync(f)),'CURRENT/PASS/eligible');
    const resumed=await metrics(f);
    assert.equal(resumed.full,after.full,'no full probe after the one that followed the gap');
    assert(resumed.reused>after.reused,'reuse resumes from the new full probe');
  }
});
