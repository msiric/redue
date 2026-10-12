// Injected fake systems/programs only. No TS API/compiler/native/model/CI calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSealedTypeScriptForwarding as forwarding,SEALED_FORWARDING_CONTRACT as contract} from './acceptance/sealed-typescript-forwarding.mjs';
import {captureSealedTypeScriptDiscovery as capture} from './acceptance/sealed-typescript-discovery-journal.mjs';
import {compilerProgramFiles} from '../src/typescript-list.mjs';
const root='/owned/stage';
const names=['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function systemFixture(){return {
  readFile(){return 'decoded';},fileExists(){return false;},directoryExists(){return true;},
  getDirectories(){return ['nested'];},readDirectory(){return ['a.ts'];},realpath(file){return file;},
};}
function fsFixture(){const fs={statSync(){return false;},readFileSync(){return Buffer.from('raw');},readdirSync(){return [];},realpathSync(file){return file;}};
  Object.defineProperty(fs.realpathSync,'native',{value:function(file){return file;},configurable:true});return fs;}
const throwsCode=(fn,code)=>assert.throws(fn,error=>error?.code===code);

test('adapter exposes exactly the shared traversal methods without mutating system or journal',()=>{
  const system=systemFixture(),journal={semantic(name,file,fn){return fn();}};
  const originalSystem=Object.getOwnPropertyDescriptors(system),originalJournal=Object.getOwnPropertyDescriptors(journal);
  const methods=forwarding({system,journal});assert.deepEqual(Object.keys(methods),names);assert(Object.isFrozen(methods));
  assert.deepEqual(Object.getOwnPropertyDescriptors(system),originalSystem);assert.deepEqual(Object.getOwnPropertyDescriptors(journal),originalJournal);
  assert.throws(()=>methods.extra=()=>{},TypeError);
  for(const value of ['implementationVerified','namespaceVerified','sealed','reuseEligible'])assert.equal(contract[value],false);
  assert.equal(contract.queryCompleteness,'NOT_ESTABLISHED');assert(Object.isFrozen(contract));
});

for(const name of names)test(`${name} uses the exact original system receiver, all argument slots and returned identity`,()=>{
  const result={opaque:true},received=[],system=systemFixture();
  system[name]=function(...args){received.push({receiver:this,args});return result;};
  const options={compilerOption:'NONSECRET'},args=[root+'/a.ts',undefined,['.ts'],null,options];
  const journal={semantic(operation,file,fn){assert.equal(this,journal);assert.equal(operation,name);assert.equal(file,args[0]);return fn();}};
  const methods=forwarding({system,journal});
  assert.equal(Reflect.apply(methods[name],{arbitraryCompilerHost:true},args),result);
  assert.equal(received[0].receiver,system);assert.equal(received[0].args.length,args.length);
  for(let at=0;at<args.length;at++)assert.equal(received[0].args[at],args[at]);
});

test('actual readDirectory undefined versus null slots and arrays/options remain distinct, unmodified and unsorted',()=>{
  const system=systemFixture(),calls=[],answer=[root+'/z.ts',root+'/a.ts'];
  system.readDirectory=function(...args){calls.push(args);return answer;};
  const methods=forwarding({system,journal:{semantic(name,file,fn){return fn();}}});
  const extensions=['.ts'],includes=['**/*.ts'];
  assert.equal(methods.readDirectory(root,extensions,undefined,includes,undefined),answer);
  assert.equal(methods.readDirectory(root,extensions,null,includes,5),answer);
  assert.equal(calls[0].length,5);assert.equal(calls[0][1],extensions);assert.equal(calls[0][2],undefined);assert.equal(calls[1][2],null);assert.equal(calls[0][3],includes);
  assert.deepEqual(answer,[root+'/z.ts',root+'/a.ts']);
});

test('captured lexical function identity is not replaced by host receiver or later property assignment',()=>{
  const system=systemFixture(),old=system.readFile,methods=forwarding({system,journal:{semantic(name,file,fn){return fn();}}});
  system.readFile=function(){throw Error('unexpected replacement');};
  assert.equal(methods.readFile.call({readFile:system.readFile},root+'/a.ts'),'decoded');assert.notEqual(system.readFile,old);
  // Identity/currency validation is an independent parent prerequisite, not a
  // continuing authorization granted by this captured data adapter.
  assert.equal(contract.implementationVerified,false);
});

for(const code of ['EPERM','EACCES','ENOENT','ENOTDIR'])test(`${code} is not converted to an absent semantic answer`,()=>{
  const original=Object.assign(Error('NONSECRET_PRIVATE_MESSAGE'),{code});const system=systemFixture();
  for(const name of names)system[name]=function(){throw original;};
  const methods=forwarding({system,journal:{semantic(name,file,fn){return fn();}}});
  for(const name of names)assert.throws(()=>methods[name](root+'/a.ts'),caught=>caught===original);
});

