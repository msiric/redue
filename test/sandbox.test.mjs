import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawnSync,execFileSync} from 'node:child_process';
import {checkoutGit,nestedGits,sandboxChange,comparableOutput,denialLine,launcherFailure,namedDocsLimit,plainVisible,refusedFile,visibleChange,withVisible,seatbeltProfile,sandboxInterpretationOf,hiddenEntries,hiddenRefusal,sandboxArgv,sandboxTrial,systemPlaces,sandboxCheckInputs,sandboxEnv,sandboxEnvironment,sandboxPath,sandboxSupport,venvOutsideLinks} from '../src/sandbox.mjs';
import {projectArgs,toolArgs} from '../src/python-onboarding.mjs';
import {chainCommand,claudeHook,hookForms,matchCheck,pathForm,recordedCommand,triggerRule,withoutOutputOptions} from '../src/claude-hook.mjs';

const bin=path.resolve('bin/redue.mjs');
const support=sandboxSupport();
const python3=['/usr/bin/python3','/opt/homebrew/bin/python3','/usr/local/bin/python3'].find(file=>fs.existsSync(file));
const unsupported=!['darwin','linux'].includes(process.platform)?'the sandboxed recipe runs on macOS and Linux':
  support.issue?`the sandbox cannot run here: ${support.issue}`:!python3?'needs python3':false;
const put=(file,value,mode)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,mode?{mode}:undefined);};

// A Python project with a .venv whose `mypy` and `ruff` are small Python
// programs: they read every .py file under src, as mypy does with the
// project's `files`, and fail, read a file outside or a git-ignored one, or
// reach the network when a file says so.
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
text = ''.join(p.read_text() for p in sorted(pathlib.Path('src').rglob('*.py')))
if 'printdenied' in text: print("EACCES: permission denied, open '/elsewhere/config'")
if 'outside' in text: open(${JSON.stringify(outside)}).read()
if 'readbuild' in text: text += open('build/generated.py').read()
if 'quietbuild' in text:
    try: open('build/generated.py').read(); print('build present')
    except OSError: print('build absent')
if 'readdocs' in text: text += open('README.md').read()
if 'readsnippet' in text: text += open('docs/snippet.py').read()
if 'readchangelog' in text: text += open('src/fx/CHANGELOG').read()
if 'nodedump' in text:
    try: open('build/generated.py').read()
    except OSError:
        print("Error: EACCES: permission denied, open '" + os.path.abspath('build/generated.py') + "'")
        print("    at Object.openSync (node:fs:573:18) {"); print("  errno: -13,"); print("  code: 'EACCES',"); print("  syscall: 'open',")
        print("  path: '" + os.path.abspath('build/generated.py') + "'"); print("}"); sys.exit(1)
if 'readmany' in text:
    for i in range(4): text += open(f'build/m{i}.py').read()
if 'lateoutside' in text: open(${JSON.stringify(outside)}).read()
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
if 'gitwork' in text:
    import subprocess, tempfile
    def read(rel):
        try: open(rel).read(); return 'read'
        except OSError: return 'hidden'
    print('git directory', os.path.isdir('.git'), 'head', read('.git/HEAD'), 'config', read('.git/config'), 'exclude', read('.git/info/exclude'))
    print('checkout repository', subprocess.run(['git', 'rev-parse', '--git-dir'], capture_output=True).returncode == 0)
    print('nested repository', subprocess.run(['git', '-C', 'vendor/lib', 'rev-parse', '--git-dir'], capture_output=True).returncode == 0, os.path.isdir('vendor/lib/.git'))
    own = tempfile.mkdtemp(); open(os.path.join(own, 'f.txt'), 'w').write('x')
    steps = [['init', '-q'], ['add', '-A'], ['-c', 'user.email=f@x.test', '-c', 'user.name=f', 'commit', '-qm', 'f'], ['rev-parse', 'HEAD']]
    print('temp repository', all(subprocess.run(['git', *step], cwd=own, capture_output=True).returncode == 0 for step in steps))
if 'loopback' in text:
    import threading
    try:
        server = socket.socket(socket.AF_INET6); server.bind(('::', 0)); server.listen(1)
        threading.Thread(target=lambda: server.accept(), daemon=True).start()
        socket.create_connection(('127.0.0.1', server.getsockname()[1]), timeout=3).close(); print('loopback ok')
    except OSError as e:
        print('loopback errno', e.errno)
        # A suite whose test needs loopback fails without it.
        if 'strict' in text: text += ' fail'
if 'remote' in text:
    try: socket.create_connection(('192.0.2.1', 9), timeout=1).close(); print('remote connected')
    except PermissionError as e: print('remote refused')
    except OSError as e: print('remote unreachable')
if 'tmpwrite' in text:
    import tempfile
    try: open('/tmp/redue-fixture-%d' % os.getpid(), 'w').close(); print('shared tmp written')
    except PermissionError: print('shared tmp refused')
    with tempfile.NamedTemporaryFile() as own: print('own tmp written')
import re
service = re.search(r'service (\\d+)', text)
if service:
    try: socket.create_connection(('127.0.0.1', int(service.group(1))), timeout=3).close(); print('service connected')
    except PermissionError:
        print('service refused')
        if 'strict' in text: text += ' fail'
    except OSError as e: print('service errno', e.errno)
closed = re.search(r'closedport (\\d+)', text)
if closed:
    try: socket.create_connection(('127.0.0.1', int(closed.group(1))), timeout=3).close(); print('closed connected')
    except OSError as e: print('closed errno', e.errno)
if 'writeoutput' in text: pathlib.Path('build').mkdir(exist_ok=True); pathlib.Path('build/report.txt').write_text(str(os.getpid()))
if 'rebuild' in text and '${tool}' == 'pytest':
    # As a suite that builds into a git-ignored folder, then tests the build.
    import time; pathlib.Path('build').mkdir(exist_ok=True); pathlib.Path('build/generated.py').write_text('g = %d\\n' % sum(map(ord, text))); time.sleep(0.5)
    text += open('build/generated.py').read()
if 'selfwrite' in text and '${tool}' == 'pytest':
    # As a suite that builds before it tests: the write comes well before the end.
    import time; pathlib.Path('src/fx/gen.py').write_text('pid = %d\\n' % os.getpid()); time.sleep(0.5)
def fastopen_probe():
    # Outside the sandbox this sends a SYN to an unroutable address: not long.
    s = socket.socket(); s.settimeout(1)
    try: s.sendto(b'x', 0x20000000, ('192.0.2.1', 9))
    except socket.timeout: pass
if 'netprobe' in text:
    import ctypes
    for name, fn in (('udp', lambda: socket.socket(socket.AF_INET, socket.SOCK_DGRAM)),
                     ('fastopen', lambda: fastopen_probe())):
        try: fn(); print(name, 'allowed')
        except OSError as e: print(name, 'errno', e.errno)
    libc = ctypes.CDLL(None, use_errno=True)
    print('io_uring', 'allowed' if libc.syscall(425, 4, ctypes.create_string_buffer(120)) >= 0 else 'errno %d' % ctypes.get_errno())
print('${tool}', sys.argv[1:])
# A test runner's summary, which init's trial compares.
if '${tool}' == 'pytest': print('1 failed in 0.01s' if 'fail' in text else '1 passed in 0.01s')
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
  // pytest through coverage; quoted arguments are one argument; report options are left out.
  const pytest={tool:'pytest',sub:[]};
  assert.deepEqual(toolArgs('uv run coverage run -m pytest tests --durations=10 -m "not slow" --junit-xml=test-results.xml --html=test-report.html --self-contained-html',pytest),
    ['tests','-m','not slow']);
  assert.deepEqual(toolArgs("python -m coverage run --source=src -m pytest -k 'fast or (quick)' tests",pytest),['-k','fast or (quick)','tests']);
  assert.deepEqual(toolArgs('pytest --junitxml out.xml tests',pytest),['tests']);
  assert.equal(toolArgs('pytest -m "$MARK"',pytest),null);
  assert.equal(toolArgs('pytest -m "not slow',pytest),null);
  // A pull-request workflow's line wins when it narrows the suite; lines continue past a backslash.
  const full={text:'on:\n  push:\njobs:\n  t:\n    steps:\n      - run: |\n          uv run coverage run -m pytest tests --durations=10 \\\n            --junit-xml=r.xml\n',pr:false};
  const quick={text:'on:\n  pull_request:\njobs:\n  t:\n    steps:\n      - run: |\n          uv run coverage run -m pytest tests -m "not slow" \\\n            --junit-xml=r.xml --html=r.html --self-contained-html\n',pr:true};
  assert.deepEqual(projectArgs('/nowhere',pytest,[full,quick]),{args:['tests','-m','not slow'],source:'project'});
  assert.deepEqual(projectArgs('/nowhere',pytest,[full,{...quick,pr:false}]),{args:['tests'],source:'project'});
  assert.deepEqual(projectArgs('/nowhere',pytest,[{...full,pr:true},{text:'just: pytest tests',pr:false}]),{args:['tests'],source:'project'});
});

