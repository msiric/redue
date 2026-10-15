// SOURCE/IDENTITY tests only. Never call the genuine zero-argument preparation:
// it creates resources and builds eight C binaries. No original context mint,
// native enforcement, cross-process adoption or execution GO is established here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {
 prepareFixedEnclosureContext,
 isFixedEnclosurePreparationContext as isContext,
} from './acceptance/sealed-typescript-enclosure-provisioning.mjs';
const sourceUrl=new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs',import.meta.url);
const source=fs.readFileSync(sourceUrl,'utf8');

test('fixed preparation refuses all supplied arguments before inspecting them',async()=>{
 let reads=0;const foreign=new Proxy(Object.create(null),{get(){reads++;throw Error('PROPERTY_READ');},ownKeys(){reads++;throw Error('KEY_READ');},getPrototypeOf(){reads++;throw Error('PROTOTYPE_READ');}});
 for(const args of [[undefined],[null],[foreign],[{},()=>{throw Error('CALLBACK');}],[{ready:()=>true,load:()=>{throw Error('LOAD');}}]])await assert.rejects(prepareFixedEnclosureContext(...args),/FIXED_ENCLOSURE_PREPARATION_UNKNOWN/);
 assert.equal(reads,0);
});

test('identity predicate rejects copied, serialized, accessor and foreign objects without inspection',()=>{
 let reads=0;const getter=Object.defineProperty({},'report',{get(){reads++;throw Error('REPORT_READ');}});
 const proxy=new Proxy(Object.freeze(Object.create(null)),{get(){reads++;throw Error('PROPERTY_READ');},ownKeys(){reads++;throw Error('KEY_READ');},getPrototypeOf(){reads++;throw Error('PROTOTYPE_READ');}});
 const revoked=Proxy.revocable({},{});revoked.revoke();
 const empty=Object.freeze(Object.create(null));
 for(const value of [undefined,null,false,0,'context',Symbol('foreign'),{},[],empty,{...empty},JSON.parse(JSON.stringify(empty)),getter,proxy,revoked.proxy])assert.equal(isContext(value),false);
 assert.equal(isContext(),false);assert.equal(isContext(empty,empty),false);assert.equal(reads,0);
});

