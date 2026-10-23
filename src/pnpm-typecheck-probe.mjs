#!/usr/bin/env node
// Read-only pnpm/TypeScript applicability probe. Only a digest or fixed
// diagnostic leaves the process; no source, configuration, or environment
// value is emitted.
import {contextOnly,probeResult} from './probe-result.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pnpmTypecheckInputs} from './pnpm-inputs.mjs';
import {patternMatcher} from './glob.mjs';
import {withinPath as within,realObservedPath} from './path-identity.mjs';
import {runFromArgv} from './typescript-invocation.mjs';

const [rootArg,workspace,...rest]=process.argv.slice(2).filter(value=>!value.startsWith('--redue-'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const digest=file=>hash(fs.readFileSync(file));
const fail=code=>{throw Object.assign(Error(code),{code});};
try{
  if(!rootArg||!workspace)fail('probe-arguments');
  const run=runFromArgv(rest);
  const root=realObservedPath(rootArg);
  if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.BASH_ENV||
    process.env.ENV||Object.entries(process.env).some(([key,value])=>{
      if(/^npm_config_prefix$/i.test(key)&&process.platform==='win32'){
        return !path.isAbsolute(value);
      }
      return /^(PNPM_|COREPACK_|npm_config_|DYLD_|TSGO_)/i.test(key);
    }))
    fail('pnpm-execution-environment-unsupported');
  const contextHash=hash(JSON.stringify([root,workspace,run,process.version]));
  if(contextOnly(contextHash))process.exit(0);
  const contract=pnpmTypecheckInputs(root,workspace,run,{captureQueries:process.argv.includes('--redue-checkpoint')});
  if(contract.limitations.length)fail('pnpm-input-coverage-unavailable');
  const selected=path.join(root,contract.workspace.dir),tsc=contract.tsc;
  const inputs=contract.listedFiles;
  if(!inputs.length)fail('typescript-input-list-unavailable');
  const inputRoots=[...contract.generated.map(pattern=>
    path.join(root,pattern.slice(0,-3))),...contract.installed.filter(p=>!p.startsWith('!'))
      .map(pattern=>path.join(root,pattern.slice(0,-3)))];
  const isSource=patternMatcher(contract.sourcePatterns);
  for(const file of inputs)if(!within(file,root)||
    !isSource(path.relative(root,file).split(path.sep).join('/'))&&
    !inputRoots.some(boundary=>within(file,boundary)))
    fail('typescript-input-outside-pnpm-contract');
  const files=[...new Set(inputs)].sort().map(file=>
    [hash(path.relative(root,file)),digest(file)]);
  const configs=contract.configs.map(file=>[hash(file),digest(path.join(root,file))]);
  probeResult(hash(JSON.stringify({schema:1,workspace,run,
    files,configs,node:process.version,tsc:digest(tsc),
    packageManager:contract.install.version,linker:contract.install.linker})),contextHash,contract.discoveryQueries);
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:
  'pnpm-typecheck-contract-unavailable'}`);process.exitCode=2;}
