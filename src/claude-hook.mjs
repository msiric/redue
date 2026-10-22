// Claude Code PreToolUse hook: skip an exact typecheck or test rerun when REDUE
// reports CURRENT/PASS with reuse_eligible on the current inputs. When the check is not
// CURRENT, the command becomes `redue run <check>` so the run is recorded. Every
// other outcome, including errors and timeouts, allows the command unchanged.
// The same command handles SessionStart: it starts the project's observer.
// Never exit 2: Claude Code treats exit 2 as a block.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {projectState} from './project-location.mjs';
import {realObservedPath} from './path-identity.mjs';
import {processAlive} from './process-liveness.mjs';

export const hookCommand='redue agent hook claude';
// No shell metacharacters; `@` starts scoped package names.
const safe=/^[A-Za-z0-9_./:=,+@-]+$/;
const typecheck=check=>check?.kind==='typecheck'||check?.name==='typecheck';
// A direct test check: its command is the runner and the script's arguments.
const tests=check=>check?.qualification==='npm-tests-direct-v1'&&Array.isArray(check.command)&&
  /^@test-runner:(?:vitest|jest)$/.test(check.command[1]||'');
export const checkKind=check=>tests(check)?'test':'typecheck';

export const defaultConfig='redue.config.json';
// The `redue` prefix for a config beside the project root; null when the name
// would need shell quoting.
export const redueFor=(configFile=defaultConfig)=>configFile===defaultConfig?'redue':
  safe.test(configFile)?`redue --config ${configFile}`:null;

// Package-manager commands that a script of the same name would not reach.
const builtins={pnpm:new Set(['add','audit','bin','config','create','dedupe','deploy','dlx','doctor','env','exec','fetch',
  'i','import','init','install','link','list','ln','ls','outdated','pack','patch','prune','publish','rebuild','recursive',
  'remove','rm','root','run','self-update','server','setup','store','uninstall','unlink','up','update','why','x']),
  // Yarn 4 and Yarn 1 together.
  yarn:new Set(['access','add','audit','autoclean','bin','cache','check','config','constraints','create','dedupe','dir','dlx',
  'exec','explain','generate-lock-entry','global','help','import','info','init','install','licenses','link','list','login',
  'logout','node','npm','outdated','owner','pack','patch','plugin','policies','publish','rebuild','remove','run','set',
  'stage','tag','team','unlink','unplug','up','upgrade','upgrade-interactive','version','versions','why','workspace','workspaces'])};