test('a distinct module instance has no adoption or cross-module getter interface',async()=>{
 const other=await import(new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs?dir278-independent-instance',import.meta.url));
 const empty=Object.freeze(Object.create(null));assert.equal(other.isFixedEnclosurePreparationContext(empty),false);assert.equal(isContext(empty),false);
 assert.deepEqual(Object.keys(other).sort(),['isFixedEnclosurePreparationContext','observeFixedCIEnclosurePreparation','observeFixedEnclosurePreparation','prepareFixedCIEnclosureContext','prepareFixedCIEnclosurePreparation','prepareFixedEnclosureContext','runFixedCINativeEnclosureDiagnostic','runFixedNativeEnclosureDiagnostic']);
});

test('one private sequence retains ten originals only after successful report serialization and final budget',()=>{
 assert.match(source,/const preparedContexts=new WeakMap\(\)/);
 assert.match(source,/observeFixedEnclosurePreparation\(options\)\{return prepareFixedSequence\(options,null\);\}/);
 assert.equal((source.match(/async function prepareFixedSequence\(/g)||[]).length,1);
 const context=source.slice(source.indexOf('async function prepareFixedContext(ci)'),source.indexOf('// Identity only:'));
 assert.match(context,/let captured=null;/);
 assert.match(source,/prepareFixedEnclosureContext\(\)\{\s*guard\(arguments\.length===0\);return prepareFixedContext\(false\);/);
 assert.match(source,/prepareFixedCIEnclosureContext\(\)\{\s*guard\(arguments\.length===0\);return prepareFixedContext\(true\);/);
 assert.match(context,/prepareFixedSequence\(\{ready:ci\?fixedCIReady:fixedReady,load:ci\?fixedCIOperations:fixedOperations,now:\(\)=>performance\.now\(\)\}/);
 assert.match(context,/captured\.preparedReport===report/);
 const finalGuard=source.indexOf('guard(Buffer.byteLength(JSON.stringify(result))<=65536);tick();');
 const capture=source.indexOf('captureOriginals(originals,report,tick)');
 const mint=source.indexOf('preparedContexts.set(context,');
 assert(finalGuard>=0&&capture>finalGuard&&mint>capture);
 assert.match(context,/captured\.tick\(\);context=Object\.freeze\(Object\.create\(null\)\);preparedContexts\.set/);
 const record=context.match(/preparedContexts\.set\(context,Object\.freeze\(\{([^}]+)\}\)\)/)[1];
 assert.deepEqual(record.split(',').map(row=>row.split(':')[0]),['pair','hostFixture','assetsBuild','pairedSource','pairedArtifacts','copies','projection','preparedNullSource','enclosureSource','enclosureBuild']);
 assert.equal((source.match(/preparedContexts\.set\(/g)||[]).length,1);
 const controller=source.slice(source.indexOf('export async function runFixedNativeEnclosureDiagnostic()'),source.indexOf('async function fixedOperations()'));assert.equal((controller.match(/preparedContexts\.get\(/g)||[]).length,1);assert.equal((controller.match(/preparedContexts\.delete\(/g)||[]).length,1);assert(!/preparedContexts\.(?:get|delete)\(/.test(source.replace(controller,'')));
 assert.match(source,/isFixedEnclosurePreparationContext\(value\)\{return arguments\.length===1&&preparedContexts\.has\(value\);\}/);
 assert.match(context,/outcome:'UNKNOWN',reason_code:'FINAL_REPORT_OR_BUDGET_UNAVAILABLE'\},context:null/);
 assert(!/spawn|execFile|writeFile|readFile|process\.env|process\.argv/.test(context));
});

test('fixed original-linkage functions exist in the actual combined dependency modules',async()=>{
 const groups=[
  ['./acceptance/sealed-typescript-base-exchange-assets.mjs',['sealedTypeScriptBaseExchangeAssetsMatchPair','sealedTypeScriptBaseExchangeAssetsMatchHostFixture','sealedTypeScriptPairedStageArtifactsMatchDerivation','sealedTypeScriptFixedCampaignLauncherBuildMatchesDerivation','sealedTypeScriptFixedCanaryProtectedInputProjectionMatchesDerivation']],
  ['./acceptance/sealed-typescript-paired-stage-source.mjs',['sealedTypeScriptPairedStageSourceMatchesDerivation']],
  ['./acceptance/sealed-typescript-fixed-campaign-copies.mjs',['sealedTypeScriptFixedCampaignCopiesMatchDerivation']],
  ['./acceptance/sealed-typescript-fixed-campaign-enclosure-source.mjs',['sealedTypeScriptFixedCampaignEnclosureSourceMatchesDerivation']],
  ['./acceptance/sealed-typescript-fixed-campaign-enclosure-build.mjs',['sealedTypeScriptFixedCampaignEnclosureBuildMatchesSource']],
 ];
 for(const [file,names]of groups){const module=await import(new URL(file,import.meta.url));for(const name of names){assert.equal(typeof module[name],'function',name);assert(source.includes('.'+name),name);}}
});

test('fixed CLI remains the report-only observer with unchanged finite progress and lifetime budgets',()=>{
 const cli=source.slice(source.indexOf('const here=fileURLToPath(import.meta.url)'));
 assert.match(cli,/await observeFixedEnclosurePreparation\(/);assert(!cli.includes('prepareFixedEnclosureContext'));
 assert.match(source,/protocol:'fixed-enclosure-progress@2'/);assert.match(source,/n-begun<60000/);
 assert.match(source,/bodyBudgetMs:60000,cleanupBudgetMs:5000,totalBudgetMs:65000/);
 const parent=fs.readFileSync(new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url),'utf8');
 assert(parent.includes('INNER_SHA256 = "'+createHash('sha256').update(source).digest('hex')+'"'));
});

test('genuine empty context mint and positive cross-module non-adoption', {skip:'NOT RUN: needs genuine fixed preparation and reviewed same-process consumer; no mock authority is minted'},()=>{});
