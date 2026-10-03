#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {discoverNodeProject} from '../src/node-onboarding.mjs';
import {processAlive} from '../src/process-liveness.mjs';
import {samePath,withinPath,realObservedPath} from '../src/path-identity.mjs';
import {stateIdentity,userStateBase} from '../src/platform-state.mjs';
import {findExecutable} from '../src/executable-lookup.mjs';

const productRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const engine=path.join(productRoot,'src','cli.mjs');
const help=`REDUE 0.1.0-alpha
Usage: redue [--config FILE] [--state-dir DIR] COMMAND [OPTIONS]

Commands:
  init [--dry-run] [--workspace NAME] [--check KIND]
                       Discover existing scripts; optionally select one workspace/check
  start                Start the local observer
  stop                 Stop this observer
  status [--json]      Read conservative cached status
  status --sync        Reconcile inputs and caller context before answering
  detail [--json]      Explain synchronized check applicability
  explain [--json]     Alias for detail
  run CHECK            Execute one configured check and record its outcome
  remove-state        Stop and remove only this configuration's owned local state

No checks run in the background. Direct commands outside redue create no receipts.`;

function error(message){console.error(`redue: ${message}`);process.exit(2);}
const args=process.argv.slice(2);
if(args.includes('--help')||args.includes('-h')||!args.length){console.log(help);process.exit(0);}
const preferredConfig=path.resolve('redue.config.json');
const legacyConfig=path.resolve('vstate.config.json');
let configFile=fs.existsSync(preferredConfig)||!fs.existsSync(legacyConfig)?
  preferredConfig:legacyConfig,stateOverride=null;
for(let i=0;i<args.length;){
  if(args[i]==='--config'||args[i]==='--state-dir'){
    const flag=args[i],value=args[i+1];if(!value)error(`${flag} requires a path`);
    if(flag==='--config')configFile=path.resolve(value);else stateOverride=path.resolve(value);
    args.splice(i,2);
  }else i++;
}
const command=args.shift();
if(!['init','start','stop','status','detail','explain','run','remove-state'].includes(command))
  error(`unknown command ${command||'<none>'}; use --help`);
const json=args.includes('--json');
const sync=args.includes('--sync');
const dryRun=args.includes('--dry-run');
let workspaceSelection=null,checkSelection=null;
if(command==='init')for(let i=0;i<args.length;){
  if(args[i]==='--workspace'||args[i]==='--check'){
    const flag=args[i],value=args[i+1];if(!value||value.startsWith('--'))error(`${flag} requires a name`);
    if(flag==='--workspace')workspaceSelection=value;else checkSelection=value;
    args.splice(i,2);
  }else i++;
}
const check=command==='run'?args.shift():null;
if(command==='run'&&!check)error('run requires a check name');
if(args.some(value=>!['--json','--sync','--dry-run'].includes(value)))error('unknown option; use --help');
if(sync&&!['status','detail','explain'].includes(command))error('--sync is for status or detail');
if(dryRun&&command!=='init')error('--dry-run is for init');

if(command==='init'){
  let discovery;try{discovery=discoverNodeProject(process.cwd());}
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
    for(const row of summary.checks)
      console.log(`  ${row.name} (${row.script||row.command?.join(' ')}) — ${row.level}: ${row.reason}`);
    for(const row of summary.ambiguous)
      console.log(`  ${row.kind}: ambiguous scripts (${row.scripts.join(', ')}); choose one explicitly`);
    if(!summary.checks.length)console.log('No useful existing verification scripts found.');
    console.log(configured?`Existing ${configFile} left unchanged.`:
      dryRun?`Preview only; ${configFile} was not written.`:
        `Writing ${configFile}; inspect it before running checks.`);
  }
  if(willWrite){
    if(!samePath(realObservedPath(path.dirname(configFile)),discovery.root))
      error('init writes only at the repository root; use --config there or --dry-run');
    fs.writeFileSync(configFile,JSON.stringify(discovery.config,null,2)+'\n',{flag:'wx'});
    if(!json)console.log(`Created ${configFile}. No checks were executed.`);
  } else if(unsupported&&!json)console.log('No config written for unsupported package manager.');
  if(json)console.log(JSON.stringify({...summary,proposed_config:discovery.config}));
  process.exit(0);
}
let publicConfig;
try{publicConfig=JSON.parse(fs.readFileSync(configFile,'utf8'));}
catch(e){error(`cannot read ${configFile}: ${e.message}`);}
if(publicConfig.schema!==1)error('config schema must be 1');
if(!Array.isArray(publicConfig.checks)||!publicConfig.checks.length)
  error('config needs at least one explicitly defined check');
for(const key of Object.keys(publicConfig))
  if(!['schema','root','checks','packageManager'].includes(key))error(`unsupported config field ${key}`);
