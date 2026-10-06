import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {controlEndpoint} from '../src/control-endpoint.mjs';
import {atomicJson,receiptRevision} from '../src/state-store.mjs';

test('sync and detail refuse legacy or superseded observer receipt selections',async t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rue-'))),
    root=path.join(base,'p'),state=path.join(base,'redue-s');
  fs.mkdirSync(root);fs.mkdirSync(state);
  const config=path.join(state,'runtime.json');
  atomicJson(config,{schema:1,root,state,checks:[{name:'check',environment:{}}]});
  const now=Date.now(),old={schema:1,state:'current',current:1,updated_at:now,expires_at:now+2500,
    observation:{healthy:true},checks:[{name:'check',result:'PASS',freshness:'CURRENT',
      reuse_eligible:true,invocation:{runId:'old'}}]};
  atomicJson(path.join(state,'status.json'),old);
  atomicJson(path.join(state,'receipts-v1.json'),{schema:1,checks:{check:{result:'FAIL',
    stable:false,invocation:{runId:'latest-failure'}}}});
  let response=old;
  const endpoint=controlEndpoint(state),server=net.createServer(client=>{
    client.once('data',data=>{assert.equal(JSON.parse(data).action,'sync');
      client.end(JSON.stringify(response)+'\n');});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(endpoint.address,resolve);});
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));
    fs.rmSync(base,{recursive:true,force:true});});
  const call=action=>new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.resolve('src/cli.mjs'),config,action],
      {cwd:root,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',data=>stdout+=data);
    child.stderr.on('data',data=>stderr+=data);
    const timer=setTimeout(()=>{child.kill();reject(Error('client did not finish'));},5000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});
  });
  for(const revision of [undefined,'superseded']){
    response={...old,...(revision?{receipt_revision:revision}:{})};
    const synced=await call('sync');assert.equal(synced.code,2,synced.stderr);
    const value=JSON.parse(synced.stdout),row=value.checks[0];
    assert.equal(value.observation.healthy,false);assert.equal(row.freshness,'UNVERIFIED');
    assert.equal(row.reuse_eligible,false);assert.equal(row.result,'FAIL');
    assert.equal(row.invocation.runId,'latest-failure');
    assert.match(row.reason,revision?/changed during synchronization/:/stop and start the observer/);
    const detail=await call('detail');assert.equal(detail.code,2,detail.stderr);
    assert.match(detail.stdout,/check: UNVERIFIED\/FAIL/);
  }
  response={...old,receipt_revision:null};
  const unavailable=await call('sync');assert.equal(unavailable.code,0,unavailable.stderr);
  assert.equal(JSON.parse(unavailable.stdout).checks[0].freshness,'UNVERIFIED');
  assert.equal(JSON.parse(unavailable.stdout).checks[0].reuse_eligible,false);
  atomicJson(path.join(state,'receipts-v1.json'),{schema:1,checks:{check:{result:'PASS',
    stable:true,invocation:{runId:'current'}}}});
  response={...old,receipt_revision:receiptRevision(state),checks:[{...old.checks[0],
    invocation:{runId:'current'}}]};
  const valid=await call('sync');assert.equal(valid.code,0,valid.stderr);
  assert.equal(JSON.parse(valid.stdout).checks[0].reuse_eligible,true);
  assert.equal(JSON.parse(valid.stdout).checks[0].invocation.runId,'current');
});
