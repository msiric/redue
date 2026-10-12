import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sealedPreparationProfile} from './acceptance/sealed-typescript-preparation-profile.mjs';
const supported={skip:process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'?'Unsupported preparation constructor host':false};
function fixture(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-preparation-profile-'))),
  source=path.join(base,'input café'),parent=path.join(base,'stage private');
  fs.mkdirSync(source);fs.mkdirSync(parent,{mode:0o700});
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return{source,parent};}
test('fixed profile confines source/body/code reads and stage writes with no model or authority',supported,t=>{
  const {source,parent}=fixture(t),proposal=sealedPreparationProfile({source,parent});
  assert.match(proposal.profile,/\(deny default\)/);
  assert(!proposal.profile.includes('network'));assert(!proposal.profile.includes('mach-lookup'));
  assert(!proposal.profile.includes('(allow file-read*)'));
  assert.match(proposal.profile,/\(allow file-write\* \(subpath/);
  assert.equal(proposal.sealed,false);assert.equal(proposal.reuseEligible,false);
  assert.equal(proposal.code.length,5);assert(proposal.code.every(([,sha])=>/^[0-9a-f]{64}$/.test(sha)));
  assert.equal(proposal.preparationEnvironment,'empty-no-authentication-no-model-no-project-code');
  assert.deepEqual(fs.readdirSync(parent),[],'profile construction does not prepare or execute');
});
test('preparation proposal refuses aliases, occupied parents and case-alias nesting',supported,t=>{
  const {source,parent}=fixture(t);
  fs.writeFileSync(path.join(parent,'present'),'NONSECRET fixture');
  assert.throws(()=>sealedPreparationProfile({source,parent}),{code:'PREPARATION_PARENT_OCCUPIED'});
  fs.unlinkSync(path.join(parent,'present'));fs.symlinkSync(source,source+' alias');
  assert.throws(()=>sealedPreparationProfile({source:source+' alias',parent}),{code:'PREPARATION_PATH'});
  const nested=path.join(source,'stage');fs.mkdirSync(nested,{mode:0o700});
  assert.throws(()=>sealedPreparationProfile({source,parent:nested}),{code:'PREPARATION_PLACEMENT'});
  const alias=source.replace('input café','INPUT café');
  if(fs.existsSync(alias))assert.throws(()=>sealedPreparationProfile({source,parent:path.join(alias,'stage')}),{code:'PREPARATION_PLACEMENT'});
});
test('constructor cannot accept an arbitrary executor or getters',()=>{
  let read=false;assert.throws(()=>sealedPreparationProfile({get source(){read=true;return '/';},parent:'/'}),{code:'PREPARATION_OPTIONS'});
  assert.equal(read,false);
  assert.throws(()=>sealedPreparationProfile({source:'/',parent:'/',child:'/bin/sh'}),{code:'PREPARATION_OPTIONS'});
});
