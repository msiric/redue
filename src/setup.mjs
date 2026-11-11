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
import {isSandboxed,sandboxSupport,testCounts} from './sandbox.mjs';
import {createInterface} from 'node:readline/promises';
import {projectState} from './project-location.mjs';
import {claudeHooksInstalled,generalNotes,removeClaudeHooks,removeIntegration,unignoredNote} from './agent-integration.mjs';

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

// The setup record of the checkout at `root`, in its shared Git directory.
function recordOf(root){
  const common=git(root,'rev-parse','--git-common-dir');
  return common.status===0?path.join(path.resolve(root,common.stdout.trim()),`redue-setup-${hash(root).slice(0,16)}.json`):null;
}
// When init updates the config setup created, the record follows, so that
// redue remove still deletes it.
export function configRewritten(root,before,after){
  const file=recordOf(root),record=file&&JSON.parse(readText(file)??'null');
  if(record?.configCreated&&record.configHash===hash(before))fs.writeFileSync(file,JSON.stringify({...record,configHash:hash(after)},null,2)+'\n');
}

export async function setupCommand(args,{entry,cwd=process.cwd()}){
  const action=args.shift();
  const yes=args.includes('--yes'),rest=args.filter(arg=>arg!=='--yes');
  if(action==='setup'&&(rest.length!==1||rest[0]!=='claude'))throw Error('use redue setup claude [--yes]');
  if(action==='remove'&&rest.length)throw Error('use redue remove [--yes]');
  const top=git(cwd,'rev-parse','--show-toplevel');
  if(top.status!==0)throw Error('run this inside a Git checkout');
  const root=fs.realpathSync(top.stdout.trim());
  if(!['package.json','pyproject.toml','setup.cfg','setup.py','requirements.txt'].some(file=>fs.existsSync(path.join(root,file))))
    throw Error(`no package.json or Python project at the repository root (${root})`);
  // The entry as invoked, so a hook written by a child names the install's
  // stable bin link rather than the versioned file behind it.
  const invoked=typeof process.argv[1]==='string'&&path.isAbsolute(process.argv[1])&&
    (()=>{try{return fs.realpathSync(process.argv[1])===fs.realpathSync(entry);}catch{return false;}})()?process.argv[1]:entry;
  // Every step is the ordinary command, so its own output says what it did.
  // `capture` keeps the output; `progress` keeps stdout and shows stderr's progress lines.
  const redue=(argv,options={})=>spawnSync(process.execPath,[invoked,...argv],{cwd:root,encoding:'utf8',
    stdio:options.capture?['ignore','pipe','pipe']:options.progress?['ignore','pipe','inherit']:'inherit',timeout:options.timeout,
    maxBuffer:64*1024*1024});
  // One record per checkout, beside the others in the shared Git directory:
  // linked worktrees share .git/info/exclude.
  const recordFile=recordOf(root),common=path.dirname(recordFile);
  // Other checkouts' records, for checkouts that still exist.
  const others=()=>{try{return fs.readdirSync(common).filter(name=>/^redue-setup-[0-9a-f]{16}\.json$/.test(name)&&path.join(common,name)!==recordFile)
    .map(name=>JSON.parse(readText(path.join(common,name))??'null')).filter(other=>other&&fs.existsSync(other.root));}catch{return [];}};
  const context={root,redue,yes,record:JSON.parse(readText(recordFile)??'null'),recordFile,
    exclude:path.join(common,'info','exclude'),others,save:next=>fs.writeFileSync(recordFile,JSON.stringify(next,null,2)+'\n')};
  return action==='setup'?setup(context):remove(context);
}

