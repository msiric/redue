// SOURCE/MOCK only. Fixed CI wire data is produced by the capture-null mock
// observer. All tested Python filesystem/process/signal operations are mocks.
// No actual fixture, C/SDK, helper, native, model, auth or CI operation occurs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {observeFixedCIEnclosurePreparation as observe} from './acceptance/sealed-typescript-enclosure-provisioning.mjs';
const parentURL=new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url);
const driverURL=new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs',import.meta.url);
const parent=fs.readFileSync(parentURL,'utf8'),driver=fs.readFileSync(driverURL,'utf8');
const sha=body=>createHash('sha256').update(body).digest('hex');
const posix={skip:process.platform==='win32'?'POSIX Python source mocks require /usr/bin/python3, pwd and SIGHUP; not native Windows acceptance':false};
async function mockWire(nonzero=false){
 const flags={sealed:false,reuseEligible:false},value=outcome=>({outcome,...flags});
 const build=count=>({...value('BUILT_NOT_EXECUTED'),dispatchAttemptCount:count,
  builds:Array.from({length:count},(_,i)=>({pidObserved:true,completed:true,status:nonzero&&i===0?1:0,signal:null,spawnError:'NONE',stdoutBytes:0,stderrBytes:0}))});
 const op={preparePair:()=>({...value('BASE_EXCHANGE_PAIR_PREPARED'),baseA:'/private/tmp/redue-ci-recipient-11111111',baseB:'/private/tmp/redue-ci-recipient-22222222'}),
  createHost:()=>({...value('CI_SYNTHETIC_BOOTSTRAP_PREPARED'),base:'/private/tmp/redue-ci-recipient-33333333'}),
  prepareHostFixture:()=>value('SYNTHETIC_FIXTURE_PREPARED'),buildAssets:()=>build(3),assetsProfile:()=> 'fixed-native-assets-ci-sdk26.5-toolpair-b@1',verifyAssets:()=>value('BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'),
  preparePairedSource:()=>({...flags,disabled:true}),buildPaired:()=>build(2),verifyPaired:()=>value('PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'),
  provisionCopies:()=>value('CAMPAIGN_COPIES_OBSERVED_NOT_EXECUTED'),verifyCopies:()=>value('CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'),
  buildLauncher:()=>({...build(1),outcome:'CAMPAIGN_LAUNCHER_BUILT_NOT_EXECUTED'}),verifyLauncher:()=>value('CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'),
  prepareProjection:()=>value('ORIGINAL_PROTECTED_INPUT_PROJECTION_PREPARED'),prepareNull:()=>({...flags,disabled:true,version:'campaign-prepared-devnull-setexec@2'}),
  prepareEnclosure:()=>({...value('FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED'),version:'fixed-canary-finite-enclosure-source@2',fixtureProfileId:'fixed-native-assets-ci-sdk26.5-toolpair-b@1'}),
  buildEnclosure:()=>({...build(2),report:{profileId:'fixed-enclosure-ci-sdk26.5-toolpair-b@1',sourceVersion:'fixed-canary-finite-enclosure-source@2',files:Array.from({length:6},()=>({digest:'a'.repeat(64)}))}}),
  verifyEnclosure:()=>value('ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED')};
 const frames=[],report=await observe({ready:()=>true,load:async()=>op,now:()=>0,observeProgress:frame=>frames.push(frame)});
 return {frames,report};
}
const good=await mockWire(),failed=await mockWire(true);
const execute=script=>JSON.parse(execFileSync('/usr/bin/python3',['-I','-S','-c',script,fileURLToPath(parentURL)],{
 input:JSON.stringify({good,failed}),encoding:'utf8',timeout:5000,maxBuffer:32768}));
