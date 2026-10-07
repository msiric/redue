import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {compilerFiles,queriesMatch} from '../src/typescript-list.mjs';
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
