import picomatch from 'picomatch';

// These are the exact delegates used by micromatch 4.0.8 matcher/isMatch,
// with the same pinned picomatch 2.3.2. REDUE does not use brace expansion;
// importing the smaller dependency avoids shipping its unused vulnerable parser.
export default {
  matcher(pattern,options){return picomatch(pattern,options);},
  isMatch(file,patterns,options){return picomatch(patterns,options)(file);}
};
