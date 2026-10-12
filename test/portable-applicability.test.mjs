import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope} from '../src/portable-envelope.mjs';
import {decidePortableEvidence} from '../src/portable-applicability.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const clone=value=>JSON.parse(canonical(value));
function facts(){return {schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
  command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},
  platform:{os:'darwin',arch:'arm64',release:'25.1.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},
  compiler:{version:'5.5.2',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},
  context:{NODE_ENV:hash('production')},files:[['src/main.ts',hash('source')]],
  discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/main.ts',hash('source')]],queriesSha256:hash('queries')}};}
function record({result='PASS',complete=true,input=facts(),acceptance='manual-digest-v1',check='compiler'}={}){
  const envelope=encodeEnvelope({schema:1,interpretation:'redue-portable-direct-typescript@2',
    origin:{runId:randomUUID(),check:'producer-check',result,complete,
      invocation:{status:'exited',exitCode:result==='PASS'?0:2,signal:null}},facts:input});
  return {digest:envelope.digest,check,acceptance,envelope};
}
function options(records=[record()]){return {check:'compiler',facts:facts(),
  prerequisites:{originIntervalSupported:true,understood:true,observationHealthy:true,callerValidated:true,complete:true},
  snapshot:{revision:hash('catalog'),records},local:null};}
function local(extra={}){return {present:true,result:'PASS',stable:true,invocationStatus:'exited',
  applicability:'CURRENT',facts:facts(),resolvedCatalogRevision:null,...extra};}
const decide=(records,extra={})=>decidePortableEvidence({...options(records),...extra});

test('only exact independently matched complete accepted PASS becomes reusable imported evidence',()=>{
  const r=record(),d=decide([r]);assert.equal(d.reason,'PORTABLE_RECIPIENT_CURRENT');
  assert.equal(d.freshness,'CURRENT');assert.equal(d.result,'PASS');assert.equal(d.reuse_eligible,true);
  assert.equal(d.selected.digest,r.digest);assert.equal(d.selected.run_id,r.envelope.statement.predicate.origin.runId);
  assert.equal(d.selected.origin.check,'producer-check');assert.equal(d.selected.check,'compiler');
  assert(!Object.hasOwn(d.selected,'invocation'));assert(Object.isFrozen(d.selected.origin));
});
test('recipient validation prerequisites and unavailable/null revisions fail closed',()=>{
  const good=options();
  for(const key of Object.keys(good.prerequisites)){
    const d=decidePortableEvidence({...good,prerequisites:{...good.prerequisites,[key]:false}});
    assert.equal(d.reuse_eligible,false);assert.equal(d.reason,key==='originIntervalSupported'?'PORTABLE_ORIGIN_INTERVAL_UNSUPPORTED':'PORTABLE_RECIPIENT_UNVERIFIED');
  }
  for(const snapshot of [{...good.snapshot,error:{code:'incomplete'}},{...good.snapshot,revision:null},
    {...good.snapshot,revision:''},{records:[]}]){
    const d=decidePortableEvidence({...good,snapshot});assert.equal(d.local_reuse_blocked,true);assert.equal(d.reuse_eligible,false);
  }
});
test('every full fact identity remains strict; historical different-input failures do not poison PASS',()=>{
  for(const mutate of [f=>f.recipe.definitionSha256=hash('different'),f=>f.platform.release='different',
    f=>f.runtime.sha256=hash('different'),f=>f.compiler.sha256=hash('different'),
    f=>f.context.NODE_ENV=hash('different'),f=>f.files[0][1]=hash('different'),
    f=>f.discovery.queriesSha256=hash('different'),f=>f.discovery.configs[0][1]=hash('different')]){
    const changed=facts();mutate(changed);const stale=record({input:changed,result:'FAIL'}),d=decide([stale,record()]);
    assert.equal(d.reuse_eligible,true);assert.equal(d.historical[0].origin.result,'FAIL');
    assert.equal(decide([stale]).freshness,'STALE');
  }
});
test('unaccepted failures, incomplete claims and unknown policy imports have no selection authority',()=>{
  const d=decide([record(),record({result:'FAIL',acceptance:'untrusted'}),
    record({complete:false,input:null,acceptance:'future-auto-trust'})]);
  assert.equal(d.reuse_eligible,true);assert.equal(d.applicable.length,1);
  const localGood=decide([record({result:'FAIL',acceptance:'untrusted'})],{local:local()});
  assert.equal(localGood.reason,'PORTABLE_LOCAL_CURRENT_SELECTED');assert.equal(localGood.local_reuse_blocked,false);
});
test('applicable accepted FAIL stays FAIL and conflicts with imported or local PASS',()=>{
  const failure=record({result:'FAIL'}),alone=decide([failure]);
  assert.equal(alone.freshness,'CURRENT');assert.equal(alone.result,'FAIL');assert.equal(alone.reuse_eligible,false);
  for(const d of [decide([failure,record()]),decide([failure],{local:local()})]){
    assert.equal(d.reason,'PORTABLE_APPLICABLE_CONFLICT');assert.equal(d.local_reuse_blocked,true);
    assert.equal(d.reuse_eligible,false);
  }
});
test('multiple unordered accepted origins never derive an order from arrival or claimed timestamps',()=>{
  const a=record(),b=record();
  for(const records of [[a,b],[b,a]])assert.equal(decide(records).reason,'PORTABLE_UNORDERED_ORIGINS');
  const original=clone(a),altered=clone(a);altered.envelope.statement.predicate.origin.runId=randomUUID();
  assert.equal(decide([original,altered]).reason,'PORTABLE_ACCEPTED_RECORD_INVALID');
});
test('incomplete accepted origin cannot hide unresolved uncertainty beneath an older PASS',()=>{
  const other=facts();other.files[0][1]=hash('different preliminary inputs');
  for(const incomplete of [record({complete:false}),record({complete:false,input:null}),
    record({complete:false,result:'FAIL'}),record({complete:false,result:'FAIL',input:other})]){
    const d=decide([record(),incomplete]);assert.equal(d.reason,'PORTABLE_ACCEPTED_ORIGIN_INCOMPLETE');
    assert.equal(d.reuse_eligible,false);assert.equal(d.local_reuse_blocked,true);
  }
});
test('selected local unavailable unstable incomplete or FAIL bars fallback; STALE label alone cannot escape',()=>{
  for(const selected of [local({stable:false}),local({invocationStatus:'interrupted'}),
    local({applicability:'UNVERIFIED'}),local({facts:null}),local({result:'FAIL'}),
    local({applicability:'STALE'}),local({applicability:'STALE',facts:null})]){
    const d=decide([record()],{local:selected});assert.equal(d.reason,'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK');
    assert.equal(d.reuse_eligible,false);assert.equal(d.local_historical.result,selected.result);
  }
});
test('independently different full local STALE facts remain historical rather than permanent blockers',()=>{
  const old=facts();old.files[0][1]=hash('old');const d=decide([record()],{
    local:local({result:'FAIL',applicability:'STALE',facts:old})});
  assert.equal(d.reuse_eligible,true);assert.equal(d.local_historical.result,'FAIL');
  assert.equal(d.local_historical.applicability,'STALE');
  for(const extra of [{stable:false},{invocationStatus:'interrupted'},{result:null}]){
    assert.equal(decide([record()],{local:local({applicability:'STALE',facts:old,...extra})}).reason,
      'PORTABLE_LOCAL_SELECTION_BARS_FALLBACK');
  }
});
test('only fully matching local PASS with explicit identical catalog binding can resolve a conflict',()=>{
  const records=[record({result:'FAIL'}),record()],o=options(records);
  const resolved=decidePortableEvidence({...o,local:local({resolvedCatalogRevision:o.snapshot.revision})});
  assert.equal(resolved.reason,'PORTABLE_CATALOG_EXPLICITLY_RESOLVED_LOCALLY');
  assert.equal(resolved.reuse_eligible,false);assert.equal(resolved.local_reuse_blocked,false);
  for(const extra of [{resolvedCatalogRevision:hash('prior')},{resolvedCatalogRevision:o.snapshot.revision,stable:false},
    {resolvedCatalogRevision:o.snapshot.revision,facts:null},{resolvedCatalogRevision:o.snapshot.revision,result:'FAIL'}]){
    const d=decidePortableEvidence({...o,local:local(extra)});assert.equal(d.local_reuse_blocked,true);
  }
  const changedCatalog=decidePortableEvidence({...o,snapshot:{...o.snapshot,revision:hash('new import')},
    local:local({resolvedCatalogRevision:o.snapshot.revision})});assert.equal(changedCatalog.local_reuse_blocked,true);
});
test('accepted record digest/schema mutation and wrong local-check mapping are conservative',()=>{
  const r=clone(record());r.envelope.statement.predicate.facts.recipe.command=['sh','-c','echo bad'];
  assert.equal(decide([r]).reason,'PORTABLE_ACCEPTED_RECORD_INVALID');
  assert.equal(decide([record({check:'different'})]).reason,'PORTABLE_NO_ACCEPTED_EVIDENCE');
  assert.equal(decide([record()],{local:{present:true,result:'PASS'}}).reason,'PORTABLE_LOCAL_SELECTION_INVALID');
});
