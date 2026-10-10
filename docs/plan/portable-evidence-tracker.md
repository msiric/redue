# REDUE-PE-001 execution tracker

Canonical scope and gates: [portable-evidence.md](portable-evidence.md), revision 1.0, unchanged.

Current conclusion: implementation started; no portable eligibility claim has passed acceptance. Publication is not authorized. External natural use has not started.

Agreed Day 0: 2026-10-10 21:24 UTC (owner confirmed). First substantive review: 2026-10-13 21:24 UTC. Daily concise progress summaries. Additional metered spending is $0/day and $0 total for the first 72 hours; only established subscription-included capacity is allowed. No new machine/VM is approved. Claude calls require an explicitly approved usable account; CI entitlement must be confirmed before jobs. Provisioning and blocked time count from kickoff; dates will not be reset. Initial targets remain Day 14 demonstration / Day 28 prepublication readiness, uncalibrated until the real G1 slice.

| Gate | Current status | Evidence / outstanding prerequisite |
| --- | --- | --- |
| G0 | Partial | Local repository and public GitHub reads verified; caps and cadence confirmed; independent machine/profile, Claude behavioral approval and no-additional-charge CI entitlement unresolved. No paid model trials or provisioning started. |
| G1 | In progress | Fresh origin capture, safe envelope, separate-checkout recipient validation under development. |
| G2 | Not run | Codex + Claude actual behavior and independent matched machine not provisioned/approved yet. |
| G3 | Not run | Authenticated reviewed CI producer and recipient trust route required. |
| G4 prepublication | Not ready | G1–G3, V01–V22, independent review, final bytes and economics outstanding. |
| Publication / postpublication | Pending owner approval | No main merge, release tag or npm operation in this milestone. |
| External usage | Not started | Owner-approved willing participants separate from technical gates. |

Integration owner: root (Lane A). One writer per shared interface: root owns CLI/daemon/origin capture and facts schema; B owns envelope/parser/trust module; C independently reviews critical boundaries and owns adversarial tests; D owns onboarding and host preflight. All lanes use isolated branches/worktrees. No existing pilot installation or receipt is modified.

| Task | Owner / independent reviewer | Branch and owned interface | Current evidence / next action |
| --- | --- | --- | --- |
| PE-01 resources/profile | Owner + C / integration | Local G0 record | Asked once for missing limits and machines. Local deterministic work continues. |
| PE-02 minimum decisions | A/B / C | `dev/portable-evidence`, `dev/portable-import` | D1–D3 draft requires independent challenge before acceptance. |
| PE-03 fresh origin + export | A / C | `dev/portable-evidence`; core/CLI | Capture within observed interval, never reconstruct old origin from export-time files. |
| PE-04 safe envelope/inspect/import | B / C | `dev/portable-import`; new envelope module/tests | B implementing bounded duplicate-key rejection, deterministic integrity binding, explicit digest acceptance. |
| PE-05 relocation slice | A+C / B | Integration + adversarial tests | Real independent checkout and healthy recipient required; no copied local state. |
| PE-06 host handoff | D / C | `dev/portable-onboarding`; docs/preflight | Host capabilities distinct from model acceptance; no model call without caps/preconditions. |
| PE-07–12 | Unclaimed until dependencies ready | See canonical backlog | No completion implied. |

Baseline inspected: `main` and `origin/main` at `b4f286034f43021a74f1babf2c1d0fee5df2a9e5`; package `@redue/cli@0.1.0-alpha.10`. No pre-existing portable implementation or open PR. Owner plan was the only untracked content and is preserved verbatim. Existing worktrees and historical artifacts remain intact.

Current critical review findings: absolute path hashes cannot simply be stripped; compiler queries must retain absent candidates and arguments; dyld-cache-only loaded libraries need a reviewed runtime identity, not fabricated per-library hashes. Unsupported identity stays non-reusable.

Usage: four approved implementation/review lanes; no external model evaluations, cloud provisioning, npm publication, account/trust changes or new spending initiated. Local implementation/test/review timings will be recorded with each result rather than estimated as completed work.

Next commands: inspect and implement origin facts; integrate independently reviewed parser; run new portability tests and existing receipt/direct-compiler regressions. Detailed results will link from here, with every failed attempt retained.

## Daily progress — 2026-10-10

Task branch integrates through `243f8d6`; no main merge or publication. Bounded envelope, durable separate import selection, explicit CLI export/inspection/import, fail-closed host preflight and preparatory policy-bound CI authentication inspector are committed. Core fresh-run capture and recipient integration are in progress. Independent review identified and addressed lexical numeric ambiguity, interrupted-import FAIL replay, reader ownership mismatch and probe-path/consumed-input coverage. Export ownership race remains under repair; no portable CURRENT claim is accepted yet.

Local focused evidence: parser/store/boundary 36/36; direct/compiler combined 27/27; fresh facts tests 4/4. Latest leaf/facts/preflight run: 15/16, with the remaining test using a now-obsolete owner-less import reader interface; repair is assigned to D without weakening its expected result. Native helper prototype initially failed `ERR_DLOPEN_FAILED` because `-no_uuid` omitted LC_UUID; diagnosed, flag removed, actual active-cache APIs verified. Native reproduction and profile review remain independent gates. No model calls, paid jobs, provisioning, account changes or external usage.

Blocked-time ledger: G2 machine approval and Claude call capacity, and G3/combined-platform CI entitlement, blocked since Day 0 pending owner decisions; implementation proceeds concurrently, so this is lane-blocked time, not a claim all work stopped. Day 14/28 targets remain uncalibrated until the 72-hour working-slice review.
