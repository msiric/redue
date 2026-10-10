// Explicit, read-only authentication preparation. This helper is never called by
// status or import and never installs or updates producer trust.
import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonical,parseEnvelope,parsePortableJson,PORTABLE_INTERPRETATION,
  PORTABLE_LIMITS,PortableEnvelopeError} from './portable-envelope.mjs';

export const CI_PREDICATE_TYPE='https://redue.dev/attestation/portable-evidence-artifact/v1';
export const CI_POLICY_INTERPRETATION='redue-github-ci-trust@1';
const RESULT_TYPE='application/vnd.dev.sigstore.verificationresult+json;version=0.1';
const HEX=/^[a-f0-9]{64}$/,COMMIT=/^[a-f0-9]{40}$/;
const fail=(code,message)=>{throw new PortableEnvelopeError(code,message);};
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value,keys)=>plain(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const shape=(value,required,optional=[])=>plain(value)&&required.every(key=>Object.hasOwn(value,key))&&
  Object.keys(value).every(key=>[...required,...optional].includes(key));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const text=value=>typeof value==='string'&&value.length<=4096&&!/[\u0000-\u001f\u007f]/u.test(value);
const sameStat=(a,b)=>['dev','ino','size','mtimeNs','ctimeNs'].every(key=>a[key]===b[key]);
function localBytes(file,limit){
  if(typeof file!=='string'||!path.isAbsolute(file))fail('PORTABLE_CI_FILE','Select a local absolute artifact path');
  let descriptor;
  try{
    const before=fs.lstatSync(file,{bigint:true});
    if(!before.isFile()||before.isSymbolicLink()||before.size>BigInt(limit))
      fail('PORTABLE_CI_FILE','Attestation input must be a bounded regular file');
    descriptor=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0));
    const opened=fs.fstatSync(descriptor,{bigint:true});
    if(!sameStat(before,opened))fail('PORTABLE_CI_CHANGED','Attestation input changed while opening');
    const bytes=Buffer.alloc(Number(opened.size)),read=fs.readSync(descriptor,bytes,0,bytes.length,0);
    if(read!==bytes.length||!sameStat(opened,fs.fstatSync(descriptor,{bigint:true}))||
      !sameStat(opened,fs.lstatSync(file,{bigint:true})))
      fail('PORTABLE_CI_CHANGED','Attestation input changed while reading');
    return bytes;
  }catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail('PORTABLE_CI_FILE','Attestation input could not be read');}
  finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
}
export function validateCIPolicy(value){
  const policy=parsePortableJson(canonical(value));
  if(!exact(policy,['schema','interpretation','issuer','repository','repositoryId','ownerId','workflow','ref',
    'sourceCommit','signerCommit','artifactSha256','evidenceDigest','evidenceInterpretation','refresh','bundleSha256'])||
    policy.schema!==1||policy.interpretation!==CI_POLICY_INTERPRETATION||
    policy.issuer!=='https://token.actions.githubusercontent.com'||
    typeof policy.repository!=='string'||!/^[-a-zA-Z0-9_]+\/[-a-zA-Z0-9_.]+$/.test(policy.repository)||
    !/^\d{1,20}$/.test(policy.repositoryId)||typeof policy.repositoryId!=='string'||
    !/^\d{1,20}$/.test(policy.ownerId)||typeof policy.ownerId!=='string'||
    typeof policy.workflow!=='string'||!/^\.github\/workflows\/[-a-zA-Z0-9_]+\.ya?ml$/.test(policy.workflow)||
    typeof policy.ref!=='string'||!/^refs\/heads\/[-a-zA-Z0-9_./]+$/.test(policy.ref)||
    policy.ref.includes('..')||policy.ref.includes('//')||policy.ref.endsWith('/')||
    !COMMIT.test(policy.sourceCommit)||typeof policy.sourceCommit!=='string'||
    !COMMIT.test(policy.signerCommit)||typeof policy.signerCommit!=='string'||
    !HEX.test(policy.artifactSha256)||typeof policy.artifactSha256!=='string'||
    !HEX.test(policy.evidenceDigest)||typeof policy.evidenceDigest!=='string'||
    policy.evidenceInterpretation!==PORTABLE_INTERPRETATION||
    !['required','offline-identified'].includes(policy.refresh)||
    (policy.refresh==='required'?policy.bundleSha256!==null:
      typeof policy.bundleSha256!=='string'||!HEX.test(policy.bundleSha256)))
    fail('PORTABLE_CI_POLICY','Unsupported or incomplete locally approved CI policy');
  return Object.freeze(policy);
}
export function ciVerifyArguments({artifactFile,policy,bundleFile=null}){
  policy=validateCIPolicy(policy);
  if(typeof artifactFile!=='string'||!path.isAbsolute(artifactFile))fail('PORTABLE_CI_FILE','Select a local absolute artifact path');
  if(policy.refresh==='required'&&bundleFile!==null)
    fail('PORTABLE_CI_REFRESH','A required-refresh policy cannot use an offline attestation bundle');
  if(policy.refresh==='offline-identified'&&(typeof bundleFile!=='string'||!path.isAbsolute(bundleFile)||!bundleFile.endsWith('.json')))
    fail('PORTABLE_CI_REFRESH','Offline identification requires one explicit local JSON bundle');
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  return Object.freeze(['attestation','verify',artifactFile,'--hostname','github.com','--repo',policy.repository,
    '--cert-identity',san,'--cert-oidc-issuer',policy.issuer,'--source-ref',policy.ref,
    '--source-digest',policy.sourceCommit,'--signer-digest',policy.signerCommit,
    '--deny-self-hosted-runners','--predicate-type',CI_PREDICATE_TYPE,'--digest-alg','sha256',
    '--limit','4','--format','json',...(bundleFile===null?[]:['--bundle',bundleFile])]);
}
const CERTIFICATE_KEYS=['certificateIssuer','subjectAlternativeName','issuer','githubWorkflowTrigger','githubWorkflowSHA',
  'githubWorkflowName','githubWorkflowRepository','githubWorkflowRef','buildSignerURI','buildSignerDigest',
  'runnerEnvironment','sourceRepositoryURI','sourceRepositoryDigest','sourceRepositoryRef','sourceRepositoryIdentifier',
  'sourceRepositoryOwnerURI','sourceRepositoryOwnerIdentifier','buildConfigURI','buildConfigDigest','buildTrigger',
  'runInvocationURI','sourceRepositoryVisibilityAtSigning'];
