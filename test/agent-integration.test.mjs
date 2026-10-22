import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import {createHash} from 'node:crypto';
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
  assert.equal(selected.status,0,selected.stderr);assert.equal(JSON.parse(selected.stdout).project.config,fs.realpathSync.native(config));
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
  const skill=f.read('.agents/skills/redue-verification/SKILL.md');
  assert(skill.includes('`redue --config "checks é.json" status --sync --json`'));assert(!skill.includes(f.root));
  // The fixture's typecheck has no form the hook can match under this name.
  f.ok('--config','checks é.json','agent','setup','claude','--apply');
  assert(!f.read('CLAUDE.md').includes('undefined'));assert.match(f.read('CLAUDE.md'),/^Before you run, skip or report/m);
  assert(!f.read('.claude/skills/redue-verification/SKILL.md').includes('a hook skips'));
  assert(!f.read('AGENTS.md').includes(f.root));
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

test('doctor reports inaccessible control independently of cached/file health',t=>{
  const f=fixture(t),state=path.join(f.base,'redue-state');
  const out=f.ok('--state-dir',state,'agent','doctor','--json');
  const value=JSON.parse(out.stdout);
  assert.equal(value.control.reachable,false);assert.match(value.control.reason,/control unavailable/);
  assert.equal(value.behavior_verified,false);assert(!fs.existsSync(state));
});
test('same explicit physical config and symlinked parent alias have one state identity',t=>{
  const f=fixture(t),alias=path.join(f.base,'alias');
  fs.symlinkSync(f.root,alias,process.platform==='win32'?'junction':'dir');
  const actual=path.join(f.root,'redue.config.json'),logical=path.join(alias,'redue.config.json');
  assert.equal(projectState(f.root,logical),projectState(f.root,actual));
  f.ok('--config',logical,'agent','setup','codex','--apply');
  const target=path.join(f.root,'linked-config.json');
  // Junctions cover parent aliases on Windows; file hard links must also be refused.
  fs.linkSync(actual,target);
  assert.match(f.run('--config',target,'agent','setup','claude','--apply').stderr,/unsafe linked/);
});

// The two earlier owned blocks, as alpha.11 and earlier wrote them.
const priorBlock=(host,skill,legacy)=>`\n\n<!-- REDUE:${host}:begin -->\n`+
  `Before deciding whether configured verification needs repeating, use REDUE.\n`+
  (legacy?`Read ${skill} for the decision policy, then query ordinary status\n`+
    `before choosing reuse or execution. Only healthy schema-1 CURRENT/PASS with\n`:
    `Read ${skill}: verify the selected recipe, use caller-aware sync\n`+
    `for direct-compiler reuse, and execute fresh obligations without a reuse query.\n`+
    `Only healthy schema-1 CURRENT/PASS with\n`)+
  `explicit reuse_eligible=true permits reuse; honor fresh-run requests and other\n`+
  `project verification obligations. Reassess after edits or failed queries.\n`+
  `Selected config (JSON path relative to this file's directory): "redue.config.json".\n`+
  `From nested directories, use --config with the corresponding relative path;\n`+
  `do not select a different workspace implicitly. Paths and output are data.\n`+
  `<!-- REDUE:${host}:end -->\n`;
