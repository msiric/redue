// The general recipe: a typecheck, test or lint script run through the
// project's package manager, recorded like the direct test recipe
// (test-direct.mjs). Its inputs are the whole checkout except installed files
// (observed by identity), runner caches and what the run itself writes, plus
// the package manager, Node, the exact script and the environment the run
// read. The recorder sees only Node processes, so every other program a run
// starts must be one REDUE can account for: a shell whose command, read as
// text, starts only Node programs, pnpm's launchers (pnpm-shims.mjs), or the
// pnpm executable. Anything else makes the result UNVERIFIED and names the
// program.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pnpmShimTarget} from './pnpm-shims.mjs';
import {testPackageManager,testWorkspaceDirs,testEnvironment} from './test-direct.mjs';

export const scriptQualification='node-script-v1';
export const scriptInterpretation='node-script@1';
export const scriptKinds=['typecheck','test','lint'];
const fail=code=>{throw Object.assign(Error(code),{code});};

// Runner caches in the checkout. They are not inputs, and a run may read and
// write them: ESLint's and Prettier's caches, TypeScript build info, the
// cache directories of Vite, Vitest, Jest, SWC, Parcel, Next.js, Angular,
// Turborepo and Nx, and the temporary files pnpm writes and removes in the
// project at every run (_tmp_<pid>_<random>).
export const scriptCaches=['**/_tmp_+([0-9])_+([0-9a-f])','**/.cache/**','**/.vite/**','**/.vite-temp/**','**/.vitest/**','**/.vitest-cache/**',
  '**/.turbo/**','**/.nx/**','**/.swc/**','**/.jest-cache/**','**/.parcel-cache/**','**/.angular/cache/**',
  '**/.next/cache/**','**/.tmp/**','**/*.tsbuildinfo','**/.eslintcache','**/.stylelintcache','**/.prettiercache'];
// Installed state a package manager reads at every run: pnpm's and Yarn's
// records inside node_modules are installed files already; Yarn's install
// state is kept beside them.
const installState=['.yarn/install-state.gz'];
const modulesDirs=dirs=>['node_modules',...dirs.map(dir=>`${dir}/node_modules`)];
// Inputs: the whole checkout but node_modules, .git and runner caches. Every
// node_modules of the workspace is observed as installed files, without the
// caches tools keep there.
export function scriptCheckInputs(dirs=[]){
  const modules=modulesDirs(dirs);
  return {inputs:['**',...modules.map(at=>`!${at}/**`),'!.git/**',...installState.map(file=>`!${file}`),
    ...scriptCaches.map(pattern=>`!${pattern}`)],
  installedInputs:[...modules.flatMap(at=>[`${at}/**`,`!${at}/.cache/**`,`!${at}/.vite/**`,`!${at}/.vite-temp/**`,
    `!${at}/.vitest/**`,`!${at}/.vitest-cache/**`,`!${at}/**/*.tsbuildinfo`]),...installState]};
}
// Installed files a tool rewrites during a run: the workspace state pnpm
// writes at the first run after an install, and the global types vue-tsc
// writes before it reads them, in a workspace node_modules. They stay inputs;
// when they are a run's only change and the run wrote them, the run is kept
// with the files as the run left them.
const pnpmState=rel=>/^node_modules\/\.pnpm-workspace-state(?:-v\d+)?\.json$/.test(rel);
const vueTypes=rel=>{const parts=rel.split('/');
  return /^[^/]+\.d\.ts$/.test(parts.at(-1))&&parts.at(-2)==='.vue-global-types'&&parts.at(-3)==='node_modules'&&
    !parts.slice(0,-3).includes('node_modules')&&!rel.startsWith('external:');};
