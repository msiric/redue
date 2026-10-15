// SOURCE/MOCK/HARNESS tests only. Never create real REDUE fixtures or build/run
// C/native/model code. One fixed Python subprocess evaluates mocked lifecycles.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {observeFixedEnclosurePreparation as observe} from './acceptance/sealed-typescript-enclosure-provisioning.mjs';
const parentPath=fileURLToPath(new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url));
const innerSource=fs.readFileSync(new URL('./acceptance/sealed-typescript-enclosure-provisioning.mjs',import.meta.url),'utf8'),parentSource=fs.readFileSync(parentPath,'utf8');
function mock(){let time=0;const calls=[],state={ready:true,fail:null,elapsedAt:null,nonzero:false};const flag={sealed:false,reuseEligible:false},value=outcome=>({outcome,...flag});const op={};
 const method=(name,fn)=>op[name]=(...args)=>{calls.push(name);if(state.elapsedAt===name)time=30000;if(state.fail===name)return value('UNKNOWN');return fn(...args);};
 const build=(count,outcome)=>({...value(outcome),dispatchAttemptCount:count,builds:Array.from({length:count},(_,at)=>({pidObserved:true,completed:!state.nonzero,status:state.nonzero&&at===0?1:0,signal:null,spawnError:'NONE',stdoutBytes:0,stderrBytes:0}))});
 method('preparePair',()=>({...value('BASE_EXCHANGE_PAIR_PREPARED'),baseA:'/private/tmp/redue-ci-recipient-11111111',baseB:'/private/tmp/redue-ci-recipient-22222222'}));method('createHost',()=>({...value('CI_SYNTHETIC_BOOTSTRAP_PREPARED'),base:'/private/tmp/redue-ci-recipient-33333333'}));method('prepareHostFixture',()=>value('SYNTHETIC_FIXTURE_PREPARED'));method('buildAssets',()=>build(3,'BUILT_NOT_EXECUTED'));method('verifyAssets',()=>value('BASE_EXCHANGE_ASSETS_CURRENTLY_OBSERVED'));method('preparePairedSource',()=>({...flag,disabled:true}));method('buildPaired',()=>build(2,'BUILT_NOT_EXECUTED'));method('verifyPaired',()=>value('PAIRED_STAGE_ARTIFACTS_CURRENTLY_OBSERVED_NOT_EXECUTED'));method('provisionCopies',()=>value('CAMPAIGN_COPIES_OBSERVED_NOT_EXECUTED'));method('verifyCopies',()=>value('CAMPAIGN_COPIES_CURRENTLY_OBSERVED_NOT_EXECUTED'));method('buildLauncher',()=>build(1,'CAMPAIGN_LAUNCHER_BUILT_NOT_EXECUTED'));method('verifyLauncher',()=>value('CAMPAIGN_LAUNCHER_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));method('prepareProjection',()=>value('ORIGINAL_PROTECTED_INPUT_PROJECTION_PREPARED'));method('prepareNull',()=>({...flag,disabled:true,version:'campaign-prepared-devnull-setexec@2'}));method('prepareEnclosure',()=>({...value('FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED'),version:'fixed-canary-finite-enclosure-source@2'}));method('buildEnclosure',()=>({...build(2,'BUILT_NOT_EXECUTED'),report:{profileId:'fixed-enclosure-local-sdk27@1',sourceVersion:'fixed-canary-finite-enclosure-source@2',files:Array.from({length:6},()=>({digest:'a'.repeat(64)}))}}));method('verifyEnclosure',()=>value('ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED'));
 return{calls,state,op,options:{ready:()=>state.ready,load:async()=>{calls.push('IMPORTS');return op;},now:()=>time},set:n=>{time=n;}};
}
const authority=v=>{assert.equal(v.nativeAgentLaunches,0);assert.equal(v.models,0);assert.equal(v.compilerCheckExecutions,0);assert.equal(v.sealed,false);assert.equal(v.reuseEligible,false);assert.equal(v.recordAdoptionAuthority,false);assert.equal(v.privateMints,'PROCESS_LOCAL_NOT_ADOPTABLE_FROM_REPORT');};
test('fixed same-process source pipeline counts eight C builds and six new original code rows, not six builds',async()=>{const m=mock(),v=await observe(m.options);assert.equal(v.outcome,'BUILT_NOT_EXECUTED');assert.equal(v.buildAttemptCount,8);assert.equal(v.buildResultCount,8);assert.equal(v.observedProcessCount,8);assert.equal(v.newFileDigests.length,6);assert.equal(v.phases.length,19);assert.deepEqual(m.calls,['IMPORTS','preparePair','createHost','prepareHostFixture','buildAssets','verifyAssets','preparePairedSource','buildPaired','verifyPaired','provisionCopies','verifyCopies','buildLauncher','verifyLauncher','prepareProjection','prepareNull','prepareEnclosure','buildEnclosure','verifyEnclosure','verifyEnclosure']);authority(v);});
test('missing precondition imports/creates/builds nothing',async()=>{const m=mock();m.state.ready=false;const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.deepEqual(m.calls,[]);assert.equal(v.buildAttemptCount,0);authority(v);});
for(const method of ['verifyAssets','verifyPaired','verifyCopies','verifyLauncher','prepareProjection','prepareEnclosure','verifyEnclosure'])test('unknown '+method+' stops at that prerequisite and retains all prior observations',async()=>{const m=mock();m.state.fail=method;const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.equal(m.calls.at(-1),method);assert.equal(v.phases.at(-1).outcome,'UNKNOWN');assert(v.buildResultCount<=8);authority(v);});
test('known actual nonzero mock compiler status remains separate from UNKNOWN preparation',async()=>{const m=mock();m.state.nonzero=true;const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.compilerBuildOutcome,'EXIT_NONZERO');assert.equal(v.buildResultCount,3);assert.equal(v.builds[0].status,1);assert.equal(v.failedPhase,'prerequisiteBuilds');assert.equal(m.calls.at(-1),'buildAssets');});
for(const method of ['preparePair','buildAssets','buildLauncher','buildEnclosure','verifyEnclosure'])test('the same 30s budget includes '+method+' and stops later work',async()=>{const m=mock();m.state.elapsedAt=method;const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.equal(m.calls.at(-1),method);authority(v);});
test('final validation is not exempt from body deadline',async()=>{const m=mock();let calls=0;m.op.verifyEnclosure=()=>{if(++calls===2)m.set(30000);return{outcome:'ENCLOSURE_BUILD_CURRENTLY_OBSERVED_NOT_EXECUTED',sealed:false,reuseEligible:false};};const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.failedPhase,'finalValidation');assert.equal(v.buildResultCount,8);});
test('parent pins exact inner bytes and fixed reviewed Node; no environment stripping or arbitrary command route',()=>{const sha=createHash('sha256').update(innerSource).digest('hex');assert(parentSource.includes('INNER_SHA256 = "'+sha+'"'));assert(parentSource.includes('NODE_SHA256 = "5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc"'));assert.match(parentSource,/start_new_session=True, close_fds=True/);assert.match(parentSource,/env=os\.environ\.copy\(\)/);assert.match(parentSource,/collect\(child, started=begun, exit_monitor=exit_monitor\)/);assert(!/child\.(?:poll|communicate)\(/.test(parentSource));assert(!/os\.environ\.(?:pop|clear|update)|shell=True|pexpect|pty\./.test(parentSource));assert.match(innerSource,/process\.execArgv\.length===0/);});
test('mock Python parent proves kill-before-wait, no postreap destructive kill, EOF/cap/deadline/parser and SIGKILL races',async()=>{const frames=[];const good=await observe({...mock().options,observeProgress:frame=>frames.push(frame)});const python=String.raw`
import contextlib,copy,errno,importlib.util,io,json,os,signal,sys
spec=importlib.util.spec_from_file_location('owned_enclosure_parent',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
payload=json.loads(sys.stdin.read());good=payload['good'];frames=payload['frames'];raw=b''.join((json.dumps(f,separators=(',',':'))+'\n').encode() for f in frames+[{'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':good}]);assert m.parse_inner((json.dumps(good)+'\n').encode())['outcome']=='BUILT_NOT_EXECUTED'
class Stream:
 def __init__(self,n):self.n=n
 def fileno(self):return self.n
 def close(self):pass
class Child:
 def __init__(self,code=0):self.pid=123;self.stdout=Stream(10);self.stderr=Stream(11);self.code=code;self.events=[]
 def wait(self,timeout):
  assert self.events and self.events[0]==('kill',123,signal.SIGKILL)
  self.events.append(('wait',timeout));return self.code
 def poll(self):raise AssertionError('FORBIDDEN_POLL')
 def communicate(self):raise AssertionError('FORBIDDEN_COMMUNICATE')
class Key:
 def __init__(self,stream,data):self.fileobj=stream;self.data=data
class Selector:
 def __init__(self):self.keys={}
 def register(self,stream,event,data):self.keys[stream.n]=Key(stream,data)
 def unregister(self,stream):self.keys.pop(stream.n)
 def get_map(self):return self.keys
 def select(self,timeout):return [(next(iter(self.keys.values())),1)]
 def close(self):pass
original=m.os.set_blocking;m.os.set_blocking=lambda *args:None
checks=0
try:
 def run(body=raw,stderr=b'',code=0,deadline=False,kill_denied=False,started=None,kill_error=None):
  c=Child(code);chunks={10:[body,b''],11:[stderr,b'']};t=[0]
  def read(fd,n):
   value=chunks[fd][0];part=value[:n];chunks[fd][0]=value[n:]
   if not chunks[fd][0]:chunks[fd].pop(0)
   return part
  def clock():t[0]+=31 if deadline else .01;return t[0]
  def kill(pid,sig):
   c.events.append(('kill',pid,sig))
   if kill_error is not None and sig==signal.SIGKILL:raise kill_error
   if kill_denied:raise PermissionError()
   if sig==0:raise ProcessLookupError(3,'PRIVATE')
  result=m.collect(c,clock=clock,selector_factory=Selector,read=read,killpg=kill,started=started)
  kill_at=[i for i,e in enumerate(c.events) if e[0]=='kill' and e[2]==signal.SIGKILL];wait_at=[i for i,e in enumerate(c.events) if e[0]=='wait'];assert len(kill_at)==1 and wait_at and kill_at[0]<wait_at[0]
  assert all(e[0]!='kill' or e[2]==0 for e in c.events[wait_at[0]+1:])
  return result,c
 result,c=run();assert result['outcome']=='BUILT_NOT_EXECUTED' and result['childReaped'];checks+=1
 for args in [dict(body=b'PRIVATE'),dict(body=raw+b'{}\n'),dict(body=b'x'*65537),dict(stderr=b'PRIVATE'),dict(code=-9),dict(code=74),dict(deadline=True,started=0),dict(kill_denied=True)]:
  result,c=run(**args);assert result['outcome']=='UNKNOWN';assert 'PRIVATE' not in json.dumps(result);checks+=1
 # Only bounded exception family/errno facts are retained; no message/class
 # name/path/value disclosure, and no change to UNKNOWN or signal ordering.
 class PRIVATE_EXCEPTION_NAME(Exception):pass
 for error,family,code in [(PermissionError(errno.EPERM,'PRIVATE'), 'PERMISSION_ERROR','EPERM'),(PermissionError(errno.EACCES,'PRIVATE'),'PERMISSION_ERROR','EACCES'),(TypeError('PRIVATE'),'TYPE_ERROR','NOT_PRESENT'),(OSError(999999,'PRIVATE'),'OS_ERROR','UNKNOWN'),(PRIVATE_EXCEPTION_NAME('PRIVATE'),'OTHER_EXCEPTION','NOT_PRESENT')]:
  result,c=run(kill_error=error);assert result['outcome']=='UNKNOWN' and result['cleanupExceptionFamily']==family and result['cleanupErrno']==code and 'PRIVATE' not in json.dumps(result);checks+=1
 result,c=run(kill_error=ProcessLookupError(errno.ESRCH,'PRIVATE'));assert result['cleanupSignal']=='GROUP_ALREADY_ABSENT' and result['cleanupExceptionFamily']=='PROCESS_LOOKUP_ERROR' and result['cleanupErrno']=='ESRCH' and result['outcome']=='BUILT_NOT_EXECUTED';checks+=1
 # The existing parent's elapsed body origin is not reset after preflight.
 result,c=run(deadline=True,started=0);assert result['reason_code']=='BODY_DEADLINE';checks+=1
 for edit in [lambda v:v.update(schema=True),lambda v:v.update(models=1),lambda v:v['newFileDigests'][0].update(index=1),lambda v:v['phases'][1].update(name='freshHost'),lambda v:v.update(UNREVIEWED='PRIVATE')]:
  v=copy.deepcopy(good);edit(v)
  try:m.parse_inner((json.dumps(v)+'\n').encode());raise AssertionError('ACCEPTED_MALFORMED')
  except (ValueError,TypeError,KeyError):pass
  checks+=1
 # A genuinely failed prerequisite launches no Popen at all.
 old_pre=m.prerequisites;old_popen=m.subprocess.Popen;old_argv=sys.argv
 m.prerequisites=lambda:(_ for _ in ()).throw(ValueError('FAILED_PREREQUISITE'))
 popen_calls=[]
 def forbidden_popen(*a,**k):popen_calls.append(True);raise AssertionError('CHILD_MUST_NOT_LAUNCH')
 m.subprocess.Popen=forbidden_popen
 sys.argv=['fixed-parent','--run']
 with contextlib.redirect_stdout(io.StringIO()):assert m.main()==74
 assert popen_calls==[]
 m.prerequisites=old_pre;m.subprocess.Popen=old_popen;sys.argv=old_argv;checks+=1
 # Selector failure still cleans the known owned child; never silently leaks.
 c=Child();events=[]
 def kill(pid,sig):c.events.append(('kill',pid,sig));raise ProcessLookupError(3,'PRIVATE')
 result=m.collect(c,clock=lambda:0,selector_factory=lambda:(_ for _ in ()).throw(ValueError()),read=lambda *a:b'',killpg=kill)
 assert result['outcome']=='UNKNOWN' and result['childReaped'];checks+=1
 # Invalid/missing ownership must never turn a numeric zero into a group kill.
 c=Child();c.pid=0;events=[]
 result=m.collect(c,clock=lambda:0,selector_factory=Selector,read=lambda *a:b'',killpg=lambda *a:events.append(a))
 assert result['outcome']=='UNKNOWN' and events==[];checks+=1
 # A wait timeout gets exactly the one prior cleanup attempt, no postreap kill.
 c=Child();events=[]
 def wait_timeout(timeout):events.append('wait');raise TimeoutError()
 c.wait=wait_timeout
 def cleanup(pid,sig):events.append(sig)
 chunks={10:[raw,b''],11:[b'']}
 result=m.collect(c,clock=lambda:0,selector_factory=Selector,read=lambda fd,n:chunks[fd].pop(0),killpg=cleanup)
 assert result['outcome']=='UNKNOWN' and events==[signal.SIGKILL,'wait'];checks+=1
finally:m.os.set_blocking=original
print(json.dumps({'scope':'PYTHON_PARENT_SOURCE_MOCKS_ONLY','passed':checks,'nativeExecutions':0,'compilerBuilds':0}))
`;
 const out=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify({good,frames}),encoding:'utf8',timeout:5000,maxBuffer:16384});const v=JSON.parse(out);assert.equal(v.scope,'PYTHON_PARENT_SOURCE_MOCKS_ONLY');assert.equal(v.passed,25);assert.equal(v.nativeExecutions,0);assert.equal(v.compilerBuilds,0);});

