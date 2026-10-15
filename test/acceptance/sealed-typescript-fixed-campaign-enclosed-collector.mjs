// DISABLED fixed-canary collector source. Only the renderer binds real actors.
// Test injection here is not native authentication or a portable origin mint.
import {parseSealedTypeScriptBaseExchangeResult as baseParse,createSealedTypeScriptBaseExchangeResultLatch as baseLatch} from './sealed-typescript-base-exchange-result.mjs';
import {parseSealedTypeScriptStageExchangeResult as exchangeParse,createSealedTypeScriptStageExchangeResultLatch as exchangeLatch} from './sealed-typescript-stage-exchange-result.mjs';
import {parseSealedTypeScriptStageResult as stageParse,createSealedTypeScriptStageResultLatch as stageLatch} from './sealed-typescript-stage-result.mjs';
import {parseSealedTypeScriptMapResult as mapParse,createSealedTypeScriptMapResultLatch as mapLatch} from './sealed-typescript-map-result.mjs';
const roles=Object.freeze(['whole_base','stage_exchange','node_stage','mapper']);
const parses=[baseParse,exchangeParse,stageParse,mapParse],latches=[baseLatch,exchangeLatch,stageLatch,mapLatch],exits=[74,74,1,74],limits=[4096,4096,8192,4096];
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
// Source closed: exactly four no-process-creation actor implementations, with
// this collector as their sole creator. A future actor requires renewed review.
// Node's real spawn/close events, NOT user JSON or pipe EOF, bind each lifecycle.
export function collectFixedEnclosedCampaign(create,protectedInputs){
 if(arguments.length!==2||typeof create!=='function'||Object.getPrototypeOf(create)!==Function.prototype||!protectedInputs||!['begin','end'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(protectedInputs,k)??{},'value')&&typeof protectedInputs[k]==='function'))throw Error('ENCLOSED_COLLECTOR_INPUT');
 return new Promise(resolve=>{
  const beganAt=performance.now(),phases=[];let last=beganAt,active=null,done=false,failed=false,timedOut=false,begin=false,end=false,reason=null,stderrBytes=0;
  const current=()=>{const now=performance.now();if(!Number.isFinite(now)||now<last||!Number.isFinite(beganAt)||beganAt<0){reason??='CLOCK_UNAVAILABLE';return false;}last=now;if(now-beganAt>=11000){timedOut=true;reason??='ACTOR_DEADLINE';}return !reason;};
  const stop=()=>{try{if(active?.child&&active.child.exitCode===null&&active.child.signalCode===null)active.child.kill('SIGKILL');}catch{reason??='DIRECT_KILL_UNAVAILABLE';}};
  const finish=()=>{
   if(done)return;current();done=true;clearTimeout(deadline);clearTimeout(reap);
   if(active&&!active.recorded){active.recorded=true;phases.push({role:roles[active.at],spawnObserved:active.spawn,closeObserved:false,exitObserved:false,exitCode:null,signal:null,outcome:active.failure?'FAIL':'UNKNOWN',implementedAssertionsOutcome:active.failure?'FAIL':'UNKNOWN',checks:active.failure?.checks??null,stdoutBytes:active.bytes.length,stderrBytes:active.stderr});}
   // Never call END after a timeout, error, partial spawn, pending active child,
   // or missing kernel-backed close. Collector EOF/reap alone is insufficient.
   const closed=phases.length>0&&phases.every(p=>p.spawnObserved&&p.closeObserved&&p.exitObserved);
   if(begin&&!reason&&!timedOut&&active===null&&closed){try{end=protectedInputs.end()===true;}catch{}if(!end)reason??='ORIGINAL_END_UNAVAILABLE';}
   const report=()=>({schema:1,scope:'ENCLOSED_FIXED_CANARY_DIAGNOSTICS_ONLY',outcome:failed?'FAIL':'UNKNOWN',reason_code:reason??(failed?'REPORTED_ASSERTION_FAILED':'FIXED_CANARY_COLLECTED_NOT_NATIVE_AUTHENTICATED'),begin,end,launchedCount:phases.length,closedCount:phases.filter(p=>p.closeObserved&&p.exitObserved).length,allLaunchedDirectActorsReaped:closed&&active===null,phases,timedOut,elapsedMs:Number.isFinite(last)&&Number.isFinite(beganAt)&&last>=beganAt?last-beganAt:null,ownedGroupCleanupRequired:!!reason||!!active,fixedNoProcessCreationPremise:'REQUIRES_EXACT_REVIEWED_ACTOR_AND_NODE_IMPLEMENTATIONS',nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
   let result=report();if(!current()){end=false;result=report();}resolve(freeze(result));
  };
  const deadline=setTimeout(()=>{timedOut=true;reason??='ACTOR_DEADLINE';stop();if(!active)finish();},11000);
  const reap=setTimeout(()=>{timedOut=true;reason??='ACTOR_REAP_DEADLINE';stop();finish();},11500);
  const launch=at=>{
   if(!current()){finish();return;}
   const state={at,child:null,spawn:false,closed:false,bytes:Buffer.alloc(0),stderr:0,error:null,failure:null,recorded:false};active=state;
   const bad=code=>{state.error??=code;reason??=code;stop();};
   try{
    state.child=create(roles[at]);
    state.child.on('spawn',()=>{if(done||state.closed)return;try{state.spawn=Number.isInteger(state.child.pid)&&state.child.pid>0;}catch{}if(!state.spawn)bad('SPAWN_NOT_OBSERVED');});
    state.child.on('error',()=>bad('ACTOR_START_OR_EXECUTION_ERROR'));
    state.child.stdout.on('error',()=>bad('ACTOR_STDOUT_ERROR'));state.child.stderr.on('error',()=>bad('ACTOR_STDERR_ERROR'));
    state.child.stdout.on('data',bytes=>{if(done||state.closed)return;if(!Buffer.isBuffer(bytes)||bytes.length>limits[at]-state.bytes.length){bad('ACTOR_OUTPUT_LIMIT');return;}state.bytes=Buffer.concat([state.bytes,bytes]);try{const parsed=parses[at](state.bytes);if(parsed.result==='FAIL'){state.failure??=parsed;failed=true;}}catch{};});
    state.child.stderr.on('data',bytes=>{if(done||state.closed)return;if(!Buffer.isBuffer(bytes)){bad('ACTOR_STDERR_TYPE');return;}state.stderr+=bytes.length;stderrBytes+=bytes.length;if(stderrBytes>4096)bad('ACTOR_STDERR_LIMIT');});
    state.child.on('close',(code,signal)=>{
     if(done||state.closed)return;state.closed=true;
     const exit=Number.isInteger(code)&&code>=0&&code<=255&&signal===null,signalled=code===null&&signals.has(signal),pid=state.child.pid;
     const observed=state.spawn&&Number.isInteger(pid)&&pid>0&&(exit||signalled);
     if(!observed)reason??='KERNEL_CLOSE_UNAVAILABLE';
     current();const observation=latches[at]().observe(state.bytes,{exitCode:exit?code:null,signal:signalled?signal:null,exitObserved:observed,timedOut});
     const assertionFail=!!state.failure||observation.outcome==='FAIL';failed ||= assertionFail;
     if(observation.outcome!=='FAIL'&&observation.implementedAssertionsOutcome!=='ALL_IMPLEMENTED_ROWS_OBSERVED')reason??='ACTOR_PROTOCOL_UNAVAILABLE';
     const complete=!reason&&!state.error&&!timedOut&&observed&&code===exits[at]&&signal===null&&state.stderr===0;
     state.recorded=true;phases.push({role:roles[at],spawnObserved:state.spawn,closeObserved:true,exitObserved:observed,exitCode:exit?code:null,signal:signalled?signal:null,outcome:assertionFail?'FAIL':'UNKNOWN',implementedAssertionsOutcome:complete?observation.implementedAssertionsOutcome:'UNKNOWN',checks:state.failure?.checks??observation.checks,stdoutBytes:state.bytes.length,stderrBytes:state.stderr});active=null;
     if(!complete){reason??='ACTOR_COLLECTION_INCOMPLETE';finish();return;}
     if(assertionFail||observation.implementedAssertionsOutcome!=='ALL_IMPLEMENTED_ROWS_OBSERVED'||at===3){finish();return;}launch(at+1);
    });
   }catch{bad('ACTOR_START_FAILURE');if(!state.child){active=null;finish();}}
  };
  if(current()){try{begin=protectedInputs.begin()===true;}catch{}}if(!begin){reason??='ORIGINAL_BEGIN_UNAVAILABLE';finish();return;}if(current())launch(0);else finish();
 });
}
