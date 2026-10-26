// `redue setup claude` and `redue remove`: one command from a project with
// installed dependencies to a working Claude Code integration, and one to
// undo it. Setup runs init when the project has no config, agent setup
// claude, start, and one recorded run of each check init can qualify that is
// not CURRENT. It prints every file it writes. What it created is kept in a
// record in the clone's Git directory (never committed); a later setup adds
// to that account and never forgets it. Remove undoes exactly what the record
// says setup created: the agent files or just this machine's hooks, the
// observer state, the local ignore line, and the config if it is unchanged
// since setup wrote it.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {projectState} from './project-location.mjs';
import {claudeHooksInstalled,removeClaudeHooks,removeIntegration} from './agent-integration.mjs';

const configName='redue.config.json',localSettings='.claude/settings.local.json',agentRecord='.redue/agents/claude.json';
const hash=text=>createHash('sha256').update(text).digest('hex');
const readText=file=>{try{return fs.readFileSync(file,'utf8');}catch{return null;}};
const git=(root,...args)=>spawnSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
const ignoreLine=`/${localSettings}`;

async function confirm(question,yes,{defaultYes}){
  if(yes)return true;
  if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('not a terminal; run again with --yes to proceed without prompts');
  const prompt=createInterface({input:process.stdin,output:process.stdout});
  try{const answer=(await prompt.question(`${question} ${defaultYes?'[Y/n]':'[y/N]'} `)).trim();
    return defaultYes?!/^n/i.test(answer):/^y/i.test(answer);}finally{prompt.close();}
}

export async function setupCommand(args,{entry,cwd=process.cwd()}){
  const action=args.shift();
  const yes=args.includes('--yes'),rest=args.filter(arg=>arg!=='--yes');
  if(action==='setup'&&(rest.length!==1||rest[0]!=='claude'))throw Error('use redue setup claude [--yes]');
  if(action==='remove'&&rest.length)throw Error('use redue remove [--yes]');
  const top=git(cwd,'rev-parse','--show-toplevel');
  if(top.status!==0)throw Error('run this inside a Git checkout');
  const root=fs.realpathSync(top.stdout.trim());
  if(!fs.existsSync(path.join(root,'package.json')))throw Error(`no package.json at the repository root (${root})`);
  // The entry as invoked, so a hook written by a child names the install's
  // stable bin link rather than the versioned file behind it.
  const invoked=typeof process.argv[1]==='string'&&path.isAbsolute(process.argv[1])&&
    (()=>{try{return fs.realpathSync(process.argv[1])===fs.realpathSync(entry);}catch{return false;}})()?process.argv[1]:entry;
  // Every step is the ordinary command, so its own output says what it did.
  const redue=(argv,options={})=>spawnSync(process.execPath,[invoked,...argv],{cwd:root,encoding:'utf8',
    stdio:options.capture?['ignore','pipe','pipe']:'inherit',timeout:options.timeout});
  // One record per checkout, beside the others in the shared Git directory:
  // linked worktrees share .git/info/exclude.
  const common=path.resolve(root,git(root,'rev-parse','--git-common-dir').stdout.trim());
  const recordFile=path.join(common,`redue-setup-${hash(root).slice(0,16)}.json`);
  // Other checkouts' records, for checkouts that still exist.
  const others=()=>{try{return fs.readdirSync(common).filter(name=>/^redue-setup-[0-9a-f]{16}\.json$/.test(name)&&path.join(common,name)!==recordFile)
    .map(name=>JSON.parse(readText(path.join(common,name))??'null')).filter(other=>other&&fs.existsSync(other.root));}catch{return [];}};
  const context={root,redue,yes,record:JSON.parse(readText(recordFile)??'null'),recordFile,
    exclude:path.join(common,'info','exclude'),others,save:next=>fs.writeFileSync(recordFile,JSON.stringify(next,null,2)+'\n')};
  return action==='setup'?setup(context):remove(context);
}

