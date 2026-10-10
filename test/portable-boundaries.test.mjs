import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {queryAnswer,queriesMatch} from '../src/typescript-list.mjs';
import {createHash} from 'node:crypto';
import {canonical,encodeEnvelope,parseEnvelope,inspectEnvelope,PortableEnvelopeError}
  from '../src/portable-envelope.mjs';
import {importEvidence,readImportedSnapshot} from '../src/portable-store.mjs';

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
