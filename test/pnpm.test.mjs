import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {discoverNodeProject} from '../src/node-onboarding.mjs';
import {discoverDeclared} from '../src/declared-plan.mjs';
import {InputIndex} from '../src/index.mjs';
import {pnpmInstallInfo,pnpmTypecheckInputs} from '../src/pnpm-inputs.mjs';

const require=createRequire(import.meta.url),tsRoot=path.dirname(require.resolve('typescript/package.json'));
const cleanEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>
  !/^(NODE_OPTIONS|NODE_PATH|BASH_ENV|ENV|PNPM_|COREPACK_|npm_config_|DYLD_|TSGO_)/i.test(key)));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,value);};
const json=(file,value)=>put(file,JSON.stringify(value));
function fixture(t,{hoisted=false}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-pnpm-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  json(path.join(root,'package.json'),{private:true,packageManager:'pnpm@12.4.1'});
  put(path.join(root,'pnpm-workspace.yaml'),`packages:\n  - packages/*\n${hoisted?'nodeLinker: hoisted\n':''}`);
  put(path.join(root,'pnpm-lock.yaml'),'lockfileVersion: 12.0\n');
  put(path.join(root,'.gitignore'),'node_modules/\ndist/\n');
  json(path.join(root,'node_modules','.modules.yaml'),{nodeLinker:hoisted?'hoisted':'isolated',
    packageManager:'pnpm@12.4.1',virtualStoreDir:'.pnpm'});
  put(path.join(root,'node_modules','.pnpm','lock.yaml'),'lockfileVersion: 12.0\n');
  json(path.join(root,'tsconfig.json'),{compilerOptions:{noEmit:true,moduleResolution:'node',
    target:'ES2020',strict:true},include:['src']});
  const app=path.join(root,'packages','app'),dep=path.join(root,'packages','dep'),
    sibling=path.join(root,'packages','sibling');
  json(path.join(app,'package.json'),{name:'@fixture/app',scripts:{typecheck:'tsc -p .'},
    dependencies:{'@fixture/dep':'workspace:*',external:'1.0.0'}});
  json(path.join(dep,'package.json'),{name:'@fixture/dep',types:'dist/index.d.ts'});
  json(path.join(sibling,'package.json'),{name:'@fixture/sibling'});
  for(const dir of [app,dep,sibling])json(path.join(dir,'tsconfig.json'),
    {extends:'../../tsconfig.json',include:['src']});
  put(path.join(app,'src','index.ts'),"import {value} from '@fixture/dep';\nimport {ext} from 'external';\nexport const result: number = value + ext;\n");
  put(path.join(dep,'src','index.ts'),'export const value = 1;\n');
  put(path.join(dep,'dist','index.d.ts'),'export declare const value: number;\n');
  put(path.join(sibling,'src','index.ts'),'export const other = 1;\n');
  const virtual=path.join(root,'node_modules','.pnpm');
  fs.cpSync(tsRoot,path.join(virtual,'typescript@5.6.3','node_modules','typescript'),
    {recursive:true});
  const external=path.join(virtual,'external@1.0.0','node_modules','external');
  json(path.join(external,'package.json'),{name:'external',version:'1.0.0',
    types:'index.d.ts'});
  put(path.join(external,'index.d.ts'),'export declare const ext: number;\n');
  fs.symlinkSync('.pnpm/typescript@5.6.3/node_modules/typescript',
    path.join(root,'node_modules','typescript'));
  fs.mkdirSync(path.join(app,'node_modules','@fixture'),{recursive:true});
  fs.symlinkSync('../../../dep',path.join(app,'node_modules','@fixture','dep'));
  fs.symlinkSync('../../../node_modules/.pnpm/external@1.0.0/node_modules/external',
    path.join(app,'node_modules','external'));
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['add','package.json','pnpm-workspace.yaml','pnpm-lock.yaml',
    '.gitignore','tsconfig.json','packages'],{cwd:root});
  return {root,app,dep,sibling,external};
}
function runtime(root){
  const contract=pnpmTypecheckInputs(root,'@fixture/app','typecheck');
  return {root,checks:[{name:'app',command:[process.execPath,contract.tsc,'-p','.'],
    cwd:'packages/app',workspace:'@fixture/app',script:'typecheck',
    qualification:'pnpm-tsc-v1',inputs:['package.json','pnpm-lock.yaml',
      'pnpm-workspace.yaml','packages/app/package.json','packages/app/src/**'],
    probes:[[process.execPath,path.resolve('src/pnpm-typecheck-probe.mjs'),root,
      '@fixture/app','typecheck']],environment:{executableIdentity:true,
      pathExecutables:['node'],prefixes:['PNPM_','COREPACK_','npm_config_',
        'DYLD_','TSGO_']}}]};
}

