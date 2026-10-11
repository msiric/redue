// Contributor-only preparation. No inference, credential lookup, trust write,
// host settings change or model process launch is available through this module.
// Inspection executes only three explicit bounded, no-model host commands.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

export const COPILOT_VERSION='1.0.91';
export const COPILOT_SECRET_NAMES=['GITHUB_TOKEN','GH_TOKEN','COPILOT_GITHUB_TOKEN',
  'CLAUDE_CODE_OAUTH_TOKEN','ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN'];
const sha=data=>createHash('sha256').update(data).digest('hex');
const overlaps=(a,b)=>a===b||a.startsWith(b+path.sep)||b.startsWith(a+path.sep);
const fingerprint=stat=>['dev','ino','uid','mode','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
const childEnv=env=>{
  const result={...env};
  for(const key of COPILOT_SECRET_NAMES)delete result[key];
  // Do not alter proxy/runtime settings. These controls only disable CLI updates
  // and remote export; the parent remains responsible for included entitlement.
  return result;
};
function ownedDirectory(value){
  assert(typeof value==='string'&&path.isAbsolute(value),'A canonical absolute owned directory is required');
  assert.equal(fs.realpathSync(value),value,'Symlink/alternate directory identities are refused');
  const stat=fs.lstatSync(value);
  assert(stat.isDirectory()&&stat.uid===process.getuid()&&(stat.mode&0o022)===0,'Directory ownership is required');
  return value;
}
function parentIdentity(directory){
  assert.equal(fs.realpathSync(directory),directory);const records=[];let current=path.parse(directory).root;
  for(const segment of directory.slice(current.length).split(path.sep).filter(Boolean)){
    current=path.join(current,segment);const stat=fs.lstatSync(current,{bigint:true});
    assert(stat.isDirectory()&&!stat.isSymbolicLink()&&(stat.uid===0n||stat.uid===BigInt(process.getuid())));
    assert((stat.mode&0o022n)===0n||stat.uid===0n&&(stat.mode&0o1000n)!==0n,'Unsafe executable parent');
    // Directory mtime changes from unrelated inventory files do not change
    // its ownership/identity. Native file content has a separate complete guard.
    records.push([current,String(stat.dev),String(stat.ino),String(stat.uid),String(stat.mode)]);
  }
  return JSON.stringify(records);
}
function nativeSnapshot(file){
  const parents=parentIdentity(path.dirname(file)),before=fs.lstatSync(file,{bigint:true});
  assert.equal(fs.realpathSync(file),file);assert(before.isFile()&&before.nlink===1n);
  assert(before.uid===0n||before.uid===BigInt(process.getuid()));assert((before.mode&0o022n)===0n);
  assert(before.size>0n&&before.size<=BigInt(192*1024*1024),'Executable size is bounded');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  try{
    const opened=fs.fstatSync(fd,{bigint:true});assert(opened.isFile());assert.equal(fingerprint(opened),fingerprint(before));
    const hash=createHash('sha256'),buffer=Buffer.alloc(1024*1024);let read=0;
    while(read<Number(opened.size)){
      const count=fs.readSync(fd,buffer,0,Math.min(buffer.length,Number(opened.size)-read),read);
      assert(count>0,'Incomplete executable read');hash.update(buffer.subarray(0,count));read+=count;
    }
    assert.equal(fingerprint(fs.fstatSync(fd,{bigint:true})),fingerprint(opened));
    assert.equal(fingerprint(fs.lstatSync(file,{bigint:true})),fingerprint(opened));
    assert.equal(parentIdentity(path.dirname(file)),parents);
    return {sha256:hash.digest('hex'),identity:fingerprint(opened),parents};
  }finally{fs.closeSync(fd);}
}

export function inspectCopilot({executable,workspace,home,cache,expectedSha256,execute=spawnSync,env=process.env}){
  const result={schema:1,host:'copilot',expected_version:COPILOT_VERSION,
    command_available:false,version_matches:false,instruction_discovery:false,
    sandbox_flag_parsed:false,sandbox_enforcement_verified:false,
    entitlement_verified:false,model_launched:false,ready_for_inference:false};
  ownedDirectory(workspace);ownedDirectory(home);ownedDirectory(cache);
  assert(!overlaps(home,cache)&&!overlaps(home,workspace)&&!overlaps(cache,workspace),
    'Private host directories must remain outside the model workspace');
  assert(/^[a-f0-9]{64}$/.test(expectedSha256||''),'Reviewed executable digest is required');
  assert(path.isAbsolute(executable));const file=fs.realpathSync(executable),before=nativeSnapshot(file);
  assert.equal(before.sha256,expectedSha256,'Unreviewed executable: zero host commands');
  const invoke=args=>{
    assert.deepEqual(nativeSnapshot(file),before,'Executable changed before inventory command');
    const r=execute(file,args,{cwd:workspace,env:{...childEnv(env),COPILOT_HOME:home,COPILOT_CACHE_HOME:cache,
      COPILOT_AUTO_UPDATE:'false'},encoding:'utf8',timeout:10000,maxBuffer:1024*1024,
      stdio:['ignore','pipe','pipe']});
    return {completed:Number.isInteger(r.status)&&r.status===0&&!r.signal&&!r.error,stdout:r.stdout||''};
  };
  const version=invoke(['--no-auto-update','--version']);result.command_available=version.completed;
  result.version_matches=version.completed&&/^GitHub Copilot CLI 1\.0\.91\.(?:\r?\n|$)/.test(version.stdout);
  if(result.version_matches){
    const flags=invoke(['--sandbox','--help']);result.sandbox_flag_parsed=flags.completed;
    const discovered=invoke(['instruction','list','--json']);
    try{
      const sources=JSON.parse(discovered.stdout);
      // This is an inventory, not proof of session loading or behavioral use.
      result.instruction_discovery=discovered.completed&&Array.isArray(sources)&&sources.some(source=>
        typeof source?.sourcePath==='string'&&path.resolve(workspace,source.sourcePath)===path.join(workspace,'AGENTS.md')&&
        source.defaultDisabled!==true);
    }catch{}
  }
  assert.deepEqual(nativeSnapshot(file),before,'Host executable changed during inspection');
  return result;
}

export function copilotProposal({workspace,state,prefix,nodeDirectory,home,cache,logDirectory,credits=4}){
  for(const directory of [workspace,state,prefix,nodeDirectory,home,cache,logDirectory])ownedDirectory(directory);
  assert(Number.isInteger(credits)&&credits>=1&&credits<=4,'Initial proposal is at most four included AI credits');
  const privatePaths=[home,cache,logDirectory];
  for(let at=0;at<privatePaths.length;at++)for(const later of privatePaths.slice(at+1))
    assert(!overlaps(privatePaths[at],later),'Private host directories must be disjoint');
  for(const p of privatePaths)for(const exposed of [workspace,state,prefix,nodeDirectory])
    assert(!overlaps(p,exposed),'Host-private state cannot overlap exposed model paths');
  // This is ONLY a proposal for an owner-reviewed disposable VM. Existing
  // managed floors remain authoritative. No settings are written here.
  const settings={autoUpdate:false,remote:'off',remoteExport:false,memory:false,
    disableAllHooks:true,storeTokenPlaintext:false,
    sandbox:{enabled:true,allowBypass:false,allowDevToolAccess:false,
      addCurrentWorkingDirectory:false,auth:{git:false,gh:false},
      sandboxMcpServers:true,sandboxLspServers:true,
      userPolicy:{filesystem:{readwritePaths:[workspace,state],readonlyPaths:[prefix,nodeDirectory],
        deniedPaths:privatePaths},network:{allowOutbound:false,allowLocalNetwork:false},
        seatbelt:{keychainAccess:false}}}};
  const argv=['--experimental','--sandbox','--no-auto-update','--no-remote','--no-remote-export',
    '--no-ask-user','--disable-builtin-mcps','--disallow-temp-dir','--max-ai-credits',String(credits),
    '--max-autopilot-continues','0','--output-format','json','--log-level','none',
    '--secret-env-vars='+COPILOT_SECRET_NAMES.join(','),
    '--available-tools=bash,list_bash,read_bash,stop_bash',
    '--allow-tool=shell(redue:*)','--allow-tool=shell(cat:*)',
    '--allow-tool=shell(ls:*)','--deny-tool=shell(gh:*)','--deny-tool=shell(curl:*)',
    '--deny-tool=shell(npm:*)','--deny-tool=shell(copilot:*)'];
  return {schema:1,status:'DISABLED_PENDING_OWNER_REVIEW',host:'copilot',version:COPILOT_VERSION,
    settings,argv,environment:{COPILOT_HOME:home,COPILOT_CACHE_HOME:cache,COPILOT_AUTO_UPDATE:'false'},
    total_seconds:300,maximum_model_processes:1,
    requirements:['included_seat_policy_quota','exact_reviewed_native_distribution',
      'manual_pinned_workflow','effective_managed_policy','in_context_socket_and_network_controls',
      'no_tool_credential_access','real_redue_precondition'],
    model_launched:false,ready_for_inference:false};
}