// A package script run by the project's package manager, in the package's directory.
function scriptForms(pm,script){
  if(typeof script!=='string'||!safe.test(script))return [];
  if(pm==='npm')return [`npm run ${script}`,...(script==='test'?['npm test']:[])];
  if(pm==='pnpm'||pm==='yarn')return [...(builtins[pm].has(script)?[]:[`${pm} ${script}`]),`${pm} run ${script}`];
  return [];
}
// A workspace package's script, run from the project root.
function workspaceForms(pm,name,script){
  if(typeof name!=='string'||!safe.test(name)||typeof script!=='string'||!safe.test(script))return [];
  if(pm==='pnpm')return ['--filter ','--filter=','-F '].flatMap(flag=>
    [...(builtins.pnpm.has(script)?[]:[`pnpm ${flag}${name} ${script}`]),`pnpm ${flag}${name} run ${script}`]);
  if(pm==='yarn')return [...(builtins.yarn.has(script)?[]:[`yarn workspace ${name} ${script}`]),`yarn workspace ${name} run ${script}`];
  if(pm==='npm')return [`npm run ${script} -w ${name}`,`npm run ${script} --workspace ${name}`,
    `npm run ${script} --workspace=${name}`,`npm -w ${name} run ${script}`];
  return [];
}
// The tool a check runs, as typed: `tsc ARGS` or the test runner's command.
function toolText(check){
  const command=check.command;
  if(!Array.isArray(command)||command[0]!=='@node')return null;
  const words=/^@typescript-(?:compiler|bin):/.test(command[1]||'')?['tsc',...command.slice(2)]:
    tests(check)?[command[1].slice('@test-runner:'.length),...command.slice(2)]:null;
  return words?.every(word=>typeof word==='string'&&safe.test(word))?words.join(' '):null;
}
// A bare `tsc` is rarely on PATH; a test runner's own text is what the script says.
const toolForms=(pm,text)=>!text?[]:[...(/^tsc(?: |$)/.test(text)?[]:[text]),`npx ${text}`,...(pm==='pnpm'?[`pnpm exec ${text}`]:[])];
// A workspace check's package: its `workspace`, or the package its generated
// `npm run S --workspace W`, `yarn workspace W run S` or `pnpm --filter W run S`
// command names; null for any other check.
function workspaceName(check){
  if(typeof check.workspace==='string')return check.workspace;
  const command=check.command,flag={'@which:npm':'--workspace','@which:yarn':'workspace','@which:pnpm':'--filter'}[command?.[0]];
  const at=flag&&Array.isArray(command)?command.indexOf(flag):-1;
  return at>0&&typeof command[at+1]==='string'?command[at+1]:null;
}
// Where a check runs: '.' for a root check, the package directory for a
// workspace check, or null. A workspace check's directory is its `cwd`, or the
// one directory its inputs name as `DIR/package.json` or `DIR/**` with
// `!DIR/node_modules/**`, as init writes them.
export function checkDir(check){
  if(!workspaceName(check))return check.cwd===undefined||check.cwd==='.'?'.':null;
  if(typeof check.cwd==='string'&&check.cwd!=='.')return check.cwd;
  const inputs=(check.inputs||[]).filter(value=>typeof value==='string');
  const dirs=new Set(inputs.flatMap(value=>{
    const manifest=/^([^!*]+)\/package\.json$/.exec(value)?.[1],tree=/^([^!*]+)\/\*\*$/.exec(value)?.[1];
    return manifest?[manifest]:tree&&inputs.includes(`!${tree}/node_modules/**`)?[tree]:[];
  }));
  return dirs.size===1?[...dirs][0]:null;
}
// The package script a check runs: its `script`, or the last word of a
// generated `pnpm --filter NAME run SCRIPT`-style command.
const checkScript=check=>typeof check.script==='string'?check.script:
  Array.isArray(check.command)&&/^@which:(?:npm|pnpm|yarn)$/.test(check.command[0])&&check.command.includes('run')?
    check.command[check.command.indexOf('run')+1]:null;

// Exact commands that rerun each configured typecheck or direct test check.
// `forms` work from the project root; `local` ones work in the check's own
// directory `dir`, after a `cd` into it. Names that would need shell quoting
// get no form, so the hook never fires for them.
export function hookForms(config,configFile=defaultConfig){
  const rows=[],redue=redueFor(configFile),pm=config?.packageManager;
  for(const check of config?.checks||[]){
    if(!(typecheck(check)||tests(check))||typeof check.name!=='string'||!safe.test(check.name))continue;
    const forms=redue?[`${redue} run ${check.name}`]:[],local=[],dir=checkDir(check),script=checkScript(check);
    if(dir==='.'){
      forms.push(...scriptForms(pm,script),...toolForms(pm,toolText(check)));
      if(!tests(check)&&Array.isArray(check.command)&&check.command.length&&
        check.command.every(v=>typeof v==='string'&&safe.test(v)&&!v.startsWith('@')))
        forms.push(check.command.join(' '));
    }else if(dir!==null&&safe.test(dir)){
      forms.push(...workspaceForms(pm,workspaceName(check),script));
      local.push(...scriptForms(pm,script),...(check.cwd===dir?toolForms(pm,toolText(check)):[]));
    }
    if(forms.length||local.length)rows.push({check:check.name,kind:checkKind(check),dir,
      forms:[...new Set(forms)],local:[...new Set(local)]});
  }
  return rows;
}

