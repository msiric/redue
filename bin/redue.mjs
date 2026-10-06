#!/usr/bin/env node
import fs from 'node:fs';
import {directCompiler,directQualification,directEnvironment,directInterpretation} from '../src/direct-typescript.mjs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {discoverNodeProject} from '../src/node-onboarding.mjs';
import {processAlive} from '../src/process-liveness.mjs';
import {samePath,withinPath,realObservedPath} from '../src/path-identity.mjs';
import {discoverConfig,projectState,canonicalConfig} from '../src/project-location.mjs';
import {agentCommand} from '../src/agent-integration.mjs';
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
  init [--dry-run] [--workspace NAME] [--check KIND] [--recipe typescript-direct]
                       Discover existing scripts; optionally select one workspace/check
  agent setup codex|claude [--dry-run|--apply] [--json]
  agent doctor [codex|claude] [--json]
  agent remove codex|claude [--dry-run|--apply] [--json]
                       Connect project instructions; explicit setup only
  start                Start the local observer
  stop                 Stop this observer
  status [--json|--short] Read conservative cached status
  status --sync        Reconcile inputs and caller context before answering
  explain [CHECK] [--json] Explain applicability (synchronized; may cost more than a rerun)
  detail [CHECK] [--json]  Alias for explain
  run CHECK            Execute one configured check and record its outcome
  remove-state         Stop and remove only this configuration's owned local state

