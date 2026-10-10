import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {queryAnswer,queriesMatch} from '../src/typescript-list.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,parseEnvelope,inspectEnvelope,PortableEnvelopeError}
  from '../src/portable-envelope.mjs';
import {importEvidence,readImportedSnapshot} from '../src/portable-store.mjs';
import {portableCommand} from '../src/portable-command.mjs';
import {decidePortableEvidence} from '../src/portable-applicability.mjs';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {commitReceipt} from '../src/state-store.mjs';
import {acquireRunLock} from '../src/run-lock.mjs';
import {portableRuntimeSupported} from '../src/portable-runtime.mjs';

// Independent controls for the facts portable comparison must retain. These
// tests do not grant portable eligibility or replace observer interval checks.
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-boundary-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'));
  return root;
}
const capture=(kind,file)=>[kind,file,queryAnswer(kind,file)];

test('retained absence and directory membership detect newly resolvable candidates',t=>{
  const root=fixture(t),candidate=path.join(root,'src','new.d.ts');
  const absent=capture('fileExists',candidate),members=capture('entries',path.dirname(candidate));
  assert.equal(absent[2],null);assert(queriesMatch([absent,members]));
  fs.writeFileSync(candidate,'declare const added: string;\n');
  assert.equal(queriesMatch([absent]),false);
  assert.equal(queriesMatch([members]),false);
});

test('membership survives neither removal nor rename despite identical content bytes',t=>{
  const root=fixture(t),source=path.join(root,'src','one.ts');
  fs.writeFileSync(source,'export const value = 1;\n');
  const members=capture('entries',path.dirname(source)),content=capture('readFile',source);
  fs.renameSync(source,path.join(root,'src','two.ts'));
  assert.equal(queriesMatch([members]),false);
  assert.equal(queriesMatch([content]),false);
});

test('a restored end-state cannot establish a complete execution interval',t=>{
  const root=fixture(t),source=path.join(root,'src','one.ts'),bytes='export const value = 1;\n';
  fs.writeFileSync(source,bytes);
  const content=capture('readFile',source);
  fs.writeFileSync(source,'export const value: number = "wrong";\n');
  assert.equal(queriesMatch([content]),false);
  fs.writeFileSync(source,bytes);
  assert.equal(queriesMatch([content]),true,
    'equal endpoint facts require separate observer continuity/change-event evidence');
});

test('symlink topology remains distinct even when both targets have identical content',t=>{
  const root=fixture(t),one=path.join(root,'src','one.ts'),two=path.join(root,'src','two.ts'),
    link=path.join(root,'src','selected.ts');
  fs.writeFileSync(one,'export const value = 1;\n');fs.copyFileSync(one,two);
  try{fs.symlinkSync('one.ts',link);}catch(error){
    if(process.platform==='win32'&&['EPERM','EACCES'].includes(error.code)){
      t.skip('native symlink privilege unavailable; no portability claim for this case');return;
    }throw error;
  }
  const content=capture('readFile',link),resolution=capture('realpath',link);
  fs.unlinkSync(link);fs.symlinkSync('two.ts',link);
  assert.equal(queriesMatch([content]),true);
  assert.equal(queriesMatch([resolution]),false,
    'content equality alone must not erase selected resolution topology');
});

const digest=value=>createHash('sha256').update(value).digest('hex');
function portableFixture(){return {schema:1,interpretation:'redue-portable-direct-typescript@1',
  origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'PASS',
    invocation:{status:'exited',exitCode:0,signal:null},complete:true},
  facts:{schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
    command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:digest('recipe')},
    platform:{os:'darwin',arch:'arm64',release:'25.6.0'},
    runtime:{version:'v22.13.0',sha256:digest('runtime'),sharedObjects:[]},
    compiler:{version:'5.6.3',sha256:digest('compiler'),entry:'node_modules/typescript/lib/tsc.js'},
    context:{},files:[['src/value.ts',digest('source')]],
    discovery:{configs:[['tsconfig.json',digest('config')]],
      files:[['src/value.ts',digest('source')]],queriesSha256:digest('queries')}}};}

