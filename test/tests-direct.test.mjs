import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {testPackageManager,testScript,testRecipeScript} from '../src/test-direct.mjs';
import {resolveDeclaredInstalled} from '../src/installed-inputs.mjs';
import {realObservedPath} from '../src/path-identity.mjs';

const bin=path.resolve('bin/redue.mjs');
const unsupported=process.platform==='win32'?'the test recipe records runs on macOS and Linux':false;
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
// A stand-in runner: it reads src/value.js and, depending on its words, reads
// README.md, reads an environment variable, or alternates its result.
const fakeRunner=`import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
const value=fs.readFileSync('src/value.js','utf8');
if(value.includes('readme'))fs.readFileSync('README.md');
if(value.includes('flag'))void process.env.REDUE_FAKE_FLAG;
// Read an earlier coverage report, as Jest's haste map does, then write a new one.
if(value.includes('coverage')){
  try{fs.readFileSync('coverage/lcov-report/sorter.js');}catch{}
  fs.mkdirSync('coverage/lcov-report',{recursive:true});fs.writeFileSync('coverage/lcov-report/sorter.js','report');
}
if(value.includes('many'))for(let i=0;i<300;i++)void process.env['REDUE_FAKE_MANY_'+i];
if(value.includes('shell'))void process.env.SHELL,process.env._;
// Output in a git-ignored directory: written and read back, or a leftover read first.
if(value.includes('leftover'))fs.readFileSync('test/tmp/out.txt');
if(value.includes('output')||value.includes('leftover')){
  fs.mkdirSync('test/tmp',{recursive:true});fs.writeFileSync('test/tmp/out.txt','run');fs.readFileSync('test/tmp/out.txt');
}
// Check, fail to read, then write a new file in an existing ignored directory.
if(value.includes('probe')&&!fs.existsSync('test/tmp/new.json')){
  try{fs.readFileSync('test/tmp/new.json');}catch{}fs.writeFileSync('test/tmp/new.json','{}');fs.readFileSync('test/tmp/new.json');
}
if(value.includes('flip')){
  // State REDUE does not observe: a runner cache in the temporary directory.
  const dir=path.join(os.tmpdir(),'jest_redue-fake-'+createHash('sha256').update(process.cwd()).digest('hex').slice(0,12));
  fs.mkdirSync(dir,{recursive:true});
  let n=0;try{n=Number(fs.readFileSync(path.join(dir,'flip'),'utf8'));}catch{}fs.writeFileSync(path.join(dir,'flip'),String(n+1));process.exit(n%2);
}
process.exit(value.includes('fail')?1:0);
`;
function project(t,{script='vitest run',runner='vitest',version='4.1.4',manager='npm'}={}){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'rt-')),
    root=path.join(base,'project'),state=path.join(base,'redue-state');
  const pin={npm:undefined,pnpm:'pnpm@10.8.1+sha512.0a1b',yarn:'yarn@4.12.0'}[manager];
  put(path.join(root,'package.json'),JSON.stringify({name:'tests-fixture',version:'1.0.0',scripts:{test:script},...(pin?{packageManager:pin}:{})}));
  if(manager==='npm')put(path.join(root,'package-lock.json'),'{"name":"tests-fixture","lockfileVersion":3}');
  if(manager==='yarn'){put(path.join(root,'yarn.lock'),'__metadata:\n  version: 8\n');put(path.join(root,'.yarnrc.yml'),'nodeLinker: node-modules\n');}
  if(manager==='pnpm'){
    put(path.join(root,'pnpm-lock.yaml'),"lockfileVersion: '9.0'\n");
    put(path.join(root,'node_modules/.modules.yaml'),JSON.stringify({nodeLinker:'isolated',packageManager:'pnpm@10.8.1',virtualStoreDir:'.pnpm'}));
    put(path.join(root,'node_modules/.pnpm/lock.yaml'),"lockfileVersion: '9.0'\n");
  }
  put(path.join(root,'src/value.js'),'pass\n');
  put(path.join(root,'README.md'),'# fixture\n');
  put(path.join(root,'.gitignore'),'node_modules/\n.env.local\ntest/tmp\n');
  const entry=runner==='vitest'?'vitest.mjs':'bin/jest.js';
  // pnpm keeps the package in its virtual store and links it from node_modules.
  const installed=manager==='pnpm'?path.join(root,'node_modules/.pnpm',`${runner}@${version}`,'node_modules',runner):path.join(root,'node_modules',runner);
  put(path.join(installed,'package.json'),JSON.stringify({name:runner,version,bin:{[runner]:entry},type:'module'}));
  put(path.join(installed,entry),fakeRunner);
  if(manager==='pnpm')fs.symlinkSync(path.relative(path.join(root,'node_modules'),installed),path.join(root,'node_modules',runner),'dir');
  if(runner==='jest'){
    put(path.join(root,'node_modules/jest-util/package.json'),JSON.stringify({name:'jest-util',version:'29.7.0'}));
    put(path.join(root,'node_modules/jest-util/build/createProcessObject.js'),'exports.default=()=>process;\n');
  }
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['add','.'],{cwd:root});
  t.after(()=>{try{invoke(root,state,{},'stop');}catch{}
    const flip=path.join(os.tmpdir(),'jest_redue-fake-'+createHash('sha256').update(fs.realpathSync(root)).digest('hex').slice(0,12));
    fs.rmSync(flip,{recursive:true,force:true});fs.rmSync(base,{recursive:true,force:true});});
  return {root,state,config:path.join(root,'redue.config.json')};
}
function invoke(root,state,env,...args){
  const clean=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)&&key!=='REDUE_FAKE_FLAG'));
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env:{...clean,...env},encoding:'utf8',timeout:60000});
}
function good(root,state,...args){const result=invoke(root,state,{},...args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);return result.stdout;}
const row=(root,state,env={})=>{const result=invoke(root,state,env,'status','--sync','--json');
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout).checks.find(c=>c.name==='test');};
const write=(root,file,text)=>fs.writeFileSync(path.join(root,file),text);

