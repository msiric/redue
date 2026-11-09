import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {childProgram,commandLineIssue,parseCommandLine,pnpmNameless,pnpmRunIssue,programKind,scriptCheckInputs,scriptPath,toolOutput} from '../src/node-script.mjs';
import {pnpmShimTarget,shimTemplate} from '../src/pnpm-shims.mjs';

const bin=path.resolve('bin/redue.mjs');
const unsupported=process.platform==='win32'?'the general recipe records runs on macOS and Linux':false;
const put=(file,value,mode)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,mode?{mode}:undefined);};
const templates=JSON.parse(fs.readFileSync(new URL('../src/pnpm-shim-templates.json',import.meta.url),'utf8')).templates;
// A launcher as a pnpm release writes it, for the bin file `target`.
const launcher=(row,target,nodePath='/x/node_modules/.pnpm/node_modules')=>row.template.split('@@NODE_PATH@@').join(nodePath)
  .split('@@TARGET@@').join(target).split('@@COMMENT@@').join(target);
// A directory of programs: Node bins as npm and pnpm install them, a shell
// script, a native file and the pnpm executable.
function programs(t){
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-programs-')));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const bins=path.join(root,'node_modules','.bin');
  put(path.join(root,'node_modules/tool/bin/tool.js'),'#!/usr/bin/env node\n',0o755);
  fs.mkdirSync(bins,{recursive:true});
  fs.symlinkSync('../tool/bin/tool.js',path.join(bins,'tool'));
  put(path.join(bins,'shimmed'),launcher(templates.at(-1),'../tool/bin/tool.js'),0o755);
  put(path.join(bins,'edited'),launcher(templates.at(-1),'../tool/bin/tool.js').replace('exec node ','git status; exec node '),0o755);
  put(path.join(bins,'native'),Buffer.from([0x7f,0x45,0x4c,0x46,2,1,1,0]),0o755);
  put(path.join(root,'system/git'),'#!/bin/sh\necho git\n',0o755);
  put(path.join(root,'pnpm-pkg/package.json'),JSON.stringify({name:'pnpm',version:'12.4.2'}));
  for(const name of ['pnpm','pnpm-native'])put(path.join(root,'pnpm-pkg',name),Buffer.from([0x7f,0x45,0x4c,0x46,2,1,1,0]),0o755);
  put(path.join(root,'package.json'),JSON.stringify({scripts:{check:'tool && shimmed --flag',bad:'tool && git status',
    nested:'pnpm run check',prenested:'tool'}}));
  return {root,searchPath:[bins,path.join(root,'system'),path.join(root,'pnpm-pkg')].join(path.delimiter)};
}

test('command lines: words, quotes and separators; expansions and input redirection are refused',()=>{
  assert.deepEqual(parseCommandLine(`tsc --noEmit && eslint "src/**/*.ts" 'a b' || true; vitest run 2>&1 | cat >/dev/null`).commands
    .map(words=>words.map(word=>word.text)),[['tsc','--noEmit'],['eslint','src/**/*.ts','a b'],['true'],['vitest','run'],['cat']]);
  for(const text of ['tsc $FLAGS','echo `date`','node x.js < in.txt','(cd a && tsc)','tsc > out.txt','tsc &','eslint "$X"','a\\ b','# note'])
    assert.match(parseCommandLine(text).issue||'',/shell syntax/,text);
});

test('pnpm launchers are trusted only as a release writes them',{skip:unsupported},t=>{
  assert.ok(templates.length>=8,'templates for pnpm 8 to 12');
  for(const row of templates){
    const shim=shimTemplate(launcher(row,'../typescript/bin/tsc'));
    assert.equal(shim?.template,row.template,row.versions.join(' '));
    assert.equal(shim.target,'../typescript/bin/tsc');
  }
  const {root}=programs(t);
  assert.equal(pnpmShimTarget(path.join(root,'node_modules/.bin/shimmed')),path.join(root,'node_modules/tool/bin/tool.js'));
  assert.equal(pnpmShimTarget(path.join(root,'node_modules/.bin/edited')),null);
  // A value that expands something other than the launcher's directory.
  assert.equal(pnpmShimTarget('/x/.bin/t',launcher(templates.at(-1),'../t/bin/t.js','$HOME/x')),null);
});