test('canonical identity retains exact case, Unicode composition, membership and missing-query identity',()=>{
  const original=encodeEnvelope(portableFixture());
  for(const mutate of [p=>p.facts.files[0][0]='src/Value.ts',
    p=>p.facts.files[0][0]='src/é.ts',p=>p.facts.files[0][0]='src/é.ts',
    p=>p.facts.files.push(['src/z.ts',digest('source')]),
    p=>p.facts.discovery.queriesSha256=digest('newly present candidate'),
    p=>p.facts.recipe.definitionSha256=digest('different selected config')]){
    const next=portableFixture();mutate(next);
    assert.notEqual(encodeEnvelope(next).digest,original.digest);
  }
  const composed=portableFixture(),decomposed=portableFixture();
  composed.facts.files[0][0]='src/é.ts';decomposed.facts.files[0][0]='src/é.ts';
  assert.notEqual(encodeEnvelope(composed).digest,encodeEnvelope(decomposed).digest);
});

test('JSON prototype keys are inert data and cannot create inherited trust fields',()=>{
  const predicate=portableFixture();predicate.facts.context=Object.create(null);
  predicate.facts.context.__proto__=digest('data');predicate.facts.context.constructor=digest('other data');
  const parsed=parseEnvelope(canonical(encodeEnvelope(predicate)));
  assert.equal(Object.getPrototypeOf(parsed.statement.predicate.facts.context),null);
  assert.equal({}.producer_accepted,undefined);
  const inspected=inspectEnvelope(canonical(parsed));
  assert.equal(inspected.producer_accepted,false);assert.equal(inspected.reuse_eligible,false);
  assert(Object.isFrozen(parsed.statement.predicate.facts.context));
});

test('valid reported outcome never authenticates origin or repairs missing completeness',()=>{
  for(const result of ['PASS','FAIL']){
    const predicate=portableFixture();predicate.origin.result=result;
    predicate.origin.invocation.exitCode=result==='PASS'?0:1;predicate.origin.complete=false;
    const report=inspectEnvelope(canonical(encodeEnvelope(predicate)));
    assert.equal(report.origin.result,result);assert.equal(report.origin.complete,false);
    assert.equal(report.producer_accepted,false);assert.equal(report.reuse_eligible,false);
  }
  const old=portableFixture();old.origin.complete=false;old.facts=null;
  const parsed=parseEnvelope(canonical(encodeEnvelope(old)));
  assert.equal(parsed.statement.predicate.facts,null);
});

test('pure inspection rejects imported executable or transport instructions',()=>{
  for(const [key,value] of [['command',['sh','-c','touch injected']],
    ['validator','./unreviewed.mjs'],['url','https://example.invalid/evidence'],
    ['trusted',true],['artifactPath','../../outside']]){
    const predicate=portableFixture();predicate[key]=value;
    assert.throws(()=>encodeEnvelope(predicate),PortableEnvelopeError);
  }
});

test('parser rejects encoded duplicate keys and invalid Unicode at data boundaries',()=>{
  const bytes=canonical(encodeEnvelope(portableFixture()));
  for(const input of [bytes.replace('"result":"PASS"','"result":"PASS","resul\\u0074":"FAIL"'),
    bytes.replace('"typecheck"','"\\ud800"'),
    bytes.replace('"typecheck"','"\\udfff"')])assert.throws(()=>parseEnvelope(input),PortableEnvelopeError);
  const utf8=Buffer.from(bytes),invalid=Buffer.concat([utf8.subarray(0,-1),Buffer.from([0xed,0xa0,0x80]),utf8.subarray(-1)]);
  assert.throws(()=>parseEnvelope(invalid),PortableEnvelopeError);
});

test('integer-only origin fields reject number lexemes that underflow or round to integers',()=>{
  const bytes=canonical(encodeEnvelope(portableFixture()));
  for(const token of ['1e-99999','-1e-99999','0.00000000000000000000000000000001',
    '9007199254740990.9','0e0','0.0']){
    const changed=bytes.replace('"exitCode":0',`"exitCode":${token}`);
    assert.throws(()=>parseEnvelope(changed),error=>error instanceof PortableEnvelopeError&&
      error.code==='PORTABLE_NUMBER',token);
  }
});

