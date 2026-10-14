// In-memory filesystem/process controls and harmless local gzip only. No tool,
// compiler, native agent, model, credential, real report file or upload executes.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {gzipSync,gunzipSync} from 'node:zlib';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-public-inspection-files.mjs',import.meta.url),'utf8');
const cwd='/owned/checkout',directory=cwd+'/.redue-public-inspection',payload=directory+'/public-inspection.json.gz',manifestFile=directory+'/manifest.json';
const sha=v=>createHash('sha256').update(v).digest('hex');
function mock(){
 let ino=1,fd=10,now=0n;const nodes=new Map(),fds=new Map(),state={inspections:0,opened:[],closed:0,read:[],written:[],fail:null,afterWrite:null,report:null,compressed:null};
 const put=(file,kind='d',owner=0n,mode=0o40755n)=>nodes.set(file,{kind,uid:owner,gid:0n,mode,nlink:1n,dev:1n,ino:BigInt(ino++),size:0n,mtimeNs:1n,ctimeNs:1n,body:Buffer.alloc(0)});
 for(const p of ['/','/owned'])put(p);put(cwd,'d',501n);
 const statRow=r=>({...r,isDirectory:()=>r.kind==='d',isFile:()=>r.kind==='f',isSymbolicLink:()=>r.kind==='l'});
 const stat=file=>{const r=nodes.get(file);if(!r)throw Object.assign(Error('PRIVATE'),{code:'ENOENT'});if(state.fail==='stat')throw Error('PRIVATE');return statRow(r);};
 const io={constants:{O_RDWR:1,O_CREAT:2,O_EXCL:4,O_NOFOLLOW:8,O_NONBLOCK:16},lstatSync:stat,realpathSync:file=>state.fail==='alias'?file+'-alias':file,
  mkdirSync(file,options){assert.equal(file,directory);assert.deepEqual(options,{mode:0o700});if(nodes.has(file))throw Object.assign(Error('PRIVATE'),{code:'EEXIST'});if(state.fail==='mkdir')throw Error('PRIVATE');put(file,'d',501n,0o40700n);},
  readdirSync:file=>{assert.equal(file,directory);return state.fail==='occupied'?['owned-unknown']:[];},
  openSync(file,flags,mode){assert([payload,manifestFile].includes(file));assert.equal(flags,31);assert.equal(mode,0o600);if(nodes.has(file))throw Object.assign(Error('PRIVATE'),{code:'EEXIST'});if(state.fail==='open')throw Error('PRIVATE');put(file,'f',501n,0o100600n);const n=fd++;fds.set(n,{file,row:nodes.get(file)});state.opened.push(file);return n;},
  fstatSync:n=>statRow(fds.get(n).row),
  writeSync(n,b,offset,length,position){const {row,file}=fds.get(n);state.written.push(file);if(state.fail==='write')return 0;const next=Buffer.alloc(position+length);row.body.copy(next);b.copy(next,position,offset,offset+length);row.body=next;row.size=BigInt(next.length);row.mtimeNs++;if(state.afterWrite)state.afterWrite(file);return length;},
  fsyncSync(){if(state.fail==='fsync')throw Error('PRIVATE');},
  readSync(n,b,offset,length,position){const {row,file}=fds.get(n);state.read.push(file);if(state.fail==='read')return 0;return row.body.copy(b,offset,position,Math.min(position+length,row.body.length));},
  closeSync(n){fds.delete(n);state.closed++;if(state.fail==='close')throw Error('PRIVATE');}};
 const report=()=>({schema:1,interpretation:'redue-fixed-public-macho-inspection@2',scope:'PUBLIC_STATIC_SOURCE_INSPECTION_ONLY',outcome:'UNKNOWN',reason:'TOOL_EXECUTION_INCOMPLETE',publicOutputUntrusted:true,profileApproved:false,sealed:false,reuseEligible:false,models:0,nativeAgentLaunches:0,targetExecutions:0,compilerCheckExecutions:0,calls:[{stdout:'FULL PUBLIC\nTEXT "quoted"',stderrBytes:5,stderrSha256:'a'.repeat(64),stderrClassification:'OTHER'}]});
 const proc={platform:'darwin',arch:'arm64',version:'v22.13.0',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20,cwd:()=>cwd,hrtime:{bigint:()=>now}};
 const inspect=()=>{state.inspections++;if(state.fail==='inspection')throw Error('PRIVATE');return state.report??report();};
 const gzip=(raw,options)=>{assert.deepEqual(options,{level:9,mtime:0,maxOutputLength:2*1024*1024});return state.compressed??gzipSync(raw,options);};
 const gunzip=(body,options)=>{assert.deepEqual(options,{maxOutputLength:24*1024*1024});if(state.fail==='decompress')throw Error('PRIVATE');return gunzipSync(body,options);};
 const code=source.replace(/^import .*;$/gm,'').replaceAll('export function ','function ');
 const run=Function('fs','path','createHash','gzipSync','gunzipSync','inspectFixedNativeStartupPublicBinaries','process',code+';return collectFixedPublicMachOInspectionFiles;')(io,path.posix,createHash,gzip,gunzip,inspect,proc);
 return {run,state,nodes,fds,proc,report,advance:ms=>{now+=BigInt(ms)*1000000n;}};
}
function noAuthority(r){assert.equal(r.untrustedPublicData,true);for(const k of ['profileApproved','sealed','reuseEligible'])assert.equal(r[k],false);for(const k of ['models','nativeAgentLaunches','targetExecutions','compilerCheckExecutions'])assert.equal(r[k],0);}
test('unknown inspection has complete fixed transport with exact JSON and hashes, never becomes passing evidence',()=>{
 const m=mock(),r=m.run();noAuthority(r);assert.equal(r.transport,'PUBLIC_REPORT_FILES_READY');assert.equal(r.inspectionOutcome,'UNKNOWN');assert.equal(r.ownedDescriptorsClosed,true);assert.equal(m.state.inspections,1);assert.deepEqual(r.files,['public-inspection.json.gz','manifest.json']);
 const zipped=m.nodes.get(payload).body,raw=gunzipSync(zipped,{maxOutputLength:24*1024*1024}),manifest=JSON.parse(m.nodes.get(manifestFile).body);assert.deepEqual(JSON.parse(raw),m.report());assert.equal(raw.toString(),JSON.stringify(m.report())+'\n');
 for(const [k,v]of [['rawBytes',raw.length],['compressedBytes',zipped.length],['rawSha256',sha(raw)],['compressedSha256',sha(zipped)]]){assert.equal(r[k],v);assert.equal(manifest[k],v);}assert.equal(r.manifestSha256,sha(m.nodes.get(manifestFile).body));assert.equal(r.payloadBytes,zipped.length+m.nodes.get(manifestFile).body.length);assert(r.payloadBytes<=2*1024*1024);assert.equal(manifest.rawDecompressionLimit,24*1024*1024);assert.equal(manifest.outcome,'UNKNOWN');assert(!JSON.stringify(r).includes('FULL PUBLIC'));assert.equal(m.fds.size,0);
 for(const file of [payload,manifestFile]){const row=m.nodes.get(file);assert.equal(row.mode,0o100600n);assert.equal(row.nlink,1n);assert.equal(row.uid,501n);}assert(m.state.read.every(p=>[payload,manifestFile].includes(p)));
});
test('no path/report/options/getter data can be supplied or adopted',()=>{
 const m=mock();for(const input of [undefined,null,{},m.report(),{path:'/private/credential'},Object.defineProperty({},'report',{get(){throw Error('GETTER');}})]){assert.equal(m.run(input).transport,'UNKNOWN');assert.equal(m.state.inspections,0);assert.equal(m.state.opened.length,0);}
 assert.doesNotMatch(source,/process\.env|readFileSync|copyFile|unlinkSync|rmSync|JSON\.parse|spawn|execSync|GITHUB_OUTPUT/);
});
test('occupied fixed directory refuses before inspection and leaves it intact',()=>{const m=mock();m.nodes.set(directory,{...m.nodes.get(cwd),ino:900n});const r=m.run();assert.equal(r.transport,'UNKNOWN');assert.equal(m.state.inspections,0);assert.equal(m.state.opened.length,0);assert(m.nodes.has(directory));});
for(const fault of ['owner','mode','symlink','alias'])test('unsafe owned checkout '+fault+' launches no inspector',()=>{
 const m=mock(),row=m.nodes.get(cwd);if(fault==='owner')row.uid=999n;else if(fault==='mode')row.mode|=0o2n;else if(fault==='symlink')row.kind='l';else m.state.fail='alias';assert.equal(m.run().transport,'UNKNOWN');assert.equal(m.state.inspections,0);
});
for(const fault of ['stat','mkdir','occupied','inspection','open','write','fsync','read','close','decompress'])test('transport '+fault+' preserves UNKNOWN without raw error or false file readiness',()=>{
 const m=mock();m.state.fail=fault;const r=m.run();assert.equal(r.transport,'UNKNOWN');noAuthority(r);assert(!JSON.stringify(r).includes('PRIVATE'));assert.equal(m.fds.size,0);
});
for(const [key,value]of [['interpretation','old'],['scope','foreign'],['publicOutputUntrusted',false],['profileApproved',true],['models',1],['outcome','PASS'],['sealed',true],['reuseEligible',true],['nativeAgentLaunches',1],['targetExecutions',1],['compilerCheckExecutions',1]])test('foreign/authority report '+key+' cannot be persisted',()=>{
 const m=mock();m.state.report={...m.report(),[key]:value};assert.equal(m.run().transport,'UNKNOWN');assert.equal(m.state.opened.length,0);
});
test('payload/decompression upper bounds fail closed before any file write, without truncation',()=>{
 const m=mock();m.state.report={...m.report(),calls:[{stdout:'x'.repeat(24*1024*1024)}]};assert.equal(m.run().transport,'UNKNOWN');assert.equal(m.state.opened.length,0);
 const n=mock();n.state.compressed=Buffer.alloc(2*1024*1024+1);assert.equal(n.run().transport,'UNKNOWN');assert.equal(n.state.opened.length,0);
});
for(const target of [payload,directory,cwd,'/owned'])test('late write replacement '+target+' refuses ready-file claim',()=>{
 const m=mock();m.state.afterWrite=()=>{if(m.nodes.has(target))m.nodes.get(target).ino++;};assert.equal(m.run().transport,'UNKNOWN');assert.equal(m.fds.size,0);
});
test('elapsed inspection cannot evade total monotonic deadline before persistence',()=>{
 const m=mock();m.state.report=m.report();const initial=m.proc.hrtime.bigint;let count=0;m.proc.hrtime.bigint=()=>{if(++count===5)m.advance(120000);return initial();};const r=m.run();assert.equal(r.transport,'UNKNOWN');assert.equal(m.state.opened.length,0);
});
test('file-level persistence readiness remains separate from supported complete static-output collection',()=>{
 const m=mock();m.state.report={...m.report(),outcome:'PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF'};const r=m.run();assert.equal(r.transport,'PUBLIC_REPORT_FILES_READY');assert.equal(r.inspectionOutcome,'PUBLIC_OUTPUT_COLLECTED_NOT_BEHAVIOR_PROOF');noAuthority(r);
});
test('combined payload includes the manifest reserve, rather than allowing a full 2MiB gzip plus extra bytes',()=>{
 const m=mock(),raw=Buffer.from(JSON.stringify(m.report())+'\n'),compressed=gzipSync(raw);m.state.compressed=Buffer.concat([compressed,Buffer.alloc(2*1024*1024-compressed.length)]);
 assert(gunzipSync(m.state.compressed,{maxOutputLength:24*1024*1024}).equals(raw));const r=m.run();assert.equal(r.transport,'UNKNOWN');assert.equal(r.reason,'PUBLIC_PAYLOAD_LIMIT_OR_ENCODING');assert.equal(m.state.opened.length,0);
});
test('later manifest write replacing the prior payload does not certify its old name',()=>{
 const m=mock();m.state.afterWrite=file=>{if(file===manifestFile)m.nodes.get(payload).ino++;};assert.equal(m.run().transport,'UNKNOWN');assert.equal(m.fds.size,0);
});
test('file list is immutable and never exposes raw stdout or stderr on the small log summary',()=>{
 const m=mock(),r=m.run();assert(Object.isFrozen(r.files));assert.throws(()=>r.files.push('/other'));assert(!JSON.stringify(r).includes('FULL PUBLIC'));assert(!JSON.stringify(r).includes('stderr'));assert.equal(r.files.length,2);
});
