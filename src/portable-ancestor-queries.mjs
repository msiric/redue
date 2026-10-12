// Local discovery projection only. This neither subscribes to outside roots nor
// supplies interval observation, producer trust, PASS, or reuse authority.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical} from './portable-envelope.mjs';

export const ancestorQueriesInterpretation='redue-ancestor-queries@1';
export const ancestorQueryLimits=Object.freeze({queries:8192,nodes:100000,depth:16,path:4096,chain:64});
const fail=code=>{throw Object.assign(Error(code),{code});};
const sha=value=>createHash('sha256').update(canonical(value)).digest('hex');
const within=(file,root)=>file===root||file.startsWith(root.endsWith(path.sep)?root:root+path.sep);
const safeAbsolute=file=>typeof file==='string'&&file.length<=ancestorQueryLimits.path&&
  path.isAbsolute(file)&&path.resolve(file)===file&&!/[\\\0:]/.test(file);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function cloneData(value){
  let nodes=0;
  const visit=(item,depth)=>{
    if(++nodes>ancestorQueryLimits.nodes||depth>ancestorQueryLimits.depth)fail('PORTABLE_ANCESTOR_LIMIT');
    if(item===undefined)return null;
    if(item===null||typeof item==='boolean'||typeof item==='number'||typeof item==='string')return item;
    if(typeof item!=='object'||(!Array.isArray(item)&&![null,Object.prototype].includes(Object.getPrototypeOf(item))))
      fail('PORTABLE_ANCESTOR_QUERY');
    const keys=Object.keys(item);
    if(Array.isArray(item)&&keys.length!==item.length)fail('PORTABLE_ANCESTOR_QUERY');
    const result=Array.isArray(item)?[]:{};
    for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(item,key);
      if(!descriptor||!Object.hasOwn(descriptor,'value')||['__proto__','prototype','constructor'].includes(key))fail('PORTABLE_ANCESTOR_QUERY');
      result[key]=visit(descriptor.value,depth+1);}
    return result;
  };
  const result=visit(value,0);canonical(result);return result;
}
const identity=stat=>({dev:String(stat.dev),ino:String(stat.ino),mode:String(stat.mode)});
function inspectPath(file){
  if(!safeAbsolute(file))fail('PORTABLE_ANCESTOR_PATH');
  let current=path.parse(file).root,lastDirectory=current;
  const present=[];
  const components=file.slice(current.length).split(path.sep).filter(Boolean);
  const base=fs.lstatSync(current,{bigint:true});
  if(!base.isDirectory()||base.isSymbolicLink())fail('PORTABLE_ANCESTOR_PATH');
  present.push([current,identity(base)]);
  for(const component of components){
    if(component==='.'||component==='..')fail('PORTABLE_ANCESTOR_PATH');
    current=path.join(current,component);
    let stat;
    try{stat=fs.lstatSync(current,{bigint:true});}
    catch(error){if(error.code==='ENOENT')return {exists:false,watchRoot:lastDirectory,present};
      if(error.code==='ENOTDIR')fail('PORTABLE_ANCESTOR_PATH');throw error;}
    if(stat.isSymbolicLink())fail('PORTABLE_ANCESTOR_SYMLINK');
    present.push([current,identity(stat)]);
    if(stat.isDirectory())lastDirectory=current;
    else if(current!==file)fail('PORTABLE_ANCESTOR_PATH');
    if(current===file)return {exists:true,stat,watchRoot:lastDirectory,present};
  }
  return {exists:true,stat:base,watchRoot:current,present};
}
function rootRelative(root,file){
  if(!safeAbsolute(file)||!within(file,root))fail('PORTABLE_ANCESTOR_PATH');
  inspectPath(file);
  return path.relative(root,file).split(path.sep).join('/')||'.';
}
function normalizeInside(root,value){
  if(typeof value==='string'&&path.isAbsolute(value))return rootRelative(root,value);
  if(Array.isArray(value))return value.map(item=>normalizeInside(root,item));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalizeInside(root,item)]));
  return value;
}
function ancestry(root){
  const parents=[];let current=root;
  while(path.dirname(current)!==current){current=path.dirname(current);parents.push(current);
    if(parents.length>ancestorQueryLimits.chain)fail('PORTABLE_ANCESTOR_LIMIT');}
  return parents;
}
function queryShape(row){
  if(!Array.isArray(row)||![3,4].includes(row.length)||typeof row[0]!=='string'||!safeAbsolute(row[1]))fail('PORTABLE_ANCESTOR_QUERY');
  const [kind,,answer,options]=row;
  if(['fileExists','directoryExists'].includes(kind)){
    if(row.length!==3||![null,false,true].includes(answer))fail('PORTABLE_ANCESTOR_QUERY');
  }else if(kind==='readFile'){
    if(row.length!==3||(answer!==null&&(typeof answer!=='string'||!/^([a-f0-9]{64})$/.test(answer))))fail('PORTABLE_ANCESTOR_QUERY');
  }else if(kind==='realpath'){
    if(row.length!==3||(answer!==null&&!safeAbsolute(answer)))fail('PORTABLE_ANCESTOR_QUERY');
  }else if(['directories','entries'].includes(kind)){
    if(row.length!==3||(answer!==null&&!Array.isArray(answer)))fail('PORTABLE_ANCESTOR_QUERY');
  }else if(kind==='readDirectory'){
    if(row.length!==4||!Array.isArray(answer)||!options||Array.isArray(options)||
      canonical(Object.keys(options).sort())!==canonical(['args','argsVersion','tsRoot','undefinedArguments'])||
      options.argsVersion!==1||!safeAbsolute(options.tsRoot)||!Array.isArray(options.args)||
      !Array.isArray(options.undefinedArguments)||options.undefinedArguments.some(n=>!Number.isInteger(n)||n<0||n>=options.args.length)||
      new Set(options.undefinedArguments).size!==options.undefinedArguments.length)fail('PORTABLE_ANCESTOR_QUERY');
  }else fail('PORTABLE_ANCESTOR_QUERY');
}
export function derivePortableAncestorQueries(root,queries){
  if(process.platform==='win32'||!safeAbsolute(root)||root===path.parse(root).root)fail('PORTABLE_ANCESTOR_PATH');
  const original=cloneData(queries);
  if(!Array.isArray(original)||!original.length||original.length>ancestorQueryLimits.queries)fail('PORTABLE_ANCESTOR_LIMIT');
  const rootState=inspectPath(root);
  if(!rootState.exists||!rootState.stat.isDirectory())fail('PORTABLE_ANCESTOR_PATH');
  const parents=ancestry(root),seen=new Set(),scopes=new Map(),guards=new Map(rootState.present),normalized=[],external=[];
  const retain=rows=>{for(const [file,value] of rows){if(guards.has(file)&&canonical(guards.get(file))!==canonical(value))fail('PORTABLE_ANCESTOR_CHANGED');guards.set(file,value);}};
  for(const row of original){
    queryShape(row);const [kind,file,answer]=row;
    const key=canonical([kind,file,row[3]??null]);
    if(seen.has(key))fail('PORTABLE_ANCESTOR_DUPLICATE');seen.add(key);
    if(within(file,root)){normalized.push(normalizeInside(root,row));continue;}
    if(row.length!==3||!['fileExists','directoryExists'].includes(kind))fail('PORTABLE_ANCESTOR_EXTERNAL_QUERY');
    const at=parents.findIndex(parent=>within(file,path.join(parent,'node_modules')));
    if(at<0)fail('PORTABLE_ANCESTOR_EXTERNAL_QUERY');
    const ancestorDepth=at+1,relativePath=path.relative(parents[at],file).split(path.sep).join('/');
    if(relativePath.split('/').some(part=>!part||part==='.'||part==='..'||!/^[A-Za-z0-9_@.+-]+$/.test(part)))fail('PORTABLE_ANCESTOR_PATH');
    const observed=inspectPath(file);retain(observed.present);
    if(observed.exists){
      if(kind!=='directoryExists'||answer!==true||relativePath!=='node_modules'||!observed.stat.isDirectory())fail('PORTABLE_ANCESTOR_PRESENT');
    }else if(answer!==null&&answer!==false)fail('PORTABLE_ANCESTOR_CHANGED');
    external.push({file,exists:observed.exists,watchRoot:observed.watchRoot});
    normalized.push([kind,{namespace:ancestorQueriesInterpretation,ancestorDepth,relativePath},answer]);
    if(!scopes.has(file)){
      const prefixes=[];let prefix=file;
      while(prefix!==observed.watchRoot){prefixes.push(prefix);prefix=path.dirname(prefix);
        if(!within(prefix,observed.watchRoot))fail('PORTABLE_ANCESTOR_PATH');}
      prefixes.push(observed.watchRoot);
      scopes.set(file,{ancestorDepth,relativePath,candidate:file,watchRoot:observed.watchRoot,
        prefixes:prefixes.reverse(),watchRootIdentity:guards.get(observed.watchRoot),
        presentDirectories:observed.present.map(([file,value])=>({path:file,identity:value})),queryKinds:[]});
    }
    scopes.get(file).queryKinds.push(kind);
  }
  // Observe physical replacement during derivation too. This is not continuity
  // across execution; an unchanged result remains explicitly non-authoritative.
  for(const expected of external){
    const now=inspectPath(expected.file);
    if(now.exists!==expected.exists||now.watchRoot!==expected.watchRoot)fail('PORTABLE_ANCESTOR_CHANGED');
    retain(now.present);
  }
  for(const [file,before] of guards){
    let stat;try{stat=fs.lstatSync(file,{bigint:true});}catch{fail('PORTABLE_ANCESTOR_CHANGED');}
    if(stat.isSymbolicLink()||canonical(identity(stat))!==canonical(before))fail('PORTABLE_ANCESTOR_CHANGED');
  }
  const order=(a,b)=>canonical(a)<canonical(b)?-1:canonical(a)>canonical(b)?1:0;
  normalized.sort(order);
  const scopeRows=[...scopes.values()].map(scope=>({...scope,queryKinds:scope.queryKinds.sort()})).sort((a,b)=>order([a.ancestorDepth,a.relativePath],[b.ancestorDepth,b.relativePath]));
  const required=new Map();
  const requireRoot=(file,scopeIndex,role)=>{
    if(!required.has(file))required.set(file,{path:file,identity:guards.get(file),scopeIndexes:[],roles:[]});
    const row=required.get(file);
    if(!row.identity)fail('PORTABLE_ANCESTOR_CHANGED');
    if(!row.scopeIndexes.includes(scopeIndex))row.scopeIndexes.push(scopeIndex);
    if(!row.roles.includes(role))row.roles.push(role);
  };
  for(const [scopeIndex,scope] of scopeRows.entries()){
    requireRoot(scope.watchRoot,scopeIndex,'candidate-prefix');
    // Endpoint identities cannot establish an interval for replacement of a
    // subscription root. Require its present ancestors' parents through '/',
    // rather than assuming a child subscription has WatchRoot semantics.
    for(const present of scope.presentDirectories){
      const parent=path.dirname(present.path);
      requireRoot(parent,scopeIndex,parent===present.path?'filesystem-root':'present-prefix-replacement');
    }
  }
  const requiredWatchRoots=[...required.values()].map(row=>({...row,roles:row.roles.sort(),scopeIndexes:row.scopeIndexes.sort((a,b)=>a-b)}))
    .sort((a,b)=>order(a.path,b.path));
  const chainDepth=parents.length,queryDigest=sha({interpretation:ancestorQueriesInterpretation,chainDepth,queries:normalized});
  const logicalScopes=scopeRows.map(({ancestorDepth,relativePath,queryKinds})=>({ancestorDepth,relativePath,queryKinds}));
  return freeze({schema:1,interpretation:ancestorQueriesInterpretation,chainDepth,queries:normalized,queryDigest,
    scopeDigest:sha({interpretation:ancestorQueriesInterpretation,chainDepth,scopes:logicalScopes,
      replacementCoverage:'present-parents-to-filesystem-root'}),
    rootIdentity:identity(rootState.stat),scopes:scopeRows,requiredWatchRoots,reuseEligible:false});
}
// Backend must supply canonical event paths. Valid unrelated paths are discarded
// without retention; unnamed/malformed paths mean observation uncertainty.
export function portableAncestorEventMatch(scope,eventPath){
  if(!scope||!safeAbsolute(scope.candidate)||!safeAbsolute(scope.watchRoot)||!within(scope.candidate,scope.watchRoot))return 'unknown';
  if(!safeAbsolute(eventPath))return 'unknown';
  return within(eventPath,scope.candidate)||within(scope.candidate,eventPath)?'relevant':'irrelevant';
}
