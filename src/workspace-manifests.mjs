// Workspace package manifests: package.json files Git tracks or would add,
// in directories that match the workspace patterns, outside node_modules.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {patternMatcher} from './glob.mjs';

export function workspaceManifests(root,patterns) {
  const listing=spawnSync('git',['ls-files','--cached','--others','--exclude-standard',
    '-z','--',':(glob)**/package.json'],{cwd:root,encoding:'utf8',timeout:5000,
    maxBuffer:32*1024*1024,stdio:['ignore','pipe','ignore'],
    env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
  if(listing.status!==0||listing.error)throw Error('workspace package manifests cannot be inspected');
  // `!pattern` entries exclude, as in pnpm-workspace.yaml.
  const included=patternMatcher(patterns);
  const matched=listing.stdout.split('\0').filter(Boolean).filter(file=>{
    const dir=path.posix.dirname(file);
    return dir!=='.'&&!dir.split('/').includes('node_modules')&&included(dir);
  }).sort();
  if(matched.length>50)throw Error('more than 50 workspace packages found; select checks explicitly');
  return matched.map(file=>({file,pkg:JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))}));
}
