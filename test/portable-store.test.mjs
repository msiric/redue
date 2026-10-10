import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope} from '../src/portable-envelope.mjs';
import {importEvidence,readImportedSnapshot,importedRevision,PORTABLE_STORE_LIMITS} from '../src/portable-store.mjs';
import {acquireRunLock} from '../src/run-lock.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
function envelope(seed='one'){return encodeEnvelope({schema:1,interpretation:'redue-portable-direct-typescript@2',
  origin:{runId:randomUUID(),check:'origin-name',result:'PASS',invocation:{status:'exited',exitCode:0,signal:null},complete:true},
  facts:{schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
    command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},
    platform:{os:'darwin',arch:'arm64',release:'25.1.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},
    compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},context:{},
    files:[['src/main.ts',hash(seed)]],discovery:{configs:[],files:[['src/main.ts',hash(seed)]],queriesSha256:hash('queries')}}});}
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-store-'))),
    root=path.join(base,'project 空间'),state=path.join(base,'redue-state'),configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(root);fs.mkdirSync(state);fs.writeFileSync(configFile,'{}');
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',config:configFile,root,state}));
  fs.mkdirSync(path.join(state,'runs-v1'));fs.writeFileSync(path.join(state,'runs-v1','historical.json'),'historical');
  fs.writeFileSync(path.join(state,'receipts-v1.json'),'old immutable selection');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return {base,root,state,configFile};
}
const options=(f,e,extra={})=>({...f,check:'selected-local-check',bytes:canonical(e),...extra});
const selection=f=>JSON.parse(fs.readFileSync(path.join(f.state,'portable-imports-v1.json'),'utf8'));
const recordFile=(f,e)=>path.join(f.state,'portable-evidence-v1',e.digest+'.json');

