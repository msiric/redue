import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {compilerFiles,queriesMatch,queriesHold} from '../src/typescript-list.mjs';
import {InputIndex} from '../src/index.mjs';
import {planGuard,inputKey} from '../src/decision-validation.mjs';
const tsRoot=path.resolve('node_modules/typescript');
const put=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
function fixture(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-decision-')));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  put(path.join(root,'package.json'),JSON.stringify({workspaces:['packages/*']}));
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'export const a: number = 1;\n');
  execFileSync('git',['init','-q'],{cwd:root});return root;}
test('compiler discovery certificate matches CLI and detects new/missing resolution candidates',t=>{
  const root=fixture(t);
  put(path.join(root,'src/main.ts'),'// @ts-ignore optional unresolved module\nimport {x} from "optional";\nexport {x};\n');
  const captured=compilerFiles(tsRoot,root);
  const cli=execFileSync(process.execPath,[path.join(tsRoot,'bin/tsc'),'--listFilesOnly'],{cwd:root})
    .toString().trim().split(/\r?\n/).map(file=>path.resolve(file)).sort();
  assert.deepEqual([...captured.files].sort(),cli);
  assert(queriesMatch(captured.queries));
  put(path.join(root,'notes.md'),'unrelated');assert(queriesMatch(captured.queries));
  put(path.join(root,'node_modules/optional/index.d.ts'),'export const x: string;');
  assert(!queriesMatch(captured.queries));
  const after=compilerFiles(tsRoot,root);assert(queriesMatch(after.queries));
  fs.rmSync(path.join(root,'node_modules/optional'),{recursive:true});
  assert(!queriesMatch(after.queries));
});
test('compiler certificate validates source membership and content, not timestamps or TTL',t=>{
  const root=fixture(t),first=compilerFiles(tsRoot,root);
  assert(queriesMatch(JSON.parse(JSON.stringify(first.queries))),
    'omitted compiler arguments must survive checkpoint serialization');
  put(path.join(root,'src/empty/.keep'),'');
  const empty=compilerFiles(tsRoot,root);assert(queriesMatch(empty.queries));
  put(path.join(root,'src/empty/new.ts'),'export const b=1;');assert(!queriesMatch(empty.queries));
  fs.rmSync(path.join(root,'src/empty'),{recursive:true});assert(queriesMatch(first.queries));
  put(path.join(root,'src/main.ts'),'export const a: string = "x";');assert(!queriesMatch(first.queries));
});
function nested(t){
  const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-hold-'))),root=path.join(parent,'project');
  t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'// @ts-ignore optional unresolved module\nimport {x} from "optional";\nexport {x};\n');
  return {parent,root};
}
const link=(target,file)=>fs.symlinkSync(target,file,process.platform==='win32'?'junction':'dir');
test('in-process certificate replays listings, outside lookups and content without the compiler API',t=>{
  const {parent,root}=nested(t),first=compilerFiles(tsRoot,root);
  assert(first.queries.find(q=>q[0]==='readDirectory')[3].covered===1);
  assert(queriesHold(first.queries));
  put(path.join(root,'src/notes.md'),'unrelated');put(path.join(root,'notes.ts.bak'),'unrelated');
  assert(queriesHold(first.queries),'files the compiler cannot list do not invalidate');
  put(path.join(root,'src/extra.ts'),'export const b=1;');assert(!queriesHold(first.queries));
  fs.rmSync(path.join(root,'src/extra.ts'));assert(queriesHold(first.queries));
  put(path.join(parent,'node_modules/optional/index.d.ts'),'export const x: string;');
  assert(!queriesHold(first.queries),'an appearing lookup outside the checkout invalidates');
  const outside=compilerFiles(tsRoot,root);assert(queriesHold(outside.queries));
  fs.rmSync(path.join(parent,'node_modules'),{recursive:true});
  assert(!queriesHold(outside.queries),'a disappearing lookup outside the checkout invalidates');
  assert(queriesHold(first.queries));
  const alias=path.join(parent,'alias.ts');fs.linkSync(path.join(root,'src/main.ts'),alias);
  assert(queriesHold(first.queries));fs.appendFileSync(alias,'export const c=1;\n');
  assert(!queriesHold(first.queries),'a write through an alias outside the checkout invalidates');
  const missing=first.queries.map(q=>q[0]==='readDirectory'?[q[0],q[1],q[2],{...q[3],covered:undefined}]:q);
  assert(!queriesHold(missing),'an uncovered listing requires the compiler API');
});
test('in-process certificate observes retargeted and realpath-deduplicated linked directories',t=>{
  const {root}=nested(t);
  put(path.join(root,'shared/x.ts'),'export const x=1;');put(path.join(root,'other/y.ts'),'export const y=1;');
  link(path.join(root,'shared'),path.join(root,'src/a'));link(path.join(root,'shared'),path.join(root,'src/b'));
  const first=compilerFiles(tsRoot,root);assert(queriesHold(first.queries));
  fs.rmSync(path.join(root,'src/b'),{recursive:false,force:true});
  link(path.join(root,'other'),path.join(root,'src/b'));
  assert(!queriesHold(first.queries),'a deduplicated link that now names other files invalidates');
});
test('read identities skip unchanged bytes but observe touches, alias writes and recent changes',async t=>{
  const {parent,root}=nested(t),main=path.join(root,'src/main.ts');
  const first=compilerFiles(tsRoot,root),identities=new Map();
  assert(queriesHold(first.queries,identities));
  assert(!identities.has(main),'files changed within the racy window carry no identity');
  await new Promise(resolve=>setTimeout(resolve,2100));
  assert(queriesHold(first.queries,identities));assert(identities.has(main),'a matching hash records the identity');
  const now=new Date();fs.utimesSync(main,now,now);
  assert(queriesHold(first.queries,identities),'a touch with identical bytes still holds');
  assert(!identities.has(main),'a recent change is re-hashed until it settles');
  await new Promise(resolve=>setTimeout(resolve,2100));
  assert(queriesHold(first.queries,identities));assert(identities.has(main));
  const alias=path.join(parent,'alias.ts');fs.linkSync(main,alias);
  fs.writeFileSync(alias,fs.readFileSync(main,'utf8').replace('optional','optionaL'));
  assert(!queriesHold(first.queries,identities),'same-size bytes written through an alias are re-hashed');
});
test('compiler certificates are withheld for project references',t=>{
  const {root}=nested(t);
  put(path.join(root,'lib/tsconfig.json'),JSON.stringify({compilerOptions:{composite:true},include:['*.ts']}));
  put(path.join(root,'lib/l.ts'),'export const l=1;');
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true},include:['src'],
    references:[{path:'./lib'}]}));
  assert.equal(compilerFiles(tsRoot,root).queries,null);
});
test('plan guards include workspace membership, optional configuration and link targets',t=>{
  const root=fixture(t),bundle={root,plans:{check:{resolutionTriggers:['node_modules/pkg']}},
    workspacePatterns:['packages/*']};
  const initial=planGuard(bundle);put(path.join(root,'notes.md'),'irrelevant');assert.equal(planGuard(bundle),initial);
  put(path.join(root,'packages/new/package.json'),'{}');assert.notEqual(planGuard(bundle),initial);
  fs.rmSync(path.join(root,'packages'),{recursive:true});assert.equal(planGuard(bundle),initial);
  put(path.join(root,'.pnpmfile.cjs'),'module.exports={}');assert.notEqual(planGuard(bundle),initial);
});
test('plan content keys detect installed mutation through a hardlink alias',t=>{
  const root=fixture(t);put(path.join(root,'node_modules/pkg/code.js'),'module.exports=1;');
  const alias=path.join(root,'alias');fs.linkSync(path.join(root,'node_modules/pkg/code.js'),alias);
  const plan={id:'fixture',patterns:['src/**','node_modules/pkg/**'],
    installedPhysicalRoots:['node_modules/pkg']};
  const bundle={root,plans:{check:plan}};
  const first=new InputIndex(bundle);first.coldScan();
  const identity=inputKey(first.checks.get('check'));
  // Independent bytes establish that the alias changed the project-visible file.
  put(alias,'module.exports=2;');
  assert.equal(fs.readFileSync(path.join(root,'node_modules/pkg/code.js'),'utf8'),'module.exports=2;');
  const next=new InputIndex(bundle);next.coldScan();
  assert.notEqual(inputKey(next.checks.get('check')),identity);
});
test('installed entries are identities that never depend on timing; racy files are tracked',async t=>{
  const root=fixture(t),file=path.join(root,'node_modules/pkg/index.d.ts'),rel='node_modules/pkg/index.d.ts';
  put(file,'export declare const a: number;\n');
  const plan={id:'fixture',patterns:['src/**','node_modules/pkg/**'],installedPhysicalRoots:['node_modules/pkg']};
  const index=new InputIndex({root,plans:{check:plan}});index.coldScan();
  // A just-written installed file is not read; it is tracked until its window ends.
  const source=fs.statSync(path.join(root,'src/main.ts')).size;
  assert.equal(index.rehashedBytes,source);
  assert(index.racy.has(rel));assert(index.racyUntil(['check'])>Date.now());
  assert.equal(index.racyUntil(['other']),0);
  const fresh=index.files.get(rel);
  await new Promise(resolve=>setTimeout(resolve,2100));
  // Leaving the window changes nothing, in this index or a new one.
  index.settleRacy();assert(!index.racy.has(rel));assert.equal(index.files.get(rel),fresh);
  const aged=new InputIndex({root,plans:{check:plan}});aged.coldScan();
  assert(!aged.racy.has(rel));assert.equal(aged.files.get(rel),fresh);
  // Restored bytes are a new identity.
  fs.writeFileSync(file,'export declare const a: number;\n');
  assert.equal(index.record(rel,'rewrite'),true);assert.notEqual(index.files.get(rel),fresh);
});
