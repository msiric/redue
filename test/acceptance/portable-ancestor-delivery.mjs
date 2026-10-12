// Diagnostic-only fixed root-versus-owned delivery observations. No compiler,
// model, interval certificate or applicability decision is produced here.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {ancestorStreamPrerequisites} from './portable-ancestor-stream.mjs';
import {readAncestorObservationCapability,ancestorObservationResources,ancestorObservationCapabilityCurrent} from '../../src/portable-ancestor-capability.mjs';
import {derivePortableRawQueryScopes} from '../../src/portable-ancestor-queries.mjs';
import {ancestorInitialization,AncestorProtocol} from '../../src/portable-ancestor-protocol.mjs';
import {reviewedNodeDigest} from '../../src/portable-runtime.mjs';
import {directEnvironmentIssue} from '../../src/direct-typescript.mjs';
import {buildPortableAncestorFSEvents} from '../../scripts/build-portable-ancestor-fsevents.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function startDiagnostic(binary,binding,capability,scopes,kind){
 const resources=ancestorObservationResources(capability);
 if(!['root','owned'].includes(kind)||sha(fs.readFileSync(binary))!==binding.executableSha256)fail('DIAGNOSTIC_BINDING');
 // The native diagnostic selector is compile-time-only. This is a test driver,
 // not the production wrapper; imports never select its arguments or roots.
 const protocol=new AncestorProtocol(scopes.length),child=spawn(binary,[kind,resources.root],{cwd:resources.state,env:process.env,stdio:['pipe','pipe','ignore']});
 let pending=null,sequence=0,bytes=0,rows=0,buffer='',failed=false,closing=false,exit=null;
 const ended=new Promise(resolve=>child.once('close',(code,signal)=>{exit={code,signal};resolve(exit);if(!protocol.closed||buffer)gap();}));
 function gap(){if(failed)return;failed=true;protocol.uncertain=true;if(pending){clearTimeout(pending.timer);pending.reject(Error('DIAGNOSTIC_UNAVAILABLE'));pending=null;}child.kill('SIGKILL');}
 child.once('error',gap);child.stdin.on('error',gap);
 child.stdout.on('data',chunk=>{
  bytes+=chunk.length;buffer+=chunk.toString('utf8');if(bytes>4*1024*1024||Buffer.byteLength(buffer)>128*1024){gap();return;}
  while(buffer.includes('\n')){const at=buffer.indexOf('\n'),line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(++rows>32768){gap();return;}
   try{const row=protocol.accept(line,{request:pending?.request??null,closing});
    if(row.type==='uncertainty'){gap();return;}if(row.type==='occurrence')continue;
    if(!pending||pending.type!==row.type)throw Error();clearTimeout(pending.timer);const wait=pending;pending=null;wait.resolve();
   }catch{gap();return;}
  }
 });
 const wait=(type,request)=>new Promise((resolve,reject)=>{
  if(failed||pending){reject(Error('DIAGNOSTIC_UNAVAILABLE'));return;}
  pending={type,request,resolve,reject,timer:setTimeout(gap,5000)};
 });
 const current=()=>ancestorObservationCapabilityCurrent(capability)&&sha(fs.readFileSync(binary))===binding.executableSha256;
 const ready=wait('ready',null);child.stdin.write(ancestorInitialization(scopes));
 async function barrier(){if(failed||!current()){gap();fail('DIAGNOSTIC_UNAVAILABLE');}
  const id=++sequence,promise=wait('barrier',id);child.stdin.write('barrier '+id+'\n');await promise;
  if(failed||!current()){gap();fail('DIAGNOSTIC_UNAVAILABLE');}
  return {serial:protocol.serial,healthy:!protocol.uncertain};
 }
 const reap=async()=>{let timer;try{return await Promise.race([ended,new Promise(resolve=>{timer=setTimeout(()=>{child.kill('SIGKILL');resolve(null);},5000);})]);}finally{clearTimeout(timer);}};
 async function close(){if(!failed&&!protocol.closed){closing=true;const id=++sequence,promise=wait('closed',id);child.stdin.write('close '+id+'\n');try{await promise;}catch{gap();}}
  child.stdin.end();await reap();return {code:exit?.code??null,signal:exit?.signal??null,reaped:exit!==null,protocol_clean:protocol.closed&&!failed&&!buffer&&exit?.code===0&&exit?.signal===null};
 }
 return {ready:ready.then(()=>{if(failed||!current()){gap();fail('DIAGNOSTIC_UNAVAILABLE');}}),barrier,close,abort:async()=>{gap();return await reap();}};
}
const started=performance.now(),report={schema:1,scope:'CI_FILTERED_DELIVERY_DIAGNOSTIC_ONLY',source:process.env.GITHUB_SHA,
 models_launched:0,compiler_executions:0,interval_authority:false,result:'UNKNOWN',streams:[]};
