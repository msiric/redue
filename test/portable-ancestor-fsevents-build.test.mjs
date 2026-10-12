import test from 'node:test';import assert from 'node:assert/strict';
import {buildPortableAncestorFSEvents} from '../scripts/build-portable-ancestor-fsevents.mjs';
test('build helper permits no arbitrary compiler flags or truthy diagnostic mode',()=>{
  for(const options of [null,[],{diagnostic:'true'},{diagnostic:1},{flags:['-DOTHER']},{diagnostic:true,output:'other'}])
    assert.throws(()=>buildPortableAncestorFSEvents('/unused/not-built',options),{code:'ANCESTOR_BUILD_USAGE'});
});
