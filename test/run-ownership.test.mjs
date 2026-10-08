import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const bin=path.resolve(process.env.REDUE_UNAVAILABLE_TEST_BIN||'bin/redue.mjs');
test('run refuses missing, malformed or mismatched ownership without executing or replacing evidence',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-run-owner-')),
    root=path.join(base,'project'),state=path.join(base,'redue-state');
  fs.mkdirSync(root);
  assert.equal(spawnSync('git',['init','-q'],{cwd:root}).status,0);
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{
    name:'check',command:['@node','-e',"require('node:fs').appendFileSync('executions','x')"],inputs:['input.txt']
  }]}));
  fs.writeFileSync(path.join(root,'input.txt'),'owned');
  fs.writeFileSync(path.join(root,'package.json'),'{"name":"owned-test","version":"1.0.0"}');
  const run=(...args)=>spawnSync(process.execPath,[bin,'--state-dir',state,...args],
    {cwd:root,encoding:'utf8',timeout:30000});
  const ok=(...args)=>{const r=run(...args);assert.equal(r.status,0,r.stdout+r.stderr+(fs.existsSync(path.join(state,'observer.log'))?fs.readFileSync(path.join(state,'observer.log'),'utf8'):''));return r;};
  t.after(()=>{run('stop');fs.rmSync(base,{recursive:true,force:true});});
  ok('start');ok('run','check');ok('stop');
  const marker=path.join(state,'vstate-owner-v1.json'),original=fs.readFileSync(marker),
    selected=fs.readFileSync(path.join(state,'receipts-v1.json')),
    history=fs.readdirSync(path.join(state,'runs-v1')).sort();
  try{for(const content of [null,'{','{}',JSON.stringify({...JSON.parse(original),root:root+'-other'})]){
    if(content===null)fs.rmSync(marker);else fs.writeFileSync(marker,content);
    const result=run('run','check');assert.notEqual(result.status,0,result.stdout);
    assert.equal(fs.readFileSync(path.join(root,'executions'),'utf8'),'x');
    assert.deepEqual(fs.readFileSync(path.join(state,'receipts-v1.json')),selected);
    assert.deepEqual(fs.readdirSync(path.join(state,'runs-v1')).sort(),history);
    assert(!fs.existsSync(path.join(state,'run.lock')));
  }}finally{fs.writeFileSync(marker,original);}
  ok('run','check');assert.equal(fs.readFileSync(path.join(root,'executions'),'utf8'),'xx');
});
