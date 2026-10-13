import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {discoverDeclared} from '../src/declared-plan.mjs';
import {sealedTypeScriptQualification,sealedTypeScriptCommand,sealedTypeScriptPending,
  sealedTypeScriptInterpretation,assertPendingSealedTypeScriptCheck} from '../src/sealed-typescript-recipe.mjs';

const bin=new URL('../bin/redue.mjs',import.meta.url),internal=new URL('../src/cli.mjs',import.meta.url);
const compiler=new URL('./fixtures/typescript-5-5-2/node_modules/typescript/',import.meta.url);
const available={skip:!fs.existsSync(compiler)?'Approved retained compiler unavailable; no substitute fetched':false};
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='win32'?os.tmpdir():'/tmp','redue-sealed-admission-'))),root=path.join(base,'space café'),state=path.join(base,'redue-state');
  fs.mkdirSync(path.join(root,'node_modules'),{recursive:true});
  fs.cpSync(compiler,path.join(root,'node_modules/typescript'),{recursive:true});
  put(path.join(root,'package.json'),JSON.stringify({name:'owned-fixture',scripts:{typecheck:'tsc --noEmit',test:'node tests.cjs'}}));
  put(path.join(root,'package-lock.json'),'{}');put(path.join(root,'tsconfig.json'),'{"include":["src"]}');put(path.join(root,'src/main.ts'),'export const x=1;');
  const git=spawnSync('git',['init','-q'],{cwd:root,encoding:'utf8'});assert.equal(git.status,0,git.stderr);
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  return {root,state,config:path.join(root,'redue.config.json'),base};
}
function call(f,...args){return spawnSync(process.execPath,[bin.pathname,'--state-dir',f.state,...args],{cwd:f.root,env,encoding:'utf8',timeout:10000,maxBuffer:1024*1024});}
function good(f,...args){const r=call(f,...args);assert.equal(r.status,0,r.stderr);return r.stdout;}
const preview=f=>JSON.parse(good(f,'init','--recipe','typescript-sealed','--dry-run','--json'));
function selected(){return {name:'typecheck',script:'typecheck',qualification:sealedTypeScriptQualification,cwd:'.',
  command:[process.execPath,...sealedTypeScriptCommand.slice(1)],qualificationInterpretation:sealedTypeScriptInterpretation,
  inputs:['package.json','tsconfig.json','src/**'],installedInputs:[],coverage:{source:true,generated:true,installedDependencies:true,environment:true,toolchain:true,runtime:true,probeContinuity:true}};}

test('explicit preview and creation represent a disabled distinct staged obligation',available,t=>{
  const f=fixture(t),pkg=fs.readFileSync(path.join(f.root,'package.json')),value=preview(f),check=value.proposed_config.checks[0];
  assert.equal(value.written,false);assert(!fs.existsSync(f.config));assert(!fs.existsSync(f.state));
  assert.equal(check.qualification,sealedTypeScriptQualification);assert.deepEqual(check.command,sealedTypeScriptCommand);
  assert.equal(check.cwd,'.');assert.equal(value.checks[0].recipe.recipe.cwd,'@sealed-root');
  for(const key of ['sealed','executable','reuseEligible','npmExecution','lifecycleExecution'])assert.equal(value.checks[0].recipe[key],false);
  assert.equal(value.checks[0].level,'blocked');assert.equal(value.checks[0].recipe.reason,sealedTypeScriptPending);
  const applied=JSON.parse(good(f,'init','--recipe','typescript-sealed','--json'));assert.equal(applied.written,true);
  assert.deepEqual(JSON.parse(fs.readFileSync(f.config)),value.proposed_config);
  assert.deepEqual(fs.readFileSync(path.join(f.root,'package.json')),pkg);
  assert.equal(value.proposed_config.checks[1].qualification,undefined);assert.equal(value.proposed_config.checks[1].script,'test');
  assert.equal(JSON.stringify(value.proposed_config).includes(f.root),false);
  const r=call(f,'run','typecheck','--portable');assert.equal(r.status,2);assert.match(r.stderr,/SEALED_RECIPE_ENFORCEMENT_PENDING/);
  assert(!fs.existsSync(f.state),'blocked run must not initialize state or persist runtime');
});

