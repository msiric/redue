# REDUE

REDUE tells developers and coding agents whether an earlier verification result
(e.g. `tsc --noEmit` PASS) still applies to the code they have now. Ship
user-visible improvements to that, quickly and correctly.

## Commands

- `npm ci`, then `npm run pretest` once (installs the TS 5.5.2 test fixture).
- Single test file: `node --test test/<name>.test.mjs`. Full suite: `npm test`
  (~5 min, serial). Run the full suite before opening a PR, not after every edit.
- Benchmark (the acceptance loop for performance work):
  `node bench/setup.mjs ../redue-bench-800 800` once, then
  `node bench/run.mjs ../redue-bench-800`. It prints a `BENCH_RESULT` JSON line
  and exits 1 if any returned state is wrong.
- The direct-TypeScript recipe refuses most `NODE_*` variables; the bench strips
  them. If `init` says `direct-execution-environment-unsupported`, check `env`.
- PR CI runs the full suite on macOS, Linux and Windows. Tests for other
  platforms skip locally; CI is where they run.

## Product rules

- Outcomes are immutable. A historical FAIL never shows as PASS; a STALE result
  is never CURRENT. When REDUE cannot tell, it returns UNVERIFIED with a reason.
- Threat model: honest developers and agents, concurrent edits, missed or
  delayed filesystem events. Out of scope: same-user malicious processes,
  compromised OS or toolchain, and a file changed and restored entirely within one
  run. Document out-of-scope limits; don't build machinery against them.
- Performance is part of correctness. Targets on the bench: warm `status --sync`
  adds < 100 ms over cached `status`; zero probe processes while idle; `redue run`
  overhead < 10% of plain `tsc`. Report BENCH_RESULT before/after in every
  performance PR.

## How to work

- Commit straight to main; no PRs unless I ask.
- Before each commit, run the affected tests, plus the bench for performance
  work. For daemon, observation or trust changes, also run /code-review and fix
  the findings that affect correctness.
- Commit with a clear message, push, and continue. Don't wait for CI.
- At the start of each session, run `gh run list --branch main --limit 3`. If
  the latest run failed, fix that first.
- Prefer the smallest change that makes the behavior right. Before adding a new
  subsystem, native code, a CI workflow, or a new config surface, stop and ask.
- After two failed approaches to the same problem, stop and tell me: what failed,
  why, and whether narrowing the claim would solve it.
- Never add Co-Authored-By trailers or 'Generated with Claude Code' lines to commits or PRs.
- Never publish to npm, create tags/releases, or force-push. Never delete
  untracked or ignored files (`.local/` holds owner data).
- Branches `dev/portable-*` and `archive/*` are reference only. Don't read their
  `docs/plan` or `docs/acceptance` files unless I ask; they are very large.

## Writing

Plain, short sentences. PR descriptions: what changed, why, before/after numbers,
known limits. No hedging vocabulary ("bounded", "retained", "without authority").
