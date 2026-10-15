// SOURCE/MOCK only: no real context, native/helper/build/SDK/model/auth/CI.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {interpretNativeEnclosureTrace} from './acceptance/sealed-typescript-native-enclosure-trace.mjs';
import {REVIEWED_CLAUDE_NATIVE} from './acceptance/portable-claude-native-profile.mjs';
const parentURL=new URL('./acceptance/sealed-typescript-enclosure-provisioning-parent.py',import.meta.url),child=fs.readFileSync(new URL('./acceptance/sealed-typescript-native-enclosure-child.mjs',import.meta.url),'utf8');
const summary=Function('createHash',child.slice(child.indexOf('const reasons='),child.indexOf('// Fixed FD1'))+';return summary;')(createHash);
const parentTest=fs.readFileSync(new URL('./sealed-typescript-native-enclosure-parent.test.mjs',import.meta.url),'utf8');
const controller=Function(parentTest.slice(parentTest.indexOf('function controller('),parentTest.indexOf('const good='))+';return controller;')();
const existing=fs.readFileSync(new URL('./sealed-typescript-fixed-campaign.test.mjs',import.meta.url),'utf8');
const reports=Function(existing.slice(existing.indexOf('const row='),existing.indexOf('const reports='))+';return [base,exchange,node,mapper];')();
const roles=['whole_base','stage_exchange','node_stage','mapper'],exits=[74,74,1,74];
const binding={hostBase:'/private/tmp/redue-ci-recipient-12345678',baseA:'/private/tmp/redue-ci-recipient-abcdef01',sourceVersion:'fixed-canary-finite-enclosure-source@2',projectionVersion:'fixed-canary-original-input-projection@3',projectionSha256:'a'.repeat(64),binarySha256:'b'.repeat(64),nativeSha256:REVIEWED_CLAUDE_NATIVE.sha256,nativeVersion:REVIEWED_CLAUDE_NATIVE.version,transportInterpretation:'finite-enclosure-normal-collection@2'};
binding.command=`exec '${binding.hostBase}/prefix/native-probes/paired-stage-enclosure'`;binding.cwd=binding.baseA+'/Checkout 空间/.sealed-native-canaries';
const completion={sourceCurrent:true,enclosureCurrent:true,reviewedBuildMatches:true,nativeCurrent:true,startupPreconditions:true,noHooksCurrent:true,postNativeEndpointCurrent:true,sourceVersion:binding.sourceVersion,projectionVersion:binding.projectionVersion,projectionSha256:binding.projectionSha256,binarySha256:binding.binarySha256,nativeSha256:binding.nativeSha256,transportInterpretation:binding.transportInterpretation,nativeExit:0,nativeSignal:null,timedOut:false,reaped:true,nativeSpawnObserved:true,nativeCloseObserved:true,nativeMilliseconds:1234.5};
function observation(failed=false,lateMalformed=false){
 const selected=failed?0:3,phases=roles.slice(0,selected+1).map((role,at)=>{const checks=reports[at]().checks;if(failed){checks[3].result='FAIL';checks[3].reason_code='ACCESS_SUCCEEDED';}return {role,spawnObserved:true,closeObserved:true,exitObserved:true,exitCode:exits[at],signal:null,outcome:failed?'FAIL':'UNKNOWN',implementedAssertionsOutcome:failed?'FAIL':'ALL_IMPLEMENTED_ROWS_OBSERVED',checks,stdoutBytes:100,stderrBytes:0};});
 const body={schema:1,scope:'ENCLOSED_FIXED_CANARY_DIAGNOSTICS_ONLY',outcome:failed?'FAIL':'UNKNOWN',reason_code:failed?'REPORTED_ASSERTION_FAILED':'FIXED_CANARY_COLLECTED_NOT_NATIVE_AUTHENTICATED',begin:true,end:true,launchedCount:phases.length,closedCount:phases.length,allLaunchedDirectActorsReaped:true,phases,timedOut:false,elapsedMs:2.125,ownedGroupCleanupRequired:false,fixedNoProcessCreationPremise:'REQUIRES_EXACT_REVIEWED_ACTOR_AND_NODE_IMPLEMENTATIONS',nativeEnforcement:'NOT_ESTABLISHED',sealed:false,reuseEligible:false};
 const session='12345678-1234-4234-8234-123456789abc',id='toolu_01234567',stdout=JSON.stringify(body)+'\n';
 const events=[{type:'system',subtype:'init',claude_code_version:binding.nativeVersion,cwd:binding.cwd,apiKeySource:'none',permissionMode:'dontAsk',tools:['Bash'],mcp_servers:[],plugins:[],session_id:session},
  {type:'assistant',session_id:session,parent_tool_use_id:null,message:{role:'assistant',id:'msg_1',content:[{type:'tool_use',name:'Bash',id,input:{command:binding.command,timeout:15000}}]}},
  {type:'user',session_id:session,parent_tool_use_id:null,uuid:'34567890-1234-4234-8234-123456789abc',timestamp:'2026-10-15T00:00:00.000Z',message:{role:'user',content:[{type:'tool_result',tool_use_id:id,content:stdout.trimEnd(),is_error:false}]},tool_use_result:{stdout,stderr:'',interrupted:false,isImage:false,noOutputExpected:false}},
  {type:'result',session_id:session,subtype:'success',is_error:false,num_turns:2}];
 return interpretNativeEnclosureTrace(Buffer.from(events.map(e=>JSON.stringify(e)).join('\n')+'\n'+(lateMalformed?'{}\n':'')),binding,completion);
}
function ciSummary(failed=false,late=false){const r=controller({failed});r.scope='FIXED_CI_NATIVE_ENCLOSURE_DIAGNOSTIC_ONLY';r.observation=observation(failed,late);return summary(r,true);}
const good=ciSummary(),fail=ciSummary(true),late=ciSummary(true,true),empty=summary(null,true),posix={skip:process.platform==='win32'?'POSIX Python source/mock only; not native Windows acceptance':false};
const execute=code=>JSON.parse(execFileSync('/usr/bin/python3',['-I','-S','-c',code,fileURLToPath(parentURL)],{input:JSON.stringify({good,fail,late,empty}),encoding:'utf8',timeout:5000,maxBuffer:32768}));
const setup=String.raw`import copy,errno,hashlib,importlib.util,json,math,sys
spec=importlib.util.spec_from_file_location('ci_native_source_mock',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=json.loads(sys.stdin.read());checks=0
`;
test('CI closed checker projection retains actual parser-established assertions, exits/signals and matched tool execution without raw data',()=>{
 for(const v of [good,fail,late,empty]){assert(Buffer.byteLength(JSON.stringify(v)+'\n')<=4096);assert.equal(v.scope,'FIXED_CI_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY');assert.equal(v.bodyRetained,false);assert.equal(v.nativeAuthenticated,false);assert.equal(v.reuseEligible,false);assert(!JSON.stringify(v).includes('/private/'));}
 assert.equal(good.toolExecutionMatched,true);assert.equal(good.checkerPhases.length,4);assert.deepEqual(good.checkerPhases.map(p=>p.process),exits.map(exit=>[true,true,true,exit,null]));assert.equal(good.checkerPhases[2].checks.length,18);assert.equal(good.completionDataValid,true);
 assert.equal(fail.outcome,'FAIL');assert.equal(late.outcome,'FAIL');assert.equal(late.traceSyntaxValid,false);assert.equal(late.completionDataValid,false);assert.deepEqual(late.checkerPhases,fail.checkerPhases);
 assert.equal(empty.checkerPhases,null);assert.equal(empty.nativeSpawnAttempts,null);assert.equal(empty.toolExecutionMatched,false);
 const local=summary(controller());assert.equal(local.scope,'FIXED_NATIVE_ENCLOSURE_CHILD_SUMMARY_ONLY');assert.equal(Object.hasOwn(local,'checkerPhases'),false);
});
test('CI parent strictly selects the CI summary and retains matched FAIL through later failure',posix,()=>{
 const r=execute(setup+String.raw`
for name in ('good','fail','late','empty'):
 raw=(json.dumps(data[name],separators=(',',':'))+'\n').encode();assert m.parse_native_final(raw,_ci=True)==data[name];checks+=1
 try:m.parse_native_final(raw);raise AssertionError('CI_AS_LOCAL')
 except ValueError:checks+=1
for reason in ('PERSISTENCE_UNAVAILABLE','CANCELLED','CLOCK_UNAVAILABLE'):
 v=m.native_unknown({'nativeSummary':data['late']},reason,_ci=True);assert v['outcome']=='FAIL' and v['nativeSummary']['toolExecutionMatched'] is True;checks+=1
for patch in ({'checkerLaunchedCount':3},{'toolExecutionMatched':False},{'toolUseIdSha256':None},{'checkerInterpretation':'OTHER'},{'checkerEnd':None},{'checkerPhases':None}):
 v={**data['good'],**patch}
 try:m.parse_native_final((json.dumps(v)+'\n').encode(),_ci=True);raise AssertionError('BAD_CI_PROJECTION')
 except ValueError:checks+=1
for patch in ({'checks':[[0,'PASS',True]]},{'process':[True,True,True,0,'SIGKILL']},{'role':'mapper'},{'assertionOutcome':'PASS'}):
 v=copy.deepcopy(data['good']);v['checkerPhases'][0].update(patch)
 try:m.parse_native_final((json.dumps(v)+'\n').encode(),_ci=True);raise AssertionError('BAD_PHASE')
 except ValueError:checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(r.checks,21);assert.equal(r.testedPopen,0);
});

const lifecycleText=parentTest.slice(parentTest.indexOf('const lifecycle=String.raw`'),parentTest.indexOf("test('native mode reuses"));
const lifecycle=Function(lifecycleText+';return lifecycle;')().replace('_native_deadline=120)','_native_deadline=120,_native_ci=True)');
test('CI native collection uses original120s lifecycle, strict fixed summary, sticky FAIL and unknown counts',posix,()=>{
 const r=execute(setup+'\nimport os,signal\n'+lifecycle+String.raw`
for value in (data['good'],data['fail'],data['empty']):
 report,child=run(value,monitor=True);assert report['scope']==m.CI_NATIVE_SCOPE and report['groupClosureScope']=='OWNED_NODE_GROUP_ONLY' and report['detachedDescendantClosure']=='UNKNOWN';checks+=1
report,child=run(None);assert report['collectionStatus']=='UNKNOWN' and report['models'] is None and report['nativeAgentLaunches'] is None;checks+=1
report,child=run(data['good'],initial=115);assert report['reason_code']=='BODY_DEADLINE' and report['nativeSummary'] is None;checks+=1
report,child=run(data['fail'],clock_failure=True);assert report['collectionStatus']=='UNKNOWN' and report['outcome']=='FAIL' and report['reason_code']=='CLOCK_UNAVAILABLE';checks+=1
for kwargs in ({'_ci':True,'_native_deadline':120,'_native_ci':True},{'_native_ci':True}):
 try:m.collect(Child(),clock=lambda:0,started=0,**kwargs);raise AssertionError('WRONG_PRIVATE_MODE')
 except ValueError:checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'realSignals':0,'kernelMonitors':0}))
`);assert.equal(r.checks,8);assert.equal(r.realSignals,0);
});
test('CI native parent canonical PATH Node and forbidden selectors are checked before launch',posix,()=>{
 const r=execute(setup+String.raw`
m.os.getuid=m.os.geteuid=lambda:501;m.os.getgid=m.os.getegid=lambda:20;m.sys.platform='darwin';m.platform.machine=lambda:'arm64';m.Path.is_file=lambda self:True
realresolve=m.Path.resolve;m.Path.resolve=lambda self,*a,**k:m.Path('/reviewed/node') if str(self)=='/host/selected-node' else realresolve(self,*a,**k)
seen=[];selected=[]
def which(name,path):selected.append((name,path));return '/host/selected-node'
m.shutil.which=which
m.inspect_file=lambda file,owner,limit,expected=None:seen.append(str(file)) or {'file':str(file),'mark':[0]*6+[121593488]}
m.file_current=lambda row:None
for key in ('SIMPLE','simple','REDUE_DECISION_PROFILE','redue_profile_context','NODE_OPTIONS','NODE_REPL_EXTERNAL_MODULE','DYLD_TEST','OPENSSL_CONF'):
 m.os.environ={'PATH':'/host/bin',key:''};seen.clear();selected.clear()
 try:m.prerequisites(_native=True,_native_ci=True);raise AssertionError('FORBIDDEN_KEY')
 except ValueError:checks+=1
 assert seen==[] and selected==[]
m.os.environ={'PATH':'/host/bin'};repo,entry,node,rows=m.prerequisites(_native=True,_native_ci=True);assert str(node)=='/reviewed/node' and entry.name==m.NATIVE_ENTRY_NAME and len(rows)==42;assert selected==[('node','/host/bin')];checks+=1
for candidate in (None,'relative/node'):
 m.shutil.which=lambda *a,**k:candidate
 try:m.prerequisites(_native=True,_native_ci=True);raise AssertionError('INVALID_PATH_NODE')
 except ValueError:checks+=1
for kwargs in ({'_native_ci':True},{'_native':True,'_ci':True,'_native_ci':True}):
 try:m.prerequisites(**kwargs);raise AssertionError('BAD_SELECTOR')
 except ValueError:checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'kernelMonitors':0}))
`);assert.equal(r.checks,13);assert.equal(r.testedPopen,0);
});
test('CI native main keeps fixed argv/original elapsed budget and latches cancellation through emission/restore',posix,()=>{
 const r=execute(setup+String.raw`
import contextlib,io,signal
m._PROCESS_STARTED=0;m._PROCESS_STARTED_WALL_MS=1700000000000
m.open_owned_exit_monitor=lambda child:None
if hasattr(m.select,'kqueue'):m.select.kqueue=lambda:(_ for _ in ()).throw(AssertionError('REAL_MONITOR'))
for case in ('normal','before','popen','collection','persistence','emission','restoration','late'):
 state={'clock':0,'popen':0,'collections':0};handlers={sig:('ORIGINAL',sig) for sig in (signal.SIGTERM,signal.SIGHUP,signal.SIGINT)}
 m.signal.getsignal=lambda sig:handlers[sig]
 def registration(sig,handler):
  old=handlers[sig]
  if case=='restoration' and isinstance(handler,tuple):
   current=handlers[signal.SIGINT]
   if callable(current):current(signal.SIGINT,None)
  handlers[sig]=handler;return old
 m.signal.signal=registration;m.time.monotonic=lambda:state['clock'];m.os.environ={'REDUE_DIAGNOSTIC_JOB_STARTED_MS':'1700000000000','HTTPS_PROXY':'MOCK_UNCHANGED'}
 def cancel():handlers[signal.SIGTERM](signal.SIGTERM,None)
 def prerequisites(**kwargs):
  assert kwargs=={'_native':True,'_native_ci':True}
  if case=='before':cancel()
  return m.Path('/owned'),m.Path('/fixed/entry'),m.Path('/fixed/node'),[]
 m.prerequisites=prerequisites;m.prepare_record_directory=lambda repo:[];m.file_current=lambda row:None
 def popen(argv,**kwargs):
  state['popen']+=1;assert argv==['/fixed/node','/fixed/entry','--fixed-ci-native-child'];assert kwargs['env']==m.os.environ and kwargs['start_new_session'] is True
  if case=='popen':cancel()
  return object()
 m.subprocess.Popen=popen
 def collect(*args,**kwargs):
  state['collections']+=1;assert kwargs['_native_deadline']==120 and kwargs['_native_ci'] is True and kwargs['started']==0
  if case=='collection':cancel()
  state['clock']=10
  return {'scope':m.CI_NATIVE_SCOPE,'outcome':'FAIL','reportedAssertionOutcome':'FAIL','collectionStatus':'COMPLETE_DATA_REPORT','reason_code':'NATIVE_DATA_REPORT_OBSERVED','bodyElapsedMs':9000,'elapsedMs':10000,'nativeSummary':data['fail'],'models':None,'helperExecutions':None,'nativeAgentLaunches':1}
 m.collect=collect
 def save(*args,**kwargs):
  assert kwargs=={'_native':True}
  if case=='persistence':cancel()
  if case=='late':state['clock']=14
  return '/owned/report','a'*64
 m.save_record=save;emitted=[]
 realemit=m.emit_final
 def emit(value,**kwargs):
  emitted.append(value)
  if case=='emission' and kwargs:cancel()
  if kwargs:assert kwargs['deadline']==14 and kwargs['_native_cancellation'] is not None
  if kwargs and kwargs['_native_cancellation'].requested:raise ValueError('MOCK_LATCH')
 m.emit_final=emit
 status=m.native_main(_ci=True)
 if case=='normal':assert status==1 and emitted[-1]['nativeSummary']['toolExecutionMatched'] is True and emitted[-1]['record']=='report'
 else:assert status==74 and emitted[-1]['outcome']==('UNKNOWN' if case=='before' else 'FAIL') and emitted[-1]['collectionStatus']=='UNKNOWN'
 assert state['popen']==(0 if case=='before' else 1) and state['collections']==state['popen']
 assert all(isinstance(v,tuple) for v in handlers.values());checks+=1
print(json.dumps({'checks':checks,'testedPopen':0,'realSignals':0,'kernelMonitors':0}))
`);assert.equal(r.checks,8);assert.equal(r.realSignals,0);
});

test('CI4KiB summary bound covers longest fixed primitive fields and complete36-check projection',()=>{
 const v=structuredClone(good);v.reason='POST_NATIVE_ENDPOINT_OR_STARTUP_UNAVAILABLE';v.nativeSignal='SIGVTALRM';v.milliseconds=119999.99999999999;v.checkerEnd=false;
 for(const phase of v.checkerPhases){phase.process=[false,false,false,255,'SIGVTALRM'];phase.implementedAssertionsOutcome='ALL_IMPLEMENTED_ROWS_OBSERVED';for(const row of phase.checks){row[1]=phase.role==='mapper'?'FRESH_SINGLE_LINK_MARKER_FILES_OBSERVED':'NOT_IMPLEMENTED';row[2]=phase.role==='mapper'?'ENOTDIR':false;}}
 assert(Buffer.byteLength(JSON.stringify(v)+'\n')<=4096);
});
