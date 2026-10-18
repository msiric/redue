// Preload for a direct compiler run: node --require <this> <tsc> ... with a
// pipe on fd 3. Records the answers the compiler received from node:fs, in the
// terms of queryAnswer, and writes them to fd 3 at exit. It never changes an
// answer, an output or the exit code; any failure only makes the record unusable.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const original={readFileSync:fs.readFileSync,statSync:fs.statSync,readdirSync:fs.readdirSync,
  realpathSync:fs.realpathSync,native:fs.realpathSync.native,writeSync:fs.writeSync,openSync:fs.openSync};
const real=file=>(process.platform==='win32'?original.native:original.realpathSync)(file);
const facts=new Map(),compilerReads=new Set();let unsupported=null,conflict=null,main=null,compilerRoot=null;
try{main=real(process.argv[1]);compilerRoot=path.dirname(path.dirname(main));}
catch{unsupported='main module unavailable';}
const kindOf=st=>st.isFile()?'f':st.isDirectory()?'d':'o';
const missing=error=>['ENOENT','ENOTDIR'].includes(error?.code);
// The compiler tree (lib/<entry>/../..) is covered by the daemon's toolchain
// identity, not by this record. tsc also stats a case-swapped copy of its own path.
const inCompiler=full=>full===compilerRoot||full.startsWith(compilerRoot+path.sep)||
  full!==main&&full.toLowerCase()===main.toLowerCase();
function observe(kind,call,answer) {
  return function(file,...rest){
    let value,full=null;
    // Compiler-tree reads are named only: which lib files a program loads.
    try{if(typeof file==='string'){full=path.resolve(file);
      if(inCompiler(full)){if(kind==='read')compilerReads.add(full);full=null;}}
      else unsupported??=`${kind} of a non-string path`;}
    catch{unsupported??='recorder failure';}
    if(full===null)return call.call(this,file,...rest);
    let recorded;
    try{value=call.call(this,file,...rest);}
    catch(error){recorded=missing(error)?null:{error:error?.code||'error'};note(kind,full,recorded);throw error;}
    try{recorded=answer(value,file);}catch{unsupported??='recorder failure';return value;}
    note(kind,full,recorded);
    return value;
  };
}
function note(kind,full,answer) {
  try{const key=kind+'\0'+full,value=JSON.stringify(answer),seen=facts.get(key);
    if(seen===undefined)facts.set(key,value);else if(seen!==value)conflict??=`${kind} ${full}`;}
  catch{unsupported??='recorder failure';}
}
fs.readFileSync=observe('read',original.readFileSync,value=>
  createHash('sha256').update(JSON.stringify(typeof value==='string'?value:value.toString('utf8'))).digest('hex'));
fs.statSync=observe('stat',original.statSync,value=>value?kindOf(value):null);
fs.readdirSync=observe('readdir',original.readdirSync,(value,dir)=>value.map(entry=>{
  if(typeof entry==='string')return [entry,'?'];
  if(!entry.isSymbolicLink())return [entry.name,kindOf(entry)];
  let target=null;try{target=kindOf(original.statSync(path.join(dir,entry.name)));}catch{}
  return [entry.name,'l',target];
}).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0));
const realpath=observe('realpath',original.realpathSync,value=>value);
realpath.native=observe('realpath',original.native,value=>value);
fs.realpathSync=realpath;
// readFileSync opens through fs.openSync; only a writable open is a write.
fs.openSync=function(file,flags,...rest){
  if(!(flags===undefined||flags==='r'||flags==='rs'||flags===fs.constants.O_RDONLY))unsupported??='openSync';
  return original.openSync.call(this,file,flags,...rest);
};
// Writes, and reads this record cannot answer for, make it unusable. readSync
// and fstatSync stay open: readFileSync reads through them.
for(const name of ['writeFileSync','appendFileSync','mkdirSync','unlinkSync','utimesSync',
  'renameSync','rmSync','watch','watchFile','existsSync','lstatSync','accessSync','opendirSync',
  'readlinkSync','readFile','stat','lstat','readdir','realpath','access','exists','open','opendir',
  'readlink','createReadStream']){
  const call=fs[name];
  fs[name]=Object.assign(function(...args){unsupported??=name;return call.apply(this,args);},call);
}
for(const name of ['readFile','stat','lstat','readdir','realpath','access','open','opendir','readlink']){
  const call=fs.promises[name];
  fs.promises[name]=function(...args){unsupported??=`promises.${name}`;return call.apply(this,args);};
}
process.on('exit',()=>{
  try{
    const buffer=Buffer.from(JSON.stringify({schema:1,node:[real(process.execPath),process.version],main,
      unsupported,conflict,compilerReads:[...compilerReads],facts:[...facts].map(([key,value])=>{const at=key.indexOf('\0');
        return [key.slice(0,at),key.slice(at+1),JSON.parse(value)];})}));
    for(let at=0;at<buffer.length;)at+=original.writeSync(3,buffer,at,buffer.length-at);
  }catch{}
});
