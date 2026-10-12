import test from 'node:test';import assert from 'node:assert/strict';
import {parsePreparationDiagnosticFrames} from './acceptance/sealed-typescript-preparation-diagnostic-run.mjs';
const row=()=>({schema:1,scope:'PREPARATION_OPERATION_DIAGNOSTIC_ONLY',elapsedMs:100,final:false,stats:{source:{lstatSync:[1,2,2,0,0]},stage:{},boundary:{}}});
const encode=rows=>Buffer.from(rows.map(r=>JSON.stringify(r)+'\n').join(''));
test('fixed diagnostic parser retains complete finite cumulative rows only',()=>{const a=row(),b=row();b.final=true;b.elapsedMs=200;b.stats.source.lstatSync=[2,3,2,1,0];assert.deepEqual(parsePreparationDiagnosticFrames(encode([a,b])),[a,b]);assert.deepEqual(parsePreparationDiagnosticFrames(Buffer.alloc(0)),[]);});
test('unknown fields/kinds, private strings, nonfinite or inconsistent values refuse',()=>{
 for(const mutate of [r=>r.path='NONSECRET',r=>r.scope='other',r=>r.elapsedMs=-1,r=>r.stats.secret={},r=>r.stats.source.secret=[1,2,2,0,0],r=>r.stats.source.lstatSync=[1,2,3,0,0],r=>r.stats.source.lstatSync=[1,2,2,2,0],r=>r.stats.source.lstatSync=[1,2,2,0,'NONSECRET']]){const r=row();mutate(r);assert.throws(()=>parsePreparationDiagnosticFrames(encode([r])),/DIAGNOSTIC_DATA_INVALID/);}
});
test('duplicates/malformed UTF8/extra frames/truncation and output limits refuse',()=>{
 const text=JSON.stringify(row());for(const bytes of [Buffer.from(text),Buffer.from(text.replace('"schema":1','"schema":1,"schema":1')+'\n'),Buffer.from([0xff]),Buffer.alloc(65537),encode(Array.from({length:33},row))])assert.throws(()=>parsePreparationDiagnosticFrames(bytes),/DIAGNOSTIC_DATA_INVALID/);
});
test('decreasing or vanished counters and frames following a final result refuse',()=>{
 const a=row(),b=row();b.elapsedMs=200;for(const mutate of [r=>r.elapsedMs=50,r=>r.stats.source.lstatSync=[0,0,0,0,0],r=>r.stats.source={},r=>a.final=true]){mutate(b);assert.throws(()=>parsePreparationDiagnosticFrames(encode([a,b])),/DIAGNOSTIC_DATA_INVALID/);a.final=false;b.elapsedMs=200;b.stats.source={lstatSync:[1,2,2,0,0]};}
});
