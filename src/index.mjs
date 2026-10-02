import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import micromatch from 'micromatch';
import {sha} from './plan.mjs';
import {resolveLinks} from './installed-inputs.mjs';

const tracked = root => [...new Set(execFileSync('git',
  ['ls-files','--cached','--others','--exclude-standard','-z'],
  {cwd:root,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},maxBuffer:64*1024*1024})
  .toString().split('\0').filter(Boolean))];
const xor = (left,right) => { for(let i=0;i<32;i++) left[i]^=right[i]; };
const token = (file,hash) => createHash('sha256').update(file+'\0'+hash).digest();
const stablePrefix = glob => {
  const parts=glob.replace(/^!/, '').split('/'), fixed=[];
  for(const p of parts) { if(/[?*[{(]/.test(p)) break; fixed.push(p); }
  // An exact file is its own scan root. Scanning its parent could enumerate an
  // entire ignored installation tree for one declared metadata file.
  return fixed.join('/');
};
const groupMatchers = patterns => {
  const groups=new Map();
  for(const pattern of patterns) {
    const prefix=stablePrefix(pattern);
    if(!groups.has(prefix))groups.set(prefix,[]);
    groups.get(prefix).push(micromatch.matcher(pattern,{dot:true}));
  }
  return groups;
};
const pathPrefixes = rel => {
  const parts=rel.split('/'), prefixes=[''];
  for(let i=1;i<=parts.length;i++)prefixes.push(parts.slice(0,i).join('/'));
  return prefixes;
};

function fileHash(root, rel,installed=false,before=fs.lstatSync(path.join(root,rel),
  {bigint:true})) {
  const file=path.join(root, rel);
  let value,references=[],bytes=Number(before.size);
  if(before.isSymbolicLink()){
    const resolution=resolveLinks(file,root,[],true);
    if(!resolution.physical)throw Error(`symlink input target observation unavailable: ${rel}: ${resolution.reason}`);
    const target=fs.statSync(resolution.physical,{bigint:true});
    if(!target.isFile())throw Error(`directory input symlink unsupported: ${rel}`);
    if(installed&&target.nlink>1n)throw Error(`shared hardlink storage not observed: ${rel}`);
    value='link:'+JSON.stringify(resolution.links)+':'+target.mode+':'+
      hashRegular(resolution.physical).hash;
    references=[...new Set([...resolution.links.map(link=>path.relative(root,link.path)
      .split(path.sep).join('/')),path.relative(root,resolution.physical)
      .split(path.sep).join('/')])];
    bytes=Number(target.size);
    const targetAfter=fs.statSync(resolution.physical,{bigint:true});
    for(const key of ['dev','ino','mode','size','mtimeNs','ctimeNs'])
      if(target[key]!==targetAfter[key])throw Error(`input changed during inspection: ${rel}`);
    const resolutionAfter=resolveLinks(file,root,[],true);
    if(resolutionAfter.physical!==resolution.physical||
      JSON.stringify(resolutionAfter.links)!==JSON.stringify(resolution.links))
      throw Error(`input link changed during inspection: ${rel}`);
  }
  else if(before.isFile()) value='file:'+before.mode+':'+hashRegular(file).hash;
  else throw Error(`non-file input: ${rel}`);
  const after=fs.lstatSync(file,{bigint:true});
  for(const key of ['dev','ino','mode','size','mtimeNs','ctimeNs'])
    if(before[key]!==after[key]) throw Error(`input changed during inspection: ${rel}`);
  return {hash:sha(value),references,bytes};
}
const readBuffer=Buffer.allocUnsafe(65536);
function hashRegular(file) {
  const h=createHash('sha256'), fd=fs.openSync(file,'r');
  try { let n; while((n=fs.readSync(fd,readBuffer,0,readBuffer.length,null))>0)
    h.update(readBuffer.subarray(0,n)); }
  finally { fs.closeSync(fd); }
  return {hash:h.digest('hex')};
}

export class InputIndex {
  constructor(bundle, options={}) {
    const matcherStarted=performance.now();
    this.bundle=bundle; this.root=bundle.root; this.files=new Map(); this.members=new Map();
    this.symlinkRefs=new Map();this.aliasDependencies=new Map();
    this.trackGit=options.trackGit!==false;
    this.installedRoots=[...new Set(Object.values(bundle.plans).flatMap(plan=>
      plan.installedPhysicalRoots||[]))];
    this.installedRootSet=new Set(this.installedRoots);
    this.installedAncestors=new Set(this.installedRoots.flatMap(pathPrefixes));
    this.includeInstalled=options.includeInstalled||false;
    this.checks=new Map(); this.prefixes=new Map(); this.eventCount=0; this.rehashedFiles=0;
    this.rehashedBytes=0; this.lastChange=0; this.unavailable=null;
    this.profile={matcherMs:0,trackedMs:0,enumerationMs:0,matchingMs:0,
      hashingMs:0,recordMs:0,enumeratedEntries:0};
    for(const [name,plan] of Object.entries(bundle.plans)) {
      const source=plan.sourcePatterns||plan.patterns;
      const positive=source.filter(p=>!p.startsWith('!'));
      const negative=source.filter(p=>p.startsWith('!')).map(p=>p.slice(1));
      const additivePositive=(plan.additivePatterns||[]).filter(p=>!p.startsWith('!'));
      const additiveNegative=(plan.additivePatterns||[]).filter(p=>p.startsWith('!'))
        .map(p=>p.slice(1));
      const row={plan,positive:groupMatchers(positive),negative:groupMatchers(negative),
        additivePositive:groupMatchers(additivePositive),
        additiveNegative:groupMatchers(additiveNegative),
        files:new Set(),sum:Buffer.alloc(32),revision:0,lastReason:null,probeHash:null,probeAt:0};
      this.checks.set(name,row);
      for(const p of [...positive,...additivePositive]) {
        const prefix=stablePrefix(p);
        if(!this.prefixes.has(prefix)) this.prefixes.set(prefix,new Set());
        this.prefixes.get(prefix).add(name);
      }
    }
    this.profile.matcherMs=performance.now()-matcherStarted;
  }
  candidates(rel) {
    const names=new Set(this.prefixes.get('')||[]);
    const parts=rel.split('/');
    for(let i=1;i<=parts.length;i++)
      for(const name of this.prefixes.get(parts.slice(0,i).join('/'))||[]) names.add(name);
    return names;
  }
  matches(row,rel) { const started=performance.now(), prefixes=pathPrefixes(rel);
    const any=(groups)=>prefixes.some(prefix=>(groups.get(prefix)||[]).some(fn=>fn(rel)));
    const result=(any(row.positive) && !any(row.negative))||
      (any(row.additivePositive)&&!any(row.additiveNegative));
    this.profile.matchingMs+=performance.now()-started;return result; }
  installedPath(rel) {
    if(this.includeInstalled||this.installedAncestors.has(rel))return true;
    for(let slash=rel.length;slash>0;slash=rel.lastIndexOf('/',slash-1)){
      if(this.installedRootSet.has(rel.slice(0,slash)))return true;
      if(slash===0)break;
    }
    return false;
  }
  fingerprint(name) {
    const row=this.checks.get(name);
    return sha(row.plan.id+'\0'+row.files.size+'\0'+row.sum.toString('hex')+'\0'+(row.probeHash||''));
  }
  summary(name) { const row=this.checks.get(name); return {fingerprint:this.fingerprint(name),
    revision:row.revision,planId:row.plan.id,files:row.files.size,probeAt:row.probeAt}; }
  record(rel, changeReason=rel+' changed', observedStat=null) {
    if(!rel || path.posix.isAbsolute(rel) || rel.split('/').includes('..')) {
      this.unavailable='invalid event path'; return false;
    }
    const names=this.candidates(rel), old=this.files.get(rel), matched=[];
    for(const name of names) if(this.matches(this.checks.get(name),rel)) matched.push(name);
    if(!matched.length && old===undefined) return false;
    let fresh,stat,inspection;
    try{stat=observedStat||fs.lstatSync(path.join(this.root,rel),{bigint:true});}
    catch(e){if(e.code!=='ENOENT'){this.unavailable=String(e);return false;}}
    if(stat&&(stat.isFile()||stat.isSymbolicLink())) {
      const installed=this.installedPath(rel);
      if(stat.nlink>1n&&installed){
        this.unavailable=`shared hardlink storage not observed: ${rel}`;return false;}
      try{const started=performance.now();inspection=fileHash(this.root,rel,installed,stat);
        fresh=inspection.hash;
        this.profile.hashingMs+=performance.now()-started;
        this.rehashedFiles++;this.rehashedBytes+=inspection.bytes;}
      catch(e){this.unavailable=String(e);return false;}
    } else if(stat){this.unavailable=`non-file input: ${rel}`;return false;}
    for(const reference of this.aliasDependencies.get(rel)||[]){
      const aliases=this.symlinkRefs.get(reference);
      aliases?.delete(rel);if(aliases?.size===0)this.symlinkRefs.delete(reference);
    }
    this.aliasDependencies.delete(rel);
    if(inspection?.references.length){
      this.aliasDependencies.set(rel,new Set(inspection.references));
      for(const reference of inspection.references){
        if(!this.symlinkRefs.has(reference))this.symlinkRefs.set(reference,new Set());
        this.symlinkRefs.get(reference).add(rel);
      }
    }
    const oldNames=this.members.get(rel)||new Set(), newNames=new Set(fresh===undefined?[]:matched);
    if(old===fresh && oldNames.size===newNames.size && [...oldNames].every(n=>newNames.has(n))) return false;
    for(const name of new Set([...oldNames,...newNames])) {
      const row=this.checks.get(name);
      if(oldNames.has(name) && old!==undefined) {xor(row.sum,token(rel,old));row.files.delete(rel);}
      if(newNames.has(name) && fresh!==undefined) {xor(row.sum,token(rel,fresh));row.files.add(rel);}
      row.revision++;row.lastReason=changeReason;
    }
    if(fresh!==undefined && newNames.size) {this.files.set(rel,fresh);this.members.set(rel,newNames);}
    else {this.files.delete(rel);this.members.delete(rel);}
    if(old!==fresh || oldNames.size!==newNames.size) {
      this.eventCount++;this.lastChange=Date.now();return true;
    }
    return false;
  }
  scanSubtree(rel) {
    const found=new Set(), roots=new Set();
    // Directory notifications can name only an ancestor of an exact input.
    // Revisit matching declared roots without traversing unrelated siblings.
    if([...this.prefixes.keys()].some(prefix=>!prefix||prefix===rel||rel.startsWith(prefix+'/')))
      roots.add(rel);
    for(const prefix of this.prefixes.keys())
      if(!rel||prefix.startsWith(rel+'/'))roots.add(prefix);
    const visit=(file,r)=>{
      let st;try{st=fs.lstatSync(file);}catch(e){if(e.code==='ENOENT')return;throw e;}
      if(st.isDirectory()) {
        if(r && (path.posix.basename(r)==='.git'||
          (path.posix.basename(r)==='node_modules'&&!this.installedPath(r)))&&
          !this.prefixes.has(r)) return;
        for(const entry of fs.readdirSync(file,{withFileTypes:true}))
          visit(path.join(file,entry.name),r?r+'/'+entry.name:entry.name);
      } else if(!found.has(r)) {found.add(r);this.record(r);}
    };
    for(const root of roots) {
      const base=path.join(this.root,root);
      let present=true;
      try{fs.lstatSync(base);}catch(e){if(e.code==='ENOENT')present=false;else throw e;}
      if(present)visit(base,root);
    }
    for(const old of [...this.files.keys()]) if((old===rel||old.startsWith(rel+'/'))&&!found.has(old)) this.record(old);
  }
  coldScan(progress) {
    this.unavailable=null;
    const trackedStarted=performance.now();
    const names=new Set(this.trackGit?tracked(this.root):[]);
    this.profile.trackedMs+=performance.now()-trackedStarted;
    const enumerationStarted=performance.now();
    // Traverse declared input roots to include ignored/generated inputs. Avoid unrelated
    // node_modules/.git trees unless a pattern explicitly names them.
    const roots=[...this.prefixes.keys()].filter(prefix=>prefix||!this.trackGit)
      .sort((a,b)=>a.length-b.length);
    const selected=[], selectedSet=new Set();
    for(const prefix of roots) {
      const parts=prefix.split('/');
      if(parts.some((_,i)=>selectedSet.has(parts.slice(0,i+1).join('/'))))continue;
      selected.push(prefix);selectedSet.add(prefix);
    }
    let scanned=0,processingMs=0;
    for(const prefix of selected) {
      const base=path.join(this.root,prefix);
      const visit=(file,rel)=>{
        this.profile.enumeratedEntries++;
        let st;try{st=fs.lstatSync(file,{bigint:true});}
        catch(e){if(e.code==='ENOENT')return;throw e;}
        if(st.isDirectory()) {
          if((path.posix.basename(rel)==='.git'||
            (path.posix.basename(rel)==='node_modules'&&!this.installedPath(rel))) &&
            !this.prefixes.has(rel))return;
          for(const ent of fs.readdirSync(file,{withFileTypes:true}))
            visit(path.join(file,ent.name),rel?rel+'/'+ent.name:ent.name);
        } else {
          names.delete(rel);
          const started=performance.now();
          if(this.candidates(rel).size)this.record(rel,'cold reconciliation',st);
          processingMs+=performance.now()-started;
          scanned++;
          if(progress&&scanned%256===0)progress({scanned,total:null});
        }
      };
      let st;try{st=fs.lstatSync(base,{bigint:true});}
      catch(e){if(e.code==='ENOENT')continue;throw e;}
      if(st.isSymbolicLink()) {
        try{if(fs.statSync(base).isDirectory()){
          this.unavailable=`glob rooted at directory symlink unsupported: ${prefix}`;continue;}}
        catch(e){if(e.code!=='ENOENT')throw e;}
      }
      visit(base,prefix);
    }
    this.profile.enumerationMs+=performance.now()-enumerationStarted-processingMs;
    const recordStarted=performance.now();
    for(const rel of names) {
      if(this.candidates(rel).size)this.record(rel,'cold reconciliation');
      scanned++;
      if(progress&&scanned%256===0)progress({scanned,total:null});
    }
    if(progress)progress({scanned,total:scanned});
    this.profile.recordMs+=processingMs+performance.now()-recordStarted;
  }
  updatePath(rel) {
    const full=path.join(this.root,rel);
    let subtree=false;
    try {
      if(fs.lstatSync(full).isSymbolicLink()&&fs.statSync(full).isDirectory()){
        this.unavailable=`directory symlink input unsupported: ${rel}`;return;}
      if(fs.statSync(full).isDirectory()) {this.scanSubtree(rel);subtree=true;}
      else this.record(rel);
    } catch(e) {
      if(e.code==='ENOENT') {
        if([...this.files.keys()].some(p=>p.startsWith(rel+'/'))) {
          this.scanSubtree(rel);subtree=true;}
        else this.record(rel);
      } else {this.unavailable=String(e);}
    }
    const aliases=new Set(this.symlinkRefs.get(rel)||[]);
    if(subtree)for(const [reference,names] of this.symlinkRefs)
      if(reference.startsWith(rel+'/'))for(const name of names)aliases.add(name);
    for(const alias of aliases)if(alias!==rel)this.record(alias,`${rel} changed`);
  }
  exportFiles(name) { const row=this.checks.get(name), out={};
    for(const file of row.files) out[file]=this.files.get(file);
    return out;
  }
}
