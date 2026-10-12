import fs from 'node:fs';
import path from 'node:path';
import {receiptRevision} from './state-store.mjs';
import {assertOwnedStatePlacement} from './owned-state.mjs';
import {canonical,encodeEnvelope,inspectEnvelope,parsePortableJson,
  PORTABLE_INTERPRETATION,PORTABLE_LIMITS,PortableEnvelopeError} from './portable-envelope.mjs';
import {importEvidence} from './portable-store.mjs';
import {readProducerPolicySnapshot,revalidateProducerPolicySnapshot} from './portable-producer-policy.mjs';
import {authorizeCIImport} from './portable-ci-authorization.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const fail=(code,message)=>{throw new PortableEnvelopeError(code,message);};
const identity=stat=>['dev','ino'].map(key=>String(stat[key])).join(':');
const fingerprint=stat=>['dev','ino','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
function pathSnapshot(file,{absent=false}={}){
  const absolute=path.resolve(file),parts=absolute.slice(path.parse(absolute).root.length).split(path.sep);
  const parents=[];let current=path.parse(absolute).root;
  for(let at=0;at<parts.length;at++){
    const part=parts[at];
    if(!part||process.platform==='win32'&&part.includes(':'))fail('PORTABLE_FILE_UNSAFE','Unsafe portable file path');
    current=path.join(current,part);let stat;
    try{stat=fs.lstatSync(current,{bigint:true});}
    catch(error){if(error.code==='ENOENT'&&absent&&at===parts.length-1)return {absolute,parents,stat:null};
      fail('PORTABLE_FILE_UNAVAILABLE','Portable file or its parent is unavailable');}
    if(stat.isSymbolicLink())fail('PORTABLE_FILE_UNSAFE','Portable file paths must not contain symlinks');
    if(at<parts.length-1){
      if(!stat.isDirectory())fail('PORTABLE_FILE_UNSAFE','Portable file parent must be a directory');
      parents.push([current,identity(stat)]);
    }else{
      if(!stat.isFile()||stat.nlink!==1n)fail('PORTABLE_FILE_UNSAFE','Portable file must be a single-link regular file');
      return {absolute,parents,stat};
    }
  }
  fail('PORTABLE_FILE_UNSAFE','Portable file cannot be a filesystem root');
}
function unchangedParents(before,after){
  return JSON.stringify(before.parents)===JSON.stringify(after.parents);
}

export function readBoundedPortableFile(file,{limit=PORTABLE_LIMITS.bytes}={}){
  if(!Number.isSafeInteger(limit)||limit<1||limit>PORTABLE_LIMITS.bytes)
    fail('PORTABLE_SIZE','Invalid portable read limit');
  const before=pathSnapshot(file);
  if(before.stat.size>BigInt(limit))fail('PORTABLE_SIZE','Portable file exceeds its byte limit');
  let descriptor;
  try{
    descriptor=fs.openSync(before.absolute,fs.constants.O_RDONLY|
      (fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(descriptor,{bigint:true}),now=pathSnapshot(before.absolute);
    if(!opened.isFile()||opened.nlink!==1n||!unchangedParents(before,now)||
      fingerprint(opened)!==fingerprint(before.stat)||fingerprint(now.stat)!==fingerprint(opened))
      fail('PORTABLE_FILE_CHANGED','Portable file changed while opening');
    const bytes=Buffer.alloc(Number(opened.size));let offset=0;
    while(offset<bytes.length){const count=fs.readSync(descriptor,bytes,offset,bytes.length-offset,offset);
      if(!count)fail('PORTABLE_FILE_CHANGED','Portable file ended before its declared size');offset+=count;}
    const after=pathSnapshot(before.absolute);
    if(!unchangedParents(before,after)||fingerprint(fs.fstatSync(descriptor,{bigint:true}))!==fingerprint(opened)||
      fingerprint(after.stat)!==fingerprint(opened))fail('PORTABLE_FILE_CHANGED','Portable file changed during reading');
    return bytes;
  }catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_FILE_UNAVAILABLE','Portable file could not be read safely');
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}

function writeExport(file,bytes,validateSelection){
  const before=pathSnapshot(file,{absent:true});
  if(before.stat)fail('PORTABLE_FILE_EXISTS','Export never overwrites an existing file');
  let descriptor,opened,completed=false;
  try{
    validateSelection();
    descriptor=fs.openSync(before.absolute,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|
      (fs.constants.O_NOFOLLOW??0),0o600);
    opened=fs.fstatSync(descriptor,{bigint:true});
    let now=pathSnapshot(before.absolute);
    if(!opened.isFile()||opened.nlink!==1n||!unchangedParents(before,now)||identity(now.stat)!==identity(opened))
      fail('PORTABLE_FILE_CHANGED','Export destination changed before writing');
    validateSelection();fs.writeFileSync(descriptor,bytes);fs.fsyncSync(descriptor);
    now=pathSnapshot(before.absolute);
    if(!unchangedParents(before,now)||fingerprint(now.stat)!==fingerprint(fs.fstatSync(descriptor,{bigint:true})))
      fail('PORTABLE_FILE_CHANGED','Export destination changed during writing');
    validateSelection();completed=true;
  }catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail(error.code==='EEXIST'?'PORTABLE_FILE_EXISTS':'PORTABLE_FILE_UNAVAILABLE',
      error.code==='EEXIST'?'Export never overwrites an existing file':'Export could not be written safely');
  }finally{
    if(descriptor!==undefined)fs.closeSync(descriptor);
    if(opened&&!completed)try{const current=pathSnapshot(before.absolute);
      // Never remove another writer's replacement or follow a changed parent.
      if(unchangedParents(before,current)&&identity(current.stat)===identity(opened))fs.unlinkSync(before.absolute);
    }catch{/* Leave an ambiguous destination intact for owner inspection. */}
  }
}

function projectSelection({root,runtime,publicConfig,stateOverride},check){
  if(!runtime||runtime.schema!==1||typeof runtime.state!=='string'||typeof runtime.root!=='string'||typeof root!=='string'||
    path.resolve(root)!==path.resolve(runtime.root)||stateOverride&&path.resolve(stateOverride)!==path.resolve(runtime.state))
    fail('PORTABLE_PROJECT','Selected project/runtime state is unavailable or inconsistent');
  if(!Array.isArray(publicConfig?.checks)||!Array.isArray(runtime.checks)||
    !publicConfig.checks.some(row=>row?.name===check)||!runtime.checks.some(row=>row?.name===check))
    fail('PORTABLE_CHECK','Select an explicitly configured local check');
  const state=path.resolve(runtime.state),ownerConfig=path.join(state,'project-runtime-v1.json');
  if(!/^(?:redue|vstate)-/.test(path.basename(state)))fail('PORTABLE_OWNERSHIP','A dedicated REDUE state directory is required');
  try{assertOwnedStatePlacement(runtime);}catch{fail('PORTABLE_OWNERSHIP','Selected state overlaps an observed input root');}
  const ownerFile=path.join(state,'vstate-owner-v1.json'),ownerSnapshot=pathSnapshot(ownerFile);
  const expected={schema:1,kind:'vstate-product-alpha',config:ownerConfig,root:path.resolve(root),state};
  const validateOwner=()=>{
    const owner=parsePortableJson(readBoundedPortableFile(ownerFile,{limit:8192})),current=pathSnapshot(ownerFile);
    if(canonical(owner)!==canonical(expected)||!unchangedParents(ownerSnapshot,current)||
      fingerprint(ownerSnapshot.stat)!==fingerprint(current.stat))
      fail('PORTABLE_OWNERSHIP','Existing ownership changed or does not match this selected project');
  };
  validateOwner();
  return {state,root:path.resolve(root),configFile:ownerConfig,validateOwner};
}

function selectedOrigin(state,check,validateOwner){
  let revision;
  validateOwner();
  try{revision=receiptRevision(state);}catch{fail('PORTABLE_SELECTION','Selected receipt update is unavailable or incomplete');}
  const validateSelection=()=>{
    validateOwner();
    try{if(receiptRevision(state)!==revision)throw Error('changed');}
    catch{fail('PORTABLE_SELECTION_CHANGED','Receipt selection changed or became incomplete during export');}
  };
  validateSelection();
  const selection=parsePortableJson(readBoundedPortableFile(path.join(state,'receipts-v1.json')));
  validateSelection();
  if(selection?.schema!==1||!selection.checks||typeof selection.checks!=='object'||Array.isArray(selection.checks))
    fail('PORTABLE_SELECTION','Selected receipt format is unsupported');
  if(!Object.hasOwn(selection.checks,check))fail('PORTABLE_NO_RECEIPT','No selected local execution exists for this check');
  const receipt=selection.checks[check],runId=receipt?.invocation?.runId;
  if(typeof runId!=='string'||!UUID.test(runId))fail('PORTABLE_SELECTION','Selected invocation identity is unsupported');
  const historical=parsePortableJson(readBoundedPortableFile(path.join(state,'runs-v1',runId+'.json')));
  validateSelection();
  if(historical?.schema!==1||historical.check!==check||canonical(historical.receipt)!==canonical(receipt))
    fail('PORTABLE_SELECTION','Selected receipt does not match its immutable origin record');
  validateSelection();return {receipt,validateSelection};
}

function exportEvidence(check,output,dry,context){
  const {state,validateOwner}=projectSelection(context,check),
    {receipt:r,validateSelection}=selectedOrigin(state,check,validateOwner);
  const captured=r.portable?.schema===1&&r.portable.interpretation===PORTABLE_INTERPRETATION;
  const complete=Boolean(captured&&r.portable.complete===true&&r.stable===true&&r.coverage?.qualified===true&&
    r.invocation.status==='exited'&&r.portable.facts);
  const facts=complete?r.portable.facts:null;
  const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,
    origin:{runId:r.invocation.runId,check,result:r.result,
      invocation:{status:r.invocation.status,exitCode:r.invocation.exitCode,signal:r.invocation.signal},complete},facts});
  const paths=facts?[...new Set([...facts.files,...facts.discovery.configs,...facts.discovery.files]
    .map(([file])=>file).concat(facts.compiler.entry))].sort():[];
  const result={schema:1,action:'export',check,digest:envelope.digest,output:path.resolve(output),written:false,
    origin:envelope.statement.predicate.origin,recipe:facts?.recipe??null,disclosed_paths:paths,
    input_count:facts?.files.length??0,reuse_eligible:false,
    reason_code:complete?null:captured?'PORTABLE_ORIGIN_INCOMPLETE':'PORTABLE_CAPTURE_MISSING',
    limitation:'Export preserves origin evidence, not recipient CURRENT. Filenames and hashes may be sensitive.'};
  // Preview also validates destination safety, but creates no directories/files.
  const destination=pathSnapshot(output,{absent:true});
  if(destination.stat)fail('PORTABLE_FILE_EXISTS','Export never overwrites an existing file');
  validateSelection();
  if(!dry){const bytes=canonical(envelope);writeExport(output,bytes,validateSelection);
    result.written=true;result.bytes=Buffer.byteLength(bytes);}
  return result;
}

