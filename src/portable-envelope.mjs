import {createHash} from 'node:crypto';

export const PORTABLE_PREDICATE_TYPE='https://redue.dev/attestation/direct-typescript/v1';
export const PORTABLE_INTERPRETATION='redue-portable-direct-typescript@2';
// A distinct, inspect-only claim. It is not an admitted producer contract.
export const CONTROLLED_CI_PREDICATE_TYPE='https://redue.dev/attestation/controlled-ci-direct-typescript/v1';
export const CONTROLLED_CI_INTERPRETATION='redue-portable-controlled-ci-direct-typescript@1';
export const PORTABLE_LIMITS=Object.freeze({bytes:8*1024*1024,depth:24,nodes:500000,
  string:16384,manifest:100000,context:256});
const STATEMENT_TYPE='https://in-toto.io/Statement/v1',HEX=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export class PortableEnvelopeError extends Error {
  constructor(code,message){super(message);this.name='PortableEnvelopeError';this.code=code;}
}
function fail(code,message){throw new PortableEnvelopeError(code,message);}
function schema(ok,label){if(!ok)fail('PORTABLE_SCHEMA',`Unsupported portable ${label}`);}
function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value));}
function exact(value,keys,label){schema(plain(value)&&Object.keys(value).length===keys.length&&
  keys.every(key=>Object.hasOwn(value,key)),label);}
function text(value,max=PORTABLE_LIMITS.string){return typeof value==='string'&&value.length>0&&
  value.length<=max&&!/[\u0000-\u001f\u007f]/u.test(value);}
function relative(value){return text(value)&&!value.includes('\\')&&!value.includes(':')&&
  !value.startsWith('/')&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');}
function hash(value){return typeof value==='string'&&HEX.test(value);}
function utf16(value){
  for(let i=0;i<value.length;i++){
    const c=value.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff){const next=value.charCodeAt(++i);
      if(!(next>=0xdc00&&next<=0xdfff))fail('PORTABLE_UNICODE','Invalid Unicode in portable JSON');}
    else if(c>=0xdc00&&c<=0xdfff)fail('PORTABLE_UNICODE','Invalid Unicode in portable JSON');
  }
}

// Restricted I-JSON: UTF-8, unique decoded object keys, bounded structure and safe
// integers. The recursive parser rejects duplicate keys before any JSON.parse can
// discard them. No reviver, decompression, URL retrieval or imported code exists.
function parseJson(bytes){
  let source;
  if(typeof bytes==='string'){
    if(Buffer.byteLength(bytes,'utf8')>PORTABLE_LIMITS.bytes)
      fail('PORTABLE_SIZE','Portable envelope exceeds the byte limit');
    utf16(bytes);source=bytes;
  }else{
    if(!(bytes instanceof Uint8Array))fail('PORTABLE_PARSE','Portable envelope must be UTF-8 JSON bytes');
    if(bytes.byteLength>PORTABLE_LIMITS.bytes)fail('PORTABLE_SIZE','Portable envelope exceeds the byte limit');
    try{source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}
    catch{fail('PORTABLE_UNICODE','Invalid UTF-8 in portable JSON');}
  }
  let cursor=0,nodes=0;
  const number=/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  function malformed(){fail('PORTABLE_PARSE','Malformed portable JSON');}
  function white(){while(/[\x20\t\n\r]/.test(source[cursor]??'\0'))cursor++;}
  function string(){
    if(source[cursor]!=='"')malformed();
    const start=cursor++;
    while(cursor<source.length){const c=source.charCodeAt(cursor++);
      if(c===34){let result;
        try{result=JSON.parse(source.slice(start,cursor));}catch{malformed();}
        if(result.length>PORTABLE_LIMITS.string)fail('PORTABLE_SIZE','Portable JSON string exceeds the limit');
        utf16(result);return result;}
      if(c<32)malformed();
      if(c===92){if(cursor>=source.length)malformed();const escape=source[cursor++];
        if(escape==='u'){if(!/^[a-fA-F0-9]{4}$/.test(source.slice(cursor,cursor+4)))malformed();cursor+=4;}
        else if(!'"\\/bfnrt'.includes(escape))malformed();}
    }
    malformed();
  }
  function value(depth){
    if(depth>PORTABLE_LIMITS.depth)fail('PORTABLE_DEPTH','Portable JSON nesting exceeds the limit');
    if(++nodes>PORTABLE_LIMITS.nodes)fail('PORTABLE_SIZE','Portable JSON item count exceeds the limit');
    white();const c=source[cursor];
    if(c==='"')return string();
    if(c==='{'){
      cursor++;white();const out=Object.create(null),seen=new Set();
      if(source[cursor]==='}'){cursor++;return out;}
      for(;;){white();const key=string();
        if(seen.has(key))fail('PORTABLE_DUPLICATE_KEY','Duplicate key in portable JSON');
        seen.add(key);white();if(source[cursor++]!==':')malformed();out[key]=value(depth+1);white();
        if(source[cursor]==='}'){cursor++;return out;}
        if(source[cursor++]!==',')malformed();}
    }
    if(c==='['){
      cursor++;white();const out=[];
      if(source[cursor]===']'){cursor++;return out;}
      for(;;){out.push(value(depth+1));white();
        if(source[cursor]===']'){cursor++;return out;}
        if(source[cursor++]!==',')malformed();}
    }
    for(const [literal,result] of [['true',true],['false',false],['null',null]])
      if(source.startsWith(literal,cursor)){cursor+=literal.length;return result;}
    number.lastIndex=cursor;const match=number.exec(source);
    if(!match)malformed();cursor+=match[0].length;
    if(!/^-?(?:0|[1-9]\d*)$/.test(match[0]))
      fail('PORTABLE_NUMBER','Portable JSON requires integer number tokens');
    const result=Number(match[0]);
    if(!Number.isSafeInteger(result))fail('PORTABLE_NUMBER','Portable JSON requires safe integer numbers');
    return result;
  }
  const result=value(0);white();if(cursor!==source.length)malformed();return result;
}
export const parsePortableJson=bytes=>parseJson(bytes);

