import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {upgradeOptions,runUpgrade,policyCommandArgs} from './acceptance/portable-upgrade-smoke.mjs';
test('installed compatibility requires separately identified old/new bytes and explicit evidence identity',()=>{
  const args=['--tarball','/owned/current.tgz','--sha256','1'.repeat(64),'--source','1'.repeat(40),'--legacy-tarball','/owned/old.tgz',
    '--legacy-sha256','2'.repeat(64),'--legacy-source','2'.repeat(40),'--evidence','/owned/selected.json','--evidence-digest','3'.repeat(64)];
  assert.equal(upgradeOptions(args)['--source'],'1'.repeat(40));
  for(const value of [args.slice(0,-2),[...args,'--source','3'.repeat(40)],[...args,'--unknown','value']])assert.throws(()=>upgradeOptions(value));
  for(const [key,value] of [['--evidence','relative'],['--source','latest'],['--sha256','not-a-checksum'],['--legacy-tarball','relative']]){
    const broken=[...args];broken[broken.indexOf(key)+1]=value;assert.throws(()=>upgradeOptions(broken));}
});
test('changed candidate or legacy bytes launch zero installs, checks and models',async t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'redue-upgrade-gate-'))),file=path.join(base,'changed.tgz');
  fs.writeFileSync(file,'incorrect');t.after(()=>fs.rmSync(base,{recursive:true,force:true}));let launches=0;
  t.mock.method(childProcess,'spawnSync',()=>{launches++;throw Error('No process permitted after failed artifact gate');});syncBuiltinESMExports();
  t.after(()=>{t.mock.restoreAll();syncBuiltinESMExports();});
  await assert.rejects(runUpgrade({'--tarball':file,'--sha256':'1'.repeat(64),'--legacy-tarball':file,'--legacy-sha256':'2'.repeat(64)}));
  assert.equal(launches,0);
});

test('policy file updates select portable config without committing a machine-local state override',()=>{
  const argv=policyCommandArgs('/owned/bin/redue','/owned/Checkout 空间','setup','codex','--apply','--json');
  assert.deepEqual(argv,['/owned/bin/redue','--config','/owned/Checkout 空间/redue.config.json','agent','setup','codex','--apply','--json']);
  assert(!argv.includes('--state-dir'));assert(!argv.includes('/owned/redue-state'));
});
