# Portable evidence: independent boundary review

Current conclusion: origin/caller/publication, parser/store conflict and current
CI-policy boundaries have independent controls. Real same-host copied-executable
handoff and one required-refresh authentication inspection of actual hosted
signed evidence pass. Both complete hosted runtime profiles match the signed
origin's full content identity. The finite portable inspection budget completed
on that producer after the earlier fully captured cache-consumption timeouts;
this does not prove tail reliability. The concrete CI recipient, controlled
instruction writer and native Claude data proposal are independently reviewed
preparations, not enabled authority. Exact producer acceptance, actual recipient
CI applicability, two-machine agent reuse and complete economics remain pending.
No G1–G4 certification is made here. The earlier unreconciled caller-test PASS
is not gate evidence; its corrected frozen-source control passes. Historical
failures, source identities and timing limits remain below. Baseline inspected:
`b4f286034f43021a74f1babf2c1d0fee5df2a9e5`.

The review lane is independent of core and envelope authors. It owns this record
and `test/portable-boundaries.test.mjs`; it does not modify the applicability
implementation or existing expected results. Pure retained-query controls pass
only when observed facts match; they do not establish an observed execution
interval, producer trust, or portable eligibility.

## Required interface decisions

**D1 — origin completeness.** Export may use only original immutable captured
facts. New facts must be collected within the original checked observation interval
and bound to invocation, command, contract, scope, compiler and actual caller.
Today's filesystem cannot repair an old run. Missing, unstable, interrupted or
partially persisted origin evidence remains non-reusable. The original outcome
must remain visible when applicability or trust is absent.

**D2 — independent recipient identity.** The recipient discovers its full required
input set through locally supported recipe code, never through a producer-supplied
subset or executable validator. Bind configuration, command and scope rather than
the name `typecheck`. Paths are a declared case-sensitive project namespace, not
an arbitrary prefix replacement. Preserve content, membership, missing resolution
candidates, query options and omitted-argument indices. Preserve symlink topology
or reject it explicitly. File hashes cannot substitute for membership or interval
continuity, including changes restored before an end read.

**D3 — selection and trust.** Exact digest acceptance is an explicit local decision,
not an import side effect or global producer exemption. Imports never overwrite
local selectors or immutable runs. A newer local incomplete/unstable outcome or
FAIL must not reveal an older imported PASS. An applicable trusted FAIL plus an
unordered trusted PASS is a conflict until a declared authority or fresh observed
local execution resolves it. An unrelated-input historical failure must not block
new evidence forever. An untrusted failure cannot poison accepted local evidence.

## Runtime boundary finding

The local Node 22.13.0 arm64 process reports 347 loaded images: Node and three
system dylibs are readable files; 343 image paths are not ordinary readable files
and are provided by the macOS shared cache. Matching Node bytes and OS release
alone does not establish identical platform code. Hashing every presumed cache
filename is also insufficient unless those files are bound to the cache actually
loaded by the process.

Pinned Apple dyld source was reviewed at
`fd8d0c4d52320ebf64db34f3cb280310d905c5ae`:

- [Cache layout](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/doc/CacheLayout.md)
  describes executable/data/linkedit mappings split among cache files.
- [Cache format](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/include/mach-o/dyld_cache_format.h)
  binds the base header to subcache UUIDs and filename suffixes.
- [Process configuration](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/dyld/DyldProcessConfig.cpp)
  selects a system cache directory, override or ignition/cryptex payload and
  accounts for development/customer cache choices.
- [dyld process APIs](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/include/mach-o/dyld_priv.h)
  expose actual-process cache UUID, cache path and override/interposition facts.

A cross-machine macOS rule therefore needs a justified actual loaded-runtime
binding, complete selected cache constituent identity, remaining loaded-file
identity, architecture/build and conservative loader restrictions. An initial
same-host-only runtime constraint may support a truthful G1 checkout experiment;
it cannot satisfy G2. No unavailable library is represented by a fabricated hash.

The initial same-host helper was independently rebuilt from the author's C source
with the reviewed Node 22.13.0 headers and exact flags:

```sh
/usr/bin/clang -O2 -arch arm64 -dynamiclib -undefined dynamic_lookup \
  -DNODE_GYP_MODULE_NAME=redue_portable_runtime \
  -Wl,-install_name,@rpath/redue-portable-runtime.node \
  -I <reviewed-node-22.13.0-headers> src/portable-runtime-darwin.c \
  -o <owned-temporary-directory>/portable-runtime.node
```

The independent artifact SHA-256 matched
`ced9a62153d5db768c1f561ece7adc8c9569cf175060c52689549a5ff54a812e`.
Actual cache UUID matched the base-header UUID, override/interposition were false,
five loaded images were readable (including the helper), 343 absent-disk images
were confirmed in the active cache, and no unknown image remained. Empty,
non-string and oversized path arguments failed conservatively. The temporary
artifact was removed without altering the author's helper. These are local
runtime-inspection facts, not a two-machine content-identity certification.

This same-host/boot profile must retain physical Node identity, actual loaded-cache
UUID/path/file identity, readable-image content and unsupported-loader refusal.
It relies on the existing trusted OS boundary; a boot identifier plus virtual
path list alone is insufficient. Final source/packaging identity, original-run
input coverage and recipient integration remain separate review requirements.

## Adversarial acceptance to apply to the implementation

| Cases | Independent expected result |
| --- | --- |
| V03/V04 | Full recipient discovery matches original facts; real recipient has no equivalent execution or copied state. |
| V05/V06 | Content, config, additions/removals/renames and absent-candidate changes withdraw reuse. |
| V07/V08 | Compiler/runtime/dependency mismatch, case or unsupported topology withdraw reuse. |
| V09/V11/V12 | Mutation, malformed/duplicate keys, malicious paths, URLs, argv, nesting and size abuse cannot execute/fetch/write outside owned import state. |
| V13 | Missing start, unstable interval or incomplete outcome cannot be repaired during import. |
| V14 | Observer loss, root replacement or edits during validation do not return stale green. |
| V15–V17 | Replay, unordered trusted conflicts and untrusted failures obey D3; local selection stays authoritative. |
| V18/V19 | Old/unknown interpretations and interrupted transactional writes preserve historical records while withholding unsupported authority. |
| V20–V22 | Explicit obligations execute; trust-refresh policy is honest offline; outer CI success cannot invent an executed check. |

Each implemented case must retain an exact commit, command and actual result.
Deterministic CLI mechanics remain separate from genuine host behavior, machine
acceptance and economic evidence. Unknown resource availability is not a PASS.

## Envelope review result

Envelope author commits: `ab7f66d`, `f4eb157`. Independent test commits:
`0b392ca`, `6ecbf59`, plus the integer-lexeme regression in this review update.
On macOS arm64 Node 22.13.0:

```sh
node --test test/portable-boundaries.test.mjs test/portable-envelope.test.mjs
```

Result: 21 tests passed, zero failed or skipped. The independent tests include
absence/membership, rename, change-and-restore limitations, symlink topology,
case/Unicode and identity binding, inert JSON prototype keys, incomplete origin,
untrusted inspection, unknown embedded command/transport fields, malformed Unicode
and encoded duplicate keys. Author tests additionally cover size/depth/item limits,
truncation, digest substitutions, accessor rejection and incompatible schemas.

The review found contradictory `FAIL`/exit-zero and complete/interrupted origins
could initially pass schema validation. The author corrected exact outcome mapping
and complete-origin prerequisites before the reviewed commit; regression tests
passed. A second review finding showed fractional/exponent tokens could underflow
or round to integers and share a canonical digest with an integer origin field.
This was consistent with JavaScript-number canonical meaning, but not the intended
narrow integer-input domain. Commit `f4eb157` rejects such tokens before numeric
conversion; independent negative tests cover the underflow and rounding cases.
No remaining concrete parsed-input exploit was found in this finite review.
This result does not verify runtime equivalence, authenticate a producer or authorize
reuse. JavaScript producer objects are local API inputs; the imported-byte threat
boundary is parsed JSON, which cannot supply executable accessors or proxies.

## Transactional import review result

Store author commits: `bdd267d`, `20e10a9`, `fa62318`, `deb49aa`. Independent
replay and owner-scope regressions: `6ff7637`, `35722e2`. Command:

```sh
node --test test/portable-boundaries.test.mjs test/portable-envelope.test.mjs test/portable-store.test.mjs
```

Result before the separate export-race controls below: 35 tests passed, zero
failed or skipped, on macOS arm64 Node 22.13.0.
Imported bytes and acceptance records remain separate from local outcomes.
The store uses the existing run lock, bounds selected and orphan content, rejects
symbolic/hard-linked owned files, performs bounded digest/schema reads, and keeps
an incomplete-transaction guard across persistence failures.

