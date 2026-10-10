# Portable evidence resume

Read canonical [REDUE-PE-001](portable-evidence.md), [tracker](portable-evidence-tracker.md), [decisions](portable-evidence-decisions.md) and [independent review](../acceptance/portable-boundary-review.md). Resume the existing `/Users/mariosiric/Documents/redue` worktree on `dev/portable-evidence`; baseline `b4f2860` is history, not a rollback target.

Owner confirmed Day 0 **2026-10-10 21:24 UTC**, first substantive review 2026-10-13 21:24 UTC, daily summary and $0 additional daily/total spending for the first 72 hours. Four included-capacity lanes are approved. No main merge, release tag or npm publication is approved.

Latest resource decision: standard GitHub-hosted public-repository validation and automatic VM provisioning are approved. Start with two separate `macos-26` ARM64 producer/receiver jobs, each with independent checkout/install/state. No larger runner, model credentials, account changes, paid infrastructure or security relaxation. Storage-free preflights may proceed. Artifact/cache operations require confirmed included allowance: existing billing API access lacks the `user` scope; do not widen it automatically. The specific 10 MiB/one-day allowance question is pending. Signing permissions and exact accepted-producer policy require owner review before enabling them. Claude behavior remains **PENDING_OWNER_ACCOUNT**.

## Current work and ownership

Root owns shared CLI/daemon/facts/runtime/catalog/cached authority. B owns envelope/store/pure applicability/CI verification preparation in `../redue-portable-import`; C independently owns adversarial tests/review in `../redue-portable-review`; D owns policy/JSON/onboarding/preflight in `../redue-portable-onboarding`. One writer per interface. Import never transfers observer authority or changes immutable local outcomes.

History: fresh origin `c9173f5`, recipient evaluation `1beaaea`, receipt/catalog/input publication guards `fd504b8`, missing-selector guard `bc4c1ae`, tight profile `7b13080`, installed harness `67c1002`, independent publication controls through `3455c35`, imported policy `473b868`. Inspect actual HEAD/status; pending stdout/preflight/review changes may be newer. No task branch push/PR at this checkpoint. Tracker issue: https://github.com/msiric/redue/issues/11.

Real fresh source execution/export/explicit import/separate-checkout recipient CURRENT and relevant-edit rejection pass on the **same-host/boot prototype**. No recipient verification or copied state. Independent controls reject origin change-and-restore, post-exit membership, observation loss, delayed newer FAIL/incomplete selector, changed accepted catalog, delivered source events and lost-selector old PASS replay.

Exact prototype: Darwin ARM64, release 25.6.0, Node 22.13.0, same physical Node installation and active cache in one boot. Controlled noLib TypeScript 5.6.3 observes global declarations. Default-library ancestor queries outside the observed root remain unsupported even when absent. Do not rewrite the retained debugger project to fit. Cross-machine runtime equivalence, actual agents, CI and useful savings remain open.

## Tests and artifacts

Root full regressions: 226 tests, 211 passed, 15 platform-specific skipped, zero failures (~564 s); source started at `7b13080` with later leaf/review changes integrated while running, so this is shared-path regression evidence, not immutable final-source acceptance. Independent portable suite 87/87 before final catalog/source-event controls; all four extended publication variants separately passed. Root store/relocation 18/18. Output/policy/preflight 22/22 after the fixture state was moved outside its observed checkout; the refused overlap attempt is retained locally.

Preserve preliminary source `1beaaea`, `.local/portable-evidence/candidates/1beaaea/redue-cli-0.1.0-alpha.10.tgz`, SHA-256 `a8aea832d71d498ed3bde5ee0faffc0da536a08a5ffd04dafd688e2d199e5936`; adjacent manifest.json/SHA256SUMS. Installed onboarding and relocation passed on those bytes, now superseded by authority fixes. A new candidate is required; alpha.10 metadata does not mean published alpha.10 bytes.

Published pilot alpha.10 is separate: source `2e939ca`, SHA-256 `30adbf2ef1dd4c328515e11e8b8764cbad245974a8d159e183abc63c41723b2f`. Preserve frozen alpha.9, handoffs and pilot receipts.

## Next commands and gates

Finish independent stdout/policy/preflight review; commit coherent changes; pack/inspect a new exact candidate and run installed setup/update/removal. Fetch/compare/push task branch normally; prepare draft PR. Run storage-free standard runner profiles/shared regressions; record actual image/build/filesystem/runtime/compiler. A label is not compatibility.

Establish a reviewed versioned cross-machine runtime/content projection and useful-project input boundary before machine/model acceptance. G2 needs real approved Codex/Claude, in-context preflights and independent machines; G3 real authenticated CI, owner-reviewed producer policy and explicit acceptance. Failed prerequisites launch no model. Continue permitted work while resource gates are pending; do not wait for the 72-hour date.
