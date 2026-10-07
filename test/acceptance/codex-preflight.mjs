// Run this INSIDE the same Codex command boundary as the planned model trial.
// Read-only: does not start an observer, grant permission, or execute a check.
// Synchronized status may run configured probes in the trusted project observer.
import {spawnSync} from 'node:child_process';
import {findExecutable} from '../../src/executable-lookup.mjs';
import {windowsLaunch} from '../../src/windows-command.mjs';

const value=flag=>{const at=process.argv.indexOf(flag);return at<0?null:process.argv[at+1];};
const config=value('--config'),check=value('--check'),cli=findExecutable('redue');
if(!config||!check)throw Error('usage: node codex-preflight.mjs --config FILE --check CHECK; run within the intended agent boundary');
const result={schema:1,cli,cwd:process.cwd(),node:process.execPath,
  sandboxMarker:process.env.CODEX_SANDBOX||null,commands:[],eligible:false};
for(const args of [['--version'],['--config',config,'agent','doctor','codex','--json'],
  ['--config',config,'status','--json'],['--config',config,'status','--sync','--json']]){
  if(!cli)break;
  const launch=windowsLaunch([cli,...args]),started=performance.now();
  const r=spawnSync(launch.file,launch.args,{...launch.options,encoding:'utf8',timeout:35000,maxBuffer:4*1024*1024});
  let response=null;try{response=JSON.parse(r.stdout);}catch{}
  result.commands.push({args,exit:r.status,error:r.error?.code||null,ms:performance.now()-started,
    response,stdout:response?null:r.stdout,stderr:r.stderr});
}
const synchronized=result.commands.at(-1),status=synchronized?.response,
  row=status?.checks?.find(row=>row.name===check);
result.eligible=Boolean(synchronized?.exit===0&&status?.schema===1&&status.observation?.healthy===true&&
  row?.freshness==='CURRENT'&&row.result==='PASS'&&row.reuse_eligible===true);
result.runId=row?.invocation?.runId||null;
result.reason=row?.reason||'CLI or structured synchronized response unavailable';
console.log(JSON.stringify(result,null,2));
process.exitCode=result.eligible?0:2;
