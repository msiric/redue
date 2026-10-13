// Engineering-only entry/ABI observation under exact public k0d source with a
// STRICTER writable scope than the native canary proposal. Never Claude/Bun,
// compiler, credentials, imported evidence, a seal or native-agent acceptance.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture,verifySealedTypeScriptSyntheticFixture} from './acceptance/sealed-typescript-synthetic-fixture.mjs';
import {buildSealedTypeScriptNativeAssets} from './acceptance/sealed-typescript-native-assets-build.mjs';
import {prepareClaude187GeneratorProposal} from './acceptance/portable-claude-generator-proposal.mjs';
import {parsePortableJson} from '../src/portable-envelope.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),guard=c=>{if(!c)throw Error('ENGINEERING_EXCHANGE_UNKNOWN');};
const fileMark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const directoryMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,directoryMark(s)]);if(at===path.dirname(at))return rows;}}
function directoryBinding(file){guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return JSON.stringify([directoryMark(s),parents(file)]);}
function fileBinding(file,pin,owner,limit){
 guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
 const lineage=parents(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
 try{guard(fileMark(fs.fstatSync(fd,{bigint:true}))===fileMark(s));const b=Buffer.alloc(65536),h=createHash('sha256');let at=0;while(at<Number(s.size)){const asked=Math.min(b.length,Number(s.size)-at),n=fs.readSync(fd,b,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked);h.update(b.subarray(0,n));at+=n;}guard(h.digest('hex')===pin&&fileMark(fs.fstatSync(fd,{bigint:true}))===fileMark(s));}finally{fs.closeSync(fd);}
 guard(fileMark(fs.lstatSync(file,{bigint:true}))===fileMark(s)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return JSON.stringify([fileMark(s),lineage]);
}
const names=['synthetic_exchange_inventory_observed','workspace_atomic_exchange_and_restore_control','stage_parent_atomic_exchange_denied','stage_parent_identity_and_inventory_preserved','base_atomic_exchange_denied'];
function checkedOutput(value){
 const keys=['schema','scope','result','checks_passed','checks','nativeEnforcement','noInheritedWritableHandlesVerified','sealed','reuseEligible'];
 if(!value||Object.keys(value).sort().join(',')!==keys.sort().join(',')||value.schema!==1||value.scope!=='SYNTHETIC_STAGE_ATOMIC_EXCHANGE_PROBE_RESULTS'||!['UNKNOWN','FAIL'].includes(value.result)||value.checks_passed!==false||value.nativeEnforcement!=='NOT_ESTABLISHED'||value.noInheritedWritableHandlesVerified!==false||value.sealed!==false||value.reuseEligible!==false||!Array.isArray(value.checks)||value.checks.length!==5)return false;
 if(!value.checks.every((row,i)=>row&&Object.keys(row).sort().join(',')==='attempted,name,reason_code,result'&&row.name===names[i]&&typeof row.attempted==='boolean'))return false;
 const [initial,control,exchange,final,base]=value.checks;
 const ordinary={PASS:'FIXTURE_MATCHED',FAIL:'ASSERTION_FAILED',UNKNOWN:'UNKNOWN_OR_UNAVAILABLE'};
 const ordinaryRow=row=>Object.hasOwn(ordinary,row.result)&&row.reason_code===ordinary[row.result]&&row.attempted;
 const skipped=row=>row.result==='NOT_PERFORMED'&&row.reason_code==='UNKNOWN_OR_UNAVAILABLE'&&!row.attempted;
 if(!ordinaryRow(initial)||base.result!=='NOT_IMPLEMENTED'||base.reason_code!=='NOT_IMPLEMENTED'||base.attempted)return false;
 if(initial.result==='PASS'){
  if(!Object.hasOwn(ordinary,control.result)||!control.attempted||control.reason_code!==(control.result==='PASS'?'ATOMIC_EXCHANGE_AND_RESTORE_OBSERVED':ordinary[control.result]))return false;
 }else if(!skipped(control))return false;
 if(control.result==='PASS'){
  if(!ordinaryRow(final))return false;
  if(exchange.attempted){const mapping={PASS:'DENIED_PERMISSION_ERROR',FAIL:'ACCESS_SUCCEEDED',UNKNOWN:'UNKNOWN_OR_UNAVAILABLE'};if(!Object.hasOwn(mapping,exchange.result)||exchange.reason_code!==mapping[exchange.result])return false;}
  else if(!skipped(exchange)||final.result==='PASS')return false;
 }else if(!skipped(exchange)||!skipped(final))return false;
 return value.result===(value.checks.some(row=>row.result==='FAIL')?'FAIL':'UNKNOWN');
}
function latchOutput(report,bytes){
 // A later close/currentness/persistence failure cannot erase a strictly
 // validated failed assertion. No partial/duplicate/contradictory JSON is data.
 guard((typeof bytes==='string'||bytes instanceof Uint8Array)&&Buffer.byteLength(bytes)>0&&Buffer.byteLength(bytes)<=4096);
 const value=parsePortableJson(bytes);guard(checkedOutput(value));report.checks=value.checks;report.helperResult=value.result;report.assertionOutcome=value.result==='FAIL'?'FAIL':'UNKNOWN';return value;
}
function retainedDiagnostic(report,scope){return {scope,checks:report.checks,helperResult:report.helperResult,assertionOutcome:report.assertionOutcome,generation:report.generation,execution:report.execution,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false};}
const knownSignals=new Set(['SIGKILL','SIGTERM','SIGABRT','SIGSEGV','SIGBUS','SIGILL','SIGINT']);
function processReport(r){return {pidObserved:Number.isInteger(r.pid)&&r.pid>0,status:Number.isInteger(r.status)&&r.status>=0&&r.status<=255?r.status:null,signal:r.signal===null?null:knownSignals.has(r.signal)?r.signal:'UNKNOWN',spawnError:r.error?'UNKNOWN':'NONE',reaped:Number.isInteger(r.pid)&&r.pid>0&&!r.error&&((Number.isInteger(r.status)&&r.status>=0&&r.status<=255&&r.signal===null)||(r.status===null&&knownSignals.has(r.signal))),stdoutBytes:Buffer.byteLength(r.stdout??''),stderrBytes:Buffer.byteLength(r.stderr??'')};}

test('fixed fresh exchange helper entry under source-derived engineering view; all authority stays unknown',{
 skip:process.env.REDUE_ENGINEERING_EXCHANGE==='1'?false:'Reviewed engineering exchange not selected; no fixture/process'
},t=>{
 let report={schema:1,scope:'ENGINEERING_EXCHANGE_UNKNOWN',base:null,builds:[],generation:null,execution:null,checks:null,helperResult:null,assertionOutcome:'UNKNOWN',nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false},finished=false;
 try{
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  const bootstrap=createSealedTypeScriptCIBootstrap();if(typeof bootstrap.base==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(bootstrap.base))report.base=bootstrap.base;guard(bootstrap.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');const fixture=prepareSealedTypeScriptCISyntheticFixture(bootstrap);guard(fixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
  const built=buildSealedTypeScriptNativeAssets({fixture});report.builds=built.report.builds;guard(built.outcome==='ASSETS_BUILT_NOT_EXECUTED');const base=fixture.base,workspace=fixture.layout.workspace,stageParent=fixture.layout.stageParent;
  const node=base+'/runtime/node-v22.13.0-darwin-arm64/bin/node',exchange=base+'/prefix/native-probes/sealed-typescript-exchange-sentinel';const binary=built.report.binaries.find(row=>row.file===exchange);guard(binary);
  const nodePin=built.report.nodeSha256,wrapper='/usr/bin/sandbox-exec',wrapperPin='c7d6609ce2b87a538ffd0d92b6be7de64dbc919b6845cc16b92f7c57e2658fdf';
  const code=prepareClaude187GeneratorProposal({native:path.join(os.userInfo().homedir,'Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187/bin/claude')});
  const home=base+'/engineering-home';fs.mkdirSync(home,{mode:0o700});const codeFile=base+'/prefix/public-generator.js';fs.writeFileSync(codeFile,code.source,{mode:0o600,flag:'wx'});
  const directories=[base,fixture.layout.checkout,workspace,stageParent,home],directoryIdentities=directories.map(directoryBinding);
  const currentDirectories=()=>guard(JSON.stringify(directoryIdentities)===JSON.stringify(directories.map(directoryBinding)));
  const initial=[fileBinding(node,nodePin,process.getuid(),128*1024*1024),fileBinding(exchange,binary.sha256,process.getuid(),2*1024*1024),fileBinding(wrapper,wrapperPin,0,1024*1024),fileBinding(codeFile,code.sourceSha256,process.getuid(),65536)];
  const options={readConfig:{denyOnly:['/'],allowWithinDeny:[stageParent,workspace,node,exchange]},writeConfig:{allowOnly:[workspace],denyWithinAllow:[stageParent,base+'/prefix',base+'/runtime']},needsNetworkRestriction:true,allowUnixSockets:[],allowAllUnixSockets:false,allowLocalBinding:false,allowMachLookup:[],allowPty:false,allowGitConfig:false,enableWeakerNetworkIsolation:false,allowAppleEvents:false,logTag:'REDUE_ENGINEERING_EXCHANGE'};
  const child=`import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';try{const fd=fs.openSync(process.argv[1],fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let body;try{const s=fs.fstatSync(fd,{bigint:true});if(!s.isFile()||s.nlink!==1n||s.size<=0n||s.size>65536n)throw Error();const b=Buffer.alloc(Number(s.size));let at=0;while(at<b.length){const n=fs.readSync(fd,b,at,b.length-at,at);if(!Number.isInteger(n)||n<=0||n>b.length-at)throw Error();at+=n;}const e=fs.fstatSync(fd,{bigint:true});if(['dev','ino','size','mtimeNs','ctimeNs'].some(k=>s[k]!==e[k])||createHash('sha256').update(b).digest('hex')!==process.argv[2])throw Error();body=b.toString('utf8');}finally{fs.closeSync(fd);}const actual=createRequire(import.meta.url),allowed=new Set(['fs','path','os','child_process']),ctx=vm.createContext({process,require:n=>{if(!allowed.has(n))throw Error();return actual(n);}});const script=new vm.Script(body+';g2i();k0d('+JSON.stringify(${JSON.stringify(options)})+')');const profile=script.runInContext(ctx,{timeout:1000});if(typeof profile!=='string'||Buffer.byteLength(profile)>65536)throw Error();process.stdout.write(JSON.stringify({profile}));}catch{process.stdout.write('{"result":"UNKNOWN"}');process.exitCode=74;}`;
  currentDirectories();const gen=spawnSync(node,['--input-type=module','--eval',child,codeFile,code.sourceSha256],{cwd:fixture.layout.checkout,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:131072,killSignal:'SIGKILL'});report.generation=processReport(gen);guard(report.generation.reaped&&gen.status===0&&gen.signal===null&&gen.stderr==='');
  let value;try{value=JSON.parse(gen.stdout);}catch{guard(false);}guard(value&&Object.keys(value).join(',')==='profile'&&typeof value.profile==='string'&&Buffer.byteLength(value.profile)>0&&Buffer.byteLength(value.profile)<=65536&&!value.profile.includes('(allow network*)')&&value.profile.includes('(allow file-read* (literal "/"))')&&[stageParent,workspace,node,exchange].every(file=>value.profile.includes('(subpath '+JSON.stringify(file)+')')));report.profileSha256=sha(value.profile);
  guard(verifySealedTypeScriptSyntheticFixture(fixture).outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED');guard(JSON.stringify(initial)===JSON.stringify([fileBinding(node,nodePin,process.getuid(),128*1024*1024),fileBinding(exchange,binary.sha256,process.getuid(),2*1024*1024),fileBinding(wrapper,wrapperPin,0,1024*1024),fileBinding(codeFile,code.sourceSha256,process.getuid(),65536)]));
  currentDirectories();const result=spawnSync(wrapper,['-p',value.profile,exchange],{cwd:fixture.layout.checkout,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});report.execution=processReport(result);
  const output=latchOutput(report,result.stdout);guard(report.execution.reaped&&result.status===74&&result.signal===null&&result.stderr==='');currentDirectories();
  guard(JSON.stringify(initial)===JSON.stringify([fileBinding(node,nodePin,process.getuid(),128*1024*1024),fileBinding(exchange,binary.sha256,process.getuid(),2*1024*1024),fileBinding(wrapper,wrapperPin,0,1024*1024),fileBinding(codeFile,code.sourceSha256,process.getuid(),65536)]));
  guard(output.result==='UNKNOWN'&&output.checks.slice(0,4).every(row=>row.result==='PASS'&&row.attempted===true)&&output.checks[4].result==='NOT_IMPLEMENTED'&&output.checks[4].attempted===false&&output.checks.map(row=>row.reason_code).join(',')==='FIXTURE_MATCHED,ATOMIC_EXCHANGE_AND_RESTORE_OBSERVED,DENIED_PERMISSION_ERROR,FIXTURE_MATCHED,NOT_IMPLEMENTED');report.assertionOutcome='PASS_IMPLEMENTED_ROWS_ONLY';report.scope='ENGINEERING_IMPLEMENTED_EXCHANGE_ROWS_OBSERVED_NOT_NATIVE';finished=true;
  // Control swaps mutate writable-workspace metadata. Never revive the full
  // prep token or turn this intentionally UNKNOWN helper into a seal.
  report.postControlFixtureOutcome=verifySealedTypeScriptSyntheticFixture(fixture).outcome;
 }catch{/* Preserve bounded static UNKNOWN/FAIL rows, never raw error/profile. */}
 try{const directory=path.resolve('.local/portable-evidence'),s=fs.lstatSync(directory);guard(fs.realpathSync(directory)===directory&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid()&&(s.mode&0o22)===0);guard(report.base);const file=directory+'/engineering-exchange-'+path.basename(report.base)+'.json',body=JSON.stringify(report)+'\n';fs.writeFileSync(file,body,{mode:0o600,flag:'wx'});fileBinding(file,sha(body),process.getuid(),1024*1024);t.diagnostic(JSON.stringify({...retainedDiagnostic(report,report.scope),recordName:path.basename(file),sha256:sha(body),persistence:'SAVED_EXACT_BYTES'}));}catch{finished=false;t.diagnostic(JSON.stringify({...retainedDiagnostic(report,'ENGINEERING_EXCHANGE_RECORD_UNKNOWN'),persistence:'UNKNOWN'}));}
 // Fresh owned fixtures, compiled output and failed rows stay intact; no
 // recursive cleanup or reuse/adoption based on this serialized record.
 if(!finished)assert.fail('ENGINEERING_EXCHANGE_NOT_ESTABLISHED');
});

function sampleOutput(){return {schema:1,scope:'SYNTHETIC_STAGE_ATOMIC_EXCHANGE_PROBE_RESULTS',result:'UNKNOWN',checks_passed:false,checks:names.map((name,i)=>({name,result:i===4?'NOT_IMPLEMENTED':'PASS',reason_code:['FIXTURE_MATCHED','ATOMIC_EXCHANGE_AND_RESTORE_OBSERVED','DENIED_PERMISSION_ERROR','FIXTURE_MATCHED','NOT_IMPLEMENTED'][i],attempted:i!==4})),nativeEnforcement:'NOT_ESTABLISHED',noInheritedWritableHandlesVerified:false,sealed:false,reuseEligible:false};}
function failedOutput(){const value=sampleOutput();value.result='FAIL';value.checks[2]={...value.checks[2],result:'FAIL',reason_code:'ACCESS_SUCCEEDED'};return value;}

test('exchange output parser refuses forged green, additional fields and changed names',()=>{
 const value=sampleOutput();assert(checkedOutput(value));for(const other of [{...value,result:'PASS'},{...value,sealed:true},{...value,reuseEligible:true},{...value,private:'PRIVATE'},{...value,checks:[{...value.checks[0],name:'other'},...value.checks.slice(1)]}])assert(!checkedOutput(other));
 for(const status of [256,'PRIVATE',undefined])assert.equal(processReport({pid:1,status,signal:'SIGKILL',stdout:'',stderr:''}).reaped,false);assert.equal(processReport({pid:1,status:null,signal:'SIGKILL',stdout:'',stderr:''}).reaped,true);
});

test('exchange bounded strict parser refuses duplicate keys and contradictory emitter relations',()=>{
 const text=JSON.stringify(sampleOutput());for(const bytes of [text.replace('"schema":1','"schema":1,"schema":1'),text.replace('"result":"UNKNOWN"','"result":"FAIL","result":"UNKNOWN"'),text.replace('"attempted":true','"attempted":false,"attempted":true'),text+'x',Buffer.from([0xff]),' '.repeat(4097)])assert.throws(()=>latchOutput({},bytes));
 for(const mutate of [v=>v.result='FAIL',v=>v.checks[0].reason_code='ACCESS_SUCCEEDED',v=>v.checks[1].attempted=false,v=>v.checks[2].attempted=false,v=>v.checks[3].attempted=false,v=>v.checks[4].result='PASS',v=>{v.checks[2].result='FAIL';v.checks[2].reason_code='ACCESS_SUCCEEDED';}]){const value=sampleOutput();mutate(value);assert(!checkedOutput(value));}
 assert(checkedOutput(failedOutput()));
});

test('valid failed helper assertions survive later process, currentness and persistence uncertainty',()=>{
 for(const failure of ['STDERR','SIGNAL','CURRENTNESS','PERSISTENCE']){
  const report={checks:null,helperResult:null,assertionOutcome:'UNKNOWN',generation:null,execution:null};
  try{latchOutput(report,JSON.stringify(failedOutput()));if(failure==='STDERR')guard(false);else if(failure==='SIGNAL')guard(processReport({pid:1,status:null,signal:'SIGKILL',stdout:'',stderr:''}).status===74);else guard(false);}catch{}
  const result=retainedDiagnostic(report,'ENGINEERING_EXCHANGE_RECORD_UNKNOWN');assert.equal(result.assertionOutcome,'FAIL');assert.equal(result.helperResult,'FAIL');assert.equal(result.checks[2].reason_code,'ACCESS_SUCCEEDED');assert.equal(result.sealed,false);assert.equal(result.reuseEligible,false);
 }
 const report={checks:null,helperResult:null,assertionOutcome:'UNKNOWN'};assert.throws(()=>latchOutput(report,'{}'));assert.equal(report.assertionOutcome,'UNKNOWN');
});

test('strict output relations cover skipped and uncertain C emitter paths',()=>{
 for(const initial of ['FAIL','UNKNOWN']){
  const v=sampleOutput();v.result=initial==='FAIL'?'FAIL':'UNKNOWN';v.checks[0].result=initial;v.checks[0].reason_code=initial==='FAIL'?'ASSERTION_FAILED':'UNKNOWN_OR_UNAVAILABLE';for(const i of [1,2,3])v.checks[i]={name:names[i],result:'NOT_PERFORMED',reason_code:'UNKNOWN_OR_UNAVAILABLE',attempted:false};assert(checkedOutput(v));
  v.checks[2]={...v.checks[2],result:'PASS',reason_code:'DENIED_PERMISSION_ERROR',attempted:true};assert(!checkedOutput(v));
 }
 for(const state of ['FAIL','UNKNOWN']){
  const v=sampleOutput();v.result=state==='FAIL'?'FAIL':'UNKNOWN';v.checks[1].result=state;v.checks[1].reason_code=state==='FAIL'?'ASSERTION_FAILED':'UNKNOWN_OR_UNAVAILABLE';for(const i of [2,3])v.checks[i]={name:names[i],result:'NOT_PERFORMED',reason_code:'UNKNOWN_OR_UNAVAILABLE',attempted:false};assert(checkedOutput(v));
  const later=sampleOutput();later.result=v.result;later.checks[2]={name:names[2],result:'NOT_PERFORMED',reason_code:'UNKNOWN_OR_UNAVAILABLE',attempted:false};later.checks[3].result=state;later.checks[3].reason_code=v.checks[1].reason_code;assert(checkedOutput(later));
 }
});