function parseOptions(args){
  const [action,target,...rest]=args;
  if(!['export','inspect','import'].includes(action)||!target||target.startsWith('--'))
    fail('PORTABLE_USAGE','Use evidence export CHECK, inspect FILE, or import FILE --check CHECK');
  const allowed=action==='export'?['--output','--dry-run','--json']:
    action==='inspect'?['--json']:['--check','--accept-digest','--ci-policy-digest','--gh-executable','--gh-sha256','--bundle','--apply','--json'];
  const flags={};
  for(let at=0;at<rest.length;at++){
    const option=rest[at];
    if(!allowed.includes(option)||Object.hasOwn(flags,option))fail('PORTABLE_USAGE','Unknown or repeated evidence option');
    if(['--output','--check','--accept-digest','--ci-policy-digest','--gh-executable','--gh-sha256','--bundle'].includes(option)){
      const value=rest[++at];if(!value||value.startsWith('--'))fail('PORTABLE_USAGE','Evidence option requires one value');
      flags[option]=value;
    }else flags[option]=true;
  }
  if(action==='export'&&!flags['--output'])fail('PORTABLE_USAGE','Export requires --output FILE; preview with --dry-run');
  if(action==='import'&&!flags['--check'])fail('PORTABLE_CHECK','Import requires --check with an explicitly configured local check');
  const ci=Boolean(flags['--ci-policy-digest']);
  if(ci&&(flags['--accept-digest']||!flags['--gh-executable']||!flags['--gh-sha256'])||
    !ci&&['--gh-executable','--gh-sha256','--bundle'].some(key=>flags[key]))
    fail('PORTABLE_USAGE','CI acceptance requires one policy digest and reviewed verifier path/checksum, without manual acceptance');
  if(ci&&(!/^[a-f0-9]{64}$/.test(flags['--ci-policy-digest'])||
    !/^[a-f0-9]{64}$/.test(flags['--gh-sha256'])||!path.isAbsolute(flags['--gh-executable'])||
    flags['--bundle']&&!path.isAbsolute(flags['--bundle'])))
    fail('PORTABLE_USAGE','Select an exact policy/verifier digest and absolute local verifier/bundle paths');
  return {action,target,flags};
}

