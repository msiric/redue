// Pending contract identity only. No serialized data grants execution authority.
export const sealedTypeScriptInterpretation='npm-sealed-typescript@1';
export const sealedTypeScriptQualification='npm-typescript-sealed-v1';
export const sealedTypeScriptPending='SEALED_RECIPE_ENFORCEMENT_PENDING';
export const sealedTypeScriptCommand=Object.freeze(['@node','@sealed-root/node_modules/typescript/lib/tsc.js','--noEmit']);
export function assertPendingSealedTypeScriptCheck(check,{resolved=false}={}){
  const expected=[resolved?process.execPath:'@node',...sealedTypeScriptCommand.slice(1)];
  if(check.qualification!==sealedTypeScriptQualification||typeof check.script!=='string'||!check.script||/[\u0000-\u001f\u007f]/u.test(check.script)||
    check.cwd!=='.'||JSON.stringify(check.command)!==JSON.stringify(expected)||
    (resolved?check.qualificationInterpretation!==sealedTypeScriptInterpretation:
      check.qualificationInterpretation!==undefined&&check.qualificationInterpretation!==sealedTypeScriptInterpretation)||
    (check.probes||[]).length)fail('SEALED_RECIPE_CONFIGURATION');
}
const fail=code=>{throw Object.assign(Error(code),{code});};