test('hook forms of a pytest check with a quoted argument: double and single quotes',{skip:process.platform==='win32'},()=>{
  const config={checks:[{name:'test',kind:'test',qualification:'sandbox-v3',command:['.venv/bin/pytest','tests','-m','not slow'],...sandboxCheckInputs()}]};
  const [form]=hookForms(config);
  assert.ok(form.forms.includes('.venv/bin/pytest tests -m "not slow"'),form.forms.join(' | '));
  assert.ok(form.forms.includes("uv run pytest tests -m 'not slow'"),form.forms.join(' | '));
});

// The gap rerun (2694125): agents ran `.venv/bin/pytest -q` and
// `.venv/bin/pytest tests/ -q` where the checks were `.venv/bin/pytest` and
// `.venv/bin/pytest tests/ -v`, so the runs went unrecorded.
test('a pytest check matches its command with output options at the end added or taken away, nothing else',{skip:process.platform==='win32'},()=>{
  const check=command=>({checks:[{name:'test',kind:'test',qualification:'sandbox-v3',command,...sandboxCheckInputs()},
    {name:'typecheck',kind:'typecheck',qualification:'sandbox-v3',command:['.venv/bin/mypy','src'],...sandboxCheckInputs()}]});
  const verbose=check(['.venv/bin/pytest','tests/','-v']),plain=check(['.venv/bin/pytest']);
  const match=(command,config)=>matchCheck(command,config,'redue.config.json','.',{},'/nowhere');
  // The forms without the option get their own trigger rule; the skill's forms stay as they were.
  const [row]=hookForms(verbose);
  assert.ok(row.quiet.includes('.venv/bin/pytest tests/'));assert.ok(!row.forms.includes('.venv/bin/pytest tests/'));
  assert.equal(triggerRule('.venv/bin/pytest tests/'),'Bash(.venv/bin/pytest tests/*)');
  for(const command of ['.venv/bin/pytest tests/ -q','.venv/bin/pytest tests/ -v -q 2>&1 | tail -8','.venv/bin/pytest tests/ -q --tb=short',
    'uv run pytest tests/ -vv -rA','.venv/bin/pytest tests/ --durations=10 --color=no','.venv/bin/pytest tests/'])
    assert.equal(match(command,verbose),'test',command);
  for(const command of ['.venv/bin/pytest -q','.venv/bin/pytest -q 2>&1 | tail -5','./.venv/bin/pytest --quiet'])
    assert.equal(match(command,plain),'test',command);
  // Before the arguments (no trigger rule reaches it), options that change
  // what runs or how, a narrower set, another tool: no match.
  for(const command of ['.venv/bin/pytest -q tests/','.venv/bin/pytest tests/ -x','.venv/bin/pytest tests/test_a.py -q','.venv/bin/pytest tests/ -q -k fast',
    '.venv/bin/pytest tests/ -s','.venv/bin/pytest tests/ --tb=bogus','.venv/bin/pytest tests/ -qx','.venv/bin/pytest tests/ --no-header',
    '.venv/bin/mypy src -q','redue run test -q'])
    assert.equal(match(command,verbose),null,command);
  assert.equal(match('.venv/bin/pytest -p no:cacheprovider',plain),null);
  // An option's value is not an output option: `-k -q` selects tests.
  const keyword=check(['.venv/bin/pytest','tests/','-k','fast']);
  assert.equal(match('.venv/bin/pytest tests/ -k fast -q',keyword),'test');
  assert.equal(match('.venv/bin/pytest tests/ -k -q',check(['.venv/bin/pytest','tests/','-k'])),null);
  assert.equal(withoutOutputOptions('.venv/bin/pytest -m "-q" -q'),'.venv/bin/pytest -m "-q"');
  assert.equal(withoutOutputOptions('.venv/bin/pytest tests/ -m -q'),'.venv/bin/pytest tests/ -m -q');
  // A check given only output options gets no bare `pytest` form.
  assert.equal(hookForms(check(['.venv/bin/pytest','-v']))[0].quiet,undefined);
  // An edit then the tests: the run is recorded when its turn comes.
  assert.equal(chainCommand('sed -i s/a/b/ t.py && .venv/bin/pytest -q 2>&1 | tail -4',plain,'redue.config.json','.',{},'redue','redue.config.json','/nowhere')?.command,
    'sed -i s/a/b/ t.py && redue run test --if-due 2>&1 | tail -4');
  assert.equal(recordedCommand('.venv/bin/pytest tests/ -q 2>&1 | tail -8','test'),'redue run test 2>&1 | tail -8');
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
    TMPDIR:'/s/tmp',TMP:'/s/tmp',TEMP:'/s/tmp',GIT_CEILING_DIRECTORIES:'/w',VIRTUAL_ENV:'/w/p/.venv'});
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

// The stranger test's miss (alpha.28): a fast `.venv/bin/mypy .` ran plainly,
// because the hook waited half of a 0.2 s run for status and gave up.
test('the hook skips a fast Python check when CURRENT and records it through redue run when not',{skip:unsupported},async t=>{
  const {root}=project(t);
  write(root,'pyproject.toml','[project]\nname = "fx"\nversion = "0.1"\n');
  // agent setup takes the default state directory, as a user's does.
  const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key))),VSTATE_START_READY_WAIT_MS:'10000'};
  const redue=(...args)=>{const r=spawnSync(process.execPath,[bin,...args],{cwd:root,env,encoding:'utf8',timeout:120000});
    assert.equal(r.status,0,`${args.join(' ')}: ${r.stderr}${r.stdout}`);return r;};
  t.after(()=>spawnSync(process.execPath,[bin,'remove-state'],{cwd:root,env,timeout:30000}));
  redue('init');redue('agent','setup','claude','--apply');redue('start');redue('run','typecheck');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8')).checks[0].command,['.venv/bin/mypy','.']);
  // In process, the hook's status call gets process.env: without npm's
  // variables, as the recorded run, and with a long wait on a loaded runner
  // (statusTimeout's 2 s floor is pinned in claude-hook.test.mjs).
  const npm=Object.entries(process.env).filter(([key])=>/^npm_/i.test(key));
  for(const [key] of npm)delete process.env[key];
  t.after(()=>Object.assign(process.env,Object.fromEntries(npm)));
  let why=null;
  const input={hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:'.venv/bin/mypy .'},cwd:root};
  const decide=async()=>(await claudeHook(input,{entry:bin,invoke:'redue',timeout:20000,explain:text=>{why=text;}}))?.hookSpecificOutput??null;
  assert.equal((await decide())?.permissionDecision,'deny');
  assert.equal(why,'typecheck CURRENT/PASS');
  fs.appendFileSync(path.join(root,'src/fx/__init__.py'),'# a note\n');
  const stale=await decide();
  assert.equal(stale?.permissionDecision,'allow');
  assert.equal(stale.updatedInput.command,'redue run typecheck');
  assert.match(why,/^through redue run: typecheck STALE\/PASS \(.*__init__\.py/);
  // REDUE_HOOK_LOG: every decision, with why, also when the command is left as written.
  const log=path.join(path.dirname(root),'hook.jsonl');
  for(const command of ['ls','.venv/bin/mypy .'])
    spawnSync(process.execPath,[bin,'agent','hook','claude'],{cwd:root,env:{...env,REDUE_HOOK_LOG:log},
      input:JSON.stringify({...input,tool_input:{command}}),encoding:'utf8',timeout:30000});
  const rows=fs.readFileSync(log,'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(rows.map(row=>row.command),['ls','.venv/bin/mypy .']);
  assert.equal(rows[0].decision,'allow');assert.equal(rows[0].why,'no check matches the command');
  // Through the CLI the wait is the default one; a loaded runner may leave it unanswered, which the log says.
  assert.match(rows[1].why,/^(through redue run: typecheck STALE|left as written: status did not answer within \d+ ms)/);
  assert.equal(rows[1].decision,rows[1].why.startsWith('through')?'rewrite':'allow');
  // A directory with no setup record is logged too.
  const elsewhere=path.join(path.dirname(root),'elsewhere');fs.mkdirSync(elsewhere);
  spawnSync(process.execPath,[bin,'agent','hook','claude'],{cwd:elsewhere,env:{...env,REDUE_HOOK_LOG:log},
    input:JSON.stringify({...input,cwd:elsewhere}),encoding:'utf8',timeout:30000});
  assert.equal(JSON.parse(fs.readFileSync(log,'utf8').trim().split('\n').at(-1)).why,'REDUE is not set up for Claude Code in this directory or above it');
});

