import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';

// Two configurations the direct recipe used to refuse: a root config with
// `incremental: true`, whose run reads and writes one build-info file, and a
// root config that references a composite config it never consumes.
const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const sourceTypeScript=path.dirname(require.resolve((process.env.REDUE_TEST_COMPILER_PACKAGE||'typescript')+'/package.json'));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
const supported=['darwin','linux'].includes(process.platform);

function fixture(t,{tsconfig,files={}}){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-inc-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-s');
  put(path.join(root,'package.json'),JSON.stringify({name:'incremental-fixture',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit'}}));
  put(path.join(root,'package-lock.json'),'{"name":"incremental-fixture","lockfileVersion":3}');
  put(path.join(root,'tsconfig.json'),JSON.stringify(tsconfig));
  put(path.join(root,'src/main.ts'),'export const value: number = 1;\n');
  for(const [file,text] of Object.entries(files))put(path.join(root,file),text);
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.cpSync(sourceTypeScript,path.join(root,'node_modules/typescript'),{recursive:true});
  execFileSync('git',['init','-q'],{cwd:root});
  const env=Object.fromEntries(Object.entries(process.env)
    .filter(([key])=>!/^npm_config_/i.test(key)&&!/^NODE_/i.test(key)));
  const f={base,root,state,env:{...env,VSTATE_START_READY_WAIT_MS:'10000'}};
  t.after(()=>{try{call(f,'stop');}catch{}fs.rmSync(base,{recursive:true,force:true});});
  ok(f,'init','--recipe','typescript-direct');ok(f,'start');
  return f;
}
function call(f,...args){return spawnSync(process.execPath,[bin,'--state-dir',f.state,...args],
  {cwd:f.root,env:f.env,encoding:'utf8',timeout:45000});}
function ok(f,...args){const out=call(f,...args);
  assert.equal(out.status,0,`${args.join(' ')}: ${out.stderr}\n${out.stdout}`);return out.stdout;}
const sync=f=>JSON.parse(ok(f,'status','--sync','--json')).checks[0];
const receipt=f=>JSON.parse(fs.readFileSync(path.join(f.state,'receipts-v1.json'),'utf8')).checks.typecheck;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const shown=row=>`${row.freshness}/${row.result}/${row.reuse_eligible}: ${row.reason}`;
async function current(f){let row;for(let n=0;n<50;n++){row=sync(f);if(row.freshness==='CURRENT')return row;await wait(100);}return row;}
import {withoutBuildInfo} from '../src/direct-run-certificate.mjs';

test('an incremental root config is reusable; its build-info file is not an input',{skip:!supported},async t=>{
  const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true,incremental:true,
    tsBuildInfoFile:'node_modules/.cache/tsconfig.tsbuildinfo'},include:['src']},
    files:{'node_modules/.cache/.keep':''}});
  const info=path.join(f.root,'node_modules/.cache/tsconfig.tsbuildinfo');
  for(const pass of ['writes the file','reads it back']){
    ok(f,'run','typecheck');
    assert.equal(receipt(f).stable,true,`${pass}: ${JSON.stringify(receipt(f).checkpoint)}`);
    assert(fs.existsSync(info),pass);
    const row=await current(f);assert.equal(`${row.freshness}/${row.result}/${row.reuse_eligible}`,'CURRENT/PASS/true',shown(row));
  }
  // tsc's own state: changing it is not an input change.
  fs.appendFileSync(info,' ');await wait(300);
  assert.equal((await current(f)).freshness,'CURRENT');
  fs.appendFileSync(path.join(f.root,'src/main.ts'),'export const more = 2;\n');
  assert.equal(sync(f).freshness,'STALE');
  ok(f,'run','typecheck');assert.equal((await current(f)).freshness,'CURRENT');
});

test('an incremental root config with the default build-info location is reusable',{skip:!supported},async t=>{
  const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true,incremental:true},include:['src']}});
  ok(f,'run','typecheck');ok(f,'run','typecheck');
  assert(fs.existsSync(path.join(f.root,'tsconfig.tsbuildinfo')));
  const row=await current(f);assert.equal(`${row.freshness}/${row.reuse_eligible}`,'CURRENT/true',shown(row));
});

