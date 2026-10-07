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
  fs.cpSync(path.resolve('node_modules/typescript'),path.join(root,'node_modules/typescript'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const fixtures=[false,true].map(full=>{const state=path.join(base,full?'redue-r':'redue-f');
    return {root,state,env:{...cleanEnv(),VSTATE_START_READY_WAIT_MS:'10000',VSTATE_TEST_FAULTS:'1',
      ...(full?{VSTATE_TEST_FULL_PROBES:'1'}:{}),VSTATE_HISTORY_TIMEOUT_MS:'300',
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
  c.on('connect',()=>c.write(JSON.stringify({action})+'\n'));c.on('data',b=>data+=b);
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

test('macOS guarded and full decisions agree for content, membership, resolution and caller changes',
  {skip:process.platform!=='darwin'},async t=>{
  const {root,fast,full,fixtures}=fixture(t);
  for(const f of fixtures){call(f,['start']);call(f,['run','typecheck']);assert(row(f).reuse_eligible);}
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
  const {fast:f,root}=fixture(t);call(f,['start']);call(f,['run','typecheck']);const id=row(f).invocation.runId;
  put(path.join(f.state,'reconcile-fault'),'1');put(path.join(f.state,'history-fault'),'fail');
  assert.equal(row(f).freshness,'UNVERIFIED');
  put(path.join(f.state,'drop-events'),'1');put(path.join(root,'src/added.ts'),'export const changed=1;');
  assert.equal(row(f).freshness,'UNVERIFIED');fs.unlinkSync(path.join(f.state,'reconcile-fault'));
  let changed;for(let i=0;i<25;i++){changed=row(f);if(changed.freshness==='STALE')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(changed.freshness,'STALE');assert.equal(changed.invocation.runId,id);
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
