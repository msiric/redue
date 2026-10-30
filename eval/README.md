# Agent A/B harness

Measures whether REDUE saves a coding agent time, and checks that it never lets
the agent skip a typecheck it needed. Each task runs on the same repo commit and
model without REDUE (control) and with it, three times per arm by default
(`--runs N`).

Results, transcripts and clones stay out of git: results go to `.local/eval/`,
clones to `$TMPDIR/redue-eval/`.

## Files

- `repos.json`: public repos, each pinned to a commit, with the npm script that
  typechecks, whether its tests are quick enough to run as a check, and for
  lint tasks the plain lint command (`lint`) and the lint script (`lintScript`).
  A Python repo gives its install command as argv (`install`, such as
  `uv sync --frozen`) and its plain typecheck command (`typecheck`); its REDUE
  arm uses the sandboxed recipe, and a skipped or CURRENT tree is checked with
  the check's own command, in the run's checkout after the session.
- `tasks.json`: agent prompts per repo. `kind` says whether REDUE should help
  (`docs`, `reverify`, `mixed`) or not (`source`). `expect` lists text the
  final files must contain. `pilot: true` marks the pilot set.
- `screen.mjs`: checks that repos qualify for the direct TypeScript recipe and
  times plain tsc and tests.
- `run.mjs`: runs the sessions and writes `results.json` and `results.md`.
  `expect` rules check a file with `includes`, `excludes` or `matches`, or
  check that the session changed no files with `unchanged: true`.
- `report.mjs`: re-renders `results.md` from `results.json`.
- `census.mjs`: for each repo in `census-repos.json` (or named), installs it,
  records what `redue init` makes of it, and times its typecheck, lint, build
  and test scripts. Research data, not a pass/fail screen. `--product` instead
  runs each general check REDUE's `init --recipe node-script` writes twice with
  `redue run`, and `census-report.mjs` counts the checks that qualify. Every
  command runs in its own process group (`group-run.mjs`), so a timeout stops
  everything it started.
- `python-census.mjs` (`census.mjs --python`): for each repo in
  `python-census-repos.json`, installs it with its package manager, and runs
  the test, typecheck and lint commands `py-audit/inspect_project.py` finds in
  its CI, scripts, Makefile or tox.ini: twice timed, once under the audit-hook
  prototype `py-audit/sitecustomize.py` and strace (what the hook misses), and
  tests once more with the network off. Research data for Python support.
  `--product` instead runs `redue init` and two `redue run`s of each check it
  writes (`product-runs.mjs`, shared with `census.mjs --product`).
- `sandbox-check.mjs`: on Linux, the product census traces each sandboxed run
  with strace and checks that every file it read in the checkout is an input
  the receipt holds, a runner cache, or the run's own output, and that nothing
  outside the allowed places was read. A trusted run that read anything else
  is critical. Reads in `.git`, which tools see but REDUE does not observe,
  are listed apart.
- `pnpm-shim-templates.mjs`: rebuilds `src/pnpm-shim-templates.json`, the
  launcher templates pnpm releases write, by installing a small workspace with
  each release offline.

## Run

```sh
node eval/screen.mjs                 # check eval/repos.json
node eval/screen.mjs owner/name ...  # screen new candidates
node eval/run.mjs --pilot            # pilot set, both arms
node eval/run.mjs --repo owner/name --task docs-edit --arms redue
```

`--profile` makes the REDUE arm write REDUE's timing trace to each run's
`profile.jsonl`, for finding where a slow hook or status call spends its time.

`claude` must be logged in. `run.mjs` works from a normal terminal or from
inside a Claude Code session. It strips the parent session's `CLAUDE_CODE_*`
variables.

In CI, `.github/workflows/eval.yml` runs either script on a Linux runner and
uploads `.local/eval/` as an artifact:

```sh
gh workflow run eval.yml -f command=screen -f args="owner/name owner/name@commit"
gh workflow run eval.yml -f command=run -f args="--pilot"
gh workflow run eval.yml -f command=census -f args=--init-only   # 20 parallel shards
node eval/census-report.mjs DIR    # the progress metric from downloaded shard artifacts
gh workflow run eval.yml -f command=census -f args="--python --recorded"   # Python census; --recorded installs strace
```

Sessions there authenticate with the `CLAUDE_CODE_OAUTH_TOKEN` repository secret
(create it with `claude setup-token`). Only the `claude` process receives it,
and every result file is scanned and the token replaced with `<redacted>`
before upload.

## What a run does

1. Fresh local clone at the pinned commit, then `npm ci --prefer-offline --ignore-scripts`.
2. REDUE arm only: `redue init --recipe typescript-direct --check typecheck`
   (`tests-direct` for test tasks, `node-script` for lint tasks),
   `redue agent setup claude --apply`, `redue start`, wait for the first index,
   then `redue run typecheck`. That receipt stands for an earlier session's
   passing check. Setup time is recorded but not counted in the session's time.
   `redue` on PATH is a wrapper (`wrapper.mjs`) that logs every call and hook
   decision. On a skip, and on every `status --sync` that reports a check
   CURRENT, it records the working tree as a git tree object.
3. One headless session: `claude -p` with `--model`, `--max-turns`, tools
   limited to `Bash,Read,Edit,Write,Glob,Grep,Skill`, `--permission-mode
   dontAsk`, only project and local settings, no MCP servers, auto memory off,
   no session persistence. The control arm's PATH has no `redue`.
4. Independent checks: plain `tsc --noEmit` on the final tree, the repo's tests
   when quick, and the task's `expect` rules. Every skipped typecheck, and
   every CURRENT `status --sync` answer the agent got, is rerun with plain tsc
   on its tree.

A run is **critical** when REDUE's final status is CURRENT/PASS but plain tsc
fails, when plain tsc fails on a tree where the hook skipped a typecheck, or
when a CURRENT `status --sync` answer disagrees with plain tsc on its tree.

## Metrics

From the stream-json transcript: wall time, turns, cost, tokens, and every Bash
command that runs a typecheck (tsc, `redue run`, or a typecheck npm script).
From the wrapper log: hook decisions (skip, rewrite to `redue run`, allow) and
the agent's own `redue` calls. After each skip: whether the agent used
`REDUE_FORCE=1`, retried the same command, ran a different typecheck, or
argued: its next text says the typecheck could not be run or verified.
Naming the hook or the skip does not count.

`results.md` shows, per task, the median of the runs for each arm: session
time, input tokens and cost, with REDUE's savings and token overhead next to
each other. A second table gives the one-time setup cost per repo (init, agent
setup, start, first index) and the size of the instructions REDUE adds. A third
lists every run.

## Limits

- Three runs per cell show the spread, not significance.
- A CURRENT answer's tree is recorded after `status --sync` returns. An edit in
  between would make the check compare the wrong tree.
- Install scripts are skipped in both arms, so repos that need them for
  typechecking don't qualify.
- A skip is verified with the run's `node_modules` as they are at the end of
  the session.
