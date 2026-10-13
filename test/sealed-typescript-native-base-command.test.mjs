// Whole fixed source/mock controls only. No settings, credentials or processes.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PINNED_READONLY_BASH_HEADS} from './acceptance/portable-claude-native-profile.mjs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-base-command.mjs',import.meta.url),'utf8');
const create=Function('prepareSealedTypeScriptPairedCanaryPolicy','verifySealedTypeScriptBaseExchangeAssets','PINNED_READONLY_BASH_HEADS','structuredClone',source.replace(/^import .*;$/gm,'').replace('export function ','function ')+';return prepareSealedTypeScriptNativeBaseCommand;');
const a='/private/tmp/redue-ci-recipient-11111111',b='/private/tmp/redue-ci-recipient-22222222',h='/private/tmp/redue-ci-recipient-33333333',code=h+'/prefix/native-probes/sealed-typescript-base-exchange-sentinel';
function fixture(){
 const settings={disableAllHooks:true,enabledPlugins:{},permissions:{allow:[],deny:['Read','Write','Agent']},sandbox:{enabled:true,failIfUnavailable:true,allowUnsandboxedCommands:false,excludedCommands:[],filesystem:{allowWrite:[a+'/Checkout 空间/.sealed-native-canaries'],allowRead:[a+'/sealed-inputs',code],denyWrite:[code],denyRead:['/',h+'/claude-host']},network:{allowedDomains:[],deniedDomains:['*'],allowUnixSockets:[]},credentials:{envVars:[{name:'CLAUDE_CODE_OAUTH_TOKEN',mode:'deny'}]}}};
 const policy={baseA:a,baseB:b,hostBase:h,code,cwd:a+'/Checkout 空间/.sealed-native-canaries',settings_proposed:settings,interpretation:'test-only',blockers:['PENDING_NATIVE']};
 const assetsBuild=Object.freeze({report:{base:h,binary:{file:code,sha256:'a'.repeat(64)}}});
 let checks=0,policies=0;const state={valid:true,late:true,changed:false};
 const make=create(()=>{policies++;if(policies===2&&state.invalidateDuringFinalPolicy)state.valid=false;return policy;},value=>{checks++;return value===assetsBuild&&state.valid&&(checks===1||state.late)?{outcome:'BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED',baseA:state.changed?b:a,baseB:b,hostBase:h}:{outcome:'UNKNOWN'};},PINNED_READONLY_BASH_HEADS,structuredClone);
 return {make,policy,state,assetsBuild,options:{pair:{},hostFixture:{},assetsBuild,claudeExecutable:h+'/native/claude',claudeSha256:'a'.repeat(64),claudeVersion:'2.1.187'},counts:()=>({checks,policies})};
}
test('one literal no-argument helper command, fixed four-turn print route, still disabled',()=>{
 const f=fixture(),out=f.make(f.options);assert.equal(out.command_proposed,"'"+code+"'");assert.deepEqual(out.settings_proposed.permissions.allow,[`Bash('${code}')`]);
 for(const head of PINNED_READONLY_BASH_HEADS)assert(out.settings_proposed.permissions.deny.includes(`Bash(${head}:*)`));
 assert.deepEqual(out.settings_proposed.sandbox,{...f.policy.settings_proposed.sandbox,filesystem:{...f.policy.settings_proposed.sandbox.filesystem,denyWrite:[code,h]}});assert.deepEqual(f.policy.settings_proposed.permissions.allow,[]);
 assert.equal(out.host_config_directory_proposed,h+'/claude-host/claude-config');assert.equal(out.gh_config_directory_proposed,h+'/claude-host/gh-config');
 assert(out.argv_proposed.includes('--print'));assert.equal(out.argv_proposed[out.argv_proposed.indexOf('--setting-sources')+1],'');assert.equal(out.argv_proposed[out.argv_proposed.indexOf('--max-turns')+1],'4');
 assert.equal(out.parent_timeout_ms_proposed,120000);assert.equal(out.tool_timeout_ms_proposed,15000);assert.equal(out.disabled,true);assert.equal(out.helper_lifecycle,'NOT_OBSERVED');assert(Object.isFrozen(out.settings_proposed));
 for(const key of ['sealed','reuseEligible','inferencePermitted'])assert.equal(out[key],false);assert.deepEqual(out.commands,[]);assert.deepEqual(f.counts(),{checks:2,policies:2});
});
test('missing/forged build refuses before policy or report access',()=>{
 const f=fixture();f.state.valid=false;let read=false;const forged={get report(){read=true;throw Error('PRIVATE');}};assert.throws(()=>f.make({...f.options,assetsBuild:forged}),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});assert.equal(read,false);assert.equal(f.counts().policies,0);
});
test('different pair, host, binary or late currency never gains a proposal',()=>{
 for(const mode of ['pair','host','binary','late']){const f=fixture();if(mode==='pair')f.state.changed=true;if(mode==='host')f.policy.hostBase=b;if(mode==='binary')f.policy.code=code+'-other';if(mode==='late')f.state.late=false;assert.throws(()=>f.make(f.options),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});}
});
test('accessors and additional command/env/grant arguments refuse without evaluation',()=>{
 const f=fixture();let read=false;assert.throws(()=>f.make({...f.options,get assetsBuild(){read=true;return f.assetsBuild;}}),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});assert.equal(read,false);for(const key of ['command','env','allowRead','trust'])assert.throws(()=>f.make({...f.options,[key]:true}),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});assert.deepEqual(f.counts(),{checks:0,policies:0});
});
test('unprotected actual configuration geometry refuses instead of adding a broad read grant',()=>{const f=fixture();f.policy.settings_proposed.sandbox.filesystem.denyRead=['/'];assert.throws(()=>f.make(f.options),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});});
test('final policy validation cannot invalidate code after the last assets barrier',()=>{const f=fixture();f.state.invalidateDuringFinalPolicy=true;assert.throws(()=>f.make(f.options),{code:'NATIVE_BASE_COMMAND_UNAVAILABLE'});assert.deepEqual(f.counts(),{checks:2,policies:2});});
