// Internal supported-provider protocol. Default stdout is unchanged, so
// ordinary run checkpoints keep the same probe/result identity. The daemon
// may reuse a complete result only after revalidating its input key AND this
// independently checked execution/toolchain context. No TTL grants trust.
import {deflateSync} from 'node:zlib';
export function contextOnly(context) {
  if(process.argv.includes('--redue-context')){
    process.stdout.write(context);return true;
  }
  return false;
}
// A layout lets a recorded run rebuild the output after a content-only edit.
export function probeResult(output,context,queries=null,layout=null) {
  if(!process.argv.includes('--redue-checkpoint')){process.stdout.write(output);return;}
  const raw=queries?JSON.stringify(queries):null;
  const queryData=raw&&Buffer.byteLength(raw)<=8*1024*1024?deflateSync(raw).toString('base64'):null;
  let value=JSON.stringify({output,context,queryData,
    ...(layout?{layoutData:deflateSync(JSON.stringify(layout)).toString('base64')}:{})});
  // The layout is dropped first: it only shortens the run after an edit.
  if(Buffer.byteLength(value)>512*1024)value=JSON.stringify({output,context,queryData});
  // Optimization metadata must not overflow the ordinary probe channel.
  // Larger contracts keep the normal complete probe, without result reuse.
  if(Buffer.byteLength(value)>512*1024)value=JSON.stringify({output,context,queries:null});
  process.stdout.write(value);
}
