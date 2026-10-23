import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {partName,runArgv,runConfig,runFromArgv,scriptRunChecks,tscRun,tscRuns} from '../src/typescript-invocation.mjs';

test('tsc script forms: argument order, projects and && chains',()=>{
  assert.deepEqual(tscRuns('tsc --noEmit'),[{args:['--noEmit'],project:null,noEmit:true}]);
  assert.deepEqual(tscRuns('tsc -p tsconfig.app.json --noEmit').map(run=>run.project),['tsconfig.app.json']);
  assert.deepEqual(tscRuns('tsc --noEmit --project ./src/tsconfig.json --skipLibCheck')[0],
    {args:['--noEmit','--project','./src/tsconfig.json','--skipLibCheck'],project:'./src/tsconfig.json',noEmit:true});
  assert.deepEqual(tscRuns('tsc --noEmit --pretty false')[0].args,['--noEmit','--pretty','false']);
  assert.deepEqual(tscRuns('tsc -p tsconfig.build.json --noEmit && tsc -p tsconfig.spec.json --noEmit').map(run=>run.project),
    ['tsconfig.build.json','tsconfig.spec.json']);
  assert.equal(tscRuns('tsc -p .')[0].noEmit,false);
  for(const text of ['tsc -b','tsc --build tsconfig.json','tsc --noEmit --watch','tsc --noEmit -p','tsc -p a -p b --noEmit',
    'tsc --noEmit --incremental','vue-tsc --noEmit','npx tsc --noEmit','tsc --noEmit; rm -rf x','tsc --noEmit && eslint .',
    'tsc --noEmit || true','tsc --noEmit -p "a b.json"','tsc --noEmit $FLAGS','tsc --noEmit &&tsc -p x','','  '])
    assert.equal(tscRuns(text),null,text);
});

test('a check run is one of its script\'s runs, or stands alone without a script',()=>{
  const scripts={typecheck:'tsc -p a.json --noEmit && tsc --noEmit -p b.json',single:'tsc --noEmit',pre:'tsc --noEmit',prepre:'echo'};
  assert.ok(tscRun(scripts,{script:'typecheck',args:['--noEmit','-p','b.json'],count:2}).run);
  assert.match(tscRun(scripts,{script:'typecheck',args:['-p','b.json','--noEmit'],count:2}).issue,/changed/);
  // The configured count must be the script's: a run added or removed is a change.
  assert.match(tscRun(scripts,{script:'typecheck',args:['--noEmit','-p','b.json']}).issue,/changed/);
  assert.match(tscRun(scripts,{script:'single',args:['--noEmit'],count:2}).issue,/changed/);
  assert.ok(tscRun(scripts,{script:'single',args:['--noEmit']}).run);
  assert.match(tscRun(scripts,{script:'pre',args:['--noEmit']}).issue,/pre or post/);
  assert.match(tscRun(scripts,{script:'gone',args:['--noEmit']}).issue,/removed/);
  assert.ok(tscRun({},{script:null,args:['--noEmit']}).run);
  // Each argument is one word: tsc gets exactly what was checked.
  for(const args of [['--noEmit','--watch'],['-p','tsconfig.json --noEmit'],['--noEmit',''],['--noEmit','@x']])
    assert.match(tscRun({},{script:null,args}).issue,/outside/,JSON.stringify(args));
  assert.equal(tscRuns(Array.from({length:17},()=>'tsc --noEmit').join(' && ')),null);
  const checks=[{name:'a',args:['--noEmit']},{name:'b',args:['--noEmit','-p','b.json']}];
  assert.deepEqual(scriptRunChecks('tsc --noEmit -p b.json && tsc --noEmit',checks),['b','a']);
  for(const text of ['tsc --noEmit','tsc --noEmit && tsc --noEmit -p c.json','tsc --noEmit && tsc --noEmit -p b.json && tsc --noEmit'])
    assert.equal(scriptRunChecks(text,checks),null,text);
});

test('run config paths, part names and probe arguments',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-run-config-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.mkdirSync(path.join(dir,'src'));
  assert.equal(runConfig(dir,['--noEmit']),'tsconfig.json');
  assert.equal(runConfig(dir,['-p','.','--noEmit']),'tsconfig.json');
  assert.equal(runConfig(dir,['--noEmit','-p','./src/tsconfig.json']),'src/tsconfig.json');
  assert.equal(runConfig(dir,['--project','src','--noEmit']),'src/tsconfig.json');
  assert.equal(runConfig(dir,['-p','../x.json','--noEmit']),null);
  assert.equal(runConfig(dir,['--watch']),null);
  assert.equal(partName('typecheck',1,1),'typecheck');
  assert.equal(partName('typecheck',2,3),'typecheck.2');
  const run={script:'typecheck',args:['--noEmit','-p','b.json'],count:2};
  assert.deepEqual(runArgv(run),['typecheck','2','--noEmit','-p','b.json']);
  assert.deepEqual(runFromArgv(runArgv(run)),run);
  assert.deepEqual(runFromArgv(runArgv({args:['--noEmit']})),{script:null,args:['--noEmit'],count:1});
  for(const values of [[],['typecheck'],['typecheck','x','--noEmit'],['typecheck','0','--noEmit']])
    assert.throws(()=>runFromArgv(values),/probe-arguments/,JSON.stringify(values));
});
