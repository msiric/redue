// Fixed PRE-AGENT local selection only. No imported manifest, selector or code.
// This is data preparation; an immutable native view remains a separate gate.
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {canonical} from '../../src/portable-envelope.mjs';
import {SEALED_TYPESCRIPT_SELECTION,validateSealedTypeScriptDirectoryInventory} from '../../src/sealed-typescript-tree.mjs';
import {prepareSealedTypeScriptSelectedView} from '../../src/sealed-typescript-manifest.mjs';
import {consumePreparationInput,parseSelectedPreparationInput,summarizePreparationMaterialization,PREPARATION_BYTES,SELECTED_PREPARATION_REASON_CODES} from './sealed-typescript-preparation-child.mjs';

const fail=code=>{throw Object.assign(Error(code),{code});};
const reasons=new Set(SELECTED_PREPARATION_REASON_CODES);
const safeCode=error=>reasons.has(error?.code)?error.code:'PREPARATION_FAILED';
const definition=()=>createHash('sha256').update(canonical(SEALED_TYPESCRIPT_SELECTION)).digest('hex');
export function summarizeSelectedPreparation(view){
  if(view.interpretation!=='redue-typescript-selected-prepared-view@1'||view.selectionDefinitionSha256!==definition()||
    ['sourceNamespaceEquivalent','nativeViewVerified','sealed','reuseEligible'].some(key=>view[key]!==false))fail('PREPARATION_OUTPUT');
  const inventory=validateSealedTypeScriptDirectoryInventory(view.stageDirectoryInventory);
  return {...summarizePreparationMaterialization(view),interpretation:'redue-typescript-selected-prepared-summary@1',
    selectionDefinitionSha256:view.selectionDefinitionSha256,stageDirectoryInventoryDigest:inventory.digest,
    stageDirectoryCount:inventory.directoryCount,stageDirectoryEntryCount:inventory.entryCount,
    sourceNamespaceEquivalent:false,nativeViewVerified:false};
}
async function main(){let response,failed=false;
  try{if(process.argv.length!==2)fail('PREPARATION_ARGUMENTS');
    const bytes=await consumePreparationInput(process.stdin),input=parseSelectedPreparationInput(bytes);
    const view=prepareSealedTypeScriptSelectedView({root:input.root,parent:input.parent,sourcePatterns:[...SEALED_TYPESCRIPT_SELECTION.sourcePatterns]});
    response=JSON.stringify({schema:5,ok:true,materialization:summarizeSelectedPreparation(view)});
    if(Buffer.byteLength(response)>PREPARATION_BYTES)fail('PREPARATION_OUTPUT');
  }catch(error){failed=true;response=JSON.stringify({schema:5,ok:false,reason_code:safeCode(error)});}
  process.exitCode=failed?74:0;process.stdout.on('error',()=>{});
  try{await new Promise((resolve,reject)=>process.stdout.write(response+'\n',error=>error?reject(error):resolve()));}catch{process.exitCode=74;}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
