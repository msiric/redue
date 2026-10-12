import test from 'node:test';import assert from 'node:assert/strict';
import {buildPortableAncestorFSEvents} from '../scripts/build-portable-ancestor-fsevents.mjs';
test('build helper permits no arbitrary compiler flags or truthy diagnostic mode',()=>{
  for(const options of [null,[],{diagnostic:'true'},{diagnostic:1},{flags:['-DOTHER']},{diagnostic:true,output:'other'}])
    assert.throws(()=>buildPortableAncestorFSEvents('/unused/not-built',options),{code:'ANCESTOR_BUILD_USAGE'});
});
test('queue drain requires diagnostic mode and refuses getter-based options',()=>{
  for(const options of [{diagnosticDrain:true},{diagnostic:false,diagnosticDrain:true},{diagnostic:true,diagnosticDrain:'true'},{diagnostic:true,diagnosticDrain:1}])
    assert.throws(()=>buildPortableAncestorFSEvents('/unused/not-built',options),{code:'ANCESTOR_BUILD_USAGE'});
  for(const key of ['diagnostic','diagnosticDrain']){let calls=0;const options={};Object.defineProperty(options,key,{enumerable:true,get(){calls++;return true;}});
    assert.throws(()=>buildPortableAncestorFSEvents('/unused/not-built',options),{code:'ANCESTOR_BUILD_USAGE'});assert.equal(calls,0);}
  for(const options of [Object.defineProperty({},'flags',{value:[]}),{[Symbol('diagnostic')]:true}])
    assert.throws(()=>buildPortableAncestorFSEvents('/unused/not-built',options),{code:'ANCESTOR_BUILD_USAGE'});
});