const setup=String.raw`import contextlib,copy,errno,importlib.util,io,json,math,os,signal,sys
spec=importlib.util.spec_from_file_location('fixed_ci_parent_source_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=json.loads(sys.stdin.read());checks=0
# No arbitrary PID123 can reach an OS watcher or process operation.
m.open_owned_exit_monitor=lambda child:None
if hasattr(m.select,'kqueue'):m.select.kqueue=lambda:(_ for _ in ()).throw(AssertionError('FORBIDDEN_KERNEL_MONITOR'))
handlers={sig:('ORIGINAL',sig) for sig in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT)}
m.signal.getsignal=lambda sig:handlers[sig]
def registration(sig,handler):old=handlers[sig];handlers[sig]=handler;return old
m.signal.signal=registration
wire=lambda frames:b''.join((json.dumps(frame,separators=(',',':'))+'\n').encode() for frame in frames)
final=lambda report:{'schema':1,'protocol':'fixed-enclosure-progress@2','kind':'FINAL','report':report}
`;
test('fixed CI route binds reviewed sources and exact build-only CLI without a context/native dispatcher',()=>{
 assert.equal(good.report.outcome,'BUILT_NOT_EXECUTED');assert.equal(good.report.buildResultCount,8);assert.equal(good.report.phases.length,19);
 assert.equal(failed.report.compilerBuildOutcome,'EXIT_NONZERO');
 assert(parent.includes('INNER_SHA256 = "'+sha(driver)+'"'));
 assert(parent.includes('("enclosure-provisioning.mjs", "'+sha(driver)+'")'));
 assert.match(parent,/sys\.argv\[1:\] == \["--ci-run"\]/);
 assert.match(parent,/shutil\.which\("node", path=host_path\)/);
 assert.match(parent,/rows\[2\]\["mark"\]\[6\] == 121593488/);
 assert.match(parent,/"--fixed-ci-preparation-child" if _ci else "--fixed-preparation-child"/);
 const cli=driver.slice(driver.indexOf('const here=fileURLToPath(import.meta.url)'));
 assert.match(cli,/\['--fixed-preparation-child','--fixed-ci-preparation-child'\]/);
 assert.match(cli,/load:ci\?fixedCIOperations:fixedOperations,ready:ci\?fixedCIReady:fixedReady/);
 assert(!/prepareFixedCIEnclosureContext|runFixedNativeEnclosureDiagnostic/.test(cli));
 assert(!/shell=True|os\.environ\.(?:pop|clear|update)/.test(parent));
});
test('CI and local profiles cannot satisfy each other in FINAL, progress or fallback paths',posix,()=>{
 const result=execute(setup+String.raw`
ci=data['good']['report'];local={k:v for k,v in ci.items() if k!='selectedToolPair'};local['profile']='fixed-enclosure-preparation-local-sdk27@2'
for report,ci_selected in [(ci,True),(local,False)]:
 assert m.parse_inner((json.dumps(report)+'\n').encode(),_ci=ci_selected)==report;checks+=1
 try:m.parse_inner((json.dumps(report)+'\n').encode(),_ci=not ci_selected);raise AssertionError('PROFILE_CONFUSION')
 except ValueError:checks+=1
 for protocol_ci in (False,True):
  p=m.ProgressProtocol(_ci=protocol_ci);p.feed(wire(data['good']['frames']+[final(report)]));parsed=p.finish()
  assert (parsed is not None)==(protocol_ci==ci_selected);assert len(p.frames)==38;checks+=1
for ci_flag in (None,1,'CI'):
 try:m.parse_inner(b'{}\n',_ci=ci_flag);raise AssertionError('UNFIXED_PROFILE_SELECTOR')
 except ValueError:checks+=1
retained=m.unknown_with_observations({'innerReport':ci,'progressFrames':data['good']['frames']},'PERSISTENCE_UNAVAILABLE',_ci=True)
assert retained['observed']['innerReport']['profile']==m.CI_PROFILE;checks+=1
assert 'innerReport' not in m.unknown_with_observations({'innerReport':ci},'PERSISTENCE_UNAVAILABLE')['observed'];checks+=1
summary=m.ci_public_summary({'outcome':'BUILT_NOT_EXECUTED','reason_code':'PREPARATION_OBSERVED','innerReport':ci,'progressFrames':data['good']['frames'],'childReaped':True,'childExitCode':0,'childSignal':None,'groupAbsentAfterReap':True,'cleanupSignal':'SENT','finalSourceCurrentness':'ENDPOINTS_OBSERVED'},record='/owned/enclosure-ci-preparation-11111111-2222-3333-4444-555555555555.json',digest='b'*64)
assert summary['outcome']=='BUILT_NOT_EXECUTED' and summary['buildResultCount']==8 and summary['observedProcessCount']==8 and summary['completedPhaseCount']==19
assert summary['protocolStatus']=='FINAL_VALIDATED' and summary['validatedProgressFrameCount']==38
assert summary['buildProfileObserved']=='fixed-enclosure-ci-sdk26.5-toolpair-b@1'
assert '/' not in summary['record'] and summary['recordAdoptionAuthority'] is False and summary['originAuthority'] is False
assert len(json.dumps(summary).encode())<8192;checks+=1
for body in [b'{}\n',wire(data['good']['frames']+[final(ci)])[:-1],wire(data['good']['frames']+[final(ci)])+b'{}\n',b'x'*65537]:
 p=m.ProgressProtocol(_ci=True);p.feed(body);assert p.finish() is None;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);
 assert.equal(result.checks,18);assert.equal(result.testedPopen,0);
});
test('CI PATH selection, exact Node size/pins and forbidden key presence fail before any Node factory',posix,()=>{
 const result=execute(setup+String.raw`
m.os.getuid=m.os.geteuid=lambda:501;m.os.getgid=m.os.getegid=lambda:20;m.sys.platform='darwin';m.platform.machine=lambda:'arm64'
m.Path.is_file=lambda self:True
selected={'path':'/selected/bin/node','bad':None};seen=[];which_calls=[];current=[]
def resolve(self,strict=False):return m.Path('/actual/canonical/node') if str(self)=='/selected/bin/node' else self
m.Path.resolve=resolve
m.shutil.which=lambda name,path:which_calls.append((name,path)) or selected['path']
def inspect(file,owner,limit,expected=None):
 seen.append((str(file),owner,limit,expected))
 if str(file)=='/actual/canonical/node' and selected['bad']=='digest':raise ValueError('SOURCE_MOCK_HASH_REFUSAL')
 size=121593487 if selected['bad']=='size' else 121593488
 return {'file':str(file),'mark':(1,2,0o100755,owner,20,1,size,1,2),'sha256':expected,'limit':limit,'owner':owner}
m.inspect_file=inspect;m.file_current=lambda row:current.append(row)
for key in ('NODE_OPTIONS','node_path','NODE_REPL_EXTERNAL_MODULE','DYLD_INSERT_LIBRARIES','LD_PRELOAD','OPENSSL_CONF','SIMPLE','simple','REDUE_DECISION_PROFILE','REDUE_DECISION_PROFILE_FILE','REDUE_PROFILE_CONTEXT'):
 m.os.environ={'PATH':'/selected/bin',key:''};seen.clear();which_calls.clear()
 try:m.prerequisites(_ci=True);raise AssertionError('KEY_PRESENCE_ACCEPTED')
 except ValueError:pass
 assert seen==[] and which_calls==[];checks+=1
m.os.environ={'PATH':'/selected/bin','HTTPS_PROXY':'SOURCE_MOCK_VALUE_NOT_READ'};seen.clear();which_calls.clear();current.clear()
repo,entry,node,rows=m.prerequisites(_ci=True)
assert str(node)=='/actual/canonical/node' and entry.name==m.ENTRY_NAME and len(rows)==43 and len(current)==43
assert which_calls==[('node','/selected/bin')] and seen[2][1:]==(501,128*1024*1024,m.NODE_SHA256);checks+=1
for candidate,bad in [(None,None),('relative/node',None),('/selected/bin/node','digest'),('/selected/bin/node','size')]:
 selected.update(path=candidate,bad=bad);seen.clear();which_calls.clear()
 try:m.prerequisites(_ci=True);raise AssertionError('UNREVIEWED_NODE_ACCEPTED')
 except ValueError:pass
 assert len(which_calls)==1;checks+=1
for path in ('','x'*16385,'/selected\n/bin'):
 m.os.environ={'PATH':path};which_calls.clear()
 try:m.prerequisites(_ci=True);raise AssertionError('UNBOUNDED_PATH_ACCEPTED')
 except ValueError:pass
 assert which_calls==[];checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);
 assert.equal(result.checks,19);assert.equal(result.testedPopen,0);
});
const lifecycle=String.raw`
class Stream:
 def __init__(self,fd):self.fd=fd
 def fileno(self):return self.fd
 def close(self):pass
class Child:
 pid=123
 def __init__(self,code=0):self.stdout=Stream(10);self.stderr=Stream(11);self.code=code;self.events=[]
 def wait(self,timeout):self.events.append(('wait',timeout));assert 0<=timeout<=5;return self.code
class Key:
 def __init__(self,stream,role):self.fileobj=stream;self.data=role
class Selector:
 def __init__(self):self.keys={}
 def register(self,stream,event,role):self.keys[stream.fd]=Key(stream,role)
 def unregister(self,stream):self.keys.pop(stream.fd)
 def get_map(self):return self.keys
 def select(self,timeout):return [(next(iter(self.keys.values())),1)]
 def close(self):pass
m.os.set_blocking=lambda *args:None
def collection(payload,clock=None,cancellation=None):
 child=Child(0 if payload.get('report',{}).get('outcome')=='BUILT_NOT_EXECUTED' else 74)
 encoded=payload.get('raw',wire(payload.get('frames',[])+([final(payload['report'])] if 'report' in payload else [])))
 chunks={10:[encoded,b''],11:[b'']};now=[0]
 def tick():now[0]+=.001;return now[0]
 def read(fd,n):
  block=chunks[fd][0];part=block[:n];chunks[fd][0]=block[n:]
  if not chunks[fd][0]:chunks[fd].pop(0)
  return part
 def kill(pid,sig):
  assert pid==child.pid;child.events.append(('kill',sig))
  if sig==0:raise ProcessLookupError(errno.ESRCH,'SOURCE_MOCK')
 report=m.collect(child,clock=clock or tick,selector_factory=Selector,read=read,killpg=kill,started=0,_ci=True,_native_cancellation=cancellation)
 at=next(i for i,event in enumerate(child.events) if event[0]=='wait')
 assert ('kill',signal.SIGKILL) in child.events[:at] and all(event[0]!='kill' or event[1]==0 for event in child.events[at+1:])
 return report
`;
test('CI collection keeps original deadlines, strict prefix facts and latest nonzero facts without authority',posix,()=>{
 const result=execute(setup+lifecycle+String.raw`
for key in ('good','failed'):
 report=collection(data[key]);summary=m.ci_public_summary(report)
 assert report['scope']==m.CI_SCOPE and summary['scope']==m.CI_SCOPE
 assert summary['buildResultCount']==(8 if key=='good' else 3)
 assert summary['compilerBuildOutcome']==('EXIT_ZERO' if key=='good' else 'EXIT_NONZERO')
 assert summary['models']==0 and summary['helperExecutions']==0 and summary['recordAdoptionAuthority'] is False;checks+=1
report=collection(data['good'],clock=lambda:60);summary=m.ci_public_summary(report)
assert report['outcome']=='UNKNOWN' and report['reason_code']=='BODY_DEADLINE' and summary['buildResultCount'] is None;checks+=1
prefix=data['good']['frames'][:9]
report=collection({'raw':wire(prefix)});summary=m.ci_public_summary(report)
assert report['outcome']=='UNKNOWN' and summary['inProgressPhase']=='prerequisiteBuilds'
assert summary['countsMeaning']=='RETURNED_OBSERVATIONS_LOWER_BOUND' and summary['activeDispatchCount']=='UNKNOWN' and summary['compilerBuildOutcome']=='UNKNOWN';checks+=1
for raw in (b'x'*65537,wire(data['good']['frames']+[final(data['good']['report'])])[:-1]):
 report=collection({'raw':raw});assert report['outcome']=='UNKNOWN';checks+=1
report=collection(data['failed']);summary=m.ci_public_summary(report,'PERSISTENCE_UNAVAILABLE')
assert summary['outcome']=='UNKNOWN' and summary['compilerBuildOutcome']=='EXIT_NONZERO' and summary['buildResultCount']==3;checks+=1
for report in ({},{'outcome':'BUILT_NOT_EXECUTED'}):
 summary=m.ci_public_summary(report);assert summary['outcome']=='UNKNOWN' and summary['buildAttemptCount'] is None and summary['observedProcessCount'] is None;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0}))
`);
 assert.equal(result.checks,9);assert.equal(result.signals,0);
});

