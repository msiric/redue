// Data-only proposal from byte-exact public native2.1.187 source, not a native
// sandbox/profile enforcement or Bun-equivalence claim. This constructor never
// evaluates extracted source. Caller must locally select the reviewed PUBLIC
// distribution, not an artifact-selected path. Ancestor checks are conservative
// trusted/quiescent guards, not atomic hostile-parent read confinement.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
export const CLAUDE187_GENERATOR_NATIVE_SHA256='a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3';
const nativeBytes=215994048;
const spans=Object.freeze([
  [
    "common_prefix",
    193494692,
    1278,
    "8adddbfbc490e0343d8b2b32b585097142e77f317054c10f5ffc376104f47309"
  ],
  [
    "DUi",
    198169597,
    8,
    "7cd0227223febd13999ff6e34b4e0cd32eaf8bb97d99afbe7bad387045aa0d50"
  ],
  [
    "_Lt",
    198169605,
    45,
    "19e2b20d8461ff6e62cdb60a64ccfa7b25412b62b13dc183b9141d5b26fdcd9f"
  ],
  [
    "PUi",
    198169810,
    8,
    "68b1d5ccbde49b59309b76d71acb580c4204164764dc5eb715ff7162fa69d5e3"
  ],
  [
    "Fwn",
    198169818,
    37,
    "38eee015169d21f5a145ea7e09776c2eea4e59261b98627e5cca55af31be82df"
  ],
  [
    "MUi",
    198169856,
    1070,
    "5957c2fc96faafd26b1b87417f0fcfe6eb8cf88af3e3af4f29b5298a806e7727"
  ],
  [
    "WUi",
    198170927,
    2312,
    "d90a2e04c57689d6e68fa9e7fba36cabd2adea86526a852105337b743a42b3bd"
  ],
  [
    "nGr",
    198173240,
    51,
    "8d4330f7540d8decf6510c21541b1ba7ce7e3bce748a36a2815725267c91d9df"
  ],
  [
    "qwn",
    198173788,
    90,
    "07b797759b9eab1ab8518c293553f1a172fd9390dd20fa63c7e420c463326eec"
  ],
  [
    "kO",
    198173917,
    89,
    "11fbaa136a213c8e9fb4358980b4df68879fbcdc72d67dddf4ce887a56fab5e7"
  ],
  [
    "$wn",
    198174058,
    620,
    "e4fad841ab1bc35c3a18d28512f2e6c64483dba8642a69c4b03681005b5716ec"
  ],
  [
    "JF",
    198174678,
    498,
    "1d4a8383847c6614c6597c4f5285ee7df326d808b2296227347cb813d5479fc7"
  ],
  [
    "Gwe",
    198177173,
    285,
    "9ca1f4e5befdbcde85be65e2a8a4a1c4ec3bde777ae16f915b309f6e8b3a185d"
  ],
  [
    "common_globals",
    198177988,
    27,
    "12243ad6640fee4bdee4d6a184f72af3692bc6b57414577c1d9518b040287959"
  ],
  [
    "c_dollar_e",
    198178015,
    388,
    "ea95366abc0fa766d31b14d95ee64758ba2858b1578bc1e02b58d197230264ff"
  ],
  [
    "A0d",
    198192639,
    322,
    "24ac603d2b5eda8e0cfc00109fa65e8415df39223b6f318e7495e7591cc69cfc"
  ],
  [
    "c2i",
    198193012,
    125,
    "72ee6bbfeafbc76f7e07f58c234a94f0a4618728796faab516eb570e394e89b5"
  ],
  [
    "m2i",
    198193137,
    700,
    "4f66339e7aa5839cf5e8c250394967a7bad50ed964b92fa7aea15c24534d54ac"
  ],
  [
    "v0d",
    198193837,
    1202,
    "20f79f2ebf86648844fb79065a46b59fecf2cb3d7777dd0c6cad45772f7e8d6d"
  ],
  [
    "w0d",
    198195039,
    576,
    "8729fbbc0f21778d00785c97526dc4f58ddf1c1e963dbd54f801cb0d42bf9d90"
  ],
  [
    "k0d",
    198195615,
    7508,
    "3ed1aed935a33248ba7b4d7a019027ced5bfd84c1977823060e0929a710d8516"
  ],
  [
    "z0",
    198203123,
    40,
    "9bf9baa1e4c5c6fddf0f29fb0698cc9806d24ce1e6460d0f84b3e8fda6cd970f"
  ],
  [
    "mac_globals",
    198205440,
    20,
    "7a64803d8dfff154fd268cea4581c069994a9321e59a4c60791c116836ff2d88"
  ],
  [
    "g2i",
    198205460,
    148,
    "0ea048946731d6cbe50124293019b799d9885665826f5f95f5cb35c6f62c3c6e"
  ]
].map(Object.freeze));