function verifiedOutput(bytes,policy,envelope){
  const output=parsePortableJson(bytes);
  if(!Array.isArray(output)||output.length<1||output.length>4)fail('PORTABLE_CI_OUTPUT','Unsupported attestation verification output');
  const san=`https://github.com/${policy.repository}/${policy.workflow}@${policy.ref}`;
  for(const item of output){
    if(!exact(item,['attestation','verificationResult'])||!exact(item.attestation,['bundle','bundle_url'])||
      !plain(item.attestation.bundle)||!text(item.attestation.bundle_url))
      fail('PORTABLE_CI_OUTPUT','Unsupported attestation verification entry');
    const result=item.verificationResult;
    if(!shape(result,['mediaType','statement','signature','verifiedTimestamps'],['verifiedIdentity'])||result.mediaType!==RESULT_TYPE||
      !exact(result.signature,['certificate']))fail('PORTABLE_CI_OUTPUT','Unsupported signature verification result');
    const cert=result.signature.certificate;
    if(!plain(cert)||!Object.keys(cert).every(key=>CERTIFICATE_KEYS.includes(key))||
      !Object.values(cert).every(text))fail('PORTABLE_CI_OUTPUT','Unsupported authenticated certificate fields');
    const expected={issuer:policy.issuer,subjectAlternativeName:san,buildSignerURI:san,buildSignerDigest:policy.signerCommit,
      runnerEnvironment:'github-hosted',sourceRepositoryURI:`https://github.com/${policy.repository}`,
      sourceRepositoryDigest:policy.sourceCommit,sourceRepositoryRef:policy.ref,sourceRepositoryIdentifier:policy.repositoryId,
      sourceRepositoryOwnerURI:`https://github.com/${policy.repository.split('/')[0]}`,
      sourceRepositoryOwnerIdentifier:policy.ownerId,sourceRepositoryVisibilityAtSigning:'public'};
    if(Object.entries(expected).some(([key,value])=>cert[key]!==value)||
      !['push','workflow_dispatch'].includes(cert.buildTrigger))
      fail('PORTABLE_CI_IDENTITY','Authenticated producer identity does not match the local policy');
    if(!Array.isArray(result.verifiedTimestamps)||result.verifiedTimestamps.length<1||result.verifiedTimestamps.length>8||
      result.verifiedTimestamps.some(stamp=>!exact(stamp,['type','uri','timestamp'])||
        !['Tlog','TimestampAuthority'].includes(stamp.type)||!text(stamp.uri)||!stamp.uri.startsWith('https://')||
        !text(stamp.timestamp)||!Number.isFinite(Date.parse(stamp.timestamp))))
      fail('PORTABLE_CI_OUTPUT','Authenticated timestamp evidence is missing or unsupported');
    const statement=result.statement;
    if(!exact(statement,['_type','subject','predicateType','predicate'])||statement._type!=='https://in-toto.io/Statement/v1'||
      statement.predicateType!==CI_PREDICATE_TYPE||!Array.isArray(statement.subject)||statement.subject.length!==1||
      !exact(statement.subject[0],['name','digest'])||statement.subject[0].name!=='redue-portable-evidence.json'||
      !exact(statement.subject[0].digest,['sha256'])||statement.subject[0].digest.sha256!==policy.artifactSha256)
      fail('PORTABLE_CI_SUBJECT','Authenticated artifact subject does not match the exact local bytes');
    const predicate=statement.predicate;
    if(!exact(predicate,['schema','evidenceDigest','evidenceInterpretation'])||predicate.schema!==1||
      predicate.evidenceDigest!==envelope.digest||predicate.evidenceInterpretation!==policy.evidenceInterpretation)
      fail('PORTABLE_CI_RECIPE','Authenticated predicate does not bind the selected REDUE interpretation');
  }
  return output.length;
}
export function verifyCIArtifact({artifactFile,policy,bundleFile=null,ghExecutable}){
  policy=validateCIPolicy(policy);
  const argv=ciVerifyArguments({artifactFile,policy,bundleFile});
  const before=localBytes(artifactFile,PORTABLE_LIMITS.bytes),envelope=parseEnvelope(before);
  if(sha256(before)!==policy.artifactSha256||envelope.digest!==policy.evidenceDigest)
    fail('PORTABLE_CI_SUBJECT','Selected artifact does not match the locally approved exact digest');
  let bundleBefore=null;
  if(bundleFile!==null){bundleBefore=localBytes(bundleFile,1024*1024);
    if(sha256(bundleBefore)!==policy.bundleSha256)fail('PORTABLE_CI_SUBJECT','Offline attestation bundle digest differs from the local policy');}
  // The executable is selected locally, never from artifact fields. Its reviewed
  // installation is a prerequisite, just as for the existing local CLI tools.
  if(typeof ghExecutable!=='string'||!path.isAbsolute(ghExecutable))
    fail('PORTABLE_CI_TOOL','Select the reviewed local GitHub CLI executable');
  const options={encoding:'utf8',timeout:30000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe'],windowsHide:true};
  let output;
  try{
    const version=childProcess.execFileSync(ghExecutable,['--version'],{...options,timeout:5000});
    if(!/^gh version 2\.79\.0(?:\s|$)/.test(version))fail('PORTABLE_CI_TOOL','GitHub CLI output contract requires reviewed version 2.79.0');
    output=childProcess.execFileSync(ghExecutable,argv,options);
  }catch(error){if(error instanceof PortableEnvelopeError)throw error;
    fail(policy.refresh==='required'?'PORTABLE_CI_REFRESH':'PORTABLE_CI_VERIFY',
      'Attestation authentication could not complete; no producer acceptance was granted');}
  const count=verifiedOutput(output,policy,envelope);
  if(!before.equals(localBytes(artifactFile,PORTABLE_LIMITS.bytes))||
    bundleBefore&&!bundleBefore.equals(localBytes(bundleFile,1024*1024)))
    fail('PORTABLE_CI_CHANGED','Attestation inputs changed during authentication');
  return Object.freeze({schema:1,verification:'github-cli-2.79@1',producer_verified:true,
    producer_accepted:false,reuse_eligible:false,evidenceDigest:envelope.digest,artifactSha256:policy.artifactSha256,
    policyDigest:sha256(canonical(policy)),repository:policy.repository,workflow:policy.workflow,
    ref:policy.ref,sourceCommit:policy.sourceCommit,signerCommit:policy.signerCommit,verifiedAttestations:count,
    refresh:policy.refresh,globally_latest:false,
    limitation:policy.refresh==='required'?'Explicit attestation lookup completed; this does not establish globally latest evidence or recipient applicability.':
      'An explicitly identified offline bundle was verified; remote revocation or newer evidence was not queried.'});
}