test('test scripts: only a single direct, non-watching runner invocation qualifies',()=>{
  assert.deepEqual(testScript('vitest run'),{runner:'vitest',args:['run']});
  assert.deepEqual(testScript('vitest --config ./vitest.config.mts --watch=false'),
    {runner:'vitest',args:['--config','./vitest.config.mts','--watch=false']});
  assert.deepEqual(testScript('jest spec --coverage --detectOpenHandles --testPathIgnorePatterns=spec/cluster').args.length,4);
  for(const [script,code] of [['vitest','test-watch-mode'],['vitest watch','test-arguments-unsupported'],
    ['vitest run -u','test-arguments-unsupported'],['vitest run --changed','test-arguments-unsupported'],
    ['jest --watch','test-arguments-unsupported'],['jest --onlyChanged','test-arguments-unsupported'],
    ['jest --randomize','test-arguments-unsupported'],['jest "spec"','test-script-unsupported'],
    ['jest src/*.test.js','test-script-unsupported'],['npm run lint && vitest run','test-script-unsupported'],
    ['CI=1 vitest run','test-runner-unsupported'],['mocha','test-runner-unsupported']])
    assert.throws(()=>testScript(script),{code},script);
  assert.deepEqual(testRecipeScript({test:'npm run lint && npm run test:vi','test:vi':'vitest run'}),{script:'test:vi'});
  assert.deepEqual(testRecipeScript({'a':'vitest run','b':'jest'}),{ambiguous:['a','b']});
});

test('a recorded test pass stays CURRENT across documentation edits and goes STALE on a source edit',{skip:unsupported},t=>{
  const {root,state,config}=project(t);
  const init=JSON.parse(good(root,state,'init','--recipe','tests-direct','--check','test','--json'));
  assert.equal(init.checks[0].level,'ready',init.checks[0].reason);
  const check=JSON.parse(fs.readFileSync(config,'utf8')).checks[0];
  assert.deepEqual(check.command,['@node','@test-runner:vitest','run']);
  assert.equal(check.qualification,'npm-tests-direct-v1');
  assert.deepEqual(check.installedInputs,['node_modules/**','!node_modules/.vite/**','!node_modules/.vite-temp/**','!node_modules/.vitest/**',
    '!node_modules/vitest/dist/tsconfig.tmp.tsbuildinfo']);
  good(root,state,'start');
  good(root,state,'run','test');
  let status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.reuse_eligible,true);
  write(root,'README.md','# fixture\n\nMore words.\n');
  status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  write(root,'src/value.js','fail\n');
  status=row(root,state);
  assert.equal(status.freshness,'STALE',status.reason);
  assert.equal(invoke(root,state,{},'run','test').status,1);
  status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/FAIL',status.reason);
  assert.equal(status.reuse_eligible,false);
});

