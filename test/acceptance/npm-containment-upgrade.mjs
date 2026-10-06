// Real public alpha.3 npm receipt -> installed containment, same config/state.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {readArtifact} from './package-artifact.mjs';
const product=process.cwd(),base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rn-')));
const root=path.join(base,'project'),state=path.join(base,'redue-state');
const old=path.join(base,'old'),next=path.join(base,'next');
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^npm_config_/i.test(k)));
env.VSTATE_START_READY_WAIT_MS='10000';
const home=path.join(base,'home');fs.mkdirSync(home);env.HOME=home;
if(process.platform==='win32')env.USERPROFILE=home;
const npm=findExecutable('npm'),options=['--registry=https://registry.npmjs.org','--cache='+path.join(base,'cache'),'--fetch-retries=0'];
const binary=p=>path.join(p,...(process.platform==='win32'?['redue.cmd']:['bin','redue']));
const hash=b=>createHash('sha256').update(b).digest('hex');
function exec(argv,cwd=product,allowFailure=false){
  const launch=windowsLaunch(argv),r=spawnSync(launch.file,launch.args,{...launch.options,cwd,env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  if(!allowFailure)assert.equal(r.status,0,r.stderr+r.stdout);return r;
}
const call=(prefix,args,allow=false)=>exec([binary(prefix),'--state-dir',state,...args],root,allow);
const rows=()=>Object.fromEntries(fs.readdirSync(path.join(state,'runs-v1')).map(n=>[n,hash(fs.readFileSync(path.join(state,'runs-v1',n)))]));
const at=process.argv.indexOf('--manifest');assert(at>=0,'--manifest required');
const artifact=readArtifact(path.resolve(process.argv[at+1]));
const notes=[];
try{
  for(const [prefix,source] of [[old,'@redue/cli@0.1.0-alpha.3'],[next,artifact.file]])
    exec([npm,'install','--global','--prefix',prefix,source,'--no-audit','--no-fund',...options]);
  fs.mkdirSync(root);fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'npm-upgrade-fixture',version:'1.0.0',scripts:{typecheck:'tsc --noEmit',other:'node -e "console.log(42)"'},devDependencies:{typescript:'5.6.3'}}));
  fs.writeFileSync(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,noEmit:true},include:['src']}));
  fs.writeFileSync(path.join(root,'src/index.ts'),'export const answer: number = 42;\n');
  exec([npm,'install','--no-audit','--no-fund',...options],root);exec(['git','init','-q'],root);
  call(old,['init']);const config=fs.readFileSync(path.join(root,'redue.config.json'));
  call(old,['start']);call(old,['run','typecheck']);
  const before=JSON.parse(call(old,['status','--sync','--json']).stdout).checks[0];
  assert.equal(before.result,'PASS');assert.equal(before.freshness,'CURRENT');assert.equal(before.reuse_eligible,true);
  const history=rows();notes.push({step:'public alpha.3',id:before.invocation.runId,result:before.result,freshness:before.freshness});
  for(const args of [['status','--json'],['status','--sync','--json'],['explain','typecheck','--json']]){
    const r=call(next,args,true);assert.equal(r.status,2);assert.match(r.stderr,/config changed while observer is running/);
    notes.push({step:args.join(' '),obsoleteObserverRejected:true});
  }
  call(next,['stop']);call(next,['start']);
  const after=JSON.parse(call(next,['status','--sync','--json']).stdout).checks[0];
  assert.equal(after.result,'PASS');assert.equal(after.freshness,'UNVERIFIED');assert.equal(after.reuse_eligible,false);
  assert.equal(after.invocation.runId,before.invocation.runId);assert.match(after.reason,/npm launcher/);
  assert.deepEqual(rows(),history);assert.deepEqual(fs.readFileSync(path.join(root,'redue.config.json')),config);
  call(next,['run','typecheck']);const fresh=JSON.parse(call(next,['status','--sync','--json']).stdout).checks[0];
  assert.equal(fresh.result,'PASS');assert.equal(fresh.freshness,'UNVERIFIED');assert.equal(fresh.reuse_eligible,false);
  assert.notEqual(fresh.invocation.runId,before.invocation.runId);
  for(const [name,digest] of Object.entries(history))assert.equal(rows()[name],digest);
  notes.push({step:'same config/state upgrade and new npm run',historicalId:before.invocation.runId,newId:fresh.invocation.runId,historicalRunsPreserved:true,result:fresh.result,freshness:fresh.freshness});
  console.log(JSON.stringify({platform:process.platform,node:process.version,candidateSha256:artifact.sha256,notes}));
}finally{
  if(fs.existsSync(state)){
    const bin=fs.existsSync(binary(next))?next:old;call(bin,['stop'],true);
    call(bin,['remove-state'],true);
  }
  fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
