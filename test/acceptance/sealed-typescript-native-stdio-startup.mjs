// Fixed, test-only startup preparation for one native187 stdio diagnostic.
// No native, helper, compiler, shell, model, credential or network operation.
// Private currentness observations are trusted/quiescent endpoint checks, not
// hostile-interval continuity, native enforcement, pre-main confinement or a seal.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyNativeStdioProbeBuild} from './sealed-typescript-native-stdio-build.mjs';
import {verifySealedTypeScriptSyntheticFixture} from './sealed-typescript-synthetic-fixture.mjs';

const minted=new WeakMap();
const fail=()=>{throw Error('NATIVE_STDIO_STARTUP_UNKNOWN');};
const guard=value=>{if(!value)fail();};
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
const parentMark=s=>['dev','ino','mode','uid','gid'].map(k=>String(s[k])).join(':');
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const result=fields=>freeze({schema:1,scope:'FIXED_NATIVE187_ISOLATED_STARTUP_SOURCE_DATA_ONLY',...fields,
 commands:[],compilerCheckExecutions:0,helperExecutions:0,nativeLaunches:0,models:0,
 nativeEnforcement:'NOT_ESTABLISHED',preMainLoader:'NOT_ESTABLISHED',controlledShellStartup:'NOT_EMPIRICALLY_OBSERVED',
 recordAdoptionAuthority:false,sealed:false,reuseEligible:false});

