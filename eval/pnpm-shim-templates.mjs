#!/usr/bin/env node
// Builds src/pnpm-shim-templates.json: the launcher templates pnpm releases
// write into node_modules/.bin on macOS and Linux. For each release it
// downloads pnpm with `npm pack`, installs a two-package workspace offline,
// and keeps the launcher written for the workspace package's bin, as a
// template (src/pnpm-shims.mjs).
//
//   node eval/pnpm-shim-templates.mjs WORK_DIR [VERSION...]
//
// Without versions it takes the latest patch of every minor release from 8.0
// on. pnpm 12 is a native executable: its @pnpm/exe package for this platform
// is downloaded instead. Existing templates are kept, so a run can add
// releases.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {shimTemplate} from '../src/pnpm-shims.mjs';

const [work,...requested]=process.argv.slice(2);
if(!work){console.error('usage: node eval/pnpm-shim-templates.mjs WORK_DIR [VERSION...]');process.exit(2);}
fs.mkdirSync(work,{recursive:true});
const output=fileURLToPath(new URL('../src/pnpm-shim-templates.json',import.meta.url));
const npm=(...args)=>execFileSync('npm',args,{cwd:work,encoding:'utf8',maxBuffer:64*1024*1024}).trim();
let versions=requested;
if(!versions.length){
  const last={};
  for(const version of JSON.parse(npm('view','pnpm','versions','--json'))){
    const match=/^(\d+)\.(\d+)\.\d+$/.exec(version);
    if(match&&Number(match[1])>=8)last[`${match[1]}.${match[2]}`]=version;
  }
  versions=Object.values(last);
}
const platform=`${process.platform==='darwin'?'darwin':'linux'}-${process.arch}`;
// The pnpm entry for `version`: a JavaScript file run with Node, or the native executable.
function entry(version){
  const dir=path.join(work,`pnpm-${version}`);
  const native=Number(version.split('.')[0])>=12;
  const name=native?`@pnpm/exe.${platform}`:'pnpm';
  if(!fs.existsSync(dir)){
    const tarball=npm('pack',`${name}@${version}`,'--silent').split('\n').pop();
    fs.mkdirSync(dir);
    execFileSync('tar',['-xzf',path.join(work,tarball),'-C',dir]);
    fs.rmSync(path.join(work,tarball));
  }
  const pkg=path.join(dir,'package');
  if(native){const file=path.join(pkg,'pnpm');fs.chmodSync(file,0o755);return [file];}
  const bin=['bin/pnpm.cjs','bin/pnpm.mjs'].map(file=>path.join(pkg,file)).find(file=>fs.existsSync(file));
  return [process.execPath,bin];
}
// A workspace whose root depends on a package with a Node bin.
function launcher(version){
  const root=fs.mkdtempSync(path.join(work,'fixture-'));
  const json=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2));};
  json(path.join(root,'package.json'),{name:'fixture',private:true,dependencies:{tool:'workspace:*'}});
  fs.writeFileSync(path.join(root,'pnpm-workspace.yaml'),'packages:\n  - tool\n');
  json(path.join(root,'tool','package.json'),{name:'tool',version:'1.0.0',bin:{tool:'bin/tool.js'}});
  fs.mkdirSync(path.join(root,'tool','bin'));
  fs.writeFileSync(path.join(root,'tool','bin','tool.js'),'#!/usr/bin/env node\n',{mode:0o755});
  const [file,...args]=entry(version);
  const out=spawnSync(file,[...args,'install','--offline','--config.manage-package-manager-versions=false'],
    {cwd:root,encoding:'utf8',env:{...process.env,npm_config_update_notifier:'false',CI:'1'},timeout:120000});
  try{
    if(out.status!==0)throw Error(`pnpm ${version} install failed: ${(out.stderr||out.stdout||out.error?.message||'').trim().slice(-400)}`);
    return fs.readFileSync(path.join(root,'node_modules','.bin','tool'),'utf8');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
}
let existing=[];try{existing=JSON.parse(fs.readFileSync(output,'utf8')).templates;}catch{}
const rows=new Map(existing.map(row=>[row.template,new Set(row.versions)]));
for(const version of versions){
  try{
    const text=launcher(version),shim=shimTemplate(text);
    if(!shim)throw Error(`pnpm ${version} wrote a launcher this parser does not read:\n${text}`);
    if(!rows.has(shim.template))rows.set(shim.template,new Set());
    rows.get(shim.template).add(version);
    console.log(`${version}: template ${[...rows.keys()].indexOf(shim.template)+1}`);
  }catch(e){console.error(e.message);process.exitCode=1;}
}
const order=version=>version.split('.').map(Number);
const compare=(a,b)=>{const [x,y]=[order(a),order(b)];for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
const templates=[...rows].map(([template,set])=>({versions:[...set].sort(compare),template}))
  .sort((a,b)=>compare(a.versions[0],b.versions[0]));
fs.writeFileSync(output,JSON.stringify({schema:1,templates},null,1)+'\n');
console.log(`${templates.length} templates from ${templates.reduce((n,row)=>n+row.versions.length,0)} releases`);
