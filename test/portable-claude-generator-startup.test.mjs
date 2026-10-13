// Engineering loader observation only: not Claude, Bun equivalence, compiler,
// credential enforcement or a seal. Default invocation launches no process.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {prepareClaude187GeneratorProposal} from './acceptance/portable-claude-generator-proposal.mjs';

const native='/Users/mariosiric/Library/Application Support/REDUE/portable-evidence/native-claude-2.1.187/bin/claude';
const node='/Users/mariosiric/.nvm/versions/node/v22.13.0/bin/node';
const launcher='/usr/bin/sandbox-exec';
const nodeSha='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc';
const launcherSha='c7d6609ce2b87a538ffd0d92b6be7de64dbc919b6845cc16b92f7c57e2658fdf';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const mark=s=>['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>String(s[k])).join(':');
function binding(file,expected,owner){
  assert.equal(fs.realpathSync(file),file,'STARTUP_PATH_UNKNOWN');
  const named=fs.lstatSync(file,{bigint:true});
  assert(named.isFile()&&!named.isSymbolicLink()&&named.nlink===1n&&named.uid===BigInt(owner)&&(named.mode&0o22n)===0n,'STARTUP_ARTIFACT_UNKNOWN');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  try{assert.equal(mark(fs.fstatSync(fd,{bigint:true})),mark(named),'STARTUP_ARTIFACT_CHANGED');
    assert.equal(sha(fs.readFileSync(fd)),expected,'STARTUP_ARTIFACT_UNKNOWN');
    assert.equal(mark(fs.fstatSync(fd,{bigint:true})),mark(named),'STARTUP_ARTIFACT_CHANGED');
  }finally{fs.closeSync(fd);}
  assert.equal(mark(fs.lstatSync(file,{bigint:true})),mark(named),'STARTUP_ARTIFACT_CHANGED');
  const parents=[];for(let p=path.dirname(file);;p=path.dirname(p)){const st=fs.lstatSync(p,{bigint:true});assert(st.isDirectory()&&!st.isSymbolicLink(),'STARTUP_PARENT_UNKNOWN');parents.push([p,[st.dev,st.ino,st.mode,st.uid,st.gid].map(String).join(':')]);if(p===path.dirname(p))break;}
  return {file,expected,owner,mark:mark(named),parents};
}
function unchanged(before){const after=binding(before.file,before.expected,before.owner);assert.equal(after.mark,before.mark,'STARTUP_ARTIFACT_CHANGED');assert.deepEqual(after.parents,before.parents,'STARTUP_PARENT_CHANGED');}

test('fixed native-derived read view starts only pinned Node --version; engineering observation, never authority',{
  skip:process.env.REDUE_GENERATOR_STARTUP==='1'?false:'Reviewed engineering startup not selected; no process launched'
},t=>{
  assert(process.platform==='darwin'&&process.arch==='arm64'&&process.version==='v22.13.0'&&process.execPath===node&&process.getuid()>0&&process.getuid()===process.geteuid()&&process.getgid()===process.getegid(),'STARTUP_PLATFORM_UNKNOWN');
  const runtime=binding(node,nodeSha,process.getuid()),wrapper=binding(launcher,launcherSha,0);
  const proposal=prepareClaude187GeneratorProposal({native});
  assert.equal(fs.realpathSync('/private/tmp'),'/private/tmp','STARTUP_TEMP_UNKNOWN');
  const tmp=fs.lstatSync('/private/tmp');assert(tmp.isDirectory()&&!tmp.isSymbolicLink()&&tmp.uid===0&&(tmp.mode&0o7777)===0o1777,'STARTUP_TEMP_UNKNOWN');
  const base=fs.realpathSync(fs.mkdtempSync('/private/tmp/redue-engineering-startup-'));fs.chmodSync(base,0o700);
  const home=base+'/home',cwd=base+'/cwd';fs.mkdirSync(home,{mode:0o700});fs.mkdirSync(cwd,{mode:0o700});
  const source=base+'/public-generator.js';fs.writeFileSync(source,proposal.source,{mode:0o600,flag:'wx'});
  try{
    // Actual source closure, actual four builtins and initializer. No custom
    // policy fragments, profiles, environment, commands or code from evidence.
    const child=`import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
try{const code=fs.readFileSync(process.argv[1],'utf8');if(createHash('sha256').update(code).digest('hex')!==process.argv[2])throw Error();const requireActual=createRequire(import.meta.url),allowed=new Set(['fs','path','os','child_process']);
const context=vm.createContext({process,require:name=>{if(!allowed.has(name))throw Error();return requireActual(name);}});
const script=new vm.Script(code+';g2i();k0d('+JSON.stringify({readConfig:{denyOnly:['/'],allowWithinDeny:[${JSON.stringify(node)}]},writeConfig:{allowOnly:[],denyWithinAllow:[]},needsNetworkRestriction:true,allowUnixSockets:[],allowAllUnixSockets:false,allowLocalBinding:false,allowMachLookup:[],allowPty:false,allowGitConfig:false,enableWeakerNetworkIsolation:false,allowAppleEvents:false,logTag:'REDUE_ENGINEERING_STARTUP'})+')');
const profile=script.runInContext(context,{timeout:1000});if(typeof profile!=='string'||Buffer.byteLength(profile)>65536||!profile.includes('(allow file-read* (literal "/"))')||profile.includes('(allow network*)'))throw Error();process.stdout.write(JSON.stringify({profile}));
}catch{process.stdout.write('{"result":"UNKNOWN"}');process.exitCode=74;}`;
    const generated=spawnSync(node,['--input-type=module','--eval',child,source,proposal.sourceSha256],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:131072,killSignal:'SIGKILL'});
    assert(!generated.error&&generated.signal===null&&generated.status===0&&generated.stderr==='','STARTUP_GENERATOR_UNKNOWN');
    let value;try{value=JSON.parse(generated.stdout);}catch{assert.fail('STARTUP_GENERATOR_PROTOCOL_UNKNOWN');}
    assert(value&&Object.keys(value).join(',')==='profile'&&typeof value.profile==='string'&&Buffer.byteLength(value.profile)<=65536,'STARTUP_GENERATOR_PROTOCOL_UNKNOWN');
    unchanged(runtime);unchanged(wrapper);assert.equal(prepareClaude187GeneratorProposal({native}).sourceSha256,proposal.sourceSha256,'STARTUP_SOURCE_CHANGED');
    const result=spawnSync(launcher,['-p',value.profile,node,'--version'],{cwd,env:{HOME:home,TMPDIR:base},encoding:'utf8',timeout:5000,maxBuffer:4096,killSignal:'SIGKILL'});
    unchanged(runtime);unchanged(wrapper);assert.equal(prepareClaude187GeneratorProposal({native}).sourceSha256,proposal.sourceSha256,'STARTUP_SOURCE_CHANGED');
    // No raw stderr/profile/environment. A failure is an observation, not a
    // reason to widen the view, repeat unchanged or grant portable authority.
    const observation={schema:1,scope:'NATIVE_DERIVED_ENGINEERING_NODE_STARTUP_ONLY',status:result.status,signal:['SIGKILL','SIGABRT','SIGSEGV','SIGTERM',null].includes(result.signal)?result.signal:'OTHER',spawnError:result.error?'UNKNOWN':'NONE',exactVersion:result.stdout==='v22.13.0\n',stdoutBytes:Buffer.byteLength(result.stdout??''),stderrBytes:Buffer.byteLength(result.stderr??''),profileSha256:sha(value.profile),nativeLaunches:0,models:0,compilerExecutions:0,nativeEnforcement:'NOT_ESTABLISHED',bunEquivalence:'NOT_ESTABLISHED',sealed:false,reuseEligible:false};
    t.diagnostic(JSON.stringify(observation));
    assert(!result.error&&result.signal===null&&result.status===0&&result.stdout==='v22.13.0\n','ENGINEERING_NODE_STARTUP_UNKNOWN');
  }finally{
    // Only fresh owned source/empty directories; no recursive parent cleanup.
    fs.unlinkSync(source);fs.rmdirSync(home);fs.rmdirSync(cwd);fs.rmdirSync(base);
  }
});
