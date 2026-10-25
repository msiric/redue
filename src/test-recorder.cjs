// Preload for a recorded test run: NODE_OPTIONS="--require <this>" and
// REDUE_RUN_RECORD naming the run's guard file. Every Node process and worker
// thread of the run loads it. It never changes an answer, an output or the
// exit code. It appends, one JSON line at a time, what the guard needs
// (test-direct.mjs): content reads and writes of checkout files outside
// node_modules, lookups outside the checkout and the temporary directory,
// direct reads of environment variables, network use, and the child
// processes and threads it started. A line is written when its event happens,
// so a terminated thread loses nothing. A failure here only makes the record
// unusable.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const configFile=process.env.REDUE_RUN_RECORD;
if(configFile)install();
function install(){
  const original={openSync:fs.openSync,writeSync:fs.writeSync,readFileSync:fs.readFileSync,
    statSync:fs.statSync,readdirSync:fs.readdirSync,real:fs.realpathSync.native};
  const {threadId,isInternalThread}=require('node:worker_threads');
  let config,fd;
  try{config=JSON.parse(original.readFileSync(configFile,'utf8'));
    fd=original.openSync(path.join(config.dir,`${process.pid}-${threadId}.jsonl`),'a',0o600);}
  catch{return;}
  const emit=row=>{try{const line=Buffer.from(JSON.stringify(row)+'\n');
    for(let at=0;at<line.length;)at+=original.writeSync(fd,line,at,line.length-at);}catch{}};
  const failed=reason=>emit(['U',reason]);
  // The main script tells the guard which program a process runs (a package
  // manager may start helpers of its own).
  // Node's own threads (the ESM hooks thread) load it too; the guard does not
  // count them as threads the run started.
  emit(['H',{pid:process.pid,ppid:process.ppid,threadId,main:typeof process.argv[1]==='string'?process.argv[1]:null,
    ...(isInternalThread===true?{internal:true}:{})}]);
  // Every node_modules observed as installed: the root's and each workspace package's.
  const sep=path.sep,root=config.root,installed=Array.isArray(config.installed)?config.installed:[path.join(root,'node_modules')],
    tmp=config.tmp;
  const within=(file,dir)=>file===dir||file.startsWith(dir+sep);
  let installedReal=null;
  const realInstalled=()=>installedReal??=installed.map(dir=>realDir(dir));
  const digest=value=>createHash('sha256').update(value).digest('hex');
  // Directory realpaths, so a checkout path spelled through a link is still
  // classified as the checkout.
  const realDirs=new Map();
  function realDir(dir){
    let value=realDirs.get(dir);
    if(value===undefined){
      try{value=original.real(dir);}
      catch{const parent=path.dirname(dir);value=parent===dir?dir:path.join(realDir(parent),path.basename(dir));}
      realDirs.set(dir,value);
    }
    return value;
  }
  // The absolute path an argument names; undefined for a descriptor, whose
  // open was recorded; null for anything else.
  function located(file){
    // A descriptor or a FileHandle: its open was recorded.
    if(typeof file==='number'||file&&typeof file==='object'&&typeof file.fd==='number'&&typeof file.close==='function')return undefined;
    if(Buffer.isBuffer(file))file=file.toString();
    else if(file instanceof URL){if(file.protocol!=='file:')return null;file=require('node:url').fileURLToPath(file);}
    if(typeof file!=='string')return null;
    const full=path.resolve(file);
    return within(full,root)?full:path.join(realDir(path.dirname(full)),path.basename(full));
  }
  const seen=new Set();
  const once=row=>{const key=JSON.stringify(row);if(seen.has(key))return;seen.add(key);emit(row);};
  // One answer per question and process: asked first, answered once.
  const asked=new Set(),first=key=>{if(asked.has(key))return false;asked.add(key);return true;};
  const missing=error=>['ENOENT','ENOTDIR'].includes(error?.code)?null:'error';
  const kindOf=st=>st.isFile()?'f':st.isDirectory()?'d':'o';
  function statKind(full){try{return kindOf(original.statSync(full));}catch(e){return missing(e);}}
  // A stat-like answer as a kind, following links as fileExists does.
  const answerKind=(full,result)=>result===false?null:result&&typeof result.isFile==='function'&&!result.isSymbolicLink()?
    kindOf(result):statKind(full);
  // A listing as queryAnswer's `entries` computes it.
  function entries(full){
    try{return original.readdirSync(full,{withFileTypes:true})
      .map(entry=>[entry.name,entry.isDirectory()?'d':entry.isSymbolicLink()?'l':'f']).sort();}
    catch(e){return missing(e);}
  }
  // Paths this process created from nothing: files it truncated or created,
  // directories it made. Reading them back reads the run's own output.
  // Appends, renames and links keep earlier content, so they are not here.
  const produced=new Set();
  function isProduced(full){
    if(!produced.size)return false;
    for(let at=full;;at=path.dirname(at)){if(produced.has(at))return true;if(path.dirname(at)===at)return false;}
  }
  // Runner data and the toolchain's own files (a package manager's install
  // and logs) are not inputs.
  const runnerData=[...(config.runnerData||[]),...(Array.isArray(config.toolchain)?config.toolchain:[])];
  // Runner caches in the temporary directory, keyed by content: Jest's,
  // Yarn 1's compile cache, tsx's, jiti's, ts-node's and Babel's.
  const tmpCache=/^(?:jest_|v8-compile-cache|tsx-\d+$|jiti$|node-jiti$|ts-node|babel)/;
  const runnerCache=full=>tmp.some(dir=>within(full,dir)&&tmpCache.test(full.slice(dir.length+1).split(sep)[0]))||
    runnerData.some(dir=>within(full,dir));
  // A read of the process's own executable through /proc (detect-libc reads
  // its ELF header there), when the process runs the Node on PATH, which the
  // environment identifies by its file.
  const ownExePath=process.platform==='linux'?`/proc/${process.pid}/exe`:null;
  let ownExe;
  const ownExecutable=(role,full)=>{
    if(role!=='read'||full!==ownExePath)return false;
    if(ownExe===undefined)try{ownExe=typeof config.node==='string'&&original.real(full)===config.node;}catch{ownExe=false;}
    return ownExe;
  };
  // One filesystem access by its role: read (content), produce, touch (a write
  // that keeps earlier content), mkdir, mkdtemp, list, stat or realpath.
  function access(role,file,error=null,result=undefined,recursive=false){
    try{
      let full=located(file);
      if(full===undefined)return;
      if(full===null){if(!['produce','touch','mkdir'].includes(role))failed(`${role} of an unsupported path argument`);return;}
      // Installed files are observed by identity. A path under node_modules
      // that a link leads out of the installed tree (a workspace package's
      // link) is classified where it leads.
      if(installed.some(dir=>within(full,dir))){
        // A listing, lookup or realpath of the link itself follows it.
        const real=['list','stat','realpath'].includes(role)?realDir(full):path.join(realDir(path.dirname(full)),path.basename(full));
        // A write there is noted apart from checkout outputs: the guard does
        // not see reads of installed files, so only named tool files use it.
        if(real===full||realInstalled().some(dir=>within(real,dir))){
          if(role==='produce'&&!error&&within(full,root))once(['I',rel(full)]);
          return;
        }
        full=real;
      }
      if(role==='produce'){if(!error)produced.add(full);if(!error&&within(full,root))once(['P',rel(full)]);return;}
      // A directory the run created held nothing before it, so everything in
      // it is the run's output, whichever process reads it.
      if(role==='mkdir'||role==='mkdtemp'){
        const made=error?null:typeof result==='string'?located(result):role==='mkdir'&&!recursive?full:null;
        if(made){produced.add(made);once(['M',made]);}
        return;
      }
      if(role==='touch')return;
      // This recorder is REDUE's own file; stack-trace printers read it.
      if(full===__filename||isProduced(full))return;
      if(!first(role+'\0'+full))return;
      if(within(full,root)){
        if(role==='read')emit(['R',rel(full),!error]);
        else if(role==='stat')emit(['L',rel(full),error?missing(error):answerKind(full,result)]);
        else if(role==='list')emit(['D',rel(full),error?missing(error):entries(full)]);
        return;
      }
      if(runnerCache(full)||ownExecutable(role,full))return;
      // A small file read outside the checkout is kept by its content, as
      // queryAnswer's readFile hashes it, so status can ask again.
      if(role==='read'&&!error){
        let answer='present';
        try{if(original.statSync(full).size<=1024*1024)answer={content:digest(JSON.stringify(original.readFileSync(full,'utf8')))};}catch{}
        once(['O','read',full,answer]);return;
      }
      if(role==='read'||role==='list'){once(['O',role,full,error?missing(error):'present']);return;}
      if(role==='realpath'){once(['O','realpath',full,error?missing(error):String(result)]);return;}
      if(error){once(['O','stat',full,missing(error)]);return;}
      // A link outside the checkout is kept as its resolution.
      if(result?.isSymbolicLink?.()){let real=null;try{real=original.real(full);}catch(e){real=missing(e);}
        once(['O','realpath',full,real]);return;}
      once(['O','stat',full,answerKind(full,result)]);
    }catch{failed('recorder failure');}
  }
  const rel=full=>path.relative(root,full).split(sep).join('/');
  // Roles of an open by its flags.
  function openRoles(flags){
    if(typeof flags==='number'){
      const {O_RDONLY,O_RDWR,O_TRUNC,O_CREAT,O_EXCL}=fs.constants,access=flags&3;
      if(access===O_RDONLY)return ['read'];
      if(flags&O_TRUNC||flags&O_CREAT&&flags&O_EXCL)return ['produce'];
      return access===O_RDWR?['read','touch']:['touch'];
    }
    if(flags===undefined||flags===null)return ['read'];
    if(typeof flags!=='string')return ['read','touch'];
    if(flags.startsWith('r'))return flags.includes('+')?['read','touch']:['read'];
    if(flags.startsWith('w'))return ['produce'];
    return flags.includes('+')?['read','touch']:['touch'];
  }
  const flagOf=options=>typeof options==='object'&&options!==null?options.flag??options.flags:undefined;
  const opened=args=>openRoles(args[1]).map(role=>[role,args[0]]);
  const written=args=>openRoles(flagOf(args[2])??'w').map(role=>[role,args[0]]);
  const appended=args=>openRoles(flagOf(args[2])??'a').map(role=>[role,args[0]]);
  const copied=args=>[['read',args[0]],['produce',args[1]]];
  const moved=args=>[['touch',args[1]]];
  // Wraps a synchronous, callback or promise API without changing what it does.
  function wrap(holder,name,roles,style){
    const call=holder[name];if(typeof call!=='function')return;
    const pick=args=>typeof roles==='function'?roles(args):roles.map(role=>[role,args[0]]);
    const recursive=args=>name.startsWith('mkdir')&&Boolean(args[1]?.recursive);
    const note=(args,error,result)=>{for(const [role,file] of pick(args))access(role,file,error,result,recursive(args));};
    let wrapped;
    if(style==='sync')wrapped=function(...args){
      let result;try{result=call.apply(this,args);}catch(error){note(args,error);throw error;}
      note(args,null,result);return result;};
    else if(style==='callback')wrapped=function(...args){
      const at=args.findLastIndex(value=>typeof value==='function');
      if(at<0)return call.apply(this,args);
      const done=args[at],given=args.slice(0,at);
      args[at]=name==='exists'?function(value){note(given,null,value);return done.apply(this,arguments);}:
        function(error,result){note(given,error,result);return done.apply(this,arguments);};
      return call.apply(this,args);};
    else wrapped=function(...args){
      return call.apply(this,args).then(result=>{note(args,null,result);return result;},error=>{note(args,error);throw error;});};
    Object.defineProperties(wrapped,Object.getOwnPropertyDescriptors(call));
    holder[name]=wrapped;
  }
  const apis=[
    ['readFile',['read']],['open',opened],['readlink',['read']],['copyFile',copied],['cp',copied],
    ['writeFile',written],['appendFile',appended],['mkdir',['mkdir']],['mkdtemp',['mkdtemp']],
    ['rename',moved],['symlink',moved],['link',moved],['truncate',['touch']],
    ['stat',['stat']],['lstat',['stat']],['access',['stat']],['readdir',['list']],['opendir',['list']],
    ['realpath',['realpath']],
  ];
  for(const [name,roles] of apis){
    wrap(fs,name+'Sync',roles,'sync');wrap(fs,name,roles,'callback');wrap(fs.promises,name,roles,'promise');
  }
  wrap(fs,'existsSync',['stat'],'sync');wrap(fs,'exists',['stat'],'callback');
  wrap(fs.realpathSync,'native',['realpath'],'sync');wrap(fs.realpath,'native',['realpath'],'callback');
  for(const [name,roles] of [['createReadStream',()=>['read']],['createWriteStream',options=>openRoles(flagOf(options)??'w')]]){
    const call=fs[name];
    fs[name]=Object.defineProperties(function(file,options,...rest){
      for(const role of roles(options))access(role,file);return call.call(this,file,options,...rest);},
      Object.getOwnPropertyDescriptors(call));
  }
  // Environment: direct reads, compared with the caller's environment by
  // digest. A read that copies the whole environment (a spread, or a child
  // process's environment) is an enumeration, not a read of each name.
  const caller=config.env,envSeen=new Set();
  // A copy lists the keys, then asks for each key's descriptor and value right
  // after (a spread, Object.assign). Only that pair is not a read. Node's own
  // modules (child_process, worker_threads, util) list the keys, then read
  // every value; there each listed key's first read is part of the copy.
  let enumeration=null;
  function nodeInternal(){
    const prepare=Error.prepareStackTrace,holder={};
    try{Error.prepareStackTrace=(_,sites)=>sites;Error.captureStackTrace(holder,nodeInternal);
      for(const site of holder.stack){const file=site.getFileName?.();
        if(file&&file!==__filename)return file.startsWith('node:');}
      return false;}
    catch{return false;}
    finally{Error.prepareStackTrace=prepare;}
  }
  function envRead(source,key){
    if(typeof key!=='string'||envSeen.has(key))return;
    try{
      // The caller's value as a digest, or null when the caller left it unset.
      if(!Object.hasOwn(caller,key)){envSeen.add(key);emit(['E',key,null]);return;}
      const value=source[key];
      // A value the run set itself is not the caller's.
      if(typeof value!=='string'||digest(value)!==caller[key])return;
      envSeen.add(key);emit(['E',key,caller[key]]);
    }catch{failed('recorder failure');}
  }
  const targets=new WeakMap();
  const recordingEnv=source=>{const proxy=new Proxy(source,{
    ownKeys(t){const keys=Reflect.ownKeys(t),current={keys:new Set(keys),last:null,copy:nodeInternal()};enumeration=current;
      queueMicrotask(()=>{if(enumeration===current)enumeration=null;});return keys;},
    getOwnPropertyDescriptor(t,key){
      if(enumeration?.copy&&enumeration.keys.has(key)){}
      else if(enumeration?.keys.delete(key))enumeration.last=key;else{if(enumeration)enumeration.last=null;envRead(t,key);}
      return Reflect.getOwnPropertyDescriptor(t,key);},
    get(t,key){
      if(enumeration?.copy&&enumeration.keys.delete(key)){}
      else if(enumeration&&enumeration.last===key)enumeration.last=null;else{if(enumeration)enumeration.last=null;envRead(t,key);}
      return Reflect.get(t,key);},
    has(t,key){if(enumeration)enumeration.last=null;envRead(t,key);return Reflect.has(t,key);},
    set(t,key,value){t[key]=value;return true;},
  });targets.set(proxy,source);return proxy;};
  // PATH as a child receives it, read without recording a read.
  const pathOf=env=>{try{const value=Reflect.get(targets.get(env)??env??{},'PATH');return typeof value==='string'?value:null;}
    catch{return null;}};
  function wrapEnv(holder){
    let current=recordingEnv(holder.env);
    // Code that replaces the environment object keeps being recorded.
    try{Object.defineProperty(holder,'env',{configurable:true,enumerable:true,get(){return current;},
      set(value){current=value&&typeof value==='object'?recordingEnv(value):value;}});}
    catch{failed('environment not recordable');}
  }
  wrapEnv(process);
  // Jest 29 gives each test file a copy of process.env (jest-util's
  // createProcessObject). Test code reads that copy, so it is recorded too.
  const Module=require('node:module'),compile=Module.prototype._compile;
  Module.prototype._compile=function(content,filename,...rest){
    const result=compile.call(this,content,filename,...rest);
    try{if(typeof filename==='string'&&filename.split(sep).join('/').endsWith('/jest-util/build/createProcessObject.js')&&
      typeof this.exports?.default==='function'){
      const create=this.exports.default;
      this.exports.default=function(...args){const created=create.apply(this,args);
        try{wrapEnv(created);}catch{failed('environment not recordable');}
        return created;};
    }}catch{failed('recorder failure');}
    return result;
  };
  // Network: connections other than loopback or local sockets, and DNS
  // questions about anything but localhost.
  const loopback=host=>{const value=String(host).replace(/^\[|\]$/g,'').toLowerCase();
    return value==='localhost'||value.endsWith('.localhost')||/^127\./.test(value)||value==='::1'||
      value==='0.0.0.0'||value==='::'||/^::ffff:127\./.test(value);};
  const localSocket=file=>{const full=located(file);
    return typeof full==='string'&&(within(full,root)||tmp.some(dir=>within(full,dir)));};
  const net=require('node:net'),connect=net.Socket.prototype.connect;
  net.Socket.prototype.connect=function(...args){
    try{
      let options=args[0];
      if(Array.isArray(options))options=options[0];
      else if(typeof options==='number'||typeof options==='string'&&/^\d+$/.test(options))
        options={port:options,host:typeof args[1]==='string'?args[1]:undefined};
      else if(typeof options==='string')options={path:options};
      if(options?.path!=null){if(!localSocket(options.path))emit(['N',`socket ${String(options.path)}`]);}
      else if(options&&!loopback(options.host??'localhost'))emit(['N',`${options.host}:${options.port}`]);
    }catch{failed('recorder failure');}
    return connect.apply(this,args);
  };
  const dgram=require('node:dgram');
  for(const name of ['send','connect']){
    const call=dgram.Socket.prototype[name];
    dgram.Socket.prototype[name]=function(...args){
      try{const host=args.find((value,i)=>i>0&&typeof value==='string');
        if(host===undefined?name==='connect':!loopback(host))emit(['N',`udp ${host??'default address'}`]);}
      catch{failed('recorder failure');}
      return call.apply(this,args);};
  }
  const dns=require('node:dns');
  const questions=['lookup','lookupService','resolve','resolve4','resolve6','resolveAny','resolveCaa','resolveCname',
    'resolveMx','resolveNaptr','resolveNs','resolvePtr','resolveSoa','resolveSrv','resolveTxt','reverse'];
  for(const holder of [dns,dns.promises,dns.Resolver.prototype,dns.promises.Resolver.prototype])
    for(const name of questions){
      const call=holder[name];if(typeof call!=='function')continue;
      holder[name]=function(host,...rest){
        try{if(!loopback(host))emit(['N',`dns ${String(host)}`]);}catch{failed('recorder failure');}
        return call.call(this,host,...rest);};
    }
  // Child processes and threads must load this recorder too; the guard checks
  // for their headers. Children of execSync/execFileSync report no PID, so
  // they are counted instead. Each row names the program and its arguments
  // as Node's spawn normalizes them (a `shell` option runs /bin/sh -c and the
  // joined command), the working directory and PATH, so the guard can tell
  // which program a name ran and read what a shell was asked to run.
  // Arguments over 64 KB in all are left out (null).
  const argsOf=args=>{try{const list=Array.isArray(args)?args.map(String):[];
    return list.reduce((n,arg)=>n+arg.length,0)>65536?null:list;}catch{return null;}};
  const normalized=(file,args,options,shell)=>{
    if(!Array.isArray(args)){options=args;args=[];}
    shell=options?.shell??shell;
    if(!shell)return [String(file),argsOf(args)];
    return [typeof shell==='string'?shell:'/bin/sh',['-c',[file,...args].join(' ')]];
  };
  // What the child's environment says: whether NODE_OPTIONS still loads this
  // recorder for the same run (npm's and pnpm's `node-options` setting
  // replaces it), and whether BASH_ENV is set (bash -c sources it).
  const envFacts=lookupVar=>{
    try{const options=lookupVar('NODE_OPTIONS');
      return {preload:typeof options==='string'&&options.includes(__filename)&&lookupVar('REDUE_RUN_RECORD')===configFile,
        bashEnv:Boolean(lookupVar('BASH_ENV'))};}
    catch{return {preload:false,bashEnv:true};}
  };
  const envOf=env=>envFacts(name=>{const value=Reflect.get(targets.get(env)??env??{},name);return typeof value==='string'?value:undefined;});
  const pairsOf=pairs=>envFacts(name=>{const pair=(pairs||[]).find(item=>typeof item==='string'&&item.startsWith(name+'='));
    return pair?pair.slice(name.length+1):undefined;});
  const where=options=>[path.resolve(typeof options?.cwd==='string'?options.cwd:options?.cwd instanceof URL?
    require('node:url').fileURLToPath(options.cwd):'.'),pathOf(options?.env??process.env),envOf(options?.env??process.env)];
  const optionsOf=(args,options)=>Array.isArray(args)?options:args;
  // A #! script the child runs, as it is now: Yarn writes its bin wrappers
  // into a temporary directory and removes them after the run.
  function scriptOf(file,cwd,searchPath){
    try{
      const candidates=file.includes(sep)?[path.resolve(cwd,file)]:String(searchPath??'').split(path.delimiter).map(dir=>path.join(path.resolve(cwd,dir||'.'),file));
      for(const candidate of candidates){
        let st;try{st=original.statSync(candidate);}catch{continue;}
        if(!st.isFile()||!(st.mode&0o111))continue;
        if(st.size>16384)return null;
        const text=original.readFileSync(candidate,'utf8');
        return text.startsWith('#!')?{file:original.real(candidate),text}:null;
      }
    }catch{}
    return null;
  }
  const childProcess=require('node:child_process'),spawn=childProcess.ChildProcess.prototype.spawn;
  childProcess.ChildProcess.prototype.spawn=function(options){
    const result=spawn.call(this,options);
    try{if(this.pid){const pair=(options?.envPairs||[]).find(item=>typeof item==='string'&&item.startsWith('PATH='));
      emit(['C',this.pid,String(options?.file),argsOf(options?.args?.slice(1)),where(options)[0],pair?pair.slice(5):null,
        pairsOf(options?.envPairs),scriptOf(String(options?.file),where(options)[0],pair?pair.slice(5):null)]);}}
    catch{failed('recorder failure');}
    return result;
  };
  const spawnSync=childProcess.spawnSync;
  childProcess.spawnSync=function(file,...rest){
    const result=spawnSync.call(this,file,...rest);
    try{if(result?.pid)emit(['C',result.pid,...normalized(file,rest[0],rest[1]),...where(optionsOf(rest[0],rest[1]))]);}
    catch{failed('recorder failure');}
    return result;
  };
  for(const name of ['execSync','execFileSync']){
    const call=childProcess[name];
    childProcess[name]=function(file,...rest){
      let started=true;
      try{return call.call(this,file,...rest);}
      catch(error){if(error?.code==='ENOENT'&&!error.pid)started=false;throw error;}
      finally{if(started)try{emit(['S',...name==='execSync'?normalized(file,[],rest[0],true):normalized(file,rest[0],rest[1]),
        ...where(name==='execSync'?rest[0]:optionsOf(rest[0],rest[1]))]);}
        catch{failed('recorder failure');}}
    };
  }
  // process.execve replaces this process with another program, under the
  // same PID: the row comes first, since a successful call does not return
  // (a failed one aborts the process). Node refuses it in a worker and for
  // bad arguments by throwing; the row is then withdrawn. The kernel does not
  // search PATH, so the file is taken from the working directory. A Node
  // program that replaces this one loads the recorder again and appends a
  // header to the same record.
  if(typeof process.execve==='function'){const execve=process.execve;
    process.execve=function(file,args,env,...rest){
      let row=false;
      if(threadId===0)try{const options={env:env??process.env},full=path.resolve(String(file)),where_=where(options);
        emit(['X',full,argsOf(Array.isArray(args)?args.slice(1):[]),...where_,scriptOf(full,where_[0],null)]);row=true;}
      catch{failed('recorder failure');}
      try{return execve.call(this,file,args,env,...rest);}
      catch(error){if(row)emit(['Y']);throw error;}};}
  // Bindings that read files, use the network or start programs out of the
  // recorder's sight. Only bindings without such access are allowed.
  const harmlessBindings=new Set(['async_wrap','buffer','config','constants','contextify','crypto','http_parser','icu',
    'js_stream','natives','os','signal_wrap','stream_wrap','tty_wrap','url','util','uv','v8','zlib']);
  if(typeof process.binding==='function'){const binding=process.binding;
    process.binding=function(name,...rest){
      const result=binding.call(this,name,...rest);
      if(!harmlessBindings.has(name))failed(`process.binding('${String(name)}') reads files, uses the network or starts programs out of REDUE's sight`);
      return result;};}
  // Node's internal modules include child_process's unhooked internals.
  if(process.execArgv.some(arg=>/^--expose[-_]internals(=|$)/.test(arg)))failed('a Node process exposed its internal modules (--expose-internals)');
  const workers=require('node:worker_threads'),Worker=workers.Worker;
  workers.Worker=class extends Worker{
    constructor(...args){super(...args);try{emit(['T',this.threadId]);}catch{failed('recorder failure');}}
  };
  // Node reads an environment file natively; this is the one JavaScript entry to it.
  if(typeof process.loadEnvFile==='function'){const load=process.loadEnvFile;
    process.loadEnvFile=function(file='.env',...rest){access('read',file);return load.call(this,file,...rest);};}
  try{Module.syncBuiltinESMExports();}catch{failed('recorder failure');}
}
