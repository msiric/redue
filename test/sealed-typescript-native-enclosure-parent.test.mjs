// SOURCE/MOCK parent+flat-summary controls only. Python interpreters run mocks;
// no tested Popen, kernel monitor, signals, C/SDK/native/model or auth operation.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const parentUrl=new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url),entryUrl=new URL('./acceptance/sealed-typescript-native-enclosure-child.mjs',import.meta.url),driverUrl=new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs',import.meta.url);
const parent=fs.readFileSync(parentUrl,'utf8'),entry=fs.readFileSync(entryUrl,'utf8'),sha=v=>createHash('sha256').update(v).digest('hex');
const summarize=Function('createHash',entry.slice(entry.indexOf('const reasons='),entry.indexOf('// Fixed FD1'))+';return summary;')(createHash);
function controller({failed=false,launched=true}={}){const prepared={outcome:'BUILT_NOT_EXECUTED',buildAttemptCount:8,buildResultCount:8,observedProcessCount:8,compilerBuildOutcome:'EXIT_ZERO',builds:Array.from({length:8},()=>({pidObserved:true,completed:true,status:0,signal:null,spawnError:'NONE'}))};return {schema:1,scope:'UNWIRED_FIXED_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY',outcome:failed?'FAIL':'UNKNOWN',reason:launched?'SYNTACTIC_NATIVE_COLLECTION_ONLY':'ACTIVATION_OR_RUNTIME_UNAVAILABLE',preparation:launched?prepared:null,observation:launched?{outcome:failed?'FAIL':'UNKNOWN',reportedAssertionOutcome:failed?'FAIL':'UNKNOWN',traceSyntaxValid:true,completionDataValid:true,commandSha256:'c'.repeat(64),body:{scope:'SOURCE_MOCK_BODY_NOT_NATIVE_EVIDENCE'}}:null,preparationAttempted:launched,nativeSpawnAttempts:launched?1:0,nativeLaunches:launched?1:0,models:launched?null:0,helperExecutions:launched?null:0,nativeSpawnObserved:launched,nativeExit:launched?0:null,nativeSignal:null,nativeCloseObserved:launched,nativeReaped:launched,timedOut:false,cancelled:false,overallBudgetExceeded:false,milliseconds:10,publicDataOnly:true,nativeAuthenticated:false,originAuthority:false,receiptAuthority:false,recordAdoptionAuthority:false,sealed:false,reuseEligible:false};}
const good=summarize(controller()),failed=summarize(controller({failed:true})),empty=summarize(null),early=summarize(controller({launched:false}));
const execute=(python,input={})=>JSON.parse(execFileSync('/usr/bin/python3',['-I','-S','-c',python,fileURLToPath(parentUrl)],{input:JSON.stringify(input),encoding:'utf8',timeout:5000,maxBuffer:32768}));
const setup=String.raw`import contextlib,copy,errno,hashlib,importlib.util,io,json,math,os,signal,sys
spec=importlib.util.spec_from_file_location('source_mock_fixed_parent',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=json.loads(sys.stdin.read());checks=0
# Main fixtures must never register arbitrary synthetic PID123 with the kernel.
m.open_owned_exit_monitor=lambda child:None
if hasattr(m.select,'kqueue'):m.select.kqueue=lambda:(_ for _ in ()).throw(AssertionError('FORBIDDEN_REAL_MONITOR'))
# Signal registration/queries are mocks too; no real process handlers change.
mock_handlers={selected:('ORIGINAL',selected) for selected in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT)}
m.signal.getsignal=lambda selected:mock_handlers[selected]
def mock_signal(selected,handler):
 old=mock_handlers[selected];mock_handlers[selected]=handler;return old
m.signal.signal=mock_signal
`;
test('flat child summary agrees with parent exact schema without raw body or source paths',()=>{for(const v of [good,failed,empty,early]){assert(Buffer.byteLength(JSON.stringify(v)+'\n')<4096);assert.equal(v.bodyRetained,false);assert.equal(Object.hasOwn(v,'body'),false);assert.equal(v.nativeAuthenticated,false);assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);}assert.equal(failed.outcome,'FAIL');assert.equal(empty.models,null);assert.equal(empty.nativeSpawnAttempts,null);assert.equal(early.models,0);const p=execute(setup+String.raw`
for value in data['values']:
 parsed=m.parse_native_final((json.dumps(value,separators=(',',':'))+'\n').encode());assert parsed==value;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'native':0}))
`,{values:[good,failed,empty,early]});assert.equal(p.checks,4);assert.equal(p.testedPopen,0);});
test('parent refuses malformed, duplicate, negative/nonfinite, oversized and authoritative summaries',()=>{const p=execute(setup+String.raw`
raw=(json.dumps(data['good'],separators=(',',':'))+'\n').encode()
cases=[b'',raw[:-1],raw+b'\n',b'\xff\n',b'\xef\xbb\xbf'+raw,b'x'*65537,raw.replace(b'"schema":1',b'"schema":1,"sch\\u0065ma":1'),raw.replace(b'"milliseconds":10',b'"milliseconds":NaN'),raw.replace(b'"milliseconds":10',b'"milliseconds":1e999'),raw.replace(b'"milliseconds":10',b'"milliseconds":-0'),raw.replace(b'"nativeSpawnAttempts":1',b'"nativeSpawnAttempts":-0')]
for patch in [{'sealed':True},{'nativeAuthenticated':True},{'outcome':'PASS'},{'extra':'PRIVATE'},{'schema':True},{'nativeSpawnAttempts':True},{'nativeLaunches':0},{'preparationOutcome':None},{'models':0},{'completionDataValid':True,'timedOut':True},{'preparationAttempted':False},{'preparationBuildAttemptCount':None,'preparationBuildResultCount':None,'preparationObservedProcessCount':None},{'commandSha256':None},{'parsedBodySha256':None}]:
 value={**data['good'],**patch};cases.append((json.dumps(value)+'\n').encode())
for index,body in enumerate(cases):
 try:m.parse_native_final(body);raise AssertionError('INVALID_ACCEPTED_INDEX_'+str(index))
 except (ValueError,TypeError,UnicodeError,KeyError):checks+=1
print(json.dumps({'checks':checks,'testedPopen':0}))
`,{good});assert.equal(p.checks,25);});
test('fixed entry, driver and finite literal source pins match actual source; no dynamic CLI selector',()=>{assert(Buffer.byteLength(parent)<=131072);assert(parent.includes('PARENT_SOURCE_LIMIT = 131072'));assert(parent.includes('inspect_file(here, uid, PARENT_SOURCE_LIMIT)'));assert(parent.includes('NATIVE_ENTRY_SHA256 = "'+sha(entry)+'"'));assert(parent.includes('INNER_SHA256 = "'+sha(fs.readFileSync(driverUrl))+'"'));const table=parent.slice(parent.indexOf('NATIVE_SOURCE_PINS = ('),parent.indexOf('NATIVE_SCOPE ='));const rows=[...table.matchAll(/\("([^"]+)", "([a-f0-9]{64})"\)/g)].map(row=>[row[0],row.index>=table.indexOf('NATIVE_SEALED_SOURCE_PINS')&&row.index<table.indexOf('NATIVE_ROOT_SOURCE_PINS')?'sealed-typescript-'+row[1]:row[1],row[2]]);assert.equal(rows.length,39);for(const [,name,pin]of rows){const url=name.startsWith('src/')?new URL('../'+name,import.meta.url):new URL('./acceptance/'+name,import.meta.url);assert.equal(sha(fs.readFileSync(url)),pin,name);}assert.match(parent,/sys\.argv\[1:\] == \["--native-run"\]/);assert.match(parent,/subprocess\.Popen\(\[str\(node\), str\(entry\)\], cwd=repo/);assert.match(entry,/process\.argv\.length!==2/);assert.match(entry,/writeSync\(1,body,offset,body\.length-offset\)/);assert(!/process\.env|spawn\(|execFile|readFile/.test(entry));});
test('native-only profiling and preload presence checks run before any Node factory',()=>{const p=execute(setup+String.raw`
orig=(m.os.getuid,m.os.geteuid,m.os.getgid,m.os.getegid,m.sys.platform,m.platform.machine,m.pwd.getpwuid,m.inspect_file,m.file_current,m.os.environ)
try:
 m.os.getuid=m.os.geteuid=lambda:501;m.os.getgid=m.os.getegid=lambda:20;m.sys.platform='darwin';m.platform.machine=lambda:'arm64';m.pwd.getpwuid=lambda uid:type('Owner',(),{'pw_dir':'/owned'})()
 seen=[];m.inspect_file=lambda file,owner,limit,expected=None:seen.append((str(file),expected)) or {'file':str(file)};m.file_current=lambda row:None
 for key in ['NODE_OPTIONS','node_path','DYLD_INSERT_LIBRARIES','REDUE_DECISION_PROFILE','REDUE_DECISION_PROFILE_FILE','REDUE_PROFILE_CONTEXT']:
  m.os.environ={key:''};seen.clear()
  try:m.prerequisites(_native=True);raise AssertionError('PRESENCE_NOT_REJECTED')
  except ValueError:pass
  assert seen==[];checks+=1
 m.os.environ={};seen.clear();repo,entry,node,rows=m.prerequisites(_native=True);assert entry.name==m.NATIVE_ENTRY_NAME and len(rows)==42 and len(seen)==42;checks+=1
 # Profiling behavior of old report-only preparation is intentionally unchanged.
 m.os.environ={'REDUE_DECISION_PROFILE':''};m.prerequisites();checks+=1
finally:
 m.os.getuid,m.os.geteuid,m.os.getgid,m.os.getegid,m.sys.platform,m.platform.machine,m.pwd.getpwuid,m.inspect_file,m.file_current,m.os.environ=orig
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(p.checks,8);assert.equal(p.kernelMonitors,0);});
const lifecycle=String.raw`
class Stream:
 def __init__(self,fd):self.fd=fd
 def fileno(self):return self.fd
 def close(self):pass
class Child:
 pid=123
 def __init__(self):self.stdout=Stream(10);self.stderr=Stream(11);self.events=[]
 def wait(self,timeout):self.events.append(('wait',timeout));assert 0<=timeout<=5;return 0
class Key:
 def __init__(self,stream,role):self.fileobj=stream;self.data=role
class Selector:
 def __init__(self):self.keys={}
 def register(self,stream,event,role):self.keys[stream.fd]=Key(stream,role)
 def unregister(self,stream):self.keys.pop(stream.fd)
 def get_map(self):return self.keys
 def select(self,timeout):return [(next(iter(self.keys.values())),1)]
 def close(self):pass
class Monitor:
 def exited(self,timeout):assert 0<=timeout<=.1;return True
 def close(self):pass
m.os.set_blocking=lambda *a:None

def run(value,initial=0,monitor=False,clock_failure=False):
 body=(json.dumps(value,separators=(',',':'))+'\n').encode() if value is not None else b''
 child=Child();chunks={10:[body,b''],11:[b'']};now=[initial];ticks=[0]
 def clock():
  ticks[0]+=1
  if clock_failure and ticks[0]>3:return float('nan')
  now[0]+=.001;return now[0]
 def read(fd,n):return chunks[fd].pop(0)
 def kill(pid,sig):
  assert pid==child.pid;child.events.append(('kill',sig))
  if sig==0:raise ProcessLookupError(errno.ESRCH,'PRIVATE')
 report=m.collect(child,clock=clock,selector_factory=Selector,read=read,killpg=kill,started=0,exit_monitor=Monitor() if monitor else None,_native_deadline=120)
 waits=[at for at,e in enumerate(child.events) if e[0]=='wait'];assert waits
 assert all(e[0]!='kill' or e[1]==0 for e in child.events[waits[0]+1:])
 if not monitor or report['cleanupSignal']!='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED':assert ('kill',signal.SIGKILL) in child.events[:waits[0]]
 return report,child
`;
test('native mode reuses one kill-before-wait/kernel gate, fixed deadlines, nullable counts and sticky FAIL',()=>{const p=execute(setup+lifecycle+String.raw`
for value in [data['good'],data['failed'],data['early']]:
 report,child=run(value,monitor=True);assert report['collectionStatus']=='COMPLETE_DATA_REPORT';assert report['groupClosureScope']=='OWNED_NODE_GROUP_ONLY' and report['detachedDescendantClosure']=='UNKNOWN';assert report['cleanupSignal']=='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED';checks+=1
report,child=run(None);assert report['collectionStatus']=='UNKNOWN' and report['models'] is None and report['nativeAgentLaunches'] is None;checks+=1
report,child=run(data['good'],initial=115);assert report['reason_code']=='BODY_DEADLINE' and report['nativeSummary'] is None and report['models'] is None;checks+=1
report,child=run(data['failed'],clock_failure=True);assert report['collectionStatus']=='UNKNOWN' and report['reportedAssertionOutcome']=='FAIL' and report['models'] is None;assert report['reason_code']=='CLOCK_UNAVAILABLE';checks+=1
for reason in ['CLOCK_UNAVAILABLE','PERSISTENCE_UNAVAILABLE','SOURCE_CURRENTNESS_UNAVAILABLE']:
 fallback=m.native_unknown({'nativeSummary':data['failed']},reason);assert fallback['reportedAssertionOutcome']=='FAIL' and fallback['outcome']=='FAIL' and fallback['models'] is None;checks+=1
for value in [data['empty'],data['good']]:
 report,child=run(value);assert report['models'] is None;assert report['nativeAuthenticated'] is False;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'native':0,'signals':0,'kernelMonitors':0}))
`,{good,failed,empty,early});assert.equal(p.checks,11);assert.equal(p.signals,0);});
test('native main rejects stale/future start and late preflight, preserves failure through persistence deadline',()=>{const p=execute(setup+String.raw`
m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000;m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000'}
state={'clock':0,'popen':0,'persist':0};m.time.monotonic=lambda:state['clock'];m.prepare_record_directory=lambda repo:[];m.file_current=lambda row:None
m.prerequisites=lambda _native=False:(m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[])
def popen(*args,**kwargs):state['popen']+=1;assert args[0]==['/fixed/node','/fixed/entry'] and kwargs['start_new_session'] and kwargs['env']==m.os.environ;return object()
m.subprocess.Popen=popen
for stamp in ['1700000000001','1699999885000','bad']:
 m.os.environ['REDUE_DIAGNOSTIC_JOB_STARTED_MS']=stamp;out=io.StringIO()
 with contextlib.redirect_stdout(out):assert m.native_main()==74
 assert state['popen']==0 and json.loads(out.getvalue())['models'] is None;checks+=1
m.os.environ['REDUE_DIAGNOSTIC_JOB_STARTED_MS']='1700000000000'
def late(_native=False):state['clock']=115;return m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[]
m.prerequisites=late;out=io.StringIO()
with contextlib.redirect_stdout(out):assert m.native_main()==74
assert state['popen']==0;checks+=1
m.prerequisites=lambda _native=False:(m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[]);state['clock']=0
def collection(*args,**kwargs):
 assert kwargs['_native_deadline']==120 and kwargs['started']==0;state['clock']=10
 return {'scope':m.NATIVE_SCOPE,'outcome':'FAIL','reportedAssertionOutcome':'FAIL','collectionStatus':'COMPLETE_DATA_REPORT','reason_code':'NATIVE_DATA_REPORT_OBSERVED','bodyElapsedMs':9000,'elapsedMs':10000,'nativeSummary':data['failed'],'models':None,'helperExecutions':None,'nativeAgentLaunches':1}
m.collect=collection
def persist(*args,**kwargs):
 assert kwargs['_native'] is True;state['persist']+=1;state['clock']=14;return '/owned/report','b'*64
m.save_record=persist;out=io.StringIO()
with contextlib.redirect_stdout(out):assert m.native_main()==74
value=json.loads(out.getvalue());assert value['reportedAssertionOutcome']=='FAIL' and value['collectionStatus']=='UNKNOWN' and value['models'] is None and state['popen']==1 and state['persist']==1;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0,'filesystemWrites':0}))
`,{failed});assert.equal(p.checks,5);assert.equal(p.testedPopen,0);});

test('fixed selectors and source pin refusal launch zero children',()=>{
 const p=execute(setup+String.raw`
