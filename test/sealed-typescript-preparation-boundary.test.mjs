// Real local sandbox-exec observations for the PREPARER ONLY. These are not
// Claude/Copilot enforcement, compiler executions or portable acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {sealedPreparationProfile} from './acceptance/sealed-typescript-preparation-profile.mjs';
const supported={skip:process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'?'No reviewed local preparer sandbox host':false};
function fixture(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-preparation-boundary-'))),
  source=path.join(base,'source café'),parent=path.join(base,'private-stage'),outside=path.join(base,'outside');
  fs.mkdirSync(source);fs.mkdirSync(parent,{mode:0o700});fs.mkdirSync(outside);
  fs.writeFileSync(path.join(source,'a.ts'),'export const a = 1;\n');
  fs.writeFileSync(path.join(outside,'canary'),'NONSECRET outside-body control');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return{base,source,parent,outside};}
function output(child){
  // Never surface raw child stderr or body data, even on assertion failure.
  assert(child.status===0,'PREPARATION_STARTUP_OR_CHILD_FAILED_UNKNOWN');
  assert(child.signal===null,'PREPARATION_CHILD_SIGNAL_UNKNOWN');
  assert(child.error===undefined,'PREPARATION_LAUNCH_ERROR_UNKNOWN');
  assert(child.stderr==='','PREPARATION_UNEXPECTED_STDERR_UNKNOWN');
  let result;try{result=JSON.parse(child.stdout);}catch{assert.fail('PREPARATION_OUTPUT_PARSE_UNKNOWN');}
  assert(result&&typeof result==='object'&&!Array.isArray(result),'PREPARATION_OUTPUT_SCHEMA_UNKNOWN');return result;
}
test('fixed child materializes ordinary owned input under the restrictive preparation profile',supported,t=>{
  const f=fixture(t),proposal=sealedPreparationProfile({source:f.source,parent:f.parent}),file=path.join(f.source,'a.ts'),
    bytes=fs.readFileSync(file),digest=createHash('sha256').update(bytes).digest('hex'),
    typed=createHash('sha256').update(`file:${fs.lstatSync(file,{bigint:true}).mode}:${digest}`).digest('hex');
  const result=output(spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:f.parent,env:{},input:JSON.stringify({root:f.source,parent:f.parent,manifest:[['a.ts',typed]]}),
      encoding:'utf8',timeout:5000,maxBuffer:8*1024*1024}));
  assert.equal(result.ok,true);assert.equal(result.materialization.sealed,false);assert.equal(result.materialization.reuseEligible,false);
  assert(fs.readFileSync(path.join(result.materialization.root,'a.ts')).equals(bytes));
});
test('restricted fixed child copies a complete source hardlink group into independent single-link files',supported,t=>{
  const f=fixture(t),names=['node_modules/tool/a','node_modules/tool/b'];
  fs.mkdirSync(path.join(f.source,'node_modules/tool'),{recursive:true});
  const first=path.join(f.source,names[0]);fs.writeFileSync(first,'NONSECRET complete hardlink input');
  fs.linkSync(first,path.join(f.source,names[1]));
  const sourceStat=fs.lstatSync(first,{bigint:true}),hash=v=>createHash('sha256').update(v).digest('hex'),
    content=hash(fs.readFileSync(first)),typed=hash(`file:${sourceStat.mode}:${sourceStat.nlink}:${content}`),
    proposal=sealedPreparationProfile({source:f.source,parent:f.parent});
  const result=output(spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:f.parent,env:{},input:JSON.stringify({root:f.source,parent:f.parent,manifest:names.map(name=>[name,typed])}),
      encoding:'utf8',timeout:5000,maxBuffer:8*1024*1024}));
  assert.equal(result.schema,3);assert.equal(result.ok,true);
  const summary=result.materialization;
  assert.equal(summary.sourceAliasGroupCount,1);assert.equal(summary.sourceAliasEntryCount,2);
  assert.notEqual(summary.sourceManifestDigest,summary.materializedManifestDigest);
  assert.equal(summary.sealed,false);assert.equal(summary.reuseEligible,false);
  const copies=names.map(name=>fs.lstatSync(path.join(summary.root,name),{bigint:true}));
  assert(copies.every(stat=>stat.nlink===1n&&stat.ino!==sourceStat.ino));assert.notEqual(copies[0].ino,copies[1].ino);
});
test('a missing source hardlink entry refuses before any stage under the actual restricted child',supported,t=>{
  const f=fixture(t),file=path.join(f.source,'a.ts');fs.linkSync(file,path.join(f.outside,'unlisted-link'));
  const stat=fs.lstatSync(file,{bigint:true}),hash=v=>createHash('sha256').update(v).digest('hex'),
    typed=hash(`file:${stat.mode}:${hash(fs.readFileSync(file))}`),
    proposal=sealedPreparationProfile({source:f.source,parent:f.parent});
  const child=spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:f.parent,env:{},input:JSON.stringify({root:f.source,parent:f.parent,manifest:[['a.ts',typed]]}),
      encoding:'utf8',timeout:5000,maxBuffer:8*1024*1024});
  assert(child.status===74&&child.signal===null&&!child.error&&child.stderr==='', 'EXPECTED_BOUNDED_REFUSAL');
  let result;try{result=JSON.parse(child.stdout);}catch{assert.fail('EXPECTED_STATIC_REFUSAL_FRAME');}
  assert.deepEqual(result,{schema:3,ok:false,reason_code:'TREE_FILE'});assert.deepEqual(fs.readdirSync(f.parent),[]);
});
test('resolved alias cannot read an outside body and prep cannot write source or outside',supported,t=>{
  const f=fixture(t);fs.symlinkSync(f.outside,path.join(f.source,'alias'));
  const proposal=sealedPreparationProfile({source:f.source,parent:f.parent});
  // Controlled code asks only these nonsecret owned fixture questions. It never
  // prints body values. This probes the profile, not the fixed child's authority.
  const code=`import fs from 'node:fs';const p=JSON.parse(process.argv[1]);
    const denied=f=>{try{f();return 'UNEXPECTED_ACCESS';}catch(e){return ['EPERM','EACCES'].includes(e.code)?'DENIED': 'OTHER_ERROR';}};
    const r={scope:'LOCAL_PREPARER_BOUNDARY_ONLY',
      sourceRead:fs.readFileSync(p.source+'/a.ts','utf8')==='export const a = 1;\\n',
      outsideRead:denied(()=>fs.readFileSync(p.outside+'/canary')),
      aliasOutsideRead:denied(()=>fs.readFileSync(p.source+'/alias/canary')),
      sourceWrite:denied(()=>fs.writeFileSync(p.source+'/a.ts','changed')),
      outsideWrite:denied(()=>fs.writeFileSync(p.outside+'/new','NONSECRET'))};
    fs.writeFileSync(p.parent+'/owned-output','NONSECRET');r.stageWrite=true;console.log(JSON.stringify(r));`;
  const result=output(spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,'--input-type=module','-e',code,JSON.stringify(f)],
    {cwd:f.parent,env:{},encoding:'utf8',timeout:5000,maxBuffer:65536}));
  assert.equal(result.sourceRead,true);assert.equal(result.stageWrite,true);
  for(const key of ['outsideRead','aliasOutsideRead','sourceWrite','outsideWrite'])assert.equal(result[key],'DENIED');
  assert.equal(fs.readFileSync(path.join(f.source,'a.ts'),'utf8'),'export const a = 1;\n');
  assert(!fs.existsSync(path.join(f.outside,'new')));
});
