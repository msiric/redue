// TypeScript's compiler host exposes the filesystem questions used to resolve
// a program. Capture those answers, not runtime application accesses. Reuse is
// allowed only while every answer and the observed input content still matches.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function queryAnswer(kind,file,options) {
  try{
    if(kind==='readDirectory')return require(options.tsRoot).sys.readDirectory(file,...options.args).sort();
    if(kind==='readFile')return hash(fs.readFileSync(file,'utf8'));
    if(kind==='fileExists')return fs.statSync(file).isFile();
    if(kind==='directoryExists')return fs.statSync(file).isDirectory();
    if(kind==='realpath')return fs.realpathSync(file);
    if(kind==='directories')return fs.readdirSync(file,{withFileTypes:true})
      .filter(entry=>entry.isDirectory()||entry.isSymbolicLink()&&
        fs.statSync(path.join(file,entry.name)).isDirectory()).map(entry=>entry.name).sort();
    // Directory entries include names/types, including newly created candidates.
    if(kind==='entries')return fs.readdirSync(file,{withFileTypes:true})
      .map(entry=>[entry.name,entry.isDirectory()?'d':entry.isSymbolicLink()?'l':'f']).sort();
    throw Error('unknown compiler filesystem question');
  }catch(error){if(['ENOENT','ENOTDIR'].includes(error.code))return null;throw error;}
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
  const remember=(kind,file)=>{
    const full=path.resolve(file),answer=queryAnswer(kind,full);
    queries.set(kind+'\0'+full,[kind,full,answer]);return answer;
  };
  const readFile=file=>{remember('readFile',file);return ts.sys.readFile(file);};
  const fileExists=file=>{remember('fileExists',file);return ts.sys.fileExists(file);};
  const directoryExists=file=>{remember('directoryExists',file);return ts.sys.directoryExists(file);};
  const getDirectories=file=>{remember('directories',file);return ts.sys.getDirectories(file);};
  const readDirectory=(dir,...args)=>{
    const result=ts.sys.readDirectory(dir,...args);
    const full=path.resolve(dir),options={tsRoot,args};
    queries.set('readDirectory\0'+full+JSON.stringify(args),
      ['readDirectory',full,[...result].sort(),options]);
    return result;
  };
  const parsed=ts.getParsedCommandLineOfConfigFile(path.join(cwd,'tsconfig.json'),{},
    {...ts.sys,readFile,fileExists,directoryExists,getDirectories,readDirectory,
      onUnRecoverableConfigFileDiagnostic(){}});
  if(!parsed||parsed.errors?.length)throw Error('TypeScript configuration unavailable');
  const host=ts.createCompilerHost(parsed.options);
  Object.assign(host,{readFile,fileExists,directoryExists,getDirectories,
    realpath(file){remember('realpath',file);return ts.sys.realpath(file);},
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
  return {files,queries:queriesMatch(facts)?facts:null};
}
