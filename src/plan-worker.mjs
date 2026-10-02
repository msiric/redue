import {parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {discover} from './plan.mjs';
import {InputIndex} from './index.mjs';

try {
  const discoveryStarted=performance.now();
  const bundle=discover(JSON.parse(fs.readFileSync(workerData.config)),workerData.state);
  const discoveryMs=performance.now()-discoveryStarted;
  parentPort.postMessage({kind:'progress',phase:'indexing',discoveryMs,scanned:0,total:null});
  const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  let retained=null;
  try {
    retained=JSON.parse(fs.readFileSync(path.join(workerData.state,'index-v1.json')));
    const identity=fs.statSync(bundle.root,{bigint:true});
    if(retained.schema!==1||retained.root!==bundle.root||
      JSON.stringify(retained.identity)!==JSON.stringify([String(identity.dev),String(identity.ino)])||
      JSON.stringify(retained.planIds)!==JSON.stringify(Object.fromEntries(
        Object.entries(bundle.plans).map(([name,plan])=>[name,plan.id])))||
      retained.cursor!==digest(path.join(workerData.state,'fs-events.snapshot'))||
      Object.keys(retained.external||{}).length!==new Set(Object.values(bundle.plans)
        .flatMap(plan=>plan.externalObservationRoots||
          Object.keys(plan.externalPatterns||{}))).size||
      Object.entries(retained.external||{}).some(([root,value])=>
        value.cursor!==digest(path.join(workerData.state,
          `external-${createHash('sha256').update(root).digest('hex').slice(0,16)}.snapshot`))))
      retained=null;
  } catch {retained=null;}
  if(retained){
    parentPort.postMessage({ok:true,bundle,discoveryMs,indexingMs:0,
      restartMode:'retained-replay',index:retained.index,
      external:Object.fromEntries(Object.entries(retained.external||{})
        .map(([root,value])=>[root,value.index]))});
  } else {
  const indexingStarted=performance.now(), index=new InputIndex(bundle);
  index.coldScan(progress=>parentPort.postMessage({kind:'progress',phase:'indexing',
    discoveryMs,...progress}));
  const indexingMs=performance.now()-indexingStarted;
  if(index.unavailable)throw Error(index.unavailable);
  const external={};
  for(const boundary of [...new Set(Object.values(bundle.plans)
    .flatMap(plan=>plan.externalObservationRoots||
      Object.keys(plan.externalPatterns||{})))]) {
    const plans=Object.fromEntries(Object.entries(bundle.plans)
      .filter(([,plan])=>(plan.externalObservationRoots||
        Object.keys(plan.externalPatterns||{})).includes(boundary))
      .map(([name,plan])=>[name,{...plan,patterns:plan.externalPatterns[boundary],
        sourcePatterns:[],
        additivePatterns:plan.externalPatterns[boundary]||[],
        installedPhysicalRoots:[]}]));
    const outside=new InputIndex({root:boundary,plans},{trackGit:false,includeInstalled:true});
    outside.coldScan();
    if(outside.unavailable)throw Error(outside.unavailable);
    external[boundary]={files:[...outside.files],
      aliasDependencies:[...outside.aliasDependencies].map(([name,refs])=>[name,[...refs]]),
      rows:[...outside.checks]
      .map(([name,row])=>({name,files:[...row.files],sum:row.sum.toString('hex'),
        revision:row.revision,lastReason:row.lastReason})),
      eventCount:outside.eventCount,rehashedFiles:outside.rehashedFiles,
      rehashedBytes:outside.rehashedBytes,profile:outside.profile};
  }
  parentPort.postMessage({ok:true,bundle,discoveryMs,indexingMs,
    restartMode:'cold-index',
    external,
    index:{files:[...index.files],
      aliasDependencies:[...index.aliasDependencies].map(([name,refs])=>[name,[...refs]]),
      rows:[...index.checks].map(([name,row])=>({
      name,files:[...row.files],sum:row.sum.toString('hex'),revision:row.revision,
      lastReason:row.lastReason})),
    eventCount:index.eventCount,rehashedFiles:index.rehashedFiles,
    rehashedBytes:index.rehashedBytes,profile:index.profile}});
  }
} catch(error) {
  parentPort.postMessage({ok:false,error:error?.message||String(error),
    classification:error?.name||'Error'});
}
