// Fixed enclosure startup source adapter only. Deliberate bounded duplication
// of the reviewed stdio filesystem guards avoids a generic startup protocol.
// BEFORE retains full original enclosure validation. AFTER checks original
// capability identity and startup/control rows only, never retired pair/tool
// guards after intentional actors. No native authentication or interval proof.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {NATIVE_STDIO_STARTUP_BASIS,NATIVE_STDIO_CI_STARTUP_BASIS} from './sealed-typescript-native-stdio-startup.mjs';
import {sealedTypeScriptBaseExchangeAssetsMatchPair,sealedTypeScriptBaseExchangeAssetsMatchHostFixture,sealedTypeScriptBaseExchangeAssetsFixtureProfile} from './sealed-typescript-base-exchange-assets.mjs';
import {sealedTypeScriptPairedStageSourceMatchesDerivation} from './sealed-typescript-paired-stage-source.mjs';
import {sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation} from './sealed-typescript-fixed-campaign-enclosure-source.mjs';
import {sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource,verifySealedTypeScriptFixedCampaignEnclosureBuild} from './sealed-typescript-fixed-campaign-enclosure-build.mjs';
const minted=new WeakMap();
const fail=()=>{throw Error('NATIVE_ENCLOSURE_STARTUP_UNKNOWN');};
const guard=value=>{if(!value)fail();};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const result=fields=>freeze({schema:1,scope:'FIXED_NATIVE187_ENCLOSURE_STARTUP_SOURCE_DATA_ONLY',...fields,
 publicDataOnly:true,nativeAuthenticated:false,executionAuthority:'NONE',commands:[],compilerCheckExecutions:0,helperExecutions:0,nativeLaunches:0,models:0,
 nativeEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',controlledShellStartup:'NOT_EMPIRICALLY_OBSERVED',
 recordAdoptionAuthority:false,sealed:false,reuseEligible:false});

