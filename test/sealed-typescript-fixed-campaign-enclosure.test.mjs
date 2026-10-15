// SOURCE/MOCK controls only. No native, actors, compiler, SDK or fixtures run.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {EventEmitter} from 'node:events';
import {collectFixedEnclosedCampaign as collect} from './acceptance/sealed-typescript-fixed-campaign-enclosed-collector.mjs';
import {prepareSealedTypeScriptFixedCampaignEnclosureSource as prepare,SEALED_TYPESCRIPT_ENCLOSURE_SOURCE_REFUSAL_STAGES as refusalStages,SEALED_TYPESCRIPT_ENCLOSURE_ORIGINAL_CURRENT_REFUSALS as currentRefusals} from './acceptance/sealed-typescript-fixed-campaign-enclosure-source.mjs';
import {parseSealedTypeScriptBaseExchangeResult as baseParse,createSealedTypeScriptBaseExchangeResultLatch as baseLatch} from './acceptance/sealed-typescript-base-exchange-result.mjs';
import {parseSealedTypeScriptStageExchangeResult as exchangeParse,createSealedTypeScriptStageExchangeResultLatch as exchangeLatch} from './acceptance/sealed-typescript-stage-exchange-result.mjs';
import {parseSealedTypeScriptStageResult as stageParse,createSealedTypeScriptStageResultLatch as stageLatch} from './acceptance/sealed-typescript-stage-result.mjs';
import {parseSealedTypeScriptMapResult as mapParse,createSealedTypeScriptMapResultLatch as mapLatch} from './acceptance/sealed-typescript-map-result.mjs';
const old=fs.readFileSync(new URL('./sealed-typescript-fixed-campaign.test.mjs',import.meta.url),'utf8');
// Reuse exactly the existing nonsecret protocol fixtures, without evaluating its
// test registrations or process factory. These are mock documents, not evidence.
const fixtureSource=old.slice(old.indexOf('const row='),old.indexOf('const reports='));
const reports=Function(fixtureSource+';return [base,exchange,node,mapper];')();
const roles=['whole_base','stage_exchange','node_stage','mapper'],exits=[74,74,1,74],limits=[4096,4096,8192,4096],parses=[baseParse,exchangeParse,stageParse,mapParse],latches=[baseLatch,exchangeLatch,stageLatch,mapLatch];
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function child(run){const c=new EventEmitter();c.pid=123;c.exitCode=null;c.signalCode=null;c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.kills=[];c.kill=s=>{c.kills.push(s);return true;};queueMicrotask(()=>run(c));return c;}
function close(c,code,signal=null){c.exitCode=code;c.signalCode=signal;c.emit('close',code,signal);}
function factory(events,modify){return role=>{const at=roles.indexOf(role);events.push('launch:'+role);return child(c=>{c.emit('spawn');if(modify?.(c,at)===false)return;c.stdout.emit('data',Buffer.from(JSON.stringify(reports[at]())+'\n'));events.push('close:'+role);close(c,exits[at]);});};}
const authority=r=>{assert.notEqual(r.outcome,'PASS');assert.equal(r.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(r.sealed,false);assert.equal(r.reuseEligible,false);};
function projection(events,{begin=true,end=true}={}){return{begin(){events.push('BEGIN');return begin;},end(){events.push('END');return end;}};}
test('original BEGIN then each real-close mock in fixed order then END, never before final close',async()=>{const events=[],r=await collect(factory(events),projection(events));assert.deepEqual(events,['BEGIN',...roles.flatMap(role=>['launch:'+role,'close:'+role]),'END']);assert.equal(r.begin,true);assert.equal(r.end,true);assert.equal(r.launchedCount,4);assert.equal(r.closedCount,4);assert.equal(r.allLaunchedDirectActorsReaped,true);authority(r);});
for(const key of ['begin','end'])test('original '+key+' refusal never becomes interval completeness',async()=>{const events=[],r=await collect(factory(events),projection(events,{[key]:false}));assert.equal(r.end,false);assert.equal(r.reason_code,key==='begin'?'ORIGINAL_BEGIN_UNAVAILABLE':'ORIGINAL_END_UNAVAILABLE');if(key==='begin')assert.deepEqual(events,['BEGIN']);authority(r);});
for(const mode of ['unspawned','badpid','signal','exit','stderr','overflow','invalid','error','throw','null'])test('no END for actor fault '+mode,async()=>{const events=[];const create=role=>{events.push('launch:'+role);if(mode==='throw')throw Error('PRIVATE');if(mode==='null')return null;return child(c=>{if(mode!=='unspawned')c.emit('spawn');if(mode==='badpid')c.pid=0;if(mode==='error')c.emit('error',Error('PRIVATE'));c.stdout.emit('data',Buffer.from(mode==='overflow'?'x'.repeat(4097):mode==='invalid'?'PRIVATE':JSON.stringify(reports[0]())+'\n'));if(mode==='stderr')c.stderr.emit('data',Buffer.from('PRIVATE'));close(c,mode==='signal'?null:mode==='exit'?0:74,mode==='signal'?'SIGTERM':null);});};const r=await collect(create,projection(events));assert.equal(r.end,false);assert(!events.includes('END'));assert(!JSON.stringify(r).includes('PRIVATE'));authority(r);});
for(let at=0;at<4;at++)test('valid assertion FAIL at '+roles[at]+' is retained and later actors not launched',async()=>{const events=[],r=await collect(factory(events,(c,index)=>{if(index!==at)return;const v=reports[index]();v.result='FAIL';if(index===3){v.checks[2].classification='ACCESS_SUCCEEDED';v.checks[2].errno_code='NONE';}else{const i=index===0?3:index===1?2:4;v.checks[i].result='FAIL';v.checks[i].reason_code='ACCESS_SUCCEEDED';if(index===2)v.implemented_checks_passed=false;}c.stdout.emit('data',Buffer.from(JSON.stringify(v)+'\n'));events.push('close:'+roles[index]);close(c,exits[index]);return false;}),projection(events));assert.equal(r.outcome,'FAIL');assert.equal(r.launchedCount,at+1);assert.equal(r.end,true);assert.equal(r.allLaunchedDirectActorsReaped,true);authority(r);});
for(const corruption of ['trailing','overflow','signal','stderr'])test('known valid FAIL survives later '+corruption+' without END authority',async()=>{const events=[],r=await collect(factory(events,(c,at)=>{const v=reports[0]();v.result='FAIL';v.checks[3].result='FAIL';v.checks[3].reason_code='ACCESS_SUCCEEDED';c.stdout.emit('data',Buffer.from(JSON.stringify(v)+'\n'));if(corruption==='trailing'||corruption==='overflow')c.stdout.emit('data',Buffer.from(corruption==='overflow'?'x'.repeat(4097):'PRIVATE'));if(corruption==='stderr')c.stderr.emit('data',Buffer.from('PRIVATE'));close(c,corruption==='signal'?null:74,corruption==='signal'?'SIGKILL':null);return false;}),projection(events));assert.equal(r.outcome,'FAIL');assert(!JSON.stringify(r).includes('PRIVATE'));if(corruption!=='trailing')assert.equal(r.end,false);authority(r);});
function clock(){let time=0;const timers=[];const selected=Function('roles','parses','latches','exits','limits','signals','freeze','performance','setTimeout','clearTimeout','return ('+Function.prototype.toString.call(collect)+');')(roles,parses,latches,exits,limits,signals,freeze,{now:()=>time},(fn,ms)=>{const t={fn,ms,active:true};timers.push(t);return t;},t=>{t.active=false;});return{selected,timers,set:n=>{time=n;}};}
test('one shared bounded allocation, no END after cumulative elapsed deadline',async()=>{const t=clock(),events=[],r=await t.selected(factory(events,(c,at)=>{t.set((at+1)*4000);}),projection(events));assert.deepEqual(t.timers.map(x=>x.ms),[11000,11500]);assert.equal(r.timedOut,true);assert.equal(r.end,false);assert.equal(r.launchedCount,3);assert(!events.includes('END'));assert(t.timers.every(t=>!t.active));});
test('timeout with descendant-potential requires group cleanup and no END even when direct stream looks finished',async()=>{const t=clock(),events=[];let actor;const pending=t.selected(()=>actor=child(c=>{c.emit('spawn');c.stdout.emit('end');c.stderr.emit('end');}),projection(events));await Promise.resolve();t.set(11000);t.timers[0].fn();t.set(11500);t.timers[1].fn();const r=await pending;assert.equal(r.end,false);assert.equal(r.allLaunchedDirectActorsReaped,false);assert.equal(r.ownedGroupCleanupRequired,true);assert.equal(r.closedCount,0);assert.equal(r.launchedCount,1);assert(actor.kills.length>=1);assert(!events.includes('END'));});
test('known failed assertion survives missing close/timeout with honest partial lifecycle',async()=>{const t=clock(),events=[];const pending=t.selected(()=>child(c=>{c.emit('spawn');const v=reports[0]();v.result='FAIL';v.checks[3].result='FAIL';v.checks[3].reason_code='ACCESS_SUCCEEDED';c.stdout.emit('data',Buffer.from(JSON.stringify(v)+'\n'));}),projection(events));await Promise.resolve();t.set(11500);t.timers[1].fn();const r=await pending;assert.equal(r.outcome,'FAIL');assert.equal(r.end,false);assert.equal(r.phases[0].closeObserved,false);assert.equal(r.phases[0].checks[3].reason_code,'ACCESS_SUCCEEDED');});
test('END itself consumes the same deadline; late result cannot authorize interval',async()=>{const t=clock(),events=[],p=projection(events);p.end=()=>{t.set(11001);return true;};const r=await t.selected(factory(events),p);assert.equal(r.end,false);assert.equal(r.timedOut,true);});
const sourceUrl=new URL('./acceptance/sealed-typescript-fixed-campaign-enclosure-source.mjs',import.meta.url),cSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-fixed-campaign-enclosure.c',import.meta.url),'utf8');
function renderer({selectedCollector=collect,faultStage=null,foreignError=null,currentFault=null,currentAt='FINAL'}={}){const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node';let changed=false,io=0,projectionCalls=0,nullCalls=0,matchCalls=0;const events=[],state={onProjection:null};
 const inputs={assetsBuild:{},pairedSource:{},pairedArtifacts:{},copies:{},projection:{version:'fixed-canary-original-input-projection@3',disabled:true,runnable:false,source:'export const fixedCanaryProtectedInputs={begin(){return true},end(){return true}};',projectionSha256:'a'.repeat(64)},preparedNullSource:{version:'campaign-prepared-devnull-setexec@2',preparedNullIdentityInterpretation:'prepared-null-device-endpoints@1',bindings:{node,entry:h+'/prefix/native-probes/paired-stage-campaign.mjs',launcher:h+'/prefix/native-probes/paired-stage-campaign-launch'}}};
 const sha=v=>createHash('sha256').update(v).digest('hex');inputs.projection.sourceSha256=sha(inputs.projection.source);inputs.preparedNullSource.source='node '+node+' entry '+inputs.preparedNullSource.bindings.entry+' launcher '+inputs.preparedNullSource.bindings.launcher;inputs.preparedNullSource.sourceSha256=sha(inputs.preparedNullSource.source);
 const matches=(p,x,s,y,c)=>{matchCalls++;return !(currentFault==='DERIVATION'&&matchCalls===(currentAt==='INITIAL'?2:3))&&p===inputs.projection&&x===inputs.assetsBuild&&s===inputs.pairedSource&&y===inputs.pairedArtifacts&&c===inputs.copies;};
 const verifyProjection=p=>{events.push('projection');projectionCalls++;if(state.onProjection)state.onProjection();if(projectionCalls===(currentAt==='INITIAL'?1:2)&&currentFault==='PROJECTION_CURRENT')throw foreignError;if(projectionCalls===(currentAt==='INITIAL'?1:2)&&currentFault==='PROJECTION_RESULT')return{outcome:'UNKNOWN',get version(){assert.fail('short-circuited projection property read');}};return{outcome:!changed&&p===inputs.projection?'FIXED_CANARY_ORIGINAL_INPUT_GUARDS_OBSERVED':'UNKNOWN',version:p.version,sourceSha256:p.sourceSha256};};
 const verifyNull=p=>{events.push('null');nullCalls++;if(nullCalls===(currentAt==='INITIAL'?2:3)&&currentFault==='PREPARED_NULL_CURRENT')throw foreignError;if(nullCalls===(currentAt==='INITIAL'?2:3)&&currentFault==='PREPARED_NULL_RESULT')return{outcome:'UNKNOWN',get version(){assert.fail('short-circuited null property read');}};return p===inputs.preparedNullSource?({outcome:!changed?'CAMPAIGN_PREPARED_NULL_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED':'UNKNOWN',version:p.version,preparedNullIdentityInterpretation:p.preparedNullIdentityInterpretation,sourceSha256:p.sourceSha256}):({outcome:'UNKNOWN'});};
 const campaign=()=>({disabled:true,baseA:a,baseB:b,hostBase:h,node,entry:inputs.preparedNullSource.bindings.entry,cwd:a+'/Checkout 空间/.sealed-native-canaries',actors:roles.map((role,at)=>({role,file:at===2?node:h+'/prefix/native-probes/actor-'+at,args:at===2?[h+'/prefix/native-probes/check.mjs']:[],fileSha256:'b'.repeat(64)}))});
 let text=fs.readFileSync(sourceUrl,'utf8').replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replaceAll('export const ','const ').replaceAll('import.meta.url',JSON.stringify(sourceUrl.href));
 // Explicit source fault injection only. No native/real boundary claim. The
 // unchanged existing negative tests separately exercise actual predicates.
 if(faultStage){assert(refusalStages.includes(faultStage));if(faultStage==='OPTIONS')text=text.replace(" try{\n guard(arguments.length===1&&options"," try{throw foreignError;\n guard(arguments.length===1&&options");else text=text.replace("refusalStage='"+faultStage+"';","refusalStage='"+faultStage+"';throw foreignError;");}
 if(currentFault&&/^(?:C|COLLECTOR)_SOURCE_/.test(currentFault)){
  const index=currentFault.startsWith('C_')?0:1;
  if(currentFault.endsWith('_READ'))text=text.replace('const next=readSource(path.basename(row.file),row.pin);','const next=readSource(path.basename(row.file),index==='+index+"?'0'.repeat(64):row.pin);");
  if(currentFault.endsWith('_IDENTITY'))text=text.replace('guard(next.mark===row.mark',"if(index==="+index+")next.mark='MOCK_MISMATCH';guard(next.mark===row.mark");
  if(currentFault.endsWith('_NAMED'))text=text.replace('named(record.rows[index]);',"named(index==="+index+"?{...record.rows[index],mark:'MOCK_MISMATCH'}:record.rows[index]);");
 }const counting=new Proxy(fs,{get(target,key){if(['lstatSync','realpathSync','openSync','readSync','fstatSync','closeSync'].includes(key))return(...args)=>{io++;return target[key](...args);};return target[key];}});
 const [invoke,verify,matchesSource]=Function('fs','path','fileURLToPath','createHash','collectFixedEnclosedCampaign','foreignError','prepareSealedTypeScriptFixedCampaignSource','verifySealedTypeScriptFixedCanaryProtectedInputProjection','sealedTypeScriptFixedCanaryProtectedInputProjectionMatchesDerivation','verifySealedTypeScriptFixedCampaignPreparedNullSource',text+';return [prepareSealedTypeScriptFixedCampaignEnclosureSource,verifySealedTypeScriptFixedCampaignEnclosureSource,sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation];')(counting,path,fileURLToPath,createHash,selectedCollector,foreignError,campaign,verifyProjection,matches,verifyNull);
 return{inputs,invoke,verify,matchesSource,io:()=>io,change:()=>{changed=true;},state,events};
}
test('public setup rejects arbitrary/copy/getter inputs before any physical source IO',()=>{for(const value of [null,{},[],{assetsBuild:{},pairedSource:{},pairedArtifacts:{},copies:{},projection:{},preparedNullSource:{}}])assert.throws(()=>prepare(value));const r=renderer();assert.throws(()=>r.invoke(structuredClone(r.inputs)));assert.equal(r.io(),0);let accessed=0;const accessor={...r.inputs};Object.defineProperty(accessor,'projection',{get(){accessed++;return r.inputs.projection;}});assert.throws(()=>r.invoke(accessor));assert.equal(accessed,0);assert.equal(r.io(),0);});
test('composition binds one original projection, original fixed actors and new distinct portable paths, not a runtime substitution',()=>{const r=renderer(),v=r.invoke(r.inputs);assert.equal(v.runnable,false);assert.equal(v.executionAuthority,'NONE');assert.equal(v.files.length,4);assert(v.files.every(f=>f.sourceBytes===Buffer.byteLength(f.source)&&f.sourceSha256===createHash('sha256').update(f.source).digest('hex')));assert.equal(v.files[0].source,r.inputs.projection.source);assert.match(v.files[1].source,/detached:false/);assert.match(v.files[1].source,/result\.outcome==='FAIL'\?'F':'E'/);assert.match(v.files[2].source,/paired-stage-enclosed-campaign\.mjs/);assert(!v.files[2].source.includes('entry '+r.inputs.preparedNullSource.bindings.entry));assert.equal(v.bindings.entry.endsWith('/paired-stage-enclosed-campaign.mjs'),true);assert(v.blockers.includes('NEW_ENCLOSURE_CODE_PROVISIONING_AND_ORIGINAL_CURRENTNESS_NOT_ESTABLISHED'));assert.equal(v.actualExecution,'NOT_RUN');assert.equal(r.verify(v).outcome,'FIXED_CANARY_ENCLOSURE_SOURCE_INPUTS_CURRENTLY_OBSERVED_NOT_PROVISIONED');r.change();assert.equal(r.verify(v).outcome,'UNKNOWN');assert.equal(r.verify(v).outcome,'UNKNOWN');assert.equal(r.verify(structuredClone(v)).outcome,'UNKNOWN');});
test('C source closes the specific session/ACK/parent-death and result-publication boundaries',()=>{assert.match(cSource,/setsid\(\)<0\|\|getpid\(\)!=getpgrp\(\)\|\|getpid\(\)!=getsid\(0\)/);assert(cSource.indexOf('!watchdog()||!timely(absolute_limit)')<cSource.indexOf('struct ack a='));assert.match(cSource,/getppid\(\)==expected_parent/);assert.match(cSource,/kill\(0,SIGKILL\)/);assert.match(cSource,/POSIX_SPAWN_CLOEXEC_DEFAULT/);assert.match(cSource,/pipe\(p\)/);assert.match(cSource,/!S_ISFIFO/);assert.match(cSource,/fcntl\(p\[at\],F_SETFD,FD_CLOEXEC\)/);assert.match(cSource,/if\(own_group\).*kill\(-child,SIGKILL\)/);assert.match(cSource,/else if\(kill\(child,SIGKILL\)/);assert.match(cSource,/signal_preconditions\(\)/);assert.match(cSource,/SIGPIPE,&a,NULL/);assert(!/execvp|system\(|popen\(|setsid\(.*argv|JSON|mkfifo|setenv|putenv/.test(cSource));});
test('waitpid releases PID only while watchdog blocked; no later destructive numeric-group kill',()=>{const critical=cSource.slice(cSource.indexOf('sigset_t block,old;'),cSource.indexOf('const int normal_exit='));assert(critical.indexOf('sigprocmask(SIG_BLOCK')<critical.indexOf('waitpid(child'));assert(critical.indexOf('reaped=1;owned_pid=0;own_group=0')<critical.indexOf('sigprocmask(SIG_SETMASK'));assert.match(critical,/wait_error!=EINTR\)\{owned_pid=0;own_group=0;failed=1/);const after=cSource.slice(cSource.indexOf('const int normal_exit='));assert(!/kill\([^;]+SIGKILL/.test(after));assert.match(after,/kill\(-child,0\)==0\|\|errno!=ESRCH/);assert(after.indexOf('kill(-child,0)')<after.indexOf('write(1,payload'));});
test('one bounded budget includes publication; known FAIL uses separate controlled group cleanup, not invented END',()=>{for(const value of [11000,11500,13750,14000,14750,14900])assert((cSource+fs.readFileSync(new URL('./acceptance/sealed-typescript-fixed-campaign-enclosed-collector.mjs',import.meta.url),'utf8')).includes(String(value)));assert.match(cSource,/asserted_fail&&WEXITSTATUS\(status\)!=1/);assert.match(cSource,/if\(asserted_fail\)\{\(void\)kill\(0,SIGKILL\)/);assert.match(cSource,/result\.failed_assertion&&WIFSIGNALED\(status\)&&WTERMSIG\(status\)==SIGKILL/);});

test('foreign prepared-null getter cannot run; stale loaded collector function is refused',()=>{const r=renderer();let getters=0;const foreign={get sourceSha256(){getters++;throw Error('PRIVATE');}};assert.throws(()=>r.invoke({...r.inputs,preparedNullSource:foreign}));assert.equal(getters,0);assert.equal(r.io(),0);const stale=renderer({selectedCollector:function stale(){return null;}});assert.throws(()=>stale.invoke(stale.inputs));assert.equal(stale.io(),0);});
test('worker cannot start any actor until parent records group ownership and grants private fixed GO',()=>{const worker=cSource.slice(cSource.indexOf('static void worker('),cSource.indexOf('int main('));assert(worker.indexOf('struct ack a=')<worker.indexOf('while(!gate_eof'));assert(worker.indexOf('go!=GO')<worker.indexOf('posix_spawn(&child'));assert(worker.indexOf('!close_fd(&gate)')<worker.indexOf('posix_spawn(&child'));assert.match(worker,/\(size_t\)n>sizeof\(go\)-gate_used/);const parent=cSource.slice(cSource.indexOf('int main('));assert(parent.indexOf('own_group=1;')<parent.indexOf('send_private(gate[1]'));assert(parent.indexOf('close_fd(&gate[1])',parent.indexOf('own_group=1;'))>parent.indexOf('send_private(gate[1]'));assert.match(parent,/close_fd\(&control\[0\]\).*close_fd\(&gate\[1\]\)/);});

test('publication labels distinguish original-END normal result from known FAIL without invented END',()=>{const r=renderer(),v=r.invoke(r.inputs);assert.deepEqual(v.capturePublication,{E:'ORIGINAL_END_THEN_COLLECTOR_REAP_WORKER_REAP_AND_GROUP_ABSENCE',F:'KNOWN_ASSERTION_FAIL_THEN_CONTROLLED_GROUP_CLEANUP_WORKER_REAP_AND_GROUP_ABSENCE_END_NOT_REQUIRED'});assert.match(cSource,/E requires original END and normal collector\/worker completion/);assert.match(cSource,/F retains a known assertion FAIL after controlled owned-group cleanup/);assert.match(cSource,/it does NOT require or invent END/);assert(!cSource.includes('AFTER valid END, direct worker reap'));});

// Source/mock transport controls only: no C compilation, kernel I/O, native
// envelope, sandbox, actor, compiler or model execution is established here.
// Evaluate the exact final C predicate over finite integers after independently
// asserting all preceding private-frame/cleanup/refusal guards still exist.
function sourceTransportExit(at,length,deadlineValid){
 const tail=cSource.slice(cSource.lastIndexOf('size_t at=0;'));
 const matched=tail.match(/return (at==result\.length&&timely\(absolute_limit\))\?0:74;/);
 assert(matched,'exact completion predicate must remain source bound');
 return Function('at','result','timely','absolute_limit','return ('+matched[1]+')?0:74;')(at,{length},()=>deadlineValid,14900);
}
test('source@2 uses RDE2 on both protected frame producers/consumers and declares collection-only exit meaning',()=>{
 const r=renderer(),v=r.invoke(r.inputs);
 assert.equal(v.version,'fixed-canary-finite-enclosure-source@2');
 assert.deepEqual(v.collectionTransport,{interpretation:'finite-enclosure-normal-collection@2',frame:'RDE2',completeCollectionExit:0,incompleteCollectionExit:74,collectorExit:{E:74,F:1},assertionAuthority:'JSON_BODY_ONLY_NOT_OUTER_EXIT',nativeResultAcceptance:'NOT_TESTED'});
 assert.match(cSource,/finite enclosure@2/);assert.match(cSource,/frame\[\]="RDE2:/);
 assert.match(v.files[1].source,/Buffer\.from\('RDE2:/);
 assert(!cSource.includes('RDE1:'));assert(!v.files[1].source.includes('RDE1:'));
 assert.match(v.files[1].source,/process\.exitCode=result\?\.outcome==='FAIL'\?1:74;/);
 assert.deepEqual(exits,[74,74,1,74]);authority(v);
});
for(const [frame,outcome,collectorExit]of [['E','UNKNOWN',74],['F','FAIL',1]])test('complete '+frame+' collection exits0 but body stays '+outcome,async()=>{
 const events=[];
 const r=await collect(factory(events,frame==='F'?(c,index)=>{if(index!==0)return;const v=reports[0]();v.result='FAIL';v.checks[3].result='FAIL';v.checks[3].reason_code='ACCESS_SUCCEEDED';c.stdout.emit('data',Buffer.from(JSON.stringify(v)+'\n'));close(c,exits[0]);return false;}:undefined),projection(events));
 assert.equal(r.outcome,outcome);assert.equal(r.end,true);
 assert.equal(r.outcome==='FAIL'?1:74,collectorExit);
 const payload=Buffer.from(JSON.stringify(r)+'\n');
 assert.equal(sourceTransportExit(payload.length,payload.length,true),0);
 assert.equal(JSON.parse(payload).outcome,outcome);authority(r);
});
for(const length of [1,2,4096,32768])test('incomplete or late '+length+' byte publication retains exit74',()=>{
 for(const at of [0,Math.max(0,length-1)])assert.equal(sourceTransportExit(at,length,true),74);
 assert.equal(sourceTransportExit(length,length,false),74);
 assert.equal(sourceTransportExit(length,length,true),0);
});
test('transport0 remains behind exact private E/F frame, reap, group-absence and post-write deadline guards',()=>{
 const parent=cSource.slice(cSource.indexOf('int main(')),publication=parent.indexOf('size_t at=0;');
 for(const guard of ['result.magic!=RESULT','result.length==0','result.length>LIMIT','used!=sizeof(struct ack)+sizeof(result)+result.length','!timely(began+14000)','!reaped||failed||(!normal_exit&&!controlled_failed_cleanup)','kill(-child,0)==0||errno!=ESRCH||!timely(began+14750)'])assert(parent.indexOf(guard)>=0&&parent.indexOf(guard)<publication);
 const tail=parent.slice(publication);
 assert.match(tail,/while\(at<result\.length&&timely\(absolute_limit\)\)/);
 assert.match(tail,/else if\(n<0&&errno==EINTR\)continue;else return 74;/);
 assert(tail.indexOf('write(1,payload')<tail.indexOf('return at==result.length&&timely(absolute_limit)?0:74;'));
 assert(!tail.includes('(void)at;return 74;'));
 assert.match(cSource,/asserted_fail&&WEXITSTATUS\(status\)!=1/);
 assert.match(cSource,/!asserted_fail&&\(WEXITSTATUS\(status\)!=74/);
 assert.match(cSource,/output\[prefix\]!='E'&&output\[prefix\]!='F'/);
});

test('retired projection interpretation cannot select a new enclosure source',()=>{const r=renderer();r.inputs.projection.version='fixed-canary-original-input-projection@2';assert.throws(()=>r.invoke(r.inputs));assert.equal(r.io(),0);});

test('private source derivation binds exactly six original capabilities without IO or public getters',()=>{
 const r=renderer(),v=r.invoke(r.inputs),caps=Object.values(r.inputs),before=r.io();let traps=0;
 const foreign=new Proxy({},{get(){traps++;throw Error('PRIVATE');},getPrototypeOf(){traps++;throw Error('PRIVATE');}});
 assert.equal(r.matchesSource(v,...caps),true);
 for(let at=0;at<6;at++){const wrong=[...caps];wrong[at]=foreign;assert.equal(r.matchesSource(v,...wrong),false);}
 for(const value of [undefined,null,{},structuredClone(v),foreign])assert.equal(r.matchesSource(value,...caps),false);
 assert.equal(r.matchesSource(v,...caps.slice(0,-1)),false);assert.equal(r.matchesSource(v,...caps,foreign),false);
 assert.equal(traps,0);assert.equal(r.io(),before);
 r.change();assert.equal(r.matchesSource(v,...caps),true);assert.equal(r.io(),before);assert.equal(r.verify(v).outcome,'UNKNOWN');const after=r.io();assert.equal(r.matchesSource(v,...caps),false);assert.equal(r.io(),after);
});

const expectedRefusalStages=['OPTIONS','ORIGINAL_DERIVATION','PREPARED_NULL_CURRENT','INITIAL_ORIGINAL_CURRENT','PROJECTION_INTERPRETATION','CAMPAIGN_RENDER','DERIVED_BINDINGS','COLLECTOR_FUNCTION_PIN','C_TEMPLATE_READ','COLLECTOR_TEMPLATE_READ','LAUNCHER_REBIND','ENCLOSURE_REBIND','FINAL_ORIGINAL_CURRENT','SOURCE_RESULT'];
test('factory refusal vocabulary is a fixed frozen enum with no caller-controlled reason',()=>{assert.deepEqual(refusalStages,expectedRefusalStages);assert(Object.isFrozen(refusalStages));});
for(const stage of expectedRefusalStages)test('source-injected '+stage+' failure records only its owned static refusal stage',()=>{
 let touched=0;const foreignError={get message(){touched++;return 'SECRET_INNER_MESSAGE';},get code(){touched++;return 'SECRET_INNER_CODE';},get stack(){touched++;return 'SECRET_INNER_STACK';},get refusalStage(){touched++;return 'SECRET_INNER_STAGE';}};
 const r=renderer({faultStage:stage,foreignError});let caught;
 try{r.invoke(r.inputs);assert.fail('source-injected refusal must throw');}catch(error){caught=error;}
 assert.notEqual(caught,foreignError);assert.equal(caught.message,'ENCLOSURE_SOURCE_UNAVAILABLE');assert.equal(caught.refusalStage,stage);assert.equal(touched,0);
 assert.deepEqual(Object.keys(caught),['refusalStage']);assert.equal(Object.hasOwn(caught,'code'),false);assert(!String(caught.stack).includes('SECRET_INNER'));
 const field=Object.getOwnPropertyDescriptor(caught,'refusalStage');assert.equal(field.writable,false);assert.equal(field.configurable,false);assert.equal(field.enumerable,true);
 assert.equal(JSON.stringify(caught),JSON.stringify({refusalStage:stage}));
});
test('real existing option/derivation/collector pin refusals retain throws and accurate local stages',()=>{
 const r=renderer();assert.throws(()=>r.invoke({}),error=>error.message==='ENCLOSURE_SOURCE_UNAVAILABLE'&&error.refusalStage==='OPTIONS');
 assert.throws(()=>r.invoke({...r.inputs,assetsBuild:{}}),error=>error.refusalStage==='ORIGINAL_DERIVATION');
 assert.throws(()=>r.invoke({...r.inputs,preparedNullSource:{}}),error=>error.refusalStage==='PREPARED_NULL_CURRENT');
 const stale=renderer({selectedCollector:function stale(){}});assert.throws(()=>stale.invoke(stale.inputs),error=>error.refusalStage==='COLLECTOR_FUNCTION_PIN');
 const good=r.invoke(r.inputs);assert.equal(good.outcome,'FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED');assert.equal(Object.hasOwn(good,'refusalStage'),false);assert.equal(good.runnable,false);assert.equal(good.executionAuthority,'NONE');
});

const expectedCurrentRefusals=['DERIVATION','PROJECTION_CURRENT','PREPARED_NULL_CURRENT','PROJECTION_RESULT','PREPARED_NULL_RESULT','C_SOURCE_READ','C_SOURCE_IDENTITY','COLLECTOR_SOURCE_READ','COLLECTOR_SOURCE_IDENTITY','C_SOURCE_NAMED','COLLECTOR_SOURCE_NAMED'];
test('original-current refusal vocabulary is fixed/frozen and distinct from outer factory stages',()=>{assert.deepEqual(currentRefusals,expectedCurrentRefusals);assert(Object.isFrozen(currentRefusals));});
for(const step of expectedCurrentRefusals)test('final original-current source/mock fault '+step+' remains refused with precise owned static data',()=>{
 let touched=0;const foreignError=new Proxy({},{get(){touched++;throw Error('SECRET_INNER_GETTER');}}),r=renderer({currentFault:step,foreignError});let error;
 assert.throws(()=>r.invoke(r.inputs),caught=>{error=caught;return caught.message==='ENCLOSURE_SOURCE_UNAVAILABLE'&&caught.refusalStage==='FINAL_ORIGINAL_CURRENT'&&caught.originalCurrentRefusal===step;});
 const field=Object.getOwnPropertyDescriptor(error,'originalCurrentRefusal');assert.equal(field.writable,false);assert.equal(field.configurable,false);assert.equal(field.enumerable,true);assert.equal(touched,0);assert.deepEqual(Object.keys(error),['refusalStage','originalCurrentRefusal']);
 if(step==='PROJECTION_RESULT'||step==='PREPARED_NULL_RESULT')assert.deepEqual(r.events,['null','projection','null','projection','null'],'both current verifiers run in original order before result guards');
});
test('initial current reports UNKNOWN return without pretending it is a final or file-read failure',()=>{
 const r=renderer();r.change();assert.throws(()=>r.invoke(r.inputs),error=>error.refusalStage==='PREPARED_NULL_CURRENT'&&!Object.hasOwn(error,'originalCurrentRefusal'));
 const injected=renderer({faultStage:'INITIAL_ORIGINAL_CURRENT',foreignError:Error('PRIVATE')});assert.throws(()=>injected.invoke(injected.inputs),error=>error.refusalStage==='INITIAL_ORIGINAL_CURRENT'&&!Object.hasOwn(error,'originalCurrentRefusal'),'failure before current started has no invented inner observation');
});
test('reentrant inner factory refusal cannot overwrite outer current diagnostics or a successful result',()=>{
 const r=renderer();let entered=false,nested;
 r.state.onProjection=()=>{if(entered)return;entered=true;try{r.invoke({...r.inputs,preparedNullSource:{}});}catch(error){nested=error;}};
 const value=r.invoke(r.inputs);assert.equal(nested.refusalStage,'PREPARED_NULL_CURRENT');assert(!Object.hasOwn(nested,'originalCurrentRefusal'));assert.equal(value.outcome,'FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED');assert(!Object.hasOwn(value,'refusalStage'));assert(!Object.hasOwn(value,'originalCurrentRefusal'));assert.deepEqual(r.events,['null','projection','null','null','projection','null']);
});

for(const step of expectedCurrentRefusals.slice(0,5))test('initial original-current source/mock fault '+step+' has its own local exact observation',()=>{
 const r=renderer({currentFault:step,currentAt:'INITIAL',foreignError:Error('PRIVATE')});assert.throws(()=>r.invoke(r.inputs),error=>error.refusalStage==='INITIAL_ORIGINAL_CURRENT'&&error.originalCurrentRefusal===step);
 if(step==='PROJECTION_RESULT'||step==='PREPARED_NULL_RESULT')assert.deepEqual(r.events,['null','projection','null']);
});

for(const interpretation of [undefined,null,'prepared-null-device-endpoints@0','prepared-null-device-endpoints@2'])test('enclosure refuses absent or incompatible prepared device interpretation '+String(interpretation),()=>{
 const r=renderer();r.inputs.preparedNullSource.preparedNullIdentityInterpretation=interpretation;assert.throws(()=>r.invoke(r.inputs),error=>error.refusalStage==='PREPARED_NULL_CURRENT');assert.equal(r.io(),0);
});
test('original prepared device interpretation remains required in every later source-current observation',()=>{
 const r=renderer(),value=r.invoke(r.inputs);r.inputs.preparedNullSource.preparedNullIdentityInterpretation='prepared-null-device-endpoints@0';assert.equal(r.verify(value).outcome,'UNKNOWN');r.inputs.preparedNullSource.preparedNullIdentityInterpretation='prepared-null-device-endpoints@1';assert.equal(r.verify(value).outcome,'UNKNOWN');
});
