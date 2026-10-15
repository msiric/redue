// Fixed-counter SOURCE/MOCK tests only. No real stdout emission, fixture,
// compiler, SDK, native/helper, model, account, environment or CI operation.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import path from 'node:path';import {createHash} from 'node:crypto';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-preparation-cost.mjs',import.meta.url),'utf8');
function mock(){const state={now:0,chunks:[],writeFault:false};const api=Function('writeSync','performance',source.replace(/^import .*;$/gm,'').replaceAll('export function ','function ')+';return {start:startFixedCIPreparationCostCapture,begin:beginFixedCIPreparationCost,end:endFixedCIPreparationCost,stage:fixedCIPreparationGuardStage,refusal:fixedCIPreparationRefusal,finish:finishFixedCIPreparationCostCapture,groups};')((fd,body,at,n)=>{assert.equal(fd,1);if(state.writeFault)throw Error('NONSECRET_MOCK_WRITE');state.chunks.push(Buffer.from(body.subarray(at,at+n)));return n;},{now:()=>{if(state.clockThrows)throw Error('NONSECRET_CLOCK');return state.now;}});return {...api,state,frames:()=>Buffer.concat(state.chunks).toString().trim().split('\n').filter(Boolean).map(JSON.parse)};}
test('inactive fixed counter imports are no-ops and capture has no arbitrary IO selector',()=>{const m=mock();m.stage('NATIVE_COMPILER_BYTES');m.refusal();assert.equal(m.begin('launcher_source'),null);m.end(null);assert.deepEqual(m.frames(),[]);assert.throws(()=>m.start({fd:2}));assert.doesNotMatch(source,/process\.env|readFile|writeFile|spawn|execFile|setInterval|setTimeout|fetch\(/);});
test('nested counts and completed inclusive times are observed, not summable process facts',()=>{const m=mock(),context=m.start(),outer=m.begin('launcher_dependencies');m.state.now=100;const inner=m.begin('launcher_source');m.state.now=300;m.end(inner);m.state.now=500;m.end(outer);m.finish(context);const last=m.frames().at(-1);assert.equal(last.rows[1][4],500);assert.equal(last.rows[2][4],200);assert.deepEqual(last.rows[1].slice(1,4),[1,1,0]);assert.equal(last.meaning,'INCLUSIVE_COMPLETED_CALLS_NOT_SUMMABLE_NOT_PROCESS_COUNTS');assert.equal(last.state,'OBSERVED');});
test('bounded snapshots retain in-progress facts before later synchronous work and one exact first refusal',()=>{const m=mock(),context=m.start();m.state.now=8000;const token=m.begin('enclosure_source');const mid=m.frames().at(-1);assert.deepEqual(mid.rows[6].slice(1,4),[1,0,0]);assert.equal(mid.rows[6][5],1);m.stage('NATIVE_COMPILER_BYTES');m.refusal();m.stage('BOUNDARY');m.refusal();m.state.now=8100;m.end(token,true);m.finish(context);const last=m.frames().at(-1);assert.equal(last.guardStage,'NATIVE_COMPILER_BYTES');assert.equal(last.refusal,true);assert.deepEqual(last.rows[6].slice(1,4),[1,0,1]);assert.equal(last.rows[6][5],0);});
test('nine fixed768-byte snapshots fit reserved output and exhaustion does not skip real work',()=>{const m=mock(),context=m.start();for(let i=1;i<=9;i++){m.state.now=i*7000;const t=m.begin('launcher_dependencies');m.end(t);}m.finish(context);const frames=m.frames();assert.equal(frames.length,9);for(const chunk of m.state.chunks)assert(chunk.length<=768);assert(57728+9*768<65536);assert.equal(frames.at(-1).sequence,8);});
test('clock failure stays UNKNOWN after restoration, saturation and unknown IDs are explicit',()=>{let m=mock(),context=m.start(),t=m.begin('enclosure_rows');m.state.now=NaN;m.end(t);m.state.now=1;m.finish(context);assert.equal(m.frames().at(-1).state,'CLOCK_UNKNOWN');assert.equal(m.frames().at(-1).elapsedMs,null);assert.equal(m.frames().at(-1).rows[8][4],null);m=mock();context=m.start();for(let i=0;i<10000;i++){t=m.begin('launcher_compile');m.end(t);}m.finish(context);assert.equal(m.frames().at(-1).state,'SATURATED');m=mock();context=m.start();m.begin('ARBITRARY_PATH_OR_COMMAND');m.finish(context);assert.equal(m.frames().at(-1).state,'CAPTURE_FAILED');});
test('foreign tokens do not read properties, output failures never become observed capture',()=>{const m=mock(),context=m.start();let reads=0;m.end(new Proxy({},{get(){reads++;throw Error('PRIVATE');}}));m.finish(context);assert.equal(reads,0);assert.equal(m.frames().at(-1).state,'CAPTURE_FAILED');const n=mock(),c=n.start();n.state.writeFault=true;n.state.now=8000;const t=n.begin('enclosure_tool');n.end(t);n.state.writeFault=false;n.finish(c);assert.equal(n.frames().at(-1).state,'CAPTURE_FAILED');});
const fixture=mock(),context=fixture.start();fixture.state.now=8000;fixture.begin('enclosure_source');const frames=fixture.frames();
const parentURL=new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url),posix={skip:process.platform==='win32'?'POSIX isolated Python source/mock only; not native Windows acceptance':false};
const execute=code=>JSON.parse(execFileSync('/usr/bin/python3',['-I','-S','-c',code,fileURLToPath(parentURL)],{input:JSON.stringify({frames}),encoding:'utf8',timeout:5000,maxBuffer:32768}));
const setup=String.raw`import copy,errno,importlib.util,json,math,os,signal,sys
spec=importlib.util.spec_from_file_location('fixed_cost_parent_source_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=json.loads(sys.stdin.read());checks=0
wire=lambda value:(json.dumps(value,separators=(',',':'))+'\n').encode()
`;
test('parent accepts only fixed CI cost prefix and retains known snapshots after malformed/partial suffix',posix,()=>{const p=execute(setup+String.raw`
for ci in (False,True):
 protocol=m.ProgressProtocol(_ci=ci)
 for value in data['frames']:protocol.feed(wire(value))
 assert len(protocol.cost_frames)==(2 if ci else 0);assert protocol.finish() is None;checks+=1
for patch in ({'sequence':9},{'guardStage':'/PRIVATE/PATH'},{'extra':'VALUE'},{'state':'PASS'},{'elapsedMs':float('inf')},{'refusal':'YES'}):
 protocol=m.ProgressProtocol(_ci=True);protocol.feed(wire(data['frames'][0]));bad={**data['frames'][1],**patch};protocol.feed(wire(bad));assert protocol.finish() is None and protocol.invalid and len(protocol.cost_frames)==1;checks+=1
for suffix in (b'{',b'{}\n',b'x'*769+b'\n'):
 protocol=m.ProgressProtocol(_ci=True)
 for value in data['frames']:protocol.feed(wire(value))
 protocol.feed(suffix);assert protocol.finish() is None and len(protocol.cost_frames)==2;checks+=1
report={'costFrames':data['frames']};fallback=m.unknown_with_observations(report,'BODY_DEADLINE',_ci=True);assert fallback['observed']['costCapture']['snapshot']['rows'][6][5]==1;checks+=1
summary=m.ci_public_summary(report,'BODY_DEADLINE');assert summary['outcome']=='UNKNOWN' and summary['buildResultCount'] is None and summary['costCapture']['validSnapshotCount']==2;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(p.checks,13);});

test('actual CI prerequisite source over owned in-memory fixture records retains a compiler guard refusal with zero dispatch',()=>{
 const cost=mock(),token=cost.start(),fixedCost={beginFixedCIPreparationCost:cost.begin,endFixedCIPreparationCost:cost.end,fixedCIPreparationGuardStage:cost.stage,fixedCIPreparationRefusal:cost.refusal};
 const url=new URL('./sealed-typescript-ci-native-assets.test.mjs',import.meta.url);let text=fs.readFileSync(url,'utf8').split('const noAuthority=')[0].replace(/^import .*;$/gm,'').replaceAll(',import.meta.url)',','+JSON.stringify(url.href)+')');
 text=text.replace('const process={platform:', 'const process={fixedCost,platform:').replace('const fixedCost={beginFixedCIPreparationCost:()=>null,endFixedCIPreparationCost:()=>{},fixedCIPreparationGuardStage:()=>{},fixedCIPreparationRefusal:()=>{}};','const fixedCost=process.fixedCost;');
 const setup=Function('fixedCost','fs','path','fileURLToPath','createHash','assert',text+';return setup;')(fixedCost,fs,path.posix,fileURLToPath,createHash,assert),m=setup(true);
 m.nodes.get('/Library/Developer/CommandLineTools/usr/bin/clang').mode|=0o22n;
 const value=m.run();assert.equal(value.outcome,'UNKNOWN');assert.equal(m.state.dispatches.length,0);cost.finish(token);
 const last=cost.frames().at(-1);assert.equal(last.guardStage,'NATIVE_COMPILER_BYTES');assert.equal(last.refusal,true);assert.deepEqual(last.rows[0].slice(1,4),[1,1,0]);
});

test('actual parent collection keeps cost prefix after body deadline or cancellation with no inferred process counts',posix,()=>{
 const parentFixture=fs.readFileSync(new URL('./sealed-typescript-ci-enclosure-parent.test.mjs',import.meta.url),'utf8'),part=parentFixture.slice(parentFixture.indexOf('const lifecycle=String.raw`'),parentFixture.indexOf("test('CI collection keeps")),lifecycle=Function(part+';return lifecycle;')();
 const result=execute(setup+lifecycle+String.raw`
for cancelled in (False,True):
 calls=[0];cancel=m.NativeCancellation()
 def clock():
  calls[0]+=1
  if calls[0]>1:
   if cancelled:cancel.requested=True;return 0
   return 60
  return 0
 report=collection({'raw':b''.join(wire(frame) for frame in data['frames'])},clock=clock,cancellation=cancel)
 assert report['outcome']=='UNKNOWN' and report['reason_code']==('CANCELLED' if cancelled else 'BODY_DEADLINE')
 assert len(report['costFrames'])==2 and report['costFrames'][-1]['rows'][6][5]==1
 summary=m.ci_public_summary(report);assert summary['buildResultCount'] is None and summary['costCapture']['snapshot']['rows'][6][5]==1;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0}))
`);assert.equal(result.checks,2);assert.equal(result.kernelMonitors,0);
});

test('throwing diagnostic clock is UNKNOWN without suppressing the wrapped validation operation',()=>{const m=mock();m.state.clockThrows=true;const c=m.start(),t=m.begin('launcher_tool');let operations=0;try{operations++;}finally{m.end(t);}m.finish(c);assert.equal(operations,1);assert.equal(m.frames().at(-1).state,'CLOCK_UNKNOWN');assert.equal(m.frames().at(-1).rows[4][4],null);});
test('maximal fixed snapshot field widths stay inside768 bytes independently of the global cap',()=>{const v=structuredClone(frames[0]);v.sequence=8;v.elapsedMs=64999.999;v.state='CAPTURE_FAILED';v.guardStage='NATIVE_BUILD_PRECONDITION';v.refusal=true;v.rows=v.rows.map((_,i)=>[i,9999,9999,0,60000000.999,0]);assert(Buffer.byteLength(JSON.stringify(v)+'\n')<=768);});
