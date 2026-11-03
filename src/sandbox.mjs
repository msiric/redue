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
import picomatch from 'picomatch';

export const sandboxQualification='sandbox-v1';
export const sandboxInterpretation='sandbox@1';
// The same recipe with the checkout's git-ignored files hidden from the run
// (hiddenEntries): they are not its inputs, so build and test outputs do not
// make it STALE. init gives it when the run gives the same result that way.
export const hiddenQualification='sandbox-v2';
export const hiddenInterpretation='sandbox@2';
export const hiddenListIssue='git cannot list the ignored files';
// And the project's documentation hidden too (docPatterns): an agent edits it
// often, and a typecheck, lint or test suite seldom reads it.
export const docsQualification='sandbox-v3';
export const docsInterpretation='sandbox@3';
// Under docs/, only documentation files: code there (examples a typecheck
// includes) stays visible.
const docsFolderTypes=['txt','adoc','png','jpg','jpeg','gif','svg','webp','pdf'];
export const docPatterns=['**/*.md','**/*.mdx','**/*.rst','**/LICENSE*','**/CHANGELOG*',...docsFolderTypes.map(type=>`docs/**/*.${type}`)];
export const hiddenDocsIssue='git cannot list the documentation';
// What macOS refuses by path pattern: the extensions, in any case (Seatbelt
// matches regexes without regard to case). Every other listed file
// (LICENSE*, CHANGELOG*) it refuses by its path; a pattern would refuse
// license-check.ts too.
const docsByPattern=rel=>/^(.+\/)?[^/]*\.(md|mdx|rst)$/i.test(rel)||new RegExp(`^docs/(.+/)?[^/]*\\.(${docsFolderTypes.join('|')})$`,'i').test(rel);
// One path each makes the profile larger and slower to compile (1,000 add
// about 190 ms to a run; a few thousand do not compile). Past this many,
// those files stay visible and count as inputs, on every platform.
export const namedDocsLimit=100;
export const isSandboxed=qualification=>[sandboxQualification,hiddenQualification,docsQualification].includes(qualification);
// Whether the recipe hides the checkout's git-ignored entries (v2 and v3).
export const hidesIgnored=qualification=>qualification===hiddenQualification||qualification===docsQualification;
// A macOS test run has had no TCP since alpha.29: its own interpretation, so a
// result recorded with loopback is not the same plan.
export const sandboxInterpretationOf=(qualification,kind=null,platform=process.platform)=>
  (qualification===docsQualification?docsInterpretation:qualification===hiddenQualification?hiddenInterpretation:sandboxInterpretation)+
  (kind==='test'&&platform==='darwin'?'+no-tcp':'');
