import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import micromatch from 'micromatch';
import {withinPath as within} from './path-identity.mjs';

const posix=file=>file.split(path.sep).join('/');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const relative=(root,file)=>posix(path.relative(root,file));
const safeDirectory=(root,dir)=>{
  const full=path.resolve(root,dir);
  if(!within(full,root))throw Error('workspace path escapes checkout');
  return full;
};

export function yarnWorkspacePackages(root){
  root=fs.realpathSync(root);
  const pkg=read(path.join(root,'package.json'));
  const patterns=Array.isArray(pkg.workspaces)?pkg.workspaces:pkg.workspaces?.packages;
  if(!Array.isArray(patterns)||!patterns.length||patterns.some(value=>
    typeof value!=='string'||path.isAbsolute(value)||value.split('/').includes('..')))
    throw Error('workspace declarations are unsupported');
  const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard',
    '-z','--',':(glob)**/package.json'],{cwd:root,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},
    maxBuffer:32*1024*1024,timeout:5000}).toString().split('\0').filter(Boolean);
  const found=new Map();
  for(const file of files){
    const dir=path.posix.dirname(file);
    if(dir==='.'||dir.split('/').includes('node_modules')||
      !micromatch.isMatch(dir,patterns,{dot:true}))continue;
    const member=read(path.join(root,file));
    if(!member.name||found.has(member.name))throw Error('workspace package name missing or duplicated');
    found.set(member.name,{name:member.name,dir,manifest:file,pkg:member});
  }
  if(found.size>50)throw Error('workspace count exceeds narrow Node onboarding contract');
  return found;
}

function parsedTypeScript(root,dir){
  const require=createRequire(path.join(root,'package.json'));
  const ts=require(path.join(root,'node_modules','typescript'));
  const config=path.join(root,dir,'tsconfig.json'),reads=new Set();
  const host={...ts.sys,readFile(file){reads.add(path.resolve(file));return ts.sys.readFile(file);},
    onUnRecoverableConfigFileDiagnostic(){}};
  const parsed=ts.getParsedCommandLineOfConfigFile(config,{},host);
  if(!parsed||parsed.errors?.length)throw Error('TypeScript configuration unavailable');
  const raw=ts.readConfigFile(config,ts.sys.readFile);
  if(raw.error||!Array.isArray(raw.config?.include)||raw.config.include.length!==1||
    !['src','src/**/*','src/**'].includes(raw.config.include[0]))
    throw Error('workspace TypeScript file membership is outside the supported src include');
  if(parsed.options.plugins?.length||parsed.options.incremental||parsed.options.composite)
    throw Error('TypeScript plugins or incremental/project builds are outside this contract');
  if(parsed.options.paths||parsed.options.baseUrl||parsed.options.rootDirs?.length||
    parsed.options.typeRoots?.length||parsed.options.customConditions?.length||
    parsed.options.moduleSuffixes?.length||
    parsed.options.moduleResolution!==undefined&&
      parsed.options.moduleResolution!==ts.ModuleResolutionKind.Node10)
    throw Error('custom TypeScript module resolution needs explicit input coverage');
  if(parsed.projectReferences?.length)throw Error('TypeScript project references need a separate contract');
  for(const file of reads)if(!within(fs.realpathSync(file),root))
    throw Error(`TypeScript configuration escapes the checkout: ${path.basename(file)}`);
  return {parsed,configs:[...reads].map(file=>relative(root,file)).sort()};
}

export function yarnWorkspaceTypecheckInputs(root,workspace,script){
  root=fs.realpathSync(root);
  const rootPkg=read(path.join(root,'package.json'));
  if(!/^yarn@4\./.test(rootPkg.packageManager||''))throw Error('pinned Yarn 4 required');
  const yarnrc=fs.readFileSync(path.join(root,'.yarnrc.yml'),'utf8');
  const linker=yarnrc.match(/^\s*nodeLinker\s*:\s*['"]?([\w-]+)/m)?.[1];
  const mode=yarnrc.match(/^\s*nmMode\s*:\s*['"]?([\w-]+)/m)?.[1]||'classic';
  if(linker!=='node-modules'||mode!=='classic')
    throw Error('Yarn node-modules classic installation required');
  if(/^\s*(?:yarnPath|plugins)\s*:/m.test(yarnrc))
    throw Error('custom Yarn executable or plugins need explicit toolchain coverage');
  const members=yarnWorkspacePackages(root),selected=members.get(workspace);
  if(!selected)throw Error(`workspace ${workspace} is not declared`);
  if(selected.pkg.scripts?.[script]?.trim()!=='tsc -p .'||
    selected.pkg.scripts?.['pre'+script]||selected.pkg.scripts?.['post'+script])
    throw Error('workspace typecheck must be standalone tsc -p .');
  const packageDir=safeDirectory(root,selected.dir);
  if(fs.existsSync(path.join(packageDir,'node_modules','.bin','tsc')))
    throw Error('workspace-local TypeScript executable needs separate toolchain coverage');
  const {parsed,configs}=parsedTypeScript(root,selected.dir);
  const outDir=parsed.options.outDir&&within(path.resolve(parsed.options.outDir),root)?
    relative(root,path.resolve(parsed.options.outDir)):null;
  if(!parsed.options.noEmit&&!outDir)
    throw Error('emitting TypeScript check needs an in-checkout outDir');
  if(outDir&&within(path.join(root,outDir),path.join(packageDir,'src')))
    throw Error('TypeScript output overlaps observed source inputs');
  const closure=new Map(),visit=member=>{
    for(const name of Object.keys({...member.pkg.dependencies,...member.pkg.devDependencies,
      ...member.pkg.peerDependencies,...member.pkg.optionalDependencies})){
      const dep=members.get(name);if(!dep||dep.name===selected.name||closure.has(name))continue;
      closure.set(name,dep);visit(dep);
    }
  };
  visit(selected);
  const source=[...new Set(['package.json','yarn.lock','.yarnrc.yml',
    selected.manifest,...configs,`${selected.dir}/src/**`])];
  const installed=['node_modules/**',`${selected.dir}/node_modules/**`];
  const generated=[];
  const linkTriggers=[];
  for(const member of members.values()){
    const logical=`node_modules/${member.name}`;
    installed.push(`!${logical}`,`!${logical}/**`);
    if(!closure.has(member.name))continue;
    installed.push(`${member.dir}/node_modules/**`);
    const declaration=member.pkg.types||member.pkg.typings;
    if(!declaration||path.isAbsolute(declaration)||declaration.split('/').includes('..'))
      throw Error(`${member.name} has no supported declaration-output location`);
    const output=path.posix.dirname(declaration);
    const outputDir=output==='.'?member.dir:`${member.dir}/${output}`;
    generated.push(`${outputDir}/**`);
    source.push(member.manifest);
    // The logical link is part of resolution identity even though its target
    // contents are indexed at the physical workspace output location.
    linkTriggers.push(logical);
  }
  const tsc=fs.realpathSync(path.join(root,'node_modules','.bin','tsc'));
  if(tsc!==path.join(root,'node_modules','typescript','bin','tsc'))
    throw Error('local TypeScript executable is not the installed compiler');
  return {workspace:selected,closure:[...closure.values()],source:[...new Set(source)],
    installed,generated:[...new Set(generated)],configs,
    configurationInputs:[...new Set(['package.json','yarn.lock','.yarnrc.yml',
      ...configs,...members.values().map(row=>row.manifest),
      'node_modules/.yarn-state.yml'])],linkTriggers,outDir};
}