test('old enclosure source interpretation is refused before new build dispatch',async()=>{const m=mock();m.op.prepareEnclosure=()=>({outcome:'FIXED_CANARY_ENCLOSURE_SOURCES_PREPARED_NOT_PROVISIONED',version:'fixed-canary-finite-enclosure-source@1',sealed:false,reuseEligible:false});const v=await observe(m.options);assert.equal(v.outcome,'UNKNOWN');assert.equal(v.failedPhase,'enclosureSource');assert(!m.calls.includes('buildEnclosure'));});

test('parent preserves large known-failed-build byte counts and late persistence facts, with no child for denied record directory',async()=>{const fixture=mock();fixture.state.nonzero=true;const failed=await observe(fixture.options);const python=String.raw`
import contextlib,copy,importlib.util,io,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('owned_parent_observation_repairs',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
failed=json.loads(sys.stdin.read());assert failed['compilerBuildOutcome']=='EXIT_NONZERO';checks=0
for count in (8192,8193,9007199254740991):
 v=copy.deepcopy(failed);v['builds'][0]['stdoutBytes']=count;v['builds'][0]['stderrBytes']=count
 parsed=m.parse_inner((json.dumps(v)+'\n').encode());assert parsed['builds'][0]['status']==1 and parsed['builds'][0]['stderrBytes']==count;checks+=1
for count in (True,-1,float('nan'),9007199254740992,1.5):
 v=copy.deepcopy(failed);v['builds'][0]['stderrBytes']=count
 try:m.parse_inner((json.dumps(v)+'\n').encode());raise AssertionError('INVALID_BYTE_COUNT_ADMITTED')
 except (ValueError,TypeError):pass
 checks+=1
old={key:getattr(m,key) for key in ('prerequisites','prepare_record_directory','collect','save_record','file_current','_PROCESS_STARTED')};old_popen=m.subprocess.Popen;old_argv=sys.argv
try:
 calls=[];m._PROCESS_STARTED=m.time.monotonic();sys.argv=['fixed-parent','--run']
 m.prerequisites=lambda:(m.Path('/owned/repo'),m.Path('/owned/repo/fixed.mjs'),m.Path('/owned/node'),[])
 def fake_popen(*args,**kwargs):calls.append('POpen');return object()
 m.subprocess.Popen=fake_popen
 def denied_directory(repo):raise PermissionError('PRIVATE_DIRECTORY_ERROR')
 m.prepare_record_directory=denied_directory
 capture=io.StringIO()
 with contextlib.redirect_stdout(capture):assert m.main()==74
 result=json.loads(capture.getvalue());assert calls==[] and result['outcome']=='UNKNOWN' and result['reason_code']=='PRECONDITION_UNAVAILABLE';assert 'PRIVATE' not in capture.getvalue();checks+=1
 # A later filesystem failure must not discard the already-collected failed
 # compiler outcome, owned root names, exact child exit or cleanup observation.
 m.prepare_record_directory=lambda repo:[('PRIVATE_TEST_SNAPSHOT',)]
 large_failed=copy.deepcopy(failed);large_failed['builds'][0]['stderrBytes']=8193
 observed={'schema':1,'scope':m.SCOPE,'outcome':'UNKNOWN','reason_code':'INNER_PREPARATION_UNKNOWN','childReaped':True,'childExitCode':74,'childSignal':None,'cleanupSignal':'UNKNOWN','cleanupExceptionFamily':'PERMISSION_ERROR','cleanupErrno':'EPERM','groupAbsentAfterReap':True,'stdoutBytes':1234,'stderrBytes':0,'elapsedMs':1200,'innerReport':large_failed,**m._FALSE}
 m.collect=lambda child,started=None,exit_monitor=None:copy.deepcopy(observed)
 m.file_current=lambda row:None
 def denied_persistence(*args):raise PermissionError('PRIVATE_PERSISTENCE_ERROR')
 m.save_record=denied_persistence
 capture=io.StringIO()
 with contextlib.redirect_stdout(capture):assert m.main()==74
 result=json.loads(capture.getvalue());assert calls==['POpen'] and result['outcome']=='UNKNOWN' and result['recordPersistence']=='UNKNOWN' and result['savedRecord']=='NOT_ESTABLISHED' and result['finalParentCompletion']=='NOT_ESTABLISHED'
 assert 'record' not in result and 'sha256' not in result and 'PRIVATE' not in capture.getvalue() and len(capture.getvalue().encode())<=65536
 kept=result['observed'];assert kept['childReaped'] and kept['childExitCode']==74 and kept['childSignal'] is None and kept['cleanupSignal']=='UNKNOWN' and kept['cleanupExceptionFamily']=='PERMISSION_ERROR' and kept['cleanupErrno']=='EPERM' and kept['groupAbsentAfterReap']
 assert kept['innerReport']['ownedRootNames']==failed['ownedRootNames'] and kept['innerReport']['compilerBuildOutcome']=='EXIT_NONZERO' and kept['innerReport']['builds'][0]['status']==1 and kept['innerReport']['builds'][0]['stderrBytes']==8193
 assert kept['innerReport']['buildResultCount']==failed['buildResultCount'];checks+=1
finally:
 for key,value in old.items():setattr(m,key,value)
 m.subprocess.Popen=old_popen;sys.argv=old_argv
print(json.dumps({'scope':'OBSERVATION_PRESERVATION_SOURCE_MOCKS_ONLY','passed':checks,'actualPopen':0,'compilerBuilds':0,'nativeExecutions':0}))
`;
 const out=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify(failed),encoding:'utf8',timeout:5000,maxBuffer:16384});const v=JSON.parse(out);assert.equal(v.scope,'OBSERVATION_PRESERVATION_SOURCE_MOCKS_ONLY');assert.equal(v.passed,10);assert.equal(v.actualPopen,0);assert.equal(v.compilerBuilds,0);assert.equal(v.nativeExecutions,0);});

