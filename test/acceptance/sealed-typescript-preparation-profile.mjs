// Fixed test-only preparation boundary. No launcher, inference, compiler or
// observer authority. This profile is NOT the native-agent execution boundary.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';

export const sealedPreparationInterpretation='redue-sealed-preparation-darwin@1';
const fail=code=>{throw Object.assign(Error(code),{code});};
const quote=value=>'"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function checked(value,kind){
  if(typeof value!=='string'||!path.isAbsolute(value)||path.resolve(value)!==value||
    /[\u0000-\u001f\u007f]/u.test(value)||fs.realpathSync(value)!==value)fail('PREPARATION_PATH');
  const st=fs.lstatSync(value);
  if(st.isSymbolicLink()||st.uid!==process.getuid?.()||
    (kind==='directory'?!st.isDirectory():!st.isFile()))fail('PREPARATION_OWNERSHIP');
  return value;
}
function parents(file){const result=[];for(let dir=path.dirname(file);;dir=path.dirname(dir)){
  const st=fs.lstatSync(dir);if(!st.isDirectory()||st.isSymbolicLink())fail('PREPARATION_PATH');
  result.push(dir);if(dir===path.dirname(dir))return result;
}}
function containsPhysical(child,ancestor){const selected=fs.lstatSync(ancestor);
  return [child,...parents(child)].some(file=>{const st=fs.lstatSync(file);return st.dev===selected.dev&&st.ino===selected.ino;});}
export function sealedPreparationProfile(options){
  if(!options||Object.getPrototypeOf(options)!==Object.prototype||
    Reflect.ownKeys(options).length!==2||!['source','parent'].every(key=>Object.hasOwn(options,key)&&
      Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))fail('PREPARATION_OPTIONS');
  if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||
    process.getuid?.()===0)fail('PREPARATION_PLATFORM');
  const source=checked(options.source,'directory'),parent=checked(options.parent,'directory');
  if(containsPhysical(source,parent)||containsPhysical(parent,source))fail('PREPARATION_PLACEMENT');
  if((fs.lstatSync(parent).mode&0o777)!==0o700)fail('PREPARATION_OWNERSHIP');
  const opened=fs.opendirSync(parent);try{if(opened.readSync()!==null)fail('PREPARATION_PARENT_OCCUPIED');}finally{opened.closeSync();}
  // No caller-supplied code/executable allowlist or arbitrary shell executor.
  const node=checked(fs.realpathSync(process.execPath),'file');
  if(hash(fs.readFileSync(node))!=='5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc')
    fail('PREPARATION_RUNTIME_UNREVIEWED');
  const files=['./sealed-typescript-preparation-child.mjs','../../src/sealed-typescript-tree.mjs',
    '../../src/portable-envelope.mjs','../../src/path-identity.mjs','../../src/sealed-typescript-shim.mjs','../../package.json']
    .map(relative=>checked(fileURLToPath(new URL(relative,import.meta.url)),'file'));
  const metadata=[...new Set([source,parent,node,...files].flatMap(file=>[file,...parents(file)]))].sort();
  const literals=values=>values.map(value=>'(literal '+quote(value)+')').join('\n  ');
  const profile=`(version 1)
(deny default)
(allow sysctl-read)
(allow process-exec (literal ${quote(node)}))
(allow file-read* (literal "/"))
(allow file-read-metadata ${literals(metadata)})
(allow file-read* (subpath ${quote(source)}) (subpath ${quote(parent)})
  ${literals([node,...files])}
  (subpath "/System/Library") (subpath "/usr/lib")
  (subpath "/System/Volumes/Preboot/Cryptexes/OS/System/Library")
  (literal "/dev/random") (literal "/dev/urandom") (literal "/dev/null"))
(allow file-write* (subpath ${quote(parent)}) (literal "/dev/null"))
`;
  return Object.freeze({schema:1,interpretation:sealedPreparationInterpretation,
    profile,sha256:hash(profile),node,child:files[0],
    code:Object.freeze(files.map(file=>Object.freeze([file,hash(fs.readFileSync(file))]))),
    source,parent,sealed:false,reuseEligible:false,
    preparationEnvironment:'empty-no-authentication-no-model-no-project-code'});
}

