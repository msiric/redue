# Portable CI signing design — owner review required

This is the proposed REDUE-PE-001 G3 signing route, checked on 2026-10-11.
**It is not enabled or accepted.** It adds no workflow, OIDC permission, account
setting or local producer policy. [Verifier preparation](portable-ci-producer.md)
describes the existing authentication helper; a controlled verifier test is not
live authenticated evidence or recipient CURRENT.

The owner has approved standard public runners and at most **10 MiB of included
artifact storage with one-day retention** for this route. Extra spending is not
approved. The matched runtime profile, concrete signer/source commits, disclosure
and recipient policy still require review before execution or acceptance.

## Fixed scope and registration

Use `msiric/redue`, proposed workflow `.github/workflows/portable-evidence.yml`,
a `push` trigger restricted to `dev/portable-evidence`, with no input parameters.
Its first operation must require public repository identity, the exact task ref
`refs/heads/dev/portable-evidence` and the push event. Reject other refs/events
before producer execution or signing. Checkout the exact event source commit,
not a subsequently moving branch tip. No fork, pull request, arbitrary checkout ref, command, URL, recipe or
artifact path is an accepted input. This is an experimental producer, not generally trusted branch output. The
recipient policy accepts only explicitly reviewed source/signer commits and
digests; later commits do not match that approval. A successful run is not
authority to accept its output locally.

