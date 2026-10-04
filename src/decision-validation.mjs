// Deterministic reuse keys for already-resolved plans. These are not receipts
// or a second content cache: the existing InputIndex still reads current bytes
// and membership. A changed key falls back to provider discovery.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import micromatch from 'micromatch';
import {sha} from './plan.mjs';

export function inputKey(row) {
  return sha(JSON.stringify([row.plan.id,row.files.size,row.sum.toString('hex')]));
}
export function planGuard(bundle) {
  const root=bundle.root;
  const paths=new Set(['package.json','package-lock.json','.npmrc','.yarnrc.yml',
    'pnpm-workspace.yaml','.pnpmfile.cjs','.pnpmfile.mjs',
    ...bundle.workspaceManifests||[],...bundle.configurationInputs||[],
    ...Object.values(bundle.plans).flatMap(plan=>plan.resolutionTriggers||[])]);
  const patterns=bundle.workspacePatterns?.length?bundle.workspacePatterns:
    (()=>{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
      return Array.isArray(pkg.workspaces)?pkg.workspaces:pkg.workspaces?.packages||[];})();
  if(patterns.length){
    const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard',
      '-z','--',':(glob)**/package.json'],{cwd:root,
      env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},timeout:5000,maxBuffer:32*1024*1024})
      .toString().split('\0').filter(Boolean);
    for(const file of files)if(micromatch.isMatch(path.posix.dirname(file),patterns,{dot:true}))
      paths.add(file);
  }
  const values=[...paths].sort().map(rel=>{
    const file=path.isAbsolute(rel)?rel:path.join(root,rel);
    try{const st=fs.lstatSync(file,{bigint:true});
      if(st.isSymbolicLink())return [rel,'link',fs.readlinkSync(file)];
      if(st.isDirectory())return [rel,'directory',String(st.dev),String(st.ino)];
      if(!st.isFile())throw Error('unobservable plan dependency');
      return [rel,sha(fs.readFileSync(file))];
    }catch(e){if(e.code==='ENOENT')return [rel,'missing'];throw e;}
  });
  const rootStat=fs.statSync(root,{bigint:true});
  return sha(JSON.stringify([String(rootStat.dev),String(rootStat.ino),values]));
}
