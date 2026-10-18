// Claude Code PreToolUse hook: skip an exact typecheck rerun when REDUE reports
// CURRENT/PASS with reuse_eligible on the current inputs. When the check is not
// CURRENT, the command becomes `redue run <check>` so the run is recorded. Every
// other outcome, including errors and timeouts, allows the command unchanged.
// Never exit 2: Claude Code treats exit 2 as a block.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';

export const hookCommand='redue agent hook claude';
const safe=/^[A-Za-z0-9_./:=,+-]+$/;
const typecheck=check=>check?.kind==='typecheck'||check?.name==='typecheck';

// Exact commands that rerun each configured typecheck. Names that would need
// shell quoting get no form, so the hook never fires for them.
export function hookForms(config){
  const rows=[];
  for(const check of config?.checks||[]){
    if(!typecheck(check)||typeof check.name!=='string'||!safe.test(check.name))continue;
    const forms=[`redue run ${check.name}`];
    // Other forms run from the project root, so they match only a root check.
    if(check.cwd!==undefined&&check.cwd!=='.'){rows.push({check:check.name,forms});continue;}
    if(config.packageManager==='npm'&&typeof check.script==='string'&&safe.test(check.script))
      forms.push(`npm run ${check.script}`);
    if(check.qualification==='npm-typescript-direct-v1')forms.push('npx tsc --noEmit');
    if(Array.isArray(check.command)&&check.command.length&&
      check.command.every(v=>typeof v==='string'&&safe.test(v)&&!v.startsWith('@')))
      forms.push(check.command.join(' '));
    rows.push({check:check.name,forms:[...new Set(forms)]});
  }
  return rows;
}

// Accept only an optional trailing `2>&1`, then an optional `| tail|head -n N`
// or `-N`. Newlines separate commands, so they never match.
function split(command){
  if(typeof command!=='string'||/[\r\n]/.test(command))return null;
  const [,base,suffix]=command.trim().replace(/[ \t]+/g,' ')
    .match(/^(.*?)((?: 2>&1)?(?: \| (?:tail|head) (?:-n \d+|-\d+))?)$/);
  return {base,suffix};
}
export function matchCheck(command,config){
  const parts=split(command);
  return parts&&hookForms(config).find(row=>row.forms.includes(parts.base))?.check||null;
}
// The same check through REDUE, keeping the output suffix; null if it already is.
export function recordedCommand(command,name,configFile='redue.config.json'){
  const parts=split(command);
  if(!parts||!safe.test(name)||!safe.test(configFile))return null;
  const run=`redue ${configFile==='redue.config.json'?'':`--config ${configFile} `}run ${name}`;
  return parts.base===run||parts.base===`redue run ${name}`?null:run+parts.suffix;
}

export function verdict(status,name){
  const row=status?.schema===1&&status.observation?.healthy===true&&Array.isArray(status.checks)?
    status.checks.find(item=>item?.name===name):null;
  const runId=row?.invocation?.runId;
  if(!row||row.freshness!=='CURRENT'||row.result!=='PASS'||row.reuse_eligible!==true||
    typeof runId!=='string'||!/^[0-9a-f-]{36}$/.test(runId))return null;
  return `REDUE: check ${JSON.stringify(name)} passed on these exact inputs (run ${runId}); `+
    'rerun skipped. To run it anyway, prefix the command with REDUE_FORCE=1.';
}

function synchronizedStatus(entry,config,root,timeout){
  return new Promise(resolve=>{
    let child,out='',done=false;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);
      if(child?.pid&&child.exitCode===null)try{process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL');}catch{}
      resolve(value);};
    const timer=setTimeout(()=>finish(null),timeout);
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

// Returns the hook's stdout object, or null to allow the command.
export async function claudeHook(input,{entry,timeout=2000}){
  if(input?.tool_name!=='Bash')return null;
  const command=input.tool_input?.command,root=input.cwd;
  if(typeof command!=='string'||/^\s*REDUE_FORCE=1(?:\s|$)/.test(command))return null;
  if(typeof root!=='string'||!path.isAbsolute(root))return null;
  const record=JSON.parse(fs.readFileSync(path.join(root,'.redue','agents','claude.json'),'utf8'));
  if(record?.schema!==1||record.host!=='claude'||typeof record.config!=='string'||
    !/^[^/\\]+\.json$/.test(record.config))return null;
  const config=path.join(root,record.config);
  const name=matchCheck(command,JSON.parse(fs.readFileSync(config,'utf8')));
  if(!name)return null;
  const status=await synchronizedStatus(entry,config,root,timeout),reason=verdict(status,name);
  if(reason)return {hookSpecificOutput:{hookEventName:'PreToolUse',
    permissionDecision:'deny',permissionDecisionReason:reason}};
  // Rewrite only on a healthy answer for this check: without an observer,
  // `redue run` cannot record, so the command stays as Claude sent it.
  const rewritten=status?.schema===1&&status.observation?.healthy===true&&Array.isArray(status.checks)&&
    status.checks.some(item=>item?.name===name)?recordedCommand(command,name,record.config):null;
  // updatedInput replaces the whole tool input. Deny and ask rules still apply
  // to the rewritten command; "allow" skips only the prompt.
  return rewritten?{hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'allow',
    permissionDecisionReason:`REDUE: check ${JSON.stringify(name)} is not CURRENT; running it through redue run so the result is recorded.`,
    updatedInput:{...input.tool_input,command:rewritten}}}:null;
}

export async function runClaudeHook(entry){
  try{
    let text='';process.stdin.setEncoding('utf8');
    for await(const chunk of process.stdin){text+=chunk;if(text.length>1024*1024)return;}
    const output=await claudeHook(JSON.parse(text),{entry});
    if(output)await new Promise(resolve=>process.stdout.write(JSON.stringify(output)+'\n',resolve));
  }catch{}
}