test('pnpm init selects a project-relative workspace TypeScript check and rejects unsupported layout',t=>{
  const {root}=fixture(t);
  const discovered=discoverNodeProject(root),row=discovered.checks.find(item=>
    item.config.name==='@fixture/app:typecheck');
  assert.equal(discovered.manager.layout,'node-modules/isolated');
  assert.equal(row.level,'ready');
  assert.equal(row.config.qualification,'pnpm-tsc-v1');
  assert.deepEqual(row.config.command.slice(0,2),['@node','@typescript-bin:packages/app']);
  assert(!JSON.stringify(row.config).includes('external@1.0.0'));
  const contract=pnpmTypecheckInputs(root,'@fixture/app','typecheck');
  assert.deepEqual(contract.closure.map(item=>item.name),['@fixture/dep']);
  assert(contract.generated.includes('packages/dep/dist/**'));
  assert(!contract.source.some(value=>value.startsWith('packages/sibling/')));
  put(path.join(root,'pnpm-workspace.yaml'),'packages:\n  - packages/*\nnodeLinker: pnp\n');
  const fallback=discoverNodeProject(root).checks.find(item=>item.config.name==='@fixture/app:typecheck');
  assert.equal(fallback.level,'recording');
  assert.match(fallback.reason,/pnp/);
  assert.throws(()=>pnpmInstallInfo(root),/pnp/);
  put(path.join(root,'pnpm-workspace.yaml'),'packages:\n  - packages/*\n');
  const app=path.join(root,'packages/app/package.json'),pkg=JSON.parse(fs.readFileSync(app));
  pkg.dependenciesMeta={'@fixture/dep':{injected:true}};json(app,pkg);
  const injected=discoverNodeProject(root).checks.find(item=>item.config.name==='@fixture/app:typecheck');
  assert.equal(injected.level,'recording');
  assert.match(injected.reason,/injected workspace/);
});

test('pnpm workspace, generated and project-installed content match independent recomputation',t=>{
  const {root,external}=fixture(t),config=runtime(root),bundle=discoverDeclared(config);
  assert.deepEqual(bundle.plans.app.unresolved,[]);
  const index=new InputIndex(bundle,{trackGit:false});index.coldScan();
  assert.equal(index.unavailable,null);
  const baseline=index.fingerprint('app');
  const oracle=()=>{const fresh=new InputIndex(discoverDeclared(config),{trackGit:false});
    fresh.coldScan();assert.equal(fresh.unavailable,null);return fresh.fingerprint('app');};
  assert.equal(baseline,oracle());
  const change=(file,value)=>{put(path.join(root,file),value);index.updatePath(file);
    assert.equal(index.fingerprint('app'),oracle());};
  change('packages/sibling/src/index.ts','export const other = 2;\n');
  assert.equal(index.fingerprint('app'),baseline);
  change('packages/dep/src/index.ts','export const value = 2;\n');
  assert.equal(index.fingerprint('app'),baseline); // Declarations are consumed, not source.
  change('packages/dep/dist/index.d.ts','export declare const value: string;\n');
  assert.notEqual(index.fingerprint('app'),baseline);
  change('packages/dep/dist/index.d.ts','export declare const value: number;\n');
  assert.equal(index.fingerprint('app'),baseline);
  change('packages/app/src/index.ts',"import {value} from '@fixture/dep';\nimport {ext} from 'external';\nexport const result: number = value + ext;\n// edited\n");
  assert.notEqual(index.fingerprint('app'),baseline);
  change('packages/app/src/index.ts',"import {value} from '@fixture/dep';\nimport {ext} from 'external';\nexport const result: number = value + ext;\n");
  assert.equal(index.fingerprint('app'),baseline);
  const installed=path.relative(root,path.join(external,'index.d.ts')).split(path.sep).join('/');
  change(installed,'export declare const ext: string;\n');
  assert.notEqual(index.fingerprint('app'),baseline);
  change(installed,'export declare const ext: number;\n');
  assert.equal(index.fingerprint('app'),baseline);
  change(`${path.dirname(installed)}/new-input.js`,'module.exports = 1;\n');
  assert.notEqual(index.fingerprint('app'),baseline);
  fs.rmSync(path.join(root,path.dirname(installed),'new-input.js'));
  index.updatePath(`${path.dirname(installed)}/new-input.js`);
  assert.equal(index.fingerprint('app'),oracle());
  assert.equal(index.fingerprint('app'),baseline);
  const store=path.join(path.dirname(root),'unrelated-pnpm-store-cache');
  put(store,'unrelated');t.after(()=>fs.rmSync(store,{force:true}));
  assert.equal(index.fingerprint('app'),baseline);
  change('pnpm-lock.yaml','lockfileVersion: 12.0\n# changed\n');
  assert.notEqual(index.fingerprint('app'),baseline);
  change('pnpm-lock.yaml','lockfileVersion: 12.0\n');
  change('pnpm-workspace.yaml','packages:\n  - packages/*\nlinkWorkspacePackages: true\n');
  assert.notEqual(index.fingerprint('app'),baseline);
});

