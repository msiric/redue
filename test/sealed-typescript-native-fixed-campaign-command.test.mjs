// Exact-source/private-capability mocks only. No copies, compiler, native/model,
// settings, authentication or effective-policy operation is performed.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {prepareSealedTypeScriptNativeFixedCampaignCommand as actual} from './acceptance/sealed-typescript-native-fixed-campaign-command.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-fixed-campaign-command.mjs',import.meta.url),'utf8');
const imports=['prepareSealedTypeScriptNativeBaseCommand','verifySealedTypeScriptBaseExchangeAssets','verifySealedTypeScriptPairedStageArtifacts','sealedTypeScriptPairedStageArtifactsMatchDerivation','verifySealedTypeScriptFixedCampaignLauncherBuild','sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation','verifySealedTypeScriptPairedStageSource','sealedTypeScriptPairedStageSourceMatchesDerivation','verifySealedTypeScriptFixedCampaignCopies','sealedTypeScriptFixedCampaignCopiesMatchDerivation','prepareSealedTypeScriptFixedCampaignSource','structuredClone'];
const construct=Function(...imports,source.replace(/^import .*;$/gm,'').replace('export function ','function ')+';return prepareSealedTypeScriptNativeFixedCampaignCommand;');
const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333';
const code=h+'/prefix/native-probes',node=h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry=code+'/paired-stage-campaign.mjs',launcher=code+'/paired-stage-campaign-launch',cwd=a+'/Checkout 空间/.sealed-native-canaries';
const nodePin='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const dependencyNames=['sealed-typescript-base-exchange-result.mjs','sealed-typescript-stage-exchange-result.mjs','sealed-typescript-stage-result.mjs','sealed-typescript-map-result.mjs','../../src/portable-envelope.mjs'];
const leaves=['test/acceptance/sealed-typescript-base-exchange-result.mjs','test/acceptance/sealed-typescript-stage-exchange-result.mjs','test/acceptance/sealed-typescript-stage-result.mjs','test/acceptance/sealed-typescript-map-result.mjs','src/portable-envelope.mjs','native-probes/paired-stage-campaign.mjs'].map(name=>h+'/prefix/'+name);
const refusal=call=>assert.throws(call,error=>error.code==='NATIVE_FIXED_CAMPAIGN_UNAVAILABLE'&&error.message==='NATIVE_FIXED_CAMPAIGN_UNAVAILABLE');
function fixture(){
 const pair={},hostFixture={},assetsBuild={report:{binary:{file:code+'/sealed-typescript-base-exchange-sentinel',sha256:'a'.repeat(64)}}},pairedSource={},
  pairedArtifacts={report:{sources:[{file:code+'/sealed-typescript-paired-stage-node.mjs',sha256:'b'.repeat(64)}],binaries:[{file:code+'/sealed-typescript-paired-stage-map',sha256:'c'.repeat(64)},{file:code+'/sealed-typescript-paired-stage-exchange',sha256:'d'.repeat(64)}]}};
 const roots={baseA:a,baseB:b,hostBase:h},pairedBindings={...roots,node,checker:pairedArtifacts.report.sources[0].file};
 const actors=[{role:'whole_base',file:assetsBuild.report.binary.file,args:[],fileSha256:'a'.repeat(64)},{role:'stage_exchange',file:pairedArtifacts.report.binaries[1].file,args:[],fileSha256:'d'.repeat(64)},
  {role:'node_stage',file:node,args:[pairedArtifacts.report.sources[0].file],fileSha256:nodePin,argumentSha256:'b'.repeat(64)},{role:'mapper',file:pairedArtifacts.report.binaries[0].file,args:[],fileSha256:'c'.repeat(64)}];
 const rendered={scope:'DISABLED_FIXED_CAMPAIGN_SOURCE_DATA_ONLY',disabled:true,...roots,node,entry,cwd,actors,source:'// SYNTHETIC DATA NEVER EXECUTED',sourceSha256:'e'.repeat(64),
  dependencyPins:dependencyNames.map((name,at)=>({name,sha256:String(at+1).repeat(64)})),blockers:['CURRENT_PROTECTED_CAMPAIGN_COPY_AND_PRE_NODE_LAUNCHER_NOT_PROVISIONED','EXACT_NATIVE_COMMAND_AND_TOOL_RESULT_NOT_BOUND']};
 const copyBindings={...roots,node,entry,cwd,campaignSha256:rendered.sourceSha256};
 const copies={report:{bindings:copyBindings,files:leaves.map((file,at)=>({file,sha256:at===5?rendered.sourceSha256:rendered.dependencyPins[at].sha256}))}};
 const bindings={...copyBindings,launcher,launcherSource:launcher+'.c',launcherSourceSha256:'f'.repeat(64),nodeSha256:nodePin};
 const campaignLauncherBuild={report:{...roots,bindings,source:{file:launcher+'.c',sha256:bindings.launcherSourceSha256},binary:{file:launcher,sha256:'9'.repeat(64)}}};
 const observations={
  assets:{scope:'OBSERVED_BASE_EXCHANGE_BUILD_DATA_ONLY',outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',...roots},
  source:{scope:'DISABLED_PAIRED_STAGE_ASSERTION_SOURCES_DATA_ONLY',outcome:'PAIRED_STAGE_SOURCE_CURRENTLY_OBSERVED_NOT_PROVISIONED',...roots,node,bindings:pairedBindings},
  artifacts:{scope:'PAIRED_STAGE_ENGINEERING_ARTIFACTS_DATA_ONLY',outcome:'PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED',...roots,bindings:pairedBindings},
  copies:{scope:'FIXED_CAMPAIGN_COPIES_DATA_ONLY',outcome:'CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED',...copyBindings},
  launcher:{scope:'FIXED_CAMPAIGN_LAUNCHER_BUILD_DATA_ONLY',outcome:'CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',...roots,bindings,launcherSha256:'9'.repeat(64),launcherSourceSha256:bindings.launcherSourceSha256}
 };
 const direct={schema:1,scope:'DISABLED_FIXED_NATIVE_BASE_COMMAND_PROPOSAL_ONLY',disabled:true,command_proposed:"'"+actors[0].file+"'",binary_sha256_proposed:'a'.repeat(64),cwd_proposed:cwd,
  settings_file_proposed:h+'/claude-host/settings.json',host_config_directory_proposed:h+'/claude-host/claude-config',gh_config_directory_proposed:h+'/claude-host/gh-config',
  argv_proposed:['--print','--verbose','--output-format','stream-json','--max-turns','4','--permission-mode','dontAsk','--tools','Bash','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--settings',h+'/claude-host/settings.json','--no-session-persistence','FIXED_PROMPT'],
  settings_proposed:{permissions:{allow:['Bash('+ "'"+actors[0].file+"'" +')'],deny:['Read','Write','Bash(node:*)']},
   sandbox:{enabled:true,allowUnsandboxedCommands:false,excludedCommands:[],filesystem:{allowRead:[a+'/sealed-inputs',cwd,'/bin/bash',actors[0].file],denyRead:['/',h+'/claude-host'],denyWrite:[h],allowWrite:[cwd]},
    credentials:{envVars:[{name:'CLAUDE_CODE_OAUTH_TOKEN',mode:'deny'}]},network:{allowUnixSockets:[],allowedDomains:[],deniedDomains:['*']}}},
  policy_interpretation:'redue-native187-paired-base-canary@1',max_turns_proposed:4,parent_timeout_ms_proposed:120000,tool_timeout_ms_proposed:15000,
  blockers:['EXACT_NATIVE_WRITE_AND_READ_VIEW_NOT_OBSERVED','IN_PLACE_AUTH_NAMESPACE_AND_INCLUDED_CAPACITY_REQUIRED'],commands:[],nativeLaunches:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false};
 const options={pair,hostFixture,assetsBuild,pairedSource,pairedArtifacts,copies,campaignLauncherBuild,claudeExecutable:h+'/native/claude',claudeSha256:'a'.repeat(64),claudeVersion:'2.1.187'};
 const counts={assets:0,source:0,artifacts:0,copies:0,launcher:0,policy:0,render:0,clone:0},events=[],state={invalid:null,late:null,during:null,rendererChanged:false};
 const checked=(kind,value,wanted)=>{
  events.push(kind);counts[kind]++;
  if(kind==='copies'&&counts.copies===2&&state.during==='last-copies')state.invalid='launcher';
  if(value!==wanted||state.invalid===kind||state.late===kind&&counts[kind]>1)return{outcome:'UNKNOWN'};
  return structuredClone(observations[kind]);
 };
 const linked=(name,expected,values)=>{events.push(name);return values.every((value,at)=>value===expected[at]);};
 const funcs={
  prepareSealedTypeScriptNativeBaseCommand(value){events.push('policy');counts.policy++;assert.deepEqual(value,{pair,hostFixture,assetsBuild,claudeExecutable:options.claudeExecutable,claudeSha256:options.claudeSha256,claudeVersion:options.claudeVersion});if(state.during==='policy')state.invalid='copies';return direct;},
  verifySealedTypeScriptBaseExchangeAssets:value=>checked('assets',value,assetsBuild),
  verifySealedTypeScriptPairedStageSource:value=>checked('source',value,pairedSource),
  verifySealedTypeScriptPairedStageArtifacts:value=>checked('artifacts',value,pairedArtifacts),
  verifySealedTypeScriptFixedCampaignCopies:value=>checked('copies',value,copies),
  verifySealedTypeScriptFixedCampaignLauncherBuild:value=>checked('launcher',value,campaignLauncherBuild),
  sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation:(...v)=>linked('launcher-link',[campaignLauncherBuild,assetsBuild,pairedSource,pairedArtifacts,copies],v),
  sealedTypeScriptPairedStageSourceMatchesDerivation:(...v)=>linked('source-link',[pairedSource,pair,assetsBuild],v),
  sealedTypeScriptPairedStageArtifactsMatchDerivation:(...v)=>linked('artifacts-link',[pairedArtifacts,assetsBuild,pairedSource],v),
  sealedTypeScriptFixedCampaignCopiesMatchDerivation:(...v)=>linked('copies-link',[copies,assetsBuild,pairedArtifacts,pairedSource],v),
  prepareSealedTypeScriptFixedCampaignSource(value){events.push('render');counts.render++;assert.deepEqual(value,{assetsBuild,pairedArtifacts,pairedSource});if(counts.render===2&&state.during==='last-render')state.invalid='copies';return structuredClone(counts.render===2&&state.rendererChanged?{...rendered,source:'CHANGED'}:rendered);},
  structuredClone(value){events.push('clone');counts.clone++;if(state.during==='clone')state.invalid='launcher';return structuredClone(value);}
 };
 const make=construct(...imports.map(name=>funcs[name]));
 return{make,options,state,counts,events,direct,rendered,observations,actors,bindings,copies,campaignLauncherBuild,pairedArtifacts};
}
test('literal campaign launcher binds six copies, Node and three paired actor leaves without other permission changes',()=>{
 const f=fixture(),original=structuredClone(f.direct),out=f.make(f.options),added=[node,...leaves,f.actors[1].file,f.actors[2].args[0],f.actors[3].file,launcher];
 assert.equal(out.command_proposed,"'"+launcher+"'");assert.deepEqual(out.settings_proposed.permissions.allow,["Bash('"+launcher+"')"]);
 assert.deepEqual(out.exact_added_read_leaves,added);assert.equal(out.exact_executable_leaf,launcher);assert.deepEqual(out.actors_proposed,f.actors);
 const expected=structuredClone(original.settings_proposed);expected.permissions.allow=["Bash('"+launcher+"')"];expected.sandbox.filesystem.allowRead.push(...added);assert.deepEqual(out.settings_proposed,expected);assert.deepEqual(f.direct,original);
 assert.deepEqual(out.argv_proposed.slice(0,-1),original.argv_proposed.slice(0,-1));assert(out.argv_proposed.at(-1).includes(out.command_proposed));
 for(const forbidden of [node,entry,'base-exchange-collect-launch','sealed-typescript-base-exchange-sentinel'])assert(!out.argv_proposed.at(-1).includes(forbidden));
 assert(!added.includes(h));assert(!added.includes(h+'/prefix'));assert(!added.includes(h+'/prefix/native-probes'));assert(!added.some(file=>file.endsWith('.c')));
 assert.equal(out.max_turns_proposed,4);assert.equal(out.parent_timeout_ms_proposed,120000);assert.equal(out.tool_timeout_ms_proposed,15000);
 assert.equal(out.binary_sha256_proposed,'9'.repeat(64));assert.equal(out.launcher_source_sha256_proposed,'f'.repeat(64));assert.equal(out.campaign_sha256_proposed,'e'.repeat(64));
 for(const key of ['inferencePermitted','sealed','reuseEligible'])assert.equal(out[key],false);assert(out.disabled);assert.deepEqual(out.commands,[]);assert.equal(out.nativeLaunches,0);assert.equal(out.models,0);assert.equal(out.nativeEnforcement,'NOT_TESTED');
 for(const blocker of [...f.direct.blockers,...f.rendered.blockers,'ENCLOSING_PARENT_MUST_PREVENT_LAUNCHER_PRE_MAIN_LOADER_INJECTION','INHERITED_HANDLES_NOT_VERIFIED','OTHER_STAGE_ASSERTIONS_NOT_IMPLEMENTED'])assert(out.blockers.includes(blocker));
 assert(Object.isFrozen(out)&&Object.isFrozen(out.settings_proposed)&&Object.isFrozen(out.actors_proposed[0].args));assert.equal(f.events.at(-1),'launcher');
 assert.deepEqual(f.counts,{assets:2,source:2,artifacts:2,copies:2,launcher:2,policy:1,render:2,clone:1});
});
for(const key of ['pair','assetsBuild','pairedSource','pairedArtifacts','copies','campaignLauncherBuild'])test('forged, serialized or mixed '+key+' is refused before paths, verifiers and policy',()=>{
 for(const replacement of [{},JSON.parse(JSON.stringify(fixture().options[key])),{get report(){assert.fail('caller path accessed');}}]){
  const f=fixture();refusal(()=>f.make({...f.options,[key]:replacement}));assert.equal(f.counts.policy,0);assert.equal(f.counts.render,0);assert.equal(f.counts.assets,0);assert.equal(f.counts.launcher,0);
 }
});
for(const kind of ['assets','source','artifacts','copies','launcher'])test('unavailable current '+kind+' admits no renderer or policy',()=>{
 const f=fixture();f.state.invalid=kind;refusal(()=>f.make(f.options));assert.equal(f.counts.policy,0);assert.equal(f.counts.render,0);
});
for(const kind of ['assets','source','artifacts','copies','launcher'])test('late lost '+kind+' is rejected by final currency group',()=>{
 const f=fixture();f.state.late=kind;refusal(()=>f.make(f.options));assert.equal(f.counts.render,2);assert.equal(f.events.at(-1),'launcher');
});
for(const during of ['policy','clone','last-render','last-copies'])test('changes during '+during+' cannot hide behind source/policy reads',()=>{
 const f=fixture();f.state.during=during;refusal(()=>f.make(f.options));assert.equal(f.events.at(-1),'launcher');
});
test('changed final renderer/dependency bytes refuse instead of authorizing earlier copies',()=>{const f=fixture();f.state.rendererChanged=true;refusal(()=>f.make(f.options));assert.equal(f.counts.render,2);assert.equal(f.counts.launcher,1);});
const patches={
 sourceRoot:f=>f.observations.source.baseA=b,artifactBindings:f=>f.observations.artifacts.bindings={node:'/OTHER'},copyRoot:f=>f.observations.copies.hostBase=a,launcherRoot:f=>f.observations.launcher.baseB=a,
 rendererEntry:f=>f.rendered.entry=node,rendererActor:f=>f.rendered.actors[1].file=node,rendererArgs:f=>f.rendered.actors[0].args=['OTHER'],rendererHash:f=>f.rendered.sourceSha256='INVALID',rendererDependency:f=>f.rendered.dependencyPins[0].name='OTHER',
 copyLeaf:f=>f.copies.report.files[0].file=h,copyHash:f=>f.copies.report.files[0].sha256='0'.repeat(64),copyCount:f=>f.copies.report.files.pop(),copyBinding:f=>f.copies.report.bindings={},
 node:f=>f.bindings.node='/OTHER',nodePin:f=>f.bindings.nodeSha256='0'.repeat(64),entry:f=>f.bindings.entry=node,cwd:f=>f.bindings.cwd=h,launcher:f=>f.bindings.launcher=code+'/base-exchange-collect-launch',
 launcherSource:f=>f.bindings.launcherSource=entry,sourceHash:f=>f.bindings.launcherSourceSha256='0'.repeat(64),binaryPath:f=>f.campaignLauncherBuild.report.binary.file=node,binaryHash:f=>f.campaignLauncherBuild.report.binary.sha256='0'.repeat(64),
 builtBinding:f=>f.campaignLauncherBuild.report.bindings={...f.bindings,entry:node},builtHost:f=>f.campaignLauncherBuild.report.hostBase=a,
 pairedSourcePath:f=>f.pairedArtifacts.report.sources[0].file=entry,pairedMapPath:f=>f.pairedArtifacts.report.binaries[0].file=launcher,pairedExchangePath:f=>f.pairedArtifacts.report.binaries[1].file=launcher,
 directFallback:f=>f.direct.command_proposed="'"+node+"' '"+entry+"'",directCwd:f=>f.direct.cwd_proposed=h,directSettings:f=>f.direct.settings_file_proposed=a+'/settings.json',
 directBinary:f=>f.direct.binary_sha256_proposed='0'.repeat(64),turns:f=>f.direct.max_turns_proposed=5,parentDeadline:f=>f.direct.parent_timeout_ms_proposed=120001,toolDeadline:f=>f.direct.tool_timeout_ms_proposed=15001,
 hostWriteProtection:f=>f.direct.settings_proposed.sandbox.filesystem.denyWrite=[]
};
for(const [name,change]of Object.entries(patches))test('fixed current binding mismatch refuses '+name,()=>{const f=fixture();change(f);refusal(()=>f.make(f.options));});
test('extra options, inherited shapes, accessors and arguments refuse without caller behavior',()=>{
 const f=fixture();let reads=0;const getter={...f.options};Object.defineProperty(getter,'campaignLauncherBuild',{get(){reads++;return f.options.campaignLauncherBuild;}});
 for(const value of [null,Object.assign(Object.create({}),f.options),getter,{...f.options,env:{}},{...f.options,command:'OTHER'},{...f.options,argv:[]},{...f.options,permissions:{}},{...f.options,[Symbol()]:true}])refusal(()=>f.make(value));
 const {campaignLauncherBuild,...missing}=f.options;refusal(()=>f.make(missing));refusal(()=>f.make({...f.options,campaignLauncherBuild:undefined}));refusal(()=>f.make(f.options,{}));
 assert.equal(reads,0);assert.equal(f.counts.policy,0);assert.equal(f.counts.assets,0);
});
test('actual ESM initialization and forged capability refusal execute no path getter or native operation',()=>{
 let reads=0;const fake={get report(){reads++;throw Error('PRIVATE');}},options={pair:fake,hostFixture:fake,assetsBuild:fake,pairedSource:fake,pairedArtifacts:fake,copies:fake,campaignLauncherBuild:fake,claudeExecutable:'/UNREAD',claudeSha256:'a'.repeat(64),claudeVersion:'2.1.187'};
 refusal(()=>actual(options));assert.equal(reads,0);
});
test('command leaf has no filesystem operations, native dispatch, environment handling or shared policy framework',()=>{
 assert.doesNotMatch(source,/\bspawn\w*\(|\bexec\w*\(|\beval\(|\bFunction\(|fs\.|process\.env/);
 assert(!source.includes('Bash(node:*)'));assert(!source.includes('allowRead=[h'));assert(source.includes('prepareSealedTypeScriptNativeBaseCommand(directOptions)'));
});
