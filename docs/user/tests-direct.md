# Direct test recipe (Vitest and Jest)

`redue init --recipe tests-direct --check test` (or `redue init`, where the
[sandboxed recipe](sandbox.md) cannot take the test script) records a project's unit test run and reports later whether that result
still applies to the files you have.
It supports a single-package project installed by npm, pnpm 9-12 (isolated or
hoisted `node_modules`) or Yarn with the `node-modules` linker, whose test
script runs Vitest 4 or 5, or Jest 29, directly. It runs on macOS and Linux with
Node 22 or 24. The project has one lockfile kind, matching any
`packageManager` declaration; Yarn needs that declaration. With pnpm, the
runner is the package `node_modules/RUNNER` links to, inside the checkout.
Jest also needs jest-util 29 at `node_modules/jest-util`, which pnpm does not
place there unless it hoists.

In a workspace (npm or Yarn `workspaces`, or `packages` in
`pnpm-workspace.yaml`), `init` gives each package whose test script runs
Vitest directly its own check, `PACKAGE:test`, run in the package's directory
with the Vitest that Node finds from there. Its inputs are still the whole
checkout, so an edit in any package makes it STALE. The root's and every
package's `node_modules` are observed as installed files, without Vite's
caches in them. Jest is not supported in workspace packages, and neither is a
test script at the workspace root. A package added later needs `init` again:
its manifest appearing makes the workspace's checks UNVERIFIED until then.

## Setup

```sh
redue init --recipe tests-direct --check test
redue start
redue run test
redue status --sync
```

`init` picks the `test`, `test:unit` or `test:check` script when it runs a
runner directly, otherwise the only script that does. The script must be one
runner invocation: no `&&`, quotes, globs or variable assignments. Watch mode,
`--changed`, `related`, snapshot updates (`-u`), shuffling, sharding and
Jest's `--onlyChanged` are refused. Vitest needs `run`, `--run` or
`--watch=false`. Other test scripts stay recording-only: the
[general recipe](node-script.md) covers typecheck and lint scripts, not tests.

REDUE runs the local runner with Node directly. The package manager, its
lifecycle scripts and `package.json` are not changed or executed.

## What REDUE claims

CURRENT means the last run's inputs are unchanged: every file in the checkout
outside `node_modules`, the installed files in `node_modules`, the Node binary,
the exact command, and the environment. Every environment variable the run's
JavaScript read directly must have the same value, or still be unset. Node and
libc read some variables natively, and Vite lists the environment for its own,
so these are always compared: `TZ`, `LANG` and every `NODE_*`, `LC_*`,
`VITE_*`, `DYLD_*` and `LD_*` variable. Display-only variables are not
compared: `_`, `TERM`, `TERM_PROGRAM`, `COLORTERM`, `FORCE_COLOR`, `NO_COLOR`,
`FORCE_TTY`, `COLUMNS`, `LINES` and `AI_AGENT`.
It does not mean a rerun would give the same result. A test that depends on the
time of day or on randomness can pass now and fail later on the same inputs.

The default config excludes `**/*.md`, `**/*.mdx` and, with `--coverage`,
`coverage/**`. Editing those files keeps a result CURRENT unless the run read
them. When the configuration Jest loads (the `--config` file, else
`jest.config.*`, else package.json's `jest`) sets a `cacheDirectory` inside
the checkout as one plain string, that directory is a runner cache, as
`node_modules/.cache` is for the general recipe: not an input, and what the
run reads and writes there does not count. A relative value or one starting
with `<rootDir>` is resolved against `rootDir` when that is a plain string
too. artsy/eigen keeps its cache in `.cache/jest`, which its suite rewrites
on every run. Known limit: Jest's transform cache key covers the transformer
and its configuration but not the source of local Babel plugins, so after
such a plugin changes, a run can reuse a cached transform, as it would
outside REDUE. A run may create git-ignored files (for example under `test/tmp`) and
read back what it wrote, in the same process or inside a directory it created:
when every change during the run is such an output, the result keeps the files
as the run left them.

## The guard

Every Node process and worker thread of the run loads a recorder
(`src/test-recorder.cjs`). After the run REDUE checks the record. The result is
kept but marked UNVERIFIED, with the reason, when the run:

- read a file that the config excludes, or a git-ignored file REDUE does not
  observe, that the run did not create first (REDUE's own hook settings,
  `.claude/settings.local.json`, are kept by content instead, as a small file
  outside the checkout is);
- changed an input during the run, or read a git-ignored output an earlier
  run left before writing it again: the result depends on that leftover;
- listed a directory, or read a file over 1 MB, outside the checkout, other
  than files and directories the run created, Jest's cache directory and the
  runners' data directories (Vitest's `vitest` folder in the user data
  directory);