test('record namespace accepts existing owned .local0755/private0700 only and retains its original identity',()=>{const python=String.raw`
import importlib.util,json,stat,sys,types
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('record_namespace_source_mocks',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
repo=m.Path('/owned/repo');local=repo/'.local';private=local/'portable-evidence';calls=[];nodes={str(local):types.SimpleNamespace(st_dev=1,st_ino=2,st_mode=stat.S_IFDIR|0o755,st_uid=501,st_gid=20),str(private):types.SimpleNamespace(st_dev=1,st_ino=3,st_mode=stat.S_IFDIR|0o700,st_uid=501,st_gid=20)}
def mkdir(file,mode):calls.append((str(file),mode));raise FileExistsError()
m.os.mkdir=mkdir;m.os.lstat=lambda file:nodes[str(file)];m.os.getuid=lambda:501;m.os.path.realpath=lambda file:str(file);m.ancestors=lambda file:[]
snapshot=m.prepare_record_directory(repo);assert calls==[(str(local),0o700),(str(private),0o700)];m.record_directory_current(snapshot);checks=1
for target,key,value in [(str(local),'st_mode',stat.S_IFDIR|0o775),(str(private),'st_mode',stat.S_IFDIR|0o755),(str(private),'st_uid',999),(str(private),'st_mode',stat.S_IFLNK|0o700)]:
 before=getattr(nodes[target],key);setattr(nodes[target],key,value)
 try:m.prepare_record_directory(repo);raise AssertionError('UNSAFE_NAMESPACE_ADMITTED')
 except ValueError:pass
 setattr(nodes[target],key,before);checks+=1
nodes[str(private)].st_ino+=1
try:m.record_directory_current(snapshot);raise AssertionError('REPLACEMENT_ADOPTED')
except ValueError:pass
checks+=1
print(json.dumps({'scope':'RECORD_NAMESPACE_SOURCE_MOCKS_ONLY','passed':checks,'filesystemWrites':0,'actualPopen':0}))
`;
 const out=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{encoding:'utf8',timeout:5000,maxBuffer:16384});const v=JSON.parse(out);assert.equal(v.scope,'RECORD_NAMESPACE_SOURCE_MOCKS_ONLY');assert.equal(v.passed,6);assert.equal(v.filesystemWrites,0);assert.equal(v.actualPopen,0);});

