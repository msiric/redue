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
   helper/registry are pinned to immutable a23843e, runtime/artifact to d04b872.
   Exact bytes are enabled only on dedicated dev/portable-ci-recipient atb240187.
   First run38098482463 stopped before import at an erroneous fresh-receipt
   precondition. Corrected helper1492a67 is independently reviewed, with104/104
   controls and an actual frozen-d04 fresh installation passing. The
   [corrected workflow](portable-ci-recipient-corrected-proposal.yml) changes
   only its two immutable helper/registry source pins to a2f2ddc; raw SHA-256
   `a600688881452915bde3f63a9dc60d21d952c65a9b4efe3db2c14860976a5d6f`.
   It remains unenabled pending review/approval of those changed pins. Exact
   registry, accepted producer, signed artifact and runtime are unchanged. Do not
   repeat producer trust approval or launch a model from the first result.
2. **Copilot included-capacity confirmation.** Confirm account msiric's applicable
   seat permits CLI requests from this personally owned repository, at least four
   AI credits are included for the first bounded trial, and no additional-charge
   route is enabled under the $0 cap. GitHub documents built-in GITHUB_TOKEN plus
   `copilot-requests: write`; no PAT or model secret is requested. Repository
   ownership does not prove seat entitlement or available included quota.
3. **Native host boundary, before OAuth setup.** Do not create/add a secret yet.
   The secret-free [Claude data proposal](portable-claude-startup-workflow.yml)
   cannot start native code, tools or inference. Version2.1.187's OAuth auth-status
   reports token presence as `oauth_token`; that does not establish token validity,
   subscription capacity or safe authenticated startup. The supported isolated
   native onboarding/authentication and actual no-model credential/sandbox
   enforcement proof still need an owner-provisioned host. Installed2.1.146
   settings/help are not that proof.
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