The independent review reproduced a concrete pre-fix defect: after an explicitly
accepted FAIL's immutable payload persisted but selector replacement failed, a
replayed old PASS could clear the incomplete marker and omit that FAIL. The first
independent expected-result test failed against `bdd267d`. Commit `20e10a9` binds
the full intended transaction and acceptance; only its exact retry can recover.
The unchanged replay-refusal assertion then passed. I/O errors are sanitized by
`fa62318`; the test checks the structured error code and actual persisted FAIL file
rather than requiring private path-bearing error text.

The read-side review also found that validating an absolute, well-shaped ownership
marker was insufficient without the intended recipient scope. Commit `deb49aa`
makes expected configuration/root mandatory and rechecks exact ownership around
the snapshot. The independent test changes the marker to another syntactically
valid root, requires zero accepted records and `PORTABLE_OWNERSHIP`, and verifies
recovery only after restoring the exact original owner.

Integration still must bind the exact active ownership marker, re-read imports on
every authoritative publication, guard cached responses against changed/incomplete
import selection, and apply the reviewed local-versus-import conflict policy.
Metadata revision alone is not envelope-content authority. This review does not
claim hostile same-user filesystem mutation is prevented by ordinary path checks,
nor certify actual installed packaging or machine reuse.

## Export ownership review result

Command author commit `bfdbaab` was inspected independently. Two deterministic
fault controls replaced the state owner while the immutable origin was read and
after export-file fsync. Both expected refusal assertions failed: export completed
because its repeated selection barrier checked receipt revision but not ownership.
This is a scope/ownership gap in the unreleased command, not a demonstrated
recipient CURRENT result. The author was notified to retain exact owner checks
through every export barrier and preserve cleanup of only the created destination.
Commit `4407444` binds exact owner content, marker fingerprint and ancestor
identities into each export selection barrier, including the no-write preview.
The same two independent refusal tests then passed unchanged; the post-fsync
failure removes only the destination inode created by this export. The selected
historical run remains intact.

The combined focused suite ran with author command fixes `2c23163`, `4407444`,
store fixes above, and CI inspection preparation `2a3b78b`:

```sh
node --test test/portable-boundaries.test.mjs test/portable-envelope.test.mjs \
  test/portable-store.test.mjs test/portable-command.test.mjs \
  test/portable-host-preflight.test.mjs test/portable-ci-trust.test.mjs
```

Result: 59 tests passed, zero failed or skipped, on macOS arm64 Node 22.13.0.
These are mechanics, fault controls and controlled verifier-output tests. They
are not actual signatures, agent sessions, independent machines or G1 acceptance.

## CI inspector preparation review

The reviewed `2a3b78b` helper pins the locally selected verifier's 2.79.0 output
contract and checks authenticated certificate identity, exact outer artifact
SHA-256 and the inner evidence digest. It returns verification without producer
acceptance or reuse. Pinned [GitHub CLI verification source](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verify/verify.go)
distinguishes authenticated certificate/timestamp fields from workflow-controlled
statement assertions; [extension enforcement](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verification/extensions.go)
checks source, signer and issuer. REDUE's stricter exact comparisons are
conservative. The helper's online mode is an explicit lookup, not proof of globally
latest evidence; offline identity cannot claim unseen revocation or newer results.

The approved workflow's origin assertion, protected signer policy, privacy review,
actual signature verification, trust-removal semantics and independently matched
recipient runtime remain separate G3 requirements. No workflow or trust account
was changed in this review.

## Pure conflict-decision review

Helper author commit `c1402d8` was independently reviewed. A precommit finding
showed that a STALE label with different preliminary local facts bypassed stability
and invocation checks. An incomplete run's starting facts cannot prove its full
execution used unrelated inputs. The author tightened that exception to a stable,
exited, fully identified local outcome and likewise checks imported completeness
before classifying different facts as historical.

Independent controls cover unstable/interrupted/start-failed local outcomes with
different start facts, accepted incomplete PASS/FAIL with different preliminary
facts, replay under reversed catalog arrival order, exact catalog-resolution
binding, and lack of authority for an unaccepted failure. Author plus independent
policy/boundary tests: 28 passed, zero failed or skipped on macOS Node 22.13.0.

The engine caller must supply local facts only from complete current-interpretation
capture and a conflict-resolution binding only from identical accepted catalog
observed at both run boundaries. A metadata revision is not input-content or
producer-order authority. The pure helper does not implement those engine barriers;
integration remains independently unverified.

## Original-run interval review

Origin author commit `c9173f5` was inspected and exercised by an independent
actual-run control. The initial review worktree lacked the pinned development
compiler; its first attempt stopped at that prerequisite. After a clean locked
`npm ci --ignore-scripts`, the default macOS temporary directory exceeded the
control-socket path limit and the next attempt stopped before recording. The
fixture was relocated to a separately owned canonical `/private/tmp` directory;
no models, permission changes or environment-proxy changes were involved.

The established fixture uses the real local TypeScript 5.6.3 compiler with noLib
and explicit observed global declarations. It is a controlled same-host origin
test, not an adoption or two-machine result. The final run passed these expected
assertions:

- Fully observed baseline PASS has complete portable capture.
- A relevant edit then restoration between start capture and child launch leaves
  actual PASS historical but records the observed input event and refuses complete
  portable origin. Equal ending bytes do not erase the interval event.
- New source membership after child exit makes the PASS unstable/nonportable.
- Stopping observation after exit removes the required ending boundary. Restart
  selects that newer incomplete PASS, never the older baseline CURRENT.
- The original immutable baseline run is unchanged throughout.

The test used existing controlled run-boundary hooks; these are fault-injection
controls around real compiler execution, not simulated process outcomes. Command:

```sh
node --test --test-name-pattern='real portable origin' test/portable-boundaries.test.mjs
```

Result: one complete interval-control test passed on macOS arm64 Node 22.13.0,
approximately 11.5 seconds. That duration is a test result, not an economic claim.
Capture retains exact bundled probe/argv binding, reviewed compiler verification,
broad observed source/installed scope, consumed-input coverage and final observation
after ending discovery. Outside-root discovery still refuses portability. Recipient
publication/race validation is a separate review step.

## Recipient publication and lost-selection review

Recipient integration `1beaaea` and guard correction `fd504b8` were independently
reviewed. The initial implementation bound catalog revision but could combine an
earlier portable decision with a newer selected local receipt at publication. The
correction binds the non-null receipt revision, input identity, event serial and
healthy completed observation as well as the re-read catalog. It does not treat
an earlier eligible decision as continuing authority while delayed.

The independent real origin/export/import fixture obtained a caller-aware eligible
recipient result with the original receipt ID and no recipient run records. During
a bounded prepublication delay, controlled receipt-persistence faults then committed
a newer FAIL or persisted its immutable record while interrupting selector replacement.
Both responses refused CURRENT/reuse; the completed newer FAIL stayed selected.
An additional controlled accepted matching FAIL import during the same delay
changed the catalog basis; the earlier eligible decision again refused CURRENT
and reuse, without creating a local run. The extended control passed in about
13.3 seconds. The constructed FAIL origin is explicitly synthetic fault data;
it is not reported as real compiler execution or authenticated producer evidence.
The final variant changes a relevant source during the delay and requires the
existing owned journal's corresponding input notification before releasing the
response. Thus the precondition is delivered observation, not an assumed sleep.
The response refuses CURRENT/reuse and records no local compiler invocation.
The four-variant publication control passed in about 16.1 seconds; it adds no
runtime interface and uses only disposable synthetic-source diagnostics.
Synthetic selection faults are identified as such, not claimed as real recipient
compiler executions. The producer baseline was actual TypeScript execution.

One fixture attempt stopped before injection because asynchronous observer startup
had not published plans. The corrected precondition waits for that publication and
copies relative compiler shims unchanged. Final race control: one test passed,
zero failed/skipped, about 9.7 seconds on the reviewed macOS/Node profile. No model
trial was launched by these tests.

Store correction `3c4a820` was independently inspected. Missing selection is not
pristine when its payload directory exists, even if empty. Only the explicit exact
first single-record pending transaction may recover its own missing initial selector;
stored multi-record history is not reconstructed from an old import. Independent
tests delete a selector after accepted PASS and FAIL, then confirm that old PASS
replay is refused and immutable FAIL remains unchanged. An empty initialized
directory likewise remains unavailable. Both controls passed.

These results are controlled same-host mechanics. They do not demonstrate actual
cross-agent behavior, a cross-machine runtime match, producer authentication or
release-artifact/platform gates.