The fixed task-branch push route avoids manual-dispatch registration on the
default branch. No main merge is required or approved. Signing must remain
disabled until owner review of the exact workflow, job permissions and producer
trust policy; adding an active file and pushing it would enable execution. A
future manual-dispatch option would require default-branch registration under
[GitHub's manual-dispatch rules](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
and is outside this proposal.

## Two job boundaries

**Producer:** a fresh approved GitHub-hosted macOS VM; job permissions only
`contents: read`. Checkout exactly the reviewed source, without persistent Git
credentials. Install only the reviewed locked dependencies/runtime using normal
settings. Execute the fixed direct compiler recipe through REDUE with real healthy
starting/ending observation, then export completed immutable portable facts as
`redue-portable-evidence.json`. No synthetic receipt or copied observer state.
Use the final reviewed interpretation, not a hard-coded obsolete sample value.

Validate completeness and inspect the public disclosure: filenames, dependency
identities, hashes and origin facts. Create only the minimal predicate
`{schema: 1, evidenceDigest, evidenceInterpretation}` and a checksum manifest.
Upload these fixed files, no globbed project tree. The producer has neither OIDC
nor attestation-write permissions. Its artifact ID, exact file SHA-256, canonical
evidence digest and reviewed source commit are outputs, not an arbitrary command
channel.

**Signer:** a separate fresh job, `needs: producer`, only after producer success.
Its complete token permissions are `contents: read`, `id-token: write` and
`attestations: write`. No `artifact-metadata`, package, repository-write or account
permission. Download only the producer's numeric artifact ID from the same
workflow run and attempt into an empty disposable directory. Do not accept an
external run, URL or display-name lookup.

Do not checkout the repository, install dependencies or execute repository,
lifecycle or downloaded code in this job. A small reviewed inline validator in
the fixed workflow may inspect bounded regular data files, exact filenames and
predicate fields, compare digests, and refuse extra files, links or incomplete
origin facts. It must not evaluate JSON as code, interpolate file values into
shell text, or load producer-supplied modules. This validation is not a second
compiler execution or proof that the accepted producer is sound.

Attest exactly one explicit `subject-path` ending in
`redue-portable-evidence.json`, with the fixed predicate file and
`https://redue.dev/attestation/portable-evidence-artifact/v1` predicate type.
Set `push-to-registry: false` and `create-storage-record: false`; do not use
implicit subject discovery. The reviewed action enters storage-record creation
only in its registry-push branch, so this fixed-file route does not request
artifact-metadata authority. Preserve its exact `bundle-path` output. See the
[pinned input contract](https://github.com/actions/attest/blob/1e69f48acb82d1966a394da916b4c1698aa569d6/action.yml),
[subject selection](https://github.com/actions/attest/blob/1e69f48acb82d1966a394da916b4c1698aa569d6/src/subject.ts)
and [signing/storage branch](https://github.com/actions/attest/blob/1e69f48acb82d1966a394da916b4c1698aa569d6/src/attest.ts).

Upload only the exact evidence, its bundle and checksum/identity manifest as the
final artifact. A signature authenticates this reviewed workflow's assertion;
it does not prove compiler input completeness or protect against an accepted
compromised producer. Signing-job separation limits which code has signing
credentials; it does not make producer assertions automatically trustworthy.

## Action pins and artifact limits

The following official tag resolutions were read on 2026-10-11. Use full commit
pins, not moving tags. Before enabling, review the concrete workflow and these
actions' executed distributions/dependencies; this table records identity and
interface review, not a completed supply-chain certification.

| Action | Exact proposed pin | Job |
| --- | --- | --- |
| `actions/checkout` v4 | `11d5960a326750d5838078e36cf38b85af677262` | producer only |
| `actions/setup-node` v4 | `49933ea5288caeca8642d1e84afbd3f7d6820020` | producer only |
| `actions/upload-artifact` v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` | both |
| `actions/download-artifact` v4 | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | signer only |
| `actions/attest` v4 | `1e69f48acb82d1966a394da916b4c1698aa569d6` | signer only |

Artifact names include the fixed route plus run ID/attempt. Both uploads use
`retention-days: 1`, `if-no-files-found: error`, `overwrite: false` and explicit
filenames. The [pinned upload contract](https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/action.yml)
returns artifact ID and archive digest; the [download contract](https://github.com/actions/download-artifact/blob/d3f86a106a0bac45b974a628896c90dbdf5c8093/action.yml)
accepts that ID within the current run. Archive identity is different from the
attested file digest and inner envelope digest.

Before approval, enforce combined storage accounting for the intermediate and
final archives, including ZIP/bundle/manifest overhead, at most 10 MiB. Bound
intermediate payload conservatively enough to reserve space for the final bundle
and duplicate evidence. Abort before either upload if its reserved cumulative
budget cannot fit; a post-upload size check is not a substitute. Record actual
archive sizes after upload and queue no further route when allowance is exhausted.
Do not upload package tarballs, dependencies, source contents, observer state,
receipt catalogs, environment dumps, credentials or model/tool transcripts.
Expired delivery artifacts must not be silently replaced under the old identity.

## Recipient authority and owner checkpoint

Retrieve the selected artifact through existing authenticated GitHub access,
resolve repository/run/attempt/artifact ID and source identity, unpack safely and
inspect. Public-good Sigstore signing publishes attestation information; review
that disclosure before signing. Neither a checksum file nor a downloaded
instruction grants producer trust.

The authoritative owner-local registry must explicitly bind issuer, repository
and numeric owner/repository IDs, workflow, exact task ref, source **and signer**
commits, outer file SHA-256, inner evidence digest and interpretation. Bind the
bundle SHA-256 too for explicitly chosen offline identification. No imported
artifact may create or change this policy. Review the exact signer certificate
identity and pinned verifier implementation/host context before authentication.

Read the current owned policy before authentication; revalidate its revision,
content and membership after authentication, explicit acceptance, and immediately
before response publication. Missing, deleted, narrowed, changed, unreadable or
unsupported policy withdraws authority. Persisted acceptance is not a permanent
cached certificate. Deliberate restoration of identical owner-approved policy
bytes can rematch a persisted digest; the read-only registry does not enforce a
durable monotonic revision history. Offline identification does not establish
unseen remote revocation or globally latest evidence.

Finally, ask the recipient's own healthy observer and caller-aware synchronized
query to evaluate current local inputs and the reviewed matched runtime profile.
Do not transfer watcher authority or suppress newer local failure/conflicting
selection. Authentication/acceptance are separate from CURRENT, PASS and
`reuse_eligible`. G3 passes only with a real authenticated producer artifact and
recipient applicability/reuse evidence, not this design or passing helper tests.

Before activation, the owner must approve the final fixed-branch workflow and its enablement,
exact source/signer/action revisions, matched profile, public
predicate/disclosure, bounded storage implementation and exact recipient policy.
No OIDC signing, workflow enablement, upload or producer acceptance has occurred
in this task.
