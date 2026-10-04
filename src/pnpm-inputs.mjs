// Pinned pnpm 12 node-modules installation provider. The engine sees only
// repository-relative input sets and resolution relationships, never pnpm
// virtual-store names as semantic identities.
import {compilerFiles} from './typescript-list.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import micromatch from './glob.mjs';
import YAML from 'yaml';
import {resolveLinks} from './installed-inputs.mjs';
import {withinPath as within,realObservedPath,samePath} from './path-identity.mjs';
import {timing} from './decision-profile.mjs';

const rel=(root,file)=>path.relative(root,file).split(path.sep).join('/');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const exists=file=>{try{fs.lstatSync(file);return true;}catch{return false;}};
function yaml(file){
  const doc=YAML.parseDocument(fs.readFileSync(file,'utf8'),{uniqueKeys:true});
  if(doc.errors.length)throw Error(`${path.basename(file)} cannot be interpreted safely`);
  return doc.toJS()||{};
}
function safePatterns(values){
  if(!Array.isArray(values)||values.some(v=>typeof v!=='string'||!v||
    path.isAbsolute(v)||v.split('/').includes('..')))
    throw Error('pnpm workspace patterns are unsupported');
  return values;
}
export function pnpmProjectInfo(root){
  root=realObservedPath(root);
  const pkg=read(path.join(root,'package.json'));
  const pin=/^pnpm@(12\.\d+\.\d+)(?:\+[^\s]+)?$/.exec(pkg.packageManager||'');
  if(!pin)throw Error('an exact pnpm 12 packageManager pin is required');
  const workspaceFile=path.join(root,'pnpm-workspace.yaml');
  const settings=exists(workspaceFile)?yaml(workspaceFile):{};
  const patterns=safePatterns(settings.packages||[]);
  const linker=settings.nodeLinker||'isolated';
  return {version:pin[1],linker,patterns,settings};
}
export function pnpmInstallInfo(root){
  const started=performance.now();
  root=realObservedPath(root);
  const pkg=read(path.join(root,'package.json'));
  const {version,linker,patterns,settings}=pnpmProjectInfo(root);
  const workspaceFile=path.join(root,'pnpm-workspace.yaml');
  if(!['isolated','hoisted'].includes(linker))throw Error(`pnpm ${linker} linker is recording-only`);
  if(settings.modulesDir||settings.virtualStoreDir||settings.enableGlobalVirtualStore)
    throw Error('custom pnpm modules or virtual-store location is recording-only');
  if(settings.injectWorkspacePackages)
    throw Error('injected workspace dependencies are recording-only');
  if(settings.sharedWorkspaceLockfile===false)
    throw Error('separate workspace lockfiles are recording-only');
  if(exists(path.join(root,'.pnpmfile.cjs'))||exists(path.join(root,'.pnpmfile.mjs')))
    throw Error('custom pnpm installation hooks need review');
  const modulesFile=path.join(root,'node_modules','.modules.yaml');
  if(!exists(modulesFile))throw Error('installed pnpm module metadata is missing');
  const modules=yaml(modulesFile);
  if(modules.nodeLinker!==linker||modules.packageManager!==pkg.packageManager)
    throw Error('installed pnpm linker or version differs from project configuration');
  const virtualStore=path.join(root,'node_modules','.pnpm');
  // pnpm 12 on Windows can omit virtualStoreDir when using its project-local
  // default. Accept only the observed, ordinary local directory in that case.
  const declared=modules.virtualStoreDir;
  const selected=declared===undefined?virtualStore:
    path.resolve(path.dirname(modulesFile),declared);
  let localStore=false;
  try{localStore=fs.lstatSync(virtualStore).isDirectory()&&
    samePath(realObservedPath(virtualStore),realObservedPath(selected));}
  catch{}
  if(!localStore||!exists(path.join(virtualStore,'lock.yaml')))
    throw Error('nonstandard or incomplete project-local pnpm virtual store');
  if(!exists(path.join(root,'pnpm-lock.yaml')))
    throw Error('pnpm lockfile is missing');
  if(exists(path.join(root,'.npmrc'))){
    // pnpm 12 reads project settings from pnpm-workspace.yaml. Registry/auth
    // entries affect acquisition, not a completed local TypeScript invocation.
    for(const line of fs.readFileSync(path.join(root,'.npmrc'),'utf8').split(/\r?\n/)){
      const trimmed=line.trim();if(!trimmed||/^[#;]/.test(trimmed))continue;
      const key=trimmed.split('=')[0].trim();
      if(key!=='registry'&&!/^\/\/[^\s]+\/:_authToken$/.test(key))
        throw Error('project .npmrc has execution-relevant pnpm settings requiring review');
    }
  }
  timing('pnpm.install_metadata',started);
  return {version,linker,patterns,settings,modulesFile,
    configurationInputs:['package.json','pnpm-lock.yaml',
      ...(exists(workspaceFile)?['pnpm-workspace.yaml']:[]),
      ...(exists(path.join(root,'.npmrc'))?['.npmrc']:[]),
      'node_modules/.modules.yaml','node_modules/.pnpm/lock.yaml']};
}
export function pnpmWorkspacePackages(root,patterns){
  const started=performance.now();
  root=realObservedPath(root);
  const found=new Map();
  if(!patterns.length)return found;
  const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard',
    '-z','--',':(glob)**/package.json'],{cwd:root,
    env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},maxBuffer:32*1024*1024,
    timeout:5000}).toString().split('\0').filter(Boolean);
  for(const file of files){
    const dir=path.posix.dirname(file);
    if(dir==='.'||dir.split('/').includes('node_modules')||
      !micromatch.isMatch(dir,patterns,{dot:true}))continue;
    const pkg=read(path.join(root,file));
    if(!pkg.name||found.has(pkg.name))throw Error('pnpm workspace name missing or duplicated');
    found.set(pkg.name,{name:pkg.name,dir,manifest:file,pkg});
  }
  if(found.size>100)throw Error('pnpm workspace count exceeds the narrow Node onboarding contract');
  timing('pnpm.workspace_discovery',started,{packages:found.size});
  return found;
}
const deps=(pkg,includeDev)=>({...pkg.dependencies,
  ...(includeDev?pkg.devDependencies:{}),
  ...pkg.optionalDependencies,...pkg.peerDependencies});
