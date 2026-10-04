// Install the actual npm tarball into an owned prefix; never touch a global install.
// Also serves as a reproducible, truthful terminal demo (fresh CLI processes).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';

const require=createRequire(import.meta.url),product=process.cwd();
const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-package-'));
const prefix=path.join(base,'prefix'),root=path.join(base,'Project é'),state=path.join(base,'redue-state');
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
const npm=findExecutable('npm'),demo=process.argv.includes('--demo');
const put=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
function exec(command,{cwd=product,allowFailure=false}={}) {
  const launch=windowsLaunch(command);
  const r=spawnSync(launch.file,launch.args,{...launch.options,cwd,env,encoding:'utf8',timeout:120000,
    maxBuffer:8*1024*1024});
  if(!allowFailure)assert.equal(r.status,0,`${command.join(' ')}\n${r.error||''}\n${r.stdout}\n${r.stderr}`);
  return r;
}
const binary=process.platform==='win32'?path.join(prefix,'redue.cmd'):path.join(prefix,'bin','redue');
const cli=(...args)=>exec([binary,'--state-dir',state,...args],{cwd:root}).stdout;
const observations=[];
async function expect(label,freshness,result='PASS') {
  const until=Date.now()+30000;let value,row;
  do {
    value=JSON.parse(cli('status','--sync','--json'));row=value.checks.find(c=>c.name==='typecheck');
    if(row?.freshness===freshness&&row?.result===result)break;
    if(row?.freshness!=='UNVERIFIED')break;
    await new Promise(r=>setTimeout(r,150));
  }while(Date.now()<until);
  assert.equal(row?.freshness,freshness,JSON.stringify(value));assert.equal(row.result,result);
  observations.push({step:label,result:row.result,freshness:row.freshness,runId:row.invocation?.runId});
  console.log(`${label}: ${row.freshness}/${row.result}`);
  if(demo)console.log(cli('explain','typecheck'));
  return row;
}
try {
  const pack=JSON.parse(exec([npm,'pack','--json','--pack-destination',base]).stdout)[0];
  assert(pack.files.some(f=>f.path==='src/linux-inotify.py'));
  assert(!pack.files.some(f=>/^(?:test\/|\.local\/|\.github\/|docs\/acceptance\/|node_modules\/)/.test(f.path)));
  console.log(`Package: ${pack.filename}; ${pack.files.length} files; ${pack.size} bytes`);
  exec([npm,'install','--global','--prefix',prefix,'--no-audit','--no-fund',path.join(base,pack.filename)]);
  assert.match(exec([binary,'--help']).stdout,/Usage: redue/);
  assert.equal(exec([binary,'--version']).stdout.trim(),JSON.parse(fs.readFileSync('package.json')).version);
  fs.mkdirSync(root);
  assert.match(exec([binary,'status'],{cwd:root,allowFailure:true}).stderr,/run redue init/);
  put(path.join(root,'package.json'),JSON.stringify({name:'redue-demo',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit',test:'node test.mjs'},devDependencies:{typescript:'5.6.3'}}));
  put(path.join(root,'package-lock.json'),JSON.stringify({name:'redue-demo',lockfileVersion:3}));
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'export const answer: number = 42;\n');
  put(path.join(root,'test.mjs'),"console.log('Ordinary check output');\n");
  put(path.join(root,'.gitignore'),'node_modules/\n');
  fs.mkdirSync(path.join(root,'node_modules','.bin'),{recursive:true});
  fs.cpSync(path.dirname(require.resolve('typescript/package.json')),path.join(root,'node_modules','typescript'),{recursive:true});
  if(process.platform==='win32')fs.copyFileSync(path.resolve('node_modules/.bin/tsc.cmd'),path.join(root,'node_modules/.bin/tsc.cmd'));
  else fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules','.bin','tsc'));
  exec(['git','init','-q'],{cwd:root});exec(['git','add','.'],{cwd:root});
  const preview=JSON.parse(cli('init','--dry-run','--json'));
  assert.equal(preview.written,false);assert.equal(preview.checks[0].level,'ready');
  console.log(cli('init'));assert(!fs.readFileSync(path.join(root,'redue.config.json'),'utf8').includes(root));
  console.log(cli('start'));
  console.log('Agent A (a separate CLI process) records the check.');
  console.log(cli('run','typecheck'));
  const first=await expect('Agent A recorded','CURRENT');
  console.log('Agent B starts without conversation history. Cached status first:');
  console.log(cli('status'));
  const inherited=await expect('Agent B synchronized inherited evidence','CURRENT');
  assert.equal(first.invocation.runId,inherited.invocation.runId);
  put(path.join(root,'notes.md'),'Unrelated documentation.\n');
  await expect('Unrelated documentation','CURRENT');
  put(path.join(root,'src/main.ts'),'export const answer: number = 43;\n');
  const stale=await expect('Relevant source edit','STALE');assert.equal(stale.invocation.runId,first.invocation.runId);
  assert.deepEqual(stale.changed_inputs,['src/main.ts']);
  console.log(cli('run','typecheck'));const restored=await expect('Rerun','CURRENT');
  assert.notEqual(first.invocation.runId,restored.invocation.runId);
  const recording=cli('run','test');assert.match(recording,/Ordinary check output/);
  assert.match(recording,/UNVERIFIED/);
  const details=JSON.parse(cli('explain','test','--json'));
  assert.equal(details.checks[0].result,'PASS');assert.equal(details.checks[0].reuse_eligible,false);
  console.log(cli('stop'));
  assert.equal(JSON.parse(cli('status','--json')).checks[0].freshness,'UNVERIFIED');
  console.log(cli('start'));const restart=await expect('Restart and reconciliation','CURRENT');
  assert.equal(restart.invocation.runId,restored.invocation.runId);
  assert.match(cli('status','--short'),/^REDUE UNVERIFIED/);
  console.log(cli('remove-state'));assert(!fs.existsSync(state));
  assert(fs.existsSync(path.join(root,'src/main.ts')));assert(fs.existsSync(path.join(root,'node_modules','typescript','lib','tsc.js')));
  exec([npm,'uninstall','--global','--prefix',prefix,'redue','--no-audit','--no-fund']);
  assert(!fs.existsSync(binary));
  console.log(JSON.stringify({platform:process.platform,node:process.version,package:pack.filename,
    packageBytes:pack.size,observations,cleanup:'owned state and installation only; project/dependencies preserved'}));
} finally {
  if(fs.existsSync(state)&&fs.existsSync(binary))exec([binary,'--state-dir',state,'remove-state'],{cwd:base,allowFailure:true});
  // base was created by this process and contains only this disposable experiment.
  fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
