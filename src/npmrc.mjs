// An .npmrc file read as npm reads ini: comments, a BOM, `key = value`, a bare
// key as true, quotes stripped, true/false as booleans. {} when it is absent.
import fs from 'node:fs';

export function npmrc(file){
  const settings={};
  if(!fs.existsSync(file))return settings;
  for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
    const trimmed=line.trim();if(!trimmed||/^[#;]/.test(trimmed))continue;
    const at=trimmed.indexOf('='),key=(at<0?trimmed:trimmed.slice(0,at)).trim();
    let value=at<0?true:trimmed.slice(at+1).trim();
    if(typeof value==='string'&&/^(["']).*\1$/.test(value))value=value.slice(1,-1);
    settings[key]=value==='true'?true:value==='false'?false:value;
  }
  return settings;
}