test('a script may start only Node programs, the pnpm executable and shell builtins',{skip:unsupported},t=>{
  const {root,searchPath}=programs(t);
  const issue=text=>commandLineIssue(text,{cwd:root,searchPath});
  assert.equal(programKind(path.join(root,'node_modules/tool/bin/tool.js')),'node');
  assert.equal(programKind(path.join(root,'node_modules/.bin/shimmed')),'node');
  assert.equal(programKind(path.join(root,'node_modules/.bin/native')),null);
  assert.equal(programKind(path.join(root,'pnpm-pkg/pnpm-native')),'pnpm');
  // Yarn's bin wrapper, as the run saw it (Yarn removes it afterwards); nothing else in it.
  const wrapper=extra=>`#!/bin/sh\nexec "${process.execPath}" '${root}/node_modules/tool/bin/tool.js'${extra} "$@"\n`;
  assert.equal(programKind('/gone/xfs-1/tool',wrapper('')),'node');
  assert.equal(programKind('/gone/xfs-1/tool',wrapper('; git status;')),null);
  assert.equal(programKind('/gone/xfs-1/tool',wrapper('').replace(process.execPath,'/bin/bash')),null);
  assert.equal(issue('tool --flag && shimmed; echo done && cd node_modules && true'),null);
  assert.equal(issue('git status'),'runs git, which is not a Node program');
  assert.equal(issue('native'),'runs native, which is not a Node program');
  assert.equal(issue('edited'),'runs edited, which is not a Node program');
  assert.equal(issue('missing-tool'),'runs missing-tool, which REDUE cannot find');
  assert.equal(issue('NODE_OPTIONS=--inspect tool'),'the script sets NODE_OPTIONS');
  assert.equal(issue('unset NODE_OPTIONS; tool'),'the script clears NODE_OPTIONS');
  assert.equal(issue('exec git log'),'runs git, which is not a Node program');
  assert.equal(issue('CI=1 exec tool'),null);
  assert.equal(issue('npm_config_node_options=--x tool'),'the script sets npm_config_node_options');
  assert.equal(issue('command -p git status'),'the script uses shell syntax REDUE cannot read');
  assert.equal(issue('command -v tool && tool'),null);
  // Node reads an environment file natively; a shim named node is a script.
  put(path.join(root,'system/node'),Buffer.from([0x7f,0x45,0x4c,0x46,2,1,1,0]),0o755);
  assert.equal(issue('node --env-file=.env x.js'),'runs node --env-file, which reads a file REDUE cannot see');
  assert.equal(issue('node x.js'),null);
  put(path.join(root,'system/node'),'#!/usr/bin/env bash\nexec real-node "$@"\n',0o755);
  assert.equal(issue('node x.js'),'runs node, which is not a Node program');
  // The pnpm executable's scripts are read as text, pre scripts included.
  assert.equal(issue('pnpm-native run check'),null);
  assert.equal(issue('pnpm-native nested'),null);
  assert.equal(issue('pnpm-native run bad'),'runs git, which is not a Node program');
  assert.equal(issue('pnpm-native --filter a run check'),'runs pnpm --filter, which REDUE cannot follow');
  assert.equal(issue('pnpm-native install'),'runs pnpm install, which REDUE cannot follow');
  assert.equal(pnpmRunIssue(['exec','tool'],{cwd:root,searchPath}),null);
  assert.equal(pnpmRunIssue(['run','gone'],{cwd:root,searchPath}),'runs pnpm run gone, a script package.json does not define');
  assert.ok(scriptPath(path.join(root,'a/b'),'/usr/bin').startsWith(path.join(root,'a/b/node_modules/.bin')+path.delimiter));
});

