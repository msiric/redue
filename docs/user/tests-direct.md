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
the exact command, and these environment variables: `TZ`, `LANG`, `CI`,
`FORCE_COLOR`, `NO_COLOR` and every `NODE_*`, `LC_*`, `VITE_*`, `VITEST_*`,
`JEST_*`, `DYLD_*` and `LD_*` variable. It does not mean a rerun would give
the same result. A test that depends on the time of day or on randomness can
pass now and fail later on the same inputs.

The default config excludes `**/*.md`, `**/*.mdx` and, with `--coverage`,
`coverage/**`. Editing those files keeps a result CURRENT unless the run read
them.

## The guard

Every Node process and worker thread of the run loads a recorder
(`src/test-recorder.cjs`). After the run REDUE checks the record. The result is
kept but marked UNVERIFIED, with the reason, when the run:

- read a file that the config excludes, or one git ignores (REDUE does not
  observe ignored files);
- read or listed a file outside the checkout, other than files and directories
  the run created and Jest's cache directory;
- read an environment variable that is set and not compared above, other than
  `TERM`, `TERM_PROGRAM`, `COLORTERM`, `FORCE_TTY`, `COLUMNS`, `LINES` and
  `AI_AGENT`;
- connected to anything other than loopback or a local socket, or asked DNS
  about a name other than localhost;
- started a process that did not load the recorder: a shell, a binary, or a
  Node process with its own environment;
- wrote to a file that is an input.

Lookups that can be asked again become run facts, checked before every CURRENT
answer: whether a path outside the checkout exists, where a link resolves, and
the existence and listings of excluded or ignored files in the checkout.
Environment variables the run read while unset must still be unset.

When two runs on the same inputs and environment give different results, the
check is UNVERIFIED until the inputs change.

## Known causes of UNVERIFIED

Measured on public projects in October 2026:

- Vitest reads `SHELL` (through `std-env`, to detect StackBlitz) and Jest reads
  `SHELL` and `_` (through `yargs`). Every run of both runners is UNVERIFIED
  on a machine where `SHELL` is set.
- Vitest 5 reads `~/Library/Application Support/vitest/.vitest-secret-token`
  on macOS.
- Jest lists and reads every JavaScript file under its roots, including an
  earlier run's `coverage/` report.
- Tests that write files inside the checkout change the run's inputs.

## Limits

- Runner caches are trusted: `node_modules/.vite`, `node_modules/.vite-temp`
  and Jest's cache directory are not inputs.
- Code that copies the environment and reads the copy, and native code that
  reads files, environment variables or the network, is not seen.
- Metadata of excluded files (size, times) is not compared, only their
  existence.
- A file the run creates and another process reads is the run's output only
  when it is inside a directory the run created.
- Windows is not supported; the check stays recording-only there.
