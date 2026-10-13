// Strict data-only reader for the fixed discovery child's SUCCESS-shaped JSON.
// Parent must first apply bounded duplicate-key/UTF-8 JSON parsing. No process,
// filesystem, TypeScript API, trust, namespace or eligibility is established.
// Unknown public fs methods deliberately refuse the entire payload; extend this
// finite format only after source review. Validated detailed frames stay PRIVATE.
import path from 'node:path';
export const SEALED_OBSERVATION_RESULT_LIMITS=Object.freeze({bytes:8*1024*1024,frames:32768,files:100000,configs:64,path:4096,valueBytes:64*1024*1024,arrayEntries:100000});
const reasons=new Set(['REENTRANT_CAPTURE','UNSUPPORTED_PATH','OTHER_ERROR','VALUE_LIMIT','UNSUPPORTED_VALUE','FRAME_LIMIT','JOURNAL_LIMIT','UNSUPPORTED_METHOD','UNSUPPORTED_FUNCTION_METADATA','ASYNC_CALLBACK','CAPTURE_CLOSED','INVALID_PHASE','UNSUPPORTED_SEMANTIC_METHOD','UNSUPPORTED_ACCESSOR','DESCRIPTOR_CHANGED','METHOD_DESCRIPTOR_CHANGED','RESTORE_FAILED']);
const fsMethods=new Set(['statSync','readFileSync','readdirSync','realpathSync','realpathSync.native']);
const semanticMethods=new Set(['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath']);
const fail=()=>{throw Object.assign(Error('SEALED_OBSERVATION_SCHEMA'),{code:'SEALED_OBSERVATION_SCHEMA'});};
const frozen=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))frozen(child);Object.freeze(value);}return value;};
export function validateSealedTypeScriptObservationResult(input){
  const limits=SEALED_OBSERVATION_RESULT_LIMITS;let bytes=0;
  const charge=count=>{bytes+=count;if(bytes>limits.bytes)throw Object.assign(Error('SEALED_OBSERVATION_SIZE'),{code:'SEALED_OBSERVATION_SIZE'});};
  const scalar=value=>{charge(Buffer.byteLength(JSON.stringify(value)));return value;};
  const object=(value,fields)=>{
    if(!value||typeof value!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(value)))fail();
    const keys=Reflect.ownKeys(value);if(keys.length!==fields.length||keys.some(key=>typeof key!=='string'||!fields.includes(key)))fail();
    const data={};for(const key of fields){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)fail();data[key]=descriptor.value;}
    charge(2+Math.max(0,fields.length-1)+fields.reduce((sum,key)=>sum+Buffer.byteLength(JSON.stringify(key))+1,0));return data;
  };
  const literal=(value,expected)=>{if(value!==expected)fail();return scalar(expected);};
  const choice=(value,values)=>{if(typeof value!=='string'||!values.has(value))fail();return scalar(value);};
  const integer=(value,max=Number.MAX_SAFE_INTEGER,min=0)=>{if(!Number.isSafeInteger(value)||Object.is(value,-0)||value<min||value>max)fail();return scalar(value);};
  const bool=value=>{if(typeof value!=='boolean')fail();return scalar(value);};
  const hash=value=>{if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))fail();return scalar(value);};
  const relative=(value,dot=false)=>{
    if(typeof value!=='string'||!value||Buffer.byteLength(value)>limits.path||Buffer.from(value).toString('utf8')!==value||
      /[\u0000-\u001f\u007f\\:]/u.test(value)||path.posix.isAbsolute(value)||path.posix.normalize(value)!==value||
      value.endsWith('/')||value.split('/').includes('..')||value==='.'&&!dot)fail();return scalar(value);
  };
  const array=(value,max,each,min=0)=>{
    if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)fail();
    const keys=Reflect.ownKeys(value);if(keys.length!==value.length+1)fail();charge(2);const result=[];
    for(let at=0;at<value.length;at++){const descriptor=Object.getOwnPropertyDescriptor(value,String(at));if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)fail();if(at>0)charge(1);result.push(each(descriptor.value,at));}
    return result;
  };
  const pathValue=value=>{
    if(!value||typeof value!=='object')fail();const descriptor=Object.getOwnPropertyDescriptor(value,'scope');if(!descriptor||!Object.hasOwn(descriptor,'value'))fail();
    if(descriptor.value==='in-tree'){const data=object(value,['scope','relative']);return{scope:literal(data.scope,'in-tree'),relative:relative(data.relative,true)};}
    if(descriptor.value==='outside'){const data=object(value,['scope','sha256']);return{scope:literal(data.scope,'outside'),sha256:hash(data.sha256)};}
    if(descriptor.value==='unsupported'){const data=object(value,['scope']);return{scope:literal(data.scope,'unsupported')};}fail();
  };
  const valueSummary=(value,operation)=>{
    if(!value||typeof value!=='object')fail();const descriptor=Object.getOwnPropertyDescriptor(value,'type');if(!descriptor||!Object.hasOwn(descriptor,'value'))fail();
    const type=descriptor.value;
    if(['undefined','null'].includes(type)){const data=object(value,['type']);return{type:literal(data.type,type)};}
    if(type==='boolean'){const data=object(value,['type','value']);return{type:literal(data.type,type),value:bool(data.value)};}
    if(type==='string'){const data=object(value,['type','sha256']);return{type:literal(data.type,type),sha256:hash(data.sha256)};}
    if(type==='bytes'){const data=object(value,['type','byteLength','sha256']);return{type:literal(data.type,type),byteLength:integer(data.byteLength,limits.valueBytes),sha256:hash(data.sha256)};}
    if(type==='array'){const data=object(value,['type','length','sha256','projection']);return{type:literal(data.type,type),length:integer(data.length,limits.arrayEntries),sha256:hash(data.sha256),projection:literal(data.projection,operation==='readdirSync'?'entry-names-only':'actual-string-values')};}
    if(type==='stat'&&operation==='statSync'){const data=object(value,['type','metadataSha256']);return{type:literal(data.type,type),metadataSha256:hash(data.metadataSha256)};}fail();
  };
  let journalReasons;
  const outcome=(value,operation)=>{
    if(!value||typeof value!=='object')fail();const descriptor=Object.getOwnPropertyDescriptor(value,'status');if(!descriptor||!Object.hasOwn(descriptor,'value'))fail();
    if(descriptor.value==='RETURNED'){const data=object(value,['status','value']);return{status:literal(data.status,'RETURNED'),value:valueSummary(data.value,operation)};}
    const data=object(value,['status','errno']);
    if(data.status==='DENIED')return{status:literal(data.status,'DENIED'),errno:choice(data.errno,new Set(['EPERM','EACCES']))};
    if(data.status==='MISSING')return{status:literal(data.status,'MISSING'),errno:choice(data.errno,new Set(['ENOENT','ENOTDIR']))};
    if(data.status==='OTHER_ERROR'){if(!journalReasons.includes('OTHER_ERROR'))fail();return{status:literal(data.status,'OTHER_ERROR'),errno:literal(data.errno,'OTHER')};}fail();
  };
  const journal=value=>{
    const data=object(value,['schema','interpretation','loggingComplete','frames','reasonCodes','callsObserved','observationCompleteness','moduleLoaderCoverage','queryCompleteness','namespaceVerified','sealed','reuseEligible']);
    const result={schema:literal(data.schema,1),interpretation:literal(data.interpretation,'redue-sealed-typescript-discovery-journal@1'),loggingComplete:bool(data.loggingComplete)};
    journalReasons=array(data.reasonCodes,reasons.size,value=>choice(value,reasons));
    if(journalReasons.some((value,at)=>at>0&&value<=journalReasons[at-1])||result.loggingComplete!==(journalReasons.length===0))fail();
    result.reasonCodes=journalReasons;result.callsObserved=integer(data.callsObserved);
    if(result.callsObserved>limits.frames&&!journalReasons.includes('FRAME_LIMIT'))fail();
    if(journalReasons.includes('FRAME_LIMIT')&&result.callsObserved<=limits.frames)fail();
    let previous=0;
    result.frames=array(data.frames,limits.frames,value=>{
      if(!value||typeof value!=='object')fail();const categoryDescriptor=Object.getOwnPropertyDescriptor(value,'category');if(!categoryDescriptor||!Object.hasOwn(categoryDescriptor,'value'))fail();
      const category=categoryDescriptor.value;
      const frame=object(value,category==='fs'?['sequence','phase','category','operation','path','argumentsSha256','outcome']:['sequence','phase','category','operation','path','outcome']);
      const parsed={sequence:integer(frame.sequence,Math.min(result.callsObserved,limits.frames),1),phase:choice(frame.phase,new Set(['load','config','program'])),category:choice(category,new Set(['fs','semantic']))};
      if(parsed.sequence<=previous||result.loggingComplete&&parsed.sequence!==previous+1)fail();previous=parsed.sequence;
      parsed.operation=choice(frame.operation,category==='fs'?fsMethods:semanticMethods);parsed.path=pathValue(frame.path);
      if(parsed.path.scope==='unsupported'&&!journalReasons.includes('UNSUPPORTED_PATH'))fail();
      if(category==='fs')parsed.argumentsSha256=hash(frame.argumentsSha256);
      parsed.outcome=outcome(frame.outcome,parsed.operation);return parsed;
    });
    if(result.frames.length>result.callsObserved||result.loggingComplete&&result.frames.length!==result.callsObserved)fail();
    result.observationCompleteness=literal(data.observationCompleteness,'FORWARDED_CALLS_ONLY');result.moduleLoaderCoverage=literal(data.moduleLoaderCoverage,'NOT_ESTABLISHED');result.queryCompleteness=literal(data.queryCompleteness,'NOT_ESTABLISHED');
    for(const name of ['namespaceVerified','sealed','reuseEligible'])result[name]=literal(data[name],false);
    if(Buffer.byteLength(JSON.stringify(result))>limits.bytes)throw Object.assign(Error('SEALED_OBSERVATION_SIZE'),{code:'SEALED_OBSERVATION_SIZE'});
    return result;
  };
  const data=object(input,['schema','scope','observation','compilerVerificationExecuted','nativeAgentEnforcement','sealed','reuseEligible']);
  const result={schema:literal(data.schema,1),scope:literal(data.scope,'FIXED_STAGED_API_OBSERVATIONS_ONLY')};
  const observed=object(data.observation,['schema','interpretation','compiler','files','configs','observationStatus','journal','graphCompleteness','apiCLICompleteness','nativeViewVerified','namespaceVerified','sealed','reuseEligible']);
  const observation={schema:literal(observed.schema,1),interpretation:literal(observed.interpretation,'redue-sealed-typescript-program-probe@1')};
  const compiler=object(observed.compiler,['version','sha256','entry']);observation.compiler={version:literal(compiler.version,'5.5.2'),sha256:literal(compiler.sha256,'953b4844b5f6edc745be844b6c367c227b59029b73c4182f508f90cc47e21816'),entry:literal(compiler.entry,'node_modules/typescript/lib/typescript.js')};
  observation.files=array(observed.files,limits.files,value=>relative(value),1);observation.configs=array(observed.configs,limits.configs,value=>relative(value));
  if(new Set(observation.configs).size!==observation.configs.length)fail();
  observation.journal=journal(observed.journal);observation.observationStatus=literal(observed.observationStatus,observation.journal.loggingComplete?'FORWARDED_CALLS_LOGGED':'INCOMPLETE');
  observation.graphCompleteness=literal(observed.graphCompleteness,'NOT_ESTABLISHED');observation.apiCLICompleteness=literal(observed.apiCLICompleteness,'NOT_ESTABLISHED');
  for(const name of ['nativeViewVerified','namespaceVerified','sealed','reuseEligible'])observation[name]=literal(observed[name],false);
  result.observation=observation;result.compilerVerificationExecuted=literal(data.compilerVerificationExecuted,false);result.nativeAgentEnforcement=literal(data.nativeAgentEnforcement,'NOT_TESTED');result.sealed=literal(data.sealed,false);result.reuseEligible=literal(data.reuseEligible,false);
  return frozen(result);
}
