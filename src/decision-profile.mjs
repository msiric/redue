// Opt-in, bounded local diagnostics. Never include paths, command arguments,
// environment values, source, or probe output in a timing record.
export const profiling=process.env.REDUE_DECISION_PROFILE==='1';

export function timing(phase,started,counts={}) {
  if(!profiling)return;
  const memory=process.memoryUsage();
  process.stderr.write('REDUE_TIMING '+JSON.stringify({
    at:Date.now(),pid:process.pid,phase,
    ms:Math.round((performance.now()-started)*10)/10,
    rssMiB:Math.round(memory.rss/1048576*10)/10,
    ...counts
  })+'\n');
}
