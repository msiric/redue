import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {cachedTarball,lockedPackage,matchTarball,npmCacheDir,registryPackage,sriDigest,tarballFiles} from '../src/npm-integrity.mjs';
import {directCompiler} from '../src/direct-typescript.mjs';

const require=createRequire(import.meta.url),bin=path.resolve('bin/redue.mjs');
const sourceTypeScript=path.dirname(require.resolve('typescript/package.json'));
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
// A ustar archive of {name: bytes} under package/, gzipped, as npm publishes.
function tarball(files,{type='0'}={}){
  const blocks=[];
  for(const [name,value] of Object.entries(files)){
    const body=Buffer.from(value),header=Buffer.alloc(512);
    header.write(`package/${name}`,0,100,'utf8');header.write('0000644\0',100);header.write('0000000\0',108);header.write('0000000\0',116);
    header.write(body.length.toString(8).padStart(11,'0')+'\0',124);header.write('00000000000\0',136);
    header.write(type,156);header.write('ustar\0',257);header.write('00',263);
    header.fill(' ',148,156);let sum=0;for(const byte of header)sum+=byte;header.write(sum.toString(8).padStart(6,'0')+'\0 ',148);
    blocks.push(header,body,Buffer.alloc((512-body.length%512)%512));
  }
  return zlib.gzipSync(Buffer.concat([...blocks,Buffer.alloc(1024)]));
}
const integrity=(bytes,algorithm='sha512')=>`${algorithm}-${createHash(algorithm).update(bytes).digest('base64')}`;
// Places bytes in an npm cache as cacache's content store does.
function cache(dir,bytes,algorithm='sha512'){
  const hex=createHash(algorithm).update(bytes).digest('hex');
  put(path.join(dir,'_cacache','content-v2',algorithm,hex.slice(0,2),hex.slice(2,4),hex.slice(4)),bytes);
}

test('npm integrity: the cached tarball named by the lockfile must hold exactly the installed files',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-integrity-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const files={'package.json':'{"name":"x","version":"1.0.0"}','lib/a.js':'a'.repeat(700)};
  const tgz=tarball(files),npm=path.join(base,'npm');
  assert.deepEqual([...tarballFiles(tgz).keys()],['package.json','lib/a.js']);
  assert.throws(()=>cachedTarball(npm,integrity(tgz)),{code:'npm-tarball-uncached'});
  cache(npm,tgz);cache(npm,tgz,'sha1');
  assert.deepEqual(cachedTarball(npm,integrity(tgz)),tgz);
  assert.deepEqual(cachedTarball(npm,integrity(tgz,'sha1')),tgz);
  assert.equal(sriDigest(`${integrity(tgz,'sha1')} ${integrity(tgz)}`).algorithm,'sha512');
  assert.equal(sriDigest('md5-AAAA'),null);
  assert.throws(()=>cachedTarball(npm,'md5-AAAA'),{code:'npm-lockfile-integrity-unsupported'});
  // A cached file whose bytes no longer match its name.
  const other=tarball({'package.json':'{}'});cache(npm,other);
  fs.appendFileSync(path.join(npm,'_cacache','content-v2','sha512',...(h=>[h.slice(0,2),h.slice(2,4),h.slice(4)])(createHash('sha512').update(other).digest('hex'))),'x');
  assert.throws(()=>cachedTarball(npm,integrity(other)),{code:'npm-tarball-corrupt'});
  assert.throws(()=>tarballFiles(tarball({'link':'target'},{type:'2'})),{code:'npm-tarball-link-unsupported'});
  const installed=path.join(base,'installed');
  for(const [name,value] of Object.entries(files))put(path.join(installed,name),value);
  matchTarball(installed,tarballFiles(tgz));
  fs.appendFileSync(path.join(installed,'lib/a.js'),'\n');
  assert.throws(()=>matchTarball(installed,tarballFiles(tgz)),{code:'direct-typescript-implementation-unreviewed'});
  fs.writeFileSync(path.join(installed,'lib/a.js'),files['lib/a.js']);put(path.join(installed,'lib/extra.js'),'');
  assert.throws(()=>matchTarball(installed,tarballFiles(tgz)),{code:'direct-typescript-implementation-unreviewed'});
  const resolved='https://registry.npmjs.org/typescript/-/typescript-5.4.5.tgz';
  put(path.join(base,'p','package-lock.json'),JSON.stringify({lockfileVersion:3,packages:{'node_modules/typescript':{version:'5.4.5',resolved,integrity:'sha512-x'}}}));
  const locked=lockedPackage(path.join(base,'p'),'typescript');
  assert.deepEqual(locked,{version:'5.4.5',integrity:'sha512-x',resolved,alias:null});
  assert.equal(registryPackage(locked,'typescript','5.4.5'),true);
  for(const other of [{...locked,alias:'@acme/typescript'},{...locked,resolved:'file:vendor/typescript-5.4.5.tgz'},
    {...locked,resolved:'git+https://github.com/x/typescript.git#abc'},{...locked,resolved:null}])
    assert.equal(registryPackage(other,'typescript','5.4.5'),false,JSON.stringify(other));
  put(path.join(base,'p','npm-shrinkwrap.json'),'{}');
  assert.throws(()=>lockedPackage(path.join(base,'p'),'typescript'),{code:'npm-shrinkwrap-unsupported'});
  // npm's cache: the variable, then the project's .npmrc, then the user's.
  const home=path.join(base,'home');
  assert.equal(npmCacheDir(null,{npm_config_cache:'/c'},'linux',home),path.resolve('/c'));
  assert.equal(npmCacheDir(null,{npm_config_cache:'~/c'},'linux',home),path.join(home,'c'));
  assert.equal(npmCacheDir(null,{},'linux',home),path.join(home,'.npm'));
  put(path.join(home,'.npmrc'),'cache = ~/user-cache\n');
  assert.equal(npmCacheDir(path.join(base,'p'),{},'linux',home),path.join(home,'user-cache'));
  put(path.join(base,'p','.npmrc'),'cache="/project-cache"\n');
  assert.equal(npmCacheDir(path.join(base,'p'),{},'linux',home),path.resolve('/project-cache'));
  assert.throws(()=>tarballFiles(Buffer.from('not gzip')),{code:'npm-tarball-invalid'});
});

