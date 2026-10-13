// Fixed engineering build observation ONLY. No helper, native agent, compiler
// verification, imported evidence or model executes. Preserve owned data.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {prepareSealedTypeScriptBaseExchangePair} from './acceptance/sealed-typescript-base-exchange-pair.mjs';
import {createSealedTypeScriptCIBootstrap,prepareSealedTypeScriptCISyntheticFixture} from './acceptance/sealed-typescript-synthetic-fixture.mjs';
import {buildSealedTypeScriptBaseExchangeAssets} from './acceptance/sealed-typescript-base-exchange-assets.mjs';
import {prepareSealedTypeScriptBaseCollectorSource} from './acceptance/sealed-typescript-base-collector-source.mjs';
import {provisionSealedTypeScriptBaseCollectorCopies,verifySealedTypeScriptBaseCollectorCopies} from './acceptance/sealed-typescript-base-collector-copies.mjs';
const sha=body=>createHash('sha256').update(body).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const dirMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const guard=c=>{if(!c)throw Error('BASE_COLLECTOR_COPIES_OBSERVATION_UNKNOWN');};
function lineage(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());rows.push([at,dirMark(s)]);if(at===path.dirname(at))return rows;}}
function save(report){
 const dir=path.resolve('.local/portable-evidence'),s=fs.lstatSync(dir,{bigint:true});guard(fs.realpathSync(dir)===dir&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o22n)===0n);
 const ownedLabel=[report.hostBase,report.baseA,report.baseB].find(value=>typeof value==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(value));guard(ownedLabel);
 const file=dir+'/base-collector-copies-'+path.basename(ownedLabel)+'.json',bytes=Buffer.from(JSON.stringify(report)+'\n');guard(bytes.length<=65536);const before=lineage(file);
 fs.writeFileSync(file,bytes,{mode:0o600,flag:'wx'});const named=fs.lstatSync(file,{bigint:true});guard(named.isFile()&&!named.isSymbolicLink()&&named.uid===BigInt(process.getuid())&&named.nlink===1n&&(named.mode&0o7777n)===0o600n&&named.size===BigInt(bytes.length));
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);try{guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(named));const read=Buffer.alloc(bytes.length);let at=0;while(at<read.length){const asked=read.length-at,n=fs.readSync(fd,read,at,asked,at);guard(Number.isInteger(n)&&n>0&&n<=asked);at+=n;}guard(read.equals(bytes)&&mark(fs.fstatSync(fd,{bigint:true}))===mark(named));}finally{fs.closeSync(fd);}
 guard(mark(fs.lstatSync(file,{bigint:true}))===mark(named)&&JSON.stringify(lineage(file))===JSON.stringify(before));return {recordName:path.basename(file),sha256:sha(bytes)};
}
test('fresh builds and fixed H code copies only; no copied code/helper/native execution or authority',{
 skip:process.env.REDUE_BASE_COLLECTOR_COPIES==='1'?false:'Actual code-copy observation not selected; no fixture or process'
},t=>{
 let report={schema:1,scope:'BASE_COLLECTOR_COPIES_OBSERVATION_UNKNOWN',hostBase:null,baseA:null,baseB:null,pairOutcome:null,build:null,copies:null,currency:null,helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false},finished=false;
 try{
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid());
  const pair=prepareSealedTypeScriptBaseExchangePair();report.pairOutcome=pair.outcome;report.baseA=pair.baseA;report.baseB=pair.baseB;guard(pair.outcome==='BASE_EXCHANGE_PAIR_PREPARED');
  const host=createSealedTypeScriptCIBootstrap();if(typeof host.base==='string'&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(host.base))report.hostBase=host.base;guard(host.outcome==='CI_SYNTHETIC_BOOTSTRAP_PREPARED');const hostFixture=prepareSealedTypeScriptCISyntheticFixture(host);guard(hostFixture.outcome==='SYNTHETIC_FIXTURE_PREPARED');
  const result=buildSealedTypeScriptBaseExchangeAssets({pair,hostFixture});report.build=result;guard(result.outcome==='BUILT_NOT_EXECUTED');guard(result.dispatchAttemptCount===3&&result.dispatchResultCount===3&&result.observedProcessCount===3);
  guard(result.builds.every(row=>row.completed&&row.status===0&&row.signal===null&&row.spawnError==='NONE'));
  for(const name of ['sealed','reuseEligible'])guard(result[name]===false);guard(result.commands.length===0);
  const source=prepareSealedTypeScriptBaseCollectorSource(result);const copies=provisionSealedTypeScriptBaseCollectorCopies(source);report.copies=copies;guard(copies.outcome==='COLLECTOR_COPIES_OBSERVED_NOT_EXECUTED');guard(copies.fileCreateCount===4&&copies.directoryCreateCount===3);const currency=verifySealedTypeScriptBaseCollectorCopies(copies);report.currency=currency;guard(currency.outcome==='COLLECTOR_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED');guard(currency.hostBase===report.hostBase&&currency.baseA===report.baseA&&currency.baseB===report.baseB);guard(copies.sealed===false&&copies.reuseEligible===false);report.scope='LOCAL_FIXED_PUBLIC_COLLECTOR_COPIES_OBSERVED_NOT_EXECUTED';finished=true;
 }catch{/* Keep actual partial counters/static data; no raw exceptions. */}
 try{t.diagnostic(JSON.stringify({scope:report.scope,...save(report),outcome:report.copies?.outcome??report.build?.outcome??'UNKNOWN',dispatchAttemptCount:report.build?.dispatchAttemptCount??null,dispatchResultCount:report.build?.dispatchResultCount??null,observedProcessCount:report.build?.observedProcessCount??null,helperExecutions:0,nativeAgentLaunches:0,models:0,compilerCheckExecutions:0,sealed:false,reuseEligible:false,persistence:'SAVED_EXACT_BYTES'}));}catch{finished=false;t.diagnostic('{"scope":"BASE_COLLECTOR_COPIES_RECORD_UNKNOWN","persistence":"UNKNOWN","sealed":false,"reuseEligible":false}');}
 if(!finished)assert.fail('BASE_COLLECTOR_COPIES_OBSERVATION_UNKNOWN');
});
