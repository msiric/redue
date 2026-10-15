// Exact-source/private-capability mocks only. No real fixture, SDK, compiler,
// settings, credential, native command, model or effective policy is exercised.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {posix as path} from 'node:path';
import {prepareSealedTypeScriptNativeEnclosureCommand as actual} from './acceptance/sealed-typescript-native-enclosure-command.mjs';
import {prepareClaudeReceiverInvocation,REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-invocation.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-enclosure-command.mjs',import.meta.url),'utf8');
const imports=['createHash','path','REVIEWED_CLAUDE_NATIVE','prepareSealedTypeScriptNativeBaseCommand','sealedTypeScriptBaseExchangeAssetsMatchPair','sealedTypeScriptBaseExchangeAssetsMatchHostFixture','sealedTypeScriptBaseExchangeAssetsFixtureProfile','sealedTypeScriptFixedCanaryProtectedInputProjectionHCodeReadLeaves','sealedTypeScriptPairedStageSourceMatchesDerivation','sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation','sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource','verifySealedTypeScriptFixedCampaignEnclosureBuild','structuredClone'];
const construct=Function(...imports,source.replace(/^import .*;$/gm,'').replace('export function ','function ')+';return prepareSealedTypeScriptNativeEnclosureCommand;');
const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',code=h+'/prefix/native-probes',cwd=a+'/Checkout 空间/.sealed-native-canaries',baseCode=code+'/sealed-typescript-base-exchange-sentinel';
const self=code+'/paired-stage-enclosure',launcher=code+'/paired-stage-enclosed-campaign-launch',six=[code+'/paired-stage-enclosed-original-inputs.mjs',code+'/paired-stage-enclosed-campaign.mjs',launcher+'.c',self+'.c',launcher,self];
const originalNames=['sealed-typescript-native-sentinel.mjs','sealed-typescript-map-sentinel.c','sealed-typescript-exchange-sentinel.c','sealed-typescript-map-sentinel','sealed-typescript-exchange-sentinel','sealed-typescript-base-exchange-sentinel.c','sealed-typescript-base-exchange-sentinel','sealed-typescript-paired-stage-node.mjs','sealed-typescript-paired-stage-map.c','sealed-typescript-paired-stage-exchange.c','sealed-typescript-paired-stage-map','sealed-typescript-paired-stage-exchange','paired-stage-campaign.mjs','paired-stage-campaign-launch.c','paired-stage-campaign-launch'];
const originalLeaves=[...originalNames.map(name=>code+'/'+name),h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',...['sealed-typescript-base-exchange-result.mjs','sealed-typescript-stage-exchange-result.mjs','sealed-typescript-stage-result.mjs','sealed-typescript-map-result.mjs'].map(name=>h+'/prefix/test/acceptance/'+name),h+'/prefix/src/portable-envelope.mjs'];
const refusal=call=>assert.throws(call,error=>error.code==='NATIVE_ENCLOSURE_COMMAND_UNAVAILABLE'&&error.message==='NATIVE_ENCLOSURE_COMMAND_UNAVAILABLE');
function fixture(fixtureProfile='fixed-native-assets-local-sdk27@1'){
 const ci=fixtureProfile==='fixed-native-assets-ci-sdk26.5-toolpair-b@1';
 const caps=Object.fromEntries(['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild'].map(key=>[key,{}]));
 const collectionTransport={interpretation:'finite-enclosure-normal-collection@2',frame:'RDE2',completeCollectionExit:0,incompleteCollectionExit:74,collectorExit:{E:74,F:1},assertionAuthority:'JSON_BODY_ONLY_NOT_OUTER_EXIT',nativeResultAcceptance:'NOT_TESTED'};
 Object.assign(caps.projection,{version:'fixed-canary-original-input-projection@3',projectionSha256:'a'.repeat(64)});
 Object.assign(caps.enclosureSource,{scope:'DISABLED_FIXED_CANARY_FINITE_ENCLOSURE_SOURCE_DATA_ONLY',version:'fixed-canary-finite-enclosure-source@2',disabled:true,runnable:false,executionAuthority:'NONE',projectionSha256:'a'.repeat(64),collectionTransport,
  bindings:{baseA:a,baseB:b,hostBase:h,node:h+'/runtime/node-v22.13.0-darwin-arm64/bin/node',entry:six[1],projectionEntry:six[0],launcher,self,cwd},files:six.slice(0,4).map((file,at)=>({file,sourceSha256:String(at+1).repeat(64)}))});
 caps.enclosureBuild.report={profileId:ci?'fixed-enclosure-ci-sdk26.5-toolpair-b@1':'fixed-enclosure-local-sdk27@1'};
 if(ci)caps.enclosureSource.fixtureProfileId=fixtureProfile;
 const observed={scope:'FIXED_CANARY_ENCLOSURE_POSTBUILD_DATA_ONLY',outcome:'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',hostBase:h,bindings:caps.enclosureSource.bindings,files:six.map((file,at)=>({file,digest:String(at+1).repeat(64),mark:'MOCK_ORIGINAL',lineage:[]})),originalRowsScope:'POSTBUILD_PRE_NATIVE_ENDPOINTS_ONLY',nativeIntervalBarrier:'NOT_ESTABLISHED'};
 const leafData={outcome:'FIXED_ORIGINAL_H_CODE_READ_LEAVES_DATA_ONLY',version:'fixed-canary-original-input-projection@3',hostBase:h,readLeaves:originalLeaves,currency:'NOT_CHECKED'};
 const native={claudeExecutable:h+'/native/claude',claudeSha256:REVIEWED_CLAUDE_NATIVE.sha256,claudeVersion:REVIEWED_CLAUDE_NATIVE.version};
 // Start from the actual fixed PURE proposal's complete restrictions rather
 // than a minimal mock which might silently omit protected credentials.
 const receiver=prepareClaudeReceiverInvocation({base:h,...native}),settings=receiver.settings_proposed;
 settings.permissions.allow=[`Bash('${baseCode}')`];settings.sandbox.filesystem.allowWrite=[cwd];settings.sandbox.filesystem.allowRead=[a+'/sealed-inputs',cwd,'/bin/bash',baseCode];settings.sandbox.filesystem.denyRead.push('/');settings.sandbox.filesystem.denyWrite.push(a+'/sealed-inputs',baseCode,h);settings.sandbox.network.allowUnixSockets=[];
 const direct={schema:1,scope:'DISABLED_FIXED_NATIVE_BASE_COMMAND_PROPOSAL_ONLY',disabled:true,command_proposed:"'"+baseCode+"'",binary_sha256_proposed:'b'.repeat(64),cwd_proposed:cwd,
  settings_file_proposed:h+'/claude-host/settings.json',host_config_directory_proposed:h+'/claude-host/claude-config',gh_config_directory_proposed:h+'/claude-host/gh-config',
  argv_proposed:['--print','--verbose','--output-format','stream-json','--max-turns','4','--permission-mode','dontAsk','--tools','Bash','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--settings',h+'/claude-host/settings.json','--no-session-persistence','FIXED_OLD_PROMPT'],settings_proposed:settings,
  max_turns_proposed:4,parent_timeout_ms_proposed:120000,tool_timeout_ms_proposed:15000,policy_interpretation:'redue-native187-paired-base-canary@1',blockers:['PENDING_NATIVE'],commands:[],nativeLaunches:0,models:0,inferencePermitted:false,nativeEnforcement:'NOT_TESTED',sealed:false,reuseEligible:false};
 const options={...caps,...native},counts={build:0,base:0,leaves:0,clone:0},events=[],state={invalid:false,late:false,during:null,retired:false,fixtureProfile};
 const equal=(values,expected)=>values.length===expected.length&&values.every((value,at)=>value===expected[at]);
 const funcs={createHash,path,REVIEWED_CLAUDE_NATIVE,
  sealedTypeScriptBaseExchangeAssetsFixtureProfile:value=>value===caps.assetsBuild&&!state.retired?state.fixtureProfile:null,
  sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation:(...values)=>equal(values,[caps.enclosureSource,caps.assetsBuild,caps.pairedSource,caps.pairedArtifacts,caps.copies,caps.projection,caps.preparedNullSource]),
  sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource:(...values)=>equal(values,[caps.enclosureBuild,caps.enclosureSource]),
  sealedTypeScriptBaseExchangeAssetsMatchPair:(...values)=>equal(values,[caps.assetsBuild,caps.pair]),
  sealedTypeScriptBaseExchangeAssetsMatchHostFixture:(...values)=>equal(values,[caps.assetsBuild,caps.hostFixture]),
  sealedTypeScriptPairedStageSourceMatchesDerivation:(...values)=>equal(values,[caps.pairedSource,caps.pair,caps.assetsBuild]),
  verifySealedTypeScriptFixedCampaignEnclosureBuild(value){events.push('build');counts.build++;return value===caps.enclosureBuild&&!state.invalid&&!(state.late&&counts.build===2)?structuredClone(observed):{outcome:'UNKNOWN'};},
  sealedTypeScriptFixedCanaryProtectedInputProjectionHCodeReadLeaves(value){events.push('leaves');counts.leaves++;assert.equal(value,caps.projection);if(state.during==='leaves')state.invalid=true;return structuredClone(leafData);},
  prepareSealedTypeScriptNativeBaseCommand(value){events.push('base');counts.base++;assert.deepEqual(value,{pair:caps.pair,hostFixture:caps.hostFixture,assetsBuild:caps.assetsBuild,...native});if(state.during==='base'||state.during==='final-base'&&counts.base===2)state.invalid=true;return structuredClone(direct);},
  structuredClone(value){events.push('clone');counts.clone++;if(state.during==='clone')state.invalid=true;return structuredClone(value);}
 };
 const make=construct(...imports.map(name=>funcs[name]));return{make,options,caps,direct,observed,leafData,counts,state,events};
}
test('fixed literal exec enclosure adds exactly original21/new6 read leaves and preserves all other native policy',()=>{
 const f=fixture(),before=structuredClone(f.direct),out=f.make(f.options),expected=structuredClone(before.settings_proposed);
 // Frozen held-stable local output observed from original2663eae adapter using
 // these same source/private-capability mocks; not native enforcement.
 assert.equal(createHash('sha256').update(JSON.stringify(out)).digest('hex'),'5b4d4ef15d45beeb8362b3b067d6ebaeb7c61e3c85c92193736a0306b5198553');
 expected.permissions.allow=[`Bash(exec '${self}')`];for(const file of [...originalLeaves,...six])if(!expected.sandbox.filesystem.allowRead.includes(file))expected.sandbox.filesystem.allowRead.push(file);
 assert.equal(out.command_proposed,`exec '${self}'`);assert.equal(out.exact_executable_leaf,self);assert.equal(out.argv0_proposed,self);assert.deepEqual(out.exact_code_read_leaves,[...originalLeaves,...six]);assert.equal(out.exact_code_read_leaves.length,27);assert.equal(new Set(out.exact_code_read_leaves).size,27);assert.deepEqual(out.settings_proposed,expected);assert.deepEqual(f.direct,before);
 assert.equal(out.settings_proposed.sandbox.filesystem.allowRead.length,30);for(const file of [h,h+'/prefix',code,h+'/claude-host',h+'/claude-host/settings.json'])assert(!out.settings_proposed.sandbox.filesystem.allowRead.includes(file));
 assert.deepEqual(out.argv_proposed.slice(0,-1),before.argv_proposed.slice(0,-1));assert(out.argv_proposed.at(-1).includes(`exec '${self}'`));assert(!out.argv_proposed.at(-1).includes('paired-stage-campaign-launch'));assert.equal(out.max_turns_proposed,4);assert.equal(out.parent_timeout_ms_proposed,120000);assert.equal(out.tool_timeout_ms_proposed,15000);
 assert.equal(out.settings_sha256_proposed,createHash('sha256').update(JSON.stringify(expected)).digest('hex'));assert.equal(out.policyHashAuthority,'NONE');assert.equal(out.collection_transport_proposed.frame,'RDE2');assert.equal(out.collection_transport_proposed.completeCollectionExit,0);assert.equal(out.collection_transport_proposed.assertionAuthority,'JSON_BODY_ONLY_NOT_OUTER_EXIT');
 for(const key of ['inferencePermitted','sealed','reuseEligible','runnable'])assert.equal(out[key],false);assert.equal(out.executionAuthority,'NONE');assert.equal(out.disabled,true);assert.equal(out.nativeLaunches,0);assert.equal(out.models,0);assert.deepEqual(out.commands,[]);assert.equal(out.validationPhase,'PRE_NATIVE_ONLY');assert.equal(out.preparation_profile_proposed,'fixed-enclosure-local-sdk27@1');assert.equal(out.hostedCompatibility,'NOT_ESTABLISHED');assert.equal(out.recordAdoptionAuthority,false);assert.equal(out.nativeEnforcement,'NOT_TESTED');assert(Object.isFrozen(out)&&Object.isFrozen(out.settings_proposed));assert.equal(f.events.at(-1),'build');assert.deepEqual(f.counts,{build:2,base:2,leaves:1,clone:1});
});
for(const key of ['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild'])test('foreign/copied/mixed '+key+' refuses before public properties or original IO',()=>{
 for(const value of [{},structuredClone(fixture().options[key]),new Proxy({},{get(){assert.fail('capability getter invoked');}})]){const f=fixture();refusal(()=>f.make({...f.options,[key]:value}));assert.deepEqual(f.counts,{build:0,base:0,leaves:0,clone:0});}
});
test('extra selectors/options, getters and wrong arity never select a command or read scope',()=>{
 const f=fixture();let touched=0;const getter={...f.options};Object.defineProperty(getter,'enclosureSource',{get(){touched++;return f.caps.enclosureSource;}});
 for(const value of [null,{},Object.assign(Object.create({}),f.options),getter,...['command','argv','env','allowRead','settings','manifest','trust','profileId','fixtureProfileId'].map(key=>({...f.options,[key]:[]}))])refusal(()=>f.make(value));refusal(()=>f.make(f.options,{}));assert.equal(touched,0);assert.equal(f.counts.build,0);
});
for(const during of ['leaves','base','clone','final-base'])test('late changes during '+during+' cannot pass final unchanged full build guard',()=>{const f=fixture();f.state.during=during;refusal(()=>f.make(f.options));assert.equal(f.events.at(-1),'build');assert.equal(f.counts.build,2);});
test('stale build fails before native base policy and final stale observation remains refused',()=>{for(const late of [false,true]){const f=fixture();if(late)f.state.late=true;else f.state.invalid=true;refusal(()=>f.make(f.options));assert.equal(f.counts.base,late?2:0);}});
const patches={
 retiredProjection:f=>f.caps.projection.version='fixed-canary-original-input-projection@2',retiredSource:f=>f.caps.enclosureSource.version='fixed-canary-finite-enclosure-source@1',oldFrame:f=>f.caps.enclosureSource.collectionTransport.frame='RDE1',wrongOuterExit:f=>f.caps.enclosureSource.collectionTransport.completeCollectionExit=74,wrongInnerExit:f=>f.caps.enclosureSource.collectionTransport.collectorExit.F=74,
 wrongSelf:f=>f.caps.enclosureSource.bindings.self=launcher,wrongEntry:f=>f.caps.enclosureSource.bindings.entry=baseCode,wrongArgvNode:f=>f.caps.enclosureSource.bindings.node='/OTHER',wrongRoot:f=>f.caps.enclosureSource.bindings.baseB=a,wrongSourceHash:f=>f.caps.enclosureSource.files[0].sourceSha256='f'.repeat(64),wrongBuiltFile:f=>f.observed.files[5].file=baseCode,wrongBuiltDigest:f=>f.observed.files[5].digest='INVALID',wrongBuildScope:f=>f.observed.scope='POST_NATIVE_ENDPOINT',
 wrongLeafCount:f=>f.leafData.readLeaves=f.leafData.readLeaves.slice(1),repeatedLeaf:f=>f.leafData.readLeaves=[...originalLeaves.slice(1),originalLeaves[1]],outsideLeaf:f=>f.leafData.readLeaves=[...originalLeaves.slice(1),'/outside'],broadLeaf:f=>f.leafData.readLeaves=[...originalLeaves.slice(1),h],unobservedLeafScope:f=>f.leafData.currency='CURRENT',wrongLeafHost:f=>f.leafData.hostBase=a,
 extraRead:f=>f.direct.settings_proposed.sandbox.filesystem.allowRead.push(h),extraWrite:f=>f.direct.settings_proposed.sandbox.filesystem.allowWrite.push(h),extraCommand:f=>f.direct.settings_proposed.permissions.allow.push('Bash(node:*)'),missingHWriteDenial:f=>f.direct.settings_proposed.sandbox.filesystem.denyWrite=[],missingRootDenial:f=>f.direct.settings_proposed.sandbox.filesystem.denyRead=[],unsandboxed:f=>f.direct.settings_proposed.sandbox.allowUnsandboxedCommands=true,excluded:f=>f.direct.settings_proposed.sandbox.excludedCommands=['exec'],noFailClosed:f=>f.direct.settings_proposed.sandbox.failIfUnavailable=false,autoAllow:f=>f.direct.settings_proposed.sandbox.autoAllowBashIfSandboxed=true,broadSocket:f=>f.direct.settings_proposed.sandbox.network.allowAllUnixSockets=true,oneSocket:f=>f.direct.settings_proposed.sandbox.network.allowUnixSockets=['/OTHER'],network:f=>f.direct.settings_proposed.sandbox.network.allowedDomains=['*'],hooks:f=>f.direct.settings_proposed.disableAllHooks=false,plugin:f=>f.direct.settings_proposed.enabledPlugins={OTHER:true},extraTurn:f=>f.direct.max_turns_proposed=5,extraParentTime:f=>f.direct.parent_timeout_ms_proposed=120001,extraToolTime:f=>f.direct.tool_timeout_ms_proposed=15001,inference:f=>f.direct.inferencePermitted=true
};
for(const [name,patch]of Object.entries(patches))test('fixed bindings and scope reject '+name,()=>{const f=fixture();patch(f);refusal(()=>f.make(f.options));});
test('actual module refuses forged caps without evaluating a path getter or running native code',()=>{let touched=0;const fake=new Proxy({},{get(){touched++;throw Error('PRIVATE');}}),f=fixture(),options=Object.fromEntries(Object.keys(f.options).map(key=>[key,fake]));refusal(()=>actual(options));assert.equal(touched,0);});
test('command source never starts processes, writes settings, reads environment or selects a controller',()=>{assert.doesNotMatch(source,/\bspawn\w*\(|\bexec\w*\(|\beval\(|\bFunction\(|fs\.|process\.env/);assert(source.includes('prepareSealedTypeScriptNativeBaseCommand(directOptions)'));assert(!source.includes('allowRead=[h'));assert(!source.includes('observeSealedTypeScriptFixedCampaignEnclosurePostNativeEndpoint'));});

test('unreviewed/coercible native options fail before private verifier or policy IO',()=>{
 for(const patch of [{claudeExecutable:{}},{claudeExecutable:'relative/claude'},{claudeExecutable:'/path/../claude'},{claudeExecutable:'/path/other'},{claudeExecutable:'/path/claude\n'},{claudeSha256:'0'.repeat(64)},{claudeVersion:'OTHER'}]){const f=fixture();refusal(()=>f.make({...f.options,...patch}));assert.deepEqual(f.counts,{build:0,base:0,leaves:0,clone:0});}
});

const ciFixtureProfile='fixed-native-assets-ci-sdk26.5-toolpair-b@1';
test('original reviewed CI assets select only CI preparation metadata and preserve the literal command/settings/read27 policy',()=>{
 const local=fixture(),ci=fixture(ciFixtureProfile),a=local.make(local.options),b=ci.make(ci.options);
 for(const key of ['command_proposed','argv_proposed','settings_proposed','settings_sha256_proposed','exact_code_read_leaves','exact_executable_leaf','argv0_proposed','binary_sha256_proposed','projection_sha256_proposed','collection_transport_proposed'])assert.deepEqual(b[key],a[key],key);
 assert.equal(b.preparation_profile_proposed,'fixed-enclosure-ci-sdk26.5-toolpair-b@1');
 assert(b.blockers.includes('CI_PREPARATION_IS_NOT_COMPLETE_HOSTED_COMPATIBILITY'));assert(!b.blockers.includes('LOCAL_SDK27_PREPARATION_IS_NOT_HOSTED_SDK26_5_COMPATIBILITY'));
 for(const key of ['inferencePermitted','sealed','reuseEligible','runnable'])assert.equal(b[key],false);
 assert.equal(b.hostedCompatibility,'NOT_ESTABLISHED');assert.deepEqual(ci.counts,local.counts);
});
for(const profile of [null,undefined,'fixed-native-assets-ci-sdk26.5-toolpair-a@1','fixed-native-assets-ci-sdk26.5-toolpair-b@2','fixed-native-assets-local-sdk27@2','redue-native-stdio-preauth-ci-sdk26.5@1'])test('unknown or retired original asset profile '+String(profile)+' never starts full command validation',()=>{
 const f=fixture();f.state.fixtureProfile=profile;refusal(()=>f.make(f.options));assert.deepEqual(f.counts,{build:0,base:0,leaves:0,clone:0});
});
for(const identity of ['fixed-native-assets-local-sdk27@1',ciFixtureProfile])test('original '+identity+' profile refuses copied/mixed parents and mismatched source/build profile',()=>{
 for(const key of ['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild']){
  const f=fixture(identity),other=fixture(identity===ciFixtureProfile?'fixed-native-assets-local-sdk27@1':ciFixtureProfile);
  refusal(()=>f.make({...f.options,[key]:other.options[key]}));assert.deepEqual(f.counts,{build:0,base:0,leaves:0,clone:0});
 }
 for(const patch of [f=>f.caps.enclosureBuild.report.profileId=identity===ciFixtureProfile?'fixed-enclosure-local-sdk27@1':'fixed-enclosure-ci-sdk26.5-toolpair-b@1',f=>f.caps.enclosureSource.fixtureProfileId=identity===ciFixtureProfile?undefined:ciFixtureProfile]){
  const f=fixture(identity);patch(f);refusal(()=>f.make(f.options));assert.equal(f.counts.base,0);assert.equal(f.counts.leaves,0);
 }
 const f=fixture(identity);f.state.retired=true;refusal(()=>f.make(f.options));assert.equal(f.counts.build,0);
});
test('profile loss during final full validation never authorizes a copied earlier CI proposal',()=>{
 const f=fixture(ciFixtureProfile),original=f.make(f.options);assert.equal(original.inferencePermitted,false);
 f.state.retired=true;refusal(()=>f.make(f.options));assert.equal(f.counts.build,2);
});
