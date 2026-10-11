# Portable evidence: remaining owner setup

Accounts are already approved: existing Codex and Claude subscriptions, and the
company-provided Copilot entitlement with permitted personal use. Additional
spending remains $0. The approved demonstration is Copilot CLI on producer VM A
and native Claude Code on independently matched standard macOS receiver VM B.
Codex acceptance is separate. No account purchase or account-existence decision
is outstanding.

1. **Exact data-only trust trial — approved (D5).** Reviewed
   [the final recipient workflow](portable-ci-recipient-enable-proposal.yml),
   SHA-256 `ef237cbb411b0520791911503d3071a9a42f78502ac8f712406a11566482ef78`,
   and its exact producer policy/fresh-state registry provisioning are owner-approved. The registry SHA-256 is
   `5a1021fcf9b119f4469370eb33c09dc35c62cb174bc272574065a382aae6d521`;
   policy digest is
   `bab7901892570e81f15f8e888d2c33e632479f55f461d4ee34f905acfe7a5ce6`.
   It accepts only the reviewed d04b872 signed origin from run38096670987,
   with required online authentication. Read-only GitHub permissions, no models,
   OIDC, uploads or global trust. Signing approval does not grant this trust.
   The exact review files are on `dev/portable-ci-preparation` at2448a8d;
   original helper/registry were pinned to immutable a23843e, runtime/artifact to d04b872.
   Original bytes were enabled only on dedicated dev/portable-ci-recipient atb240187.
   First run38098482463 stopped before import at an erroneous fresh-receipt
   precondition. Corrected helper1492a67 is independently reviewed, with104/104
   controls and an actual frozen-d04 fresh installation passing. The
   [corrected workflow](portable-ci-recipient-corrected-proposal.yml) changes
   only its two immutable helper/registry source pins to a2f2ddc; raw SHA-256
   `a600688881452915bde3f63a9dc60d21d952c65a9b4efe3db2c14860976a5d6f`.
   The owner has now approved those exact corrected bytes for one attempt. Root
   verified the complete hash at892f603 and the live pinned artifact before
   enabling only dev/portable-ci-recipient6b901d0. Run38123365552 is the one
   approved data-only attempt and PASSED: independently established imported
   CURRENT/PASS/eligible, unrelated/restart retention and relevantSTALE; no equivalent
   receiver execution and models0. Its actual result is recorded in the tracker.
   Producer, registry, policy, runtime and verifier bindings are unchanged. No
   models, signing, uploads, expanded trust or publication are authorized.
2. **Copilot included-capacity confirmation.** Confirm account msiric's applicable
   seat permits CLI requests from this personally owned repository, at least four
   AI credits are included for the first bounded trial, and no additional-charge
   route is enabled under the $0 cap. GitHub documents built-in GITHUB_TOKEN plus
   `copilot-requests: write`; no PAT or model secret is requested. Repository
   ownership does not prove seat entitlement or available included quota.
3. **Isolated native Claude onboarding, before any secret.** Do not create/add a secret yet.
   The secret-free [Claude data proposal](portable-claude-startup-workflow.yml)
   cannot start native code, tools or inference. Version2.1.187's OAuth auth-status
   reports token presence as `oauth_token`; that does not establish token validity,
   subscription capacity or safe authenticated startup. The supported isolated
   native onboarding/authentication is the owner-local step below. Actual no-model
   credential/sandbox enforcement still needs its reviewed checker and native proof.
   Installed2.1.146 settings/help are not that proof.
   After the reviewed manual, pinned workflow and native version are ready, the
   owner will privately use `claude setup-token` with the existing subscription
   and add CLAUDE_CODE_OAUTH_TOKEN through the GitHub environment-secret UI.
   The intended protected environment is `portable-evidence-claude`, restricted
   to the exact reviewed dispatch ref, with owner review before secret release.
   Registering workflow_dispatch on main requires separate normal merge approval.
   Do not send the token in chat, copy local login files, use a repository-wide
   fallback secret or enable API billing. Secret presence is not permission to
   infer; in-context credential isolation, effective sandbox and REDUE expected
   evidence gates must first pass. No failed prerequisite launches a model.

