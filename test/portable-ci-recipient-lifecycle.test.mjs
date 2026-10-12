// Synthetic lifecycle/CLI responses only: no actual installation, authentication,
// compiler, native observer, hosted VM or model evidence is claimed here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {canonical,encodeEnvelope,PORTABLE_INTERPRETATION} from '../src/portable-envelope.mjs';
import {directEnvironment} from '../src/direct-typescript.mjs';
import {runCIMachineRecipient,withHeldCIMachineRecipient} from './acceptance/portable-ci-machine-recipient.mjs';
import {writeControlledPortableGuidance} from './acceptance/portable-controlled-guidance.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),owned={skip:typeof process.getuid!=='function'};
function fixture(t){
 const base=fs.realpathSync(fs.mkdtempSync('/tmp/redue-ci-recipient-')),data=fs.realpathSync(fs.mkdtempSync('/tmp/redue-ci-data-'));
 const root=path.join(base,'Checkout 空间'),state=path.join(base,'redue-state'),prefix=path.join(base,'prefix'),config=path.join(root,'redue.config.json'),cli=path.join(prefix,'lib/node_modules/@redue/cli/bin/redue.mjs');
 t.after(()=>{fs.rmSync(base,{recursive:true,force:true});fs.rmSync(data,{recursive:true,force:true});});
 // The profile branch is exercised through controlled host responses, not a
 // fabricated claim that this local test process is a matched macOS machine.
 for(const [key,value] of Object.entries({platform:'darwin',arch:'arm64',version:'v22.13.0'})){
  const descriptor=Object.getOwnPropertyDescriptor(process,key);Object.defineProperty(process,key,{...descriptor,value});t.after(()=>Object.defineProperty(process,key,descriptor));
 }
 t.mock.method(os,'release',()=> '25.6.0');
 const facts={schema:1,recipe:{interpretation:'npm-direct-typescript@1',script:'typecheck',command:['@node','@typescript-compiler:.','--noEmit'],definitionSha256:hash('recipe')},platform:{os:'darwin',arch:'arm64',release:'25.6.0'},runtime:{version:'v22.13.0',sha256:hash('runtime'),sharedObjects:[]},compiler:{version:'5.6.3',sha256:hash('compiler'),entry:'node_modules/typescript/lib/tsc.js'},context:{},files:[['src/a.ts',hash('file')]],discovery:{configs:[['tsconfig.json',hash('config')]],files:[['src/a.ts',hash('file')]],queriesSha256:hash('query')}};
 const envelope=encodeEnvelope({schema:1,interpretation:PORTABLE_INTERPRETATION,origin:{runId:randomUUID(),check:'typecheck',result:'PASS',complete:true,invocation:{status:'exited',exitCode:0,signal:null}},facts}),evidence=canonical(envelope),bundle='controlled bundle';
 const input=path.join(data,'input'),tar=path.join(data,'candidate.tgz'),gh=path.join(data,'gh'),registryFile=path.join(data,'registry.json');fs.mkdirSync(input,{mode:0o700});fs.writeFileSync(tar,'controlled tar');fs.writeFileSync(gh,'controlled gh');
 const profile={platform:facts.platform,runtime:facts.runtime,compiler:facts.compiler},manifest={schema:1,source:'1'.repeat(40),package_sha256:hash('controlled tar'),package_filename:'candidate.tgz',evidence_sha256:hash(evidence),evidence_digest:envelope.digest,bundle_sha256:hash(bundle),origin_run_id:envelope.statement.predicate.origin.runId,interpretation:PORTABLE_INTERPRETATION,scope:'controlled-noLib-direct-typescript',run_id:'123',run_attempt:'1',boot_identity:hash('producer boot'),node_physical_identity:hash('producer node'),profile,profile_digest:hash(canonical(profile))};
 fs.writeFileSync(path.join(input,'manifest.json'),canonical(manifest));fs.writeFileSync(path.join(input,'redue-portable-evidence.json'),evidence);fs.writeFileSync(path.join(input,'attestation-bundle.json'),bundle);
 const policy={schema:1,interpretation:'redue-github-ci-trust@1',issuer:'https://token.actions.githubusercontent.com',repository:'msiric/redue',repositoryId:'1403689333',ownerId:'26199969',workflow:'.github/workflows/portable-evidence.yml',ref:'refs/heads/main',sourceCommit:manifest.source,signerCommit:manifest.source,artifactSha256:hash(evidence),evidenceDigest:envelope.digest,evidenceInterpretation:PORTABLE_INTERPRETATION,refresh:'required',bundleSha256:null},registry=canonical({schema:1,interpretation:'redue-producer-policy-registry@1',revision:1,policies:[policy]});fs.writeFileSync(registryFile,registry,{mode:0o600});
 const options={'--base':base,'--tarball':tar,'--sha256':hash('controlled tar'),'--source':manifest.source,'--input':input,'--registry':registryFile,'--registry-sha256':hash(registry),'--policy-digest':hash(canonical(policy)),'--gh-executable':gh,'--gh-sha256':hash('controlled gh'),'--run':'123','--attempt':'1','--manifest-sha256':hash(canonical(manifest)),'--apply':true};
 const f={base,root,state,prefix,config,cli,registryFile,options,envelope,calls:[],events:[],running:false,imported:false,startCount:0,stopCount:0,statusCount:0,importedStatusCount:0,fault:null};
 const reply=value=>({status:0,stdout:typeof value==='string'?value:canonical(value),stderr:'',signal:null});
 function publicConfig(){return {schema:1,packageManager:'npm',checks:[{name:'typecheck',script:'typecheck',qualification:'npm-typescript-direct-v1',command:['@node','@typescript-compiler:.','--noEmit'],cwd:'.',inputs:['package.json','tsconfig.json','**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc}']}]};}
 function start(){
  f.running=true;f.startCount++;fs.mkdirSync(state,{mode:0o700,recursive:true});const selected=publicConfig().checks[0],compiler=path.join(root,'node_modules/typescript/lib/tsc.js'),probe=path.join(prefix,'lib/node_modules/@redue/cli/src/direct-typescript-probe.mjs');
  const runtimeFile=path.join(state,'project-runtime-v1.json');if(!fs.existsSync(runtimeFile))fs.writeFileSync(runtimeFile,canonical({schema:1,provider:'declared-project@1',root,state,checks:[{...selected,command:[process.execPath,compiler,'--noEmit'],qualificationInterpretation:'npm-direct-typescript@1',installedInputs:['node_modules/**'],allowedExternalRoots:[],environment:directEnvironment,probes:[[process.execPath,probe,root,'typecheck']]}]}));
  const ownerFile=path.join(state,'vstate-owner-v1.json');if(!fs.existsSync(ownerFile))fs.writeFileSync(ownerFile,canonical({schema:1,kind:'vstate-product-alpha',root,state,config:path.join(state,'project-runtime-v1.json')}));
 }
 t.mock.method(childProcess,'spawnSync',(file,args)=>{
  f.calls.push({file,args});
  if(file==='/bin/df')return reply('Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/disk3s1 1 1 1 1% /');
  if(file==='/usr/sbin/diskutil')return reply('controlled plist');
  if(file==='/usr/bin/plutil')return reply({FilesystemType:'apfs',Writable:true});
  if(file==='/usr/bin/sw_vers')return reply(args[0]==='-productVersion'?'26.6.2':'25G83');
  if(file==='npm'){
   if(args.includes('--global')){fs.mkdirSync(path.dirname(cli),{recursive:true});fs.writeFileSync(cli,'controlled CLI; never executed');const policy=path.join(prefix,'lib/node_modules/@redue/cli/src/agent-policy.md');fs.mkdirSync(path.dirname(policy),{recursive:true});fs.writeFileSync(policy,fs.readFileSync(new URL('../src/agent-policy.md',import.meta.url)));}
   else {const compiler=path.join(root,'node_modules/typescript/lib/tsc.js');fs.mkdirSync(path.dirname(compiler),{recursive:true});fs.writeFileSync(path.join(root,'node_modules/typescript/package.json'),canonical({name:'typescript',version:'5.6.3'}));fs.writeFileSync(compiler,'controlled compiler path; never executed');}
   return reply('');
  }
  if(file==='git'){fs.mkdirSync(path.join(root,'.git'),{mode:0o700});return reply('');}
  if(file===process.execPath&&args.includes('--input-type=module'))return reply({runtime:profile.runtime,boot:hash('receiver boot'),physical:hash('receiver node')});
  assert.equal(file,process.execPath);assert.equal(args[0],cli,'only owned installed CLI subprocesses may be requested');assert(!args.includes('run'),'no equivalent compiler command');
  const command=args[5];f.events.push(command);
  if(command==='init'){if(args.includes('--dry-run'))return reply({written:false,checks:[{level:f.fault==='setup'?'unsupported':'ready'}]});fs.writeFileSync(config,canonical(publicConfig()));return reply('');}
  if(command==='start'){start();return f.fault==='start'||f.fault==='restart'&&f.startCount===2?{status:1,stdout:'',stderr:'controlled start failure'}:reply('');}
  if(command==='stop'){f.stopCount++;if(f.fault==='cleanup')return {status:1,stdout:'',stderr:'controlled stop failure'};if(f.fault==='cleanup-soft-failure')return reply({ok:false,state:'observer_unavailable'});f.running=false;return reply({ok:true});}
  if(command==='evidence'){
   assert.equal(args[6],'import');if(!args.includes('--apply'))return reply({apply:false,producer_verified:false,producer_accepted:false,digest:envelope.digest});
   f.imported=true;return reply({producer_verified:true,producer_accepted:true,reuse_eligible:false,acceptance:'github-ci-v1',digest:envelope.digest});
  }
  assert.equal(command,'status');assert(f.running,'owned observer must still be alive');f.statusCount++;
  const row={name:'typecheck',freshness:'UNVERIFIED',result:null,invocation:null,reuse_eligible:false};
  if(f.imported){f.importedStatusCount++;const stale=fs.readFileSync(path.join(root,'src/a.ts'),'utf8').includes('= 2;');Object.assign(row,{freshness:stale?'STALE':'CURRENT',result:'PASS',reuse_eligible:!stale,evidence_source:'imported',imported_evidence:{digest:envelope.digest,origin_run_id:envelope.statement.predicate.origin.runId,result:'PASS',acceptance:'github-ci-v1'}});
   if(f.fault==='held-eligibility'&&f.importedStatusCount===2)row.reuse_eligible=false;
   if(f.fault==='local-run'&&f.importedStatusCount===2)fs.mkdirSync(path.join(state,'runs-v1'));
  }
  return reply({schema:1,observation:{healthy:true},checks:[row]});
 });return f;
}
const imports=f=>f.calls.filter(c=>c.args.includes('import'));
test('held phase awaits preparation before eligible baseline, exposes read-only status, and always stops',owned,async t=>{
 const f=fixture(t);let captured;
 const report=await withHeldCIMachineRecipient(f.options,{prepare:async paths=>{assert(f.running);assert(!f.imported);assert(fs.existsSync(paths.state));await Promise.resolve();fs.writeFileSync(path.join(paths.root,'AGENTS.md'),'Controlled instruction setup before baseline.\n');f.events.push('prepare-done');},supervise:async context=>{captured=context;assert(f.running);assert(f.imported);assert(Object.isFrozen(context));assert(Object.isFrozen(context.paths));assert.deepEqual(Object.keys(context).sort(),['baseline','paths','signal','status']);assert.equal(context.baseline.checks[0].imported_evidence.digest,f.envelope.digest);assert(!Object.hasOwn(context,'doctor'));assert(!fs.existsSync(path.join(context.paths.root,'notes.md')));assert(fs.readFileSync(path.join(context.paths.root,'src/a.ts'),'utf8').includes('= 1;'));await Promise.resolve();assert(f.running);assert.equal(context.status().checks[0].freshness,'CURRENT');return 'completed';}});
 assert.equal(report.supervision,'completed');assert.equal(report.preparation.models_launched,0);assert.equal(f.running,false);assert.equal(f.stopCount,1);assert(f.events.indexOf('start')<f.events.indexOf('prepare-done'));assert(f.events.indexOf('prepare-done')<f.events.indexOf('evidence'));assert(!fs.existsSync(path.join(f.state,'runs-v1')));
 const before=f.calls.length;assert.throws(()=>captured.status(),{code:'CI_MACHINE_CLOSED'});assert.equal(f.calls.length,before,'escaped status capability cannot launch after lifecycle ends');
});
test('preview invokes neither callback and performs zero subprocesses',owned,async t=>{const f=fixture(t);let callbacks=0;const options={...f.options};delete options['--apply'];const report=await withHeldCIMachineRecipient(options,{prepare:()=>callbacks++,supervise:()=>callbacks++});assert.equal(report.applied,false);assert.equal(callbacks,0);assert.equal(f.calls.length,0);assert.deepEqual(fs.readdirSync(f.base),[]);});
test('missing supervisor fails before any process or setup',async()=>{await assert.rejects(withHeldCIMachineRecipient({},{}),{code:'CI_MACHINE_SUPERVISOR'});});
for(const fault of ['prepare-error','replaced-config','changed-config','replaced-state','setup','start','held-eligibility','local-run','registry-change'])test(`held ${fault} failed gate never invokes supervisor`,owned,async t=>{
 const f=fixture(t);let supervised=0;f.fault=fault;
 const prepare=()=>{
  if(fault==='prepare-error')throw Object.assign(Error('Controlled preparation failure'),{code:'PREPARE_FAILED'});
  if(fault==='replaced-config'){const bytes=fs.readFileSync(f.config);fs.renameSync(f.config,f.config+'.original');fs.writeFileSync(f.config,bytes);}
  if(fault==='changed-config')fs.appendFileSync(f.config,' ');
  if(fault==='replaced-state'){fs.renameSync(f.state,f.state+'.old');fs.mkdirSync(f.state,{mode:0o700});}
  if(fault==='registry-change')fs.appendFileSync(f.registryFile,' ');
 };
 const codes={'prepare-error':'PREPARE_FAILED','replaced-config':'CI_MACHINE_PREPARATION_CHANGED','changed-config':'CI_MACHINE_PREPARATION_CHANGED','replaced-state':'CI_MACHINE_OWNERSHIP',setup:'CI_MACHINE_SETUP',start:'CI_MACHINE_COMMAND','held-eligibility':'ERR_ASSERTION','local-run':'CI_MACHINE_INVALIDATION','registry-change':'CI_MACHINE_REGISTRY'};
 await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare,supervise:()=>supervised++}),{code:codes[fault]});assert.equal(supervised,0);assert.equal(f.running,false);
 if(fault==='setup'){assert.equal(f.startCount,0);assert.equal(imports(f).length,0);}
 if(['prepare-error','replaced-config','changed-config','replaced-state','start','registry-change'].includes(fault)){assert.equal(f.startCount,1);assert.equal(f.stopCount,1);assert.equal(imports(f).length,0);}
});
for(const fault of ['exception','cancellation'])test(`supervisor ${fault} preserves failure and stops owned observer`,owned,async t=>{const f=fixture(t),error=Object.assign(Error('Controlled supervisor end'),{code:fault==='cancellation'?'ABORT_ERR':'SUPERVISOR_FAILED'});if(fault==='cancellation')error.name='AbortError';await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:async()=>{assert(f.running);await Promise.resolve();throw error;}}),e=>e===error);assert.equal(f.running,false);assert.equal(f.stopCount,1);assert(Array.isArray(error.machine_recipient_calls));});
test('failed cleanup does not report a successful closed held lifecycle',owned,async t=>{const f=fixture(t);await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:()=>{f.fault='cleanup';return 'completed';}}),{code:'CI_MACHINE_CLEANUP'});assert.equal(f.stopCount,1);});
test('legacy entrypoint retains unrelated/restart/stale checks and stops',owned,t=>{const f=fixture(t),report=runCIMachineRecipient(f.options);assert.equal(report.unrelated_reuse,true);assert.equal(report.restart_inherited,true);assert.equal(report.relevant_edit_stale,true);assert.equal(f.running,false);assert.equal(f.startCount,2);assert.equal(f.stopCount,2);assert(fs.existsSync(path.join(f.root,'notes.md')));assert(fs.readFileSync(path.join(f.root,'src/a.ts'),'utf8').includes('= 2;'));assert(!fs.existsSync(path.join(f.state,'runs-v1')));});
test('failed legacy restart still attempts cleanup of the owned start',owned,t=>{const f=fixture(t);f.fault='restart';assert.throws(()=>runCIMachineRecipient(f.options),{code:'CI_MACHINE_COMMAND'});assert.equal(f.running,false);assert.equal(f.startCount,2);assert.equal(f.stopCount,2);});

