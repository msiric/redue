import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {writeControlledPortableGuidance,inspectControlledPortableGuidance} from './acceptance/portable-controlled-guidance.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const fixtureTest=(name,fn)=>test(name,{skip:process.platform==='win32'?'POSIX ownership fixture; matched macOS proposal only':false},fn);
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-guidance-')));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const root=path.join(base,'Checkout 空间'),state=path.join(base,'redue-state'),prefix=path.join(base,'prefix');
  for(const dir of [root,state,prefix,path.join(root,'.git')])fs.mkdirSync(dir,{mode:0o700});
  const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,{mode:0o600});};
  put(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'typecheck',qualification:'npm-typescript-direct-v1'}]}));
  put(path.join(state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',config:path.join(state,'project-runtime-v1.json'),root,state}));
  const policyFile=path.join(prefix,'lib/node_modules/@redue/cli/src/agent-policy.md');
  const policy=fs.readFileSync(new URL('../src/agent-policy.md',import.meta.url));put(policyFile,policy);
  return {base,root,state,prefix,policyFile,policySha256:sha(policy),hosts:['copilot','claude'],role:'receiver'};
}
function options(f,extra={}){const {base,...selected}=f;return {...selected,...extra};}

fixtureTest('preview makes no writes; both hosts reference same policy and Claude imports it locally',t=>{
  const f=fixture(t),p=writeControlledPortableGuidance(options(f));
  assert.equal(p.applied,false);assert.equal(p.model_launches,0);assert.equal(p.behavioral_verification,false);
  for(const file of p.files)assert(!fs.existsSync(path.join(f.root,file)));
  const r=writeControlledPortableGuidance(options(f,{apply:true}));assert.equal(r.applied,true);
  const guide=fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8');
  assert(guide.startsWith(fs.readFileSync(f.policyFile,'utf8')));
  assert.match(guide,/--config 'redue.config.json' --state-dir '\.\.\/redue-state' status --sync --json/);
  assert.equal(guide.includes('run typecheck --portable'),false);
  const copilot=fs.readFileSync(path.join(f.root,'AGENTS.md'),'utf8'),claude=fs.readFileSync(path.join(f.root,'CLAUDE.md'),'utf8');
  assert.equal(claude,copilot+'\n@REDUE_PORTABLE_AGENT.md\n');
  assert.equal(copilot.includes('@REDUE_PORTABLE_AGENT.md'),false);
  assert.match(claude,/^@REDUE_PORTABLE_AGENT\.md$/m);
  assert.equal(claude.includes('```'),false);assert.equal(claude.includes(f.base),false);
  assert(!guide.includes(f.base));
  assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})),{code:'CONTROLLED_GUIDANCE_EXISTS'});
});

fixtureTest('producer selects capture explicitly without changing the copied shared policy or receiver behavior',t=>{
  const f=fixture(t);writeControlledPortableGuidance(options(f,{role:'producer',hosts:['copilot'],apply:true}));
  const guide=fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8');
  assert(guide.startsWith(fs.readFileSync(f.policyFile,'utf8')));assert.match(guide,/run typecheck --portable/);
  assert.match(guide,/Export, import and trust\nremain separate owner operations/);
  assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
});

fixtureTest('existing or edited instructions are never overwritten; failed preview launches no model',t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.root,'CLAUDE.md'),'Owner text.\n');
  for(const apply of [false,true])assert.throws(()=>writeControlledPortableGuidance(options(f,{apply})),{code:'CONTROLLED_GUIDANCE_EXISTS'});
  assert.equal(fs.readFileSync(path.join(f.root,'CLAUDE.md'),'utf8'),'Owner text.\n');
  assert(!fs.existsSync(path.join(f.root,'AGENTS.md')));assert(!fs.existsSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md')));
});

fixtureTest('wrong policy identity, role, selected state owner and enclosing Git root fail closed',t=>{
  const f=fixture(t);
  for(const extra of [{policySha256:'0'.repeat(64)},{role:'any'},{hosts:['codex']},{apply:'yes'}, {approved:true}, {policyFile:path.join(f.base,'artifact.md')},
    {prefix:f.root,policyFile:path.join(f.root,'lib/node_modules/@redue/cli/src/agent-policy.md')},{root:f.state}])
    assert.throws(()=>writeControlledPortableGuidance(options(f,extra)));
  fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',root:f.root,state:f.state,config:'different'}));
  assert.throws(()=>writeControlledPortableGuidance(options(f)));
  for(const name of ['AGENTS.md','CLAUDE.md','REDUE_PORTABLE_AGENT.md'])assert(!fs.existsSync(path.join(f.root,name)));
});

