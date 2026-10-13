// Harmless owned local file fixtures only. No agent/checker/mapper/compiler,
// settings/credentials/source copying, CI, model or filesystem policy changes.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {prepareSealedTypeScriptSyntheticFixture as prepare,verifySealedTypeScriptSyntheticFixture as verify} from './acceptance/sealed-typescript-synthetic-fixture.mjs';
const available={skip:typeof process.getuid==='function'&&process.getuid()!==0?false:'Owned nonroot POSIX fixture controls unavailable'};
function local(fn){const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-synthetic-owner-')));fs.chmodSync(parent,0o700);
  try{return fn(parent);}finally{fs.rmSync(parent,{recursive:true,force:true});}}
const prepared=parent=>{const fixture=prepare({parent});assert.equal(fixture.outcome,'SYNTHETIC_FIXTURE_PREPARED');return fixture;};
const unknown=fixture=>{const result=verify(fixture);assert.equal(result.outcome,'UNKNOWN');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);return result;};

test('fresh owned local construction and verification yield only fixed synthetic canaries',available,()=>local(parent=>{
  const value=prepared(parent),result=verify(value);assert.equal(result.outcome,'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');
  assert.equal(path.dirname(value.base),parent);assert.match(path.basename(value.base),/^redue-ci-recipient-[a-f0-9]{8}$/);
  assert.equal(value.layout.stageParent,value.base+'/sealed-inputs');assert.equal(value.layout.workspace,value.base+'/Checkout 空间/.sealed-native-canaries');
  assert.equal(value.knownCanaryFiles.length,8);assert.deepEqual(fs.readdirSync(value.base).sort(),['Checkout 空间','sealed-inputs']);
  assert.equal(fs.existsSync(value.base+'/redue-state'),false);assert.equal(fs.existsSync(value.base+'/prefix'),false);assert.equal(fs.existsSync(value.base+'/claude-host'),false);
  assert.equal(value.receiverBasePolicyMatch,false,'Owned local parent is not admitted CI absolute base');assert.equal(value.ownedHandlesClosed,true);
  assert.equal(value.noInheritedWritableHandlesVerified,false);assert.equal(value.nativePolicyVerified,false);assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);assert(Object.isFrozen(value.layout));
}));

test('no caller label, boolean or serialized descriptor can mint an actual fixture',available,()=>local(parent=>{
  for(const extra of [{fresh:true},{noRealStage:true},{nonce:'12345678'},{state:'/private/state'}])assert.throws(()=>prepare({parent,...extra}),error=>error.code==='SYNTHETIC_FIXTURE_OPTIONS');
  const value=prepared(parent);assert.equal(verify(JSON.parse(JSON.stringify(value))).reason,'SYNTHETIC_FIXTURE_NOT_MINTED');assert.equal(verify({base:value.base,fresh:true}).reason,'SYNTHETIC_FIXTURE_NOT_MINTED');
}));

for(const name of ['extra-real-stage','redue-state','receipts-v1.json','runs-v1.json'])test(`${name} is preserved and refuses verification instead of being adopted`,available,()=>local(parent=>{
  const value=prepared(parent),target=name==='extra-real-stage'?value.layout.stageParent+'/'+name:value.base+'/'+name;
  fs.writeFileSync(target,'NONSECRET_PRESERVED');unknown(value);assert.equal(fs.readFileSync(target,'utf8'),'NONSECRET_PRESERVED');
}));

test('source alias/hardlink and same-byte replacement are refused without modifying preserved files',available,()=>local(parent=>{
  for(const mutation of ['hardlink','replacement','symlink']){
    const value=prepared(parent),target=value.layout.stage+'/write-canary.txt',outside=value.base+'/NONSECRET-extra.txt';
    if(mutation==='hardlink')fs.linkSync(target,outside);
    else if(mutation==='replacement'){const body=fs.readFileSync(target);fs.unlinkSync(target);fs.writeFileSync(target,body,{mode:0o644});}
    else{fs.renameSync(target,outside);fs.symlinkSync(outside,target);}
    unknown(value);assert.equal(fs.existsSync(target),true);
  }
}));

test('directory symlink, extra entries, changed contents and modes are not fresh observation',available,()=>local(parent=>{
  for(const mutation of ['dirlink','extra','content','mode']){
    const value=prepared(parent);
    if(mutation==='dirlink'){fs.renameSync(value.layout.stage,value.layout.stage+'-held');fs.symlinkSync(value.layout.stage+'-held',value.layout.stage);}
    else if(mutation==='extra')fs.writeFileSync(value.layout.workspace+'/unknown.txt','NONSECRET');
    else if(mutation==='content')fs.writeFileSync(value.layout.stage+'/map-canary.txt','NONSECRET_WRONG_BODY');
    else fs.chmodSync(value.layout.stage+'/map-canary.txt',0o600);
    unknown(value);
  }
}));

