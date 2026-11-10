#!/usr/bin/env node
import fs from 'node:fs';
import {mark,traceBase,traceContext,traceEnvironment,traceId} from '../src/decision-profile.mjs';
traceBase({...traceContext(),request:traceId(),work:'client'});
mark('client.loaded',{sinceStartMs:Math.round(performance.now())});
import {directCompiler,directQualification,directEnvironment,directInstalledInputs,directInterpretation} from '../src/direct-typescript.mjs';
import {runArgv,tscRun} from '../src/typescript-invocation.mjs';
import {testEnvironment,testRunnerAt,testsInterpretation,testsQualification} from '../src/test-direct.mjs';
import {scriptEnvironment,scriptInterpretation,scriptKinds,scriptQualification} from '../src/node-script.mjs';
import {docsQualification,hiddenDocsIssue,hiddenListIssue,hidesIgnored,isSandboxed,pythonTool,refusedFile,scriptStepsOf,visibleLimit,sandboxEnvironment,sandboxInterpretationOf,sandboxKinds,sandboxQualification} from '../src/sandbox.mjs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {processAlive} from '../src/process-liveness.mjs';
import {samePath,withinPath,realObservedPath} from '../src/path-identity.mjs';
import {discoverConfig,projectState,canonicalConfig} from '../src/project-location.mjs';
import {findExecutable} from '../src/executable-lookup.mjs';
import {readCachedStatus} from '../src/cached-state.mjs';
import {assertOwnedStatePlacement} from '../src/owned-state.mjs';
import {renderStatus,renderExplain} from '../src/presentation.mjs';

const productRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const engine=path.join(productRoot,'src','cli.mjs');
const version=JSON.parse(fs.readFileSync(path.join(productRoot,'package.json'))).version;
const help=`REDUE ${version}
Usage: redue [--config FILE] [--state-dir DIR] COMMAND [OPTIONS]

Commands:
  setup claude [--yes] Set up REDUE and Claude Code in this project in one step:
                       init, agent setup claude, start, one recorded run per check
  remove [--yes]       Undo setup: integration, observer state, and the config setup created
  init [--dry-run] [--workspace NAME] [--check KIND] [--recipe typescript-direct|tests-direct|node-script|sandbox]
       [--no-time-limit]
                       Discover existing scripts; optionally select one workspace/check.
                       --no-time-limit: trial runs have no 5-minute limit; with a config, the checks
                       it does not run in the sandbox are tried, and those that qualify are updated
  agent setup codex|claude [--dry-run|--apply] [--json]
  agent doctor [codex|claude] [--json]
  agent remove codex|claude [--dry-run|--apply] [--json]
                       Connect project instructions; explicit setup only
  start                Start the local observer
  stop                 Stop this observer
  status [--json]      Reconcile inputs and caller context, then answer (--sync is the same)
  status --cached [--json] | --short  The last answer the observer published, without reconciling
  explain [CHECK] [--json] Explain applicability (synchronized; may cost more than a rerun)
  detail [CHECK] [--json]  Alias for explain
  run CHECK [--if-due] Execute one configured check and record its outcome; with --if-due,
                       only when its last pass does not apply to the files as they are now
  verify [--json]      Run every check that is due (STALE, or UNVERIFIED with a runnable command),
                       then show the status; exit 0 only when every check is CURRENT / PASS
  stats [--json]       Per check: skips, time saved, recorded runs, why checks were UNVERIFIED
  remove-state         Stop and remove only this configuration's owned local state

No checks run in the background. Direct commands outside redue create no receipts.`;

function error(message){console.error(`redue: ${message}`);process.exit(2);}
// Exits once queued output is written. On macOS, output to a pipe is written
// asynchronously; exiting with it queued cuts it (at 8 KB through the pipe a
// Node program, such as an agent's shell tool, reads).
async function exit(code){await new Promise(resolve=>process.stdout.write('',resolve));process.exit(code);}
const args=process.argv.slice(2);
if(args.length===3&&args[0]==='agent'&&args[1]==='hook'&&args[2]==='claude'){
  // Runs before config discovery: the hook must exit 0 on every failure,
  // because Claude Code treats exit 2 as a block.
  const {runClaudeHook}=await import('../src/claude-hook.mjs');
  await runClaudeHook(fileURLToPath(import.meta.url));process.exit(0);
}
// Claude Code's status line, also before config discovery: it prints one
// line, or nothing where REDUE is not set up.
if(args.length===3&&args[0]==='agent'&&args[1]==='statusline'&&args[2]==='claude'){
  const {runStatusLine}=await import('../src/claude-hook.mjs');
  await runStatusLine(fileURLToPath(import.meta.url));await exit(0);
}
if(args.length===1&&args[0]==='--version'){console.log(version);process.exit(0);}
// Internal: the entry this command runs, so setup and the hook can tell
// whether the `redue` on PATH (a link, a package manager's shim, a wrapper)
// is this install.
if(args.length===1&&args[0]==='--entry'){console.log(fs.realpathSync(fileURLToPath(import.meta.url)));process.exit(0);}
if(args.includes('--help')||args.includes('-h')||!args.length){console.log(help);await exit(0);}
if(args[0]==='setup'||args[0]==='remove'){
  // Loaded on demand; setup works before a config exists.
  const {setupCommand}=await import('../src/setup.mjs');
  try{await setupCommand(args,{entry:fileURLToPath(import.meta.url)});}
  catch(e){error(e.message);}
  await exit(0);
}
let configFile=null,stateOverride=null;
for(let i=0;i<args.length;){
  if(args[i]==='--config'||args[i]==='--state-dir'){
    const flag=args[i],value=args[i+1];if(!value)error(`${flag} requires a path`);
    if(flag==='--config')configFile=path.resolve(value);else stateOverride=path.resolve(value);
    args.splice(i,2);
  }else i++;
}
const command=args.shift();
try{configFile??=command==='init'||stateOverride&&['stop','remove-state'].includes(command)?
  path.resolve(fs.existsSync('redue.config.json')||!fs.existsSync('vstate.config.json')?'redue.config.json':'vstate.config.json'):discoverConfig();}
catch(e){error(e.message);}
if(fs.existsSync(path.dirname(configFile)))configFile=canonicalConfig(configFile);
if(command==='agent'){
  // Loaded on demand: onboarding and agent setup are not on the run/status path.
  const {agentCommand}=await import('../src/agent-integration.mjs');
  try{await agentCommand(args,{configFile,stateOverride,entry:fileURLToPath(import.meta.url)});}
  catch(e){error(e.message);}
  await exit(0);
}
if(!['init','start','stop','status','detail','explain','run','verify','stats','remove-state'].includes(command))
  error(`unknown command ${command||'<none>'}; use --help`);
