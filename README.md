# REDUE

**Know which checks still hold. Redo what's due.**

You or your coding agent ran the typecheck, the linter or the tests. Then the
code changed, or a new agent session started with no memory of it. REDUE
records each check's result with the exact inputs it ran on, and tells you and
your agent whether that result still applies to the code you have now, so a
check that still holds is not run again and one that is stale is.

## Quickstart (about 5 minutes)

You need macOS or Linux, Node 22 or 24, Git, Claude Code, and either a
JavaScript or TypeScript project with its dependencies installed
(`npm install`, `pnpm install` or `yarn`), or a Python project with a `.venv`
in its root (`uv sync`, or Poetry with in-project virtualenvs). On Linux, also
Python 3.

```sh
npm install --global @redue/cli@alpha
cd your-project
redue setup claude
```

`setup` shows what it will do and asks once (`--yes` skips the question). It
stops before writing anything if the dependencies are not installed. It:

- finds your typecheck, lint and test scripts and writes `redue.config.json`
  (it never changes your scripts, source or dependencies). Checks REDUE can
  only record, not reuse, are listed as recording-only;
- connects Claude Code: a short section in `CLAUDE.md`, a skill, and two hooks
  in `.claude/settings.local.json`;
- starts REDUE's file observer, waits while it indexes the project (a minute
  or more in a large one), then runs each check that can qualify once, so
  there is a first result to reuse;
- prints every file it writes. Running it again changes nothing.

Then start a new Claude Code session in the project and work as usual. When
the agent is about to rerun a check whose last pass still applies, the hook
skips it and tells the agent why. After an edit, the hook runs the check
through REDUE so the new result is recorded.

To look yourself:

```text
$ redue status --sync
✓ typecheck  CURRENT / PASS
✓ lint  CURRENT / PASS

# after editing src/main.ts
$ redue explain typecheck
typecheck: STALE / PASS
src/main.ts changed
Due again when verification is needed: redue run "typecheck"
```

`--sync` checks the files and your environment before it answers; this is
what the agent asks. Plain `redue status` is a fast cached answer and can say
UNVERIFIED ("cannot confirm your execution context") where `--sync` would say
CURRENT.

To undo everything setup did: `redue remove`.

## What it covers today

In a census of 120 active public TypeScript repositories (October 2026, REDUE
at commit 046cd0e, before 0.1.0-alpha.26), each installed as its users would,
with dependencies' install scripts on, 86 installed cleanly on a macOS runner.
A check counts when two recorded runs on the same code both came out CURRENT
on the same inputs. 35 repositories had at least one such check:

| Check | Repositories | How |
|---|---|---|
| Typecheck | 22 | 15 by running the project's script in an OS sandbox ([sandboxed recipe](docs/user/sandbox.md)); 5 by running the local `tsc` directly ([direct recipe](docs/user/direct-typescript.md)); 2 by running the script with every Node process recorded ([general recipe](docs/user/node-script.md)) |
| Lint | 25 | 21 sandboxed recipe, 4 general recipe |
| Tests | 2 | Vitest run directly ([direct test recipe](docs/user/tests-direct.md)) |

In a census of 120 Python repositories, 75 installed on a Linux runner
and 23 had a qualifying check: typecheck (mypy, pyright, ty) 15, lint (ruff)
22, all through the sandboxed recipe. On Linux, every sandboxed run was traced
with strace: each file it read in the checkout was a recorded input, a cache
or its own output.

Everything else stays UNVERIFIED, with a reason you can read in
`redue explain`. The usual ones: a script starts a program REDUE cannot see
into and the sandbox can't run (inside Claude Code's macOS sandbox, on
Windows), the project uses Bun, or a check writes into its own inputs.
[Supported projects](docs/user/supported-projects.md) has the details.

## Measured with Claude Code

Headless Claude Code sessions (Sonnet 5.5, CI Linux runner) on the same tasks
with and without REDUE, three sessions per task. Session time, medians per
task summed over the projects:

- **Typecheck** (twilio-node, semiotic, Ultra-Card, SwitchHosts; four tasks;
  96 sessions; 0.1.0-alpha.12 code): 464 s without, 330 s with. REDUE skipped
  33 typechecks. Each was checked afterwards with plain `tsc` on the exact tree
  it was skipped on, and all 33 agreed.
- **Unit tests** (cheerio with Vitest 4, SwitchHosts with Vitest 5, twilio-node
  with Jest 29; four tasks; 72 sessions; 0.1.0-alpha.14 code): 515 s without,
  295 s with. REDUE skipped 21 test runs. Each was rerun plainly three times on
  the exact tree, and all passed every time.

API cost was the same in both arms. The savings come only when an earlier
pass still applies: a task that changes source code saves nothing. A handful
of projects and three runs per task show direction, not a general rate. The
harness, tasks and raw results are in [`eval/`](eval/README.md).

## What REDUE won't do

- **Prove your code is correct.** CURRENT means the inputs of the recorded
  run are unchanged, not that the code works. A failure stays a failure.
- **Run checks for you.** Nothing runs in the background; checks run when you
  or the agent run them.
- **Trust what it cannot see.** A program it cannot account for, a file it
  does not observe, or a gap in observation makes the result UNVERIFIED and
  says why. It never turns that into CURRENT by guessing.
- **Support yet:** TypeScript 7's native compiler, Bun, per-package checks in
  large monorepos, results shared across machines, and the general recipe on
  Windows (Windows has the strict recipes only).

## What the states mean

| State | Meaning | Next step |
| --- | --- | --- |
| CURRENT | The recorded result applies to the code as it is now. | Reuse a pass; no need to rerun. |
| STALE | An input changed since the recorded result. | Rerun when you need the answer. |
| UNVERIFIED | REDUE cannot tell: no result yet, an input it cannot see, or observation not ready. | Read the reason; rerun if it matters. |
| FAILED | The last run failed: the check ran and reported a failure, or could not run. | Fix and rerun. |

## Without Claude Code, or step by step

```sh
redue init          # write redue.config.json from your scripts
redue start         # start the file observer
redue run typecheck # run a check through REDUE and record the result
redue status --sync # what still holds
```

Codex is supported too (`redue agent setup codex --apply`); see
[agents](docs/user/agents.md). Agents should read
[the JSON interface](docs/user/json.md), not the terminal text.

[Getting started](docs/user/getting-started.md) · [User docs](docs/README.md) ·
[Contributing](CONTRIBUTING.md) · [Architecture](docs/contributor/architecture.md)

## License

REDUE is licensed under [Apache-2.0](LICENSE). Dependencies keep their own licenses.