function ownedStore(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-import-review-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-state'),
    configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(root);fs.mkdirSync(state);fs.writeFileSync(configFile,'{}');
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),JSON.stringify({schema:1,
    kind:'vstate-product-alpha',config:configFile,root,state}));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  return {base,root,state,configFile};
}
const storeOptions=(state,envelope)=>({...state,check:'typecheck',bytes:canonical(envelope),
  acceptDigest:envelope.digest,apply:true});
const importSnapshot=state=>readImportedSnapshot(state.state,{configFile:state.configFile,root:state.root});

test('replaying an old accepted PASS cannot discard an interrupted accepted FAIL import',t=>{
  const state=ownedStore(t),pass=encodeEnvelope(portableFixture());
  importEvidence(storeOptions(state,pass));
  const failing=portableFixture();failing.origin.result='FAIL';failing.origin.invocation.exitCode=1;
  const fail=encodeEnvelope(failing),selector=path.join(state.state,'portable-imports-v1.json'),
    rename=fs.renameSync;
  const fault=t.mock.method(fs,'renameSync',function(from,to){
    if(to===selector)throw Object.assign(Error('injected import selector failure'),{code:'EACCES'});
    return rename.call(fs,from,to);
  });
  assert.throws(()=>importEvidence(storeOptions(state,fail)),error=>
    error instanceof PortableEnvelopeError&&error.code==='PORTABLE_IMPORT_FAILED');
  fault.mock.restore();
  assert(fs.existsSync(path.join(state.state,'portable-evidence-v1',fail.digest+'.json')),
    'fault occurred after immutable failing candidate persisted');
  assert.equal(importSnapshot(state).error?.code,'PORTABLE_IMPORT_INCOMPLETE');
  assert.throws(()=>importEvidence(storeOptions(state,pass)),PortableEnvelopeError,
    'unrelated valid replay cannot replace pending transaction');
  assert.equal(importSnapshot(state).error?.code,'PORTABLE_IMPORT_INCOMPLETE');
  importEvidence(storeOptions(state,fail));
  const snapshot=importSnapshot(state);
  assert.equal(snapshot.error,undefined);
  assert(snapshot.records.some(record=>record.envelope.statement.predicate.origin.result==='FAIL'));
});

test('changed but syntactically valid state ownership cannot retain accepted imports',t=>{
  const state=ownedStore(t),pass=encodeEnvelope(portableFixture());
  importEvidence(storeOptions(state,pass));
  assert.equal(importSnapshot(state).records.length,1);
  const marker=path.join(state.state,'vstate-owner-v1.json'),original=fs.readFileSync(marker);
  const changed=JSON.parse(original);changed.root=path.join(state.base,'different-project');
  fs.writeFileSync(marker,JSON.stringify(changed));
  const snapshot=importSnapshot(state);
  assert.equal(snapshot.records.length,0);assert.equal(snapshot.error?.code,'PORTABLE_OWNERSHIP');
  fs.writeFileSync(marker,original);assert.equal(importSnapshot(state).records.length,1);
});

test('missing catalog cannot replay an old PASS over persisted accepted FAIL history',t=>{
  const state=ownedStore(t),pass=encodeEnvelope(portableFixture());
  importEvidence(storeOptions(state,pass));
  const failing=portableFixture();failing.origin.result='FAIL';failing.origin.invocation.exitCode=1;
  const fail=encodeEnvelope(failing);importEvidence(storeOptions(state,fail));
  const immutable=path.join(state.state,'portable-evidence-v1',fail.digest+'.json'),original=fs.readFileSync(immutable);
  fs.unlinkSync(path.join(state.state,'portable-imports-v1.json'));
  assert.equal(importSnapshot(state).error?.code,'PORTABLE_SELECTION_MISSING');
  assert.throws(()=>importEvidence(storeOptions(state,pass)),error=>error.code==='PORTABLE_SELECTION_MISSING');
  assert.deepEqual(fs.readFileSync(immutable),original);
  assert.equal(importSnapshot(state).records.length,0);
});

