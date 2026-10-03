// Declared installed-input paths, link resolution, and permitted observation roots.
// Physical contents and membership are observed separately by InputIndex.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {normalizedPath,samePath,withinPath as within,realObservedPath} from './path-identity.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const posix=file=>file.split(path.sep).join('/');
export function resolveLinks(file,checkout,allowedRoots=[],allowFile=false) {
  const roots=[checkout,...allowedRoots],links=[],seen=new Set();
  let candidate=normalizedPath(file);
  for(let depth=0;depth<40;depth++){
    let current=path.parse(candidate).root,redirected=false;
    const parts=candidate.slice(current.length).split(path.sep).filter(Boolean);
    for(let i=0;i<parts.length;i++){
      current=path.join(current,parts[i]);
      let st;try{st=fs.lstatSync(current);}catch(e){
        return {physical:null,links,prospective:candidate,
          reason:e.code==='ENOENT'?'resolved target missing':
          `resolution unavailable: ${e.code||e.name}`};}
      if(!st.isSymbolicLink())continue;
      if(!roots.some(root=>within(current,root)))
        return {physical:null,links,reason:'link redirect outside observed roots'};
      if([...seen].some(previous=>samePath(previous,current)))
        return {physical:null,links,reason:'symlink cycle'};
      seen.add(current);
      const target=fs.readlinkSync(current),signature=hash(target);
      links.push({path:current,targetHash:signature});
      candidate=normalizedPath(path.resolve(path.dirname(current),target,...parts.slice(i+1)));
      redirected=true;break;
    }
    if(redirected)continue;
    if(!roots.some(root=>within(candidate,root)))
      return {physical:null,links,reason:'resolved target outside permitted roots'};
    let st;try{st=fs.statSync(candidate);}catch(e){
      return {physical:null,links,reason:e.code==='ENOENT'?'resolved target missing':
        `resolution unavailable: ${e.code||e.name}`};}
    if(!st.isDirectory()&&!(allowFile&&st.isFile()))
      return {physical:null,links,reason:'resolved input has unsupported type'};
    return {physical:candidate,links,reason:null};
  }
  return {physical:null,links,reason:'symlink resolution depth exceeded'};
}

export function permittedRoots(root,values=[]) {
  const allowed=[];
  for(const value of values) {
    if(typeof value!=='string'||!path.isAbsolute(value))
      throw Error('external observation root must be absolute');
    const real=realObservedPath(value);
    if([path.parse(real).root,os.homedir()].includes(real)||within(root,real))
      throw Error('external observation root is too broad');
    if(!within(real,root))allowed.push(real);
  }
  return [...new Set(allowed)];
}

export function resolveDeclaredInstalled(root,patterns,allowed=[]) {
  const result={internalPatterns:[],externalPatterns:{},links:[],triggers:[],
    unresolved:[],mappings:[],physicalRoots:[]};
  const internal=new Set(),external=new Map(),links=new Map(),triggers=new Set(),roots=new Set();
  for(const pattern of patterns||[]) {
    const negative=pattern.startsWith('!'),raw=negative?pattern.slice(1):pattern;
    // Exclusions must also apply at the logical link location. The mapped
    // physical exclusion alone cannot stop a broad installed-tree scan from
    // trying to hash a workspace directory symlink as a file.
    if(negative)internal.add(pattern);
    const parts=raw.split('/'),fixed=[];
    for(const part of parts){if(/[?*[{(]/.test(part))break;fixed.push(part);}
    if(!fixed.length){internal.add(pattern);continue;}
    const prefix=fixed.join('/'),suffix=parts.slice(fixed.length).join('/'),
      logical=path.join(root,prefix);
    const resolved=resolveLinks(logical,root,allowed,!suffix);
    for(const link of resolved.links){links.set(link.path,link);
      if(within(link.path,root))triggers.add(posix(path.relative(root,link.path)));}
    if(!resolved.physical){
      if(resolved.reason==='resolved target missing'&&!resolved.links.length){
        internal.add(pattern);continue;}
      result.unresolved.push(`${prefix}: ${resolved.reason}`);continue;
    }
    const boundary=within(resolved.physical,root)?root:
      allowed.find(allowedRoot=>within(resolved.physical,allowedRoot));
    if(!boundary){result.unresolved.push(`${prefix}: resolved target outside permitted roots`);continue;}
    if(boundary!==root&&resolved.physical===boundary){
      result.unresolved.push(`${prefix}: external target needs a stable permitted parent root`);continue;}
    const rel=posix(path.relative(boundary,resolved.physical));
    const directory=fs.statSync(resolved.physical).isDirectory();
    const mapped=(negative?'!':'')+(suffix?(rel?rel+'/':'')+suffix:
      directory?(rel?rel+'/**':'**/*'):rel);
    if(boundary===root)internal.add(mapped);
    else {if(!external.has(boundary))external.set(boundary,new Set());
      external.get(boundary).add(mapped);}
    if(!negative)roots.add(resolved.physical);
    result.mappings.push({logical:pattern,physical:resolved.physical,root:boundary,
      links:resolved.links.map(link=>link.path)});
  }
  result.internalPatterns=[...internal].sort();
  result.externalPatterns=Object.fromEntries([...external].map(([key,values])=>[key,[...values].sort()]));
  result.links=[...links.values()].sort((a,b)=>a.path.localeCompare(b.path));
  result.triggers=[...triggers].sort();result.physicalRoots=[...roots].sort();
  return result;
}