m.time.monotonic=lambda:0;m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000
m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000'}
state={'children':0,'rows':0}
def forbidden(*args,**kwargs):state['children']+=1;raise AssertionError('FORBIDDEN_CHILD')
m.subprocess.Popen=forbidden
for args in [[],['--native-run','extra'],['--native-run=/unreviewed'],['--other']]:
 m.sys.argv=['parent',*args];out=io.StringIO()
 with contextlib.redirect_stdout(out):assert m.main()==0
 assert json.loads(out.getvalue())['outcome']=='NOT_SELECTED';checks+=1
m.prerequisites=lambda _native=False:(m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[{'mock':'pin'}])
m.prepare_record_directory=lambda repo:[]
def stale(row):state['rows']+=1;raise ValueError('SOURCE_MOCK_PIN_CHANGED')
m.file_current=stale
out=io.StringIO()
with contextlib.redirect_stdout(out):assert m.native_main()==74
assert state['rows']==1 and state['children']==0
value=json.loads(out.getvalue());assert value['models'] is None and value['nativeAgentLaunches'] is None;checks+=1
# Protected job elapsed is subtracted once from the original parent budget.
m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1699999990000'}
clock=m.PreparationMonotonicClock(lambda:1,0);assert m.native_deadline(clock)==110;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);
 assert.equal(p.checks,6);assert.equal(p.testedPopen,0);
});

