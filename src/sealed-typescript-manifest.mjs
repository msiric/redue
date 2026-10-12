// Representation for the explicit, still-disabled sealed recipe only. Legacy
// portableManifest remains strict. This is not source discovery or admission.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical} from './portable-envelope.mjs';
import {portableManifest,portableRelative} from './portable-facts.mjs';
import {fileHash} from './index.mjs';
import {sealedNpmShimTarget} from './sealed-typescript-shim.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex');
export function sealedTypeScriptManifest(root,observed){
  // Local selected index only. The separately reviewed preparation boundary
  // must confine source reads; this helper is not hostile-writer read isolation.
  const ordinary={},nested=[];
  for(const [rel,digest] of Object.entries(observed)){
    if(!rel.startsWith('node_modules/')||!path.posix.dirname(rel).endsWith('/node_modules/.bin')){
      ordinary[rel]=digest;continue;
    }
    const file=path.join(root,rel),before=fs.lstatSync(file,{bigint:true});
    if(!before.isSymbolicLink()){ordinary[rel]=digest;continue;}
    portableRelative(root,path.dirname(file));
    const target=fs.readlinkSync(file);let physical;
    try{physical=sealedNpmShimTarget(root,rel,target).physical;}catch{fail('PORTABLE_SYMLINK');}
    const targetRel=portableRelative(root,physical);
    if(!Object.hasOwn(observed,targetRel)||!fs.lstatSync(physical).isFile())fail('PORTABLE_COVERAGE_UNSUPPORTED');
    if(fileHash(root,rel,true,before).hash!==digest)fail('PORTABLE_INPUT_CHANGED');
    nested.push([rel,hash(canonical({kind:'npm-file-shim',target:targetRel,content:observed[targetRel],
      links:[{path:rel,targetHash:hash(target)}]}))]);
  }
  return [...portableManifest(root,ordinary),...nested].sort(([a],[b])=>a<b?-1:a>b?1:0);
}
