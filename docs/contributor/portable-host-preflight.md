# Portable-evidence host preflight

**Current conclusion (2026-10-11): exact d04b872 installed @2 controlled-fixture
export/import and policy ownership checks PASS on one macOS machine. Actual
producer/signing38096670987 succeeds; both full hosted profile prototypes
38096673747 are supported and independently match21 runtime records plus signed
origin facts. Required-refresh authentication passes as inspection only, with
producer_accepted=false/local_policy_current=false/reuse_eligible=false. No actual
recipient CI acceptance, portable agent handoff or matched-machine reuse is yet
established; G2/G3/G4 remain incomplete.**

The frozen signing/installed-mechanics candidate remains d04b872/SHA8695b612… .
A distinct guide-only package was packed once at223f231,80files/158,546bytes,
SHA-256 `b8122c3bdcedf42a374ba3a87681ca7654360bc6c10daa64b5ac93a79ca7b190`.
Its only payload change is the portable user guide; runtime bytes are identical.
Current exact-byte matrix38101767565 and shared regressions38101769601 at05c1d86
both passed. The exact matrix installs b812 on all three platforms; portable
origin/relocation acceptance runs on supported macOS only. Product CI has481tests
each: macOS454PASS/27SKIP, Windows305PASS/176SKIP, Linux22/24 each442PASS/39SKIP,
zero failures/cancellations. Its independent repack is not exact-byte evidence.
The controlled cost completion at223f231 passed on
frozen8695 with truthful ordinary-run PASS/UNVERIFIED after import and restart;
one sample showed no savings and ran no model. See the tracker for actual counts
and costs, not this preflight's existence as proof of behavior.

Frozen exact task candidate source `d04b872ee0e848e300c0cc9738ad761e48146acc`,
SHA-256 `8695b612a5c33dae945b2bc8df57cd68ca3eefb401aa0ef9ca2850d212979ea2`,
not public alpha.10 bytes despite metadata. Installed origin
`473be4ea-cab4-49cd-9405-433af9d8576b`/digest
`1745893830e1da353ebd9bcb5fb92fe2c0e7c374ef86eddd4d8952887c13e30b` is retained
through separate-checkout recipient/unrelated CURRENT with no local recipient
execution; relevant edit STALE. Both-host owned-policy update/removal/edited
refusal passes. Hosted signed origin is separately
`02f44ac7-e6fc-4d5e-9757-28357654fef1`, digest
`5d16fbf6b101f88843f41a8c61d3c351e5f9e600306dc4936eaaec8d6ea40d57`.
Exact-package38096673730 allthreeOS PASS, actual downloaded SHA8695b612… matches
local bytes and CI merge08c7a101… has verified tree889d4404… equal to d04b872.
Product38096673735 allfour jobs PASS; exact counts are in the
[tracker](../plan/portable-evidence-tracker.md), not inherited from other sources.

Owner D4 now approves existing subscription/seat resources and the explicit
Copilot CLI producer VM A → native Claude Code receiver VM B demo pair; Codex
acceptance stays separate. D5 approves the exact original data-only producer trust and provisioning; the
corrected helper-pin proposal still needs its separate approval before a live
accepted recipient. Native authentication/workflow, sandbox/credential enforcement,
capacity proof and in-context expected evidence remain gates.
The disabled [Claude proposal](portable-claude-receiver-proposal.md) records the
observed local claude.ai route, not VM capacity or behavior. No model trial follows
failed setup/preflight. Earlier failed origins and upgrade attempts remain below.

## Historical b4 installed and first hosted preconditions

At that checkpoint the exact tested source was `b4c33b193740d6997daa650eecd5f665d58a3b97`,
`redue-cli-0.1.0-alpha.10.tgz`, SHA-256
`ec4b7cabdc0ad8d41850b947881730dbd2367c00d91a1935fd07c04624767f48`.
These are unreleased candidate bytes, not public alpha.10. The real local producer
recorded origin `7a9a699d-9c7b-4f92-aa05-41e69c447c14`, digest
`996b50d8a2e6c5411bdb37b390403b8793dc02cb1891fb4ea766d292d27b3324`;
only an envelope and manifest traveled (23,246 bytes). A same-boot receiver was
refused, not counted as a second machine. The hosted run `38093305258` reached
local CURRENT/PASS but did not establish complete portable origin; the separate
macOS package run `38093307269` failed at the same completeness requirement.
Causes remain unresolved. No transfer/receiver or model followed the first gate.

