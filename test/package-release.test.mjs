import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkRegistry,registryUrl} from './acceptance/registry-name.mjs';
import {readArtifact} from './acceptance/package-artifact.mjs';

const pkg={name:'@example/cli',version:'0.1.0-alpha.1',repository:{url:'git+https://github.com/example/cli.git'}};
test('registry uses the exact encoded scoped coordinate',()=>{
  assert.equal(registryUrl(pkg.name),'https://registry.npmjs.org/%40example%2Fcli');
});
test('registry distinguishes absent, owned, unexpected and unavailable',async()=>{
  const query=(status,body)=>checkRegistry(pkg,{publisher:'owner',fetchImpl:async url=>{
    assert.equal(url,registryUrl(pkg.name));return {status,ok:status===200,json:async()=>body};
  }});
  assert.equal((await query(404)).state,'absent');
  const owned={name:pkg.name,maintainers:[{name:'owner'}],repository:pkg.repository,versions:{[pkg.version]:{}}};
  assert.equal((await query(200,owned)).state,'owned');
  assert.equal((await query(200,owned)).versionPresent,true);
  assert.equal((await query(200,{...owned,maintainers:[]})).state,'unexpected');
  assert.equal((await query(200,{...owned,name:'other'})).state,'unexpected');
  assert.equal((await query(200,{...owned,repository:{url:'https://github.com/other/project'}})).state,'unexpected');
  assert.equal((await query(503)).state,'unavailable');
  assert.equal((await checkRegistry(pkg,{fetchImpl:async()=>{throw Error('offline');}})).state,'unavailable');
});
test('artifact filename comes from manifest and corruption cannot pass',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-package-contract-'));
  try{
    const bytes=Buffer.from('disposable artifact'),filename='example-cli-0.1.0-alpha.1.tgz';
    const manifest=path.join(dir,'manifest.json');
    const metadata={filename,size:bytes.length,shasum:createHash('sha1').update(bytes).digest('hex'),
      integrity:`sha512-${createHash('sha512').update(bytes).digest('base64')}`};
    fs.writeFileSync(path.join(dir,filename),bytes);fs.writeFileSync(manifest,JSON.stringify([metadata]));
    const recorded=readArtifact(manifest,{writeChecksum:true});
    assert.equal(readArtifact(manifest).file,path.join(dir,filename));
    assert.equal(recorded.sha256,createHash('sha256').update(bytes).digest('hex'));
    fs.appendFileSync(path.join(dir,filename),'changed');assert.throws(()=>readArtifact(manifest),/size differs/);
    fs.writeFileSync(manifest,JSON.stringify([{...metadata,filename:'../elsewhere.tgz'}]));
    assert.throws(()=>readArtifact(manifest),/Unsafe artifact filename/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
