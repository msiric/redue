import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonical} from '../src/portable-envelope.mjs';
import {readProducerPolicySnapshot,revalidateProducerPolicySnapshot,producerPolicyBindingCurrent,
  PRODUCER_POLICY_INTERPRETATION,PRODUCER_POLICY_LIMITS} from '../src/portable-producer-policy.mjs';
const supported=typeof process.getuid==='function',hash=value=>createHash('sha256').update(value).digest('hex');
function policy(){return {schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',
  repository:'controlled/portable',repositoryId:'123',ownerId:'456',workflow:'.github/workflows/portable.yml',ref:'refs/heads/main',
  sourceCommit:'1'.repeat(40),signerCommit:'2'.repeat(40),artifactSha256:'3'.repeat(64),evidenceDigest:'4'.repeat(64),
  evidenceInterpretation:'redue-portable-direct-typescript@2',refresh:'required',bundleSha256:null};}
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(process.platform==='darwin'?'/tmp':os.tmpdir(),'redue-policy-'))),file=path.join(base,'producer-policy.json'),
    registry={schema:1,interpretation:PRODUCER_POLICY_INTERPRETATION,revision:1,policies:[policy()]};
  const put=value=>fs.writeFileSync(file,typeof value==='string'?value:canonical(value),{mode:0o600});put(registry);
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return {base,file,registry,put};
}
const binding=snapshot=>({revision:snapshot.revision,contentDigest:snapshot.contentDigest,policyDigest:snapshot.policies[0].digest});
const ownerTests={skip:!supported};

test('snapshot binds exact local bytes and canonical policy without authentication, writes or execution',ownerTests,t=>{
  const f=fixture(t),before=fs.readFileSync(f.file),entries=fs.readdirSync(f.base);let launched=0;
  t.mock.method(childProcess,'execFileSync',()=>{launched++;throw Error('no verifier allowed');});
  const snapshot=readProducerPolicySnapshot(f.file);
  assert.equal(snapshot.revision,1);assert.equal(snapshot.contentDigest,hash(before));
  assert.equal(snapshot.policies[0].digest,hash(canonical(policy())));assert.deepEqual({...snapshot.policies[0].policy},policy());
  assert(Object.isFrozen(snapshot));assert(Object.isFrozen(snapshot.policies));assert(Object.isFrozen(snapshot.policies[0].policy));
  assert.equal(snapshot.producer_accepted,undefined);assert.equal(snapshot.reuse_eligible,undefined);
  assert(revalidateProducerPolicySnapshot(snapshot));assert(!revalidateProducerPolicySnapshot({...snapshot}));
  assert(producerPolicyBindingCurrent(f.file,JSON.parse(JSON.stringify(binding(snapshot)))));
  assert.deepEqual(fs.readFileSync(f.file),before);assert.deepEqual(fs.readdirSync(f.base),entries);assert.equal(launched,0);
});

test('missing, deleted, malformed and obsolete registry cannot replace earlier policy authority',ownerTests,t=>{
  const f=fixture(t),snapshot=readProducerPolicySnapshot(f.file),accepted=binding(snapshot);
  fs.unlinkSync(f.file);
  assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,accepted));
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_UNAVAILABLE');
  for(const value of ['','{', '{"schema":1,"schema":1}',{...f.registry,interpretation:'old@0'},
    {...f.registry,revision:0},JSON.stringify({...f.registry,revision:1.5}),{...f.registry,extra:'not an approval'},
    {...f.registry,policies:[{...policy(),sourceCommit:'latest'}]}]){
    f.put(value);assert.throws(()=>readProducerPolicySnapshot(f.file));
    assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,accepted));
  }
  assert(!producerPolicyBindingCurrent(f.file,{...accepted,extra:true}));
});

test('removal, narrowing, revision and content changes revoke exact persisted bindings',ownerTests,t=>{
  const f=fixture(t),snapshot=readProducerPolicySnapshot(f.file),accepted=binding(snapshot),original=fs.readFileSync(f.file),times=fs.statSync(f.file);
  for(const value of [{...f.registry,policies:[]},{...f.registry,revision:2},
    {...f.registry,policies:[{...policy(),ref:'refs/heads/reviewed-only'}]},original.toString()+'\n']){
    f.put(value);fs.utimesSync(f.file,times.atime,times.mtime);
    assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,accepted));
  }
  // Restoring exact owner-approved bytes can match a persisted content binding;
  // it cannot revive an interval snapshot whose physical file changed.
  const replacement=f.file+'.next';fs.writeFileSync(replacement,original,{mode:0o600});fs.renameSync(replacement,f.file);
  assert(producerPolicyBindingCurrent(f.file,accepted));assert(!revalidateProducerPolicySnapshot(snapshot));
});