[`portable-upgrade-smoke.mjs`](../../test/acceptance/portable-upgrade-smoke.mjs)
tests the actual old `b0cdd5e` @1 tarball against these @2 bytes, rather than editing
an old receipt. It passed same-state stop/start history/config preservation,
obsolete-origin refusal, and old PASS replay after a genuine newer FAIL. Old origin
`b63d4e88-21c0-4530-8d93-53913206c4fa` remained historical PASS and STALE;
selected FAIL `4d0d28cb-70ef-425d-82b2-75bb4719bd84` was unchanged after refusal.
The independently selected policy fixture established imported eligibility with
no recipient execution, then tested published alpha.10 Codex and Claude policy
update, edited-content refusal and removal. User instructions, config and import
bytes remained intact. Final reassessment returned eligible PASS; that observation
is not a promise that arbitrary setup edits preserve CURRENT.

Both upgrade attempts remain recorded locally. Attempt 1 used `--state-dir` for
agent setup and was correctly refused by the published package. Agent file
setup/removal uses only the selected config and refuses machine-local state
embedding. Attempt 2 corrected this fixture invocation and passed. CLI/status/run
operations retained their explicitly selected owned state. No permissions changed,
models ran or receipts were deleted; owned experiment processes/installations were
cleaned. See [acceptance pointers](portable-acceptance-map.md) for the remaining
V01–V22 gaps. Passing mechanics is not behavioral verification.

## Hosted-origin diagnostic record

The two first actual runner failures are distinct and remain failed:

| Run | Observed facts | Unestablished facts |
| --- | --- | --- |
| `38093305258` unsigned machine route | Source `88e8828620c454d69ada41d4593d6105dc2b7d21`; artifact SHA-256 `e10912264aa1a42c29cbdbc2b06fdcb2dd9617226fb23b970fc843e7b1108492`. Producer local status was healthy CURRENT/PASS and reusable. Export preview returned incomplete origin and the assertion stopped transfer; receiver skipped, models zero. Wrapped execution was 22,612.8 ms. | No captured portable reason/checkpoint details. Duration does not prove a timeout or its underlying cause. Actual job image/build/filesystem facts were not in this report. |
| `38093307269` exact-package route | Same source commit. Pack, native Windows and Linux jobs succeeded. macOS installed smoke failed at its separate export-preview `origin.complete` assertion (`portable-installed-smoke.mjs:102`); model trials were not part of this job. | No captured origin reason. This is not a second machine receiver trial, nor proof that its separately packed bytes match the first run. |

The read-only diagnostic route in
[`portable-machine.mjs`](../../test/acceptance/portable-machine.mjs) records only
reviewed static fields from the exact owned selected receipt and its matching
immutable origin, behind owner/selection rereads. It does not rediscover missing
facts, run a probe, repair the receipt or infer complete origin from local CURRENT.
If those barriers fail, it reports `SELECTED_ORIGIN_UNAVAILABLE` instead of guessing.
Each new job also records its own bounded public image labels, product/build and
writable APFS facts before installation/execution. These facts are inventory,
not runtime equivalence or evidence eligibility. No runtime hashing preflight is
performed to hide cold-path failure.

