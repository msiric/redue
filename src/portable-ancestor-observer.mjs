// CI-only supplementary raw compiler-query observation. It cannot mint PASS,
// replace local indexing, trust imported paths, or repair an incomplete origin.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {spawn} from 'node:child_process';import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ancestorObservationResources,ancestorObservationCapabilityCurrent} from './portable-ancestor-capability.mjs';
import {derivePortableRawQueryScopes} from './portable-ancestor-queries.mjs';
import {ancestorInitialization,AncestorProtocol} from './portable-ancestor-protocol.mjs';
import {directEnvironmentIssue} from './direct-typescript.mjs';
import {portableRuntimeSupported} from './portable-runtime.mjs';
const helper=fileURLToPath(new URL('./portable-ancestor-fsevents-darwin-arm64',import.meta.url));
const helperSha='39cc3829f4fe640ad35baf87794e2e98d4812ee8afd3193f94dad5a11aa66389';
const fail=()=>{throw Object.assign(Error('PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'),{code:'PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'});};
function helperParents(){
 const rows=[];let current=path.dirname(helper);
 while(true){const s=fs.lstatSync(current,{bigint:true});
  const sticky=s.uid===0n&&(s.mode&0o1000n)!==0n;
  if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==0n&&s.uid!==BigInt(process.getuid())||(s.mode&0o022n)!==0n&&!sticky)fail();
  rows.push([current,...['dev','ino','uid','mode'].map(k=>String(s[k]))]);
  if(path.dirname(current)===current)break;current=path.dirname(current);
 }return JSON.stringify(rows);
}
function verifiedHelper(){
 let fd;try{
  const parents=helperParents();
  const before=fs.lstatSync(helper,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.uid!==0n&&before.uid!==BigInt(process.getuid())||before.nlink!==1n||(before.mode&0o022n)!==0n||(before.mode&0o6000n)!==0n||(before.mode&0o111n)===0n||before.size!==80984n||fs.realpathSync(helper)!==helper)fail();
  fd=fs.openSync(helper,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  const same=s=>['dev','ino','uid','mode','size','mtimeNs','ctimeNs','nlink'].every(k=>s[k]===before[k]);
  if(!same(fs.fstatSync(fd,{bigint:true})))fail();
  const bytes=Buffer.alloc(80984);let offset=0;
  while(offset<bytes.length){const count=fs.readSync(fd,bytes,offset,bytes.length-offset,offset);if(!count)fail();offset+=count;}
  if(createHash('sha256').update(bytes).digest('hex')!==helperSha||!same(fs.fstatSync(fd,{bigint:true}))||!same(fs.lstatSync(helper,{bigint:true}))||helperParents()!==parents)fail();
  return {stat:before,parents};
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
export async function openRawQueryObserver(capability,queries,{onChange=()=>{},onGap=()=>{}}={}){
 if(!portableRuntimeSupported()||process.getuid?.()===0||process.getuid?.()!==process.geteuid?.()||process.getgid?.()!==process.getegid?.())fail();
 const resources=ancestorObservationResources(capability);
 // The labels are not authority: the private minted token, protected exact
 // provisioning path, reviewed workflow and native parent deny-write are needed.
 const protectedFile=path.join(os.homedir(),'Library','REDUE-Observer-Authority',process.env.GITHUB_RUN_ID||'invalid','scope.json');
 if(process.env.GITHUB_ACTIONS!=='true'||resources.file!==protectedFile||directEnvironmentIssue())fail();
 const helperIdentity=verifiedHelper(),derived=derivePortableRawQueryScopes(resources.root,queries),input=ancestorInitialization(derived.scopes);
 const helperCurrent=()=>{try{const now=verifiedHelper();return now.parents===helperIdentity.parents&&['dev','ino','uid','mode','size','mtimeNs','ctimeNs','nlink'].every(k=>now.stat[k]===helperIdentity.stat[k]);}catch{return false;}};
 if(!ancestorObservationCapabilityCurrent(capability)||!helperCurrent())fail();
 const protocol=new AncestorProtocol(derived.scopes.length),generation=randomUUID();
 const child=spawn(helper,[],{cwd:resources.state,env:process.env,stdio:['pipe','pipe','ignore']});
 let pending=null,sequence=0,buffer='',bytes=0,rows=0,failed=false,closing=false,exit=null;
 const done=new Promise(resolve=>child.once('close',(code,signal)=>{exit={code,signal};resolve(exit);if(!protocol.closed||buffer!=='')gap();}));
 function gap(){
  if(failed)return;failed=true;protocol.uncertain=true;
  if(pending){clearTimeout(pending.timer);pending.reject(Object.assign(Error('PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'),{code:'PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'}));pending=null;}
  child.kill('SIGKILL');try{onGap();}catch{}
 }
 child.once('error',gap);child.stdin.on('error',gap);
 child.stdout.on('data',chunk=>{
  bytes+=chunk.length;if(bytes>4*1024*1024){gap();return;}buffer+=chunk.toString('utf8');
  if(Buffer.byteLength(buffer)>128*1024){gap();return;}
  while(buffer.includes('\n')){
   const at=buffer.indexOf('\n'),line=buffer.slice(0,at);buffer=buffer.slice(at+1);
   if(++rows>32768){gap();return;}
   try{
    const value=protocol.accept(line,{request:pending?.request??null,closing});
    if(value.type==='uncertainty'){gap();return;}
    if(value.type==='occurrence'){onChange(value.scopeIds);continue;}
    if(!pending||value.type!==pending.type)throw Error('protocol');
    clearTimeout(pending.timer);const current=pending;pending=null;current.resolve();
   }catch{gap();return;}
  }
 });
 const wait=(type,request)=>new Promise((resolve,reject)=>{
  if(failed||pending){reject(Object.assign(Error('PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'),{code:'PORTABLE_ANCESTOR_OBSERVATION_UNAVAILABLE'}));return;}
  pending={type,request,resolve,reject,timer:setTimeout(gap,5000)};
 });
 const reap=async()=>{
  let timer;try{return await Promise.race([done,new Promise(resolve=>{timer=setTimeout(()=>{child.kill('SIGKILL');resolve(null);},5000);})]);}
  finally{clearTimeout(timer);}
 };
 const ready=wait('ready',null);child.stdin.write(input);
 try{await ready;if(failed||protocol.uncertain||!ancestorObservationCapabilityCurrent(capability)||!helperCurrent())fail();}catch(error){gap();const outcome=await reap();throw Object.assign(error,{observerReaped:outcome!==null});}
 async function barrier(){
  if(failed||closing||!ancestorObservationCapabilityCurrent(capability)||!helperCurrent()){gap();fail();}
  const request=++sequence,promise=wait('barrier',request);child.stdin.write('barrier '+request+'\n');await promise;
  if(!ancestorObservationCapabilityCurrent(capability)||!helperCurrent()){gap();fail();}
  return Object.freeze({schema:1,interpretation:'redue-raw-query-interval@1',generation,
   scopeDigest:derived.scopeDigest,serial:protocol.serial,healthy:!failed&&!protocol.uncertain});
 }
 async function close(){
  if(!failed&&!protocol.closed){closing=true;const request=++sequence,promise=wait('closed',request);child.stdin.write('close '+request+'\n');
   try{await promise;}catch{gap();}}
  child.stdin.end();await reap();
  return {code:exit?.code??null,signal:exit?.signal??null,reaped:exit!==null,clean:protocol.closed&&!failed&&!protocol.uncertain&&buffer===''&&exit?.code===0&&exit.signal===null&&ancestorObservationCapabilityCurrent(capability)&&helperCurrent()};
 }
 const abort=async()=>{gap();return await reap();};
 return Object.freeze({derived,generation,barrier,close,abort});
}
