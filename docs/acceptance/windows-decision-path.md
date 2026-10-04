# Windows decision reliability and cost

Baseline: clean private `main` at `b671a64`. No evidence-state meanings change.
This pass targets unchanged synchronized decisions, not a new provider or UI.

Latest conclusion: [B — Windows technically sound but performance-limited](#final-recommendation-after-repeatability). Historical blocked/intermediate results below remain visible.

## Measured baseline

Native Server 2025 / NTFS public run `37230922931` at `83e857b` separated
query contexts for the first time. Earlier numbers mixed these cases. Each
unchanged Windows query still did a complete provider discovery, cold index,
and TypeScript probe, regardless of healthy observation.

| Manager | Warm sync p50 / p90 / max (n=8), ms | Check p50 / max (n=2), ms | Cold-index p50, ms |
| --- | ---: | ---: | ---: |
| npm | 6637 / 9533 / 9533 | 4199 / 4263 | 3463 |
| Yarn | 5009 / 5103 / 5103 | 2479 / 2526 | 2307 |
| pnpm isolated | 8052 / 10998 / 10998 | 3849 / 3915 | 913 |

First queries after startup were 7001 / 5113 / 8597 ms respectively. First
queries after restart were 6487 / 4985 / 9072 ms. These are single samples per
manager, not tail estimates. pnpm's plan worker p50 was 4405 ms and its probe
p50 was 3309 ms: provider/compiler work dominated its 913 ms content scan.
For npm/Yarn, content traversal/read cost was itself substantial.

## Bounded corrections

- Reuse the already-resolved in-memory input plan only after validating its
  configuration, resolution links/candidates, workspace manifest membership,
  compiler-discovery questions, and input-content/membership identity. A source
  edit can change imports, so it still causes compiler rediscovery. Restart,
  root identity change, uncertainty, and incompatible state use full discovery.
- A supported TypeScript probe can preserve its result only if its compiler
  filesystem answers still match. These include file reads, failed existence
  queries, directory membership, and realpath resolution. The public compiler
  API is checked against independent CLI listings in migration tests; ordinary
  run checkpoints still use the CLI and require the identical result digest.
  Unsupported compilers or excessive certificate size use the complete probe.
- Toolchain/execution context remains freshly validated. npm's distribution,
  configuration and launcher selection and Yarn's pinned launcher/distribution
  are not trusted merely because checkout inputs match. Caller context is still
  separately supplied and compared by the existing receipt contract.
- Windows continues to read content and membership through the existing index;
  directory events do not prove hardlink-alias contents unchanged. An eight-read
  concurrent implementation was measured and removed: NTFS validation got slower
  (pnpm index ~3.4 s versus the original ~0.9 s). The original content reader and
  before/after identity checks remain. No lockfile/timestamp substitutes for bytes.
- The compiler certificate is internal optimization metadata, not a receipt or
  a new evidence type. It contains answers/digests and local paths, not source
  text or environment values. It is not exported. No TTL grants applicability.

Opt-in timing now gives reasons for provider rebuild/reuse and probe execution,
and separately records index validation versus provider discovery. Metrics are
local/test-only; normal commands produce no telemetry.

## Checkout-root control loss

The earlier `connect ENOENT` did not establish whether the daemon died. Baseline
run `37230922248` passed the complete native suite and 40 consecutive exact
rename/copy-root replacements. That does not establish the historical cause.
The stress harness now owns a direct daemon process handle and records exit
code/signal on failure. Lifecycle events record control-listen, abnormal JS
exit, and normal exit state; state/control/cwd remain outside the replaced root.

A Windows decision connection failure has one bounded recovery path. A live
owner gets one reconnect, with the normal deterministic input validation. A
proven-dead owned observer may restart once only if no run lock exists. Pending
or failed recovery remains UNVERIFIED with historical outcomes; no receipt is
created. A recovery marker prevents repeated failed restart attempts. An
intentional stop (no observer lock), ambiguous ownership, surviving check work,
or repeated failure requires explicit inspection/start. Other failures are not
retried until green.

## Remaining platform gate

No approved Windows 11 desktop capable of running Node is available. The prior
managed-desktop policy restriction remains an environmental limitation. The
Windows 11 install/init/run/status/sync/restart/inherited-receipt/remove-state
smoke test remains open; no policy bypass was attempted.

## Further findings and final code

Two later stress runs (`37231948721`, `37232060308`) reproduced a root lifecycle
failure with **PID alive, child exit null, and a responding control pipe**. A
failed recovery could leave `identityChanged` and its exhausted attempt budget
latched after a later successful synchronized rebuild. A subsequent root
replacement then suppressed fresh recovery. Also, a request begun before
recovery could finish its scan while recovery was still finalizing. Final code
resets successful identity recovery consistently, distinguishes new root
identities from repeats of the same failure, and withholds applicability and
healthy status until recovery finalization completes. Deterministic regression
covers that finalization interval; the Windows-specific repeated-failure case
is prepared for native rerun. This does **not** establish the cause of the old
historical pipe `ENOENT`.

The pnpm fixture teardown also removed the checkout before stopping its daemon.
That exposed a control dependency on installed TypeScript/configuration even
for `stop`. Fixture teardown now stops/removes state before deleting inputs.
Explicit `--state-dir` maintenance uses the owned runtime configuration and
works after checkout deletion. Ownership checks still apply. Twenty-six
unambiguously product-test-owned orphan daemons with absent disposable roots
and no children were stopped through their own control endpoints. No personal,
research, or corporate installation was stopped; historical temp diagnostics
were retained.

A bounded certificate-size fallback accidentally disabled pnpm reuse in the
later runs. Its cause was explicit in diagnostics: `no_validated_result` on all
32 probes. Optional metadata is now compressed within the same bounded probe
channel. The new certificate initially ran a second compiler listing solely
for capture; that duplication was removed. Supported compiler-host capture
produces the same probe digest as the independent ordinary CLI path in npm,
Yarn, and pnpm fixture regressions. No decision deadline was increased.

## Last native measurements (not final-code acceptance)

Run `37232060754`, code `78ec98b`, used the original sequential reader and
separated user-visible CLI timing by context. Later fixes have **not** received
native performance or repeatability acceptance. Times below are milliseconds.

| Manager | Warm unchanged p50 / p90 / max, n=8 | Unrelated edit p50 / p90 / max, n=5 | Relevant edit p50 / p90 / max, n=5 | Command p50 / max, n=2 |
| --- | ---: | ---: | ---: | ---: |
| npm | 5011 / 5628 / 5628 | 4989 / 5108 / 5108 | 8886 / 9039 / 9039 | 4133 / 6202 |
| Yarn | 5426 / 8419 / 8419 | 5431 / 8381 / 8381 | 8959 / 9037 / 9037 | 3298 / 3453 |
| pnpm isolated | 8555 / 11256 / 11256 | 8276 / 14047 / 14047 | 8252 / 11199 / 11199 | 2712 / 2781 |

Warm p50/check p50 ratios were **1.21× npm, 1.65× Yarn, 3.15× pnpm**. These do
not establish useful reuse economics. They are not a proven irreducible lower
bound: pnpm still hit the now-corrected metadata fallback. Cached CLI p50/max
(n=5) was 240/272 ms npm, 261/291 ms Yarn, 136/177 ms pnpm; cached Windows
applicability remains conservative. First post-restart decisions were 6860 ms
npm and 12722 ms pnpm (n=1 each). Yarn's restarted observer was honestly
indexing with no check row yet; the new timing harness incorrectly rejected
that initializing shape. The harness now includes this wait in total decision
cost instead of rejecting it or counting an unavailable answer as success.

Warm validation (including content and compiler dependencies) p50 was 3717 ms
npm and 4085 ms Yarn; context validation p50 was 701/711 ms. Largest sampled
individual-process RSS was 190/193/136 MiB npm/Yarn/pnpm, not aggregate peak RSS.
Phase summaries preserve p90/p95/max; no cross-run pooled quantile is claimed.

Native outcomes during this pass:

- Baseline public matrix: 3/3 manager workflows passed; baseline native suite
  passed, and its exact root-replacement stress passed 40 iterations.
- First optimization public matrix `37231656272`: 3/3 passed. Concurrent I/O
  lost on cost and was removed. Its obsolete full native run was cancelled for
  diagnostics; the separately completed root stress passed another 40 cycles.
- `37231949143`: 1/3 passed; pnpm had a conservative probe timeout and npm's
  new timing harness rejected the initializing/no-row shape after restart.
- `37232060754`: npm and pnpm complete workflows passed; Yarn failed only at
  the same initializing/no-row timing-harness assumption.
- The two later native suites each passed 50 tests, failed one negative Yarn
  fixture assertion, and skipped 11 platform tests. That fixture omitted its
  Windows Corepack context and now reports the intended resolver boundary.
  Both root stress attempts exposed the lifecycle latch described above.
  pnpm hoisted, installed hardlink mutation, and bounded missing-control
  recovery passed in the native suite, but final-code repetition is outstanding.

No false CURRENT was observed. Historical PASS remained available during the
recorded UNVERIFIED failures. No final success count is substituted for the
blocked repeatability campaign.

## Historical billing block and interim recommendation

GitHub refused new native jobs beginning with `8033b2b` (runs `37232314686` and
`37232333943`) before any runner step executed. Its annotation says recent
account payments failed or the spending limit must increase. Run `37232752601`
at `46bf4d6` was refused too. No billing setting was changed. Thus final fixes
and the prepared deterministic Windows regression cannot currently be exercised
on the approved native runner.

**C — Windows not ready.** Correctness remains conservative, but the new root
recovery repair lacks native repeatability acceptance, the original pipe loss
is not retrospectively explained, and measured decision economics still miss
the goal. Windows 11 desktop smoke also remains open. Do not begin alpha polish.

After the account owner restores runner availability, rerun the existing
`windows-native.yml` and `windows-real-projects.yml` at the final pushed HEAD.
Repeat the native suite/root stress and the same public matrix three times;
report failures separately from legitimate UNVERIFIED, with the existing warm,
edit, restart and command-cost samples. If retained content/context validation
still costs more than these checks after the final fixes, prefer rerunning
those cheap checks in future agent policy rather than weakening evidence or
adding another observation subsystem. This policy is a recommendation, not an
implemented heuristic.

Final shared-code regression at `771257b`: macOS 52 passed / 0 failed / 16
platform skips; native Linux on the established ext4-backed Docker named volume
56 passed / 0 failed / 12 skips. Both ran all 68 product tests. The finalization
race regression passed on both systems. Test-owned Linux volumes were removed.
The final Windows-specific replacement-after-failed-recovery regression is
not counted as executed by either host. At that checkpoint, final native CI was
refused before runner startup; these shared regressions did not substitute for
NTFS acceptance. The completed native reruns below supersede that block.

## Native rerun after restoring runner availability

The account owner restored Actions capacity after the dashboard confirmed that
all 2,000 included minutes had been consumed. No billing settings were changed
by REDUE. The earlier refusal was an account limit, not a product failure.

All three public matrices at unchanged product commit `2f072a9` passed:
`37233713527`, `37234477384`, and `37234481478`. This is **9/9 public workflows**:
three each for npm, Yarn node-modules, and pnpm 12 isolated. Every workflow ran
init, a wrapped check, CURRENT/PASS, preserved CURRENT after unrelated edits,
STALE/PASS after relevant edits, a wrapped rerun, restart/reconciliation, and a
fresh CLI process consuming the historical CURRENT receipt. Public repository
revisions, package-manager modes, check selection, and deadlines were unchanged.

### Final measured economics

Times are seconds. Each row is one independently provisioned Windows runner:
8 warm queries, 5 cached queries, 5 queries after each edit category, and 2
ordinary wrapped command executions. p50 uses the existing nearest-rank
summary (for n=2, it is the smaller command sample). With n=8, p90 and p95 equal
the maximum. These are per-run quantiles, **not** pooled quantiles reconstructed
from summaries. Command timing excludes REDUE's receipt preparation overhead.

| Manager / run | Warm p50 / p90 / max | Check p50 / max | Warm/check p50 ratio |
| --- | ---: | ---: | ---: |
| npm / 1 | 5.36 / 5.47 / 5.47 | 4.40 / 4.44 | 1.22× |
| npm / 2 | 5.74 / 10.37 / 10.37 | 4.20 / 4.62 | 1.37× |
| npm / 3 | 3.78 / 3.82 / 3.82 | 3.16 / 3.17 | 1.19× |
| yarn / 1 | 3.06 / 6.16 / 6.16 | 1.92 / 2.21 | 1.60× |
| yarn / 2 | 5.17 / 5.24 / 5.24 | 3.22 / 3.23 | 1.60× |
| yarn / 3 | 3.84 / 6.88 / 6.88 | 2.33 / 2.34 | 1.65× |
| pnpm / 1 | 4.18 / 9.16 / 9.16 | 4.94 / 5.07 | 0.85× |
| pnpm / 2 | 2.70 / 5.60 / 5.60 | 3.70 / 3.80 | 0.73× |
| pnpm / 3 | 2.98 / 5.82 / 5.82 | 3.94 / 3.99 | 0.76× |

| Manager | Cached p50 range / max | Unrelated-edit p50 range / max | Relevant-edit p50 range / max | First after start range | First after restart range |
| --- | ---: | ---: | ---: | ---: | ---: |
| npm | 0.19–0.29 / 0.29 | 3.79–5.35 / 5.36 | 5.59–7.99 / 12.30 | 4.02–5.85 | 3.73–6.35 |
| yarn | 0.15–0.25 / 0.28 | 3.13–5.20 / 6.90 | 4.67–7.38 / 8.45 | 3.55–5.66 | 2.87–6.78 |
| pnpm | 0.20–0.29 / 0.36 | 2.69–4.22 / 6.69 | 9.18–12.50 / 15.19 | 3.22–6.84 | 4.82–12.86 |

There are 24 warm samples and 15 samples per edit category per manager; startup
and restart each have only three samples. The first-after-start query follows
readiness polling; restart timing includes an initializing response/wait when
needed. Neither is silently included in the warm sample. Cached Windows status
remains conservative and cannot replace synchronized applicability.

### Where the remaining time goes

Each manager reused its plan and supported compiler result 25 times per run;
there were seven complete discoveries (initialization, restart, and five
relevant edits). Across all three runs that is 75 validated reuses per manager,
not a time-based cache. pnpm no longer loses reuse because of the optional
certificate-size fallback. The expensive work is now mostly **current content,
membership, and compiler-dependency validation**, not unconditional provider
rediscovery. pnpm's installed-link mapping/closure work is tens to low hundreds
of milliseconds; it is not the dominant remaining warm phase.

| Manager | Plan-validation p50 range / max | Compiler-question p50 range / max | Fresh context p50 range / max | Largest sampled process RSS |
| --- | ---: | ---: | ---: | ---: |
| npm | 2.79–3.95 / 8.90 | 0.28–0.37 / 0.57 | 0.50–0.78 / 3.59 | 211.9 MiB |
| yarn | 2.13–3.90 / 6.84 | 0.24–0.39 / 0.55 | 0.51–0.69 / 3.41 | 195.8 MiB |
| pnpm | 1.95–2.66 / 7.87 | 0.47–0.65 / 1.33 | 0.33–0.48 / 3.31 | 333.9 MiB |

Phase statistics mix warm and changed-input work; only the `acceptance.*`
samples above explicitly distinguish decision contexts. Nested phase timings
must not be added as independent costs. RSS is the largest sampled individual
process, not simultaneous aggregate peak memory.

The current scans still include all declared inputs: approximately 18,335
files/167 MB npm, 16,812 files/176 MB Yarn, and 6,001 files/86 MB pnpm. No input
was dropped. Independent byte reads still detect hardlink-alias mutation on
Windows; no trust is derived solely from timestamps or a lockfile. Warm
validation and fresh context phases have occasional multi-second outliers.
The summaries locate those tails in those phases but do not establish a
specific OS/antivirus cause; no such cause is assumed.

pnpm's warm p50 is now 0.73–0.85× command cost, but its tails still exceed a
rerun. npm is 1.19–1.37× and Yarn 1.60–1.65×: neither establishes useful reuse
economics for these representative checks. These are measured costs of this
supported implementation, not a mathematical lower bound on all possible
implementations. The removed concurrent reader was slower in native profiling;
there is no evidence here justifying another speculative optimization system.
A future agent policy should compare synchronized-decision cost to the check
and rerun these cheap checks when that is cheaper. An ambient UNVERIFIED badge
must never be used as a substitute for CURRENT to save that cost. No such
policy is implemented in this pass.

### Native lifecycle repeatability

Native runs `37233711289`, `37234475345`, and `37234479341` each passed **57
product tests, zero failures, 11 platform skips**, followed by 40 successful
checkout-root replacement cycles. Total: **3/3 suites and 120/120 separate
stress cycles**, in addition to each suite's ordinary replacement case. No
control-pipe loss, stuck recovery, or false CURRENT was observed in this final
sample. The deterministic replacement-after-failed-recovery and finalization
uncertainty tests passed in all three suites. So did dead-daemon single-restart
reconciliation, missing-root maintenance, process cancellation/ownership,
installed hardlink-alias mutation with unchanged lockfile, observable absence,
and pnpm hoisted execution/rerun/inheritance. These destructive cases use owned
fixtures; they are distinct from the genuine public-project workflows above.

Environment: Windows Server 2025 Datacenter 10.0.26100, AMD64, NTFS; image
`win25-vs2026 20260925.250.1`; Node 22.23.3, npm 10.9.9, PowerShell 7.6.6.
The historical pipe-loss cause remains unproven. It now has diagnostics and a
bounded, ownership-checked recovery path with deterministic reconciliation;
reconnection alone never grants CURRENT. The reproduced identity/recovery-latch
defect is fixed and has passed native repetition. No automatic retry storm or
new receipt is used to obtain a green result.

The same product code had already passed macOS **52/0** (16 skips) and native
Linux **56/0** (12 skips). This continuation changed only acceptance workflow
and documentation, so shared-code regressions were not rerun solely for another
passing report. No product code or timeouts changed after `2f072a9`.

### Windows 11 native CLI smoke

A suitable approved environment was available through GitHub's standard
`windows-11-arm` runner, documented in the
[hosted-runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
Manual smoke workflow commit `de50a81` changes no product code. Run
[`37235267994`](https://github.com/msiric/redue/actions/runs/37235267994) passed
on **Windows 11 Enterprise 10.0.26200, ARM64, NTFS**, image
`win11-vs2026-arm64 20260924.168.1`, Node 22.23.3, npm 10.9.9, PowerShell 7.6.6.
Developer Mode was already enabled (registry value 1); it was read, never
changed. The managed corporate desktop was not used.

The same public pnpm 12.4.1 project completed local product dependency setup,
PowerShell/direct Node CLI help, init/start, wrapped CURRENT/PASS, unrelated
preservation, source STALE/PASS, rerun, cached and synchronized status,
restart/inherited CURRENT, stop, and owned-state removal. Cleanup preserved the
project input. The observed workspace link was a directory reparse point and
TypeScript's installed file had two hard links. The exact workspace reparse
tag (junction versus directory symlink) was not recorded by this smoke; the
Server 2025 suite separately exercises explicit junction behavior. This is a
native Windows 11 CLI smoke, not an interactive desktop-terminal usability test
or proof about a Developer-Mode-disabled ARM64 machine.

Its eight warm queries had p50 **3.32 s**, p90/max **3.42 s**, versus command
samples **3.315/3.349 s**: effectively a tie, not evidence of meaningful saved
verification time. Unrelated/relevant-edit p50 was 3.31/9.70 s; first post-restart
sync was 5.93 s; cached p50 was 341 ms. Largest sampled process RSS was 328 MiB.
The result does not change the economic recommendation.

### Final recommendation after repeatability

**B — Windows technically sound but performance-limited.** Final native and
public repetitions passed, the reproduced root-recovery defect is repaired,
and the historical control-loss symptom has bounded conservative containment.
No false CURRENT was observed. The approved native Windows 11 CLI follow-up is
now complete. Authoritative decisions still cost more than rerunning the npm
and Yarn checks, and pnpm tails remain unattractive despite improved medians.
Do not declare the verification-reuse path economically successful or start
alpha polish on that basis.

Next is a product/agent-policy decision about when a caller should synchronize
versus simply rerun an inexpensive check. Do not weaken installed-content
validation, infer trust from file age, or build another observation subsystem
without new evidence. These tests establish measured costs, not a universal
lower bound. Larger/longer checks may have different economics; no new slow
check was selected here to improve the ratio.

Remaining conservative boundaries are unchanged: cached Windows applicability
without decision-grade content validation; incomplete/unsupported input
contracts; unknown/changed caller context; observation/recovery uncertainty;
and ambiguous process ownership. Direct commands outside `redue run` still do
not create receipts. Deliberately detached process trees retain the documented
cancellation limitation. Recorded outcomes survive these conditions.

Only test workflow and this report changed after the accepted implementation.
All development tests used owned disposable projects/state/stores; hosted VMs
were discarded. No corporate checkout, approved execution path, stable observer,
or personal-project installation was modified. This continuation used about
74 Windows runner-minutes total (about $0.74 at the displayed baseline rate,
before billing rounding/storage); GitHub billing is authoritative. No further
workflows remain running, and no alpha-polish work was started.
