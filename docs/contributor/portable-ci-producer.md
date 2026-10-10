# Portable CI producer: preparation and remaining gate

This is preparation for REDUE-PE-001 G3, **not completed CI acceptance**. No
producer workflow has been enabled, no signing authority has been provisioned,
and no authenticated artifact has demonstrated recipient reuse. The initial
relocation implementation also remains restricted to the same host/boot; that
restriction must not be presented as CI-to-machine compatibility.

The proposed route uses an existing GitHub Actions artifact and Sigstore
attestation. The inner REDUE envelope binds its canonical meaning; the outer
attestation binds the **exact exported file bytes**. Neither identity establishes
CURRENT. Recipient observation, input discovery, compatibility, conflicts and
explicit producer acceptance remain independent requirements.

## Explicit verifier preparation

`src/portable-ci-trust.mjs` exposes `verifyCIArtifact` for an explicit read-only
operation. It is not called by status or import. It does not create trust policy,
accept an import, run the configured check or change state. The executable is a
locally selected, reviewed GitHub CLI installation, never an artifact field. The
caller must provide `ghExecutableSha256` from the owner-approved installation; the
helper does not derive an approved digest from imported data. Both version and
exact binary bytes are checked before and after verification. Digest/version
matching binds the selected implementation but does not prove that implementation
sound: reviewed distribution provenance remains a prerequisite. The verifier must
also run in the locally approved trusted host context. Native loader/preload or
other execution-altering injection is not authenticated by the binary checksum;
that context must not be supplied or altered by producer artifacts. This helper
does not validate a general native-loader profile or approve such injection. Artifact, bundle
and verifier reads reject symlink ancestors, final symlinks and hardlinks, use
bounded descriptor reads and compare parent/file identity across each read.
These are read-only path guards, not ownership of an imported producer or authority
to initialize or alter REDUE state.

The locally reviewed policy binds these fields:

```json
{
  "schema": 1,
  "interpretation": "redue-github-ci-trust@1",
  "issuer": "https://token.actions.githubusercontent.com",
  "repository": "msiric/redue",
  "repositoryId": "1403689333",
  "ownerId": "26199969",
  "workflow": ".github/workflows/portable-evidence.yml",
  "ref": "refs/heads/main",
  "sourceCommit": "<reviewed 40-character source commit>",
  "signerCommit": "<reviewed 40-character workflow commit>",
  "artifactSha256": "<exact file SHA-256>",
  "evidenceDigest": "<inner canonical evidence digest>",
  "evidenceInterpretation": "redue-portable-direct-typescript@1",
  "refresh": "required",
  "bundleSha256": null
}
```

This illustrative policy is deliberately incomplete and cannot verify an
artifact. An imported file or agent suggestion cannot approve or replace it.
Repository identifiers above were read from the public GitHub API during
implementation; they are not a new owner trust approval.

The helper supports the reviewed GitHub CLI **2.79.0** output contract. It invokes
`gh attestation verify --format json` with exact certificate identity, issuer,
repository, source ref/digest, signer digest, custom predicate type and denial of
self-hosted runners. It does not combine the mutually exclusive
`--cert-identity` and `--signer-workflow` flags. It validates authenticated
certificate fields again with strict equality, rejects fork/pull-request
contexts, checks the outer subject and inner digest, and verifies that both
artifact and any offline bundle remained unchanged. Process/output limits are
30 seconds and 1 MiB; local verifier bytes are bounded to 128 MiB. Every returned
verified statement must match the same selected policy, outer artifact and inner
digest. One valid statement cannot hide a mismatching second statement. Repeated
matching attestations are not independent producer-order or latest evidence.
Unknown output and policy interpretations fail closed.

Success reports `producer_verified: true` but **`producer_accepted: false` and
`reuse_eligible: false`**. Local acceptance and recipient applicability have not
been performed. `local_policy_current: false` records that this helper has not queried
the authoritative local policy registry. A successful report cannot establish that
a previously passed policy still exists or remains approved. Test fixtures replace the verifier process with controlled
output; they are schema/negative tests, not signatures or real CI evidence.

## Proposed producer sequence

After owner approval of resources, disclosure and signer policy:

1. Execute the exact reviewed recipe in an approved matched CI profile with a
   healthy origin observation. A job badge, restored cache or generic report
   cannot replace that invocation. Export the completed immutable origin facts.
