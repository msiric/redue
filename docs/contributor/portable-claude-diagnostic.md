# Bounded native Claude diagnostic proposal

This native route is **unregistered / NOT RUN**. It prepares the owner's approved
one hosted macOS diagnostic: one job, four agentic turns, 120 seconds including
checkout/download/preparation/drain, and $0 additional spending. It neither runs
project verification nor establishes portable applicability or reuse. The two
independent matched GitHub-hosted machines remain the demonstration pair.

The [helper](../../test/acceptance/portable-claude-diagnostic.mjs) requires one native
assistant `tool_use` for the literal collector command and a native user
`tool_result` with the same ID. Its independently collected socket report must
match the tool result. Model prose cannot establish success. Actual checker OS
close/exit/signal, six assertion rows, native process outcome and lifecycle remain
separate. Negative assertions survive incomplete cleanup. Missing/malformed data,
changed files, missing live controls or timeout yield UNKNOWN. Fourteen pure/mock
controls passed; no native, model or real probe ran during those controls.

The [assets](../../test/acceptance/portable-native-diagnostic-assets.mjs) retain the
reviewed local six-assertion and supervisor bodies with path/hash bindings only.
The independent normalized-body digests are
`e55a30e93e4658605d2a018fbda603426c085549d522d51d898e6f2a70e57e92`
and `187b4a16b8663f5f206d30b76d107b5d6b5f16e882e828b49c5533c2dd5c8090`.
The checker uses a nonsecret environment sentinel, protected read/write canaries,
two Unix sockets and one known-live loopback listener. Each probe retains its
one-second absolute limit. Only permission errors establish denials; absent or
closed endpoints do not. Real credential bodies are never opened by the checker.
This does not claim that the authenticated native parent avoids using OAuth.

The [workflow](portable-claude-diagnostic-workflow.yml), outside `.github`, fixes
`msiric/redue`, owner `msiric`, manual dispatch on
`dev/portable-claude-diagnostic`, macOS26/arm64, Node22.13.0 and native2.1.187
SHA-256 `a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3`.
Only run-attempt1 is admitted; a missing attempt or a rerun refuses. A fresh
dispatch still needs the root-owned one-operation ledger. Its unresolved
integrated source pin fails before the secret step. Native bytes
come from the public release URL used by the [official installer](https://claude.ai/install.sh),
with the pinned checksum checked before execution. There are no uploads, caches,
OIDC/signing jobs, copied login files, bare/SDK routes, terminal input, retries or
input queues. The fixed print prompt has closed stdin and `--max-turns 4`.

The native environment preserves proxy settings and normal HOME, isolates config
and GH directories, disables updates, and excludes GH/runner/OIDC credentials. The nonsecret `RUNNER_TRACKING_ID`
is retained only in the child environment for standard Actions orphan tracking;
it is never included in the report. Native reaping and listener cleanup are
reported individually; UNKNOWN does not claim all descendants were cleaned.
The sandbox is required, has no unsandboxed fallback or excluded commands, adds
no explicit filesystem `allowWrite` entries, protects code/native/runtime parents,
and denies protected host and
Keychain reads, and permits only the single reporting socket. Implicit native
temporary-directory access is not claimed removed. The six assertions establish
only their named operations, not universal filesystem or real credential-body
denial. A literal Bash rule
uses native command normalization; the independently observed tool command must
also equal the submitted literal. Stream inspection is evidence checking, **not**
a preventative permission boundary. Normalization and credential/startup closure
remain subject to independent critical review before deployment.

Pinned source shows `aO` removing OAuth from subprocess environments, followed by
session/plugin overlays; the effective sandbox also applies `env -u` for declared
credential names. Empty setting sources and `disableAllHooks` do not remove
managed policy. `--safe-mode` retains managed customizations; `--bare` skips the
subscription OAuth route. No tier override or policy bypass is proposed. The
selected local-file absence check uses the OS account name and is metadata only.
There is no reviewed native pre-hook command to report remote policy safely.

The remaining owner inputs, after coherent workflow review, are:

1. Confirm the actual token belongs to a personal Pro/Max account without
   Team/Enterprise membership or applicable managed policy; otherwise provide
   that applicable policy for review. The current conditional route supports
   the authoritative **no-policy** case only. This is an owner statement, not
   empirical policy inspection or a waiver for an unknown policy.
2. Confirm four turns in this bounded job fit included subscription quota with
   extra usage/charges disabled. Set the protected environment capacity value
   `REDUE_CLAUDE_INCLUDED_DIAGNOSTIC_CAPACITY=4-turn-120s-included-only`.
3. Protect the `portable-evidence-claude` environment with required owner review
   and the selected ref, review every workflow able to request it, then privately
   create a subscription token through `claude setup-token` and add the environment
   secret `CLAUDE_CODE_OAUTH_TOKEN`. No token value belongs in chat or files.
   Deleting the Actions secret does not revoke the provider token.

The protected environment variable `REDUE_CLAUDE_ACCOUNT_POLICY_FACT` must contain
exactly the following nonsecret JSON fields, with the reviewed source and current
UTC timestamp filled by the owner. It expires after24 hours and is checked before
preparation and before inference. Its digest identifies the statement; it does
not authenticate a hostile same-user process or prove its truth.

```json
{
  "schema": 1,
  "scope": "OWNER_ATTESTED_PERSONAL_SUBSCRIPTION_NO_MANAGED_POLICY",
  "owner": "msiric",
  "repository": "msiric/redue",
  "ref": "refs/heads/dev/portable-claude-diagnostic",
  "source": "REVIEWED_INTEGRATED_40_CHARACTER_COMMIT",
  "native_sha256": "a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3",
  "account_kind": "personal-pro",
  "organization_membership": "none",
  "applicable_managed_policy": "none",
  "reviewed_at": "CURRENT_UTC_TIME_WITH_SECONDS_Z",
  "included_capacity": "4-turn-120s-included-only"
}
```

Authentication availability, included capacity, startup policy, actual native
sandbox/credential enforcement and later recipient applicability remain distinct.
A local manual six-check PASS supplies no hosted proof. Only sanitized fixed
fields reach stdout; no native transcript, model prose or stderr is retained.
The immutable private pending result preserves assertions and actual process
status; final sanitized stdout records completion after persistence. A pending
file alone must never be called final PASS. [Official subscription Actions
instructions](https://code.claude.com/docs/en/github-actions) explain the OAuth
route separately from API billing.
