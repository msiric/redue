// Test-only, single native diagnostic. No process, filesystem probe or model at import.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {renderNativeDiagnosticAssets,sha} from './portable-native-diagnostic-assets.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './portable-claude-invocation.mjs';
export const LIMITS=Object.freeze({turns:4,totalMs:120000,cleanupMs:5000,lineBytes:65536,streamBytes:2*1024*1024});
export const NODE_SHA='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const NAMES=['custom_env_sentinel_absent','synthetic_protected_read_denied','synthetic_outside_write_denied','one_synthetic_socket_allowed','other_synthetic_socket_denied','owned_direct_loopback_denied'];
const EXPECTED=['ABSENT','DENIED_PERMISSION_ERROR','DENIED_PERMISSION_ERROR','EXPECTED_RESPONSE','DENIED_PERMISSION_ERROR','DENIED_PERMISSION_ERROR'];
const CODES=new Set(['ABSENT','PRESENT','ACCESS_SUCCEEDED','DENIED_PERMISSION_ERROR','UNKNOWN_OR_UNAVAILABLE','EXPECTED_RESPONSE','UNEXPECTED_RESPONSE']);
const SIGNALS=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGIOT','SIGBUS','SIGFPE','SIGKILL','SIGUSR1','SIGSEGV','SIGUSR2','SIGPIPE','SIGALRM','SIGTERM','SIGCHLD','SIGCONT','SIGSTOP','SIGTSTP','SIGTTIN','SIGTTOU','SIGURG','SIGXCPU','SIGXFSZ','SIGVTALRM','SIGPROF','SIGWINCH','SIGIO','SIGINFO','SIGSYS']);
let readDeadline=Infinity;
const checkDeadline=()=>{if(Date.now()>=readDeadline)fail('DIAGNOSTIC_JOB_DEADLINE');};
const fail=code=>{throw Object.assign(Error('Native diagnostic prerequisite unavailable'),{code});};
const quote=s=>`'${s.replaceAll("'","'\\''")}'`;
export function sanitizeCollection(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.scope!=='CHECKER_COLLECTION_ONLY'||typeof value.timed_out!=='boolean'||
  !['SUPERVISOR_CHILD_CLOSE_EVENT','CHILD_CLOSE_NOT_OBSERVED'].includes(value.exit_observation)||
  !(value.checker_exit_code===null||Number.isInteger(value.checker_exit_code)&&value.checker_exit_code>=0&&value.checker_exit_code<=255)||
  !(value.checker_signal===null||SIGNALS.has(value.checker_signal))||value.checker_exit_code!==null&&value.checker_signal!==null)return null;
 let checks=null;if(value.checks!==null){const c=value.checks;
  if(!c||typeof c.checks_passed!=='boolean'||!Array.isArray(c.checks)||c.checks.length!==6)return null;
  const rows=[];for(let i=0;i<6;i++){const row=c.checks[i];if(!row||row.name!==NAMES[i]||typeof row.passed!=='boolean'||!CODES.has(row.reason_code)||row.passed!==(row.reason_code===EXPECTED[i]))return null;rows.push({name:NAMES[i],passed:row.passed,reason_code:row.reason_code});}
  if(c.checks_passed!==rows.every(r=>r.passed))return null;checks={checks_passed:c.checks_passed,checks:rows};
 }
 const observed=value.exit_observation==='SUPERVISOR_CHILD_CLOSE_EVENT';
 return {scope:value.scope,checks,assertion_outcome:checks?(checks.checks_passed?'PASS':'FAIL'):'UNKNOWN',
  process_outcome:observed?(value.checker_exit_code===0?'EXIT_ZERO':value.checker_exit_code!==null?'EXIT_NONZERO':value.checker_signal!==null?'SIGNALLED':'UNKNOWN'):'UNKNOWN',
  checker_exit_code:value.checker_exit_code,checker_signal:value.checker_signal,exit_observation:value.exit_observation,timed_out:value.timed_out};
}
function collectionFromText(content){
 const pieces=typeof content==='string'?[content]:Array.isArray(content)&&content.every(p=>p?.type==='text'&&typeof p.text==='string')?content.map(p=>p.text):null;
 if(!pieces)return null;const candidates=[];
 for(const piece of pieces){if(Buffer.byteLength(piece)>LIMITS.lineBytes)return null;for(const line of piece.split(/\r?\n/))try{const v=JSON.parse(line);if(v?.scope==='CHECKER_COLLECTION_ONLY')candidates.push(sanitizeCollection(v));}catch{}}
 return candidates.length===1?candidates[0]:null;
}
export function createNativeDiagnosticTrace({command,cwd}){
 let init=false,error=null,tool=null,result=null,final=null;const assistantIDs=new Set();
 const reject=code=>{error??=code;};
 const consume=value=>{
  if(!value||typeof value!=='object'||Array.isArray(value)){reject('NATIVE_STREAM_MALFORMED');return;}
  if(value.type==='system'&&value.subtype==='init'){
   if(init||value.claude_code_version!==REVIEWED_CLAUDE_NATIVE.version||value.cwd!==cwd||value.apiKeySource!=='none'||value.permissionMode!=='dontAsk'||
     JSON.stringify(value.tools)!==JSON.stringify(['Bash'])||!Array.isArray(value.mcp_servers)||value.mcp_servers.length||!Array.isArray(value.plugins)||value.plugins.length){reject('NATIVE_INITIAL_CONTEXT');return;}init=true;return;
  }
  if(value.type==='assistant'){
   if(!init||value.parent_tool_use_id!==null||!value.message||value.message.role!=='assistant'||typeof value.message.id!=='string'||!Array.isArray(value.message.content)){reject('NATIVE_ASSISTANT_CONTEXT');return;}
   assistantIDs.add(value.message.id);if(assistantIDs.size>4){reject('NATIVE_TURN_LIMIT');return;}
   for(const item of value.message.content)if(item?.type==='tool_use'){
    const input=item.input;
    if(tool||item.name!=='Bash'||!/^toolu_[A-Za-z0-9]{6,100}$/.test(item.id??'')||!input||typeof input!=='object'||Array.isArray(input)||input.command!==command||
      Object.keys(input).some(k=>!['command','timeout','description'].includes(k))||
      Object.hasOwn(input,'timeout')&&(!Number.isInteger(input.timeout)||input.timeout<1||input.timeout>15000)){reject('NATIVE_TOOL_SCOPE');return;}
    tool={id:item.id,command_sha256:sha(command)};
   }return;
  }
  if(value.type==='user'){
   if(value.parent_tool_use_id!==null||value.message?.role!=='user'||!Array.isArray(value.message.content)){reject('NATIVE_RESULT_CONTEXT');return;}
   for(const item of value.message.content)if(item?.type==='tool_result'){
    if(!tool||result||item.tool_use_id!==tool.id||item.is_error!==undefined&&typeof item.is_error!=='boolean'){reject('NATIVE_RESULT_ID');return;}
    const collection=collectionFromText(item.content);if(!collection){reject('NATIVE_CHECKER_RESULT_MISSING');return;}
    result={id:item.tool_use_id,is_error:item.is_error===true,collection};
   }return;
  }
  if(value.type==='result'){
   if(final||!Number.isInteger(value.num_turns)||value.num_turns<1||value.num_turns>4||typeof value.is_error!=='boolean'){reject('NATIVE_FINAL_RESULT');return;}
   final={turns:value.num_turns,success:value.subtype==='success'&&value.is_error===false};return;
  }
  // Never publish model text, auth/init payloads, error strings or unknown events.
  if(!['system','rate_limit_event'].includes(value.type))reject('NATIVE_STREAM_UNKNOWN');
 };
 return {consume,snapshot:()=>({init,error,assistant_turns:assistantIDs.size,tool,result,final})};
}
export function diagnosticOutcome(trace,{nativeExit=null,nativeSignal=null,timedOut=false,controlsBefore=false,controlsAfter=false,sourceCurrent=false,probeDelta=null,collectionMatches=false,reaped=false,cleanupComplete=false}={}){
 const assertion=trace.result?.collection?.assertion_outcome??'UNKNOWN';
 const c=trace.result?.collection;const complete=!trace.error&&trace.init&&trace.tool&&trace.result&&trace.final?.success&&nativeExit===0&&nativeSignal===null&&!timedOut&&
  controlsBefore===true&&controlsAfter===true&&sourceCurrent===true&&JSON.stringify(probeDelta)==='[1,0,0]'&&collectionMatches===true&&reaped===true&&cleanupComplete===true;
 return {collection_status:complete&&c?.exit_observation==='SUPERVISOR_CHILD_CLOSE_EVENT'&&!c.timed_out&&c.checker_exit_code!==null&&c.checker_signal===null?
   c.checker_exit_code===0&&assertion==='PASS'&&!trace.result.is_error?'PASS':'FAIL':'UNKNOWN',assertion_outcome:assertion,
  process_outcome:c?.process_outcome??'UNKNOWN',checker_exit_code:c?.checker_exit_code??null,checker_signal:c?.checker_signal??null,
  native_exit_code:nativeExit,native_signal:nativeSignal,reason_code:trace.error??(!complete?'DIAGNOSTIC_CONTEXT_INCOMPLETE':'CHECKER_COLLECTION_COMPLETE')};
}
// Lexical mock seam only: the entrypoint cannot accept an alternate executable,
// prompt, command or permission policy. No raw stdout/stderr is returned.
export function collectNativeDiagnostic(create,{command,cwd,timeoutMs=115000,cleanupMs=5000,signal}={}) {
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>115000||!Number.isInteger(cleanupMs)||cleanupMs<1||cleanupMs>5000)fail('DIAGNOSTIC_LIMIT');
 return new Promise(resolve=>{
  const trace=createNativeDiagnosticTrace({command,cwd});let child,pending=Buffer.alloc(0),total=0,done=false,timedOut=false,ioError=null,reaped=false,killTimer,spawnObserved=false;
  const started=performance.now();
  const stop=()=>{if(child&&child.exitCode===null&&child.signalCode===null){try{child.kill('SIGTERM');}catch{}
    if(!killTimer)killTimer=setTimeout(()=>{if(!done&&child.exitCode===null&&child.signalCode===null)try{child.kill('SIGKILL');}catch{}},Math.min(500,cleanupMs));}};
  const finish=(exit,signal,observed=false)=>{
   if(done)return;done=true;signal?.removeEventListener('abort',cancel);clearTimeout(deadline);clearTimeout(killTimer);clearTimeout(lastWait);
   if(pending.length)ioError??='NATIVE_STREAM_INCOMPLETE';const snapshot=trace.snapshot();snapshot.error??=ioError;
   resolve({trace:snapshot,native_exit_code:Number.isInteger(exit)?exit:null,native_signal:SIGNALS.has(signal)?signal:null,
    native_process_spawn_observed:spawnObserved,native_exit_observed:observed,owned_native_reaped:reaped,timed_out:timedOut,milliseconds:performance.now()-started,
    stdout_bytes:total,raw_stdout_retained:false,raw_stderr_retained:false});
  };
  const cancel=()=>{ioError??='NATIVE_CANCELLED';stop();};
  const deadline=setTimeout(()=>{timedOut=true;stop();},timeoutMs);
  const lastWait=setTimeout(()=>finish(null,null),timeoutMs+cleanupMs);
  if(signal?.aborted){ioError='NATIVE_CANCELLED';finish(null,null);return;}signal?.addEventListener('abort',cancel,{once:true});
  try {
   child=create();child.on('spawn',()=>{spawnObserved=true;});child.stdout.on('data',chunk=>{
    if(done)return;if(!Buffer.isBuffer(chunk))chunk=Buffer.from(chunk);
    total+=chunk.length;if(total>LIMITS.streamBytes||chunk.length>LIMITS.lineBytes-pending.length){ioError??='NATIVE_STREAM_LIMIT';stop();return;}
    pending=Buffer.concat([pending,chunk]);let newline;
    while((newline=pending.indexOf(10))!==-1){const line=pending.subarray(0,newline);pending=pending.subarray(newline+1);
     try{trace.consume(JSON.parse(line.toString('utf8')));}catch{ioError??='NATIVE_STREAM_MALFORMED';}
     if(ioError||trace.snapshot().error){stop();return;}
    }
   });
   let stderrBytes=0;child.stderr.on('data',b=>{stderrBytes+=b.length;if(stderrBytes>LIMITS.streamBytes){ioError??='NATIVE_STDERR_LIMIT';stop();}});child.on('error',()=>{ioError??='NATIVE_START_FAILURE';finish(null,null);});
   child.on('close',(exit,signal)=>{reaped=true;finish(exit,signal,true);});
  }catch{ioError??='NATIVE_START_FAILURE';finish(null,null);}
 });
}
export function buildDiagnosticSettings({base,node,native}){
 const assets=renderNativeDiagnosticAssets({base,node}),settingsFile=path.join(assets.host,'settings.json'),command=`${quote(node)} ${quote(assets.collector)}`;
 return {assets,command,settingsFile,settings:{disableAllHooks:true,enabledPlugins:{},permissions:{allow:[`Bash(${command})`],deny:['Agent','Task','Read','Edit','Write','Glob','Grep','WebFetch','WebSearch','LSP','Skill']},
  sandbox:{enabled:true,failIfUnavailable:true,allowUnsandboxedCommands:false,autoAllowBashIfSandboxed:false,excludedCommands:[],
   filesystem:{allowWrite:[],denyRead:[assets.host,'~/Library/Keychains','~/.ssh','~/.aws','~/.npmrc','~/.claude','~/.config','~/.git-credentials'],denyWrite:[base,node,path.dirname(node),native,path.dirname(native),'~/Library/Keychains']},
   network:{allowedDomains:[],deniedDomains:['*'],strictAllowlist:true,allowUnixSockets:[assets.socket],allowAllUnixSockets:false,allowLocalBinding:false},
   credentials:{envVars:['REDUE_PREFLIGHT_SENTINEL','CLAUDE_CODE_OAUTH_TOKEN','ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','GITHUB_TOKEN','GH_TOKEN','NPM_TOKEN','ACTIONS_RUNTIME_TOKEN','ACTIONS_ID_TOKEN_REQUEST_TOKEN'].map(name=>({name,mode:'deny'}))}}}};
}
export const FORBIDDEN_ENV=Object.freeze(['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL','ANTHROPIC_CUSTOM_HEADERS','ANTHROPIC_PROFILE','CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR','CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR','CLAUDE_BG_AUTH_SNAPSHOT_PATH','BASH_ENV','ENV','NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH']);
export function nativeDiagnosticEnvironment(env,{host}){
 if(FORBIDDEN_ENV.some(k=>Object.hasOwn(env,k))||Object.keys(env).some(k=>k.startsWith('DYLD_')||k.startsWith('OPENSSL_')||k.startsWith('CLAUDE_')&&k!=='CLAUDE_CODE_OAUTH_TOKEN'))fail('DIAGNOSTIC_AUTH_OR_RUNTIME_OVERRIDE');
 if(typeof env.CLAUDE_CODE_OAUTH_TOKEN!=='string'||!env.CLAUDE_CODE_OAUTH_TOKEN)fail('DIAGNOSTIC_OAUTH_MISSING');
 const out={};for(const key of ['HOME','USER','LOGNAME','TMPDIR','PATH','SHELL','LANG','LC_ALL','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy'])if(Object.hasOwn(env,key))out[key]=env[key];
 return {...out,CLAUDE_CONFIG_DIR:path.join(host,'claude-config'),GH_CONFIG_DIR:path.join(host,'gh-config'),DISABLE_UPDATES:'1',CLAUDE_CODE_OAUTH_TOKEN:env.CLAUDE_CODE_OAUTH_TOKEN,REDUE_PREFLIGHT_SENTINEL:'nonsecret-boundary-sentinel'};
}
export function nativeDiagnosticArgv({settingsFile,command}){
 return ['--print','--verbose','--output-format','stream-json','--max-turns','4','--permission-mode','dontAsk','--tools','Bash','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--settings',settingsFile,'--no-session-persistence',
  `Run this fixed diagnostic command exactly once with the Bash tool, with timeout at most 15000 milliseconds: ${command}\nDo not execute another command, run in background, retry, delegate or inspect credentials. Report its result only. If unavailable, stop.`];
}
const PING='REDUE_SENTINEL_PING\n',PONG='REDUE_SENTINEL_OK\n';
export async function openOwnedDiagnosticFixture(plan){
 const {assets}=plan,attempt=randomUUID(),servers=[],connections=new Set(),counts=[0,0,0];let acceptedConnections=0;let started=null,collected=null,error=null;
 const latch=code=>{error??=code;};
 const socketFiles=[];
 const listen=(target,index)=>new Promise((resolve,reject)=>{
  const server=net.createServer(socket=>{if(++acceptedConnections>32||connections.size>=8){latch('COLLECTOR_CONNECTION_LIMIT');socket.destroy();return;}connections.add(socket);let bytes=Buffer.alloc(0),reporter=false,finished=false;
   let timer=setTimeout(()=>{if(!finished)latch('COLLECTOR_CONNECTION_DEADLINE');socket.destroy();},1000);
   socket.on('error',()=>latch('COLLECTOR_CONNECTION_ERROR'));socket.on('close',()=>{clearTimeout(timer);connections.delete(socket);});
   socket.on('data',chunk=>{
    if(finished)return;if(chunk.length>16384-bytes.length){latch('COLLECTOR_INPUT_LIMIT');socket.destroy();return;}bytes=Buffer.concat([bytes,chunk]);
    const newline=bytes.indexOf(10);if(newline<0)return;const line=bytes.subarray(0,newline).toString('utf8'),remaining=bytes.subarray(newline+1);
    if(!reporter&&line+'\n'===PING){if(remaining.length){latch('COLLECTOR_PROTOCOL');socket.destroy();return;}counts[index]++;finished=true;socket.end(PONG);return;}
    if(!reporter&&index===0&&line==='REDUE_COLLECT_START_V1'){
     if(started!==null||remaining.length){latch('COLLECTOR_DUPLICATE_START');socket.destroy();return;}
     started=performance.now();reporter=true;bytes=Buffer.alloc(0);clearTimeout(timer);timer=setTimeout(()=>{latch('CHECKER_COLLECTION_DEADLINE');socket.destroy();},15000);
     socket.write(JSON.stringify({ack:'REDUE_COLLECT_ACK_V1',attempt})+'\n');return;
    }
    if(reporter){
     try{const value=JSON.parse(line);if(value.schema!==1||value.attempt!==attempt||collected!==null||remaining.length||error)throw Error();
      const parsed=sanitizeCollection({...value,scope:'CHECKER_COLLECTION_ONLY'});if(!parsed||performance.now()-started>15000)throw Error();collected=parsed;
     }catch{latch('COLLECTOR_REPORT_UNKNOWN');}finished=true;socket.end();return;
    }
    latch('COLLECTOR_PROTOCOL');socket.destroy();
   });
   socket.on('end',()=>{if(!finished)latch('COLLECTOR_EOF');});
  });
  server.once('error',()=>reject(Object.assign(Error('Owned listener unavailable'),{code:'DIAGNOSTIC_LISTENER_UNAVAILABLE'})));
  server.listen(target,()=>{servers.push(server);if(typeof target==='string'){const st=fs.lstatSync(target);socketFiles.push({file:target,dev:st.dev,ino:st.ino});}resolve();});
 });
 try{await listen(path.join(assets.host,'a.sock'),0);await listen(path.join(assets.host,'d.sock'),1);await listen({host:'127.0.0.1',port:38187},2);}
 catch(e){for(const c of connections)c.destroy();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));throw e;}
 const ping=target=>new Promise((resolve,reject)=>{
  const socket=net.createConnection(target);let bytes=Buffer.alloc(0),done=false;const timer=setTimeout(()=>finish(false),1000);
  const finish=pass=>{if(done)return;done=true;clearTimeout(timer);socket.destroy();pass?resolve():reject(Object.assign(Error('Required owned positive control unavailable'),{code:'DIAGNOSTIC_CONTROL_UNAVAILABLE'}));};
  socket.on('error',()=>finish(false));socket.on('connect',()=>socket.write(PING));socket.on('data',chunk=>{if(done)return;if(chunk.length>64-bytes.length){finish(false);return;}bytes=Buffer.concat([bytes,chunk]);if(bytes.equals(Buffer.from(PONG)))finish(true);else if(bytes.length>=Buffer.byteLength(PONG))finish(false);});socket.on('end',()=>finish(false));
 });
 const controls=async()=>{checkDeadline();
  const file=path.join(assets.host,'native-sentinel-resources/protected/read-canary.txt');
  if(sha(readOwned(file,128).bytes)!==sha('nonsecret-native-boundary-canary\n'))fail('DIAGNOSTIC_CANARY_CHANGED');
  const outside=path.join(assets.host,'native-sentinel-resources/outside'),control=path.join(outside,'control.tmp');
  const st=putExclusive(control,Buffer.from('nonsecret-write-control'));if(!sameFile(control,st))fail('DIAGNOSTIC_CONTROL_CHANGED');fs.unlinkSync(control);
  await ping({path:path.join(assets.host,'a.sock')});checkDeadline();await ping({path:path.join(assets.host,'d.sock')});checkDeadline();await ping({host:'127.0.0.1',port:38187});checkDeadline();
  return true;
 };
 return {controls,snapshot:()=>({counts:[...counts],collected,error,collector_start_acknowledged:started!==null}),
  close:async()=>{for(const socket of connections)socket.destroy();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
   for(const row of socketFiles)try{const st=fs.lstatSync(row.file);if(!st.isSocket()||st.dev!==row.dev||st.ino!==row.ino)fail('DIAGNOSTIC_CLEANUP_UNKNOWN');fs.unlinkSync(row.file);}catch(e){if(e.code!=='ENOENT')throw e;}
   const write=path.join(assets.host,'native-sentinel-resources/outside/write-canary.txt');
   // An unexpected successful synthetic write is retained as a failed assertion.
   // It is not silently deleted or called clean; this is a disposable runner base.
   try{fs.lstatSync(write);return false;}catch(e){if(e.code!=='ENOENT')throw e;}return true;}};
}
function fingerprint(s){return ['dev','ino','mode','uid','nlink','size','mtimeMs','ctimeMs'].map(k=>String(s[k])).join(':');}
function sameFile(file,expected){try{return fingerprint(fs.lstatSync(file))===expected;}catch{return false;}}
function safeParents(dir){
 if(fs.realpathSync(dir)!==dir)fail('DIAGNOSTIC_PATH');let current=dir;
 for(;;){const st=fs.lstatSync(current);if(!st.isDirectory()||st.isSymbolicLink()||st.uid!==process.getuid()&&st.uid!==0||(st.mode&0o022)!==0&&!(st.uid===0&&(st.mode&0o1000)!==0))fail('DIAGNOSTIC_PATH');const parent=path.dirname(current);if(parent===current)break;current=parent;}
}
function readOwned(file,limit){
 checkDeadline();safeParents(path.dirname(file));const a=fs.lstatSync(file);if(!a.isFile()||a.nlink!==1||a.uid!==process.getuid()&&a.uid!==0||a.size>limit||(a.mode&0o022)!==0)fail('DIAGNOSTIC_FILE');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);try{
  if(fingerprint(fs.fstatSync(fd))!==fingerprint(a))fail('DIAGNOSTIC_FILE_CHANGED');const hash=createHash('sha256'),parts=[];let n=0;
  for(;;){checkDeadline();const buf=Buffer.alloc(65536),count=fs.readSync(fd,buf,0,buf.length,null);if(!count)break;n+=count;if(n>limit)fail('DIAGNOSTIC_FILE_LIMIT');hash.update(buf.subarray(0,count));if(limit<=262144)parts.push(buf.subarray(0,count));}
  if(!sameFile(file,fingerprint(a))||fingerprint(fs.fstatSync(fd))!==fingerprint(a))fail('DIAGNOSTIC_FILE_CHANGED');
  return {digest:hash.digest('hex'),bytes:limit<=262144?Buffer.concat(parts):null,fingerprint:fingerprint(a)};
 }finally{fs.closeSync(fd);}
}
function putExclusive(file,bytes){
 checkDeadline();safeParents(path.dirname(file));const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
 try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);checkDeadline();const st=fs.fstatSync(fd);if(st.nlink!==1||!st.isFile()||!sameFile(file,fingerprint(st)))fail('DIAGNOSTIC_WRITE_CHANGED');return fingerprint(st);}finally{fs.closeSync(fd);}
}
export function prepareOwnedDiagnostic({base,native,source}){
 if(!/^[a-f0-9]{40}$/.test(source??'')||process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0')fail('DIAGNOSTIC_PROFILE');
 const node=fs.realpathSync(process.execPath);if(readOwned(node,128*1024*1024).digest!==NODE_SHA||readOwned(native,224*1024*1024).digest!==REVIEWED_CLAUDE_NATIVE.sha256)fail('DIAGNOSTIC_NATIVE_IDENTITY');
 safeParents(base);if(fs.readdirSync(base).length!==1||path.dirname(native)!==path.join(base,'native'))fail('DIAGNOSTIC_BASE');
 const plan=buildDiagnosticSettings({base,node,native});for(const dir of [plan.assets.code,plan.assets.host,path.join(plan.assets.host,'claude-config'),path.join(plan.assets.host,'gh-config'),path.join(plan.assets.host,'native-sentinel-resources'),path.join(plan.assets.host,'native-sentinel-resources/protected'),path.join(plan.assets.host,'native-sentinel-resources/outside')])fs.mkdirSync(dir,{mode:0o700});
 putExclusive(plan.assets.checker,plan.assets.checkerBytes);putExclusive(plan.assets.collector,plan.assets.collectorBytes);putExclusive(plan.settingsFile,Buffer.from(JSON.stringify(plan.settings)+'\n'));
 putExclusive(path.join(plan.assets.host,'native-sentinel-resources/protected/read-canary.txt'),Buffer.from('nonsecret-native-boundary-canary\n'));
 const files=[node,native,plan.assets.checker,plan.assets.collector,plan.settingsFile].map(file=>({file,...readOwned(file,file===native?224*1024*1024:file===node?128*1024*1024:262144)}));
 const manifest={schema:1,scope:'PREPARED_ONLY_NO_NATIVE_OR_MODEL',source,base,node,native,files:files.map(({file,digest,fingerprint})=>({file,digest,fingerprint}))};
 putExclusive(path.join(plan.assets.host,'manifest.json'),Buffer.from(JSON.stringify(manifest)+'\n'));return {plan,manifest};
}
export function selectedStartupSourcesAbsent({host,code}){
 const paths=['/Library/Application Support/ClaudeCode/managed-settings.json','/Library/Application Support/ClaudeCode/managed-settings.d','/Library/Managed Preferences/com.anthropic.claudecode.plist',
  `/Library/Managed Preferences/${os.userInfo().username}/com.anthropic.claudecode.plist`,path.join(host,'claude-config/remote-settings.json'),path.join(host,'claude-config/.credentials.json'),
  path.join(code,'.claude'),path.join(code,'.mcp.json'),path.join(code,'CLAUDE.md'),'/home/claude/.claude/remote/.api_key'];
 for(const file of paths)try{fs.lstatSync(file);fail('DIAGNOSTIC_STARTUP_SOURCE_PRESENT');}catch(e){if(e.code!=='ENOENT')throw e;}
 // These facts are metadata absence only, not a complete authenticated remote-policy proof.
 return true;
}
export function requireDiagnosticWorkflow(env,source){
 if(!/^[a-f0-9]{40}$/.test(source??'')||env.GITHUB_ACTIONS!=='true'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||env.GITHUB_REPOSITORY!=='msiric/redue'||
  env.GITHUB_RUN_ATTEMPT!=='1'||env.GITHUB_REF!=='refs/heads/dev/portable-claude-diagnostic'||env.GITHUB_ACTOR!=='msiric'||env.REDUE_CHECKED_SOURCE!==source||
  env.REDUE_CLAUDE_INCLUDED_DIAGNOSTIC_CAPACITY!=='4-turn-120s-included-only')fail('DIAGNOSTIC_WORKFLOW_OR_CAPACITY');
}
function currentManifest(manifest){
 for(const row of manifest.files){const actual=readOwned(row.file,row.file===manifest.native?224*1024*1024:row.file===manifest.node?128*1024*1024:262144);
  if(actual.digest!==row.digest||actual.fingerprint!==row.fingerprint)fail('DIAGNOSTIC_SOURCE_CHANGED');}
 safeParents(manifest.base);return true;
}
// Native execution is conditional on the exact owner statement and workflow gates.
// These authenticate operator intent in a pinned protected workflow, not policy truth.
async function executePreparedDiagnostic({plan,manifest,env,jobStartedMs,signal}){
 const remaining=()=>LIMITS.totalMs-(Date.now()-jobStartedMs),started=performance.now();
 if(!Number.isSafeInteger(jobStartedMs)||jobStartedMs>Date.now()||remaining()<=LIMITS.cleanupMs+1000)fail('DIAGNOSTIC_JOB_DEADLINE');
 readDeadline=jobStartedMs+LIMITS.totalMs;
 const nativeEnv=nativeDiagnosticEnvironment(env,{host:plan.assets.host});let fixture,observed,pre=false,post=false,sourceCurrent=false,reaped=false,cleanup=false,probeDelta=null,collectionMatches=false,error=null,before;
 try{
  if(signal?.aborted)fail('NATIVE_CANCELLED');currentManifest(manifest);selectedStartupSourcesAbsent(plan.assets,env);fixture=await openOwnedDiagnosticFixture(plan);pre=await fixture.controls();before=fixture.snapshot().counts;
  if(remaining()<=LIMITS.cleanupMs+1000)fail('DIAGNOSTIC_JOB_DEADLINE');
  observed=await collectNativeDiagnostic(()=>{
   const child=spawn(manifest.native,nativeDiagnosticArgv(plan),{cwd:plan.assets.code,env:nativeEnv,detached:true,stdio:['ignore','pipe','pipe']});
   child.kill=signal=>{if(child.exitCode!==null||child.signalCode!==null||!Number.isInteger(child.pid))return false;try{process.kill(-child.pid,signal);return true;}catch{return false;}};return child;
  },{command:plan.command,cwd:plan.assets.code,timeoutMs:Math.min(115000,Math.floor(remaining()-LIMITS.cleanupMs)),cleanupMs:Math.min(5000,Math.max(1,Math.floor(remaining()))),signal});
  reaped=observed.owned_native_reaped;const snap=fixture.snapshot();probeDelta=snap.counts.map((n,i)=>n-before[i]);
  collectionMatches=Boolean(snap.collected&&JSON.stringify(snap.collected)===JSON.stringify(observed.trace.result?.collection));
  error=snap.error;post=await fixture.controls();sourceCurrent=currentManifest(manifest);selectedStartupSourcesAbsent(plan.assets,env);
 }catch(e){error??=e.code??'DIAGNOSTIC_UNAVAILABLE';}
 finally{
  if(fixture)try{
   const budget=Math.max(0,Math.min(LIMITS.cleanupMs,remaining()));if(!budget)fail('DIAGNOSTIC_JOB_DEADLINE');let cleanupTimer;
   try{cleanup=await Promise.race([fixture.close(),new Promise((_,reject)=>{cleanupTimer=setTimeout(()=>reject(Object.assign(Error('Cleanup unavailable'),{code:'DIAGNOSTIC_CLEANUP_UNKNOWN'})),budget);})]);}finally{clearTimeout(cleanupTimer);}
   error??=fixture.snapshot().error;
  }catch{error??='DIAGNOSTIC_CLEANUP_UNKNOWN';}
 }
 const trace=observed?.trace??{error,init:false,assistant_turns:0,tool:null,result:null,final:null};trace.error??=error;
 const projected=diagnosticOutcome(trace,{nativeExit:observed?.native_exit_code??null,nativeSignal:observed?.native_signal??null,timedOut:observed?.timed_out??false,
  controlsBefore:pre,controlsAfter:post,sourceCurrent,probeDelta,collectionMatches,reaped,cleanupComplete:cleanup});
 const report={schema:1,scope:'NATIVE_PROGRAMMATIC_SYNTHETIC_DIAGNOSTIC_ONLY',...projected,source:manifest.source,native_version:REVIEWED_CLAUDE_NATIVE.version,native_sha256:REVIEWED_CLAUDE_NATIVE.sha256,
  controls_before:pre,controls_after:post,source_current:sourceCurrent,actual_probe_protocol_delta:probeDelta,collection_matches_tool_result:collectionMatches,
  native_launch_attempted:observed!==undefined,native_process_spawn_observed:observed?.native_process_spawn_observed??false,model_response_observed:trace.assistant_turns>0,observed_assistant_messages:trace.assistant_turns,model_turns_reported:trace.final?.turns??null,
  tool_use_id:trace.tool?.id??null,tool_result_id:trace.result?.id??null,checker:trace.result?.collection??null,
  owned_native_reaped:reaped,owned_listener_cleanup:cleanup,milliseconds:performance.now()-started,job_milliseconds:Date.now()-jobStartedMs,
  checker_real_credentials_opened:false,native_parent_oauth_used:'EXPECTED_NOT_MEASURED',portable_applicability:'NOT_TESTED',agent_reuse:'NOT_TESTED',raw_transcript_retained:false,raw_stderr_retained:false};
 if(remaining()<=0){report.collection_status='UNKNOWN';report.reason_code='DIAGNOSTIC_JOB_DEADLINE';}
 const persisted={...report,collection_status:'UNKNOWN',reason_code:'REQUIRES_FINAL_PARENT_COMPLETION',pre_persistence_context_outcome:report.collection_status};
 const output=path.join(plan.assets.host,'result.json'),bytes=Buffer.from(JSON.stringify(persisted)+'\n');
 try{putExclusive(output,bytes);if(!readOwned(output,65536).bytes.equals(bytes))fail('DIAGNOSTIC_RESULT_CHANGED');report.persistence_completed=true;}
 catch{report.persistence_completed=false;report.collection_status='UNKNOWN';report.reason_code='DIAGNOSTIC_PERSISTENCE_UNKNOWN';}
 if(remaining()<=0){report.collection_status='UNKNOWN';report.reason_code='DIAGNOSTIC_JOB_DEADLINE';}
 report.job_milliseconds=Date.now()-jobStartedMs;return report;
}
export function requireNativeDiagnosticActivation({env,source}={}){
 requireDiagnosticWorkflow(env??{},source);
 let fact;try{fact=JSON.parse(env.REDUE_CLAUDE_ACCOUNT_POLICY_FACT);}catch{fail('DIAGNOSTIC_OWNER_POLICY_FACT_MISSING');}
 const keys=['schema','scope','owner','repository','ref','source','native_sha256','account_kind','organization_membership','applicable_managed_policy','reviewed_at','included_capacity'];
 if(!fact||typeof fact!=='object'||Array.isArray(fact)||Object.keys(fact).length!==keys.length||keys.some(k=>!Object.hasOwn(fact,k))||
  fact.schema!==1||fact.scope!=='OWNER_ATTESTED_PERSONAL_SUBSCRIPTION_NO_MANAGED_POLICY'||fact.owner!=='msiric'||fact.repository!=='msiric/redue'||
  fact.ref!=='refs/heads/dev/portable-claude-diagnostic'||fact.source!==source||fact.native_sha256!==REVIEWED_CLAUDE_NATIVE.sha256||
  !['personal-pro','personal-max'].includes(fact.account_kind)||fact.organization_membership!=='none'||fact.applicable_managed_policy!=='none'||
  fact.included_capacity!=='4-turn-120s-included-only'||typeof fact.reviewed_at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(fact.reviewed_at))fail('DIAGNOSTIC_OWNER_POLICY_FACT_INVALID');
 const age=Date.now()-Date.parse(fact.reviewed_at);if(!Number.isFinite(age)||age<0||age>24*60*60*1000)fail('DIAGNOSTIC_OWNER_POLICY_FACT_STALE');
 // This is an explicit owner-provenance prerequisite. It does not measure remote
 // policy, OAuth validity, capacity, native sandboxing or credential masking.
 return {provenance:'OWNER_STATEMENT_PROTECTED_WORKFLOW_INPUT',digest:sha(JSON.stringify(fact))};
}
export function runPreparedDiagnosticAfterReview(context){
 const ownerFact=requireNativeDiagnosticActivation({env:context.env,source:context.manifest.source});
 return executePreparedDiagnostic(context).then(report=>({...report,account_policy_fact:ownerFact}));
}
async function main(signal){
 const args=process.argv.slice(2);if(!['--check-prerequisites','--prepare','--run'].includes(args[0])||args.length!==3||args[1]!=='--source')fail('DIAGNOSTIC_ARGUMENTS');
 const source=args[2],env=process.env;requireNativeDiagnosticActivation({env,source});
 const jobStartedMs=Number(env.REDUE_DIAGNOSTIC_JOB_STARTED_MS);if(!Number.isSafeInteger(jobStartedMs)||jobStartedMs>Date.now()||Date.now()-jobStartedMs>=LIMITS.totalMs-LIMITS.cleanupMs)fail('DIAGNOSTIC_JOB_DEADLINE');
 readDeadline=jobStartedMs+LIMITS.totalMs;
 if(args[0]==='--check-prerequisites')return {schema:1,status:'OWNER_INPUTS_ACCEPTED_NOT_EMPIRICAL_ENFORCEMENT',native_processes_launched:0};
 const base=env.REDUE_DIAGNOSTIC_BASE,native=path.join(base??'','native/claude');
 if(!/^\/private\/tmp\/redue-claude-diagnostic-[A-Za-z0-9]{6}$/.test(base??''))fail('DIAGNOSTIC_BINDING');
 if(args[0]==='--prepare'){prepareOwnedDiagnostic({base,native,source});return {schema:1,status:'PREPARED_ONLY',native_processes_launched:0};}
 const plan=buildDiagnosticSettings({base,node:fs.realpathSync(process.execPath),native});
 const manifest=JSON.parse(readOwned(path.join(plan.assets.host,'manifest.json'),65536).bytes);
 const expected=[fs.realpathSync(process.execPath),native,plan.assets.checker,plan.assets.collector,plan.settingsFile];
 if(manifest?.schema!==1||manifest.scope!=='PREPARED_ONLY_NO_NATIVE_OR_MODEL'||manifest.source!==source||manifest.base!==base||manifest.node!==expected[0]||manifest.native!==native||
  !Array.isArray(manifest.files)||manifest.files.length!==expected.length||manifest.files.some((r,i)=>r.file!==expected[i]||typeof r.digest!=='string'||typeof r.fingerprint!=='string'))fail('DIAGNOSTIC_MANIFEST');
 if(manifest.files[0].digest!==NODE_SHA||manifest.files[1].digest!==REVIEWED_CLAUDE_NATIVE.sha256||manifest.files[2].digest!==plan.assets.checkerSHA||manifest.files[3].digest!==plan.assets.collectorSHA||manifest.files[4].digest!==sha(JSON.stringify(plan.settings)+'\n'))fail('DIAGNOSTIC_MANIFEST');
 return runPreparedDiagnosticAfterReview({plan,manifest,env,jobStartedMs,signal});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const cancellation=new AbortController(),cancel=()=>cancellation.abort();
 for(const sig of ['SIGTERM','SIGINT','SIGHUP'])process.on(sig,cancel);
 main(cancellation.signal).then(report=>{console.log(JSON.stringify(report));process.exitCode=report.collection_status==='PASS'||['PREPARED_ONLY','OWNER_INPUTS_ACCEPTED_NOT_EMPIRICAL_ENFORCEMENT'].includes(report.status)?0:2;})
 .catch(()=>{console.log(JSON.stringify({schema:1,status:'PRECONDITION_OR_LIFECYCLE_UNAVAILABLE',collection_status:'UNKNOWN',native_processes_launched:'NOT_INFERRED_FROM_FAILURE',raw_transcript_retained:false}));process.exitCode=2;})
 .finally(()=>{for(const sig of ['SIGTERM','SIGINT','SIGHUP'])process.removeListener(sig,cancel);});
}
