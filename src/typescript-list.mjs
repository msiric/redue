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
    if(kind==='readDirectory')return require(options.tsRoot).sys.readDirectory(file,
      ...options.args.map((value,i)=>options.undefinedArguments?.includes(i)?undefined:value)).sort();
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
    // JSON turns undefined array entries into null. TypeScript distinguishes
    // them (an omitted exclude list is not a null list), so retain that fact.
    const full=path.resolve(dir),options={tsRoot,args,argsVersion:1,
      undefinedArguments:args.flatMap((value,i)=>value===undefined?[i]:[])};
    queries.set('readDirectory\0'+full+JSON.stringify(args),
      ['readDirectory',full,[...result].sort(),options]);
    return result;
  };
  const files=compilerProgramFiles(ts,cwd,{readFile,fileExists,directoryExists,
    getDirectories,readDirectory,realpath(file){remember('realpath',file);return ts.sys.realpath(file);}});
  // Stable answers are necessary even at first capture; a concurrent edit
  // cannot become the basis for a reusable discovery result.
  const facts=[...queries.values()];
  return {files,queries:queriesMatch(facts)?facts:null};
}

// Shared program traversal for locally verified compiler probes. This function
// does not load a compiler or authorize caller-provided/imported code. A sealed
// probe must install its scoped observation BEFORE the first verified TS load,
// then supply forwarding sys methods from that same restricted filesystem view.
// Returned file names alone establish neither query completeness nor eligibility.
export function compilerProgramFiles(ts,cwd,{readFile,fileExists,directoryExists,
  getDirectories,readDirectory,realpath},settings={}) {
  // Fixed trusted-source mode only. It does not verify an implementation or
  // authorize imported code; the sealed caller verifies the package BEFORE load.
  if(!settings||Object.getPrototypeOf(settings)!==Object.prototype||Reflect.ownKeys(settings).some(key=>!['validateParsed','checkingMode'].includes(key)))throw Error('TypeScript traversal settings unavailable');
  const readSetting=key=>{const d=Object.getOwnPropertyDescriptor(settings,key);if(d&&!Object.hasOwn(d,'value'))throw Error('TypeScript traversal settings unavailable');return d?.value;};
  const validateParsed=readSetting('validateParsed'),checkingMode=readSetting('checkingMode');
  if(checkingMode!==undefined&&checkingMode!=='sealed-noemit-cli-5.5.2@1')throw Error('TypeScript checking mode unavailable');
  const checking=checkingMode!==undefined;
  if(checking&&ts.version!=='5.5.2')throw Error('TypeScript checking implementation unavailable');
  const parsed=ts.getParsedCommandLineOfConfigFile(path.join(cwd,'tsconfig.json'),checking?{noEmit:true}:{},
    {...ts.sys,readFile,fileExists,directoryExists,getDirectories,readDirectory,
      ...(checking?{realpath}:{}),
      onUnRecoverableConfigFileDiagnostic(){}});
  if(!parsed||parsed.errors?.length)throw Error('TypeScript configuration unavailable');
  // This is a trusted local synchronous guard, never selected by imported data.
  // It validates the SAME parsed config before any program/host is constructed.
  if(validateParsed!==undefined){
    if(typeof validateParsed!=='function'||Object.getPrototypeOf(validateParsed)!==Function.prototype||
      validateParsed(parsed)!==undefined)throw Error('TypeScript parsed guard unavailable');
  }
  if(checking){
    const options=parsed.options;
    if(!options||typeof options!=='object'||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'noEmit')??{},'value')||options.noEmit!==true||options.incremental||options.composite||options.listFilesOnly||options.plugins?.length||parsed.projectReferences?.length)throw Error('TypeScript checking configuration unavailable');
  }
  const host=ts.createCompilerHost(parsed.options);
  // Pinned 5.5.2 CLI defaultJSDocParsingMode = ParseForTypeErrors (2).
  if(checking)host.jsDocParsingMode=2;
  Object.assign(host,{readFile,fileExists,directoryExists,getDirectories,realpath,
    getSourceFile(file,languageVersion,onError){
      const text=readFile(file);return text===undefined?undefined:
        ts.createSourceFile(file,text,languageVersion);
    }});
  const program=ts.createProgram({rootNames:parsed.fileNames,options:parsed.options,
    projectReferences:parsed.projectReferences,host});
  if(checking){
    const method=name=>{const d=Object.getOwnPropertyDescriptor(program,name);if(!d||!Object.hasOwn(d,'value')||typeof d.value!=='function'||Object.getPrototypeOf(d.value)!==Function.prototype)throw Error('TypeScript checking API unavailable');return (...args)=>Reflect.apply(d.value,program,args);};
    const methods=Object.fromEntries(['getConfigFileParsingDiagnostics','getSyntacticDiagnostics','getOptionsDiagnostics','getGlobalDiagnostics','getSemanticDiagnostics','emit','getSourceFiles'].map(name=>[name,method(name)]));
    let count=0;
    const diagnostics=rows=>{if(!Array.isArray(rows)||Object.getPrototypeOf(rows)!==Array.prototype||rows.length>100000||Reflect.ownKeys(rows).length!==rows.length+1)throw Error('TypeScript checking diagnostics unavailable');for(let at=0;at<rows.length;at++){const d=Object.getOwnPropertyDescriptor(rows,String(at));if(!d||!Object.hasOwn(d,'value'))throw Error('TypeScript checking diagnostics unavailable');}count+=rows.length;if(count>100000)throw Error('TypeScript checking diagnostics unavailable');return rows.length;};
    // Mirror emitFilesAndReportErrors' no-listFilesOnly ordering. Diagnostic
    // objects/text never escape; type errors are observations, not probe failure.
    const initial=diagnostics(methods.getConfigFileParsingDiagnostics());
    diagnostics(methods.getSyntacticDiagnostics(undefined,undefined));
    if(count===initial){diagnostics(methods.getOptionsDiagnostics(undefined));diagnostics(methods.getGlobalDiagnostics(undefined));if(count===initial)diagnostics(methods.getSemanticDiagnostics(undefined,undefined));}
    // Under noEmit the official emit path still evaluates semantic diagnostics.
    // Incremental/composite are refused; any unexpected output attempt is latched
    // even if the compiler catches the callback exception. No file is written.
    let outputAttempted=false;
    const emitted=methods.emit(undefined,()=>{outputAttempted=true;throw Error('TypeScript checking output unavailable');},undefined,undefined,undefined);
    if(outputAttempted||!emitted||typeof emitted!=='object')throw Error('TypeScript checking output unavailable');
    const diagnosticDescriptor=Object.getOwnPropertyDescriptor(emitted,'diagnostics'),filesDescriptor=Object.getOwnPropertyDescriptor(emitted,'emittedFiles');
    if(!diagnosticDescriptor||!Object.hasOwn(diagnosticDescriptor,'value')||filesDescriptor&&!Object.hasOwn(filesDescriptor,'value')||filesDescriptor?.value!==undefined&&(!Array.isArray(filesDescriptor.value)||filesDescriptor.value.length))throw Error('TypeScript checking output unavailable');
    diagnostics(diagnosticDescriptor.value);
    const files=methods.getSourceFiles();if(!Array.isArray(files)||Object.getPrototypeOf(files)!==Array.prototype)throw Error('TypeScript checking membership unavailable');
    return files.map(file=>path.resolve(file.fileName));
  }
  return program.getSourceFiles().map(file=>path.resolve(file.fileName));
}
