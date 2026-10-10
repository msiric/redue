import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {DEFAULT_OPENSSL_CONFIG,OPENSSL_CONFIG_INTERPRETATION,REVIEWED_OPENSSL_TEMPLATE_SHA256,
  portableOpenSSLContextIssue,classifyDefaultOpenSSL,inspectDefaultOpenSSL} from '../src/portable-openssl-config.mjs';

const refusal=fn=>assert.throws(fn,{code:'PORTABLE_OPENSSL_UNSUPPORTED'});
test('overrides and case aliases are refused by presence, without altering the environment',()=>{
  for(const key of ['OPENSSL_CONF','openssl_conf','OpenSSL_MODULES','OPENSSL_CONF_INCLUDE'])for(const value of ['', 'owned-test']){
    const env={HOME:'safe', [key]:value};assert.equal(portableOpenSSLContextIssue(env),'portable-openssl-override-unsupported');
    refusal(()=>inspectDefaultOpenSSL({env}));assert.equal(env[key],value);
  }
});
test('HOME parsing precondition is bounded without preserving its private value',()=>{
  for(const env of [{},{HOME:''},{HOME:'a'.repeat(4096)},{HOME:'[$ENV::HOME] # .include "not-a-directive"'}])assert.equal(portableOpenSSLContextIssue(env),null);
  for(const HOME of ['a'.repeat(4097),'\0','\ud800',null])assert.equal(portableOpenSSLContextIssue({HOME}),'portable-openssl-home-unsupported');
  assert.equal(portableOpenSSLContextIssue({HOME:'🦉'.repeat(1025)}),'portable-openssl-home-unsupported');
});
test('unknown, altered, include, module, and interpolation templates are not admitted structurally',()=>{
  for(const value of ['', '# literal\n', '.include owned.cnf\n','nodejs_conf=module\n[ module ]\nproviders=p\n',
    '[unused]\nvalue=$ENV::HOME\n','[broken\n'])refusal(()=>classifyDefaultOpenSSL(Buffer.from(value),{}));
  refusal(()=>classifyDefaultOpenSSL(Buffer.alloc(65537),{}));refusal(()=>classifyDefaultOpenSSL('not bytes',{}));
});

const systemTemplate=process.platform==='darwin'&&fs.existsSync(DEFAULT_OPENSSL_CONFIG)?fs.readFileSync(DEFAULT_OPENSSL_CONFIG):null;
test('actual reviewed macOS template is bound by bytes, not a caller trust label',{skip:!systemTemplate},()=>{
  const result=classifyDefaultOpenSSL(systemTemplate,{HOME:'safe'});
  assert.deepEqual(result,{interpretation:OPENSSL_CONFIG_INTERPRETATION,kind:'reviewed-template',sha256:REVIEWED_OPENSSL_TEMPLATE_SHA256});
  assert.ok(Object.isFrozen(result));refusal(()=>classifyDefaultOpenSSL(Buffer.concat([systemTemplate,Buffer.from('# changed\n')]),{}));
  assert.deepEqual(inspectDefaultOpenSSL({env:{HOME:'safe'}}),result);
});

function parentStat(){return {dev:1n,ino:1n,mode:0o40755n,uid:0n,nlink:2n,size:1n,mtimeNs:1n,ctimeNs:1n,isDirectory:()=>true,isFile:()=>false,isSymbolicLink:()=>false};}
function fileStat(overrides={}){return {...parentStat(),ino:2n,mode:0o100644n,nlink:1n,size:9390n,isDirectory:()=>false,isFile:()=>true,...overrides};}
test('only repeated ENOENT under unchanged root-owned canonical parents establishes absence',t=>{
  const lstat=t.mock.method(fs,'lstatSync',file=>{if(file===DEFAULT_OPENSSL_CONFIG)throw Object.assign(Error('missing'),{code:'ENOENT'});return parentStat();});
  const result=inspectDefaultOpenSSL({env:{}});assert.equal(result.kind,'absent');assert.match(result.sha256,/^[a-f0-9]{64}$/);
  lstat.mock.restore();
  let leafReads=0;t.mock.method(fs,'lstatSync',file=>{if(file===DEFAULT_OPENSSL_CONFIG){if(++leafReads===1)throw Object.assign(Error('missing'),{code:'ENOENT'});return fileStat();}return parentStat();});
  refusal(()=>inspectDefaultOpenSSL({env:{}}));
});
test('unreadable absence, changed parent, symlink, non-root, writable, hardlinked and oversize files fail closed',t=>{
  for(const leaf of [()=>{throw Object.assign(Error('denied'),{code:'EACCES'});},()=>fileStat({isSymbolicLink:()=>true}),
    ()=>fileStat({uid:501n}),()=>fileStat({mode:0o100666n}),()=>fileStat({nlink:2n}),()=>fileStat({size:65537n})]){
    const mocked=t.mock.method(fs,'lstatSync',file=>file===DEFAULT_OPENSSL_CONFIG?leaf():parentStat());refusal(()=>inspectDefaultOpenSSL({env:{}}));mocked.mock.restore();
  }
  let count=0;t.mock.method(fs,'lstatSync',file=>{if(file===DEFAULT_OPENSSL_CONFIG)throw Object.assign(Error('missing'),{code:'ENOENT'});return {...parentStat(),ino:++count>4?9n:1n};});
  refusal(()=>inspectDefaultOpenSSL({env:{}}));
});
test('replacement with a FIFO at open remains bounded and refuses before reading',t=>{
  t.mock.method(fs,'lstatSync',file=>file===DEFAULT_OPENSSL_CONFIG?fileStat():parentStat());let flags,reads=0,closed=0;
  t.mock.method(fs,'openSync',(_file,value)=>{flags=value;return 900;});
  t.mock.method(fs,'fstatSync',()=>fileStat({isFile:()=>false}));t.mock.method(fs,'readSync',()=>{reads++;return 0;});
  t.mock.method(fs,'closeSync',()=>{closed++;});refusal(()=>inspectDefaultOpenSSL({env:{}}));
  assert.equal(reads,0);assert.equal(closed,1);if(fs.constants.O_NONBLOCK)assert.ok(flags&fs.constants.O_NONBLOCK);
});
test('actual Node startup parses inert-section interpolation before module selection',{skip:process.version!=='v22.13.0'},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redue-openssl-startup-'));
  try{
    const file=path.join(dir,'owned.cnf'),run=HOME=>spawnSync(process.execPath,['-e','process.stdout.write("main-completed")'],
      {env:{...process.env,OPENSSL_CONF:file,HOME},encoding:'utf8',timeout:3000});
    fs.writeFileSync(file,'[unused]\nvalue=$ENV::HOME\n');
    const normal=run('safe'),oversize=run('a'.repeat(70000));
    assert.equal(normal.status,0);assert.equal(normal.stdout,'main-completed');
    assert.equal(oversize.error,undefined);assert.notEqual(oversize.status,0);assert.equal(oversize.stdout,'');
    assert.match(oversize.stderr,/OpenSSL configuration error/);
    fs.writeFileSync(file,'[broken\n');const malformed=run('safe');assert.notEqual(malformed.status,0);assert.equal(malformed.stdout,'');
    assert.match(malformed.stderr,/OpenSSL configuration error/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
