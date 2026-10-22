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
import {realObservedPath,samePath} from './path-identity.mjs';
import {processAlive} from './process-liveness.mjs';

export const hookCommand='redue agent hook claude';
const safe=/^[A-Za-z0-9_./:=,+-]+$/;
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
// Exact commands that rerun each configured typecheck or direct test check.
// Names that would need shell quoting get no form, so the hook never fires for them.
export function hookForms(config,configFile=defaultConfig){
  const rows=[],redue=redueFor(configFile);
  for(const check of config?.checks||[]){
    if(!(typecheck(check)||tests(check))||typeof check.name!=='string'||!safe.test(check.name))continue;
    const forms=redue?[`${redue} run ${check.name}`]:[];
    // Other forms run from the project root, so they match only a root check.
    if(check.cwd!==undefined&&check.cwd!=='.'){if(forms.length)rows.push({check:check.name,forms});continue;}
    if(config.packageManager==='npm'&&typeof check.script==='string'&&safe.test(check.script))
      forms.push(`npm run ${check.script}`);
    if(check.qualification==='npm-typescript-direct-v1')forms.push('npx tsc --noEmit');
    if(!tests(check)&&Array.isArray(check.command)&&check.command.length&&
      check.command.every(v=>typeof v==='string'&&safe.test(v)&&!v.startsWith('@')))
      forms.push(check.command.join(' '));
    // The script's own text, which runs the same runner with the same arguments.
    if(tests(check)){
      if(check.script==='test'&&config.packageManager==='npm')forms.push('npm test');
      const text=[check.command[1].slice('@test-runner:'.length),...check.command.slice(2)];
      if(text.every(v=>typeof v==='string'&&safe.test(v)))forms.push(text.join(' '),`npx ${text.join(' ')}`);
    }
    if(forms.length)rows.push({check:check.name,kind:checkKind(check),forms:[...new Set(forms)]});
  }
  return rows;
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
function matched(command,config,configFile){
  const parts=split(command),check=parts&&hookForms(config,configFile).find(row=>row.forms.includes(parts.base))?.check;
  return check?{check,rest:parts.rest}:null;
}
export function matchCheck(command,config,configFile){return matched(command,config,configFile)?.check||null;}
// The same check through REDUE, keeping the output suffix; null if it already
// is, or if more commands follow it.
export function recordedCommand(command,name,configFile=defaultConfig){
  const parts=split(command),redue=redueFor(configFile);
  if(!parts||parts.rest!==null||!safe.test(name)||!redue)return null;
  const run=`${redue} run ${name}`;
  return parts.base===run?null:run+parts.suffix;
}

// A leading `cd DIR;` or `cd DIR &&` into the project root, which agents
// often add before a check: {prefix, command} with the rest of the command,
// the whole command when there is no such prefix, or null when it enters
// another directory. DIR may be quoted; it may not use variables, a leading
// `~` or escapes. Inside double quotes a backslash before anything but
// $ ` " \ is literal, so a quoted Windows path matches; unquoted it is an escape.
const cdPrefix=/^[ \t]*cd[ \t]+(?:"((?:[^"$`\\]|\\(?![$`"\\\n]))*)"|'([^']*)'|((?!~)[^\s;&|'"$`\\]+))[ \t]*(?:;|&&)[ \t]*/;
export function rootCd(command,cwd,projectRoot){
  const prefix=typeof command==='string'?cdPrefix.exec(command):null;
  if(!prefix)return {prefix:'',command};
  const dir=prefix[1]??prefix[2]??prefix[3];
  try{if(!samePath(realObservedPath(path.resolve(cwd,dir)),projectRoot))return null;}catch{return null;}
  return {prefix:prefix[0],command:command.slice(prefix[0].length)};
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
  const entered=rootCd(command,root,project.projectRoot);
  const match=entered&&matched(entered.command,parsed,record.config);
  if(!match)return null;
  const name=match.check,status=await synchronizedStatus(entry,config,root,timeout??lastRunTimeout(config,parsed,name)),
    reason=verdict(status,name,match.rest);
  if(reason)return {hookSpecificOutput:{hookEventName:'PreToolUse',
    permissionDecision:'deny',permissionDecisionReason:reason}};
  // Rewrite only on a healthy answer for this check: without an observer,
  // `redue run` cannot record, so the command stays as Claude sent it. A chain
  // stays too: the rewrite returns "allow", which would also skip the prompt
  // for the rest of the chain.
  const rewritten=status?.schema===1&&status.observation?.healthy===true&&Array.isArray(status.checks)&&
    status.checks.some(item=>item?.name===name)?recordedCommand(entered.command,name,record.config):null;
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
