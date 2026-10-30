import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {comparableOutput,denialLine,sandboxCheckInputs,sandboxEnv,sandboxEnvironment,sandboxPath,sandboxSupport,venvOutsideLinks} from '../src/sandbox.mjs';
import {projectArgs,toolArgs} from '../src/python-onboarding.mjs';
import {chainCommand,hookForms,pathForm,recordedCommand} from '../src/claude-hook.mjs';

const bin=path.resolve('bin/redue.mjs');
const support=sandboxSupport();
const python3=['/usr/bin/python3','/opt/homebrew/bin/python3','/usr/local/bin/python3'].find(file=>fs.existsSync(file));
const unsupported=!['darwin','linux'].includes(process.platform)?'the sandboxed recipe runs on macOS and Linux':
  support.issue?`the sandbox cannot run here: ${support.issue}`:!python3?'needs python3':false;
const put=(file,value,mode)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,mode?{mode}:undefined);};

// A Python project with a .venv whose `mypy` and `ruff` are small Python
// programs: they read every .py file under the project, and fail, read a
// file outside, or reach the network when a file says so.
function project(t,{makefile=null,tools=['mypy','ruff']}={}){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-'))),root=path.join(base,'project'),state=path.join(base,'redue-state');
  const outside=path.join(base,'outside.txt');put(outside,'outside\n');
  put(path.join(root,'pyproject.toml'),'[project]\nname = "fx"\nversion = "0.1"\n\n[tool.mypy]\nfiles = ["src"]\n');
  put(path.join(root,'.gitignore'),'.venv/\nbuild/\n__pycache__/\n');
  put(path.join(root,'src/fx/__init__.py'),'value = 1\n');
  put(path.join(root,'README.md'),'# fixture\n');
  if(makefile)put(path.join(root,'Makefile'),makefile);
  execFileSync(python3,['-m','venv','--without-pip',path.join(root,'.venv')]);
  for(const tool of tools)put(path.join(root,'.venv/bin',tool),`#!${path.join(root,'.venv/bin/python')}
import os, sys, pathlib, socket
text = ''.join(p.read_text() for p in sorted(pathlib.Path('.').rglob('*.py')) if '.venv' not in p.parts)
if 'outside' in text: open(${JSON.stringify(outside)}).read()
if 'network' in text:
    try: socket.create_connection(('127.0.0.1', 9), timeout=2)
    except ConnectionRefusedError: pass
if 'environment' in text: print('PYTHONPATH', os.environ.get('PYTHONPATH'))
if 'home' in text: pathlib.Path(os.environ['HOME'], 'cache.txt').write_text('x')
if 'secret' in text: print('secret', os.environ.get('REDUE_TEST_SECRET'))
if 'daemon' in text:
    import subprocess
    group = subprocess.Popen(['sleep', '30'])
    session = subprocess.Popen(['sleep', '30'], start_new_session=True)
    print('background', group.pid, session.pid)
if 'selfkill' in text: os.kill(os.getpid(), 9)
if 'unixsocket' in text:
    import tempfile
    for where, at in (('checkout', 's.sock'), ('temporary', os.path.join(tempfile.gettempdir(), 's.sock'))):
        try:
            server = socket.socket(socket.AF_UNIX); server.bind(at); server.listen(1)
            print('unix socket', where, 'ok'); os.unlink(at)
        except OSError as e: print('unix socket', where, 'refused', e)
if 'gitdir' in text: print('git directory', os.path.isdir('.git'), os.path.isfile('.git/HEAD'))
print('${tool}', sys.argv[1:])
sys.exit(1 if 'fail' in text else 0)
`,0o755);
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  // A run's background helper can still be writing as the test ends.
  t.after(()=>{try{invoke(root,state,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true,maxRetries:10,retryDelay:300});});
  return {root,state,outside};
}
function invoke(root,state,args,env={}){
  const clean=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key)));
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env:{...clean,...env},encoding:'utf8',timeout:120000});
}
function good(root,state,...args){const result=invoke(root,state,args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);return result.stdout;}
const row=(root,state,name,env={})=>{const result=invoke(root,state,['status','--sync','--json'],env);
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout).checks.find(c=>c.name===name);};
const write=(root,file,text)=>put(path.join(root,file),text);

