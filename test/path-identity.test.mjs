import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {normalizedPath,samePath,withinPath,observedRelative,validInputRelative} from '../src/path-identity.mjs';
import {controlEndpoint} from '../src/control-endpoint.mjs';
import {stateIdentity,userStateBase} from '../src/platform-state.mjs';
import {findExecutable} from '../src/executable-lookup.mjs';
import {windowsLaunch} from '../src/windows-command.mjs';
import {terminateWindowsTree} from '../src/windows-process.mjs';
import {resolveLinks} from '../src/installed-inputs.mjs';
import {EventEmitter} from 'node:events';
import {spawn} from 'node:child_process';

test('Windows lexical identity folds drive and path spelling without crossing roots',()=>{
  const p=path.win32,root='C:\\Work Space\\Répo';
  assert(samePath(root,'c:/work space/répo',p));
  assert(withinPath('c:/WORK SPACE/Répo/src/é.ts',root,p));
  assert.equal(observedRelative(root,'c:/WORK SPACE/Répo/src/é.ts',p),'src/é.ts');
  assert(!withinPath('C:\\Work Space\\Repository\\file.ts',root,p));
  assert(!withinPath('D:\\Work Space\\Répo\\file.ts',root,p));
  assert.equal(observedRelative(root,'D:\\Work Space\\Répo\\file.ts',p),null);
  assert(!validInputRelative('D:/elsewhere/file.ts','win32'));
  assert(!validInputRelative('D:file.ts','win32'));
  assert(!validInputRelative('src\\file.ts','win32'));
  assert(validInputRelative('src/file.ts','win32'));
  assert.equal(normalizedPath('\\\\?\\C:\\Work Space\\Répo\\src',p),
    'C:\\Work Space\\Répo\\src');
  assert(withinPath('\\\\?\\C:\\Work Space\\Répo\\src\\é.ts',root,p));
});

test('portable identity preserves POSIX case sensitivity',()=>{
  assert(withinPath('/project/src/a','/project'));
  assert(!withinPath('/Project/src/a','/project',path.posix));
  assert(!samePath('/project','/Project',path.posix));
});

test('Windows local state and control identities are stable across path spelling',()=>{
  const state='C:\\Users\\A Name\\AppData\\Local\\vstate\\vstate-123';
  assert.equal(userStateBase('win32',{LOCALAPPDATA:'C:\\Users\\A Name\\AppData\\Local'},
    'C:\\Users\\A Name',path.win32),'C:\\Users\\A Name\\AppData\\Local');
  assert.equal(stateIdentity(state,'win32'),stateIdentity('c:/users/a name/appdata/local/VSTATE/vstate-123','win32'));
  assert.equal(controlEndpoint(state,'win32').address,
    controlEndpoint('c:/users/a name/appdata/local/VSTATE/vstate-123','win32').address);
  assert.equal(controlEndpoint(state,'win32').filesystem,false);
  assert.equal(controlEndpoint('/tmp/vstate-123','linux').address,
    path.join('/tmp/vstate-123','observer.sock'));
});

test('Windows PATH lookup honors executable suffixes without changing command names',()=>{
  const seen=[];
  const result=findExecutable('npm',{platform:'win32',paths:path.win32,
    env:{PATH:'C:\\Tools;D:\\Node',PATHEXT:'.EXE;.CMD'},cwd:'C:\\',
    access(file){seen.push(file);if(file.toLowerCase()!=='d:\\node\\npm.cmd')
      throw Error('missing');},realpath:file=>file});
  assert.equal(result,'D:\\Node\\npm.CMD');
  assert(seen.includes('D:\\Node\\npm.CMD'));
  assert.equal(findExecutable('..\\npm',{platform:'win32',paths:path.win32,
    env:{PATH:'D:\\Node'},cwd:'C:\\',access(){throw Error('should not search');}}),null);
  assert.equal(findExecutable('npm',{platform:'win32',paths:path.win32,
    env:{PATH:'D:\\Node',PATHEXT:'.CMD'},cwd:'C:\\',
    access(file){if(!['D:\\Node\\npm.CMD','D:\\Node\\npm'].includes(file))throw Error('missing');},
    realpath:file=>file}),'D:\\Node\\npm.CMD');
});

