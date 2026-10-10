import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {assertOwnedStatePlacement} from './owned-state.mjs';
import {acquireRunLock} from './run-lock.mjs';
import {canonical,parseEnvelope,parsePortableJson,PORTABLE_LIMITS,PortableEnvelopeError} from './portable-envelope.mjs';

const SELECTOR='portable-imports-v1.json',PENDING='portable-import-pending-v1.json',DIRECTORY='portable-evidence-v1';
const LIMITS=Object.freeze({records:32,bytes:16*1024*1024,selector:32768});
const HEX=/^[a-f0-9]{64}$/;
export const PORTABLE_STORE_LIMITS=LIMITS;
const fail=(code,message)=>{throw new PortableEnvelopeError(code,message);};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const fingerprint=stat=>JSON.stringify(['dev','ino','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])));
const directoryIdentity=stat=>JSON.stringify(['dev','ino'].map(key=>String(stat[key])));
function safePath(file,{directory=false,absent=false}={}){
  const resolved=path.resolve(file),parts=resolved.slice(path.parse(resolved).root.length).split(path.sep);
  let current=path.parse(resolved).root;
  for(let i=0;i<parts.length;i++){
    current=path.join(current,parts[i]);let stat;
    try{stat=fs.lstatSync(current,{bigint:true});}
    catch(error){if(error.code==='ENOENT'&&absent&&i===parts.length-1)return null;
      fail('PORTABLE_STATE_UNAVAILABLE','Portable state path is unavailable');}
    if(stat.isSymbolicLink())fail('PORTABLE_STATE_UNSAFE','Portable state paths must not be symlinks');
    if(i<parts.length-1||directory){if(!stat.isDirectory())fail('PORTABLE_STATE_UNSAFE','Portable state directory is not a directory');}
    else if(!stat.isFile()||stat.nlink!==1n)fail('PORTABLE_STATE_UNSAFE','Portable state file must be an owned regular file');
    if(i===parts.length-1)return stat;
  }
  fail('PORTABLE_STATE_UNSAFE','Portable state cannot be a filesystem root');
}
function readFile(file,limit){
  const before=safePath(file);
  if(before.size>BigInt(limit))fail('PORTABLE_SIZE','Portable state file exceeds its limit');
  let descriptor;
  try{
    descriptor=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(descriptor,{bigint:true});
    if(!opened.isFile()||opened.nlink!==1n||fingerprint(opened)!==fingerprint(before))fail('PORTABLE_STATE_CHANGED','Portable state changed while opening');
    // A bounded read never follows an attacker-grown file to unbounded allocation.
    const buffer=Buffer.alloc(Number(opened.size)),count=fs.readSync(descriptor,buffer,0,buffer.length,0);
    if(count!==buffer.length||fingerprint(fs.fstatSync(descriptor,{bigint:true}))!==fingerprint(opened)||
      fingerprint(safePath(file))!==fingerprint(opened))
      fail('PORTABLE_STATE_CHANGED','Portable state changed during reading');
    return buffer;
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
function selected(state,{recoverPending=false}={}){
  const file=path.join(state,SELECTOR);
  if(!safePath(file,{absent:true})){assertMissingSelection(state,{recoverPending});return {schema:1,records:[]};}
  let value;try{value=parsePortableJson(readFile(file,LIMITS.selector));}
  catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_STATE_INVALID','Portable import selection is malformed');}
  return validateSelection(value);
}
function validateSelection(value){
  if(!exact(value,['schema','records'])||value.schema!==1||!Array.isArray(value.records)||value.records.length>LIMITS.records)
    fail('PORTABLE_STATE_INVALID','Portable import selection is incompatible');
  const seen=new Set();let total=0;
  for(const record of value.records){
    if(!exact(record,['digest','check','acceptance','bytes'])||!HEX.test(record.digest)||typeof record.digest!=='string'||
      typeof record.check!=='string'||!record.check||record.check.length>256||/[\u0000-\u001f\u007f]/u.test(record.check)||
      !['untrusted','manual-digest-v1'].includes(record.acceptance)||!Number.isSafeInteger(record.bytes)||
      record.bytes<1||record.bytes>PORTABLE_LIMITS.bytes||seen.has(record.digest))
      fail('PORTABLE_STATE_INVALID','Portable import selection record is incompatible');
    seen.add(record.digest);total+=record.bytes;
  }
  if(total>LIMITS.bytes)fail('PORTABLE_SIZE','Portable imports exceed their cumulative byte limit');
  return value;
}
function pendingTransaction(state){
  const file=path.join(state,PENDING);
  if(!safePath(file,{absent:true}))return null;
  const value=parsePortableJson(readFile(file,LIMITS.selector));
  if(!exact(value,['schema','digest','check','acceptance','selection'])||value.schema!==1||
    typeof value.digest!=='string'||!HEX.test(value.digest)||typeof value.check!=='string'||
    !value.check||value.check.length>256||/[\u0000-\u001f\u007f]/u.test(value.check)||
    !['untrusted','manual-digest-v1'].includes(value.acceptance))
    fail('PORTABLE_IMPORT_INCOMPLETE','Pending portable import is incompatible; owner inspection is required');
  validateSelection(value.selection);return value;
}
function assertMissingSelection(state,{recoverPending=false}={}){
  const directory=path.join(state,DIRECTORY);
  if(!safePath(directory,{directory:true,absent:true}))return;
  // An existing storage directory means catalog absence is not a new empty
  // catalog. Never replay an old PASS to reconstruct a lost accepted selection.
  if(recoverPending){
    const pending=pendingTransaction(state),entries=fs.readdirSync(directory);
    const records=pending?.selection.records;
    // The first transaction can fail after creating its immutable payload but
    // before its first selector. Only its exact, fully bound single-record
    // transaction can repair this; multi-record lost selectors remain unknown.
    if(records?.length===1&&records[0].digest===pending.digest&&records[0].check===pending.check&&
      records[0].acceptance===pending.acceptance&&entries.length<=1&&
      entries.every(name=>name===pending.digest+'.json'))return;
  }
  fail('PORTABLE_SELECTION_MISSING','Portable import selection is missing from existing storage; owner inspection is required');
}
function storageBudget(state,digest,length){
  const directory=path.join(state,DIRECTORY);
  if(!safePath(directory,{directory:true,absent:true}))return;
  const entries=fs.readdirSync(directory);let total=0,present=false;
  if(entries.length>LIMITS.records)fail('PORTABLE_SIZE','Portable storage exceeds its record limit');
  for(const name of entries){
    if(!/^[a-f0-9]{64}\.json$/.test(name))fail('PORTABLE_STATE_INVALID','Portable storage contains an unknown entry');
    const stat=safePath(path.join(directory,name));
    if(stat.size>BigInt(PORTABLE_LIMITS.bytes))fail('PORTABLE_SIZE','Portable stored envelope exceeds its byte limit');
    total+=Number(stat.size);if(name===digest+'.json')present=true;
  }
  if(entries.length+(present?0:1)>LIMITS.records||total+(present?0:length)>LIMITS.bytes)
    fail('PORTABLE_SIZE','Portable storage exceeds its cumulative limit');
}
function pendingSelection(state,next,digest,check,acceptance){
  const value=pendingTransaction(state);
  if(!value)return;
  if(value.digest!==digest||value.check!==check||value.acceptance!==acceptance)
    fail('PORTABLE_IMPORT_INCOMPLETE','Retry the exact pending portable import; a different import cannot repair it');
  if(canonical(value.selection)!==canonical(next))
    fail('PORTABLE_IMPORT_INCOMPLETE','Pending portable selection differs; owner inspection is required');
}
function assertState(state){
  safePath(state,{directory:true});
  safePath(path.join(state,'vstate-owner-v1.json'));
  for(const name of [SELECTOR,PENDING])safePath(path.join(state,name),{absent:true});
  safePath(path.join(state,DIRECTORY),{directory:true,absent:true});
}
function owner({state,configFile,root}){
  assertState(state);
  let value;try{value=parsePortableJson(readFile(path.join(state,'vstate-owner-v1.json'),8192));}
  catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_OWNERSHIP','Existing REDUE ownership could not be read');}
  const expected={schema:1,kind:'vstate-product-alpha',config:configFile,root,state};
  if(!exact(value,Object.keys(expected))||Object.entries(expected).some(([key,item])=>value[key]!==item))
    fail('PORTABLE_OWNERSHIP','Existing REDUE ownership does not match the selected project');
  try{assertOwnedStatePlacement({state,root,checks:[]});}
  catch{fail('PORTABLE_OWNERSHIP','Portable imports require non-overlapping owned state');}
  if(!/^(?:vstate|redue)-/.test(path.basename(state)))
    fail('PORTABLE_OWNERSHIP','Portable imports require a dedicated REDUE state directory');
  return directoryIdentity(safePath(state,{directory:true}));
}
function syncDirectory(directory){
  // Windows does not expose POSIX directory fsync. Files and atomic replacement
  // follow the existing platform persistence boundary; no power-loss guarantee
  // beyond that boundary is introduced by this importer.
  if(process.platform==='win32')return;
  const descriptor=fs.openSync(directory,fs.constants.O_RDONLY);
  try{fs.fsyncSync(descriptor);}finally{fs.closeSync(descriptor);}
}
function writeAtomic(file,value){
  safePath(file,{absent:true});const temporary=file+`.`+randomUUID()+`.tmp`;
  const descriptor=fs.openSync(temporary,'wx',0o600);
  try{fs.writeFileSync(descriptor,canonical(value));fs.fsyncSync(descriptor);}finally{fs.closeSync(descriptor);}
  try{
    safePath(file,{absent:true});
    // Never delete the old selector to work around replacement failure.
    for(let attempt=0;;attempt++)try{fs.renameSync(temporary,file);break;}catch(error){
      if(process.platform!=='win32'||!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt===9)throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10*(attempt+1));}
    syncDirectory(path.dirname(file));
  }finally{try{fs.unlinkSync(temporary);}catch(error){if(error.code!=='ENOENT')throw error;}}
}
function safeLock(state){
  for(const name of ['run.lock','run-recovery.lock']){
    const directory=path.join(state,name),exists=safePath(directory,{directory:true,absent:true});
    if(!exists)continue;
    for(const child of fs.readdirSync(directory))safePath(path.join(directory,child));
  }
}
export function importedRevision(state){
  assertState(state);
  const marker=parsePortableJson(readFile(path.join(state,'vstate-owner-v1.json'),8192));
  if(!exact(marker,['schema','kind','config','root','state'])||marker.schema!==1||
    marker.kind!=='vstate-product-alpha'||marker.state!==path.resolve(state)||
    typeof marker.config!=='string'||!path.isAbsolute(marker.config)||
    typeof marker.root!=='string'||!path.isAbsolute(marker.root))
    fail('PORTABLE_OWNERSHIP','Portable state ownership is incompatible');
  if(safePath(path.join(state,PENDING),{absent:true}))
    fail('PORTABLE_IMPORT_INCOMPLETE','Portable import update is incomplete; perform an explicit valid import to recover');
  const stat=safePath(path.join(state,SELECTOR),{absent:true});
  if(!stat)assertMissingSelection(state);
  return directoryIdentity(safePath(state,{directory:true}))+':'+(stat?fingerprint(stat):'absent');
}
export function readImportedSnapshot(state,expected){
  try{
    if(!expected||typeof expected.configFile!=='string'||typeof expected.root!=='string')
      fail('PORTABLE_OWNERSHIP','Expected project ownership is required to read portable imports');
    const selectionOwner={state:path.resolve(state),configFile:path.resolve(expected.configFile),root:path.resolve(expected.root)};
    const ownership=owner(selectionOwner);
    const revision=importedRevision(state),selection=selected(state),records=[];
    for(const record of selection.records){
      const bytes=readFile(path.join(state,DIRECTORY,record.digest+'.json'),PORTABLE_LIMITS.bytes);
      if(bytes.length!==record.bytes)fail('PORTABLE_STATE_INVALID','Portable immutable evidence size changed');
      const envelope=parseEnvelope(bytes);
      if(envelope.digest!==record.digest)fail('PORTABLE_DIGEST','Portable immutable evidence identity changed');
      records.push(Object.freeze({...record,envelope}));
    }
    if(owner(selectionOwner)!==ownership||importedRevision(state)!==revision)
      fail('PORTABLE_STATE_CHANGED','Portable selection or ownership changed while reading');
    return Object.freeze({revision,records:Object.freeze(records)});
  }catch(error){return Object.freeze({revision:null,records:Object.freeze([]),error:{
    code:error instanceof PortableEnvelopeError?error.code:'PORTABLE_STATE_UNAVAILABLE',
    reason:error instanceof PortableEnvelopeError?error.message:'Portable state could not be read'}});}
}
export function importEvidence({state,configFile,root,check,bytes,acceptDigest=null,apply=false}){
  const envelope=parseEnvelope(bytes),serialized=canonical(envelope),length=Buffer.byteLength(serialized);
  if(typeof check!=='string'||!check||check.length>256||/[\u0000-\u001f\u007f]/u.test(check))
    fail('PORTABLE_CHECK','Select a valid locally configured check');
  if(acceptDigest!==null&&(typeof acceptDigest!=='string'||!HEX.test(acceptDigest)||acceptDigest!==envelope.digest))
    fail('PORTABLE_ACCEPTANCE','Explicit acceptance must match this exact evidence digest');
  const expected={state:path.resolve(state),configFile:path.resolve(configFile),root:path.resolve(root)};
  const identity=owner(expected),acceptance=acceptDigest===null?'untrusted':'manual-digest-v1';
  const existing=selected(expected.state,{recoverPending:true}),prior=existing.records.find(record=>record.digest===envelope.digest);
  if(prior&&prior.check!==check)fail('PORTABLE_CHECK','This evidence is already mapped to another local check');
  const record={digest:envelope.digest,check,acceptance:prior?.acceptance==='manual-digest-v1'?prior.acceptance:acceptance,bytes:length};
  const next={schema:1,records:[...existing.records.filter(item=>item.digest!==envelope.digest),record]};
  if(next.records.length>LIMITS.records||next.records.reduce((sum,item)=>sum+item.bytes,0)>LIMITS.bytes)
    fail('PORTABLE_SIZE','Portable imports exceed their storage limit');
  pendingSelection(expected.state,next,envelope.digest,check,record.acceptance);
  storageBudget(expected.state,envelope.digest,length);
  const preview=Object.freeze({schema:1,digest:envelope.digest,check,acceptance:record.acceptance,apply,
    evidence_preserved:!!prior,producer_accepted:record.acceptance==='manual-digest-v1',reuse_eligible:false,
    writes:Object.freeze([DIRECTORY+'/'+envelope.digest+'.json',SELECTOR,PENDING])});
  if(!apply)return preview;
  safeLock(expected.state);let lock;
  try{lock=acquireRunLock(expected.state);}
  catch{fail('PORTABLE_LOCK','Existing run ownership prevents this import; inspect verification ownership');}
  try{
    if(owner(expected)!==identity)fail('PORTABLE_STATE_CHANGED','Portable state ownership changed before import');
    // Recheck under the existing run lock, not a second independent writer lock.
    const current=selected(expected.state,{recoverPending:true});
    if(canonical(current)!==canonical(existing))fail('PORTABLE_STATE_CHANGED','Portable selection changed before import');
    pendingSelection(expected.state,next,envelope.digest,check,record.acceptance);
    storageBudget(expected.state,envelope.digest,length);
    writeAtomic(path.join(expected.state,PENDING),{schema:1,digest:envelope.digest,check,acceptance:record.acceptance,selection:next});
    const directory=path.join(expected.state,DIRECTORY);
    if(!safePath(directory,{directory:true,absent:true}))fs.mkdirSync(directory,{mode:0o700});
    safePath(directory,{directory:true});const file=path.join(directory,envelope.digest+'.json');
    if(safePath(file,{absent:true})){
      if(canonical(parseEnvelope(readFile(file,PORTABLE_LIMITS.bytes)))!==serialized)
        fail('PORTABLE_DIGEST','Existing immutable evidence differs from this import');
    }else{
      const descriptor=fs.openSync(file,'wx',0o600);
      try{fs.writeFileSync(descriptor,serialized);fs.fsyncSync(descriptor);}finally{fs.closeSync(descriptor);}
      syncDirectory(directory);
    }
    if(owner(expected)!==identity)fail('PORTABLE_STATE_CHANGED','Portable state ownership changed during import');
    writeAtomic(path.join(expected.state,SELECTOR),next);
    fs.unlinkSync(path.join(expected.state,PENDING));syncDirectory(expected.state);
    return Object.freeze({...preview,evidence_preserved:true});
  }catch(error){
    if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_IMPORT_FAILED','Portable import could not complete; inspect owned state before retrying');
  }finally{
    try{lock.release();}
    catch{fail('PORTABLE_LOCK','Portable import lock could not be released; inspect verification ownership');}
  }
}