test('a Python tool\'s arguments: as the project runs it, through uv, Poetry, python -m or .venv/bin',()=>{
  const mypy={tool:'mypy',sub:[]},ruff={tool:'ruff',sub:['check']},ty={tool:'ty',sub:['check']};
  assert.deepEqual(toolArgs('      - run: uv run mypy src tests',mypy),['src','tests']);
  assert.deepEqual(toolArgs('\tpoetry run python -m mypy --strict src && echo done',mypy),['--strict','src']);
  assert.deepEqual(toolArgs('uv run --frozen --group lint ruff check .',ruff),['.']);
  assert.deepEqual(toolArgs('.venv/bin/ty check',ty),[]);
  assert.equal(toolArgs('ruff format --check .',ruff),null);
  assert.equal(toolArgs('ruff check --fix .',ruff),null);
  assert.equal(toolArgs('mypy $FILES',mypy),null);
  assert.equal(toolArgs('mypy ../other',mypy),null);
  assert.equal(toolArgs('pip install mypy',mypy),null);
});

// POSIX paths: the sandboxed recipe runs on macOS and Linux only.
const posix=process.platform==='win32'?'the sandboxed recipe runs on macOS and Linux':false;
test('denial lines, the normalized PATH and the controlled environment',{skip:posix},()=>{
  assert.equal(denialLine('src/a.ts(1,1): error TS2322\nfatal: unable to access \'/home/u/.gitconfig\': Permission denied\n'),
    'fatal: unable to access \'/home/u/.gitconfig\': Permission denied');
  assert.equal(denialLine('  Cause: Operation not permitted (os error 1)'),'Cause: Operation not permitted (os error 1)');
  assert.equal(denialLine('Error: getaddrinfo ENOTFOUND registry.npmjs.org'),'Error: getaddrinfo ENOTFOUND registry.npmjs.org');
  assert.equal(denialLine('src/a.py:1: error: Incompatible types in assignment'),null);
  const root='/w/p',check={command:['.venv/bin/mypy','.'],environment:sandboxEnvironment(true)};
  // `uv run` and an activated environment put the .venv first; the run gets the same PATH either way.
  assert.equal(sandboxPath(check,{PATH:'/w/p/.venv/bin:/usr/bin:/bin'},root),'/w/p/.venv/bin:/usr/bin:/bin');
  assert.equal(sandboxPath(check,{PATH:'/usr/bin:/bin'},root),'/w/p/.venv/bin:/usr/bin:/bin');
  assert.equal(sandboxPath({script:'lint',command:['/x/npm','run','lint']},{PATH:'/w/p/.venv/bin:/usr/bin'},root),'/usr/bin');
  const env=sandboxEnv(check,{PATH:'/usr/bin',HOME:'/home/u',PYTHONPATH:'lib',SECRET_TOKEN:'x',LANG:'C.UTF-8',TERM:'xterm',VIRTUAL_ENV:'/elsewhere'},
    {root,home:'/s/home',tmp:'/s/tmp'});
  assert.deepEqual(env,{PATH:'/w/p/.venv/bin:/usr/bin',HOME:'/s/home',PYTHONPATH:'lib',LANG:'C.UTF-8',TERM:'xterm',
    XDG_CONFIG_HOME:'/s/home/.config',XDG_CACHE_HOME:'/s/home/.cache',XDG_DATA_HOME:'/s/home/.local/share',XDG_STATE_HOME:'/s/home/.local/state',
    TMPDIR:'/s/tmp',TMP:'/s/tmp',TEMP:'/s/tmp',GIT_DIR:'/s/home/.no-repository',GIT_CEILING_DIRECTORIES:'/w',VIRTUAL_ENV:'/w/p/.venv'});
});

test('output compared at init: without colors, timings, temporary and home directories, and cache lines',()=>{
  assert.equal(comparableOutput('\x1b[32m✓\x1b[0m 12 files in 1.23s\n/tmp/a1/x.py:3: error\nturbo: cache hit, replaying logs\nDone at 12:01:33\n',[['/tmp/a1','<tmp>']]),
    '✓ 12 files in <time>\n<tmp>/x.py:3: error\nDone at <clock>');
  assert.equal(comparableOutput('Success: no issues found in 3 source files'),'Success: no issues found in 3 source files');
});

