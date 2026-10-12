// Finite resource envelope for full portable runtime/input inspection only.
// A deadline never establishes facts or permits reuse. Expiry withholds them.
export const portableProbeDeadlineMs=30000;
export const portableCacheDeadlineMs=25000;
export const portableDecisionDeadlineMs=45000;
const expired=()=>{throw Object.assign(Error('Portable inspection budget exhausted'),{code:'PORTABLE_PROBE_TIMEOUT'});};
export function createPortableBudget(now=()=>performance.now()){
  const started=now();let previous=started,exhausted=false;
  if(!Number.isFinite(started)||started<0)expired();
  return Object.freeze({remaining(){
    const current=now();
    if(exhausted||!Number.isFinite(current)||current<previous){exhausted=true;expired();}
    previous=current;const remaining=Math.floor(portableProbeDeadlineMs-(current-started));
    if(remaining<1){exhausted=true;expired();}return remaining;
  }});
}
