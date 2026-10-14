// In-memory engineering controls only; no real fixture, shell, native, compiler,
// model, credential, system configuration or network operation is selected.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareNativeStdioStartup,verifyNativeStdioStartup,NATIVE_STDIO_STARTUP_BASIS} from './acceptance/sealed-typescript-native-stdio-startup.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-stdio-startup.mjs',import.meta.url),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const base='/private/tmp/redue-ci-recipient-12345678',host=base+'/claude-host';
const managedProfile='/private/var/db/ManagedConfigurationFiles/com.apple.bash/etc/profile';
const publicProfile='# System-wide .profile for sh(1)\n\nif [ -x /usr/libexec/path_helper ]; then\n\teval `/usr/libexec/path_helper -s`\nfi\n\nif [ "${BASH-no}" != "no" ]; then\n\t[ -r /etc/bashrc ] && . /etc/bashrc\nfi\n';
const publicBashrc='# System-wide .bashrc file for interactive bash(1) shells.\nif [ -z "$PS1" ]; then\n   return\nfi\n\nPS1=\'\\h:\\W \\u\\$ \'\n# Make bash check its window size after a process completes\nshopt -s checkwinsize\n\n[ -r "/etc/bashrc_$TERM_PROGRAM" ] && . "/etc/bashrc_$TERM_PROGRAM"\n';
function mock(){
 let ino=1,fd=100;const nodes=new Map(),fds=new Map(),fixture=Object.freeze({kind:'PRIVATE_FIXTURE'}),build=Object.freeze({hostBase:base});
 const state={fixtureValid:true,buildValid:true,reads:[],writes:[],opens:[],closes:[],mkdirs:[],stats:[],fault:null,deniedPath:null,deniedCode:'EPERM',afterRead:null,afterStat:null,afterBuild:null};
 const put=(file,kind='d',body='',owner=501,mode=kind==='d'?0o40700n:0o100600n)=>{const p=nodes.get(path.posix.dirname(file));if(p){p.mtimeNs++;p.ctimeNs++;}return nodes.set(file,{kind,body:Buffer.from(body),uid:BigInt(owner),gid:20n,mode,dev:1n,ino:BigInt(ino++),nlink:1n,size:BigInt(Buffer.byteLength(body)),mtimeNs:1n,ctimeNs:1n});};
 const parents=file=>{for(let at=path.posix.dirname(file);;at=path.posix.dirname(at)){if(!nodes.has(at))put(at,'d','',0,at==='/private/tmp'?0o41777n:0o40755n);if(at===path.posix.dirname(at))return;}};
 for(const [file,body]of [['/private/etc/profile',publicProfile],['/private/etc/bashrc',publicBashrc],['/bin/bash','STOCK_BASH'],['/usr/libexec/path_helper','STOCK_PATH_HELPER']]){parents(file);put(file,'f',body,0,0o100444n);}
 parents(base);put(base);parents(base+'/prefix/native-probes');put(base+'/prefix');put(base+'/prefix/native-probes');
 put('/etc','l','private/etc',0,0o120755n);
 const stat=file=>{state.stats.push(file);if(file===state.deniedPath)throw Object.assign(Error('PRIVATE_DETAIL'),{code:state.deniedCode});if(state.fault==='stat')throw Error('PRIVATE_DETAIL');const row=nodes.get(file);if(!row)throw Object.assign(Error('PRIVATE_DETAIL'),{code:state.fault==='absent-denied'?'EPERM':'ENOENT'});
  const out={...row,isFile:()=>row.kind==='f',isDirectory:()=>row.kind==='d',isSymbolicLink:()=>row.kind==='l'};state.afterStat?.(file);return out;};
 const io={constants:{O_RDONLY:0,O_WRONLY:4,O_CREAT:8,O_EXCL:16,O_NOFOLLOW:1,O_NONBLOCK:2},lstatSync:stat,
  realpathSync:file=>file==='/etc'?'/private/etc':state.fault==='realpath'?file+'-ALIAS':file,
  readlinkSync:file=>{assert.equal(file,'/etc');return state.fault==='etc-alias'?'other/etc':'private/etc';},
  readdirSync(file){if(state.fault==='readdir')throw Object.assign(Error('PRIVATE_DETAIL'),{code:'EPERM'});stat(file);return [...nodes.keys()].filter(p=>path.posix.dirname(p)===file&&p!==file).map(p=>path.posix.basename(p));},
  mkdirSync(file,options){state.mkdirs.push(file);assert.deepEqual(options,{mode:0o700});assert(!nodes.has(file));if(state.fault==='mkdir')throw Error('PRIVATE_DETAIL');put(file);},
  openSync(file,flags,mode){state.opens.push(file);if(state.fault==='open')throw Error('PRIVATE_DETAIL');if(flags===31){assert.equal(mode,0o600);assert(!nodes.has(file));put(file,'f');}else assert.equal(flags,3);stat(file);const n=fd++;fds.set(n,file);return n;},
  fstatSync:n=>stat(fds.get(n)),
  readSync(n,b,offset,length,position){const file=fds.get(n);state.reads.push(file);if(state.fault==='read')return 0;const r=nodes.get(file),count=r.body.copy(b,offset,position,Math.min(position+length,r.body.length));state.afterRead?.(file);return count;},
  writeSync(n,b,offset,length,position){const file=fds.get(n);state.writes.push(file);assert.equal(file,host+'/path-helper-root/etc/paths');if(state.fault==='write')return 0;const r=nodes.get(file);r.body=Buffer.concat([r.body,b.subarray(offset,offset+length)]);r.size=BigInt(r.body.length);return length;},
  fsyncSync(){if(state.fault==='fsync')throw Error('PRIVATE_DETAIL');},
  closeSync(n){state.closes.push(n);fds.delete(n);if(state.fault==='close')throw Error('PRIVATE_DETAIL');}};
 const fixtureVerify=v=>v===fixture&&state.fixtureValid?{outcome:'SYNTHETIC_FIXTURE_CURRENTLY_OBSERVED',scope:'FIXED_CI_SYNTHETIC_FIXTURE_MECHANICS_ONLY',receiverBasePolicyMatch:true,ownedHandlesClosed:true,base}:{outcome:'UNKNOWN'};
 const buildVerify=v=>{const observed=v===build&&state.buildValid?{outcome:'BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',hostBase:base,helper:base+'/prefix/native-probes/native-stdio-probe',cwd:base+'/prefix/native-probes'}:{outcome:'UNKNOWN'};state.afterBuild?.();return observed;};
 // Substitute only actual binary pins for in-memory byte fixtures. Public stock
 // profile/bashrc pins remain exact, so accidental public-template drift fails.
 const code=source.replace(/^import .*;$/gm,'').replaceAll('export const ','const ').replaceAll('export function ','function ')
  .replace(NATIVE_STDIO_STARTUP_BASIS.pins['/bin/bash'],sha('STOCK_BASH')).replace(NATIVE_STDIO_STARTUP_BASIS.pins['/usr/libexec/path_helper'],sha('STOCK_PATH_HELPER'));
 const processMock={platform:'darwin',arch:'arm64',version:'v22.13.0',getuid:()=>501,geteuid:()=>501,getgid:()=>20,getegid:()=>20};
 const api=Function('fs','path','createHash','verifyNativeStdioProbeBuild','verifySealedTypeScriptSyntheticFixture','process',code+';return {prepare:prepareNativeStdioStartup,verify:verifyNativeStdioStartup};')(io,path.posix,createHash,buildVerify,fixtureVerify,processMock);
 return {...api,fixture,build,state,nodes,fds,put,process:processMock};
}
const prepare=m=>m.prepare({fixture:m.fixture,build:m.build});
function noAuthority(v){assert.deepEqual(v.commands,[]);for(const name of ['nativeLaunches','helperExecutions','models','compilerCheckExecutions'])assert.equal(v[name],0);for(const name of ['sealed','reuseEligible','recordAdoptionAuthority'])assert.equal(v[name],false);assert.equal(v.nativeEnforcement,'NOT_ESTABLISHED');assert.equal(v.preMainLoader,'NOT_ESTABLISHED');assert.equal(v.controlledShellStartup,'NOT_EMPIRICALLY_OBSERVED');}
test('fixed public Apple profile and noninteractive bashrc pins match actual official contents',()=>{
 assert.equal(sha(publicProfile),NATIVE_STDIO_STARTUP_BASIS.pins['/private/etc/profile']);assert.equal(sha(publicBashrc),NATIVE_STDIO_STARTUP_BASIS.pins['/private/etc/bashrc']);assert.match(NATIVE_STDIO_STARTUP_BASIS.nativeSha256,/^[a-f0-9]{64}$/);
 assert.equal(NATIVE_STDIO_STARTUP_BASIS.appleBashCommit,'51bf3fc6f26e9517c3a2e4bc3d208f9b39b87178');
 assert.equal(NATIVE_STDIO_STARTUP_BASIS.appleBashPathnamesSourceSha256,'bdd2f209f4503cfdaede9f603692e6807e6574fce2142f1feab3424d0695939a');
 assert.equal(NATIVE_STDIO_STARTUP_BASIS.appleBashShellSourceSha256,'41e86baac3861152e77e479dac988d80f42bffa467ef42c3c10a1ea04a48c542');
 assert.deepEqual(NATIVE_STDIO_STARTUP_BASIS.requiredAbsentSystemStartupPaths,[managedProfile]);
});
test('import and foreign or serialized labels perform no filesystem work',()=>{
 const v=prepareNativeStdioStartup({fixture:{},build:{hostBase:base}});noAuthority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(verifyNativeStdioStartup(v).outcome,'UNKNOWN');
 const m=mock();assert.equal(m.prepare({fixture:{},build:m.build}).outcome,'UNKNOWN');assert.equal(m.prepare({fixture:m.fixture,build:{hostBase:base}}).outcome,'UNKNOWN');assert.equal(m.state.opens.length,0);assert.equal(m.state.mkdirs.length,0);
});
test('strict fixed options reject accessors/prototypes/extra inputs before invocation',()=>{
 let n=0;const getter={build:{}};Object.defineProperty(getter,'fixture',{get(){n++;return {};}});
 for(const v of [null,{},Object.create(null),getter,{fixture:null,build:null,path:'/owner'},{fixture:null,build:null,env:{}}])assert.throws(()=>prepareNativeStdioStartup(v),/STARTUP_OPTIONS/);assert.equal(n,0);
 assert.throws(()=>verifyNativeStdioStartup({},'OTHER'),/STARTUP_OPTIONS/);
});
test('stable mocks prepare only fresh fixed HOME/config/PATH tree and never read owner/system PATH data',()=>{
 const m=mock(),v=prepare(m);noAuthority(v);assert.equal(v.outcome,'STARTUP_PREPARED_NOT_LAUNCHED');assert.equal(v.sourceBasisCurrent,true);
 assert.deepEqual(v.environmentBindings,{HOME:host+'/home',CLAUDE_CONFIG_DIR:host+'/claude-config',GH_CONFIG_DIR:host+'/gh-config',SHELL:'/bin/bash',PATH:'/usr/bin:/bin:/usr/sbin:/sbin',PATH_HELPER_ROOT:host+'/path-helper-root'});
 assert.deepEqual(m.nodes.get(host+'/path-helper-root/etc/paths').body,Buffer.from('/usr/bin\n/bin\n/usr/sbin\n/sbin\n'));
 assert(m.state.reads.every(p=>Object.hasOwn(NATIVE_STDIO_STARTUP_BASIS.pins,p)||p===host+'/path-helper-root/etc/paths'));
 assert.equal(m.verify(v).outcome,'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY');assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY');
 assert.equal(m.verify(structuredClone(v)).outcome,'UNKNOWN');assert.equal(m.fds.size,0);assert(Object.isFrozen(v.environmentBindings));
 assert(!v.requiredArgv.includes('--bare'));assert(v.forbiddenArgv.includes('--bare'));assert.deepEqual(v.requiredSettings,{autoMemoryEnabled:false,disableAllHooks:true,enabledPlugins:{}});assert.equal(v.interpretation,'redue-native187-isolated-bash-startup@3');assert.deepEqual(v.requiredAbsentEnvironmentKeys,['PS1','MANPATH','BASH_ENV','ENV','TERM_PROGRAM']);
 assert.deepEqual(v.requiredAbsentSystemStartupPaths,[managedProfile]);assert.deepEqual(m.verify(v).requiredAbsentSystemStartupPaths,[managedProfile]);
});
for(const name of ['fixtureValid','buildValid'])test(`missing current private ${name} refuses before system/body reads`,()=>{const m=mock();m.state[name]=false;assert.equal(prepare(m).outcome,'UNKNOWN');assert.equal(m.state.opens.length,0);assert.equal(m.state.mkdirs.length,0);});
for(const field of ['platform','arch','version'])test(`unsupported ${field} never provisions`,()=>{const m=mock();m.process[field]='OTHER';assert.equal(prepare(m).outcome,'UNKNOWN');assert.equal(m.state.opens.length,0);});
for(const kind of ['f','d','l'])test(`managed profile ${kind} blocks preparation before public body inspection or provisioning`,()=>{
 const m=mock();m.put(managedProfile,kind,'PROTECTED_NO_BODY_READ');const v=prepare(m);noAuthority(v);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.reason,'STOCK_LOGIN_BASIS_UNAVAILABLE');
 assert.deepEqual(m.state.opens,[]);assert.deepEqual(m.state.reads,[]);assert.deepEqual(m.state.mkdirs,[]);assert.deepEqual(m.state.writes,[]);assert.deepEqual(m.state.stats,[managedProfile]);assert.equal(m.fds.size,0);
});
for(const code of ['EACCES','EPERM','ENOTDIR','ELOOP','EIO'])test(`managed profile ${code} is UNKNOWN before preparation`,()=>{
 const m=mock();m.state.deniedPath=managedProfile;m.state.deniedCode=code;const v=prepare(m);noAuthority(v);assert.equal(v.outcome,'UNKNOWN');assert(!JSON.stringify(v).includes('PRIVATE_DETAIL'));
 assert.deepEqual(m.state.opens,[]);assert.deepEqual(m.state.reads,[]);assert.deepEqual(m.state.mkdirs,[]);assert.deepEqual(m.state.writes,[]);assert.deepEqual(m.state.stats,[managedProfile]);
});
for(const phase of ['BEFORE_NATIVE','AFTER_NATIVE'])for(const kind of ['f','d','l'])test(`new managed profile ${kind} invalidates ${phase} before reading bodies and remains invalid after removal`,()=>{
 const m=mock(),v=prepare(m);assert.equal(v.outcome,'STARTUP_PREPARED_NOT_LAUNCHED');m.put(managedProfile,kind,'PROTECTED_NO_BODY_READ');const reads=m.state.reads.length,opens=m.state.opens.length;
 const r=m.verify(v,phase);noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert.equal(m.state.reads.length,reads);assert.equal(m.state.opens.length,opens);assert(!m.state.reads.includes(managedProfile));
 m.nodes.delete(managedProfile);m.state.stats=[];assert.equal(m.verify(v,phase).outcome,'UNKNOWN');assert.deepEqual(m.state.stats,[]);assert.equal(m.fds.size,0);
});
for(const phase of ['BEFORE_NATIVE','AFTER_NATIVE'])for(const code of ['EACCES','EPERM'])test(`managed profile ${code} permanently invalidates ${phase}`,()=>{
 const m=mock(),v=prepare(m);m.state.deniedPath=managedProfile;m.state.deniedCode=code;const reads=m.state.reads.length;
 const r=m.verify(v,phase);noAuthority(r);assert.equal(r.outcome,'UNKNOWN');assert(!JSON.stringify(r).includes('PRIVATE_DETAIL'));assert.equal(m.state.reads.length,reads);
 m.state.deniedPath=null;m.state.stats=[];assert.equal(m.verify(v,phase).outcome,'UNKNOWN');assert.deepEqual(m.state.stats,[]);
});
test('managed profile appearing during preparation closing work prevents minting',()=>{
 const m=mock();m.state.afterRead=file=>{if(file===host+'/path-helper-root/etc/paths')m.put(managedProfile,'f','PROTECTED_NO_BODY_READ');};
 const v=prepare(m);noAuthority(v);assert.equal(v.outcome,'UNKNOWN');assert(!m.state.reads.includes(managedProfile));assert(!m.state.opens.includes(managedProfile));assert.equal(m.fds.size,0);
});
for(const phase of ['BEFORE_NATIVE','AFTER_NATIVE'])for(const fault of ['presence','EPERM'])test(`managed profile ${fault} during the final namespace lookup prevents ${phase} adoption`,()=>{
 const baseline=mock(),b=prepare(baseline);baseline.state.stats=[];assert.equal(baseline.verify(b,phase).outcome,'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY');
 const lastNamespaceLookup=baseline.state.stats.findLastIndex(file=>file!==managedProfile)+1;assert(lastNamespaceLookup>0);assert.equal(baseline.state.stats.at(-1),managedProfile);
 const m=mock(),v=prepare(m);m.state.stats=[];let injected=false;
 m.state.afterStat=()=>{if(m.state.stats.length===lastNamespaceLookup){injected=true;if(fault==='presence')m.put(managedProfile,'f','PROTECTED_NO_BODY_READ');else m.state.deniedPath=managedProfile;}};
 const r=m.verify(v,phase);noAuthority(r);assert.equal(injected,true);assert.equal(r.outcome,'UNKNOWN');assert(!m.state.reads.includes(managedProfile));assert(!m.state.opens.includes(managedProfile));assert.equal(m.fds.size,0);
 m.nodes.delete(managedProfile);m.state.deniedPath=null;m.state.afterStat=null;m.state.stats=[];assert.equal(m.verify(v,phase).outcome,'UNKNOWN');assert.deepEqual(m.state.stats,[]);
});
for(const fault of ['stat','realpath','etc-alias','absent-denied','open','read','close','mkdir','write','fsync','readdir'])test(`static ${fault} failure is redacted UNKNOWN and closes owned handles`,()=>{const m=mock();m.state.fault=fault;const v=prepare(m);assert.equal(v.outcome,'UNKNOWN');assert.equal(JSON.stringify(v).includes('PRIVATE_DETAIL'),false);assert.equal(m.fds.size,0);assert.equal(m.verify(v).outcome,'UNKNOWN');});
test('occupied host is never adopted or modified',()=>{const m=mock();m.put(host);assert.equal(prepare(m).outcome,'UNKNOWN');assert.equal(m.state.mkdirs.length,0);assert.equal(m.state.writes.length,0);});
for(const target of [...Object.keys(NATIVE_STDIO_STARTUP_BASIS.pins),host+'/path-helper-root/etc/paths'])for(const change of ['bytes','inode','owner','mode','hardlink','symlink'])test(`current ${path.posix.basename(target)} ${change} failure is permanently latched`,()=>{
 const m=mock(),v=prepare(m),row=m.nodes.get(target),old={...row,body:Buffer.from(row.body)};assert.equal(v.outcome,'STARTUP_PREPARED_NOT_LAUNCHED');
 if(change==='bytes')row.body[0]^=1;else if(change==='inode')row.ino++;else if(change==='owner')row.uid=999n;else if(change==='mode')row.mode|=0o22n;else if(change==='hardlink')row.nlink=2n;else row.kind='l';
 assert.equal(m.verify(v).outcome,'UNKNOWN');Object.assign(row,old);const reads=m.state.reads.length;assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.state.reads.length,reads);assert.equal(m.fds.size,0);
});
for(const target of [host,host+'/home',host+'/claude-config',host+'/gh-config',host+'/path-helper-root',host+'/path-helper-root/etc',host+'/path-helper-root/etc/paths.d',host+'/claude-config/shell-snapshots',host+'/claude-config/session-env'])test(`fixed ${path.posix.basename(target)} directory replacement refuses`,()=>{const m=mock(),v=prepare(m);m.nodes.get(target).ino++;assert.equal(m.verify(v).outcome,'UNKNOWN');});
for(const target of [host+'/home/.bashrc',host+'/home/.bash_profile',host+'/home/.profile',host+'/home/CLAUDE.md',host+'/gh-config/hook',host+'/path-helper-root/etc/paths.d/new',host+'/claude-config/plugins',host+'/claude-config/shell-snapshots/snapshot-bash-123-abc.sh',host+'/claude-config/session-env/setup-hook-0.sh'])test(`new startup source ${path.posix.basename(target)} is UNKNOWN without opening it`,()=>{const m=mock(),v=prepare(m);m.put(target,'f','PROTECTED_MUST_NOT_READ');const before=m.state.reads.length;assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'UNKNOWN');assert(!m.state.reads.slice(before).includes(target));});
test('post-native permits only one bounded normal empty UUID session directory, not shell scripts or aliases',()=>{
 const name='12345678-1234-4234-8234-123456789abc',m=mock(),v=prepare(m);m.put(host+'/claude-config/session-env/'+name,'d','',501,0o40755n);
 assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'STARTUP_CURRENTLY_OBSERVED_SOURCE_ONLY');noAuthority(m.verify(v,'AFTER_NATIVE'));
 m.put(host+'/claude-config/session-env/'+name+'/sessionstart-hook-0.sh','f','MUST_NOT_READ');assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'UNKNOWN');assert(!m.state.reads.some(p=>p.endsWith('sessionstart-hook-0.sh')));
 const other=mock(),w=prepare(other);other.put(host+'/claude-config/session-env/'+name);assert.equal(other.verify(w).outcome,'UNKNOWN');
});
test('late last data read mutating early global body cannot mint a current witness',()=>{const m=mock();m.state.afterRead=file=>{if(file===host+'/path-helper-root/etc/paths')m.nodes.get('/private/etc/profile').ino++;};assert.equal(prepare(m).outcome,'UNKNOWN');assert.equal(m.fds.size,0);});
test('late private build validation replacing early system row refuses the same call',()=>{const m=mock(),v=prepare(m);let once=false;m.state.afterBuild=()=>{if(!once){once=true;m.nodes.get('/private/etc/profile').ino++;}};assert.equal(m.verify(v).outcome,'UNKNOWN');});
for(const directory of [host+'/home',host+'/path-helper-root/etc/paths.d',host+'/claude-config/shell-snapshots',host+'/claude-config/session-env'])test(`late named-file work adding ${path.posix.basename(directory)} member invalidates closing membership`,()=>{
 const m=mock(),v=prepare(m);let dataReads=0,once=false;m.state.afterRead=file=>{if(file===host+'/path-helper-root/etc/paths')dataReads++;};
 m.state.afterStat=file=>{if(dataReads>0&&!once&&file===host+'/path-helper-root/etc/paths'){// wait until after bounded read and final state by using a named lookup counter
  m.state.namedCount=(m.state.namedCount??0)+1;if(m.state.namedCount===4){once=true;m.put(directory+'/late','f','MUST_NOT_READ');}}};
 assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(once,true);assert(!m.state.reads.some(p=>p.endsWith('/late')));assert.equal(m.fds.size,0);
});
test('caught nested failed validation cannot escape the permanent invalidation latch',()=>{
 const m=mock(),v=prepare(m);let once=false;m.state.afterRead=file=>{if(!once&&file===host+'/path-helper-root/etc/paths'){once=true;m.state.buildValid=false;assert.equal(m.verify(v).outcome,'UNKNOWN');m.state.buildValid=true;}};
 assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.fds.size,0);
});
test('source has no execution, caller callback, cleanup/adoption or broad system-config body walk',()=>{
 assert.doesNotMatch(source,/spawn|execFile|execSync|child_process|process\.env|rmSync|copyFile|readFileSync|\/etc\/paths\.d\//);
 assert.match(source,/PATH_HELPER_ROOT/);assert.match(source,/NOT_EMPIRICALLY_OBSERVED/);
});

for(const file of ['/Library/Application Support/ClaudeCode/CLAUDE.md','/Library/Application Support/ClaudeCode/.claude'])test('nonbare managed instruction/rules metadata blocks without reading bodies',()=>{
 const before=mock();before.put(file,'f','PROTECTED_NO_BODY_READ');assert.equal(prepare(before).outcome,'UNKNOWN');assert(!before.state.reads.includes(file));
 const after=mock(),value=prepare(after);after.put(file,'f','PROTECTED_NO_BODY_READ');assert.equal(after.verify(value,'AFTER_NATIVE').outcome,'UNKNOWN');assert(!after.state.reads.includes(file));assert.equal(after.verify(value).outcome,'UNKNOWN');
});

for(const leaf of ['skills','agents','output-styles'])test(`occupied managed ${leaf} is rejected through ancestor metadata only`,()=>{
 const m=mock(),root='/Library/Application Support/ClaudeCode/.claude';m.put(root,'d','',0,0o40755n);m.put(root+'/'+leaf,'d','',0,0o40755n);const v=prepare(m);assert.equal(v.outcome,'UNKNOWN');assert(!m.state.reads.some(file=>file.startsWith(root)));
});
test('late managed root appearance permanently invalidates private witness even after removal',()=>{
 const m=mock(),v=prepare(m),root='/Library/Application Support/ClaudeCode/.claude';m.put(root,'d','',0,0o40755n);assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'UNKNOWN');m.nodes.delete(root);assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'UNKNOWN');assert(!m.state.reads.some(file=>file.startsWith(root)));
});
test('unknown managedroot metadata permission refuses and cannot later recover same witness',()=>{
 const m=mock(),v=prepare(m),root='/Library/Application Support/ClaudeCode/.claude';const prior=m.state.reads.length;m.state.deniedPath=root;assert.equal(m.verify(v,'AFTER_NATIVE').outcome,'UNKNOWN');m.state.deniedPath=null;assert.equal(m.verify(v).outcome,'UNKNOWN');assert.equal(m.state.reads.length,prior); // Metadata failure is sufficient; no protected bodies opened.
});
