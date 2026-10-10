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
locally selected, reviewed GitHub CLI installation, never an artifact field.

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
30 seconds and 1 MiB. Unknown output and policy interpretations fail closed.

Success reports `producer_verified: true` but **`producer_accepted: false` and
`reuse_eligible: false`**. Local acceptance and recipient applicability have not
been performed. Test fixtures replace the verifier process with controlled
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
reviewed before G3 can pass.

Only an explicit `offline-identified` policy accepts a local `.json` bundle for
verification, with its exact SHA-256 bound in the policy. It reports that remote
revocation and newer evidence were not queried. Unknown modes and missing bundles
are rejected. Neither mode uses age as an input-applicability shortcut.

## Primary implementation references

- [GitHub CLI 2.79.0 flags and output](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verify/verify.go).
- [Pinned certificate-extension enforcement](https://github.com/cli/cli/blob/v2.79.0/pkg/cmd/attestation/verification/extensions.go).
- [Sigstore-go 1.1.0 verification output](https://github.com/sigstore/sigstore-go/blob/v1.1.0/pkg/verify/signed_entity.go)
  and [certificate summary](https://github.com/sigstore/sigstore-go/blob/v1.1.0/pkg/fulcio/certificate/summarize.go).
- [Custom GitHub attestations](https://github.com/actions/attest) and
  [identity/issuer verification](https://docs.sigstore.dev/cosign/verifying/verify/).

Run `node --test test/portable-ci-trust.test.mjs` for the controlled verifier
tests. Live producer signing, receipt-preserving trust integration, second-machine
acceptance and final privacy/independent review remain separate evidence gates.
