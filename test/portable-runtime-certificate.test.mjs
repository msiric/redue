import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {portableRuntimeSupported} from '../src/portable-runtime.mjs';
import {portableCallerProof,portableProbeFacts,portableFactsProof} from '../src/portable-facts.mjs';
import {directEnvironment,directQualification} from '../src/direct-typescript.mjs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import os from 'node:os';
const file='/System/Volumes/Preboot/Cryptexes/OS/System/Library/dyld/dyld_shared_cache_arm64e',uuid='a'.repeat(32);
function fixture(){
 const contents=new Map(),stats=new Map(),descriptors=new Map();let next=1,reads=0,hook=null;
 const base=Buffer.alloc(608);Buffer.from('dyld_v1  arm64e\0').copy(base);base.writeUInt32LE(552,16);Buffer.from(uuid,'hex').copy(base,88);base.writeUInt32LE(1,216);base.writeUInt32LE(552,392);base.writeUInt32LE(1,396);Buffer.from('b'.repeat(32),'hex').copy(base,552);Buffer.from('.01').copy(base,576);
 const child=Buffer.alloc(256,32);Buffer.from('dyld_v1  arm64e\0').copy(child);Buffer.from('b'.repeat(32),'hex').copy(child,88);
 function stat(isFile,size){const ino=BigInt(next++);return {dev:1n,ino,uid:0n,mode:BigInt(isFile?0o100644:0o40755),size:BigInt(size),mtimeNs:2n,ctimeNs:3n,isFile:()=>isFile,isDirectory:()=>!isFile,isSymbolicLink:()=>false};}
 for(const [name,bytes] of [[file,base],[file+'.01',child]]){contents.set(name,bytes);stats.set(name,stat(true,bytes.length));}
 let parent=path.dirname(file);while(true){stats.set(parent,stat(false,1024));if(parent===path.dirname(parent))break;parent=path.dirname(parent);}
 stats.get('/System/Volumes/Preboot/Cryptexes').mode=0o40777n;
 const cache={file,uuid,overridden:false,interposed:false,cryptexRoot:{dev:'1',ino:String(stats.get('/System/Volumes/Preboot/Cryptexes/OS').ino),flags:0x00100000}};
 const events=[];
 const fake={constants:fs.constants,realpathSync:p=>p,lstatSync:p=>{assert(stats.has(p));return {...stats.get(p)};},openSync:p=>{const fd=next++;descriptors.set(fd,p);return fd;},fstatSync:fd=>({...stats.get(descriptors.get(fd))}),closeSync:fd=>descriptors.delete(fd),readSync(fd,b,off,len,pos){const bytes=contents.get(descriptors.get(fd));bytes.copy(b,off,pos,pos+len);reads+=len;hook?.(descriptors.get(fd),pos,len);return len;}};
 const source=fs.readFileSync(new URL('../src/portable-runtime-cache.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function ','function ');
 const context={fs:fake,path,createHash,Buffer,performance,portableCacheDeadlineMs:25000,profiling:false,mark(){},timing(phase,_start,data){events.push({phase,...data});}};
 vm.createContext(context);vm.runInContext(source+'\nthis.inspect=inspectCacheProfile;',context);
 return {cache,stats,contents,events,inspect:certificate=>context.inspect(cache,{certificate}),reads:()=>reads,hook:fn=>{hook=fn;}};
}
const refused=fn=>assert.throws(fn,e=>e.code==='PORTABLE_RUNTIME_UNSUPPORTED');
test('locally learned complete cache content is revalidated without repeating body reads',()=>{
 const f=fixture(),full=f.inspect();assert.equal(full.inspection,'full');const first=f.reads(),warm=f.inspect(full.certificate);
 assert.equal(warm.inspection,'revalidated');assert.equal(JSON.stringify(warm.content),JSON.stringify(full.content));
 // Warm still reads the complete bounded base and each current member header.
 assert.equal(f.reads()-first,608+104);assert.equal(f.events.at(-1).hashedBytes,0);
});
test('missing, obsolete, incomplete and altered membership certificates fall back to full content inspection',()=>{
 const f=fixture(),first=f.inspect();
 for(const c of [null,{}, {schema:2}, {...first.certificate,content:null}, {...first.certificate,guard:{}}])assert.equal(f.inspect(c).inspection,'full');
 const renamed=fixture(),c=renamed.inspect().certificate;renamed.stats.get(file+'.01').ino+=100n;
 assert.equal(renamed.inspect(c).inspection,'full');
 const bodyChanged=fixture(),b=bodyChanged.inspect().certificate;bodyChanged.contents.get(file+'.01')[200]=3;bodyChanged.stats.get(file+'.01').ctimeNs++;
 const next=bodyChanged.inspect(b);assert.equal(next.inspection,'full');assert.notEqual(next.content.files[1][1],b.content.files[1][1]);
});
test('protected parent, native override, UUID and member header prerequisites remain authoritative',()=>{
 for(const change of [f=>{f.cache.overridden=true;},f=>{f.cache.interposed=true;},f=>{f.cache.uuid='d'.repeat(32);},f=>{f.cache.cryptexRoot.flags=0;},f=>{f.stats.get(path.dirname(file)).uid=2n;},f=>{f.stats.get(file+'.01').mode|=0o002n;},f=>{f.contents.get(file+'.01')[88]=1;}]){
  const f=fixture(),c=f.inspect().certificate;change(f);refused(()=>f.inspect(c));
 }
});
test('member or parent replacement during header revalidation never returns learned content',()=>{
 for(const target of [file+'.01',path.dirname(file)]){
  const f=fixture(),c=f.inspect().certificate;f.hook((name,_position,length)=>{if(name===file+'.01'&&length===104){f.stats.get(target).ctimeNs++;f.hook(null);}});refused(()=>f.inspect(c));
 }
});
test('warm returned content is isolated from its supplied record; no imported/client authority is claimed',()=>{
 const f=fixture(),full=f.inspect(),warm=f.inspect(full.certificate);warm.content.files[0][1]='0'.repeat(64);
 assert.notEqual(full.content.files[0][1],warm.content.files[0][1]);
 // Only the daemon's privately minted record may reach this low-level transport.
 // Writable caller certificates are not authenticated by this pure inspector.
 const daemon=fs.readFileSync(new URL('../src/daemon.mjs',import.meta.url),'utf8');
 assert.match(daemon,/const portableRuntimeCertificates=new Map/);assert.match(daemon,/certificate:frozenPrivateRecord\(learnedCertificate\)/);
 assert.doesNotMatch(daemon,/message\.(?:runtimeCertificate|privateRuntimeCertificate)/);
 const facts=fs.readFileSync(new URL('../src/portable-facts.mjs',import.meta.url),'utf8');
 assert.match(facts,/const \{privateRuntimeCertificate,\.\.\.discovered\}/);assert.match(facts,/capturePortableValidation\(plan,snapshot,context,budget\)\.facts/);
});

test('real full and revalidated built-in probe facts agree; private content never enters caller proofs',
 {skip:!portableRuntimeSupported(),timeout:150000},t=>{
 // Owned controlled same-machine checkout; no command execution, credentials,
 // observer, or broad ancestor observation is used by these read-only probes.
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-runtime-proof-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{typecheck:'tsc --noEmit'}}));
 fs.writeFileSync(path.join(root,'package-lock.json'),'{"lockfileVersion":3}');
 fs.writeFileSync(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,noLib:true,types:[],typeRoots:['./node_modules/@types']},include:['src']}));
 fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src/a.ts'),'export const value=1;');
 const installed=path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
 fs.cpSync(installed,path.join(root,'node_modules/typescript'),{recursive:true});
 const imports=`import assert from 'node:assert/strict';import path from 'node:path';import {spawnSync} from 'node:child_process';
 import {fileURLToPath} from 'node:url';
 import {portableCallerProof,portableProbeFacts,portableFactsProof} from ${JSON.stringify(new URL('../src/portable-facts.mjs',import.meta.url).href)};
 import {directEnvironment,directQualification,directProject} from ${JSON.stringify(new URL('../src/direct-typescript.mjs',import.meta.url).href)};`;
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
 const result=spawnSync(process.execPath,['--input-type=module','-e',imports+`const root=${JSON.stringify(root)};`+actualProofControls.toString()+';actualProofControls(root);'],
  {cwd:path.resolve('.'),env,encoding:'utf8',timeout:140000,maxBuffer:16384});
 assert.equal(result.status,0,result.stderr);assert.equal(result.signal,null);assert.equal(result.stdout,'PROOF_CONTROLS_PASS');
});
function actualProofControls(root){
 const probe=path.resolve('src/direct-typescript-probe.mjs');
 const plan={root,cwd:root,qualification:directQualification,unresolved:[],externalObservationRoots:[],
  environment:directEnvironment,probes:[[process.execPath,probe,root,'typecheck']],
  command:[process.execPath,directProject(root,'typecheck').entry,'--noEmit'],
  sourcePatterns:['package.json','tsconfig.json','**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}','!node_modules/**','!.git/**'],
  additivePatterns:[],declaredInstalledInputs:['node_modules/**'],declaredGeneratedInputs:[]};
 const full=portableProbeFacts(plan),warm=portableProbeFacts(plan,{runtimeCertificate:full.runtimeCertificate});
 assert(full.runtimeCertificate);assert.deepEqual(warm.discovered,full.discovered);assert.deepEqual(warm.recipe,full.recipe);
 assert.equal(Object.hasOwn(full.discovered,'privateRuntimeCertificate'),false);
 const facts={recipe:full.recipe,runtime:full.discovered.runtime,compiler:full.discovered.compiler,discovery:full.discovered.discovery};
 const callerProof=portableCallerProof(plan);
 assert.equal(callerProof,portableFactsProof(facts),'caller independently performs full inspection with the same proof');
 const corrupted=structuredClone(full.runtimeCertificate);corrupted.cache.content.files[0][1]='0'.repeat(64);
 const forged=portableProbeFacts(plan,{runtimeCertificate:corrupted});
 assert.notDeepEqual(forged.discovered,full.discovered,'low-level private transport is not an authentication mechanism');
 assert.notEqual(portableFactsProof({...facts,runtime:forged.discovered.runtime}),callerProof,
  'independent caller content rejects fabricated daemon content; arbitrary writable records cannot grant reuse');
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key)));
 const malformed=spawnSync(process.execPath,[probe,root,'typecheck','--redue-portable','--redue-private-runtime-certificate'],
  {env,encoding:'utf8',input:'{"schema":',timeout:30000,maxBuffer:1024*1024});
 assert.equal(malformed.status,0,malformed.stderr);const {privateRuntimeCertificate:_private,...ordinary}=JSON.parse(malformed.stdout);
 assert.deepEqual(ordinary,full.discovered,'malformed private input falls back to full inspection');
 process.stdout.write('PROOF_CONTROLS_PASS');
}
