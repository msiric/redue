// Read every selected envelope, not merely selector metadata. This guard is an
// independent authority domain from local receipt selection.
import fs from 'node:fs';
import path from 'node:path';
import {readImportedSnapshot} from './portable-store.mjs';
function present(file){try{fs.lstatSync(file);return true;}catch(error){return error.code!=='ENOENT';}}
export function readPortableCatalog(state,expected){
  const selector=present(path.join(state,'portable-imports-v1.json')),pending=present(path.join(state,'portable-import-pending-v1.json'));
  if(!selector&&!pending){
    if(present(path.join(state,'portable-evidence-v1')))return {revision:null,records:[],error:{
      code:'PORTABLE_SELECTION_MISSING',reason:'Persisted portable evidence has no readable selection; owner inspection is required'}};
    return {revision:'none',records:[]};
  }
  return readImportedSnapshot(state,expected);
}
export function portableCatalogMatches(state,expected,revision){
  const current=readPortableCatalog(state,expected);
  return !current.error&&typeof revision==='string'&&current.revision===revision;
}
