// A fixture project's package-lock.json. With a compiler from a version
// fixture (REDUE_TEST_COMPILER_PACKAGE), it records that compiler's version
// and integrity from the fixture's own lockfile, as npm would: the direct
// recipe checks a TypeScript outside its reviewed list against that
// integrity and the tarball in npm's cache.
import fs from 'node:fs';
import path from 'node:path';
export function fixtureLockfile(name,compilerDir){
  const lock={name,lockfileVersion:3};
  try{
    const own=JSON.parse(fs.readFileSync(path.join(compilerDir,'..','..','package-lock.json'),'utf8'));
    const entry=own.packages?.['node_modules/typescript'];
    if(entry?.integrity)lock.packages={'':{name},'node_modules/typescript':
      {version:entry.version,resolved:entry.resolved,integrity:entry.integrity}};
  }catch{}
  return JSON.stringify(lock);
}