const json=args.includes('--json');
// run --if-due: run the check only when its last pass does not apply now.
const ifDue=command==='run'&&args.includes('--if-due');
if(ifDue)args.splice(args.indexOf('--if-due'),1);
// status syncs by default (warm, it costs well under 100 ms more than the
// cached answer); --cached and --short read the cached answer.
const cachedOnly=args.includes('--cached');
const dryRun=args.includes('--dry-run');
const short=args.includes('--short');
const sync=args.includes('--sync')||command==='status'&&!cachedOnly&&!short;
let workspaceSelection=null,checkSelection=null,recipeSelection=null;
if(command==='init')for(let i=0;i<args.length;){
  if(args[i]==='--workspace'||args[i]==='--check'||args[i]==='--recipe'){
    const flag=args[i],value=args[i+1];if(!value||value.startsWith('--'))error(`${flag} requires a name`);
    if(flag==='--workspace')workspaceSelection=value;else if(flag==='--recipe')recipeSelection=value;else checkSelection=value;
    args.splice(i,2);
  }else i++;
}
const check=['run','detail','explain'].includes(command)&&args[0]&&!args[0].startsWith('--')?args.shift():null;
if(command==='run'&&!check)error('run requires a check name');
if(args.some(value=>!['--json','--sync','--cached','--dry-run','--short','--no-time-limit'].includes(value)))error('unknown option; use --help');
if(sync&&!['status','detail','explain'].includes(command))error('--sync is for status or detail');
if(cachedOnly&&(command!=='status'||args.includes('--sync')))error('--cached is a status option; do not combine it with --sync');
if(short&&(command!=='status'||json||args.includes('--sync')))error('--short is a cached status option; do not combine it with --sync or --json');
if(dryRun&&command!=='init')error('--dry-run is for init');
const noTimeLimit=args.includes('--no-time-limit');
if(noTimeLimit&&command!=='init')error('--no-time-limit is for init');

