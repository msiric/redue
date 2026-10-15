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
test('parent pins exact inner bytes and fixed reviewed Node; no environment stripping or arbitrary command route',()=>{const sha=createHash('sha256').update(innerSource).digest('hex');assert(parentSource.includes('INNER_SHA256 = "'+sha+'"'));assert(parentSource.includes('NODE_SHA256 = "5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc"'));assert.match(parentSource,/start_new_session=True, close_fds=True/);assert.match(parentSource,/env=os\.environ\.copy\(\)/);assert.match(parentSource,/collect\(child, started=begun\)/);assert(!/child\.(?:poll|communicate)\(/.test(parentSource));assert(!/os\.environ\.(?:pop|clear|update)|shell=True|pexpect|pty\./.test(parentSource));assert.match(innerSource,/process\.execArgv\.length===0/);});
test('mock Python parent proves kill-before-wait, no postreap destructive kill, EOF/cap/deadline/parser and SIGKILL races',async()=>{const good=await observe(mock().options);const python=String.raw`
import contextlib,copy,errno,importlib.util,io,json,os,signal,sys
spec=importlib.util.spec_from_file_location('owned_enclosure_parent',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
good=json.loads(sys.stdin.read());raw=(json.dumps(good)+'\n').encode();assert m.parse_inner(raw)['outcome']=='BUILT_NOT_EXECUTED'
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
  def read(fd,n):return chunks[fd].pop(0)
  def clock():t[0]+=31 if deadline else .01;return t[0]
  def kill(pid,sig):
   c.events.append(('kill',pid,sig))
   if kill_error is not None and sig==signal.SIGKILL:raise kill_error
   if kill_denied:raise PermissionError()
   if sig==0:raise ProcessLookupError()
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
 def kill(pid,sig):c.events.append(('kill',pid,sig));raise ProcessLookupError()
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
 const out=execFileSync('/usr/bin/python3',['-I','-S','-c',python,parentPath],{input:JSON.stringify(good),encoding:'utf8',timeout:5000,maxBuffer:16384});const v=JSON.parse(out);assert.equal(v.scope,'PYTHON_PARENT_SOURCE_MOCKS_ONLY');assert.equal(v.passed,25);assert.equal(v.nativeExecutions,0);assert.equal(v.compilerBuilds,0);});

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
 m.collect=lambda child,started=None:copy.deepcopy(observed)
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
