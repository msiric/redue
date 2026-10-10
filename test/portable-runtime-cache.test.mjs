import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCacheMembers,inspectCacheContents} from '../src/portable-runtime-cache.mjs';
const uuid='a'.repeat(32);
function fixture(){const bytes=Buffer.alloc(664);Buffer.from('dyld_v1  arm64e\0').copy(bytes);bytes.writeUInt32LE(552,16);
  Buffer.from(uuid,'hex').copy(bytes,88);bytes.writeUInt32LE(1,216);bytes.writeUInt32LE(552,392);bytes.writeUInt32LE(2,396);
  for(let i=0;i<2;i++){Buffer.from((i?'c':'b').repeat(32),'hex').copy(bytes,552+56*i);Buffer.from(i?'.02.dylddata':'.01').copy(bytes,552+56*i+24);}return bytes;}
const refused=fn=>assert.throws(fn,error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
test('reviewed modern cache table binds every exact suffix and UUID to the loaded base',()=>{
  assert.deepEqual(parseCacheMembers(fixture(),uuid),[{suffix:'',uuid},{suffix:'.01',uuid:'b'.repeat(32)},{suffix:'.02.dylddata',uuid:'c'.repeat(32)}]);
  refused(()=>parseCacheMembers(fixture(),'d'.repeat(32)));
});
test('unknown, truncated, oversized or ambiguous tables cannot acquire runtime identity',()=>{
  for(const change of [b=>b.writeUInt32LE(544,16),b=>b.writeUInt32LE(0,216),b=>b.writeUInt32LE(0,396),
    b=>b.writeUInt32LE(33,396),b=>b.writeUInt32LE(660,392),b=>b.fill(0,552,568),
    b=>b[400]=1,b=>b.fill(65,576,608),b=>{b.fill(0,632,664);Buffer.from('.01').copy(b,632);},
    b=>Buffer.from('b'.repeat(32),'hex').copy(b,608),b=>b[581]=0xff]){
    const bytes=fixture();change(bytes);refused(()=>parseCacheMembers(bytes,uuid));
  }
  refused(()=>parseCacheMembers(fixture().subarray(0,663),uuid));
  refused(()=>parseCacheMembers(Buffer.alloc(8*1024*1024+1),uuid));
});
test('imported or unsafe cache references and loader overrides are not executable profile inputs',()=>{
  for(const cache of [null,{}, {file:'../../cache',overridden:false,interposed:false},
    {file:'/tmp/foreign-cache',overridden:false,interposed:false},
    {file:'/tmp/dyld_shared_cache_arm64e',overridden:true,interposed:false}])refused(()=>inspectCacheContents(cache));
});
