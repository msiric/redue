import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {claudeHook,hookForms,matchCheck,recordedCommand} from '../src/claude-hook.mjs';
import {findExecutable} from '../src/executable-lookup.mjs';
const bin=path.resolve('bin/redue.mjs');
const put=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
const runId='0b6a54c2-3f4e-4d7a-9a51-2d61c1e0f6a7';
const direct={schema:1,packageManager:'npm',checks:[{name:'typecheck',script:'typecheck',kind:'typecheck',
  qualification:'npm-typescript-direct-v1',command:['@node','@typescript-compiler:.','--noEmit']}]};

test('matches each typecheck form with only the allowed output suffixes',()=>{
  for(const command of ['redue run typecheck','npm run typecheck','npx tsc --noEmit','  npm   run\ttypecheck ',
    'npm run typecheck 2>&1','npm run typecheck | tail -n 20','npm run typecheck 2>&1 | head -5',
    'npx tsc --noEmit 2>&1 | tail -40','redue run typecheck | head -n 3'])
    assert.equal(matchCheck(command,direct),'typecheck',command);
  for(const command of ['npm run typecheck && npm test','cd src && npm run typecheck','npm run typecheck | grep x',
    'npm run typecheck > out.txt','npm run typecheck | tail -n 20 | head -5','npm run typecheck\nrm -rf x',
    'npm run typecheck -- --watch','npm run typecheck:watch','npx tsc --noEmit --watch','npx tsc',
    'npm run typecheck | tail -n','npm run typecheck | tail -n20','npm run typecheck 2>&1 2>&1','yarn typecheck'])
    assert.equal(matchCheck(command,direct),null,command);
  const literal={schema:1,checks:[{name:'types',kind:'typecheck',command:['tsc','-p','tsconfig.json','--noEmit']},
    {name:'lint',command:['eslint','.']},{name:'type check',kind:'typecheck',command:['tsc']}]};
  assert.deepEqual(hookForms(literal),[{check:'types',forms:['redue run types','tsc -p tsconfig.json --noEmit']}]);
  assert.equal(matchCheck('tsc -p tsconfig.json --noEmit 2>&1',literal),'types');
  assert.equal(matchCheck('redue run lint',literal),null);
  // A check that runs in a subdirectory: the same text at the root is a different command.
  const nested={...direct,checks:[{...direct.checks[0],qualification:undefined,cwd:'packages/app',command:['tsc','--noEmit']}]};
  assert.deepEqual(hookForms(nested)[0].forms,['redue run typecheck']);
  assert.equal(matchCheck('tsc --noEmit',nested),null);assert.equal(matchCheck('npm run typecheck',nested),null);
  // The npm form needs npm; other managers' script checks get only `redue run`.
  assert.deepEqual(hookForms({...direct,packageManager:'pnpm',checks:[{...direct.checks[0],qualification:'pnpm-tsc-v1'}]})[0].forms,
    ['redue run typecheck']);
});

test('a matched command becomes redue run with the same output suffix',()=>{
  for(const [command,rewritten] of [['npm run typecheck','redue run typecheck'],
    ['npm run typecheck 2>&1 | tail -n 20','redue run typecheck 2>&1 | tail -n 20'],
    ['  npx   tsc --noEmit | head -5','redue run typecheck | head -5'],['npx tsc --noEmit 2>&1','redue run typecheck 2>&1']])
    assert.equal(recordedCommand(command,'typecheck'),rewritten,command);
  // Already recorded: nothing to change.
  for(const command of ['redue run typecheck','redue run typecheck 2>&1 | tail -n 5'])
    assert.equal(recordedCommand(command,'typecheck'),null,command);
  assert.equal(recordedCommand('npm run typecheck','typecheck','vstate.config.json'),'redue --config vstate.config.json run typecheck');
  assert.equal(recordedCommand('redue --config vstate.config.json run typecheck','typecheck','vstate.config.json'),null);
  assert.equal(recordedCommand('npm run typecheck','typecheck','my config.json'),null);
  assert.equal(recordedCommand('npm run typecheck\nrm -rf x','typecheck'),null);
});

