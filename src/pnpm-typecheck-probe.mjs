#!/usr/bin/env node
// Read-only pnpm/TypeScript applicability probe. Only a digest or fixed
// diagnostic leaves the process; no source, configuration, or environment
// value is emitted.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pnpmTypecheckInputs} from './pnpm-inputs.mjs';
import {withinPath as within,realObservedPath} from './path-identity.mjs';

const [rootArg,workspace,script]=process.argv.slice(2);
const hash=value=>createHash('sha256').update(value).digest('hex');
const digest=file=>hash(fs.readFileSync(file));
const fail=code=>{throw Object.assign(Error(code),{code});};
try{
  if(!rootArg||!workspace||!script)fail('probe-arguments');
  const root=realObservedPath(rootArg);
  if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.BASH_ENV||
    process.env.ENV||Object.entries(process.env).some(([key,value])=>{
      if(/^npm_config_prefix$/i.test(key)&&process.platform==='win32'){
        try{return realObservedPath(value)!==path.dirname(realObservedPath(process.execPath));}
        catch{return true;}
      }
      return /^(PNPM_|COREPACK_|npm_config_|DYLD_|TSGO_)/i.test(key);
    }))
    fail('pnpm-execution-environment-unsupported');
  const contract=pnpmTypecheckInputs(root,workspace,script);
  if(contract.limitations.length)fail('pnpm-input-coverage-unavailable');
  const selected=path.join(root,contract.workspace.dir),tsc=contract.tsc;
  const listed=spawnSync(process.execPath,[tsc,'-p','tsconfig.json','--listFilesOnly'],
    {cwd:selected,env:process.env,encoding:'utf8',timeout:5000,maxBuffer:32*1024*1024,
      stdio:['ignore','pipe','pipe']});
  if(listed.error||listed.signal||listed.status!==0)
    fail('typescript-input-list-unavailable');
  const inputs=listed.stdout.trim().split(/\r?\n/).filter(Boolean)
    .map(file=>realObservedPath(file));
  if(!inputs.length)fail('typescript-input-list-unavailable');
  const inputRoots=[path.join(selected,'src'),...contract.generated.map(pattern=>
    path.join(root,pattern.slice(0,-3))),...contract.installed.filter(p=>!p.startsWith('!'))
      .map(pattern=>path.join(root,pattern.slice(0,-3)))];
  for(const file of inputs)if(!within(file,root)||
    !inputRoots.some(boundary=>within(file,boundary)))
    fail('typescript-input-outside-pnpm-contract');
  const files=[...new Set(inputs)].sort().map(file=>
    [hash(path.relative(root,file)),digest(file)]);
  const configs=contract.configs.map(file=>[hash(file),digest(path.join(root,file))]);
  process.stdout.write(hash(JSON.stringify({schema:1,workspace,script,
    files,configs,node:process.version,tsc:digest(tsc),
    packageManager:contract.install.version,linker:contract.install.linker})));
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:
  'pnpm-typecheck-contract-unavailable'}`);process.exitCode=2;}