if(command==='init'){
  const {discoverNodeProject,sourceLinkIssue}=await import('../src/node-onboarding.mjs');
  const {discoverPythonProject}=await import('../src/python-onboarding.mjs');
  const {sandboxTrial}=await import('../src/sandbox.mjs');
  // A Node project, a Python project, or both in one checkout.
  const python=!recipeSelection||recipeSelection==='sandbox'?discoverPythonProject(process.cwd()):null;
  let discovery;
  if(fs.existsSync('package.json')||!python)try{discovery=discoverNodeProject(process.cwd(),{recipe:recipeSelection});}
    catch(e){error(e.message);}
  else{const root=realObservedPath(process.cwd());
    const git=spawnSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']});
    discovery={schema:1,root,manager:{name:null,version:null,layout:null},observationIssue:git.status===0?sourceLinkIssue(root):
      'Git checkout is unavailable; filesystem observation needs a checkout',workspaces:false,node:process.version,
      checks:[],ambiguous:[],skipped:[],config:{schema:1,checks:[]}};}
  if(python){
    // A Python check takes its tool's name where the name is taken.
    const taken=new Set(discovery.checks.map(row=>row.config.name));
    for(const row of python.checks){if(taken.has(row.config.name))row.config.name=`${row.config.kind}:${row.config.command[0].split('/').at(-1)}`;
      taken.add(row.config.name);}
    if(!discovery.observationIssue)discovery.checks.push(...python.checks);
    discovery.skipped.push(...python.skipped);
    discovery.python=true;
  }
  if(workspaceSelection||checkSelection){
    const chosen=discovery.checks.filter(row=>
      (!workspaceSelection||row.config.workspace===workspaceSelection||
        row.config.command?.[2]===workspaceSelection)&&
      (!checkSelection||row.config.kind===checkSelection));
    if(!chosen.length)error('no discovered check matches the selected workspace and kind');
    discovery.checks=chosen;discovery.config.checks=chosen.map(row=>row.config);
  }
  // A sandboxed check is proposed only when it gives the same exit status and
  // output inside the sandbox as outside it, with the checkout's git-ignored
  // files and documentation hidden (sandbox-v3). When the plain run passed
  // and the sandboxed one failed only because it was refused a file it hid
  // (sandboxTrial's refusedHidden), it runs again with just that file
  // visible, up to visibleLimit files; when that agrees, the check keeps
  // sandbox-v3 with them in `visible`. Otherwise it gets the whole checkout
  // (sandbox-v1) without another run: without the hiding it can only fail
  // where the plain run passes. Any other difference is tried once with the
  // whole checkout, reusing the plain run. Otherwise init writes what it
  // would have without the sandboxed recipe, with the reason. Each check
  // costs one plain run and one or two sandboxed runs, and one more per
  // visible file. A run past the trial
  // limit ends the check's trials (time_limit); --no-time-limit sets none.
  const trialIssue=trial=>trial.issue?`the sandbox cannot run here (${trial.issue})`:
    trial.timedOut?`it ran past init's 5-minute trial limit${trial.timedOut==='sandboxed'?' inside the sandbox':''}`+
      ` (redue init --check ${trial.kind} --no-time-limit tries it without the limit)`:
    // A failure both ways that shows a refusal cannot be told from a real one.
    trial.same?null:trial.plain!==trial.sandboxed?`exit ${trial.sandboxed} inside the sandbox, ${trial.plain} outside it${trial.line?` (${trial.line})`:''}`:
    trial.line?`it fails both ways (exit ${trial.plain}), with a sign of a refusal inside the sandbox (${trial.line})`:
    `the output differs inside the sandbox: ${JSON.stringify(trial.output.sandboxed)} instead of ${JSON.stringify(trial.output.plain)}`;
  // With --no-time-limit and a config, the checks the config has and does
  // not run in the sandbox are tried, and one it lacks when --check names
  // it. Those that qualify replace their rows (a row that runs the same
  // script) or are added.
  const configured=fs.existsSync(configFile);
  let existing=null,existingText=null;
  if(configured&&noTimeLimit){
    try{existingText=fs.readFileSync(configFile,'utf8');existing=JSON.parse(existingText);}catch(e){error(`cannot read ${configFile}: ${e.message}`);}
    if(!Array.isArray(existing?.checks))error(`cannot read ${configFile}: it has no checks`);
    if((existing.root??'.')!=='.'||!samePath(realObservedPath(path.dirname(configFile)),discovery.root))
      error('init updates only a config at the repository root, without root; run it there');
  }
  // A failed trial's last sandboxed lines, in this configuration's local
  // state (init-trials), never in the config: output can hold tokens and
  // paths. Returns the file, or null when the state cannot hold it.
  const keepTrialOutput=(name,trial)=>{
    try{
      const state=stateOverride||projectState(discovery.root,configFile);
      assertOwnedStatePlacement({state,root:discovery.root,checks:[]});
      const dir=path.join(state,'init-trials');fs.mkdirSync(dir,{recursive:true,mode:0o700});
      const file=path.join(dir,`${name.replace(/[^A-Za-z0-9_.-]/g,'_')}.txt`);
      fs.writeFileSync(file,`${name}: exit ${trial.sandboxed} inside the sandbox, ${trial.plain} outside it. The sandboxed run's last lines:\n${trial.tail.join('\n')}\n`,{mode:0o600});
      return file;
    }catch{return null;}
  };
  const proposeSteps=process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_PROPOSE_STEPS==='1';
  const timeout=noTimeLimit?0:undefined,improved=new Map();
  // Every trial run of each check, with its time: init's account in --json (trial_runs).
  const trialRuns=new Map(),account=(name,trial,label)=>{if(trial?.runs)trialRuns.set(name,[...trialRuns.get(name)||[],
    ...trial.runs.map(r=>({...r,...r.run==='sandboxed'&&label?{as:label}:{}}))]);return trial;};
  let trials=0;
  for(const [at,row] of [...discovery.checks.entries()]){
    if(row.qualification!==sandboxQualification||row.level!=='ready')continue;
    const old=existing?.checks.find(check=>check.name===row.config.name);
    const sameRun=old&&old.kind===row.config.kind&&(row.config.script?old.script===row.config.script:
      JSON.stringify(old.command)===JSON.stringify(row.config.command));
    const notTried=!existing?null:!old?(checkSelection?null:'the config does not have it; name its kind with --check to add it'):
      isSandboxed(old.qualification)?'the config already runs it in the sandbox':sameRun?null:'the config runs something else under that name';
    if(notTried){discovery.checks[at]=null;discovery.skipped.push({kind:row.config.name,reason:`${row.config.name}: not tried; ${notTried}`});continue;}
    console.error(`Running ${row.config.name} inside and outside the sandbox to confirm it...`);
    const docs=account(row.config.name,{...await sandboxTrial(discovery.root,row.config,{hide:'docs',timeout}),kind:row.config.kind},'hidden');
    if(!docs.issue)trials++;
    if(!docs.issue&&docs.same){
      row.config={...row.config,qualification:docsQualification};row.qualification=docsQualification;
      row.reason=row.reason.replace('the whole checkout is its input',"the checkout's files git doesn't ignore, except its documentation, are its input")+`; ran both ways at init, exit ${docs.plain}`;
      improved.set(row.config.name,row.config);continue;}
    // A root test script `A && B` (scriptSteps) that disagreed: A, the
    // build, may write what B reads among the files the sandbox hides. It is
    // tried as two sandboxed steps, B seeing what A wrote (stepsRun); when
    // that agrees with the plain run, the check keeps sandbox-v3 with `steps`.
    // Only when the tests were refused a hidden file, as a build's output is.
    // Not proposed yet: no real repo has qualified this way. Tests turn it on.
    const steps=proposeSteps&&!docs.issue&&!docs.timedOut&&docs.plainRun&&docs.refusedHidden&&row.config.kind==='test'&&!row.config.workspace&&
      typeof row.config.script==='string'?scriptStepsOf(discovery.root,row.config.script):null;
    if(steps){
      console.error(`Running ${row.config.name} again as two steps in the sandbox: ${steps[0]}, then ${steps[1]}...`);
      const split=account(row.config.name,{...await sandboxTrial(discovery.root,row.config,{hide:'docs',plain:docs.plainRun,timeout,steps}),kind:row.config.kind},'steps');
      if(!split.issue)trials++;
      if(!split.issue&&split.same){
        row.config={...row.config,qualification:docsQualification,steps};row.qualification=docsQualification;
        row.reason=row.reason.replace('the whole checkout is its input',
          `it runs as two steps, ${steps[0]} and then ${steps[1]}, the second seeing the git-ignored files the first wrote; `+
          "the checkout's files git doesn't ignore, except its documentation, are its input")+`; ran both ways at init, exit ${split.plain}`;
        improved.set(row.config.name,row.config);continue;}
    }
    // Refused only hidden files it reads: tried again with just those files
    // visible (the config's `visible`), one more sandboxed run each, up to
    // visibleLimit. They are then inputs like any file the run sees.
    let shown=docs,visible=[];
    // Every file the run's refusals name is made visible at once.
    while(!shown.issue&&!shown.timedOut&&shown.refusedHidden&&visible.length<visibleLimit){
      const files=[...new Set([shown.refusedHidden,...shown.refusedLines||[]].map(line=>refusedFile(line,discovery.root,shown.entries||[])))]
        .filter(file=>file&&!visible.includes(file));
      if(!files.length||visible.length+files.length>visibleLimit)break;
      visible=[...visible,...files];
      const file=files.join(', ');
      console.error(`Running ${row.config.name} in the sandbox again, with ${file} visible...`);
      shown=account(row.config.name,{...await sandboxTrial(discovery.root,{...row.config,visible},{hide:'docs',plain:docs.plainRun,timeout}),kind:row.config.kind},`visible:${visible.join(',')}`);
      if(!shown.issue)trials++;
    }
    if(visible.length&&!shown.issue&&shown.same){
      row.config={...row.config,qualification:docsQualification,visible};row.qualification=docsQualification;
      row.reason=row.reason.replace('the whole checkout is its input',
        `the checkout's files git doesn't ignore, except its documentation, and ${visible.join(', ')}, which its trial read, are its input`)+
        `; ran both ways at init, exit ${shown.plain}`;
      improved.set(row.config.name,row.config);continue;}
    // Refused a hidden file it needs that visible cannot give it: the whole
    // checkout is tried like any other, so a recipe init proposes has run.
    const hiddenIssue=!docs.issue&&!docs.timedOut&&docs.refusedHidden?
      `it failed reading a file it hid (${docs.refusedHidden})${visible.length?`, also with ${visible.join(', ')} visible`:''}`:null;
    // Without a list of the ignored files or the documentation, the whole checkout is tried on its own.
    const trial=docs.timedOut?docs:docs.plainRun?account(row.config.name,{...await sandboxTrial(discovery.root,row.config,{plain:docs.plainRun,timeout}),kind:row.config.kind},'whole checkout'):
      [hiddenListIssue,hiddenDocsIssue].includes(docs.issue)?account(row.config.name,{...await sandboxTrial(discovery.root,row.config,{timeout}),kind:row.config.kind},'whole checkout'):docs;
    if(trial!==docs&&!trial.issue)trials++;
    let issue=trialIssue(trial);
    if(!issue){row.reason+=`; ran both ways at init, exit ${trial.plain}; the whole checkout is its input: `+
      (docs.issue?docs.issue:`with the files git ignores and the documentation hidden, ${hiddenIssue||trialIssue(docs)}`);
      improved.set(row.config.name,row.config);continue;}
    const kept=trial.tail?.length?keepTrialOutput(row.config.name,trial):null;
    if(kept)issue+=`; the sandboxed run's last lines are in ${kept}`;
    // time_limit: the kind that --check takes to try it without the limit.
    // A run past the limit tried no recipe, so the check is recording-only:
    // a fallback recipe it never ran would only answer UNVERIFIED.
    const limited=trial.timedOut?{timeLimit:row.config.kind}:{};
    // It keeps what it runs (script, or command and cwd for a Python check),
    // without the sandbox's qualification and visible files.
    if(trial.timedOut){const {qualification,visible,...config}=row.config;
      discovery.checks[at]={config,level:'recording',...limited,reason:`recording-only: ${issue}`};}
    else if(row.fallback)discovery.checks[at]={...row.fallback,reason:`Sandboxed recipe unavailable: ${issue}; ${row.fallback.reason}`};
    else{discovery.checks[at]=null;discovery.skipped.push({kind:row.config.name,reason:`${row.config.name}: sandboxed recipe unavailable: ${issue}`,
      ...trialRuns.has(row.config.name)?{trial_runs:trialRuns.get(row.config.name)}:{}});}
  }
  discovery.checks=discovery.checks.filter(Boolean).map(({fallback,...row})=>row);
  discovery.config.checks=discovery.checks.map(row=>row.config);
  const unsupported=Boolean(discovery.observationIssue||
    discovery.manager.issue&&!['npm','yarn','pnpm'].includes(discovery.manager.name)||
    discovery.manager.name==='yarn'&&!discovery.manager.version);
  const willWrite=!dryRun&&!configured&&!unsupported&&discovery.checks.length>0;
  const summary={schema:1,repository:discovery.root,node:discovery.node,
    package_manager:discovery.manager.name,version:discovery.manager.version,
    installation_layout:discovery.manager.layout,
    issue:discovery.observationIssue||discovery.manager.issue,workspaces:discovery.workspaces,
    ambiguous:discovery.ambiguous,skipped:discovery.skipped||[],
    checks:discovery.checks.map(({config:check,level,reason,timeLimit})=>({name:check.name,
      script:check.script||null,command:check.command||null,
      workspace:check.workspace||null,level,reason,...timeLimit?{time_limit:timeLimit}:{},
      ...trialRuns.has(check.name)?{trial_runs:trialRuns.get(check.name)}:{}})),config:configFile,
    written:willWrite,existing:configured,writable:!configured&&!unsupported&&discovery.checks.length>0};
  if(!json) {
    if(summary.package_manager||!discovery.python)console.log(`Node ${summary.node}; ${summary.package_manager||'unknown package manager'}`+
      `${summary.version?' '+summary.version:''}; ${summary.installation_layout} installation.`);
    if(discovery.python)console.log('Python project; tools run from .venv.');
    if(summary.issue)console.log(`Boundary: ${summary.issue}`);
    for(const row of summary.checks){
      console.log(`  ${row.name} (${row.script||row.command?.join(' ')}) — `+
        `${{ready:'ready to qualify',recording:'recording-only',unsupported:'unsupported'}[row.level]||row.level}: ${row.reason}`);
      if(row.script&&row.command)console.log(`    Recorded invocation: ${row.command.map(value=>
        value==='@node'?'node':value==='@typescript-compiler:.'?'[reviewed local TypeScript compiler implementation]':
          value.startsWith('@test-runner:')?`[local ${value.slice('@test-runner:'.length)}]`:value.startsWith('@typescript-bin:')?
          `[installed TypeScript in ${value.slice('@typescript-bin:'.length)}]`:value).join(' ')}`);
    }
    for(const row of summary.ambiguous)
      console.log(`  ${row.kind}: ambiguous scripts (${row.scripts.join(', ')}); choose one explicitly`);
    for(const row of summary.skipped)console.log(`  Skipped: ${row.reason}`);
    if(!summary.checks.length)console.log('No useful existing verification scripts found.');
    console.log(existing&&improved.size?(dryRun?`Preview only; ${configFile} was not updated.`:`Updating ${[...improved.keys()].join(', ')} in ${configFile}.`):
      configured?`Existing ${configFile} left unchanged.`:
      dryRun?`Preview only; ${configFile} was not written.`:
        willWrite?`Writing ${configFile}; inspect it before running checks.`:'No configuration will be written.');
  }
  if(willWrite){
    if(!samePath(realObservedPath(path.dirname(configFile)),discovery.root))
      error('init writes only at the repository root; use --config there or --dry-run');
    fs.writeFileSync(configFile,JSON.stringify(discovery.config,null,2)+'\n',{flag:'wx'});
    if(!json){console.log(`Created ${configFile}. ${trials?'Checks ran inside and outside the sandbox to choose their recipe; no results were recorded.':'No checks were executed.'}`);
      console.log('Ready to qualify means the supported contract will be validated; it is not verification evidence.');
      console.log(`Next: review the config, then redue start and redue run ${JSON.stringify(discovery.checks[0].config.name)}.`);
      console.log('Connect your agent: redue agent setup codex (or claude). Preview with --dry-run.');
      console.log('Then redue status says whether each result applies to the files as they are now.');}
  } else if(existing&&improved.size&&!dryRun){
    if(fs.readFileSync(configFile,'utf8')!==existingText)error(`${configFile} changed while the checks ran; nothing was written. Run init again`);
    // The observer keeps the config it started with: it is restarted around the update.
    const state=stateOverride||projectState(discovery.root,configFile);
    let running=false;try{running=processAlive(Number(fs.readFileSync(path.join(state,'observer.lock','pid'),'utf8')));}catch{}
    const self=action=>spawnSync(process.execPath,[process.argv[1],'--config',configFile,...stateOverride?['--state-dir',stateOverride]:[],action],
      {stdio:['ignore','pipe','pipe'],encoding:'utf8'});
    if(running&&self('stop').status!==0)error('the observer did not stop; nothing was written');
    const names=new Set(existing.checks.map(check=>check.name));
    existing.checks=[...existing.checks.map(check=>improved.get(check.name)??check),...[...improved.values()].filter(check=>!names.has(check.name))];
    const text=JSON.stringify(existing,null,2)+'\n';
    fs.writeFileSync(configFile,text);
    // A config setup created is still one redue remove deletes.
    (await import('../src/setup.mjs')).configRewritten(discovery.root,existingText,text);
    Object.assign(summary,{written:true,updated:[...improved.keys()],observer:!running?'not running':self('start').status===0?'restarted':'not started'});
    if(!json)console.log(`Updated ${[...improved.keys()].join(', ')} in ${configFile}.`+
      {restarted:' Restarted the observer with it.','not started':' The observer did not start again: run redue start.','not running':''}[summary.observer]);
    // Agent setup wrote the hook's trigger rules and the instruction block for
    // the old config: a check that became verifiable would run past the hook.
    // Each installed integration is rewritten for the new one.
    summary.agents=await refreshAgents(discovery.root,configFile,json);

  } else if(unsupported&&!json)console.log(`No config written: ${summary.issue||'unsupported discovery boundary'}.`);
  if(json)console.log(JSON.stringify({...summary,proposed_config:discovery.config}));
  await exit(0);
}
async function refreshAgents(root,configFile,json){
  const {setupInvocation,staleIntegration}=await import('../src/agent-integration.mjs'),result=[];
  const relative=path.relative(root,configFile).split(path.sep).join('/');
  let config;try{config=JSON.parse(fs.readFileSync(configFile,'utf8'));}catch{return result;}
  for(const host of ['claude','codex']){
    let stale;try{stale=staleIntegration(root,relative,config,host);}
    catch(e){result.push({host,updated:false,reason:e.message});
      if(!json)console.log(`REDUE's ${host} files were not updated for the new config: ${e.message}. Then run redue agent setup ${host} --apply.`);continue;}
    if(!stale.length)continue;
    // Setup again through the install the hooks already name, so they keep it.
    const [file,...first]=setupInvocation(root)??[process.execPath,process.argv[1]];
    const out=spawnSync(file,[...first,'--config',configFile,'agent','setup',host,'--apply'],{stdio:['ignore','pipe','pipe'],encoding:'utf8'});
    const updated=out.status===0,why=String(out.stderr||out.error?.message||'').trim().split('\n').pop();
    result.push({host,updated,stale,...updated?{}:{reason:why||null}});
    if(!json)console.log(updated?`Rewrote REDUE's ${stale.join(', ')} for ${host} to match. Start a new ${host==='claude'?'Claude Code':'Codex'} session to load them.`:
      `REDUE's ${stale.join(', ')} for ${host} ${stale.length>1?'are':'is'} out of date and could not be rewritten: run redue agent setup ${host} --apply.`+
      (why?` (${why})`:''));
  }
  return result;
}
function printLifecycle(output,action,machine){
  if(machine){process.stdout.write(output);return;}
  let value;try{value=JSON.parse(output);}catch{process.stdout.write(output);return;}
  if(action==='start'){
    console.log(value.ready?'Observer ready.':'Observer started; checking inputs. Applicability stays UNVERIFIED until ready.');
    console.log('Use redue status. Stop with redue stop.');
  }else if(action==='remove-state')console.log(`Removed only REDUE-owned state: ${value.removed}`);
  else console.log(value.ok?'Observer stopped. Historical evidence is retained.':
    `Observer unavailable: ${value.reason||'not running'}. Previous evidence is not CURRENT.`);
}
// Owned-state maintenance must not need the checkout, its package manager,
// or installed compiler to remain present. No command is run from this path.
if(stateOverride&&['stop','remove-state'].includes(command)){
  const runtime=path.join(stateOverride,'project-runtime-v1.json');
  if(!fs.existsSync(runtime)){
    // init's kept trial output may be all there is.
    if(command==='remove-state'&&fs.existsSync(path.join(stateOverride,'init-trials'))){
      fs.rmSync(path.join(stateOverride,'init-trials'),{recursive:true,force:true});try{fs.rmdirSync(stateOverride);}catch{}
      console.log("Removed init's kept trial output at this path.");process.exit(0);}
    console.log('No REDUE state exists at this path.');process.exit(0);}
  mark('client.engine_submit');
  const result=spawnSync(process.execPath,[engine,runtime,command==='stop'?'stop':'uninstall'],
    {cwd:os.tmpdir(),stdio:['inherit','pipe','inherit'],encoding:'utf8',env:process.env});
  if(result.error)error(result.error.message);
  if(result.stdout)printLifecycle(result.stdout,command,json);
  await exit(result.status??2);
}
let publicConfig;
try{publicConfig=JSON.parse(fs.readFileSync(configFile,'utf8'));}
catch(e){error(e.code==='ENOENT'?`no configuration at ${configFile}; run redue init from the project root, or use --config FILE`:`cannot read ${configFile}: ${e.message}`);}
if(publicConfig.schema!==1)error('config schema must be 1');
if(!Array.isArray(publicConfig.checks)||!publicConfig.checks.length)
  error('config needs at least one explicitly defined check');