test('world-writable parent is unavailable; no caller path label repairs it',available,()=>local(parent=>{
  fs.chmodSync(parent,0o777);const result=prepare({parent});assert.equal(result.outcome,'UNKNOWN');assert.equal(result.base,null);assert.deepEqual(fs.readdirSync(parent),[]);
}));

test('existing base collision does not expose it as owned partial work or overwrite preserved data',available,()=>local(parent=>{
  const original=fs.mkdirSync;let collided;
  fs.mkdirSync=function(file,options){if(path.dirname(file)===parent&&path.basename(file).startsWith('redue-ci-recipient-')){
    collided=file;Reflect.apply(original,fs,[file,options]);fs.writeFileSync(file+'/NONSECRET-existing.txt','PRESERVED');throw Object.assign(Error('NONSECRET'),{code:'EEXIST'});
  }return Reflect.apply(original,this,[file,options]);};
  let result;try{result=prepare({parent});}finally{fs.mkdirSync=original;}
  assert.equal(result.outcome,'UNKNOWN');assert.equal(result.base,null);assert.equal(fs.readFileSync(collided+'/NONSECRET-existing.txt','utf8'),'PRESERVED');
}));

test('known writer close uncertainty retains partial base and never mints a verified fixture',available,()=>local(parent=>{
  const original=fs.closeSync;let injected=false;
  fs.closeSync=function(fd){const result=Reflect.apply(original,this,[fd]);if(!injected){injected=true;throw Object.assign(Error('NONSECRET_CLOSE'),{code:'EIO'});}return result;};
  let value;try{value=prepare({parent});}finally{fs.closeSync=original;}
  assert.equal(value.outcome,'UNKNOWN');assert.equal(value.ownedHandlesClosed,false);assert(value.base);assert.equal(fs.existsSync(value.base),true);assert.equal(verify(value).reason,'SYNTHETIC_FIXTURE_NOT_MINTED');
}));

test('read descriptor close uncertainty irreversibly withholds this fixture observation',available,()=>local(parent=>{
  const value=prepared(parent),original=fs.closeSync;let injected=false;
  fs.closeSync=function(fd){const result=Reflect.apply(original,this,[fd]);if(!injected){injected=true;throw Object.assign(Error('NONSECRET'),{code:'EIO'});}return result;};
  try{unknown(value);}finally{fs.closeSync=original;}
  assert.equal(verify(value).outcome,'UNKNOWN','Unknown closed handles cannot be repaired by a later metadata read');
}));

test('directory close uncertainty also latches unknown without launching a process or deleting partial fixtures',available,()=>local(parent=>{
  const value=prepared(parent),original=fs.opendirSync;let injected=false;
  fs.opendirSync=function(...args){const dir=Reflect.apply(original,this,args),close=dir.closeSync.bind(dir);dir.closeSync=function(){close();if(!injected){injected=true;throw Object.assign(Error('NONSECRET'),{code:'EIO'});}};return dir;};
  try{unknown(value);}finally{fs.opendirSync=original;}
  assert.equal(verify(value).outcome,'UNKNOWN');assert.equal(fs.existsSync(value.base),true);
}));

test('controlled unowned parent or canary metadata refuses without modifying actual ownership',available,()=>local(parent=>{
  const original=fs.lstatSync;fs.lstatSync=function(file,...args){const stat=Reflect.apply(original,this,[file,...args]);if(file===parent)stat.uid+=1n;return stat;};
  let denied;try{denied=prepare({parent});}finally{fs.lstatSync=original;}assert.equal(denied.outcome,'UNKNOWN');assert.equal(denied.base,null);
  const value=prepared(parent),target=value.layout.stage+'/write-canary.txt';fs.lstatSync=function(file,...args){const stat=Reflect.apply(original,this,[file,...args]);if(file===target)stat.uid+=1n;return stat;};
  try{unknown(value);}finally{fs.lstatSync=original;}
  assert.equal(fs.lstatSync(target).uid,process.getuid());
}));

test('bounded extra-entry inventory returns unknown and retains every owned entry',available,()=>local(parent=>{
  const value=prepared(parent);for(let at=0;at<65;at++)fs.writeFileSync(value.layout.stageParent+'/extra-'+at,'NONSECRET');unknown(value);
  assert.equal(fs.readdirSync(value.layout.stageParent).length,66);
}));
