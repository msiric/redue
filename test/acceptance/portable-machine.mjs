// Controlled two-machine CLI mechanics, not model adoption or CI authentication.
// The reviewed installed engine establishes applicability, never this manifest.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {parseEnvelope,parsePortableJson,canonical} from '../../src/portable-envelope.mjs';
import {readBoundedPortableFile} from '../../src/portable-command.mjs';
export const MACHINE_TRANSFER_LIMIT=2*1024*1024;
const sha=value=>createHash('sha256').update(value).digest('hex'),HEX=/^[a-f0-9]{64}$/;
const names=['manifest.json','redue-portable-evidence.json'];
export function machineOptions(args){
  const out={};assert.equal(args.length%2,0,'Options require explicit values');
  for(let i=0;i<args.length;i+=2){assert(['--role','--tarball','--sha256','--source','--output','--input','--controlled-accept-digest'].includes(args[i])&&
    args[i+1]&&!Object.hasOwn(out,args[i]),'Unknown, repeated or missing option');out[args[i]]=args[i+1];}
  assert(['producer','receiver'].includes(out['--role']));assert(HEX.test(out['--sha256']||''));
  assert(/^[a-f0-9]{40}$/.test(out['--source']||''));
  for(const key of ['--tarball',out['--role']==='producer'?'--output':'--input'])assert(path.isAbsolute(out[key]||''),'Absolute owned paths required');
  if(out['--role']==='receiver')assert(HEX.test(out['--controlled-accept-digest']||''),'Receiver requires explicit controlled digest acceptance');
  else assert(!out['--controlled-accept-digest']&&!out['--input'],'Producer cannot accept imports');
  if(out['--role']==='receiver')assert(!out['--output'],'Receiver cannot export producer data');
  return out;
}
export function readMachineTransfer(directory,{source,packageSha256}={}){
  assert.equal(fs.realpathSync(directory),directory,'No aliased transfer directory');
  assert.deepEqual(fs.readdirSync(directory).sort(),names,'Only the fixed envelope and identity manifest travel');
  const evidence=readBoundedPortableFile(path.join(directory,names[1])),manifestBytes=readBoundedPortableFile(path.join(directory,names[0]));
  assert(evidence.length<=1024*1024,'Evidence exceeds its signing subject bound');
  assert(evidence.length+manifestBytes.length<=MACHINE_TRANSFER_LIMIT,'Transfer exceeds its reserved payload budget');
  assert(manifestBytes.length<=16384,'Identity manifest exceeds its bound');
  const manifest=parsePortableJson(manifestBytes),envelope=parseEnvelope(evidence),p=envelope.statement.predicate;
  assert.deepEqual(Object.keys(manifest).sort(),['schema','source','package_sha256','evidence_sha256','evidence_digest',
    'origin_run_id','profile_digest','node_physical_identity','boot_identity','interpretation','profile','scope','package_filename'].sort());
  assert.equal(manifest.schema,1);assert.equal(manifest.source,source);assert.equal(manifest.package_sha256,packageSha256);
  for(const key of ['package_sha256','evidence_sha256','evidence_digest','profile_digest','node_physical_identity','boot_identity'])assert(HEX.test(manifest[key]));
  assert.equal(manifest.evidence_sha256,sha(evidence));assert.equal(manifest.evidence_digest,envelope.digest);
  assert.equal(manifest.origin_run_id,p.origin.runId);assert.equal(p.origin.complete,true);assert.equal(p.origin.result,'PASS');
  assert.equal(manifest.interpretation,p.interpretation);assert.equal(manifest.scope,'controlled-noLib-direct-typescript');
  assert.equal(path.basename(manifest.package_filename),manifest.package_filename);
  assert.equal(canonical(manifest.profile),canonical({platform:p.facts.platform,runtime:p.facts.runtime,compiler:p.facts.compiler}));
  assert.equal(manifest.profile_digest,sha(canonical(manifest.profile)));
  return {manifest,envelope,evidence,bytes:evidence.length+manifestBytes.length};
}
export function requireImportedEligibility(status,{digest,originRunId}){
  const check=status?.checks?.find(c=>c.name==='typecheck');
  assert.equal(status?.schema,1);assert.equal(status?.observation?.healthy,true);
  assert.equal(check?.freshness,'CURRENT');assert.equal(check?.result,'PASS');assert.equal(check?.reuse_eligible,true);
  assert.equal(check?.evidence_source,'imported');assert.equal(check?.invocation,null);
  assert.equal(check?.imported_evidence?.digest,digest);assert.equal(check?.imported_evidence?.origin_run_id,originRunId);
  return check;
}
function physicalIdentity(){const file=fs.realpathSync(process.execPath),stat=fs.statSync(file,{bigint:true});
  return sha(canonical({file,dev:String(stat.dev),ino:String(stat.ino),mtime:String(stat.mtimeNs)}));}
