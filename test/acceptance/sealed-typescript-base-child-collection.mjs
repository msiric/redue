// Fixed diagnostic child collection only; this leaf has no executable entry.
// The lexical factory is a mock seam, not a native command/environment selector.
// The enclosing reviewed executable must bind its one permitted helper itself.
// Raw helper output is private input to the strict C parser, never public output.
import {createSealedTypeScriptBaseExchangeResultLatch} from './sealed-typescript-base-exchange-result.mjs';
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
export function collectSealedTypeScriptBaseChild(create){
 return new Promise(resolve=>{
  const clock=()=>{try{const value=performance.now();return Number.isFinite(value)&&value>=0?value:null;}catch{return null;}};
  const started=clock();
  let child,done=false,spawnObserved=false,reaped=false,bytes=Buffer.alloc(0),stderrBytes=0,overflow=false,timedOut=false,error=null;
  const stop=()=>{if(child&&child.exitCode===null&&child.signalCode===null)try{child.kill('SIGKILL');}catch{error??='CHILD_KILL_UNAVAILABLE';}};
  const finish=(exitCode=null,signal=null,exitObserved=false)=>{
   if(done)return;done=true;clearTimeout(deadline);clearTimeout(reap);
   const ended=clock();
   if(started===null||ended===null||ended<started){timedOut=true;error??='CHILD_CLOCK_UNAVAILABLE';}
   else if(ended-started>=14000)timedOut=true;
   const validExit=Number.isInteger(exitCode)&&exitCode>=0&&exitCode<=255?exitCode:null,validSignal=signals.has(signal)?signal:null;
   if(exitObserved&&((exitCode!==null&&validExit===null)||(signal!==null&&validSignal===null)||(validExit!==null&&validSignal!==null)))error??='CHILD_LIFECYCLE_INVALID';
   const actualChildClose=exitObserved&&spawnObserved&&Number.isInteger(child?.pid)&&child.pid>0&&((validExit!==null&&signal===null)||(exitCode===null&&validSignal!==null));
   reaped=actualChildClose;
   resolve({schema:1,scope:'FIXED_BASE_CHILD_COLLECTION_PRIVATE_INPUT_ONLY',bytes,
    lifecycle:{exitCode:validExit,signal:validSignal,exitObserved:actualChildClose&&!error,timedOut},
    spawnObserved,reaped,stderrBytes,overflow,reason_code:error??(timedOut?'CHILD_DEADLINE':overflow?'CHILD_OUTPUT_LIMIT':stderrBytes?'CHILD_STDERR_OBSERVED':exitObserved?'CHILD_CLOSE_OBSERVED':'CHILD_CLOSE_UNAVAILABLE'),
    raw_output_publication_permitted:false,sealed:false,reuseEligible:false});
  };
  const deadline=setTimeout(()=>{timedOut=true;stop();},14000);
  const reap=setTimeout(()=>{timedOut=true;finish();},14500);
  if(started===null){error='CHILD_CLOCK_UNAVAILABLE';finish();return;}
  try{
   child=create();child.on('error',()=>{error??='CHILD_START_FAILURE';stop();});child.on('spawn',()=>{spawnObserved=Number.isInteger(child.pid)&&child.pid>0;});
   child.stdout.on('error',()=>{error??='CHILD_IO_UNAVAILABLE';stop();});child.stderr.on('error',()=>{error??='CHILD_IO_UNAVAILABLE';stop();});
   child.stdout.on('data',chunk=>{if(done)return;if(!Buffer.isBuffer(chunk)){error??='CHILD_OUTPUT_TYPE';stop();return;}
    if(chunk.length>4096-bytes.length){overflow=true;stop();return;}bytes=Buffer.concat([bytes,chunk]);});
   child.stderr.on('data',chunk=>{if(done)return;if(!Buffer.isBuffer(chunk)){error??='CHILD_STDERR_TYPE';stop();return;}stderrBytes=Math.min(4097,stderrBytes+chunk.length);if(stderrBytes>4096){overflow=true;stop();}});
   child.on('close',(code,signal)=>finish(code,signal,true));
  }catch{error??='CHILD_START_FAILURE';stop();if(!child)finish();}
 });
}
// Diagnostic classification only. Never treat a caller-created collection as
// authenticated tool evidence. The native adapter must establish provenance.
export function classifySealedTypeScriptBaseChild(collection){
 const latch=createSealedTypeScriptBaseExchangeResultLatch();let parsed;
 let complete=false;
 try{
  const fields=['schema','scope','bytes','lifecycle','spawnObserved','reaped','stderrBytes','overflow','reason_code','raw_output_publication_permitted','sealed','reuseEligible'];
  if(!collection||Object.getPrototypeOf(collection)!==Object.prototype||Reflect.ownKeys(collection).length!==fields.length||!fields.every(key=>Object.hasOwn(collection,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(collection,key),'value')))throw Error();
  if(collection.schema!==1||collection.scope!=='FIXED_BASE_CHILD_COLLECTION_PRIVATE_INPUT_ONLY'||!Buffer.isBuffer(collection.bytes)||collection.bytes.length>4096||
   !['spawnObserved','reaped','overflow'].every(key=>typeof collection[key]==='boolean')||!Number.isInteger(collection.stderrBytes)||collection.stderrBytes<0||collection.stderrBytes>4097||
   !['raw_output_publication_permitted','sealed','reuseEligible'].every(key=>collection[key]===false)||
   !['CHILD_KILL_UNAVAILABLE','CHILD_LIFECYCLE_INVALID','CHILD_OUTPUT_TYPE','CHILD_STDERR_TYPE','CHILD_START_FAILURE','CHILD_IO_UNAVAILABLE','CHILD_CLOCK_UNAVAILABLE','CHILD_DEADLINE','CHILD_OUTPUT_LIMIT','CHILD_STDERR_OBSERVED','CHILD_CLOSE_OBSERVED','CHILD_CLOSE_UNAVAILABLE'].includes(collection.reason_code))throw Error();
  parsed=latch.observe(collection.bytes,collection.lifecycle);
  complete=collection.spawnObserved&&collection.reaped&&!collection.overflow&&collection.stderrBytes===0&&collection.reason_code==='CHILD_CLOSE_OBSERVED';
 }catch{parsed=latch.snapshot();}
 return Object.freeze({...parsed,implementedAssertionsOutcome:complete?parsed.implementedAssertionsOutcome:'UNKNOWN',
  collectionComplete:complete,reason_code:complete?parsed.reason_code:'CHILD_COLLECTION_INCOMPLETE',
  sourceProvenance:'NOT_ESTABLISHED_BY_COLLECTION',nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
}