test('reading an excluded file is UNVERIFIED; a variable the run read must keep its value, set or unset',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
  write(root,'src/value.js','readme\n');good(root,state,'run','test');
  let status=row(root,state);
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/read README\.md, which the check's inputs exclude/);
  write(root,'src/value.js','flag\n');
  assert.equal(invoke(root,state,{REDUE_FAKE_FLAG:'1'},'run','test').status,0);
  status=row(root,state,{REDUE_FAKE_FLAG:'1'});
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  for(const env of [{REDUE_FAKE_FLAG:'2'},{}]){
    status=row(root,state,env);
    assert.equal(status.freshness,'STALE');
    assert.match(status.reason,/environment variable REDUE_FAKE_FLAG differs from the last run/);
  }
  good(root,state,'run','test');
  status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  status=row(root,state,{REDUE_FAKE_FLAG:'1'});
  assert.equal(status.freshness,'STALE');
});

test('a run that reads hundreds of variables still gets an answer',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
  write(root,'src/value.js','many\n');good(root,state,'run','test');
  let status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  status=row(root,state,{REDUE_FAKE_MANY_299:'x'});
  assert.match(status.reason,/environment variable REDUE_FAKE_MANY_299 differs/);
});

test('runs on the same inputs with different results make the check UNVERIFIED until the inputs change',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
  write(root,'src/value.js','flip\n');
  assert.equal(invoke(root,state,{},'run','test').status,0);
  assert.equal(row(root,state).freshness,'CURRENT');
  assert.equal(invoke(root,state,{},'run','test').status,1);
  let status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'UNVERIFIED/FAIL');
  assert.match(status.reason,/different results/);
  assert.equal(invoke(root,state,{},'run','test').status,0);
  assert.equal(row(root,state).freshness,'UNVERIFIED');
  write(root,'src/value.js','pass\n');good(root,state,'run','test');
  assert.equal(row(root,state).freshness,'CURRENT');
});

test('init: Jest coverage excludes its report; watch mode and other scripts stay recording-only',{skip:unsupported},t=>{
  const jest=project(t,{script:'jest spec --coverage',runner:'jest',version:'29.7.0'});
  const config=JSON.parse(good(jest.root,jest.state,'init','--recipe','tests-direct','--check','test','--dry-run','--json')).proposed_config;
  assert.deepEqual(config.checks[0].command,['@node','@test-runner:jest','spec','--coverage']);
  assert.ok(config.checks[0].inputs.includes('!coverage/**'));
  const watch=project(t,{script:'vitest'});
  const preview=JSON.parse(good(watch.root,watch.state,'init','--recipe','tests-direct','--check','test','--dry-run','--json'));
  assert.equal(preview.checks[0].level,'recording');
  assert.match(preview.checks[0].reason,/test-watch-mode/);
  const old=project(t,{version:'3.2.4'});
  const older=JSON.parse(good(old.root,old.state,'init','--recipe','tests-direct','--check','test','--dry-run','--json'));
  assert.match(older.checks[0].reason,/test-runner-version-unsupported/);
});

test('a run\'s output in an ignored directory is not an input; reading a leftover first is UNVERIFIED',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
  write(root,'src/value.js','output\n');good(root,state,'run','test');
  let status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  good(root,state,'run','test');
  status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  write(root,'src/value.js','probe\n');good(root,state,'run','test');
  status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  write(root,'src/value.js','leftover\n');good(root,state,'run','test');
  status=row(root,state);
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/input event occurred during execution/);
});

