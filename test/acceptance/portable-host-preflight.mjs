// Contributor acceptance helper. Invoke INSIDE the intended host command boundary.
// No model launch, verification execution, permission change or observer startup.
// The synchronized query may run the locally configured observer's reviewed probes.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';
import {preconditionMatches,runGatedTrial} from './agent-trial-gate.mjs';
import {inspectControlledPortableGuidance} from './portable-controlled-guidance.mjs';

export function portablePreconditionMatches(report,expected,{evidenceId,runId,state}={}){
  if(!['codex','claude'].includes(report?.host)||report?.prerequisites?.ready!==true)return false;
  if(state&&report.prerequisites.state_matches!==true)return false;
  if(!preconditionMatches(report,expected))return false;
  const row=report.commands.at(-1)?.response?.checks?.find(row=>row.name===report.check);
  const imported=row?.evidence_source==='imported';
  if(runId&&(imported?row?.imported_evidence?.origin_run_id:row?.invocation?.runId)!==runId)return false;
  if(evidenceId&&(!imported||row?.imported_evidence?.digest!==evidenceId||row.invocation!==null))return false;
  return true;
}

export async function runPortableGatedTrial({preflight,expected,requirements={},record,launch}){
  let actual;
  return runGatedTrial({expected,preflight:async()=>{
    actual=await preflight();
    return portablePreconditionMatches(actual,expected,requirements)?actual:null;
  },record:attempt=>record({...attempt,report:actual??attempt.report,
    portable_precondition:portablePreconditionMatches(actual,expected,requirements)}),launch});
}

export function collectPortableHostPreflight({host,config,check,state=null,cwd=process.cwd(),
  cli=findExecutable('redue'),execute=spawnSync,controlledGuidance=null}={}){
  if(!['codex','claude'].includes(host)||!config||!check)throw Error('host, config and check are required');
  const report={schema:1,host,check,cli,commands:[],eligible:false,
    prerequisites:{ready:false},behavior_verified:false,
    boundary:{sandbox_marker_present:Boolean(process.env.CODEX_SANDBOX),verified_by_helper:false}};
  if(!cli){report.prerequisites.reason='redue_unavailable';return report;}
  let guidanceBefore=null;
  if(controlledGuidance!==null){
    try{
      // This explicit contributor fixture mechanism never overrides a product
      // doctor conflict or proves that the native host loaded instructions.
      if(host!=='claude'||!state||!controlledGuidance||
        controlledGuidance.root!==path.resolve(cwd)||
        path.resolve(cwd,config)!==path.join(controlledGuidance.root,'redue.config.json')||
        path.resolve(cwd,state)!==controlledGuidance.state||
        controlledGuidance.hosts?.length!==1||controlledGuidance.hosts[0]!==host)throw Error('Invalid fixture');
      guidanceBefore=inspectControlledPortableGuidance(controlledGuidance);
    }catch{
      report.prerequisites.reason='controlled_guidance_invalid';return report;
    }
  }
  const base=['--config',config,...(state?['--state-dir',state]:[])];
  const invoke=args=>{
    const started=performance.now();
    try{
      const launch=windowsLaunch([cli,...args]);
      const result=execute(launch.file,launch.args,{...launch.options,cwd,encoding:'utf8',
        stdio:['ignore','pipe','pipe'],timeout:35000,maxBuffer:4*1024*1024});
      let response=null;
      try{response=JSON.parse(result.stdout);}catch{}
      const command={args,exit:result.status,error:result.error?.code||null,
        signal:result.signal||null,ms:performance.now()-started,response};
      report.commands.push(command);return command;
    }catch(error){const command={args,exit:null,error:error.code||error.name,
      signal:null,ms:performance.now()-started,response:null};report.commands.push(command);return command;}
  };
  const version=invoke(['--version']);
  const doctorCommand=invoke([...base,'agent','doctor',host,'--json']);
  const doctor=doctorCommand.response,hostRow=doctor?.hosts?.find(row=>row.host===host);
  const configMatches=typeof doctor?.project?.config==='string'&&
    path.resolve(cwd,config)===path.resolve(cwd,doctor.project.config);
  const stateMatches=state===null||typeof doctor?.project?.state==='string'&&
    path.resolve(cwd,state)===path.resolve(cwd,doctor.project.state);
  const managedIntact=hostRow?.installed===true&&hostRow.integrity==='intact';
  const genericIntact=guidanceBefore!==null&&hostRow?.installed===false&&hostRow.integrity==='absent';
  const instructionsIntact=guidanceBefore===null?managedIntact:genericIntact;
  report.prerequisites={ready:Boolean(version.exit===0&&doctorCommand.exit===0&&doctor?.schema===1&&
    !doctor.project?.error&&configMatches&&stateMatches&&doctor.command?.matches_invocation!==false&&
    hostRow?.executable&&hostRow.version&&instructionsIntact),
    config_matches:configMatches,state_matches:stateMatches,
    host_version:hostRow?.version||null,integration_integrity:guidanceBefore?'controlled-generic-intact':hostRow?.integrity||'unknown',
    integration_mechanism:guidanceBefore?'controlled-generic-project-instructions':'product-managed-agent-setup',
    product_integration_integrity:hostRow?.integrity||'unknown',
    control:doctor?.control?.classification||'unknown',state_access:doctor?.state_access?.status||'unknown',
    reason:doctor?.project?.error?'configuration_unavailable':!configMatches?'configuration_mismatch':
      !stateMatches?'state_mismatch':doctor?.command?.matches_invocation===false?'cli_mismatch':
      !hostRow?.version?'host_unavailable':!instructionsIntact?'integration_unavailable':null};
  // Cached inspection is used only to establish an intentional unavailable case.
  // It never establishes direct-compiler reuse.
  if(doctor?.control?.reachable===false)invoke([...base,'status','--json']);
  invoke([...base,'status','--sync','--json']);
  if(guidanceBefore){
    try{
      const after=inspectControlledPortableGuidance(controlledGuidance);
      if(JSON.stringify(after)!==JSON.stringify(guidanceBefore))throw Error('Changed fixture');
      report.controlled_guidance=after;
    }catch{
      report.prerequisites.ready=false;report.prerequisites.reason='controlled_guidance_changed';
      report.prerequisites.integration_integrity='conflict';
    }
  }

  report.eligible=preconditionMatches({...report,eligible:true},'eligible');
  const row=report.commands.at(-1)?.response?.checks?.find(row=>row.name===check);
  report.runId=(row?.evidence_source==='imported'?row?.imported_evidence?.origin_run_id:row?.invocation?.runId)||null;
  report.evidenceId=row?.evidence_source==='imported'?row?.imported_evidence?.digest||null:null;
  return report;
}

