# Portable evidence decisions — initial implementation

Status: proposed implementation decisions under independent review. These do not
certify G1–G4 or authorize publication. Canonical scope: REDUE-PE-001.

## D1 — Original facts, not reconstructed history

A bounded in-toto statement binds one versioned direct-TypeScript predicate.
Canonical integer-only JSON establishes its semantic digest; the transport's raw
SHA-256 is a separate identity. Decoded duplicate keys, malformed Unicode,
unknown fields, numeric rounding, oversized input and unsafe paths are refused.
Inspection parses data without executing it or retrieving references.

`redue run CHECK --portable` explicitly captures facts inside the existing
observed execution interval. Both boundaries independently inspect the configured
compiler, relevant context, complete observed manifest and compiler filesystem
queries. The final checkpoint includes validation work. Change-and-restore,
missing boundaries and interrupted invocation cannot produce complete portable
origin evidence. Immutable local records are unchanged; old records without
capture export as inspection-only. Export checks exact ownership and selection
before reading, during preview and after durable output publication.

Rejected: filling old facts at export time, producer-selected inputs, source
commit as materialized-input identity, copying a local observer or state directory.

Tests: portable-envelope, portable-command, portable-boundaries and
portable-relocation. Controlled origin cases use an explicit noLib fixture with
observed global declarations. Default compiler library lookup can ask about
ancestor node_modules outside the observed root; that setup remains refused,
including when its current answers are absent. This fixture is a mechanism test,
not portable acceptance of the debugger project.

## D2 — Recipient establishes applicability

The recipient separately initializes its own configuration/state and observer.
Only the current configured built-in direct probe runs. The producer cannot pick
a validator, command, exclusions or loader. Caller discovery is run in the actual
caller context; its digest must match independently run recipient discovery.
The recipient observes the complete local manifest and completes a continuity
barrier after synchronous discovery. Command/configuration, input membership,
absence queries, reviewed compiler bytes and relevant execution context remain
bound. Both receipt selection and imported-catalog revisions are rechecked at
publication and by the client. Cached status never authorizes imported reuse.

Historical interpretation @1 was deliberately SAME HOST/BOOT only: Darwin arm64,
OS release 25.6.0, Node 22.13.0, physical Node identity, active dyld cache UUID and
physical cache identity, readable loaded-image bytes and verified actual cache
membership for virtual images. The tiny fixed read-only native helper is
byte-verified and independently rebuilt. This is not a two-machine equivalence
rule. Proposed interpretation @2 replaces portable executable physical identity
with exact official Node22.13.0 bytes, complete native-bound dyld base/subcache
contents, fixed readable system-image/helper bytes and reviewed OpenSSL default
configuration (or verified absence). All OPENSSL_ overrides are refused; exact
inert default-template HOME expansion has bounded reviewed semantics. Raw local
executable metadata still guards the original run interval and remains in local
receipts. All other declared caller context remains strict. Unknown image,
compiler, privileged runtime, configuration or incomplete read refuses portability.
Old @1 facts cannot gain the new interpretation; fresh capture is required.

The one writable Cryptex ancestor is accepted only with its exact root-owned,
non-writable canonical OS child native-bound by device/inode and SF_NOUNLINK,
all other ancestors/descendants protected and unchanged. Apple's documented
no-unlink semantics plus trusted nonprivileged OS execution are prerequisites;
this is not a readonly mount or a compromised-root defense. The helper performs
fixed read-only lstat/dyld API calls, never imported paths or commands. Complete
content reads preserve process deadlines; current measured one-shot hash cost is
about6.8s for5.8GB. No performance benefit is implied. This versioned rule still
requires independent review and actual two-machine acceptance before G2.

Paths retain exact case and Unicode composition. Directory/external symlinks are
refused. Ordinary relative npm .bin file shims retain link topology and observed
in-root target contents. Full installed package membership remains an input.
The original npm launcher and unrelated recipes receive no portability exception.

Rejected: stripping absolute hashes globally, OS/version labels as complete
runtime identity, daemon environment as caller authority, hashing only previously
known files, cached green snapshots during failed synchronization.

Tests: portable-facts, portable-relocation, existing receipt and direct-compiler
regressions, plus independent publication/interval fault controls.

## D3 — Explicit local acceptance, conservative selection

Import preserves evidence separately from immutable local outcomes and their
selector. An exact digest may be explicitly accepted for one locally selected
check; first-slice manual acceptance is not signer authentication or global
producer trust. Unaccepted imports cannot poison local evidence. Durable import
markers bind an exact pending transaction; old PASS replay cannot clear an
accepted FAIL or silently rebuild a missing catalog. Ambiguous recovery requires
owner inspection.

Applicable accepted failures and unordered accepted origins withhold passing
reuse. Incomplete origins cannot acquire authority through healthy recipient
observation. A newer local unstable, unavailable or failed selection cannot fall
back to an older imported PASS. A stable stale outcome with independently complete
different facts remains history. Fresh local execution may resolve only the exact
catalog bound at both run boundaries; no timestamp or arrival-order inference.

The CI authentication inspector is preparatory. It binds a locally supplied exact
issuer/repository/workflow/ref/source-and-signer-commit policy to raw artifact and
inner semantic digests using reviewed gh/Sigstore semantics. It grants neither
producer acceptance nor reuse. A real authenticated producer/artifact route and
explicit owner-reviewed policy remain G3 requirements. Required online lookup
does not prove globally latest; explicitly identified offline mode reports its
revocation/catalog limitations.

Rejected: automatic signer trust from imported metadata, signature as proof of
complete execution, wall-clock ordering, TTL authority, replay overwriting local
selection, silently guessing after selector loss.

Tests: portable-store, portable-applicability, portable-ci-trust and independent
portable-boundaries. Fault injections are labelled separately from actual compiler
execution and actual agent behavior.
