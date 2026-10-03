import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

const helper=path.join(path.dirname(fileURLToPath(import.meta.url)),'linux-inotify.py');
const fault=(reason,code)=>Object.assign(Error(reason),{code:code||reason});

export function subscribeLinux(root,callback) {
  return new Promise((resolve,reject)=>{
    const child=spawn('python3',['-u',helper,root],
      {stdio:['pipe','pipe','ignore']});
    let ready=false,closing=false,ended=false,buffer='',last=Date.now();
    const barriers=new Map();
    const startup=setTimeout(()=>fail(fault('Linux observer startup timed out')),10000);
    const heartbeat=setInterval(()=>{
      if(ready&&!closing&&!barriers.size&&Date.now()-last>4000)
        fail(fault('Linux observer heartbeat unavailable'));
    },1000);
    const cleanup=()=>{clearTimeout(startup);clearInterval(heartbeat);
      for(const [id,pending] of barriers){clearTimeout(pending.timer);
        pending.reject(fault('Linux observer unavailable'));barriers.delete(id);}};
    const fail=error=>{
      if(ended)return;ended=true;cleanup();
      if(!ready)reject(error);else if(!closing)callback(error,[]);
      child.kill('SIGTERM');
    };
    const request=(kind,fields={},timeoutMs=5000)=>{
      if(ended||closing)return Promise.reject(fault('Linux observer unavailable'));
      return new Promise((done,no)=>{
        const id=randomUUID();const timer=setTimeout(()=>{
          barriers.delete(id);no(fault(`Linux observer ${kind} timed out`));
          fail(fault(`Linux observer ${kind} timed out`));
        },timeoutMs);
        barriers.set(id,{resolve:done,reject:no,timer});
        child.stdin.write(JSON.stringify({kind,id,...fields})+'\n');
      });
    };
    child.on('error',fail);
    child.stdin.on('error',fail);
    child.stdout.on('error',fail);
    child.on('exit',(code,signal)=>{
      if(!closing&&!ended)fail(fault(`Linux observer exited: ${code??signal}`));
      else cleanup();
    });
    child.stdout.on('data',data=>{
      buffer+=data.toString();
      if(buffer.length>1024*1024){fail(fault('Linux observer output backlog'));return;}
      for(;;){const end=buffer.indexOf('\n');if(end<0)break;
        const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
        let message;try{message=JSON.parse(line);}catch{fail(fault('Linux observer protocol error'));return;}
        last=Date.now();
        if(message.kind==='ready'){
          ready=true;clearTimeout(startup);
          resolve({
            synchronize(timeoutMs=5000){return request('barrier',{},timeoutMs);},
            watchFiles(paths,timeoutMs=30000){
              return request('watch-files',{paths},timeoutMs);
            },
            async unsubscribe(){
              if(closing)return;closing=true;cleanup();child.stdin.end();
              if(ended||child.exitCode!==null||child.signalCode!==null)return;
              const exit=new Promise(done=>child.once('exit',done));
              child.kill('SIGTERM');
              const killer=setTimeout(()=>child.kill('SIGKILL'),1000);
              await exit;clearTimeout(killer);
            },
            get pid(){return child.pid;}
          });
        }else if(message.kind==='event')callback(null,[{type:message.type,path:message.path}]);
        else if(message.kind==='gap'){fail(fault(message.reason,message.reason));return;}
        else if(message.kind==='barrier'||message.kind==='watched'){
          const pending=barriers.get(message.id);if(!pending)continue;
          barriers.delete(message.id);clearTimeout(pending.timer);pending.resolve();
        }else if(message.kind!=='heartbeat'){fail(fault('Linux observer protocol error'));return;}
      }
    });
  });
}