test('stream caps, malformed output, cancellation and later transport failures remain non-authoritative',()=>{
 const p=execute(setup+lifecycle+String.raw`
def stream_case(stdout,stderr=b'',exit_code=0,interrupt=False):
 child=Child();chunks={10:[stdout,b''],11:[stderr,b'']};now=[0]
 def clock():now[0]+=.001;return now[0]
 def read(fd,n):
  if interrupt:raise KeyboardInterrupt()
  return chunks[fd].pop(0)
 def kill(pid,sig):
  assert pid==123;child.events.append(('kill',sig))
  if sig==0:raise ProcessLookupError(errno.ESRCH,'SOURCE_MOCK')
 def wait(timeout):child.events.append(('wait',timeout));return exit_code
 child.wait=wait
 try:report=m.collect(child,clock=clock,selector_factory=Selector,read=read,killpg=kill,started=0,_native_deadline=120)
 except KeyboardInterrupt:
  raise AssertionError('NATIVE_INTERRUPT_ESCAPED')
 wait_index=next(at for at,event in enumerate(child.events) if event[0]=='wait')
 assert ('kill',signal.SIGKILL) in child.events[:wait_index]
 assert all(event[0]!='kill' or event[1]==0 for event in child.events[wait_index+1:])
 return report
valid=(json.dumps(data['failed'],separators=(',',':'))+'\n').encode()
for stdout,stderr in [(b'x'*65537,b''),(valid,b'x'*4097),(b'{}\n',b''),(valid[:-1],b''),(valid+b'{}\n',b'')]:
 report=stream_case(stdout,stderr);assert report['collectionStatus']=='UNKNOWN' and report['nativeAuthenticated'] is False
 if stdout!=valid:assert report['models'] is None and report['nativeAgentLaunches'] is None
 checks+=1
report=stream_case(valid,b'SOURCE_MOCK_STDERR');assert report['collectionStatus']=='UNKNOWN' and report['reportedAssertionOutcome']=='FAIL';checks+=1
report=stream_case(valid,exit_code=-signal.SIGTERM);assert report['collectionStatus']=='UNKNOWN' and report['reportedAssertionOutcome']=='FAIL' and report['childSignal']==signal.SIGTERM;checks+=1
report=stream_case(b'',interrupt=True);assert report['collectionStatus']=='UNKNOWN' and report['reason_code']=='CANCELLED' and report['models'] is None;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0}))
`,{failed});
 assert.equal(p.checks,8);assert.equal(p.signals,0);
});

