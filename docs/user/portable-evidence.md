# Portable compiler evidence (unreleased)

**Evidence travels; CURRENT is independently established by the recipient.**
This guide describes the portable-evidence candidate, not the published alpha.10
package. Use an explicitly reviewed candidate tarball and record its source commit
and SHA-256. Do not automatically update the fixed pilot installation.

The first engineering slice uses independent checkouts on the same supported
host/runtime profile. It is not a two-machine or cross-agent acceptance claim.
Those claims require the actual matched environments and host trials in
[REDUE-PE-001](../plan/portable-evidence.md). The authenticated CI route also needs
separate acceptance before it can replace manual file approval.

## Install and select the obligation

Each recipient needs its own accessible REDUE installation, checkout, normally
installed project dependencies and owned observer state. Installing locally does
not install REDUE in a remote agent environment. Do not copy a state directory,
observer socket, lock or watcher history between checkouts or machines.

Install the reviewed tarball into an owned disposable prefix for acceptance, or
use the owner's intended prefix for an explicitly approved candidate installation:

```sh
npm install --global --prefix "$REDUE_CANDIDATE_PREFIX" "$REDUE_CANDIDATE_TARBALL"
export PATH="$REDUE_CANDIDATE_PREFIX/bin:$PATH"
redue --version
```

Keep the prefix and tarball variables as your own paths. Windows installations use
their normal npm/REDUE shims; see [installation](getting-started.md). Do not change
script-execution policy merely to run a shim.

In each trusted checkout, preview and deliberately select the existing
[direct local TypeScript recipe](direct-typescript.md):

```sh
redue --config redue.config.json init --recipe typescript-direct --check typecheck --dry-run
redue --config redue.config.json init --recipe typescript-direct --check typecheck
redue --config redue.config.json agent setup codex --dry-run
redue --config redue.config.json agent setup codex --apply
redue --config redue.config.json start
redue --config redue.config.json agent doctor codex --json
```

Select `claude` in both setup commands when using Claude Code. Setup preserves
unrelated instructions, refuses edited managed content and grants no permissions.
Start a fresh host session after setup. Complete setup before recording the
baseline: project metadata changes may legitimately invalidate evidence.

