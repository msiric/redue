# Portable evidence: independent boundary review

Current conclusion: bounded parsing/inspection, separate-store conflict policy,
original-run interval capture, caller interval validation and delayed recipient
publication have independent controls. The versioned content profile has real
same-host copied-executable handoff evidence. Current CI-policy/subject coupling
has controlled authorization and corruption regressions; it is not live signing.
Two-machine execution, actual cross-agent acceptance, authenticated CI and release
gates remain pending.
The first hosted machine and installed-macOS attempts stopped at incomplete
portable origin despite eligible local evidence; their responsible phase is not
established. Diagnostics preserve that distinction rather than repairing origin
from a later local CURRENT response.
REDUE-PE-001 G1–G4 are not certified by
this document. Baseline inspected: `b4f286034f43021a74f1babf2c1d0fee5df2a9e5`.

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