for(const key of Object.keys(publicConfig))
  if(!['schema','root','checks','packageManager','endOfTurnCheck'].includes(key))error(`unsupported config field ${key}`);
// The Claude Code hook's end-of-turn check; only the hook reads it.
if(publicConfig.endOfTurnCheck!==undefined&&typeof publicConfig.endOfTurnCheck!=='boolean')error('endOfTurnCheck must be true or false');
if(check&&!publicConfig.checks.some(row=>row.name===check))error(`unknown check ${check}; use redue status to list configured checks`);
const root=realObservedPath(path.resolve(path.dirname(configFile),publicConfig.root||'.'));
const state=stateOverride||projectState(root,configFile);
if(!/^(?:vstate|redue)-/.test(path.basename(state)))
  error('--state-dir must name a dedicated redue-* directory outside the checkout (legacy vstate-* is also supported)');
const runtimeFile=path.join(state,'project-runtime-v1.json');
function which(name){
  const found=findExecutable(name);
  if(found)return found;
  error(`cannot resolve executable ${name} on PATH`);
}
function token(value,cwd='.'){
  if(value==='@node')return process.execPath;
  if(value==='@project')return root;
  if(value==='@typescript-compiler:.'){
    try{return directCompiler(root,{verify:false}).entry;}catch(e){error(`direct compiler unavailable: ${e.code||e.message}`);}
  }
  if(value.startsWith('@test-runner:')){
    // Qualification reports a missing runner; status and stop still work.
    try{return testRunnerAt(root,cwd,value.slice('@test-runner:'.length)).entry;}
    catch{return path.join(root,cwd,'node_modules',value.slice('@test-runner:'.length),'<unavailable>');}
  }
  if(value==='@vstate/direct-typescript-probe')return path.join(productRoot,'src','direct-typescript-probe.mjs');
  if(value.startsWith('@typescript-bin:')){
    const dir=value.slice('@typescript-bin:'.length);
    if(!dir||path.isAbsolute(dir)||dir.split('/').includes('..'))
      error('TypeScript executable workspace path is unsafe');
    const manifest=path.join(root,dir,'package.json');
    let resolved;try{resolved=createRequire(manifest).resolve('typescript/package.json');}
    catch{error('installed TypeScript compiler cannot be resolved');}
    const compiler=path.join(path.dirname(realObservedPath(resolved)),'bin','tsc');
    if(!withinPath(compiler,root)||!fs.existsSync(compiler))
      error('TypeScript executable is outside the observed project');
    return compiler;
  }
  if(value==='@vstate/npm-typecheck-probe')return path.join(productRoot,'src','npm-typecheck-probe.mjs');
  if(value==='@vstate/typescript-contract-probe')return path.join(productRoot,'src','typescript-contract-probe.mjs');
  if(value==='@vstate/yarn-workspace-typecheck-probe')return path.join(productRoot,'src','yarn-workspace-typecheck-probe.mjs');
  if(value==='@vstate/pnpm-typecheck-probe')return path.join(productRoot,'src','pnpm-typecheck-probe.mjs');
  if(value==='@vstate/toolchain-probe')return path.join(productRoot,'src','toolchain-probe.mjs');
  if(value.startsWith('@which:'))return which(value.slice(7));
  return value;
}
function argv(values,label,cwd){
  if(!Array.isArray(values)||!values.length||values.some(v=>typeof v!=='string'||!v))
    error(`${label} must be nonempty exact argv`);
  return values.map(value=>token(value,cwd));
}
const categories=['source','generated','installedDependencies','environment','toolchain','runtime',
  'probeContinuity'];
