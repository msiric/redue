import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {EventEmitter} from 'node:events';
import {doctor} from '../src/agent-integration.mjs';
import {controlEndpoint} from '../src/control-endpoint.mjs';

function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rad-'))),state=path.join(base,'state'),configFile=path.join(base,'redue.config.json');
  fs.writeFileSync(configFile,JSON.stringify({schema:1,checks:[{name:'check',command:['@node','check.mjs'],inputs:['check.mjs']}]}));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  return {base,state,configFile,query:()=>doctor({configFile,stateOverride:state,entry:path.resolve('bin/redue.mjs'),cwd:base,host:'codex'})};
}
test('doctor separates missing state/endpoint from permission denial and never verifies behavior',async t=>{
  const f=fixture(t),absent=await f.query();
  assert.equal(absent.state_access.status,'missing');assert.equal(absent.control.reachable,false);
  assert.equal(absent.behavior_verified,false);assert(!fs.existsSync(f.state));
  const real=net.createConnection;
  net.createConnection=()=>{const client=new EventEmitter();client.destroy=()=>{};
    queueMicrotask(()=>client.emit('error',Object.assign(Error('denied'),{code:'EPERM'})));return client;};
  try{const denied=await f.query();assert.equal(denied.control.classification,'access_denied');
    assert.equal(denied.control.code,'EPERM');assert.match(denied.control.reason,/session policy and OS permissions/);
    assert.equal(denied.observer_process,null);assert.equal(denied.behavior_verified,false);
  }finally{net.createConnection=real;}
});
test('doctor identifies a reachable older observer independently of integration and eligibility',async t=>{
  const f=fixture(t);fs.mkdirSync(f.state);fs.mkdirSync(path.join(f.state,'observer.lock'));
  fs.writeFileSync(path.join(f.state,'observer.lock/pid'),String(process.pid));
  fs.writeFileSync(path.join(f.state,'status.json'),JSON.stringify({checks:[],observation:{healthy:true},pid:process.pid}));
  const server=net.createServer(client=>client.on('data',buffer=>{
    assert.equal(JSON.parse(buffer.toString()).action,'metrics');client.end(JSON.stringify({metrics:{},healthy:true}));
  }));
  await new Promise(resolve=>server.listen(controlEndpoint(f.state).address,resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const value=await f.query();assert.equal(value.control.reachable,true);assert.equal(value.observer_process.alive,true);
  assert.equal(value.compatibility.receipt_selection,'unconfirmed');assert.match(value.compatibility.reason,/stop\/start/);
  assert.equal(value.state_access.status,'readable');assert.equal(value.hosts[0].installed,false);
  assert.equal(value.behavior_verified,false);
});
test('doctor bounds hung control probes and distinguishes unreadable state',async t=>{
  const f=fixture(t);const realConnect=net.createConnection,realRead=fs.readdirSync;
  net.createConnection=()=>{const client=new EventEmitter();client.destroy=()=>{};return client;};
  fs.readdirSync=(file,...args)=>{if(file===f.state)throw Object.assign(Error('denied'),{code:'EACCES'});return realRead(file,...args);};
  try{const start=performance.now(),value=await f.query();
    assert(performance.now()-start<3500);assert.equal(value.control.classification,'timeout');
    assert.equal(value.state_access.status,'denied');assert.equal(value.state_access.code,'EACCES');
    assert.equal(value.behavior_verified,false);
  }finally{net.createConnection=realConnect;fs.readdirSync=realRead;}
});
