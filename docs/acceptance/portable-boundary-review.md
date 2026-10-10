# Portable evidence: independent boundary review

Current conclusion: bounded envelope parsing, pure inspection and the initial
separate-store implementation reviewed; origin capture, recipient applicability,
integrated trust/conflict selection and machine/agent gates remain pending.
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
