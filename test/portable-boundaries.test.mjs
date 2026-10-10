import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {queryAnswer,queriesMatch} from '../src/typescript-list.mjs';

// Independent controls for the facts portable comparison must retain. These
// tests do not grant portable eligibility or replace observer interval checks.
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redue-portable-boundary-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'));
  return root;
}
const capture=(kind,file)=>[kind,file,queryAnswer(kind,file)];

test('retained absence and directory membership detect newly resolvable candidates',t=>{
  const root=fixture(t),candidate=path.join(root,'src','new.d.ts');
  const absent=capture('fileExists',candidate),members=capture('entries',path.dirname(candidate));
  assert.equal(absent[2],null);assert(queriesMatch([absent,members]));
  fs.writeFileSync(candidate,'declare const added: string;\n');
  assert.equal(queriesMatch([absent]),false);
  assert.equal(queriesMatch([members]),false);
});

test('membership survives neither removal nor rename despite identical content bytes',t=>{
  const root=fixture(t),source=path.join(root,'src','one.ts');
  fs.writeFileSync(source,'export const value = 1;\n');
  const members=capture('entries',path.dirname(source)),content=capture('readFile',source);
  fs.renameSync(source,path.join(root,'src','two.ts'));
  assert.equal(queriesMatch([members]),false);
  assert.equal(queriesMatch([content]),false);
});

test('a restored end-state cannot establish a complete execution interval',t=>{
  const root=fixture(t),source=path.join(root,'src','one.ts'),bytes='export const value = 1;\n';
  fs.writeFileSync(source,bytes);
  const content=capture('readFile',source);
  fs.writeFileSync(source,'export const value: number = "wrong";\n');
  assert.equal(queriesMatch([content]),false);
  fs.writeFileSync(source,bytes);
  assert.equal(queriesMatch([content]),true,
    'equal endpoint facts require separate observer continuity/change-event evidence');
});

test('symlink topology remains distinct even when both targets have identical content',t=>{
  const root=fixture(t),one=path.join(root,'src','one.ts'),two=path.join(root,'src','two.ts'),
    link=path.join(root,'src','selected.ts');
  fs.writeFileSync(one,'export const value = 1;\n');fs.copyFileSync(one,two);
  try{fs.symlinkSync('one.ts',link);}catch(error){
    if(process.platform==='win32'&&['EPERM','EACCES'].includes(error.code)){
      t.skip('native symlink privilege unavailable; no portability claim for this case');return;
    }throw error;
  }
  const content=capture('readFile',link),resolution=capture('realpath',link);
  fs.unlinkSync(link);fs.symlinkSync('two.ts',link);
  assert.equal(queriesMatch([content]),true);
  assert.equal(queriesMatch([resolution]),false,
    'content equality alone must not erase selected resolution topology');
});
