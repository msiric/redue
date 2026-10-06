// Release-only helper: npm's manifest supplies the filename, never a name guess.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function readArtifact(manifestPath,{writeChecksum=false}={}) {
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  assert(Array.isArray(manifest)&&manifest.length===1,'Expected one npm pack artifact');
  const metadata=manifest[0],filename=metadata.filename;
  assert(typeof filename==='string'&&filename.endsWith('.tgz')&&!/[\\/\r\n]/.test(filename),'Unsafe artifact filename');
  const file=path.resolve(path.dirname(manifestPath),filename),bytes=fs.readFileSync(file);
  const digest=algorithm=>createHash(algorithm).update(bytes).digest(algorithm==='sha512'?'base64':'hex');
  assert.equal(bytes.length,metadata.size,'Artifact size differs from manifest');
  assert.equal(digest('sha1'),metadata.shasum,'Artifact SHA1 differs from manifest');
  assert.equal(`sha512-${digest('sha512')}`,metadata.integrity,'Artifact integrity differs from manifest');
  const sha256=digest('sha256'),checksum=`${sha256}  ${filename}\n`;
  const checksumPath=path.join(path.dirname(manifestPath),'SHA256SUMS');
  if(writeChecksum)fs.writeFileSync(checksumPath,checksum);
  else assert.equal(fs.readFileSync(checksumPath,'utf8'),checksum,'Artifact SHA256 differs from checksum file');
  return {file,metadata,sha256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [operation,manifestPath]=process.argv.slice(2);
  assert(['record','verify'].includes(operation)&&manifestPath,'Usage: package-artifact.mjs record|verify manifest.json');
  console.log(readArtifact(manifestPath,{writeChecksum:operation==='record'}).file);
}
