// Source contract controls only. No C compiler, executable, mmap or native host.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-map-sentinel.c',import.meta.url),'utf8');
const code=source.replace(/\/\*[\s\S]*?\*\//g,'');
test('fixed mapper is a two-placeholder argc1 source proposal, with no imported resource selector',()=>{
  assert.deepEqual([...code.matchAll(/static const char (\w+_path)\[\] = "([^"]+)";/g)].map(row=>row.slice(1)),[
    ['workspace_path','__REVIEWED_WRITABLE_WORKSPACE_MAP_CANARY__'],['staged_path','__REVIEWED_STAGED_MAP_CANARY__']]);
  assert.match(code,/if \(argc != 1 \|\| !canonical_path\(workspace_path\)/);assert.match(code,/\(void\)argv;/);
  assert.doesNotMatch(code,/argv\s*\[/);assert.doesNotMatch(code,/\b(getenv|system|popen|exec\w*|posix_spawn\w*|fork|socket|connect|dlopen|perror|scanf|fgets)\s*\(/);
  assert.match(code,/strstr\(value, "__REVIEWED_"\) != NULL/);
});
test('native read prerequisites require guarded regular single-link owned bounded marker files',()=>{
  assert.match(code,/#define OPEN_GUARDS \(O_NOFOLLOW \| O_NOFOLLOW_ANY \| O_NONBLOCK \| O_CLOEXEC\)/);
  assert.match(code,/S_ISREG\(value->st_mode\).*value->st_uid == getuid\(\).*value->st_nlink == 1/s);
  assert.match(code,/value->st_size == \(off_t\)MARKER_BYTES/);assert.match(code,/getuid\(\) == 0 \|\| geteuid\(\) != getuid\(\) \|\| getegid\(\) != getgid\(\)/);
  assert.match(code,/workspace_snapshot.st_dev == staged_snapshot.st_dev && workspace_snapshot.st_ino == staged_snapshot.st_ino/);
  assert.match(code,/same_fingerprint\(before, &descriptor\).*same_fingerprint\(before, &named\)/s);
});
test('workspace control actually requests shared RW mapping and verifies changed/restored file bytes',()=>{
  assert.match(code,/mmap\(NULL, MARKER_BYTES, PROT_READ \| PROT_WRITE, MAP_SHARED, fd, 0\)/);
  assert.match(code,/bytes\[0\] = '!';/);assert.match(code,/pread\(readonly, &observed, 1, 0\)/);assert.match(code,/bytes\[0\] = marker\[0\];/);
  assert.equal((code.match(/msync\(mapping, MARKER_BYTES, MS_SYNC\)/g)||[]).length,2);
  assert.match(code,/if \(workspace_control\(workspace, &workspace_snapshot\)\) staged_checks/);
  assert.doesNotMatch(code,/MAP_PRIVATE/);
});
test('readonly descriptor constraints are distinct from staged writable-descriptor permission denial',()=>{
  assert.match(code,/open\(staged_path, O_RDWR \| OPEN_GUARDS\)/);
  assert.match(code,/error == EPERM \|\| error == EACCES \? "DENIED_PERMISSION_ERROR" : "UNKNOWN_OR_UNAVAILABLE"/);
  assert.match(code,/mprotect\(read_mapping, MARKER_BYTES, PROT_READ \| PROT_WRITE\)/);
  assert.match(code,/mmap\(NULL, MARKER_BYTES, PROT_READ \| PROT_WRITE, MAP_SHARED, readonly, 0\)/);
  assert.equal((code.match(/error == EACCES \? "READ_ONLY_FD_CONSTRAINT_OBSERVED" : "UNKNOWN_OR_UNAVAILABLE"/g)||[]).length,2);
  assert.equal((code.match(/"DENIED_PERMISSION_ERROR"/g)||[]).length,1);
});
test('mapping grants latch failure and cleanup uncertainty never rewrites those observations',()=>{
  assert.equal((code.match(/observe\([234], "ACCESS_SUCCEEDED", 0\); failed = true;/g)||[]).length,3);
  assert.match(code,/if \(close\(writable\) != 0\) cleanup_failed\(errno\)/);
  assert.match(code,/if \(munmap\(read_mapping, MARKER_BYTES\) != 0\) cleanup_failed\(errno\)/);
  assert.match(code,/if \(munmap\(write_mapping, MARKER_BYTES\) != 0\) cleanup_failed\(errno\)/);
  assert.match(code,/observe\(6, cleanup_known \? "OWNED_DESCRIPTORS_AND_MAPPINGS_CLOSED" : "UNKNOWN_OR_UNAVAILABLE", cleanup_errno\)/);
});
test('public protocol contains only fixed rows and finite errno names, never paths/body/environment',()=>{
  const rows=code.match(/static struct row rows\[ROW_COUNT\] = \{([\s\S]*?)\n\};/)[1];
  const names=[...rows.matchAll(/\{"([^"]+)", "NOT_PERFORMED", "NONE"\}/g)].map(row=>row[1]);assert.equal(names.length,7);assert.equal(new Set(names).size,7);
  assert.match(code,/#define ROW_COUNT 7/);assert.match(code,/default: return "OTHER";/);
  const output=code.slice(code.indexOf('static int output(void)'),code.indexOf('int main('));
  assert.doesNotMatch(output,/workspace_path|staged_path|marker|errno[^_]|getenv/);assert.doesNotMatch(output,/%d|%ld|%p/);
  assert.match(output,/failed \? "FAIL" : "UNKNOWN"/);assert.match(output,/fresh_stage_and_no_inherited_rw_handles_verified\\":false/);
  assert.match(output,/sealed\\":false/);assert.match(output,/reuseEligible\\":false/);assert.match(output,/return 74;/);
});
test('review/build proposal explicitly withholds compile/run/native/sealing authority',()=>{
  assert.match(source,/SOURCE-ONLY, DISABLED/);assert.match(source,/pin substituted-source and binary SHA-256 before any native invocation/);
  assert.match(source,/no caller compiler flags or dynamic -D paths/);assert.match(source,/no inherited RW handles are separate/);
  assert.match(source,/descriptor\/VM constraints, NOT evidence of sandbox denial/);assert.match(source,/MAP_PRIVATE CoW.*not a denial gate/);
});

// Evaluate only the two author-owned side-effect-free C Boolean expressions as
// JavaScript booleans. This proves a finite decision table, NOT C compilation,
// syscall results, SDK ABI, native permissions or the process execution route.
function booleanPredicate(name,parameters){
  const match=code.match(new RegExp(`static bool ${name}\\(([^)]*)\\) \\{\\s*return ([^;]+);\\s*\\}`));assert(match);
  assert.deepEqual(match[1].split(',').map(value=>value.trim()),parameters.map(value=>'bool '+value));
  const expression=match[2],tokens=expression.match(/[A-Za-z_][A-Za-z0-9_]*|&&|\|\||!|\(|\)/g)||[];
  assert.equal(tokens.join(''),expression.replace(/\s/g,''));for(const token of tokens)if(/^[A-Za-z_]/.test(token))assert(parameters.includes(token));
  return Function(...parameters,'return '+expression);
}
const knownFailure=booleanPredicate('workspace_known_failure',['changed_known','changed','restored_known','restored','metadata_known','identity_held']);
const unknown=booleanPredicate('workspace_unknown',['changed_known','restored_known','metadata_known','changed_sync_ok','restored_sync_ok']);
test('known wrong restored bytes and known identity mismatch remain failures despite other uncertainty',()=>{
  assert.equal(knownFailure(false,false,true,false,false,false),true,'observed wrong restore survives missing changed/metadata observations');
  assert.equal(knownFailure(false,false,false,false,true,false),true,'known identity mismatch survives both unavailable byte reads');
  assert.equal(knownFailure(true,false,false,false,false,false),true,'known wrong changed byte survives every other unavailable observation');
  assert.equal(unknown(true,true,true,false,false),true,'sync failures remain uncertainty, which must not outrank a known failure');
  const body=code.slice(code.indexOf('static bool workspace_control('),code.indexOf('static void staged_checks('));
  assert(body.indexOf('if (workspace_known_failure(')<body.indexOf('else if (workspace_unknown('));
});
test('metadata/read failure alone is UNKNOWN, never a fabricated wrong identity or byte',()=>{
  assert.equal(knownFailure(true,true,true,true,false,false),false);assert.equal(unknown(true,true,false,true,true),true);
  assert.equal(knownFailure(false,false,false,false,false,false),false);assert.equal(unknown(false,false,false,true,true),true);
  assert.match(code,/const bool metadata_known = descriptor_result == 0 && named_result == 0;/);
  assert.match(code,/const bool identity_held = metadata_known && valid_file/);assert.match(code,/const bool changed_known = changed_count >= 0;/);assert.match(code,/const bool restored_known = restored_count >= 0;/);
});
test('complete finite Boolean observation table distinguishes known violations from absent observations',()=>{
  for(let bits=0;bits<64;bits++){const values=Array.from({length:6},(_,index)=>!!(bits&(1<<index)));let violations=0;
    for(let at=0;at<6;at+=2)if(values[at]&&values[at+1]===false)violations++;assert.equal(knownFailure(...values),violations>0);}
  for(let bits=0;bits<32;bits++){const values=Array.from({length:5},(_,index)=>!!(bits&(1<<index)));assert.equal(unknown(...values),values.filter(value=>value===false).length>0);}
});
