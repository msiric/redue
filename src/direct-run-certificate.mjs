// A caller validates discovery, never an execution outcome. No persistent cache.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {timing} from './decision-profile.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function directRunCertificateAllowed(selected) {
  return process.platform==='darwin'&&selected.qualification==='npm-typescript-direct-v1'&&
    selected.probes?.length===1&&
    selected.probes[0][1]===fileURLToPath(new URL('direct-typescript-probe.mjs',import.meta.url))&&
    !(process.env.VSTATE_TEST_FAULTS==='1'&&process.env.VSTATE_TEST_FULL_RUN_PROBES==='1');
}
export function validateDirectRunCertificate(plan,selected,snapshot) {
  const started=performance.now(),c=snapshot?.discoveryCertificate;
  const fallback=reason=>{timing('cli.run_certificate',started,{outcome:'fallback',reason});return null;};
  if(!directRunCertificateAllowed(selected))return fallback('unsupported');
  if(!snapshot?.observationHealthy||!c||c.schema!==1||c.planId!==plan.id||
    c.planId!==snapshot.planId||c.cwd!==plan.cwd||
    c.probeDefinition!==hash(JSON.stringify(selected.probes))||
    ![c.output,c.context,c.stderrHash].every(s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s))||
    typeof c.queryData!=='string'||c.queryData.length>512*1024)
    return fallback('certificate_unavailable');
  try{
    const queries=JSON.parse(inflateSync(Buffer.from(c.queryData,'base64'),{maxOutputLength:8*1024*1024}));
    const argv=selected.probes[0];
    const value=hash(JSON.stringify([[argv,0,hash(c.output),c.stderrHash]]));
    if(value!==snapshot.probeHash)return fallback('probe_identity_changed');
    // The built-in child checks the current implementation, actual caller
    // environment, context, content, membership and previously absent queries.
    // The daemon environment is never substituted for the caller's.
    const out=spawnSync(argv[0],[...argv.slice(1),'--redue-validate-queries'],{
      cwd:plan.cwd,env:process.env,timeout:10000,maxBuffer:1024*1024,
      input:JSON.stringify({schema:1,context:c.context,queries})});
    if(out.error||out.signal||out.status!==0||out.stdout.toString()!==c.context||
      hash(out.stderr)!==c.stderrHash)return fallback('caller_validation_failed');
    timing('cli.run_certificate',started,{outcome:'reused',queries:queries.length});
    return value;
  }catch{return fallback('certificate_invalid');}
}
