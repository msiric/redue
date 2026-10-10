import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {queryAnswer,queriesMatch} from '../src/typescript-list.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,parseEnvelope,inspectEnvelope,PortableEnvelopeError,PORTABLE_INTERPRETATION}
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
import {parseCacheMembers,inspectCacheContents} from '../src/portable-runtime-cache.mjs';
import {readProducerPolicySnapshot,revalidateProducerPolicySnapshot,producerPolicyBindingCurrent,
  PRODUCER_POLICY_INTERPRETATION} from '../src/portable-producer-policy.mjs';
import {inspectDefaultOpenSSL,DEFAULT_OPENSSL_CONFIG,portableOpenSSLContextIssue}
  from '../src/portable-openssl-config.mjs';
import {portableProbeFailureCode} from '../src/portable-facts.mjs';
import {summarizeMachineOrigin} from './acceptance/portable-machine.mjs';

test('incomplete-machine diagnostics never disclose receipt strings or grant local CURRENT authority',()=>{
  const privateValue='private-receipt-path-and-token-do-not-disclose';
  const summary=summarizeMachineOrigin({freshness:'CURRENT',reuse_eligible:true,result:'PASS',stable:true,
    coverage:{qualified:true},invocation:{status:'exited',argv:privateValue},
    portable:{complete:false,schema:privateValue,interpretation:privateValue,reason:{secret:privateValue},facts:{secret:privateValue}},
    checkpoint:{status:privateValue,issues:[{secret:privateValue},privateValue,'end checkpoint unavailable']}});
  assert.equal(summary.portable_complete,false);assert.equal(summary.stable,true);
  assert.equal(summary.portable_schema,null);assert.equal(summary.interpretation,null);
  assert.equal(summary.reason,'OTHER_PRIVATE_REASON');assert.equal(summary.checkpoint_status,null);
  assert.deepEqual(summary.checkpoint_issue_codes,['OTHER_PRIVATE_ISSUE','OTHER_PRIVATE_ISSUE','END_CHECKPOINT_UNAVAILABLE']);
  assert.equal(summary.facts_present,true);assert.equal(summary.outcome,'PASS');
  assert.equal(Object.hasOwn(summary,'reuse_eligible'),false);assert.equal(Object.hasOwn(summary,'freshness'),false);
  assert(!JSON.stringify(summary).includes(privateValue));
});

// Independent controls for the facts portable comparison must retain. These
// tests do not grant portable eligibility or replace observer interval checks.
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-boundary-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'));
  return root;
}
const capture=(kind,file)=>[kind,file,queryAnswer(kind,file)];

test('portable probe diagnostic never infers timeout from signal, exit or free text',()=>{
  for(const probe of [{signal:'SIGTERM',status:null,stderr:''},
    {status:2,stderr:'warning: ETIMEDOUT'},
    {error:{code:'ENOENT'},stderr:'private text mentions ETIMEDOUT'}])
    assert.equal(portableProbeFailureCode(probe),'PORTABLE_PROBE_UNAVAILABLE');
  assert.equal(portableProbeFailureCode({error:{code:'ETIMEDOUT'},stderr:'arbitrary private child output'}),'PORTABLE_PROBE_TIMEOUT');
  assert.equal(portableProbeFailureCode({status:2,stderr:'VSTATE_REASON:PORTABLE_RUNTIME_UNSUPPORTED\n'}),'PORTABLE_RUNTIME_UNSUPPORTED');
});

