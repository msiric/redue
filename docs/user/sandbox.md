# Sandboxed recipe (typecheck and lint, any language)

The sandboxed recipe runs a typecheck or lint command inside an operating
system sandbox and reports later whether that result still applies to the
files you have. The sandbox holds for every process the command starts, so it
covers programs REDUE cannot record: TypeScript 7's native compiler, esbuild,
oxlint and tsgolint, biome, turbo, and Python tools such as mypy, pyright, ty
and ruff.

**The claim.** A sandboxed result holds for a run that sees only the project,
its installed packages and the toolchain, the way CI does. It does not say
that a run with your own configuration files, a service on your machine or the
network would give the same result.

## Where it applies

- **Node projects:** a root `typecheck` or `lint` script (npm, pnpm, or Yarn
  with the `node-modules` linker). `init` tries the
  [direct TypeScript recipe](direct-typescript.md) and the pnpm and Yarn
  TypeScript recipes first; they stay first where they apply. Then the
  sandboxed recipe, before the [general recipe](node-script.md), since it
  also covers the native programs a script starts. Where init's trial shows a
  difference, or the sandbox cannot run, `init` writes the general recipe as
  before. Where the sandbox cannot start at run time (inside Claude Code's
  macOS sandbox), a script the general recipe takes is recorded as it records
  it.
- **Python projects:** mypy, pyright, ty and ruff installed in the project's
  `.venv` (`uv sync` makes one; Poetry does with `virtualenvs.in-project`).
  `init` uses the arguments your CI workflow, Makefile, tox, nox, justfile or
  shell scripts in `scripts/` run the tool with, through `uv run`, `poetry run`,
  `python -m` or `.venv/bin`. Without them it uses the tool's default:
  `ruff check`, `ty check`, `pyright`, and `mypy` (with `.` when mypy's
  configuration names no `files`).
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
{"name": "typecheck", "kind": "typecheck", "qualification": "sandbox-v1",
 "command": [".venv/bin/mypy", "src"], "inputs": ["**", "..."], "installedInputs": [".venv/**", "..."]}
```

A Node check names its script, as the general recipe's do:
`{"name": "lint", "script": "lint", "kind": "lint", "qualification": "sandbox-v1", ...}`.

With the Claude Code hook, `uv run mypy src`, `poetry run mypy src`,
`python -m mypy src`, `.venv/bin/mypy src` and `mypy src` are recognized as
that check. The last two count only when PATH finds the tool or Python in the
project's `.venv/bin` first. When the hook runs the check through REDUE, it
keeps `uv run` or `poetry run` in front, so the environment still syncs first.

## What the run sees

It may read and execute only beneath:

- the checkout;
- the toolchain: Node's installation and the package managers' (with
  Corepack's downloads), or the Python installation the `.venv` was made from;
- system directories (`/usr`, `/bin`, `/etc` and the like on Linux; `/usr`,
  `/System`, `/Library`, `/opt/homebrew` and the like on macOS);
- a private home directory and a fresh temporary directory, in REDUE's state.

It has no network: no TCP connection, loopback included. On macOS its only
Unix sockets are in its own temporary directory, which is new for each run.
On Linux 6.12 and later it cannot reach an abstract Unix socket outside the
run.

What the check leaves running is stopped when it exits, as at the end of a
CI job: its process group gets SIGTERM, and SIGKILL a second later. On Linux
the launcher also stops daemons that started their own session. On macOS
such a daemon outlives the run, but no later run can reach it: its socket
was in a temporary directory that is gone. The run gets no terminal input.

The checkout's `.git` is not an input. Tools still see it, as they do in a CI
checkout (a linter that applies `.gitignore` only inside a repository does),
but git commands find no repository: `GIT_DIR` points nowhere. A script that
runs git (`git diff --exit-code`) gives a different result inside the
sandbox, and `init` leaves it to the other recipes.

It gets a controlled environment, not yours:

- the variables the check declares (`TZ`, `LANG`, `CI`, `USER`, `LC_*`,
  `DYLD_*`, `LD_*`, and `NODE_*`, `npm_config_*`, `PNPM_*`, `YARN_*`,
  `COREPACK_*` for Node, or `PYTHON*`, `MYPY*`, `RUFF_*`, `PYRIGHT*`, `TY_*`
  for Python), with your values;
- your PATH, without the project's `.venv/bin`, which a Python check gets
  first instead, so `uv run` and an activated environment give the same PATH;
- `HOME`, `TMPDIR` and the XDG directories in its private directories;
  `VIRTUAL_ENV` for a Python check; Corepack's home where Corepack keeps it.

## What REDUE claims

CURRENT means the last sandboxed run's inputs are unchanged:

- every file in the checkout, git-ignored files and git-ignored links to
  files in it included, except `.git`, `node_modules` and `.venv` (observed
  as installed files, by identity) and runner caches: the general recipe's,
  plus `__pycache__`, `.mypy_cache`, `.ruff_cache` and `.pytest_cache`;
- the environment the run gets (without display variables such as `TERM`
  and `COLUMNS`), and the places it may read;
- Node's and the package managers' executables, or the interpreter the
  `.venv` was made from, by file identity;
- every directory on PATH, by identity: installing, removing or upgrading a
  program in one makes the result STALE;
- `.git/info/exclude` and `.git/config`, by content: ruff and biome read the
  ignore rules there.

## Telling a refusal from a real failure

A run the sandbox refused something fails like any other. REDUE does not run
every failure twice to find out:

- `init` runs each proposed check twice, plainly and sandboxed, and proposes
  it only when both give the same exit status and the same output, and a
  failure shows no sign of a refusal. The output is compared without colors,
  timings, the temporary and home directories, and lines about caches.
  Otherwise `init` writes what it would have without this recipe and says why.
  These are the only runs `init` makes.
- When a sandboxed run fails and its output has a line that looks like a
  refusal ("Operation not permitted", "Permission denied", "Read-only file
  system", a name lookup or a connection that failed), REDUE runs the check
  again outside the sandbox. If that exits differently, the result is the
  plain run's and UNVERIFIED: "the sandbox changed the result", with the
  line. A failure without such a line is not run again.

## The private home

The run's home directory is kept between runs, per check, so caches tools
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
- A program that reads files in `.git` itself, without git (a commit hash for
  a version string), reads something REDUE does not observe: a commit does
  not make the result STALE.
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
