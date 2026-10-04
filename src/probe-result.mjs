// Internal supported-provider protocol. Default stdout is unchanged, so
// ordinary run checkpoints keep the same probe/result identity. The daemon
// may reuse a complete result only after revalidating its input key AND this
// independently checked execution/toolchain context. No TTL grants trust.
export function contextOnly(context) {
  if(process.argv.includes('--redue-context')){
    process.stdout.write(context);return true;
  }
  return false;
}
export function probeResult(output,context,queries=null) {
  process.stdout.write(process.argv.includes('--redue-checkpoint')?
    JSON.stringify({output,context,queries}):output);
}