test('init proposes mypy and ruff from .venv with the project\'s arguments, after running each both ways',{skip:unsupported},t=>{
  const {root,state}=project(t,{makefile:'lint:\n\tuv run ruff check src\n'});
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const by=Object.fromEntries(init.proposed_config.checks.map(check=>[check.name,check]));
  assert.deepEqual(by.typecheck.command,['.venv/bin/mypy']);
  assert.deepEqual(by.lint.command,['.venv/bin/ruff','check','src']);
  assert.equal(by.lint.qualification,'sandbox-v3');
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
  // The sandboxed run's last lines are kept in local state, never in the config.
  const kept=/the sandboxed run's last lines are in (\S+\.txt)/.exec(init.skipped.map(row=>row.reason).join('\n'))?.[1];
  assert.ok(kept?.startsWith(path.join(state,'init-trials')+path.sep),String(kept));
  const text=fs.readFileSync(kept,'utf8');
  assert.match(text,/^typecheck: exit 1 inside the sandbox, 0 outside it\. The sandboxed run's last lines:\n/);
  assert.ok(text.trim().split('\n').length<=21&&text.split('\n').every(line=>line.length<=201+'typecheck: exit 1 inside the sandbox, 0 outside it. The sandboxed run\'s last lines:'.length),text);
  assert.equal(fs.statSync(kept).mode&0o777,0o600);
  assert.match(good(root,state,'remove-state'),/Removed init's kept trial output/);assert.ok(!fs.existsSync(kept));
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

test('a sandboxed Python check: CURRENT after a pass and through changes to git-ignored files; STALE on a checkout edit, the .venv or the environment',{skip:unsupported},t=>{
  const {root,state}=project(t);
  write(root,'.gitignore','.venv/\nbuild/\n__pycache__/\nout/\n');execFileSync('git',['add','.gitignore'],{cwd:root});
  put(path.join(root,'build/generated.py'),'g = 1\n');
  good(root,state,'init');good(root,state,'start');
  assert.match(good(root,state,'run','typecheck'),/mypy \[\]/);
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'sandbox-v3');
  assert.match(good(root,state,'status','--sync'),/✓ typecheck {2}CURRENT \/ PASS {2}\(sandboxed recipe, git-ignored files and docs hidden\)/);
  // The run did not see git-ignored files: a change to one, a new one, or a
  // new ignored directory is not a change to its inputs.
  write(root,'build/generated.py','g = 2\n');write(root,'build/more.py','m = 1\n');write(root,'build/new/out.js','x');
  // An ignored build directory made after the run, with an installed tree inside it.
  write(root,'out/standalone/node_modules/pkg/index.js','x');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'CURRENT',status.reason);
  // A new file git does not ignore is.
  write(root,'notes.txt','n\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/notes\.txt changed/);
  good(root,state,'run','typecheck');
  // The receipt holds the .venv as one entry: a digest of its files.
  const receipt=JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'),'utf8')).checks.typecheck;
  assert.equal(receipt.filesCompact,true);
  assert.match(receipt.files['.venv/:installed:'],/^[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(receipt.files).filter(file=>file.startsWith('.venv/')),['.venv/:installed:']);
  // The .venv is observed as installed files.
  write(root,'.venv/lib/extra.txt','x');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.equal(status.reason,'.venv (installed files) changed');
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

test('with hidden files, a file the run saw counts even when git ignores it later, and a hidden one counts once git tracks it',{skip:unsupported},t=>{
  const {root,state}=project(t);
  write(root,'.gitignore','.venv/\nbuild/\n__pycache__/\n*.gen.txt\n');
  write(root,'src/fx/a.gen.txt','a = 1\n');write(root,'build/x.py','x = 1\n');
  execFileSync('git',['add','-f','.gitignore','src/fx/a.gen.txt'],{cwd:root});
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  // Tracked, though a pattern matches it: the run could read it.
  execFileSync('git',['rm','-q','--cached','src/fx/a.gen.txt'],{cwd:root});
  write(root,'src/fx/a.gen.txt','a = 2\n');
  let status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/src\/fx\/a\.gen\.txt changed/);
  good(root,state,'run','typecheck');
  // Hidden from that run, then tracked: a change to it counts.
  write(root,'build/x.py','x = 2\n');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  execFileSync('git',['add','-f','build/x.py'],{cwd:root});
  write(root,'build/x.py','x = 3\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/build\/x\.py changed/);
});

test('a check that reads a git-ignored file gets just that file visible at init, as an input',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/generated.py'),'g = 1\n');put(path.join(root,'build/other.py'),'o = 1\n');
  write(root,'src/fx/reads.py','# readbuild\n');
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const check=init.proposed_config.checks.find(c=>c.name==='typecheck');
  assert.equal(`${check.qualification} ${JSON.stringify(check.visible)}`,'sandbox-v3 ["build/generated.py"]',JSON.stringify(init.checks));
  // Refused a file it hid, it was tried again with that file visible.
  assert.match(init.checks.find(c=>c.name==='typecheck').reason,/and build\/generated\.py, which its trial read, are its input; ran both ways at init, exit 0/);
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}/${status.recipe}`,'CURRENT/PASS/sandbox-v3',status.reason);
  // The visible file is an input; the rest of build/ stays hidden.
  write(root,'build/other.py','o = 2\n');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  write(root,'build/generated.py','g = 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/build\/generated\.py changed/);
  // A visible list is checked: relative files, only for a check that hides git-ignored files.
  const config=JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8'));
  for(const visible of [['../x'],['/abs'],'build/generated.py']){
    fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify({...config,checks:config.checks.map(c=>c.name==='typecheck'?{...c,visible}:c)}));
    assert.match(invoke(root,state,['status']).stderr,/typecheck\.visible: up to 3 relative files/);
  }
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify(config));
  good(root,state,'stop');good(root,state,'start');good(root,state,'run','typecheck');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  // A new file elsewhere in the hidden build/ is not an input.
  write(root,'build/new.py','n = 1\n');
  assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  // The visible file missing when the check ran, then back: it counts.
  fs.rmSync(path.join(root,'build/generated.py'));write(root,'src/fx/reads.py','# plain\n');
  good(root,state,'run','typecheck');assert.equal(row(root,state,'typecheck').freshness,'CURRENT');
  write(root,'build/generated.py','g = 4\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE',JSON.stringify(status));assert.match(status.reason,/build\/generated\.py/);
});

test('a refusal Node prints with its error properties still gets the file visible',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/generated.py'),'g = 1\n');write(root,'src/fx/reads.py','# nodedump\n');
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const check=init.proposed_config.checks.find(c=>c.name==='typecheck');
  assert.equal(`${check.qualification} ${JSON.stringify(check.visible)}`,'sandbox-v3 ["build/generated.py"]',JSON.stringify(init.checks));
});

test('a check that needs more hidden files than visible takes gets the whole checkout, as before',{skip:unsupported},t=>{
  const {root,state}=project(t);
  for(let i=0;i<4;i++)put(path.join(root,`build/m${i}.py`),`m = ${i}\n`);
  write(root,'src/fx/reads.py','# readmany\n');
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const check=init.proposed_config.checks.find(c=>c.name==='typecheck');
  assert.equal(`${check.qualification} ${check.visible}`,'sandbox-v1 undefined',JSON.stringify(init.checks));
  assert.match(init.checks.find(c=>c.name==='typecheck').reason,
    /ran both ways at init, exit 0; the whole checkout is its input: with the files git ignores and the documentation hidden, it failed reading a file it hid \(.*build\/m0\.py.*\), also with build\/m0\.py, build\/m1\.py, build\/m2\.py visible/);
});

test('init does not propose the whole checkout when that run differs too',{skip:unsupported},t=>{
  const {root,state}=project(t);
  for(let i=0;i<4;i++)put(path.join(root,`build/m${i}.py`),`m = ${i}\n`);
  write(root,'src/fx/reads.py','# readmany lateoutside\n');
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  assert.equal(init.proposed_config?.checks?.find(c=>c.name==='typecheck'),undefined,JSON.stringify(init.checks));
  assert.match(JSON.stringify(init.skipped),/typecheck: sandboxed recipe unavailable: exit 1 inside the sandbox, 0 outside it/);
});

test('visible files: the refused file a line names, a plain path only, and what a run then hides',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-visible-'))),root=path.join(base,'repo');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  put(path.join(root,'build/gen.ts'),'x\n');put(path.join(root,'build/real/a.ts'),'x\n');put(path.join(root,'build/node_modules/p/i.js'),'x\n');
  fs.symlinkSync('build/real',path.join(root,'out'));
  const entries=['build/','out','README.md'];
  for(const [line,want] of [[`Error: EACCES: permission denied, open '${root}/build/gen.ts'`,'build/gen.ts'],
    ["PermissionError: [Errno 13] Permission denied: 'build/gen.ts'",'build/gen.ts'],
    ['open ./build/gen.ts: permission denied','build/gen.ts'],
    [`EACCES: permission denied, open '${root}/out/a.ts'`,null],
    [`EACCES: permission denied, open '${root}/build/node_modules/p/i.js'`,null],
    [`EACCES: permission denied, open '${root}/build/../x'`,null],
    [`EACCES: permission denied, open '${root}/build/missing.ts'`,null],
    ['nothing hidden here',null]])assert.equal(refusedFile(line,root,entries),want,line);
  assert.equal(plainVisible(root,'build/gen.ts'),true);assert.equal(plainVisible(root,'build/later.ts'),true);
  assert.equal(plainVisible(root,'out/a.ts'),false);assert.equal(plainVisible(root,'build/node_modules/p/i.js'),false);
  assert.equal(plainVisible(root,'../x'),false);assert.equal(plainVisible(root,'build'),false);
  assert.deepEqual(withVisible(['build/','x.log'],['README.md','LICENSE'],['x.log','LICENSE']),{hidden:['build/'],docs:['README.md']});
  assert.deepEqual(withVisible(['build/'],null,[]),{hidden:['build/'],docs:null});
});

test('a check that reads a git-ignored file it was not set up with runs again without hiding',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/generated.py'),'g = 1\n');
  // Set up without it, then the check starts reading build/.
  good(root,state,'init');good(root,state,'start');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8')).checks.find(c=>c.name==='typecheck').qualification,'sandbox-v3');
  write(root,'src/fx/reads.py','# readbuild\n');
  const run=invoke(root,state,['run','typecheck']);
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stderr,/refusal of a hidden file .*running it again in the sandbox without hiding files/);
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'sandbox-v1');
  // That result compares every file: the ignored one it read too.
  write(root,'build/generated.py','g = 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/build\/generated\.py changed/);
});

test('documentation is hidden too (sandbox-v3): an edit to it keeps the result CURRENT; a check that reads it at init gets that file visible',{skip:unsupported},t=>{
  const {root,state}=project(t);
  write(root,'docs/guide/intro.md','# intro\n');write(root,'docs/guide/shot.png','png');write(root,'LICENSE','MIT\n');
  write(root,'src/fx/notes.rst','notes\n');write(root,'.md','dot\n');
  // Code under docs/ is not documentation: the run reads it.
  write(root,'docs/snippet.py','snippet = 1\n');write(root,'src/fx/snippet.py','# readsnippet\n');
  // Nor is code whose name starts like LICENSE in another case (Seatbelt
  // matches regexes without regard to case): the run reads every .py in src.
  write(root,'src/fx/license_check.py','checked = 1\n');
  execFileSync('git',['add','.'],{cwd:root});
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}/${status.recipe}`,'CURRENT/PASS/sandbox-v3',status.reason);
  // Edits to and deletions of the documentation it hid are not changes to its inputs.
  write(root,'README.md','# fixture\n\nA note.\n');write(root,'docs/guide/intro.md','# intro 2\n');write(root,'docs/guide/shot.png','png2');
  fs.rmSync(path.join(root,'LICENSE'));write(root,'src/fx/notes.rst','more\n');write(root,'.md','dot 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'CURRENT',status.reason);
  // Code under docs/ is.
  write(root,'docs/snippet.py','snippet = 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/docs\/snippet\.py changed/);
  good(root,state,'run','typecheck');
  // A new documentation file is too: the run did not hide it.
  write(root,'src/fx/CHANGELOG.md','## 1\n');
  assert.equal(row(root,state,'typecheck').freshness,'STALE');
  good(root,state,'run','typecheck');
  // A check that starts reading the documentation runs again without hiding it.
  write(root,'src/fx/reads.py','# readdocs\n');
  const run=invoke(root,state,['run','typecheck']);
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stderr,/refusal of a hidden file .*README\.md.*running it again in the sandbox without hiding files/);
  status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.recipe}`,'CURRENT/sandbox-v1',status.reason);
  write(root,'README.md','# fixture\n\nAnother note.\n');
  assert.equal(row(root,state,'typecheck').freshness,'STALE');
  // init then gives it the whole checkout.
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const proposed=init.proposed_config.checks.find(c=>c.name==='typecheck');
  assert.equal(`${proposed.qualification} ${JSON.stringify(proposed.visible)}`,'sandbox-v3 ["README.md"]',JSON.stringify(init.checks));
  assert.match(init.checks.find(c=>c.name==='typecheck').reason,/and README\.md, which its trial read, are its input/);
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

test('hidden git-ignored entries: what git lists, but installed trees and caches; a check that reads one gives another result',{skip:unsupported},async t=>{
  const {root,state}=project(t);
  write(root,'.gitignore','.venv/\nbuild/\n__pycache__/\n.env\nnode_modules/\n*.tsbuildinfo\n');
  write(root,'.env','X=1\n');write(root,'build/generated.py','# fine\n');write(root,'node_modules/pkg/index.js','');
  write(root,'src/fx/__pycache__/x.pyc','');write(root,'app.tsbuildinfo','{}');
  assert.deepEqual(hiddenEntries(root).sort(),['.env','build/']);
  good(root,state,'init');
  const check=JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8')).checks.find(c=>c.name==='typecheck');
  let trial=await sandboxTrial(root,check,{hide:true});
  assert.equal(trial.hidden,2);assert.equal(trial.same,true,JSON.stringify(trial));
  if(process.platform==='linux')assert.ok(trial.rules>0,JSON.stringify(trial));
  // A result that depends on the hidden file differs, with the refusal named.
  write(root,'src/fx/reads.py','# readbuild\n');write(root,'build/generated.py','# fail\n');
  trial=await sandboxTrial(root,check,{hide:true});
  assert.equal(trial.same,false,JSON.stringify(trial));assert.equal(trial.plain,1);
  assert.match(trial.line,/build\/generated\.py/);
  // Without hiding, it fails the same way both ways, reusing the plain run.
  const whole=await sandboxTrial(root,check,{plain:trial.plainRun});
  assert.deepEqual([whole.plain,whole.sandboxed],[1,1]);
});

test('a hidden entry stays unreadable when the run recreates it, renames a file into it or reaches it through a link',{skip:unsupported},t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-hide-'))),root=path.join(base,'project');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  write(root,'dist/a.txt','a\n');write(root,'gen/g.txt','g\n');write(root,'src/s.txt','s\n');fs.symlinkSync('dist',path.join(root,'link'));
  fs.symlinkSync('src',path.join(root,'latest'));
  const code=`
import json, os, shutil
r = {}
def read(name, rel):
    try:
        open(rel).read(); r[name] = 'read'
    except OSError as e:
        r[name] = e.errno
read('hidden', 'dist/a.txt')
read('link', 'link/a.txt')
read('visible', 'src/s.txt')
read('target', 'src/s.txt')
if hasattr(os, 'O_PATH'):
    os.close(os.open('dist/a.txt', os.O_PATH)); r['opath'] = 'opened'
open('src/moved.txt', 'w').write('m')
try:
    os.rename('src/moved.txt', 'gen/moved.txt'); read('renamed', 'gen/moved.txt')
except OSError as e:
    r['renamed'] = 'move refused %d' % e.errno
# Linux can list a hidden directory, so delete it; macOS cannot, so move it away.
try:
    shutil.rmtree('dist')
except OSError:
    os.rename('dist', 'dist-old')
os.makedirs('dist'); open('dist/b.txt', 'w').write('b')
read('recreated', 'dist/b.txt')
print(json.dumps(r))
`;
  const argv=sandboxArgv(support.mode,[python3,'-I','-c',code],{reads:[root,...systemPlaces],python:support.python,
    hidden:[path.join(root,'dist'),path.join(root,'gen'),path.join(root,'latest')]});
  const r=spawnSync(argv[0],argv.slice(1),{cwd:root,encoding:'utf8',timeout:60000});
  assert.equal(r.status,0,r.stderr);
  const seen=JSON.parse(r.stdout.trim().split('\n').at(-1));
  const refused=process.platform==='darwin'?1:13;   // EPERM from Seatbelt, EACCES from Landlock
  // Landlock refuses a rename into a place with other rights (EXDEV).
  const renamed=process.platform==='darwin'?refused:'move refused 18';
  assert.deepEqual({...seen,opath:undefined},{hidden:refused,link:refused,visible:'read',target:'read',renamed,recreated:refused,opath:undefined},r.stdout);
  // A hidden link to a visible directory does not hide the directory (checked by 'target' above).
  // Landlock does not check an O_PATH open, which gives no access to the contents.
  if(process.platform==='linux')assert.equal(seen.opath,'opened');
});

test('a missing file is a refusal only when the line names a hidden path',()=>{
  // The rerun without hiding needs a hidden name; any other refusal is handled as before.
  assert.match(hiddenRefusal("PermissionError: [Errno 13] Permission denied: 'build/x.py'",['build/']),/Permission denied/);
  assert.equal(hiddenRefusal('getaddrinfo ENOTFOUND registry.npmjs.org',['build/']),null);
  assert.equal(hiddenRefusal("Permission denied: '/etc/shadow'",['build/']),null);
  assert.match(denialLine("error TS6053: File '/r/dist/x.d.ts' not found.",['dist/']),/TS6053/);
  assert.match(denialLine('FileNotFoundError: [Errno 2] No such file or directory: \'.env\'',['.env']),/Errno 2/);
  assert.equal(denialLine('error: distance not found',['dist/']),null);
  assert.equal(denialLine("error TS6053: File 'src/x.ts' not found.",['dist/']),null);
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
  // A qualified check whose inputs cannot be resolved now can be fixed: it stays due.
  assert.notEqual(status.verifiable,false);
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

test('a sandboxed run sees that .git exists but not what is inside it, but for the ignore rules; a repository a test makes works',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['pytest']});
  write(root,'src/fx/git.py','# gitwork\n');
  // A repository nested in the checkout, in a folder git ignores. (One git
  // does not ignore makes the observer's input plan unavailable.)
  write(root,'.gitignore','.venv/\nbuild/\n__pycache__/\nvendor/\n');execFileSync('git',['add','.gitignore'],{cwd:root});
  fs.mkdirSync(path.join(root,'vendor/lib'),{recursive:true});execFileSync('git',['init','-q'],{cwd:path.join(root,'vendor/lib')});
  const init=JSON.parse(good(root,state,'init','--json'));
  const check=JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8')).checks.find(c=>c.name==='test');
  assert.equal(check?.qualification,'sandbox-v3',JSON.stringify([init.checks,init.skipped]));
  good(root,state,'start');
  const run=invoke(root,state,['run','test']);
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.match(run.stdout,/git directory True head hidden config read exclude read/);
  assert.match(run.stdout,/checkout repository False/);
  assert.match(run.stdout,/nested repository False True/);
  assert.match(run.stdout,/temp repository True/);
  assert.equal(row(root,state,'test').freshness,'CURRENT');
});

test('a pytest check in .venv: loopback works on Linux, remote hosts and the shared /tmp do not, and test output it writes is not an input',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['mypy','ruff','pytest']});
  // On macOS a test run gets no TCP: a suite using loopback runs plainly (the next test).
  write(root,'src/fx/net.py',`# ${process.platform==='linux'?'loopback ':''}remote tmpwrite writeoutput\n`);
  const init=JSON.parse(good(root,state,'init','--json'));
  const check=init.proposed_config?.checks?.find(c=>c.name==='test')??JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8')).checks.find(c=>c.name==='test');
  assert.equal(check.kind,'test');assert.equal(check.qualification,'sandbox-v3',JSON.stringify(init.checks));
  assert.deepEqual(check.command,['.venv/bin/pytest']);
  good(root,state,'start');
  const run=invoke(root,state,['run','test']);
  assert.equal(run.status,0,run.stderr);
  if(process.platform==='linux')assert.match(run.stdout,/loopback ok/);
  assert.match(run.stdout,/remote refused/);
  assert.match(run.stdout,/shared tmp refused/);assert.match(run.stdout,/own tmp written/);
  // build/report.txt, git-ignored, was written during the run.
  assert.ok(fs.existsSync(path.join(root,'build/report.txt')));
  const status=row(root,state,'test');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
});

test('a listed LICENSE or CHANGELOG file is refused, nested too; past the limit those files stay visible and count as inputs',{skip:unsupported},t=>{
  const {root,state}=project(t);
  write(root,'src/fx/CHANGELOG','## 1\n');write(root,'src/fx/reads.py','# readchangelog\n');
  execFileSync('git',['add','.'],{cwd:root});
  let init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const proposed=init.proposed_config.checks.find(c=>c.name==='typecheck');
  assert.equal(`${proposed.qualification} ${JSON.stringify(proposed.visible)}`,'sandbox-v3 ["src/fx/CHANGELOG"]',JSON.stringify(init.checks));
  for(let i=0;i<=namedDocsLimit;i++)write(root,`packages/p${i}/CHANGELOG`,'## 1\n');
  execFileSync('git',['add','.'],{cwd:root});
  good(root,state,'init');good(root,state,'start');good(root,state,'run','typecheck');
  let status=row(root,state,'typecheck');
  assert.equal(`${status.freshness}/${status.result}/${status.recipe}`,'CURRENT/PASS/sandbox-v3',status.reason);
  write(root,'src/fx/CHANGELOG','## 2\n');
  status=row(root,state,'typecheck');
  assert.equal(status.freshness,'STALE');assert.match(status.reason,/src\/fx\/CHANGELOG changed/);
});

test('init runs a check once more with the whole checkout when nothing shows the hidden files caused the difference',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/generated.py'),'g = 1\n');
  const pick=()=>{const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
    return {qualification:init.proposed_config?.checks.find(c=>c.name==='typecheck')?.qualification,
      reason:init.checks.find(c=>c.name==='typecheck')?.reason??JSON.stringify(init.skipped)};};
  // The output differs without a refusal: the whole checkout agrees.
  write(root,'src/fx/reads.py','# quietbuild\n');
  let check=pick();
  assert.equal(check.qualification,'sandbox-v1',check.reason);
  assert.match(check.reason,/ran both ways at init, exit 0; the whole checkout is its input: with the files git ignores and the documentation hidden, the output differs inside the sandbox: "build absent" instead of "build present"/);
  // A plain run that fails is never followed by the shortcut: without the
  // hiding, the sandboxed run could pass.
  write(root,'src/fx/reads.py','# readbuild fail\n');
  check=pick();
  assert.equal(check.qualification,'sandbox-v1',check.reason);assert.match(check.reason,/ran both ways at init, exit 1/);
  // Nor is a refusal of a hidden file next to another refusal.
  write(root,'src/fx/reads.py','# readbuild printdenied\n');
  check=pick();
  assert.equal(check.qualification,'sandbox-v1',check.reason);assert.match(check.reason,/ran both ways at init, exit 0/);
});

test('the macOS profile refuses each listed file the patterns miss, beneath the checkout and its real path',{skip:unsupported},t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-docs-rule-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  fs.mkdirSync(path.join(base,'real'));fs.symlinkSync(path.join(base,'real'),path.join(base,'link'));
  const profile=seatbeltProfile([path.join(base,'link')],null,[],{docs:{root:path.join(base,'link'),entries:['LICENSE','packages/a/CHANGELOG','README.md','docs/shot.png']}});
  for(const dir of ['link','real'])for(const rel of ['LICENSE','packages/a/CHANGELOG'])
    assert(profile.includes(`(literal ${JSON.stringify(path.join(base,dir,rel))})`),`${dir}/${rel}`);
  assert(!profile.includes('README.md"')&&!profile.includes('shot.png"'),'the patterns cover those');
  assert(!/LICENSE\|CHANGELOG/.test(profile),'no name pattern');
});

test("the checkout's .git: its contents hidden but for the ignore rules, on both launchers; only a real folder",{skip:process.platform==='win32'&&'POSIX paths'},t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-git-hide-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const git=path.join(base,'.git');fs.mkdirSync(path.join(git,'info'),{recursive:true});
  assert.equal(checkoutGit(base),git);
  const linux=sandboxArgv('landlock',['x'],{reads:[base],python:'python3',git});
  assert.deepEqual(linux.slice(linux.indexOf('--hide'),linux.indexOf('--hide')+6),['--hide',git,'--show',path.join(git,'config'),'--show',path.join(git,'info/exclude')]);
  const profile=sandboxArgv('seatbelt',['x'],{reads:[base],git})[2];
  assert.match(profile,new RegExp(`\\(deny file-read-data process-exec\\* \\(require-all \\(require-any \\(subpath ${JSON.stringify(git).replace(/[.*+?^${}()|[\]\\/]/g,'\\$&')}`));
  assert(profile.includes(`(literal ${JSON.stringify(path.join(git,'config'))})`)&&profile.includes(`(literal ${JSON.stringify(path.join(git,'info/exclude'))})`));
  // Repositories nested in it, git-ignored or not, are found; not in node_modules.
  execFileSync('git',['init','-q'],{cwd:base});put(path.join(base,'.gitignore'),'ignored/\nnode_modules/\n');
  for(const dir of ['ignored/deep/a','untracked/b','node_modules/c']){fs.mkdirSync(path.join(base,dir),{recursive:true});execFileSync('git',['init','-q'],{cwd:path.join(base,dir)});}
  assert.deepEqual(nestedGits(base),[path.join(base,'ignored/deep/a/.git'),path.join(base,'untracked/b/.git')]);
  assert.ok(sandboxArgv('landlock',['x'],{reads:[base],python:'python3',git,nestedGit:nestedGits(base)}).includes(path.join(base,'untracked/b/.git')));
  // A worktree's .git file names a folder outside the checkout, which a run cannot read.
  fs.rmSync(git,{recursive:true,force:true});fs.writeFileSync(git,'gitdir: /elsewhere\n');
  assert.equal(checkoutGit(base),null);
  fs.rmSync(git);fs.symlinkSync(base,git);assert.equal(checkoutGit(base),null);
});

