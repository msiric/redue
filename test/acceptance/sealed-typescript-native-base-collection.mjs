// Fixed native print/stream-json collection only. A trusted enclosing dispatcher
// supplies the lexical factory AFTER its actual prerequisites. No dispatch at
// import, alternative transport, raw transcript publication or acceptance gate.
import {parsePortableJson} from '../../src/portable-envelope.mjs';
import {createSealedTypeScriptNativeBaseTrace} from './sealed-typescript-native-base-trace.mjs';

const streamLimit=2*1024*1024,lineLimit=65536,stderrLimit=65536;
const signals=new Set(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGBUS','SIGFPE','SIGKILL','SIGSEGV','SIGPIPE','SIGALRM','SIGTERM','SIGXCPU','SIGXFSZ','SIGSYS']);
export function collectSealedTypeScriptNativeBase(create,{command,cwd,signal:abortSignal}={}){
  const trace=createSealedTypeScriptNativeBaseTrace({command,cwd});
  return new Promise(resolve=>{
    let child,buffer=Buffer.alloc(0),stdoutBytes=0,stderrBytes=0,error=null,finished=false,
      spawned=false,reaped=false,timedOut=false,killTimer=null,deadline=null,cleanup=null;
    const readClock=()=>{try{const n=performance.now();return Number.isFinite(n)&&n>=0?n:null;}catch{return null;}};
    const start=readClock();
    const stop=()=>{
      if(!child||!Number.isInteger(child.pid)||child.pid<=0||child.exitCode!==null||child.signalCode!==null)return;
      try{child.kill('SIGTERM');}catch{error??='NATIVE_STOP_UNAVAILABLE';}
      if(killTimer===null)killTimer=setTimeout(()=>{
        if(!finished&&child.exitCode===null&&child.signalCode===null)try{child.kill('SIGKILL');}catch{error??='NATIVE_STOP_UNAVAILABLE';}
      },500);
    };
    const refuse=code=>{error??=code;stop();};
    const finish=(exit,signal,closeObserved=false)=>{
      if(finished)return;finished=true;
      clearTimeout(deadline);clearTimeout(cleanup);clearTimeout(killTimer);
      abortSignal?.removeEventListener('abort',cancel);
      const end=readClock(),elapsed=start!==null&&end!==null&&end>=start?end-start:null;
      if(elapsed===null)error??='NATIVE_CLOCK_UNAVAILABLE';
      if(elapsed!==null&&elapsed>=115000){timedOut=true;error??='NATIVE_DEADLINE';}
      if(buffer.length)error??='NATIVE_STREAM_INCOMPLETE';
      if(stderrBytes)error??='NATIVE_STDERR_PRESENT';
      const snapshot=trace.snapshot(),exitCode=Number.isInteger(exit)&&exit>=0&&exit<=255?exit:null,
        actualSignal=signal===null?null:signals.has(signal)?signal:'UNKNOWN';
      const balanced=closeObserved&&spawned&&Number.isInteger(child?.pid)&&child.pid>0&&
        (exitCode!==null&&signal===null||exit===null&&signals.has(signal));
      reaped=balanced;
      if(!balanced)error??='NATIVE_CLOSE_UNAVAILABLE';
      error??=snapshot.error;
      const complete=!error&&!timedOut&&balanced&&exitCode===0&&actualSignal===null&&
        snapshot.init&&snapshot.result!==null&&snapshot.final?.success===true;
      resolve({schema:1,scope:'FIXED_NATIVE_BASE_COLLECTION_DATA_ONLY',
        outcome:snapshot.reportedFailedAssertion?'FAIL':complete?'REPORTED_BASE_ROWS_COLLECTED':'UNKNOWN',
        reason_code:error??(complete?'BOUNDED_NATIVE_CLOSE_AND_TOOL_RESULT_OBSERVED':'NATIVE_COLLECTION_INCOMPLETE'),
        trace:snapshot,nativeExitCode:exitCode,nativeSignal:actualSignal,spawnObserved:spawned,
        closeObserved,ownedNativeReaped:reaped,timedOut,elapsedMs:elapsed,stdoutBytes,stderrBytes,
        rawStdoutRetained:false,rawStderrRetained:false,sourceAndAccountAuthority:'NOT_ESTABLISHED_BY_COLLECTION',
        nativeEnforcement:'REQUIRES_CURRENT_PARENT_BOUNDARIES_AND_ASSERTION_SCOPE',sealed:false,reuseEligible:false});
    };
    const cancel=()=>{refuse('NATIVE_CANCELLED');};
    if(start===null){error='NATIVE_CLOCK_UNAVAILABLE';finish(null,null);return;}
    if(abortSignal?.aborted){error='NATIVE_CANCELLED';finish(null,null);return;}
    abortSignal?.addEventListener('abort',cancel,{once:true});
    deadline=setTimeout(()=>{timedOut=true;refuse('NATIVE_DEADLINE');},115000);
    cleanup=setTimeout(()=>finish(null,null),120000);
    try{
      child=create();
      child.on('spawn',()=>{if(!finished){spawned=true;if(error)stop();}});
      child.on('error',()=>{refuse('NATIVE_START_FAILURE');});
      child.on('close',(exit,signal)=>finish(exit,signal,true));
      child.stdout.on('error',()=>refuse('NATIVE_STDOUT_ERROR'));
      child.stderr.on('error',()=>refuse('NATIVE_STDERR_ERROR'));
      child.stderr.on('data',chunk=>{
        if(finished)return;
        if(!Buffer.isBuffer(chunk)){refuse('NATIVE_STDERR_INVALID');return;}
        stderrBytes+=chunk.length;if(stderrBytes>stderrLimit)refuse('NATIVE_STDERR_LIMIT');
      });
      child.stdout.on('data',chunk=>{
        if(finished||error)return;
        if(!Buffer.isBuffer(chunk)){refuse('NATIVE_STREAM_INVALID');return;}
        stdoutBytes+=chunk.length;if(stdoutBytes>streamLimit){refuse('NATIVE_STREAM_LIMIT');return;}
        // Bound each line before allocating; a transport chunk may contain many
        // small complete events, so it is not treated as one oversized line.
        let at=0;while(at<chunk.length&&!error){
          const newline=chunk.indexOf(10,at),end=newline===-1?chunk.length:newline;
          if(end-at>lineLimit-buffer.length){refuse('NATIVE_LINE_LIMIT');return;}
          buffer=Buffer.concat([buffer,chunk.subarray(at,end)]);at=end;
          if(newline===-1)break;
          at++;
          try{const text=buffer.toString('utf8');if(!Buffer.from(text).equals(buffer))throw Error();trace.consume(parsePortableJson(text));}
          catch{refuse('NATIVE_STREAM_MALFORMED');return;}
          buffer=Buffer.alloc(0);if(trace.snapshot().error)refuse(trace.snapshot().error);
        }
      });
      // Cancellation can occur synchronously inside the trusted factory before
      // assignment. Recheck with handlers installed, then stop the owned child;
      // a later spawn event performs the same stop if its PID was not ready.
      if(error||abortSignal?.aborted){error??='NATIVE_CANCELLED';stop();}
    }catch{error??='NATIVE_START_FAILURE';stop();if(!child)finish(null,null);}
  });
}