for(const fault of ['config','owner'])test(`held ${fault} replacement withdraws query capability without replaying old eligibility`,owned,async t=>{
 const f=fixture(t);let caught;await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:context=>{
  const file=fault==='config'?f.config:path.join(f.state,'vstate-owner-v1.json'),bytes=fs.readFileSync(file);fs.renameSync(file,file+'.old');fs.writeFileSync(file,bytes);const before=f.calls.length;
  try{context.status();}catch(error){caught=error;}assert.equal(caught?.code,fault==='config'?'CI_MACHINE_PREPARATION_CHANGED':'CI_MACHINE_OWNERSHIP');assert.equal(f.calls.length,before);
 }}),{code:fault==='config'?'CI_MACHINE_PREPARATION_CHANGED':'CI_MACHINE_OWNERSHIP'});assert.equal(f.running,false);assert.equal(f.stopCount,1);
});
test('changed CLI after supervision is never executed during cleanup',owned,async t=>{const f=fixture(t);await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:()=>fs.appendFileSync(f.cli,'replacement')}),{code:'CI_MACHINE_CLI_CHANGED'});assert.equal(f.stopCount,0);});
test('cleanup failure retains the original supervisor failure separately',owned,async t=>{const f=fixture(t),error=Object.assign(Error('Controlled supervised failure'),{code:'SUPERVISOR_FAILED'});await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:()=>{f.fault='cleanup';throw error;}}),e=>e===error&&e.cleanup_code==='CI_MACHINE_CLEANUP');assert.equal(f.stopCount,1);});

