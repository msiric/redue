import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const alive=pid=>{
  if(!Number.isSafeInteger(pid)||pid<1)return true;
  try{process.kill(pid,0);return true;}
  catch(e){return e.code!=='ESRCH';}
};
const write=(file,value)=>{
  const temp=file+`.${process.pid}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(value),{mode:0o600});
  fs.renameSync(temp,file);
};

export function inspectRunLock(state) {
  const lock=path.join(state,'run.lock');
  if(!fs.existsSync(lock))return {state:'absent'};
  let owner;
  try{owner=JSON.parse(fs.readFileSync(path.join(lock,'owner.json'),'utf8'));}
  catch{return {state:'uncertain',reason:'lock owner record missing or unreadable'};}
  if(owner.schema!==1||!owner.token||!Number.isSafeInteger(owner.pid))
    return {state:'uncertain',reason:'lock owner record invalid'};
  if(alive(owner.pid))return {state:'live',reason:'wrapper process exists',owner};
  if(owner.phase==='running'&&Number.isSafeInteger(owner.childPid)&&alive(owner.childPid))
    return {state:'uncertain',reason:'recorded check process is still running',owner};
  if(['launching','running','finished'].includes(owner.phase))
    return {state:'uncertain',reason:'a descendant check process may survive; operator review required',owner};
  if(owner.phase!=='prepared')
    return {state:'uncertain',reason:'unknown wrapper phase',owner};
  return {state:'abandoned',reason:'wrapper died before child launch',owner};
}

function reclaim(state,confirmed=false){
  const lock=path.join(state,'run.lock'),guard=path.join(state,'run-recovery.lock');
  fs.mkdirSync(guard);
  try{
    const status=inspectRunLock(state);
    if(status.state!=='abandoned'){
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
  }finally{fs.rmdirSync(guard);}
}

export function recoverRunLock(state,confirmed=false){
  if(!confirmed)throw Error('explicit --confirm-check-stopped required');
  reclaim(state,true);
  return {recovered:true};
}

export function acquireRunLock(state) {
  const lock=path.join(state,'run.lock');
  const token=randomUUID();
  try{fs.mkdirSync(lock);}
  catch(e){
    if(e.code!=='EEXIST')throw e;
    reclaim(state);
    fs.mkdirSync(lock);
  }
  const owner={schema:1,token,pid:process.pid,phase:'prepared',childPid:null,
    startedAt:Date.now()};
  const file=path.join(lock,'owner.json');write(file,owner);
  return {
    phase(value,childPid=null){owner.phase=value;owner.childPid=childPid;write(file,owner);},
    release(){
      const current=JSON.parse(fs.readFileSync(file,'utf8'));
      if(current.token!==token)throw Error('run lock ownership changed; refusing removal');
      fs.unlinkSync(file);fs.rmdirSync(lock);
    }
  };
}
