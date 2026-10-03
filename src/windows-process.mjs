import {spawn} from 'node:child_process';

// taskkill /T is the native narrow process-tree operation available without
// elevation. It cannot own deliberately detached descendants.
export function terminateWindowsTree(pid,{start=spawn,timeoutMs=5000}={}) {
  if(!Number.isSafeInteger(pid)||pid<1)return Promise.reject(Error('invalid check PID'));
  return new Promise((resolve,reject)=>{
    const child=start('taskkill.exe',['/PID',String(pid),'/T','/F'],
      {stdio:'ignore',windowsHide:true});
    const timer=setTimeout(()=>{child.kill();reject(Error('taskkill deadline exceeded'));},timeoutMs);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('close',code=>{clearTimeout(timer);code===0?resolve():
      reject(Error(`taskkill exited ${code}`));});
  });
}
