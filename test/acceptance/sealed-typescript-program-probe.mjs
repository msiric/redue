// DISABLED acceptance probe preparation; not a recording or eligibility API.
// The parent must establish the reviewed native read-only staged filesystem view,
// runtime/implementation currency and source/stage ownership BEFORE invoking.
// This helper cannot prove that view or confine Node loader body reads. Public fs
// wrappers miss internalModuleStat/internalModuleReadJSON; CLI deferred checking
// is observed through the pinned noEmit API path below, not proven equivalent.
// Calling this performs API discovery/checking, not the configured CLI invocation.
// First-load, actual cwd and verified package admission below are prerequisites,
// not a substitute for that independent boundary. No imported loader/callback.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {directProject} from '../../src/direct-typescript.mjs';
import {compilerProgramFiles} from '../../src/typescript-list.mjs';
import {captureSealedTypeScriptDiscovery} from './sealed-typescript-discovery-journal.mjs';
import {createSealedTypeScriptForwarding} from './sealed-typescript-forwarding.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
const compilerDigest='953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816';
const limits=Object.freeze({path:4096,files:100000,configs:64,summaryBytes:8*1024*1024});
const canonical=value=>typeof value==='string'&&Buffer.byteLength(value)<=limits.path&&Buffer.from(value).toString('utf8')===value&&
  path.isAbsolute(value)&&path.normalize(value)===value&&value!=='/'&&!value.endsWith('/')&&!/[\u0000-\u001f\u007f\\:]/u.test(value);
