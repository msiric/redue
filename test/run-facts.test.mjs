import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {directContextHash} from '../src/direct-typescript.mjs';
import {runRecordIssue} from '../src/direct-run-certificate.mjs';

// With `declaration: true`, tsc's declaration diagnostics resolve every
// dependency in the package.json scope. Building the program, which is all the
// probe does, never makes those lookups. The run's answers become run facts in
// the receipt, and status asks them again before each CURRENT answer.
const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const sourceTypeScript=path.dirname(require.resolve((process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript')+'/package.json'));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
const supported=['darwin','linux'].includes(process.platform);

function fixture(t){
  // A private parent, so lookups in ancestor node_modules are under test control.
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-rf-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-s');
  put(path.join(root,'package.json'),JSON.stringify({name:'run-facts-fixture',version:'1.0.0',type:'module',
    scripts:{typecheck:'tsc --noEmit'},dependencies:{pkg:'1.0.0',ghost:'1.0.0'}}));
  put(path.join(root,'package-lock.json'),'{"name":"run-facts-fixture","lockfileVersion":3}');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true,declaration:true,
    module:'node16',moduleResolution:'node16'},include:['src']}));
  // The inferred type of `value` needs an import path in declarations.
  put(path.join(root,'src/main.ts'),'import {make} from "pkg/thing";\nexport const value = make();\n');
  put(path.join(root,'node_modules/pkg/package.json'),JSON.stringify({name:'pkg',version:'1.0.0',type:'module',
    exports:{'./thing':{types:'./dist/thing.d.ts'},'./inner':{types:'./dist/inner.d.ts'}}}));
  put(path.join(root,'node_modules/pkg/dist/inner.d.ts'),'export interface Inner { a: number }\n');
  put(path.join(root,'node_modules/pkg/dist/thing.d.ts'),
    'import type {Inner} from "./inner.js";\nexport declare function make(): Inner;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.cpSync(sourceTypeScript,path.join(root,'node_modules/typescript'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const env=Object.fromEntries(Object.entries(process.env)
    .filter(([key])=>!/^npm_config_/i.test(key)&&!/^NODE_/i.test(key)));
  const f={base,root,state,env:{...env,VSTATE_START_READY_WAIT_MS:'10000',VSTATE_TEST_FAULTS:'1',
    VSTATE_HISTORY_TIMEOUT_MS:'1000',VSTATE_TEST_HISTORY_FAULT_FILE:path.join(state,'history-fault')}};
  t.after(()=>{try{call(f,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  ok(f,'init','--recipe','typescript-direct');ok(f,'start');
  return f;
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--state-dir',f.state,...args],
  {cwd:f.root,env:f.env,encoding:'utf8',timeout:45000});}
function ok(f,...args){const out=call(f,...args);
  assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}\n${out.stdout}`);return out.stdout;}
const sync=f=>JSON.parse(ok(f,'status','--sync','--json')).checks[0];
const cached=f=>JSON.parse(ok(f,'status','--json'));
const receipt=f=>JSON.parse(fs.readFileSync(path.join(f.state,'receipts-v1.json'),'utf8')).checks.typecheck;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Runs until a run starts from a certificate (the first may have none yet).
async function recorded(f){
  for(let n=0;n<3;n++){ok(f,'run','typecheck');if(receipt(f).stable)return receipt(f);await wait(300);}
  return receipt(f);
}

test('a run whose declaration lookups the probe never made is CURRENT, with its run facts asked again',
  {skip:!supported},async t=>{
  const f=fixture(t),r=await recorded(f);
  assert.equal(r.stable,true,JSON.stringify(r.checkpoint));
  assert.equal(r.fingerprintVersion,2);
  const ghost=path.join(f.base,'node_modules','ghost','package.json');
  assert(r.runFacts.some(([kind,file,answer])=>kind==='fileExists'&&file===ghost&&answer===null),
    'the ancestor lookup of the missing dependency is a run fact');
  const before=sync(f);
  assert.equal(`${before.freshness}/${before.result}/${before.reuse_eligible}`,'CURRENT/PASS/true');
  // Outside the checkout: no watcher sees it, only the run fact does.
  put(ghost,JSON.stringify({name:'ghost',version:'1.0.0',types:'index.d.ts'}));
  put(path.join(path.dirname(ghost),'index.d.ts'),'export declare const g: number;\n');
  const appeared=sync(f);
  assert.equal(appeared.freshness,'STALE');assert.equal(appeared.reuse_eligible,false);
  assert.match(appeared.reason,/a lookup the last run made answers differently now: .*ghost/);
  fs.rmSync(path.dirname(ghost),{recursive:true});
  assert.equal(sync(f).freshness,'CURRENT');
  // A direct receipt from before run facts may hide such lookups: it is not reused.
  const file=path.join(f.state,'receipts-v1.json'),receipts=JSON.parse(fs.readFileSync(file,'utf8'));
  receipts.checks.typecheck.fingerprintVersion=1;delete receipts.checks.typecheck.runFacts;
  fs.writeFileSync(file,JSON.stringify(receipts));
  const old=sync(f);
  assert.equal(old.freshness,'UNVERIFIED');assert.match(old.reason,/predates run facts/);
});

// After a macOS history fault the observer exports no certificate, so runs are
// checked by full probes. Their lookups outside the probe still become run facts.
test('a run checked by full probes keeps its run facts too',{skip:process.platform!=='darwin'},async t=>{
  const f=fixture(t);await recorded(f);
  put(path.join(f.state,'history-fault'),'fail');
  for(let n=0;n<100&&sync(f).freshness!=='CURRENT';n++)await wait(100);
  fs.rmSync(path.join(f.state,'history-fault'),{force:true});
  ok(f,'run','typecheck');const r=receipt(f);
  assert.equal(r.stable,true,JSON.stringify(r.checkpoint));assert.equal(r.fingerprintVersion,2);
  const ghost=path.join(f.base,'node_modules','ghost','package.json');
  assert(r.runFacts.some(([kind,file])=>kind==='fileExists'&&file===ghost));
  put(ghost,'{}');assert.equal(sync(f).freshness,'STALE');
});

// The direct recipe's cached status already waits for the caller's execution
// context, so this uses a check whose cached status can say CURRENT. Status
// treats a receipt's run facts the same way for every check.
test('cached status is never CURRENT for a receipt whose run facts were not asked again for that answer',
  {skip:process.platform==='win32'},async t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-rf-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-s'),outside=path.join(base,'outside.d.ts');
  const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'check',command:['@node','check.cjs'],
    inputs:['src/**','check.cjs'],coverage:Object.fromEntries(categories.map(k=>[k,true])),
    coverageReview:Object.fromEntries(categories.map(k=>[k,'reviewed fixture contract']))}]}));
  put(path.join(root,'package.json'),'{"name":"run-facts-generic","version":"1"}\n');
  put(path.join(root,'check.cjs'),'process.exitCode=0;\n');put(path.join(root,'src/a.txt'),'a\n');
  execFileSync('git',['init','-q'],{cwd:root});
  const f={base,root,state,env:{...process.env,VSTATE_START_READY_WAIT_MS:'10000'}};
  t.after(()=>{try{call(f,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  ok(f,'start');ok(f,'run','check');
  // The receipt a run with one uncovered lookup would have written.
  const file=path.join(state,'receipts-v1.json'),receipts=JSON.parse(fs.readFileSync(file,'utf8'));
  Object.assign(receipts.checks.check,{fingerprintVersion:2,runFacts:[['fileExists',outside,null]]});
  fs.writeFileSync(file,JSON.stringify(receipts));
  const answers=async(after,count)=>{const rows=[];
    for(let n=0;n<80&&rows.length<count;n++){const value=cached(f);
      if(value.updated_at>after&&value.checks?.[0])rows.push(value.checks[0]);await wait(100);}
    assert.equal(rows.length,count,'the observer published answers');return rows;};
  ok(f,'status','--sync','--json');
  assert(( await answers(Date.now(),2)).every(row=>row.freshness==='CURRENT'),'CURRENT while the run fact holds');
  // No event reaches the observer. The very next cached answer, even one the
  // observer published before the change, must not say CURRENT.
  put(outside,'export {};\n');
  const next=cached(f);
  assert.equal(next.checks[0].freshness,'STALE',next.checks[0].reason);
  assert.equal(next.state,'stale');assert.equal(next.current,0);
  for(const row of await answers(Date.now(),3)){
    assert.equal(row.freshness,'STALE',row.reason);assert.match(row.reason,/answers differently now/);}
});

test('an uncovered stat, realpath or package.json read becomes a run fact; other reads are still refused',()=>{
  const compiler={entry:'/c/lib/tsc.js',tsRoot:'/c',digest:'d'},node=['/node','v22'];
  const certificate={compiler,context:directContextHash(compiler,node),
    queries:[['readFile','/p/src/a.ts','h'],['fileExists','/p/src/a.ts',true]]};
  const record=facts=>({schema:1,main:compiler.entry,node,facts});
  const collected=[];
  assert.equal(runRecordIssue(record([['read','/p/src/a.ts','h'],['stat','/p/package.json',null],
    ['stat','/node_modules/x/package.json','f'],['stat','/p/lib','d'],['realpath','/p/node_modules/x/i.d.ts','/p/node_modules/x/i.d.ts']]),
    certificate,collected),null);
  assert.deepEqual(collected,[['fileExists','/p/package.json',null],['fileExists','/node_modules/x/package.json',true],
    ['directoryExists','/p/lib',true],['realpath','/p/node_modules/x/i.d.ts','/p/node_modules/x/i.d.ts']]);
  const manifest=[];
  assert.equal(runRecordIssue(record([['read','/p/node_modules/x/package.json','h2']]),certificate,manifest),null);
  assert.deepEqual(manifest,[['readFile','/p/node_modules/x/package.json','h2']]);
  assert.match(runRecordIssue(record([['read','/p/src/b.ts','h']]),certificate,[]),/read \/p\/src\/b\.ts is not in/);
  assert.match(runRecordIssue(record([['readdir','/p/lib',[]]]),certificate,[]),/readdir \/p\/lib is not in/);
  // Without a collector, as before: any uncovered answer is refused.
  assert.match(runRecordIssue(record([['stat','/p/package.json',null]]),certificate),/stat \/p\/package\.json is not in/);
});
