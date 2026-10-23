#!/usr/bin/env node
import {directProject,directInterpretation,directContextHash,directProbeOutput} from './direct-typescript.mjs';
import {typeScriptInputFacts} from './typescript-input-facts.mjs';
import {contextOnly,probeResult} from './probe-result.mjs';
import {realObservedPath} from './path-identity.mjs';
import {timing} from './decision-profile.mjs';
import {runArgv,runFromArgv} from './typescript-invocation.mjs';
try{
  const [rootArg,...rest]=process.argv.slice(2).filter(value=>!value.startsWith('--redue-')),root=realObservedPath(rootArg);
  const run=runFromArgv(rest),script=runArgv(run).join(' ');
  // Verify all installed implementation bytes before loading compiler API/code,
  // including the optimized context-only path. A version label is insufficient.
  const implementationStarted=performance.now();
  const compiler=directProject(root,run);
  timing('direct_probe.implementation',implementationStarted,{version:compiler.version});
  const context={interpretation:directInterpretation,compiler:compiler.digest,
    entry:compiler.entry,node:[realObservedPath(process.execPath),process.version]};
  const contextHash=directContextHash(compiler,context.node);
  if(!contextOnly(contextHash)){
    const {queries,configs,files,buildInfo}=typeScriptInputFacts(root,compiler.tsRoot,compiler.entry,compiler.config);
    const layout={root,script,configs,files,context,...(buildInfo?{buildInfo}:{})};
    probeResult(directProbeOutput(layout),contextHash,queries,layout);
  }
}catch(e){console.error(`VSTATE_REASON:${e.code&&/^[a-z-]+$/.test(e.code)?e.code:'typescript-contract-unavailable'}`);process.exitCode=2;}
