// Representation and fixed local preparation for the still-disabled sealed
// recipe only. Legacy portableManifest remains strict; no result is admission.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonical} from './portable-envelope.mjs';
import {portableManifest,portableRelative} from './portable-facts.mjs';
import {fileHash,InputIndex} from './index.mjs';
import {SEALED_TYPESCRIPT_SELECTION,captureSealedTypeScriptSelection,bindSealedTypeScriptSelection,invalidateSealedTypeScriptSelection,checkSealedTypeScriptSelectionInput,materializeSealedTypeScriptSelectedView} from './sealed-typescript-tree.mjs';
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

// Full-root metadata-only opt-in; no exclusions are silently inferred from a
// file-only index. The @3 copy route rejects undeclared leaf membership before
// reading file bodies. Inventory data never authorize a source root/import.
export {captureSealedTypeScriptDirectoryInventory as sealedTypeScriptDirectoryInventory} from './sealed-typescript-tree.mjs';

// One local fixed selector, not imported callback code or a trust label. This
// remains trusted/quiescent pre-agent preparation under a separate FS boundary.
export function prepareSealedTypeScriptSelectedView(options){
 const keys=['root','parent','sourcePatterns'];if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==keys.length||!keys.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,key)??{},'value')))fail('TREE_SELECTION_OPTIONS');
 const supplied=options.sourcePatterns,expected=SEALED_TYPESCRIPT_SELECTION.sourcePatterns;
 if(!Array.isArray(supplied)||Object.getPrototypeOf(supplied)!==Array.prototype||supplied.length!==expected.length||Reflect.ownKeys(supplied).length!==supplied.length+1||!expected.every((value,at)=>{const entry=Object.getOwnPropertyDescriptor(supplied,String(at));return entry&&Object.hasOwn(entry,'value')&&entry.value===value;}))fail('TREE_SELECTION_UNSUPPORTED');
 const patterns=[...expected];
 const capture=captureSealedTypeScriptSelection({root:options.root,parent:options.parent});
 try{const index=new InputIndex({root:options.root,plans:{preparation:{id:SEALED_TYPESCRIPT_SELECTION.planId,patterns,sourcePatterns:patterns,additivePatterns:[...SEALED_TYPESCRIPT_SELECTION.additivePatterns]}}},{trackGit:false,includeInstalled:true}),check=index.checks.get('preparation'),names=capture.candidates.map(([rel])=>rel).filter(rel=>index.candidates(rel).has('preparation')&&index.matches(check,rel));bindSealedTypeScriptSelection(capture,names);
 for(const rel of names){checkSealedTypeScriptSelectionInput(capture,rel);index.record(rel,'fixed sealed local selection');if(index.unavailable)fail('TREE_SELECTION_UNAVAILABLE');}
 const manifest=sealedTypeScriptManifest(options.root,Object.fromEntries(index.files)),view=materializeSealedTypeScriptSelectedView(capture,manifest);
 // Only this exact fixed selector may attach the policy identity, after every
 // selected record and source/stage closing guard completed successfully.
 return Object.freeze({...view,interpretation:'redue-typescript-selected-prepared-view@1',selectionDefinitionSha256:hash(canonical(SEALED_TYPESCRIPT_SELECTION))});
 }catch(error){invalidateSealedTypeScriptSelection(capture);if(error?.code?.startsWith('TREE_'))throw error;fail('TREE_SELECTION_UNAVAILABLE');}
}
