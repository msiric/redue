import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {classifySealedTypeScriptNamespace} from './acceptance/sealed-typescript-namespace.mjs';
const h=character=>character.repeat(64);
function fixture(){const root='/owned/stage',tsRoot=root+'/node_modules/typescript';return{root,cwd:root,tsRoot,compilerVersion:'5.5.2',
  manifest:[['src/a.ts',h('c')],['tsconfig.json',h('d')]],facts:{configs:[['tsconfig.json',h('a')]],files:[['src/a.ts',h('b')]],queries:[
    ['readFile',root+'/tsconfig.json',h('e')],['readFile',root+'/src/a.ts',h('f')],['fileExists',root+'/src/a.ts',true],['directoryExists',root+'/src',true],
    ['realpath',root+'/src/a.ts',root+'/src/a.ts'],['readDirectory',root+'/src',[root+'/src/a.ts'],{tsRoot,args:[['.ts'],undefined,['**/*']],argsVersion:1,undefinedArguments:[1]}],
    ['directories',root,['src','empty']],['entries',root+'/src',[['a.ts','f'],['shim','l']]],
  ]}};}
test('all seven locally captured query kinds and distinct hash meanings are retained without authority',()=>{const input=fixture(),result=classifySealedTypeScriptNamespace(input);
  assert.equal(result.recipe,'npm-sealed-typescript@1');assert.equal(result.classified.length,input.facts.queries.length);assert.deepEqual(result.facts.configs,input.facts.configs);assert.deepEqual(result.facts.files,input.facts.files);
  assert.equal(result.facts.queries[0][2],h('e'),'readFile JSON-text hash was not substituted with raw-byte config hash');assert.equal(result.facts.configs[0][1],h('a'));assert.equal(input.manifest[1][1],h('d'));
  assert.deepEqual(result.facts.queries[5][3].args,[['.ts'],null,['**/*']]);assert.deepEqual(result.facts.queries[5][3].undefinedArguments,[1]);assert.equal(input.facts.queries[5][3].args[1],undefined,'caller data unchanged');
  assert.equal(result.namespaceVerified,false);assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);assert(Object.isFrozen(result.facts.queries[5][3].args));
  assert(result.requiredDirectories.some(row=>row.relative==='empty'&&!row.representedByFiles));assert(result.unresolved.includes('DIRECTORY_NOT_MATERIALIZED'));assert(result.unresolved.includes('LINK_TOPOLOGY_REQUIRES_LOCAL_VALIDATION'));
});
test('classification never loads a compiler or reads a filesystem/environment',()=>{const restore=[];for(const key of ['readFileSync','statSync','lstatSync','readdirSync','opendirSync']){const original=fs[key];restore.push(()=>fs[key]=original);fs[key]=()=>{throw Error('NO_FILESYSTEM');};}
  try{const result=classifySealedTypeScriptNamespace(fixture());assert.equal(result.reuseEligible,false);}finally{for(const reset of restore)reset();}});