const inside=(root,value)=>value===root||value.startsWith(root+'/');
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function probeSealedTypeScriptProgram(options){
  if(!options||typeof options!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(options))||
      Reflect.ownKeys(options).length!==2||!['root','script'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('SEALED_PROBE_OPTIONS');
  const {root,script}=options;
  if(!canonical(root)||typeof script!=='string'||!/^[-A-Za-z0-9_.:]{1,128}$/.test(script))fail('SEALED_PROBE_OPTIONS');
  if(process.cwd()!==root||fs.realpathSync(root)!==root||!fs.lstatSync(root).isDirectory())fail('SEALED_PROBE_CWD');
  // Existing admission checks the real environment and reviewed whole package;
  // no verify:false path or caller-selected implementation is exposed here.
  const compiler=directProject(root,script,{verify:true}),tsRoot=path.join(root,'node_modules/typescript');
  if(compiler.version!=='5.5.2'||compiler.digest!==compilerDigest||compiler.tsRoot!==tsRoot||
      compiler.entry!==path.join(tsRoot,'lib/tsc.js'))fail('SEALED_PROBE_COMPILER');
  const entry=path.join(tsRoot,'lib/typescript.js'),require=createRequire(path.join(root,'package.json'));
  if(fs.realpathSync(entry)!==entry||require.resolve(entry)!==entry)fail('SEALED_PROBE_COMPILER');
  const cacheKeys=Object.keys(require.cache);
  if(cacheKeys.length>limits.files||cacheKeys.some(key=>inside(tsRoot,key)))fail('SEALED_PROBE_CACHED_API');
  if(process.cwd()!==root)fail('SEALED_PROBE_CWD');
  const configs=new Set();let files;
  const journal=captureSealedTypeScriptDiscovery({fileSystem:fs,root,callback(observation){
    const ts=observation.phase('load',()=>require(entry));
    if(ts?.version!=='5.5.2'||!ts.sys||!['getParsedCommandLineOfConfigFile','createCompilerHost','createSourceFile','createProgram'].every(name=>typeof ts[name]==='function'))fail('SEALED_PROBE_API');
    const forwarded=createSealedTypeScriptForwarding({system:ts.sys,journal:observation}),methods={};let parsing=true;
    for(const name of Object.keys(forwarded))methods[name]=function(...args){
      return observation.phase(parsing?'config':'program',()=>{
        if(name==='readFile'){
          const file=typeof args[0]==='string'?path.resolve(root,args[0]):null;
          // Refuse this unsupported graph without reading outside config/source
          // bodies or fabricating a ts.sys false/undefined/missing answer.
          if(!file||!canonical(file)||!inside(root,file))fail(parsing?'SEALED_PROBE_CONFIG_OUTSIDE':'SEALED_PROBE_SOURCE_OUTSIDE');
        }
        const value=Reflect.apply(forwarded[name],undefined,args);
        if(parsing&&name==='readFile'&&value!==undefined){configs.add(path.resolve(root,args[0]));if(configs.size>limits.configs)fail('SEALED_PROBE_CONFIG_LIMIT');}
        return value;
      });
    };
    const validateParsed=parsed=>{
      const selected=parsed.options||{};
      if(selected.plugins?.length||selected.incremental||selected.composite||selected.listFilesOnly||parsed.projectReferences?.length)fail('SEALED_PROBE_CONFIG_UNSUPPORTED');
      const optionPath=value=>{
        if(typeof value!=='string'||Buffer.byteLength(value)>limits.path||/[\u0000-\u001f\u007f\\:]/u.test(value)||
            !inside(root,path.resolve(root,value)))fail('SEALED_PROBE_OPTION_OUTSIDE');
      };
      // Fixed reviewed option list, not a universal compiler-options policy.
      for(const name of ['configFilePath','baseUrl','pathsBasePath','rootDir','outDir','declarationDir','outFile','tsBuildInfoFile'])if(selected[name]!==undefined)optionPath(selected[name]);
      for(const name of ['rootDirs','typeRoots'])if(selected[name]!==undefined){if(!Array.isArray(selected[name])||selected[name].length>limits.configs)fail('SEALED_PROBE_CONFIG_UNSUPPORTED');for(const value of selected[name])optionPath(value);}
      if(selected.paths!==undefined){
        if(!selected.paths||typeof selected.paths!=='object'||Array.isArray(selected.paths)||Object.keys(selected.paths).length>limits.configs)fail('SEALED_PROBE_CONFIG_UNSUPPORTED');
        const base=selected.baseUrl??selected.pathsBasePath??root;
        for(const replacements of Object.values(selected.paths)){if(!Array.isArray(replacements)||replacements.length>limits.configs)fail('SEALED_PROBE_CONFIG_UNSUPPORTED');for(const value of replacements){optionPath(value);optionPath(path.resolve(base,value));}}
      }
      parsing=false;
    };
    files=compilerProgramFiles(ts,root,methods,{validateParsed,checkingMode:'sealed-noemit-cli-5.5.2@1'});
  }});
  if(process.cwd()!==root||!Array.isArray(files)||files.length===0||files.length>limits.files)fail('SEALED_PROBE_FILES');
  const names=[],configNames=[];let summaryBytes=Buffer.byteLength(JSON.stringify(journal))+1024;
  const retain=(target,file)=>{const name=path.relative(root,file).split(path.sep).join('/');
    summaryBytes+=Buffer.byteLength(JSON.stringify(name))+1;if(summaryBytes>limits.summaryBytes)fail('SEALED_PROBE_SUMMARY_LIMIT');target.push(name);};
  for(const file of files){if(!canonical(file)||!inside(root,file))fail('SEALED_PROBE_SOURCE_OUTSIDE');retain(names,file);if(fs.realpathSync(file)!==file)fail('SEALED_PROBE_FILE_ALIAS');}
  for(const file of configs)retain(configNames,file);
  // This summary keeps actual ordered graph results (including any duplicate).
  // No body reread, sorted legacy answer, hash or empty-directory proof is made.
  const result={schema:1,interpretation:'redue-sealed-typescript-program-probe@1',
    compiler:{version:'5.5.2',sha256:compilerDigest,entry:'node_modules/typescript/lib/typescript.js'},
    files:names,configs:configNames,
    observationStatus:journal.loggingComplete?'FORWARDED_CALLS_LOGGED':'INCOMPLETE',journal,
    graphCompleteness:'NOT_ESTABLISHED',apiCLICompleteness:'NOT_ESTABLISHED',
    nativeViewVerified:false,namespaceVerified:false,sealed:false,reuseEligible:false};
  if(Buffer.byteLength(JSON.stringify(result))>limits.summaryBytes)fail('SEALED_PROBE_SUMMARY_LIMIT');
  return freeze(result);
}