test('fixed CI main launches only the genuine CI flag and preserves owned cleanup across cancellation/late work',posix,()=>{
 const result=execute(setup+lifecycle+String.raw`
original_collect=m.collect;original_dumps=m.json.dumps;original_print=print;original_registration=registration
for when in ('normal','missing_precondition','late_preflight','changed_pin','wrong_profile','late_persistence','late_emission','before_launch','inside_popen','collection','cleanup','persistence','serialization','emission','restoration'):
 handlers.clear();handlers.update({sig:('ORIGINAL',sig) for sig in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT)});original_handlers=handlers.copy()
 state={'now':0,'popen':0,'persist':0,'fired':False};child=Child();events=[]
 payload=copy.deepcopy(data['good'])
 if when=='wrong_profile':payload['report']['profile']='fixed-enclosure-preparation-local-sdk27@2'
 encoded=wire(payload['frames']+[final(payload['report'])]);chunks={10:[encoded,b''],11:[b'']}
 m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000
 m.os.environ={'PATH':'/source-mock/path','HTTPS_PROXY':'SOURCE_MOCK_PROXY_UNCHANGED'}
 def clock():state['now']+=.001;return state['now']
 m.time.monotonic=clock
 def fire():
  state['fired']=True
  for sig in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT,signal.SIGINT):handlers[sig](sig,None)
 def register(sig,handler):
  if when=='restoration' and handler==original_handlers[sig] and not state['fired']:fire()
  return original_registration(sig,handler)
 m.signal.signal=register
 def precondition(_native=False,_ci=False):
  assert _ci and not _native
  if when=='missing_precondition':raise ValueError('SOURCE_MOCK_DENIAL')
  if when=='late_preflight':state['now']=60
  if when=='before_launch':fire()
  return m.Path('/owned'),m.Path('/fixed/driver'),m.Path('/canonical/node'),[{'source':'MOCK_ROW'}]
 m.prerequisites=precondition;m.prepare_record_directory=lambda repo:[]
 def current(row):
  events.append('current')
  if when=='changed_pin':raise ValueError('SOURCE_MOCK_PIN_CHANGE')
 m.file_current=current
 def popen(args,**kwargs):
  state['popen']+=1;events.append('popen')
  assert args==['/canonical/node','/fixed/driver','--fixed-ci-preparation-child']
  assert kwargs['env']==m.os.environ and kwargs['start_new_session'] is True and kwargs['stdin']==m.subprocess.DEVNULL
  if when=='inside_popen':fire()
  events.append('popen_return');return child
 m.subprocess.Popen=popen
 def read(fd,n):
  block=chunks[fd][0];part=block[:n];chunks[fd][0]=block[n:]
  if not chunks[fd][0]:chunks[fd].pop(0)
  if when=='collection' and fd==10 and part and chunks[fd]==[b'']:fire()
  return part
 def kill(pid,sig):
  assert pid==123;events.append(('kill',sig))
  if when=='cleanup' and sig==signal.SIGKILL:fire()
  if sig==0:raise ProcessLookupError(errno.ESRCH,'SOURCE_MOCK')
 def wait(timeout):events.append(('wait',timeout));assert 0<=timeout<=5;return 0
 child.wait=wait
 def collect(owned,**kwargs):
  assert owned is child and kwargs['_ci'] is True and '_native_deadline' not in kwargs
  return original_collect(owned,selector_factory=Selector,read=read,killpg=kill,**kwargs)
 m.collect=collect
 def save(*args,**kwargs):
  state['persist']+=1;assert kwargs=={'_ci':True}
  if when=='late_persistence':state['now']=65
  if when=='persistence':fire()
  return '/owned/enclosure-ci-preparation-11111111-2222-3333-4444-555555555555.json','b'*64
 m.save_record=save
 def dumps(value,*args,**kwargs):
  if isinstance(value,dict) and value.get('summaryInterpretation')=='fixed-ci-enclosure-preparation-summary@1':
   if when=='serialization' and not state['fired']:fire()
   if when=='late_emission':state['now']=65
  return original_dumps(value,*args,**kwargs)
 m.json.dumps=dumps
 def output(body):
  original_print(body)
  if when=='emission' and json.loads(body).get('record') is not None and not state['fired']:fire()
 m.print=output;m.sys.argv=['parent','--ci-run'];out=io.StringIO()
 with contextlib.redirect_stdout(out):status=m.main()
 rows=[json.loads(line) for line in out.getvalue().splitlines()];value=rows[-1]
 assert handlers==original_handlers and value['scope']==m.CI_SCOPE and value['profile']==m.CI_PROFILE
 assert value['models']==0 and value['helperExecutions']==0 and value['originAuthority'] is False and value['reuseEligible'] is False
 assert 'SOURCE_MOCK_PROXY_UNCHANGED' not in out.getvalue() and '/owned/' not in out.getvalue()
 if when=='normal':
  assert status==0 and value['outcome']=='BUILT_NOT_EXECUTED' and value['buildResultCount']==8 and value['completedPhaseCount']==19 and value['record'].startswith('enclosure-ci-preparation-')
 else:assert status==74 and value['outcome']=='UNKNOWN'
 if when in ('missing_precondition','late_preflight','changed_pin','before_launch'):
  assert state['popen']==0 and value['buildResultCount'] is None
 else:
  assert state['popen']==1
  at=next(i for i,event in enumerate(events) if isinstance(event,tuple) and event[0]=='wait')
  assert ('kill',signal.SIGKILL) in events[:at]
  assert all(not isinstance(event,tuple) or event[0]!='kill' or event[1]==0 for event in events[at+1:])
  assert value['childReaped'] is True
  if when=='inside_popen':assert value['buildResultCount'] is None
  else:assert value['buildResultCount']==8
 if when in ('before_launch','inside_popen','collection','cleanup','persistence','serialization','emission','restoration'):
  assert state['fired'] and value['reason_code']=='CANCELLED'
 if when in ('emission','restoration'):assert len(rows)==2 and rows[0]['outcome']=='BUILT_NOT_EXECUTED'
 checks+=1
m.json.dumps=original_dumps
print(original_dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0,'filesystemWrites':0}))
`);
 assert.equal(result.checks,15);assert.equal(result.testedPopen,0);assert.equal(result.signals,0);
});

