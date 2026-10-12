// Test-only fixed API observation profile. Construction never loads TS or runs.
// Not a native-agent boundary, sealed tree, receipt or reusable certificate.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {sealedCompilerFixtureProfile} from './sealed-typescript-compiler-profile.mjs';
const fail=()=>{throw Object.assign(Error('Fixed discovery code unavailable'),{code:'SEALED_DISCOVERY_CODE'});};
const quote=p=>JSON.stringify(p),sha=b=>createHash('sha256').update(b).digest('hex');
export function sealedDiscoveryFixtureProfile(options){
 const base=sealedCompilerFixtureProfile(options),repo=fileURLToPath(new URL('../../',import.meta.url)),child=fileURLToPath(new URL('./sealed-typescript-discovery-child.mjs',import.meta.url));
 const selected=['test/acceptance/sealed-typescript-discovery-child.mjs','test/acceptance/sealed-typescript-program-probe.mjs','test/acceptance/sealed-typescript-discovery-journal.mjs','test/acceptance/sealed-typescript-forwarding.mjs','src/typescript-list.mjs','src/direct-typescript.mjs','src/path-identity.mjs','package.json'];
 const code=[],metadata=new Set();
 for(const relative of selected){const file=path.join(repo,relative),st=fs.lstatSync(file,{bigint:true});
  if(fs.realpathSync(file)!==file||!st.isFile()||st.isSymbolicLink()||st.nlink!==1n||st.uid!==BigInt(process.getuid())||(st.mode&0o7022n)!==0n||st.size>256n*1024n)fail();
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let bytes;
  const fingerprint=s=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
  try{if(fingerprint(fs.fstatSync(fd,{bigint:true}))!==fingerprint(st))fail();bytes=fs.readFileSync(fd);if(fingerprint(fs.fstatSync(fd,{bigint:true}))!==fingerprint(st))fail();}finally{fs.closeSync(fd);}
  if(fingerprint(fs.lstatSync(file,{bigint:true}))!==fingerprint(st))fail();
  code.push(Object.freeze({relative,file,sha256:sha(bytes),physical:fingerprint(st)}));
  for(let p=path.dirname(file);;p=path.dirname(p)){const s=fs.lstatSync(p);if(!s.isDirectory()||s.isSymbolicLink()||fs.realpathSync(p)!==p)fail();metadata.add(p);if(p===path.dirname(p))break;}
 }
 // Add only exact readonly locally bound code files and ancestor metadata. No
 // arbitrary source path, whole repository read, command or new write grant.
 const profile=base.profile+'\n(allow file-read* '+code.map(row=>'(literal '+quote(row.file)+')').join(' ') +')\n(allow file-read-metadata '+[...metadata].sort().map(p=>'(literal '+quote(p)+')').join(' ')+')\n';
 return Object.freeze({...base,scope:'FIXED_READONLY_STAGED_API_OBSERVATION_PROFILE_ONLY',
  interpretation:'redue-staged-discovery-fixture-darwin@1',command:Object.freeze([base.node,child,options.script]),code:Object.freeze(code),profile,profileSha256:sha(profile),compilerVerificationExecuted:false,queryCompleteness:'NOT_ESTABLISHED',sealed:false,reuseEligible:false});
}
