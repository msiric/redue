import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('piped cached JSON completes every configured check beyond pipe capacity',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-output-'))),root=path.join(base,'project'),
    config=path.join(root,'redue.config.json'),state=path.join(base,'redue-owned-state');
  fs.mkdirSync(root);
  t.after(()=>fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}));
  const names=Array.from({length:400},(_,i)=>`check-${i}-Ω`);
  fs.writeFileSync(config,JSON.stringify({schema:1,checks:names.map(name=>({name,
    command:['@node','check.mjs'],inputs:['src/**']}))}));
  const result=spawnSync(process.execPath,[path.resolve('bin/redue.mjs'),'--config',config,
    '--state-dir',state,'status','--json'],{cwd:root,encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);
  assert(Buffer.byteLength(result.stdout)>65536,'Test must exceed ordinary pipe capacity');
  const value=JSON.parse(result.stdout);
  assert.equal(value.schema,1);assert.deepEqual(value.checks.map(check=>check.name),names);
  assert(value.checks.every(check=>check.freshness==='UNVERIFIED'&&check.reuse_eligible===false));
});