test('existing config and outcome bytes remain intact; no source compiler/probe executes',available,t=>{
  const f=fixture(t);good(f,'init');const old=fs.readFileSync(f.config);preview(f);
  const proposed=JSON.parse(good(f,'init','--recipe','typescript-sealed','--json'));assert.equal(proposed.existing,true);assert.equal(proposed.written,false);
  assert.deepEqual(fs.readFileSync(f.config),old);
  fs.writeFileSync(f.config,JSON.stringify(proposed.proposed_config));
  fs.mkdirSync(f.state);put(path.join(f.state,'runs-v1/history.json'),'historical immutable PASS');put(path.join(f.state,'receipts-v1.json'),'newer outcome');
  const history=fs.readFileSync(path.join(f.state,'runs-v1/history.json')),receipt=fs.readFileSync(path.join(f.state,'receipts-v1.json'));
  const marker=path.join(f.base,'executed');put(path.join(f.root,'node_modules/typescript/lib/tsc.js'),`require('node:fs').writeFileSync(${JSON.stringify(marker)},'compiler');`);
  const r=call(f,'run','typecheck');assert.equal(r.status,2);assert.match(r.stderr,/SEALED_RECIPE_ENFORCEMENT_PENDING/);
  assert(!fs.existsSync(marker));assert(!fs.existsSync(path.join(f.state,'project-runtime-v1.json')));
  assert.deepEqual(fs.readFileSync(path.join(f.state,'runs-v1/history.json')),history);assert.deepEqual(fs.readFileSync(path.join(f.state,'receipts-v1.json')),receipt);
});

test('explicit unsupported selection refuses rather than silently retaining npm execution',available,t=>{
  const f=fixture(t);
  for(const scripts of [{typecheck:'tsc --noEmit',pretypecheck:'node before.cjs'}, {typecheck:'tsc --noEmit && node after.cjs'}, {test:'node tests.cjs'}]){
    put(path.join(f.root,'package.json'),JSON.stringify({scripts}));const r=call(f,'init','--recipe','typescript-sealed','--json');
    assert.equal(r.status,2);assert(!fs.existsSync(f.config));assert(!fs.existsSync(f.state));
  }
});

for(const dryRun of [true,false])test('explicit sealed recipe refuses a conflicting filtered check before '+(dryRun?'preview':'apply'),available,t=>{
  const f=fixture(t),args=['init','--recipe','typescript-sealed','--check','test',...(dryRun?['--dry-run']:[]),'--json'];
  const denied=call(f,...args);assert.equal(denied.status,2);assert.match(denied.stderr,/sealed recipe requires the selected typecheck/);
  assert(!fs.existsSync(f.config));assert(!fs.existsSync(f.state));
  good(f,'init');const old=fs.readFileSync(f.config);fs.mkdirSync(f.state);const receipt=path.join(f.state,'receipts-v1.json');put(receipt,'existing selected history');
  const again=call(f,...args);assert.equal(again.status,2);assert.deepEqual(fs.readFileSync(f.config),old);assert.equal(fs.readFileSync(receipt,'utf8'),'existing selected history');
  assert(!fs.existsSync(path.join(f.state,'project-runtime-v1.json')));
});

test('explicit sealed typecheck filtering preserves the chosen obligation and existing config',available,t=>{
  const f=fixture(t),args=['init','--recipe','typescript-sealed','--check','typecheck','--json'];
  const before=JSON.parse(good(f,...args,'--dry-run'));assert.equal(before.proposed_config.checks.length,1);
  assert.equal(before.proposed_config.checks[0].qualification,sealedTypeScriptQualification);assert.deepEqual(before.proposed_config.checks[0].command,sealedTypeScriptCommand);
  assert(!fs.existsSync(f.config));assert(!fs.existsSync(f.state));
  good(f,'init');const old=fs.readFileSync(f.config);const selected=JSON.parse(good(f,...args));
  assert.equal(selected.existing,true);assert.equal(selected.written,false);assert.deepEqual(selected.proposed_config,before.proposed_config);assert.deepEqual(fs.readFileSync(f.config),old);
});

