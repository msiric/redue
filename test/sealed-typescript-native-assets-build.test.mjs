// Fixed local engineering build only; no native agent, checker, compiler check,
// model or receipt. Default tests never compile or create a fixture.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash,randomBytes} from 'node:crypto';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture} from './acceptance/sealed-typescript-synthetic-fixture.mjs';
import {buildSealedTypeScriptNativeAssets,sealedAssetsBuildCompleted as completed,sealedAssetsBuildProcessSummary as processSummary} from './acceptance/sealed-typescript-native-assets-build.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),guard=(condition)=>{if(!condition)throw Error('BUILD_PRECONDITION_UNKNOWN');};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function bounded(file,owner,limit,pin=null){
  guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true});guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
  const lineage=parents(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);let digest,arm64Header=false;
  try{guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));const h=createHash('sha256'),b=Buffer.alloc(65536);let at=0;while(at<Number(s.size)){const asked=Math.min(b.length,Number(s.size)-at),n=fs.readSync(fd,b,0,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked);if(at===0&&n>=12)arm64Header=b.readUInt32LE(0)===0xfeedfacf&&b.readUInt32LE(4)===0x0100000c;h.update(b.subarray(0,n));at+=n;}digest=h.digest('hex');guard(!pin||digest===pin);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));}finally{fs.closeSync(fd);}
  guard(mark(fs.lstatSync(file,{bigint:true}))===mark(s)&&JSON.stringify(parents(file))===JSON.stringify(lineage));return {file,owner,limit,digest,mark:mark(s),lineage,arm64Header};
}
function current(row){const after=bounded(row.file,row.owner,row.limit,row.digest);guard(after.mark===row.mark&&JSON.stringify(after.lineage)===JSON.stringify(row.lineage));}
test('fixed reviewed C helpers build in fresh owned fixture; built assets are not native/seal authority',{
 skip:process.env.REDUE_SYNTHETIC_ASSETS_BUILD==='1'?false:'Reviewed engineering build not selected; no process or fixture'
},t=>{
 let result;try{
 // Preserve original runtime admission before constructing the opt-in fixture;
 // reusable leaf independently rechecks it for its live-fixture caller.
 guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
 const node=path.join(os.userInfo().homedir,'.nvm/versions/node/v22.13.0/bin/node');guard(process.execPath===node);
 bounded(node,process.getuid(),128*1024*1024,'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc');
 const bootstrap=createSealedTypeScriptCIBootstrap();
 const fixture=bootstrap.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED'?prepareSealedTypeScriptCISyntheticFixture(bootstrap):null;
 result=buildSealedTypeScriptNativeAssets({fixture});
 }catch{result={outcome:'UNKNOWN',report:{schema:1,scope:'LOCAL_SYNTHETIC_ASSETS_BUILD_UNKNOWN',base:null,builds:[],compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false}};}
 const observations=result.report.builds,ownerReport=result.report;let finished=result.outcome==='ASSETS_BUILT_NOT_EXECUTED';
 t.diagnostic(JSON.stringify(finished?{scope:ownerReport.scope,builds:observations,baseSha256:sha(ownerReport.base),binaries:ownerReport.binaries.map(row=>row.sha256),compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false}:{scope:'LOCAL_SYNTHETIC_ASSETS_BUILD_UNKNOWN',builds:observations,ownedFixture:'PRESERVED_NOT_ADOPTABLE_FROM_RECORD',compilerCheckExecutions:0,nativeAgentLaunches:0,models:0,sealed:false,reuseEligible:false}));
 try{const reportDir=path.resolve('.local/portable-evidence');guard(fs.realpathSync(reportDir)===reportDir);const directory=fs.lstatSync(reportDir);guard(directory.isDirectory()&&!directory.isSymbolicLink()&&directory.uid===process.getuid()&&(directory.mode&0o22)===0);const stem=ownerReport.base?path.basename(ownerReport.base):'no-fixture-'+randomBytes(4).toString('hex');const reportFile=reportDir+'/synthetic-assets-build-'+stem+'.json';const body=JSON.stringify({...ownerReport,fixtureTokenSerialized:false,recordAdoptionAuthority:false})+'\n';fs.writeFileSync(reportFile,body,{mode:0o600,flag:'wx'});bounded(reportFile,process.getuid(),1024*1024,sha(body));t.diagnostic(JSON.stringify({scope:'OWNER_LOCAL_BUILD_RECORD',recordName:path.basename(reportFile),sha256:sha(body),saved:true,sealed:false,reuseEligible:false}));}catch{finished=false;t.diagnostic('{"scope":"OWNER_LOCAL_BUILD_RECORD","saved":false,"result":"UNKNOWN"}');}
 // No recursive cleanup, token serialization/adoption or use of compiled output.
 // A future route needs fresh minted fixtures and separately reviewed gates.
 if(!finished)assert.fail('SYNTHETIC_ASSETS_BUILD_UNKNOWN');
});

