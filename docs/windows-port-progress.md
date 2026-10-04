# Windows native acceptance checkpoint

Windows uses the shared evidence/applicability engine. Platform-specific code
handles NTFS path identity, named-pipe control, Parcel watcher events, batch
command quoting, and process-tree termination. Windows cached applicability is
conservative; a decision-grade synchronized read reconstructs declared inputs.
Historical PASS/FAIL survives observer uncertainty without becoming CURRENT.

The acceptance environment is GitHub Actions `windows-2025`: Windows Server
2025 Datacenter build 26100, AMD64, NTFS, Node 22.23.3, npm 10.9.9, and
PowerShell 7.6.6. Disposable tests run on native NTFS, not WSL. Developer Mode
is not assumed. Tests exercise junctions and hardlinks directly. The runner
also permitted an ordinary file symlink and a path longer than 260 characters
(`37165719868`).

The native contract suite passed 41 tests with 12 platform-specific skips at
run `37164202737`. Native Windows process-tree cancellation and killed-daemon
reconciliation subsequently passed at run `37164869674`, although that run
had four unrelated readiness/synchronization failures. A later run passed 42
tests with one pnpm receipt-capture failure (`37165430123`). The final native
run passed 43 tests, skipped 11 platform-specific tests, and failed one pnpm
hoisted applicability check (`37165719868`). These variations
must not be flattened into a stable green result.

Two genuine public repositories completed the full Windows workflow through
normal `redue init`: npm single-package TypeScript and pinned Yarn 4.12.0
node-modules workspace. Both reached CURRENT/PASS, preserved it after an
unrelated edit, became STALE after a relevant edit, returned to CURRENT/PASS
after a wrapped rerun, and inherited the receipt after observer restart in
run `37164524314`, and again at `37165721588`. Other runs also showed
intermittent conservative failures: run checkpoints or state probes timed out
while observation was rebuilding.

The pinned pnpm 12 isolated-layout public workspace installed to a project
virtual store with content hard-linked from an isolated disposable store. A
workspace dependency was an NTFS reparse-point directory, and an installed
TypeScript file had two hard links (`37165721588`). Its typecheck produced a
historical PASS, but the run's end checkpoint was unavailable in one diagnostic
and synchronized status timed out even with a 90-second deadline
(`37164909331`). A later run (`37165721588`) did reach an end checkpoint, but
the plan rebuilt during execution; its decision-grade probe then timed out.
Fixture tests have shown both isolated hardlink
invalidation and hoisted operation, but the real pnpm workflow has not earned
reusable CURRENT on Windows. The exact cause of repeated plan rebuilding and
slow reconciliation needs profiling before changing the kernel.

Release status: Windows semantics fail conservatively in these runs, with no
observed false CURRENT. Decision-grade availability is not yet reliable enough
for public-alpha Windows support. The 15-second default capture/status
deadline and 90-second pnpm diagnostic establish a performance/reliability
problem; cached/synchronized p95, peak RSS, and event-to-state latency have not
yet been measured on the native runner. A Windows 11 desktop install/init/run/
status/restart/remove-state smoke test remains a pre-release follow-up.

## Focused decision-path reliability pass (2026-10-04)

The paragraph above is the historical first-acceptance result. The follow-up
profiled the same native `windows-2025` public-repository matrix before changing
the decision path. At the clean baseline, a pnpm synchronized request spent a
median 83.7 seconds in a second installed-file recheck after its full cold index;
the 90-second diagnostic checkpoint could time out. The worker also repeated
pnpm workspace/TypeScript discovery, and separate inner 4–5-second TypeScript
listing/probe deadlines failed even when their outer request had time left.
The Windows periodic probe could occupy the control loop despite cached Windows
status already being deliberately conservative.

The corrections reuse the installed content just read by Windows forced
reconciliation, resolve workspace input declarations once per plan, omit the
non-authoritative Windows periodic probe, and bound the measured inner listing
work and client request to 10 and 30 seconds respectively. Those deadline
changes followed removal of duplicated work. A public-only notification trace
then isolated a second issue: pnpm installed-file events arrived after the
starting full snapshot but before the child command began. In one run the
checkpoint serial changed 9→16 while **zero** notifications occurred during
the 4,951 ms command. A cheap internal prelaunch checkpoint (~67–119 ms in
final runs) now incorporates already-delivered events before child launch.
Events after launch, changed content, failed probes, or observation gaps still
make the historical outcome UNVERIFIED. This checkpoint cannot itself return a
decision-grade CURRENT status.

Three identical post-fix public acceptance runs completed successfully:
[`37223908025`](https://github.com/msiric/redue/actions/runs/37223908025),
[`37223911598`](https://github.com/msiric/redue/actions/runs/37223911598), and
[`37223914924`](https://github.com/msiric/redue/actions/runs/37223914924).
Each npm, Yarn node-modules, and pnpm 12 isolated check completed the full
CURRENT → preserved CURRENT → STALE → rerun CURRENT → restart/inherited CURRENT
workflow. These are three runs per manager, not an unlimited stress campaign.
The native Windows contract suite also passed at
[`37223907562`](https://github.com/msiric/redue/actions/runs/37223907562):
46 passed, 0 failed, 11 non-Windows/platform skips. It includes pnpm hoisted
qualification, hard-link mutation, junction/path, fault/reconciliation, and
process-tree cancellation cases. The public pnpm installation used project-local
isolated storage, a workspace reparse-point relationship, and a two-link
TypeScript file; the store was disposable.

Per-run timing summaries below retain their small-sample tails. Values are
milliseconds; p95 is the range of the three individual run p95 values, with
the overall observed maximum in parentheses. Synchronized status had 6–7
samples per run and forced reconciliation had 10 per run.

| Manager | Synchronized status p95 (max) | Forced reconciliation p95 (max) | Plan worker p95 (max) | Probe p95 (max) | Sampled process RSS peak |
| --- | ---: | ---: | ---: | ---: | ---: |
| npm | 6,769–7,327 (7,327) | 6,662–10,429 (10,429) | 4,033–5,257 (5,257) | 4,246–5,933 (5,933) | 159 MiB |
| Yarn | 3,924–7,014 (7,014) | 3,824–9,348 (9,348) | 2,318–7,021 (7,021) | 1,630–2,941 (2,941) | 185 MiB |
| pnpm isolated | 9,497–16,467 (16,467) | 10,534–16,358 (16,358) | 5,678–8,998 (8,998) | 4,839–8,372 (8,372) | 139 MiB |

For pnpm, installed/workspace discovery p95 was 3,761–5,693 ms (maximum
7,695 ms), with TypeScript file listing p95 3,013–4,697 ms (maximum 7,126 ms).
The pnpm check indexed about 6,001 files/86 MB; npm indexed about 18,335
files/167 MB. Peak RSS is the largest sampled individual process, **not** an
aggregate resident-memory measurement across simultaneous helpers. The
opt-in timing files contain phase/duration/count/RSS metadata, not source or
probe output. Cached ambient status remains conservative on Windows; these
figures are for decision-grade synchronized reads.

The final full macOS suite passed 43/0 with 14 platform skips. The Linux full
suite on an ext4-backed Docker named volume passed 47/0 with 10 skips. The
final Windows-only listing limit does not alter macOS/Linux execution.

No false CURRENT was observed. Remaining debt is pnpm synchronized latency
(up to 16.5 seconds in this sample), repeated full plan/index work on every
Windows decision, and the untested Windows 11 desktop smoke. Three green CI
repetitions support an alpha candidate, but the Windows 11 install/init/run/
status/restart/remove-state smoke remains a pre-release validation item.
