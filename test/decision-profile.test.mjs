import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const moduleUrl=new URL('../src/decision-profile.mjs',import.meta.url).href;
test('opt-in diagnostics preserve concurrent identities and reject payload injection',()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-profile-')),file=path.join(base,'timing');
 try{
 const source=`import {traceBase,traceScope,mark,traceContext} from ${JSON.stringify(moduleUrl)};
 traceBase({generation:'gen',work:'startup'});
 await Promise.all(['request1','request2'].map(request=>traceScope({request,work:'request'},async()=>{
 await new Promise(r=>setTimeout(r,request==='request1'?5:1));mark('test.end');
 })));
 traceScope({request:'https://user:secret@private/path',source:'private'},()=>mark('test.invalid'));
 if(traceContext().request)throw Error('request context leaked');`;
 const env={...process.env,REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:file};
 let result=spawnSync(process.execPath,['--input-type=module','-e',source],{env,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const raw=fs.readFileSync(file,'utf8'),rows=raw.trim().split('\n').map(s=>JSON.parse(s.slice('REDUE_TIMING '.length)));
 assert.deepEqual(rows.slice(0,2).map(r=>r.request).sort(),['request1','request2']);
 assert(rows.every(r=>r.generation==='gen'&&/^\d+$/.test(r.monoNs)));
 assert(!raw.includes('secret'));assert(!raw.includes('private'));assert(!rows.at(-1).request);
 fs.unlinkSync(file);result=spawnSync(process.execPath,['--input-type=module','-e',source],{env:{...env,REDUE_DECISION_PROFILE:'0'},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert(!fs.existsSync(file));
 result=spawnSync(process.execPath,['--input-type=module','-e',source],{env:{...env,REDUE_DECISION_PROFILE_FILE:base},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
