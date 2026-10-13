// Authored source/virtual-FD/entry mocks only, no fixture/native/helper process.
import {EventEmitter} from 'node:events';import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {prepareSealedTypeScriptBaseCollectorSource as actual,verifySealedTypeScriptBaseCollectorSource as actualCurrent,sealedTypeScriptBaseCollectorSourceMatchesAssets as actualMatch} from './acceptance/sealed-typescript-base-collector-source.mjs';
const url=new URL('./acceptance/sealed-typescript-base-collector-source.mjs',import.meta.url),moduleSource=fs.readFileSync(url,'utf8');
const files=['./sealed-typescript-base-child-collection.mjs','./sealed-typescript-base-exchange-result.mjs','../../src/portable-envelope.mjs','./sealed-typescript-base-collector-launcher.c'].map(rel=>fileURLToPath(new URL(rel,url)));
const bodies=files.map(file=>Buffer.from(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'))),sha=body=>createHash('sha256').update(body).digest('hex');
const build=Object.freeze({report:Object.freeze({base:'/private/tmp/redue-ci-recipient-33333333',binary:Object.freeze({file:'/private/tmp/redue-ci-recipient-33333333/prefix/native-probes/sealed-typescript-base-exchange-sentinel',sha256:'b'.repeat(64)})})});
const good=()=>({schema:1,scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:'/private/tmp/redue-ci-recipient-11111111',baseB:'/private/tmp/redue-ci-recipient-22222222',hostBase:'/private/tmp/redue-ci-recipient-33333333',commands:[],sealed:false,reuseEligible:false});
function mock(verify=good,fault=null){let checks=0,reads=0,closes=0,fd=100,ino=1;const nodes=new Map(),handles=new Map();
 for(let at=0;at<files.length;at++){nodes.set(files[at],{type:'f',body:bodies[at],dev:1n,ino:BigInt(ino++),mode:0o100644n,uid:501n,gid:20n,nlink:1n,size:BigInt(bodies[at].length),mtimeNs:1n,ctimeNs:1n});for(let p=path.dirname(files[at]);;p=path.dirname(p)){if(!nodes.has(p))nodes.set(p,{type:'d',dev:1n,ino:BigInt(ino++),mode:0o40755n,uid:501n,gid:20n,nlink:1n,size:0n,mtimeNs:1n,ctimeNs:1n});if(p===path.dirname(p))break;}}
 if(fault==='symlink')nodes.get(files[0]).type='l';if(fault==='multilink')nodes.get(files[0]).nlink=2n;if(fault==='oversize')nodes.get(files[0]).size=1048577n;
 const metadata=file=>{const n=nodes.get(file);assert(n);return{...n,isDirectory:()=>n.type==='d',isFile:()=>n.type==='f',isSymbolicLink:()=>n.type==='l'};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:131072,O_NONBLOCK:4},realpathSync:file=>file,lstatSync:metadata,openSync(file){assert(files.includes(file));const value=fd++;handles.set(value,file);return value;},fstatSync:fd=>metadata(handles.get(fd)),readSync(fd,bytes,offset,length,position){reads++;const file=handles.get(fd),body=nodes.get(file).body;if(fault==='late-replace'&&file===files[2])nodes.get(files[0]).ino+=1n;const count=body.copy(bytes,offset,position,Math.min(position+length,body.length));if(fault==='bytes'&&file===files[0]&&count)bytes[offset]^=1;return count;},closeSync(fd){handles.delete(fd);closes++;if(fault==='close')throw Error('PRIVATE_SOURCE_OR_PATH');}};
 const api=Function('fs','path','fileURLToPath','createHash','verifySealedTypeScriptBaseExchangeAssets','process',moduleSource.replace(/^import .*;$/gm,'').replaceAll('import.meta.url',JSON.stringify(url.href)).replaceAll('export function ','function ')+'\nreturn {prepare:prepareSealedTypeScriptBaseCollectorSource,verify:verifySealedTypeScriptBaseCollectorSource,matches:sealedTypeScriptBaseCollectorSourceMatchesAssets};')(io,path,fileURLToPath,createHash,()=>verify(++checks),{getuid:()=>501});
 return{prepare:api.prepare,verify:api.verify,matches:api.matches,nodes,counters:()=>({checks,reads,closes,handles:handles.size})};}
const failure=(fn,code)=>assert.throws(fn,error=>error.code===code&&error.message===code);
test('unminted/serialized/accessor build reads no caller paths or source dependencies',()=>{let accessed=0;const value={};Object.defineProperty(value,'report',{get(){accessed++;throw Error('PRIVATE');}});failure(()=>actual(value),'BASE_COLLECTOR_ASSETS_UNAVAILABLE');assert.equal(accessed,0);const m=mock(()=>({outcome:'UNKNOWN'}));failure(()=>m.prepare(build),'BASE_COLLECTOR_ASSETS_UNAVAILABLE');assert.equal(m.counters().reads,0);failure(()=>actual(JSON.parse(JSON.stringify(build))),'BASE_COLLECTOR_ASSETS_UNAVAILABLE');});
test('exact one private build is the entire constructor interface',()=>{failure(()=>actual(),'BASE_COLLECTOR_SOURCE_OPTIONS');failure(()=>actual(build,{}),'BASE_COLLECTOR_SOURCE_OPTIONS');failure(()=>actual({build,command:'OTHER',env:{}}),'BASE_COLLECTOR_ASSETS_UNAVAILABLE');});
test('positive mock returns exact pinned dependency bytes preserving relative imports and disabled entry',()=>{const m=mock(),value=m.prepare(build);assert.equal(value.proposedSources.length,4);assert.equal(value.bindings.helperSha256,'b'.repeat(64));assert.deepEqual(value.commands,[]);assert.equal(value.disabled,true);assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);assert.equal(value.inferencePermitted,false);assert.equal(m.counters().checks,2);assert.equal(m.counters().handles,0);for(const row of value.proposedSources){assert.equal(row.sha256,sha(row.source));assert.equal(row.sourceBytes,Buffer.byteLength(row.source));assert(Object.isFrozen(row));assert(row.file.startsWith(value.bindings.hostBase+'/prefix/'));}for(let at=0;at<3;at++)assert.equal(value.proposedSources[at].source,bodies[at].toString());assert(value.proposedSources[3].source.includes("from '../test/acceptance/sealed-typescript-base-child-collection.mjs'"));assert(value.proposedSources[1].source.includes("from '../../src/portable-envelope.mjs'"));});
for(const [fault,code] of [['symlink','BASE_COLLECTOR_SOURCE_CHANGED'],['multilink','BASE_COLLECTOR_SOURCE_CHANGED'],['oversize','BASE_COLLECTOR_SOURCE_CHANGED'],['bytes','BASE_COLLECTOR_DEPENDENCY_MISMATCH'],['close','BASE_COLLECTOR_SOURCE_UNAVAILABLE'],['late-replace','BASE_COLLECTOR_SOURCE_CHANGED']])test('dependency '+fault+' refuses without raw error/publication',()=>{const m=mock(good,fault);failure(()=>m.prepare(build),code);assert.equal(m.counters().handles,0);});
test('private assets must remain current after all dependency reads',()=>{const m=mock(count=>count===1?good():{outcome:'UNKNOWN'});failure(()=>m.prepare(build),'BASE_COLLECTOR_ASSETS_UNAVAILABLE');assert(m.counters().reads>0);});
test('private binding names and exact report helper cannot choose shell/path/code',()=>{for(const change of [value=>value.hostBase='/elsewhere',value=>value.baseB=value.baseA,value=>value.hostBase+='\nPRIVATE']){const m=mock(()=>{const value=good();change(value);return value;});failure(()=>m.prepare(build),'BASE_COLLECTOR_BINDINGS');assert.equal(m.counters().reads,0);}const m=mock();failure(()=>m.prepare({report:{...build.report,binary:{...build.report.binary,file:'/OTHER'}}}),'BASE_COLLECTOR_BINDINGS');assert.equal(m.counters().reads,0);});
async function entryMock(change=null,result={outcome:'UNKNOWN',checks:null,reason_code:'CHILD_COLLECTION_INCOMPLETE'}){const proposed=mock().prepare(build),entry=proposed.proposedSources[3],env={NATIVE_PROXY_CONTEXT:'INHERITED'},calls=[],output=[];const process={platform:'darwin',arch:'arm64',version:'v22.13.0',execPath:proposed.bindings.node,argv:[proposed.bindings.node,proposed.bindings.entry],execArgv:[],env,stdout:Object.assign(new EventEmitter(),{write(value,callback){output.push(value);callback?.();return true;}}),exitCode:null};if(change)change(process);const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction('spawn','collectSealedTypeScriptBaseChild','classifySealedTypeScriptBaseChild','process',entry.source.replace(/^import .*;$/gm,''))((...args)=>{calls.push(args);return{};},async create=>{create();return{bytes:Buffer.from('NONSECRET_PRIVATE_RAW'),stderr:'NONSECRET_PRIVATE_STDERR'};},collection=>collection===null?{outcome:'UNKNOWN',reason_code:'CHILD_COLLECTION_INCOMPLETE'}:result,process);
 return{calls,output,process,proposed,env};}