const FIXED_PATH='/usr/bin:/bin:/usr/sbin:/sbin';
const pathBytes=Buffer.from(FIXED_PATH.replaceAll(':','\n')+'\n');
const absentEnvironmentKeys=freeze(['PS1','MANPATH','BASH_ENV','ENV','TERM_PROGRAM']);
// Presence only: an empty MANPATH still selects path-helper's manpath branch.
// Do not access any environment value or invoke a property getter.
function environmentAbsent(){const descriptor=Object.getOwnPropertyDescriptor(process,'env');
 guard(descriptor&&Object.hasOwn(descriptor,'value')&&descriptor.value&&typeof descriptor.value==='object');
 for(const key of absentEnvironmentKeys)guard(!Reflect.has(descriptor.value,key));
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function parents(file){const rows=[];for(let at=path.dirname(file);;at=path.dirname(at)){
 const s=fs.lstatSync(at,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink()&&(s.mode&0o6022n)===0n||at==='/private/tmp'&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===0n&&(s.mode&0o7777n)===0o1777n);
 rows.push([at,parentMark(s)]);if(at===path.dirname(at))return rows;}}
function named(row){guard(fs.realpathSync(row.file)===row.file&&mark(fs.lstatSync(row.file,{bigint:true}))===row.mark&&JSON.stringify(parents(row.file))===JSON.stringify(row.parents));}
function bounded(file,owner,limit,pin){
 guard(fs.realpathSync(file)===file);const s=fs.lstatSync(file,{bigint:true}),lineage=parents(file);
 guard(s.isFile()&&!s.isSymbolicLink()&&s.uid===BigInt(owner)&&s.nlink===1n&&(s.mode&0o6022n)===0n&&s.size>0n&&s.size<=BigInt(limit));
 let fd,row,failed=false;
 try{fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);guard(mark(fs.fstatSync(fd,{bigint:true}))===mark(s));
  const hash=createHash('sha256'),bytes=Buffer.alloc(65536);let count=0;
  while(count<Number(s.size)){const n=fs.readSync(fd,bytes,0,Math.min(bytes.length,Number(s.size)-count),count);guard(Number.isInteger(n)&&n>0&&n<=Math.min(bytes.length,Number(s.size)-count));hash.update(bytes.subarray(0,n));count+=n;}
  guard(hash.digest('hex')===pin&&mark(fs.fstatSync(fd,{bigint:true}))===mark(s));
  row={file,mark:mark(s),parents:lineage,pin,owner,limit};named(row);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}
 guard(!failed);return row;
}
function etcAlias(){const s=fs.lstatSync('/etc',{bigint:true});guard(s.isSymbolicLink()&&s.uid===0n&&fs.readlinkSync('/etc')==='private/etc'&&fs.realpathSync('/etc')==='/private/etc');return mark(s);}
function absent(file){try{fs.lstatSync(file,{bigint:true});}catch(error){guard(error?.code==='ENOENT');return;}fail();}
function owned(file){const s=fs.lstatSync(file,{bigint:true});guard(fs.realpathSync(file)===file&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o7777n)===0o700n);return {file,mark:parentMark(s),parents:parents(file)};}
function directoryNames(file){const names=fs.readdirSync(file);guard(Array.isArray(names)&&names.length<=2&&names.every(n=>typeof n==='string'&&!/[\/\\\0]/.test(n)));return names.sort();}
const keys=['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild'];
// Selection is private original identity only, never public build/profile labels.
function originalProfile(assetsBuild){
 const fixtureProfile=sealedTypeScriptBaseExchangeAssetsFixtureProfile(assetsBuild);
 if(fixtureProfile==='fixed-native-assets-local-sdk27@1')return {fixtureProfile,profileId:'fixed-enclosure-local-sdk27@1',interpretation:'redue-native187-local-enclosure-startup-source@1',basis:NATIVE_STDIO_STARTUP_BASIS,ci:false};
 if(fixtureProfile==='fixed-native-assets-ci-sdk26.5-toolpair-a@1')return {fixtureProfile,profileId:'fixed-enclosure-ci-sdk26.5-toolpair-a@1',interpretation:'redue-native187-ci-enclosure-startup-source@1',basis:NATIVE_STDIO_CI_STARTUP_BASIS,ci:true};
 fail();
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.exec(v)?.[0]===v;
// All ten exact original identities are checked without touching public
// capability properties or paths; no report, witness, callback or copy adopts.
function linked(i){const profile=sealedTypeScriptBaseExchangeAssetsFixtureProfile(i.assetsBuild);return (profile==='fixed-native-assets-local-sdk27@1'||profile==='fixed-native-assets-ci-sdk26.5-toolpair-a@1')&&sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation(i.enclosureSource,i.assetsBuild,i.pairedSource,i.pairedArtifacts,i.copies,i.projection,i.preparedNullSource)&&sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource(i.enclosureBuild,i.enclosureSource)&&sealedTypeScriptBaseExchangeAssetsMatchPair(i.assetsBuild,i.pair)&&sealedTypeScriptBaseExchangeAssetsMatchHostFixture(i.assetsBuild,i.hostFixture)&&sealedTypeScriptPairedStageSourceMatchesDerivation(i.pairedSource,i.pair,i.assetsBuild);}
function originalBinding(i){
 guard(linked(i));const profile=originalProfile(i.assetsBuild),{profileId}=profile,s=i.enclosureSource,p=i.projection,b=i.enclosureBuild.report,binding=s.bindings;
 const {baseA:a,baseB:other,hostBase:h}=binding,root=/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/;
 guard([a,other,h].every(v=>typeof v==='string'&&root.exec(v)?.[0]===v)&&new Set([a,other,h]).size===3&&(profile.ci?s.fixtureProfileId===profile.fixtureProfile:s.fixtureProfileId===undefined)&&s.version==='fixed-canary-finite-enclosure-source@2'&&p.version==='fixed-canary-original-input-projection@3'&&hash(s.projectionSha256)&&p.projectionSha256===s.projectionSha256&&b.profileId===profileId&&b.sourceVersion===s.version&&b.projectionSha256===s.projectionSha256&&same(b.bindings,binding)&&binding.cwd===a+'/Checkout 空间/.sealed-native-canaries'&&binding.self===h+'/prefix/native-probes/paired-stage-enclosure'&&binding.launcher===h+'/prefix/native-probes/paired-stage-enclosed-campaign-launch'&&binding.entry===h+'/prefix/native-probes/paired-stage-enclosed-campaign.mjs'&&binding.projectionEntry===h+'/prefix/native-probes/paired-stage-enclosed-original-inputs.mjs'&&binding.node===h+'/runtime/node-v22.13.0-darwin-arm64/bin/node');
 return {base:h,fingerprint:JSON.stringify([binding,s.version,p.version,s.projectionSha256,profileId]),basis:profile.basis,profileId,interpretation:profile.interpretation};
}
function fullBinding(i){
 guard(linked(i));originalProfile(i.assetsBuild);const checked=verifySealedTypeScriptFixedCampaignEnclosureBuild(i.enclosureBuild);
 guard(checked.outcome==='ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'&&checked.scope==='FIXED_CANARY_ENCLOSURE_POSTBUILD_DATA_ONLY'&&checked.originalRowsScope==='POSTBUILD_PRE_NATIVE_ENDPOINTS_ONLY'&&checked.nativeIntervalBarrier==='NOT_ESTABLISHED');
 const original=originalBinding(i);guard(checked.hostBase===original.base&&same(checked.bindings,i.enclosureSource.bindings)&&same(checked.files,i.enclosureBuild.report.files));return {...original,fullFingerprint:JSON.stringify(checked)};
}
function ownerCurrent(record,phase){
 guard(linked(record.inputs));
 if(phase==='BEFORE_NATIVE'){const before=fullBinding(record.inputs);return before.fingerprint===record.binding&&before.fullFingerprint===record.fullBinding;}
 // AFTER is deliberately identity-only for original recipe capabilities. The
 // separate controller still owes the six-code post-native endpoint check;
 // this startup adapter does not replace it or call full original validators.
 return originalBinding(record.inputs).fingerprint===record.binding;
}
function state(record,phase){
 environmentAbsent();
 for(const file of record.basis.requiredAbsentSystemStartupPaths)absent(file);
 guard(!record.invalid&&ownerCurrent(record,phase)&&etcAlias()===record.etc);
 const closing=[];
 for(const row of record.directories){const now=owned(row.file);guard(now.mark===row.mark&&JSON.stringify(now.parents)===JSON.stringify(row.parents));closing.push([row.file,mark(fs.lstatSync(row.file,{bigint:true}))]);}
 guard(directoryNames(record.home).length===0&&directoryNames(record.gh).length===0&&directoryNames(record.pathDirectory).length===0);
 for(const suffix of ['.bashrc','.bash_profile','.bash_login','.profile','.zshrc','.zprofile','.zshenv','.claude','.mcp.json','CLAUDE.md'])absent(record.home+'/'+suffix);
 // NONbare preserves the approved explicit subscription OAuth route. Empty
 // setting-sources closes user/project/local instructions; the fixed settings
 // must also disable auto-memory. Managed instruction/rules are metadata-only
 // absent prerequisites, alongside existing administrative-source checks. The
 // managed .claude root also closes unconditional nonbare skills/agents/styles
 // loaders; empty user/project setting sources do not disable those loaders.
 for(const file of ['/Library/Application Support/ClaudeCode/CLAUDE.md','/Library/Application Support/ClaudeCode/.claude'])absent(file);
 for(const suffix of ['plugins','session-env/.credentials.json'])absent(record.config+'/'+suffix);
 guard(directoryNames(record.snapshots).length===0);
 const sessions=directoryNames(record.sessions);guard(phase==='BEFORE_NATIVE'?sessions.length===0:sessions.length<=1&&sessions.every(n=>uuid.test(n)));
 for(const n of sessions){const p=record.sessions+'/'+n,s=fs.lstatSync(p,{bigint:true});guard(fs.realpathSync(p)===p&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o6022n)===0n&&directoryNames(p).length===0);closing.push([p,mark(s)]);}
 for(const file of record.basis.requiredAbsentSystemStartupPaths)absent(file);return closing;
}
function closeDirectories(rows){for(const [file,fingerprint]of rows)guard(fs.realpathSync(file)===file&&mark(fs.lstatSync(file,{bigint:true}))===fingerprint);}
function current(record,phase){
 state(record,phase);
 for(const row of record.rows){const next=bounded(row.file,row.owner,row.limit,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.parents)===JSON.stringify(row.parents));}
 state(record,phase);for(const row of record.rows)named(row);
 // Preserve complete directory fingerprints from the final membership scan
 // until after every late named row/ancestor check. Full membership scans stay
 // required; fingerprints merely close later validation work in this call.
 const closing=state(record,phase);for(const row of record.rows)named(row);closeDirectories(closing);for(const row of record.rows)named(row);closeDirectories(closing);
 for(const file of record.basis.requiredAbsentSystemStartupPaths)absent(file);environmentAbsent();guard(!record.invalid);
}
function put(file){let fd,failed=false;
 try{fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);
  const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);
  let count=0;while(count<pathBytes.length){const n=fs.writeSync(fd,pathBytes,count,pathBytes.length-count,count);guard(Number.isInteger(n)&&n>0&&n<=pathBytes.length-count);count+=n;}fs.fsyncSync(fd);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);
}
export function prepareNativeEnclosureStartup(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==keys.length||!keys.every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Error('NATIVE_ENCLOSURE_STARTUP_OPTIONS');
 const inputs=Object.fromEntries(keys.map(k=>[k,Object.getOwnPropertyDescriptor(options,k).value]));let record=null,reason='PRIVATE_BINDING_UNAVAILABLE';
 try{
  // No public capability property or filesystem access precedes private links.
  const observed=fullBinding(inputs),first=observed.fullFingerprint,base=observed.base,basis=observed.basis,profileId=observed.profileId,interpretation=observed.interpretation;
  reason='INHERITED_STARTUP_INPUT_UNAVAILABLE';environmentAbsent();
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined);
  reason='STOCK_LOGIN_BASIS_UNAVAILABLE';for(const file of basis.requiredAbsentSystemStartupPaths)absent(file);const alias=etcAlias();
  const rows=Object.entries(basis.pins).map(([file,pin])=>bounded(file,0,file==='/bin/bash'?2*1024*1024:file==='/usr/libexec/path_helper'?256*1024:4096,pin));
  guard(fullBinding(inputs).fullFingerprint===first&&etcAlias()===alias);for(const row of rows)named(row);environmentAbsent();
  reason='FRESH_STARTUP_NAMESPACE_UNAVAILABLE';const host=base+'/claude-host',home=host+'/home',config=host+'/claude-config',gh=host+'/gh-config',root=host+'/path-helper-root',etc=root+'/etc';absent(host);
  const dirs=[host,home,config,gh,root,etc,etc+'/paths.d',config+'/shell-snapshots',config+'/session-env'];
  const directories=[];for(const file of dirs){fs.mkdirSync(file,{mode:0o700});directories.push(owned(file));}
  put(etc+'/paths');rows.push(bounded(etc+'/paths',process.getuid(),4096,createHash('sha256').update(pathBytes).digest('hex')));
  record={inputs,interpretation,binding:observed.fingerprint,fullBinding:first,basis,profileId,etc:alias,rows,directories,home,config,gh,pathDirectory:etc+'/paths.d',snapshots:config+'/shell-snapshots',sessions:config+'/session-env',invalid:false};
  reason='CLOSING_STARTUP_BINDING_UNAVAILABLE';current(record,'BEFORE_NATIVE');
  const value=result({outcome:'STARTUP_PREPARED_NOT_LAUNCHED',interpretation,sourceVersion:inputs.enclosureSource.version,projectionVersion:inputs.projection.version,projectionSha256:inputs.enclosureSource.projectionSha256,buildProfileId:profileId,hostBase:base,sourceBasisCurrent:true,
   environmentBindings:{HOME:home,CLAUDE_CONFIG_DIR:config,GH_CONFIG_DIR:gh,SHELL:'/bin/bash',PATH:FIXED_PATH,PATH_HELPER_ROOT:root},
   requiredAbsentSystemStartupPaths:basis.requiredAbsentSystemStartupPaths,
   requiredAbsentEnvironmentKeys:absentEnvironmentKeys,requiredSettings:{autoMemoryEnabled:false,disableAllHooks:true,enabledPlugins:{}},forbiddenArgv:['--bare','--add-dir','--plugin-dir'],requiredArgv:['--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--no-session-persistence'],
   settingsAndArgvApplied:'NOT_ESTABLISHED',postNativeCodeEndpoint:'SEPARATE_CONTROLLER_PREREQUISITE',policyPreservation:'OAUTH_PROXY_CREDENTIAL_DENIALS_SANDBOX_AND_EXACT_COMMAND_REMAIN_SEPARATE_PREREQUISITES'});
  minted.set(value,record);return value;
 }catch{if(record)record.invalid=true;return result({outcome:'UNKNOWN',reason,sourceBasisCurrent:false});}
}
export function verifyNativeEnclosureStartup(value,phase){
 if(arguments.length!==2||!['BEFORE_NATIVE','AFTER_NATIVE'].includes(phase))throw Error('NATIVE_ENCLOSURE_STARTUP_OPTIONS');
 const record=minted.get(value);if(!record||record.invalid)return result({outcome:'UNKNOWN',sourceBasisCurrent:false});
 try{guard(linked(record.inputs));current(record,phase);guard(!record.invalid);return result({outcome:'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY',phase,interpretation:record.interpretation,sourceVersion:value.sourceVersion,projectionVersion:value.projectionVersion,projectionSha256:value.projectionSha256,buildProfileId:record.profileId,hostBase:value.hostBase,sourceBasisCurrent:true,environmentBindings:value.environmentBindings,requiredArgv:value.requiredArgv,forbiddenArgv:value.forbiddenArgv,requiredSettings:value.requiredSettings,requiredAbsentEnvironmentKeys:value.requiredAbsentEnvironmentKeys,requiredAbsentSystemStartupPaths:value.requiredAbsentSystemStartupPaths,settingsAndArgvApplied:'NOT_ESTABLISHED',postNativeCodeEndpoint:'SEPARATE_CONTROLLER_PREREQUISITE'});}
 catch{record.invalid=true;return result({outcome:'UNKNOWN',sourceBasisCurrent:false});}
}