test('byte-identical replacement during reading or parent replacement refuses snapshot publication',ownerTests,t=>{
  for(const replaceParent of [false,true]){
    const f=fixture(t),bytes=fs.readFileSync(f.file),originalRead=fs.readSync;let replaced=false;
    const mocked=t.mock.method(fs,'readSync',function(fd,...args){const count=originalRead.call(fs,fd,...args);
      if(!replaced){replaced=true;
        if(replaceParent){fs.renameSync(f.base,f.base+'-old');fs.mkdirSync(f.base,{mode:0o700});fs.writeFileSync(f.file,bytes,{mode:0o600});
          t.after(()=>fs.rmSync(f.base+'-old',{recursive:true,force:true}));}
        else{fs.writeFileSync(f.file+'.next',bytes,{mode:0o600});fs.renameSync(f.file+'.next',f.file);}}
      return count;});
    assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_CHANGED');
    assert(replaced);mocked.mock.restore();
  }
});

test('symlink, hardlink, special-file and external writable paths are refused',ownerTests,t=>{
  const f=fixture(t),linked=path.join(f.base,'linked.json'),alias=f.base+'-alias';
  fs.symlinkSync(f.file,linked);assert.throws(()=>readProducerPolicySnapshot(linked));
  fs.symlinkSync(f.base,alias);t.after(()=>fs.unlinkSync(alias));assert.throws(()=>readProducerPolicySnapshot(path.join(alias,'producer-policy.json')));
  fs.linkSync(f.file,path.join(f.base,'hardlink'));assert.throws(()=>readProducerPolicySnapshot(f.file));fs.unlinkSync(path.join(f.base,'hardlink'));
  assert.throws(()=>readProducerPolicySnapshot(f.base));assert.throws(()=>readProducerPolicySnapshot('relative-policy.json'));
  fs.chmodSync(f.file,0o620);assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_OWNER');fs.chmodSync(f.file,0o600);
  fs.chmodSync(f.base,0o720);assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_OWNER');fs.chmodSync(f.base,0o700);
  const original=fs.lstatSync;
  t.mock.method(fs,'lstatSync',function(file,...args){const stat=original.call(fs,file,...args);
    if(file===f.file)stat.uid=stat.uid+1n;return stat;});
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_OWNER');
});

test('descriptor type and nonblocking guards prevent stale path metadata from admitting FIFO reads',ownerTests,t=>{
  const f=fixture(t),originalOpen=fs.openSync,originalStat=fs.fstatSync;let checked=false;
  t.mock.method(fs,'openSync',function(file,flags,...args){
    assert(flags&fs.constants.O_NONBLOCK);assert(flags&fs.constants.O_NOFOLLOW);checked=true;
    return originalOpen.call(fs,file,flags,...args);});
  t.mock.method(fs,'fstatSync',function(fd,...args){const stat=originalStat.call(fs,fd,...args);stat.isFile=()=>false;return stat;});
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_CHANGED');assert(checked);
});

test('byte/count limits and duplicate policies are enforced before exposing policy data',ownerTests,t=>{
  const f=fixture(t);f.put(' '.repeat(PRODUCER_POLICY_LIMITS.bytes+1));
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_SIZE');
  f.put({...f.registry,policies:Array.from({length:9},(_,i)=>({...policy(),sourceCommit:String(i).repeat(40)}))});
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_INVALID');
  f.put({...f.registry,policies:[policy(),policy()]});assert.throws(()=>readProducerPolicySnapshot(f.file));
  f.put({...f.registry,policies:[]});const empty=readProducerPolicySnapshot(f.file);assert.equal(empty.policies.length,0);
  assert(!producerPolicyBindingCurrent(f.file,{revision:empty.revision,contentDigest:empty.contentDigest,policyDigest:hash(canonical(policy()))}));
});

test('bounded partial reads complete; early EOF fails rather than validating a prefix',ownerTests,t=>{
  const f=fixture(t),originalRead=fs.readSync;let reads=0;
  const partial=t.mock.method(fs,'readSync',function(fd,buffer,offset,length,position){reads++;
    assert(buffer.length<=PRODUCER_POLICY_LIMITS.bytes);return originalRead.call(fs,fd,buffer,offset,Math.min(length,17),position);});
  assert.equal(readProducerPolicySnapshot(f.file).policies.length,1);assert(reads>1);partial.mock.restore();
  t.mock.method(fs,'readSync',()=>0);assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_CHANGED');
});

test('unreadable policy does not retain earlier snapshot or persisted acceptance authority',ownerTests,t=>{
  const f=fixture(t),snapshot=readProducerPolicySnapshot(f.file),accepted=binding(snapshot),original=fs.openSync;
  t.mock.method(fs,'openSync',function(file,...args){if(file===f.file)throw Object.assign(Error('controlled access refusal'),{code:'EACCES'});
    return original.call(fs,file,...args);});
  assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_UNAVAILABLE');
  assert(!revalidateProducerPolicySnapshot(snapshot));assert(!producerPolicyBindingCurrent(f.file,accepted));
});

test('hosts without a current-user ownership primitive remain explicitly unsupported', {skip:supported},t=>{
  const f=fixture(t);assert.throws(()=>readProducerPolicySnapshot(f.file),error=>error.code==='PORTABLE_PRODUCER_POLICY_OWNER');
  assert(!producerPolicyBindingCurrent(f.file,{revision:1,contentDigest:'1'.repeat(64),policyDigest:'2'.repeat(64)}));
});
