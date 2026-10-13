// Exact-source/private-capability mocks only; no provisioning/native/model.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-base-collector-command.mjs',import.meta.url),'utf8');
const create=Function('prepareSealedTypeScriptNativeBaseCommand','verifySealedTypeScriptBaseCollectorSource','verifySealedTypeScriptBaseCollectorLauncherBuild','sealedTypeScriptBaseCollectorLauncherBuildMatchesDerivation','structuredClone',source.replace(/^import .*;$/gm,'').replace('export function ','function ')+';return prepareSealedTypeScriptNativeBaseCollectorCommand;');
const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',helper=h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel',node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=h+'/prefix/native-probes/base-exchange-collect.mjs',launcher=h+'/prefix/native-probes/base-exchange-collect-launch';
const leaves=['test/acceptance/sealed-typescript-base-child-collection.mjs','test/acceptance/sealed-typescript-base-exchange-result.mjs','src/portable-envelope.mjs','native-probes/base-exchange-collect.mjs'].map(name=>h+'/prefix/'+name);
function fixture(){
 const bindings={baseA:a,baseB:b,hostBase:h,node,entry,helper,helperSha256:'a'.repeat(64),nodeSha256:'5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc',collectorSha256:'c'.repeat(64),launcher,launcherSource:launcher+'.c',launcherSourceSha256:'d'.repeat(64)};
 const direct={command_proposed:"'"+helper+"'",cwd_proposed:a+'/Checkout 空间/.sealed-native-canaries',settings_file_proposed:h+'/claude-host/settings.json',binary_sha256_proposed:bindings.helperSha256,argv_proposed:['--print','--max-turns','4','--settings',h+'/claude-host/settings.json','FIXED_PROMPT'],settings_proposed:{permissions:{allow:[`Bash('${helper}')`],deny:['Read','Write','Bash(node:*)']},sandbox:{filesystem:{allowRead:[a+'/sealed-inputs',helper,'/bin/bash'],denyRead:['/',h+'/claude-host'],denyWrite:[h],allowWrite:[a+'/Checkout 空间/.sealed-native-canaries']},credentials:{envVars:[{name:'CLAUDE_CODE_OAUTH_TOKEN',mode:'deny'}]},network:{allowUnixSockets:[],allowedDomains:[],deniedDomains:['*']}}},blockers:['NOT_TESTED']};
 const assetsBuild={},collectorSource={proposedSources:leaves.map(file=>({file,sha256:'c'.repeat(64)})),proposedLauncher:{disabled:true,file:launcher+'.c',output:launcher,sha256:bindings.launcherSourceSha256}};
 const launcherBuild={report:{base:h,bindings,source:{file:launcher+'.c',sha256:bindings.launcherSourceSha256},binary:{file:launcher,sha256:'b'.repeat(64)}}};
 const sourceObservation={scope:'DISABLED_FIXED_BASE_COLLECTOR_SOURCE_DATA_ONLY',outcome:'SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',baseA:a,baseB:b,hostBase:h,bindings};
 const launcherObservation={scope:'FIXED_BASE_COLLECTOR_LAUNCHER_BUILD_DATA_ONLY',outcome:'LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',baseA:a,baseB:b,hostBase:h,bindings,launcherSha256:'b'.repeat(64),launcherSourceSha256:bindings.launcherSourceSha256};
 const counts={links:0,sourceChecks:0,launcherChecks:0,plans:0},events=[],state={source:true,launcher:true,lateSource:true,lateLauncher:true,invalidateDuringPlan:false,invalidateDuringClone:false,invalidateLauncherDuringLastSource:false};
 const make=create(value=>{events.push('policy');counts.plans++;assert.deepEqual(value,{pair:options.pair,hostFixture:options.hostFixture,assetsBuild,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion});if(state.invalidateDuringPlan)state.launcher=false;return direct;},
  value=>{events.push('source');counts.sourceChecks++;if(counts.sourceChecks===2&&state.invalidateLauncherDuringLastSource)state.launcher=false;return value===collectorSource&&state.source&&(counts.sourceChecks===1||state.lateSource)?structuredClone(sourceObservation):{outcome:'UNKNOWN'};},
  value=>{events.push('launcher');counts.launcherChecks++;return value===launcherBuild&&state.launcher&&(counts.launcherChecks===1||state.lateLauncher)?structuredClone(launcherObservation):{outcome:'UNKNOWN'};},
  (value,parent,proposal)=>{events.push('link');counts.links++;return value===launcherBuild&&parent===assetsBuild&&proposal===collectorSource;},
  value=>{events.push('clone');if(state.invalidateDuringClone)state.launcher=false;return structuredClone(value);});
 const options={pair:{},hostFixture:{},assetsBuild,collectorSource,launcherBuild,claudeExecutable:h+'/native/claude',claudeSha256:'a'.repeat(64),claudeVersion:'2.1.187'};
 return{make,state,direct,bindings,collectorSource,launcherBuild,assetsBuild,sourceObservation,launcherObservation,options,counts,events};
}
const refusal=call=>assert.throws(call,{code:'NATIVE_BASE_COLLECTOR_UNAVAILABLE'});