test('fixed progress emits BEGIN before each synchronous operation, one-shot deltas and no private authority',async()=>{
 const m=mock(),frames=[],seen=[];m.options.observeProgress=frame=>{frames.push(frame);seen.push(frame.kind+':'+frame.name);};
 for(const [name,original]of Object.entries(m.op))m.op[name]=(...args)=>{assert.equal(frames.at(-1).kind,'BEGIN');seen.push('ACTION:'+name);return original(...args);};
 const report=await observe(m.options);assert.equal(report.outcome,'BUILT_NOT_EXECUTED');assert.equal(frames.length,38);
 assert(frames.every((v,i)=>v.sequence===i&&v.kind===(i%2?'END':'BEGIN')));
 assert.equal(frames.flatMap(v=>v.newRoots).length,3);assert.equal(frames.flatMap(v=>v.newBuilds).length,8);
 assert.equal(frames.filter(v=>v.kind==='BEGIN').every(v=>v.newRoots.length===0&&v.newBuilds.length===0),true);
 const wire=frames.map(v=>JSON.stringify(v)+'\n').join('')+JSON.stringify({schema:1,protocol:'fixed-enclosure-progress@1',kind:'FINAL',report})+'\n';
 assert(Buffer.byteLength(wire)<65536);assert.equal(38*1024+8*256+3*128+16384,57728);
 assert.match(innerSource,/writeSync\(1,body,at,body\.length-at\)/);assert(!innerSource.includes('process.stdout.write(JSON.stringify(result)'));
 assert.equal(seen[0],'BEGIN:operationImports');authority(report);
});
test('failed progress emission refuses later work and never certifies preparation',async()=>{const m=mock(),frames=[];m.options.observeProgress=frame=>{if(frame.name==='prerequisiteBuilds'&&frame.kind==='BEGIN')throw Error('PRIVATE');frames.push(frame);};const report=await observe(m.options);assert.equal(report.outcome,'UNKNOWN');assert(!m.calls.includes('buildAssets'));assert.equal(report.failedPhase,'prerequisiteBuilds');assert.equal(report.buildAttemptCount,0);assert(!JSON.stringify(report).includes('PRIVATE'));});

