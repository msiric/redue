// Pure payload controls only. No child, filesystem policy, TS API or model.
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSealedTypeScriptObservationResult as validate,SEALED_OBSERVATION_RESULT_LIMITS as limits} from './acceptance/sealed-typescript-observation-result.mjs';
import {captureSealedTypeScriptDiscovery as capture} from './acceptance/sealed-typescript-discovery-journal.mjs';
const h='a'.repeat(64),clone=value=>JSON.parse(JSON.stringify(value));
function row(){return {sequence:1,phase:'config',category:'fs',operation:'statSync',path:{scope:'in-tree',relative:'a.ts'},argumentsSha256:h,outcome:{status:'RETURNED',value:{type:'stat',metadataSha256:h}}};}
function fixture(){return {schema:1,scope:'FIXED_STAGED_API_OBSERVATIONS_ONLY',observation:{schema:1,interpretation:'redue-sealed-typescript-program-probe@1',compiler:{version:'5.5.2',sha256:'953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816',entry:'node_modules/typescript/lib/typescript.js'},files:['a.ts'],configs:['tsconfig.json'],observationStatus:'FORWARDED_CALLS_LOGGED',journal:{schema:1,interpretation:'redue-sealed-typescript-discovery-journal@1',loggingComplete:true,frames:[row()],reasonCodes:[],callsObserved:1,observationCompleteness:'FORWARDED_CALLS_ONLY',moduleLoaderCoverage:'NOT_ESTABLISHED',queryCompleteness:'NOT_ESTABLISHED',namespaceVerified:false,sealed:false,reuseEligible:false},graphCompleteness:'NOT_ESTABLISHED',apiCLICompleteness:'NOT_ESTABLISHED',nativeViewVerified:false,namespaceVerified:false,sealed:false,reuseEligible:false},compilerVerificationExecuted:false,nativeAgentEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false};}
const rejected=(value,code='SEALED_OBSERVATION_SCHEMA')=>assert.throws(()=>validate(value),error=>error?.code===code&&error.message===code);
const incomplete=(value,reasons=['UNSUPPORTED_VALUE'])=>{const observed=value.observation;observed.observationStatus='INCOMPLETE';observed.journal.loggingComplete=false;observed.journal.reasonCodes=reasons;return value;};

test('fixed success result is projected and deeply frozen without promoting any authority',()=>{
  const value=fixture(),result=validate(value);assert.deepEqual(result,value);assert.notEqual(result,value);assert.notEqual(result.observation.journal,value.observation.journal);
  assert(Object.isFrozen(result));assert(Object.isFrozen(result.observation.journal.frames[0].outcome.value));
  value.observation.files[0]='different.ts';assert.deepEqual(result.observation.files,['a.ts']);
  assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);assert.equal(result.observation.nativeViewVerified,false);
});

test('real fake-journal output including denied/decoded returns fits the fixed format',()=>{
  const fs={statSync(){throw Object.assign(Error('NONSECRET PRIVATE'),{code:'EPERM'});},readFileSync(){return Buffer.from('raw');},readdirSync(){return ['entry'];},realpathSync(file){return file;}};
  const value=fixture();value.observation.journal=capture({fileSystem:fs,root:'/owned/stage',callback(journal){
    journal.semantic('fileExists','/owned/stage/a.ts',()=>{try{fs.statSync('/owned/stage/a.ts');}catch{return false;}});
    journal.semantic('readFile','/owned/stage/a.ts',()=>{fs.readFileSync('/owned/stage/a.ts');return 'decoded';});
    fs.readdirSync('/owned/stage');
  }});
  assert.equal(validate(value).observation.journal.callsObserved,5);
});

for(const [name,select] of [['top',value=>value],['observation',value=>value.observation],['compiler',value=>value.observation.compiler],['journal',value=>value.observation.journal],['frame',value=>value.observation.journal.frames[0]],['path',value=>value.observation.journal.frames[0].path],['outcome',value=>value.observation.journal.frames[0].outcome],['value',value=>value.observation.journal.frames[0].outcome.value]])test(`${name} extra private payload is rejected rather than retained`,()=>{
  const value=fixture();select(value).privateValue='NONSECRET_PRIVATE_BODY';rejected(value);
});

test('missing journal, missing mandatory marker and failure-shaped response are not valid observations',()=>{
  const noJournal=fixture();delete noJournal.observation.journal;rejected(noJournal);
  const missing=fixture();delete missing.nativeAgentEnforcement;rejected(missing);
  rejected({schema:1,scope:'FIXED_STAGED_API_OBSERVATIONS_ONLY',outcome:'UNKNOWN',reason:'STAGED_API_OBSERVATION_UNAVAILABLE',compilerVerificationExecuted:false,sealed:false,reuseEligible:false});
});

