# Changelog

## 0.1.0-alpha.36 — 2026-11-11

From a rehearsal with 5 projects REDUE had not seen (zustand, ofetch,
@hono/node-server, httpx, click), set up from the README by a fresh agent.

- **Agent and terminal agree on pnpm and Yarn projects.** Claude Code's shell
  sets `COREPACK_ENABLE_AUTO_PIN=0` and a terminal does not, so every check
  recorded by one was STALE for the other. Corepack reads that variable only
  when no `package.json` names a `packageManager`; REDUE no longer compares it
  when the project's does.
- **A linter that reads every Markdown file.** A check refused only
  documentation at its trial gets all documentation visible (`sandbox-v2`),
  so a file added later is an input, not a refusal. `redue setup` creates
  the `CLAUDE.md` and skill files it writes, empty, while the trials run. On
  ofetch, every lint run had failed on setup's `CLAUDE.md` and run again.
  A check that reads one documentation file now goes STALE on any edit to
  documentation.
- **Shorter setup output.** One line per file it writes, and only the notes
  that still apply (about 25 lines, from about 100).
- **A check that never finished.** When a check's plain trial run did not
  finish in 5 minutes, setup says so and asks to check that it finishes
  before trying `--no-time-limit` (`time_limit_run` in `init --json`).

Measured: `init` on the 6 slowest census repos, Linux and macOS (census
43046779416), makes the same choices as alpha.34; its time is within
run-to-run variation (pi-web's tests finished their plain trial just inside
the 5-minute limit this time, so its sandboxed trial ran too). ofetch's lint
now gets all documentation visible.

## 0.1.0-alpha.35 — 2026-11-10

Setup takes less time on projects with slow checks.

- **Each sandbox trial runs once.** `redue setup` ran every check's trials
  twice: once to preview what it would set up, and again to write the
  config. It now writes the config the preview proposed.
- **No second run of a slow check.** A check whose plain trial run took 2
  minutes or more is not run again to record it: its first run, by you or
  the agent, records it. Until then it has no result.
- **Setup says where its time went.** It ends with one line: trying checks
  in the sandbox, indexing, recording runs.
- **Setup with an existing config** reads which checks can qualify from it,
  instead of trying every check in the sandbox again. A sandboxed check is
  recording-only there when the sandbox cannot run on this machine.
- **One retry for several refused files.** When a trial is refused several
  hidden files at once, they are all made visible in one more run.
- **`init --json` times each trial run** (`trial_runs`): plain or
  sandboxed, which sandboxed run, and how long it took.
- **Test scripts that build first (`build && test`).** REDUE can run a
  sandboxed test check as two steps, the tests seeing only what the build
  wrote, when its config has `steps`. `init` does not propose it yet: no
  real project has qualified this way so far.

Measured: `init` on the 6 slowest census repos, Linux and macOS, makes the
same choices as alpha.34; its time is within run-to-run variation (setup's
own savings are not in that measurement).

## 0.1.0-alpha.34 — 2026-11-10

Fewer false alarms and reminders, slow suites that REDUE can skip, and checks
REDUE cannot verify cost no more than without it.

- **Slow suites skipped when their pass still applies.** On
  jxxghp/MoviePilot (Python, a 90 s pytest check), Sonnet 5.5 sessions with
  REDUE spent 14 s in check commands on the turns after the first (a
  docs-only edit, a pull-request step, and a second session), against
  658 s for the same sessions told the exact commands, and 89 s of session
  time against 943 s. Both ended every step verified. One repo, three runs:
  this shows the mechanism, not a rate.
- **Checks REDUE cannot verify cost no more than without it.** After one
  passing run that used inputs REDUE does not observe (a file git ignores,
  a program the recorder cannot follow), the check is NOT VERIFIABLE, also
  after edits: `redue verify` and the end-of-turn check leave it out, and
  the Claude Code hook runs its command as written, without the recorder.
  A `redue run CHECK` that passes without them makes it verifiable again.
  On artsy/eigen the REDUE session spent 923 s against 910 s with the exact
  commands; before, 1,253 s against 584 s.
- **A check past init's 5-minute trial is recording-only.** init no longer
  writes a recipe it never tried. Setup still prints the `redue init --check
  KIND --no-time-limit` command, and that command now also rewrites the
  Claude Code hook rules and the CLAUDE.md block for the new config. Before,
  the hook had no rule for the newly verifiable check and its runs went
  unseen. `redue agent doctor` says when those files are out of date.
- **Fewer false alarms.** A read of REDUE's own `.claude/settings.local.json`
  is kept by content. Builds writing git-ignored output (dist/, build/) no
  longer make other checks STALE. A sandboxed suite that rewrites its
  git-ignored build output with the same bytes is CURRENT. Vitest's
  `.vitest` and `.vitest-cache` folders and the `cacheDirectory` a Jest
  configuration sets in the checkout are runner caches, not inputs.
