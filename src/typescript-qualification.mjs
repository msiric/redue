import {directProject,directQualification,directEnvironment} from './direct-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {realObservedPath} from './path-identity.mjs';

// This is a machine-enforced contract, not a claim inferred from a script name.
// Runtime validation checks effective compiler membership, configuration and
// toolchain identity. Supported discovery certificates still validate those
// filesystem queries; caller context is independently compared at the decision.
export function qualifyTypeScript(root,selected,discovered={}) {
  if(selected.qualification===directQualification){
    const issues=[];
    try{
      const compiler=directProject(root,selected.script);
      if(selected.command?.length!==3||selected.command[0]!==process.execPath||
        selected.command[1]!==compiler.entry||selected.command[2]!=='--noEmit'||
        selected.cwd&&selected.cwd!=='.')issues.push('direct compiler invocation changed');
    }catch(e){issues.push(e.code||'direct compiler prerequisites unavailable');}
    if(!selected.inputs?.includes('**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}')||
      !selected.inputs?.includes('package.json')||!selected.inputs?.includes('tsconfig.json')||
      !selected.installedInputs?.includes('node_modules/**'))issues.push('direct compiler source/config/installed inputs incomplete');
    if(!selected.environment?.executableIdentity||
      !directEnvironment.variables.every(key=>selected.environment?.variables?.includes(key))||
      !directEnvironment.prefixes.every(key=>selected.environment?.prefixes?.includes(key)))
      issues.push('direct compiler execution context incomplete');
    if(selected.probes?.length!==1||!selected.probes?.some(argv=>path.basename(argv[1]||'')==='direct-typescript-probe.mjs'&&
      argv[0]===process.execPath&&argv[2]===root&&argv[3]===selected.script))issues.push('direct compiler probe missing');
    return {qualified:issues.length===0,issues};
  }
  if(selected.qualification==='pnpm-tsc-v1'){
    const issues=[];
    const workspace=selected.workspace||'.';
    const script=selected.script||selected.command?.at(-1);
    try{
      if(discovered.issue)throw Error(discovered.issue);
      const contract=discovered.workspace;
      if(!contract)throw Error('pnpm TypeScript input discovery unavailable');
      issues.push(...contract.limitations);
      const declared=contract.workspace.pkg.scripts[script].trim().split(/\s+/).slice(1);
      if(path.resolve(root,selected.cwd||'.')!==path.join(root,contract.workspace.dir)||
        selected.command?.[0]!==process.execPath||
        selected.command?.[1]!==contract.tsc||
        JSON.stringify(selected.command.slice(2))!==JSON.stringify(declared))
        issues.push('standalone TypeScript invocation changed');
    }catch(e){issues.push(e.message);}
    if(!selected.probes?.some(argv=>path.basename(argv[1]||'')==='pnpm-typecheck-probe.mjs'))
      issues.push('pnpm TypeScript input probe missing');
    if(!selected.environment?.executableIdentity||
      !['node'].every(name=>selected.environment?.pathExecutables?.includes(name))||
      !['PNPM_','COREPACK_','npm_config_','DYLD_','TSGO_'].every(name=>
        selected.environment?.prefixes?.includes(name)))
      issues.push('pnpm execution context declaration incomplete');
    return {qualified:issues.length===0,issues};
  }
  if(selected.qualification==='yarn-workspace-tsc-v1'){
    const issues=[];
    try{
      if(!selected.workspace||selected.command?.length!==5||
        selected.command[1]!=='workspace'||selected.command[2]!==selected.workspace||
        selected.command[3]!=='run')issues.push('workspace command changed');
      else if(discovered.issue)throw Error(discovered.issue);
      else if(!discovered.workspace)throw Error('Yarn workspace input discovery unavailable');
    }catch(e){issues.push(e.message);}
    if(!selected.probes?.some(argv=>path.basename(argv[1]||'')==='yarn-workspace-typecheck-probe.mjs'))
      issues.push('workspace TypeScript input probe missing');
    if(!selected.environment?.executableIdentity||
      !['node','yarn'].every(name=>selected.environment?.pathExecutables?.includes(name))||
      !['YARN_','COREPACK_','npm_config_','DYLD_','TSGO_'].every(name=>
        selected.environment?.prefixes?.includes(name)))
      issues.push('Yarn execution context declaration incomplete');
    return {qualified:issues.length===0,issues};
  }
  if(selected.qualification!=='typescript-noemit-v1')return null;
  // Retired automatic launcher contract: npm's notifier consumes unobserved
  // remote/cache/time state. A successful execution is still an outcome.
  return {qualified:false,issues:['npm launcher applicability is unqualified: update notification uses unobserved remote/cache/time inputs; run the npm script when needed']};
}
