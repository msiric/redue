import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {sha} from './plan.mjs';

const fail=()=>{throw Object.assign(Error('Reviewed loaded runtime identity unavailable'),{code:'PORTABLE_RUNTIME_UNSUPPORTED'});};
const fingerprint=stat=>['dev','ino','mode','size','mtimeNs','ctimeNs'].map(key=>String(stat[key]));
const helperDigest='ced9a62153d5db768c1f561ece7adc8c9569cf175060c52689549a5ff54a812e';
// G1 only: SAME HOST AND BOOT, same physical Node installation and loaded
// system cache. This is deliberately NOT a cross-machine runtime projection.
// G2 needs a separately reviewed full runtime image/content profile.
export function portableRuntime(){
  if(process.platform!=='darwin'||process.arch!=='arm64')fail();
  const helper=fileURLToPath(new URL('./portable-runtime-darwin-arm64.node',import.meta.url));
  if(!fs.existsSync(helper)||fs.lstatSync(helper).isSymbolicLink()||sha(fs.readFileSync(helper))!==helperDigest)fail();
  const native=createRequire(import.meta.url)(helper),cache=native.inspect();
  if(cache.overridden||cache.interposed||!/^[a-f0-9]{32}$/.test(cache.uuid)||!path.isAbsolute(cache.file))fail();
  const cacheBefore=fs.statSync(cache.file,{bigint:true}),fd=fs.openSync(cache.file,'r'),header=Buffer.alloc(104);
  try{if(fs.readSync(fd,header,0,104,0)!==104||header.subarray(88,104).toString('hex')!==cache.uuid)fail();}
  finally{fs.closeSync(fd);}
  if(JSON.stringify(fingerprint(fs.statSync(cache.file,{bigint:true})))!==JSON.stringify(fingerprint(cacheBefore)))fail();
  const boot=spawnSync('/usr/sbin/sysctl',['-n','kern.bootsessionuuid'],{encoding:'utf8',timeout:1000,stdio:['ignore','pipe','pipe']});
  if(boot.error||boot.status!==0||!/^[-a-f0-9]{36}$/i.test(boot.stdout.trim()))fail();
  const binary=fs.realpathSync(process.execPath);
  const objects=process.report.getReport().sharedObjects;
  const names=new Set(),sharedObjects=[['g1-same-host-boot',sha(JSON.stringify([
    boot.stdout.trim(),binary,fingerprint(fs.statSync(binary,{bigint:true})),cache.uuid,
    cache.file,fingerprint(cacheBefore)]))]],virtual=[];
  for(const file of objects){
    if(!fs.existsSync(file)){if(!native.contains(file))fail();virtual.push(file);continue;}
    const name=path.basename(file);
    if(names.has(name))fail();
    names.add(name);sharedObjects.push([name,sha(fs.readFileSync(file))]);
  }
  sharedObjects.push(['dyld-virtual-images',sha(JSON.stringify(virtual.sort()))]);
  return {version:process.version,sha256:sha(fs.readFileSync(binary)),
    sharedObjects:sharedObjects.sort(([a],[b])=>a<b?-1:a>b?1:0)};
}
