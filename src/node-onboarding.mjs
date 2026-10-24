import {directProject,directQualification} from './direct-typescript.mjs';
import {testProject,testRecipeScript,testCheckInputs,testEnvironmentIssue,testsQualification} from './test-direct.mjs';
import {commandLineIssue,scriptCheckInputs,scriptKinds,scriptPath,scriptProject,scriptQualification} from './node-script.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {yarnWorkspaceTypecheckInputs} from './yarn-workspace-inputs.mjs';
import {pnpmInstallInfo,pnpmProjectInfo,pnpmTypecheckInputs} from './pnpm-inputs.mjs';
import {realObservedPath} from './path-identity.mjs';
import {findExecutable} from './executable-lookup.mjs';
import {workspaceManifests} from './workspace-manifests.mjs';
import {partName,tscRuns} from './typescript-invocation.mjs';

const exists=file=>{try{fs.accessSync(file);return true;}catch{return false;}};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const scriptNames={
  typecheck:['typecheck','type-check','check:types','types:check','check-types'],
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
  try{
    const executable=findExecutable('npm');
    if(!executable)return null;
    const manifest=readJson(process.platform==='win32'?
      path.join(path.dirname(executable),'node_modules','npm','package.json'):
      path.join(path.dirname(path.dirname(executable)),'package.json'));
    if(manifest.name==='npm')return manifest.version;
  }catch{}
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
  if(name==='bun')return {name,version,layout:'unsupported',
    issue:'bun installation layout is not supported in this alpha'};
  if(name==='pnpm'){
    try{const installed=pnpmInstallInfo(root);
      return {name,version:installed.version,
        layout:`node-modules/${installed.linker}`,issue:null,lockfiles:locks,
        workspacePatterns:installed.patterns};}
    catch(e){let project;try{project=pnpmProjectInfo(root);}catch{}
      return {name,version:project?.version||version,
        layout:project?.linker||'recording-only',issue:e.message,
        lockfiles:locks,workspacePatterns:project?.patterns||[]};}
  }
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
// A script of tsc runs that each pass --noEmit (typescript-invocation.mjs).
const noEmitRuns=script=>Boolean(tscRuns(script)?.every(run=>run.noEmit));
// Ready checks for a typecheck, one per tsc run: the script's runs (a chain
// gives NAME.1 ... NAME.n), or with no script one proposed `tsc --noEmit`.
// `make(run)` returns a run's command, cwd and inputs, or throws why its
// contract does not hold.
function tscChecks(name,script,scripts,make){
  const runs=script===null?[{args:['--noEmit']}]:tscRuns(scripts[script]);
  if(!runs)throw Error('the script is not tsc runs in a supported form');
  return runs.map(({args},i)=>({name:partName(name,i+1,runs.length),
    ...(script===null?{}:{script}),...make({script,args,count:runs.length})}));
}
// A proposed `tsc --noEmit` only where nothing typechecks already: a script
// that runs any TypeScript checker in another form (tsc -b, vue-tsc,
// svelte-check, tsgo, also quoted or wrapped by concurrently or run-p) is the
// project's own typecheck, which plain tsc would not match.
const typeChecker=/(?:^|[^\w-])(?:tsc|vue-tsc|tsgo|svelte-check|tsc-watch)(?=$|[^\w-])|\bastro check\b|\bnuxi typecheck\b/;
const typechecks=scripts=>Object.values(scripts||{}).some(text=>typeof text==='string'&&typeChecker.test(text));
const proposable=(dir,scripts)=>exists(path.join(dir,'tsconfig.json'))&&!typechecks(scripts);
// The inputs a TypeScript contract adds to its check's config: no exclusions,
// which would outlive the tsconfig they came from; the plan adds the current ones.
const contractInputs=contract=>[...contract.configs,...contract.sourcePatterns.filter(p=>!p.startsWith('!'))];
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
  if(managerInfo.issue)return {level:managerInfo.name==='pnpm'?'recording':'unsupported',
    reason:managerInfo.issue};
  if(kind==='typecheck'&&exactTypeScript(value)&&
    !pkg.scripts?.['pre'+scriptName]&&!pkg.scripts?.['post'+scriptName]&&
    managerInfo.name==='npm'&&
    exists(path.join(root,'tsconfig.json'))&&
    exists(path.join(root,'node_modules/typescript/package.json')))
    return {level:'recording',reason:'npm launcher uses unobserved remote/cache/time inputs; execution can be recorded, but cannot be reused',
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
    if(kind==='typecheck')return noEmitRuns(value);
    if(kind==='test')return /^(?:vitest|jest)(?:\s|$)/.test(value);
    if(kind==='lint')return /^eslint(?:\s|$)/.test(value);
    return /^vite\s+build(?:\s|$)/.test(value);
  });
  // A lone plain `tsc --noEmit` wins over other tsc shapes beside it (a
  // project's `typescript` next to `typescript:tests:raw`).
  const exact=kind==='typecheck'?candidates.filter(name=>exactTypeScript(scripts[name])):[];
  if(exact.length===1)return {script:exact[0]};
  return candidates.length===1?{script:candidates[0]}:
    candidates.length>1?{ambiguous:candidates}:{};
}
// A pnpm workspace package's TypeScript run, as its check's command, cwd and inputs.
function pnpmCheck(root,name,dir,manifest,run){
  const contract=pnpmTypecheckInputs(root,name,run);
  if(contract.limitations.length)throw Error(contract.limitations.join('; '));
  return {cwd:dir,command:['@node',`@typescript-bin:${dir}`,...run.args],
    inputs:[...new Set(['package.json','pnpm-lock.yaml','pnpm-workspace.yaml',manifest,
      ...contractInputs(contract)])]};
}
// Workspace packages as init finds them, with their scripts; [] without workspaces.
export function workspacePackages(root){
  root=realObservedPath(root);
  const pkg=readJson(path.join(root,'package.json')),pm=manager(root,pkg);
  const patterns=pm.name==='pnpm'?pm.workspacePatterns:Array.isArray(pkg.workspaces)?pkg.workspaces:pkg.workspaces?.packages;
  if(!Array.isArray(patterns)||!patterns.length)return [];
  return workspaceManifests(root,patterns).map(({file,pkg:member})=>
    ({name:member.name,dir:path.posix.dirname(file),scripts:member.scripts&&typeof member.scripts==='object'?member.scripts:{}}));
}
// The general recipe for a root script, or why it does not apply: a
// supported package manager and platform, and a script (with its pre and post
// scripts) that, read as text, starts only Node programs.
function generalCheck(root,kind,script){
  if(!['darwin','linux'].includes(process.platform))throw Error('the general recipe records runs on macOS and Linux only');
  const environmentIssue=testEnvironmentIssue();
  if(environmentIssue)throw Error(environmentIssue);
  let project;
  try{project=scriptProject(root,script);}catch(e){throw Error(e.code?.replace(/^test-/,'')||e.message);}
  for(const name of ['pre'+script,script,'post'+script]){
    if(typeof project.scripts[name]!=='string')continue;
    const issue=commandLineIssue(project.scripts[name],{cwd:root,searchPath:scriptPath(root,process.env.PATH)});
    if(issue)throw Error(name===script?issue:`${name}: ${issue}`);
  }
  return {config:{name:kind,script,kind,qualification:scriptQualification,...scriptCheckInputs(project.dirs)},manager:project.manager};
}
export function discoverNodeProject(root,{recipe=null}={}) {
  if(recipe&&!['typescript-direct','tests-direct','node-script'].includes(recipe))
    throw Error('unknown recipe; use typescript-direct, tests-direct or node-script');
  // Without --recipe, init tries the strict recipes first, then the general one.
  const auto=recipe===null;
  root=realObservedPath(root);
  const packageFile=path.join(root,'package.json');
  if(!exists(packageFile))throw Error('run init from a repository containing package.json');
  const pkg=readJson(packageFile),pm=manager(root,pkg),scripts=pkg.scripts||{};
  const git=spawnSync('git',['rev-parse','--show-toplevel'],{cwd:root,
    encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']});
  const repositoryIssue=git.status===0?null:
    'Git checkout is unavailable; filesystem observation needs a checkout';
  const observationIssue=repositoryIssue||sourceLinkIssue(root);
  const workspacePatterns=pm.name==='pnpm'?pm.workspacePatterns:
    Array.isArray(pkg.workspaces)?pkg.workspaces:pkg.workspaces?.packages;
  const workspaces=Boolean(pkg.workspaces)||Boolean(workspacePatterns?.length);
  if(workspaces&&(!Array.isArray(workspacePatterns)||
    workspacePatterns.some(value=>typeof value!=='string'||path.isAbsolute(value)||
      value.split('/').includes('..'))))
    throw Error('workspace patterns need a supported project-relative package list');
  const checks=[],ambiguous=[];
  for(const [kind,names] of Object.entries(scriptNames)) {
    const selected=selectScript(kind,names,scripts),script=selected.script;
    if(selected.ambiguous)ambiguous.push({kind,scripts:selected.ambiguous});
    // With no typecheck script, a root tsconfig.json gets a proposed
    // `tsc --noEmit` check; package.json stays unchanged. It is kept only
    // when a contract makes it ready.
    const proposed=!script&&!selected.ambiguous&&kind==='typecheck'&&!observationIssue&&
      proposable(root,scripts);
    if(!script&&!proposed)continue;
    let classification=observationIssue?{level:'unsupported',reason:observationIssue}:
      script?classify(kind,script,scripts[script],pkg,pm,root):{level:'recording',reason:'no typecheck script'};
    let parts=null;
    if(workspaces&&classification.qualification==='typescript-noemit-v1')classification={level:'recording',
      reason:'workspace task and installed-input closure need explicit qualification'};
    const check={name:kind,script,kind,inputs:sourceInputs(root,kind,pm.lockfiles||[])};
    if((recipe==='typescript-direct'||auto&&pm.name==='npm'&&!workspaces)&&kind==='typecheck'){
      try{
        if(pm.name!=='npm'||workspaces||observationIssue||pm.issue)throw Error('direct recipe requires a supported single-package npm checkout');
        let version;
        parts=tscChecks('typecheck',script??null,scripts,run=>{
          version=directProject(root,run).version;
          return {command:['@node','@typescript-compiler:.',...run.args],cwd:'.'};});
        classification={level:'ready',qualification:directQualification,
          reason:`explicit local TypeScript ${version} compilation; npm launcher/lifecycle scripts are not executed; package.json stays unchanged`};
      }catch(e){classification={level:'recording',reason:`Direct recipe unavailable (${e.code||e.message}); original npm script retained, without bypassing required behavior`};}
    }
    if((recipe==='tests-direct'||auto)&&kind==='test'){
      try{
        if(!['npm','pnpm','yarn'].includes(pm.name)||workspaces||observationIssue||pm.issue)
          throw Error('test recipe requires a supported single-package npm, pnpm or Yarn checkout');
        const chosen=testRecipeScript(scripts);
        if(chosen.ambiguous)throw Error(`several scripts run Vitest or Jest directly (${chosen.ambiguous.join(', ')})`);
        if(!chosen.script)throw Error(chosen.issue||'no script runs Vitest or Jest directly');
        const project=testProject(root,chosen.script);
        Object.assign(check,{script:chosen.script,command:['@node',`@test-runner:${project.runner}`,...project.args],cwd:'.',
          ...testCheckInputs(project)});
        classification={level:'ready',qualification:testsQualification,
          reason:`explicit local ${project.runner} ${project.version} run of script ${JSON.stringify(chosen.script)}; the whole checkout is its input; npm and lifecycle scripts are not executed`};
      }catch(e){classification={level:'recording',reason:`Test recipe unavailable (${e.code||e.message}); original npm script retained`};}
    }
    if(recipe!=='node-script'&&pm.name==='pnpm'&&kind==='typecheck'&&!workspaces&&!pm.issue&&(script===undefined||tscRuns(scripts[script]))){
      try{
        parts=tscChecks('typecheck',script??null,scripts,run=>{
          const contract=pnpmTypecheckInputs(root,'.',run);
          if(contract.limitations.length)throw Error(contract.limitations.join('; '));
          return {command:['@node','@typescript-bin:.',...run.args],cwd:'.',
            inputs:[...new Set(['package.json','pnpm-lock.yaml',
              ...(exists(path.join(root,'pnpm-workspace.yaml'))?['pnpm-workspace.yaml']:[]),
              ...contractInputs(contract)])]};});
        classification={level:'ready',reason:'pnpm TypeScript inputs and installation; checked again before reuse',
          qualification:'pnpm-tsc-v1'};}
      catch(e){classification={level:'recording',reason:`pnpm TypeScript contract needs review: ${e.message}`};}
    }
    if((auto||recipe==='node-script')&&script&&scriptKinds.includes(kind)&&classification.level!=='ready'&&!observationIssue){
      try{
        const general=generalCheck(root,kind,script);
        checks.push({config:general.config,level:'ready',qualification:scriptQualification,
          reason:`general recipe: ${general.manager} runs script ${JSON.stringify(script)} with REDUE's recorder in every Node process; the whole checkout is its input`});
        continue;
      }catch(e){classification={...classification,reason:`General recipe unavailable (${e.message}); ${classification.reason}`};}
    }
    if(!script&&classification.level!=='ready')continue;
    if(parts&&classification.level==='ready'){
      for(const part of parts)checks.push({config:{...check,...part,qualification:classification.qualification},...classification});
      continue;
    }
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
      if(!['npm','yarn','pnpm'].includes(pm.name))continue;
      for(const [kind,names] of Object.entries(scriptNames)){
        const selected=selectScript(kind,names,member.scripts||{});
        if(selected.ambiguous){ambiguous.push({kind:`${name}:${kind}`,
          scripts:selected.ambiguous});continue;}
        // A pnpm package with a tsconfig.json and no typecheck script gets a
        // proposed `tsc --noEmit` check when the pnpm contract holds.
        if(!selected.script&&kind==='typecheck'&&pm.name==='pnpm'&&!pm.issue&&
          proposable(path.join(root,dir),member.scripts)&&!typechecks(scripts)){
          try{for(const part of tscChecks(`${name}:typecheck`,null,{},run=>pnpmCheck(root,name,dir,file,run)))
            checks.push({config:{kind,workspace:name,qualification:'pnpm-tsc-v1',...part},level:'ready',
              reason:'proposed tsc --noEmit for the package\'s tsconfig.json; pnpm workspace TypeScript inputs; checked again before reuse'});}
          catch{}
          continue;
        }
        if(!selected.script)continue;
        const command=pm.name==='npm'?['@which:npm','run',selected.script,
          '--workspace',name]:pm.name==='yarn'?
          ['@which:yarn','workspace',name,'run',selected.script]:
          ['@which:pnpm','--filter',name,'run',selected.script];
        const check={name:`${name}:${kind}`,kind,command,
          inputs:['package.json',...(pm.lockfiles||[]),`${dir}/**`,
            `!${dir}/node_modules/**`]};
        let level=pm.issue&&pm.name!=='pnpm'?'unsupported':'recording';
        let reason=pm.issue||'workspace script found; shared configuration and installed inputs need review';
        if(!pm.issue&&pm.name==='yarn'&&pm.layout==='node-modules/classic'&&
          kind==='typecheck'&&(member.scripts||{})[selected.script]?.trim()==='tsc -p .'&&
          !member.scripts?.['pre'+selected.script]&&!member.scripts?.['post'+selected.script]){
          try{
            yarnWorkspaceTypecheckInputs(root,name,selected.script);
            check.workspace=name;check.qualification='yarn-workspace-tsc-v1';
            check.inputs=['package.json','yarn.lock','.yarnrc.yml',file,`${dir}/src/**`];
            level='ready';reason='pinned Yarn workspace tsc and installed inputs; checked again before reuse';
          }catch(e){reason=`workspace TypeScript contract needs review: ${e.message}`;}
        }
        if(!pm.issue&&pm.name==='pnpm'&&kind==='typecheck'&&tscRuns((member.scripts||{})[selected.script])){
          try{const parts=tscChecks(`${name}:typecheck`,selected.script,member.scripts,run=>pnpmCheck(root,name,dir,file,run));
            for(const part of parts)checks.push({config:{kind,workspace:name,qualification:'pnpm-tsc-v1',...part},level:'ready',
              reason:'pnpm workspace TypeScript inputs; checked again before reuse'});
            continue;
          }catch(e){reason=`pnpm TypeScript contract needs review: ${e.message}`;}
        }
        if(recipe==='tests-direct'&&kind==='test'&&!pm.issue){
          try{const project=testProject(root,selected.script,dir);
            Object.assign(check,{workspace:name,script:selected.script,cwd:dir,
              command:['@node',`@test-runner:${project.runner}`,...project.args],...testCheckInputs(project),
              qualification:testsQualification});
            level='ready';reason=`explicit local ${project.runner} ${project.version} run of ${name}'s script ${JSON.stringify(selected.script)}; the whole checkout is its input; the package manager and lifecycle scripts are not executed`;
          }catch(e){reason=`Test recipe unavailable (${e.code||e.message}); original script retained`;}
        }
        checks.push({config:check,level,reason});
      }
    }
  }
  return {schema:1,root,manager:pm,observationIssue,workspaces,node:process.version,
    checks,ambiguous,
    config:{schema:1,packageManager:pm.name||'unknown',checks:checks.map(row=>row.config)}};
}