function bootIdentity(){const result=spawnSync('/usr/sbin/sysctl',['-n','kern.bootsessionuuid'],{encoding:'utf8',timeout:3000,maxBuffer:4096});
  assert.equal(result.status,0,'Boot boundary unavailable');assert(/^[a-fA-F0-9-]{36}$/.test(result.stdout.trim()));return sha(result.stdout.trim());}
function writeExclusive(file,content){const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  try{fs.writeFileSync(fd,content);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export async function runMachine(options){
  const role=options['--role'],source=options['--source'],tarball=options['--tarball'],expected=options['--sha256'],transfer=options[role==='producer'?'--output':'--input'];
  assert.equal(sha(readBoundedPortableFile(tarball)),expected,'Artifact mismatch: zero installation/check launches');
  assert.equal(process.platform,'darwin');assert.equal(process.arch,'arm64');assert.equal(process.version,'v22.13.0');
  assert.equal(os.release(),'25.6.0','Runner label alone does not establish reviewed runtime compatibility');
  assert.equal(fs.realpathSync(transfer),transfer);const transferStat=fs.lstatSync(transfer);
  assert(transferStat.isDirectory()&&transferStat.uid===process.getuid()&&(transferStat.mode&0o022)===0,'Transfer directory must be locally owned and not writable by others');
  const transferred=role==='receiver'?readMachineTransfer(transfer,{source,packageSha256:expected}):null;
  if(role==='producer')assert.deepEqual(fs.readdirSync(transfer),[],'Producer refuses an occupied output directory');
  const nodePhysical=physicalIdentity(),boot=bootIdentity();
  if(transferred){assert.equal(options['--controlled-accept-digest'],transferred.manifest.evidence_digest,'Controlled acceptance must match the inspected exact evidence');}
  if(process.env.GITHUB_SHA)assert.equal(source,process.env.GITHUB_SHA,'Candidate source must be this actual GitHub workflow commit');
  if(transferred)assert.notEqual(boot,transferred.manifest.boot_identity,'Two processes on one boot are not two machines');
  const base=fs.realpathSync(fs.mkdtempSync('/tmp/redue-machine-')),root=path.join(base,'Checkout 空间'),state=path.join(base,'state'),prefix=path.join(base,'prefix'),binary=path.join(prefix,'bin','redue');
  const observations=[],calls=[],put=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
  let started=false;
  function exec(argv,{cwd=base,allowFailure=false}={}){const before=performance.now(),result=spawnSync(argv[0],argv.slice(1),
    {cwd,env:process.env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
    calls.push({kind:argv[0]===binary?'redue':path.basename(argv[0]),args:argv[0]===binary?argv.slice(5).map(value=>path.isAbsolute(value)?'<owned-path>':value):[],milliseconds:performance.now()-before,status:result.status});
    if(!allowFailure)assert.equal(result.status,0,`Controlled command failed: ${result.error?.code||result.status}`);
    return result;}
  const cli=(...args)=>exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,...args],{cwd:root}),
    json=(...args)=>JSON.parse(cli(...args,'--json').stdout);
  function sync(step){const status=json('status','--sync');const c=status.checks.find(check=>check.name==='typecheck');
    observations.push({step,schema:status.schema,healthy:status.observation?.healthy,freshness:c?.freshness,result:c?.result,
      reuse_eligible:c?.reuse_eligible,reason_code:c?.reason_code??null,evidence_source:c?.evidence_source??null,
      imported_evidence:c?.imported_evidence??null,run_id:c?.invocation?.runId??null});return status;}
  try{
    exec(['npm','install','--global','--prefix',prefix,'--registry=https://registry.npmjs.org','--no-audit','--no-fund',tarball]);
    const installed=path.join(prefix,'lib/node_modules/@redue/cli');
    const metadata=JSON.parse(fs.readFileSync(path.join(installed,'package.json')));assert.equal(metadata.name,'@redue/cli');
    assert.deepEqual(metadata.bin,{redue:'./bin/redue.mjs'});exec([binary,'--help']);
    fs.mkdirSync(root);put('package.json',JSON.stringify({name:'portable-machine-control',version:'1.0.0',scripts:{typecheck:'tsc --noEmit'},devDependencies:{typescript:'5.6.3'}}));
    put('tsconfig.json',JSON.stringify({compilerOptions:{strict:true,noEmit:true,noLib:true,target:'ES2022',types:[],typeRoots:['./node_modules/@types']},include:['src']}));
    put('src/globals.d.ts','interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}\n');
    put('src/a.ts','export const value: number = 1;\n');put('.gitignore','node_modules/\n');
    exec(['npm','install','--registry=https://registry.npmjs.org','--no-audit','--no-fund'],{cwd:root});exec(['git','init','-q'],{cwd:root});
    const preview=json('init','--recipe','typescript-direct','--check','typecheck','--dry-run');
    assert.equal(preview.written,false);assert.equal(preview.checks[0].level,'ready');assert(!fs.existsSync(path.join(root,'redue.config.json')));
    cli('init','--recipe','typescript-direct','--check','typecheck');cli('start');started=true;
    let originRunId,digest,profile;
    if(role==='producer'){
      cli('run','typecheck','--portable');const baseline=sync('producer baseline'),selected=baseline.checks.find(c=>c.name==='typecheck');
      assert.equal(baseline.observation.healthy,true);assert.equal(selected.result,'PASS');assert.equal(selected.reuse_eligible,true);
      originRunId=selected.invocation.runId;const file=path.join(transfer,names[1]);
      const previewExport=json('evidence','export','typecheck','--output',file,'--dry-run');
      assert.equal(previewExport.origin.complete,true);assert.equal(previewExport.written,false);assert(!fs.existsSync(file));
      const exported=json('evidence','export','typecheck','--output',file);assert.equal(exported.origin.complete,true);digest=exported.digest;
      const evidence=readBoundedPortableFile(file),parsed=parseEnvelope(evidence),facts=parsed.statement.predicate.facts;
      profile={platform:facts.platform,runtime:facts.runtime,compiler:facts.compiler};
      const manifest={schema:1,source,package_sha256:expected,evidence_sha256:sha(evidence),evidence_digest:digest,
        origin_run_id:originRunId,profile_digest:sha(canonical(profile)),node_physical_identity:nodePhysical,boot_identity:boot,
        interpretation:parsed.statement.predicate.interpretation,profile,scope:'controlled-noLib-direct-typescript',package_filename:path.basename(tarball)};
      assert(evidence.length<=1024*1024);assert(evidence.length+Buffer.byteLength(canonical(manifest))+1<=MACHINE_TRANSFER_LIMIT);
      writeExclusive(path.join(transfer,names[0]),canonical(manifest)+'\n');readMachineTransfer(transfer,{source,packageSha256:expected});
    }else{
      ({origin_run_id:originRunId,evidence_digest:digest}=transferred.manifest);
      profile={platform:transferred.envelope.statement.predicate.facts.platform,runtime:transferred.envelope.statement.predicate.facts.runtime,
        compiler:transferred.envelope.statement.predicate.facts.compiler};
      // Explicit controlled-fixture acceptance, not authenticated CI producer trust.
      const args=['evidence','import',path.join(transfer,names[1]),'--check','typecheck','--accept-digest',digest];
      assert.equal(json(...args).apply,false);assert(!fs.existsSync(path.join(state,'portable-imports-v1.json')));
      assert.equal(json(...args,'--apply').producer_accepted,true);
      requireImportedEligibility(sync('recipient independent applicability'),{digest,originRunId});
      assert(!fs.existsSync(path.join(state,'runs-v1')),'Receiver must not create local execution evidence');
      assert.equal(json('status').checks[0].reuse_eligible,false,'Cached inspection is not caller authority');
      put('notes.md','Unrelated documentation.\n');requireImportedEligibility(sync('unrelated edit'),{digest,originRunId});
      cli('stop');started=false;cli('start');started=true;requireImportedEligibility(sync('restart inherited import'),{digest,originRunId});
      put('src/a.ts','export const value: number = 2;\n');let changed=sync('relevant edit').checks[0];
      assert.equal(changed.freshness,'STALE');assert.equal(changed.reuse_eligible,false);
      cli('stop');started=false;cli('start');started=true;changed=sync('restart with relevant edit').checks[0];
      assert.equal(changed.freshness,'STALE');assert.equal(changed.reuse_eligible,false);
      assert(!fs.existsSync(path.join(state,'runs-v1')));assert(calls.every(c=>c.kind!=='redue'||c.args[0]!=='run'));
    }
    return {schema:1,role,source,package_sha256:expected,metadata_version:metadata.version,unpublished_candidate:true,
      profile,node_physical_identity:nodePhysical,boot_identity:boot,
      independent_boot:role==='receiver'?boot!==transferred.manifest.boot_identity:null,
      raw_node_identity_differs:role==='receiver'?nodePhysical!==transferred.manifest.node_physical_identity:null,
      evidence_digest:digest,origin_run_id:originRunId,observations,calls,
      controlled_digest_acceptance:role==='receiver',authenticated_ci_producer:false,models_launched:0,
      equivalent_receiver_execution:role==='receiver'?false:null,
      scope:'controlled noLib mechanics; normal default-library external queries and useful-project acceptance not established'};
  }catch(error){error.machine_evidence={role,source,package_sha256:expected,observations,calls,models_launched:0};throw error;
  }finally{
    if(started)exec([binary,'--config',path.join(root,'redue.config.json'),'--state-dir',state,'stop'],{cwd:root,allowFailure:true});
    fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(await runMachine(machineOptions(process.argv.slice(2)))));}
  catch(error){console.error(JSON.stringify({schema:1,result:'FAILED_PRECONDITION_OR_ACCEPTANCE',code:error.code??'ASSERTION',
    message:error instanceof assert.AssertionError?'Controlled machine assertion failed':error.message,models_launched:0,
    actual_host:{platform:process.platform,arch:process.arch,node:process.version,release:os.release()},attempt:error.machine_evidence??null}));process.exitCode=1;}
}
