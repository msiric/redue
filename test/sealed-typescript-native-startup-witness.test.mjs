// Source and closed-parser tests only. No C build/child/native/model execution.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {parseNativeStartupWitness,nativeStartupWitnessBinding,readNativeStartupWitnessSource,NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STARTUP_WITNESS_INTERPRETATION,NATIVE_STARTUP_WITNESS_FIELDS} from './acceptance/sealed-typescript-native-startup-witness.mjs';
import {parseNativeStdioMetadata,NATIVE_STDIO_SOURCE_SHA256} from './acceptance/sealed-typescript-native-stdio-probe.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-startup-witness.c',import.meta.url),'utf8');
const base='/private/tmp/redue-ci-recipient-12345678';
const report=()=>({schema:1,scope:'NATIVE_CHILD_STARTUP_WITNESS_ONLY',pid:1234,startup:Object.fromEntries(NATIVE_STARTUP_WITNESS_FIELDS.map(k=>[k,true])),dev_null:{lstat:'OK',type:'CHARACTER'},fd0_matches_dev_null:true,descriptors:[{fd:0,fstat:'OK',type:'CHARACTER',fcntl:'OK',access:'READ_ONLY'},...[1,2].map(fd=>({fd,fstat:'OK',type:'FIFO',fcntl:'OK',access:'WRITE_ONLY'}))]});
test('new exact source/interpretation cannot masquerade as historical stdio source',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),NATIVE_STARTUP_WITNESS_SOURCE_SHA256);assert.notEqual(NATIVE_STARTUP_WITNESS_SOURCE_SHA256,NATIVE_STDIO_SOURCE_SHA256);
 const v=readNativeStartupWitnessSource();assert.equal(v.interpretation,NATIVE_STARTUP_WITNESS_INTERPRETATION);assert.equal(v.compiled,false);assert.equal(v.source,source);assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);
});
test('closed boolean data parses without authority or raw values and cannot enter old parser',()=>{
 const raw=JSON.stringify(report()),v=parseNativeStartupWitness(raw);assert.deepEqual(v,report());assert.equal(parseNativeStdioMetadata(raw),null);
 assert.equal(Object.hasOwn(v,'controlledShellStartup'),false);assert.equal(Object.hasOwn(v,'outcome'),false);assert.equal(Object.isFrozen(v.startup),true);
});
for(const key of NATIVE_STARTUP_WITNESS_FIELDS)test('false '+key+' remains false, not promoted to a passing or authoritative claim',()=>{
 const v=report();v.startup[key]=false;assert.equal(parseNativeStartupWitness(JSON.stringify(v)).startup[key],false);
});
for(const key of NATIVE_STARTUP_WITNESS_FIELDS)test('missing or nonboolean '+key+' refuses',()=>{
 const v=report();delete v.startup[key];assert.equal(parseNativeStartupWitness(JSON.stringify(v)),null);
 for(const x of [null,0,1,'true',[],{}]){v.startup[key]=x;assert.equal(parseNativeStartupWitness(JSON.stringify(v)),null);}
});
test('duplicate/unknown keys, wrong versions and malformed stdio/oversize refuse',()=>{
 for(const modify of [v=>v.startup.secret='PROTECTED',v=>v.schema=2,v=>v.scope='NATIVE_STDIO_METADATA_ONLY',v=>v.pid=0,v=>v.descriptors[2].fd=1,v=>v.extra=true]){const v=report();modify(v);assert.equal(parseNativeStartupWitness(JSON.stringify(v)),null);}
 assert.equal(parseNativeStartupWitness(JSON.stringify(report()).replace('"schema":1','"schema":1,"schema":1')),null);
 for(const v of [null,{},'x',new Uint8Array(4097),' '.repeat(4097)])assert.equal(parseNativeStartupWitness(v),null);
});
test('binding is disabled exact literal command and does not claim observed native startup',()=>{
 const v=nativeStartupWitnessBinding(base);assert.equal(v.command_proposed,"'"+base+"/prefix/native-probes/native-stdio-probe'");assert.equal(v.sourceSha256,NATIVE_STARTUP_WITNESS_SOURCE_SHA256);assert.equal(v.disabled,true);assert.equal(v.controlledShellStartup,'NOT_EMPIRICALLY_OBSERVED');assert.equal(v.inferencePermitted,false);
 for(const b of [base+'\n',base+'/../x','/tmp/redue-ci-recipient-12345678',base.toUpperCase(),base+'0'])assert.throws(()=>nativeStartupWitnessBinding(b),/NATIVE_STDIO_BINDING_UNKNOWN/);
});
test('C fixed witness compares only approved child keys; absence includes empty present keys',()=>{
 assert.match(source,/extern char \*getenv\(const char \*name\);/);
 assert.match(source,/for \(size_t i = 0; i < 512; i\+\+\)/);assert.match(source,/for \(size_t n = 0; n < 8; n\+\+, i\+\+\)/);
 const names=[...source.matchAll(/getenv\("([A-Z_0-9]+)"\)/g)].map(m=>m[1]).sort();assert.deepEqual(names,['BASH_ENV','ENV','HOME','MANPATH','PATH','PATH_HELPER_ROOT','PS1','SHELL','TERM_PROGRAM'].sort());
 for(const key of ['MANPATH','BASH_ENV','ENV','PS1','TERM_PROGRAM'])assert(source.includes('getenv("'+key+'") == NULL'));
 assert.doesNotMatch(source,/\b(?:setenv|putenv|unsetenv|system|execve|posix_spawn|fopen|open|read)\s*\(/);assert.doesNotMatch(source,/"%s[^"\n]*"\s*,\s*getenv/);
 assert(source.includes('No claim of'));assert(source.includes('path-helper execution'));assert(source.includes("expected[i] == '\\0'"));
});