test('fixed entry inherits actual native-filtered environment and dispatches only exact helper[]',async()=>{const value=await entryMock();assert.equal(value.calls.length,1);const [helper,args,options]=value.calls[0];assert.equal(helper,value.proposed.bindings.helper);assert.deepEqual(args,[]);assert(!Object.hasOwn(options,'env'));assert.equal(value.process.env,value.env);assert.equal(options.cwd,value.proposed.bindings.baseA+'/Checkout 空间/.sealed-native-canaries');assert.deepEqual(options.stdio,['ignore','pipe','pipe']);assert.equal(value.process.exitCode,74);assert(!value.output.join('').includes('PRIVATE_RAW'));assert(!value.output.join('').includes('PRIVATE_STDERR'));assert.equal(value.output.length,1);assert.equal(JSON.parse(value.output[0]).outcome,'UNKNOWN');});
test('entry runtime/argc/exact-path/preload failures dispatch zero helpers and publish only UNKNOWN',async()=>{for(const change of [p=>p.platform='win32',p=>p.version='v22.0.0',p=>p.execPath='/OTHER',p=>p.argv.push('OTHER'),p=>p.execArgv.push('--import=NONSECRET'),p=>p.argv[1]='/OTHER',...['NODE_OPTIONS','node_path','DyLd_INSERT_LIBRARIES','LD_PRELOAD','OPENSSL_CONF'].map(key=>p=>{p.env[key]='NONSECRET';})]){const value=await entryMock(change);assert.equal(value.calls.length,0);assert.equal(value.process.exitCode,74);assert.equal(JSON.parse(value.output[0]).outcome,'UNKNOWN');assert(!value.output.join('').includes('NONSECRET'));}});
test('sanitized known FAIL is emitted without raw bytes and remains FAIL exit1',async()=>{const value=await entryMock(null,{outcome:'FAIL',reason_code:'HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS'});assert.equal(value.process.exitCode,1);assert.equal(JSON.parse(value.output[0]).outcome,'FAIL');assert(!value.output.join('').includes('PRIVATE'));});
test('constructor performs no source writes, source execution, subprocess or host mutation',()=>{assert.doesNotMatch(moduleSource,/fs\.(?:writeFile|mkdir|chmod|rm|rename)\w*\(|\beval\(|\bFunction\(/);assert(!moduleSource.includes('env:{}'));});
test('sanitized publication uncertainty never overwrites an already observed FAIL with UNKNOWN',async()=>{const value=await entryMock(p=>{p.stdout.write=()=>{throw Error('NONSECRET_PRIVATE_WRITE_ERROR');};},{outcome:'FAIL',reason_code:'HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS'});assert.equal(value.process.exitCode,1);assert.equal(value.output.length,0);assert.equal(value.calls.length,1);});

test('private source currentness is not a protected copy/native authority and retains private bindings',()=>{const m=mock(),proposal=m.prepare(build),value=m.verify(proposal);assert.equal(value.outcome,'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED');assert.equal(value.baseA,good().baseA);assert.equal(value.baseB,good().baseB);assert.equal(value.hostBase,good().hostBase);assert.deepEqual(value.bindings,proposal.bindings);assert.deepEqual(value.commands,[]);assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);assert(Object.isFrozen(value.bindings));});
test('serialized/forged proposal cannot adopt private source identity',()=>{const m=mock(),proposal=m.prepare(build);for(const value of [{outcome:'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED'},JSON.parse(JSON.stringify(proposal))]){assert.equal(m.verify(value).outcome,'UNKNOWN');assert.equal(actualCurrent(value).outcome,'UNKNOWN');}assert.equal(m.counters().checks,2);});
for(const change of ['content','identity','parent'])test('dependency '+change+' currency failure latches despite restored data',()=>{const m=mock(),proposal=m.prepare(build),file=change==='parent'?path.dirname(files[0]):files[0],row=m.nodes.get(file),body=row.body,ino=row.ino;if(change==='content')row.body=Buffer.from(body.toString().replace('Fixed','Other'));else row.ino+=1n;assert.equal(m.verify(proposal).outcome,'UNKNOWN');row.body=body;row.ino=ino;const before=m.counters();assert.equal(m.verify(proposal).outcome,'UNKNOWN');assert.deepEqual(m.counters(),before);});
test('lost original assets after source mint prevents currency and cannot revive',()=>{let present=true;const m=mock(()=>present?good():{outcome:'UNKNOWN'}),proposal=m.prepare(build);present=false;assert.equal(m.verify(proposal).outcome,'UNKNOWN');present=true;assert.equal(m.verify(proposal).outcome,'UNKNOWN');});
test('final original asset revalidation cannot hide earlier dependency replacement',()=>{let m;m=mock(count=>{if(count===4)m.nodes.get(files[0]).ino+=1n;return good();});const proposal=m.prepare(build);assert.equal(m.verify(proposal).outcome,'UNKNOWN');assert.equal(m.verify(proposal).outcome,'UNKNOWN');});
test('assets lost after final dependency hash prevent source currency',()=>{const m=mock(count=>count===4?{outcome:'UNKNOWN'}:good()),proposal=m.prepare(build);assert.equal(m.verify(proposal).outcome,'UNKNOWN');assert.equal(m.verify(proposal).outcome,'UNKNOWN');});

test('deferred stdout error and write callback are nonthrowing and preserve the classified exit',async()=>{for(const kind of ['event','callback','both'])for(const outcome of ['UNKNOWN','FAIL']){const queued=[],error=Error('NONSECRET_PRIVATE_DEFERRED_ERROR');const value=await entryMock(p=>{p.stdout.write=(text,callback)=>{queued.push(()=>{if(kind!=='callback')p.stdout.emit('error',error);if(kind!=='event'){assert.equal(typeof callback,'function');callback(error);}});return false;};},{outcome,reason_code:'HELPER_RESULT_OBSERVED_WITH_MISSING_ASSERTIONS'});assert.equal(queued.length,1);assert.doesNotThrow(()=>queued[0]());assert.equal(value.process.exitCode,outcome==='FAIL'?1:74);assert.equal(value.output.length,0);assert.equal(value.calls.length,1);}});


test('pre-Node launcher is fixed disabled source data and preserves the four-file copy interface',()=>{
 const m=mock(),proposal=m.prepare(build),launch=proposal.proposedLauncher;
 assert.equal(proposal.proposedSources.length,4);assert.equal(launch.disabled,true);
 assert.equal(launch.file,proposal.bindings.hostBase+'/prefix/native-probes/base-exchange-collect-launch.c');
 assert.equal(launch.output,proposal.bindings.launcher);assert.equal(launch.file,proposal.bindings.launcherSource);
 assert.equal(launch.sha256,sha(launch.source));assert.equal(launch.sourceBytes,Buffer.byteLength(launch.source));
 assert.equal(proposal.bindings.launcherSourceSha256,launch.sha256);
 assert.equal(proposal.bindings.collectorSha256,proposal.proposedSources[3].sha256);
 assert.equal(launch.templateSha256,sha(bodies[3]));assert(Object.isFrozen(launch));
 assert(launch.source.includes('static const char node[] = "'+proposal.bindings.node+'";'));
 assert(launch.source.includes('static const char collector[] = "'+proposal.bindings.entry+'";'));
 assert(launch.source.includes('static const char launcher[] = "'+proposal.bindings.launcher+'";'));
 assert(!launch.source.includes('__REVIEWED_'));assert.deepEqual(proposal.commands,[]);
 for(const blocker of ['PRE_NODE_LAUNCHER_NOT_BUILT_OR_PROVISIONED','ENCLOSING_PARENT_MUST_PREVENT_LAUNCHER_PRE_MAIN_LOADER_INJECTION',
 'CURRENT_PINNED_NATIVE_EFFECTIVE_PROFILE_AUTH_AND_CAPACITY_REQUIRED','CURRENT_PROTECTED_SOURCE_AND_RUNTIME_COPIES_REQUIRED',
 'INHERITED_HANDLES_NOT_VERIFIED','TRUSTED_PARENT_SUPERVISION_REQUIRED','OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED'])assert(proposal.blockers.includes(blocker));
 assert.equal(m.verify(proposal).outcome,'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED');
});
for(const change of ['content','identity','parent'])test('launcher template '+change+' invalidates the existing private source mint and never revives',()=>{
 const m=mock(),proposal=m.prepare(build),file=change==='parent'?path.dirname(files[3]):files[3],row=m.nodes.get(file),saved={...row,body:row.body};
 if(change==='content')row.body=Buffer.from(row.body.toString().replace('DISABLED','ENABLED!'));else row.ino+=1n;
 assert.equal(m.verify(proposal).outcome,'UNKNOWN');Object.assign(row,saved);const before=m.counters();
 assert.equal(m.verify(proposal).outcome,'UNKNOWN');assert.deepEqual(m.counters(),before);
});
test('serialized launcher bindings and source cannot mint source currentness or a build/copy command',()=>{
 const m=mock(),proposal=m.prepare(build),forged=JSON.parse(JSON.stringify(proposal));
 assert.equal(m.verify(forged).outcome,'UNKNOWN');assert.equal(actualCurrent(forged).outcome,'UNKNOWN');
 assert.deepEqual(proposal.commands,[]);assert.equal(proposal.helperExecutions,0);assert.equal(proposal.nativeLaunches,0);
 assert.equal(proposal.models,0);assert.equal(proposal.inferencePermitted,false);assert.equal(proposal.sealed,false);assert.equal(proposal.reuseEligible,false);
});
test('launcher template read after JS dependencies cannot conceal an earlier changed dependency',()=>{
 const m=mock(),read=m.nodes.get(files[3]);
 Object.defineProperty(read,'body',{get(){m.nodes.get(files[0]).ino+=1n;return bodies[3];}});
 failure(()=>m.prepare(build),'BASE_COLLECTOR_SOURCE_CHANGED');assert.equal(m.counters().handles,0);
});

test('generated collector defense in depth rejects empty preload keys and ASCII case aliases with zero mocked helpers',async()=>{
 for(const key of ['NODE_OPTIONS','node_options','NoDe_PaTh','NODE_REPL_EXTERNAL_MODULE','nOdE_rEpL_eXtErNaL_mOdUlE',
 'DYLD_','dyld_insert_libraries','LD_','lD_pReLoAd','OPENSSL_','oPeNsSl_cOnF']){
  const value=await entryMock(p=>{p.env[key]='';});assert.equal(value.calls.length,0);
  assert.equal(value.process.exitCode,74);assert.equal(JSON.parse(value.output[0]).outcome,'UNKNOWN');
 }
});
test('preload-like value text and longer exact-key names preserve the inherited mock environment',async()=>{
 const value=await entryMock(p=>{p.env.NODE_OPTIONS_EXTRA='NODE_OPTIONS=NONSECRET';p.env.SAFE='LD_PRELOAD=NONSECRET';});
 assert.equal(value.calls.length,1);assert.equal(value.process.env,value.env);
 assert(!value.output.join('').includes('NONSECRET'));assert.equal(JSON.parse(value.output[0]).outcome,'UNKNOWN');
});

test('source/asset bridge exposes only exact private identity, never public labels or a mint getter',()=>{
 const m=mock(),proposal=m.prepare(build),sameLabels=JSON.parse(JSON.stringify(build));
 assert.equal(m.matches(proposal,build),true);assert.equal(m.matches(proposal,sameLabels),false);
 assert.equal(m.matches(JSON.parse(JSON.stringify(proposal)),build),false);assert.equal(actualMatch(proposal,build),false);
 assert.equal(m.matches(proposal,build,{}),false);assert.equal(m.matches(null,build),false);
 m.nodes.get(files[0]).ino+=1n;assert.equal(m.verify(proposal).outcome,'UNKNOWN');assert.equal(m.matches(proposal,build),false);
});
