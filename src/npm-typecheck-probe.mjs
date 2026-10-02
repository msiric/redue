#!/usr/bin/env node
// Read-only reviewed boundary for an npm script invoking local TypeScript.
// A nonzero exit withdraws applicability. Output is a digest, never config values.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const [rootArg,nodeArg,npmArg,reviewedTsconfigHash,npmVersion,typescriptVersion]=process.argv.slice(2);
const sha=value=>createHash('sha256').update(value).digest('hex');
const inside=(file,dir)=>file===dir||file.startsWith(dir+path.sep);
const fail=reason=>{throw Error(`typecheck boundary unavailable: ${reason}`);};
const real=file=>fs.realpathSync(file);
function fileHash(file){
  const digest=createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(1024*1024);
  try{for(;;){const count=fs.readSync(fd,buffer,0,buffer.length,null);
    if(!count)break;digest.update(buffer.subarray(0,count));}}
  finally{fs.closeSync(fd);}
  return digest.digest('hex');
}
function treeHash(dir){
  const digest=createHash('sha256');
  function visit(folder,relative=''){
    for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>
      a.name.localeCompare(b.name))){
      const rel=relative?relative+'/'+entry.name:entry.name,full=path.join(folder,entry.name);
      if(entry.isDirectory()){digest.update(`d\0${rel}\0`);visit(full,rel);}
      else if(entry.isFile())digest.update(`f\0${rel}\0${fileHash(full)}\0`);
      else fail('npm installation contains an unsupported entry');
    }
  }
  visit(dir);return digest.digest('hex');
}
function namesAt(dir){
  if(!fs.existsSync(dir))return null;
  if(!fs.statSync(dir).isDirectory())fail('ancestor resolution boundary is not a directory');
  const names=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>
    a.name.localeCompare(b.name))){
    names.push(entry.name);
    if(entry.name.startsWith('@')&&entry.isDirectory())
      names.push(...fs.readdirSync(path.join(dir,entry.name)).map(name=>entry.name+'/'+name).sort());
  }
  return names;
}
function rcKeys(file){
  if(!fs.existsSync(file))return null;
  const keys=[];
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const trimmed=line.trim();
    if(!trimmed||trimmed.startsWith('#')||trimmed.startsWith(';'))continue;
    const at=trimmed.indexOf('=');
    if(at<0)fail('npm configuration has an unsupported entry');
    const key=trimmed.slice(0,at).trim();
    // These affect package acquisition, not this offline `npm run typecheck`.
    if(key!=='registry'&&!/^\/\/[^\s]+\/:_authToken$/.test(key))
      fail('npm configuration contains an unreviewed key');
    keys.push(key);
  }
  return keys.sort();
}
function pathExecutable(name){
  for(const folder of (process.env.PATH||'').split(path.delimiter)){
    if(!folder)continue;
    const candidate=path.join(folder,name);
    try{fs.accessSync(candidate,fs.constants.X_OK);return real(candidate);}catch{}
  }
  return null;
}
try{
  if(!rootArg||!nodeArg||!npmArg||!reviewedTsconfigHash||!npmVersion||!typescriptVersion)
    fail('arguments missing');
  const root=real(rootArg),node=real(nodeArg),npm=real(npmArg),home=process.env.HOME;
  if(!home||!path.isAbsolute(home))fail('HOME is unavailable');
  const homeTarget=real(home);
  if(real(process.execPath)!==node||pathExecutable('node')!==node)
    fail('npm shebang would use a different Node executable');
  if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.BASH_ENV||process.env.ENV)
    fail('unreviewed Node or shell preload environment');
  if(Object.keys(process.env).some(key=>key.toLowerCase().startsWith('npm_config_')))
    fail('npm configuration environment override');
  if(Object.keys(process.env).some(key=>key.startsWith('DYLD_')||key.startsWith('TSGO_')))
    fail('unreviewed native runtime environment');
  const npmRoot=path.dirname(path.dirname(npm)),prefix=path.dirname(path.dirname(path.dirname(npmRoot)));
  if(path.basename(npmRoot)!=='npm'||path.basename(path.dirname(npmRoot))!=='node_modules')
    fail('npm installation layout changed');
  if(JSON.parse(fs.readFileSync(path.join(npmRoot,'package.json'),'utf8')).version!==npmVersion||
    JSON.parse(fs.readFileSync(path.join(root,'node_modules/typescript/package.json'),'utf8'))
      .version!==typescriptVersion)fail('reviewed npm or TypeScript version changed');
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  if(pkg.scripts?.typecheck!=='tsc --noEmit'||pkg.scripts?.pretypecheck||pkg.scripts?.posttypecheck)
    fail('typecheck script or lifecycle changed');
  const tsconfig=path.join(root,'tsconfig.json');
  if(fileHash(tsconfig)!==reviewedTsconfigHash)fail('TypeScript configuration needs review');
  const tsc=real(path.join(root,'node_modules','.bin','tsc'));
  if(tsc!==path.join(root,'node_modules','typescript','bin','tsc'))
    fail('typecheck executable does not resolve to local TypeScript');
  const listed=spawnSync(tsc,['--noEmit','--listFilesOnly'],{cwd:root,env:process.env,
    encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe']});
  if(listed.error||listed.signal||listed.status!==0)fail('TypeScript input listing unavailable');
  const files=listed.stdout.trim().split(/\r?\n/).filter(Boolean).map(file=>path.resolve(file));
  if(!files.length||files.some(file=>!inside(file,root)||
    !(inside(file,path.join(root,'src'))||file===path.join(root,'vite.config.ts')||
      inside(file,path.join(root,'node_modules')))))
    fail('TypeScript consumes an input outside the observed file sets');
  const ancestors=[];
  for(let dir=path.dirname(root);;dir=path.dirname(dir)){
    ancestors.push([dir,namesAt(path.join(dir,'node_modules'))]);
    if(dir===path.dirname(dir))break;
  }
  const configFiles=[path.join(root,'.npmrc'),path.join(home,'.npmrc'),
    path.join(prefix,'etc','npmrc')];
  const npmConfig=configFiles.map(file=>[file,rcKeys(file)]);
  // Metadata alone is insufficient for the installed npm CLI and native tools.
  const fingerprint=sha(JSON.stringify({schema:1,probe:fileHash(fileURLToPath(import.meta.url)),
    homeTarget,files:files.sort(),ancestors,
    npmConfig,npmTree:treeHash(npmRoot),node:fileHash(node),shell:fileHash('/bin/sh')}));
  process.stdout.write(fingerprint);
}catch(e){console.error(e.message);process.exitCode=2;}