- **Fewer reminders.** The end-of-turn check names only checks the work made
  due: STALE, or UNVERIFIED where a run would help (status's `needs_run`).
  The hook finds the setup from a subdirectory, and matches a pytest check
  run with output options at the end.
- **init tries more checks in the sandbox.** A trial refused only a few
  hidden files (a generated file, a license text) gets just those visible,
  as inputs. A test script the direct recipe takes is tried in the sandbox
  first. A failed trial keeps the sandboxed run's last lines in local state.
- **Killed runs.** A `redue run` killed before it finished no longer leaves
  a lock that blocks later runs.
- **CLAUDE.md names recording-only test and lint checks too**, so the agent
  still runs them.

Measured: the four-setup gap study in the README (21 tasks, 42 sessions per
model and setup) re-scored with the corrected classifier and one rule for
every setup is unchanged: REDUE 100% / 100% verified, 0 false alarms,
0 overclaims. Slow-check pilot (MoviePilot 3 runs, eigen 2 runs): 0 wrong
CURRENT, 0 overclaims in REDUE sessions (two readers, 52 steps). `init` on
the 6 slowest census repos, Linux and macOS: the same choices as before,
except 7 checks past the trial limit that are now recording-only instead
of an untried recipe; init time lower or the same on 9 of 12.

## 0.1.0-alpha.33 — 2026-11-06

pytest checks follow the project's quick suite, and the hook starts for
every check form.

- **The pull-request workflow's narrowed suite.** For pytest, `init` now
  reads `coverage run -m pytest`, quoted arguments (`-m "not slow"`) and
  lines continued with a backslash, and leaves out options that only write
  a report (`--junit-xml`, `--html`, `--durations`). When a workflow that
  runs on pull requests narrows the suite (`-m`, `-k`, `--ignore`,
  `--deselect`), its line wins. On project-lighter/lighter the test check is
  now `pytest tests -m "not slow"` (4.7 s), not the full suite with its
  CIFAR download: setup took 68 s instead of 10.5 minutes, and all three
  checks qualify.
- **Trigger rules that Claude Code matches.** A hook trigger rule with a
  quote in it never started the hook in a real session, so such a check's
  runs were neither skipped nor recorded. A rule now ends before the first
  character outside letters, digits, spaces and `_./:=,+@-`, and the hook
  matches the whole command itself, spaces inside quotes included.
- **`redue agent doctor` checks the trigger rules.** `trigger_rules` says
  whether the installed rules start the hook for every command form of
  every configured check, as REDUE models Claude Code's matching, and names
  the forms they miss.
- **README.** Setup can take longer with a large environment or a slow
  suite; trial runs stop at 5 minutes and `redue init --check test
  --no-time-limit` tries a check without the limit.

Measured: stranger sessions on lighter (alpha.32 code with these changes)
skipped mypy and pytest after a docs edit and ran both through REDUE after
a source change, 0 critical. Python product census: 0 critical; 17 test,
15 typecheck and 22 lint checks qualify, as in alpha.32. `init` on the 13
slowest census repos chose the same checks as alpha.32.

## 0.1.0-alpha.32 — 2026-11-05

REDUE's status is now the point: what is verified on the code as it is
now, what is stale, what is due.

- **`redue verify`.** Runs every check that is due (STALE, or UNVERIFIED
  with a program that exists), starting the observer if needed, then shows
  the full status. It exits 0 only when every check that can be verified
  ends CURRENT / PASS. `--json` gives `verified`, the checks it ran and the
  status. It runs what is due up to three rounds, since a run can make
  another check due.
- **Not verifiable.** A check no run can confirm shows as NOT VERIFIABLE
  with the reason: a recording-only check, or one whose last two passing
  runs changed the same inputs while they ran (a test script that rebuilds
  a tracked bundle). `verify`, its exit code, the end-of-turn check and the
  status line's due count leave it out; the status line shows it ("✓ 3
  verified · 1 not verifiable"). Any other change, or a failing run, makes
  it due again. JSON: `"verifiable": false` and a `not_verifiable` count.
- **A status line in Claude Code.** `redue setup claude` adds one:
  "REDUE ✓ 3 verified", "REDUE ✓ 1 verified · 2 due: typecheck, test",
  "REDUE ✗ 1 failing: lint". A status line you already have stays; setup
  prints the command instead.
- **End-of-turn check.** When the agent changed files during a turn and a
  check is due, the hook asks it once to run `redue verify` before it
  finishes. It never asks twice in a turn. `"endOfTurnCheck": false` in
  the config turns it off.
- **Faster sandboxed runs.** Receipts and checkpoints keep each installed
  tree (`.venv`, `node_modules`) as one digest, a run computes only its own
  check's context, and Linux keeps the Landlock probe's answer. What `redue
  run` adds to a sub-second check on GitHub's Linux runners fell from
  270-514 ms to 125-205 ms (lighter's ruff 514 to 155 ms); on macOS from
  390-710 ms to 310-435 ms, where an FSEvents history stall (150-190 ms in
  about a third of checkpoints) remains. The Landlock launcher now refuses
  a network-less run on a kernel below ABI 4.
- **Windows.** A status call before the first `redue start` no longer
  leaves a file that makes `start` refuse the state directory.

Measured with the verification-gap study (21 tasks on 7 repositories, 2
runs, Claude Code headless): sessions that ended with every check verified
on the final code went from 5 of 42 to 41 of 42 with Sonnet 5.5, and from
20 of 42 to 42 of 42 with Opus 5.5, with no check REDUE called CURRENT /
PASS failing on the final code. In the product census, 73% of 330 checks
had a definite answer (CURRENT or STALE) after their second run (alpha.29:
71%); 97% of those on the sandboxed recipe with ignored files and
documentation hidden. `init` on the 13 slowest census repos took 3874 s on
Linux and 4797 s on macOS (alpha.31: 4139 s and 5517 s), with the same
checks chosen.

## 0.1.0-alpha.31 — 2026-11-03

A check that runs longer than init's trial limit no longer holds up
`init` for three runs, and can be set up in the sandbox later.

- **A run past the trial limit never agrees.** Each trial run at `init`
  stops after 5 minutes. alpha.30 counted a timeout on both sides as
  agreement and ran every trial of a check that timed out. Now, when the
  plain run reaches the limit, `init` runs nothing in the sandbox and
  writes the fallback; when a sandboxed run reaches it, no further trial
  follows. On the 13 census repos with the slowest checks, `init --dry-run`
  took 6224 s in all with alpha.30 and 3670 s now on Linux, 8331 s and
  4776 s on macOS. ADOSMissionControl went from 1138 s to 581 s (Linux),
  agent-afk from 936 s to 323 s, Nomi from 860 s to 528 s (macOS). Checks
  that moved from the sandbox to their fallback: 2 of 210 on Linux
  (ts-liveview typecheck, open-science lint), 3 of 210 on macOS (Nomi and
  ts-liveview typecheck, OneUptime lint).
- **`redue init --no-time-limit`.** `redue setup` names the checks that
  ran past the limit and prints one command, such as
  `redue init --check typecheck --no-time-limit`. It runs their trials with
  no limit and updates only their rows in the existing config (a row that
  runs the same script), restarts a running observer, and leaves the
  config one `redue remove` still deletes. `init --json` gives such a
  check's kind as `time_limit`.

## 0.1.0-alpha.30 — 2026-11-03

`init` runs a check fewer times, and tests try the sandbox first.

- **Fewer trial runs at init.** A check proposed for the sandboxed recipe
  now runs once plainly and once in the sandbox with ignored files and
  documentation hidden (`sandbox-v3`). If they differ, it runs once more
  with the whole checkout (`sandbox-v1`), compared with the same plain run.
  When the plain run passed and the sandboxed one failed only on reading a
  hidden file, the check gets `sandbox-v1` without that run. `init` no
  longer tries `sandbox-v2`; existing `sandbox-v2` checks keep working.
  On the 13 census repos with the slowest checks, `init --dry-run` took
  4740 s in all before and 3870 s after on Linux, 6929 s and 5784 s on
  macOS. OneUptime went from 1204 s to 903 s (Linux) and 1206 s to 605 s
  (macOS). Nomi did not get faster (485 s to 383 s on Linux, 836 s to
  893 s on macOS): its typecheck agrees on the first trial, and each of its
  two runs stops at init's 5-minute limit.
- **Tests try the sandbox first.** For a Node test script, `init` tries the
  sandboxed recipe before the direct test recipe, which becomes its
  fallback, when both would run the same script. In the census, on the repos where both qualified (2 on each OS),
  the direct recipe's results went STALE when the project's build rewrote
  its output, and the sandboxed results stayed CURRENT. A test script now
  costs `init` one plain run and one or two sandboxed runs.
- Known limit: artsy/eigen's typecheck, which fails in the census, no
  longer agrees with the whole checkout at init and falls back to the
  general recipe (Linux) or recording (macOS).

## 0.1.0-alpha.29 — 2026-11-03

Editing documentation no longer makes sandboxed checks STALE, a fast check
is skipped or recorded as it should be, and macOS test runs can no longer
reach a service started outside them.

- **Documentation is hidden too (`sandbox-v3`).** A sandboxed run now also
  hides the project's documentation: files named `*.md`, `*.mdx`, `*.rst`,
  `LICENSE*` or `CHANGELOG*` anywhere, and text, image and PDF files in the
  root `docs/` folder (code there stays visible). The receipt names the
  files the run hid, and a later edit to one of them leaves the result
  CURRENT: editing the README no longer makes the tests STALE. A new
  documentation file still counts. `init` tries this first, then the
  git-ignored files only (`sandbox-v2`), then the whole checkout. A check
  that reads documentation (a doctest over the README) keeps `sandbox-v2`.
  Run `redue init` again to move an existing check to `sandbox-v3`.
- **A fast check is no longer missed by the hook.** The hook waited half of
  the check's last run for `redue status`, so a 0.2 s mypy got 0.1 s, the
  status answer came too late, and the agent's run went unrecorded. The
  wait is now at least 2 s. `REDUE_HOOK_LOG` (an absolute file path) makes
  the hook write one line per Bash command with its decision and why.
- **macOS test runs get no network.** Seatbelt cannot refuse only the ports
  that were already listening (a per-port rule under a loopback allow is not
  applied; an allow list of every other port does not compile), so a macOS
  test run now gets Unix sockets in its own temporary directory only, as a
  typecheck or lint does. A suite that needs loopback fails `init`'s trial
  and runs without REDUE. Test checks set up by alpha.28 on macOS are not
  CURRENT after the upgrade.
- **`redue status` reconciles by default.** `redue status --cached` gives the
  observer's last published answer; `--sync` is still accepted. Like
  `--sync`, plain `status` exits 2 when it cannot reach the observer (after
  `redue stop`, for example); `--cached` exits 0.
- **`redue setup` says more and prints less.** It lists the checks it left
  out and why (a kind it found nothing for, a proposed `tsc --noEmit` no
  recipe takes), says what recording only means, and prints one line per
  recorded run instead of the check's whole output.
- `redue remove-state` waits for the observer to exit before removing its
  state (a Windows ENOTEMPTY).
- **Measured.** In the product census, repositories whose qualifying
  sandboxed check keeps the documentation hidden, out of those with one:
  TypeScript on Linux, typecheck 17 of 19, lint 20 of 20, tests 7 of 8; on
  macOS 12 of 13, 14 of 16, 6 of 9. Python on Linux 15 of 15, 22 of 22, 12
  of 17; on macOS 11 of 13, 17 of 17, 8 of 11. No network for macOS test
  runs cost 1 TypeScript suite (it starts a server on 127.0.0.1) and 2
  Python suites: test suites qualifying on macOS went from 12 to 11
  (TypeScript) and 14 to 11 (Python; one checkout no longer installs). The
  strace cross-check found no read outside the recorded inputs. In a Claude
  Code follow-up on starlette and nestjs-api-gateway, a README edit made no
  check STALE; the hook skipped mypy, pytest and the lint, and each skipped
  command passed when run plainly.

## 0.1.0-alpha.28 — 2026-11-02

Test suites can run in the sandbox, so REDUE can reuse a passing test run
for more projects, Python included.

- **Sandboxed tests.** A root test script that the direct test recipe does
  not take, and pytest in a Python project's `.venv`, can now use the
  sandboxed recipe. `init` keeps it only when the run in the sandbox gives the
  same exit status and test counts as a plain run. On top of what a
  typecheck or lint gets, a test run gets:
  - **Loopback only.** It may listen on any address and connect to the local
    host and Unix sockets, never to a remote host. On macOS, Seatbelt
    enforces that. On Linux, a seccomp filter refuses UDP and other non-TCP
    sockets, TCP Fast Open and `io_uring`, and hands each `connect` to
    REDUE's launcher. The launcher allows a local port nothing listens on or
    one the run's own processes listen on, and refuses everything else,
    including a service you started outside the run (a local database). If
    the launcher cannot start or stops early, the result is UNVERIFIED.
  - **A private `/tmp`.** Its `TMPDIR` is new for each run, and it may not
    write elsewhere in `/tmp` or `/var/tmp`.
  - **A fresh home** for each run, as on CI.
  - **Ignored files hidden** when the trial agrees, else the whole checkout.
- **Measured.** In the product census, test suites with a qualifying check
  (alpha.27 in brackets): TypeScript on Linux 11 (2), on macOS 12 (2);
  Python on Linux 17 (0), on macOS 14 (0). The strace cross-check found no
  read outside the recorded inputs. The Linux connect supervisor added at
  most 1.5% over the sandbox without it on suites with worker processes
  (pytest-xdist, Jest, Vitest): apprise 233 s to 237 s, run-to-run spread
  218-243 s. In a pilot with Claude Code on two pytest projects, the hook
  skipped both "do the tests still pass?" reruns (19 s to 6 s and 28 s to
  7 s), and plain reruns agreed with both skips.
- **macOS hides contents only.** On macOS, a hidden file's contents and
  execution are refused, but its metadata is not, as on Linux. A test that
  writes into an ignored folder works.
- Known limits: a suite that reads back ignored files it writes in the same
  run (a coverage database, a build it starts) gets the whole checkout, and
  one that writes tracked files or coverage data during the run ends
  UNVERIFIED. On Linux, a test that needs a service started outside the run
  fails in the sandbox, so `init` leaves it to a plain run.

## 0.1.0-alpha.27 — 2026-11-01

A build or test run no longer makes a sandboxed typecheck or lint STALE,
and `redue stats` shows what REDUE saved you.

- **Files git ignores are hidden from sandboxed runs.** A sandboxed
  typecheck or lint now runs without the files git ignores (`dist/`,
  `.next/`, coverage files, `.env`), except `node_modules`, `.venv` and
  runner caches. Those files are not its inputs, so a build or test run that
  writes them leaves the result CURRENT. The claim: the result holds for a
  run that sees only the project's files that git doesn't ignore, its
  installed packages and the toolchain. Only the project's `.gitignore`
  files and `.git/info/exclude` count, not your global excludes file.
- **Checks that need ignored files keep working.** `init` tries the
  sandbox with ignored files hidden first (`sandbox-v2`), then with the
  whole checkout (`sandbox-v1`), then the general recipe. A hidden run that
  fails on a hidden file runs again in the sandbox without hiding, and that
  result is kept. Checks set up by alpha.26 stay `sandbox-v1` until you run
  `redue init` again.
- **Measured.** In the product census, after each project's own build and
  tests ran, checks that stayed CURRENT (alpha.26 in brackets, from the
  measurement census): TypeScript on Linux 31 of 37 (5 of 43), on macOS 24
  of 34 (5 of 38); Python on Linux 31 of 38 (24 of 37), on macOS 28 of 34
  (20 of 33). Where a check qualifies with both, the sandbox stayed CURRENT
  16 times and the general recipe 9 of 23 (Linux). The strace cross-check
  found no read outside the recorded inputs.
- **`redue stats`.** Per check: reruns the hook skipped, the time that
  saved, recorded runs, and the top reasons a check was UNVERIFIED, from a
  log in REDUE's local state.
- `redue remove-state` no longer fails on Windows while the observer is
  still closing its files.
- Known limits: a sandboxed run can still see that a hidden file exists
  (its name on macOS; listings, sizes and times on Linux), so a tool that
  acts on existence alone is not covered; tests do not use hidden files for
  that reason. On Linux, a file a run creates in a folder that holds hidden
  files cannot be read back in the same run.
- Contributors: eval entry points that run third-party code refuse to start
  unless `GITHUB_ACTIONS=true`, and importing any eval entry point throws
  before it does anything.

## 0.1.0-alpha.26 — 2026-10-31

Typecheck and lint checks run inside an OS sandbox, so REDUE can reuse them
for native tools and for Python. Python projects are supported for the first
time.

- **Sandboxed recipe.** On macOS (Seatbelt) and Linux 6.7+ (Landlock), a
  root typecheck or lint script runs in a sandbox that sees only the
  project, its installed packages and the toolchain, the way CI does. Its
  inputs are the whole checkout, git-ignored files included, plus the
  installed packages and a fingerprint of the environment it was given. A
  result holds for a run that sees only those. `init` tries the precise
  TypeScript recipes first, then the sandbox, then the general recipe. See
  [sandboxed recipe](docs/user/sandbox.md).
- **Python.** `redue setup claude` and `init` find mypy, pyright, ty and
  ruff in the project's `.venv`, from its CI workflows, Makefile, justfile,
  tox, nox and scripts. The Claude Code hook recognizes `uv run`,
  `poetry run`, `python -m` and `.venv/bin` forms.
- **What the sandbox changes.** Network is off. HOME and the temp folder
  are private to the check; HOME is kept between runs so caches persist.
  Tools can read `.git`, but git commands find no repository. A background
  process the check leaves running is stopped when the run ends.
- **Checked at init.** `init` runs each check plainly and sandboxed, and
  proposes the sandbox only when exit status and output (timings and paths
  aside) match. Otherwise the general recipe applies. A failing run whose
  output looks like a sandbox refusal is rerun plainly; if the plain run
  exits differently, the result is UNVERIFIED. Other failures run once.
- **Coverage.** In a census of 120 public TypeScript repositories (86
  installed on macOS), 35 have a qualifying check (alpha.24 census: 30):
  typecheck 22, lint 25, tests 2. Of 120 Python repositories, 23 of the 75
  that installed on Linux have one (typecheck 15, lint 22); 20 of 64 on
  macOS. On Linux, every sandboxed run was traced with strace: each file
  it read in the checkout was a recorded input, a cache or its own output.
- **Measured with Claude Code.** On starlette, graphon and
  claude-agent-sdk-python, sessions took 58 s with REDUE and 125 s without.
  REDUE skipped 10 typechecks and every one matched a plain rerun.
- Known limits: inside Claude Code's own macOS sandbox and on Windows, the
  sandbox can't start and the general recipe applies. On Linux before 6.7,
  sandboxed runs are UNVERIFIED.
  A build or test run that writes into the checkout (`dist/`, `.next/`,
  coverage files) makes a sandboxed check STALE, as it does a
  general-recipe check: about 1 in 4 TypeScript and 2 in 3 Python checks
  stayed CURRENT through the project's build and tests.

## 0.1.0-alpha.25 — 2026-10-29

Running your tests no longer makes a typecheck STALE, and `status --sync`
answers about twice as fast.

- **Vitest and the direct TypeScript recipe.** A Vitest run writes its
  results under `node_modules/.vite/vitest`, which the recipe counted as an
  installed input, so the typecheck turned STALE after every test run. Those
  files are no longer inputs. Everything else under `node_modules/.vite`
  still is. A program that asks the compiler about anything under
  `node_modules/.vite`, or lists `node_modules`, is UNVERIFIED instead. A
  check set up by an earlier alpha reports STALE ("input plan changed") once
  after the upgrade.
- **Faster status.** `status --sync`, `detail` and `explain` no longer start
  a second Node process on macOS and Linux, the YAML parser loads only for
  pnpm projects, and each call to the observer no longer waits on a fresh
  read of its status file. On the 800-file bench, warm `status --sync` adds
  27 ms over cached status on a GitHub Linux runner (alpha.24: 120 ms) and
  36 ms on a macOS runner (alpha.24: 137 ms).
- **Releases are benched.** The release smoke now benches the candidate
  against the last release on macOS and Linux runners; a slower candidate,
  or one over the warm-sync or run-overhead budget, blocks the release.
- Known limit: on the maintainer's Mac, which runs Microsoft Defender,
  `redue run` still adds about 15-20% to a 2.7 s typecheck (3% on a GitHub
  Linux runner).

## 0.1.0-alpha.24 — 2026-10-28

Checks keep working after a normal `npm install`, and agents that chain an
edit and a check get the same skip-or-record as a check run on its own.

- **Hard-linked installed files.** Without a pnpm store, any installed file
  with a second hard link made a recorded run UNVERIFIED. esbuild's install
  makes one (npm, not Yarn or Windows), so after an ordinary `npm install`
  general-recipe and test checks in projects with esbuild stayed
  UNVERIFIED. Such a file is now accepted when every one of its links is an
  installed file the check observes; its link count is checked again before
  every answer, so a link added later is noticed.
- **Checks inside a chain.** In a simple chain (`printf ... >> README.md &&
  npm run lint`), the Claude Code hook rewrites each check to the new
  `redue run CHECK --if-due`, which skips the check when its last pass still
  applies at that moment and otherwise runs it through REDUE with the same
  exit code. The hook changes the command without approving it, so your
  permission rules still apply. Chains with subshells, substitutions,
  here-documents, background jobs, shell keywords or builtins before a check
  run untouched.
- The CLAUDE.md section asks agents to run each check as a command of its
  own. Setups from earlier alphas are recognized and updated.
- The README's coverage numbers now come from a census that installs with
  dependencies' install scripts on, as users do: of 120 public TypeScript
  repositories, 86 installed and 30 have a qualifying check (typecheck 21,
  lint 18, tests 2).
- Known limit, unchanged: a Vitest run writes under `node_modules/.vite`,
  which makes a direct TypeScript typecheck STALE until it runs again.

- Contributors: census `--install-scripts`; the stranger test can install
  from npm (`--npm`) and run a follow-up session that uses the hooks.

## 0.1.0-alpha.23 — 2026-10-26

One command to set up REDUE with Claude Code, and one to undo it.

- **`redue setup claude`** runs `init` (when there is no
  `redue.config.json`), connects Claude Code, starts the observer, waits for
  it to index the project, and records each check that can qualify once. It
  asks once (`--yes` for no prompts), prints every file it writes, and a
  second run changes nothing. It stops before writing when dependencies are
  not installed or nothing can be set up.
- **`redue remove`** undoes exactly what setup created: the integration (or
  only this machine's hooks), the observer state, the local ignore line, and
  the config if it is unchanged since setup wrote it. Anything that existed
  before setup stays. Setup notes what it created in the clone's Git
  directory, never in a committed file.
- **Hooks find REDUE.** The Claude Code hooks name plain `redue` only when
  the `redue` that your shell and a login shell find is this install;
  otherwise they name this install's Node and entry by absolute path, so a
  Claude Code started from an IDE or with a shorter PATH still runs it.
  Checks the hook runs for the agent follow the same rule.
- `init` keeps a typecheck that runs TypeScript 7's `tsc` (or `tsgo` from
  `@typescript/native-preview`) recording-only and says why. The pnpm and
  Yarn TypeScript recipes refuse TypeScript 7 with a clear reason instead
  of an error from inside the compiler API.
- The README is rewritten around a 5-minute quickstart, what REDUE covers
  today (census qualifiers) and what it won't do.
- Known limits, found by the stranger test: a Vitest run writes under
  `node_modules/.vite`, which makes a direct TypeScript typecheck STALE until
  it runs again; an installed file with a second hard link (esbuild's install
  makes one) keeps the test check UNVERIFIED.

- Contributors: the census can run every recipe (`--all-recipes`) and
  counts direct TypeScript checks; its unrecorded-program check no longer
  flags Yarn's temporary `node` wrapper; `eval/stranger.mjs` runs fresh
  Claude Code sessions that set REDUE up from the README alone.

## 0.1.0-alpha.22 — 2026-10-25

A correctness fix for recorded runs. Earlier alphas could report CURRENT for
a script that replaced itself with another program.

- **Fixed: a script that replaced itself with another program could be
  CURRENT.** Node's `process.execve` (Node 22.15 and later) swaps a process
  for another program under the same PID. The recorder did not see it, so
  that program ran unseen. TypeScript 7's `tsc` does this to start its
  native compiler, so alphas 19 to 21 could report a TypeScript 7 typecheck
  as CURRENT while REDUE saw none of what the compiler did. The general
  recipe and the direct test recipe now judge the new program like any
  program a run starts: TypeScript 7's `tsc` makes the run UNVERIFIED and
  names it. Support for TypeScript 7 is planned.
- Runs that use Node's bindings with file, network or program access
  (`process.binding('fs')`, `'spawn_sync'` and others), or run Node with
  `--expose-internals`, are UNVERIFIED: the recorder cannot follow them.
- Direct test recipe: a shell a test starts is read by its command, as in the
  general recipe. One that runs another program before it becomes Node makes
  the run UNVERIFIED.
- General recipe, on Linux: pnpm 12 writes a file with no name in
  `node_modules` when it rewrites its workspace state, which left the first
  run after an install UNVERIFIED. That file now counts as the run's output
  when the pnpm executable ran and no file has its name. Known limit: another
  program's file with no name there, during such a run, is taken as pnpm's.
- UNVERIFIED reasons for an input that changed during a run name up to five
  files and a count of the rest.

- Contributors: the census traces each run on Linux and flags programs the
  recorder missed.

## 0.1.0-alpha.21 — 2026-10-25

`init` finds more typecheck scripts and no longer stops in large monorepos.
In the census of 108 public TypeScript repos, the general recipe qualifies 26
typecheck scripts (was 23) and 20 lint scripts.

- `init` prefers typecheck scripts named `tsc`, `types` or `lint:types`, then
  takes one script named under a typecheck name (`typecheck:test`,
  `tsc:build`, ...), watch scripts aside. Two such scripts are reported as
  ambiguous unless a command alone decides. Scripts named `build` or `dev`
  that run tsc are not taken: they write output.
- A workspace of more than 50 packages no longer stops `init`. It reads up to
  1000 packages, proposes the root's checks, and past 50 packages skips
  per-package checks and says so (`skipped` in `--json`, a "Skipped:" line
  otherwise). Five census repos got no check at all before.
- General recipe: pnpm 12 writes its workspace state through a temporary
  `node_modules/.tmpXXXXXX` file. Like the state file, it counts as the run's
  output when the pnpm executable ran. Known limit: the agent eval's seed lint
  run on one pnpm 12 project is still UNVERIFIED for an input event REDUE does
  not yet name.

- Contributors: the agent eval records each run's seed and final receipt,
  and the files a session changed when its seed run is not stable.

## 0.1.0-alpha.20 — 2026-10-24

A fix for agents on macOS.

- Fixed: on macOS, `redue status --sync --json`, `status --json` and
  `explain --json` read by an agent's shell tool stopped at 8 KB, leaving
  invalid JSON. The agent instructions REDUE installs run `status --sync
  --json`; its output passes 8 KB at about 25 checks, or sooner when STALE
  checks list many changed files. Through a shell pipe, `init --json`
  stopped at 64 KB. The CLI exited with output still queued; it now writes
  all of it first. Linux and Windows were not affected.

## 0.1.0-alpha.19 — 2026-10-24

A general recipe for typecheck and lint scripts that the strict recipes do not
take. Test scripts stay on the direct test recipe (Vitest, Jest).

- `redue init` tries the strict recipes first, then writes a general check
  (`"qualification": "node-script-v1"`) for a root typecheck or lint script.
  `redue run` runs the script through the project's package manager (npm,
  pnpm 9-12 or Yarn with the `node-modules` linker) with REDUE's recorder in
  every Node process, on macOS and Linux. The input is the whole checkout but
  `.git`, `node_modules` and runner caches, plus every workspace
  `node_modules` observed as installed files, the package manager and its
  version, and the environment. See docs/user/node-script.md.
- pnpm's launchers are trusted only when their text matches a template a pnpm
  release writes (pnpm 8.0 to 12.14). The pnpm executable, Corepack's
  pnpm-native included, is toolchain; its configuration files are kept by
  content.
- A run that starts a program REDUE does not record is UNVERIFIED and the
  reason names it: native programs from installed packages (esbuild, turbo,
  tsgolint, biome), git, find, and shells that read startup files.
- `status` and the hook's skip message name the recipe that made the receipt
  ("general recipe"). The Claude Code hook recognizes lint commands as it does
  typecheck and test commands: `npm run lint`, `pnpm lint`, and for a script
  that is one plain command, that command and its `npx` form.
- In the census of 108 public TypeScript repos, the general recipe qualifies
  23 typecheck and 21 lint scripts (both recorded runs clean, CURRENT after
  the second). Of the scripts whose runs start only Node and the package
  manager's own launchers (35 typecheck, 37 lint, measured with strace), init
  proposes and observes about 21 and 22, and 18 of each qualify. The rest:
  init does not pick script names such as `tsc:build`, fails in monorepos
  over 50 packages, or refuses source directory links and custom install
  setups; plans with submodules or dangling links are unavailable.
- Known limits: on macOS, pnpm 12's temporary files in the project root can
  arrive as an event on the root and make a run UNVERIFIED. Writes into
  `node_modules` during a run make it UNVERIFIED, except pnpm's workspace
  state and vue-tsc's global types, which stay inputs and are kept as the run
  left them. A workspace's recording checks now leave out nested
  `node_modules`, so `redue init` rewrites them once.

- Contributors: `census.mjs --product` applies the product's own rule and
  lists the files an unstable run touched; the eval kills a timed-out
  command's whole process group; the agent eval has lint tasks.

## 0.1.0-alpha.18 — 2026-10-23

Typecheck in more project shapes, and pnpm test reuse on Linux. In the census
of 108 public TypeScript repos, the ones `init` makes ready went from 8 to 11
for typecheck (the census clones each repo's current head, so one or two
repos move between runs) and stayed at 22 for tests.

- pnpm test checks are reused on Linux. A recorded run accepts an installed
  file hard-linked into the pnpm store the install recorded, when the store
  holds it at its content address (pnpm names store files by their sha512).
  Links anywhere else stay UNVERIFIED. Each file is hashed once; REDUE keeps
  its identity and store path in its state and hashes it again only when the
  identity changes. A 46 MB install takes about 160 ms to check the first
  time. Limit: an in-place edit of an installed file in another project that
  shares the store file is not seen until the next recorded run.

- Typecheck scripts in more shapes. A script of `tsc --noEmit` runs with
  `-p`/`--project`, `--skipLibCheck` or `--pretty`, in any argument order,
  qualifies for the direct npm recipe and the pnpm contract. A chain of such
  runs joined by `&&` becomes one check per run (`typecheck.1`,
  `typecheck.2`); the hook skips the script only when every run is CURRENT
  and otherwise runs the stale ones through `redue run`. `check-types` joins
  the recognized script names.
- The hook acts on a typecheck script's form only while the script in
  package.json still has exactly the configured `tsc` runs. Before, a script
  changed to `tsc --noEmit && eslint .` was rewritten to `redue run
  typecheck`, which ran tsc alone.
- Without a typecheck script, `init` proposes a `tsc --noEmit` check for a
  root `tsconfig.json` (direct npm recipe, pnpm) and for each pnpm workspace
  package with one, unless a script runs a TypeScript checker in another form
  (`tsc -b`, `vue-tsc`, ...). package.json is not changed; the check is
  written only when the contract holds.
- The pnpm contract no longer needs `include: ["src"]`. Its source inputs are
  the directories the config's `include` covers, as TypeScript computes them
  for new files, minus `node_modules`. `exclude` entries stay inputs, since an
  import can still reach an excluded file. A config extended from an installed
  package is an installed input.
- Fixed: a config with three or more pnpm or test checks never got a
  synchronized answer. The observer dropped control requests over 4 KB, and a
  sync request carries about 1.5 KB of context digests per check; status
  showed "Unexpected end of JSON input" for every check. The limit is 1 MiB.

- The direct npm TypeScript recipe takes any TypeScript 5.x or 6.0, not only
  the five reviewed releases. Another release qualifies when package-lock.json
  records the registry's `typescript` at that version with an integrity
  (sha512, or sha1 from registries that record only sha1), npm's cache holds
  the tarball under it, and the installed package is exactly the tarball's
  files. Nothing is downloaded; a missing tarball
  keeps the check recording-only with `npm-tarball-uncached`. The check takes
  about 100 ms per full probe (TypeScript 5.x and 6.0 tarballs, 120-140 files).
  CI runs the direct contract suite against 5.0.4, 5.1.6, 5.2.2, 5.3.3, 5.4.5,
  5.5.4, 5.7.3 and 5.8.3.

- Contributors: `npm test` runs up to four test files at a time, keeping two
  cores free (a 3-core CI macOS runner runs one at a time), and takes about
  6 minutes on the owner's Mac (was 19.6). The two TypeScript 6 fixture
  suites are separate files so they run side by side.

## 0.1.0-alpha.17 — 2026-10-22

Workspaces and package managers beyond npm. In the census of 108 public
TypeScript repos, the ones `init` makes ready went from 5 to 8 for typecheck
and from 6 to 22 for tests.

- pnpm 9-12 for the pnpm TypeScript contract (it took only an exact pnpm 12
  pin). The installed `.modules.yaml` names the version; a pin is optional,
  with or without Corepack's `+sha512` hash (pins with a hash never matched
  before). `.npmrc` settings that only change what gets installed are
  accepted; settings that move or copy installed files, or run code during
  install, are refused in either file: custom modules, virtual-store or
  lockfile directories, the global virtual store, injected workspace
  packages, separate lockfiles, pnpmfile hooks, `configDependencies`.
