#!/usr/bin/env node
// Read-only applicability probe. Its output is one digest or a fixed reason;
// source, configuration, environment values, and command output are not logged.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {yarnWorkspaceTypecheckInputs} from './yarn-workspace-inputs.mjs';
import {withinPath as within} from './path-identity.mjs';
import {windowsLaunch} from './windows-command.mjs';

const [rootArg,workspace,script,yarnArg]=process.argv.slice(2);
const hash=value=>createHash('sha256').update(value).digest('hex');
const digestFile=file=>hash(fs.readFileSync(file));
const fail=code=>{throw Object.assign(Error(code),{code});};
function yarnDistribution(yarn,version){
  if(!/[/\\]corepack[/\\]dist[/\\]yarn\.js$/.test(yarn))return yarn;
  const candidates=[path.join(os.homedir(),'.cache/node/corepack/v1/yarn',version,'yarn.js'),
    path.join(os.homedir(),'Library/Caches/node/corepack/v1/yarn',version,'yarn.js')];
  const found=candidates.find(file=>fs.existsSync(file));
  if(!found)fail('yarn-distribution-unobservable');
  return found;
}
try{
  if(!rootArg||!workspace||!script||!yarnArg)fail('probe-arguments');
  const root=fs.realpathSync(rootArg),yarn=fs.realpathSync(yarnArg);
  const contract=yarnWorkspaceTypecheckInputs(root,workspace,script);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.BASH_ENV||
    process.env.ENV||Object.keys(process.env).some(key=>
      /^(YARN_|COREPACK_|npm_config_|DYLD_|TSGO_)/i.test(key)))
    fail('workspace-execution-environment-unsupported');
  const launch=windowsLaunch([yarn,'--version']);
  const version=spawnSync(launch.file,launch.args,{cwd:root,env:process.env,
    ...launch.options,
    encoding:'utf8',timeout:3000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
  if(version.error||version.signal||version.status!==0||
    `yarn@${version.stdout.trim()}`!==pkg.packageManager)
    fail('yarn-toolchain-unavailable');
  const cwd=path.join(root,contract.workspace.dir);
  const tsc=fs.realpathSync(path.join(root,'node_modules','.bin','tsc'));
  const listed=spawnSync(process.execPath,[tsc,'-p','.','--listFilesOnly'],
    {cwd,env:process.env,encoding:'utf8',timeout:4000,maxBuffer:16*1024*1024,
      stdio:['ignore','pipe','pipe']});
  if(listed.error||listed.signal||listed.status!==0)fail('typescript-input-list-unavailable');
  const inputs=listed.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>fs.realpathSync(file));
  if(!inputs.length)fail('typescript-input-list-unavailable');
  const selectedRoot=path.join(cwd,'src'),installedRoot=path.join(root,'node_modules');
  const nestedInstalled=[contract.workspace,...contract.closure]
    .map(member=>path.join(root,member.dir,'node_modules'));
  const generated=contract.generated.map(value=>path.join(root,value.slice(0,-3)));
  for(const file of inputs){
    const covered=within(file,installedRoot)||nestedInstalled.some(dir=>within(file,dir))||
      within(file,selectedRoot)||
      generated.some(dir=>within(file,dir));
    if(!covered||!within(file,root))fail('typescript-input-outside-workspace-contract');
  }
  const files=[...new Set(inputs)].sort().map(file=>
    [hash(path.relative(root,file)),digestFile(file)]);
  const configs=contract.configs.map(file=>[hash(file),digestFile(path.join(root,file))]);
  process.stdout.write(hash(JSON.stringify({schema:1,workspace,script,
    files,configs,yarnVersion:version.stdout.trim(),yarnShim:digestFile(yarn),
    yarnDistribution:digestFile(yarnDistribution(yarn,version.stdout.trim())),
    node:process.version,tsc:digestFile(tsc)})));
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:
  'workspace-typecheck-contract-unavailable'}`);process.exitCode=2;}
