# REDUE

**Know what is verified on the code you have now.**

Your typecheck, linter and tests passed at some point. Then the code
changed, or a new agent session started with no memory of what ran. REDUE
records each check's result with the exact inputs it ran on, and gives you
and your coding agent one dependable answer: which checks are verified on
the code as it is now, which are stale, and which are due. When it cannot
tell, it says so and why; it never guesses a result into place.

## What it changes

Coding agents often finish without running every check on their final code,
and then say everything passes. We ran headless Claude Code sessions on
realistic tasks whose prompts never mention checks (bug fixes, small
features and refactors; 21 tasks on 7 TypeScript and Python projects, two
runs each, so 42 sessions per model and setup) in four setups:

- **No instruction.**
- **Generic instruction:** `CLAUDE.md` says "Before you finish, run the
  project's typecheck, lint and tests."
- **Exact commands:** `CLAUDE.md` names each check's command and asks the
  agent to run them on its final code.
- **REDUE:** `redue setup claude`, nothing else (REDUE at commit f1c95ae,
  after 0.1.0-alpha.33).

Sonnet 5.5 / Opus 5.5:

| Setup | Every check verified on the final code | Claims all pass, a check not verified | False alarms | Median session time |
|---|---|---|---|---|
| No instruction | 12% / 48% | 33% / 45% | 0 / 0 | 39 s / 65 s |
| Generic instruction | 64% / 90% | 31% / 10% | 0 / 0 | 50 s / 69 s |
| Exact commands | 93% / 98% | 5% / 2% | 0 / 0 | 47 s / 61 s |
| REDUE | 100% / 100% | 0% / 0% | 0 / 0 | 44 s / 65 s |

- **Verified:** the session ran all of the check on the final code, or REDUE
  said CURRENT for it at the end. Counting only the agents' own check
  commands, REDUE sessions reached 90% and 100%.
- **Claims all pass, a check not verified:** the final message says or
  implies that every check passes while at least one was not verified. A
  reader agent labelled each final message with a fixed rubric.
- **False alarm:** the session ran every check in full on the final code and
  each passed, but the agent or REDUE said one was not verified. With REDUE,
  the final status was CURRENT / PASS for every check in all 84 sessions.
- **Failing checks:** REDUE never said CURRENT / PASS for a check that failed
  when run plainly on the final code. With no instruction, 4 Sonnet sessions
  ended with a failing check they had not run; with REDUE, none did.

Naming the exact commands gets close on verification, but agents still
claimed a pass for a check they had not run on the final code. REDUE also
tells the agent which earlier passes still apply (see the time saved below).
The harness and tasks are in [`eval/`](eval/README.md).

## Quickstart

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
  (it never changes your scripts, source or dependencies). In a Python
  project it finds these tools in `.venv/bin`, with the arguments your CI
  workflows, Makefile, justfile, tox, nox or scripts give them: mypy,
  pyright and ty (typecheck), ruff (lint) and pytest (test). It says which
  checks it left out and why, and which it can only record, not reuse;
- connects Claude Code: a short section in `CLAUDE.md`, a skill, hooks in
  `.claude/settings.local.json`, and a status line there. A status line you
  already have stays;
- starts REDUE's file observer, waits while it indexes the project (a minute
  or more in a large one), then runs each check that can qualify once, so
  there is a first result, and prints one line per run (the run's own output
  only when it fails);
- prints every file it writes. Running it again changes nothing.

Setup takes a minute or two in most projects. It can take longer in a large
environment, such as a `.venv` with PyTorch or a workspace with many
packages, because the observer indexes every installed file first, and with
a slow test suite, because `init` runs each check once plainly and once in
the sandbox before it chooses how to run it. Each of those trial runs stops
after 5 minutes; a check that runs longer is left out of the sandbox, and
setup names it and prints the command that tries it without the limit, such
as `redue init --check test --no-time-limit`. A check whose trial was refused
a few files the sandbox hides (a generated file git ignores, a license text)
gets just those files visible, up to 3, as inputs, instead of the whole
checkout. For pytest, `init` takes the
arguments the project's own workflows run it with, and prefers a
pull-request workflow that leaves slow tests out (`-m "not slow"`). The hook
counts that command with output options such as `-q` or `--tb=short` added at
the end as the same check.

