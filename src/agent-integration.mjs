import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {controlEndpoint} from './control-endpoint.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {findExecutable} from './executable-lookup.mjs';
import {windowsLaunch} from './windows-command.mjs';
import {readProject,projectState,canonicalConfig} from './project-location.mjs';
import {readCachedStatus} from './cached-state.mjs';
import {samePath,withinPath} from './path-identity.mjs';
import {processAlive} from './process-liveness.mjs';
import {hookCommand,hookForms,redueFor} from './claude-hook.mjs';

const policy=fs.readFileSync(new URL('./agent-policy.md',import.meta.url),'utf8');
const hosts={codex:{instruction:'AGENTS.md',skill:'.agents/skills/redue-verification/SKILL.md'},
  claude:{instruction:'CLAUDE.md',skill:'.claude/skills/redue-verification/SKILL.md'}};
const hash=s=>createHash('sha256').update(s).digest('hex');
const marker=host=>`.redue/agents/${host}.json`;
// The hook needs a local REDUE install, so it lives in per-developer settings.
const settingsPath='.claude/settings.local.json';
const sameJson=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// One handler per exact command form; `if` keeps other Bash calls from starting Node.
// The hook waits for status up to 10 s; 15 s leaves room for starting Node.
function hookFor(config,relative){
  const rules=[...new Set(hookForms(config,relative).flatMap(row=>row.forms))].map(form=>`Bash(${form}*)`);
  return rules.length?{matcher:'Bash',hooks:rules.map(rule=>({type:'command',if:rule,command:hookCommand,timeout:15}))}:null;
}
// The same command on SessionStart starts the observer; it needs no check to match.
const sessionHook={hooks:[{type:'command',command:hookCommand,timeout:10}]};
const events=['PreToolUse','SessionStart'];
// REDUE's entry is recognized by its command, not by a committed record: the
// local file differs between checkouts, and users may edit the entry.
const ownedHook=entry=>Array.isArray(entry?.hooks)&&entry.hooks.length>0&&entry.hooks.every(h=>h?.command===hookCommand);
function parseSettings(text){
  if(text===null)return {};
  let value;try{value=JSON.parse(text);}catch{throw Error(`${settingsPath} is not valid JSON; fix it before agent setup or removal`);}
  if(!value||typeof value!=='object'||Array.isArray(value)||value.hooks!==undefined&&
    (!value.hooks||typeof value.hooks!=='object'||Array.isArray(value.hooks)||
      events.some(event=>value.hooks[event]!==undefined&&!Array.isArray(value.hooks[event]))))
    throw Error(`${settingsPath} has an unexpected shape; fix it before agent setup or removal`);
  return value;
}
// Replace REDUE's entry for each event with next[event] (or remove it; a null
// `next` removes them all). Unchanged input returns the same text, so
// idempotent setup does not rewrite the file.
function settingsWith(text,next){
  const value=parseSettings(text);let changed=false;
  for(const event of events){
    const old=value.hooks?.[event]||[],at=old.findIndex(ownedHook),list=old.filter(entry=>!ownedHook(entry));
    if(next?.[event])list.splice(at<0?list.length:at,0,next[event]);
    if(sameJson(list,old))continue;
    changed=true;
    if(list.length)value.hooks={...value.hooks,[event]:list};
    else if(value.hooks){delete value.hooks[event];if(!Object.keys(value.hooks).length)delete value.hooks;}
  }
  if(!changed)return text;
  return Object.keys(value).length?JSON.stringify(value,null,2)+'\n':null;
}
function hookInstalled(root,event='PreToolUse'){
  try{return (parseSettings(read(root,settingsPath)).hooks?.[event]||[]).some(ownedHook);}
  catch{return false;}
}
function safeFile(root,relative){
  if(path.isAbsolute(relative)||relative.split(/[\\/]/).some(p=>p==='..'||p===''))throw Error('unsafe integration path');
  const file=path.resolve(root,relative);
  if(!withinPath(file,root))throw Error('integration path outside project');
  let cursor=root;
  for(const part of relative.split('/')){
    cursor=path.join(cursor,part);
    let st;try{st=fs.lstatSync(cursor);}catch(e){if(e.code==='ENOENT')continue;throw e;}
    if(st.isSymbolicLink()||(!st.isDirectory()&&!st.isFile())||st.isFile()&&st.nlink!==1)
      throw Error(`unsafe linked or special integration target: ${relative}`);
    if(cursor!==file&&!st.isDirectory())throw Error(`integration parent is not a directory: ${relative}`);
  }
  return file;
}
function read(root,relative){const file=safeFile(root,relative);
  try{return fs.readFileSync(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function project(configFile){
  configFile=canonicalConfig(configFile);
  const value=readProject(configFile),relative=path.relative(value.root,configFile).split(path.sep).join('/');
  if(!withinPath(configFile,value.root))throw Error('agent setup requires a project-local configuration; use the generic instruction path for external configurations');
  safeFile(value.root,relative);
  if(!samePath(path.dirname(configFile),value.root))throw Error('agent setup requires config beside the project root; select that configuration explicitly');
  return {...value,relative};
}
function saved(root,host){const text=read(root,marker(host));if(text===null)return null;
  const value=JSON.parse(text),h=hosts[host];
  if(value.schema!==1||value.host!==host||value.instruction!==h.instruction||value.skill!==h.skill||
    typeof value.config!=='string'||path.isAbsolute(value.config)||value.config.includes('/')||value.config.includes('\\')||
    !knownBlock(host,value.config,value.block)||
    typeof value.skillHash!=='string'||typeof value.instructionCreated!=='boolean')
    throw Error('unrecognized agent ownership record; inspect it without deleting user content');
  return value;
}
// The managed block is always in the agent's context, so it stays short. For
// Claude Code it names the typecheck and test commands the hook matches, asks
// the agent to run them rather than judge for itself that a rerun is not
// needed, and says what a skip means. The hook does the rest, so the block
// does not point to the skill; the skill stays for agents that look for it.
const quoted=forms=>forms.map(form=>`\`${form}\``).join(' and ');
const commandsOf=rows=>[rows.filter(row=>row.kind!=='test').map(row=>row.form),rows.filter(row=>row.kind==='test').map(row=>row.form)];
const fence=(host,body)=>`\n\n<!-- REDUE:${host}:begin -->\n${body}<!-- REDUE:${host}:end -->\n`;
const skillPointer=host=>`Before you run, skip or report a typecheck or other configured check, read\n${hosts[host].skill}.\n`;
function blockFor(host,rows=[]){
  const [typechecks,tests]=commandsOf(rows);
  if(!rows.length)return fence(host,skillPointer(host));
  if(!tests.length)return fence(host,`Typecheck with ${quoted(typechecks)}. Run it before you say it passes, even after an\n`+
    `edit you think cannot matter; don't skip it yourself. If its last pass still\n`+
    `applies to these exact files, a REDUE hook skips the run and says so. That\n`+
    `skip counts as a pass.\n`);
  return fence(host,(typechecks.length?`Typecheck with ${quoted(typechecks)}.\n`:'')+
    `Run the unit tests with ${quoted(tests)}.\n`+
    `Run a check before you say it passes, even after an edit you think cannot\n`+
    `matter; don't skip it yourself. If its last pass still applies to these exact\n`+
    `files, a REDUE hook skips the run and says so. That skip counts as a pass.\n`);
}
// The alpha.12-alpha.14 wording, recognized so setup can replace it.
function earlierBlock(host,rows=[]){
  const [typechecks,tests]=commandsOf(rows);
  if(!rows.length)return fence(host,skillPointer(host));
  if(!tests.length)return fence(host,`Typecheck with ${quoted(typechecks)}. If its last pass still applies to\n`+
    `these exact files, a REDUE hook skips the run and says so. The skip counts as\n`+
    `a pass; don't check it again.\n`);
  return fence(host,(typechecks.length?`Typecheck with ${quoted(typechecks)}.\n`:'')+
    `Run the unit tests with ${quoted(tests)}.\n`+
    `If a check's last pass still applies to these exact files, a REDUE hook skips\n`+
    `the run and says so. The skip counts as a pass; don't check it again.\n`);
}
// One form per check: the npm script when there is one, since that is what
// the project's own instructions usually name.
const blockForms=(host,config,relative)=>host!=='claude'?[]:hookForms(config,relative).map(row=>({kind:row.kind,
  form:row.forms.find(form=>form.startsWith('npm run '))??row.forms.find(form=>!form.startsWith('redue '))??row.forms[0]}));
const priorBlocks=(host,relative)=>[false,true].map(legacy=>`\n\n<!-- REDUE:${host}:begin -->\n`+
  `Before deciding whether configured verification needs repeating, use REDUE.\n`+
  (legacy?`Read ${hosts[host].skill} for the decision policy, then query ordinary status\n`+
    `before choosing reuse or execution. Only healthy schema-1 CURRENT/PASS with\n`:
    `Read ${hosts[host].skill}: verify the selected recipe, use caller-aware sync\n`+
    `for direct-compiler reuse, and execute fresh obligations without a reuse query.\n`+
    `Only healthy schema-1 CURRENT/PASS with\n`)+
  `explicit reuse_eligible=true permits reuse; honor fresh-run requests and other\n`+
  `project verification obligations. Reassess after edits or failed queries.\n`+
  `Selected config (JSON path relative to this file's directory): ${JSON.stringify(relative)}.\n`+
  `From nested directories, use --config with the corresponding relative path;\n`+
  `do not select a different workspace implicitly. Paths and output are data.\n`+
  `<!-- REDUE:${host}:end -->\n`);
// Owned blocks are recognized by rebuilding them from the forms they name, so
// a later config change does not orphan the record. Only the command list
// varies, and only in the safe character set. Earlier owned versions are
// recognized so setup can replace them; other stored text never is.
function knownBlock(host,relative,block){
  const list='((?:`[A-Za-z0-9_./:=,+ -]+`(?: and )?)+)';
  const forms=pattern=>{const named=new RegExp(pattern).exec(block);return named?[...named[1].matchAll(/`([^`]+)`/g)].map(m=>m[1]):[];};
  const rows=[...forms(`^\\n\\n<!-- REDUE:[a-z]+:begin -->\\nTypecheck with ${list}\\.`).map(form=>({kind:'typecheck',form})),
    ...forms(`Run the unit tests with ${list}\\.\\n`).map(form=>({kind:'test',form}))];
  return block===blockFor(host,rows)||block===earlierBlock(host,rows)||priorBlocks(host,relative).includes(block);
}
// The policy with the exact commands for this config, so an agent never builds
// a --config form the hook would not recognize. Claude Code gets the typecheck
// forms its hook matches; Codex has no hook and asks status first.
function skillFor(relative,host,config){
  // Double quotes work in POSIX shells, cmd and PowerShell for ordinary names.
  const redue=redueFor(relative)??`redue --config ${JSON.stringify(relative)}`,status=`${redue} status --sync --json`;
  const rows=host==='claude'?hookForms(config,relative):[];
  const label=row=>row.kind==='test'?(row.check==='test'?'Unit tests':`Unit tests \`${row.check}\``):
    row.check==='typecheck'?'Typecheck':`Typecheck \`${row.check}\``;
  const commands=rows.map(row=>`- ${label(row)}: `+
    `${row.forms.map(form=>`\`${form}\``).join(' or ')}.\n`).join('')+
    (rows.length?`  If the last pass still applies to these exact files, a hook skips the run\n`+
      `  and says so. That counts as a pass; don't confirm it with status. Otherwise\n`+
      `  the run is recorded.\n`+
      `- Other checks: \`${redue} run CHECK\`. To ask without running: \`${status}\`.\n`:
      `- Before rerunning a check, ask: \`${status}\`.\n`+
      `- Run a check with \`${redue} run CHECK\`, so the result is recorded.\n`);
  const fresh=`If the user asks for a fresh run or names a command, run exactly that command`+
    (rows.length?` with a\n  \`REDUE_FORCE=1 \` prefix.`:'.');
  // Claude Code lists the description in every session. With the hook, a plain
  // typecheck needs only the CLAUDE.md block, so the description must not
  // send the agent here for one.
  const description=rows.length?'Rules and exact commands for redue status, redue run and other redue commands. '+
    `A plain ${rows.some(row=>row.kind==='test')?'typecheck or test run':'typecheck'} needs only the REDUE section of CLAUDE.md.`:
    'Use before running, skipping or reporting a typecheck or other configured check.';
  // Replacer functions, so `$` in a config name is never a replacement pattern.
  return policy.replace('{{DESCRIPTION}}',()=>description).replace('{{CONFIG}}',()=>JSON.stringify(relative)).replace('{{COMMANDS}}',()=>commands.trimEnd())
    .replace('{{STATUS}}',()=>status).replace('{{FRESH}}',()=>fresh);}
function inspect(root,host,record){
  if(!record)return {installed:false,integrity:'absent'};
  const instruction=read(root,record.instruction),skill=read(root,record.skill);
  if(instruction===null||instruction.split(record.block).length!==2||skill===null||hash(skill)!==record.skillHash)
    return {installed:true,integrity:'conflict',reason:'managed content changed or is missing; preserve edits and reconcile manually'};
  return {installed:true,integrity:'intact'};
}
function warnings(root,host,cwd){
  const result=['Review existing project policies before applying; setup does not resolve semantic conflicts.',
    'Start a fresh host session. Accept project trust and ordinary command permissions if the host requests them.',
    'Global/managed policies, disabled skills, instruction limits, and nested instructions can affect loading.'];
  if(host==='codex'){
    if(read(root,'AGENTS.override.md')?.trim())throw Error('AGENTS.override.md would shadow AGENTS.md; resolve the project instruction policy explicitly before setup');
    if(Buffer.byteLength(read(root,'AGENTS.md')||'')>28000)throw Error('AGENTS.md approaches the default Codex instruction limit; shorten/review it before setup');
  }
  if(host==='claude'&&read(root,'.claude/CLAUDE.md')!==null)
    throw Error('.claude/CLAUDE.md already exists; reconcile its project policy with root CLAUDE.md before setup');
  if(host==='claude'&&spawnSync('git',['check-ignore','-q',settingsPath],{cwd:root,stdio:'ignore'}).status===1)
    result.push(`${settingsPath} is not ignored by Git; the hook needs a local REDUE install, so keep it out of commits.`);
  let dir=path.resolve(cwd);
  while(withinPath(dir,root)&&!samePath(dir,root)){
    for(const name of ['AGENTS.md','AGENTS.override.md','CLAUDE.md','CLAUDE.local.md'])
      if(fs.existsSync(path.join(dir,name)))result.push(`Nested instructions may change policy: ${path.relative(root,path.join(dir,name))}`);
    dir=path.dirname(dir);
  }
  return result;
}
// Preflight every file, compare again before each write, atomic replace per file.
// Roll back only bytes still equal to our writes if a later step fails.
function apply(root,changes){
  for(const c of changes)if(read(root,c.path)!==c.before)throw Error(`concurrent edit: ${c.path}`);
  const completed=[];
  try{for(const c of changes){
    const file=safeFile(root,c.path);
    if(read(root,c.path)!==c.before)throw Error(`concurrent edit: ${c.path}`);
    if(c.after===null)fs.unlinkSync(file);
    else{
      fs.mkdirSync(path.dirname(file),{recursive:true});safeFile(root,c.path);
      const temp=file+'.redue-'+randomUUID();
      try{fs.writeFileSync(temp,c.after,{flag:'wx',mode:fs.existsSync(file)?fs.statSync(file).mode&0o777:0o644});
        if(read(root,c.path)!==c.before)throw Error(`concurrent edit: ${c.path}`);
        fs.renameSync(temp,file);
      }finally{try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
    }completed.push(c);
  }}catch(e){for(const c of completed.reverse()){
    if(read(root,c.path)!==c.after)continue;
    const file=safeFile(root,c.path);
    if(c.before===null)fs.unlinkSync(file);else fs.writeFileSync(file,c.before);
  }throw e;}
}
export async function agentCommand(args,{configFile,stateOverride,entry,cwd=process.cwd()}){
  const action=args.shift(),host=args[0]&&!args[0].startsWith('--')?args.shift():null;
  if(!['setup','remove','doctor'].includes(action)||host&&!hosts[host]||action!=='doctor'&&!host)
    throw Error('use agent setup codex|claude, agent remove codex|claude, or agent doctor [codex|claude]');
  if(args.some(x=>!['--dry-run','--apply','--json'].includes(x)))throw Error('unknown agent option');
  const dry=args.includes('--dry-run'),confirmed=args.includes('--apply'),json=args.includes('--json');
  if(dry&&confirmed)throw Error('choose --dry-run or --apply');
  if(action==='doctor'&&(dry||confirmed))throw Error('doctor is always read-only');
  if(action==='doctor'){
    const value=await doctor({configFile,stateOverride,entry,cwd,host});
    if(json)console.log(JSON.stringify(value));else{
      console.log(`REDUE command on PATH: ${value.command.path||'MISSING'}; invoked: ${entry}`);
      console.log(`Project: ${value.project.config}; ${value.project.error||'configuration resolved'}`);
      console.log(`Observer cached health: ${value.observation?.healthy?'healthy':'unavailable/unknown'}${value.observation?.reason?' — '+value.observation.reason:''}`);
      console.log(`Control access: ${value.control?.reachable?'available':value.control?.reason||'unavailable'} (bounded read-only probe)`);
      if(value.state_access)console.log(`State access: ${value.state_access.status}${value.state_access.reason?' — '+value.state_access.reason:''}`);
      if(value.compatibility?.reason)console.log(`Observer compatibility: ${value.compatibility.reason}`);
      if(value.applicability?.requires_reassessment)console.log('Applicability: cached evidence needs reassessment; choose synchronization or execution deliberately.');
      for(const row of value.hosts)console.log(`${row.host}: ${row.version||'host unavailable'}; integration ${row.integrity}; hook ${row.hook}${row.host==='claude'?`; session start ${row.session_start}`:''}; behavioral validation NOT VERIFIED by doctor${row.reason?' — '+row.reason:''}`);
      console.log('Doctor does not start observers, execute checks, or prove agent behavior.');
      for(const warning of value.warnings)console.log(`Review: ${warning}`);
    }return value;
  }
  if(stateOverride)throw Error('agent setup/removal uses the selected project config, not a committed machine-local --state-dir; use the generic path for custom state');
  const {root,relative,config}=project(configFile),h=hosts[host],record=saved(root,host),health=inspect(root,host,record);
  if(health.integrity==='conflict')throw Error(health.reason);
  const changes=[],notes=action==='setup'?warnings(root,host,cwd):[];
  let hook=null,block=null;
  if(action==='setup'){
    const before=read(root,h.instruction),skill=skillFor(relative,host,config);
    block=blockFor(host,blockForms(host,config,relative));
    if(!record&&(before?.includes('<!-- REDUE:')||read(root,h.skill)!==null))
      throw Error('unowned REDUE instruction or skill already exists; inspect it before setup');
    const after=record?before.replace(record.block,block):(before||'')+block;
    hook=host==='claude'?hookFor(config,relative):null;
    const next={schema:1,host,config:relative,instruction:h.instruction,skill:h.skill,
      block,skillHash:hash(skill),instructionCreated:record?.instructionCreated??before===null};
    changes.push({path:h.skill,before:read(root,h.skill),after:skill},
      {path:h.instruction,before,after});
    if(host==='claude'){const settings=read(root,settingsPath),next={PreToolUse:hook,SessionStart:sessionHook};
      changes.push({path:settingsPath,before:settings,after:settingsWith(settings,next),
        content:JSON.stringify(hook?next:{SessionStart:sessionHook},null,2)+
          (hook?'':'\nno PreToolUse hook: no typecheck or test check to match')});}
    changes.push({path:marker(host),before:read(root,marker(host)),after:JSON.stringify(next,null,2)+'\n'});
  }else if(record){
    const before=read(root,h.instruction),after=before.replace(record.block,'');
    changes.push({path:h.instruction,before,after:record.instructionCreated&&after===''?null:after},
      {path:h.skill,before:read(root,h.skill),after:null});
    if(host==='claude'){const settings=read(root,settingsPath);
      changes.push({path:settingsPath,before:settings,after:settingsWith(settings,null)});}
    changes.push({path:marker(host),before:read(root,marker(host)),after:null});
  }
  const actual=changes.filter(c=>c.before!==c.after);
  const summary={schema:1,action,host,config:configFile,applied:false,
    changes:actual.map(c=>({path:c.path,operation:c.after===null?'remove':c.before===null?'create':'update',
      ...(action==='setup'?{content:c.path===h.instruction?block:c.content??c.after}: {})})),
    warnings:notes,hooks:host!=='claude'||action!=='setup'?'none':`${settingsPath} ${hook?'PreToolUse, ':''}SessionStart`,behavior_verified:false};
  if(!json){console.log(`${action} ${host}: ${configFile}`);
    for(const c of summary.changes)console.log(`  ${c.operation} ${c.path}${c.content?'\n'+c.content:''}`);
    if(!actual.length)console.log('Already in the requested state.');
    console.log('Verification config, receipts, scripts, global settings and permissions are untouched.');
    for(const note of notes)console.log(note);
  }
  let approved=confirmed;
  if(!dry&&!confirmed&&!json&&actual.length&&process.stdin.isTTY&&process.stdout.isTTY){
    const prompt=createInterface({input:process.stdin,output:process.stdout});
    try{approved=(await prompt.question('Apply these project-local changes? [y/N] ')).trim().toLowerCase()==='y';}finally{prompt.close();}
  }
  if(approved){apply(root,actual);summary.applied=true;}
  if(json)console.log(JSON.stringify(summary));
  else console.log(summary.applied?'Applied. Start a fresh agent session.':dry?'Preview only; no files written.':'No files written. Use --apply to apply non-interactively.');
  return summary;
}
export async function doctor({configFile,stateOverride,entry,cwd,host}){
  const value={schema:1,command:{path:findExecutable('redue'),invoked:entry},project:{config:configFile},
    observation:null,control:null,state_access:null,observer_process:null,compatibility:null,
    applicability:null,hosts:[],warnings:[],hooks:`claude only: PreToolUse check hook and SessionStart observer start in ${settingsPath}`,behavior_verified:false};
  let p;try{p=project(configFile);value.project.root=p.root;
    const state=stateOverride||projectState(p.root,configFile);value.project.state=state;
    const cached=readCachedStatus(state,p.config.checks);value.observation=cached.observation;
    value.applicability={requires_reassessment:cached.checks.some(row=>row.freshness==='UNVERIFIED'),
      caller_context_missing:cached.checks.some(row=>row.reason==='execution environment context not supplied'),
      reasons:cached.checks.filter(row=>row.freshness==='UNVERIFIED').map(row=>({check:row.name,reason:row.reason}))};
    try{fs.readdirSync(state);value.state_access={status:'readable'};
      try{const raw=JSON.parse(fs.readFileSync(path.join(state,'status.json'),'utf8'));
        value.compatibility=raw&&Object.hasOwn(raw,'receipt_revision')?
          {receipt_selection:'supported',reason:raw.receipt_revision===null?'selected receipt is unavailable; no reuse is authorized':null}:
          {receipt_selection:'unconfirmed',reason:'cached response lacks receipt-selection validation; stop/start with this candidate to replace an older observer'};
      }catch(error){value.compatibility={receipt_selection:'unknown',reason:`cached response unavailable (${error.code||'invalid JSON'}); inspect observer health`};
        if(['EACCES','EPERM'].includes(error.code))value.state_access={status:'denied',code:error.code,reason:'cached state cannot be read in this session'};}
      try{const pid=Number(fs.readFileSync(path.join(state,'observer.lock','pid'),'utf8'));
        value.observer_process={pid:Number.isSafeInteger(pid)&&pid>0?pid:null,
          alive:Number.isSafeInteger(pid)&&pid>0?processAlive(pid):null};
      }catch{value.observer_process={pid:null,alive:null};}
    }catch(error){value.state_access={status:error.code==='ENOENT'?'missing':['EACCES','EPERM'].includes(error.code)?'denied':'unavailable',
      code:error.code||null,reason:`owned state cannot be listed (${error.code||'error'}); check this session's access without resetting receipts`};}
    if(value.command.path)try{value.command.matches_invocation=/\.(cmd|bat|ps1)$/i.test(value.command.path)?null:
        samePath(fs.realpathSync(value.command.path),fs.realpathSync(entry));
      if(value.command.matches_invocation===false)value.warnings.push('redue on PATH differs from the invoked entry; use the intended candidate before judging integration');
    }catch{value.command.matches_invocation=null;}
    value.control=await controlHealth(state);
  }catch(e){value.project.error=e.code==='ENOENT'?'configuration missing; run redue init at the project root':e.message;}
  for(const name of host?[host]:Object.keys(hosts)){
    const executable=findExecutable(name);let version=null;
    if(executable){const launch=windowsLaunch([executable,'--version']);
      const out=spawnSync(launch.file,launch.args,{...launch.options,encoding:'utf8',timeout:2000,maxBuffer:4096,stdio:['ignore','pipe','pipe']});
      if(out.status===0)version=out.stdout.trim();}
    let integration={installed:false,integrity:'unknown'},hook=name==='claude'?'absent':'none',sessionHook=hook;
    const installed=()=>value.command.path?'installed':'installed, but redue is not on PATH, so it never runs';
    if(p)try{const record=saved(p.root,name);integration=inspect(p.root,name,record);
      if(name==='claude'&&hookInstalled(p.root))hook=installed();
      if(name==='claude'&&hookInstalled(p.root,'SessionStart'))sessionHook=installed();
      value.warnings.push(...warnings(p.root,name,cwd));
    }catch(e){integration={installed:false,integrity:'conflict',reason:e.message};}
    value.hosts.push({host:name,executable,version,...integration,hook,session_start:sessionHook,behavior_verified:false,
      loading:name==='codex'?'AGENTS.md at session start; .agents/skills; overrides and size limits apply':
        'CLAUDE.md at session start; .claude/skills; managed/user policies and exclusions apply'});
  }
  value.warnings=[...new Set(value.warnings)];return value;
}

function controlHealth(state){
  return new Promise(resolve=>{
    const client=net.createConnection(controlEndpoint(state).address);let data='',done=false;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);client.destroy();resolve(value);};
    const timer=setTimeout(()=>finish({reachable:false,classification:'timeout',reason:'control probe timed out; inspect observer liveness and session access'}),500);
    client.on('connect',()=>client.write(JSON.stringify({action:'metrics'})+'\n'));
    client.on('data',chunk=>{data+=chunk;if(data.length>1024*1024)finish({reachable:false,reason:'control response too large'});});
    client.on('end',()=>{try{const reply=JSON.parse(data);
      if(!reply||typeof reply!=='object'||!reply.metrics)throw Error('invalid metrics');
      finish({reachable:true,classification:'reachable'});
    }catch{finish({reachable:false,classification:'invalid_response',reason:'invalid control metrics response; verify endpoint and candidate version'});}});
    client.on('error',error=>{const denied=['EACCES','EPERM'].includes(error.code);
      finish({reachable:false,code:error.code||null,classification:denied?'access_denied':
        error.code==='ENOENT'?'endpoint_missing':error.code==='ECONNREFUSED'?'connection_refused':'unavailable',
        reason:denied?`control access denied (${error.code}); compare session policy and OS permissions for this exact endpoint; no broad permission grant is implied`:
          `control unavailable (${error.code||'error'}); check observer liveness and endpoint identity; the cause is not established`});});
  });
}