test('native cancellation is latched across launch, collection, cleanup, persistence and emission',()=>{
 const p=execute(setup+lifecycle+String.raw`
original_collect=m.collect;original_dumps=m.json.dumps;original_print=print;original_signal_mock=m.signal.signal
for selected in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT):
 for when in ('before_launch','inside_popen','collection','cleanup','persistence','serialization','emission','restoration'):
  mock_handlers.clear();mock_handlers.update({sig:('ORIGINAL',sig) for sig in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT)})
  original_handlers=mock_handlers.copy();events=[];state={'now':0,'popen':0,'persist':0,'fired':False};child=Child()
  chunks={10:[(original_dumps(data['failed'],separators=(',',':'))+'\n').encode(),b''],11:[b'']}
  m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000;m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000'}
  def clock():state['now']+=.001;return state['now']
  m.time.monotonic=clock
  def fire():
   state['fired']=True
   # These are function calls to mock-installed handlers, not OS signals.
   for sig in (selected,selected,signal.SIGTERM,signal.SIGHUP,signal.SIGINT):
    mock_handlers[sig](sig,None)
  def registration(sig,handler):
   if when=='restoration' and handler==original_handlers[sig] and not state['fired']:fire()
   return original_signal_mock(sig,handler)
  m.signal.signal=registration
  def prerequisites(_native=False):
   assert _native
   if when=='before_launch':fire()
   return m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[]
  m.prerequisites=prerequisites;m.prepare_record_directory=lambda repo:[];m.file_current=lambda row:None
  def popen(*args,**kwargs):
   state['popen']+=1;events.append('popen')
   if when=='inside_popen':fire()
   # Latching must let the factory return its owned handle, not async raise.
   events.append('popen_return');return child
  m.subprocess.Popen=popen
  def read(fd,n):
   value=chunks[fd].pop(0)
   if when=='collection' and value:fire()
   return value
  def kill(pid,sig):
   assert pid==123;events.append(('kill',sig))
   if when=='cleanup' and sig==signal.SIGKILL:fire()
   if sig==0:raise ProcessLookupError(errno.ESRCH,'SOURCE_MOCK')
  def wait(timeout):events.append(('wait',timeout));assert 0<=timeout<=5;return 0
  child.wait=wait
  def collection(owned,**kwargs):
   assert owned is child
   return original_collect(owned,selector_factory=Selector,read=read,killpg=kill,**kwargs)
  m.collect=collection
  def persist(*args,**kwargs):
   state['persist']+=1
   if when=='persistence':fire()
   return '/owned/report','b'*64
  m.save_record=persist
  def dumps(value,*args,**kwargs):
   if when=='serialization' and isinstance(value,dict) and 'record' in value:fire()
   return original_dumps(value,*args,**kwargs)
  m.json.dumps=dumps
  def output(body):
   original_print(body)
   if when=='emission' and 'record' in json.loads(body):fire()
  m.print=output
  out=io.StringIO()
  with contextlib.redirect_stdout(out):status=m.native_main()
  records=[json.loads(line) for line in out.getvalue().splitlines()];value=records[-1]
  assert state['fired'] and status==74 and value['collectionStatus']=='UNKNOWN' and value['reason_code']=='CANCELLED'
  assert value['nativeAuthenticated'] is False and value['reuseEligible'] is False and mock_handlers==original_handlers
  if when=='before_launch':assert state['popen']==0 and value['models'] is None and value['nativeAgentLaunches'] is None
  else:
   assert state['popen']==1 and events[:2]==['popen','popen_return']
   wait_index=next(i for i,event in enumerate(events) if isinstance(event,tuple) and event[0]=='wait')
   assert ('kill',signal.SIGKILL) in events[:wait_index]
   assert all(not isinstance(event,tuple) or event[0]!='kill' or event[1]==0 for event in events[wait_index+1:])
   assert value['observed']['childReaped'] is True
   if when!='inside_popen':assert value['outcome']=='FAIL' and value['reportedAssertionOutcome']=='FAIL'
   else:assert value['models'] is None and value['nativeAgentLaunches'] is None
  if when in ('emission','restoration'):assert len(records)==2 and records[0]['collectionStatus']=='COMPLETE_DATA_REPORT'
  else:assert len(records)==1
  checks+=1
m.json.dumps=original_dumps
print(json.dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0,'filesystemWrites':0}))
`,{failed});
 assert.equal(p.checks,24);assert.equal(p.signals,0);assert.equal(p.testedPopen,0);
});