test('pre-aborted supervisor launches zero setup, import and callback processes',owned,async t=>{const f=fixture(t),controller=new AbortController();controller.abort();let calls=0;await assert.rejects(withHeldCIMachineRecipient(f.options,{signal:controller.signal,prepare:()=>calls++,supervise:()=>calls++}),{code:'CI_MACHINE_ABORTED'});assert.equal(calls,0);assert.equal(f.calls.length,0);assert.deepEqual(fs.readdirSync(f.base),[]);});
for(const timeoutMs of [0,-1,300001,Infinity,NaN,1.5])test(`invalid or above-approved supervisor bound ${timeoutMs} never launches setup`,async()=>{await assert.rejects(withHeldCIMachineRecipient({}, {timeoutMs,prepare:()=>{},supervise:()=>{}}),{code:'CI_MACHINE_SUPERVISOR'});});
test('never-settling preparation is bounded and stops initialized observer without import or supervisor',owned,async t=>{const f=fixture(t);t.mock.timers.enable({apis:['setTimeout']});let supervised=0,preparedSignal,entered;const ready=new Promise(resolve=>entered=resolve),work=withHeldCIMachineRecipient(f.options,{prepare:(_paths,{signal})=>{preparedSignal=signal;entered();return new Promise(()=>{});},supervise:()=>supervised++});await ready;t.mock.timers.tick(300000);await assert.rejects(work,{code:'CI_MACHINE_TIMEOUT'});assert.equal(preparedSignal.aborted,true);assert.equal(f.startCount,1);assert.equal(f.stopCount,1);assert.equal(f.running,false);assert.equal(supervised,0);assert.equal(imports(f).length,0);});
test('never-settling held supervisor expires, aborts and stops rather than reporting success',owned,async t=>{const f=fixture(t);t.mock.timers.enable({apis:['setTimeout']});let context,entered;const ready=new Promise(resolve=>entered=resolve),work=withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:value=>{context=value;assert(f.running);entered();return new Promise(()=>{});}});await ready;t.mock.timers.tick(300000);await assert.rejects(work,{code:'CI_MACHINE_TIMEOUT'});assert.equal(context.signal.aborted,true);assert.equal(f.running,false);assert.equal(f.stopCount,1);const before=f.calls.length;assert.throws(()=>context.status(),{code:'CI_MACHINE_TIMEOUT'});assert.equal(f.calls.length,before);});
test('caller cancellation during awaited supervisor stops its exact owned observer',owned,async t=>{const f=fixture(t),controller=new AbortController();let context;await assert.rejects(withHeldCIMachineRecipient(f.options,{signal:controller.signal,prepare:()=>{},supervise:value=>{context=value;controller.abort();return new Promise(()=>{});}}),{code:'CI_MACHINE_ABORTED'});assert.equal(context.signal.aborted,true);assert.equal(f.running,false);assert.equal(f.stopCount,1);});