// A turbo or `pnpm -r` command that runs one task in every workspace package:
// {tool, task}. No filters and no nx: both can add packages or tasks that only
// a fuller model of the tool would see. `pnpm turbo` is left out because a root
// script named turbo would run instead.
const turboPrefix='(?:npx |pnpm exec )?',task='([A-Za-z0-9_:.-]+)';
const fanouts=[['turbo',new RegExp(`^${turboPrefix}turbo(?: run)? ${task}$`)],
  ['pnpm',new RegExp(`^pnpm (?:-r|--recursive)(?: run)? ${task}$`)]];
export function fanout(text){
  for(const [tool,pattern] of fanouts){const match=pattern.exec(text);
    if(match)return {tool,task:match[1]};}
  return null;
}
// Bash `if` rules for fan-out commands of a task some workspace check runs,
// and for root scripts that run one; other turbo or nx commands never start the hook.
export function fanoutRules(config,scripts={}){
  const tasks=new Set((config?.checks||[]).filter(check=>(typecheck(check)||tests(check))&&typeof check.name==='string'&&
    ![null,'.'].includes(checkDir(check))).map(checkScript).filter(task=>typeof task==='string'&&/^[A-Za-z0-9_:.-]+$/.test(task)));
  const rules=[];
  for(const task of tasks){
    for(const prefix of ['','npx ','pnpm exec '])rules.push(`${prefix}turbo run ${task}`,`${prefix}turbo ${task}`);
    if(config.packageManager==='pnpm')rules.push(`pnpm -r ${task}`,`pnpm -r run ${task}`,`pnpm --recursive ${task}`,`pnpm --recursive run ${task}`);
  }
  for(const [name,text] of Object.entries(scripts||{})){
    const fan=typeof text==='string'&&!scripts['pre'+name]&&!scripts['post'+name]?fanout(text.trim()):null;
    if(fan&&tasks.has(fan.task))rules.push(...scriptForms(config.packageManager,name));
  }
  return rules;
}
// The checks a fan-out runs: one configured check for every workspace package
// with the task's script, or null when any package has none, or when the
// tool may run more: another task first (turbo `dependsOn` other than ^TASK,
// `with`, package-scoped keys, package turbo.json), a task turbo does not
// define, or pnpm's workspace root.
export async function fanoutChecks(fan,config,projectRoot){
  const {workspacePackages}=await import('./node-onboarding.mjs');
  const packages=workspacePackages(projectRoot).filter(item=>typeof item.scripts[fan.task]==='string');
  if(!packages.length)return null;
  const text=file=>{try{return fs.readFileSync(path.join(projectRoot,file),'utf8');}catch(e){return e.code==='ENOENT'?undefined:null;}};
  if(fan.tool==='turbo'){
    let tasks;try{const turbo=JSON.parse(text('turbo.json'));tasks=turbo?.tasks??turbo?.pipeline;}catch{return null;}
    const own=tasks?.[fan.task];
    if(!own||typeof own!=='object'||own.with!==undefined||
      own.dependsOn!==undefined&&!(Array.isArray(own.dependsOn)&&own.dependsOn.every(item=>item===`^${fan.task}`))||
      Object.keys(tasks).some(key=>key.endsWith(`#${fan.task}`))||
      packages.some(item=>text(`${item.dir}/turbo.json`)!==undefined||text(`${item.dir}/turbo.jsonc`)!==undefined))return null;
  }
  if(fan.tool==='pnpm'&&(config.packageManager!=='pnpm'||
    ['.npmrc','pnpm-workspace.yaml'].some(file=>{const value=text(file);return value===null||/include-?workspace-?root/i.test(value??'');})))
    return null;
  const names=[];
  for(const item of packages){
    const check=config.checks.find(c=>(typecheck(c)||tests(c))&&typeof c.name==='string'&&
      workspaceName(c)===item.name&&checkScript(c)===fan.task&&checkDir(c)===item.dir);
    if(!check)return null;
    names.push(check.name);
  }
  return names;
}

