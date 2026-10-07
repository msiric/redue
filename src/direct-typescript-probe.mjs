#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {directProject,directInterpretation} from './direct-typescript.mjs';
import {typeScriptInputFacts} from './typescript-input-facts.mjs';
import {contextOnly,probeResult} from './probe-result.mjs';
import {realObservedPath} from './path-identity.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
try{
  const [rootArg,script]=process.argv.slice(2),root=realObservedPath(rootArg);
  // Verify all installed implementation bytes before loading compiler API/code,
  // including the optimized context-only path. A version label is insufficient.
  const compiler=directProject(root,script);
  const context={interpretation:directInterpretation,compiler:compiler.digest,
    entry:compiler.entry,node:[realObservedPath(process.execPath),process.version]};
  const contextHash=hash(context);
  if(!contextOnly(contextHash)){
    const {queries,...inputs}=typeScriptInputFacts(root,compiler.tsRoot,compiler.entry);
    probeResult(hash({root,script,...inputs,...context}),contextHash,queries);
  }
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:'typescript-contract-unavailable'}`);process.exitCode=2;}
