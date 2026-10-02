// Read-only execution identity for explicitly named local tools. Output contains
// hashes and metadata only; the verifier hashes the output again for its receipt.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha=value=>createHash('sha256').update(value).digest('hex');
function identity(file) {
  const real=fs.realpathSync(file),stat=fs.statSync(real,{bigint:true});
  if(!stat.isFile())throw Error('toolchain identity requires a regular file');
  const facts=[sha(real),...['dev','ino','mode','size','mtimeNs','ctimeNs']
    .map(key=>String(stat[key]))];
  // Hash small scripts/bundles on each probe. For large native executables,
  // version plus identity/metadata keeps synchronized reads inexpensive.
  if(stat.size<=16n*1024n*1024n)facts.push(sha(fs.readFileSync(real)));
  return facts;
}
const own=fileURLToPath(import.meta.url);
process.stdout.write(JSON.stringify({schema:1,nodeVersion:process.version,
  node:identity(process.execPath),probe:identity(own),
  tools:process.argv.slice(2).map(identity)}));
