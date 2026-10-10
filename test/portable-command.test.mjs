import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {portableCommand,readBoundedPortableFile} from '../src/portable-command.mjs';
import {canonical,encodeEnvelope,parseEnvelope,PORTABLE_INTERPRETATION,PORTABLE_LIMITS} from '../src/portable-envelope.mjs';
import {readImportedSnapshot} from '../src/portable-store.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
function facts(){return {schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',
  command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('definition')},
  platform:{os:'darwin',arch:'arm64',release:'25.1.0'},
  runtime:{version:'v22.13.0',sha256:hash('node'),sharedObjects:[]},
  compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},
  context:{NODE_ENV:hash('absent')},files:[['package.json',hash('manifest')],['src/空间.ts',hash('source')]],
  discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/空间.ts',hash('source')]],queriesSha256:hash('queries')}};}
function receipt(extra={}){return {result:'PASS',invocation:{runId:randomUUID(),status:'exited',exitCode:0,signal:null},
  stable:true,coverage:{qualified:true},portable:{schema:1,interpretation:PORTABLE_INTERPRETATION,
    complete:true,facts:facts(),reason:null},...extra};}
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-command-'))),
    root=path.join(base,'checkout 空间'),state=path.join(base,'redue-state'),
    configFile=path.join(root,'redue.config.json');
  fs.mkdirSync(root);fs.mkdirSync(state);fs.mkdirSync(path.join(state,'runs-v1'));
  const publicConfig={schema:1,packageManager:'npm',checks:[{name:'compiler',script:'typecheck'}]},
    runtime={schema:1,root,state,checks:[{name:'compiler',command:['node','local-tsc','--noEmit']}]};
  fs.writeFileSync(configFile,JSON.stringify(publicConfig));
  fs.writeFileSync(path.join(state,'vstate-owner-v1.json'),JSON.stringify({schema:1,kind:'vstate-product-alpha',
    root,state,config:path.join(state,'project-runtime-v1.json')}));
  fs.writeFileSync(path.join(state,'project-runtime-v1.json'),JSON.stringify(runtime));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  t.mock.method(console,'log',()=>{});
  return {base,root,state,configFile,publicConfig,runtime};
}
function persist(f,r){
  fs.writeFileSync(path.join(f.state,'receipts-v1.json'),JSON.stringify({schema:1,checks:{compiler:r}}));
  fs.writeFileSync(path.join(f.state,'runs-v1',r.invocation.runId+'.json'),JSON.stringify({schema:1,check:'compiler',receipt:r}));
}
const exportArgs=(file,extra=[])=>['export','compiler','--output',file,...extra,'--json'];
const errorCode=code=>error=>error.code===code;

test('export preview is no-write and shows complete captured disclosure without inspecting current project inputs',async t=>{
  const f=fixture(t),r=receipt();persist(f,r);const output=path.join(f.base,'evidence.json');
  const before=fs.readdirSync(f.base).sort();
  const preview=await portableCommand(exportArgs(output,['--dry-run']),f);
  assert.equal(preview.written,false);assert.equal(preview.origin.complete,true);
  assert.equal(preview.origin.runId,r.invocation.runId);assert.equal(preview.origin.result,'PASS');
  assert.equal(preview.reuse_eligible,false);assert.deepEqual(fs.readdirSync(f.base).sort(),before);
  assert.deepEqual(preview.disclosed_paths,['node_modules/typescript/lib/tsc.js','package.json','src/空间.ts','tsconfig.json']);
  // The captured source file deliberately does not exist in this synthetic
  // mechanics fixture. Export must not populate origin facts from today's files.
  assert.equal(fs.existsSync(path.join(f.root,'src/空间.ts')),false);
  const written=await portableCommand(exportArgs(output),f),envelope=parseEnvelope(fs.readFileSync(output));
  assert.equal(written.written,true);assert.equal(envelope.digest,preview.digest);
  assert.equal(canonical(envelope.statement.predicate.facts),canonical(r.portable.facts));
  if(process.platform!=='win32')assert.equal(fs.statSync(output).mode&0o777,0o600);
  await assert.rejects(portableCommand(exportArgs(output),f),errorCode('PORTABLE_FILE_EXISTS'));
});