export const toolOutputPath=rel=>pnpmState(rel)||vueTypes(rel);
// The run wrote it: a recorded process did, or the pnpm executable ran, which
// writes its state natively.
export const toolOutput=(rel,guard)=>toolOutputPath(rel)&&(guard.wroteInstalled(rel)||pnpmState(rel)&&guard.opaque);
// The installed paths the recorder treats as observed by identity.
export const scriptInstalledPaths=(root,dirs=[])=>[...modulesDirs(dirs),...installState].map(at=>path.join(root,at));
// Variables a recorded run cannot be seen reading: Node's and libc's (as in
// the test recipe), and the package managers' own, which npm reads by listing
// the environment and pnpm's executable reads natively. Every package
// manager's executable on PATH is identified, the project's first: a script
// may run another one.
const managers=['npm','pnpm','yarn','corepack'];
export function scriptEnvironment(manager){
  return {variables:[...testEnvironment.variables,'PATH','HOME','CI','XDG_CONFIG_HOME'],
    prefixes:[...testEnvironment.prefixes,'npm_config_','pnpm_config_','PNPM_','COREPACK_','YARN_'],
    pathExecutables:['node',manager,...managers.filter(name=>name!==manager)],executableIdentity:true};
}
// The configuration files the pnpm executable reads natively, outside the
// checkout: kept by content as run facts when it ran.
export function pnpmConfigFiles(env=process.env){
  const home=os.homedir(),config=path.isAbsolute(env.XDG_CONFIG_HOME||'')?env.XDG_CONFIG_HOME:
    process.platform==='darwin'?path.join(home,'Library','Preferences'):path.join(home,'.config');
  const prefix=path.dirname(path.dirname(process.execPath));
  return [...new Set([path.join(config,'pnpm','rc'),path.join(config,'pnpm','config.yaml'),path.join(home,'.config','pnpm','rc'),
    path.join(home,'.npmrc'),path.join(prefix,'etc','npmrc'),...(path.isAbsolute(env.npm_config_userconfig||'')?[env.npm_config_userconfig]:[])])];
}
// The project facts the recipe needs, or an error code: the package manager
// and the workspace package directories whose node_modules are installed.
export function scriptProject(root,script){
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const manager=testPackageManager(root,pkg,{workspaces:true});
  if(typeof pkg.scripts?.[script]!=='string'||!pkg.scripts[script].trim())fail('script-missing');
  return {manager,dirs:testWorkspaceDirs(root,pkg),text:pkg.scripts[script],scripts:pkg.scripts};
}

// The package managers' own installations, Corepack's downloads and npm's
// logs. They are toolchain, identified by the package manager's executable
// (pathExecutables), not inputs.
export function toolchainDirs(env=process.env){
  const dirs=new Set();
  for(const name of ['npm','npx','pnpm','pnpx','yarn','yarnpkg','corepack']){
    const file=lookup(name,env.PATH,process.cwd());
    const dir=file&&packageDir(file);
    if(dir)dirs.add(dir);
  }
  const home=os.homedir(),cache=path.isAbsolute(env.XDG_CACHE_HOME||'')?env.XDG_CACHE_HOME:path.join(home,'.cache');
  // Corepack's downloads, by version; lastKnownGood.json, which picks a
  // version, stays a file read outside the checkout.
  dirs.add(path.join(path.isAbsolute(env.COREPACK_HOME||'')?env.COREPACK_HOME:path.join(cache,'node','corepack'),'v1'));
  dirs.add(path.join(path.isAbsolute(env.npm_config_cache||'')?env.npm_config_cache:path.join(home,'.npm'),'_logs'));
  const real=dir=>{try{return fs.realpathSync(dir);}catch{return dir;}};
  return [...new Set([...dirs].flatMap(dir=>[path.resolve(dir),real(dir)]))];
}
// The package directory of an installed package manager's file: the nearest
// package.json named npm, pnpm, @pnpm/exe*, yarn or corepack.
function packageDir(file){
  for(let dir=path.dirname(file),i=0;i<5;i++,dir=path.dirname(dir)){
    try{const name=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8')).name;
      if(['npm','pnpm','yarn','corepack','@pnpm/exe'].includes(name)||/^@pnpm\/exe\./.test(name))return dir;
      return null;}
    catch{}
  }
  return null;
}
// A command name looked up along PATH as a shell does: the first executable
// file. Returns the real path, or null.
export function lookup(name,searchPath,cwd){
  const candidates=name.includes('/')?[path.resolve(cwd,name)]:
    String(searchPath??'').split(path.delimiter).map(dir=>path.join(path.resolve(cwd,dir||'.'),name));
  for(const file of candidates){
    try{const st=fs.statSync(file);if(st.isFile()&&(st.mode&0o111))return fs.realpathSync(file);}catch{}
    if(name.includes('/'))return null;
  }
  return null;
}
const head=file=>{
  let fd;try{fd=fs.openSync(file,'r');const buffer=Buffer.alloc(512);return buffer.subarray(0,fs.readSync(fd,buffer,0,512,0));}
  catch{return null;}finally{if(fd!==undefined)fs.closeSync(fd);}
};
const nativeMagic=buffer=>buffer?.length>=4&&(buffer[0]===0x7f&&buffer.toString('latin1',1,4)==='ELF'||
  [0xfeedface,0xfeedfacf,0xcefaedfe,0xcffaedfe,0xcafebabe].includes(buffer.readUInt32BE(0)));