async function setup({root,redue,yes,record:previous,recordFile,exclude,save}){
  if(!fs.existsSync(path.join(root,'node_modules')))
    throw Error('dependencies are not installed: run your package manager\'s install (npm install, pnpm install, yarn) first');
  if(fs.existsSync(path.join(root,'vstate.config.json'))&&!fs.existsSync(path.join(root,configName)))
    throw Error('a legacy vstate.config.json exists; rename it to redue.config.json or remove it first');
  if(git(root,'ls-files','--error-unmatch',localSettings).status===0)
    throw Error(`${localSettings} is committed; the hooks REDUE adds there name this machine's paths. Untrack it (git rm --cached) first`);
  const configPath=path.join(root,configName),configExisted=fs.existsSync(configPath);
  // init's account of the checks: which can qualify, also with a config.
  const preview=redue(['init','--dry-run','--json'],{capture:true});
  if(preview.status!==0)throw Error(preview.stderr.trim().replace(/^redue: /,'')||'init failed');
  const found=JSON.parse(preview.stdout);
  if(!configExisted&&!found.writable)throw Error(`nothing to set up: ${found.issue||(found.checks.length?found.checks.map(check=>`${check.name}: ${check.reason}`).join('; '):'no typecheck, lint or test script REDUE can use')}`);
  const levels=new Map(found.checks.map(check=>[check.name,check.level]));
  const names=configExisted?JSON.parse(readText(configPath)).checks.map(check=>check.name):found.checks.map(check=>check.name);
  const ready=names.filter(name=>levels.get(name)==='ready');
  console.log(`Setting up REDUE for Claude Code in ${root}`);
  console.log(configExisted?`  keep ${configName} (exists)`:`  create ${configName}: ${names.map(name=>`${name} (${levels.get(name)==='ready'?'can qualify':'recording-only'})`).join(', ')}`);
  console.log(`  write the Claude Code integration: CLAUDE.md section, .claude/skills/redue-verification/SKILL.md, ${localSettings} hooks, ${agentRecord}`);
  console.log(`  start the observer and record ${ready.length?ready.join(', '):'no check'} once, unless already CURRENT`);
  if(!await confirm('Proceed?',yes,{defaultYes:true})){console.log('Nothing written.');return {applied:false};}
  // What this run creates is added to what earlier runs created.
  const state=projectState(root,configPath);
  const own={schema:1,host:'claude',root,config:configName,state,
    configCreated:Boolean(previous?.configCreated),configHash:previous?.configHash??null,
    agentCreated:Boolean(previous?.agentCreated)||!fs.existsSync(path.join(root,agentRecord)),
    hooksAdded:Boolean(previous?.hooksAdded)||!claudeHooksInstalled(root),
    stateCreated:Boolean(previous?.stateCreated)||!fs.existsSync(state),
    excludeAdded:Boolean(previous?.excludeAdded)};
  if(!configExisted){
    const init=redue(['init']);
    if(init.status!==0||!fs.existsSync(configPath))throw Error(`init did not write ${configName}; nothing else was written`);
    Object.assign(own,{configCreated:true,configHash:hash(readText(configPath))});
  }
  save(own);
  console.log(`${previous?'update':'create'} ${recordFile}: what setup created, for redue remove`);
  const agent=redue(['agent','setup','claude','--apply']);
  if(agent.status!==0)throw Error('agent setup failed; see above. redue remove undoes what setup wrote');
  // The hooks' settings hold machine paths: keep them out of commits in this
  // clone when Git does not ignore them.
  if(git(root,'check-ignore','-q',localSettings).status===1){
    fs.mkdirSync(path.dirname(exclude),{recursive:true});
    const text=readText(exclude)??'';
    fs.writeFileSync(exclude,`${text}${text&&!text.endsWith('\n')?'\n':''}${ignoreLine}\n`);
    console.log(`update ${exclude}: ignore ${ignoreLine} in this clone`);
    own.excludeAdded=true;save(own);
  }
  // An observer that is already running is what start would give.
  const started=redue(['start'],{capture:true});
  process.stdout.write(started.stdout);
  if(started.status!==0){
    if(!/already running/.test(started.stderr))throw Error(`the observer did not start: ${started.stderr.trim().replace(/^redue: /,'')}`);
    console.log('Observer already running.');
  }
  // One recorded run of each check that can qualify and is not CURRENT.
  const statusOf=()=>{const out=redue(['status','--sync','--json'],{capture:true,timeout:600_000});try{return JSON.parse(out.stdout).checks;}catch{return [];}};
  const rows=statusOf(),due=ready.filter(name=>rows.find(row=>row.name===name)?.freshness!=='CURRENT');
  for(const name of due){console.log(`Recording ${name} once:`);redue(['run',name]);}
  if(ready.length&&!due.length)console.log(`Already CURRENT: ${ready.join(', ')}.`);
  for(const row of statusOf())console.log(`  ${row.name}: ${row.freshness}${row.result?' / '+row.result:''}${row.freshness==='CURRENT'?'':' — '+row.reason}`);
  console.log('Done. Start a new Claude Code session in this project. Undo with redue remove.');
  return {applied:true};
}