| Static diagnosis | Meaning established by this code | Next bounded step |
| --- | --- | --- |
| `PORTABLE_PROBE_TIMEOUT` | The probe launch returned `error.code: ETIMEDOUT` at the existing deadline. Signal, elapsed time, exit status and prose alone never establish this code. | Identify the responsible existing probe phase in local diagnostics; keep the deadline and incomplete origin. Do not retry until the evidence is reviewed. |
| `PORTABLE_PROBE_UNAVAILABLE` | Portable probe did not yield supported complete data; the diagnostic alone does not establish permission, timeout or compiler failure. | Inspect the bounded process result/static failure class without publishing raw stderr or environment. |
| `PORTABLE_RUNTIME_UNSUPPORTED` | The runtime content/environment boundary was not admitted. | Compare approved profile/version/content facts; do not strip overrides or equate runtime labels. |
| `PORTABLE_EXTERNAL_INPUT`, `PORTABLE_SYMLINK`, `PORTABLE_PATH` | Required discovery cannot be represented under the supported root/topology boundary. | Keep the project unsupported; do not discard queried paths or modify real inputs to fit. |
| `PORTABLE_COVERAGE_UNSUPPORTED`, `PORTABLE_DISCOVERY_INCOMPLETE` | Required observed membership or complete discovery is missing. | Review the declaration/config/installed-input boundary; no missing measurement becomes an unchanged hash. |
| `PORTABLE_INPUT_CHANGED`, `PORTABLE_BOUNDARY_CHANGED`, input/context/plan checkpoint codes | Validation facts or execution-interval observations changed, or could not be established. | Preserve outcome/history; diagnose the reported interval condition before establishing a fresh baseline. A restored end state cannot repair the interval. |
| `PORTABLE_OBSERVATION_INCOMPLETE` or start/end observation checkpoint codes | A necessary healthy observation boundary was absent. | Repair the actual approved observer prerequisite; later recovery cannot upgrade this original invocation. |
| `PORTABLE_CONTRACT_UNSUPPORTED`, `PORTABLE_INTERPRETATION_UNSUPPORTED`, `PORTABLE_CALLER_UNVERIFIED` | Invocation, interpretation or actual caller proof did not meet the supported recipe. | Check exact selected configuration and reviewed runtime/recipe; do not substitute daemon context or old evidence. |
| `OTHER_PRIVATE_REASON`, `OTHER_PRIVATE_ISSUE`, unavailable snapshot | There is no safe recognized classification in this report. | Review protected local evidence once; do not dump arbitrary strings, URLs, source paths or secrets. |

A failure reason can be absent even when completeness is false, for example when
stability or coverage failed. Interpret those separate booleans/checkpoint fields;
never treat a null reason as green. Current diagnostics do not distinguish which
of the beginning/end portable captures produced the retained failure reason.
The first two failures therefore remain unresolved, not fixed by better reporting.

The owner approved enablement of the exact signing proposal with SHA-256
`5770b7f0ac9133fbf0190cf0e238ac800263b632d7f4741f3fddb04882591924`.
That approval does not approve a producer trust policy, authenticate these earlier
unsigned runs, or certify an imported candidate as CURRENT. Exact later source,
artifact and signature results require their own recorded evidence.

## Historical @1 installed mechanics

The following two checks passed before the @2 runtime profile; they are retained
for provenance and do not establish current cross-machine acceptance.
The coherent source is `b0cdd5e077b04915482b43c3af126515fa352761`, artifact
`redue-cli-0.1.0-alpha.10.tgz`, SHA-256
`1ff1bbdb73bc672bb6ff6b253f91d951d405f6591eb0c3d50d7a5b7fd6c20692`.
This is unreleased candidate identity, not the published alpha.10 package.

Two installed checks passed on macOS ARM64 / Node 22.13.0. Both established real
portable origin capture, exact manual-digest import, independent recipient
CURRENT/PASS without a local run record, unrelated-edit preservation and
source-edit STALE. The second also exercised complete fresh setup JSON after the
CLI queued-output correction. Both used the actual installed candidate for
published-policy update/removal and edited-content refusal on Codex and Claude;
neither launched a model or changed host permissions. Origin IDs were
`70040541-e27e-41d9-967f-6c6c96179423` and
`1f401ff8-f5b5-4fb5-94a4-28f37457090d`. This remains a controlled `noLib`
mechanics result; the ordinary default-library limitation remains below.

Run the command in the historical installed-mechanics section using this source
and checksum for the current candidate. The installed helper now invokes
`portable-policy-upgrade.mjs --entry` with the actual installed binary, rather
than treating source-only policy tests as installed acceptance. All owned
disposable observers and installations were cleaned. Owner-local structured
outputs are retained separately; no raw environment or transcript is published.

This acceptance helper is contributor-only, outside npm's package files. It does
not launch a model, install anything, start an observer, change permissions or
execute verification. Its explicit synchronized query can run the trusted local
observer's configured probes. Run it inside the exact host command boundary planned
for the trial, after all setup/fixture changes and before recording the expected
precondition. An outside-shell result is not equivalent.

