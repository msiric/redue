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
  assert.equal(value.knownCanaryFiles.length,11);assert.deepEqual(fs.readdirSync(value.base).sort(),['Checkout 空间','sealed-inputs']);
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

// Exact author-source evaluation with a fixed-path filesystem facade. Every
// mkdir/read/write maps into local()'s harmless owned parent; these controls do
// NOT execute the exported real /private/tmp bootstrap or a CI/native process.
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-synthetic-fixture.mjs',import.meta.url),'utf8');
function ciMock(parent){
  const rootStat=(ino,mode)=>({dev:1n,ino:BigInt(ino),mode:BigInt(0o40000|mode),uid:0n,gid:0n,nlink:2n,size:0n,mtimeNs:0n,ctimeNs:0n,isDirectory:()=>true,isSymbolicLink:()=>false});
  const system=new Map([['/',rootStat(1,0o755)],['/private',rootStat(2,0o755)],['/private/tmp',rootStat(3,0o1777)]]);
  const actual=file=>file==='/private/tmp'?parent:file.startsWith('/private/tmp/')?parent+file.slice('/private/tmp'.length):file;
  const reads=[],directories=[];
  const fake={...fs,
    lstatSync(file,...args){return system.has(file)?{...system.get(file)}:fs.lstatSync(actual(file),...args);},
    realpathSync(file){if(system.has(file))return file;const result=fs.realpathSync(actual(file));return result.startsWith(parent+'/')?'/private/tmp'+result.slice(parent.length):result;},
    mkdirSync(file,...args){return fs.mkdirSync(actual(file),...args);},
    opendirSync(file,...args){directories.push(file);return fs.opendirSync(actual(file),...args);},
    openSync(file,...args){reads.push(file);return fs.openSync(actual(file),...args);}};
  const processView={getuid:()=>process.getuid(),geteuid:()=>process.geteuid(),getgid:()=>process.getgid(),getegid:()=>process.getegid()};
  const module=Function('fs','path','randomBytes','process',source.replace(/^import .*;$/m,'').replace(/export function /g,'function ')+
    '\nreturn {create:createSealedTypeScriptCIBootstrap,prepare:prepareSealedTypeScriptCISyntheticFixture,verify:verifySealedTypeScriptSyntheticFixture};')(fake,path,()=>Buffer.from('1234abcd','hex'),processView);
  return {...module,fake,system,actual,reads,directories,processView};
}
function boot(mock){const value=mock.create();assert.equal(value.outcome,'CI_SYNTHETIC_BOOTSTRAP_PREPARED');assert.equal(value.base,'/private/tmp/redue-ci-recipient-1234abcd');return value;}
function ciPrepared(mock,token){const value=mock.prepare(token);assert.equal(value.outcome,'SYNTHETIC_FIXTURE_PREPARED');return value;}
const ciUnknown=value=>{assert.equal(value.outcome,'UNKNOWN');assert.equal(value.scope,'FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY');assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);return value;};

test('mock fixed CI bootstrap and same-process preparation match receiver geometry without native authority',available,()=>local(parent=>{
  const mock=ciMock(parent),token=boot(mock),fixture=ciPrepared(mock,token),seen=mock.verify(fixture);
  assert.equal(token.receiverBasePolicyMatch,true);assert.equal(fixture.receiverBasePolicyMatch,true);assert.equal(seen.outcome,'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');
  assert.equal(fixture.layout.checkout,token.base+'/Checkout 空间');assert.equal(fixture.layout.stageParent,token.base+'/sealed-inputs');
  assert.equal(fixture.knownCanaryFiles.length,11);assert.equal(fixture.ownedHandlesClosed,true);
  for(const value of [token,fixture,seen]){assert.equal(value.noInheritedWritableHandlesVerified,false);assert.equal(value.nativePolicyVerified,false);assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);}
  assert(Object.isFrozen(token));assert(Object.isFrozen(fixture.layout));
}));

