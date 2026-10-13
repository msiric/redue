// Test/acceptance leaf: scoped synchronous journaling in a FRESH probe process.
// Install before FIRST verified TS require (cached realpath.native matters), with
// actual staged cwd/filesystem policy already established by the parent. Do not
// use in a daemon or with untrusted/imported callbacks. No API is loaded here.
// The caller can pass semantic forwarding methods into compilerProgramFiles;
// this reuses its config/host/program graph rather than duplicating resolution.
// Phase labels are engineering annotations, not proof of execution boundaries.
// Reserve half the fixed8MiB child-response budget for graph/config metadata.
// Overflow remains explicit partial logging, never complete query coverage.
// Unsupported public fs calls still forward/count and latch incompleteness;
// their unreviewed shapes are not serialized as supposedly supported frames.
// Node's internalModuleStat/internalModuleReadJSON loader operations bypass these
// public fs wrappers. Whole implementation/manifest binding remains mandatory;
// no first-require or CLI/API query-completeness claim follows from this journal.
// CLI deferred diagnostics and API createProgram have separately reviewed paths.
// A trusted synchronous callback must not schedule/leak work beyond this scope.
// Finally restores wrappers, not arbitrary callback mutations or async children.
import path from 'node:path';
import {createHash} from 'node:crypto';
export const SEALED_DISCOVERY_LIMITS=Object.freeze({frames:32768,journalBytes:4*1024*1024,
  pathBytes:4096,valueBytes:64*1024*1024,hashedBytes:512*1024*1024,arrayEntries:100000,descriptors:256,depth:8});
const phases=new Set(['load','config','program']);
const semanticMethods=new Set(['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath']);
const supportedFS=new Set(['statSync','readFileSync','readdirSync','realpathSync','realpathSync.native']);
const syncFunction=value=>typeof value==='function'&&Object.getPrototypeOf(value)===Function.prototype;
const fail=code=>{throw Object.assign(Error(code),{code});};
const valueLimit=Symbol('bounded-value-limit');
const own=(value,key)=>value!==null&&(typeof value==='object'||typeof value==='function')?Object.getOwnPropertyDescriptor(value,key):undefined;
const datum=(value,key)=>{const descriptor=own(value,key);return descriptor&&Object.hasOwn(descriptor,'value')?descriptor.value:undefined;};
const thenable=value=>{if(value===null||!['object','function'].includes(typeof value))return false;
  for(let at=value,depth=0;at!==null;at=Object.getPrototypeOf(at)){if(++depth>8)return true;if(own(at,'then'))return true;}return false;};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
