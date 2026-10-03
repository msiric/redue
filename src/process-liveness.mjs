import fs from 'node:fs';

export function processAlive(pid) {
  if(!Number.isSafeInteger(pid)||pid<1)return true;
  if(process.platform==='linux')try{
    const stat=fs.readFileSync(`/proc/${pid}/stat`,'utf8');
    if(['Z','X'].includes(stat.slice(stat.lastIndexOf(')')+2)[0]))return false;
  }catch(e){if(e.code!=='ENOENT'&&e.code!=='ESRCH')return true;}
  try{process.kill(pid,0);return true;}
  catch(e){return e.code!=='ESRCH';}
}