// Accept only an optional trailing `2>&1`, then an optional `| tail|head -n N`
// or `-N`, then optionally `;` or `&&` and the rest of the command. A form has
// no shell metacharacters, so the first separator after it ends it. Newlines
// separate commands, so they never match. The rest keeps its own spacing.
function split(command){
  if(typeof command!=='string'||/[\r\n]/.test(command))return null;
  const [,base,suffix,rest=null]=command.trim()
    .match(/^(.*?)((?:[ \t]+2>&1)?(?:[ \t]+\|[ \t]+(?:tail|head)[ \t]+(?:-n[ \t]+\d+|-\d+))?)(?:[ \t]*(?:;|&&)[ \t]*([^\s;&|].*))?$/);
  const one=text=>text.replace(/[ \t]+/g,' ');
  return {base:one(base),suffix:one(suffix),rest};
}
// {check, rest}, or {fanout, rest} for a turbo/nx/`pnpm -r` command or a root
// script that runs one; null when nothing matches. `dir` is where the command
// runs, relative to the project root.
function matched(command,config,configFile,dir='.',scripts={}){
  const parts=split(command);
  if(!parts)return null;
  if(dir==='.'){
    // A root script that runs a fan-out is that fan-out, unless pre/post scripts
    // run around it: then it matches nothing.
    for(const [name,text] of Object.entries(scripts||{}))
      if(typeof text==='string'&&scriptForms(config.packageManager,name).includes(parts.base)&&fanout(text.trim()))
        return scripts['pre'+name]||scripts['post'+name]?null:{fanout:fanout(text.trim()),rest:parts.rest};
    if(fanout(parts.base))return {fanout:fanout(parts.base),rest:parts.rest};
  }
  const check=hookForms(config,configFile).find(row=>dir==='.'?row.forms.includes(parts.base):
    row.dir===dir&&row.local.includes(parts.base))?.check;
  return check?{check,rest:parts.rest}:null;
}
export function matchCheck(command,config,configFile,dir,scripts){return matched(command,config,configFile,dir,scripts)?.check||null;}
// The same check through REDUE, keeping the output suffix; null if it already
// is, or if more commands follow it.
export function recordedCommand(command,name,configFile=defaultConfig){
  const parts=split(command),redue=redueFor(configFile);
  if(!parts||parts.rest!==null||!safe.test(name)||!redue)return null;
  const run=`${redue} run ${name}`;
  return parts.base===run?null:run+parts.suffix;
}

// A leading `cd DIR;` or `cd DIR &&`, which agents often add before a check:
// {prefix, command, dir} with the rest of the command and DIR relative to the
// project root ('.' for the root or no prefix), or null when DIR is outside
// the project or missing. DIR may be quoted; it may not use variables, a leading
// `~` or escapes. Inside double quotes a backslash before anything but
// $ ` " \ is literal, so a quoted Windows path matches; unquoted it is an escape.
const cdPrefix=/^[ \t]*cd[ \t]+(?:"((?:[^"$`\\]|\\(?![$`"\\\n]))*)"|'([^']*)'|((?!~)[^\s;&|'"$`\\]+))[ \t]*(?:;|&&)[ \t]*/;
export function enteredDir(command,cwd,projectRoot){
  const prefix=typeof command==='string'?cdPrefix.exec(command):null;
  if(!prefix)return {prefix:'',command,dir:'.'};
  let relative;
  try{relative=path.relative(projectRoot,realObservedPath(path.resolve(cwd,prefix[1]??prefix[2]??prefix[3])));}catch{return null;}
  if(relative.split(path.sep)[0]==='..'||path.isAbsolute(relative))return null;
  return {prefix:prefix[0],command:command.slice(prefix[0].length),dir:relative?relative.split(path.sep).join('/'):'.'};
}