Then start a new Claude Code session in the project and work as usual. The
status line shows where things stand, updated as the agent works:

```text
REDUE ✓ 3 verified
REDUE ✓ 2 verified · 1 due: typecheck
REDUE ✓ 2 verified · 1 not verifiable
```

When the agent runs a check whose last pass still applies, the hook skips
the rerun and tells it why; after an edit, the hook runs the check through
REDUE so the new result is recorded. When the agent is about to finish a
turn in which files changed while a check is due, the hook asks it once to
run `redue verify` first (`"endOfTurnCheck": false` in the config turns
this off).

To ask yourself:

```text
$ redue status
✓ typecheck  CURRENT / PASS
✓ lint  CURRENT / PASS
✓ test  CURRENT / PASS

# after editing src/main.ts
$ redue status
⚠ typecheck  STALE / PASS
  src/main.ts changed
⚠ lint  STALE / PASS
  src/main.ts changed
✓ test  CURRENT / PASS

$ redue verify
redue verify: running typecheck (STALE: src/main.ts changed)
typecheck: PASS recorded.
Check redue status before reusing this evidence.
redue verify: running lint (STALE: src/main.ts changed)
lint: PASS recorded.
Check redue status before reusing this evidence.

✓ typecheck  CURRENT / PASS
✓ lint  CURRENT / PASS
✓ test  CURRENT / PASS
Verified: every check that can be verified (3) passed on the files as they are now.
```

`redue status` checks the files and your environment before it answers, as
the agent's hook does. `redue status --cached` gives the last answer the
observer published without checking; it can say UNVERIFIED ("cannot confirm
your execution context") where `redue status` would say CURRENT.
`redue explain CHECK` says why a check is in its state.

`redue verify` runs every check that is due (STALE, or UNVERIFIED with a
command it can run), then prints the status. It exits 0 only when every
check that can be verified ends CURRENT / PASS, so it answers "is everything
verified on the code as it is now?" in one command. A check no run can
confirm is shown as NOT VERIFIABLE with the reason, and left out: a
recording-only check, one whose runs change its own inputs (two passing
runs in a row changed the same files, such as a test script that rebuilds a
tracked bundle), or one whose last passing run used inputs REDUE does not
observe (a test suite that starts `find` or reads git-ignored files). Any
other change, or a failing run, makes the first two due again. The last kind
stays NOT VERIFIABLE until `redue run CHECK` passes without those inputs:
the Claude Code hook lets its command run as written, so it costs no more
than without REDUE.

`redue stats` shows, per check, the reruns the hook skipped, the time saved,
the recorded runs and the top reasons a check was UNVERIFIED, from a log kept
on your machine.

To undo everything setup did: `redue remove`.

## Time saved, as a bonus

A check whose last pass still applies does not run again. Headless Claude
Code sessions (Sonnet 5.5, CI Linux runner) on the same tasks with and
without REDUE, three sessions per task. Session time, medians per task
summed over the projects:

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
of projects and three runs per task show direction, not a general rate.

## Still CURRENT after your build and tests

Running the project's build or tests writes files (`dist/`, `.next/`,
coverage). REDUE leaves those out when the files are git-ignored, so a
typecheck or lint that passed stays CURRENT. In the census, after each
project's own build, tests, typecheck and lint ran, the share of sandboxed
checks still CURRENT:

| | alpha.26 | alpha.27 |
|---|---|---|
| TypeScript, Linux | 5 of 43 | 31 of 37 |
| TypeScript, macOS | 5 of 38 | 24 of 34 |
| Python, Linux | 24 of 37 | 31 of 38 |
| Python, macOS | 20 of 33 | 28 of 34 |

The rest changed for real: the build rewrote a tracked file (a sitemap, a
feed, a generated source), added a file git doesn't ignore, or installed
packages.

## What it covers today

In a census of 120 active public TypeScript repositories (November 2026, REDUE
at commit 8cb32d6, before 0.1.0-alpha.29), each installed as its users would,
with dependencies' install scripts on, 89 installed cleanly on a macOS runner.
A check counts when two recorded runs on the same code both came out CURRENT
on the same inputs. 34 repositories had at least one such check:

