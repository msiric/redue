// A single-project plan. Declarations are explicit;
// this provider does not infer complete coverage from a successful command.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {permittedRoots,resolveDeclaredInstalled} from './installed-inputs.mjs';
import {qualifyTypeScript} from './typescript-qualification.mjs';
import {yarnWorkspaceTypecheckInputs} from './yarn-workspace-inputs.mjs';
import {pnpmTypecheckInputs} from './pnpm-inputs.mjs';
import {observedRelative,withinPath,realObservedPath} from './path-identity.mjs';
import {timing} from './decision-profile.mjs';

const identity=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const safePattern=value=>{
  if(typeof value!=='string'||!value)throw Error('input pattern must be nonempty');
  const raw=value.startsWith('!')?value.slice(1):value;
  if(!raw||path.isAbsolute(raw)||raw.split(/[\\/]/).includes('..'))
    throw Error(`unsafe repository-relative input pattern: ${value}`);
  return value;
};

export function discoverDeclared(config) {
  const root=realObservedPath(config.root),plans={},configurationInputs=new Set(),
    workspaceManifests=new Set(),workspacePatterns=new Set();
  if(!Array.isArray(config.checks)||!config.checks.length)throw Error('selected checks required');
  for(const selected of config.checks){
    if(typeof selected.name!=='string'||!selected.name||plans[selected.name])
      throw Error('check names must be unique nonempty strings');
    if(!Array.isArray(selected.command)||!selected.command.length||
      !selected.command.every(item=>typeof item==='string'&&item))
      throw Error(`exact command required for ${selected.name}`);
    const cwd=path.resolve(root,selected.cwd||'.');
    if(!withinPath(cwd,root))throw Error('check cwd escapes checkout');
    for(const key of ['inputs','generatedInputs','installedInputs']){
      if(!Array.isArray(selected[key]||[]))throw Error(`${key} must be a path-pattern array`);
      for(const value of selected[key]||[])safePattern(value);
    }
    if(!selected.inputs?.some(value=>!value.startsWith('!')))
      throw Error(`positive source inputs required for ${selected.name}`);
    for(const argv of selected.probes||[])if(!Array.isArray(argv)||!argv.length||
      !argv.every(value=>typeof value==='string'&&value))
      throw Error('state probes must be exact nonempty argv arrays');
    if(!Array.isArray(selected.environment?.variables||[])||
      !(selected.environment?.variables||[]).every(value=>typeof value==='string'&&value))
      throw Error('environment variables must be a string array');
    if(!Array.isArray(selected.environment?.prefixes||[])||
      !(selected.environment?.prefixes||[]).every(value=>
        typeof value==='string'&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)))
      throw Error('environment prefixes must be simple nonempty names');
    if(!Array.isArray(selected.environment?.pathExecutables||[])||
      !(selected.environment?.pathExecutables||[]).every(value=>
        typeof value==='string'&&/^[A-Za-z_][A-Za-z0-9_-]*$/.test(value)))
      throw Error('PATH executables must be simple command names');
    const allowedRoots=permittedRoots(root,selected.allowedExternalRoots||[]);
    let workspace=null,workspaceIssue=null;
    const workspaceStarted=performance.now();
    if(selected.qualification==='yarn-workspace-tsc-v1'){
      try{workspace=yarnWorkspaceTypecheckInputs(root,selected.workspace,
        selected.command[4]);}
      catch(e){workspaceIssue=e.message;}
    }
    if(selected.qualification==='pnpm-tsc-v1'){
      try{workspace=pnpmTypecheckInputs(root,selected.workspace||'.',
        selected.script||selected.command.at(-1));}
      catch(e){workspaceIssue=e.message;}
    }
    timing('plan.workspace_inputs',workspaceStarted,{available:workspace?1:0});
    const installedStarted=performance.now();
    const installed=resolveDeclaredInstalled(root,
      [...(selected.installedInputs||[]),...(workspace?.installed||[])],allowedRoots);
    timing('plan.installed_resolution',installedStarted,{mappings:installed.mappings.length});
    const automatic=qualifyTypeScript(root,selected,
      {workspace,issue:workspaceIssue});
    const sourcePatterns=[...new Set([...selected.inputs,...(workspace?.source||[]),
      ...(workspace?.generated||[])])].sort();
    const additivePatterns=[...new Set([...(selected.generatedInputs||[]),
      ...installed.internalPatterns])].sort();
    const unresolved=[...installed.unresolved,...(automatic?.issues||[]),
      ...(workspace?.limitations||[]),
      ...(workspaceIssue?[workspaceIssue]:[])];
    for(const item of workspace?.configurationInputs||[])configurationInputs.add(item);
    for(const item of workspace?.workspacePatterns||[])workspacePatterns.add(item);
    for(const item of workspace?.closure||[])workspaceManifests.add(item.manifest);
    if(!automatic)for(const category of ['source','generated','installedDependencies',
      'environment','toolchain','runtime'])if(!selected.coverage?.[category])
      unresolved.push(selected.coverageReasons?.[category]||
        `${category} coverage not reviewed for this command`);
    if((selected.probes||[]).length&&!automatic&&!selected.coverage?.probeContinuity)
      unresolved.push('probe state continuity during execution not established');
    const installedPhysicalRoots=[...new Set(installed.physicalRoots
      .filter(file=>withinPath(file,root)&&observedRelative(root,file)!=='')
      .map(file=>observedRelative(root,file)))].sort();
    const externalPatterns=installed.externalPatterns;
    const plan={name:selected.name,provider:'declared-project@1',inputResolutionVersion:1,
      root,cwd,selectedConfigHash:identity(selected),command:selected.command,
      target:selected.name,taskCommand:null,taskGraph:[],
      patterns:[...new Set([...sourcePatterns,...additivePatterns])].sort(),
      sourcePatterns,additivePatterns,generated:[],
      declaredGeneratedInputs:[...new Set([...(selected.generatedInputs||[]),
        ...(workspace?.generated||[])])].sort(),
      declaredInstalledInputs:[...new Set([...(selected.installedInputs||[]),
        ...(workspace?.installed||[])])].sort(),
      installation:workspace?.installation||null,
      ...(workspace?.synchronizedInstalledRead?{synchronizedInstalledRead:true}:{}),
      installedInstances:workspace?.installedInstances||[],
      resolutionCandidates:[],resolutionFindings:workspace?.absences||[],
      installedPhysicalRoots,externalPatterns,
      externalObservationRoots:Object.keys(externalPatterns).sort(),
      resolutionLinks:installed.links,
      resolutionTriggers:[...new Set([...installed.triggers,
        ...(workspace?.linkTriggers||[]),
        ...(workspace?.resolutionCandidates||[]).map(row=>row.path)])],
      installedMappings:installed.mappings,effectiveEnvironmentGlobs:{},
      probes:selected.probes||[],environment:selected.environment||{},
      qualification:selected.qualification||null,
      executionProvenance:'declared-command',
      unresolved:[...new Set(unresolved)].sort()};
    plan.resolutionCandidates=workspace?.resolutionCandidates||[];
    plan.id=identity(plan);plans[selected.name]=plan;
  }
  return {schema:1,provider:'declared-project@1',root,plans,discoveredAt:Date.now(),
    workspaceCount:1,workspacePatterns:[...workspacePatterns],
    configurationInputs:[...configurationInputs].sort(),
    workspaceManifests:[...workspaceManifests].sort()};
}
