# Wrapped direct-compiler validation

Current conclusion (2026-10-09): **ready for independent review as a bounded
macOS recording-overhead improvement; net A–H savings are not established**.
The exact candidate passed local/full CI and three-platform package acceptance.
Six new Codex 0.162.0 sessions produced two trace-confirmed inherited reuses,
four required executions and zero observed unsafe reuse. Across three candidate
A–H cycles, total work was still 4.3–10.9% above eight contemporaneous ordinary
compiler runs. This is not a whole-agent speedup or a new support claim.

PR [#9](https://github.com/msiric/redue/pull/9), implementation `e10beef63f09bcddebca7e3a1e2506dc0833f29c`,
combined packed source `27958c52f4efaaf5f26e53ecf02a083fa67142c4`.
Unpublished artifact `redue-cli-0.1.0-alpha.8.tgz`, SHA-256
`62556b8d581695db1aa90be5436abf5b6cc3cb3503b121762a5b8b8587fb6520`.
Its alpha.8 metadata does **not** identify the public alpha.8 bytes; publication
would require a separately approved unused version and final artifact validation.

The authorized [alpha.8 release](https://github.com/msiric/redue/releases/tag/v0.1.0-alpha.8)
is independent: release commit `f9b751c24221529a5ec56f386cac01d4db0d74d0`,
packed source `894649a491e6dd588ebda81ff597cb63630bbaff`, SHA-256
`04bb436d49c303943c6eedfa6828b280e0d8b0d9e7aab38583cba3aa22245b63`.
Public npm and GitHub downloads match; public installation and same-prefix
alpha.7 upgrade preserve configuration/state and immutable runs. Both `alpha`
and `latest` select alpha.8. Existing receipts are not deleted or reinterpreted.

## Problem and bounded change

The retained debugger A–H replay cost 20,009.8 ms versus 16,972.7 ms for eight
ordinary compiler runs. Four reuses did not compensate for recording overhead.
D/F correlated traces attributed about 1.55–1.56 s per wrapped run to two full
caller probes and 0.79–0.81 s to start/end checkpoints. See
[the completed project evaluation](real-project-coverage.md).

Only the existing direct-TypeScript recipe on macOS with a healthy history barrier
can use this change. Windows/Linux retain the original full caller probes. There
is no compiler, project, invocation, environment, provider or policy expansion.

The observer may include its existing discovery certificate in a requested start
snapshot. Export requires healthy observation, completed catch-up, no pending
changes/rebuild/external boundary, current input key, plan guard, compiler probe
hash and an unresolved-free direct recipe. The certificate is bound to the check's
plan, cwd, exact built-in probe argv and original full-probe result. Old observers
or unavailable certificates use full caller validation.

The caller independently revalidates that certificate in its **actual environment**
at both execution boundaries. The existing built-in probe verifies current reviewed
compiler bytes, context and retained filesystem queries, including content,
membership, resolution and absence. Bounded decompression and existing 10-second
certificate validation apply; ordinary full-probe and checkpoint deadlines remain
unchanged. Bad identity, malformed/incomplete metadata, changed queries, rejected
runtime or failed validation falls back to the existing full caller probe.

The start snapshot now precedes caller certificate validation, conservatively
including that work in the observed interval. It is not rebased after edits. End
validation still precedes the ending snapshot. Both caller results must match
their observer probe hashes; environment, generation, plan, input-event serial,
revision and fingerprint checks remain unchanged. Change-and-restore events still
disqualify. Exit/cancellation, durable receipt selection/persistence and failed
reload protections are unchanged. Discovery metadata never represents a PASS.

No TTL, shared caller environment, global ignore list, persistent certificate cache
or asynchronous receipt write was added. A test-only boundary gate is enabled only
by the existing explicit test-fault mode and times out without fabricating evidence.

## Fixed acceptance and measurement plan

- Real compiler and full-reference comparison; malformed/missing/cross-check
  certificate, ETW/preload/implementation rejection, membership/absence changes,
  start/launch/post-exit edits, actual execution edits/restoration, cancellation,
  observer loss/root replacement, and existing receipt/incomplete-write tests.
- Exact installed candidate on macOS, Linux and native Windows; no host behavior
  claim follows solely from a package test.
- Three paired A–H cycles, independent observer sessions, order B/C/C/B/B/C.
  Each session alternates eight ordinary compiler runs with the unchanged eight
  decision paths: four potential reuses and four required executions. Same pinned
  vscode-js-debug revision, normal dependencies/caches, actual environment, exact
  socket/state permissions. No competing local tests during timings.
- Initial startup, qualified restart and setup remain separate and visible. Record
  all failures/fallbacks, complete measured sequences, means/medians/maxima and
  per-cycle totals. Do not sum medians or infer CPU/whole-agent savings.
- Six independent model sessions on the final candidate: recorded baseline,
  inherited reuse, relevant edit, reuse of new evidence, explicit fresh execution,
  unavailable observer. Existing in-context fail-closed gate; no retries for score.
  Claude/cross-host behavior remains NOT RUN.

Owner-local plan was written before new measurements. Earlier historical attempts
remain in their original evidence. Initial focused testing had one conservative
UNVERIFIED-versus-STALE recovery failure; a diagnostic single-case run passed.
The missing diagnostic in the first attempt prevents assigning a cause. The test
now asserts/explains its initial CURRENT baseline and retains the final reason.
A separate new test initially wrote profiling output into an unowned state directory;
its ownership refusal was correct. The test now writes outside the state directory.
Neither failure is relabeled as a passing first attempt.

## Completed deterministic and package acceptance

- Local `npm test`: 131 tests, 116 passed, 15 platform skips, zero failures.
- [Full CI](https://github.com/msiric/redue/actions/runs/37851221618): macOS Node 22,
  Linux Node 22/24, native Windows Server 2025 Node 22 all passed.
- [One exact tarball](https://github.com/msiric/redue/actions/runs/37851162233):
  macOS/Linux/Windows package workflows all passed, including installed 5.5.2,
  published-observer upgrade, receipt containment and safe agent-policy ownership.
  All 63 package files match the packed commit; no test/state/private payload.
- [Focused tests](../../test/macos-direct-probe.test.mjs) cover actual first-ever
  and warm runs, full-reference equivalence, real compiler FAIL, missing/malformed/
  obsolete/cross-check certificates, wrong plan/cwd/probe/output/context, oversized
  input, newly resolvable and membership inputs, compiler replacement, ETW and
  preload rejection, and retained-query validation before compiler API loading.
- Start-checkpoint, prelaunch, actual compiler-interval and post-exit changes are
  checked explicitly. Change-and-restore remains unstable; root replacement and
  observer loss cannot create eligible PASS. Cancellation executes no skipped
  check and leaves no abandoned lock. Existing checkpoint, interrupted-run,
  receipt-selection, failed reload and incomplete-write regressions remain green.
- The isolated 5.5.2 fixture runs the shared boundary tests without replacing the
  main test compiler/shim. The earlier asynchronous bounded-input correction and
  complete-EOF validation remain in use. No deadline or input limit increased.

The benchmark's first setup attempt stopped while the newly installed observer
was still indexing: start returned at 5,214.8 ms and the immediate synchronized
query reported healthy=false/indexing, with 27,904 files scanned. No A–H path or
model launched. The retained failed setup was followed by a harness-only bounded
readiness check (30 seconds, only known initialization phases), not a loop waiting
for CURRENT. Setup then completed; each model still had its own in-context gate.
This does not change product timeouts. The earlier two test failures above remain
historical evidence, not successful first attempts.

## Complete CLI measurement

Same pinned [vscode-js-debug](https://github.com/microsoft/vscode-js-debug/tree/b1c00772e46d4ed6e73442944fb5f66b533431d2),
local official TypeScript 5.5.2, Node 22.13.0/npm 10.9.2, macOS 26.7.1, ordinary
installed dependencies/options/caches and the approved exact-resource Codex
sandbox/proxy configuration. Actual host version checked in this pass: 0.162.0.
No local test suite ran during timing. Six independent observer sessions ran in
the predeclared baseline/candidate/candidate/baseline/baseline/candidate order.
Each ordinary compiler measurement preceded its matching path in a fresh sandbox
process. This is a CLI replay, not six additional model sessions.

The fixed paths are A sync+record after an owned source-comment edit; B unchanged
reuse; C unrelated README edit+reuse; D source edit+sync+record; E reuse; F explicit
fresh run without a reuse query; G reuse; H stopped-observer sync+record. The same
four potential reuses and four required executions are retained. No post-run query
was omitted from the established replay; the later reuse is a new synchronized
decision. A successful run reports execution, not an assumed continuing CURRENT.

All six cycles completed. A/D/F recorded stable PASS, H recorded unstable PASS;
all B/C/E/G queries were healthy CURRENT/PASS/eligible and retained their receipt.
No slow sample or expected unavailable response was excluded.

| Session order | Variant | A–H total (ms) | Eight ordinary runs (ms) | REDUE extra work (ms) |
|---|---|---:|---:|---:|
| 1 | baseline | 21,832.2 | 17,794.6 | 4,037.6 |
| 2 | candidate | 18,205.4 | 17,442.6 | 762.8 |
| 3 | candidate | 20,669.0 | 18,631.0 | 2,038.0 |
| 4 | baseline | 34,072.4 | 28,846.9 | 5,225.5 |
| 5 | baseline | 26,365.0 | 21,717.5 | 4,647.5 |
| 6 | candidate | 21,068.3 | 20,206.3 | 862.0 |

Per-path distributions below are measured complete sequences, not sums of phase
medians. Each cell is **mean / median / maximum milliseconds**, n=3 per variant;
with three samples the nearest-rank p90 equals the maximum. This is a bounded
sample, not a tail-reliability claim.

| Complete path | Baseline | Candidate |
|---|---:|---:|
| A initial decision + record | 6,294.0 / 6,551.5 / 7,160.3 | 4,453.2 / 4,274.7 / 5,002.7 |
| B unchanged reuse | 617.1 / 588.2 / 676.3 | 463.0 / 454.5 / 502.6 |
| C unrelated-edit reuse | 646.5 / 714.7 / 738.3 | 465.1 / 435.0 / 537.8 |
| D stale decision + record | 7,642.9 / 7,093.0 / 9,735.1 | 5,064.8 / 5,104.2 / 6,134.9 |
| E inherited reuse | 575.6 / 484.3 / 794.8 | 579.5 / 599.9 / 684.9 |
| F explicit fresh | 6,060.5 / 5,371.2 / 8,197.0 | 3,892.5 / 3,859.6 / 4,096.9 |
| G independent reuse | 594.8 / 630.4 / 696.6 | 549.5 / 505.6 / 692.3 |
| H unavailable + record | 4,991.6 / 4,777.4 / 6,229.4 | 4,513.2 / 4,617.0 / 4,730.2 |

A–H baseline n=3: total 82,269.6 ms, mean 27,423.2, median 26,365.0,
p90/max 34,072.4. Candidate n=3: total 59,942.7 ms, mean 19,980.9,
median 20,669.0, p90/max 21,068.3. Ordinary compiler n=24 per variant:
baseline mean 2,848.3/median 2,657.0/max 4,137.0 ms; candidate mean
2,345.0/median 2,338.5/max 2,679.9 ms. Corresponding eight-run totals were
68,359.0 and 56,279.9 ms across their three sessions.

Machine conditions varied: ordinary compiler costs also fell between groups.
Consequently the raw 27% lower replay mean is **not** an isolated causal effect
size. The phase counts establish work removed; the contemporaneous comparisons
establish that every candidate cycle remained slower than rerunning all eight
checks. Aggregate candidate extra work was 3,662.8 ms (6.5%), versus baseline
13,910.6 ms (20.3%). Net savings for the fixed workload are absent, despite fewer
actual compiler executions. Four reuse opportunities per cycle are specified by
this regression workload; they are not claimed representative of all development.

Setup and restart are separate, visible costs. Installation n=3 mean/median/max:
baseline 631.6/608.1/710.2 ms; candidate 909.5/590.2/1,588.0 ms. The repaired
first baseline setup additionally waited 2,709.1 ms after start for healthy indexing;
other sessions were ready on the first cached check. Qualified start+first inherited
query n=3: baseline 2,496.6/2,542.5/2,847.5 ms; candidate
2,047.4/2,047.9/2,110.1 ms. Query alone: baseline 592.2/608.9/713.1,
candidate 496.1/490.5/557.9 ms. Because H deliberately records unstable evidence,
a separate real wrapped baseline (mean 5,650.8 versus 4,014.0 ms) and qualification
query preceded these restart samples. Those are not hidden inside a warm latency.

## Correlated work and remaining cost

For A/D/F, caller full probes before+after averaged about 1.90/2.04/2.05 s
in the baseline. The candidate independently validated the discovery certificate
at both boundaries in about 0.44/0.46/0.47 s total. All 18 guarded caller validations
reused; all six validations with an unavailable observer fell back to full probes.
Caller full discoveries fell from 24 to 6 across the three A–H cycles per variant.
There is no verification-result cache and `run` still always executes.

Start+end checkpoints remained about 0.91/0.86/0.89 s for candidate A/D/F.
They retain catch-up, required content/installed validation, daemon probe work and
response delivery. Candidate complete wrapped commands averaged 3.83/3.94/3.89 s,
including actual compiler durations 2.32/2.47/2.36 s. Corresponding wrapper overhead
was 1.51/1.48/1.53 s, versus baseline 3.07/3.27/3.22 s. Unavailable H still took
4.38 s per wrapped command on average, including 2.50 s compilation and 1.87 s
wrapper overhead; it did not claim reuse.

Configuration, command/lock and context capture are independently instrumented.
Candidate receipt persistence averaged 34–35 ms for stable runs; reload about
11 ms. Prelaunch stabilization is Windows-only and unchanged. Compiler duration,
caller validation, checkpoints and persistence are disjoint wrapper phases;
`direct_probe.*` timings are nested inside validation and daemon timings inside
checkpoints. They must not be added again to total command time.

This does not move discovery into a faster periodic loop. The timer is unchanged.
Within measured A–H intervals, each variant had 34 request-time daemon certificate
validations and two full daemon probes. Baseline/candidate had 12/6 periodic
certificate launches during those intervals; shorter/differently aligned intervals
make that count unsuitable as an idle-work rate. No full periodic launch was
observed within these intervals. Dedicated idle CPU/RSS or energy consumption was
not measured, and no resource or whole-agent speedup is claimed.

## Actual focused agent regression

Six independent `codex exec --ephemeral --json` sessions, Codex 0.162.0, same
project/toolchain, installed exact candidate and unchanged approved workspace/state/
exact-socket/proxy restrictions. No model task mentioned REDUE. Integration setup
finished before the stale baseline; each case's expected in-context preflight passed.
The [fail-closed gate](../../test/acceptance/agent-trial-gate.mjs) was unchanged.
No score-driven retry or additional model call occurred.

| Case | Agent-visible decision | Actual action / receipt | Verification tool interval (ms) |
|---|---|---|---:|
| A | Healthy STALE/PASS, ineligible | Executed; new `d2466572-605f-4f5d-b19f-53361ff4f74e` | 4,233.8 |
| B | Healthy CURRENT/PASS, eligible | Reused A, same receipt; no compiler/npm execution | 436.4 |
| D | Healthy STALE/PASS, ineligible | Executed; new `e24c1779-f422-4167-ad42-d374bee67220` | 4,079.2 |
| E | Healthy CURRENT/PASS, eligible | Reused D, same receipt; no compiler/npm execution | 549.6 |
| F | Explicit fresh request; no reuse query | Executed; new `4b8e9867-cc7e-488a-96ae-478f373090a5` | 3,622.4 |
| H | Unhealthy UNVERIFIED/PASS, ineligible | Executed; unstable `dec5e019-e0aa-416b-9e05-ecb551cfe8d4` | 4,206.2 |

All five status queries actually visible to the models had schema 1. B/E each
made one synchronized query, retained the respective ID, created no run, executed
no equivalent compiler/npm command, and explicitly reported inherited evidence.
A/D executed after stale evidence; F honored fresh execution without synchronization;
H reported the fresh successful process separately from UNVERIFIED applicability.
All four executions used `redue run typecheck` (F added `--json`); no uncaptured
execution or unsafe reuse was observed. Actual required compiler durations were
2,298/2,209/2,316/2,281 ms for A/D/F/H. No agent edited the source.

There were nine verification-related tool calls: five sync queries and four runs.
Their observed tool intervals total 17,127.7 ms; complete model tasks total
132,127.7 ms. These intervals include tool transport and cannot be substituted for
the CLI-only replay measurements. The two inherited query client intervals were
384.9 and 508.4 ms; the four wrapper-engine intervals were
3,553.6/3,546.0/3,512.3/3,959.9 ms. There is no matched whole-task control, hence no
causal whole-agent speedup or net model-workflow saving claim. Two avoided compiler
executions are trace-confirmed, not inferred from preflight CURRENT.

The actual demonstration was a comment review requiring TypeScript validity (A),
then a fresh session asking: “Review src/common/objUtils.ts for accidental identifier
inconsistencies. Make no changes unless there is a real defect, and report TypeScript
verification status. Do not commit.” B discovered the installed skill, queried
synchronized JSON and reported that no rerun was needed. A second comment edit
invalidated A; D executed, and E independently reused D. This is the observed story,
not a scripted transcript or universal compliance claim. Claude/cross-host: NOT RUN.

Owner-local raw trials/profiles stay private under `.local/wrapped-run`; only this
reviewed summary is committed. The owned observer and disposable installation were
stopped/removed, owned edits restored, and all 60 immutable historical runs verified
and retained. Configuration and project integration remain. Normal installations,
managed policies, credentials and package tags were not changed by the experiment.

## Recommendation

**Review this bounded performance candidate for release.** It removes demonstrated
duplicate caller discovery while preserving both recording boundaries and all
fallbacks. Release claims must stop at reduced macOS recording overhead and the
finite regression result. The fixed A–H workload still does not beat ordinary
compilation; the product target is not met, and the remaining checkpoint/unavailable
cost is measured rather than declared an irreducible lower bound. No further
speculative optimization, support expansion or guidance change is included here.
