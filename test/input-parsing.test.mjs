import test from 'node:test';
import assert from 'node:assert/strict';
import match from '../src/glob.mjs';
import upstream from 'micromatch';
import YAML from 'yaml';

test('unsupported glob nesting fails before the vulnerable recursive parser',()=>{
  const deep='{'.repeat(5000)+'a,b'+'}'.repeat(5000);
  assert.throws(()=>match.matcher(deep),/input glob nesting/);
  assert.throws(()=>match.isMatch('src/a.ts',['src/**',deep]),/input glob nesting/);
  assert.throws(()=>match.matcher('('.repeat(65)+'a'+')'.repeat(65)),/input glob nesting/);
  assert.throws(()=>match.matcher('a'.repeat(32769)),/32768/);
  for(const pattern of ['src/**/*.{ts,tsx}','packages/*','!**/cache/**','@(src|lib)/**'])
    for(const file of ['src/a.ts','src/a.tsx','lib/b.js','packages/core','docs/a.md']) {
      assert.equal(match.isMatch(file,pattern,{dot:true}),upstream.isMatch(file,pattern,{dot:true}));
      assert.equal(match.matcher(pattern,{dot:true})(file),upstream.matcher(pattern,{dot:true})(file));
    }
});

test('patched YAML rejects pathological nesting as a parse error, not stack exhaustion',()=>{
  const doc=YAML.parseDocument('['.repeat(5000)+'1'+']'.repeat(5000));
  assert(doc.errors.length>0);
  assert(doc.errors.every(error=>error.name==='YAMLParseError'));
});
