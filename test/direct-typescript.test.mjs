import {Worker} from 'node:worker_threads';
import {discover} from '../src/plan.mjs';
import {planGuard} from '../src/decision-validation.mjs';
import {inflateSync} from 'node:zlib';
import {directCompiler,directEnvironmentIssue,observedNpmContext} from '../src/direct-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {findExecutable} from '../src/executable-lookup.mjs';

const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const compilerPackage=process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript';
const sourceTypeScript=path.dirname(require.resolve(compilerPackage+'/package.json'));
const compilerVersion=JSON.parse(fs.readFileSync(path.join(sourceTypeScript,'package.json'))).version;
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
  // Node test worker markers are also fixture-only, not ordinary shell context.
  const env=Object.fromEntries(Object.entries(process.env)
    .filter(([key])=>!/^npm_config_/i.test(key)&&!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],
    {cwd:root,env,encoding:'utf8',timeout:30000});
}
function good(root,state,...args){const result=invoke(root,state,...args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);
  return result.stdout;}
const sync=(root,state)=>JSON.parse(good(root,state,'status','--sync','--json'));


const init=(root,state)=>good(root,state,'init','--recipe','typescript-direct');
test('direct recipe is an explicit previewable choice; no lifecycle or compound bypass',t=>{
  const {root,state,config}=project(t);
  const pkg=fs.readFileSync(path.join(root,'package.json'));
  const before=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.equal(before.checks[0].level,'recording');
  const preview=JSON.parse(good(root,state,'init','--recipe','typescript-direct','--dry-run','--json'));
  assert(!fs.existsSync(config));assert.equal(preview.checks[0].level,'ready');
  assert.deepEqual(preview.checks[0].command,['@node','@typescript-compiler:.','--noEmit']);
  assert.match(preview.checks[0].reason,/npm launcher\/lifecycle scripts are not executed/);
  init(root,state);assert.deepEqual(fs.readFileSync(path.join(root,'package.json')),pkg);
  const content=fs.readFileSync(config);good(root,state,'init');assert.deepEqual(fs.readFileSync(config),content);
  for(const scripts of [{typecheck:'tsc --noEmit',pretypecheck:'node prep.js'},
    {typecheck:'tsc --noEmit',posttypecheck:'node after.js'},
    {typecheck:'NODE_ENV=production tsc --noEmit'},{typecheck:'tsc --noEmit && node after.js'}]){
    const other=project(t,{scripts});const value=JSON.parse(good(other.root,other.state,'init','--recipe','typescript-direct','--dry-run','--json'));
    assert.equal(value.checks[0].level,'recording');assert.equal(value.checks[0].command,null);
    assert.match(value.checks[0].reason,/original npm script retained/);
  }
});
test('direct compiler identity rejects replacements/additions and unsafe runtime paths',t=>{
  const {root}=project(t);assert.equal(directCompiler(root).version,compilerVersion);
  const file=path.join(root,'node_modules/typescript/lib/tsc.js'),bytes=fs.readFileSync(file);
  fs.appendFileSync(file,'\n');assert.throws(()=>directCompiler(root),/implementation-unreviewed/);fs.writeFileSync(file,bytes);
  put(path.join(root,'node_modules/typescript/unreviewed.js'),'');assert.throws(()=>directCompiler(root),/implementation-unreviewed/);
  for(const env of [{NODE_ENV:'development'},{NODE_OPTIONS:'--require ./helper.cjs'},
    {NODE_PATH:root},{NODE_COMPILE_CACHE:root},{LD_PRELOAD:'helper'},{DYLD_INSERT_LIBRARIES:'helper'},
    {TSC_WATCHFILE:'anything'},{NODE_INSPECT_RESUME_ON_START:'1'}])assert(directEnvironmentIssue(env));
  for(const env of [{},{NODE_ENV:'production'},{npm_config_proxy:'http://localhost:1000'},
    {npm_config_unknown:'ignored by canonical compiler'},{NPM_CONFIG_PROXY:'',npm_config_proxy:'different'}])
    assert.equal(directEnvironmentIssue(env),null);
  assert.equal(directEnvironmentIssue({NODE_USE_ENV_PROXY:'1'}),process.version==='v22.13.0'?null:'direct-execution-environment-unsupported');
  assert(directEnvironmentIssue({NODE_USE_ENV_PROXY:'invalid'}));
  assert.notEqual(observedNpmContext({npm_config_proxy:'a'}),observedNpmContext({npm_config_proxy:'b'}));
});
test('real direct compiler evidence crosses proxy contexts, but not relevant inputs or overrides',async t=>{
  const {root,state}=project(t);init(root,state);good(root,state,'start');
  const baseEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)&&!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
  const contextA={npm_config_proxy:'http://127.0.0.1:3128',NPM_CONFIG_PROXY:'http://127.0.0.1:3128'},
    contextB={npm_config_proxy:'http://127.0.0.1:4321',NPM_CONFIG_PROXY:'http://127.0.0.1:4321'};
  const call=(args,context=contextA)=>spawnSync(process.execPath,[bin,'--state-dir',state,...args],
    {cwd:root,env:{...baseEnv,...context},encoding:'utf8',timeout:45000});
  const status=(context=contextA)=>{const r=call(['status','--sync','--json'],context);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout).checks[0];};
  const run=()=>{const r=call(['run','typecheck']);assert.equal(r.status,0,r.stderr+r.stdout);};
  run();const a=status();assert.equal(a.freshness,'CURRENT',JSON.stringify(a));assert.equal(a.reuse_eligible,true);
  const id=a.invocation.runId,receiptFile=path.join(state,'runs-v1',id+'.json'),bytes=fs.readFileSync(receiptFile),receipt=JSON.parse(bytes).receipt;
  assert.equal(receipt.verificationRecipe,'npm-direct-typescript@1');assert(receipt.observedContext.npmProxyDigest);
  assert(!Object.keys(receipt.environmentHashes).some(key=>/npm/i.test(key)));
  assert.equal(status(contextB).invocation.runId,id);assert.equal(status(contextB).reuse_eligible,true);
  assert.equal(JSON.parse(call(['status','--json'],contextB).stdout).checks[0].reuse_eligible,false);
  assert.match(good(root,state,'explain','typecheck'),/npm and lifecycle scripts were not executed/);
  put(path.join(root,'notes.md'),'unrelated\n');assert.equal(status(contextB).reuse_eligible,true);
  for(const [name,content] of [['src/main.ts','export const value: number = 2;\n'],
    ['src/new.d.ts','declare const added: number;\n'],['tsconfig.json',JSON.stringify({compilerOptions:{strict:false},include:['src']})]]){
    put(path.join(root,name),content);assert.equal(status().freshness,'STALE');run();assert.equal(status().reuse_eligible,true);
  }
  const installed=path.join(root,'node_modules/typescript/README.md'),original=fs.readFileSync(installed);
  fs.appendFileSync(installed,'\n');assert.equal(status().reuse_eligible,false);fs.writeFileSync(installed,original);
  const probe=path.resolve('src/direct-typescript-probe.mjs');
  for(const env of [{NODE_ENV:'development'},{NODE_OPTIONS:'--trace-warnings'},{NODE_PATH:root},{NODE_COMPILE_CACHE:path.join(root,'cache')}]){
    for(const extra of [[],['--redue-context']]){
      const r=spawnSync(process.execPath,[probe,root,'typecheck',...extra],{cwd:root,env:{...baseEnv,...env},encoding:'utf8',timeout:15000});
      assert.equal(r.status,2);assert.match(r.stderr,/VSTATE_REASON:/);
    }
  }
  put(path.join(root,'src/main.ts'),'export const value: number = "bad";\n');
  assert.notEqual(call(['run','typecheck']).status,0);assert.equal(status().result,'FAIL');assert.equal(status().reuse_eligible,false);
  assert.deepEqual(fs.readFileSync(receiptFile),bytes);
  good(root,state,'stop');assert.equal(JSON.parse(call(['status','--json']).stdout).checks[0].reuse_eligible,false);
});
test('old npm evidence cannot satisfy the new recipe; extra caller-sensitive probes are unqualified',t=>{
  const {root,state,config}=project(t);good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  const old=sync(root,state).checks[0];assert.equal(old.reuse_eligible,false);good(root,state,'stop');
  const preview=JSON.parse(good(root,state,'init','--recipe','typescript-direct','--dry-run','--json'));
  // Explicit acceptance edit, never automatic migration by a read or run.
  fs.writeFileSync(config,JSON.stringify(preview.proposed_config));good(root,state,'start');
  const next=sync(root,state).checks[0];assert.equal(next.invocation.runId,old.invocation.runId);assert.equal(next.reuse_eligible,false);
  good(root,state,'run','typecheck');assert.equal(sync(root,state).checks[0].reuse_eligible,true);good(root,state,'stop');
  const data=JSON.parse(fs.readFileSync(config));data.checks[0].probes=[['@node','-e','console.log(process.env.npm_config_proxy)']];
  fs.writeFileSync(config,JSON.stringify(data));good(root,state,'start');good(root,state,'run','typecheck');
  const item=sync(root,state).checks[0];assert.equal(item.reuse_eligible,false);assert.match(item.reason,/direct compiler probe missing/);
});
test('direct compiler checkpoint equals the independent CLI listing result',t=>{
  const {root}=project(t),args=[path.resolve('src/direct-typescript-probe.mjs'),root,'typecheck'];
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
  const normal=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',timeout:15000}),
    captured=spawnSync(process.execPath,[...args,'--redue-checkpoint'],{cwd:root,env,encoding:'utf8',timeout:15000});
  assert.equal(normal.status,0,normal.stderr);assert.equal(captured.status,0,captured.stderr);
  const value=JSON.parse(captured.stdout);assert.equal(value.output,normal.stdout);
  assert(JSON.parse(inflateSync(Buffer.from(value.queryData,'base64'))).length>0);
});

