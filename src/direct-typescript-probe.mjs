#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {directProject,directInterpretation} from './direct-typescript.mjs';
import {typeScriptInputFacts} from './typescript-input-facts.mjs';
import {contextOnly,probeResult} from './probe-result.mjs';
import {realObservedPath} from './path-identity.mjs';
import path from 'node:path';
import {queriesMatch} from './typescript-list.mjs';
import {timing,mark} from './decision-profile.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
try{
  const [rootArg,script]=process.argv.slice(2),root=realObservedPath(rootArg);
  // Verify all installed implementation bytes before loading compiler API/code,
  // including the optimized context-only path. A version label is insufficient.
  const implementationStarted=performance.now();
  const compiler=directProject(root,script);
  timing('direct_probe.implementation',implementationStarted,{version:compiler.version});
  const context={interpretation:directInterpretation,compiler:compiler.digest,
    entry:compiler.entry,node:[realObservedPath(process.execPath),process.version]};
  const contextHash=hash(context);
  if(process.argv.includes('--redue-validate-queries')){
    // Internal, process-local discovery certificate; never a verification receipt.
    // Verify the current implementation above before queryAnswer can load its API.
    const started=performance.now();mark('certificate.input_start');
    // A synchronous fd-0 read can stall with spawnSync's piped input on macOS
    // Node 22.13.0. Drain the stream without blocking its input delivery. The
    // parent's existing deadline and the same size limit remain authoritative.
    const chunks=[];let bytes=0;
    for await(const chunk of process.stdin){
      bytes+=chunk.length;if(bytes>8*1024*1024)throw Error('certificate too large');
      chunks.push(chunk);
    }
    const raw=Buffer.concat(chunks).toString('utf8');mark('certificate.input_complete',{bytes});
    const certificate=JSON.parse(raw),kinds=new Set(['readDirectory','readFile',
      'fileExists','directoryExists','realpath','directories','entries']);
    if(certificate.schema!==1||certificate.context!==contextHash||
      !Array.isArray(certificate.queries)||!certificate.queries.length||
      certificate.queries.some(q=>!Array.isArray(q)||q.length<3||q.length>4||
        !kinds.has(q[0])||typeof q[1]!=='string'||!path.isAbsolute(q[1])||
        q[0]==='readDirectory'&&(q[3]?.tsRoot!==compiler.tsRoot||!Array.isArray(q[3]?.args)||
          q[3]?.argsVersion!==1||!Array.isArray(q[3]?.undefinedArguments)||
          q[3].undefinedArguments.some(i=>!Number.isInteger(i)||i<0||i>=q[3].args.length))))
      throw Error('certificate unavailable');
    mark('certificate.queries_start',{queries:certificate.queries.length});
    const matched=queriesMatch(certificate.queries);
    mark('certificate.queries_complete',{matched});
    timing('direct_probe.query_validation',started,{queries:certificate.queries.length,matched:matched?1:0});
    if(!matched)throw Error('compiler queries changed');
    process.stdout.write(contextHash);
    process.exit(0);
  }
  if(!contextOnly(contextHash)){
    const {queries,...inputs}=typeScriptInputFacts(root,compiler.tsRoot,compiler.entry);
    probeResult(hash({root,script,...inputs,...context}),contextHash,queries);
  }
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:'typescript-contract-unavailable'}`);process.exitCode=2;}
