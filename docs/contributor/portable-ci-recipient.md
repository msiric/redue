# Explicit CI recipient acceptance

This is a **queued G3 procedure**, not authenticated CI acceptance evidence.
Signing authority and the exact producer policy require owner review. Controlled
response tests do not authenticate a workflow, and this procedure launches no
agent models. The installed recipient independently establishes applicability;
a signature or producer PASS does not establish CURRENT.

Use the already approved matched macOS/Node/direct-TypeScript profile and an
independently installed, reviewed candidate. Package checksum and installation
acceptance remain separate gates. The helper below binds the installed CLI entry
file but does not authenticate the entire installation, Node runtime, native
loader, or verifier execution environment. The reviewed native GitHub CLI 2.79.0
installation must run in the owner-approved trusted host context.

## Prerequisites

1. Obtain the **explicitly selected** artifact from the approved repository,
   workflow run and attempt. Record source and signer commits, artifact identity,
   exact exported-file SHA-256, canonical envelope digest and interpretation.
   Do not infer approval from a branch name, artifact filename or remote metadata.
   Keep the bounded evidence file and, only for an approved offline policy, the
   exact attestation bundle. Do not transfer source, state, receipts, credentials,
   observer authority or environment dumps.
2. Initialize the intended disposable recipient checkout using the installed
   candidate's explicit direct compiler recipe. Resolve the selected config,
   dedicated state and one observer endpoint through the existing onboarding
   procedure. Start the observer only under its approved local authority. This
   acceptance helper requires **no local runs and no previous imports** so its
   trace cannot mistake local execution or an older import for CI handoff. Never
   delete history to satisfy that requirement: use a separately approved fresh
   disposable acceptance state. Ordinary user imports remain the existing CLI.
3. The owner separately provisions and reviews the existing, fixed
   `portable-producers-v1.json` in that owned state directory. Its selected policy
   binds issuer, immutable repository/owner IDs, workflow/ref, source/signer
   commits, outer SHA-256, inner digest, interpretation and refresh policy. The
   registry must satisfy the reader's ownership, permissions and path guards.
   **Neither this helper nor an artifact creates, replaces or approves a policy.**
   See [producer policy preparation](portable-ci-producer.md). A missing, changed,
   malformed or unapproved policy is a failed prerequisite, never implicit trust.
4. Resolve canonical absolute paths for the installed CLI entry and reviewed
   native `gh` executable, with separately owner-approved SHA-256 identities.
   Preserve the intended Node, caller environment, sandbox, proxy and exact
   resource allowance. Do not copy another experiment's permission entry or
   widen access when a diagnostic fails.

## Read-only preview and explicit application

Run the helper from the reviewed source tree with the candidate's supported Node.
The following placeholders describe owner-selected values, not artifact-provided
arguments. Every path must be an absolute, unaliased local path.

```sh
node test/acceptance/portable-ci-recipient.mjs \
  --cli-entry /approved/prefix/lib/node_modules/@redue/cli/bin/redue.mjs \
  --cli-sha256 REVIEWED_CLI_ENTRY_SHA256 \
  --config /approved/checkout/redue.config.json \
  --root /approved/checkout \
  --state /approved/redue-recipient-state \
  --artifact /approved/transfer/redue-portable-evidence.json \
  --policy-digest OWNER_SELECTED_POLICY_SHA256 \
  --source REVIEWED_SOURCE_COMMIT \
  --signer REVIEWED_SIGNER_COMMIT \
  --gh-executable /approved/native/gh \
  --gh-sha256 REVIEWED_GH_SHA256
```

Without `--apply`, the helper performs bounded local reads only: **zero CLI,
verifier or model processes**, no policy writes and no acceptance claim. It checks
the existing policy, artifact meaning/bytes, source/signer identity and recipient
ownership/history. It checks the verifier path but does not run or authenticate
the verifier; the applied CLI checks the selected binary's complete bytes.

