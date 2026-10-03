import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {discoverNodeProject} from '../src/node-onboarding.mjs';
import {discoverDeclared} from '../src/declared-plan.mjs';
import {InputIndex} from '../src/index.mjs';
import {yarnWorkspaceTypecheckInputs} from '../src/yarn-workspace-inputs.mjs';

const require=createRequire(import.meta.url);
const tsRoot=path.dirname(require.resolve('typescript/package.json'));
const bin=path.resolve('bin/redue.mjs');
const probe=path.resolve('src/yarn-workspace-typecheck-probe.mjs');
const cleanEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>
  !/^(npm_config_|YARN_|COREPACK_)/i.test(key)));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
const linkDir=(target,link)=>fs.symlinkSync(process.platform==='win32'?
  path.resolve(path.dirname(link),target):target,link,
  process.platform==='win32'?'junction':'dir');
const fixtureYarn=root=>path.join(root,process.platform==='win32'?
  'fixture-yarn.cmd':'fixture-yarn');
const fixture=t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'vstate-yarn-workspace-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  put(path.join(root,'package.json'),JSON.stringify({private:true,packageManager:'yarn@4.12.0',
    workspaces:['packages/*']}));
  put(path.join(root,'.yarnrc.yml'),'nodeLinker: node-modules\nnmMode: classic\n');
  put(path.join(root,'yarn.lock'),'# disposable fixture\n');
  put(path.join(root,'.gitignore'),'node_modules/\nlib/\n');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,
    moduleResolution:'node',target:'ES2020'},include:['src']}));
  const packages=[['chosen',{'@fixture/dep':'workspace:*',external:'1.0.0'}],
    ['dep',{}],['sibling',{}]];
  for(const [name,deps] of packages){
    const dir=path.join(root,'packages',name);
    put(path.join(dir,'package.json'),JSON.stringify({name:`@fixture/${name}`,
      types:'lib/index.d.ts',scripts:{typecheck:'tsc -p .'},dependencies:deps}));
    put(path.join(dir,'tsconfig.json'),JSON.stringify({extends:'../../tsconfig.json',
      include:['src']}));
    put(path.join(dir,'src/index.ts'),name==='chosen'?"import {value} from '@fixture/dep'; export const result=value;\n":
      `export const value: number = ${name==='dep'?1:2};\n`);
    put(path.join(dir,'lib/index.d.ts'),'export declare const value: number;\n');
  }
  fs.mkdirSync(path.join(root,'node_modules','@fixture'),{recursive:true});
  for(const [name] of packages)linkDir(`../../packages/${name}`,
    path.join(root,'node_modules','@fixture',name));
  put(path.join(root,'node_modules','external','index.d.ts'),'export declare const e: number;\n');
  put(path.join(root,'node_modules','.yarn-state.yml'),'state: fixture\n');
  fs.cpSync(tsRoot,path.join(root,'node_modules','typescript'),{recursive:true});
  fs.mkdirSync(path.join(root,'node_modules','.bin'),{recursive:true});
  if(process.platform==='win32'){
    put(path.join(root,'node_modules','.bin','tsc.cmd'),`@IF EXIST "%~dp0\\node.exe" (\r
  "%~dp0\\node.exe"  "%~dp0\\..\\typescript\\bin\\tsc" %*\r
) ELSE (\r
  @SETLOCAL\r
  @SET PATHEXT=%PATHEXT:;.JS;=;%\r
  node  "%~dp0\\..\\typescript\\bin\\tsc" %*\r
)\r
`);
    const loader='tools\\corepack\\dist\\yarn.js';
    put(fixtureYarn(root),`@SETLOCAL\r
@IF EXIST "%~dp0\\node.exe" (\r
  "%~dp0\\node.exe"  "%~dp0\\${loader}" %*\r
) ELSE (\r
  @SET PATHEXT=%PATHEXT:;.JS;=;%\r
  node  "%~dp0\\${loader}" %*\r
)\r
`);
    put(path.join(root,'tools','corepack','dist','yarn.js'),
      "process.stdout.write('4.12.0\\n');\n");
    put(path.join(root,'corepack-home','v1','yarn','4.12.0','yarn.js'),
      "process.stdout.write('4.12.0\\n');\n");
  }else{
    fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules','.bin','tsc'));
    put(fixtureYarn(root),'#!/bin/sh\necho 4.12.0\n');
  }
  fs.chmodSync(fixtureYarn(root),0o755);
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['add','package.json','.yarnrc.yml','yarn.lock','tsconfig.json',
    '.gitignore','packages'],{cwd:root});
  return root;
};