test('an initialized empty storage directory is not proof of a pristine missing catalog',t=>{
  const state=ownedStore(t),pass=encodeEnvelope(portableFixture());
  fs.mkdirSync(path.join(state.state,'portable-evidence-v1'));
  assert.equal(importSnapshot(state).error?.code,'PORTABLE_SELECTION_MISSING');
  assert.throws(()=>importEvidence(storeOptions(state,pass)),error=>error.code==='PORTABLE_SELECTION_MISSING');
  assert(!fs.existsSync(path.join(state.state,'portable-imports-v1.json')));
});

test('replacement of a validated stored regular leaf with a FIFO cannot block its bounded reader',
  {skip:process.platform==='win32'},t=>{
  const state=ownedStore(t),pass=encodeEnvelope(portableFixture());importEvidence(storeOptions(state,pass));
  const target=path.join(state.state,'portable-evidence-v1',pass.digest+'.json');
  const module=fileURLToPath(new URL('../src/portable-store.mjs',import.meta.url));
  const script=`import fs from 'node:fs';import {spawnSync} from 'node:child_process';
    import {readImportedSnapshot} from ${JSON.stringify(module)};
    const target=process.argv[1],state=process.argv[2],configFile=process.argv[3],root=process.argv[4];
    const open=fs.openSync;let injected=false;
    fs.openSync=function(file,...args){if(file===target&&!injected){injected=true;
      fs.unlinkSync(target);const made=spawnSync('mkfifo',[target],{encoding:'utf8'});
      if(made.status!==0)throw Error('Owned FIFO prerequisite unavailable');}
      return open.call(fs,file,...args);};
    const snapshot=readImportedSnapshot(state,{configFile,root});
    console.log(JSON.stringify({injected,code:snapshot.error?.code,records:snapshot.records.length}));`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',script,target,
    state.state,state.configFile,state.root],{encoding:'utf8',timeout:3000,maxBuffer:65536});
  assert.equal(child.status,0,`Reader blocked or failed: ${child.error?.code??child.stderr}`);
  const result=JSON.parse(child.stdout);assert.equal(result.injected,true);
  assert(['PORTABLE_STATE_CHANGED','PORTABLE_STATE_UNSAFE'].includes(result.code));
  assert.equal(result.records,0);
});

function exportStore(t){
  const f=ownedStore(t),p=portableFixture(),r={result:p.origin.result,
    invocation:{...p.origin.invocation,runId:p.origin.runId},stable:true,
    coverage:{qualified:true},portable:{schema:1,interpretation:p.interpretation,
      complete:true,facts:p.facts}};
  const runtime={schema:1,root:f.root,state:f.state,checks:[{name:'typecheck'}]},
    publicConfig={schema:1,checks:[{name:'typecheck'}]},ownerConfig=path.join(f.state,'project-runtime-v1.json');
  fs.writeFileSync(path.join(f.state,'vstate-owner-v1.json'),JSON.stringify({schema:1,
    kind:'vstate-product-alpha',root:f.root,state:f.state,config:ownerConfig}));
  fs.writeFileSync(ownerConfig,JSON.stringify(runtime));
  fs.mkdirSync(path.join(f.state,'runs-v1'));
  fs.writeFileSync(path.join(f.state,'receipts-v1.json'),JSON.stringify({schema:1,checks:{typecheck:r}}));
  const historical=path.join(f.state,'runs-v1',r.invocation.runId+'.json');
  fs.writeFileSync(historical,JSON.stringify({schema:1,check:'typecheck',receipt:r}));
  t.mock.method(console,'log',()=>{});
  return {...f,r,runtime,publicConfig,historical,output:path.join(f.base,'export.json')};
}
function replaceOwner(f){
  const marker=path.join(f.state,'vstate-owner-v1.json'),changed=JSON.parse(fs.readFileSync(marker));
  changed.root=path.join(f.base,'different-project');fs.writeFileSync(marker,JSON.stringify(changed));
}
const exporting=f=>portableCommand(['export','typecheck','--output',f.output,'--json'],f);

