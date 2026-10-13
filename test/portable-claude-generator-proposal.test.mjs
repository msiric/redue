// Construction controls only by default. An explicitly selected PUBLIC native
// file enables owned source read tests; source evaluation is a separate reviewed
// no-secret Node child and never invokes Claude or sandbox-exec.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {prepareClaude187GeneratorProposal as prepare,CLAUDE187_GENERATOR_NATIVE_SHA256 as pin} from './acceptance/portable-claude-generator-proposal.mjs';
const moduleSource=fs.readFileSync(new URL('./acceptance/portable-claude-generator-proposal.mjs',import.meta.url),'utf8');
const publicNative=process.env.REDUE_REVIEWED_CLAUDE187;
const selected={skip:publicNative?false:'No locally selected reviewed public native file; no source read/evaluation'};
const failCode=(fn,code)=>assert.throws(fn,error=>error.code===code&&error.message===code);
const adapt=fake=>Function('fs','path','createHash',moduleSource.replace(/^import .*;$/m,'').replace('export const ','const ').replace('export function ','function ')+'\nreturn prepareClaude187GeneratorProposal;')(fake,path,createHash);
function local(fn){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-generator-source-')));fs.chmodSync(base,0o700);try{return fn(base);}finally{fs.rmSync(base,{recursive:true,force:true});}}

test('constructor source performs no eval/native/command dispatch and preserves exact commonprefix once',()=>{
  assert.doesNotMatch(moduleSource,/\beval\(|\bFunction\(|runInContext|runInNewContext|spawn\(|exec\(/);
  assert.equal((moduleSource.match(/"common_prefix"/g)??[]).length,1);assert(!moduleSource.includes('"x_assignment"'));assert(!moduleSource.includes('"lYt"'));
  assert(moduleSource.includes("initialization:'g2i',generator:'k0d'"));assert(moduleSource.includes("commands:[]"));assert(moduleSource.includes("bunEquivalence:'NOT_ESTABLISHED'"));
});
test('unknown/accessor/symbol/source/profile/caller options refuse without getters or filesystem reads',()=>{
  let calls=0;const fake={...fs,realpathSync(){calls++;throw Error('UNEXPECTED');}},construct=adapt(fake);
  for(const options of [{native:'/native',profile:{}},{native:'/native',source:'function k0d(){}'},{native:'/native',cwd:'/other'},{native:'/native',allow:true},{native:'/native',[Symbol('option')]:true},Object.create(null)])failCode(()=>construct(options),'GENERATOR_OPTIONS');
  const accessor={};Object.defineProperty(accessor,'native',{get(){calls++;return'/native';},enumerable:true});failCode(()=>construct(accessor),'GENERATOR_OPTIONS');assert.equal(calls,0);
});
test('noncanonical/relative/control paths cannot select read inputs',()=>{
  let calls=0;const construct=adapt({...fs,realpathSync(){calls++;}});
  for(const native of ['relative','/native/','/base/../native','/native\n','/native\0','/native\\alias','/native:alias','/native\ud800'])failCode(()=>construct({native}),'GENERATOR_SOURCE_PATH');assert.equal(calls,0);
});
test('missing/symlink/short/unowned/multilink inputs fail before source body extraction',()=>local(base=>{
  const leaf=base+'/NONSECRET-native',alias=base+'/NONSECRET-link';fs.writeFileSync(leaf,'PUBLIC_SHORT_SOURCE',{mode:0o700});fs.symlinkSync(leaf,alias);
  failCode(()=>prepare({native:base+'/absent'}),'GENERATOR_SOURCE_UNAVAILABLE');failCode(()=>prepare({native:alias}),'GENERATOR_SOURCE_PATH');failCode(()=>prepare({native:leaf}),'GENERATOR_SOURCE_IDENTITY');
  const original=fs.lstatSync;for(const fault of ['owner','nlink']){
    const construct=adapt({...fs,lstatSync(file,...args){const stat=Reflect.apply(original,fs,[file,...args]);if(file===leaf){stat.size=215994048n;if(fault==='owner')stat.uid+=1n;else stat.nlink=2n;}return stat;}});failCode(()=>construct({native:leaf}),'GENERATOR_SOURCE_IDENTITY');
  }
}));
test('selected actual public source is bound and yields disabled original-order code data only',selected,()=>{
  const value=prepare({native:publicNative});assert.equal(value.nativeSha256,pin);assert.equal(value.fragmentCount,24);assert.equal(value.closure.length,24);
  const sha=createHash('sha256').update(value.source).digest('hex');assert.equal(value.sourceSha256,sha);assert(Object.isFrozen(value.closure));assert(Object.isFrozen(value.closure[0]));assert.deepEqual(value.commands,[]);
  assert.equal(value.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(value.bunEquivalence,'NOT_ESTABLISHED');assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);
  assert(value.source.includes('var gbc=Object.create;'));assert(value.source.includes('var b=(e,t)=>()=>(e&&(t=e(e=0)),t)'));assert(value.source.includes('var g2i=b(()=>{_Lt();c$e();u2i=x(nGr(),1)'));
  for(let at=1;at<value.closure.length;at++)assert(value.closure[at].offset>=value.closure[at-1].offset+value.closure[at-1].length);
  assert(value.quirks.includes('ROOT_LITERAL_READ_AND_DIRECTORY_METADATA_ALLOW'));assert(value.quirks.includes('PUBLIC_READ_ENTRIES_ARE_SUBPATH_NOT_LITERAL'));assert(value.quirks.includes('STATIC_MACH_PREFERENCES_IPC_DEVICE_SYSCTL_ALLOWANCES'));
});
for(const [fault,code] of [['full-hash','GENERATOR_SOURCE_IDENTITY'],['span-hash','GENERATOR_SOURCE_CLOSURE'],['post-stat','GENERATOR_SOURCE_CHANGED'],['close','GENERATOR_SOURCE_UNAVAILABLE']])test(`selected source controlled ${fault} failure returns no proposal or private values`,selected,()=>{
  let mutated=false,stats=0;const fake={...fs,
    readSync(fd,buffer,offset,length,position){const count=fs.readSync(fd,buffer,offset,length,position);
      if(!mutated&&(fault==='full-hash'&&position===0||fault==='span-hash'&&position===198195615&&length===7508)){buffer[offset]^=1;mutated=true;}return count;},
    fstatSync(fd,...args){const stat=fs.fstatSync(fd,...args);stats++;if(fault==='post-stat'&&stats===2)stat.ino+=1n;return stat;},
    closeSync(fd){fs.closeSync(fd);if(fault==='close')throw Object.assign(Error('NONSECRET_DETAIL'),{code:'EIO'});}};
  failCode(()=>adapt(fake)({native:publicNative}),code);
});

// Finite diagnostics only. Do not emit exception messages, stack, profiles,
// environment values or arbitrary reference names. No exception getters run.
const REFERENCE_NAMES=Object.freeze(['gbc','_bc','kLe','esr','ybc','aYt','lYt','No','Tbc','Sbc','x','oo','t3o','Q','bbc','Ebc','ft','b','DUi','_Lt','PUi','Fwn','MUi','WUi','nGr','p0d','yLt','m0d','Uwn','a$','l$e','qwn','kO','$wn','JF','Gwe','A0d','c2i','m2i','v0d','w0d','k0d','z0','u2i','d2i','jhe','p2i','g2i','Object','WeakMap','Math','JSON','Set','process','require','Buffer','String','RegExp','Error']);
function safeErrorData(error,key){
  if(!error||typeof error!=='object')return null;let at=error;
  for(let depth=0;at&&depth<4;depth++){const descriptor=Object.getOwnPropertyDescriptor(at,key);if(descriptor)return Object.hasOwn(descriptor,'value')?descriptor.value:null;at=Object.getPrototypeOf(at);}return null;
}
function generatorFailureObservation(error,phase){
  const phases=['COMPILE','INITIALIZE','GENERATE','CLASSIFY'],name=safeErrorData(error,'name'),code=safeErrorData(error,'code');
  let reason_code='UNKNOWN_OR_UNAVAILABLE',identifier='NONE';
  if(code==='ERR_SCRIPT_EXECUTION_TIMEOUT')reason_code='VM_TIMEOUT';
  else if(code==='GENERATOR_SOURCE_IDENTITY')reason_code='SOURCE_IDENTITY_MISMATCH';
  else if(code==='GENERATOR_PROFILE_UNKNOWN')reason_code='PROFILE_CLASSIFICATION_UNKNOWN';
  else if(name==='ReferenceError'){reason_code='REFERENCE_ERROR';const message=safeErrorData(error,'message');
    if(typeof message==='string'&&message.length<=256){const match=/^([A-Za-z_$][A-Za-z0-9_$]{0,31}) is not defined$/.exec(message)??/^Cannot access '([A-Za-z_$][A-Za-z0-9_$]{0,31})' before initialization$/.exec(message);
      if(match&&REFERENCE_NAMES.includes(match[1]))identifier=match[1];}}
  else if(name==='SyntaxError')reason_code='SYNTAX_ERROR';else if(name==='TypeError')reason_code='TYPE_ERROR';
  return {schema:1,result:'UNKNOWN',phase:phases.includes(phase)?phase:'COMPILE',reason_code,identifier,nativeLaunches:0,sealed:false,reuseEligible:false};
}

// Keep the original success predicates and65536-byte bound unchanged. A finite
// redacted diagnostic identifies which predicate is unmet; no SBPL is retained.
function generatedProfileClassification(profile){
  if(typeof profile!=='string')return {profileType:'OTHER',profileBytes:null,byteStatus:'NOT_APPLICABLE',rootLiteralRead:null,publicReadSubpath:null,networkWildcard:null,passed:false};
  // Bound diagnostic work on unrecognized outputs; fixed valid generator source
  // normally returns far less. This is not a relaxed acceptance size bound.
  if(profile.length>262144)return {profileType:'STRING',profileBytes:null,byteStatus:'EXCEEDS_65536',rootLiteralRead:null,publicReadSubpath:null,networkWildcard:null,passed:false};
  const profileBytes=Buffer.byteLength(profile),rootLiteralRead=profile.includes('(allow file-read* (literal "/"))'),publicReadSubpath=profile.includes('(subpath "/redue-engineering-public/node")'),networkWildcard=profile.includes('(allow network*)');
  return {profileType:'STRING',profileBytes,byteStatus:profileBytes<=65536?'WITHIN_65536':'EXCEEDS_65536',rootLiteralRead,publicReadSubpath,networkWildcard,passed:profileBytes<=65536&&rootLiteralRead&&publicReadSubpath&&!networkWildcard};
}
function classificationShape(value){
  const keys=['profileType','profileBytes','byteStatus','rootLiteralRead','publicReadSubpath','networkWildcard','passed'];
  if(!value||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')))return false;
  if(value.profileType==='OTHER')return value.profileBytes===null&&value.byteStatus==='NOT_APPLICABLE'&&['rootLiteralRead','publicReadSubpath','networkWildcard'].every(key=>value[key]===null)&&value.passed===false;
  if(value.profileType!=='STRING')return false;
  if(value.profileBytes===null)return value.byteStatus==='EXCEEDS_65536'&&['rootLiteralRead','publicReadSubpath','networkWildcard'].every(key=>value[key]===null)&&value.passed===false;
  if(!Number.isInteger(value.profileBytes)||value.profileBytes<0||value.profileBytes>786432||!['rootLiteralRead','publicReadSubpath','networkWildcard'].every(key=>typeof value[key]==='boolean'))return false;
  return value.byteStatus===(value.profileBytes<=65536?'WITHIN_65536':'EXCEEDS_65536')&&value.passed===(value.profileBytes<=65536&&value.rootLiteralRead&&value.publicReadSubpath&&!value.networkWildcard);
}

// Evaluation remains opt-in for the source-review checkpoint. This is not a
// permission token for a native startup; no policy is installed or enforced.
const evaluation={skip:publicNative&&process.env.REDUE_GENERATOR_SOURCE_EVALUATION==='1'?false:'Separate reviewed source-evaluation checkpoint not requested'};
test('reviewed exact closure evaluates with four actual builtins in fixed no-secret Node child; no sandbox/native proof',evaluation,()=>local(base=>{
  const proposal=prepare({native:publicNative}),home=base+'/home',cwd=base+'/public-cwd';fs.mkdirSync(home,{mode:0o700});fs.mkdirSync(cwd,{mode:0o700});
  const codeFile=base+'/generator-source.js';fs.writeFileSync(codeFile,proposal.source,{mode:0o600,flag:'wx'});
  const child=`import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const REFERENCE_NAMES=${JSON.stringify(REFERENCE_NAMES)};
${safeErrorData.toString()}
${generatorFailureObservation.toString()}
${generatedProfileClassification.toString()}
let classification=null;
const phase={value:'COMPILE'};
try{const actualRequire=createRequire(import.meta.url),allowed=new Set(['fs','path','os','child_process']);
const code=fs.readFileSync(process.argv[1],'utf8');if(createHash('sha256').update(code).digest('hex')!==process.argv[2])throw Object.assign(Error(),{code:'GENERATOR_SOURCE_IDENTITY'});
const context=vm.createContext({process,__redueGeneratorPhase:phase,require:name=>{if(!allowed.has(name))throw Error();return actualRequire(name);}});
const script=new vm.Script(code+';__redueGeneratorPhase.value="INITIALIZE";g2i();__redueGeneratorPhase.value="GENERATE";k0d({readConfig:{denyOnly:["/"],allowWithinDeny:["/redue-engineering-public/node"]},writeConfig:{allowOnly:[],denyWithinAllow:[]},needsNetworkRestriction:true,allowUnixSockets:[],allowAllUnixSockets:false,allowLocalBinding:false,allowMachLookup:[],allowPty:false,allowGitConfig:false,enableWeakerNetworkIsolation:false,allowAppleEvents:false,logTag:"REDUE_ENGINEERING_SOURCE_ONLY"})');
const profile=script.runInContext(context,{timeout:1000});phase.value='CLASSIFY';
classification=generatedProfileClassification(profile);if(!classification.passed)throw Object.assign(Error(),{code:'GENERATOR_PROFILE_UNKNOWN'});
console.log(JSON.stringify({schema:1,result:'SOURCE_COMPOSITION_OBSERVED',phase:'CLASSIFY',profileSha256:createHash('sha256').update(profile).digest('hex'),profileBytes:classification.profileBytes,classification,nativeLaunches:0,nativeEnforcement:'NOT_ESTABLISHED',bunEquivalence:'NOT_ESTABLISHED',sealed:false,reuseEligible:false}));
}catch(error){console.log(JSON.stringify({...generatorFailureObservation(error,phase.value),classification}));process.exitCode=74;}`;
  const result=spawnSync(process.execPath,['--input-type=module','--eval',child,codeFile,proposal.sourceSha256],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});
  assert(result.error===undefined,'BOUNDED_SOURCE_CHILD_UNAVAILABLE');assert(result.signal===null,'BOUNDED_SOURCE_CHILD_SIGNALED');assert(result.stderr==='','BOUNDED_SOURCE_CHILD_STDERR_UNKNOWN');
  let observed;try{observed=JSON.parse(result.stdout);}catch{assert.fail('BOUNDED_SOURCE_CHILD_PROTOCOL_UNKNOWN');}
  if(result.status!==0){const safe=observed&&Object.keys(observed).sort().join(',')==='classification,identifier,nativeLaunches,phase,reason_code,result,reuseEligible,schema,sealed'&&observed.schema===1&&observed.nativeLaunches===0&&observed.sealed===false&&observed.reuseEligible===false&&observed.result==='UNKNOWN'&&['COMPILE','INITIALIZE','GENERATE','CLASSIFY'].includes(observed.phase)&&['VM_TIMEOUT','SOURCE_IDENTITY_MISMATCH','PROFILE_CLASSIFICATION_UNKNOWN','REFERENCE_ERROR','SYNTAX_ERROR','TYPE_ERROR','UNKNOWN_OR_UNAVAILABLE'].includes(observed.reason_code)&&['NONE',...REFERENCE_NAMES].includes(observed.identifier)&&(observed.classification===null||classificationShape(observed.classification));
    assert.fail(safe?'SOURCE_EVALUATION_'+observed.phase+'_'+observed.reason_code+'_'+observed.identifier+'_'+JSON.stringify(observed.classification):'BOUNDED_SOURCE_CHILD_UNKNOWN');}
  const validSuccess=observed&&Object.keys(observed).sort().join(',')==='bunEquivalence,classification,nativeEnforcement,nativeLaunches,phase,profileBytes,profileSha256,result,reuseEligible,schema,sealed'&&observed.schema===1&&observed.result==='SOURCE_COMPOSITION_OBSERVED'&&observed.phase==='CLASSIFY'&&/^[a-f0-9]{64}$/.test(observed.profileSha256)&&Number.isInteger(observed.profileBytes)&&observed.profileBytes>0&&observed.profileBytes<=65536&&observed.nativeLaunches===0&&observed.nativeEnforcement==='NOT_ESTABLISHED'&&observed.bunEquivalence==='NOT_ESTABLISHED'&&observed.sealed===false&&observed.reuseEligible===false&&classificationShape(observed.classification)&&observed.classification.passed===true;
  assert(validSuccess,'BOUNDED_SOURCE_CHILD_PROTOCOL_UNKNOWN');
  assert.equal(observed.result,'SOURCE_COMPOSITION_OBSERVED');assert.equal(observed.phase,'CLASSIFY');assert.equal(observed.nativeLaunches,0);assert.equal(observed.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(observed.bunEquivalence,'NOT_ESTABLISHED');assert.equal(observed.sealed,false);assert.equal(observed.reuseEligible,false);
  assert(!result.stdout.includes(base));assert(!result.stdout.includes('file-read'));assert(!result.stdout.includes('REDUE_ENGINEERING_SOURCE_ONLY'));
}));


test('external failures carrying known code still become static sanitized error',()=>{
  const construct=adapt({...fs,realpathSync(){throw Object.assign(Error('NONSECRET_PATH_OR_PROFILE_DETAIL'),{code:'GENERATOR_SOURCE_CHANGED'});}});
  failCode(()=>construct({native:'/NONSECRET-native'}),'GENERATOR_SOURCE_CHANGED');
});


for(const phase of ['COMPILE','INITIALIZE','GENERATE','CLASSIFY'])test('finite reporter retains '+phase+' without raw ReferenceError text',()=>{
  const known=generatorFailureObservation(new ReferenceError('JF is not defined'),phase);assert.equal(known.phase,phase);assert.equal(known.reason_code,'REFERENCE_ERROR');assert.equal(known.identifier,'JF');
  const privateName=generatorFailureObservation(new ReferenceError('NONSECRET_PRIVATE_IDENTIFIER is not defined'),phase);assert.equal(privateName.identifier,'NONE');assert(!JSON.stringify(privateName).includes('NONSECRET'));
});
test('finite source errors and VM timeout ignore raw messages and profile/path/env-shaped values',()=>{
  for(const [error,expected] of [[new SyntaxError('NONSECRET_PROFILE_BODY'),'SYNTAX_ERROR'],[new TypeError('/NONSECRET/path ENV=VALUE'),'TYPE_ERROR'],[Object.assign(Error('NONSECRET'),{code:'ERR_SCRIPT_EXECUTION_TIMEOUT'}),'VM_TIMEOUT'],[Object.assign(Error('NONSECRET'),{code:'GENERATOR_SOURCE_IDENTITY'}),'SOURCE_IDENTITY_MISMATCH'],[Object.assign(Error('NONSECRET'),{code:'GENERATOR_PROFILE_UNKNOWN'}),'PROFILE_CLASSIFICATION_UNKNOWN'],[Error('NONSECRET_UNKNOWN'),'UNKNOWN_OR_UNAVAILABLE']]){
    const result=generatorFailureObservation(error,'GENERATE');assert.equal(result.reason_code,expected);assert.equal(result.identifier,'NONE');assert(!JSON.stringify(result).includes('NONSECRET'));assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
  }
});
test('reporter skips accessors, long messages, partial matches and unknown phases',()=>{
  let getters=0;const getter={};for(const key of ['name','code','message'])Object.defineProperty(getter,key,{get(){getters++;return'NONSECRET';}});
  assert.equal(generatorFailureObservation(getter,'NONSECRET_PHASE').phase,'COMPILE');assert.equal(getters,0);
  for(const text of ['JF is not defined /NONSECRET/path','x'.repeat(300)+'JF is not defined',"Cannot access 'NONSECRET' before initialization"]){const result=generatorFailureObservation(new ReferenceError(text),'INITIALIZE');assert.equal(result.identifier,'NONE');assert(!JSON.stringify(result).includes('NONSECRET'));}
});
test('phase tags preserve one aggregate VM budget and unchanged bounded child limits',()=>{
  const text=fs.readFileSync(new URL(import.meta.url),'utf8');const section=text.slice(text.indexOf('  const child=`'),text.indexOf("for(const phase of ['COMPILE'"));
  assert.equal((section.match(/runInContext\(context,\{timeout:1000\}\)/g)??[]).length,1);assert(section.includes('timeout:5000,maxBuffer:4096'));assert(section.includes("killSignal:'SIGKILL'"));
  assert(section.includes('__redueGeneratorPhase.value="INITIALIZE"'));assert(section.includes('__redueGeneratorPhase.value="GENERATE"'));assert(section.includes("phase.value='CLASSIFY'"));
});


test('finite classification diagnoses each original predicate without altering size/network/read acceptance',()=>{
  const original='(allow file-read* (literal "/"))\n(subpath "/redue-engineering-public/node")';
  const good=generatedProfileClassification(original);assert.equal(good.passed,true);assert.equal(good.byteStatus,'WITHIN_65536');assert(classificationShape(good));
  const cases=[['type',null,'OTHER'],['root',original.replace('(allow file-read* (literal "/"))',''),'rootLiteralRead'],['public',original.replace('(subpath "/redue-engineering-public/node")',''),'publicReadSubpath'],['network',original+'\n(allow network*)','networkWildcard'],['bytes',original+'X'.repeat(65536),'EXCEEDS_65536']];
  for(const [name,value,field] of cases){const result=generatedProfileClassification(value);assert.equal(result.passed,false,name);assert(classificationShape(result));if(name==='type')assert.equal(result.profileType,field);else if(name==='bytes')assert.equal(result.byteStatus,field);else assert.equal(result[field],name==='network');}
});
test('classification byte threshold remains65536 exactly and larger bounded samples never become success',()=>{
  const original='(allow file-read* (literal "/"))\n(subpath "/redue-engineering-public/node")',exact=original+'X'.repeat(65536-Buffer.byteLength(original));
  assert.equal(generatedProfileClassification(exact).passed,true);const beyond=generatedProfileClassification(exact+'X');assert.equal(beyond.profileBytes,65537);assert.equal(beyond.passed,false);assert.equal(beyond.byteStatus,'EXCEEDS_65536');
  const capped=generatedProfileClassification('X'.repeat(262145));assert.equal(capped.profileBytes,null);assert.equal(capped.rootLiteralRead,null);assert.equal(capped.passed,false);assert(classificationShape(capped));
});
test('classification result omits profile/env/path bodies and does not invoke nonstring coercion',()=>{
  let coerced=0;const value={toString(){coerced++;throw Error('NONSECRET');}};assert.equal(generatedProfileClassification(value).profileType,'OTHER');assert.equal(coerced,0);
  const classified=generatedProfileClassification('NONSECRET_BODY ENV=VALUE /NONSECRET/path');assert(!JSON.stringify(classified).includes('NONSECRET'));assert(!JSON.stringify(classified).includes('VALUE'));
  assert.equal(classificationShape({...classified,private:'NONSECRET'}),false);assert.equal(classificationShape({...classified,profileBytes:-1}),false);assert.equal(classificationShape({...classified,passed:true}),false);assert.equal(classificationShape({...classified,byteStatus:'NOT_APPLICABLE'}),false);
  let getters=0;const getter={...classified};Object.defineProperty(getter,'passed',{get(){getters++;return true;}});assert.equal(classificationShape(getter),false);assert.equal(getters,0);
});
