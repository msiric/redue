import test from 'node:test';
import assert from 'node:assert/strict';
import match from '../src/glob.mjs';
import YAML from 'yaml';

test('the narrow matching boundary preserves ordinary product glob behavior',()=>{
  for(const [pattern,file,expected] of [
    ['src/**/*.{ts,tsx}','src/a.ts',true],
    ['src/**/*.{ts,tsx}','src/deep/a.tsx',true],
    ['src/**/*.{ts,tsx}','src/a.js',false],
    ['packages/*','packages/core',true],
    ['packages/*','packages/core/src',false],
    ['!**/cache/**','pkg/cache/file',false],
    ['!**/cache/**','pkg/lib/file',true],
    ['@(src|lib)/**','lib/b.js',true],
    ['**/*','.hidden/value',true]
  ]) {
    assert.equal(match.isMatch(file,pattern,{dot:true}),expected);
    assert.equal(match.matcher(pattern,{dot:true})(file),expected);
  }
  assert.equal(match.isMatch('src/main.ts',['lib/**','src/**']),true);
});

test('patched YAML rejects pathological nesting as a parse error, not stack exhaustion',()=>{
  const doc=YAML.parseDocument('['.repeat(5000)+'1'+']'.repeat(5000));
  assert(doc.errors.length>0);
  assert(doc.errors.every(error=>error.name==='YAMLParseError'));
});
