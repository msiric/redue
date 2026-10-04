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
