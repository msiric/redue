// Fixed CI-only test of native vnode hints. Never grants portable applicability.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {parsePortableJson} from '../../src/portable-envelope.mjs';
import {ancestorStreamPrerequisites} from './portable-ancestor-stream.mjs';
import {readAncestorObservationCapability,ancestorObservationResources,ancestorObservationCapabilityCurrent} from '../../src/portable-ancestor-capability.mjs';
import {reviewedNodeDigest} from '../../src/portable-runtime.mjs';
import {directEnvironmentIssue} from '../../src/direct-typescript.mjs';
import {buildPortableVnodeGuard} from './build-portable-vnode-guard.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
const equalKeys=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
function watch(binary,binding,cap,targets){
 const resources=ancestorObservationResources(cap);if(sha(fs.readFileSync(binary))!==binding.executableSha256)fail('BINARY_CHANGED');
 const frames=[Buffer.from('INIT '+targets.length+'\n')];
 for(const [id,file] of targets.entries()){
  if(!path.isAbsolute(file)||path.resolve(file)!==file||!/^\/[\x20-\x7e]+$/.test(file)||/[\\:]/.test(file)||file.length>4096||fs.realpathSync(file)!==file)fail('TARGET_UNSAFE');
  const s=fs.lstatSync(file,{bigint:true});if(s.isSymbolicLink()||!s.isFile()&&!s.isDirectory())fail('TARGET_UNSAFE');
  // Only owned synthetic resources: no imported path or general directory access.
  if(file!==path.dirname(resources.root)&&file!==resources.root&&!file.startsWith(resources.root+'/'))fail('TARGET_SCOPE');
  if(s.uid!==BigInt(process.getuid()))fail('TARGET_UNSAFE');
  const bytes=Buffer.from(file);frames.push(Buffer.from(`${id} ${bytes.length} ${s.dev} ${s.ino} ${s.mode}\n`),bytes,Buffer.from('\n'));
 }
 if(!ancestorObservationCapabilityCurrent(cap)||sha(fs.readFileSync(binary))!==binding.executableSha256)fail('BINARY_CHANGED');
 const child=spawn(binary,[],{cwd:resources.state,env:process.env,stdio:['pipe','pipe','ignore']});
 const counts=Array(targets.length).fill(0);
 let exit=null,pending=null,serial=0,dirty=[],buffer='',bytes=0,rows=0,failed=false,closing=false,closed=false,next=0;
 const done=new Promise(resolve=>child.once('close',(code,signal)=>{exit={code,signal};resolve(exit);if(!closed||buffer)gap();}));
 function gap(){if(failed)return;failed=true;if(pending){clearTimeout(pending.timer);pending.reject(Error('VNODE_UNAVAILABLE'));pending=null;}child.kill('SIGKILL');}
 const current=()=>ancestorObservationCapabilityCurrent(cap)&&sha(fs.readFileSync(binary))===binding.executableSha256;
 child.once('error',gap);child.stdin.on('error',gap);
 child.stdout.on('data',chunk=>{
  bytes+=chunk.length;buffer+=chunk.toString('utf8');if(bytes>4*1024*1024||Buffer.byteLength(buffer)>128*1024){gap();return;}
  while(buffer.includes('\n')){const at=buffer.indexOf('\n'),line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(++rows>32768||Buffer.byteLength(line)>65536){gap();return;}
   try{const row=parsePortableJson(line);if(row.schema!==1)throw Error();
    if(row.type==='uncertainty'){
     if(!equalKeys(row,['schema','type','code'])||!['VNODE_EVENT','VNODE_SERIAL','VNODE_DRAIN_LIMIT','VNODE_DRAIN','VNODE_RESOURCE','VNODE_TARGET','VNODE_IDENTITY','VNODE_REGISTRATION','VNODE_CLOSE'].includes(row.code))throw Error();
     gap();return;
    }
    if(row.type==='occurrence'){
     if(!equalKeys(row,['schema','type','scopeIds','serial'])||row.serial!==serial+1||!Array.isArray(row.scopeIds)||row.scopeIds.length!==1||!Number.isInteger(row.scopeIds[0])||row.scopeIds[0]<0||row.scopeIds[0]>=targets.length)throw Error();
     serial=row.serial;counts[row.scopeIds[0]]++;if(!dirty.includes(row.scopeIds[0]))dirty.push(row.scopeIds[0]);dirty.sort((a,b)=>a-b);continue;
    }
    if(!equalKeys(row,['schema','type','request','serial','dirtyIds','uncertain'])||row.serial!==serial||row.uncertain!==false||JSON.stringify(row.dirtyIds)!==JSON.stringify(dirty)||!pending||row.type!==pending.type||row.request!==pending.request||closing!==(row.type==='closed'))throw Error();
    if(row.type==='closed')closed=true;clearTimeout(pending.timer);const wait=pending;pending=null;wait.resolve({serial,dirtyIds:[...dirty],scopeCounts:[...counts],healthy:true});
   }catch{gap();return;}
  }
 });
 const wait=(type,request)=>new Promise((resolve,reject)=>{if(failed||pending){reject(Error('VNODE_UNAVAILABLE'));return;}
  pending={type,request,resolve,reject,timer:setTimeout(gap,5000)};});
 const ready=wait('ready',0);child.stdin.write(Buffer.concat(frames));
 const reap=async()=>{let timer;try{return await Promise.race([done,new Promise(resolve=>{timer=setTimeout(()=>{child.kill('SIGKILL');resolve(null);},5000);})]);}finally{clearTimeout(timer);}};
 async function barrier(){if(failed||!current()){gap();fail('VNODE_UNAVAILABLE');}const id=++next,promise=wait('barrier',id);child.stdin.write('barrier '+id+'\n');const value=await promise;
  if(failed||!current()){gap();fail('VNODE_UNAVAILABLE');}return value;
 }
 async function close(){if(!current())gap();if(!failed&&!closed){closing=true;const id=++next,promise=wait('closed',id);child.stdin.write('close '+id+'\n');try{await promise;}catch{gap();}}
  child.stdin.end();await reap();return {code:exit?.code??null,signal:exit?.signal??null,reaped:exit!==null,protocol_clean:closed&&!failed&&!buffer&&exit?.code===0&&exit?.signal===null&&current()};
 }
 return {ready:ready.then(value=>{if(failed||!current()){gap();fail('VNODE_UNAVAILABLE');}return value;}),barrier,close,abort:async()=>{gap();return await reap();}};
}
function mapper(file){
 // Existing MAP_SHARED mapping remains alive through the final guard drain. No
 // flush/msync/unmap/close is requested until after that drain and actual record.
 const program='import sys,mmap\nf=open(sys.argv[1],"r+b",buffering=0)\nm=mmap.mmap(f.fileno(),0,access=mmap.ACCESS_WRITE)\nm[0]=65\nprint("READY",flush=True)\nfor raw in sys.stdin:\n c=raw.strip()\n if c=="B": m[0]=66;print("B",flush=True)\n elif c=="A": m[0]=65;print("A",flush=True)\n elif c=="CLOSE": break\n else: sys.exit(2)\nm.close();f.close()\n';
 const child=spawn('/usr/bin/python3',['-u','-c',program,file],{stdio:['pipe','pipe','ignore']});
 let pending=null,buffer='',total=0,exit=null,failed=false;
 const done=new Promise(resolve=>child.once('close',(code,signal)=>{exit={code,signal};resolve(exit);if(pending){clearTimeout(pending.timer);pending.reject(Error('MAP_UNAVAILABLE'));pending=null;}}));
 function gap(){failed=true;if(pending){clearTimeout(pending.timer);pending.reject(Error('MAP_UNAVAILABLE'));pending=null;}child.kill('SIGKILL');}
 child.once('error',gap);child.stdin.on('error',gap);
 child.stdout.on('data',chunk=>{total+=chunk.length;buffer+=chunk.toString('utf8');if(total>1024){gap();return;}
  while(buffer.includes('\n')){const at=buffer.indexOf('\n'),row=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!pending||row!==pending.expected){gap();return;}clearTimeout(pending.timer);const wait=pending;pending=null;wait.resolve();}
 });
 const wait=expected=>new Promise((resolve,reject)=>{if(failed||pending){reject(Error('MAP_UNAVAILABLE'));return;}pending={expected,resolve,reject,timer:setTimeout(gap,5000)};});
 const ready=wait('READY');
 return {ready,send:async value=>{const promise=wait(value);child.stdin.write(value+'\n');await promise;},abort:()=>gap(),close:async()=>{child.stdin.end('CLOSE\n');let timer;
  try{await Promise.race([done,new Promise(resolve=>{timer=setTimeout(()=>{child.kill('SIGKILL');resolve(null);},5000);})]);}finally{clearTimeout(timer);}
  return {code:exit?.code??null,signal:exit?.signal??null,reaped:exit!==null,protocol_clean:!failed&&buffer===''&&exit?.code===0&&exit?.signal===null};}};
}
const started=performance.now(),report={schema:1,scope:'CI_TEST_ONLY_VNODE_HINTS',source:process.env.GITHUB_SHA,models_launched:0,compiler_executions:0,interval_authority:false,result:'UNKNOWN',cases:[]};
let base,authority,guard=null,mapping=null,reapKnown=true,expired=false,mapperLaunched=false,guardLaunched=false;const owned=[];
const deadline=setTimeout(()=>{expired=true;void guard?.abort();mapping?.abort();},90000);
const admitted=()=>{if(expired||performance.now()-started>=90000)fail('PARENT_DEADLINE');};
try{
 if(!ancestorStreamPrerequisites()||directEnvironmentIssue())fail('HOST_PROFILE_UNSUPPORTED');
 if(sha(fs.readFileSync(fs.realpathSync(process.execPath)))!==reviewedNodeDigest)fail('NODE_IMPLEMENTATION_UNSUPPORTED');
 base=fs.mkdtempSync(path.join(fs.realpathSync(process.env.RUNNER_TEMP),'redue-vnode-spike-'));fs.chmodSync(base,0o700);
 const root=path.join(base,'project'),state=path.join(base,'state'),src=path.join(root,'src');fs.mkdirSync(src,{recursive:true,mode:0o700});fs.mkdirSync(state,{mode:0o700});
 const file=path.join(src,'consumed.txt'),alias=path.join(src,'owned-alias.txt');fs.writeFileSync(file,'A',{mode:0o600});fs.linkSync(file,alias);
 const parent=path.join(os.homedir(),'Library','REDUE-Observer-Authority');if(!fs.existsSync(parent))fs.mkdirSync(parent,{mode:0o700});
 const ps=fs.lstatSync(parent);if(!ps.isDirectory()||ps.isSymbolicLink()||ps.uid!==process.getuid()||(ps.mode&0o077))fail('AUTHORITY_PARENT_UNSAFE');
 authority=path.join(parent,process.env.GITHUB_RUN_ID);fs.mkdirSync(authority,{mode:0o700});owned.push(authority);const r=fs.statSync(root,{bigint:true}),s=fs.statSync(state,{bigint:true});
 fs.writeFileSync(path.join(authority,'scope.json'),JSON.stringify({schema:1,interpretation:'redue-ci-ancestor-observation@1',repository:'msiric/redue',ref:process.env.GITHUB_REF,source:process.env.GITHUB_SHA,
  runId:process.env.GITHUB_RUN_ID,attempt:1,root,state,rootIdentity:[String(r.dev),String(r.ino)],stateIdentity:[String(s.dev),String(s.ino)],scope:'locally-derived-ancestor-npm-resolution-only',retention:'scope-ids-and-serials-only'}),{flag:'wx',mode:0o600});
 admitted();
 const cap=readAncestorObservationCapability(path.join(authority,'scope.json'),{root,state}),binary=path.join(base,'guard'),binding=buildPortableVnodeGuard(binary);
 if(binding.sourceSha256!=='f87172afa3012658894f856490e32e1cab75c7cd52b97d432f9707af85fdbb0a'||binding.mode!=='test-only-vnode'||binding.started!==false)fail('BINARY_BINDING');
 report.binding=binding;report.profile={node:process.version,os:os.release(),architecture:process.arch,filesystem_type:fs.statfsSync(root).type};
 admitted();reapKnown=false;mapping=mapper(file);mapperLaunched=true;await mapping.ready;
 admitted();guard=watch(binary,binding,cap,[src,file,base,root]);guardLaunched=true;await guard.ready;
 async function exercise(name,operation){admitted();const before=await guard.barrier();const facts=await operation();const after=await guard.barrier();
  const expected={MEMBERSHIP_CREATE_DELETE:0,ANCESTOR_PREFIX_CREATE_DELETE:2,HARDLINK_WRITE_RESTORE:1,PREEXISTING_MAP_SHARED_WRITE_RESTORE:1,ROOT_RENAME_RESTORE:3}[name];
  const observed=after.serial>before.serial,expectedScopeObserved=expected===undefined?!observed:after.scopeCounts[expected]>before.scopeCounts[expected];
  const asserted=expectedScopeObserved&&facts.changed_bytes_observed!==false&&facts.restored_bytes_observed!==false;
  report.cases.push({name,before,after,...facts,observed,expected_scope:expected??null,expected_scope_observed:expectedScopeObserved,assertion_passed:asserted});if(!asserted)report.assertion_outcome='FAIL';}
 await exercise('READ_ONLY_CONTROL',()=>{fs.readFileSync(file);return {body_read_from_owned_fixture:true};});
 await exercise('MEMBERSHIP_CREATE_DELETE',()=>{const p=path.join(src,'transient.ts');fs.writeFileSync(p,'export {};',{flag:'wx',mode:0o600});fs.unlinkSync(p);return {};});
 await exercise('ANCESTOR_PREFIX_CREATE_DELETE',()=>{const p=path.join(base,'node_modules');fs.mkdirSync(p,{mode:0o700});fs.rmdirSync(p);return {};});
 await exercise('HARDLINK_WRITE_RESTORE',()=>{fs.writeFileSync(alias,'B');const changed=fs.readFileSync(file).toString()==='B';fs.writeFileSync(alias,'A');return {changed_bytes_observed:changed,restored_bytes_observed:fs.readFileSync(file).toString()==='A'};});
 await exercise('PREEXISTING_MAP_SHARED_WRITE_RESTORE',async()=>{await mapping.send('B');const changed=fs.readFileSync(file).toString()==='B';await mapping.send('A');return {changed_bytes_observed:changed,restored_bytes_observed:fs.readFileSync(file).toString()==='A',mapping_open_through_final_drain:true,mapping_dirty_before_registration:true};});
 await exercise('ROOT_RENAME_RESTORE',()=>{const p=path.join(base,'renamed-root');fs.renameSync(root,p);fs.renameSync(p,root);return {};});
 // Close/unmap only after the mmap case's facts and native final drain are saved.
 report.mapper_close=await mapping.close();mapping=null;
 report.guard_close=await guard.close();guard=null;reapKnown=report.mapper_close.reaped&&report.guard_close.reaped;
 const required=report.cases.filter(row=>row.name!=='READ_ONLY_CONTROL');
 report.result=report.assertion_outcome==='FAIL'?'FAIL':report.cases.length===6&&required.every(row=>row.assertion_passed)&&report.mapper_close.protocol_clean&&report.guard_close.protocol_clean?'FIXTURE_HINTS_OBSERVED_NOT_CONTRACT_ACCEPTANCE':'UNKNOWN';
}catch(error){report.reason_code=['HOST_PROFILE_UNSUPPORTED','NODE_IMPLEMENTATION_UNSUPPORTED','AUTHORITY_PARENT_UNSAFE','TARGET_UNSAFE','TARGET_SCOPE','BINARY_BINDING','BINARY_CHANGED','PARENT_DEADLINE'].includes(error?.code)?error.code:'VNODE_OR_MAP_UNAVAILABLE';}
finally{
 if(mapping){try{report.mapper_close=await mapping.close();}catch{report.mapper_close={reaped:false};}}
 if(guard){try{report.guard_close=await guard.close();}catch{report.guard_close={reaped:false};}}
 reapKnown=(!mapperLaunched||report.mapper_close?.reaped===true)&&(!guardLaunched||report.guard_close?.reaped===true);
 if(reapKnown){for(const p of owned.reverse())fs.rmSync(p,{recursive:true,force:true});if(base)fs.rmSync(base,{recursive:true,force:true});report.owned_files_cleanup=true;}
 else{report.owned_files_cleanup=false;report.cleanup_reason='OWNED_CHILD_REAP_UNKNOWN';if(report.result!=='FAIL')report.result='UNKNOWN';}
 clearTimeout(deadline);
}
if(report.assertion_outcome==='FAIL')report.result='FAIL';
if(expired||performance.now()-started>=90000){report.deadline_exceeded=true;if(report.result!=='FAIL')report.result='UNKNOWN';}
report.elapsed_ms=Math.round((performance.now()-started)*1000)/1000;console.log(JSON.stringify(report));
if(report.result!=='FIXTURE_HINTS_OBSERVED_NOT_CONTRACT_ACCEPTANCE')process.exitCode=1;