export async function portableCommand(args,context={}){
  const {action,target,flags}=parseOptions(args);let result;
  if(action==='inspect')result={action,...inspectEnvelope(readBoundedPortableFile(target))};
  else if(action==='export')result=exportEvidence(target,flags['--output'],Boolean(flags['--dry-run']),context);
  else{
    const project=projectSelection(context,flags['--check']);
    const bytes=readBoundedPortableFile(target);let ciAuthorization=null,policySnapshot=null;
    if(flags['--ci-policy-digest']){
      // The imported artifact cannot select or create its producer authority.
      const policyFile=path.join(project.state,'portable-producers-v1.json');
      policySnapshot=readProducerPolicySnapshot(policyFile);
      if(!policySnapshot.policies.some(item=>item.digest===flags['--ci-policy-digest']))
        fail('PORTABLE_CI_ACCEPTANCE','Selected producer policy is not in the current authoritative registry');
      if(flags['--apply'])ciAuthorization=authorizeCIImport({...project,policySnapshot,
        policyDigest:flags['--ci-policy-digest'],artifactFile:path.resolve(target),
        bundleFile:flags['--bundle']??null,ghExecutable:flags['--gh-executable'],ghExecutableSha256:flags['--gh-sha256']});
      if(!revalidateProducerPolicySnapshot(policySnapshot,{expectedFile:policyFile}))
        fail('PORTABLE_CI_POLICY_CHANGED','Current authoritative producer policy changed before import');
    }
    result={action,...importEvidence({...project,check:flags['--check'],bytes,
      acceptDigest:flags['--accept-digest']??null,ciAuthorization,apply:Boolean(flags['--apply'])}),
      ...(policySnapshot?{selected_policy_digest:flags['--ci-policy-digest'],proposed_acceptance:'github-ci-v1',
        producer_verified:Boolean(ciAuthorization)}:{})};
  }
  if(flags['--json'])console.log(JSON.stringify(result));
  else{
    console.log(`${action}: ${result.digest}`);
    if(action==='export'){
      console.log(result.written?'Evidence file written.':'Preview only; no file written.');
      console.log(`Origin: ${result.origin.result??'incomplete'}; portable capture ${result.origin.complete?'complete':'incomplete/local-only'}.`);
      console.log(`Output: ${JSON.stringify(result.output)}`);
      for(const file of result.disclosed_paths)console.log(`  disclosed path: ${JSON.stringify(file)}`);
    }else if(action==='import')console.log(result.apply?'Imported candidate stored.':'Preview only; no state written. Use --apply to import.');
    console.log('Import/inspection/export does not authorize reuse. Query recipient status --sync --json.');
    if(result.acceptance)console.log(`Acceptance: ${result.acceptance}; only explicit CI authentication verifies a signer.`);
    if(result.proposed_acceptance&&!result.apply)console.log('CI acceptance preview only; no verifier executed or new trust granted.');
    if(result.limitation)console.log(result.limitation);
  }
  return result;
}
