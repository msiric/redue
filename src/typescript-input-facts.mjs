// Extracted from the existing npm TypeScript probe; shared compiler input logic.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
import {compilerFiles} from './typescript-list.mjs';
import {buildInfoFor} from './direct-typescript.mjs';
import {probeTimeLeft} from './probe-deadline.mjs';
import {withinPath as within,realObservedPath} from './path-identity.mjs';
import {timing} from './decision-profile.mjs';
const require=createRequire(import.meta.url),hash=value=>createHash('sha256').update(value).digest('hex');
const digestFile=file=>hash(fs.readFileSync(file));
const fail=code=>{throw Object.assign(Error(code),{code});};
export function typeScriptInputFacts(root,tsRoot,tsc,config='tsconfig.json'){
  const configReads=new Set(),visited=new Set(),referenced=[];
  let buildInfo=null;
  let ts;try{ts=require(tsRoot);}catch{}
  if(typeof ts?.getParsedCommandLineOfConfigFile==='function'){
    const host={...ts.sys,readFile(file){configReads.add(path.resolve(file));
      return ts.sys.readFile(file);},onUnRecoverableConfigFileDiagnostic(){}};
    const parseConfig=(file,top=false)=>{
      const absolute=path.resolve(file);
      if(!within(absolute,root))fail('typescript-config-outside-repository');
      if(visited.has(absolute))return;visited.add(absolute);
      if(visited.size>64)fail('typescript-config-graph-too-large');
      const parsed=ts.getParsedCommandLineOfConfigFile(absolute,{},host);
      if(!parsed||parsed.errors?.length)fail('typescript-config-unavailable');
      if(parsed.options?.plugins?.length)fail('typescript-plugin-unsupported');
      // Plain tsc reads a referenced config but never builds it, so only the
      // root config's build settings matter. An incremental root reads and
      // writes one build-info file, which must be inside the checkout.
      if(top){
        if(parsed.options?.composite)fail('typescript-incremental-unsupported');
        const found=buildInfoFor(ts,parsed.options,root);
        if(found.issue)fail(found.issue);
        buildInfo=found.file||null;
      }else referenced.push(parsed);
      for(const reference of parsed.projectReferences||[])
        parseConfig(reference.path.endsWith('.json')?reference.path:
          path.join(reference.path,'tsconfig.json'));
    };
    parseConfig(path.join(root,config),true);
  }else{
    // TypeScript 7's native compiler does not expose the previous config API.
    // Its CLI reports the effective config; restrict this path to one direct
    // config rather than guessing about extends/reference provenance.
    const file=path.join(root,config),raw=fs.readFileSync(file,'utf8');
    if(/"(?:extends|references|plugins|incremental|composite)"\s*:/.test(raw))
      fail('typescript-config-graph-unsupported');
    const shown=spawnSync(process.execPath,[tsc,'--showConfig','-p',config],{cwd:root,
      env:process.env,encoding:'utf8',timeout:probeTimeLeft(4000),maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
    if(shown.error||shown.signal||shown.status!==0)fail('typescript-config-unavailable');
    const effective=JSON.parse(shown.stdout);
    if(effective.compilerOptions?.plugins?.length||
      effective.compilerOptions?.incremental||effective.compilerOptions?.composite)
      fail('typescript-config-graph-unsupported');
    configReads.add(file);
  }
  for(const file of configReads)if(!within(realObservedPath(file),root))
    fail('typescript-config-outside-repository');
  const listingStarted=performance.now();
  const captured=process.argv.includes('--redue-checkpoint')?compilerFiles(tsRoot,root,config):null;
  const listed=captured?{status:0,stdout:captured.files.join('\n')}:spawnSync(process.execPath,[tsc,'--noEmit','--listFilesOnly','-p',config],
    {cwd:root,env:process.env,encoding:'utf8',timeout:probeTimeLeft(process.platform==='win32'?10000:4000),
      maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
  timing('typescript_contract.list_files',listingStarted,{status:listed.status??null,
    error:listed.error?.code||null});
  if(listed.error||listed.signal||listed.status!==0)fail('typescript-input-list-unavailable');
  const files=listed.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>path.resolve(file));
  if(!files.length||files.some(file=>!within(realObservedPath(file),root)))
    fail('typescript-input-outside-repository');
  // A program that uses a referenced project's sources or outputs depends on
  // that project's build, which plain tsc does not run. tsc redirects only
  // TypeScript sources; a shared .d.ts or .json is an ordinary input.
  const declaration=/\.d\.[cm]?ts$|\.json$/;
  const sources=new Set(),outputs=new Set(),outDirs=[];
  for(const parsed of referenced){
    const dirs=[parsed.options.outDir,parsed.options.declarationDir].filter(Boolean).map(dir=>path.resolve(dir));
    outDirs.push(...dirs);
    for(const file of parsed.fileNames.map(name=>path.resolve(name)))if(!declaration.test(file)){
      sources.add(file);if(!dirs.length)outputs.add(file.replace(/\.[cm]?tsx?$/,ext=>ext.replace(/tsx?$/,'d.ts')));}
  }
  if(files.some(file=>sources.has(file)||outputs.has(file)||outDirs.some(dir=>within(file,dir))))
    fail('typescript-project-reference-consumed');
  // Every hashed configuration must also be a certified question.
  const queries=captured?.queries&&[...configReads].every(file=>
    captured.queries.some(([kind,read])=>kind==='readFile'&&read===file))?captured.queries:null;
  return {configs:[...configReads].sort().map(file=>[file,digestFile(file)]),
    files:[...new Set(files)].sort().map(file=>[file,digestFile(file)]),queries,
    ...(buildInfo?{buildInfo}:{})};
}