test('new plan identity is pending despite forged coverage; obsolete configurations reject',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-sealed-plan-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  put(path.join(base,'package.json'),'{}');const check=selected(),config={root:base,checks:[check]};
  const plan=discoverDeclared(config).plans.typecheck;
  assert(plan.unresolved.includes(sealedTypeScriptPending));assert.equal(plan.executionProvenance,'sealed-recipe-enforcement-pending');assert.equal(plan.qualificationInterpretation,sealedTypeScriptInterpretation);
  const ordinary={...check,command:[process.execPath,'source-compiler.js','--noEmit'],qualification:null};delete ordinary.qualificationInterpretation;
  const other=discoverDeclared({root:base,checks:[ordinary]}).plans.typecheck;assert.notEqual(plan.id,other.id);assert.notEqual(plan.selectedConfigHash,other.selectedConfigHash);
  assert.notEqual(createHash('sha256').update(JSON.stringify(plan.command)).digest('hex'),createHash('sha256').update(JSON.stringify(other.command)).digest('hex'));
  for(const changed of [{cwd:'@sealed-root'},{command:[process.execPath,'source-compiler.js','--noEmit']},{qualificationInterpretation:'npm-sealed-typescript@0'},{qualificationInterpretation:undefined},{probes:[[process.execPath,'-e','throw Error()']]}])
    assert.throws(()=>discoverDeclared({root:base,checks:[{...check,...changed}]}),{code:'SEALED_RECIPE_CONFIGURATION'});
  assert.throws(()=>assertPendingSealedTypeScriptCheck({...check,command:[...sealedTypeScriptCommand],qualification:'npm-typescript-sealed-v0'}),{code:'SEALED_RECIPE_CONFIGURATION'});
});

test('public forged/obsolete authority and tokens are refused without execution',available,t=>{
  const f=fixture(t),config=preview(f).proposed_config;
  for(const delta of [{sealed:true},{qualificationInterpretation:'npm-sealed-typescript@0'},{qualification:'npm-typescript-sealed-v0'},
    {command:['@node','@typescript-compiler:.','--noEmit']},{probes:[['@node','-e','throw Error("probe")']]},
    {qualification:null,script:null,command:[...sealedTypeScriptCommand]}]){
    put(f.config,JSON.stringify({...config,checks:[{...config.checks[0],...delta}]}));
    const r=call(f,'run','typecheck');assert.equal(r.status,2);assert(!fs.existsSync(f.state));
  }
});

test('internal run rejects pending recipe before lock, caller probes or state mutation',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-sealed-internal-'))),root=path.join(base,'root'),state=path.join(base,'redue-state');
  fs.mkdirSync(root);t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const runtime=path.join(base,'runtime.json');put(runtime,JSON.stringify({schema:1,provider:'declared-project@1',root,state,checks:[selected()]}));
  const r=spawnSync(process.execPath,[internal.pathname,runtime,'run','typecheck'],{cwd:root,env,encoding:'utf8',timeout:5000});
  assert.equal(r.status,2);assert.match(r.stderr,/SEALED_RECIPE_ENFORCEMENT_PENDING/);assert(!fs.existsSync(state));
});


test('starting and inspecting the disabled check never executes the source compiler',available,t=>{
  const f=fixture(t);good(f,'init','--recipe','typescript-sealed');
  const marker=path.join(f.base,'compiler-executed');
  for(const entry of ['tsc.js','typescript.js'])put(path.join(f.root,'node_modules/typescript/lib',entry),`require('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');`);
  t.after(()=>call(f,'stop'));
  good(f,'start');
  for(const args of [['status','--json'],['status','--sync','--json'],['explain','typecheck','--json']]){
    const result=JSON.parse(good(f,...args)),check=result.checks.find(row=>row.name==='typecheck');
    assert.equal(check.freshness,'UNVERIFIED');assert.equal(check.reuse_eligible,false);assert(!fs.existsSync(marker));
  }
  const stored=JSON.parse(fs.readFileSync(path.join(f.state,'plans-v1.json'))).plans.typecheck;
  assert(stored.unresolved.includes(sealedTypeScriptPending));assert.equal(stored.executionProvenance,'sealed-recipe-enforcement-pending');
  const r=call(f,'run','typecheck');assert.equal(r.status,2);assert.match(r.stderr,/SEALED_RECIPE_ENFORCEMENT_PENDING/);assert(!fs.existsSync(marker));
  assert(!fs.existsSync(path.join(f.state,'runs-v1')));good(f,'stop');
});
