// SOURCE/MOCK only. Never invoke genuine zero-argument preparation: it creates
// fixtures/builds C. A successful mock report is not a minted context or GO.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
 observeFixedEnclosurePreparation as localObserve,
 observeFixedCIEnclosurePreparation as ciObserve,
 prepareFixedCIEnclosurePreparation,
 prepareFixedCIEnclosureContext,
 isFixedEnclosurePreparationContext as isContext,
} from './acceptance/sealed-typescript-enclosure-provisioning.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs',import.meta.url),'utf8');
const localProfile='fixed-enclosure-preparation-local-sdk27@2';
const ciProfile='fixed-enclosure-preparation-ci-sdk26.5-toolpair-a@1';
const fixtureProfile='fixed-native-assets-ci-sdk26.5-toolpair-a@1';
const buildProfile='fixed-enclosure-ci-sdk26.5-toolpair-a@1';
const nodeSHA='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const flags={sealed:false,reuseEligible:false};
const outcome=name=>({outcome:name,...flags});
function fixture(ci=true){
 const state={now:0,fail:null,badSource:false,badBuild:false,mixedNull:false,nonzero:false};
 const calls=[],refs={},frames=[],operations={};
 const method=(name,body)=>operations[name]=(...args)=>{
  calls.push(name);
  if(state.fail===name)throw Error('SOURCE_MOCK_REFUSAL');
  return body(...args);
 };
 const build=(count,name='BUILT_NOT_EXECUTED')=>({...outcome(name),dispatchAttemptCount:count,
  builds:Array.from({length:count},(_,index)=>({pidObserved:true,completed:true,
   status:state.nonzero&&index===0?1:0,signal:null,spawnError:'NONE',stdoutBytes:0,stderrBytes:0}))});
 method('preparePair',()=>refs.pair={...outcome('BASE_EXCHANGE_PAIR_PREPARED'),baseA:'/private/tmp/redue-ci-recipient-11111111',baseB:'/private/tmp/redue-ci-recipient-22222222'});
 method('createHost',()=>refs.host={...outcome('CI_SYNTHETIC_BOOTSTRAP_PREPARED'),base:'/private/tmp/redue-ci-recipient-33333333'});
 method('prepareHostFixture',host=>{assert.equal(host,refs.host);return refs.fixture=outcome('SYNTHETIC_FIXTURE_PREPARED');});
 method('buildAssets',options=>{assert.equal(options.pair,refs.pair);assert.equal(options.hostFixture,refs.fixture);return refs.assets=build(3);});
 method('verifyAssets',assets=>{assert.equal(assets,refs.assets);return outcome('BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');});
 method('preparePairedSource',options=>{assert.equal(options.pair,refs.pair);assert.equal(options.assetsBuild,refs.assets);return refs.pairedSource={...flags,disabled:true};});
 method('buildPaired',options=>{assert.equal(options.assetsBuild,refs.assets);assert.equal(options.source,refs.pairedSource);return refs.paired=build(2);});
 method('verifyPaired',paired=>{assert.equal(paired,refs.paired);return outcome('PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED');});
 method('provisionCopies',options=>{assert.equal(options.assetsBuild,refs.assets);assert.equal(options.pairedSource,refs.pairedSource);assert.equal(options.pairedArtifacts,refs.paired);return refs.copies=outcome('CAMPAIGN_COPIES_OBSERVED_NOT_EXECUTED');});
 method('verifyCopies',copies=>{assert.equal(copies,refs.copies);return outcome('CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED');});
 method('buildLauncher',()=>build(1,'CAMPAIGN_LAUNCHER_BUILT_NOT_EXECUTED'));
 method('verifyLauncher',()=>outcome('CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
 method('prepareProjection',()=>refs.projection=outcome('ORIGINAL_PROTECTED_INPUT_PROJECTION_PREPARED'));
 method('prepareNull',options=>{
  assert.equal(options.hostBase,refs.host.base);
  assert.deepEqual(Object.keys(options).sort(),ci?['assetsBuild','hostBase']:['hostBase']);
  if(ci)assert.equal(options.assetsBuild,refs.assets);
  refs.nullAssets=state.mixedNull?{}:refs.assets;
  return refs.nullSource={...flags,disabled:true,version:'campaign-prepared-devnull-setexec@2'};
 });
 method('prepareEnclosure',options=>{
  assert.equal(options.assetsBuild,refs.assets);assert.equal(options.copies,refs.copies);
  assert.equal(options.pairedSource,refs.pairedSource);assert.equal(options.pairedArtifacts,refs.paired);
  assert.equal(options.projection,refs.projection);assert.equal(options.preparedNullSource,refs.nullSource);
  if(ci&&refs.nullAssets!==refs.assets)throw Error('SOURCE_MOCK_MIXED_PARENT');
  return refs.source={...outcome('FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED'),
   version:'fixed-canary-finite-enclosure-source@2',
   ...(ci?{fixtureProfileId:state.badSource?'UNREVIEWED':fixtureProfile}:{})};
 });
 method('buildEnclosure',options=>{
  assert.equal(options.source,refs.source);
  return {...build(2),report:{profileId:state.badBuild?'UNREVIEWED':ci?buildProfile:'fixed-enclosure-local-sdk27@1',
   sourceVersion:'fixed-canary-finite-enclosure-source@2',files:Array.from({length:6},()=>({digest:'a'.repeat(64)}))}};
 });
 method('verifyEnclosure',()=>outcome('ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
 const options={ready:()=>true,load:async()=>{calls.push('IMPORTS');return operations;},now:()=>state.now,observeProgress:frame=>frames.push(frame)};
 return {state,calls,refs,frames,operations,options};
}
function noAuthority(report){
 assert.equal(report.sealed,false);assert.equal(report.reuseEligible,false);
 assert.equal(report.recordAdoptionAuthority,false);assert.equal(report.models,0);
 assert.equal(report.nativeAgentLaunches,0);assert.equal(report.compilerCheckExecutions,0);
 assert.equal(report.privateMints,'PROCESS_LOCAL_NOT_ADOPTABLE_FROM_REPORT');
 assert.equal(isContext(report),false);assert.equal(isContext({...report}),false);
 assert.equal(isContext(JSON.parse(JSON.stringify(report))),false);
}
test('fixed CI mock path reuses all nineteen phases/eight builds without changing local report mechanics',async()=>{
 const local=fixture(false),ci=fixture(),a=await localObserve(local.options),b=await ciObserve(ci.options);
 assert.equal(a.profile,localProfile);assert.equal(b.profile,ciProfile);
 assert.equal(a.outcome,'BUILT_NOT_EXECUTED');assert.equal(b.outcome,'BUILT_NOT_EXECUTED');
 assert.deepEqual({...b,profile:a.profile},a);assert.deepEqual(ci.calls,local.calls);
 assert.equal(b.phases.length,19);assert.equal(b.buildAttemptCount,8);
 assert.equal(b.buildResultCount,8);assert.equal(b.observedProcessCount,8);
 assert.equal(b.compilerBuildOutcome,'EXIT_ZERO');assert.equal(b.newFileDigests.length,6);
 assert.equal(ci.frames.length,38);assert.deepEqual(ci.frames,local.frames);
 assert.deepEqual([b.bodyBudgetMs,b.cleanupBudgetMs,b.totalBudgetMs],[60000,5000,65000]);
 noAuthority(a);noAuthority(b);
});
for(const [property,phase] of [['badSource','enclosureSource'],['badBuild','finalValidation'],['mixedNull','enclosureSource']]){
 test('CI mock refusal retains observations for '+property,async()=>{
  const m=fixture();m.state[property]=true;const report=await ciObserve(m.options);
  assert.equal(report.outcome,'UNKNOWN');assert.equal(report.failedPhase,phase);
  if(phase==='enclosureSource')assert(!m.calls.includes('buildEnclosure'));
  noAuthority(report);
 });
}
test('ordinary local observer never selects CI from supplied fields or environment-like data',async()=>{
 const m=fixture(false);let reads=0;
 const options={...m.options,ci:true,profile:ciProfile,env:{REDUE_PROFILE_CONTEXT:'CI'}};
 Object.defineProperty(options,'captureOriginals',{get(){reads++;throw Error('NO_CAPTURE');}});
 const report=await localObserve(options);assert.equal(report.profile,localProfile);assert.equal(report.outcome,'BUILT_NOT_EXECUTED');assert.equal(reads,0);noAuthority(report);
});
test('CI observer cannot enable capture with supplied or copied context/proxy inputs',async()=>{
 const m=fixture();let reads=0,captures=0;
 const capture=new Proxy(()=>{captures++;},{get(){reads++;throw Error('NO_PROPERTY_READ');}});
 const report=await ciObserve({...m.options,captureOriginals:capture,context:Object.freeze({}),profile:localProfile});
 assert.equal(report.outcome,'BUILT_NOT_EXECUTED');assert.equal(report.profile,ciProfile);
 assert.equal(captures,0);assert.equal(reads,0);noAuthority(report);
});
for(const name of ['preparePair','createHost','prepareHostFixture','buildAssets','verifyAssets','preparePairedSource','buildPaired','verifyPaired','provisionCopies','verifyCopies','buildLauncher','verifyLauncher','prepareProjection','prepareNull','prepareEnclosure','buildEnclosure','verifyEnclosure']){
 test('CI mock failure at '+name+' cannot continue or mint authority',async()=>{
  const m=fixture();m.state.fail=name;const report=await ciObserve(m.options);
  assert.equal(report.outcome,'UNKNOWN');assert.equal(m.calls.at(-1),name);
  assert.equal(report.phases.at(-1).outcome,'UNKNOWN');noAuthority(report);
 });
}
test('CI failed import/readiness, nonzero builds and unchanged clock limits stay conservative',async()=>{
 const absent=fixture();absent.options.ready=()=>false;
 let report=await ciObserve(absent.options);assert.equal(report.outcome,'UNKNOWN');assert.deepEqual(absent.calls,[]);noAuthority(report);
 const failed=fixture();failed.state.nonzero=true;report=await ciObserve(failed.options);
 assert.equal(report.outcome,'UNKNOWN');assert.equal(report.compilerBuildOutcome,'EXIT_NONZERO');assert.equal(report.buildResultCount,3);noAuthority(report);
 for(const now of [60000,-1,NaN,Infinity]){
  const m=fixture();m.options.ready=()=>{m.state.now=now;return true;};report=await ciObserve(m.options);
  assert.equal(report.outcome,'UNKNOWN');assert.deepEqual(m.calls,[]);assert.equal(report.buildAttemptCount,0);noAuthority(report);
 }
 const expired=fixture();expired.options.observeProgress=frame=>{if(frame.name==='finalValidation'&&frame.kind==='END')expired.state.now=60000;};
 report=await ciObserve(expired.options);assert.equal(report.outcome,'UNKNOWN');assert.equal(report.reason_code,'FINAL_REPORT_OR_BUDGET_UNAVAILABLE');noAuthority(report);
});
test('genuine fixed CI entry points reject every supplied argument without reading it',async()=>{
 let reads=0;const foreign=new Proxy({},{get(){reads++;throw Error('NO_READ');},ownKeys(){reads++;throw Error('NO_KEYS');},getPrototypeOf(){reads++;throw Error('NO_PROTO');}});
 for(const operation of [prepareFixedCIEnclosurePreparation,prepareFixedCIEnclosureContext]){
  for(const args of [[undefined],[null],[foreign],[{},()=>{}]])await assert.rejects(operation(...args),/FIXED_ENCLOSURE_PREPARATION_UNKNOWN/);
 }
 assert.equal(reads,0);
});
function readiness(){
 const state={calls:[],bad:null,envReads:0},node='/owned/canonical/runtime/node';
 const stat=()=>({dev:1,ino:2,mode:0o100755,uid:501,nlink:1,size:121593488,mtimeMs:1,ctimeMs:2,isFile:()=>true,isSymbolicLink:()=>false});
 const mark=row=>['dev','ino','mode','uid','nlink','size','mtimeMs','ctimeMs'].map(k=>String(row[k])).join(':');
 const processMock={platform:'darwin',arch:'arm64',version:'v22.13.0',execArgv:[],execPath:node,getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20,
  env:new Proxy({HTTPS_PROXY:'NOT_READ'},{get(){state.envReads++;throw Error('ENV_VALUE_READ');}})};
 let statCalls=0;
 const io={realpathSync(file){state.calls.push('realpath');return state.bad==='canonical'?file+'-alias':file;},lstatSync(){state.calls.push('stat');const row=stat();if(state.bad==='owner')row.uid=0;if(state.bad==='size')row.size--;if(state.bad==='symlink')row.isSymbolicLink=()=>true;if(state.bad==='changed'&&++statCalls>1)row.ino++;return row;}};
 const read=(file,limit)=>{state.calls.push('hash');assert.equal(file,node);assert.equal(limit,121593488);if(state.bad==='read')throw Error('SOURCE_MOCK_READ_REFUSAL');return {digest:state.bad==='digest'?'b'.repeat(64):nodeSHA,fingerprint:mark(stat())};};
 const fn=source.slice(source.indexOf('function fixedCIReady()'),source.indexOf('// No supplied options, imported report'));
 const run=Function('guard','process','fs','path','readOwnedDiagnosticFile','NODE_SHA',fn+';return fixedCIReady;')(
  value=>{if(!value)throw Error('SOURCE_MOCK_GUARD');},processMock,io,path,read,nodeSHA);
 return {state,processMock,run};
}
test('CI readiness checks actual canonical Node bytes/size/owner with key-only environment inspection',()=>{
 const m=readiness();assert.equal(m.run(),true);assert.equal(m.state.envReads,0);
 assert.deepEqual(m.state.calls,['realpath','stat','hash','stat','realpath']);
 for(const fault of ['canonical','owner','size','symlink','changed','read','digest']){
  const bad=readiness();bad.state.bad=fault;assert.equal(bad.run(),false,fault);assert.equal(bad.state.envReads,0);
 }
 for(const key of ['NODE_OPTIONS','node_path','DYLD_INSERT_LIBRARIES','LD_PRELOAD','OPENSSL_CONF','SIMPLE','REDUE_DECISION_PROFILE','REDUE_DECISION_PROFILE_FILE','REDUE_PROFILE_CONTEXT']){
  const bad=readiness();bad.processMock.env={[key]:''};assert.equal(bad.run(),false,key);assert.deepEqual(bad.state.calls,[]);
 }
 for(const [key,value]of [['version','v22.14.0'],['platform','linux'],['arch','x64'],['execArgv',['--require','UNREVIEWED']]]){
  const bad=readiness();bad.processMock[key]=value;assert.equal(bad.run(),false);assert.deepEqual(bad.state.calls,[]);
 }
});
test('source binds four fixed CI consumers, one private context mint, unchanged CLI and ten originals',()=>{
 for(const name of ['buildSealedTypeScriptBaseExchangeAssetsForReviewedCI','prepareSealedTypeScriptFixedCampaignPreparedNullSourceForReviewedCI','prepareSealedTypeScriptFixedCampaignEnclosureSourceForReviewedCI','buildSealedTypeScriptFixedCampaignEnclosureForReviewedCI'])assert(source.includes('.'+name),name);
 assert.equal((source.match(/async function prepareFixedSequence\(/g)||[]).length,1);
 assert.equal((source.match(/preparedContexts\.set\(/g)||[]).length,1);
 assert.match(source,/prepareFixedCIEnclosureContext\(\)\{\s*guard\(arguments\.length===0\);return prepareFixedContext\(true\)/);
 assert.match(source,/observeFixedCIEnclosurePreparation\(options\)\{return prepareFixedSequence\(options,null,true\)/);
 const shared=source.slice(source.indexOf('async function prepareFixedContext(ci)'),source.indexOf('// Identity only:'));
 const record=shared.match(/preparedContexts\.set\(context,Object\.freeze\(\{([^}]+)\}\)\)/)[1];
 assert.deepEqual(record.split(',').map(row=>row.split(':')[0]),['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild']);
 for(const matcher of ['assetsMatchPair','assetsMatchHostFixture','pairedSourceMatches','pairedArtifactsMatch','copiesMatch','launcherMatches','projectionMatches','sourceMatches','buildMatches'])assert(shared.includes('o.'+matcher+'('));
 const cli=source.slice(source.indexOf('const here=fileURLToPath(import.meta.url)'));
 assert(!cli.includes('CI'));assert.match(cli,/--fixed-preparation-child/);assert.match(cli,/await observeFixedEnclosurePreparation\(/);
 const parent=fs.readFileSync(new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url),'utf8');
 assert(parent.includes('INNER_SHA256 = "'+createHash('sha256').update(source).digest('hex')+'"'));
});
test('genuine CI preparation/context mint',{skip:'NOT RUN: requires reviewed combined consumers and actual matched host; source/mock success is not an original mint'},()=>{});

test('concurrent CI/local mock observers keep per-invocation profile and capture isolation',async()=>{
 const ci=fixture(),local=fixture(false);let release;
 const held=new Promise(resolve=>{release=resolve;}),load=ci.options.load;
 ci.options.load=async()=>{await held;return load();};
 const pending=ciObserve(ci.options),localReport=await localObserve(local.options);
 release();const ciReport=await pending;
 assert.equal(localReport.outcome,'BUILT_NOT_EXECUTED');assert.equal(ciReport.outcome,'BUILT_NOT_EXECUTED');
 assert.equal(localReport.profile,localProfile);assert.equal(ciReport.profile,ciProfile);
 noAuthority(localReport);noAuthority(ciReport);
});
test('source-extracted CI capture failures return no token and never touch the actual context map',async()=>{
 // Negative-only source projection. The genuine fixed entry is never called;
 // even the isolated fake set refuses, so no mock success is presented as minting.
 const shared=source.slice(source.indexOf('async function prepareFixedContext(ci)'),source.indexOf('// Identity only:'));
 for(const fault of ['capture_missing','different_report','matcher','clock','set']){
  const report={outcome:'BUILT_NOT_EXECUTED',profile:ciProfile};let fakeSets=0;
  const originals={operations:{}};
  for(const key of ['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild'])originals[key]=Object.freeze({});
  for(const name of ['assetsMatchPair','assetsMatchHostFixture','pairedSourceMatches','pairedArtifactsMatch','copiesMatch','launcherMatches','projectionMatches','sourceMatches','buildMatches'])originals.operations[name]=()=>fault!=='matcher';
  const pipeline=async(options,capture,ci)=>{
   assert.equal(ci,true);
   if(fault!=='capture_missing')capture(originals,fault==='different_report'?{...report}:report,()=>{if(fault==='clock')throw Error('SOURCE_MOCK_CLOCK');});
   return report;
  };
  const empty=()=>{};
  const run=Function('prepareFixedSequence','fixedCIReady','fixedReady','fixedCIOperations','fixedOperations','performance','guard','freeze','preparedContexts',shared+';return prepareFixedContext;')(
   pipeline,empty,empty,empty,empty,{now:()=>0},v=>{if(!v)throw Error('SOURCE_MOCK_GUARD');},Object.freeze,
   {set(){fakeSets++;throw Error('SOURCE_MOCK_SET_REFUSAL');}});
  const value=await run(true);
  assert.equal(value.context,null);assert.equal(value.report.outcome,'UNKNOWN');
  assert.equal(value.report.reason_code,'FINAL_REPORT_OR_BUDGET_UNAVAILABLE');assert.equal(value.report.profile,ciProfile);
  assert.equal(fakeSets,fault==='set'?1:0);assert.equal(isContext(value),false);
 }
});
