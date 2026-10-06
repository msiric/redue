import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {discoverConfig,projectState} from '../src/project-location.mjs';
const bin=path.resolve('bin/redue.mjs');
const put=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
function fixture(t){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-agent-')),root=path.join(fs.realpathSync(base),'Project é space');
  fs.mkdirSync(root);execFileSync('git',['init','-q'],{cwd:root});
  const config={schema:1,checks:[{name:'typecheck',command:['@node','check.mjs'],inputs:['src/**']}]};
  put(path.join(root,'redue.config.json'),JSON.stringify(config));
  put(path.join(root,'src/deep/file.ts'),'export const x=1;');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const run=(...args)=>spawnSync(process.execPath,[bin,...args],{cwd:root,encoding:'utf8',timeout:15000});
  const ok=(...args)=>{const r=run(...args);assert.equal(r.status,0,r.stderr+r.stdout);return r;};
  return {base,root,run,ok,read:p=>fs.readFileSync(path.join(root,p),'utf8'),put:(p,s)=>put(path.join(root,p),s)};
}
test('preview and unconfirmed noninteractive setup make no writes',t=>{
  const f=fixture(t),before=fs.readdirSync(f.root);
  const preview=JSON.parse(f.ok('agent','setup','codex','--dry-run','--json').stdout);
  assert.equal(preview.applied,false);assert.equal(preview.changes.length,3);
  f.ok('agent','setup','codex');assert.deepEqual(fs.readdirSync(f.root),before);
  assert.equal(f.run('agent','setup','codex','--apply','--dry-run').status,2);
});
test('setup is idempotent; user instruction edits survive two hosts and removal',t=>{
  const f=fixture(t);f.put('AGENTS.md','Existing project policy.\r\n');
  f.ok('agent','setup','codex','--apply');const once=f.read('AGENTS.md');
  f.ok('agent','setup','codex','--apply');assert.equal(f.read('AGENTS.md'),once);
  f.ok('agent','setup','claude','--apply');const claude=f.read('CLAUDE.md');
  fs.appendFileSync(path.join(f.root,'AGENTS.md'),'\nUser added policy.\n');
  f.ok('agent','remove','codex','--apply');
  assert.equal(f.read('AGENTS.md'),'Existing project policy.\r\n\nUser added policy.\n');
  assert.equal(f.read('CLAUDE.md'),claude);
  assert(!fs.existsSync(path.join(f.root,'.agents/skills/redue-verification/SKILL.md')));
  f.ok('agent','remove','claude','--apply');assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
  assert(fs.existsSync(path.join(f.root,'redue.config.json')));
  f.ok('agent','remove','codex','--apply');
});
test('modified managed instruction or skill blocks setup/removal without partial edits',t=>{
  for(const kind of ['AGENTS.md','.agents/skills/redue-verification/SKILL.md']){
    const f=fixture(t);f.ok('agent','setup','codex','--apply');
    f.put(kind,f.read(kind).replace('verification','changed verification'));
    const instruction=f.read('AGENTS.md'),skill=f.read('.agents/skills/redue-verification/SKILL.md');
    for(const action of ['setup','remove'])assert.equal(f.run('agent',action,'codex','--apply').status,2);
    assert.equal(f.read('AGENTS.md'),instruction);assert.equal(f.read('.agents/skills/redue-verification/SKILL.md'),skill);
  }
});
test('unowned existing skill is never overwritten',t=>{
  const f=fixture(t);f.put('.agents/skills/redue-verification/SKILL.md','User skill');
  assert.equal(f.run('agent','setup','codex','--apply').status,2);
  assert.equal(f.read('.agents/skills/redue-verification/SKILL.md'),'User skill');
  assert(!fs.existsSync(path.join(f.root,'AGENTS.md')));
});
test('instruction precedence is surfaced without changing overrides or global settings',t=>{
  const f=fixture(t);f.put('AGENTS.override.md','Override');
  assert.match(f.run('agent','setup','codex','--apply').stderr,/shadow/);
  f.put('.claude/CLAUDE.md','Other instructions');
  assert.match(f.run('agent','setup','claude','--apply').stderr,/reconcile/);
  const doctor=JSON.parse(f.ok('agent','doctor','--json').stdout);
  assert(doctor.hosts.every(h=>h.integrity==='conflict'));assert.equal(doctor.behavior_verified,false);
});
test('missing CLI/config doctor is read-only and not behavioral verification',t=>{
  const f=fixture(t);fs.unlinkSync(path.join(f.root,'redue.config.json'));
  const before=fs.readdirSync(f.root);
  const out=spawnSync(process.execPath,[bin,'agent','doctor','--json'],{cwd:f.root,
    env:{...process.env,PATH:''},encoding:'utf8',timeout:5000});
  assert.equal(out.status,0,out.stderr);const d=JSON.parse(out.stdout);
  assert.equal(d.command.path,null);assert.match(d.project.error,/missing/);
  assert.equal(d.behavior_verified,false);assert.equal(d.observation,null);
  assert.deepEqual(fs.readdirSync(f.root),before);
});
test('nested working directory selects the same config/state and rejects ambiguous configs',t=>{
  const f=fixture(t),nested=path.join(f.root,'src/deep'),config=path.join(f.root,'redue.config.json');
  assert.equal(discoverConfig(nested),config);
  assert.equal(projectState(f.root,discoverConfig(nested)),projectState(f.root,discoverConfig(f.root)));
  const r=spawnSync(process.execPath,[bin,'agent','setup','codex','--apply'],{cwd:nested,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert(fs.existsSync(path.join(f.root,'AGENTS.md')));
  f.put('src/redue.config.json',f.read('redue.config.json'));
  assert.throws(()=>discoverConfig(nested),/multiple/);
  const ambiguous=spawnSync(process.execPath,[bin,'status','--json'],{cwd:nested,encoding:'utf8'});
  assert.equal(ambiguous.status,2);
  const selected=spawnSync(process.execPath,[bin,'--config','../../redue.config.json','agent','doctor','--json'],{cwd:nested,encoding:'utf8'});
  assert.equal(selected.status,0,selected.stderr);assert.equal(JSON.parse(selected.stdout).project.config,config);
});
test('config search stops at nested Git roots',t=>{
  const f=fixture(t),nested=path.join(f.root,'src/deep');fs.mkdirSync(path.join(nested,'.git'));
  assert.equal(discoverConfig(nested),path.join(nested,'redue.config.json'));
});
test('symlink/junction parent and hardlinked instruction are refused; targets preserved',t=>{
  for(const linkedParent of [true,false]){
    const f=fixture(t),outside=path.join(f.base,'outside');fs.mkdirSync(outside);
    if(linkedParent)fs.symlinkSync(outside,path.join(f.root,'.agents'),process.platform==='win32'?'junction':'dir');
    else{put(path.join(outside,'policy'),'External policy');fs.linkSync(path.join(outside,'policy'),path.join(f.root,'AGENTS.md'));}
    assert.equal(f.run('agent','setup','codex','--apply').status,2);
    if(!linkedParent)assert.equal(fs.readFileSync(path.join(outside,'policy'),'utf8'),'External policy');
    assert(!fs.existsSync(path.join(outside,'skills')));
  }
});
test('removal refuses a replaced link and preserves other host and receipts',t=>{
  const f=fixture(t);f.ok('agent','setup','codex','--apply');f.ok('agent','setup','claude','--apply');
  const target=path.join(f.root,'.agents/skills/redue-verification/SKILL.md'),other=path.join(f.base,'other');
  put(other,'Unrelated file');fs.unlinkSync(target);fs.linkSync(other,target);
  const prior=f.read('CLAUDE.md');assert.equal(f.run('agent','remove','codex','--apply').status,2);
  assert.equal(fs.readFileSync(other,'utf8'),'Unrelated file');assert.equal(f.read('CLAUDE.md'),prior);
});
test('explicit alternate config stays project-relative, and external setup is refused',t=>{
  const f=fixture(t);fs.renameSync(path.join(f.root,'redue.config.json'),path.join(f.root,'checks é.json'));
  f.ok('--config','checks é.json','agent','setup','codex','--apply');
  assert(f.read('AGENTS.md').includes('checks é.json'));assert(!f.read('AGENTS.md').includes(f.root));
  const outer=path.join(f.base,'external.json');put(outer,JSON.stringify({schema:1,root:'Project é space',checks:[{name:'x'}]}));
  assert.match(f.run('--config',outer,'agent','setup','claude','--apply').stderr,/project-local/);
});

test('tampered ownership block cannot swallow unrelated instructions',t=>{
  const f=fixture(t);f.put('AGENTS.md','User policy');f.ok('agent','setup','codex','--apply');
  const marker='.redue/agents/codex.json',m=JSON.parse(f.read(marker));m.block='User policy'+m.block;
  f.put(marker,JSON.stringify(m));const before=f.read('AGENTS.md');
  assert.equal(f.run('agent','remove','codex','--apply').status,2);assert.equal(f.read('AGENTS.md'),before);
});
test('explicit state maintenance bypasses ambiguous project discovery',t=>{
  const f=fixture(t);f.put('vstate.config.json',f.read('redue.config.json'));
  const state=path.join(f.base,'redue-absent-state');
  for(const action of ['stop','remove-state'])f.ok('--state-dir',state,action);
});