test('mock CI host setup assets remain unread and unenumerated outside exact synthetic namespaces',available,()=>local(parent=>{
  const mock=ciMock(parent),token=boot(mock),base=mock.actual(token.base),checkout=base+'/Checkout 空间';
  fs.mkdirSync(checkout,{mode:0o700});fs.writeFileSync(checkout+'/NONSECRET-project.txt','PRESERVED');
  for(const name of ['prefix','claude-host','redue-state','native']){fs.mkdirSync(base+'/'+name,{mode:0o700});fs.writeFileSync(base+'/'+name+'/NONSECRET-preserved.txt','PRESERVED');}
  const fixture=ciPrepared(mock,token);assert.equal(mock.verify(fixture).outcome,'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');
  assert(!mock.directories.includes(token.base));assert(!mock.directories.includes(token.base+'/Checkout 空间'));
  assert(mock.reads.every(file=>file.startsWith(fixture.layout.stage+'/')||file.startsWith(fixture.layout.workspace+'/')));
  fs.writeFileSync(base+'/redue-state/receipts-v1.json','NONSECRET_PRESERVED');
  assert.equal(mock.verify(fixture).outcome,'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED','No state is adopted or claimed fresh');
  assert.equal(fs.readFileSync(checkout+'/NONSECRET-project.txt','utf8'),'PRESERVED');
}));

test('mock CI bootstrap accepts zero arguments only and never adopts caller path or flags',available,()=>local(parent=>{
  const mock=ciMock(parent);for(const args of [[{}],[{parent}],['/private/tmp'],[true]])assert.throws(()=>mock.create(...args),error=>error.code==='CI_SYNTHETIC_FIXTURE_OPTIONS');
  assert.deepEqual(fs.readdirSync(parent),[]);
  const token=boot(mock);for(const fake of [{base:token.base},JSON.parse(JSON.stringify(token)),Object.freeze({...token})])assert.equal(ciUnknown(mock.prepare(fake)).reason,'CI_SYNTHETIC_BOOTSTRAP_NOT_MINTED');
  assert.throws(()=>mock.prepare(token,true),error=>error.code==='CI_SYNTHETIC_FIXTURE_OPTIONS');
  ciPrepared(mock,token);assert.equal(ciUnknown(mock.prepare(token)).reason,'CI_SYNTHETIC_BOOTSTRAP_ALREADY_USED_OR_UNKNOWN');
}));

for(const fault of ['tmp-mode','tmp-owner','private-write','root-owner','ancestor-link','ancestor-replacement'])test(`mock fixed CI ancestor ${fault} refuses before construction or preparation`,available,()=>local(parent=>{
  const mock=ciMock(parent);
  if(fault==='tmp-mode')mock.system.get('/private/tmp').mode=0o40777n;
  if(fault==='tmp-owner')mock.system.get('/private/tmp').uid=1000n;
  if(fault==='private-write')mock.system.get('/private').mode=0o40775n;
  if(fault==='root-owner')mock.system.get('/').uid=1000n;
  if(fault==='ancestor-link')mock.system.get('/private').isSymbolicLink=()=>true;
  if(fault!=='ancestor-replacement'){assert.equal(ciUnknown(mock.create()).base,null);assert.deepEqual(fs.readdirSync(parent),[]);return;}
  const token=boot(mock);mock.system.get('/private/tmp').ino+=1n;ciUnknown(mock.prepare(token));
  assert.deepEqual(fs.readdirSync(mock.actual(token.base)),[]);
}));

test('mock collision preserves existing base and exposes no adopted token',available,()=>local(parent=>{
  const mock=ciMock(parent),base=parent+'/redue-ci-recipient-1234abcd';fs.mkdirSync(base,{mode:0o700});fs.writeFileSync(base+'/NONSECRET-existing.txt','PRESERVED');
  const token=ciUnknown(mock.create());assert.equal(token.base,null);assert.equal(fs.readFileSync(base+'/NONSECRET-existing.txt','utf8'),'PRESERVED');
  assert.equal(mock.prepare(token).reason,'CI_SYNTHETIC_BOOTSTRAP_NOT_MINTED');
}));

