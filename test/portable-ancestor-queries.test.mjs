import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {derivePortableAncestorQueries,portableAncestorEventMatch,ancestorQueriesInterpretation,ancestorQueryLimits} from '../src/portable-ancestor-queries.mjs';
const posix={skip:process.platform==='win32'?'Initial local POSIX namespace helper; no Windows optimization enabled':false};
const code=expected=>error=>error.code===expected;
function fixture(t,depth=0){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-ancestor-')));
  const parent=path.join(base,...Array.from({length:depth},(_,i)=>`level${i}`)),root=path.join(parent,'project');
  fs.mkdirSync(path.join(root,'src'),{recursive:true});fs.writeFileSync(path.join(root,'src/a.ts'),'export {};');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const candidate=path.join(parent,'node_modules/@typescript/lib-es2022/index.d.ts');
  return {base,parent,root,candidate,queries:[['readFile',path.join(root,'src/a.ts'),'a'.repeat(64)],['fileExists',candidate,null]]};
}
test('local absence derives exact bounded namespace and private scope, never eligibility',posix,t=>{
  const f=fixture(t),result=derivePortableAncestorQueries(f.root,f.queries);
  assert.equal(result.schema,1);assert.equal(result.interpretation,ancestorQueriesInterpretation);
  assert.equal(result.reuseEligible,false);assert.equal(result.queries.find(q=>q[0]==='readFile')[1],'src/a.ts');
  assert.deepEqual(result.queries.find(q=>q[0]==='fileExists'),['fileExists',{namespace:ancestorQueriesInterpretation,ancestorDepth:1,relativePath:'node_modules/@typescript/lib-es2022/index.d.ts'},null]);
  assert.equal(result.scopes[0].watchRoot,f.parent);assert.equal(result.scopes[0].candidate,f.candidate);
  assert.deepEqual(result.scopes[0].prefixes,[f.parent,path.join(f.parent,'node_modules'),path.join(f.parent,'node_modules/@typescript'),path.dirname(f.candidate),f.candidate]);
  assert.match(result.queryDigest,/^[a-f0-9]{64}$/);assert.match(result.scopeDigest,/^[a-f0-9]{64}$/);
  assert(Object.isFrozen(result.scopes[0].prefixes));
  assert(!JSON.stringify(result.queries).includes(f.base),'portable projection contains no owner absolute path');
});
test('independent same-depth checkouts match logical facts, physical guards remain local',posix,t=>{
  const a=fixture(t),b=fixture(t),first=derivePortableAncestorQueries(a.root,a.queries),second=derivePortableAncestorQueries(b.root,b.queries);
  assert.equal(first.queryDigest,second.queryDigest);assert.equal(first.scopeDigest,second.scopeDigest);
  assert.notDeepEqual(first.rootIdentity,second.rootIdentity);assert.notEqual(first.scopes[0].watchRoot,second.scopes[0].watchRoot);
});
test('full ancestor chain and every query answer remain strict',posix,t=>{
  const a=fixture(t),b=fixture(t,1),first=derivePortableAncestorQueries(a.root,a.queries),second=derivePortableAncestorQueries(b.root,b.queries);
  assert.notEqual(first.chainDepth,second.chainDepth);assert.notEqual(first.queryDigest,second.queryDigest);
  const alternative=derivePortableAncestorQueries(a.root,[...a.queries.slice(0,1),['fileExists',a.candidate,false]]);
  assert.notEqual(first.queryDigest,alternative.queryDigest);
  const added=derivePortableAncestorQueries(a.root,[...a.queries,['directoryExists',path.dirname(a.candidate),null]]);
  assert.notEqual(first.queryDigest,added.queryDigest);assert.notEqual(first.scopeDigest,added.scopeDigest);
});
test('exact present node_modules directory container is preserved, not exempted',posix,t=>{
  const f=fixture(t),container=path.join(f.parent,'node_modules');fs.mkdirSync(container);
  const result=derivePortableAncestorQueries(f.root,[...f.queries,['directoryExists',container,true]]);
  assert.deepEqual(result.queries.find(q=>q[0]==='directoryExists'),['directoryExists',{namespace:ancestorQueriesInterpretation,ancestorDepth:1,relativePath:'node_modules'},true]);
  assert.equal(result.scopes.find(s=>s.relativePath==='node_modules').watchRoot,container);
});
test('absent prefix creation/removal/rename and container replacement events are relevant',posix,t=>{
  const f=fixture(t),scope=derivePortableAncestorQueries(f.root,f.queries).scopes[0];
  for(const prefix of scope.prefixes)assert.equal(portableAncestorEventMatch(scope,prefix),'relevant');
  assert.equal(portableAncestorEventMatch(scope,path.join(f.candidate,'child')),'relevant');
  assert.equal(portableAncestorEventMatch(scope,path.dirname(f.parent)),'relevant','coalesced ancestor can cover candidate');
  assert.equal(portableAncestorEventMatch(scope,path.join(f.parent,'unrelated.txt')),'irrelevant');
  assert.equal(portableAncestorEventMatch(scope,path.join(path.dirname(f.parent),'other-project/file')),'irrelevant');
});
test('change and restore cannot become interval proof from matching final query answers',posix,t=>{
  const f=fixture(t),before=derivePortableAncestorQueries(f.root,f.queries);
  fs.mkdirSync(path.dirname(f.candidate),{recursive:true});fs.writeFileSync(f.candidate,'owned replacement');
  assert.equal(portableAncestorEventMatch(before.scopes[0],f.candidate),'relevant');
  assert.throws(()=>derivePortableAncestorQueries(f.root,f.queries),code('PORTABLE_ANCESTOR_PRESENT'));
  fs.rmSync(path.join(f.parent,'node_modules'),{recursive:true});
  const after=derivePortableAncestorQueries(f.root,f.queries);
  assert.equal(after.queryDigest,before.queryDigest);assert.equal(after.reuseEligible,false,'matching endpoints never grant interval authority');
});
test('unnamed/noncanonical events mean uncertainty; valid unrelated events are discarded',posix,t=>{
  const f=fixture(t),scope=derivePortableAncestorQueries(f.root,f.queries).scopes[0];
  for(const event of [null,undefined,'relative',f.parent+'/../outside',f.parent+'//duplicate',f.parent+'\0suffix'])
    assert.equal(portableAncestorEventMatch(scope,event),'unknown');
  assert.equal(portableAncestorEventMatch(null,f.candidate),'unknown');
  assert.equal(portableAncestorEventMatch(scope,'/unrelated/public/path'),'irrelevant');
});
for(const kind of ['readFile','readDirectory','realpath','directories','entries','unknown'])test(`outside ${kind} cannot acquire a query namespace`,posix,t=>{
  const f=fixture(t),row=kind==='readDirectory'?[kind,f.candidate,[],{tsRoot:path.join(f.root,'node_modules/typescript'),args:[],argsVersion:1,undefinedArguments:[]}]:[kind,f.candidate,kind==='readFile'?'a'.repeat(64):kind==='realpath'?f.candidate:[]];
  assert.throws(()=>derivePortableAncestorQueries(f.root,[row]),error=>['PORTABLE_ANCESTOR_EXTERNAL_QUERY','PORTABLE_ANCESTOR_QUERY'].includes(error.code));
});
test('positive files and non-container directories are unsupported even with truthful answers',posix,t=>{
  const f=fixture(t);fs.mkdirSync(path.dirname(f.candidate),{recursive:true});fs.writeFileSync(f.candidate,'owned');
  for(const answer of [null,false,true])assert.throws(()=>derivePortableAncestorQueries(f.root,[['fileExists',f.candidate,answer]]),code('PORTABLE_ANCESTOR_PRESENT'));
  assert.throws(()=>derivePortableAncestorQueries(f.root,[['directoryExists',path.dirname(f.candidate),true]]),code('PORTABLE_ANCESTOR_PRESENT'));
});
test('unsupported outside paths/options and noncanonical escape syntax refuse',posix,t=>{
  const f=fixture(t);
  for(const file of [path.join(f.parent,'outside.d.ts'),f.candidate.replace('node_modules/','node_modules/../'),f.candidate+'\\x',f.candidate+'\0x',f.candidate+':x',f.candidate.replace('index','%69ndex')])
    assert.throws(()=>derivePortableAncestorQueries(f.root,[['fileExists',file,null]]),error=>['PORTABLE_ANCESTOR_QUERY','PORTABLE_ANCESTOR_PATH','PORTABLE_ANCESTOR_EXTERNAL_QUERY'].includes(error.code));
  assert.throws(()=>derivePortableAncestorQueries(f.root,[['fileExists',f.candidate,null,{trusted:true}]]),code('PORTABLE_ANCESTOR_QUERY'));
  assert.throws(()=>derivePortableAncestorQueries(f.root,[['fileExists',f.candidate,null],['fileExists',f.candidate,false]]),code('PORTABLE_ANCESTOR_DUPLICATE'));
});
test('external candidate and root symlinks refuse without following or reading bodies',posix,t=>{
  const f=fixture(t);fs.mkdirSync(path.dirname(f.candidate),{recursive:true});fs.symlinkSync(path.join(f.root,'src/a.ts'),f.candidate);
  assert.throws(()=>derivePortableAncestorQueries(f.root,f.queries),code('PORTABLE_ANCESTOR_SYMLINK'));
  const alias=path.join(f.base,'alias');fs.symlinkSync(f.root,alias,'dir');
  assert.throws(()=>derivePortableAncestorQueries(alias,[['fileExists',f.candidate,null]]),code('PORTABLE_ANCESTOR_SYMLINK'));
});
test('a query candidate becoming present during derivation refuses',posix,t=>{
  const f=fixture(t),original=fs.lstatSync;let calls=0;
  fs.lstatSync=function(file,...args){if(file===path.join(f.parent,'node_modules')&&++calls===2){fs.mkdirSync(path.dirname(f.candidate),{recursive:true});fs.writeFileSync(f.candidate,'owned');}return original.call(fs,file,...args);};
  try{assert.throws(()=>derivePortableAncestorQueries(f.root,f.queries),code('PORTABLE_ANCESTOR_CHANGED'));}finally{fs.lstatSync=original;}
});
test('physical root replacement during derivation refuses despite matching file bytes',posix,t=>{
  const f=fixture(t),original=fs.lstatSync;let calls=0;
  fs.lstatSync=function(file,...args){if(file===f.root&&++calls===2){fs.renameSync(f.root,f.root+'-old');fs.cpSync(f.root+'-old',f.root,{recursive:true});}return original.call(fs,file,...args);};
  try{assert.throws(()=>derivePortableAncestorQueries(f.root,f.queries),code('PORTABLE_ANCESTOR_CHANGED'));}finally{fs.lstatSync=original;}
});
test('bounded plain data refuses getters, excessive queries, unknown kinds, and empty input',posix,t=>{
  const f=fixture(t);let getter=0;const row=['fileExists',f.candidate,null];Object.defineProperty(row,'2',{enumerable:true,get(){getter++;return null;}});
  assert.throws(()=>derivePortableAncestorQueries(f.root,[row]),code('PORTABLE_ANCESTOR_QUERY'));assert.equal(getter,0);
  assert.throws(()=>derivePortableAncestorQueries(f.root,[]),code('PORTABLE_ANCESTOR_LIMIT'));
  assert.throws(()=>derivePortableAncestorQueries(f.root,Array.from({length:ancestorQueryLimits.queries+1},()=>f.queries[1])),error=>['PORTABLE_ANCESTOR_LIMIT','PORTABLE_SIZE'].includes(error.code));
  assert.throws(()=>derivePortableAncestorQueries(f.root,[['unknown',f.candidate,null]]),code('PORTABLE_ANCESTOR_QUERY'));
});
test('ordinary readDirectory options and results retain exact normalized meaning',posix,t=>{
  const f=fixture(t),query=['readDirectory',path.join(f.root,'src'),[path.join(f.root,'src/a.ts')],{tsRoot:path.join(f.root,'node_modules/typescript'),args:[['.ts'],undefined,['src/**/*']],argsVersion:1,undefinedArguments:[1]}];
  const first=derivePortableAncestorQueries(f.root,[...f.queries,query]);
  assert.deepEqual(first.queries.find(row=>row[0]==='readDirectory'),['readDirectory','src',['src/a.ts'],{tsRoot:'node_modules/typescript',args:[['.ts'],null,['src/**/*']],argsVersion:1,undefinedArguments:[1]}]);
  const changed=structuredClone(query);changed[3].undefinedArguments=[];
  assert.notEqual(first.queryDigest,derivePortableAncestorQueries(f.root,[...f.queries,changed]).queryDigest);
});