Combined independent execution after the missing-selector correction and exact
prototype runtime gate: 87/87 tests passed, zero failed/skipped, approximately
21.6 seconds. This includes parser, store, pure applicability, controlled CI
verification-output handling, facts, command ownership, no-model preflight, actual
same-host relocation and independent boundary tests. Positive native-runtime
controls now use `portableRuntimeSupported()` and run only on Darwin arm64,
Node 22.13.0, OS release 25.6.0; other platforms retain parser/store/command tests
without pretending runtime eligibility. This was a source-worktree test run,
not an exact installed-artifact or model/platform acceptance claim.

The one owned fixture left by the initial missing-development-compiler attempt
was verified by its exact test package identity and sole project entry, then
removed. It contained no state or receipts. Later controls register cleanup
before prerequisites so observers and fixtures are cleaned on failures too.

## Current independent D1–D3 assessment

Within the explicitly same-host/boot reviewed prototype, no remaining known
critical defect was identified after the origin completeness, exact ownership,
catalog recovery, newer receipt and delayed input/publication corrections above.
The evidence supports an actual controlled separate-checkout G1 mechanism, not
the unimplemented cross-machine runtime profile. All assumptions remain enforced
by complete original capture, locally configured full recipient discovery,
caller proof, observation continuity and final publication guards. Imported bytes
do not select commands, validators or authority; manual acceptance is digest-scoped.

This assessment is not a blanket approval of G2–G4: the full matched runtime
profile, real cross-agent/two-machine trials, authenticated CI producer route,
complete V01–V22 integration matrix, installed/platform gates and complete-path
economics still require their own concrete evidence and independent review.

## Storage-free runner inventory and output completion review