test('a receipt from before .git was hidden names why it no longer applies',()=>{
  const key='__redue_sandbox_variable:GIT_DIR__';
  assert.match(sandboxChange({[key]:'x','__redue_sandbox_variable:HOME__':'h'},{'__redue_sandbox_variable:HOME__':'h'}),/hides what is inside \.git now, instead of setting GIT_DIR/);
});

test('a macOS test check has its own interpretation, so a result recorded with loopback (alpha.28) is another plan',()=>{
  assert.equal(sandboxInterpretationOf('sandbox-v2','test','darwin'),'sandbox@2+no-tcp');
  assert.equal(sandboxInterpretationOf('sandbox-v1','test','darwin'),'sandbox@1+no-tcp');
  assert.equal(sandboxInterpretationOf('sandbox-v2','test','linux'),'sandbox@2');
  assert.equal(sandboxInterpretationOf('sandbox-v2','typecheck','darwin'),'sandbox@2');
});

test('on macOS, a test run gets no TCP: a suite using loopback or a service outside the run fails its trial and runs plainly',
  {skip:unsupported||(process.platform!=='darwin'&&'Seatbelt runs on macOS')},async t=>{
  const {root,state}=project(t,{tools:['pytest']});
  // A local database stands in: a server this test starts, outside any run.
  const server=net.createServer(socket=>socket.end()).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));t.after(()=>server.close());
  for(const marker of ['loopback strict',`service ${server.address().port} strict`]){
    write(root,'src/fx/net.py',`# ${marker}\n`);
    const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
    assert.equal(init.checks.find(check=>check.name==='test'),undefined,marker);
    assert.match(init.skipped.map(row=>row.reason).join('\n'),/test: sandboxed recipe unavailable: exit 1 inside the sandbox, 0 outside it/,marker);
  }
});