After reviewing that preview, repeat the exact command with `--apply`. For an
explicit `offline-identified` policy also supply `--bundle /approved/bundle`;
that mode requires its exact approved digest and never claims online freshness
or unseen-latest evidence. A required online-refresh policy rejects a bundle.

The applied sequence is fixed:

1. One recipient `status --sync --json` must establish healthy observation and
   the configured direct recipe before authentication. This can run the existing
   approved built-in probes; it is not merely a file read.
2. Preview the existing CI import CLI. Recheck all local preconditions and policy
   currency before explicit application.
3. Import with `--ci-policy-digest`, `--gh-executable`, `--gh-sha256` and `--apply`.
   Authentication can use network access only as already approved; the verifier
   must check real signatures and exact certificate/statement bindings. No
   manual-digest fallback is used if authentication fails.
4. Query recipient `status --sync --json` again. Require schema 1, healthy
   observation, CURRENT/PASS/reuse eligibility, imported provenance, the exact
   accepted envelope digest and origin run ID, and a null local invocation.
   Confirm that no local receipt or run was created.

The report retains command counts/timing and static failure classifications,
without stdout transcripts, paths or raw environment values. It makes no
globally-latest or application/npm-lifecycle correctness claim. Signed outer
bytes, canonical meaning and normalized stored bytes are distinct identities.
The helper itself never calls `run`: the absence of equivalent compiler execution
is scoped to this captured procedure, not an unobserved ambient process or a
model's behavior. Fresh-session agent reuse still requires its separate fail-closed
preflight and actual tool/receipt traces.

Policy removal or unsupported currency must withhold authority without hiding an
accepted FAIL or resurrecting an older PASS. Do not repair a failure by deleting
receipts, policy history or selector state. Stop at the static diagnostic and
record the minimal owner action.

## Controlled regression

```sh
node --test test/portable-ci-recipient.test.mjs
```

The tests inject controlled CLI responses; they prove prerequisite gating and
procedure shape, **not** live signature acceptance, two-machine compatibility,
cross-agent reuse or saved verification work. Missing/unsafe policy and identity
failures launch no CLI, verifier or model process. No producer workflow is enabled
or dispatched by these materials.

## Disabled standard-runner route

The [disabled recipient proposal](portable-ci-recipient-workflow.yml) selects the
completed signer run `38096670987`, attempt `1`, source/signer
`d04b872ee0e848e300c0cc9738ad761e48146acc`, and authenticated-artifact ID
`11685889769`. Its hashes describe inspected bytes, **not approved producer
trust**. The job is disabled and its owner-policy placeholders fail before
checkout, download, verifier or model. It is outside `.github/workflows`.

A separately reviewed enabling diff and explicit owner approval must provide
current registry bytes/policy, fixed-copy provisioning into initialized owned
state and the independent recipient preparation. The proposal deliberately
stops at this missing prerequisite rather than create trust from artifact data.
The optional dedicated push branch avoids default-branch-only dispatch and does
not modify or retrigger the approved signer branch. Do not create/push that branch
or enable the proposal merely because the signed artifact exists.

The pinned native GitHub CLI archive and regular executable digests come from the
official 2.79.0 arm64 distribution and published checksums, read without executing
it. HTTPS/published checksum verification is not independent PGP verification;
actual trusted host execution and live signature verification remain required.
The selected producer used the controlled `noLib` fixture; successful matching
profiles are not cross-agent adoption or general default-library compatibility.

The [exact producer policy proposal](portable-ci-producer-policy-proposal.json)
is review data only, deliberately not a `portable-producers-v1.json` registry.
It requires online refresh (`required`); the inspected bundle is not an offline
substitute. One actual live signature inspection matched these bindings but did
not accept a producer or establish local policy currency or recipient CURRENT.
The owner must separately approve the selected policy, authoritative registry
bytes and any recipient provisioning route. No model credentials, two-agent
behavior or automatic CI trust is supplied by this proposal.
