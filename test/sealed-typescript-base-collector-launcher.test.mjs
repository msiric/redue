// Source-only C contract checks. No compiled launcher, Node entry, collector,
// helper, native agent or environment/credential inspection is executed here.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./acceptance/sealed-typescript-base-collector-launcher.c',import.meta.url),'utf8');
const main=source.slice(source.indexOf('int main('));
const keys=name=>[...source.match(new RegExp('static const char \\*const '+name+'\\[\\] = \\{([\\s\\S]*?)\\};'))[1].matchAll(/"([A-Z_]+)"/g)].map(match=>match[1]);

test('fixed pre-Node guard has the same reviewed preload-key scope as collector defense in depth',()=>{
 assert.deepEqual(keys('exact_keys'),['NODE_OPTIONS','NODE_PATH','NODE_REPL_EXTERNAL_MODULE']);
 assert.deepEqual(keys('prefix_keys'),['DYLD_','LD_','OPENSSL_']);
 assert.match(source,/byte >= 'a' && byte <= 'z' \? \(unsigned char\)\(byte - 'a' \+ 'A'\) : byte/);
 assert.match(source,/while \(entry\[length\] != '\\0' && entry\[length\] != '='\) length\+\+/);
 assert.match(source,/length == 0 \|\| entry\[length\] != '='/);
 assert.match(source,/length < wanted \|\| \(!prefix && length != wanted\)/);
 assert.match(source,/ascii_upper\(\(unsigned char\)entry\[at\]\) != \(unsigned char\)key\[at\]/);
 assert.match(source,/key_matches\(entry, length, exact_keys\[key\], 0\)/);
 assert.match(source,/key_matches\(entry, length, prefix_keys\[key\], 1\)/);
 // All comparisons receive key length, even when the value after '=' is empty.
 assert.doesNotMatch(source,/getenv\(|strlen\(entry\)|entry\[length\s*\+/);
});

test('caller arguments and environment are refused before the sole fixed Node execve',()=>{
 assert.match(main,/argc != 1 \|\| argv == NULL \|\| argv\[0\] == NULL \|\| strcmp\(argv\[0\], launcher\) != 0/);
 assert.match(main,/char \*\*const inherited_environment = environ/);
 assert.match(main,/if \(!environment_allowed\(inherited_environment\)\) refuse\(\)/);
 assert(main.indexOf('argc != 1')<main.indexOf('environment_allowed('));
 assert(main.indexOf('environment_allowed(')<main.indexOf('execve('));
 assert.match(main,/char \*const fixed_argv\[\] = \{\(char \*\)node, \(char \*\)collector, NULL\}/);
 assert.match(main,/execve\(node, fixed_argv, inherited_environment\);\s*refuse\(\)/);
 assert.equal((main.match(/\bexecve\(/g)||[]).length,1);
 assert.doesNotMatch(source,/\b(?:setenv|unsetenv|putenv|clearenv|execvp|execlp|system|popen|fork|posix_spawn)\s*\(/);
 assert.doesNotMatch(main,/argv\[[1-9]/);
});

test('all launch refusals publish only static redacted UNKNOWN and exit 74',()=>{
 assert.match(source,/static const char refusal\[\] = "REDUE_BASE_COLLECTOR_LAUNCH_UNKNOWN\\n"/);
 assert.match(source,/write\(STDERR_FILENO, refusal, sizeof\(refusal\) - 1\)/);
 assert.match(source,/_exit\(74\)/);
 assert.doesNotMatch(source,/\b(?:printf|fprintf|perror|strerror|getenv)\s*\(/);
 assert.doesNotMatch(source,/\b(?:PASS|sealed: true|reuseEligible: true)\b/);
});

test('template binds exactly three fixed paths and keeps own-loader and parent prerequisites explicit',()=>{
 for(const token of ['NODE','ENTRY','LAUNCHER'])assert.equal(source.split('__REVIEWED_BASE_COLLECTOR_'+token+'__').length,2);
 assert.match(source,/NOT before this binary's own loader/);
 assert.match(source,/parent must prevent pre-main injection/);
 assert.match(source,/launcher\/Node\/collector bytes/);
 assert.match(source,/native identity\/auth\/effective policy\/capacity/);
 assert.match(source,/inherited handles/);
});