test('finite parent protocol preserves valid prefix through timeout, partial final and malformed suffix; completed facts are lower bounds',async()=>{
 const frames=[],good=await observe({...mock().options,observeProgress:frame=>frames.push(frame)});
 const failedMock=mock();failedMock.state.nonzero=true;const failedFrames=[],failed=await observe({...failedMock.options,observeProgress:frame=>failedFrames.push(frame)});
 const python=String.raw`
import copy,importlib.util,json,sys,signal
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('progress_only_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
payload=json.loads(sys.stdin.read());frames=payload['frames'];good=payload['good'];failed_frames=payload['failedFrames'];failed=payload['failed'];checks=0
wire=lambda values:b''.join((json.dumps(v,separators=(',',':'),allow_nan=True)+'\n').encode() for v in values)
final={'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':good}
p=m.ProgressProtocol();p.feed(wire(frames+[final]));assert p.finish()['outcome']=='BUILT_NOT_EXECUTED' and p.observation()['validatedFrameCount']==38;checks+=1
# A synchronous operation can be interrupted after BEGIN. Its possible build
# dispatches remain UNKNOWN, while the previous three returned outcomes survive.
cut=next(i for i,v in enumerate(frames) if v['kind']=='BEGIN' and v['name']=='pairedBuilds')+1
prefix=frames[:cut];p=m.ProgressProtocol();p.feed(wire(prefix));assert p.finish() is None
v=p.observation();assert v['inProgressPhase']=='pairedBuilds' and v['buildAttemptCountLowerBound']==3 and v['buildResultCountLowerBound']==3 and v['activeDispatchCount']=='UNKNOWN' and v['authority']=='NONE';checks+=1
for suffix in [b'{',b'{"schema":1,"schema":1}\n',wire([frames[cut-1]]),wire([dict(frames[cut],protocol='UNREVIEWED')]),wire([dict(frames[cut],sequence=99)]),wire([dict(frames[cut],phaseIndex=18)]),wire([dict(frames[cut],unexpected='PRIVATE')]),b'x'*65537,wire([dict(final,report={**good,'buildAttemptCount':7})])]:
 p=m.ProgressProtocol();p.feed(wire(prefix));p.feed(suffix);assert p.finish() is None and p.observation()['buildResultCountLowerBound']==3 and p.observation()['inProgressPhase']=='pairedBuilds';assert 'PRIVATE' not in json.dumps(p.observation());checks+=1
# Unknown final retains a genuine nonzero returned status without green evidence.
p=m.ProgressProtocol();p.feed(wire(failed_frames+[{'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':failed}]));v=p.finish();assert v['outcome']=='UNKNOWN' and v['compilerBuildOutcome']=='EXIT_NONZERO';assert p.observation()['compilerBuildOutcome']=='EXIT_NONZERO';checks+=1
# A duplicate FINAL and trailing partial data both withdraw whole-stream success.
for tail in (wire([final]),b'{'):
 p=m.ProgressProtocol();p.feed(wire(frames+[final])+tail);assert p.finish() is None and len(p.frames)==38;checks+=1
# Schema, order, bounds, changed old facts, unknown kinds, unsafe counts and
# per-frame size are rejected; the already valid preceding prefix is retained.
for edit in (lambda v:v.update(schema=True),lambda v:v.update(kind='OTHER'),lambda v:v.update(elapsedMs=float('nan')),lambda v:v.update(buildAttemptCount=True),lambda v:v['newBuilds'][0].update(stderrBytes=-1),lambda v:v.update(newRoots=[{'role':'H','name':'redue-ci-recipient-33333333'}])):
 at=next(i for i,v in enumerate(frames) if v['kind']=='END' and v['name']=='prerequisiteBuilds');bad=copy.deepcopy(frames[at]);edit(bad)
 p=m.ProgressProtocol();p.feed(wire(frames[:at]));p.feed(wire([bad]));assert p.finish() is None and len(p.frames)==at and p.observation()['buildResultCountLowerBound']==0;checks+=1
# collect() retains a delivered BEGIN plus earlier completed build facts after
# the actual parent clock expires; mock process methods never launch anything.
class Stream:
 def __init__(self,n):self.n=n
 def fileno(self):return self.n
 def close(self):pass
class Child:
 pid=123
 stdout=Stream(10);stderr=Stream(11)
 def wait(self,timeout):assert events[0]==signal.SIGKILL;return -9
class Key:
 def __init__(self,f,d):self.fileobj=f;self.data=d
class Selector:
 def __init__(self):self.keys={}
 def register(self,f,e,d):self.keys[f.n]=Key(f,d)
 def unregister(self,f):self.keys.pop(f.n)
 def get_map(self):return self.keys
 def select(self,t):return [(self.keys[10],1)]
 def close(self):pass
events=[];clock_values=iter((0,0,31,31,31,31,31));chunks=[wire(prefix)]
def read(fd,n):
 body=chunks[0];value=body[:n];chunks[0]=body[n:]
 if not chunks[0]:chunks.pop(0)
 return value
def kill(pid,sig):
 events.append(sig)
 if sig==0:raise ProcessLookupError(3,'PRIVATE')
old=m.os.set_blocking;m.os.set_blocking=lambda *a:None
try:
 result=m.collect(Child(),clock=lambda:0 if chunks else 31,selector_factory=Selector,read=read,killpg=kill,started=0)
 assert result['outcome']=='UNKNOWN' and result['reason_code']=='BODY_DEADLINE' and result['childSignal']==9 and result['childReaped']
 assert result['progressObservation']['inProgressPhase']=='pairedBuilds' and result['progressObservation']['buildResultCountLowerBound']==3
 assert result['innerReport'] is None and events==[signal.SIGKILL,0];checks+=1
 saved=m.unknown_with_observations(result,'PERSISTENCE_UNAVAILABLE');assert saved['observed']['progressObservation']['buildResultCountLowerBound']==3 and saved['outcome']=='UNKNOWN';checks+=1
finally:m.os.set_blocking=old
print(json.dumps({'scope':'FINITE_PROGRESS_SOURCE_MOCKS_ONLY','passed':checks,'actualPopen':0,'compilerBuilds':0,'nativeExecutions':0}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify({frames,good,failedFrames,failed}),encoding:'utf8',timeout:5000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.passed,22);assert.equal(result.actualPopen,0);assert.equal(result.compilerBuilds,0);assert.equal(result.nativeExecutions,0);
});

test('opt-in harmless one-child progress delivery before synchronous stall and owned cleanup HARNESS ONLY',{skip:process.env.REDUE_DIR220_HARMLESS_DELIVERY!=='1'},()=>{
 const python=String.raw`
import hashlib,importlib.util,json,os,pwd,re,signal,subprocess,sys,time
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('harmless_progress_delivery_only',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert sys.platform=='darwin'
assert not any(re.search(r'^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)',key,re.I) for key in os.environ)
node=m.Path(pwd.getpwuid(os.getuid()).pw_dir)/'.nvm/versions/node/v22.13.0/bin/node'
m.inspect_file(node,os.getuid(),128*1024*1024,m.NODE_SHA256)
frame={'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'BEGIN','sequence':0,'phaseIndex':0,'name':'operationImports','elapsedMs':0,'phaseElapsedMs':None,'outcome':'IN_PROGRESS','newRoots':[],'newBuilds':[],'buildAttemptCount':0,'buildResultCount':0,'observedProcessCount':0,'compilerBuildOutcome':'UNKNOWN','countsMeaning':'RETURNED_OBSERVATIONS_LOWER_BOUND','activeDispatchCount':'UNKNOWN'}
line=json.dumps(frame,separators=(',',':'))+'\n'
# Fixed one harmless child: stdout only; no filesystem access, child launches,
# native agent, checker, compiler, REDUE fixture, credentials or model.
source="const fs=require('node:fs');const b=Buffer.from("+json.dumps(line)+");let at=0;while(at<b.length)at+=fs.writeSync(1,b,at,b.length-at);Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);"
wall=time.monotonic();child=subprocess.Popen([str(node),'-e',source],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True,close_fds=True,env=os.environ.copy())
events=[]
def kill(pid,sig):
 assert pid==child.pid
 events.append('OWNED_GROUP_SIGKILL' if sig==signal.SIGKILL else 'POST_REAP_GROUP_ZERO' if sig==0 else 'INVALID')
 return os.killpg(pid,sig)
result=m.collect(child,killpg=kill,started=wall-28.5)
actual=(time.monotonic()-wall)*1000
assert result['outcome']=='UNKNOWN' and result['reason_code']=='BODY_DEADLINE' and result['innerReport'] is None
assert result['progressObservation']['inProgressPhase']=='operationImports' and result['progressObservation']['validatedFrameCount']==1
assert result['progressObservation']['activeDispatchCount']=='UNKNOWN' and result['childReaped'] and result['childSignal']==signal.SIGKILL and result['groupAbsentAfterReap']
assert events==['OWNED_GROUP_SIGKILL','POST_REAP_GROUP_ZERO'] and result['stderrBytes']==0 and actual<7500
print(json.dumps({'scope':'HARMLESS_FIXED_STDOUT_DELIVERY_HARNESS_ONLY','outcome':'HARNESS_ASSERTIONS_PASS','wallMs':actual,'syntheticParentAgeAtLaunchMs':28500,'validProgressFrames':1,'overallPreparation':'UNKNOWN','childReaped':True,'ownedGroupAbsent':True,'actualPopen':1,'childSubprocesses':0,'compilerBuilds':0,'nativeExecutions':0,'models':0,'sourceAuthority':'NONE'}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{encoding:'utf8',timeout:8000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.scope,'HARMLESS_FIXED_STDOUT_DELIVERY_HARNESS_ONLY');assert.equal(result.outcome,'HARNESS_ASSERTIONS_PASS');assert.equal(result.actualPopen,1);assert.equal(result.compilerBuilds,0);assert.equal(result.nativeExecutions,0);assert.equal(result.models,0);console.log(JSON.stringify(result));
});

test('final build outcome and progress dispatch counts derive from bound facts, including known failures and partial returns',async()=>{
 const failedMock=mock();failedMock.state.nonzero=true;const failedFrames=[],failed=await observe({...failedMock.options,observeProgress:frame=>failedFrames.push(frame)});
 const partialMock=mock();partialMock.op.buildAssets=()=>({outcome:'UNKNOWN',sealed:false,reuseEligible:false,dispatchAttemptCount:2,builds:[{pidObserved:true,completed:true,status:0,signal:null,spawnError:'NONE',stdoutBytes:0,stderrBytes:0}]});
 const partialFrames=[],partial=await observe({...partialMock.options,observeProgress:frame=>partialFrames.push(frame)});assert.equal(partial.outcome,'UNKNOWN');assert.equal(partial.buildAttemptCount,2);assert.equal(partial.buildResultCount,1);assert.equal(partial.compilerBuildOutcome,'UNKNOWN');
 const missingPid=mock(),build=missingPid.op.buildEnclosure;missingPid.op.buildEnclosure=(...args)=>{const value=build(...args);value.builds[0].pidObserved=false;return value;};const incomplete=await observe(missingPid.options);assert.equal(incomplete.outcome,'UNKNOWN');assert.equal(incomplete.buildResultCount,8);assert.equal(incomplete.compilerBuildOutcome,'UNKNOWN');
 const python=String.raw`
import copy,importlib.util,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('bound_build_facts_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
v=json.loads(sys.stdin.read());checks=0
wire=lambda values:b''.join((json.dumps(x,separators=(',',':'))+'\n').encode() for x in values)
final=lambda report:{'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':report}
failed,failed_frames=v['failed'],v['failedFrames']
# Exact prior counterexample: immutable returned nonzero cannot be summarized
# as EXIT_ZERO (or UNKNOWN), even though the overall preparation is UNKNOWN.
for outcome in ('EXIT_ZERO','UNKNOWN'):
 bad=copy.deepcopy(failed);bad['compilerBuildOutcome']=outcome
 try:m.parse_inner((json.dumps(bad)+'\n').encode());raise AssertionError('CONTRADICTORY_SUMMARY_ACCEPTED')
 except ValueError:pass
 p=m.ProgressProtocol();p.feed(wire(failed_frames+[final(bad)]));assert p.finish() is None and p.observation()['compilerBuildOutcome']=='EXIT_NONZERO' and len(p.builds)==3;checks+=1
p=m.ProgressProtocol();p.feed(wire(failed_frames+[final(failed)]));assert p.finish()['compilerBuildOutcome']=='EXIT_NONZERO';checks+=1
# Exact prior counterexample: UNKNOWN END with three process rows and zero
# dispatches must be refused, retaining the preceding valid phase BEGIN.
bad=copy.deepcopy(failed_frames[-1]);assert bad['name']=='prerequisiteBuilds' and bad['kind']=='END' and len(bad['newBuilds'])==3
bad['buildAttemptCount']=0
p=m.ProgressProtocol();p.feed(wire(failed_frames[:-1]+[bad]));assert p.finish() is None and p.observation()['inProgressPhase']=='prerequisiteBuilds' and p.observation()['buildResultCountLowerBound']==0;checks+=1
bad=copy.deepcopy(failed);bad['buildAttemptCount']=0
try:m.parse_inner((json.dumps(bad)+'\n').encode());raise AssertionError('MORE_RESULTS_THAN_DISPATCHES_ACCEPTED')
except ValueError:pass
checks+=1
# A partial operation legitimately returned one result from two dispatches;
# future/unreturned work is not fabricated. Its final outcome remains UNKNOWN.
p=m.ProgressProtocol();p.feed(wire(v['partialFrames']+[final(v['partial'])]));result=p.finish();assert result['outcome']=='UNKNOWN' and result['buildAttemptCount']==2 and result['buildResultCount']==1 and result['compilerBuildOutcome']=='UNKNOWN';checks+=1
for bad_row in ({'pidObserved':False},{'completed':False},{'status':None},{'signal':'SIGKILL'},{'spawnError':'UNKNOWN'}):
 rows=[{'pidObserved':True,'completed':True,'status':0,'signal':None,'spawnError':'NONE','stdoutBytes':0,'stderrBytes':0} for _ in range(8)]
 rows[0].update(bad_row);assert m.recorded_build_outcome(rows)=='UNKNOWN';checks+=1
rows=[{'pidObserved':True,'completed':True,'status':0,'signal':None,'spawnError':'NONE','stdoutBytes':0,'stderrBytes':0} for _ in range(8)]
assert m.recorded_build_outcome(rows)=='EXIT_ZERO';rows[0]['status']=1;assert m.recorded_build_outcome(rows)=='EXIT_NONZERO';checks+=1
# Conservative encoded field budgets, including duplicate retained observations:
# progress <=41,344; ended-phase/root/build summary <=5,888; FINAL inner <=16,384;
# bounded outer wrapper/field names/separators <=1,536 =>65,152 <65,536.
encoded=lambda value:len(json.dumps(value,separators=(',',':'),allow_nan=False).encode())
# Maximum numeric representations come from binary64 diagnostics or bounded
# safe integers; all string fields are the fixed enums/phase/root patterns.
max_build={'pidObserved':False,'completed':False,'status':255,'signal':'SIGABRT','spawnError':'UNKNOWN','stdoutBytes':9007199254740991,'stderrBytes':9007199254740991}
max_root={'role':'H','name':'redue-ci-recipient-'+'f'*8}
assert encoded(max_build)<=256 and encoded(max_root)<=128
for name in m.PHASE_NAMES:
 assert encoded({'name':name,'elapsedMs':34999.99999999999,'outcome':'COMPLETED'})<=128
p=m.ProgressProtocol();summary=p.observation()
for key in ('endedPhases','ownedRootNames','builds'):summary[key]=[]
summary.update(validatedFrameCount=38,protocolStatus='INVALID_OR_INCOMPLETE',inProgressPhase='prerequisiteCurrent',buildAttemptCountLowerBound=8,buildResultCountLowerBound=8,compilerBuildOutcome='EXIT_NONZERO')
assert encoded(summary)<=1024
outer={'schema':1,'scope':m.SCOPE,'outcome':'UNKNOWN','reason_code':'POST_COLLECTION_UNAVAILABLE','recordPersistence':'UNKNOWN','savedRecord':'NOT_ESTABLISHED','finalParentCompletion':'NOT_ESTABLISHED','observed':{'childReaped':False,'childExitCode':255,'childSignal':255,'cleanupSignal':'GROUP_ALREADY_ABSENT','cleanupExceptionFamily':'PROCESS_LOOKUP_ERROR','cleanupErrno':'EOVERFLOW','groupAbsentAfterReap':False,'stdoutBytes':65536,'stderrBytes':4096,'elapsedMs':34999.99999999999,'finalSourceCurrentness':'ENDPOINTS_OBSERVED','progressFrames':[],'progressObservation':{},'innerReport':{}},**m._FALSE}
outer['observed'].update(exitMonitorState='EXIT_NOT_OBSERVED',prewaitGroupProbe='PERMISSION_DENIED',prewaitProbeExceptionFamily='PROCESS_LOOKUP_ERROR',prewaitProbeErrno='EOVERFLOW',postreapGroupProbe='PERMISSION_DENIED',postreapProbeExceptionFamily='PROCESS_LOOKUP_ERROR',postreapProbeErrno='EOVERFLOW')
assert encoded(outer)<=1536
assert 38*1024+8*256+3*128==41344
assert 19*128+3*128+8*256+1024==5888
assert 41344+5888+16384+1536==65152<65536;checks+=1
print(json.dumps({'scope':'BOUND_PROCESS_FACTS_SOURCE_MOCKS_ONLY','passed':checks,'actualPopen':0,'compilerBuilds':0,'nativeExecutions':0}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify({failed,failedFrames,partial,partialFrames}),encoding:'utf8',timeout:5000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.passed,13);assert.equal(result.actualPopen,0);assert.equal(result.compilerBuilds,0);assert.equal(result.nativeExecutions,0);
});

test('kernel-exit lifecycle gate avoids destructive signaling only for complete known outcomes and preserves unknown closure',async()=>{
 const goodFrames=[],good=await observe({...mock().options,observeProgress:frame=>goodFrames.push(frame)}),unknownMock=mock();unknownMock.state.fail='prepareEnclosure';const unknownFrames=[],unknown=await observe({...unknownMock.options,observeProgress:frame=>unknownFrames.push(frame)});const incompleteMock=mock();incompleteMock.state.nonzero=true;const incompleteFrames=[],incompleteReport=await observe({...incompleteMock.options,observeProgress:frame=>incompleteFrames.push(frame)});const partialMock=mock();partialMock.op.buildAssets=()=>({outcome:'UNKNOWN',sealed:false,reuseEligible:false,dispatchAttemptCount:2,builds:[{pidObserved:true,completed:true,status:0,signal:null,spawnError:'NONE',stdoutBytes:0,stderrBytes:0}]});const partialFrames=[],partialReport=await observe({...partialMock.options,observeProgress:frame=>partialFrames.push(frame)});
 const python=String.raw`
import copy,errno,importlib.util,json,signal,sys,types
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('nonreaping_exit_gate_mocks',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
payload=json.loads(sys.stdin.read());checks=0
wire=lambda report,frames:b''.join((json.dumps(v,separators=(',',':'))+'\n').encode() for v in frames+[{'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':report}])
good=wire(payload['good'],payload['goodFrames']);unknown=wire(payload['unknown'],payload['unknownFrames'])
class Stream:
 def __init__(self,n):self.n=n
 def fileno(self):return self.n
 def close(self):pass
class Child:
 pid=123
 def __init__(self,code):self.stdout=Stream(10);self.stderr=Stream(11);self.code=code;self.events=[]
 def wait(self,timeout):self.events.append(('wait',timeout));return self.code
 def poll(self):raise AssertionError('FORBIDDEN_POLL')
 def communicate(self):raise AssertionError('FORBIDDEN_COMMUNICATE')
class Key:
 def __init__(self,f,d):self.fileobj=f;self.data=d
class Selector:
 def __init__(self):self.keys={}
 def register(self,f,e,d):self.keys[f.n]=Key(f,d)
 def unregister(self,f):self.keys.pop(f.n)
 def get_map(self):return self.keys
 def select(self,t):return [(next(iter(self.keys.values())),1)]
 def close(self):pass
class Monitor:
 def __init__(self,child,value=True,error=False):self.child=child;self.value=value;self.error=error
 def exited(self,timeout=0):
  assert 0<=timeout<=.1;self.child.events.append(('NOTE_EXIT',timeout))
  if self.error:raise ValueError('PRIVATE')
  return self.value
 def close(self):self.child.events.append(('monitor_close',))
def run(body=good,code=0,pre='EPERM',post='ESRCH',monitor=True,monitor_error=False):
 child=Child(code);chunks={10:[body,b''],11:[b'']};waited=[False]
 old_wait=child.wait
 def wait(timeout):waited[0]=True;return old_wait(timeout)
 child.wait=wait
 def read(fd,n):
  value=chunks[fd][0];part=value[:n];chunks[fd][0]=value[n:]
  if not chunks[fd][0]:chunks[fd].pop(0)
  return part
 def kill(pid,sig):
  assert pid==123;child.events.append(('group',sig))
  if sig==signal.SIGKILL:assert not waited[0];return
  assert sig==0
  state=post if waited[0] else pre
  if state=='EPERM':raise PermissionError(errno.EPERM,'PRIVATE')
  if state=='ESRCH':raise ProcessLookupError(errno.ESRCH,'PRIVATE')
  if state=='LOOKUP_WITHOUT_ERRNO':raise ProcessLookupError('PRIVATE')
  if state=='UNKNOWN':raise OSError(errno.EIO,'PRIVATE')
  assert state=='LIVE'
 observer=None if monitor is None else Monitor(child,monitor,monitor_error)
 result=m.collect(child,clock=lambda:0,selector_factory=Selector,read=read,killpg=kill,started=0,exit_monitor=observer)
 wait_at=next(i for i,e in enumerate(child.events) if e[0]=='wait');assert all(e[0]!='group' or e[1]==0 for e in child.events[wait_at+1:])
 assert 'PRIVATE' not in json.dumps(result)
 return result,child.events
old=m.os.set_blocking;m.os.set_blocking=lambda *a:None
try:
 for pre in ('EPERM','ESRCH'):
  result,events=run(pre=pre);assert result['outcome']=='BUILT_NOT_EXECUTED' and result['cleanupSignal']=='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED' and result['exitMonitorState']=='EXIT_OBSERVED' and result['childReaped'] and result['groupAbsentAfterReap']
  assert not any(e==('group',signal.SIGKILL) for e in events);checks+=1
 result,events=run(body=unknown,code=74);assert result['outcome']=='UNKNOWN' and result['reason_code']=='INNER_PREPARATION_UNKNOWN' and result['cleanupSignal']=='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED' and result['innerReport']['buildResultCount']==6;checks+=1
 for post in ('EPERM','LIVE','UNKNOWN','LOOKUP_WITHOUT_ERRNO'):
  result,events=run(post=post);assert result['outcome']=='UNKNOWN' and not result['groupAbsentAfterReap'] and result['cleanupSignal']=='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED';checks+=1
 result,events=run(pre='LIVE');assert result['outcome']=='BUILT_NOT_EXECUTED' and result['prewaitGroupProbe']=='LIVE_MEMBERS' and result['cleanupSignal']=='SENT';assert ('group',signal.SIGKILL) in events;checks+=1
 for options in ({'monitor':None},{'monitor':False},{'monitor_error':True},{'pre':'UNKNOWN'},{'body':good[:-1]},{'body':good[:300]},{'code':-9}):
  result,events=run(**options);assert ('group',signal.SIGKILL) in events or options.get('code')==-9
  if options.get('body') is not None or options.get('code')==-9:assert result['outcome']=='UNKNOWN'
  checks+=1
 # Full FINAL with incomplete returned process facts cannot authorize skip.
 for report,frames in ((payload['incompleteReport'],payload['incompleteFrames']),(payload['partialReport'],payload['partialFrames'])):
  body=wire(report,frames);result,events=run(body=body,code=74);assert result['innerReport'] is not None and ('group',signal.SIGKILL) in events and result['outcome']=='UNKNOWN';checks+=1
finally:m.os.set_blocking=old
# Register only the exact owned PID; no NOTE_REAP, no Popen polling/waiting.
select_names=('kqueue','kevent','KQ_FILTER_PROC','KQ_EV_ADD','KQ_EV_ENABLE','KQ_EV_CLEAR','KQ_EV_ERROR','KQ_NOTE_EXIT')
missing=object();original={key:getattr(m.select,key,missing) for key in select_names}
for key,value in {'KQ_FILTER_PROC':-5,'KQ_EV_ADD':1,'KQ_EV_ENABLE':4,'KQ_EV_CLEAR':32,'KQ_EV_ERROR':16384,'KQ_NOTE_EXIT':2147483648}.items():
 if not hasattr(m.select,key):setattr(m.select,key,value)
if not hasattr(m.select,'kevent'):m.select.kevent=lambda ident,**kwargs:types.SimpleNamespace(ident=ident,**kwargs)
queues=[]
class Queue:
 def __init__(self,initial=None,error=False):self.initial=initial or [];self.error=error;self.closed=False;self.calls=[]
 def control(self,changes,maximum,timeout):
  self.calls.append((changes,maximum,timeout));assert maximum==1 and 0<=timeout<=.1
  if self.error:raise ProcessLookupError(errno.ESRCH,'PRIVATE')
  if changes:
   assert len(changes)==1 and changes[0].ident==123 and changes[0].filter==m.select.KQ_FILTER_PROC and changes[0].fflags==m.select.KQ_NOTE_EXIT
   assert changes[0].flags==m.select.KQ_EV_ADD|m.select.KQ_EV_ENABLE|m.select.KQ_EV_CLEAR
   return self.initial
  return [types.SimpleNamespace(ident=123,filter=m.select.KQ_FILTER_PROC,flags=0,fflags=m.select.KQ_NOTE_EXIT)]
 def close(self):self.closed=True
try:
 queue=Queue();m.select.kqueue=lambda:queue;monitor=m.OwnedChildExitMonitor(123);assert monitor.exited(timeout=.1);monitor.close();assert queue.closed;checks+=1
 for queue in (Queue(error=True),Queue(initial=[types.SimpleNamespace(ident=124,filter=m.select.KQ_FILTER_PROC,flags=0,fflags=m.select.KQ_NOTE_EXIT)]),Queue(initial=[types.SimpleNamespace(ident=123,filter=m.select.KQ_FILTER_PROC,flags=m.select.KQ_EV_ERROR,fflags=m.select.KQ_NOTE_EXIT)])):
  m.select.kqueue=lambda:queue;assert m.open_owned_exit_monitor(types.SimpleNamespace(pid=123)) is None and queue.closed;checks+=1
finally:
 for key,value in original.items():
  if value is missing:delattr(m.select,key)
  else:setattr(m.select,key,value)
print(json.dumps({'scope':'NONREAPING_CHILD_EXIT_SOURCE_MOCKS_ONLY','passed':checks,'actualPopen':0,'actualSignals':0,'compilerBuilds':0,'nativeExecutions':0}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify({good,goodFrames,unknown,unknownFrames,incompleteReport,incompleteFrames,partialReport,partialFrames}),encoding:'utf8',timeout:5000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.passed,21);assert.equal(result.actualPopen,0);assert.equal(result.actualSignals,0);assert.equal(result.nativeExecutions,0);
});

test('opt-in harmless owned normal child exit is observed without reaping before cleanup decision HARNESS ONLY',{skip:process.env.REDUE_DIR230_HARMLESS_NORMAL_EXIT!=='1'},async()=>{
 const fixture=mock();fixture.state.fail='prepareEnclosure';const frames=[],report=await observe({...fixture.options,observeProgress:frame=>frames.push(frame)});const wire=frames.map(frame=>JSON.stringify(frame)+'\n').join('')+JSON.stringify({schema:1,protocol:'fixed-enclosure-progress@1',kind:'FINAL',report})+'\n';
 const python=String.raw`
import importlib.util,json,os,pwd,re,subprocess,sys,time
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('harmless_normal_exit_only',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert sys.platform=='darwin'
assert not any(re.search(r'^(?:NODE_OPTIONS|NODE_PATH|NODE_REPL_EXTERNAL_MODULE|BASH_ENV|ENV)$|^(?:DYLD_|LD_|OPENSSL_)',key,re.I) for key in os.environ)
node=m.Path(pwd.getpwuid(os.getuid()).pw_dir)/'.nvm/versions/node/v22.13.0/bin/node';m.inspect_file(node,os.getuid(),128*1024*1024,m.NODE_SHA256)
line=sys.stdin.read();assert len(line.encode())<65536
# One fixed harmless child publishes only synthetic mock facts and exits74.
# This is delivery/lifecycle evidence, not compiler execution or authority.
source="const fs=require('node:fs');const b=Buffer.from("+json.dumps(line)+");let at=0;while(at<b.length)at+=fs.writeSync(1,b,at,b.length-at);process.exit(74);"
wall=time.monotonic();child=subprocess.Popen([str(node),'-e',source],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True,close_fds=True,env=os.environ.copy())
monitor=m.open_owned_exit_monitor(child)
result=m.collect(child,started=wall,exit_monitor=monitor)
assert result['outcome']=='UNKNOWN' and result['reason_code']=='INNER_PREPARATION_UNKNOWN' and result['innerReport']['buildResultCount']==6
assert result['exitMonitorState']=='EXIT_OBSERVED' and result['cleanupSignal']=='NOT_ATTEMPTED_CHILD_EXIT_OBSERVED' and result['childExitCode']==74 and result['childSignal'] is None
assert result['childReaped'] and result['groupAbsentAfterReap'] and result['postreapProbeErrno']=='ESRCH'
print(json.dumps({'scope':'HARMLESS_OWNED_NORMAL_EXIT_HARNESS_ONLY','outcome':'HARNESS_ASSERTIONS_PASS','wallMs':(time.monotonic()-wall)*1000,'overallPreparation':'UNKNOWN','cleanupSignal':result['cleanupSignal'],'exitMonitorState':result['exitMonitorState'],'prewaitGroupProbe':result['prewaitGroupProbe'],'postreapGroupProbe':result['postreapGroupProbe'],'childExitCode':74,'childReaped':True,'ownedGroupAbsent':True,'actualPopen':1,'childSubprocesses':0,'compilerBuilds':0,'nativeExecutions':0,'models':0,'sourceAuthority':'NONE'}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:wire,encoding:'utf8',timeout:8000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.scope,'HARMLESS_OWNED_NORMAL_EXIT_HARNESS_ONLY');assert.equal(result.outcome,'HARNESS_ASSERTIONS_PASS');assert.equal(result.actualPopen,1);assert.equal(result.compilerBuilds,0);assert.equal(result.nativeExecutions,0);assert.equal(result.models,0);console.log(JSON.stringify(result));
});

test('enclosure factory refusal bridge records only immutable own static data at its phase, never messages/getters or raw errors',async()=>{
 const stages=['OPTIONS','ORIGINAL_DERIVATION','PREPARED_NULL_CURRENT','INITIAL_ORIGINAL_CURRENT','PROJECTION_INTERPRETATION','CAMPAIGN_RENDER','DERIVED_BINDINGS','COLLECTOR_FUNCTION_PIN','C_TEMPLATE_READ','COLLECTOR_TEMPLATE_READ','LAUNCHER_REBIND','ENCLOSURE_REBIND','FINAL_ORIGINAL_CURRENT','SOURCE_RESULT'];
 const error=stage=>{const e=new Error('PRIVATE');Object.defineProperty(e,'refusalStage',{value:stage,enumerable:true,writable:false,configurable:false});Object.defineProperty(e,'message',{get(){throw Error('MESSAGE_MUST_NOT_BE_READ');}});return e;};
 const results=[];
 for(const stage of stages){const m=mock(),frames=[];m.op.prepareEnclosure=()=>{throw error(stage);};const report=await observe({...m.options,observeProgress:frame=>frames.push(frame)});assert.equal(report.outcome,'UNKNOWN');assert.equal(report.failedPhase,'enclosureSource');assert.equal(report.enclosureSourceRefusal,stage);assert.equal(report.buildResultCount,6);assert(!JSON.stringify(report).includes('PRIVATE'));assert(frames.every(frame=>!Object.hasOwn(frame,'enclosureSourceRefusal')));results.push({report,frames});}
 for(const make of [()=>error('PRIVATE'),()=>({refusalStage:'OPTIONS'}),()=>Object.create(error('OPTIONS')),()=>{const e=new Error('PRIVATE');Object.defineProperty(e,'refusalStage',{get(){throw Error('GETTER_MUST_NOT_RUN');}});return e;},()=>new Proxy(error('OPTIONS'),{getOwnPropertyDescriptor(){throw Error('PROXY_TRAP_MUST_NOT_RUN');}}),()=>Object.assign(new Error('PRIVATE'),{refusalStage:'OPTIONS'})]){const m=mock();m.op.prepareEnclosure=()=>{throw make();};const report=await observe(m.options);assert.equal(report.outcome,'UNKNOWN');assert.equal(report.enclosureSourceRefusal,null);assert(!JSON.stringify(report).includes('PRIVATE'));}
 const other=mock();other.op.prepareProjection=()=>{throw error('OPTIONS');};assert.equal((await observe(other.options)).enclosureSourceRefusal,null);assert.equal((await observe(mock().options)).enclosureSourceRefusal,null);
 const python=String.raw`
import copy,importlib.util,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('static_refusal_bridge_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
v=json.loads(sys.stdin.read());assert tuple(row['report']['enclosureSourceRefusal'] for row in v)==m.ENCLOSURE_REFUSAL_STAGES;checks=0
for row in v:
 p=m.ProgressProtocol();frames=row['frames']+[{'schema':1,'protocol':'fixed-enclosure-progress@1','kind':'FINAL','report':row['report']}]
 p.feed(b''.join((json.dumps(frame,separators=(',',':'))+'\n').encode() for frame in frames));assert p.finish()['enclosureSourceRefusal']==row['report']['enclosureSourceRefusal'];checks+=1
for edit in (lambda x:x.update(enclosureSourceRefusal='PRIVATE'),lambda x:x.update(enclosureSourceRefusal={}),lambda x:x.pop('enclosureSourceRefusal'),lambda x:x.update(failedPhase='pairedSource'),lambda x:x.update(outcome='BUILT_NOT_EXECUTED'),lambda x:x['phases'][-1].update(outcome='COMPLETED')):
 x=copy.deepcopy(v[0]['report']);edit(x)
 try:m.parse_inner((json.dumps(x)+'\n').encode());raise AssertionError('BAD_STATIC_REFUSAL_ACCEPTED')
 except (ValueError,KeyError,TypeError):pass
 checks+=1
print(json.dumps({'scope':'STATIC_REFUSAL_BRIDGE_SOURCE_MOCKS_ONLY','passed':checks,'actualPopen':0,'compilerBuilds':0,'nativeExecutions':0}))
`;
 const output=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify(results),encoding:'utf8',timeout:5000,maxBuffer:16384});const result=JSON.parse(output);assert.equal(result.passed,20);assert.equal(result.actualPopen,0);assert.equal(result.compilerBuilds,0);assert.equal(result.nativeExecutions,0);
});