test('old, unstable and unavailable receipts stay inspection-only while actual outcomes remain unchanged',async t=>{
  const f=fixture(t);
  const variants=[receipt({portable:undefined}),receipt({stable:false}),receipt({coverage:{qualified:false}}),
    receipt({portable:{schema:1,interpretation:PORTABLE_INTERPRETATION,complete:false,facts:facts()}}),
    receipt({result:'FAIL',invocation:{runId:randomUUID(),status:'exited',exitCode:2,signal:null}}),
    receipt({result:null,stable:false,invocation:{runId:randomUUID(),status:'interrupted',exitCode:null,signal:'SIGTERM'}})];
  for(let at=0;at<variants.length;at++){
    const r=variants[at];persist(f,r);const output=path.join(f.base,`evidence-${at}.json`);
    const result=await portableCommand(exportArgs(output),f),p=parseEnvelope(fs.readFileSync(output)).statement.predicate;
    assert.equal(p.origin.result,r.result);assert.deepEqual({...p.origin.invocation},{status:r.invocation.status,
      exitCode:r.invocation.exitCode,signal:r.invocation.signal});
    if(r.result==='FAIL')assert.equal(p.origin.complete,true);
    else{assert.equal(p.origin.complete,false);assert.equal(p.facts,null);}
    assert.equal(result.reuse_eligible,false);
  }
});

test('selected origin must equal its immutable run record and selection must remain complete',async t=>{
  const f=fixture(t),r=receipt();persist(f,r);const output=path.join(f.base,'evidence.json'),
    historical=path.join(f.state,'runs-v1',r.invocation.runId+'.json');
  const original=fs.readFileSync(historical);
  fs.writeFileSync(historical,JSON.stringify({schema:1,check:'compiler',receipt:{...r,result:'FAIL'}}));
  await assert.rejects(portableCommand(exportArgs(output),f),errorCode('PORTABLE_SELECTION'));
  assert(!fs.existsSync(output));fs.writeFileSync(historical,original);
  fs.writeFileSync(path.join(f.state,'receipt-selection-pending-v1.json'),'incomplete');
  await assert.rejects(portableCommand(exportArgs(output),f),errorCode('PORTABLE_SELECTION'));
  assert(!fs.existsSync(output));
});

test('new receipt selection during immutable origin reading prevents export',async t=>{
  const f=fixture(t),r=receipt();persist(f,r);const output=path.join(f.base,'evidence.json'),
    selected=path.join(f.state,'receipts-v1.json'),historical=path.join(f.state,'runs-v1',r.invocation.runId+'.json');
  const originalOpen=fs.openSync,originalRead=fs.readSync;let immutableFd=null,replaced=false;
  t.mock.method(fs,'openSync',function(file,...args){const fd=originalOpen.call(fs,file,...args);
    if(file===historical)immutableFd=fd;return fd;});
  t.mock.method(fs,'readSync',function(fd,...args){const count=originalRead.call(fs,fd,...args);
    if(fd===immutableFd&&!replaced){replaced=true;const temporary=selected+'.next';
      fs.writeFileSync(temporary,fs.readFileSync(selected));fs.renameSync(temporary,selected);}
    return count;});
  await assert.rejects(portableCommand(exportArgs(output),f),errorCode('PORTABLE_SELECTION_CHANGED'));
  assert(replaced);assert(!fs.existsSync(output));
});

