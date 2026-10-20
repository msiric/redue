import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {recordedEnvironment,testGuardConfig,testRunGuard} from '../src/test-direct.mjs';

const unsupported=process.platform==='win32'?'the test recipe records runs on macOS and Linux':false;
const patterns=['**','!node_modules/**','!.git/**','!**/*.md'];

// Runs `script` as a recorded run in a fresh checkout and returns the guard's verdict.
async function recorded(script,{files={},env={},setup}={}){
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-guard-')));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-guard-record-'));
  try{
    for(const [file,text] of Object.entries(files)){
      fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);}
    setup?.(root);
    fs.writeFileSync(path.join(root,'run.cjs'),script);
    const callerEnv={...process.env,...env};
    const guard=path.join(dir,'guard.json');
    fs.writeFileSync(guard,JSON.stringify(testGuardConfig(dir,root,callerEnv)));
    const child=spawn(process.execPath,['run.cjs'],{cwd:root,env:recordedEnvironment(guard,callerEnv),stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    const code=await new Promise(resolve=>child.on('close',resolve));
    const observed=Object.fromEntries(['run.cjs',...Object.keys(files)].map(file=>[file,'digest']));
    return {code,output,root,...testRunGuard(dir,{root,sourcePatterns:patterns,files:observed,runner:child.pid}),
      after:check=>check(root)};
  }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(dir,{recursive:true,force:true});}
}

test('a run that reads only observed inputs has no issues',{skip:unsupported},async()=>{
  const r=await recorded(`const fs=require('fs');fs.readFileSync('src/a.js');fs.promises.readFile('src/b.js').then(()=>
    fs.readFile('src/c.js',()=>fs.createReadStream('src/a.js').on('close',()=>process.stdout.write('done')).resume()));`,
  {files:{'src/a.js':'a','src/b.js':'b','src/c.js':'c'}});
  assert.equal(r.code,0,r.output);
  assert.match(r.output,/done/);
  assert.deepEqual(r.issues,[]);
});

test('reading an excluded file is an issue unless the same process created it',{skip:unsupported},async()=>{
  const r=await recorded(`const fs=require('fs');fs.readFileSync('README.md');
    fs.mkdirSync('out');fs.writeFileSync('out/x.md','x');fs.readFileSync('out/x.md');
    fs.mkdirSync('docs',{recursive:true});fs.readFileSync('docs/a.md');
    try{fs.mkdirSync('docs');}catch{}fs.appendFileSync('docs/b.md','more');fs.readFileSync('docs/b.md');
    fs.closeSync(fs.openSync('docs/c.md',fs.constants.O_RDWR));
    try{fs.readFileSync('MISSING.md');}catch{}`,{files:{'README.md':'# hi','docs/a.md':'a','docs/b.md':'b','docs/c.md':'c'}});
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,["read MISSING.md, which the check's inputs exclude","read README.md, which the check's inputs exclude",
    "read docs/a.md, which the check's inputs exclude","read docs/b.md, which the check's inputs exclude",
    "read docs/c.md, which the check's inputs exclude"]);
});

test('existence checks and listings of unobserved checkout paths become run facts',{skip:unsupported},async()=>{
  const r=await recorded(`const fs=require('fs');fs.existsSync('NOTES.md');fs.existsSync('CHANGES.md');fs.readdirSync('docs');
    fs.existsSync('.env.local');fs.existsSync('src/a.js');fs.existsSync('src/new.js');
    fs.mkdirSync('made');fs.writeFileSync('made/x.md','x');fs.readdirSync('.');`,
  {files:{'docs/a.md':'a','CHANGES.md':'c','src/a.js':'a'},setup:root=>fs.writeFileSync(path.join(root,'.env.local'),'X=1')});
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,[]);
  const facts=Object.fromEntries(r.runFacts.map(([kind,file,answer])=>[`${kind} ${path.relative(r.root,file)||'.'}`,answer]));
  assert.equal(facts['fileExists NOTES.md'],null);
  assert.equal(facts['fileExists CHANGES.md'],true);
  assert.equal(facts['fileExists .env.local'],true,'ignored, so not in the index');
  assert.deepEqual(facts['entries docs'],[['a.md','f']]);
  assert.ok(facts['entries .'].some(([name])=>name==='made'),'the run made it, so the listing is kept as it is now');
  assert.equal(facts['fileExists src/a.js'],undefined,'observed inputs need no facts');
  assert.equal(facts['fileExists src/new.js'],null,'a missing path may be ignored by git, so it is asked again');
});

test('reading a file the index does not observe is an issue; a missing input is not',{skip:unsupported},async()=>{
  const r=await recorded(`const fs=require('fs');fs.readFileSync('.env.local');try{fs.readFileSync('later.js');}catch{}`,
    {setup:root=>fs.writeFileSync(path.join(root,'.env.local'),'X=1')});
  assert.deepEqual(r.issues,['read .env.local, which REDUE does not observe (ignored by git)']);
});