test('a SHELL the run read is compared; the shell\'s `_` is ignored',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
  write(root,'src/value.js','shell\n');
  assert.equal(invoke(root,state,{SHELL:'/bin/sh',_:'/usr/bin/one'},'run','test').status,0);
  let status=row(root,state,{SHELL:'/bin/sh',_:'/usr/bin/two'});
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  status=row(root,state,{SHELL:'/bin/zsh'});
  assert.equal(status.freshness,'STALE');
  assert.match(status.reason,/environment variable SHELL differs/);
});

test('a --coverage run may read back its report, unless the project sets coverage thresholds',{skip:unsupported},t=>{
  for(const thresholds of [false,true]){
    const {root,state}=project(t,{script:'jest spec --coverage',runner:'jest',version:'29.7.0'});
    if(thresholds){const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
      pkg.jest={coverageThreshold:{global:{lines:80}}};write(root,'package.json',JSON.stringify(pkg));
      execFileSync('git',['add','package.json'],{cwd:root});}
    good(root,state,'init','--recipe','tests-direct','--check','test');good(root,state,'start');
    write(root,'src/value.js','coverage\n');good(root,state,'run','test');good(root,state,'run','test');
    const status=row(root,state);
    if(thresholds){assert.equal(status.freshness,'UNVERIFIED');assert.match(status.reason,/read coverage\/lcov-report\/sorter\.js/);}
    else assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  }
});

