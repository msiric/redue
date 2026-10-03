import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {normalizedPath,samePath,withinPath,observedRelative,validInputRelative} from '../src/path-identity.mjs';
import {controlEndpoint} from '../src/control-endpoint.mjs';
import {stateIdentity,userStateBase} from '../src/platform-state.mjs';
import {findExecutable} from '../src/executable-lookup.mjs';
import {windowsLaunch} from '../src/windows-command.mjs';
import {terminateWindowsTree} from '../src/windows-process.mjs';
import {EventEmitter} from 'node:events';

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
  assert.equal(controlEndpoint('/tmp/vstate-123','linux').address,'/tmp/vstate-123/observer.sock');
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