async function setup({root,redue,yes,record:previous,recordFile,exclude,save}){
  // A Node project needs node_modules; a Python one its .venv.
  const node=fs.existsSync(path.join(root,'package.json'));
  if(node&&!fs.existsSync(path.join(root,'node_modules')))
    throw Error('dependencies are not installed: run your package manager\'s install (npm install, pnpm install, yarn) first');
  if(!node&&!fs.existsSync(path.join(root,'.venv','pyvenv.cfg')))
    throw Error('no .venv in the project root: create it first (uv sync, or Poetry with virtualenvs.in-project)');
  if(fs.existsSync(path.join(root,'vstate.config.json'))&&!fs.existsSync(path.join(root,configName)))
    throw Error('a legacy vstate.config.json exists; rename it to redue.config.json or remove it first');
  if(git(root,'ls-files','--error-unmatch',localSettings).status===0)
    throw Error(`${localSettings} is committed; the hooks REDUE adds there name this machine's paths. Untrack it (git rm --cached) first`);
  const configPath=path.join(root,configName),configExisted=fs.existsSync(configPath);
  // init's account of the checks: which can qualify, also with a config.
  // Its sandbox trials run once, here: setup writes the config it proposes
  // rather than running init (and every trial) again.
  const phases={},timed=(name,work)=>{const started=Date.now();try{return work();}finally{phases[name]=(phases[name]??0)+Date.now()-started;}};
  // With a config, its checks say which can qualify: no trial runs again.
  let found;
  if(configExisted){
    let config;try{config=JSON.parse(readText(configPath));}catch(e){throw Error(`cannot read ${configName}: ${e.message}`);}
    if(!Array.isArray(config?.checks))throw Error(`cannot read ${configName}: it has no checks`);
    // A sandboxed check where the sandbox cannot run here would only record.
    const noSandbox=config.checks.some(check=>isSandboxed(check.qualification))?sandboxSupport().issue:null;
    found={writable:false,skipped:[],checks:config.checks.map(check=>({name:check.name,kind:check.kind,
      level:check.qualification&&!(noSandbox&&isSandboxed(check.qualification))?'ready':'recording'}))};
  }else{
    console.log('Trying each check inside and outside the sandbox to choose its recipe...');
    const preview=timed('trials',()=>redue(['init','--dry-run','--json'],{progress:true}));
    if(preview.status!==0)throw Error('init failed; see above');
    found=JSON.parse(preview.stdout);
  }
  if(!configExisted&&!found.writable)throw Error(`nothing to set up: ${found.issue||(found.checks.length?found.checks.map(check=>`${check.name}: ${check.reason}`).join('; '):'no typecheck, lint or test script REDUE can use')}`);
  const levels=new Map(found.checks.map(check=>[check.name,check.level]));
  // The checks whose trial ran past init's time limit, unless the config
  // already runs them in the sandbox, and the kinds init's --check takes.
  const sandboxed=new Set(configExisted?JSON.parse(readText(configPath)).checks.filter(check=>isSandboxed(check.qualification)).map(check=>check.name):[]);
  const limited=found.checks.map(check=>[check.name,check.time_limit,check.time_limit_run])
    .filter(([name,kind])=>kind&&!sandboxed.has(name));
  const limitedKinds=[...new Set(limited.map(([,kind])=>kind))];
  const names=configExisted?JSON.parse(readText(configPath)).checks.map(check=>check.name):found.checks.map(check=>check.name);
  const ready=names.filter(name=>levels.get(name)==='ready');
  // A check whose plain trial run took Claude Code's command limit (2
  // minutes) or more is not recorded here: its trial just ran it, and the
  // agent's first run, usually after a source change anyway, records it.
  const slowLimit=process.env.VSTATE_TEST_FAULTS==='1'&&Number(process.env.VSTATE_TEST_SLOW_RECORDING_MS)||120_000;
  const slow=new Map(found.checks.map(check=>[check.name,check.trial_runs?.find(run=>run.run==='plain')?.ms])
    .filter(([name,ms])=>ready.includes(name)&&ms>=slowLimit));
  const recorded=ready.filter(name=>!slow.has(name));
  console.log(`Setting up REDUE for Claude Code in ${root}`);
  console.log(configExisted?`  keep ${configName} (exists)`:`  create ${configName}: ${names.map(name=>`${name} (${levels.get(name)==='ready'?'can qualify':'recording only'})`).join(', ')}`);
  // What the checks setup does not make reusable are, and why.
  if(!configExisted){
    const recording=found.checks.filter(check=>check.level!=='ready');
    if(recording.length)console.log('  recording only: REDUE records these runs but never reports one CURRENT, because it cannot tell what the result depends on:');
    for(const check of recording)console.log(`    ${check.name}: ${check.reason}`);
    const out=[...found.skipped||[]].filter(row=>row.reason);
    const kinds=new Set([...found.checks.map(check=>check.kind??check.name.split(':')[0]),...out.map(row=>String(row.kind).split(':')[0])]);
    for(const kind of ['typecheck','lint','test'])if(!kinds.has(kind)&&!found.checks.some(check=>check.name===kind))
      out.push({kind,reason:`${kind}: none found (no script or tool REDUE recognizes)`});
    if(out.length)console.log('  left out:');
    for(const row of out)console.log(`    ${row.reason.startsWith(String(row.kind))?row.reason:`${row.kind}: ${row.reason}`}`);
  }
  console.log(`  write the Claude Code integration: CLAUDE.md section, .claude/skills/redue-verification/SKILL.md, ${localSettings} hooks, ${agentRecord}`);
  console.log(`  start the observer and record ${recorded.length?recorded.join(', '):'no check'} once, unless already CURRENT`+
    (slow.size?` (not ${[...slow.keys()].join(', ')}: ${slow.size>1?'their trials take':'its trial takes'} 2 minutes or more; the first run records ${slow.size>1?'them':'it'})`:''));
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
    // As init writes it: only at the repository root, never over a config.
    const proposed=found.proposed_config;
    if(!proposed||!Array.isArray(proposed.checks)||!proposed.checks.length||!found.writable)
      throw Error(`init proposed no config; nothing else was written`);
    const text=JSON.stringify(proposed,null,2)+'\n';
    try{fs.writeFileSync(configPath,text,{flag:'wx'});}
    catch(e){throw Error(e.code==='EEXIST'?`${configName} appeared while the checks ran; nothing else was written. Run setup again`:e.message);}
    console.log(`create ${configName}`);
    Object.assign(own,{configCreated:true,configHash:hash(text)});
  }
  save(own);
  console.log(`${previous?'update':'create'} ${recordFile}: what setup created, for redue remove`);
  // One line per file agent setup writes, and the notes that still hold
  // after setup: it keeps the hooks' settings out of commits itself, and it
  // ends by saying to start a new session.
  // Its summary is the last line of its output; any other line is shown.
  const agent=redue(['agent','setup','claude','--apply','--json'],{progress:true});
  const lines=(agent.stdout??'').trimEnd().split('\n');let applied=null;
  try{applied=JSON.parse(lines.at(-1));}catch{}
  const other=applied?lines.slice(0,-1):lines;
  if(other.some(line=>line.trim()))console.log(other.join('\n'));
  if(agent.status!==0||!applied?.applied)throw Error('agent setup failed; see above. redue remove undoes what setup wrote');
  for(const change of applied.changes)console.log(`${change.operation} ${change.path}`);
  for(const note of applied.warnings.filter(note=>!generalNotes.includes(note)&&note!==unignoredNote))console.log(note);
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
  // The observer indexes the project first; a run before that cannot be
  // recorded as reusable. Wait while it plans and indexes; once its plan is
  // ready, an observer that is still unhealthy says why in the status below.
  // Nothing to wait for when no check can qualify.
  const observation=()=>{const out=redue(['status','--cached','--json'],{capture:true});try{return JSON.parse(out.stdout).observation??null;}catch{return null;}};
  // An answer without a phase (a stopped observer) for 10 s in a row ends the
  // wait too.
  const begun=Date.now();let told=-1,unread=0,phaseless=0;
  const indexing=Date.now();
  for(let state=observation();ready.length&&!(state?.phase==='ready'||state?.phase==='unavailable')&&phaseless<10;state=observation()){
    const seconds=Math.round((Date.now()-begun)/1000);
    unread=state===null?unread+1:0;phaseless=state&&!state.phase?phaseless+1:0;
    if(unread>=30)throw Error('the observer\'s status cannot be read; run redue status to see why');
    if(seconds>15*60)throw Error(`the observer is not ready after 15 minutes (${state?.reason||state?.phase||'unknown'}); run redue status, then redue setup claude again`);
    if(Math.floor(seconds/15)>told){told=Math.floor(seconds/15);console.log(seconds?`Still indexing (${seconds} s)...`:'Waiting for the observer to index the project...');}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  phases.indexing=Date.now()-indexing;
  // One recorded run of each check that can qualify and is not CURRENT.
  const statusOf=()=>{const out=redue(['status','--sync','--json'],{capture:true,timeout:600_000});try{return JSON.parse(out.stdout).checks;}catch{return [];}};
  const rows=statusOf(),due=recorded.filter(name=>rows.find(row=>row.name===name)?.freshness!=='CURRENT');
  for(const [name,ms] of slow)console.log(`Not recording ${name} now: its trial run took ${Math.round(ms/60000)||1} min. Its first run records it.`);
  // One line per check; the run's own output only when it fails.
  for(const name of due){
    console.log(`Recording ${name} once (running it)...`);
    const started=Date.now(),run=timed('recording',()=>redue(['run',name],{capture:true}));
    const output=`${run.stdout??''}\n${run.stderr??''}`,counts=testCounts(output),seconds=((Date.now()-started)/1000).toFixed(1);
    const tally=Object.entries(counts).filter(([,value])=>value!==null).map(([key,value])=>`${value} ${key}`).join(', ');
    console.log(`  ${name}: ${run.status===0?'PASS':`FAIL (exit ${run.status??run.signal})`} in ${seconds} s${tally?`, ${tally}`:''}`);
    if(run.status!==0)console.log(output.trim().split('\n').slice(-15).map(line=>`    ${line}`).join('\n'));
  }
  if(recorded.length&&!due.length)console.log(`Already CURRENT: ${recorded.join(', ')}.`);
  for(const row of statusOf())console.log(`  ${row.name}: ${row.freshness}${row.result?' / '+row.result:''}${row.freshness==='CURRENT'?'':
    levels.get(row.name)!=='ready'?' — recording only':' — '+row.reason}`);
  // A check whose plain run did not finish may hang here rather than be
  // slow: the person checks that first.
  if(limited.length){const named=list=>list.map(([name])=>name).join(', '),
      unfinished=limited.filter(([,,run])=>run==='plain'),inside=limited.filter(([,,run])=>run!=='plain');
    if(inside.length)console.log(`${named(inside)} ran past init's 5-minute trial limit inside the sandbox, so ${inside.length>1?'they are':'it is'} not sandboxed.`);
    if(unfinished.length)console.log(`${named(unfinished)} did not finish within init's 5-minute trial limit when run plainly, so ${unfinished.length>1?'they were':'it was'} not tried in the sandbox. `+
      `Check that ${unfinished.length>1?'they finish':'it finishes'} when you run ${unfinished.length>1?'them':'it'} yourself.`);
    console.log(`To try ${limited.length>1?'them':'it'} without the limit: redue init${limitedKinds.length>1?'':` --check ${limitedKinds[0]}`} --no-time-limit`);}
  const sec=ms=>`${Math.round(ms/1000)} s`;
  console.log(`Time: ${[['trials','trying checks in the sandbox'],['indexing','indexing'],['recording','recording runs']]
    .filter(([name])=>phases[name]!==undefined).map(([name,label])=>`${label} ${sec(phases[name])}`).join(', ')}.`);
  console.log('Done. Start a new Claude Code session in this project. Undo with redue remove.');
  return {applied:true,phases};
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
