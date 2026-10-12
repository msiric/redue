// Fixed diagnostic child, SAME preparation resources and privileges. No launch.
import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {sealedPreparationProfile} from './sealed-typescript-preparation-profile.mjs';
export function sealedPreparationDiagnosticProfile(options){
 const base=sealedPreparationProfile(options),child=fileURLToPath(new URL('./sealed-typescript-preparation-diagnostic.mjs',import.meta.url)),
  stat=fs.lstatSync(child),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==process.getuid()||fs.realpathSync(child)!==child)
  throw Object.assign(Error('PREPARATION_DIAGNOSTIC_CODE'),{code:'PREPARATION_DIAGNOSTIC_CODE'});
 const literal='"'+child.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"',
  profile=base.profile+'(allow file-read* (literal '+literal+'))\n';
 return Object.freeze({...base,child,profile,sha256:sha(profile),
  interpretation:'redue-sealed-preparation-diagnostic@1',
  code:Object.freeze([...base.code,Object.freeze([child,sha(fs.readFileSync(child))])]),
  diagnosticOnly:true,sealed:false,reuseEligible:false});
}