test('pnpm resolution and absent optional changes rebuild a check plan conservatively',t=>{
  const {root,app}=fixture(t),config=runtime(root),first=discoverDeclared(config).plans.app;
  const link=path.join(app,'node_modules','@fixture','dep');
  fs.rmSync(link);fs.symlinkSync('../../../sibling',link);
  const wrong=discoverDeclared(config).plans.app;
  assert(wrong.unresolved.some(reason=>/workspace dependency/.test(reason)));
  assert.notEqual(first.id,wrong.id);
  fs.rmSync(link);fs.symlinkSync('../../../dep',link);
  const manifest=path.join(app,'package.json'),pkg=JSON.parse(fs.readFileSync(manifest));
  pkg.optionalDependencies={optional:'1.0.0'};json(manifest,pkg);
  const absent=pnpmTypecheckInputs(root,'@fixture/app','typecheck');
  assert.deepEqual(absent.absences.map(value=>value.name),['optional']);
  assert(absent.resolutionCandidates.some(value=>value.path.endsWith('node_modules/optional')));
  const absentPlan=discoverDeclared(config).plans.app;
  assert(absentPlan.unresolved.some(reason=>/ancestor Node lookup/.test(reason)));
  const optional=path.join(app,'node_modules','optional');
  json(path.join(optional,'package.json'),{name:'optional',version:'1.0.0'});
  put(path.join(optional,'index.js'),'module.exports = {};\n');
  const presentPlan=discoverDeclared(config).plans.app;
  assert.notEqual(absentPlan.id,presentPlan.id);
  assert.equal(presentPlan.unresolved.length,0);
  const externalLink=path.join(app,'node_modules','external');
  assert(presentPlan.resolutionTriggers.includes('packages/app/node_modules/external'));
  fs.rmSync(externalLink);
  const missingRequired=discoverDeclared(config).plans.app;
  assert(missingRequired.unresolved.some(reason=>/requires unresolved installed package external/.test(reason)));
});

test('pnpm hoisted metadata is distinct and shared hardlinks with unknown aliases fail closed',t=>{
  const {root,external}=fixture(t,{hoisted:true});
  assert.equal(pnpmInstallInfo(root).linker,'hoisted');
  const config=runtime(root),baseline=discoverDeclared(config);
  const alias=path.join(root,'isolated-store-alias');
  fs.linkSync(path.join(external,'index.d.ts'),alias);
  const bundle=discoverDeclared(config);
  if(process.platform==='linux'){
    assert.equal(bundle.plans.app.id,baseline.plans.app.id);
    assert.equal(bundle.plans.app.synchronizedInstalledRead,true);
  }else{
    assert.notEqual(bundle.plans.app.id,baseline.plans.app.id);
    assert(bundle.plans.app.unresolved.some(reason=>/hardlinks/.test(reason)));
  }
  const probe=spawnSync(process.execPath,[path.resolve('src/pnpm-typecheck-probe.mjs'),
    root,'@fixture/app','typecheck'],{encoding:'utf8',env:cleanEnv});
  if(process.platform==='linux')assert.equal(probe.status,0);
  else{
    assert.equal(probe.status,2);
    assert.match(probe.stderr,/pnpm-input-coverage-unavailable/);
  }
  const index=new InputIndex(bundle,{trackGit:false});index.coldScan();
  assert.equal(index.unavailable,null);
  const before=index.fingerprint('app');
  put(alias,'export declare const ext: string;\n');
  index.updatePath(path.relative(root,path.join(external,'index.d.ts')).split(path.sep).join('/'));
  assert.notEqual(index.fingerprint('app'),before);
  fs.rmSync(alias);
  assert(fs.existsSync(path.join(external,'index.d.ts')));
});