- The tests recipe takes single-package pnpm 9-12 and Yarn `node-modules`
  installs, and gives each workspace package (npm or Yarn `workspaces`, pnpm
  `packages`) whose test script runs Vitest directly its own `PACKAGE:test`
  check, run in the package directory. Inputs stay the whole checkout; every
  package's node_modules is an installed input. Jest and root test scripts in
  workspaces stay recording-only. A package added later makes the
  workspace's checks UNVERIFIED until `init` runs again.
- A recorded test run is UNVERIFIED when an installed file has another hard
  link: a package store outside the checkout (pnpm's default on Linux, Yarn's
  hardlinks modes) could change it unseen. pnpm on macOS clones files and is
  not affected; on Linux, pnpm test checks qualify but are not reused unless
  pnpm copies files.
- Observer: an installed link to a directory (pnpm links every package) is
  observed by its link chain when the target is itself observed installed;
  any other directory link still makes observation unavailable.
- Workspace patterns honour `!pattern` exclusions; before, a negated pattern
  matched every directory.
- Fixed: a new workspace package manifest did not re-plan a test check, for
  npm workspaces too.

Eval on alpha.17 code (CI 39828002753, 84 sessions, test tasks on twilio,
cheerio and SwitchHosts plus the pnpm project devops-daily): 0 critical
findings; 23 skipped test runs, each passing three plain reruns; nothing was
skipped on devops-daily, whose recorded runs were UNVERIFIED on the Linux
runner.
## 0.1.0-alpha.16 — 2026-10-22