const checks=publicConfig.checks.map(check=>{
  const allowed=['name','command','cwd','inputs','generatedInputs','installedInputs',
    'allowedExternalRoots','probes','environment','coverage','coverageReview','coverageReasons',
    'script','kind','qualification','workspace','visible','steps'];
  for(const key of Object.keys(check))if(!allowed.includes(key))
    error(`unsupported check field ${check.name}.${key}`);
  // visible: files a sandboxed run that hides git-ignored files does not hide (init writes them).
  if(check.visible!==undefined&&(!hidesIgnored(check.qualification)||!Array.isArray(check.visible)||check.visible.length>visibleLimit||
    !check.visible.every(rel=>typeof rel==='string'&&rel&&!path.isAbsolute(rel)&&!rel.includes('\\')&&!rel.split('/').some(part=>!part||part==='.'||part==='..'))))
    error(`${check.name}.visible: up to ${visibleLimit} relative files, for a sandboxed check that hides git-ignored files`);
  // steps: a root test script `A && B` a sandboxed run runs as two steps (init writes them).
  if(check.steps!==undefined&&(!hidesIgnored(check.qualification)||check.kind!=='test'||typeof check.script!=='string'||check.workspace||
    !Array.isArray(check.steps)||check.steps.length!==2||!check.steps.every(step=>typeof step==='string'&&step.trim()===step&&step)))
    error(`${check.name}.steps: the two steps of a root test script, for a sandboxed check that hides git-ignored files`);
  for(const category of categories)if(check.coverage?.[category]&&
    typeof check.coverageReview?.[category]!=='string')
    error(`${check.name}: reviewed coverage ${category} needs a rationale`);
  const npmDirect=check.qualification===directQualification;
  const pnpmTypecheck=check.qualification==='pnpm-tsc-v1';
  const testsDirect=check.qualification===testsQualification;
  const generalScript=check.qualification===scriptQualification;
  const sandboxed=isSandboxed(check.qualification);
  if(check.script&&check.command&&!pnpmTypecheck&&!npmDirect&&!testsDirect)
    error(`${check.name}: choose script or command, not both`);
  const manager=publicConfig.packageManager;
  if(check.script&&!['npm','yarn','pnpm'].includes(manager))
    error(`${check.name}: script checks need supported npm, Yarn or pnpm packageManager`);
  const scriptCommand=check.script&&!check.command?
    [`@which:${manager}`,'run',check.script]:null;
  const npmAutomatic=check.qualification==='typescript-noemit-v1';
  const yarnWorkspace=check.qualification==='yarn-workspace-tsc-v1';
  if(check.qualification&&!npmAutomatic&&!npmDirect&&!yarnWorkspace&&!pnpmTypecheck&&!testsDirect&&!generalScript&&!sandboxed)
    error(`${check.name}: unknown qualification contract`);
  // The general recipe runs the root package script through the package manager.
  if(generalScript&&(!['npm','pnpm','yarn'].includes(manager)||!check.script||check.command||check.cwd&&check.cwd!=='.'||
    check.workspace||!scriptKinds.includes(check.kind)))
    error(`${check.name}: the general recipe needs a root typecheck, test or lint script, without command or cwd`);
  // The sandboxed recipe runs a root package script, or a tool from the project's .venv.
  if(sandboxed&&(check.cwd&&check.cwd!=='.'||check.workspace||!sandboxKinds.includes(check.kind)||
    (check.script?!['npm','pnpm','yarn'].includes(manager):!pythonTool(check))))
    error(`${check.name}: the sandboxed recipe needs a root ${sandboxKinds.join(' or ')} script, or a command that runs a tool from .venv/bin, without cwd`);
  if(npmDirect&&(manager!=='npm'||check.cwd&&check.cwd!=='.'||!Array.isArray(check.command)||
    check.command[0]!=='@node'||check.command[1]!=='@typescript-compiler:.'||
    !tscRun({},{script:null,args:check.command.slice(2)}).run?.noEmit))
    error(`${check.name}: direct recipe requires its explicit local compiler command`);
  // The script's own arguments follow the runner; qualification compares them with the script.
  if(testsDirect&&(!['npm','pnpm','yarn'].includes(manager)||!check.script||check.cwd&&check.cwd!=='.'&&!check.workspace||!Array.isArray(check.command)||
    check.command[0]!=='@node'||!/^@test-runner:(?:vitest|jest)$/.test(check.command[1]||'')))
    error(`${check.name}: test recipe requires its explicit local test runner command`);
  if(npmAutomatic&&(manager!=='npm'||check.cwd&&check.cwd!=='.'))
    error(`${check.name}: automatic TypeScript qualification currently needs root npm script`);
  if(yarnWorkspace&&(manager!=='yarn'||!check.workspace||check.cwd&&check.cwd!=='.'||
    check.command?.length!==5||check.command[0]!=='@which:yarn'||
    check.command[1]!=='workspace'||check.command[2]!==check.workspace||
    check.command[3]!=='run'))
    error(`${check.name}: Yarn workspace qualification needs its discovered workspace command`);
  if(pnpmTypecheck&&(manager!=='pnpm'||!Array.isArray(check.command)||
    check.command[0]!=='@node'||
    check.command[1]!==`@typescript-bin:${check.cwd||'.'}`||
    check.workspace&&check.cwd==='.'||
    !tscRun({},{script:null,args:check.command.slice(2)}).run))
    error(`${check.name}: pnpm qualification needs its discovered standalone TypeScript command`);
  const reason=check.kind==='test'?'test runtime, transforms and cache inputs need review':
    check.kind==='lint'?'lint plugins, config and resolver inputs need review':
    check.kind==='build'?'build environment and generated inputs need review':
    'check inputs need review';
  // A chained script has one check per tsc run: each check's run counts them,
  // so a run added to or removed from the script invalidates them all.
  const runCount=(npmDirect||pnpmTypecheck)&&check.script?publicConfig.checks.filter(other=>
    other.qualification===check.qualification&&other.script===check.script&&
    (other.cwd||'.')===(check.cwd||'.')&&(other.workspace||null)===(check.workspace||null)).length:1;
  if(runCount>16)error(`${check.name}: more than 16 checks for script ${check.script}`);
  const run=npmDirect||pnpmTypecheck?runArgv({script:check.script??null,args:check.command.slice(2),count:runCount}):null;
  const autoProbes=npmDirect?[['@node','@vstate/direct-typescript-probe','@project',...run]]:npmAutomatic?[['@node','@vstate/typescript-contract-probe',
    '@project',check.script,'@which:npm']]:yarnWorkspace?
    [['@node','@vstate/yarn-workspace-typecheck-probe','@project',
      check.workspace,check.command[4],'@which:yarn']]:pnpmTypecheck?
    [['@node','@vstate/pnpm-typecheck-probe','@project',
      check.workspace||'.',...run]]:[];
  const windowsContext=process.platform==='win32'?
    ['ComSpec','COMSPEC','PATHEXT','USERPROFILE']:[];
  const autoEnvironment=npmDirect?directEnvironment:testsDirect?testEnvironment:generalScript?scriptEnvironment(manager):
    sandboxed?sandboxEnvironment(Boolean(pythonTool(check)),check.script?manager:null,check.kind):npmAutomatic?{variables:['NODE_OPTIONS','NODE_PATH','CI','HOME',
    'NODE_ENV','BASH_ENV','ENV',...windowsContext],prefixes:['npm_config_','DYLD_','TSGO_'],
    pathExecutables:['node','npm'],executableIdentity:true}:yarnWorkspace?
    {variables:['NODE_OPTIONS','NODE_PATH','CI','HOME','NODE_ENV','BASH_ENV','ENV',...windowsContext],
      prefixes:['YARN_','COREPACK_','npm_config_','DYLD_','TSGO_'],
      pathExecutables:['node','yarn'],executableIdentity:true}:pnpmTypecheck?
    {variables:['NODE_OPTIONS','NODE_PATH','CI','HOME','NODE_ENV','BASH_ENV','ENV',...windowsContext],
      prefixes:['PNPM_','COREPACK_','npm_config_','DYLD_','TSGO_'],
      pathExecutables:['node'],executableIdentity:true}:{};
  return {name:check.name,command:argv(scriptCommand||check.command,`${check.name}.command`,
    typeof check.cwd==='string'&&check.cwd&&!path.isAbsolute(check.cwd)&&!check.cwd.split('/').includes('..')?check.cwd:'.'),
    cwd:check.cwd,inputs:check.inputs||[],generatedInputs:check.generatedInputs||[],
    installedInputs:check.installedInputs||(
      npmDirect?[...directInstalledInputs]:npmAutomatic||testsDirect?['node_modules/**']:[]),
    allowedExternalRoots:check.allowedExternalRoots||[],
    probes:[...(check.probes||[]),...autoProbes]
      .map((p,i)=>argv(p,`${check.name}.probes[${i}]`)),
    environment:check.environment||autoEnvironment,coverage:check.coverage||{},
    coverageReview:check.coverageReview||{},
    coverageReasons:check.coverageReasons||Object.fromEntries(
      categories.map(category=>[category,reason])),
    qualification:check.qualification||null,script:check.script||null,
    ...(check.visible?.length?{visible:check.visible}:{}),
    ...(check.steps?{steps:check.steps}:{}),
    ...(runCount>1?{runCount}:{}),
    ...(npmAutomatic?{qualificationInterpretation:'npm-launcher-withheld@1'}:{}),
    ...(npmDirect?{qualificationInterpretation:directInterpretation}:{}),
    ...(testsDirect?{qualificationInterpretation:testsInterpretation}:{}),
    ...(generalScript?{qualificationInterpretation:scriptInterpretation}:{}),
    ...(sandboxed?{qualificationInterpretation:sandboxInterpretationOf(check.qualification,check.kind)}:{}),
    workspace:check.workspace||null,kind:check.kind||null};
});
const runtime={schema:1,provider:'declared-project@1',root,state,checks};
try{assertOwnedStatePlacement(runtime);}catch(e){error(e.message);}
const serialized=JSON.stringify(runtime,null,2)+'\n';
if(command==='stats'){
  const {readStats,renderStats}=await import('../src/stats.mjs');
  const value=readStats(state,publicConfig.checks.map(item=>item.name));
  console.log(json?JSON.stringify(value):renderStats(value));
  await exit(0);
}
const maintenance=command==='stop'||command==='remove-state';
if(maintenance&&!fs.existsSync(runtimeFile)){
  // init's kept trial output may be all there is.
  if(command==='remove-state'&&fs.existsSync(path.join(state,'init-trials'))){
    fs.rmSync(path.join(state,'init-trials'),{recursive:true,force:true});try{fs.rmdirSync(state);}catch{}
    console.log(`Removed init's kept trial output for ${configFile}.`);process.exit(0);}
  console.log(`No REDUE state exists for ${configFile}.`);
  process.exit(0);
}
if(!maintenance)fs.mkdirSync(state,{recursive:true,mode:0o700});
// Two commands can meet on fresh state (SessionStart's start and the first
// status): whichever creates the runtime file first wins, and the other
// treats it as existing.
let created=false;
if(!maintenance&&!fs.existsSync(runtimeFile))
  try{fs.writeFileSync(runtimeFile,serialized,{flag:'wx',mode:0o600});created=true;}catch(e){if(e.code!=='EEXIST')throw e;}