fixtureTest('byte-identical owner replacement is an interval change, not continuing ownership',t=>{
  const f=fixture(t),original=fs.fsyncSync,owner=path.join(f.state,'vstate-owner-v1.json');let changed=false;
  fs.fsyncSync=function(fd){original(fd);if(!changed){changed=true;const replacement=path.join(f.state,'replacement.json');
    fs.writeFileSync(replacement,fs.readFileSync(owner));fs.renameSync(replacement,owner);}};
  try{assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})),{code:'CONTROLLED_GUIDANCE_CHANGED'});}
  finally{fs.fsyncSync=original;}
  assert(changed);assert(!fs.existsSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md')));
});

fixtureTest('nested repository without its own .git directory, symlink targets and unsafe owner directories are refused',t=>{
  const f=fixture(t),git=path.join(f.root,'.git');fs.rmdirSync(git);
  assert.throws(()=>writeControlledPortableGuidance(options(f)));
  fs.symlinkSync(f.prefix,git,'dir');assert.throws(()=>writeControlledPortableGuidance(options(f)));fs.unlinkSync(git);fs.mkdirSync(git);
  fs.symlinkSync(path.join(f.base,'absent'),path.join(f.root,'AGENTS.md'));assert.throws(()=>writeControlledPortableGuidance(options(f)),{code:'CONTROLLED_GUIDANCE_EXISTS'});
  fs.unlinkSync(path.join(f.root,'AGENTS.md'));fs.chmodSync(f.state,0o777);assert.throws(()=>writeControlledPortableGuidance(options(f)));
});

fixtureTest('state ownership changes at publication trigger refusal and only owned destination cleanup',t=>{
  const f=fixture(t),original=fs.fsyncSync;let mutated=false;
  fs.fsyncSync=function(fd){original(fd);if(!mutated){mutated=true;fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),'{}');}};
  try{assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})),{code:'CONTROLLED_GUIDANCE_CHANGED'});}
  finally{fs.fsyncSync=original;}
  assert(mutated);for(const name of ['AGENTS.md','CLAUDE.md','REDUE_PORTABLE_AGENT.md'])assert(!fs.existsSync(path.join(f.root,name)));
});

fixtureTest('a concurrently edited created instruction is left intact after failed publication',t=>{
  const f=fixture(t),original=fs.fsyncSync;let mutated=false;
  fs.fsyncSync=function(fd){original(fd);if(!mutated){mutated=true;
    fs.writeFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'Concurrent owner edit.\n');
    fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),'{}');}};
  try{assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})));}
  finally{fs.fsyncSync=original;}
  assert.equal(fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8'),'Concurrent owner edit.\n');
  assert(!fs.existsSync(path.join(f.root,'AGENTS.md')));assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
});

test('controlled matched-mac guidance refuses unsupported Windows before touching files',
  {skip:process.platform!=='win32'?'Native Windows branch only':false},()=>{
    assert.throws(()=>writeControlledPortableGuidance({}),{code:'CONTROLLED_GUIDANCE_UNSUPPORTED'});
  });

