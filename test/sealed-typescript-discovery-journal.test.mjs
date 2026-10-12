import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {captureSealedTypeScriptDiscovery as capture, SEALED_DISCOVERY_LIMITS as limits} from './acceptance/sealed-typescript-discovery-journal.mjs';

// All operations below are injected fake functions. No TypeScript API, compiler,
// native policy, filesystem body read, model or CI process is launched.
const root='/owned/stage';
const sha=value=>createHash('sha256').update(value).digest('hex');
const error=code=>Object.assign(Error('NONSECRET_PRIVATE_MESSAGE'),{code});
function fixture(overrides={}) {
  const fs={
    statSync() { return {dev:1n,ino:2n,mode:0o100644n,uid:501n,nlink:1n,size:4n}; },
    readFileSync() { return Buffer.from('body'); },
    readdirSync() { return ['a.ts','b.ts']; },
    realpathSync(file) { return file; },
    ...overrides,
  };
  Object.defineProperty(fs.realpathSync,'native',{value:function(file) { return file; },writable:true,enumerable:false,configurable:true});
  return fs;
}
const run=(fs,callback)=>capture({fileSystem:fs,root,callback});
const snapshot=fs=>Object.getOwnPropertyDescriptors(fs);
const codes=(result,...expected)=>{for(const code of expected)assert.ok(result.reasonCodes.includes(code),JSON.stringify(result.reasonCodes));assert.equal(result.loggingComplete,false);};
const throwsCode=(fn,code)=>assert.throws(fn,value=>value?.code===code);
function authority(result) {
  assert.equal(result.namespaceVerified,false);
  assert.equal(result.sealed,false);
  assert.equal(result.reuseEligible,false);
  assert.equal(result.queryCompleteness,'NOT_ESTABLISHED');
  assert.equal(result.moduleLoaderCoverage,'NOT_ESTABLISHED');
  assert.equal(result.observationCompleteness,'FORWARDED_CALLS_ONLY');
}

test('scoped wrappers precede fake first-require and preserve cached native function/descriptor forwarding',()=>{
  const received=[];
  const original=function(...args) { received.push({self:this,args});return args[0]; };
  const fs=fixture({realpathSync:original});
  const before=snapshot(fs),nativeDescriptor=Object.getOwnPropertyDescriptor(original,'native');
  const result=run(fs,adapter=>{
    assert.notEqual(fs.realpathSync,original);
    assert.deepEqual(Object.getOwnPropertyDescriptor(fs,'realpathSync'),{...before.realpathSync,value:fs.realpathSync});
    assert.equal(fs.realpathSync.name,original.name);
    assert.equal(fs.realpathSync.length,original.length);
    // A fake loader captures this property before subsequent config/program work.
    const cached=fs.realpathSync.native;
    adapter.phase('load',()=>assert.equal(cached(root+'/index.js'),root+'/index.js'));
    adapter.phase('config',()=>assert.equal(fs.realpathSync.call(fs,root+'/tsconfig.json'),root+'/tsconfig.json'));
    assert.equal(original.native,nativeDescriptor.value);
  });
  assert.deepEqual(snapshot(fs),before);
  assert.deepEqual(Object.getOwnPropertyDescriptor(original,'native'),nativeDescriptor);
  assert.equal(received[0].self,fs);
  assert.deepEqual(received[0].args,[root+'/tsconfig.json']);
  assert.deepEqual(result.frames.map(row=>[row.operation,row.phase]),[['realpathSync.native','load'],['realpathSync','config']]);
  assert.equal(result.loggingComplete,true);authority(result);
});

test('raw bytes and actual decoded semantic text retain different hashed meanings without payloads',()=>{
  const raw=Buffer.from([0xff,0xfe,0x41,0x00]);
  const fs=fixture({readFileSync() { return raw; }});
  const result=run(fs,adapter=>adapter.phase('program',()=>{
    const decoded=adapter.semantic('readFile',root+'/a.ts',()=>{assert.equal(fs.readFileSync(root+'/a.ts'),raw);return 'A';});
    assert.equal(decoded,'A');
  }));
  const semantic=result.frames.find(row=>row.category==='semantic'),underlying=result.frames.find(row=>row.category==='fs');
  assert.equal(semantic.outcome.value.sha256,sha(JSON.stringify('A')));
  assert.equal(underlying.outcome.value.sha256,sha(raw));
  assert.notEqual(semantic.outcome.value.sha256,underlying.outcome.value.sha256);
  assert.deepEqual(result.frames.map(row=>row.sequence),[1,2]);
  assert.equal(result.loggingComplete,true);
  assert.equal(JSON.stringify(result).includes('"A"'),false);authority(result);
});