test('programs a recorded process starts: shells by their command, Node programs with the recorder',{skip:unsupported},t=>{
  const {root,searchPath}=programs(t);
  const passed={preload:true,bashEnv:false};
  const judge=(file,args,options,env=passed)=>childProgram({file,args,cwd:root,env,
    searchPath:`${searchPath}${path.delimiter}/bin${path.delimiter}/usr/bin`},options);
  assert.deepEqual(judge('sh',['-c','tool && shimmed']),{needsHeader:false});
  // npm's node-options setting replaces NODE_OPTIONS: the shell's Node programs would run unrecorded.
  assert.deepEqual(judge('sh',['-c','tool'],{},{preload:false,bashEnv:false}),
    {issue:"ran sh without REDUE's recorder in NODE_OPTIONS (a node-options setting replaces it)"});
  // Shells that read startup files.
  if(fs.existsSync('/bin/bash')){
    assert.deepEqual(judge('bash',['-c','tool']),{needsHeader:false});
    assert.deepEqual(judge('bash',['-c','tool'],{},{preload:true,bashEnv:true}),{issue:'ran bash, a shell that reads startup files REDUE cannot see'});
  }
  if(fs.existsSync('/bin/zsh'))assert.deepEqual(judge('zsh',['-c','tool']),{issue:'ran zsh, a shell that reads startup files REDUE cannot see'});
  assert.deepEqual(judge('/bin/sh',['-c','tool && git status']),{issue:'runs git, which is not a Node program'});
  assert.deepEqual(judge('sh',['script.sh']),{issue:'ran sh in a form REDUE cannot read'});
  assert.deepEqual(judge('tool',['x']),{needsHeader:true});
  assert.deepEqual(judge(process.execPath,['x.js']),{needsHeader:true});
  assert.deepEqual(judge('native',[]),{issue:'ran native, a program REDUE does not record'});
  assert.deepEqual(judge(path.join(root,'pnpm-pkg/pnpm-native'),['run','check']),{needsHeader:false,opaque:true});
  // Corepack's pnpm lists processes; only from the toolchain and only in that form.
  const toolchain=[path.join(root,'pnpm-pkg')],parentMain=path.join(root,'pnpm-pkg/package.json');
  if(fs.existsSync('/bin/ps')){
    assert.deepEqual(judge('/bin/ps',['-A','-o','ppid,pid'],{toolchain,parentMain}),{needsHeader:false});
    assert.deepEqual(judge('/bin/ps',['-A','-o','ppid,pid'],{toolchain:[],parentMain}),{issue:'ran ps, a program REDUE does not record'});
    assert.deepEqual(judge('/bin/ps',['aux'],{toolchain,parentMain}),{issue:'ran ps, a program REDUE does not record'});
  }
});

