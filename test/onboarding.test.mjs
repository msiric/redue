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

test('Windows npm prefix falls back to bundled CLI until an alternate appears',
  {skip:process.platform!=='win32'},t=>{
    const {root}=project(t),prefix=fs.mkdtempSync(path.join(os.tmpdir(),'redue-prefix-'));
    t.after(()=>fs.rmSync(prefix,{recursive:true,force:true}));
    const npm=findExecutable('npm');
    const probe=()=>spawnSync(process.execPath,
      [path.resolve('src/typescript-contract-probe.mjs'),root,'typecheck',npm],
      {cwd:root,encoding:'utf8',timeout:15000,
        env:{...process.env,npm_config_prefix:prefix}});
    const first=probe();
    assert.equal(first.status,0,first.stderr);
    const alternate=path.join(prefix,'node_modules','npm','bin','npm-cli.js');
    put(alternate,'// disposable alternate npm CLI\n');
    const changed=probe();
    assert.equal(changed.status,2);
    assert.match(changed.stderr,/npm-installation-layout-unsupported/);
    fs.rmSync(alternate);
    const restored=probe();
    assert.equal(restored.status,0,restored.stderr);
    assert.equal(restored.stdout,first.stdout);
  });

test('init previews and writes a small script config without running project commands',t=>{
  const {root,state,config}=project(t);
  const preview=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert(!fs.existsSync(config));
  assert.deepEqual(preview.checks.map(row=>row.name),['typecheck','test','lint','build']);
  assert.equal(preview.checks[0].level,'ready');
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

test('generated npm TypeScript check earns CURRENT; unrelated edits preserve, inputs stale',t=>{
  const {root,state}=project(t);good(root,state,'init');good(root,state,'start');
  good(root,state,'run','typecheck');
  let item=sync(root,state).checks.find(row=>row.name==='typecheck');
  assert.equal(item.result,'PASS');assert.equal(item.freshness,'CURRENT',JSON.stringify(item));
  assert.match(good(root,state,'detail'),/typecheck: PASS recorded; current/);
  assert.match(good(root,state,'detail'),/test: not run; unverified — reuse not yet qualified/);
  assert.equal(JSON.parse(good(root,state,'detail','--json')).checks[0].name,'typecheck');
  const runId=item.invocation.runId;
  put(path.join(root,'notes.md'),'unrelated\n');
  assert.equal(sync(root,state).checks.find(row=>row.name==='typecheck').freshness,'CURRENT');
  put(path.join(root,'src/main.ts'),'export const value: number = 2;\n');
  item=sync(root,state).checks.find(row=>row.name==='typecheck');
  assert.equal(item.freshness,'STALE');assert.equal(item.result,'PASS');
  assert.equal(item.invocation.runId,runId);
  assert.match(item.reason,/src\/main.ts changed/);
  good(root,state,'run','typecheck');
  assert.equal(sync(root,state).checks.find(row=>row.name==='typecheck').freshness,'CURRENT');
  put(path.join(root,'node_modules/typescript/README.md'),'changed installed tool\n');
  assert.equal(sync(root,state).checks.find(row=>row.name==='typecheck').freshness,'STALE');
  const recording=sync(root,state).checks.find(row=>row.name==='test');
  assert.equal(recording.freshness,'UNVERIFIED');
  assert.match(recording.reason,/need review/);
  good(root,state,'stop');
  assert.equal(JSON.parse(good(root,state,'status','--json')).checks[0].freshness,'UNVERIFIED');
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
  assert.equal(preview.checks[0].level,'ready');
  const ambiguous=project(t,{scripts:{unit:'vitest run',spec:'jest --runInBand'}});
  const other=JSON.parse(good(ambiguous.root,ambiguous.state,'init','--dry-run','--json'));
  assert.deepEqual(other.ambiguous,[{kind:'test',scripts:['unit','spec']}]);
  assert(!other.checks.some(row=>row.name==='test'));
  const lifecycle=project(t,{scripts:{check:'tsc --noEmit',precheck:'node preflight.js'}});
  const life=JSON.parse(good(lifecycle.root,lifecycle.state,'init','--dry-run','--json'));
  assert.equal(life.checks[0].level,'recording');
});

test('unsupported TypeScript compiler plugins withhold reuse without changing a PASS receipt',t=>{
  const {root,state}=project(t);good(root,state,'init');good(root,state,'start');
  good(root,state,'run','typecheck');
  assert.equal(sync(root,state).checks[0].freshness,'CURRENT');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,
    plugins:[{name:'custom-transform'}]},include:['src']}));
  const item=sync(root,state).checks[0];
  assert.equal(item.result,'PASS');
  assert.equal(item.freshness,'UNVERIFIED');
  assert.match(item.reason,/plugin needs explicit review/);
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