function inspectorFixture(t){
  const f=fixture(t);fs.writeFileSync(path.join(f.state,'project-runtime-v1.json'),JSON.stringify({schema:1,provider:'declared-project@1',root:f.root,state:f.state,checks:[]}),{mode:0o600});return f;
}
fixtureTest('read-only inspection validates exact controlled files without claiming managed installation or host loading',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const before=new Map([['REDUE_PORTABLE_AGENT.md',null],['AGENTS.md',null],['CLAUDE.md',null]].map(([name])=>[name,fs.readFileSync(path.join(f.root,name))]));
  const result=inspectControlledPortableGuidance(selected);
  assert.equal(result.mechanism,'controlled-generic-project-instructions');assert.equal(result.integrity,'intact');
  assert.equal(result.policy_sha256,f.policySha256);assert.equal(result.config_sha256,sha(fs.readFileSync(path.join(f.root,'redue.config.json'))));
  assert.equal(result.owner_sha256,sha(fs.readFileSync(path.join(f.state,'vstate-owner-v1.json'))));
  assert.equal(result.behavior_verified,false);assert.equal(result.behavioral_verification,false);assert.equal(result.model_launches,0);
  assert.equal(Object.hasOwn(result,'installed'),false);assert.equal(Object.hasOwn(result,'ready'),false);assert.equal(Object.hasOwn(result,'reuse_eligible'),false);
  assert.deepEqual(result.route,{config:'redue.config.json',state:'../redue-state',check:'typecheck'});
  assert(Object.isFrozen(result));assert(Object.isFrozen(result.files));assert(Object.isFrozen(result.bindings));
  assert.deepEqual(Object.keys(result.bindings.directories),['root','state','prefix','git']);
  for(const digest of [...Object.values(result.bindings.directories),...Object.values(result.bindings.files)])assert.match(digest,/^[a-f0-9]{64}$/);
  assert(!JSON.stringify(result).includes(f.base));assert(!JSON.stringify(result).includes('This controlled project'));
  for(const item of result.files){assert.equal(item.sha256,sha(before.get(item.path)));assert(fs.readFileSync(path.join(f.root,item.path)).equals(before.get(item.path)));}
  assert.equal(fs.existsSync(path.join(f.root,'.redue')),false,'Generic validation never creates a managed ownership record');
  assert.equal(fs.existsSync(path.join(f.root,'.claude')),false);
});
fixtureTest('inspection refuses boolean overrides, unknown options and missing or edited controlled bytes',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  for(const extra of [{apply:false},{apply:true},{installed:true},{approved:true},{ready:true},{behavior_verified:true}])
    assert.throws(()=>inspectControlledPortableGuidance({...selected,...extra}),{code:'CONTROLLED_GUIDANCE_INVALID'});
  for(const name of ['CLAUDE.md','AGENTS.md','REDUE_PORTABLE_AGENT.md']){
    const file=path.join(f.root,name),bytes=fs.readFileSync(file);
    fs.appendFileSync(file,'Owner edit.\n');assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_CONTENT'});
    fs.writeFileSync(file,bytes);fs.renameSync(file,file+'.missing');assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'ENOENT'});fs.renameSync(file+'.missing',file);
  }
});
fixtureTest('inspection binds actual selected state owner/config/policy and does not bless an unrelated role',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  assert.throws(()=>inspectControlledPortableGuidance({...selected,policySha256:'0'.repeat(64)}),{code:'CONTROLLED_GUIDANCE_INVALID'});
  assert.throws(()=>inspectControlledPortableGuidance({...selected,role:'producer'}),{code:'CONTROLLED_GUIDANCE_CONTENT'});
  const owner=path.join(f.state,'vstate-owner-v1.json'),original=fs.readFileSync(owner);
  fs.writeFileSync(owner,JSON.stringify({schema:1,kind:'vstate-product-alpha',root:f.root,state:f.state,config:'wrong'}));
  assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_INVALID'});fs.writeFileSync(owner,original);
  const config=path.join(f.root,'redue.config.json'),before=fs.readFileSync(config);fs.writeFileSync(config,JSON.stringify({schema:1,checks:[]}));
  assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_INVALID'});fs.writeFileSync(config,before);
});
fixtureTest('inspection rejects unsafe linked/nonregular instructions and unsafe writable sources',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const file=path.join(f.root,'CLAUDE.md'),original=fs.readFileSync(file);fs.renameSync(file,file+'.old');
  fs.symlinkSync(file+'.old',file);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'PORTABLE_FILE_UNSAFE'});fs.unlinkSync(file);
  fs.linkSync(file+'.old',file);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'PORTABLE_FILE_UNSAFE'});fs.unlinkSync(file);
  fs.mkdirSync(file);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'PORTABLE_FILE_UNSAFE'});fs.rmdirSync(file);fs.writeFileSync(file,original,{mode:0o600});
  fs.chmodSync(file,0o620);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_UNSAFE'});fs.chmodSync(file,0o600);
  fs.chmodSync(f.policyFile,0o666);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_UNSAFE'});
});
fixtureTest('replacement during read-only validation fails even for byte-identical restored guidance',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const file=path.join(f.root,'CLAUDE.md'),original=fs.readSync;let replaced=false;
  fs.readSync=function(fd,...args){const count=original(fd,...args);if(!replaced&&fs.fstatSync(fd).ino===fs.statSync(file).ino&&fs.fstatSync(fd).dev===fs.statSync(file).dev){replaced=true;fs.renameSync(file,file+'.old');fs.copyFileSync(file+'.old',file);}return count;};
  try{assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'PORTABLE_FILE_CHANGED'});}finally{fs.readSync=original;}
  assert(replaced);
});

