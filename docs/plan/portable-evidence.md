# REDUE — Portable Verification Evidence

## Accelerated delivery plan

> **Verification evidence survives changes of agent, session, tool, and—eventually—machine, while retaining a clear statement of where it applies.**

| Plan metadata | Value |
| --- | --- |
| Plan ID | `REDUE-PE-001` |
| Revision | `1.0` |
| Written / sources checked | 2026-10-10 |
| Status | Ready to start; no milestone completion is implied by this document |
| Suggested canonical repository location | `docs/plan/portable-evidence.md` |
| Planning baseline | Public alpha.10; inspected `main` at `b4f286034f43021a74f1babf2c1d0fee5df2a9e5` |
| Demonstration target | Day 14 |
| Scoped public-alpha target | Day 28 |
| Contingency budget | Through Day 42; not an automatic extension |
| First forecast checkpoint | 72 hours after the agreed start |
| Execution model | Four bounded, concurrent agent lanes; one integration owner; independent review |
| Day 0 | Owner to record the actual start date and time |

**Operating decision:** pursue a genuine two-agent, two-machine implementation of one supported verification contract. Reuse REDUE's existing evidence engine. Parallelize independent work, automate feedback, and remove avoidable waiting. Do not accelerate by weakening what eligible evidence means.

**Standing operating authority:** the owner’s [autonomy amendment](#65-owner-autonomy-amendment-standing-authority) governs ongoing execution. Earlier per-command, exact-helper-hash and single-attempt approvals remain historical evidence, not routine operating gates. The objective, scope and G0–G4 requirements are unchanged.

This plan replaces the earlier 12–16-week calendar for this narrow objective. It does not promise universal portability, general test qualification, or product-market fit in four weeks. The schedule is an engineering target, not a statistical confidence interval. Earlier delivery is welcome when the gates are met.

This document is the roadmap, not blanket permission to publish packages, spend money, modify account settings, or override host policy. Those operations retain normal owner approval. No background agent operation is created merely by writing this plan.

---

## Contents

1. [The outcome we are building](#1-the-outcome-we-are-building)
2. [Starting point and boundaries](#2-starting-point-and-boundaries)
3. [Product and architecture decisions](#3-product-and-architecture-decisions)
4. [Delivery schedule and gates](#4-delivery-schedule-and-gates)
5. [The first 72 hours](#5-the-first-72-hours)
6. [Parallel execution and ownership](#6-parallel-execution-and-ownership)
7. [Acceptance and adversarial testing](#7-acceptance-and-adversarial-testing)
8. [Economics and real-user evidence](#8-economics-and-real-user-evidence)
9. [Review, release, and compatibility](#9-review-release-and-compatibility)
10. [Risks and escalation rules](#10-risks-and-escalation-rules)
11. [After this milestone](#11-after-this-milestone)
12. [Tracking and immediate kickoff](#12-tracking-and-immediate-kickoff)
13. [Sources and estimate rationale](#13-sources-and-estimate-rationale)

---

## 1. The outcome we are building

### 1.1 The first complete user story

A developer or agent executes a supported verification check in checkout A. REDUE records the actual execution, outcome, inputs, and relevant context. Another agent, in a separately initialized checkout on machine B, receives that evidence through an explicitly trusted route.

Machine B independently determines whether the evidence applies to its own current project and environment. When the supported conditions match, its agent can reuse the passing evidence without executing an equivalent check. A relevant edit, incompatible context, untrusted producer, or incomplete observation prevents reuse and produces an actionable explanation.

The receiver must be able to say:

```text
This check executed elsewhere.
This is the evidence and producer I evaluated.
Its declared scope matches the verification obligation here.
Its relevant inputs and supported execution context match here now.
I reused that evidence; I did not execute the check locally.
```

This is the demonstration we are targeting. It must come from actual executions and actual agent traces, not a scripted conversation or a copied green status.

### 1.2 The non-negotiable distinction

**Evidence is portable. CURRENT is evaluated locally.**

A receipt is a record of an earlier execution. CURRENT is an applicability decision about a particular present context. Moving the receipt must not move the producer's watcher state, ownership, or authority to declare the receiver current.

Four different achievements must remain visible:

| Achievement | Meaning |
| --- | --- |
| Evidence preserved | The record remains available and its identity is intact. |
| Evidence understood | REDUE recognizes the schema, recipe, scope, and limitations. |
| Producer accepted | Integrity and locally configured trust requirements are satisfied. |
| Evidence reusable here | The recipient independently establishes applicable passing evidence for its current obligation. |

Importing a file establishes none of the last three by itself. A valid signature does not prove input completeness or application correctness. A matching commit does not prove matching installed or generated inputs.

### 1.3 Definition of the narrow alpha

The Day 28 target includes:

- Two actual agent products, initially Codex and Claude Code, consuming one shared evidence policy through tested host integrations.
- Independent sessions and checkouts, with two separately provisioned machines or virtual machines and no shared REDUE state directory.
- One reviewed direct-TypeScript contract, initially on a matched supported OS/architecture/runtime profile.
- Safe local export, inspection, and import, plus one explicit trusted CI producer and artifact-delivery path.
- Recipient-side reevaluation, clear trust and incompatibility reasons, and conservative conflicting-evidence handling.
- A usable setup/handoff path, reviewed documentation, adversarial tests, and an exact release artifact.

Two worktrees, two processes, or two sessions sharing the same state are not a two-machine demonstration. A second model inside the same agent product does not establish a second agent integration.

### 1.4 What this milestone does not include

Do not add universal OS equivalence, arbitrary command qualification, new languages, general Vitest/Jest qualification, emitted or incremental build support, a universal dependency graph, hosted accounts, automatic team synchronization, browser applicability, human-signoff invalidation, an IDE extension, or a marketplace.

Do not bypass mandatory CI checks with imported local evidence. The first automated direction is trusted CI evidence consumed locally. REDUE remains distinct from a build system and from a proof of total application correctness.

---

## 2. Starting point and boundaries

### 2.1 Verified baseline

The repository baseline was rechecked on 2026-10-10. Its pilot and implementation describe the following state. Reverify intervening changes at kickoff; do not roll the repository back to match this document. [R1–R6]

| Area | Baseline |
| --- | --- |
| Public package | `@redue/cli`; fixed pilot `0.1.0-alpha.10`; executable `redue` |
| Evidence model | Immutable per-invocation records; historical outcome separate from applicability and explicit reuse eligibility |
| Agent-facing interface | JSON status/explain; caller-aware synchronized decisions; project-local guidance |
| Direct recipe | Single-package npm; reviewed TypeScript 5.5.2, 5.6.3, and 5.9.3; documented runtime/environment restrictions |
| Behavioral evidence | Controlled Codex/macOS sessions; Claude behavior and cross-agent handoff not yet validated in the pilot record |
| Current portability | Local state/ownership tied to a checkout and configuration; no implemented machine-sharing claim |
| Measured value | Modest positive CLI economics in a prescribed workload; natural adoption and whole-agent benefit not established. [R8] |
| External pilot | Not started in the baseline documentation |

The pilot's injected `NODE_USE_ENV_PROXY=1` context is reviewed only on Node 22.13.0. Do not confuse broad CLI engine requirements with the narrower qualified execution environment. Existing unrelated Yarn/pnpm contracts must retain their documented behavior. [R2]

### 2.2 Preserve the engine; separate portable identity

The current project-state path includes physical checkout/configuration identity. Caller Node identity includes local path and filesystem metadata. These facts are useful locally but do not establish portable equivalence. Current receipt persistence also protects local selection across interrupted updates. Preserve those protections. [R4–R6]

The extension must not copy a state directory and relabel it as a successful import. It must translate supported execution evidence into a separately specified representation, then let the recipient create its own local observation state.

### 2.3 Choose the initial machine profile once

Within the first 12 hours, select two owner-approved, independently provisioned environments. Prefer a matched native macOS pair where available because that is the strongest existing agent-behavior baseline. If a supported native Linux pair is more practical, explicitly account for the additional host-behavior acceptance and filesystem prerequisites.

Independent VMs are acceptable machine boundaries when they have independent operating-system instances, filesystems, installations, and observer state. Unsupported container/overlay observation must not be silently treated as equivalent to native storage.

Record the actual OS, architecture, filesystem, runtime, compiler, package layout, agent versions, and permissions. Start with one tight profile. Do not weaken it to make the first example work; do not demand that external users downgrade to it.

### 2.4 Use the existing project first

Retain the already studied `microsoft/vscode-js-debug` revision as the initial engineering target when its existing approved environment is available. Its role is a controlled acceptance project, not independent adoption. Keep one small existing fixture for rapid negative tests.

Do not begin another broad project search before proving relocation. A second external project is valuable for generalization and pilot feedback, but is not a prerequisite to writing the first portable representation.

---

## 3. Product and architecture decisions

The following are implementation requirements or explicit proposals, not claims that these capabilities already ship.

### 3.1 Keep three decision records small

Settle three short architecture decision records within the first 24 hours. Each should include alternatives, rejected shortcuts, invariants, and test implications. Avoid a general policy language or a large schema committee.

| Decision | Question | Owner |
| --- | --- | --- |
| D1 — Evidence representation | What exact original execution facts and scope can a portable record establish? | Core lane + integration owner |
| D2 — Portable applicability | Which local facts may be replaced with portable identities for the first recipe, and why? | Core lane + independent reviewer |
| D3 — Trust and selection | Which producer is accepted, how is it verified, and what happens to conflicting or superseded evidence? | Trust lane + owner/reviewer |

The first implementation can refine field names. Changing the semantic answers after integration requires review and a versioned interpretation, not an undocumented compatibility shortcut.

### 3.2 Portable evidence envelope

Start with a bounded representation of one check or a small explicit bundle. Use an existing attestation envelope where it fits; define a versioned REDUE predicate rather than pretending a generic build-provenance statement already expresses applicability. in-toto provides an immutable subject/predicate binding; it does not supply REDUE's check semantics. [S1]

The minimum design must account for:

| Information | Required purpose |
| --- | --- |
| Schema and interpretation | Identify exactly how the record must be read; unsupported versions cannot authorize reuse. |
| Evidence identity | Bind an immutable payload and original invocation identity without relying on filenames or timestamps. |
| Verification obligation | Recipe/version, compiler execution mode, arguments, selected configuration, and scope. |
| Outcome and completion | Actual PASS/FAIL or incomplete/interrupted status; not inferred from terminal prose. |
| Origin observation | Whether the original run met its required starting, interval, and ending conditions. |
| Input manifest | Relevant file contents, configuration, membership, missing/resolution candidates, and installed/generated inputs required by the recipe. |
| Execution compatibility | Reviewed compiler/runtime identities and the relevant environment/platform requirements. |
| Provenance and trust | Producer identity, verification material, origin reference, and applicable trust-policy version. |
| Optional artifact references | Content digests and explicit types; no automatic retrieval or execution. |
| Limitations | What was not observed, not supported, or not established. |

Choose one deterministic encoding/digest rule with a standard implementation where practical. Define duplicate-key, normalization, and unknown-field behavior. Hash exactly the payload whose meaning is evaluated. A content digest identifies bytes; it does not authenticate who produced them.

Do not export credentials, raw environment dumps, unnecessary absolute paths, or source contents by default. Provide an export preview. Filenames, dependency information, and even hashes may be sensitive. A privacy-preserving omission that removes a required applicability fact must make the export inspection-only rather than silently weakening validation.

### 3.3 Historical receipts and origin completeness

Do not mutate immutable old receipts or fill missing origin facts with today's filesystem state. An old record lacking required portable facts remains readable and local-only or inspection-only. Require a fresh, correctly observed baseline where necessary.

A run that lacked a healthy starting observation cannot be rehabilitated by importing it into a healthy observer. Later qualification requires new legitimate evidence, not a rewritten history.

Retain actual source outcome and origin scope even when local trust is absent. Clearly distinguish an unauthenticated producer-reported PASS from locally accepted execution evidence.

### 3.4 Recipient evaluation

Retain the existing applicability authority. Add portable comparison at that boundary; do not create a competing verifier in the CLI, importer, agent skill, or UI.

The recipient must establish all of the following before authorizing reuse:

1. The envelope is intact, bounded, and understood.
2. The verification recipe and implementation are locally supported.
3. Locally configured producer trust is satisfied.
4. The evidence covers the actual requested obligation, including origin observation completeness.
5. The recipient's relevant current inputs and execution context satisfy the supported equivalence rule.
6. Current local observation and receipt-selection requirements hold.
7. Known conflicting or superseding evidence is handled by the declared policy.
8. The accepted result is passing and the final response explicitly grants reuse eligibility.

The language model consumes this decision. It must not infer applicability from a signature, receipt age, commit hash, or prose explanation.

Preserve the current human vocabulary and JSON behavior where compatible. Add explicit machine-readable reason codes for new trust/portability cases rather than teaching agents to parse explanation strings. If an additive extension cannot preserve the existing schema contract, version it and test both supported readers. [R3]

### 3.5 Portable identity is not path stripping

| Existing local fact | Portable treatment to establish |
| --- | --- |
| Absolute checkout path | A declared project-relative namespace mapped by the recipient |
| Inode/device/timestamps | Relevant content/structure identity; retain local metadata for local continuity only |
| Node executable path | Reviewed runtime bytes and supported execution compatibility |
| Compiler directory | Reviewed implementation identity and complete relevant installed membership |
| Observer generation/cursor | Recipient's independently established observation; never transferred as authority |
| Source commit/lockfile | Provenance and lookup aid, not a substitute for materialized input validation |

Do not globally lowercase names, strip path prefixes, normalize line endings, discard absent files, or ignore symlink structure. Each normalization must be justified for this recipe. Path case, relative resolution, platform semantics, and generated inputs can matter.

Independently discover the receiver's required inputs. Do not validate only a producer-selected subset that could omit relevant local files. Import cannot choose its own validator or declare arbitrary exclusions authoritative.

Exact runtime/compiler matching is a legitimate initial boundary, but version labels alone are not enough. Dynamic loading and relevant platform libraries or runtime behavior must be accounted for or rejected. Unknown compatibility yields non-reuse, not a best guess.

The first profile need not support different operating systems or architectures. Adding those later is a separate contract extension.

### 3.6 Trust, conflict, and remote freshness

Default to no automatic trust in imported producers. A manual local import may receive explicit approval scoped to its exact digest; it must not establish a global trust exemption. That is sufficient for an early owned-file experiment, not the final automated distribution claim.

For the public alpha, implement one verified CI producer using existing Sigstore/GitHub attestation tooling. Verify signing identity and issuer, plus the repository/workflow/ref and other supported claims required by the chosen policy. Record the exact matched policy. A valid signature alone is insufficient. [S2–S3]

Locally reviewed policy controls trust. An imported file, repository instruction, or model suggestion cannot add a trusted signer automatically. Trusting a producer means accepting that producer's assertions within scope; it does not defeat a compromised accepted producer or prove the recipe is sound.

Keep local receipt selection and imported candidates separate. Required conflict behavior:

- Import arrival order and wall-clock timestamps must not silently replace a newer local selected outcome.
- A known trusted FAIL for the same applicable obligation cannot be hidden by replaying an older PASS.
- A stale failure for different relevant inputs remains visible history, not a permanent blocker for unrelated new evidence.
- Where cross-producer ordering is unknown, report the conflict and withhold reuse until a defined authority or fresh observed execution resolves it.
- Untrusted imports cannot poison or overwrite local selected evidence merely by claiming failure.

An offline recipient cannot establish that no newer remote record exists. Separate local applicability from remote-catalog freshness. If policy requires current remote knowledge, an unavailable refresh prevents that trust decision. If policy permits an explicitly identified offline receipt, show the limit; do not call it globally latest.

Do not use a time-to-live as a substitute for input correctness. Define signer revocation/policy refresh behavior for the supported mode before public release.

### 3.7 Safe import and one transport

Begin with a bounded file bundle. The first CI transport should use an existing approved artifact route, not a new hosted service. Make retrieval explicit and inspectable; local status must not silently depend on a network round trip.

Parsing/importing must not run a check, install dependencies, load a plugin, execute embedded commands, fetch arbitrary URLs, modify source, or grant host permissions. Store imports transactionally under owned local state with bounded paths, sizes, nesting, decompression, and counts. Preserve existing state on interruption or failure.

REDUE currently executes trusted configured commands and probes as the user; it is not itself a project-command sandbox. [R7] Any recipient-side probe used during an explicit evaluation must be selected from locally reviewed recipe code and execute under the approved authority. Do not treat imported arguments as a shell command. Separate pure inspection from an operation that can perform filesystem discovery or start trusted probes.

The CI producer must record the actual intended invocation and outcome. A green workflow, a cached outer task, or a generic test report does not by itself establish that this particular check ran with complete REDUE-compatible observation. Protect signing from untrusted workflow/code changes; do not give fork-controlled code a privileged signing route.

### 3.8 Agent and handoff experience

Use the existing CLI and shared agent policy. Agent Skills is an available instruction format, but actual host loading and behavior still require validation. [S5]

The user journey is:

```text
Check compatibility
→ preview the exact verification obligation and project integration
→ explicitly apply setup
→ establish real evidence
→ explicitly share or receive evidence
→ let a fresh agent ask whether it applies here
```

Provide a compact handoff distinguishing fresh local execution, accepted inherited evidence, untrusted reported evidence, failures, and missing coverage. Do not suggest compiler evidence establishes tests or browser behavior.

Export/inspect/import command spelling is an implementation decision during the first 72 hours. No such command is represented as already shipped by this plan. Keep ordinary `status`, synchronized status, and `run` semantics intact. `run` still executes; it must not become an implicit skip operation.

---

## 4. Delivery schedule and gates

### 4.1 Calendar and assumptions

Use calendar days from an owner-confirmed Day 0. Start the clock when the program begins, including provisioning work. Track blocked time explicitly; do not move Day 0 silently to disguise delays.

The schedule assumes four active lanes, a ready task queue, usable model capacity, approved test infrastructure, and regular owner review. It is not an authorization for unlimited spending or a claim that this chat autonomously operates agents around the clock.

| Window | Milestone | Required output |
| --- | --- | --- |
| Days 0–3 | M0: calibration and vertical slice | Minimal contract, real export/import, separate-checkout evaluation, resource readiness, revised forecast |
| Days 3–7 | M1: relocation and local cross-agent path | Independently observed second checkout, structured reasons, second-agent handoff, initial trust implementation |
| Days 5–14, overlapping | M2: two-machine demonstration | Actual source execution and second-machine reuse with explicit producer acceptance and negative cases |
| Days 10–21, overlapping | M3: trusted distribution | One authenticated CI producer/artifact path using the same evidence contract |
| Days 15–28 | M4: public-alpha readiness | Integrated adversarial review, versioned artifact, upgrades, documented support, external setup attempts |
| Days 29–42, only if needed | Contingency | Named unresolved correctness/compatibility issues; no automatic feature expansion |

Critical dependency chain:

```text
Minimum contract
→ source facts and portable identity
→ separate-checkout reevaluation
→ matched-profile second-machine reevaluation
→ integrated trust, transport, and release acceptance
```

Parser tests, trust integration, host activation, documentation, and CI scaffolding should proceed concurrently against the agreed interface. Do not wait for the end of one milestone to start every independent part of the next.

### 4.2 G0 — capability and task readiness

Owner/integration lead records approved environments, accounts, resource scope, spending limits, independent reviewer, and review cadence. Each lane has a concrete first task and a testable result.

A GitHub read does not prove a write route. A CLI version command does not prove an agent/proxy can start. Check the actual required boundary without dummy publications or unapproved changes. An unavailable release route does not block local parser work.

### 4.3 G1 — 72-hour calibration

Require a real source record exported through the candidate path, a safe import into an independently initialized checkout, a supported positive applicability result, and at least one relevant-input rejection. The target can require a fresh origin execution if old receipts lack portable facts.

No copied observer state, mocked CURRENT, synthetic equivalent filesystem identifiers, or schema-only prototype counts as the positive slice. If positivity is not established, preserve the implemented parts and state the exact unresolved dependency.

Publish a revised Day 14/28/42 forecast based on observed work and blockers. This is a decision checkpoint, not an automatic pass.

### 4.4 G2 — Day 14 demonstration

Demonstrate the same immutable evidence across two independent machines with a supported matched profile. Verify the receiving agent actually obtains eligible evidence and does not execute an equivalent check. Include real source/config/dependency changes, a tampered bundle, an unaccepted producer, and incompatible context.

Show two real agent integrations across the supported handoff. Codex and Claude Code are the intended pair. If the second host is unavailable, report the one-host result separately; replacing the second host requires an explicit scope decision and its own tests.

Manual digest-specific acceptance is permissible for the early owned-file demonstration when labelled. Automated trusted CI distribution remains required for M3. Do not call the demonstration the completed public alpha.

### 4.5 G3 — trusted distribution

An approved CI producer generates actual recipe evidence, publishes a verified bundle, and a separate recipient retrieves, authenticates, evaluates, and reuses it. Negative workflow/signer identities, altered subjects, incompatible recipe versions, and required-but-unavailable trust refresh prevent reuse.

Do not certify a generic green CI badge. Do not upload private contents to a public transparency service without explicit review. The portable format and local inspection must remain usable without that particular hosting plan.

### 4.6 G4 — public-alpha release

Mandatory technical requirements:

- G1–G3 demonstrated on the documented profile and final implementation.
- No unresolved known false eligibility, imported-code execution, ownership, or evidence-selection defect.
- Independent review of the portable identity and trust/import boundary.
- Exact packaged bytes pass supported platform regressions and new end-to-end acceptance.
- Old local evidence remains readable; incompatible portable evidence remains conservative.
- Final public package, source target, checksum, upgrade, and installed agent instructions agree.
- Claims distinguish portability, behavior, economics, and untested compatibility.

Separately report field validation: target two or three willing external users, normal tasks, and setup attempts during the program. Their results must not be invented or substituted with internal fixtures. Lack of participants is a field-validation gap, not evidence of a runtime failure; an experimental technical release may still be proposed with that limit explicit. Broad promotion should wait for credible activation and continued-use evidence.

---

## 5. The first 72 hours

The first task is working code at the hardest boundary, not a second large roadmap.

| Time | Core lane | Trust/transport lane | Acceptance lane | Agent-experience lane |
| --- | --- | --- | --- | --- |
| 0–12 h | Trace local-to-portable dependencies; draft minimum contract | Define bounded import and trust cases | Provision/check two environments and baseline cases | Inspect real onboarding and second-agent capacity |
| 12–24 h | Agree D1/D2 and produce a sample source record | Implement parser/inspection and digest binding | Add negative fixtures independently | Correct the canonical setup path without changing semantics |
| 24–48 h | Export origin facts and evaluate a separate checkout | Add explicit digest-scoped import acceptance; prototype CI trust independently | Exercise changed-input and malformed-evidence cases | Test one genuine local cross-agent handoff when capacity permits |
| 48–72 h | Complete or isolate the relocation blocker | Integrate safe import with core | Run the vertical slice and retain every outcome | Test installed candidate instructions; record friction |

At 72 hours, record:

- Exact source commits, artifact identity, and demonstrations completed.
- Remaining absolute-path/runtime/observation assumptions and where they live.
- Time spent implementing, testing, reviewing, waiting for resources, and blocked.
- Model/CI spend and remaining owner-approved capacity.
- Next independently ready tasks and revised dependency-based forecast.

**Forecast rule:** estimate remaining dependent work plus observed integration/test iterations and operational delay. Do not multiply roadmap headings by weeks or assume agents accelerate every bottleneck equally.

If the slice is ahead of schedule, advance the demonstration. If it finds a counterexample, fix or narrow the claimed equivalence explicitly; do not fabricate eligibility to preserve a date.

---

## 6. Parallel execution and ownership

### 6.1 Four lanes, one integration owner

| Lane | Owns | Must not independently redefine |
| --- | --- | --- |
| A — Portable evidence core | Origin representation, portable identity, recipient applicability, local selection integration | Trust policy approved by owner; agent-facing claims |
| B — Transport and trust | Safe import/export boundary, producer verification, one CI artifact path | Core applicability or input completeness |
| C — Adversarial acceptance | Independent counterexamples, machine harness, migrations, end-to-end verification | Expected states merely to fit the implementation |
| D — Agent experience | Two-host activation, guided onboarding, diagnostics, handoff and pilot feedback | Eligibility semantics or host permissions |

The integration owner coordinates interface changes and merges. The product owner resolves scope, accepted trust, resource approvals, and public release decisions. These are roles; one person may hold more than one, but author and independent reviewer should be distinct for critical changes.

Use small PRs and separate worktrees/branches. Claim tasks through the existing issue system, not a new orchestration product. Shared receipt/applicability files have one active implementation owner at a time. Other lanes contribute tests and reviewed interface proposals.

### 6.2 Continuous progress without blind autonomy

At task completion, an agent records its artifact/test evidence, submits review, and takes the next independent ready task within its approved scope. Routine progress reports should not require the owner to type “continue.”

Use scheduled owner review windows—proposed twice daily when practical—for semantic and trust decisions. This is an operating target, not an assumption that the owner has already committed those hours.

When the owner is absent, agents can implement agreed work, test, review, document, and diagnose. They cannot silently decide a new trust exemption, purchase capacity, change global policy, or publish an unapproved artifact.

When blocked, record the exact dependency and move to another ready task. Do not repeat known-denied operations. If no safe independent work remains, stop that lane honestly rather than generating activity for its own sake.

### 6.3 Resources and spending

Before paid execution, the owner records a total cap, daily cap, permitted providers/models, maximum concurrent sessions, and cloud/CI resource scope. No numerical budget is invented by this plan.

Track successful task completion, retries, tests, spend, and idle/blocked time. More agents are justified only when independent ready work exists. Increase capacity experimentally; do not assume linear acceleration from sixteen agents.

### 6.4 Checkpoints instead of approval churn

Automate deterministic CI, schema checks, formatting, and independent agent review. Use fast targeted tests per commit and full matrices at relevant integration/release gates. Never remove necessary assertions merely to reduce latency.

Do not replay the entire historical acceptance campaign after excluded documentation changes. Tie evidence to code, policy bytes, environment, and artifact identity so valid results can be reused honestly.

### 6.5 Owner autonomy amendment — standing authority

This amendment is owner-provided operating instruction for the existing
REDUE-PE-001 goal. It supersedes earlier per-command, exact-helper-hash and
single-attempt approval requirements for routine engineering **within the
existing approved resource and trust scope**. It does not replace the objective,
erase failed attempts, change host policy, supply capacity or weaken acceptance.

**Authorized work.** The integration owner may inspect, implement, refactor,
document and test the agreed functionality; delegate bounded work within approved
included capacity using isolated worktrees and one integration owner; repair
fixtures, launchers, collectors and diagnostics; relocate owned test code and
update path/hash bindings while preserving protected credentials/state. Isolated
project/test configuration changes may preserve approved security properties
without expanding access. Diagnostics, deterministic tests, model evaluations and
approved CI may run once their actual prerequisites and included capacity are
established. Only owned experimental artifacts may be managed, within the current
storage/retention limits. Task-branch commits/pushes, PR preparation and reviewed
integration are authorized. Routine in-scope PRs may merge through the normal
repository process when required checks pass for the relevant revision,
independent critical-boundary review is complete, and no unresolved correctness
blocker remains; never bypass protection or substitute author self-review.
Public package publication, release tags and distribution changes still need
specific owner approval. Before a push/merge, inspect automatically triggered
signing/artifact workflows against existing signing authority and current storage
reservations; routine source authority does not expand producer trust.

**Review changes rather than escalating hashes.** A changed helper hash is an
audit event, not automatically an owner decision. Inspect the diff, update exact
identities/manifests, run affected tests and obtain independent security/evidence
review where needed, then proceed within existing authority. Never substitute
bytes under an old identity. Previously approved producer identities, signing
permissions and accepted-producer rules do not expand when helpers/artifacts
change. Routine filenames, commands, pins and formatting need no fresh consent.

**Failure is engineering work.** Preserve every failed, unknown and successful
attempt. Diagnose, repair and rerun within scope/capacity, with new evidence or
independent review after repeated failures; never retry to select a preferred
score. Do not retry or bypass an unchanged explicit host denial. A supported,
permitted equivalent may replace unavailable automation only when it preserves
the experiment, not as a route around denied authority. Do not build a general
terminal controller. When manual interaction is unavoidable, complete permitted
preparation and provide one consolidated prevalidated procedure. Distinguish a
denial of automation from prohibition of the underlying action.

**Owner decisions.** Interrupt only for new spending/paid infrastructure or an
unconfirmed charging route; owner-required login/2FA, secret provisioning or
account/administrator action; broader filesystem/network/credential/signing/
producer-trust authority; material goal/verification/support changes; destructive
user-data/history/shared-Git changes; public release; or a consequential unresolved
choice with materially different cost/risk/product outcomes. Use approved existing
accounts/entitlements. Additional spending remains $0. Personal-use approval is
not proof of an unknown Actions billing entitlement; do not buy capacity.

**Lane blockers and continuity.** Record an exact missing prerequisite once,
together with the smallest owner action and recommendation, then take valuable
unblocked critical-path work. Do not repeat unchanged resource requests, rerun
broad CI or create documents to appear busy. Overall BLOCKED requires no safe,
useful remaining work within scope/budget and the goal service’s consecutive-turn
audit. Preserve a resumable handoff; never fabricate progress or acceptance.

**Trust remains unchanged.** Evidence travels; CURRENT is independently
established by the recipient. Preserve assertions, original observation,
conflicting-evidence handling and producer authentication. Keep real execution,
harness mocks, machine acceptance, model behavior and economics distinct. Missing
evidence is UNKNOWN. No credential copying, secret logging, global security
weakening, production changes or automatic pilot upgrades. Isolate correctness
findings and repair them before unsafe delivery.

**Minimal interruptions.** Update the existing tracker/resume at meaningful
checkpoints. Reports are informational and need no acknowledgment. Bundle genuine
owner actions: exact action, why authority is insufficient, recommendation,
cost/risk, blocked task and work continuing. Use supported Codex Auto-review for
eligible operations when installed version/effective policy permit it. Keep
sandbox/reviewer safeguards; never rewrite reviewer policy to approve everything
or treat Auto-review as proof of safety or an override of another tool’s denial.

**Immediate application.** The repaired native diagnostic/checker can proceed
without another single-attempt consent once its effective host prerequisites and
security properties hold. This amendment supplies neither denied Terminal
control nor native enforcement evidence nor Copilot included capacity. Finish
permitted preparation, consolidate unavoidable owner actions, and keep all
unblocked implementation/review tasks moving. Original Day0, profile decisions,
spending/storage limits, immutable receipts and gates remain in force.

---

## 7. Acceptance and adversarial testing

Maintain one versioned portability suite with an expanding boundary matrix. Preserve prior regression evidence, but do not create a new bespoke benchmark system for each task.

### 7.1 Minimum matrix

| ID | Scenario | Required result |
| --- | --- | --- |
| V01 | Same local receipt, new session | Existing supported reuse remains correct. |
| V02 | Different agent, same checkout | Actual host reads guidance and consumes eligible evidence correctly. |
| V03 | Separate checkout, matching supported inputs | Recipient independently establishes eligibility without copied local state. |
| V04 | Independent matching machine | Same evidence identity can be reused after recipient validation. |
| V05 | Relevant source/configuration change | Non-reuse with accurate retained historical outcome. |
| V06 | Added/removed/renamed file or newly present resolution candidate | Membership/absence differences are detected. |
| V07 | Compiler, dependency, generated declaration, or runtime mismatch | Incompatible or unknown evidence does not become eligible. |
| V08 | Different path case, symlink topology, or unsupported external root | Apply only a justified equivalence rule; otherwise deny reuse. |
| V09 | Modified payload, digest mismatch, unsupported schema | Reject authorization; preserve existing local state. |
| V10 | Unknown signer, wrong issuer/workflow/ref, removed trust | Do not authorize reuse. |
| V11 | Imported commands, plugins, URLs, or malicious paths | No automatic execution, fetch, permission change, or arbitrary write. |
| V12 | Oversized/truncated input or decompression/parse abuse | Bounded failure without partial authoritative state. |
| V13 | Missing origin observation or unstable original run | Import/recovery cannot repair the original execution. |
| V14 | Observer loss, root replacement, or edits during recipient validation | No stale green; retain conservative fallback and continuity rules. |
| V15 | Known applicable failure followed by replayed old PASS | No arrival-order resurrection of green. |
| V16 | Unordered conflicting trusted producers | Apply explicit conflict policy; do not infer global order from clocks. |
| V17 | Untrusted conflicting record | Cannot overwrite/poison the local selected receipt. |
| V18 | Old local store and unsupported new portable interpretation | Preserve history; withhold unsupported reuse; no silent conversion. |
| V19 | Interrupted import/receipt-selection write | Preserve ownership and conservative selection/recovery behavior. |
| V20 | Explicit fresh execution or explicit npm command | Run the requested obligation; do not substitute imported compiler evidence. |
| V21 | Required trust refresh unavailable; offline identified receipt | Enforce each declared mode; never claim unseen remote freshness. |
| V22 | CI retry/filter/cache or workflow success without executed check | Do not infer the required execution from an outer success. |

Negative expectations are non-reuse, not necessarily one identical freshness label for all causes. Existing local semantic guarantees remain exact; new cases need documented structured reasons.

### 7.2 Real agent behavior is a separate gate

A fresh shell running scripted CLI commands is not an agent trial. A preflight response is not evidence that the model saw eligibility. An agent saying “reused” is not proof that no equivalent command executed.

Use actual independent sessions, ordinary tasks without REDUE reminders, tool/process traces, and receipt identities. Predeclare a small matrix and call budget. Record all attempts and retries. A failed expected precondition launches zero models.

Keep environmental eligibility, agent-visible eligibility, actual reuse, and net saved work separate. Include an explicit fresh-run request and an unavailable-evidence case. Finite samples with zero unsafe reuse do not establish universal safety or compliance.

### 7.3 Scope of platform claims

Continue existing macOS/Linux/Windows regression and exact-package checks where shared code changes. New machine-portability eligibility is enabled only on profiles actually supported and tested. Passing package installation on an OS does not demonstrate model behavior or cross-OS evidence equivalence.

---

## 8. Economics and real-user evidence

### 8.1 Measure the complete path

Keep these costs separate and visible:

- Source-side evidence creation and required reruns.
- Export/signing/upload and explicit retrieval.
- Receiver import, first input discovery, and first applicability decision.
- Warm local decisions and subsequent relevant invalidation.
- Agent tool overhead, observer startup/recovery, and policy updates.

Do not amortize cold-start costs away without stating how many actual reuses occurred. Do not use a warm second-machine result as the cost of a fresh machine's first encounter.

A useful accounting model is:

```text
Net verification benefit
= cost of executions genuinely avoided
− extra source recording cost
− export/transport/trust-validation cost
− recipient discovery/decision cost
− additional setup, rerun, and recovery cost attributable to REDUE
```

Counterfactual avoided execution requires a suitable baseline or explicit user context. A CURRENT query, inspection-only task, or artifact download is not automatically saved work. Do not infer CPU, energy, or whole-agent speedup from wall-clock CLI improvements.

### 8.2 Working targets, not fabricated guarantees

For users inside the advertised boundary, target first useful evidence within approximately ten minutes without maintainer intervention. Measure installation and initial check duration separately so slow legitimate compilation is visible.

For a warm matched recipient, aim for a complete reuse decision materially cheaper than running the corresponding check; a ratio around one-half or better is an initial product target, not permission to omit validation.

Demonstrate at least one complete observed transfer/reuse sequence with a meaningful benefit before promoting time savings. If the technical milestone works but its economics do not, label that result and adjust the target workflow rather than changing the benchmark mix until it wins.

### 8.3 Pilot during development

Keep existing alpha.10 users on their fixed build. Invite two or three willing participants to explicitly opt into portability candidates when ready. The owner supplies participants and approved projects; agents do not contact people or upload private repositories automatically.

Collect voluntary, reviewed summaries: setup friction, actual obligations, evidence seen, real reuse/execution, observed cost, and whether the user chose to continue. Use existing local evidence where participants agree. No telemetry service or automatic transcript collection is part of this plan.

Internal genuine-work dogfooding may proceed in parallel, labelled internal. Do not create comment edits or session restarts solely to inflate natural reuse.

### 8.4 Launch story

The first public demonstration should show the supported story plainly: source execution, transfer, independent receiving agent, local applicability check, legitimate reuse, and relevant-change rejection. Label edits and time compression. Do not show qualified tests or browser evidence before those contracts exist.

A technically ready experimental release and a broad promotional launch are different decisions. GitHub stars and retention cannot be promised by a delivery date. Broad promotion should use real supported setup results and truthful user stories, not the number of alpha versions released.

---

## 9. Review, release, and compatibility

### 9.1 Preserve the local product

Keep the existing receipt store and its ownership/selection safeguards. Add a portable representation and explicit importer rather than rebuilding the state engine. Imported candidates should not overwrite immutable local invocation files or selected outcomes as a side effect of parsing.

Additive schema evolution is preferred, but semantic incompatibility must be versioned. Unknown recipe interpretations cannot authorize reuse. Define reader compatibility and migration limits before advertising a stable format.

Preserve explicit setup, safe managed-instruction updates, and removal that does not delete user edits or receipts. Package upgrades alone must not be represented as automatically updating project instructions.

### 9.2 Independent review before shared authority

Require an independent review of origin completeness, portable identity, importer safety, producer trust, conflict handling, and receipt selection before external machine-sharing release. Reviewers challenge assumptions and attack cases; passing CI is evidence, not the entire argument.

No known false eligibility or arbitrary imported-code execution is an acceptable alpha limitation. Unsupported environments are acceptable when plainly identified and conservative.

### 9.3 One coherent release per capability

Use small PRs but avoid one mandatory public release per PR. Keep baseline, evaluation artifacts, and publishable release artifacts distinct. Final version changes produce different bytes and require their own checksum and exact-artifact validation.

At a release gate: recheck repository state and namespace/version, inspect package contents, test the final artifact on required platforms, verify producer/trust fixtures, obtain owner approval, publish once through the supported route, and verify public bytes/install/upgrade/tags. Never substitute a newly built artifact under an old checksum or published version.

Prepare workflow-bound npm trusted publishing as a bounded maintenance task, using current official requirements. It reduces reliance on long-lived publish credentials but does not replace explicit release authorization, account setup, or artifact validation. Keep it independent from the evidence-format critical path. [S4]

Do not change managed host controls, weaken 2FA, or create bypass tokens after a denied operation. Route the exact prerequisite to the owner and continue independent permitted work.

---

## 10. Risks and escalation rules

| Risk | Early detection | Response without changing the claim silently |
| --- | --- | --- |
| Local identities are deeply coupled | First 72-hour relocation slice | Isolate portable comparison; retain local identity; update forecast with the concrete dependency. |
| Original receipts lack required facts | Export design and fresh-source test | Require a new origin baseline; preserve old records as local/inspection-only. |
| Compiler/runtime equivalence is incomplete | Source review plus adversarial differences | Tighten the initial profile or add the missing observation; do not strip arbitrary environment fields. |
| Trusted producer can sign the wrong obligation | CI execution provenance tests | Bind actual command/recipe/outcome; constrain signer/workflow authority. |
| Imported PASS hides a known failure | Conflict/replay tests before distributed use | Keep local/imported selection separate; explicit trust/order policy; conservative unresolved conflict. |
| Shared evidence leaks private data | Export preview and privacy tests | Minimize payload; approved private transport; inspection-only where redaction removes required facts. |
| Host/account restrictions stop evaluation | G0 startup and exact-context preflights | Owner-provisioned supported route; no repeated denials or broader permissions as a shortcut. |
| Parallel agents duplicate work | Task claims and integration metrics | One owner per shared file/semantic change; add agents only for independent ready tasks. |
| Whole-flow economics disappoint | Cold/warm complete-path measurements | Identify the actual cost/workload mismatch; keep technical and value claims separate. |
| External pilot starts late | Recruit during Week 1 | Keep engineering moving; label field status honestly; do not manufacture adoption. |

**Escalate immediately:** known false eligibility, untrusted code execution, evidence overwrite, private-data exposure, or a semantic disagreement about trust/selection.

**Checkpoint rule:** after two materially different unsuccessful attempts at the same bounded approach, document the counterexample and alternatives before continuing that lane. This prevents retry loops; it is not a rule to abandon difficult engineering. Independent permitted work continues.

**Day 14 rule:** if the two-machine story is not demonstrated, explain the remaining critical dependency and its evidence. Do not relabel two local processes as machines.

**Day 28 rule:** if mandatory technical gates remain open, return a candidate with exact incomplete claims and a revised plan. Use contingency only for named work. Do not quietly stretch the project to sixteen weeks or declare a weaker result the same milestone.

---

## 11. After this milestone

The four-week target establishes one defensible contract across the chosen boundaries. It does not finish the larger product vision.

After the alpha, choose one next priority from observed use:

| Evidence from use | Likely next step |
| --- | --- |
| People cannot qualify ordinary toolchains | A repeatable compiler/runtime conformance process and one target-backed support extension |
| Reuse is valuable but setup is difficult | Simplify the existing explicit setup and diagnostic path |
| Tests dominate verification cost | Investigate one bounded structured test contract; do not infer completeness from imports alone |
| Teams repeatedly share the same bundles manually | Add one convenient discovery/retention/access-control layer over the portable format |
| Reviewers value the explanation more than latency | Improve multi-obligation handoff summaries without inventing coverage |
| Real tasks rarely reuse evidence | Revisit target workflow and product value before another cache optimization |

Later directions include more verification providers, CI interoperability, browser artifacts, explicit review obligations, and optional team services. Keep the local verifier and portable semantics open and independently inspectable.

Do not attach an unsupported calendar promise to this entire frontier. Estimate the next concrete increment after the first portable workflow and its field results. The vision remains broad; the implementation program advances through completed, useful boundaries.

---

## 12. Tracking and immediate kickoff

### 12.1 One source of truth

Commit this document at the agreed canonical path. The task tracker links to it; it does not duplicate its roadmap. Keep current gate status near the top and link detailed acceptance records rather than repeatedly appending every historical attempt here.

| Gate | Initial status | Evidence / owner decision |
| --- | --- | --- |
| G0 — resources and task readiness | Not started | To be recorded at kickoff |
| G1 — 72-hour vertical slice | Not started | Actual implementation and test evidence required |
| G2 — two-agent/two-machine demonstration | Not started | Actual independent hosts and traces required |
| G3 — trusted CI distribution | Not started | Producer verification and recipient acceptance required |
| G4 — scoped public alpha | Not started | Final integrated review and artifact checks required |
| External natural-use evidence | Not started at baseline | Keep separate from controlled acceptance |

### 12.2 Initial backlog

| ID | Deliverable | Lane | Depends on |
| --- | --- | --- | --- |
| PE-01 | Capabilities, selected profile, budget, review cadence | Owner/integration + C | None |
| PE-02 | D1/D2/D3 minimum decisions and conformance cases | A/B/C | Baseline inspection |
| PE-03 | Portable origin record and export | A | PE-02 minimum interface |
| PE-04 | Safe parser, inspection, explicit scoped import | B | PE-02 minimum interface |
| PE-05 | Independent-checkout applicability | A + C | PE-03/04 |
| PE-06 | Canonical onboarding and second-agent local handoff | D + C | PE-01; current engine |
| PE-07 | Matched-profile second-machine evaluation | A + C | PE-05; second environment |
| PE-08 | Accepted-producer verification and conflict tests | B + C | PE-02; evolves alongside PE-03/04 |
| PE-09 | One authenticated CI producer/artifact flow | B + C | PE-03/04/08; integrates with PE-07 |
| PE-10 | Evidence-backed handoff and installed upgrade path | D | PE-04/05/06 |
| PE-11 | Independent integrated review and adversarial matrix | C + reviewer | Incremental from PE-02; final after PE-07/09 |
| PE-12 | Final artifact and limited public-alpha release | Integration + owner | Mandatory G4 gates |

Tasks should usually represent a few hours to one day of independently testable progress. Split larger tasks before assigning them; do not make exact hour estimates a substitute for inspecting the code.

Each task records:

```text
Task ID and user/technical outcome:
Owner and independent reviewer:
Dependencies and branch:
Files/interfaces owned:
Acceptance cases and commands:
Non-goals:
Actual commit/artifact evidence:
Observed failures and remaining uncertainty:
Elapsed implementation/test/review/blocked time:
Spend and capacity used:
Next ready task or exact escalation:
```

No task is DONE solely because code was generated, a file exists, or a model described success.

### 12.3 Short implementer kickoff

> Read this plan and the current repository. Verify the baseline and changes since it. Establish G0 through the owner's supported resources, then start PE-02 through PE-06 in the four bounded lanes. Build the real export/import/relocation slice within the first 72 hours; do not finish with another roadmap. Keep origin evidence immutable, local observation independent, and trust explicit. Record every counterexample and revise the forecast from working code. Take independent ready tasks while review or infrastructure is pending. Do not broaden permissions, spending, scope, or publication authority without the required owner decision.

### 12.4 Plan revision log

| Revision | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-10 | Establish accelerated Day 14 demonstration / Day 28 alpha / Day 42 contingency plan, with a 72-hour calibration and four parallel lanes. |

---

## 13. Sources and estimate rationale

### 13.1 How to read the estimates

The schedule comes from the remaining REDUE scope, existing engine, parallel work decomposition, and intended operating model. Public agent-engineering examples support ambitious hours/days/weeks planning, but do not establish a probability that this project finishes by Day 28.

Anthropic reported sixteen agents building a substantial C compiler over approximately two weeks, with nearly 2,000 sessions and about $20,000 of API use; it also documented important limitations and coordination problems. That is a capability example, not REDUE's budget or duration forecast. [E1]

Cursor reported selected long-running tasks taking approximately 25–36 hours and emphasized planning, follow-through, and cross-agent checking. These are vendor-reported examples rather than a controlled sample. [E2]

OpenAI's agent-first engineering report describes the importance of harnesses, review, and repository structure at a much larger product scale. It is evidence about workflow design, not a direct conversion factor for our plan. [E3]

METR's February 2026 update explains why its newer developer-productivity measurements cannot reliably yield a precise current speedup estimate, including selection and concurrent-work measurement problems. Do not claim a universal “10×” or use task duration benchmarks as a calendar formula. [E4]

Bazel's remote-caching documentation identifies execution-environment, untracked-tool, and concurrent-change concerns. REDUE should learn from these boundaries rather than equate matching task names with portable applicability. [S6]

The 72-hour prototype is therefore the first project-specific scheduling instrument. Costs and gates remain measurable; optimism does not replace evidence.

### 13.2 Repository baseline — pinned references

These support statements about what existed at planning time. They are not evidence that the proposed portable capabilities are implemented.

- **[R1]** [REDUE changelog at inspected main](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/CHANGELOG.md).
- **[R2]** [Fixed alpha.10 pilot guide and support boundary](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/docs/user/pilot.md).
- **[R3]** [JSON interface and reuse rules](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/docs/user/json.md).
- **[R4]** [Receipt persistence and selection](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/src/state-store.mjs).
- **[R5]** [Checkout/config-derived local state identity](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/src/project-location.mjs).
- **[R6]** [Caller context and execution boundary](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/src/cli.mjs).
- **[R7]** [Existing security boundary](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/SECURITY.md).
- **[R8]** [Controlled workflow economics and limitations](https://github.com/msiric/redue/blob/b4f286034f43021a74f1babf2c1d0fee5df2a9e5/docs/acceptance/unavailable-recording.md).

### 13.3 Standards and official implementation references

Recheck deployed versions and supported mechanisms when implementing; these references were consulted on 2026-10-10.

- **[S1]** [in-toto statement specification](https://raw.githubusercontent.com/in-toto/attestation/main/spec/v1/statement.md): immutable subjects and typed predicates.
- **[S2]** [Sigstore verification documentation](https://docs.sigstore.dev/cosign/verifying/verify/): identity, issuer, payload, and signature verification mechanisms.
- **[S3]** [GitHub artifact-attestation action](https://github.com/actions/attest): an existing custom-attestation integration; verify current repository-plan and runner constraints.
- **[S4]** [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/): workflow-bound OIDC publication; distinct from REDUE evidence trust.
- **[S5]** [Agent Skills specification](https://agentskills.io/specification): shared procedural guidance; actual host behavior still requires testing.
- **[S6]** [Bazel remote caching](https://bazel.build/remote/caching): existing content-based task reuse and limitations relevant to environment/input completeness.

### 13.4 Agent-engineering planning references

- **[E1]** [Anthropic — Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler), 2026-02-05.
- **[E2]** [Cursor — Expanding our long-running agents research preview](https://cursor.com/blog/long-running-agents), 2026-02-12.
- **[E3]** [OpenAI — Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/), 2026-02-11.
- **[E4]** [METR — We are Changing our Developer Productivity Experiment Design](https://metr.org/blog/2026-02-24-uplift-update/), 2026-02-24.

---

**Program rule:** move one defensible verification contract across increasingly difficult boundaries. Make each increment useful, keep the engine's claims precise, and revise the schedule from observed progress—not from either conventional staffing assumptions or unmeasured faith in agent speed.
