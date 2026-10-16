// SOURCE/MOCK endpoint/call-count acceptance, not actual filesystem timing or
// read-trace/transient-change equivalence. No fixture/compiler/native/model.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const cases=[['native','sealed-typescript-native-assets-build.mjs','nativeBuildNamedRows','export function verifySealedTypeScriptNativeAssetsBuild'],['base','sealed-typescript-base-exchange-assets.mjs','baseAssetsNamedRows','function baseAssetsObserved']];
const fields=['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'],mark=s=>fields.map(k=>String(s[k])).join(':'),parentMark=s=>fields.slice(0,5).map(k=>String(s[k])).join(':');
function fixture(kind,file,name,end){
 const source=fs.readFileSync(new URL('./acceptance/'+file,import.meta.url),'utf8'),body=source.slice(source.indexOf('function '+name+'(record){'),source.indexOf(end,source.indexOf('function '+name+'(record){')));
 let ino=0;const nodes=new Map(),parentNames=['/owned/deep/shared/namespace','/owned/deep/shared','/owned/deep','/owned','/'];
 const node=directory=>({dev:1n,ino:BigInt(++ino),mode:directory?0o40700n:0o100600n,uid:501n,gid:20n,nlink:1n,size:directory?0n:17n,mtimeNs:1n,ctimeNs:1n,isDirectory:()=>directory,isSymbolicLink:()=>false});
 for(const p of parentNames)nodes.set(p,node(true));const count=kind==='native'?8:2,rows=Array.from({length:count},(_,i)=>{const file=parentNames[0]+'/row'+i;nodes.set(file,node(false));return{file,mark:mark(nodes.get(file)),lineage:parentNames.map(p=>[p,parentMark(nodes.get(p))])};});
 const record=kind==='native'?{rows}:{source:rows[0],binary:rows[1]},state={reads:[],hook:null};
 const io={lstatSync(file,options){assert.deepEqual(options,{bigint:true});state.reads.push(file);state.hook?.(file,state.reads.length);assert(nodes.has(file));return{...nodes.get(file)};}};
 const guard=v=>{if(!v)throw Error('SOURCE_MOCK_GUARD');};const run=Function('fs','guard','mark','parentMark',body+';return '+name+';')(io,guard,mark,parentMark);
 const reference=()=>{for(const row of rows){guard(mark(io.lstatSync(row.file,{bigint:true}))===row.mark);const actual=row.lineage.map(([p])=>{const s=io.lstatSync(p,{bigint:true});guard(s.isDirectory()&&!s.isSymbolicLink());return[p,parentMark(s)];});guard(JSON.stringify(actual)===JSON.stringify(row.lineage));}};
 return{run:()=>run(record),reference,rows,nodes,parentNames,state,record};
}
for(const args of cases){const[kind]=args;
 test(kind+' held-stable endpoint matches the full reference without retained cross-call state',()=>{const m=fixture(...args);m.reference();const old=m.state.reads.length;m.state.reads=[];m.run();const current=m.state.reads.length;assert.equal(current,2*(m.parentNames.length+m.rows.length));if(kind==='native')assert(current<old);else assert.equal(current,old+2);m.state.reads=[];m.run();assert.equal(m.state.reads.length,current);});
 test(kind+' conflicting original shared ancestry refuses before observation instead of adopting a later baseline',()=>{const m=fixture(...args);m.rows[1].lineage[0][1]+=':CONFLICT';assert.throws(m.run);assert.equal(m.state.reads.length,0);});
 test(kind+' changed original ancestor between fresh leaf checks is rejected',()=>{const m=fixture(...args);let changed=false;m.state.hook=file=>{if(!changed&&file===m.rows.at(-1).file){changed=true;m.nodes.get(m.parentNames[0]).ino++;}};assert.throws(m.run);assert(changed);});
 test(kind+' terminal leaf pass rejects persistent earlier-leaf changes during later ancestor validation',()=>{const m=fixture(...args);let count=0;m.state.hook=file=>{if(file===m.parentNames.at(-1)&&++count===2)m.nodes.get(m.rows[0].file).ctimeNs++;};assert.throws(m.run);assert.equal(count,2);});
 test(kind+' terminal leaf pass rejects a persistent change made by a later first-pass leaf observation',()=>{const m=fixture(...args);let changed=false;m.state.hook=file=>{if(!changed&&file===m.rows.at(-1).file){changed=true;m.nodes.get(m.rows[0].file).ino++;}};assert.throws(m.run);assert(changed);});
 test(kind+' missing/new rows are not covered by an earlier successful invocation',()=>{const m=fixture(...args);m.run();const row=m.rows[0];m.nodes.delete(row.file);assert.throws(m.run);});
}

test('a newly introduced native original row cannot reconcile a conflicting shared ancestor',()=>{const m=fixture(...cases[0]),first=m.rows[0];m.rows.push({...first,file:m.parentNames[0]+'/new-row',lineage:first.lineage.map(([file,expected],i)=>[file,i===0?expected+':CONFLICT':expected])});assert.throws(m.run);assert.equal(m.state.reads.length,0);});