test('outside targets and path-bearing answers/options remain explicit unresolved facts',()=>{const input=fixture();input.facts.queries.push(['fileExists','/owned/node_modules/@typescript/lib-es2022/index.d.ts',null],['directoryExists','/owned/node_modules',true],['readFile','/other/config.json',h('a')],['realpath',input.root+'/alias','/other/target']);
  input.facts.queries[5][3].args[2]=['/other/**/*.ts','../outside/**/*.ts'];input.facts.queries[5][2].push('/other/a.ts');const result=classifySealedTypeScriptNamespace(input);
  assert.equal(result.classified.filter(row=>row.target.namespace==='outside').length,3);assert.equal(result.facts.queries.length,input.facts.queries.length);assert.equal(result.facts.queries.at(-2)[2],h('a'));
  for(const code of ['OUTSIDE_QUERY_UNRESOLVED','OUTSIDE_REFERENCE_UNRESOLVED','RELATIVE_OPTION_ESCAPE_UNRESOLVED'])assert(result.unresolved.includes(code));assert.equal(result.namespaceVerified,false);
});
test('negative answers preserve false versus null and cannot manufacture absence proof',()=>{const a=fixture(),b=fixture();a.facts.queries.push(['directoryExists',a.root+'/missing',false]);b.facts.queries.push(['directoryExists',b.root+'/missing',null]);const first=classifySealedTypeScriptNamespace(a),second=classifySealedTypeScriptNamespace(b);
  assert.notEqual(first.factsSha256,second.factsSha256);assert.equal(first.negative.at(-1).answer,false);assert.equal(second.negative.at(-1).answer,null);assert(first.unresolved.includes('NEGATIVE_ANSWERS_REQUIRE_LOCAL_VALIDATION'));assert.equal(first.reuseEligible,false);
});
test('different realpath answers require local alias validation without claiming a symlink',()=>{const input=fixture();input.facts.queries[4][2]=input.root+'/src/A.ts';const result=classifySealedTypeScriptNamespace(input);assert(result.unresolved.includes('ALIAS_TOPOLOGY_REQUIRES_LOCAL_VALIDATION'));assert.deepEqual(result.requiredLinks,['src/shim']);assert.equal(result.namespaceVerified,false);});
test('full query options and local capture changes alter identity; daemon facts cannot stand in',()=>{const caller=fixture(),daemon=fixture();caller.facts.queries.push(['fileExists','/owned/node_modules/x/package.json',null]);daemon.facts.queries.push(['fileExists','/owned/node_modules/x/package.json',true]);
  assert.notEqual(classifySealedTypeScriptNamespace(caller).factsSha256,classifySealedTypeScriptNamespace(daemon).factsSha256);
  const changed=fixture();changed.facts.queries[5][3].args[2]=['**/*.tsx'];assert.notEqual(classifySealedTypeScriptNamespace(fixture()).factsSha256,classifySealedTypeScriptNamespace(changed).factsSha256);
});
test('query/config/file capture must remain complete, not just an asserted boolean',()=>{for(const mutate of [input=>input.facts.queries=null,input=>input.facts.queries=[],input=>input.facts.queries=input.facts.queries.slice(2),input=>input.facts.queries[0][2]=null]){const input=fixture();mutate(input);assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_INCOMPLETE'});}
  const input=fixture();input.complete=true;assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_SCHEMA'});
});
test('missing manifest inputs remain unresolved without comparing unlike digest types',()=>{const input=fixture();input.manifest=[input.manifest[1]];const result=classifySealedTypeScriptNamespace(input);assert(result.unresolved.includes('INPUT_NOT_MATERIALIZED'));assert.equal(result.sealed,false);});
for(const mutate of [input=>input.cwd=input.root+'/src',input=>input.compilerVersion='5.6.3',input=>input.tsRoot='/other/compiler',input=>input.root='/'])test(`selected recipe context refuses unsupported ${mutate.toString()}`,()=>{const input=fixture();mutate(input);assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_SELECTION'});});
for(const [name,row] of [
  ['unknown kind',['wat','/owned/stage/src/a.ts',true]],['malformed path',['fileExists','/owned/stage/../x',null]],['extra options',['fileExists','/owned/stage/src/a.ts',true,{}]],
  ['wrong exists answer',['fileExists','/owned/stage/src/a.ts',1]],['bad read hash',['readFile','/owned/stage/src/a.ts','contents']],['bad realpath',['realpath','/owned/stage/src/a.ts','relative']],
  ['bad member name',['directories','/owned/stage',['../outside']]],['duplicate members',['directories','/owned/stage',['src','src']]],['unknown member type',['entries','/owned/stage',[['src','socket']]]],
])test(`strict query schema rejects ${name}`,()=>{const input=fixture();input.facts.queries.push(row);assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_SCHEMA'});});
test('readDirectory options cannot lose undefined positions or accept unknown/malformed argument shapes',()=>{for(const mutate of [options=>options.args=[],options=>options.args.push(3,4),options=>options.undefinedArguments=[],options=>options.undefinedArguments=[1,1],options=>options.undefinedArguments=[99],options=>options.argsVersion=2,options=>options.extra=true,options=>options.tsRoot='/outside',options=>options.args[0]=['.ts',1],options=>options.args.push('4')]){
  const input=fixture();mutate(input.facts.queries[5][3]);assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_SCHEMA'});}
});
test('wire null plus explicit undefined slot remains distinct from an explicit value',()=>{const a=fixture(),b=fixture();b.facts.queries[5][3].args[1]=null;assert.equal(classifySealedTypeScriptNamespace(a).factsSha256,classifySealedTypeScriptNamespace(b).factsSha256);
  b.facts.queries[5][3].args[1]=[];b.facts.queries[5][3].undefinedArguments=[];assert.notEqual(classifySealedTypeScriptNamespace(a).factsSha256,classifySealedTypeScriptNamespace(b).factsSha256);
});
test('getter/cycle/sparse/oversize data fails before any caller code is invoked',()=>{let invoked=0;const input=fixture();Object.defineProperty(input.facts.queries[0],'2',{get(){invoked++;return h('a');},enumerable:true});assert.throws(()=>classifySealedTypeScriptNamespace(input),{code:'NAMESPACE_SCHEMA'});assert.equal(invoked,0);
  const cyclic=fixture();cyclic.facts.queries.push(cyclic);assert.throws(()=>classifySealedTypeScriptNamespace(cyclic),{code:'NAMESPACE_SCHEMA'});
  const sparse=fixture();sparse.manifest=new Array(1);assert.throws(()=>classifySealedTypeScriptNamespace(sparse),{code:'NAMESPACE_SCHEMA'});
  const big=fixture();big.manifest=new Array(100001);assert.throws(()=>classifySealedTypeScriptNamespace(big),{code:'NAMESPACE_LIMIT'});
});