// An npm project whose scripts run small Node programs.
function project(t,scripts){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'rs-')),root=path.join(base,'project'),state=path.join(base,'redue-state');
  put(path.join(root,'package.json'),JSON.stringify({name:'script-fixture',version:'1.0.0',scripts}));
  put(path.join(root,'package-lock.json'),'{"name":"script-fixture","lockfileVersion":3}');
  put(path.join(root,'.gitignore'),'node_modules/\nout/\n');
  put(path.join(root,'src/value.js'),'pass\n');
  put(path.join(root,'README.md'),'# fixture\n');
  put(path.join(root,'docs/notes.md'),'# notes\n');
  // A Node bin, as npm links it.
  put(path.join(root,'node_modules/checker/package.json'),JSON.stringify({name:'checker',version:'1.0.0',bin:{checker:'cli.js'}}));
  put(path.join(root,'node_modules/checker/cli.js'),`#!/usr/bin/env node
const fs=require('node:fs');const value=fs.readFileSync('src/value.js','utf8');
if(value.includes('spawn'))require('node:child_process').spawnSync('ls',['.']);
// Through a link into a git-ignored directory, as a workspace package's built output.
if(value.includes('linked'))fs.readFileSync('node_modules/generated/report.txt');
if(value.includes('output')){fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/report.txt','r');}
// vue-tsc's global types, written then read at every run; or another installed file.
if(value.includes('vue')){fs.mkdirSync('node_modules/.vue-global-types',{recursive:true});
  fs.writeFileSync('node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts','// '+Date.now());fs.readFileSync('node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts');}
// detect-libc reads the ELF header of the process's own executable.
if(value.includes('exe')){const fd=fs.openSync(value.includes('parent')?'/proc/'+process.ppid+'/exe':'/proc/self/exe','r');fs.readSync(fd,Buffer.alloc(64),0,64,0);fs.closeSync(fd);}
if(value.includes('installed'))fs.writeFileSync('node_modules/checker/state.txt',String(Date.now()));
// TypeScript 7's tsc replaces its Node launcher with the native compiler.
if(value.includes('replace'))process.execve('/bin/sh',['sh','-c','cat /etc/hosts > /dev/null']);
// A file with no name (O_TMPFILE), as pnpm 12 writes one in node_modules.
if(value.includes('nameless')){const fd=fs.openSync('node_modules',0o20000000|fs.constants.O_DIRECTORY|fs.constants.O_RDWR,0o600);fs.writeSync(fd,'x');fs.closeSync(fd);}
if(value.includes('many'))for(let i=0;i<7;i++)fs.writeFileSync('node_modules/checker/state'+i+'.txt',String(Date.now()));
// Prettier formats every JSON file it finds, REDUE's hook settings among them.
if(value.includes('slow'))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1500);
if(value.includes('settings'))fs.readFileSync('.claude/settings.local.json','utf8');
// A formatter: rewrites src/fmt.js only when it is not formatted yet; or a stamp written at every run.
if(value.includes('format'))for(const f of fs.readdirSync('src').filter(f=>f.startsWith('fmt')))
  if(fs.readFileSync('src/'+f,'utf8')!=='formatted\\n')fs.writeFileSync('src/'+f,'formatted\\n');
if(value.includes('stamp'))fs.writeFileSync('src/stamp.js',String(Date.now()));
if(value.includes('unique'))fs.writeFileSync('src/u-'+Date.now()+'.js','');
if(value.includes('readdocs'))fs.readFileSync('docs/notes.md');
if(value.includes('listdocs'))fs.readdirSync('docs');
if(value.includes('deeplist'))fs.readdirSync('src',{recursive:true});
// A native addon (here one that does not exist: the load is what is recorded).
if(value.includes('addon'))try{process.dlopen({exports:{}},require('node:path').resolve('missing.node'));}catch{}
if(value.includes('cache')){fs.mkdirSync('.cache',{recursive:true});try{fs.readFileSync('.cache/state');}catch{}fs.writeFileSync('.cache/state',String(Date.now()));}
process.exit(value.includes('fail')?1:0);
`,0o755);
  fs.mkdirSync(path.join(root,'node_modules/.bin'),{recursive:true});
  fs.symlinkSync('../checker/cli.js',path.join(root,'node_modules/.bin/checker'));
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  t.after(()=>{try{invoke(root,state,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  return {root,state};
}
// These tests are about the general recipe: init would give the sandboxed
// recipe first where the sandbox can run (sandbox.test.mjs), so it is off.
function invoke(root,state,...args){
  const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key))),
    VSTATE_TEST_FAULTS:'1',VSTATE_TEST_SANDBOX:'unavailable'};
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env,encoding:'utf8',timeout:60000});
}
function good(root,state,...args){const result=invoke(root,state,...args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);return result.stdout;}
const row=(root,state,name)=>{const result=invoke(root,state,'status','--sync','--json');
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout).checks.find(c=>c.name===name);};
const write=(root,file,text)=>fs.writeFileSync(path.join(root,file),text);

test('init writes general typecheck and lint checks for scripts the strict recipes do not take, and refuses ones that start other programs',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker --max-warnings 0',test:'checker && node -e 1',typecheck:'checker && git diff'});
  // Without --recipe, the sandboxed recipe takes the typecheck (sandbox.test.mjs).
  const init=JSON.parse(good(root,state,'init','--dry-run','--json','--recipe','node-script'));
  const by=Object.fromEntries(init.checks.map(check=>[check.name,check]));
  assert.equal(by.lint.level,'ready',by.lint.reason);
  // Test scripts use the direct test recipe; init does not propose the general one for them.
  assert.equal(by.test.level,'recording');
  assert.notEqual(init.proposed_config.checks.find(check=>check.name==='test').qualification,'node-script-v1');
  assert.equal(by.typecheck.level,'recording');
  assert.match(by.typecheck.reason,/General recipe unavailable \(runs git, which is not a Node program\)/);
  const lint=init.proposed_config.checks.find(check=>check.name==='lint');
  assert.deepEqual({...lint,inputs:undefined,installedInputs:undefined},
    {name:'lint',script:'lint',kind:'lint',qualification:'node-script-v1',inputs:undefined,installedInputs:undefined});
  assert.deepEqual(lint.inputs,scriptCheckInputs().inputs);
});