Changes to the Claude Code integration, and one fix for commands that meet
on fresh state. Run `redue agent setup claude --apply` again to get the new
hook entries.

- A SessionStart hook starts the project's observer when a session starts,
  resumes, clears or compacts, if none is running. It returns at once and
  prints nothing. Without a running observer every check was UNVERIFIED, so
  the hook could neither skip nor record. `agent doctor` reports it.
- The hook matches more command forms, each mapping to one configured check:
  `pnpm SCRIPT`, `pnpm run SCRIPT`, `yarn SCRIPT`, `yarn run SCRIPT`,
  `pnpm exec tsc ...`; for a workspace package's check, `pnpm --filter NAME
  SCRIPT`, `yarn workspace NAME SCRIPT`, `npm run SCRIPT -w NAME`, and its
  script after a `cd` into the package. In the census of 108 public
  TypeScript repos, 61 use pnpm or Yarn.
- `turbo run TASK` and, in pnpm projects, `pnpm -r TASK` (or a root script
  that is one of them) are skipped only when every workspace package with the
  task's script has a check and all are CURRENT; otherwise they run as typed,
  never rewritten. No skip when turbo may run more (other `dependsOn` tasks,
  `with`, package-scoped keys, a package turbo.json), when pnpm includes the
  workspace root, or for a root script with pre/post scripts. Filters and nx
  are not matched.
- Fixed: when two commands met on fresh state (SessionStart's `start` and the
  first `status`), the second failed and no observer started.

Pilot eval on alpha.16 code (CI 39799994225, 96 sessions over twilio,
semiotic, Ultra-Card and SwitchHosts): 0 critical findings; 29 skipped
typechecks, each confirmed by a plain rerun.
## 0.1.0-alpha.15 — 2026-10-22

No change to observation, status or `redue run` since alpha.14; the changes
are to the Claude Code integration.

- The CLAUDE.md block now tells agents to run the typecheck or test command
  before saying it passes, even after an edit that seems irrelevant, and to
  leave skipping to REDUE's hook. In the alpha.14 eval, two of six mixed-task
  sessions skipped their final test run on their own after a README edit;
  with the new block, none of six did (twilio and SwitchHosts, CI
  39702429765), at the same token cost. Run `redue agent setup claude --apply`
  again to update the block; the earlier wording is recognized and replaced.
- The hook also matches a typecheck or test command after a leading
  `cd <project root>;` or `cd <project root> &&`. A skip denies the whole
  command; a rewrite keeps the `cd`. A `cd` to any other directory matches
  nothing.

## 0.1.0-alpha.14 — 2026-10-21

Bench numbers below are from one 800-file project on macOS arm64, Node 22.13.0.
Released alpha.13 and this build ran interleaved on the same machine; the
typecheck decision path is unchanged within noise (warm `status --sync` 162/157
ms on alpha.13, 169/166/289 ms on alpha.14; `redue run` overhead 12/14% and
12/7/18%; states correct, no idle probe launches).

- New opt-in recipe for unit tests: `redue init --recipe tests-direct --check
  test` records a single-package npm project's Vitest 4/5 or Jest 29 run on
  macOS and Linux. The check's inputs are the whole checkout (minus `*.md`,
  `*.mdx` and, with `--coverage`, `coverage/`), the installed files, the Node
  binary, the exact command, and every environment variable the run's
  JavaScript reads directly, compared by value. A recorder loaded into every
  Node process and worker thread of the run guards the rest: reading an
  excluded or git-ignored file, a directory listing or large file outside the
  checkout, network use other than loopback, or a process that escaped the
  recorder makes the result UNVERIFIED with the reason. Lookups outside the
  checkout become run facts that status checks again. Two runs on the same
  inputs with different results make the check UNVERIFIED until the inputs
  change. See [direct tests](docs/user/tests-direct.md) for the claim and its
  limits.
- Claude Code: the hook skips or records a direct test check's runs (`npm run
  <script>`, `npm test`, the script's own command) like the typecheck's.
- Linux: a directory created or deleted in the checkout is now an event, not
  an observation gap. Before, every new directory forced a full reconciliation,
  and a second one during it left the observer UNVERIFIED (`plan_gap`).
- An excluded installed path appearing (a runner cache, a TypeScript build-info
  file) no longer changes the input plan. Checks with such an exclusion are
  STALE with "input plan changed" once after the upgrade, until their next run.
- Measured with Claude Code on three public projects (Sonnet 5.5, CI Linux,
  72 sessions): agents skipped 21 test runs, every skip confirmed by three
  plain reruns on its tree, and session time fell from 515 to 295 s summed over
  the task medians. In two sessions the agent itself left out its final test
  run after a README-only edit, without asking REDUE; both said so, and the
  final trees passed.

## 0.1.0-alpha.13 — 2026-10-19

Bench numbers below are from one 800-file project on macOS arm64, Node 22.13.0.
Released alpha.12 and this build ran interleaved on the same machine; the
decision path is unchanged within noise (warm `status --sync` 192/197 ms on
alpha.12, 174/198 ms on alpha.13; states correct, no idle probe launches).
On the CI screen of 38 public TypeScript projects, 22 qualify for the direct
recipe, up from 19 at alpha.12: worldmonitor, Recordly and open-cowork, which
the fixed 5 s probe deadline blocked.

- A full state probe may run longer on large projects. Its deadline was a
  fixed 5 s (10 s on Windows and for pnpm); now it is the larger of twice the
  last successful probe and the last completed run, at least that floor and at
  most 60 s, doubling after a timeout. A probe that never finishes is still
  killed at its deadline and the check stays UNVERIFIED. `redue status --sync`
  and `redue run` wait for the observer up to the sum of its checks' probe
  deadlines plus 10 s (`probe_deadline_ms` in status JSON), never less than
  before. While a full probe runs the observer does not answer, so with a hung
  probe a decision can wait up to 60 s per check before it is UNVERIFIED.

## 0.1.0-alpha.12 — 2026-10-19

Bench numbers below are from one 800-file project on macOS arm64, Node 22.13.0.
Released alpha.11 and this build ran interleaved on the same machine; the
decision path is unchanged within noise (warm `status --sync` 183/410 ms on
alpha.11, 298/174 ms on alpha.12; states correct, no idle probe launches).
On a screen of 38 public TypeScript projects in CI, 10 qualified for the
direct recipe before the run-facts change, 17 after it and 19 after incremental
and references support. worldmonitor and Recordly now stop at the 5 s probe
timeout, and open-cowork at its end-checkpoint probe.

- Large installations reach ready quickly. Installed files are observed by
  identity (inode, size, mode, link count, times), not by hashing their contents;
  the compiler's own reads stay content-checked by the probe. On macOS:
  Recordly (75k files in `node_modules`) ready in 7 s instead of failing after
  120 s; worldmonitor (143k) in 30 s instead of not ready after 15 min.
  Behavior change: reinstalling identical packages, restoring an installed
  file's bytes or copying the installation now makes the check STALE once.
- The direct TypeScript recipe supports TypeScript 6.0.2 and 6.0.3.
- Claude Code: the typecheck hook also matches a typecheck that starts a `;` or
  `&&` chain. When it skips one, the message names the rest of the chain. The
  skill lists the exact commands the hook matches for the selected config.
- Shorter agent instructions: the CLAUDE.md block is 235 bytes instead of 739,
  the skill 1.8 KB instead of 5 KB. The reuse rules are unchanged. When the
  Claude Code hook matches a typecheck, the block no longer points to the
  skill; the skill stays for agents that look for it.
- Claude Code hook: it waits for status up to half the last completed run's
  duration, at most 10 s, instead of a fixed 2 s. Run `redue agent setup claude
  --apply` again to raise the hook's Claude Code timeout from 5 s to 15 s.
- Linux: the observer no longer watches `.git` directories. Before, each new
  directory git created there (on most commits) was an observation gap: status
  was UNVERIFIED until a full reindex and probe finished, about 5 s on a
  26k-file project. Input patterns that name a `.git` directory are now
  refused; REDUE never observed changes there.
- Direct TypeScript recipe: runs with `declaration: true` are reusable. tsc's
  declaration checks look up files that building the program does not, and
  read dependencies' `package.json`; before, any such lookup made the run
  UNVERIFIED. The receipt now keeps those existence, `realpath` and
  `package.json` answers as run facts, and status asks them again before every
  CURRENT answer, including when a cached status is read. Every direct run is
  now recorded, also one checked by full probes. The probe also records
  `realpath` while it parses a tsconfig `extends` from a package.
  Behavior change: a direct receipt recorded by an earlier version is
  UNVERIFIED until the check runs again (macOS and Linux). Limit: Windows does
  not record direct runs, so declaration-only lookups are not checked there.
- Direct TypeScript recipe: a root tsconfig with `incremental: true` is
  supported. Its build-info file is left out of the inputs, and the run may
  write only that file. A root tsconfig that references a composite config
  (such as Vite's `tsconfig.node.json`) is supported when the program does not
  use the referenced project's files. A `composite` root is still refused.
- Releases are published to the `latest` npm tag as well as `alpha`, so
  `npm install -g @redue/cli` installs the newest release.

## 0.1.0-alpha.11 — 2026-10-18

Bench numbers below are from one 800-file project on macOS arm64, Node 22.13.0.
Released alpha.10 and this build ran back to back on the same machine.

- Faster status decisions for the direct TypeScript recipe on macOS and Linux.
  The observer checks the compiler's recorded filesystem questions in-process
  instead of starting a probe that rebuilds the whole program. A full probe runs
  only when that check fails, the plan or toolchain changes, or observation was
  interrupted. While idle it no longer starts any probe process.
  - warm `status --sync`: 741 → 194 ms (+683 → +154 ms over cached `status`)
  - `status --sync` after an unrelated edit: 619 → 219 ms
  - `status --sync` after a relevant edit: 1472 → 321 ms. It answers STALE without
    a full probe when the edited inputs already differ from the receipt.
  - probe processes started in 20 s idle: 4 → 0
- Cheaper `redue run` on macOS and Linux. The compiler records its own inputs
  while it runs, so REDUE no longer probes before and after the compile. After
  a relevant edit, the run builds the new certificate from that recording instead
  of running a full probe. Output and exit code are those of plain `tsc`.
  - repeat run: 4143 → 2752 ms, overhead over plain `tsc` 72% → 16%
  - run right after a relevant edit: 3990 → 2802 ms, overhead 65% → 18%
- The direct TypeScript recipe accepts inert Node settings. Before, any non-empty
  `NODE_*` setting other than `NODE_ENV` kept a check from becoming CURRENT.
  Now accepted: `NODE_EXTRA_CA_CERTS`, `NODE_PATH`, and `NODE_OPTIONS` made only of
  `--max-old-space-size`, `--max-semi-space-size`, `--use-openssl-ca`,
  `--use-bundled-ca`, `--use-system-ca` and `--dns-result-order`. A run under one
  value is not reused under another. See [Node settings](docs/user/direct-typescript.md#node-settings).
- `redue agent setup claude --apply` adds a Claude Code hook to
  `.claude/settings.local.json`. When the agent reruns a configured typecheck
  that is CURRENT and PASS, the hook blocks it and names the passing run. When
  the check is not CURRENT, it rewrites the command to `redue run CHECK`, so the
  result is recorded and the next identical command can be skipped. Prefix a
  command with `REDUE_FORCE=1` to always run it. On the bench: a skip decision
  takes about 155 ms; a forced command adds 39 ms. Tested live with Claude Code
  2.1.302 (`claude -p`). See [the hook](docs/user/agents.md#claude-code-typecheck-hook).
- Unstable-run and observation-gap reasons now name the failed check or operation.
- macOS counts each input event once, which removes an intermittent UNVERIFIED
  after an edit.

Known limits:

- Two bench targets are still missed: warm sync adds 154 ms over cached status
  (target < 100 ms), and `redue run` adds 16–18% over plain `tsc` (target < 10%).
- An edit that changes imports, configuration or lib files still costs one full
  probe, at the end of the next run.
- Windows keeps the earlier probe-based path, except the STALE shortcut. Yarn
  and pnpm recipes still probe on each decision. The bench was not run on Linux.
- The Claude hook covers the Bash tool only, from the project root. It allows the
  rewritten command without a permission prompt. It judges its own environment,
  not variables the Bash tool adds from your shell profile.
- To upgrade, stop observers, install into the same prefix, and keep config, state
  and receipts. Rerun `redue agent setup claude --apply` to add the hook.

## 0.1.0-alpha.10 — 2026-10-10

- Combine guarded caller-discovery reuse and cheaper non-reusable recording on
  the existing macOS direct-TypeScript path. Healthy runs still validate both
  boundaries in the caller context, falling back to full probes when necessary.
- Once a healthy start observation is missing, omit qualification-only work that
  cannot repair it. Execute the configured compiler and durably record its true
  outcome; later observer recovery cannot make that invocation reusable.
- Refuse missing, malformed or mismatched state ownership before execution.
  Preserve cancellation, immutable history and newest-receipt selection.
- Three fixed A–H cycles cost 15.16/15.35/15.82 seconds versus matched ordinary
  compiler totals of 16.69/16.66/16.56 seconds. These modest CLI savings do not
  establish real-world reuse frequency, CPU/memory or whole-agent benefit.
- Provide a [fixed-build opt-in pilot guide](docs/user/pilot.md). External usage
  has not started. No compiler/platform expansion or policy redesign is included;
  Claude behavior and cross-host handoff remain untested.
- Stop observers before upgrading in the same prefix, preserve config/state and
  receipts, preview/apply project-local policy updates, then restart and reassess.
  Never silently migrate a check. Alpha.9 remains an unshipped candidate.

## 0.1.0-alpha.9 — unshipped candidate (2026-10-09)

- Reduce repeated caller discovery on the guarded macOS direct-TypeScript path.
  Both execution boundaries still validate in the actual caller environment,
  with full-probe fallback when a discovery certificate cannot be used.
- Preserve required content/membership, compiler/context, observation and durable
  receipt-selection guards. The configured compiler still executes on every run.
- Recording overhead fell in the measured debugger-project sample, but every
  complete A–H candidate cycle remained slower than eight ordinary compiler runs.
  No net workflow saving, broader support or CPU/memory improvement is claimed.
- Stop observers before upgrading in the existing prefix, retain config/state
  and receipts, then restart. No automatic migration is performed.

## 0.1.0-alpha.8 — 2026-10-08

- Consume compiler-certificate input asynchronously while preserving the input-size
  limit, parent deadline, complete-input validation and conservative fallbacks.
- Support the exact reviewed TypeScript 5.5.2 distribution in the explicitly selected
  single-package npm direct-compiler recipe. Enforce implementation membership and
  reject ETW module overrides before compiler API loading.
- Real independent Codex/macOS sessions reused compiler evidence on the pinned
  vscode-js-debug project. Cross-platform CLI/package acceptance is separate;
  Claude behavior and cross-host handoff remain untested.
- The measured eight-case workflow avoided four compiler executions but cost
  20.01 seconds versus 16.97 seconds for eight ordinary compiler runs. No net
  workflow or whole-agent speedup is claimed. This verifies compiler inputs only,
  not npm lifecycle behavior or application correctness.
- Stop observers before upgrading, retain the same configuration/state, then
  restart. Do not delete receipts or automatically convert existing checks.

## 0.1.0-alpha.7 — 2026-10-07

- Guide explicitly configured direct-compiler reuse through one caller-aware
  synchronized query; skip reuse queries when fresh execution is already required.
- Update intact project-local agent instructions safely; installation alone does
  not update them. See the [existing-user procedure](docs/user/agents.md#update-an-existing-connection).
- In the finite Codex/macOS comparison, revised guidance reached eligible evidence
  and reused it in 4/4 opportunities versus 1/4; verification tool calls fell
  from 28 to 14. Evidence semantics are unchanged. No universal compliance,
  tail-latency or causal agent-task speedup is claimed. Claude behavior and
  cross-host handoff remain untested.

## 0.1.0-alpha.6 — 2026-10-07

- Reuse guarded compiler discovery for warm direct-TypeScript decisions on macOS
  with healthy historical observation. Membership, absence, compiler bytes,
  caller context and receipt selection remain validated independently.
- Keep full discovery/reconciliation fallbacks and existing platform boundaries.
- On one measured project, complete warm decision median fell from roughly
  791 to 474 ms. This is not a universal speedup, agent-task acceleration,
  memory improvement, or a faster relevant-edit/rebuild claim.
- Stop observers before upgrading and restart with the same config/state.
  Preserve receipts; no configuration migration is performed.

## 0.1.0-alpha.5 — 2026-10-07

- Add opt-in project-local agent activation and direct TypeScript evidence, with
  fresh-session reuse demonstrated in the tested Codex/macOS configuration.
- Preserve ordinary npm execution as a separate, recording-only obligation.
  Direct compilation requires explicit selection and a fresh baseline receipt.
- Initial direct recipe supports reviewed TypeScript 5.6.3/5.9.3 in single-package
  npm projects, with documented Node/environment restrictions.
- Claude integration mechanics are tested; Claude behavior and cross-host reuse
  remain untested. No universal compliance or inexpensive-check speedup is claimed.

## 0.1.0-alpha.4 — 2026-10-07

- Withdraw automatic npm-launcher applicability because update notifications consume
  unobserved remote/cache/time state. Npm scripts still run and record outcomes.
- Preserve historical PASS/FAIL and require stop/start when upgrading an observer.
  Do not delete receipts. See the [maintainer notice](docs/user/npm-launcher-notice.md).
- Supported Yarn/pnpm and explicit reviewed contracts are unchanged. No agent
  activation or npm direct-compiler recipe is included in this correction.

## 0.1.0-alpha.3 — 2026-10-06

Install: `npm install --global @redue/cli@alpha`.

- Fix selected execution outcomes remaining hidden behind an older observer/cache
  after a missed reload notification. A newer failure must not leave an older
  passing receipt eligible for reuse.
- Withhold applicability during incomplete receipt persistence, unreadable or
  changing selection, and client connections to an older observer.
- Preserve immutable run history. Upgrade requires an observer stop/start;
  receipts need not be deleted. See the [maintainer notice](docs/user/receipt-selection-notice.md).

## 0.1.0-alpha.2 — 2026-10-06

Install: `npm install --global @redue/cli@alpha`.

- npm distribution moved to the product-owned `@redue/cli` package.
- The executable remains `redue`; verification semantics and runtime code are unchanged.
- Alpha.1 (`@msiric/redue`) remains available but is superseded by the canonical package.

## 0.1.0-alpha.1 — 2026-10-06

Install: `npm install --global @msiric/redue@alpha`. The command remains `redue`.

- Persistent execution evidence with independent CURRENT, STALE, and UNVERIFIED applicability.
- Node/TypeScript onboarding for npm, supported Yarn node-modules workspaces, and pnpm 12 isolated/hoisted layouts.
- macOS, Linux, and Windows observation with conservative deterministic recovery.
- Human status/explain output, JSON integration contract, and recording-only checks.
- Standard npm tarball installation and scoped state cleanup.

Known limitations include incomplete test/lint/build contracts, uncaptured direct
commands, and synchronized decisions that can cost more than cheap checks. See README.
