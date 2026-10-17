import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runRecordIssue} from '../src/direct-run-certificate.mjs';
import {directContextHash} from '../src/direct-typescript.mjs';
import {readReceipts} from '../src/state-store.mjs';

const digest=text=>createHash('sha256').update(JSON.stringify(text)).digest('hex');
const tsRoot=path.resolve('/project/node_modules/typescript'),entry=path.join(tsRoot,'lib/tsc.js');
const node=['/usr/bin/node','v22.0.0'],compiler={tsRoot,entry,digest:'d'.repeat(64)};
const file=name=>path.resolve('/project',name);
const certificate={compiler,context:directContextHash(compiler,node),queries:[
  ['readFile',file('tsconfig.json'),digest('{}')],
  ['readFile',file('src/main.ts'),digest('export {};')],
  ['fileExists',file('src/main.d.ts'),null],
  ['fileExists',file('src/main.ts'),true],
  ['directoryExists',file('node_modules/@types'),null],
  ['directoryExists',path.resolve('/node_modules/@types'),null],
  ['realpath',file('src'),file('src')],
  ['listing',file('src'),[['main.ts','f']],{extensions:['.ts']}],
]};
const record=(...facts)=>({schema:1,node,main:entry,unsupported:null,conflict:null,facts:[
  ['stat',file('tsconfig.json'),'f'],['read',file('tsconfig.json'),digest('{}')],
  ['readdir',file('src'),[['main.ts','f'],['notes.md','f']]],['realpath',file('src'),file('src')],
  ['read',file('src/main.ts'),digest('export {};')],['stat',file('src/main.d.ts'),null],
  ['stat',path.resolve('/node_modules/@types'),null],
  ['read',path.join(tsRoot,'lib/lib.d.ts'),digest('lib')],['stat',entry.toUpperCase(),null],...facts]});

test('a record whose answers all agree with the certificate is accepted',()=>{
  assert.equal(runRecordIssue(record(),certificate),null);
});

test('changed, missing, uncovered or unsupported answers are rejected',()=>{
  const reject=(value,pattern)=>assert.match(runRecordIssue(value,certificate)||'',pattern);
  reject(record(['read',file('src/main.ts'),digest('export const changed=1;')]),/differs/);
  const changed=record();changed.facts[4]=['read',file('src/main.ts'),digest('changed')];
  reject(changed,/read .*main\.ts differs/);
  reject(record(['stat',path.resolve('/node_modules/@types'),'d']),/differs/);
  reject(record(['stat',file('src/main.d.ts'),'f']),/differs/);
  reject(record(['readdir',file('src'),[['main.ts','f'],['new.ts','f']]]),/differs/);
  reject(record(['read',file('src/other.ts'),digest('x')]),/not in the discovery certificate/);
  reject(record(['realpath',file('lib'),file('lib')]),/not in the discovery certificate/);
  reject({...record(),unsupported:'writeFileSync'},/unsupported writeFileSync/);
  reject({...record(),conflict:'read /project/src/main.ts'},/answer changed during the run/);
  reject({...record(),node:['/usr/bin/node','v24.0.0']},/execution context changed/);
  reject({...record(),main:file('other.js')},/execution context changed/);
  reject(null,/record unavailable/);
  reject({...record(),facts:[['open',file('x'),null]]},/unknown answer/);
});

test('a stat is checked against every fact about its path, including its parent listing',()=>{
  // fileExists true and a listed .ts file both mean a regular file.
  assert.equal(runRecordIssue(record(['stat',file('src/main.ts'),'f']),certificate),null);
  assert.match(runRecordIssue(record(['stat',file('src/main.ts'),'d']),certificate),/differs/);
  // A listing that does not name the path rules answers out but is not cover.
  assert.match(runRecordIssue(record(['stat',file('src/extra.ts'),'f']),certificate),/differs/);
  assert.match(runRecordIssue(record(['stat',file('src/extra.ts'),null]),certificate),/not in the discovery certificate/);
  assert.match(runRecordIssue(record(['stat',file('src/package.json'),'f']),certificate),/not in the discovery certificate/);
});

test('only the exact compiler tree and the case-swapped entry stat are exempt',()=>{
  assert.equal(runRecordIssue(record(['read',path.join(tsRoot,'lib/other.d.ts'),digest('x')]),certificate),null);
  // Windows paths compare case-insensitively, so there the variant is the same tree.
  const variant=path.join(path.dirname(tsRoot),'TypeScript','lib/lib.d.ts');
  const issue=runRecordIssue(record(['read',variant,digest('lib')]),certificate);
  if(process.platform==='win32')assert.equal(issue,null);
  else assert.match(issue,/not in the discovery certificate/);
});