test('inspection needs no project and import requires explicit local mapping/apply without altering local outcomes',async t=>{
  const f=fixture(t),r=receipt();persist(f,r);const output=path.join(f.base,'evidence.json');
  const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:r.invocation.runId,check:'different origin name',result:r.result,
      invocation:{status:'exited',exitCode:0,signal:null},complete:true},facts:facts()});
  fs.writeFileSync(output,canonical(envelope));
  const inspection=await portableCommand(['inspect',output,'--json'],{configFile:null});
  assert.equal(inspection.producer_accepted,false);assert.equal(inspection.reuse_eligible,false);
  await assert.rejects(portableCommand(['import',output,'--apply'],f),errorCode('PORTABLE_CHECK'));
  await assert.rejects(portableCommand(['import',output,'--check','different origin name','--apply'],f),errorCode('PORTABLE_CHECK'));
  const before=fs.readFileSync(path.join(f.state,'receipts-v1.json'));
  const args=['import',output,'--check','compiler','--accept-digest',envelope.digest];
  const preview=await portableCommand([...args,'--json'],f);
  assert.equal(preview.apply,false);assert.equal(preview.acceptance,'manual-digest-v1');
  assert(!fs.existsSync(path.join(f.state,'portable-imports-v1.json')));
  const applied=await portableCommand([...args,'--apply','--json'],f);
  assert.equal(applied.apply,true);assert.equal(applied.reuse_eligible,false);
  assert.equal(readImportedSnapshot(f.state).records[0].check,'compiler');
  assert.deepEqual(fs.readFileSync(path.join(f.state,'receipts-v1.json')),before);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.state,'runs-v1',r.invocation.runId+'.json'))).receipt.invocation.runId,r.invocation.runId);
});

test('bounded artifact reads reject links, directories, oversized files and replacement during reading',t=>{
  const f=fixture(t),file=path.join(f.base,'input.json');fs.writeFileSync(file,'hello');
  assert.equal(readBoundedPortableFile(file).toString(),'hello');
  assert.throws(()=>readBoundedPortableFile(f.root),errorCode('PORTABLE_FILE_UNSAFE'));
  assert.throws(()=>readBoundedPortableFile(file,{limit:4}),errorCode('PORTABLE_SIZE'));
  const huge=path.join(f.base,'huge');const descriptor=fs.openSync(huge,'wx');
  fs.ftruncateSync(descriptor,PORTABLE_LIMITS.bytes+1);fs.closeSync(descriptor);
  assert.throws(()=>readBoundedPortableFile(huge),errorCode('PORTABLE_SIZE'));
  try{fs.symlinkSync(file,path.join(f.base,'linked.json'));}
  catch(error){if(process.platform!=='win32'||error.code!=='EPERM')throw error;}
  if(fs.existsSync(path.join(f.base,'linked.json')))
    assert.throws(()=>readBoundedPortableFile(path.join(f.base,'linked.json')),errorCode('PORTABLE_FILE_UNSAFE'));
  const original=fs.readSync;let changed=false;
  t.mock.method(fs,'readSync',function(fd,...args){const count=original.call(fs,fd,...args);
    if(!changed){changed=true;const replacement=file+'.new';fs.writeFileSync(replacement,'hello');fs.renameSync(replacement,file);}
    return count;});
  assert.throws(()=>readBoundedPortableFile(file),errorCode('PORTABLE_FILE_CHANGED'));
});

test('unsafe output paths, invalid ownership and options never create directories or export files',async t=>{
  const f=fixture(t),r=receipt();persist(f,r);const output=path.join(f.base,'missing directory','out.json');
  await assert.rejects(portableCommand(exportArgs(output),f),errorCode('PORTABLE_FILE_UNAVAILABLE'));
  assert(!fs.existsSync(path.dirname(output)));
  await assert.rejects(portableCommand(['export','compiler','--output',path.join(f.base,'safe'),'--json','--json'],f),errorCode('PORTABLE_USAGE'));
  const ownerFile=path.join(f.state,'vstate-owner-v1.json'),owner=JSON.parse(fs.readFileSync(ownerFile));
  fs.writeFileSync(ownerFile,JSON.stringify({...owner,root:f.root+'-different'}));
  await assert.rejects(portableCommand(exportArgs(path.join(f.base,'safe')),f),errorCode('PORTABLE_OWNERSHIP'));
  assert(!fs.existsSync(path.join(f.base,'safe')));
});