test('Windows batch launch preserves ordinary argument boundaries and rejects expansion',()=>{
  const command=['C:\\Program Files\\nodejs\\npm.cmd','run','type check','résumé'];
  const launch=windowsLaunch(command,{platform:'win32',comspec:'C:\\Windows\\cmd.exe'});
  assert.equal(launch.file,'C:\\Windows\\cmd.exe');
  assert.deepEqual(launch.args,['/d','/s','/c',
    '""C:\\Program Files\\nodejs\\npm.cmd" "run" "type check" "résumé""']);
  assert.equal(launch.options.windowsVerbatimArguments,true);
  assert.deepEqual(windowsLaunch(['C:\\Node\\node.exe','a b'],{platform:'win32'}).args,['a b']);
  assert.throws(()=>windowsLaunch(['npm.cmd','run','%SECRET%'],{platform:'win32'}),
    /cannot be passed safely/);
});

test('Windows cancellation requests only the recorded process tree',async()=>{
  let actual;
  const start=(file,args,options)=>{actual={file,args,options};
    const child=new EventEmitter();child.kill=()=>{};
    queueMicrotask(()=>child.emit('close',0));return child;};
  await terminateWindowsTree(4321,{start});
  assert.deepEqual(actual.args,['/PID','4321','/T','/F']);
  assert.equal(actual.file,'taskkill.exe');
});

test('native Windows cancellation terminates an ordinary descendant',
  {skip:process.platform!=='win32'},async t=>{
    const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-tree-'));
    const marker=path.join(base,'descendant.pid');
    const script=`const fs=require('node:fs');
const {spawn}=require('node:child_process');
const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],
  {stdio:'ignore',windowsHide:true});
fs.writeFileSync(process.argv[1],String(child.pid));
setInterval(()=>{},1000);`;
    const parent=spawn(process.execPath,['-e',script,marker],
      {stdio:'ignore',windowsHide:true});
    let descendant;
    t.after(async()=>{
      try{await terminateWindowsTree(parent.pid);}catch{}
      fs.rmSync(base,{recursive:true,force:true});
    });
    for(let n=0;n<100&&!fs.existsSync(marker);n++)
      await new Promise(resolve=>setTimeout(resolve,50));
    assert(fs.existsSync(marker),'descendant did not start');
    descendant=Number(fs.readFileSync(marker,'utf8'));
    assert(Number.isInteger(descendant)&&descendant>0);
    await terminateWindowsTree(parent.pid);
    const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
    for(let n=0;n<100&&(alive(parent.pid)||alive(descendant));n++)
      await new Promise(resolve=>setTimeout(resolve,50));
    assert.equal(alive(parent.pid),false,'parent survived cancellation');
    assert.equal(alive(descendant),false,'descendant survived cancellation');
  });

test('NTFS short-path junction target retains its link and resolves inside the long checkout',
  {skip:process.platform!=='win32'},t=>{
    const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-ntfs-link-'));
    t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
    const target=path.join(base,'packages','dep');
    fs.mkdirSync(target,{recursive:true});
    const root=fs.realpathSync.native(base);
    const logical=path.join(root,'node_modules','dep');
    fs.mkdirSync(path.dirname(logical));
    fs.symlinkSync(target,logical,'junction');
    const resolved=resolveLinks(logical,root);
    assert.equal(resolved.reason,null);
    assert(samePath(resolved.physical,fs.realpathSync.native(target)));
    assert.equal(resolved.links.length,1);
    assert(samePath(resolved.links[0].path,logical));
  });

test('native NTFS uses case-insensitive identity with spaces, Unicode and replacement',
  {skip:process.platform!=='win32'},t=>{
    const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-ntfs-case-'));
    t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
    const root=path.join(base,'Space Répo');
    fs.mkdirSync(root);
    const original=path.join(root,'File résumé.txt');
    fs.writeFileSync(original,'first');
    const alternate=path.join(base,'SPACE Répo','file résumé.txt');
    assert.equal(fs.readFileSync(alternate,'utf8'),'first');
    assert(samePath(original,alternate));
    const replacement=path.join(root,'replacement.txt');
    fs.writeFileSync(replacement,'second');
    fs.renameSync(replacement,original);
    assert.equal(fs.readFileSync(alternate,'utf8'),'second');
    const deep=path.join(root,...Array.from({length:14},(_,n)=>
      `segment-${String(n).padStart(2,'0')}-abcdefghijkl`));
    try{
      fs.mkdirSync(deep,{recursive:true});
      assert(deep.length>260);
      fs.writeFileSync(path.join(deep,'input.txt'),'long-path');
      assert.equal(fs.readFileSync(path.join(deep,'input.txt'),'utf8'),'long-path');
      t.diagnostic('long NTFS path supported');
    }catch(error){
      if(!['ENAMETOOLONG','EINVAL','ENOENT'].includes(error.code))throw error;
      t.diagnostic(`long NTFS path unavailable: ${error.code}`);
    }
  });