// The fan-out's skip message when every check it runs is CURRENT/PASS, else null.
export function fanoutVerdict(status,names,rest=null){
  if(!names.length||!names.every(name=>verdict(status,name)))return null;
  return `REDUE: all ${names.length} checks this command runs (${names.join(', ')}) passed on these exact inputs; `+
    'rerun skipped. This counts as a pass for the current files; no status check is needed. '+
    'To run it anyway, prefix the command with REDUE_FORCE=1.'+
    (rest===null?'':` Nothing else in the command ran either; run the rest on its own: ${rest}`);
}
export function verdict(status,name,rest=null){
  const row=status?.schema===1&&status.observation?.healthy===true&&Array.isArray(status.checks)?
    status.checks.find(item=>item?.name===name):null;
  const runId=row?.invocation?.runId;
  if(!row||row.freshness!=='CURRENT'||row.result!=='PASS'||row.reuse_eligible!==true||
    typeof runId!=='string'||!/^[0-9a-f-]{36}$/.test(runId))return null;
  return `REDUE: check ${JSON.stringify(name)} passed on these exact inputs (run ${runId}); `+
    'rerun skipped. This counts as a pass for the current files; no status check is needed. '+
    'To run it anyway, prefix the command with REDUE_FORCE=1.'+
    (rest===null?'':` Nothing else in the command ran either; run the rest on its own: ${rest}`);
}

function synchronizedStatus(entry,config,root,timeout){
  return new Promise(resolve=>{
    let child,out='',done=false;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);process.off('SIGTERM',stop);
      if(child?.pid&&child.exitCode===null)try{process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL');}catch{}
      resolve(value);};
    const timer=setTimeout(()=>finish(null),timeout);
    // Claude Code ends a hook that outlives its own timeout; end the status call with it.
    const stop=()=>finish(null);process.once('SIGTERM',stop);
    // Its own process group on POSIX, so a timeout also ends the engine it starts.
    try{child=spawn(process.execPath,[entry,'--config',config,'status','--sync','--json'],
      {cwd:root,stdio:['ignore','pipe','ignore'],env:process.env,windowsHide:true,detached:process.platform!=='win32'});}
    catch{return finish(null);}
    child.on('error',()=>finish(null));
    child.stdout.on('data',chunk=>{out+=chunk;if(out.length>4*1024*1024)finish(null);});
    child.on('close',code=>{if(code!==0)return finish(null);
      try{finish(JSON.parse(out));}catch{finish(null);}});
  });
}

// Waiting for status never costs more than half the check: half the last
// completed run's duration, at most 10 s. With no completed run, 2 s.
export function statusTimeout(status,name){
  const run=Array.isArray(status?.checks)?status.checks.find(row=>row?.name===name)?.invocation:null;
  return run?.status==='exited'&&Number.isFinite(run.durationMs)&&run.durationMs>=0?
    Math.min(run.durationMs/2,10000):2000;
}
// From the observer's last published status, which is small, not the receipts.
export function lastRunTimeout(config,parsed,name){
  try{const root=realObservedPath(path.resolve(path.dirname(config),parsed.root||'.'));
    return statusTimeout(JSON.parse(fs.readFileSync(path.join(projectState(root,config),'status.json'),'utf8')),name);}
  catch{return 2000;}
}

// The project set up in the session's directory: its setup record, the config
// beside it and the project root. null when there is none; throws on bad files.
function hookProject(root){
  if(typeof root!=='string'||!path.isAbsolute(root))return null;
  const record=JSON.parse(fs.readFileSync(path.join(root,'.redue','agents','claude.json'),'utf8'));
  if(record?.schema!==1||record.host!=='claude'||typeof record.config!=='string'||
    !/^[^/\\]+\.json$/.test(record.config))return null;
  const config=path.join(root,record.config);
  const parsed=JSON.parse(fs.readFileSync(config,'utf8'));
  return {record,config,parsed,projectRoot:realObservedPath(path.resolve(path.dirname(config),parsed.root||'.'))};
}