2. Inspect the export for sensitive filenames, dependency information and hashes.
   Public-repository attestations use public-good Sigstore; do not send private
   manifests or contents to a transparency service without explicit review.
3. Save exact bytes as `redue-portable-evidence.json`. Prepare an outer custom
   predicate with only `schema: 1`, `evidenceDigest` and
   `evidenceInterpretation`, using type
   `https://redue.dev/attestation/portable-evidence-artifact/v1`.
4. Use a reviewed commit-pinned `actions/attest` action to attest those file
   bytes and upload the file plus verification bundle through the approved
   artifact route. Grant only the reviewed job's required signing permissions.
   No fork-controlled code or arbitrary caller command may enter that privilege.
5. Retrieve explicitly, inspect, authenticate against the local approved policy,
   accept within its scope, then ask the recipient engine to evaluate locally.

A signature authenticates the accepted workflow's assertion. It does not prove
that a compromised accepted workflow recorded the correct obligation. Protecting
the workflow and checking actual origin completeness remain required.

## Offline limits and revocation

The default `required` mode requires the explicit online GitHub verification
operation to succeed; failure grants no acceptance. This is not proof of a global
latest record, and the helper does not bypass GitHub/Sigstore's own trusted-root
cache rules. Owner policy refresh/revocation handling must be integrated and
reviewed before G3 can pass. An online attestation lookup refreshes authentication
evidence, not the recipient's local approval policy. A previous successful report
never authorizes reuse after a policy has been removed or narrowed.

Only an explicit `offline-identified` policy accepts a local `.json` bundle for
verification, with its exact SHA-256 bound in the policy. It reports that producer-policy
revocation and newer evidence were not queried. The `--bundle` route avoids the
GitHub attestation lookup but is not a promise of network-free verification:
pinned gh still constructs its Sigstore trusted-root/TUF verifier, whose cache
refresh may need network. Failure there grants no acceptance; do not change
network rules or substitute a custom trust root to force offline success. Unknown modes and missing bundles
are rejected. Neither mode uses age as an input-applicability shortcut.

## Required recipient policy interface

The integration owner must supply the current locally approved policy and its
owned revision, separate from producer artifacts. Authentication is explicit;
ordinary status does not fetch a policy or attestations over the network. Before
acceptance, read that policy authoritatively, verify its revision after the
bounded authentication operation, and bind the accepted artifact to both the
policy digest and the reviewed verifier identity. Removal, narrowing, unknown
policy version or a later revision mismatch must withdraw that policy's authority
at recipient publication. Do not retain a successful report as a permanent trust
certificate. Re-accepting under a changed policy requires an explicit owner action.

The current helper has no policy registry, revocation writer, or import acceptance
branch. Its report never returns `producer_accepted: true`. How the recipient
stores approvals and invalidates them on local policy changes is an outstanding
reviewed interface decision, not functionality provided by this preparation.
A removed policy is not equivalent to an offline policy. Offline identification
still requires a current, explicitly approved digest-bound policy and never
asserts unseen revocation status.

## Queued public runner and artifact route

The owner has approved standard public runners, including two independent
`macos-26` jobs. GitHub documents those arm64 runners as fresh VMs for public jobs;
the label is not a fixed runtime identity. The first prospective route is two
separate jobs on that label, pinned Node and reviewed TypeScript, with actual
runtime/loaded-library profile comparison before any producer or recipient
qualification. Today's same-host/boot prototype cannot establish cross-job or
CI-to-owner reuse. This route must remain queued until that profile is reviewed;
no rule may omit a mismatching boot identity merely to make CI green.

The proposed producer is one owner-reviewed workflow on its approved main ref,
triggered only by protected push or deliberate dispatch. It must not accept an
arbitrary checkout ref, shell command, recipe or signing input from a caller.
All actions are reviewed and pinned to full commits before enabling it. The
producer runs the actual configured direct compiler with a healthy start/end
boundary, then exports fixed `redue-portable-evidence.json` bytes. An outer custom
predicate binds only the inner interpretation/digest. A separate reviewed signing
step uses `actions/attest` with explicit `subject-path`, `predicate-path` and
`predicate-type`; its `bundle-path` output identifies the exact bundle to retain.
Grant only `contents: read`, `id-token: write` and `attestations: write` to the
reviewed signer job; no package, repository-write, private registry or account
permissions. Code/dependency execution in a signing job still has access to its
job permission context, so this requires explicit workflow/producer trust review.

