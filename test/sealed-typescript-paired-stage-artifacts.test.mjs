// Whole fixed builder/read-only verifier with in-memory filesystem/private mints.
// No real fixture, compiler, checker, mapper, native agent or model is executed.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {buildSealedTypeScriptPairedStageArtifacts as actual,verifySealedTypeScriptPairedStageArtifacts as actualCurrent,sealedTypeScriptBaseExchangeAssetsMatchPair as actualPairMatch,sealedTypeScriptPairedStageArtifactsMatchDerivation as actualMatches} from './acceptance/sealed-typescript-base-exchange-assets.mjs';
import {sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary} from './acceptance/sealed-typescript-native-assets-build.mjs';
const moduleSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-base-exchange-assets.mjs',import.meta.url),'utf8'),sha=value=>createHash('sha256').update(value).digest('hex');
const pins=['d206de2e8fa469768aecec6e7bf276a935a0071c470aa5b1ad053de6dd649671','14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070','06e5da5dca906063762410f40bea9b7f99662cb6a62934ee50749a7b41162e48'];
function mock(fault=null){
 const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',code=h+'/prefix/native-probes';
 const pair={},hostFixture={},assetsBuild={},bindings={baseA:a,baseB:b,node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',checker:code+'/sealed-typescript-paired-stage-node.mjs',stage:a+'/sealed-inputs/redue-materialization-Canary'};
 const names=['sealed-typescript-paired-stage-node.mjs','sealed-typescript-paired-stage-map.c','sealed-typescript-paired-stage-exchange.c'];
 const sources=['checker','mapper','exchange'].map((kind,at)=>{const body='// FIXED_'+kind+'_A_TARGET\n';return{kind,file:code+'/'+names[at],templateSha256:pins[at],source:body,sha256:sha(body),sourceBytes:Buffer.byteLength(body)};});
 const proposal={scope:'DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY',disabled:true,node:bindings.node,bindings,sources};
 const nodes=new Map(),handles=new Map(),mint=new WeakMap([[assetsBuild,{pair,hostFixture}]]);let inode=1,fd=100;
 const state={valid:{assets:true,source:true},calls:[],writes:[],reads:[],fsTouches:0,assetChecks:0,sourceChecks:0,toolCalls:0,scopeCalls:0,scopeCloses:0,onScopeClose:null,binaryReads:new Map(),late:null};
 const put=(name,type='d',body=Buffer.alloc(0),mode=type==='d'?0o40700n:0o100600n)=>{nodes.set(name,{type,body:Buffer.from(body),dev:1n,ino:BigInt(inode++),mode,uid:501n,gid:20n,nlink:1n,size:BigInt(body.length),mtimeNs:1n,ctimeNs:1n});};
 for(const name of ['/','/private','/private/tmp',a,b,h,h+'/prefix',code])put(name);
 if(fault==='existing-source')put(sources[1].file,'f',Buffer.from('PRESERVED'));
 if(fault==='existing-output')put(sources[1].file.slice(0,-2),'f',Buffer.from('PRESERVED'));
 if(fault==='wrong-source-template')sources[1].templateSha256='a'.repeat(64);
 if(fault==='wrong-source-hash')sources[1].source+='ALTERED';
 if(fault==='wrong-source-path')sources[1].file=a+'/prefix/native-probes/WRONG.c';
 if(fault==='wrong-source-order')sources.reverse();
 const stats=row=>({...row,isDirectory:()=>row.type==='d',isFile:()=>row.type==='f',isSymbolicLink:()=>row.type==='l'});
 const byName=name=>{state.fsTouches++;const row=nodes.get(name);if(!row)throw Object.assign(Error('MISSING'),{code:'ENOENT'});return stats(row);};
 const io={constants:{O_RDONLY:0,O_WRONLY:1,O_CREAT:512,O_EXCL:2048,O_NOFOLLOW:131072,O_NONBLOCK:4},realpathSync:name=>{state.fsTouches++;return name;},lstatSync:byName,
  openSync(name,flags,mode){state.fsTouches++;const writing=(flags&1)!==0;assert.equal(flags,writing?133637:131076);if(writing){assert.equal(mode,0o600);assert(name.startsWith(code+'/sealed-typescript-paired-stage-'));if(fault==='creation-race')put(name,'f',Buffer.from('PRESERVED_RACE'));if(nodes.has(name))throw Object.assign(Error('EXISTS'),{code:'EEXIST'});put(name,'f');state.writes.push(name);
   if(fault==='source-owner')nodes.get(name).uid=502n;if(fault==='source-mode')nodes.get(name).mode=0o100644n;if(fault==='source-link')nodes.get(name).nlink=2n;if(fault==='source-symlink')nodes.get(name).type='l';}
   const id=fd++;handles.set(id,{name,row:nodes.get(name),writing});return id;},
  fstatSync:id=>stats(handles.get(id).row),
  writeSync(id,buffer,offset,length,position){const item=handles.get(id);assert(item.writing);if(fault==='write-throws')throw Error('PRIVATE_WRITE_DETAIL');if(fault==='write-zero')return 0;
   const n=fault==='partial-write'?Math.min(3,length):length,next=Buffer.alloc(Math.max(item.row.body.length,position+n));item.row.body.copy(next);buffer.copy(next,position,offset,offset+n);Object.assign(item.row,{body:next,size:BigInt(next.length),mtimeNs:item.row.mtimeNs+1n,ctimeNs:item.row.ctimeNs+1n});return n;},
  readSync(id,buffer,offset,length,position){const item=handles.get(id),name=item.name;state.reads.push(name);
   if(!name.endsWith('.mjs')&&!name.endsWith('.c')){const count=(state.binaryReads.get(name)||0)+1;state.binaryReads.set(name,count);
    if(state.late==='old-assets-final'&&name===code+'/'+names[2].slice(0,-2)&&count===3)state.valid.assets=false;
    if(state.late==='earlier-source-final'&&name===code+'/'+names[2].slice(0,-2)&&count===3)nodes.get(code+'/'+names[0]).ino++;
    if(state.late==='earlier-binary-final'&&name===code+'/'+names[2].slice(0,-2)&&count===3)nodes.get(code+'/'+names[1].slice(0,-2)).ino++;
   }
   if(fault==='source-during-read'&&name===code+'/'+names[1])item.row.ctimeNs++;
   const n=item.row.body.copy(buffer,offset,position,Math.min(position+length,item.row.body.length));if(fault==='read-corrupt'&&name.endsWith('.c')&&n)buffer[offset]^=1;return n;},
  closeSync(id){const item=handles.get(id);if(fault==='write-close-before'&&item.writing)throw Error('PRIVATE_CLOSE_DETAIL');handles.delete(id);if(fault==='write-close'&&item.writing||fault==='read-close'&&!item.writing)throw Error('PRIVATE_CLOSE_DETAIL');}};
 const assetObservation=()=>({scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:a,baseB:b,hostBase:h});
 const sourceObservation=()=>({scope:'DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY',outcome:'PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',baseA:a,baseB:b,hostBase:h,node:bindings.node,bindings});
 const originalFiles=['sealed-typescript-map-sentinel.c','sealed-typescript-exchange-sentinel.c'];
 const flags=['-std=c11','-O2','-Wall','-Wextra','-Werror','-fstack-protector-strong','-arch','arm64','-mmacosx-version-min=26.0','-isysroot','/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk'];
 const tool={scope:'FIXED_SYNTHETIC_NATIVE_ASSETS_PROPOSAL_ONLY',base:h,toolchain:{sdk:'/Library/Developer/CommandLineTools/SDKs/MacOSX27.0.sdk'},bindings:{node:bindings.node},proposedBuilds:originalFiles.map(name=>({disabled:true,executable:'/Library/Developer/CommandLineTools/usr/bin/clang',argv:[...flags,code+'/'+name,'-o',(code+'/'+name).slice(0,-2)]}))};
 if(fault==='wrong-compiler')tool.proposedBuilds[0].executable='/OTHER';if(fault==='extra-argv')tool.proposedBuilds[0].argv.unshift('UNREVIEWED');if(fault==='wrong-sdk')tool.proposedBuilds[0].argv[10]='/OTHER_SDK';if(fault==='wrong-node')tool.bindings.node='/OTHER_NODE';
 const spawn=(executable,argv,options)=>{state.calls.push({executable,argv,options});const at=state.calls.length-1;
  assert.equal(executable,'/Library/Developer/CommandLineTools/usr/bin/clang');assert.deepEqual(argv,[...flags,code+'/'+names[at+1],'-o',(code+'/'+names[at+1]).slice(0,-2)]);
  assert.deepEqual(options,{cwd:code,env:{TMPDIR:h},timeout:5000,maxBuffer:4096,killSignal:'SIGKILL',encoding:'utf8'});assert.equal(handles.size,0);
  if(fault==='first-spawn-throws'||fault==='second-spawn-throws'&&at===1)throw Error('PRIVATE_COMPILER_DETAIL');
  const bytes=Buffer.alloc(fault==='output-empty'?0:fault==='output-large'?2*1024*1024+1:24);if(bytes.length>=12){bytes.writeUInt32LE(fault==='wrong-header'?0:0xfeedfacf,0);bytes.writeUInt32LE(0x0100000c,4);}put(argv.at(-1),'f',bytes,0o100755n);
  if(fault==='output-link')nodes.get(argv.at(-1)).nlink=2n;if(fault==='output-parent')nodes.get(code).ino++;if(fault==='source-after-compiler')nodes.get(code+'/'+names[0]).ino++;
  if(fault==='assets-after-compiler')state.valid.assets=false;if(fault==='source-after-compiler-proof')state.valid.source=false;
  return{pid:fault==='no-pid'?undefined:42,status:fault==='compiler-fail'?1:fault==='compiler-signal'?null:0,signal:fault==='compiler-signal'?'SIGKILL':null,error:fault==='compiler-timeout'?Error('PRIVATE_TIMEOUT'):undefined,stdout:'',stderr:''};};
 const stripped=moduleSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replace('const mintedAssets=new WeakMap();','const mintedAssets=controlledMint;')+
  '\nverifySealedTypeScriptBaseExchangeAssets=controlledAssetVerify;observeSealedTypeScriptBaseExchangeAssets=controlledAssetObserve;return {build:buildSealedTypeScriptPairedStageArtifacts,verify:verifySealedTypeScriptPairedStageArtifacts,matches:sealedTypeScriptPairedStageArtifactsMatchDerivation,pairMatches:sealedTypeScriptBaseExchangeAssetsMatchPair};';
 const api=Function('fs','path','createHash','spawnSync','process','controlledMint','controlledAssetVerify','controlledAssetObserve','verifySealedTypeScriptPairedStageSource','sealedTypeScriptPairedStageSourceMatchesDerivation','prepareSealedTypeScriptNativeAssetsProposal','sealedAssetsBuildCompleted','sealedAssetsBuildProcessSummary',stripped)(io,path.posix,createHash,spawn,{getuid:()=>501},mint,
  value=>{state.assetChecks++;return value===assetsBuild&&state.valid.assets?assetObservation():{outcome:'UNKNOWN'};},
  (value,inspect)=>{assert.equal(value,assetsBuild);state.scopeCalls++;assert.equal(inspect(),undefined);state.scopeCloses++;if(state.onScopeClose)state.onScopeClose();},
  value=>{state.sourceChecks++;if(state.late==='new-file-after-final-source'&&(state.binaryReads.get(code+'/'+names[2].slice(0,-2))||0)>=3)nodes.get(code+'/'+names[0]).ino++;return value===proposal&&state.valid.source?sourceObservation():{outcome:'UNKNOWN'};},
  (value,p,assets)=>value===proposal&&p===pair&&assets===assetsBuild,
  options=>{state.toolCalls++;assert.equal(options.fixture,hostFixture);if(fault==='runtime-during-tool-proposal'||fault==='sdk-during-tool-proposal')state.valid.assets=false;return tool;},sealedAssetsBuildCompleted,sealedAssetsBuildProcessSummary);
 mint.get(assetsBuild).prepareProposal=options=>{state.toolCalls++;assert.equal(options.fixture,hostFixture);if(fault==='runtime-during-tool-proposal'||fault==='sdk-during-tool-proposal')state.valid.assets=false;return tool;};
 return{...api,options:{assetsBuild,source:proposal},pair,proposal,assetsBuild,mint,nodes,handles,state,a,b,h,code,names};
}
const falseAuthority=value=>{assert.deepEqual(value.commands,[]);for(const name of ['recordAdoptionAuthority','noInheritedWritableHandlesVerified','sealed','reuseEligible'])assert.equal(value[name],false);for(const name of ['compilerCheckExecutions','helperExecutions','nativeAgentLaunches','models'])assert.equal(value[name],0);assert.equal(value.nativeEnforcement,'NOT_ESTABLISHED');};
test('strict public options reject arbitrary paths/source/env/operations and accessors before invocation',()=>{
 for(const value of [null,{},Object.create(null),{assetsBuild:{},source:{},env:{}},{assetsBuild:{},source:{},argv:[]},{assetsBuild:{},source:{},[Symbol()]:true}])assert.throws(()=>actual(value),e=>e.code==='PAIRED_STAGE_ARTIFACTS_OPTIONS');let calls=0;assert.throws(()=>actual({assetsBuild:{},get source(){calls++;throw Error('PRIVATE');}}),e=>e.code==='PAIRED_STAGE_ARTIFACTS_OPTIONS');assert.equal(calls,0);
});
test('actual ESM cycle initializes paired source/assets and cannot adopt fabricated labels',async()=>{
 const paired=await import('./acceptance/sealed-typescript-paired-stage-source.mjs');assert.equal(paired.sealedTypeScriptPairedStageSourceMatchesDerivation({}, {}, {}),false);assert.equal(actualPairMatch({},{}),false);assert.equal(actualMatches({}, {}, {}),false);
 const value=actual({assetsBuild:{},source:{}});assert.equal(value.outcome,'UNKNOWN');assert.equal(value.sourceWriteAttempts,0);assert.equal(value.dispatchAttemptCount,0);falseAuthority(value);assert.equal(actualCurrent(JSON.parse(JSON.stringify(value))).outcome,'UNKNOWN');
});
test('exact private pair/source/asset identity is required before any path or public proposal read',()=>{
 for(const replace of [m=>{m.options.assetsBuild={};},m=>{m.options.source=JSON.parse(JSON.stringify(m.proposal));},m=>{m.mint.get(m.assetsBuild).invalid=true;},m=>{m.mint.get(m.assetsBuild).pair={};}]){const m=mock();replace(m);const value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(m.state.fsTouches,0);assert.equal(m.state.calls.length,0);assert.equal(m.state.writes.length,0);falseAuthority(value);}
 let called=0;const m=mock();m.options.source={get sources(){called++;throw Error('PRIVATE');}};assert.equal(m.build(m.options).outcome,'UNKNOWN');assert.equal(called,0);assert.equal(m.state.fsTouches,0);
});
test('whole build copies only three fixed A-target sources under H and compiles two distinct fixed C outputs',()=>{
 const m=mock(),value=m.build(m.options);assert.equal(value.outcome,'BUILT_NOT_EXECUTED');assert.equal(value.sourceWriteAttempts,3);assert.equal(value.fileCreateCount,3);assert.equal(value.dispatchAttemptCount,2);assert.equal(value.dispatchResultCount,2);assert.equal(value.observedProcessCount,2);assert.deepEqual(m.state.writes,m.names.map(name=>m.code+'/'+name));assert.equal(m.state.calls.length,2);assert.equal(m.state.toolCalls,1);assert.equal(m.handles.size,0);
 for(const row of value.report.sources){assert.equal(row.sha256,sha(m.nodes.get(row.file).body));assert(row.file.startsWith(m.h+'/prefix/native-probes/sealed-typescript-paired-stage-'));assert(Object.isFrozen(row));}
 for(const row of value.report.binaries)assert.equal(row.sha256,sha(m.nodes.get(row.file).body));assert.equal(value.report.bindings.stage,m.a+'/sealed-inputs/redue-materialization-Canary');assert.equal(m.nodes.get(m.a).size,0n);assert.equal(m.nodes.get(m.b).size,0n);falseAuthority(value);
 assert.equal(m.verify(value).outcome,'PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED');assert.equal(m.matches(value,m.assetsBuild,m.proposal),true);assert.equal(m.state.calls.length,2);
});
for(const fault of ['wrong-source-template','wrong-source-hash','wrong-source-path','wrong-source-order','wrong-compiler','extra-argv','wrong-sdk','wrong-node','existing-source','existing-output'])test('unsupported '+fault+' prevents all new files/compilers',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.sourceWriteAttempts,0);assert.equal(m.state.writes.length,0);assert.equal(value.dispatchAttemptCount,0);assert.equal(m.state.calls.length,0);falseAuthority(value);
});
for(const fault of ['source-owner','source-mode','source-link','source-symlink','write-throws','write-zero','write-close','read-close','read-corrupt','source-during-read'])test('source '+fault+' failure retains partial H and launches no compiler',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert(value.fileCreateCount>0);assert.equal(m.state.calls.length,0);assert.equal(m.handles.size,0);assert(m.state.writes.length>0);assert(!JSON.stringify(value).includes('PRIVATE'));falseAuthority(value);
});
test('short positive writes are completed rather than fabricating full written source length',()=>{const m=mock('partial-write'),value=m.build(m.options);assert.equal(value.outcome,'BUILT_NOT_EXECUTED');assert.equal(m.handles.size,0);assert.equal(m.state.writes.length,3);});
for(const fault of ['compiler-fail','compiler-signal','no-pid','wrong-header','output-link','output-parent','source-after-compiler','assets-after-compiler','source-after-compiler-proof'])test('first actual child '+fault+' cannot mint success or erase process history',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,1);assert.equal(value.dispatchResultCount,1);assert.equal(value.observedProcessCount,fault==='no-pid'?0:1);assert.equal(m.state.calls.length,1);assert.equal(value.report,null);assert.equal(m.handles.size,0);falseAuthority(value);
});
for(const [fault,attempts,results] of [['first-spawn-throws',1,0],['second-spawn-throws',2,1]])test('thrown '+fault+' retains attempt without inventing result/PID',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,attempts);assert.equal(value.dispatchResultCount,results);assert.equal(value.observedProcessCount,results);assert.equal(m.state.calls.length,attempts);assert.equal(m.handles.size,0);assert(!JSON.stringify(value).includes('PRIVATE'));falseAuthority(value);
});
for(const late of ['old-assets-final','earlier-source-final','earlier-binary-final','new-file-after-final-source'])test('last read/dependency mutation '+late+' cannot mint artifact currency',()=>{
 const m=mock();m.state.late=late;const value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,2);assert.equal(value.dispatchResultCount,2);assert.equal(value.report,null);assert.equal(m.handles.size,0);falseAuthority(value);
});
for(const target of ['checker','mapper-source','exchange-source','mapper-binary','exchange-binary','a-root','b-root','host-root','code-root'])test('readonly '+target+' replacement permanently invalidates mint without rewriting build history',()=>{
 const m=mock(),built=m.build(m.options);assert.equal(built.outcome,'BUILT_NOT_EXECUTED');const paths={'checker':m.code+'/'+m.names[0],'mapper-source':m.code+'/'+m.names[1],'exchange-source':m.code+'/'+m.names[2],'mapper-binary':m.code+'/'+m.names[1].slice(0,-2),'exchange-binary':m.code+'/'+m.names[2].slice(0,-2),'a-root':m.a,'b-root':m.b,'host-root':m.h,'code-root':m.code};const changed=m.nodes.get(paths[target]),old=changed.ino;changed.ino++;
 assert.equal(m.verify(built).outcome,'UNKNOWN');changed.ino=old;assert.equal(m.verify(built).outcome,'UNKNOWN');assert.equal(m.matches(built,m.assetsBuild,m.proposal),false);assert.equal(built.outcome,'BUILT_NOT_EXECUTED');assert.equal(m.state.calls.length,2);falseAuthority(built);
});
for(const index of [0,1,2,3,4])test('every new source/binary '+index+' requires bytes, not unchanged synthetic metadata alone',()=>{
 const m=mock(),built=m.build(m.options),files=[...m.names.map(name=>m.code+'/'+name),...m.names.slice(1).map(name=>(m.code+'/'+name).slice(0,-2))],changed=m.nodes.get(files[index]),old=Buffer.from(changed.body);changed.body[0]^=1;assert.equal(m.verify(built).outcome,'UNKNOWN');changed.body=old;assert.equal(m.verify(built).outcome,'UNKNOWN');assert.equal(m.handles.size,0);
});
test('copied artifact reports/equal namespaces/other source cannot acquire private linkage or currency',()=>{
 const m=mock(),built=m.build(m.options);for(const value of [JSON.parse(JSON.stringify(built)),{},m.assetsBuild]){assert.equal(m.verify(value).outcome,'UNKNOWN');assert.equal(m.matches(value,m.assetsBuild,m.proposal),false);}
 assert.equal(m.matches(built,{},m.proposal),false);assert.equal(m.matches(built,m.assetsBuild,JSON.parse(JSON.stringify(m.proposal))),false);assert.equal(m.matches(built,m.assetsBuild,m.proposal,'extra'),false);assert.equal(m.pairMatches(m.assetsBuild,m.pair),true);assert.equal(m.pairMatches(m.assetsBuild,{}),false);assert.equal(m.pairMatches(m.assetsBuild,m.pair,'extra'),false);
});
for(const dependency of ['assets','source'])test('missing initial '+dependency+' currency cannot write or dispatch',()=>{
 const m=mock();m.state.valid[dependency]=false;const result=m.build(m.options);assert.equal(result.outcome,'UNKNOWN');assert.equal(m.state.fsTouches,0);assert.equal(result.fileCreateCount,0);assert.equal(result.dispatchAttemptCount,0);falseAuthority(result);
});
for(const dependency of ['assets','source'])test('lost later '+dependency+' cannot revive artifact mint after restoration',()=>{
 const m=mock(),built=m.build(m.options);m.state.valid[dependency]=false;assert.equal(m.verify(built).outcome,'UNKNOWN');m.state.valid[dependency]=true;const reads=m.state.reads.length;assert.equal(m.verify(built).outcome,'UNKNOWN');assert.equal(m.state.reads.length,reads);assert.equal(m.matches(built,m.assetsBuild,m.proposal),false);assert.equal(built.outcome,'BUILT_NOT_EXECUTED');
});
test('build API exposes no original host fixture or compiler-operation input/adoption path',()=>{
 const m=mock(),value=m.build(m.options);assert.equal(Object.hasOwn(value,'hostFixture'),false);assert.equal(Object.hasOwn(value,'original'),false);assert.equal(Object.hasOwn(value,'argv'),false);assert.equal(Object.hasOwn(value.report,'hostFixture'),false);assert.deepEqual(value.commands,[]);
 assert.doesNotMatch(moduleSource,/spawnSync\(proposal\.|spawnSync\(source\.|rmSync\(/);
});
for(const fault of ['runtime-during-tool-proposal','sdk-during-tool-proposal'])test('original protected '+fault+' causes refusal before any new source or compiler',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.sourceWriteAttempts,0);assert.equal(value.fileCreateCount,0);assert.equal(value.dispatchAttemptCount,0);assert.equal(m.state.writes.length,0);falseAuthority(value);
});
for(const fault of ['output-empty','output-large','compiler-timeout'])test('incomplete/bounded output '+fault+' preserves actual first child while withholding success',()=>{
 const m=mock(fault),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,1);assert.equal(value.dispatchResultCount,1);assert.equal(value.observedProcessCount,1);assert.equal(value.report,null);assert.equal(m.handles.size,0);assert(!JSON.stringify(value).includes('PRIVATE'));falseAuthority(value);
});
test('an exclusive create race preserves the preexisting entry and records attempt without claiming creation',()=>{
 const m=mock('creation-race'),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.sourceWriteAttempts,1);assert.equal(value.fileCreateCount,0);assert.equal(value.dispatchAttemptCount,0);assert.equal(m.nodes.get(m.code+'/'+m.names[0]).body.toString(),'PRESERVED_RACE');falseAuthority(value);
});
test('close failure before known closure is UNKNOWN and cannot launch a child or claim inherited-handle safety',()=>{
 const m=mock('write-close-before'),value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,0);assert.equal(value.fileCreateCount,1);assert.equal(m.handles.size,1,'fault injection deliberately leaves descriptor disposition unknown');assert.equal(value.noInheritedWritableHandlesVerified,false);falseAuthority(value);
});