test('only literal launcher without arguments is admitted; five existing reads plus launcher leaf, no broader grants',()=>{
 const f=fixture(),out=f.make(f.options);assert.equal(out.command_proposed,"'"+launcher+"'");assert.deepEqual(out.settings_proposed.permissions.allow,[`Bash('${launcher}')`]);
 assert.deepEqual(out.settings_proposed.permissions.deny,f.direct.settings_proposed.permissions.deny);
 for(const key of ['credentials','network'])assert.deepEqual(out.settings_proposed.sandbox[key],f.direct.settings_proposed.sandbox[key]);
 assert.deepEqual(out.settings_proposed.sandbox.filesystem,{...f.direct.settings_proposed.sandbox.filesystem,allowRead:[...f.direct.settings_proposed.sandbox.filesystem.allowRead,node,...leaves,launcher]});
 assert.deepEqual(out.exact_added_read_leaves,[node,...leaves,launcher]);assert.equal(out.exact_executable_leaf,launcher);
 assert(!out.exact_added_read_leaves.includes(launcher+'.c'));assert(!out.exact_added_read_leaves.includes(h));assert(out.argv_proposed.at(-1).includes(out.command_proposed));
 assert(!out.argv_proposed.at(-1).includes(node));assert(!out.argv_proposed.at(-1).includes(entry));
 assert.equal(out.binary_sha256_proposed,'b'.repeat(64));assert.equal(out.helper_binary_sha256_proposed,f.bindings.helperSha256);assert.equal(out.launcher_source_sha256_proposed,f.bindings.launcherSourceSha256);
 for(const key of ['inferencePermitted','sealed','reuseEligible'])assert.equal(out[key],false);for(const key of ['nativeLaunches','models'])assert.equal(out[key],0);
 assert.equal(out.disabled,true);assert.deepEqual(out.commands,[]);assert(Object.isFrozen(out.settings_proposed));
 assert(out.blockers.includes('ENCLOSING_PARENT_MUST_PREVENT_LAUNCHER_PRE_MAIN_LOADER_INJECTION'));assert(out.blockers.includes('OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED'));
 assert.deepEqual(f.counts,{links:1,sourceChecks:2,launcherChecks:2,plans:1});assert.deepEqual(f.events,['link','source','launcher','policy','clone','source','launcher']);
});
for(const key of ['launcherBuild','assetsBuild','collectorSource'])test('serialized or mismatched private '+key+' derivation refuses before path access and policy',()=>{
 const f=fixture();for(const value of [JSON.parse(JSON.stringify(f.options[key])),{get report(){throw Error('PRIVATE PATH');},get proposedSources(){throw Error('PRIVATE SOURCE');}}]){
 refusal(()=>f.make({...f.options,[key]:value}));assert.equal(f.counts.plans,0);assert.equal(f.counts.sourceChecks,0);assert.equal(f.counts.launcherChecks,0);}
});
test('missing or undefined launcher cannot fall back to unconditional Node command',()=>{
 const f=fixture(),{launcherBuild,...oldOptions}=f.options;refusal(()=>f.make(oldOptions));refusal(()=>f.make({...f.options,launcherBuild:undefined}));
 assert.equal(f.counts.plans,0);assert.equal(f.counts.sourceChecks,0);assert.equal(f.counts.launcherChecks,0);
});
for(const key of ['source','launcher'])test('unavailable current '+key+' refuses before policy construction',()=>{
 const f=fixture();f.state[key]=false;refusal(()=>f.make(f.options));assert.equal(f.counts.plans,0);
});
for(const which of ['sourcePair','host','helperHash','helperPath','nodePath','nodeHash','entry','leaf','leafHash','collectorHash','launcherPath','launcherSourcePath','launcherSourceHash','binaryFile','binaryHash','sourceFile','sourceHash','renderedOutput','renderedSourceHash','launchPair','launchHost','launchBindings','launchHash','launchSourceHash','builtBindings','directNode'])
 test('full command A/B/H/code/binary/source bindings reject '+which,()=>{
  const f=fixture();
  if(which==='sourcePair')f.bindings.baseA=b;if(which==='host')f.direct.settings_file_proposed=b+'/claude-host/settings.json';
  if(which==='helperHash')f.direct.binary_sha256_proposed='b'.repeat(64);if(which==='helperPath')f.bindings.helper=helper+'-other';
  if(which==='nodePath')f.bindings.node=node+'-other';if(which==='nodeHash')f.bindings.nodeSha256='e'.repeat(64);if(which==='entry')f.bindings.entry=entry+'-other';
  if(which==='leaf')f.collectorSource.proposedSources[0].file=h;if(which==='leafHash')f.collectorSource.proposedSources[0].sha256='INVALID';
  if(which==='collectorHash')f.bindings.collectorSha256='e'.repeat(64);if(which==='launcherPath')f.bindings.launcher=node;
  if(which==='launcherSourcePath')f.bindings.launcherSource=entry;if(which==='launcherSourceHash')f.bindings.launcherSourceSha256='e'.repeat(64);
  if(which==='binaryFile')f.launcherBuild.report.binary.file=node;if(which==='binaryHash')f.launcherBuild.report.binary.sha256='e'.repeat(64);
  if(which==='sourceFile')f.launcherBuild.report.source.file=entry;if(which==='sourceHash')f.launcherBuild.report.source.sha256='e'.repeat(64);
  if(which==='renderedOutput')f.collectorSource.proposedLauncher.output=node;if(which==='renderedSourceHash')f.collectorSource.proposedLauncher.sha256='e'.repeat(64);
  if(which==='launchPair')f.launcherObservation.baseB=a;if(which==='launchHost')f.launcherObservation.hostBase=a;
  if(which==='launchBindings')f.launcherObservation.bindings={...f.bindings,entry:node};if(which==='launchHash')f.launcherObservation.launcherSha256='INVALID';
  if(which==='launchSourceHash')f.launcherObservation.launcherSourceSha256='e'.repeat(64);if(which==='builtBindings')f.launcherBuild.report.bindings={...f.bindings,node:entry};
  if(which==='directNode')f.direct.command_proposed="'"+node+"' '"+entry+"'";
  refusal(()=>f.make(f.options));
 });
for(const which of ['lateSource','lateLauncher','invalidateDuringPlan','invalidateDuringClone','invalidateLauncherDuringLastSource'])test('final launcher barrier follows policy/source reads and refuses '+which,()=>{
 const f=fixture();if(which.startsWith('late'))f.state[which]=false;else f.state[which]=true;
 refusal(()=>f.make(f.options));assert.equal(f.counts.sourceChecks,2);assert.equal(f.counts.launcherChecks,2);assert.equal(f.events.at(-1),'launcher');
});
test('accessors or extra env/permissions/command options never evaluate',()=>{
 const f=fixture();let read=false;refusal(()=>f.make({...f.options,get launcherBuild(){read=true;return f.launcherBuild;}}));assert.equal(read,false);
 for(const key of ['env','permissions','command'])refusal(()=>f.make({...f.options,[key]:true}));assert.deepEqual(f.counts,{links:0,sourceChecks:0,launcherChecks:0,plans:0});
});
