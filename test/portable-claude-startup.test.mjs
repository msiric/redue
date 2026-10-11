import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

test('disabled native startup controls are fail closed and never launch a process', {skip:process.platform==='win32'},()=>{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const result=spawnSync('python3',['-B','-c',String.raw`
import importlib.util,json,subprocess,types,os
from unittest.mock import patch
s=importlib.util.spec_from_file_location('startup','test/acceptance/portable-claude-startup.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
source='a'*40
env={'GITHUB_ACTIONS':'true','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_REPOSITORY':'msiric/redue','GITHUB_REF':m.REF,'GITHUB_SHA':'b'*40,'REDUE_CHECKED_SOURCE':source}
controls=0
with patch.object(subprocess,'Popen',side_effect=AssertionError('No process permitted')):
 m.require_ci(env,source);controls+=1
 for key in ('GITHUB_EVENT_NAME','GITHUB_REPOSITORY','GITHUB_REF','GITHUB_SHA','REDUE_CHECKED_SOURCE'):
  bad={**env,key:'wrong'}
  with patch.dict(os.environ,bad,clear=True):
   try:m.main(types.SimpleNamespace(source=source));raise AssertionError('Accepted wrong route')
   except m.GateError:controls+=1
 for key in (*m.FORBIDDEN_KEYS,'CLAUDE_CODE_OAUTH_TOKEN'):
  try:m.require_ci({**env,key:''},source);raise AssertionError('Accepted present override')
  except m.GateError:controls+=1
 for value in ('','not-a-source'):
  try:m.require_ci(env,value);raise AssertionError('Accepted missing pin')
  except m.GateError:controls+=1
 public=m.public_auth_status(json.dumps({'loggedIn':True,'authMethod':'oauth_token','apiProvider':'firstParty','email':'private@example.invalid','orgId':'private','subscriptionType':'PRIVATE'}))
 assert public=={'loggedIn':True,'authMethod':'oauth_token','apiProvider':'firstParty','subscription_type_present':True};controls+=1
 for value in ('{}','[]','not-json',json.dumps({'loggedIn':True,'authMethod':'api_key','apiProvider':'firstParty'}),json.dumps({'loggedIn':True,'authMethod':'claude.ai','apiProvider':'firstParty'}),json.dumps({'loggedIn':True,'authMethod':'oauth_token','apiProvider':'bedrock'})):
  try:m.public_auth_status(value);raise AssertionError('Accepted unknown auth')
  except m.GateError:controls+=1
 with patch.dict(os.environ,env,clear=True):
  report=m.main(types.SimpleNamespace(source=source))
  assert report['status']=='BLOCKED_NATIVE_STARTUP_BOUNDARY' and report['native_processes_launched']==0 and report['can_infer'] is False;controls+=1
 assert 'CLAUDE_BG_AUTH_SNAPSHOT_PATH' in m.FORBIDDEN_KEYS;controls+=1
 assert not hasattr(m,'bounded_native') and not hasattr(m,'bootstrap_settings');controls+=1
 for value in (None,b'\xff', 'x'*65537):
  try:m.public_auth_status(value);raise AssertionError('Accepted malformed payload')
  except m.GateError:controls+=1
 for error in (RuntimeError('synthetic-secret-value private@example.invalid'),m.GateError('NATIVE_AUTH_STATUS_FAILED')):
  public=m.public_failure(error)
  assert 'synthetic-secret-value' not in json.dumps(public) and 'private@example.invalid' not in json.dumps(public)
  assert public['can_infer'] is False and public['models_launched']==0;controls+=1
print(json.dumps({'controls':controls,'processes':0,'models':0}))
`],{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:8192});
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert(report.controls>=40);
  assert.equal(report.processes,0);
  assert.equal(report.models,0);
});


test('disabled workflow cannot deliver credentials or invoke the native host', async()=>{
  const workflow=await readFile(new URL('../docs/contributor/portable-claude-startup-workflow.yml',import.meta.url),'utf8');
  const active=workflow.split('\n').filter(line=>!line.trimStart().startsWith('#')).join('\n');
  assert.doesNotMatch(active,/secrets\.|id-token:|attestations:|upload-artifact|environment:|--native|auth status|curl /);
  assert.match(active,/workflow_dispatch:/);
  assert.match(active,/persist-credentials: false/);
  assert.match(active,/REVIEWED_SOURCE: 19c5db7d93ba61a616c0833d5df864c15bf5baa7/);
  assert.match(active,/python3 -B test\/acceptance\/portable-claude-startup\.py --source/);
});
