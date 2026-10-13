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

// Evaluation remains opt-in for the source-review checkpoint. This is not a
// permission token for a native startup; no policy is installed or enforced.
const evaluation={skip:publicNative&&process.env.REDUE_GENERATOR_SOURCE_EVALUATION==='1'?false:'Separate reviewed source-evaluation checkpoint not requested'};
test('reviewed exact closure evaluates with four actual builtins in fixed no-secret Node child; no sandbox/native proof',evaluation,()=>local(base=>{
  const proposal=prepare({native:publicNative}),home=base+'/home',cwd=base+'/public-cwd';fs.mkdirSync(home,{mode:0o700});fs.mkdirSync(cwd,{mode:0o700});
  const codeFile=base+'/generator-source.js';fs.writeFileSync(codeFile,proposal.source,{mode:0o600,flag:'wx'});
  const child=`import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const actualRequire=createRequire(import.meta.url),allowed=new Set(['fs','path','os','child_process']);
try{const code=fs.readFileSync(process.argv[1],'utf8');if(createHash('sha256').update(code).digest('hex')!==process.argv[2])throw Error('SOURCE_CHANGED');
const context=vm.createContext({process,require:name=>{if(!allowed.has(name))throw Error('UNREVIEWED_BUILTIN');return actualRequire(name);}});
const profile=new vm.Script(code+';g2i();k0d({readConfig:{denyOnly:["/"],allowWithinDeny:["/redue-engineering-public/node"]},writeConfig:{allowOnly:[],denyWithinAllow:[]},needsNetworkRestriction:true,allowUnixSockets:[],allowAllUnixSockets:false,allowLocalBinding:false,allowMachLookup:[],allowPty:false,allowGitConfig:false,enableWeakerNetworkIsolation:false,allowAppleEvents:false,logTag:"REDUE_ENGINEERING_SOURCE_ONLY"})').runInContext(context,{timeout:1000});
if(typeof profile!=='string'||Buffer.byteLength(profile)>65536||!profile.includes('(allow file-read* (literal "/"))')||!profile.includes('(subpath "/redue-engineering-public/node")')||profile.includes('(allow network*)'))throw Error('PROFILE_UNKNOWN');
console.log(JSON.stringify({schema:1,result:'SOURCE_COMPOSITION_OBSERVED',profileSha256:createHash('sha256').update(profile).digest('hex'),profileBytes:Buffer.byteLength(profile),nativeLaunches:0,nativeEnforcement:'NOT_ESTABLISHED',bunEquivalence:'NOT_ESTABLISHED',sealed:false,reuseEligible:false}));
}catch{console.log(JSON.stringify({schema:1,result:'UNKNOWN',reason:'GENERATOR_SOURCE_EVALUATION_UNKNOWN',nativeLaunches:0,sealed:false,reuseEligible:false}));process.exitCode=74;}`;
  const result=spawnSync(process.execPath,['--input-type=module','--eval',child,codeFile,proposal.sourceSha256],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});
  assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,0);assert.equal(result.stderr,'');const observed=JSON.parse(result.stdout);assert.equal(observed.result,'SOURCE_COMPOSITION_OBSERVED');assert.equal(observed.nativeLaunches,0);assert.equal(observed.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(observed.bunEquivalence,'NOT_ESTABLISHED');assert.equal(observed.sealed,false);assert.equal(observed.reuseEligible,false);
  assert(!result.stdout.includes(base));assert(!result.stdout.includes('file-read'));assert(!result.stdout.includes('REDUE_ENGINEERING_SOURCE_ONLY'));
}));


test('external failures carrying known code still become static sanitized error',()=>{
  const construct=adapt({...fs,realpathSync(){throw Object.assign(Error('NONSECRET_PATH_OR_PROFILE_DETAIL'),{code:'GENERATOR_SOURCE_CHANGED'});}});
  failCode(()=>construct({native:'/NONSECRET-native'}),'GENERATOR_SOURCE_CHANGED');
});
