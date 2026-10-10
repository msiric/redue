# Portable-evidence host preflight

**Current conclusion (2026-10-11): installed @2 controlled-fixture export/import,
receipt-preserving upgrade and policy ownership checks PASS on one macOS machine.
The first hosted producer stopped at an incomplete-portable-origin precondition;
receiver and models did not run. Cross-agent, two-machine and live authenticated CI
acceptance remain open.**

Current exact tested source is `b4c33b193740d6997daa650eecd5f665d58a3b97`,
`redue-cli-0.1.0-alpha.10.tgz`, SHA-256
`ec4b7cabdc0ad8d41850b947881730dbd2367c00d91a1935fd07c04624767f48`.
These are unreleased candidate bytes, not public alpha.10. The real local producer
recorded origin `7a9a699d-9c7b-4f92-aa05-41e69c447c14`, digest
`996b50d8a2e6c5411bdb37b390403b8793dc02cb1891fb4ea766d292d27b3324`;
only an envelope and manifest traveled (23,246 bytes). A same-boot receiver was
refused, not counted as a second machine. The hosted run `38093305258` reached
local CURRENT/PASS but did not establish complete portable origin; its cause is
unresolved. No upload, receiver or model followed that failed gate.

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
VMs and 10 MiB included artifact storage with one-day retention. Claude inference
remains PENDING_OWNER_ACCOUNT; account login is not behavior approval.

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