// Selected-input opt-in only. This finite import closure intentionally includes
// uncalled plan-provider modules and YAML. It is not a dependency resolver.
// Symlinked installations are conservatively unsupported; canonical installed
// checkout leaves only. No ancestor or node_modules directory receives body access.
const selectedSourceFiles=Object.freeze(['./sealed-typescript-selected-preparation-child.mjs',
 './sealed-typescript-preparation-child.mjs',
 '../../src/decision-profile.mjs',
 '../../src/declared-plan.mjs',
 '../../src/direct-typescript.mjs',
 '../../src/glob.mjs',
 '../../src/index.mjs',
 '../../src/installed-inputs.mjs',
 '../../src/path-identity.mjs',
 '../../src/plan.mjs',
 '../../src/pnpm-inputs.mjs',
 '../../src/portable-budget.mjs',
 '../../src/portable-envelope.mjs',
 '../../src/portable-facts.mjs',
 '../../src/portable-origin-interval.mjs',
 '../../src/sealed-typescript-manifest.mjs',
 '../../src/sealed-typescript-shim.mjs',
 '../../src/sealed-typescript-tree.mjs',
 '../../src/typescript-list.mjs',
 '../../src/typescript-qualification.mjs',
 '../../src/yarn-workspace-inputs.mjs',
 '../../package.json']);
