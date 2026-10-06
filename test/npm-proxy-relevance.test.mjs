// Source-review counterexample, not a qualifying contract or agent experiment.
// The fixture owns its HOME/cache, project and HTTP endpoints. It never changes
// the caller's real proxy, npm installation, agent policy or shared cache.
import test from 'node:test';
import {directCompiler} from '../src/direct-typescript.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {findExecutable} from '../src/executable-lookup.mjs';

const require=createRequire(import.meta.url),npm=findExecutable('npm');
const npmRoot=npm&&(process.platform==='win32'?
  path.join(path.dirname(npm),'node_modules','npm'):path.dirname(path.dirname(npm)));
let npmVersion;try{npmVersion=JSON.parse(fs.readFileSync(path.join(npmRoot,'package.json'))).version;}catch{}
const put=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};

test('npm 10.9.2 proxy port is not outcome-equivalent when the update notifier runs',
  {skip:npmVersion!=='10.9.2',timeout:60000},async t=>{
    const base=fs.mkdtempSync(path.join(os.tmpdir(),'redue-notifier-relevance-')),
      root=path.join(base,'project'),home=path.join(base,'home'),local=path.join(base,'local'),
      cache=process.platform==='win32'?path.join(local,'npm-cache'):path.join(home,'.npm');
    t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
    put(path.join(root,'package.json'),JSON.stringify({name:'redue-notifier-fixture',
      version:'1.0.0',scripts:{typecheck:'tsc --noEmit'}}));
    put(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true,
      skipLibCheck:true},include:['src/**/*.ts']}));
    put(path.join(root,'src/index.ts'),'export const value: number = 1;\n');
    // Registry is identical in A and B. Only the proxy port selects a different
    // controlled response. No external server or live proxy is contacted.
    put(path.join(root,'.npmrc'),'registry=http://redue-registry.invalid/\n');
    fs.mkdirSync(home);fs.mkdirSync(path.join(root,'node_modules','.bin'),{recursive:true});
    fs.cpSync(path.dirname(require.resolve('typescript/package.json')),
      path.join(root,'node_modules','typescript'),{recursive:true});
    if(process.platform==='win32')fs.copyFileSync(path.resolve('node_modules/.bin/tsc.cmd'),
      path.join(root,'node_modules','.bin','tsc.cmd'));
    else fs.symlinkSync('../typescript/bin/tsc',path.join(root,'node_modules','.bin','tsc'));

    // Explicit test isolation. CI=false enables the same notifier path observed
    // in the real Codex context even when this regression runs on a CI worker.
    // Default npm cache paths resolve into owned HOME/LOCALAPPDATA. No cache
    // override is added to npm's admitted configuration.
    const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>
      !/proxy/i.test(key)&&!/^npm_/i.test(key)&&!/^node_/i.test(key)));
    Object.assign(env,{HOME:home,USERPROFILE:home,LOCALAPPDATA:local,CI:'false'});
    // Source-level companion: exercise actual pacote + notifier with pacote's
    // supported packument cache. npm's full CLI does not print the underlying
    // rejection text reliably, so establish that mechanism independently.
    const component=spawnSync(process.execPath,['-e',`
      const fs=require('node:fs'),path=require('node:path');
      const notifier=require(path.join(process.argv[1],'lib/cli/update-notifier.js'));
      (async()=>{const rows=[];
        for(const [kind,version] of [['valid','10.9.2'],['missing',undefined],['invalid','NOT-SEMVER']]){
          const folder=path.join(process.argv[2],kind);fs.mkdirSync(folder,{recursive:true});
          const manifest={name:'npm',...(version===undefined?{}:{version})};
          const packument={name:'npm','dist-tags':{latest:'10.9.2'},versions:{'10.9.2':manifest}};
          const packumentCache=new Map([['corgi:https://registry.npmjs.org/npm',packument]]);
          const npm={version:'10.9.2',command:'run',argv:['typecheck'],config:{get:()=>true},
            flatOptions:{cache:path.join(folder,'_cacache'),packumentCache,registry:'https://registry.npmjs.org/'}};
          try{await notifier(npm);rows.push({kind,error:null});}
          catch(error){rows.push({kind,error:error.message});}
        }console.log(JSON.stringify(rows));
      })().catch(()=>process.exitCode=1);
    `,npmRoot,path.join(base,'component')],{cwd:root,env,encoding:'utf8',timeout:10000});
    assert.equal(component.status,0,component.stderr);
    const components=JSON.parse(component.stdout);
    assert.equal(components[0].error,null);
    assert.match(components[1].error,/Invalid version\. Must be a string/);
    assert.match(components[2].error,/Invalid Version: NOT-SEMVER/);
    const identity=fs.readFileSync(path.join(root,'package.json'));
    let response='valid',requests=0;
    const handler=mode=>(req,res)=>{
      requests++;assert.equal(req.url,'http://redue-registry.invalid/npm');
      const selected=mode==='valid'?'valid':response;
      if(selected==='http-error'){res.statusCode=404;res.end('{}');return;}
      res.setHeader('content-type','application/json');
      res.end(JSON.stringify({name:'npm','dist-tags':{latest:'10.9.2'},
        versions:{'10.9.2':{name:'npm',...(selected==='missing-version'?{}:
          {version:selected==='invalid-version'?'NOT-SEMVER':'10.9.2'})}}}));
    };
    const servers=[http.createServer(handler('valid')),http.createServer(handler('other'))];
    t.after(async()=>{for(const server of servers)await new Promise(resolve=>{
      server.closeAllConnections();server.close(resolve);});});
    for(const server of servers)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    assert.notEqual(servers[0].address().port,servers[1].address().port);

    async function run(mode,{notifier=true,direct=false}={}){
      response=mode;requests=0;
      // A fresh owned cache exposes the notifier rather than letting a prior
      // timestamp accidentally certify the network branch as irrelevant.
      fs.rmSync(cache,{recursive:true,force:true});
      const port=servers[mode==='valid'?0:1].address().port;
      const started=performance.now(),child=spawn(process.execPath,direct?[directCompiler(root).entry,'--noEmit']:[path.join(npmRoot,'bin','npm-cli.js'),'run','typecheck'],
        {cwd:root,env:{...env,npm_config_proxy:`http://127.0.0.1:${port}`,
          ...(!notifier?{npm_config_update_notifier:'false'}:{})},stdio:['ignore','pipe','pipe']});
      let stdout='',stderr='';child.stdout.on('data',v=>stdout+=v);child.stderr.on('data',v=>stderr+=v);
      const timer=setTimeout(()=>child.kill(),10000);
      const [exit,signal]=await new Promise((resolve,reject)=>{
        child.once('error',reject);child.once('close',(code,sig)=>resolve([code,sig]));
      }).finally(()=>clearTimeout(timer));
      assert.equal(signal,null);assert.deepEqual(fs.readFileSync(path.join(root,'package.json')),identity);
      t.diagnostic(JSON.stringify({response:mode,notifier,exit,requests,
        durationMs:Math.round(performance.now()-started)}));
      return {exit,stdout,stderr,requests,port};
    }
    // Real unmodified npm and real TypeScript; no mocked notifier or sleeps.
    for(let repeat=0;repeat<2;repeat++){
      const a=await run('valid'),b=await run('missing-version');
      assert.equal(a.exit,0,a.stderr);assert.match(a.stdout,/> tsc --noEmit/);
      assert.equal(b.exit,1,b.stderr);assert(a.requests>0&&b.requests>0);
      assert.notEqual(a.port,b.port);
    }
    for(const response of ['valid','missing-version','invalid-version']){
      const direct=await run(response,{direct:true});assert.equal(direct.exit,0,direct.stderr);assert.equal(direct.requests,0);
    }
    const invalid=await run('invalid-version');assert.equal(invalid.exit,1,invalid.stderr);
    const unavailable=await run('http-error');assert.equal(unavailable.exit,0,unavailable.stderr);
    const off=await run('missing-version',{notifier:false});
    assert.equal(off.exit,0,off.stderr);assert.equal(off.requests,0);
    // This last negative control does not authorize changing a real invocation
    // or classify arbitrary implementations by their claimed version string.
  });
