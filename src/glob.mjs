import micromatch from 'micromatch';

// braces <=3.0.3 has unbounded recursive AST walkers (GHSA-vfj7-8cjw-p6xm).
// Reject unsupported pattern complexity before any library parsing. Never
// silently truncate a pattern or omit an input to make matching succeed.
export function validatePatterns(patterns) {
  for(const pattern of Array.isArray(patterns)?patterns:[patterns]) {
    if(typeof pattern!=='string'||pattern.length>32768)
      throw Error('input glob is unsupported: use a string of at most 32768 characters');
    let braces=0,parens=0;
    for(const char of pattern){
      if(char==='{')braces++;else if(char==='}')braces=Math.max(0,braces-1);
      if(char==='(')parens++;else if(char===')')parens=Math.max(0,parens-1);
      if(braces>64||parens>64)
        throw Error('input glob nesting exceeds the supported depth of 64; simplify the declaration');
    }
  }
}
export default {
  matcher(pattern,options){validatePatterns(pattern);return micromatch.matcher(pattern,options);},
  isMatch(file,patterns,options){validatePatterns(patterns);return micromatch.isMatch(file,patterns,options);}
};