for(const code of ['EPERM','EACCES','ENOENT','ENOTDIR'])test(`${code} forwarding retains exact error and actual semantic result separately`,()=>{
  const denied=error(code);
  const fs=fixture({statSync(){throw denied;},readFileSync(){throw denied;},readdirSync(){throw denied;},realpathSync(){throw denied;}});
  const result=run(fs,adapter=>{
    for(const [method,fsMethod,fallback] of [['fileExists','statSync',false],['directoryExists','statSync',false],['readFile','readFileSync',undefined],['getDirectories','readdirSync',[]],['readDirectory','readdirSync',[]],['realpath','realpathSync',root+'/a.ts']]) {
      const actual=adapter.semantic(method,root+'/a.ts',()=>{try{return fs[fsMethod](root+'/a.ts');}catch(caught){assert.equal(caught,denied);return fallback;}});
      assert.equal(actual,fallback);
    }
  });
  assert.equal(result.loggingComplete,true);
  for(const row of result.frames.filter(row=>row.category==='fs'))assert.deepEqual(row.outcome,{status:['EPERM','EACCES'].includes(code)?'DENIED':'MISSING',errno:code});
  assert.ok(result.frames.filter(row=>row.category==='semantic').every(row=>row.outcome.status==='RETURNED'));
  assert.equal(JSON.stringify(result).includes('NONSECRET_PRIVATE_MESSAGE'),false);authority(result);
});

test('callback error identity survives restoration, including non-Error thrown values',()=>{
  for(const thrown of [error('EPERM'),null,undefined,17,'NONSECRET_PRIVATE_THROW']) {
    const fs=fixture(),before=snapshot(fs);let observed=false;
    try {run(fs,()=>{fs.readFileSync(root+'/a.ts');throw thrown;});}catch(caught){observed=true;assert.equal(caught,thrown);}
    assert.equal(observed,true);assert.deepEqual(snapshot(fs),before);
    assert.equal(run(fs,()=>{}).loggingComplete,true);
  }
});

test('opaque callback result is not serialized or exposed',()=>{
  let accessed=0;
  const opaque={};Object.defineProperty(opaque,'secret',{get(){accessed++;throw error('EPERM');}});
  const result=run(fixture(),()=>opaque);
  assert.equal(accessed,0);assert.equal(Object.hasOwn(result,'result'),false);
  assert.equal(result.loggingComplete,true);authority(result);
});

test('async/generator callbacks fail before invocation and restore synchronous thenable rejection',()=>{
  let called=0;
  for(const callback of [async function(){called++;},function*(){called++;},async function*(){called++;}])throwsCode(()=>run(fixture(),callback),'SEALED_DISCOVERY_ASYNC');
  assert.equal(called,0);
  const fs=fixture(),before=snapshot(fs);let thenRead=0;
  const value=Object.create({get then(){thenRead++;return()=>{};}});
  throwsCode(()=>run(fs,()=>value),'SEALED_DISCOVERY_ASYNC');
  assert.equal(thenRead,0);assert.deepEqual(snapshot(fs),before);
});

test('caught async semantic work and nested capture permanently mark partial observations',()=>{
  const fs=fixture();let called=0;
  const result=run(fs,adapter=>{
    throwsCode(()=>adapter.semantic('readFile',root+'/a.ts',async()=>{called++;}),'SEALED_DISCOVERY_ASYNC');
    throwsCode(()=>run(fixture(),()=>{}),'SEALED_DISCOVERY_REENTRANT');
    fs.statSync(root+'/a.ts');
  });
  assert.equal(called,0);codes(result,'ASYNC_CALLBACK','REENTRANT_CAPTURE');authority(result);
});

test('unknown phase/method and excessive nesting are conservative even when caught',()=>{
  const result=run(fixture(),adapter=>{
    throwsCode(()=>adapter.phase('receipt',()=>{}),'SEALED_DISCOVERY_PHASE');
    throwsCode(()=>adapter.semantic('arbitrary',root+'/a.ts',()=>{}),'SEALED_DISCOVERY_METHOD');
    const nested=depth=>adapter.phase('program',()=>depth? nested(depth-1):undefined);
    throwsCode(()=>nested(limits.depth),'SEALED_DISCOVERY_PHASE');
  });
  codes(result,'INVALID_PHASE','UNSUPPORTED_SEMANTIC_METHOD');authority(result);
});

