# Windows decision reliability and cost

Baseline: clean private `main` at `b671a64`. No evidence-state meanings change.
This pass targets unchanged synchronized decisions, not a new provider or UI.

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

## Acceptance blocker and recommendation

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
not counted as executed by either host. Final native CI remains refused before
runner startup; these shared regressions do not substitute for NTFS acceptance.