test('retired A preparation report cannot satisfy B FINAL or survive fallback as a validated report',posix,()=>{
 const result=execute(setup+String.raw`
old={**data['good']['report'],'profile':'fixed-enclosure-preparation-ci-sdk26.5-toolpair-a@1'}
try:m.parse_inner((json.dumps(old)+'\n').encode(),_ci=True);raise AssertionError('RETIRED_A_ACCEPTED')
except ValueError:checks+=1
p=m.ProgressProtocol(_ci=True);p.feed(wire(data['good']['frames']+[final(old)]));assert p.finish() is None and p.invalid;checks+=1
fallback=m.unknown_with_observations({'innerReport':old,'progressFrames':data['good']['frames']},'PERSISTENCE_UNAVAILABLE',_ci=True)
assert 'innerReport' not in fallback['observed'];assert fallback['outcome']=='UNKNOWN';checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(result.checks,3);assert.equal(result.testedPopen,0);
});

test('fixed family retains exact A/B selection, refuses corrupted selection and never infers a pair from progress',posix,()=>{
 const result=execute(setup+String.raw`
for pair in ('A','B'):
 report={**data['good']['report'],'selectedToolPair':pair}
 assert m.parse_inner((json.dumps(report)+'\n').encode(),_ci=True)==report;checks+=1
 summary=m.ci_public_summary({'innerReport':report,'progressFrames':data['good']['frames']})
 suffix=pair.lower();assert summary['selectedToolPair']==pair and summary['expectedFixtureProfile']=='fixed-native-assets-ci-sdk26.5-toolpair-'+suffix+'@1' and summary['expectedBuildProfile']=='fixed-enclosure-ci-sdk26.5-toolpair-'+suffix+'@1';checks+=1
for pair in (None,True,1,'C',{},['A']):
 report={**data['good']['report'],'selectedToolPair':pair}
 try:m.parse_inner((json.dumps(report)+'\n').encode(),_ci=True);raise AssertionError('CORRUPT_SELECTION_ACCEPTED')
 except ValueError:checks+=1
for old_profile in ('fixed-enclosure-preparation-ci-sdk26.5-toolpair-a@1','fixed-enclosure-preparation-ci-sdk26.5-toolpair-b@1'):
 report={**data['good']['report'],'profile':old_profile}
 try:m.parse_inner((json.dumps(report)+'\n').encode(),_ci=True);raise AssertionError('OLD_PROFILE_ACCEPTED')
 except ValueError:checks+=1
summary=m.ci_public_summary({'progressFrames':data['good']['frames']})
assert summary['selectedToolPair'] is None and summary['expectedFixtureProfile'] is None and summary['expectedBuildProfile'] is None and summary['fixtureProfileObserved'] is None and summary['buildProfileObserved'] is None;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(result.checks,13);assert.equal(result.testedPopen,0);
});