test('preview is no-write and import is untrusted by default without changing local receipts',t=>{
  const f=fixture(t),e=envelope(),before=fs.readdirSync(f.state).sort(),preview=importEvidence(options(f,e));
  assert.equal(preview.apply,false);assert.equal(preview.producer_accepted,false);assert.equal(preview.reuse_eligible,false);
  assert.deepEqual(fs.readdirSync(f.state).sort(),before);
  const applied=importEvidence(options(f,e,{apply:true}));assert.equal(applied.evidence_preserved,true);
  assert.equal(applied.producer_accepted,false);assert.equal(applied.reuse_eligible,false);
  const snapshot=readImportedSnapshot(f.state,f);assert.equal(snapshot.records.length,1);
  assert.equal(snapshot.records[0].check,'selected-local-check');assert.equal(snapshot.records[0].acceptance,'untrusted');
  assert.equal(snapshot.records[0].envelope.digest,e.digest);
  assert.equal(fs.readFileSync(path.join(f.state,'receipts-v1.json'),'utf8'),'old immutable selection');
  assert.equal(fs.readFileSync(path.join(f.state,'runs-v1','historical.json'),'utf8'),'historical');
  assert(!fs.existsSync(path.join(f.state,'run.lock')));assert(!fs.existsSync(path.join(f.state,'portable-import-pending-v1.json')));
});
test('manual acceptance is digest-scoped and repeated import remains immutable and idempotent',t=>{
  const f=fixture(t),e=envelope();importEvidence(options(f,e,{apply:true}));const original=fs.readFileSync(recordFile(f,e));
  assert.throws(()=>importEvidence(options(f,e,{apply:true,acceptDigest:hash('other')})),/exact evidence digest/);
  importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  assert.equal(selection(f).records[0].acceptance,'manual-digest-v1');
  importEvidence(options(f,e,{apply:true}));assert.equal(selection(f).records.length,1);
  assert.equal(selection(f).records[0].acceptance,'manual-digest-v1');
  assert.deepEqual(fs.readFileSync(recordFile(f,e)),original);
  assert.throws(()=>importEvidence(options(f,e,{check:'another-local-check',apply:true})),/another local check/);
});
test('missing/malformed/mismatched ownership never initializes state or imports',t=>{
  const f=fixture(t),e=envelope(),marker=path.join(f.state,'vstate-owner-v1.json'),original=fs.readFileSync(marker);
  for(const value of [null,'{','{}',JSON.stringify({...JSON.parse(original),config:f.configFile+'-wrong'})]){
    if(value===null)fs.rmSync(marker);else fs.writeFileSync(marker,value);
    assert.throws(()=>importEvidence(options(f,e,{apply:true})));
    assert(!fs.existsSync(path.join(f.state,'portable-evidence-v1')));assert(!fs.existsSync(path.join(f.state,'run.lock')));
    assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  }
  fs.writeFileSync(marker,original);
  const absent=path.join(f.base,'redue-absent');assert.throws(()=>importEvidence(options({...f,state:absent},e,{apply:true})));
  assert(!fs.existsSync(absent));
});
test('state placement and symbolic external write targets are refused',t=>{
  const f=fixture(t),e=envelope(),linked=path.join(f.base,'redue-linked');
  try{fs.symlinkSync(f.state,linked,'dir');}catch(error){if(process.platform==='win32'&&error.code==='EPERM'){t.skip('symlink privilege unavailable');return;}throw error;}
  assert.throws(()=>importEvidence(options({...f,state:linked},e,{apply:true})),/symlinks/);
  for(const name of ['portable-imports-v1.json','portable-import-pending-v1.json']){
    const target=path.join(f.state,name),outside=path.join(f.base,'outside');fs.writeFileSync(outside,'untouched');fs.symlinkSync(outside,target);
    assert.throws(()=>importEvidence(options(f,e,{apply:true})),/symlinks/);assert.equal(fs.readFileSync(outside,'utf8'),'untouched');fs.unlinkSync(target);
  }
  const observed={...f,state:path.join(f.root,'redue-state')};fs.mkdirSync(observed.state);
  fs.writeFileSync(path.join(observed.state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',config:f.configFile,root:f.root,state:observed.state}));
  assert.throws(()=>importEvidence(options(observed,e,{apply:true})),/non-overlapping/);
});
test('immutable envelope file tampering/missing/linked content is conservative on every snapshot',t=>{
  const f=fixture(t),e=envelope();importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  const file=recordFile(f,e),original=fs.readFileSync(file),changed=Buffer.from(original);changed[changed.length-5]^=1;
  fs.writeFileSync(file,changed);assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  fs.writeFileSync(file,original);assert.equal(readImportedSnapshot(f.state,f).records.length,1);
  fs.unlinkSync(file);assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  fs.writeFileSync(file,original);const outside=path.join(f.base,'outside-envelope');fs.writeFileSync(outside,original);
  fs.unlinkSync(file);
  try{fs.symlinkSync(outside,file);}catch(error){if(process.platform==='win32'&&error.code==='EPERM'){t.skip('symlink privilege unavailable');return;}throw error;}
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_STATE_UNSAFE');
});
test('malformed/duplicate/unsupported selectors and incomplete marker never expose accepted records',t=>{
  const f=fixture(t),e=envelope();importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  const file=path.join(f.state,'portable-imports-v1.json'),original=fs.readFileSync(file,'utf8');
  for(const value of ['{',original.replace('"schema":1','"schema":1,"schema":2'),
    original.replace('manual-digest-v1','unknown-policy-v2'),original.replace(e.digest,'../escape')]){
    fs.writeFileSync(file,value);assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  }
  fs.writeFileSync(file,original);const pending=path.join(f.state,'portable-import-pending-v1.json');fs.writeFileSync(pending,'interrupted');
  assert.throws(()=>importedRevision(f.state),/incomplete/);assert.equal(readImportedSnapshot(f.state,f).records.length,0);
  // Malformed pending data cannot be reinterpreted as a recoverable transaction.
  assert.throws(()=>importEvidence(options(f,e,{apply:true,acceptDigest:e.digest})));
  assert.equal(fs.readFileSync(pending,'utf8'),'interrupted');
});
test('failed immutable persistence leaves pending selection and cannot authorize old accepted imports',t=>{
  const f=fixture(t),first=envelope();importEvidence(options(f,first,{apply:true,acceptDigest:first.digest}));
  const next=envelope('second'),file=recordFile(f,next);fs.writeFileSync(file,'unrelated collision');
  assert.throws(()=>importEvidence(options(f,next,{apply:true,acceptDigest:next.digest})));
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  assert(!fs.existsSync(path.join(f.state,'run.lock')));
  assert.throws(()=>importEvidence(options(f,first,{apply:true,acceptDigest:first.digest})),/exact pending/);
  assert.throws(()=>importEvidence(options(f,next,{apply:true})),/exact pending/);
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');fs.unlinkSync(file);
  importEvidence(options(f,next,{apply:true,acceptDigest:next.digest}));assert.equal(readImportedSnapshot(f.state,f).records.length,2);
});
test('existing run ownership serializes imports instead of racing verification selection',t=>{
  const f=fixture(t),e=envelope(),lock=acquireRunLock(f.state);
  try{assert.throws(()=>importEvidence(options(f,e,{apply:true})),error=>error.code==='PORTABLE_LOCK'&&!error.message.includes(f.state));
    assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
  }finally{lock.release();}
  importEvidence(options(f,e,{apply:true}));assert.equal(readImportedSnapshot(f.state,f).records.length,1);
});
test('cumulative count is bounded before writes and all selected imports remain intact',t=>{
  const f=fixture(t);
  for(let i=0;i<PORTABLE_STORE_LIMITS.records;i++)importEvidence(options(f,envelope(String(i)),{apply:true}));
  const revision=importedRevision(f.state),files=fs.readdirSync(path.join(f.state,'portable-evidence-v1')).sort();
  assert.throws(()=>importEvidence(options(f,envelope('too many'),{apply:true})),/storage limit/);
  assert.equal(importedRevision(f.state),revision);
  assert.deepEqual(fs.readdirSync(path.join(f.state,'portable-evidence-v1')).sort(),files);
});
test('unselected interrupted files still consume the bounded physical storage budget',t=>{
  const f=fixture(t);fs.mkdirSync(path.join(f.state,'portable-evidence-v1'));
  // A known empty selector isolates physical orphan budgeting from the distinct
  // missing-selection guard; missing selectors have their own fail-closed test.
  fs.writeFileSync(path.join(f.state,'portable-imports-v1.json'),canonical({schema:1,records:[]}));
  for(let i=0;i<PORTABLE_STORE_LIMITS.records;i++){
    const e=envelope(String(i));fs.writeFileSync(recordFile(f,e),canonical(e));
  }
  assert.throws(()=>importEvidence(options(f,envelope('extra'),{apply:true})),/storage exceeds/);
  assert(!fs.existsSync(path.join(f.state,'portable-import-pending-v1.json')));
});
test('selector replacement during envelope reading fails the snapshot barrier',t=>{
  const f=fixture(t),e=envelope();importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  const original=fs.readSync,file=path.join(f.state,'portable-imports-v1.json');let replaced=false;
  t.mock.method(fs,'readSync',function(descriptor,...args){
    const result=original.call(fs,descriptor,...args);
    if(!replaced&&args[0].length===Buffer.byteLength(canonical(e))){
      replaced=true;const temporary=file+'.replacement';fs.writeFileSync(temporary,fs.readFileSync(file));fs.renameSync(temporary,file);
    }
    return result;
  });
  const snapshot=readImportedSnapshot(f.state,f);
  assert.equal(replaced,true,'fault injection reached immutable envelope read');
  assert.equal(snapshot.records.length,0);assert.equal(snapshot.error.code,'PORTABLE_STATE_CHANGED');
});
test('read-side ownership must match the recipient, not merely a valid absolute marker',t=>{
  const f=fixture(t),e=envelope();importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  assert.equal(readImportedSnapshot(f.state).error.code,'PORTABLE_OWNERSHIP');
  const marker=path.join(f.state,'vstate-owner-v1.json'),original=fs.readFileSync(marker);
  fs.writeFileSync(marker,JSON.stringify({...JSON.parse(original),root:f.root+'-different'}));
  const changed=readImportedSnapshot(f.state,f);
  assert.equal(changed.records.length,0);assert.equal(changed.error.code,'PORTABLE_OWNERSHIP');
  fs.writeFileSync(marker,original);assert.equal(readImportedSnapshot(f.state,f).records.length,1);
});

test('missing selector with initialized storage cannot replay older PASS and forget accepted FAIL',t=>{
  const f=fixture(t),pass=envelope(),failed=JSON.parse(canonical(envelope('failed')));
  failed.statement.predicate.origin.result='FAIL';failed.statement.predicate.origin.invocation.exitCode=2;
  const failure=encodeEnvelope(failed.statement.predicate);
  importEvidence(options(f,pass,{apply:true,acceptDigest:pass.digest}));
  importEvidence(options(f,failure,{apply:true,acceptDigest:failure.digest}));
  const files=fs.readdirSync(path.join(f.state,'portable-evidence-v1')).sort();
  fs.unlinkSync(path.join(f.state,'portable-imports-v1.json'));
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_SELECTION_MISSING');
  assert.throws(()=>importedRevision(f.state),error=>error.code==='PORTABLE_SELECTION_MISSING');
  for(const apply of [false,true])assert.throws(()=>importEvidence(options(f,pass,{apply,acceptDigest:pass.digest})),
    error=>error.code==='PORTABLE_SELECTION_MISSING');
  assert.deepEqual(fs.readdirSync(path.join(f.state,'portable-evidence-v1')).sort(),files);
  assert(!fs.existsSync(path.join(f.state,'portable-import-pending-v1.json')));
  assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
});
test('empty initialized storage without a selector is ambiguous rather than pristine state',t=>{
  const f=fixture(t);fs.mkdirSync(path.join(f.state,'portable-evidence-v1'));
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_SELECTION_MISSING');
  assert.throws(()=>importEvidence(options(f,envelope(),{apply:true})),error=>error.code==='PORTABLE_SELECTION_MISSING');
});
test('first exact pending transaction recovers after failed initial selector publication',t=>{
  const f=fixture(t),e=envelope(),rename=fs.renameSync,selector=path.join(f.state,'portable-imports-v1.json');let fail=true;
  t.mock.method(fs,'renameSync',function(from,to,...args){
    if(fail&&to===selector)throw Object.assign(Error('controlled failure'),{code:'EIO'});
    return rename.call(fs,from,to,...args);
  });
  assert.throws(()=>importEvidence(options(f,e,{apply:true,acceptDigest:e.digest})),error=>error.code==='PORTABLE_IMPORT_FAILED');
  assert(!fs.existsSync(selector));assert(fs.existsSync(recordFile(f,e)));
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  for(const change of [{bytes:canonical(envelope('other'))},{check:'other-check'},{acceptDigest:null}])
    assert.throws(()=>importEvidence(options(f,e,{apply:true,acceptDigest:e.digest,...change})));
  fail=false;importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  assert.equal(readImportedSnapshot(f.state,f).records[0].acceptance,'manual-digest-v1');
});
test('first exact pending transaction recovers before initial storage directory creation',t=>{
  const f=fixture(t),e=envelope(),mkdir=fs.mkdirSync,directory=path.join(f.state,'portable-evidence-v1');let fail=true;
  t.mock.method(fs,'mkdirSync',function(target,...args){
    if(fail&&target===directory)throw Object.assign(Error('controlled failure'),{code:'EIO'});
    return mkdir.call(fs,target,...args);
  });
  assert.throws(()=>importEvidence(options(f,e,{apply:true,acceptDigest:e.digest})),error=>error.code==='PORTABLE_IMPORT_FAILED');
  assert(!fs.existsSync(directory));assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  fail=false;importEvidence(options(f,e,{apply:true,acceptDigest:e.digest}));
  assert.equal(readImportedSnapshot(f.state,f).records.length,1);
});
test('missing multi-record selector cannot be reconstructed from pending even with an exact retry',t=>{
  const f=fixture(t),a=envelope(),b=envelope('second');
  importEvidence(options(f,a,{apply:true,acceptDigest:a.digest}));
  importEvidence(options(f,b,{apply:true,acceptDigest:b.digest}));
  const current=selection(f);fs.writeFileSync(path.join(f.state,'portable-import-pending-v1.json'),
    canonical({schema:1,digest:b.digest,check:'selected-local-check',acceptance:'manual-digest-v1',selection:current}));
  fs.unlinkSync(path.join(f.state,'portable-imports-v1.json'));
  assert.throws(()=>importEvidence(options(f,b,{apply:true,acceptDigest:b.digest})),error=>error.code==='PORTABLE_SELECTION_MISSING');
  assert.equal(readImportedSnapshot(f.state,f).error.code,'PORTABLE_IMPORT_INCOMPLETE');
  assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
});

test('state descriptor reads are nonblocking and refuse changed non-regular file types',t=>{
  const f=fixture(t),open=fs.openSync,fstat=fs.fstatSync;let checked=false;
  t.mock.method(fs,'openSync',function(file,flags,...args){
    if(file===path.join(f.state,'vstate-owner-v1.json')){
      if(fs.constants.O_NONBLOCK)assert.equal(flags&fs.constants.O_NONBLOCK,fs.constants.O_NONBLOCK);
      if(fs.constants.O_NOFOLLOW)assert.equal(flags&fs.constants.O_NOFOLLOW,fs.constants.O_NOFOLLOW);
      checked=true;
    }
    return open.call(fs,file,flags,...args);
  });
  t.mock.method(fs,'fstatSync',function(descriptor,...args){
    const stat=fstat.call(fs,descriptor,...args);
    if(checked)stat.isFile=()=>false;
    return stat;
  });
  const snapshot=readImportedSnapshot(f.state,f);assert.equal(snapshot.error.code,'PORTABLE_STATE_CHANGED');
  assert(checked);assert.equal(snapshot.records.length,0);
});