function ownerPolicy(t){
  const root=fs.realpathSync(fixture(t));fs.chmodSync(root,0o700);
  const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
    repository:'controlled/portable',repositoryId:'123',ownerId:'456',workflow:'.github/workflows/portable.yml',ref:'refs/heads/main',
    sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:'3'.repeat(64),evidenceDigest:'4'.repeat(64),
    evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null};
  const file=path.join(root,'policy.json'),registry={schema:1,interpretation:PRODUCER_POLICY_INTERPRETATION,
    revision:1,policies:[policy]};fs.writeFileSync(file,canonical(registry),{mode:0o600});
  return {root,file,registry};
}
test('producer authority does not survive a removed or narrowed current owner policy',
  {skip:typeof process.getuid!=='function'},t=>{
  const f=ownerPolicy(t),snapshot=readProducerPolicySnapshot(f.file),binding={revision:snapshot.revision,
    contentDigest:snapshot.contentDigest,policyDigest:snapshot.policies[0].digest};
  assert(producerPolicyBindingCurrent(f.file,binding));
  fs.writeFileSync(f.file,canonical({...f.registry,policies:[]}));
  assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,binding));
  fs.unlinkSync(f.file);
  assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,binding));
  // Restoration is an owner policy action, not an automatic snapshot revival.
  fs.writeFileSync(f.file,canonical(f.registry),{mode:0o600});
  assert(producerPolicyBindingCurrent(f.file,binding));assert(!revalidateProducerPolicySnapshot(snapshot));
});
test('actual FIFO replacement cannot hang the current producer-policy reader',
  {skip:typeof process.getuid!=='function'},t=>{
  const f=ownerPolicy(t),module=fileURLToPath(new URL('../src/portable-producer-policy.mjs',import.meta.url));
  const script=`import fs from 'node:fs';import {spawnSync} from 'node:child_process';
    import {readProducerPolicySnapshot} from ${JSON.stringify(module)};
    const target=process.argv[1],open=fs.openSync;let injected=false;
    fs.openSync=function(file,...args){if(file===target&&!injected){injected=true;fs.unlinkSync(target);
      const made=spawnSync('mkfifo',[target],{encoding:'utf8'});if(made.status!==0)throw Error('FIFO prerequisite');}
      return open.call(fs,file,...args);};
    try{readProducerPolicySnapshot(target);console.log(JSON.stringify({injected,accepted:true}));}
    catch(error){console.log(JSON.stringify({injected,accepted:false,code:error.code}));}`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',script,f.file],
    {encoding:'utf8',timeout:3000,maxBuffer:65536});
  assert.equal(child.status,0,`Policy reader blocked: ${child.error?.code??child.stderr}`);
  const result=JSON.parse(child.stdout);assert(result.injected);assert.equal(result.accepted,false);
  assert.equal(result.code,'PORTABLE_PRODUCER_POLICY_CHANGED');
});
test('OpenSSL absence loses support when an ancestor changes and all override aliases fail closed',t=>{
  for(const key of ['OPENSSL_armcap','openssl_UNKNOWN','OpenSSL_CONF_INCLUDE'])
    assert(portableOpenSSLContextIssue({[key]:''}));
  let parentReads=0;
  t.mock.method(fs,'lstatSync',file=>{
    if(file===DEFAULT_OPENSSL_CONFIG)throw Object.assign(Error('controlled absent'),{code:'ENOENT'});
    const ino=++parentReads>4?9n:1n;
    return {dev:1n,ino,mode:0o40755n,uid:0n,nlink:2n,size:1n,mtimeNs:1n,ctimeNs:1n,
      isDirectory:()=>true,isSymbolicLink:()=>false};
  });
  assert.throws(()=>inspectDefaultOpenSSL({env:{}}),error=>error.code==='PORTABLE_OPENSSL_UNSUPPORTED');
});

