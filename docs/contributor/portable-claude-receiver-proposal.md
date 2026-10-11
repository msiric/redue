# Native Claude receiver authentication preparation

Status: disabled preparation, not a model run or authentication enablement. D4 in
[portable decisions](../plan/portable-evidence-decisions.md) records the owner’s
explicit Copilot-producer/native-Claude-receiver amendment. Existing subscriptions
are approved, additional spending is $0. Actual two-machine applicability and agent
reuse are still gates; resource approval cannot supply CURRENT.

## Observed local route

On2026-10-11, read-only native Claude Code2.1.146 commands `--version`, `auth
status --json` and help exit successfully. Allowlisted status fields report
loggedIn=true, authMethod=`claude.ai`, apiProvider=`firstParty`, subscriptionType=null.
Checked environment-key presence only: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
CLAUDE_CODE_OAUTH_TOKEN and Bedrock/Vertex/Foundry selectors are absent. No email,
organization, token or configuration body was printed/exported; credential files
were not inspected directly.
No inference or token-generation command ran. This does not establish VM login,
subscription limits or a model request; the earlier API-credit error is not proof
that the owner’s subscription is unavailable.

## Documented route and version boundary

[Official authentication documentation](https://code.claude.com/docs/en/authentication)
describes `claude setup-token` for CI, authenticating with an existing subscription
via CLAUDE_CODE_OAUTH_TOKEN. Current documentation describes a one-year token;
its actual lifetime must be reviewed during owner setup. The owner performs its
browser flow privately; the token is displayed locally. Native bare mode does not use OAuth. API/bearer credentials
or provider settings may select a different authentication route; detect the route
rather than silently falling back to paid API access or changing global settings.

[Official GitHub Actions documentation](https://code.claude.com/docs/en/github-actions)
allows subscription OAuth through an Actions secret and states that OAuth uses
subscription capacity rather than API billing. We propose **native CLI**, not the
Claude Code GitHub Action, so installing its GitHub App and granting its repository
write permissions are unnecessary for this bounded receiver experiment.

Installed2.1.146 help confirms auth/status/setup-token and print, stream-json,
settings, permission-mode, tool filtering and session controls. Its bare help
explicitly excludes OAuth and CLAUDE.md discovery: do not use it to manufacture a
subscription/instruction test. Current [official CLI reference](https://code.claude.com/docs/en/cli-reference)
contains newer-version features; it is not empirical acceptance of this binary.
Pin/review the actual native distribution and its supported flags before inference.
No --dangerously-skip-permissions, account refresh or model call is a preflight.

## Remaining owner actions, in order

1. Review the exact disabled/manual workflow and native executable version/hash,
   fixed public fixture, explicit prompt, matched-profile gate, exact checkout/
   state/socket scope, permissions, endpoint policy, turn/time/concurrency bounds,
   redacted evidence retention and total included-resource reservation. Registration
   of a workflow_dispatch route on main requires a separately owner-approved normal
   PR/merge; no branch-dispatch bypass or main merge is authorized by this document.
   No untrusted PR code or arbitrary command/ref inputs may receive the secret.
2. After approval, run `claude setup-token` in a private owner-controlled terminal
   under the existing subscription. Add it through the supported GitHub Actions
   environment-secret UI as **CLAUDE_CODE_OAUTH_TOKEN** only after reviewing a
   protected `portable-evidence-claude` environment: only the workflow’s exact
   reviewed dispatch ref and required owner approval before a job receives its
   secrets. Branch restrictions apply to the run ref, not just its checkout SHA. Creating that
   environment/protection is an owner administration action, not done here.
   Secret naming alone does not scope a repository secret to one workflow. Other
   workflows can request an environment; the required approval must inspect exact
   workflow/source before release. If these protections are unavailable, stop for
   explicit owner review of broader access, never silently use a repository-wide
   secret. GitHub documents required reviewers/selected branches/environment
   secrets for public repositories including Free; actual configuration remains
   an owner action ([official environment rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).
   Never send its value in chat, commit it, log it or copy a local login database.
   The secret name is public; its value stays secret. Deleting an Actions secret
   alone does not revoke the long-lived provider token; owner revocation/rotation
   must use the provider’s supported controls. No API-key fallback.
3. Approve the concrete reviewed workflow execution only after included Copilot
   seat/quota/policy and $0-overage confirmation, native Claude capacity/policy
   checks, current producer acceptance and fail-closed recipient preflight pass.
   Token presence/auth status are insufficient for an eligible-evidence claim.
   A missing or failed prerequisite launches zero models.

The root integration owner supplies the concrete workflow and owner-policy
proposal. These notes do not enable signing, create trust, install software or
change global/account settings. An independently matched runtime still needs
fresh recipient observation. The model must load the installed project guidance,
receive actual eligible JSON, retain the origin/digest and avoid equivalent compiler
execution before a reuse claim is recorded. Private tokens and raw transcripts
never become public experiment artifacts.
