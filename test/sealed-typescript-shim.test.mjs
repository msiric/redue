import test from 'node:test';import assert from 'node:assert/strict';
import {sealedNpmShimTarget} from '../src/sealed-typescript-shim.mjs';
test('binds a single top-level or nested scoped npm shim to its owning container',()=>{
  assert.deepEqual(sealedNpmShimTarget('/owned','node_modules/.bin/check','../tool/bin/check.js'),
    {physical:'/owned/node_modules/tool/bin/check.js',relative:'node_modules/tool/bin/check.js'});
  assert.deepEqual(sealedNpmShimTarget('/owned','node_modules/@owner/pkg/node_modules/.bin/check','../@scope/tool/bin/check.js'),
    {physical:'/owned/node_modules/@owner/pkg/node_modules/@scope/tool/bin/check.js',relative:'node_modules/@owner/pkg/node_modules/@scope/tool/bin/check.js'});
});
for(const target of ['/outside/check.js','../../tool/check.js','../tool/../../source.js','../tool/./check.js','../tool//check.js','../tool/check.js/','./tool/check.js'])
  test('refuses external, cross-container or noncanonical target '+JSON.stringify(target),()=>
    assert.throws(()=>sealedNpmShimTarget('/owned','node_modules/pkg/node_modules/.bin/check',target),{code:'TREE_SYMLINK'}));
test('source-shaped or ambiguous paths cannot receive the installed-shim exception',()=>{
  for(const rel of ['src/node_modules/.bin/check','node_modules/pkg/bin/check','node_modules/../.bin/check','node_modules/.bin/a/check'])
    assert.throws(()=>sealedNpmShimTarget('/owned',rel,'../tool/check.js'),{code:'TREE_SYMLINK'});
});
