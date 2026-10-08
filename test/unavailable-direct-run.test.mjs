import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import net from 'node:net';import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {readReceipts,readReceiptSnapshot} from '../src/state-store.mjs';import {controlEndpoint} from '../src/control-endpoint.mjs';
const bin=path.resolve(process.env.REDUE_UNAVAILABLE_TEST_BIN||'bin/redue.mjs'),mac={skip:process.platform!=='darwin'};
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function fixture(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'ru-'))),root=path.join(base,'project'),state=path.join(base,'redue-state'),profile=path.join(base,'profile');
 put(path.join(root,'package.json'),JSON.stringify({name:'owned-fixture',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));put(path.join(root,'package-lock.json'),'{"lockfileVersion":3}');
 put(path.join(root,'tsconfig.json'),'{"compilerOptions":{"strict":true,"noEmit":true},"include":["src"]}');put(path.join(root,'src/main.ts'),'export const value: number = 1;\n');
 fs.cpSync(path.resolve('node_modules/typescript'),path.join(root,'node_modules/typescript'),{recursive:true});execFileSync('git',['init','-q'],{cwd:root});put(path.join(root,'.gitignore'),'node_modules/\n');
 const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^npm_config_/i.test(k)&&!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(k))),VSTATE_TEST_FAULTS:'1',VSTATE_START_READY_WAIT_MS:'10000',REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:profile};
 const f={base,root,state,profile,env};call(f,['init','--recipe','typescript-direct']);t.after(()=>{try{call(f,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true});});return f;
}
function invoke(f,args,env={}){return spawnSync(process.execPath,[bin,'--state-dir',f.state,...args],{cwd:f.root,env:{...f.env,...env},encoding:'utf8',timeout:45000});}
function call(f,args,env={}){const r=invoke(f,args,env);assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;}
const receipt=f=>readReceipts(f.state).checks.typecheck;
const row=f=>JSON.parse(call(f,['status','--sync','--json'])).checks[0];
const marks=f=>fs.readFileSync(f.profile,'utf8').split('\n').filter(l=>l.startsWith('REDUE_TIMING ')).map(l=>JSON.parse(l.slice(13)));
function evidence(f,r,result){assert.equal(r.result,result);assert.equal(r.stable,false);assert.equal(r.checkpoint.endRevision,null);assert.match(r.checkpoint.issues.join(';'),/not performed: no healthy start checkpoint/);assert.equal(r.coverage.qualified,true);const selected=row(f);assert.equal(selected.invocation.runId,r.invocation.runId);assert(!selected.reuse_eligible);assert.notEqual(selected.freshness,'CURRENT');}
function launched(f,extra={}){const child=spawn(process.execPath,[bin,'--state-dir',f.state,'run','typecheck'],{cwd:f.root,env:{...f.env,...extra}});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);const done=new Promise(resolve=>child.once('exit',code=>resolve({code,output})));return {child,done};}
async function paused(f,phase){for(const file of ['test-run-paused','test-run-release'])fs.rmSync(path.join(f.state,file),{force:true});const run=launched(f,{VSTATE_TEST_RUN_BOUNDARY:phase});for(let i=0;i<400&&!fs.existsSync(path.join(f.state,'test-run-paused'));i++)await new Promise(r=>setTimeout(r,10));assert(fs.existsSync(path.join(f.state,'test-run-paused')));return run;}
const release=f=>put(path.join(f.state,'test-run-release'),'continue');
const control=(f,message)=>new Promise((resolve,reject)=>{const c=net.createConnection(controlEndpoint(f.state).address);let data='';c.on('connect',()=>c.write(JSON.stringify(message)+'\n'));c.on('data',b=>data+=b);c.on('end',()=>{try{resolve(JSON.parse(data));}catch(e){reject(e);}});c.on('error',reject);});
function assertSkipped(f,offset){const p=marks(f).slice(offset);assert.equal(p.filter(p=>p.phase==='cli.run_validation_skipped').length,1);assert.equal(p.filter(p=>['cli.probe','cli.run_certificate','cli.end_checkpoint'].includes(p.phase)).length,0);}

