// Pure classification of LOCALLY captured compiler questions, not filesystem
// admission. This cannot prove physical identity, capture completeness, sealing,
// absence or applicability. Imported paths are never approved read scopes.
// Caller probes must use the actual compiler execution's filesystem policy;
// daemon answers under a different policy cannot replace those caller facts.
// Existing typescript-list queryAnswer converts ONLY ENOENT/ENOTDIR to null:
// EPERM/EACCES throw, while pinned ts.sys wrappers may handle them differently.
// This classifier must not manufacture an absence answer from a denial.
import path from 'node:path';import {createHash} from 'node:crypto';
import {canonical} from '../../src/portable-envelope.mjs';
const paths=path.posix,sha=value=>createHash('sha256').update(canonical(value)).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});},HEX=/^[a-f0-9]{64}$/;
const kinds=new Set(['readFile','fileExists','directoryExists','realpath','readDirectory','directories','entries']);
function data(value){let nodes=0;const seen=new Set();const copy=(item,depth)=>{
  if(++nodes>500000||depth>16)fail('NAMESPACE_LIMIT');if(item===undefined||item===null||typeof item==='boolean')return item;
  if(typeof item==='string'){if(Buffer.byteLength(item)>4096||Buffer.from(item).toString('utf8')!==item||/[\u0000-\u001f\u007f]/u.test(item))fail('NAMESPACE_SCHEMA');return item;}
  if(typeof item==='number'){if(!Number.isSafeInteger(item))fail('NAMESPACE_SCHEMA');return item;}
  if(!item||typeof item!=='object'||seen.has(item)||!Array.isArray(item)&&![Object.prototype,null].includes(Object.getPrototypeOf(item)))fail('NAMESPACE_SCHEMA');
  seen.add(item);const array=Array.isArray(item),out=array?[]:Object.create(null),keys=Reflect.ownKeys(item);
  if(array&&item.length>100000||keys.length>100001)fail('NAMESPACE_LIMIT');
  if(array&&keys.some(key=>key!=='length'&&(typeof key!=='string'||! /^(?:0|[1-9][0-9]*)$/.test(key)||Number(key)>=item.length)))fail('NAMESPACE_SCHEMA');
  const wanted=array?Array.from({length:item.length},(_,i)=>String(i)):keys;
  for(const key of wanted){const descriptor=Object.getOwnPropertyDescriptor(item,key);if(typeof key!=='string'||!descriptor||!Object.hasOwn(descriptor,'value'))fail('NAMESPACE_SCHEMA');out[key]=copy(descriptor.value,depth+1);}seen.delete(item);return out;};return copy(value,0);}