test('on Linux, a test run gets no UDP, TCP Fast Open, io_uring or outside service, and a supervisor that cannot start or stops makes it UNVERIFIED',
  {skip:unsupported||(process.platform!=='linux'&&'the network supervisor runs on Linux')},async t=>{
  const {root,state}=project(t,{tools:['pytest']});
  // A service this test starts, outside the run, and a port nobody listens on.
  const {createServer}=await import('node:net');
  const server=createServer(socket=>socket.end());await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
  const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const closed=probe.address().port;probe.close();
  write(root,'src/fx/net.py',`# netprobe loopback service ${server.address().port} closedport ${closed}\n`);
  good(root,state,'init');good(root,state,'start');
  let run=invoke(root,state,['run','test']);
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stdout,/udp errno 1/);assert.match(run.stdout,/fastopen errno 1/);assert.match(run.stdout,/io_uring errno 1/);
  assert.match(run.stdout,/loopback ok/);assert.match(run.stdout,/service refused/);assert.match(run.stdout,/closed errno 111/);
  assert.equal(row(root,state,'test').freshness,'CURRENT');
  for(const [fault,reason] of [['unavailable',/network supervisor|sandbox changed the result/],['die',/the network supervisor reported: failed: test fault/]]){
    run=invoke(root,state,['run','test'],{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SUPERVISOR:fault});
    const status=row(root,state,'test');
    assert.equal(status.freshness,'UNVERIFIED',`${fault}: ${JSON.stringify(status)} ${run.stderr}`);assert.match(status.reason,reason);
  }
});

