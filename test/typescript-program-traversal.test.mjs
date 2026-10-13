// Shared traversal and legacy-denial controls; fake compiler only, not a seal.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createHash} from 'node:crypto';
import {compilerProgramFiles,queryAnswer} from '../src/typescript-list.mjs';
function fixture(){const observed=[];const methods={readFile:f=>{observed.push(['read',f]);return f.endsWith('missing.ts')?undefined:'export {};';},fileExists:f=>{observed.push(['exists',f]);return false;},directoryExists:()=>false,getDirectories:()=>[],readDirectory:()=>['/stage/a.ts'],realpath:f=>f};
 let parsedHost,program;const ts={sys:{sentinel:'sys-default'},getParsedCommandLineOfConfigFile(file,options,host){observed.push(['config',file]);parsedHost=host;assert.deepEqual(options,{});return{options:{noEmit:true},fileNames:['/stage/a.ts'],projectReferences:undefined};},createCompilerHost:options=>({options}),createSourceFile:(name,text,version)=>({name,text,version}),createProgram:value=>{program=value;return{getSourceFiles:()=>[{fileName:'/stage/a.ts'}]};}};
 return{ts,methods,observed,get parsedHost(){return parsedHost;},get program(){return program;}};}
test('shared traversal preserves config, rootNames, host forwarding and source decoding',()=>{const f=fixture();assert.deepEqual(compilerProgramFiles(f.ts,'/stage',f.methods),['/stage/a.ts']);assert.equal(f.parsedHost.sentinel,'sys-default');assert.equal(f.parsedHost.readFile,f.methods.readFile);assert.equal(f.program.host.realpath,f.methods.realpath);assert.deepEqual(f.program.rootNames,['/stage/a.ts']);assert.deepEqual(f.program.host.getSourceFile('/stage/a.ts',99),{name:'/stage/a.ts',text:'export {};',version:99});assert.equal(f.program.host.getSourceFile('/stage/missing.ts',99),undefined);});
test('shared traversal forwards an actual host denial without manufacturing a missing answer',()=>{const f=fixture(),error=Object.assign(Error('synthetic'),{code:'EPERM'});f.methods.readFile=()=>{throw error;};compilerProgramFiles(f.ts,'/stage',f.methods);assert.throws(()=>f.program.host.getSourceFile('/stage/a.ts',1),e=>e===error);});
test('invalid parsed configuration is still rejected before creating a program',()=>{const f=fixture();let count=0;f.ts.getParsedCommandLineOfConfigFile=()=>({errors:[{}]});f.ts.createProgram=()=>{count++;};assert.throws(()=>compilerProgramFiles(f.ts,'/stage',f.methods),/configuration unavailable/);assert.equal(count,0);});
test('legacy raw query denial precedes ts.sys fallback after traversal extraction',()=>{let sysCalled=0;const denied=Object.assign(Error('synthetic'),{code:'EACCES'}),ts={sys:{fileExists:()=>{sysCalled++;return false;}},createCompilerHost:()=>({}),getParsedCommandLineOfConfigFile(_f,_o,host){host.fileExists('/stage/denied.ts');},createProgram:()=>({})};
 const text=fs.readFileSync(new URL('../src/typescript-list.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function ','function ').replaceAll('import.meta.url',"'file:///synthetic/typescript-list.mjs'")+';globalThis.invoke=compilerFiles;';const context=vm.createContext({fs:{statSync:()=>{throw denied;}},path,createHash,createRequire:()=>()=>ts});vm.runInContext(text,context);assert.throws(()=>context.invoke('/stage/node_modules/typescript','/stage'),e=>e===denied);assert.equal(sysCalled,0);});
test('legacy unknown query kind remains rejected and receives no sealed exception',()=>{assert.throws(()=>queryAnswer('unsupported','/does-not-matter'),/unknown compiler filesystem question/);});

test('trusted parsed guard runs once on the same configuration before host/program construction',()=>{const f=fixture();let seen,hosts=0;const original=f.ts.createCompilerHost;f.ts.createCompilerHost=o=>{hosts++;assert(seen);return original(o);};compilerProgramFiles(f.ts,'/stage',f.methods,{validateParsed(parsed){seen=parsed;assert.equal(hosts,0);assert.deepEqual(parsed.options,{noEmit:true});}});assert.equal(hosts,1);assert.equal(f.program.options,seen.options);});
test('parsed guard rejection or asynchronous/nonempty return launches no host or program',()=>{for(const validateParsed of [()=>{throw Error('unsupported config');},async()=>{},()=>false,17]){const f=fixture();let hosts=0,programs=0;f.ts.createCompilerHost=()=>{hosts++;};f.ts.createProgram=()=>{programs++;};assert.throws(()=>compilerProgramFiles(f.ts,'/stage',f.methods,{validateParsed}));assert.equal(hosts,0);assert.equal(programs,0);}});
test('default path has no checking-mode behavior or diagnostic API requirement',()=>{const f=fixture();f.ts.version='not-sealed';assert.deepEqual(compilerProgramFiles(f.ts,'/stage',f.methods),['/stage/a.ts']);assert.equal(Object.hasOwn(f.program.host,'jsDocParsingMode'),false);});
test('unknown modes, accessor settings and wrong selected version refuse before parse/host/program',()=>{
 for(const settings of [{checkingMode:'OTHER'},{checkingMode:null},{checkingMode:true},{checkingMode:'sealed-noemit-cli-5.5.2@1'}]){
   const f=fixture();let calls=0;f.ts.getParsedCommandLineOfConfigFile=()=>{calls++;throw Error();};assert.throws(()=>compilerProgramFiles(f.ts,'/stage',f.methods,settings));assert.equal(calls,0);
 }
 let getters=0;const f=fixture(),settings={};Object.defineProperty(settings,'checkingMode',{get(){getters++;return 'sealed-noemit-cli-5.5.2@1';}});assert.throws(()=>compilerProgramFiles(f.ts,'/stage',f.methods,settings));assert.equal(getters,0);
});

test('default configuration host retains its original sys realpath or original lack of that property',()=>{
 for(const present of [false,true]){const f=fixture(),original=function(file){return file;};if(present)f.ts.sys.realpath=original;
  compilerProgramFiles(f.ts,'/stage',f.methods);assert.equal(Object.hasOwn(f.parsedHost,'realpath'),present);if(present)assert.equal(f.parsedHost.realpath,original);assert.equal(f.program.host.realpath,f.methods.realpath);
 }
});
test('sealed checking configuration uses the same supplied realpath guard before any host/program construction',()=>{
 const f=fixture(),denied=Object.assign(Error('NONSECRET'),{code:'SEALED_PROBE_GIT_UNSUPPORTED'});f.ts.version='5.5.2';let calls=0,hosts=0;
 f.methods.realpath=function(file){calls++;assert.equal(file,'/stage/.git/absent');throw denied;};f.ts.sys.realpath=()=>{assert.fail('UNGUARDED_SYS_REALPATH');};
 f.ts.getParsedCommandLineOfConfigFile=function(_file,options,host){assert.deepEqual(options,{noEmit:true});assert.equal(host.realpath,f.methods.realpath);host.realpath('/stage/.git/absent');};f.ts.createCompilerHost=()=>{hosts++;};
 assert.throws(()=>compilerProgramFiles(f.ts,'/stage',f.methods,{checkingMode:'sealed-noemit-cli-5.5.2@1'}),error=>error===denied);assert.equal(calls,1);assert.equal(hosts,0);
});