test("init keeps a typecheck through TypeScript 7's native compiler recording-only and says why",{skip:unsupported},t=>{
  const {root,state}=project(t,{typecheck:'tsc --noEmit',lint:'tsgo --noEmit'});
  for(const [pkg,bin,version] of [['typescript','tsc','7.0.2'],['@typescript/native-preview','tsgo','7.0.0-dev.20260707.2']]){
    put(path.join(root,'node_modules',pkg,'package.json'),JSON.stringify({name:pkg,version,bin:{[bin]:`./bin/${bin}`}}));
    put(path.join(root,'node_modules',pkg,'bin',bin),'#!/usr/bin/env node\n',0o755);
    fs.symlinkSync(`../${pkg}/bin/${bin}`,path.join(root,'node_modules/.bin',bin));
  }
  const by=Object.fromEntries(JSON.parse(good(root,state,'init','--dry-run','--json','--recipe','node-script')).checks.map(c=>[c.name,c]));
  assert.equal(by.typecheck.level,'recording');
  assert.match(by.typecheck.reason,/runs tsc from typescript 7\.0\.2, a native compiler REDUE does not record/);
  assert.equal(by.lint.level,'recording');
  assert.match(by.lint.reason,/runs tsgo from @typescript\/native-preview 7\.0\.0-dev/);
});

test('a general check: CURRENT after a recorded pass, STALE on any checkout edit, and its recipe is named',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'node-script-v1');
  assert.match(good(root,state,'status','--sync'),/✓ lint {2}CURRENT \/ PASS {2}\(general recipe\)/);
  write(root,'src/value.js','fail\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  assert.equal(invoke(root,state,'run','lint').status,1);
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/FAIL',status.reason);
});

test('a general check that recorded every program stays CURRENT after an edit to documentation it never read, not one it read or listed',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  const receipt=()=>JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'),'utf8')).checks.lint;
  assert.deepEqual(receipt().docsRead,[]);
  write(root,'README.md','# fixture\n\nMore.\n');write(root,'docs/notes.md','# notes\n\nMore.\n');
  let status=row(root,state,'lint');
  assert.equal(status.freshness,'CURRENT',status.reason);assert.equal(status.declared_inputs_match,true);
  // A documentation file added or removed counts, read or not.
  put(path.join(root,'docs/new.md'),'# new\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  fs.rmSync(path.join(root,'docs/new.md'));assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // A code file the documentation patterns of sandbox-v3 name (CHANGELOG*) is not prose.
  put(path.join(root,'CHANGELOG.config.js'),'module.exports=1;\n');
  good(root,state,'run','lint');write(root,'CHANGELOG.config.js','module.exports=2;\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  good(root,state,'run','lint');
  // Any other file still counts.
  write(root,'src/value.js','pass readdocs listdocs\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  good(root,state,'run','lint');
  assert.deepEqual(receipt().docsRead,['docs/notes.md']);
  write(root,'README.md','# fixture\n\nAgain.\n');
  assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // A documentation file it read.
  write(root,'docs/notes.md','# notes\n\nChanged.\n');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'STALE');assert.deepEqual(status.changed_inputs,['docs/notes.md']);
  good(root,state,'run','lint');assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // A new file in a folder it listed.
  put(path.join(root,'docs/other.md'),'# other\n');
  status=row(root,state,'lint');assert.equal(status.freshness,'STALE',status.reason);
  // A run that loaded a native addon, or listed a folder recursively, keeps
  // no such list: every edit counts.
  for(const word of ['addon','deeplist']){
    write(root,'src/value.js',`pass ${word}\n`);
    good(root,state,'run','lint');
    assert.equal(receipt().docsRead,undefined,word);
    assert.equal(row(root,state,'lint').freshness,'CURRENT');
    write(root,'README.md',`# fixture\n\n${word}\n`);
    assert.equal(row(root,state,'lint').freshness,'STALE',word);
  }
});

test('a general check that starts a native program is UNVERIFIED and names it; caches and ignored outputs are not inputs',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  // A git-ignored file that exists before the observer starts is not indexed.
  put(path.join(root,'out/report.txt'),'r');
  fs.symlinkSync('../out',path.join(root,'node_modules/generated'),'dir');
  good(root,state,'init');good(root,state,'start');
  write(root,'src/value.js','spawn\n');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/ran ls, a program REDUE does not record/);
  // A read through node_modules into an ignored directory is not an installed file.
  write(root,'src/value.js','linked\n');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/read out\/report\.txt, which REDUE does not observe/);
  write(root,'src/value.js','cache output\n');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
});