// Compose the ACTUAL existing base-assets observation, actual base verifier and
// actual new dependency group. Only the native-observer boundary/paired source
// and filesystem are synthetic. Counters below are requests and mock-row reads,
// not measured runtime/SDK bytes, latency or native enforcement evidence.
function scopedDependencies(){
 const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',pair={},host={},hostBuild={},assets={},source={};
 const minted=new WeakMap(),active=new WeakMap(),nodes=new Map(),handles=new Map();let nextIno=1n,nextFd=10,api;
 const state={valid:{pair:true,host:true,native:true},nativeCalls:0,nativeBarriers:0,sourceChecks:0,sourceUnknown:false,sourceThrow:null,scopeGetter:false,scopeGetterThrow:false,sourceAction:null,onNativeClose:null,onNativeBarrier:null,nativeSkip:false,events:[],reads:new Map()};
 const put=(file,body=null)=>{nodes.set(file,{dev:1n,ino:nextIno++,mode:body===null?0o40700n:0o100600n,uid:501n,gid:20n,nlink:body===null?2n:1n,size:BigInt(body?.length??0),mtimeNs:1n,ctimeNs:1n,body:body===null?null:Buffer.from(body)});};
 for(const name of ['/','/private','/private/tmp',a,b,h,h+'/prefix',h+'/prefix/native-probes'])put(name);
 const names=[h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel.c',h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel'];for(const file of names)put(file,Buffer.from('MOCK_ORIGINAL_BASE_ROW_'+file));
 const stat=file=>{const row=nodes.get(file);assert(row);return{...row,isDirectory:()=>row.body===null,isFile:()=>row.body!==null,isSymbolicLink:()=>false};};
 const io={constants:{O_RDONLY:0,O_NOFOLLOW:256,O_NONBLOCK:4},realpathSync:file=>file,lstatSync:stat,
  openSync(file,flags){assert.equal(flags,260);const fd=nextFd++;handles.set(fd,file);return fd;},fstatSync:fd=>stat(handles.get(fd)),
  readSync(fd,bytes,offset,length,position){const file=handles.get(fd);if(position===0)state.reads.set(file,(state.reads.get(file)??0)+1);return nodes.get(file).body.copy(bytes,offset,position,Math.min(position+length,nodes.get(file).body.length));},closeSync:fd=>assert(handles.delete(fd))};
 const initialPair={outcome:'BASE_EXCHANGE_PAIR_CURRENTLY_OBSERVED',baseA:a,baseB:b};
 const nativeObserve=(value,inspect)=>{assert.equal(value,hostBuild);state.nativeCalls++;state.events.push('native-open');assert(state.valid.native,'synthetic original native entry invalid');if(state.nativeSkip){state.events.push('native-close');return;}
  const barrier=()=>{state.nativeBarriers++;if(state.onNativeBarrier)state.onNativeBarrier();assert(state.valid.native,'synthetic original native barrier invalid');};
  assert.equal(inspect(barrier),undefined);if(state.onNativeClose)state.onNativeClose();barrier();state.events.push('native-close');
 };
 const verifySource=value=>{state.sourceChecks++;state.events.push('source');assert.equal(value,source);if(state.sourceThrow)throw state.sourceThrow;if(state.sourceAction)state.sourceAction();
  // Faithfully model the two asset requests made by the real derive() before
  // and after its fixed source construction; actual asset verifiers run here.
  const before=api.base(assets),after=api.base(assets);if(before.outcome!=='BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'||after.outcome!==before.outcome)return{outcome:'UNKNOWN'};
  const observed={outcome:state.sourceUnknown?'UNKNOWN':'PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',baseA:a,baseB:b,hostBase:h,node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node'};
  Object.defineProperty(observed,'scope',{enumerable:true,get(){if(state.scopeGetter)state.events.push('result-scope');if(state.scopeGetterThrow)throw Error('PRIVATE_SOURCE_GETTER');return'DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY';}});return observed;
 };
 const text=moduleSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ').replace('const mintedAssets=new WeakMap();','const mintedAssets=controlledMint;').replace('const activeBaseAssetsObservations=new WeakMap();','const activeBaseAssetsObservations=controlledActive;')+';return {deps:pairedDependencies,observe:observeSealedTypeScriptBaseExchangeAssets,base:verifySealedTypeScriptBaseExchangeAssets,row:bounded,root:rootIdentity};';
 api=Function('fs','path','createHash','process','controlledMint','controlledActive','verifySealedTypeScriptBaseExchangePair','verifySealedTypeScriptSyntheticFixture','observeSealedTypeScriptNativeAssetsBuild','verifySealedTypeScriptPairedStageSource','sealedTypeScriptPairedStageSourceMatchesDerivation',text)(io,path.posix,createHash,{getuid:()=>501},minted,active,value=>value===pair&&state.valid.pair?initialPair:{outcome:'UNKNOWN'},value=>({outcome:value===host&&state.valid.host?'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED':'UNKNOWN'}),nativeObserve,verifySource,(value,p,build)=>value===source&&p===pair&&build===assets);
 const original={pair,hostFixture:host,hostBuild,initialPair,roots:[a,b,h].map(file=>[file,api.root(file)]),source:api.row(names[0],65536),binary:api.row(names[1],2*1024*1024)};minted.set(assets,original);state.reads.clear();
 const record={assetsBuild:assets,pair,proposal:source};return{...api,state,record,assets,source,original,active,nodes,names,handles};
}
test('standalone dependency group requests exactly one fresh native observation and reads each original base row twice',()=>{
 const m=scopedDependencies();m.state.scopeGetter=true;const value=m.deps(m.record);m.state.events.push('returned');assert.equal(value.assets.outcome,'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');assert.equal(m.state.nativeCalls,1);assert.equal(m.state.sourceChecks,1);for(const name of m.names)assert.equal(m.state.reads.get(name),2);assert(m.state.nativeBarriers>=2);assert(m.state.events.indexOf('native-close')<m.state.events.indexOf('result-scope'));assert.equal(m.state.events.at(-1),'returned');assert.equal(m.active.has(m.assets),false);
 m.deps(m.record);assert.equal(m.state.nativeCalls,2,'next independent call observes anew');for(const name of m.names)assert.equal(m.state.reads.get(name),4);assert.equal(m.handles.size,0);
});
test('already-active same-original group makes no nested public observation and still invokes live barriers',()=>{
 const m=scopedDependencies();m.observe(m.assets,()=>{const before=m.state.nativeBarriers;assert.equal(m.deps(m.record).source.outcome,'PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED');assert(m.state.nativeBarriers>before);assert.equal(m.state.nativeCalls,1);});assert.equal(m.state.nativeCalls,1);for(const name of m.names)assert.equal(m.state.reads.get(name),2);assert.equal(m.active.has(m.assets),false);
});
for(const fault of ['enabled','failed'])test('mere presence of '+fault+' active operation never grants dependency currency',()=>{
 const m=scopedDependencies();assert.throws(()=>m.observe(m.assets,()=>{const operation=m.active.get(m.assets);if(fault==='enabled')operation.enabled=false;else operation.failed=true;assert.throws(()=>m.deps(m.record));}));assert.equal(m.original.invalid,true);assert.equal(m.state.nativeCalls,1);assert.equal(m.active.has(m.assets),false);assert.throws(()=>m.deps(m.record));
});
for(const kind of ['pair','host','native'])test('active group retains changing original '+kind+' boundary guards',()=>{
 const m=scopedDependencies();assert.throws(()=>m.observe(m.assets,()=>{m.state.valid[kind]=false;m.deps(m.record);}));assert.equal(m.original.invalid,true);assert.equal(m.active.has(m.assets),false);
});
test('public nested observation remains refused and cannot be rescued by dependency group',()=>{
 const m=scopedDependencies();assert.throws(()=>m.observe(m.assets,()=>{assert.throws(()=>m.observe(m.assets,()=>{}));assert.throws(()=>m.deps(m.record));}));assert.equal(m.original.invalid,true);assert.equal(m.state.nativeCalls,1);assert.equal(m.active.has(m.assets),false);
});
test('source UNKNOWN result is checked after closure without falsely invalidating a healthy original assets owner',()=>{
 const m=scopedDependencies();m.state.sourceUnknown=true;m.state.scopeGetter=true;assert.throws(()=>m.deps(m.record));assert.notEqual(m.original.invalid,true);assert(m.state.events.indexOf('native-close')<m.state.events.indexOf('result-scope'));m.state.sourceUnknown=false;assert.equal(m.deps(m.record).source.outcome,'PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED');assert.equal(m.state.nativeCalls,2);
});
for(const fault of ['source-throw','source-getter','close-throw','unfinished'])test('uncertain '+fault+' never lets a dependency result escape',()=>{
 const m=scopedDependencies();let returned=false;if(fault==='source-throw')m.state.sourceThrow=new Proxy({},{get(){assert.fail('foreign exception inspected');}});if(fault==='source-getter')m.state.scopeGetterThrow=true;if(fault==='close-throw')m.state.onNativeClose=()=>{throw Error('PRIVATE_CLOSE');};if(fault==='unfinished')m.state.nativeSkip=true;
 assert.throws(()=>{m.deps(m.record);returned=true;});assert.equal(returned,false);assert.equal(m.active.has(m.assets),false);
});
for(const kind of ['old-source-content','old-binary-identity','root-identity'])test('late observation close mutation '+kind+' retains the existing endpoint/premise boundary',()=>{
 const m=scopedDependencies();m.state.onNativeClose=()=>{if(kind==='old-source-content')m.nodes.get(m.names[0]).body[0]^=1;else if(kind==='old-binary-identity')m.nodes.get(m.names[1]).ino++;else m.nodes.get(m.original.roots[2][0]).ino++;};
 // Held-metadata content mutation AFTER the last hash is explicitly outside
 // the existing trusted/quiescent premise; never claim hostile-write closure.
 if(kind==='old-source-content'){assert.equal(m.deps(m.record).assets.outcome,'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED');m.state.onNativeClose=null;assert.throws(()=>m.deps(m.record),'next fresh original hash observes changed content');}
 else assert.throws(()=>m.deps(m.record));assert.equal(m.original.invalid,true);
});
test('mixed/private source or pair refuses before native observation and original content reads',()=>{
 for(const key of ['assetsBuild','pair','proposal']){const m=scopedDependencies(),forged=new Proxy({},{get(){assert.fail('foreign field read');}});assert.throws(()=>m.deps({...m.record,[key]:forged}));assert.equal(m.state.nativeCalls,0);assert.equal(m.state.reads.size,0);}
});
for(const target of ['source','binary'])test('final dependency close mutating earlier '+target+' is caught by retained consumer ending checks',()=>{
 const m=mock();let closes=0;m.state.onScopeClose=()=>{if(++closes===16)m.nodes.get(m.code+'/'+(target==='source'?m.names[0]:m.names[1].slice(0,-2))).ino++;};const value=m.build(m.options);assert.equal(value.outcome,'UNKNOWN');assert.equal(value.dispatchAttemptCount,2);assert.equal(value.dispatchResultCount,2);assert.equal(value.report,null);assert.equal(m.state.scopeCalls,16);
 const later=mock(),built=later.build(later.options);assert.equal(built.outcome,'BUILT_NOT_EXECUTED');let last=0;const file=later.code+'/'+(target==='source'?later.names[0]:later.names[1].slice(0,-2)),row=later.nodes.get(file),original=row.ino;later.state.onScopeClose=()=>{if(++last===3)row.ino++;};assert.equal(later.verify(built).outcome,'UNKNOWN');row.ino=original;later.state.onScopeClose=null;assert.equal(later.verify(built).outcome,'UNKNOWN');assert.equal(built.outcome,'BUILT_NOT_EXECUTED');
});
test('stable paired build uses sixteen independent guarded dependency observations, not a build-long cache',()=>{const m=mock(),value=m.build(m.options);assert.equal(value.outcome,'BUILT_NOT_EXECUTED');assert.equal(m.state.scopeCalls,16);assert.equal(m.state.scopeCloses,16);const before=m.state.scopeCalls;assert.equal(m.verify(value).outcome,'PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED');assert.equal(m.state.scopeCalls-before,3);});

test('source callback reentry into public observation refuses and invalidates the owned group',()=>{const m=scopedDependencies();m.state.sourceAction=()=>m.observe(m.assets,()=>{});assert.throws(()=>m.deps(m.record));assert.equal(m.original.invalid,true);assert.equal(m.active.has(m.assets),false);assert.equal(m.state.nativeCalls,1);});
for(const kind of ['pair','host','native','old-source','old-binary'])test('fresh independent dependency group retains original entry '+kind+' checks',()=>{const m=scopedDependencies();if(kind==='old-source'||kind==='old-binary')m.nodes.get(m.names[kind==='old-source'?0:1]).body[0]^=1;else m.state.valid[kind]=false;assert.throws(()=>m.deps(m.record));assert.equal(m.original.invalid,true);assert.equal(m.active.has(m.assets),false);});
