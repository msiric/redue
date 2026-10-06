// Extracted from the existing npm TypeScript probe; shared compiler input logic.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
import {compilerFiles} from './typescript-list.mjs';
import {withinPath as within,realObservedPath} from './path-identity.mjs';
import {timing} from './decision-profile.mjs';
const require=createRequire(import.meta.url),hash=value=>createHash('sha256').update(value).digest('hex');
const digestFile=file=>hash(fs.readFileSync(file));
const fail=code=>{throw Object.assign(Error(code),{code});};
export function typeScriptInputFacts(root,tsRoot,tsc){
  const configReads=new Set(),visited=new Set();
  let ts;try{ts=require(tsRoot);}catch{}
  if(typeof ts?.getParsedCommandLineOfConfigFile==='function'){
    const host={...ts.sys,readFile(file){configReads.add(path.resolve(file));
      return ts.sys.readFile(file);},onUnRecoverableConfigFileDiagnostic(){}};
    const parseConfig=file=>{
      const absolute=path.resolve(file);
      if(!within(absolute,root))fail('typescript-config-outside-repository');
      if(visited.has(absolute))return;visited.add(absolute);
      if(visited.size>64)fail('typescript-config-graph-too-large');
      const parsed=ts.getParsedCommandLineOfConfigFile(absolute,{},host);
      if(!parsed||parsed.errors?.length)fail('typescript-config-unavailable');
      if(parsed.options?.plugins?.length)fail('typescript-plugin-unsupported');
      if(parsed.options?.incremental||parsed.options?.composite)
        fail('typescript-incremental-unsupported');
      for(const reference of parsed.projectReferences||[])
        parseConfig(reference.path.endsWith('.json')?reference.path:
          path.join(reference.path,'tsconfig.json'));
    };
    parseConfig(path.join(root,'tsconfig.json'));
  }else{
    // TypeScript 7's native compiler does not expose the previous config API.
    // Its CLI reports the effective config; restrict this path to one direct
    // config rather than guessing about extends/reference provenance.
    const config=path.join(root,'tsconfig.json'),raw=fs.readFileSync(config,'utf8');
    if(/"(?:extends|references|plugins|incremental|composite)"\s*:/.test(raw))
      fail('typescript-config-graph-unsupported');
    const shown=spawnSync(process.execPath,[tsc,'--showConfig'],{cwd:root,
      env:process.env,encoding:'utf8',timeout:4000,maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
    if(shown.error||shown.signal||shown.status!==0)fail('typescript-config-unavailable');
    const effective=JSON.parse(shown.stdout);
    if(effective.compilerOptions?.plugins?.length||
      effective.compilerOptions?.incremental||effective.compilerOptions?.composite)
      fail('typescript-config-graph-unsupported');
    configReads.add(config);
  }
  for(const file of configReads)if(!within(realObservedPath(file),root))
    fail('typescript-config-outside-repository');
  const listingStarted=performance.now();
  const captured=process.argv.includes('--redue-checkpoint')?compilerFiles(tsRoot,root):null;
  const listed=captured?{status:0,stdout:captured.files.join('\n')}:spawnSync(process.execPath,[tsc,'--noEmit','--listFilesOnly'],
    {cwd:root,env:process.env,encoding:'utf8',timeout:process.platform==='win32'?10000:4000,
      maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
  timing('typescript_contract.list_files',listingStarted,{status:listed.status??null,
    error:listed.error?.code||null});
  if(listed.error||listed.signal||listed.status!==0)fail('typescript-input-list-unavailable');
  const files=listed.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>path.resolve(file));
  if(!files.length||files.some(file=>!within(realObservedPath(file),root)))
    fail('typescript-input-outside-repository');
  return {configs:[...configReads].sort().map(file=>[hash(file),digestFile(file)]),
    files:[...new Set(files)].sort().map(file=>[hash(file),digestFile(file)]),queries:captured?.queries};
}