// SessionStart: start the observer when none is running, so the session's
// checks can be skipped or recorded without a manual `redue start`. It
// launches `redue start` detached and returns at once, and prints nothing:
// SessionStart output becomes agent context. Returns what it did.
export function sessionStart(input,{entry}){
  const project=hookProject(input?.cwd);
  if(!project)return null;
  try{const pid=Number(fs.readFileSync(path.join(projectState(project.projectRoot,project.config),'observer.lock','pid'),'utf8'));
    if(Number.isSafeInteger(pid)&&pid>0&&processAlive(pid))return 'running';}catch{}
  const child=spawn(process.execPath,[entry,'--config',project.config,'start'],
    {cwd:input.cwd,detached:true,stdio:'ignore',windowsHide:true,env:process.env});
  child.on('error',()=>{});child.unref();
  return 'started';
}

// Returns the hook's stdout object, or null to allow the command.
export async function claudeHook(input,{entry,timeout}){
  if(input?.tool_name!=='Bash')return null;
  const command=input.tool_input?.command,root=input.cwd;
  if(typeof command!=='string'||/^\s*REDUE_FORCE=1(?:\s|$)/.test(command))return null;
  const project=hookProject(root);
  if(!project)return null;
  const {record,config,parsed}=project;
  const entered=enteredDir(command,root,project.projectRoot);
  if(!entered)return null;
  let scripts={};
  if(entered.dir==='.')try{scripts=JSON.parse(fs.readFileSync(path.join(project.projectRoot,'package.json'),'utf8')).scripts||{};}catch{}
  const match=matched(entered.command,parsed,record.config,entered.dir,scripts);
  if(!match)return null;
  // turbo, nx and `pnpm -r` cache their own results: skip only when every
  // check the command runs is CURRENT, and otherwise leave it alone.
  if(match.fanout){
    const names=await fanoutChecks(match.fanout,parsed,project.projectRoot);
    if(!names)return null;
    const status=await synchronizedStatus(entry,config,root,timeout??Math.max(...names.map(name=>lastRunTimeout(config,parsed,name)))),
      reason=fanoutVerdict(status,names,match.rest);
    return reason?{hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:reason}}:null;
  }
  const name=match.check,status=await synchronizedStatus(entry,config,root,timeout??lastRunTimeout(config,parsed,name)),
    reason=verdict(status,name,match.rest);
  if(reason)return {hookSpecificOutput:{hookEventName:'PreToolUse',
    permissionDecision:'deny',permissionDecisionReason:reason}};
  // Rewrite only on a healthy answer for this check: without an observer,
  // `redue run` cannot record, so the command stays as Claude sent it. A chain
  // stays too: the rewrite returns "allow", which would also skip the prompt
  // for the rest of the chain.
  const rewritten=status?.schema===1&&status.observation?.healthy===true&&Array.isArray(status.checks)&&
    status.checks.some(item=>item?.name===name)?recordedCommand(entered.command,name,
      !entered.prefix?record.config:path.relative(path.join(project.projectRoot,entered.dir),config).split(path.sep).join('/')):null;
  // updatedInput replaces the whole tool input. Deny and ask rules still apply
  // to the rewritten command; "allow" skips only the prompt.
  return rewritten?{hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'allow',
    permissionDecisionReason:`REDUE: check ${JSON.stringify(name)} is not CURRENT; running it through redue run so the result is recorded.`,
    updatedInput:{...input.tool_input,command:entered.prefix+rewritten}}}:null;
}

export async function runClaudeHook(entry){
  try{
    let text='';process.stdin.setEncoding('utf8');
    for await(const chunk of process.stdin){text+=chunk;if(text.length>1024*1024)return;}
    const input=JSON.parse(text);
    if(input?.hook_event_name==='SessionStart'){sessionStart(input,{entry});return;}
    const output=await claudeHook(input,{entry});
    if(output)await new Promise(resolve=>process.stdout.write(JSON.stringify(output)+'\n',resolve));
  }catch{}
}