```sh
node test/acceptance/portable-host-preflight.mjs \
  --host codex --config redue.config.json --check typecheck \
  --expected eligible --evidence-id APPROVED_EVIDENCE_SHA --run-id ORIGIN_RUN_ID
```

Use `claude` for that host and retain `--state-dir DIR` when the approved experiment
has an explicit state selection. The helper checks the command, exact config/state
selection, detected host version and intact project integration. It makes one
caller-aware synchronized query for reuse, not cached status followed by sync as a
ritual. Cached inspection is added only for the explicitly unavailable negative
case. Unknown host loading/capacity, missing integration and mismatched resources
are not silently repaired.

Declare the expected state: `eligible`, `stale`, `failed`, `unverified` or
`unavailable`. Positive import handoffs should also require the reviewed evidence
identity and run ID. Negatives have their own explicit expected preconditions;
arbitrary command failure is not a passing negative. Output is owner-local
evidence and may contain project paths from structured CLI responses; review and
redact it before publishing. Unstructured command output/error streams and raw
environment values are not retained.

`runPortableGatedTrial` composes the existing fail-closed trial gate. It records the
actual report before its sole launch branch. A wrong precondition, wrong evidence,
exception or failed evidence-record write launches zero models. The deterministic
sentinel-process regression in `test/portable-host-preflight.test.mjs` exercises
that property; mock reports are mechanics tests, not model acceptance.

The helper deliberately reports `behavior_verified: false` and
`boundary.verified_by_helper: false`. A sandbox marker is diagnostic, not proof of
permission scope. The experiment owner must separately record the actual supported
host wrapper/configuration, effective policy and narrowly approved resources.
Do not turn a user-provided profile name into a permission claim.

## Capability findings: 2026-10-10

The owner-local installed versions are Codex CLI **0.162.0** and Claude Code
**2.1.146**. Read-only auth commands report an existing ChatGPT Codex login and a
Claude `claude.ai` login. They do not establish inference capacity, a model budget,
permission to call a model, or trust in imported producers. No model was launched
for these checks. Day 0 is owner-confirmed 2026-10-10 21:24 UTC, with **$0 additional
daily/total spend**. The owner subsequently approved two standard independent macos-26 validation
VMs and 10 MiB included artifact storage with one-day retention. At that
historical checkpoint Claude inference was PENDING_OWNER_ACCOUNT. D4 subsequently
approves the existing subscription; reviewed workflow/OAuth secret and host
preconditions remain pending, and account login is not behavioral acceptance.

The retained approved Codex route for the owned debugger experiment uses
`codex sandbox` with the existing workspace/state/exact-socket configuration and
the managed proxy. Executing `/usr/bin/true` through that route succeeded (exit 0,
no diagnostic). A second no-model Node command confirmed the intended cwd and
sandbox/proxy markers, logging only variable names, not values. No permission,
global setting or environment was changed. This establishes startup of that
retained command boundary, not REDUE eligibility, two-machine independence or
agent reuse.

A preliminary attempt using `codex sandbox -C DIR -- /usr/bin/true` failed during
argument parsing (exit 2: `--permission-profile` required). The retained approved
route selects cwd through the process launcher instead and does not use that
flag. Keep this failure distinct from a managed proxy startup failure. Never add a
new permission profile merely to repair a command-line mistake.