test('retained compiler queries cannot load replaced or obsolete implementations',async t=>{
  const {root,state}=project(t);init(root,state);good(root,state,'start');good(root,state,'stop');
  const configFile=path.join(state,'project-runtime-v1.json'),config=JSON.parse(fs.readFileSync(configFile));
  assert.equal(config.checks[0].qualification,'npm-typescript-direct-v1');
  const bundle=discover(config,state),guard=planGuard(bundle),tsRoot=path.join(root,'node_modules/typescript');
  const marker=path.join(root,'executed-unreviewed.txt'),impl=path.join(tsRoot,'lib/typescript.js'),original=fs.readFileSync(impl);
  const run=async queriedRoot=>{
    const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
    const worker=new Worker(new URL('../src/plan-worker.mjs',import.meta.url),{env,workerData:{config:configFile,state,forceCold:true,
      reuse:{bundle,guard,inputs:{},queries:[['readDirectory',root,[],{tsRoot:queriedRoot,args:[]}]]}}});
    await new Promise((resolve,reject)=>{worker.on('error',reject);worker.on('exit',code=>code?reject(Error(String(code))):resolve());});
    assert(!fs.existsSync(marker),'unreviewed compiler API executed during query validation');
  };
  fs.writeFileSync(impl,`require('node:fs').writeFileSync(${JSON.stringify(marker)},'unsafe');\n`+original);
  await run(tsRoot);fs.writeFileSync(impl,original);
  const obsolete=path.join(root,'obsolete-compiler');put(path.join(obsolete,'package.json'),'{"main":"index.js"}');
  put(path.join(obsolete,'index.js'),`require('node:fs').writeFileSync(${JSON.stringify(marker)},'unsafe');module.exports={sys:{readDirectory:()=>[]}};`);
  await run(obsolete);
});

