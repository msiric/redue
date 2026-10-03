import path from 'node:path';
import {createHash} from 'node:crypto';

export function controlEndpoint(state,platform=process.platform) {
  if(platform==='win32'){
    const identity=path.win32.normalize(state).toLowerCase();
    const id=createHash('sha256').update(identity).digest('hex').slice(0,24);
    return {address:`\\\\.\\pipe\\vstate-${id}`,filesystem:false};
  }
  return {address:path.join(state,'observer.sock'),filesystem:true};
}
