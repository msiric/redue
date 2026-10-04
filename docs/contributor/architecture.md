# Architecture

## Ownership boundaries

- `src/declared-plan.mjs` resolves explicit check input plans.
- `src/installed-inputs.mjs` resolves permitted linked installed paths;
  `src/index.mjs` hashes file contents and membership.
- `src/yarn-workspace-inputs.mjs` derives the narrow Yarn workspace typecheck
  input plan; `src/yarn-workspace-typecheck-probe.mjs` checks its effective
  TypeScript file list without running the check.
- `src/pnpm-inputs.mjs` derives pnpm installation and TypeScript input plans;
  `src/pnpm-typecheck-probe.mjs` checks the effective compiler input list.
- `src/daemon.mjs` owns one checkout observer, reconciliation and applicability.
- `src/platform-observation.mjs` selects macOS FSEvents, Windows native events, or the Linux inotify
  transport. The Linux helper reports overflow/watch loss and runs on local
  ext2/3/4, XFS, Btrfs, F2FS, tmpfs, or ZFS. Network, FUSE, overlay, and
  unrecognized mounts are unavailable rather than assumed observable. The
  helper needs Python 3; inotify watch exhaustion also withholds CURRENT.
- `src/cli.mjs` executes checks against before/after checkpoints and records
  results; `src/run-lock.mjs` protects a single writer.
- `bin/redue.mjs` owns public CLI parsing, readable output and config/state
  placement. No presentation surface owns verification semantics.

The supported path is local named checks with declared files, installed inputs,
and read-only probes. There is no background check rerunning, CI evidence
ingestion, or passive capture of direct commands. The npm TypeScript contract
is intentionally narrow, not a proof of arbitrary JavaScript dependencies.

Presentation consumes evidence; it does not grant applicability. Execution outcomes, current inputs, and reuse eligibility remain distinct. History accelerates observation; deterministic reconciliation is its correctness fallback. See [observation recovery](observation-recovery.md).
