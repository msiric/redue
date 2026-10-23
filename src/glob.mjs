import picomatch from 'picomatch';

// These are the exact delegates used by micromatch 4.0.8 matcher/isMatch,
// with the same pinned picomatch 2.3.2. REDUE does not use brace expansion;
// importing the smaller dependency avoids shipping its unused vulnerable parser.
export default {
  matcher(pattern,options){return picomatch(pattern,options);},
  isMatch(file,patterns,options){return picomatch(patterns,options)(file);}
};
// A matcher for a pattern list with `!` exclusions: a path matches when a
// positive pattern does and no excluded one does. A plain list match would
// take any `!` pattern as matching everything else.
export function patternMatcher(patterns){
  const positive=patterns.filter(p=>!p.startsWith('!')).map(p=>picomatch(p,{dot:true}));
  const negative=patterns.filter(p=>p.startsWith('!')).map(p=>picomatch(p.slice(1),{dot:true}));
  return file=>positive.some(fn=>fn(file))&&!negative.some(fn=>fn(file));
}