test('lookups outside the project become run facts; reads outside are issues; temporary files are not',{skip:unsupported},async()=>{
  const missing=path.join(fs.realpathSync('/'),'redue-guard-missing-'+process.pid);
  const r=await recorded(`const fs=require('fs'),os=require('os'),path=require('path');
    fs.existsSync(${JSON.stringify(missing)});
    try{fs.statSync(${JSON.stringify(missing)});}catch{}
    const t=path.join(os.tmpdir(),'redue-guard-'+process.pid);fs.writeFileSync(t,'x');fs.readFileSync(t);fs.rmSync(t);
    fs.readFileSync('/etc/hosts');fs.statSync('/usr');`);
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,[`read ${fs.realpathSync('/etc')}/hosts, outside the project`]);
  assert.deepEqual(r.runFacts.filter(f=>f[1]===missing),[['fileExists',missing,null]]);
  assert.ok(r.runFacts.some(([kind,file,answer])=>kind==='directoryExists'&&file==='/usr'&&answer===true));
});

test('environment: every directly read variable is kept by value; display variables and copies are not',{skip:unsupported},async()=>{
  const r=await recorded(`const copy={...process.env};Object.keys(process.env);process.env.REDUE_GUARD_OWN='x';
    void process.env.NODE_ENV,process.env.TERM,process.env.REDUE_GUARD_OWN,process.env.LC_ALL;
    void process.env.REDUE_GUARD_SET;void ('REDUE_GUARD_UNSET' in process.env);
    require('child_process').spawnSync(process.execPath,['-e','void process.env.REDUE_GUARD_CHILD'],{stdio:'inherit'});`,
  {env:{REDUE_GUARD_SET:'1',REDUE_GUARD_CHILD:'2',NODE_ENV:'test'}});
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,[]);
  const digest=value=>createHash('sha256').update(value).digest('hex');
  assert.equal(r.environmentReads.REDUE_GUARD_SET,digest('1'));
  assert.equal(r.environmentReads.REDUE_GUARD_CHILD,digest('2'));
  assert.equal(r.environmentReads.REDUE_GUARD_UNSET,'<unset>');
  assert.equal(r.environmentReads.REDUE_GUARD_OWN,'<unset>','unset in the caller, so it must stay unset');
  for(const key of ['TERM','NODE_ENV','LC_ALL'])assert.equal(key in r.environmentReads,false,key);
  // Only what was read: the copy at the top reads nothing.
  assert.equal('HOME' in r.environmentReads,false);
});

test('replacing process.env and Jest 29 process copies stay recorded',{skip:unsupported},async()=>{
  const r=await recorded(`process.env={...process.env};void process.env.REDUE_GUARD_A;
    const created=require('./node_modules/jest-util/build/createProcessObject.js').default();void created.env.REDUE_GUARD_B;`,
  {env:{REDUE_GUARD_A:'1',REDUE_GUARD_B:'2'},files:{'node_modules/jest-util/build/createProcessObject.js':
    `exports.default=()=>{const p={};p.env=Object.assign({},process.env);return p;};`}});
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,[]);
  assert.deepEqual(Object.keys(r.environmentReads).filter(key=>key.startsWith('REDUE_GUARD')),['REDUE_GUARD_A','REDUE_GUARD_B']);
});

test('network use other than loopback is an issue',{skip:unsupported},async()=>{
  const r=await recorded(`const net=require('net'),dns=require('dns');
    const server=net.createServer(s=>s.end()).listen(0,'127.0.0.1',()=>{
      net.connect(server.address().port,'127.0.0.1').on('close',()=>{
        const far=net.connect({host:'203.0.113.9',port:9});far.on('error',()=>{});far.destroy();
        dns.lookup('localhost',()=>dns.lookup('redue-guard.invalid',()=>server.close()));
      }).resume();
    });`);
  assert.equal(r.code,0,r.output);
  assert.deepEqual(r.issues,['network: 203.0.113.9:9','network: dns redue-guard.invalid']);
});

test('child processes and threads must load the recorder',{skip:unsupported},async()=>{
  const clean=await recorded(`const cp=require('child_process'),{Worker}=require('worker_threads');
    cp.execFileSync(process.execPath,['-e','']);cp.spawnSync(process.execPath,['-e','']);
    if(process.argv[2]!=='child')new Worker('void 0',{eval:true}).on('exit',()=>cp.fork(__filename,['child']));`);
  assert.equal(clean.code,0,clean.output);
  assert.deepEqual(clean.issues,[]);
  const escaped=await recorded(`const cp=require('child_process'),{Worker}=require('worker_threads');
    cp.spawnSync('/bin/sh',['-c','exit 0']);cp.execSync('exit 0');
    new Worker('void 0',{eval:true,env:{}});`);
  assert.equal(escaped.code,0,escaped.output);
  assert.deepEqual(escaped.issues.sort(),['a worker thread did not load the REDUE recorder',
    'started exit 0, which REDUE does not record','started sh, which REDUE does not record'].sort());
});

test('a runner that never loaded the recorder is an issue',{skip:unsupported},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-guard-record-'));
  try{assert.deepEqual(testRunGuard(dir,{root:dir,sourcePatterns:patterns,files:{},runner:12345}).issues,
    ['the test runner did not load the REDUE recorder']);}
  finally{fs.rmSync(dir,{recursive:true,force:true});}
});