test("a general check that reads REDUE's own hook settings, which git ignores, keeps them by content: CURRENT, STALE when they change",{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  // As setup leaves them: ignored through this clone's exclude file.
  put(path.join(root,'.claude/settings.local.json'),'{"hooks":{}}\n');
  fs.appendFileSync(path.join(root,'.git/info/exclude'),'.claude/settings.local.json\n');
  write(root,'src/value.js','settings\n');
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  write(root,'.claude/settings.local.json','{"hooks":{"Stop":[]}}\n');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'STALE');
  assert.match(status.reason,/a lookup the last run made answers differently now: .*\.claude\/settings\.local\.json/);
  good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').freshness,'CURRENT');
});

test('a passing run that changed its own input once needs a run: CURRENT after it when it writes nothing, NOT VERIFIABLE when it writes again, asked once when it writes other files',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  write(root,'src/value.js','format\n');write(root,'src/fmt.js','raw\n');
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');assert.match(status.reason,/src\/fmt\.js/);assert.equal(status.needs_run,true);
  good(root,state,'run','lint');
  assert.equal(`${row(root,state,'lint').freshness}/${row(root,state,'lint').result}`,'CURRENT/PASS');
  // An edit between two runs that each reformat a file: asked again.
  write(root,'src/fmt2.js','raw\n');good(root,state,'run','lint');assert.equal(row(root,state,'lint').needs_run,true);
  write(root,'src/fmt3.js','raw\n');good(root,state,'run','lint');
  status=row(root,state,'lint');assert.match(status.reason,/src\/fmt3\.js/);assert.equal(status.needs_run,true);
  good(root,state,'run','lint');assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // The same file reformatted twice with an edit in between: not NOT VERIFIABLE, asked again.
  write(root,'src/fmt.js','raw\n');good(root,state,'run','lint');
  write(root,'src/fmt.js','raw\n');good(root,state,'run','lint');
  status=row(root,state,'lint');assert.notEqual(status.verifiable,false,status.reason);assert.equal(status.needs_run,true);
  good(root,state,'run','lint');assert.equal(row(root,state,'lint').freshness,'CURRENT');
  write(root,'src/value.js','stamp\n');good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').needs_run,true);
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(status.verifiable,false,status.reason);assert.equal(status.needs_run,false);
  // A new file at every run, after a settled run: asked once, then not again until an input changes.
  write(root,'src/value.js','plain\n');good(root,state,'run','lint');assert.equal(row(root,state,'lint').freshness,'CURRENT');
  write(root,'src/value.js','unique\n');good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').needs_run,true);
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');assert.equal(status.needs_run,false);
});

test('a git-ignored file written after a run is not an input of a general check, as at the observer\'s start',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  // One before the observer starts, as the cold scan sees it.
  put(path.join(root,'out/old.js'),'1\n');
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // A build writing its git-ignored output: new, rewritten and removed files.
  put(path.join(root,'out/new.js'),'1\n');put(path.join(root,'out/old.js'),'2\n');put(path.join(root,'out/deep/x.js'),'1\n');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  fs.rmSync(path.join(root,'out'),{recursive:true});
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  // A file git does not ignore still counts.
  write(root,'src/other.js','1\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
});