test('journal records raw DENIED separately from the real fake ts.sys false/undefined/decoded/array returns',()=>{
  const denied=Object.assign(Error('NONSECRET_PRIVATE_MESSAGE'),{code:'EPERM'}),fs=fsFixture(),system=systemFixture();
  fs.statSync=function(){throw denied;};fs.readFileSync=function(file){if(file.endsWith('missing'))throw denied;return Buffer.from([0xff,0xfe,0x41,0]);};
  system.fileExists=function(file){try{fs.statSync(file);return true;}catch(error){assert.equal(error,denied);return false;}};
  system.readFile=function(file){try{fs.readFileSync(file);return 'A';}catch(error){assert.equal(error,denied);return undefined;}};
  let methods;const result=capture({fileSystem:fs,root,callback(journal){methods=forwarding({system,journal});
    assert.equal(methods.fileExists(root+'/a.ts'),false);assert.equal(methods.readFile(root+'/missing'),undefined);
    assert.equal(methods.readFile(root+'/decoded'),'A');assert.deepEqual(methods.getDirectories(root),['nested']);
  }});
  assert.equal(result.loggingComplete,true);
  assert.deepEqual(result.frames.filter(row=>row.category==='fs'&&row.outcome.status==='DENIED').map(row=>row.outcome.errno),['EPERM','EPERM']);
  const semantic=result.frames.filter(row=>row.category==='semantic');
  assert.deepEqual(semantic[0].outcome.value,{type:'boolean',value:false});assert.deepEqual(semantic[1].outcome.value,{type:'undefined'});
  assert.equal(semantic[2].outcome.value.sha256,hash('A'));assert.equal(semantic[3].outcome.value.sha256,hash(['nested']));
  assert.equal(result.namespaceVerified,false);assert.equal(result.reuseEligible,false);assert.equal(result.queryCompleteness,'NOT_ESTABLISHED');
  assert.equal(JSON.stringify(result).includes('NONSECRET_PRIVATE_MESSAGE'),false);
});

test('shared compilerProgramFiles fake graph receives the same adapter, never a second traversal',()=>{
  let parse=0,host=0,program=0,methods;
  const system=systemFixture(),reads=[];system.readFile=function(file){reads.push(file);return 'decoded';};
  const ts={sys:system,
    getParsedCommandLineOfConfigFile(config,options,configHost){parse++;assert.equal(config,root+'/tsconfig.json');
      assert.equal(configHost.readFile,methods.readFile);assert.equal(configHost.readDirectory,methods.readDirectory);
      assert.equal(configHost.readFile(config),'decoded');return {options:{},fileNames:[root+'/a.ts'],errors:[]};},
    createCompilerHost(){host++;return {};},
    createSourceFile(file,text,language){assert.equal(text,'decoded');return {fileName:file,language};},
    createProgram(args){program++;assert.equal(args.host.fileExists,methods.fileExists);assert.equal(args.host.realpath,methods.realpath);
      assert.equal(args.host.getSourceFile(root+'/a.ts',1).fileName,root+'/a.ts');return {getSourceFiles(){return [{fileName:root+'/a.ts'}];}};},
  };
  const journal={semantic(name,file,fn){return fn();}};methods=forwarding({system,journal});
  assert.deepEqual(compilerProgramFiles(ts,root,methods),[root+'/a.ts']);assert.deepEqual([parse,host,program],[1,1,1]);
  assert.deepEqual(reads,[root+'/tsconfig.json',root+'/a.ts']);
});

test('options/function descriptor checks never invoke getters and refuse async/inherited/missing methods',()=>{
  let accessed=0;
  const system=systemFixture(),journal={semantic(name,file,fn){return fn();}};
  throwsCode(()=>forwarding({system,journal,extra:true}),'SEALED_FORWARDING_OPTIONS');
  const accessor={system};Object.defineProperty(accessor,'journal',{get(){accessed++;return journal;}});
  throwsCode(()=>forwarding(accessor),'SEALED_FORWARDING_DESCRIPTOR');
  const getterSystem=systemFixture();Object.defineProperty(getterSystem,'readFile',{get(){accessed++;return()=>{};}});
  throwsCode(()=>forwarding({system:getterSystem,journal}),'SEALED_FORWARDING_DESCRIPTOR');
  throwsCode(()=>forwarding({system:Object.create(system),journal}),'SEALED_FORWARDING_DESCRIPTOR');
  const asyncSystem=systemFixture();asyncSystem.realpath=async function(){};
  throwsCode(()=>forwarding({system:asyncSystem,journal}),'SEALED_FORWARDING_METHOD');
  throwsCode(()=>forwarding({system,journal:{semantic:async function(){}}}),'SEALED_FORWARDING_METHOD');
  assert.equal(accessed,0);
});
