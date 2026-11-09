import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {processAlive} from './process-liveness.mjs';

const alive=processAlive;
const write=(file,value)=>{
  const temp=file+`.${process.pid}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(value),{mode:0o600});
  fs.renameSync(temp,file);
};

// Whether any process of the process group `pgid` exists. A run on Linux,
// and a sandboxed one on macOS, has its own group, led by the check.
// On Linux a zombie still counts for kill(-pgid, 0), and an orphaned one is
// reaped only when its new parent gets to it: there each process's state
// and group are read instead, and zombies do not count.
function groupAlive(pgid){
  if(process.platform==='win32'||!Number.isSafeInteger(pgid)||pgid<2)return false;
  if(process.platform==='linux'){
    let entries;try{entries=fs.readdirSync('/proc');}catch{entries=null;}
    if(entries){
      for(const entry of entries){if(!/^\d+$/.test(entry))continue;
        let stat;try{stat=fs.readFileSync(`/proc/${entry}/stat`,'utf8');}catch{continue;}
        const fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');
        if(Number(fields[2])===pgid&&!['Z','X'].includes(fields[0]))return true;}
      return false;}
  }
  try{process.kill(-pgid,0);return true;}catch(e){return e.code!=='ESRCH';}
}

export function inspectRunLock(state) {
  const lock=path.join(state,'run.lock');
  if(!fs.existsSync(lock))return {state:'absent'};
  let owner;
  try{owner=JSON.parse(fs.readFileSync(path.join(lock,'owner.json'),'utf8'));}
  catch{return {state:'uncertain',reason:'lock owner record missing or unreadable'};}
  if(owner.schema!==1||!owner.token||!Number.isSafeInteger(owner.pid))
    return {state:'uncertain',reason:'lock owner record invalid'};
  if(alive(owner.pid))return {state:'live',reason:'wrapper process exists',owner};
  // A Windows run whose process tree could not be stopped.
  if(owner.phase==='preserved')
    return {state:'uncertain',reason:"the check's process tree could not be stopped; operator review required",owner};
  if(!['prepared','launching','running','finished'].includes(owner.phase))
    return {state:'uncertain',reason:'unknown wrapper phase',owner};
  if(owner.phase==='prepared')return {state:'abandoned',reason:'wrapper died before child launch',owner};
  // The wrapper is gone (killed, such as by an agent's command time limit).
  // While the check (or a rerun of it) or a process of its group still runs,
  // so does the run. Where the check has no group of its own (a plain run on
  // macOS, Windows), a descendant may outlive both; what it then changes in
  // the checkout is observed like any concurrent edit.
  if(!Number.isSafeInteger(owner.childPid))
    return {state:'uncertain',reason:'the wrapper stopped while starting the check; operator review required',owner};
  if(alive(owner.childPid)||groupAlive(owner.childPid))
    return {state:'uncertain',reason:`an earlier run${typeof owner.check==='string'?` of ${owner.check}`:''} is still running (process ${owner.childPid}); wait for it to end or stop it`,owner};
  return {state:'killed',reason:'the run was stopped before it finished, and its processes are gone',owner};
}

// Returns the owner of a killed run it cleared, or null.
function reclaim(state,confirmed=false){
  const lock=path.join(state,'run.lock'),guard=path.join(state,'run-recovery.lock');
  fs.mkdirSync(guard);
  try{
    const status=inspectRunLock(state);
    if(!['abandoned','killed'].includes(status.state)){
      const owner=status.owner;
      const candidate=confirmed&&status.state==='uncertain'&&owner&&
        !alive(owner.pid)&&(!Number.isSafeInteger(owner.childPid)||!alive(owner.childPid));
      if(!candidate)throw Error(`run lock ${status.state}: ${status.reason}; inspect ${lock}`);
    }
    const entries=fs.readdirSync(lock);
    if(entries.length!==1||entries[0]!=='owner.json')
      throw Error('run lock has unexpected files; operator inspection required');
    const quarantined=path.join(state,`abandoned-run-${randomUUID()}`);
    fs.renameSync(lock,quarantined);
    fs.unlinkSync(path.join(quarantined,'owner.json'));fs.rmdirSync(quarantined);
    // A killed run, or one the operator confirmed stopped, to record as interrupted.
    return status.state==='killed'||confirmed&&['launching','running','finished'].includes(status.owner?.phase)?status.owner:null;
  }finally{fs.rmdirSync(guard);}
}

export function recoverRunLock(state,confirmed=false){
  if(!confirmed)throw Error('explicit --confirm-check-stopped required');
  return {recovered:true,killed:reclaim(state,true)};
}

// `about`: what the run is (check, runId), kept in the owner record so a
// later run can record a killed one as interrupted. `killed` on the returned
// lock: the owner record of a killed run it cleared.
export function acquireRunLock(state,about={}) {
  const lock=path.join(state,'run.lock');
  const token=randomUUID();
  let killed=null;
  try{fs.mkdirSync(lock);}
  catch(e){
    if(e.code!=='EEXIST')throw e;
    killed=reclaim(state);
    fs.mkdirSync(lock);
  }
  const owner={schema:1,token,pid:process.pid,phase:'prepared',childPid:null,
    startedAt:Date.now(),...about};
  const file=path.join(lock,'owner.json');write(file,owner);
  return {
    killed,
    phase(value,childPid=null){owner.phase=value;owner.childPid=childPid;write(file,owner);},
    childPid(){return owner.childPid;},
    // Kept for review: the check's process tree could not be stopped.
    preserve(){owner.phase='preserved';write(file,owner);},
    release(){
      const current=JSON.parse(fs.readFileSync(file,'utf8'));
      if(current.token!==token)throw Error('run lock ownership changed; refusing removal');
      fs.unlinkSync(file);fs.rmdirSync(lock);
    }
  };
}
