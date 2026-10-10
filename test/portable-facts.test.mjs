import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {portableDiscovery,portableRelative,samePortableFacts,portableApplicabilityContext,portableProbeFailureCode} from '../src/portable-facts.mjs';
import {portableRuntime,portableRuntimeSupported} from '../src/portable-runtime.mjs';
const hex='a'.repeat(64);
test('portable failure diagnostics distinguish an established timeout without disclosing child output',()=>{
  assert.equal(portableProbeFailureCode({error:{code:'ETIMEDOUT'},stderr:'private child output'}),'PORTABLE_PROBE_TIMEOUT');
  assert.equal(portableProbeFailureCode({error:{code:'ENOENT'},stderr:'private child output'}),'PORTABLE_PROBE_UNAVAILABLE');
  assert.equal(portableProbeFailureCode({stderr:'VSTATE_REASON:PORTABLE_RUNTIME_UNSUPPORTED\n'}),'PORTABLE_RUNTIME_UNSUPPORTED');
});
function project(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-facts-')));
  fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src','a.ts'),'export const x=1;');
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('portable discovery derives its namespace without erasing membership or absence',t=>{
  const first=project(t),second=project(t);
  const facts=root=>({configs:[['tsconfig.json',hex]],files:[['src/a.ts',hex]],
    queries:[['fileExists',path.join(root,'missing.ts'),false],
      ['readDirectory',path.join(root,'src'),[path.join(root,'src/a.ts')],
        {tsRoot:path.join(root,'node_modules/typescript'),args:['.ts',null],argsVersion:1,undefinedArguments:[1]}]]});
  const a=portableDiscovery(first,facts(first)),b=portableDiscovery(second,facts(second));
  assert.deepEqual(a,b);
  const present=facts(second);present.queries[0][2]=true;
  assert.notEqual(portableDiscovery(second,present).queriesSha256,a.queriesSha256);
  const changedArgs=facts(second);changedArgs.queries[1][3].undefinedArguments=[];
  assert.notEqual(portableDiscovery(second,changedArgs).queriesSha256,a.queriesSha256);
});
test('external queries, directory links and ambiguous namespaces cannot gain portable identity',t=>{
  const root=project(t),other=project(t);
  assert.throws(()=>portableRelative(root,path.join(other,'src/a.ts')),error=>error.code==='PORTABLE_EXTERNAL_INPUT');
  fs.symlinkSync(path.join(other,'src'),path.join(root,'alias'),'dir');
  assert.throws(()=>portableRelative(root,path.join(root,'alias/a.ts')),error=>error.code==='PORTABLE_SYMLINK');
  assert.throws(()=>portableDiscovery(root,{configs:[],files:[],queries:[]}),error=>error.code==='PORTABLE_DISCOVERY_INCOMPLETE');
});
test('missing facts never compare as equivalent or acquire a repaired origin',()=>{
  assert.equal(samePortableFacts(null,null),false);
  assert.equal(samePortableFacts({files:[['src/a.ts',hex]]},{files:[['src/A.ts',hex]]}),false);
});
test('unsupported runtime profiles fail closed rather than equating OS labels',()=>{
  if(!portableRuntimeSupported()||!fs.existsSync(new URL('../src/portable-runtime-darwin-arm64.node',import.meta.url)))
    assert.throws(()=>portableRuntime(),error=>error.code==='PORTABLE_RUNTIME_UNSUPPORTED');
  else {const facts=portableRuntime();assert(facts.sharedObjects.some(([name])=>name==='portable-runtime-profile'));
    assert.match(facts.sha256,/^[a-f0-9]{64}$/);}
});

test('only the portable runtime projection removes local executable physical identity',()=>{
  const runtime={version:'v22.13.0',sha256:hex,sharedObjects:[['portable-runtime-profile',hex]]},
    first={__vstate_node_identity__:'b'.repeat(64),NODE_ENV:'c'.repeat(64)},
    second={...first,__vstate_node_identity__:'d'.repeat(64)};
  assert.deepEqual(portableApplicabilityContext(first,runtime),portableApplicabilityContext(second,runtime));
  assert.equal(first.__vstate_node_identity__,'b'.repeat(64),'original context is not rewritten');
  assert.notDeepEqual(portableApplicabilityContext(first,runtime),portableApplicabilityContext({...second,NODE_ENV:'e'.repeat(64)},runtime));
  assert.notDeepEqual(portableApplicabilityContext(first,runtime),portableApplicabilityContext(first,{...runtime,sha256:'f'.repeat(64)}));
  assert.throws(()=>portableApplicabilityContext({},runtime),{code:'PORTABLE_CALLER_UNVERIFIED'});
});