// The pnpm executable: a native file named pnpm, pn or pnpm-native in the pnpm
// package (where Corepack downloads it beside pnpm's Node entry) or in an
// @pnpm/exe package. Returns its version, or null.
export function pnpmExecutable(file){
  if(!['pnpm','pn','pnpm-native'].includes(path.basename(file))||!nativeMagic(head(file)))return null;
  const dir=packageDir(file);
  try{const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
    return pkg.name!=='npm'&&pkg.name!=='yarn'&&pkg.name!=='corepack'&&typeof pkg.version==='string'?pkg.version:null;}
  catch{return null;}
}
// Yarn 2 and later run a package's bin through a wrapper they write into a
// temporary directory: `exec "NODE" 'BIN' "$@"`.
const yarnWrapper=/^#!\/bin\/sh\nexec "([^"$`\\\n]+)" ((?:'[^'\n]*'(?: '[^'\n]*')*)?) "\$@"\n$/;
export const yarnWrapperNode=text=>{const match=yarnWrapper.exec(text);return match?match[1]:null;};
// What a file run as a program is: 'node' for Node itself, a script Node runs
// by its #! line, a pnpm launcher or a Yarn bin wrapper; 'pnpm' for the pnpm
// executable; else null. `text` is the script as the run saw it, when known.
export function programKind(file,known=null){
  const base=path.basename(file),bytes=known!==null?Buffer.from(known):head(file);
  if(!bytes)return null;
  // Node itself is a native executable; a shim named node (asdf, nodenv) is a script.
  if(base==='node'||base==='nodejs')return nativeMagic(bytes)?'node':null;
  const text=bytes.toString('latin1');
  if(text.startsWith('#!')){
    const line=text.slice(2).split('\n')[0].trim().split(/\s+/);
    // #!/usr/bin/env node, #!/usr/bin/env -S node --flag, or a path to node.
    const words=path.basename(line[0]||'')==='env'?line.slice(1).filter(word=>word!=='-S'):line;
    if(['node','nodejs'].includes(path.basename(words[0]||'')))return 'node';
    if(!text.startsWith('#!/bin/sh\n'))return null;
    let script=known;if(script===null)try{script=fs.readFileSync(file,'utf8');}catch{return null;}
    if(pnpmShimTarget(file,script))return 'node';
    const node=yarnWrapperNode(script),real=node&&lookup(node,'','/');
    return real&&['node','nodejs'].includes(path.basename(node))&&programKind(real)==='node'?'node':null;
  }
  return pnpmExecutable(file)?'pnpm':null;
}