Current official Codex documentation describes its sandbox helper and the named
profile requirement for `-C`; managed policy still applies. Review the actual
installed version before choosing a wrapper.
[Codex CLI reference](https://developers.openai.com/codex/cli/reference/)

Codex's project instruction chain loads `AGENTS.override.md` before `AGENTS.md`
at each level, with deeper guidance appended; project skill discovery is separate
from proof of activation. REDUE already uses `AGENTS.md` plus
`.agents/skills/redue-verification/SKILL.md`; reuse that mechanism.
[Codex project guidance](https://developers.openai.com/codex/guides/agents-md/),
[Codex skills](https://developers.openai.com/codex/skills/)

For Claude, retain root `CLAUDE.md` and `.claude/skills/redue-verification/SKILL.md`.
Current docs distinguish loaded instructions from tool/sandbox enforcement, and
newer direct `AGENTS.md` support requires a version beyond the installed 2.1.146.
No installed no-model Bash-sandbox test command was established from its CLI
help. Do not substitute a model request, install another sandbox runtime or weaken
permissions to claim that prerequisite. Claude behavior remains **NOT RUN**.
[Claude memory](https://code.claude.com/docs/en/memory),
[Claude skills](https://code.claude.com/docs/en/skills),
[Claude CLI](https://code.claude.com/docs/en/cli-reference),
[Claude sandbox](https://code.claude.com/docs/en/sandboxing)

## Remaining owner-provisioned prerequisites

The approved standard macos-26 producer/receiver jobs use independent OS boots,
filesystems, installations and state. Their actual full runtime profile still has
to pass origin and recipient validation; a runner label or inventory match alone
is insufficient. The first producer precondition failed, so machine acceptance is
not complete. Two worktrees or two agent processes on one machine do not satisfy
G2. This lane will not purchase capacity, inspect corporate credentials or guess
remote hosts.

Before any paid/additionally metered model or CI action, record the permitted
account/model, usable included capacity, concurrency and resource scope. The $0
cap is not unlimited included usage authorization. Use only owner-approved CI
entitlement; do not create trust policy or account settings automatically.

Successful startup is separate from an in-context REDUE precondition. Complete
setup, establish fresh origin capture/import, run the preflight in the actual
recipient boundary and retain its real result. Missing prerequisites launch zero
models. Cross-host evidence needs actual independent Codex and Claude sessions;
installed files/auth status cannot close that gate.

## Preliminary exact-installed mechanics: 2026-10-10

The reproducible contributor check is
[`test/acceptance/portable-installed-smoke.mjs`](../../test/acceptance/portable-installed-smoke.mjs).
It verifies the supplied checksum before installation, uses owned disposable
prefixes/checkouts/state, launches no models and stops its owned observers before
teardown. It does not modify a stable installation or host permissions.

```sh
node test/acceptance/portable-installed-smoke.mjs \
  --tarball PATH_TO_REVIEWED_TARBALL \
  --sha256 a8aea832d71d498ed3bde5ee0faffc0da536a08a5ffd04dafd688e2d199e5936 \
  --source 1beaaea --baseline @redue/cli@0.1.0-alpha.10
```

The source `1beaaea` candidate file is `redue-cli-0.1.0-alpha.10.tgz`, not the
published alpha.10 bytes. Its installed help/assets, normal npm project install
and separate recipient `npm ci`, direct-recipe preview/selection, old-receipt
inspection, fresh portable capture, export/inspect/import and local applicability
passed on macOS ARM64 / Node 22.13.0. Published alpha.10 project-policy setup,
candidate update/idempotency, refusal of edited managed skills and selective host
removal preserved unrelated instructions and the origin record.

Two attempts are retained: the first stopped before evidence recording because
macOS's long default temporary path exceeded Unix socket limits. The second used
an owned canonical short temporary directory and passed. This was a harness setup
correction, not an observer correctness fix. Both attempts launched zero models.

The passing controlled `noLib` project supplied observed global declarations.
Origin run `c14425b9-e3dc-4331-bc85-2887c66c6cfc` exported evidence digest
`c9da40fe002ac50f3f175f22fdf059cf3e9f217d1457ca399312ec7f79c50992`.
Recipient synchronization reported CURRENT/PASS, `reuse_eligible: true`,
`evidence_source: imported`, no local invocation and the retained origin ID.
No recipient local run directory was created; unrelated documentation preserved
eligibility and a relevant source edit produced STALE/non-reusable. Source
history was unchanged throughout the check, until owned fixture teardown.

Single observations were 1,869.6 ms for wrapped origin recording, 1,045.2 ms for
recipient synchronization, 1,117.9 ms after the unrelated edit and 1,114.8 ms for
relevant-edit invalidation. These are mechanics observations, not a latency
distribution, complete-path economic comparison or saved-time claim. Ordinary
default-library external queries remain unsupported in this slice. Actual
agent behavior, independent-machine acceptance and authenticated CI acceptance
remain separate gates. Later candidate bytes require their own installed check.
