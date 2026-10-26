// Whether a check observes an installed file: the file is in the checkout
// and matched by the check's patterns, and a link it goes through that leads
// elsewhere in the checkout leads to a matched path too. A recorded run's
// hard-linked installed files are accepted only when every link is one the
// check observes, so a pattern that leaves a folder out (a runner cache in
// node_modules) cannot hide one.
import fs from 'node:fs';
import path from 'node:path';
import {observedRelative} from './path-identity.mjs';

// `matches(rel)`: the check's pattern matcher over checkout-relative paths.
// A link that leads outside the checkout is the plan's to resolve (a
// permitted root or a refusal).
export function observedBy(root,matches){
  let realRoot=root;try{realRoot=fs.realpathSync(root);}catch{}
  return file=>{
    const logical=observedRelative(root,path.resolve(file));
    if(logical===null||!matches(logical))return false;
    let real;try{real=fs.realpathSync(file);}catch{return false;}
    const physical=observedRelative(realRoot,real);
    return physical===null||physical===logical||matches(physical);
  };
}
