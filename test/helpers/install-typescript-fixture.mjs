// Installs one TypeScript version as a compiler fixture, as the pretest
// fixtures are: test/fixtures/typescript-X-Y-Z with its own lockfile.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const version=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('usage: install-typescript-fixture.mjs X.Y.Z');
const dir=path.resolve('test/fixtures',`typescript-${version.replaceAll('.','-')}`);
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:`redue-typescript-${version.replaceAll('.','-')}-fixture`,
  version:'1.0.0',private:true,dependencies:{typescript:version}},null,2)+'\n');
execFileSync(process.platform==='win32'?'npm.cmd':'npm',['install','--no-audit','--no-fund'],{cwd:dir,stdio:'inherit',shell:process.platform==='win32'});
