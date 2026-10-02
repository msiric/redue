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

`init --dry-run` previews existing `package.json` verification scripts without
writing or running them. `init` prints its findings, then creates a small
`vstate.config.json` if none exists. It does not edit application or package
manager files. Review the generated config before starting the observer.
See [the manual example](examples/vstate.config.json) for arbitrary commands.
For example, an unsupported check can still record its outcome:

```json
{
  "schema": 1,
  "checks": [{
    "name": "migration",
    "command": ["@node", "tools/check-migrations.mjs"],
    "inputs": ["migrations/**", "tools/check-migrations.mjs"]
  }]
}
```

This check remains recording-only until its complete applicability boundary is
reviewed. A successful command alone does not qualify it for CURRENT.

```sh
node bin/vstate.mjs start
node bin/vstate.mjs status --json
node bin/vstate.mjs status --sync --json
node bin/vstate.mjs detail
node bin/vstate.mjs detail --json
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

## Node onboarding boundary

`init` detects npm from `package-lock.json`/`npm-shrinkwrap.json` or an npm
`packageManager` declaration. It detects Yarn from `yarn.lock` or its
declaration and reads `.yarnrc.yml` to distinguish node-modules/classic from
PnP and other modes. A Yarn v1 lockfile can identify the classic layout, but
without a declared Yarn version `init` does not create a runnable config:
Corepack can select a different version and edit `package.json`. Conflicting
package managers are reported without pretending that installation coverage
is known. When npm is not pinned in `package.json`,
`init` reads the local npm executable's package manifest if available; it
leaves the version unknown rather than guessing if that inspection fails.

At the repository root, `init` looks for existing typecheck, test, lint, and
build scripts. It prefers familiar script names, then unique recognizable
`tsc`, Vitest/Jest, ESLint, or Vite commands under other names. Multiple
matches are reported as ambiguous rather than guessed. It never creates a new
project script. It recognizes canonical
`tsc --noEmit` on local npm installations as a candidate for automatic
qualification. Before CURRENT is possible, a read-only probe checks the
TypeScript configuration and effective file list, local compiler, installed
contents, npm/Node identity, and relevant caller context. Unsupported plugins,
preloads, config graphs, or outside-root inputs leave the check UNVERIFIED with
an explanation. A discovered script can still be run and recorded in that
state. Root and package-level npm/Yarn workspace scripts are discovered from
`package.json` workspace declarations. Pinned Yarn 4 `node-modules`/classic
workspaces with a standalone `tsc -p .` script, local TypeScript, a conventional
`src` include, and Node module resolution can qualify automatically. For one
workspace, use `vstate init --workspace NAME --check typecheck`; it writes only
that check and keeps derived relationships out of project configuration. The
contract observes selected `src` membership, root/package TypeScript config,
built declarations of internal workspace dependencies, and physical installed
files. It rechecks TypeScript's effective input list with a read-only probe.
A sibling workspace is not an input merely because it shares the repository.
When an internal dependency is consumed through built declarations, changing
only its source does not stale the selected check until the consumed output
changes. Unsupported custom resolution, project references, outside-root
source links, and installation modes remain recording-only. Other Yarn
typechecks, Vitest/Jest, ESLint, and builds start recording-only unless a
separately justified explicit contract is provided.
In particular, test caches and build-generated inputs are not excluded to
make evidence green.

Pinned pnpm 12 projects are read from `packageManager`, `pnpm-workspace.yaml`,
the lockfile, and the installed `node_modules/.modules.yaml` metadata. The
supported local layouts are pnpm's standard isolated and hoisted
`node_modules` with a project-local `.pnpm` virtual store. `init` can discover
root and workspace scripts. For a standalone `tsc --noEmit` or `tsc -p ...`
script in the narrow TypeScript contract, it records the exact installed
compiler invocation directly. This avoids pnpm 12's task-run bookkeeping
writes during `pnpm run`; it does not alter the project's script. Test, lint,
build, and ambiguous TypeScript scripts still execute through `pnpm run` and
start recording-only. The generated `@typescript-bin:WORKSPACE` token resolves
the local compiler when the check runs; it is not an absolute machine path.

The pnpm contract indexes consumed installed package contents inside the
project, selected workspace source, linked workspace declaration outputs,
relevant manifests, configuration, and installation metadata. The global pnpm
store is neither watched nor deleted. PnP, custom modules/virtual-store roots,
global virtual stores, injected workspace dependencies, and external links
without an observed boundary remain recording-only with a reason. Installed
files with hard-linked aliases outside the checkout also remain recording-only:
their contents are indexed, but writes through an unseen alias cannot support
CURRENT. An absent optional package remains unqualified when Node could later
resolve it from an unobserved ancestor `node_modules`; project-local candidate
locations are still tracked for plan changes. No configuration assertion is
generated to hide either gap.

An unobservable source symlink or missing Git checkout is reported by `init`
before writing a config. A local explicit configuration can grant a narrow
external observation root after review; `init` will not add machine-specific
paths to a project config automatically.

The generated config is project-relative and versioned. Runtime state and
receipts live separately. `packageManager`, `checks[].script`, `kind`,
`inputs`, optional `workspace`, and optional `qualification` are the generated
public fields. The
CLI also accepts `checks[].command` as exact argv for arbitrary checks;
`@node`, `@project`, `@which:NAME`, and the narrow
`@typescript-bin:WORKSPACE` token are resolved at invocation. A command
or input-declaration change invalidates previous evidence.

## JSON for integrations

`status --json` is a cached, conservative read. `status --sync --json` and
`detail --json` reconcile observation and evaluate caller context and read-only
state probes. All return schema `1` with `state`, counts (`current`, `stale`,
`failed`, `unverified`), `checks`, and `observation`. A check contains `name`,
historical `result` (`PASS`, `FAIL`, or null), `freshness` (`CURRENT`, `STALE`,
`UNVERIFIED`), `reason`, and `reuse_eligible`. The observation object includes
`healthy` and a reason when unavailable. Consumers should use these fields;
additional diagnostic fields may change during alpha. Cached reads may be
UNVERIFIED when caller context is required even if synchronized reads can
establish CURRENT. Never infer project correctness from an aggregate state.

## Source boundaries

- `src/declared-plan.mjs` resolves explicit check input plans.
- `src/installed-inputs.mjs` resolves permitted linked installed paths;
  `src/index.mjs` hashes file contents and membership.
- `src/yarn-workspace-inputs.mjs` derives the narrow Yarn workspace typecheck
  input plan; `src/yarn-workspace-typecheck-probe.mjs` checks its effective
  TypeScript file list without running the check.
- `src/pnpm-inputs.mjs` derives pnpm installation and TypeScript input plans;
  `src/pnpm-typecheck-probe.mjs` checks the effective compiler input list.
- `src/daemon.mjs` owns one checkout observer, reconciliation and applicability.
- `src/cli.mjs` executes checks against before/after checkpoints and records
  results; `src/run-lock.mjs` protects a single writer.
- `bin/vstate.mjs` owns public CLI parsing, readable output and config/state
  placement. No presentation surface owns verification semantics.

The supported path is local named checks with declared files, installed inputs,
and read-only probes. There is no background check rerunning, CI evidence
ingestion, or passive capture of direct commands. The npm TypeScript contract
is intentionally narrow, not a proof of arbitrary JavaScript dependencies.