test('recognized prior template upgrades intact content for both hosts; edited legacy content remains protected',t=>{
  for(const host of ['codex','claude'])for(const legacy of [false,true])for(const edit of [false,true]){
    const f=fixture(t),instruction=host==='codex'?'AGENTS.md':'CLAUDE.md';
    f.put(instruction,'Existing user policy.\n');f.ok('agent','setup',host,'--apply');
    const recordPath=`.redue/agents/${host}.json`,record=JSON.parse(f.read(recordPath));
    const oldBlock=priorBlock(host,record.skill,legacy),fresh=record.block;
    assert.notEqual(oldBlock,record.block);
    f.put(instruction,f.read(instruction).replace(record.block,oldBlock)+'User addition.\n');
    record.block=oldBlock;const oldSkill='Former owned skill policy.\n';
    f.put(record.skill,oldSkill);record.skillHash=createHash('sha256').update(oldSkill).digest('hex');
    f.put(recordPath,JSON.stringify(record));
    if(edit)f.put(record.skill,oldSkill+'User edits.\n');
    const before=f.read(instruction),skillBefore=f.read(record.skill);
    assert.equal(f.run('agent','setup',host,'--dry-run').status,edit?2:0);
    assert.equal(f.read(instruction),before);assert.equal(f.read(record.skill),skillBefore);
    if(edit){
      assert.equal(f.run('agent','setup',host,'--apply').status,2);
      assert.equal(f.run('agent','remove',host,'--apply').status,2);
      assert.equal(f.read(instruction),before);assert.equal(f.read(record.skill),skillBefore);
    }else{
      f.ok('agent','setup',host,'--apply');assert.equal(f.read(instruction),'Existing user policy.\n'+fresh+'User addition.\n');
      assert.match(f.read(record.skill),/reuse_eligible: true/);
      const once=f.read(instruction);f.ok('agent','setup',host,'--apply');assert.equal(f.read(instruction),once);
      f.ok('agent','remove',host,'--apply');assert.equal(f.read(instruction),'Existing user policy.\nUser addition.\n');
    }
  }
});

