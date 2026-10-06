import {inflateSync} from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {findExecutable} from '../src/executable-lookup.mjs';

const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const sourceTypeScript=path.dirname(require.resolve('typescript/package.json'));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function project(t,{manager='npm',declaredManager=null,
  scripts={typecheck:'tsc --noEmit',test:'vitest run',
  lint:'eslint .',build:'vite build'},workspaces=false}={}){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-onboarding-')),
    root=path.join(base,'project'),state=path.join(base,'vstate-state');
  fs.mkdirSync(root);put(path.join(root,'package.json'),JSON.stringify({name:'public-ts-fixture',
    version:'1.0.0',scripts,...(declaredManager?{packageManager:declaredManager}:{}),
    ...(workspaces?{workspaces:['packages/*']}:{})}));
  if(manager==='npm')put(path.join(root,'package-lock.json'),'{"name":"public-ts-fixture","lockfileVersion":3}');
  if(manager==='yarn')put(path.join(root,'yarn.lock'),'# yarn lockfile v1\n');
  if(manager==='pnpm')put(path.join(root,'pnpm-lock.yaml'),'lockfileVersion: 9.0\n');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true,
    target:'ES2022'},include:['src']}));
  put(path.join(root,'src/main.ts'),'export const value: number = 1;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.mkdirSync(path.join(root,'node_modules','.bin'),{recursive:true});
  fs.cpSync(sourceTypeScript,path.join(root,'node_modules','typescript'),{recursive:true});
  if(process.platform==='win32')fs.copyFileSync(path.resolve('node_modules/.bin/tsc.cmd'),
    path.join(root,'node_modules','.bin','tsc.cmd'));
  else fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules','.bin','tsc'));
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['add','package.json','tsconfig.json','src','.gitignore',
    ...(manager==='npm'?['package-lock.json']:manager==='yarn'?['yarn.lock']:
      ['pnpm-lock.yaml'])],{cwd:root});
  t.after(()=>{try{invoke(root,state,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  return {root,state,config:path.join(root,'redue.config.json')};
}
function invoke(root,state,...args){
  // npm test injects npm_config_* into this test process. The fixture models a
  // developer invoking the CLI directly, not a nested npm lifecycle command.
  const env=Object.fromEntries(Object.entries(process.env)
    .filter(([key])=>!/^npm_config_/i.test(key)));
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],
    {cwd:root,env,encoding:'utf8',timeout:30000});
}
function good(root,state,...args){const result=invoke(root,state,...args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);
  return result.stdout;}
const sync=(root,state)=>JSON.parse(good(root,state,'status','--sync','--json'));

test('REDUE CLI identifies itself and keeps pre-release config compatibility',t=>{
  const {root,state,config}=project(t);
  assert.match(good(root,state,'--help'),/Usage: redue /);
  good(root,state,'init');
  const legacy=path.join(root,'vstate.config.json');
  fs.renameSync(config,legacy);
  assert.match(good(root,state,'init'),/left unchanged/);
  assert(!fs.existsSync(config));
  assert.equal(JSON.parse(good(root,state,'status','--json')).checks.length,4);
});

test('init previews and writes a small script config without running project commands',t=>{
  const {root,state,config}=project(t);
  const preview=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert(!fs.existsSync(config));
  assert.deepEqual(preview.checks.map(row=>row.name),['typecheck','test','lint','build']);
  assert.equal(preview.checks[0].level,'recording');
  assert(preview.checks.slice(1).every(row=>row.level==='recording'));
  good(root,state,'init');
  const written=fs.readFileSync(config,'utf8');
  assert(!written.includes(root));
  assert.equal(JSON.parse(written).checks[0].qualification,'typescript-noemit-v1');
  const unchanged=good(root,state,'init');
  assert.match(unchanged,/left unchanged/);
  assert.equal(fs.readFileSync(config,'utf8'),written);
  const json=JSON.parse(good(root,state,'init','--json'));
  assert.equal(json.written,false);
});

test('npm launcher records immutable outcomes but cannot grant applicability',async t=>{
  const {root,state}=project(t);good(root,state,'init');good(root,state,'start');
  good(root,state,'run','typecheck');
  const first=sync(root,state).checks[0];
  assert.equal(first.result,'PASS');assert.equal(first.freshness,'UNVERIFIED');
  assert.equal(first.reuse_eligible,false);assert.match(first.reason,/npm launcher/);
  const runFile=path.join(state,'runs-v1',first.invocation.runId+'.json'),bytes=fs.readFileSync(runFile);
  for(const args of [['status','--json'],['status','--sync','--json'],['explain','typecheck','--json']]){
    const row=JSON.parse(good(root,state,...args)).checks[0];
    assert.equal(row.reuse_eligible,false);assert.equal(row.invocation.runId,first.invocation.runId);
  }
  put(path.join(root,'src/main.ts'),'export const value: number = "bad";\n');
  assert.notEqual(invoke(root,state,'run','typecheck').status,0);
  const failed=sync(root,state).checks[0];assert.equal(failed.result,'FAIL');assert.equal(failed.reuse_eligible,false);
  assert.deepEqual(fs.readFileSync(runFile),bytes);
  good(root,state,'stop');good(root,state,'start');
  assert.equal(sync(root,state).checks[0].reuse_eligible,false);
});

test('unsupported manager and workspace boundary are explicit',t=>{
  const pnpm=project(t,{manager:'pnpm'});
  const recording=JSON.parse(good(pnpm.root,pnpm.state,'init','--json'));
  assert.equal(recording.installation_layout,'recording-only');
  assert.match(recording.issue,/exact pnpm 12/);
  assert.equal(recording.checks[0].level,'recording');
  assert(fs.existsSync(pnpm.config));
  const workspace=project(t,{workspaces:true});
  const preview=JSON.parse(good(workspace.root,workspace.state,'init','--dry-run','--json'));
  assert.equal(preview.workspaces,true);
  assert.equal(preview.checks[0].level,'recording');
  assert.match(preview.checks[0].reason,/workspace/);
  const unpinnedYarn=project(t,{manager:'yarn'});
  const yarnPreview=JSON.parse(good(unpinnedYarn.root,unpinnedYarn.state,'init','--json'));
  assert.match(yarnPreview.issue,/Yarn version is not declared/);
  assert.equal(yarnPreview.written,false);
  assert(!fs.existsSync(unpinnedYarn.config));
  const pinnedYarn=project(t,{manager:'yarn',declaredManager:'yarn@1.22.22'});
  const pinned=JSON.parse(good(pinnedYarn.root,pinnedYarn.state,'init','--json'));
  assert.equal(pinned.installation_layout,'node-modules');
  assert.equal(pinned.written,true);
  assert.equal(pinned.checks[0].level,'recording');
  const noGit=project(t);
  fs.rmSync(path.join(noGit.root,'.git'),{recursive:true});
  const withoutCheckout=JSON.parse(good(noGit.root,noGit.state,'init','--json'));
  assert.match(withoutCheckout.issue,/Git checkout/);
  assert.equal(withoutCheckout.written,false);
  assert(!fs.existsSync(noGit.config));
  const linked=project(t);
  fs.symlinkSync(os.tmpdir(),path.join(linked.root,'src','outside'));
  const linkedPreview=JSON.parse(good(linked.root,linked.state,'init','--json'));
  assert.match(linkedPreview.issue,/source link/);
  assert.equal(linkedPreview.written,false);
  assert(!fs.existsSync(linked.config));
});

test('discovers uniquely identifiable tool commands without relying on script names',t=>{
  const {root,state}=project(t,{scripts:{check:'tsc --noEmit',unit:'vitest run',
    style:'eslint .',bundle:'vite build'}});
  const preview=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.deepEqual(preview.checks.map(row=>row.script),['check','unit','style','bundle']);
  assert.equal(preview.checks[0].level,'recording');
  const ambiguous=project(t,{scripts:{unit:'vitest run',spec:'jest --runInBand'}});
  const other=JSON.parse(good(ambiguous.root,ambiguous.state,'init','--dry-run','--json'));
  assert.deepEqual(other.ambiguous,[{kind:'test',scripts:['unit','spec']}]);
  assert(!other.checks.some(row=>row.name==='test'));
  const lifecycle=project(t,{scripts:{check:'tsc --noEmit',precheck:'node preflight.js'}});
  const life=JSON.parse(good(lifecycle.root,lifecycle.state,'init','--dry-run','--json'));
  assert.equal(life.checks[0].level,'recording');
});

test('npm workspace scripts are discovered as recording-only named checks',t=>{
  const {root,state,config}=project(t,{scripts:{},workspaces:true});
  put(path.join(root,'packages','library','package.json'),JSON.stringify({
    name:'@fixture/library',version:'1.0.0',scripts:{typecheck:'tsc --noEmit',
      test:'vitest run'}}));
  execFileSync('git',['add','packages/library/package.json'],{cwd:root});
  const preview=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.deepEqual(preview.checks.map(row=>row.name),
    ['@fixture/library:typecheck','@fixture/library:test']);
  assert(preview.checks.every(row=>row.level==='recording'));
  good(root,state,'init');
  const checks=JSON.parse(fs.readFileSync(config,'utf8')).checks;
  assert.deepEqual(checks[0].command,
    ['@which:npm','run','typecheck','--workspace','@fixture/library']);
  const yarn=project(t,{manager:'yarn',declaredManager:'yarn@1.22.22',
    scripts:{},workspaces:true});
  put(path.join(yarn.root,'packages','library','package.json'),JSON.stringify({
    name:'@fixture/library',version:'1.0.0',scripts:{test:'jest --runInBand'}}));
  execFileSync('git',['add','packages/library/package.json'],{cwd:yarn.root});
  const yarnPreview=JSON.parse(good(yarn.root,yarn.state,'init','--dry-run','--json'));
  assert.deepEqual(yarnPreview.proposed_config.checks[0].command,
    ['@which:yarn','workspace','@fixture/library','run','test']);
});


test('retired npm probe rejects full and cached-context qualification',()=>{
  for(const extra of [[],['--redue-checkpoint'],['--redue-context-only']]){
    const r=spawnSync(process.execPath,[path.resolve('src/typescript-contract-probe.mjs'),...extra],{encoding:'utf8'});
    assert.equal(r.status,2);assert.equal(r.stdout,'');assert.match(r.stderr,/npm-launcher-unobserved-inputs/);
  }
});