- connected to anything other than loopback or a local socket, or asked DNS
  about a name other than localhost;
- started a process that did not load the recorder: a shell, a binary, or a
  Node process with its own environment. A process that replaces itself with
  another program (`process.execve`) counts as starting it, and it must
  become a recorded Node process. A shell is read by its command, as the
  [general recipe](node-script.md#programs) reads it: one that runs another
  program before it becomes Node counts too;
- used one of Node's bindings with file, network or program access
  (`process.binding('fs')`, `'spawn_sync'` and others), or ran Node with
  `--expose-internals`: the recorder cannot follow those;
- had an installed file with another hard link, other than a link into the
  pnpm store the install recorded in `node_modules/.modules.yaml` (pnpm's
  default on Linux) or, without a pnpm store, links that are all installed
  files the check observes (esbuild's install links its binary into its
  platform package). The link count of each such file is checked again
  before every answer, so a link added later is noticed. A change through a
  link elsewhere, such as Yarn's hardlinks modes, is not seen. This applies
  to the [general recipe](node-script.md) too.

Lookups that can be asked again become run facts, checked before every CURRENT
answer: whether a path outside the checkout exists, where a link resolves, the
content of each smaller file read outside it (Linux native bindings read
`/proc/version` and `/usr/bin/ldd` to pick their C library), and
the existence and listings of excluded or ignored files in the checkout.

When two runs on the same inputs and environment give different results, the
check is UNVERIFIED until the inputs change.

A `--coverage` run may read back the default `coverage/` report: Jest reads
every JavaScript file under its roots, an earlier report's included, only to
map dependencies, and that does not decide pass or fail. This is not allowed
when the configuration names coverage thresholds, which make the report decide
the result, or another report directory. Configuration can be code, so REDUE
looks for `coverageThreshold`, `thresholds`, `coverageDirectory` and
`reportsDirectory` in `package.json`'s `jest` field and the runner's config
files; when one appears, reading an old report is UNVERIFIED.

## Known causes of UNVERIFIED

Tests that write files git does not ignore change the run's inputs.

## Limits

- Runner caches and data are trusted: `node_modules/.vite`,
  `node_modules/.vite-temp`, `node_modules/.vitest`, Vitest's typecheck build
  info in `node_modules/vitest/dist`, Jest's cache directory and Vitest's user
  data directory are not inputs.
- Code that copies the environment and reads the copy, and native code that
  reads files, environment variables or the network, is not seen.
- Metadata of excluded files (size, times) is not compared, only their
  existence.
- A file the run creates and another process reads is the run's output only
  when it is inside a directory the run created.
- Git-ignored outputs a run writes are not inputs afterwards, unless they lie
  beneath a directory a pattern names (`test/**`); there they are, and
  deleting them makes the result STALE. A later run that reads a git-ignored
  leftover REDUE does not observe is UNVERIFIED.
- A config written by an earlier build of this recipe is UNVERIFIED with "run
  redue init again"; move `redue.config.json` aside and run init.
- pnpm's store is trusted not to change a file in place, as pnpm never does.
  Editing an installed file in another project that shares the same store
  file changes it here too, unseen. Use `pnpm patch`, or a copying install
  (`package-import-method=copy`), if you edit installed files.
- Windows is not supported; the check stays recording-only there.