// Official public Apple bash commit51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178:
// https://github.com/apple-oss-distributions/bash/blob/51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178/profile
// https://github.com/apple-oss-distributions/bash/blob/51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178/bashrc
// Stock noninteractive bashrc returns before dynamic TERM_PROGRAM sourcing.
// Stock profile calls path_helper -s. The fixed diagnostic supplies an isolated
// PATH_HELPER_ROOT and no MANPATH/PS1/BASH_ENV/ENV/TERM_PROGRAM startup inputs.
// Apple shell_cmds commit298787009e5432c5e4c378a077f98267077e3495,
// path_helper/path_helper.c SHA8f1a55eb4b848b75447f3b3e7a5c8f63f6c23dc2a2dca01406b9cb4004d747f0:
// construct_path prefixes both paths with PATH_HELPER_ROOT before FTS_PHYSICAL.
// Actual pinned Apple-signed arm64e binary: main0x100000590 passes the two
// /etc paths; construct_path0x1000006c0 getenv -> two asprintf("%s%s") ->
// fts_open0x100000720. MANPATH branch0x1000005b0 is conditional on presence.
// This source/static-binary basis is versioned and does not certify the loader.
export const NATIVE_STDIO_STARTUP_BASIS=freeze({
 interpretation:'redue-native187-isolated-bash-startup@1',
 nativeSha256:'a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3',
 appleBashCommit:'51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178',
 appleShellCommandsCommit:'298787009e5432c5e4c378a077f98267077e3495',
 pathHelperSourceSha256:'8f1a55eb4b848b75447f3b3e7a5c8f63f6c23dc2a2dca01406b9cb4004d747f0',
 pins:{
  '/private/etc/profile':'a3fe9f414586c0d3cacbe3b6920a09d8718e503bca22e23fef882203bf765065',
  '/private/etc/bashrc':'444c716ac2ccd9e1e3347858cb08a00d2ea38e8c12fdc5798380dc261e32e9ef',
  '/bin/bash':'67e853b740606c0cb92fc8b7186a98d327d783f7e7cd911773bb83f73f3d6583',
  '/usr/libexec/path_helper':'5d4d2ec6dd2706b2b864188978ad29a6910979a90f8bfef2d85ef053a33eb0e6'}
});
const FIXED_PATH='/usr/bin:/bin:/usr/sbin:/sbin';
const pathBytes=Buffer.from(FIXED_PATH.replaceAll(':','\n')+'\n');
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
function binding(fixture,build){
 const f=verifySealedTypeScriptSyntheticFixture(fixture),b=verifyNativeStdioProbeBuild(build);
 guard(f.outcome==='SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED'&&f.scope==='FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY'&&f.receiverBasePolicyMatch===true&&f.ownedHandlesClosed===true&&
  b.outcome==='BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'&&f.base===b.hostBase&&/^\/private\/tmp\/redue-ci-recipient-[a-f0-9]{8}$/.test(f.base)&&
  b.helper===f.base+'/prefix/native-probes/native-stdio-probe'&&b.cwd===f.base+'/prefix/native-probes');
 return JSON.stringify([f,b]);
}
function state(record,phase){
 guard(!record.invalid&&binding(record.fixture,record.build)===record.binding&&etcAlias()===record.etc);
 const closing=[];
 for(const row of record.directories){const now=owned(row.file);guard(now.mark===row.mark&&JSON.stringify(now.parents)===JSON.stringify(row.parents));closing.push([row.file,mark(fs.lstatSync(row.file,{bigint:true}))]);}
 guard(directoryNames(record.home).length===0&&directoryNames(record.gh).length===0&&directoryNames(record.pathDirectory).length===0);
 for(const suffix of ['.bashrc','.bash_profile','.bash_login','.profile','.zshrc','.zprofile','.zshenv','.claude','.mcp.json','CLAUDE.md'])absent(record.home+'/'+suffix);
 // With --bare and no --add-dir, native187 Vl/eie disables main instruction,
 // memory and plugin startup. Keep those switches as required data, not claims
 // that a caller actually used them. Settings/no-hook/effective policy remain
 // independently required by the existing diagnostic transport.
 for(const suffix of ['plugins','session-env/.credentials.json'])absent(record.config+'/'+suffix);
 guard(directoryNames(record.snapshots).length===0);
 const sessions=directoryNames(record.sessions);guard(phase==='BEFORE_NATIVE'?sessions.length===0:sessions.length<=1&&sessions.every(n=>uuid.test(n)));
 for(const n of sessions){const p=record.sessions+'/'+n,s=fs.lstatSync(p,{bigint:true});guard(fs.realpathSync(p)===p&&s.isDirectory()&&!s.isSymbolicLink()&&s.uid===BigInt(process.getuid())&&(s.mode&0o6022n)===0n&&directoryNames(p).length===0);closing.push([p,mark(s)]);}
 return closing;
}
function closeDirectories(rows){for(const [file,fingerprint]of rows)guard(fs.realpathSync(file)===file&&mark(fs.lstatSync(file,{bigint:true}))===fingerprint);}
function current(record,phase){
 state(record,phase);
 for(const row of record.rows){const next=bounded(row.file,row.owner,row.limit,row.pin);guard(next.mark===row.mark&&JSON.stringify(next.parents)===JSON.stringify(row.parents));}
 state(record,phase);for(const row of record.rows)named(row);
 // Preserve complete directory fingerprints from the final membership scan
 // until after every late named row/ancestor check. Full membership scans stay
 // required; fingerprints merely close later validation work in this call.
 const closing=state(record,phase);for(const row of record.rows)named(row);closeDirectories(closing);for(const row of record.rows)named(row);closeDirectories(closing);guard(!record.invalid);
}
function put(file){let fd,failed=false;
 try{fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK,0o600);
  const s=fs.fstatSync(fd,{bigint:true});guard(s.isFile()&&s.uid===BigInt(process.getuid())&&s.nlink===1n&&(s.mode&0o7777n)===0o600n&&s.size===0n);
  let count=0;while(count<pathBytes.length){const n=fs.writeSync(fd,pathBytes,count,pathBytes.length-count,count);guard(Number.isInteger(n)&&n>0&&n<=pathBytes.length-count);count+=n;}fs.fsyncSync(fd);
 }catch{failed=true;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{failed=true;}}guard(!failed);
}
export function prepareNativeStdioStartup(options){
 if(arguments.length!==1||!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||!['fixture','build'].every(k=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,k)??{},'value')))throw Error('NATIVE_STDIO_STARTUP_OPTIONS');
 let record=null,reason='PRIVATE_BINDING_UNAVAILABLE';
 try{
  const first=binding(options.fixture,options.build),base=options.build.hostBase;
  guard(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid()&&fs.constants.O_NOFOLLOW!==undefined&&fs.constants.O_NONBLOCK!==undefined);
  reason='STOCK_LOGIN_BASIS_UNAVAILABLE';const alias=etcAlias();
  const rows=Object.entries(NATIVE_STDIO_STARTUP_BASIS.pins).map(([file,pin])=>bounded(file,0,file==='/bin/bash'?2*1024*1024:file==='/usr/libexec/path_helper'?256*1024:4096,pin));
  // Exact public bodies are compared by hash only. Never open local /etc/paths,
  // /etc/paths.d entries, owner HOME rc, credential or corporate configuration.
  guard(binding(options.fixture,options.build)===first&&etcAlias()===alias);for(const row of rows)named(row);
  reason='FRESH_STARTUP_NAMESPACE_UNAVAILABLE';const host=base+'/claude-host',home=host+'/home',config=host+'/claude-config',gh=host+'/gh-config',root=host+'/path-helper-root',etc=root+'/etc';absent(host);
  const dirs=[host,home,config,gh,root,etc,etc+'/paths.d',config+'/shell-snapshots',config+'/session-env'];
  const directories=[];for(const file of dirs){fs.mkdirSync(file,{mode:0o700});directories.push(owned(file));}
  put(etc+'/paths');rows.push(bounded(etc+'/paths',process.getuid(),4096,createHash('sha256').update(pathBytes).digest('hex')));
  record={fixture:options.fixture,build:options.build,binding:first,etc:alias,rows,directories,home,config,gh,pathDirectory:etc+'/paths.d',snapshots:config+'/shell-snapshots',sessions:config+'/session-env',invalid:false};
  reason='CLOSING_STARTUP_BINDING_UNAVAILABLE';current(record,'BEFORE_NATIVE');
  const value=result({outcome:'STARTUP_PREPARED_NOT_LAUNCHED',interpretation:NATIVE_STDIO_STARTUP_BASIS.interpretation,hostBase:base,sourceBasisCurrent:true,
   environmentBindings:{HOME:home,CLAUDE_CONFIG_DIR:config,GH_CONFIG_DIR:gh,SHELL:'/bin/bash',PATH:FIXED_PATH,PATH_HELPER_ROOT:root},
   requiredAbsentEnvironmentKeys:['PS1','MANPATH','BASH_ENV','ENV','TERM_PROGRAM'],requiredArgv:['--bare','--setting-sources','','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--no-session-persistence'],
   policyPreservation:'OAUTH_PROXY_CREDENTIAL_DENIALS_SANDBOX_AND_EXACT_COMMAND_REMAIN_SEPARATE_PREREQUISITES'});
  minted.set(value,record);return value;
 }catch{if(record)record.invalid=true;return result({outcome:'UNKNOWN',reason,sourceBasisCurrent:false});}
}
export function verifyNativeStdioStartup(value,phase='BEFORE_NATIVE'){
 if(arguments.length<1||arguments.length>2||!['BEFORE_NATIVE','AFTER_NATIVE'].includes(phase))throw Error('NATIVE_STDIO_STARTUP_OPTIONS');
 const record=minted.get(value);if(!record||record.invalid)return result({outcome:'UNKNOWN',sourceBasisCurrent:false});
 try{current(record,phase);guard(!record.invalid);return result({outcome:'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY',phase,interpretation:value.interpretation,hostBase:value.hostBase,sourceBasisCurrent:true,environmentBindings:value.environmentBindings,requiredArgv:value.requiredArgv,requiredAbsentEnvironmentKeys:value.requiredAbsentEnvironmentKeys});}
 catch{record.invalid=true;return result({outcome:'UNKNOWN',sourceBasisCurrent:false});}
}