test('handler setup/refusal restores prior mock handlers; the old route never installs them',()=>{
 const p=execute(setup+String.raw`
originals=mock_handlers.copy();calls=[];signal_mock=m.signal.signal
m.time.monotonic=lambda:0;m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000;m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000'}
def partial(selected,handler):
 calls.append((selected,handler))
 if selected==signal.SIGHUP and callable(handler):raise ValueError('SOURCE_MOCK_REGISTRATION_REFUSED')
 return signal_mock(selected,handler)
m.signal.signal=partial
m.prerequisites=lambda **kwargs:(_ for _ in ()).throw(AssertionError('FORBIDDEN_PREFLIGHT'))
m.subprocess.Popen=lambda *args,**kwargs:(_ for _ in ()).throw(AssertionError('FORBIDDEN_CHILD'))
out=io.StringIO()
with contextlib.redirect_stdout(out):assert m.native_main()==74
assert mock_handlers==originals and len(calls)==4 and json.loads(out.getvalue())['models'] is None;checks+=1
# An unchanged legacy invocation has no signal-handler registration or new hook.
calls.clear();m.sys.argv=['parent','--run'];m.prerequisites=lambda:(_ for _ in ()).throw(ValueError('SOURCE_MOCK_PREFLIGHT_REFUSED'))
with contextlib.redirect_stdout(io.StringIO()):m.main()
assert calls==[] and mock_handlers==originals;checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0}))
`);
 assert.equal(p.checks,2);assert.equal(p.signals,0);
});

