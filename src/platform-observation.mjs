import parcelWatcher from '@parcel/watcher';
import {subscribeLinux} from './linux-observer.mjs';

export const hasHistory=process.platform==='darwin';
export const backend=hasHistory?'fs-events':'inotify';
export function subscribe(root,callback){
  if(process.platform!=='darwin'&&process.platform!=='linux')
    throw Error(`filesystem observation is unavailable on ${process.platform}`);
  return hasHistory?parcelWatcher.subscribe(root,callback,{backend}):
    subscribeLinux(root,callback);
}
