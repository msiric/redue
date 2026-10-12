import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {readAncestorObservationCapability,ancestorObservationCapabilityCurrent} from '../src/portable-ancestor-capability.mjs';
function fixture(t){
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ancestor-cap-')));fs.chmodSync(base,0o700);
 t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'checkout'),state=path.join(base,'redue-state'),authority=path.join(base,'authority');
 for(const file of [root,state,authority])fs.mkdirSync(file,{mode:0o700});
 const id=file=>{const s=fs.statSync(file,{bigint:true});return [String(s.dev),String(s.ino)];};
 const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'msiric/redue',RUNNER_OS:'macOS',GITHUB_REF:'refs/heads/dev/portable-ordinary-boundary',GITHUB_SHA:'a'.repeat(40),GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1'};
 const value={schema:1,interpretation:'redue-ci-ancestor-observation@1',repository:'msiric/redue',ref:env.GITHUB_REF,
  source:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID,attempt:1,root,state,rootIdentity:id(root),stateIdentity:id(state),
  scope:'locally-derived-ancestor-npm-resolution-only',retention:'scope-ids-and-serials-only'};
 const file=path.join(authority,'scope.json');fs.writeFileSync(file,JSON.stringify(value),{mode:0o600});
 return {base,root,state,file,env,value,options:{root,state,env}};
}
const native=process.platform==='darwin'&&process.arch==='arm64';
test('environment labels and imported lookalike objects cannot grant observation scope',()=>{
 assert.equal(ancestorObservationCapabilityCurrent({interpretation:'redue-ci-ancestor-observation@1',scope:'a'.repeat(64)}),false);
 assert.throws(()=>readAncestorObservationCapability('/absent/owner-capability',{root:'/absent/root',state:'/absent/state',env:{}}));
});
test('synthetic owned capability binds exact local resources and current immutable provisioning', {skip:!native},t=>{
 // Static filesystem controls only. No watcher starts or real CI authority is claimed.
 const f=fixture(t),token=readAncestorObservationCapability(f.file,f.options);
 assert(ancestorObservationCapabilityCurrent(token));
 fs.writeFileSync(f.file,JSON.stringify({...f.value,runId:'456'}));assert.equal(ancestorObservationCapabilityCurrent(token),false);
});
test('writable, linked, oversized, outside-scope and obsolete provisioning fail closed', {skip:!native},t=>{
 for(const fault of ['writable','hardlink','symlink','oversize','old-source','wrong-root','under-checkout','under-state','changed-state']){
  const f=fixture(t);let file=f.file;
  if(fault==='writable')fs.chmodSync(file,0o644);
  if(fault==='hardlink')fs.linkSync(file,path.join(f.base,'duplicate'));
  if(fault==='symlink'){file=path.join(f.base,'alias');fs.symlinkSync(f.file,file);}
  if(fault==='oversize')fs.writeFileSync(file,' '.repeat(8193));
  if(fault==='old-source')fs.writeFileSync(file,JSON.stringify({...f.value,source:'b'.repeat(40)}));
  if(fault==='wrong-root')fs.writeFileSync(file,JSON.stringify({...f.value,root:f.state}));
  if(fault==='under-checkout'||fault==='under-state'){file=path.join(fault==='under-checkout'?f.root:f.state,'scope.json');fs.copyFileSync(f.file,file);}
  if(fault==='changed-state'){fs.renameSync(f.state,f.state+'-old');fs.mkdirSync(f.state,{mode:0o700});}
  assert.throws(()=>readAncestorObservationCapability(file,f.options),undefined,fault);
 }
});
test('failed currency irreversibly revokes a token even when the original root is restored', {skip:!native},t=>{
 const f=fixture(t),token=readAncestorObservationCapability(f.file,f.options);
 fs.renameSync(f.root,f.root+'-original');fs.mkdirSync(f.root,{mode:0o700});
 assert.equal(ancestorObservationCapabilityCurrent(token),false);
 fs.rmdirSync(f.root);fs.renameSync(f.root+'-original',f.root);
 assert.equal(ancestorObservationCapabilityCurrent(token),false);
});
