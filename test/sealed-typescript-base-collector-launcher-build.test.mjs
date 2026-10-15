// Whole fixed builder mocks: in-memory H files, private brands and compiler
// facade only. No build process, launcher, Node, collector or helper executes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildSealedTypeScriptBaseCollectorLauncher as actual,verifySealedTypeScriptBaseCollectorLauncherBuild as actualCurrent,sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation as actualMatches} from './acceptance/sealed-typescript-base-exchange-assets.mjs';
import {sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary} from './acceptance/sealed-typescript-native-assets-build.mjs';
const moduleSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-base-exchange-assets.mjs',import.meta.url),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
function mock(fault=null,diagnostics={enabled:false}){
 const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333';
 const file=h+'/prefix/native-probes/base-exchange-collect-launch.c',output=file.slice(0,-2),body='/* fixed synthetic source */\nint main(void){return 74;}\n';
 const assets={},copies={},hostFixture={},bindings=Object.freeze({baseA:a,baseB:b,hostBase:h,node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',
 nodeSha256:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',entry:h+'/prefix/native-probes/base-exchange-collect.mjs',
 collectorSha256:'c'.repeat(64),launcher:output,launcherSource:file,launcherSourceSha256:sha(body)});
 const proposal=Object.freeze({proposedLauncher:Object.freeze({disabled:true,file,output,source:body,sourceBytes:Buffer.byteLength(body),sha256:sha(body),templateSha256:'t'.repeat(64)}),
 proposedSources:[{},{},{},{sha256:bindings.collectorSha256}]});
 const sourceBrands=new Set([proposal]);
 const controlledMint=new WeakMap([[assets,{hostFixture}]]),nodes=new Map(),handles=new Map();
 const state={valid:{assets:true,source:true,copies:true},calls:[],writes:[],checks:0,toolCalls:0,oldBuildCalls:0,binaryReads:0,sourceReads:0,late:null,markAttempts:[],marks:[]};
 let ino=1,fd=100;
 const put=(name,type='d',bytes=Buffer.alloc(0),mode=type==='d'?0o40700n:0o100600n)=>nodes.set(name,{type,body:Buffer.from(bytes),dev:1n,ino:BigInt(ino++),mode,uid:501n,gid:20n,nlink:1n,size:BigInt(bytes.length),mtimeNs:1n,ctimeNs:1n});
 for(const name of ['/','/private','/private/tmp',h,h+'/prefix',h+'/prefix/native-probes'])put(name);
 if(fault==='existing-source')put(file,'f',Buffer.from('PRESERVED'));
 if(fault==='existing-output')put(output,'f',Buffer.from('PRESERVED'));
 const metadata=name=>{const row=nodes.get(name);if(!row)throw Object.assign(Error('SYNTHETIC_MISSING'),{code:'ENOENT'});
 return {...row,isDirectory:()=>row.type==='d',isFile:()=>row.type==='f',isSymbolicLink:()=>row.type==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:131072,O_NONBLOCK:4},realpathSync:name=>name,lstatSync:metadata,
 writeFileSync(name,text,options){assert.equal(name,file);assert.deepEqual(options,{flag:'wx',mode:0o600});assert(!nodes.has(name));state.writes.push(name);put(name,'f',Buffer.from(text));
 if(fault==='source-mode')nodes.get(name).mode=0o100644n;if(fault==='source-owner')nodes.get(name).uid=502n;
 if(fault==='source-link')nodes.get(name).nlink=2n;if(fault==='source-symlink')nodes.get(name).type='l';
 if(fault==='source-after-write')state.valid.source=false;},
 openSync(name,flags){assert.equal(flags,131076);const id=fd++;handles.set(id,name);return id;},
 fstatSync:id=>metadata(handles.get(id)),
 readSync(id,buffer,offset,length,position){const name=handles.get(id),row=nodes.get(name);
 if(name===file&&position===0){state.sourceReads++;if(state.sourceReads===2&&fault==='runtime-during-source-read')state.valid.assets=false;
 if(state.sourceReads===2&&fault==='copies-during-source-read')state.valid.copies=false;
 if(state.sourceReads===2&&fault==='source-mint-during-source-read')state.valid.source=false;}
 if(name===output&&position===0){state.binaryReads++;
 if(state.late==='source-during-binary')nodes.get(file).ino+=1n;
 if(state.late==='runtime-during-binary')state.valid.assets=false;}
 const n=row.body.copy(buffer,offset,position,Math.min(position+length,row.body.length));
 if(fault==='source-read-bytes'&&name===file&&n)buffer[offset]^=1;return n;},
 closeSync(id){handles.delete(id);if(fault==='close')throw Error('PRIVATE_CLOSE_DETAIL');}};
 const assetObservation=()=>({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:a,baseB:b,hostBase:h,commands:[],sealed:false,reuseEligible:false});
 const sourceObservation=()=>({scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',outcome:'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',baseA:a,baseB:b,hostBase:h,bindings});
 const copyObservation=()=>({scope:'FIXED_COLLECTOR_COPIES_DATA_ONLY',outcome:'COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:a,baseB:b,hostBase:h,bindings});
 function checked(kind,result){state.checks++;
 if(state.late===kind+'-lost-after-binary'&&state.binaryReads>=3)state.valid[kind]=false;
 if(state.late==='source-file-during-'+kind&&state.binaryReads>=3)nodes.get(file).ino+=1n;
 if(state.late==='binary-during-'+kind&&state.binaryReads>=3)nodes.get(output).ino+=1n;
 return state.valid[kind]?result():{outcome:'UNKNOWN'};}
 const spawn=(executable,argv,options)=>{state.calls.push({executable,argv,options});
 assert.equal(executable,'/reviewed/clang');assert.deepEqual(argv,['FIXED','-isysroot','/reviewed/SDK',file,'-o',output]);
 assert.deepEqual(options,{cwd:h+'/prefix/native-probes',env:{TMPDIR:h},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});
 if(fault==='spawn-throws')throw Error('PRIVATE_COMPILER_DETAIL');
 const binary=Buffer.alloc(24);binary.writeUInt32LE(fault==='header'?0:0xfeedfacf,0);binary.writeUInt32LE(0x0100000c,4);put(output,'f',binary,0o100755n);
 if(fault==='source-after-compile')nodes.get(file).ino+=1n;
 if(fault==='output-link')nodes.get(output).nlink=2n;if(fault==='parent-after-compile')nodes.get(h+'/prefix/native-probes').ino+=1n;
 if(fault==='assets-after-compile')state.valid.assets=false;if(fault==='copies-after-compile')state.valid.copies=false;
 return{pid:fault==='no-pid'?undefined:42,status:fault==='exit'?1:fault==='signal'?null:0,signal:fault==='signal'?'SIGKILL':null,stdout:'',stderr:''};};
 const code=moduleSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replace('const mintedAssets=new WeakMap();','const mintedAssets=controlledMint;')+
 '\nverifySealedTypeScriptBaseExchangeAssets=controlledAssetVerify;return {build:buildSealedTypeScriptBaseCollectorLauncher,verify:verifySealedTypeScriptBaseCollectorLauncherBuild,matches:sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation};';
 const api=Function('fs','path','createHash','spawnSync','verifySealedTypeScriptBaseExchangePair','verifySealedTypeScriptSyntheticFixture','prepareSealedTypeScriptBaseExchangeSource',
 'prepareSealedTypeScriptNativeAssetsProposal','buildSealedTypeScriptNativeAssets','verifySealedTypeScriptNativeAssetsBuild','sealedAssetsBuildCompleted','sealedAssetsBuildProcessSummary',
 'verifySealedTypeScriptBaseCollectorSource','sealedTypeScriptBaseCollectorSourceMatchesAssets','verifySealedTypeScriptBaseCollectorCopies','sealedTypeScriptBaseCollectorCopiesMatchSource',
 'process','controlledMint','controlledAssetVerify','profiling','profileMark',code)(io,path.posix,createHash,spawn,()=>{throw Error('NO_PAIR_BUILD');},()=>{throw Error('NO_NEW_HOST');},()=>{throw Error('NO_OLD_RENDER');},
 options=>{state.toolCalls++;assert.equal(options.fixture,hostFixture);return{base:h,bindings:{node:bindings.node},proposedBuilds:[{},
 {executable:'/reviewed/clang',argv:['FIXED','-isysroot','/reviewed/SDK','old.c','-o','old']}]};},
 ()=>{state.oldBuildCalls++;throw Error('NO_OLD_BUILDS');},()=>{throw Error('NO_UNBOUND_BUILD');},sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary,
 value=>sourceBrands.has(value)?checked('source',sourceObservation):{outcome:'UNKNOWN'},(value,parent)=>sourceBrands.has(value)&&parent===assets,
 value=>value===copies?checked('copies',copyObservation):{outcome:'UNKNOWN'},(value,parent)=>value===copies&&parent===proposal,
 {getuid:()=>501},controlledMint,value=>value===assets?checked('assets',assetObservation):{outcome:'UNKNOWN'},diagnostics.enabled,
 diagnostics.unavailable?undefined:(phase,fields)=>{state.markAttempts.push(phase);if(diagnostics.throws)throw Error('SYNTHETIC_MARK_FAILURE');state.marks.push({phase,...fields});});
 controlledMint.get(assets).prepareProposal=options=>{state.toolCalls++;assert.equal(options.fixture,hostFixture);return{base:h,bindings:{node:bindings.node},proposedBuilds:[{},{executable:'/reviewed/clang',argv:['FIXED','-isysroot','/reviewed/SDK','old.c','-o','old']}]};};
 return{...api,options:{assets,source:proposal,copies},sourceBrands,state,nodes,file,output,h,a,b,handles};
}
const falseAuthority=value=>{assert.deepEqual(value.commands,[]);for(const key of ['compilerCheckExecutions','helperExecutions','nativeAgentLaunches','models'])assert.equal(value[key],0);
 for(const key of ['sealed','reuseEligible','noInheritedWritableHandlesVerified'])assert.equal(value[key],false);};

test('default launcher build and readonly currency invoke no diagnostic hook or extra operation',()=>{
 const m=mock(),built=m.build(m.options);assert.equal(built.outcome,'LAUNCHER_BUILT_NOT_EXECUTED');
 assert.deepEqual(m.state.markAttempts,[]);assert.deepEqual(m.state.marks,[]);assert.equal(m.state.calls.length,1);
 assert.equal(m.verify(built).outcome,'LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');assert.deepEqual(m.state.markAttempts,[]);
});
test('opt-in marks are fixed scalar projections, cover every currency boundary and preserve the exact build result',()=>{
 const plain=mock(),expected=plain.build(plain.options),m=mock(null,{enabled:true}),result=m.build(m.options);
 assert.deepEqual(result,expected);assert.equal(m.state.checks,plain.state.checks);assert.equal(m.state.sourceReads,plain.state.sourceReads);assert.equal(m.state.binaryReads,plain.state.binaryReads);
 const names=['build','dependencies','assets_currency','source_currency','copies_currency','boundary','source_current','binary_current',
  'final_roots','final_new_rows','tool_proposal','new_paths_absent','source_create','source_read','output_absent','source_named','compiler','output_read'];
 const allowed=new Set(names.flatMap(name=>['before','after'].map(edge=>'launcher_'+name+'_'+edge)));
 const enums=new Set(['BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED','SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED','COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',
  'LAUNCHER_BUILT_NOT_EXECUTED','UNKNOWN','NONE','SIGKILL']);
 for(const row of m.state.marks){assert(allowed.has(row.phase));for(const [key,value]of Object.entries(row))if(key!=='phase'){
   assert(['outcome','dispatchAttempts','dispatchResults','observedProcesses','status','signal','spawnError','completed','sourceWriteAttempts','sourceWriteCompleted'].includes(key));
   assert(value===null||Number.isInteger(value)&&value>=0||enums.has(value));}}
 assert.equal(m.state.marks[0].phase,'launcher_build_before');assert.equal(m.state.marks.at(-1).phase,'launcher_build_after');
 const before=m.state.marks.find(row=>row.phase==='launcher_compiler_before'),after=m.state.marks.find(row=>row.phase==='launcher_compiler_after');
 assert.deepEqual(before,{phase:'launcher_compiler_before',dispatchAttempts:0,dispatchResults:0,observedProcesses:0});
 assert.deepEqual(after,{phase:'launcher_compiler_after',dispatchAttempts:1,dispatchResults:1,observedProcesses:1,status:0,signal:null,spawnError:'NONE',completed:1});
 assert.equal(m.state.marks.filter(row=>row.phase==='launcher_boundary_before').length,7);
 assert.equal(m.state.marks.filter(row=>row.phase==='launcher_boundary_after').length,7);
 assert.equal(m.state.marks.filter(row=>row.phase==='launcher_dependencies_before').length,8);
 assert.equal(m.state.marks.filter(row=>row.phase==='launcher_dependencies_after').length,8);
 assert.equal(m.state.marks.length,110,'single successful build has a bounded fixed sequence, with no verification optimization');
 const lastBefore=m.state.marks.findIndex(row=>row.phase==='launcher_final_new_rows_before');assert(lastBefore>m.state.marks.findIndex(row=>row.phase==='launcher_output_read_after'));
 assert.equal(m.state.marks[lastBefore+1].phase,'launcher_final_new_rows_after');assert(!JSON.stringify(m.state.marks).includes(m.h));
 const markCount=m.state.markAttempts.length;m.verify(result);assert.equal(m.state.markAttempts.length,markCount,'readonly currency is outside this diagnostic seam');falseAuthority(result);
 assert(!Object.hasOwn(result,'profileAvailable'));assert(!Object.hasOwn(result,'diagnosticOutcome'));
});
test('noncallable diagnostic hook is contained and does not turn lost logging into fabricated build failure or success',()=>{
 for(const fault of [null,'copies-during-source-read','spawn-throws']){
  const plain=mock(fault),expected=plain.build(plain.options),m=mock(fault,{enabled:true,unavailable:true}),result=m.build(m.options);
  assert.deepEqual(result,expected);assert.deepEqual(m.state.calls,plain.state.calls);assert.equal(m.state.checks,plain.state.checks);
  assert.deepEqual(m.state.marks,[]);assert(!Object.hasOwn(result,'profileAvailable'));falseAuthority(result);
 }
});
for(const fault of [null,'existing-source','source-after-write','runtime-during-source-read','copies-during-source-read','spawn-throws','exit','signal','no-pid','header','parent-after-compile','copies-after-compile'])
 test('unavailable/throwing marks do not change original '+(fault??'successful')+' guards, dispatch or durable counters',()=>{
  const plain=mock(fault),expected=plain.build(plain.options),m=mock(fault,{enabled:true,throws:true}),result=m.build(m.options);
  assert.deepEqual(result,expected);assert(m.state.markAttempts.length>0);assert.deepEqual(m.state.marks,[]);
  for(const key of ['checks','sourceReads','binaryReads','toolCalls','oldBuildCalls'])assert.equal(m.state[key],plain.state[key]);
  assert.deepEqual(m.state.calls,plain.state.calls);assert.deepEqual(m.state.writes,plain.state.writes);assert.equal(m.handles.size,0);falseAuthority(result);
 });
for(const fault of ['spawn-throws','signal','exit','no-pid'])test('diagnostic '+fault+' reports only real returned summary facts and never invents compiler after phase',()=>{
 const m=mock(fault,{enabled:true}),result=m.build(m.options),after=m.state.marks.find(row=>row.phase==='launcher_compiler_after'),last=m.state.marks.at(-1);
 assert.equal(last.phase,'launcher_build_after');assert.equal(last.dispatchAttempts,1);assert.equal(last.dispatchResults,result.dispatchResultCount);assert.equal(last.observedProcesses,result.observedProcessCount);
 if(fault==='spawn-throws'){assert.equal(after,undefined);assert.equal(last.dispatchResults,0);assert.equal(last.observedProcesses,0);}
 else{assert.equal(after.status,result.builds[0].status);assert.equal(after.signal,result.builds[0].signal);assert.equal(after.observedProcesses,result.observedProcessCount);}
 assert.equal(last.outcome,'UNKNOWN');assert(!JSON.stringify(m.state.marks).includes('PRIVATE'));falseAuthority(result);
});
test('existing profiler still cannot distinguish persisted from unavailable sink; the builder claims no availability',()=>{
 const logger=fs.readFileSync(new URL('../src/decision-profile.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('export ','');
 const create=Function('fs','AsyncLocalStorage','randomUUID','process','performance',logger+';return {profiling,mark};');
 class Context{getStore(){return undefined;}}
 for(const failure of [false,true]){let attempts=0,persisted=0;
  const api=create({appendFileSync(){attempts++;if(failure)throw Error('SYNTHETIC_SINK_FAILURE');persisted++;}},Context,()=> 'synthetic',
   {env:{REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:'/mock/owned/prepared-profile'},memoryUsage:()=>({rss:0}),hrtime:{bigint:()=>1n},pid:42},{now:()=>1});
  assert.equal(api.profiling,true);assert.equal(api.mark('launcher_build_before'),undefined);assert.equal(attempts,1);assert.equal(persisted,failure?0:1);
 }
});

test('actual ESM cycle initializes assets/source/copies without building or adopting fabricated labels',async()=>{
 const source=await import('./acceptance/sealed-typescript-base-collector-source.mjs');
 const copies=await import('./acceptance/sealed-typescript-base-collector-copies.mjs');
 assert.equal(source.sealedTypeScriptBaseCollectorSourceMatchesAssets({},{}),false);
 assert.equal(copies.sealedTypeScriptBaseCollectorCopiesMatchSource({},{}),false);
 const result=actual({assets:{},source:{},copies:{}});assert.equal(result.outcome,'UNKNOWN');assert.equal(result.dispatchAttemptCount,0);falseAuthority(result);
 assert.equal(actualCurrent(JSON.parse(JSON.stringify(result))).outcome,'UNKNOWN');
 assert.equal(actualMatches(result,{},{}),false);
});

test('boolean launcher linkage accepts only its exact original assets and source mint; query does not read files',()=>{
 const m=mock(),built=m.build(m.options),before=m.state.checks;
 assert.equal(m.matches(built,m.options.assets,m.options.source),true);
 assert.equal(m.state.checks,before);
 for(const value of [JSON.parse(JSON.stringify(built)),{get report(){throw Error('PRIVATE REPORT');}}]){
  assert.equal(m.matches(value,m.options.assets,m.options.source),false);assert.equal(actualMatches(value,m.options.assets,m.options.source),false);}
 const second=Object.freeze({...m.options.source});m.sourceBrands.add(second);
 assert.equal(m.matches(built,m.options.assets,second),false);assert.equal(m.matches(built,{},m.options.source),false);
 assert.equal(m.matches(built,m.options.assets,m.options.source,'extra'),false);assert.equal(m.matches(built,m.options.assets),false);
 assert.equal(m.state.checks,before);assert.equal(m.state.calls.length,1);
});
test('observed launcher invalidation permanently disables its private identity linkage without rewriting build history',()=>{
 const m=mock(),built=m.build(m.options);assert.equal(m.matches(built,m.options.assets,m.options.source),true);
 const row=m.nodes.get(m.output),original=Buffer.from(row.body);row.body[0]^=1;assert.equal(m.verify(built).outcome,'UNKNOWN');
 row.body=original;assert.equal(m.matches(built,m.options.assets,m.options.source),false);assert.equal(built.outcome,'LAUNCHER_BUILT_NOT_EXECUTED');
 assert.equal(m.state.calls.length,1);
});

test('strict build interface accepts only original assets/source/copies brands, no caller operations',()=>{
 for(const value of [undefined,{},Object.create(null),{assets:{},source:{},copies:{},compiler:'/OTHER'},
 {assets:{},source:{},copies:{},env:{}},{assets:{},source:{},copies:{},[Symbol()]:true}])assert.throws(()=>actual(value),error=>error.code==='BASE_COLLECTOR_LAUNCHER_BUILD_OPTIONS');
 const accessor={assets:{},copies:{}};Object.defineProperty(accessor,'source',{get(){throw Error('PRIVATE');}});
 assert.throws(()=>actual(accessor),error=>error.code==='BASE_COLLECTOR_LAUNCHER_BUILD_OPTIONS');
});

test('whole mock builds one fixed launcher in H, full-hashes ARM64 output and retains private currency',()=>{
 const m=mock(),result=m.build(m.options);assert.equal(result.outcome,'LAUNCHER_BUILT_NOT_EXECUTED');
 assert.equal(result.sourceWriteAttempts,1);assert.equal(result.sourceWriteCompleted,true);
 assert.equal(result.dispatchAttemptCount,1);assert.equal(result.dispatchResultCount,1);assert.equal(result.observedProcessCount,1);
 assert.equal(result.report.binary.sha256,sha(m.nodes.get(m.output).body));assert.equal(result.report.source.sha256,sha(m.nodes.get(m.file).body));
 assert.equal(m.state.calls.length,1);assert.equal(m.state.oldBuildCalls,0);assert.deepEqual(m.state.writes,[m.file]);assert.equal(m.handles.size,0);
 assert([...m.nodes.keys()].every(file=>!file.startsWith(m.a)&&!file.startsWith(m.b)));
 falseAuthority(result);assert(Object.isFrozen(result.report.binary));
 const current=m.verify(result);assert.equal(current.outcome,'LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED');assert.equal(current.launcherSha256,result.report.binary.sha256);falseAuthority(current);
});

for(const name of ['assets','source','copies'])test('unknown or different private '+name+' brand with identical public labels launches zero builds',()=>{
 const m=mock();m.options[name]=JSON.parse(JSON.stringify(m.options[name]));const result=m.build(m.options);
 assert.equal(result.outcome,'UNKNOWN');assert.equal(result.dispatchAttemptCount,0);assert.equal(m.state.calls.length,0);assert.equal(m.state.writes.length,0);assert.equal(m.state.toolCalls,0);
});
for(const fault of ['existing-source','existing-output','source-mode','source-owner','source-link','source-symlink','source-read-bytes','close','source-after-write','runtime-during-source-read','copies-during-source-read','source-mint-during-source-read'])
 test('mock '+fault+' cannot compile or overwrite/delete partial H paths',()=>{
 const m=mock(fault),saved=new Map([...m.nodes].map(([name,row])=>[name,Buffer.from(row.body)])),result=m.build(m.options);
 assert.equal(result.outcome,'UNKNOWN');assert.equal(result.dispatchAttemptCount,0);assert.equal(m.state.calls.length,0);assert.equal(m.handles.size,0);
 for(const[name,body]of saved)assert(m.nodes.get(name).body.equals(body));falseAuthority(result);
 });
for(const fault of ['spawn-throws','exit','signal','no-pid','header','output-link','source-after-compile','parent-after-compile','assets-after-compile','copies-after-compile'])
 test('mock compile/output '+fault+' retains honest attempt history and never publishes an artifact',()=>{
 const m=mock(fault),result=m.build(m.options);assert.equal(result.outcome,'UNKNOWN');assert.equal(result.report,null);
 assert.equal(result.dispatchAttemptCount,1);assert.equal(result.dispatchResultCount,fault==='spawn-throws'?0:1);
 assert.equal(result.observedProcessCount,fault==='spawn-throws'||fault==='no-pid'?0:1);
 assert(m.nodes.has(m.file));assert.equal(m.state.calls.length,1);assert.equal(m.handles.size,0);assert(!JSON.stringify(result).includes('PRIVATE'));falseAuthority(result);
 });
for(const late of ['source-during-binary','runtime-during-binary','assets-lost-after-binary','source-lost-after-binary','copies-lost-after-binary',
 'source-file-during-assets','source-file-during-source','source-file-during-copies','binary-during-assets','binary-during-source','binary-during-copies'])
 test('late '+late+' cannot hide earlier rows or revive restored private currency',()=>{
 const m=mock(),built=m.build(m.options);assert.equal(built.outcome,'LAUNCHER_BUILT_NOT_EXECUTED');
 m.state.late=late;assert.equal(m.verify(built).outcome,'UNKNOWN');m.state.late=null;m.state.valid={assets:true,source:true,copies:true};
 const checks=m.state.checks;assert.equal(m.verify(built).outcome,'UNKNOWN');assert.equal(m.state.checks,checks);
 assert.equal(built.outcome,'LAUNCHER_BUILT_NOT_EXECUTED');assert.equal(m.state.calls.length,1);
 });
for(const target of ['source','binary','parent'])test('changed '+target+' metadata or content invalidates permanently after restoration',()=>{
 const m=mock(),built=m.build(m.options),row=m.nodes.get(target==='source'?m.file:target==='binary'?m.output:m.h+'/prefix/native-probes'),saved={...row,body:Buffer.from(row.body)};
 if(target==='parent')row.ino+=1n;else row.body[0]^=1;
 assert.equal(m.verify(built).outcome,'UNKNOWN');Object.assign(row,saved);assert.equal(m.verify(built).outcome,'UNKNOWN');assert.equal(m.state.calls.length,1);
});
test('serialized successful report cannot adopt launcher build currency',()=>{
 const m=mock(),built=m.build(m.options);for(const value of [JSON.parse(JSON.stringify(built)),{outcome:'LAUNCHER_BUILT_NOT_EXECUTED'}]){
 assert.equal(m.verify(value).outcome,'UNKNOWN');assert.equal(actualCurrent(value).outcome,'UNKNOWN');}
});

test('a second live source mint with identical H/content cannot select copies from the first mint',()=>{
 const m=mock(),second=Object.freeze({...m.options.source});m.sourceBrands.add(second);m.options.source=second;
 const result=m.build(m.options);assert.equal(result.outcome,'UNKNOWN');assert.equal(result.dispatchAttemptCount,0);
 assert.equal(m.state.calls.length,0);assert.equal(m.state.writes.length,0);assert.equal(m.state.checks,0);
});
for(const kind of ['assets','source','copies'])test('unavailable current '+kind+' prerequisite launches zero compiler builds or writes',()=>{
 const m=mock();m.state.valid[kind]=false;const result=m.build(m.options);
 assert.equal(result.outcome,'UNKNOWN');assert.equal(result.dispatchAttemptCount,0);assert.equal(m.state.calls.length,0);assert.equal(m.state.writes.length,0);
});
