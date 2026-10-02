#!/usr/bin/env node
// Read-only applicability probe for the deliberately narrow npm/tsc --noEmit
// contract. It emits one digest; failures emit only a fixed diagnostic code.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const [rootArg,scriptName,npmArg]=process.argv.slice(2);
const hash=value=>createHash('sha256').update(value).digest('hex');
const within=(file,root)=>file===root||file.startsWith(root+path.sep);
const fail=code=>{throw Object.assign(Error(code),{code});};
const digestFile=file=>hash(fs.readFileSync(file));
const require=createRequire(import.meta.url);
function treeHash(dir){
  const digest=createHash('sha256');let count=0;
  const visit=(folder,rel='')=>{
    for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>
      a.name.localeCompare(b.name))){
      const name=rel?rel+'/'+entry.name:entry.name,full=path.join(folder,entry.name);
      if(entry.isDirectory())visit(full,name);
      else if(entry.isFile()){digest.update(name+'\0'+digestFile(full)+'\0');count++;}
      else fail('npm-installation-unobservable');
    }
  };
  visit(dir);return [digest.digest('hex'),count];
}
function npmRcKeys(file){
  if(!fs.existsSync(file))return null;
  const keys=[];
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const trimmed=line.trim();if(!trimmed||/^[#;]/.test(trimmed))continue;
    const at=trimmed.indexOf('=');if(at<0)fail('npm-configuration-unsupported');
    const key=trimmed.slice(0,at).trim();
    if(key!=='registry'&&!/^\/\/[^\s]+\/:_authToken$/.test(key))
      fail('npm-configuration-unsupported');
    keys.push(key);
  }
  return keys.sort();
}
try{
  if(!rootArg||!scriptName||!npmArg)fail('probe-arguments');
  const root=fs.realpathSync(rootArg),npm=fs.realpathSync(npmArg);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  if(pkg.scripts?.[scriptName]?.trim()!=='tsc --noEmit'||
    pkg.scripts?.['pre'+scriptName]||pkg.scripts?.['post'+scriptName])
    fail('typecheck-script-changed');
  if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.BASH_ENV||
    process.env.ENV||Object.keys(process.env).some(key=>
      /^(npm_config_|DYLD_|TSGO_)/i.test(key)))fail('execution-environment-unsupported');
  const tsRoot=path.join(root,'node_modules','typescript');
  const tsc=fs.realpathSync(path.join(root,'node_modules','.bin','tsc'));
  if(tsc!==path.join(tsRoot,'bin','tsc'))fail('typescript-executable-changed');
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
  for(const file of configReads)if(!within(fs.realpathSync(file),root))
    fail('typescript-config-outside-repository');
  const listed=spawnSync(process.execPath,[tsc,'--noEmit','--listFilesOnly'],
    {cwd:root,env:process.env,encoding:'utf8',timeout:4000,maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
  if(listed.error||listed.signal||listed.status!==0)fail('typescript-input-list-unavailable');
  const files=listed.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>path.resolve(file));
  if(!files.length||files.some(file=>!within(fs.realpathSync(file),root)))
    fail('typescript-input-outside-repository');
  const npmRoot=path.dirname(path.dirname(npm));
  if(path.basename(npmRoot)!=='npm'||path.basename(path.dirname(npmRoot))!=='node_modules')
    fail('npm-installation-layout-unsupported');
  const home=process.env.HOME;
  if(!home||!path.isAbsolute(home))fail('home-context-unavailable');
  const npmConfig=[path.join(root,'.npmrc'),path.join(home,'.npmrc')]
    .map(file=>[hash(file),npmRcKeys(file)]);
  const facts={schema:1,root:hash(root),script:scriptName,
    configs:[...configReads].sort().map(file=>[hash(file),digestFile(file)]),
    files:[...new Set(files)].sort().map(file=>[hash(file),digestFile(file)]),
    npmTree:treeHash(npmRoot),npmConfig,
    node:hash(JSON.stringify([process.version,fs.realpathSync(process.execPath),
      fs.statSync(process.execPath).size])),
    shell:digestFile('/bin/sh')};
  process.stdout.write(hash(JSON.stringify(facts)));
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:
  'typescript-contract-unavailable'}`);process.exitCode=2;}
