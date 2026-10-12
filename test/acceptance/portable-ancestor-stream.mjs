// One fixed, owner-approved CI-only provider trial. Not compiler verification,
// native-agent enforcement, portable applicability or model behavior.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {readAncestorObservationCapability} from '../../src/portable-ancestor-capability.mjs';
import {openRawQueryObserver} from '../../src/portable-ancestor-observer.mjs';
import {portableRuntimeSupported,reviewedNodeDigest} from '../../src/portable-runtime.mjs';
export function ancestorStreamPrerequisites(env=process.env){
 return portableRuntimeSupported()&&process.getuid?.()>0&&process.getuid()===process.geteuid?.()&&process.getgid?.()===process.getegid?.()&&
 env.GITHUB_ACTIONS==='true'&&env.GITHUB_REPOSITORY==='msiric/redue'&&env.RUNNER_OS==='macOS'&&
 env.GITHUB_REF==='refs/heads/dev/portable-ordinary-boundary'&&env.GITHUB_RUN_ATTEMPT==='1'&&
 /^[1-9][0-9]{0,15}$/.test(env.GITHUB_RUN_ID||'')&&/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'');
}
const fail=code=>{throw Object.assign(Error(code),{code});};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function main(){
 const started=performance.now(),report={schema:1,scope:'CI_RAW_QUERY_PROVIDER_MECHANICS',models_launched:0,compiler_executions:0,
  source:process.env.GITHUB_SHA,result:'UNKNOWN',phases:[],scope_ids_only:true,agent_permissions_changed:false};
 let base,authority,observer,cleanup=false,expired=false,reapKnown=true;const owned=[];
 const deadline=setTimeout(()=>{expired=true;void observer?.abort();},90000);
 try{
  if(!ancestorStreamPrerequisites())fail('HOST_PROFILE_UNSUPPORTED');
  if(sha(fs.readFileSync(fs.realpathSync(process.execPath)))!==reviewedNodeDigest)fail('NODE_IMPLEMENTATION_UNSUPPORTED');
  report.profile={node:process.version,os:os.release(),architecture:process.arch,runnerImage:/^[0-9][A-Za-z0-9._-]{0,63}$/.test(process.env.ImageVersion||'')?process.env.ImageVersion:'UNKNOWN'};
  const temp=fs.realpathSync(process.env.RUNNER_TEMP);base=fs.mkdtempSync(path.join(temp,'redue-raw-stream-'));fs.chmodSync(base,0o700);
  const root=path.join(base,'project'),state=path.join(base,'state'),src=path.join(root,'src');
  fs.mkdirSync(src,{recursive:true,mode:0o700});fs.mkdirSync(state,{mode:0o700});
  report.profile.filesystem_type=fs.statfsSync(root).type;
  const authorityParent=path.join(os.homedir(),'Library','REDUE-Observer-Authority');
  if(!fs.existsSync(authorityParent))fs.mkdirSync(authorityParent,{mode:0o700});
  const parentStat=fs.lstatSync(authorityParent);if(parentStat.isSymbolicLink()||!parentStat.isDirectory()||parentStat.uid!==process.getuid()||(parentStat.mode&0o077)!==0)fail('AUTHORITY_PARENT_UNSAFE');
  authority=path.join(authorityParent,process.env.GITHUB_RUN_ID);fs.mkdirSync(authority,{mode:0o700});owned.push(authority);
  const file=path.join(authority,'scope.json'),r=fs.statSync(root,{bigint:true}),s=fs.statSync(state,{bigint:true});
  fs.writeFileSync(file,JSON.stringify({schema:1,interpretation:'redue-ci-ancestor-observation@1',repository:'msiric/redue',
   ref:process.env.GITHUB_REF,source:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:1,root,state,
   rootIdentity:[String(r.dev),String(r.ino)],stateIdentity:[String(s.dev),String(s.ino)],
   scope:'locally-derived-ancestor-npm-resolution-only',retention:'scope-ids-and-serials-only'}),{flag:'wx',mode:0o600});
  const candidate=path.join(base,'node_modules/@typescript/lib-es2022/index.d.ts');
  const queries=[['entries',src,[]],['fileExists',candidate,false]];
  const capability=readAncestorObservationCapability(file,{root,state});
  let gaps=0,changes=0;reapKnown=false;observer=await openRawQueryObserver(capability,queries,{onGap:()=>gaps++,onChange:()=>changes++});
  let boundary=await observer.barrier();report.phases.push({name:'START',healthy:boundary.healthy,serial:boundary.serial});
  // Fixed attempts, no success-driven retries. FileEvents may coalesce individual
  // writes, but a complete raw provider must still expose the changed interval.
  const membership=path.join(src,'transient.ts');fs.writeFileSync(membership,'export {};',{flag:'wx',mode:0o600});fs.unlinkSync(membership);
  let next=await observer.barrier();report.phases.push({name:'MEMBERSHIP_CHANGE_AND_RESTORE',healthy:next.healthy,changed:next.serial>boundary.serial});
  if(!next.healthy||next.serial<=boundary.serial)fail('MEMBERSHIP_INTERVAL_NOT_OBSERVED');boundary=next;
  fs.mkdirSync(path.dirname(candidate),{recursive:true,mode:0o700});fs.writeFileSync(candidate,'interface OwnedSynthetic {}',{flag:'wx',mode:0o600});
  fs.rmSync(path.join(base,'node_modules'),{recursive:true});
  next=await observer.barrier();report.phases.push({name:'ANCESTOR_CHANGE_AND_RESTORE',healthy:next.healthy,changed:next.serial>boundary.serial});
  if(!next.healthy||next.serial<=boundary.serial)fail('ANCESTOR_INTERVAL_NOT_OBSERVED');boundary=next;
  const originalBytes=fs.readFileSync(file);fs.writeFileSync(file,Buffer.concat([originalBytes,Buffer.from('\n')]));
  let refused=false;try{await observer.barrier();}catch{refused=true;}
  report.phases.push({name:'PROVISIONING_MUTATION',refused});if(!refused)fail('PROVISIONING_REPLACEMENT_NOT_REFUSED');
  const closed=await observer.close();reapKnown=closed.reaped;observer=null;report.close={code:closed.code,signal:closed.signal,reaped:closed.reaped,clean:closed.clean};
  if(closed.clean||gaps!==1)fail('INVALIDATED_STREAM_BECAME_CLEAN');
  report.raw_change_rows=changes;report.gaps=gaps;report.result='PASS';report.reason_code='FIXED_PROVIDER_CASES_OBSERVED';
 }catch(error){if(error.observerReaped===true)reapKnown=true;
  const codes=['HOST_PROFILE_UNSUPPORTED','NODE_IMPLEMENTATION_UNSUPPORTED','AUTHORITY_PARENT_UNSAFE','MEMBERSHIP_INTERVAL_NOT_OBSERVED','ANCESTOR_INTERVAL_NOT_OBSERVED','PROVISIONING_REPLACEMENT_NOT_REFUSED','INVALIDATED_STREAM_BECAME_CLEAN','PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'];
  report.reason_code=codes.includes(error?.code)?error.code:'PROVIDER_TRIAL_UNAVAILABLE';
  if(['MEMBERSHIP_INTERVAL_NOT_OBSERVED','ANCESTOR_INTERVAL_NOT_OBSERVED','PROVISIONING_REPLACEMENT_NOT_REFUSED','INVALIDATED_STREAM_BECAME_CLEAN'].includes(report.reason_code))report.result='FAIL';
 }
 finally{
  if(observer){try{report.close=await observer.close();reapKnown=report.close.reaped;}catch{report.cleanup_reason='CLOSE_UNAVAILABLE';}}
  if(reapKnown){for(const file of owned.reverse())fs.rmSync(file,{recursive:true,force:true});
   if(base)fs.rmSync(base,{recursive:true,force:true});cleanup=true;
  }else{report.cleanup_reason='OWNED_CHILD_REAP_UNKNOWN';if(report.result==='PASS')report.result='UNKNOWN';}
  clearTimeout(deadline);
 }
 if(expired){report.deadline_exceeded=true;if(report.result!=='FAIL'){report.result='UNKNOWN';report.reason_code='PARENT_DEADLINE';}}
 report.owned_files_cleanup=cleanup;report.elapsed_ms=Math.round((performance.now()-started)*1000)/1000;
 console.log(JSON.stringify(report));if(report.result!=='PASS')process.exitCode=1;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