async function remove({root,redue,yes,record:own,recordFile,exclude,others}){
  if(!own){console.log('No setup record for this checkout: nothing redue setup created to remove.');
    console.log('To undo a setup made step by step: redue agent remove claude --apply, then redue remove-state.');return {removed:false};}
  const configPath=path.join(root,configName),configText=readText(configPath);
  const removeAgent=own.agentCreated&&fs.existsSync(path.join(root,agentRecord));
  const removeHooks=!removeAgent&&own.hooksAdded&&claudeHooksInstalled(root);
  const removeState=own.stateCreated&&fs.existsSync(own.state);
  const deleteConfig=own.configCreated&&configText!==null&&hash(configText)===own.configHash;
  // The ignore line goes only when no other checkout of this repository is
  // set up: those rely on it too, whichever added it.
  const removeIgnore=own.excludeAdded&&!others().length;
  console.log(`Removing what redue setup created in ${root}`);
  if(removeAgent)console.log('  remove the Claude Code integration');
  if(removeHooks)console.log(`  remove REDUE's hooks from ${localSettings} (the integration predates setup)`);
  if(removeState)console.log('  stop the observer and remove its local state (receipts included)');
  else if(!own.stateCreated)console.log('  keep the observer state (it predates setup)');
  if(own.configCreated&&configText!==null)console.log(deleteConfig?`  delete ${configName}`:`  keep ${configName} (edited since setup)`);
  if(removeIgnore)console.log(`  remove ${ignoreLine} from ${exclude}`);
  console.log(`  delete ${recordFile}`);
  if(!await confirm('Proceed?',yes,{defaultYes:false})){console.log('Nothing removed.');return {removed:false};}
  if(removeAgent)for(const line of removeIntegration(root))console.log(line);
  if(removeHooks){const changed=removeClaudeHooks(root);if(changed)console.log(`update ${changed}`);}
  if(removeState&&redue(['--state-dir',own.state,'remove-state']).status!==0)
    throw Error('the observer state was not removed; see above. The config and setup record are kept so you can retry');
  if(deleteConfig){fs.unlinkSync(configPath);console.log(`remove ${configName}`);}
  if(removeIgnore){
    const text=readText(exclude);
    if(text!==null&&text.split('\n').includes(ignoreLine)){
      fs.writeFileSync(exclude,text.split('\n').filter(line=>line!==ignoreLine).join('\n'));
      console.log(`update ${exclude}`);}
  }
  fs.unlinkSync(recordFile);console.log(`remove ${recordFile}`);
  // Folders the integration lived in, when nothing else is left in them.
  for(const dir of ['.redue/agents','.redue','.claude/skills/redue-verification','.claude/skills','.claude'])
    try{fs.rmdirSync(path.join(root,dir));console.log(`remove ${dir}/`);}catch{}
  console.log('Done.');
  return {removed:true};
}
