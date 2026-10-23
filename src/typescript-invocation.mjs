// The package-script forms of a standalone TypeScript check: one `tsc` run, or
// several joined by `&&`, each with these arguments in any order:
// --noEmit, -p/--project PATH, --skipLibCheck, --pretty [true|false].
// Anything else (tsc -b, --watch, other options, other commands) is not one.
import fs from 'node:fs';
import path from 'node:path';

// No shell metacharacters; a leading @ would read as a REDUE token.
const word=/^[A-Za-z0-9_./+-][A-Za-z0-9_./@+-]*$/;
// More runs than this is not a script REDUE splits into checks.
const maxRuns=16;
function parseRun(words){
  if(words[0]!=='tsc'||!words.every(value=>word.test(value)))return null;
  let project=null,noEmit=false;
  for(let i=1;i<words.length;i++){
    const value=words[i];
    if(value==='-p'||value==='--project'){
      if(project!==null||!words[i+1]||words[i+1].startsWith('-'))return null;
      project=words[++i];
    }else if(value==='--noEmit')noEmit=true;
    else if(value==='--pretty'){if(['true','false'].includes(words[i+1]))i++;}
    else if(value!=='--skipLibCheck')return null;
  }
  return {args:words.slice(1),project,noEmit};
}
// The runs of a script, as [{args, project, noEmit}], or null.
export function tscRuns(text){
  if(typeof text!=='string'||!text.trim())return null;
  const parts=text.trim().split(/[ \t]+&&[ \t]+/);
  if(parts.length>maxRuns)return null;
  const runs=parts.map(part=>parseRun(part.split(/[ \t]+/)));
  return runs.every(Boolean)?runs:null;
}
// The run a check makes: its `script` (null for a check init proposed without
// one), the tsc arguments after the compiler in its command, and `count`, the
// number of configured checks for that script (more than one for a chain).
// Returns {run} with the parsed run, or {issue} when the arguments are outside
// the forms, or the script no longer has exactly `count` runs, one of them
// with exactly these arguments.
export function tscRun(scripts,{script=null,args,count=1}){
  if(!Array.isArray(args)||!args.every(value=>typeof value==='string'))return {issue:'TypeScript arguments are invalid'};
  const own=parseRun(['tsc',...args]);
  if(!own)return {issue:'TypeScript arguments are outside the supported forms'};
  if(script===null)return {run:own};
  if(typeof scripts?.[script]!=='string')return {issue:'typecheck script was removed'};
  if(scripts['pre'+script]||scripts['post'+script])return {issue:'typecheck script has pre or post scripts'};
  const runs=tscRuns(scripts[script]);
  if(runs?.length!==count||!runs.some(run=>JSON.stringify(run.args)===JSON.stringify(args)))
    return {issue:'typecheck script changed'};
  return {run:own};
}
// The config file a run names, relative to the directory `dir` it runs in
// (posix): tsconfig.json without -p, a directory's tsconfig.json, or null
// when it leaves that directory or the arguments are not a run.
export function runConfig(dir,args){
  const run=parseRun(['tsc',...args]);
  if(!run)return null;
  let file=path.posix.normalize((run.project??'tsconfig.json').split(path.sep).join('/'));
  let directory=false;try{directory=fs.statSync(path.join(dir,file)).isDirectory();}catch{}
  if(!file.endsWith('.json')||directory)file=path.posix.join(file,'tsconfig.json');
  if(path.posix.isAbsolute(file)||file==='..'||file.startsWith('../'))return null;
  return file;
}
// The check names for a script's runs: the kind's name for one run, and
// NAME.1 ... NAME.n for a chain (not #: the hook refuses it and zsh may glob it).
export const partName=(name,index,count)=>count===1?name:`${name}.${index}`;
// Probe arguments for a run, and back: SCRIPT (or -), COUNT, then the tsc
// arguments.
export const runArgv=({script=null,args,count=1})=>[script??'-',String(count),...args];
export function runFromArgv(values){
  const [script,count,...args]=values;
  if(typeof script!=='string'||!script||!/^[1-9]\d?$/.test(count||''))throw Object.assign(Error('probe-arguments'),{code:'probe-arguments'});
  return {script:script==='-'?null:script,args,count:Number(count)};
}
// The run a configured check makes: its script, the arguments after the
// compiler in its command, and how many checks the config has for the script
// (`runCount`, set when the config is loaded).
export const checkRun=check=>({script:check.script??null,
  args:Array.isArray(check.command)?check.command.slice(2):[],count:check.runCount??1});
// A script's checks in the order of its runs: one check per run with the same
// arguments ({name, args} each), as names; null when they do not correspond.
export function scriptRunChecks(text,checks){
  const runs=tscRuns(text);
  if(!runs||runs.length!==checks.length)return null;
  const left=[...checks],names=[];
  for(const run of runs){
    const at=left.findIndex(check=>JSON.stringify(check.args)===JSON.stringify(run.args));
    if(at<0)return null;
    names.push(left.splice(at,1)[0].name);
  }
  return names;
}
