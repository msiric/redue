// Read-only, test-only staged compiler proposal. Construction never executes.
// This is not a native-agent boundary, a seal, a receipt or origin authority.
// Stage paths are selected by owned local preparation, never imported evidence.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {directProject} from '../../src/direct-typescript.mjs';

const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex');
const quote=value=>'"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"';
function checked(file,kind){
  if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file||
    /[\u0000-\u001f\u007f]/u.test(file)||fs.realpathSync(file)!==file)fail('STAGED_COMPILER_PATH');
  const st=fs.lstatSync(file,{bigint:true});
  if(st.isSymbolicLink()||st.uid!==BigInt(process.getuid())||
    (kind==='directory'?!st.isDirectory():!st.isFile()))fail('STAGED_COMPILER_OWNERSHIP');
  return st;
}
function parents(file){const rows=[];for(let dir=path.dirname(file);;dir=path.dirname(dir)){
  const st=fs.lstatSync(dir,{bigint:true});if(!st.isDirectory()||st.isSymbolicLink())fail('STAGED_COMPILER_PATH');
  rows.push(dir);if(dir===path.dirname(dir))return rows;
}}
export function sealedCompilerFixtureProfile(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||
    !['root','script'].every(key=>Object.hasOwn(options,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))
    fail('STAGED_COMPILER_OPTIONS');
  if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||os.release()!=='25.6.0'||
    typeof process.getuid!=='function'||process.getuid()===0)fail('STAGED_COMPILER_PLATFORM');
  const {root,script}=options,stage=checked(root,'directory'),parent=path.dirname(root),parentStat=checked(parent,'directory');
  if(!/^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(root))||
    (stage.mode&0o7777n)!==0o700n||(parentStat.mode&0o7777n)!==0o700n||typeof script!=='string'||!script||
    /[\u0000-\u001f\u007f]/u.test(script))fail('STAGED_COMPILER_SELECTION');
  parents(root);const node=fs.realpathSync(process.execPath);checked(node,'file');parents(node);
  const nodeSha256=hash(fs.readFileSync(node));
  if(nodeSha256!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc')fail('STAGED_COMPILER_RUNTIME');
  // Environment, standalone obligation and whole installed implementation are
  // reviewed BEFORE any compiler API or entry code could be loaded.
  const compiler=directProject(root,script);
  if(compiler.version!=='5.5.2')fail('STAGED_COMPILER_IMPLEMENTATION');
  checked(compiler.entry,'file');parents(compiler.entry);
  const literals=values=>values.map(value=>'(literal '+quote(value)+')').join('\n  ');
  const metadata=[...new Set([root,node,...parents(root),...parents(node)])].sort();
  const profile=`(version 1)
(deny default)
(allow sysctl-read)
(allow process-exec (literal ${quote(node)}))
(allow file-read* (literal "/"))
(allow file-read-metadata ${literals(metadata)})
(allow file-read* (subpath ${quote(root)}) (literal ${quote(node)})
  (subpath "/System/Library") (subpath "/usr/lib")
  (subpath "/System/Volumes/Preboot/Cryptexes/OS/System/Library")
  (literal "/dev/random") (literal "/dev/urandom") (literal "/dev/null"))
(allow file-write* (literal "/dev/null"))
`;
  return Object.freeze({schema:1,scope:'READONLY_STAGED_COMPILER_FIXTURE_PROPOSAL_ONLY',
    interpretation:'redue-staged-compiler-fixture-darwin@1',root,parent,
    stageIdentity:`${stage.dev}:${stage.ino}`,parentIdentity:`${parentStat.dev}:${parentStat.ino}`,
    node,nodeSha256,compiler:Object.freeze({...compiler}),
    command:Object.freeze([node,compiler.entry,'--noEmit']),profile,profileSha256:hash(profile),
    environmentUnchanged:true,executesOnConstruction:false,nativeAgentEnforcement:'NOT_TESTED',
    sealed:false,reuseEligible:false});
}