test('pnpm observer replans after new local resolution topology without losing unrelated evidence',async t=>{
  const {root,external}=fixture(t),state=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-pnpm-state-'));
  fs.rmdirSync(state); // The CLI creates and owns this empty state directory.
  const cli=path.resolve('bin/redue.mjs'),runtime=path.join(state,'project-runtime-v1.json');
  const call=(...args)=>execFileSync(process.execPath,[cli,'--state-dir',state,...args],
    {cwd:root,encoding:'utf8',timeout:15000,env:cleanEnv});
  t.after(()=>{try{call('stop');}catch{}try{call('remove-state');}catch{}});
  call('init','--workspace','@fixture/app','--check','typecheck');
  call('start');
  call('run','@fixture/app:typecheck');
  const current=()=>JSON.parse(call('status','--sync','--json')).checks[0];
  const awaitCurrent=async()=>{
    let freshness;
    for(let i=0;i<30;i++){
      freshness=current().freshness;if(freshness==='CURRENT')break;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert.equal(freshness,'CURRENT');
  };
  await awaitCurrent();
  const metric=()=>JSON.parse(execFileSync(process.execPath,
    [path.resolve('src/cli.mjs'),runtime,'metrics'],{encoding:'utf8'})).metrics.planRebuilds;
  const before=metric();
  json(path.join(root,'packages/app/node_modules/new-unrelated/package.json'),
    {name:'new-unrelated',version:'1.0.0'});
  for(let i=0;i<15&&metric()===before;i++){
    await new Promise(resolve=>setTimeout(resolve,100));current();
  }
  assert(metric()>before,'new node_modules membership must cause plan rediscovery');
  await awaitCurrent();
  assert(fs.existsSync(path.join(external,'index.d.ts')));
});

test('Linux pnpm installed hardlink alias stales synchronized evidence without a lockfile edit',
  {skip:process.platform!=='linux'},async t=>{
  const {root,external}=fixture(t),state=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-pnpm-state-'));
  fs.rmdirSync(state);
  const store=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-pnpm-store-'));
  t.after(()=>fs.rmSync(store,{recursive:true,force:true}));
  const installed=path.join(external,'index.d.ts'),alias=path.join(store,'alias.d.ts');
  fs.linkSync(installed,alias);
  assert.equal(fs.statSync(installed).ino,fs.statSync(alias).ino);
  const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const lock=digest(path.join(root,'pnpm-lock.yaml'));
  const cli=path.resolve('bin/redue.mjs');
  const call=(...args)=>execFileSync(process.execPath,[cli,'--state-dir',state,...args],
    {cwd:root,encoding:'utf8',timeout:15000,env:cleanEnv});
  t.after(()=>{try{call('stop');}catch{}try{call('remove-state');}catch{}});
  call('init','--workspace','@fixture/app','--check','typecheck');
  call('start');
  const executed=JSON.parse(call('run','@fixture/app:typecheck'));
  assert.equal(executed.result,'PASS');
  assert.equal(executed.coverage_qualified,true);
  const status=()=>JSON.parse(call('status','--sync','--json')).checks[0];
  assert.equal(status().freshness,'CURRENT');
  assert.equal(JSON.parse(call('status','--json')).checks[0].freshness,'UNVERIFIED');
  put(alias,'export declare const ext: number;\n// modified through store alias\n');
  assert.equal(fs.readFileSync(installed,'utf8'),fs.readFileSync(alias,'utf8'));
  assert.equal(digest(path.join(root,'pnpm-lock.yaml')),lock);
  assert.equal(status().freshness,'STALE');
  assert.equal(JSON.parse(call('run','@fixture/app:typecheck')).result,'PASS');
  assert.equal(status().freshness,'CURRENT');
  put(path.join(store,'unrelated-cache-entry'),'other');
  assert.equal(status().freshness,'CURRENT');
});

test('pnpm hoisted installation can record and reuse a qualified TypeScript check',async t=>{
  const {root,external}=fixture(t,{hoisted:true});
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-pnpm-hoisted-'));
  fs.rmdirSync(state);
  const cli=path.resolve('bin/redue.mjs');
  const call=(...args)=>execFileSync(process.execPath,[cli,'--state-dir',state,...args],
    {cwd:root,encoding:'utf8',timeout:15000,env:cleanEnv});
  t.after(()=>{try{call('stop');}catch{}try{call('remove-state');}catch{}});
  const init=JSON.parse(call('init','--workspace','@fixture/app','--check','typecheck','--json'));
  assert.equal(init.installation_layout,'node-modules/hoisted');
  call('start');
  assert.equal(JSON.parse(call('run','@fixture/app:typecheck')).result,'PASS');
  const status=()=>JSON.parse(call('status','--sync','--json')).checks[0];
  assert.equal(status().freshness,'CURRENT');
  put(path.join(root,'unrelated.md'),'unrelated');
  assert.equal(status().freshness,'CURRENT');
  put(path.join(external,'index.d.ts'),'export declare const ext: number;\n// hoisted edit\n');
  assert.equal(status().freshness,'STALE');
});