function main(args){
  const options={},allowed=new Set(['--host','--config','--check','--state-dir','--expected','--evidence-id','--run-id','--controlled-prefix','--policy-sha256','--guidance-role']);
  for(let at=0;at<args.length;at+=2){
    if(!allowed.has(args[at])||!args[at+1]||args[at+1].startsWith('--')||Object.hasOwn(options,args[at]))
      throw Error('use --host codex|claude --config FILE --check CHECK --expected eligible|stale|failed|unverified|unavailable [--state-dir DIR] [--evidence-id SHA] [--run-id ID]');
    options[args[at]]=args[at+1];
  }
  if(!['eligible','stale','failed','unverified','unavailable'].includes(options['--expected']))throw Error('an explicit expected precondition is required');
  let controlledGuidance=null;
  if(['--controlled-prefix','--policy-sha256','--guidance-role'].some(k=>Object.hasOwn(options,k))){
    if(!options['--controlled-prefix']||!options['--policy-sha256']||!options['--guidance-role']||!options['--state-dir'])throw Error('Explicit controlled fixture resources are required');
    const prefix=path.resolve(options['--controlled-prefix']);
    controlledGuidance={root:path.dirname(path.resolve(options['--config'])),state:path.resolve(options['--state-dir']),prefix,
      policyFile:path.join(prefix,'lib/node_modules/@redue/cli/src/agent-policy.md'),policySha256:options['--policy-sha256'],hosts:[options['--host']],role:options['--guidance-role']};
  }
  const report=collectPortableHostPreflight({host:options['--host'],config:options['--config'],check:options['--check'],state:options['--state-dir']||null,controlledGuidance});
  const matched=portablePreconditionMatches(report,options['--expected'],{
    evidenceId:options['--evidence-id'],runId:options['--run-id'],state:options['--state-dir']});
  console.log(JSON.stringify({...report,expected:options['--expected'],matched},null,2));
  process.exitCode=matched?0:2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=2;}
}
