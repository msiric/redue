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
  assert.match(code,/#define OPEN_GUARDS \(O_NOFOLLOW_ANY \| O_NONBLOCK \| O_CLOEXEC\)/);
  assert.match(code,/S_ISREG\(value->st_mode\).*value->st_uid == getuid\(\).*value->st_nlink == 1/s);
  assert.match(code,/value->st_size == \(off_t\)MARKER_BYTES/);assert.match(code,/getuid\(\) == 0 \|\| geteuid\(\) != getuid\(\) \|\| getegid\(\) != getgid\(\)/);
  assert.match(code,/workspace_snapshot.st_dev == staged_snapshot.st_dev && workspace_snapshot.st_ino == staged_snapshot.st_ino/);
  assert.match(code,/same_fingerprint\(before, &descriptor\).*same_fingerprint\(before, &named\)/s);
});
test('fixed open guard keeps all-component nofollow without the source-proven conflicting terminal flag',()=>{
  const guards=code.match(/^#define OPEN_GUARDS \(([^\n]+)\)$/m)[1].split('|').map(value=>value.trim());
  assert.deepEqual(guards,['O_NOFOLLOW_ANY','O_NONBLOCK','O_CLOEXEC']);
  assert.equal(guards.includes('O_NOFOLLOW'),false);
  assert.match(code,/_Static_assert\(\(OPEN_GUARDS & O_NOFOLLOW\) == 0,/);
  assert.match(source,/vfs_vnops\.c lines392-395 rejects combining/);
  assert.match(source,/lines544-546 applies NAMEI_NOFOLLOW_ANY/);
  assert.match(source,/not proof that the running kernel/);
  assert.equal((code.match(/\bopen\([^;]+OPEN_GUARDS\)/g)||[]).length,3);
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

// Evaluate only two fixed side-effect-free byte predicates as JS integers. The
// reference scan below supplies synthetic bytes and validates source structure;
// it is not a C compilation, SDK/ABI check, native path or sandbox observation.
function bytePredicate(name,parameters){
  const match=code.match(new RegExp(`static bool ${name}\\(([^)]*)\\) \\{\\s*return ([^;]+);\\s*\\}`));assert(match);
  assert.deepEqual(match[1].split(',').map(value=>value.trim()),parameters.map(value=>'unsigned char '+value));
  const expression=match[2],tokens=expression.match(/0x[0-9a-f]+|[A-Za-z_][A-Za-z0-9_]*|&&|\|\||!=|>=|<=|==|>|<|!|\(|\)/g)||[];
  assert.equal(tokens.join(''),expression.replace(/\s/g,''));for(const token of tokens)if(/^[A-Za-z_]/.test(token))assert(parameters.includes(token));
  return Function(...parameters,'return '+expression);
}
const continuation=bytePredicate('utf8_continuation',['value']);
const secondOK=bytePredicate('utf8_second_ok',['first','second']);
function referenceEncoding(bytes){
  for(let at=0;at<bytes.length;at++){
    const first=bytes[at];if(first<0x80){if(first<32||first===127)return false;continue;}
    let extra;if(first>=0xc2&&first<=0xdf)extra=1;else if(first>=0xe0&&first<=0xef)extra=2;else if(first>=0xf0&&first<=0xf4)extra=3;else return false;
    if(bytes.length-at-1<extra||!secondOK(first,bytes[at+1]))return false;
    for(let offset=2;offset<=extra;offset++)if(!continuation(bytes[at+offset]))return false;
    if(first===0xc2&&bytes[at+1]<=0x9f)return false;at+=extra;
  }return true;
}
function referenceCanonical(value){
  const bytes=Buffer.from(value);if(bytes.length<2||bytes.length>4096||!value.startsWith('/')||value.includes('__REVIEWED_')||!referenceEncoding(bytes)||/[\\:]/u.test(value))return false;
  return value.slice(1).split('/').every(part=>part!==''&&part!=='.'&&part!=='..');
}
test('source retains UTF8 bounds before indexing, all canonical/guard assertions and fixed route scope',()=>{
  assert.match(code,/if \(!utf8_path_bytes\(\(const unsigned char \*\)value, length\)\) return false;/);
  assert.match(code,/first >= 0xc2 && first <= 0xdf\) extra = 1/);assert.match(code,/first >= 0xe0 && first <= 0xef\) extra = 2/);assert.match(code,/first >= 0xf0 && first <= 0xf4\) extra = 3/);
  assert.match(code,/length - at - 1 < extra \|\| !utf8_second_ok\(first, value\[at \+ 1\]\)/);
  assert.match(code,/offset = 2; offset <= extra; offset\+\+.*!utf8_continuation\(value\[at \+ offset\]\)/);
  assert.match(code,/first == 0xc2 && value\[at \+ 1\] <= 0x9f/);
  assert.match(code,/c < 32 \|\| c == 127 \|\| c == '\\\\' \|\| c == ':'/);
  assert.match(source,/Encoding checks do not prove path\/Unicode/);assert.doesNotMatch(code,/getenv|argv\s*\[/);
});
test('source byte predicates reject overlong/surrogate/out-of-range second bytes for all finite byte pairs',()=>{
  for(let value=0;value<256;value++)assert.equal(continuation(value),value>=128&&value<=191);
  for(let first=0;first<256;first++)for(let second=0;second<256;second++){
    const allowed=second>=128&&second<=191&&!(first===224&&second<160)&&!(first===237&&second>159)&&!(first===240&&second<144)&&!(first===244&&second>143);
    assert.equal(secondOK(first,second),allowed);
  }
});
test('synthetic UTF8 path bytes admit approved checkout characters but reject malformed/control encodings',()=>{
  assert.equal(referenceCanonical('/private/tmp/owned/Checkout 空间/.sealed-native-canaries/map-canary.txt'),true);
  assert.equal(referenceCanonical('/owned/é/🧪/map-canary.txt'),true);
  for(const bytes of [[0xc0,0xaf],[0xe0,0x80,0x80],[0xed,0xa0,0x80],[0xf4,0x90,0x80,0x80],[0xf5,0x80,0x80,0x80],[0xe6,0x9f],[0x80],[0x7f],[0xc2,0x85],[0x0a]])assert.equal(referenceEncoding(Buffer.from(bytes)),false);
  for(const value of ['relative','/','/owned//file','/owned/./file','/owned/../file','/owned/file/','/owned\\file','/owned:file','/owned/\nfile','/owned/\u0085file','/owned/__REVIEWED_STAGE__','/'+'x'.repeat(4096)])assert.equal(referenceCanonical(value),false);
});
