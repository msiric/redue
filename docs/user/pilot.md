# Opt-in development pilot: alpha.10

Use one fixed build for several ordinary development sessions. The owner will
invite two or three willing testers and approve their projects; nothing is
collected or uploaded automatically. External usage has **not started**. Earlier
controlled compiler/agent trials are acceptance evidence, not independent adoption.

## Check the boundary first

Start with a trusted, single-package npm Git checkout, normally installed locked
dependencies, and an existing standalone `tsc --noEmit` script without pre/post
scripts. The direct recipe accepts only the official, unchanged TypeScript
**5.5.2, 5.6.3 or 5.9.3** packages and Node **22 or 24**. No workspaces, named
tsconfig selection, emitted/incremental/composite builds, custom loaders or
outside-root inputs are added by this pilot. Do not downgrade or change your
project to fit; record an unsupported setup as feedback.

Development-mode source-map support, Node preloads/inspectors/compile-cache
overrides and `TS_ETW_MODULE_PATH` are unsupported. The injected
`NODE_USE_ENV_PROXY=1` context is reviewed only on Node **22.13.0**; leave the
environment and security controls intact. See the [full recipe boundary](direct-typescript.md).

CLI/package mechanics are tested on macOS/APFS, native Linux and Windows/NTFS;
Linux also needs Python 3 and [supported native storage](getting-started.md).
Actual fresh-session behavior was tested with Codex **0.162.0 on macOS**, Node
22.13.0 and the approved exact checkout/state/socket access. This is not general
sandbox compatibility. Claude mechanics are tested; Claude behavior and cross-host
handoff are **NOT RUN**. The recording shortcut is macOS/direct-recipe only.

## Install and connect explicitly

For a new default npm installation:

```sh
npm install --global @redue/cli@0.1.0-alpha.10
redue --version
cd my-project
redue --config redue.config.json init --recipe typescript-direct --check typecheck --dry-run
redue --config redue.config.json init --recipe typescript-direct --check typecheck
redue --config redue.config.json agent setup codex --dry-run
redue --config redue.config.json agent setup codex --apply
redue --config redue.config.json start
redue --config redue.config.json agent doctor codex --json
```

Use the discovered check name. Review both previews before applying. The recorded
invocation is the resolved local Node/compiler with `--noEmit`, **not npm or its
lifecycle scripts**. Neither init nor setup executes verification. An existing
config is never overwritten; use the [deliberate check replacement procedure](direct-typescript.md#existing-npm-configuration-deliberate-replacement)
without losing other checks or changing config/state identity. For an owned custom
installation prefix or Windows command shims, use the [installation instructions](getting-started.md).

Run doctor inside the agent's actual command boundary too. A healthy outside-shell
result does not prove access. The owner must grant only the intended checkout,
owned state directory and exact observer endpoint through supported host controls.
The observer can write its index, run trusted configured probes in its own process
context, reload receipts and stop; endpoint access is more than a file read.
Do not disable sandboxing, bypass the proxy, or allow all sockets. If access is
unavailable, record the limitation; an installed skill is not behavioral acceptance.
See [access and diagnostics](agents.md). Doctor does not run verification or sync.

Complete setup before the first real verification obligation. When that obligation
arises, record the configured compiler check in the intended execution context:

```sh
redue --config redue.config.json run typecheck
redue --config redue.config.json status --sync --json
```

A successful run may remain **UNVERIFIED**. Reuse needs understood schema, healthy
observation, CURRENT, PASS and `reuse_eligible: true`; a receipt or exit code alone
is insufficient. Recovery cannot repair a run's missing start observation. A later
fully observed run can create new eligible evidence. Do not erase receipts to get green.

Start a fresh agent session after connecting, then work normally. Keep ordinary
task requests and explicit fresh-verification obligations; an explicit npm-script
request still requires npm. Let later sessions occur naturally—do not manufacture
edits, restarts or repeated queries to inflate reuse. Configured compiler evidence
does not verify tests, npm lifecycle behavior or application correctness.

## Update or leave without losing evidence

Keep the pilot version fixed unless a real defect requires a reviewed update.
Record any build boundary. Before replacing an installation, stop every observer
using it; keep the same npm prefix, config and any explicit state selection.

```sh
redue --config redue.config.json stop
npm install --global @redue/cli@0.1.0-alpha.10
redue --config redue.config.json agent setup codex --dry-run
redue --config redue.config.json agent setup codex --apply
redue --config redue.config.json start
redue --config redue.config.json status --sync --json
```

Package installation alone does not update project instructions. Setup updates
intact owned content, preserves unrelated text and refuses edited managed content.
Review conflicts; do not delete ownership records to force an update. Setup metadata
can invalidate prior applicability; reassess normally and start a fresh agent session.
Historical receipts remain. See [the complete update procedure](agents.md#update-an-existing-connection).

To disconnect and uninstall, using the same installation prefix when applicable:

```sh
redue --config redue.config.json agent remove codex --dry-run
redue --config redue.config.json agent remove codex --apply
redue --config redue.config.json stop
npm uninstall --global @redue/cli
```

This preserves project config and receipts. Do not use `remove-state` for an upgrade
or pilot exit. Edited managed content is left intact with a conflict for review.

## Voluntary notes, reviewed before sharing

Keep a small local note per real verification obligation, including setup failures
and abandoned attempts. Use existing local receipts/tool history only when you
choose; do not enable automatic transcript capture. Suggested fields:

| Field | Record |
| --- | --- |
| Context | Build, OS/Node/compiler/host versions, anonymous project/session label |
| Obligation | What actually needed verification; explicit fresh execution if requested |
| Decision | Consulted? Agent-visible CURRENT/PASS/eligible, STALE, unsupported or unavailable? |
| Outcome | Actual reuse with no equivalent execution; wrapped run; execution outside REDUE; or unresolved |
| Evidence | Local before/after receipt IDs and actual commands, reviewed locally |
| Cost | Measured setup/restart/query/recording/execution durations, if available |
| Friction | What failed or confused; why you continued or stopped using REDUE |

A CURRENT query is not automatically a saved run; an inspection needing no
verification is not an avoided check. Do not infer a counterfactual from a receipt.
Label estimated avoided compiler cost and its assumptions separately from measured
time. Include recording, restarts and required reruns. Whole-task time alone does
not establish causal speedup. The question is whether natural later reuse repays
the cost of creating and maintaining evidence.

Share only a voluntary owner-reviewed, redacted summary through the
[existing issue tracker](https://github.com/msiric/redue/issues). Keep private source,
paths, configuration bodies, credentials, receipts and raw transcripts out of public
issues. Sensitive correctness/security reports use the repository's private security
reporting channel. Maintain one short friction list, prioritize correctness first,
and choose the next development task from observed usage rather than a benchmark target.