test('direct recipe: a TypeScript outside the reviewed list qualifies by the lockfile integrity of its cached tarball',
  {skip:process.platform==='win32'?'tar layout built with POSIX tar here':false},t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-locked-ts-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const root=path.join(base,'project'),state=path.join(base,'redue-state'),npm=path.join(base,'npm-cache');
  // The installed 5.6.3 relabeled as a version no review covers, published as npm would.
  const installed=path.join(root,'node_modules','typescript');
  fs.cpSync(sourceTypeScript,installed,{recursive:true});
  const manifest=JSON.parse(fs.readFileSync(path.join(installed,'package.json'),'utf8'));
  fs.writeFileSync(path.join(installed,'package.json'),JSON.stringify({...manifest,version:'5.6.99'}));
  const staging=path.join(base,'staging');fs.cpSync(installed,path.join(staging,'package'),{recursive:true});
  const tgz=path.join(base,'typescript-5.6.99.tgz');
  // No AppleDouble entries for extended attributes on macOS.
  execFileSync('tar',['-czf',tgz,'-C',staging,'package'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
  const bytes=fs.readFileSync(tgz);cache(npm,bytes);
  put(path.join(root,'package.json'),JSON.stringify({name:'locked-ts',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
  put(path.join(root,'package-lock.json'),JSON.stringify({name:'locked-ts',lockfileVersion:3,packages:{'':{name:'locked-ts'},
    'node_modules/typescript':{version:'5.6.99',resolved:'https://registry.npmjs.org/typescript/-/typescript-5.6.99.tgz',integrity:integrity(bytes)}}}));
  put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{noEmit:true,strict:true,target:'ES2022'},include:['src']}));
  put(path.join(root,'src/main.ts'),'export const value: number = 1;\n');
  put(path.join(root,'.gitignore'),'node_modules/\n');
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});
  const env=cache=>({...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_/i.test(key)&&
    !['NODE_TEST_CONTEXT','NODE_TEST_WORKER_ID'].includes(key))),npm_config_cache:cache});
  const call=(cacheDir,...args)=>spawnSync(process.execPath,[bin,'--state-dir',state,...args],{cwd:root,env:env(cacheDir),encoding:'utf8',timeout:30000});
  const preview=cacheDir=>JSON.parse(call(cacheDir,'init','--recipe','typescript-direct','--check','typecheck','--dry-run','--json').stdout).checks[0];
  // Not in this cache: recording-only, with the reason.
  const missing=preview(path.join(base,'empty-cache'));
  assert.equal(missing.level,'recording');assert.match(missing.reason,/npm-tarball-uncached/);
  const ready=preview(npm);
  assert.equal(ready.level,'ready',ready.reason);assert.match(ready.reason,/TypeScript 5\.6\.99/);
  assert.equal(call(npm,'init','--recipe','typescript-direct','--check','typecheck').status,0);
  assert.equal(call(npm,'start').status,0);t.after(()=>call(npm,'stop'));
  assert.equal(call(npm,'run','typecheck').status,0);
  const status=()=>JSON.parse(call(npm,'status','--sync','--json').stdout).checks[0];
  assert.equal(status().freshness,'CURRENT');
  // An installed file that no longer matches the tarball.
  const libFile=path.join(installed,'lib','lib.d.ts'),libBytes=fs.readFileSync(libFile);
  fs.appendFileSync(libFile,'\n');
  const changed=status();
  assert.notEqual(changed.freshness,'CURRENT');assert.equal(changed.reuse_eligible,false);
  call(npm,'stop');fs.writeFileSync(libFile,libBytes);
  // The identity is the lockfile's integrity: a new one is a new compiler.
  const lockFile=path.join(root,'package-lock.json'),lock=JSON.parse(fs.readFileSync(lockFile,'utf8'));
  const digest=directCompiler(root,{verify:false}).digest;
  const entry=lock.packages['node_modules/typescript'];
  const write=value=>fs.writeFileSync(lockFile,JSON.stringify({...lock,packages:{...lock.packages,'node_modules/typescript':value}}));
  write({...entry,integrity:integrity(Buffer.from('other'))});
  assert.notEqual(directCompiler(root,{verify:false}).digest,digest);
  // Each refusal is named.
  const refused=(value,code)=>{write(value);const row=preview(npm);
    assert.equal(row.level,'recording');assert.match(row.reason,new RegExp(code),code);};
  refused({...entry,version:'5.6.98'},'direct-typescript-lockfile-version-differs');
  refused({version:'5.6.99'},'direct-typescript-lockfile-integrity-missing');
  refused({...entry,name:'@acme/typescript'},'direct-typescript-lockfile-source-unsupported');
  refused({...entry,resolved:'file:vendor/typescript-5.6.99.tgz'},'direct-typescript-lockfile-source-unsupported');
  write(entry);
  for(const version of ['4.9.5','6.1.0','7.0.0']){
    fs.writeFileSync(path.join(installed,'package.json'),JSON.stringify({...manifest,version}));
    refused({...entry,version},'direct-typescript-version-unsupported');
  }
});
