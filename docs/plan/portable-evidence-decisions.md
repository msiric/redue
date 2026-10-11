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

## D4 — Owner-approved demonstration-pair amendment (2026-10-11)

The owner explicitly revises the proposed two-machine demonstration to **Copilot
CLI on producer VM A → native Claude Code on receiver VM B**, using two independent
matched approved standard macOS runner environments. This is the explicit scope
amendment required by Section4.4 when replacing an intended host. Selecting two
models inside Copilot is not two agent products. Codex acceptance remains separate;
this amendment does not label Codex or Claude reuse demonstrated. The owner’s
Mac is not a matching endpoint unless the unchanged profile actually validates.

Existing paid Codex and Claude subscriptions and company Copilot CLI access with
personal use explicitly permitted are approved resources. Additional out-of-plan
spending remains **$0**; provider rate limits and organization policy still apply.
The Copilot built-in GITHUB_TOKEN route requires verified applicable seat/policy/
billing before inference. Native Claude subscription OAuth preparation is approved;
the owner will create/add any required secret only after reviewing the exact
workflow. No token in chat, local-login copying or autonomous credential creation.

Execution requires manually initiated reviewed/pinned code, minimal permissions,
bounded turns/time/concurrency and no untrusted pull-request execution. Credentials
must not enter logs/artifacts or model-readable files. Existing exact checkout/
state/socket and sandbox controls remain. A missing precondition launches no model.
Producer trust is a separate exact local-policy approval; this resource decision
neither accepts an import nor changes applicability. G2 requires actual traces and
G3 requires authenticated accepted artifact use through the recipient engine.

Local read-only native Claude2.1.146 authentication check reports `claude.ai`,
`firstParty`, loggedIn=true and subscriptionType=null. API/bearer/OAuth/provider
switch environment keys checked by presence only were absent. This distinguishes
the observed local route from the prior API-credit error; it does not prove VM
capacity. Workflow version/authentication and in-context preconditions must still
be checked. See [Claude receiver preparation](../contributor/portable-claude-receiver-proposal.md).

## D5 — Exact CI recipient trust/provisioning approval (2026-10-11)

The owner explicitly approved the final data-only recipient workflow SHA-256
`ef237cbb411b0520791911503d3071a9a42f78502ac8f712406a11566482ef78`,
exact registry bytes SHA-256
`5a1021fcf9b119f4469370eb33c09dc35c62cb174bc272574065a382aae6d521`,
and selected required-refresh policy digest
`bab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6`.
Approval covers exclusive provisioning into the workflow's fresh owned VM state,
not normal installations or global producer trust. The policy accepts only the
exact d04b872 origin/artifact from approved signer run38096670987/attempt1;
immutable IDs, workflow/ref/source/signer and outer/inner digests remain bound.

Exact approved bytes are enabled only on dedicated `dev/portable-ci-recipient`,
commit `b2401875c5e8f60b30c2a87f746b21063e7b5f72`, workflow
`.github/workflows/portable-ci-recipient.yml`; initial run38098482463 is queued.
Helper and registry source remain pinned to a23843e; runtime/tarball to d04b872.
No signing changes, models, OIDC, uploaded artifacts, main merge or publication.
Successful execution—not approval—must establish authenticated imported CURRENT.
This does not approve a future Copilot-produced origin or its acceptance policy.

### D5 corrected-pin execution authorization — recorded 2026-10-11 08:00UTC

The owner explicitly approved one attempt of the complete corrected recipient
proposal at892f603, SHA-256
`a600688881452915bde3f63a9dc60d21d952c65a9b4efe3db2c14860976a5d6f`.
Root verified the whole file against both that commit and the retained proposal
before applying it. Exact bytes are enabled only on dev/portable-ci-recipient
`6b901d08708678bc51b8f9f1349555ecc1f5c198`; push launched38123365552 once.
Before push, actual artifact11685889769 was available/expired=false, with matching
archive digest, run/source and expiry2026-10-11 23:56:31UTC. Registry, policy,
runtime, verifier and producer bindings are unchanged. The fresh-state data-only
lane is newly unblocked; actual result remains to be recorded. No model calls,
new signing, upload, expanded trust, main merge or publication is authorized.
Copilot included Actions capacity and native-agent effective-boundary prerequisites
remain independent. The recording time is not an inferred exact approval timestamp.

Actual run38123365552 completed SUCCESS at08:05UTC: required-refresh producer
verified/accepted; independent matched recipientCURRENT/PASS/eligible, no local
invocation/equivalent execution; same origin through unrelated edit/restart and
relevanteditSTALE. Models0. This closes this positive data-only attempt only;
actual agent acceptance and final negative/candidate binding remain separate.
