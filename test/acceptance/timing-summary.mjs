// Local/CI diagnostic reader for opt-in REDUE_TIMING records. No raw paths or
// command output are retained in the summary.
import fs from 'node:fs';

const values=new Map();
const counts=new Map();
const reasons=new Map();
let peakRssMiB=0;
for(const file of process.argv.slice(2)){
  if(!fs.existsSync(file))continue;
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const at=line.indexOf('REDUE_TIMING ');
    if(at<0)continue;
    let entry;try{entry=JSON.parse(line.slice(at+13));}catch{continue;}
    if(typeof entry.phase!=='string'||typeof entry.ms!=='number')continue;
    if(!values.has(entry.phase))values.set(entry.phase,[]);
    values.get(entry.phase).push(entry.ms);
    for(const key of ['reason','outcome','reused'])if(entry[key]!==undefined){
      const label=entry.phase+'.'+key+':'+entry[key];reasons.set(label,(reasons.get(label)||0)+1);}
    for(const key of ['files','bytes','entries','packages','checks','inputFiles'])
      if(typeof entry[key]==='number'){
        const label=`${entry.phase}.${key}`;
        counts.set(label,Math.max(counts.get(label)||0,entry[key]));
      }
    peakRssMiB=Math.max(peakRssMiB,entry.rssMiB||0);
  }
}
const quantile=(sorted,p)=>sorted[Math.ceil(sorted.length*p)-1];
for(const [phase,samples] of [...values].sort(([a],[b])=>a.localeCompare(b))){
  const sorted=samples.sort((a,b)=>a-b);
  console.log(JSON.stringify({phase,n:sorted.length,
    p50:quantile(sorted,.5),p90:quantile(sorted,.9),
    p95:quantile(sorted,.95),max:sorted.at(-1)}));
}
console.log(JSON.stringify({peakSampledRssMiB:peakRssMiB}));
console.log(JSON.stringify({maximumPhaseCounts:Object.fromEntries([...counts].sort())}));
console.log(JSON.stringify({phaseReasons:Object.fromEntries([...reasons].sort())}));