test('getters, functions, prototype inheritance and symbol fields are rejected without reading getters',()=>{
  let accessed=0;
  const value=fixture();Object.defineProperty(value.observation,'journal',{enumerable:true,get(){accessed++;throw Error('must not access');}});rejected(value);assert.equal(accessed,0);
  const getter=fixture();Object.defineProperty(getter.observation.journal.frames[0].outcome.value,'metadataSha256',{enumerable:true,get(){accessed++;return h;}});rejected(getter);assert.equal(accessed,0);
  const symbol=fixture();symbol[Symbol('PRIVATE')]=1;rejected(symbol);
  const fn=fixture();fn.observation.files[0]=()=>{};rejected(fn);
  const inherited=fixture();inherited.observation=Object.create(inherited.observation);rejected(inherited);
});

test('array holes, index getters, custom properties and custom iterators are rejected',()=>{
  const hole=fixture();delete hole.observation.files[0];rejected(hole);
  let accessed=0;const getter=fixture();Object.defineProperty(getter.observation.files,'0',{enumerable:true,get(){accessed++;return 'a.ts';}});rejected(getter);assert.equal(accessed,0);
  const extra=fixture();extra.observation.files.privateValue='body';rejected(extra);
  const symbol=fixture();symbol.observation.files[Symbol.iterator]=function*(){throw Error('must not call');};rejected(symbol);
});

for(const [select,key,value] of [[v=>v,'sealed',true],[v=>v,'compilerVerificationExecuted',true],[v=>v,'nativeAgentEnforcement','PASS'],[v=>v.observation,'nativeViewVerified',true],[v=>v.observation,'reuseEligible',true],[v=>v.observation,'graphCompleteness','COMPLETE'],[v=>v.observation.journal,'namespaceVerified',true],[v=>v.observation.journal,'moduleLoaderCoverage','COMPLETE']])test(`unestablished authority ${key} cannot be promoted`,()=>{
  const input=fixture();select(input)[key]=value;rejected(input);
});

test('compiler version/package/API identity is exact, not merely plausible hashes or paths',()=>{
  for(const [key,value] of [['version','5.6.3'],['sha256','b'.repeat(64)],['entry','../typescript.js']]){const input=fixture();input.observation.compiler[key]=value;rejected(input);}
});

test('observation status, logging flag and reason emptiness agree in both directions',()=>{
  const status=fixture();status.observation.observationStatus='INCOMPLETE';rejected(status);
  const flag=fixture();flag.observation.journal.loggingComplete=false;rejected(flag);
  const reasons=fixture();reasons.observation.journal.reasonCodes=['UNSUPPORTED_VALUE'];rejected(reasons);
  const valid=incomplete(fixture());assert.equal(validate(valid).observation.observationStatus,'INCOMPLETE');
});

test('reason enums are finite, sorted and unique',()=>{
  for(const list of [['PRIVATE_REASON'],['UNSUPPORTED_VALUE','UNSUPPORTED_VALUE'],['VALUE_LIMIT','ASYNC_CALLBACK']])rejected(incomplete(fixture(),list));
  assert.equal(validate(incomplete(fixture(),['ASYNC_CALLBACK','VALUE_LIMIT'])).observation.journal.loggingComplete,false);
});

test('complete frames account for all observed calls, start at one and have no holes',()=>{
  const count=fixture();count.observation.journal.callsObserved=2;rejected(count);
  const hole=fixture();hole.observation.journal.callsObserved=2;hole.observation.journal.frames[0].sequence=2;rejected(hole);
  const two=fixture();two.observation.journal.frames.push({...row(),sequence:2});two.observation.journal.callsObserved=2;assert.equal(validate(two).observation.journal.frames.length,2);
  const empty=fixture();empty.observation.journal.frames=[];empty.observation.journal.callsObserved=0;assert.equal(validate(empty).observation.journal.frames.length,0);
});

test('explicitly incomplete frames can omit calls but not duplicate, reverse or exceed observed sequences',()=>{
  const value=incomplete(fixture());value.observation.journal.callsObserved=3;value.observation.journal.frames.push({...row(),sequence:3});assert.equal(validate(value).observation.journal.frames.length,2);
  for(const sequence of [1,0,4]){const input=clone(value);input.observation.journal.frames[1].sequence=sequence;rejected(input);}
  const reverse=clone(value);reverse.observation.journal.frames.reverse();rejected(reverse);
});

test('frame limit overflow must be explicitly declared and retained sequences remain within the cap',()=>{
  const overflow=fixture();overflow.observation.journal.callsObserved=limits.frames+1;rejected(overflow);
  const declared=incomplete(overflow,['FRAME_LIMIT']);assert.equal(validate(declared).observation.journal.callsObserved,limits.frames+1);
  const contradictory=incomplete(fixture(),['FRAME_LIMIT']);rejected(contradictory);
  declared.observation.journal.frames[0].sequence=limits.frames+1;rejected(declared);
});