The integration owner's initial `portable-preflight.yml` and
`portable-runner-preflight.mjs` were independently inspected before push. The
two approved standard `macos-26` jobs are limited to eight minutes, contents-read
permission, fixed Node 22.13.0 and selected public runtime/profile inventory.
They have no artifact upload, cache, signing/OIDC permission, model credentials
or producer acceptance. Checkout persists no credentials. The official pinned
[checkout commit](https://github.com/actions/checkout/commit/11d5960a326750d5838078e36cf38b85af677262)
and [setup-node commit](https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020)
were verified. Normal locked public dependency installation remains part of these
disposable jobs. Logs report selected metadata, key names and content digests,
never complete environment, private source or credential-bearing values.

The local development inventory passed, reporting `eligibilityEstablished:false`.
Independent jobs' profile logs do not demonstrate evidence transfer, actual agent
reuse, authenticated producer trust or a matched cross-machine applicability rule.
No identified blocker to this bounded owner-approved inventory was found.

The associated CLI correction waits for queued stdout/stderr writes before the
existing normal explicit exits. Node 22.13.0 documents that
[process output to pipes may be asynchronous](https://nodejs.org/download/release/v22.13.0/docs/api/process.html#a-note-on-process-io)
and provides a [write completion callback](https://nodejs.org/download/release/v22.13.0/docs/api/stream.html#writablewritechunk-encoding-callback).
It does not alter verification semantics or swallow write errors. Independent
`cli-output` plus `agent-integration` tests passed 17/17, including a piped cached
JSON response exceeding 64 KiB and intact-versus-edited owned instruction updates.
The narrow correction does not claim every existing error-exit path is flushed.

The shared imported-evidence policy/documentation addition was independently
reviewed: it retains CURRENT/PASS/explicit eligibility and healthy-schema rules,
identifies execution at the origin with null local invocation, preserves digest
and origin receipt IDs, and forbids automatic import/acceptance. This is policy
mechanics review, not actual Codex/Claude behavior acceptance.

## Bounded-reader leaf replacement

A further independent source review found that store and CI readers checked
regular-file type before a blocking open. A concurrent leaf replacement with a
FIFO could then block before the opened descriptor's type check, outside the
intended bounded read. This is a local availability boundary finding, not a claim
of exploitation or affected-user count. The independent owned subprocess control
actually imported a valid payload, replaced that one leaf at the open boundary
and exhausted its external three-second deadline (`ETIMEDOUT`) against store
`3c4a820`. The test retains a fail-closed completion expectation; it does not
weaken the timeout or introduce a writer to release the FIFO. Correction and
post-fix review used author correction `3df3f58`: both readers open nonblocking
where supported and reject non-regular or multiply linked opened descriptors
before reading. The unchanged independent real FIFO control completed in about
93 ms with conservative error and zero records, rather than timing out. Combined
store, CI inspector and independent boundary tests passed 52/52 with no skips or
failures. The earlier observed timeout remains preserved above.

CI inspector hardening `2f86e3c` was also reviewed: locally approved verifier bytes
are bound before and after execution, linked/changed inputs are refused and every
returned verified statement must match policy. `local_policy_current:false`
truthfully leaves authoritative policy revision/removal handling to integration.
Binary digest does not certify arbitrary native loader/preload effects: an approved
native verifier distribution and trusted execution context remain prerequisites.
Explicit offline identification is not a guarantee of no network activity; pinned
gh trusted-root initialization can refresh TUF/Sigstore data. Neither these
controlled verification-output tests nor the helper grant producer acceptance or
live G3 signature/workflow certification.

## Proposed matched-runtime and current producer-policy review

The cache inspector remains inspection-only until the complete versioned runtime
rule is integrated and reviewed. Independent table controls passed 2/2: every
declared UUID/suffix is retained, path traversal, ambiguous suffixes, duplicate
members, extra symbols files and obsolete/invalid layouts are refused. The
[reviewed Apple format](https://github.com/apple-oss-distributions/dyld/blob/fd8d0c4d52320ebf64db34f3cb280310d905c5ae/include/mach-o/dyld_cache_format.h)
binds the modern table and all constituents. One actual read-only local inventory
hashed all 13 native-bound files (5,813,354,496 bytes) in approximately 6,581 ms;
its canonical inventory digest was
`f1a09ebf8f2b4147e3c774f8e5350e2e4193215dce6eff059781f8d7eeb8acdb`.
This is neither reuse eligibility nor complete-path economics. The cooperative
read deadline still requires the enclosing process deadline. The new protected
ancestor check is conservative; the observed writable Cryptexes ancestor needs
its actual system protection independently justified before any exception.

Official Node distribution bytes were independently read from the
[Node 22.13.0 release](https://nodejs.org/dist/v22.13.0/): the 48,561,209-byte
Darwin-arm64 archive SHA-256
`bc1e374e7393e2f4b20e5bbc157d02e9b1fb2c634b2f992136b38fb8ca2023b7`
matched the official HTTPS checksum list. Its regular, unexecuted 121,593,488-byte
`bin/node` leaf SHA-256 was
`5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc`,
matching the local/runner executable. No archive paths were extracted and no
independent PGP signature verification is claimed. Byte provenance does not alone
establish complete runtime applicability.

The separate OpenSSL startup prerequisite was independently source-reviewed
against pinned [Node initialization](https://github.com/nodejs/node/blob/v22.13.0/src/node.cc)
and the bundled OpenSSL configuration parser/module-selection implementation.
Only exact reviewed template bytes or verified absence are supported; bounded
HOME expansion is copied as data into unused template values. All OpenSSL
variable overrides, including empty values/case aliases, remain unsupported.
Independent absence/ancestor-mutation and override controls passed. This does
not alter the actual environment or establish a released-version defect. Ordinary
non-privileged execution must also be enforced in the integrated runtime profile.

Owner-local producer-policy snapshots were independently reviewed and tested.
The registry is not authentication or acceptance: it binds exact current policy
bytes, revision and member digest, with physical identity for interval snapshots.
Removed/narrowed/unreadable policy cannot leave a prior binding authoritative.
Restoring exact owner-approved bytes can intentionally restore a persisted binding;
it does not revive an old interval snapshot or prove durable monotonic history.
A real leaf replacement with a FIFO at open completed conservatively in about
52 ms with `PORTABLE_PRODUCER_POLICY_CHANGED`, no policy returned. New independent
cache/OpenSSL/policy controls passed 5/5; author OpenSSL/policy tests independently
passed 17/17 with one deliberately unsupported-host branch skipped on this host.
No live authenticated CI producer, model trial or cross-machine reuse is implied.

The bounded exact-package workflow was reviewed within the owner-confirmed 10 MiB
included storage: one sub-1-MiB packed artifact plus manifest/checksum/source SHA,
immutable run/attempt name, one-day retention, same-source download verification,
read-only checkout and no signing/OIDC/model authority. The revised Windows
replacement control distinguishes actual mutation from native EPERM/EACCES fault
injection refusal, while a separate performed size mutation must still fail as
CHANGED. The previous Windows assertion failure remains historical evidence;
source review is not a new native Windows pass.

## Versioned content profile and copied-executable handoff

Author profile `1d3c0df` was independently reviewed and its native helper rebuilt
with the previously recorded fixed clang flags. The rebuilt and bundled hashes
match `d16b6f14ed089c795bf763743a0212b9f4ee4dc2310c39a3231e038dc137dff3`.
The only writable-ancestor exception is the exact Cryptexes parent, conditional
on the fixed child OS directory's root ownership, non-writable mode, matching
native lstat identity and system-no-unlink flag. The documented trusted-OS
[flag contract](https://developer.apple.com/documentation/system/fileflags/systemnounlink)
and [pinned C definition](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/sys/stat.h)
cover removal/rename protection. This is not an independent proof of APFS's
closed enforcement implementation or a readonly-mount assertion. Missing flag,
wrong child identity or another writable ancestor remain unsupported.

An actual controlled origin run exported complete PASS. A separately initialized
recipient checkout used an owned copied official Node executable with identical
bytes but a demonstrably different raw physical Node hash. The recipient's
caller-aware synchronized query independently returned imported CURRENT/PASS,
explicit eligibility, the same origin receipt and envelope digest, and null local
invocation. No recipient runs directory existed; the immutable producer receipt,
including raw original context, was unchanged. Cached inspection remained
non-authoritative. These controls and old-interpretation rejection passed 3/3
in approximately 15.8 seconds. This is real compiler execution and same-host
relocation, not model adoption, two-machine reuse or authenticated CI acceptance.

Review identified a remaining detectable generation-mix window: caller portable
proof discovery preceded raw context capture for request submission. After the
physical-Node projection, an intervening caller executable change could cease
being vetoed by raw comparison while the old full-runtime proof remained valid.
This source finding was reported to the integration owner immediately; no actual
false-CURRENT reproduction is claimed yet. The caller proof must be bound to
unchanged before/after raw caller context, with conservative handling of a later
known context change. Versioned content equivalence does not justify substituting
the daemon's validated runtime for an unvalidated changed caller context.

The caller interval correction `81f0877` was independently reviewed: all raw
tracked caller fields are captured before portable proof, compared before request
submission and compared again after response before publication. Known change
returns unavailable inspection, never an earlier green snapshot. The independent
copied-Node control now exercises a stable paused request, real owned-copy metadata
changes after proof and before publication, and unreleased-barrier expiry. Both
changed intervals and expiry return exit 2/non-CURRENT/non-reusable evidence; a
later fresh complete validation can legitimately reuse the same content profile.
The actual origin receipt `3ea9411d-f0a1-4917-b5c9-8af6e1d96cda` and envelope
`9a42c6a447feae800ac2acd60e4650cde7fdc93914953371224a22d32bcbc52c`
were retained, with zero recipient compiler executions. The combined controlled
case passed in approximately 45.5 seconds. This contains the source finding;
there was no pre-fix actual false-CURRENT reproduction and none is implied.

Historical evidence correction: the reported 45.5-second caller-test PASS above
cannot now be reconciled with the committed old assertion and exact CLI source.
`38abb5f` searched the human reason for an error-code token, while the reviewed
`d453e9a` source already emitted human text separately from `reason_code`. No raw
log identifying the transient source/test ordering was retained for that claimed
PASS. The report and IDs remain historical, but that result is **unreconciled**
and is not used to certify the caller boundary. The current frozen rerun below
supersedes it for acceptance.

The preceding full independent boundary run passed 30/30 (approximately 108.6
seconds), retaining original change/restore, incomplete outcome, catalog conflict,
source-event and delayed-publication controls under the versioned profile. The
caller correction above then received its own affected-path run; this is not a
new full-package/platform or cross-agent/machine certification.

## Final origin boundary and current producer-policy coupling

The additional origin guard `856c895` was independently reviewed and exercised
using another owned executable copy. A real wrapped baseline produced complete
PASS. A second real successful compiler execution was paused after portable end
discovery; the test changed the copied executable's physical metadata before the
final checkpoint. The outcome remained exited/PASS, but stability and portable
completeness were false with the specific late-context issue. Export remained
incomplete, and synchronized status before and after observer restart retained
that newest non-reusable outcome rather than the older PASS. The old immutable
receipt was unchanged. This affected-path control passed 1/1 in 22.44 seconds:
unstable origin `4202b036-c9c0-4b25-a7b0-aeb2ac5cc515`, historical origin
`757ee4a3-086f-437f-ab9d-85f2e8e31842`. No owner's executable was modified.

CI acceptance review found a persisted-binding consistency gap: a syntactically
valid binding could identify a current approved policy without coupling that
policy's actual subject/interpretation/raw artifact/refresh requirements to the
stored evidence. The CI author independently reproduced three controlled drift
failures on `0fef00b`; the integration owner's correction `97bf6bc` checks all four
properties against the same bounded current registry read. Catalog and retained
import paths supply those expected properties. A revoked or mismatched accepted
FAIL withholds the whole catalog rather than revealing an older accepted PASS.
This is controlled owned-state consistency testing, not a live signature forgery,
hostile-owner claim or actual model false-reuse demonstration.

The process-local authorization token is WeakMap-minted only after verification
and an exact selected-state policy interval. It binds original artifact bytes,
canonical evidence meaning and recipient scope; serialized tokens grant nothing.
Policy is revalidated under the existing run lock before pending/selector writes
and after selector persistence before pending removal. A late revocation leaves
the exact incomplete transaction fail-closed. Independent execution of the author
authorization, command, catalog and machine-control tests passed **30/30** on the
corrected source in about 1.09 seconds. Controlled verifier output is clearly
separate from live authenticated CI evidence; verifier native execution context
remains an explicitly locally approved prerequisite.

The disabled two-VM workflow `063e9b6` is within the approved hosted-runner scope
for controlled mechanics: fixed repository/task ref/event source, read-only token,
no OIDC/models/producer registration, one immutable same-run artifact ID, only
bounded envelope and manifest, independent source pack checksum match, explicit
exact-digest fixture acceptance and different boot identity. Receiver checks
require imported eligibility, null local invocation, no `runs-v1` and no configured
verification run; unrelated/relevant/restart checks remain separate. This does
not complete cross-agent or authenticated-CI gates. The later `256d008` read bounds
must precede allocation. Its 2 MiB per-attempt reservation must also be accounted
against cumulative owner-approved 10 MiB storage before another attempt, rather
than interpreted as an unlimited per-run allowance.

## Disabled signer data review and test registration followup

Independent execution of the disabled signing-proposal and machine author tests
on `7f32838` passed 12/12. Further independent controls exposed five malformed
inputs accepted by its inline signer validator: boolean envelope/predicate/
manifest schema values, boolean false exit code, and an incorrect inner subject
predicate digest. Python boolean/integer equality explains the first four; the
inner binding was not checked. All five produced a predicate in a bounded local
data-only reproduction. Signing remains disabled. The recipient envelope parser
rejects these inputs; no actual signature, imported CURRENT or model false reuse
is claimed. The integration owner is correcting the data validator; this owned
regression remains red until that correction is independently tested.

Correction `d70ade2` was then independently read and tested: schema values and
exit code require exact integer types, exact statement/predicate/origin/subject
structure and inner predicate digest are bound, and nonempty alternate OIDC
tokens are refused. The five malformed controls plus alternate-token refusal
pass 1/1 (six subcases), and the existing signer/machine tests pass 12/12. The
pre-fix failures remain above. This closes those bounded validator findings;
signing is still disabled pending the owner's explicit workflow/disclosure/trust
approval and no live authentication gate is certified.

The exact official `actions/attest` distribution at
[`1e69f48`](https://github.com/actions/attest/tree/1e69f48acb82d1966a394da916b4c1698aa569d6)
was read without executing it. Its 4,868,977-byte `dist/index.js` digest is
`3ca89e06ffcb09ff97e9b1633575865cad0b23310ac82176d72990d7554836b5`;
the pinned action runs using Node 24, distinct from the qualified Node 22.13
producer compiler. Relevant executed paths were inspected in the distribution,
not inferred only from TypeScript source: explicit fixed-file SHA-256 subject,
custom predicate loading, DSSE construction, Sigstore signing and repository
attestation persistence; the disabled OCI push/storage-record branch is excluded
by both fixed false inputs. Locked runtime dependencies include `@actions/attest`
3.2.0, core 3.0.1, github 9.1.1, glob 0.7.0, `@sigstore/sign` and bundle 3.1.0,
core 2.0.0, protobuf 0.4.3, OCI 0.7.2 and csv-parse 7.0.1. The official registry
tarballs for attest 3.2.0 and sign 3.1.0 matched the pinned lockfile's SHA-512
integrities; their relevant distributed signing/OIDC modules were inspected.
This is a bounded critical-path/dependency review, not a full supply-chain audit.

The bundled Sigstore provider races GitHub's audience-`sigstore` OIDC request
with a nonempty `SIGSTORE_ID_TOKEN` environment fallback. The proposed fresh
signer has no producer/repository code execution or producer-supplied environment;
nevertheless, an explicit refusal of an alternate token is recommended to bind
this route to its disclosed GitHub identity source. The public-good path contacts
Fulcio/Rekor and writes a repository attestation; signing therefore requires the
separate owner approval and public-disclosure review already described. Reading
the distribution or enabling unsigned controlled VM mechanics grants neither.

The unsigned VM correction `525d9a8` keeps the dedicated `redue-state` ownership
guard and requires one numeric artifact ID with the pinned downloader's explicit
single-artifact extraction semantics. Given the reported active artifact sum
4,132,113 bytes plus 2 MiB VM and 1 MiB package reservations (7,277,841 bytes),
that one unsigned attempt fits the approved 10 MiB/one-day allowance. Additional
attempts or signing still require fresh cumulative accounting. No OIDC/model/
producer-policy authority is introduced by that correction.

The test-only explicit grouping correction `48901be` was source-reviewed and its
registration repeated independently on Node 22.13: all eleven existing cases
equal the disjoint eight discovery and three recording groups. No assertions or
180-second group envelopes changed. The author's actual discovery suite recorded
seven passes and one initial expected-CURRENT failure with an unavailable ending
checkpoint; the separate recording group passed all three. A single targeted
diagnostic run later passed with healthy approximately 53–57 ms histories, but
the original failure lacked correlated diagnostics. Its cause remains unresolved.
These observations establish corrected registration, not clean combined runtime
acceptance or elimination of availability outliers.

The first actual unsigned VM attempt was reported failed before evidence upload,
recipient or model launch: local evidence was eligible, but portable export lacked
a complete origin. That is a preserved failed prerequisite, not two-machine reuse
or a proven timeout. The narrow `ee02b47` diagnostic adds a static timeout code only
when the existing bounded spawn reports `error.code === ETIMEDOUT`; commands,
environment, ten-second bound and applicability are unchanged. Independent pure
controls require generic unavailability for signal/exit/free-text cases and retain
known runtime refusal codes. Both diagnostic tests pass 2/2; the responsible phase
of the actual VM failure remains unestablished until captured evidence identifies
it.

The retained public logs `machine-88e-failed.log` and `package-88e-failed.log`
were independently read. On source `88e8828620c454d69ada41d4593d6105dc2b7d21`,
artifact `e10912264aa1a42c29cbdbc2b06fdcb2dd9617226fb23b970fc843e7b1108492`,
the machine producer recorded local origin `8ffdf893-8403-4e04-8a00-8768ad1f8678`
and received schema-1 healthy CURRENT/PASS with eligibility. Its wrapped run took
22,612.82 ms, synchronized query 853.00 ms and dry export 129.33 ms, then the
complete-origin assertion failed before transfer. The installed macOS smoke
separately failed the same export precondition after local eligibility passed.
These are individual failed samples, not a latency distribution. Both temporary
states were cleaned by their existing harness, so their unrecorded original
portable reason cannot be reconstructed.

Source review narrows, without choosing, the remaining explanations: portable
start/end capture, probe, manifest or runtime admission failure; differing complete
portable facts; or captured interpretation/export consistency. Local eligibility
requires a stable exited invocation, qualified local coverage and current observed
inputs/context, but does not require portable capture completeness. The elapsed
time alone establishes neither timeout nor cache-read responsibility. One fixed
producer attempt after `ee02b47` and diagnostic `c5a42d3` is justified to capture
the actual static receipt reason; no deadline, profile, ownership or applicability
guard needs weakening. Additional sampling depends on that new evidence.

The diagnostic reader was independently source-reviewed: bounded no-follow owned
marker, selected/immutable receipt agreement and selection revision barriers;
only reviewed static reason/stability/coverage/outcome classes leave the state.
An unavailable read reports only unavailable. Its pure classification and upgrade
units pass 7/7, with the corrected config-only policy invocation passing another
3/3. An independent hostile-string/object classification control also requires
no secret output and no freshness or reuse authority. These tests establish safe
diagnostics, not the missing complete origin or actual installed upgrade replay.

G2 still requires the **receiving agent** to obtain eligible evidence across two
independent machines, not merely independent VM CLI transfer. The approved hosted
VM route has no model credentials/execution approval, and the owner-local machine
has a different measured cache/build profile. Combining local cross-agent trials
with a separate CLI VM trial does not satisfy that handoff. The minimal remaining
capability is an owner-provisioned agent-capable independent machine with the
approved matched runtime content and account/capacity/resource boundaries (or
explicit approved agent execution on the existing matched VM). Claude inference
capacity is separately pending. No credentials, permissions or profile equality
may be manufactured to bridge these prerequisites.

The `bf904ad` installed-upgrade fixture correction is appropriate: project agent
file operations use the explicit selected config without embedding a state
override; stateful status/run operations retain the intended owned state. Its
author-reported attempt-2 replay and historical attempt-1 refusal remain separate.
The `b5bf327` acceptance map names source/evidence pointers and open gates rather
than calling test presence or both-host policy mechanics actual model acceptance.

Queued CI recipient helper `b5cbffb` was independently source-reviewed and its
19 controlled tests repeated successfully. Default inspection starts no process
and grants no trust; explicit application requires the state-selected current
policy, source/signer and outer/inner identity, a healthy direct-recipe observer,
then the actual existing authentication/import CLI and independent recipient
synchronization. The installed CLI/store remain authoritative for native verifier
byte identity, current policy and applicability. The entry-file checksum is
explicitly not whole-installation authentication. Neither controlled responses
nor this procedure establish live G3, two-machine model handoff or a saved run.

Machine inventory `f88b06b` was independently reviewed and its seven controlled
tests passed. Fixed read-only `df`, `diskutil`, `plutil` and `sw_vers` calls retain
5-second/32-KiB bounds and expose only selected public image/version/build and
writable APFS classifications. They do not warm the full portable runtime hash,
select a different verification profile or confer eligibility. Unknown, malformed
or non-writable filesystem facts stop before installation or checks. This is a
safer cause-capture prerequisite, not a correction to the original incomplete
origin or authorization to retry indefinitely.

Native Windows product CI for source `88e8828` exposed a test-harness limitation:
the disabled Ubuntu signer validator's positive process returned null status, and
seven negative assertions previously treated a non-completing interpreter as a
rejection. The exact startup error was not captured; no cause is inferred. The
independent six-subcase signer control now requires no spawn error or signal and
an integer nonzero exit before classifying rejection, with no predicate created.
These POSIX descriptor-validator execution controls explicitly skip Windows;
portable CLI/package tests retain their native Windows coverage. No deadline,
Python installation or system setting changed. This correction prevents false
negative-test passes; it does not establish signer execution on Windows or repair
the earlier overall CI result.
Author correction `bc92774` was independently read and repeated: the static
permissions/no-checkout check remains on every platform, while only interpreter
execution is POSIX-scoped. Its nine POSIX controls pass, as do the independent six
malformed/OIDC subcases. The actual native Windows combined rerun remains a
separate requirement.

Following the reported explicit owner approval, activation of the signing
workflow was independently checked against exact SHA-256
`5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924`.
The `.github/workflows/portable-evidence.yml` bytes equal the reviewed proposal:
fixed repository/ref/push, separate fresh signer, minimal signing permissions,
no signer checkout/lifecycle execution, pinned actions and bounded fixed data.
This enables that route; it grants no recipient producer acceptance and certifies
no live G3 result. The unchanged copied header still says disabled, so the tracker
must record actual enablement explicitly rather than treating that comment as a
security control.

Unsigned two-VM mechanics were changed to dispatch-only with the same fixed
repository/ref checks to avoid a second transfer on the signing push. The package
upload now checks both tarball and actual directory payload below 480 KiB; its
41-byte source marker and archive overhead fit the 512 KiB reserve. Static parsed
trigger/permission/action-pin/retention checks passed. Reported existing artifact
usage 4,290,318 bytes plus the 5 MiB signing-route and 512 KiB package reservations
totals 10,057,486 bytes, below the owner-approved 10 MiB. This clears one push only;
further pushes, dispatches or attempts require fresh cumulative accounting and
must not infer unlimited spending or storage approval.

Checkpoint diagnostic `face462` initially retained a call to the core's unbounded
receipt reader even though its journal/timing reads were bounded. An independent
owned FIFO selector reproduction returned null status/ETIMEDOUT/SIGTERM after
1.5 seconds and no diagnostic output. This is a new test-helper availability
finding, not a product false-current claim. Leaf correction `690f04a` routes the
receipt through the same 256 KiB no-follow/nonblocking regular-file reader;
missing, malformed, oversized or nonregular selection yields no receipt facts.
Its three pure controls pass and the independent real FIFO case completes in
approximately 42 ms with unavailable/non-green receipt diagnostics. No core
reader, assertion, deadline or system setting changed.

The frozen `59009f8` full run recorded 314 cases: 297 pass, one failure and 16
skips. The copied-Node caller mutation response was correctly non-green, but the
owned test searched a human reason for a structured error-code token. The CLI
sets `reason_code: PORTABLE_CALLER_CONTEXT_CHANGED`; the test now requires that
exact field and retains exit-2, non-CURRENT/non-reuse, immutable origin and zero
recipient execution assertions. The original failure is retained. One targeted
real handoff rerun followed completion of the overlapping supplemental suite;
this assertion repair does not retroactively declare the full run clean.

That one targeted actual run used a frozen archive of
`2beab5e8a4df80cd351402c27a915c7750d6841d` and passed 1/1 in 43,121.49 ms.
Origin `4406bef3-dad6-4448-942b-e9b12aaff614` and envelope
`d4d912e62f94ab86987654fe796033791eee5d9b1834f9ff82a1d9c2eb2ae789`
were retained across the byte-identical copied-Node recipient. The test required
eligible imported PASS, null local invocation and zero recipient compiler runs;
stable paused control, both actual metadata-mutation phases with exact structured
reason/exit 2/non-CURRENT/non-reuse, missing-release expiry, later recovery and
immutable original bytes all passed. Agent-visible JSON was parsed and asserted
in-process, not saved as a separate raw transcript. The private log and frozen
source identity are retained locally; owned temporary archive/processes were
cleaned. This is same-machine CLI boundary evidence, not model or G2/G3 proof.

## First established hosted portable failure classification

The retained signed-producer log for run `38094702115` was independently read.
Source `2bc636acf96b8652ff9dcac1d3aa846a3a9532d2`, exact package
`10ab71da58cd805010900a610b2ce0cb50adee375d697e898d90b8e049c0d71b`,
macOS 26.6.2/build 25G83, Darwin 25.6.0, ARM64, Node 22.13.0 and writable APFS
produced origin `0e4aacb9-a921-4462-b9ec-e97aaa6ee096`. The owned selected/immutable
diagnostic established historical PASS, stable qualified observation, no checkpoint
issues, incomplete portable origin, no captured facts and
`PORTABLE_PROBE_TIMEOUT`. The actual wrapper took 23,364.49 ms and its later
local synchronization 1,139.90 ms. These are individual samples. This static code
is emitted only for the unchanged enclosing spawn's `error.code === ETIMEDOUT`.
The start capture did not produce complete facts; the one retained failure code
does not distinguish the beginning and ending captures. No evidence upload or
signer followed the failed precondition, and no authentication/G3/model result is
established. The separate package-macOS run again lacked complete origin but did
not capture its reason; that run cannot inherit this one's diagnosis.

The source call path places all module startup, reviewed compiler implementation
checks, Node/helper reads, OpenSSL inspection, complete dyld-cache SHA-256 reads,
loaded-image checks, compiler input discovery/query normalization and result JSON
inside the single 10-second process budget. The cache's separate cooperative
10-second check starts within that budget after earlier work. No current log
attributes the elapsed time to cache I/O, hashing, startup or discovery. The
approximately 5.8 GB inspected locally makes cache work a concrete measurement
target, not an established remote cause.

The smallest justified next change is diagnostic only using the existing opt-in
monotonic profiler: correlate parent probe launch/completion with a safe work ID
and child PID; mark runtime and compiler-discovery stages; expose cache member
count/total bytes, member ordinals and coarse 128 MiB progress with completed
bytes and accumulated read/hash durations. Emit separate beginning/end capture
classifications without changing the receipt. No filenames, addresses, cache
digests, environment, private inputs or raw probe output need be logged. Bound
the event count and retain the enclosing/cooperative deadlines and all before/
after validations. A killed probe's missing completion is unavailable, never a
certificate. Review those diagnostics and fresh storage accounting before one
fixed captured attempt; no repeated benchmark or substantive optimization is
justified by this timeout alone.

## Bounded instrumented capture review

Independently reviewed `57c3a3d` adds existing opt-in monotonic profiler calls to
the parent probe, reviewed implementation, runtime and complete cache path. The
10-second parent/cooperative limits, full byte consumption, metadata/parent/image
checks, output parsing and applicability decisions are unchanged. Off mode does
not generate a work ID or per-chunk timing/progress writes. On mode measures read
and hash time separately; these overlap neither the complete member time nor the
parent total by addition. Logging can add cost and conservatively reach a deadline;
it cannot create complete facts. A missing completion marker remains unavailable.

The selected route is the existing controlled machine acceptance entrypoint,
limited to the fixed public repository/task-branch push and producer's actual
wrapped portable run. It creates an exclusive mode-0600 file in its owned temporary
directory outside the observed project. Two diagnostic variables reach the actual
compiler; this is explicitly an instrumented context. Inspection of the guarded
TypeScript 5.6.3 `tsc.js` and API environment reads, including dynamic polling key
construction, found no `REDUE_` reads or environment enumeration. The existing
Node/loader/proxy context is retained, not stripped or rewritten. This conclusion
does not authorize an exemption for arbitrary compiler or imported code. Prefer
this route to a separate replay that warms the failed run's inputs.

The report reader is bounded to 1 MiB, 4096 lines and 512 projected rows. It retains
only fixed phase names, bounded monotonic/work identifiers and nonnegative finite
numeric counts. Paths, environment, raw facts, private URLs, UUID cache identities,
arbitrary reasons and applicability fields are not projected. Child PID/work IDs
correlate partial start/end probes without claiming a complete capture or changing
the immutable receipt. Logging/read failure cannot repair origin. Ten pure machine/
phase controls independently passed on Node 22.13.0. The author separately reports
actual off/on/unusable-output fact equality; that native test was not duplicated.
The enabled signer remains exactly owner-approved SHA-256
`5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924`.
One fixed captured attempt is within the reviewed route only after current storage
accounting; no deadline increase, cache omission, producer acceptance or model
authorization follows from this review.

## Contributor platform test correction

Independent inspection of `5d48626` confirms `.gitattributes` pins LF only for the
two approved signer YAML files, preserving the exact existing SHA assertion rather
than normalizing its input during verification. A disposable Git checkout with
`core.autocrlf=true` requires those bytes unchanged. The other change uses native
`path.join` in the expected configuration path, matching the implementation.
Fourteen affected tests passed on a frozen archive with existing dependencies
linked read-only; no installation scripts ran. The first direct worktree attempt
could not import its absent `yaml` dependency (three other tests passed); the
explicit archive run repaired only that test prerequisite. Native Windows
revalidation remains pending, and its earlier two failures are preserved.

## Captured hosted cause and bounded remedy proposal

Independently parsed all 90 projected rows from signed producer `38095795547`,
source `3f8117c97973a4415a7341ac826975853123dc00`, package SHA-256
`7e635a96da36418a364bea454a6170ac793430e3310f936c1f09726c40e9f110`.
Both actual portable child processes enumerate 13 members totaling 5,820,973,056
bytes and expire at their enclosing 10-second deadline while consuming member 5.
Neither logs cache completion or the beginning of compiler discovery. Member 4 is
the last fully completed member in each capture: 2,678,898,688 bytes cumulatively.
The last progress reports are 3,349,987,328 and 3,618,422,784 bytes, respectively;
progress is not completed validation. Parent totals are 10,038.1 and 10,009.0 ms.
In the first capture member 1 reports 4340 ms reading and 987 ms hashing, member 4
1292/283 ms, and partial member 5 1448/324 ms. These instrumented partial samples
establish cache consumption as the timed-out phase and show read cost dominates
those measured segments; they do not establish its underlying storage cause or a
complete uninstrumented duration. Historical PASS/local healthy CURRENT remain
separate from incomplete portable origin/facts absent. No upload, signer or model
followed the failed gate.

Current enclosing limits were traced: each original beginning/end capture uses
the fixed portable child deadline independently; cache consumption has its own
cooperative limit inside that child. Caller proof happens before the control
timer. Recipient full capture occurs inside the daemon synchronized request.
Ordinary macOS control/checkpoint default is 15 seconds, Windows 30; ordinary
compiler/certificate probes retain their own 10-second limits. The acceptance
command envelope is 120 seconds, producer job 20 minutes and signer 8 minutes.
An increase to only the cache timer cannot defeat the enclosing child deadline;
increasing only the child can leave recipient IPC expiring before its response.

The smallest defensible proposal is a portable-only finite resource envelope:
30 seconds per origin capture, 25 seconds cooperative complete cache inspection,
and 45 seconds for an imported-evidence control decision. Caller and daemon
portable-validation loops should each share a 30-second monotonic aggregate
budget, with each built-in child limited by remaining time, so multiple accepted
checks cannot multiply the control path into many minutes. Other recipes/probes
and ordinary control decisions retain current limits. These numbers provide
explicit headroom for the measured partial throughput, not a guaranteed success
forecast. No automatic retries, prewarming, member omission or certificate cache
is proposed. Every complete byte/directory/runtime check, both execution
boundaries, post-work catch-up, raw caller interval, selected receipt/catalog and
durable publication guard must remain authoritative. Expiry is non-reuse.

This is an availability/resource change, not a new equivalence/trust exception or
changed fact identity, provided those conditions hold. It needs coherent source
and independent review before implementation is called accepted, plus controlled
expiry, multi-check budget, during-work edit/restore, cancellation and newer
selection tests. `spawnSync` can defer signal delivery up to the hard process
bound; tests must preserve the actual interrupted outcome and lock ownership,
not promise immediate cancellation. No further remote attempt is authorized by
this proposal alone. Record the finite resource decision and account for its
worst case under existing owner caps; no permission or workflow widening follows.

## Finite budget implementation review and actual boundary control

Independent review of `41e66ac223682f525d969062a4711df211d7f565` confirms the
portable-only 30-second child/caller/server aggregate, 25-second cache and
45-second imported-decision IPC limits. Beginning and ending origin captures
receive independent budgets. Each child timeout is capped by remaining time
after recipe validation; exhausted/nonfinite/backward clocks stay exhausted.
Parsing, caller proof canonicalization/hash, completed fact/context construction
and daemon proof comparison are followed by expiry checks before authority is
retained. This closes the initial author diff's post-hash expiry gap. Ordinary
compiler/certificate/checkpoint paths, environment, command, observation and
durable selection semantics are unchanged. A completed early check can retain
its independently validated facts; an expired later check receives no proof,
and the same aggregate budget cannot be renewed for another child. This is not
continuing authority based on elapsed time.

On a frozen archive of that exact source, one focused actual test passed in
27,960.72 ms. Healthy origin `db42ea6e-34dc-47f5-98e8-1aa4cc4cdba4` first recorded
complete portable PASS. A real SIGTERM sent while the first built-in cache
inspection was active produced a newer immutable interrupted invocation with
null result, non-reuse and released run ownership. No immediate cancellation
claim is made: synchronous inspection can defer signal delivery. A separate
real run changed/restored a relevant source with independent observer sync
while the ending cache inspection was active. Its actual compiler PASS stayed
historical, but selected origin `b1ab09c1-6ca1-473d-9b87-9d03471b8511` was
unstable/incomplete due to input events and remained non-CURRENT/non-reusable
after status and restart. Original immutable bytes survived both cases. Safe
work IDs and monotonic completion timestamps established actions occurred
before the corresponding actual inspection completed; no sleep or substituted
compiler manufactured this precondition. Diagnostics were explicitly enabled
in the owned fixture. No model ran. The private source-specific log is retained
locally and owned temporary archive/observer processes were cleaned.

Independently reviewed and executed B's test-only `c35371a` on the same frozen
source: 14/14 controls pass. They cover finite constants, shared/nonrenewed and
separate origin clocks, rounding, permanent invalid/backward expiry, zero child
launch after expiry and one actual standalone 50-ms child timeout. That last
case is resource fault injection, not compiler qualification or economics.
These controls plus source review do not prove a matched VM can complete full
inspection within the new envelope, nor certify combined platforms, models,
signatures or G2/G3. One accounted hosted attempt remains a separate gate.

## Next-attempt storage and workflow review

On root `1a3e680`, independently read GitHub's artifact inventory: total/returned
count 45, active count 45, active bytes 4,608,374. Adding the reviewed signer
reservation of 5,242,880 bytes and one package ZIP reservation of 229,376 bytes
gives 10,080,630, below the owner's 10,485,760-byte cap by 405,130 bytes. This is
a point-in-time accounting check, not authority for overlapping unreserved runs.

The pending package workflow writes source identity before summing the complete
payload; exactly four expected entries must be regular files (symlinks are
refused): npm's actual tarball filename, manifest, SHA256SUMS and source.txt.
Both the tarball and total payload are under 192 KiB. A 224 KiB ZIP reservation
provides bounded overhead for these four fixed short names; existing one-day
retention, run/attempt-specific immutable name, no overwrite and read-only job
permissions remain unchanged. No new artifact type, signing permission or state
transfer is introduced. The separately enabled signer still hashes to exact
owner-approved `5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924`.
Bounded GO is for one accounted next hosted attempt with reviewed finite budgets,
not producer acceptance, model access or a successful G2/G3 result. Recheck usage
if any additional upload occurs before that attempt.

## First live signed artifact inspection

Producer/signer run `38096670987`, source/signer commit
`d04b872ee0e848e300c0cc9738ad761e48146acc`, completed successfully. Independently
checked preserved downloaded ZIP ID `11685889769`, 34,300 bytes, SHA-256
`d5469b8c9f49aa7bca1c7ecadf2a220de21437aa019bdb2722cb87c0cd6b6a29`.
The 20,160-byte envelope has raw checksum
`eb25768d3073dac37a78059efe94bfaab4a91f553dab7e208b05b940ea56dba6`
and canonical evidence digest
`5d16fbf6b101f88843f41a8c61d3c351e5f9e600306dc4936eaaec8d6ea40d57`.
Strict parsing preserves complete historical PASS origin
`02f44ac7-e6fc-4d5e-9757-28357654fef1`, direct compiler recipe, 130 declared input
records and current @2 interpretation. The outer DSSE statement names the exact
envelope byte checksum and binds its inner digest/interpretation; parsing that
statement alone is not authentication.

One reserved actual read-only `verifyCIArtifact` call completed with the reviewed
native GitHub CLI 2.79.0 executable checksum
`615cad3ec927069096ae07bda453152fcbf485928a6b5c24373a3631891b92a4`.
The in-memory **inspection proposal**, never installed as an accepted policy,
requires public repository `msiric/redue` ID `1403689333`, owner ID `26199969`,
the exact approved workflow/ref, source/signer commit above, issuer and exact
outer/inner identities. Required online lookup produced one verified attestation
accepted by the bounded strict certificate/statement/timestamp parser. Result:
`producer_verified: true`, `producer_accepted: false`, `local_policy_current:
false`, `reuse_eligible: false`, `globally_latest: false`. No policy registry,
import, trust/account setting or model changed. The private mode-0600 structured
result is retained locally. Early ad hoc projections used incorrect envelope
field names and failed before verification; actual schema inspection corrected
them without a second authentication attempt.

Independently parsed both complete runtime reports from inventory run
`38096673747`: both report supported prototypes. Their full 21 runtime records
are exactly equal to each other, to the signed producer manifest and to its
captured runtime facts; reviewed compiler 5.6.3 implementation checksum also
matches, and canonical manifest profile checksum verifies. This is actual full
content equality, not label-based inference. It does not establish that a
recipient independently queried eligible evidence, imported it under current
approved policy, or avoided equivalent compiler execution. Local development
runtime remains different. Receiving-agent, cross-agent, V01–V22 and complete
economics gates are still pending; one live authenticated artifact is progress,
not G2/G3 or release readiness certification.

## Exact recipient proposal and amended host preparation review

Independently reviewed Lane B `68fcde5` as a disabled preparation, not producer
acceptance. The selected policy digest
`bab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6`
binds the exact source/signer, immutable repository and owner IDs, workflow/ref,
outer and inner identities from the live inspection above. Its required online
refresh remains explicit; the local bundle is not a substitute. The proposed
JSON is not a producer registry. The recipient YAML remains outside active
workflows, its job is unconditionally disabled, and a second mandatory stop
refuses downstream preparation even after synthetic descriptor syntax passes.
There is no policy writer, authorization token, import or model launch.

Ran all 25 pure controls independently on frozen root `d04b872` with exactly
B's four-file overlay: 25/25 PASS, actual Node 22.13.0, 908.95 ms. Existing
installed dependencies were linked read-only into a disposable archive; no
installation scripts ran. An initial test against the leaf's older whole-tree
ancestry gave 24 PASS / 1 policy-interpretation rejection because that tree still
used @1. It is retained as an incorrect test-source combination, not silently
reported as current @2 acceptance or a product defect. Both private logs are
retained; no additional live verifier call occurred.

Before an enabling diff, owner approval of exact workflow bytes must be bound
out of band: putting a workflow's own final byte hash into that workflow is
self-referential. Negative process tests must also assert integer completed exit
status rather than treat an interpreter that never completed as a rejection.
These points were sent to the author; neither bypasses the present disabled
job/mandatory stop. Bounded GO covers owner review of this precise policy and
preparation only, not trust installation or live recipient acceptance.

Light source review of Lane D's corrected D4/native-Claude preparation preserves
the explicit owner-approved Copilot producer / Claude receiver amendment, with
Codex acceptance separate and all applicability/trust gates retained. Current
official Claude documentation describes setup-token subscription OAuth for CI
and a one-year token; installed 2.1.146 help/status is separated from newer
documentation and a successful version/status command is not model execution.
The proposal now specifies a protected Actions environment with selected run
ref and required owner approval, discloses other workflows can request that
environment, and never claims a secret name scopes repository-wide access.
Deleting an Actions secret is not provider credential revocation. Exact workflow,
trusted binary, host policy, included capacity, producer acceptance and the actual
in-context recipient gate still precede all model calls. This is docs-only GO,
not token generation, account administration or host behavior acceptance.

Primary references: [Claude authentication](https://code.claude.com/docs/en/authentication),
[Claude GitHub Actions](https://code.claude.com/docs/en/github-actions), and
[GitHub environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## Concrete disabled recipient route review

Lane B `87b7df9`, over coherent root `ad2e78d`, resolves the earlier concrete
review findings. Native verifier reads use a separate 128-MiB capped, no-follow,
nonblocking regular descriptor with single-link, file fingerprint and parent
identity checks; the 1-MiB evidence reader is unchanged. Explicit registry
provisioning requires exact owner-selected bytes and initialized dedicated
state, refuses local/imported history and existing targets, uses exclusive
mode-0600 descriptor writes plus fsync, and revalidates owner bytes/physical
identity, parents and written leaf before returning. A controlled owner change
at fsync is rejected; an ambiguous failed copy remains for inspection, never
authentication continuation or automatic repair.

Independent frozen `ad2e78d` plus seven proposal-file overlay: 84/84 focused
controls PASS in 2,979.52 ms (65 new preparation/download controls, 19 existing
recipient controls), actual Node22.13.0, existing dependencies read-only and no
installation. The positive preview launches zero processes. Precise failure
codes now distinguish changed policy, transfer, verifier, source and occupied
state. Controlled download tests run the actual bounded extraction/metadata
script with fake HTTPS/API records, not an actual signature verifier or VM.
The full local log is private; no additional live authentication occurred.

The queued route pins the selected successful producer run/attempt/ref/source,
repository IDs, artifact identity and ZIP digest, fixed three regular members
and their exact bytes, canonical evidence interpretation, official native
verifier bytes and independently packed producer package. Current receiver
runtime equality and different boot/raw Node identities precede initialization;
recipient synchronized applicability remains independently authoritative. The
procedure never runs the verification command locally. It checks imported
provenance, null local invocation, no local runs, unrelated-edit preservation,
restart inheritance and relevant-edit invalidation. It does not establish model
behavior or ambient process absence.

Registry proposal bytes SHA-256
`5a1021fcf9b119f4469370eb33c09dc35c62cb174bc272574065a382aae6d521`
and the exact policy digest above remain outside authority-bearing state. Job
`if:false` and missing reviewed registry-source pin prevent enablement. Workflow
approval is now explicitly out of band. Bounded GO is to present this concrete
route, policy and provisioning action for owner approval, not to install trust
or enable it. Preserve exact approved bytes across platform checkout line-end
conversion; do not normalize a mismatching policy during import. Live recipient
acceptance, actual two-machine agent reuse and complete-path economics remain
outstanding.

## Controlled instruction and native Claude proposal review

Reviewed Lane D `bafb2ec`, `fc408f6`, `a0d2012` and `9653b26` as contributor-only
preparation. The role-specific producer appendix explicitly selects portable
capture for the configured compiler; the receiver keeps the installed shared
policy and does not receive a task-specific reuse directive. Export, import and
producer trust remain separate owner operations. New guidance destinations are
exclusive and mode0600; source policy, config and exact owner physical identities
and parents remain bound across publication. Distinct root/state/prefix resources
are required. Failure cleanup removes only unchanged created content and preserves
a concurrent owner edit in the same inode.

Independent coherent `ad2e78d` plus final `a0d2012` five-file overlay: 12/12 PASS,
142.38 ms, actual Node22.13.0. Prior `fc408f6` overlay 11/11 PASS, 133.34 ms, is
retained separately. Both are pure/owned filesystem controls; no credentials,
host process or model were invoked. The subsequent narrow `9653b26` diff
explicitly refuses Windows writer execution before touching files and skips
only POSIX fixture mechanics there, with a native Windows refusal control.
Fixed macOS proposal paths now use POSIX data semantics on every test host.
That diff has independent source review, not a native Windows behavior result.

The native Claude invocation builder creates unverified proposal data only and
its activation function always refuses. It cannot turn help output, a static
settings key or a boolean approval into permission or secret-denial proof.
Actual matched-profile, managed settings, exact socket/network/resource controls
and non-secret credential-sentinel preflight must succeed before real OAuth is
provisioned or any model launches. In particular installed2.1.146 is not assumed
to implement current documentation's later credential scrub. Bounded GO permits
owner review of this disabled proposal and controlled generic fixture setup;
it certifies neither native Claude enforcement nor actual instruction discovery.

A separate root Copilot preparation review is not yet complete. Its original
87de9c5 five author controls independently pass, but an additional no-process
control demonstrates that a private home ancestor of the writable workspace
was accepted. Opposite-direction directory overlap and descriptor-bounded
executable reads were requested before concrete proposal approval. No model or
sandbox-enforcement claim follows those mechanics.

## Guarded Copilot no-model preparation review

Root `9824ed5` corrects the reviewed preparation defects without enabling a
model. The executable reader now streams bounded descriptor reads, rejects
nonregular/hardlinked/writable leaves and unsafe parents, binds complete bytes
and physical metadata before each inventory command and after inspection, and
never uses an unchecked path read to allocate the binary. Symmetric path-overlap
checks refuse private directories both inside and around exposed resources,
and overlapping private directories. The module accurately states that three
explicit no-model inventory commands may execute; no inference launcher exists.

Actual frozen root `46e7a1a`: six controlled tests PASS, 95.28 ms, Node22.13.0.
These tests substitute inventory responses; no Copilot binary or model was run
by this reviewer. The original five-control PASS and additional accepted private
home-ancestor counterexample are retained, not rewritten into prior success.
The fixed preparation still reports entitlement/enforcement/readiness false.
GO is for this disabled owner-review proposal, not effective managed permissions.

Before a real model route, the writable state grant needs explicit native proof
that trust/owner/runtime authority files cannot be modified while permitted
REDUE commands still work. The proposed Claude data has a deny-write entry for
producer policy; Copilot's current broad state grant does not itself establish
that boundary. An instruction forbidding automatic trust is not a filesystem
permission. Use actual supported policy and no-model sentinel controls, never
invent settings or bypass the sandbox. The state directory/socket scope and
approved daemon probe authority remain prerequisites. This concern is separate
from the data-only recipient workflow, which launches no model.

## Final data-only recipient enablement proposal

Independently inspected the not-installed root proposal
`docs/contributor/portable-ci-recipient-enable-proposal.yml`, SHA-256
`ef237cbb411b0520791911503d3071a9a42f78502ac8f712406a11566482ef78`.
It pins helper preparation and registry source to
`a23843e171f206e404574d97a59b2d86abc9a0c0`; the helper blob is exactly identical
to independently reviewed B `87b7df9`. Registry bytes/policy remain the exact
reviewed digests above. Comparison against the reviewed disabled YAML found only
the explicit repository/push/ref guard, fixed preparation/registry source and
status comments/name changed; data extraction, authentication and application
procedures are unchanged. An initially supplied nonexistent abbreviated ref
`526bad` could not be compared; the actual reviewed B source was used instead.

Static parsing/assertions pass: only the dedicated recipient push branch, exact
repository/event/ref guard, read-only contents/actions/attestations permissions,
macos26 and 20-minute envelope, both checkout sources immutable with credentials
persistence disabled. There are no uploads, OIDC grants, model secrets, inference
commands, arbitrary prompt/ref inputs or signer modifications. This data-only
route deliberately evaluates the fixed signed compiler origin, not an agent-
produced artifact. Applicable imported provenance and recipient-owned current
evaluation remain required; signature identity cannot manufacture CURRENT.

GO permits requesting explicit owner review of these exact workflow bytes, exact
registry/policy and limited fresh-state provisioning. No active workflow copy,
branch trigger, policy file, import or authentication was performed by this
reviewer. Model-route authority-file permissions are a separate unresolved
prerequisite, not a reason to silently expand this no-model operation. A new
artifact/run, expired download, mismatching profile or changed approved bytes
requires reevaluation rather than an implicit trust or identity substitution.
