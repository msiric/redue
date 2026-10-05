# REDUE

**Know what still holds. Redo what's due.**

You ran the checks. Then the code changed—or a new coding agent started with no
conversation history. Which results can you still use?

REDUE keeps persistent verification state for your codebase so developers and
coding agents can see which previous checks still apply to the code they have now.
It records evidence, not proofs of correctness.

```text
$ redue status --sync
✓ typecheck  CURRENT / PASS
? test  UNVERIFIED / PASS
  Recording-only: test runtime, transforms and cache inputs need review

# Later, after a relevant edit:
$ redue explain typecheck
typecheck: STALE / PASS
src/main.ts changed
Relevant inputs changed:
  src/main.ts
Due again when verification is needed: redue run "typecheck"
```

Agent A verifies and exits. Agent B starts fresh. The receipt is still there;
REDUE checks whether it still applies. Unrelated documentation edits can preserve
it; relevant source edits make it stale. [Run the reproducible demo](docs/contributor/demo.md).

## Try the alpha candidate

**Not published to npm yet.** With access to this source checkout, create and
install the ordinary npm package:

```sh
npm ci
npm pack
npm install --global ./redue-0.1.0-alpha.0.tgz
```

Use a Node installation you own; REDUE does not need administrator privileges.
If a global prefix is not writable, use a user-owned `--prefix` or run the
installed CLI with Node. [Installation and removal](docs/user/getting-started.md)
includes PowerShell and isolated-prefix instructions. After publication, the
intended install command is `npm install --global redue@alpha`.

Inside an existing, trusted Git project with dependencies already installed:

```sh
cd my-project
redue init
redue start
redue run typecheck  # use a check name printed by init
redue status
```

`init` discovers existing scripts, explains which can qualify and which are
recording-only, and writes a small `redue.config.json`. It never runs your checks
or changes your package manager, source, scripts, or dependencies. Commit the
reviewed project config; local evidence stays outside the checkout.

Start with ordinary `status`. When it cannot establish caller context, use
`redue status --sync` if that is worthwhile—or just rerun an inexpensive check.
**Synchronization can cost more than rerunning a cheap check, particularly on
Windows.** REDUE does not choose or execute that tradeoff for you.

## What the states mean

| State | Meaning | Normal next step |
| --- | --- | --- |
| CURRENT | The recorded result applies to the declared inputs. | Reuse a passing result; do not rerun merely for freshness. |
| STALE | Relevant inputs changed since the recorded result. | Rerun when verification is needed. |
| UNVERIFIED | Applicability is unknown: no receipt, incomplete coverage, pending observation, or missing context. | Read the reason; synchronize if worthwhile, or run the check. |
| FAILED | The invocation failed. Its applicability is tracked separately. | Keep the failure visible; it is not green evidence. |

A historical PASS remains PASS when stale or unverified. A historical failure
never becomes a successful check. CURRENT does not mean every product behavior
has been verified.

## Supported alpha path

- macOS, Linux, and Windows on supported local filesystems; Node 22+.
- Linux also requires Python 3 for observation. No WSL or Git Bash needed on Windows.
- npm, pinned Yarn `node-modules`, and pinned pnpm 12 isolated/hoisted layouts.
- Automatic qualification for supported TypeScript invocations; workspace
  boundaries follow the files actually consumed, including built declarations.
- Existing test/lint/build and arbitrary commands can record results while
  their applicability remains unqualified.

The [supported-project boundary](docs/user/supported-projects.md) is deliberately
narrow. A script named `test` is not automatically a complete test contract.

## Alpha limitations

- REDUE records evidence; it does not prove correctness.
- Direct commands outside `redue run` do not create receipts.
- Some tests, lints, and builds remain UNVERIFIED/PASS because their input contract is incomplete.
- Synchronized applicability has nontrivial cost and can lose to an inexpensive rerun.
- Unsupported/exotic install layouts and filesystems remain conservative; they do not become green through guesses.
- No cloud/team synchronization, IDE extension, or automatic background check execution.
- Alpha configuration and APIs may evolve. Neither cached nor synchronized status is an atomic snapshot against concurrent edits.

## Humans, shells, and agents

```sh
redue explain typecheck          # synchronized explanation; may run read-only probes
redue status --json              # conservative cached data
redue status --sync --json       # caller-aware decision
redue status --short             # small cached indicator; never synchronizes
redue stop                      # retains historical receipts
redue remove-state              # removes only this config's owned local state
```

Agents should use [the documented JSON interface](docs/user/json.md), not parse
terminal prose. [The canonical agent loop](docs/user/agents.md) keeps the
sync-versus-rerun choice explicit. [Shell usage](docs/user/shell.md) does not put
synchronized work in a prompt.

[User docs](docs/README.md) · [Contributing](CONTRIBUTING.md) ·
[Architecture](docs/contributor/architecture.md) · [Acceptance evidence](docs/acceptance/README.md)

## License

REDUE is licensed under [Apache-2.0](LICENSE). Dependencies retain their own licenses.
