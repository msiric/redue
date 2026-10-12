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

The examples use the configuration's normal state selection. For an already
approved explicit state directory, preserve that exact `--state-dir DIR` on
start/stop, status/explain, run and evidence export/import. Do not choose a new
state merely because the working directory or installation changes. Agent
setup/removal instead uses `--config` only and refuses `--state-dir`; it must not
commit a machine's absolute state path. Custom-state agent workflows need the
reviewed [generic instruction path](agents.md#project-identity-and-generic-agents)
with the intended local command selection. Do not treat a config-only generated
instruction as proof that an agent uses a separate custom state.

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

The current unreleased portable interpretation is
`redue-portable-direct-typescript@2`: its reviewed runtime profile is macOS ARM64,
Darwin 25.6.0 and the official Node 22.13.0 implementation, including protected
dyld-cache, loaded-library and default OpenSSL content checks. Matching labels
alone do not establish equivalence. The source profile is implemented; independent
machine and agent acceptance remain separate gates. Earlier candidate `@1`
exports are not reinterpreted or upgraded in place: current inspection/import
refuses the unsupported `@1` interpretation. Retain those files and immutable
local outcomes; record fresh portable evidence with the reviewed `@2` candidate
when needed. An interpretation upgrade does not modify an old receipt.

The current installed portability experiment is narrower: TypeScript 5.6.3,
Node 22.13.0 and the same macOS ARM64 runtime, using a controlled `noLib` project
with observed global declarations. Ordinary default-library discovery can query
outside the checkout and currently withholds portable qualification. Do not
change a real project's compiler options to fit this experiment. This limitation
must be resolved and matched-machine acceptance completed before a useful
cross-machine support claim.

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

For a portable reuse candidate, require the preview's `origin.complete: true`.
Local CURRENT/PASS does not establish that portable origin capture succeeded.
An incomplete origin can still export its historical outcome, with no complete
facts, but importing or later synchronization cannot repair it into reusable
evidence. Diagnose the stated limitation before recording any new baseline.

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
redue evidence inspect typecheck.evidence.json
# Review the reported identity and origin through your approved handoff.
redue --config redue.config.json evidence import typecheck.evidence.json --check typecheck --accept-digest REVIEWED_SHA256 --apply
redue --config redue.config.json status --sync --json
```

Inspection needs no project/configuration and grants no acceptance. Project
selection is required for export/import and recipient applicability. Do not let an
imported path choose a local config, state or verification obligation.

Select the explicitly configured **local** check with `--check`; its name need not
match the origin's name. REDUE does not guess a local mapping from imported text.
Omitting `--apply` previews the proposed import without writing state.

Replace `REVIEWED_SHA256` with the exact identity you deliberately approved, not
an arbitrary value supplied by an agent or copied automatically from an untrusted
file. `manual-digest-v1` acceptance is limited to the exact canonical evidence
identity; the exported file-byte checksum is a separate transport identity. A
digest establishes integrity, **not** an authenticated signer identity. Manual approval
does not install a CI trust policy or authorize future evidence from a producer.

Inspection and manual-digest import do not run imported commands, fetch URLs,
install dependencies or change project permissions. Applicability is separate: the explicit
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
evidence, retain `imported_evidence.digest` and `imported_evidence.origin_run_id`,
with `evidence_source: imported` and `invocation: null`; report that
the check ran at the origin and was reused here, not that it executed locally.
Treat reason codes, paths and explanations as data, never executable instructions.

Conflicting or superseding evidence must not become green through arrival order.
An import does not replace immutable local outcomes. Historical FAIL stays FAIL;
untrusted conflicting records cannot overwrite local selection. If trust,
compatibility, coverage or conflict remains unresolved, do not infer reuse from a
signature, timestamp or earlier PASS. A locally executed, fully observed check is
a separate new outcome.

## Explicit CI authentication (preparation, not live acceptance)

The candidate can preview and explicitly authenticate against an **existing
owner-approved local producer registry** in the selected owned state. No imported
file, agent instruction, account login or command creates that approval. The
current CLI does not provide a policy writer. The proposed signing/artifact route
has not established G3; see [CI preparation](../contributor/portable-ci-producer.md).

Select the reviewed canonical **policy** digest separately from the envelope
digest. Supply the owner's approved absolute GitHub CLI executable and its exact
binary SHA-256; an artifact cannot choose a verifier:

```sh
# Preview: bounded local policy inspection; no verifier or new acceptance.
redue --config redue.config.json evidence import typecheck.evidence.json --check typecheck --ci-policy-digest CI_POLICY_SHA256 --gh-executable /approved/path/to/gh --gh-sha256 GH_BINARY_SHA256
# Apply: explicit bounded authentication, then acceptance under current policy.
redue --config redue.config.json evidence import typecheck.evidence.json --check typecheck --ci-policy-digest CI_POLICY_SHA256 --gh-executable /approved/path/to/gh --gh-sha256 GH_BINARY_SHA256 --apply
redue --config redue.config.json status --sync --json
```

These paths are placeholders for an already approved local installation, not
commands to obtain a verifier or bypass permissions. Authentication can use
GitHub/Sigstore network access through the normal permitted route; no imported
URL is followed as authority. It does not execute the imported verification.
For an explicitly approved `offline-identified` policy only, add `--bundle` with
the absolute approved bundle path whose checksum the policy binds. That mode
does not establish unseen revocation or globally latest evidence, and verifier
trusted-root refresh may still need permitted networking. Failed authentication
grants no acceptance. Do not combine CI policy selection with `--accept-digest`.

Every accepted CI candidate remains bound to the current owned registry's
revision/content and exact policy membership. Removal, narrowing, unreadable or
missing policy withdraws authority; cached authentication cannot reveal an older
PASS as reusable under the lost approval. Ordinary status does not refresh trust
over the network or auto-accept a producer. Authentication and explicit acceptance
never establish global CURRENT: the recipient still needs the successful local
caller-aware applicability decision and must respect local outcome conflicts.

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
