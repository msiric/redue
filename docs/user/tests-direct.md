# Direct test recipe (Vitest and Jest)

`redue init --recipe tests-direct --check test` records a project's unit test
run and reports later whether that result still applies to the files you have.
It supports a single-package npm project whose test script runs Vitest 4 or 5,
or Jest 29, directly. It runs on macOS and Linux with Node 22 or 24.

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
`--watch=false`. Other scripts stay recording-only.

REDUE runs the local runner with Node directly. npm, its lifecycle scripts and
`package.json` are not changed or executed.

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
them. A run may create git-ignored files (for example under `test/tmp`) and
read back what it wrote, in the same process or inside a directory it created:
when every change during the run is such an output, the result keeps the files
as the run left them.

## The guard

Every Node process and worker thread of the run loads a recorder
(`src/test-recorder.cjs`). After the run REDUE checks the record. The result is
kept but marked UNVERIFIED, with the reason, when the run:

- read a file that the config excludes, or a git-ignored file REDUE does not
  observe, that the run did not create first;
- changed an input during the run, or read a git-ignored output an earlier
  run left before writing it again: the result depends on that leftover;
- read or listed a file outside the checkout, other than files and directories
  the run created, Jest's cache directory and the runners' data directories
  (Vitest's `vitest` folder in the user data directory);
- connected to anything other than loopback or a local socket, or asked DNS
  about a name other than localhost;
- started a process that did not load the recorder: a shell, a binary, or a
  Node process with its own environment;

Lookups that can be asked again become run facts, checked before every CURRENT
answer: whether a path outside the checkout exists, where a link resolves, and
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
  `node_modules/.vite-temp`, `node_modules/.vitest`, Jest's cache directory and
  Vitest's user data directory are not inputs.
- Code that copies the environment and reads the copy, and native code that
  reads files, environment variables or the network, is not seen.
- Metadata of excluded files (size, times) is not compared, only their
  existence.
- A file the run creates and another process reads is the run's output only
  when it is inside a directory the run created.
- Outputs a run keeps are part of the result's inputs afterwards. Deleting
  them, or an observer restart that reindexes without them (git-ignored files
  are not indexed at start), makes the result STALE.
- A config written by an earlier build of this recipe is UNVERIFIED with "run
  redue init again"; move `redue.config.json` aside and run init.
- Windows is not supported; the check stays recording-only there.