These are one consolidated checklist, not requests to change subscriptions,
managed policy or normal installations. Deterministic implementation, review and
same-machine mechanics continue while affected operations are queued. A later
Copilot-produced origin needs its own recorded invocation and reviewed signing/
producer policy; the frozen CLI-produced origin cannot stand in for model behavior.

Observed preparation: installed integration controls107tests/106PASS/one
platform skip on Node22.13.0, no models; independent recipient controls84/84,
Copilot controls6/6 and substantive controlled-guidance/Claude data12/12.
These do not establish effective native permissions or agent reuse.

## Exact owner-local Claude step

Verified native2.1.187 SHA-256
`a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3`,
settings SHA-256
`785be21b4576e0ad7037f761d4a3ee852a5ea6c12bd9245aa17af577acf698cb`.
Directories remain canonical, owner-local and mode700; settings are mode600.
No credential file was copied or read. The read-only recheck sees no selected
auth/provider overrides in this session; the owner's terminal must independently
avoid alternate API/bearer/OAuth/provider/secure-storage overrides. If one is
set, stop and report only its key name rather than stripping it or printing values.

Run the preserved reviewed command in the owner's terminal:

```sh
(
  cd "$OWNED_EMPTY_WORKSPACE" || exit
  env CLAUDE_CONFIG_DIR="$OWNED_CLAUDE_CONFIG" \
      GH_CONFIG_DIR="$OWNED_GH_CONFIG" DISABLE_UPDATES=1 \
      "$REVIEWED_NATIVE_CLAUDE_187" \
      --permission-mode dontAsk --tools Bash \
      --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
      --setting-sources project,local --settings "$REVIEWED_NO_TOOL_SETTINGS"
)
```

The exact canonical owner-local command is preserved privately at
`.local/portable-evidence/claude-owner-onboarding.sh` (mode600) and supplied to the
owner. The variables above are placeholders for those verified paths, not paths to
infer or a command to run without binding them. Private home/temporary paths do
not need to appear in public instructions.


Choose a theme, select the existing Claude subscription/claude.ai route (not
Console/API billing), and complete its browser login privately. Follow the native
login-success/Enter prompt and review safety/trust only for that exact owned empty
workspace. If an unexpected provider, organization policy or error appears, stop
and report the stage. At the normal prompt submit no model request or `!` command;
exit with Ctrl-C. Report only whether native login succeeded and the normal prompt
was reached, never codes, tokens, private account details or login screenshots.
No setup-token, secret, SDK, global-settings change or login-file copy is needed.
Normal HOME, managed policy and proxy remain in effect. DISABLE_UPDATES is only
this native-startup process guard, not a compiler-environment change.

Expected success is isolated native onboarding/authentication, **not** tool
sandboxing, subscription capacity, evidence eligibility or model acceptance. Current
settings deliberately deny all tools. The next no-model gate is an independently
reviewed bounded non-secret sentinel checker and explicit local settings change:
native interactive `!` must reach the actual Bash-tool boundary under strict
sandboxing; credential/config reads, unrelated sockets, direct network and outside
writes must be denied, while only the approved observer endpoint is reachable.
No unsandboxed retry, print-mode substitute, handcrafted sandbox, hook or MCP.
Authenticated managed startup policy must be reviewed after login; prior local
policy-file absence does not establish its effective behavior. Only after that
proof and normal subscription/capacity preconditions can a bounded native receiver
model trial proceed. A runner OAuth-secret workflow remains a separately reviewed
owner action; do not create or add its secret now.

Copilot's pending owner confirmation concerns the Actions billing route: applicable
msiric seat, at least four included AI credits, and zero additional charges. That
unlocks the documented built-in GITHUB_TOKEN/copy-free authentication preflight;
actual native sandbox/credential proof still precedes the bounded producer model
trial. Desktop access alone, a PAT or a new account is not a substitute.

Primary onboarding references: [authentication](https://code.claude.com/docs/en/authentication)
and [quickstart](https://code.claude.com/docs/en/quickstart). Current documentation
is newer than the pinned187 implementation; its actual host outcome must be
recorded rather than inferred from the documentation.