test('another program writing a git-ignored file during a general check\'s run leaves the run settled',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  write(root,'src/value.js','slow\n');
  good(root,state,'init');good(root,state,'start');
  // As a watch-mode build: it writes out/ while the check runs.
  const writer=spawn(process.execPath,['-e',"setTimeout(()=>{require('fs').mkdirSync('out',{recursive:true});require('fs').writeFileSync('out/x.js',String(Date.now()));},500)"],{cwd:root,stdio:'ignore'});
  t.after(()=>{try{writer.kill();}catch{}});
  good(root,state,'run','lint');
  const status=row(root,state,'lint');
  assert.ok(fs.existsSync(path.join(root,'out/x.js')));
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
});

test('tool outputs: pnpm state and its temporary files when the pnpm executable ran, vue-tsc types the run wrote',()=>{
  const guard=(opaque,wrote=[])=>({opaque,wroteInstalled:rel=>wrote.includes(rel)});
  assert.equal(toolOutput('node_modules/.pnpm-workspace-state-v1.json',guard(true)),true);
  assert.equal(toolOutput('node_modules/.tmpfP0VHQ',guard(true)),true);
  assert.equal(toolOutput('node_modules/.tmpfP0VHQ',guard(false)),false);
  assert.equal(toolOutput('node_modules/foo/.tmpfP0VHQ',guard(true)),false);
  assert.equal(toolOutput('packages/a/node_modules/.tmpfP0VHQ',guard(true)),false);
  const types='packages/a/node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts';
  assert.equal(toolOutput(types,guard(false,[types])),true);
  assert.equal(toolOutput(types,guard(true)),false);
  assert.equal(toolOutput('node_modules/x/node_modules/.vue-global-types/a.d.ts',guard(false,['node_modules/x/node_modules/.vue-global-types/a.d.ts'])),false);
});

test("pnpm's file with no name: on Linux, when the pnpm executable ran and no file has that name",t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'rs-nameless-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const ran={opaque:true},other={opaque:false},none=[{},{}];
  const nameless=(rel,guard=ran,checkpoints=none,platform='linux')=>pnpmNameless(rel,guard,root,checkpoints,platform);
  assert.equal(nameless('node_modules/#9234896'),true);
  assert.equal(nameless('node_modules/#9234896',ran,none,'darwin'),false);
  assert.equal(nameless('node_modules/#9234896',other),false);
  assert.equal(nameless('node_modules/#tmp'),false);
  assert.equal(nameless('packages/a/node_modules/#9234896'),false);
  assert.equal(nameless('node_modules/a/#9234896'),false);
  // A file with that name, now or at either checkpoint, is a file; a
  // checkpoint without its file map cannot tell.
  assert.equal(nameless('node_modules/#9234896',ran,[{'node_modules/#9234896':'h'},{}]),false);
  assert.equal(nameless('node_modules/#9234896',ran,[{},{'node_modules/#9234896':'h'}]),false);
  assert.equal(nameless('node_modules/#9234896',ran,[{},undefined]),false);
  put(path.join(root,'node_modules/#9234896'),'x');
  assert.equal(nameless('node_modules/#9234896'),false);
});

test('a file with no name written by a recorded process, not pnpm, leaves the run UNVERIFIED and is named',{skip:process.platform!=='linux'},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');
  write(root,'src/value.js','nameless\n');
  good(root,state,'run','lint');
  const status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/during execution: node_modules\/#\d+/);
});

test('installed files a tool rewrites during a run stay inputs; the run keeps them as it left them',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  write(root,'src/value.js','vue\n');
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // A later change to the file is an input change.
  write(root,'node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts','// other');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  // Any other installed file the run writes leaves it UNVERIFIED.
  write(root,'src/value.js','installed\n');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  // The reason names the file the run did not explain.
  assert.match(status.reason,/declared input event occurred during execution: node_modules\/checker\/state\.txt/);
  // At most five, then a count.
  write(root,'src/value.js','many\n');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.match(status.reason,/during execution: node_modules\/checker\/state0\.txt, (node_modules\/checker\/state\d\.txt, ){3}node_modules\/checker\/state4\.txt and 2 more/);
});

