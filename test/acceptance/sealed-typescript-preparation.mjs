// One fixed trusted PRE-AGENT preparation operation, not a command dispatcher.
// Not integrated into CLI, daemon, signing or applicability. Failed remnants are
// retained; the provisioning job owns its one-attempt disk/cleanup accounting.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {sealedPreparationProfile,sealedSelectedPreparationProfile} from './sealed-typescript-preparation-profile.mjs';
import {canonical} from '../../src/portable-envelope.mjs';
import {validateSealedTypeScriptDirectoryInventory,SEALED_TYPESCRIPT_SELECTION} from '../../src/sealed-typescript-tree.mjs';
import {PREPARATION_REASON_CODES,SELECTED_PREPARATION_REASON_CODES} from './sealed-typescript-preparation-child.mjs';
export const SEALED_PREPARATION_LIMITS=Object.freeze({milliseconds:120000,inputBytes:8*1024*1024,outputBytes:8*1024*1024});
const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex');
export const SEALED_PREPARATION_SIGNALS=Object.freeze(['SIGHUP','SIGINT','SIGQUIT','SIGILL','SIGTRAP','SIGABRT','SIGIOT','SIGBUS','SIGFPE','SIGKILL',
  'SIGUSR1','SIGSEGV','SIGUSR2','SIGPIPE','SIGALRM','SIGTERM','SIGCHLD','SIGCONT','SIGSTOP','SIGTSTP','SIGTTIN',
  'SIGTTOU','SIGURG','SIGXCPU','SIGXFSZ','SIGVTALRM','SIGPROF','SIGWINCH','SIGIO','SIGINFO','SIGSYS']);