export const sandboxKinds=['typecheck','lint','test'];
// A test run gets a private /tmp (sandboxArgv's `writes`) and, on Linux,
// supervised loopback networking (`network`); a typecheck or lint, and a
// test run on macOS, get no network but Unix sockets.
export const testRun=check=>check?.kind==='test';
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
export function sandboxEnvironment(python=false,manager=null,kind=null){
  return {variables:['TZ','LANG','LANGUAGE','CI','USER','LOGNAME'],
    prefixes:['LC_','DYLD_','LD_',...python?['PYTHON','MYPY','RUFF_','PYRIGHT','TY_']:
      ['NODE_','npm_config_','PNPM_','YARN_','COREPACK_','TSGO_'],
      // A test runner's own variables.
      ...kind==='test'?python?['PYTEST_']:['VITEST_','JEST_']:[]],
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
// The files in the repository's .git that tools read to choose files (ruff's
// and biome's ignore rules), and that decide what sandbox-v2 hides: its
// exclude file and config. For a project in a subdirectory of the
// repository, also the .gitignore files above it. The observer watches
// neither, so they are compared as context.
function gitIgnoreSources(root){
  let top=root;
  while(!fs.existsSync(path.join(top,'.git'))){const up=path.dirname(top);if(up===top)return [];top=up;}
  let dir=path.join(top,'.git');
  try{if(fs.statSync(dir).isFile()){
    const gitdir=path.resolve(top,/^gitdir:\s*(.+)$/m.exec(fs.readFileSync(dir,'utf8'))?.[1].trim()??'');
    let common=gitdir;try{common=path.resolve(gitdir,fs.readFileSync(path.join(gitdir,'commondir'),'utf8').trim());}catch{}
    dir=common;}}catch{return [];}
  const read=file=>{try{return digest(fs.readFileSync(file));}catch{return null;}};
  const above=[];
  for(let at=path.dirname(root);top!==root&&(at===top||at.startsWith(top+path.sep));at=path.dirname(at)){
    above.push([path.relative(top,path.join(at,'.gitignore')),read(path.join(at,'.gitignore'))]);
    if(at===top)break;
  }
  return [...['info/exclude','config'].map(rel=>[rel,read(path.join(dir,rel))]),...above];
}
// What a sandboxed result depends on outside the observed files, compared
// before reuse, one entry each so a change can be named (sandboxChange): every
// variable the run gets (but its private directories and display variables),
// the places it may read, the identity of the toolchain's executables and of
// every directory on PATH (an installed or upgraded program changes its
// directory), and the ignore rules in .git.
export const sandboxPrefix='__redue_sandbox_';
export function sandboxContext(check,env,root){
  const identity=(file,keys=['dev','ino','mode','size','mtimeNs','ctimeNs'])=>{try{const st=fs.statSync(file,{bigint:true});
    return [file,...keys.map(key=>String(st[key]))];}catch{return [file,'<unavailable>'];}};
  const environment=sandboxEnv(check,env,{root,home:'<home>',tmp:'<tmp>'});
  for(const key of displayVariables)delete environment[key];
  const out={[`${sandboxPrefix}places__`]:digest(JSON.stringify(sandboxPlaces(check,env,root))),
    [`${sandboxPrefix}executables__`]:digest(JSON.stringify(toolchainExecutables(check,env,root).map(file=>file?identity(file):null))),
    [`${sandboxPrefix}git__`]:digest(JSON.stringify(gitIgnoreSources(root)))};
  for(const [key,value] of Object.entries(environment))out[`${sandboxPrefix}variable:${key}__`]=digest(value);
  for(const dir of environment.PATH.split(path.delimiter).filter(dir=>path.isAbsolute(dir)))
    out[`${sandboxPrefix}directory:${dir}__`]=digest(JSON.stringify(identity(dir,['dev','ino','mtimeNs','ctimeNs'])));
  return out;
}
// What changed between two sandboxed contexts, in words, or null.
export function sandboxChange(before={},now={}){
  const keys=[...new Set([...Object.keys(before),...Object.keys(now)])].filter(key=>key.startsWith(sandboxPrefix)).sort();
  const key=keys.find(key=>before[key]!==now[key]);
  if(!key)return null;
  const name=key.slice(sandboxPrefix.length,-2);
  return name==='places'?'the places a sandboxed run may read changed':
    name==='executables'?'Node, a package manager or the interpreter changed':
    name==='git'?'.git/info/exclude or .git/config changed':
    name.startsWith('variable:')?`environment variable ${name.slice(9)} differs from the last run`:
    !(key in now)?`PATH no longer has directory ${name.slice(10)}`:!(key in before)?`PATH has a new directory ${name.slice(10)}`:
    `PATH directory ${name.slice(10)} changed (a program in it was installed, removed or upgraded)`;
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

// The checkout's git-ignored entries a run may be kept from reading: what
// `git ls-files --others --ignored --exclude-standard --directory` lists (a
// wholly ignored directory as one entry, ending in /), but the installed
// trees (node_modules, .venv) and runner caches. Relative to root. null when
// git cannot list them. Only the project's rules count (.gitignore files and
// .git/info/exclude), not a user's global excludes file, as on CI.
const installedTree=/(?:^|\/)(?:node_modules|\.venv)(?:\/|$)/;
const runnerCache=picomatch(sandboxCaches,{dot:true});
const projectGit=['-c','core.excludesFile=/dev/null'],gitEnv=()=>({...process.env,GIT_OPTIONAL_LOCKS:'0'});
export function hiddenEntries(root){
  const r=spawnSync('git',[...projectGit,'ls-files','-z','--others','--ignored','--exclude-standard','--directory'],
    {cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,timeout:60000,stdio:['ignore','pipe','ignore'],env:gitEnv()});
  if(r.status!==0)return null;
  return r.stdout.split('\0').filter(Boolean).filter(rel=>!installedTree.test(rel)&&
    !runnerCache(rel)&&!runnerCache(rel.replace(/\/$/,'')+'/x'));
}

// The documentation files docPatterns names among the files git lists and
// does not ignore (git-ignored ones are hidden as such), as regular files:
// a link is not hidden. Files, never folders, so a folder stays listable.
// Relative; null when git cannot tell. git filters by pathspec, so a large
// checkout is not listed whole.
const docMatch=picomatch(docPatterns,{dot:true});
export function hiddenDocs(root){
  const r=spawnSync('git',[...projectGit,'ls-files','-z','--cached','--others','--exclude-standard','--',...docPatterns.map(pattern=>`:(glob)${pattern}`)],
    {cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,timeout:60000,stdio:['ignore','pipe','ignore'],env:gitEnv()});
  if(r.status!==0)return null;
  const out=new Set();
  for(const rel of r.stdout.split('\0'))if(rel&&!out.has(rel)&&docMatch(rel))
    try{if(fs.lstatSync(path.join(root,rel)).isFile())out.add(rel);}catch{}
  const named=[...out].filter(rel=>!docsByPattern(rel));
  if(named.length>namedDocsLimit)for(const rel of named)out.delete(rel);
  return [...out].sort();
}

// What git lists now as ignored at or beneath `paths` (relative files, or
// directories ending in /), as hiddenEntries would: nested repositories are
// not entered, and an entry that is an installed tree is not ignored (one
// inside an ignored build directory is). {has(rel)} for a file, or null when
// git cannot tell. A directory git ignores holds no file it does not, so
// asking a new directory once covers its files.
export function ignoredNow(root,paths){
  const asked=paths;
  if(!asked.length)return {has:()=>false};
  const listed=new Set();
  for(let at=0;at<asked.length;at+=500){
    const r=spawnSync('git',[...projectGit,'ls-files','-z','--others','--ignored','--exclude-standard','--directory','--',...asked.slice(at,at+500)],
      {cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,timeout:10000,stdio:['ignore','pipe','ignore'],env:gitEnv()});
    if(r.status!==0)return null;
    for(const entry of r.stdout.split('\0'))if(entry)listed.add(entry);
  }
  const entries=[...listed].filter(entry=>!installedTree.test(entry));
  return {has:rel=>entries.some(entry=>rel===entry||entry.endsWith('/')&&rel.startsWith(entry))};
}
// The files git tracks now beneath `entries` (relative). null when git cannot tell.
export function trackedBeneath(root,entries){
  if(!entries.length)return new Set();
  const r=spawnSync('git',['ls-files','-z','--cached','--',...entries],
    {cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,timeout:10000,stdio:['ignore','pipe','ignore'],env:gitEnv()});
  return r.status===0?new Set(r.stdout.split('\0').filter(Boolean)):null;
}
// For a run that hid `hidden` (relative entries), the first path of `paths`
// that changes its inputs, between `before` and `current` ({rel: identity}),
// or null. A file the run saw always counts. A file beneath a hidden entry
// counts only once git tracks it, and a new file only when git does not list
// it as ignored now, as the next run's hidden entries would not. When git
// cannot tell, every change counts. `external:` paths always count. With
// `during` (changes while the run ran), a new file outside the hidden
// entries counts too: the run could read it.
// With `docs` (sandbox@3: the documentation files the run hid, relative), a
// later change to one of those files does not count. A new documentation
// file does, and so does any change while the run ran: the run is not shown
// to have been kept from it.
export function visibleChange(root,hidden,before,current,paths,{during=false,docs=null}={}){
  const entries=hidden.map(entry=>entry.replace(/\/$/,''));
  const beneath=file=>entries.some(entry=>file===entry||file.startsWith(entry+'/'));
  const hiddenDoc=new Set(during?[]:docs||[]);
  const changed=[...new Set(paths)].filter(file=>before[file]!==current[file]&&!hiddenDoc.has(file)).sort();
  const seen=changed.filter(file=>file in before&&!beneath(file));
  if(seen.length)return seen[0];
  const covered=changed.filter(beneath),fresh=changed.filter(file=>!(file in before)&&!beneath(file));
  if(covered.length){
    const tracked=trackedBeneath(root,entries.filter(entry=>covered.some(file=>file===entry||file.startsWith(entry+'/'))));
    const found=covered.find(file=>!tracked||tracked.has(file));
    if(found)return found;
  }
  if(!fresh.length)return null;
  if(during)return fresh[0];
  // Asked once per directory the run had no file in, then the files outside one.
  const dirs=new Set(Object.keys(before).flatMap(file=>file.split('/').slice(0,-1).map((_,i,parts)=>parts.slice(0,i+1).join('/'))));
  const newDir=file=>{const parts=file.split('/');for(let i=1;i<parts.length;i++){const dir=parts.slice(0,i).join('/');if(!dirs.has(dir))return dir+'/';}return null;};
  const ignored=ignoredNow(root,[...new Set(fresh.filter(file=>!file.startsWith('external:')).map(file=>newDir(file)??file))]);
  return fresh.find(file=>file.startsWith('external:')||!ignored||!ignored.has(file))??null;
}
// A refusal line that names a hidden entry (relative): a refusal by the
// sandbox, or a missing file, which Linux tools report for an unreadable one.
export function hiddenRefusal(text,hidden){
  const names=hidden.map(file=>file.replace(/\/$/,'')).filter(Boolean)
    .map(name=>new RegExp(`(?:^|[\\s'"\`(=/])${escape(name)}(?:[/\\s'"\`):,]|$)`));
  for(const line of String(text).split(/\r?\n/))
    if((denial.test(line)||missing.test(line))&&names.some(name=>name.test(line)))return line.trim().slice(0,200);
  return null;
}

const ancestors=list=>[...new Set(list.flatMap(dir=>{const out=[];for(let at=path.dirname(dir);at!=='/'&&at!=='.';at=path.dirname(at))out.push(at);return out;}))];
// The Seatbelt profile: reads and executes only beneath the places, the
// metadata of their parent directories, and no network but Unix sockets in
// the run's own temporary directory (`own`), which is new for each run: a
// daemon an earlier run left behind cannot answer a later one. `hidden`:
// absolute paths whose contents it may not read or execute.
// A test run gets no TCP either: Seatbelt cannot refuse one loopback port
// while allowing the others (a per-port deny under a loopback allow is not
// applied; an allow list of 65,000 ports does not compile), so a suite could
// reach a database started outside the run. A suite that needs loopback
// fails init's trial and runs plainly. With `writes`, a test run writes
// nothing beneath /tmp and /var/tmp but beneath those places (its checkout,
// home and own temporary directory).
// `docs` ({root, entries}): the checkout's documentation it may not read,
// regular files only, so folders stay listable. Extensions go by path
// pattern, so the profile stays small however many files match: every file
// hiddenDocs lists, and more (one in node_modules, README.MD). Seatbelt
// matches a regex without regard to case, so LICENSE* and CHANGELOG* go by
// the files hiddenDocs listed: a pattern would hide license-check.ts too.
export function seatbeltProfile(reads,own=null,hidden=[],{writes=null,docs=null}={}){
  const quote=value=>JSON.stringify(value);
  const both=list=>[...new Set(list.flatMap(dir=>[dir,real(dir)]).filter(Boolean))];
  const all=[...new Set(reads.flatMap(dir=>[dir,real(dir)]).filter(Boolean))];
  return ['(version 1)','(allow default)','(deny file-read* process-exec*)',
    `(allow file-read* process-exec* ${all.map(dir=>`(subpath ${quote(dir)})`).join(' ')} (literal "/") (literal "/etc") (literal "/var") (literal "/tmp"))`,
    `(allow file-read-metadata ${ancestors(all).map(dir=>`(literal ${quote(dir)})`).join(' ')})`,
    // The entry's own path, by its directory's real path: a hidden link's target is not hidden.
    // Its contents only, as on Linux: a run may still see that it exists, and write beneath it.
    ...hidden.length?[`(deny file-read-data process-exec* ${[...new Set(hidden.flatMap(file=>[file,path.join(real(path.dirname(file))??path.dirname(file),path.basename(file))]))]
      .map(file=>`(subpath ${quote(file)})`).join(' ')})`]:[],
    ...docs?[docsRule(docs,both([docs.root]))]:[],
    '(deny network*)',...own?[`(allow network* ${[own,real(own)].filter(Boolean).map(dir=>`(subpath ${quote(dir)})`).join(' ')})`]:[],
    ...writes?['(deny file-write* (subpath "/tmp") (subpath "/private/tmp") (subpath "/var/tmp") (subpath "/private/var/tmp"))',
      `(allow file-write* ${both(writes).map(dir=>`(subpath ${quote(dir)})`).join(' ')})`]:[]].join('\n');
}
// docsByPattern's patterns for each root, and each listed file they do not cover by its path.
function docsRule(docs,roots){
  const named=docs.entries.filter(rel=>!docsByPattern(rel));
  const patterns=roots.map(dir=>escape(dir)).flatMap(dir=>[`^${dir}/(.+/)?[^/]*\\.(md|mdx|rst)$`,`^${dir}/docs/(.+/)?[^/]*\\.(${docsFolderTypes.join('|')})$`])
    .map(pattern=>`(regex #"${pattern.replace(/"/g,'\\"')}")`);
  const files=roots.flatMap(dir=>named.map(rel=>`(literal ${JSON.stringify(path.join(dir,rel))})`));
  return `(deny file-read-data process-exec* (require-all (vnode-type REGULAR-FILE) (require-any ${[...patterns,...files].join(' ')})))`;
}
// The argv that runs `argv` sandboxed: reads beneath `reads`, no network but
// Unix sockets beneath `tmp` on macOS, nothing beneath `hidden` (absolute).
// On Linux a hidden directory can still be listed and its entries stat'ed:
// Landlock restricts neither beneath a listable parent.
// `network` "loopback" and `writes`: a test run's. Only Linux gives it a
// network (seatbeltProfile says why macOS does not), supervised: `stats`
// then says whether the supervisor served the whole run (supervisorIssue).
// `docs` ({root, entries}): the checkout's documentation, hidden too.
export function sandboxArgv(mode,argv,{reads,tmp=null,python,hidden=[],stats=null,network='none',writes=null,fault=null,docs=null}){
  if(mode==='seatbelt')return ['/usr/bin/sandbox-exec','-p',seatbeltProfile(reads,tmp,hidden,{writes,docs}),...argv];
  if(docs)hidden=[...hidden,...docs.entries.map(rel=>path.join(docs.root,rel.replace(/\/$/,'')))];
  // The launcher's own warnings would become the check's output.
  if(mode==='landlock')return [python,'-I','-W','ignore',landlockScript,...reads.flatMap(dir=>['--read',dir]),
    ...hidden.flatMap(file=>['--hide',file]),...stats?['--stats',stats]:[],
    ...network==='loopback'?['--loopback']:['--no-tcp'],
    ...writes?['--deny-write','/tmp','--deny-write','/var/tmp',...writes.flatMap(dir=>['--write',dir])]:[],
    ...fault?['--test-fault',fault]:[],'--',...argv];
  throw Error(`unknown sandbox ${mode}`);
}
// Why a supervised run's network was not supervised throughout, from the
// launcher's stats file, or null when it was.
export function supervisorIssue(stats){
  let value=null;try{value=JSON.parse(fs.readFileSync(stats,'utf8'));}catch{}
  return value?.supervisor==='ok'?null:`the network supervisor ${value?.supervisor?`reported: ${value.supervisor}`:'left no report'}`;
}
// The counts a test runner's summary gives, the last of each: pytest, Vitest,
// Jest, Mocha, node --test.
const ansi=/\u001b\[[0-9;]*m/g;
export function testCounts(text){
  const plain=String(text).replace(ansi,'');
  const last=(...patterns)=>{for(const re of patterns){let m,v=null;const g=new RegExp(re,'gim');while((m=g.exec(plain)))v=Number(m[1]);if(v!==null)return v;}return null;};
  return {passed:last('(\\d+) (?:tests? )?(?:passed|passing)\\b','^(?:#|ℹ) pass (\\d+)'),failed:last('(\\d+) (?:tests? )?(?:failed|failing)\\b','^(?:#|ℹ) fail (\\d+)'),
    skipped:last('(\\d+) (?:tests? )?(?:skipped|pending|todo)\\b','^(?:#|ℹ) (?:skip|skipped) (\\d+)')};
}
// A line of a failed run's output that looks like the sandbox refused
// something: a refused read or write, or the network unreachable. Such a
// failure is run again outside the sandbox to tell a denial from a real one.
const denial=/operation not permitted|permission denied|read-only file system|\bE(?:PERM|ACCES|ROFS|NOTFOUND|AI_AGAIN|CONNREFUSED|NETUNREACH|HOSTUNREACH)\b|sandbox-exec:|landlock\.py:|network is unreachable|could not resolve host|name or service not known|nodename nor servname|temporary failure in name resolution|getaddrinfo|connection refused/i;
// A missing file counts only when the line names a path the run was kept
// from (`hidden`, relative to the checkout or absolute): Linux tools report
// an unreadable file as not found.
const missing=/not found|no such file|cannot find|can't find|could not find|cannot read|\bENOENT\b/i;
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function denialLine(text,hidden=[]){
  // A name as a whole path or path component, not inside a longer word.
  const names=hidden.map(file=>file.replace(/\/$/,'')).filter(Boolean)
    .map(name=>new RegExp(`(?:^|[\\s'"\`(=/])${escape(name)}(?:[/\\s'"\`):,]|$)`));
  for(const line of String(text).split(/\r?\n/))
    if(denial.test(line)||missing.test(line)&&names.some(name=>name.test(line)))return line.trim().slice(0,200);
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
// The line that shows a run that failed in the sandbox, and passed outside
// it, was refused a file it hid, when nothing else differs that a refusal
// could explain: no other refusal line, no supervisor issue, and not a line
// the plain run printed too. A run without the hiding then could only fail
// where the plain one passes, never pass where it fails.
function refusedHidden(plain,sandboxed,entries,supervisor){
  if(plain.status!==0||supervisor||!entries.length)return null;
  const line=hiddenRefusal(sandboxed.output,entries);
  if(!line||plain.output.includes(line))return null;
  const others=sandboxed.output.split(/\r?\n/).filter(text=>!hiddenRefusal(text,entries)).join('\n');
  return denialLine(others)?null:line;
}
// init's limit on each trial run, in ms; a test can shorten it.
export const trialLimit=process.env.VSTATE_TEST_FAULTS==='1'&&Number(process.env.VSTATE_TEST_TRIAL_LIMIT)||300000;
// {same, plain, sandboxed, line, refusedHidden, timedOut} or {issue} when the sandbox cannot run here.
// A run that reaches `timeout` (0: none) is never the same as another:
// `timedOut` says which, and when the plain run does, no sandboxed run follows.
// With `hide` 'docs', the documentation (hiddenDocs) is hidden too.
// With `hide`, the git-ignored entries hiddenEntries lists are kept from the
// sandboxed run, and it also returns them, their count, the run times and, on
// Linux, the launcher's rule count and setup time.
// `plain`: the plain run of an earlier trial of the same check, reused.
export async function sandboxTrial(root,check,{timeout=trialLimit,hide=false,plain:earlier=null}={}){
  const supported=sandboxSupport();
  if(supported.issue)return {issue:supported.issue};
  const python=Boolean(pythonTool(check));
  const command=python?check.command:[lookup(scriptProject(root,check.script).manager,process.env.PATH,root)||'npm','run',check.script];
  const selected={...check,command,environment:sandboxEnvironment(python,python?null:scriptProject(root,check.script).manager,check.kind)};
  const tests=testRun(check);
  // A test run's home is beneath its temporary directory, as in cli.mjs: on
  // macOS that is where its Unix sockets may be.
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'redue-trial-')),tmp=path.join(scratch,'tmp'),home=tests?path.join(tmp,'home'):path.join(scratch,'home');
  fs.mkdirSync(tmp);fs.mkdirSync(home);
  try{
    const ignored=hide?hiddenEntries(root):[],docEntries=hide==='docs'?hiddenDocs(root):[];
    if(!ignored)return {issue:hiddenListIssue};
    if(!docEntries)return {issue:hiddenDocsIssue};
    const entries=[...ignored,...docEntries];
    const hidden=ignored.map(rel=>path.join(root,rel.replace(/\/$/,""))),stats=(hide||tests)&&supported.mode==='landlock'?path.join(scratch,'stats.json'):null;
    const run=async(argv,env)=>{const started=Date.now(),r=await runToEnd(argv,{cwd:root,env,timeout});
      return {status:r.timedOut?'timeout':r.status??r.signal??r.error?.code,output:`${r.stdout}\n${r.stderr}`,ms:Date.now()-started};};
    const plain=earlier??await run(command,{...process.env,...python?{}:{npm_config_update_notifier:'false'}});
    if(plain.status==='timeout')return {same:false,plain:'timeout',sandboxed:null,timedOut:'plain',line:null,refusedHidden:null,plainRun:plain};
    const reads=[root,home,tmp,...sandboxPlaces(selected,process.env,root),...systemPlaces];
    const sandboxed=await run(sandboxArgv(supported.mode,command,{reads,tmp,python:supported.python,hidden,stats,
      ...hide==='docs'?{docs:{root,entries:docEntries}}:{},
      ...tests?{...supported.mode==='landlock'?{network:'loopback'}:{},writes:[root,home,tmp]}:{}}),sandboxEnv(selected,process.env,{root,home,tmp}));
    // A test run's network was supervised throughout, on Linux.
    const supervisor=tests&&stats?supervisorIssue(stats):null;
    // A failure both ways counts as the same only without a sign of a refusal.
    const denied=sandboxed.status===0?null:denialLine(sandboxed.output,entries);
    const realOf=dir=>{try{return fs.realpathSync(dir);}catch{return null;}},plainTmp=process.env.TMPDIR||os.tmpdir();
    const paths=[[home,'<home>'],[realOf(home),'<home>'],[tmp,'<tmp>'],[realOf(tmp),'<tmp>'],[plainTmp,'<tmp>'],[realOf(plainTmp),'<tmp>'],
      [os.homedir(),'<home>'],[realOf(os.homedir()),'<home>']];
    const [a,b]=[plain,sandboxed].map(r=>comparableOutput(r.output,paths).split('\n'));
    // The first line that differs; past the end of the shorter output when one goes on.
    let at=a.findIndex((line,i)=>line!==b[i]);
    if(at<0&&b.length>a.length)at=a.length;
    const output=at<0?null:{plain:(a[at]??'(no more output)').slice(0,160),sandboxed:(b[at]??'(no more output)').slice(0,160)};
    let launcher=null;if(stats)try{launcher=JSON.parse(fs.readFileSync(stats,'utf8'));}catch{}
    // Tests print in an order their workers decide: the counts their summary
    // gives are compared, not every line.
    // When neither summary can be read, every line is compared, as for a typecheck.
    const counts=tests?[plain,sandboxed].map(r=>testCounts(r.output)):null;
    const read=counts?.some(c=>Object.values(c).some(value=>value!==null));
    const differs=tests&&read?(JSON.stringify(counts[0])===JSON.stringify(counts[1])?null:{plain:JSON.stringify(counts[0]),sandboxed:JSON.stringify(counts[1])}):output;
    const timedOut=sandboxed.status==='timeout'?'sandboxed':null;
    const same=!timedOut&&plain.status===sandboxed.status&&!denied&&!differs&&!supervisor;
    return {same,plain:plain.status,sandboxed:sandboxed.status,output:differs,plainRun:plain,timedOut,
      line:supervisor||denied||(plain.status===sandboxed.status?null:sandboxed.output.trim().split('\n').at(-1)?.slice(0,200)||null),
      refusedHidden:same?null:refusedHidden(plain,sandboxed,entries,supervisor),
      ...hide?{hidden:entries.length,entries,docs:docEntries.length,plainMs:plain.ms,sandboxedMs:sandboxed.ms,...launcher?{rules:launcher.rules,setupMs:launcher.ms}:{}}:{}};
  }finally{fs.rmSync(scratch,{recursive:true,force:true});}
}
