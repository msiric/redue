// One fixed trusted PRE-AGENT preparation operation, not a command dispatcher.
// Not integrated into CLI, daemon, signing or applicability. Failed remnants are
// retained; the provisioning job owns its one-attempt disk/cleanup accounting.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {sealedPreparationProfile} from './sealed-typescript-preparation-profile.mjs';
import {canonical} from '../../src/portable-envelope.mjs';
import {PREPARATION_REASON_CODES} from './sealed-typescript-preparation-child.mjs';
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
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const result=(started,value)=>{const elapsed=performance.now()-started;return freeze({schema:1,scope:'TRUSTED_PRE_AGENT_PREPARATION_ONLY',
  sealed:false,executable:false,reuseEligible:false,elapsedMs:Number.isFinite(elapsed)&&elapsed>=0?elapsed:null,...value});};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const identity=file=>{const stat=fs.lstatSync(file,{bigint:true});
  if(stat.isSymbolicLink()||fs.realpathSync(file)!==file)fail('PREPARATION_BINDING_CHANGED');
  return ['dev','ino','mode','uid'].map(key=>String(stat[key])).join(':');};
function binding(proposal){
  const directories=[];
  for(const file of [proposal.source,proposal.parent,proposal.node,...proposal.code.map(([file])=>file)]){
    for(let dir=file;;dir=path.dirname(dir)){
      if(!directories.some(([existing])=>existing===dir))directories.push([dir,identity(dir)]);
      if(dir===path.dirname(dir))break;
    }
  }
  const node=hash(fs.readFileSync(proposal.node));
  if(node!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc'||
    proposal.code.some(([file,digest])=>hash(fs.readFileSync(file))!==digest))fail('PREPARATION_BINDING_CHANGED');
  return canonical({directories,node,code:proposal.code});
}
function treeOutput(tree,proposal,manifest){
  return exact(tree,['schema','interpretation','root','manifestDigest','files','bytes','identity','physical','sealed','reuseEligible'])&&
    tree.schema===1&&tree.interpretation==='redue-typescript-materialization@1'&&tree.sealed===false&&tree.reuseEligible===false&&
    typeof tree.root==='string'&&path.dirname(tree.root)===proposal.parent&&
    /^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(tree.root))&&
    Number.isSafeInteger(tree.bytes)&&tree.bytes>=0&&tree.bytes<=512*1024*1024&&
    typeof tree.identity==='string'&&/^\d+:\d+$/.test(tree.identity)&&
    Array.isArray(tree.files)&&canonical(tree.files)===canonical(manifest)&&tree.manifestDigest===hash(canonical(manifest))&&
    Array.isArray(tree.physical)&&tree.physical.length===manifest.length&&tree.physical.every((row,at)=>
      Array.isArray(row)&&row.length===3&&row[0]===manifest[at][0]&&typeof row[1]==='string'&&/^\d+:\d+$/.test(row[1])&&
      typeof row[2]==='string'&&/^(?:\d+:){7}\d+$/.test(row[2])&&row[2].startsWith(row[1]+':'));
}
export function prepareSealedTypeScriptInputs(options){
  const started=performance.now();
  let previous=started,exhausted=!Number.isFinite(started)||started<0;
  const remaining=()=>{const now=performance.now();
    if(exhausted||!Number.isFinite(now)||now<previous){exhausted=true;fail('PREPARATION_DEADLINE');}
    previous=now;const ms=Math.floor(SEALED_PREPARATION_LIMITS.milliseconds-(now-started));
    if(ms<1){exhausted=true;fail('PREPARATION_DEADLINE');}return ms;};
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==3||
    !['source','parent','manifest'].every(key=>Object.hasOwn(options,key)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('PREPARATION_OPTIONS');
  const {source,parent}=options,manifest=dataManifest(options.manifest);
  const proposal=sealedPreparationProfile({source,parent});
  remaining();
  const input=JSON.stringify({root:proposal.source,parent:proposal.parent,manifest});
  if(Buffer.byteLength(input)>SEALED_PREPARATION_LIMITS.inputBytes)fail('PREPARATION_INPUT_SIZE');
  // Trusted code/runtime selection is fixed, outside the source/stage write
  // authority. Preserve audit hashes and refuse any changed code before launch.
  const before=binding(proposal);remaining();
  const child=spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:proposal.parent,env:{},input,encoding:'utf8',timeout:remaining(),killSignal:'SIGKILL',
      maxBuffer:SEALED_PREPARATION_LIMITS.outputBytes,stdio:['pipe','pipe','pipe']});
  const audit={profileSha256:proposal.sha256,code:proposal.code,
    childExit:Number.isInteger(child.status)&&child.status>=0&&child.status<=255?child.status:null,
    childSignal:['SIGABRT','SIGKILL','SIGTERM','SIGPIPE','SIGBUS','SIGSEGV','SIGILL','SIGINT'].includes(child.signal)?child.signal:null,
    childReaped:Number.isInteger(child.pid)&&child.pid>0&&(Number.isInteger(child.status)||typeof child.signal==='string'),
    sourceEnvironmentChanged:false,preparationEnvironment:'EMPTY_NO_AUTHENTICATION',
    partialStageDisposition:'RETAINED_REQUIRES_OWNED_PROVISIONER_REVIEW'};
  // Never include raw spawn errors/argv/stdout/stderr in an unknown outcome.
  if(child.error||child.signal||child.stderr||!Number.isInteger(child.status))return result(started,{...audit,
    outcome:'UNKNOWN',reason:'PREPARATION_CHILD_UNAVAILABLE'});
  try{
    remaining();const output=JSON.parse(child.stdout);
    // Fixed child emits exactly one stringify frame. Re-encoding detects
    // duplicate fields and unexpected framing before any result is admitted.
    if(JSON.stringify(output)+'\n'!==child.stdout)fail('PREPARATION_OUTPUT_UNKNOWN');
    if(child.status===74&&exact(output,['schema','ok','reason_code'])&&output.schema===1&&output.ok===false&&
      PREPARATION_REASON_CODES.includes(output.reason_code))return result(started,{...audit,outcome:'REFUSED',reason:output.reason_code});
    if(child.status!==0||!exact(output,['schema','ok','materialization'])||output.schema!==1||output.ok!==true||
      !treeOutput(output.materialization,proposal,manifest))fail('PREPARATION_OUTPUT_UNKNOWN');
    const tree=output.materialization;
    const stage=fs.lstatSync(tree.root,{bigint:true});
    if(binding(proposal)!==before||!stage.isDirectory()||stage.isSymbolicLink()||stage.uid!==BigInt(process.getuid())||
      (stage.mode&0o7777n)!==0o700n||`${stage.dev}:${stage.ino}`!==tree.identity||fs.realpathSync(tree.root)!==tree.root)
      fail('PREPARATION_BINDING_CHANGED');
    remaining();
    // Data only: current bindings still do not certify compiler namespace or a
    // native write seal. No actual command or observation authority travels.
    return result(started,{...audit,outcome:'MATERIALIZED_NOT_SEALED',reason:'SEALED_RECIPE_ENFORCEMENT_PENDING',materialization:tree});
  }catch(error){return result(started,{...audit,outcome:'UNKNOWN',reason:
    ['PREPARATION_DEADLINE','PREPARATION_BINDING_CHANGED'].includes(error?.code)?error.code:'PREPARATION_OUTPUT_UNKNOWN'});}
}