test('caller cancellation in preparation stops initialized observer without import or supervisor',owned,async t=>{const f=fixture(t),controller=new AbortController();let supervised=0;await assert.rejects(withHeldCIMachineRecipient(f.options,{signal:controller.signal,prepare:()=>{controller.abort();return new Promise(()=>{});},supervise:()=>supervised++}),{code:'CI_MACHINE_ABORTED'});assert.equal(f.startCount,1);assert.equal(f.stopCount,1);assert.equal(f.running,false);assert.equal(supervised,0);assert.equal(imports(f).length,0);});
test('settled callback after the monotonic deadline cannot report success',owned,async t=>{const f=fixture(t);let now=performance.now();t.mock.method(performance,'now',()=>now);await assert.rejects(withHeldCIMachineRecipient(f.options,{timeoutMs:1000,prepare:()=>{},supervise:()=>{now+=1001;return 'late';}}),{code:'CI_MACHINE_TIMEOUT'});assert.equal(f.running,false);assert.equal(f.stopCount,1);});

test('successful stop exit with unavailable response is not a completed held cleanup',owned,async t=>{const f=fixture(t);await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:()=>{f.fault='cleanup-soft-failure';return 'completed';}}),{code:'CI_MACHINE_CLEANUP'});assert.equal(f.stopCount,1);});

