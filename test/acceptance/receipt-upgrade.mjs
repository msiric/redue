// Receipt-only upgrade acceptance. Both clients are installed npm packages;
// alpha.2 is fetched from public npm, never recreated from current source.
// A direct immutable commit deliberately simulates successful persistence followed
// by lost reload IPC. The injected FAIL is fault data, not a claimed executed test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {processAlive} from '../../src/process-liveness.mjs';
import {readArtifact} from './package-artifact.mjs';

const product=process.cwd(),pkg=JSON.parse(fs.readFileSync(path.join(product,'package.json'),'utf8'));
const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rr-'))),
  root=path.join(base,'project'),state=path.join(base,'redue-state'),
  oldPrefix=path.join(base,'old'),nextPrefix=path.join(base,'next');
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)));
env.VSTATE_START_READY_WAIT_MS='10000';
const userconfig=path.join(base,'empty.npmrc');fs.writeFileSync(userconfig,'');
const npm=findExecutable('npm'),npmOptions=['--registry=https://registry.npmjs.org',
  '--userconfig='+userconfig,'--cache='+path.join(base,'npm-cache'),'--fetch-retries=0'];
const notes=[];
function exec(command,{cwd=product,allowFailure=false}={}){
  const launch=windowsLaunch(command),started=performance.now();
  const result=spawnSync(launch.file,launch.args,{...launch.options,cwd,env,encoding:'utf8',
    timeout:120000,maxBuffer:8*1024*1024});
  if(!allowFailure)assert.equal(result.status,0,`${command.join(' ')}\n${result.error||''}\n${result.stdout}\n${result.stderr}`);
  return {...result,durationMs:performance.now()-started};
}
const command=prefix=>process.platform==='win32'?path.join(prefix,'redue.cmd'):path.join(prefix,'bin/redue');
const installed=prefix=>path.join(prefix,...(process.platform==='win32'?[]:['lib']),
  'node_modules',...pkg.name.split('/'));
const call=(prefix,args,allowFailure=false)=>exec([command(prefix),'--state-dir',state,...args],
  {cwd:root,allowFailure});
function status(prefix,args=['status','--sync','--json'],expectedCode=0){
  const result=call(prefix,args,true);assert.equal(result.status,expectedCode,result.stderr+result.stdout);
  const value=JSON.parse(result.stdout);return {...value,elapsedMs:result.durationMs};
}
function note(label,value){const row=value.checks[0];notes.push({label,result:row.result,
  freshness:row.freshness,reuseEligible:row.reuse_eligible,runId:row.invocation?.runId,
  durationMs:value.elapsedMs,reason:row.reason});
  console.log(`${label}: ${row.freshness}/${row.result}; run ${row.invocation?.runId}`);return row;}