Use the existing Actions artifact route with a fixed run/attempt-qualified name,
`if-no-files-found: error`, no overwrite, an explicit owner-approved short
retention, and exact filenames for the evidence, bundle and checksum manifest.
Download the selected workflow run/artifact explicitly through authenticated
GitHub access; resolve artifact ID/run/attempt/source commit rather than selecting
an artifact by an ambiguous display name. The upload archive's artifact digest
is distinct from the attested inner file checksum; unpack safely into a disposable
directory, then verify the exact evidence bytes. No imported URL is followed by
REDUE. Do not upload state directories, receipts catalogs, credentials, source
contents, or raw tool/model transcripts. The checksum manifest is a convenience,
not a substitute for issuer/signer verification or recipient applicability.

Storage/retention allowance and final signer policy are still unconfirmed. This
is a route proposal, not an enabled workflow or a live authenticated acceptance.

## Primary implementation references

- [GitHub CLI 2.79.0 flags and output](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verify/verify.go).
- [Pinned verifier/trusted-root initialization](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verification/sigstore.go).
- [Pinned certificate-extension enforcement](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verification/extensions.go).
- [Sigstore-go 1.1.0 verification output](https://github.com/sigstore/sigstore-go/blob/v1.1.0/pkg/verify/signed_entity.go)
  and [certificate summary](https://github.com/sigstore/sigstore-go/blob/v1.1.0/pkg/fulcio/certificate/summarize.go).
- [Standard GitHub-hosted public runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
- [Attest action v4 inputs/outputs](https://github.com/actions/attest/blob/v4/action.yml)
  and [artifact upload v4 contract](https://github.com/actions/upload-artifact/blob/v4/action.yml).
- [Custom GitHub attestations](https://github.com/actions/attest) and
  [identity/issuer verification](https://docs.sigstore.dev/cosign/verifying/verify/).

## Explicit local acceptance preparation

The integration selects `portable-producers-v1.json` under the already-owned
recipient state; neither evidence nor verifier output supplies a policy path.
`authorizeCIImport` requires the privately minted, current snapshot for that exact
registry and an explicitly selected policy digest. It invokes authentication only
when deliberately called, then returns a process-local token with no recipient
eligibility. JSON copies cannot mint a token. The token binds the recipient
configuration/root/state, canonical evidence identity, exact authenticated outer
artifact bytes, verifier identity and policy snapshot. It is not persisted.

An explicit applied import can store acceptance `github-ci-v1` with a strict
descriptive binding of policy revision/content/digest and authenticated evidence,
artifact and verifier digests. No policy or absolute policy path is embedded in
the evidence or persisted acceptance. The store canonicalizes the immutable
envelope meaning; its stored encoding need not equal the original signed encoding.
The original attestation subject digest remains honest provenance for the raw
bytes authenticated at explicit acceptance, not a claim about that normalization.

The store revalidates authoritative policy under its existing run lock before and
after durable selector persistence. Failure after persistence leaves the complete
pending transaction, withholding catalog authority; it cannot silently discard
an accepted FAIL. Recovery requires the exact intended transaction and renewed
current authorization where needed. Ordinary repetition preserves prior accepted
manual/CI methods. Changing between those methods is refused, rather than silently
downgrading CI provenance to escape revocation. Manual digest acceptance remains
the separate legacy path; no CI authorization is inferred from imported JSON.

Every recipient decision/publication still needs independent current-policy
validation of all previously accepted CI records. A missing, changed or unreadable
policy cannot be treated as an absent untrusted record to expose an older green
selection. Stored `ciBinding` is not a trust certificate. Owner-policy mutation,
revocation and signature authentication remain distinct from compiler applicability.
POSIX current-user ownership is required by this initial policy path; native
Windows CI acceptance is not claimed where that ownership cannot be established.

Run `node --test test/portable-ci-trust.test.mjs test/portable-ci-authorization.test.mjs`
for controlled tests. Live producer signing, second-machine authenticated
acceptance and final privacy/independent review remain separate evidence gates.
