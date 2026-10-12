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
  assert.equal(child.status,0,'restricted child failed or sandbox did not start');
  assert.equal(child.signal,null);assert.equal(child.error,undefined);
  assert.equal(child.stderr,'');return JSON.parse(child.stdout);
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