test('unavailable direct recording omits qualification work, selects real PASS/FAIL and never recovers old green',mac,t=>{
 const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);const first=receipt(f);assert(row(f).reuse_eligible);call(f,['stop']);
 for(const result of ['PASS','FAIL']){put(path.join(f.root,'src/main.ts'),result==='PASS'?'export const value: number = 1;':'export const value: number = "bad";');const offset=marks(f).length,r=invoke(f,['run','typecheck']);assert.equal(r.status,result==='PASS'?0:2,r.stderr+r.stdout);const selected=receipt(f);assert.notEqual(selected.invocation.runId,first.invocation.runId);assert.equal(selected.invocation.status,'exited');assert.equal(selected.invocation.exitCode,result==='PASS'?0:2);assertSkipped(f,offset);
  const cached=JSON.parse(call(f,['status','--json'])).checks[0];assert.equal(cached.invocation.runId,selected.invocation.runId);assert(!cached.reuse_eligible);
  call(f,['start']);evidence(f,selected,result);call(f,['stop']);call(f,['start']);evidence(f,selected,result);call(f,['stop']);}
 put(path.join(f.root,'src/main.ts'),'export const value: number = 1;');call(f,['start']);call(f,['run','typecheck']);assert(row(f).reuse_eligible);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.state,'runs-v1',first.invocation.runId+'.json'))).receipt,first);
});

test('healthy certificates reuse and missing certificates still force full caller validation',mac,async t=>{
 const f=fixture(t);call(f,['start']);let offset=marks(f).length;call(f,['run','typecheck']);assert(row(f).reuse_eligible);assert.equal(marks(f).slice(offset).filter(p=>p.phase==='cli.run_certificate'&&p.outcome==='reused').length,2);
 const snapshot=await control(f,{action:'snapshot',name:'typecheck',runCertificate:1});assert(snapshot.snapshots.typecheck.observationHealthy);delete snapshot.snapshots.typecheck.discoveryCertificate;call(f,['stop']);
 // Controlled response fixture for a healthy older observer without a certificate.
 const actions=[],server=net.createServer(c=>{let data='';c.on('data',b=>{data+=b;if(!data.includes('\n'))return;const m=JSON.parse(data);actions.push(m.action);c.end(JSON.stringify(m.action==='snapshot'?snapshot:{ok:true})+'\n');});});await new Promise(r=>server.listen(controlEndpoint(f.state).address,r));
 try{offset=marks(f).length;const r=await launched(f).done;assert.equal(r.code,0,r.output);const p=marks(f).slice(offset);assert.equal(p.filter(p=>p.phase==='cli.probe').length,2);assert.equal(p.filter(p=>p.phase==='cli.run_validation_skipped').length,0);assert.equal(actions.filter(a=>a==='snapshot').length,2);}finally{await new Promise(r=>server.close(r));}
});

test('failed or unhealthy starting response cannot be repaired by later healthy responses',mac,async t=>{
 const f=fixture(t);call(f,['start']);const snapshot=await control(f,{action:'snapshot',name:'typecheck'});call(f,['stop']);
 for(const kind of ['malformed','unhealthy']){const actions=[],server=net.createServer(c=>{let data='';c.on('data',b=>{data+=b;if(!data.includes('\n'))return;const m=JSON.parse(data);actions.push(m.action);if(m.action==='snapshot'&&actions.length===1){if(kind==='malformed')c.end('incomplete{\n');else c.end(JSON.stringify({...snapshot,snapshots:{typecheck:{...snapshot.snapshots.typecheck,observationHealthy:false}}})+'\n');}else c.end(JSON.stringify(snapshot)+'\n');});});await new Promise(r=>server.listen(controlEndpoint(f.state).address,r));
  try{const offset=marks(f).length,r=await launched(f).done;assert.equal(r.code,0,r.output);assertSkipped(f,offset);assert.equal(actions.filter(a=>a==='snapshot').length,1);assert(!receipt(f).stable);}finally{await new Promise(r=>server.close(r));}
  call(f,['start']);evidence(f,receipt(f),'PASS');call(f,['stop']);}
});

test('recovery before launch or after exit and relevant changes cannot repair missing start observation',mac,async t=>{
 const f=fixture(t);call(f,['start']);call(f,['stop']);
 for(const phase of ['after-start-checkpoint','after-exit']){const offset=marks(f).length,r=await paused(f,phase);fs.appendFileSync(path.join(f.root,'src/main.ts'),'\n// changed while non-reusable\n');call(f,['start']);release(f);const done=await r.done;assert.equal(done.code,0,done.output);const own=marks(f).slice(offset).filter(p=>p.phase==='cli.run_validation_skipped');assert.equal(own.length,1);evidence(f,receipt(f),'PASS');call(f,['stop']);}
});