for(const target of ['sealed-inputs','sealed-inputs-replaced','Checkout 空间/.sealed-native-canaries'])test(`mock preexisting ${target}, even empty, is preserved and cannot become synthetic freshness`,available,()=>local(parent=>{
  const mock=ciMock(parent),token=boot(mock),base=mock.actual(token.base);
  if(target.startsWith('Checkout'))fs.mkdirSync(base+'/Checkout 空间',{mode:0o700});
  fs.mkdirSync(base+'/'+target,{mode:0o700});ciUnknown(mock.prepare(token));assert.equal(fs.statSync(base+'/'+target).isDirectory(),true);
  assert.equal(mock.prepare(token).reason,'CI_SYNTHETIC_BOOTSTRAP_ALREADY_USED_OR_UNKNOWN');
}));

test('mock real stage is retained without inspection or copying',available,()=>local(parent=>{
  const mock=ciMock(parent),token=boot(mock),stage=mock.actual(token.base)+'/sealed-inputs/real-stage';fs.mkdirSync(stage,{recursive:true,mode:0o700});fs.writeFileSync(stage+'/NONSECRET-source.txt','PRESERVED');
  ciUnknown(mock.prepare(token));assert.equal(mock.reads.length,0);assert.equal(fs.readFileSync(stage+'/NONSECRET-source.txt','utf8'),'PRESERVED');
}));

test('mock replaced base or checkout refuses identity instead of adopting same-shaped directories',available,()=>local(parent=>{
  for(const fault of ['base','checkout']){
    const privateParent=parent+'/'+fault;fs.mkdirSync(privateParent,{mode:0o700});const mock=ciMock(privateParent),token=boot(mock),base=mock.actual(token.base);
    if(fault==='base'){fs.renameSync(base,base+'-held');fs.mkdirSync(base,{mode:0o700});ciUnknown(mock.prepare(token));continue;}
    fs.mkdirSync(base+'/Checkout 空间',{mode:0o700});const original=mock.fake.mkdirSync;let replaced=false;
    mock.fake.mkdirSync=function(file,...args){if(!replaced&&file.endsWith('/.sealed-native-canaries')){replaced=true;fs.renameSync(base+'/Checkout 空间',base+'/Checkout-held');fs.mkdirSync(base+'/Checkout 空间',{mode:0o700});}return Reflect.apply(original,this,[file,...args]);};
    ciUnknown(mock.prepare(token));assert.equal(replaced,true);
  }
}));

test('mock CI verification latches protected inventory, base ownership and replacement-destination changes',available,()=>local(parent=>{
  for(const fault of ['extra-stage','mode-base','replacement-destination','hardlink']){
    const privateParent=parent+'/'+fault;fs.mkdirSync(privateParent,{mode:0o700});const mock=ciMock(privateParent),fixture=ciPrepared(mock,boot(mock)),base=mock.actual(fixture.base);
    if(fault==='extra-stage')fs.mkdirSync(base+'/sealed-inputs/real-stage',{mode:0o700});
    if(fault==='mode-base')fs.chmodSync(base,0o755);
    if(fault==='replacement-destination')fs.mkdirSync(base+'/sealed-inputs-replaced',{mode:0o700});
    if(fault==='hardlink')fs.linkSync(mock.actual(fixture.layout.stage)+'/write-canary.txt',base+'/NONSECRET-alias.txt');
    ciUnknown(mock.verify(fixture));if(fault==='mode-base')fs.chmodSync(base,0o700);assert.equal(mock.verify(fixture).outcome,'UNKNOWN');
  }
}));