// Integration: the real compiler, through redue run, on a project with errors.
const cli=path.resolve('bin/redue.mjs'),unix={skip:process.platform==='win32'};
const put=(target,value)=>{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rr-'))),root=path.join(base,'project'),
    state=path.join(base,'redue-state'),profile=path.join(base,'profile');
  put(path.join(root,'package.json'),JSON.stringify({name:'recorded-fixture',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
  put(path.join(root,'package-lock.json'),'{"lockfileVersion":3}');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'import {other} from "./other";\nexport const value: number = other;\n');
  put(path.join(root,'src/other.ts'),'export const other = 2;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.cpSync(path.resolve('node_modules',process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript'),
    path.join(root,'node_modules/typescript'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^npm_config_/i.test(k)&&
    !['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(k))),VSTATE_TEST_FAULTS:'1',
    VSTATE_START_READY_WAIT_MS:'10000',REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:profile,
    VSTATE_TEST_DROP_EVENTS_FILE:path.join(state,'drop-events')};
  const f={base,root,state,profile,env};call(f,['init','--recipe','typescript-direct']);
  t.after(()=>{try{call(f,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true});});
  return f;
}
const invoke=(f,args,env={})=>spawnSync(process.execPath,[cli,'--state-dir',f.state,...args],
  {cwd:f.root,env:{...f.env,...env},encoding:'utf8',timeout:45000});
function call(f,args){const r=invoke(f,args);assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;}
const receipt=f=>readReceipts(f.state).checks.typecheck;
const marks=f=>fs.readFileSync(f.profile,'utf8').split('\n').filter(l=>l.startsWith('REDUE_TIMING '))
  .map(l=>JSON.parse(l.slice(13)));
async function paused(f,phase){
  for(const name of ['test-run-paused','test-run-release'])fs.rmSync(path.join(f.state,name),{force:true});
  const child=spawn(process.execPath,[cli,'--state-dir',f.state,'run','typecheck'],{cwd:f.root,
    env:{...f.env,VSTATE_TEST_RUN_BOUNDARY:phase}});
  let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const done=new Promise(resolve=>child.once('exit',code=>resolve({code,output})));
  for(let i=0;i<400&&!fs.existsSync(path.join(f.state,'test-run-paused'));i++)await new Promise(r=>setTimeout(r,10));
  assert(fs.existsSync(path.join(f.state,'test-run-paused')),output);
  return {release(){put(path.join(f.state,'test-run-release'),'continue');return done;}};
}

test('recorded runs keep tsc output and exit code, and replace both probes',unix,t=>{
  const f=fixture(t);call(f,['start']);
  const tsc=path.join(f.root,'node_modules/typescript',
    JSON.parse(fs.readFileSync(path.join(f.root,'node_modules/typescript/package.json'))).version==='5.9.3'?'lib/_tsc.js':'lib/tsc.js');
  for(const [source,exit] of [['export const value: number = other;\n',0],
    ['export const value: string = other;\nexport const missing: number = undefinedName;\n',2]]){
    put(path.join(f.root,'src/main.ts'),'import {other} from "./other";\n'+source);
    const plain=spawnSync(process.execPath,[tsc,'--noEmit'],{cwd:f.root,env:f.env,encoding:'utf8',timeout:45000});
    assert.equal(plain.status,exit,plain.stdout+plain.stderr);
    if(exit)assert.match(plain.stdout,/error TS2322[\s\S]*error TS2552/);
    call(f,['status','--sync','--json']);
    const offset=fs.existsSync(f.profile)?marks(f).length:0;
    const run=invoke(f,['run','typecheck','--json']);
    const summary=run.stdout.trimEnd().split('\n').pop();
    assert.equal(run.stdout.slice(0,run.stdout.length-summary.length-1),plain.stdout);
    assert.equal(run.stderr,plain.stderr);assert.equal(run.status,plain.status);
    assert.equal(JSON.parse(summary).result,exit?'FAIL':'PASS');
    const r=receipt(f);assert(r.stable,JSON.stringify(r.checkpoint));assert.equal(r.invocation.exitCode,exit);
    const used=marks(f).slice(offset);
    assert.equal(used.filter(p=>p.phase==='cli.run_recording'&&p.outcome==='validated').length,1,JSON.stringify(used.filter(p=>p.phase==='cli.run_recording')));
    assert.equal(used.filter(p=>p.phase==='cli.probe').length,0);
  }
});

test('an edit after the start checkpoint is caught by the record even when events are missed',unix,async t=>{
  const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);assert(receipt(f).stable);
  const run=await paused(f,'before-launch');
  put(path.join(f.state,'drop-events'),'1');
  fs.appendFileSync(path.join(f.root,'src/other.ts'),'export const later = 3;\n');
  const {code,output}=await run.release();assert.equal(code,0,output);
  const r=receipt(f);assert.equal(r.result,'PASS');assert(!r.stable);
  assert.match(r.checkpoint.issues.join(';'),/compiler inputs differ from discovery certificate \(read .*other\.ts differs/);
});

test('a compiler file changed during the run makes the receipt non-reusable',unix,async t=>{
  const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);assert(receipt(f).stable);
  const run=await paused(f,'before-launch');
  // Compiler-tree reads are not in the record; the daemon's toolchain identity covers them.
  put(path.join(f.state,'drop-events'),'1');
  fs.appendFileSync(path.join(f.root,'node_modules/typescript/lib/lib.es5.d.ts'),'\ndeclare const substituted: number;\n');
  const {code,output}=await run.release();assert.equal(code,0,output);
  const r=receipt(f);assert(!r.stable);
  assert.match(r.checkpoint.issues.join(';'),/declared state probe unavailable or changed/);
});

test('a lookup outside the checkout that appears during the run makes the receipt non-reusable',unix,async t=>{
  const f=fixture(t);call(f,['start']);call(f,['run','typecheck']);assert(receipt(f).stable);
  const run=await paused(f,'before-launch');
  // The compiler looks for ancestor node_modules/@types; the watcher does not see this path.
  put(path.join(f.base,'node_modules/@types/extra/index.d.ts'),'declare const extraGlobal: number;\n');
  const {code,output}=await run.release();assert.equal(code,0,output);
  const r=receipt(f);assert(!r.stable);
  assert.match(r.checkpoint.issues.join(';'),/compiler inputs differ from discovery certificate \(.*node_modules/);
  fs.rmSync(path.join(f.base,'node_modules'),{recursive:true});
});