test('hook forms of a Python check: uv, Poetry, python -m, .venv/bin and the bare tool; PATH decides the last ones',{skip:posix},t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-forms-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  put(path.join(base,'.venv/bin/mypy'),'',0o755);put(path.join(base,'.venv/bin/python'),'',0o755);put(path.join(base,'other/mypy'),'',0o755);
  const config={checks:[{name:'typecheck',kind:'typecheck',qualification:'sandbox-v1',command:['.venv/bin/mypy','src'],...sandboxCheckInputs()}]};
  const [form]=hookForms(config);
  assert.deepEqual(form.forms,['redue run typecheck','.venv/bin/mypy src','./.venv/bin/mypy src','.venv/bin/python -m mypy src',
    'uv run mypy src','uv run python -m mypy src','poetry run mypy src','poetry run python -m mypy src','python -m mypy src','python3 -m mypy src','mypy src']);
  assert.equal(pathForm('uv run mypy src',base,{PATH:'/usr/bin'}),true);
  assert.equal(pathForm('mypy src',base,{PATH:`${base}/.venv/bin:/usr/bin`}),true);
  assert.equal(pathForm('mypy src',base,{PATH:`${base}/other:${base}/.venv/bin`}),false);
  assert.equal(pathForm('python -m mypy src',base,{PATH:`${base}/.venv/bin`}),true);
  assert.equal(pathForm('mypy src',null,{PATH:`${base}/.venv/bin`}),false);
  // `uv run` syncs the environment first; the rewrite keeps it in front.
  assert.equal(recordedCommand('uv run mypy src 2>&1 | tail -5','typecheck','redue.config.json','redue','uv run '),'uv run redue run typecheck 2>&1 | tail -5');
  assert.equal(chainCommand('git add -A && uv run mypy src',config,'redue.config.json','.',{},'redue','redue.config.json',base)?.command,
    'git add -A && uv run redue run typecheck --if-due');
});

test('init proposes mypy and ruff from .venv with the project\'s arguments, after running each both ways',{skip:unsupported},t=>{
  const {root,state}=project(t,{makefile:'lint:\n\tuv run ruff check src\n'});
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const by=Object.fromEntries(init.proposed_config.checks.map(check=>[check.name,check]));
  assert.deepEqual(by.typecheck.command,['.venv/bin/mypy']);
  assert.deepEqual(by.lint.command,['.venv/bin/ruff','check','src']);
  assert.equal(by.lint.qualification,'sandbox-v1');
  assert.deepEqual({inputs:by.lint.inputs,installedInputs:by.lint.installedInputs},sandboxCheckInputs());
  for(const check of init.checks){assert.equal(check.level,'ready',check.reason);assert.match(check.reason,/ran both ways at init, exit 0/);}
  assert.equal(init.package_manager,null);
});