test('init gives a Node test script the direct test recipe does not take the sandboxed recipe',{skip:unsupported},t=>{
  const {root,state}=nodeProject(t,{test:'checker'});
  const test=JSON.parse(good(root,state,'init','--dry-run','--json')).checks.find(check=>check.name==='test');
  assert.equal(test.level,'ready',test.reason);assert.match(test.reason,/sandboxed recipe: npm runs script "test"/);
  good(root,state,'init');good(root,state,'start');good(root,state,'run','test');
  const status=row(root,state,'test');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'sandbox-v3');
});

test('init tries a Vitest script in the sandbox first; the direct test recipe is what it writes where the sandbox cannot run',{skip:process.platform==='win32'},t=>{
  const {root,state}=nodeProject(t,{test:'vitest run'});
  put(path.join(root,'node_modules/vitest/package.json'),JSON.stringify({name:'vitest',version:'4.1.4',bin:{vitest:'vitest.mjs'},type:'module'}));
  put(path.join(root,'node_modules/vitest/vitest.mjs'),"#!/usr/bin/env node\nimport fs from 'node:fs';console.log(' Tests  1 passed (1)');process.exit(fs.readFileSync('src/value.js','utf8').includes('fail')?1:0);\n",0o755);
  fs.symlinkSync('../vitest/vitest.mjs',path.join(root,'node_modules/.bin/vitest'));
  if(!unsupported){
    const test=JSON.parse(good(root,state,'init','--dry-run','--json')).proposed_config.checks.find(check=>check.name==='test');
    assert.equal(test.qualification,'sandbox-v3',JSON.stringify(test));}
  const off=JSON.parse(invoke(root,state,['init','--dry-run','--json'],{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'}).stdout);
  const test=off.proposed_config.checks.find(check=>check.name==='test'),row=off.checks.find(check=>check.name==='test');
  assert.equal(test.qualification,'npm-tests-direct-v1',JSON.stringify(test));
  assert.match(row.reason,/^Sandboxed recipe unavailable: the sandbox cannot run here .*explicit local vitest 4\.1\.4 run/);
  // Where the direct recipe runs another script (here `test` watches), the
  // sandbox runs the one the direct recipe chose, which stays its fallback.
  write(root,'package.json',JSON.stringify({name:'fx',version:'1.0.0',scripts:{test:'vitest','test:unit':'vitest run'}}));
  const other=JSON.parse(good(root,state,'init','--dry-run','--json')).proposed_config.checks.find(check=>check.name==='test');
  assert.equal(`${other.qualification} ${other.script}`,`${unsupported?'npm-tests-direct-v1':'sandbox-v3'} test:unit`);
  const fallback=JSON.parse(invoke(root,state,['init','--dry-run','--json'],{VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'}).stdout)
    .proposed_config.checks.find(check=>check.name==='test');
  assert.equal(`${fallback.qualification} ${fallback.script}`,'npm-tests-direct-v1 test:unit');
});

test('a run past the trial limit is never the same: when the plain run reaches it, no sandboxed run follows',{skip:unsupported},async t=>{
  const {root}=nodeProject(t,{lint:'sleep 3 && checker'});
  const check={name:'lint',kind:'lint',script:'lint'};
  const trial=await sandboxTrial(root,check,{hide:'docs',timeout:1000});
  assert.equal(trial.same,false);assert.equal(trial.timedOut,'plain');assert.equal(trial.sandboxed,null,JSON.stringify(trial));
  // Reusing a plain run that finished, a sandboxed run past the limit is not the same either.
  const plain={status:0,output:'\n',ms:1};
  const inside=await sandboxTrial(root,check,{plain,timeout:1000});
  assert.equal(inside.same,false);assert.equal(inside.timedOut,'sandboxed');
});

test('init: a check past the trial limit is recording-only, not an untried fallback; --no-time-limit tries it again and updates only that row',{skip:unsupported},t=>{
  // A margin for slow runners: the typecheck stays well inside the limit.
  const {root,state}=nodeProject(t,{lint:'sleep 6 && checker',typecheck:'checker'});
  const limit={VSTATE_TEST_FAULTS:'1',VSTATE_TEST_TRIAL_LIMIT:'4000'};
  const preview=JSON.parse(invoke(root,state,['init','--dry-run','--json'],limit).stdout);
  const lint=preview.checks.find(check=>check.name==='lint');
  assert.equal(lint.time_limit,'lint',JSON.stringify(lint));
  assert.match(lint.reason,/^recording-only: it ran past init's 5-minute trial limit \(redue init --check lint --no-time-limit tries it without the limit\)$/);
  assert.equal(lint.level,'recording');
  assert.equal(preview.proposed_config.checks.find(check=>check.name==='lint').qualification,undefined);
  assert.equal(preview.checks.find(check=>check.name==='typecheck').time_limit,undefined);
  assert.equal(invoke(root,state,['init'],limit).status,0);
  const config=()=>JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8'));
  const before=config();
  assert.equal(before.checks.find(check=>check.name==='lint').qualification,undefined);
  assert.equal(before.checks.find(check=>check.name==='typecheck').qualification,'sandbox-v3');
  // A preview changes nothing; the typecheck the config already sandboxes is not run again.
  const dry=JSON.parse(good(root,state,'init','--no-time-limit','--dry-run','--json'));
  assert.equal(dry.written,false);assert.equal(dry.updated,undefined);assert.deepEqual(config(),before);
  assert.match(dry.checks.find(check=>check.name==='lint').reason,/ran both ways at init, exit 0/);
  assert.match(dry.skipped.map(row=>row.reason).join('\n'),/typecheck: not tried; the config already runs it in the sandbox/);
  // A row that runs another script under the name is left alone.
  const other=structuredClone(before);other.checks.find(check=>check.name==='lint').script='lint:other';
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify(other));
  assert.match(good(root,state,'init','--no-time-limit','--dry-run'),/lint: not tried; the config runs something else under that name/);
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify(before));
  const out=JSON.parse(good(root,state,'init','--check','lint','--no-time-limit','--json'));
  assert.deepEqual([out.written,out.updated,out.observer],[true,['lint'],'not running']);
  const after=config();
  assert.equal(after.checks.find(check=>check.name==='lint').qualification,'sandbox-v3');
  assert.deepEqual(after.checks.find(check=>check.name==='typecheck'),before.checks.find(check=>check.name==='typecheck'));
  // Once it is sandboxed, there is nothing left to try.
  assert.match(good(root,state,'init','--no-time-limit'),/Existing .* left unchanged/);
  // A check the config lacks is tried and added only when --check names its kind.
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify({...after,checks:after.checks.filter(check=>check.name!=='lint')}));
  assert.match(good(root,state,'init','--no-time-limit','--dry-run'),/lint: not tried; the config does not have it; name its kind with --check to add it/);
  assert.match(good(root,state,'init','--check','lint','--no-time-limit'),/Updated lint in /);
  assert.deepEqual(config().checks.map(check=>`${check.name} ${check.qualification}`).sort(),['lint sandbox-v3','typecheck sandbox-v3']);
});

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

test('with the whole checkout (sandbox-v1), a git-ignored link to a file in the checkout is an input',{skip:unsupported},t=>{
  const {root,state}=project(t);
  put(path.join(root,'build/settings.py'),'mode = 1\n');fs.symlinkSync('settings.py',path.join(root,'build/active.py'));
  good(root,state,'init');
  const file=path.join(root,'redue.config.json');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/"sandbox-v[23]"/g,'"sandbox-v1"'));
  good(root,state,'start');good(root,state,'run','typecheck');
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
  // Another run fails the same way until an input changes; then a run is what it needs.
  assert.equal(status.needs_run,false);
  write(root,'src/fx/__init__.py','value = 2\n');
  assert.equal(row(root,state,'typecheck').needs_run,true);
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
  assert.equal(status.recipe,'sandbox-v3');
});

test('redue verify starts the observer, runs each due check, then shows the status; exit 0 only when every check is CURRENT/PASS',{skip:unsupported},t=>{
  const {root,state}=project(t);
  good(root,state,'init');
  let r=invoke(root,state,['verify']);
  assert.equal(r.status,0,r.stderr+r.stdout);
  assert.match(r.stderr,/starting the observer/);
  assert.match(r.stderr,/running typecheck \(UNVERIFIED: no receipt\)/);assert.match(r.stderr,/running lint \(UNVERIFIED: no receipt\)/);
  assert.match(r.stdout,/✓ typecheck {2}CURRENT \/ PASS/);assert.match(r.stdout,/✓ lint {2}CURRENT \/ PASS/);
  assert.match(r.stdout,/Verified: every check that can be verified \(2\) passed/);
  // Nothing is due: nothing runs.
  r=invoke(root,state,['verify']);
  assert.equal(r.status,0,r.stderr);assert.doesNotMatch(r.stderr,/running/);
  // An edit makes both due; they run, and a failure ends the command with 1.
  write(root,'src/fx/__init__.py','value = "fail"\n');
  r=invoke(root,state,['verify','--json']);
  assert.equal(r.status,1,r.stderr);
  let value=JSON.parse(r.stdout);
  assert.deepEqual(value.ran.map(x=>`${x.check} ${x.was} ${x.exit}`),['typecheck STALE 1','lint STALE 1']);
  assert.equal(value.verified,false);
  assert.deepEqual(value.status.checks.map(c=>`${c.name} ${c.freshness}/${c.result}`),['typecheck CURRENT/FAIL','lint CURRENT/FAIL']);
  // A failure that still applies is not due: it does not run again.
  r=invoke(root,state,['verify','--json']);
  value=JSON.parse(r.stdout);
  assert.equal(r.status,1);assert.deepEqual(value.ran,[]);
  // Fixed: both run again and pass.
  write(root,'src/fx/__init__.py','value = 2\n');
  r=invoke(root,state,['verify']);
  assert.equal(r.status,0,r.stderr+r.stdout);
});

test('the Landlock launcher\'s own refusal is read as a run that was not sandboxed',()=>{
  assert.equal(launcherFailure('landlock.py: Landlock unavailable (errno 38)\n'),'landlock.py: Landlock unavailable (errno 38)');
  assert.equal(launcherFailure('landlock.py: add_rule /x errno 2\n'),'landlock.py: add_rule /x errno 2');
  assert.equal(launcherFailure('landlock.py: Landlock ABI 3 cannot keep a run off the network'),'landlock.py: Landlock ABI 3 cannot keep a run off the network');
  // The check's own output, or what the launcher says after the command ran, is not a refusal.
  assert.equal(launcherFailure('some output\nlandlock.py: add_rule /x errno 2\n'),null);
  assert.equal(launcherFailure('landlock.py: processes [12] did not stop\n'),null);
  assert.equal(launcherFailure('error: tests failed\n'),null);
});

test('an installed tree kept as one entry beneath a hidden directory counts once git tracks a file in it',t=>{
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-compact-')));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  put(path.join(root,'.gitignore'),'vendor/\n');put(path.join(root,'vendor/node_modules/x/index.js'),'x');put(path.join(root,'a.txt'),'a');
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.gitignore','a.txt'],{cwd:root});
  const key='vendor/node_modules/:installed:',before={[key]:'1'},after={[key]:'2'};
  assert.equal(visibleChange(root,['vendor/'],before,after,[key]),null);
  execFileSync('git',['add','-f','vendor/node_modules/x/index.js'],{cwd:root});
  assert.equal(visibleChange(root,['vendor/'],before,after,[key]),key);
});

test('on Linux, a run keeps the Landlock answer for the same kernel, launcher Python and launcher',{skip:process.platform!=='linux'||unsupported},t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'rsb-support-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const cache=path.join(base,'sandbox-support-v1.json'),module=path.resolve('src/sandbox.mjs');
  const ask=()=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',
    `import {sandboxSupport} from ${JSON.stringify(module)};console.log(JSON.stringify(sandboxSupport({cache:${JSON.stringify(cache)}})));`],{encoding:'utf8'}));
  const first=ask();assert.equal(first.mode,'landlock');
  const kept=JSON.parse(fs.readFileSync(cache,'utf8'));assert.equal(kept.abi,first.abi);assert.match(kept.key,/^[0-9a-f]{64}$/);
  // Kept: the answer comes from the file (an ABI the probe would not give shows it).
  fs.writeFileSync(cache,JSON.stringify({key:kept.key,abi:99}));assert.equal(ask().abi,99);
  // Another key, or an ABI that cannot keep a run off the network, asks again.
  fs.writeFileSync(cache,JSON.stringify({key:'0'.repeat(64),abi:99}));assert.equal(ask().abi,first.abi);
  fs.writeFileSync(cache,JSON.stringify({key:kept.key,abi:3}));assert.equal(ask().abi,first.abi);
});

