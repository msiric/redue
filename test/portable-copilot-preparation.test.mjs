import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inspectCopilot,copilotProposal,COPILOT_SECRET_NAMES} from './acceptance/portable-copilot-preparation.mjs';
const unix={skip:typeof process.getuid!=='function'};
function fixture(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-copilot-')));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const input={};
  for(const key of ['workspace','state','prefix','nodeDirectory','home','cache','logDirectory']){
    input[key]=path.join(base,key+' Ω');fs.mkdirSync(input[key],{mode:0o700});}
  const executable=path.join(base,'copilot');fs.writeFileSync(executable,'reviewed native bytes',{mode:0o700});
  const expectedSha256=createHash('sha256').update(fs.readFileSync(executable)).digest('hex');
  return {...input,executable,expectedSha256};}
test('bounded proposal excludes credential/remote/MCP/delegation tools and never writes or launches',unix,t=>{
  const f=fixture(t),before=fs.readdirSync(f.home),p=copilotProposal(f);
  assert.equal(p.ready_for_inference,false);assert.equal(p.model_launched,false);
  assert.equal(p.settings.sandbox.allowBypass,false);assert.equal(p.settings.sandbox.allowDevToolAccess,false);
  assert.equal(p.settings.sandbox.userPolicy.network.allowOutbound,false);
  assert.equal(p.settings.storeTokenPlaintext,false);
  assert.deepEqual(p.settings.sandbox.userPolicy.filesystem.deniedPaths,[f.home,f.cache,f.logDirectory]);
  assert(p.argv.includes('--secret-env-vars='+COPILOT_SECRET_NAMES.join(',')));
  assert(!p.argv.some(a=>/--allow-all|--fleet|--no-custom-instructions|--resume|--continue/.test(a)));
  assert(!p.argv.join(',').includes('--available-tools=view'));assert.equal(p.maximum_model_processes,1);
  assert.deepEqual(fs.readdirSync(f.home),before);
  assert.throws(()=>copilotProposal({...f,home:f.workspace}));
  assert.throws(()=>copilotProposal({...f,home:path.dirname(f.workspace)}));
  assert.throws(()=>copilotProposal({...f,credits:5}));assert.throws(()=>copilotProposal({...f,credits:NaN}));
});
test('no-model inspection never forwards auth secrets, changes proxy context or claims enforced sandbox',unix,t=>{
  const f=fixture(t),calls=[];const env={HTTP_PROXY:'retained proxy context',GITHUB_TOKEN:'secret',
    CLAUDE_CODE_OAUTH_TOKEN:'another secret'};
  const report=inspectCopilot({...f,env,execute:(_file,args,options)=>{
    calls.push(args);for(const key of COPILOT_SECRET_NAMES)assert(!Object.hasOwn(options.env,key));
    assert.equal(options.env.HTTP_PROXY,env.HTTP_PROXY);assert.equal(options.timeout,10000);
    assert(!args.includes('-p'));assert.equal(options.env.COPILOT_HOME,f.home);
    return {status:0,stdout:args.includes('--version')?'GitHub Copilot CLI 1.0.91.\n':
      args.includes('list')?JSON.stringify([{sourcePath:path.join(f.workspace,'AGENTS.md')}]):'help'};}});
  assert.equal(calls.length,3);assert.equal(report.instruction_discovery,true);
  assert.equal(report.sandbox_flag_parsed,true);assert.equal(report.sandbox_enforcement_verified,false);
  assert.equal(report.entitlement_verified,false);assert.equal(report.ready_for_inference,false);
  assert(!JSON.stringify(report).includes('secret'));assert.equal(env.GITHUB_TOKEN,'secret');
});
test('wrong binary, alternate paths, failed/noninteger process or version mismatch confer no readiness',unix,t=>{
  const f=fixture(t);let calls=0;const execute=()=>{calls++;return {status:0,stdout:'different version'};};
  assert.throws(()=>inspectCopilot({...f,expectedSha256:'f'.repeat(64),execute}));assert.equal(calls,0);
  const link=f.home+' link';fs.symlinkSync(f.home,link);assert.throws(()=>inspectCopilot({...f,home:link,execute}));
  assert.throws(()=>inspectCopilot({...f,home:path.dirname(f.workspace),execute}));
  assert.equal(calls,0);assert.equal(inspectCopilot({...f,execute}).version_matches,false);assert.equal(calls,1);
  for(const status of [null,0.5,undefined])assert.equal(inspectCopilot({...f,execute:()=>({status,stdout:'GitHub Copilot CLI 1.0.91.'})}).version_matches,false);
  assert.equal(inspectCopilot({...f,execute:()=>({status:0,signal:'SIGTERM',stdout:'GitHub Copilot CLI 1.0.91.'})}).version_matches,false);
});
test('inspection refuses executable replacement and does not promote malformed instruction output',unix,t=>{
  const f=fixture(t);let at=0;
  const report=inspectCopilot({...f,execute:()=>({status:0,stdout:++at===1?'GitHub Copilot CLI 1.0.91.':'private malformed output'})});
  assert.equal(report.instruction_discovery,false);assert(!JSON.stringify(report).includes('private'));
  assert.throws(()=>inspectCopilot({...f,execute:()=>{fs.appendFileSync(f.executable,'mutation');return {status:0,stdout:'wrong version'};}}));
});
test('instruction inventory supports actual cwd-relative paths but rejects disabled or different sources',unix,t=>{
  const f=fixture(t);
  for(const [sourcePath,defaultDisabled,expected] of [['AGENTS.md',false,true],
    ['../AGENTS.md',false,false],['AGENTS.md',true,false]]){
    const report=inspectCopilot({...f,execute:(_file,args)=>({status:0,stdout:args.includes('--version')?
      'GitHub Copilot CLI 1.0.91.':args.includes('list')?JSON.stringify([{sourcePath,defaultDisabled}]):'help'})});
    assert.equal(report.instruction_discovery,expected);assert.equal(report.ready_for_inference,false);
  }
});
test('binary mutation after the first inventory refuses the next command; hardlinks and writable binaries launch none',unix,t=>{
  const f=fixture(t);let calls=0;
  assert.throws(()=>inspectCopilot({...f,execute:()=>{calls++;fs.appendFileSync(f.executable,'changed');
    return {status:0,stdout:'GitHub Copilot CLI 1.0.91.'};}}));assert.equal(calls,1);
  const g=fixture(t);fs.linkSync(g.executable,g.executable+'-link');
  assert.throws(()=>inspectCopilot({...g,execute:()=>{calls++;}}));assert.equal(calls,1);
  const h=fixture(t);fs.chmodSync(h.executable,0o722);
  assert.throws(()=>inspectCopilot({...h,execute:()=>{calls++;}}));assert.equal(calls,1);
});