function project(t){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-hook-')),root=fs.realpathSync(base);
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  put(path.join(root,'redue.config.json'),JSON.stringify(direct));
  put(path.join(root,'.redue/agents/claude.json'),JSON.stringify({schema:1,host:'claude',config:'redue.config.json'}));
  // A stand-in for bin/redue.mjs: records each call, then behaves as told.
  const fake=(name,body)=>{const file=path.join(root,'fake',name+'.mjs');
    put(file,`import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(path.join(root,'calls'))},process.argv.slice(2).join(' ')+'\\n');\n${body}`);return file;};
  const calls=()=>fs.existsSync(path.join(root,'calls'))?fs.readFileSync(path.join(root,'calls'),'utf8').trim().split('\n'):[];
  return {root,fake,calls};
}
const status=row=>({schema:1,observation:{healthy:true},checks:[{name:'typecheck',freshness:'CURRENT',result:'PASS',
  reuse_eligible:true,invocation:{runId},reason:'declared inputs match',...row}]});
const replying=value=>`process.stdout.write(${JSON.stringify(JSON.stringify(value))});`;
const bash=(command,cwd)=>({hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command},cwd});

test('blocks only CURRENT/PASS with reuse_eligible and a run id',async t=>{
  const p=project(t);
  const blocked=await claudeHook(bash('npm run typecheck 2>&1 | tail -n 30',p.root),{entry:p.fake('current',replying(status({})))});
  assert.equal(blocked.hookSpecificOutput.permissionDecision,'deny');
  assert.equal(blocked.hookSpecificOutput.hookEventName,'PreToolUse');
  assert.match(blocked.hookSpecificOutput.permissionDecisionReason,/"typecheck" passed on these exact inputs/);
  assert.match(blocked.hookSpecificOutput.permissionDecisionReason,new RegExp(`run ${runId}`));
  assert.match(blocked.hookSpecificOutput.permissionDecisionReason,/REDUE_FORCE=1/);
  assert.deepEqual(p.calls(),[`--config ${path.join(p.root,'redue.config.json')} status --sync --json`]);
  // A healthy answer that is not CURRENT/PASS/eligible: run it through REDUE so it is recorded.
  const recorded={
    stale:status({freshness:'STALE',reuse_eligible:false,reason:'src/a.ts changed'}),
    unverified:status({freshness:'UNVERIFIED',reuse_eligible:false,reason:'observation unavailable'}),
    failed:status({result:'FAIL',reuse_eligible:false,reason:'last command failed'}),
    noReceipt:status({result:null,freshness:'UNVERIFIED',invocation:null,reuse_eligible:false}),
    ineligible:status({reuse_eligible:false}),
    eligibilityMissing:status({reuse_eligible:undefined}),
    noRunId:status({invocation:{}}),
  };
  const input={...bash('npm run typecheck 2>&1 | tail -n 30',p.root),
    tool_input:{command:'npm run typecheck 2>&1 | tail -n 30',description:'Typecheck',timeout:120000}};
  for(const [name,value] of Object.entries(recorded)){
    const out=(await claudeHook(input,{entry:p.fake(name,replying(value))}))?.hookSpecificOutput;
    assert.equal(out?.permissionDecision,'allow',name);assert.equal(out.hookEventName,'PreToolUse');
    assert.deepEqual(out.updatedInput,{command:'redue run typecheck 2>&1 | tail -n 30',description:'Typecheck',timeout:120000},name);
    assert.match(out.permissionDecisionReason,/not CURRENT/);
  }
  // No healthy answer for this check, or already `redue run`: unchanged.
  const unchanged={
    unhealthy:{...status({}),observation:{healthy:false}},
    schema:{...status({}),schema:2},
    otherCheck:status({name:'other'}),
  };
  for(const [name,value] of Object.entries(unchanged))
    assert.equal(await claudeHook(bash('npm run typecheck',p.root),{entry:p.fake(name,replying(value))}),null,name);
  assert.equal(await claudeHook(bash('redue run typecheck',p.root),{entry:p.fake('staleRun',replying(recorded.stale))}),null);
});

test('timeout, error exit, unreadable output and missing REDUE all allow',async t=>{
  const p=project(t),started=Date.now();
  assert.equal(await claudeHook(bash('npx tsc --noEmit',p.root),
    {entry:p.fake('slow',`setTimeout(()=>{${replying(status({}))}},10000);`),timeout:300}),null);
  assert(Date.now()-started<5000,'timeout did not cut the status call short');
  assert.equal(await claudeHook(bash('npx tsc --noEmit',p.root),
    {entry:p.fake('error',`${replying(status({}))}process.exitCode=2;`)}),null);
  assert.equal(await claudeHook(bash('npx tsc --noEmit',p.root),{entry:p.fake('garbage','process.stdout.write("CURRENT PASS");')}),null);
  assert.equal(await claudeHook(bash('npx tsc --noEmit',p.root),{entry:path.join(p.root,'missing','redue.mjs')}),null);
  // When `redue` is not on PATH, the shell exits 127; Claude Code treats any exit but 2 as non-blocking.
  const shell=findExecutable('bash');
  if(shell)assert.equal(spawnSync(shell,['-c','redue agent hook claude'],{env:{...process.env,PATH:path.join(p.root,'empty')},input:'{}'}).status,127);
});