test('finite phase and method/category shapes reject unknown methods and semantic fs-only fields',()=>{
  for(const phase of ['private-phase','receipt',true]){const value=fixture();value.observation.journal.frames[0].phase=phase;rejected(value);}
  for(const operation of ['unknownSync','openSync','/private/executable']){const value=incomplete(fixture(),['UNSUPPORTED_METHOD']);value.observation.journal.frames[0].operation=operation;rejected(value);}
  const semantic=fixture();Object.assign(semantic.observation.journal.frames[0],{category:'semantic',operation:'fileExists',outcome:{status:'RETURNED',value:{type:'boolean',value:false}}});delete semantic.observation.journal.frames[0].argumentsSha256;validate(semantic);
  semantic.observation.journal.frames[0].argumentsSha256=h;rejected(semantic);
});

test('in-tree/root/outside/unsupported path classes have exact fields and explicit limitations',()=>{
  const dot=fixture();dot.observation.journal.frames[0].path={scope:'in-tree',relative:'.'};validate(dot);
  const outside=fixture();outside.observation.journal.frames[0].path={scope:'outside',sha256:h};validate(outside);
  outside.observation.journal.frames[0].path.absolute='/private/secret';rejected(outside);
  const unsupported=incomplete(fixture(),['UNSUPPORTED_PATH']);unsupported.observation.journal.frames[0].path={scope:'unsupported'};validate(unsupported);
  unsupported.observation.journal.reasonCodes=['UNSUPPORTED_VALUE'];rejected(unsupported);
});

test('relative paths reject traversal, absolute paths, malformed UTF8, control text and noncanonical spelling',()=>{
  for(const file of ['','.', '../a.ts','a/../b.ts','a/./b.ts','/private/a.ts','a//b.ts','a.ts/','a\\b.ts','a:ts','a\u0000.ts','a\ud800.ts','x'.repeat(4097)]){const value=fixture();value.observation.files[0]=file;rejected(value);}
  const valid=fixture();valid.observation.files=['nested/a.ts','nested/é.ts'];assert.deepEqual(validate(valid).observation.files,valid.observation.files);
});

test('hash and integer types are canonical/bounded, with no NaN/fraction/negative/unsafe values',()=>{
  for(const hash of ['b'.repeat(63),'A'.repeat(64),'NOT_PRIVATE_DATA']){const value=fixture();value.observation.journal.frames[0].argumentsSha256=hash;rejected(value);}
  for(const count of [-1,-0,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){const value=fixture();value.observation.journal.callsObserved=count;rejected(value);}
});

test('fixed error classes never accept private error messages or mismatched errno',()=>{
  for(const [status,errno] of [['DENIED','EPERM'],['DENIED','EACCES'],['MISSING','ENOENT'],['MISSING','ENOTDIR']]){const value=fixture();value.observation.journal.frames[0].outcome={status,errno};validate(value);}
  for(const outcome of [{status:'DENIED',errno:'ENOENT'},{status:'MISSING',errno:'EACCES'},{status:'OTHER_ERROR',errno:'EIO'}]){const value=fixture();value.observation.journal.frames[0].outcome=outcome;rejected(value);}
  const other=incomplete(fixture(),['OTHER_ERROR']);other.observation.journal.frames[0].outcome={status:'OTHER_ERROR',errno:'OTHER'};validate(other);
  other.observation.journal.frames[0].outcome.message='NONSECRET_PRIVATE_ERROR';rejected(other);
});

test('only fixed typed summaries survive, without raw string/byte bodies',()=>{
  for(const summary of [{type:'undefined'},{type:'null'},{type:'boolean',value:false},{type:'string',sha256:h},{type:'bytes',byteLength:4,sha256:h},{type:'array',length:2,sha256:h,projection:'actual-string-values'},{type:'stat',metadataSha256:h}]){
    const value=fixture();value.observation.journal.frames[0].outcome.value=summary;validate(value);
  }
  for(const summary of [{type:'string',value:'NONSECRET_BODY'},{type:'bytes',byteLength:limits.valueBytes+1,sha256:h},{type:'array',length:limits.arrayEntries+1,sha256:h,projection:'actual-string-values'},{type:'unknown',sha256:h}]){const value=fixture();value.observation.journal.frames[0].outcome.value=summary;rejected(value);}
  const dir=fixture();dir.observation.journal.frames[0].operation='readdirSync';dir.observation.journal.frames[0].outcome.value={type:'array',length:1,sha256:h,projection:'entry-names-only'};validate(dir);
  dir.observation.journal.frames[0].outcome.value.projection='actual-string-values';rejected(dir);
});

test('file/config/frames count and cumulative byte limits fail closed without removing obligations',()=>{
  const noFiles=fixture();noFiles.observation.files=[];rejected(noFiles);
  const manyConfigs=fixture();manyConfigs.observation.configs=Array.from({length:65},(_,at)=>'c'+at+'.json');rejected(manyConfigs);
  const duplicate=fixture();duplicate.observation.configs=['tsconfig.json','tsconfig.json'];rejected(duplicate);
  const frames=fixture();frames.observation.journal.frames=new Array(limits.frames+1);rejected(frames);
  const bytes=fixture();bytes.observation.files=Array.from({length:2200},()=> 'x'.repeat(4096));rejected(bytes,'SEALED_OBSERVATION_SIZE');
});
