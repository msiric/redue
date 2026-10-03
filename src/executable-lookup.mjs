import fs from 'node:fs';
import path from 'node:path';

// Resolve the same project-local PATH that will be used for execution. Windows
// command shims have no extension in package scripts but normally end in .cmd.
export function findExecutable(name,{platform=process.platform,env=process.env,
  cwd=process.cwd(),paths=path,access=fs.accessSync,realpath=fs.realpathSync}={}) {
  if(!name||paths.basename(name)!==name)return null;
  const suffixes=platform==='win32'&&!paths.extname(name)?
    ['',...(env.PATHEXT||'.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)]:[''];
  for(const folder of (env.PATH||'').split(paths.delimiter))for(const suffix of suffixes) {
    const candidate=paths.join(folder||cwd,name+suffix);
    try{access(candidate,fs.constants.X_OK);return realpath(candidate);}catch{}
  }
  return null;
}