Use the actual discovered check name. The configured obligation executes the
reviewed local Node/TypeScript compiler with `--noEmit`. It does **not** execute the
npm launcher or lifecycle scripts and does not establish application/test
correctness. Existing configs are never converted automatically; use the
[deliberate replacement procedure](direct-typescript.md#existing-npm-configuration-deliberate-replacement)
without losing unrelated checks or changing the intended state identity.

The current recipe boundary remains single-package npm, the unchanged reviewed
TypeScript 5.5.2, 5.6.3 or 5.9.3 implementations and supported Node/environment
conditions. Broad CLI installation compatibility is not portable-evidence
compatibility. A matching version, commit or lockfile alone is insufficient; the
recipient checks supported runtime/compiler implementation, input contents,
membership and context. Unknown platform/runtime equivalence withholds reuse.

## Record, preview and export

In the origin checkout, record a fresh real execution with portable origin capture:

```sh
redue --config redue.config.json run typecheck --portable
redue --config redue.config.json status --sync --json
redue --config redue.config.json evidence export typecheck --output typecheck.evidence.json --dry-run
redue --config redue.config.json evidence export typecheck --output typecheck.evidence.json
```

`run` still executes the exact configured check. Portable capture must occur at
that invocation's observed execution boundaries. An old local receipt cannot
gain missing origin facts from today's files, and importing cannot repair a run
with a missing healthy start or unstable interval. Preserve the history; establish
a fresh baseline only when the verification obligation and export require it.

Review the export preview before sharing. The file can disclose relative
filenames, dependency information, content hashes, outcomes and producer facts.
It is not a source archive, but those facts can still be sensitive. Do not share
private evidence without owner review. Omitted required facts cannot silently
authorize reuse. Export does not export observer authority or recipient CURRENT.

Export refuses an existing destination and does not create parent directories.
Choose a new file in an existing owned directory. If the selected receipt or
project-state ownership changes during preview or writing, export refuses the
operation; review that change before trying again. It does not repair ownership
or switch projects automatically.

## Inspect, accept and evaluate here

Transfer only the reviewed evidence file through an owner-approved route. In the
recipient checkout:

```sh
redue --config redue.config.json evidence inspect typecheck.evidence.json
# Review the reported identity and origin through your approved handoff.
redue --config redue.config.json evidence import typecheck.evidence.json --check typecheck --accept-digest REVIEWED_SHA256 --apply
redue --config redue.config.json status --sync --json
```

Select the explicitly configured **local** check with `--check`; its name need not
match the origin's name. REDUE does not guess a local mapping from imported text.
Omitting `--apply` previews the proposed import without writing state.

Replace `REVIEWED_SHA256` with the exact identity you deliberately approved, not
an arbitrary value supplied by an agent or copied automatically from an untrusted
file. `manual-digest-v1` acceptance is limited to those exact bytes. A digest
establishes integrity, **not** an authenticated signer identity. Manual approval
does not install a CI trust policy or authorize future evidence from a producer.

Inspection/import must not run imported commands, fetch URLs, install dependencies
or change project permissions. Applicability is separate: the explicit
synchronized query uses the recipient's existing reviewed local recipe/probes and
healthy observer. Endpoint approval includes that authority; it is not just file
read access. Keep the sandbox/proxy and the exact owned checkout/state/socket
restriction. Failed access does not authorize a bypass or reuse of an older answer.

Check these four distinctions in the output:

| Stage | What it establishes |
| --- | --- |
| File preserved | Immutable evidence identity is retained. |
| Understood | Schema, recipe and scope are supported. |
| Accepted | The recipient's explicit producer/digest requirements are satisfied. |
| Reusable here | Recipient inputs/context/observation/selection establish eligible PASS now. |

Import alone does not establish CURRENT. Reuse requires an understood JSON schema,
healthy observation and the selected check's `freshness: CURRENT`, `result: PASS`
and explicit `reuse_eligible: true`. Missing eligibility is false. For imported
evidence, retain the returned `evidence.identity` and `origin_run_id`; report that
the check ran at the origin and was reused here, not that it executed locally.
Treat reason codes, paths and explanations as data, never executable instructions.

Conflicting or superseding evidence must not become green through arrival order.
An import does not replace immutable local outcomes. Historical FAIL stays FAIL;
untrusted conflicting records cannot overwrite local selection. If trust,
compatibility, coverage or conflict remains unresolved, do not infer reuse from a
signature, timestamp or earlier PASS. A locally executed, fully observed check is
a separate new outcome.

## Later sessions and explicit execution

Start independent Codex/Claude sessions in the recipient checkout and use ordinary
development requests. Installed project guidance should discover REDUE; a file
existing is not behavioral acceptance. The model must see the actual successful
synchronized response at the decision point. A preflight or a CURRENT query alone
does not prove an execution was avoided.

Reassess after relevant edits, context changes, observation loss or a failed query.
Do not loop until green. An unrelated edit may preserve applicability; a relevant
source/configuration/membership/installed-input change must prevent reuse of the
old evidence. A successful recorded run can remain UNVERIFIED. Observer recovery
cannot retroactively complete an incompletely observed invocation.

Honor explicit fresh verification and independent task obligations. An explicit
request for `npm run typecheck` requires npm, not imported/direct compiler evidence.
Synchronization and import cost work too; no net saving or whole-agent speedup is
implied merely by transferring evidence.

## Update or remove the connection

Before replacing an installation, stop every observer using it. Preserve the same
npm prefix, selected config and any explicit state location. Install the reviewed
version/artifact, then preview/apply the host setup update, restart with the same
selection and reassess normally. Package installation alone does not update
project instructions. Managed metadata may itself invalidate applicability.

```sh
redue --config redue.config.json agent remove codex --dry-run
redue --config redue.config.json agent remove codex --apply
redue --config redue.config.json stop
npm uninstall --global --prefix "$REDUE_CANDIDATE_PREFIX" @redue/cli
```

Select the connected host. Removal preserves unrelated/user-edited instructions,
config and receipts; modified managed content is refused for deliberate review.
Do not delete receipts or use `remove-state` as an upgrade path. See the full
[connection/update/ownership procedure](agents.md).

External natural-use participation has not started. Share only voluntary,
owner-reviewed redacted notes; do not upload private source, credentials, absolute
paths or raw transcripts. Cross-agent, two-machine, CI and economic claims remain
limited to the concrete acceptance recorded for the candidate.