test("a read of the process's own executable through /proc is Node's, not an outside file",{skip:process.platform!=='linux'},t=>{
  const {root,state}=project(t,{lint:'checker'});
  write(root,'src/value.js','exe\n');
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  // Another process's executable (the shell npm ran the script with) is not Node's.
  write(root,'src/value.js','exe parent\n');
  good(root,state,'run','lint');
  status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/\/proc\/\d+\/exe/);
});

// The fixture's checker runs under the node on PATH.
const pathExecve=()=>spawnSync('node',['-p','typeof process.execve'],{encoding:'utf8'}).stdout?.trim()==='function';
test('a script that replaces itself with another program is UNVERIFIED and names it',{skip:unsupported||(pathExecve()?false:'process.execve needs Node 22.15 or later')},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');
  write(root,'src/value.js','replace\n');
  good(root,state,'run','lint');
  const status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/\bcat\b/);
});

test("an installed file whose hard links all stay in node_modules is seen; a link added later is noticed",{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  // As esbuild's install links its binary into its platform package.
  put(path.join(root,'node_modules/@esbuild/x/bin/esbuild'),'binary');
  fs.mkdirSync(path.join(root,'node_modules/esbuild/bin'),{recursive:true});
  fs.linkSync(path.join(root,'node_modules/@esbuild/x/bin/esbuild'),path.join(root,'node_modules/esbuild/bin/esbuild'));
  good(root,state,'init');good(root,state,'start');good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  fs.linkSync(path.join(root,'node_modules/esbuild/bin/esbuild'),path.join(root,'..','elsewhere'));
  status=row(root,state,'lint');
  assert.notEqual(status.freshness,'CURRENT',JSON.stringify(status));
});

test('run --if-due runs a check only when its last pass does not apply, with the exit code a plain run gives',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');good(root,state,'run','lint');
  assert.equal(row(root,state,'lint').freshness,'CURRENT');
  // Still applies: not run, exit 0, and it says so.
  let out=invoke(root,state,'run','lint','--if-due');
  assert.equal(out.status,0,out.stderr);assert.match(out.stderr,/lint passed on these exact inputs .*not run again/);
  assert.doesNotMatch(out.stdout,/recorded/);
  // A change: it runs through REDUE, and a failure keeps its exit code.
  write(root,'src/value.js','fail\n');
  out=invoke(root,state,'run','lint','--if-due');
  assert.equal(out.status,1,out.stderr+out.stdout);
  write(root,'src/value.js','pass\n');good(root,state,'run','lint');
  // REDUE_FORCE=1 runs it anyway.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key)));
  out=spawnSync(process.execPath,[bin,'--state-dir',state,'run','lint','--if-due'],{cwd:root,env:{...env,REDUE_FORCE:'1'},encoding:'utf8'});
  assert.equal(out.status,0);assert.match(out.stdout,/recorded/);
  // redue stats: four recorded runs, one skip, and the STALE check --if-due ran.
  const stats=JSON.parse(good(root,state,'stats','--json')).checks.find(c=>c.name==='lint');
  assert.deepEqual([stats.runs,stats.passed,stats.failed,stats.skips,stats.stale],[4,3,1,1,1],JSON.stringify(stats));
  assert.ok(stats.savedMs>0&&stats.runMs>0,JSON.stringify(stats));
});

test("npm's node-options setting replaces NODE_OPTIONS: the run is UNVERIFIED, not CURRENT without a recorder",{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker && checker'});
  put(path.join(root,'.npmrc'),'node-options=--max-old-space-size=4096\n');
  execFileSync('git',['add','.npmrc'],{cwd:root});
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  const status=row(root,state,'lint');
  assert.equal(status.freshness,'UNVERIFIED');
  assert.match(status.reason,/without REDUE's recorder in NODE_OPTIONS/);
});
