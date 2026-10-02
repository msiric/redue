import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import micromatch from 'micromatch';

const exists=file=>{try{fs.accessSync(file);return true;}catch{return false;}};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const scriptNames={
  typecheck:['typecheck','type-check','check:types','types:check'],
  test:['test','test:unit','test:check'],
  lint:['lint','lint:check'],
  build:['build'],
};
const sourceExtensions='**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}';
const likelyDirs=['src','app','apps','pages','lib','packages','test','tests','__tests__','scripts'];
const toolConfigs=['tsconfig.json','tsconfig.base.json','vite.config.ts','vite.config.js',
  'vitest.config.ts','vitest.config.js','jest.config.js','jest.config.ts',
  'eslint.config.js','eslint.config.mjs','.eslintrc','.eslintrc.json',
  '.eslintrc.js','.npmrc','.yarnrc.yml'];
function installedNpmVersion() {
  for(const folder of (process.env.PATH||'').split(path.delimiter)){
    try{
      const executable=fs.realpathSync(path.join(folder||process.cwd(),'npm'));
      const manifest=readJson(path.join(path.dirname(path.dirname(executable)),
        'package.json'));
      if(manifest.name==='npm')return manifest.version;
    }catch{}
  }
  return null;
}

function manager(root,pkg) {
  const declared=pkg.packageManager?.match(/^(npm|yarn|pnpm|bun)@([^+\s]+)/);
  const locks=['package-lock.json','npm-shrinkwrap.json','yarn.lock','pnpm-lock.yaml',
    'bun.lock','bun.lockb'].filter(name=>exists(path.join(root,name)));
  const kinds=new Set(locks.map(name=>name.startsWith('package-lock')||name==='npm-shrinkwrap.json'?
    'npm':name==='yarn.lock'?'yarn':name.startsWith('pnpm')?'pnpm':'bun'));
  if(declared)kinds.add(declared[1]);
  if(kinds.size!==1)return {name:null,version:declared?.[2]||null,layout:'unknown',
    issue:kinds.size?'package-manager declaration conflicts with lockfiles':
      'no supported lockfile or packageManager declaration'};
  const name=[...kinds][0],version=declared?.[1]===name?declared[2]:null;
  if(name==='pnpm'||name==='bun')return {name,version,layout:'unsupported',
    issue:`${name} installation layout is not supported in this alpha`};
  if(name==='npm')return {name,version:version||installedNpmVersion(),
    layout:'node-modules',issue:null,
    lockfiles:locks};
  const yarnrc=path.join(root,'.yarnrc.yml');
  if(!exists(yarnrc)){
    const classicLock=exists(path.join(root,'yarn.lock'))&&
      /^# yarn lockfile v1\s*$/m.test(fs.readFileSync(path.join(root,'yarn.lock'),'utf8').slice(0,256));
    const classic=version?.startsWith('1.')||(!version&&classicLock);
    return {name,version:version||null,layout:classic?'node-modules':'unknown',
      issue:!version?'Yarn version is not declared; Corepack may select a different version or edit package.json':
        classic?null:'Yarn linker is not declared; node-modules layout cannot be assumed',
      lockfiles:locks};
  }
  const text=fs.readFileSync(yarnrc,'utf8');
  const linker=text.match(/^\s*nodeLinker\s*:\s*['"]?([\w-]+)/m)?.[1];
  const mode=text.match(/^\s*nmMode\s*:\s*['"]?([\w-]+)/m)?.[1]||'classic';
  if(linker!=='node-modules')return {name,version,layout:linker||'unknown',
    issue:`Yarn ${linker||'unspecified'} linker is outside the node-modules alpha path`,
    lockfiles:locks};
  if(mode!=='classic')return {name,version,layout:`node-modules/${mode}`,
    issue:`Yarn nmMode ${mode} is not yet observed safely`,lockfiles:locks};
  return {name,version,layout:'node-modules/classic',issue:null,lockfiles:locks};
}
const exactTypeScript=script=>script.trim()==='tsc --noEmit';
function sourceLinkIssue(root) {
  const stack=likelyDirs.filter(name=>exists(path.join(root,name)));
  let inspected=0;
  while(stack.length){
    const rel=stack.pop(),full=path.join(root,rel);
    if(fs.lstatSync(full).isSymbolicLink())
      return `${rel} is a source link; declare its permitted observation boundary explicitly`;
    let entries;try{entries=fs.readdirSync(full,{withFileTypes:true});}
    catch{return `${rel} cannot be inspected; source input coverage needs review`;}
    for(const entry of entries){
      if(++inspected>100000)return 'source tree is too large for init link inspection';
      const child=`${rel}/${entry.name}`;
      if(entry.isSymbolicLink())return `${child} is a source link; declare its permitted observation boundary explicitly`;
      if(entry.isDirectory()&&!['.git','node_modules'].includes(entry.name))stack.push(child);
    }
  }
  return null;
}
function sourceInputs(root,kind,lockfiles) {
  const files=['package.json',...lockfiles,...toolConfigs.filter(name=>exists(path.join(root,name)))];
  if(kind==='typecheck')return [...new Set(['package.json',...lockfiles,
    'tsconfig.json',sourceExtensions,
    '!node_modules/**','!.git/**'])];
  const dirs=likelyDirs.filter(name=>exists(path.join(root,name)))
    .map(name=>`${name}/**`);
  return [...new Set([...files,...(dirs.length?dirs:['package.json'])])];
}
function classify(kind,scriptName,script,pkg,managerInfo,root) {
  const value=script.trim();
  if(managerInfo.issue)return {level:'unsupported',reason:managerInfo.issue};
  if(kind==='typecheck'&&exactTypeScript(value)&&
    !pkg.scripts?.['pre'+scriptName]&&!pkg.scripts?.['post'+scriptName]&&
    managerInfo.name==='npm'&&
    exists(path.join(root,'tsconfig.json'))&&
    exists(path.join(root,'node_modules/typescript/package.json')))
    return {level:'ready',reason:'canonical local tsc --noEmit; checked again before reuse',
      qualification:'typescript-noemit-v1'};
  if(kind==='typecheck')return {level:'recording',reason:
    'TypeScript invocation, installation, or configuration is outside the automatic noEmit contract'};
  if(kind==='test')return {level:'recording',reason:/\b(vitest|jest)\b/.test(value)?
    'test framework detected; caches, transforms and runtime inputs need review':
    'test script detected; runtime and generated inputs need review'};
  if(kind==='lint')return {level:'recording',reason:/\beslint\b/.test(value)?
    'ESLint detected; plugin/config and resolver inputs need review':
    'lint script detected; tool and config inputs need review'};
  return {level:'recording',reason:/\bvite\b/.test(value)?
    'Vite detected; build environment and generated inputs need review':
    'build script detected; generated and runtime inputs need review'};
}
function selectScript(kind,names,scripts) {
  const preferred=names.find(name=>typeof scripts[name]==='string'&&
    scripts[name].trim()&&!/^echo\s+["']?Error: no test specified/.test(scripts[name]));
  if(preferred)return {script:preferred};
  const candidates=Object.keys(scripts).filter(name=>{
    const value=scripts[name]?.trim();
    if(typeof value!=='string')return false;
    if(kind==='typecheck')return exactTypeScript(value);
    if(kind==='test')return /^(?:vitest|jest)(?:\s|$)/.test(value);
    if(kind==='lint')return /^eslint(?:\s|$)/.test(value);
    return /^vite\s+build(?:\s|$)/.test(value);
  });
  return candidates.length===1?{script:candidates[0]}:
    candidates.length>1?{ambiguous:candidates}:{};
}
function workspaceManifests(root,patterns) {
  const listing=spawnSync('git',['ls-files','--cached','--others','--exclude-standard',
    '-z','--',':(glob)**/package.json'],{cwd:root,encoding:'utf8',timeout:5000,
    maxBuffer:32*1024*1024,stdio:['ignore','pipe','ignore'],
    env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
  if(listing.status!==0||listing.error)throw Error('workspace package manifests cannot be inspected');
  const matched=listing.stdout.split('\0').filter(Boolean).filter(file=>{
    const dir=path.posix.dirname(file);
    return dir!=='.'&&!dir.split('/').includes('node_modules')&&
      micromatch.isMatch(dir,patterns,{dot:true});
  }).sort();
  if(matched.length>50)throw Error('more than 50 workspace packages found; select checks explicitly');
  return matched.map(file=>({file,pkg:readJson(path.join(root,file))}));
}
export function discoverNodeProject(root) {
  const packageFile=path.join(root,'package.json');
  if(!exists(packageFile))throw Error('run init from a repository containing package.json');
  const pkg=readJson(packageFile),pm=manager(root,pkg),scripts=pkg.scripts||{};
  const git=spawnSync('git',['rev-parse','--show-toplevel'],{cwd:root,
    encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']});
  const repositoryIssue=git.status===0?null:
    'Git checkout is unavailable; filesystem observation needs a checkout';
  const observationIssue=repositoryIssue||sourceLinkIssue(root);
  const workspaces=Boolean(pkg.workspaces);
  const workspacePatterns=Array.isArray(pkg.workspaces)?pkg.workspaces:
    pkg.workspaces?.packages;
  if(workspaces&&(!Array.isArray(workspacePatterns)||
    workspacePatterns.some(value=>typeof value!=='string'||path.isAbsolute(value)||
      value.split('/').includes('..'))))
    throw Error('workspace patterns need a supported project-relative package list');
  const checks=[],ambiguous=[];
  for(const [kind,names] of Object.entries(scriptNames)) {
    const selected=selectScript(kind,names,scripts),script=selected.script;
    if(selected.ambiguous)ambiguous.push({kind,scripts:selected.ambiguous});
    if(!script)continue;
    let classification=observationIssue?{level:'unsupported',reason:observationIssue}:
      classify(kind,script,scripts[script],pkg,pm,root);
    if(workspaces&&classification.level==='ready')classification={level:'recording',
      reason:'workspace task and installed-input closure need explicit qualification'};
    const check={name:kind,script,kind,inputs:sourceInputs(root,kind,pm.lockfiles||[])};
    if(classification.qualification)check.qualification=classification.qualification;
    checks.push({config:check,...classification});
  }
  if(workspaces&&!observationIssue){
    const seen=new Set();
    for(const {file,pkg:member} of workspaceManifests(root,workspacePatterns)){
      const dir=path.posix.dirname(file),name=member.name;
      if(typeof name!=='string'||!name||seen.has(name)){
        ambiguous.push({kind:'workspace',scripts:[dir],reason:'missing or duplicate package name'});
        continue;
      }
      seen.add(name);
      if(!['npm','yarn'].includes(pm.name))continue;
      for(const [kind,names] of Object.entries(scriptNames)){
        const selected=selectScript(kind,names,member.scripts||{});
        if(selected.ambiguous){ambiguous.push({kind:`${name}:${kind}`,
          scripts:selected.ambiguous});continue;}
        if(!selected.script)continue;
        const command=pm.name==='npm'?['@which:npm','run',selected.script,
          '--workspace',name]:['@which:yarn','workspace',name,'run',selected.script];
        const check={name:`${name}:${kind}`,kind,command,
          inputs:['package.json',...(pm.lockfiles||[]),`${dir}/**`,
            `!${dir}/node_modules/**`]};
        checks.push({config:check,level:pm.issue?'unsupported':'recording',
          reason:pm.issue||'workspace script found; shared configuration and installed inputs need review'});
      }
    }
  }
  return {schema:1,root,manager:pm,observationIssue,workspaces,node:process.version,
    checks,ambiguous,
    config:{schema:1,packageManager:pm.name||'unknown',checks:checks.map(row=>row.config)}};
}
