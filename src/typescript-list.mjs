// TypeScript's compiler host exposes the filesystem questions used to resolve
// a program. Capture those answers, not runtime application accesses. Reuse is
// allowed only while every answer and the observed input content still matches.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {identityFields,racyUntil} from './path-identity.mjs';
const require=createRequire(import.meta.url);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function queryAnswer(kind,file,options) {
  try{
    if(kind==='readDirectory')return require(options.tsRoot).sys.readDirectory(file,
      ...options.args.map((value,i)=>options.undefinedArguments?.includes(i)?undefined:value)).sort();
    if(kind==='readFile')return hash(fs.readFileSync(file,'utf8'));
    if(kind==='fileExists')return fs.statSync(file).isFile();
    if(kind==='directoryExists')return fs.statSync(file).isDirectory();
    // The compiler resolves through realpathSync.native outside Windows.
    if(kind==='realpath')return process.platform==='win32'?fs.realpathSync(file):fs.realpathSync.native(file);
    if(kind==='directories')return fs.readdirSync(file,{withFileTypes:true})
      .filter(entry=>entry.isDirectory()||entry.isSymbolicLink()&&
        fs.statSync(path.join(file,entry.name)).isDirectory()).map(entry=>entry.name).sort();
    // Directory entries include names/types, including newly created candidates.
    if(kind==='entries')return fs.readdirSync(file,{withFileTypes:true})
      .map(entry=>[entry.name,entry.isDirectory()?'d':entry.isSymbolicLink()?'l':'f']).sort();
    // A compiler directory listing: subdirectories and files with a requested
    // extension, classifying links by their targets as matchFiles does.
    if(kind==='listing'){
      const suffixes=options?.extensions?.map(value=>value.toLowerCase());
      return fs.readdirSync(file,{withFileTypes:true}).flatMap(entry=>{
        let type=entry;
        if(entry.isSymbolicLink())try{type=fs.statSync(path.join(file,entry.name));}catch{return [];}
        if(type.isDirectory())return [[entry.name,'d']];
        if(type.isFile()&&(!suffixes||suffixes.some(value=>entry.name.toLowerCase().endsWith(value))))
          return [[entry.name,'f']];
        return [];
      }).sort();
    }
    throw Error('unknown compiler filesystem question');
  }catch(error){if(['ENOENT','ENOTDIR'].includes(error.code))return null;throw error;}
}
// Null when every run fact answers as it did during the run, otherwise the
// first path that does not. Asked in-process; nothing is launched.
export function runFactChange(facts) {
  if(!Array.isArray(facts))return 'an unreadable run fact';
  for(const fact of facts){
    if(!Array.isArray(fact)||!['fileExists','directoryExists','realpath','readFile'].includes(fact[0])||
      typeof fact[1]!=='string')return 'an unreadable run fact';
    const [kind,file,answer]=fact;
    let now;try{now=queryAnswer(kind,file);}catch{return file;}
    if(now!==answer)return file;
  }
  return null;
}
// Why a receipt's run facts no longer hold, or null when they all do.
export function runFactReason(facts) {
  const changed=runFactChange(facts);
  return changed&&`a lookup the last run made answers differently now: ${changed}`;
}
export function queriesMatch(queries) {
  if(!queries?.length)return false;
  return queries.every(([kind,file,answer,options])=>
    JSON.stringify(queryAnswer(kind,file,options))===JSON.stringify(answer));
}
export function compilerFiles(tsRoot,cwd) {
  const require=createRequire(import.meta.url),ts=require(tsRoot);
  if(typeof ts.createProgram!=='function'||typeof ts.createCompilerHost!=='function')return null;
  const queries=new Map();
  const remember=(kind,file,options)=>{
    const full=path.resolve(file),answer=queryAnswer(kind,full,options);
    queries.set(kind+'\0'+full+(options?JSON.stringify(options):''),
      options?[kind,full,answer,options]:[kind,full,answer]);return answer;
  };
  const readFile=file=>{remember('readFile',file);return ts.sys.readFile(file);};
  const fileExists=file=>{remember('fileExists',file);return ts.sys.fileExists(file);};
  const directoryExists=file=>{remember('directoryExists',file);return ts.sys.directoryExists(file);};
  const getDirectories=file=>{remember('directories',file);return ts.sys.getDirectories(file);};
  const readDirectory=(dir,...args)=>{
    // Reviewed compilers enumerate each visited directory through fs.readdirSync.
    // Record those listings as ordinary questions so a validator without the
    // compiler API can replay this answer; the listing itself stays authoritative.
    const listed=[],readdirSync=fs.readdirSync;
    fs.readdirSync=function(file,...rest){listed.push(path.resolve(String(file)));
      return readdirSync.call(this,file,...rest);};
    let result;try{result=ts.sys.readDirectory(dir,...args);}finally{fs.readdirSync=readdirSync;}
    // JSON turns undefined array entries into null. TypeScript distinguishes
    // them (an omitted exclude list is not a null list), so retain that fact.
    const full=path.resolve(dir),options={tsRoot,args,argsVersion:1,
      undefinedArguments:args.flatMap((value,i)=>value===undefined?[i]:[])};
    const visited=new Set(listed);
    if(typeof ts.getFileMatcherPatterns==='function'&&
      result.every(file=>visited.has(path.dirname(path.resolve(file)))))try{
      // Base paths and symlinked directories reach matchFiles through realpath
      // deduplication without a listing; a retargeted link changes this answer.
      for(const base of ts.getFileMatcherPatterns(full,args[1],args[2],
        ts.sys.useCaseSensitiveFileNames,process.cwd()).basePaths)remember('realpath',base);
      const extensions=Array.isArray(args[0])?args[0]:null;
      for(const directory of visited){
        // matchFiles also resolves every visited directory to detect cycles.
        remember('realpath',directory);
        remember('listing',directory,{extensions});
        let entries=[];
        try{entries=fs.readdirSync(directory,{withFileTypes:true});}
        catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;}
        for(const entry of entries)
          if(entry.isSymbolicLink())remember('realpath',path.join(directory,entry.name));
      }
      options.covered=1;
    }catch{/* uncovered listings are replayed only through the compiler API */}
    queries.set('readDirectory\0'+full+JSON.stringify(args),
      ['readDirectory',full,[...result].sort(),options]);
    return result;
  };
  const realpath=file=>{remember('realpath',file);return ts.sys.realpath(file);};
  // `extends` of a package config resolves through realpath too.
  const parsed=ts.getParsedCommandLineOfConfigFile(path.join(cwd,'tsconfig.json'),{},
    {...ts.sys,readFile,fileExists,directoryExists,getDirectories,readDirectory,realpath,
      onUnRecoverableConfigFileDiagnostic(){}});
  if(!parsed||parsed.errors?.length)throw Error('TypeScript configuration unavailable');
  const host=ts.createCompilerHost(parsed.options);
  Object.assign(host,{readFile,fileExists,directoryExists,getDirectories,readDirectory,
    realpath,
    getSourceFile(file,languageVersion,onError){
      const text=readFile(file);return text===undefined?undefined:
        ts.createSourceFile(file,text,languageVersion);
    }});
  const program=ts.createProgram({rootNames:parsed.fileNames,options:parsed.options,
    projectReferences:parsed.projectReferences,host});
  const files=program.getSourceFiles().map(file=>path.resolve(file.fileName));
  // Stable answers are necessary even at first capture; a concurrent edit
  // cannot become the basis for a reusable discovery result.
  const facts=[...queries.values()];
  // A certificate must cover every program file. Referenced configurations
  // are parsed through this host, so their reads and listings are certified.
  const complete=files.every(file=>queries.has('readFile\0'+file));
  return {files,queries:complete&&queriesMatch(facts)?facts:null};
}
// Identity of a read file and, for a link, of its target. Writes through any
// alias change ctime. A file changed within the last 2 s has no identity, so a
// coarse timestamp cannot hide a second write in the same tick (git's racy rule).
export function fileIdentity(file,now=Date.now()) {
  try{const link=fs.lstatSync(file,{bigint:true}),target=link.isSymbolicLink()?fs.statSync(file,{bigint:true}):link;
    if(racyUntil(link)>=now||racyUntil(target)>=now)return null;
    const fields=st=>identityFields.map(key=>String(st[key]));
    return JSON.stringify([fields(target),target===link?null:[fs.realpathSync(file),...fields(link)]]);}
  catch(error){if(['ENOENT','ENOTDIR'].includes(error.code))return null;throw error;}
}
// In-process replay of a certificate. Covered directory listings are checked
// through their recorded listings instead of loading the compiler API. A read
// file is re-hashed until a match records its identity, taken before the read,
// and again whenever that identity changes.
export function queriesHold(queries,identities=new Map()) {
  if(!queries?.length)return false;
  return queries.every(([kind,file,answer,options])=>{
    if(kind==='readDirectory')return options?.covered===1;
    const identity=kind==='readFile'?fileIdentity(file):null;
    if(identity&&identities.get(file)===identity)return true;
    const held=JSON.stringify(queryAnswer(kind,file,options))===JSON.stringify(answer);
    if(kind==='readFile'){if(held&&identity)identities.set(file,identity);else identities.delete(file);}
    return held;
  });
}
