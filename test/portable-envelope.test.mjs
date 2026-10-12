import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonical,digestPayload,encodeEnvelope,parseEnvelope,inspectEnvelope,
  PORTABLE_LIMITS,PortableEnvelopeError} from '../src/portable-envelope.mjs';
const hash=text=>createHash('sha256').update(text).digest('hex');
function predicate(){return {schema:1,interpretation:'redue-portable-direct-typescript@2',
  origin:{runId:'e00b34bd-2163-4883-b143-7217a8d5f86f',check:'typecheck',result:'PASS',
    invocation:{status:'exited',exitCode:0,signal:null},complete:true},
  facts:{schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
    command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},
    platform:{os:'darwin',arch:'arm64',release:'25.1.0'},
    runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[['libSystem.B.dylib',hash('shared')]]},
    compiler:{version:'5.5.2',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},
    context:{NODE_ENV:hash('production')},files:[['package.json',hash('package')],['src/你好.ts',hash('source')]],
    discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/你好.ts',hash('source')]],queriesSha256:hash('queries')}}};}
const encoded=()=>encodeEnvelope(predicate());
const bytes=()=>canonical(encoded());
function rejects(value,code){assert.throws(()=>parseEnvelope(value),error=>error instanceof PortableEnvelopeError&&error.code===code);}

test('portable envelope binds predicate and complete statement deterministically',()=>{
  const first=encoded(),p=predicate(),reordered=Object.fromEntries(Object.entries(p).reverse());
  assert.equal(first.digest,encodeEnvelope(reordered).digest);
  assert.equal(digestPayload(first.statement),first.digest);
  assert.equal(first.statement.subject[0].digest.sha256,hash(canonical(p)));
  assert.equal(canonical(parseEnvelope(Buffer.from(canonical(first)))),canonical(first));
  assert(Object.isFrozen(first)&&Object.isFrozen(first.statement.predicate.facts.files[0]));
  assert.throws(()=>{first.statement.predicate.origin.result='FAIL';},TypeError);
  p.facts.files[0][0]='changed';assert.equal(first.statement.predicate.facts.files[0][0],'package.json');
});
test('inspection is pure structure checking and never grants trust or reuse',()=>{
  const report=inspectEnvelope(bytes());
  assert.equal(report.evidence_preserved,true);assert.equal(report.evidence_understood,true);
  assert.equal(report.producer_accepted,false);assert.equal(report.reuse_eligible,false);
  assert.equal(report.input_count,2);assert.equal(report.origin.result,'PASS');
});
test('reported failures and incomplete historical outcomes remain inspectable facts',()=>{
  const fail=predicate();fail.origin.result='FAIL';fail.origin.invocation.exitCode=2;
  assert.equal(inspectEnvelope(canonical(encodeEnvelope(fail))).origin.result,'FAIL');
  const old=predicate();old.origin.complete=false;old.facts=null;
  assert.equal(inspectEnvelope(canonical(encodeEnvelope(old))).input_count,0);
  assert.equal(inspectEnvelope(canonical(encodeEnvelope(old))).reuse_eligible,false);
});
test('payload edits and subject/statement digest substitutions are rejected',()=>{
  const value=JSON.parse(bytes());value.statement.predicate.origin.check='other';
  rejects(JSON.stringify(value),'PORTABLE_DIGEST');
  const altered=JSON.parse(bytes());altered.statement.subject[0].digest.sha256=hash('different');
  altered.digest=digestPayload(altered.statement);rejects(JSON.stringify(altered),'PORTABLE_DIGEST');
  const outer=JSON.parse(bytes());outer.digest=hash('different');rejects(JSON.stringify(outer),'PORTABLE_DIGEST');
});
test('duplicate decoded keys are rejected at every nesting level before digest evaluation',()=>{
  rejects(bytes().replace('"schema":1','"schema":1,"schema":1'),'PORTABLE_DUPLICATE_KEY');
  rejects(bytes().replace('"result":"PASS"','"result":"PASS","resul\\u0074":"PASS"'),'PORTABLE_DUPLICATE_KEY');
  rejects('{"schema":1,"schema":2}','PORTABLE_DUPLICATE_KEY');
  rejects('{"__proto__":{},"__pro\\u0074o__":{}}','PORTABLE_DUPLICATE_KEY');
});
test('unknown fields and incompatible interpretation never become understood evidence',()=>{
  const unknown=JSON.parse(bytes());unknown.accepted=true;rejects(JSON.stringify(unknown),'PORTABLE_SCHEMA');
  const producer=predicate();producer.producer={trusted:true};assert.throws(()=>encodeEnvelope(producer),PortableEnvelopeError);
  const future=JSON.parse(bytes());future.statement.predicate.interpretation='redue-portable-direct-typescript@999';
  rejects(JSON.stringify(future),'PORTABLE_SCHEMA');
  const policy=predicate();policy.facts.trust='automatic';assert.throws(()=>encodeEnvelope(policy),PortableEnvelopeError);
});
test('manifest and compiler paths are relative, unique, ordered data with no traversal/ADS',()=>{
  for(const name of ['/etc/passwd','../outside','a/../b','a/./b','a//b','C:/outside','a\\b','a:b','a\0b','']){
    const p=predicate();p.facts.files[0][0]=name;assert.throws(()=>encodeEnvelope(p),PortableEnvelopeError,name);
  }
  const duplicate=predicate();duplicate.facts.files.push([...duplicate.facts.files[1]]);
  assert.throws(()=>encodeEnvelope(duplicate),PortableEnvelopeError);
  const unsorted=predicate();unsorted.facts.files.reverse();assert.throws(()=>encodeEnvelope(unsorted),PortableEnvelopeError);
  const externalCompiler=predicate();externalCompiler.facts.compiler.entry='../tsc.js';
  assert.throws(()=>encodeEnvelope(externalCompiler),PortableEnvelopeError);
});
test('command argv, origin completeness and passing outcome cannot assert contradictory facts',()=>{
  for(const mutation of [p=>p.facts.recipe.command=['sh','-c','touch bad'],
    p=>p.origin.invocation.exitCode=1,p=>p.origin.invocation.signal='SIGTERM',
    p=>p.origin.runId=[p.origin.runId],p=>p.facts=null,
    p=>p.origin.result='FAIL',p=>p.origin.result=null,
    p=>{p.origin.result=null;p.origin.invocation={status:'interrupted',exitCode:null,signal:'SIGTERM'};},
    p=>{p.origin.result=null;p.origin.invocation={status:'start_failed',exitCode:null,signal:null};}]){
    const p=predicate();mutation(p);assert.throws(()=>encodeEnvelope(p),PortableEnvelopeError);
  }
  const interrupted=predicate();interrupted.origin.complete=false;interrupted.origin.result=null;
  interrupted.origin.invocation={status:'interrupted',exitCode:null,signal:'SIGTERM'};
  assert.equal(inspectEnvelope(canonical(encodeEnvelope(interrupted))).origin.result,null);
});
test('malformed, truncated and non-UTF8 input has bounded classified failure',()=>{
  for(const input of ['',bytes().slice(0,-1),bytes()+' trailing','{"x":01}','{"x":NaN}','[true,]',
    '{"x":"\\x41"}', '{"x":}', '\ufeff'+bytes()])rejects(input,'PORTABLE_PARSE');
  rejects(Buffer.from([0xc0,0xaf]),'PORTABLE_UNICODE');
  rejects('{"x":"\\ud800"}','PORTABLE_UNICODE');
  rejects('{"x":"\\udc00"}','PORTABLE_UNICODE');
  rejects('{"x":9007199254740992}','PORTABLE_NUMBER');
  rejects('{"x":1.5}','PORTABLE_NUMBER');
  rejects('{"x":1e-99999}','PORTABLE_NUMBER');
  rejects('{"x":9007199254740990.9}','PORTABLE_NUMBER');
  rejects('{"x":1.0}','PORTABLE_NUMBER');
});
test('byte, nesting, string and item limits reject parse abuse without decompression',()=>{
  rejects(Buffer.alloc(PORTABLE_LIMITS.bytes+1,32),'PORTABLE_SIZE');
  rejects('['.repeat(PORTABLE_LIMITS.depth+2)+'0'+']'.repeat(PORTABLE_LIMITS.depth+2),'PORTABLE_DEPTH');
  rejects(JSON.stringify('a'.repeat(PORTABLE_LIMITS.string+1)),'PORTABLE_SIZE');
  const items='['+'0,'.repeat(PORTABLE_LIMITS.nodes)+'0]';rejects(items,'PORTABLE_SIZE');
  rejects(Buffer.from([0x1f,0x8b,0x08]),'PORTABLE_UNICODE');
});
test('canonical restricted I-JSON preserves Unicode, order-sensitive arrays and integer meaning',()=>{
  assert.equal(canonical({z:1,a:'你好',array:[2,1]}),'{"a":"你好","array":[2,1],"z":1}');
  assert.notEqual(hash(canonical({a:'é'})),hash(canonical({a:'é'})));
  assert.equal(canonical({a:-0}),'{"a":0}');
  assert.throws(()=>canonical({a:undefined}),PortableEnvelopeError);
  assert.throws(()=>canonical({a:Infinity}),PortableEnvelopeError);
  const cycle={};cycle.cycle=cycle;assert.throws(()=>canonical(cycle),PortableEnvelopeError);
  assert.throws(()=>canonical(new Date()),PortableEnvelopeError);
  assert.throws(()=>canonical([,]),PortableEnvelopeError);
  let invoked=false;const getter={};Object.defineProperty(getter,'x',{get(){invoked=true;return 1;},enumerable:true});
  assert.throws(()=>canonical(getter),PortableEnvelopeError);assert.equal(invoked,false);
  const array=[0];Object.defineProperty(array,'0',{get(){invoked=true;return 1;},enumerable:true});
  assert.throws(()=>canonical(array),PortableEnvelopeError);assert.equal(invoked,false);
});

test('prior same-host interpretation cannot acquire the new content-equivalence meaning',()=>{
  const old=predicate();old.interpretation='redue-portable-direct-typescript@1';
  assert.throws(()=>encodeEnvelope(old),PortableEnvelopeError);
});