| Check | Repositories | How |
|---|---|---|
| Typecheck | 20 | 13 by running the project's script in an OS sandbox ([sandboxed recipe](docs/user/sandbox.md)), 12 of them with the files git ignores and the documentation hidden; 5 by running the local `tsc` directly ([direct recipe](docs/user/direct-typescript.md)); 2 by running the script with every Node process recorded ([general recipe](docs/user/node-script.md)) |
| Lint | 20 | 16 sandboxed recipe (14 with ignored files and documentation hidden, 1 with ignored files hidden), 4 general recipe |
| Tests | 11 | 9 sandboxed recipe with no network (6 with ignored files and documentation hidden, 3 with ignored files hidden); 2 Vitest run directly ([direct test recipe](docs/user/tests-direct.md)) |

alpha.28 found 38 repositories on macOS. Test runs there no longer get
loopback, which cost 1 test suite (it starts a server on 127.0.0.1). Of the
other 3, one lint check was lost to a documentation-hiding bug fixed before
this release, one checkout now installs with pnpm in a way REDUE does not
take, and one `init` did not answer within the census's 10 minutes. On
Linux, where tests keep loopback, 10 test suites qualified.

In a census of 120 Python repositories, 74 installed on a Linux runner
and 31 had a qualifying check: typecheck (mypy, pyright, ty) 15, lint (ruff)
22, tests (pytest) 17, all through the sandboxed recipe (15, 22 and 12 of
them with ignored files and documentation hidden). On Linux, every sandboxed
run was traced with strace: each file it read in the checkout was a recorded
input, a cache or its own output.

Everything else stays UNVERIFIED, with a reason you can read in
`redue explain`. The usual ones: a script starts a program REDUE cannot see
into and the sandbox can't run (inside Claude Code's macOS sandbox, on
Windows), the project uses Bun, or a check writes into its own inputs
(a Jest cache in the checkout is not one when the project's Jest
configuration names it).
[Supported projects](docs/user/supported-projects.md) has the details.

## What REDUE won't do

- **Prove your code is correct.** CURRENT means the inputs of the recorded
  run are unchanged, not that the code works. A failure stays a failure.
- **Run checks for you.** Nothing runs in the background; checks run when you
  or the agent run them.
- **Trust what it cannot see.** A program it cannot account for, a file it
  does not observe, or a gap in observation makes the result UNVERIFIED and
  says why. It never turns that into CURRENT by guessing.
- **Support yet:** Bun, per-package checks in large monorepos, results shared
  across machines, and the general recipe on Windows (Windows has the strict
  recipes only). TypeScript 7's native compiler is covered: a typecheck that
  runs it gets the [sandboxed recipe](docs/user/sandbox.md).

## What the states mean

| State | Meaning | Next step |
| --- | --- | --- |
| CURRENT | The recorded result applies to the code as it is now. | Reuse a pass; no need to rerun. |
| STALE | An input changed since the recorded result. | Rerun when you need the answer. |
| UNVERIFIED | REDUE cannot tell: no result yet, an input it cannot see, or observation not ready. | Read the reason; rerun if it matters. |
| FAILED | The last run failed: the check ran and reported a failure, or could not run. | Fix and rerun. |
| NOT VERIFIABLE | No run can confirm a result: a recording-only check, or one whose runs change its own inputs. | Read the reason; `redue verify` leaves it out. |

## Without Claude Code, or step by step

```sh
redue init          # write redue.config.json from your scripts
redue start         # start the file observer
redue run typecheck # run a check through REDUE and record the result
redue status        # what still holds
redue verify        # run what is due; exit 0 when everything is CURRENT / PASS
```

Codex is supported too (`redue agent setup codex --apply`); see
[agents](docs/user/agents.md). Agents should read
[the JSON interface](docs/user/json.md), not the terminal text.

[Getting started](docs/user/getting-started.md) · [User docs](docs/README.md) ·
[Contributing](CONTRIBUTING.md) · [Architecture](docs/contributor/architecture.md)

## License

REDUE is licensed under [Apache-2.0](LICENSE). Dependencies keep their own licenses.
