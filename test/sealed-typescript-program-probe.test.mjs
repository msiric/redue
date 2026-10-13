// Exact author helper source is evaluated with fake imports only. There is no
// public injection option in the helper, no TS/API load or native/CI/model run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compilerProgramFiles} from '../src/typescript-list.mjs';
import {captureSealedTypeScriptDiscovery} from './acceptance/sealed-typescript-discovery-journal.mjs';
import {createSealedTypeScriptForwarding} from './acceptance/sealed-typescript-forwarding.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-program-probe.mjs',import.meta.url),'utf8');
const expectedImports=[
  "import fs from 'node:fs';","import path from 'node:path';","import {createRequire} from 'node:module';",
  "import {directProject} from '../../src/direct-typescript.mjs';","import {compilerProgramFiles} from '../../src/typescript-list.mjs';",
  "import {captureSealedTypeScriptDiscovery} from './sealed-typescript-discovery-journal.mjs';",
  "import {createSealedTypeScriptForwarding} from './sealed-typescript-forwarding.mjs';",
];
assert.deepEqual(source.match(/^import .*;$/gm),expectedImports);
const injectedSource=source.replace(/^import .*;\n/gm,'').replace('export function probeSealedTypeScriptProgram','function probeSealedTypeScriptProgram');
assert.equal((injectedSource.match(/function probeSealedTypeScriptProgram\(/g)||[]).length,1);
const construct=Function('fs','path','createRequire','directProject','compilerProgramFiles','captureSealedTypeScriptDiscovery','createSealedTypeScriptForwarding','process','Buffer',injectedSource+'\nreturn probeSealedTypeScriptProgram;');
const root='/owned/stage',tsRoot=root+'/node_modules/typescript',entry=tsRoot+'/lib/typescript.js';
const digest='953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816';
const throwsCode=(fn,code)=>assert.throws(fn,error=>error?.code===code);
function fixture(capture=captureSealedTypeScriptDiscovery){
  const calls={admission:0,load:0,parse:0,host:0,program:0,body:[]},options={},returned=[root+'/a.ts',tsRoot+'/lib/lib.d.ts'];
  const fileSystem={statSync(){return false;},lstatSync(){return {isDirectory(){return true;}};},realpathSync(file){return file;},
    readFileSync(file){calls.body.push(file);return Buffer.from('NONSECRET decoded');},readdirSync(){return [];}};
  Object.defineProperty(fileSystem.realpathSync,'native',{value:function(file){return file;},configurable:true});
  const system={
    readFile(file){return fileSystem.readFileSync(file).toString('utf8');},fileExists(){return false;},directoryExists(){return true;},
    getDirectories(){return [];},readDirectory(){return [root+'/a.ts'];},realpath(file){return fileSystem.realpathSync(file);},
  };
  const parsed={options,fileNames:[root+'/a.ts'],errors:[]};
  const ts={version:'5.5.2',sys:system,
    getParsedCommandLineOfConfigFile(file,overrides,host){calls.parse++;assert.equal(file,root+'/tsconfig.json');host.readFile(file);return parsed;},
    createCompilerHost(value){calls.host++;assert.equal(value,options);return {};},
    createSourceFile(file,text){assert.equal(text,'NONSECRET decoded');return {fileName:file};},
    createProgram({rootNames,options:value,host}){calls.program++;assert.equal(value,options);assert.equal(rootNames,parsed.fileNames);
      host.getSourceFile(root+'/a.ts',1);host.getSourceFile(tsRoot+'/lib/lib.d.ts',1);return {getSourceFiles(){return returned.map(fileName=>({fileName}));}};},
  };
  const admitted={tsRoot,version:'5.5.2',entry:tsRoot+'/lib/tsc.js',digest};
  const require=file=>{calls.load++;assert.equal(file,entry);assert.notEqual(fileSystem.readFileSync,originalRead,'journal installed before first fake require');return ts;};
  require.resolve=file=>file;require.cache={};const originalRead=fileSystem.readFileSync;
  const process={cwd(){return root;}};
  const directProject=(actual,script,settings)=>{calls.admission++;calls.script=script;assert.equal(calls.load,0);assert.equal(actual,root);assert(['typecheck','test:types'].includes(script));assert.deepEqual(settings,{verify:true});return admitted;};
  const probe=construct(fileSystem,path,()=>require,directProject,compilerProgramFiles,capture,createSealedTypeScriptForwarding,process,Buffer);
  return {probe,calls,options,parsed,returned,fileSystem,ts,require,admitted,process,originalRead};
}

test('fixed admission/firstload and same shared fake graph preserve actual builtin libs/config reads',()=>{
  const item=fixture();Object.freeze(item.options);const result=item.probe({root,script:'typecheck'});
  assert.deepEqual([item.calls.admission,item.calls.load,item.calls.parse,item.calls.host,item.calls.program],[1,1,1,1,1]);
  assert.deepEqual(result.files,['a.ts','node_modules/typescript/lib/lib.d.ts']);assert.deepEqual(result.configs,['tsconfig.json']);
  assert.deepEqual(result.journal.frames.filter(row=>row.category==='semantic'&&row.operation==='readFile').map(row=>[row.phase,row.path.relative]),
    [['config','tsconfig.json'],['program','a.ts'],['program','node_modules/typescript/lib/lib.d.ts']]);
  assert.equal(item.fileSystem.readFileSync,item.originalRead);
  assert.equal(result.journal.loggingComplete,true);assert.equal(result.observationStatus,'FORWARDED_CALLS_LOGGED');
  for(const key of ['nativeViewVerified','namespaceVerified','sealed','reuseEligible'])assert.equal(result[key],false);
  assert.equal(result.graphCompleteness,'NOT_ESTABLISHED');assert.equal(result.apiCLICompleteness,'NOT_ESTABLISHED');
  assert.equal(JSON.stringify(result).includes('NONSECRET decoded'),false);assert(Object.isFrozen(result.files));assert(Object.isFrozen(result.journal));
});

test('summary retains original returned graph ordering and duplicates',()=>{
  const item=fixture();item.returned.splice(0,2,root+'/z.ts',root+'/a.ts',root+'/z.ts');
  assert.deepEqual(item.probe({root,script:'typecheck'}).files,['z.ts','a.ts','z.ts']);
});

test('approved test:types script is a scalar metadata name, with no npm/shell invocation',()=>{
  const item=fixture(),result=item.probe({root,script:'test:types'});
  assert.equal(item.calls.script,'test:types');assert.deepEqual([item.calls.admission,item.calls.load,item.calls.program],[1,1,1]);
  assert.equal(result.reuseEligible,false);assert.equal(result.nativeViewVerified,false);
});

test('unsafe, empty, oversized and non-scalar script identifiers fail before admission or first load',()=>{
  for(const script of ['', 'x'.repeat(129), '../test:types', 'test/types', 'test types', 'test;types', '$(types)', '`types`', 'test\\types', 'test\n:types', 'test\u0000:types', true, {}, null]){
    const item=fixture();throwsCode(()=>item.probe({root,script}),'SEALED_PROBE_OPTIONS');assert.deepEqual([item.calls.admission,item.calls.load],[0,0]);
  }
});

for(const property of ['plugins','incremental','composite'])test(`${property} is refused before host/program without changing parsed configuration`,()=>{
  const item=fixture();item.options[property]=property==='plugins'?[{name:'unreviewed'}]:true;const before=JSON.stringify(item.parsed);
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_CONFIG_UNSUPPORTED');
  assert.deepEqual([item.calls.parse,item.calls.host,item.calls.program],[1,0,0]);assert.equal(JSON.stringify(item.parsed),before);
  assert.equal(item.fileSystem.readFileSync,item.originalRead);
});

test('project references are refused before another graph or host is created',()=>{
  const item=fixture();item.parsed.projectReferences=[{path:root+'/nested'}];
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_CONFIG_UNSUPPORTED');assert.deepEqual([item.calls.parse,item.calls.host,item.calls.program],[1,0,0]);
});

for(const [key,value] of [['baseUrl','/outside'],['rootDir','../outside'],['rootDirs',['/outside']],['typeRoots',['../outside']],['outDir','../outside'],['paths',{x:['../../outside/*']}]])test(`explicit outside ${key} is refused before program`,()=>{
  const item=fixture();item.options[key]=value;
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_OPTION_OUTSIDE');assert.equal(item.calls.host,0);assert.equal(item.calls.program,0);
});

test('inside known option paths remain unmodified while unsupported malformed structures are refused',()=>{
  const item=fixture();Object.assign(item.options,{baseUrl:root+'/src',rootDir:root,typeRoots:[root+'/node_modules/@types'],paths:{x:['nested/*']},plugins:[],incremental:false});
  const before=JSON.stringify(item.options);item.probe({root,script:'typecheck'});assert.equal(JSON.stringify(item.options),before);
  const malformed=fixture();malformed.options.typeRoots='node_modules';throwsCode(()=>malformed.probe({root,script:'typecheck'}),'SEALED_PROBE_CONFIG_UNSUPPORTED');
});

test('outside config read aborts before any outside body or program execution',()=>{
  const item=fixture();item.ts.getParsedCommandLineOfConfigFile=function(file,overrides,host){item.calls.parse++;host.readFile('/outside/private.json');return item.parsed;};
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_CONFIG_OUTSIDE');assert.deepEqual(item.calls.body,[]);assert.equal(item.calls.program,0);
});

test('outside program body request aborts without fabricating a denied or missing return',()=>{
  const item=fixture();item.ts.createProgram=function({host}){item.calls.program++;host.readFile('/outside/private.ts');return {};};
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_SOURCE_OUTSIDE');assert.deepEqual(item.calls.body,[root+'/tsconfig.json']);
});

test('outside returned graph file or physical alias is refused without rereading its body',()=>{
  const outside=fixture();outside.returned.push('/outside/private.ts');throwsCode(()=>outside.probe({root,script:'typecheck'}),'SEALED_PROBE_SOURCE_OUTSIDE');
  assert.equal(outside.calls.body.includes('/outside/private.ts'),false);
  const alias=fixture();alias.fileSystem.realpathSync=function(file){return file===root+'/a.ts'?root+'/alias.ts':file;};
  Object.defineProperty(alias.fileSystem.realpathSync,'native',{value:function(file){return file;},configurable:true});
  throwsCode(()=>alias.probe({root,script:'typecheck'}),'SEALED_PROBE_FILE_ALIAS');
});

test('selectedcwd/fresh API cache and exact reviewed compiler reject before any API load',()=>{
  const cwd=fixture();cwd.process.cwd=()=>'/outside';throwsCode(()=>cwd.probe({root,script:'typecheck'}),'SEALED_PROBE_CWD');assert.equal(cwd.calls.load,0);
  const cache=fixture();cache.require.cache[entry]={};throwsCode(()=>cache.probe({root,script:'typecheck'}),'SEALED_PROBE_CACHED_API');assert.equal(cache.calls.load,0);
  for(const [key,value] of [['version','5.6.3'],['digest','0'.repeat(64)],['tsRoot','/outside/typescript'],['entry',tsRoot+'/lib/other.js']]){
    const compiler=fixture();compiler.admitted[key]=value;throwsCode(()=>compiler.probe({root,script:'typecheck'}),'SEALED_PROBE_COMPILER');assert.equal(compiler.calls.load,0);
  }
});

test('fixed API entry and missing TS API/version fail closed',()=>{
  const resolution=fixture();resolution.require.resolve=()=>'/outside/typescript.js';throwsCode(()=>resolution.probe({root,script:'typecheck'}),'SEALED_PROBE_COMPILER');assert.equal(resolution.calls.load,0);
  const missing=fixture();delete missing.ts.createProgram;throwsCode(()=>missing.probe({root,script:'typecheck'}),'SEALED_PROBE_API');assert.equal(missing.calls.program,0);
  const version=fixture();version.ts.version='5.6.3';throwsCode(()=>version.probe({root,script:'typecheck'}),'SEALED_PROBE_API');
});

test('actual fake sys errors retain identity and wrapper restoration after graph refusal',()=>{
  const item=fixture(),denied=Object.assign(Error('NONSECRET denied'),{code:'EPERM'});item.ts.sys.readFile=function(){throw denied;};
  assert.throws(()=>item.probe({root,script:'typecheck'}),caught=>caught===denied);assert.equal(item.fileSystem.readFileSync,item.originalRead);
});

test('unknown fs observation prevents complete logging and never produces namespace/native authority',()=>{
  const item=fixture();item.fileSystem.unknownSync=function(){return false;};const old=item.ts.getParsedCommandLineOfConfigFile;
  item.ts.getParsedCommandLineOfConfigFile=function(...args){item.fileSystem.unknownSync(root+'/x');return Reflect.apply(old,item.ts,args);};
  const result=item.probe({root,script:'typecheck'});assert.equal(result.observationStatus,'INCOMPLETE');assert(result.journal.reasonCodes.includes('UNSUPPORTED_METHOD'));
  assert.equal(result.reuseEligible,false);assert.equal(result.nativeViewVerified,false);
});

test('empty or oversized graph and too many config reads are explicit refusal',()=>{
  const empty=fixture();empty.returned.length=0;throwsCode(()=>empty.probe({root,script:'typecheck'}),'SEALED_PROBE_FILES');
  const large=fixture();large.returned.splice(0,2,...Array.from({length:100001},()=>root+'/a.ts'));throwsCode(()=>large.probe({root,script:'typecheck'}),'SEALED_PROBE_FILES');
  const configs=fixture();configs.ts.getParsedCommandLineOfConfigFile=function(file,overrides,host){for(let at=0;at<65;at++)host.readFile(root+'/config-'+at+'.json');return configs.parsed;};
  throwsCode(()=>configs.probe({root,script:'typecheck'}),'SEALED_PROBE_CONFIG_LIMIT');assert.equal(configs.calls.host,0);
});

test('summary byte bound refuses large relative-path lists before retaining the complete oversized list',()=>{
  const item=fixture(),large=root+'/'+'a'.repeat(4096-root.length-1);item.returned.splice(0,2,...Array.from({length:2200},()=>large));
  let aliases=0;item.fileSystem.realpathSync=function(file){if(file===large)aliases++;return file;};
  Object.defineProperty(item.fileSystem.realpathSync,'native',{value:function(file){return file;},configurable:true});
  throwsCode(()=>item.probe({root,script:'typecheck'}),'SEALED_PROBE_SUMMARY_LIMIT');assert(aliases>0&&aliases<2200);
});

test('no caller loader/command/verification bypass is accepted and source documents unresolved native/CLI boundaries',()=>{
  const item=fixture();throwsCode(()=>item.probe({root,script:'typecheck',loader(){}}),'SEALED_PROBE_OPTIONS');
  throwsCode(()=>item.probe({root,script:'typecheck',verify:false}),'SEALED_PROBE_OPTIONS');assert.equal(item.calls.load,0);
  assert.match(source,/internalModuleStat\/internalModuleReadJSON/);assert.match(source,/CLI deferred checking/);assert.match(source,/no body reread/i);
  assert.doesNotMatch(source,/spawnSync|execFile|child_process|setTimeout|process\.env\s*=/);
});

// The earlier full8MiB journal competes with the same whole-response budget.
// This countercase uses only fake forwarding, not a real graph or timing claim.
test('bounded partial journal leaves room for graph metadata without dropping forwarded calls',()=>{
  const item=fixture(),file=root+'/'+'a'.repeat(3800);let calls=0;
  item.ts.sys.fileExists=function(){calls++;return false;};
  item.returned.splice(0,2,...Array.from({length:1800},(_,i)=>root+'/'+String(i).padStart(4,'0')+'x'.repeat(396)+'.ts'));
  item.ts.createProgram=function({host}){for(let at=0;at<2500;at++)assert.equal(host.fileExists(file),false);return {getSourceFiles(){return item.returned.map(fileName=>({fileName}));}};};
  const result=item.probe({root,script:'test:types'});assert.equal(calls,2500);assert.equal(result.files.length,1800);
  assert(result.journal.callsObserved>=2500);assert(result.journal.frames.length<2500);
  assert(result.journal.reasonCodes.includes('JOURNAL_LIMIT'));assert.equal(result.journal.loggingComplete,false);
  assert.equal(result.observationStatus,'INCOMPLETE');assert(Buffer.byteLength(JSON.stringify(result))<=8*1024*1024);
  for(const key of ['nativeViewVerified','namespaceVerified','sealed','reuseEligible'])assert.equal(result[key],false);
});