test('a referenced composite config the program does not use is read, not built',{skip:!supported},async t=>{
  const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true},include:['src'],
    references:[{path:'./tsconfig.node.json'}]},
    files:{'tsconfig.node.json':JSON.stringify({compilerOptions:{composite:true,module:'esnext',moduleResolution:'bundler'},
      include:['vite.config.ts']}),'vite.config.ts':'export default {};\n'}});
  ok(f,'run','typecheck');
  const row=await current(f);assert.equal(`${row.freshness}/${row.result}/${row.reuse_eligible}`,'CURRENT/PASS/true',shown(row));
  // The referenced config is configuration the run read.
  put(path.join(f.root,'tsconfig.node.json'),JSON.stringify({compilerOptions:{composite:true,module:'esnext',
    moduleResolution:'bundler',strict:true},include:['vite.config.ts']}));
  assert.notEqual((await (async()=>{await wait(300);return sync(f);})()).freshness,'CURRENT');
});

test('a program that uses a referenced project\'s files is not qualified',{skip:!supported},async t=>{
  const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true},include:['src'],
    references:[{path:'./shared'}]},
    files:{'shared/tsconfig.json':JSON.stringify({compilerOptions:{composite:true,outDir:'dist'},include:['index.ts']}),
      'shared/index.ts':'export const shared = 1;\n','src/use.ts':'import {shared} from "../shared/index";\nexport const used = shared;\n',
      // As `tsc -b` would leave it; plain tsc then uses this output.
      'shared/dist/index.d.ts':'export declare const shared = 1;\n'}});
  call(f,'run','typecheck');
  let row=sync(f);
  for(let n=0;n<50&&/reconciliation pending|plan rebuilding/.test(row.reason);n++){await wait(100);row=sync(f);}
  assert.notEqual(row.freshness,'CURRENT');assert.match(row.reason,/referenced project/);
});

test('only the configured build-info file may be written, and its checks are left out',{skip:!supported},()=>{
  const info='/p/node_modules/.cache/tsconfig.tsbuildinfo';
  const facts=[['read',info,null],['stat','/p/node_modules/.cache',null],['stat','/p/node_modules','d'],
    ['mkdir','/p/node_modules/.cache',null],['write',info,null],['stat','/p/src/a.ts','f'],['read','/p/src/a.ts','h']];
  // Only the directory tsc created goes; the parent check stays for comparison.
  assert.deepEqual(withoutBuildInfo(facts,info).facts,[['stat','/p/node_modules','d'],['stat','/p/src/a.ts','f'],['read','/p/src/a.ts','h']]);
  assert.match(withoutBuildInfo([['write','/p/other.tsbuildinfo',null]],info).issue,/wrote \/p\/other\.tsbuildinfo/);
  assert.match(withoutBuildInfo([['write',info,null]],null).issue,/wrote/);
  assert.match(withoutBuildInfo([['mkdir','/p/elsewhere',null]],info).issue,/created \/p\/elsewhere/);
  // An existing directory: its checks stay.
  assert.deepEqual(withoutBuildInfo([['stat','/p/node_modules/.cache','d'],['stat','/p/node_modules','d']],info).facts,
    [['stat','/p/node_modules/.cache','d'],['stat','/p/node_modules','d']]);
});

test('incremental settings that make the result depend on build history, or an unusual build-info name, are refused',
  {skip:!supported},async t=>{
  for(const [options,reason] of [[{assumeChangesOnlyAffectDirectDependencies:true},/depend on build history/],
    [{tsBuildInfoFile:'state/tsc.json'},/ending in \.tsbuildinfo/],
    [{tsBuildInfoFile:'out/[gen]/tsconfig.tsbuildinfo'},/ending in \.tsbuildinfo/]]){
    const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true,incremental:true,...options},include:['src']}});
    // On Linux the run creating a new directory is an observation gap; wait it out.
    call(f,'run','typecheck');let row=sync(f);
    for(let n=0;n<50&&/reconciliation pending|plan rebuilding/.test(row.reason);n++){await wait(100);row=sync(f);}
    assert.notEqual(row.freshness,'CURRENT',JSON.stringify(options));assert.match(row.reason,reason,JSON.stringify(options)+': '+row.reason);
  }
});

test('a declaration file shared with a referenced project is an ordinary input',{skip:!supported},async t=>{
  const f=fixture(t,{tsconfig:{compilerOptions:{noEmit:true,strict:true},include:['src','types'],
    references:[{path:'./tsconfig.node.json'}]},
    files:{'tsconfig.node.json':JSON.stringify({compilerOptions:{composite:true},include:['vite.config.ts','types']}),
      'vite.config.ts':'export default {};\n','types/env.d.ts':'declare const BUILD: string;\n'}});
  ok(f,'run','typecheck');
  const row=await current(f);assert.equal(`${row.freshness}/${row.reuse_eligible}`,'CURRENT/true',shown(row));
});
