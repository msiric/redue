# Portable evidence: independent boundary review

Current conclusion: parser/store, origin/caller/publication and current CI-policy
boundaries have independent controls. Actual same-host relocation and copied-Node
handoffs pass. One owner-approved authenticated two-machine CLI recipient run
38123365552 establishes CURRENT/PASS imported evidence without equivalent recipient
execution on frozen d04/8695 bytes; it is not receiving-agent reuse. Actual model
handoff and native host enforcement remain pending. Exact b812 candidate checks
pass separately on macOS/Linux/native Windows, and source05 product regressions
pass separately. Candidate version remains alpha10 metadata, not final release
identity. The complete one-sample installed sequence adds measured command work
rather than establishing net benefit. No G1–G4 or owner-release certification is
made here. Original failures, unavailable native prerequisites and immutable
pilot receipts remain retained. Three specifically approved native synthetic
preflights stopped before command submission; a separate startup-only SAVE_CURSOR
diagnostic completed. Native checker enforcement remains unverified. Custom
terminal decoding has stopped; any owner-operated alternative needs a concrete
reviewed procedure and new specific approval. Pinned187 manual commands default
to requesting a model response; the prior3018 proposal did not disable that
behavior. All actual attempts stopped before command submission. A future
procedure must explicitly bind automatic responses off before it can satisfy
the no-model boundary. A later owner-operated attempt ended its outer
window without retained checker output; its checker execution and model count
remain unknown.

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

## Native Claude version-boundary preparation