const selectedDependencies=Object.freeze([
 'picomatch/index.js',
 'picomatch/lib/constants.js',
 'picomatch/lib/parse.js',
 'picomatch/lib/picomatch.js',
 'picomatch/lib/scan.js',
 'picomatch/lib/utils.js',
 'picomatch/package.json',
 'yaml/dist/compose/compose-collection.js',
 'yaml/dist/compose/compose-doc.js',
 'yaml/dist/compose/compose-node.js',
 'yaml/dist/compose/compose-scalar.js',
 'yaml/dist/compose/composer.js',
 'yaml/dist/compose/resolve-block-map.js',
 'yaml/dist/compose/resolve-block-scalar.js',
 'yaml/dist/compose/resolve-block-seq.js',
 'yaml/dist/compose/resolve-end.js',
 'yaml/dist/compose/resolve-flow-collection.js',
 'yaml/dist/compose/resolve-flow-scalar.js',
 'yaml/dist/compose/resolve-props.js',
 'yaml/dist/compose/util-contains-newline.js',
 'yaml/dist/compose/util-empty-scalar-position.js',
 'yaml/dist/compose/util-flow-indent-check.js',
 'yaml/dist/compose/util-map-includes.js',
 'yaml/dist/doc/Document.js',
 'yaml/dist/doc/anchors.js',
 'yaml/dist/doc/applyReviver.js',
 'yaml/dist/doc/createNode.js',
 'yaml/dist/doc/directives.js',
 'yaml/dist/errors.js',
 'yaml/dist/index.js',
 'yaml/dist/log.js',
 'yaml/dist/nodes/Alias.js',
 'yaml/dist/nodes/Collection.js',
 'yaml/dist/nodes/Node.js',
 'yaml/dist/nodes/Pair.js',
 'yaml/dist/nodes/Scalar.js',
 'yaml/dist/nodes/YAMLMap.js',
 'yaml/dist/nodes/YAMLSeq.js',
 'yaml/dist/nodes/addPairToJSMap.js',
 'yaml/dist/nodes/identity.js',
 'yaml/dist/nodes/toJS.js',
 'yaml/dist/parse/cst-scalar.js',
 'yaml/dist/parse/cst-stringify.js',
 'yaml/dist/parse/cst-visit.js',
 'yaml/dist/parse/cst.js',
 'yaml/dist/parse/lexer.js',
 'yaml/dist/parse/line-counter.js',
 'yaml/dist/parse/parser.js',
 'yaml/dist/public-api.js',
 'yaml/dist/schema/Schema.js',
 'yaml/dist/schema/common/map.js',
 'yaml/dist/schema/common/null.js',
 'yaml/dist/schema/common/seq.js',
 'yaml/dist/schema/common/string.js',
 'yaml/dist/schema/core/bool.js',
 'yaml/dist/schema/core/float.js',
 'yaml/dist/schema/core/int.js',
 'yaml/dist/schema/core/schema.js',
 'yaml/dist/schema/json/schema.js',
 'yaml/dist/schema/tags.js',
 'yaml/dist/schema/yaml-1.1/binary.js',
 'yaml/dist/schema/yaml-1.1/bool.js',
 'yaml/dist/schema/yaml-1.1/float.js',
 'yaml/dist/schema/yaml-1.1/int.js',
 'yaml/dist/schema/yaml-1.1/merge.js',
 'yaml/dist/schema/yaml-1.1/omap.js',
 'yaml/dist/schema/yaml-1.1/pairs.js',
 'yaml/dist/schema/yaml-1.1/schema.js',
 'yaml/dist/schema/yaml-1.1/set.js',
 'yaml/dist/schema/yaml-1.1/timestamp.js',
 'yaml/dist/stringify/foldFlowLines.js',
 'yaml/dist/stringify/stringify.js',
 'yaml/dist/stringify/stringifyCollection.js',
 'yaml/dist/stringify/stringifyComment.js',
 'yaml/dist/stringify/stringifyDocument.js',
 'yaml/dist/stringify/stringifyNumber.js',
 'yaml/dist/stringify/stringifyPair.js',
 'yaml/dist/stringify/stringifyString.js',
 'yaml/dist/visit.js',
 'yaml/package.json',
]);
const selectedDependencyDigest='4390d1bfc866f05ff62168fd455ea698904907d35b2341c01ba48629904a516a';
const selectedMembershipDigest='ed24f4ab1b61b8cc18ad1281d964d856acc59bab6f978a47e4a2e5d25f18f9a4';
const selectedSourceDigest='53141d181676c95e7f6fa5536b1b2533df167146326ca1b8d72689843281ecfd';
const selectedFingerprint=stat=>['dev','ino','mode','uid','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
function selectedPackages(checkout){
 const membership=[],metadata=[];let count=0;
 const walk=(file,rel,depth)=>{if(++count>512||depth>16)fail('PREPARATION_CODE_SIZE');const stat=fs.lstatSync(file,{bigint:true});
  if(stat.isSymbolicLink()||stat.uid!==BigInt(process.getuid())||(stat.mode&0o7022n)!==0n||fs.realpathSync(file)!==file)fail('PREPARATION_OWNERSHIP');
  const kind=stat.isDirectory()?'directory':stat.isFile()&&stat.nlink===1n?'file':null;if(!kind)fail('PREPARATION_OWNERSHIP');
  membership.push([rel,kind]);metadata.push([file,'full',selectedFingerprint(stat)]);
  if(kind==='directory'){const opened=fs.opendirSync(file);try{let entry;while((entry=opened.readSync())!==null){
   if(!entry.name||entry.name==='.'||entry.name==='..'||/[\u0000-\u001f\u007f/\\]/u.test(entry.name)||entry.name.toLowerCase()==='.git')fail('PREPARATION_PATH');
   walk(path.join(file,entry.name),rel+'/'+entry.name,depth+1);
  }}finally{opened.closeSync();}}
 };
 for(const pkg of ['picomatch','yaml'])walk(path.join(checkout,'node_modules',pkg),pkg,0);
 membership.sort(([a],[b])=>a<b?-1:a>b?1:0);
 if(hash(JSON.stringify(membership))!==selectedMembershipDigest)fail('PREPARATION_DEPENDENCY_UNREVIEWED');return metadata;
}
function selectedAbsent(files){for(const file of files){let absent=false;try{fs.lstatSync(file);}catch(error){if(error?.code==='ENOENT')absent=true;else throw error;}if(!absent)fail('PREPARATION_BINDING_CHANGED');}}
function selectedCodeMetadata(files,checkout){
 const rows=new Map();let bytes=0;
 for(const file of files){let current=path.parse(file).root;
  for(const part of path.dirname(file).slice(current.length).split(path.sep).filter(Boolean)){
   current=path.join(current,part);const st=fs.lstatSync(current,{bigint:true});
   if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(current)!==current)fail('PREPARATION_PATH');
   const within=current===checkout||current.startsWith(checkout+'/');
   if(within&&(st.uid!==BigInt(process.getuid())||(st.mode&0o7022n)!==0n))fail('PREPARATION_OWNERSHIP');
   rows.set(current,[current,within?'full':'ancestry',within?selectedFingerprint(st):['dev','ino','mode','uid'].map(key=>String(st[key])).join(':')]);
  }
  const st=fs.lstatSync(file,{bigint:true});
  if(!st.isFile()||st.isSymbolicLink()||st.uid!==BigInt(process.getuid())||st.nlink!==1n||(st.mode&0o7022n)!==0n||
    st.size>2n*1024n*1024n||fs.realpathSync(file)!==file)fail('PREPARATION_OWNERSHIP');
  bytes+=Number(st.size);if(bytes>16*1024*1024)fail('PREPARATION_CODE_SIZE');rows.set(file,[file,'full',selectedFingerprint(st)]);
 }
 return [...rows.values()].sort(([a],[b])=>a<b?-1:a>b?1:0);
}
function selectedMetadataCurrent(rows){for(const [file,kind,expected]of rows){const st=fs.lstatSync(file,{bigint:true});
 if(st.isSymbolicLink()||fs.realpathSync(file)!==file||(kind==='full'?selectedFingerprint(st):['dev','ino','mode','uid'].map(key=>String(st[key])).join(':'))!==expected)fail('PREPARATION_BINDING_CHANGED');}}