test('observer can recover during the actual compiler process without qualifying its outcome',mac,async t=>{
 const f=fixture(t);call(f,['start']);call(f,['stop']);const offset=marks(f).length,r=launched(f);let started;
 for(let i=0;i<400&&!started;i++){started=marks(f).slice(offset).find(p=>p.phase==='cli.child_started');if(!started)await new Promise(r=>setTimeout(r,10));}assert(started);process.kill(started.childPid,0);
 // Pause only the owned compiler process to place real observer recovery
 // inside its invocation deterministically. This is a race fixture, not timing.
 process.kill(started.childPid,'SIGSTOP');
 try{call(f,['start']);}finally{process.kill(started.childPid,'SIGCONT');}
 const readyAt=Date.now(),done=await r.done;assert.equal(done.code,0,done.output);const selected=receipt(f);assert(readyAt<=selected.invocation.startedAt+selected.invocation.durationMs,'observer recovery must occur during actual execution');evidence(f,selected,'PASS');
});

test('non-reusable start failure, cancellation and incomplete persistence preserve true outcomes and selection',mac,async t=>{
 const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);call(f,['stop']);
 let r=await paused(f,'before-launch');fs.renameSync(f.root,f.root+'-moved');release(f);let done=await r.done;fs.renameSync(f.root+'-moved',f.root);assert.equal(done.code,127,done.output);assert.equal(receipt(f).invocation.status,'start_failed');assert.equal(receipt(f).result,null);assert(!receipt(f).stable);
 r=await paused(f,'before-launch');r.child.kill('SIGINT');await new Promise(r=>setTimeout(r,30));release(f);done=await r.done;assert.equal(done.code,130,done.output);assert.equal(receipt(f).invocation.status,'interrupted');assert(!fs.existsSync(path.join(f.state,'run.lock')));
 const before=receipt(f),offset=marks(f).length;r=await paused(f,'before-launch');const pid=marks(f).slice(offset).find(p=>p.phase==='cli.loaded').pid;const temp=path.join(f.state,`receipts-v1.json.${pid}.tmp`);fs.mkdirSync(temp);release(f);done=await r.done;assert.notEqual(done.code,0);assert.throws(()=>readReceiptSnapshot(f.state),/incomplete/);assert.equal(receipt(f).invocation.runId,before.invocation.runId);fs.rmdirSync(temp);
 call(f,['start']);assert(!row(f).reuse_eligible);call(f,['run','typecheck']);assert(row(f).reuse_eligible);
});

test('ownership and selected configuration errors remain refusals; custom probes keep executing',mac,t=>{
 const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);call(f,['stop']);const old=receipt(f).invocation.runId,config=path.join(f.root,'redue.config.json'),original=fs.readFileSync(config);let c=JSON.parse(original);c.checks[0].inputs.push('extra/**');put(config,JSON.stringify(c));assert.notEqual(invoke(f,['run','typecheck']).status,0);assert.equal(receipt(f).invocation.runId,old);fs.writeFileSync(config,original);
 const owner=path.join(f.state,'vstate-owner-v1.json'),owned=fs.readFileSync(owner);put(owner,'{}');assert.notEqual(invoke(f,['run','typecheck']).status,0);fs.writeFileSync(owner,owned);assert.equal(receipt(f).invocation.runId,old);
 const counter=path.join(f.base,'custom-count');for(const direct of [false,true]){c=JSON.parse(original);if(!direct){delete c.checks[0].qualification;delete c.checks[0].script;c.checks[0].command=['@node','-e','process.exit(0)'];}c.checks[0].probes=[['@node','-e',`require('node:fs').appendFileSync(${JSON.stringify(counter)},'x')`]];put(config,JSON.stringify(c));call(f,['start']);call(f,['stop']);put(counter,'');const offset=marks(f).length;call(f,['run','typecheck']);assert.equal(fs.readFileSync(counter,'utf8'),'xx');assert.equal(marks(f).slice(offset).filter(p=>p.phase==='cli.run_validation_skipped').length,0);assert(!receipt(f).stable);}
});