Independent light review of D `3d1d4f5` and `b5ae542` confirms the pinned
[official changelog](https://github.com/anthropics/claude-code/blob/2301018b1f61073c501a8e7a4813ef48c239163b/CHANGELOG.md)
introduces `sandbox.credentials` in2.1.187, `failIfUnavailable` in2.1.83 and
`allowUnsandboxedCommands` in2.0.30. Version2.1.260 explicitly changes manual
`!` commands to run outside the sandbox even with strict mode. Therefore the
installed2.1.146 cannot establish the proposed credential-denial boundary.
The isolated official187 binary independently hashes to
`a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3`,
215,994,048 bytes, matching its retained official manifest. It was not executed
by this reviewer.

GO is limited to constructing a data-only exact bootstrap map: fresh canonical
configuration/GH/workspace directories, independently reviewed strict settings,
zero authorized Bash/model actions, no UI input/auth copies/HOME or global
changes, and a60-second envelope. Root's subsequent bounded UI-only startup
authorization still requires reviewing those actual files/paths first. The
first onboarding/login/trust gate stops the operation without input. No startup,
credential/sentinel check or inference has occurred in this review. Config-dir
credential-service namespacing does not prove complete keychain isolation;
version/source support does not certify effective sandbox enforcement or zero
background network activity. A future interactive strict-shell sentinel check
requires its own exact reviewed command and actual tool-boundary evidence.

Actual bootstrap map/settings `785be21b4576e0ad7037f761d4a3ee852a5ea6c12bd9245aa17af577acf698cb`
have the expected fresh owned700 directories and600 single-link settings, with
zero input/actions and strict empty MCP. Nevertheless startup remains stopped:
the digest-verified187 implementation's `n9r()` (offset196897759) returns
managed policy hooks when local `disableAllHooks` is true unless the managed
policy itself disables hooks. Its `M_e()` (offset207250411) honors
`DISABLE_UPDATES` then `DISABLE_AUTOUPDATER`; the map supplies neither. Tool
denial is insufficient to promise no startup-hook execution or normal-install
updating. This establishes source possibilities, not that hooks exist or an
update ran. A supported process-only updater-disable setting and read-only
presence/key inventory of actual managed-policy sources require review before
startup. Do not alter managed policy or generalize these observations into
native enforcement acceptance.

The revised bootstrap map
`40a72b761b80b88fbc8123550b778efa66839d530aed50866775fef761e2a6d2`
retains settings785 and adds only process-local `DISABLE_UPDATES=1`; inventory
`fedc383bb9de18a54ddd7818b9cc1cf58e942bd189da6861e023e0a19a9c440f`
records four local managed sources absent. Independent exact187 source inspection
confirms macOS managed file/fragments and device/per-user preference selection;
independent `lstat` checks find all four absent without reading contents. Its
updater predicate and [official environment documentation](https://code.claude.com/docs/en/env-vars)
support the scoped guard. Files remain canonical, current-user owned600 and
single-linked. Final bounded GO permits root's already-authorized UI-only startup
only after the listed immediate currency/absence rechecks, with zero keyboard,
Bash, model, authentication or trust actions, first-gate stop and60-second cap.
This reviewer did not start native Claude. GO is neither effective sandbox/
credential acceptance nor a claim of zero background network/keychain activity.

The sole root-authorized UI-only startup was independently classified from its
protected2,740-byte capture as `INITIAL_THEME_ONBOARDING_GATE`: ANSI-stripped
output contains the choose/theme prompt and Welcome/Dark/Light terms, with no
login/trust/error terms observed. The original unclassified report stays intact;
a separate clarification records this observation. No raw transcript is published.
There was no keyboard, Bash, model, authentication or trust action. The owned
process required SIGKILL and was reaped after its SIGTERM grace period. Reaching
this initial UI establishes startup capability only; the shell prompt, native
credential/sandbox enforcement and actual model behavior remain untested.

## Fresh CI recipient precondition correction

Independent source review of B `1492a67a3174571cf29174fdb7eb05fb3e2133a0`
confirms the hosted `CI_MACHINE_OBSERVER` failure came from requiring a
receipt-derived `verification_recipe` field in an intentionally receipt-free
row. The failed run38098482463 is retained. The focused helpers now bind the
public/runtime locally configured direct recipe, exact local Node/compiler argv,
built-in probe, inputs/environment, owner and empty history before authentication.
Compiler path resolution with `verify:false` is expressly not qualification;
independent installed probes still establish applicability. The shared fresh
observer guard requires healthy UNVERIFIED with null result/invocation and no
reuse, without inventing receipt metadata. Config mismatch, duplicates, existing
history/imports and failed observer gate stop before authentication. The actual
pending-store filename is checked rather than an unused plural spelling.

Actual coherent root `b1d10f7645aaf3fdc9c8cf1cde15c94c3eb3b6da` plus the exact
four-file149 overlay:104/104 focused controls PASS,2,789.19ms, Node22.13.0.
Existing root dependencies were linked read-only; no installation, authentication,
compiler/model or remote operation occurred. Post-import CURRENT/PASS, imported
origin/digest, null local invocation and absence of receiver execution requirements
are unchanged. GO is limited to this focused acceptance-harness correction, not
successful live recipient acceptance or cross-agent reuse.

The subsequent actual installed fresh-config control uses helper source
`a2f2ddc613d1a3d2dfbe5f4f04e97cd69584bc6b` and unchanged d04 tarball8695.
Its private record shows installation/preview/init/start/sync/stop exit0, a
425.37ms healthy UNVERIFIED/no-receipt query, no local run/import/model or policy
creation, and successful binding of the generated config/runtime by the corrected
helper. This establishes actual installed onboarding for this precondition,
not portable matched-profile or G3 acceptance.

Independent corrected-workflow proposal review verifies exact SHA-256
`a600688881452915bde3f63a9dc60d21d952c65a9b4efe3db2c14860976a5d6f`:
only two immutable helper/registry source pins change from a238 to a2f2ddc;
both helper files at a2 match independently reviewed149 bytes. Registry5a1021,
policybab79, producer d04/artifact8695, runtime/ref/read-only permissions and
strict post-import controls remain unchanged. The original ef237 proposal stays
preserved. Actual corrected plus existing workflow controls43/43 PASS,2,969.13ms,
Node22.13.0; controlled subprocess/data responses are not live authentication.
GO permits exact owner review of the revised source pins, not active workflow
installation, triggering, producer acceptance or recipient CURRENT. A previous
authorization for different helper bytes is not silently extended to this proposal.

## Copilot manual-shell source preparation

Independent read-only inspection of the pinned1.0.91 distribution app.js
(7,593,700 bytes, SHA6d0149041a57d909979096bb0ca3b92c14d05b1a2768d21cce7e8461dc18300d)
confirms the interactive `!` handler strips the prefix, binds cancellation and
calls `W.shell.executeUserRequested`, without a `W.send` in that handler. Its
SDK binding passes environment to the native secret filter and invokes
`session.shell.executeUserRequested`. The other exposed SDK shell entry invokes
`session.shell.exec`: distinct method names do not establish identical native
sandbox/credential enforcement or prove the full model-tool pathway. Current
[official shortcuts](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
support no-chat manual `!`, while `$` hands over to a real shell and stays
outside this candidate.

B5ec891d accurately keeps these limitations, keychain fallback and managed
startup-hook constraints explicit. Fresh configuration/cache/GH directories do
not establish every credential source absent; no policy hook may be disabled to
create a result. GO is for source-only candidate preparation, not native UI,
shell, authentication, model or settings execution. No native process was run
by this reviewer.

The initial disabled Claude startup proposal has a concrete pre-live auth-input
gap: exact187 `W5`/`ekt` read OAuth/API file-descriptor environment inputs, and
`qFr` reads custom request headers. Three independent pure controls demonstrate
its initial `require_ci` accepted those keys alongside a controlled non-secret
OAuth fixture; zero native processes were launched. Presence rejection and
actual profile/host-provider override guards were requested. D also caught the
env-OAuth auth-status route's different `oauth_token` classification before live
authentication; a cached `claude.ai` status is not its expected result. Remote
managed-startup-hook uncertainty must not be hidden by local file absence or
tool denial. Revised auth-status-only preparation remains independently pending;
no secret, authentication or native UI operation followed these findings.

D19c5db7 plus04e2f0f replaces the token-bearing proposal with data-only code,
not a broader startup workaround. Exact helperSHA
`20a24e8e99c56d70c3b10e24b14e9efb192087383b9b9a3ea64290408b78d1c1`
has no native/subprocess launcher, filesystem bootstrap or secret activation.
It rejects presence of alternate auth/startup inputs and the future approved
OAuth key itself, even empty. Correct data context always returns
BLOCKED_NATIVE_STARTUP_BOUNDARY/native0/can_infer=false. The synthetic sanitizer's
oauth_token/firstParty mapping matches exact187 source but establishes neither
token validity nor subscription capacity. The earlier three accepted-input
counterexamples remain historical, not retrospectively erased.

Revised outside-.github workflowSHA
`01208b4d2f9c496fe8dfdc2cae7d58a61313c7fdcaa17184436a87d3e05a650c`
has no secret reference/protected-environment release/native download/auth/UI/tool
call/upload/OIDC. Its literal helper source must be repinned after integration
before any separately approved registration. Actual independent focused controls
2/2 PASS,324.62ms, Node22.13.0; no native or authentication process ran. Source
GO permits integration of this disabled preparation only. There is no reason to
request a year-long OAuth token merely to learn token presence. Safe unblocked
work is focused integration, local regressions, artifact/onboarding preparation
and current evidence reconciliation. Native acceptance requires owner-supported
normal onboarding/prompt plus actual reviewed sentinel enforcement, exact trust
file/socket controls, matched profile and approved capacity. None is supplied by
a static proposal, a data record or first-theme UI.

B207ecdea adds a disabled first-start record only. Independent source review GO:
the native UI remains BLOCKED until owner/provider-provisioned credential-free
startup and actual managed-policy/hook scope are established. Runner labels and
fresh config directories are explicitly insufficient. Two bounded source
approaches did not establish an authoritative cheap absence check; no new
helper/workflow, keychain inspection, native process or model followed. This
record preserves the stopping rule and does not grant host authority.

Root567e3ba replaces the circular author-commit assertion in the disabled Claude
data-only workflow test with exact reviewed helper SHA20a24e8e99c56d70c3b10e24b14e9efb192087383b9b9a3ea64290408b78d1c1
and an immutable literal source requirement. Its selected source
567e3ba685a579ba6dbf89d452e503c90c51ad14 contains those exact helper bytes and
updated tests; the actual job separately checks checkout HEAD and helper SHA.
The final proposal diff changes only the reviewed source pin. Independent
controls 2/2 PASS,122.57ms, Node22.13.0; the earlier pin-preparation assertion
failure remains historical. No secret, native execution, authority, active
workflow or model capability is added by this test/source correction.

Independent source GO for D5d869099 plus729763103: optional installed-smoke
complete-path sample retains portable creation/final query/export preview/export/
inspection/import preview/apply, eligible/cached/unrelated/relevant decisions,
required ordinary local rerun/final query, and restart/inherited local evidence.
Plain initial/relevant compilation executes the exact locally resolved configured
argv, with root/state/cwd/qualification/Node/compiler binding checked. The
immutable origin, imported history and new local outcome remain checked.

All measured subprocess durations are disjoint; the inclusive policy-upgrade
helper is not counted again internally. Actual workflow wall time is measured
directly, and setup/control/cleanup commands remain separately visible. Failure
reports retain timing and cannot support a favorable comparison. The summary
explicitly withholds avoided-execution, causal whole-task, model and two-machine
claims. Independent pure tests2/2 PASS,61.25ms, Node22.13.0; syntax PASS. No
installed sample was run by this reviewer. Approval is for the predeclared single
controlled same-host noLib mechanics sample using preserved d04/8695 bytes,
not new benchmark distribution, adoption or gate completion.

Current product-source CI38099703953 four jobs PASS on892f603 (472 tests/job)
is separate from prior exact frozen-package matrix38096673730. Its native
Windows independent repack5e3a/159042 bytes differs from frozen8695/158105
bytes; source acceptance must not be relabeled as frozen-artifact acceptance.

The first actual ccba93d installed sample stopped before portable work at a
harness cwd representation assertion: runtime stores the configured "." and
declared-plan resolves it against root. Retained report has33 command timings,
zero portable-workflow commands and zero model/two-machine trials. This is not
an engine or complete-path economics failure. D10289b28 source GO resolves the
nonempty declared cwd physically and requires exact owned-root equality, retaining
root/state/qualification/Node/compiler/argv guards. Independent controls3/3 PASS,
51.43ms, Node22.13.0; syntax PASS. The original failure remains retained before
one justified preparation-corrected sample, not a favorable-score retry.

Root85a7ecb applies LF checkout attributes only to the reviewed disabled native
helper.py and proposal YAML. Exact-byte digest assertions remain unchanged, and
no global Git setting, native startup or authority is changed. Source GO is not
a new native-Windows test result; that platform recheck remains pending.

The second actual3a65311 complete-path attempt reached portable creation, export,
import, eligible/unrelated decisions and relevant STALE, then a successful
ordinary local rerun. Final query was UNVERIFIED rather than the harness's
expected CURRENT. Retained report has47 commands; no raw final status reason
was retained. No specific served reason is claimed retrospectively.

Independent controlled countertest executes the actual applicability/envelope
modules extracted from checksum-verified frozen8695 package (no installation,
compiler, daemon, auth or model): selected stable CURRENT/PASS with missing
complete portable facts after accepted different-input history returns
PORTABLE_LOCAL_SELECTION_BARS_FALLBACK/UNVERIFIED and preserves historical PASS.
Complete matching portable local facts with exact observed catalog binding
resolve via PORTABLE_CATALOG_EXPLICITLY_RESOLVED_LOCALLY; the daemon then retains
local selection. Current-source owned regression1/1 PASS,83.34ms. This validates
the source boundary, not the uncaptured original response's exact reason.

D1/D3 require complete origin facts and prohibit fallback hiding a newer selected
outcome. Plan3.6 permits defined fully observed local resolution, not any process
exit as resolution. Recommended smallest completion preserves the ordinary-run
obligation and expects truthful PASS/UNVERIFIED/nonreuse through restart. An
explicit portable fresh baseline is a separately declared stronger capture with
its additional cost, never a silent flag substitution or weaker engine. Both
failed preparations remain retained; no further expensive sample was launched
by this reviewer. This exposes installed onboarding guidance needed after import,
not an unsafe-reuse finding or complete economics/adoption result.

D7aeef9c plus72db693 diagnostic source GO retains actual served status before
assertions and through failure reports. Independent review caught that the first
reason-code regex was shape-bounded rather than a static allowlist; final exact
15-code recipient set drops unfamiliar codes, including uppercase private
canaries. Schema/health/freshness/result/reuse flags, fixed stage/index and
validated UUID/digests are retained, never human reasons or arbitrary producer
metadata. Independent controls4/4 PASS,51.47ms, Node22.13.0; syntax PASS.
This adds no new execution, deadline, changed obligation, green assertion or
third sample. Original failed-response reason remains uncaptured history.

Db19a7be final completion source GO preserves the original ordinary rerun:
PASS/UNVERIFIED/reuse=false with static selected-local barrier at final query and
restart. New local immutable receipt must be exited0, stable, exact configured
argvHash and have no portable capture property. Original source/import/new-local
bytes remain checked. Independent controls6/6 PASS,56.69ms, Node22.13.0; syntax
PASS. Source CLI213/306 binds that argvHash to actual resolved command JSON SHA.
Failed economics fixtures retain owned checkouts/prefixes/state/receipts after
observer stop attempts, with600 private locator; public reports contain no
absolute locator. Default/success cleanup remains unchanged. No expensive
completion sample, model or runtime change was performed by this reviewer.

B4e3004c plus5e0e5d0 shipped-guide clarification GO applies only to accepted
imports for the selected check. It explains ordinary outcomes can remain
UNVERIFIED, older imported PASS is not fallback, and deliberate existing
run CHECK --portable plus caller-aware synchronization adds both-boundary/catalog
capture cost for a possible fresh local baseline. It preserves selected config/
state, actual command obligation and receipts; it neither guarantees green nor
automatically substitutes compiler evidence for npm execution. This directly
addresses G4 onboarding friction demonstrated by the incomplete sample. Frozen
8695 artifact is unchanged; newly shipped documentation requires new exact
candidate bytes and validation before release review.

Independent read-only classification of completed installed sample: harness
223f231, frozen d04/8695 artifact, installed mechanics PASS. Actual served imported
baseline/unrelated responses have healthy schema1 CURRENT/PASS/eligible, origin
daa040d3-c466-4285-a2f3-b42684ee91c6, digest
ff8e449e05b715be9390993d7b8c204c2eb00ebd9c056d963d2cc5ab0147f8df, null local
invocation. Relevant edit is STALE/nonreuse. Ordinary newer local invocation
1b36a1d5-8597-478a-9988-b33b607748b7 remains PASS/UNVERIFIED/nonreuse with actual
PORTABLE_LOCAL_SELECTION_BARS_FALLBACK after final query and restart. This proves
the reason in this sample only;3a's missing reason is not filled retrospectively.

One sample has16 disjoint workflow commands totaling39,890.201ms, directly
measured wall39,893.226ms. Two exact plain obligations total212.743ms; measured
added command work39,677.458ms. Setup31commands/10,670.230ms includes four expected
edited-policy refusals; ownership/history controls4commands/258.356ms and cleanup
2commands/450.977ms remain separate. Actual receipt/history checks pass and no
recipient recorded execution occurs before relevant edit. There are zero model
trials; two-machine acceptance and portable recovery execution remain NOT RUN/
NOT PERFORMED. This finite mechanics sequence establishes no net benefit; it
cannot establish typical reuse frequency, avoided verification obligations,
CPU/memory/whole-agent benefit or complete signing/retrieval/authentication cost.
Protected owner-local source record remains
`.local/portable-evidence/complete-installed-final-ordinary.json` in the integration
worktree; no raw tool output/private experiment paths are published here.

Acceptance-map audit distinguishes existing V01–V22 source/fault controls from
actual model/machine acceptance and future final exact bytes. G1 real relocation
and relevant rejection are evidenced independently of calibration forecasting.
G2 amended native handoff/effective host prerequisites and G3 accepted live
recipient remain pending; D5 trust approval itself is already recorded. G4
prepublication final artifact/onboarding/affected acceptance and complete-path
economics remain independent. No control-only result marks those gates PASS.

Independent source-only package inspection GO: source
223f231ff6d6312e85998b00d7c6bcdfa080dd12,80regular in-package files/158,546
archive bytes, SHA-256
b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190.
Manifest entry names/modes/sizes, SHA1/SHA512 integrity, SHA256SUMS and exact
source user-guide bytes match. Against frozen8695, only
docs/user/portable-evidence.md differs; source/bin/other79 payload files are
byte-identical. No private experiment/test/.github/evidence/log/env file inventory
is included. Versionalpha10 metadata does not identify publicalpha10 bytes or
frozen8695, and this is not a release-ready/version-final artifact. Initial
reviewer command guessed an incorrect full source expansion and stopped at its
source assertion; corrected git-rev/source.txt comparison passed without changing
the artifact. No archive extraction execution, installation, probe or model was
performed. New exact-byte platform acceptance remains pending.

Independent read-only final CI evidence classification: package matrix38101767565
at05c1d869d40903c4663710e1967901e18ca8fc0b passes pack/macOS/Linux/nativeWindows.
Downloaded four regular files bind source05, manifest/checksum/80files/158,546
bytes and SHA-256b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190
to identical local223f bytes. Actual logs show the exact b812 package on all
three installed jobs, macOS real portable origin/separate-checkout mechanics,
and installed policy controls macOS8PASS, nativeWindows/Linux1PASS7platformskip.

Product38101769601 same source has481tests per job:macOS454PASS27skip,
nativeWindows305PASS176skip, Linux22/24each442PASS39skip; failure/cancellation0.
Its Windows independent repackSHAdae6d9…/159,489bytes is not b812 or prior frozen
8695. Git source/bin tree IDs05 and223f match exactly
bd5836f939a5d6e29b4877ace07e208d6d820bcc and
29ee1fac44925ce9e28a106a0a0632ee1277cd7a. Private retained logs are evidence
inputs; no raw transcript/path/environment is copied into this record.
No new tests, workflows, native processes or models were launched by the reviewer.
This supports candidate CLI/package regression only, not actual independent
machine/model reuse, accepted current CI producer, final version/public alpha or
net-benefit gates. Those substantive prerequisites remain explicit.

Independent read-only terminal review: one explicitly owner-approved data-only
recipient38123365552/head6b901d08708678bc51b8f9f1349555ecc1f5c198 SUCCESS. Exact
enabled workflow SHAa600688881452915bde3f63a9dc60d21d952c65a9b4efe3db2c14860976a5d6f
matches reviewed proposal; helper/registrya2f2 pins and fixed d04/8695 producer
artifact remain unchanged. API shows13 completed successful job steps, no skipped
steps/failure; logs contain preview applied=false then exactly one applied=true
result, preserved separately. Protected owner-local .private.json is0600 and
matching terminal fields were independently inspected. Earlier failed
recipient38098482463 is not relabeled; no job rerun occurred.

Actual accepted evidence: origin02f44ac7-e6fc-4d5e-9757-28357654fef1, canonical
digest5d16fbf6b101f88843f41a8c61d3c351e5f9e600306dc4936eaaec8d6ea40d57,
outer artifactSHAeb25768d3073dac37a78059efe94bfaab4a91f553dab7e208b05b940ea56dba6,
policybab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6
revision1/required refresh, reviewed native verifierSHA20f0520e9cc872b543bd5e31984f64932b197732c3d3df2c7367d0dc66e7a450.
Producer verified/accepted=true; recipient healthy schema1 CURRENT/PASS/eligible,
evidence_source=imported, acceptance=github-ci-v1, invocation=null. Actual receiver
26.6.2/build25G83/APFS/darwin-arm64/release25.6.0 matches reviewed origin profile,
with independently differing boot and physical Node identity. Unrelated edit and
restart retain the imported origin; relevant edit becomes STALE. Exact pinned
helper asserts no local run/receipt history and invokes no equivalent configured
compiler command. Models0/globally_latest=false. This establishes one positive
authenticated two-machine CLI route, not receiving-agent/model reuse or every
G3/final-release gate.

Four recipient calls and14 setup/control calls complete status0; final recipient
synchronized applicability takes42,274.658ms. This is an observed slow sample,
not a deadline change, warm-query distribution or net-saving claim. No writes,
new tests/workflows/uploads/signing, model/native-agent processes or additional
verification were performed by this reviewer. An initial guessed .report.json
filename was absent; the actual .private.json was located and reviewed, not an
engine failure. Root owns remaining native-host and final readiness decisions.


## Native Claude synthetic proposal — source/data review only

Independent review of onboarding leaf9aa6262,92b1cc1,3ba1304 andc674b2d grants
**GO for the disabled exact proposal, BLOCKED for live native operation**.
The exact rendered proposal map SHA-256 is
`d55150b3abc06af64597e8ec19b8a3668745b8cc393e2531b26e3cd6244d7cf4`,
checker SHA-256
`7d97369c54daa009ab7f487f476b19095b5a67e1b424143664538c238d151c8e`,
and proposed settings SHA-256
`b63c0e1e112f41aaa378b0c0f79f7bf65825ff25ae175c2b851b2af312958efe`.
All three proposal files are0600; template rendering exactly matches the private
checker. Literal argv, single Bash permission, denyWrite for the entire owned
base and Node version directory, one synthetic allowed socket and15s parent
cap match the reviewed map. Actual checker/settings destinations remain absent;
original785be settings remain unchanged. No synthetic resources were provisioned.

Five pure deterministic tests pass independently on actual Node22.13.0 in53.199ms.
The corrected socket timer is absolute1s and is cleared on completion; it does
not extend under partial replies. Oversized replies are rejected before buffer
concatenation, and late data is ignored after completion. EPERM/EACCES alone may
classify denial; missing/refused/timeout/other errors are unknown. Runtime guards
reject Node/preload/search overrides, every DYLD_ and OPENSSL_ key by presence;
external prelaunch validation is mandatory because a checker cannot undo startup
code that already executed. File opens use no-follow/nonblocking flags; the
external15s parent boundary remains necessary for the complete native/checker
operation. No file/socket/network probe, native startup, auth, model or settings
application was performed by this reviewer. Author-created live probes remain
UNRUN; the five tests use synthetic adapters/FakeSocket only.

The source-supported187 manual ! route invokes the Bash tool; its strict accessor
rejects an unsandboxed escape only when effective strict settings hold, and
excluded commands remain another escape condition. The original no-auth local
managed-file absence does not establish authenticated remote-policy absence.
Local disableAllHooks cannot override managed hooks. Owner-reported authenticated
normal-prompt startup is separately observed, not independent sandbox proof.
No supported bounded effective-policy inspection has been established here.

Minimal remaining owner/admin prerequisite: through an already supported policy
view or administration route, establish the applicable managed local/remote
startup-hook scope and effective sandbox exclusions/strict controls for this
exact authenticated187 profile. Record only reviewed keys/authority conclusions,
not raw policy, credentials or auth files. Unknown authority stops the operation;
a personal-account claim or absent local file is insufficient. If that supported
route is unavailable, provision a host whose effective policy can be established,
without bypassing managed policy. Then obtain exact owner approval of this
synthetic socket/resource/settings operation before provisioning or launch.

The approved operation would still require external positive read/write/listener
controls before and after the native interval, exact protected code/runtime/file
currency, actual native ! tool trace and no permission fallback or model prompt.
A synthetic PASS cannot establish real credential removal, REDUE endpoint
access, portable applicability, matched-VM reuse, subscription capacity or model
acceptance. No new host architecture, policy introspection tool or broader
research is proposed by this review.


### Durable profile rebound review — proposal remains disabled

After an owner-authorized environment repair and owner-reported successful durable
native187 launch, independent read-only review of onboarding9bdbd4c grants GO for
the re-rendered proposal only. Map SHA-256
`c321bb78cbd5dfacf6daaa9eb41db71f3d9aff4fa40456337d8d4e70f83edb1f`,
checker SHA-256
`b3bad6b2f056a28ee67886ee320703675fffc5c31185009983c228701ca70c6f`,
and proposed settings SHA-256
`3018fc31cca7b676c9f24c84cf904ae8eefb2c4302a759b5a9013e0fed7817a7`
match600 private files. Exact template rendering, quoted single checker argument,
literal manual ! input, protected originals and absent application destinations
were checked independently. Six pure controls pass in48.297ms; no native action,
listener/canary provisioning, settings application or model trial occurred.

The two short socket basenames produce98-byte absolute paths, unlike130-byte
nested paths in the durable base. Only one exact synthetic socket is allowed;
this changes neither REDUE transport nor recipient authority. Quoted command
text is correct shell argument syntax but actual native permission matching and
sandbox enforcement remain untested. The working durable all-tools-denied
settings5628de and bounded repair launcher eebb1e55 remain byte-identical; the
original launcher cannot select this sentinel proposal.

Explicit secure-storage selection preserves the old isolated Keychain namespace
without copying credentials. Source inspection showed that plaintext fallback
also follows that old namespace path, not the new durable config path. This
repair context is bound separately from the earlier no-override preflight; no
historical environment/enforcement evidence is silently reused. Metadata presence
and owner-reported normal prompt do not establish token validity, capacity or
effective managed startup authority.

Before a third policy-evidence approach, the two previous limitations were
reviewed: prelogin local-source absence cannot rule out authenticated remote
policy, and source-only strict settings cannot establish effective merging.
Current official [settings documentation](https://code.claude.com/docs/en/settings#confirm-what-loaded)
documents /status setting-source provenance, while explicitly distinguishing it
from the source of each effective key. /config is not a complete settings view.
Those current docs alone do not certify native187 hook/exclusion semantics or a
current managed snapshot. Any concrete bounded diagnostic needs pinned-version
source meaning and actual current scoped observations; doctor/config changes or
raw debug dumps are not substituted. Effective managed policy remains UNKNOWN
until such evidence exists. Live operation still needs the separate exact owner
resource/socket/settings approval, with the existing no-model boundaries intact.


### Bounded current-process policy diagnostic review

The two previous failed proof approaches were reviewed before a third: local
policy-file absence before authentication did not exclude remote policy, and
static settings did not establish effective controls. Requested pinned187 source
xPa201746663/eD194686943/An194828010/Qpe194829541/n9r196897750 shows that /status
lists nonempty active setting sources, always includes flag/policy sources in the
candidate list, and derives managed source labels separately. Local disableAllHooks
still retains managed hooks; the source listing cannot prove historical startup
side effects or future policy stability. Startup can initiate remote loading and
policy notifications before the user enters /status. These limits remain.

A concrete missing precondition was found at bEp201755812: auth status computes
Ak and Yg(), prioritizes OAuth in authMethod, and independently emits apiKeySource.
Yg() does not set skipRetrievingKeyFromApiKeyHelper and can call a configured helper.
Thus claude.ai/firstParty/pro alone did not prove remote ineligibility. Uj200757730
uses the same OAuth subscription but calls Yg with skip-helper for the API-key
eligibility alternative. API-key sources include the fixed descriptor fallback,
scoped Keychain API service and native-config primaryApiKey. No credential value
or configuration body was read by this reviewer.

Actual protected metadata record bfbfd1e2… is600, regular/current-owned/single-link:
scoped API service absent with native security exit44 without password options,
fixed descriptor path absent, project/local settings absent, primaryApiKey key
absent; only absence/presence was published. Root separately reports current
system-managed sources and relevant override keys absent. This is narrower than
an administrative policy claim. In pinned187, Ujfalse sets cSr=false; Wpe then
ignores an otherwise retained remote cache. Therefore a subsequently confirmed
firstParty/claude.ai/pro plus no API-key source can justify remote-inactivity for
that exact current process and unchanged source/override context, not every Pro
installation or a future context.

Source/data GO was given for protected auth-source-diagnostic.py SHA-256
`0bd8ea2027c02651c3054d1d6e29c6f76d1bfc4deb3cdc96a26e8da6fae05ee8`.
It hashes/reuses only the exact eebb1e55 launcher's imports/constants/functions,
excludes its interactive dispatcher, inherits the bounded64KiB/15s process-group
reader, and emits fixed method/provider/subscription/source enums plus a presence
boolean. Actual native API-source absence must confirm the metadata result;
unexpected output/exit/source stops. No native/auth/status/model/checker operation
was executed by this reviewer. This conditional diagnostic GO is not synthetic
resource approval, sandbox enforcement, credential removal or model acceptance.


### Exact builtin /status diagnostic preparation review

The once-executed authorized native auth-source diagnostic reports exit0,
loggedIn/claude.ai/firstParty/pro and apiKeySourcePresent=false/classNONE. Its
allowlisted334-byte protected result has SHA-256
`d0cdb8da1cba49064bb0e31922fc1973ae82ede8dfea8779e780dbca91ca2812`.
No raw status/credential values are retained in that record. This confirms the
missing API-source condition for the reviewed pinned187 current-process route;
it is not token-validity/capacity/enforcement proof.

Independent source/data GO was given for one owner-authorized builtin /status
diagnostic, private helper SHA-256
`1341de58711e8214f17245fd93d2b46381e55493fc0bf8b352fbed2ff8815540`.
The initial55110 helper incorrectly filtered recognized source substrings, which
could discard unknown suffixes/wrapped fields or accept a partial PTY chunk.
That initial proposal was not run. The corrected parser requires a completed
modal footer and exact complete Command line arguments field; all other complete
fields are unexpected/unparsed, and incomplete fields remain unknown. Additional
fixed settings/login/policy gates stop instead of permitting input.

Nine independent AST-only pure parser cases pass, including partial footer,
unknown suffix, comma-separated/wrapped source, diagnostic text and no data.
Only the parse_status function was extracted; no helper top-level code, native
process, metadata subprocess or actual terminal action ran in this review.
The auth precondition is bound to the exact d0cdb8 result with regular/single-link/
current-owner600/4KiB guards, exact native integer0 and sourceNONE. The reviewed
all-tools-denied5628/eebb path is unchanged. Only builtin /status may be submitted
after the native version/prompt and no-gate checks; no shell/model/checker input.
The native operation is30s bounded with256KiB raw memory cap, no raw retention,
fixed-class result only, and owned process-group cleanup.

This GO permits a current-process loaded-source observation only. It cannot
prove zero historical startup side effects, future managed-policy stability or
native sandbox/credential enforcement. Any unexpected UI shape, gate, source,
exit or timeout remains unavailable; the synthetic checker and model/resource
approvals are independent. No native /status was executed by this reviewer.


### Unavailable /status display and bounded synthetic approval rationale

The one authorized1341de diagnostic completed at its30s boundary with helper
terminal exit0 and completed cleanup, not a claim that the native child exited0.
Actual protected result SHA-256
`ddfd3c08d9a3979b1c6c03959946ff9a58ecc4ca5bd9a0c68624a064cf617592`
was independently inspected: native version observed=true, builtin status
submitted=true, STATUS_NOT_CAPTURED, source classes empty, raw output retained
false, model/shell actions0, enforcement NOT_TESTED. Empty classes are UNKNOWN,
not an observation that no source was loaded. No second attempt is proposed.

The canonical plan does not require this particular native display as a gate.
Pinned187 source semantics, the confirmed OAuth-Pro/firstParty/no-API-source
result, complete current selected-source metadata negatives and intact explicit
CLI inputs provide a defensible narrow rationale to REQUEST exact owner approval
of the reviewed synthetic test. They do not establish hypothetical administrative
intent, future policy stability or actual sandbox enforcement. Code/settings,
current account/context and complete source/helper metadata must be rechecked
immediately before any future operation; a changed or unknown precondition stops
it rather than inheriting this rationale.

The proposed checker itself performs only the fixed approved synthetic opens,
custom env presence and owned-listener connections. It reads no real credential,
auth/keychain or REDUE authority, invokes no arbitrary command and requests no
model action. Even if settings are ignored or a denial fails, the bounded actions
remain those explicit synthetic accesses; possible creation of the owned write
canary is a counterexample to retain, not permission to retry unsandboxed or a
successful enforcement claim. Exact owner approval must cover those synthetic
counterexample accesses as well as the one socket/settings/resource scope.
Known-live external controls and native tool tracing remain mandatory. This is
GO to request that exact test approval only, NOT GO to execute it or weaken any
host policy. The prior unavailable /status and prior policy-evidence limitations
remain retained; no stale green or new model/machine acceptance is inferred.


### Owner-approved one-attempt native synthetic harness review

Owner approval D6 covers the exact c321bb78 map, 3018fc31 new settings and
b3bad6b2 checker only. Independent read-only rehash confirms all three exact
bytes, current ownership, single links and mode600. The normal 5628de76
all-tools-denied profile and eebb1e55 launcher remain separate and must remain
unchanged. The existing old secure-storage namespace directory now exists empty,
current-owned/mode755; its cause is unestablished. Directory existence alone is
not a refusal condition. Canonical non-symlink/non-writable owned parents and
continued absence of its exact plaintext fallback file remain required before
and after the attempt. No credentials are copied, inspected, deleted or rebased.

Independent source GO is conditional on freezing owner-local harness SHA-256
`10904ba25acb7577292c132364c49aad95b7075bd169f70190e3b21ac86bd3b5`
and repeating the integration owner's current account/source metadata guards.
The fixed15s deadline includes preparation and validation; reads enforce byte
bounds/deadline checks, the native loop reserves cleanup time, and elapsed
excess/reap/cleanup uncertainty cannot produce a verified report. Original files
are checked before/after. Created files use exclusive complete writes and
identity/content checks; modified resources or the unexpected write canary are
retained rather than deleted as successful cleanup. Raw terminal bytes stay in
bounded memory and are discarded; output contains fixed result projections only.

Pinned native187 public source distinguishes the main Bash prefix at209845244
(Ft==='bash' emits '!') from the generic shortcut text at205064540, which also
says '! for shell mode'. The harness first observes the187 banner and normal
prompt, sends only '!', then requires a complete current screen containing the
standalone Bash prefix plus footer before writing the remaining fixed command.
The Enter byte is submitted only after all command bytes are written. Unknown
terminal controls refuse; alternate-buffer changes clear stale screen content,
partial/synchronized frames withhold input. It does not fall back to a model,
an arbitrary shell command, an unsandboxed path or additional UI confirmation.

The initial d6d7 review reproduced acceptance of boolean schema/model-count
fields through Python numeric equality. The corrected harness requires exact
integer types. Eighteen author pure controls and nine additional independently
extracted AST-only controls pass on the exact10904 hash: unsupported private
cursor/mode sequences, stale alternate-buffer prefix, malformed write returns
and expired budget before any input. No helper top-level dispatcher, native,
fixture, listener, settings application, auth or model operation ran in this
review. The approved native attempt remains NOT RUN at this review checkpoint.

An actual positive classification additionally requires all six fixed checker
results, actual Bash-mode command tracing, synchronized protocol delta[1,0,0]
between known-live external controls, unchanged originals, fallback absence and
owned cleanup/reaping. The protocol counter is published before the response
and snapshots are locked, avoiding the prior control-versus-checker count race.
A JSON response or echoed command alone is not native execution/enforcement
proof. A failure, missing or refused endpoint, timeout or unknown UI remains a
counterexample/unavailable result without retry. The checker can open only the
approved synthetic canaries/endpoints and custom env key; its no-real-credential
statement concerns checker accesses, not ordinary native OAuth startup. This is
read-only single-checker host-boundary preparation, not general writable-agent,
portable evidence, cross-machine, model reuse or complete-goal acceptance.


### Actual one-attempt native result and data-only parser follow-up

The exact10904 harness's one owner-approved operation returned NOT_VERIFIED
(exit1) after1,384.8ms. Independent inspection of the protected current-owned
single-link600 result confirms SHA-256
`fc53216ee2725a54250d6a2952e221bc60b394fcdd2535901e12ee75485ebbbe`.
Native startup occurred, but Bash mode was not confirmed, command submissions
were0, checker JSON was not verified and the inter-control protocol delta was
[0,0,0]. External controls before/after were live, plaintext fallback remained
absent and created fixtures were cleaned. The report separately records
OWNED_NATIVE_REAP_UNKNOWN; fixture cleanup is not proof of native-process
cleanup. Any later exact owned-process metadata/reaping observation is separate
evidence. No checker boundary, model, REDUE authority or portable reuse trial
completed. The one-attempt allowance is consumed; no automatic retry is approved.

The static reason NATIVE_SCREEN_CONTROL_LIMIT originates only from retaining
more than4096 characters after an unmatched escape prefix. Actual terminal
bytes were deliberately not retained, so the actual escape family remains
UNKNOWN. Three independent AST-only synthetic controls demonstrate that
unsupported ESC(B, unmatched CSI> and incomplete OSC can all produce this same
reason. They do not identify which occurred in the actual native attempt.

A separate disabled run-next.py SHA-256
`e923ef8735d73bc66337e691f6bbc7cec9a20982386e3fdcc1e1f23deb10747a`
has source GO for data-only preparation. Its minimal diff immediately refuses
syntactically complete unsupported ESC/CSI forms with fixed codes; only bounded
syntactically incomplete CSI/OSC prefixes wait. It accepts no new terminal
semantics and preserves the executed10904 source. Twenty-five author controls
plus six additional independent split-family/OSC/colon controls pass through
AST-extracted pure functions only, with0 native/fixture actions. This is not
proof that the actual native UI is supported or that its failure is fixed, and
is not permission to invoke the replacement. Any new operation requires
specific owner approval, current preconditions and independent exact-source
review; the failed report and discarded-data limitation remain historical facts.


The final data-only replacement is now frozen as
`beba8c644d0db33a80580820550a107274993becec23beaa9c6f5bbb9f902a93`.
The prior e923 source already withheld a positive report when native reaping
was absent; no false-positive native result was reproduced. The final change
extracts and tests that guard, requiring exactTrue for reaping and fixture
cleanup. A final child wait uses at most2s of the remaining original15s budget,
not a new deadline. A new exclusive600 private process-identification record
is verified after writing and retained outside public output. Its PID/group is
cleanup metadata only: later operations must independently match current
owner, executable, argv and process start identity, not trust an old PID alone.

Thirty-two author pure controls plus seven independent finalizer controls pass
on the exact beba8c source, including missing/false/nonboolean reaping,
nonboolean cleanup and preservation of prior negative reasons. An earlier
independent test preparation stopped at its source-hash assertion because the
author was revising the file; no extracted code or native operation executed
in that failed preparation. The final coherent source was unchanged during
its pure run, and executed10904 remains intact. This is source/data GO to
prepare a specific new owner approval request only, not authority to repeat
the consumed attempt or a claim that the native terminal is now supported.


### Second specifically approved operation: decoder refusal before tools

The second owner-approved operation used exact beba8c and returned NOT_VERIFIED
(exit1) after472.2ms. Independent inspection confirms the protected report
SHA-256 `e6abc11b7408e66f84a79ce01fe1e27a9e259665780a99ee3e9447dbb70816c8`,
mode600/current-owned/single-link. Native startup occurred, shell mode was
false, command submissions0, checker JSON false and protocol delta[0,0,0].
External controls before/after, plaintext fallback absence, fixture cleanup
and native reaping are true in this second report. The first report's reaping
uncertainty and less-specific failure remain distinct historical evidence.

Exact source attributes NATIVE_SCREEN_ESCAPE_UNSUPPORTED to the custom
terminal decoder refusing an unmatched ESC prefix outside its recognized CSI
and OSC forms. Its actual subsequent byte/specific escape sequence is UNKNOWN
because raw data was discarded. This is an established harness compatibility
failure before the checker, not an observed sandbox denial, credential-filter
result, REDUE failure or insecure native execution. Neither attempt exercised
the six-check boundary or a model. The two specific allowances are consumed.

No further terminal-semantics implementation or native retry is justified from
these discarded bytes alone. If useful and separately approved, the smallest
diagnostic is a fixed allowlisted escape-family enum and bounded length, never
raw terminal bytes/parameters; pure cases must preserve refusal before input.
A concrete owner-operated pinned187 UI route for the same exact command, new
settings and controlled endpoints is another candidate for review, avoiding
a continuing custom decoder campaign. It must still preserve native Bash-mode
confirmation, current guards, exact scope/deadline and external pre/post proof;
it is not authority to execute, relax permissions, omit controls or count
owner operation as model/portable reuse. No further native, fixture or settings
actions were performed by this reviewer.


### Disabled startup-only escape classifier review

A minimal owner-local diagnostic, not a replacement checker attempt, is
source/data reviewed at exact SHA-256
`1c6a55c69cc58a64eab982c9c5ddfadb2eb801191500addb620afca67fc73c9b`.
It uses only the preserved normal5628/eebb/a59 all-tools-denied setup and the
reviewed beba guard definitions. It sends no input, submits no command, creates
no synthetic resources/listeners and applies no new settings. Its only
additional owned write is an exclusive600 provisional diagnostic/PID record.
Current external source/auth prerequisites must be repeated before any later
owner-approved startup. Same40x2048 geometry avoids a new display variable.

The classifier emits only a fixed ESC-family enum or UNKNOWN; parameters,
titles, native terminal text and credential values are not retained or printed.
The initial581 preparation used a greedy OSC terminator that could swallow
an intervening first escape. Final matching stops at the first BEL/ST, tested
with consecutive OSCs and split terminators. It classifies syntax only and
accepts no new native tool or terminal semantics. Unsupported/malformed/
oversized input remains unavailable rather than enabling input.

Fifteen author pure controls plus seven independent pure/static controls pass
through AST-extracted classifier definitions: first-terminator ordering, hidden
escapes inside OSC, split ST/charset, malformed/control limits, aggregate64KiB
bounds and absence of send routes. No top-level helper dispatcher, native
process, fixture, listener, auth or settings operation ran in this review.
Source was unchanged during validation. The whole15s budget reserves reaping
and checks persistence; actual elapsed is recomputed after persistence and
excess prevents CLASSIFIED. Private immutable evidence is expressly provisional
until final sanitized stdout/deadline completion and cannot establish authority.

This is GO to request one exact startup-only diagnostic approval, NOT execution
authority. Its prospective family observation would describe that new startup
only; it cannot recover the discarded historical sequence, prove credentials/
sandbox controls, count a checker/model trial or make the native host ready.
Both prior specifically approved operations remain NOT_VERIFIED and consumed.


### Actual separately approved startup-only classification

The one specifically approved1c6a55 startup-only diagnostic completed with
process exit0 and CLASSIFIED_DIAGNOSTIC_ONLY/SAVE_CURSOR after404.7ms.
Independent inspection confirms protected final report SHA-256
`5840f3182ac7495405005cd56562a0b803ac895871d1da1246da1748245e4776`,
mode600/current-owned/single-link. Keyboard bytes0, model actions0, native
reaping and source/fallback rechecks are true. Raw terminal/stderr retention
is false. Current normal5628 settings, eebb launcher and a59 native executable
were independently rehashed unchanged. No new settings or synthetic resources
were applied by this classifier.

SAVE_CURSOR establishes the first classified non-CSI/non-OSC escape family
for this new startup only. It does not identify the discarded bytes from the
first or second checker preparations, certify complete terminal support or
establish shell-mode/checker execution, sandbox/credential controls, model
capacity or portable evidence reuse. The original two NOT_VERIFIED attempts
remain retained and distinct. No native/auth/fixture action was performed by
this reviewer. Any disabled decoder correction requires separate critical
review and any later operation requires specific approval; no retry or native
feature expansion follows automatically from this diagnostic.


### Disabled bounded cursor-save decoder correction

The final owner-local successor is source reviewed at SHA-256
`75082ecd42ce75fe145ced1d2a9ea12fffdc371cef77d71260b56654407a0d0b`.
It adds only one-level ESC7/ESC8 saved position to the existing bounded text
projection. Split sequences wait; a new save overwrites the slot; restore
without save refuses;1049 transitions clear the slot. Unsupported charset
selection/shifts, origin/margin/wrap modes, conceal/font/unreviewed SGR and
other terminal semantics remain refused. Decoration/color does not authorize
input. First-BEL/ST OSC parsing prevents hidden intervening controls from
being swallowed. No engine, recipe, trust, host permission or runtime bytes
changed; prior executed10904/beba/1c6 helpers remain exact and preserved.

Primary [XTerm411 control sequences](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)
and [cursor implementation](https://github.com/ThomasDickey/xterm-snapshots/blob/xterm-411/cursor.c)
were independently checked. Its save/restore includes flags, character sets
and pending wrap, with saved state per buffer. The official archive969be283
and cursor.c member3caf38bd were independently rehashed and the retained
member equals the archive contents. The successor deliberately refuses state
it does not model; this is not a complete DECSC/DECRC or terminal-emulator claim.

Independent review found that the preliminary930 proposal refused a save at
the last column but still silently clamped ordinary printing there. Final750
refuses the unsupported edge printable before mutation instead of inventing
wrapping. The preliminary source is retained separately; this was a proposal
correction, not an observed native/released defect. Fifty-five author controls
and eleven independently extracted pure controls pass on exact750, covering
save/overwrite/restore position, unknown interpretation state, edge refusal
without mutation and saved-state invalidation. Source was unchanged, and no
top-level dispatcher, native, fixture, listener, auth or model action executed
in this review. Existing original15s bounds, fixed command/protocol proof and
exactTrue reaping/cleanup requirements remain intact.

This is GO for a specific owner approval request only. A later positive native
claim still requires actual confirmed Bash mode, the exact single checker
command, six results, isolated protocol delta, live controls and complete
cleanup/context checks. Pure decoder controls, the SAVE_CURSOR diagnostic
and ordinary account login do not supply that evidence or model capacity.
No native operation or repeat trial is authorized by this review.


### Third specifically approved synthetic preparation: CSI decoder refusal

The one approved75082e operation returned NOT_VERIFIED (exit1) after492.8ms.
Independent inspection confirms protected final report SHA-256
`b4ebbade7123fb6a0ed508f9e7fc20fc7fddc80954b578c67602bf0b4de24941`,
mode600/current-owned/single-link. Current75082e source and normal5628/eebb/a59
files were independently rehashed unchanged. Bash mode was false, command
submissions0, checker JSON false and protocol delta[0,0,0]. External controls
before/after, native reaping, fallback absence and owned cleanup are true.
No checker or model ran, and no REDUE authority was exercised.

Exact source emits NATIVE_SCREEN_CONTROL_UNKNOWN from several CSI parsing or
interpretation refusal branches: unsupported operation/parameters, private
mode or erase behavior. The actual opcode/parameters were not retained and
remain UNKNOWN; neither a particular native mode nor a security/REDUE defect
is established. This third controller compatibility failure does not undo the
separate startup-only SAVE_CURSOR observation or justify relabeling either
earlier discarded escape. Every actual attempt remains retained independently.
No allowance remains, and no further decoder repair or automated retry is
authorized or proposed in this review.

The smallest known alternative is an owner-operated pinned187 native TTY
manual! route already supported by the reviewed native source, replacing
custom screen automation rather than sandbox controls. It is a candidate
procedure, not validated readiness: a new specific approval must bind the same
a new reviewed settings candidate with automatic Bash responses disabled,
exact synthetic resources,15s limit, visible
Bash-mode confirmation, six checker results and external live/protocol/context/
cleanup evidence. The preserved normal5628/eebb profile denies all tools and
allows no sentinel execution. No arbitrary commands, permission relaxation,
new helper/framework, native action or model acceptance follow from this
recommendation. Native checker enforcement and the actual agent/machine gates
remain unresolved.


### Owner-operated procedure preparation: automatic-response correction

Independent bounded inspection of the exact native187/a59 public-code bytes
finds `yLm` at207536738 reads `Fr().respondToBashCommands ?? true`. Its ordinary
success and non-interrupted failure branches derive `shouldQuery` from that
boolean. Thus shell mode itself is not a no-inference guarantee. The preserved
3018 synthetic settings lack this setting. Prior review language implying that
manual `!` alone supplied the no-model boundary is corrected here; all three
actual attempts had command submissions0, so this finding establishes a proposal
gap rather than an observed model request, charged usage or released defect.

The exact187 schema at194770918 supports `respondToBashCommands:false`. `Fr()`
at194828076 reads `L5().settings`; `XSr` merges the selected source settings
with flag settings and finally policy settings. Therefore a separate proposed
`--settings` file can supply false, provided the existing current authority
guards remain satisfied and no effective managed override changes it. The normal
5628/eebb files, credential namespace and original3018 proposal remain untouched.
Current [interactive documentation](https://code.claude.com/docs/en/interactive-mode#shell-mode-with--prefix)
also documents automatic responses and the false setting; current
[sandbox documentation](https://code.claude.com/docs/en/sandboxing#strict-sandbox-mode)
explicitly distinguishes the pre2.1.260 manual-command behavior. Current docs
are supporting context, not a substitute for pinned187 execution semantics.

The reviewed dispatch chain is `processBashCommand` at207543321 for Bash input,
`r7t` returning its Bash result directly, and `sQl` carrying `shouldQuery` into
interactive `MT`/`Ux`. `Ux` at210062877 returns before the model query when that
flag is false. Its earlier session-title branch tests `Gce`; the exact no-paste
manual input begins `<bash-input>` and is excluded by `Gce` at207125982. The
prompt-suggestion generator belongs to the post-model query path and also has
a supported false setting. A fresh session with no resume, prior model turns,
pasted input blocks or queued messages is required; an arbitrary active session
is not covered by this bounded source argument.

Nine independently extracted source-isolated pure controls pass on Node22.13.0:
false suppresses querying for success, generic error, shell error, interruption
and background result; absent/true countercontrols request a response; the
exact Bash tag is excluded from title generation while an ordinary prompt is
not. External functions were mocked, and no native dispatcher, shell, model,
listener, fixture, configuration or credential action ran. These controls verify
source branching, not native enforcement or billed request counts.

The manual handler directly invokes `sl.call` with `dangerouslyDisableSandbox`.
The pinned strict accessor rejects that escape when unsandboxed commands are
forbidden, and the Bash executor passes `pL` into `Xae`. Empty effective
`excludedCommands`, sandbox enabled and fail-if-unavailable remain mandatory.
Manual dispatch bypasses ordinary tool permission approval: the exact command
allow entry must not be presented as proof that arbitrary owner shell commands
would be denied. The owner procedure must submit only the reviewed literal
checker command, with the same fixed resource restrictions.

Procedure preparation alone is authorized. The first owner-local launcher draft
uses `start_new_session` with inherited terminal descriptors without establishing
foreground terminal ownership; that is not yet a usable owner TTY route. Its
unconditional zero-model report also cannot be treated as an observed count.
These are author preparation findings, not executed failures. Final launcher,
settings, existing-file checks,15s deadline, live-control lifecycle and truthful
result labels require independent review before an operation approval request.
No native execution, permissions change or model trial is authorized here.


### Final owner-operated procedure preparation review

The frozen owner-local lifecycle helper is independently source reviewed at
SHA-256 `dc0eb16d157081a5d7ea1625d8de8874bbc49beb4331a84539755ba7e40b57f3`.
Its separate selected settings file is
`cc8aaf8c396424e37d48d8bfb2bc690461e7b99ef1ff7b3afff986118c45ff1e`;
checker remains b3bad6b2. The settings delta from preserved3018 is explicitly
`respondToBashCommands:false`, `defaultShell:"bash"`, and appending the newly
selected settings filename to both existing denyRead and denyWrite lists.
Previous settings restrictions remain intact. The new file is preparation data;
normal5628/eebb files and the original proposal are unchanged. Existing native,
checker and selected-settings paths were independently checked as regular
non-symlink files. No live resource or native action was performed by reviewer.

The final helper uses `posix_spawn(setpgroup=0)` in the owner's existing session,
checks the owner begins in the foreground, explicitly transfers the real terminal
foreground to the dedicated native group and restores it and terminal attributes
after cleanup. SIGTTOU is masked only around foreground/terminal transitions.
No PTY, terminal decoder, keyboard writing, preexec callback or automatic command
submission remains. A15s absolute interval begins before preparation; the native
window leaves2s for bounded kill/reap and controls. Native PID is retained until
reaping to avoid reuse, and SIGTERM/SIGHUP set a cancellation latch checked by
the remaining-budget guard. Currency, terminal restoration and cleanup failures
cannot receive a successful lifecycle exit. Uncatchable termination still cannot
promise cleanup; a private owned-process identifier supports explicit recovery.

Local selected/project/system source absence is checked before and after; these
checks alone do not certify remote authority. The previously reviewed fresh
external auth-source/metadata prerequisites remain required immediately before
a future operation. Model policy is labelled EXPECTED_DISABLED_NOT_MEASURED,
checker output must be supplied by the owner, and enforcement stays
NOT_AUTOMATICALLY_VERIFIED. A successful lifecycle or protocol counter is not six
verified sandbox outcomes. The helper retains live-before/live-after controls
and a separately counted actual-probe interval; ports absent or refused cannot
be reclassified as enforced denials.

Nine independent AST/data controls pass for final helper/settings identity,
owned same-session group, foreground/reaping methods, absence of keyboard/PTY
launch automation, truthful model labels, cancellation, currency/restore and
fixed budget conditions, exact path restriction append, and existing file paths.
The first reviewer command had an unmatched parenthesis and never evaluated; the
corrected command passed. Neither command launched native code, listeners,
fixtures or model calls. These are static controls, not owner-TTY acceptance.

For a later specifically approved owner operation, submit only the fixed command
after visibly entering native187 Bash mode. At an idle ordinary prompt, /exit is
a local immediate command: Fym206173932 loads Mym206173135, which in the fresh
non-worktree/no-background route performs local goodbye and `gi(0)` rather than
a model request. Escape out of Bash mode before /exit; do not submit !/exit.
The helper's group cleanup remains required even after native exit. Any trust,
auth, policy, unavailable-sandbox or unknown state stops the procedure; do not
substitute a prose model task, arbitrary shell command or permission bypass.

Conclusion: GO_FOR_OWNER_APPROVAL for this exact preparation and root's data-only
verification, not for execution. The old3018 no-model assumption is corrected;
three actual command0 failures remain preserved. A new approval must explicitly
bind this new settings identity, exact synthetic live resources, literal command,
15s bound and owner operation. Native enforcement, actual receiving-agent reuse,
model capacity and G1–G4 completion remain unestablished.


### Owner-operated fixed-window attempt: observed limit and diagnosis

The protected owner-supplied structured result was independently inspected at
SHA-256 `9f364dc3ab867f53808dc2984392e3e3c6cec1c145fde850664f6c5289f2195b`
(mode600, regular single-link). Its provenance is
OWNER_SUPPLIED_STRUCTURED_LAUNCHER_RESULT, not a retained native tool trace.
It binds frozen helperdc0/settingscc8/checkerb3 and reports elapsed13216.9ms,
OWNER_WINDOW_ENDED, native signal9/reapedtrue, foreground restoredtrue, controls
before/aftertrue, protocol delta[0,0,0], file currency and listener cleanuptrue.
The checker JSON was not supplied. Checker execution, checker exit, actual
submission time and model count remain UNKNOWN/NOT_MEASURED; neither protocol0
nor absent output proves the checker never started. Coordinator fresh metadata
reads occurred after the owner attempt and are not retrospective pretrial proof.

The unchanged helperdc0 was independently rehashed and source inspected. Its15s
absolute interval begins before source/file guards and native startup. The native
window loop ends when only2s remain, then unconditionally assigns
OWNER_WINDOW_ENDED and kills the dedicated process group in cleanup. That literal
reason occurs in one branch. The owner-reported result therefore supports this
outer-window branch; it does not separate native startup, human preparation,
command submission or checker runtime. It does not establish output loss, a
checker failure, native sandbox failure or REDUE correctness failure. The prior
three automated attempts remain separate known command0 outcomes; this later
manual attempt must not inherit their no-command/no-model classifications.

A bounded repair may separate an explicitly approved owner-startup interval from
the actual checker15s execution budget and finite cleanup. It must obtain actual
child wait status rather than treating a checker's intended exit or printed
booleans as the observed process exit. A fixed source-reviewed in-sandbox wrapper
can relay bounded static data through the existing synthetic allowed socket; this
is a proposal, not new imported evidence or REDUE authority. Original helper,
checker/profile identities and result remain preserved. Proposed180s startup,
15s checker and5s cleanup caps change the operation envelope and require new exact
owner approval; the consumed15s allowance does not authorize them. No new native,
checker, live listener, permission or model operation was run by this reviewer.
Only harmless local mock controls are currently permitted for the repair.

### Final collection repair: independent preparation review

The disabled owner-local repair was independently reviewed at these exact hashes:

- owner-collect.py: `c9f6e1e98ea49bac81b4d6ac6c3f2bf965552025912a9e56d8d77d10cb504563`
- supervisor.mjs: `010833502f33471b0a95891a27af9114d532e0881c1209f351a68c5caa6c9cc3`
- settings-collect.json: `dfc808862940d126e7852b6606ed834505f67fd92ed21047956205fffc3fe4e2`

The settings preserve the reviewed manual profile's strict sandbox, empty
excluded-command list, no unsandboxed fallback, disabled Bash response,
explicit Bash shell and existing denials. The delta changes the exact owner
command to the fixed collector wrapper and appends protection for the new
settings and wrapper files. Network/socket grants are byte-for-byte equivalent
as parsed data; only the existing synthetic allowed socket carries fixed results.
This is not a REDUE observer endpoint, imported verification evidence, arbitrary
execution interface or authenticated producer route. As already established for
native187 manual commands, the ordinary permission entry does not enforce an
arbitrary-command allowlist; the owner must submit only the literal reviewed line.

The parent retains the real foreground TTY and writes no keyboard input. Proposed
caps are180s startup including preliminary guards, one15s collection window after
the first accepted collector ACK, up to5s cleanup and200s total. An ACK is named
COLLECTOR_START_ACKNOWLEDGED and is not proof that a checker process started.
The wrapper verifies the immutable checker before requesting ACK, then spawns
only that exact checker. Missing/malformed ACK launches no checker. Its14s child
timeout and14.5s unobserved-close limit fit inside the parent's15s collection
boundary; transport and parent acceptance remain bounded and may conservatively
produce UNKNOWN. No restart, timer reset, terminal parser or synthetic delay is
introduced.

The wrapper observes the child's close event, exit code and finite known pinned
Node signal name set, including SIGIOT. A missing close is distinct from an
observed exit. Parent parsing rejects contradictory code-plus-signal claims,
boolean schema/exit values and inconsistent outcomes. Assertion outcome,
process outcome and final collection/context outcome remain separate. Accepted
negative rows and actual nonzero exit/signal survive subsequent protocol error,
cancellation or uncertain completion. Final green additionally requires exact
protocol delta[1,0,0], live controls before/after, unchanged sources, reaping,
terminal restoration and owned-listener cleanup. Failed or incomplete persistence
cannot create a green result. The protocol's one-shot UUID binds a local attempt,
but does not authenticate it against a hostile same-UID process able to connect
to this endpoint. Its observations rely on the reviewed local wrapper and the
owner's fixed operation scope; they are not forensic origin authentication.

The exclusive mode600 durable file retains sanitized checker rows and actual
supervisor-observed code/signal independently of terminal copying. It deliberately
marks final persistence/lifecycle completion UNKNOWN with
REQUIRES_FINAL_PARENT_COMPLETION. That does not discard a retained checker FAIL
or observed exit; final parent output is separately bounded and cannot invent
missing checker evidence. No raw native transcript, child stderr, environment
dump or credential data is persisted. Fresh external authenticated-source and
policy prerequisites remain necessary immediately before any future operation;
local file absence alone is not remote-policy proof. Model policy is correctly
EXPECTED_DISABLED_NOT_MEASURED, not an observed zero-model count.

Independent reruns on pinned Node22.13.0/system Python3.9.6 passed8 Node controls,
12 Python phase/status controls and2 connected MOCK controls. The connected
control exercised three isolated temporary Unix-socket transport scenarios with
harmless JSON-only child processes: successful output/exit0, missing output/exit0,
and positive assertions/actual exit7. Parent projection, wx0600 fsync/readback,
no-overwrite refusal and cleanup were exercised. A separate harmless owned
process-group control verified actual kill/reap, without a post-reap numeric-PID
kill. Eight independent source/data controls also passed for exact manifest and
source bindings, unchanged grants, precise settings delta, cancellation/counter/
reap barriers and accepted FAIL preservation after a late error. The first
reviewer unittest module-name invocation failed before evaluating tests; direct
script invocations then passed. No native host, real checker, approved sentinel
fixtures, auth operation or model was launched by these controls.

Conclusion: GO_FOR_OWNER_APPROVAL and data-only staging/verification for the exact
repair bytes. The original UNKNOWN owner report, frozen helperdc0/profilecc8/
checkerb3 and normal5628/eebb remain historical/current identities as appropriate.
The new wrapper, selected profile and expanded phase caps require one specific
owner approval before execution. Mock acceptance is not native sandbox acceptance,
credential isolation, actual agent reuse or G1–G4 completion.

### Collected owner attempt: entry unavailable and protected-ancestor conflict

The new durable result was independently read at SHA-256
`82dd2ea01b2f681bed5b320181b9bfdcc41e9e3b5dd25a9d25f21d2433cb9dc4`.
It records STARTUP_DEADLINE at180225.1ms, no collector-start ACK/result, protocol
delta[0,0,0], live before/after controls, unchanged prepared files, native signal9/
reapedtrue, restored terminal and owned-listener cleanuptrue. Assertion outcome,
checker process outcome and final collection remain UNKNOWN. The owner separately
reported Node22.13 MODULE_NOT_FOUND for the collector entry. No checker assertion
ran in the supplied report; no exact typed argv or generated native sandbox
profile was retained. Protocol0 alone is not an execution counter, and the report
does not measure model requests. This is not a REDUE failure or an established
sandbox enforcement result. No automatic retry is authorized.

Current staged wrapper010833/helperc9f6/settingsdfc808 hashes still match the
reviewed proposal. The collector is a regular non-symlink single-link mode600
owned file; its workspace and durable-base parents are canonical owned mode700.
The lower-case denyRead path `~/Library/Application Support/redue` and upper-case
REDUE ancestor resolve here to the same device16777232/inode1073534877. The
collector's lower-case alias likewise resolves to its inode1075097668. Thus the
public controlled entry and inner checker were placed inside an existing
protected read-denial ancestor. The configuration conflict is established by
current metadata, without assuming a newline from terminal wrapping or claiming
the file is absent outside the sandbox.

Bounded public-source inspection of pinned native187 corroborates the intended
ancestor behavior: `JF` at198174678 expands `~/` with homedir; `v0d` at198193837
emits `deny file-read* (subpath ...)` for non-glob denyOnly paths; `k0d` invokes
that read-policy builder. Selected filesystem denyRead feeds denyOnly through
the reviewed runtime configuration path. Directory metadata allowances in that
builder do not allow the denied regular-file contents. This provides a strong
source-grounded read-denial explanation for the entry error; the unretained
actual argv/profile prevents proving that this was the sole runtime cause of
the reported MODULE_NOT_FOUND. The first reviewer bounded-source extraction had
a syntax error before evaluation; corrected read-only extraction succeeded.

The smallest correction to prepare is to place only the noncredential controlled
code leaves outside the protected state/configuration ancestor, rebind their
exact source/entry identities and protect them from writes. Preserve credential
locations, the broad protected-ancestor denial, existing fixture/socket authority
and prior artifacts. Do not add an ancestor read exemption merely to launch the
entry. Path rebinding alters checker/wrapper bytes and the exact command/profile;
it requires a coherent independently reviewed proposal and specific owner
approval before any operation. Where fixture locations can remain unchanged,
relocating them is unnecessary. A separately approved in-context metadata-only
diagnostic may distinguish the observed entry-resolution error if static evidence
does not suffice; none was run by this reviewer. No native/checker/model launch,
settings application, credential read or new permission was performed here.

### Entry metadata diagnostic and code-only relocation blueprint review

The final disabled inline diagnostic body is independently reviewed at
`82a0382dbcfcaf4fb1d0f620d4f9357ab9157543d881448a463de10665922bce`;
its separate proposed settings are
`724f1e654ce1ee70c9456c92780b8bf19fae60521ae96888b0c69704a8122f2d`.
It requires only builtin node:fs and handles exactly the original entry/checker
roles. Operations are lstat, realpath identity comparison, bounded-target
O_RDONLY|O_NOFOLLOW|O_NONBLOCK open, fstat and close. Neither target contents nor
target code is read/imported/executed; no child process, socket, auth or network
operation is present. Only fixed role labels, static errno/status enums and
metadata booleans leave the body. Unknown error text is withheld. Each operation
has a separate field, so realpath failure after successful lstat cannot imply a
missing file, and fstat/close failure cannot erase an observed successful open.

The first unexecuted proposal accidentally placed a private entry path inside
the output scope, and conflated later realpath/fstat failures with earlier
lstat/open fields. Both preparation defects were corrected before any native
diagnostic operation. Five author mock controls were independently rerun and
passed. Eight independently composed mock/data controls passed exact command/
body binding, unchanged settings except command/self-protection, actual phase
counterexamples, unknown-error suppression, no-private-path output and refusal
to open a noncanonical target. Every filesystem adapter targeting the proposed
files was a mock; no in-context filesystem diagnostic or native action occurred.

The settings delta changes only the exact prospective owner command and appends
the new selected settings file to existing denyRead/denyWrite. Previous strict
sandbox, response=false, Bash shell, network/socket and credential restrictions
remain intact. This is GO_FOR_OWNER_APPROVAL for proposal data, not operation
authorization or proof of readability/enforcement. Any actual diagnostic requires
a separately approved finite operation bound and existing fresh source/auth
prerequisites; the old collection allowance must not be reused implicitly.

The relocation blueprint remains NOT_APPLIED/NOT_TESTED. It moves only the two
noncredential public code leaves and native working directory outside the
protected ancestor, rebinds entry/digest/command and local-authority guards, and
protects the entire new code parent against replacement/writes. Physical
nonmembership in all expanded/case-aliased denied ancestors must be proven; a
different lexical prefix alone is insufficient. Original credential/Keychain
locations, state, synthetic targets/socket grants and prior artifacts remain in
place. No new workspace, settings application, listener, native/checker process,
model request or permissions change was performed in this review.


### Code-only relocation and owner-operated diagnostic preparation

The final private helper is independently source-reviewed at
`899ab247e47df83b71e076d5c1e4174cccbcc519d9503cb8da14a8475dda72ff`.
The relocated checker is
`579af20e9055163c37e95e0aebba97c7732a65b81d0dd6bc82ee41a11dbca4d7`;
wrapper `29ebbcdef49377da5d57fb2053d7fc92271e62c78f0331cd7a2233823f74679b`;
full profile `81e874fe9239caa4ceb63d2d9e847c4f7d08a8c02eea372085d4a13c8354c15a`;
diagnostic profile `982f4118dd441b65a919d9c99a602660b0984512b4e8ecfd9cfed223552a55e9`;
diagnostic body `14f62b23437448142e5d3691bb4e85523bc5136dab898c1ed214875181219c4d`.
Checker changes are limited to its executable-path binding; wrapper changes are
limited to its own entry, checker entry and checker digest. All six assertions
and execution/status/collection methods remain unchanged. Only public code and
native cwd move to a dedicated code container. The physical-ancestor guard must
refuse membership in expanded/case-aliased protected read ancestors. All prior
read/write denials are retained, with write protection for the new dedicated
code container and its parents. Credentials, namespace, state, synthetic targets
and socket authority remain in place; normal all-tools-denied settings still
hash to `5628de7667d4a5125c723ecbc3685336ef12cd80f15da83e6467b3826a337afc`.

Full and diagnostic profiles have identical restrictions after removing the
exact command permission, canonical digest
`a8f7b62e1e21eb3f29ddef88db0974768023a769d554464ed5ed9ffb4d116339`.
The fixed diagnostic input `68ce826c` is exactly one plain command plus newline,
intended for the owner to submit only after entering native 2.1.187 manual Bash mode.
Pinned 2.1.187 manual dispatch and respondToBashCommands:false remain source-grounded
no-inference expectations. Manual dispatch bypasses ordinary command approvals;
the literal permission entry is not an enforced arbitrary-command allowlist.
No reviewed noninteractive print/headless/SDK equivalent is substituted, and
no automated terminal input or decoder is present.

The diagnostic mode reuses guarded fixed native argv/env/cwd, same-session
foreground process ownership, terminal restoration and owned reaping. It has
180s owner startup and 5s cleanup bounds, separate exclusive lifecycle/process
records, no listeners, collector, checker, access-gate acceptance or terminal
capture. Its outcome is lifecycle-only; actual file-access JSON remains owner
supplied. An initial unexecuted `74c25e3` proposal swallowed Stop reasons and could
label forced timeout cleanup lifecycle completion. The `899ab247` successor retains
an irreversible sequence-error/cancel latch, static reason and observed native
exit/signal; timeout cannot qualify even after successful reap/restore.

The full mode remains blocked before listeners/native without the fixed
root-captured gate and explicitly selected digest. It binds current diagnostic,
profiles, common restrictions and physical source fingerprints. All eight role
rows must have complete static phase/nullable-boolean schemas. Both relocated
code rows must independently show safe metadata, readonly open, same-inode fstat
and close. Only EPERM/EACCES readonly-open errors for the two existing NONSECRET
protected regular files qualify their operation-specific denial. Real credential
and configuration directories are metadata-only, never opened; credential-body
denial remains NOT_TESTED. Original code rows must be complete but need not be
readable. Root-owned owner-output provenance is not hostile same-UID
cryptographic authentication. No gate was produced by this review or its mocks.

Independent reruns passed 13 Node controls, 12 owner-collection Python controls,
12 relocation Python controls including mocked 180s timeout, and 2 connected MOCK
controls using harmless children. Sixteen independently composed gate/refusal/
collision controls passed missing original rows/fingerprints, changed profile/
restrictions/body, relocated EACCES, protected ENOENT, credential-open refusal,
boolean typing, missing gate, invalid digest and existing private-record collision.
Missing gate/collision launched zero mocked native processes and zero listeners.
Reviewer test preparation initially aliased the fixture's expected bindings, then
encountered an author-edit nested-with SyntaxError, then used a non-TTY StringIO
and incorrectly expected a filesystem call. Corrected isolated controls passed;
these were test-preparation mistakes, not observed native/product failures.

Conclusion: GO for inactive staging, data-only verification and the specifically
approved owner-operated diagnostic preparation. Full collection is CONDITIONAL
on a genuine current native access gate and the owner's limited-surrogate
protection scope. No actual native/checker/model process, in-boundary diagnostic,
settings application, synthetic fixture provisioning or credential read was
performed by this reviewer. No native enforcement or portable/model gate PASS
is established by these source and mock results.


### Pinned187 permission-parser repair: fixed diagnostic script leaf

The owner's reported native warning identified the old inline JavaScript Bash
permission as invalid with Empty parentheses. Bounded inspection independently
confirms native 2.1.187 public-source BSr at194755299 and Tlu at194754773 reject
unescaped adjacent parentheses anywhere in the rule before content parsing;
JavaScript quoting does not exempt calls. This establishes a parser-level cause
matching the warning, not sandbox denial or actual diagnostic execution. Current
online documentation's nested-literal behavior must not supersede this pinned
implementation. No host version upgrade or general Claude behavior claim follows.
The first reviewer extraction reached a compiled literal rather than JavaScript;
corrected fixed public-ASCII ranges supplied the source proof, with no secrets or
native process involved.

The final inactive v2 helper is source-reviewed at
`5139c3056871c2286cee2841842bfc624e9db9b86d766bdcff14b0c9ee89f81c`;
full profile `636bab4db073b91c8165fae24de26cb537d3bacab6e99e2014a39fb157cab014`;
diagnostic profile `15dbfaf4db84fb014263fbfdeb6baddfff0f39bf9d95050ce02cf0b1a307e9b2`;
input `75fb685a18ec3c926016e59c9cf7c232e499dc3cdce52081c0bc7394fde67750`.
The diagnostic body remains byte-identical
`14f62b23437448142e5d3691bb4e85523bc5136dab898c1ed214875181219c4d`, now a new
protected CommonJS leaf in the already approved relocated CODE directory.
Its fixed command resolves by shell quoting to exactly the reviewed Node executable
and that one script pathname. It has no wildcard, prefix allowance or inline
JavaScript syntax. No original diagnostic target contents/code, credential file,
network, checker or model operation is added.

All old denials, network/socket scope, environment masking, strict sandbox,
no-unsandboxed fallback, response=false and Bash shell remain. Only the new v2
selected profile paths gain denyRead/denyWrite, and the diagnostic code leaf gains
explicit denyWrite in addition to its protected existing parents. Paired profiles
have identical restrictions except the single exact command, canonical digest
`6a03032a5ccffc60d83c8f7cc4b7961530f157c60050003a030f7e5f8339b8ad`.
Checker/collector bytes and six assertions are unchanged. Diagnostic180/5 and
conditional full180/15/5 clocks, timeout latch, exact OS exit collection and
cleanup rules are unchanged. A new v2 record/gate namespace preserves every old
attempt rather than overwriting it. Full-gate validation additionally binds the
current v2 helper byte digest and physical identity; missing/changed helper facts
refuse. Genuine root-captured owner-output/current-source bindings remain required;
mocks or outer file metadata cannot substitute for the native access gate.

Independent reruns pass4 pinned-parser controls,12 relocation controls and5 v2
binding controls. Eight additional independent source/data controls pass helper
binding absence/mutation, stale common restrictions, exact shell argv/permission,
unchanged body and byte-for-byte provenance of all twelve extracted public parser
ranges. Earlier independent Bash-subset controls3PASS reproduce old invalid/new
literal-file valid and exact content binding. These parser tests isolate the Bash
branch and do not establish native command-permission enforcement; manual direct
Bash dispatch still bypasses ordinary command approval as previously reviewed.
The small unexecuted3bc05e5 helper's stale inline-command print label was corrected
in5139c305; no execution method changed.

The reviewed private procedure60d69b31 and stage manifestd879ed14 select six new
exclusive mode600/no-follow files, with separate manifest preservation. Root must
finish the old parent and revalidate source/auth/absence prerequisites before
staging/operation. Conclusion: GO for the in-scope inactive repair and data-only
verification. The owner may subsequently use the reviewed manual diagnostic
under standing authority; any warning/unknown mode stops without Continue or a
model-assisted fix. No native/checker/model process, diagnostic body execution,
terminal controller/input, settings selection or permission change occurred in
this independent review. Native access/enforcement remains UNKNOWN; full
collection stays conditional on actual current eight-role gate evidence, with
real credential-body denial still NOT_TESTED.


Doc-only preparation correction after that review: procedure60d69b31 claimed the
owner exited without Continue/Fix with Claude, exceeding the observed evidence.
The corrected procedure is
`0771540a26acd2df6ef4b6521d2145287d7ec3aa1028e335ea545a94487a5afb`;
its stage manifest is
`14b53f0e1ff7456e3e7b7e219604385599bee47b05612cb6ba80cbd74a07f320`.
It now distinguishes the owner-reported warning, root's Exit instruction, observed
native exit1 and absent diagnostic JSON from the unobserved option selection or
command submission. Preparation-only zero counts are separated from owner
history. Independent light review verifies corrected provenance, exact manifest/
procedure binding and unchanged5139 helper/code/profiles. GO remains inactive
staging/data-only verification, not native enforcement. No new test, native,
checker, model, settings application or diagnostic operation was performed.


### Actual owner-operated v2 diagnostic and captured-gate review

Actual owner-supplied eight-role diagnostic capture
`e578d137d2841ff5283cd2013a70cd80cea9a6d01623b3f8606cce2f0b7a8a8c`
is independently read-verified as owned600/single-link, stable and bounded.
Both relocated code roles show regular/canonical owned600 single-link metadata,
readonly open, same-inode fstat and close success. Both original code roles retain
EPERM lstat and otherwise unperformed phases. The two existing NONSECRET
protected settings/canary roles show EPERM lstat and readonly-open denial, with
fstat/close unperformed. Configuration/credential directory roles show only
metadata, no opens; their mode600=false and single_link=false are directory facts,
not failed assertions. All eight rows pass the current narrow row validator.
Real credential-body denial remains NOT_TESTED; no protected contents were read.
The capture is OWNER_SUPPLIED_NATIVE_OUTPUT_NOT_COORDINATOR_MEASURED, not a
coordinator-collected tool trace or authentication against hostile same-UID code.

The actual saved diagnostic lifecycle
`dba602d456b95c81c312327898917df0fae4f1637f962935fad58cad7764d14a`
records native exit0/no signal, reaped/restored/current-file flags true,97,657ms,
and LIFECYCLE_ONLY_NOT_BOUNDARY_VERIFICATION. Its
REQUIRES_FINAL_PARENT_COMPLETION marker correctly prevented treating that saved
pre-persistence snapshot alone as completed-operation proof. The later actual
owner-supplied final capture
`b7565da2e7e27c537be437fead29ad92ea314b7f0c8ff1e4a82582c8f51a03e2`
adds persistence_completed=true and97,669ms, retaining the same lifecycle fields.
Outer helper exit was NOT_SUPPLIED and is not inferred. Enforcement remains
UNKNOWN and model policy EXPECTED_DISABLED_NOT_MEASURED. Actual dedicated native
completion is also reported by the integration owner; a PID alone is not used as
cleanup evidence. No native startup or stdin operation was performed by this
reviewer.

Root prepared only a candidate, independently reviewed at
`a33d6b1ae094f58ef5956d90ebff861d347d5c3f703dcd40811b023067ced425`,9,594bytes.
Fresh read-only current-source verification matches all thirteen source
fingerprints plus helper5139 byte/physical identity. The diagnostic in this
candidate is exactly the actual owner capture. All four bound evidence records
match their current byte hashes and physical identities, including the actual
owned-process marker
`d5c2e6c111823be1157b7c9aaab4ce97eef4738edc8bfcdaa32e960a26f71e8d`.
Saved/final lifecycle scopes, phases, exits, cleanup and currency agree, and the
finite elapsed limits hold. Candidate acceptance scope is explicitly
READABILITY_AND_NONSECRET_DENIAL_ONLY, with credential body NOT_TESTED,
full checker NOT_RUN, model behavior NOT_RUN and outer exit NOT_SUPPLIED.
It supplies no producer trust or portable applicability authority.

Conclusion: GO for root's exclusive exact-byte copy of the reviewed candidate
to the fixed gate, then selected-digest require_access_gate/readback before
conditional full manual handoff. The fixed gate was absent during this review;
this reviewer wrote no gate. The prevalidated owner procedure uses only the
fixed quoted Node/collector command after native187 manual Bash mode, current
full profile636bab/helper5139 and180s startup/15s collector-ACK window/5s cleanup.
Literal command permissions are not an enforced manual allowlist. All six checker
assertions and actual child OS close/exit collection remain unchanged. Its durable
assertions/status must remain separate from final parent persistence/lifecycle
completion, including FAIL and UNKNOWN. This access gate does not establish full
native enforcement, cross-agent/two-machine model reuse, capacity, economics or
the release goal. No checker, model, listener, settings application, controller or
native process was started in this independent review.


### Actual owner-operated bounded native synthetic check

The actual owner final collection capture is independently verified at
`679754cad787c3ab62be73202857f73895b69a2c925912f1eb530ee05f0c2144`;
the saved immutable collection is
`b119f866376a264859b6ab5b6017a40c6c0958e1529a4d6c8851fcad32cffc71`.
Both are bounded, stable, owned600/single-link records. Their common fields agree.
The saved record deliberately keeps collection_status=UNKNOWN and
REQUIRES_FINAL_PARENT_COMPLETION, while independently retaining checker PASS,
actual OS exit0 and pre_persistence_context_outcome=PASS. The later owner final
JSON supplies collection_status=PASS, persistence_completed=true and11,047.1ms
versus the saved11,034.5ms. This resolves final completion without rewriting the
saved pending record. Owner-output provenance remains explicit, and outer helper
exit status remains NOT_SUPPLIED rather than inferred from the source return path.

All six actual static assertions pass: custom nonsensitive sentinel absent,
synthetic protected read denied, synthetic outside write denied, the exact allowed
synthetic socket returns its expected response, the other owned live socket is
denied, and owned direct loopback is denied. Denials use permission errors, not
missing/closed endpoints. Recorded live controls pass before and after, and the
between-control protocol delta is exactly[1,0,0]. The unchanged reviewed supervisor
records EXACT_REVIEWED_SUPERVISOR_CHILD_CLOSE_EVENT, checker exit0/no signal and
timeout=false. This is separate from native CLI parent cleanup: its native exit
is null, signal9, reaped=true. A cleanup SIGKILL is not a failing checker exit and
must not be reported as native host exit0.

The final report preserves collection_error=null, assertion PASS/process EXIT_ZERO,
current-file, reap, terminal-restore and owned-listener-cleanup flags true, with
219.2ms cleanup inside the five-second cap. Applying the unchanged5139
collection_status predicate to those actual fields returns PASS. Fresh read-only
verification matches thirteen source fingerprints and the selected a33d6b1a
access gate. Owned socket paths and outside-write canary are absent. Dedicated
process marker
`706da44448c031b04056053f87fb20e67d980386dcdb077d7d8c28342c5a4954`
is independently verified; dedicated PID metadata confirms absence. That absence
alone is not reap or process-group completion proof; recorded owned wait/reap and
cleanup evidence remain necessary. No native startup, checker process, socket
connection, model call, settings change or gate write was performed by this
reviewer; process inspection was metadata-only.

Classification: PASS for the six specifically configured synthetic boundary
checks on this owner-operated pinned native187/manual-Bash invocation. The result
is not a general command allowlist, all-credentials masking certificate, arbitrary
filesystem/network security claim or actual model adoption/reuse trial. Real
credential bodies were not read; the synthetic socket is not observer authority
or another REDUE transport. Model policy remains
EXPECTED_DISABLED_NOT_MEASURED, not a measured zero-inference count. This local
host result does not establish matched hosted receiver provisioning, Copilot
included capacity, cross-agent/two-machine reuse, whole-task economics or G2/G4.
Every earlier failed/unknown attempt remains preserved. No release or producer
trust authority changes follow from this result.


### Disabled native receiver adapter aligned to reviewed187

Independent critical source review covers author b673e43 and its doc-only test
count correction a4dda17. The existing data-only invocation constructor now
requires exactly native2.1.187 and public binary digest
`a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3`.
Other versions, arbitrary valid-looking digests and invalid executable basenames
are refused. Version is labeled proposed and native_binary_verified_by_adapter
is explicitly false: the constructor does not read or execute that binary.
The obsolete146 schema blocker is replaced by current matched-VM/authentication,
credential-isolation, model-tool, native-code/startup-policy, included-capacity,
exact-origin/current-policy and caller-aware evidence prerequisites.

requireClaudeReceiverActivation still unconditionally refuses. A supplied local
six-check success, approval/activation flag, matching static version/hash or
proposed settings cannot launch a model or waive host/evidence conditions. Actual
local187 manual-Bash PASS remains limited to its recorded invocation; it is not
VM provisioning, model-tool enforcement or real hosted-credential proof.

Settings changes are additive denials only: Keychain read/write, the exact
selected settings file read/write and the selected native executable leaf write.
All old host-config, installation-prefix and producer-registry protections remain;
root/state write grants, one observer socket, network restrictions, strict
sandbox/no unsandboxed fallback, tools/MCP/hooks/plugins and proposed eight-turn/
300-second bounds are unchanged. No arbitrary executable parent, root or home
scope is granted or treated as physically immutable. Dedicated-parent identity,
effective startup policy and actual matched-host boundaries remain unverified
prerequisites. No token values, owner credential-store copying, global settings,
workflow activation, signing authority or producer trust is introduced.

The six affected pure controls were independently rerun and pass. Ten additional
independent constructor/activation counterexamples pass obsolete/manual-version
rejection, alternate digest and boxed digest, unknown approval/token keys,
invalid leaf/timeout, unchanged six proposed credential denials/one socket and
refusal of a deliberately mutated active-looking proposal. These are data-only
controls, not host/model behavior or capacity evidence. The receiver document's
Four-test count was corrected to Six before integration. GO for this narrow
reviewed alignment, with permanent disabled activation retained. No native,
authentication, model, CI process or settings application was performed by this
reviewer; no G2/G4 or release-ready claim follows.


### Healthy direct-test baseline and diagnostic-state fixture correction

Actual product run38185767714/macOS job114607630351 fails the gap/reconciliation
case's initial CURRENT assertion. Read-only public log inspection confirms
UNVERIFIED/PASS, exited invocation, stable=false, identical start/end revision127
and only end checkpoint unavailable. Generation1 shows successful initial snapshot,
plan rebuild and four root-replay completions, then root-replay history_timeout
with deadline300, observation_gap and reconciliation_started. The failure is
emitted2026-10-11T23:57:27.078731Z with5,224.04375ms test duration. Those are CI output
metadata, not individual history-event timestamps; diagnostics have no timings.
The retained bounded excerpt hashes
`e194c4138ac6049b26f55f5235dc4c55f9e8652c95ce28bec11e9d37e81e7125`.
Underlying reasons the query did not settle within300ms remain UNKNOWN. No native
API/load/scheduler flakiness claim is established. The conservative runtime
response correctly preserves compiler PASS without making the incomplete run
eligible; subsequent polling cannot repair the missing original end boundary.

Independent source review confirms the fixture sets its300ms override before
start/run/healthy baseline, while intentional history-fail/reconciliation/drop
files are written only after that CURRENT assertion. Daemon startup captures
that deadline for its lifetime; the production default remains5000ms. This case
uses an immediate explicit fail injection, not a hang, so the shortened healthy
baseline deadline is unnecessary. Separate hung-history deadline/stop controls
remain. The first log filter was overly broad and several path guesses did not
match files; corrected source/log reads established the specific evidence above,
with no tests or runtime operations triggered by those searches.

Root's original local unprofiled300ms single case passes7,424.40ms: that does not
erase the real CI failure or prove the override always fails. A separate original
profiling-enabled attempt fails652.16ms before baseline because its diagnostic
trace populates unowned state, and start correctly refuses ownership. This is a
diagnostic fixture defect, not evidence about the300ms history operation. These
root-reported targeted attempts and their retained failures remain distinct from
independent review's four pure diagnostic controls.

The exact three-file test-only diff hashes
`fa583dd278ade52ea9586baeaafe6c0f98ef35b14dccf17c2594bf6c1caa7004`.
It removes only this artificial deadline override and places optional timing
beside state in the fixture's owned base, updating the reader and bounded fixture
cleanup. It does not weaken ownership or grant access to a nonempty state. The
existing assertion sequence, including all76 assertion-bearing lines, is
mechanically identical. All explicit faults, initial CURRENT, receipt-ID,
non-reuse, stale/reconciliation and restart checks remain. Runtime source/default
deadline, compiler invocation, packaged bytes and production semantics are unchanged.

This exact diff was applied only temporarily in the isolated reviewer worktree;
four diagnostic controls pass50.59ms, then those overlays were restored without
committing the root author's test files. Root additionally reports the corrected
profiling-enabled real macOS case PASS7,087.60ms, three adjacent queued-edit/chunked
certificate/newer-FAIL controls PASS and the separate hung-history/stop case
PASS2,161.50ms. Those are author actual targeted results, not independently rerun
macOS acceptance or a new clean full matrix. Conclusion: GO for the narrow fixture
correction, retaining all failed history and current-binding requirements. No CI
rerun, native host/model trial, runtime change or assertion relaxation was performed
by this reviewer. Corrected hosted acceptance remains a later actual result.

## Disabled receiver declaration-write boundary

Source-only review of the disabled187 receiver proposal identifies an additional
activation prerequisite. Its current sandbox allows writes to the project and
state, while denying writes to the producer registry, installation prefix,
selected host settings and native executable. It does not yet deny writes to
the public redue.config.json or compiled project-runtime-v1.json declarations.
No activated VM/model route, exploitation or affected-user population is claimed.

bin/redue.mjs accepts explicit check.probes and combines them with built-in probes
in the compiled runtime. It refuses regenerating a changed public configuration
while an observer PID is alive; that does not prevent direct writes to runtime.
plan-worker.mjs reads that runtime file on a rebuild and may rediscover a changed
plan. declared-plan.mjs checks that probe argv arrays contain nonempty strings;
daemon.mjs subsequently executes every declared probe in its full-probe loop.
The direct compiler qualification can correctly mark extra probes unresolved,
but that withholds reusable evidence rather than forbidding those probe launches.
selectedConfigHash compares current declarations with the current plan, not an
immutable owner-approved execution-authority digest.

Generic owner-configured probes are existing product behavior. The narrower
future receiver must continuously prevent agent changes to those authority
declarations, including protected-file replacement through writable parents.
Review additive exact declaration/ownership-file write denials and physical
identity/content bindings before activation; preserve ordinary receipt writes
and the existing direct compiler scope. A trusted callback's before/after status
validation is an interval check, not continuous enforcement against a daemon
reading an intervening mutation. Keep requireClaudeReceiverActivation permanently
refusing until the actual matched-host authority boundary is established. No
core implementation, proposed settings or host permission was changed here.

Retained pinned187 source establishes that manual Bash and model Bash share the
native Bash execution implementation, while manual dispatch bypasses ordinary
command permission approval. A source-bound, actual no-model test on the target
VM can establish executor prerequisites before a first model trial; it cannot
certify model command permissions or another tool path. No supported equivalent
noninteractive same-Bash invocation has been demonstrated for the pinned native
CLI. Local manual PASS therefore supplies neither hosted VM authority nor an
automated model launch prerequisite by itself. No native or model action was
performed for this source review.

## Held authenticated recipient fixture lifecycle

Independent review covers author commits00e1ccb,39b1cdb and57c4a1c, limited to
the existing machine recipient acceptance helper and its new synthetic lifecycle
tests. The exact final two-file overlay was tested against root359916f in an
owned archive with the existing dependencies linked read-only for that run and
pinned Node22.13.0. The dependency link was removed afterwards. No installed
artifact, native observer, signature verification, authenticated import, model,
hosted VM or CI trial was performed. The expired earlier signed artifact is not
treated as currently available or accepted by these mock controls.

The synchronous legacy route retains its unrelated edit, restart/inheritance,
relevant STALE and no-equivalent-local-run assertions. The new awaited route
allows only trusted engineering preparation/supervision callbacks selected by
local code; imported data cannot select callbacks or execution authority. Its
callback context exposes paths, a historical independently returned eligible
baseline, a bounded status operation and an AbortSignal, without a general
executor or fabricated host-doctor authority. prepare completes before the
observer starts and before trust provisioning/import. Actual existing local
configuration, ownership, authenticated import and synchronized applicability
checks remain required; synthetic responses do not establish those real gates.

The initial proposal did not bind compiled runtime bytes/physical identity, or
check immutable authority on successful callback completion. Final source binds
the validated runtime, config/root/state/owner, exact registry and CLI identity
before/after status and before publishing successful supervision. Any observed
authority failure is latched: catching it and restoring the file cannot revive
query or successful-completion authority. Registry replacement and no-query
authority changes are refused too. A legitimate source edit may finish STALE;
prepared_eligible is a baseline observation, not continuing CURRENT or final
reuse authority. These interval checks do not fix the disabled proposal's
continuous declaration-write boundary described above.

One independent39b counterexample advanced the mock monotonic clock during the
last file read after callback completion. Its expected TIMEOUT rejection was
missing. The57c successor checks abort/expiry after the final binding barrier;
the same counterexample passes. Three additional independent controls pass
final-binding cancellation, caught/restored exact-registry replacement and
runtime mutation during a status operation without returning that response.
The four targeted author suites plus these four independent controls pass
154/154, zero failures/skips, in2,933.34ms. Retained owned review TAP identities:
pre-fix98362ad1…, post-fix7c3dc4f1…, final aaa711d9…. Final helper SHA-256 is
719acc04c2c815f909f2ba5361e2e0518eb041f1da5c4cef41988cd0135304bd.
Author preparation failures and original negative outcomes remain retained.

The300-second cap is a cooperative monotonic callback/acceptance bound, not
arbitrary-JavaScript preemption or a hard all-process wall-clock limit. Existing
synchronous setup/status children retain separate120-second limits and can
delay timer delivery; expiry observed afterwards withholds success. Trusted
callbacks must consume the signal and supervise their own children. Their
returned data is not automatically sanitized model-trace evidence. Strict held
cleanup requires the approved CLI's stop response ok:true and an absent observer
lock; failed cleanup or changed CLI refuses closed success. It does not certify
arbitrary callback-child reaping or run a changed executable to obtain cleanup.
Conclusion: GO for this bounded test-helper lifecycle extraction, with those
limits and the permanently disabled native receiver retained. No G2/G4 or
receiving-agent reuse is established by this review.

The related disabled-proposal correction5414fec adds only exact write denials
for public redue.config.json, compiled project-runtime-v1.json and the existing
vstate-owner-v1.json declaration. All old read/write denials remain; project/state
write grants and socket/network scope are unchanged. None of those declarations
is made unreadable to the normal CLI. The new explicit
MATCHED_VM_CONFIGURATION_PARENT_REPLACEMENT_NOT_VERIFIED blocker and permanently
refusing activation preserve the unresolved actual native parent-replacement
and enforcement gates; the constructor does not claim that leaf rules alone
protect a writable parent.

Seven selected pure controls pass independently in54.21ms on pinned Node22.13.
The new ordinary CLI compatibility fixture was source reviewed and was not run
by this reviewer. Its author reports an owned, read-only-file cached/synchronized
status check preserving config/runtime/owner bytes and physical identities with
no recorded check; that demonstrates writer compatibility, not native sandbox
enforcement. It retains all status/identity assertions and scoped cleanup, with
Windows explicitly unsupported for that POSIX fixture. Conclusion: GO for the
additive disabled data proposal only. No host settings, VM, model, observer or
credential operation was performed by this reviewer for this correction.

## D9 programmatic diagnostic: finite startup-source review

The owner permits a conditional single hosted native diagnostic, at most four
turns and120seconds, after its real credential/startup inputs and included
capacity are established. No such run is performed here. This changes the
previous manual-console capability requirement, not the G2/G4 evidence gates.

The already retained official187/a59 native bytes were independently rehashed.
Pinned public-code conclusions are specific to those bytes. Empty setting-sources
still selects flagSettings and policySettings (nvt194807472). The settings loader
merges policy after flags. With an environment OAuth token, qs196583840 supplies
subscriptionType from an optional environment field or null; Uj200757695 allows
remote settings when OAuth exists and that metadata is null. A fresh config and
absent local managed files therefore do not establish remote-policy absence.
Setting a fabricated subscription tier to suppress that path is not permitted.

Safe mode also does not close this boundary: dl193563478 recognizes the flag,
Vl196896175 permits managed hooks/status-line/file-suggestion customization, and
n9r196897750 retains policy hooks even with the local disableAllHooks flag.
[Current official CLI documentation](https://code.claude.com/docs/en/cli-reference)
explicitly retains the same managed-policy exception. A newer pin is not
justified merely by the misleading abbreviated description of safe mode.

OAuth environment protection has a useful narrower positive source result.
aO196884965 (subprocessEnv) deletes CLAUDE_CODE_OAUTH_TOKEN and related background
authentication fields from its returned environment independently of the
sandbox/scrub flag. Xae200557818 uses that object for Bash spawning, but later
spreads environment overrides. Its getEnvironmentOverrides implementation copies
session variables. Hook spawning likewise adds plugin/passed environment fields
after aO. Consequently this is not unconditional scrubbing after every override.
With closed, reviewed hook/plugin/session inputs it proves the host token is not
forwarded by the ordinary path; intact effective credentials.envVars deny adds
the separate pre-sandbox env -u removal. The documented subprocess scrub feature
already exists in187; downloading a newer binary solely for its name is unnecessary.
No real token is exposed to a child to discover whether these rules work.

Six pure controls using three exact pinned source fragments pass: empty sources
retain managed policy; local hooks-disable and safe mode preserve a synthetic
managed hook; a policy-level hooks-disable suppresses it; aO removes a mock OAuth
value without changing its mock parent; subsequent overrides can reintroduce
that mock key. Fragments are retained privately with native SHA and byte-range
digests; these are code interpretation controls, not native enforcement. No
native/authentication/model or network process was launched for them.

No supported pre-hook policy inventory was established among the finite reviewed
native commands. doctor210656361 explicitly can spawn .mcp.json stdio servers
and inspects the updater. auth status reports authentication metadata, while
global preAction210587893 has already initialized settings/MDM and remote
settings before the action. The config subcommand reviewed at210655407 reports
auto-mode configuration, not the complete applicable remote managed policy.
None supplies a safe source-independent policy-absence certificate.

The exact remaining owner/provider input is an authoritative current fact that
the intended account/token has no applicable remote managed policy, or its
applicable policy snapshot reviewed for hooks, status-line/file-suggestion
commands, helpers, plugins/MCP and strict sandbox/credential settings. Retain all
actual local source/identity checks too. This input must not be replaced by file
absence, proposal data, a fake tier or an unreviewed native startup. Normal
owner OAuth provisioning and included-quota confirmation remain separate. If
these inputs are unknown, refuse the secret-bearing route before launch. The
author's still-disabled diagnostic code/assets are a separate pending review;
this finite source conclusion is neither activation nor an empirical VM claim.

Finite pinned187 permission-source follow-up: gDe204078641 calls hSo for allow
without stripAllEnvVars. aq204073891 strips only its actual U6t known-safe
assignment list; broad nWp environment stripping is selected for deny/ask
matching. Fourteen independent pure source cases retain seven execution-altering
leading assignment names and their seven env-wrapper forms: NODE_OPTIONS,
NODE_PATH, BASH_ENV, ENV, LD_PRELOAD, LD_LIBRARY_PATH and DYLD_INSERT_LIBRARIES.
Those names are absent from U6t and the normalized candidates retain their
prefixes. A trailing collector argument also remains different. No Node preload
or native tool was executed. These are actual pinned normalization primitives,
not an empirical whole-tool authorization result.

The no-wildcard rule is classified exact and the exact case compares the rule
command with its candidate. Native normalization can still strip redirections
and known wrappers; the literal rule is not a claim that native matching compares
only original bytes. Preserve dontAsk, autoAllowBashIfSandboxed:false, strict
sandbox/no exclusions, prelaunch secret/source/resource restrictions and the
fixed immutable collector. A reactive streamed-command rejection does not
authorize a command already dispatched. No broad prefix, trailing-argument or
additional shell-command grant is introduced by the proposed literal rule.

The new rendered checker/collector templates were independently compared with
the actual retained original579af20e…/29ebbcde… files. Only exact host, Node,
code-path and checker-hash bindings were replaced. Both normalized bodies match:
checker e55a30e93e4658605d2a018fbda603426c085549d522d51d898e6f2a70e57e92;
collector187b4a16b8663f5f206d30b76d107b5d6b5f16e882e828b49c5533c2dd5c8090.
This independently checks unchanged assertions/process collection rather than
relying solely on a render/normalize round-trip of the author's own template.
Original files remain unchanged. The authenticated workflow remains unregistered
and unexecuted; its completed lifecycle proposal requires separate final review.

### D9 final conditional proposal review

The final five-file author stack through `04ee1caed47e7506f4b211e401eff87cc4cc0aa3`
was independently reviewed without native, OAuth, model, fixture-listener or CI
execution. Its fifteen pure/mock controls pass (79.857542ms). The workflow remains
outside `.github`, with an unresolved integrated-source pin, a protected owner
account/policy statement, included-capacity requirement and normal private OAuth
provisioning. Conclusion: **GO for integration of this conditional, unregistered
proposal; no deployment or empirical enforcement claim.** The current route
admits only the authoritative no-applicable-managed-policy case, not an unknown
policy or a fabricated subscription tier.

The initial literal Bash allow did not exclude pinned187's implicit read-only
fallback. The successor adds supported prefix DENY rules for all94 independently
extracted command heads, with no added grants. A separate source reviewer
corroborated the recursive table/spread union. Actual pinned deny/normalization
primitives and the permission-ordering function pass564 cases (94 heads times
six bare, quoted, wrapper and execution-altering-environment forms), before the
read-only fallback is reached. The exact quoted absolute Node collector remains
admitted; three controlled compound AST cases deny their other command. Parsing
and non-authority branch adapters are explicitly controlled in these tests;
they are not whole native parser or sandbox observations. The pinned sed safety
branch returns ask/passthrough, and the automatic-mode branch returns passthrough
under the selected dontAsk mode. The first reviewer fragment-extraction fixture
included a trailing async token and failed compilation; its corrected function
boundary passed. That was test preparation, not an observed native defect.

The coherent route retains the original checker/supervisor assertion bodies,
one literal command, closed stdin, four turns, first run-attempt only, total120s
and bounded cleanup. Real OAuth reaches only the curated native-host environment;
runner/GH/OIDC credentials are excluded, and the nonsecret runner tracking marker
is preserved without reporting it. Reviewed closed startup/session inputs and
the source-derived credential removal remain prelaunch conditions. Hook/system
contradictions in the native stream irreversibly withhold success; reactive
refusal does not undo a hook or replace the owner policy fact. A fresh dispatch
also needs the integration owner's one-operation ledger.

Only a matching native assistant Bash tool-use ID, native tool result, independently
collected checker report, observed checker OS close, six assertions, live controls,
unchanged identities and completed lifecycle can support the diagnostic result.
Failed assertions survive collection uncertainty; missing data remains UNKNOWN.
Cancellation is bounded for the owned native group, but UNKNOWN does not claim
all native Bash descendants were cleaned. The private pending result preserves
assertions/status independently of a terminal copy; final completion is checked
after persistence. No raw transcript, stderr, token or model prose is retained.
No explicit allowWrite entries is not universal filesystem immutability: implicit
native temporary access remains disclosed. Six named synthetic operations neither
open real credential bodies nor establish REDUE applicability, receiving-agent
reuse, VM equivalence, G2/G4 completion or a release-ready artifact.

## Coherent incomplete-origin signer control — independent integration review

B's d204523/root5022cbb adds only13test lines. The new fixture changes
origin.complete to false, regenerates the envelope subject/semantic digest and
manifest raw digest, retains nonnull facts and all other positive bindings, then
requires the exact approved Python data validator to fail without publishing a
signing predicate. It therefore isolates completeness from the existing broken-
integrity mutation. Root independently checked the fixture/validator bindings
and ran all12controls:12PASS,526.036ms on Node22.13.0. B's in-memory guard-removal
experiment lets the coherent negative through while both versions reject the old
integrity-broken negative; production validation remains correct. This repairs a
regression blind spot, not a discovered product defect. The approved workflow
bytes/hash, signing authority, runtime, trust and imported outcomes are unchanged.
These pure validator tests do not establish native/model or new live CI evidence.

## Recipient preparation and installed cleanup — independent integration review

B4d99cf1/root79e3bf6 corrects the shared-writer ordering mismatch without
fabricating state ownership: installed start creates owner/runtime first;
trusted guidance preparation finishes before fresh-history checks, authentication,
import and the eligible baseline. Physical/raw authority bindings, latched
failures and strict cleanup remain. Source review by root and C found no new
boundary defect. Its shared-writer unit control uses a mocked CLI, not a real
installation or native host.

Root then exercised exact installed b8122c3b bytes. The first private harness
import had one extra parent segment and launched nothing. The ordinary npm
installation hit its120s limit before any observer; public registry HEAD separately
returned curl35/no HTTP response. Neither proves publisher authentication failure.
An ordinary offline-cache installation succeeded and actual init/start/preview/
apply/fresh-status passed, with real owner bytes/inode preserved and no runs or
import. Cleanup then exposed a test-helper API mismatch: `stop` defaults to human
text, but strict cleanup parsed JSON without requesting it. The real observer
stopped and its lock was absent; the original failed collection is preserved.

B126e3c3/root2a74328 adds only `--json` to owned stop and makes its mock faithfully
return human text when absent. The new pre-fix control fails with CI_MACHINE_CLEANUP;
the corrected control succeeds while still requiring ok:true and lock absence.
Root independently reviewed the real CLI printLifecycle branch and ran seven
affected suites:158tests/157PASS/one platform skip/zero failures,800.320ms.
The corrected exact-installed eight-command procedure passes: healthy fresh
UNVERIFIED, no local outcome, unchanged owner bytes/inode, genuine shared guidance,
JSON stop ok:true and absent observer lock. Private result SHA-256
fdab8cba811c811329f49c96cf7278218887fb6a0469fb77acd62f90a0f8c3c5.
This establishes installed preparation/cleanup mechanics only: models0,
native processes0, no authenticated import or recipient reuse. All preceding
failed attempts remain separate. Runtime/bin, signing bytes, producer trust,
historical receipts and normal installations are unchanged.

### Manual-only workflow registration review

The isolated registration branch adds only
`.github/workflows/portable-claude-diagnostic.yml` to the inspected origin/main
baseline. Candidate SHA-256 is
`a5f4e589823844144203e98151d315cd785f6d7d09212a720749618789e43e72`.
Independent byte comparison against frozen template
`977154c61c2771643ea3d874c6a90ad92de8b125bdb3322d5c2e2ca2ad7fd54d`
confirms only two introductory comments and the unresolved source placeholder
changed. The concrete checkout pin is
`da0b1080f3edcc68f3d4067cb51f961759e68312`; its diagnostic, assets and tests are
byte-identical to independently reviewed04ee. The workflow revision and that
checkout source remain distinct identities.

YAML and static checks pass: workflow_dispatch is the sole trigger; one macOS26
job is bounded to two minutes; permissions are contents:read; exact repository,
actor, dedicated ref and run-attempt1 guards remain; the protected environment
and its current owner-policy/capacity facts remain prerequisites. Only the native
host step references OAuth. Missing facts fail before the public native download
and the secret-bearing step. No upload, cache, OIDC, signing, automatic execution,
terminal input or retry route was introduced.

Frozen exact-source controls pass15/15 (77.928708ms), using only mocks and lexical
data. The initial reviewer extraction omitted the invocation module and failed
import resolution before controls ran; adding that unchanged exact-source module
restored the import closure. This is a reviewer preparation failure, not an
engine or workflow failure. No native/auth/model/listener/CI operation occurred
in this review. Conclusion: GO for the normal one-file registration PR and merge;
neither can trigger this manual-only diagnostic. A later dispatch requires the
registered workflow on its selected dedicated ref, current provisioning/facts
and the coordinator's one-operation ledger. Registration alone supplies none of
those facts and demonstrates no native enforcement or acceptance-gate completion.

### Owner-only token procedure — narrow independent review

C freshly rehashed nativea59/settings5628 and the existing guarded launcher,
confirming canonical owned single-link expected-mode files. Pinned187 registers
setup-token as its subscription-auth subcommand, not print/inference. The proposed
command preserves the existing Keychain namespace selector, config/GH locations,
all-tools-denied settings and strict empty MCP; empty setting sources is stricter
than the existing project's/local loading. C identified one startup-context gap:
a direct command inherited arbitrary terminal cwd. Root corrected it to a subshell
cd into the existing verified BASE/workspace, not the obsolete credential namespace.
The resulting shell syntax passes bash -n. Source/filesystem review is conditional
GO only after the actual no-policy/current included-quota facts. Neither reviewer
nor root ran native authentication, generated a token, read/copied credentials,
changed settings or created the protected GitHub environment. Metadata verification
reports keychain-item presence; it proves neither quota nor native enforcement.

### Fixed Windows regression diagnostic review

The opt-in fixture changes at `f1662966455afffda1bf60b3bfdfeb006c7b32a7`
preserve the original status/selection assertions, default child environment,
runtime and30/45/180s bounds. Timing files are owned siblings of fixture roots,
outside project/state, and opt-in fields expose static phases, counts and process
outcomes rather than argv, paths, environment values or captured output. These
changes do not establish a cause for the two observed Windows timeouts.

The isolated manual-only workflow, SHA-256
`53b6b0888194edd879ce4f4f920f83403f4d5f8213001864e58a539e7813522d`,
checks out that exact source on Windows2025/Node22.23.3. It admits the fixed
repository/actor/dedicated ref and first attempt, with contents:read,12 minutes,
no secrets, uploads, cache, signing or model route. Its two fixed cases execute
once each. continue-on-error allows the second case to produce evidence, while
the final always-step checks original step outcomes and fails if either did not
succeed. It is a bounded diagnostic, not an all-platform or native-model gate.

The initial reporter used size-before-readFileSync and therefore did not enforce
its byte bound against replacement/growth or nonregular paths. The correction
reuses the existing reviewed readBoundedPortableFile with1MiB limit and reports
only TRACE_READ_UNKNOWN on refusal. Phase filtering is format/known-family
filtering, not a fixed phase whitelist. Independent YAML/static and exact embedded
JavaScript syntax checks pass, as do four controlled projection cases: positive,
private-field exclusion, read refusal and513-row rejection. The first reviewer
YAML fixture passed a Buffer instead of a string and failed before controls;
correcting only that input type passed. No compiler, observer, native, model or CI
was launched by this reviewer. Conclusion: GO for the one scoped diagnostic;
retain actual outcomes without attributing the earlier timeouts to host load.

### Actual fixed Windows capture — evidence interpretation

One storage-free job38199273160 on exact workflow398388e/sourcef166296 passed
both planned cases without retries. The5.5.2 suite took118225.7ms (nested direct
107962.3ms); the selected5.6.3 old-receipt case took29736.0ms. This does not erase
the two timeouts and25-minute cancellation in38196115475 or establish a full
Windows product PASS. B independently analyzed the retained private fixed log:
12trace files,9AVAILABLE/252projected rows and3TRACE_COUNT_UNKNOWN. The standalone
old-receipt trace is one capped file; progress still establishes15successfulCLI
commands/no error/signal and the formerly failing direct-run opportunity5780.4ms.
Its detailed phases are unavailable. Two other capped files belong to nested5.5.2
real-direct/old-receipt fixtures collectively, but exact UUID-to-case mapping is
not retained. Available proxy-reader/startup rows are not a TypeScript-run cost
profile. Original timeout phase/cause staysUNRESOLVED; no runtime correction,
longer bound, weaker assertion, repeated job, native/model test or savings claim
follows. Test diagnostics are opt-in; engine/bin and immutable receipts unchanged.

### First hosted native diagnostic and static rejection classification

Protected final evidence for run38242312293 records source
`da0b1080f3edcc68f3d4067cb51f961759e68312`, pinned187/a59 and terminal job
failure with collection/assertion/process UNKNOWN. The reason is
NATIVE_SYSTEM_CONTEXT_UNKNOWN; native exit143 and signal:null are distinct
observations. No assistant message, tool-use/result ID, checker report or probe
connection was observed. Live controls, source currency, native reaping, listener
cleanup and result persistence are true. This is a parser admission refusal,
not demonstrated sandbox failure. The subtype and its phase were discarded, so
neither the actual subtype nor validated-init timing can be recovered from this
record. Zero assistant messages does not establish zero model requests. The
approved hosted attempt was consumed; this review authorizes no retry.

Classification-only correction `ed4219a` was independently reviewed against its
parent975544e. Reviewed helper SHA-256 is
`111e54cc2f76c1cb5c540fb266d606c712a521736e3ef0bc4ed75291ef31f683`;
the precommit two-file patch digest is
`be244bab998ea504a542e3beaeaba05ae755b1038def797a55d43568d8ff4f2a`.
Committed helper/test bytes equal the independently tested copies. The new
native_init_validated boolean and first rejected_system_event expose only a
known subtype code plus BEFORE/AFTER_VALIDATED_INIT. All40 table names exactly
match literal system-event emitters independently extracted from pinned public
code in the193–211MB range. That finite literal search is not an exhaustive
runtime schema or permission claim. Missing, malformed and unknown subtype
values collapse to UNREVIEWED_SUBTYPE; payloads, arbitrary text and parameters
are not retained. Classification never admits the event or clears its error.

Independent16/16 pure/mock controls pass (75.6705ms). Ninety-two additional pure
differential cases against the original da0 helper preserve every original
snapshot field, error and outcome after removing the added static field. Settings
are deeply equal, with no command, resource, credential, deadline or termination
change. Known/unknown privacy canaries are withheld and the first classification
remains latched. Conclusion: GO for the diagnostic-only correction, not a new
native operation, model trial, event acceptance or retrospective cause claim.
No native/auth/CI/listener/checker operation occurred in this review.

### Prepared capture revision: source pin only

Independent byte comparison of workflow commit
`7deb7d26e9a51c05592043a7304ce384760850d8` against the original registration
proves exactly one substitution: checkout source da0b108 becomes
`ed4219aa6eef8f3addd97fd8a1510ef51396215d`. Workflow SHA-256 is
`08ffcc4030772089175f35167b507602b7399e7368d21f343ea79a92fc934fa0`;
the selected helper is exactly the reviewed111e54cc… bytes. All triggers, actor,
ref, protected environment, OAuth step, permissions, turn/time limits and grants
are unchanged. No repeated tests were needed for this byte-identical wrapper
apart from the pin. GO for preparation only: the consumed first hosted attempt
remains UNKNOWN, and no additional job allowance, owner policy/source-fact update,
dispatch, trust or native enforcement is established here. No native/model/CI
operation was performed by this reviewer.

### Second hosted capture and rejected-retry metadata

Protected result38246645326, SHA-256
`a7b6aed37e181b24069006edcfc2d7796f5dca5499f080b1bd7b073c21fe4952`,
adds materially different evidence: native_init_validated:true and rejected
api_retry AFTER_VALIDATED_INIT. Its source is ed4219aa…; no assistant message,
tool ID, checker or protocol connection was observed. Native exit143/signal:null
and successful live controls, source checks, reaping, listener cleanup and
persistence remain separate. The result is still UNKNOWN. This establishes a
native API-retry event, not a permission denial, billing/quota diagnosis or
particular HTTP status. Category, status and retry counters were not retained in
this historical attempt and cannot be filled retrospectively.

Observation-only correction `85425a5ca5a1a1df8eb1c7e1f56ca7cd5405a107`, helper
SHA-256 `7817ba1781640e915a852c2501e67c9a6279251efdce74a396cf9b2eb9eb1c80`,
retains rejection/termination and adds only the first rejected api_retry's
sanitized fields. Pinned187 F7r at198672601 yields exactly overloaded, rate_limit,
authentication_failed, server_error or unknown; the emitter at210402872 supplies
attempt, max_retries, retry_delay_ms, error_status and that enum. Unknown category
values collapse to UNREVIEWED_CATEGORY. HTTP status is integer100..599 or null;
retry numbers have finite integer bounds; malformed/out-of-bound numbers become
UNAVAILABLE, not clamped or silently interpreted. No error text, message, URL,
session ID or payload is retained. These are native-reported classifications,
not independently measured transport status or an event-acceptance exception.

Independent17/17 mocks pass (81.778625ms), plus75 pure differential/first-event
cases against the prior helper. Original errors, outcomes and settings remain
equal; private canaries are withheld, the first retry stays latched and a later
retry cannot attach metadata to a different first rejected system event.
Conclusion: GO for the observation-only correction. It supplies no additional
native allowance, request outcome, enforcement, capacity or G2/G4 claim. No
native/auth/model/CI/checker/listener operation occurred in this review.

The subsequent workflow preparation
`babf43bd0ed25fb6e9567e14ae5a23178084436f` was independently compared with both
7deb7d2 and the original a5f registration. Only the checkout pin changes to
`85425a5ca5a1a1df8eb1c7e1f56ca7cd5405a107`; selected helper bytes equal the
reviewed7817ba17… SHA above. Workflow SHA-256 is
`159acc8c945a329fb2a0785366e8cb377ec79d78bec9553047d0eefc149773a3`.
Every other byte is unchanged, including manual trigger, actor/ref/environment,
OAuth step, read permissions, four turns,120s and all resource limits. GO for
the source-pin preparation only. Any actual operation rests on the owner's
standing authority and current prerequisites, not this review or a native PASS.
No model/native/CI action occurred and no tests were repeated for the unchanged
wrapper.

### Third hosted capture: authentication rejection established

Independent read of protected run38248933839 final report, SHA-256
`9f641cb664f139efc25bd0f2b866fce8ba9d9ef10ab04389e5df2c233b4346d4`,
confirms validated init followed by rejected api_retry AFTER_VALIDATED_INIT:
authentication_failed, HTTP401, attempt1, max_retries10 and delayUNAVAILABLE.
No assistant message, tool/result ID, checker or protocol connection was observed.
Native exit143/signal:null is preserved; live controls, source currency, reaping,
listener cleanup and persistence are true; total job time is15843ms. Collection
and enforcement remain UNKNOWN. This establishes the native-reported request
authentication rejection, not an invalid account, subscription or quota, and
does not retroactively assign this cause to the first two attempts.

The reviewed85425a5 source and159acc8c workflow preserve a nonempty environment
OAuth token from the sole secret-bearing host step into the native environment.
Missing/empty input refuses before launch; GH/provider/preload overrides remain
excluded. These source and prior mock observations do not reveal token contents,
prove its validity or turn native_parent_oauth_used:EXPECTED_NOT_MEASURED into a
credential-use measurement. No real secret value was accessed for this review.

Stop repeating the unchanged rejected authentication input. The exact remaining
owner action is to privately verify or replace the intended current subscription
setup-token secret in the selected protected environment, confirm its intended
approved account and current no-policy/included-capacity facts, and report only
completion. Do not copy login stores, publish the value or introduce an API/PAT
fallback. A future action needs an actual repaired/changed authentication input
under the owner's authority; this review performs or authorizes no further run.
No native/auth/model/CI operation or additional test was conducted by this reviewer.

### Changed authentication input and bounded thinking-progress framing

Protected report38250370384, SHA-256
`0272afed5728638530ac6adc71e00a5fe70cf59986102dec91025692583e1858`,
records source85425a5 and rejected thinking_tokens AFTER_VALIDATED_INIT following
the owner-reported secret change. No api_retry/401 was observed before this
stop, but that absence is not proof of token validity or a retrospective repair
of the prior401. No assistant message, tool/result ID, checker or protocol
connection was observed. Source/live controls/reaping/cleanup/persistence are
true; native exit143/signal:null, elapsed3444.184625ms and job19463ms remain
distinct. The result is still UNKNOWN, with enforcement and agent reuse untested.

Correction `7870dd172b5d059cffe312b3741c4da02d880dae`, helper SHA-256
`1c9b010fc6032c41f7ed066b7684d816296c7d1bd2acb1ec992ee0c93c42505e`,
admits one tightly constrained framing event rather than ignoring system events.
Pinned187 emitters210399315/210399682 yield exactly type, subtype,
estimated_tokens, estimated_tokens_delta, uuid and session_id from live estimate
or signature-delta arithmetic. Those yields contain no permission/policy/hook
mutation. Admission requires that exact six-key shape, a validated-init session
with strong UUID syntax and matching session ID, finite0..1e6 total/delta with
delta no greater than total, no prior error, no final result, and at most4096
frames. Only the count survives; values and IDs are discarded. The source can
reset its estimate per block, so no fabricated monotonic-total claim is added.

Independent18/18 pure/mocks pass (101.354917ms), plus24 malformed-frame cases,
four accepted numeric boundary cases that remain UNKNOWN without other proof,
and eight differential cases preserving other event rejection. Missing keys,
extra authority/private fields, malformed/mismatched UUIDs and numeric violations
do not qualify. Prior errors remain latched; hooks, API retries and other system
events still stop. Settings and all resource/time/turn limits equal85425a5.
This is transport framing compatibility, not model/tool/credential/enforcement
or portable-evidence authority. No real native/auth/model/CI operation occurred
in this review.

The accompanying prepared workflow commit
`d8cd8428c44ba7182c60605c241b9e73b3f24d5c`, SHA-256
`a0c5c5f34022f8011dc68307de214f4b66b597bd0918a501d7819fa19046c0ea`,
is independently byte-proven identical to babf43b except for the85425a5 to7870dd1
checkout pin. Grants, actor/ref/environment, secret handoff and four-turn/120s
bounds are unchanged. GO for this narrow parser and pin correction; actual
operations remain the coordinator's responsibility under current owner authority
and prerequisites. This review establishes no native PASS or completed gate.

### Hosted checker observations with unresolved final startup guard

Independent protected report38251411464, SHA-256
`ed3c192eaf7e0249d6660b3c46af62b0218d7cbbead94b92441fde1625f98a0e`,
retains all six named checker assertions PASS and observed supervisor child
exit0/signal:null. Matching native tool-use/result IDs, a matching separate socket
collection and protocol delta[1,0,0] establish the actual checker observation.
Native exit0, two assistant messages/two reported turns/eight admitted progress
frames, controls, immutable manifest currency, reaping, cleanup and persistence
are true. Overall collection remains UNKNOWN because the post-collection startup
source guard reported DIAGNOSTIC_STARTUP_SOURCE_PRESENT. Its role was not retained.
Do not guess a cache, credential store or managed policy, or convert manifest
currency into proof that all startup-authority sources remained absent. The
named observations are not a complete final diagnostic gate or G2 completion.

Correction `3e5e9460fb2289972cfff19183030b8e0c7f70e9`, helper SHA-256
`4cd11fb3293e094511e442038caa8c8ddc45b51e0636d3548e96df09a7b1d795`,
adds metadata-only fixed role and BEFORE_NATIVE/AFTER_NATIVE projection to the
existing refusal. All10 paths and lstat order remain equal: system managed JSON,
drop-in directory and plist, OS-user plist, isolated remote settings/credential
store, project .claude/MCP/instruction file and the fixed remote API-key path.
No contents are opened; presence and non-ENOENT errors still refuse. The output
boundary validates membership in the exact10-role set, rather than accepting
arbitrary exception strings. AFTER_NATIVE denotes the post-collection guard;
process reaping remains a separate observed field. No startup exception is waived.

Independent19/19 pure/mocks pass (92.179958ms), plus40 presence/errno differential
cases across all roles and28 fixed-role/phase projection cases. Private canaries
are withheld, and settings/resource/time/turn limits equal7870dd1. All filesystem
guard calls in these tests are mocked; this reviewer read no actual protected
startup path metadata or body and launched no native/auth/model/CI operation.
Prepared workflow commit `35a5ddf67012d7092c8a87235e6819f0ce145e6b`, SHA-256
`5f2c9f936b46d8e7759784b8fd610342333df072cefa08c6e6c4fc3e52f1ab6f`,
is byte-proven identical to d8cd842 except for the7870dd1 to3e5e946 source pin.
Conclusion: GO for the metadata observation correction and pin only. The genuine
final-guard UNKNOWN and all limited successful observations remain preserved.

### Remote-settings role and frozen-route empty-sentinel criterion

Protected final report38252736249, SHA-256
`fbb3deb9d7e4d0aabd6f75b0542abe860a3ef6fea8cab4ee9a409c88253f6903`,
independently confirms the same six named PASS/observed checker and native exit0,
matching tool IDs/socket collection/protocol[1,0,0], two reported turns and
successful lifecycle. The actual final refusal is ISOLATED_REMOTE_SETTINGS at
AFTER_NATIVE. Presence establishes neither file type nor content nor benign
policy. Its bytes were not captured. Keep this historical overall UNKNOWN;
no later source interpretation supplies its missing content retrospectively.

A final empty cache alone is insufficient for arbitrary native sessions: Ano
can apply settings in memory, cache them, and later overwrite them. The finite
pinned187 closure is narrower. Independent references corroborate one mutually
exclusive preAction bLn call. Its nonawait branch is explicitly accounted for:
utp returns only its first accepted response, and failed retries apply nothing.
Gje settings application is confined to Ano. K3e callers are interactive login
callbacks or a main onboarding branch with so assigned only inside !print; the
c3a alias is the local-JSX login module, with other lxe callbacks limited to
login/usage/upgrade/remote-control UI. These are unreachable under the fixed
non-slash print prompt, closed stdin, no SDK/bridge/UI inputs and sole literal
Bash collector. Automatic OAuth refresh has no independent K3e/Ano caller. The
background poll is a standard one-hour setInterval, outside the120s route. Fresh
prelaunch cache absence excludes stale settings; qpe is disabled in this pin.

W_a rejects nonempty raw settings if iCe yields null, and iCe yields null when
the parsed object has no own keys. Thus salvaging cannot serialize an accepted
effective nonempty policy as{}. Under the sole application/writer, observing
the native exact two-byte{} sentinel after successful reaping establishes its
accepted empty response even when that one fetch completed asynchronously.
This reasoning depends on the entire frozen route, current authoritative owner
no-policy/account fact and closed customization inputs. Ownership alone is not
authentication against arbitrary same-UID writers or malicious policy hooks.
Do not extend the criterion to interactive/login/long-lived/multi-fetch sessions.

Candidate `49b3f44fc9d8b0c74dab6ae3432252f7642a06a0`, helper SHA-256
`93aa3a0ccc8d92161d6c1b7d898216af0c6c7e3423e01d5e3c43ed40d39fb105`,
implements only that narrow post criterion. Prelaunch retains all10 absence
guards; postlaunch retains every other source refusal. Only an exact current-UID
600, single-link regular canonical file with stable descriptor/path fingerprints
and exact two-byte{} can qualify. Missing, nonempty, malformed, unsafe or changed
cache stays UNKNOWN; no general policy or credential body is parsed. readOwned
now caps each read to remaining limit plus one, so even growth cannot read beyond
three bytes for this sentinel. Caller wiring requires validated error-free native
init, exit0/no signal, observed reaping, no timeout, remaining bounded lifetime,
live controls and immutable manifest currency before invoking the criterion.
All independent checker/tool/result/lifecycle proofs still remain necessary.

Independent22/22 controls pass on this POSIX host (105.877ms); the filesystem
controls explicitly declare Windows skips. They cover owned nonsecret sentinel
fixtures, all other role refusals, nonempty no-read cases,
replacement/growth/truncation/fstat and parent-indirection controls. No actual
protected source or credential body was read by this reviewer; no native/auth,
model or CI operation occurred. Prepared workflow
`dc9728aea9a7fc76db6d342f32c18eb12630639b`, SHA-256
`1171946b2ee119f2c047c7b23422989738a1873dd7994f75dfb1859ba5fac85c`,
is byte-identical to35a5ddf except its3e5e946 to49b3f44 source pin. Settings,
argv, environment, turns, deadlines, resource grants and secret scope remain
unchanged. Conclusion: qualified GO for the frozen-route criterion and pin,
not a historical native PASS, general no-policy certificate or completed G2 gate.

### Hosted native diagnostic prerequisite: actual bounded PASS

Independent protected final report38257021786, SHA-256
`69f65799ab0e8ab950b44b1bc8e9cc91088d429201e07ce28a9fb38f359bdb3b`,
records overall diagnostic PASS under reviewed source49b3f44 and workflowdc9728.
All six named assertions pass; the separate supervisor observed checker exit0,
no signal and no timeout. Native exit0/no signal, matching native tool-use/result
ID `toolu_01UKWNfAjf66RLQZgFdcVPAk`, independently matched socket collection and
protocol delta[1,0,0] retain actual execution evidence rather than model prose.
Two assistant messages/two reported turns and eight bounded progress frames are
within the approved limits. Live controls, immutable manifest currency, native
reaping, listener cleanup and final persistence are true. No startup refusal is
reported; the actual cache classification is EXACT_NATIVE_EMPTY_SENTINEL under
NATIVE187_FRESH_PRINT_ONE_FETCH_EMPTY_SENTINEL_V1/FROZEN_DIAGNOSTIC_ONLY. Observed
collection time is7770.914458ms; total job20544ms; the authenticated job succeeded.

This satisfies the narrow native diagnostic prerequisite, not the release goal.
portable_applicability and agent_reuse explicitly remain NOT_TESTED. Synthetic
sentinel removal/read/write/socket/loopback checks do not read real credential
bodies or establish universal filesystem/credential authority; native parent
OAuth use remains EXPECTED_NOT_MEASURED. The conditional owner-input and frozen
route qualifications above remain part of this conclusion. Earlier UNKNOWN
attempts, including the historical unobserved cache content, stay unchanged.
No raw transcript/stderr/log was retained, and this reviewer performed no new
native/auth/model/CI operation or test for this read-only final-evidence audit.


### Disabled recipient: shared pinned profile and narrower commands

Independent review of `0b37463446557578e5a4acf7478eb14c819e9f41` confirms
shared native187 identity and the exact previously reviewed 94 read-only Bash
heads. The shared metadata leaf has no process/filesystem side effects; its
exports are frozen and create no circular import. Diagnostic construction is
unchanged from hosted source49b3f44: settings/assets, arguments, environment,
limits and grants compare identically. Exact SHA-256 leaves are
`5feec095db8bbf22ee4fa23082d89ed6824e7b777238e2d0854d53d1e2a4169f`
(shared profile),
`a7af09aa23d9a298ea499c12e5a7a60f111aca5a65801d1a3598ba44adde353e`
(recipient invocation), and
`f418feefd816a6fc8d2fead5eb9f074aa39d3e8f54646f555aedb2c96596dc1e`
(diagnostic).

The disabled recipient removes pwd/ls/cat grants, permits only the existing
literal REDUE status and typecheck-run commands, and adds all reviewed fallback
family denials, Skill denial and two runner credential-name denials. Existing
filesystem/network restrictions, configuration-parent replacement blocker,
matched-host/account/evidence preconditions and unconditional activation
refusal remain. src/bin do not change. This narrows the proposed task to a
verification obligation; it does not establish ordinary code inspection/edit
access, effective VM enforcement or receiving-agent reuse. The frozen diagnostic
empty-cache rule gains no authority over future ordinary recipient sessions.

On an isolated exact-source archive, pinned Node22.13 independently completed
31 affected controls:31 PASS,0 failure/skip/cancellation,1059.962959ms. They include
ordinary owned-fixture CLI writer compatibility, not a native sandbox/model
trial. Thirteen additional reviewer pure differential checks pass. The initial
reviewer differential fixture used an unsupported Unicode diagnostic-base suffix
and was refused with DIAGNOSTIC_BINDING; correcting only that fixture to the
existing six-alphanumeric contract enabled the comparison. Conclusion: GO for
this permanently disabled test-only cleanup, without activation, trust, scope
or release-readiness approval. No native/auth/model/CI operation was performed.


### Controlled Claude shared-policy memory import: source criterion

Pinned native187/a59 source BLd/S4i/I4 at198573984–198576481 supports the
unquoted text `@REDUE_PORTABLE_AGENT.md` in project CLAUDE.md. Relative imports
resolve against the containing memory file. S4i reads memory directly and I4
recursively expands imports, independently of Bash/Read tool grants. Code spans,
fenced-code tokens and comments are skipped. Project/local source selection and
claudeMdExcludes still affect loading. Current official [memory documentation](https://code.claude.com/docs/en/memory)
corroborates relative resolution and code-token exclusion; the pinned implementation
is the version-specific basis here.

Ten independent pure controls against extracted BLd, SHA-256
`63f236750a4f329dcd94368d761ed7317e34a151b9bc3d2fb8c028f9d616796f`,
pass using prepared Markdown tokens and local-path dependencies. They are not
native lexer, launch or behavior tests. Extra and parent-directory imports remain
syntactically accepted, and native I4 follows symlinks. Therefore the proposed
Claude-only render requires exact expected CLAUDE.md bytes containing just the
one import, a canonical owned same-workspace regular single-link target bound
to the installed shared-policy bytes plus approved routing, and refusal of any
additional or nested unreviewed import. The current installed policy's recipe
mention containing @ is in code text, not an active memory import.

This is GO for the narrow source criterion, pending final writer/inspector diff
review. Copilot guidance and all tool permissions remain unchanged. Loading
instructions does not establish native enforcement, continuing source currency,
model compliance or receiving-agent reuse. No native/auth/model/CI operation was
performed.


### Controlled guidance and host preflight: exact import closure

Final independent GO covers the writer/inspector changes81b2bbd/e51158a and
successors6f367eb/d3fbe99/d626532. The read-only inspector verifies explicitly
selected owned config/state/owner/installed policy/compiled runtime and exact
generated guidance. Bounded descriptor reads and repeated physical snapshots
refuse unsafe leaves and changes during inspection; returned content digests and
physical-binding hashes detect same-byte replacement across inspections without
mistaking normal directory content churn for authority replacement. It returns
no instruction body or private absolute path, managed installation, native-loading
proof, CURRENT decision or reuse authority. Compiled runtime metadata validation
is intentionally distinct from the engine's direct-compiler applicability check.

Independent nonsensitive counterexample on e51158a appended an active nested
@unreviewed.md to installed policy, recomputed caller SHA and received published
instructions plus integrity=intact. No nested target/native process was executed.
This was a prerelease validator gap, not an exploit of the known frozen policy.
6f367eb fixes it by requiring installed policy SHA-256
`db8e2e02895e8ebf39ee0ba23420ed0e0a8525c17246a0c73d3f161aac9c9f32`
whenever hosts includes Claude. Preview, publication and inspection now refuse
that counterexample before creating guidance. Exact CLAUDE.md has the single
unquoted local import; Copilot/shared-policy/routing bytes are otherwise retained.
No general Markdown/import authority is introduced. Existing edited instructions
are refused rather than overwritten.

The recipient's two literal tool allows now match the writer's root-relative
config/state route, with root cwd and socket/filesystem paths unchanged. The
explicit Claude-only generic preflight requires before/after inspector equality,
actual CLI/version/doctor/config/state checks and product integration
installed=false/integrity=absent. It cannot override conflict, unknown or intact
managed states. Missing/edited guidance, changed runtime or same-byte owner
replacement withholds trial launch. The existing managed route stays strict.
Native activation still always refuses; effective startup, credential isolation,
matched VM and parent-replacement gates remain. This is verification-obligation
preparation, not ordinary code-edit access or empirical instruction adherence.

On the isolated exact d626532 archive, guidance/invocation/preflight/agent-trial
controls independently completed38 PASS,1 Windows-only skip,0 failure/cancellation
in1126.891334ms; diagnostic controls completed22 PASS in100.689709ms. Combined
unique count60 PASS/1 skip. Ten additional reviewer adversarial controls pass for
Claude/mixed-host preview/apply/inspection refusal, absent destinations and
unchanged Copilot-only explicit digest selection. Initial staging used a not-yet-
created exec cwd and was refused before process creation; staging was corrected
from the existing review worktree. No src/bin changes, native/auth/model/CI
operations, artifact changes or framework expansion occurred.

Exact final helper SHA-256 values:
`7abc12203cc5d89b71755688fe05f85e5d24110a45047cac52b2261082668e9b`
(controlled guidance),
`a50fc7a59f497650f157e66983f58256d71a71d28f5ae2a2d8fbe411250eecac`
(host preflight), and
`58a09a206c1fe1532999abd7c0f5278cce63594a6cc832d20ef001dc0843024e`
(disabled recipient invocation). No diagnostic-only negative-cache rule was
transplanted into the ordinary receiving-agent route.


### Installed generic preflight: mechanical compatibility only

Independent read-only audit of protected result SHA-256
`fc95651fc4ad9e51bca3a34e26d0473b41c62c53124973c7f21758a5be50a571`
and cleanup
`b4959e120cc8dfdb2fd9d9d3a6d0840f09aa6709dd21bc26067e3c1ec2359a00`
confirms the coordinator's fixed local installed fixture classification. Both
records are owned regular single-link mode600 files. The result binds helper
d626532 and exact existing b812 candidate; independently rehashing the preserved
candidate reproduced b812. It records no regeneration, read-only preview,
successful controlled-guidance publication and expected UNVERIFIED matching:
preflight exit0/matched=true/prerequisites.ready=true, eligibility=false,
null result/reuse=false, controlled-generic-intact and managed integration absent.
Three preflight commands and measured Claude187 version establish this mechanical
route, with no verification execution or model launch. The snapshot is unchanged;
native enforcement, matched-machine acceptance and agent reuse remain NOT_TESTED.

Cleanup reports owned observer stop0 and retained historical state. Fresh metadata
confirms observer.lock, observer.sock, runs-v1 and run.lock absent; this does not
assert arbitrary descendant reaping. Initial long-path fixture record
`3a5b7a8cf09b181ef91aa8113c853e9e5375f480b8ac4d73212308ca0cbc6811`
retains start/stop2, only compiled runtime and cause=NOT_ESTABLISHED, with no raw
stderr. The existing start guard rejects filesystem sockets above100 UTF-8 bytes;
the failed fixture's120 bytes versus the later successful82 provides a static
explanation, not independently captured stderr or definitive retrospective cause.
No runtime/security waiver occurred. A reviewer metadata-inventory snippet first
had a syntax typo and was corrected; it did not launch a product process.

Conclusion: installed CLI/generic preflight compatibility is demonstrated for the
truthful no-receipt UNVERIFIED state. No full portable profile, native enforcement,
CURRENT imported applicability or G2 receiving-agent reuse follows. This audit
performed no installation, native/auth/model/CI operation, protected-body read
or additional test.


### Prospective alpha11 exact-package preparation

Independent source GO for8534f5fd5d76ba33e88e8b03bebca2cd99fd3d69:
package.json and both lockfile root version fields select0.1.0-alpha.11; all
other package/dependency fields, src/bin and shared policy stay unchanged. The
changelog explicitly calls this unreleased, retains pending actual two-agent/
two-machine reuse and full economics, and makes no time-saving/publication claim.
No alpha11 artifact, unused registry coordinate or platform result is established
by changing metadata.

The existing exact-package workflow now performs one fixed public-registry HTTPS
HEAD before packing. Exact package name and alpha version syntax are checked;
only HTTP404 permits packing, with a15000ms absolute request timer that destroys
the request on expiry. Existing versions, redirects, unavailable/error statuses
and network uncertainty fail closed; no alternate registry, authentication,
TLS/proxy change or response-body authority is introduced. Fourteen independent
mocked controls against the extracted workflow code pass, including invalid
name/version making zero requests, timeout and network error, and integer404
versus string/missing/null status refusal. No actual HTTP request was made.
The initial reviewer mock misclassified invalid-package plus404 as positive;
correcting only that expectation retained the product's pre-request refusal.

The workflow retains contents:read, pinned actions, one pack plus three standard
installed-platform jobs, existing source/byte checks, one-day retention and the
192KiB payload/224KiB archive reservation. No signing, model, policy, publication
or secret authority is added. The coordinator-reported5,263,735 active bytes plus
one229,376-byte reservation totals5,493,111, below10MiB; this is an execution-time
storage condition, not an independently refreshed inventory by this review.
Because the workflow path matches its existing pull_request filter, a push to an
open PR may automatically start the matrix. Select one actual handle and avoid
an additional unaccounted manual duplicate. A404 check does not reserve a future
publication coordinate; publication and the final release gates remain separate.
Local registry failures remain unavailable/unknown with no asserted TLS or auth
cause. Conclusion: GO for normal source preparation and one accounted matrix,
not publication, current registry availability, alpha11 platform PASS or G4
completion. No native/auth/model/CI operation occurred in this review.


### Actual alpha11 candidate: preserved packed bytes

Independent read-only archive inspection of the candidate from run38266596921
confirms `redue-cli-0.1.0-alpha.11.tgz`, SHA-256
`f6e368bd8171412b301f3f5dee3ceebea14da3b3418968504a7a49428e5876a0`,
158970 compressed bytes,80 regular payload files/588965 unpacked bytes. The
manifest coordinate, filename, size, file list and per-file sizes, SHA1/SHA512
integrity and SHA256SUMS agree. source.txt binds
`08307d4ccf5a43d2339c4cb634dd0129c0fcc964`; all80 payload files compare exactly
with that source commit. Four transferred files total167730 bytes, below192KiB.
Package license is Apache-2.0. No private state/test/dependency artifact paths or
owner absolute-path content are present. Tar content was inspected in memory,
without extraction, installation or execution.

The preserved b812 alpha10 candidate independently still hashes to b812.
Only package.json and CHANGELOG.md payload bytes differ; all63 src/bin leaves
are identical. The candidate remains unpublished and distinct from b812 and the
published/frozen8695 alpha10 package. The coordinator reports successful unused-
version/pack and Linux installation at this checkpoint; Mac/Windows are still
pending. This audit does not manufacture their terminal results or a whole-matrix
PASS, and the earlier local registry failures remain historical.

The pending matrix covers exact installed ordinary CLI, managed Codex/Claude
instruction update/removal safeguards, real same-prefix alpha10 upgrade with
config/state/immutable history preservation, and a Mac same-host portable
record/export/manual import/unrelated/STALE sequence. It does not run models,
a two-machine receiving agent, authenticated final-origin acceptance or the
optional complete economics sequence. Final G1–G3 demonstration on the documented
implementation/profile, exact alpha11 end-to-end binding, truthful claims,
independent critical review and owner-approved publication/public-byte/install/
tag verification remain release requirements. Earlier frozen8695 costs and data-
only/native diagnostic evidence retain their own identities and limits. External
participation remains a disclosed field-validation gap, not fabricated acceptance.
No new test, registry request, native/auth/model/CI operation or package mutation
was performed by this reviewer.


### Alpha11 terminal exact-package matrix: installed mechanics PASS

Independent read-only final records for run38266596921 have SHA-256
`f8c3b4ea92137c1b9cf973cff64607519a44b00284fe7513939058c015660418`
(acceptance) and
`a36dcede5b2a703856ccc5e4cfacbda484241a87908cf1ea65d9faa738f2c674`
(Mac mechanics), both owned regular single-link mode600. They bind source08307d4
and the inspected alpha11 artifactf6e368bd. Installed Linux job114870332375,
Windows114870332412 and Mac114870332525 conclude success with exact SHA confirmation,
ordinary/unavailable recording mechanics, alpha10 same-prefix upgrade,
Codex/Claude policy update/removal and edited-managed-content refusal. Immutable
receipt/config/state and evidence through owned uninstall are preserved;
after-setup freshness is truthfully STALE on all three platforms. This final
result supersedes only the earlier matrix-pending status, not historical failures.

Mac ARM64/Node22.13 records healthy origin CURRENT/PASS/eligible with run
`237a415f-6e3e-4f02-a0ec-2a503f8ccaf6`. Separate-checkout manual-digest import
establishes healthy imported CURRENT/PASS/eligible with the same origin and digest
`cec9bfe112f7cb871d4bded970dca17c66b092fbd402978a2aca9b4ec6b5ce6f`.
The recipient has no local run ID; source assertions verify no recipient runs-v1
before/after import. Cached status is healthy UNVERIFIED/null result/not eligible.
An unrelated edit preserves the same imported identity and CURRENT decision;
a relevant edit gives STALE/null result/not eligible/PORTABLE_FACTS_DIFFER.
Origin immutable bytes and prior history are preserved before disposable teardown.
Expected edited-content exit2 refusals are controls, not failed matrix jobs.

These are actual exact-installed mechanics and same-host caller-aware
applicability results, not three-platform portable qualification or agent reuse.
No economics flag, native model, independent-machine experiment or authenticated
CI origin is used in this Mac sequence. The report explicitly says models/two
machines NOT RUN and economics NOT_MEASURED_IN_THIS_RUN. Its queried operation
costs remain visible: recipient synchronized statuses34375.326166,37567.483042 and
39013.186583ms. These approach/exceed the existing host-preflight35000ms child cap;
future preflights can conservatively time out. No deadline relaxation, latency
promise or savings claim follows. G2/final G3/G4, final real-agent whole-flow cost,
owner publication and postpublication-byte/install checks remain incomplete.
This audit launched no test, native/auth/model/CI process and made no package or
policy change.


### One fixed hosted recipient phase profile: source GO

Independent GO covers helper SHA-256
`9d53fe079be47687b203fa8795d761408fd531133fca3df851611a18da66ec01`
and task-branch workflow
`a76a2f1b10ddcfa53a033e58f9c116361b10b60313e49221c5a23bdc1a3a0745`.
The manual-only workflow restricts repo/actor/ref/attempt1, one macos26 job,
Node22.13 and12 minutes. Its normal read-only artifact action selects run38266596921
and fixed artifact name, then verifies frozen f6e alpha11, source08307d4 and
four-file membership before installation. Standard contents/actions read scope
adds no model credential, upload/cache/signing, producer trust or repack. Checkout
uses the selected workflow commit; this review certifies source preparation,
not any dispatched run or measured speedup.

The helper fixes an unchanged controlled noLib project and three owned observer
sessions with two synchronized queries each: six sampled queries and two explicit
restarts. Setup/origin/export/import/cleanup costs remain separate, with no query
retry. Status projection is retained before exit/currentness assertions, including
nonzero response/failure paths. Traces use the existing bounded descriptor reader
at1MiB/4096 lines, fixed phase/numeric/boolean sets and UUID/static trace labels;
malformed/refused traces yield static failure. Stop requires machine JSON ok=true
and absent owned endpoints; cleanup failure latches, prevents teardown and retains
the fixture rather than claiming confirmed stop from endpoint absence alone.
No arbitrary descendant-reaping claim is made.

Eighteen independent extracted-source mocked controls pass for nonzero/null/
malformed status retention, stop refusals, safe known projection, unknown/private
field rejection, malformed traces and cleanup confirmation. They execute no CLI,
native process, listener or HTTP request. The original mutable draft's unbounded
trace read, broad numeric-key projection, pre-retention assertion and unconditional
teardown were corrected before this GO. One attempted extraction observed source
editing and failed to find its old block; no product operation occurred.

The120s helper command cap and30/25/45s portable engine limits remain unchanged.
Profiling explicitly introduces diagnostic environment flags inherited by the
reviewed compiler; it is instrumentation, not a claim of unmodified environment.
No ordinary-project, applicability, agent behavior or value claim follows from
this phase sample. Cold/session-start work must remain visible, and cached runtime
optimization remains a separate implementation/review task.

### Private protected-runtime inspection and ancestor scope review

Source GO for the reviewed runtime optimization snapshot at root6ea54d8 plus
five source edits and the new boundary control. The tracked implementation/
boundary diff SHA256 is
`7c68d5445e9995ea4359c5bfd624ecc0fe722383748d30043886b7a70ca63dfb`;
new certificate-test SHA256 is
`ce4d134735858f6acff272c71c3bc58f9de813ff67b8197521923f220811647e`.
This is an implementation review, not measured hosted speedup or new release
acceptance. Portable process/cache/IPC deadlines remain30/25/45s.

The daemon owns a generation-local Map and clones/freezes records only after
successful independent caller-proof equality and current index/input/event/
catalog/health barriers. Imported catalogs, saved state and message certificate
fields never seed it. Every caller remains a full inspection; origin/public
capture remains full. Internal child certificate output is removed before public
facts/proofs, receipt/export interpretation remains unchanged, and the certificate
cannot select inspected paths. Low-level transport alone is deliberately not
certificate authentication: fabricated body hashes can reach the low-level
inspector, but independent full caller proof prevents daemon acceptance.

Warm inspection rereads the fixed protected native cache path, complete bounded
base/member headers, membership/native UUID, root protection and all member and
parent fingerprints before returning prior body hashes. Node/helper/readable
system-image bytes, OpenSSL state, loaded-image coverage, compiler and discovery
remain fresh. The final loaded-image reread and cache clearing on plan refresh,
observation gaps and direct input/path/backlog failures are present; restart
cannot restore private learned content. This retains the trusted nonprivileged OS
boundary and does not claim defense against compromised root/OS or arbitrary
same-UID imported certificate provenance.

Independent controls:5/5 current source cache controls pass134.29ms and6/6
extracted runtime-function mocks pass51.99ms on Node22.13. They cover later
loaded-image additions, final native/OpenSSL changes, mismatched loaded-image
certificates forcing full work, and public runtime separation. The first mock
extraction failed6/6 because a second `import.meta` remained in the VM wrapper;
replacing both occurrences fixed only reviewer scaffolding. No native runtime,
observer or model was launched by this reviewer. Parent actual built-in proof
controls6/6 pass14.194s, actual daemon authority1/1 pass26.087s, and shared
boundary/receipt controls74/74 pass193.383s; source and retained TAP were reviewed
without duplicate heavy runs. The actual daemon test observes failed/forged
client input withholding, first query two full inspections, warm query one full
caller plus one private revalidation, restart two full inspections, stable
imported origin and no local verification run. Earlier fixture environment,
entry-path and start-output parsing failures remain separately retained.

Source/data-only GO for ancestor leaf `bcf72d8` plus `5b6da8a`:23/23 independently
copied exact controls pass103.03ms. It preserves all local query answers and
ancestor depth, rejects outside consumed bodies/positive files/unsupported
queries/symlinks, binds physical endpoint metadata, and explicitly returns
present-directory and proper-parent coverage requirements through filesystem
root. Its immutable projection always has reuseEligible=false. Present-container
watchRoot is not silently treated as complete replacement coverage. This grants
neither subscription nor interval/receipt authority.

History-only ancestor integration is NOT endorsed. In reviewed
@parcel/watcher2.5.6, EventList::getEvents omits an entry with both isCreated and
isDeleted; FSEventsCallback can accumulate separate create/remove occurrences.
Consequently a formerly absent library candidate created and deleted during
execution may disappear before JavaScript scope filtering. Matching final
absence plus successful replay cannot establish that interval. This is a source
counterexample to the proposed provider use, not a reproduced released
false-CURRENT outcome. Reviewed provider source hashes are
`d483e955a012b05ce84795b7616636e05471eaa850d20664af8c03e2026b68d8`
(Event.hh) and
`f4cca563cc34c2609201218c94648dda10668edb413b077ac670be7da19e1549`
(FSEventsBackend.cc).

A separate raw FSEvents design still needs implementation review and actual
CI-only interval controls: latch relevant raw occurrences before cancellation,
filter before retention/IPC, irreversible uncertainty for dropped/wrapped/root/
mount errors, start and end synchronization outside the callback queue, and
case-alias-safe candidate/prefix matching. Apple SDK FSEvents.h documents that
FlushSync returns only after callbacks for prior events, but a barrier cannot
recover discarded events. An ASCII-restricted controlled namespace with
conservative case-folded comparisons can address NODE_MODULES aliases on a
case-insensitive filesystem without assuming arbitrary Unicode canonicalization.
No broad subscription, history capability, private ancestor authority or ordinary
project reuse has been enabled by this review.

### Candidate phase comparison bundle

Source GO for the revised profiling workflow SHA256
`c2315f3337127a31f7f9f49fb2d878a75b2f5922ca3af91f2147eead25dab6a5`,
helper`059dd8b6efa46fd10ee94290380ce62aaac281f4b80e06d1bdaf7788371ef769`
and certificate-test
`4e2a0a3864da7ccf3cc6432d93cfa5b8c81b8709dba33d2adf90977bc0e1dd32`.
One manual task-ref job checks out its actual SHA, packs once, records/verifies
one manifest/checksum/source/tar bundle, passes explicit source and artifact
SHA256 to the same six-query/three-session helper, and uploads only that bundle
with1-day retention. Contents/actions remain read-only; exact actor/ref/first
attempt, Node22.13/macOS26 and12-minute job bounds remain. There is no model,
signing, publication, accepted-producer or trust-registry operation. The250KiB
gate bounds payload file sizes; archive overhead and actual uploaded artifact
metadata must remain included in the confirmed storage accounting.

The new six-argument interface validates exact flag order,40/64 hexadecimal
identities, artifact hash/version and source.txt beside both manifest and tar.
Old two-argument frozen08307d4/f6e behavior remains. Review found a leftover
hardcoded08307d4 source assertion that would reject every new candidate before
sampling; it was corrected to expectedSource before GO. Added timing fields are
fixed known phases and numeric keys; private/unknown fields remain discarded.
Status-before-assert retention and conservative stop/cleanup behavior remain.

Independent31 extracted-source mock controls pass:18 existing privacy/status/
cleanup controls plus13 candidate argument/hash/source/version and new phase
projection controls. YAML scope assertions, both Node syntax checks and diff
check pass. Two extraction-preparation errors (wrong relative output directory
and old substring marker) were corrected in reviewer scaffolding; intermediate
old18-control output was not counted as validation of the changed projection.
No product CLI, listener, HTTP, native agent, model or CI run was launched by
this reviewer. Parent's final real proof controls6/6 remain separate evidence.

The certificate test removes a redundant second caller full inspection while
retaining the independent caller proof used against forged content. Its140s
aggregate child harness and150s test cap accommodate separate bounded probe
operations; they do not alter production30s process/25s cache/45s IPC or the35s
host-preflight bound. Cold session-start costs and setup work must remain visible;
no measured optimization or final-candidate readiness is inferred before the
actual declared sample.

### CI ancestor capability resource binding

Conditional source/data GO for capability-reader snapshot SHA256
`946ae2e6dd16c66274110f228825b79e93ba363722a1b7e202eddea00eddb05f`
in the isolated ordinary-boundary worktree. It accepts only exact bounded
nonsecret provisioning schema, selected CI context, canonical ASCII nonsymlink
resources outside checkout/state, owned0600 single-link descriptor-bound file,
protected ancestry and owned private parent. Root/state physical identities are
bound to the provisioning body; final root/state ancestry rereads now detect
replacement during the capability descriptor read. Only private WeakMap tokens
are current: copied/serialized lookalikes grant nothing. Invalid currency now
irreversibly revokes the token rather than reviving after resource restoration.
Public token data is interpretation plus digest, not capability body or paths.

Independent static filesystem controls initially reproduced3 failures/4 passes:
root and state replacement during file read minted stale tokens, and root
replacement caused false currency that became true after restoring the original
root. Those are prerelease helper findings, not released applicability outcomes.
After the root author's resource barrier and revocation correction, the same7
controls pass77.34ms on Node22.13. Prior snapshot and failing TAP remain preserved
in reviewer-local evidence. These tests use only owned nonsensitive temporary
files; no subscription, FSEvents operation, CI capability, model or agent process
was exercised.

Integration remains conditional. Owned0700/0600 is provisioning provenance,
not authentication against hostile same-UID code. A trusted reviewed workflow
must select/provision a fixed non-temp protected authority location unavailable
to the native agent's write permissions, with explicit parent write denial before
model work. Source/run fields bind that file to supplied trusted CI context;
environment labels and a self-authored JSON body do not independently authenticate
actual loaded source. The proposed packaged native-helper hardpin and source/
workflow checks must be established at integration. No imported path/capability,
GITHUB_ACTIONS label alone, writable implicit-temp replica or restored revoked
token may start observation. This review neither activates the native observer
nor substitutes endpoint identity for interval coverage.

### Raw occurrence provider leaf and in-root membership coverage

Source-only GO for raw-provider leaf `5a125ad` plus `d806c9f`. Final C++ source
SHA256 is
`ebdb7387ae79fbf8c2ca81d33fc3acde249013b89791853611068e06d3fd8ab6`;
retained production build SHA256 is
`5c43ba4fc39416c3657af878eff645e514bb19705165f2aa9f648f86550a5b9b`
(79,992 bytes). This reviewer rehashed, but never started, that production binary.
The build uses the reviewed source and fixed trusted system compiler/flags;
parent runtime provenance and protected launch identity remain separate gates.

The native leaf creates only the fixed '/' FileEvents/WatchRoot/NoDefer stream,
filters each raw callback before retention, and emits only static uncertainty,
locally supplied scope IDs and monotonic serial/request fields. It performs no
file-body reads, stat/traversal, imported execution or pathname logging. Raw
create/remove occurrences are not cancellation-aggregated. A serial dispatch
queue receives callbacks; main-thread FlushSync is outside that queue, and ready/
barrier acknowledgements follow synchronization. Close flushes, stops/invalidates
and drains before acknowledging. Drop/wrap/root/mount/history/unknown provider
flags, malformed paths and overflow permanently withdraw authority. Bounded
framing/output and a hard parent timeout/reap remain necessary; a blocked output
or native flush cannot be treated as a successful timely barrier.

Independent exact-source controls51/51 pass962.44ms, including27 pure C++
filter/framing/serial controls and24 query projection controls. The C++ test build
excludes CoreServices and production main; it starts no stream. Initial exact
5a controls51/51 passed1295.97ms. Review found DEL127 classified differently from
the JavaScript ASCII guard; d806 now makes it uncertainty and retains that case
in the malformed-path controls. ASCII case aliases are conservative matches;
potentially matching Unicode ambiguity is uncertainty. Actual standard-VM path
and firmlink alias delivery is not established by string-filter tests.

Three additional independent pure controls compile the actual extracted Parcel
EventList class, omitting only its unrelated JavaScript conversion interface.
They confirm that create→remove is elided for both checkout and ancestor paths,
while remove→create of an existing path retains an event. No FSEvents watcher,
configured compiler or wrapped verification is involved. This establishes the
provider counterexample, not a released false-CURRENT reproduction.

New portable interval interpretation must cover in-root directory membership as
well as named absent ancestor candidates. A transient source/declaration created,
consumed through readDirectory/entries/directories and removed can restore the
endpoint membership list without a preexisting named absent-file query. Derive
supplementary raw prefix scopes locally from all seven reviewed in-root filesystem
query kinds, including the checkout root when actually queried; reject unknown
kinds or unsupported paths instead of omitting them. Keep outside authority
limited to the separately approved ancestor namespace and preserve ordinary root
observation. Matching endpoints alone do not become interval evidence.

This GO does not enable observation or certify complete portable origins. Exact
protected capability, packaged executable/source pins, parent protocol/lifecycle
and generation/scope/serial start/end checks still need integration review. Real
CI-only controls must establish transient create/remove, membership addition,
parent replacement/restoration, case alias delivery and conservative gaps before
any @3 complete/reuse claim. No owner-Mac broad subscription, model, CI dispatch,
new resource grant or trust-policy change was performed by this reviewer.

### Hosted private-runtime phase result and complete raw query projection

Independent read-only result review accepts the finite profiling outcome for
run38279556323, source`f4abdd318091ac7c17119d872e189e1cf2f7a8f3` and owned
candidate SHA256
`84edcfebbc980dacc026aac66d9f3094718267521397a15a79f015f6eb2ce871`.
Preserved tar is160,448 bytes/80 entries and the four-file bundle is169,209 bytes;
source.txt and manifest/checksums bind it to that task source. It contains no
ancestor files. This is a new prospective alpha11 candidate, distinct from frozen
f6e bytes, not a published release. Sanitized result SHA256 is
`221052bdfb6ff06a97f6c5456e7cf6af82b534ff5f9f9e1f2caed2a2722b849f`;
summary SHA256 is
`b538fbc320c5f7b55929a53bb4b316b6e5d8004606e1758f2299cf001afff127`.

All six declared recipient queries across three observer sessions return healthy
CURRENT/PASS/imported reuse eligibility, null local invocation and the same
origin`b2eb050a-0cc2-401d-8686-fd1e87005298`/import digest
`23a648460143520057765ff1f34fcb2077f335fecf0347b68cec59df5a51115e`.
All25 recorded commands exit0 with no signal/timeout; retained status observations
precede assertions. Failure is null and cleanup reports both owned observers
stopped. There are zero models, no signing/refreshed authenticated handoff and no
ordinary-project result. Setup and origin work are separately recorded.

Recomputed six-query mean29.486s/median30.081s/max38.233s agrees with the summary.
Three warm second queries have median21.606s/max24.021s; three first queries per
observer session have median37.602s/max38.233s, all above the unchanged35s host
preflight command bound. Therefore cold usability remains unresolved. Session
cold is not an OS page-cache cold experiment: origin setup already inspected
runtime content. The trace has11 full cache inspections (two origin boundaries
and nine query inspections) plus three private revalidations, median4.2ms with
zero body hash bytes; independent caller full inspection remains. No savings or
net user benefit is inferred from those counts alone.

The before sample38273261352 uses frozen08307d4/f6e on a separate VM; six-query
mean37.244s/median36.091s/max42.104s and14 full cache inspections remain historical
measures. Both report Darwin25.6.0/arm64/Node22.13, but matching labels are not a
paired-machine/runtime-content proof or controlled causal performance estimate.
The after sample demonstrates the intended warm inspection mechanism while
retaining cold costs; it does not close G2, ordinary-project acceptance or overall
G4 economics. This reviewer made no additional hosted or product run.

Source/data-only GO for raw-scope successor`e6dcd2b`:56/56 exact copied pure
controls pass1324.43ms (29 query projection and27 native-pure controls). Every
validated query path from the seven existing filesystem kinds becomes a locally
derived private prefix scope, including membership directories and checkout root
when queried. Deduplication merges sorted kinds; logical namespace sorting gives
stable IDs across same-chain clones. The separate raw interpretation binds the
complete query digest, answers/options, chain and logical scope/kind list;
physical paths remain local and all results remain reuseEligible=false. External
body/positive-file and unsupported path refusals remain. This is projection GO,
not observer-wrapper, native interval or portable-origin completeness acceptance.

### Raw observer protocol and fixed CI provider experiment review

Source/mock-only GO for the frozen ordinary observer commit `92471c8`, with
provider harness SHA256
`3f26d057aca1c8bb683467952c5a61ce59306640458ad0295e2c86c743087359`
and manual workflow SHA256
`e5d2f17c99f009bb81b6a91b64868da37a9834de0d7c6e3df009c6ff7e0bdda8`.
The workflow admits only the named repository/actor/task ref, manual dispatch and
initial attempt, uses pinned checkout/setup-node, contents-read only and a
five-minute job. It has no secret environment, model, signing, cache or upload.
Source HEAD must match the dispatched SHA before one fixed provider trial.

Final native source SHA256 is
`a322b31d6c686b009fea2067b2c97f57068b50c99affb156b87df217175075a2`;
the hard-pinned arm64 executable is80,984 bytes, SHA256
`39cc3829f4fe640ad35baf87794e2e98d4812ee8afd3193f94dad5a11aa66389`.
Independent byte inspection finds no `/Users/mariosiric` path in that executable.
The `0ac0065` successor conservatively refuses mixed-case, short and Unicode
potential Data-volume aliases; it does not strip prefixes into relevant events.
Membership-descendant scope is derived only from the three directory membership
query kinds. Existence queries retain exact-target/ancestor replacement coverage
and discard unrelated container descendants. Native framing binds that mode and
rejects malformed/overflowing numeric values. All seven validated local query
kinds remain represented; imports cannot seed observed paths.

Independent execution of the six exact pure/mock suites passes77/77 controls in
1567.38ms. The C++ test binary excludes CoreServices and native stream startup.
An additional18 independent observer controls pass68.73ms: unsupported profile,
root/mismatched UID/GID, set-id or foreign-owned helper, unprotected authority
path and pre-spawn races refuse; ready-plus-corruption and post-ready authority
changes cannot return a usable handle; partial trailing protocol data cannot
become clean closure; missing actual child-close cannot claim reaping.

Four independent VM controls execute the actual provider harness with mocked
filesystem, observer and clock, passing45.98ms. They establish that an observed
assertion FAIL survives deadline expiry, otherwise positive deadline expiry is
UNKNOWN, unknown child reaping retains owned files, and a completed fixed mock
cleans up. Review found and corrected the prior final deadline assignment that
overwrote FAIL with UNKNOWN. Earlier reviewer mock-context preparation failures
remain separate from provider or runtime failures.

The trial covers startup, one transient checkout membership add/remove, one
absent ancestor candidate create/remove and provisioning-file mutation refusal.
It does not test replacement/restoration of a previously present container or
establish general alias delivery. The90s parent cancellation timer invokes owned
abort/reaping; individual ready/barrier and cleanup waits remain bounded at5s.
The five-minute job is the external bound, not evidence of an exact90s total
including cleanup. Clean interval closure and observed child reaping are distinct;
revoked provisioning cannot regain clean status. Unknown reaping retains fixture
files. Static filesystem-type metadata is descriptive only.

This GO permits the already approved CI-only, scope-filtered provider experiment.
The reviewer launched no real FSEvents collector, native agent, model or CI run.
Protected owner files and trusted workflow bindings are not authentication
against arbitrary hostile same-UID processes. No qualifying engine integration,
@3 origin completeness, ordinary-project eligibility, G2 reuse or G4 usability
acceptance follows from these source/mock controls. Actual raw delivery and
continuous interval behavior still require the bounded runner result.

### First real raw-provider trial: interval coverage failed

Independent read-only review of run38287392906 accepts the actual FAIL report
SHA256 `b5a9e168b7c1110a883ef7718eeca25b185650853c6e248ef7c7cbfed8ca6114`,
source `eb0d68ed18a6a323c4ba8436e337be799c942ede`. Startup is healthy with serial0.
The immediate checkout membership create/remove barrier is healthy but unchanged,
and the trial stops with `MEMBERSHIP_INTERVAL_NOT_OBSERVED`. No ancestor or
provisioning mutation case ran. Actual close is exit0/no signal, reaped and
protocol-clean; owned fixture cleanup is true. Elapsed time is118.689ms.
There are no compiler or model executions. Clean process/protocol closure is not
proof that the provider covered the known filesystem mutation.

The installed Apple SDK header SHA256
`493ab211ffd5683e83b3ec77b9924730a7df44a39738b560b8a28465b1c48a90`
explicitly describes FlushSync as invoking callbacks for events already occurred
before the call; its overview also describes flushing service-buffered events,
and stream latency starts after the service hears kernel events. Apple's
[programming guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html)
describes pending-event flushing and distinguishes host and device streams.
The chosen host stream watches `/`, uses SinceNow and a serial dispatch callback
queue, then calls FlushSync outside that queue. No reviewer local stream was
started. The SDK promise cannot replace this failed operational coverage check.

Actual report retains no raw callback paths, global callback counts or volume
routing metadata. Consequently startup/delivery ingress lag, root/Data-volume
routing, filtering or service coalescing are competing explanations; none is
established. In particular, no late event was measured. A delivered potential
Data-prefix overlap would make the reviewed filter uncertain, so a healthy
unchanged barrier does not itself demonstrate that such an alias was delivered.
This is a failed experimental provider assumption, not a wrapped released
false-CURRENT reproduction or compiler/security failure.

The current `/` plus FlushSync barrier is NO-GO for portable continuous-interval
authority or @3 complete origins. Endpoint answers, protocol health, quiet time,
longer timeouts and a successful cleanup cannot repair that missing proof. The
prior source/mock GO remains scoped to running the fixed experiment.

A minimal proposed diagnostic is one fixed comparison of the unchanged `/`
stream with an exact owned-directory stream, a subset of the approved scope.
Use a stable nonsensitive owned marker to distinguish callback delivery from
Start/FlushSync success, then one transient add/remove per stream. Retain the
immediate result and two predeclared delayed observations, without success-driven
retries. Keep only filtered scope IDs and static stream classes, not outside
raw paths or global activity counters. Late receipt would diagnose lag; receipt
only on the exact directory would implicate routing. Neither outcome by itself
proves an end-of-execution fence or licenses portable completeness. Startup and
observation costs must remain visible. This is a recommendation only: no helper,
workflow, timeout or resource grant was changed and no new run was launched.
If reliable continuous coverage cannot be established, the FSEvents-only design
must withhold complete portable origins rather than declare endpoint stability
authoritative.

### Fixed root-versus-owned delivery diagnostic preparation

Diagnostic-only GO for native leaf `3c1786b`/`d32b895` integrated as
`04c59c5`/`cd3a130`, source SHA256
`dc93cf87fbfe350cfb183d09d4bcd9bb9a3925308a5a03134a6d68c03ce0fe23`.
The production build still has exactly the reviewed39cc digest and80,984 bytes.
Only a compile-time DIAGNOSTIC build accepts the root/owned selector and canonical
ASCII non-root path. Production argv remains empty and stream root remains `/`.
The conditional code preserves framing, filtering, callback queue, FlushSync,
serials and refusal semantics; it supplies no new observation authority.

Frozen driver SHA256 is
`e134aed104fc8f00a1fc726fe95ff5e36e7baef013eaeac0494075155be5bdb7`;
workflow SHA256 is
`6d25de14a3ac43480beede808a751550ede1e9f00e28181414f0facc559fe468`.
Fresh capability resources determine the exact owned-root argument, never
imported or arbitrary caller paths. The explicit build must report diagnostic
mode, the exact dc93 source and not-started state; its actual executable digest
is checked before startup and subsequent barriers and recorded with compile
identity. Standard runner prerequisites, exact Node hash, owned fixture/capability
paths and unchanged strict private protocol remain required.

ROOT and OWNED run sequentially. Each reports an action baseline plus fixed
immediate,0.5s and2s observations for held-marker creation and a transient
create/remove. Review identified that deleting the marker during the transient
action could falsely attribute marker delivery to the transient case. The
corrected driver keeps it held until all transient observations finish. Actual
reaping precedes reset of owned marker files between streams. Every observation
remains separate; a late change cannot erase a missed immediate event. A marker
not observed before the transient case remains visible in the result and is not
a proof that subscription startup completed.

Review also found that deadline cancellation alone could allow the next stream
to start afterward. The correction checks irreversible expiry and monotonic90s
time before each launch, mutation and sample; expiry admits only bounded close
and reaping. Final elapsed time also forces UNKNOWN at the bound even if timer
delivery was delayed. Unobserved child-close retains owned files and refuses
collection completion. The workflow remains one manual initial attempt on the
fixed task ref/actor, contents-read only, five-minute external cap, pinned
actions and no secrets, model, signing, cache or artifact upload.

Independent native/query/build pure controls pass65/65 in1315.06ms; C++ pure mode
excludes the real stream. Five additional VM controls execute the actual driver
with fake filesystem, clock and child processes, passing61.19ms: marker
deletion cannot masquerade as transient delivery, expiry prevents a new OWNED
launch, exact root arguments stay bound and output stays diagnostic-only, ready
plus unknown private data refuses without leaking payload, and missing actual
close keeps files and blocks a second stream. Initial reviewer fixture failures
were counting the newly added baseline rows as samples and comparing arrays from
different VM prototypes; those fixture corrections did not change author code.
Node syntax and diff whitespace checks pass.

This GO permits only the bounded diagnostic comparison. The reviewer ran no
real stream, model or CI job. Healthy collected observations are expressly
`DIAGNOSTIC_COLLECTED_NOT_INTERVAL_ACCEPTANCE`, not PASS, a subscription fence or
@3 origin completeness. Unknowns remain UNKNOWN. Even a delayed marker or
transient occurrence cannot establish all earlier filesystem events were
covered. The failed first trial and current production interval-authority NO-GO
remain intact pending actual diagnostic evidence and a sound continuous fence.

### Actual delivery comparison and bounded alternative design review

Independent read-only review accepts diagnostic38289084959, source
`ebccf99e46cf79f72e800ed9dc439b90c6a95989`, report SHA256
`871ec945f07ba817debc1c1aa95d36369edb7c8374e195021858f8f3dc738d16`.
For BOTH ROOT and OWNED, held-marker creation has serial0 immediately and serial1
at0.5s; transient creation/removal has serial1 immediately and serial2 at0.5s.
The2s samples do not advance either serial. ROOT immediate samples complete at
3.267/2.903ms; OWNED at1.353/2.818ms. This establishes sampled late delivery,
without locating kernel ingress, service buffering or queued callback processing.
The root-only routing explanation is insufficient for both streams' observations.
No historical failure is retrospectively assigned a deeper cause.

Both streams close exit0/no signal, observed reaped and protocol-clean. Owned
cleanup is true; total elapsed9502.386ms. Profile is Darwin25.6/arm64/Node22.13,
filesystem type26, same device as filesystem root. Actual runner diagnostic
executable SHA256
`15a4eda787ae08c5fde28607bd0acef183e2c6f87b8be03f840469c162d881b7`
is81,528 bytes with clang21.0.0 and the diagnostic define; it differs from the
local diagnostic build, and is not the unchanged production39cc executable.
There are no compiler/model executions or interval authority. The original
first-trial FAIL and @3 integration NO-GO remain.

A smaller supported next diagnostic, before changing provider, is an explicit
`dispatch_sync(queue, ^{})` after FlushSync and before the diagnostic ready or
barrier. Installed dispatch queue header SHA256
`7a765cdd34958f2be27cab43482889a9b3ae45646ecf018fef83cc05a1392f06`
and Apple's [serial queue documentation](https://developer.apple.com/documentation/dispatch/dispatch_queue_create)
/[sync documentation](https://developer.apple.com/documentation/dispatch/dispatchqueue/sync(execute:)-3segw?language=objc)
establish serial FIFO execution and completion of synchronous submitted work.
Main is outside the callback queue and holds no collector mutex across the sync.
A no-op sync therefore waits for callback work already submitted before it.
The current callback iterates batch items with individual collector locks; a
boundary mutex alone cannot guarantee the batch has completed. This is a
possible ordering gap, not the established cause of the real late samples.
Sync cannot flush kernel/service ingress or callbacks submitted afterward.
Compile-only diagnostic comparison must preserve production bytes, existing
no-drain results, fixed observations and bounded parent kill/reap; no interval
acceptance follows from a better immediate sample. No code was changed here.

If needed afterward, supplementary kqueue is a supportable test-only design for
the SAME bounded existing vnodes. SDK event/fcntl headers bind EVFILT_VNODE,
EV_CLEAR and O_EVTONLY|O_NOFOLLOW. Apple's
[kqueue guidance](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/KernelQueues/KernelQueues.html)
requires descriptors for watched objects and handles both syscall and returned
event errors. Public Apple [XNU vnode filter source](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/vfs/vfs_vnops.c)
ORs requested hints into pending vnode flags. This supports accumulated mutation
flags instead of create/delete cancellation; public main source is not a verified
identity match to this runner kernel or proof of complete APFS event emission.

Kqueue is not recursive. Complete derived coverage must include required existing
membership directories, queried leaves and replacement ancestors; a single
prefix-directory fd cannot cover arbitrary nested membership mutations. Missing
candidates need their nearest existing parent. Parent NOTE_WRITE cannot identify
the child that changed, so unchanged endpoints must not erase it or turn it into
a candidate-specific event. Retain conservative fixed scope uncertainty; if the
approved semantics forbid uncertainty from unrelated parent activity, this API
cannot provide child-name filtering alone. Outside positive files/body reads
remain unsupported. No extra unreviewed recursive enumeration is implied.

All descriptors must be physically bound, all watches acknowledged before the
qualifying start facts/execution, and held through final facts and bounded
zero-timeout drain. Register errors, missing coverage, EV_ERROR/EOF/revoke,
unknown flags, insufficient fixed FD/time budget and unobserved cleanup withdraw
authority. No silent scope truncation, RLIMIT increase, watch-reset, time-based
fence or endpoint-only recovery is acceptable. Capability/generation/scope
binding and CI-only resource restriction remain; no imported paths or disk
seeding. This is conditional design review for a bounded spike, not code/provider
acceptance or permission to monitor owner-Mac ancestors. The reviewer opened no
event descriptors, started no real stream and ran no native/model/CI operation.

### Diagnostic-only queued-callback fence comparison

Independent source/mock GO for leaf `0976407`, integrated `3e3f12a`, native
source SHA256
`a7e766b3df8431441f9333df75deb15f36270ac3b4cc142fc57c2ddcd9b1528a`.
Only DIAGNOSTIC_DRAIN builds add a serial queue sync directly after FlushSync,
before ready and request boundaries. A compile guard refuses drain without
DIAGNOSTIC. Main is outside the callback queue and holds no collector/output
mutex across sync. Production behavior and executable remain39cc/80,984 bytes;
no production observer or origin-completeness behavior changed.

Build options accept only descriptor-backed literal booleans for the two named
options on a plain/null-prototype object. Unknown/symbol keys, getters, truthy
values and drain without diagnostic refuse before compilation. No caller flags
or paths select a new production stream. The two diagnostic modes use fixed
compiler flags and separate actual executable hashes; neither is launched by
builder code. Source/current output readback and ownership interval checks remain.

Frozen comparison driver SHA256
`07a2d79b7395d7f9e83368a10d81258428226ad98da2b8ff965d51253e03e1e9`
and manual workflow SHA256
`9836d06d5a1ee20b842ac73fb0aa0c85a932c549cacfeb3dbae89f614be001f5`
run fixed NO_DRAIN then QUEUE_DRAIN variants, both ROOT with the same capability
root/state and membership scope. Each keeps the eight baseline/sample rows for
held-marker creation and separate transient creation/removal. The marker remains
held through transient samples; fixture reset occurs only after actual reaping.
Mode/source/not-started checks bind each build. The90s expiry latch and monotonic
checks guard both compilation admissions, launches, mutations and samples;
cleanup remains bounded and unobserved child close keeps owned files. Standard
workflow actor/ref/initial-attempt/source protections, five-minute external bound
and absence of secrets/model/signing/storage actions remain unchanged.

Independent execution of seven selected affected suites passes80/80 controls
in1415.73ms. Five independent VM controls execute the actual revised driver with
fake children, clock and filesystem, passing57.37ms: separated marker/transient
data, no later variant after expiry, fixed capability-root arguments, private
unknown-row refusal without leakage and unknown-reap retention. No real
FSEvents stream, native-agent action, model or CI operation ran in this review.

Queue sync completes earlier-submitted serial callback work, not kernel/service
ingress. The comparison may test that narrower ordering hypothesis; it cannot
retrospectively establish the cause of previous late events or mint an interval
certificate. Actual prior FAIL, measured late delivery and production @3
continuous-coverage NO-GO remain until independently sufficient interval evidence.

### Actual queued-callback comparison leaves interval authority unsupported

Independent read-only review accepts run38290903554, source
`091b56ef35f72da576647f25ea3eaada5d3983a5`, report SHA256
`cf0851abafb56329260f4fd6ed22638d2c4529aa99b41ad01448b3ddc4f96231`.
NO_DRAIN held-marker action baseline0 has immediate serial0 and0.5s serial1;
transient action baseline1 has immediate1 and0.5s2. QUEUE_DRAIN starts serial0
but its held-marker ACTION_BASELINE is already1, before that marker write; its
immediate sample remains1 and0.5s becomes2. Transient action baseline2 remains2
immediately and becomes3 at0.5s. Both variants'2s samples stay unchanged.

The explicit queued-callback fence therefore did not establish immediate coverage
relative to either action baseline. The extra drain-variant pre-action scoped
occurrence has no retained identity or cause. No individual later increment is
unconditionally assigned to the current filesystem mutation, and the comparison
does not locate the kernel, service or dispatch boundary of the delay. It is
collected diagnostic data, not an interval acceptance or explanation of every
historical failure. Further FSEvents retries are not needed to preserve NO-GO.

Actual baseline executable remains15a4/81,528 bytes. Actual runner drain
executable is
`4c3290891b9dd271a434860dbe1f892cdfa66fba226346692f07ce769b05f707`,
81,784 bytes, clang21.0.0 and both diagnostic defines; native source is a7e766.
Both streams close exit0/no signal, observed reaped and protocol-clean; owned
cleanup is true, elapsed11412.776ms. Profile remains Darwin25.6/arm64/Node22.13,
filesystem26, same device as filesystem root. There are no compiler/models and
interval_authority remains false. Production39cc and prior first-trial FAIL are
unchanged. No qualifying engine integration is accepted.

The proposed supplementary vnode prototype remains test-only until its exact
source and resource plan are reviewed. In addition to bounded FD admission,
physical identity, acknowledged registration and nonrecursive directory/ancestor
coverage, real adversarial acceptance must include hardlink mutation of the
watched inode and memory-mapped change/restore. The mapped case must include a
MAP_SHARED mapping created before registration, then memory A→B→A with no msync,
munmap or close until after final facts/drain; otherwise a later close/pageout
notification can hide the unsupported interval. Actual consumed bytes must be
compared, not just timestamps. An unobserved mutation withholds @3 completeness
even when ordinary Node write/create/remove fixtures succeed. This is a required
counterexample, not a reproduced vnode defect. Held-fd parent replacement and
restoration, failed registration, unknown event/EOF/error and FD/drain exhaustion
remain conservative failures. No watcher, native/model/CI operation or code
change was performed by this reviewer.

### Test-only fixed vnode prototype and CI fixture review

Diagnostic-only source/mock GO for native leaf `d8fe7bd`, integrated `1d77150`,
source SHA256
`f87172afa3012658894f856490e32e1cab75c7cd52b97d432f9707af85fdbb0a`.
These four new files are test-only; no shipped observer or origin engine changes.
The prototype frames at most256 canonical ASCII target paths with exact
dev/inode/fullmode. Only regular files or directories are admitted. Native opens
O_EVTONLY|O_NOFOLLOW|O_CLOEXEC, checks descriptor identity, requires an exact
EV_RECEIPT registration acknowledgment for every target and holds descriptors
without rearming. It checks fixed FD headroom and actual open failures, never
raises RLIMIT or truncates the scope. The seven supported NOTE bits accumulate
dirty IDs/serials. Unknown bits/events, registration errors, EOF, unexpected
filter/data and resource failure withdraw the boundary.

Every drain uses zero timeout with fixed event-count and50ms limits checked
before and after syscalls; no sleep/quiet-period authority is introduced. Close
acknowledgment follows descriptor/queue closure and any close error is uncertain.
Only fixed IDs, serials, dirty sets and static uncertainty are emitted, without
file bodies or raw event paths. This is a primitive for reviewed fixed existing
vnodes, not recursive watching or complete compiler-scope integration.

Frozen driver SHA256 is
`c47eacf45cd94abb23df9e4d8e506338892e83397db2bd640dcb4ef28a41c7eb`;
manual workflow SHA256 is
`e9dd9d33fdbff1157555cc7847be307cb8ae5b4cfaa14f58f192c68b1a136f94`.
Exact standard runner/Node/environment/capability gates bind a new owned fixture
and the reviewed native build. The four targets are its source directory, one
consumed leaf, owned fixture parent and project root. No outside private target
or body is accessed. Source/mode/not-started build checks and actual executable
digest remain explicit; production39cc is unrelated and unchanged.

Fixed cases cover read-only control, membership create/delete, ancestor-prefix
create/delete, same-inode hardlink write/restore, preexisting dirty MAP_SHARED
write/restore and root rename/restore. Review corrected two diagnostic weaknesses:
Python now faults/dirties the mapping with same-byte A before READY/registration;
and each positive case requires a new occurrence on its specific expected vnode,
not merely an increase from any parent. The mapping remains open without
flush/msync/unmap through the mmap case's actual B/A byte observations and final
barrier; only afterward is it closed. A missed hint is FAIL even when later
cleanup or an unrelated parent event succeeds. The experiment is expressly
`FIXTURE_HINTS_OBSERVED_NOT_CONTRACT_ACCEPTANCE`, never CURRENT or applicability.

Three admission/currency corrections preserve the prior observer safeguards:
check deadline after mapper readiness before guard launch, recheck capability
and binary after frame derivation before spawn, and include current binding in
final clean closure. Ninety-second cancellation/monotonic admissions, separate
five-second protocol/reap bounds, actual child-close evidence and unknown-reap
file retention remain. Accepted assertion FAIL is irreversible through later
errors or deadline expiry. The unchanged manual initial-attempt task workflow
has pinned actions, contents-read permission, five-minute external cap and no
model credentials, signing, cache or artifact upload.

Independent native-pure controls pass30/30 in1234.00ms. Pure compilation excludes
OS registration and real vnode operations. Nine additional VM controls execute
the exact driver with fake filesystem, mapper and guard children, passing56.44ms:
full fixed mock collection, missed mmap FAIL, wrong-parent rejection, persistent
FAIL through later error, unknown-reap retention, private unknown-event refusal,
zero guard launches after frame-time authority revocation, no positive final
closure after revocation and no launch after mapper-readiness deadline expiry.
Initial independent mocks failed because a non-bigint lstat fixture incorrectly
returned BigInt mode; correcting the fixture changed no author code. Node syntax
and whitespace checks pass.

This GO permits only the bounded approved CI fixture. The reviewer opened no
O_EVTONLY descriptors, launched no real guard, native agent, model or CI run.
Actual registration/delivery and mapped/hardlink event behavior remain unproved.
Even six actual fixture successes would not establish all recursive membership
coverage, arbitrary file mutation semantics, continuous @3 origins, recipient
reuse, host safety or overall G2/G4. Prior failed immediate FSEvents coverage and
measured late delivery remain preserved.

### Vnode startup UNKNOWN and exact XNU flag correction

Independent read-only review of38294279844 accepts protected report SHA256
`05c875881aac1d957167cd1486db4203da298c28e2b341330097e4bb26f4a78b`,
source `e3c8c02fe5a575c5a0f9b8620beffc5029398522`. Result is UNKNOWN with zero
cases. Guard actually exits74/no signal and is reaped, protocol-clean false;
mapper exits0/no signal, reaped and protocol-clean. Owned cleanup is true,
elapsed1254.088ms. Actual native test executable is
`142b405bb383cf24c6fa6de275c016fe4559bcaa87d2f8f747cf83ffef9c168e`,
62,680 bytes, built with clang21.0.0 from f871 source. Its builder's started:false
field describes build behavior, not absence of the actual later guard launch.
There are no verification compiler or model executions; the native clang build
is separately recorded. No vnode registration/delivery case was established.

The first driver discarded validated uncertainty codes and native fixed stderr,
so receipt failure, initialization/parser failure and other startup refusals
remain unclassified. Exit74 cannot uniquely establish the source of refusal.
No retrospective cause is assigned after finding the following source defect.

Independent pinned Apple XNU review at commit
`f6217f891ac0bb64f3d375211650a4c1ff8ca1ea`, kern_event.c SHA256
`d6bd6351f97713c24d05235179d67ec6947be0114dec1298f77e4deb457b618d`,
confirms the full route: legacy64 copyin masks EV_SYSFLAGS only, preserving0x61;
fresh registration copies that state into the knote; apply_touch does not strip
those flags; vnode filling and legacy copyout retain them. Successful receipt
adds EV_ERROR/data0 to the original request. Thus exact ordinary flags are0x61
and receipt flags0x4061 for this fixed registration. The old0x4000 receipt and
0/0x20 delivery expectations were incorrect for that implementation. The
[pinned public source](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/kern/kern_event.c)
is not a verified byte identity of the runner kernel or proof that first-run
actual flags matched; unexpected runtime forms must remain UNKNOWN.

Source/mock-only GO for exact correction leaf `9961d165`, integrated `9340b55`,
native source SHA256
`f914138709256ea4a429d961727d127dda84c435bf6fdf8a546712748c2a6fa5`.
It accepts only exact0x4061 receipt with correct fd/filter/data0 and exact0x61
ordinary delivery. Missing, extra, EOF/error flags and wrong filter/data still
refuse. Native ABI assertions bind these expressions. This is a finite
source-informed predicate correction, not a permissive flag mask or production
engine change.

Frozen driver SHA256
`c7e6c1da692b8f92af7853eaf07f4664e414cc29e43c29909c285b214a60df52`
adds bounded64-byte stderr projection to NONE, the exact fixed
VNODE_PROTOCOL_OR_IO token or UNRECOGNIZED_STATIC_ERROR, and records only the
first validated uncertainty/static error classification. Review corrected the
initial reporting delta that could overwrite an earlier accepted cause with
later INVALID_PROTOCOL. No raw stderr values, paths or unknown payloads appear
in reports; stop/PASS/FAIL behavior and all prior admission/cleanup gates remain.
The workflow remains exact e9dd bytes with the same fixed resources and budget.

Independent native-pure suite passes30/30 in805.49ms. Twelve actual-driver VM
controls pass55.40ms, including prior nine boundaries, first-error retention
across a later malformed chunk, private-stderr canary non-disclosure and exact
fixed stderr recognition. Syntax/whitespace checks pass. These mocks create no
OS watcher or native process. The reviewer launched no real guard, event fd,
model or CI run. GO is solely for the materially corrected fixed diagnostic,
not an unchanged retry or interval authority.

The pre-dirty MAP_SHARED case must still be judged from its actual final
barrier. A missing hint is irreversible FAIL even if other cases or cleanup
succeed. A passing single fixture would not establish a note for every later
CPU store: EV_CLEAR clears event state, not mapped-page protections or pageout
scheduling. Arbitrary mapped change/restore completeness and @3 ordinary
contract acceptance remain unproved; no assertion or resource scope is weakened.

### Corrected vnode fixture exposes mapped-input interval gap

Independent read-only review accepts actual run38295197761, source
`3768433fd3942fadc54e104cd639045baf18116c`, protected result SHA256
`20b0ce266eb13ead254ff083851c5c945576a89e1358dd188dcf464b5bbefd39`.
All six fixed cases completed. Read-only stays quiet; membership target0,
ancestor parent2, hardlink leaf1 and root-rename target3 have expected occurrences.
The already-dirty MAP_SHARED case actually observes B bytes and restored A while
the mapping stays open through its after barrier, but serial remains3 and leaf1
count remains1. Its expected-scope assertion fails. Result/assertion_outcome are
FAIL, not UNKNOWN and not repaired by later events or cleanup.

A precision correction: after root rename the vector is `[1,1,2,1]`. Leaf1 is
still1; fixture-parent2 rises1→2 and root3 rises0→1, giving serial5. There is no
late leaf occurrence in the report to attribute to mmap. The first coordinator
summary misread the parent count as the leaf count; the actual JSON is preserved.
Both children actually exit0/no signal, are reaped and protocol-clean; owned
cleanup is true. Elapsed2034.906ms is diagnostic duration, not economics. Native
source is f914 and actual executable SHA256
`17d58b9f67260dc04f80cbab4084791d561e99202af61103c7afc1aeb52833c5`,
62,680 bytes, clang21.0.0. There are no verification or model executions;
the native build is separately recorded. No further unchanged FSEvents/vnode
experiments, delay workaround or weaker assertion is justified.

This is an actual missed mutation on the fixed protected nonsensitive fixture,
not an actual wrapped REDUE false-CURRENT or affected released-user reproduction.
It establishes NO-GO for this vnode primitive as unrestricted consumed-file
continuous authority and for ordinary @3 completeness. Positive directory/
hardlink cases remain finite observations and do not rescue the mapped case.

A source-only review also extends the concern to existing unreleased @2 origin
claims, including controlled noLib inputs inside checkout. src/cli.mjs starts
with a healthy observer snapshot, captures portable facts separately before the
real compiler, captures facts separately afterward, then checks the end snapshot,
manifest/context/probe equality, generation/plan/revision/fingerprint and input
event serial. Its portable.complete additionally requires exited PASS/FAIL, no
portableIssue, stable and identical boundary facts. Those facts are independent
discovery captures, not a transcript of verification reads. src/daemon.mjs
catchUp replays @parcel history; failed-history reconciliation hashes current
endpoints. Neither path establishes how to recover an unreported mapped A→B→A
from equal endpoints. The current capture prerequisites contain no exclusion or
isolation proof for an already-dirty mapping. Disabling default libraries changes
resolution scope, not this in-root consumed-file issue.

This source concern does not prove a specific historic signed run or local
receipt was false. Its successful outcomes, authentication, exact bytes and
recorded decision fields remain historical evidence. The mapped fixture does not
measure the wrapped engine's replay, so no new released defect or reproducer is
asserted. It does show that health/endpoint equality alone cannot substantiate
unrestricted continuous-origin semantics under current prerequisites.

The smallest separately reviewable conservative containment is portable-only
capability refusal while this matched-profile interval contract is unsupported:
new origins remain complete=false with an explicit unsupported-interval reason;
current reuse admission must also require locally supported origin semantics
before reauthorizing existing accepted @2 records. Preserve immutable receipts,
statements and historical PASS/FAIL; do not rewrite signed facts, relax trust or
suppress ordinary compiler execution. This recommendation is not an implemented
fix and does not solve broader local CURRENT semantics by itself. It introduces
no new execution architecture, body authority or @3 acceptance.

Unblocked necessary work is truthful current documentation and deterministic
controls for that containment. If the reviewed runtime-cache84ed candidate stays
selected, its outstanding Linux/Windows exact-byte checks can use the existing
frozen bundle rather than a repack or repeated Mac performance profile. Cold
37.602s remains above unchanged35s and is not fixed. Copilot included-capacity
input and a sound portable-origin route still gate G2; actual native six-assertion
PASS is only its bounded host prerequisite. General interval/ordinary acceptance
and publication remain incomplete. The reviewer ran no new compiler, event fd,
stream, native agent, model or CI operation for this actual/source review.

## Independent portable-origin containment review (2026-10-12)

GO for the conservative portable-only containment in
adc9a12981de72cfdcaf8ed7db02002fc3128f79 followed by
7a5168626082a432a02e01783424f5d50590db01. The binary Git diff from
4deb137 to 7a51686 has SHA-256
f6c612db15d76eccda530b3ceb77a2b6b01adde9c78dc25ffeee9c2b9e572c98.
This implements refusal, not a replacement continuous-observation capability.

The local origin policy returns false unconditionally. Capture and caller proof
refuse before expensive manifest/runtime/discovery work; prior budget and missing
observation refusals remain intact. The daemon supplies that local false
prerequisite rather than accepting request, import or environment claims.
Conditional comparison fixtures explicitly assume a supported prerequisite only
inside pure tests; they do not provide a production activation flag.

Current recipient selection withholds imported reuse, including older-observer
green answers and apparent local fallback for a check with accepted imports.
Unavailable cached paths also withdraw nested portable green, not only the outer
row. Current/failed/stale/unverified counters are recomputed. Historical outcomes,
invocation identities and selected historical metadata are not rewritten.
The unsupported pure decision revalidates at most 32 accepted records with the
same integrity/schema parser and retains PASS/FAIL as frozen historical summaries;
it performs no recipient fact comparison, applicability selection or reuse.
Ordinary checks with no accepted portable catalog remain on their existing local
contract. Configured commands still execute, and human/JSON run summaries disclose
incomplete portable capture separately from the real command result.

Independent affected suites (origin interval, applicability, CI catalog and
portable budget) passed 46/46 in 5436.17 ms on Node22.13.0. The ordinary integration
control performed two actual configured TypeScript invocations: PASS then FAIL.
Both receipts have portable.complete=false with the explicit unsupported reason;
the first immutable receipt remains byte-identical, and restart preserves the
selected latest FAIL. The normal REDUE observer was started/restarted/stopped and
may exercise its existing native Parcel watcher. This review did not run an
experimental ancestor/vnode collector, native agent, model or CI job.

Seven separately authored adversarial controls passed 7/7 in 248.66 ms. They cover
cached imported early refusal, direct unavailable cache, expired heartbeat,
unrelated ordinary cache, plan-access refusal before inspection, a healthy
older-observer local fallback backed by an actual accepted owned catalog, and
historical-only selection with a recipient-facts trap and duplicate-record
refusal. The accepted-catalog control preserves receipt, status, selector and
imported-envelope bytes plus inode/timestamps while withdrawing both outer and
nested eligibility; an unrelated ordinary row remains CURRENT. The private
control source SHA-256 is
a34085b7f65375e6b52c5d245dfbfe15242f60fb04b5e815aff8fd41062981ca.
These controls did not reproduce a pre-fix failure; the earlier nested-cache and
history concerns were source findings corrected before the independent run.

Author setup failures involving an invalid state basename and an overlong Unix
socket path occurred before verification and remain separate from the successful
configured containment control. Runtime-certificate assertions retain independent
full facts inspection and forged-content comparison while now explicitly refusing
unsupported caller authority; their author's recorded runs are not added to the
independent counts above.

Required follow-up is consistent current guidance: the later “Fresh local
execution after an import” section must not promise that repeating --portable can
resolve the unsupported interval or perform the now-refused boundary validation.
Affected broader regression and any newly selected package-byte checks remain
separate release preparation. This containment supplies no sound-origin route,
G2 acceptance, G4 completion, cold-latency fix, or publication authority. Existing
native fixture failures and prior signed/package outcomes remain historical;
no wrapped released false-CURRENT claim is introduced.

## Approved sealed-input recipe: narrow enforcement design review

The owner subsequently approved bounded work on an explicit sealed-input recipe.
This record is a source/design review before any new profile application or run;
it supplies no working seal, native admission or current evidence claim. Existing
portable origin containment remains necessary.

The current disabled Claude recipient proposal writes to checkout and REDUE
state. It denies selected config/runtime/owner leaves but explicitly retains its
configuration-parent-replacement blocker. A stage inside those write grants is
not established immutable. The smallest reviewed direction is one freshly
materialized tree under a dedicated protected parent outside checkout/state,
credential/config/code denials and native temporary-write defaults. Preparation
is trusted, reviewed, pre-agent and data-only; it creates independent inodes,
refuses unreviewed links/loaders/outside inputs, closes all writer handles and
publishes an exclusive bounded descriptor. Mode0700/chmod, endpoint hashes and
same-UID ownership alone are not a seal. No untrusted pre-existing mapping or
unsandboxed writer to these new inputs may survive into execution; the matched
VM host/preparer/observer remains trusted and must not write this tree afterward.

Claude's proposed delta is restrictive: whole staged-parent denyWrite and
immutable settings/recipe/descriptor/compiler/code parent protections, while
retaining credential denyRead/scrub, strict sandbox/fail-if-unavailable, no
unsandboxed fallback, empty excluded commands, no network/extra socket, Bash-only
fixed operation and denied read-only fallback families/other tools. Closed,
reviewed settings inputs are required; project/local source selection and
managed startup authority cannot be assumed harmless. Do not remove an existing
credential denial to make staging readable or transplant the diagnostic's
post-cache exception into a different agent route.

The actual src/cli.mjs run path directly spawns the configured compiler from
the caller CLI with plan.cwd; it does not delegate verification execution to an
observer RPC. A fixed native model Bash -> REDUE CLI -> compiler lineage can
therefore use the normal inherited sandbox. The prior hosted native diagnostic
observed bounded controls in a Node collector's child, supporting this lineage
for its own reviewed profile; it does not empirically seal new stage paths.
The observer separately starts trusted built-in probes and re-reads plans. It
must not acquire a new arbitrary-executor or unsandboxed staging-writer socket.
Once staged-parent writes are denied, an already sandboxed CLI cannot also be
the materializer. For the first verification-only slice, finish trusted
preparation before starting the agent; later edits require a fresh trusted
preparation boundary, not an invisible writer escape.

The invocation/receipt must bind actual staged cwd/argv, reviewed TS5.5.2/Node
identities, contents, membership, absences and resolution topology under a new
interpretation. It must not claim that live-checkout or npm execution occurred.
Recipient decisions still independently evaluate their current supported facts.
Compiler/runtime and ancestor library resolution outside the copied project are
not sealed merely by copying source files.

Copilot's existing proposal remains less established: workspace/state read-write,
prefix/Node read-only, broad shell(redue:*) plus cat/ls grants and no actual
model-tool sealing/credential proof. A curated stage-parent readonlyPath and
supported narrowly bound REDUE operation are a separate disabled proposal
correction. Claude's PASS does not certify Copilot; the pending included-capacity
fact does not require another login attempt.

Required actual admission checks use only nonsensitive stage fixtures: attempts
to write/chmod/unlink/replace the stage and its protected parent, create aliases
and obtain a writable shared mapping must fail at the chosen native tool
boundary; intended direct compiler reads/exit must remain observable. They must
also distinguish fresh independent stage inodes from a mutable original mapping.
Source construction and harmless mocks cannot substitute for those observations.
No such check, model, native process, profile change or CI run was performed in
this design review. Bounded stage storage/materialization/validation/enforcement
and cleanup costs still require measurement; the existing deadline and cold-cost
limitations are not changed.

## Sealed-input data materializer: independent finite review

GO for the data-only leaf037f6da18ce202f621599445fec83fbcecff62fe plus
486926901dce4aa4a2a096cfcac2989086e1d022, with no authority to seal, execute or
reuse. Exact source SHA-256 changes from
03e515420d20f9367064d064f7cb1b13cec8c83f15546c092bbaa23b1e4b34eb to
31193dd584c95520373d5bae323899a3223bda3362aee5ee0524961c9eda4306.
The API requires locally derived manifest data, disjoint owned placement and
new independent files; its frozen return remains sealed=false/reuseEligible=false.
Typed manifest values, modes/content and the single reviewed internal .bin shim
are preserved without executing project code. Limits are64MiB per file,
512MiB logical content per attempt,100000 files/directories and bounded paths;
several validation passes read content, so512MiB is not a total I/O bound.

Three independently controlled nonsensitive cases reproduced on a byte-exact
archive of037f6da (3/3 in69.49ms): an ancestor was swapped before the leaf stat/open
and restored immediately afterward, allowing an owned outside-root canary body
read before TREE_CHANGED; a parent swap immediately before failure cleanup caused
recursive removal of a different owned nonsensitive tree; a case alias admitted
a physically nested parent despite lexical disjointness. These are controlled
filesystem scheduling injections, not a hostile deployment or released exploit.
Initial reviewer fixtures had an overly early swap (TREE_PATH before reading)
and a mistaken assumption that realpath canonicalizes alias casing; those test
preparation failures were retained and corrected without changing author source.

The successor eliminates recursive failure cleanup completely and retains
partial stages. It uses incremental opendir walking and checks entry/directory
budgets before retaining names, replacing bulk readdir allocation. Physical
ancestor dev/ino checks in both directions reject the tested case-alias nesting.
It explicitly requires trusted, quiescent pre-agent preparation and a separately
reviewed preparer filesystem boundary; it does not call path rechecks atomic
read confinement. The outside-read case remains reproducible and is disclosed.
The successor is not a credential/privacy sandbox.

Independently running the exact archived successor's32 controls passed32/32 in
217.34ms, including existing fileHash/portableManifest compatibility and a file
above8MiB. Three independently authored successor controls passed3/3 in61.40ms:
the disclosed read-before-refusal limitation, zero recursive cleanup with both
partial and other owned trees preserved, and physical nesting refusal before
materialization. A temporary read-only dependency link was created only in the
private reviewer archive and removed afterward. All actual reads/writes were
owned nonsensitive fixtures; no real credential, compiler, native observer/agent,
model or CI operation ran in this review.

Integration still needs a fixed reviewed preparation child that fails closed
when its filesystem enforcement is unavailable: source-body reads limited to
the physical project plus explicit reviewed code/runtime/compiler loader inputs,
writes only in the dedicated empty stage parent, no network/socket/auth input,
and no arbitrary executor. Metadata traversal is not permission for outside
body reads. A raced alias into a home/credential or unrelated path must be denied
before reading by that boundary. Do not add broad home/root data access for a
loader failure. Preparation must finish/reap before the native agent receives
read-only stage access and whole-parent write denial, with no surviving writer
handles/mappings/children. Retained failed stages require separate bounded
per-job disk accounting and ownership-safe reclamation; per-attempt limits do
not supply a cumulative quota.

Equal file manifests establish only named copied content, not original empty
directories or all existence/membership/resolution answers. The recipe descriptor
must freshly establish staged namespace semantics and its actual invocation,
with conservative handling of differences from the intended obligation. No
old@2 facts, imported manifest, observer token or data-materializer result can
fill that gap. Actual preparation/native sealing and ordinary recipient matching
remain unproved; existing portable containment remains in force.

## Fixed preparer profile and bounded child: source versus actual observations

Root28d690fe introduces a nonauthoritative TS5.5.2 recipe preview and a fixed
test-only Darwin/ARM64/Node22.13 preparation profile;47f49d3 imports the fixed
child. The preview selects a distinct staged cwd/argv and required compatibility
profile, not an actual matched-runtime certificate. It converts no existing
check/config and returns sealed/executable/reuse false. The preparation profile
denies default access, permits only its selected source/stage, fixed Node/code
and explicit protected OS runtime reads plus exact ancestor metadata, and grants
writes only to its stage parent and /dev/null. It supplies no network/Mach/fork
grant or general executor. The caller must bind the source/parent/input and
current code/runtime; a profile string does not certify their lifetime or seal.

The fixed child SHA-256 is
c89df84cdc2f8cb43c30c9329361d63fbb59c8644837537407cb4c198fe8fbb8.
It admits at most8MiB and waits for EOF before its narrow three-key JSON grammar
can call the data leaf; decoded duplicate keys, extra values, malformed UTF8 and
unknown fields refuse. It imports only the reviewed leaf and node:url, executes
no compiler, and reports static failure codes without raw OS errors. Independent
profile-constructor and child controls passed25/25 in342.18ms, including harmless
negative/partial-input Node subprocesses. The reviewer launched no sandbox-exec,
native agent, compiler, model or CI operation.

The initial two root-owned real preparer tests failed at startup and remain
UNKNOWN. A separately redacted same-profile startup diagnostic reported SIGABRT,
no numeric exit, no output/error streams and no cause. Root's transient broad-read
/usr/bin/true sanity is not this profile's fallback or enforcement evidence.
Pinned Node22.13 startup has several pre-JS CHECK/abort paths, so the signal
alone cannot identify dyld, threads, Mach or a specific denied operation.

The source-led narrow correction1aad059 adds only
`(allow file-read* (literal "/"))`. The pinned publisher regression documents a
root-inode dyld abort and this literal remedy, with a separate outside-home
negative case. [Sandbox-runtime root carve-out regression](https://raw.githubusercontent.com/anthropics/sandbox-runtime/24eb39e94a6de386e83d126c52317d8e0fa49522/test/sandbox/allow-read.test.ts)
Literal root is not a descendant/body or write grant; it permits the root
directory object/listing. No home-subpath, Mach, network or native-agent profile
grant was added. This was GO for a materially changed bounded preparer diagnostic,
not retrospective cause attribution.

Root's retained `preparer-boundary-root-inode.tap` reports2/2 actual local controls
PASS267.856ms: the fixed child copies the intended nonsensitive file; a resolved
outside alias and direct outside read are denied; source/outside writes are
denied; stage writes succeed. The fixtures are owned nonsensitive temporary data.
This is actual local preparation enforcement only, not native Claude/Copilot
sealing, matched-VM acceptance, compiler execution or portable continuity.
The changed profile source SHA-256 is
7b2efd7871c8d7e0c95be1d2b4d6d5c70ea1dfbe5bd722a61a0e5ef78d81ef7d.
The test-output privacy finding was corrected in54aedc9: boolean/static checks
and caught parse errors withhold raw stderr/spawn-error/JSON excerpts on failure.
No grant was broadened to obtain that correction.

The real-project parent wrapperae0d4e9 is separately awaiting review. Required
hardening remains total monotonic budget/current Node/code/source/parent binding
and finite exact output/truth fields; its proposed materialization cannot yet be
called sealed/executable/reusable. Any later native stage-parent enforcement and
complete staged namespace evidence remain independent prerequisites.

## Fixed preparation parent: final source and mock admission

GO for400548735eba174a6c3e233762d01cff2e6fea20, exact parent source SHA-256
ad0cc551cfbf6226a98fe460194dd6c067ff2929df816875349d499cd3fb7396,
as one fixed restricted data-only preparation operation. This is not a CLI,
daemon, signer or applicability activation. One approved public-project copy
may use the reviewed empty-env preparer profile under its existing quiescent
phase, input/output8MiB and total120s budget, retaining failed partial stages.
All sealed/executable/reuse fields remain false; stage storage accounting and
later ownership-safe reclamation are still the provisioning job's obligation.

The final parent binds actual source/parent/Node/code paths and ancestor physical
identities, hashes Node/code before and after collection, rejects changed
bindings and requires an owned nonsymlink directory mode0700 with the reported
dev/ino. Output requires exact frame/schema/interpretation/manifest/digest and
consistent physical tuple prefixes; unknown truth fields, duplicate keys or
additional frames refuse. Data is deeply frozen. Child74 static refusals are
retained, invented codes are hidden, and observed finite POSIX signals retain
their names; unrecognized signals use UNKNOWN_SIGNAL without a false reaping
claim. None of these checks is hostile-same-UID atomic confinement or a write seal.

The monotonic budget begins before option work, is consumed across profile/input
and current-binding checks, supplies only the remaining spawn timeout and uses
SIGKILL. Invalid/reversed/exhausted clocks latch refusal. Deep freezing precedes
one final validated clock sample used for both classification and elapsed time;
final budget failure withdraws materialization and reports UNKNOWN/null elapsed.
The parent does not emit raw child streams, spawn errors or arbitrary reason
values. A killed/failed child and retained data cannot authorize a later compiler.

Independent mock controls preserved three prerelease e3b684a counterexamples:
handled child74 was misclassified, a regular-file staged root passed the old
identity expression, and inconsistent physical identity/fingerprint tuples passed.
The intermediate0d7ab18 repaired those but still admitted a result when the clock
crossed120s only in the final result calculation. These were controlled fake-child
responses/clock scheduling, not observed sandbox or real-project defects.

Ten final independent VM/mock controls passed10/10 in65.94ms. They cover immutable
false-flag success/fixed empty environment/SIGKILL, exact74 refusal/invented-code
privacy, invalid stage type/tuple, source/parent/Node-content/byte-identical Node
replacement/code currency, extra truth/duplicate/frame rejection, clock failures
with zero children, both intermediate and final-finalizer deadline counterexamples,
and known/unknown signal observation. An initial mock fixture failed before any
child because cross-realm objects were correctly rejected by canonical; only
the test's JSON realm bridge was corrected and the failure retained. The reviewer
spawned no real preparer, compiler, native agent, observer, model or CI job.

This admission is limited to data preparation. File manifests are not complete
staged namespace evidence; native agent stage-parent/ancestor protection,
actual staged compiler execution, matched recipient facts and supported sealed
interpretation remain separate. Portable origin containment is not lifted.

## Compact preparation summary and bounded nested npm shims

GO for the data-only preparation scope frozen at5d366102083495bca53c08ffe87f3f9831e9053a.
The parentdc3945e requires schema2 and the exact materialization-summary@1
fields, input manifest digest/count, bounded SHA-256 physicalDigest, bytes and
false authority flags. Actual staged-root directory/UID/mode/dev/ino/canonical
checks, current source/parent/Node/code binding and the final120s monotonic budget
remain required. Parent source SHA-256 is
94a439501819ef3cc3960bc6363f986fdb0d5ae7dc14eb39da289232d7a8fd3e;
child source SHA-256 is955f8f66f9e45658f1c161cc0bf5cc7f0b8bf364a80d15c3ddb2bd80e98ddcc4.
The physicalDigest is audit data from the trusted fixed child, not current
per-file validation, a write seal or complete namespace evidence. Old full-array
protocol fields now refuse. No input/output8MiB or512MiB logical copy cap increased.

The sealed-specific manifest7823e84/7195e29 and copierd4d4139 use one shared
canonical shim restriction: a relative single-file npm .bin link remains inside
its owning node_modules container and names a manifest-listed regular target.
External/cross-container/noncanonical paths, target links and ancestor aliases
remain refused. The fixed preparer profile5d36610 adds only the exact read-only
shared helper code literal, which is included in current code hashing. Legacy
portableManifest is unchanged. Known quiescent pre-agent inputs and the separately
reviewed read boundary remain prerequisites; path checks are not hostile-writer
atomic isolation. Neither representation certifies original or copied namespace.

The preserved prerequisite recordSHA484ace316c9b3cb1d47a74237516247b9a99469647e5466e0587ec3b9d3b2452
reports PORTABLE_SYMLINK for33,345 selected files and77 links, including18 nested
links, with zero data-child launches/compiler executions/models. This is the
legacy manifest prerequisite refusal, not a failed real copy. Full-array stdout
overflow was anticipated, not observed. No historical failure was overwritten.

Independent archived tree/shim/manifest/child/namespace controls passed93/93
in345.77ms. Ten independent parent/child VM controls passed10/10 in89.63ms:
strict summary/schema/count/digest/flag/frame admission, stage type/identity,
handled74/invented-code privacy, source/parent/runtime/code changes, monotonic
deadline withdrawal and precise signal/reaping fields. A mock33,345-row child
result compacted below1KiB without rows/private paths and retained false flags.
An initial extra-control syntax error was confined to the reviewer fixture and
retained; no source changed to repair it. Three independent profile constructor
controls passed3/3 in116.17ms without a sandbox child.

The namespace alias precisione8f22d9 retains differing in-tree realpath answers
and marks ALIAS_TOPOLOGY_REQUIRES_LOCAL_VALIDATION without claiming a link. All
namespaceVerified/sealed/reuseEligible flags remain false, including when other
unresolved rows are empty. It does not replace actual compiler filesystem semantics.

GO for the unregistered fixture-only workflow proposal4c3fa1b: exact checkout5d36610,
one macos-26/arm64/Node22.13 job capped at3min, contents:read, fixed repository/
actor/task ref/run_attempt1 and only the22 child/3 profile/2 preparer-boundary
tests. YAML fixed-scope checks pass. There is no npm/script setup, public-project
copy, credentials, inference, upload/cache/signing or native-agent enforcement
claim. A normal push to the specified task branch triggers the one mechanics
run; an additional manual dispatch would be a separate attempt. Actual VM kernel
and preparer observations must be recorded, not inferred from the runner label.
The reviewer ran no real preparer, compiler, native agent, observer, model or CI.

## Source hardlink groups: bounded materialization direction

Conceptual GO, not implementation/run admission, for a source-only complete
hardlink-group extension. The first fixed public-project child refused TREE_FILE
with handled74 before staging. The separate preserved metadata diagnosisSHA
956e85cfdcfd5a268d0a812058b7b5304d42bd11f8133f30bd09a2e7791bcf55
names two esbuild regular source paths with nlink2 and reports no contents printed,
compiler executions or models. That static report does not itself establish
complete physical group membership or authorize relaxing all regular-file checks.
The earlier PORTABLE_SYMLINK/zero-child prerequisite refusal remains separate.

A proposed group must consist entirely of locally declared, actually distinct
directory entries. Count physical parent dev/ino plus the exact observed basename;
case/Unicode alias spellings cannot count the same entry twice to conceal an
outside link. Before any body read, all regular members must pass UID, mode,
physical fingerprint, ancestor and stable global nlink checks, with unique entry
count equal to nlink. Missing/outside/incomplete groups, links, nonregular/setid
objects or unowned members refuse. Revalidate group entries and physical bindings
around body reads/copies and after materialization. Existing quiescent trusted
pre-agent and preparer read-confinement prerequisites remain; this is not atomic
protection against hostile same-UID name swaps or writable mappings.

Destination files must retain independent fresh inodes with nlink1 and no source
inode inheritance. Source and materialized manifests are factually distinct:
index.mjs includes installed nlink>1 in its typed hash. Preserve the exact source
digest and independently validate each single-link staged digest with the same
sorted path set. A shim digest also binds its target digest, so the materialized
shim hash must use the materialized target hash. Do not normalize legacy provider
hashes, reinterpret receipts or call the original namespace preserved. Version
the changed materialization/summary interpretation and exact parent protocol;
explicit source/materialized manifest digests remain audit, not seal/current proof.

No read/write permissions, body/file/directory/transport/time budgets, compiler
recipe or execution authority should expand. All sealed/executable/reuse flags
remain false, failures retain partial stages and legacy portableManifest remains
unchanged. The reported hosted27-test preparer mechanics success is preparer-only;
runner labels without actual kernel/filesystem evidence do not establish a matched
sealed/native-agent recipe. The reviewer inspected source and static diagnosis
only and performed no additional preparation or native/CI/model operation.

## Retained parent mocks and disabled native stage-parent policy

The ten independent compact schema2 parent/child VM controls are now retained
as test/sealed-typescript-preparation.test.mjs. On frozen5d36610 with only that
test overlaid they passed10/10 in95.47ms. All filesystem/profile/child behavior
is mocked in memory; only reviewed module source is read. The test checks the
fixed sandbox-exec/profile/Node/child argv, empty env/SIGKILL, schema/count/digest/
false flags, stage directory type/mode/UID/dev/ino, physical-audit-only semantics,
finite74 refusal, current bindings, framing, final budget and signal/reaping
fields. The33,345-row compact-child example is also wholly mocked. Schema3 must
receive an explicit successor expectation; these schema2 tests do not admit it.

GO for pure disabled policy overlayc359f590ee88d297a82d4dc67cd6704e611ce693.
It composes the existing fixed native187 receiver proposal, adds only the exact
base/sealed-inputs parent to denyWrite, preserves every existing allow/read/
credential/network/argv limit and adds explicit unresolved seal/namespace gates.
The overlay deep-freezes data, refuses getter/symbol/foreign-stage inputs, and
retains disabled/inferencePermitted/physicalBindingsVerified/namespaceVerified/
sealed/reuseEligible false. Three independent archived controls passed3/3 in54.74ms.
This is not a settings application, stage identity verification or launch route.

The existing public native binary independently hashes to
a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3.
Its bounded source c2i@198193012, m2i@198193137 and w0d@198195039 emits an exact
non-glob subtree file-write denial plus literal create/unlink denials for its
ancestor directory entries, excluding '/'. Thus the narrow delta need not deny
the entire home tree or grant a new ancestor path. Three extracted non-glob rule
controls passed3/3 in52.78ms, including coexistence with a temp write allowance.
These isolate already expanded paths/default-list behavior; they do not certify
actual effective native policy or empirical syscall denial.

For integration, select a fresh locally provisioned stage outside checkout/state
and credential read-denial ancestry; bind its actual canonical physical parents,
independent inodes and descriptor/compiler/code/current settings before use.
Finish/reap the trusted preparer and exclude surviving untrusted write handles/
mappings before native access. Preserve all prior credential scrub/read denials,
strict sandbox/no fallback/excluded commands, exact command admission and fixed
network/socket authority. Any new descriptor or code leaf needs its exact immutable
write protection. Observe nonsensitive write/chmod/unlink/rename/ancestor-replace/
hardlink/shared-mapping refusal at the native command boundary before calling it
sealed. Modes, hashes and constructor data alone remain insufficient.

Default TS5.5.2 libraries and ancestor resolution remain a distinct requirement.
Ancestor entry guards do not freeze sibling ancestor/node_modules creation or
its existing contents. Derive all seven actual staged compiler filesystem query
kinds, retaining absent candidates, empty directories and membership/topology;
either place every relevant candidate in the enforced tree or conservatively
require separate exact candidate protections/current namespace validation.
Unexpected external positive files/body reads remain unsupported; no outside
read grant, ignored query, daemon-view substitution or timeout increase is
authorized by this overlay. D12 covers the restrictive proposal and current
approved VM scope; broader authority or a new executor is not implied. No native
process, compiler, model, CI job or settings write occurred in this review.

## Complete source aliases: materialization@2 and compact schema3 admission

GO for coherent335c14df3d653bbc3345cac1674f081562fb1c85 as one fixed restricted
data preparation operation and its two new nonsensitive preparer fixtures.
Leafd58493e sourceSHA22116157aad74ae8acf9879537b4325e5d8d7596490e5376c70741e95aa316e5,
childaf9de25 sourceSHA4be75afe5c26ad5bfdc1db331489e1ee12a88f7a86c786446fa630497116263b,
and parent sourceSHAdbadf63d93de45b5c32aad662d03bbeb96f89e48375b29d726b281974e2ff9eb
were independently inspected. No native receiver/agent/compiler/model or current
reuse admission follows. Existing origin containment stays false.

The leaf validates the complete selected source metadata before bodies: stable
owned regular groups, global nlink equal to actual unique physical-parent/exact-
basename entries, exact case spelling through source ancestors, bounded iterator
enumeration and current fingerprints. Outside/incomplete groups and aliases refuse
before source bodies/staging. Source hashes preserve installed nlink; every copied
regular file is a distinct fresh nlink1 inode, and copied shims bind the copied
target digest. Source and materialized sorted manifests, their digests and source
alias groups remain distinct. Source bodies/hashes and physical bindings are
rechecked after copying. Failed partial stages remain retained without recursive
failure cleanup or a false cumulative-quota claim.

Materialization@2 feeds compact protocolschema3/summary@2. Exact parent fields bind
the supplied source manifest/count, bounded materialized/physical/group digests,
logical alias group/entry counts, bytes and staged-root identity. Zero groups
requires zero alias entries, the empty-group digest and equal source/materialized
digests; positive groups cannot use the empty-group digest. Counts are bounded by
the selected file count. Noninstalled complete source groups can legitimately have
equal source/materialized hashes, so inequality is not an authority requirement.
All digests/counts are trusted-child audit, not parent per-file/current body proof.
Retired schemas/interpretations/arrays, inconsistent fields, arbitrary failure
codes, changed bindings and final budget exhaustion remain refused/UNKNOWN.
Empty env, fixed child/code/Node,8MiB transports,120s monotonic remaining budget,
512MiB logical content bound and false sealed/executable/reuse flags are unchanged.

Independent archived leaf/shim/manifest suites passed60/60 in367.62ms; current
parent/child/profile-constructor suites passed40/40 in398.54ms. Five independent
owned nonsensitive filesystem controls passed5/5 in111.29ms: complete nested
source aliases/distinct copies, outside alias zero-body refusal, case double-count
zero-body refusal, regenerated nested shim digest and source unlink/relink
refusal with partial retention. Three additional independent summary mocks
passed3/3 in62.30ms, including equal noninstalled manifests, impossible audit
shape/private-value withholding and three-member immutable false-flag audit.

The metadata-aware restored-ancestor test still reads a NONSECRET outside canary
before TREE_DIGEST refusal. The older trigger is caught earlier, not reinterpreted
as atomic read isolation. Trusted quiescent preparation and its separately reviewed
filesystem confinement therefore remain mandatory. The parent's intermediate
mock helper-binding failure is preserved as test preparation, not real child
materialization. The two new actual restricted-child fixtures were source-reviewed
only by this reviewer; no public project, sandbox-exec, compiler, native agent,
model or CI execution was performed here.

Before a sealed native recipe can qualify, actual nonsensitive admission must
also attempt an outside hardlink to staged content and write through any alias
if link creation succeeds, alongside stage/ancestor replacement and shared-RW
mapping refusal. No pre-existing writable mapping/handle may cross trusted
preparation into the agent phase. Source-derived subpath/ancestor rules alone do
not establish these kernel checks or complete TypeScript resolution semantics.

## Declared-input preparation harness correction

GO for the source-only harness correction to select the actual unique typecheck
check's inputs plus additive node_modules/** using existing InputIndex with
includeInstalled:true/trackGit:false. The public configSHA
961684311dd517f018380fce51db2ccfe6a4900ea86c0740d2453b94eb8f706b
has checks as an array; inputs belong to checks.find(name==='typecheck'), not an
absent top-level config.inputs field. Require exactly one matching check and the
current config/source revision binding before invoking the reviewed fixed child.
No compiler options, installed dependencies, hooks, scripts or input declarations
are modified. Additive matching is an independent OR, so the source node_modules
exclusion does not remove the explicitly selected installation.

Preserved refusalSHA14bb83c572d7b6b2b6b80f22650764f285f9519366e0fffd6ba9010eb5f0590f
records the mistaken broad ** selection33790 versus prior33345, zero children/
stages/compiler/models. Corrected read-only recordSHA
5c73baf0494e2d4f8f225d078999914487558680e2e135fee2852b7cfc6fb8fc
records exact current declared patterns, the unchanged additive installation,
33345 selected rows and zero children/stages/compiler/models. The445-row count
difference and historical count are diagnostics, not a command to force a match
or proof of compiler namespace equivalence. The correction excludes files outside
declared source and the additive installation through existing matcher semantics;
later unexpected compiler body/query requirements must still refuse qualification.

Four independent matcher-only controls passed4/4 in90.14ms: real selected inputs,
independent installed union including non-code/native/bin paths, generated code/
JSON retention, undeclared documentation/resource/Git exclusions and zero filesystem
calls during matching. The reviewer read only current config/static records and
source, did not scan/copy project bodies or execute a child/compiler/native/model/
CI operation. This correction permits only the already reviewed data preparation;
namespace, seal, executable and reuse authority remain false.

## Apple alias/mapping hooks: required native observations

This is source review, not empirical seal admission. Pinned Apple XNU
f6217f891ac0bb64f3d375211650a4c1ff8ca1ea's link path checks a MAC hook with
both the source vnode and destination directory/name before creating the link.
Its destination must be absent and on the same mount; source/destination vnode
authorization is also required. [vfs_syscalls.c,5660–5690](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/vfs/vfs_syscalls.c#L5660)

The MAC framework passes link, rename, mode and write checks to installed policy
hooks, including both source and destination rename contexts. This does not expose
the proprietary sandbox policy's exact pathname/alias interpretation or prove
that native187's proposed subpath rule denies each operation on the actual runner.
[mac_vfs.c](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/security/mac_vfs.c#L1433)

For file-backed MAP_SHARED, requested writable access requires a writable file
descriptor. Mapping also invokes a MAC hook with a reducible maximum-protection
set. MAP_PRIVATE can allow writable copy-on-write memory without mutating the
backing file. The mprotect path explicitly explains limits of that MAC check:
it cannot generally recover the vnode or substitute for mapping revocation.
Thus a new pathname denial cannot be assumed to revoke existing writable mappings.
[kern_mman.c,590–640](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/kern/kern_mman.c#L590),
[mprotect,1189–1203](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/kern/kern_mman.c#L1189)
The separate mapping hook permits policy to reduce, never enlarge, maximum
protections; it is not an observed sandbox result.
[mac_file.c,166–177](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/security/mac_file.c#L166)

Required native nonsensitive checks remain exact stage/body write, mode change,
unlink, rename, stage-parent/ancestor replacement and symlink/case alias access.
Attempt an outside hardlink to the staged file; if it unexpectedly succeeds,
retain FAIL and independently attempt a write through that alias. Missing alias
after a denied link is NOT_PERFORMED, not a denial. EPERM/EACCES qualify the tested
denial; missing/EXDEV/unsupported/unknown errors cannot qualify it. Preserve actual
stage bytes and physical identity checks and independent operation outcomes.
Acquire MAP_SHARED writable access through the actual native boundary, also testing
read-only shared mapping followed by write-protection escalation where supported.
Private CoW is not shared-file mutation. Missing mapping implementation leaves
the overall gate UNKNOWN rather than silently qualifying a partial sentinel.

Fresh independent staging inodes, trusted preparer closure/reaping and exclusion
of surviving untrusted writable descriptors/mappings remain prerequisites, not
things an endpoint digest or one post-denial syscall can certify. No whole-home
read/write grant, new arbitrary executor, global setting or copied authority is
justified by this source. The selected source version is not asserted identical
to the matched runner kernel. No native/compiler/model/CI/preparer operation was
performed by the reviewer; observer experiments are not resumed.

## Fixed preparation diagnostic: source-only admission

GO for diagnostic child/profile2bc2b35098c31b14962820ecd403c2776be4e26f,
childSHA723420f830b5f9effe589d7f95bf46f5d9ae6bbefebb6803e5b5aba1980e913e,
pending separate bounded-driver review before any actual attempt. It performs
the same fixed data materialization through the existing EOF/input grammar and
preparer resources. Its profile adds only one exact read-only diagnostic-code
literal/hash; normal child/parent remain unchanged. No imported path/code/callback
can select operations. Static source/stage/boundary primitive aggregates emit at
4s cadence, bounded32frames/64KiB, with no arguments, paths, bodies, environments
or raw errors. FS-call time excludes CPU hashing/JS/serialization and cannot be
reported as complete preparation phase wall time or net savings.

Four independent5dd counterexamples were preserved: directory instance methods
remained wrapped after measurement; throwing publication masked a completed open
before its handle reached the caller; publication replaced the operation error;
and failure before cadence lost the final accumulated counters. Intermediate1484
repaired those but retained two more mock counterexamples: validity was returned
before a capped final snapshot's clock failure, and a throwing failure-result
writer rejected main. These are unrun diagnostic-proposal defects, not causes
assigned to the preceding real-project timeout.

The final code restores open directory instance methods on close/finalization
and restores primitive methods on success/failure. Publication failure latches
without altering primitive results/errors, final failure counters are retained
when safely possible, clock failures remain invalid, and validity is reported
after restoration/fallback publication. Success/failure stdout uses a nonthrowing
writer; stream error handlers set74 without raw stack output. Missing collection
still does not qualify; even finished diagnostic data remains unsealed/nonreusable.

Independent archived final mocks passed8/8 in53.21ms and five independent former
countercase controls passed5/5 in51.10ms. Earlier frozen5dd/1484 controls remain
retained. All filesystem/stream/clock operations here were mocked; no real
preparer, compiler, native agent, model or CI operation occurred.

The coming driver must retain exact code/Node/source/config/current physical
bindings, empty environment and unchanged120s/SIGKILL/resource caps, parse only
bounded static frame/method/group/number shapes, and retain safe partial metrics
on killed/failed children without raw stderr. Invalid clocks/reporting or a kill
stay UNKNOWN; no timeout increase, validation deletion, partial cleanup, sealed
recipe/current authority or performance benefit is admitted by this source GO.

## Fixed diagnostic driver: final source and mock GO

GO for87d339b7d1a7897529a755262c564d02c28d684a with reviewed child2bc2b35,
driverSHA9802f27ec436ff3745e25901848d0cd5395bed4e32c9cae1ac9604870e8f3038,
as one fixed120s instrumented public-project data preparation attempt. The source
selection/config/revision, current Node/code/ancestor identities/hashes and empty
owned parent must be current under the existing trusted/quiescent prep boundary.
No compiler/native agent/model/CI, seal/reuse or origin containment activation
follows. Failed existing partials remain retained; per-attempt storage bounds
do not become a cumulative cleanup/quota guarantee.

The driver preserves the fixed sandbox-exec/profile/Node/diagnostic-child argv,
empty env, remaining120s/SIGKILL and existing8MiB input/output limits. Config
content/inode and source/parent/Node/code physical ancestry are bound before/after.
The metrics parser requires exact UTF-8/JSON frames,32frame/64KiB limits, fixed
groups/methods and finite cumulative five-number tuples. Present counters require
positive call counts and only read/write methods may report byte totals. Duplicate
fields, BOM, missing methods, decreasing counts, unknown fields/values, malformed
suffix or extra frames after final never qualify completion. An incomplete/killed
stream retains only validated complete prefix rows; invalid suffix bytes are not
retained/output or skipped to accept subsequent data. Oversize input retains none.

The diagnosticOperationFinished field requires a complete stream, positive PID/
observed reaping, actual exit0/no signal/error, exact fixed stdout summary/final
metrics, current bindings and final validated deadline. Overall outcome remains
UNKNOWN/sealing NOT_TESTED/reuseEligible false even when that narrow field is true.
All finite normal-parent POSIX signals retain their names; unknown names are
withheld. Result/frames are deeply frozen before the last validated clock sample;
exhaustion/reversal/nonfinite time withdraws finished truth and returns null elapsed.
Raw streams, spawn errors and arbitrary reason values do not leave this boundary.

Independent frozen author suites passed25/25 in106.09ms. Nine independent driver/
parser VM controls passed9/9 in62.60ms and are retained as
test/sealed-typescript-preparation-diagnostic-driver.test.mjs; the tracked test
overlay passed9/9 in62.11ms. Controls cover the fixed route and UNKNOWN authority,
post-child source/config-content/config-inode/Node-content/Node-inode/code/alias
mutations, missing/failed/unknown streams, pid0, exact signals, first/final clocks,
impossible counters, BOM in both streams and safe killed-prefix retention.

Frozenfeb8 controls preserve the prior signal-loss/impossible-counter/final-budget
counterexamples; a corrected mock finish assertion additionally exposed pid0 and
stdout-BOM admission. The earlier fixture assertion typo skipped that one check;
the final retained test checks every failed/missing case. These were unrun driver
proposal defects, not actual staging timeout causes. The reviewer used only
in-memory filesystem/profile/spawn/clock mocks and known module source, launching
no real child/preparer/compiler/native/model/CI operation.

Collected method durations remain diagnostic aggregates with instrumentation and
unmeasured hashing/JS/serialization costs. They are not total phase wall time,
an isolated causal explanation, net benefit or preparation/sealed recipe success.
The unchanged deadline may still produce UNKNOWN with a retained incomplete tree.

## Disabled stage sentinel: preserve violations through cleanup uncertainty

GO for disabled corebc61c1d3f043a01413ad93029b3eace28638d139,
sourceSHAfce06801e0421de329c0b8f9bd484f19c65efd588b39dcb4809f0a13dfcd7dcf,
not an actual checker/native/model launch. Checked-in placeholders reject the
real route. Rendering/physical fixture/current code/Node/profile/native trace
and parent deadlines remain separately required. No stdin/options/imported paths
select operations; only the fixed nonsensitive fixture is probed. Readable fresh
nlink1/mode644 markers and a permitted owned workspace-write control gate all
destructive stage operations. Only EPERM/EACCES qualify tested denials; missing,
EXDEV, unsupported and unknown errors do not. Denied hardlink creation skips alias
write as NOT_PERFORMED, never a fabricated denial from the nonexistent alias.

Two independent27f mock counterexamples reproduced close-error failure erasure:
successful protected write plus unknown close/final audit became overall UNKNOWN,
and a successful link retained FAIL while its separately successful alias write
became UNKNOWN. The successor retains ACCESS_SUCCEEDED/ASSERTION_FAILED for
protected/alias actions, while independent cleanup uncertainty makes the final
audit UNKNOWN. Earlier FAIL remains FAIL. Positive fixture/allowed-workspace close
uncertainty still stops all destructive operations. No host/syscall evidence was
assigned to these purely mocked proposal defects.

Independent archived successor mocks passed36/36 in57.96ms; three independent
former-countercase/prerequisite controls passed3/3 in43.49ms. Original33 mocks and
two old countercases are retained. No actual filesystem assertion, checker,
mapper, compiler, native agent, model or CI operation was performed.

Nominal implemented denials still produce overall UNKNOWN because MAP_SHARED is
NOT_IMPLEMENTED; case/symlink operation aliases and complete native-stage admission
are not supplied by this core. Its stage parent is protected-stage-parent, while
the c359 receiver overlay names sealed-inputs. Actual future settings must protect
the exact selected synthetic parent and checker/code ancestors, retain intended
allowed-workspace control access and existing credentials/network/strict sandbox
constraints. Do not treat the unchanged overlay or source route check as observed
binary, policy, fixture or sealed-tree authority. All sealing/reuse flags stay false.

## Ephemeral copy fsync: narrow direction only

Conceptual/source GO to omit only per-copy file fsync from the private ephemeral
data stage, pending exact leaf/test review before any retry. The current call sits
after fchmod and before post-open/path checks and independent full readback. It
does not exclude writers, revoke mappings or certify origin/namespace intervals.
The materialization has no power-loss durable-stage/recovery claim and does not
fsync its newly created parent directory entries. Existing receipt/state durability
operations are outside this proposal and must remain unchanged.

Preserve file modes, source and copied content readbacks, physical/open/path
fingerprints, independent nlink1 destination inodes, full final manifest/namespace/
alias/ancestor validation, fixed bounds and retained partials. Crash/restart may
not accept an old summary as authority for an incomplete/lost tree: fresh full
physical/content/namespace/profile validation or fresh preparation is required.
Move race-fixture injection from fsync to immediately after successful fchmod at
the existing pre-fstat/readback boundary, retaining exact refusal assertions and
the old evidence. Add a no-fsync/full-readback control. No timeout increase or
compiler/native-agent execution is admitted by this direction.

The reported diagnostic filesystem-method aggregate and wall-minus-method residual
are not measured kernel-only or CPU-only time, causal savings or a successful
preparation. Instrumentation affects the workload; evidence must remain scoped
to the actual fixed diagnostic and its UNKNOWN result.


## Ephemeral materialization: exact fsync-only successor

GO for data-only leaf 6b530a9eaa2374b35c80ad6e2da2c8f23a13bc42,
source SHA34fa860570d282badcb00731c7861fd53d3026a82549596a8bad82e56256a932.
It removes only the per-copy fsync after successful fchmod. Source and copied
content readbacks, alias/namespace/physical checks, independent single-link
inodes, final validation, fixed bounds and partial retention remain intact.
Seven race controls now inject after fchmod at the same pre-fstat/readback
boundary and preserve their refusal assertions. Receipt/state durability code is
unchanged. The ephemeral stage promises no crash durability or recovery; an old
summary cannot authorize a lost, incomplete or changed stage after restart.

Independent archived tree/shim/manifest suites passed61/61 in234.11ms. Six own
owned-fixture controls passed6/6 in77.68ms, including zero fsync calls, independent
copied-body readbacks and post-fchmod copied-body corruption refusal. These were
harmless local materializer data tests, not a compiler, agent, model or CI run.
The review admits only the fixed data copy under unchanged120s/source/config/
private-parent bounds. It supplies no sealing, namespace-equivalence or reuse
proof. A later parent-reported successful normal copy is separate evidence; no
causal savings claim follows from comparing it with an instrumented timeout.

## Staged compiler profile: preliminary prelaunch findings

Exact ff0c49f49508d34963d1d61e4ec700c9c96e9d5f profile construction remains
nonauthoritative. Existing directProject reads the package/script/environment,
resolves canonical stage-local TypeScript and hashes the whole implementation
before importing any compiler API. The proposed profile permits stage reads,
protected runtime reads and only /dev/null writes; no stage-write, fork or network
grant was found. This does not establish original ancestor-resolution namespace
semantics: protected outside lookups may fail with EPERM instead of ENOENT.

Five exact VM controls passed5/5 in47.45ms. One independent control with three
scenarios reproduced admission of mismatched effective UID/GID and a setuid Node
mode. Require matching UID/EUID and GID/EGID, nonroot UID and nonsetid Node before
any fixture launch. These are unexecuted proposal gaps, not actual host failures.
A launch also needs fresh full stage/source/config/runtime/parent bindings,
fixed stage cwd/argv/validated environment, bounded output and observed child
reaping. No compiler, native-agent or model was launched by this review.


## Staged compiler profile: principal repair source GO

GO for exact2d39c876bc9a9d4e9f156aa77174b34325de233b as a read-only test
profile constructor. It now requires nonroot UID and matching real/effective UID
and GID and refuses either Node setid bit. Five archived exact VM controls and
one independent former-countercase control (effective UID, effective GID, setuid,
setgid) passed. The combined TAP has11 tests because the independent file repeats
five baseline controls; it is not11 unique independent tests. Duration62.70ms.
The earlier ff0c construction countercases remain preserved as development
findings, not host execution defects.

No compiler launch is admitted by construction alone. Fresh full source/stage/
config/runtime/parent bindings, exact stage cwd/argv/validated environment,
bounded supervision/output and observed reaping remain required for the fixed
read-only fixture. Native-agent enforcement, absence/alias topology equivalence,
origin intervals, sealing and reuse stay unverified. In particular, sandbox
outside-lookup EPERM cannot be silently reinterpreted as original ENOENT.


## Fixed staged-compiler harness: unrun proposal countercases

NO-GO for initial private harness SHA8acb16946c8a7a89fc867dd225b5c51bff1a8df4a2117ab0241fc8ee404bedc9.
Four independent VM controls reproduced PASS after a30s deadline (elapsed30001ms),
PASS after a reversed final clock (elapsed-1ms), failed-spawn/pid0 labeling as one
compiler execution, and status74/no output labeling as compiler FAIL. Git source
checks also had no remaining-budget timeout. These mocks passed4/4 in45.08ms;
source inspection/currentness walks were mocked solely to isolate supervision.
The initial mock import-stripper SyntaxError was a reviewer fixture failure,
corrected before assertions; no actual child or compiler ran.

The harness did not bind imported implementation/profile/manifest code before
and after execution, nor perform the promised fresh full original-source
manifest comparison. Require those checks, validated monotonic budget through
finalization/persistence and truthful dispatch/observed-exit fields. Ambiguous
sandbox/Node startup failure stays UNKNOWN rather than typecheck FAIL. Keep the
30s bound; fresh full validation cost is observable and must not be hidden.
This finding does not invalidate the separate2d39c87 constructor source GO.


## Disabled C mapping helper: exact observation repair

GO for SOURCE-ONLY mapper3b3fdd003abb4f3f8cb6d5d74fc6c30c2894d657,
sourceSHAf274279da3a48602fd1b1b4332a14b1fea5f778393c2be148ded8d81e0ed100c.
It adds matching real/effective GID and captures byte-read and metadata success
independently. Known wrong bytes or known identity mismatch latch FAIL before
unrelated sync/read/metadata uncertainty; unavailable metadata/read alone remains
UNKNOWN. Cleanup stays separate from operation observations. Readonly-descriptor
VM constraints remain distinct from actual sandbox permission denial.

Ten archived source/finite-Boolean controls passed10/10 in49.32ms. This evaluates
whitelisted side-effect-free Boolean expressions, not C compilation, ABI, syscalls
or native enforcement. No C executable was built or run. Placeholders still
block the route; exact baked fixture paths, reviewed SDK/toolchain/source and
binary identities, fresh current physical/principal bindings and bounded parent
supervision require separate review. All helper outcomes remain FAIL or UNKNOWN
with false sealing/reuse flags. The original07f source findings remain historical.

## Fixed read-only command fixture: exact final source GO

GO for private harnessSHAbcc70147757eda863b589e3fd1100582a6e94a6746e576c62fb6d670ff2d9fe9,
limited to one fixed local read-only dispatch under unchanged30s/1MiB and the
reviewed profile. Fresh full selected-source plus whole-installed manifest,
full stage content/namespace/physical checks, source/config/runtime/code/ancestor
bindings and before/after comparisons are now present. Fixed local signal data
removes the unbound test-module import closure. Git calls use remaining budget;
invalid initial clocks latch refusal. No environment rewrite or arbitrary
command selector was added.

The intermediate78b9 source admitted a NaN initial clock/timeout and performed a
post-close pathname r+ rewrite. Two independent VM controls reproduced those
unrun proposal findings in43.77ms. The final version uses one held exclusive
nofollow read/write descriptor, bounded exact readback and physical identity
checks; no pathname reopen remains. Its saved record explicitly awaits final
outer acknowledgement. Close/persistence/final-budget failure yields UNKNOWN.

Seven independent VM controls passed7/7 in47.99ms: invalid seed/zero dispatch,
late budget/no reopen, failed spawn/dispatch only, nonzero outcome/timed Git,
changed code, close error and output replacement. Full inspection functions were
mocked only to isolate supervision; source review separately checked their real
wiring. No reviewer preparer/compiler/native/model/CI operation occurred.

READONLY_COMMAND_EXIT_ZERO_NOT_SEALED acknowledges only the fixed command's
observed zero exit with current bindings and matching final outer completion.
compilerExecutions stays NOT_INDEPENDENTLY_ACKNOWLEDGED. Missing/ambiguous outcomes
remain UNKNOWN. Sandbox lookup EPERM is not original ENOENT, and no old summary,
source-only guard, fixture outcome or materialization grants namespace-equivalence,
native-agent protection, a seal, an origin interval, receipt or reuse authority.


## Actual read-only fixture: deadline remains UNKNOWN

Independent read-only review of the saved local fixture record confirmed
SHAfb4a76d487fd8f36decd11588fa55db107715b89c2e6a8d4b3fb0f4a1985bfb0,
owned regular single-link0600/1233bytes. Matching outer acknowledgement is
SHA97d04b2482ce8a0cb6e65f71600859b73be52972580873bd1075da025b1aaa00,
owned regular single-link0600/415bytes, and binds the saved hash. Both say UNKNOWN /
FIXTURE_DEADLINE. One dispatch returned child status0, no signal and observed
reaping, with no retained stdout/stderr bytes. Compiler execution remains not
independently acknowledged. Final currentness and elapsed duration were not
established. No validation-phase cause or compiler/recipe success follows from
this result. The reviewer read only these scoped records and canonical plan text,
and did not repeat the fixture or execute a compiler/native/model/CI operation.

## Prepared-tree obligation versus live-source currentness

Canonical Section3.3.1 and D12 authorize an explicit prepared stable-tree recipe,
not conversion of the original live-checkout/npm obligation. Before/after full
live-source matching was an extra promise of this particular fixture. It is not
inherently a compiler input where the selected argv, cwd and configuration resolve
inside the exact prepared tree. A future stage-only mechanical fixture may omit
that full live-source audit only by explicitly narrowing its claim: preparation
source selection/config/manifest provenance remains historical, with no statement
that the live checkout is still current or semantically equivalent.

Do not omit fresh full staged namespace/content/physical/parent/runtime/profile/
code checks or actual stable-input enforcement. Outside resolution, library
replacement, aliases and lookup-denial semantics remain unresolved. A sandbox
EPERM is not the original namespace's ENOENT. An old preparation summary or a
command zero exit is never a seal or receipt. Future recipient/caller applicability
must independently establish fresh locally selected source/context equivalence to
the explicit staged recipe under its supported interpretation; source selection
and the complete obligation remain required. Existing origin containment stays
false. This conceptual distinction grants no further compiler/native invocation.


## Fixed component diagnostic and prepared-snapshot claim

GO for phase-only private harnessSHAeaf2a23afc42407dd19334bafdfa0aa1b226a8647f39c120ff21705aca1eaf82,
one read-only code/source/stage/profile component measurement under30s, no
compiler/agent/checker/model dispatch. Initialef67 raw before/after component
clock reads did not participate in the validated monotonic sequence. The repair
uses remaining() and validated last at each boundary; invalid/reversed/exhausted
clocks latch and admit no later callback. Output remains UNKNOWN and component
observations cannot establish whole-cycle currentness, a seal or origin authority.

Six independent VM controls passed6/6 in53.39ms: all four callbacks with zero
dispatch, invalid seed, invalid preboundary with no callback, invalid postboundary
with no subsequent component, static exception privacy and persistence/close
uncertainty. The first reviewer overlay accidentally removed measure()/phases,
causing1PASS/5fixture failures; correcting the replacement span preserved the
real supervision code. No real measurement or filesystem component walk ran.

GO for snapshot-only private harnessSHAc2b0b18903884d18c35a6744b2ac9d77339200f66a5546faa9897e0aa13c7205,
one fixed local read-only prepared-snapshot dispatch under unchanged30s/1MiB and
the reviewed kernel profile. Its exact diff removes live-source Git/config/body
reads and full live-manifest re-audits, binds the staged tsconfig instead, and
labels liveSourceMatchingClaimed=false and sourceProvenance=HISTORICAL_PREPARATION_RECORD_ONLY.
All full stage-content/namespace/physical, parent/Node/code before/after checks,
fixed stage argv/cwd/validated unchanged environment and publication supervision
remain. Original bcc UNKNOWN is preserved, not converted or retried under its
old claim. Namespace/enforcement and future fresh recipient source equivalence
remain separate required gates.

Eight independent VM controls passed8/8 in49.56ms, retaining seed/late-budget,
spawn/exit truth, code currentness, persistence/readback/close and the historical-
only scope. Saved observations require matching final outer completion. A narrow
PREPARED_SNAPSHOT_ROUTE_EXIT_ZERO_NOT_SEALED is no independently acknowledged
compiler execution, native-agent protection, namespace equivalence, seal, receipt
or reuse authority. Reviewer source/mocks performed no real phase walk, compiler,
preparer, native agent, model or CI operation and raised no deadline or permissions.


## Actual component sample and snapshot mismatch: no cause assigned

Independent read-only review confirmed component record
SHA01ea67ad1c9942cde06fe523c6a56a093418f1e23df4d4a89b5f50665bc44c5a,
with matching outerSHA8841bee1f50c976e37ee65a7371f3cc0afd468b7f2d6805c0c1a115ec42641a5.
Both are owned regular single-link0600. Four callbacks completed with zero
compiler dispatch/execution and overall UNKNOWN. Single observed component times
were code72.551ms, live selected/installed source9857.792ms, full stage6685.825ms
and compiler/runtime profile68.730ms; sequence elapsed16695.479ms. This is not a
whole before/after cycle, causal attribution for the earlier deadline or a seal.

Snapshot recordSHA821b673b58874fef758b09f991d235f1046f9bb3fa8c707b88ca6eb6964c136c
matches outerSHAdd1962ff870a3f2fe38c3e4699e3dd5f16a332ee4f8e65f9dc7588ba5aee1ab2;
both owned regular single-link0600. It remains UNKNOWN with bindingsCurrent=false,
14537.30225ms, one dispatch, child0/no signal/observed reap, no stdout/stderr bytes,
and33345files/4532directories/77links. No failed guard role was retained and no
compiler repeat is justified by guessing it. In the exact source each successful
inspect call requires the same immutable expected manifest digest, so the content-
digest conjunct is equal; code rows, full stage physical or general bindings can
still explain the false conjunction, without a specific actual cause established.

Source review found codeBinding hashes insertion-order enumeration rows and full
ancestor-directory fingerprints including size/mtime/ctime. Four pure known-row
controls passed4/4 in50.46ms: reordered rows change the original digest but not
an order-independent full-row multiset; duplicates remain represented; directory
size/time change differs from identity change; same-body inode replacement and
new empty-directory topology still differ. These are diagnostic counterexamples,
not an actual fixture cause or permission to weaken currentness guards.

Smallest next direction is one no-dispatch read-only pair of unchanged guard
collections, reporting only fixed component equality booleans: original code
order/full-row multiset, file/link content+physical, directory identity/topology
versus full metadata, stage manifest/full physical, and Node/profile/config/parent
roles. Sort whole canonical rows and preserve duplicates for diagnostic comparison.
No raw paths, bodies, timestamps, inode values or environment are output. Keep
original strict classification/allUNKNOWN and actual finalization bounds; normalized
comparisons are observations, never an admission rule. Missing/failed components
stay unknown. Exact code still requires independent review before measurement.
No reviewer compiler, native/model/CI operation or real component walk occurred.


## Exact no-dispatch guard-pair diagnostic source GO

GO for private harnessSHA62d08f068055be8d943639ff4589a1538ab4230a31bcafd445e39628a1bd1fc1,
one fixed read-only before/after pair under30s. It retains the reviewed stage-only
scope, full stage content/namespace/physical inspection, runtime/config/parent
bindings, fixed profile construction, monotonic deadline and held-descriptor
publication. No compiler/native/model/checker is dispatched. Outcome is always
UNKNOWN and interpretationAuthority is NONE. Existing strict admission is unchanged.

The only new output projection is nine equality booleans: original code order,
full canonical-row multiset, code file/link identity+content, directory identity/
link count, full directory metadata, stage manifest, stage physical, runtime/
config parents and exact profile. Full-row normalization sorts canonical strings
and preserves duplicate multiplicity. Directory identity excludes timestamps/size
only for diagnostic separation, never as an admission criterion. Paths, bodies,
inode/timestamp values and environment stay private inside collections; no raw
rows appear in public or saved diagnostics.

Seven independent VM controls passed7/7 in55.83ms: projection/privacy/zero dispatch,
order-only differences and duplicates, directory metadata versus identity,
same-content inode replacement and empty-directory topology, independent stage/
runtime/profile changes, invalid seed/persistence/close uncertainty and final
budget failure/no reopen. The first mock incorrectly assumed sourceManifest still
existed and corrupted its source splice (0PASS/6fixture failures); a conditional
mock span fixed this without changing the reviewed harness. No real guard walk,
compiler, preparer, native agent, model or CI ran in review.

The pair may classify differences in its own two collections. It cannot
retroactively identify the c2b mismatch, establish continuous stability, weaken
namespace/physical protection or grant a seal, receipt or reuse authority. Saved
observations still need the matching final outer acknowledgement; failures remain
UNKNOWN and no normalization can replace the original strict guard.


## Instrumented fixed snapshot route: original admission retained

GO for exact private harnessSHAc630fe0d50925979d6d241b064ac1855028593082332bca0a44ae45854837128,
one changed fixed local read-only snapshot dispatch under unchanged30s/1MiB and
profile/argv/cwd/environment. Its diff returns code and stage physical rows only
internally, adds ten fixed equality booleans and preserves the original ordered-
code digest, stage manifest/full physical and runtime-parent conjunction. Sorted
multiset and file/link/directory projections cannot admit a run when that strict
conjunction fails. No raw rows, paths, inode/timestamp values, bodies or environment
are added to equality reporting. Historical preparation provenance and false
live-source/native/seal/reuse claims remain unchanged.

Seven independent VM controls passed7/7 in50.74ms: bounded Boolean/privacy
projection and narrow candidate, order-only difference still UNKNOWN, directory
metadata/duplicate refusal, stage-file physical versus link/directory separation,
runtime mismatch/failed spawn/nonzero exit UNKNOWN, invalid/late clock and
persistence/close failure. Private source and fixed mocked controls are archived
under the reviewer's instrumented-snapshot-c630 evidence directory; no private
host-specific harness or paths are added to tracked source. No real compiler,
preparer, native agent, model, filesystem guard collection or CI ran in review.

The earlier no-dispatch pair being all true establishes only its own sampled
collections, not the cause of prior c2b UNKNOWN or an origin interval. Matching
final outer acknowledgement remains required. Any route-zero result is still
NOT independently acknowledged compiler execution, namespace equivalence,
stable native seal, receipt or reuse authority.


## Actual instrumented snapshot route: narrow zero exit only

Independent read-only record review confirmed saved
SHA3e90cfe8e791bb160900eb62726e514e4810045e1e9ef7153a71e77798f92d00
and matching outerSHAf42f8b64aec6ecb86f725e951ddc262d1eb7b9d2aa27d5c8195a9dd968039ee1.
Both are owned regular single-link0600. The actual narrow outcome is
PREPARED_SNAPSHOT_ROUTE_EXIT_ZERO_NOT_SEALED with one dispatch, child0/no signal,
observed reap, no stdout/stderr bytes, all ten equality booleans true and
bindingsCurrent=true. It records33345files/4532directories/77links and
14848.777709ms. Source provenance remains historical only/live matching false,
compiler execution NOT_INDEPENDENTLY_ACKNOWLEDGED, sealed/reuse false. The pending
saved observation is paired with its actual final outer acknowledgement.

Also verified no-dispatch guard-pair saved
SHA267f2fe0947240e372997020f666b4683e2cbcdf39697a0a3846def466e0c334
and outerSHAf166a39b6b9292780c8a266dc1628c7dde3ad85c3c8c9df5c30b69011c323327,
owned regular single-link0600, all nine comparisons true,10003.204291ms,
zero dispatch/execution and overall UNKNOWN. These outcomes establish only their
actual sampled scope. Earlier UNKNOWNs retain their original causes/uncertainty;
no earlier mismatch is retroassigned, and no additional score retry is needed.
No seal, native-agent enforcement, original namespace equivalence, portable origin,
receipt, G2 or reuse authority is promoted. No causal/time-saving claim follows.
The reviewer read only scoped records; no compiler/native/model/CI operation ran.

## Sealed capture strategy: source ordering requirements, not implementation GO

Current typeScriptInputFacts requires the TS API before configuration parsing and
before compilerFiles. The latter's remember() asks raw queryAnswer before TSsys;
EPERM/EACCES throws in the raw helper while TSsys may catch it and produce its
semantic false/undefined/empty/fallback result. Legacy helpers/default behavior
must remain unchanged. The proposed sealed-only strategy must establish actual
stage cwd and the restricted filesystem view and forwarding recorder before the
first verified TS API load, including cached realpath/native and config-phase I/O.

Preserve both actual TSsys answers and tagged underlying DENIED/MISSING/OTHER
observations, never reinterpreting a denial as absence. Scope nested readDirectory
and cached calls, tag module-load versus config/program facts, restore forwarding
in finally and retain bounded/privacy-safe protocols. Caller and revalidation
must use the exact same constrained staged view, not a permissive daemon. API
program discovery is not independently proved equivalent to all actual CLI
queries or a successful typecheck. Exact implementation/schema/bounds/restoration
and native profile/currentness need review before any capture invocation; this
source direction alone grants no execution, sealing or receipt authority.


## Fixed local mapping wrapper: adversarial framing and violation preservation

Initial private wrapperSHA795f7749e1b2fb54353be69ce12d1e2ce04811867981c8955f20e7a31de52f96
was blocked. Five independent fully mocked controls passed5/5 in59.11ms,
reproducing persisted unreviewed classification/accepted extra schema, malformed
FAIL-header latch, valid ACCESS under UNKNOWN header lost, known failed fixture
preservation masked, and arbitrary status/signal falsely reaped. Class/errno
relations and known unsafe postmetadata also required correction. No real mapper,
fixture operation, C build, native agent or model ran in reviewer controls.

GO for exact465c5daf9880490351c74605eefbc35f753561204188ba35984dde3eda8b4842
for its one kernel-only fixture under15s/8192-byte child cap. Ten independent VM
controls passed10/10 in80.07ms: exact finite UTF8/schema/enum/errno relations
before row retention, valid failure preservation, unsafe postmetadata failure
before body reads, syscall-unavailable UNKNOWN, intended workspace timestamp
change, finite status/signal/reap, framing/duplicate/BOM rejection and deadlines.
Known violations survive later closure/currentness/persistence uncertainty.
Malformed frames and unsupported FAIL headers do not fabricate failures.
Profile remains default-deny with only exact workspace-canary writes and named
canary/binary/OS-runtime reads; no network/fork/new executor or native-agent grant.

Independent record review confirmed first saved
SHAad1c9da44ef66af8a4913260af59a7078a400f12359f62c5da1cff5b05c39ca8
and outerSHA5794a43acae31c4a76767376654a5857f57f9a26581a660567327a111ada8f27,
owned regular single-link0600, final ACK true, child74/no signal/observed reap,
450.0875ms, first row UNKNOWN/EINVAL, mapping operations NOT_PERFORMED and
owned descriptors closed. Fixture/pins/ancestors were current. Role and syscall
phase were not captured, so the actual EINVAL cause remains unassigned.

## Source-backed nonconflicting mapping flags and changed fixture

Apple's pinned xnu-12377.1.9 vn_open_auth rejects simultaneous O_NOFOLLOW_ANY and
O_NOFOLLOW, and separately applies NAMEI_NOFOLLOW_ANY for existing-file lookup.
This establishes the incompatible reviewed flag pipeline, not the precise actual
failure phase or equality with the running kernel patch.
[Apple XNU vfs_vnops.c](https://raw.githubusercontent.com/apple-oss-distributions/xnu/xnu-12377.1.9/bsd/vfs/vfs_vnops.c)
Installed SDK27 fcntl.h constants independently matched ANY0x20000000,
terminalNOFOLLOW0x100, NONBLOCK0x4 and CLOEXEC0x01000000. No real open probe ran
in source review. Actual kernel12377.161.15.700.19 and SDK27 are separately
reported context; cited12377.1.9 is not actual-kernel proof.

GO for source-only f3bb399 / SHA45da4c9ae98b6d7f893a5edb133c2e8401be477e92432bfbf76d4608bfec69ef:
remove only conflicting terminal NOFOLLOW, retain ANY/NONBLOCK/CLOEXEC and add
static conflict assertion. Identity, false-authority protocol and operation/
cleanup distinctions remain unchanged. Eleven archived source/Boolean controls
passed11/11 in49.81ms; no C compiler or syscall ran in reviewer testing.

GO for exact changed fixed parentSHAba293b1b1d1ecae7aa0696a908eb519425e214160294ccc654612ff986209149.
It changes only the build-directory basename and four pins. Independently checked
exact two-path render189b2f24..., binary97c9446f..., profile447bac61... (only base
rebind), manifest367de87e..., canonical owned single-link leaves, code/profile/
manifest0600, binary0755/nonsetid, and0644/30-byte marker canaries. Ten same
mocked adversarial controls passed10/10 in64.77ms. Original records are preserved.
No review-provided real build or mapper/native operation occurred.

Actual changed savedSHA2ffd49d880f1c14302739fabe8dbc9613e0f7a5beb6269bd6eba949f8d79d813
and outerSHA2dff05c850b1deaf07e04a8d94c67acd04e73fd77b1312ecfe9361c1e4553c4f
were independently read: owned regular single-link0600, final ACK true,
442.304042ms, child74/no signal/reaped, no stderr, all seven expected rows.
Writable workspace MAP_SHARED change/restore was observed; staged O_RDWR returned
EPERM; readonly-FD mprotect/shared-write mapping returned EACCES. The latter are
descriptor/VM constraints, not independent sandbox-denial proof. Fixture/pins/
ancestors remained current. Global UNKNOWN/native-agent NOT_TESTED/sealed and
reuse false are correct. No stage-wide native-agent seal, no-inherited-writer
proof, receipt or origin authority follows; first UNKNOWN is not reclassified.

## Shared compiler graph extraction: legacy behavior retained

GO for e06b29f shared compilerProgramFiles extraction. It moves the existing
config/host/program traversal without changing default raw queryAnswer,
queriesMatch, provenance or admission; it loads no API and grants no callback
or imported-code authority. A future sealed child must supply only its verified
trusted API/forwarding context. Five fake-compiler controls passed5/5 in48.93ms;
three own before/after VM differential controls passed3/3 in49.82ms, preserving
graph/query facts and call order, raw EPERM before TSsys fallback and bad-config
refusal before program creation. No expensive actual TypeScript test was rerun
by the reviewer, and no sealed capture/namespace/CLI equivalence is approved yet.


## Parsed-config guard and scoped discovery journal

GO for b47445df52e96915e6f9cd47def380d46bc8df23, shared traversal source
SHA032575ac085029d6dbfe584ab38942b947697568abbebd8e757842a3016b459b.
The optional trusted synchronous validateParsed callback sees the SAME parsed
configuration once and runs before host/program construction. Missing legacy
callback behavior is unchanged. Invalid configurations suppress the callback;
throwing, asynchronous or nonempty-return callbacks suppress host/program creation.
The guard runs AFTER configuration parsing: it neither prevents nor certifies
config-phase reads or extends resolution. Restricted filesystem view and scoped
recording must already be established before the first verified API load.

GO for data-only journal5ff266b,
SHA43eb721beca1d6c670836eae434e8ebcf1ba731dd7e596631f1ea2399d903f10,
and forwarding4224639702907b9ee9b4e1fe64e218f71ceddd95,
SHA5775324ca01490ff1cf8e651976aa4a324813211249472e61b6d22379ff317eb.
The journal forwards the original synchronous functions and exact result/error
identities, restores installed descriptors, separately retains raw DENIED versus
MISSING and actual semantic return summaries, hashes outside paths/values and
withholds complete logging on unsupported methods/metadata, mutations or bounds.
The adapter captures exactly six original ts.sys functions, preserves system
receiver and all argument slots/options/undefined markers, and creates no second
compiler graph. It neither loads TypeScript nor selects an execution authority.

Independently ran26 authored fake journal controls,16 authored fake forwarding
controls,7 fake traversal controls and3 own old/new VM differential controls:
52/52 PASS198.30ms. Six additional independent fake adversarial controls passed
6/6 in49.22ms, covering config/guard ordering and rejection, raw denial versus
absence with identical semantic false, restored descriptors on success/error,
closed cached-wrapper behavior and semantic option preservation. Archived source
and own controlsSHA76606036ad9e92bc3589a824c9af3930fe2498e06ebbba4565dde448e012f675
are retained under the owned raw-wrapper-review evidence directory. No actual
TypeScript API, compiler, native policy, model, preparer or CI process ran in this
review; all filesystem operations inside the capture controls were injected fakes.

Two limitations were deliberately reproduced, not waived. A cached native
wrapper can forward later calls after the capture closes; these calls are absent
from the frozen completed snapshot. Trusted callbacks must leak no work and the
fresh restricted probe process must end without extending that scope. Semantic
readDirectory frames omit argument tuples although forwarding preserves them
exactly; the journal is not a replayable full query record. Any future capture
that needs those tuples must retain them separately under its own reviewed contract.
FORWARDED_CALLS_ONLY, module-loader/query completeness NOT_ESTABLISHED and all
namespace/sealed/reuse flags false are therefore necessary. Node internal loader
bypasses, CLI/API equivalence, first-load implementation binding, staged namespace
validation, stable execution and recipient currentness remain separate gates.
This review authorizes helper integration only; no sealed origin or reuse follows.


## Fixed staged API-program probe: engineering observations only

GO for8dc3b49564596a7e6c2a1b37ad17d46c189c2e77,
sourceSHAbf6b17dcd0abc15ec76a487fd8ef0ea0527456d23f2cd628c373198b5642522f,
for bounded API-input discovery, not a verification/typecheck command or reusable
certificate. Fixed directProject verification requires the whole reviewed5.5.2
package and exact entry/digest, selected canonical cwd and empty selected API
cache before load. The journal is installed before first require. Forwarding
feeds the existing single parsed-config/host/program graph; the trusted parsed
guard rejects the reviewed unsupported options/references before host/program.
Config/program readFile requests outside the root are refused before forwarding
body reads, rather than converted to missing answers. Ordered graph results and
duplicates are retained; outside files and physical aliases are refused before
publishing. This does not establish Node-loader confinement or query completeness.

Twenty-three authored fake controls passed23/23 in191.33ms. Eight own fake
countercontrols passed8/8 in65.31ms: package admission and failed first-load errors
preserve original exceptions and restore wrappers; relative outside config reads
make zero underlying body calls; inside relative reads forward unchanged and
correctly mark the journal incomplete; outside base/build-info/config paths
create zero hosts/programs; late cwd change refuses; unsupported raw observations
remain incomplete with all authority flags false. Exact helper code was evaluated
with fake imports only. No real TypeScript API/compiler/native/model/CI was run.

Conditional use still requires the separately reviewed restrictive process and
profile, fresh actual staged cwd, complete stage/code/runtime currentness checks
before/after, bounded parent supervision and sanitized thrown errors/output.
The helper cannot approve an unreviewed launch harness. Actual API config and
createProgram discovery do run when invoked; wording about no compiler execution
must mean no verification/typecheck command, not absence of API execution. The
fixed option list is not a universal options policy; physical read confinement,
loader bypasses, full query arguments, CLI/API equivalence, namespace completeness,
stable execution and recipient comparison remain unresolved. Every native-view,
namespace/sealed/reuse flag remains false; origin containment remains unchanged.


## Fixed discovery profile and child frontend

Source-only GO for f792377a77995212f1d8df4ae7942cea64a2866a profile
SHAd5612d19e85c5f494ded5e96d0faa2d397d8c7f192dd4b35d3a70c07f3bba901
and fixed frontend
SHA1847883993965ddf88448110556e7e73dd618c5467fce9ac45951ea1d31ceeed.
The probe comment clarificationSHA367d8f0953aec6d7486e0faa351439c5401a525a44a3765c607955019198c896
changes no mechanism: API discovery is not a verification command.

The constructor retains the previously reviewed platform/principal/Node/whole
TS package admission and base SBPL restrictions, adding only eight exact local
code-body literals and ancestor metadata. No repository subpath, arbitrary
loader, new write/network/fork scope or native-agent permission is added. Leaves
are canonical owned single-link non-special/group-or-other-write files, bound by
before/open/after descriptor and named fingerprints/content hashes. These are
local snapshots, not an ongoing immutable-code or hostile-writer confinement
certificate. Whole selected code/ancestry/current approved bindings must still
be independently checked before and after any supervised actual child.

Three authored fake controls passed3/3 in51.72ms. Seven own VM controls passed
7/7 in91.97ms: descriptor/named replacement refusal closes the held FD; unsafe
code opens zero bodies; added grants are exactly eight literals plus metadata;
fixed entry accepts one script data argument; extra argv/preloads/wrong platform,
version or stage basename call no API; missing frontend entry emits zero frames;
exceptions and oversized observations emit only fixed UNKNOWN without values.
No actual profile construction, child/TS API, native policy, compiler/model/CI
operation ran; filesystems, process and probe imports in these controls are fakes.

Missing output cannot become success from a zero process status: parent
classification must remain NONE/UNKNOWN. The child scope remains observations
only, native-agent NOT_TESTED and compiler-verification/sealed/reuse false.
The reported real script identifier test:types is rejected by the old probe's
script regex before API load. No actual attempt is authorized from this review
until its minimal data-identifier successor and the exact bounded/currentness/
parser/publication parent have been reviewed. Colon is potentially safe as
structured script lookup data; it must not introduce a shell/npm invocation.


Source-only successor GO a3bbad5a9bb5fe2cfca25929ccbd7f598663692d changes ONLY
the bounded ASCII script metadata regex to admit colon. A's pre-comment-merge
helperSHA7d944cf05daf62dd97de770e4e4004a09262392e1d27514a110d62eb3bd528d6
is separately identified from root's prior comment clarification. Independently
25/25 fake controls passed191.91ms, including actual selected test:types and14
unsafe/non-scalar/oversized names refused before admission/load. The script is
structured lookup data only: directProject still requires exact tsc --noEmit
and absent pre/post hooks, with no shell/npm/extra command route. Every other
probe guard and all false-authority contracts remain unchanged. This closes the
static identifier mismatch, not the pending exact parent-launch review.


## First fixed API-observation parent: strict-schema blocker

NO-GO for private fixed parent
SHA98f0c607eb10a02fe3457a3df9d62b3348bf1c54c93ea124d4f5394cd0e6c0d8
before any actual API dispatch. Its partial apiValid predicate does not validate
the exact child/observation/journal schemas, then retains the observation wholesale.
Independent injected VM controls reproduced three invalid inputs classified as
STAGED_API_OBSERVATIONS_COLLECTED_NOT_SEALED: missing journal structure/frames;
extra private-canary payload fields persisted; contradictory or malformed
observationStatus/loggingComplete/frames/callsObserved. This is a preparatory
parser/privacy defect, not an actual leak or accepted reusable certificate.

Seven controls passed7/7 in63.75ms, including those three defect reproductions.
The other controls confirmed missing/BOM/duplicate-key output remains UNKNOWN
without observations, broken/reverse/final clocks remain UNKNOWN, currentness/
close/readback uncertainty cannot acknowledge collection, and valid SIGBUS with
positive PID preserves reaping separately from UNKNOWN outcome. The first local
mock run failed before controls because the test import used an extra parent
segment; that preparation failure is retained separately from corrected results.
No real filesystem fixture, child, API/compiler/native/model or CI operation ran.

Required repair: validate exact publisher keys/types/static enums/counts/hashes/
relative paths and frame structure, or retain only a strictly validated bounded
projection; no unvalidated observation value may be retained on failure. Missing
structure must remain NONE/UNKNOWN. Keep 30s latched parent deadline,8MiB caps,
whole stage/code/Node/config/parent checks, finite status/signals, positive-PID
reaping and exclusive held-FD/readback/final-outer-ACK publication unchanged.
The apiDispatchAttempts truthfield also currently updates after spawnSync returns;
if it counts attempted calls, it must update before the call so a thrown spawn
cannot be reported as zero attempts. No authority or timeout increase is needed.


## Strict observation projection and repaired fixed parent

Source GO979dcd74021e5648b974cd064db57fb001257157,
validatorSHAb2c42a3d14b858b69d38b7440d8d739a9a050547999741094c062e0d1c1fd776.
The reader creates a new frozen projection only after exact nested object/array
schemas, bounded canonical paths/hashes/counts, finite phases/methods/typed
summaries/errors/reasons and consistent logging/status/sequence assertions.
Extra fields/getters/symbols/functions/custom arrays cannot survive projection.
Unknown filesystem methods refuse the whole payload even if explicitly incomplete.
All authority markers are fixed false/NOT_ESTABLISHED. Bounded duplicate-key and
fatal UTF-8 parsing remains a separate mandatory parent step. A valid zero-call
snapshot explicitly means zero forwarded observations, not execution completeness.
Thirty-four authored pure controls passed34/34 in115.43ms; eight own countercontrols
passed8/8 in53.43ms, including every prior98f malformed/private-payload defect.

The first strict parentSHAcabea2a9b5ba06fbac9485a0d6735bbdcf188befc6076b084cfd0dbc72bdb23d
correctly bound the validator and retained only its validated observation. One
truthfield ordering defect remained: apiDispatchAttempts was set before evaluating
remaining() in spawn options, so budget expiry could report one attempt without
a call. Eight VM controls passed8/8 in65.25ms including that defect reproduction.
A first live-file archive had already copied its7b successor, making the old-defect
assertion fail; that preparation failure is preserved. Reconstructed old bytes
were independently hash-verified equal to cabea before the old controls ran.

GO exact fixed parent
SHA7b0d24fb648c7a8535fe9ddd2ffc547149285d15e600093e9f58b57ca9d7c7f1
for one fixed bounded read-only API engineering attempt, subject to its actual
current preconditions. It samples remaining budget before latching the actual
call attempt, then invokes the same fixed sandbox child. Eight independent VM
controls passed8/8 in62.47ms: invalid/missing/extra child data is UNKNOWN with no
retained observation; before-call expiry yields zero attempts; thrown call retains
one; broken/reverse/final clocks, immutable-binding changes and close/readback
uncertainty remain UNKNOWN. The child output/parser and private record caps remain
8MiB and total budget30s. Whole stage/code/Node/config/parent before/after guards,
positive-PID/finite status+signals, held exclusive descriptor readback and pending
record requiring final outer ACK remain intact. Validator/code pins are checked
before dispatch and currency after; no raw invalid payload or error value is saved.

All review controls used injected fake filesystem/process/profile operations and
actual public data parsers only. No real child, TS API/compiler, native policy,
model or CI operation was run by the reviewer. The selected route can collect
scoped API observations; it cannot establish CLI equivalence, complete namespace,
stable execution, a native-agent seal, reusable receipt or origin authority.
The prior98f NO-GO and all other historical UNKNOWN outcomes remain preserved.


## Actual strict API attempt and finite reason-channel followup

Independently checked actual strict7b saved record
SHA060afe2cfc0dcc6efaa706612f0b271c2ecf7c33a3023a59ac75288e15d633dd
and paired outerSHA59a02fba866d217022caee2468c32a3611ba66a25055438085cdbf004bebfb61:
both owned regular0600/single-link, matching saved-record hash, UNKNOWN,
11559.126083ms, one dispatch, child74/no signal/reaped,198 stdout bytes/zero
stderr, all12 equality booleans true, no API observation. Verification/model
counts zero, sealed/reuse false. Pending saved record requires the paired outer
ACK; exact cause and failure phase are not inferred from output length or exit74.
No new API/compiler operation was performed by the reviewer to inspect this result.

GO for reason-only child9f3c856731f17329dea51fadf4ad1d2f2317127c,
SHA9ad490d8b86a7411f5bde9c6ef8373c484776c6eb539e70326da1ea7a4e983b2,
and exact fixed reason parent
SHA4404cadb172e487eecf14b6df7ed2717acf88674a6f01b97ac15484fef1d6d46
for one changed bounded engineering diagnostic, subject to unchanged current
preconditions. Child failure emits only an own-data code in a finite whitelist,
otherwise a fixed unavailable reason; messages/paths/body/environment values
never cross that channel. Parent accepts only exact seven-field failure shape,
fixed false markers and known enums, keeps outcome UNKNOWN/no API observation,
and retains stdout digest rather than raw failure data. Success-shaped observations
still require the reviewed strict projection. New file stem preserves prior outputs.

Six authored fake child controls passed6/6 in73.39ms;13 independent parent VM
controls passed13/13 in71.73ms, including previous parser/clock/currentness/reap/
close/readback cases plus finite failures, private extras, authority/scope/status
changes, duplicate keys and invalid UTF-8. No real child, API/compiler/native/model
or CI operation ran in this review. Profile, grants, environment,30s deadline,
8MiB bounds, pre/post bindings and held-FD/final-ACK publication are unchanged.

This channel does not guarantee a cause: lower-case directProject codes and
uncoded shared traversal errors still become generic unavailable. Parent preflight
success is not proof of child admission or first failure phase. A sanitized code
under uncertain currentness remains reported child data, never collection or
namespace/seal/reuse qualification. The first actual UNKNOWN remains unchanged.


## Actual reason capture: competing collection budgets

Independently verified actual fixed reason saved record
SHA11a4d5587098af3a690bac225402226b9f5ab6afb9c272867cd45172bb1dcf74
and outerSHAcbadc5bb000407bcd82a87d14781556f7e854db43148242b05ffc8af4e9dd6af:
owned regular0600/single-link, matching saved-record acknowledgement, UNKNOWN,
11021.713667ms, child74/no signal/reaped,190 stdout bytes/zero stderr, all12
comparison booleans true, no retained observation, zero verification/model counts,
sealed/reuse false. The accepted finite child reason is SEALED_PROBE_SUMMARY_LIMIT.
The original strict7b UNKNOWN is preserved without assigning it this later reason.

Source inspection identifies a collection-boundary problem: the journal permits
nearly8MiB, while the probe must put that journal plus graph/config names and
header under the same8MiB response cap. The known reason selects a summary-limit
branch; it does not prove a failed verification/typecheck, whole graph/alias
validation or namespace completeness. No verification command ran in this API
route. The actual reason says nothing about uncollected private frames or values.

Conceptual GO for reducing only the journal's retained-byte budget to4MiB, while
forwarding all original calls unchanged, counting calls and preserving explicit
JOURNAL_LIMIT/loggingComplete false on omitted frames. Response/frame/value/hash/
file limits,30s parent deadline and all false-authority contracts must remain
unchanged. This is bounded partial logging, not reduced compiler validation or
complete-query evidence. Exact frozen source/tests and changed parent code pins
still require review before an actual followup. Reviewer performed scoped record
reads/source inspection only, with no API/compiler/native/model/CI execution.


## Reduced journal retention: exact bounded followup

GO a750e3995287ce1bd631462064b9999ba8d58592 plus fake old-budget regression
9a9a28dc5cc8033fc7ffaf285c6f96ac96098012 for the reduced logger source
SHA81adf1b91765efcf62b36a1c66389a5f2387c0a6246cac43126312cd9c638a06.
Only journalBytes8-to-4MiB and its explanatory comment change. Every call still
forwards unchanged; frame/value/hash/count/path limits and all graph validation
remain intact. Omitted retained frames set JOURNAL_LIMIT/loggingComplete false.
This is deliberately partial observation retention, never complete-query proof.

Exact fixed budget parent
SHA8f26b2bd3a83404b69811d9cab384863d67e8280571c13f85f9b2d7ea30997b3
rebinds the new journal pin/new result stem and adds only finite apiValidation
classification: STRICT_OBSERVATIONS, STRICT_FAILURE, SEALED_OBSERVATION_SCHEMA,
SEALED_OBSERVATION_SIZE or INVALID_RESPONSE. It does not retain rejected child
values or raw error data. Response and persistence caps stay8MiB; parent deadline
stays30s; environment/grants/code-stage-runtime guards/reaping/held-FD/final ACK
remain unchanged. Subject to those current preconditions, GO for one changed
bounded API engineering diagnostic, with no seal/reuse/native-agent authority.

Independently86 affected authored fake controls passed86/86 in378.29ms. The exact
old8/new4 countercase forwards identical2500 calls and1800 graph names; old
collection throws SUMMARY_LIMIT, new collection fits8MiB while remaining
INCOMPLETE/JOURNAL_LIMIT/all false. Fourteen own parent VM controls passed14/14
in76.49ms: strict payload refusal, finite validation reasons, unchanged clocks,
context/currentness, failed-spawn counts, finite reaping and uncertain publication.
No actual API/compiler/native/process/model/CI operation ran in this review.
The older summary-limit UNKNOWN remains preserved; this source review makes no
claim about the next actual outcome or complete discovery/namespace equivalence.


## Actual schema refusal and explicitly omitted unsupported frames

Independently verified actual8f budget saved record
SHA9814ad4f9552b9ac6dcb03e71f2ef35347f211e1569ea682015aef022997e7c5
and paired outerSHAdeca6454fc02e001007777d17596d956e5ce3cb6057f1920d92cbc71d3c24dbc:
owned regular0600/single-link, matching record acknowledgement, UNKNOWN,
11151.502667ms, child74/no signal/reaped,4237872 stdout bytes/zero stderr,
SEALED_OBSERVATION_SCHEMA, no retained observation, all12 comparison booleans
true, zero verification/model counts, sealed/reuse false. Prior summary-limit
and generic UNKNOWN attempts remain preserved without assigning them this reason.

Read-only pinned Node22.13 builtin fs source inspection independently confirmed
Buffer-path openSync at446 and closeSync at481. Local reviewed official TS5.5.2
source8673 calls readFileSync without an encoding, taking the Buffer path. The
old journal could serialize an unreviewed close-shaped frame while the strict
reader correctly refused it. This supports a concrete source-led compatibility
repair; rejected whole-output reason alone does not identify the exact actual
frame, running phase or deep cause. No reviewer Buffer-file or TS/API trial ran.

GO69c47572b1f260ec921151a59a3de173bce95dc2,
journalSHA4b1542835a76cd46c6b50636c5d0d7146abeff0dd65e7560a7c679a117f592d1.
Unsupported calls still forward/count and preserve original results, errors and
constructor behavior; only unreviewed frame shapes are omitted. UNSUPPORTED_METHOD
irreversibly sets logging incomplete; sequence/count gaps remain explicit. No
reader enum is expanded, underlying call or compiler validation skipped, or
complete query/loader/namespace claim introduced. Injected unknown frames still
refuse the entire payload. Retained observations are intentionally partial.

GO exact fixed repin parent
SHAa84a80dd6de4afe9e13a8a80752ce9ac9007ffa575d89bab76cd90aefa7559bc
for one changed bounded engineering attempt, subject to existing current
preconditions. Diff changes exactly the journal pin and result stem; profile,
grants,30s/8MiB caps, before/after stage/code/runtime guards, reaping and exclusive
held-FD/final ACK publication are unchanged. The mechanism remains nonauthoritative.

Eighty-seven affected authored fake controls passed87/87 in377.09ms. Eighteen
own/reused VM/fake controls passed18/18 in71.44ms, including nested fake Buffer
read with all four calls preserved and only reviewed frames, exact unsupported
error/constructor forwarding, injected unknown-frame refusal and prior strict
parent/budget/currentness/persistence controls. No actual API/compiler, native
policy/agent/experimental collector, model or CI operation ran in this review.
This GO is a materially changed diagnostic repair; it does not authorize repeated
unchanged attempts or turn any past UNKNOWN into completeness or reuse proof.


## Actual staged API observations collected: engineering slice only

Independently verified actuala84 saved
SHA95c3be736476d67a66e3d217c07ca6316a54ff5c993d3104359b6add60011289
and outerSHA5608b977cf79a71797280cb38326219a41d591bfde42b922c4a69e83f5ec5ac6:
owned regular0600/single-link, matching saved-record ACK, narrow
STAGED_API_OBSERVATIONS_COLLECTED_NOT_SEALED,12189.040833ms, child74/no signal/
reaped, one dispatch, zero verification/model counts and all12 equality checks
true. Independent strict parsing/projection of the child-observation shape passed.
An initial review applied the integer-only portable parser to the WHOLE local
report and correctly rejected fractional elapsedMs; that review-preparation error
is preserved. The corrected review parsed hash-verified generated report JSON and
strictly validated only its portable child-observation shape; no API trial ran.

Aggregate counts independently agree:914 graph files (425 source,59 default TS
libraries,429 other installed,1 other),1 config,39489 observed calls and14218
retained frames. Logging is incomplete with FRAME_LIMIT,JOURNAL_LIMIT,
UNSUPPORTED_FUNCTION_METADATA and UNSUPPORTED_METHOD. The retained frames contain
388 outside raw EPERM denials and zero outside raw readFileSync frames. This says
only what was retained; partial frames cannot prove all outside reads/denials or
Node-loader coverage. Probe readFile body guards remain present but do not replace
an independently enforced filesystem boundary. Detailed frames remain private.

The engineering collection slice is closed, not namespace/CLI equivalence,
stable sealed execution, reusable receipt or origin authority. Verification was
not run; native-agent enforcement remains NOT_TESTED and namespace/sealed/reuse
false. All previous UNKNOWN results and their distinct diagnostics are preserved.
No real API/compiler/native/model/CI operation was performed by the reviewer.


## Disabled native composition and UTF-8 mapper source

Source-only GO7a710d086a7eb299f012ec78cf3e5dc6c508bc59,
compositionSHA845216c599caa423ca595a021d8da6a6c0049e44a7261e328d12924f164d0124.
The proposal always exposes commands[]; its two routes remain proposed data only.
Whole-parent destructive assertions are deferred until an authoritative bounded
fresh synthetic-only inventory, rather than a caller freshness label or digest.
Existing prepared stages/state/receipts must remain untouched. Caller hash values
are local references, not verified runtime/settings/artifact authority. Missing
case/symlink-parent/atomic-exchange/mapping checks stay explicit; readonly mapping
errors remain descriptor constraints, not independent sandbox denial proof.

Source-only GOfcf2b16cae94d46687b3d9cf7cb135c62f951df2,
mapperSHA14ed107ff8e48e539c172c49aee88830f44eac0d037463d97b45fc54d8e3b070.
The fixed baked path predicate now admits bounded well-formed UTF-8, rejecting
C0/DEL/C1 controls, overlong encodings, surrogates, out-of-range scalars, truncated
or invalid continuations before indexing. Existing4096-byte/component/placeholder/
colon/backslash checks, stronger O_NOFOLLOW_ANY guards, equal principals,
single-link marker identities, immutable failure latches and false-authority
protocol remain unchanged. It does not normalize Unicode or establish physical
path/case/firmlink equivalence, which still needs actual local bindings.

Independently7 composition pure controls and14 mapper source/finite-Boolean
controls passed21/21 in55.24ms. Five own composer countercontrols passed5/5
in49.89ms: roundtrip/plausible hashes never mint routes, freshness/activation/symbol
claims and getters refuse, caller mutation cannot alter frozen paths, preservation
and missing obligations remain explicit. No C compilation/ABI/syscall/native/
checker/compiler/model/CI execution occurred in this review. Routine owned
render/build may proceed under standing authority; actual native use still requires
independent exact rendered source/binary/resources/effective-profile review.

Composition's historical45da template pin and UTF8_NOT_ADMITTED label must be
transparently rebound before any use; source review is not an observed match.
A parent rename-only test also cannot establish protection against base/ancestor
replacement or alias access. Moving an ancestor can relocate a pathname-protected
child; endpoint identities alone cannot rule out replacement-and-restore. Treat
that future seal obligation as unobserved, with no scope expansion or existing
real-stage destruction. Current origin containment and all seal/reuse gates remain.


## Pinned native187 recipe read-view design: one layer, qualified scope

Read-only inspected only the selected public native binary, freshly matching
SHAa59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3.
No auth store, account/tool/model/native process or settings write occurred.
Schema194692298 and198229227 support allowRead reallow within denyRead regions;
HLt198249244 converts settings to filesystem/credential rules. L2i198215087 and
B0d198215347 merge declared credential file denies into denyOnly before reallows.

The source-supported minimum for a new bounded recipe is a tightened SINGLE
native profile: retain every existing credential/config/read/write denial, env
scrub, strict no-unsandboxed/no-exclusions policy, exact reviewed Bash admission,
hook/plugin/MCP controls, network/socket restrictions and budgets. Add root
read denial and reallow only the current canonical physically disjoint staged
tree, exact Node/resolved shell/fixed public code files and reviewed OS-runtime/
device startup paths. Do not reallow root, home, the whole recipient base,
credential/config regions, wildcard paths or unreviewed libraries. New allows
must be rejected for any credential overlap through lexical/physical/case/firmlink
aliases; no overlapping reallow should be justified solely by precedence.
This is proposed narrowing under D12, not an applied profile or observed seal.

v0d198193837 emits an explicit literal-root startup exception and globally permits
DIRECTORY metadata when reads are denied. Literal credential denies strictly
beneath a broader allow are reemitted; equal/narrower reallows are not equivalently
protected. Current official documentation describes newer path-specific/glob
precedence; it cannot replace this pinned implementation proof.
[Current sandbox documentation](https://code.claude.com/docs/en/sandboxing)
The source also emits proper-parent literal unlink/create guards through
m2i198193137/w0d198195039 after write-root rules. The prior ancestor test obligation
therefore must not be read as a claim that SRT implements no ancestor protection.
Actual alias/parent rename/exchange/hardlink/mapping protection is still unobserved.

Native read view is not the engineering SBPL view: global directory metadata and
OS-runtime body allowances remain observable. Fresh compiler/API/caller capture
must use the EXACT actual native view, retain DENIED separately from MISSING,
and refuse unsupported outside-input/namespace cases; do not reuse engineering
absence facts or infer no ancestor resolution simply from write-protected stage.
Default-library/ancestor and CLI/API/loader query completeness remain unresolved.

No supported nested-macOS route was established. Installed Apple SDK27
usr/include/sandbox.h24-27 documents that sandbox_init returns an error if already
sandboxed. Pinned W2i198217409 passes weakerNested only to Linux, not the macOS
f2i198203163 branch. Do not presume that a second sandbox-exec inside native Bash
will enforce the engineering profile, nor change strict policy to bypass that
problem. The narrow single native profile is the existing supported mechanism;
empirical nonsecret native boundary tests/currentness still precede any seal.

Six independent pure controls evaluated only exact selected source generators
with literal mock paths/no filesystem expansion and passed6/6 in42.99ms: default
broad reads, credential merging, root-deny/narrow reallow structure, global directory
metadata, equal/narrow reallow risk and proper ancestor write guards. This proves
source structure only, not SBPL/kernel or actual native enforcement. An initial
Python extraction typo failed parsing before any source read; preserved as review
preparation history. All model/receipt/origin/seal/reuse gates remain unchanged.


## Fresh synthetic fixture mechanics and current mapper references

Source-only GOde2fcd118bd46fbc2eaf6bfa8d001996c3c21944,
helperSHA26543512af07e9d7ed27ba25c9b863b2664898cd2b8f4b9986359f1f07ff41dd.
Zero-argument fixed bootstrap admits only canonical root-owned sticky01777
/private/tmp with nonwritable canonical root ancestry, nonroot matched real/effective
principals and one atomic owned0700 random base. It never retries/adopts a collision.
Same-process private WeakMap token is consumed before work. Reserved synthetic
stage parent/replacement destination/workspace must be absent; unrelated host
assets outside the three exact synthetic inventories are neither opened nor
listed. Bounded64-entry inventories, eight known nonsecret marker bodies,
single-link unique inodes, modes/UID/readback/physical snapshots and proper parents
are rechecked; failure/close/mutation uncertainty permanently latches UNKNOWN.
Partial owned namespaces are retained, not recursively removed or relabeled fresh.

Ten independent exact-source memory-filesystem controls passed10/10 in51.52ms:
fresh mint/verification, serialized fake-token zero operations, collision no adopt,
reserved namespace preservation, unrelated host assets no open/list, single use,
mutation-and-restoration cannot revive, inode replacement/extra entry/close errors,
invalid principal/root ancestry zero creation and extra callback/path option refusal.
Reviewer did not call the actual /private/tmp bootstrap or local preparer and did
not run the author's real owned-filesystem suites. This remains explicitly trusted/
quiescent setup, not atomic confinement against hostile ancestor swaps. Owned
handle closure is distinct from global inherited-RW absence; native policy,
sealed/reuse and actual CI authority remain unverified/false. Actual native or
destructive use still requires independent current resource/profile review.

Source-only GO52415330ab27b8a871bcdea628258d3e98a2e175,
compositionSHAd23f186b95601e79071bfe187a3edea64109cf96b84a9d42c354e802d27a8925.
It only replaces the historical mapper reference with reviewed UTF8 source14ed...
and the stale UTF8 label with rendered-binary/physical-currency NOT_VERIFIED.
Seven pure controls passed7/7 in50.88ms. Commands[]/deferred parent destruction,
all false authority, preservation and missing assertion obligations remain intact.
No mapper build/native/compiler/model/CI or credential/settings operation occurred.

## Disabled closed-read canary profiles

Source-only GO for 07368be896baa988fc2d003944ad71b40ab5c70c,
helper SHA442ec6579a90a8c910cb7ff4e5acae8f2f5f588add879b7c39ed8b82c3eef9c7.
Its seven fixed reads include the two exact nonsecret workspace control bodies;
it does not reallow the checkout or broad OS library directories. Three author
controls plus four independent pure controls passed7/7 in50.89ms. The proposed
root denial retains original credential/env/network/strict restrictions, removes
all command allows and remains disabled with no seal, namespace or reuse claim.

Source-only GO for successor7c93f3393f7f6864ef61e9171a53306e7882ea13,
helper SHAd171a31ea942d81f7f93134a26f73bf0b1ccb826edf9bcb878debd82f3397f3d.
Inventory reads now cover exactly sealed-inputs and the nonsecret canary directory,
plus five fixed executable/code leaves including the proposed exchange helper.
Native187 allowRead applies subpath semantics; this requires an independently
minted fresh synthetic-only inventory before any use. It must never be applied
to the real prepared stage or an existing host namespace. Commands[] and all
authority flags remain empty/false; the future compiler read view is separate.
Three author and four independent exact-source pure controls passed7/7 in51.07ms,
checking inherited restrictions, exact read roots/no checkout grant, unsupported
caller authority options and deep freezing. No settings or native operation ran.

The existing portableRuntimeInspection identity checks are not a minimal startup
access specification. They inspect Node/helper, default OpenSSL config, three
readable system libraries and the complete shared-cache members after startup;
they do not enumerate every dyld/Bash/Node kernel read needed before execution.
These paths are review candidates, not permission grants or an exhaustive closed
read view. Root-inode/global directory metadata exceptions also do not establish
body-read closure. OS startup remains explicitly unresolved; no broad OS-library
reallow, nested sandbox assumption or source-only native seal follows from this GO.

## TypeScript 5.5.2 graph traversal does not close CLI discovery

Fresh component hashes matched the reviewed public package: tsc.js
390875cd26ab0e496c55804c26c93adab850c0b48573a14967bc479538179c73 and typescript.js
99443f51ec16c0744880ee28b500544b88479a95b14d996f7e874a2ac54ca201.
The shared compilerProgramFiles returns createProgram(...).getSourceFiles();
it does not request diagnostics. CLI performCompilation (tsc.js128903) creates
the program then calls emitFilesAndReportErrorsAndGetExitStatus. Its diagnostic
pipeline125389-125426 requests syntactic/options/global/semantic diagnostics and
emit even for the noEmit recipe. Lazy checker120014 and semantic path120130-120153
then check source elements through getDiagnosticsWorker84116/checkSourceFileWorker84043.

A concrete extra-question path exists in semantic import checking, without a
compiler trial: checkImportDeclaration83364 calls resolveExternalModuleName for
named imports. resolveExternalModule47991, unresolved Node16/NodeNext ESNext
extensionless relative-import branch48156-48158, probes suggestedExtensions with
host.fileExists, e.g. ./missing.mts then ./missing.ts. Graph resolver39903 does
not add implicit extensions in EsmMode; extensionless candidate39915 returns
without those suffix questions. The checker uses program.fileExists119356 and
its original-host forwarding122069. CLI cache118399 can reuse previous questions
but does not establish that these diagnostic-only candidates were previously asked.
Equivalent API locations are loadModuleFromFile44435 and checker branch52922.

Four independent pure controls evaluated only the exact extracted resolver and
diagnostic expression with fake functions, not a loaded TypeScript API: ESM skip,
non-ESM suffix lookup, post-graph diagnostic suffix lookup and nine missing
candidates. They passed4/4 in46.90ms. This disproves generic graph-question
completeness; it does not show that the actual debugger successful noEmit run
took this branch, establish an exhaustive diagnostic read set, or demonstrate
any released/wrapped falseCURRENT. Existing partial journal and all false
CLI/API/namespace/seal/reuse claims remain unchanged. No actual compiler ran.

A full protected materialized namespace can conservatively cover deferred
in-tree bodies and membership only if it includes every entry, empty directory,
negative fact and modeled link/topology under the actual compiler read view.
File hashes or the API graph alone are insufficient. Native187 global directory
metadata permits ambient outside answers, and exact allowed runtime/public code
bodies are additional readable locations. Denied reads may affect TypeScript
semantics and cannot be relabeled missing or irrelevant. Whole snapshot coverage
therefore still needs actual closed-view/recipe and interval enforcement;
historical source provenance never becomes fresh live-checkout equivalence.

## Fixed synthetic case and parent-symlink assertions

Source/mock-only GO6f4276303379adffb0cbdb11ffe7a9147ef377b5,
sentinel SHAd206de2e8fa469768aecec6e7bf276a935a0071c470aa5b1ad053de6dd649671.
Case-spelled parent/stage/leaf must match the original physical fingerprints;
directory symlinks or missing spellings do not establish a case alias and launch
no case write. Workspace symlink creation is a positive construction control:
EPERM/EACCES there is UNKNOWN, and the unperformed protected alias write is never
claimed denied. The fixed alias readlink/owner/linkcount/target physical checks
precede writing; successful protected writes remain FAIL despite close/final
audit uncertainty. Known mismatches are failures and missing observations unknown.
Benign workspace timestamp updates retain identity checks, and final alias
replacement/target changes are checked without opening unrelated body paths.

The exact source plus its 50 pure/injected-filesystem controls passed50/50 in73.77ms
on pinned Node22.13. Reviewer did not render/start the sentinel or exercise real
filesystem mutations. MAP_SHARED and true atomic parent/base exchange remain
explicitly NOT_IMPLEMENTED, so nominal implemented denials still yield UNKNOWN.
This source GO authorizes no native command, real-stage destruction or seal;
fresh synthetic inventory, rendered code/resource bindings and actual native
read/write enforcement remain separate prerequisites. Sequential rename is not
an atomic-exchange substitute, and endpoint fingerprints are not interval proof.

## Atomic-exchange source review and preserved classification defects

772e907356d0c5378545521c555790c7fe385889 remained NO-GO for the C diagnostic.
Its identities_at compared expected identities only when both directory reads
were MATCH: a known wrong left inode plus unavailable right metadata became
UNKNOWN. Main also withheld every expected-directory comparison when an
unrelated fixture observation was unavailable. Protected exchange grants already
latched FAIL independently; the defect concerned known preservation mismatches.
Successor9bd4652f2fb621fec46e11f59cbf4d540959eebc repaired those two gates by
classifying each successfully captured directory before merging other uncertainty.

9bd remained NO-GO pending the same finite correction in marker_file: a valid
named baseline followed by unavailable first fstat and a successful mismatching
post-fstat still skips comparison under before_known. A successful post-fstat
must be compared independently with named, and with before when available;
known mismatch must outrank read/close uncertainty. Countercases are source/pure
Boolean checks, not C syscall tests. The preserved772 author8 plus memory10
controls passed18/18 in57.03ms despite the gap. Successor10 source contracts,
13 independent memory-fixture controls and3 countercase controls passed26/26
in61.31ms, explicitly reproducing the remaining unsafe classification condition.

The fixture namespace addition itself passed source/memory review: exactly three
new owned synthetic directories, each with one fixed nonsecret identity marker;
all eleven markers remain independently single-link, bounded and privately minted.
Extra entry/duplicate inode/incomplete alias groups latch UNKNOWN; restoration
does not revive the token. No actual /private/tmp bootstrap or owned filesystem
fixture was run. These data-only mechanics do not grant a C/native route.

The fixed argc1 source uses renameatx_np with SWAP|NOFOLLOW_ANY for the workspace
positive control and restore, then the protected parent/exact workspace partner.
Both are directories on the observed same device; no base/sibling exchange or
sequential rename substitute exists. Local SDK27 sys/stdio.h defines flags0x2
and0x10/macOS10.12 availability. Pinned [Apple XNU12377.1.9 source](https://raw.githubusercontent.com/apple-oss-distributions/xnu/xnu-12377.1.9/bsd/vfs/vfs_syscalls.c)
8929-8941 applies no-follow-any to both lookups, and9658-9668 accepts that flag
combination. This establishes source feasibility, not current kernel/filesystem
support or actual native enforcement. Only EPERM/EACCES can qualify the operation
denial; unsupported/EXDEV/missing remain UNKNOWN. There is no automatic repair
of a granted protected exchange: FAIL stays latched and all fresh synthetic
resources must be retained. Fixed bounded inventories/marker readback require
the separately reviewed synthetic-only directory body scope. Global result
remains FAIL|UNKNOWN, with base exchange/native/seal/reuse unestablished.

Source-only GO for the coherent772+9bd+fd46ead5311ba606c51f04d2cbafdf640e22676b
successor, C SHA507dc2fb45adb9d7df293eccf18874fbfb101d4b25f2ace932899be6f2198d72.
Each successful post-fstat now compares independently against the known named
marker baseline, then the first descriptor baseline when available. Known
wrong metadata survives unavailable first stat and close uncertainty; unavailable
alone is never invented mismatch. Independently captured directory checks and
the irreversible protected-grant latch remain intact. Eleven source/pure author
controls, thirteen independent memory-fixture controls and four independent
source/Boolean countercase controls passed28/28 in67.00ms. The countercases retain
both predecessor masking conditions and exhaust the final failure predicate;
they do not execute C or establish ABI/syscall semantics. An initial reviewer
whitelist omitted the uppercase MISMATCH constant and refused evaluation
(27PASS/1review-fixture failure); corrected test-only whitelist/source unchanged.

No C render/build/native/real bootstrap/agent/compiler/model/CI operation occurred.
Only the synthetic workspace positive control is restored. A granted protected
exchange remains FAIL and is retained for diagnosis; parent must never treat
that failed synthetic tree as preserved/fresh or use the real prepared tree.
Intentional workspace-control timestamp changes also cannot silently revive the
preparer's full-fingerprint WeakMap currentness token: any future outer collector
must distinguish permitted-control changes from protected stage preservation,
and an UNKNOWN private token is still irreversibly unknown. Exact rendered
binary/resource currency, fresh inventory, closed native policy/route and bounded
parent supervision remain independent prerequisites before an actual fixture.
