// Install the actual npm tarball into an owned prefix; never touch a global install.
// Also serves as a reproducible, truthful terminal demo (fresh CLI processes).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {readArtifact} from './package-artifact.mjs';

const product=process.cwd();
const productPackage=JSON.parse(fs.readFileSync(path.join(product,'package.json'),'utf8'));
assert.equal(productPackage.bin.redue,'./bin/redue.mjs');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-package-'));
const prefix=path.join(base,'prefix'),root=path.join(base,'Project é'),state=path.join(base,'redue-state');
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
const npm=findExecutable('npm'),demo=process.argv.includes('--demo');
const tarballAt=process.argv.indexOf('--tarball');
const manifestAt=process.argv.indexOf('--manifest');
assert(tarballAt<0||manifestAt<0,'Choose --tarball or --manifest');
const suppliedArtifact=manifestAt<0?null:readArtifact(path.resolve(process.argv[manifestAt+1]||''));
if(suppliedArtifact){assert.equal(suppliedArtifact.metadata.name,productPackage.name);assert.equal(suppliedArtifact.metadata.version,productPackage.version);}
const suppliedTarball=suppliedArtifact?.file||(tarballAt<0?null:path.resolve(process.argv[tarballAt+1]||''));
if(suppliedTarball)assert(fs.statSync(suppliedTarball).isFile(),'--tarball needs an existing package file');
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
  const pack=suppliedTarball?{filename:path.basename(suppliedTarball),size:fs.statSync(suppliedTarball).size}:
    JSON.parse(exec([npm,'pack','--json','--pack-destination',base]).stdout)[0];
  if(pack.files){
    assert(pack.files.some(f=>f.path==='src/linux-inotify.py'));
    assert(!pack.files.some(f=>/^(?:test\/|\.local\/|\.github\/|docs\/acceptance\/|node_modules\/)/.test(f.path)));
  }
  const tarball=suppliedTarball||path.join(base,pack.filename);
  const packageSha256=createHash('sha256').update(fs.readFileSync(tarball)).digest('hex');
  console.log(`Package: ${pack.filename}; ${pack.size} bytes; sha256 ${packageSha256}`);
  exec([npm,'install','--global','--prefix',prefix,'--no-audit','--no-fund',tarball]);
  const installedRoot=path.join(prefix,...(process.platform==='win32'?[]:['lib']),'node_modules',...productPackage.name.split('/'));
  const installedPackage=JSON.parse(fs.readFileSync(path.join(installedRoot,'package.json'),'utf8'));
  assert.equal(installedPackage.name,productPackage.name);
  assert.equal(installedPackage.version,productPackage.version);
  assert.deepEqual(installedPackage.bin,productPackage.bin);
  assert.match(exec([binary,'--help']).stdout,/Usage: redue/);
  assert.equal(exec([binary,'--version']).stdout.trim(),productPackage.version);
  fs.mkdirSync(root);
  assert.match(exec([binary,'status'],{cwd:root,allowFailure:true}).stderr,/run redue init/);
  put(path.join(root,'package.json'),JSON.stringify({name:'redue-demo',version:'1.0.0',
    scripts:{typecheck:'tsc --noEmit',test:'node test.mjs'},devDependencies:{typescript:'5.6.3'}}));
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true},include:['src']}));
  put(path.join(root,'src/main.ts'),'export const answer: number = 42;\n');
  put(path.join(root,'test.mjs'),"console.log('Ordinary check output');\n");
  put(path.join(root,'.gitignore'),'node_modules/\n');
  // Exercise a normal project installation, including npm's lockfile and native
  // command shims. Never substitute a manually assembled installation as proof.
  exec([npm,'install','--no-audit','--no-fund'],{cwd:root});
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'node_modules','typescript','package.json'))).version,'5.6.3');
  exec(['git','init','-q'],{cwd:root});exec(['git','add','.'],{cwd:root});
  const preview=JSON.parse(cli('init','--recipe','typescript-direct','--dry-run','--json'));
  console.log(`Init preview: ${JSON.stringify(preview)}`);
  if(preview.checks[0]?.level!=='ready'){
    const canonical=fs.realpathSync.native(root);
    console.log(`Fixture prerequisites: ${JSON.stringify({
      manifest:JSON.parse(fs.readFileSync(path.join(root,'package.json'))),
      paths:[root,canonical].map(dir=>({dir,files:['tsconfig.json','node_modules/typescript/package.json']
        .map(file=>{const full=path.join(dir,file);let access=null;try{fs.accessSync(full);}catch(e){access=e.code;}
          return {file,exists:fs.existsSync(full),access};})}))})}`);
    const entry=path.join(installedRoot,'bin','redue.mjs');
    console.log(`Direct Node preview: ${exec([process.execPath,entry,'init','--dry-run','--json'],{cwd:root,allowFailure:true}).stdout}`);
  }
  assert.equal(preview.written,false);assert.equal(preview.checks[0].level,'ready',JSON.stringify(preview));
  console.log(cli('init','--recipe','typescript-direct'));assert(!fs.readFileSync(path.join(root,'redue.config.json'),'utf8').includes(root));
  const agent=(...args)=>exec([binary,'agent',...args],{cwd:root}).stdout;
  const previewAgent=JSON.parse(agent('setup','codex','--dry-run','--json'));
  assert.equal(previewAgent.applied,false);assert(!fs.existsSync(path.join(root,'AGENTS.md')));
  agent('setup','codex','--apply');agent('setup','claude','--apply');
  const instructions=fs.readFileSync(path.join(root,'AGENTS.md'),'utf8');
  agent('setup','codex','--apply');assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),instructions);
  const agentHealth=JSON.parse(exec([binary,'--state-dir',state,'agent','doctor','--json'],{cwd:root}).stdout);
  assert.equal(agentHealth.behavior_verified,false);
  assert(agentHealth.hosts.every(h=>h.integrity==='intact'));
  console.log('Installed activation: preview/setup/doctor/idempotency PASS; host behavior is evaluated separately.');
  console.log(cli('start'));
  if(process.argv.includes('--proxy-context')){
    // Observer was started with its ordinary environment. Only subsequent
    // caller processes receive these synthetic, non-secret proxy settings.
    for(const key of ['proxy','https_proxy','http_proxy','noproxy']){
      const value=key==='noproxy'?'localhost,127.0.0.1':'http://127.0.0.1:3128';
      env['npm_config_'+key]=value;env[('npm_config_'+key).toUpperCase()]=value;
    }
  }
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
  assert.equal(stale.reuse_eligible,false);assert.deepEqual(stale.changed_inputs,['src/main.ts']);
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
  const nested=path.join(root,'src');
  const nestedStatus=JSON.parse(exec([binary,'--state-dir',state,'status','--sync','--json'],{cwd:nested}).stdout);
  assert.equal(nestedStatus.checks[0].invocation.runId,restored.invocation.runId);
  fs.appendFileSync(path.join(root,'AGENTS.md'),'\nUser policy retained.\n');
  agent('remove','codex','--apply');assert(fs.existsSync(path.join(root,'CLAUDE.md')));
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),'\nUser policy retained.\n');
  agent('remove','claude','--apply');assert(!fs.existsSync(path.join(root,'CLAUDE.md')));
  assert.equal(JSON.parse(cli('status','--sync','--json')).checks[0].invocation.runId,restored.invocation.runId);
  console.log('Installed activation: nested state identity/removal/preserved receipt PASS.');
  console.log(cli('remove-state'));assert(!fs.existsSync(state));
  assert(fs.existsSync(path.join(root,'src/main.ts')));assert(fs.existsSync(path.join(root,'node_modules','typescript','lib','tsc.js')));
  exec([npm,'uninstall','--global','--prefix',prefix,productPackage.name,'--no-audit','--no-fund']);
  assert(!fs.existsSync(binary));assert(!fs.existsSync(installedRoot));
  console.log(JSON.stringify({platform:process.platform,node:process.version,package:pack.filename,
    packageBytes:pack.size,packageSha256,observations,cleanup:'owned state and installation only; project/dependencies preserved'}));
} finally {
  if(fs.existsSync(state)&&fs.existsSync(binary))exec([binary,'--state-dir',state,'remove-state'],{cwd:base,allowFailure:true});
  // base was created by this process and contains only this disposable experiment.
  fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
