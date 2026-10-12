// One fixed trusted PRE-AGENT preparation operation, not a command dispatcher.
// Not integrated into CLI, daemon, signing or applicability. Failed remnants are
// retained; the provisioning job owns its one-attempt disk/cleanup accounting.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {sealedPreparationProfile} from './sealed-typescript-preparation-profile.mjs';
import {canonical} from '../../src/portable-envelope.mjs';
export const SEALED_PREPARATION_LIMITS=Object.freeze({milliseconds:120000,inputBytes:8*1024*1024,outputBytes:8*1024*1024});
const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex');
function dataManifest(value){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<1||value.length>100000||
    Reflect.ownKeys(value).length!==value.length+1)fail('PREPARATION_SCHEMA');
  const rows=[];let previous='';
  for(let at=0;at<value.length;at++){
    const d=Object.getOwnPropertyDescriptor(value,String(at));
    if(!d||!Object.hasOwn(d,'value'))fail('PREPARATION_SCHEMA');
    const row=d.value;
    if(!Array.isArray(row)||Object.getPrototypeOf(row)!==Array.prototype||row.length!==2||
      Reflect.ownKeys(row).length!==3)fail('PREPARATION_SCHEMA');
    const a=Object.getOwnPropertyDescriptor(row,'0'),b=Object.getOwnPropertyDescriptor(row,'1');
    if(!a||!b||!Object.hasOwn(a,'value')||!Object.hasOwn(b,'value')||
      typeof a.value!=='string'||typeof b.value!=='string'||!a.value||a.value<=previous||
      Buffer.byteLength(a.value)>4096||!/^[a-f0-9]{64}$/.test(b.value))fail('PREPARATION_SCHEMA');
    previous=a.value;rows.push([a.value,b.value]);
  }return rows;
}
const result=(started,value)=>Object.freeze({schema:1,scope:'TRUSTED_PRE_AGENT_PREPARATION_ONLY',
  sealed:false,executable:false,reuseEligible:false,elapsedMs:performance.now()-started,...value});
export function prepareSealedTypeScriptInputs(options){
  const started=performance.now();
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||
    !['source','parent','manifest'].every(key=>Object.hasOwn(options,key)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('PREPARATION_OPTIONS');
  const {source,parent}=options,manifest=dataManifest(options.manifest);
  const proposal=sealedPreparationProfile({source,parent});
  const input=JSON.stringify({root:proposal.source,parent:proposal.parent,manifest});
  if(Buffer.byteLength(input)>SEALED_PREPARATION_LIMITS.inputBytes)fail('PREPARATION_INPUT_SIZE');
  // Trusted code/runtime selection is fixed, outside the source/stage write
  // authority. Preserve audit hashes and refuse any changed code before launch.
  if(proposal.code.some(([file,digest])=>hash(fs.readFileSync(file))!==digest))fail('PREPARATION_CODE_CHANGED');
  const child=spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:proposal.parent,env:{},input,encoding:'utf8',timeout:SEALED_PREPARATION_LIMITS.milliseconds,
      maxBuffer:SEALED_PREPARATION_LIMITS.outputBytes,stdio:['pipe','pipe','pipe']});
  const audit={profileSha256:proposal.sha256,code:proposal.code,
    childExit:child.status,childSignal:child.signal,
    childReaped:Number.isInteger(child.pid)&&(Number.isInteger(child.status)||typeof child.signal==='string'),
    sourceEnvironmentChanged:false,preparationEnvironment:'EMPTY_NO_AUTHENTICATION',
    partialStageDisposition:'RETAINED_REQUIRES_OWNED_PROVISIONER_REVIEW'};
  // Never include raw spawn errors/argv/stdout/stderr in an unknown outcome.
  if(child.error||child.signal||child.stderr||!Number.isInteger(child.status))return result(started,{...audit,
    outcome:'UNKNOWN',reason:'PREPARATION_CHILD_UNAVAILABLE'});
  let output;try{output=JSON.parse(child.stdout);}catch{return result(started,{...audit,outcome:'UNKNOWN',reason:'PREPARATION_OUTPUT_UNKNOWN'});}
  if(child.status!==0||output?.ok!==true){
    const reason=typeof output?.reason_code==='string'&&/^(?:TREE|PREPARATION)_[A-Z_]+$/.test(output.reason_code)
      ?output.reason_code:'PREPARATION_OUTPUT_UNKNOWN';
    return result(started,{...audit,outcome:'REFUSED',reason});
  }
  const tree=output.materialization;
  // A child result does not grant new paths. It must stay in this exclusively
  // prepared parent; the later native enforcement/namespace gate is still absent.
  if(!tree||tree.schema!==1||tree.sealed!==false||tree.reuseEligible!==false||
    typeof tree.root!=='string'||path.dirname(tree.root)!==proposal.parent||
    !/^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(tree.root))||
    !Array.isArray(tree.files)||canonical(tree.files)!==canonical(manifest)||
    tree.manifestDigest!==hash(canonical(manifest)))
    return result(started,{...audit,outcome:'UNKNOWN',reason:'PREPARATION_OUTPUT_UNKNOWN'});
  return result(started,{...audit,outcome:'MATERIALIZED_NOT_SEALED',reason:'SEALED_RECIPE_ENFORCEMENT_PENDING',materialization:tree});
}