test('present container replacement requires parent coverage through filesystem root',posix,t=>{
  const f=fixture(t),container=path.join(f.parent,'node_modules');fs.mkdirSync(container);
  const plan=derivePortableAncestorQueries(f.root,[...f.queries,['directoryExists',container,true]]),scope=plan.scopes.find(row=>row.relativePath==='node_modules');
  assert.equal(scope.watchRoot,container,'local existence is separate from required replacement coverage');
  const roots=plan.requiredWatchRoots.map(row=>row.path);
  assert(roots.includes(container));assert(roots.includes(f.parent));assert(roots.includes(path.parse(f.root).root));
  for(const row of plan.requiredWatchRoots){assert.match(row.identity.dev,/^\d+$/);assert.match(row.identity.ino,/^\d+$/);assert(row.scopeIndexes.length>0);assert(Object.isFrozen(row));}
  assert(plan.requiredWatchRoots.find(row=>row.path===f.parent).roles.includes('present-prefix-replacement'));
  assert.equal(plan.reuseEligible,false);
});
test('replaced and restored container roots retain endpoint facts but require relevant events',posix,t=>{
  const f=fixture(t),container=path.join(f.parent,'node_modules');fs.mkdirSync(container);
  const queries=[...f.queries,['directoryExists',container,true]],before=derivePortableAncestorQueries(f.root,queries),scope=before.scopes.find(row=>row.relativePath==='node_modules');
  fs.renameSync(container,container+'-held');fs.mkdirSync(container);
  const replaced=derivePortableAncestorQueries(f.root,queries);
  assert.equal(replaced.queryDigest,before.queryDigest,'same logical answers are not physical continuity');
  assert.notDeepEqual(replaced.scopes.find(row=>row.relativePath==='node_modules').watchRootIdentity,scope.watchRootIdentity);
  assert.equal(portableAncestorEventMatch(scope,container),'relevant');
  assert.equal(portableAncestorEventMatch(scope,f.parent),'relevant');
  fs.rmdirSync(container);fs.renameSync(container+'-held',container);
  const restored=derivePortableAncestorQueries(f.root,queries);
  assert.deepEqual(restored.scopes.find(row=>row.relativePath==='node_modules').watchRootIdentity,scope.watchRootIdentity);
  assert.equal(restored.queryDigest,before.queryDigest);assert.equal(restored.reuseEligible,false,'restored endpoint must not erase interval events');
  assert(before.requiredWatchRoots.some(row=>row.path===f.parent),'explicit parent requirement survives restored facts');
});
test('ancestor replacement and unknown events cannot be hidden by candidate-only filtering',posix,t=>{
  const f=fixture(t),plan=derivePortableAncestorQueries(f.root,f.queries),scope=plan.scopes[0];
  assert.equal(portableAncestorEventMatch(scope,f.base),'relevant');
  assert.equal(portableAncestorEventMatch(scope,path.parse(f.root).root),'relevant');
  assert.equal(portableAncestorEventMatch(scope,null),'unknown');
  assert.equal(portableAncestorEventMatch(scope,f.parent+'/../../uncanonical'),'unknown');
  assert.equal(portableAncestorEventMatch(scope,path.join(f.base,'unrelated-sibling')),'irrelevant');
});