No checks run in the background. Direct commands outside redue create no receipts.`;

function error(message){console.error(`redue: ${message}`);process.exit(2);}
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--version'){console.log(version);process.exit(0);}
if(args.includes('--help')||args.includes('-h')||!args.length){console.log(help);process.exit(0);}
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
  try{await agentCommand(args,{configFile,stateOverride,entry:fileURLToPath(import.meta.url)});}
  catch(e){error(e.message);}
  process.exit(0);
}
if(!['init','start','stop','status','detail','explain','run','remove-state'].includes(command))
  error(`unknown command ${command||'<none>'}; use --help`);
const json=args.includes('--json');
const sync=args.includes('--sync');
const dryRun=args.includes('--dry-run');
const short=args.includes('--short');
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
if(args.some(value=>!['--json','--sync','--dry-run','--short'].includes(value)))error('unknown option; use --help');
if(sync&&!['status','detail','explain'].includes(command))error('--sync is for status or detail');
if(short&&(command!=='status'||json||sync))error('--short is a cached status option; do not combine it with --sync or --json');
if(dryRun&&command!=='init')error('--dry-run is for init');

if(command==='init'){
  let discovery;try{discovery=discoverNodeProject(process.cwd(),{recipe:recipeSelection});}
  catch(e){error(e.message);}
  if(workspaceSelection||checkSelection){
    const chosen=discovery.checks.filter(row=>
      (!workspaceSelection||row.config.workspace===workspaceSelection||
        row.config.command?.[2]===workspaceSelection)&&
      (!checkSelection||row.config.kind===checkSelection));
    if(!chosen.length)error('no discovered check matches the selected workspace and kind');
    discovery.checks=chosen;discovery.config.checks=chosen.map(row=>row.config);
  }
  const configured=fs.existsSync(configFile),unsupported=Boolean(discovery.observationIssue||
    discovery.manager.issue&&!['npm','yarn','pnpm'].includes(discovery.manager.name)||
    discovery.manager.name==='yarn'&&!discovery.manager.version);
  const willWrite=!dryRun&&!configured&&!unsupported&&discovery.checks.length>0;
  const summary={schema:1,repository:discovery.root,node:discovery.node,
    package_manager:discovery.manager.name,version:discovery.manager.version,
    installation_layout:discovery.manager.layout,
    issue:discovery.observationIssue||discovery.manager.issue,workspaces:discovery.workspaces,
    ambiguous:discovery.ambiguous,
    checks:discovery.checks.map(({config:check,level,reason})=>({name:check.name,
      script:check.script||null,command:check.command||null,
      workspace:check.workspace||null,level,reason})),config:configFile,
    written:willWrite,existing:configured};
  if(!json) {
    console.log(`Node ${summary.node}; ${summary.package_manager||'unknown package manager'}`+
      `${summary.version?' '+summary.version:''}; ${summary.installation_layout} installation.`);
    if(summary.issue)console.log(`Boundary: ${summary.issue}`);
    for(const row of summary.checks){
      console.log(`  ${row.name} (${row.script||row.command?.join(' ')}) — `+
        `${{ready:'ready to qualify',recording:'recording-only',unsupported:'unsupported'}[row.level]||row.level}: ${row.reason}`);
      if(row.script&&row.command)console.log(`    Recorded invocation: ${row.command.map(value=>
        value==='@node'?'node':value==='@typescript-compiler:.'?'[reviewed local TypeScript compiler implementation]':value.startsWith('@typescript-bin:')?
          `[installed TypeScript in ${value.slice('@typescript-bin:'.length)}]`:value).join(' ')}`);
    }
    for(const row of summary.ambiguous)
      console.log(`  ${row.kind}: ambiguous scripts (${row.scripts.join(', ')}); choose one explicitly`);
    if(!summary.checks.length)console.log('No useful existing verification scripts found.');
    console.log(configured?`Existing ${configFile} left unchanged.`:
      dryRun?`Preview only; ${configFile} was not written.`:
        willWrite?`Writing ${configFile}; inspect it before running checks.`:'No configuration will be written.');
  }
  if(willWrite){
    if(!samePath(realObservedPath(path.dirname(configFile)),discovery.root))
      error('init writes only at the repository root; use --config there or --dry-run');
    fs.writeFileSync(configFile,JSON.stringify(discovery.config,null,2)+'\n',{flag:'wx'});
    if(!json){console.log(`Created ${configFile}. No checks were executed.`);
      console.log('Ready to qualify means the supported contract will be validated; it is not verification evidence.');
      console.log(`Next: review the config, then redue start and redue run ${JSON.stringify(discovery.checks[0].config.name)}.`);
      console.log('Connect your agent: redue agent setup codex (or claude). Preview with --dry-run.');
      console.log('Use redue status first. --sync can establish applicability, but may cost more than rerunning a cheap check.');}
  } else if(unsupported&&!json)console.log(`No config written: ${summary.issue||'unsupported discovery boundary'}.`);
  if(json)console.log(JSON.stringify({...summary,proposed_config:discovery.config}));
  process.exit(0);
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
  if(!fs.existsSync(runtime)){console.log('No REDUE state exists at this path.');process.exit(0);}
  const result=spawnSync(process.execPath,[engine,runtime,command==='stop'?'stop':'uninstall'],
    {cwd:os.tmpdir(),stdio:['inherit','pipe','inherit'],encoding:'utf8',env:process.env});
  if(result.error)error(result.error.message);
  if(result.stdout)printLifecycle(result.stdout,command,json);
  process.exit(result.status??2);
}
let publicConfig;
try{publicConfig=JSON.parse(fs.readFileSync(configFile,'utf8'));}
catch(e){error(e.code==='ENOENT'?`no configuration at ${configFile}; run redue init from the project root, or use --config FILE`:`cannot read ${configFile}: ${e.message}`);}
if(publicConfig.schema!==1)error('config schema must be 1');
if(!Array.isArray(publicConfig.checks)||!publicConfig.checks.length)
  error('config needs at least one explicitly defined check');
for(const key of Object.keys(publicConfig))
  if(!['schema','root','checks','packageManager'].includes(key))error(`unsupported config field ${key}`);
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
function token(value){
  if(value==='@node')return process.execPath;
  if(value==='@project')return root;
  if(value==='@typescript-compiler:.'){
    try{return directCompiler(root,{verify:false}).entry;}catch(e){error(`direct compiler unavailable: ${e.code||e.message}`);}
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
function argv(values,label){
  if(!Array.isArray(values)||!values.length||values.some(v=>typeof v!=='string'||!v))
    error(`${label} must be nonempty exact argv`);
  return values.map(token);
}
const categories=['source','generated','installedDependencies','environment','toolchain','runtime',
  'probeContinuity'];
const checks=publicConfig.checks.map(check=>{
  const allowed=['name','command','cwd','inputs','generatedInputs','installedInputs',
    'allowedExternalRoots','probes','environment','coverage','coverageReview','coverageReasons',
    'script','kind','qualification','workspace'];
  for(const key of Object.keys(check))if(!allowed.includes(key))
    error(`unsupported check field ${check.name}.${key}`);
  for(const category of categories)if(check.coverage?.[category]&&
    typeof check.coverageReview?.[category]!=='string')
    error(`${check.name}: reviewed coverage ${category} needs a rationale`);
  const npmDirect=check.qualification===directQualification;
  const pnpmTypecheck=check.qualification==='pnpm-tsc-v1';
  if(check.script&&check.command&&!pnpmTypecheck&&!npmDirect)
    error(`${check.name}: choose script or command, not both`);
  const manager=publicConfig.packageManager;
  if(check.script&&!['npm','yarn','pnpm'].includes(manager))
    error(`${check.name}: script checks need supported npm, Yarn or pnpm packageManager`);
  const scriptCommand=check.script&&!check.command?
    [`@which:${manager}`,'run',check.script]:null;
  const npmAutomatic=check.qualification==='typescript-noemit-v1';
  const yarnWorkspace=check.qualification==='yarn-workspace-tsc-v1';
  if(check.qualification&&!npmAutomatic&&!npmDirect&&!yarnWorkspace&&!pnpmTypecheck)
    error(`${check.name}: unknown qualification contract`);
  if(npmDirect&&(manager!=='npm'||!check.script||check.cwd&&check.cwd!=='.'||
    JSON.stringify(check.command)!==JSON.stringify(['@node','@typescript-compiler:.','--noEmit'])))
    error(`${check.name}: direct recipe requires its explicit local compiler command`);
  if(npmAutomatic&&(manager!=='npm'||check.cwd&&check.cwd!=='.'))
    error(`${check.name}: automatic TypeScript qualification currently needs root npm script`);
  if(yarnWorkspace&&(manager!=='yarn'||!check.workspace||check.cwd&&check.cwd!=='.'||
    check.command?.length!==5||check.command[0]!=='@which:yarn'||
    check.command[1]!=='workspace'||check.command[2]!==check.workspace||
    check.command[3]!=='run'))
    error(`${check.name}: Yarn workspace qualification needs its discovered workspace command`);
  if(pnpmTypecheck&&(manager!=='pnpm'||!check.script||!check.command||
    check.command[0]!=='@node'||
    check.command[1]!==`@typescript-bin:${check.cwd||'.'}`||
    check.workspace&&check.cwd==='.'||
    !check.command.slice(2).every(value=>typeof value==='string'&&value)))
    error(`${check.name}: pnpm qualification needs its discovered standalone TypeScript command`);
  const reason=check.kind==='test'?'test runtime, transforms and cache inputs need review':
    check.kind==='lint'?'lint plugins, config and resolver inputs need review':
    check.kind==='build'?'build environment and generated inputs need review':
    'check inputs need review';
  const autoProbes=npmDirect?[['@node','@vstate/direct-typescript-probe','@project',check.script]]:npmAutomatic?[['@node','@vstate/typescript-contract-probe',
    '@project',check.script,'@which:npm']]:yarnWorkspace?
    [['@node','@vstate/yarn-workspace-typecheck-probe','@project',
      check.workspace,check.command[4],'@which:yarn']]:pnpmTypecheck?
    [['@node','@vstate/pnpm-typecheck-probe','@project',
      check.workspace||'.',check.script]]:[];
  const windowsContext=process.platform==='win32'?
    ['ComSpec','COMSPEC','PATHEXT','USERPROFILE']:[];
  const autoEnvironment=npmDirect?directEnvironment:npmAutomatic?{variables:['NODE_OPTIONS','NODE_PATH','CI','HOME',
    'NODE_ENV','BASH_ENV','ENV',...windowsContext],prefixes:['npm_config_','DYLD_','TSGO_'],
    pathExecutables:['node','npm'],executableIdentity:true}:yarnWorkspace?
    {variables:['NODE_OPTIONS','NODE_PATH','CI','HOME','NODE_ENV','BASH_ENV','ENV',...windowsContext],
      prefixes:['YARN_','COREPACK_','npm_config_','DYLD_','TSGO_'],
      pathExecutables:['node','yarn'],executableIdentity:true}:pnpmTypecheck?
    {variables:['NODE_OPTIONS','NODE_PATH','CI','HOME','NODE_ENV','BASH_ENV','ENV',...windowsContext],
      prefixes:['PNPM_','COREPACK_','npm_config_','DYLD_','TSGO_'],
      pathExecutables:['node'],executableIdentity:true}:{};
  return {name:check.name,command:argv(scriptCommand||check.command,`${check.name}.command`),
    cwd:check.cwd,inputs:check.inputs||[],generatedInputs:check.generatedInputs||[],
    installedInputs:check.installedInputs||(
      npmAutomatic||npmDirect?['node_modules/**']:[]),
    allowedExternalRoots:check.allowedExternalRoots||[],
    probes:[...(check.probes||[]),...autoProbes]
      .map((p,i)=>argv(p,`${check.name}.probes[${i}]`)),
    environment:check.environment||autoEnvironment,coverage:check.coverage||{},
    coverageReview:check.coverageReview||{},
    coverageReasons:check.coverageReasons||Object.fromEntries(
      categories.map(category=>[category,reason])),
    qualification:check.qualification||null,script:check.script||null,
    ...(npmAutomatic?{qualificationInterpretation:'npm-launcher-withheld@1'}:{}),
    ...(npmDirect?{qualificationInterpretation:directInterpretation}:{}),
    workspace:check.workspace||null,kind:check.kind||null};
});
const runtime={schema:1,provider:'declared-project@1',root,state,checks};
try{assertOwnedStatePlacement(runtime);}catch(e){error(e.message);}
const serialized=JSON.stringify(runtime,null,2)+'\n';
const maintenance=command==='stop'||command==='remove-state';
if(maintenance&&!fs.existsSync(runtimeFile)){
  console.log(`No REDUE state exists for ${configFile}.`);
  process.exit(0);
}
if(!maintenance)fs.mkdirSync(state,{recursive:true,mode:0o700});
if(!maintenance&&fs.existsSync(runtimeFile)){
  const previous=fs.readFileSync(runtimeFile,'utf8');
  if(previous!==serialized){
    const pidFile=path.join(state,'observer.lock','pid');
    if(fs.existsSync(pidFile)){
      const pid=Number(fs.readFileSync(pidFile));
      if(processAlive(pid))error('config changed while observer is running; stop it before restarting with the new plan');
    }
    fs.writeFileSync(runtimeFile,serialized,{mode:0o600});
  }
}else if(!maintenance)fs.writeFileSync(runtimeFile,serialized,{flag:'wx',mode:0o600});

if(command==='status'&&!sync){
  const value=readCachedStatus(state,publicConfig.checks);
  console.log(json?JSON.stringify(value):renderStatus(value,{short}));
  process.exit(0);
}

const details=command==='detail'||command==='explain';
const internal=command==='remove-state'?'uninstall':
  details?'sync':command==='status'&&sync?'sync':command;
if(command==='run'){
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
}
const result=spawnSync(process.execPath,[engine,runtimeFile,internal,...(check?[check]:[])],
  {stdio:['inherit','pipe','inherit'],
    encoding:'utf8',env:process.env});
if(result.error)error(result.error.message);
if(result.stdout){
  if(['status','detail','explain'].includes(command)){
    let value;try{value=JSON.parse(result.stdout);}catch{error('status response could not be read; applicability is unknown');}
    if(details&&check)value={...value,checks:value.checks.filter(row=>row.name===check)};
    if(json)console.log(JSON.stringify(value));
    else console.log(details?renderExplain(value,check):renderStatus(value,{short}));
  }else printLifecycle(result.stdout,command,json);
}
process.exit(result.status??1);