// A shell command line as simple commands of words, or {issue}. It accepts
// words, single and double quotes without expansions, &&, ||, ;, | and
// redirections to /dev/null or between descriptors. Anything that could
// change which program runs or read a file unseen (variables, command
// substitution, input redirection, subshells, here-documents) is refused.
export function parseCommandLine(text){
  const unsupported={issue:'the script uses shell syntax REDUE cannot read'};
  const commands=[];let words=[],word=null,glob=false;
  const end=()=>{if(word!==null){words.push({text:word,glob});word=null;glob=false;}};
  const separate=()=>{end();if(words.length)commands.push(words);words=[];};
  for(let i=0;i<text.length;i++){
    const c=text[i],rest=text.slice(i);
    if(c===' '||c==='\t'){end();continue;}
    if(c==='\n'||c===';'){separate();continue;}
    if(rest.startsWith('&&')||rest.startsWith('||')){separate();i++;continue;}
    if(c==='|'){separate();continue;}
    if(word===null){
      const redirect=/^(?:\d?>&\d|&?\d?>>? *\/dev\/null)(?=[\s;&|]|$)/.exec(rest);
      if(redirect){i+=redirect[0].length-1;continue;}
      if(c==='#'||c==='~'||c==='!')return unsupported;
    }
    if(c==="'"){const close=text.indexOf("'",i+1);if(close<0)return unsupported;word=(word??'')+text.slice(i+1,close);i=close;continue;}
    if(c==='"'){
      const close=text.indexOf('"',i+1);
      if(close<0||/[$`\\]/.test(text.slice(i+1,close)))return unsupported;
      word=(word??'')+text.slice(i+1,close);i=close;continue;
    }
    if('$`<>(){}\\&'.includes(c))return unsupported;
    if('*?['.includes(c))glob=true;
    word=(word??'')+c;
  }
  separate();
  return {commands};
}
// Variables a script may not set or clear: they would stop Node loading the
// recorder (npm and pnpm set NODE_OPTIONS from their node-options setting),
// or change which program a name runs.
const guarded=new Set(['NODE_OPTIONS','REDUE_RUN_RECORD','PATH','NPM_CONFIG_NODE_OPTIONS','PNPM_CONFIG_NODE_OPTIONS',
  'NPM_CONFIG_SCRIPT_SHELL','PNPM_CONFIG_SCRIPT_SHELL','BASH_ENV','ENV']);
const isGuarded=name=>guarded.has(name.toUpperCase().replace(/-/g,'_'));
// Node options that make Node read a file natively, where the recorder cannot see it.
const nativeReads=/^--(?:env-file|env-file-if-exists|experimental-config-file|experimental-default-config-file)(?:=|$)/;
const builtins=new Set(['cd','echo','true','false',':','exit','printf','set','export','unset','exec','command','wait','shift']);
// pnpm commands that are not scripts.
const pnpmCommands=new Set(['add','audit','bin','config','create','dedupe','deploy','dlx','doctor','env','fetch','i','import',
  'init','install','install-test','it','link','list','ln','ls','outdated','pack','patch','prune','publish','rebuild',
  'recursive','remove','rm','root','self-update','server','setup','store','uninstall','unlink','up','update','why','x']);
// The PATH a package manager gives a script in `dir`: every node_modules/.bin
// from the directory up, then the caller's.
export const scriptPath=(dir,callerPath)=>{
  const bins=[];for(let at=path.resolve(dir);;at=path.dirname(at)){bins.push(path.join(at,'node_modules','.bin'));if(path.dirname(at)===at)break;}
  return [...bins,callerPath??''].join(path.delimiter);
};
// Why a shell command line could start a program REDUE does not record, or
// null. Names are looked up along `searchPath` from `cwd`. A script the pnpm
// executable runs is read the same way, since the recorder cannot see it.
export function commandLineIssue(text,{cwd,searchPath,depth=0}={}){
  if(depth>8)return 'the scripts run each other too deeply for REDUE to read';
  const parsed=parseCommandLine(text);
  if(parsed.issue)return parsed.issue;
  let dir=cwd;
  for(let words of parsed.commands){
    words=[...words];
    while(words.length&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0].text)){
      const name=words.shift().text.split('=')[0];
      if(isGuarded(name))return `the script sets ${name}`;
    }
    for(;;){
      if(!words.length)break;
      const [first,...args]=words,name=first.text;
      if(first.glob)return 'the script uses shell syntax REDUE cannot read';
      if(builtins.has(name)){
        if(name==='export'||name==='unset'){
          const names=args.map(arg=>arg.text.split('=')[0]);
          const set=names.find(isGuarded);
          if(set)return `the script ${name==='unset'?'clears':'sets'} ${set}`;
        }
        if(name==='cd'){if(args.length===1&&!args[0].glob)dir=path.resolve(dir,args[0].text);else return 'the script uses shell syntax REDUE cannot read';}
        // `exec X` and `command X` run X; `command -v X` only looks it up;
        // `command -p X` runs X from a default PATH.
        if(name==='command'&&args[0]?.text==='-p')return 'the script uses shell syntax REDUE cannot read';
        if(name==='exec'||name==='command'&&args.length&&!args[0].text.startsWith('-')){words=args;continue;}
        break;
      }
      const file=lookup(name,searchPath,dir);
      if(!file)return `runs ${name}, which REDUE cannot find`;
      const kind=programKind(file);
      if(kind==='node'){
        const flag=['node','nodejs'].includes(path.basename(file))&&args.find(arg=>nativeReads.test(arg.text));
        if(flag)return `runs node ${flag.text.split('=')[0]}, which reads a file REDUE cannot see`;
        break;
      }
      if(kind==='pnpm'){const issue=pnpmRunIssue(args.map(arg=>arg.text),{cwd:dir,searchPath,depth});if(issue)return issue;break;}
      return `runs ${path.basename(name)}, which is not a Node program`;
    }
  }
  return null;
}
// What the pnpm executable runs for `args` in `cwd`: a package script, or a
// bin with `exec`. Each script it runs is read as text; pnpm's own commands,
// filters and recursive runs are refused.
export function pnpmRunIssue(args,{cwd,searchPath,depth=0}){
  const words=args.filter(arg=>!['--silent','-s','--reporter=silent'].includes(arg));
  if(words[0]&&words[0].startsWith('-'))return `runs pnpm ${words[0]}, which REDUE cannot follow`;
  let command=words[0]==='t'?'test':words[0],rest=words.slice(1);
  if(command==='run'){command=rest[0];rest=rest.slice(1);if(!command)return 'runs pnpm run without a script';}
  else if(command==='exec'){
    if(!rest[0]||rest[0].startsWith('-'))return 'runs pnpm exec in a form REDUE cannot follow';
    return commandLineIssue(rest.map(quote).join(' '),{cwd,searchPath:scriptPath(cwd,searchPath),depth:depth+1});
  }else if(!command||pnpmCommands.has(command))return `runs pnpm ${command||''}, which REDUE cannot follow`.replace(' ,',',');
  let scripts;
  try{scripts=JSON.parse(fs.readFileSync(path.join(cwd,'package.json'),'utf8')).scripts||{};}
  catch{return `runs pnpm ${command} where REDUE cannot read package.json`;}
  const inner={cwd,searchPath:scriptPath(cwd,searchPath),depth:depth+1};
  if(typeof scripts[command]!=='string'){
    // `pnpm NAME` with no such script runs the bin NAME.
    if(words[0]==='run')return `runs pnpm run ${command}, a script package.json does not define`;
    return commandLineIssue([command,...rest].map(quote).join(' '),inner);
  }
  for(const name of ['pre'+command,command,'post'+command]){
    if(typeof scripts[name]!=='string')continue;
    const issue=commandLineIssue(name===command&&rest.length?`${scripts[name]} ${rest.map(quote).join(' ')}`:scripts[name],inner);
    if(issue)return issue;
  }
  return null;
}
const quote=word=>/^[A-Za-z0-9_./:=,@+%^-]+$/.test(word)?word:`'${word.replace(/'/g,'')}'`;
const shells=new Set(['sh','bash','dash','zsh','ksh','mksh','fish','csh','tcsh']);
// Why a program a recorded process started (a C or S row) is not accounted
// for, or null; `needsHeader` says whether it must have loaded the recorder,
// and `opaque` that REDUE cannot see what it starts (the pnpm executable).
// `env` is what the child's environment says (test-recorder.cjs): a program
// that needs no recorder itself must pass it on. `toolchain` holds the
// package managers' directories; `parentMain` is the starting process's main
// script.
export function childProgram({file,args,cwd,searchPath,env=null,script=null},{toolchain=[],parentMain=null}={}){
  const resolved=script?.file??lookup(file,searchPath,cwd||process.cwd());
  const name=path.basename(file);
  if(!resolved)return {issue:`ran ${name}, which REDUE cannot find`};
  const passesRecorder=()=>env?.preload===true?null:
    {issue:`ran ${name} without REDUE's recorder in NODE_OPTIONS (a node-options setting replaces it)`};
  if(shells.has(path.basename(resolved))||shells.has(name)){
    // A non-interactive sh or dash reads no startup file; bash -c sources
    // BASH_ENV; zsh and the others always read their own files.
    if(!['sh','dash','bash'].includes(name)||name==='bash'&&env?.bashEnv!==false)
      return {issue:`ran ${name}, a shell that reads startup files REDUE cannot see`};
    if(!Array.isArray(args)||args[0]!=='-c'||typeof args[1]!=='string')return {issue:`ran ${name} in a form REDUE cannot read`};
    const issue=commandLineIssue(args[1],{cwd,searchPath});
    return issue?{issue}:passesRecorder()??{needsHeader:false};
  }
  const kind=programKind(resolved,typeof script?.text==='string'?script.text:null);
  if(kind==='node')return {needsHeader:true};
  if(kind==='pnpm'){const issue=pnpmRunIssue(args||[],{cwd,searchPath});return issue?{issue}:passesRecorder()??{needsHeader:false,opaque:true};}
  // pnpm, loaded into Corepack, lists processes to stop a script's children.
  const within=(item,dir)=>item===dir||item.startsWith(dir+path.sep);
  let main=null;try{main=parentMain&&fs.realpathSync(parentMain);}catch{}
  if(name==='ps'&&JSON.stringify(args)===JSON.stringify(['-A','-o','ppid,pid'])&&main&&toolchain.some(dir=>within(main,dir)))
    return {needsHeader:false};
  return {issue:`ran ${name}, a program REDUE does not record`};
}
// What a recorded run needs from the check: the workspace package directories
// whose node_modules its installed inputs list. The script must still exist.
export function scriptRunFacts(root,check){
  const dirs=(check.installedInputs||[]).map(p=>/^([^!*]+)\/node_modules\/\*\*$/.exec(p)?.[1]).filter(Boolean);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  if(typeof pkg.scripts?.[check.script]!=='string')fail('script-changed');
  return {dirs};
}
// Plan qualification: the check is what `init` writes for the project now.
export function qualifyNodeScript(root,selected){
  const issues=[];
  if(!['darwin','linux'].includes(process.platform))issues.push('the general recipe records runs on macOS and Linux only');
  try{
    if(selected.cwd&&selected.cwd!=='.')fail('the general recipe runs scripts at the project root');
    const project=scriptProject(root,selected.script);
    if(JSON.stringify(selected.command?.slice(1))!==JSON.stringify(['run',selected.script])||
      selected.environment?.pathExecutables?.[1]!==project.manager)
      issues.push('the package manager or script changed; run redue init again');
    const expected=scriptCheckInputs(project.dirs),sorted=list=>JSON.stringify([...(list||[])].sort());
    if(sorted(selected.inputs)!==sorted(expected.inputs)||sorted(selected.installedInputs)!==sorted(expected.installedInputs))
      issues.push('inputs must be the whole checkout, with every node_modules observed as installed files; run redue init again');
    const environment=scriptEnvironment(project.manager);
    if(!selected.environment?.executableIdentity||
      !environment.variables.every(key=>selected.environment?.variables?.includes(key))||
      !environment.prefixes.every(key=>selected.environment?.prefixes?.includes(key)))
      issues.push('execution context incomplete; run redue init again');
  }catch(e){issues.push(e.code||'script prerequisites unavailable');}
  if(selected.probes?.length)issues.push('the general recipe takes no probes');
  if(selected.generatedInputs?.length)issues.push('the general recipe takes no generated inputs');
  return {qualified:issues.length===0,issues};
}