test('an excluded runner cache appearing does not change the input plan',()=>{
  // The observed spelling: on Windows the native realpath, not an 8.3 short name.
  const root=realObservedPath(fs.mkdtempSync(path.join(os.tmpdir(),'rt-plan-')));
  try{
    put(path.join(root,'node_modules/vitest/package.json'),'{}');
    const patterns=['node_modules/**','!node_modules/.vite/**','!node_modules/vitest/dist/tsconfig.tmp.tsbuildinfo'];
    const before=resolveDeclaredInstalled(root,patterns);
    put(path.join(root,'node_modules/.vite/vitest/results.json'),'{}');
    put(path.join(root,'node_modules/vitest/dist/tsconfig.tmp.tsbuildinfo'),'{}');
    assert.deepEqual(resolveDeclaredInstalled(root,patterns),before);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('pnpm and Yarn node-modules installs qualify like npm; the runner may be linked into the virtual store',{skip:unsupported},t=>{
  for(const manager of ['pnpm','yarn']){
    const {root,state,config}=project(t,{manager});
    const init=JSON.parse(good(root,state,'init','--recipe','tests-direct','--check','test','--json'));
    assert.equal(init.checks[0].level,'ready',`${manager}: ${init.checks[0].reason}`);
    assert.equal(JSON.parse(fs.readFileSync(config,'utf8')).packageManager,manager);
    good(root,state,'start');good(root,state,'run','test');
    let status=row(root,state);
    assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',`${manager}: ${status.reason}`);
    write(root,'src/value.js','fail\n');
    status=row(root,state);assert.equal(status.freshness,'STALE',`${manager}: ${status.reason}`);
    write(root,'src/value.js','pass\n');good(root,state,'run','test');
    // The runner's installed files are inputs, through the link too.
    const real=fs.realpathSync(path.join(root,'node_modules/vitest/vitest.mjs'));
    fs.appendFileSync(real,'\n');
    status=row(root,state);assert.notEqual(status.freshness,'CURRENT',`${manager}: ${status.reason}`);
    good(root,state,'stop');
  }
});

test('the test recipe takes one supported package manager without workspaces',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rt-pm-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const pm=(files,pkg={})=>{const root=fs.mkdtempSync(path.join(dir,'p-'));
    for(const [file,text] of Object.entries(files))put(path.join(root,file),text);
    try{return testPackageManager(root,{name:'x',...pkg});}catch(e){return e.code;}};
  assert.equal(pm({'package-lock.json':'{}'}),'npm');
  assert.equal(pm({'yarn.lock':'','.yarnrc.yml':'nodeLinker: node-modules\n'},{packageManager:'yarn@4.12.0'}),'yarn');
  assert.equal(pm({'yarn.lock':''},{packageManager:'yarn@1.22.22'}),'yarn');
  for(const [files,pkg,code] of [
    [{'yarn.lock':'','.yarnrc.yml':'nodeLinker: pnp\n'},{packageManager:'yarn@4.12.0'},'test-yarn-install-unsupported'],
    [{'yarn.lock':''},{packageManager:'yarn@4.12.0'},'test-yarn-install-unsupported'],
    [{'yarn.lock':''},{},'test-yarn-install-unsupported'],
    [{'pnpm-lock.yaml':''},{packageManager:'pnpm@10.8.1'},'test-pnpm-install-unsupported'],
    [{'bun.lock':''},{},'test-package-manager-unsupported'],
    [{'package-lock.json':'{}','yarn.lock':''},{},'test-package-manager-unsupported'],
    [{'package-lock.json':'{}'},{packageManager:'pnpm@10.8.1'},'test-package-manager-unsupported'],
    [{},{},'test-package-manager-unsupported'],
    [{'package-lock.json':'{}'},{workspaces:['packages/*']},'test-workspace-unsupported'],
    [{'yarn.lock':'','.yarnrc.yml':'nodeLinker: node-modules\nnmMode: hardlinks-global\n'},{packageManager:'yarn@4.12.0'},'test-yarn-install-unsupported'],
    [{'yarn.lock':'','.yarnrc.yml':'packageExtensions:\n  nodeLinker: node-modules\n'},{packageManager:'yarn@4.12.0'},'test-yarn-install-unsupported']])
    assert.equal(pm(files,pkg),code,JSON.stringify([files,pkg]));
});

test('an installed link to a directory outside the installed tree still makes observation unavailable',{skip:unsupported},t=>{
  const {root,state}=project(t,{manager:'pnpm'});
  good(root,state,'init','--recipe','tests-direct','--check','test','--json');
  fs.symlinkSync('../src',path.join(root,'node_modules','stray'),'dir');
  good(root,state,'start');
  const cached=JSON.parse(invoke(root,state,{},'status','--json').stdout).observation;
  assert.equal(cached.healthy,false);assert.match(cached.reason,/directory input symlink unsupported: node_modules\/stray/);
  good(root,state,'stop');
});

test('pnpm: a settings-only pnpm-workspace.yaml is no workspace; packages make one; hard-linked installs are UNVERIFIED',{skip:unsupported},t=>{
  const {root,state}=project(t,{manager:'pnpm'});
  put(path.join(root,'pnpm-workspace.yaml'),'onlyBuiltDependencies:\n  - esbuild\n');
  assert.equal(testPackageManager(root,JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))),'pnpm');
  put(path.join(root,'pnpm-workspace.yaml'),'packages:\n  - packages/*\n');
  assert.throws(()=>testPackageManager(root,JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))),{code:'test-workspace-unsupported'});
  fs.rmSync(path.join(root,'pnpm-workspace.yaml'));
  good(root,state,'init','--recipe','tests-direct','--check','test','--json');
  good(root,state,'start');
  // A second link to an installed file, as a package store would hold.
  const store=fs.mkdtempSync(path.join(os.tmpdir(),'rt-store-'));t.after(()=>fs.rmSync(store,{recursive:true,force:true}));
  fs.linkSync(fs.realpathSync(path.join(root,'node_modules/vitest/vitest.mjs')),path.join(store,'vitest.mjs'));
  good(root,state,'run','test');
  const status=row(root,state);
  assert.equal(status.freshness,'UNVERIFIED');assert.match(status.reason,/has another hard link/);
  good(root,state,'stop');
});

test('installed links: one to the checkout root is refused; an event on an observed package link keeps observation',{skip:unsupported},t=>{
  const {root,state}=project(t,{manager:'pnpm'});
  good(root,state,'init','--recipe','tests-direct','--check','test','--json');
  good(root,state,'start');good(root,state,'run','test');
  // pnpm re-creating the package link: an event on the link itself.
  const link=path.join(root,'node_modules/vitest'),target=fs.readlinkSync(link);
  fs.unlinkSync(link);fs.symlinkSync(target,link,'dir');
  let status=row(root,state);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  fs.symlinkSync('..',path.join(root,'node_modules/self'),'dir');
  status=row(root,state);
  assert.notEqual(status.freshness,'CURRENT',status.reason);
  good(root,state,'stop');
});