test('REDUE_FORCE=1, other tools and non-matching commands allow without querying status',async t=>{
  const p=project(t),entry=p.fake('current',replying(status({})));
  for(const input of [bash('REDUE_FORCE=1 npm run typecheck',p.root),bash('  REDUE_FORCE=1 redue run typecheck | tail -5',p.root),
    bash('npm test',p.root),bash('npm run typecheck && git push',p.root),
    {...bash('npm run typecheck',p.root),tool_name:'PowerShell'},bash('npm run typecheck','relative')])
    assert.equal(await claudeHook(input,{entry}),null,JSON.stringify(input));
  assert.deepEqual(p.calls(),[]);
});

function hook(input,cwd,env=process.env){
  const out=spawnSync(process.execPath,[bin,'agent','hook','claude'],{cwd,env,encoding:'utf8',timeout:15000,
    input:typeof input==='string'?input:JSON.stringify(input)});
  assert.equal(out.status,0,out.stderr);return out.stdout?JSON.parse(out.stdout):null;
}

test('the CLI hook exits 0 with no output when it cannot decide',t=>{
  const p=project(t),nested=path.join(p.root,'src');fs.mkdirSync(nested);
  for(const input of ['not json','',JSON.stringify(bash('npm run typecheck',nested))])
    assert.equal(hook(input,p.root),null);
  fs.rmSync(path.join(p.root,'.redue'),{recursive:true});
  assert.equal(hook(bash('npm run typecheck',p.root),p.root),null);
  // An ambiguous config at the hook's own cwd must not reach the CLI's exit 2.
  put(path.join(p.root,'vstate.config.json'),JSON.stringify(direct));
  assert.equal(hook(bash('npm run typecheck',p.root),p.root),null);
});

test('real observer: blocks after a non-input edit, allows after a source edit or failure',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-hook-e2e-')),root=path.join(fs.realpathSync(base),'project');
  fs.mkdirSync(root);execFileSync('git',['init','-q'],{cwd:root});
  const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'typecheck',kind:'typecheck',
    command:['@node','check.cjs'],inputs:['src/**','check.cjs'],
    coverage:Object.fromEntries(categories.map(k=>[k,true])),
    coverageReview:Object.fromEntries(categories.map(k=>[k,'reviewed fixture contract']))}]}));
  put(path.join(root,'package.json'),'{"name":"redue-hook-fixture","version":"1"}\n');
  put(path.join(root,'check.cjs'),"process.exitCode=require('node:fs').readFileSync('src/a.ts','utf8').includes('FAIL')?1:0;\n");
  put(path.join(root,'src/a.ts'),'export const a=1;\n');put(path.join(root,'docs/notes.md'),'# Notes\n');
  const env={...process.env,VSTATE_START_READY_WAIT_MS:'10000'};
  const redue=(...args)=>{const r=spawnSync(process.execPath,[bin,...args],{cwd:root,env,encoding:'utf8',timeout:30000});
    assert.equal(r.status,0,`${args.join(' ')}: ${r.stderr}${r.stdout}`);return r;};
  t.after(()=>{spawnSync(process.execPath,[bin,'remove-state'],{cwd:root,env,timeout:30000});
    fs.rmSync(base,{recursive:true,force:true});});
  redue('agent','setup','claude','--apply');redue('start');redue('run','typecheck');
  const decide=command=>hook(bash(command,root),root,env)?.hookSpecificOutput?.permissionDecision||'allow';
  assert.equal(decide('redue run typecheck'),'deny');
  fs.appendFileSync(path.join(root,'docs/notes.md'),'More notes.\n');
  assert.equal(decide('redue run typecheck 2>&1 | tail -n 20'),'deny');
  assert.equal(decide('REDUE_FORCE=1 redue run typecheck'),'allow');
  fs.appendFileSync(path.join(root,'src/a.ts'),'export const b=2;\n');
  assert.equal(decide('redue run typecheck'),'allow');
  fs.appendFileSync(path.join(root,'src/a.ts'),'// FAIL\n');
  assert.equal(spawnSync(process.execPath,[bin,'run','typecheck'],{cwd:root,env,timeout:30000}).status,1);
  assert.equal(decide('redue run typecheck'),'allow');
});
