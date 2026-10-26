# General recipe (typecheck and lint scripts)

The general recipe records a project's own typecheck or lint script, run
through its package manager, and reports later whether that result still
applies to the files you have. It is a lower tier than the strict recipes:
`redue init` tries the [direct TypeScript recipe](direct-typescript.md), the
pnpm and Yarn TypeScript recipes and the [direct test recipe](tests-direct.md)
first, and uses the general recipe for a root typecheck or lint script none of
them takes. Test scripts use the direct test recipe; `init` does not propose
the general recipe for them.

It supports a project installed by npm, pnpm 9-12 (isolated or hoisted
`node_modules`) or Yarn with the `node-modules` linker, with one lockfile kind
matching any `packageManager` declaration, on macOS and Linux with Node 22 or
24. Workspaces are supported for root scripts. `init --recipe node-script`
writes general checks only.

## Setup

```sh
redue init
redue start
redue run lint
redue status --sync
```

The config gets one field for the recipe, written by `init`:

```json
{"name": "lint", "script": "lint", "kind": "lint", "qualification": "node-script-v1", "inputs": ["**", "..."]}
```

`redue run lint` runs `npm run lint` (or `pnpm run lint`, `yarn run lint`) with
REDUE's recorder loaded in every Node process, and npm's and pnpm's update
checks turned off. With the Claude Code hook, `npm run lint`, `pnpm lint` and,
for a script that is one plain command such as `eslint .`, that command itself
and `npx eslint .` are recognized like typecheck and test commands.
`status` and the hook's skip message name the recipe that made the receipt.

## What REDUE claims

CURRENT means the last run's inputs are unchanged:

- every file in the checkout, except `.git`, every `node_modules`, the runner
  caches listed below and the files the run itself wrote;
- the installed files in the root's and every workspace package's
  `node_modules`, and Yarn's install state, by file identity;
- the lockfile and `package.json`, as files of the checkout;
- the package manager's executable and Node, by file identity, and the exact
  script;
- every environment variable the run's JavaScript read directly, and always
  `TZ`, `LANG`, `PATH`, `HOME`, `CI`, `XDG_CONFIG_HOME` and every `NODE_*`,
  `LC_*`, `VITE_*`, `DYLD_*`, `LD_*`, `npm_config_*`, `pnpm_config_*`,
  `PNPM_*`, `COREPACK_*` and `YARN_*` variable;
- the executables of npm, pnpm, Yarn and Corepack on PATH, by file identity,
  since a script may run another package manager;
- small files read outside the checkout (up to 1 MB), by content, and lookups
  outside it, asked again before each answer.

Runner caches are not inputs, and a run may read and write them: `.cache`,
`.vite`, `.vitest`, `.turbo`, `.nx`, `.swc`, `.jest-cache`, `.parcel-cache`,
`.angular/cache`, `.next/cache` and `.tmp` directories, `*.tsbuildinfo`,
`.eslintcache`, `.stylelintcache`, `.prettiercache`, and the
`_tmp_<pid>_<hex>` files pnpm writes and removes at every run. A file with
such a path that git does not ignore is source: reading it makes the run
UNVERIFIED. At the top of each `node_modules`, only `.cache`, `.vite`,
`.vite-temp`, `.vitest` and `.vitest-cache` are left out, and `*.tsbuildinfo`
anywhere in it.

Two installed files are rewritten by tools during a run. pnpm rewrites
`node_modules/.pnpm-workspace-state-v1.json` at the first run after an
install, through a temporary `node_modules/.tmpXXXXXX` file, and on Linux
writes a file with no name there (`O_TMPFILE`), whose writes the file
watcher reports as `node_modules/#NUMBER`. vue-tsc writes
`node_modules/.vue-global-types/*.d.ts` before it reads them. These files stay
inputs. When they are the only files a run changed, and the run wrote them,
the result is kept with the files as the run left them. A recorded process
counts as writing a file it wrote; for pnpm's files, the pnpm executable must
have run. A `#NUMBER` event counts only directly in the root `node_modules`,
on Linux, when no file has that name. A later change to them makes the
result STALE.

It does not mean a rerun would give the same result: a test that depends on
the time or on randomness can pass now and fail later on the same inputs.

## Programs

The recorder sees only Node processes. Every other program a run starts must be
one REDUE can account for:

- `sh` or `dash`, or `bash` without `BASH_ENV`, running a command that, read
  as text, starts only Node programs, package managers and shell builtins
  (`cd`, `echo`, `true`, `export`, `exec` and a few more). Words are looked up
  on the PATH the shell got. A Node program is the Node executable, a file
  whose `#!` line runs Node, or a pnpm launcher. A version manager's `node`
  shim (asdf, nodenv) is a script and does not count. Other shells read
  startup files and are refused. The shell must still have REDUE's recorder in
  `NODE_OPTIONS`: npm's and pnpm's `node-options` setting replaces it, and a
  run under such a setting is UNVERIFIED;
- a pnpm launcher in `node_modules/.bin`: the `#!/bin/sh` script pnpm writes,
  which runs `sed`, `dirname`, `uname` or `readlink` before it starts Node. It
  is trusted only when its text is exactly one of the templates pnpm 8.0 to
  12.14 write (`src/pnpm-shim-templates.json`), with only the bin file and
  `NODE_PATH` filled in;
- the pnpm executable (pnpm 12, also the copy Corepack downloads): REDUE cannot
  see what it does, so the scripts it runs are read as text the same way,
  their `pre` and `post` scripts included. Filters and recursive runs
  (`--filter`, `-r`) are refused. At least one Node process it starts must
  have loaded the recorder, and its configuration files outside the checkout
  (`pnpm/rc`, `pnpm/config.yaml`, `~/.npmrc`, the global `npmrc`) are kept by
  content;
- `ps -A -o ppid,pid`, which pnpm loaded into Corepack runs.

A process that replaces itself with another program through
`process.execve` (TypeScript 7's `tsc` does this to start its native
compiler) is judged the same way as a program it starts. `init` reads
TypeScript 7's launchers (`tsc` from `typescript@7`, `tsgo` from
`@typescript/native-preview`) as that native compiler and keeps such a script
recording-only.

Anything else makes the result UNVERIFIED and names the program: `git`,
`sleep`, `find`, and native programs from installed packages such as esbuild,
turbo, tsgo, tsgolint and biome, whose reads, writes and network use REDUE
cannot see. `init` reads the script the same way and keeps a script that
starts such a program recording-only, with the program in the reason.

A command line may use `&&`, `||`, `;`, `|`, quotes without expansions,
globs in arguments and redirection to `/dev/null`. Variables, command
substitution, input redirection, subshells, here-documents and `command -p`
are refused. Setting or clearing `NODE_OPTIONS`, `PATH`, `REDUE_RUN_RECORD`,
`BASH_ENV`, `ENV`, or npm's or pnpm's `node-options` or `script-shell` is
refused, since it could stop a Node process from loading the recorder.
`node --env-file` and Node's config-file options are refused: Node reads those
files natively. `process.loadEnvFile` is recorded as a read.

## The guard

As in the [direct test recipe](tests-direct.md#the-guard), the result is kept
but marked UNVERIFIED, with the reason, when the run read a git-ignored file
REDUE does not observe and did not create first, changed an input during the
run (a formatter's `--write`, a generated `version.ts`), listed a directory or
read a large file outside the checkout, used the network, or started a program
REDUE does not account for. Reads through a workspace package's link in
`node_modules` count where the link leads.

The package managers' own installations, Corepack's downloads and npm's log
directory are toolchain, identified by the package manager's executable, not
inputs.

## Limits

- On macOS, a file created and removed directly in the project root during a
  run (pnpm 12 does this) can be reported by the file watcher as an event on
  the root itself, an observation gap that makes the run UNVERIFIED. Linux
  reports the file, which is not an input.
- On Linux, any program's file with no name in the root `node_modules`,
  written during a run that started the pnpm executable, is taken as pnpm's.
  If that program gives the file a real name (any name, `node_modules`
  included) and then writes through the open file, REDUE misses those
  writes. A real file named `node_modules/#NUMBER` that is created and
  removed within such a run is treated the same way. Outside a pnpm run,
  these writes leave the run UNVERIFIED.
- The pnpm executable and the pnpm launchers' helpers are trusted as
  toolchain: what they read is not checked.
- Code that copies the environment and reads the copy, and native code that
  reads files or variables or starts programs (native addons such as
  Rust-based resolvers), is not seen. Neither are files opened by
  `node:sqlite` or preopened for `node:wasi`.
- A project whose `.npmrc` sets `node-options` stays UNVERIFIED: npm replaces
  `NODE_OPTIONS` with it, which drops REDUE's recorder.
- A script that runs a build first (`npm run build && tsc --noEmit`) usually
  starts esbuild or another native bundler and stays UNVERIFIED.
- Windows is not supported; the check stays recording-only there.
