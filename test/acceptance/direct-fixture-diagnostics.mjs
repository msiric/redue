// Test-only opt-in bridge to existing engine timing. It never changes assertions,
// deadlines, caller overrides or observation authority; no environment is dumped.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const phases=new Set(['fixture.begin','fixture.compiler_copy','fixture.git_init','fixture.git_add','fixture.cleanup','command.begin','command.end','suite.begin','suite.end']);
const commands=new Set(['init','start','stop','status','run','explain','detail']);
const groups=new Set(['direct-all','mac-discovery','mac-recording']);
const defaultEmit=row=>{try{fs.writeSync(2,'REDUE_DIRECT_FIXTURE '+JSON.stringify(row)+'\n');}catch{}};
export function directFixtureDiagnosticRow(phase,fields={}){
 const row={schema:1,phase:phases.has(phase)?phase:'unknown'};
 if(/^[a-f0-9-]{36}$/.test(fields.fixture??''))row.fixture=fields.fixture;
 for(const key of ['ordinal','ms','stdoutBytes','stderrBytes'])if(Number.isFinite(fields[key])&&fields[key]>=0)row[key]=Math.round(fields[key]*10)/10;
 if(fields.status===null||Number.isInteger(fields.status))row.status=fields.status;
 if(fields.signal===null||/^SIG[A-Z0-9]{1,24}$/.test(fields.signal??''))row.signal=fields.signal;
 if(fields.errorCode===null||/^E[A-Z0-9_]{1,48}$/.test(fields.errorCode??''))row.errorCode=fields.errorCode;
 if(commands.has(fields.command))row.command=fields.command;
 if(groups.has(fields.group))row.group=fields.group;
 if(['begin','end'].includes(fields.edge))row.edge=fields.edge;
 return row;
}
export function emitDirectSuiteDiagnostic(phase,fields,{env=process.env,emit=defaultEmit}={}){
 if(env.REDUE_TEST_DIRECT_DIAGNOSTICS==='1')try{emit(directFixtureDiagnosticRow(phase,fields));}catch{}
}
export function createDirectFixtureDiagnostics(base,{env=process.env,emit=defaultEmit}={}){
 let active=false,file,fixture,ordinal=0,events=0;
 if(env.REDUE_TEST_DIRECT_DIAGNOSTICS==='1')try{
  const dir=env.REDUE_TEST_DIRECT_DIAGNOSTICS_DIR,canonicalBase=fs.realpathSync(base);
  if(typeof dir!=='string'||!path.isAbsolute(dir)||path.normalize(dir)!==dir||fs.realpathSync(dir)!==dir||
    !/^redue-direct-diagnostics-[a-zA-Z0-9_-]+$/.test(path.basename(dir))||path.dirname(dir)!==path.dirname(canonicalBase))throw Error();
  const stat=fs.lstatSync(dir),owned=typeof process.getuid!=='function'||stat.uid===process.getuid();
  if(!stat.isDirectory()||stat.isSymbolicLink()||!owned||typeof process.getuid==='function'&&(stat.mode&0o022)!==0)throw Error();
  fixture=randomUUID();file=path.join(dir,fixture+'.jsonl');
  const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|(fs.constants.O_NOFOLLOW??0),0o600);
  try{const leaf=fs.fstatSync(fd);if(!leaf.isFile()||leaf.nlink!==1)throw Error();}finally{fs.closeSync(fd);}
  active=true;
 }catch{/* Missing/unsafe diagnostic resources never change the fixture result. */}
 const event=(phase,fields={})=>{if(active&&events++<256)try{emit(directFixtureDiagnosticRow(phase,{...fields,fixture}));}catch{}};
 event('fixture.begin');
 return Object.freeze({enabled:active,
  step(phase,fn){const started=performance.now();event(phase,{edge:'begin'});try{return fn();}finally{event(phase,{edge:'end',ms:performance.now()-started});}},
  command(command,childEnv,fn){
   const at=++ordinal,started=performance.now();event('command.begin',{command,ordinal:at});
   const selected=active?{...childEnv,REDUE_DECISION_PROFILE:'1',REDUE_DECISION_PROFILE_FILE:file,
    REDUE_PROFILE_CONTEXT:JSON.stringify({request:randomUUID(),work:'direct-fixture'})}:childEnv;
   let result;try{result=fn(selected);}catch(error){event('command.end',{command,ordinal:at,ms:performance.now()-started,status:null,signal:null,errorCode:error.code??null});throw error;}
   event('command.end',{command,ordinal:at,ms:performance.now()-started,status:result.status,
    signal:result.signal??null,errorCode:result.error?.code??null,
    stdoutBytes:Buffer.byteLength(result.stdout??''),stderrBytes:Buffer.byteLength(result.stderr??'')});return result;
  },
 });
}