test('unknown filesystem functions/accessors forward exact behavior but cannot produce complete logging',()=>{
  let getterCalls=0;
  const fs=fixture({unknownSync(){return true;}});
  Object.defineProperty(fs,'unknownAccessor',{configurable:true,enumerable:true,get(){getterCalls++;return 9;}});
  const before=snapshot(fs);
  const result=run(fs,()=>{assert.equal(fs.unknownSync(root+'/a.ts'),true);assert.equal(fs.unknownAccessor,9);});
  assert.equal(getterCalls,1);assert.deepEqual(snapshot(fs),before);
  codes(result,'UNSUPPORTED_METHOD','UNSUPPORTED_ACCESSOR');authority(result);
});

test('unsupported own symbols and accessors on required methods refuse before callback',()=>{
  let called=0;
  const fs=fixture();fs[Symbol('unknown')]=()=>{};
  throwsCode(()=>run(fs,()=>{called++;}),'SEALED_DISCOVERY_FS');
  const fs2=fixture();Object.defineProperty(fs2.readFileSync,'extra',{get(){called++;return true;}});
  throwsCode(()=>run(fs2,()=>{called++;}),'SEALED_DISCOVERY_FS');
  assert.equal(called,0);
});

test('unused unsupported async/custom-promisify metadata is preserved without claiming indirect route coverage',()=>{
  const custom=Symbol('custom-promisify');let accessed=0;
  const method=function(){return undefined;};
  Object.defineProperty(method,custom,{value:function(){return 'opaque';},configurable:true});
  Object.defineProperty(method,'customGetter',{get(){accessed++;return 19;},configurable:true});
  const fs=fixture({asyncMethod:method}),before=snapshot(fs);
  const result=run(fs,()=>{
    assert.deepEqual(Object.getOwnPropertyDescriptor(fs.asyncMethod,custom),Object.getOwnPropertyDescriptor(method,custom));
    assert.equal(fs.asyncMethod[custom](),'opaque');
    assert.equal(fs.asyncMethod.customGetter,19);
  });
  assert.equal(accessed,1);assert.deepEqual(snapshot(fs),before);
  codes(result,'UNSUPPORTED_FUNCTION_METADATA');authority(result);
});

test('installation failure restores earlier methods without changing callback outcome',()=>{
  const fs=fixture();Object.defineProperty(fs,'readdirSync',{writable:false,configurable:false});
  const before=snapshot(fs);let called=0;
  assert.throws(()=>run(fs,()=>{called++;}),TypeError);
  assert.equal(called,0);assert.deepEqual(snapshot(fs),before);
  assert.equal(run(fixture(),()=>{}).loggingComplete,true);
});

test('replaced wrappers/native method and added descriptors are latched and originals restored',()=>{
  const fs=fixture(),before=snapshot(fs);
  const result=run(fs,()=>{
    fs.readFileSync=()=>undefined;
    fs.realpathSync.native=()=>undefined;
    fs.extraMethod=()=>undefined;
  });
  for(const [key,descriptor] of Object.entries(before))assert.deepEqual(Object.getOwnPropertyDescriptor(fs,key),descriptor);
  codes(result,'DESCRIPTOR_CHANGED','METHOD_DESCRIPTOR_CHANGED');authority(result);
});

test('restoration failure withholds result while preserving original callback failure identity',()=>{
  const fs=fixture(),original=error('EPERM');
  assert.throws(()=>run(fs,()=>{Object.defineProperty(fs,'readFileSync',{configurable:false,writable:false});throw original;}),value=>value===original);
  const fs2=fixture();throwsCode(()=>run(fs2,()=>Object.defineProperty(fs2,'readFileSync',{configurable:false,writable:false})),'SEALED_DISCOVERY_RESTORE');
  assert.equal(run(fixture(),()=>{}).loggingComplete,true);
});

test('options and canonical root reject getters, unknown fields, malformed Unicode and unsafe names',()=>{
  const base={fileSystem:fixture(),root,callback:()=>{}};
  throwsCode(()=>capture({...base,extra:true}),'SEALED_DISCOVERY_OPTIONS');
  const accessor={...base};Object.defineProperty(accessor,'callback',{get(){throw Error('must not invoke');}});
  throwsCode(()=>capture(accessor),'SEALED_DISCOVERY_OPTIONS');
  for(const root of ['/', 'relative', '/owned/../stage','/owned/stage/','/owned\\stage','/owned:stage','/owned/\ud800','/owned/\u0000'])throwsCode(()=>capture({...base,root}),'SEALED_DISCOVERY_ROOT');
});