test('mock CI writer or reader close uncertainty never implies native seal and retains partial data',available,()=>local(parent=>{
  for(const phase of ['writer','reader']){
    const privateParent=parent+'/'+phase;fs.mkdirSync(privateParent,{mode:0o700});const mock=ciMock(privateParent),token=boot(mock);let fixture;
    if(phase==='reader')fixture=ciPrepared(mock,token);
    const original=mock.fake.closeSync;let injected=false;mock.fake.closeSync=function(fd){const result=Reflect.apply(original,this,[fd]);if(!injected){injected=true;throw Object.assign(Error('NONSECRET'),{code:'EIO'});}return result;};
    const value=phase==='writer'?mock.prepare(token):mock.verify(fixture);ciUnknown(value);assert.equal(value.ownedHandlesClosed,false);assert.equal(fs.existsSync(mock.actual(token.base)),true);
    mock.fake.closeSync=original;if(phase==='reader')assert.equal(mock.verify(fixture).outcome,'UNKNOWN');else assert.equal(mock.prepare(token).reason,'CI_SYNTHETIC_BOOTSTRAP_ALREADY_USED_OR_UNKNOWN');
  }
}));


test('mock real/effective UID and GID mismatch is unavailable with zero construction',available,()=>local(parent=>{
  for(const field of ['geteuid','getegid']){
    const mock=ciMock(parent),original=mock.processView[field];mock.processView[field]=()=>original()+1;
    assert.equal(ciUnknown(mock.create()).base,null);assert.deepEqual(fs.readdirSync(parent),[]);
  }
}));

test('mock final observation revalidates root-owned sticky ancestry including group identity',available,()=>local(parent=>{
  const mock=ciMock(parent),fixture=ciPrepared(mock,boot(mock));mock.system.get('/private/tmp').gid+=1n;
  ciUnknown(mock.verify(fixture));mock.system.get('/private/tmp').gid-=1n;assert.equal(mock.verify(fixture).outcome,'UNKNOWN');
}));

test('mock occupied checkout symlink, group-write mode or unowned metadata is preserved without canary creation',available,()=>local(parent=>{
  for(const kind of ['symlink','mode','owner']){
    const privateParent=parent+'/'+kind;fs.mkdirSync(privateParent,{mode:0o700});const mock=ciMock(privateParent),token=boot(mock),base=mock.actual(token.base),checkout=base+'/Checkout 空间';
    if(kind==='symlink'){fs.mkdirSync(base+'/NONSECRET-target',{mode:0o700});fs.symlinkSync(base+'/NONSECRET-target',checkout);}
    else fs.mkdirSync(checkout,{mode:kind==='mode'?0o770:0o700});
    if(kind==='owner'){const original=mock.fake.lstatSync;mock.fake.lstatSync=function(file,...args){const stat=Reflect.apply(original,this,[file,...args]);if(file.endsWith('/Checkout 空间'))stat.uid+=1n;return stat;};}
    ciUnknown(mock.prepare(token));assert.equal(fs.existsSync(base+'/sealed-inputs'),false);assert.equal(fs.lstatSync(checkout).isSymbolicLink(),kind==='symlink');
  }
}));


test('synthetic exchange directories have exact fresh single-marker inventory and independent inodes',available,()=>local(parent=>{
  const fixture=prepared(parent),dirs=[fixture.layout.exchangePartner,fixture.layout.exchangeControlA,fixture.layout.exchangeControlB],inodes=new Set();
  for(const dir of dirs){assert.deepEqual(fs.readdirSync(dir),['identity-canary.txt']);const stat=fs.lstatSync(dir+'/identity-canary.txt');assert.equal(stat.nlink,1);inodes.add(stat.dev+':'+stat.ino);}
  assert.equal(inodes.size,3);assert.equal(verify(fixture).outcome,'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');
}));

test('synthetic exchange inventory refuses preserved extra data and marker aliases',available,()=>local(parent=>{
  for(const fault of ['extra','alias']){
    const fixture=prepared(parent),target=fixture.layout.exchangePartner+'/identity-canary.txt';
    if(fault==='extra')fs.writeFileSync(fixture.layout.exchangePartner+'/NONSECRET-preserved.txt','PRESERVED');
    else fs.linkSync(target,fixture.layout.exchangeControlA+'/NONSECRET-alias.txt');
    unknown(fixture);assert.equal(fs.existsSync(target),true);
  }
}));