const root=realObservedPath(path.resolve(path.dirname(configFile),publicConfig.root||'.'));
const stateBase=userStateBase(process.platform,process.env,os.homedir());
const state=stateOverride||path.join(stateBase,'vstate',
  `vstate-${createHash('sha256').update(stateIdentity(root)+'\0'+
    stateIdentity(configFile)).digest('hex').slice(0,16)}`);
const runtimeFile=path.join(state,'project-runtime-v1.json');
function which(name){
  const found=findExecutable(name);
  if(found)return found;
  error(`cannot resolve executable ${name} on PATH`);
}
function token(value){
  if(value==='@node')return process.execPath;
  if(value==='@project')return root;
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
  const pnpmTypecheck=check.qualification==='pnpm-tsc-v1';
  if(check.script&&check.command&&!pnpmTypecheck)
    error(`${check.name}: choose script or command, not both`);
  const manager=publicConfig.packageManager;
  if(check.script&&!['npm','yarn','pnpm'].includes(manager))
    error(`${check.name}: script checks need supported npm, Yarn or pnpm packageManager`);
  const scriptCommand=check.script&&!check.command?
    [`@which:${manager}`,'run',check.script]:null;
  const npmAutomatic=check.qualification==='typescript-noemit-v1';
  const yarnWorkspace=check.qualification==='yarn-workspace-tsc-v1';
  if(check.qualification&&!npmAutomatic&&!yarnWorkspace&&!pnpmTypecheck)
    error(`${check.name}: unknown qualification contract`);
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
  const autoProbes=npmAutomatic?[['@node','@vstate/typescript-contract-probe',
    '@project',check.script,'@which:npm']]:yarnWorkspace?
    [['@node','@vstate/yarn-workspace-typecheck-probe','@project',
      check.workspace,check.command[4],'@which:yarn']]:pnpmTypecheck?
    [['@node','@vstate/pnpm-typecheck-probe','@project',
      check.workspace||'.',check.script]]:[];
  const windowsContext=process.platform==='win32'?
    ['ComSpec','COMSPEC','PATHEXT','USERPROFILE']:[];
  const autoEnvironment=npmAutomatic?{variables:['NODE_OPTIONS','NODE_PATH','CI','HOME',
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
      npmAutomatic?['node_modules/**']:[]),
    allowedExternalRoots:check.allowedExternalRoots||[],
    probes:[...(check.probes||[]),...autoProbes]
      .map((p,i)=>argv(p,`${check.name}.probes[${i}]`)),
    environment:check.environment||autoEnvironment,coverage:check.coverage||{},
    coverageReview:check.coverageReview||{},
    coverageReasons:check.coverageReasons||Object.fromEntries(
      categories.map(category=>[category,reason])),
    qualification:check.qualification||null,script:check.script||null,
    workspace:check.workspace||null,kind:check.kind||null};
});
const runtime={schema:1,provider:'declared-project@1',root,state,checks};
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

const details=command==='detail'||command==='explain';
const internal=command==='remove-state'?'uninstall':
  details&&json?'sync':details?'detail':command==='status'&&sync?'sync':command;
if(command==='run'){
  const child=spawn(process.execPath,[engine,runtimeFile,internal,check],
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
  {stdio:['inherit',json||command==='status'||details?'pipe':'inherit','inherit'],
    encoding:'utf8',env:process.env});
if(result.error)error(result.error.message);
if(result.stdout){
  if(json||!['status','detail','explain'].includes(command))process.stdout.write(result.stdout);
  else if(command==='status'){
    try {const value=JSON.parse(result.stdout);
      console.log(`${value.state.toUpperCase()} — ${value.current} current, ${value.stale} stale, ${value.failed} failed, ${value.unverified} unverified`);
      if(!value.observation?.healthy)console.log(`Observation unavailable: ${value.observation?.reason}`);
      for(const row of value.checks||[])if(row.freshness!=='CURRENT'||row.result==='FAIL')
        console.log(`  ${row.name}: ${row.freshness}${row.result?` / ${row.result}`:''} — ${row.reason}`);
      if((value.checks||[]).some(row=>row.freshness!=='CURRENT'))
        console.log('Use `redue detail` for every check; run a check with `redue run NAME`.');
    }catch{process.stdout.write(result.stdout);}
  } else {
    const lines=result.stdout.trimEnd().split('\n');
    for(const line of lines){
      const match=/^(.+): (CURRENT|STALE|UNVERIFIED)\/(PASS|FAIL|NO RESULT) — (.*)$/.exec(line);
      if(!match){console.log(line);continue;}
      const [,name,freshness,outcome,reason]=match;
      const label=outcome==='NO RESULT'?'not run':`${outcome} recorded`;
      console.log(`${name}: ${label}; ${freshness.toLowerCase()} — ${reason.replace(/^input coverage unresolved: /,'reuse not yet qualified: ')}`);
    }
  }
}
process.exit(result.status??1);
