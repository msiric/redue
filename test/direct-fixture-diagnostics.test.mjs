// Controlled diagnostics only; no compiler/observer/CI/model acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createDirectFixtureDiagnostics,directFixtureDiagnosticRow,emitDirectSuiteDiagnostic} from './acceptance/direct-fixture-diagnostics.mjs';
function fixture(t){
 const parent=fs.realpathSync(os.tmpdir()),base=fs.mkdtempSync(path.join(parent,'redue-fixture-control-')),
  directory=fs.mkdtempSync(path.join(parent,'redue-direct-diagnostics-'));
 t.after(()=>{fs.rmSync(base,{recursive:true,force:true});fs.rmSync(directory,{recursive:true,force:true});});
 const rows=[],env={REDUE_TEST_DIRECT_DIAGNOSTICS:'1',REDUE_TEST_DIRECT_DIAGNOSTICS_DIR:directory};
 return {base,directory,rows,env,options:{env,emit:row=>rows.push(row)}};
}
test('default diagnostics have zero files, zero rows and identical command environment/result',t=>{
 const f=fixture(t),env={fixture:'synthetic'},diagnostic=createDirectFixtureDiagnostics(f.base,{env,emit:row=>f.rows.push(row)}),result={status:0,stdout:'',stderr:''};
 assert.equal(diagnostic.enabled,false);assert.equal(diagnostic.command('run',env,received=>{assert.equal(received,env);return result;}),result);
 assert.equal(diagnostic.step('fixture.compiler_copy',()=>17),17);assert.deepEqual(f.rows,[]);assert.deepEqual(fs.readdirSync(f.directory),[]);
});
test('opt-in creates only a sibling timing file and correlates actual existing engine instrumentation',t=>{
 const f=fixture(t),diagnostic=createDirectFixtureDiagnostics(f.base,f.options),env={...process.env,CONTROLLED_MARKER:'synthetic'};
 assert.equal(diagnostic.enabled,true);assert.equal(fs.readdirSync(f.base).length,0,'No project/state or pre-ownership writes');
 const source=new URL('../src/decision-profile.mjs',import.meta.url).href;
 const result=diagnostic.command('start',env,childEnv=>{
  assert.equal(childEnv.CONTROLLED_MARKER,env.CONTROLLED_MARKER);assert.equal(env.REDUE_DECISION_PROFILE_FILE,process.env.REDUE_DECISION_PROFILE_FILE);
  return spawnSync(process.execPath,['--input-type=module','-e',`import {mark} from ${JSON.stringify(source)};mark('cli.loaded');console.log('controlled');`],{env:childEnv,encoding:'utf8',timeout:5000});
 });
 assert.equal(result.status,0);assert.equal(result.stdout.trim(),'controlled');
 const files=fs.readdirSync(f.directory);assert.equal(files.length,1);assert.match(files[0],/^[a-f0-9-]{36}\.jsonl$/);
 const row=JSON.parse(fs.readFileSync(path.join(f.directory,files[0]),'utf8').trim().slice('REDUE_TIMING '.length));
 assert.equal(row.phase,'cli.loaded');assert.match(row.request,/^[a-f0-9-]{36}$/);assert.equal(row.work,'direct-fixture');
 assert.equal(f.rows.at(-1).status,0);assert.equal(f.rows.at(-1).errorCode,null);assert.equal(f.rows.at(-1).stdoutBytes,result.stdout.length);
 assert(!JSON.stringify(f.rows).includes(f.base));assert(!JSON.stringify(f.rows).includes('synthetic'));
});
test('command failure records exact status/error/signal and rethrows unchanged thrown exceptions',t=>{
 const f=fixture(t),diagnostic=createDirectFixtureDiagnostics(f.base,f.options),result={status:null,signal:'SIGTERM',error:{code:'ETIMEDOUT'},stdout:'',stderr:''};
 assert.equal(diagnostic.command('run',{},()=>result),result);assert.equal(f.rows.at(-1).errorCode,'ETIMEDOUT');assert.equal(f.rows.at(-1).signal,'SIGTERM');assert.equal(f.rows.at(-1).status,null);
 const error=Object.assign(Error('controlled'),{code:'ENOENT'});assert.throws(()=>diagnostic.command('run',{},()=>{throw error;}),e=>e===error);assert.equal(f.rows.at(-1).errorCode,'ENOENT');
});
test('diagnostic projection never retains paths, argv, environment values or arbitrary fields',()=>{
 const row=directFixtureDiagnosticRow('command.end',{command:'/private/not-a-command',status:0,signal:'secret',errorCode:'https://private.invalid',path:'/private',argv:['credentials'],environment:{TOKEN:'synthetic'},output:'secret',ms:Infinity,group:'unknown'});
 assert.deepEqual(row,{schema:1,phase:'command.end',status:0});assert.equal(directFixtureDiagnosticRow('secret').phase,'unknown');
});
test('missing, noncanonical, nonsibling or unsafe diagnostic directories cannot change execution',t=>{
 const f=fixture(t);
 for(const directory of [undefined,path.join(f.base,'absent'),f.directory+path.sep,path.dirname(f.directory),f.base]){
  const env={...f.env,REDUE_TEST_DIRECT_DIAGNOSTICS_DIR:directory},diagnostic=createDirectFixtureDiagnostics(f.base,{env,emit:row=>f.rows.push(row)});
  assert.equal(diagnostic.enabled,false);assert.equal(diagnostic.command('run',env,received=>received),env);
 }
 assert.deepEqual(fs.readdirSync(f.directory),[]);assert.deepEqual(f.rows,[]);
});
test('diagnostic event count is bounded and an emitter failure never changes commands',t=>{
 const f=fixture(t),diagnostic=createDirectFixtureDiagnostics(f.base,f.options);
 for(let i=0;i<300;i++)assert.equal(diagnostic.step('fixture.compiler_copy',()=>i),i);
 assert.equal(f.rows.length,256);
 const silent=createDirectFixtureDiagnostics(f.base,{env:f.env,emit:()=>{throw Error('controlled sink failure');}});
 assert.equal(silent.step('fixture.cleanup',()=>123),123);assert.equal(silent.command('run',{},()=>({status:0,stdout:'',stderr:''})).status,0);
});
test('suite diagnostics are opt-in and project safe group/error fields',()=>{
 const rows=[];emitDirectSuiteDiagnostic('suite.end',{group:'direct-all',status:null,errorCode:'ETIMEDOUT',signal:'SIGTERM'},{env:{},emit:row=>rows.push(row)});assert.equal(rows.length,0);
 emitDirectSuiteDiagnostic('suite.end',{group:'direct-all',status:null,errorCode:'ETIMEDOUT',signal:'SIGTERM',private:'secret'},{env:{REDUE_TEST_DIRECT_DIAGNOSTICS:'1'},emit:row=>rows.push(row)});
 assert.deepEqual(rows,[{schema:1,phase:'suite.end',status:null,signal:'SIGTERM',errorCode:'ETIMEDOUT',group:'direct-all'}]);
});
