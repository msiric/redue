import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {previewSealedTypeScriptRecipe,sealedTypeScriptInterpretation} from '../src/sealed-typescript-recipe.mjs';

// Already-approved retained public project; no installation scripts or downloads.
const isolatedCompiler=new URL('./fixtures/typescript-5-5-2/node_modules/typescript/',import.meta.url);
const compiler=fs.existsSync(isolatedCompiler)?isolatedCompiler:
  new URL('../../redue/.local/real-projects/checkouts/vscode-js-debug/node_modules/typescript/',import.meta.url);
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-sealed-preview-'))),root=path.join(base,'space café');
  fs.mkdirSync(path.join(root,'node_modules'),{recursive:true});
  fs.cpSync(compiler,path.join(root,'node_modules/typescript'),{recursive:true});
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'owned-public-fixture',scripts:{check:'tsc --noEmit'}}));
  fs.writeFileSync(path.join(root,'package-lock.json'),'{}');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return root;
}
const available={skip:!fs.existsSync(compiler)?'Approved retained compiler unavailable; no fetching substitute':false};
function preview(options){
  // Node's test runner injects NODE_TEST_CONTEXT into this process. Keep the
  // contract's rejection; exercise the normal invocation in a separate child
  // without only those test-runner keys, not a reconfigured agent environment.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>
    !['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
  const code=`import {previewSealedTypeScriptRecipe as inspect} from ${JSON.stringify(new URL('../src/sealed-typescript-recipe.mjs',import.meta.url).href)};
    try{console.log(JSON.stringify({ok:true,value:inspect(JSON.parse(process.argv[1]))}));}
    catch(error){console.log(JSON.stringify({ok:false,code:error.code}));}`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',code,JSON.stringify(options)],
    {env,encoding:'utf8',timeout:5000,maxBuffer:65536});
  assert.equal(child.status,0);assert.equal(child.signal,null);
  const result=JSON.parse(child.stdout);if(!result.ok)throw Object.assign(Error(result.code),{code:result.code});
  return result.value;
}
test('preview selects a new staged obligation while preserving original configuration',available,t=>{
  const root=fixture(t),before=fs.readFileSync(path.join(root,'package.json'));
  assert.throws(()=>previewSealedTypeScriptRecipe({root,script:'check'}),{code:'direct-execution-environment-unsupported'});
  const result=preview({root,script:'check'});
  assert.equal(result.recipe.interpretation,sealedTypeScriptInterpretation);
  assert.equal(result.recipe.compiler.version,'5.5.2');
  assert.deepEqual(result.recipe.command,['@node','@sealed-root/node_modules/typescript/lib/tsc.js','--noEmit']);
  assert.equal(result.recipe.cwd,'@sealed-root');assert.equal(result.existingChecksConverted,false);
  for(const key of ['sealed','executable','reuseEligible','npmExecution','lifecycleExecution','packageJsonChanged'])assert.equal(result[key],false);
  assert.equal(result.reason,'SEALED_RECIPE_ENFORCEMENT_PENDING');
  assert.deepEqual(fs.readFileSync(path.join(root,'package.json')),before);
  assert.equal(JSON.stringify(result).includes(root),false,'portable proposal carries no physical checkout path');
  assert.equal(preview({root,script:'check'}).definitionSha256,result.definitionSha256);
});
test('standalone script and exact implementation remain requirements for a proposal',available,t=>{
  const root=fixture(t),pkg=path.join(root,'package.json');
  for(const scripts of [{check:'tsc --noEmit',precheck:'node before.cjs'},
    {check:'tsc --noEmit && node after.cjs'},{check:'NODE_ENV=production tsc --noEmit'}]){
    fs.writeFileSync(pkg,JSON.stringify({scripts}));
    assert.throws(()=>preview({root,script:'check'}),{code:'typecheck-script-changed'});
  }
  fs.writeFileSync(pkg,JSON.stringify({scripts:{check:'tsc --noEmit'}}));
  fs.appendFileSync(path.join(root,'node_modules/typescript/lib/typescript.js'),'\n// replacement');
  assert.throws(()=>preview({root,script:'check'}),{code:'direct-typescript-implementation-unreviewed'});
});
test('caller-supplied authority and getters cannot enable the staged recipe',()=>{
  let read=false;assert.throws(()=>previewSealedTypeScriptRecipe({get root(){read=true;return '/';},script:'check'}),{code:'SEALED_RECIPE_OPTIONS'});
  assert.equal(read,false);
  assert.throws(()=>previewSealedTypeScriptRecipe({root:'/',script:'check',sealed:true}),{code:'SEALED_RECIPE_OPTIONS'});
});
