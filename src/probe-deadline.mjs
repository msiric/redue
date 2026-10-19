// How long a full probe may run before it is killed and the check stays
// UNVERIFIED. It grows with the project: the larger of the hint from earlier
// probes (twice the last successful one, or twice the deadline that last timed
// out) and the last completed run, between the platform floor and a ceiling.
import {fileURLToPath} from 'node:url';
export const probeCeilingMs=process.env.VSTATE_TEST_FAULTS==='1'&&
  Number(process.env.VSTATE_TEST_PROBE_CEILING_MS)||60000;
// Supported TypeScript probes perform bounded input/toolchain hashing.
// Native NTFS runs have exceeded the generic 5 s cap under load, despite
// completing normally and with the duplicated work already removed.
export const probeFloorMs=qualification=>qualification==='pnpm-tsc-v1'||
  (process.platform==='win32'&&['typescript-noemit-v1','npm-typescript-direct-v1','yarn-workspace-tsc-v1']
    .includes(qualification))?10000:5000;
// REDUE's own probes, which accept --redue-deadline; a user's probe never gets it.
const builtIn=new Set(['typescript-contract-probe.mjs','direct-typescript-probe.mjs',
  'yarn-workspace-typecheck-probe.mjs','pnpm-typecheck-probe.mjs'].map(name=>fileURLToPath(new URL(name,import.meta.url))));
export const builtInProbe=argv=>builtIn.has(argv?.[1]);
// A deadline read from status.json, as a whole number of milliseconds no
// longer than a decision could need (0 when absent or unusable).
export function publishedDeadline(value) {
  return Number.isFinite(value)&&value>0?Math.min(Math.round(value),10*60*1000):0;
}
export function probeDeadline({floor,hint=0,runMs=0,ceiling=probeCeilingMs}) {
  const finite=value=>Number.isFinite(value)&&value>0?value:0;
  return Math.round(Math.min(ceiling,Math.max(floor,finite(hint),finite(runMs))));
}
// The hint the next probe starts from.
export function nextProbeHint({durationMs,deadlineMs,timedOut}) {
  return 2*(timedOut?deadlineMs:durationMs);
}
// Inside a probe process: what is left of the deadline its caller passed with
// --redue-deadline=MS, or the fallback when none was passed. An inner call
// always ends before its parent is killed, so it never outlives the probe.
export function probeTimeLeft(fallback) {
  const deadline=Number(/^--redue-deadline=(\d+)$/.exec(process.argv.find(arg=>arg.startsWith('--redue-deadline='))||'')?.[1]);
  return deadline?Math.max(1,Math.round(deadline-performance.now()-250)):fallback;
}
