// Actual native runtime inspection; no compiler run, model, trust or remote job.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const supported=process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&os.release()==='25.6.0';
test('portable runtime profiling preserves actual content facts and emits bounded private-free counts',
 {skip:!supported?'Actual reviewed native runtime required':false,timeout:45000},t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-profile-'))),file=path.join(base,'timing');
  fs.chmodSync(base,0o700);t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const module=new URL('../src/portable-runtime.mjs',import.meta.url).href;
  const source=`import {portableRuntime} from ${JSON.stringify(module)};console.log(JSON.stringify(portableRuntime()));`;
  const env={...process.env,REDUE_DECISION_PROFILE:'0',REDUE_DECISION_PROFILE_FILE:file,
   REDUE_PROFILE_CONTEXT:JSON.stringify({request:'https://user:secret@private.invalid/path'}),
   REDUE_PRIVATE_CANARY:'private-environment-data'};
  function call(extra){const r=spawnSync(process.execPath,['--input-type=module','-e',source],
    {env:{...env,...extra},encoding:'utf8',timeout:12000,maxBuffer:1024*1024});
    assert.ifError(r.error);assert.equal(r.signal,null);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
  const plain=call({});assert(!fs.existsSync(file));
  const profiled=call({REDUE_DECISION_PROFILE:'1'});assert.deepEqual(profiled,plain);
  const raw=fs.readFileSync(file,'utf8');assert(Buffer.byteLength(raw)<65536);
  for(const secret of ['secret','private.invalid','private-environment-data',base])assert(!raw.includes(secret));
  const rows=raw.trim().split('\n').map(line=>JSON.parse(line.replace(/^REDUE_TIMING /,'')));
  assert(rows.length>10&&rows.length<=200);
  assert(rows.every(row=>/^(?:portable_runtime|portable_cache)\.[a-z_]+$/.test(row.phase)&&/^\d+$/.test(row.monoNs)&&!row.request));
  const members=rows.find(row=>row.phase==='portable_cache.members'),complete=rows.find(row=>row.phase==='portable_cache.complete');
  assert(members.members>0&&members.members<=33);assert(members.totalBytes>0&&members.totalBytes<=12*1024**3);
  assert.equal(complete.totalBytes,members.totalBytes);assert.equal(complete.members,members.members);
  const ended=rows.filter(row=>row.phase==='portable_cache.member_complete');assert.equal(ended.length,members.members);
  assert.equal(ended.at(-1).completedBytes,members.totalBytes);
  assert(ended.every((row,i)=>row.member===i&&row.readMs>=0&&row.hashMs>=0));
  // An unusable optional output destination cannot repair or change facts.
  assert.deepEqual(call({REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:base}),plain);
 });
