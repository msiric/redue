// Python projects for `redue init`: typecheck and lint checks that run mypy,
// pyright, ty or ruff from the project's .venv under the sandboxed recipe
// (sandbox.mjs). A tool is proposed when it is installed in .venv/bin. Its
// arguments are the ones the project runs it with, read from CI workflows,
// the Makefile, tox, nox, a justfile and shell scripts; without one, the
// tool's own default (`ruff check`, `ty check`, `pyright`, and `mypy` with
// its configured files or `.`).
import fs from 'node:fs';
import path from 'node:path';
import {realObservedPath} from './path-identity.mjs';
import {sandboxCheckInputs,sandboxQualification} from './sandbox.mjs';

const read=file=>{try{return fs.readFileSync(file,'utf8');}catch{return '';}};
const exists=file=>{try{fs.lstatSync(file);return true;}catch{return false;}};
const executable=file=>{try{fs.accessSync(file,fs.constants.X_OK);return fs.statSync(file).isFile();}catch{return false;}};
// Each tool, its kind, and the subcommand it runs as a check.
export const pythonTools=[{tool:'mypy',kind:'typecheck',sub:[]},{tool:'pyright',kind:'typecheck',sub:[]},
  {tool:'ty',kind:'typecheck',sub:['check']},{tool:'ruff',kind:'lint',sub:['check']}];
// The text of a TOML or INI section, up to the next section header.
const section=(text,header)=>{const at=text.split(/\r?\n/).findIndex(line=>line.trim()===header);
  if(at<0)return null;const rest=text.split(/\r?\n/).slice(at+1);const end=rest.findIndex(line=>/^\s*\[/.test(line));
  return (end<0?rest:rest.slice(0,end)).join('\n');};
// Ways a project starts a tool: through uv, poetry or pdm, `python -m`, or from .venv/bin.
const wrappers=[/^uv run(?: --(?:frozen|locked|no-sync|offline|quiet|all-extras|all-groups))*(?: --(?:group|extra|with|python|package) [^ ]+)* /,
  /^poetry run /,/^pdm run /,/^python3?(?:\.\d+)? -m /,/^(?:\.\/)?\.venv\/bin\//,
  // A variable that names the environment's bin directory: `${PREFIX}mypy`.
  /^\$\{?[A-Za-z_]+\}?(?=[A-Za-z])/];
// A tool's arguments in one line of a script or workflow, or null. The line
// must run the tool and its subcommand plainly; arguments with shell syntax,
// or ones that change files or install packages, are not taken.
export function toolArgs(line,{tool,sub}){
  let text=line.trim().replace(/^-\s+/,'').replace(/^run:\s*/,'').replace(/^[@-]+/,'');
  text=text.split(/\s(?:&&|\|\||;|\|)\s/)[0].replace(/\s+/g,' ').trim();
  for(let changed=true;changed;){changed=false;for(const wrapper of wrappers)if(wrapper.test(text)){text=text.replace(wrapper,'');changed=true;}}
  const words=text.split(' ');
  if(words[0]!==tool||JSON.stringify(words.slice(1,1+sub.length))!==JSON.stringify(sub))return null;
  const args=words.slice(1+sub.length);
  if(args.some(arg=>!/^[A-Za-z0-9_./:=,@+%-]+$/.test(arg)||/^--(?:fix|unsafe-fixes|write|install-types|watch)(?:=|$)/.test(arg)||arg.startsWith('..')||arg.startsWith('/')))return null;
  return args;
}
// The places a project writes how it runs its tools, in order of preference.
function scriptTexts(root){
  const texts=[];
  const workflows=path.join(root,'.github','workflows');
  let files=[];try{files=fs.readdirSync(workflows).filter(file=>/\.ya?ml$/.test(file)).sort();}catch{}
  for(const file of files)texts.push(read(path.join(workflows,file)));
  for(const file of ['Makefile','makefile','justfile','tox.ini','noxfile.py'])texts.push(read(path.join(root,file)));
  // Shell scripts: *.sh, or a file whose #! line runs a shell (scripts/check).
  for(const dir of ['scripts','script','bin','ci']){let names=[];try{names=fs.readdirSync(path.join(root,dir)).sort();}catch{}
    for(const name of names){const text=read(path.join(root,dir,name)).slice(0,65536);
      if(name.endsWith('.sh')||/^#!\S*(?:\/|env\s+)(?:ba|z|da)?sh\b/.test(text))texts.push(text);}}
  return texts;
}
// The arguments the project runs `tool` with, or its default.
export function projectArgs(root,spec,texts=scriptTexts(root)){
  for(const text of texts)for(const line of text.split(/\r?\n/)){
    if(/^\s*#/.test(line))continue;
    const args=toolArgs(line,spec);
    if(args)return {args,source:'project'};
  }
  if(spec.tool!=='mypy')return {args:[],source:'default'};
  // mypy without targets needs `files` in its configuration.
  const configured=[section(read(path.join(root,'pyproject.toml')),'[tool.mypy]'),section(read(path.join(root,'mypy.ini')),'[mypy]'),
    section(read(path.join(root,'.mypy.ini')),'[mypy]'),section(read(path.join(root,'setup.cfg')),'[mypy]')].some(text=>text&&/^\s*files\s*=/m.test(text));
  return {args:configured?[]:['.'],source:'default'};
}
// The Python checks `init` proposes, or null when the root is not a Python
// project. Each row is ready only once init has run it both ways (bin/redue.mjs).
export function discoverPythonProject(root){
  root=realObservedPath(root);
  if(!['pyproject.toml','setup.cfg','setup.py','requirements.txt'].some(file=>exists(path.join(root,file))))return null;
  const checks=[],skipped=[];
  if(!exists(path.join(root,'.venv','pyvenv.cfg'))){
    skipped.push({kind:'python',reason:'no .venv in the project root; REDUE runs Python tools from the project\'s .venv (uv sync, or Poetry with virtualenvs.in-project)'});
    return {root,checks,skipped};
  }
  const texts=scriptTexts(root);
  const found=pythonTools.filter(spec=>executable(path.join(root,'.venv','bin',spec.tool)));
  for(const spec of found){
    const {args,source}=projectArgs(root,spec,texts);
    const several=found.filter(other=>other.kind===spec.kind).length>1;
    checks.push({config:{name:several?`${spec.kind}:${spec.tool}`:spec.kind,kind:spec.kind,qualification:sandboxQualification,
      command:[`.venv/bin/${spec.tool}`,...spec.sub,...args],...sandboxCheckInputs()},level:'ready',qualification:sandboxQualification,
      reason:`sandboxed recipe: ${[spec.tool,...spec.sub,...args].join(' ')} from .venv${source==='project'?' as the project runs it':''}; the whole checkout is its input`});
  }
  return {root,checks,skipped};
}
