# Sandboxed recipe (typecheck, lint and tests, any language)

The sandboxed recipe runs a typecheck, lint or test command inside an operating
system sandbox and reports later whether that result still applies to the
files you have. The sandbox holds for every process the command starts, so it
covers programs REDUE cannot record: TypeScript 7's native compiler, esbuild,
oxlint and tsgolint, biome, turbo, and Python tools such as mypy, pyright, ty
and ruff, and test runners such as pytest.

**The claim.** A sandboxed result holds for a run that sees only the project's
files that git doesn't ignore, except its documentation, its installed
packages and the toolchain, the way CI does. It does not say that a run with
your own configuration files, a service on your machine or the network would
give the same result.

A check that reads the documentation (a doctest over `README.md`) sees it
too. A check that needs files git ignores (generated code, another package's
built declarations) gets the whole checkout. See
[hidden files](#files-git-ignores-and-documentation).

## Where it applies

- **Tests:** a root `test` script, and pytest in the project's `.venv`. See
  [tests](#tests). For a Node test script, `init` tries the sandbox before the
  [direct test recipe](tests-direct.md), which becomes the fallback, when
  both would run the same script. In the
  census, on the repos where both qualified, the direct recipe's results went
  STALE when the project's build rewrote its output, and the sandboxed ones,
  with ignored files hidden, stayed CURRENT.
- **Node projects:** a root `typecheck` or `lint` script (npm, pnpm, or Yarn
  with the `node-modules` linker). `init` tries the
  [direct TypeScript recipe](direct-typescript.md) and the pnpm and Yarn
  TypeScript recipes first; they stay first where they apply. Then the
  sandboxed recipe, before the [general recipe](node-script.md), since it
  also covers the native programs a script starts. Where init's trials show
  a difference, or the sandbox cannot run, `init` writes the general recipe
  as before. Where the sandbox cannot start at run time (inside Claude Code's
  macOS sandbox), a script the general recipe takes is recorded as it records
  it.
- **Python projects:** mypy, pyright, ty and ruff installed in the project's
  `.venv` (`uv sync` makes one; Poetry does with `virtualenvs.in-project`).
  `init` uses the arguments your CI workflow, Makefile, tox, nox, justfile or
  shell scripts in `scripts/` run the tool with, through `uv run`, `poetry run`,
  `python -m`, `coverage run -m` or `.venv/bin`, including quoted arguments
  (`-m "not slow"`) and lines continued with a backslash. It takes the first
  such line, but a pull-request workflow's when it narrows the test suite
  (`-m`, `-k`, `--ignore`, `--deselect`), and leaves out options that only
  write a report (`--junit-xml`, `--html`, `--durations`). Without them it
  uses the tool's default: `ruff check`, `ty check`, `pyright`, `pytest`, and
  `mypy` (with `.` when mypy's configuration names no `files`).
- **Platforms:** macOS (Seatbelt, `sandbox-exec`) and Linux 6.7 or later
  (Landlock; the launcher needs Python 3).

```sh
redue init
redue start
redue run typecheck
redue status --sync
```

A Python check in the config:

```json
{"name": "typecheck", "kind": "typecheck", "qualification": "sandbox-v3",
 "command": [".venv/bin/mypy", "src"], "inputs": ["**", "..."], "installedInputs": [".venv/**", "..."]}
```

A Node check names its script, as the general recipe's do:
`{"name": "lint", "script": "lint", "kind": "lint", "qualification": "sandbox-v3", ...}`.
`sandbox-v3` hides the files git ignores and the documentation from the run,
`sandbox-v2` only the files git ignores; `sandbox-v1` runs it on the whole
checkout.

With the Claude Code hook, `uv run mypy src`, `poetry run mypy src`,
`python -m mypy src`, `.venv/bin/mypy src` and `mypy src` are recognized as
that check. The last two count only when PATH finds the tool or Python in the
project's `.venv/bin` first. When the hook runs the check through REDUE, it
keeps `uv run` or `poetry run` in front, so the environment still syncs first.
For a pytest check, options that change only the output count as the same
command, added or left out: `-q`, `-v` (and `-qq`, `-vv`), `--quiet`,
`--verbose`, `--tb=STYLE`, `--no-header`, `--no-summary`, `-rCHARS`,
`--color=`, `--code-highlight=` and `--durations=N`. `pytest tests -q` is then
the check `pytest tests -v`. The recorded run uses the check's own options, so
its output can look different. Setup writes the trigger rules for these
forms; after an upgrade, run setup again to get them.

## Files git ignores and documentation

`init` runs each check plainly, then sandboxed with the files git ignores and
the documentation hidden. When both give the same result, it writes
`sandbox-v3`. When the plain run passed and the sandboxed one failed only
because it was refused a file it hid (no other refusal line, and not a line
the plain run printed too), `init` runs it in the sandbox again with just
that file visible, up to three files, one more sandboxed run each. When that
agrees with the plain run, it writes `sandbox-v3` with those files in the
check's `visible` list: runs do not hide them, and each is an input, so an
edit to one makes the check STALE. pi-web's lint reads a generated file git
ignores, and its typecheck a license text under `src`; each gets that one
file instead of the whole checkout. `visible` holds up to 3 relative files,
only for a `sandbox-v2` or `sandbox-v3` check; a hidden folder that holds
one stays hidden otherwise.
Otherwise, `init` runs the check once more with the whole checkout, reusing
the plain run, and writes `sandbox-v1` only if that agrees. A whole-checkout
run can still differ: a test suite that writes to a fixed path in `/tmp`
does on Linux and macOS. Such a check then gets the recipe it would have
without the sandbox. So a check runs two or three times at init, and up to
six when its trial is refused hidden files (one plain run, one sandboxed,
one per visible file, one with the whole checkout). `init` no longer writes
`sandbox-v2`; a check already set up with it keeps it.

When a trial leaves a check out of the sandbox, `init` keeps the sandboxed
run's last 20 lines (each cut at 200 characters) in this configuration's local
state, under `init-trials/`, and the reason names the file. They never go into
`redue.config.json`, since output can hold tokens and paths. `redue
remove-state` removes them.

Each trial run stops after 5 minutes. A run that stops there never counts as
agreeing: when the plain run reaches the limit, `init` runs nothing in the
sandbox; when a sandboxed run reaches it, no further trial follows. Either
way the check is recording-only: `init` does not propose a recipe it has not
run, such as the direct test recipe, whose runs could only end UNVERIFIED.
`init` marks such a check (`time_limit` in `--json` gives
its kind, and `time_limit_run` says which run reached the limit: `plain` or
`sandboxed`). `redue setup` names them, says which did not finish when run
plainly, so were not tried in the sandbox (check that such a check finishes
when you run it: it may hang here rather than be slow), and prints one
command:
`redue init --check typecheck --no-time-limit` (or `redue init
--no-time-limit` for several kinds). With an existing config, that command
runs with no limit the checks the config has and does not run in the
sandbox, and a check it lacks when `--check` names its kind. It replaces
the row of each that qualifies, if the row runs the same script, or adds
it, and leaves the rest of the config as it was. It restarts a running
observer with the new config, and `redue remove` still deletes a config
`setup` created.

With `sandbox-v3`, each run also hides the documentation: the files git
lists (and does not ignore) named `*.md`, `*.mdx`, `*.rst`, `LICENSE*` or
`CHANGELOG*` anywhere, and text, image and PDF files (`.txt`, `.adoc`,
`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.pdf`) in the root `docs/`
folder. Code in `docs/` (examples a typecheck includes) is not hidden, and
folders stay listable. The receipt names the files the run hid. A later edit
to one of them, or its deletion, leaves the result CURRENT: editing the
README does not make the tests STALE. A new documentation file, a link named
like one, or a change made while the run ran still counts. On macOS the
files with those extensions are refused by name pattern, in any case and in
`node_modules` too: `README.MD` or `Docs/logo.svg` is refused but not
listed, so an edit to it counts, and a check that reads one gets
`sandbox-v1` on macOS. `LICENSE*` and `CHANGELOG*` files are refused by the
exact paths git lists, so `license-check.ts` stays readable. On Linux each
listed file is hidden like a git-ignored one. In a checkout with more than
100 `LICENSE*` and `CHANGELOG*` files (vendored packages), those files are
not hidden on either platform and count as inputs.

With `sandbox-v2`, each run hides what `git ls-files --others --ignored
--exclude-standard --directory` lists, except `node_modules`, `.venv` and
runner caches: build output (`dist/`, `.next/`), coverage files, `.env` files.
Only the project's rules count: its `.gitignore` files and
`.git/info/exclude`, not your global excludes file. Those files are not
inputs, so a build or test run that writes them leaves the result CURRENT.

When a `sandbox-v2` or `sandbox-v3` run fails with a refusal that names a
hidden file (a missing file counts only when it names one, since Linux tools
report an unreadable file as missing), REDUE runs the check again in the
sandbox without hiding anything. That result is kept and compared on every
file, git-ignored ones and documentation included. Run `redue init` again to
write another recipe for a check that keeps needing them.

## What the run sees

It may read and execute only beneath:

- the checkout, without the files git ignores for `sandbox-v2`, and without
  its documentation too for `sandbox-v3`;
- the toolchain: Node's installation and the package managers' (with
  Corepack's downloads), or the Python installation the `.venv` was made from;
- system directories (`/usr`, `/bin`, `/etc` and the like on Linux; `/usr`,
  `/System`, `/Library`, `/opt/homebrew` and the like on macOS);
- a private home directory and a fresh temporary directory, in REDUE's state.

A typecheck or lint has no network: no TCP connection, loopback included
(a test run on Linux gets loopback; see [tests](#tests)). On macOS its only
Unix sockets are in its own temporary directory, which is new for each run.
On Linux 6.12 and later it cannot reach an abstract Unix socket outside the
run.

What the check leaves running is stopped when it exits, as at the end of a
CI job: its process group gets SIGTERM, and SIGKILL a second later. On Linux
the launcher also stops daemons that started their own session. On macOS
such a daemon outlives the run, but no later run can reach it: its socket
was in a temporary directory that is gone. The run gets no terminal input.

The checkout's `.git` is not an input. A run sees that it exists, as in a CI
checkout (ruff and biome apply `.gitignore` only inside a repository), and
reads `.git/config` and `.git/info/exclude`, which are compared by content.
Everything else in `.git` is hidden, so git commands find no repository in
the checkout. A script that runs git there (`git diff --exit-code`) gives a
different result inside the sandbox, and `init` leaves it to the other
recipes. A repository a test makes in its temporary directory works as it
does outside the sandbox.

It gets a controlled environment, not yours:

- the variables the check declares (`TZ`, `LANG`, `CI`, `USER`, `LC_*`,
  `DYLD_*`, `LD_*`, and `NODE_*`, `npm_config_*`, `PNPM_*`, `YARN_*`,
  `COREPACK_*` for Node, or `PYTHON*`, `MYPY*`, `RUFF_*`, `PYRIGHT*`, `TY_*`
  for Python), with your values;
- your PATH, without the project's `.venv/bin`, which a Python check gets
  first instead, so `uv run` and an activated environment give the same PATH;
- `HOME`, `TMPDIR` and the XDG directories in its private directories;
  `VIRTUAL_ENV` for a Python check; Corepack's home where Corepack keeps it.

## Tests

A test run gets what a typecheck or lint gets, and also:

- **On Linux, loopback, and no remote host.** It may listen on any address
  and accept connections, and connect only to the local host (`127.0.0.0/8`,
  `::1`, `0.0.0.0`, `::`) and Unix sockets.
  - Landlock cannot tell a loopback address from a remote one, so a
    seccomp filter in the test's processes does instead. It refuses sockets
    other than Unix, netlink and TCP when they are created (UDP included),
    TCP Fast Open (`MSG_FASTOPEN`) and `io_uring`. It hands each `connect` to
    REDUE's launcher. The launcher allows a local port no process listens on
    (the test gets "connection refused") or one the run's own processes
    listen on, and a Unix socket file in the checkout, the run's home or its
    temporary directory. It refuses a service started outside the run (your
    local database) and every remote host. Nothing else goes through the
    launcher, so worker processes talk to each other as usual. If the
    launcher's supervisor cannot start, or stops before the run ends, the
    result is UNVERIFIED, never CURRENT.
- **On macOS, no network.** No TCP or UDP, loopback included: only Unix
  sockets in its own temporary directory (its home is beneath it), as a
  typecheck or lint gets. Seatbelt cannot refuse a service started outside
  the run while allowing the run's own servers: a rule that refuses one
  loopback port under a loopback allow is not applied, and an allow list of
  every other port does not compile. A suite that starts a server on
  loopback, or reads a local database, fails init's trial: init leaves the
  test check out, and the tests run without REDUE, as before. A test check
  set up by alpha.28 on macOS is not CURRENT after the upgrade; if its runs
  now fail inside the sandbox, run `redue init` again.
- **A fresh home.** Its home directory is new and empty for each run, as on
  CI: what a test leaves there is not observed, so it must not reach a later
  run.
- **A private `/tmp`.** Its `TMPDIR` is its own, new for each run, and it may
  not write in `/tmp` or `/var/tmp` outside it. A test that writes to a fixed
  path there is refused.

`init` compares a test run's exit status and the counts its summary prints
(passed, failed, skipped), not every line: test runners print in the order
their workers finish. Git-ignored files are hidden from a test run when the
trial agrees, as for typecheck and lint. A suite that reads back git-ignored
files it writes in the same run (a coverage database, a build it starts
itself) gets the whole checkout. Files a hidden run writes beneath hidden
folders, or new files git ignores, are not changes to its inputs. With the
whole checkout (`sandbox-v1`), or with its `visible` files when those are all
it rewrote, a run that rewrites git-ignored files with the
bytes they already had (a build from unchanged sources) is CURRENT: what it
read is what is there now. A run that rewrites them with other bytes (the first
run after a source change) is UNVERIFIED, since it may have read the old ones;
the next run is CURRENT. A build that writes other bytes on every run (a
timestamp, a build ID) never settles: after two such runs the check is NOT
VERIFIABLE until another input changes.

### Test scripts that build first (not proposed yet)

`init` does not propose this yet: no real project has qualified this way so
far (forma's suite reads the git repository, which the sandbox hides;
pokemon-showdown builds from inside its tests). REDUE can run a check whose
config has `steps`, as described below.

A root test script `A && B` whose first step builds what the tests read
(`vp run -r build && vp run -r test`, `node build.js && mocha`) fails the
hidden trial when the build goes to a folder git ignores: the tests are
refused what it wrote. `init` then tries the script as two sandboxed steps,
reusing the plain run, and writes `steps: ["A", "B"]` with `sandbox-v3`
when that agrees with the plain `npm run` of the whole script:

- **A, the build,** runs with the files git ignores and the documentation
  hidden, no network, and writes only to the checkout and the run's own home
  and temporary directory. What it builds comes from the fenced inputs alone:
  it cannot read an earlier build.
- **B, the tests,** run as any sandboxed test run, with the git-ignored
  folders A wrote into visible and the rest hidden. A file in such a folder
  that A did not write (its time is before A started) is a leftover the
  tests could read: the run gives no result, says which file, and B does not
  run. Delete it, or make the build clean its output.
- **The build's output is never an input.** Each run builds it again from the
  inputs, so its bytes (a timestamp, a build ID) and an edit to it do not
  matter. A source change makes the check STALE as usual.
- **A failed build is the run's FAIL**, with its exit status; the tests do
  not run.

- **What counts as the build's output.** A file in a folder the build wrote
  into counts as the build's when its time is within the build's run. A file
  the build copies with its old time kept (`cp -p`, some asset copies) counts
  as a leftover, so such a build gives no result: make it copy without
  keeping times. A file in that output that changes, appears or goes before
  the tests end makes the result UNVERIFIED. Limit: another program writing
  into the build's output folder while the build runs is taken as the build's
  write. A git-ignored folder with more than 100,000 files stays hidden from
  the tests.
- **No `preSCRIPT` or `postSCRIPT`.** A package manager's run would run them
  and the steps would not, so a script with either is not split.

Each step runs as `sh -c STEP` from the checkout's root, with the
`node_modules/.bin` folders there and above first on `PATH`, as a package
manager's `run` puts them; init's trial confirms the split gives the plain
script's result. One `&&` only, with no `||`, `;`, `|` or `&` outside quotes
and parentheses. When the script changes, a run says so and is not
CURRENT: run `redue init` again. Not covered: a build started from inside
the tests (pokemon-showdown's `test/main.js` runs `node build`), turbo or
nx pipelines that build within one command, and workspace packages' scripts.

## What REDUE claims

CURRENT means the last sandboxed run's inputs are unchanged:

- every file in the checkout git doesn't ignore but its documentation
  (`sandbox-v3`), every file git doesn't ignore (`sandbox-v2`), or every file
  in it, git-ignored files and git-ignored links to files in it included
  (`sandbox-v1`), except `.git` and runner caches (the general recipe's, plus
  `__pycache__`, `.mypy_cache`, `.ruff_cache` and `.pytest_cache`);
- `node_modules` and `.venv`, observed as installed files, by identity;
- the environment the run gets (without display variables such as `TERM`
  and `COLUMNS`), and the places it may read;
- Node's and the package managers' executables, or the interpreter the
  `.venv` was made from, by file identity;
- every directory on PATH, by identity: installing, removing or upgrading a
  program in one makes the result STALE;
- `.git/info/exclude` and `.git/config`, by content: ruff and biome read the
  ignore rules there, and they decide what `sandbox-v2` hides. For a project
  in a subdirectory of its repository, also the `.gitignore` files above it.

## Telling a refusal from a real failure

A run the sandbox refused something fails like any other. REDUE does not run
every failure twice to find out:

- `init` runs each proposed check plainly and sandboxed, and proposes it
  when both give the same exit status and the same output, and a failure
  shows no sign of a refusal. The output is compared without colors,
  timings, the temporary and home directories, and lines about caches. The
  one exception is a check that passed plainly and failed only because it
  was refused a hidden file: it is run again with just that file visible, or
  gets the whole checkout (see
  [files git ignores](#files-git-ignores-and-documentation)).
  Otherwise `init` writes what it would have without this recipe and says why.
  These are the only runs `init` makes.
- When a `sandbox-v2` or `sandbox-v3` run fails with a refusal that names a hidden file, it
  runs again in the sandbox without hiding (see
  [files git ignores](#files-git-ignores-and-documentation)).
- When a sandboxed run fails and its output has a line that looks like a
  refusal ("Operation not permitted", "Permission denied", "Read-only file
  system", a name lookup or a connection that failed), REDUE runs the check
  again outside the sandbox. If that exits differently, the result is the
  plain run's and UNVERIFIED: "the sandbox changed the result", with the
  line. A failure without such a line is not run again.

## The private home

A typecheck or lint's home directory is kept between runs, per check, so caches tools
build there (font caches, a type checker's cache) are not rebuilt every run.
It starts empty: your configuration files are not in it. What a run leaves
there can change a later run, and REDUE trusts it like a runner cache. Remove
it with `redue remove-state`.

## Limits

- Inside Claude Code's own sandbox on macOS, `sandbox-exec` cannot start: the
  run goes ahead unsandboxed and is UNVERIFIED ("the run was not sandboxed").
  On Linux, Landlock works inside it.
- Windows is not supported. The check stays recording-only there.
- Linux before 6.7 (Landlock ABI below 4) cannot refuse TCP connections, so a
  run there is UNVERIFIED. UDP is not refused on Linux.
- System files (time zones, certificates, `/etc`) are not inputs: a change to
  them does not make a result STALE.
- A git repository nested in the checkout (not a submodule's `.git` file)
  is not hidden: git commands run beneath it find it.
- Runner caches in the checkout are trusted as the general recipe trusts them.
- On Linux, a run can still reach a daemon started outside it through a Unix
  socket file (Landlock does not cover them), and what that daemon reads is
  not seen. On macOS it cannot.
- On Linux, uv hard-links `.venv` files to its cache. The cache is
  toolchain: a file rewritten through the cache, not through the `.venv`, is
  noticed only when the observer next reads the `.venv` (when it starts).
- A `.venv` link that leads out of the checkout, other than the interpreter's,
  keeps the check recording-only and names the link, and so does a `.venv`
  that uses the system site-packages.
- A git-ignored link to a directory, or out of the checkout, is not observed,
  and neither is a `node_modules` directory outside the installed ones (a
  nested example project's).
- A script that changes files (`--fix`, `--write`) does not get this recipe:
  `init` would run it twice.
- With `sandbox-v2` or `sandbox-v3`, a run cannot read a hidden file, but it can still see
  that one exists, its size and its times, and write beneath it. On Linux it
  can also list a hidden folder; on macOS it cannot. A tool that acts on
  whether a git-ignored file exists, without reading it, is not covered: a
  new or removed one does not make the result STALE. In a census of 136
  test suites with ignored files after their build, none did.
- On Linux, a test run's UDP is refused, loopback included: the filter
  decides when the socket is made, before its address is known. A test that
  needs it fails its trial and keeps another recipe.
- On Linux, the launcher decides a `connect` from the address it reads in
  the process's memory, and the kernel reads it again after. A process that
  changes the address in between, from another thread, could reach another
  host. Honest test code does not.
- On Linux, a typecheck or lint can still connect to a Unix socket file
  outside it (a local database's).
- On Linux, a file a `sandbox-v2` or `sandbox-v3` run creates in a folder that holds hidden
  files (the checkout's root, when anything in it is hidden; with `sandbox-v3`,
  any folder with a README) cannot be read
  back in the same run. `init`'s trial and the rerun without hiding catch a
  check that needs to.
- A file whose git status changes without a change to its content (`git add
  -f` of an ignored file, `git rm --cached` of a tracked one) is noticed only
  when its content next changes. A change to `.gitignore` or
  `.git/info/exclude` makes the result STALE.
- A run that moves a hidden folder into a visible place can read it there.
- On macOS a `visible` file is matched by its exact path: a tool that opens it
  with other letter case on a case-insensitive volume is still refused, and
  the run goes again without hiding.
  That changes the checkout during the run, so the run is not reused.