for(const fault of ['changed','replaced','missing','symlink'])test(`held compiled-runtime ${fault} refuses before querying or importing new authority`,owned,async t=>{const f=fixture(t),code=['changed','replaced'].includes(fault)?'CI_MACHINE_RUNTIME_CHANGED':fault==='symlink'?'PORTABLE_FILE_UNSAFE':'PORTABLE_FILE_UNAVAILABLE';await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:context=>{
 const file=path.join(f.state,'project-runtime-v1.json'),bytes=fs.readFileSync(file);
 if(fault==='changed'){const value=JSON.parse(bytes);value.checks[0].command=[process.execPath,'unreviewed.js'];fs.writeFileSync(file,canonical(value));}
 if(fault==='replaced'){fs.renameSync(file,file+'.old');fs.writeFileSync(file,bytes);}
 if(fault==='missing')fs.unlinkSync(file);
 if(fault==='symlink'){fs.renameSync(file,file+'.old');fs.symlinkSync(file+'.old',file);}
 const before=f.calls.length;assert.throws(()=>context.status(),{code});assert.equal(f.calls.length,before);
 }}),{code});assert.equal(f.running,false);assert.equal(f.stopCount,1);});

for(const fault of ['config','runtime','owner','registry'])test(`final ${fault} authority mutation without query still fails supervision`,owned,async t=>{const f=fixture(t),file=fault==='config'?f.config:path.join(f.state,fault==='runtime'?'project-runtime-v1.json':fault==='owner'?'vstate-owner-v1.json':'portable-producers-v1.json'),code={config:'CI_MACHINE_PREPARATION_CHANGED',runtime:'CI_MACHINE_RUNTIME_CHANGED',owner:'CI_MACHINE_OWNERSHIP',registry:'CI_MACHINE_REGISTRY'}[fault];await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:()=>{const bytes=fs.readFileSync(file);fs.renameSync(file,file+'.old');fs.writeFileSync(file,bytes);return 'caught no exception';}}),{code});assert.equal(f.running,false);assert.equal(f.stopCount,1);});
test('caught and restored authority violation remains latched until owner ends lifecycle',owned,async t=>{const f=fixture(t);await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:context=>{const file=path.join(f.state,'project-runtime-v1.json');fs.renameSync(file,file+'.old');fs.copyFileSync(file+'.old',file);assert.throws(()=>context.status(),{code:'CI_MACHINE_RUNTIME_CHANGED'});fs.unlinkSync(file);fs.renameSync(file+'.old',file);const before=f.calls.length;assert.throws(()=>context.status(),{code:'CI_MACHINE_RUNTIME_CHANGED'});assert.equal(f.calls.length,before);return 'restored';}}),{code:'CI_MACHINE_RUNTIME_CHANGED'});assert.equal(f.running,false);});
test('legitimate relevant source edit can close supervision without claiming final CURRENT',owned,async t=>{const f=fixture(t),report=await withHeldCIMachineRecipient(f.options,{prepare:()=>{},supervise:context=>{fs.writeFileSync(path.join(f.root,'src/a.ts'),'export const value: number = 2;\n');assert.equal(context.status().checks[0].freshness,'STALE');return {freshness:'STALE'};}});assert.equal(report.prepared_eligible,true);assert.equal(report.supervision.freshness,'STALE');assert(!Object.hasOwn(report,'recipient_reuse_eligible'));assert.equal(f.running,false);});

