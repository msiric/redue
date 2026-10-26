import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const bin=path.resolve('bin/redue.mjs');
const unsupported=process.platform==='win32'?'the general recipe records runs on macOS and Linux':false;
const put=(file,value,mode)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,mode?{mode}:undefined);};

// A project with one lint script the general recipe takes, and a home of its
// own for REDUE's state (short: the observer's socket path is limited).
function project(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'rs-'))),root=path.join(base,'p');
  put(path.join(root,'package.json'),JSON.stringify({name:'setup-fixture',version:'1.0.0',scripts:{lint:'checker'}}));
  put(path.join(root,'package-lock.json'),'{"name":"setup-fixture","lockfileVersion":3}');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  put(path.join(root,'src/value.js'),'pass\n');
  put(path.join(root,'node_modules/checker/package.json'),JSON.stringify({name:'checker',version:'1.0.0',bin:{checker:'cli.js'}}));
  put(path.join(root,'node_modules/checker/cli.js'),"#!/usr/bin/env node\nrequire('node:fs').readFileSync('src/value.js');\n",0o755);
  fs.mkdirSync(path.join(root,'node_modules/.bin'),{recursive:true});
  fs.symlinkSync('../checker/cli.js',path.join(root,'node_modules/.bin/checker'));
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_/i.test(key))),
    HOME:base,XDG_STATE_HOME:path.join(base,'state')};
  const redue=(...args)=>spawnSync(process.execPath,[bin,...args],{cwd:root,env,encoding:'utf8',timeout:120000});
  t.after(()=>{redue('remove','--yes');fs.rmSync(base,{recursive:true,force:true});});
  return {root,redue};
}
// The setup record: one per checkout in the shared Git directory.
const recordOf=root=>{const name=fs.readdirSync(path.join(root,'.git')).find(file=>/^redue-setup-[0-9a-f]{16}\.json$/.test(file));
  return name?path.join(root,'.git',name):null;};
// Every file in the checkout outside .git and node_modules, with its hash.
function files(root){
  const out={};
  (function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name),rel=path.relative(root,full);
    if(rel==='.git'||rel==='node_modules')continue;
    if(entry.isDirectory())walk(full);else out[rel]=createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  }})(root);
  return out;
}

test('setup claude: one command writes and prints every file, records the check, and changes nothing the second time',{skip:unsupported},t=>{
  const {root,redue}=project(t),before=files(root);
  // Without a terminal it asks for --yes instead of prompting.
  const refused=redue('setup','claude');
  assert.equal(refused.status,2);assert.match(refused.stderr,/run again with --yes/);
  assert.deepEqual(files(root),before);
  const first=redue('setup','claude','--yes');
  assert.equal(first.status,0,first.stderr+first.stdout);
  const created=Object.keys(files(root)).filter(file=>!Object.hasOwn(before,file)).sort();
  assert.deepEqual(created,['.claude/settings.local.json','.claude/skills/redue-verification/SKILL.md','.redue/agents/claude.json',
    'CLAUDE.md','redue.config.json']);
  // The setup record stays in this clone's Git directory, out of commits.
  for(const file of [...created,path.basename(recordOf(root)),'.git/info/exclude'])
    assert(first.stdout.includes(file),`setup did not print ${file}:\n${first.stdout}`);
  assert.equal(JSON.parse(fs.readFileSync(recordOf(root),'utf8')).configCreated,true);
  assert.match(first.stdout,/Recording lint once/);
  assert.match(first.stdout,/lint: CURRENT \/ PASS/);
  // The hooks' settings are ignored locally.
  assert.equal(spawnSync('git',['check-ignore','-q','.claude/settings.local.json'],{cwd:root}).status,0);
  const after=files(root);
  const second=redue('setup','claude','--yes');
  assert.equal(second.status,0,second.stderr+second.stdout);
  assert.match(second.stdout,/keep redue\.config\.json/);
  assert.match(second.stdout,/Already CURRENT: lint/);
  assert.deepEqual(files(root),after);
});

test('remove undoes setup: files, local ignore and state; a config edited since setup is kept',{skip:unsupported},t=>{
  const {root,redue}=project(t),before=files(root);
  const exclude=fs.readFileSync(path.join(root,'.git/info/exclude'),'utf8');
  assert.equal(redue('setup','claude','--yes').status,0);
  const removed=redue('remove','--yes');
  assert.equal(removed.status,0,removed.stderr+removed.stdout);
  assert.deepEqual(files(root),before);
  assert.equal(fs.readFileSync(path.join(root,'.git/info/exclude'),'utf8'),exclude);
  assert.equal(recordOf(root),null);
  // No folder of the integration is left either.
  for(const dir of ['.claude','.redue'])assert(!fs.existsSync(path.join(root,dir)),dir);
  assert.match(redue('remove','--yes').stdout,/No setup record for this checkout/);
  // A config the user edited after setup stays.
  assert.equal(redue('setup','claude','--yes').status,0);
  const config=path.join(root,'redue.config.json');
  fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('"lint"','"lint" '));
  const kept=redue('remove','--yes');
  assert.match(kept.stdout,/keep redue\.config\.json \(edited since setup\)/);
  assert(fs.existsSync(config));
});

test('a second setup keeps the account of the first: remove keeps a config edited in between, and state that predates setup',{skip:unsupported},t=>{
  const {root,redue}=project(t);
  assert.equal(redue('setup','claude','--yes').status,0);
  const config=path.join(root,'redue.config.json');
  fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('"lint"','"lint" '));
  assert.equal(redue('setup','claude','--yes').status,0);
  assert.match(redue('remove','--yes').stdout,/keep redue\.config\.json \(edited since setup\)/);
  // A project set up by hand: setup finds config and state, and remove leaves them.
  assert.equal(redue('start').status,0);
  assert.equal(redue('setup','claude','--yes').status,0);
  const removed=redue('remove','--yes');
  assert.match(removed.stdout,/keep the observer state \(it predates setup\)/);
  assert(fs.existsSync(config));
});

test('remove still undoes setup after the config was deleted by hand',{skip:unsupported},t=>{
  const {root,redue}=project(t),before=files(root);
  assert.equal(redue('setup','claude','--yes').status,0);
  fs.unlinkSync(path.join(root,'redue.config.json'));
  const removed=redue('remove','--yes');
  assert.equal(removed.status,0,removed.stderr+removed.stdout);
  const left=files(root);delete before['redue.config.json'];
  assert.deepEqual(left,before);
  assert.equal(recordOf(root),null);
});

test('setup refuses a project without installed dependencies or usable scripts, before writing',{skip:unsupported},t=>{
  const {root,redue}=project(t);
  fs.renameSync(path.join(root,'node_modules'),path.join(root,'..','modules-aside'));
  const missing=redue('setup','claude','--yes');
  assert.equal(missing.status,2);assert.match(missing.stderr,/dependencies are not installed/);
  fs.renameSync(path.join(root,'..','modules-aside'),path.join(root,'node_modules'));
  put(path.join(root,'package.json'),JSON.stringify({name:'setup-fixture',version:'1.0.0',scripts:{}}));
  const none=redue('setup','claude','--yes');
  assert.equal(none.status,2);assert.match(none.stderr,/nothing to set up/);
  assert(!fs.existsSync(path.join(root,'redue.config.json')));
});