test('build completion is strict and diagnostics redact raw failures',()=>{
 assert(completed({pid:1,status:0,signal:null}));for(const r of [{pid:0,status:0,signal:null},{pid:1,status:0,signal:'SIGKILL'},{pid:1,status:null,signal:'SIGKILL'},{pid:1,status:256,signal:null},{pid:1,status:0,signal:null,error:Error('PRIVATE')}])assert(!completed(r));
 const r=processSummary({pid:1,status:'PRIVATE',signal:'PRIVATE_SIGNAL',error:Error('PRIVATE'),stdout:'',stderr:''});assert(!JSON.stringify(r).includes('PRIVATE'));assert.equal(r.completed,false);
});

// Injected author-leaf controls only; no compiler/toolchain or fixture launch.
const buildSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-assets-build.mjs',import.meta.url),'utf8');
function mockBuild(verify){let accesses=0,dispatches=0;const source=buildSource.replace(/^import .*;$/gm,'').replaceAll('export function ','function ');
 const run=Function('fs','path','os','createHash','spawnSync','verifySealedTypeScriptSyntheticFixture','prepareSealedTypeScriptNativeAssetsProposal','process',source+'\nreturn buildSealedTypeScriptNativeAssets;')(
 {...fs,realpathSync(){accesses++;throw Error('UNEXPECTED');}},path,os,createHash,()=>{dispatches++;throw Error('UNEXPECTED');},verify,()=>{throw Error('UNEXPECTED');},process);
 return {run,counters:()=>({accesses,dispatches})};}
test('new reusable leaf accepts only one data fixture option and has no imported build surface',()=>{const mock=mockBuild(()=>{throw Error('UNEXPECTED');});for(const options of [{fixture:null,flags:[]},{fixture:null,env:{}},{fixture:null,executable:'/other'},{fixture:null,source:'CODE'},{fixture:null,[Symbol()]:true},Object.create(null)])assert.throws(()=>mock.run(options),error=>error.code==='BUILD_OPTIONS'&&error.message==='BUILD_OPTIONS');const options={};Object.defineProperty(options,'fixture',{get(){throw Error('UNEXPECTED');}});assert.throws(()=>mock.run(options),error=>error.code==='BUILD_OPTIONS');assert.deepEqual(mock.counters(),{accesses:0,dispatches:0});});
test('unminted or wrong-scope fixture launches zero builds and returns immutable UNKNOWN data',()=>{for(const observed of [{outcome:'UNKNOWN'},{outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',scope:'OWNED_SYNTHETIC_FIXTURE_MECHANICS_ONLY',receiverBasePolicyMatch:false}]){const mock=mockBuild(()=>observed),value=mock.run({fixture:{base:'/NONSECRET-label'}});assert.equal(value.outcome,'UNKNOWN');assert.equal(value.report.base,null);assert.deepEqual(value.report.builds,[]);assert(Object.isFrozen(value.report));assert.deepEqual(value.commands,[]);assert.equal(value.nativeAgentLaunches,0);assert.equal(value.sealed,false);assert.equal(value.reuseEligible,false);assert.deepEqual(mock.counters(),{accesses:0,dispatches:0});}});
test('build procedure stays fixed and retains full boundary validations and child caps',()=>{assert(buildSource.includes('timeout:5000,maxBuffer:4096'));assert(buildSource.includes("killSignal:'SIGKILL'"));assert(buildSource.includes('current(linker)'));assert(buildSource.includes('for(const row of [runtime,compiler,linker,...headers,...sources,copied,...artifacts])current(row)'));assert(buildSource.includes('guard(binary.arm64Header)'));assert(!buildSource.includes('createSealedTypeScriptCIBootstrap'));assert(!buildSource.includes('rmSync'));assert(!buildSource.includes('execSync'));assert(buildSource.includes("argv,{cwd:base+'/prefix/native-probes',env:{TMPDIR:base}"));});
