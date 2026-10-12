// Data-only adapter for one fresh, locally verified sealed-probe process.
// No compiler is loaded or program traversed here. The trusted caller must first
// establish the actual staged cwd/restricted filesystem view and install scoped
// journaling BEFORE the first verified TS require (cached native functions and
// Node loader bypasses are separate boundaries). Whole package/manifest/runtime
// binding, API-vs-CLI completeness and graph closure validation remain external.
// Pass these methods into existing compilerProgramFiles; do not create a second
// configuration/program graph. No imported object/callback is an authority input.
export const SEALED_FORWARDING_CONTRACT=Object.freeze({schema:1,
  interpretation:'redue-sealed-typescript-forwarding@1',
  implementationVerified:false,queryCompleteness:'NOT_ESTABLISHED',
  namespaceVerified:false,sealed:false,reuseEligible:false});
const names=Object.freeze(['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath']);
const fail=code=>{throw Object.assign(Error(code),{code});};
const data=(object,key)=>{
  const descriptor=Object.getOwnPropertyDescriptor(object,key);
  if(!descriptor||!Object.hasOwn(descriptor,'value'))fail('SEALED_FORWARDING_DESCRIPTOR');
  return descriptor.value;
};
const synchronous=value=>typeof value==='function'&&Object.getPrototypeOf(value)===Function.prototype;
export function createSealedTypeScriptForwarding(options){
  if(!options||typeof options!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(options))||
      Reflect.ownKeys(options).length!==2||!Object.hasOwn(options,'system')||!Object.hasOwn(options,'journal'))fail('SEALED_FORWARDING_OPTIONS');
  const system=data(options,'system'),journal=data(options,'journal');
  if(!system||typeof system!=='object'||!journal||typeof journal!=='object')fail('SEALED_FORWARDING_OPTIONS');
  const semantic=data(journal,'semantic');if(!synchronous(semantic))fail('SEALED_FORWARDING_METHOD');
  const originals=new Map();
  for(const name of names){const method=data(system,name);if(!synchronous(method))fail('SEALED_FORWARDING_METHOD');originals.set(name,method);}
  const methods={};
  for(const name of names){const original=originals.get(name);
    methods[name]=function(...args){
      // Match existing ts.sys.method(...) receiver intent, regardless of which
      // compiler/config host subsequently calls this forwarding function.
      // Do not clone/sort/coerce args/results or convert errors to absence.
      return Reflect.apply(semantic,journal,[name,args[0],()=>Reflect.apply(original,system,args)]);
    };
  }
  return Object.freeze(methods);
}