// RFC 8785 ordering/string serialization over our stricter integer-only I-JSON
// domain. Arrays keep their order; keys use raw UTF-16 ordering; Unicode is never
// normalized. No absolute path stripping or environment projection happens here.
export function canonical(value){
  let nodes=0;
  const ancestors=new Set();
  function visit(item,depth){
    if(++nodes>PORTABLE_LIMITS.nodes)fail('PORTABLE_SIZE','Portable JSON item count exceeds the limit');
    if(depth>PORTABLE_LIMITS.depth)fail('PORTABLE_DEPTH','Portable JSON nesting exceeds the limit');
    if(item===null||typeof item==='boolean')return JSON.stringify(item);
    if(typeof item==='number'){
      if(!Number.isSafeInteger(item))fail('PORTABLE_NUMBER','Portable JSON requires safe integer numbers');
      return JSON.stringify(item);}
    if(typeof item==='string'){
      if(item.length>PORTABLE_LIMITS.string)fail('PORTABLE_SIZE','Portable JSON string exceeds the limit');
      utf16(item);return JSON.stringify(item);}
    if(!Array.isArray(item)&&!plain(item))fail('PORTABLE_PARSE','Portable JSON requires plain data');
    if(ancestors.has(item))fail('PORTABLE_PARSE','Portable JSON cannot contain cycles');
    ancestors.add(item);let result;
    if(Array.isArray(item)){
      if(Object.keys(item).length!==item.length)fail('PORTABLE_PARSE','Portable JSON arrays must be dense');
      const entries=[];
      for(let i=0;i<item.length;i++){
        const descriptor=Object.getOwnPropertyDescriptor(item,String(i));
        if(!descriptor||!Object.hasOwn(descriptor,'value'))fail('PORTABLE_PARSE','Portable JSON requires plain data properties');
        entries.push(visit(descriptor.value,depth+1));
      }
      result='['+entries.join(',')+']';
    }else result='{'+Object.keys(item).sort().map(key=>{
      utf16(key);if(key.length>PORTABLE_LIMITS.string)fail('PORTABLE_SIZE','Portable JSON key exceeds the limit');
      const descriptor=Object.getOwnPropertyDescriptor(item,key);
      if(!descriptor||!Object.hasOwn(descriptor,'value'))fail('PORTABLE_PARSE','Portable JSON requires plain data properties');
      return JSON.stringify(key)+':'+visit(descriptor.value,depth+1);
    }).join(',')+'}';
    ancestors.delete(item);return result;
  }
  const result=visit(value,0);
  if(Buffer.byteLength(result,'utf8')>PORTABLE_LIMITS.bytes)fail('PORTABLE_SIZE','Portable envelope exceeds the byte limit');
  return result;
}
const sha256=value=>createHash('sha256').update(value).digest('hex');
export const digestPayload=statement=>sha256(canonical(statement));
function pairs(value,label,pathCheck=relative){
  schema(Array.isArray(value)&&value.length<=PORTABLE_LIMITS.manifest,label);
  let previous=null;
  for(const pair of value){schema(Array.isArray(pair)&&pair.length===2&&pathCheck(pair[0])&&hash(pair[1]),label);
    schema(previous===null||previous<pair[0],`${label} order`);previous=pair[0];}
}
function validateFacts(facts){
  if(facts===null)return;
  exact(facts,['schema','recipe','platform','runtime','compiler','context','files','discovery'],'facts');
  schema(facts.schema===1,'facts schema');
  exact(facts.recipe,['interpretation','script','command','definitionSha256'],'recipe');
  schema(facts.recipe.interpretation==='npm-direct-typescript@1'&&text(facts.recipe.script,256)&&
    Array.isArray(facts.recipe.command)&&JSON.stringify(facts.recipe.command)===
      '["@node","@typescript-compiler:.","--noEmit"]'&&hash(facts.recipe.definitionSha256),'recipe identity');
  exact(facts.platform,['os','arch','release'],'platform');
  schema(['darwin','linux','win32'].includes(facts.platform.os)&&text(facts.platform.arch,64)&&
    text(facts.platform.release,256),'platform identity');
  exact(facts.runtime,['version','sha256','sharedObjects'],'runtime');
  schema(text(facts.runtime.version,64)&&hash(facts.runtime.sha256),'runtime identity');
  pairs(facts.runtime.sharedObjects,'runtime shared objects',name=>relative(name)&&!name.includes('/'));
  exact(facts.compiler,['version','sha256','entry'],'compiler');
  schema(text(facts.compiler.version,64)&&hash(facts.compiler.sha256)&&relative(facts.compiler.entry),'compiler identity');
  schema(plain(facts.context)&&Object.keys(facts.context).length<=PORTABLE_LIMITS.context,'context');
  for(const [key,value] of Object.entries(facts.context))schema(text(key,256)&&hash(value),'context identity');
  pairs(facts.files,'input manifest');
  exact(facts.discovery,['configs','files','queriesSha256'],'discovery');
  pairs(facts.discovery.configs,'configuration manifest');pairs(facts.discovery.files,'compiler input manifest');
  schema(hash(facts.discovery.queriesSha256),'compiler query identity');
}
function validateOriginFacts(origin,facts){
  exact(origin,['runId','check','result','invocation','complete'],'origin');
  schema(typeof origin.runId==='string'&&UUID.test(origin.runId)&&text(origin.check,256)&&
    ['PASS','FAIL',null].includes(origin.result)&&typeof origin.complete==='boolean','origin identity');
  exact(origin.invocation,['status','exitCode','signal'],'origin invocation');
  const invocation=origin.invocation;
  schema(['exited','interrupted','start_failed'].includes(invocation.status)&&
    (invocation.exitCode===null||Number.isSafeInteger(invocation.exitCode))&&
    (invocation.signal===null||text(invocation.signal,64)),'origin invocation outcome');
  schema(invocation.status!=='exited'||invocation.exitCode!==null&&invocation.signal===null,'completed invocation');
  const expected=invocation.status==='exited'?(invocation.exitCode===0?'PASS':'FAIL'):null;
  schema(origin.result===expected,'origin result consistency');
  schema(!origin.complete||invocation.status==='exited'&&facts!==null,'complete origin facts');
  validateFacts(facts);
}
function validatePredicate(predicate){
  exact(predicate,['schema','interpretation','origin','facts'],'predicate');
  schema(predicate.schema===1&&predicate.interpretation===PORTABLE_INTERPRETATION,'predicate interpretation');
  validateOriginFacts(predicate.origin,predicate.facts);
}
function freeze(value){if(value&&typeof value==='object'){
  for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

export function encodeEnvelope(predicate){
  // Round-trip isolates the returned immutable payload from the caller and gives
  // in-memory producers the same bounded/schema checks as untrusted imports.
  const isolated=parseJson(canonical(predicate));validatePredicate(isolated);
  const statement={_type:STATEMENT_TYPE,subject:[{name:'redue-evidence',digest:{sha256:sha256(canonical(isolated))}}],
    predicateType:PORTABLE_PREDICATE_TYPE,predicate:isolated};
  const envelope={schema:1,statement,digest:digestPayload(statement)};
  canonical(envelope);return freeze(envelope);
}

function validateEnvelope(envelope,predicateType,validate){
  exact(envelope,['schema','statement','digest'],'envelope');
  schema(envelope.schema===1&&hash(envelope.digest),'envelope identity');
  const statement=envelope.statement;
  exact(statement,['_type','subject','predicateType','predicate'],'statement');
  schema(statement._type===STATEMENT_TYPE&&statement.predicateType===predicateType,'statement interpretation');
  schema(Array.isArray(statement.subject)&&statement.subject.length===1,'statement subject');
  exact(statement.subject[0],['name','digest'],'statement subject');
  exact(statement.subject[0].digest,['sha256'],'statement subject digest');
  schema(statement.subject[0].name==='redue-evidence'&&hash(statement.subject[0].digest.sha256),'statement subject identity');
  validate(statement.predicate);
  if(statement.subject[0].digest.sha256!==sha256(canonical(statement.predicate))||
    envelope.digest!==digestPayload(statement))fail('PORTABLE_DIGEST','Portable envelope digest does not match its payload');
  return freeze(envelope);
}

export function parseEnvelope(bytes){
  return validateEnvelope(parseJson(bytes),PORTABLE_PREDICATE_TYPE,validatePredicate);
}

function inspectParsedEnvelope({statement,digest}){
  const {origin,facts}=statement.predicate;
  return freeze({schema:1,digest,evidence_preserved:true,evidence_understood:true,
    producer_accepted:false,reuse_eligible:false,origin:{...origin},
    recipe:facts?.recipe??null,input_count:facts?.files.length??0,
    limitation:'Inspection verifies structure and digest only; it neither authenticates the producer nor establishes recipient applicability.'});
}

export function inspectEnvelope(bytes){return inspectParsedEnvelope(parseEnvelope(bytes));}

// Deliberately separate from validatePredicate/parseEnvelope: existing exports,
// imports, CI authentication and recipient decisions remain bound to @2. These
// are producer CLAIMS, never a mint of trusted job state or local applicability.
function validateControlledCIPredicate(predicate){
  exact(predicate,['schema','interpretation','origin','facts','assurance'],'controlled CI predicate');
  schema(predicate.schema===1&&predicate.interpretation===CONTROLLED_CI_INTERPRETATION,
    'controlled CI interpretation');
  // Reuse structural origin/result/facts checks, not @2 interpretation or
  // applicability. Neither a complete flag nor a digest authenticates a job.
  validateOriginFacts(predicate.origin,predicate.facts);
  const assurance=predicate.assurance;
  exact(assurance,['interpretation','model','sealing','hostRuntimeProfile'],'controlled CI assurance');
  schema(assurance.interpretation==='redue-controlled-ci-assurance@1'&&
    assurance.model==='TRUSTED_QUIESCENT_ISOLATED_JOB'&&assurance.sealing==='NOT_CLAIMED',
    'controlled CI assurance model');
  const profile=assurance.hostRuntimeProfile;
  exact(profile,['interpretation','match','sha256'],'controlled CI host runtime profile');
  schema(profile.interpretation==='redue-controlled-ci-host-runtime-profile@1'&&
    profile.match==='RECIPIENT_MUST_ESTABLISH_EXACT_MATCH'&&hash(profile.sha256),
    'controlled CI host runtime assumptions');
  const facts=predicate.facts;
  schema(facts!==null&&facts.platform.os==='darwin'&&facts.platform.arch==='arm64'&&
    facts.runtime.version==='v22.13.0'&&facts.compiler.version==='5.5.2',
    'controlled CI supported profile');
}
function inspectControlledCI(envelope){
  const {statement,digest}=envelope,{origin,facts,assurance}=statement.predicate;
  return freeze({schema:1,digest,interpretation:CONTROLLED_CI_INTERPRETATION,
    evidence_preserved:true,evidence_understood:true,claim_only:true,
    producer_accepted:false,reuse_eligible:false,freshness:'UNVERIFIED',
    producer_assurance:'NOT_VERIFIED',recipient_applicability:'NOT_ESTABLISHED',
    checking_input_coverage:'NOT_ESTABLISHED',origin:{...origin},assurance,
    claimed_host_runtime:{platform:facts.platform,runtime:facts.runtime,compiler:facts.compiler},
    recipe:facts.recipe,input_count:facts.files.length,
    limitation:'Inspection verifies structure and digest only. Trusted quiescent isolated-job assurance and exact matched host/runtime profile are unverified producer claims, not sealing. Checking-phase input coverage, producer authentication and recipient applicability are not established; this interpretation cannot be imported or reused.'});
}
// Existing inspection command only; no new encoder, import or trust route. The
// declared type selects one exact validator, never catch-and-fallback parsing.
export function inspectEvidenceEnvelope(bytes){
  const envelope=parseJson(bytes);
  exact(envelope,['schema','statement','digest'],'envelope');
  const type=envelope.statement?.predicateType;
  if(type===PORTABLE_PREDICATE_TYPE){
    // Keep the historical @2 inspection's exact output and validation behavior.
    return inspectParsedEnvelope(validateEnvelope(envelope,PORTABLE_PREDICATE_TYPE,validatePredicate));
  }
  schema(type===CONTROLLED_CI_PREDICATE_TYPE,'statement interpretation');
  return inspectControlledCI(validateEnvelope(envelope,CONTROLLED_CI_PREDICATE_TYPE,validateControlledCIPredicate));
}
