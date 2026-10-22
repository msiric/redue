# REDUE

REDUE tells developers and coding agents whether an earlier verification result
(e.g. `tsc --noEmit` PASS) still applies to the code they have now. Ship
user-visible improvements to that, quickly and correctly.

## Commands

- `npm ci`, then `npm run pretest` once (installs the TS 5.5.2, 6.0.2 and 6.0.3
  test fixtures).
- Single test file: `node --test test/<name>.test.mjs`. Full suite: `npm test`
  (~5 min, serial). Run the full suite before pushing, not after every edit.
- Benchmark (the acceptance loop for performance work):
  `node bench/setup.mjs ../redue-bench-800 800` once, then
  `node bench/run.mjs ../redue-bench-800`. It prints a `BENCH_RESULT` JSON line
  and exits 1 if any returned state is wrong.
- The direct-TypeScript recipe refuses `NODE_*` values it cannot classify
  (`directVariableIssue` in src/direct-typescript.mjs); the bench strips only
  those. If `init` says `direct-execution-environment-unsupported`, check `env`.
- On the owner's Mac, `~/.zshenv` refreshes a work npm token with
  `git credential fill`, only in an interactive terminal (fixed 2026-10-18).
  If Bash commands hang with "Updating NPM credential", that guard is gone; ask
  the owner. `~/.claude/settings.json` sets `GCM_INTERACTIVE=false` and
  `GIT_TERMINAL_PROMPT=0` so git never waits for a sign-in. npm's registry
  there is a company feed; publish from CI, not from the Mac.
- CI runs the full suite on macOS, Linux and Windows for each push to main.
  Pushes that change only docs or Markdown skip it. Tests for other platforms
  skip locally; CI is where they run.

## Product rules

- Outcomes are immutable. A historical FAIL never shows as PASS; a STALE result
  is never CURRENT. When REDUE cannot tell, it returns UNVERIFIED with a reason.
- Threat model: honest developers and agents, concurrent edits, missed or
  delayed filesystem events. Out of scope: same-user malicious processes,
  compromised OS or toolchain, and a file changed and restored entirely within one
  run. Document out-of-scope limits; don't build machinery against them.
- Performance is part of correctness. Targets on the bench: warm `status --sync`
  adds < 100 ms over cached `status`; zero probe processes while idle; `redue run`
  overhead < 10% of plain `tsc`. Put BENCH_RESULT before/after in the commit
  message for performance work.

## How to work

- Commit straight to main; no PRs unless I ask.
- Before each commit, run the affected tests, plus the bench for performance
  work. For daemon, observation or trust changes, also run /code-review and fix
  the findings that affect correctness.
- Commit with a clear message, push, and continue. Don't wait for CI. Don't
  commit status or tracking documents on their own.
- Before each push, check whether CI on the previous push failed
  (`gh run list --branch main --limit 3`); ignore runs still in progress. If it
  failed, fix that first.
- At the start of each session, run `gh run list --branch main --limit 3`. If
  the latest run failed, fix that first.
- Prefer the smallest change that makes the behavior right. Before adding a new
  subsystem, native code, a CI workflow, or a new config surface, stop and ask.
- After two failed approaches to the same problem, stop and tell me: what failed,
  why, and whether narrowing the claim would solve it.
- Never add Co-Authored-By trailers or 'Generated with Claude Code' lines to commits or PRs.
- Alpha releases: you may tag and publish one through the publish workflow
  (docs/contributor/releasing.md), only from main, only when CI on that commit
  is green, and only after the release conditions I gave for it are met.
  Nothing else is published, tagged or released. Never force-push. Never delete
  untracked or ignored files (`.local/` holds owner data).
- Branches `dev/portable-*` and `archive/*` are reference only. Don't read their
  `docs/plan` or `docs/acceptance` files unless I ask; they are very large.
- Deferred: the asynchronous daemon probe. `wip/async-probe-v1` and
  `wip/async-probe-v2` are reference only; reviews found event-ordering
  problems in both. Don't resume it unless I ask.

## Writing

Plain, short sentences. Commit messages: what changed, why, before/after numbers,
known limits. No hedging vocabulary ("bounded", "retained", "without authority").
