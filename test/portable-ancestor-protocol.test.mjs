import test from 'node:test';import assert from 'node:assert/strict';
import {AncestorProtocol,ancestorInitialization} from '../src/portable-ancestor-protocol.mjs';
const frame=row=>JSON.stringify({schema:1,...row});
const ready=(p,n=0)=>p.accept(frame({type:'ready',request:0,serial:n,uncertain:false}));
test('fixed initialization uses exact path byte lengths, no shell or general parser',()=>{
 assert.equal(ancestorInitialization([{candidate:'/private/tmp/owned/node_modules/x',descendants:false}]).toString(),
  'INIT 1\n0 33 0\n/private/tmp/owned/node_modules/x\n');
 for(const p of ['/','/private/tmp/x\n','/private/tmp/../x','/private/tmp/é','/private/tmp/a:b','/private/tmp/a\\b'])
  assert.throws(()=>ancestorInitialization([{candidate:p,descendants:false}]));
});
test('pre-ready occurrences and create/delete occurrences remain counted at each acknowledged boundary',()=>{
 const p=new AncestorProtocol(2);
 p.accept(frame({type:'occurrence',scopeIds:[0,1],serial:1}));ready(p,1);
 p.accept(frame({type:'occurrence',scopeIds:[1],serial:2}));
 p.accept(frame({type:'occurrence',scopeIds:[1],serial:3}));
 assert.deepEqual(p.accept(frame({type:'barrier',request:1,serial:3,uncertain:false}),{request:1}),{type:'barrier',serial:3});
 p.accept(frame({type:'closed',request:2,serial:3,uncertain:false}),{request:2,closing:true});assert(p.closed);
 assert.throws(()=>ready(p,3));
});
test('gaps, wrong identities, serial rollback, malformed output and unknown fields irrevocably withdraw authority',()=>{
 for(const row of [{type:'barrier',request:2,serial:0,uncertain:false},
  {type:'barrier',request:1,serial:0,uncertain:true},
  {type:'occurrence',scopeIds:[2],serial:1},{type:'occurrence',scopeIds:[1,0],serial:1},
  {type:'occurrence',scopeIds:[0],serial:0},{type:'occurrence',scopeIds:[0],serial:2},
  {type:'ready',request:0,serial:0,uncertain:false},
  {type:'barrier',request:1,serial:0,uncertain:false,path:'private-path'}]){
  const p=new AncestorProtocol(2);ready(p);assert.throws(()=>p.accept(frame(row),{request:1}));assert(p.uncertain);
  assert.throws(()=>p.accept(frame({type:'barrier',request:1,serial:0,uncertain:false}),{request:1}));
 }
 const p=new AncestorProtocol(1);ready(p);p.accept(frame({type:'uncertainty',code:'FSEVENTS_GAP',serial:0}));
 assert(p.uncertain);assert.throws(()=>p.accept(frame({type:'barrier',request:1,serial:0,uncertain:false}),{request:1}));
 const malformed=new AncestorProtocol(1);assert.throws(()=>malformed.accept('{bad'));assert(malformed.uncertain);
});