fixtureTest('physical report detects same-byte file and root replacements across separate readonly inspections',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const before=inspectControlledPortableGuidance(selected),file=path.join(f.root,'CLAUDE.md'),bytes=fs.readFileSync(file);
  fs.renameSync(file,file+'.old');fs.writeFileSync(file,bytes,{mode:0o600});
  const after=inspectControlledPortableGuidance(selected);assert.equal(before.files.find(x=>x.path==='CLAUDE.md').sha256,after.files.find(x=>x.path==='CLAUDE.md').sha256);
  assert.notEqual(before.bindings.files['CLAUDE.md'],after.bindings.files['CLAUDE.md']);
  fs.renameSync(path.join(f.root,'.git'),path.join(f.root,'.git.old'));fs.mkdirSync(path.join(f.root,'.git'),{mode:0o700});
  const changed=inspectControlledPortableGuidance(selected);assert.notEqual(after.bindings.directories.git,changed.bindings.directories.git);
  fs.writeFileSync(path.join(f.state,'ordinary-observer-file'),'normal observer activity');
  assert.deepEqual(inspectControlledPortableGuidance(selected).bindings,changed.bindings,'Directory content churn alone is not changed authority');
});

fixtureTest('inspection requires compiled runtime without turning metadata into compiler eligibility',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const file=path.join(f.state,'project-runtime-v1.json'),original=fs.readFileSync(file),runtime=JSON.parse(original);
  for(const changed of [{...runtime,schema:2},{...runtime,provider:'unknown'},{...runtime,root:f.state},{...runtime,state:f.root}]){
    fs.writeFileSync(file,JSON.stringify(changed));assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_RUNTIME'});
  }
  fs.writeFileSync(file,original);const before=inspectControlledPortableGuidance(selected);
  assert.equal(before.runtime_sha256,sha(original));assert.match(before.bindings.files.runtime,/^[a-f0-9]{64}$/);
  fs.renameSync(file,file+'.old');fs.writeFileSync(file,original,{mode:0o600});
  const after=inspectControlledPortableGuidance(selected);assert.equal(after.runtime_sha256,before.runtime_sha256);assert.notEqual(after.bindings.files.runtime,before.bindings.files.runtime);
  fs.unlinkSync(file);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'ENOENT'});
});

fixtureTest('Claude import is exact local data; old pointer-only or external import never gains intact authority',t=>{
  const f=inspectorFixture(t),selected=options(f);writeControlledPortableGuidance({...selected,apply:true});
  const claude=path.join(f.root,'CLAUDE.md'),bytes=fs.readFileSync(claude,'utf8'),copilot=fs.readFileSync(path.join(f.root,'AGENTS.md'));
  const policy=fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'));
  for(const changed of [bytes.replace('\n@REDUE_PORTABLE_AGENT.md\n',''),bytes.replace('@REDUE_PORTABLE_AGENT.md','@../unapproved.md'),bytes.replace('@REDUE_PORTABLE_AGENT.md','@https://unapproved.invalid/policy')]){
    fs.writeFileSync(claude,changed);assert.throws(()=>inspectControlledPortableGuidance(selected),{code:'CONTROLLED_GUIDANCE_CONTENT'});
    assert.throws(()=>writeControlledPortableGuidance({...selected,apply:false}),{code:'CONTROLLED_GUIDANCE_EXISTS'});
    assert.equal(fs.readFileSync(claude,'utf8'),changed,'Existing edited instructions are never repaired silently');
  }
  fs.writeFileSync(claude,bytes);assert.equal(inspectControlledPortableGuidance(selected).integrity,'intact');
  assert(fs.readFileSync(path.join(f.root,'AGENTS.md')).equals(copilot));assert(fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md')).equals(policy));
});