if(!maintenance&&!created){
  const previous=fs.readFileSync(runtimeFile,'utf8');
  if(previous!==serialized){
    const pidFile=path.join(state,'observer.lock','pid');
    if(fs.existsSync(pidFile)){
      const pid=Number(fs.readFileSync(pidFile));
      if(processAlive(pid))error('config changed while observer is running; stop it before restarting with the new plan');
    }
    fs.writeFileSync(runtimeFile,serialized,{mode:0o600});
  }
}

if(command==='verify'){
  const self=(more,options)=>spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--config',configFile,
    ...(stateOverride?['--state-dir',stateOverride]:[]),...more],{env:process.env,...options});
  const ask=()=>{const r=self(['status','--sync','--json'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:600_000});
    try{return JSON.parse(r.stdout);}catch{return null;}};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let status=ask();
  // Nothing is confirmed without the observer: start it as the session hook
  // does, and wait while it indexes.
  if(!status?.observation?.healthy){
    let pid=null;try{pid=Number(fs.readFileSync(path.join(state,'observer.lock','pid'),'utf8'));}catch{}
    if(!(Number.isSafeInteger(pid)&&pid>0&&processAlive(pid))){
      if(!json)console.error('redue verify: starting the observer');
      self(['start'],{stdio:['ignore','ignore','inherit']});status=ask();
    }
    for(const until=Date.now()+120_000;!status?.observation?.healthy&&
      ['discovery','indexing','reconciling','validating','initializing'].includes(status?.observation?.phase)&&Date.now()<until;){
      await sleep(1000);status=ask();}
  }
  // A check is due when its last result does not apply to the files as they
  // are now, and it can run: its program is there.
  const runnable=row=>{const command=checks.find(item=>item.name===row.name)?.command?.[0];
    if(typeof command!=='string'||command.endsWith('<unavailable>'))return false;
    if(command.includes('/'))return fs.existsSync(path.resolve(root,checks.find(item=>item.name===row.name).cwd||'.',command));
    return Boolean(findExecutable(command));};
  // A check no run can confirm (recording-only, or one that rewrites its own
  // inputs: verifiable false) is never due. A run can make another check due
  // (a suite that writes an input), and a check that rewrites its own inputs
  // shows that on its second run: verify runs what is due again, three rounds
  // at most.
  // In a round, a check whose last run changed its inputs runs first, so the
  // checks its run makes due run after it.
  // A check that already ran here is due again only when it is STALE or its
  // inputs changed during its run: another UNVERIFIED reason would not clear.
  const changedOwn=row=>/declared input event occurred during execution/.test(row.reason||'');
  const ranNames=new Set();
  const dueOf=value=>(value?.checks||[]).filter(row=>row.verifiable!==false&&
    (row.freshness==='STALE'||row.freshness==='UNVERIFIED'&&runnable(row)&&(!ranNames.has(row.name)||changedOwn(row))))
    .sort((a,b)=>changedOwn(b)-changedOwn(a));
  // While the observer indexes or reconciles (a run may have changed a manifest).
  const settle=async()=>{for(const until=Date.now()+120_000;!status?.observation?.healthy&&
    ['discovery','indexing','reconciling','validating','initializing'].includes(status?.observation?.phase)&&Date.now()<until;){
    await sleep(1000);status=ask();}};
  const {note,dueNote}=await import('../src/stats.mjs');
  const ran=[];
  for(let round=0,due=dueOf(status);round<3&&due.length&&status?.observation?.healthy;round++,due=dueOf(status)){
    for(const row of due){
      const entry=dueNote(status,row.name);if(entry)note(state,entry);
      if(!json)console.error(`redue verify: running ${row.name} (${row.freshness}: ${row.reason})`);
      // With --json, the check's output goes to stderr; stdout carries the answer.
      const r=self(['run',row.name],{stdio:json?['ignore',2,2]:'inherit'});
      ran.push({check:row.name,was:row.freshness,exit:r.status});ranNames.add(row.name);
    }
    status=ask();await settle();
  }
  const final=status;
  const counted=(final?.checks||[]).filter(row=>row.verifiable!==false);
  const verified=Boolean(final?.observation?.healthy)&&counted.length>0&&counted.every(row=>row.freshness==='CURRENT'&&row.result==='PASS');
  if(json)console.log(JSON.stringify({schema:1,verified,ran,status:final}));
  else{
    if(ran.length)console.log('');
    console.log(final?renderStatus(final):'UNVERIFIED — status did not answer.');
    const other=final?.checks?.length-counted.length;
    console.log((verified?`Verified: every check that can be verified (${counted.length}) passed on the files as they are now.`:
      counted.length?'Not verified: some checks did not end CURRENT / PASS.':'Not verified: no check can be verified here.')+
      (other?` ${other} not verifiable, left out.`:''));
  }
  await exit(verified?0:1);
}
if(command==='status'&&!sync){
  const value=readCachedStatus(state,publicConfig.checks);
  console.log(json?JSON.stringify(value):renderStatus(value,{short}));
  await exit(0);
}