test('pinned Yarn workspace init derives only the selected closure and a readable config',t=>{
  const root=fixture(t),found=discoverNodeProject(root),selected=found.checks.find(row=>
    row.config.name==='@fixture/chosen:typecheck');
  assert.equal(selected.level,'ready');
  assert.equal(selected.config.workspace,'@fixture/chosen');
  assert.equal(selected.config.qualification,'yarn-workspace-tsc-v1');
  assert(!JSON.stringify(selected.config).includes('packages/dep/lib'));
  const derived=yarnWorkspaceTypecheckInputs(root,'@fixture/chosen','typecheck');
  assert.deepEqual(derived.closure.map(row=>row.name),['@fixture/dep']);
  assert(derived.generated.includes('packages/dep/lib/**'));
  assert(!derived.source.some(value=>value.startsWith('packages/sibling/')));
  assert(derived.installed.includes('node_modules/**'));
  const preview=spawnSync(process.execPath,[bin,'init','--dry-run','--workspace',
    '@fixture/chosen','--check','typecheck','--json'],{cwd:root,encoding:'utf8'});
  assert.equal(preview.status,0,preview.stderr);
  assert.equal(JSON.parse(preview.stdout).checks.length,1);
  assert(!fs.existsSync(path.join(root,'redue.config.json')));
  const probeResult=spawnSync(process.execPath,[probe,root,'@fixture/chosen',
    'typecheck',fixtureYarn(root)],{cwd:root,encoding:'utf8',
    env:process.platform==='win32'?{...cleanEnv,COREPACK_HOME:path.join(root,'corepack-home')}:
      cleanEnv});
  assert.equal(probeResult.status,0,probeResult.stderr);
  assert.match(probeResult.stdout,/^[a-f0-9]{64}$/);
  const tsconfig=path.join(root,'packages/chosen/tsconfig.json');
  put(tsconfig,JSON.stringify({extends:'../../tsconfig.json',include:['src'],
    compilerOptions:{paths:{'*':['../../outside/*']}}}));
  const conservative=discoverNodeProject(root).checks.find(row=>
    row.config.name==='@fixture/chosen:typecheck');
  assert.equal(conservative.level,'recording');
  assert.match(conservative.reason,/module resolution/);
  put(path.join(root,'.yarnrc.yml'),'nodeLinker: pnp\n');
  const unsupported=discoverNodeProject(root).checks.find(row=>
    row.config.name==='@fixture/chosen:typecheck');
  assert.equal(unsupported.level,'unsupported');
  put(path.join(root,'.yarnrc.yml'),'nodeLinker: node-modules\n');
  put(tsconfig,JSON.stringify({extends:'../../tsconfig.json',include:['src']}));
  put(path.join(root,'packages/chosen/node_modules/.bin/tsc'),'different compiler');
  const localCompiler=discoverNodeProject(root).checks.find(row=>
    row.config.name==='@fixture/chosen:typecheck');
  assert.equal(localCompiler.level,'recording');
  assert.match(localCompiler.reason,/workspace-local TypeScript/);
});

