// Native history is an optional acceleration. Keep its operations off the
// control thread so a wedged native call cannot block status or shutdown.
import fs from 'node:fs';
import {mark} from './decision-profile.mjs';
mark('history.worker_loaded');
import watcher from '@parcel/watcher';

try {
  const [root,previous,next,backend,faultFile]=process.argv.slice(2);
  let fault;
  try {fault=faultFile&&fs.readFileSync(faultFile,'utf8').trim();}
  catch(e){if(e.code!=='ENOENT')throw e;}
  if(fault==='hang')Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);
  if(fault==='fail')throw Error('injected history failure');
  mark('history.snapshot_start');
  await watcher.writeSnapshot(root,next,{backend});
  mark('history.snapshot_complete');
  const changes=previous?await watcher.getEventsSince(root,previous,{backend}):[];
  mark('history.events_complete',{events:changes.length});
  process.send({ok:true,changes});
} catch(error) {
  process.send({ok:false,error:error.message,code:error.code||error.name});
}
