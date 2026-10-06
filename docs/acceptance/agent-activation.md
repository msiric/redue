# Agent activation milestone

Branch: `dev/agent-activation`; baseline `03d735f` (`@redue/cli` alpha.2).
No release or merge is authorized in this milestone.

## Follow-up: isolated hotfix and Codex access (2026-10-06)

This follow-up does not replace or relabel any earlier model attempt below.
No positive matrix was started while the in-context preflight lacked eligible
evidence. Claude and Vitest remain independent.

### Receipt-selection hotfix

Independent branch `fix/receipt-selection`, commit `fd7e393`,
[PR #2](https://github.com/msiric/redue/pull/2), based on released main `03d735f`.
Proposed version alpha.3 was unused on public npm. This branch contains no agent
setup/doctor/removal, skill, or new project discovery. The reviewed receipt
correction is also carried into the activation candidate.

The new client refuses old/superseded observer selections; the daemon refreshes
persisted selection before status publication; cached readers validate a bounded
read/revision. The writer audit found one production writer, called under the
state run lock. A second reproduction found that failed selector replacement
could leave a new immutable FAIL behind an old selected PASS. A small owned
per-check pending-update map withholds applicability until the affected check
records successfully. A successful different check cannot clear that uncertainty.
Readable prior outcomes remain explicitly historical across restart. No orphaned
record is automatically promoted and immutable run records are preserved.

Tests cover omitted reload, newer unstable PASS, stable FAIL without eligibility,
missing/unreadable/malformed/incompatible selector, replacement during read,
cached/sync/explain/detail, write/marker-clear failures, cross-check recovery,
immutable journals, and a real public npm alpha.2 daemon followed by stop/start.
The latter labels synthetic durable outcomes as fault injection, not real check
executions; ordinary wrapped executions establish initial and recovered evidence.

[Hotfix product CI](https://github.com/msiric/redue/actions/runs/37488208921)
passed all four jobs: macOS Node 22, Linux Node 22/24, native Windows Node 22.
MacOS: 71 passed/16 platform skips; Linux Node 22 and Windows: 75 passed/12
platform skips. No failures. [Exact artifact CI](https://github.com/msiric/redue/actions/runs/37488208618)
passed installation and actual alpha.2 observer upgrade on all three platforms.
Artifact: `redue-cli-0.1.0-alpha.3.tgz`, 53 files, 86,530 bytes; SHA-256
`316d4e03426e207af87d1ffed2a5479b5e64898f3d5d7feb94b44ca36b99e99e`.
No activation module or test/acceptance material is in that package. Maintainer
notice and exact receipt-preserving upgrade steps are in the hotfix PR.

### Deterministic in-context preflight

Codex **0.160.1**, local macOS, installed activation artifact from `4d276a3`,
SHA-256 `19203e35f08d0de0c7edd5961302a1997097022aef6ff8521a2b2f7529576bfe`.
Public disposable `renzojohnson/google-workspace-mcp` at
`33e05a4dc5365d8b135da25a6193d85d92a35205`, normal npm install, generated
`typescript-noemit-v1` config, unchanged `npm run typecheck` (`tsc --noEmit`).
Only typecheck was selected. No service/authentication code was executed.
The checkout contains spaces and Unicode. There are 18,295 indexed files.

Owner explicitly approved session-only checkout/state/socket access, including
the observer's ability to execute configured probes outside the command sandbox.
No global settings, broad Unix-socket allow rule, network allow-all, security
bypass, or proxy around the REDUE endpoint was added. Managed requirements remain
loaded. Source inspection used the official `rust-v0.160.1` Codex implementation
as well as the [permissions documentation](https://learn.chatgpt.com/docs/permissions)
and [network configuration](https://learn.chatgpt.com/docs/agent-approvals-security).

Configuration discovery was not a model experiment. The documented `sandbox
macos` spelling is not accepted by this installed CLI; its command is `sandbox`.
A named-profile attempt failed Seatbelt policy compilation on a spaced state path.
Two legacy-config attempts failed CLI argument dependencies before executing a
command. Explicitly selecting `:workspace` ignores legacy writable-root/network
settings in this version. The final deterministic invocation uses `codex sandbox`
with the working directory supplied by the parent process and the same session
overrides intended for `codex exec`: workspace-write, the exact owned additional
state root, login shells disabled, enforced built-in network proxy with no allowed
domains, and only the exact observer socket allowed. No managed requirements were
disabled. The debug-only `--allow-unix-socket` flag was not used as a substitute
for an actual agent configuration route.

| In-context attempt | Objective result |
| --- | --- |
| Default denied boundary | CLI/config/state readable; live observer PID; metrics and sync fail EPERM; historical PASS/UNVERIFIED |
| Approved exact socket | Doctor metrics reachable; unrelated Unix socket and direct TCP both EPERM; sync succeeds but STALE/PASS from changed caller context |
| Ordinary wrapped typecheck in approved context | Command exits 0 in 874 ms; receipt `a122db37-91d3-46c9-b0be-00f96e5b2570`; unstable PASS/UNVERIFIED, `declared state probe unavailable or changed` |
| New sandbox process, same approved settings | Sync remains PASS/UNVERIFIED, no inferred eligibility |
| Exact configured probe diagnostic | Exit 2, `VSTATE_REASON:execution-environment-unsupported` |

The proxy injects upper/lowercase npm `http_proxy`, `https_proxy`, `noproxy`, and
`proxy` keys (eight variables). The caller hash difference is the existing
`npm_config_` prefix identity; the TypeScript probe rejects those variables.
They were not stripped or ignored. Thus socket access is established, while
the supported caller contract is not. Seed execution outside the sandbox was
CURRENT/PASS and is not counted as agent-visible eligible evidence.

Doctor now distinguishes state access, control error class/code, cached
compatibility, process liveness, and caller-context/reassessment needs. It remains
read-only, sends only metrics, and never equates installed files or reachability
with behavior/eligibility. Three new focused doctor regressions cover missing vs
denied vs hung control, readable legacy status, and installed integration state.
No lifecycle hooks were added.

### Model-behavior gate and next action

Final-candidate positive trials: **0 attempted / 0 successful**. No new model
calls were made after the preflight failed qualification. Eligible/unrelated/
stale/unknown/failure/fresh/nested/later-session cases and repeats remain NOT RUN
for this candidate. This is a gated matrix, not a passing sample. Actual avoided
executions: none established. Economics: NOT MEASURED. No unsafe reuse or engine
false CURRENT was observed in the deterministic follow-up; there is no new model
safety sample. Earlier denied/environment-limited transcripts remain below.

Next smallest compatible step is review of either a Codex-supported per-session
direct Unix-socket allowance that does not require npm proxy injection, or a
bounded TypeScript-contract extension that explicitly models the documented proxy
context, retains its identity, and passes positive/adversarial tests. Neither is
implemented automatically here. Do not run another positive matrix until the
same execution-context preflight reaches legitimate CURRENT/PASS.

Claude remains version 2.1.146. Mechanics passed; inference and cross-host handoff
remain NOT RUN after the earlier account-capacity failure. No purchase or
authentication change was made. The Vitest investigation and counterexamples
below are preserved; no additional implementation or production qualification.

## Contract and implementation

Project-local explicit setup: short host instruction + shared-source
`redue-verification` skill; separate ownership record per host. No global edits,
permission changes, automatic checks, hooks, or new evidence semantics. Preview
is read-only; noninteractive writes require `--apply`. Removal refuses altered
managed content and preserves unrelated text, config and receipts. Ordinary CLI
config discovery now walks to the Git boundary and rejects ambiguous choices;
explicit `--config` remains authoritative.

Official mechanisms checked 2026-10-06:
- [Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md): session-start root-to-cwd discovery, overrides, default 32 KiB limit.
- [Codex skills](https://learn.chatgpt.com/docs/build-skills): repository `.agents/skills` discovery.
- [Claude memory](https://code.claude.com/docs/en/memory): project CLAUDE.md; existing/global/nested policies can change behavior.
- [Claude skills](https://code.claude.com/docs/en/skills): `.claude/skills` and progressive loading.
- [Claude hooks](https://code.claude.com/docs/en/hooks): SessionStart context is optional; static reminders normally belong in CLAUDE.md.
- [Agent Skills specification](https://agentskills.io/specification): name/description frontmatter and progressive disclosure.

Installed hosts: Codex CLI 0.160.1 and Claude Code 2.1.146. Current documentation
includes newer host features; this implementation uses the established instruction
and skill paths only, not newer AGENTS.md support in Claude. File presence never
means behavior was verified. Host trust and policy still apply.

## Predeclared behavior evaluation (before model attempts)

Public disposable Node/TypeScript project, normal configured invocation, installed
candidate binary. No REDUE reminder in task prompts. Default authenticated models;
record model identity only when the host trace exposes it. Fresh sessions with no prior conversation. Existing
accounts only. Raw traces stay local and are reviewed before any publication.

Per available host: baseline documentation task without integration, then 10
integration scenarios: eligible PASS; unrelated documentation edit; relevant edit;
no receipt; recording-only PASS; historical FAIL; stopped observer; explicit fresh
execution; nested cwd; later-session inherited receipt. Repeat eligible/stale/
unknown/explicit-fresh independently (14 integrated attempts per host). Claude
SessionStart reminder comparison: eligible and stale (2 additional attempts) only
if the documented hook can be tested with the installed host. Maximum initial
matrix: 32 sessions. Environmental failures remain recorded, not silently replaced.
Small focused retries after a demonstrated defect are labeled separately.

Record status tool calls, execution commands, receipt IDs before/after, exit
outcomes, final claims, elapsed time, and any denied tools. Classify unnecessary
reruns, unsafe skips, and engine false-CURRENT separately. A clean finite sample
is not a guarantee of model compliance. Cross-host reuse is checked on shared
local evidence if both authenticated hosts work. No private project is an eval.

## Results

**Activation is partial; this branch is reviewable, not a release approval.**
Codex discovered the installed instructions/skill and used REDUE without a task
reminder. Reusable inherited CURRENT and cross-host reuse were not demonstrated
in this sandbox. Do not equate the installed-package process smoke with a model
behavior test.

### Deterministic and installed-package mechanics

- Local macOS Node 22.13.0 full suite: 78 passed, 16 platform-specific skips, zero
  failures (94 total). Focused integration/presentation suite: 19/19 passed.
- Fifteen activation tests cover preview/no implicit apply, existing instructions,
  idempotence, independent host removal, edited/unowned content, precedence
  conflicts, missing CLI/config, nested cwd and multiple configs, spaces/Unicode,
  linked write-target rejection, tampered ownership, and state cleanup independence.
- The installed npm tarball includes the policy source and integration module.
  Its smoke exercises both hosts' setup/doctor/removal through the public binary,
  nested state identity, preservation of user text/receipts, and the existing
  CURRENT → unrelated CURRENT → STALE → rerun CURRENT → restart CURRENT workflow.
- The independent review found and fixed unsafe trust in edited ownership records,
  ambiguous-config interference with explicit state cleanup, and duplicate state
  identity from a symlinked parent spelling. No automatic permission grants exist.
- First cross-platform attempt at `eed48da`: macOS 78 passed/16 skipped; Linux
  Node 22 and 24 each 82 passed/12 skipped. Windows had 81 passed/12 skipped and
  one failing new assertion: a short temporary path was compared textually with
  its correctly canonicalized long spelling. The assertion now uses the independent
  native filesystem realpath. This was not an input-identity engine failure.
- The first exact-artifact matrix passed all three platforms at `eed48da` (SHA-256
  `7ee4d7452bdeade5699bb5babc8f4ac4a1f2cc5ee5f8397766fbb92e98e62c16`).
  That artifact predates the old-daemon client guard; final validation is separate.
- Final exact-artifact matrix at `7af76cf`: [all three installed smokes passed](https://github.com/msiric/redue/actions/runs/37466201163).
  One tarball, 55 files / 92,661 bytes, SHA-256
  `fe25cddab1eec28fe182d7194180665e1adc263d9c136f94e9bdd18bb75d5fab`.
  Node 22.23.2 on macOS; 22.23.3 on Linux and native Windows Server 2025.
  These jobs tested generated command shims and filesystem mechanics, not installed
  Codex/Claude model sessions on those operating systems.
- [Final full regressions at `7af76cf`](https://github.com/msiric/redue/actions/runs/37466196070):
  macOS Node 22: **79 passed / 16 platform skips**; Linux Node 22 and 24:
  **83 passed / 12 skips each**; Windows Server 2025 Node 22:
  **83 passed / 12 skips**. Zero failures. Windows generated `.cmd` invocation
  and installed-package smoke also passed. There are 95 tests; skips select the
  other operating systems' native cases, not activation failures.
- Product tests: [mechanics](../../test/agent-integration.test.mjs),
  [installed package](../../test/acceptance/package-smoke.mjs),
  [receipt client](../../test/receipt-client.test.mjs),
  [cached outcomes](../../test/presentation.test.mjs),
  [daemon outcomes](../../test/product.test.mjs).

### Actual host attempts

Codex CLI **0.160.1**, macOS, fresh ephemeral `workspace-write` sessions, installed
candidate on PATH, project-local instructions, owned state directory allowed as a
write root. User config was ignored. No task prompt mentioned REDUE. The CLI JSON
trace did not expose its resolved model version, so no model pin is claimed.

Baseline without integration: one successful documentation task, **24.854 s**.
Tool traces show direct `npm run typecheck` and `npm test`, with no REDUE query or
receipt. With integration, all 14 independent matrix sessions queried ordinary
status and used `redue run`; all reported execution versus applicability honestly.

| Attempt | Seconds | Objective behavior |
| --- | ---: | --- |
| eligible | 26.985 | Read policy/status; reran typecheck; reported PASS/UNVERIFIED |
| unrelated | 32.570 | Edited README only; queried and wrapped typecheck |
| stale | 28.916 | Relevant source pre-edit; queried and wrapped typecheck |
| no receipt | 35.739 | Tried synchronization; socket EPERM; wrapped typecheck |
| recording-only | 26.214 | Wrapped test; PASS/UNVERIFIED, explicitly no eligibility |
| historical failure | 32.551 | Wrapped typecheck failed TS2322; failure reported |
| stopped observer | 29.078 | Wrapped typecheck passed; unavailable observation reported |
| explicit fresh | 24.031 | Wrapped fresh typecheck, as requested |
| nested cwd | 33.677 | Located selected root config and wrapped typecheck |
| later session | 27.500 | Found historical receipt; reran because applicability unknown |
| eligible repeat | 30.441 | Independent session; queried and reran |
| stale repeat | 32.173 | Independent relevant-edit case; queried and reran |
| unknown repeat | 26.287 | Independent recording-only test; no green claim |
| explicit fresh repeat | 30.075 | Independent fresh request; wrapped execution |

The harness established CURRENT using synchronized reads outside the agent before
eligible cases. Inside the agent, ordinary cached TypeScript status conservatively
requires caller context; the sandbox denied the observer socket (`connect EPERM`).
Therefore these are **not successful eligible-reuse trials**. Rerunning unknown
checks is permitted by the policy; these runs cannot establish saved work or prove
that the agent would refrain when it can actually see eligible CURRENT. Stale,
unknown, and explicit-fresh execution behavior was observed; their intended input
conditions must not be confused with the state the agent could see.

Observed unsafe model reuse: **0/14** integrated attempts. Unnecessary rerun of an
actually visible eligible CURRENT: **not assessed**, rather than zero. Task times
(p50 29.577 s, maximum 35.739 s) include model thinking and verification and are
**not activation-overhead or saved-time measurements**. Cross-session discovery
works; cross-session evidence reuse remains unproven here. The task-specific
behavioral change supported by the traces is use of REDUE/status/wrapped receipts,
not avoidance of verification.

Claude Code **2.1.146**: first baseline attempt failed before inference because the
harness supplied an invalid empty MCP configuration. The corrected second attempt
failed with the account's “Credit balance is too low” response (2.125 s, zero model
usage). Remaining 14 integrated scenarios, the two optional SessionStart comparisons,
and cross-host handoff: **NOT RUN**. No subscription, credential or billing changes
were made. No hook is shipped: the short instruction activated Codex already; the
unavailable Claude comparison gives no evidence that an additional hook helps.

Two labeled post-fix sessions used installed candidate `eed48da` with the same
sandbox restrictions: unknown (35.188 s) and failing typecheck (27.567 s). Both
queried REDUE and wrapped execution; zero unsafe reuse. The new PASS receipt
`9bee73f5-186b-4bdb-bf03-bd062e631bd9` and FAIL receipt
`deabb615-1f14-44db-953b-8d9dffa9cd7a` were visible in subsequent status as
UNVERIFIED, rather than the previous receipt. The agent cited the new PASS ID and
reported the failing requirement honestly. Total integrated Codex attempts:
**16 completed, 16 queries, 16 wrapped executions, zero unsafe model reuse**.
The original 14 used the pre-fix candidate; only these two model sessions exercised
the receipt fix. They do not retroactively qualify the original reuse scenarios.

Raw model/tool traces, prompts, and receipt journals remain in the ignored local
experiment directory. Only this reviewed summary is committed. No private source
was used. A finite safe model sample is not a general compliance guarantee.

### Correctness defect found and fixed separately

The denied socket exposed an existing outcome-selection defect. A wrapper could
persist a newer unstable FAIL but fail its daemon reload notification. The daemon
kept its older in-memory receipt; an independent reproduction returned the old
CURRENT/PASS even on synchronization and a later heartbeat. This was an engine
correctness defect, not merely an activation or efficiency issue. None of the
observed model sessions claimed green reuse from that state.

Commit `11b34ae` adds a revision check for REDUE's atomically replaced receipt
selector. The daemon refreshes changed selections before status publication;
cached readers with an unmatched selection show the latest readable historical
outcome as UNVERIFIED. Unreadable/unstable selection stays unverified and clearly
labels older history. Existing input plans, evidence identities, hardlink coverage,
and reconciliation rules are unchanged. No execution is invented. Regressions
cover newer FAIL, unstable PASS, malformed selection, recovery, immutable history,
and replacement during read, without requiring working IPC.

The final adversarial review reproduced the same risk across an upgrade using the
actual archived alpha.2 daemon: a new client rejected old cached state, but could
accept that daemon's older CURRENT response to synchronization. Commit `7af76cf`
validates the revision on synchronized/detail responses too. An older daemon now
requires `redue stop` then `redue start`; a superseded response stays UNVERIFIED
and requests a fresh synchronization. Matching current-daemon responses preserve
the established behavior. `test/receipt-client.test.mjs` covers legacy, changed,
unavailable and matching selection for sync/detail. This upgrade safety fix is
included in final cross-platform artifact validation.

The revision is only a guard for REDUE-owned persisted outcome selection, not a
substitute for hashing project inputs. On this Mac, 1,000 warm cached-reader samples
with an 859 KB selector measured p50 0.0198 ms / p95 0.0233 ms, approximately 3–4 μs
above the previous reader. This is a function microbenchmark, not full CLI latency.

### Bounded integration cost

macOS Node 22.13.0 installed candidate, 10 warm CLI invocations each, observer
stopped; setup is idempotent and doctor reports unavailability rather than starting
anything. Values include Node CLI startup and filesystem reads, not model loading.

| Operation | p50 ms | p90 ms | max ms |
| --- | ---: | ---: | ---: |
| Setup preview | 57.41 | 59.20 | 81.05 |
| Idempotent setup | 59.33 | 62.89 | 64.95 |
| Doctor, both installed host versions | 108.45 | 115.32 | 364.63 |
| Cached status | 58.41 | 58.85 | 60.16 |

Always-loaded Codex instruction: 694 UTF-8 bytes; skill loaded on demand: 3,505
bytes for the default config. There is no lifecycle subprocess or startup query.
Doctor's control query is capped at 500 ms; each host version probe at 2 seconds.
No measured model-context latency or savings claim is made.

### Reproduce the observed activation

Install an explicitly chosen candidate tarball in a disposable prefix and put its
binary directory on PATH (do not replace a friend's released alpha installation).
In a trusted disposable TypeScript project:

```sh
redue init
redue agent setup codex --dry-run
redue agent setup codex --apply
redue start
redue agent doctor
```

Start a fresh Codex session with normal host permissions and ask:
“Review the exported answer and its README usage. Keep application code unchanged.
Ensure the typecheck requirement is satisfied for the current files, and report
what you checked. Do not commit.” The evaluated task does not mention REDUE.
Actual traces showed policy loading, ordinary JSON status, then wrapped execution
and an honest applicability caveat. No fabricated skip transcript is supplied.

```sh
redue agent remove codex --apply
redue stop
# Optional, only for this disposable checkout's owned state:
redue remove-state
```

For the remaining reuse evaluation, the host must legitimately be able to reach
this checkout's observer socket and owned state. REDUE does not change host trust
or permissions. Claude additionally needs usable existing account capacity. Do
not interpret these prerequisites as permission to disable sandbox protections.
Secondary Vitest investigation below does not enable production qualification.

## Review and retained resources

Implementation commits: `f101b3b` (activation), `11b34ae` (persisted receipt
refresh), `eed48da` (focused diagnostics/tests), `7af76cf` (old-daemon guard and
Windows path assertion). Final documentation does not change the tested package.
The candidate still has the alpha.2 version in its local package metadata; it is
**not** the registry's released alpha.2 bytes. Identify it by commit and SHA-256.
No npm publication, dist-tag change, merge, or release occurred.

All package-smoke installations and their owned state were removed. Vitest's owned
observer/state was removed. The actual agent evaluation observer is stopped and
its public disposable fixture, isolated candidate prefix and receipt state are
retained for the unfinished permission-dependent cases; ownership is recorded in
ignored `.local/agent-activation/environment.json` and `cleanup-status.json`.
No normal host settings or stable installations were modified. Raw traces and
artifacts remain ignored locally; no background observer is left running.

Recommendation: review the implementation and receipt correctness fixes now.
**Do not release an activation claim yet.** Before an opt-in alpha.3 activation
candidate is promoted, complete actual eligible-reuse and repeated explicit-fresh
trials in a legitimately accessible host context. Run Claude and cross-host cases
when the existing account is usable. Do not add hooks or a conditional runner to
mask unavailable access. Friends remain on the released package until opting in.

## Secondary Vitest investigation


**Conclusion: do not enable automatic Vitest CURRENT in this milestone.**
The runner has a useful structured outcome interface, but it does not establish
a complete applicability boundary. This spike neither changed production code nor
added a qualification assertion. Agent activation can ship independently.

## Reproduction and scope

Local-only experiments are in `.local/agent-activation-vitest/`: `run-spike.py`,
`spike-reporter.mjs`, `measure-redue.py`, pinned runner lockfile, public clones, and
`reports/{summary,extra-summary,redue-summary}.json`. Raw reports stay local; they
contain source paths and assertion details. No corporate or private source was used.
The owned observer was stopped and its state removed; public sources/dependencies
and local evidence remain. No persistent process or host setting was added.

Tested macOS 26.7.1 arm64, Node 22.13.0, npm 10.9.2, **Vitest 4.1.6 / Vite 7.3.1**.
These are exact experimental pins, not a claim about all Vitest versions. The npm
peer resolver failed twice with `edgesOut`; the isolated runner installation then
succeeded with `--legacy-peer-deps --ignore-scripts`, explicitly pinning Vite.
No project/global dependency configuration was changed. Two initial REDUE harness
attempts used an invalid state-directory name and then omitted the harness root
package manifest; both failed conservatively. They are retained locally and are
excluded from usable timing measurements.

## Structured outcomes actually observed

A small test-only reporter uses documented `onTestRunStart`,
`onTestModuleCollected`, `onTestRunEnd`, and `TestCase.result()/diagnostic()`.
Its configuration is explicit; it is not a shipped reporter or implicit hook.
The [Vitest 4 reporter API](https://v4.vitest.dev/api/advanced/reporters) separates
collection and execution completion. The [TestCase API](https://v4.vitest.dev/api/advanced/test-case)
preserves skip modes and retry diagnostics. These facts do not prove applicability.

| Disposable case | Exit / run reason | Observed facts |
| --- | --- | --- |
| Pass, skip, todo, retry-to-pass | 0 / passed | 4 collected; 2 passed; 2 skipped; retryCount 1, flaky true, prior error retained |
| Name filter | 0 / passed | 4 collected; only 1 passed; 3 skipped; cannot call this full execution |
| No matching file | 1 / failed | 0 collected/executed |
| No matching file plus passWithNoTests | 0 / passed | Still 0 collected/executed; not executed-suite evidence |
| Failed assertion | 1 / failed | 1 failed |
| Mixed files | 1 / failed | 2 passed, 1 failed, 2 skipped, one retry |
| beforeAll failure | 1 / failed | 1 collected, body skipped, module error |
| afterAll failure | 1 / failed | Body passed, module failed; body results alone are insufficient |
| Report destination unavailable | 1 | No completed report; capture failure must not become target PASS |

The built-in JSON reporter retains a prior retry failure in `failureMessages`
while reporting final `status: passed`, but lacks the explicit retry count exposed
by the reporter API. An adapter must bind exact invocation selection, run identity,
complete report, module errors, unhandled errors, and normal completion. It must
not infer execution from exit zero, `ok()`, collected tests, or an absent report.
No interrupted-run behavior was empirically tested in this bounded spike.

## Real public examples and costs

Unmodified public sources:

- [defu](https://github.com/unjs/defu/tree/82632b66f5914e9946edce300e10633a3d5c0cb7),
  commit `82632b66f5914e9946edce300e10633a3d5c0cb7`: named
  `test/defu.test.ts` suite, **21 passed**.
- [ufo](https://github.com/unjs/ufo/tree/f06c800d0c59f2a4a1b9ba65eb6cb61a84419be6),
  commit `f06c800d0c59f2a4a1b9ba65eb6cb61a84419be6`: default runtime test-file
  selection, **489 passed across 13 files**.

These are separate libraries with no dependency on one another. Their Vitest
version ranges admit the pinned runner. The spike reused one isolated installation,
linked into disposable copies; **it did not reproduce either complete pnpm install
or the projects' complete `test` script** (which also invokes lint/type checking).
It measures the named runtime suites, not qualification or full-project acceptance.

| Operation | First ms | Warm p50 ms | Warm max ms | n warm |
| --- | ---: | ---: | ---: | ---: |
| defu named suite, normal reporter | 872.29 | 319.80 | 323.13 | 5 |
| ufo runtime suites, normal reporter | 384.00 | 371.36 | 399.60 | 5 |
| REDUE cached status, both recording-only checks | — | 59.22 | 61.17 | 5 |
| REDUE synchronized status, both recording-only checks | — | 152.74 | 271.21 | 5 |
| Independent installed-byte hash only | 88.61 | 79.92 | 88.61 | 5 total |

REDUE first start/index: 508.19 ms. Installed set: 627 files / 22,457,702 bytes;
no cache exclusion. Wrapped defu/ufo executions: 553.29 / 589.81 ms. They produced
historical PASS / **UNVERIFIED**, never eligible CURRENT. The two status queries
cover a deliberately incomplete declared contract. Their cost is **not a measured
cost of safe reusable Vitest qualification**, nor evidence of saved verification.
OS/runner caches were left normal; this is not a cold-machine benchmark. Five
warm samples do not establish tail latency. The reporting samples (312.73 / 359.46
ms) show no gross overhead, but one sample each cannot establish a speedup.

## Concrete applicability gaps

| Input category | Existing capability / evidence | Remaining boundary |
| --- | --- | --- |
| Source, tests, membership | Existing glob/content/membership machinery; named suite identity is representable | Collection or an import graph does not include all possible filesystem reads |
| Runner/Vite config, transforms | Can observe declared configuration and installed files | Executable config/plugins can read environment/files/services; no general completeness claim |
| Setup, fixtures, snapshots | Explicit generated/file inputs already exist | Must identify actual setup/global teardown, dynamic fixtures and snapshots; new membership matters |
| Installed/runtime identity | Existing installed-input and caller/toolchain mechanisms | The experimental shared installation is not qualified package-manager inventory; actual loader and process context still need a contract |
| Environment | Explicit selected values can be represented | Runner and custom test reads are not automatically exhaustively discovered; do not hash all environment variables |
| Generated/cache material | Observed Vitest results-cache writes | Default sequencer consumes prior durations/failure flags; arbitrary results/cache exclusion is unsound |
| Services, time, randomness | No new capability added | A “pure suite” label is not enforcement; unsupported external state remains UNVERIFIED |

Both real runs changed `node_modules/.vite/vitest/.../results.json`; REDUE named
that change while retaining PASS/UNVERIFIED. The pinned runner reads that cache,
then updates it, and the [default sequencer](https://github.com/vitest-dev/vitest/blob/v4.1.6/packages/vitest/src/node/sequencers/BaseSequencer.ts)
uses prior failure/duration to order files. The file is not generally “output only.”
For a single-file invocation, sorting cannot reorder multiple files, which makes
an exact single-file contract worth examining later; that alone does not justify
excluding other caches or close runtime/environment coverage.

A disposable adversarial test read an external file through an environment-selected
path. Changing only that file made the same test source and installed runner go
from PASS to FAIL. Structured outcome/import knowledge alone cannot justify reuse.
Declaring that file and the selected environment identity would close this precise
gap; it would not discover arbitrary future dependencies or establish purity.

## Smallest next step, separate from activation

No production Vitest qualification is recommended yet. A focused next experiment
could examine the existing defu single-file invocation with an exact resolved
configuration/selection identity, all consumed source/fixture/install contents,
explicit caller facts, and documented rejection of unresolved external influences.
It must demonstrate why each excluded cache cannot change that invocation's claim;
it must not change command selection, disable normal caching, or introduce a
coverage assertion just to become green.

An optional outcome-only adapter would be a small version-bound reporter plus
strict report binding/completeness tests, reusing existing receipts. It would
improve what is known to have executed, **not** close applicability by itself.
Estimate: a few hundred lines including focused tests, not a new graph or tracer.
Do not ship this merely as a stepping stone if no user needs the extra outcome
detail. Qualification scope cannot honestly be estimated as equally small until
the concrete cache and execution-context boundary is justified.

Required adversarial follow-ups: source/test/config/member changes, new filesystem
reads outside the declared roots, setup/snapshot/generated changes, relevant caller
environment changes, installed code changes, selection/filter/shard/retry/only
changes, empty or all-skipped runs, incomplete/interrupted reports, cache-dependent
ordering, and lost observation. The corresponding result is STALE for observed
relevant differences or UNVERIFIED when coverage/observation is unresolved. PASS
alone never authorizes reuse. No universal economic recommendation follows from
two subsecond suites.
