// The sandboxed recipe: a typecheck or lint command run inside an OS sandbox
// that lets it read only the checkout, its installed packages, the toolchain,
// system directories and a private home and temporary directory, with no
// network: Seatbelt (sandbox-exec) on macOS, Landlock (landlock.py) on Linux.
// The sandbox holds for every process the run starts, so programs REDUE
// cannot record (native compilers and linters, Python tools) are covered.
// The claim: the result holds for a run that sees only the project, its
// installed packages and the toolchain, the way CI does.
//
// The run gets a controlled environment: the check's declared variables and
// prefixes, a normalized PATH, a private HOME kept between runs, and a fresh
// TMPDIR. All of it is fingerprinted (sandboxContext), with the identity of
// the toolchain's executables.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {lookup,scriptCaches,scriptCheckInputs,scriptProject,toolchainDirs} from './node-script.mjs';
import {displayVariables} from './test-direct.mjs';

export const sandboxQualification='sandbox-v1';
export const sandboxInterpretation='sandbox@1';
export const sandboxKinds=['typecheck','lint'];
const fail=code=>{throw Object.assign(Error(code),{code});};
const digest=value=>createHash('sha256').update(value).digest('hex');
const real=file=>{try{return fs.realpathSync(file);}catch{return null;}};
const within=(file,dir)=>file===dir||file.startsWith(dir.endsWith('/')?dir:dir+'/');
const landlockScript=path.join(path.dirname(fileURLToPath(import.meta.url)),'landlock.py');

// Python's caches in the checkout, as runner caches: not inputs.
const pythonCaches=['**/__pycache__/**','**/.mypy_cache/**','**/.ruff_cache/**','**/.pytest_cache/**'];
export const sandboxCaches=[...scriptCaches,...pythonCaches];
// The project's virtual environment: installed files, observed by identity,
// without Python's bytecode caches. Its interpreter links lead out of the
// checkout to the interpreter it was made from, which sandboxContext
// identifies instead.
// Python 3.14 adds a `𝜋thon` link beside `python`.
const venvInstalled=['.venv/**','!.venv/**/__pycache__/**','!.venv/bin/python*','!.venv/bin/pypy*','!.venv/bin/𝜋thon*'];
// Inputs: the whole checkout, git-ignored files included, except .git, the
// installed trees (node_modules, .venv) and runner caches.
export function sandboxCheckInputs(dirs=[]){
  const base=scriptCheckInputs(dirs);
  return {inputs:[...base.inputs,'!.venv/**',...pythonCaches.map(pattern=>`!${pattern}`)],
    installedInputs:[...base.installedInputs,...venvInstalled]};
}
// A Python check runs a tool from the project's .venv: `.venv/bin/TOOL ARGS`.
export const pythonTool=check=>Array.isArray(check?.command)&&/^\.venv\/bin\/[A-Za-z0-9_.-]+$/.test(check.command[0]||'')?
  path.basename(check.command[0]):null;
// The variables a run gets from the caller, compared before reuse. HOME,
// TMPDIR, PATH and the XDG directories are set by REDUE (sandboxEnv). A
// script check names its package manager first among the executables, as the
// general recipe does.
const managers=['npm','pnpm','yarn','corepack'];
export function sandboxEnvironment(python=false,manager=null){
  return {variables:['TZ','LANG','LANGUAGE','CI','USER','LOGNAME'],
    prefixes:['LC_','DYLD_','LD_',...python?['PYTHON','MYPY','RUFF_','PYRIGHT','TY_']:
      ['NODE_','npm_config_','PNPM_','YARN_','COREPACK_','TSGO_']],
    ...manager?{pathExecutables:['node',manager,...managers.filter(name=>name!==manager)]}:{}};
}