const signals=new Set(SEALED_PREPARATION_SIGNALS);
export function preparationDataManifest(value){
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
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const identity=file=>{const stat=fs.lstatSync(file,{bigint:true});
  if(stat.isSymbolicLink()||fs.realpathSync(file)!==file)fail('PREPARATION_BINDING_CHANGED');
  return ['dev','ino','mode','uid'].map(key=>String(stat[key])).join(':');};
const fingerprint=stat=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
function namedSnapshot(files){return files.map(file=>{const stat=fs.lstatSync(file,{bigint:true});
  if(stat.isSymbolicLink()||fs.realpathSync(file)!==file)fail('PREPARATION_BINDING_CHANGED');return[file,fingerprint(stat)];});}
function namedCurrent(rows){for(const [file,expected]of rows){const stat=fs.lstatSync(file,{bigint:true});
  if(stat.isSymbolicLink()||fs.realpathSync(file)!==file||fingerprint(stat)!==expected)fail('PREPARATION_BINDING_CHANGED');}}
function boundCodeCurrent(proposal){
  for(const file of proposal.codeAbsent||[]){let absent=false;try{fs.lstatSync(file);}catch(error){if(error?.code==='ENOENT')absent=true;else throw error;}if(!absent)fail('PREPARATION_BINDING_CHANGED');}
  for(const [file,kind,expected]of proposal.codeMetadata||[]){const stat=fs.lstatSync(file,{bigint:true}),keys=kind==='full'?['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs']:['dev','ino','mode','uid'];
    if(stat.isSymbolicLink()||fs.realpathSync(file)!==file||keys.map(key=>String(stat[key])).join(':')!==expected)fail('PREPARATION_BINDING_CHANGED');}
}
function binding(proposal,closeNamed=false){
  const originals=closeNamed?namedSnapshot([proposal.source,proposal.parent,proposal.node]):null;
  boundCodeCurrent(proposal);
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
  // Selected preparation closes every original named root/runtime/ancestor
  // after body hashing, not only the code pool. This is not an atomic seal.
  if(originals)for(const [file,expected]of directories)if(identity(file)!==expected)fail('PREPARATION_BINDING_CHANGED');
  boundCodeCurrent(proposal);
  if(originals)namedCurrent(originals);
  return canonical({directories,node,code:proposal.code});
}
function treeOutput(tree,proposal,manifest,directoryInventory=null){
  const directoryKeys=directoryInventory?['sourceDirectoryInventoryDigest','materializedDirectoryInventoryDigest','directoryCount','directoryEntryCount']:[];
  return exact(tree,['schema','interpretation','root','sourceManifestDigest','materializedManifestDigest','fileCount','physicalDigest',
    'sourceAliasGroupsDigest','sourceAliasGroupCount','sourceAliasEntryCount','bytes','identity','sealed','reuseEligible',...directoryKeys])&&
    tree.schema===1&&tree.interpretation===(directoryInventory?'redue-typescript-materialization-summary@3':'redue-typescript-materialization-summary@2')&&
    (!directoryInventory||tree.sourceDirectoryInventoryDigest===directoryInventory.digest&&tree.materializedDirectoryInventoryDigest===directoryInventory.digest&&tree.directoryCount===directoryInventory.directoryCount&&tree.directoryEntryCount===directoryInventory.entryCount)&&tree.sealed===false&&tree.reuseEligible===false&&
    typeof tree.root==='string'&&path.dirname(tree.root)===proposal.parent&&
    /^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(tree.root))&&
    Number.isSafeInteger(tree.bytes)&&tree.bytes>=0&&tree.bytes<=512*1024*1024&&
    typeof tree.identity==='string'&&/^\d+:\d+$/.test(tree.identity)&&
    tree.fileCount===manifest.length&&tree.sourceManifestDigest===hash(canonical(manifest))&&
    ['materializedManifestDigest','physicalDigest','sourceAliasGroupsDigest'].every(key=>
      typeof tree[key]==='string'&&/^[a-f0-9]{64}$/.test(tree[key]))&&
    Number.isSafeInteger(tree.sourceAliasGroupCount)&&tree.sourceAliasGroupCount>=0&&
    tree.sourceAliasGroupCount<=Math.floor(manifest.length/2)&&
    Number.isSafeInteger(tree.sourceAliasEntryCount)&&tree.sourceAliasEntryCount>=tree.sourceAliasGroupCount*2&&
    tree.sourceAliasEntryCount<=manifest.length&&
    (tree.sourceAliasGroupCount>0?tree.sourceAliasGroupsDigest!==hash(canonical([])):tree.sourceAliasEntryCount===0&&
      tree.sourceAliasGroupsDigest===hash(canonical([]))&&tree.materializedManifestDigest===tree.sourceManifestDigest);
}
function selectedTreeOutput(tree,proposal){
  const keys=['schema','interpretation','root','sourceManifestDigest','materializedManifestDigest','fileCount','physicalDigest',
    'sourceAliasGroupsDigest','sourceAliasGroupCount','sourceAliasEntryCount','bytes','identity','sealed','reuseEligible',
    'selectionDefinitionSha256','stageDirectoryInventoryDigest','stageDirectoryCount','stageDirectoryEntryCount','sourceNamespaceEquivalent','nativeViewVerified'];
  if(!exact(tree,keys)||tree.schema!==1||tree.interpretation!=='redue-typescript-selected-prepared-summary@1'||
    tree.selectionDefinitionSha256!==hash(canonical(SEALED_TYPESCRIPT_SELECTION))||tree.sourceNamespaceEquivalent!==false||tree.nativeViewVerified!==false||tree.sealed!==false||tree.reuseEligible!==false)return false;
  const count=tree.fileCount;
  return Number.isSafeInteger(count)&&count>=1&&count<=100000&&typeof tree.root==='string'&&path.dirname(tree.root)===proposal.parent&&
    /^redue-materialization-[A-Za-z0-9]{6}$/.test(path.basename(tree.root))&&Number.isSafeInteger(tree.bytes)&&tree.bytes>=0&&tree.bytes<=512*1024*1024&&
    typeof tree.identity==='string'&&/^\d+:\d+$/.test(tree.identity)&&
    ['sourceManifestDigest','materializedManifestDigest','physicalDigest','sourceAliasGroupsDigest','stageDirectoryInventoryDigest'].every(key=>typeof tree[key]==='string'&&/^[a-f0-9]{64}$/.test(tree[key]))&&
    Number.isSafeInteger(tree.stageDirectoryCount)&&tree.stageDirectoryCount>=1&&tree.stageDirectoryCount<=100000&&
    Number.isSafeInteger(tree.stageDirectoryEntryCount)&&tree.stageDirectoryEntryCount===count+tree.stageDirectoryCount-1&&
    Number.isSafeInteger(tree.sourceAliasGroupCount)&&tree.sourceAliasGroupCount>=0&&tree.sourceAliasGroupCount<=Math.floor(count/2)&&
    Number.isSafeInteger(tree.sourceAliasEntryCount)&&tree.sourceAliasEntryCount>=tree.sourceAliasGroupCount*2&&tree.sourceAliasEntryCount<=count&&
    (tree.sourceAliasGroupCount>0?tree.sourceAliasGroupsDigest!==hash(canonical([])):tree.sourceAliasEntryCount===0&&tree.sourceAliasGroupsDigest===hash(canonical([]))&&tree.materializedManifestDigest===tree.sourceManifestDigest);
}
export function prepareSealedTypeScriptInputs(options){return prepareInputs(options,false);}
export function prepareSealedTypeScriptSelectedInputs(options){return prepareInputs(options,true);}
function prepareInputs(options,selectedView){
  const started=performance.now();
  let previous=started,exhausted=!Number.isFinite(started)||started<0;
  const remaining=()=>{const now=performance.now();
    if(exhausted||!Number.isFinite(now)||now<previous){exhausted=true;fail('PREPARATION_DEADLINE');}
    previous=now;const ms=Math.floor(SEALED_PREPARATION_LIMITS.milliseconds-(now-started));
    if(ms<1){exhausted=true;fail('PREPARATION_DEADLINE');}return ms;};
  const result=value=>{
    // Deep result validation/freezing is part of the total budget. One final
    // validated sample establishes both its classification and reported time.
    freeze(value);let elapsed=null;
    try{remaining();elapsed=previous-started;}catch{
      const {materialization,...audit}=value;
      value={...audit,outcome:'UNKNOWN',reason:'PREPARATION_DEADLINE'};
    }
    return Object.freeze({schema:1,scope:'TRUSTED_PRE_AGENT_PREPARATION_ONLY',
      sealed:false,executable:false,reuseEligible:false,elapsedMs:elapsed,...value});
  };
  remaining();
  const fullDirectories=!selectedView&&!!options&&Object.hasOwn(options,'directoryInventory'),optionKeys=selectedView?['source','parent']:['source','parent','manifest',...(fullDirectories?['directoryInventory']:[])];
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==optionKeys.length||
    !optionKeys.every(key=>Object.hasOwn(options,key)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('PREPARATION_OPTIONS');
  const {source,parent}=options,manifest=selectedView?null:preparationDataManifest(options.manifest);
  let directoryInventory=null;try{if(fullDirectories)directoryInventory=validateSealedTypeScriptDirectoryInventory(options.directoryInventory);}catch{fail('PREPARATION_SCHEMA');}
  const proposal=selectedView?sealedSelectedPreparationProfile({source,parent}):sealedPreparationProfile({source,parent});
  remaining();
  const input=JSON.stringify({root:proposal.source,parent:proposal.parent,...(selectedView?{}:{manifest,...(directoryInventory?{directoryInventory}:{})})});
  if(Buffer.byteLength(input)>SEALED_PREPARATION_LIMITS.inputBytes)fail('PREPARATION_INPUT_SIZE');
  // Trusted code/runtime selection is fixed, outside the source/stage write
  // authority. Preserve audit hashes and refuse any changed code before launch.
  const before=binding(proposal,selectedView);remaining();
  const timeout=remaining();let child,returned=false;
  try{child=spawnSync('/usr/bin/sandbox-exec',['-p',proposal.profile,proposal.node,proposal.child],
    {cwd:proposal.parent,env:{},input,encoding:'utf8',timeout,killSignal:'SIGKILL',
      maxBuffer:SEALED_PREPARATION_LIMITS.outputBytes,stdio:['pipe','pipe','pipe']});returned=true;
  }catch(error){if(!selectedView)throw error;child={status:null,signal:null};}
  if(selectedView&&(!child||typeof child!=='object'))child={status:null,signal:null};
  const audit={profileSha256:proposal.sha256,code:proposal.code,
    childExit:Number.isInteger(child.status)&&child.status>=0&&child.status<=255?child.status:null,
    childSignal:signals.has(child.signal)?child.signal:child.signal===null?null:'UNKNOWN_SIGNAL',
    childReaped:Number.isInteger(child.pid)&&child.pid>0&&(Number.isInteger(child.status)&&child.status>=0&&child.status<=255||signals.has(child.signal)),
    sourceEnvironmentChanged:false,preparationEnvironment:'EMPTY_NO_AUTHENTICATION',
    partialStageDisposition:'RETAINED_REQUIRES_OWNED_PROVISIONER_REVIEW',...(selectedView?{childSpawnAttempts:1,childSpawnResults:returned?1:0,childPid:Number.isInteger(child.pid)&&child.pid>0?child.pid:null}:{})};
  // Never include raw spawn errors/argv/stdout/stderr in an unknown outcome.
  if(child.error||child.signal||child.stderr||!Number.isInteger(child.status)||selectedView&&!audit.childReaped)return result({...audit,
    outcome:'UNKNOWN',reason:'PREPARATION_CHILD_UNAVAILABLE'});
  try{
    remaining();if(selectedView&&binding(proposal,true)!==before)fail('PREPARATION_BINDING_CHANGED');const output=JSON.parse(child.stdout);
    // Fixed child emits exactly one stringify frame. Re-encoding detects
    // duplicate fields and unexpected framing before any result is admitted.
    if(JSON.stringify(output)+'\n'!==child.stdout)fail('PREPARATION_OUTPUT_UNKNOWN');
    if(child.status===74&&exact(output,['schema','ok','reason_code'])&&output.schema===(selectedView?5:directoryInventory?4:3)&&output.ok===false&&
      (selectedView?SELECTED_PREPARATION_REASON_CODES:PREPARATION_REASON_CODES).includes(output.reason_code))return result({...audit,outcome:'REFUSED',reason:output.reason_code});
    if(child.status!==0||!exact(output,['schema','ok','materialization'])||output.schema!==(selectedView?5:directoryInventory?4:3)||output.ok!==true||
      !(selectedView?selectedTreeOutput(output.materialization,proposal):treeOutput(output.materialization,proposal,manifest,directoryInventory)))fail('PREPARATION_OUTPUT_UNKNOWN');
    const tree=output.materialization;
    const stage=fs.lstatSync(tree.root,{bigint:true});
    const originals=selectedView?[...namedSnapshot([proposal.source,proposal.parent,proposal.node]),[tree.root,fingerprint(stage)]]:null;
    if(binding(proposal,selectedView)!==before)fail('PREPARATION_BINDING_CHANGED');
    const currentStage=selectedView?fs.lstatSync(tree.root,{bigint:true}):stage;
    if(!currentStage.isDirectory()||currentStage.isSymbolicLink()||currentStage.uid!==BigInt(process.getuid())||
      (currentStage.mode&0o7777n)!==0o700n||`${currentStage.dev}:${currentStage.ino}`!==tree.identity||fs.realpathSync(tree.root)!==tree.root)
      fail('PREPARATION_BINDING_CHANGED');
    // No body validation follows this complete named closing group. Preserve
    // the pre-validation stage fingerprint; a replacement cannot be adopted.
    if(originals){boundCodeCurrent(proposal);namedCurrent(originals);}
    remaining();
    // Digests/counts are fixed-child audit data, not parent per-file inspection.
    // Data only: current bindings still do not certify compiler namespace or a
    // native write seal. No actual command or observation authority travels.
    return result({...audit,outcome:'MATERIALIZED_NOT_SEALED',reason:'SEALED_RECIPE_ENFORCEMENT_PENDING',materialization:tree});
  }catch(error){return result({...audit,outcome:'UNKNOWN',reason:
    ['PREPARATION_DEADLINE','PREPARATION_BINDING_CHANGED'].includes(error?.code)?error.code:'PREPARATION_OUTPUT_UNKNOWN'});}
}