let active=null;
export function captureSealedTypeScriptDiscovery(options){
  if(active){active.invalidate('REENTRANT_CAPTURE');fail('SEALED_DISCOVERY_REENTRANT');}
  if(!options||typeof options!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).length!==3)fail('SEALED_DISCOVERY_OPTIONS');
  for(const key of ['fileSystem','root','callback'])if(!own(options,key)||!Object.hasOwn(own(options,key),'value'))fail('SEALED_DISCOVERY_OPTIONS');
  const {fileSystem,root,callback}=options;
  if(typeof root!=='string'||root==='/'||root.endsWith('/')||Buffer.byteLength(root)>SEALED_DISCOVERY_LIMITS.pathBytes||Buffer.from(root).toString('utf8')!==root||!path.posix.isAbsolute(root)||path.posix.normalize(root)!==root||/[\u0000-\u001f\u007f\\:]/u.test(root))fail('SEALED_DISCOVERY_ROOT');
  if(!syncFunction(callback))fail('SEALED_DISCOVERY_ASYNC');
  if(!fileSystem||typeof fileSystem!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(fileSystem)))fail('SEALED_DISCOVERY_FS');
  const keys=Reflect.ownKeys(fileSystem);if(keys.length>SEALED_DISCOVERY_LIMITS.descriptors||keys.some(key=>typeof key!=='string'))fail('SEALED_DISCOVERY_FS');
  for(const key of ['statSync','readFileSync','readdirSync','realpathSync'])if(typeof datum(fileSystem,key)!=='function')fail('SEALED_DISCOVERY_FS');
  const originalDescriptors=new Map(keys.map(key=>[key,own(fileSystem,key)])),restores=[],wrapperSnapshots=[];
  // Reserve a fixed bounded header/reason-code allowance, including array syntax.
  const frames=[],reasons=new Set(),phaseStack=['load'];let closed=false,calls=0,journalBytes=1024,hashedBytes=0;
  const invalidate=code=>reasons.add(code);active={invalidate};
  const digest=(value,bytes)=>{if(bytes>SEALED_DISCOVERY_LIMITS.valueBytes||bytes>SEALED_DISCOVERY_LIMITS.hashedBytes-hashedBytes)throw valueLimit;hashedBytes+=bytes;return createHash('sha256').update(value).digest('hex');};
  const stringDigest=value=>{if(value.length*6+2>SEALED_DISCOVERY_LIMITS.valueBytes)throw valueLimit;const encoded=JSON.stringify(value);return digest(encoded,Buffer.byteLength(encoded));};
  const safePath=value=>{
    if(typeof value!=='string'||Buffer.byteLength(value)>SEALED_DISCOVERY_LIMITS.pathBytes||Buffer.from(value).toString('utf8')!==value||!path.posix.isAbsolute(value)||path.posix.normalize(value)!==value||/[\u0000-\u001f\u007f\\:]/u.test(value)){invalidate('UNSUPPORTED_PATH');return{scope:'unsupported'};}
    const relative=path.posix.relative(root,value);if(relative===''||relative!=='..'&&!relative.startsWith('../')&&!path.posix.isAbsolute(relative))return{scope:'in-tree',relative:relative||'.'};
    return{scope:'outside',sha256:digest(value,Buffer.byteLength(value))};
  };
  const argumentsDigest=args=>{
    if(args.length>4)throw Error('ARGS');const copy=[];
    for(const value of args.slice(1)){
      if(value===undefined){copy.push({undefined:true});continue;}if(value===null||typeof value==='boolean'){copy.push(value);continue;}
      if(typeof value==='string'){if(Buffer.byteLength(value)>256||/[\u0000-\u001f\u007f]/u.test(value))throw Error('ARGS');copy.push(value);continue;}
      if(!value||typeof value!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw Error('ARGS');
      const fields=Reflect.ownKeys(value);if(fields.length>8||fields.some(key=>typeof key!=='string'||!['encoding','flag','bigint','throwIfNoEntry','withFileTypes','recursive'].includes(key)))throw Error('ARGS');
      const record={};for(const key of fields){const descriptor=own(value,key);if(!descriptor||!Object.hasOwn(descriptor,'value'))throw Error('ARGS');const item=descriptor.value;
        if(item!==undefined&&item!==null&&typeof item!=='boolean'&&(typeof item!=='string'||Buffer.byteLength(item)>256||/[\u0000-\u001f\u007f]/u.test(item)))throw Error('ARGS');record[key]=item===undefined?{undefined:true}:item;}
      copy.push(record);
    }
    const encoded=JSON.stringify(copy);return digest(encoded,Buffer.byteLength(encoded));
  };
  const summary=(value,operation)=>{
    if(value===undefined)return{type:'undefined'};if(value===null)return{type:'null'};if(typeof value==='boolean')return{type:'boolean',value};
    if(typeof value==='string')return{type:'string',sha256:stringDigest(value)};
    if(ArrayBuffer.isView(value)&&[Buffer.prototype,Uint8Array.prototype].includes(Object.getPrototypeOf(value))){
      const length=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'byteLength').get.call(value);
      return{type:'bytes',byteLength:length,sha256:digest(value,length)};
    }
    if(Array.isArray(value)){
      if(value.length>SEALED_DISCOVERY_LIMITS.arrayEntries)throw valueLimit;const values=[];let bound=2;
      for(let at=0;at<value.length;at++){const descriptor=own(value,String(at));if(!descriptor||!Object.hasOwn(descriptor,'value'))throw Error('VALUE');const item=descriptor.value;
        const name=typeof item==='string'?item:operation==='readdirSync'?datum(item,'name'):undefined;if(typeof name!=='string'||Buffer.byteLength(name)>SEALED_DISCOVERY_LIMITS.pathBytes)throw Error('VALUE');
        bound+=name.length*6+4;if(bound>SEALED_DISCOVERY_LIMITS.valueBytes)throw valueLimit;values.push(name);}
      const encoded=JSON.stringify(values);return{type:'array',length:values.length,sha256:digest(encoded,Buffer.byteLength(encoded)),projection:operation==='readdirSync'?'entry-names-only':'actual-string-values'};
    }
    if(operation==='statSync'&&value&&typeof value==='object'){
      const metadata={};for(const field of ['dev','ino','mode','uid','nlink','size']){const item=datum(value,field);if(typeof item!=='bigint'&&!Number.isSafeInteger(item))throw Error('VALUE');metadata[field]=String(item);}
      const encoded=JSON.stringify(metadata);return{type:'stat',metadataSha256:digest(encoded,Buffer.byteLength(encoded))};
    }
    throw Error('VALUE');
  };
  const errorOutcome=error=>{const code=datum(error,'code');
    if(['EPERM','EACCES'].includes(code))return{status:'DENIED',errno:code};
    if(['ENOENT','ENOTDIR'].includes(code))return{status:'MISSING',errno:code};
    invalidate('OTHER_ERROR');return{status:'OTHER_ERROR',errno:'OTHER'};
  };
  const record=(seq,category,operation,file,args,result,error,threw)=>{
    if(closed||seq>SEALED_DISCOVERY_LIMITS.frames)return;
    try{const frame={sequence:seq,phase:phaseStack.at(-1),category,operation,path:safePath(file)};
      if(category==='fs')frame.argumentsSha256=argumentsDigest(args);
      frame.outcome=threw?errorOutcome(error):{status:'RETURNED',value:summary(result,operation)};
      const encoded=JSON.stringify(frame),cost=Buffer.byteLength(encoded)+1;if(cost>SEALED_DISCOVERY_LIMITS.journalBytes-journalBytes){invalidate('JOURNAL_LIMIT');return;}
      journalBytes+=cost;frames.push(frame);
    }catch(error){invalidate(error===valueLimit?'VALUE_LIMIT':'UNSUPPORTED_VALUE');}
  };
  const next=()=>{if(calls<Number.MAX_SAFE_INTEGER)calls++;if(calls>SEALED_DISCOVERY_LIMITS.frames)invalidate('FRAME_LIMIT');return calls;};
  const forwarded=(operation,original)=>{
    function wrapper(...args){const seq=next(),supported=supportedFS.has(operation);if(!supported)invalidate('UNSUPPORTED_METHOD');
      try{const result=new.target?Reflect.construct(original,args,new.target===wrapper?original:new.target):Reflect.apply(original,this,args);
        if(supported)record(seq,'fs',operation,args[0],args,result,undefined,false);return result;
      }catch(error){if(supported)record(seq,'fs',operation,args[0],args,undefined,error,true);throw error;}
    }
    const ownKeys=Reflect.ownKeys(original);if(ownKeys.length>SEALED_DISCOVERY_LIMITS.descriptors)fail('SEALED_DISCOVERY_FS');
    for(const key of ownKeys){
      const descriptor=own(original,key);if(key==='native'&&operation==='realpathSync'){
        if(!descriptor||!Object.hasOwn(descriptor,'value')||typeof descriptor.value!=='function')fail('SEALED_DISCOVERY_FS');
        Object.defineProperty(wrapper,key,{...descriptor,value:forwarded('realpathSync.native',descriptor.value)});
      }else if(!descriptor)fail('SEALED_DISCOVERY_FS');
      else{
        const metadata=typeof key==='symbol'||!Object.hasOwn(descriptor,'value')||!['name','length','prototype','arguments','caller'].includes(key);
        if(metadata){
          // Preserve unused async/custom-promisify metadata without getter calls.
          // Indirect metadata entry points are not universally intercepted.
          if(supportedFS.has(operation)&&(typeof key==='symbol'||!Object.hasOwn(descriptor,'value')))fail('SEALED_DISCOVERY_FS');
          invalidate('UNSUPPORTED_FUNCTION_METADATA');
        }
        Object.defineProperty(wrapper,key,descriptor);
      }
    }wrapperSnapshots.push([wrapper,new Map(Reflect.ownKeys(wrapper).map(key=>[key,own(wrapper,key)]))]);return wrapper;
  };
  const sync=(fn)=>{if(closed){invalidate('CAPTURE_CLOSED');fail('SEALED_DISCOVERY_CLOSED');}if(!syncFunction(fn)){invalidate('ASYNC_CALLBACK');fail('SEALED_DISCOVERY_ASYNC');}
    const result=fn();if(thenable(result)){invalidate('ASYNC_CALLBACK');fail('SEALED_DISCOVERY_ASYNC');}return result;};
  const adapter=Object.freeze({
    phase(name,fn){if(!phases.has(name)||phaseStack.length>=SEALED_DISCOVERY_LIMITS.depth){invalidate('INVALID_PHASE');fail('SEALED_DISCOVERY_PHASE');}
      phaseStack.push(name);try{return sync(fn);}finally{phaseStack.pop();}},
    semantic(method,file,fn){if(!semanticMethods.has(method)){invalidate('UNSUPPORTED_SEMANTIC_METHOD');fail('SEALED_DISCOVERY_METHOD');}const seq=next();
      try{const result=sync(fn);record(seq,'semantic',method,file,[],result,undefined,false);return result;}
      catch(error){record(seq,'semantic',method,file,[],undefined,error,true);throw error;}}
  });
  let callbackError,failed=false,restoreFailed=false;
  try{
    for(const [key,descriptor] of originalDescriptors){let installed;
      if(Object.hasOwn(descriptor,'value')){if(typeof descriptor.value!=='function')continue;installed={...descriptor,value:forwarded(key,descriptor.value)};}
      else{if(!descriptor.configurable)fail('SEALED_DISCOVERY_FS');installed={...descriptor,
        get:descriptor.get?function(){invalidate('UNSUPPORTED_ACCESSOR');return Reflect.apply(descriptor.get,this,[]);}:undefined,
        set:descriptor.set?function(value){invalidate('UNSUPPORTED_ACCESSOR');return Reflect.apply(descriptor.set,this,[value]);}:undefined};}
      Object.defineProperty(fileSystem,key,installed);restores.push([key,descriptor,installed]);
    }
    sync(()=>callback(adapter));
  }catch(error){failed=true;callbackError=error;}
  finally{
    const sameDescriptor=(a,b)=>a&&b&&a.value===b.value&&a.get===b.get&&a.set===b.set&&a.writable===b.writable&&a.configurable===b.configurable&&a.enumerable===b.enumerable;
    if(Reflect.ownKeys(fileSystem).length!==originalDescriptors.size)invalidate('DESCRIPTOR_CHANGED');
    for(const [key,descriptor] of originalDescriptors)if(!restores.some(([restored])=>restored===key)&&!sameDescriptor(own(fileSystem,key),descriptor))invalidate('DESCRIPTOR_CHANGED');
    for(const [wrapper,snapshot] of wrapperSnapshots){if(Reflect.ownKeys(wrapper).length!==snapshot.size)invalidate('METHOD_DESCRIPTOR_CHANGED');
      for(const [key,descriptor] of snapshot)if(!sameDescriptor(own(wrapper,key),descriptor))invalidate('METHOD_DESCRIPTOR_CHANGED');}
    closed=true;for(const [key,original,installed] of restores.reverse()){
      const current=own(fileSystem,key);if(!current||current.value!==installed.value||current.get!==installed.get||current.set!==installed.set||current.writable!==installed.writable||current.configurable!==installed.configurable||current.enumerable!==installed.enumerable)invalidate('DESCRIPTOR_CHANGED');
      try{Object.defineProperty(fileSystem,key,original);}catch{invalidate('RESTORE_FAILED');restoreFailed=true;}
    }active=null;
  }
  if(failed)throw callbackError;if(restoreFailed)fail('SEALED_DISCOVERY_RESTORE');
  return freeze({schema:1,interpretation:'redue-sealed-typescript-discovery-journal@1',loggingComplete:reasons.size===0,
    frames:frames.sort((a,b)=>a.sequence-b.sequence),reasonCodes:[...reasons].sort(),callsObserved:calls,
    observationCompleteness:'FORWARDED_CALLS_ONLY',moduleLoaderCoverage:'NOT_ESTABLISHED',
    queryCompleteness:'NOT_ESTABLISHED',namespaceVerified:false,sealed:false,reuseEligible:false});
}