const details=command==='detail'||command==='explain';
const internal=command==='remove-state'?'uninstall':
  details?'sync':command==='status'&&sync?'sync':command;
// On macOS and Linux the engine runs in this process, which saves a Node startup
// on every run; its own handlers receive SIGINT and SIGTERM. Windows keeps a
// child engine because cancellation reaches it over IPC.
// Asked when this part of a command runs, after earlier parts may have
// changed files. REDUE_FORCE=1 runs it anyway.
if(ifDue&&process.env.REDUE_FORCE!=='1'){
  const [{verdict},{note,skipNote,dueNote}]=await Promise.all([import('../src/claude-hook.mjs'),import('../src/stats.mjs')]);
  const asked=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--config',configFile,...(stateOverride?['--state-dir',stateOverride]:[]),
    'status','--sync','--json'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],env:process.env,timeout:600_000});
  let status=null;try{status=JSON.parse(asked.stdout);}catch{}
  const due=dueNote(status,check);
  if(due)note(state,due);
  if(verdict(status,check)){
    note(state,skipNote(status,check,'if-due'));
    const row=status.checks.find(item=>item.name===check);
    if(json)console.log(JSON.stringify({check,skipped:true,result:'PASS',run_id:row.invocation.runId}));
    else console.error(`REDUE: ${check} passed on these exact inputs (run ${row.invocation.runId}); not run again. REDUE_FORCE=1 runs it anyway.`);
    await exit(0);
  }
}
if(command==='run'&&process.platform!=='win32'){
  process.argv=[process.argv[0],engine,runtimeFile,internal,check,...(!json?['--human']:[])];
  await import(pathToFileURL(engine).href);
}else if(command==='run'){
  const child=spawn(process.execPath,[engine,runtimeFile,internal,check,...(!json?['--human']:[])],
    {stdio:['inherit','inherit','inherit','ipc'],env:process.env});
  const forward=signal=>{if(child.exitCode!==null)return;
    if(process.platform==='win32'&&child.connected)child.send({action:'cancel',signal});
    else child.kill(signal);};
  const interrupt=()=>forward('SIGINT'),terminate=()=>forward('SIGTERM');
  process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
  const outcome=await new Promise(resolve=>{
    child.once('error',error=>resolve({error}));
    child.once('close',(status,signal)=>resolve({status,signal}));
  });
  process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
  if(outcome.error)error(outcome.error.message);
  process.exit(outcome.status??(outcome.signal?128+os.constants.signals[outcome.signal]:1));
}else if(internal==='sync'&&process.platform!=='win32'){
  // As for run, the synchronized status engine runs in this process.
  process.argv=[process.argv[0],engine,runtimeFile,internal,'','--value'];
  mark('client.engine_submit',{inProcess:true});
  const synchronized=await import(pathToFileURL(engine).href);
  await synchronized.finished;
  mark('client.engine_complete',{exit:process.exitCode??0});
  if(synchronized.syncValue)showSynchronized(synchronized.syncValue);
  await exit(process.exitCode??0);
}else{
  mark('client.engine_submit');
  const result=spawnSync(process.execPath,[engine,runtimeFile,internal,...(check?[check]:[])],
    {stdio:['inherit','pipe','inherit'],
      encoding:'utf8',env:traceEnvironment()});
  mark('client.engine_complete',{exit:result.status,signal:result.signal});
  if(result.error)error(result.error.message);
  if(result.stdout){
    if(['status','detail','explain'].includes(command)){
      let value;try{value=JSON.parse(result.stdout);}catch{error('status response could not be read; applicability is unknown');}
      showSynchronized(value);
    }else printLifecycle(result.stdout,command,json);
  }
  await exit(result.status??1);
}
function showSynchronized(value){
  if(details&&check)value={...value,checks:value.checks.filter(row=>row.name===check)};
  if(json)console.log(JSON.stringify(value));
  else console.log(details?renderExplain(value,check):renderStatus(value,{short}));
}