test('outside paths are hashed, malformed path inputs not interpreted, error values never exposed',()=>{
  const fs=fixture({readFileSync(){throw error('EIO');}});
  const result=run(fs,()=>{
    try{fs.readFileSync('/outside/NONSECRET_PRIVATE_PATH');}catch{}
    for(const input of ['relative','/owned/../stage/a.ts','/owned/\ud800',Buffer.from('/owned/stage/a.ts')])fs.statSync(input);
  });
  const encoded=JSON.stringify(result);
  assert.equal(encoded.includes('NONSECRET_PRIVATE_PATH'),false);
  assert.equal(encoded.includes('NONSECRET_PRIVATE_MESSAGE'),false);
  assert.deepEqual(result.frames[0].path,{scope:'outside',sha256:sha('/outside/NONSECRET_PRIVATE_PATH')});
  codes(result,'OTHER_ERROR','UNSUPPORTED_PATH');authority(result);
});

test('unsupported argument getter is not read and exact options reach original function',()=>{
  let observed,accessed=0;
  const options={get encoding(){accessed++;return 'utf8';}};
  const fs=fixture({readFileSync(...args){observed=args;return 'decoded';}});
  const result=run(fs,()=>assert.equal(fs.readFileSync(root+'/a.ts',options),'decoded'));
  assert.equal(observed[1],options);assert.equal(accessed,0);codes(result,'UNSUPPORTED_VALUE');
});

test('typed stat facts/options and raw directory names are bounded without method/getter evaluation',()=>{
  let accessed=0;
  const dirent={name:'a.ts',get isFile(){accessed++;throw Error('must not access');}};
  const fs=fixture({readdirSync(){return [dirent];}});
  const result=run(fs,()=>{
    fs.statSync(root+'/a.ts',{bigint:true,throwIfNoEntry:false});
    fs.readdirSync(root,{withFileTypes:true});
  });
  assert.equal(accessed,0);assert.equal(result.loggingComplete,true);
  assert.equal(result.frames[0].outcome.value.type,'stat');
  assert.deepEqual(result.frames[1].outcome.value,{type:'array',length:1,sha256:sha('["a.ts"]'),projection:'entry-names-only'});
});

test('semantic directory returns cannot silently project object entries into string answers',()=>{
  const result=run(fixture(),adapter=>adapter.semantic('getDirectories',root,()=>[{name:'a'}]));
  codes(result,'UNSUPPORTED_VALUE');authority(result);
});

test('path and value caps forward original results while refusing completeness before hash work',()=>{
  const oversized='x'.repeat(Math.floor(limits.valueBytes/6)+1);
  const fs=fixture({readFileSync(){return oversized;},readdirSync(){return new Array(limits.arrayEntries+1);}});
  const result=run(fs,()=>{
    assert.equal(fs.readFileSync(root+'/a.ts'),oversized);
    fs.statSync(root+'/'+'x'.repeat(limits.pathBytes));
    assert.equal(fs.readdirSync(root).length,limits.arrayEntries+1);
  });
  codes(result,'VALUE_LIMIT','UNSUPPORTED_PATH');authority(result);
});

test('frame and journal limits retain bounded partial logging and do not truncate actual forwarded calls',()=>{
  let invocations=0;
  const fs=fixture({statSync(){invocations++;return false;}});
  const framed=run(fs,()=>{for(let at=0;at<limits.frames+1;at++)fs.statSync(root+'/a.ts');});
  assert.equal(invocations,limits.frames+1);assert.ok(framed.frames.length<=limits.frames);codes(framed,'FRAME_LIMIT');
  const file=root+'/'+'a'.repeat(3800);
  const journal=run(fixture(),fsAdapter=>{for(let at=0;at<2300;at++)fsAdapter.semantic('fileExists',file,()=>false);});
  assert.equal(journal.callsObserved,2300);assert.ok(journal.frames.length<2300);codes(journal,'JOURNAL_LIMIT');
  assert.ok(Buffer.byteLength(JSON.stringify(journal))<=limits.journalBytes);authority(journal);
});

test('closed engineering adapter cannot create a subsequent capture interval',()=>{
  let adapter;const result=run(fixture(),value=>{adapter=value;});
  throwsCode(()=>adapter.semantic('fileExists',root+'/a.ts',()=>true),'SEALED_DISCOVERY_CLOSED');
  throwsCode(()=>adapter.phase('load',()=>true),'SEALED_DISCOVERY_CLOSED');
  assert.equal(result.loggingComplete,true);authority(result);
});

test('published journal is deeply frozen and never a namespace or seal certificate',()=>{
  const result=run(fixture(),()=>{});
  assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.frames));assert.ok(Object.isFrozen(result.reasonCodes));
  assert.throws(()=>result.frames.push({}),TypeError);authority(result);
});