const manifestAt=process.argv.indexOf('--manifest'),tarballAt=process.argv.indexOf('--tarball');
assert(manifestAt<0||tarballAt<0,'Choose --manifest or --tarball');
let oldSha,candidateSha;
try{
  const manifest=manifestAt<0?null:readArtifact(path.resolve(process.argv[manifestAt+1]||''));
  if(manifest){assert.equal(manifest.metadata.name,pkg.name);assert.equal(manifest.metadata.version,pkg.version);}
  let candidate=manifest?.file||(tarballAt<0?null:path.resolve(process.argv[tarballAt+1]||''));
  if(!candidate){const pack=JSON.parse(exec([npm,'pack','--json','--pack-destination',base,...npmOptions]).stdout)[0];
    candidate=path.join(base,pack.filename);}
  candidateSha=createHash('sha256').update(fs.readFileSync(candidate)).digest('hex');
  const oldPack=JSON.parse(exec([npm,'pack','@redue/cli@0.1.0-alpha.2','--json',
    '--pack-destination',base,...npmOptions]).stdout)[0];
  assert.equal(oldPack.name,'@redue/cli');assert.equal(oldPack.version,'0.1.0-alpha.2');
  const oldTarball=path.join(base,oldPack.filename);
  oldSha=createHash('sha256').update(fs.readFileSync(oldTarball)).digest('hex');
  for(const [prefix,tarball] of [[oldPrefix,oldTarball],[nextPrefix,candidate]])
    exec([npm,'install','--global','--prefix',prefix,'--no-audit','--no-fund',tarball,...npmOptions]);
  assert.equal(exec([command(oldPrefix),'--version']).stdout.trim(),'0.1.0-alpha.2');
  assert.equal(exec([command(nextPrefix),'--version']).stdout.trim(),pkg.version);
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root,'package.json'),'{"name":"public-receipt-upgrade-fixture","version":"1.0.0"}');
  fs.writeFileSync(path.join(root,'input.txt'),'PASS\n');
  fs.writeFileSync(path.join(root,'check.cjs'),"const fs=require('node:fs');process.exitCode=fs.readFileSync('input.txt','utf8')==='PASS\\n'?0:1;\n");
  const categories=['source','generated','installedDependencies','environment','toolchain','runtime'];
  fs.writeFileSync(path.join(root,'redue.config.json'),JSON.stringify({schema:1,checks:[{name:'check',
    command:['@node','check.cjs'],inputs:['input.txt','check.cjs','package.json'],environment:{},
    coverage:Object.fromEntries(categories.map(key=>[key,true])),
    coverageReview:Object.fromEntries(categories.map(key=>[key,'Owned fixture: fixed Node script reads one declared file; no services, external packages, or generated inputs']))}]}));
  exec(['git','init','-q'],{cwd:root});exec(['git','add','.'],{cwd:root});
  call(oldPrefix,['start']);call(oldPrefix,['run','check']);
  const first=note('Released alpha.2 baseline',status(oldPrefix));
  assert.equal(first.freshness,'CURRENT');assert.equal(first.result,'PASS');
  const {readReceipts,commitReceipt}=await import(pathToFileURL(path.join(installed(nextPrefix),'src/state-store.mjs')));
  const prior=readReceipts(state).checks.check;
  const oldImmutable=path.join(state,'runs-v1',first.invocation.runId+'.json'),oldBytes=fs.readFileSync(oldImmutable);
  const latest={...prior,result:'FAIL',stable:false,invocation:{...prior.invocation,
    runId:randomUUID(),exitCode:1,startedAt:Date.now(),reporting:'receipt-fault-injection'},
    checkpoint:{status:'unavailable_or_changed',issues:['simulated reload/capture control unavailable']}};
  commitReceipt(state,'check',latest);
  const latestImmutable=path.join(state,'runs-v1',latest.invocation.runId+'.json'),latestBytes=fs.readFileSync(latestImmutable);
  const legacy=note('Known alpha.2 stale-selection reproduction (fault injection)',status(oldPrefix));
  assert.equal(legacy.invocation.runId,first.invocation.runId);assert.equal(legacy.reuse_eligible,true);
  for(const [args,code] of [[['status','--json'],0],[['status','--sync','--json'],2],
    [['explain','check','--json'],2],[['detail','check','--json'],2]]){
    const row=note('Candidate '+args.join(' '),status(nextPrefix,args,code));
    assert.equal(row.result,'FAIL');assert.equal(row.freshness,'UNVERIFIED');
    assert.equal(row.reuse_eligible,false);assert.equal(row.invocation.runId,latest.invocation.runId);
  }
  call(nextPrefix,['stop']);call(nextPrefix,['start']);
  const recovered=note('Candidate observer after explicit restart',status(nextPrefix));
  assert.equal(recovered.invocation.runId,latest.invocation.runId);assert.equal(recovered.result,'FAIL');
  assert.equal(recovered.freshness,'UNVERIFIED');assert.equal(recovered.reuse_eligible,false);
  assert.deepEqual(fs.readFileSync(oldImmutable),oldBytes);assert.deepEqual(fs.readFileSync(latestImmutable),latestBytes);
  call(nextPrefix,['run','check']);const real=note('Real candidate wrapped rerun',status(nextPrefix));
  assert.equal(real.freshness,'CURRENT');assert.equal(real.result,'PASS');assert.equal(real.reuse_eligible,true);
  assert.notEqual(real.invocation.runId,latest.invocation.runId);
  const beforeFailedCommit=readReceipts(state).checks.check,
    failedCommit={...beforeFailedCommit,result:'FAIL',invocation:{...beforeFailedCommit.invocation,
      runId:randomUUID(),exitCode:1,reporting:'receipt-commit-fault-injection'}},
    rename=fs.renameSync;
  fs.renameSync=function(from,to){
    if(to===path.join(state,'receipts-v1.json'))
      throw Object.assign(Error('injected selector replacement denied'),{code:'EACCES'});
    return rename.call(this,from,to);
  };
  try{assert.throws(()=>commitReceipt(state,'check',failedCommit),/selector replacement denied/);}
  finally{fs.renameSync=rename;}
  const failedCommitFile=path.join(state,'runs-v1',failedCommit.invocation.runId+'.json'),
    failedCommitBytes=fs.readFileSync(failedCommitFile);
  for(const args of [['status','--json'],['status','--sync','--json'],['explain','check','--json']]){
    const row=note('Incomplete selector commit: '+args.join(' '),status(nextPrefix,args));
    assert.equal(row.freshness,'UNVERIFIED');assert.equal(row.reuse_eligible,false);
    assert.match(row.reason,/update incomplete/);
  }
  call(nextPrefix,['stop']);call(nextPrefix,['start']);
  const pending=note('Incomplete selector commit survives restart',status(nextPrefix));
  assert.equal(pending.freshness,'UNVERIFIED');assert.equal(pending.reuse_eligible,false);
  assert.equal(pending.result,'PASS');assert.equal(pending.invocation.runId,real.invocation.runId);
  assert.match(pending.reason,/prior outcome only/);
  call(nextPrefix,['run','check']);const repaired=note('Ordinary wrapped rerun recovers incomplete commit',status(nextPrefix));
  assert.equal(repaired.freshness,'CURRENT');assert.equal(repaired.result,'PASS');assert.equal(repaired.reuse_eligible,true);
  assert.deepEqual(fs.readFileSync(failedCommitFile),failedCommitBytes);
  assert.deepEqual(fs.readFileSync(oldImmutable),oldBytes);assert.deepEqual(fs.readFileSync(latestImmutable),latestBytes);
  call(nextPrefix,['stop']);call(nextPrefix,['start']);
  const inherited=note('Candidate restart inherits real rerun',status(nextPrefix));
  assert.equal(inherited.invocation.runId,repaired.invocation.runId);assert.equal(inherited.freshness,'CURRENT');
  call(nextPrefix,['remove-state']);assert(!fs.existsSync(state));assert(fs.existsSync(path.join(root,'input.txt')));
  for(const prefix of [oldPrefix,nextPrefix]){
    exec([npm,'uninstall','--global','--prefix',prefix,pkg.name,'--no-audit','--no-fund',...npmOptions]);
    assert(!fs.existsSync(command(prefix)));assert(!fs.existsSync(installed(prefix)));
  }
  console.log(JSON.stringify({platform:process.platform,node:process.version,oldVersion:'0.1.0-alpha.2',
    oldPublicTarballSha256:oldSha,candidateVersion:pkg.version,candidateSha256:candidateSha,notes,
    faultInjection:'durable unstable FAIL commit without reload; not a claimed failed command execution',
    cleanup:'only owned state and isolated installation prefixes; immutable runs unchanged until explicit remove-state'}));
}finally{
  if(fs.existsSync(state))for(const prefix of [nextPrefix,oldPrefix])if(fs.existsSync(command(prefix))){
    try{call(prefix,['remove-state'],true);}catch{}if(!fs.existsSync(state))break;
  }
  const lock=path.join(state,'observer.lock');
  if(fs.existsSync(lock)){
    let pid;try{pid=Number(fs.readFileSync(path.join(lock,'pid'),'utf8'));}catch{}
    if(!Number.isSafeInteger(pid)||pid<=0||processAlive(pid))
      throw Error(`Owned observer cleanup could not be established; retained ${base} for inspection`);
  }
  // mkdtemp owns this entire disposable tree; no user/global installation lives here.
  fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
