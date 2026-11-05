// Python projects for `redue init`: typecheck, lint and test checks that run
// mypy, pyright, ty, ruff or pytest from the project's .venv under the sandboxed recipe
// (sandbox.mjs). A tool is proposed when it is installed in .venv/bin. Its
// arguments are the ones the project runs it with, read from CI workflows,
// the Makefile, tox, nox, a justfile and shell scripts; without one, the
// tool's own default (`ruff check`, `ty check`, `pyright`, `pytest`, and
// `mypy` with its configured files or `.`).
import fs from 'node:fs';
import path from 'node:path';
import {realObservedPath} from './path-identity.mjs';
import {sandboxCheckInputs,sandboxQualification} from './sandbox.mjs';

const read=file=>{try{return fs.readFileSync(file,'utf8');}catch{return '';}};
const exists=file=>{try{fs.lstatSync(file);return true;}catch{return false;}};
const executable=file=>{try{fs.accessSync(file,fs.constants.X_OK);return fs.statSync(file).isFile();}catch{return false;}};
// Each tool, its kind, and the subcommand it runs as a check.
export const pythonTools=[{tool:'mypy',kind:'typecheck',sub:[]},{tool:'pyright',kind:'typecheck',sub:[]},
  {tool:'ty',kind:'typecheck',sub:['check']},{tool:'ruff',kind:'lint',sub:['check']},{tool:'pytest',kind:'test',sub:[]}];