test('arbitrary proxy-reading command retains strict context and receives no direct exemption',t=>{
  const {root,state,config}=project(t);
  const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
  fs.writeFileSync(config,JSON.stringify({schema:1,checks:[{name:'proxy-reader',
    command:['@node','-e','process.exit(process.env.npm_config_proxy === "a" ? 0 : 1)'],
    inputs:['package.json'],environment:{prefixes:['npm_config_'],executableIdentity:true},
    coverage:Object.fromEntries(categories.map(k=>[k,true])),
    coverageReview:Object.fromEntries(categories.map(k=>[k,'Owned fixture: exact Node expression reads one declared environment key, no files or services']))}]}));
  good(root,state,'start');
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
  const call=(args,proxy)=>spawnSync(process.execPath,[bin,'--state-dir',state,...args],
    {cwd:root,env:{...env,npm_config_proxy:proxy},encoding:'utf8',timeout:30000});
  const run=call(['run','proxy-reader'],'a');assert.equal(run.status,0,run.stderr);
  const a=JSON.parse(call(['status','--sync','--json'],'a').stdout).checks[0];
  assert.equal(a.reuse_eligible,true);
  const b=JSON.parse(call(['status','--sync','--json'],'b').stdout).checks[0];
  assert.equal(b.freshness,'STALE');assert.equal(b.reuse_eligible,false);assert.equal(b.invocation.runId,a.invocation.runId);
});