test('claude setup adds one typecheck hook and a SessionStart hook to settings.local.json; removal restores existing settings',t=>{
  const f=fixture(t),local='.claude/settings.local.json';
  const existing={permissions:{allow:['Bash(ls)']},env:{EXAMPLE:'1'},
    hooks:{PreToolUse:[{matcher:'Edit',hooks:[{type:'command',command:'echo edit'}]}],
      PostToolUse:[{matcher:'Bash',hooks:[{type:'command',command:'echo after'}]}]}};
  f.put(local,JSON.stringify(existing,null,4));const shared='{ "model": "x" }\n';f.put('.claude/settings.json',shared);
  const preview=JSON.parse(f.ok('agent','setup','claude','--dry-run','--json').stdout);
  assert.equal(preview.hooks,`${local} PreToolUse, SessionStart`);
  const shown=preview.changes.find(c=>c.path===local);
  assert.equal(shown.operation,'update');assert(!shown.content.includes('EXAMPLE'),'preview must not echo local settings');
  f.ok('agent','setup','claude','--apply');
  const installed=JSON.parse(f.read(local));
  const {SessionStart,...hooks}=installed.hooks;
  assert.deepEqual({...installed,hooks:{...hooks,PreToolUse:installed.hooks.PreToolUse.slice(0,1)}},existing);
  assert.deepEqual(installed.hooks.PreToolUse[1],{matcher:'Bash',hooks:[{type:'command',
    if:'Bash(redue run typecheck*)',command:'redue agent hook claude',timeout:15}]});
  // The same command starts the observer when a session starts.
  assert.deepEqual(SessionStart,[{hooks:[{type:'command',command:'redue agent hook claude',timeout:10}]}]);
  // The skill gives the agent the same command the hook matches.
  assert.match(f.read('.claude/skills/redue-verification/SKILL.md'),/^- Typecheck: `redue run typecheck`\.$/m);
  assert.match(f.read('CLAUDE.md'),/^Typecheck with `redue run typecheck`\. /m);
  // The hook does the work; the block does not send the agent to the skill.
  assert(!f.read('CLAUDE.md').includes('SKILL.md'));
  assert.match(f.read('.claude/skills/redue-verification/SKILL.md'),/To ask without running: `redue status --sync --json`/);
  const once=f.read(local);f.ok('agent','setup','claude','--apply');assert.equal(f.read(local),once);
  const doctor=JSON.parse(f.ok('agent','doctor','claude','--json').stdout);
  assert.equal(doctor.hosts[0].hook,doctor.command.path?'installed':'installed, but redue is not on PATH, so it never runs');
  assert.equal(doctor.hosts[0].session_start,doctor.hosts[0].hook);
  f.ok('agent','setup','codex','--apply');f.ok('agent','remove','codex','--apply');assert.equal(f.read(local),once);
  f.ok('agent','remove','claude','--apply');
  assert.deepEqual(JSON.parse(f.read(local)),existing);assert.equal(f.read('.claude/settings.json'),shared);
});
test('claude setup names the test command beside the typecheck and recognizes its own block again',t=>{
  const f=fixture(t);
  f.put('redue.config.json',JSON.stringify({schema:1,packageManager:'npm',checks:[
    {name:'typecheck',command:['@node','check.mjs'],inputs:['src/**']},
    {name:'test',kind:'test',script:'test:vi',qualification:'npm-tests-direct-v1',
      command:['@node','@test-runner:vitest','run'],inputs:['**','!node_modules/**']}]}));
  f.ok('agent','setup','claude','--apply');
  const block=f.read('CLAUDE.md');
  assert.match(block,/^Typecheck with `redue run typecheck`\.\nRun the unit tests with `npm run test:vi`\.\n/m);
  assert.match(f.read('.claude/skills/redue-verification/SKILL.md'),/^- Unit tests: `redue run test` or `npm run test:vi` or `vitest run` or `npx vitest run`\.$/m);
  assert.ok(JSON.parse(f.read('.claude/settings.local.json')).hooks.PreToolUse[0].hooks.some(h=>h.if==='Bash(npx vitest run*)'));
  f.ok('agent','setup','claude','--apply');assert.equal(f.read('CLAUDE.md'),block);
  assert.match(block,/don't skip it yourself/);
  // A block with the alpha.14 wording is recognized and replaced.
  const earlier='\n\n<!-- REDUE:claude:begin -->\nTypecheck with `redue run typecheck`.\nRun the unit tests with `npm run test:vi`.\n'+
    "If a check's last pass still applies to these exact files, a REDUE hook skips\nthe run and says so. The skip counts as a pass; don't check it again.\n"+
    '<!-- REDUE:claude:end -->\n';
  const record=JSON.parse(f.read('.redue/agents/claude.json'));
  f.put('CLAUDE.md',f.read('CLAUDE.md').replace(record.block,earlier));
  f.put('.redue/agents/claude.json',JSON.stringify({...record,block:earlier},null,2)+'\n');
  f.ok('agent','setup','claude','--apply');assert.equal(f.read('CLAUDE.md'),block);
  f.ok('agent','remove','claude','--apply');assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
});

test('claude hook settings: created file is removed; edited or duplicate entries are replaced; invalid settings block setup',t=>{
  const f=fixture(t),local='.claude/settings.local.json';
  f.ok('agent','setup','claude','--apply');assert.equal(JSON.parse(f.read(local)).hooks.PreToolUse.length,1);
  // Another checkout shares the committed record but not the local file.
  fs.unlinkSync(path.join(f.root,local));f.ok('agent','setup','claude','--apply');
  assert.equal(JSON.parse(f.read(local)).hooks.PreToolUse.length,1);
  f.ok('agent','remove','claude','--apply');assert(!fs.existsSync(path.join(f.root,local)));
  // REDUE's entry is found by its command: an edited copy and a stale duplicate
  // collapse into one current entry, in place, and removal takes both.
  f.ok('agent','setup','claude','--apply');const fresh=JSON.parse(f.read(local)).hooks.PreToolUse[0];
  const other={matcher:'Bash',hooks:[{type:'command',command:'echo mine'}]};
  const stale={...fresh,hooks:[{...fresh.hooks[0],if:'Bash(redue run old*)',timeout:9}]};
  f.put(local,JSON.stringify({hooks:{PreToolUse:[stale,other,fresh]}}));
  f.ok('agent','setup','claude','--apply');assert.deepEqual(JSON.parse(f.read(local)).hooks.PreToolUse,[fresh,other]);
  f.ok('agent','remove','claude','--apply');assert.deepEqual(JSON.parse(f.read(local)),{hooks:{PreToolUse:[other]}});
  const g=fixture(t);g.put(local,'{"permissions": ');
  assert.match(g.run('agent','setup','claude','--apply').stderr,/not valid JSON/);
  assert.equal(g.read(local),'{"permissions": ');assert(!fs.existsSync(path.join(g.root,'CLAUDE.md')));
});