for(const visible of [false,true])test(`a ${visible?'sandbox-v3 suite with the file visible':'sandbox-v1 suite'} that rebuilds a git-ignored file and reads it back: CURRENT when it rewrote the same bytes`,{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['ruff','pytest']});
  put(path.join(root,'build/generated.py'),'g = 0\n');
  write(root,'src/fx/__init__.py','value = 1  # rebuild\n');execFileSync('git',['add','.'],{cwd:root});
  good(root,state,'init');
  const config=JSON.parse(fs.readFileSync(path.join(root,'redue.config.json'),'utf8'));
  const test=config.checks.find(c=>c.name==='test');
  assert.equal(`${test.qualification} ${JSON.stringify(test.visible)}`,'sandbox-v3 ["build/generated.py"]');
  // The whole checkout, as init gave a check that reads a hidden file before visible files.
  if(!visible)fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify({...config,checks:config.checks.map(c=>{
    if(c.name!=='test')return c;const {visible:_,...rest}=c;return {...rest,qualification:'sandbox-v1'};})}));
  good(root,state,'start');
  // Rewritten with other bytes: the run may have read the old ones.
  write(root,'build/generated.py','g = 0\n');
  good(root,state,'run','test');
  assert.equal(row(root,state,'test').freshness,'UNVERIFIED');
  // Rewritten with the same bytes: what it read is what is there now.
  good(root,state,'run','test');
  let status=row(root,state,'test');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  // A source change makes it STALE; the next build differs, the one after does not.
  write(root,'src/fx/__init__.py','value = 2  # rebuild\n');
  assert.equal(row(root,state,'test').freshness,'STALE');
  good(root,state,'run','test');
  assert.equal(row(root,state,'test').freshness,'UNVERIFIED');
  good(root,state,'run','test');
  status=row(root,state,'test');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  // The file is an input: another program changing it makes it STALE.
  write(root,'build/generated.py','g = 3\n');
  assert.equal(row(root,state,'test').freshness,'STALE');
});

