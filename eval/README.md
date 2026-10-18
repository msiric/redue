# Agent A/B harness

Measures whether REDUE saves a coding agent time, and checks that it never lets
the agent skip a typecheck it needed. Each task runs twice on the same repo
commit and model: once without REDUE (control) and once with it.

Results, transcripts and clones stay out of git: results go to `.local/eval/`,
clones to `$TMPDIR/redue-eval/`.

## Files

- `repos.json`: public repos, each pinned to a commit, with the npm script that
  typechecks and whether its tests are quick enough to run as a check.
- `tasks.json`: agent prompts per repo. `kind` says whether REDUE should help
  (`docs`, `reverify`, `mixed`) or not (`source`). `expect` lists text the
  final files must contain. `pilot: true` marks the pilot set.
- `screen.mjs`: checks that repos qualify for the direct TypeScript recipe and
  times plain tsc and tests.
- `run.mjs`: runs the sessions and writes `results.json` and `results.md`.
- `report.mjs`: re-renders `results.md` from `results.json`.

## Run

```sh
node eval/screen.mjs                 # check eval/repos.json
node eval/screen.mjs owner/name ...  # screen new candidates
node eval/run.mjs --pilot            # pilot set, both arms
node eval/run.mjs --repo owner/name --task docs-edit --arms redue
```

`claude` must be logged in. `run.mjs` works from a normal terminal or from
inside a Claude Code session. It strips the parent session's `CLAUDE_CODE_*`
variables.

## What a run does

1. Fresh local clone at the pinned commit, then `npm ci --prefer-offline --ignore-scripts`.
2. REDUE arm only: `redue init --recipe typescript-direct --check typecheck`,
   `redue agent setup claude --apply`, `redue start`, wait for the first index,
   then `redue run typecheck`. That receipt stands for an earlier session's
   passing check. Setup time is recorded but not counted in the session's time.
   `redue` on PATH is a wrapper (`wrapper.mjs`) that logs every call and hook
   decision. On a skip it records the working tree as a git tree object.
3. One headless session: `claude -p` with `--model`, `--max-turns`, tools
   limited to `Bash,Read,Edit,Write,Glob,Grep,Skill`, `--permission-mode
   dontAsk`, only project and local settings, no MCP servers, auto memory off,
   no session persistence. The control arm's PATH has no `redue`.
4. Independent checks: plain `tsc --noEmit` on the final tree, the repo's tests
   when quick, and the task's `expect` rules. Every skipped typecheck is rerun
   with plain tsc on the tree it was skipped on.

A run is **critical** when REDUE's final status is CURRENT/PASS but plain tsc
fails, or when plain tsc fails on a tree where the hook skipped a typecheck.

## Metrics

From the stream-json transcript: wall time, turns, cost, tokens, and every Bash
command that runs a typecheck (tsc, `redue run`, or a typecheck npm script).
From the wrapper log: hook decisions (skip, rewrite to `redue run`, allow) and
the agent's own `redue` calls. After each skip: whether the agent used
`REDUE_FORCE=1`, retried the same command, ran a different typecheck, or
argued with the message before its next edit.

## Limits

- One run per cell measures direction, not significance.
- Install scripts are skipped in both arms, so repos that need them for
  typechecking don't qualify.
- A skip is verified with the run's `node_modules` as they are at the end of
  the session.