function cacheTable(){
  const bytes=Buffer.alloc(664),uuid='a'.repeat(32);
  Buffer.from('dyld_v1  arm64e\0').copy(bytes);bytes.writeUInt32LE(552,16);
  Buffer.from(uuid,'hex').copy(bytes,88);bytes.writeUInt32LE(1,216);
  bytes.writeUInt32LE(552,392);bytes.writeUInt32LE(2,396);
  for(let i=0;i<2;i++){
    Buffer.from((i?'c':'b').repeat(32),'hex').copy(bytes,552+i*56);
    Buffer.from(i?'.02.dyldlinkedit':'.01.dylddata').copy(bytes,576+i*56);
  }
  return {bytes,uuid};
}
test('cache table inventory never invents suffixes or drops a declared constituent',()=>{
  const {bytes,uuid}=cacheTable(),members=parseCacheMembers(bytes,uuid);
  assert.deepEqual(members.map(item=>item.suffix),['','.01.dylddata','.02.dyldlinkedit']);
  for(const replacement of ['../cache','/external','.01/child','.01\\child','.01\u0000extra','.01.custom']){
    const changed=Buffer.from(bytes);changed.fill(0,576,608);Buffer.from(replacement).copy(changed,576);
    assert.throws(()=>parseCacheMembers(changed,uuid),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  }
  const symbols=Buffer.from(bytes);symbols[400]=1;
  assert.throws(()=>parseCacheMembers(symbols,uuid),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  const duplicate=Buffer.from(bytes);duplicate.fill(0,632,664);Buffer.from('.01.dylddata').copy(duplicate,632);
  assert.throws(()=>parseCacheMembers(duplicate,uuid),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
});
test('cache UUID and modern table layout are mandatory, not filesystem-label guesses',()=>{
  const {bytes,uuid}=cacheTable();
  for(const mutate of [b=>b.writeUInt32LE(0xffffffff,392),b=>b.writeUInt32LE(0xffffffff,396),
    b=>b.writeUInt32LE(551,392),b=>b.writeUInt32LE(544,16),b=>b.writeUInt32LE(0,216),
    b=>b.fill(0,88,104),b=>b.fill(0,608,624)]){
    const changed=Buffer.from(bytes);mutate(changed);
    assert.throws(()=>parseCacheMembers(changed,uuid),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  }
  assert.throws(()=>parseCacheMembers(bytes,uuid.toUpperCase()),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  assert.throws(()=>parseCacheMembers(bytes.subarray(0,663),uuid),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
});

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
function portableFixture(){return {schema:1,interpretation:PORTABLE_INTERPRETATION,
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

// The fixed signer job is Ubuntu/POSIX. Do not treat an unavailable native
// Windows Python/descriptor invocation as the validator rejecting input.
test('disabled signer rejects boolean schema/exit codes, broken inner binding and alternate OIDC',
  {skip:process.platform==='win32'?'Fixed Ubuntu signer uses POSIX descriptor semantics':false},t=>{
  const YAML=createRequire(import.meta.url)('yaml'),proposal=YAML.parse(fs.readFileSync(
    new URL('../docs/contributor/portable-ci-signing-workflow.yml',import.meta.url),'utf8'));
  const script=proposal.jobs.signer.steps.find(step=>step.id==='validate').run
    .split("python3 <<'PYTHON'\n")[1].split('\nPYTHON')[0];
  for(const mutation of ['envelope-schema','predicate-schema','manifest-schema','exit-code','inner-subject','alternate-oidc']){
    const base=fs.realpathSync(fixture(t)),directory=path.join(base,'redue-sign-input');fs.mkdirSync(directory);
    const envelope=structuredClone(encodeEnvelope(portableFixture()));
    if(mutation==='envelope-schema')envelope.schema=true;
    if(mutation==='predicate-schema')envelope.statement.predicate.schema=true;
    if(mutation==='exit-code')envelope.statement.predicate.origin.invocation.exitCode=false;
    envelope.statement.subject[0].digest.sha256=digest(canonical(envelope.statement.predicate));
    if(mutation==='inner-subject')envelope.statement.subject[0].digest.sha256=digest('different predicate');
    envelope.digest=digest(canonical(envelope.statement));
    const raw=canonical(envelope),p=envelope.statement.predicate,profile={platform:p.facts.platform,runtime:p.facts.runtime,compiler:p.facts.compiler};
    const manifest={schema:mutation==='manifest-schema'?true:1,source:'1'.repeat(40),package_sha256:digest('package'),
      evidence_sha256:digest(raw),evidence_digest:envelope.digest,origin_run_id:p.origin.runId,
      profile_digest:digest(canonical(profile)),node_physical_identity:digest('node'),boot_identity:digest('boot'),
      interpretation:PORTABLE_INTERPRETATION,profile,scope:'controlled-noLib-direct-typescript',package_filename:'owned.tgz'};
    fs.writeFileSync(path.join(directory,'redue-portable-evidence.json'),raw);
    fs.writeFileSync(path.join(directory,'manifest.json'),canonical(manifest));
    const result=spawnSync('python3',['-c',script],{env:{...process.env,RUNNER_TEMP:base,GITHUB_SHA:manifest.source,
      ...(mutation==='alternate-oidc'?{SIGSTORE_ID_TOKEN:'controlled-not-a-real-token'}:{})},
      encoding:'utf8',timeout:3000,maxBuffer:65536});
    assert.equal(result.error,undefined,`${mutation}: validator process must start and complete`);
    assert.equal(result.signal,null,`${mutation}: a signal is not a validator rejection`);
    assert(Number.isInteger(result.status),`${mutation}: a missing exit status is not a validator rejection`);
    assert.notEqual(result.status,0,`${mutation}: malformed identity must be rejected`);
    assert.equal(fs.existsSync(path.join(base,'redue-sign-predicate.json')),false,
      `${mutation}: no predicate may be created for a rejected identity`);
  }
});

test('older portable interpretation cannot acquire current-schema authority',()=>{
  const obsolete=portableFixture();obsolete.interpretation='redue-portable-direct-typescript@1';
  assert.notEqual(obsolete.interpretation,PORTABLE_INTERPRETATION);
  assert.throws(()=>encodeEnvelope(obsolete),error=>error instanceof PortableEnvelopeError);
});

test('the one writable Cryptex ancestor requires exact native protected child identity',
  {skip:!portableRuntimeSupported()},t=>{
  const native=createRequire(import.meta.url)('../src/portable-runtime-darwin-arm64.node'),cache=native.inspect();
  const refusal=fn=>assert.throws(fn,error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  refusal(()=>inspectCacheContents({...cache,cryptexRoot:{...cache.cryptexRoot,flags:0}}));
  refusal(()=>inspectCacheContents({...cache,cryptexRoot:{...cache.cryptexRoot,ino:'0'}}));
  const original=fs.lstatSync;
  t.mock.method(fs,'lstatSync',function(file,...args){const stat=original.call(fs,file,...args);
    if(file==='/System/Volumes/Preboot')stat.mode=(stat.mode&~0o777n)|0o777n;return stat;});
  refusal(()=>inspectCacheContents(cache));
});

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

function observedCompiler(t,{copiedNode=false}={}){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'redue-origin-review-'))),
    root=path.join(base,'project'),state=path.join(base,'redue-state'),
    bin=fileURLToPath(new URL('../bin/redue.mjs',import.meta.url));
  const cleanupCalls=[];
  t.after(()=>{try{for(const item of cleanupCalls)if(fs.existsSync(item.state))item.call('stop');}
    finally{fs.rmSync(base,{recursive:true,force:true});}});
  const node=copiedNode?path.join(base,'node'):process.execPath;
  if(copiedNode){fs.copyFileSync(process.execPath,node);fs.chmodSync(node,0o755);
    assert.equal(digest(fs.readFileSync(node)),digest(fs.readFileSync(process.execPath)));}
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
  const call=(...words)=>{const r=spawnSync(node,args(words),{cwd:root,env,encoding:'utf8',timeout:60000});
    assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
  const selected=()=>JSON.parse(fs.readFileSync(path.join(state,'receipts-v1.json'))).checks.typecheck;
  const paused=async phase=>{
    for(const name of ['test-run-paused','test-run-release'])try{fs.unlinkSync(path.join(state,name));}catch(e){if(e.code!=='ENOENT')throw e;}
    const child=spawn(node,args(['run','typecheck','--portable']),{cwd:root,
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
  return {base,root,state,put,call,selected,paused,env,bin,node,
    ownObserver:(state,call)=>cleanupCalls.push({state,call})};
}

test('real copied-Node recipient independently reuses origin evidence without executing the compiler',
  {skip:!portableRuntimeSupported(),timeout:240000},async t=>{
  const f=observedCompiler(t);f.call('run','typecheck','--portable');const baseline=f.selected();
  assert.equal(baseline.result,'PASS');assert.equal(baseline.portable.complete,true);
  const historical=path.join(f.state,'runs-v1',baseline.invocation.runId+'.json'),original=fs.readFileSync(historical);
  const artifact=path.join(f.base,'portable.json');
  const exported=JSON.parse(f.call('evidence','export','typecheck','--output',artifact,'--json'));
  const root=path.join(f.base,'receiver'),state=path.join(f.base,'redue-copy-receiver'),node=path.join(f.base,'node');
  fs.cpSync(f.root,root,{recursive:true,dereference:false,verbatimSymlinks:true});
  fs.copyFileSync(process.execPath,node);fs.chmodSync(node,0o755);
  assert.equal(digest(fs.readFileSync(node)),digest(fs.readFileSync(process.execPath)));
  const rawIdentity=file=>{const real=fs.realpathSync(file),stat=fs.statSync(real,{bigint:true});
    return digest(JSON.stringify([real,process.version,...['dev','ino','mode','size','mtimeNs','ctimeNs']
      .map(key=>String(stat[key]))]));};
  assert.equal(baseline.environmentHashes.__vstate_node_identity__,rawIdentity(process.execPath));
  assert.notEqual(rawIdentity(node),rawIdentity(process.execPath),'observed raw installation identity really differs');
  const call=(...words)=>{const r=spawnSync(node,[f.bin,'--state-dir',state,...words],
    {cwd:root,env:f.env,encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
  f.ownObserver(state,call);call('start');
  const deadline=Date.now()+15000;
  while(!fs.existsSync(path.join(state,'plans-v1.json'))&&Date.now()<deadline)
    await new Promise(resolve=>setTimeout(resolve,10));
  assert(fs.existsSync(path.join(state,'plans-v1.json')),'receiver startup prerequisite');
  call('evidence','import',artifact,'--check','typecheck','--accept-digest',exported.digest,'--apply','--json');
  const response=JSON.parse(call('status','--sync','--json')),row=response.checks[0];
  assert.equal(row.freshness,'CURRENT');assert.equal(row.result,'PASS');assert.equal(row.reuse_eligible,true);
  assert.equal(row.evidence_source,'imported');assert.equal(row.invocation,null);
  assert.equal(row.imported_evidence.origin_run_id,baseline.invocation.runId);
  assert.equal(row.imported_evidence.digest,exported.digest);
  assert.equal(fs.existsSync(path.join(state,'runs-v1')),false,'recipient executed no equivalent compiler check');
  assert.deepEqual(fs.readFileSync(historical),original,'immutable raw producer provenance preserved');
  const cached=JSON.parse(call('status','--json')).checks[0];assert.equal(cached.reuse_eligible,false);
  for(const [phase,change,release] of [['after-proof',false,true],['after-proof',true,true],
    ['before-publication',true,true],['after-proof',false,false]]){
    const marker=path.join(state,'test-portable-caller-paused'),released=path.join(state,'test-portable-caller-release');
    for(const file of [marker,released])try{fs.unlinkSync(file);}catch(error){if(error.code!=='ENOENT')throw error;}
    const child=spawn(node,[f.bin,'--state-dir',state,'status','--sync','--json'],{cwd:root,
      env:{...f.env,VSTATE_TEST_FAULTS:'1',VSTATE_TEST_PORTABLE_CALLER_BARRIER:phase},stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',bytes=>stdout+=bytes);child.stderr.on('data',bytes=>stderr+=bytes);
    const finished=new Promise(resolve=>child.on('close',code=>resolve({code,stdout,stderr})));
    const until=Date.now()+15000;
    while(!fs.existsSync(marker)&&child.exitCode===null&&Date.now()<until)
      await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(fs.readFileSync(marker,'utf8'),phase,'caller proof boundary actually reached');
    const prior=rawIdentity(node);
    // Controlled real metadata update to the OWNED COPY, never the owner's
    // normal executable. Content remains reviewed; raw interval still changed.
    if(change){const stat=fs.statSync(node);fs.utimesSync(node,stat.atime,new Date(stat.mtimeMs+2000));
      assert.notEqual(rawIdentity(node),prior);}
    if(release)fs.writeFileSync(released,'release');
    const result=await finished,visible=JSON.parse(result.stdout).checks[0];
    if(change||!release){assert.equal(result.code,2,result.stderr);
      assert.equal(visible.reuse_eligible,false);assert.notEqual(visible.freshness,'CURRENT');
      if(change)assert.match(visible.reason,/PORTABLE_CALLER_CONTEXT_CHANGED/);
    }else{assert.equal(result.code,0,result.stderr);assert.equal(visible.reuse_eligible,true);
      assert.equal(visible.imported_evidence.origin_run_id,baseline.invocation.runId);}
    assert.equal(fs.existsSync(path.join(state,'runs-v1')),false);assert.deepEqual(fs.readFileSync(historical),original);
  }
  // New independent validation may legitimately match the same content profile;
  // a failed interval is not permanent authority or permanent disqualification.
  const recovered=JSON.parse(call('status','--sync','--json')).checks[0];assert.equal(recovered.reuse_eligible,true);
  assert.equal(recovered.imported_evidence.origin_run_id,baseline.invocation.runId);
  t.diagnostic(`Copied-Node origin ${baseline.invocation.runId}; envelope ${exported.digest}; recipient compiler runs 0`);
});

test('portable origin cannot complete after raw caller identity changes during final validation',
  {skip:!portableRuntimeSupported(),timeout:120000},async t=>{
  const f=observedCompiler(t,{copiedNode:true});
  f.call('run','typecheck','--portable');const baseline=f.selected();
  assert.equal(baseline.result,'PASS');assert.equal(baseline.portable.complete,true);
  const history=path.join(f.state,'runs-v1',baseline.invocation.runId+'.json'),original=fs.readFileSync(history);
  const run=await f.paused('after-portable-validation');
  // A real metadata change to this test's executable copy, after full end
  // discovery but before final observation. Never mutate the owner's Node.
  const before=fs.statSync(f.node,{bigint:true}),now=fs.statSync(f.node);
  fs.utimesSync(f.node,now.atime,new Date(now.mtimeMs+2000));
  assert.notEqual(fs.statSync(f.node,{bigint:true}).mtimeNs,before.mtimeNs);
  run.release();const finished=await run.done;assert.equal(finished.code,0,finished.output);
  const selected=f.selected();assert.equal(selected.result,'PASS');
  assert.equal(selected.invocation.status,'exited');assert.equal(selected.invocation.exitCode,0);
  assert.equal(selected.stable,false);assert.equal(selected.portable.complete,false);
  assert(selected.checkpoint.issues.includes('declared environment changed during portable validation'));
  assert.notEqual(selected.invocation.runId,baseline.invocation.runId);
  assert.deepEqual(fs.readFileSync(history),original);
  const exported=JSON.parse(f.call('evidence','export','typecheck','--output',path.join(f.base,'incomplete.json'),'--json'));
  assert.equal(exported.origin.complete,false);
  for(const restart of [false,true]){
    if(restart){f.call('stop');f.call('start');}
    const visible=JSON.parse(f.call('status','--sync','--json')).checks[0];
    assert.equal(visible.invocation.runId,selected.invocation.runId);
    assert.equal(visible.reuse_eligible,false);assert.notEqual(visible.freshness,'CURRENT');
  }
  assert.deepEqual(fs.readFileSync(history),original);
  t.diagnostic(`Final-validation unstable origin ${selected.invocation.runId}; historical ${baseline.invocation.runId} preserved`);
});

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