// Whether this machine can sandbox a run: {mode} or {issue}. Asked once per process.
let support=null;
export function sandboxSupport(){
  if(support)return support;
  if(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_SANDBOX==='unavailable')
    return support={mode:null,issue:'the sandbox is turned off for this test'};
  if(process.platform==='darwin'){
    const r=spawnSync('/usr/bin/sandbox-exec',['-p','(version 1)(allow default)','/usr/bin/true'],{encoding:'utf8',timeout:10000});
    // Seatbelt cannot start inside another Seatbelt sandbox (Claude Code's, for one).
    return support=r.status===0?{mode:'seatbelt'}:{mode:null,issue:/Operation not permitted/.test(r.stderr||'')?
      'sandbox-exec cannot start inside another sandbox':`sandbox-exec cannot start (${(r.stderr||r.error?.code||r.status||'').toString().trim().slice(0,120)})`};
  }
  if(process.platform==='linux'){
    const python=launcherPython();
    if(!python)return support={mode:null,issue:'the Landlock launcher needs Python 3'};
    let abi=null;
    try{abi=JSON.parse(spawnSync(python,['-I','-W','ignore',landlockScript,'--probe'],{encoding:'utf8',timeout:10000}).stdout).abi;}catch{}
    if(!Number.isInteger(abi))return support={mode:null,issue:'Landlock is unavailable in this kernel'};
    // ABI 4 (Linux 6.7) is the first that can refuse TCP connections.
    if(abi<4)return support={mode:null,issue:`Landlock ABI ${abi} cannot keep a run off the network; it needs ABI 4 (Linux 6.7)`};
    return support={mode:'landlock',abi,python};
  }
  return support={mode:null,issue:'the sandboxed recipe runs on macOS and Linux only'};
}
const launcherPython=()=>['/usr/bin/python3','/bin/python3'].find(file=>{try{fs.accessSync(file,fs.constants.X_OK);return true;}catch{return false;}})||
  lookup('python3',process.env.PATH,process.cwd());

export const systemPlaces=process.platform==='darwin'?
  ['/usr','/bin','/sbin','/System','/Library','/Applications','/opt/homebrew','/private/etc','/private/var/db','/private/var/select','/dev']:
  ['/usr','/bin','/sbin','/lib','/lib32','/lib64','/libx32','/etc','/proc','/sys','/dev','/run'];
