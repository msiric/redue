import fs from 'node:fs';
import path from 'node:path';
import {yarnWorkspaceTypecheckInputs} from './yarn-workspace-inputs.mjs';

// This is a machine-enforced contract, not a claim inferred from a script name.
// The read-only runtime probe separately checks the effective TypeScript file
// list, config graph, npm toolchain and caller context on every sync/run.
export function qualifyTypeScript(root,selected) {
  if(selected.qualification==='yarn-workspace-tsc-v1'){
    const issues=[];
    try{
      if(!selected.workspace||selected.command?.length!==5||
        selected.command[1]!=='workspace'||selected.command[2]!==selected.workspace||
        selected.command[3]!=='run')issues.push('workspace command changed');
      else yarnWorkspaceTypecheckInputs(root,selected.workspace,selected.command[4]);
    }catch(e){issues.push(e.message);}
    if(!selected.probes?.some(argv=>argv[1]?.endsWith('/yarn-workspace-typecheck-probe.mjs')))
      issues.push('workspace TypeScript input probe missing');
    if(!selected.environment?.executableIdentity||
      !['node','yarn'].every(name=>selected.environment?.pathExecutables?.includes(name))||
      !['YARN_','COREPACK_','npm_config_','DYLD_','TSGO_'].every(name=>
        selected.environment?.prefixes?.includes(name)))
      issues.push('Yarn execution context declaration incomplete');
    return {qualified:issues.length===0,issues};
  }
  if(selected.qualification!=='typescript-noemit-v1')return null;
  const issues=[];
  let pkg;
  try{pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));}
  catch{issues.push('package manifest unavailable');}
  if(!selected.script||pkg?.scripts?.[selected.script]?.trim()!=='tsc --noEmit'||
    pkg?.scripts?.['pre'+selected.script]||pkg?.scripts?.['post'+selected.script])
    issues.push('typecheck script is not the supported standalone tsc --noEmit invocation');
  if(selected.command?.length!==3||selected.command[1]!=='run'||
    selected.command[2]!==selected.script)
    issues.push('package-manager invocation differs from the discovered script');
  try{const npm=fs.realpathSync(selected.command[0]);
    if(path.basename(npm)!=='npm-cli.js'||
      path.basename(path.dirname(path.dirname(npm)))!=='npm')
      issues.push('npm executable layout is not supported');}
  catch{issues.push('npm executable unavailable');}
  if(!fs.existsSync(path.join(root,'tsconfig.json')))
    issues.push('tsconfig.json is missing');
  if(!fs.existsSync(path.join(root,'node_modules','typescript','package.json'))||
    !fs.existsSync(path.join(root,'node_modules','.bin','tsc')))
    issues.push('local TypeScript installation is missing');
  if(!selected.inputs?.includes('**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}')||
    !selected.inputs?.includes('package.json')||
    !selected.inputs?.includes('tsconfig.json'))
    issues.push('TypeScript source/config file-set declaration is incomplete');
  if(!selected.installedInputs?.includes('node_modules/**'))
    issues.push('installed package contents and membership are not declared');
  if(!selected.environment?.executableIdentity||
    !['node','npm'].every(name=>selected.environment?.pathExecutables?.includes(name))||
    !['NODE_OPTIONS','NODE_PATH','HOME','BASH_ENV','ENV'].every(name=>
      selected.environment?.variables?.includes(name))||
    !['npm_config_','DYLD_','TSGO_'].every(name=>
      selected.environment?.prefixes?.includes(name)))
    issues.push('caller toolchain or execution context declaration is incomplete');
  if(!selected.probes?.some(argv=>argv[1]?.endsWith('/typescript-contract-probe.mjs')&&
    argv[2]===root&&argv[3]===selected.script&&argv[4]===selected.command[0]))
    issues.push('TypeScript input and toolchain probe is missing');
  return {qualified:issues.length===0,issues};
}
