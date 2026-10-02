# vstate (local alpha development)

vstate records the outcome of explicitly configured checks and determines
whether each outcome still applies to its declared inputs. A passing result is
historical fact; it can later be STALE. Incomplete input coverage or uncertain
observation is UNVERIFIED, never CURRENT. CURRENT is bounded evidence about a
named check, not a claim that the project is correct.

This repository is local product-engineering source, not a published package.
On macOS with Node 22 or newer:

```sh
npm ci
node bin/vstate.mjs --help
node bin/vstate.mjs init
```

`init` writes a deliberately empty `vstate.config.json` if none exists. Add
checks and their input declarations before `start`; it does not infer coverage.
See [the example](examples/vstate.config.json). A successful command remains
recording-only until every relevant coverage category has a documented review
and any required probes are configured. A `coverage` flag is a reviewer claim,
not automatic dependency discovery.

```sh
node bin/vstate.mjs start
node bin/vstate.mjs status --json
node bin/vstate.mjs status --sync --json
node bin/vstate.mjs detail
node bin/vstate.mjs run typecheck
node bin/vstate.mjs stop
node bin/vstate.mjs remove-state
```

Use `--config FILE` for an external project config and `--state-dir DIR` to
override the local state location. By default, state is in a uniquely named
directory under `~/Library/Application Support/vstate/`; sockets, receipts,
snapshots, and logs stay there. `remove-state` requires a matching ownership
marker and removes only that directory. It never deletes project files or
installed dependencies. Probes and checks execute local commands, so only use
configuration from repositories you trust. Ordinary operation needs no account,
network connection, or telemetry upload.

`status` is a cheap cached read and cannot establish caller-specific Node or
environment identity. It reports UNVERIFIED where that context is needed.
`status --sync --json` and `detail` reconcile observation and use the caller's
declared context. They may run read-only probes and can take longer. A timeout or
observation gap withholds CURRENT. Neither read is an atomic snapshot against
another process editing concurrently. Checks execute only with `run`; direct
commands outside vstate create no receipts.

## Source boundaries

- `src/declared-plan.mjs` resolves explicit check input plans.
- `src/installed-inputs.mjs` resolves permitted linked installed paths;
  `src/index.mjs` hashes file contents and membership.
- `src/daemon.mjs` owns one checkout observer, reconciliation and applicability.
- `src/cli.mjs` executes checks against before/after checkpoints and records
  results; `src/run-lock.mjs` protects a single writer.
- `bin/vstate.mjs` owns public CLI parsing, readable output and config/state
  placement. No presentation surface owns verification semantics.

The current supported path is explicit local checks with declared files,
installed inputs and read-only probes. There is no automatic discovery,
background check rerunning, CI evidence ingestion, or passive capture of direct
commands. The included npm TypeScript probe is a narrow reviewed-contract tool,
not a general proof of JavaScript dependency completeness.