test('owner replacement while reading immutable origin prevents export',async t=>{
  const f=exportStore(t),open=fs.openSync,read=fs.readSync;let historicalFd=null,changed=false;
  t.mock.method(fs,'openSync',function(file,...args){const fd=open.call(fs,file,...args);
    if(file===f.historical)historicalFd=fd;return fd;});
  t.mock.method(fs,'readSync',function(fd,...args){const count=read.call(fs,fd,...args);
    if(fd===historicalFd&&!changed){changed=true;replaceOwner(f);}return count;});
  await assert.rejects(exporting(f),error=>error.code==='PORTABLE_OWNERSHIP');
  assert(changed);assert.equal(fs.existsSync(f.output),false);
});

test('owner replacement after export persistence removes only the owned incomplete destination',async t=>{
  const f=exportStore(t),sync=fs.fsyncSync;let changed=false;
  t.mock.method(fs,'fsyncSync',function(fd){const result=sync.call(fs,fd);
    if(!changed){changed=true;replaceOwner(f);}return result;});
  await assert.rejects(exporting(f),error=>error.code==='PORTABLE_OWNERSHIP');
  assert(changed);assert.equal(fs.existsSync(f.output),false);
  assert.equal(JSON.parse(fs.readFileSync(f.historical)).receipt.invocation.runId,f.r.invocation.runId);
});

function recipientDecision(records,local=null,revision=digest('catalog')){
  return decidePortableEvidence({check:'typecheck',facts:portableFixture().facts,
    prerequisites:{understood:true,observationHealthy:true,callerValidated:true,complete:true},
    snapshot:{records,revision},local});
}
function candidate(p,acceptance='manual-digest-v1'){
  const envelope=encodeEnvelope(p);
  return {check:'typecheck',digest:envelope.digest,envelope,acceptance};
}
function localOutcome(extra={}){return {present:true,result:'PASS',stable:true,
  invocationStatus:'exited',applicability:'CURRENT',facts:portableFixture().facts,
  resolvedCatalogRevision:null,...extra};}

test('different preliminary facts cannot turn a newer unstable local outcome into harmless history',()=>{
  const different=portableFixture().facts;different.files[0][1]=digest('different start input');
  for(const extra of [{stable:false},{invocationStatus:'interrupted'},{invocationStatus:'start_failed'},
    {result:null},{stable:false,result:'FAIL'}]){
    const decision=recipientDecision([candidate(portableFixture())],localOutcome({
      applicability:'STALE',facts:different,...extra}));
    assert.equal(decision.reason,'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK');
    assert.equal(decision.reuse_eligible,false);assert.equal(decision.local_reuse_blocked,true);
  }
});

test('accepted incomplete origins cannot use different start facts to evade conflict handling',()=>{
  for(const result of ['PASS','FAIL']){
    const incomplete=portableFixture();incomplete.origin.result=result;
    incomplete.origin.invocation.exitCode=result==='PASS'?0:1;incomplete.origin.complete=false;
    incomplete.facts.files[0][1]=digest('different preliminary input');
    const decision=recipientDecision([candidate(portableFixture()),candidate(incomplete)]);
    assert.equal(decision.reason,'PORTABLE_ACCEPTED_ORIGIN_INCOMPLETE');
    assert.equal(decision.reuse_eligible,false);assert.equal(decision.incomplete.length,1);
  }
});