// The text of a TOML or INI section, up to the next section header.
const section=(text,header)=>{const at=text.split(/\r?\n/).findIndex(line=>line.trim()===header);
  if(at<0)return null;const rest=text.split(/\r?\n/).slice(at+1);const end=rest.findIndex(line=>/^\s*\[/.test(line));
  return (end<0?rest:rest.slice(0,end)).join('\n');};
// Ways a project starts a tool: through uv, poetry or pdm, `python -m`,
// coverage (`coverage run -m pytest`), or from .venv/bin.
const wrappers=[/^uv run(?: --(?:frozen|locked|no-sync|offline|quiet|all-extras|all-groups))*(?: --(?:group|extra|with|python|package) [^ ]+)* /,
  /^poetry run /,/^pdm run /,/^python3?(?:\.\d+)? -m /,/^(?:\.\/)?\.venv\/bin\//,
  /^coverage run(?: --?[A-Za-z][\w-]*(?:=[^ "']+)?)* -m /,
  // A variable that names the environment's bin directory: `${PREFIX}mypy`.
  /^\$\{?[A-Za-z_]+\}?(?=[A-Za-z])/];
// A tool's arguments in one line of a script or workflow, or null. The line
// must run the tool and its subcommand plainly; arguments with shell syntax,
// ones that change files or install packages, and pytest's that run a set
// chosen from its cache (--lf, --ff, --sw, --nf), show the cache, loop
// (-f), rewrite snapshots or add to earlier coverage data, are not taken.
// A quoted argument (`-m "not slow"`) is one argument, and may hold spaces
// and parentheses, nothing a shell would expand. Options that only write a
// report (JUnit XML, HTML, durations) are left out: they change no result,
// and a report written into the checkout would be an input the run changes.
const reportOption=/^--(?:junit-?xml|html|self-contained-html|durations|durations-min|junit-prefix|report-log)(?:=|$)/;
const reportValue=/^--(?:junit-?xml|html|durations|durations-min|junit-prefix|report-log)$/;
function words(text){
  const out=[];let current=null,quote=null;
  for(const c of text){
    if(quote){if(c===quote)quote=null;else current+=c;continue;}
    if(c==='"'||c==="'"){quote=c;current??='';current+=`\u0000`;continue;}
    if(c===' '){if(current!==null)out.push(current);current=null;continue;}
    current=(current??'')+c;
  }
  if(quote)return null;
  if(current!==null)out.push(current);
  // A quoted word is marked with NUL while it is read: its text must be plain.
  return out.map(word=>word.includes('\u0000')?{quoted:true,text:word.replaceAll('\u0000','')}:{quoted:false,text:word});
}
export function toolArgs(line,{tool,sub}){
  let text=line.trim().replace(/^-\s+/,'').replace(/^run:\s*/,'').replace(/^[@-]+/,'');
  text=text.split(/\s(?:&&|\|\||;|\|)\s/)[0].replace(/\s+/g,' ').trim();
  for(let changed=true;changed;){changed=false;for(const wrapper of wrappers)if(wrapper.test(text)){text=text.replace(wrapper,'');changed=true;}}
  const parsed=words(text);
  if(!parsed)return null;
  const names=parsed.map(word=>word.text);
  if(parsed.slice(0,1+sub.length).some(word=>word.quoted)||names[0]!==tool||JSON.stringify(names.slice(1,1+sub.length))!==JSON.stringify(sub))return null;
  const given=parsed.slice(1+sub.length);
  if(given.some(({quoted,text:arg})=>!(quoted?/^[A-Za-z0-9_./:=,@+% ()-]+$/:/^[A-Za-z0-9_./:=,@+%-]+$/).test(arg)||
    /^--(?:fix|unsafe-fixes|write|install-types|watch|lf|last-failed|ff|failed-first|sw|sw-skip|sw-reset|stepwise|stepwise-skip|stepwise-reset|nf|new-first|cache-show|looponfail|snapshot-update|update-snapshots|inline-snapshot|cov-append)(?:=|$)/.test(arg)||
    arg==='-f'||arg.startsWith('..')||arg.startsWith('/')))return null;
  const args=[];
  for(let i=0;i<given.length;i++){
    if(reportOption.test(given[i].text)){if(reportValue.test(given[i].text))i++;continue;}
    args.push(given[i].text);
  }
  return args;
}
// The places a project writes how it runs its tools, in order of preference.
// A workflow that runs on pull requests is marked `pr`.
function scriptTexts(root){
  const texts=[];
  const workflows=path.join(root,'.github','workflows');
  let files=[];try{files=fs.readdirSync(workflows).filter(file=>/\.ya?ml$/.test(file)).sort();}catch{}
  for(const file of files){const text=read(path.join(workflows,file));texts.push({text,pr:/\bpull_request(?:_target)?\b/.test(text)});}
  for(const file of ['Makefile','makefile','justfile','tox.ini','noxfile.py'])texts.push(read(path.join(root,file)));
  // Shell scripts: *.sh, or a file whose #! line runs a shell (scripts/check).
  for(const dir of ['scripts','script','bin','ci']){let names=[];try{names=fs.readdirSync(path.join(root,dir)).sort();}catch{}
    for(const name of names){const text=read(path.join(root,dir,name)).slice(0,65536);
      if(name.endsWith('.sh')||/^#!\S*(?:\/|env\s+)(?:ba|z|da)?sh\b/.test(text))texts.push(text);}}
  return texts;
}
// The arguments the project runs `tool` with, or its default: the first line
// that runs it, but a pull-request workflow's when it narrows the suite (-m,
// -k, --ignore, --deselect), as a project's quick tests leave out slow ones.
// A line continued with a backslash is one line.
const narrows=args=>args.some(arg=>/^(?:-m|-k|--ignore|--ignore-glob|--deselect)(?:=|$)/.test(arg));
export function projectArgs(root,spec,texts=scriptTexts(root)){
  let first=null;
  for(const entry of texts){
    const {text,pr}=typeof entry==='string'?{text:entry,pr:false}:entry;
    for(const line of text.replace(/\\\r?\n[ \t]*/g,' ').split(/\r?\n/)){
      if(/^\s*#/.test(line))continue;
      const args=toolArgs(line,spec);
      if(!args)continue;
      if(pr&&narrows(args))return {args,source:'project'};
      first??={args,source:'project'};
    }
  }
  if(first)return first;
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
      reason:`sandboxed recipe: ${[spec.tool,...spec.sub,...args].map(arg=>/\s/.test(arg)?JSON.stringify(arg):arg).join(' ')} from .venv${source==='project'?' as the project runs it':''}; the whole checkout is its input`});
  }
  return {root,checks,skipped};
}