test('a check whose runs rewrite its own inputs is not verifiable: verify leaves it out and runs the checks it made due again',{skip:unsupported},t=>{
  const {root,state}=project(t,{tools:['ruff','pytest']});
  write(root,'src/fx/__init__.py','value = 1  # selfwrite\n');execFileSync('git',['add','.'],{cwd:root});
  good(root,state,'init');
  const r=invoke(root,state,['verify','--json']);
  assert.equal(r.status,0,r.stderr+r.stdout);
  const value=JSON.parse(r.stdout);
  // The test runs until two runs in a row changed the same file (a first run
  // can be disturbed); a round runs it first, so lint, which its run makes
  // due again, runs after it.
  const order=value.ran.map(x=>x.check);
  assert.ok(order.filter(name=>name==='test').length>=2,order.join(' '));
  assert.equal(order.at(-1),'lint',order.join(' '));
  const test=value.status.checks.find(c=>c.name==='test'),lint=value.status.checks.find(c=>c.name==='lint');
  assert.equal(`${lint.freshness}/${lint.result}`,'CURRENT/PASS');
  assert.equal(test.verifiable,false);
  assert.equal(test.reason,'the same inputs changed during its last two runs (src/fx/gen.py), so no result of it can be confirmed; it is due again when anything else changes');
  assert.equal(value.status.not_verifiable,1);assert.equal(value.status.state,'current');
  assert.match(good(root,state,'status'),/– test {2}NOT VERIFIABLE \/ PASS\n {2}Not verifiable: the same inputs changed during its last two runs/);
  // Nothing is due now: verify runs nothing and still passes.
  const again=invoke(root,state,['verify','--json']);
  assert.equal(again.status,0,again.stderr);assert.deepEqual(JSON.parse(again.stdout).ran,[]);
  assert.match(invoke(root,state,['verify']).stdout,/Verified: every check that can be verified \(1\) passed on the files as they are now\. 1 not verifiable, left out\./);
  // Another input changes: the check is due again, and verify runs it.
  write(root,'src/fx/__init__.py','value = 2  # selfwrite\n');
  assert.notEqual(row(root,state,'test').verifiable,false);
  const after=invoke(root,state,['verify','--json']);
  assert.equal(after.status,0,after.stderr+after.stdout);
  assert.ok(JSON.parse(after.stdout).ran.some(x=>x.check==='test'));
  assert.equal(row(root,state,'test').verifiable,false);
  // A failing run is never left out: the check stays due, and verify fails.
  write(root,'src/fx/__init__.py','value = "fail"  # selfwrite\n');
  const failing=invoke(root,state,['verify','--json']);
  assert.equal(failing.status,1);
  assert.notEqual(JSON.parse(failing.stdout).status.checks.find(c=>c.name==='test').verifiable,false);
});

test('a recording-only check (no qualification, inputs not reviewed) is not verifiable and never due',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rsb-'))),root=path.join(base,'project'),state=path.join(base,'redue-state');
  t.after(()=>{try{invoke(root,state,['stop']);}catch{}fs.rmSync(base,{recursive:true,force:true});});
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'build',command:['@node','b.cjs'],inputs:['src/**','b.cjs']}]}));
  put(path.join(root,'b.cjs'),'\n');put(path.join(root,'src/a.js'),'1\n');
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  good(root,state,'start');good(root,state,'run','build');
  const status=row(root,state,'build');
  assert.equal(status.verifiable,false);assert.match(status.reason,/^input coverage unresolved/);
  const r=invoke(root,state,['verify','--json']);
  assert.equal(r.status,1);
  const value=JSON.parse(r.stdout);
  assert.deepEqual(value.ran,[]);assert.equal(value.status.not_verifiable,1);
  assert.match(invoke(root,state,['verify']).stdout,/Not verified: no check can be verified here\. 1 not verifiable, left out\./);
});