test('resolution binds exact current accepted catalog rather than arrival order or old local PASS',()=>{
  const fail=portableFixture();fail.origin.result='FAIL';fail.origin.invocation.exitCode=1;
  const records=[candidate(fail),candidate(portableFixture())],revision=digest('resolved catalog');
  const resolved=recipientDecision(records,localOutcome({resolvedCatalogRevision:revision}),revision);
  assert.equal(resolved.reason,'PORTABLE_CATALOG_EXPLICITLY_RESOLVED_LOCALLY');
  assert.equal(resolved.reuse_eligible,false,'helper never represents local execution as imported reuse');
  for(const ordered of [records,[...records].reverse()]){
    const changed=recipientDecision(ordered,localOutcome({resolvedCatalogRevision:revision}),digest('changed catalog'));
    assert.equal(changed.reason,'PORTABLE_APPLICABLE_CONFLICT');
    assert.equal(changed.local_reuse_blocked,true);assert.equal(changed.reuse_eligible,false);
  }
  const unaccepted=recipientDecision([candidate(fail,'untrusted')],localOutcome());
  assert.equal(unaccepted.reason,'PORTABLE_LOCAL_CURRENT_SELECTED');
  assert.equal(unaccepted.local_reuse_blocked,false);
});

function observedCompiler(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'redue-origin-review-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-state'),
    bin=fileURLToPath(new URL('../bin/redue.mjs',import.meta.url));
  const cleanupCalls=[];
  t.after(()=>{try{for(const item of cleanupCalls)if(fs.existsSync(item.state))item.call('stop');}
    finally{fs.rmSync(base,{recursive:true,force:true});}});
  const put=(rel,bytes)=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
  put('package.json',JSON.stringify({name:'independent-origin-control',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
  put('package-lock.json','{"lockfileVersion":3}');
  // Controlled same-host origin mechanics, not useful-project adoption: noLib
  // makes every declaration explicit and avoids unobserved ancestor candidates.
  put('tsconfig.json',JSON.stringify({compilerOptions:{strict:true,noEmit:true,noLib:true,
    target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
  put('src/globals.d.ts','interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
  put('src/value.ts','export const value: number = 1;\n');
  const compiler=path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
  fs.cpSync(compiler,path.join(root,'node_modules/typescript'),{recursive:true});
  fs.mkdirSync(path.join(root,'node_modules/.bin'));fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules/.bin/tsc'));
  const git=spawnSync('git',['init','-q'],{cwd:root,encoding:'utf8'});assert.equal(git.status,0,git.stderr);
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
  const args=words=>[bin,'--state-dir',state,...words];
  const call=(...words)=>{const r=spawnSync(process.execPath,args(words),{cwd:root,env,encoding:'utf8',timeout:60000});
    assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
  const selected=()=>JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'))).checks.typecheck;
  const paused=async phase=>{
    for(const name of ['test-run-paused','test-run-release'])try{fs.unlinkSync(path.join(state,name));}catch(e){if(e.code!=='ENOENT')throw e;}
    const child=spawn(process.execPath,args(['run','typecheck','--portable']),{cwd:root,
      env:{...env,VSTATE_TEST_FAULTS:'1',VSTATE_TEST_RUN_BOUNDARY:phase},stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
    const done=new Promise(resolve=>child.on('close',code=>resolve({code,output})));
    const until=Date.now()+15000;
    while(!fs.existsSync(path.join(state,'test-run-paused'))&&Date.now()<until){
      if(child.exitCode!==null)break;await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.equal(fs.readFileSync(path.join(state,'test-run-paused'),'utf8'),phase);
    return {done,release:()=>fs.writeFileSync(path.join(state,'test-run-release'),'release')};
  };
  cleanupCalls.push({state,call});
  call('init','--recipe','typescript-direct');call('start');
  return {base,root,state,put,call,selected,paused,env,bin,
    ownObserver:(state,call)=>cleanupCalls.push({state,call})};
}

test('real portable origin refuses change-and-restore, post-exit membership and lost end observation',
  {skip:!portableRuntimeSupported(),timeout:150000},async t=>{
  const f=observedCompiler(t);
  f.call('run','typecheck','--portable');const baseline=f.selected();
  assert.equal(baseline.result,'PASS');assert.equal(baseline.portable.complete,true);
  const immutable=path.join(f.state,'runs-v1',baseline.invocation.runId+'.json'),original=fs.readFileSync(immutable);
  const source=fs.readFileSync(path.join(f.root,'src/value.ts'));
  let run=await f.paused('before-launch');
  f.put('src/value.ts','export const value: number = 2;\n');f.call('status','--sync','--json');
  f.put('src/value.ts',source);f.call('status','--sync','--json');run.release();
  let done=await run.done;assert.equal(done.code,0,done.output);
  let r=f.selected();assert.equal(r.result,'PASS');assert.equal(r.portable.complete,false);
  assert.equal(r.stable,false);assert(r.checkpoint.issues.includes('declared input event occurred during execution'));
  assert.notEqual(r.invocation.runId,baseline.invocation.runId);
  assert.deepEqual(fs.readFileSync(immutable),original);
  run=await f.paused('after-exit');f.put('src/new.ts','export const added: number = 3;\n');
  f.call('status','--sync','--json');run.release();done=await run.done;assert.equal(done.code,0,done.output);
  r=f.selected();assert.equal(r.result,'PASS');assert.equal(r.portable.complete,false);assert.equal(r.stable,false);
  run=await f.paused('after-exit');f.call('stop');run.release();done=await run.done;assert.equal(done.code,0,done.output);
  r=f.selected();assert.equal(r.result,'PASS');assert.equal(r.portable.complete,false);
  assert(r.checkpoint.issues.includes('end checkpoint unavailable'));
  f.call('start');const status=JSON.parse(f.call('status','--sync','--json')).checks[0];
  assert.equal(status.invocation.runId,r.invocation.runId);assert.equal(status.reuse_eligible,false);
  assert.notEqual(status.freshness,'CURRENT');assert.deepEqual(fs.readFileSync(immutable),original);
});

test('delayed recipient publication never hides newer selection, catalog or observed input changes behind imported PASS',
  {skip:!portableRuntimeSupported(),timeout:150000},async t=>{
  const f=observedCompiler(t);f.call('run','typecheck','--portable');const baseline=f.selected();
  assert.equal(baseline.portable.complete,true);
  const artifact=path.join(f.base,'evidence.json');
  const exported=JSON.parse(f.call('evidence','export','typecheck','--output',artifact,'--json'));
  for(const kind of ['new-fail','incomplete','catalog-fail','source-event']){
    const root=path.join(f.base,'recipient-'+kind),state=path.join(f.base,'redue-recipient-'+kind);
    fs.cpSync(f.root,root,{recursive:true,dereference:false,verbatimSymlinks:true});
    const env={...f.env,VSTATE_TEST_FAULTS:'1',VSTATE_TEST_PORTABLE_PUBLICATION_BARRIER:'1',
      REDUE_PUBLIC_INPUT_TRACE:'1'},
      args=words=>[f.bin,'--state-dir',state,...words];
    const call=(...words)=>{const r=spawnSync(process.execPath,args(words),{cwd:root,env,encoding:'utf8',timeout:60000});
      assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
    f.ownObserver(state,call);call('start');
    // start returns after spawning the observer, not after its asynchronous
    // plan publication. Establish that prerequisite before importing/trialing.
    const planDeadline=Date.now()+15000;
    while(!fs.existsSync(path.join(state,'plans-v1.json'))&&Date.now()<planDeadline)
      await new Promise(resolve=>setTimeout(resolve,10));
    assert(fs.existsSync(path.join(state,'plans-v1.json')),'recipient observer did not publish its plan');
    call('evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest,'--apply','--json');
    const pausedSync=async()=>{
      const child=spawn(process.execPath,args(['status','--sync','--json']),{cwd:root,env,stdio:['ignore','pipe','pipe']});
      let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
      const done=new Promise(resolve=>child.on('close',code=>resolve({code,stdout,stderr})));
      const marker=path.join(state,'test-portable-publish-paused'),until=Date.now()+15000;
      while(!fs.existsSync(marker)&&Date.now()<until){if(child.exitCode!==null)break;
        await new Promise(resolve=>setTimeout(resolve,10));}
      assert(fs.existsSync(marker),stderr);
      return {done,release:()=>fs.writeFileSync(path.join(state,'test-portable-publish-release'),'release')};
    };
    let request=await pausedSync();request.release();let response=await request.done;
    assert.equal(response.code,0,response.stderr);let row=JSON.parse(response.stdout).checks[0];
    assert.equal(row.reuse_eligible,true);assert.equal(row.imported_evidence.origin_run_id,baseline.invocation.runId);
    assert.equal(fs.existsSync(path.join(state,'runs-v1')),false,'recipient performed no equivalent compiler execution');
    request=await pausedSync();
    if(kind==='source-event'){
      const journal=path.join(state,'events.jsonl'),offset=fs.statSync(journal).size;
      fs.writeFileSync(path.join(root,'src/value.ts'),'export const value: number = 2;\n');
      const delivered=()=>fs.readFileSync(journal,'utf8').slice(offset).trim().split('\n')
        .filter(Boolean).map(line=>JSON.parse(line)).some(event=>
          event.kind==='public_input_notification'&&event.path==='src/value.ts');
      const eventDeadline=Date.now()+2000;
      while(!delivered()&&Date.now()<eventDeadline)await new Promise(resolve=>setTimeout(resolve,10));
      assert(delivered(),'owned journal did not establish relevant input event before publication');
      request.release();response=await request.done;
      assert([0,2].includes(response.code),response.stderr);row=JSON.parse(response.stdout).checks[0];
      assert.equal(row.reuse_eligible,false);assert.notEqual(row.freshness,'CURRENT');
      assert.equal(fs.existsSync(path.join(state,'runs-v1')),false);
      continue;
    }
    if(kind==='catalog-fail'){
      // Synthetic claimed origin, explicitly accepted only in this owned fault
      // fixture: an added matching failure changes the catalog publication basis.
      const predicate=structuredClone(parseEnvelope(fs.readFileSync(artifact)).statement.predicate);
      predicate.origin.result='FAIL';predicate.origin.invocation.exitCode=1;
      predicate.origin.runId=randomUUID();
      const conflicting=encodeEnvelope(predicate),file=path.join(f.base,'conflicting.json');
      fs.writeFileSync(file,canonical(conflicting));
      call('evidence','import',file,'--check','typecheck','--accept-digest',conflicting.digest,'--apply','--json');
      request.release();response=await request.done;
      assert([0,2].includes(response.code),response.stderr);row=JSON.parse(response.stdout).checks[0];
      assert.equal(row.reuse_eligible,false);assert.notEqual(row.freshness,'CURRENT');
      assert.equal(fs.existsSync(path.join(state,'runs-v1')),false);
      continue;
    }
    // Controlled receipt-persistence fault, not real recipient execution: the
    // source baseline above is genuine; this synthetic newer outcome challenges
    // generation mixing during final publication without changing its inputs.
    const newer={...baseline,result:'FAIL',stable:false,
      invocation:{...baseline.invocation,runId:randomUUID(),exitCode:1},
      portable:{...baseline.portable,complete:false,resolvedCatalogRevision:null},
      checkpoint:{...baseline.checkpoint,status:'unavailable_or_changed',issues:['controlled missing observation']}};
    const lock=acquireRunLock(state),obstruction=path.join(state,`receipts-v1.json.${process.pid}.tmp`);
    try{
      if(kind==='incomplete')fs.mkdirSync(obstruction);
      if(kind==='incomplete')assert.throws(()=>commitReceipt(state,'typecheck',newer));
      else commitReceipt(state,'typecheck',newer);
    }finally{if(kind==='incomplete')fs.rmdirSync(obstruction);lock.release();}
    request.release();response=await request.done;
    assert([0,2].includes(response.code),response.stderr);row=JSON.parse(response.stdout).checks[0];
    assert.equal(row.reuse_eligible,false);assert.notEqual(row.freshness,'CURRENT');
    if(kind==='new-fail'){assert.equal(row.result,'FAIL');assert.equal(row.invocation.runId,newer.invocation.runId);}
    assert.equal(JSON.parse(fs.readFileSync(path.join(state,'runs-v1',newer.invocation.runId+'.json'))).receipt.result,'FAIL');
  }
});