export function sealedSelectedPreparationProfile(options){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Reflect.ownKeys(options).length!==2||
  !['source','parent'].every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(options,key)??{},'value')))fail('PREPARATION_OPTIONS');
 if(process.platform!=='darwin'||process.arch!=='arm64'||process.version!=='v22.13.0'||process.getuid?.()===0)fail('PREPARATION_PLATFORM');
 const checkout=path.resolve(fileURLToPath(new URL('../..',import.meta.url))),source=checked(options.source,'directory'),parent=checked(options.parent,'directory'),node=checked(fs.realpathSync(process.execPath),'file');
 if(containsPhysical(source,checkout)||containsPhysical(checkout,source)||containsPhysical(parent,checkout)||containsPhysical(checkout,parent))fail('PREPARATION_PLACEMENT');
 if(containsPhysical(node,source)||containsPhysical(node,parent))fail('PREPARATION_PLACEMENT');
 const codeAbsent=['src/node_modules','test/node_modules','test/acceptance/node_modules'].map(rel=>path.join(checkout,rel));selectedAbsent(codeAbsent);
 const sources=selectedSourceFiles.map(rel=>fileURLToPath(new URL(rel,import.meta.url))),dependencies=selectedDependencies.map(rel=>path.join(checkout,'node_modules',rel)),files=[...sources,...dependencies];
 // Validate the COMPLETE canonical ancestry/leaf set before reading any code.
 const rows=selectedCodeMetadata(files,checkout),merged=new Map(rows.map(row=>[row[0],row]));
 for(const row of selectedPackages(checkout)){if(merged.has(row[0])&&merged.get(row[0])[2]!==row[2])fail('PREPARATION_BINDING_CHANGED');merged.set(row[0],row);}
 const codeMetadata=[...merged.values()].sort(([a],[b])=>a<b?-1:a>b?1:0);
 const dependencyRows=dependencies.map((file,at)=>[selectedDependencies[at],hash(fs.readFileSync(file))]);
 if(hash(JSON.stringify(dependencyRows))!==selectedDependencyDigest)fail('PREPARATION_DEPENDENCY_UNREVIEWED');
 const sourceRows=sources.map((file,at)=>[selectedSourceFiles[at],hash(fs.readFileSync(file))]);
 if(hash(JSON.stringify(sourceRows))!==selectedSourceDigest)fail('PREPARATION_CODE_UNREVIEWED');
 // Fixed Node resolution, after metadata, membership and exact code pins. No
 // project resolver, dynamic package list or imported loader path is admitted.
 const require=createRequire(import.meta.url);
 if(require.resolve('picomatch')!==path.join(checkout,'node_modules/picomatch/index.js')||require.resolve('yaml')!==path.join(checkout,'node_modules/yaml/dist/index.js')||
  import.meta.resolve('picomatch')!==new URL('../../node_modules/picomatch/index.js',import.meta.url).href||import.meta.resolve('yaml')!==new URL('../../node_modules/yaml/dist/index.js',import.meta.url).href)fail('PREPARATION_BINDING_CHANGED');
 const base=sealedPreparationProfile(options),code=files.map(file=>[file,hash(fs.readFileSync(file))]);
 const paths=[source,parent,base.node,...files].flatMap(file=>[file,...parents(file)]);
 const metadata=[...new Set([...codeAbsent,...codeMetadata.map(([file])=>file),...paths])].sort();
 const literals=values=>values.map(value=>'(literal '+quote(value)+')').join('\n  ');
 const profile=`(version 1)
(deny default)
(allow sysctl-read)
(allow process-exec (literal ${quote(base.node)}))
(allow file-read* (literal "/"))
(allow file-read-metadata ${literals(metadata)})
(allow file-read* (subpath ${quote(source)}) (subpath ${quote(parent)})
  ${literals([base.node,...files])}
  (subpath "/System/Library") (subpath "/usr/lib")
  (subpath "/System/Volumes/Preboot/Cryptexes/OS/System/Library")
  (literal "/dev/random") (literal "/dev/urandom") (literal "/dev/null"))
(allow file-write* (subpath ${quote(parent)}) (literal "/dev/null"))
`;
 selectedAbsent(codeAbsent);selectedMetadataCurrent(codeMetadata);
 return Object.freeze({...base,interpretation:'redue-selected-preparation-darwin@1',profile,sha256:hash(profile),child:files[0],
  code:Object.freeze(code.map(row=>Object.freeze(row))),codeMetadata:Object.freeze(codeMetadata.map(row=>Object.freeze(row))),
  codeAbsent:Object.freeze(codeAbsent),dependencyClosureSha256:selectedDependencyDigest,packageMembershipSha256:selectedMembershipDigest,sourceClosureSha256:selectedSourceDigest});
}
