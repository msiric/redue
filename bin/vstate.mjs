#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const productRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const engine=path.join(productRoot,'src','cli.mjs');
const help=`vstate 0.1.0-alpha
Usage: vstate [--config FILE] [--state-dir DIR] COMMAND [OPTIONS]

Commands:
  init                 Create a minimal explicit config, or validate an existing one
  start                Start the local observer
  stop                 Stop this observer
  status [--json]      Read conservative cached status
  status --sync        Reconcile inputs and caller context before answering
  detail [--json]      Explain synchronized check applicability
  run CHECK            Execute one configured check and record its outcome
  remove-state        Stop and remove only this configuration's owned local state

No checks run in the background. Direct commands outside vstate create no receipts.`;

function error(message){console.error(`vstate: ${message}`);process.exit(2);}
const args=process.argv.slice(2);
if(args.includes('--help')||args.includes('-h')||!args.length){console.log(help);process.exit(0);}
let configFile=path.resolve('vstate.config.json'),stateOverride=null;
for(let i=0;i<args.length;){
  if(args[i]==='--config'||args[i]==='--state-dir'){
    const flag=args[i],value=args[i+1];if(!value)error(`${flag} requires a path`);
    if(flag==='--config')configFile=path.resolve(value);else stateOverride=path.resolve(value);
    args.splice(i,2);
  }else i++;
}
const command=args.shift();
if(!['init','start','stop','status','detail','run','remove-state'].includes(command))
  error(`unknown command ${command||'<none>'}; use --help`);
const json=args.includes('--json');
const sync=args.includes('--sync');
const check=command==='run'?args.shift():null;
if(command==='run'&&!check)error('run requires a check name');
if(args.some(value=>!['--json','--sync'].includes(value)))error('unknown option; use --help');
if(sync&&!['status','detail'].includes(command))error('--sync is for status or detail');

if(command==='init'&&!fs.existsSync(configFile)){
  const template={schema:1,checks:[]};
  fs.writeFileSync(configFile,JSON.stringify(template,null,2)+'\n',{flag:'wx'});
  console.log(`Created ${configFile}. Add explicit checks and reviewed inputs before start.`);
  process.exit(0);
}
let publicConfig;
try{publicConfig=JSON.parse(fs.readFileSync(configFile,'utf8'));}
catch(e){error(`cannot read ${configFile}: ${e.message}`);}
if(publicConfig.schema!==1)error('config schema must be 1');
if(!Array.isArray(publicConfig.checks)||!publicConfig.checks.length)
  error('config needs at least one explicitly defined check');
for(const key of Object.keys(publicConfig))
  if(!['schema','root','checks'].includes(key))error(`unsupported config field ${key}`);
const root=fs.realpathSync(path.resolve(path.dirname(configFile),publicConfig.root||'.'));
const state=stateOverride||path.join(os.homedir(),'Library','Application Support',
  'vstate',`vstate-${createHash('sha256').update(root+'\0'+configFile).digest('hex').slice(0,16)}`);
const runtimeFile=path.join(state,'project-runtime-v1.json');
function which(name){
  for(const folder of (process.env.PATH||'').split(path.delimiter)){
    const candidate=path.join(folder||process.cwd(),name);
    try{fs.accessSync(candidate,fs.constants.X_OK);return fs.realpathSync(candidate);}catch{}
  }
  error(`cannot resolve executable ${name} on PATH`);
}
function token(value){
  if(value==='@node')return process.execPath;
  if(value==='@project')return root;
  if(value==='@vstate/npm-typecheck-probe')return path.join(productRoot,'src','npm-typecheck-probe.mjs');
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
    'allowedExternalRoots','probes','environment','coverage','coverageReview','coverageReasons'];
  for(const key of Object.keys(check))if(!allowed.includes(key))
    error(`unsupported check field ${check.name}.${key}`);
  for(const category of categories)if(check.coverage?.[category]&&
    typeof check.coverageReview?.[category]!=='string')
    error(`${check.name}: reviewed coverage ${category} needs a rationale`);
  return {name:check.name,command:argv(check.command,`${check.name}.command`),
    cwd:check.cwd,inputs:check.inputs||[],generatedInputs:check.generatedInputs||[],
    installedInputs:check.installedInputs||[],
    allowedExternalRoots:check.allowedExternalRoots||[],
    probes:(check.probes||[]).map((p,i)=>argv(p,`${check.name}.probes[${i}]`)),
    environment:check.environment||{},coverage:check.coverage||{},
    coverageReview:check.coverageReview||{},coverageReasons:check.coverageReasons||{}};
});
const runtime={schema:1,provider:'declared-project@1',root,state,checks};
const serialized=JSON.stringify(runtime,null,2)+'\n';
const maintenance=command==='stop'||command==='remove-state';
if(maintenance&&!fs.existsSync(runtimeFile)){
  console.log(`No vstate state exists for ${configFile}.`);
  process.exit(0);
}
if(!maintenance)fs.mkdirSync(state,{recursive:true,mode:0o700});
if(!maintenance&&fs.existsSync(runtimeFile)){
  const previous=fs.readFileSync(runtimeFile,'utf8');
  if(previous!==serialized){
    const pidFile=path.join(state,'observer.lock','pid');
    if(fs.existsSync(pidFile)){
      const pid=Number(fs.readFileSync(pidFile));
      try{process.kill(pid,0);error('config changed while observer is running; stop it before restarting with the new plan');}
      catch(e){if(e.code!=='ESRCH')throw e;}
    }
    fs.writeFileSync(runtimeFile,serialized,{mode:0o600});
  }
}else if(!maintenance)fs.writeFileSync(runtimeFile,serialized,{flag:'wx',mode:0o600});

const internal=command==='remove-state'?'uninstall':
  command==='status'&&sync?'sync':command;
const result=spawnSync(process.execPath,[engine,runtimeFile,internal,...(check?[check]:[])],
  {stdio:['inherit',json||command==='status'||command==='detail'?'pipe':'inherit','inherit'],
    encoding:'utf8',env:process.env});
if(result.error)error(result.error.message);
if(result.stdout){
  if(json||!['status','detail'].includes(command))process.stdout.write(result.stdout);
  else if(command==='status'){
    try {const value=JSON.parse(result.stdout);
      console.log(`${value.state.toUpperCase()} — ${value.current} current, ${value.stale} stale, ${value.failed} failed, ${value.unverified} unverified`);
      if(!value.observation?.healthy)console.log(`Observation unavailable: ${value.observation?.reason}`);
    }catch{process.stdout.write(result.stdout);}
  } else process.stdout.write(result.stdout);
}
process.exit(result.status??1);
