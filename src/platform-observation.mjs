import parcelWatcher from '@parcel/watcher';
import {subscribeLinux} from './linux-observer.mjs';

export const hasHistory=process.platform==='darwin';
export const backend=process.platform==='win32'?'windows':hasHistory?'fs-events':'inotify';
export function subscribe(root,callback){
  if(process.platform!=='darwin'&&process.platform!=='linux'&&process.platform!=='win32')
    throw Error(`filesystem observation is unavailable on ${process.platform}`);
  if(process.platform==='linux')return subscribeLinux(root,callback);
  if(process.platform==='win32')return parcelWatcher.subscribe(root,callback,{backend}).then(handle=>({
    unsubscribe:()=>handle.unsubscribe(),
    // This is not a continuity barrier. Decision-grade reads on Windows use
    // deterministic reconciliation, including after a watcher restart.
    synchronize:async()=>{},watchFiles:async()=>{}
  }));
  return parcelWatcher.subscribe(root,callback,{backend});
}
