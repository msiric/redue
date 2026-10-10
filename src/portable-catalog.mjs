// Read every selected envelope, not merely selector metadata. This guard is an
// independent authority domain from local receipt selection.
import fs from 'node:fs';
import path from 'node:path';
import {readImportedSnapshot} from './portable-store.mjs';
function present(file){try{fs.lstatSync(file);return true;}catch(error){return error.code!=='ENOENT';}}
export function readPortableCatalog(state,expected){
  if(!['portable-imports-v1.json','portable-import-pending-v1.json'].some(name=>present(path.join(state,name))))
    return {revision:'none',records:[]};
  return readImportedSnapshot(state,expected);
}
export function portableCatalogMatches(state,expected,revision){
  const current=readPortableCatalog(state,expected);
  return !current.error&&typeof revision==='string'&&current.revision===revision;
}