test('deadline observed during final filesystem barrier cannot publish successful supervision',owned,async t=>{const f=fixture(t);let now=performance.now(),armed=false;t.mock.method(performance,'now',()=>now);const read=fs.readSync;t.mock.method(fs,'readSync',(...args)=>{const result=read(...args);if(armed){armed=false;now+=1001;}return result;});await assert.rejects(withHeldCIMachineRecipient(f.options,{timeoutMs:1000,prepare:()=>{},supervise:()=>{armed=true;return 'completed';}}),{code:'CI_MACHINE_TIMEOUT'});assert.equal(f.running,false);assert.equal(f.stopCount,1);});

// The real shared guidance writer executes on a controlled, nonexecuting CLI
// fixture. This checks lifecycle integration, not installed/native enforcement.
test('shared guidance writer uses actual initialized owner before eligible baseline',owned,async t=>{
 const f=fixture(t);let prepared=false;
 const report=await withHeldCIMachineRecipient(f.options,{prepare:paths=>{
  assert(f.running);assert.equal(f.imported,false);assert.equal(imports(f).length,0);
  const ownerFile=path.join(paths.state,'vstate-owner-v1.json'),before=fs.readFileSync(ownerFile),identity=fs.statSync(ownerFile).ino;
  const policyFile=path.join(paths.prefix,'lib/node_modules/@redue/cli/src/agent-policy.md');
  const opts={root:paths.root,state:paths.state,prefix:paths.prefix,policyFile,policySha256:hash(fs.readFileSync(policyFile)),hosts:['claude'],role:'receiver'};
  assert.equal(writeControlledPortableGuidance(opts).applied,false);
  assert.equal(writeControlledPortableGuidance({...opts,apply:true}).applied,true);
  assert(fs.readFileSync(path.join(paths.root,'CLAUDE.md'),'utf8').includes('REDUE_PORTABLE_AGENT.md'));
  assert(fs.readFileSync(ownerFile).equals(before));assert.equal(fs.statSync(ownerFile).ino,identity);
  f.events.push('shared-guidance');prepared=true;
 },supervise:context=>{assert(prepared);assert.equal(context.baseline.checks[0].freshness,'CURRENT');return 'controlled';}});
 assert.equal(report.supervision,'controlled');assert(f.events.indexOf('start')<f.events.indexOf('shared-guidance'));
 assert(f.events.indexOf('shared-guidance')<f.events.indexOf('evidence'));assert.equal(f.running,false);assert.equal(f.stopCount,1);
});
for(const fault of ['owner','runtime','local-run','local-receipt','import-selector','pending-import'])test(`preparation ${fault} cannot introduce authority/history before import`,owned,async t=>{
 const f=fixture(t);let supervised=0;
 const code={owner:'CI_MACHINE_OWNERSHIP',runtime:'CI_MACHINE_RUNTIME_CHANGED','local-run':'CI_RECIPIENT_LOCAL_EXECUTION','local-receipt':'CI_RECIPIENT_LOCAL_EXECUTION','import-selector':'CI_MACHINE_HISTORY','pending-import':'CI_RECIPIENT_OWNERSHIP'}[fault];
 await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:paths=>{
  if(fault==='owner'||fault==='runtime'){const file=path.join(paths.state,fault==='owner'?'vstate-owner-v1.json':'project-runtime-v1.json'),bytes=fs.readFileSync(file);fs.renameSync(file,file+'.old');fs.writeFileSync(file,bytes);}
  if(fault==='local-run'){fs.mkdirSync(path.join(paths.state,'runs-v1'));fs.writeFileSync(path.join(paths.state,'runs-v1','new.json'),'{}');}
  if(fault==='local-receipt')fs.writeFileSync(path.join(paths.state,'receipts-v1.json'),canonical({schema:1,checks:{typecheck:{}}}));
  if(fault==='import-selector')fs.writeFileSync(path.join(paths.state,'portable-imports-v1.json'),canonical({schema:1,records:[]}));
  if(fault==='pending-import')fs.writeFileSync(path.join(paths.state,'portable-import-pending-v1.json'),'{}');
 },supervise:()=>supervised++}),{code});
 assert.equal(supervised,0);assert.equal(imports(f).length,0);assert.equal(f.stopCount,1);assert.equal(f.running,false);
});
test('CLI replacement during preparation refuses execution and cannot claim observer cleanup',owned,async t=>{
 const f=fixture(t);let supervised=0;
 await assert.rejects(withHeldCIMachineRecipient(f.options,{prepare:()=>fs.appendFileSync(f.cli,' changed'),supervise:()=>supervised++}),error=>error.code==='CI_MACHINE_CLI_CHANGED'&&error.cleanup_code==='CI_MACHINE_CLI_CHANGED');
 assert.equal(supervised,0);assert.equal(imports(f).length,0);assert.equal(f.stopCount,0);assert.equal(f.running,true,'No unsafe fallback or reaping claim after CLI authority loss');
});
