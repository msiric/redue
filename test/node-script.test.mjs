import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {childProgram,commandLineIssue,parseCommandLine,pnpmRunIssue,programKind,scriptCheckInputs,scriptPath} from '../src/node-script.mjs';
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

test('pnpm launchers are trusted only as a release writes them',t=>{
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

test('a script may start only Node programs, the pnpm executable and shell builtins',t=>{
  const {root,searchPath}=programs(t);
  const issue=text=>commandLineIssue(text,{cwd:root,searchPath});
  assert.equal(programKind(path.join(root,'node_modules/tool/bin/tool.js')),'node');
  assert.equal(programKind(path.join(root,'node_modules/.bin/shimmed')),'node');
  assert.equal(programKind(path.join(root,'node_modules/.bin/native')),null);
  assert.equal(programKind(path.join(root,'pnpm-pkg/pnpm-native')),'pnpm');
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

test('programs a recorded process starts: shells by their command, Node programs with the recorder',t=>{
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
  // A Node bin, as npm links it.
  put(path.join(root,'node_modules/checker/package.json'),JSON.stringify({name:'checker',version:'1.0.0',bin:{checker:'cli.js'}}));
  put(path.join(root,'node_modules/checker/cli.js'),`#!/usr/bin/env node
const fs=require('node:fs');const value=fs.readFileSync('src/value.js','utf8');
if(value.includes('spawn'))require('node:child_process').spawnSync('ls',['.']);
// Through a link into a git-ignored directory, as a workspace package's built output.
if(value.includes('linked'))fs.readFileSync('node_modules/generated/report.txt');
if(value.includes('output')){fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/report.txt','r');}
if(value.includes('cache')){fs.mkdirSync('.cache',{recursive:true});try{fs.readFileSync('.cache/state');}catch{}fs.writeFileSync('.cache/state',String(Date.now()));}
process.exit(value.includes('fail')?1:0);
`,0o755);
  fs.mkdirSync(path.join(root,'node_modules/.bin'),{recursive:true});
  fs.symlinkSync('../checker/cli.js',path.join(root,'node_modules/.bin/checker'));
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  t.after(()=>{try{invoke(root,state,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  return {root,state};
}
function invoke(root,state,...args){
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key)));
  return spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env,encoding:'utf8',timeout:60000});
}
function good(root,state,...args){const result=invoke(root,state,...args);
  assert.equal(result.status,0,`${args.join(' ')}: ${result.stderr}\n${result.stdout}`);return result.stdout;}
const row=(root,state,name)=>{const result=invoke(root,state,'status','--sync','--json');
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout).checks.find(c=>c.name===name);};
const write=(root,file,text)=>fs.writeFileSync(path.join(root,file),text);

test('init writes general checks for scripts the strict recipes do not take, and refuses ones that start other programs',t=>{
  const {root,state}=project(t,{lint:'checker --max-warnings 0',test:'checker && node -e 1',typecheck:'checker && git diff'});
  const init=JSON.parse(good(root,state,'init','--dry-run','--json'));
  const by=Object.fromEntries(init.checks.map(check=>[check.name,check]));
  assert.equal(by.lint.level,'ready',by.lint.reason);
  assert.equal(by.test.level,'ready',by.test.reason);
  assert.equal(by.typecheck.level,'recording');
  assert.match(by.typecheck.reason,/General recipe unavailable \(runs git, which is not a Node program\)/);
  const lint=init.proposed_config.checks.find(check=>check.name==='lint');
  assert.deepEqual({...lint,inputs:undefined,installedInputs:undefined},
    {name:'lint',script:'lint',kind:'lint',qualification:'node-script-v1',inputs:undefined,installedInputs:undefined});
  assert.deepEqual(lint.inputs,scriptCheckInputs().inputs);
});

test('a general check: CURRENT after a recorded pass, STALE on any checkout edit, and its recipe is named',{skip:unsupported},t=>{
  const {root,state}=project(t,{lint:'checker'});
  good(root,state,'init');good(root,state,'start');
  good(root,state,'run','lint');
  let status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/PASS',status.reason);
  assert.equal(status.recipe,'node-script-v1');
  assert.match(good(root,state,'status','--sync'),/✓ lint {2}CURRENT \/ PASS {2}\(general recipe\)/);
  // The whole checkout is the input, documentation included.
  write(root,'README.md','# fixture\n\nMore.\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  good(root,state,'run','lint');
  write(root,'src/value.js','fail\n');
  assert.equal(row(root,state,'lint').freshness,'STALE');
  assert.equal(invoke(root,state,'run','lint').status,1);
  status=row(root,state,'lint');
  assert.equal(`${status.freshness}/${status.result}`,'CURRENT/FAIL',status.reason);
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
