import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {writeControlledPortableGuidance} from './acceptance/portable-controlled-guidance.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
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

test('preview makes no writes; both hosts load identical installed policy and explicit state route',t=>{
  const f=fixture(t),p=writeControlledPortableGuidance(options(f));
  assert.equal(p.applied,false);assert.equal(p.model_launches,0);assert.equal(p.behavioral_verification,false);
  for(const file of p.files)assert(!fs.existsSync(path.join(f.root,file)));
  const r=writeControlledPortableGuidance(options(f,{apply:true}));assert.equal(r.applied,true);
  const guide=fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8');
  assert(guide.startsWith(fs.readFileSync(f.policyFile,'utf8')));
  assert.match(guide,/--config 'redue.config.json' --state-dir '\.\.\/redue-state' status --sync --json/);
  assert.equal(guide.includes('run typecheck --portable'),false);
  assert.equal(fs.readFileSync(path.join(f.root,'AGENTS.md'),'utf8'),fs.readFileSync(path.join(f.root,'CLAUDE.md'),'utf8'));
  assert(!guide.includes(f.base));
  assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})),{code:'CONTROLLED_GUIDANCE_EXISTS'});
});

test('producer selects capture explicitly without changing the copied shared policy or receiver behavior',t=>{
  const f=fixture(t);writeControlledPortableGuidance(options(f,{role:'producer',hosts:['copilot'],apply:true}));
  const guide=fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8');
  assert(guide.startsWith(fs.readFileSync(f.policyFile,'utf8')));assert.match(guide,/run typecheck --portable/);
  assert.match(guide,/Export, import and trust\nremain separate owner operations/);
  assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
});

test('existing or edited instructions are never overwritten; failed preview launches no model',t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.root,'CLAUDE.md'),'Owner text.\n');
  for(const apply of [false,true])assert.throws(()=>writeControlledPortableGuidance(options(f,{apply})),{code:'CONTROLLED_GUIDANCE_EXISTS'});
  assert.equal(fs.readFileSync(path.join(f.root,'CLAUDE.md'),'utf8'),'Owner text.\n');
  assert(!fs.existsSync(path.join(f.root,'AGENTS.md')));assert(!fs.existsSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md')));
});

test('wrong policy identity, role, selected state owner and enclosing Git root fail closed',t=>{
  const f=fixture(t);
  for(const extra of [{policySha256:'0'.repeat(64)},{role:'any'},{hosts:['codex']},{apply:'yes'}, {approved:true}, {policyFile:path.join(f.base,'artifact.md')}])
    assert.throws(()=>writeControlledPortableGuidance(options(f,extra)));
  fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',root:f.root,state:f.state,config:'different'}));
  assert.throws(()=>writeControlledPortableGuidance(options(f)));
  for(const name of ['AGENTS.md','CLAUDE.md','REDUE_PORTABLE_AGENT.md'])assert(!fs.existsSync(path.join(f.root,name)));
});

test('nested repository without its own .git directory, symlink targets and unsafe owner directories are refused',t=>{
  const f=fixture(t),git=path.join(f.root,'.git');fs.rmdirSync(git);
  assert.throws(()=>writeControlledPortableGuidance(options(f)));
  fs.symlinkSync(f.prefix,git,'dir');assert.throws(()=>writeControlledPortableGuidance(options(f)));fs.unlinkSync(git);fs.mkdirSync(git);
  fs.symlinkSync(path.join(f.base,'absent'),path.join(f.root,'AGENTS.md'));assert.throws(()=>writeControlledPortableGuidance(options(f)),{code:'CONTROLLED_GUIDANCE_EXISTS'});
  fs.unlinkSync(path.join(f.root,'AGENTS.md'));fs.chmodSync(f.state,0o777);assert.throws(()=>writeControlledPortableGuidance(options(f)));
});

test('state ownership changes at publication trigger refusal and only owned destination cleanup',t=>{
  const f=fixture(t),original=fs.fsyncSync;let mutated=false;
  fs.fsyncSync=function(fd){original(fd);if(!mutated){mutated=true;fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),'{}');}};
  try{assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})),{code:'CONTROLLED_GUIDANCE_CHANGED'});}
  finally{fs.fsyncSync=original;}
  assert(mutated);for(const name of ['AGENTS.md','CLAUDE.md','REDUE_PORTABLE_AGENT.md'])assert(!fs.existsSync(path.join(f.root,name)));
});

test('a concurrently edited created instruction is left intact after failed publication',t=>{
  const f=fixture(t),original=fs.fsyncSync;let mutated=false;
  fs.fsyncSync=function(fd){original(fd);if(!mutated){mutated=true;
    fs.writeFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'Concurrent owner edit.\n');
    fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),'{}');}};
  try{assert.throws(()=>writeControlledPortableGuidance(options(f,{apply:true})));}
  finally{fs.fsyncSync=original;}
  assert.equal(fs.readFileSync(path.join(f.root,'REDUE_PORTABLE_AGENT.md'),'utf8'),'Concurrent owner edit.\n');
  assert(!fs.existsSync(path.join(f.root,'AGENTS.md')));assert(!fs.existsSync(path.join(f.root,'CLAUDE.md')));
});
