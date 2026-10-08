import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {inflateSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {controlEndpoint} from '../src/control-endpoint.mjs';
import {commitReceipt,readReceipts} from '../src/state-store.mjs';
import {acquireRunLock} from '../src/run-lock.mjs';
import {pathToFileURL} from 'node:url';

const cli=path.resolve('bin/redue.mjs'),probe=path.resolve('src/direct-typescript-probe.mjs');
const cleanEnv=()=>Object.fromEntries(Object.entries(process.env).filter(([k])=>
  !/^npm_config_/i.test(k)&&!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(k)));
const put=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rm-'))),root=path.join(base,'project');
  put(path.join(root,'package.json'),JSON.stringify({name:'owned-direct-fixture',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
  put(path.join(root,'package-lock.json'),'{"lockfileVersion":3}');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'// @ts-ignore optional missing module\nimport {x} from "optional";\nexport const value: number = 1;\n');
  put(path.join(root,'src/other.ts'),'export const other = 2;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.cpSync(path.resolve('node_modules',process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript'),path.join(root,'node_modules/typescript'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const fixtures=[false,true].map(full=>{const state=path.join(base,full?'redue-r':'redue-f');
    return {root,state,env:{...cleanEnv(),VSTATE_START_READY_WAIT_MS:'10000',VSTATE_TEST_FAULTS:'1',
      ...(full?{VSTATE_TEST_FULL_PROBES:'1',VSTATE_TEST_FULL_RUN_PROBES:'1'}:{}),
      VSTATE_TEST_HISTORY_FAULT_FILE:path.join(state,'history-fault'),
      VSTATE_TEST_DROP_EVENTS_FILE:path.join(state,'drop-events'),
      VSTATE_TEST_RECONCILE_FAULT_FILE:path.join(state,'reconcile-fault')}};});
  call(fixtures[0],['init','--recipe','typescript-direct']);
  t.after(()=>{for(const f of fixtures)try{call(f,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true});});
  return {base,root,fast:fixtures[0],full:fixtures[1],fixtures};
}
function call(f,args,extra={}){const r=spawnSync(process.execPath,[cli,'--state-dir',f.state,...args],
  {cwd:f.root,env:{...f.env,...extra},encoding:'utf8',timeout:45000});
  assert.equal(r.status,0,r.stderr+'\n'+r.stdout);return r.stdout;}
const row=(f,extra)=>JSON.parse(call(f,['status','--sync','--json'],extra)).checks[0];
async function settled(f){let value;for(let i=0;i<30;i++){
  value=row(f);if(!/pending|rebuilding|unavailable.*restart/.test(value.reason))return value;
  await new Promise(r=>setTimeout(r,80));}return value;}
const semantic=r=>({freshness:r.freshness,result:r.result,reuse:r.reuse_eligible,recipe:r.verification_recipe});
function control(f,action){return new Promise((resolve,reject)=>{
  const c=net.createConnection(controlEndpoint(f.state).address);let data='';
  c.on('connect',()=>c.write(JSON.stringify(typeof action==='string'?{action}:action)+'\n'));c.on('data',b=>data+=b);
  c.on('end',()=>{try{resolve(JSON.parse(data));}catch(e){reject(e);}});c.on('error',reject);
});}

test('direct certificate validation rejects missing/obsolete/malformed queries and implementation substitution',t=>{
  const f=fixture(t).fast;
  const invoke=(args,input,env={})=>spawnSync(process.execPath,[probe,f.root,'typecheck',...args],
    {cwd:f.root,env:{...f.env,...env},input,encoding:'utf8',timeout:15000});
  const full=invoke(['--redue-checkpoint']);assert.equal(full.status,0,full.stderr);
  const c=JSON.parse(full.stdout),queries=JSON.parse(inflateSync(Buffer.from(c.queryData,'base64')));
  const certificate={schema:1,context:c.context,queries};
  const valid=invoke(['--redue-validate-queries'],JSON.stringify(certificate));assert.equal(valid.status,0,valid.stderr);assert.equal(valid.stdout,c.context);
  for(const bad of [{...certificate,schema:0},{...certificate,queries:[]},{...certificate,queries:null},
    {...certificate,context:'wrong'},{...certificate,queries:[['unrecognized',f.root,null]]},
    {...certificate,queries:[['readDirectory',f.root,[],{tsRoot:path.join(f.root,'other'),args:[]}]]}])
    assert.notEqual(invoke(['--redue-validate-queries'],JSON.stringify(bad)).status,0);
  assert.notEqual(invoke(['--redue-validate-queries'],'{').status,0);
  assert.notEqual(invoke(['--redue-validate-queries'],JSON.stringify(certificate),{NODE_ENV:'development'}).status,0);
  put(path.join(f.root,'node_modules/typescript/lib/typescript.js'),'throw Error("must not load replacement");');
  const replaced=invoke(['--redue-validate-queries'],JSON.stringify(certificate));
  assert.match(replaced.stderr,/implementation-unreviewed/);
});

test('ETW overrides and default loader additions cannot execute through any direct probe mode',t=>{
  const f=fixture(t).fast,marker=path.join(f.root,'etw-loaded');
  const injected=path.join(f.root,'owned-etw.cjs');
  put(injected,`require('node:fs').writeFileSync(${JSON.stringify(marker)},'loaded');`);
  const invoke=(args,input,env={})=>spawnSync(process.execPath,[probe,f.root,'typecheck',...args],
    {cwd:f.root,env:{...f.env,...env},input,encoding:'utf8',timeout:15000});
  const full=invoke(['--redue-checkpoint']);assert.equal(full.status,0,full.stderr);
  const c=JSON.parse(full.stdout),input=JSON.stringify({schema:1,context:c.context,
    queries:JSON.parse(inflateSync(Buffer.from(c.queryData,'base64')))});
  const modes=[[],['--redue-context'],['--redue-validate-queries']];
  for(const env of [{TS_ETW_MODULE_PATH:injected},{TS_ETW_MODULE_PATH:''},{ts_etw_module_path:injected}])
    for(const args of modes){const r=invoke(args,input,env);
      assert.equal(r.status,2);assert.match(r.stderr,/direct-execution-environment-unsupported/);
      assert.equal(r.stdout,'');assert(!fs.existsSync(marker),'unreviewed ETW module ran');}
  put(path.join(f.root,'node_modules/typescript/lib/node_modules/@microsoft/typescript-etw/index.js'),
    fs.readFileSync(injected));
  for(const args of modes){const r=invoke(args,input);
    assert.equal(r.status,2);assert.match(r.stderr,/direct-typescript-implementation-unreviewed/);
    assert.equal(r.stdout,'');assert(!fs.existsSync(marker),'default loader addition ran');}
});

test('macOS guarded and full decisions agree for content, membership, resolution and caller changes',
  {skip:process.platform!=='darwin'},async t=>{
  const {root,fast,full,fixtures}=fixture(t);
  for(const f of fixtures){call(f,['start']);call(f,['run','typecheck']);const initial=await settled(f);
    assert(initial.reuse_eligible,JSON.stringify(initial));}
  const ids=fixtures.map(f=>row(f).invocation.runId);
  const compare=async(expected,extra)=>{const rows=extra?fixtures.map(f=>row(f,extra)):await Promise.all(fixtures.map(settled));
    assert.deepEqual(semantic(rows[0]),semantic(rows[1]));
    assert.equal(rows[0].freshness,expected,JSON.stringify(rows));
    rows.forEach((r,i)=>assert.equal(r.invocation.runId,ids[i]));return rows;};
  await compare('CURRENT');const before=(await control(fast,'metrics')).metrics;
  await compare('CURRENT');assert((await control(fast,'metrics')).metrics.probeReuses>before.probeReuses);
  assert.equal((await control(full,'metrics')).metrics.probeReuses||0,0);
  put(path.join(root,'notes.md'),'unrelated');await compare('CURRENT');
  const source=path.join(root,'src/main.ts'),original=fs.readFileSync(source);
  fs.appendFileSync(source,'\nexport const added = 2;');await compare('STALE');fs.writeFileSync(source,original);await compare('CURRENT');
  const added=path.join(root,'src/new.ts');put(added,'export const n=1;');await compare('STALE');
  fs.renameSync(added,path.join(root,'src/renamed.ts'));await compare('STALE');fs.unlinkSync(path.join(root,'src/renamed.ts'));await compare('CURRENT');
  fs.renameSync(source,source+'.moved');await compare('STALE');fs.renameSync(source+'.moved',source);await compare('CURRENT');
  const config=path.join(root,'tsconfig.json'),oldConfig=fs.readFileSync(config);
  put(config,JSON.stringify({compilerOptions:{noEmit:true,strict:false},include:['src/**/*.ts'],exclude:['src/new.ts']}));
  await compare('STALE');fs.writeFileSync(config,oldConfig);await compare('CURRENT');
  const optional=path.join(root,'node_modules/optional/index.d.ts');put(optional,'export const x: number;');await compare('STALE');
  // A separate alias changes project-visible installed bytes without a lockfile edit.
  const alias=path.join(path.dirname(root),'declaration-alias');fs.linkSync(optional,alias);
  put(alias,'export const x: string;');assert.equal(fs.readFileSync(optional,'utf8'),'export const x: string;');await compare('STALE');
  fs.rmSync(path.dirname(optional),{recursive:true});fs.unlinkSync(alias);await compare('CURRENT');
  const compiler=path.join(root,'node_modules/typescript/lib/tsc.js'),bytes=fs.readFileSync(compiler);
  fs.appendFileSync(compiler,'\n');const unsupported=await compare('UNVERIFIED');assert(!unsupported[0].reuse_eligible);
  fs.writeFileSync(compiler,bytes);await compare('CURRENT');
  await compare('STALE',{NODE_ENV:'production'});
  const preload=fixtures.map(f=>row(f,{NODE_OPTIONS:'--trace-warnings'}));assert(preload.every(r=>!r.reuse_eligible));
  await compare('CURRENT',{npm_config_proxy:'http://localhost:12345'});
  // Certificate reuse cannot hide a newer persisted outcome without reload.
  for(const f of fixtures){const receipt=structuredClone(readReceipts(f.state).checks.typecheck);
    receipt.result='FAIL';receipt.invocation.runId=randomUUID();receipt.invocation.status='exited';
    const lock=acquireRunLock(f.state);try{commitReceipt(f.state,'typecheck',receipt);}finally{lock.release();}}
  for(const f of fixtures){const r=row(f);assert.equal(r.result,'FAIL');assert(!r.reuse_eligible);}
  for(const f of fixtures){put(path.join(f.state,'receipt-selection-pending-v1.json'),'{');
    const r=row(f);assert.equal(r.freshness,'UNVERIFIED');assert(!r.reuse_eligible);}
});

test('macOS gap, missed edit, failed reconciliation and restart cannot retain a green certificate',
  {skip:process.platform!=='darwin'},async t=>{
  const {fast:f,root}=fixture(t);f.env.VSTATE_HISTORY_TIMEOUT_MS='300';
  call(f,['start']);call(f,['run','typecheck']);const baseline=row(f),id=baseline.invocation.runId;
  assert.equal(baseline.freshness,'CURRENT',JSON.stringify({baseline,receipt:readReceipts(f.state).checks.typecheck.checkpoint}));
  put(path.join(f.state,'reconcile-fault'),'1');put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  put(path.join(f.state,'drop-events'),'1');put(path.join(root,'src/added.ts'),'export const changed=1;');
  assert.equal(row(f).freshness,'UNVERIFIED');fs.unlinkSync(path.join(f.state,'reconcile-fault'));
  let changed;for(let i=0;i<25;i++){changed=row(f);if(changed.freshness==='STALE')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(changed.freshness,'STALE',JSON.stringify(changed));assert.equal(changed.invocation.runId,id);
  fs.unlinkSync(path.join(root,'src/added.ts'));assert.equal(row(f).freshness,'CURRENT');
  const before=(await control(f,'metrics')).metrics.probeReuses||0;row(f);
  assert.equal((await control(f,'metrics')).metrics.probeReuses||0,before,'disabled history must not reuse mac certificate');
  call(f,['stop']);fs.unlinkSync(path.join(f.state,'history-fault'));fs.unlinkSync(path.join(f.state,'drop-events'));
  call(f,['start']);assert.equal(row(f).invocation.runId,id);const metrics=await control(f,'metrics');
  assert(metrics.metrics.fullProbes>=1,'restart requires fresh discovery certificate');
  const old=root+'-old';fs.renameSync(root,old);fs.cpSync(old,root,{recursive:true});
  const result=await settled(f);assert.equal(result.invocation.runId,id);assert.equal(result.freshness,'CURRENT');
});

test('macOS post-probe continuity barrier observes an edit queued during validation',
  {skip:process.platform!=='darwin'},async t=>{
  const {fast:f,root}=fixture(t),signal=path.join(f.state,'probe-signal');
  f.env.VSTATE_TEST_MAC_PROBE_SIGNAL=signal;call(f,['start']);call(f,['run','typecheck']);assert(row(f).reuse_eligible);
  fs.rmSync(signal,{force:true});
  const child=spawn(process.execPath,[cli,'--state-dir',f.state,'status','--sync','--json'],{cwd:root,env:f.env});
  let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
  const done=new Promise(resolve=>child.on('exit',resolve));
  for(let n=0;n<200&&!fs.existsSync(signal);n++)await new Promise(r=>setTimeout(r,10));
  assert(fs.existsSync(signal));put(path.join(root,'src/queued.ts'),'export const q=1;');
  assert.equal(await done,0,stderr);assert.equal(JSON.parse(stdout).checks[0].reuse_eligible,false);
});

test('certificate input is bounded, handles chunked delivery, and validates after EOF',async t=>{
 const f=fixture(t).fast;
 const full=spawnSync(process.execPath,[probe,f.root,'typecheck','--redue-checkpoint'],{cwd:f.root,env:f.env,encoding:'utf8',timeout:15000});
 assert.equal(full.status,0,full.stderr);const c=JSON.parse(full.stdout);
 const certificate=JSON.stringify({schema:1,context:c.context,queries:JSON.parse(inflateSync(Buffer.from(c.queryData,'base64')))});
 async function stream(input,mutate){
  const child=spawn(process.execPath,[probe,f.root,'typecheck','--redue-validate-queries'],{cwd:f.root,env:f.env});
  let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.stdin.on('error',()=>{});
  const done=new Promise(resolve=>child.once('exit',code=>resolve({code,stdout,stderr})));
  const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
  for(let offset=0;offset<input.length;offset+=4096){child.stdin.write(input.slice(offset,offset+4096));await new Promise(r=>setImmediate(r));}
  if(mutate)mutate();child.stdin.end();const result=await done;clearTimeout(timer);return result;
 }
 const good=await stream(certificate);assert.equal(good.code,0,good.stderr);assert.equal(good.stdout,c.context);
 const changed=await stream(certificate,()=>put(path.join(f.root,'src/main.ts'),'export const changed=1;'));
 assert.equal(changed.code,2);assert.equal(changed.stdout,'');
 const malformed=await stream('{');assert.equal(malformed.code,2);
 const oversized=await stream(' '.repeat(8*1024*1024+1));assert.equal(oversized.code,2);
});

test('newer failed selection during delayed response remains authoritative',
 {skip:process.platform!=='darwin'},async t=>{
 const {fast:f}=fixture(t),signal=path.join(f.state,'probe-signal');
 f.env.VSTATE_TEST_MAC_PROBE_SIGNAL=signal;call(f,['start']);call(f,['run','typecheck']);assert(row(f).reuse_eligible);
 fs.rmSync(signal,{force:true});
 const child=spawn(process.execPath,[cli,'--state-dir',f.state,'status','--sync','--json'],{cwd:f.root,env:f.env});
 let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
 const done=new Promise(resolve=>child.once('exit',resolve));
 for(let n=0;n<200&&!fs.existsSync(signal);n++)await new Promise(r=>setTimeout(r,10));assert(fs.existsSync(signal));
 const failed=structuredClone(readReceipts(f.state).checks.typecheck);failed.result='FAIL';failed.invocation.runId=randomUUID();
 const lock=acquireRunLock(f.state);try{commitReceipt(f.state,'typecheck',failed);}finally{lock.release();}
 assert.equal(await done,0,stderr);const visible=JSON.parse(stdout).checks[0];
 assert.equal(visible.result,'FAIL');assert.equal(visible.invocation.runId,failed.invocation.runId);assert.equal(visible.reuse_eligible,false);
});

test('caller run certificates bind check, plan, probe, implementation and retained queries',
 {skip:process.platform!=='darwin'},async t=>{
 const {fast:f,root}=fixture(t);call(f,['start']);
 const value=await control(f,{action:'snapshot',name:'typecheck',runCertificate:1});
 const snapshot=value.snapshots.typecheck;assert(snapshot.discoveryCertificate);
 const plan=JSON.parse(fs.readFileSync(path.join(f.state,'plans-v1.json'))).plans.typecheck;
 const selected=JSON.parse(fs.readFileSync(path.join(f.state,'project-runtime-v1.json'))).checks.find(c=>c.name==='typecheck');
 const helper=pathToFileURL(path.resolve('src/direct-run-certificate.mjs')).href;
 const invoke=(snap=snapshot,p=plan,s=selected,extra={})=>{
   const code=`import fs from 'node:fs';import {validateDirectRunCertificate as validate} from ${JSON.stringify(helper)};const [p,s,c]=JSON.parse(fs.readFileSync(0));console.log(JSON.stringify(validate(p,s,c)));`;
   const r=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:root,env:{...f.env,...extra},
     input:JSON.stringify([p,s,snap]),encoding:'utf8',timeout:15000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
 };
 assert.equal(invoke(),snapshot.probeHash);
 for(const change of [null,{schema:0},{planId:'other-check'},{cwd:root+'/other'},
   {queryData:'invalid'},{queryData:'x'.repeat(512*1024+1)},{context:'0'.repeat(64)},
   {output:'0'.repeat(64)},{probeDefinition:'0'.repeat(64)}]){
   const s=structuredClone(snapshot);s.discoveryCertificate=change?{...s.discoveryCertificate,...change}:null;
   assert.equal(invoke(s),null);
 }
 assert.equal(invoke(snapshot,{...plan,id:'another-plan'}),null);
 assert.equal(invoke(snapshot,plan,{...selected,qualification:'explicit'}),null);
 assert.equal(invoke(snapshot,plan,selected,{TS_ETW_MODULE_PATH:''}),null);
 assert.equal(invoke(snapshot,plan,selected,{NODE_OPTIONS:'--trace-warnings'}),null);
 const added=path.join(root,'src/new.ts');put(added,'export const added=1;');assert.equal(invoke(),null);fs.unlinkSync(added);
 const optional=path.join(root,'node_modules/optional/index.d.ts');put(optional,'export const x: number;');assert.equal(invoke(),null);fs.rmSync(path.dirname(optional),{recursive:true});
 put(path.join(root,'node_modules/typescript/lib/typescript.js'),'throw Error("must not load");');assert.equal(invoke(),null);
});

test('wrapped guarded and full paths execute real compiler outcomes with current boundaries',
 {skip:process.platform!=='darwin'},async t=>{
 const {fixtures,root}=fixture(t);
 for(const f of fixtures){f.env.REDUE_DECISION_PROFILE='1';f.env.REDUE_DECISION_PROFILE_FILE=f.state+'-run-profile';call(f,['start']);
   // No prior receipt: a discovery certificate cannot stand in for execution.
   assert.equal(row(f).result,null);call(f,['run','typecheck']);assert(row(f).reuse_eligible);}
 const first=fixtures.map(f=>row(f).invocation.runId);
 for(const f of fixtures){call(f,['run','typecheck']);assert(row(f).reuse_eligible);}
 fixtures.forEach((f,i)=>assert.notEqual(row(f).invocation.runId,first[i]));
 const records=f=>fs.readFileSync(f.env.REDUE_DECISION_PROFILE_FILE,'utf8').split('\n').filter(l=>l.startsWith('REDUE_TIMING ')).map(l=>JSON.parse(l.slice(13)));
 assert(records(fixtures[0]).filter(p=>p.phase==='cli.run_certificate'&&p.outcome==='reused').length>=4);
 assert.equal(records(fixtures[1]).filter(p=>p.phase==='cli.run_certificate'&&p.outcome==='reused').length,0);
 put(path.join(root,'src/error.ts'),'export const value: number = "bad";');
 for(const f of fixtures){const r=spawnSync(process.execPath,[cli,'--state-dir',f.state,'run','typecheck'],{cwd:root,env:f.env,encoding:'utf8',timeout:45000});assert.equal(r.status,2,r.stderr+r.stdout);
   const failed=await settled(f);assert.equal(failed.result,'FAIL');assert(!failed.reuse_eligible);}
 fs.unlinkSync(path.join(root,'src/error.ts'));
 for(const f of fixtures){call(f,['run','typecheck']);assert(row(f).reuse_eligible);call(f,['stop']);
   call(f,['run','typecheck']);const receipt=readReceipts(f.state).checks.typecheck;assert.equal(receipt.result,'PASS');assert(!receipt.stable);}
});

test('wrapped start, launch and post-exit edits or observer loss cannot record eligible PASS',
 {skip:process.platform!=='darwin'},async t=>{
 const {fast:f,root}=fixture(t);call(f,['start']);call(f,['run','typecheck']);
 const source=path.join(root,'src/main.ts'),original=fs.readFileSync(source);
 for(const [phase,kind] of [['after-start-checkpoint','restore'],['before-launch','membership'],['before-launch','root'],
   ['after-exit','source'],['after-exit','stop']]){
   call(f,['run','typecheck']);assert(row(f).reuse_eligible);
   const paused=path.join(f.state,'test-run-paused'),release=path.join(f.state,'test-run-release');
   fs.rmSync(paused,{force:true});fs.rmSync(release,{force:true});
   const child=spawn(process.execPath,[cli,'--state-dir',f.state,'run','typecheck'],{cwd:root,env:{...f.env,VSTATE_TEST_RUN_BOUNDARY:phase}});
   let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
   const done=new Promise(resolve=>child.once('exit',resolve));
   for(let i=0;i<400&&!fs.existsSync(paused);i++)await new Promise(resolve=>setTimeout(resolve,10));
   assert(fs.existsSync(paused),output);
   if(kind==='restore'){fs.appendFileSync(source,'\n// changed and restored\n');await control(f,'sync');fs.writeFileSync(source,original);}
   if(kind==='membership')put(path.join(root,'src/boundary-new.ts'),'export const n=1;');
   if(kind==='source')fs.appendFileSync(source,'\n// after compiler exit\n');
   if(kind==='root'){fs.renameSync(root,root+'-replaced');fs.cpSync(root+'-replaced',root,{recursive:true});}
   if(kind==='stop')call(f,['stop']);
   put(release,'continue');assert.equal(await done,0,output);
   const receipt=readReceipts(f.state).checks.typecheck;assert.equal(receipt.result,'PASS');assert(!receipt.stable,JSON.stringify(receipt.checkpoint));
   if(kind==='stop')call(f,['start']);
   fs.writeFileSync(source,original);fs.rmSync(path.join(root,'src/boundary-new.ts'),{force:true});
 }
});

test('actual compiler interval changes and cancellation retain execution and observation semantics',
 {skip:process.platform!=='darwin'},async t=>{
 const {fast:f,root}=fixture(t);call(f,['start']);call(f,['run','typecheck']);
 const source=path.join(root,'src/main.ts'),original=fs.readFileSync(source);
 const trace=f.state+'-running-profile';
 const child=spawn(process.execPath,[cli,'--state-dir',f.state,'run','typecheck'],{cwd:root,
   env:{...f.env,REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:trace}});
 let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const done=new Promise(resolve=>child.once('exit',resolve));let started;
 for(let i=0;i<500&&!started;i++){
   if(fs.existsSync(trace))started=fs.readFileSync(trace,'utf8').split('\n').filter(l=>l.startsWith('REDUE_TIMING ')).map(l=>JSON.parse(l.slice(13))).find(p=>p.phase==='cli.child_started');
   if(!started)await new Promise(resolve=>setTimeout(resolve,10));
 }
 assert(started,output);process.kill(started.childPid,0);
 fs.appendFileSync(source,'\n// changed during real compiler execution\n');await control(f,'sync');fs.writeFileSync(source,original);
 assert.equal(await done,0,output);const receipt=readReceipts(f.state).checks.typecheck;
 assert.equal(receipt.result,'PASS');assert(!receipt.stable,JSON.stringify(receipt.checkpoint));
 const paused=path.join(f.state,'test-run-paused'),release=path.join(f.state,'test-run-release');
 const cancelled=spawn(process.execPath,[cli,'--state-dir',f.state,'run','typecheck'],{cwd:root,
   env:{...f.env,VSTATE_TEST_RUN_BOUNDARY:'before-launch'}});
 cancelled.stdout.resume();cancelled.stderr.resume();const stopped=new Promise(resolve=>cancelled.once('exit',resolve));
 for(let i=0;i<500&&!fs.existsSync(paused);i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert(fs.existsSync(paused));cancelled.kill('SIGINT');await new Promise(resolve=>setTimeout(resolve,30));put(release,'continue');
 assert.equal(await stopped,130);const interrupted=readReceipts(f.state).checks.typecheck;
 assert.equal(interrupted.invocation.status,'interrupted');assert.equal(interrupted.result,null);assert(!row(f).reuse_eligible);
 assert(!fs.existsSync(path.join(f.state,'run.lock')));
});
