// Fixed test-only preparation boundary. No launcher, inference, compiler or
// observer authority. This profile is NOT the native-agent execution boundary.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export const sealedPreparationInterpretation='redue-sealed-preparation-darwin@1';
const fail=code=>{throw Object.assign(Error(code),{code});};
const quote=value=>'"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function checked(value,kind){
  if(typeof value!=='string'||!path.isAbsolute(value)||path.resolve(value)!==value||
    /[\u0000-\u001f\u007f]/u.test(value)||fs.realpathSync(value)!==value)fail('PREPARATION_PATH');
  const st=fs.lstatSync(value);
  if(st.isSymbolicLink()||st.uid!==process.getuid?.()||
    (kind==='directory'?!st.isDirectory():!st.isFile()))fail('PREPARATION_OWNERSHIP');
  return value;
}
function parents(file){const result=[];for(let dir=path.dirname(file);;dir=path.dirname(dir)){
  const st=fs.lstatSync(dir);if(!st.isDirectory()||st.isSymbolicLink())fail('PREPARATION_PATH');
  result.push(dir);if(dir===path.dirname(dir))return result;
}}
function containsPhysical(child,ancestor){const selected=fs.lstatSync(ancestor);
  return [child,...parents(child)].some(file=>{const st=fs.lstatSync(file);return st.dev===selected.dev&&st.ino===selected.ino;});}
export function sealedPreparationProfile(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||
    Reflect.ownKeys(options).length!==2||!['source','parent'].every(key=>Object.hasOwn(options,key)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('PREPARATION_OPTIONS');
  if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||
    process.getuid?.()===0)fail('PREPARATION_PLATFORM');
  const source=checked(options.source,'directory'),parent=checked(options.parent,'directory');
  if(containsPhysical(source,parent)||containsPhysical(parent,source))fail('PREPARATION_PLACEMENT');
  if((fs.lstatSync(parent).mode&0o777)!==0o700)fail('PREPARATION_OWNERSHIP');
  const opened=fs.opendirSync(parent);try{if(opened.readSync()!==null)fail('PREPARATION_PARENT_OCCUPIED');}finally{opened.closeSync();}
  // No caller-supplied code/executable allowlist or arbitrary shell executor.
  const node=checked(fs.realpathSync(process.execPath),'file');
  if(hash(fs.readFileSync(node))!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc')
    fail('PREPARATION_RUNTIME_UNREVIEWED');
  const files=['./sealed-typescript-preparation-child.mjs','../../src/sealed-typescript-tree.mjs',
    '../../src/portable-envelope.mjs','../../src/path-identity.mjs','../../package.json']
    .map(relative=>checked(fileURLToPath(new URL(relative,import.meta.url)),'file'));
  const metadata=[...new Set([source,parent,node,...files].flatMap(file=>[file,...parents(file)]))].sort();
  const literals=values=>values.map(value=>'(literal '+quote(value)+')').join('\n  ');
  const profile=`(version 1)
(deny default)
(allow sysctl-read)
(allow process-exec (literal ${quote(node)}))
(allow file-read* (literal "/"))
(allow file-read-metadata ${literals(metadata)})
(allow file-read* (subpath ${quote(source)}) (subpath ${quote(parent)})
  ${literals([node,...files])}
  (subpath "/System/Library") (subpath "/usr/lib")
  (subpath "/System/Volumes/Preboot/Cryptexes/OS/System/Library")
  (literal "/dev/random") (literal "/dev/urandom") (literal "/dev/null"))
(allow file-write* (subpath ${quote(parent)}) (literal "/dev/null"))
`;
  return Object.freeze({schema:1,interpretation:sealedPreparationInterpretation,
    profile,sha256:hash(profile),node,child:files[0],
    code:Object.freeze(files.map(file=>Object.freeze([file,hash(fs.readFileSync(file))]))),
    source,parent,sealed:false,reuseEligible:false,
    preparationEnvironment:'empty-no-authentication-no-model-no-project-code'});
}