const exact=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(key=>Object.hasOwn(value,key)))fail('NAMESPACE_SCHEMA');};
const rel=value=>typeof value==='string'&&value.length>0&&!value.includes('\\')&&!value.includes(':')&&!value.startsWith('/')&&value.split('/').every(part=>part&&part!=='.'&&part!=='..');
const abs=value=>typeof value==='string'&&value.startsWith('/')&&!value.includes('\\')&&!value.includes(':')&&paths.normalize(value)===value&&(value==='/'||value.split('/').slice(1).every(part=>part&&part!=='.'&&part!=='..'));
const basename=value=>rel(value)&&!value.includes('/');
function pairs(value,{nonempty=false}={}){if(!Array.isArray(value)||value.length>100000||nonempty&&!value.length)fail('NAMESPACE_SCHEMA');let previous='';
  for(const row of value){if(!Array.isArray(row)||row.length!==2||!rel(row[0])||typeof row[1]!=='string'||!HEX.test(row[1])||row[0]<=previous)fail('NAMESPACE_SCHEMA');previous=row[0];}return value;}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export function classifySealedTypeScriptNamespace(options){
  const selected=data(options);exact(selected,['root','cwd','tsRoot','compilerVersion','facts','manifest']);
  const {root,cwd,tsRoot,compilerVersion,facts}=selected;
  if(!abs(root)||root==='/'||cwd!==root||tsRoot!==paths.join(root,'node_modules/typescript')||compilerVersion!=='5.5.2')fail('NAMESPACE_SELECTION');
  exact(facts,['configs','files','queries']);pairs(facts.configs,{nonempty:true});pairs(facts.files,{nonempty:true});pairs(selected.manifest,{nonempty:true});
  if(!Array.isArray(facts.queries)||!facts.queries.length||facts.queries.length>8192)fail('NAMESPACE_INCOMPLETE');
  const manifest=new Set(selected.manifest.map(([name])=>name)),representedDirs=new Set(['.']);
  for(const name of manifest){let parent=paths.dirname(name);while(parent!=='.'){representedDirs.add(parent);parent=paths.dirname(parent);}}
  const requiredFiles=new Set([...facts.configs,...facts.files].map(([name])=>name)),capturedReads=new Set(),requiredDirs=new Set(),requiredLinks=new Set(),negative=[],classified=[],reasons=new Set(),seen=new Set();
  const classify=file=>{if(!abs(file))fail('NAMESPACE_SCHEMA');const relative=paths.relative(root,file),inside=relative===''||!relative.startsWith('../')&&relative!=='..'&&!paths.isAbsolute(relative);
    return{path:file,namespace:inside?'in-tree':'outside',relative:inside?relative||'.':null};};
  const reference=(file,label,refs)=>{const result=classify(file);refs.push({role:label,...result});if(result.namespace==='outside')reasons.add('OUTSIDE_REFERENCE_UNRESOLVED');return result;};
  for(let index=0;index<facts.queries.length;index++){
    const row=facts.queries[index];if(!Array.isArray(row)||![3,4].includes(row.length)||!kinds.has(row[0]))fail('NAMESPACE_SCHEMA');const [kind,file,answer,queryOptions]=row,target=classify(file),refs=[];
    if(kind!=='readDirectory'&&row.length!==3)fail('NAMESPACE_SCHEMA');
    if(target.namespace==='outside')reasons.add('OUTSIDE_QUERY_UNRESOLVED');
    if(kind==='fileExists'||kind==='directoryExists'){
      if(![true,false,null].includes(answer))fail('NAMESPACE_SCHEMA');
      if(answer!==true)negative.push({index,kind,...target,answer});else if(target.namespace==='in-tree')(kind==='directoryExists'?requiredDirs:requiredFiles).add(target.relative);
    }else if(kind==='readFile'){
      if(answer!==null&&(typeof answer!=='string'||!HEX.test(answer)))fail('NAMESPACE_SCHEMA');
      if(answer===null)negative.push({index,kind,...target,answer});else if(target.namespace==='in-tree'){requiredFiles.add(target.relative);capturedReads.add(target.relative);}
      // This hash binds JSON.stringify(UTF8 text), unlike the raw-byte SHA in
      // configs/files and the typed mode/content hash in portableManifest.
    }else if(kind==='realpath'){
      if(answer!==null)reference(answer,'realpath-answer',refs);else negative.push({index,kind,...target,answer});
    }else if(kind==='directories'||kind==='entries'){
      if(answer!==null&&!Array.isArray(answer))fail('NAMESPACE_SCHEMA');if(answer===null)negative.push({index,kind,...target,answer});
      else{const names=new Set();for(const entry of answer){const name=kind==='entries'?entry?.[0]:entry;
          if(!basename(name)||names.has(name)||kind==='entries'&&(!Array.isArray(entry)||entry.length!==2||!['d','l','f'].includes(entry[1])))fail('NAMESPACE_SCHEMA');names.add(name);
          const child=reference(paths.join(file,name),'directory-member',refs);if(child.namespace==='in-tree'){
            if(kind==='directories'||entry[1]==='d')requiredDirs.add(child.relative);else if(entry[1]==='l')requiredLinks.add(child.relative);else requiredFiles.add(child.relative);}}
        if(target.namespace==='in-tree')requiredDirs.add(target.relative);}
    }else{
      if(row.length!==4||!Array.isArray(answer))fail('NAMESPACE_SCHEMA');exact(queryOptions,['tsRoot','args','argsVersion','undefinedArguments']);
      if(queryOptions.tsRoot!==tsRoot||queryOptions.argsVersion!==1||!Array.isArray(queryOptions.args)||![3,4].includes(queryOptions.args.length)||!Array.isArray(queryOptions.undefinedArguments))fail('NAMESPACE_SCHEMA');
      const undefinedSlots=new Set();for(const slot of queryOptions.undefinedArguments){if(!Number.isInteger(slot)||slot<0||slot>=queryOptions.args.length||undefinedSlots.has(slot))fail('NAMESPACE_SCHEMA');undefinedSlots.add(slot);}
      for(let slot=0;slot<queryOptions.args.length;slot++){
        const value=queryOptions.args[slot];if(undefinedSlots.has(slot)){if(value!==undefined&&value!==null)fail('NAMESPACE_SCHEMA');queryOptions.args[slot]=null;continue;}
        if(slot===3){if(!Number.isSafeInteger(value)||value<0)fail('NAMESPACE_SCHEMA');continue;}
        if(!Array.isArray(value)||value.some(part=>typeof part!=='string'||!part))fail('NAMESPACE_SCHEMA');
        for(const part of value){if(part.includes('\\')||part.includes(':'))fail('NAMESPACE_SCHEMA');if(paths.isAbsolute(part))reference(part,'readDirectory-option',refs);
          else if(part.split('/').includes('..'))reasons.add('RELATIVE_OPTION_ESCAPE_UNRESOLVED');}}
      const answers=new Set();for(const name of answer){if(answers.has(name))fail('NAMESPACE_SCHEMA');answers.add(name);const ref=reference(name,'readDirectory-answer',refs);if(ref.namespace==='in-tree')requiredFiles.add(ref.relative);}
      if(target.namespace==='in-tree')requiredDirs.add(target.relative);
    }
    const key=canonical([kind,file,row[3]??null]);if(seen.has(key))fail('NAMESPACE_SCHEMA');seen.add(key);
    classified.push({index,kind,target,references:refs});
  }
  for(const [name] of [...facts.configs,...facts.files])if(!capturedReads.has(name))fail('NAMESPACE_INCOMPLETE');
  if(negative.length)reasons.add('NEGATIVE_ANSWERS_REQUIRE_LOCAL_VALIDATION');
  for(const name of requiredFiles)if(!manifest.has(name))reasons.add('INPUT_NOT_MATERIALIZED');
  const directories=[...requiredDirs].sort().map(relative=>({relative,representedByFiles:representedDirs.has(relative)}));
  if(directories.some(row=>!row.representedByFiles))reasons.add('DIRECTORY_NOT_MATERIALIZED');
  if(requiredLinks.size)reasons.add('LINK_TOPOLOGY_REQUIRES_LOCAL_VALIDATION');
  return freeze({schema:1,recipe:'npm-sealed-typescript@1',compilerVersion,root,cwd,tsRoot,facts,
    factsSha256:sha(facts),manifestSha256:sha(selected.manifest),classified,negative,
    requiredFiles:[...requiredFiles].sort(),requiredDirectories:directories,requiredLinks:[...requiredLinks].sort(),
    unresolved:[...reasons].sort(),namespaceVerified:false,sealed:false,reuseEligible:false});
}
