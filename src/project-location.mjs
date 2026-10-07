// Shared project selection only; evidence and caller-context semantics stay in the kernel.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {realObservedPath} from './path-identity.mjs';
import {stateIdentity,userStateBase} from './platform-state.mjs';

export function discoverConfig(cwd=process.cwd()) {
  let dir=path.resolve(cwd);const found=[];
  for(;;){
    for(const name of ['redue.config.json','vstate.config.json']) {
      const file=path.join(dir,name);
      if(fs.existsSync(file))found.push(file);
    }
    if(fs.existsSync(path.join(dir,'.git'))||path.dirname(dir)===dir)break;
    dir=path.dirname(dir);
  }
  if(found.length>1)throw Error('multiple REDUE configurations apply; select the intended one with --config FILE');
  return found[0]||path.resolve(cwd,'redue.config.json');
}
export function canonicalConfig(configFile) {
  return path.join(realObservedPath(path.dirname(configFile)),path.basename(configFile));
}
export function projectState(root,configFile) {
  return path.join(userStateBase(process.platform,process.env,os.homedir()),'vstate',
    `vstate-${createHash('sha256').update(stateIdentity(root)+'\0'+stateIdentity(canonicalConfig(configFile))).digest('hex').slice(0,16)}`);
}
export function readProject(configFile) {
  const config=JSON.parse(fs.readFileSync(configFile,'utf8'));
  if(config.schema!==1||!Array.isArray(config.checks)||!config.checks.length)
    throw Error('config needs schema 1 and at least one check');
  return {config,root:realObservedPath(path.resolve(path.dirname(configFile),config.root||'.'))};
}