let base,authority,current=null,reapKnown=true,expired=false;const owned=[];
const deadline=setTimeout(()=>{expired=true;void current?.abort();},90000);
try{
 if(!ancestorStreamPrerequisites()||directEnvironmentIssue())fail('HOST_PROFILE_UNSUPPORTED');
 if(sha(fs.readFileSync(fs.realpathSync(process.execPath)))!==reviewedNodeDigest)fail('NODE_IMPLEMENTATION_UNSUPPORTED');
 base=fs.mkdtempSync(path.join(fs.realpathSync(process.env.RUNNER_TEMP),'redue-raw-delivery-'));fs.chmodSync(base,0o700);
 const root=path.join(base,'project'),state=path.join(base,'state'),src=path.join(root,'src');
 fs.mkdirSync(src,{recursive:true,mode:0o700});fs.mkdirSync(state,{mode:0o700});
 const authorityParent=path.join(os.homedir(),'Library','REDUE-Observer-Authority');
 if(!fs.existsSync(authorityParent))fs.mkdirSync(authorityParent,{mode:0o700});
 const parent=fs.lstatSync(authorityParent);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid()||(parent.mode&0o077))fail('AUTHORITY_PARENT_UNSAFE');
 authority=path.join(authorityParent,process.env.GITHUB_RUN_ID);fs.mkdirSync(authority,{mode:0o700});owned.push(authority);
 const file=path.join(authority,'scope.json'),r=fs.statSync(root,{bigint:true}),s=fs.statSync(state,{bigint:true});
 fs.writeFileSync(file,JSON.stringify({schema:1,interpretation:'redue-ci-ancestor-observation@1',repository:'msiric/redue',ref:process.env.GITHUB_REF,source:process.env.GITHUB_SHA,
  runId:process.env.GITHUB_RUN_ID,attempt:1,root,state,rootIdentity:[String(r.dev),String(r.ino)],stateIdentity:[String(s.dev),String(s.ino)],
  scope:'locally-derived-ancestor-npm-resolution-only',retention:'scope-ids-and-serials-only'}),{flag:'wx',mode:0o600});
 const cap=readAncestorObservationCapability(file,{root,state}),derived=derivePortableRawQueryScopes(root,[['entries',src,[]]]);
 const bindings=new Map();report.bindings=[];
 for(const variant of ['NO_DRAIN','QUEUE_DRAIN']){
  if(expired||performance.now()-started>=90000)fail('PARENT_DEADLINE');
  const binary=path.join(base,'diagnostic-'+variant),binding=buildPortableAncestorFSEvents(binary,{diagnostic:true,diagnosticDrain:variant==='QUEUE_DRAIN'});
  if(binding.mode!==(variant==='QUEUE_DRAIN'?'diagnostic-drain':'diagnostic')||binding.sourceSha256!=='a7e766b3df8431441f9333df75deb15f36270ac3b4cc142fc57c2ddcd9b1528a'||binding.started!==false)fail('DIAGNOSTIC_BINDING');
  bindings.set(variant,{binary,binding});report.bindings.push({variant,sourceSha256:binding.sourceSha256,executableSha256:binding.executableSha256,bytes:binding.bytes,flags:binding.flags,compilerVersion:binding.compilerVersion});
 }
 report.profile={node:process.version,os:os.release(),architecture:process.arch,filesystem_type:fs.statfsSync(root).type,same_device_as_filesystem_root:r.dev===fs.statSync('/',{bigint:true}).dev};
 for(const variant of ['NO_DRAIN','QUEUE_DRAIN']){
  const kind='root',{binary,binding}=bindings.get(variant);
  if(expired||performance.now()-started>=90000)fail('PARENT_DEADLINE');
  const trial={kind,variant,observations:[],close:null};report.streams.push(trial);
  reapKnown=false;current=startDiagnostic(binary,binding,cap,derived.scopes,kind);
  try{
   await current.ready;const baseline=await current.barrier();trial.start=baseline;
   const marker=path.join(src,'held-marker.ts'),transient=path.join(src,'transient.ts');
   for(const action of ['HELD_MARKER_CREATE','TRANSIENT_AFTER_MARKER']){
    if(expired||performance.now()-started>=90000)fail('PARENT_DEADLINE');
    trial.observations.push({action,phase:'ACTION_BASELINE',...(await current.barrier())});
    if(action==='HELD_MARKER_CREATE')fs.writeFileSync(marker,'export {};',{flag:'wx',mode:0o600});
    else{fs.writeFileSync(transient,'export {};',{flag:'wx',mode:0o600});fs.unlinkSync(transient);}
    const actionAt=performance.now();
    // Diagnostic observations, not stability waits, verification timings or a
    // license to turn a missed immediate event into an accepted interval.
    for(const offset of [0,500,2000]){
     if(expired||performance.now()-started>=90000)fail('PARENT_DEADLINE');
     await sleep(Math.max(0,actionAt+offset-performance.now()));
     try{const at=performance.now(),value=await current.barrier();trial.observations.push({action,offset_ms:offset,elapsed_ms:Math.round((performance.now()-actionAt)*1000)/1000,
      command_ms:Math.round((performance.now()-at)*1000)/1000,serial:value.serial,healthy:value.healthy});}
     catch{trial.observations.push({action,offset_ms:offset,result:'UNKNOWN',reason_code:'DIAGNOSTIC_UNAVAILABLE'});}
    }
   }
   fs.unlinkSync(marker);
  }catch{trial.start_result='UNKNOWN';trial.reason_code='DIAGNOSTIC_UNAVAILABLE';}
  trial.close=await current.close();reapKnown=trial.close.reaped;current=null;
  if(!reapKnown)fail('OWNED_CHILD_REAP_UNKNOWN');
  // Reset only owned synthetic files after actual child reaping, so an unknown
  // first stream cannot silently become the second stream's initial fixture.
  fs.rmSync(path.join(src,'held-marker.ts'),{force:true});fs.rmSync(path.join(src,'transient.ts'),{force:true});
 }
 report.result=report.streams.length===2&&report.streams.every(stream=>stream.start?.healthy===true&&stream.observations.length===8&&stream.observations.every(row=>row.healthy===true)&&stream.close?.reaped===true&&stream.close.protocol_clean)?'DIAGNOSTIC_COLLECTED_NOT_INTERVAL_ACCEPTANCE':'UNKNOWN';
}catch(error){report.reason_code=['HOST_PROFILE_UNSUPPORTED','NODE_IMPLEMENTATION_UNSUPPORTED','AUTHORITY_PARENT_UNSAFE','DIAGNOSTIC_BINDING','OWNED_CHILD_REAP_UNKNOWN','PARENT_DEADLINE'].includes(error?.code)?error.code:'DIAGNOSTIC_UNAVAILABLE';}
finally{
 if(current){try{report.final_close=await current.close();reapKnown=report.final_close.reaped;}catch{reapKnown=false;}}
 if(reapKnown){for(const file of owned.reverse())fs.rmSync(file,{recursive:true,force:true});if(base)fs.rmSync(base,{recursive:true,force:true});report.owned_files_cleanup=true;}
 else{report.owned_files_cleanup=false;report.cleanup_reason='OWNED_CHILD_REAP_UNKNOWN';}
 clearTimeout(deadline);
}
if(expired||performance.now()-started>=90000){report.deadline_exceeded=true;report.result='UNKNOWN';report.reason_code='PARENT_DEADLINE';}
report.elapsed_ms=Math.round((performance.now()-started)*1000)/1000;console.log(JSON.stringify(report));
if(report.result!=='DIAGNOSTIC_COLLECTED_NOT_INTERVAL_ACCEPTANCE')process.exitCode=1;
