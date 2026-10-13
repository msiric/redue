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
  assert.match(source,/if\(\+\+retained>16\)/);assert.match(source,/inventory\(PARENT,parent_names,1\)/);assert.match(source,/inventory\(STAGE,stage_names,6\)/);
  assert.match(source,/inventory\(WORKSPACE,workspace_names,5\)/);assert.match(source,/if\(at==count \|\| \(seen&\(1u<<at\)\)\)/);
  assert.match(source,/named\.st_nlink!=1/);assert.match(source,/memcmp\(bytes,marker,sizeof\(marker\)-1\)/);
  assert.match(source,/initial=fixture\(dirs\);if\(initial==MATCH\)workspace=control\(dirs\)/);
  assert.match(source,/if\(workspace==MATCH\)\{final_checked=1;enum observation again=fixture\(current\)/);assert.match(source,/if\(again==MATCH\)\{attempted=1/);
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