test('incremental workspace, generated and installed membership matches fresh recomputation',t=>{
  const root=fixture(t),derived=yarnWorkspaceTypecheckInputs(root,'@fixture/chosen','typecheck');
  const config={root,checks:[{name:'chosen',command:['/bin/true','workspace',
    '@fixture/chosen','run','typecheck'],workspace:'@fixture/chosen',
    qualification:'yarn-workspace-tsc-v1',inputs:['package.json','yarn.lock',
      '.yarnrc.yml','packages/chosen/src/**'],environment:{executableIdentity:true,
      pathExecutables:['node','yarn'],prefixes:['YARN_','COREPACK_',
        'npm_config_','DYLD_','TSGO_']},
    probes:[['node','/product/yarn-workspace-typecheck-probe.mjs']]}]};
  const bundle=discoverDeclared(config),name='chosen',index=new InputIndex(bundle,{trackGit:false});
  assert.deepEqual(bundle.plans[name].unresolved,[]);
  index.coldScan();assert.equal(index.unavailable,null);
  const baseline=index.fingerprint(name);
  const oracle=()=>{const fresh=new InputIndex(discoverDeclared(config),{trackGit:false});
    fresh.coldScan();assert.equal(fresh.unavailable,null);return fresh.fingerprint(name);};
  assert.equal(baseline,oracle());
  const change=(rel,content)=>{put(path.join(root,rel),content);index.updatePath(rel);
    assert.equal(index.fingerprint(name),oracle());};
  change('packages/sibling/src/index.ts','export const value=99;\n');
  assert.equal(index.fingerprint(name),baseline);
  change('packages/dep/src/index.ts','export const value: number = 99;\n');
  assert.equal(index.fingerprint(name),baseline); // The check consumes built declarations.
  change('packages/chosen/lib/index.d.ts','export declare const result: string;\n');
  assert.equal(index.fingerprint(name),baseline); // Own emitted outputs are not inputs.
  change('packages/dep/lib/index.d.ts','export declare const value: string;\n');
  assert.notEqual(index.fingerprint(name),baseline);
  change('packages/dep/lib/index.d.ts','export declare const value: number;\n');
  assert.equal(index.fingerprint(name),baseline);
  change('packages/dep/lib/new.d.ts','export declare const extra: number;\n');
  assert.notEqual(index.fingerprint(name),baseline);
  fs.rmSync(path.join(root,'packages/dep/lib/new.d.ts'));
  index.updatePath('packages/dep/lib/new.d.ts');
  assert.equal(index.fingerprint(name),oracle());assert.equal(index.fingerprint(name),baseline);
  change('packages/chosen/src/new.ts','export const added=true;\n');
  assert.notEqual(index.fingerprint(name),baseline);
  fs.rmSync(path.join(root,'packages/chosen/src/new.ts'));
  index.updatePath('packages/chosen/src/new.ts');assert.equal(index.fingerprint(name),oracle());
  assert.equal(index.fingerprint(name),baseline);
  change('node_modules/external/index.d.ts','export declare const e: string;\n');
  assert.notEqual(index.fingerprint(name),baseline);
  change('node_modules/external/index.d.ts','export declare const e: number;\n');
  assert.equal(index.fingerprint(name),baseline);
  change('node_modules/external/new.d.ts','export declare const n: number;\n');
  assert.notEqual(index.fingerprint(name),baseline);
  fs.rmSync(path.join(root,'node_modules/external/new.d.ts'));
  index.updatePath('node_modules/external/new.d.ts');
  assert.equal(index.fingerprint(name),oracle());assert.equal(index.fingerprint(name),baseline);
  const link=path.join(root,'node_modules/@fixture/dep');fs.rmSync(link);
  linkDir('../../packages/sibling',link);
  const changed=discoverDeclared(config);
  assert.notEqual(changed.plans[name].id,bundle.plans[name].id);
  assert(derived.linkTriggers.includes('node_modules/@fixture/dep'));
  const changedProbe=spawnSync(process.execPath,[probe,root,'@fixture/chosen',
    'typecheck',fixtureYarn(root)],{cwd:root,encoding:'utf8',env:cleanEnv});
  assert.notEqual(changedProbe.status,0);
  assert.match(changedProbe.stderr,/typescript-input-outside-workspace-contract/);
  fs.rmSync(link);linkDir(path.join(os.tmpdir(),'not-permitted-vstate-dependency'),link);
  const disallowed=discoverDeclared(config).plans[name].unresolved;
  assert(disallowed.some(reason=>reason.includes('@fixture/dep')),
    JSON.stringify(disallowed));
});
