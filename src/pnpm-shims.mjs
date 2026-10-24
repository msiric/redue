// pnpm's launchers. On macOS and Linux, pnpm writes each node_modules/.bin
// entry as a `#!/bin/sh` script that finds its own directory (with sed,
// dirname, readlink, uname or printf, depending on the pnpm release), sets
// NODE_PATH and execs Node on the package's bin file. A launcher is trusted only
// when its text is one of the templates pnpm releases write
// (pnpm-shim-templates.json, built by eval/pnpm-shim-templates.mjs), with only
// the NODE_PATH value, the bin file and the trailing target comment filled in.
import fs from 'node:fs';
import path from 'node:path';

const templates=JSON.parse(fs.readFileSync(new URL('pnpm-shim-templates.json',import.meta.url),'utf8')).templates;
const known=new Set(templates.map(row=>row.template));
// A value with no quote, expansion, escape or line break: it stays literal in
// the shell.
const literal=/^[^"$`\\\n]*$/;

// The launcher's text as a template, with the values it fills in, or null
// when it does not have pnpm's form.
export function shimTemplate(text){
  if(typeof text!=='string'||!text.startsWith('#!/bin/sh\n'))return null;
  let template=text,nodePath=null;
  // NODE_PATH, set alone or in front of the caller's.
  const alone=/\n  export NODE_PATH="([^"\n]*)"\n/.exec(text);
  if(alone){
    nodePath=alone[1];
    // Each entry is literal, or relative to the launcher's own directory
    // ($basedir_abs, which pnpm 12.6 and later write).
    if(!nodePath.split(':').every(entry=>literal.test(entry.replace(/^\$basedir(?:_abs)?\//,'')))||
      !text.includes(`\n  export NODE_PATH="${nodePath}:$NODE_PATH"\n`))return null;
    template=template.split(`\n  export NODE_PATH="${nodePath}:$NODE_PATH"\n`).join('\n  export NODE_PATH="@@NODE_PATH@@:$NODE_PATH"\n')
      .split(`\n  export NODE_PATH="${nodePath}"\n`).join('\n  export NODE_PATH="@@NODE_PATH@@"\n');
  }
  // The bin file, relative to the launcher's directory, after $basedir,
  // $basedir_abs or $basedir_win; `node` and `node.exe` there are Node itself.
  const targets=new Set([...template.matchAll(/"\$basedir(?:_abs|_win)?\/([^"\n]+)"/g)].map(match=>match[1])
    .filter(value=>value!=='node'&&value!=='node.exe'));
  if(targets.size!==1)return null;
  const [target]=targets;
  if(!literal.test(target))return null;
  for(const prefix of ['$basedir','$basedir_abs','$basedir_win'])
    template=template.split(`"${prefix}/${target}"`).join(`"${prefix}/@@TARGET@@"`);
  // pnpm 11 and later end with a comment naming the target.
  template=template.replace(/\n# cmd-shim-target=[^\n]*\n?$/,'\n# cmd-shim-target=@@COMMENT@@\n');
  return {template,nodePath,target};
}
// The bin file a pnpm launcher runs with Node, as an absolute path, or null
// when `file` is not a launcher pnpm writes.
export function pnpmShimTarget(file,text=null){
  try{
    text??=fs.readFileSync(file,'utf8');
    const shim=shimTemplate(text);
    return shim&&known.has(shim.template)?path.resolve(path.dirname(file),shim.target):null;
  }catch{return null;}
}
