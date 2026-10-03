// Resolve the destination, including linked parent directories, before any
// state creation or removal. A watched root is readable, never state-owned.
import fs from 'node:fs';
import path from 'node:path';
import {withinPath as within} from './path-identity.mjs';

export function resolvedDestination(file) {
  let current=path.resolve(file),rest=[];
  for(;;) {
    try {
      const canonical=fs.realpathSync(current);
      return path.join(canonical,...rest);
    } catch(e) {
      if(e.code!=='ENOENT')throw e;
      const parent=path.dirname(current);
      if(parent===current)throw Error('state destination cannot be resolved');
      rest.unshift(path.basename(current));current=parent;
    }
  }
}

export function assertOwnedStatePlacement(config) {
  const state=path.resolve(config.state),resolved=resolvedDestination(state);
  const observed=[config.root,...(config.checks||[]).flatMap(check=>
    check.allowedExternalRoots||[])].map(resolvedDestination);
  for(const boundary of observed)if(within(resolved,boundary)||within(boundary,resolved))
    throw Error('vstate state overlaps an observed checkout or external root');
  try{if(fs.lstatSync(state).isSymbolicLink())
    throw Error('vstate state directory must not be a symlink');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  return {state,resolved};
}