test('currently installed INT handler at every restore boundary cannot skip later restoration attempts',()=>{
 const p=execute(setup+String.raw`
original_dumps=m.json.dumps
for boundary in range(3):
 # This is Python's handler function invoked directly; never an OS signal.
 originals={signal.SIGTERM:('ORIGINAL',signal.SIGTERM),signal.SIGHUP:('ORIGINAL',signal.SIGHUP),signal.SIGINT:signal.default_int_handler}
 mock_handlers.clear();mock_handlers.update(originals);restores=[]
 def registration(selected,handler):
  if handler==originals[selected]:
   index=len(restores);restores.append(selected)
   if index==boundary:mock_handlers[signal.SIGINT](signal.SIGINT,None)
  old=mock_handlers[selected];mock_handlers[selected]=handler;return old
 m.signal.getsignal=lambda selected:mock_handlers[selected];m.signal.signal=registration
 m.time.monotonic=lambda:0;m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000;m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000'}
 m.prerequisites=lambda _native=False:(m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[])
 m.prepare_record_directory=lambda repo:[];m.file_current=lambda row:None
 m.subprocess.Popen=lambda *args,**kwargs:object()
 m.collect=lambda *args,**kwargs:{'scope':m.NATIVE_SCOPE,'outcome':'FAIL','reportedAssertionOutcome':'FAIL','collectionStatus':'COMPLETE_DATA_REPORT','reason_code':'NATIVE_DATA_REPORT_OBSERVED','bodyElapsedMs':0,'elapsedMs':0,'nativeSummary':data['failed'],'childReaped':True,'childExitCode':0,'cleanupSignal':'SENT','groupAbsentAfterReap':True,'models':None,'helperExecutions':None,'nativeAgentLaunches':1}
 m.save_record=lambda *args,**kwargs:('/owned/report','b'*64)
 out=io.StringIO()
 with contextlib.redirect_stdout(out):status=m.native_main()
 records=[json.loads(line) for line in out.getvalue().splitlines()];last=records[-1]
 assert restores==[signal.SIGINT,signal.SIGHUP,signal.SIGTERM] and status==74
 assert last['collectionStatus']=='UNKNOWN' and last['outcome']=='FAIL' and last['reportedAssertionOutcome']=='FAIL'
 assert last['nativeAuthenticated'] is False and last['reuseEligible'] is False
 if boundary==0:assert last['reason_code']=='CANCELLED' and mock_handlers==originals
 else:assert last['reason_code']=='CANCELLATION_HANDLER_RESTORE_UNAVAILABLE'
 checks+=1
print(original_dumps({'checks':checks,'testedPopen':0,'signals':0,'kernelMonitors':0}))
`,{failed});
 assert.equal(p.checks,3);assert.equal(p.signals,0);
});
