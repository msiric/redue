import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {testScript,testRecipeScript} from '../src/test-direct.mjs';

const bin=path.resolve('bin/redue.mjs');
const unsupported=process.platform==='win32'?'the test recipe records runs on macOS and Linux':false;
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
// A stand-in runner: it reads src/value.js and, depending on its words, reads
// README.md, reads an environment variable, or alternates its result.
const fakeRunner=`import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
const value=fs.readFileSync('src/value.js','utf8');
if(value.includes('readme'))fs.readFileSync('README.md');
if(value.includes('flag'))void process.env.REDUE_FAKE_FLAG;
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
function project(t,{script='vitest run',runner='vitest',version='4.1.4'}={}){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'rt-')),
    root=path.join(base,'project'),state=path.join(base,'redue-state');
  put(path.join(root,'package.json'),JSON.stringify({name:'tests-fixture',version:'1.0.0',scripts:{test:script}}));
  put(path.join(root,'package-lock.json'),'{"name":"tests-fixture","lockfileVersion":3}');
  put(path.join(root,'src/value.js'),'pass\n');
  put(path.join(root,'README.md'),'# fixture\n');
  put(path.join(root,'.gitignore'),'node_modules/\n.env.local\ntest/tmp\n');
  const entry=runner==='vitest'?'vitest.mjs':'bin/jest.js';
  put(path.join(root,'node_modules',runner,'package.json'),JSON.stringify({name:runner,version,bin:{[runner]:entry},type:'module'}));
  put(path.join(root,'node_modules',runner,entry),fakeRunner);
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
  assert.deepEqual(check.installedInputs,['node_modules/**','!node_modules/.vite/**','!node_modules/.vite-temp/**','!node_modules/.vitest/**']);
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
