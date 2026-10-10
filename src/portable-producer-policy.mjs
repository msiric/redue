// Read-only owner-local policy currency, not authentication or acceptance. The
// integration selects this path from locally owned configuration/state, never
// from imported evidence. No policy writer or global/default path exists here.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical,parsePortableJson,PortableEnvelopeError} from './portable-envelope.mjs';
import {validateCIPolicy} from './portable-ci-trust.mjs';

export const PRODUCER_POLICY_INTERPRETATION='redue-producer-policy-registry@1';
export const PRODUCER_POLICY_LIMITS=Object.freeze({bytes:65536,policies:8});
const minted=new WeakMap(),HEX=/^[a-f0-9]{64}$/;
const fail=(code,message)=>{throw new PortableEnvelopeError(code,message);};
const sha=value=>createHash('sha256').update(value).digest('hex');
const sameStat=(a,b)=>['dev','ino','size','mtimeNs','ctimeNs','uid','mode','nlink'].every(key=>a[key]===b[key]);
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function permissions(stat,{directory=false,nearest=false}={}){
  if(typeof process.getuid!=='function')
    fail('PORTABLE_PRODUCER_POLICY_OWNER','Current-user filesystem ownership cannot be established on this host');
  const uid=BigInt(process.getuid()),owner=stat.uid===uid;
  // Root-owned sticky temporary parents are acceptable only above a separately
  // owned non-writable policy directory. Other writable ancestry is not accepted.
  const stickyRoot=directory&&!nearest&&stat.uid===0n&&(stat.mode&0o1000n)!==0n;
  const wrongOwner=nearest||!directory?!owner:!owner&&stat.uid!==0n;
  if(wrongOwner||(stat.mode&0o022n)!==0n&&!stickyRoot)
    fail('PORTABLE_PRODUCER_POLICY_OWNER','Policy path must be owner-controlled and not group/other writable');
}
function location(file){
  if(typeof file!=='string'||!path.isAbsolute(file)||file.includes('\0'))
    fail('PORTABLE_PRODUCER_POLICY_PATH','Select one explicit absolute local policy path');
  const resolved=path.resolve(file),base=path.parse(resolved).root,parts=resolved.slice(base.length).split(path.sep),parents=[];
  let current=base;
  const rootStat=fs.lstatSync(base,{bigint:true});permissions(rootStat,{directory:true});
  for(let at=0;at<parts.length;at++){
    const part=parts[at];if(!part||process.platform==='win32'&&part.includes(':'))
      fail('PORTABLE_PRODUCER_POLICY_PATH','Unsafe policy path component');
    current=path.join(current,part);const stat=fs.lstatSync(current,{bigint:true});
    if(stat.isSymbolicLink())fail('PORTABLE_PRODUCER_POLICY_PATH','Policy paths must not contain symlinks');
    if(at<parts.length-1){
      if(!stat.isDirectory())fail('PORTABLE_PRODUCER_POLICY_PATH','Policy parent must be a directory');
      permissions(stat,{directory:true,nearest:at===parts.length-2});
      parents.push([String(stat.dev),String(stat.ino),String(stat.uid),String(stat.mode)]);
    }else{
      if(!stat.isFile()||stat.nlink!==1n)
        fail('PORTABLE_PRODUCER_POLICY_PATH','Policy must be a single-link regular file');
      permissions(stat);return {file:resolved,stat,parents:canonical(parents)};
    }
  }
  fail('PORTABLE_PRODUCER_POLICY_PATH','Policy cannot be a filesystem root');
}
function readPolicy(file){
  let descriptor;
  try{
    const before=location(file);
    if(before.stat.size>BigInt(PRODUCER_POLICY_LIMITS.bytes))
      fail('PORTABLE_PRODUCER_POLICY_SIZE','Policy registry exceeds its byte limit');
    descriptor=fs.openSync(before.file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(descriptor,{bigint:true});
    if(!opened.isFile()||opened.nlink!==1n||!sameStat(before.stat,opened))
      fail('PORTABLE_PRODUCER_POLICY_CHANGED','Policy changed while opening');
    const bytes=Buffer.alloc(Number(opened.size));let offset=0;
    while(offset<bytes.length){const count=fs.readSync(descriptor,bytes,offset,bytes.length-offset,offset);
      if(!count)fail('PORTABLE_PRODUCER_POLICY_CHANGED','Policy ended before its declared size');offset+=count;}
    const after=location(before.file);
    if(!sameStat(opened,fs.fstatSync(descriptor,{bigint:true}))||!sameStat(opened,after.stat)||before.parents!==after.parents)
      fail('PORTABLE_PRODUCER_POLICY_CHANGED','Policy changed during reading');
    const value=parsePortableJson(bytes);
    if(!exact(value,['schema','interpretation','revision','policies'])||value.schema!==1||
      value.interpretation!==PRODUCER_POLICY_INTERPRETATION||!Number.isSafeInteger(value.revision)||value.revision<1||
      !Array.isArray(value.policies)||value.policies.length>PRODUCER_POLICY_LIMITS.policies)
      fail('PORTABLE_PRODUCER_POLICY_INVALID','Unsupported local producer policy registry');
    const seen=new Set(),policies=value.policies.map(item=>{
      const policy=validateCIPolicy(item),digest=sha(canonical(policy));
      if(seen.has(digest))fail('PORTABLE_PRODUCER_POLICY_INVALID','Duplicate local producer policy');
      seen.add(digest);return Object.freeze({digest,policy});
    });
    const snapshot=Object.freeze({schema:1,interpretation:PRODUCER_POLICY_INTERPRETATION,
      revision:value.revision,contentDigest:sha(bytes),policies:Object.freeze(policies)});
    minted.set(snapshot,{file:before.file,stat:opened,parents:before.parents});return snapshot;
  }catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_PRODUCER_POLICY_UNAVAILABLE','Local producer policy could not be read');
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
export const readProducerPolicySnapshot=policyFile=>readPolicy(policyFile);
// Revalidate after authentication and at acceptance/publication barriers. This
// compares bytes and physical identity, not elapsed time or an mtime alone.
export function revalidateProducerPolicySnapshot(snapshot,{expectedFile}={}){
  const prior=minted.get(snapshot);if(!prior)return false;
  if(expectedFile!==undefined&&(typeof expectedFile!=='string'||!path.isAbsolute(expectedFile)||
    path.resolve(expectedFile)!==prior.file))return false;
  try{const current=readPolicy(prior.file),now=minted.get(current);
    return current.revision===snapshot.revision&&current.contentDigest===snapshot.contentDigest&&
      sameStat(prior.stat,now.stat)&&prior.parents===now.parents;
  }catch{return false;}
}
// Persisted bindings do not require JS mintedness. The integration supplies this
// binding only after its explicit authenticated acceptance path. Reading a match
// does not itself authenticate a producer, grant acceptance, or establish CURRENT.
export function producerPolicyBindingCurrent(policyFile,binding){
  if(!exact(binding,['revision','contentDigest','policyDigest'])||!Number.isSafeInteger(binding.revision)||binding.revision<1||
    typeof binding.contentDigest!=='string'||!HEX.test(binding.contentDigest)||
    typeof binding.policyDigest!=='string'||!HEX.test(binding.policyDigest))return false;
  try{const current=readPolicy(policyFile);
    return current.revision===binding.revision&&current.contentDigest===binding.contentDigest&&
      current.policies.some(item=>item.digest===binding.policyDigest);
  }catch{return false;}
}