function typeOutputs(member){
  const values=new Set();
  if(typeof member.pkg.types==='string')values.add(member.pkg.types);
  if(typeof member.pkg.typings==='string')values.add(member.pkg.typings);
  const visit=(value,key)=>{
    if(typeof value==='string'&&key==='types')values.add(value);
    else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))visit(v,k);
  };
  visit(member.pkg.exports,'');
  if(!values.size)throw Error(`${member.name} has no declared TypeScript output boundary`);
  return [...values].map(value=>{
    if(path.isAbsolute(value)||value.split('/').includes('..'))
      throw Error(`${member.name} has an unsupported declaration path`);
    const folder=path.posix.dirname(value.replace(/^\.\//,''));
    if(folder==='.')throw Error(`${member.name} has a root declaration requiring review`);
    return `${member.dir}/${folder}/**`;
  });
}
function nodeCandidates(root,requester,name){
  const result=[];let current=requester;
  for(;;){
    if(!within(current,root))break;
    if(path.basename(current)!=='node_modules')
      result.push(path.join(current,'node_modules',name));
    if(current===root)break;
    current=path.dirname(current);
  }
  return result;
}
function outsideNodeCandidates(root,name){
  const result=[];let current=path.dirname(root);
  for(;;){
    if(path.basename(current)!=='node_modules')result.push(path.join(current,'node_modules',name));
    const parent=path.dirname(current);if(parent===current)break;current=parent;
  }
  return result;
}
function packageAt(root,requester,name){
  const candidates=nodeCandidates(root,requester,name);
  for(const candidate of candidates){
    let stat;try{stat=fs.statSync(candidate);}catch(e){
      if(e.code==='ENOENT')continue;
      throw Error(`${name} resolution cannot be inspected: ${e.code||e.name}`);
    }
    if(!stat.isDirectory())throw Error(`${name} resolves to an unsupported entry`);
    const resolution=resolveLinks(candidate,root);
    if(!resolution.physical)throw Error(`${name} resolution is unavailable: ${resolution.reason}`);
    const physical=resolution.physical;
    if(!within(physical,root))throw Error(`${name} resolves outside the observed checkout`);
    const manifest=path.join(physical,'package.json');
    if(!exists(manifest))throw Error(`${name} installed manifest is missing`);
    return {physical,logical:candidate,candidates,pkg:read(manifest),
      links:resolution.links};
  }
  for(const candidate of outsideNodeCandidates(root,name)){
    try{fs.lstatSync(candidate);throw Error(`${name} may resolve outside the observed checkout`);}
    catch(e){if(e.code!=='ENOENT')throw e;}
  }
  return {physical:null,candidates};
}
function parsedTypeScript(root,dir,ts){
  const config=path.join(root,dir,'tsconfig.json'),reads=new Set();
  const host={...ts.sys,readFile(file){reads.add(path.resolve(file));return ts.sys.readFile(file);},
    onUnRecoverableConfigFileDiagnostic(){}};
  const parsed=ts.getParsedCommandLineOfConfigFile(config,{},host);
  if(!parsed||parsed.errors?.length)throw Error('TypeScript configuration unavailable');
  const raw=ts.readConfigFile(config,ts.sys.readFile);
  if(raw.error||!Array.isArray(raw.config?.include)||raw.config.include.length!==1||
    !/^src(?:$|\/)/.test(raw.config.include[0]))
    throw Error('TypeScript source file membership is outside the supported src include');
  if(parsed.options.plugins?.length||parsed.options.incremental||parsed.options.composite||
    parsed.projectReferences?.length||parsed.options.paths||parsed.options.baseUrl||
    parsed.options.rootDirs?.length||parsed.options.typeRoots?.length||
    parsed.options.customConditions?.length||parsed.options.moduleSuffixes?.length)
    throw Error('custom TypeScript compiler or resolution options need review');
  const supported=new Set([undefined,ts.ModuleResolutionKind.Node10,
    ts.ModuleResolutionKind.Node16,ts.ModuleResolutionKind.NodeNext]);
  if(!supported.has(parsed.options.moduleResolution))
    throw Error('TypeScript module resolver is outside the supported Node contract');
  for(const file of reads)if(!within(realObservedPath(file),root))
    throw Error('TypeScript configuration escapes the checkout');
  return {parsed,configs:[...reads].map(file=>rel(root,file)).sort()};
}
function listedTypeScriptFiles(root,selected,tsc){
  // --listFilesOnly resolves the compiler's effective module/file set but
  // performs no typecheck and emits no project outputs.
  const out=spawnSync(process.execPath,[tsc,'-p','tsconfig.json','--listFilesOnly'],
    {cwd:path.join(root,selected.dir),env:process.env,encoding:'utf8',
      // The native NTFS public workspace takes 3-5 s to list ~770 inputs;
      // 5 s sometimes expired despite bounded, progressing compiler work.
      timeout:10000,maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});
  if(out.error||out.signal||out.status!==0)
    throw Error('TypeScript input listing is unavailable');
  const files=out.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>realObservedPath(file));
  if(!files.length)throw Error('TypeScript input listing is empty');
  return files;
}
function installedPackageRoot(root,file){
  const modules=path.join(root,'node_modules');
  if(!within(file,modules))return null;
  const parts=rel(root,file).split('/');
  const at=parts.lastIndexOf('node_modules');
  if(at<0||!parts[at+1])return null;
  const count=parts[at+1].startsWith('@')?2:1;
  const packageRoot=path.join(root,...parts.slice(0,at+1+count));
  const manifest=path.join(packageRoot,'package.json');
  return exists(manifest)&&read(manifest).name?packageRoot:null;
}
function sharedHardlinkIn(folder){
  const stack=[folder];
  while(stack.length){
    const current=stack.pop();
    for(const item of fs.readdirSync(current,{withFileTypes:true})){
      if(item.name==='node_modules')continue;
      const file=path.join(current,item.name);
      if(item.isDirectory())stack.push(file);
      else if(item.isFile()&&fs.statSync(file).nlink>1)return true;
      else if(item.isSymbolicLink())throw Error('installed package contains an unmodeled link');
    }
  }
  return false;
}
export function pnpmTypecheckInputs(root,workspace,script,{captureQueries=false}={}){
  const totalStarted=performance.now();
  root=realObservedPath(root);
  const install=pnpmInstallInfo(root),members=pnpmWorkspacePackages(root,install.patterns);
  const selected=workspace==='.'?{name:'.',dir:'.',manifest:'package.json',
    pkg:read(path.join(root,'package.json'))}:members.get(workspace);
  if(!selected)throw Error(`workspace ${workspace} is not declared`);
  if(!/^(?:tsc --noEmit|tsc -p (?:\.|tsconfig\.json)(?: --noEmit)?)$/.test(
    selected.pkg.scripts?.[script]?.trim()||'')||
    selected.pkg.scripts?.['pre'+script]||selected.pkg.scripts?.['post'+script])
    throw Error('typecheck must be one standalone TypeScript invocation');
  const selectedDir=path.join(root,selected.dir),lookup=createRequire(path.join(selectedDir,'package.json'));
  let tsPackage;try{tsPackage=realObservedPath(lookup.resolve('typescript/package.json'));}
  catch{throw Error('installed TypeScript compiler cannot be resolved');}
  if(!within(tsPackage,root))throw Error('TypeScript compiler is outside the observed checkout');
  const tsRoot=path.dirname(tsPackage),ts=lookup('typescript');
  const tsc=path.join(tsRoot,'bin','tsc');
  if(!exists(tsc))throw Error('installed TypeScript executable is missing');
  const configStarted=performance.now();
  const {configs}=parsedTypeScript(root,selected.dir,ts);
  timing('pnpm.ts_config',configStarted,{configs:configs.length});
  const closure=new Map(),installed=new Set(),generated=new Set(),
    links=new Set(),candidates=new Set(),absences=[],instances=new Map();
  let resolutionMs=0,resolutionCount=0;
  const closureStarted=performance.now();
  const visit=(requester,owner,includeDev=false)=>{
    for(const [name,spec] of Object.entries(deps(owner.pkg,includeDev))){
      if(owner.pkg.dependenciesMeta?.[name]?.injected)
        throw Error(`injected workspace dependency ${name} is recording-only`);
      const resolutionStarted=performance.now();
      const found=packageAt(root,path.join(root,requester.dir),name);
      resolutionMs+=performance.now()-resolutionStarted;resolutionCount++;
      const optional=Object.hasOwn(owner.pkg.optionalDependencies||{},name)||
        owner.pkg.peerDependenciesMeta?.[name]?.optional===true;
      if(!found.physical){
        if(!optional)throw Error(`${owner.name} requires unresolved installed package ${name}`);
        absences.push({requester:owner.name,name});
        for(const candidate of found.candidates)if(within(candidate,root))
          candidates.add(rel(root,candidate));
        // An outside ancestor can shadow a supported absence without a root event.
        // For this alpha, a missing optional is qualified only when the caller's
        // Node lookup boundary is explicitly observed by the project checkout.
        continue;
      }
      for(const candidate of found.candidates){
        if(candidate===found.logical)break;
        if(within(candidate,root))candidates.add(rel(root,candidate));
      }
      for(const link of found.links||[])if(within(link.path,root))
        links.add(rel(root,link.path));
      const member=[...members.values()].find(row=>
        path.join(root,row.dir)===found.physical);
      if(String(spec).startsWith('workspace:')&&member?.name!==name)
        throw Error(`${owner.name} workspace dependency ${name} is not linked to its workspace`);
      if(member){
        if(owner.name===member.name||member.name===selected.name)continue;
        if(!closure.has(member.name)){
          closure.set(member.name,member);
          for(const value of typeOutputs(member))generated.add(value);
          visit(member,member,true);
        }
      }
    }
  };
  visit(selected,selected,true);
  timing('pnpm.dependency_closure',closureStarted,{relationships:resolutionCount,
    resolutionMs:Math.round(resolutionMs),workspaceLinks:links.size,
    candidates:candidates.size});
  const listingStarted=performance.now();
  const captured=captureQueries?compilerFiles(tsRoot,path.join(root,selected.dir)):null;
  const files=captured?captured.files.map(realObservedPath):listedTypeScriptFiles(root,selected,tsc);
  timing('pnpm.ts_input_listing',listingStarted,{files:files.length});
  const mappingStarted=performance.now();
  for(const file of files){
    if(within(file,path.join(selectedDir,'src'))||
      [...closure.values()].some(member=>within(file,path.join(root,member.dir))))continue;
    const packageRoot=installedPackageRoot(root,file);
    if(!packageRoot)throw Error(`TypeScript consumes a file outside the observed pnpm contract: ${rel(root,file)}`);
    if(!instances.has(packageRoot))instances.set(packageRoot,{name:read(path.join(packageRoot,'package.json')).name,
      physicalRoot:rel(root,packageRoot)});
    installed.add(`${rel(root,packageRoot)}/**`);
    installed.add(`!${rel(root,packageRoot)}/node_modules/**`);
  }
  timing('pnpm.input_mapping',mappingStarted,{instances:instances.size,
    installedPatterns:installed.size});
  installed.add(`${rel(root,tsRoot)}/**`);
  installed.add(`!${rel(root,tsRoot)}/node_modules/**`);
  if(!instances.has(tsRoot))instances.set(tsRoot,{name:'typescript',physicalRoot:rel(root,tsRoot)});
  const sharedStarted=performance.now();
  const shared=[...instances.keys()].filter(sharedHardlinkIn);
  timing('pnpm.hardlink_inspection',sharedStarted,{instances:instances.size,
    shared:shared.length});
  const source=[...new Set([...install.configurationInputs,selected.manifest,
    ...configs,`${selected.dir==='.'?'':selected.dir+'/'}src/**`,
    ...closure.values().map(member=>member.manifest),...generated])];
  timing('pnpm.total_discovery',totalStarted,{instances:instances.size,
    inputFiles:files.length});
  return {install,workspace:selected,closure:[...closure.values()],source,
    installed:[...installed],generated:[...generated],
    // The read-only state probe consumes this same resolved compiler file set.
    // It is deliberately omitted from the persisted user-facing input plan.
    listedFiles:files,discoveryQueries:captured?.queries,
    configs,configurationInputs:[...new Set([...install.configurationInputs,
      ...configs,...members.values().map(member=>member.manifest)])],
    installation:{provider:'pnpm',version:install.version,linker:install.linker},
    installedInstances:[...instances.values()],
    linkTriggers:[...links],absences,
    limitations:[...(absences.length?[
      'optional dependency absence has ancestor Node lookup locations outside the observed checkout']:[]),
      ...(shared.length&&!['linux','win32'].includes(process.platform)?
        ['installed package hardlinks have unobserved storage aliases']:[])],
    // Installed hardlinks can change through a store alias without a project
    // directory notification. A decision-grade read must rehash them.
    synchronizedInstalledRead:['linux','win32'].includes(process.platform),
    resolutionCandidates:[...candidates].map(value=>
      ({path:value,observedPath:value})),workspacePatterns:install.patterns,
    tsc,tsRoot};
}
