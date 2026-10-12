// Controlled pure C++ tests only: production collector is NEVER launched.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('./fixtures/portable-ancestor-fsevents-pure.cc',import.meta.url));
const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-raw-filter-pure-')),binary=path.join(base,'pure');
const compiler=process.platform==='darwin'?'/usr/bin/xcrun':'/usr/bin/c++';
const available=process.platform!=='win32'&&fs.existsSync(compiler);
if(available){const args=process.platform==='darwin'?['clang++']:[];
  const result=spawnSync(compiler,[...args,'-std=c++17','-O2',source,'-pthread','-o',binary],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,0,result.stderr);}
process.on('exit',()=>fs.rmSync(base,{recursive:true,force:true}));
const pure={skip:available?false:'Pure C++ compiler unavailable; native collector not started'};
const run=(mode,input='')=>{const r=spawnSync(binary,[mode],{input,encoding:'utf8',timeout:1000,maxBuffer:1024*1024});assert.equal(r.error,undefined);assert.equal(r.signal,null);return {...r,rows:r.stdout.trim()?r.stdout.trim().split('\n').map(JSON.parse):[]};};
const frame=(items)=>`INIT ${items.length}\n`+items.map(([id,p,mode=0])=>`${id} ${Buffer.byteLength(p)} ${mode}\n${p}\n`).join('');
const candidate='/private/tmp/project/node_modules/@typescript/lib-es2022/index.d.ts';
test('framed local scope initialization accepts exact bytes and stable IDs',pure,()=>{
  const r=run('initialization',frame([[0,candidate],[17,candidate]]));assert.equal(r.status,0);assert.deepEqual(r.rows,[{count:2,ids:[0,17]}]);
});
for(const [name,value] of [
  ['empty count','INIT 0\n'],['over count','INIT 8193\n'],['leading zero','INIT 01\n'],['duplicate ID',frame([[0,candidate],[0,candidate]])],
  ['bad ID',frame([[8192,candidate]])],['relative',frame([[0,'node_modules/package']])],['root',frame([[0,'/']])],
  ['Unicode',frame([[0,'/private/tmp/\u212a/node_modules/p']])],['traversal',frame([[0,'/private/tmp/../node_modules/p']])],
  ['tab',frame([[0,'/private/tmp/a\tb']])],['newline',frame([[0,'/private/tmp/a\nb']])],['NUL',frame([[0,'/private/tmp/a\0b']])],
  ['truncated','INIT 1\n0 100 0\n/x\n'],['wrong framing','INIT 1\n0 2 0\n/xy\n'],['oversize path',frame([[0,'/'+ 'x'.repeat(4096)]])],
])test(`framed scope rejects ${name} before any stream exists`,pure,()=>{const r=run('initialization',value);assert.equal(r.status,64);assert.deepEqual(r.rows,[{code:'PROTOCOL'}]);});
test('fixed requests preserve numeric identity and reject arbitrary commands',pure,()=>{
  for(const [line,expected] of [['barrier 0',{id:0,close:false}],['close 9007199254740991',{id:9007199254740991,close:true}]])assert.deepEqual(run('request',line).rows,[expected]);
  for(const line of ['start 1','barrier 01','close -1','barrier 9007199254740992','barrier 1 extra','barrier 1\t'])assert.equal(run('request',line).status,64);
});
test('separate create/remove occurrences are never cancellation-aggregated',pure,()=>{
  const r=run('transient');assert.equal(r.status,0);assert.equal(r.rows.length,3);
  assert.deepEqual(r.rows.slice(0,2).map(row=>[row.type,row.serial,row.scopeIds]),[['occurrence',1,[0]],['occurrence',2,[0]]]);assert.equal(r.rows[2].serial,2);assert.equal(r.rows[2].uncertain,false);
  assert(!r.stdout.includes('/private/'),'no event pathname emitted');
});
test('coalesced create-and-remove and ancestor replacements remain relevant',pure,()=>{
  for(const mode of ['coalesced','ancestor']){const r=run(mode);assert.equal(r.rows[0].type,'occurrence');assert.deepEqual(r.rows[0].scopeIds,mode==='ancestor'?[0,1]:[0]);assert.equal(r.rows[1].serial,1);}
});
test('ASCII case aliases match while Unicode ambiguity withholds authority',pure,()=>{
  assert.equal(run('case').rows[0].type,'occurrence');
  const unicode=run('unicode').rows;assert.equal(unicode[0].type,'uncertainty');assert.equal(unicode.at(-1).uncertain,true);
  const unrelated=run('unrelated-unicode').rows;assert.equal(unrelated.length,1);assert.equal(unrelated[0].serial,0);assert.equal(unrelated[0].uncertain,false);
});
test('valid unrelated events are discarded without pathname retention',pure,()=>{
  const r=run('unrelated');assert.deepEqual(r.rows,[{schema:1,type:'barrier',request:1,serial:0,uncertain:false}]);assert(!r.stdout.includes('source-private'));
});
test('malformed paths, invalid IDs and oversized paths remain uncertainty',pure,()=>{
  for(const mode of ['malformed','overflow-path','bad-id','del']){const r=run(mode);assert.equal(r.rows[0].type,'uncertainty');assert.equal(r.rows.at(-1).uncertain,true);}
});
test('drop/wrap/root/mount/history/unknown flags latch even for unrelated paths',pure,()=>{
  const rows=run('flags').rows;assert.equal(rows.length,18);
  for(let i=0;i<rows.length;i+=2){assert.equal(rows[i].type,'uncertainty');assert.equal(rows[i+1].type,'barrier');assert.equal(rows[i+1].uncertain,true);}
});
test('a later clean occurrence or barrier cannot clear uncertainty',pure,()=>{
  const r=run('latch');assert.equal(r.rows[0].type,'uncertainty');assert.equal(r.rows[1].type,'occurrence');assert.equal(r.rows[2].uncertain,true);
});
test('production source has fixed stream and barrier ordering, not a generic executor',()=>{
  const text=fs.readFileSync(new URL('../src/portable-ancestor-fsevents.cc',import.meta.url),'utf8');
  assert.match(text,/CFSTR\("\/"\)/);assert.match(text,/kFSEventStreamCreateFlagFileEvents\|kFSEventStreamCreateFlagWatchRoot\|kFSEventStreamCreateFlagNoDefer/);
  assert.match(text,/FSEventStreamFlushSync\(stream\);collector\.boundary/);
  assert(!/\b(?:stat|lstat|open|readFile|system|execvp|fork)\s*\(/.test(text));
});
test('aggregate initialization and serial limits fail closed',pure,()=>{
  assert.equal(run('limits').status,64);
  const rows=run('serial').rows;assert.equal(rows[0].code,'FSEVENTS_SERIAL');assert.equal(rows.at(-1).serial,9007199254740991);assert.equal(rows.at(-1).uncertain,true);
});
test('request replay or regression cannot reuse an earlier barrier response',pure,()=>{
  assert.equal(run('request-loop','barrier 1\nbarrier 2\nclose 3\n').status,0);
  assert.equal(run('request-loop','barrier 2\nclose 2\n').status,64);
  assert.equal(run('request-loop','barrier 2\nbarrier 1\n').status,64);
});
test('mode framing refuses malformed bits and admits locally derived membership mode',pure,()=>{
  for(const mode of [2,9,'x','01','-1'])assert.equal(run('initialization',frame([[0,candidate,mode]])).status,64);
  assert.equal(run('initialization',frame([[0,candidate,1]])).status,0);
});
test('exact containers discard unrelated children; membership scopes retain them',pure,()=>{
  assert.deepEqual(run('child-exact').rows,[{schema:1,type:'barrier',request:1,serial:0,uncertain:false}]);
  const rows=run('child-membership').rows;assert.equal(rows[0].type,'occurrence');assert.deepEqual(rows[0].scopeIds,[3]);assert.equal(rows[1].serial,1);
});
test('potential Data firmlink aliases are unknown, never stripped into matching authority',pure,()=>{
  const rows=run('firmlink').rows;assert.equal(rows[0].code,'FSEVENTS_PATH');assert.equal(rows.at(-1).uncertain,true);
  assert.equal(run('firmlink-root').rows.at(-1).uncertain,true);
  assert.equal(run('firmlink-unicode').rows.at(-1).uncertain,true);
  assert.equal(run('firmlink-exact-child').rows.at(-1).uncertain,false);
  assert.deepEqual(run('firmlink-unrelated').rows,[{schema:1,type:'barrier',request:1,serial:0,uncertain:false}]);
});
test('mixed-case, short and ambiguous Unicode Data prefixes are uncertainty only',pure,()=>{
  const rows=run('alias-prefixes').rows;assert.equal(rows.length,18);
  for(let at=0;at<rows.length;at+=2){assert.equal(rows[at].code,'FSEVENTS_PATH');assert.equal(rows[at+1].uncertain,true);assert.equal(rows[at+1].serial,0);}
  const disjoint=run('alias-disjoint').rows;assert.equal(disjoint.length,4);assert(disjoint.every(row=>row.type==='barrier'&&row.serial===0&&row.uncertain===false));
});
test('diagnostic-only stream selection is fixed enum plus canonical owned ASCII root',pure,()=>{
  assert.deepEqual(run('diagnostic-args','root\n/private/tmp/owned-project\n').rows,[{owned:false}]);
  assert.deepEqual(run('diagnostic-args','owned\n/private/tmp/owned-project\n').rows,[{owned:true}]);
  for(const input of ['other\n/private/tmp/p\n','owned\n/\n','owned\nrelative\n','owned\n/private/tmp/../p\n','owned\n/private/tmp/\u212a\n','owned\n/private/tmp/p\nextra\n','root\n'])
    assert.equal(run('diagnostic-args',input).status,64);
});
test('production preprocessor branch retains root-only argc and no diagnostic argument path',()=>{
  const text=fs.readFileSync(new URL('../src/portable-ancestor-fsevents.cc',import.meta.url),'utf8');
  assert.match(text,/#ifdef REDUE_ANCESTOR_DIAGNOSTIC[\s\S]*#else\n  if\(argc!=1\)return 64;/);
  assert.match(text,/CFStringRef streamRoot=CFSTR\("\/"\);/);
});
