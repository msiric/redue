// Local/CI diagnostic reader for opt-in REDUE_TIMING records. No raw paths or
// command output are retained in the summary.
import fs from 'node:fs';

const values=new Map();
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
