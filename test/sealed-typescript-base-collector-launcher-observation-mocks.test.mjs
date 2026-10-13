// Deterministic injected observation controls. No real fixture, compiler build,
// launcher, fixed Node/collector/helper/native/model or state is accessed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {observeSealedTypeScriptBaseCollectorLauncher} from './sealed-typescript-base-collector-launcher-observation.test.mjs';
const cwd='/mock/owned',local=cwd+'/.local/portable-evidence',a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333';
const metadata=(kind,extra={})=>({dev:1n,ino:kind==='directory'?2n:3n,mode:kind==='directory'?0o40755n:0o100600n,uid:501n,gid:20n,nlink:kind==='directory'?2n:1n,size:0n,mtimeNs:1n,ctimeNs:1n,
 isDirectory:()=>kind==='directory',isFile:()=>kind==='file',isSymbolicLink:()=>kind==='symlink',...extra});
function mock(){
 const state={time:0,parent:metadata('directory'),body:null,file:null,read:false,clockThrows:false},calls={operations:[],diagnostics:[],writes:[],closes:[],platform:0,imports:0};
 const processRow={pidObserved:true,status:0,signal:null,spawnError:'NONE',completed:true,stdoutBytes:0,stderrBytes:0};
 const pair={outcome:'BASE_EXCHANGE_PAIR_PREPARED',baseA:a,baseB:b},host={outcome:'CI_SYNTHETIC_BOOTSTRAP_PREPARED',base:h},hostFixture={outcome:'SYNTHETIC_FIXTURE_PREPARED'};
 const assets={outcome:'BUILT_NOT_EXECUTED',dispatchAttemptCount:3,dispatchResultCount:3,observedProcessCount:3,builds:[{...processRow},{...processRow},{...processRow}],commands:[],sealed:false,reuseEligible:false};
 const source={scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',disabled:true,bindings:{baseA:a,baseB:b,hostBase:h},proposedLauncher:{file:h+'/prefix/native-probes/base-exchange-collect-launch.c',sha256:'s'.repeat(64),sourceBytes:123,templateSha256:'t'.repeat(64)}};
 const copies={outcome:'COLLECTOR_COPIES_OBSERVED_NOT_EXECUTED',fileCreateCount:4,directoryCreateCount:3,sealed:false,reuseEligible:false};
 const launcher={outcome:'LAUNCHER_BUILT_NOT_EXECUTED',dispatchAttemptCount:1,dispatchResultCount:1,observedProcessCount:1,builds:[{...processRow}],sourceWriteAttempts:1,sourceWriteCompleted:true,
 report:{source:{file:source.proposedLauncher.file,sha256:'s'.repeat(64)},binary:{file:h+'/prefix/native-probes/base-exchange-collect-launch',sha256:'b'.repeat(64)}},commands:[],sealed:false,reuseEligible:false};
 const operations={
 preparePair(){return pair;},createHost(){return host;},prepareHostFixture(value){assert.equal(value,host);return hostFixture;},
 buildAssets(value){assert.deepEqual(value,{pair,hostFixture});return assets;},verifyAssets(value){assert.equal(value,assets);return{outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'};},
 prepareSource(value){assert.equal(value,assets);return source;},provisionCopies(value){assert.equal(value,source);return copies;},
 verifyCopies(value){assert.equal(value,copies);return{outcome:'COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:a,baseB:b,hostBase:h};},
 buildLauncher(value){assert.deepEqual(value,{assets,source,copies});return launcher;},
 verifyLauncher(value){assert.equal(value,launcher);return{outcome:'LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:a,baseB:b,hostBase:h,launcherSha256:'b'.repeat(64),launcherSourceSha256:'s'.repeat(64)};}
 };
 for(const [name,operation]of Object.entries(operations))operations[name]=(...args)=>{calls.operations.push(name);state.time++;return operation(...args);};
 const filesystem={constants:{O_RDONLY:0,O_NOFOLLOW:256,O_NONBLOCK:4},realpathSync:file=>file,
 lstatSync(file,options){assert.deepEqual(options,{bigint:true});if(file===local)return{...state.parent};assert.equal(file,state.file);return metadata('file',{size:BigInt(state.body.length)});},
 writeFileSync(file,body,options){assert.deepEqual(options,{mode:0o600,flag:'wx'});assert.equal(calls.writes.length,0);calls.writes.push(file);state.body=Buffer.from(body);state.file=file;
 state.parent={...state.parent,mtimeNs:2n,ctimeNs:2n,size:1n};state.time+=2;},
 openSync(file,flags){assert.equal(file,state.file);assert.equal(flags,260);return 42;},
 fstatSync(fd,options){assert.equal(fd,42);assert.deepEqual(options,{bigint:true});return metadata('file',{size:BigInt(state.body.length)});},
 readSync(fd,buffer,offset,length,position){assert.equal(fd,42);assert.equal(offset,position);assert(length<=state.body.length+1);state.read=true;state.time++;
 const bytes=state.body.subarray(position,position+length);bytes.copy(buffer,offset);return bytes.length;},
 closeSync(fd){assert.equal(fd,42);calls.closes.push(fd);state.time++;}
 };
 const options={cwd,uid:501,filesystem,now:()=>{if(state.clockThrows)throw Error('PRIVATE CLOCK ERROR');return state.time;},uuid:()=> 'fixed-mock-id',
 diagnostic:text=>{calls.diagnostics.push(JSON.parse(text));state.time++;},platformReady:()=>{calls.platform++;state.time++;return true;},
 loadOperations:()=>{calls.imports++;state.time++;return operations;}};
 return{run:()=>observeSealedTypeScriptBaseCollectorLauncher(options),options,operations,filesystem,calls,state,pair,host,assets,source,copies,launcher};
}
function noAuthority(report){for(const key of ['helperExecutions','nativeAgentLaunches','models','compilerCheckExecutions','receiptWrites'])assert.equal(report[key],0);
 assert.equal(report.sealed,false);assert.equal(report.reuseEligible,false);}
function unknown(observed,m){assert.equal(observed.completed,false);assert.equal(observed.recordVerified,false);assert.equal(observed.outcome,'UNKNOWN');
 assert.equal(m.calls.diagnostics.at(-1).scope,'BASE_COLLECTOR_LAUNCHER_RECORD_UNKNOWN');noAuthority(observed.report);}
const expected=['preparePair','createHost','prepareHostFixture','buildAssets','verifyAssets','prepareSource','provisionCopies','verifyCopies','buildLauncher','verifyLauncher'];

test('fresh same-process pipeline reports three prerequisite builds plus one new build and distinct 4/1 source writes',async()=>{
 const m=mock(),observed=await m.run();assert.deepEqual(m.calls.operations,expected);assert.equal(observed.completed,true);assert.equal(observed.recordVerified,true);
 assert.equal(observed.outcome,'BUILT_NOT_EXECUTED');assert.equal(observed.totalElapsedMs,18);
 assert.deepEqual(observed.report.counters,{prerequisiteBuildAttempts:3,launcherBuildAttempts:1,compilerBuildAttempts:4,prerequisiteBuildResults:3,launcherBuildResults:1,
 prerequisitePidObservedCount:3,launcherPidObservedCount:1,collectorCopyFileCount:4,launcherSourceWriteAttempts:1,launcherSourceWriteCompleted:true,launcherSourceFileCount:1});
 assert.equal(observed.report.launcherBuild.report.source.sha256,'s'.repeat(64));assert.equal(observed.report.launcherBuild.report.binary.sha256,'b'.repeat(64));
 assert.equal(observed.phaseCostsMs.prerequisiteThreeBuilds,1);assert.equal(observed.phaseCostsMs.oneLauncherBuild,1);
 assert.equal(observed.phaseCostsMs.persistence,2);assert.equal(observed.phaseCostsMs.recordReadback,3);assert.equal(observed.phaseCostsMs.publication,1);
 const saved=JSON.parse(m.state.body);assert.equal(saved.elapsedMsScope,'PRE_PERSISTENCE_SNAPSHOT');assert.equal(saved.phaseCostsScope,'THROUGH_PRE_RECORD_VALIDATION');
 assert.equal(saved.observationCompleted,false);assert.equal(saved.recordVerified,false);assert.equal(saved.phaseCostsMs.publication,undefined);
 assert.equal(m.calls.diagnostics[0].observationStatus,'PENDING_FINAL_BUDGET_CHECK');assert.equal(m.calls.diagnostics[0].recordVerified,false);
 assert.equal(m.calls.diagnostics[0].elapsedMsScope,'PRE_PUBLICATION_SNAPSHOT');assert.equal(m.calls.closes.length,1);noAuthority(observed.report);
});
for(const [name,alter]of [
 ['symlink',m=>{m.state.parent=metadata('symlink');}],['unowned',m=>{m.state.parent.uid=502n;}],
 ['group writable',m=>{m.state.parent.mode=0o40775n;}],['world writable',m=>{m.state.parent.mode=0o40757n;}],
 ['file selector',m=>{m.state.parent=metadata('file');}],['noncanonical selector',m=>{m.filesystem.realpathSync=file=>file===local?'/mock/alias':file;}]
])test('unsafe raw local selector causes zero probes/imports/fixtures/builds: '+name,async()=>{
 const m=mock();alter(m);const observed=await m.run();unknown(observed,m);assert.equal(m.calls.platform,0);assert.equal(m.calls.imports,0);
 assert.deepEqual(m.calls.operations,[]);assert.equal(m.calls.writes.length,0);assert.equal(observed.report.counters.compilerBuildAttempts,0);
});
test('failed platform prerequisite launches no fixture or process and saves only a refusal',async()=>{
 const m=mock();m.options.platformReady=()=>false;const observed=await m.run();assert.equal(observed.completed,false);assert.equal(observed.outcome,'UNKNOWN');
 assert.equal(observed.recordVerified,true);assert.deepEqual(m.calls.operations,[]);assert.equal(m.calls.imports,0);assert.equal(observed.report.counters.compilerBuildAttempts,0);
});
test('selector replacement during operation imports launches no fixture or process',async()=>{
 const m=mock();m.options.loadOperations=()=>{m.state.parent.ino=99n;return m.operations;};const observed=await m.run();assert.equal(observed.completed,false);
 assert.deepEqual(m.calls.operations,[]);assert.equal(observed.report.counters.compilerBuildAttempts,0);
});
test('selector becoming unsafe after setup prevents the corresponding new compiler build',async()=>{
 const m=mock(),operation=m.operations.verifyCopies;m.operations.verifyCopies=(...args)=>{const value=operation(...args);m.state.parent.mode=0o40777n;return value;};
 const observed=await m.run();unknown(observed,m);assert.equal(observed.report.counters.prerequisiteBuildAttempts,3);assert.equal(observed.report.counters.launcherBuildAttempts,0);
 assert(!m.calls.operations.includes('buildLauncher'));
});
for(const [name,expectedBuilds]of [['preparePair',0],['createHost',0],['prepareHostFixture',0],['buildAssets',0],['verifyAssets',3],['prepareSource',3],['provisionCopies',3],['verifyCopies',3],['buildLauncher',3],['verifyLauncher',4]]){
 test('failed '+name+' prerequisite preserves partial counters and launches no subsequent phase',async()=>{
 const m=mock(),operation=m.operations[name];m.operations[name]=(...args)=>{const value=operation(...args);
 if(name==='prepareSource')throw Error('PRIVATE SOURCE ERROR');
 if(name==='buildAssets')return{...value,outcome:'UNKNOWN',dispatchAttemptCount:0,dispatchResultCount:0,observedProcessCount:0,builds:[]};
 if(name==='buildLauncher')return{...value,outcome:'UNKNOWN',dispatchAttemptCount:0,dispatchResultCount:0,observedProcessCount:0,builds:[],sourceWriteAttempts:0,sourceWriteCompleted:false};
 return{...value,outcome:'UNKNOWN'};};
 const observed=await m.run();assert.equal(observed.completed,false);assert.equal(observed.outcome,'UNKNOWN');assert.equal(observed.report.counters.compilerBuildAttempts,expectedBuilds);
 assert.equal(m.calls.operations.at(-1),name);if(name==='verifyLauncher')assert.equal(observed.report.compilerBuildOutcome,'EXIT_ZERO');assert(!m.state.body.includes('PRIVATE SOURCE ERROR'));noAuthority(observed.report);
 });
}
test('honest setup failure retains two attempts/results/PID observations and true nonzero exit',async()=>{
 const m=mock();m.assets.outcome='UNKNOWN';m.assets.dispatchAttemptCount=2;m.assets.dispatchResultCount=2;m.assets.observedProcessCount=2;
 m.assets.builds=m.assets.builds.slice(0,2);Object.assign(m.assets.builds[1],{status:1,completed:false});const observed=await m.run();
 assert.equal(observed.completed,false);assert.equal(observed.outcome,'FAIL');assert.equal(observed.report.compilerBuildOutcome,'EXIT_NONZERO');
 assert.equal(observed.report.counters.prerequisiteBuildAttempts,2);assert.equal(observed.report.counters.launcherBuildAttempts,0);assert.equal(observed.report.prerequisiteBuild.builds[1].status,1);
});
test('new thrown dispatch record retains one attempt with zero fabricated returned process observations',async()=>{
 const m=mock();Object.assign(m.launcher,{outcome:'UNKNOWN',dispatchAttemptCount:1,dispatchResultCount:0,observedProcessCount:0,builds:[]});
 const observed=await m.run();assert.equal(observed.completed,false);assert.equal(observed.report.counters.compilerBuildAttempts,4);
 assert.equal(observed.report.counters.launcherBuildResults,0);assert.equal(observed.report.counters.launcherPidObservedCount,0);
});

function during(m,phase,value){
 if(phase==='publication'){const emit=m.options.diagnostic;m.options.diagnostic=text=>{emit(text);m.state.time=value;};return;}
 if(phase==='read'){const read=m.filesystem.readSync;m.filesystem.readSync=(...args)=>{const n=read(...args);m.state.time=value;return n;};return;}
 if(phase==='write'){const write=m.filesystem.writeFileSync;m.filesystem.writeFileSync=(...args)=>{write(...args);m.state.time=value;};return;}
 if(phase==='close'){const close=m.filesystem.closeSync;m.filesystem.closeSync=(...args)=>{close(...args);m.state.time=value;};return;}
 if(phase==='final parent'){const stat=m.filesystem.lstatSync;m.filesystem.lstatSync=(file,...args)=>{const valueStat=stat(file,...args);if(file===local&&m.state.read)m.state.time=value;return valueStat;};return;}
 const op=m.operations[phase];m.operations[phase]=(...args)=>{const result=op(...args);m.state.time=value;return result;};
}
for(const phase of ['preparePair','buildAssets','prepareSource','verifyCopies','buildLauncher','verifyLauncher','write','read','close','final parent','publication']){
 for(const elapsed of [30000,30001])test('total 30s budget refuses '+elapsed+'ms during '+phase+' and retains actual partial build counters',async()=>{
  const m=mock();during(m,phase,elapsed);const observed=await m.run();unknown(observed,m);assert.equal(observed.observationStatus,'BUDGET_EXCEEDED');
  assert(observed.totalElapsedMs>=elapsed);const base=phase==='preparePair'?0:3,newBuild=['preparePair','buildAssets','prepareSource','verifyCopies'].includes(phase)?0:1;
  assert.equal(observed.report.counters.prerequisiteBuildAttempts,base);assert.equal(observed.report.counters.launcherBuildAttempts,newBuild);
  if(newBuild===1)assert.equal(observed.report.compilerBuildOutcome,'EXIT_ZERO');
  for(const summary of m.calls.diagnostics){assert.equal(summary.observationCompleted,false);assert.equal(summary.recordVerified,false);}
  if(m.state.body){const saved=JSON.parse(m.state.body);assert.equal(saved.elapsedMsScope,'PRE_PERSISTENCE_SNAPSHOT');assert.equal(saved.recordVerified,false);assert.equal(saved.observationCompleted,false);assert.equal(m.calls.writes.length,1);}
 });
}
for(const [name,value]of [['NaN',NaN],['infinite',Infinity],['non-number','0'],['backward',-1]]){
 for(const phase of ['buildAssets','verifyCopies','buildLauncher','write','read','close','final parent','publication'])test('invalid '+name+' clock at '+phase+' never certifies overall success',async()=>{
  const m=mock();during(m,phase,value);const observed=await m.run();unknown(observed,m);assert.equal(observed.observationStatus,'CLOCK_UNAVAILABLE');assert.equal(observed.totalElapsedMs,null);
  for(const summary of m.calls.diagnostics){assert.equal(summary.observationCompleted,false);assert.equal(summary.recordVerified,false);}
 });
}
test('invalid initial clock causes no local write/import/fixture/build',async()=>{
 const m=mock();m.state.time=NaN;const observed=await m.run();unknown(observed,m);assert.equal(observed.totalElapsedMs,null);assert.equal(m.calls.platform,0);
 assert.equal(m.calls.imports,0);assert.equal(m.calls.operations.length,0);assert.equal(m.calls.writes.length,0);assert.equal(observed.report.counters.compilerBuildAttempts,0);
});
test('clock throw during publication retains four build attempts without a success or fabricated duration',async()=>{
 const m=mock(),emit=m.options.diagnostic;m.options.diagnostic=text=>{emit(text);m.state.clockThrows=true;};const observed=await m.run();unknown(observed,m);
 assert.equal(observed.totalElapsedMs,null);assert.equal(observed.report.counters.compilerBuildAttempts,4);assert.equal(m.calls.writes.length,1);
 assert(!m.state.body.includes('PRIVATE CLOCK ERROR'));
});
test('backward clock latches even when close restores a later finite sample',async()=>{
 const m=mock();during(m,'read',-1);const close=m.filesystem.closeSync;m.filesystem.closeSync=(...args)=>{close(...args);m.state.time=100;};
 const observed=await m.run();unknown(observed,m);assert.equal(observed.observationStatus,'CLOCK_UNAVAILABLE');assert.equal(observed.totalElapsedMs,null);
});
for(const [name,alter]of [
 ['truncated body',m=>{m.filesystem.readSync=()=>0;}],
 ['bad read count',m=>{m.filesystem.readSync=()=>-1;}],
 ['changed body',m=>{const read=m.filesystem.readSync;m.filesystem.readSync=(...args)=>{const n=read(...args);if(n)args[1][args[2]]^=1;return n;};}],
 ['extra byte',m=>{const read=m.filesystem.readSync;m.filesystem.readSync=(...args)=>{const n=read(...args);if(n===0){args[1][args[2]]=1;return 1;}return n;};}],
 ['FD metadata changed',m=>{const stat=m.filesystem.fstatSync;m.filesystem.fstatSync=(...args)=>({...stat(...args),...(m.state.read?{ctimeNs:99n}:{})});}],
 ['named file changed',m=>{const stat=m.filesystem.lstatSync;m.filesystem.lstatSync=(file,...args)=>({...stat(file,...args),...(file!==local&&m.state.read?{ino:99n}:{})});}],
 ['parent changed',m=>{const stat=m.filesystem.lstatSync;m.filesystem.lstatSync=(file,...args)=>({...stat(file,...args),...(file===local&&m.state.read?{ino:99n}:{})});}],
 ['close failed',m=>{m.filesystem.closeSync=()=>{throw Error('PRIVATE CLOSE ERROR');};}],
 ['write failed',m=>{m.filesystem.writeFileSync=()=>{throw Error('PRIVATE WRITE ERROR');};}],
 ['publication failed',m=>{const emit=m.options.diagnostic;m.options.diagnostic=text=>{const parsed=JSON.parse(text);if(parsed.scope!=='BASE_COLLECTOR_LAUNCHER_RECORD_UNKNOWN')throw Error('PRIVATE PUBLISH ERROR');emit(text);};}]
])test('saved-record '+name+' keeps historical four builds but withholds verified observation',async()=>{
 const m=mock();alter(m);const observed=await m.run();unknown(observed,m);assert.equal(observed.report.counters.compilerBuildAttempts,4);
 assert.equal(observed.report.buildSequenceOutcome,'BUILT_NOT_EXECUTED');assert.equal(observed.report.compilerBuildOutcome,'EXIT_ZERO');
 if(m.state.body)assert(!m.state.body.includes('PRIVATE'));
});
test('short bounded FD reads succeed without changing saved bytes or rewriting a record',async()=>{
 const m=mock(),read=m.filesystem.readSync;m.filesystem.readSync=(fd,body,offset,length,position)=>read(fd,body,offset,Math.min(length,256),position);
 const observed=await m.run();assert.equal(observed.completed,true);assert.equal(observed.recordVerified,true);assert.equal(m.calls.writes.length,1);
});
test('publication changing the record parent fails the final named/parent barrier',async()=>{
 const m=mock(),emit=m.options.diagnostic;m.options.diagnostic=text=>{emit(text);m.state.parent.ino=99n;};
 const observed=await m.run();unknown(observed,m);assert.equal(observed.report.counters.compilerBuildAttempts,4);assert.equal(m.calls.writes.length,1);
});
test('in-budget publication can complete with explicit total and phase timing scopes',async()=>{
 const m=mock();during(m,'publication',29999);const observed=await m.run();assert.equal(observed.completed,true);assert.equal(observed.recordVerified,true);
 assert.equal(observed.totalElapsedMs,29999);assert.equal(observed.totalElapsedMsScope,'THROUGH_PUBLICATION_AND_FINAL_RECORD_BARRIER');
 assert.equal(observed.phaseCostsScope,'THROUGH_PUBLICATION_AND_FINAL_RECORD_BARRIER');assert(Number.isFinite(observed.phaseCostsMs.publication));
 assert.equal(JSON.parse(m.state.body).phaseCostsScope,'THROUGH_PRE_RECORD_VALIDATION');
});

test('missing no-follow support launches no fixture/build and creates no record',async()=>{
 const m=mock();delete m.filesystem.constants.O_NOFOLLOW;const observed=await m.run();unknown(observed,m);
 assert.equal(m.calls.operations.length,0);assert.equal(m.calls.writes.length,0);assert.equal(observed.report.counters.compilerBuildAttempts,0);
});
test('finite late compiler build duration remains historical while overall observation is unknown',async()=>{
 const m=mock();during(m,'buildAssets',30001);const observed=await m.run();unknown(observed,m);
 assert(Number.isFinite(observed.phaseCostsMs.prerequisiteThreeBuilds));assert(observed.phaseCostsMs.prerequisiteThreeBuilds>=29990);
 assert.equal(observed.report.counters.prerequisiteBuildAttempts,3);assert.equal(observed.report.counters.launcherBuildAttempts,0);
});
