// Pure source-contract controls only: no C compile, ABI/syscall/native/CI run.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-exchange-sentinel.c',import.meta.url),'utf8');
test('exchange source has one fixed base literal, argc1 and exact reviewed receiver prefix',()=>{
  assert.match(source,/#define BASE "__REVIEWED_EXCHANGE_BASE__"/);assert.match(source,/\/private\/tmp\/redue-ci-recipient-/);
  assert.match(source,/sizeof\(prefix\)-1\+8/);assert.match(source,/argc!=1\|\|!valid_base\(\)/);assert.match(source,/getuid\(\)!=geteuid\(\)\|\|getgid\(\)!=getegid\(\)/);
  assert.doesNotMatch(source,/argv\[[0-9]+\]|getenv\(|setenv\(|stdin|fgets\(|scanf\(/);
});
test('same actual atomic API and flags control workspace then protected stage parent',()=>{
  assert.match(source,/#define EXCHANGE_FLAGS \(RENAME_SWAP \| RENAME_NOFOLLOW_ANY\)/);
  assert.match(source,/_Static_assert\(RENAME_SWAP == 0x2 && RENAME_NOFOLLOW_ANY == 0x10/);
  assert.equal((source.match(/renameatx_np\(AT_FDCWD,LEFT,AT_FDCWD,RIGHT,EXCHANGE_FLAGS\)/g)??[]).length,2);
  assert.equal((source.match(/renameatx_np\(AT_FDCWD,PARENT,AT_FDCWD,PARTNER,EXCHANGE_FLAGS\)/g)??[]).length,1);
  assert.doesNotMatch(source,/\brename\(|\brenameat\(/);
});
test('source paths stay inside synthetic sealed parent and workspace; no base sibling exchange',()=>{
  for(const suffix of ['/sealed-inputs','/stage-parent-exchange','/exchange-control-a','/exchange-control-b'])assert(source.includes('"'+suffix+'"'));
  assert.match(source,/#define PARTNER WORKSPACE/);assert.match(source,/#define LEFT WORKSPACE/);assert.match(source,/#define RIGHT WORKSPACE/);
  assert.doesNotMatch(source,/renameatx_np\(AT_FDCWD,BASE/);assert(source.includes('base_atomic_exchange_denied'));assert(source.includes('NOT_IMPLEMENTED'));
});
test('complete bounded synthetic inventory and owned marker readback precede positive and protected calls',()=>{
  assert.match(source,/if\(\+\+retained>16\)/);assert.match(source,/inventory\(PARENT,parent_names,1,NULL,NULL\)/);assert.match(source,/inventory\(STAGE,stage_names,6,&stage->directory,expected_stage\?&expected_stage->directory:NULL\)/);
  assert.match(source,/inventory\(WORKSPACE,workspace_names,5,NULL,NULL\)/);assert.match(source,/if\(at==count \|\| \(seen&\(1u<<at\)\)\)/);
  assert.match(source,/named\.st_nlink!=1/);assert.match(source,/memcmp\(bytes,marker,sizeof\(marker\)-1\)/);
  assert.match(source,/initial=fixture\(dirs,&initial_stage,NULL,NULL\);if\(initial==MATCH\)workspace=control\(dirs\)/);
  assert.match(source,/if\(workspace==MATCH\)\{final_checked=1;enum observation again=fixture\(current,&current_stage,dirs,&initial_stage\)/);assert.match(source,/if\(again==MATCH\)\{attempted=1/);
});
test('read-only nofollow-any descriptor guards preserve ancestor safety without conflicting flag pair',()=>{
  assert.match(source,/#define GUARDS \(O_NOFOLLOW_ANY \| O_NONBLOCK \| O_CLOEXEC\)/);assert.match(source,/_Static_assert\(\(GUARDS & O_NOFOLLOW\) == 0/);
  assert.match(source,/open\(file,O_RDONLY\|GUARDS\)/);assert.match(source,/open\(file,O_RDONLY\|O_DIRECTORY\|GUARDS\)/);
  assert.doesNotMatch(source,/O_RDWR|O_WRONLY|O_CREAT|O_TRUNC|chmod\(|unlink\(|rmdir\(|remove\(/);
});
test('known wrong bytes and identities outrank cleanup and read uncertainty',()=>{
  const MATCH=0,UNKNOWN=1,MISMATCH=2,merge=(a,b)=>a===MISMATCH||b===MISMATCH?MISMATCH:a===UNKNOWN||b===UNKNOWN?UNKNOWN:MATCH;
  assert.match(source,/return a == MISMATCH \|\| b == MISMATCH \? MISMATCH : a == UNKNOWN \|\| b == UNKNOWN \? UNKNOWN : MATCH/);
  for(const a of [MATCH,UNKNOWN,MISMATCH])for(const b of [MATCH,UNKNOWN,MISMATCH])assert.equal(merge(a,b),a===MISMATCH||b===MISMATCH?MISMATCH:a===UNKNOWN||b===UNKNOWN?UNKNOWN:MATCH);
  assert.match(source,/if\(close\(fd\)\)result=merge\(result,UNKNOWN\)/);assert.match(source,/if\(closedir\(dir\)\)result=merge\(result,UNKNOWN\)/);
  assert.match(source,/else if\(!same_file\(&named,&after_named\)\)result=merge\(result,MISMATCH\)/);
  assert.match(source,/if\(!same_identity\(&named,&opened\)\)\{close\(fd\);return MISMATCH;\}/);
});
test('only protected-operation EPERM/EACCES qualifies denied; grant is irreversible despite final uncertainty',()=>{
  assert.match(source,/granted=1;else\{int error=errno;denied=error==EPERM\|\|error==EACCES;/);
  assert.match(source,/int failure=initial==MISMATCH\|\|workspace==MISMATCH\|\|granted\|\|final==MISMATCH/);
  assert.match(source,/granted\?"FAIL":denied\?"PASS":attempted\?"UNKNOWN":"NOT_PERFORMED"/);
  assert.doesNotMatch(source,/granted=0;/);assert.match(source,/failure\?"FAIL":"UNKNOWN"/);
});
test('fixed redacted report never claims native/seal/handle proof or executes other code',()=>{
  assert(source.includes('\\"checks_passed\\":false'));assert(source.includes('\\"sealed\\":false'));assert(source.includes('\\"reuseEligible\\":false'));
  assert(source.includes('\\"noInheritedWritableHandlesVerified\\":false'));assert(source.includes('NOT_ESTABLISHED'));
  assert.doesNotMatch(source,/perror\(|strerror\(|system\(|exec[a-z]*\(|fork\(|socket\(|\bgetenv\(/);
  for(const statement of source.matchAll(/\bprintf\(([^;]+);/g))assert.doesNotMatch(statement[1],/BASE|PARENT|WORKSPACE|PARTNER|LEFT|RIGHT|file|bytes|entry->d_name|errno/);
});


test('independently observed control identity mismatch survives other-side unavailability',()=>{
  assert.match(source,/if\(left==MATCH&&!same_identity\(&now_a,expected_a\)\)left=MISMATCH/);
  assert.match(source,/if\(right==MATCH&&!same_identity\(&now_b,expected_b\)\)right=MISMATCH/);assert.match(source,/return merge\(left,right\)/);
  const MATCH=0,UNKNOWN=1,MISMATCH=2,merge=(a,b)=>a===MISMATCH||b===MISMATCH?MISMATCH:a===UNKNOWN||b===UNKNOWN?UNKNOWN:MATCH;
  const known=(result,equal)=>result===MATCH&&!equal?MISMATCH:result;
  assert.equal(merge(known(MATCH,false),known(UNKNOWN,false)),MISMATCH);
  assert.equal(merge(known(UNKNOWN,false),known(MATCH,false)),MISMATCH);
  assert.equal(merge(known(UNKNOWN,false),known(MATCH,true)),UNKNOWN,'Unavailable metadata itself is not invented mismatch');
});
test('current parent comparisons occur per successfully captured stat before unrelated fixture uncertainty',()=>{
  assert.match(source,/if\(one==MATCH&&expected&&!same_identity\(&dirs\[i\],&expected\[i\]\)\)one=MISMATCH/);
  assert.match(source,/result=merge\(result,one\);/);assert.match(source,/again=fixture\(current,&current_stage,dirs,&initial_stage\)/);assert.match(source,/final=fixture\(current,&current_stage,dirs,&initial_stage\)/);
  assert.doesNotMatch(source,/if\(final==MATCH\)for|i<4&&again==MATCH/);
  const MATCH=0,UNKNOWN=1,MISMATCH=2,merge=(a,b)=>a===MISMATCH||b===MISMATCH?MISMATCH:a===UNKNOWN||b===UNKNOWN?UNKNOWN:MATCH;
  const classify=(stat,equal)=>stat===MATCH&&!equal?MISMATCH:stat;
  assert.equal([UNKNOWN,classify(MATCH,false),MATCH,MATCH].reduce(merge,MATCH),MISMATCH,'Known changed parent cannot be masked by unavailable marker/other metadata');
  assert.equal([UNKNOWN,classify(UNKNOWN,false),MATCH,MATCH].reduce(merge,MATCH),UNKNOWN,'No captured parent is not asserted changed');
});


test('successful post-descriptor metadata compares known named baseline even if initial descriptor stat was unavailable',()=>{
  assert.match(source,/if\(!same_file\(&named,&after\)\)result=merge\(result,MISMATCH\)/);
  assert.match(source,/if\(before_known&&!same_file\(&before,&after\)\)result=merge\(result,MISMATCH\)/);
  const MATCH=0,UNKNOWN=1,MISMATCH=2,merge=(a,b)=>a===MISMATCH||b===MISMATCH?MISMATCH:a===UNKNOWN||b===UNKNOWN?UNKNOWN:MATCH;
  const post=(state,afterKnown,equalsNamed)=>afterKnown&&!equalsNamed?merge(state,MISMATCH):afterKnown?state:merge(state,UNKNOWN);
  for(const mismatch of ['dev','ino','type','uid','mode'])assert.equal(merge(post(UNKNOWN,true,false),UNKNOWN),MISMATCH,mismatch+' known post mismatch survives unavailable initial stat and close');
  assert.equal(post(UNKNOWN,true,true),UNKNOWN);assert.equal(post(UNKNOWN,false,false),UNKNOWN,'Unavailable later metadata is not invented wrong identity');
});

// Evaluate only the existing side-effect-free C stat equality/merge expressions
// over finite synthetic observations. No helper/fixture/syscall executes; these
// controls do not establish C ABI, native enforcement or interval immutability.
function statPredicate(name){
  const match=source.match(new RegExp(`static int ${name}\\(const struct stat \\*a, const struct stat \\*b\\) \\{\\s*return ([^;]+);\\s*\\}`));assert(match);
  const body=match[1].replaceAll('->','.');
  const tokens=body.match(/same_identity|a|b|st_dev|st_ino|st_mode|st_uid|st_gid|st_nlink|st_size|st_mtimespec|st_ctimespec|tv_sec|tv_nsec|&&|==|\(|\)|\.|,/g)??[];
  assert.equal(tokens.join(''),body.replace(/\s/g,''));return Function('a','b','same_identity','return '+body);
}
const identityExpression=statPredicate('same_identity'),fileExpression=statPredicate('same_file');
const sameIdentity=(a,b)=>identityExpression(a,b),sameFile=(a,b)=>fileExpression(a,b,sameIdentity);
const MATCH=0,UNKNOWN=1,MISMATCH=2;
const mergeExpression=source.match(/static enum observation merge\(enum observation a, enum observation b\) \{\s*return ([^;]+);\s*\}/)[1];
assert.equal((mergeExpression.match(/a|b|MISMATCH|UNKNOWN|MATCH|==|\|\||\?|:/g)??[]).join(''),mergeExpression.replace(/\s/g,''));
const merge=Function('a','b','MATCH','UNKNOWN','MISMATCH','return '+mergeExpression);
const merged=(a,b)=>merge(a,b,MATCH,UNKNOWN,MISMATCH);
const syntheticStat=ino=>({st_dev:1,st_ino:ino,st_mode:0o100644,st_uid:501,st_gid:20,st_nlink:1,st_size:expectedBytes.length,st_mtimespec:{tv_sec:1,tv_nsec:2},st_ctimespec:{tv_sec:3,tv_nsec:4}});
const expectedBytes=Buffer.from('REDUE_SEALED_SYNTHETIC_CANARY\n');
function markerObservation(expected,{named,descriptor,after,afterNamed,bytes,closeOk=true}){
  // This reference supplies injected endpoint facts; the source guards below
  // establish where the exact stat predicates and fixed-byte comparisons apply.
  if(!named)return UNKNOWN;
  if(!sameFile(named,expected))return MISMATCH;
  let result=descriptor?(sameFile(named,descriptor)?MATCH:MISMATCH):UNKNOWN;
  if(result===MATCH)result=bytes?(bytes.equals(expectedBytes)?MATCH:MISMATCH):UNKNOWN;
  for(const current of [after,afterNamed])result=merged(result,current?(named&&sameFile(named,current)&&sameFile(expected,current)?MATCH:MISMATCH):UNKNOWN);
  return merged(result,closeOk?MATCH:UNKNOWN);
}
test('stage and six marker named/descriptor snapshots precede controls and compare against the original baseline at both later fixtures',()=>{
  assert.match(source,/struct stage_snapshot \{ struct stat directory,markers\[6\]; \}/);
  assert.match(source,/if \(expected&&!same_file\(&named,expected\)\) return MISMATCH/);
  assert.match(source,/if\(\(snapshot\|\|expected\)&&!same_file\(&named,&opened\)\)/);
  assert.match(source,/if\(result==MATCH&&snapshot\)\*snapshot=named/);
  assert.match(source,/marker_file\(STAGE,stage_names\[i\],&stage->markers\[i\],expected_stage\?&expected_stage->markers\[i\]:NULL\)/);
  assert.match(source,/if\(stage_inventory==MATCH\)\{\s*for\(size_t i=0;i<6;i\+\+\)result=merge\(result,marker_file\(STAGE/);
  const body=source.slice(source.indexOf('static enum observation fixture('),source.indexOf('static enum observation identities_at('));
  assert(body.indexOf('marker_file(STAGE,stage_names[i]')<body.indexOf('if(result!=MATCH)return result;'));
  assert(body.indexOf('stage_current(stage)')>body.indexOf('marker_file(four[i],"identity-canary.txt",NULL,NULL)'));
  assert.match(source,/initial=fixture\(dirs,&initial_stage,NULL,NULL\);if\(initial==MATCH\)workspace=control\(dirs\)/);
  assert.equal((source.match(/fixture\(current,&current_stage,dirs,&initial_stage\)/g)??[]).length,2);
  assert.match(source,/if\(snapshot\|\|expected\)\{if\(fstat\(fd,&after\)\)/);
  assert.match(source,/if\(closedir\(dir\)\)result=merge\(result,UNKNOWN\);\s*if\(snapshot\|\|expected\)\{if\(lstat\(file,&after\)\)/);
});
test('identical-byte six-marker file/tree replacement is a known mismatch, never PASS',()=>{
  const markers=Array.from({length:6},(_,at)=>syntheticStat(at+100)),directory={...syntheticStat(50),st_mode:0o40700};
  for(let at=0;at<6;at++){
    const fresh=structuredClone(markers[at]);fresh.st_ino++;
    const observed=markerObservation(markers[at],{named:fresh,descriptor:fresh,after:fresh,afterNamed:fresh,bytes:expectedBytes});
    assert.equal(observed,MISMATCH,'same bytes cannot adopt replacement marker '+at);
  }
  const replacement=structuredClone(directory);replacement.st_ino++;
  assert.equal(sameFile(directory,replacement),false,'same six names/bytes cannot adopt replacement stage directory');
  assert.equal(merged(UNKNOWN,sameFile(directory,replacement)?MATCH:MISMATCH),MISMATCH,'known tree replacement survives unrelated I/O uncertainty');
});
test('every stored stat field drift is rejected for the stage and each of its six files; unchanged endpoint bytes alone cannot pass',()=>{
  const fields=['st_dev','st_ino','st_mode','st_uid','st_gid','st_nlink','st_size','st_mtimespec.tv_sec','st_mtimespec.tv_nsec','st_ctimespec.tv_sec','st_ctimespec.tv_nsec'];
  for(let at=0;at<7;at++)for(const field of fields){const before=syntheticStat(at+50),after=structuredClone(before),parts=field.split('.');
    if(parts.length===1)after[field]++;else after[parts[0]][parts[1]]++;
    assert.equal(sameFile(before,after),false,'initial fingerprint drift '+at+' '+field);
    assert.equal(merged(UNKNOWN,sameFile(before,after)?MATCH:MISMATCH),MISMATCH);
  }
});
test('unavailable stat/read/close facts remain UNKNOWN while known replacements or wrong bytes survive later uncertainty',()=>{
  const before=syntheticStat(100),good={named:before,descriptor:before,after:before,afterNamed:before,bytes:expectedBytes};
  assert.equal(markerObservation(before,good),MATCH);
  for(const missing of ['named','descriptor','after','afterNamed','bytes'])assert.equal(markerObservation(before,{...good,[missing]:null}),UNKNOWN,missing+' absent is not invented replacement');
  assert.equal(markerObservation(before,{...good,closeOk:false}),UNKNOWN);
  const wrong=Buffer.from(expectedBytes);wrong[0]^=1;
  assert.equal(markerObservation(before,{...good,bytes:wrong,after:null,afterNamed:null,closeOk:false}),MISMATCH);
  const replacement=structuredClone(before);replacement.st_ino++;
  assert.equal(markerObservation(before,{...good,descriptor:null,after:replacement,afterNamed:null,bytes:null,closeOk:false}),MISMATCH);
  assert.match(source,/if\(lstat\(file,&now\)\)result=merge\(result,UNKNOWN\);else if\(!same_file\(&now,&expected->markers\[i\]\)\)result=merge\(result,MISMATCH\)/);
  assert.match(source,/if\(lstat\(STAGE,&now\)\)result=merge\(result,UNKNOWN\);else if\(!same_file\(&now,&expected->directory\)\)result=merge\(result,MISMATCH\)/);
});
test('five rows, missing base assertion, global UNKNOWN and exit74 stay fixed; snapshots establish only endpoints',()=>{
  const report=source.slice(source.indexOf('static void emit('),source.indexOf('int main('));
  assert.equal((report.match(/\\"name\\":/g)??[]).length,5);assert(report.includes('base_atomic_exchange_denied'));
  assert(report.includes('NOT_IMPLEMENTED'));assert(report.includes('failure?"FAIL":"UNKNOWN"'));assert(report.includes('\\"checks_passed\\":false'));
  assert.equal((source.slice(source.indexOf('int main(')).match(/return 74;/g)??[]).length,2);
  assert.match(source,/snapshots observe endpoints,[\s\S]*not interval immutability or atomic confinement/);
  assert.match(source,/int failure=initial==MISMATCH\|\|workspace==MISMATCH\|\|granted\|\|final==MISMATCH/);
});