const sha=value=>createHash('sha256').update(value).digest('hex');
const fingerprint=stat=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
const error=code=>Object.assign(Error(code),{code});
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const stat=fs.lstatSync(at,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink())throw error('GENERATOR_SOURCE_PATH');rows.push([at,[stat.dev,stat.ino,stat.mode,stat.uid,stat.gid].map(String).join(':')]);if(at===path.dirname(at))return rows;}}
function parentsMatch(rows){for(const [file,before] of rows){const stat=fs.lstatSync(file,{bigint:true});if(!stat.isDirectory()||stat.isSymbolicLink()||[stat.dev,stat.ino,stat.mode,stat.uid,stat.gid].map(String).join(':')!==before)throw error('GENERATOR_SOURCE_CHANGED');}}
function regular(stat){return stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1n&&stat.size===BigInt(nativeBytes)&&typeof process.getuid==='function'&&stat.uid===BigInt(process.getuid())&&(stat.mode&0o22n)===0n;}
export function prepareClaude187GeneratorProposal(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==1||!Object.hasOwn(options,'native')||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,'native'),'value'))throw error('GENERATOR_OPTIONS');
  const {native}=options;if(typeof native!=='string'||!path.isAbsolute(native)||path.normalize(native)!==native||native.endsWith('/')||Buffer.byteLength(native)>4096||Buffer.from(native).toString('utf8')!==native||/[\u0000-\u001f\u007f\\:]/u.test(native))throw error('GENERATOR_SOURCE_PATH');
  let fd,failure,result;
  try{
    if(fs.constants.O_NOFOLLOW===undefined||fs.constants.O_NONBLOCK===undefined||fs.realpathSync(native)!==native)throw error('GENERATOR_SOURCE_PATH');
    const ancestry=parents(native),named=fs.lstatSync(native,{bigint:true});if(!regular(named))throw error('GENERATOR_SOURCE_IDENTITY');
    fd=fs.openSync(native,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);const before=fs.fstatSync(fd,{bigint:true});if(!regular(before)||fingerprint(before)!==fingerprint(named))throw error('GENERATOR_SOURCE_CHANGED');
    const hash=createHash('sha256'),chunk=Buffer.alloc(65536);let offset=0;
    while(offset<nativeBytes){const requested=Math.min(chunk.length,nativeBytes-offset),count=fs.readSync(fd,chunk,0,requested,offset);if(!Number.isInteger(count)||count<=0||count>requested)throw error('GENERATOR_SOURCE_UNAVAILABLE');hash.update(chunk.subarray(0,count));offset+=count;}
    if(hash.digest('hex')!==CLAUDE187_GENERATOR_NATIVE_SHA256)throw error('GENERATOR_SOURCE_IDENTITY');
    const fragments=[];for(const [name,at,length,digest] of spans){const bytes=Buffer.alloc(length);let read=0;
      while(read<length){const count=fs.readSync(fd,bytes,read,length-read,at+read);if(!Number.isInteger(count)||count<=0||count>length-read)throw error('GENERATOR_SOURCE_UNAVAILABLE');read+=count;}
      const text=bytes.toString('utf8');if(sha(bytes)!==digest||Buffer.from(text).compare(bytes)!==0)throw error('GENERATOR_SOURCE_CLOSURE');fragments.push(text);
    }
    const after=fs.fstatSync(fd,{bigint:true}),afterNamed=fs.lstatSync(native,{bigint:true});if(!regular(after)||!regular(afterNamed)||fingerprint(before)!==fingerprint(after)||fingerprint(before)!==fingerprint(afterNamed))throw error('GENERATOR_SOURCE_CHANGED');parentsMatch(ancestry);
    const code=fragments.join('\n;\n');
    result=freeze({schema:1,scope:'PINNED_PUBLIC_GENERATOR_COMPOSITION_PROPOSAL_ONLY',disabled:true,source:code,sourceSha256:sha(code),nativeSha256:CLAUDE187_GENERATOR_NATIVE_SHA256,nativeVersion:'2.1.187',fragmentCount:spans.length,
      closure:spans.map(([name,offset,length,sha256])=>({name,offset,length,sha256})),initialization:'g2i',generator:'k0d',builtinModules:['fs','path','os','child_process'],
      quirks:['ROOT_LITERAL_READ_AND_DIRECTORY_METADATA_ALLOW','PUBLIC_READ_ENTRIES_ARE_SUBPATH_NOT_LITERAL','STATIC_MACH_PREFERENCES_IPC_DEVICE_SYSCTL_ALLOWANCES','AF_SYSTEM_SOCKET_ALLOWANCE_REMAINS','RAW_LOG_TAG_REQUIRES_FIXED_SAFE_LOCAL_VALUE','CWD_HOME_REALPATH_ARE_ACTUAL_HOST_DEPENDENCIES'],
      commands:[],nativeEnforcement:'NOT_ESTABLISHED',bunEquivalence:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
  }catch(cause){failure=error(['GENERATOR_SOURCE_PATH','GENERATOR_SOURCE_IDENTITY','GENERATOR_SOURCE_CHANGED','GENERATOR_SOURCE_CLOSURE','GENERATOR_SOURCE_UNAVAILABLE'].includes(cause?.code)?cause.code:'GENERATOR_SOURCE_UNAVAILABLE');}
  finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failure??=error('GENERATOR_SOURCE_UNAVAILABLE');}}
  if(failure)throw failure;return result;
}