test('init leaves out a Python check that gives a different result inside the sandbox, and one where the sandbox cannot run',{skip:unsupported},t=>{
  const {root,state}=project(t);
  write(root,'src/fx/reads.py','# outside\n');
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.equal(init.checks.length,0);
  assert.match(init.skipped.map(row=>row.reason).join('\n'),/typecheck: sandboxed recipe unavailable: exit 1 inside the sandbox, 0 outside it \(.*(?:Operation not permitted|Permission denied)/);
  // The same exit status with different output: a variable the sandboxed run does not get.
  write(root,'src/fx/reads.py','# secret\n');
  const secret=JSON.parse(invoke(root,state,['init','--dry-run','--json'],{REDUE_TEST_SECRET:'x'}).stdout);
  assert.match(secret.skipped.map(row=>row.reason).join('\n'),/typecheck: sandboxed recipe unavailable: the output differs inside the sandbox: "secret None" instead of "secret x"/);
  // Tools see the checkout's .git, as in CI.
  write(root,'src/fx/reads.py','# gitdir\n');
  const gitdir=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.equal(gitdir.checks.find(check=>check.name==='typecheck')?.level,'ready',JSON.stringify(gitdir.skipped));
  fs.rmSync(path.join(root,'src/fx/reads.py'));
  const off=JSON.parse(invoke(root,state,['init','--dry-run','--json'],{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'}).stdout);
  assert.equal(off.checks.length,0);
  assert.match(off.skipped.map(row=>row.reason).join('\n'),/the sandbox cannot run here \(the sandbox is turned off for this test\)/);
});

test('a sandboxed Python check: CURRENT after a pass, STALE on a checkout edit, an ignored file, the .venv or the environment',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/generated.py'),'g = 1\n');
  good(root,state,'init');good(root,state,'start');
  assert.match(good(root,state,'run','typecheck'),/mypy \[\]/);
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'sandbox-v1');
  assert.match(good(root,state,'status','--sync'),/✓ typecheck {2}CURRENT \/ PASS {2}\(sandboxed recipe\)/);
  // A git-ignored file that existed before the observer started is an input.
  write(root,'build/generated.py','g = 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/build\/generated\.py changed/);
  good(root,state,'run','typecheck');
  // The .venv is observed as installed files.
  write(root,'.venv/lib/extra.txt','x');
  assert.equal(row(root,state,'typecheck').freshness,'STALE');
  good(root,state,'run','typecheck');
  // Python's bytecode caches are not inputs.
  write(root,'src/fx/__pycache__/x.cpython-312.pyc','x');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  // A variable the run gets from the caller.
  status=row(root,state,'typecheck',{PYTHONPATH:'lib'});
  assert.equal(status.freshness,'STALE');assert.equal(status.reason,'environment variable PYTHONPATH differs from the last run');
  // Variables the run does not get are not compared.
  assert.equal(row(root,state,'typecheck',{SOME_TOKEN:'x'}).freshness,'CURRENT');
  write(root,'src/fx/__init__.py','value = "fail"\n');
  assert.equal(invoke(root,state,['run','typecheck']).status,1);
  status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/FAIL',status.reason);
});

test('a sandboxed run that reads outside or reaches the network is run again outside the sandbox and is not reused',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init');good(root,state,'start');
  for(const [word,denied] of [['outside',/Operation not permitted|Permission denied/],['network',/Operation not permitted|Permission denied/]]){
    write(root,'src/fx/__init__.py',`# ${word}\n`);
    const run=invoke(root,state,['run','typecheck']);
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stderr,/redue: the sandboxed run failed with what looks like a refusal by the sandbox/);
    const status=row(root,state,'typecheck');
    assert.equal(`${status.freshness}/${status.result}`,'UNVERIFIED/PASS',status.reason);
    assert.match(status.reason,/^the sandbox changed the result: exit 1 inside it, 0 outside it/);
    assert.match(status.reason,denied);
  }
  // A real failure is not run again.
  write(root,'src/fx/__init__.py','# fail\n');
  const failed=invoke(root,state,['run','typecheck']);
  assert.equal(failed.status,1);
  assert.doesNotMatch(failed.stderr,/running it again outside/);
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
});

test('a sandboxed run keeps its private home between runs; where the sandbox cannot start, the run is not reused',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init');good(root,state,'start');
  write(root,'src/fx/__init__.py','# home\n');
  good(root,state,'run','typecheck');
  const homes=fs.readdirSync(path.join(state,'sandbox')).map(dir=>path.join(state,'sandbox',dir,'home'));
  assert.ok(homes.some(home=>fs.existsSync(path.join(home,'cache.txt'))),'the run wrote into its private home');
  // Its temporary directory is removed after the run.
  assert.deepEqual(fs.readdirSync(path.dirname(homes[0])).filter(name=>name.startsWith('tmp-')),[]);
  // Unsandboxed, the run would write into the real home.
  write(root,'src/fx/__init__.py','value = 1\n');
  const run=invoke(root,state,['run','typecheck'],{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'});
  assert.equal(run.status,0,run.stderr);
  const status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}`,'UNVERIFIED/PASS');
  assert.equal(status.reason,'the run was not sandboxed: the sandbox is turned off for this test');
});

test('a .venv link that leads out of the checkout keeps the check recording-only and names the link',{skip:unsupported},t=>{
  const {root,state,outside}=project(t,{tools:['mypy']});
  const version=fs.readdirSync(path.join(root,'.venv/lib'))[0],site=path.join(root,'.venv/lib',version,'site-packages');
  fs.mkdirSync(site,{recursive:true});fs.symlinkSync(outside,path.join(site,'linked.txt'));
  assert.deepEqual(venvOutsideLinks(root),[`.venv/lib/${version}/site-packages/linked.txt`]);
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','typecheck');
  const status=row(root,state,'typecheck');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/links outside the checkout, where REDUE does not observe it/);
});

// A Node project whose `checker` bin reads src/value.js and fails when it says so.
function nodeProject(t,scripts){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-node-'))),root=path.join(base,'project'),state=path.join(base,'redue-state');
  t.after(()=>{try{invoke(root,state,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true});});
  put(path.join(root,'package.json'),JSON.stringify({name:'fx',version:'1.0.0',scripts}));
  put(path.join(root,'package-lock.json'),'{"name":"fx","lockfileVersion":3}');
  put(path.join(root,'.gitignore'),'node_modules/\n');put(path.join(root,'src/value.js'),'pass\n');
  put(path.join(root,'node_modules/checker/package.json'),JSON.stringify({name:'checker',version:'1.0.0',bin:{checker:'cli.js'}}));
  put(path.join(root,'node_modules/checker/cli.js'),"#!/usr/bin/env node\nprocess.exit(require('node:fs').readFileSync('src/value.js','utf8').includes('fail')?1:0);\n",0o755);
  fs.mkdirSync(path.join(root,'node_modules/.bin'));fs.symlinkSync('../checker/cli.js',path.join(root,'node_modules/.bin/checker'));
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  return {root,state};
}

test('init gives a Node lint script that starts another program the sandboxed recipe; it is CURRENT after a pass',{skip:unsupported},t=>{
  const {root,state}=nodeProject(t,{lint:'checker && ls src > /dev/null',typecheck:'missing-tool --noEmit'});
  let init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  // A script whose program is not installed gets no sandboxed check.
  assert.equal(init.checks.find(check=>check.name==='typecheck').level,'recording');
  // Nor does one that changes files: init would run it twice.
  write(root,'package.json',JSON.stringify({name:'fx',version:'1.0.0',scripts:{lint:'checker --fix && ls src'}}));
  const fixing=JSON.parse(good(root,state,'init','--dry-run','--json')).checks.find(check=>check.name==='lint');
  assert.equal(fixing.level,'recording');assert.match(fixing.reason,/Sandboxed recipe unavailable \(the script changes files: --fix\)/);
  // The checkout's .git is not an input, so git finds no repository inside the sandbox.
  write(root,'package.json',JSON.stringify({name:'fx',version:'1.0.0',scripts:{lint:'checker && git diff --quiet'}}));
  execFileSync('git',['add','.'],{cwd:root});
  const gitLint=JSON.parse(good(root,state,'init','--dry-run','--json')).checks.find(check=>check.name==='lint');
  assert.equal(gitLint.level,'recording');
  assert.match(gitLint.reason,/Sandboxed recipe unavailable: exit 12[89] inside the sandbox, 0 outside it/);
  write(root,'package.json',JSON.stringify({name:'fx',version:'1.0.0',scripts:{lint:'checker && ls src > /dev/null',typecheck:'missing-tool --noEmit'}}));
  execFileSync('git',['add','.'],{cwd:root});
  init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const lint=init.checks.find(check=>check.name==='lint');
  assert.equal(lint.level,'ready',lint.reason);
  assert.match(lint.reason,/sandboxed recipe: npm runs script "lint" inside the OS sandbox \(the general recipe cannot record it: runs ls, which is not a Node program\)/);
  good(root,state,'init');good(root,state,'start');good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  write(root,'src/value.js','fail\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  assert.equal(invoke(root,state,['run','lint']).status,1);
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/FAIL',status.reason);
});

test("init gives a typecheck through TypeScript 7's native compiler the sandboxed recipe",{skip:unsupported},t=>{
  const {root,state}=nodeProject(t,{typecheck:'tsc --noEmit'});
  put(path.join(root,'node_modules/typescript/package.json'),JSON.stringify({name:'typescript',version:'7.0.2',bin:{tsc:'./bin/tsc'}}));
  put(path.join(root,'node_modules/typescript/bin/tsc'),'#!/usr/bin/env node\n',0o755);
  fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules/.bin/tsc'));
  const typecheck=JSON.parse(good(root,state,'init','--dry-run','--json')).checks.find(check=>check.name==='typecheck');
  assert.equal(typecheck.level,'ready',typecheck.reason);
  assert.match(typecheck.reason,/the general recipe cannot record it: runs tsc from typescript 7\.0\.2, a native compiler REDUE does not record/);
});

test('what a sandboxed result depends on outside the checkout: PATH directories and .git ignore rules, not display variables',{skip:unsupported},t=>{
  const {root,state}=project(t);
  const tools=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-path-')));t.after(()=>fs.rmSync(tools,{recursive:true,force:true}));
  const env={PATH:`${tools}${path.delimiter}${process.env.PATH}`};
  good(root,state,'init');good(root,state,'start');
  assert.equal(invoke(root,state,['run','typecheck'],env).status,0);
  assert.equal(row(root,state,'typecheck',env).freshness,'CURRENT');
  assert.equal(row(root,state,'typecheck',{...env,TERM_PROGRAM:'other',COLUMNS:'51'}).freshness,'CURRENT');
  // A program installed or upgraded on PATH changes its directory.
  put(path.join(tools,'shellcheck'),'#!/bin/sh\n',0o755);
  let status=row(root,state,'typecheck',env);
  assert.equal(status.freshness,'STALE');
  assert.equal(status.reason,`PATH directory ${tools} changed (a program in it was installed, removed or upgraded)`);
  assert.equal(invoke(root,state,['run','typecheck'],env).status,0);
  // The repository's exclude file decides which files ruff and biome check.
  fs.appendFileSync(path.join(root,'.git/info/exclude'),'legacy/\n');
  status=row(root,state,'typecheck',env);
  assert.equal(status.freshness,'STALE');assert.equal(status.reason,'.git/info/exclude or .git/config changed');
});

test('a git-ignored link to a file in the checkout is an input',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/settings.py'),'mode = 1\n');fs.symlinkSync('settings.py',path.join(root,'build/active.py'));
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  write(root,'build/settings.py','mode = 2\n');
  assert.equal(row(root,state,'typecheck').freshness,'STALE');
});

test('what a check leaves running is stopped when the run ends; on macOS a run gets Unix sockets only in its own temporary directory',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['mypy']});
  good(root,state,'init');good(root,state,'start');
  write(root,'src/fx/__init__.py','# daemon unixsocket\n');
  const started=Date.now(),run=invoke(root,state,['run','typecheck']);
  assert.equal(run.status,0,run.stderr);
  assert.ok(Date.now()-started<20000,`the run waited for what it left running: ${Date.now()-started} ms`);
  const [group,session]=/background (\d+) (\d+)/.exec(run.stdout).slice(1).map(Number);
  const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
  t.after(()=>{for(const pid of [group,session])try{process.kill(pid,'SIGKILL');}catch{}});
  const until=Date.now()+5000;while(Date.now()<until&&(alive(group)||process.platform==='linux'&&alive(session)));
  assert.equal(alive(group),false,'a background process in the run\'s group');
  // On Linux the launcher also stops a daemon that started its own session.
  // On macOS it can outlive the run, but no later run can reach it: no sockets.
  if(process.platform==='linux'){assert.equal(alive(session),false,'a daemon in its own session');assert.match(run.stdout,/unix socket checkout ok/);}
  else assert.match(run.stdout,/unix socket checkout refused .*Operation not permitted/);
  // Its own temporary directory, new for each run, takes sockets on both.
  assert.match(run.stdout,/unix socket temporary ok/);
});

test('a .venv with the system site-packages keeps the check recording-only',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['mypy']});
  const cfg=path.join(root,'.venv/pyvenv.cfg');
  fs.writeFileSync(cfg,fs.readFileSync(cfg,'utf8').replace(/include-system-site-packages = false/,'include-system-site-packages = true'));
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  const status=row(root,state,'typecheck');
  assert.equal(status.freshness,'UNVERIFIED');assert.match(status.reason,/\.venv uses the system site-packages/);
});

test('a sandboxed command killed by a signal is reported as killed, on both platforms',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['mypy']});
  good(root,state,'init');good(root,state,'start');
  write(root,'src/fx/__init__.py','# selfkill\n');
  const run=invoke(root,state,['run','typecheck','--json']);
  assert.equal(run.status,137,run.stderr);
  assert.equal(JSON.parse(run.stdout.trim().split('\n').at(-1)).invocation,'interrupted');
  const status=row(root,state,'typecheck');
  assert.equal(status.freshness,'UNVERIFIED');assert.match(status.reason,/invocation interrupted/);
});

test('a Node script the general recipe also takes is sandboxed; where the sandbox cannot start, the general recipe records it',{skip:unsupported},t=>{
  const {root,state}=nodeProject(t,{lint:'checker'});
  const lint=JSON.parse(good(root,state,'init','--dry-run','--json')).checks.find(check=>check.name==='lint');
  assert.equal(lint.level,'ready',lint.reason);
  assert.match(lint.reason,/sandboxed recipe: npm runs script "lint" inside the OS sandbox; where the sandbox cannot run, the general recipe records it/);
  // With no sandbox at init, init writes the general recipe, as before.
  const off={VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'};
  assert.equal(JSON.parse(invoke(root,state,['init','--dry-run','--json'],off).stdout).proposed_config.checks.find(c=>c.name==='lint').qualification,'node-script-v1');
  good(root,state,'init');good(root,state,'start');
  assert.equal(invoke(root,state,['run','lint'],off).status,0);
  let status=row(root,state,'lint',off);
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'node-script-v1');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'sandbox-v1');
});