// The PATH a run gets: the caller's, without the project's .venv/bin, which
// `uv run`, `poetry run` and an activated environment put first; a Python
// check gets it first again. So the forms of a command agree.
export function sandboxPath(check,env,root){
  const venvBin=path.join(root,'.venv','bin');
  const rest=String(env.PATH??'').split(path.delimiter).filter(dir=>dir&&path.resolve(root,dir)!==venvBin);
  return [...pythonTool(check)?[venvBin]:[],...rest].join(path.delimiter);
}
// The interpreter a .venv was made from: its real executable and installation
// (pyvenv.cfg's `home` is the directory of the executable it was made with).
export function venvBase(root){
  const venv=path.join(root,'.venv');
  let home=null;
  try{home=/^home\s*=\s*(.+)$/m.exec(fs.readFileSync(path.join(venv,'pyvenv.cfg'),'utf8'))?.[1].trim()??null;}catch{}
  const executable=real(path.join(venv,'bin','python'));
  return {home,executable,prefix:home&&path.isAbsolute(home)?path.dirname(home):null};
}
// Program files a run starts from outside the checkout: Node, the package
// managers, and a Python check's interpreter. Their identity is compared
// before reuse.
function toolchainExecutables(check,env,root){
  if(pythonTool(check))return [venvBase(root).executable];
  const searchPath=sandboxPath(check,env,root);
  return ['node','npm','npx','pnpm','yarn','corepack'].map(name=>lookup(name,searchPath,root));
}
const sharedPrefixes=()=>{const home=os.homedir();return [home,path.join(home,'.local'),'/usr/local','/usr','/opt/homebrew','/'];};
// What a run may read and execute outside the checkout: the toolchain's
// installations and stores, and system directories.
export function sandboxPlaces(check,env,root){
  const home=os.homedir(),places=new Set();
  const add=dir=>{const resolved=dir&&path.isAbsolute(dir)?real(dir):null;
    if(resolved&&resolved!=='/'&&resolved!==home&&!within(home,resolved))places.add(resolved);};
  // An installation root (bin/..), or the program alone when bin/.. is shared (~/.local, /usr/local).
  const addRoot=file=>{const dir=path.dirname(path.dirname(file));add(sharedPrefixes().includes(dir)?file:dir);};
  for(const file of toolchainExecutables(check,env,root))if(file)addRoot(file);
  if(pythonTool(check)){const base=venvBase(root);add(base.prefix);add(base.home);}
  else{
    for(const dir of toolchainDirs(env))add(dir);
    const cache=path.isAbsolute(env.XDG_CACHE_HOME||'')?env.XDG_CACHE_HOME:path.join(home,'.cache');
    add(path.isAbsolute(env.COREPACK_HOME||'')?env.COREPACK_HOME:path.join(cache,'node','corepack'));
    add(path.join(home,'.yarn','berry'));
  }
  return [...places].sort();
}
// The environment a run gets.
export function sandboxEnv(check,env,{root,home,tmp}){
  const variables=check.environment?.variables||[],prefixes=(check.environment?.prefixes||[]).map(prefix=>prefix.toLowerCase());
  const out={};
  for(const [key,value] of Object.entries(env))
    if(variables.includes(key)||prefixes.some(prefix=>key.toLowerCase().startsWith(prefix))||displayVariables.includes(key))out[key]=value;
  delete out._;delete out.REDUE_RUN_RECORD;
  Object.assign(out,{PATH:sandboxPath(check,env,root),HOME:home,XDG_CONFIG_HOME:path.join(home,'.config'),
    XDG_CACHE_HOME:path.join(home,'.cache'),XDG_DATA_HOME:path.join(home,'.local','share'),XDG_STATE_HOME:path.join(home,'.local','state'),
    TMPDIR:tmp,TMP:tmp,TEMP:tmp,
    // The checkout's .git is not an input. Tools may still see it, as in CI,
    // but git commands find no repository.
    GIT_DIR:path.join(home,'.no-repository'),GIT_CEILING_DIRECTORIES:path.dirname(root)});
  if(pythonTool(check))out.VIRTUAL_ENV=path.join(root,'.venv');
  else{
    // Corepack's downloads stay where Corepack keeps them; npm's and pnpm's
    // update checks read the network; Nx would hand work to its daemon.
    const cache=path.isAbsolute(env.XDG_CACHE_HOME||'')?env.XDG_CACHE_HOME:path.join(os.homedir(),'.cache');
    out.COREPACK_HOME=path.isAbsolute(env.COREPACK_HOME||'')?env.COREPACK_HOME:path.join(cache,'node','corepack');
    Object.assign(out,{npm_config_update_notifier:'false',NX_DAEMON:'false'});
  }
  return out;
}
// The files in the checkout's .git that tools read to choose files (ruff's
// and biome's ignore rules): the repository's exclude file and config. The
// observer does not watch .git, so they are compared as context.
function gitIgnoreSources(root){
  let dir=path.join(root,'.git');
  try{if(fs.statSync(dir).isFile()){
    const gitdir=path.resolve(root,/^gitdir:\s*(.+)$/m.exec(fs.readFileSync(dir,'utf8'))?.[1].trim()??'');
    let common=gitdir;try{common=path.resolve(gitdir,fs.readFileSync(path.join(gitdir,'commondir'),'utf8').trim());}catch{}
    dir=common;}}catch{return [];}
  return ['info/exclude','config'].map(rel=>{try{return [rel,digest(fs.readFileSync(path.join(dir,rel)))];}catch{return [rel,null];}});
}
// What a sandboxed result depends on outside the observed files, as one
// digest compared before reuse: the environment the run gets (but its private
// directories and display variables), the places it may read, the identity of
// the toolchain's executables and of every directory on PATH (an installed or
// upgraded program changes its directory), and the ignore rules in .git.
export function sandboxContext(check,env,root){
  const identity=(file,keys=['dev','ino','mode','size','mtimeNs','ctimeNs'])=>{try{const st=fs.statSync(file,{bigint:true});
    return [file,...keys.map(key=>String(st[key]))];}catch{return [file,'<unavailable>'];}};
  const environment=sandboxEnv(check,env,{root,home:'<home>',tmp:'<tmp>'});
  for(const key of displayVariables)delete environment[key];
  return digest(JSON.stringify({environment,places:sandboxPlaces(check,env,root),
    executables:toolchainExecutables(check,env,root).map(file=>file?identity(file):null),
    path:environment.PATH.split(path.delimiter).filter(dir=>path.isAbsolute(dir)).map(dir=>identity(dir,['dev','ino','mtimeNs','ctimeNs'])),
    git:gitIgnoreSources(root)}));
}
// A run's private directories, in REDUE's state: the home it keeps between
// runs, and a fresh temporary directory.
// The temporary directory is under the system's, so a Unix socket path in it
// stays short enough.
export function sandboxDirs(state,name){
  const home=path.join(state,'sandbox',digest(name).slice(0,16),'home');
  fs.mkdirSync(home,{recursive:true,mode:0o700});
  return {home,tmp:fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-run-')))};
}

const ancestors=list=>[...new Set(list.flatMap(dir=>{const out=[];for(let at=path.dirname(dir);at!=='/'&&at!=='.';at=path.dirname(at))out.push(at);return out;}))];
// The Seatbelt profile: reads and executes only beneath the places, the
// metadata of their parent directories, and no network but Unix sockets in
// the run's own temporary directory (`own`), which is new for each run: a
// daemon an earlier run left behind cannot answer a later one.
export function seatbeltProfile(reads,own=null){
  const quote=value=>JSON.stringify(value);
  const all=[...new Set(reads.flatMap(dir=>[dir,real(dir)]).filter(Boolean))];
  return ['(version 1)','(allow default)','(deny file-read* process-exec*)',
    `(allow file-read* process-exec* ${all.map(dir=>`(subpath ${quote(dir)})`).join(' ')} (literal "/") (literal "/etc") (literal "/var") (literal "/tmp"))`,
    `(allow file-read-metadata ${ancestors(all).map(dir=>`(literal ${quote(dir)})`).join(' ')})`,
    '(deny network*)',...own?[`(allow network* ${[own,real(own)].filter(Boolean).map(dir=>`(subpath ${quote(dir)})`).join(' ')})`]:[]].join('\n');
}
// The argv that runs `argv` sandboxed: reads beneath `reads`, no network but
// Unix sockets beneath `tmp` on macOS.
export function sandboxArgv(mode,argv,{reads,tmp=null,python}){
  if(mode==='seatbelt')return ['/usr/bin/sandbox-exec','-p',seatbeltProfile(reads,tmp),...argv];
  // The launcher's own warnings would become the check's output.
  if(mode==='landlock')return [python,'-I','-W','ignore',landlockScript,...reads.flatMap(dir=>['--read',dir]),'--no-tcp','--',...argv];
  throw Error(`unknown sandbox ${mode}`);
}
// A line of a failed run's output that looks like the sandbox refused
// something: a refused read or write, or the network unreachable. Such a
// failure is run again outside the sandbox to tell a denial from a real one.
const denial=/operation not permitted|permission denied|read-only file system|\bE(?:PERM|ACCES|ROFS|NOTFOUND|AI_AGAIN|CONNREFUSED|NETUNREACH|HOSTUNREACH)\b|sandbox-exec:|landlock\.py:|network is unreachable|could not resolve host|name or service not known|nodename nor servname|temporary failure in name resolution|getaddrinfo|connection refused/i;
export function denialLine(text){
  for(const line of String(text).split(/\r?\n/))if(denial.test(line))return line.trim().slice(0,200);
  return null;
}

// Links in the .venv that lead out of the checkout, other than the
// interpreter's in bin/: REDUE cannot observe what they point to. Looks in
// the .venv itself, bin/, and the top of each site-packages.
export function venvOutsideLinks(root){
  const venv=path.join(root,'.venv'),found=[],realRoot=real(root)||root;
  const look=dir=>{let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
    for(const entry of entries){
      if(!entry.isSymbolicLink())continue;
      const file=path.join(dir,entry.name),rel=path.relative(root,file).split(path.sep).join('/');
      if(/^\.venv\/bin\/(?:python|pypy|𝜋thon)/.test(rel))continue;
      const target=real(file);
      if(!target||!within(target,realRoot))found.push(rel);
    }};
  look(venv);look(path.join(venv,'bin'));
  // lib64 is often a link to lib: looked at once.
  for(const lib of ['lib','lib64']){let versions=[];
    try{if(lib==='lib64'&&fs.lstatSync(path.join(venv,lib)).isSymbolicLink())continue;versions=fs.readdirSync(path.join(venv,lib));}catch{}
    for(const version of versions)look(path.join(venv,lib,version,'site-packages'));}
  return [...new Set(found)].sort();
}
// Plan qualification: the check is what `init` writes for the project now.
export function qualifySandbox(root,selected){
  const issues=[];
  if(!['darwin','linux'].includes(process.platform))issues.push('the sandboxed recipe runs on macOS and Linux only');
  if(!sandboxKinds.includes(selected.kind))issues.push(`the sandboxed recipe takes ${sandboxKinds.join(' and ')} checks`);
  if(selected.cwd&&selected.cwd!=='.')issues.push('the sandboxed recipe runs checks at the project root');
  const tool=pythonTool(selected);
  try{
    let dirs=[];
    if(tool){
      try{fs.accessSync(path.join(root,selected.command[0]),fs.constants.X_OK);}catch{fail(`${selected.command[0]} is not installed`);}
      const base=venvBase(root);
      if(!base.home||!base.executable)fail('.venv has no pyvenv.cfg home or bin/python');
      // The interpreter's own site-packages are not observed.
      if(/^include-system-site-packages\s*=\s*true\s*$/mi.test(fs.readFileSync(path.join(root,'.venv','pyvenv.cfg'),'utf8')))
        issues.push('.venv uses the system site-packages, which REDUE does not observe');
      for(const rel of venvOutsideLinks(root))issues.push(`${rel} links outside the checkout, where REDUE does not observe it`);
    }else{
      if(typeof selected.script!=='string')fail('script-missing');
      const project=scriptProject(root,selected.script);
      if(JSON.stringify(selected.command?.slice(1))!==JSON.stringify(['run',selected.script])||selected.environment?.pathExecutables?.[1]!==project.manager)
        issues.push('the package manager or script changed; run redue init again');
      dirs=project.dirs;
    }
    const expected=sandboxCheckInputs(dirs),sorted=list=>JSON.stringify([...(list||[])].sort());
    if(sorted(selected.inputs)!==sorted(expected.inputs)||sorted(selected.installedInputs)!==sorted(expected.installedInputs))
      issues.push('inputs must be the whole checkout, with node_modules and .venv observed as installed files; run redue init again');
    const environment=sandboxEnvironment(Boolean(tool));
    if(!environment.variables.every(key=>selected.environment?.variables?.includes(key))||
      !environment.prefixes.every(key=>selected.environment?.prefixes?.includes(key)))
      issues.push('execution context incomplete; run redue init again');
  }catch(e){issues.push(e.code||'sandboxed check prerequisites unavailable');}
  if(selected.probes?.length)issues.push('the sandboxed recipe takes no probes');
  if(selected.generatedInputs?.length)issues.push('the sandboxed recipe takes no generated inputs');
  return {qualified:issues.length===0,issues};
}
// Installed paths a sandboxed plan leaves out: the .venv's links that lead out
// of the checkout, which the index cannot observe. Qualification reports them.
export const sandboxInstalledExclusions=root=>venvOutsideLinks(root).map(rel=>`!${rel}`);
// A run's output for comparison: without colors, timings, the temporary and
// home directories each run had, and lines about caches, which differ
// between two runs of the same check (a task runner's cache hit).
const units='(?:ns|µs|us|ms|s|sec|secs|seconds?|m|min|mins|minutes?|h)';
export function comparableOutput(text,paths=[]){
  let out=String(text).replace(/\x1b\[[0-9;?]*[A-Za-z]/g,'');
  for(const [from,to] of paths.filter(([from])=>from).sort((a,b)=>b[0].length-a[0].length))out=out.split(from).join(to);
  return out.split(/\r?\n/).filter(line=>!/\bcache[ds]?\b|\bcached\b/i.test(line))
    .map(line=>line.replace(new RegExp(`\\d+(?:[.,]\\d+)?\\s?${units}\\b`,'g'),'<time>')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?\b/g,'<clock>').replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g,'<date>').trimEnd())
    .filter(Boolean).join('\n');
}
// `init` runs a proposed check both ways before it writes it: plainly, as the
// project would, and sandboxed. The check is proposed only when both give
// the same exit status and the same output (comparableOutput), and a failure
// shows no sign of a refusal by the sandbox; else the reason names the
// difference.
// Stops what a run left running when it ends, as a CI job's end does: the
// run's process group gets SIGTERM, and SIGKILL a second later if it still
// has members. Its pid is not signalled again once the group is empty, so a
// reused number is never hit. The timer keeps REDUE alive until then, and
// the promise settles then. On Linux the Landlock launcher also stops
// processes that left the group (landlock.py).
export function stopGroup(pid){
  const signal=name=>{try{process.kill(-pid,name);return true;}catch{return false;}};
  if(!signal('SIGTERM'))return Promise.resolve();
  const until=Date.now()+1000;
  return new Promise(resolve=>{const check=setInterval(()=>{
    if(!signal(0)){clearInterval(check);resolve();return;}
    if(Date.now()>=until){signal('SIGKILL');clearInterval(check);resolve();}
  },100);});
}
// A sandboxed run's end: when the command exits, what it left running is
// stopped, and its pipes are closed a second later, so a helper that holds
// them open does not hold the run.
export function endWithChild(child){
  child.on('exit',()=>{stopGroup(child.pid);setTimeout(()=>{child.stdout?.destroy();child.stderr?.destroy();},1000).unref();});
}
// Runs argv in its own process group to the end, with no terminal input:
// {status, signal, error, timedOut, stdout, stderr}, each output kept up to
// 64 MB and decoded at the end. `echo` also passes the output through.
// `started` gets the child, so a caller can forward signals to its group;
// without one, an interrupt stops the group and then REDUE.
const outputCap=64*1024*1024;
export function runToEnd(argv,{cwd,env,timeout=0,echo=false,started=null}){
  return new Promise(resolve=>{
    const kept={stdout:[],stderr:[]},size={stdout:0,stderr:0};
    let timer=null,timedOut=false;
    const child=spawn(argv[0],argv.slice(1),{cwd,env,detached:true,stdio:['ignore','pipe','pipe']});
    const stop=async name=>{process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
      await stopGroup(child.pid);process.kill(process.pid,name);};
    const interrupt=()=>stop('SIGINT'),terminate=()=>stop('SIGTERM');
    if(started)started(child);else{process.once('SIGINT',interrupt);process.once('SIGTERM',terminate);}
    for(const name of ['stdout','stderr'])child[name].on('data',chunk=>{
      if(echo)process[name].write(chunk);
      if(size[name]<outputCap){kept[name].push(chunk);size[name]+=chunk.length;}
    });
    if(timeout)timer=setTimeout(()=>{timedOut=true;stopGroup(child.pid);},timeout);
    endWithChild(child);
    const finish=value=>{clearTimeout(timer);process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
      resolve({...value,timedOut,stdout:Buffer.concat(kept.stdout).toString('utf8'),stderr:Buffer.concat(kept.stderr).toString('utf8')});};
    child.on('error',error=>finish({status:null,signal:null,error}));
    child.on('close',(status,signal)=>finish({status,signal}));
  });
}
// {same, plain, sandboxed, line} or {issue} when the sandbox cannot run here.
export async function sandboxTrial(root,check,{timeout=300000}={}){
  const supported=sandboxSupport();
  if(supported.issue)return {issue:supported.issue};
  const python=Boolean(pythonTool(check));
  const command=python?check.command:[lookup(scriptProject(root,check.script).manager,process.env.PATH,root)||'npm','run',check.script];
  const selected={...check,command,environment:sandboxEnvironment(python,python?null:scriptProject(root,check.script).manager)};
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'redue-trial-')),home=path.join(scratch,'home'),tmp=path.join(scratch,'tmp');
  fs.mkdirSync(home);fs.mkdirSync(tmp);
  try{
    const run=async(argv,env)=>{const r=await runToEnd(argv,{cwd:root,env,timeout});
      return {status:r.timedOut?'timeout':r.status??r.signal??r.error?.code,output:`${r.stdout}\n${r.stderr}`};};
    const plain=await run(command,{...process.env,...python?{}:{npm_config_update_notifier:'false'}});
    const reads=[root,home,tmp,...sandboxPlaces(selected,process.env,root),...systemPlaces];
    const sandboxed=await run(sandboxArgv(supported.mode,command,{reads,tmp,python:supported.python}),sandboxEnv(selected,process.env,{root,home,tmp}));
    // A failure both ways counts as the same only without a sign of a refusal.
    const denied=sandboxed.status===0?null:denialLine(sandboxed.output);
    const realOf=dir=>{try{return fs.realpathSync(dir);}catch{return null;}},plainTmp=process.env.TMPDIR||os.tmpdir();
    const paths=[[home,'<home>'],[realOf(home),'<home>'],[tmp,'<tmp>'],[realOf(tmp),'<tmp>'],[plainTmp,'<tmp>'],[realOf(plainTmp),'<tmp>'],
      [os.homedir(),'<home>'],[realOf(os.homedir()),'<home>']];
    const [a,b]=[plain,sandboxed].map(r=>comparableOutput(r.output,paths).split('\n'));
    // The first line that differs; past the end of the shorter output when one goes on.
    let at=a.findIndex((line,i)=>line!==b[i]);
    if(at<0&&b.length>a.length)at=a.length;
    const output=at<0?null:{plain:(a[at]??'(no more output)').slice(0,160),sandboxed:(b[at]??'(no more output)').slice(0,160)};
    return {same:plain.status===sandboxed.status&&!denied&&!output,plain:plain.status,sandboxed:sandboxed.status,output,
      line:denied||(plain.status===sandboxed.status?null:sandboxed.output.trim().split('\n').at(-1)?.slice(0,200)||null)};
  }finally{fs.rmSync(scratch,{recursive:true,force:true});}
}
