# Native Claude receiver authentication preparation

Status: **PENDING_EXACT_SENTINEL_REVIEW_AND_OWNER_APPROVAL**. The owner reports
successful native subscription login and the normal prompt in the previously
reviewed isolated187 profile, followed by exit without a model request or `!`
command. This is owner-observed onboarding, not an agent-run authentication,
capacity, credential-denial or sandbox test. The new six-check synthetic proposal
below is unrun. The existing disabled workflow remains secret-free and data-only;
it cannot launch native code. Actual cross-agent/two-machine reuse remains a gate.
Existing subscriptions are approved, additional spending is $0; resource approval
cannot supply CURRENT. D4 in [portable decisions](../plan/portable-evidence-decisions.md)
records the explicit Copilot-producer/native-Claude-receiver amendment.

## Observed local route

On 2026-10-11, read-only native Claude Code 2.1.146 commands `--version`, `auth
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

Installed 2.1.146 help confirms auth/status/setup-token and print, stream-json,
settings, permission-mode, tool filtering and session controls. Its bare help
explicitly excludes OAuth and CLAUDE.md discovery: do not use it to manufacture a
subscription/instruction test. Current [official CLI reference](https://code.claude.com/docs/en/cli-reference)
contains newer-version features; it is not empirical acceptance of this binary.
Pin/review the actual native distribution and its supported flags before inference.
No --dangerously-skip-permissions, account refresh or model call is a preflight.

## Useful remaining owner action

Account existence and owner onboarding are answered: the owner reports native187
subscription login and the normal prompt in the isolated profile, with no model
or shell action. The remaining prerequisite is review and specific owner approval
of the exact synthetic sentinel code/settings/resources below, then **actual native**
no-model boundary proof. Do not copy login files, change global settings or
substitute a handcrafted sandbox. This proof remains separate from real credential
removal, actual REDUE endpoint authority and included model capacity.

No new secret or workflow enablement is requested for the data proposal. Before any
future authenticated receiver workflow, the owner must review its exact native
and source hashes, startup-side behavior, matched profile, resource scope, limits
and redaction. Normal main workflow registration needs a separately approved PR.
That future secret-bearing job requires a protected portable-evidence-claude
environment with selected run-ref and required owner review; naming a repository
secret alone cannot scope its access to one workflow. Review other workflows able
to request that environment. Only then may the owner privately use the supported
subscription setup-token/browser flow and environment-secret UI. Never request
token values in chat, copy local credentials or fall back to API billing. Current
documentation describes one-year OAuth tokens; deleting the Actions secret does
not revoke the provider token. Existing $0-overage and capacity requirements remain.
[GitHub's environment documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
describes public-repository branch/reviewer protections; none were changed here.

Token presence, an auth-status field, static settings and a settings digest cannot
establish any of these gates. Producer acceptance remains a separate current
owner-policy decision. The root integration owner supplies the future reviewed
workflow; the disabled data proposal does not create another host architecture.

## Concrete disabled invocation and remaining host proof

[portable-claude-invocation.mjs](../../test/acceptance/portable-claude-invocation.mjs)
constructs data only from the caller-selected recipient base. It launches zero
processes, reads no secrets, writes no settings and always reports PROPOSAL_ONLY.
Its activation function always refuses; boolean approval/help/static-key fields
cannot activate it. Four deterministic tests cover scope/budgets/no-bypass and
refusal. This is proposal validation, not native host enforcement.

The proposed argv uses print/stream-json, at most 8 turns and a 300-second parent cap, dontAsk,
Bash-only tools, empty strict MCP config and a local --settings file. Actual native
2.1.146 help parsing accepts those flag forms; it does not validate settings or
prove model/turn behavior. No bare, injected system policy, dangerous permission
bypass or disabled REDUE skill is proposed. Fresh project instructions load through
the normal mechanism. Root must verify ownership/canonical paths and finalize the
actual workflow; the lexical base check does not approve a filesystem resource.

Proposed settings keep the sandbox mandatory, forbid unsandboxed retries/excluded
commands, restrict its one state socket and reject tool-network access. Only exact
inspection/REDUE commands are proposed; other tools/MCP/hooks/plugins are excluded.
Subscription and GitHub credential-deny entries are proposed, not effective on
the installed 2.1.146 version. Host settings/installations/producer-policy writes are not agent-owned.
No secret value occurs in argv/settings or a model-readable file.

[Current native sandbox documentation](https://code.claude.com/docs/en/sandboxing)
states that shell commands inherit credentials unless protected; other tools may
run outside that boundary. These controls require actual native-version proof.
[Current subprocess scrub documentation](https://code.claude.com/docs/en/env-vars)
says scrub before 2.1.251 removed only API/AWS secret variables, not the broader current
credential list. Therefore local 2.1.146 scrub/static keys are insufficient evidence
that subscription OAuth is hidden. Do not install a real token or run inference
before independently demonstrating credential-deny and exact sandbox behavior with
non-secret sentinels. A differently reviewed native version may be owner-provisioned
normally; never upgrade the owner’s existing installation automatically.

B’s CI recipient helper presently stops its observer after deterministic checks;
a future model stage must start its own approved observer and reassess after all
instruction/fixture changes. Its explicit custom state also needs a verified
installation-provided routing choice: config-only agent setup does not embed that
state. Do not assume a prepared helper report or preflight outside the host boundary
establishes agent-visible eligible evidence. No task-specific REDUE reminder repairs
that gate.

The controlled [generic guidance writer](../../test/acceptance/portable-controlled-guidance.mjs)
creates only new files in a caller-selected, canonical owned fixture with its own
Git root and exact state-owner marker. Copilot loads AGENTS.md; native Claude
loads CLAUDE.md. Both point to the same verbatim, SHA-bound installed shared
policy plus the explicit project-relative config/state route. This is the
documented generic mechanism, not native REDUE setup/doctor support for Copilot
or custom-state embedding. Preview is read-only; application refuses existing
or edited files. It does not write permissions, state, receipts or producer policy.

The required producer/receiver role is explicit. Only the producer appendix
selects `run typecheck --portable` for fresh recording; it still executes the
configured compiler. Export/import/trust remain owner operations. The receiver
has no capture modifier or task-specific reuse reminder. Eight deterministic
controls cover both hosts, preview, ownership/currency failure and no-overwrite;
these are mechanics, not instruction discovery by a running agent. All fixture
and guidance changes must finish before the relevant in-context baseline.
The writer's ownership controls require POSIX semantics and explicitly refuse
Windows; it does not claim a native Windows host route. The Claude proposal uses
fixed macOS path semantics even when its pure tests run on another CI platform.
The current deterministic CI recipient helper deliberately ends STALE after its
source-edit control and stops the observer; its report cannot be reused as an
eligible model precondition.

## No-model native boundary review — 2026-10-11

The [pinned official changelog](https://github.com/anthropics/claude-code/blob/2301018b1f61073c501a8e7a4813ef48c239163b/CHANGELOG.md)
places `sandbox.credentials` in 2.1.187, `failIfUnavailable` in 2.1.83 and
`allowUnsandboxedCommands` in 2.0.30. It records the strict `!` shell-mode behavior
change at 2.1.260. Thus 2.1.146 is **unsupported for the proposed credential-deny
boundary**, not merely awaiting a positive test. Static strings did not establish
feature availability. The disabled invocation spec names that version blocker.

An isolated official native darwin-arm64 2.1.187 binary was downloaded without
installing it or replacing the owner's CLI. Its [official manifest](https://downloads.claude.ai/claude-code-releases/2.1.187/manifest.json)
size215,994,048bytes and SHA-256
`a59a16ba4922adab7a145728f215d042184d349f5f7e72cddb7fc114250a4ce3`
match the downloaded binary. At that initial checkpoint only `--version` and `--help` ran successfully.
Later `auth status --help` confirmed the supported JSON flag without running the
authentication action, and the separately authorized no-auth UI attempt below ran.
No187 token-bearing auth-status or model request has executed. No sandbox-test
subcommand appears in either version's help. `doctor --help` describes updater
health and possible MCP-server execution; doctor itself was not run.

The [current strict-mode documentation](https://code.claude.com/docs/en/sandboxing#turn-off-the-retry-with-strict-sandbox-mode)
and versioned changelog support a candidate **interactive** `!` shell-mode route
before 2.1.260, with strict sandboxing. The earliest documented combination of the
required controls is 2.1.187; this is not yet empirical host acceptance.
Bounded inspection of the digest-verified native implementation finds its manual
shell handler calls the same Bash tool as model tool calls. Its sandbox decision
honors an unsandboxed flag only when the strict-setting accessor permits it.
This supports the candidate route structurally; it is not an executed sentinel
test or a claim that arbitrary settings were validated.
Do not pass `!…` to `--print` as a supposed no-model test. The future reviewed
preflight must enter shell mode through the native interactive UI, use only
non-secret sentinel variables, verify actual credential removal/one-socket and
network/file denials, then exit without a model request. An invalid settings file
can be silently ignored in print mode according to both actual help outputs;
help parsing is not an enforcement check. A handcrafted sandbox, hook or MCP
command cannot substitute for the native host boundary.

### Historical disabled strict-shell preflight specification

This sequence is **not run**. Before native interactive startup, select an empty
owner-local configuration directory and the already verified owned fixture paths;
record their canonical identities. No auth file is copied. Refuse startup if any
real API/OAuth/bearer/provider token is present or if a secure-storage override is
present; report key presence only. Set CLAUDE_CONFIG_DIR only for this proposed
process, to the fresh owned directory; do not change HOME or global settings.
Keep managed settings active. The pinned 2.1.187 binary's credential-service code
namespaces storage using a digest of this config-directory selection when no
CLAUDE_SECURESTORAGE_CONFIG_DIR override exists. This source observation does not
prove that every startup component avoids all existing keychain activity.

Use the verified isolated native binary, **without** print or bare mode, with:

```text
--permission-mode dontAsk --tools Bash
--strict-mcp-config --mcp-config {"mcpServers":{}}
--setting-sources project,local --settings OWNED_REVIEWED_SETTINGS_FILE
```

The ephemeral settings must be independently reviewed for the exact fixture and
socket: sandbox enabled, failIfUnavailable=true, allowUnsandboxedCommands=false,
no excluded commands, no hooks/plugins, exact workspace/state only for writes,
only the intended observer socket, no tool-network destinations and explicit
credentials.envVars deny for a **custom non-secret** REDUE_PREFLIGHT_SENTINEL.
Do not put a fake value in an authentication-variable name to bypass onboarding.
The settings file and sentinel checker are owner-provided preflight data/code,
not an imported artifact or a hook. They must not become model task instructions.

If native onboarding/login prevents reaching the interactive shell prompt,
stop and record the actual onboarding/login stage before any model request. Do not sign in, refresh,
skip onboarding, provision a token or reuse the owner's login database. If the
prompt is available, enter `!` through the native interactive UI, run only the
reviewed bounded sentinel checker, and exit without submitting a model prompt.
The checker emits booleans for sentinel absence and expected filesystem/socket/
network denials, never values or raw settings. Capture the actual shell-mode
tool boundary; a separate sandbox invocation or an outside command is not proof.
An unknown/native validation result stops the lane. Even a successful sentinel
preflight would not itself establish subscription capacity, model behavior or
portable-evidence eligibility.

### Historical data-only bootstrap checkpoint

Independent source review permits constructing the no-auth map. A fresh owned
configuration/GitHub configuration/workspace and settings file now exist locally;
settings SHA-256 is `785be21b4576e0ad7037f761d4a3ee852a5ea6c12bd9245aa17af577acf698cb`.
The selected20 authentication/provider/secure-storage environment keys are absent.
All tools, including Bash, are denied; no keyboard input or model action is
authorized. The map remains **DATA_ONLY_NOT_STARTED**; no native interactive
process has started.

Final startup review found a separate host-side prerequisite: exact187 source
preserves managed hooks even when the local settings disableAllHooks flag is true.
Tool sandboxing therefore does not establish that startup hooks are disabled.
Its updater also honors the supported process-only DISABLE_UPDATES guard, but the
current map has not added that guard. Before starting, review the actual applicable
managed-hook inventory through a read-only key/presence summary and the exact
process-local updater guard. Do not change managed settings. If those host-side
facts cannot be established, leave startup blocked. The structural public-source
record is local and bounded; neither it nor a settings digest proves native
credential isolation, zero startup network activity or model acceptance.

### Actual UI-only bootstrap checkpoint

The source-selected macOS managed settings file/fragments and device/per-user
managed-preferences files were absent. Inventory reported only presence; no
policy bodies, commands or private values were read or changed. The [official
environment reference](https://code.claude.com/docs/en/env-vars) and the exact187
implementation support `DISABLE_UPDATES=1`; that guard was added only to this
ephemeral host-startup process, not to REDUE's compiler execution or qualification
environment. Revised map SHA-256 is
`40a72b761b80b88fbc8123550b778efa66839d530aed50866775fef761e2a6d2`.
Independent review cleared that exact map and unchanged settings subject to
immediate ownership/digest/environment/policy rechecks, which passed.

One bounded native interactive process reached the **INITIAL_THEME_ONBOARDING_GATE**
in 5,155.2ms including termination. No keyboard input, Bash action, model request,
authentication or trust approval was submitted. The first automatic report was
INITIAL_UI_UNCLASSIFIED; independent private-log review confirmed the actual theme
selection screen, and a separate clarification preserves both records. It was
not a login, trust or execution failure. The owned process did not exit within2s
of SIGTERM; it was SIGKILLed and reaped (exit-9). No retry was performed.

The protected local map/report/clarification identify the exact bytes; the raw
UI capture stays private. Native onboarding prevented reaching the shell prompt.
Do not fabricate completed-onboarding configuration, copy an existing login
database or skip that gate. At that historical checkpoint a supported owner-provisioned onboarding route
was still needed; the owner has since reported completing it without inference. This
result establishes initial native UI startup only, not zero background network/
keychain activity, credential denial, effective sandboxing, capacity, model use
or portable-evidence acceptance.

### Current disabled auth-route data proposal

The [manual proposal](portable-claude-startup-workflow.yml) remains outside .github.
It checks one literal reviewed helper source on macos-26/Node22.13.0, with no inputs,
secrets, native executable downloads, authentication calls, tool/model actions or
uploads. The [helper](../../test/acceptance/portable-claude-startup.py) emits only a
fixed **AUTH_STATUS_ONLY_DATA_PROPOSAL / BLOCKED_NATIVE_STARTUP_BOUNDARY** record.
It has no native-process launcher and always reports can_infer=false and zero
native/model/Bash actions. The workflow head and literal helper checkout are
separate identities; integration must repin before any owner-approved registration.
Its pure tests use synthetic payloads and prove refusal before any native launch;
this is not an empirical authenticated-host test.

Exact187 public implementation review establishes the proposed env-token status
interpretation: Ak selects CLAUDE_CODE_OAUTH_TOKEN, bEp maps that source to
**authMethod=oauth_token**, and absent provider selectors map to apiProvider=firstParty.
The normal installed146 user's claude.ai status is a different route. Native187
loggedIn=true is derived from token presence; it does not validate the token,
expiry, subscription capacity or model access. The sanitizer retains only fixed
method/provider/boolean fields, discarding email, organization and other values.
Malformed/oversized payloads and unexpected methods/providers are refused.

The data route rejects presence even when empty of OAuth/API token descriptors,
ANTHROPIC_CUSTOM_HEADERS/profile/provider overrides, CLAUDE_BG_AUTH_SNAPSHOT_PATH,
alternate provider credentials and startup bypasses. Exact187 reads the snapshot
path and can unlink its file; it is not inert. No complete payload, environment,
private path or exception value is published. DISABLE_UPDATES=1 remains a supported
**future process-only startup guard**, not an alteration to compiler qualification.

Independent source review found commander preAction initializes configuration and
remote managed settings even for auth subcommands. Local managed-file absence
therefore does not prove absence of authenticated startup-side hooks/helpers.
The exact auth-status action appears narrower than interactive SessionStart, but
absence of all external startup actions was **not established**. We stop the source
exploration here and do not start token-bearing auth status merely to learn
hasToken. The failed proof approaches and actual theme-gate attempt remain history;
neither is a REDUE failure or a claim that the subscription lacks capacity.

The owner has since completed onboarding; the next native boundary action is
the independently reviewed, separately approved sentinel route below. Until then the proposed
model receiver and agent-run authenticated boundary/credential tests remain
NOT RUN; owner-reported authenticated startup is separate. No secret creation, global changes, native146 upgrade, producer acceptance
or native-mode enforcement is inferred from this document.

### Owner-completed isolated onboarding — recorded2026-10-11 09:28UTC

The owner reports subscription login succeeded and the normal native prompt
appeared using the previously verified isolated187 command. No model request or
shell command was submitted and the owner exited. No credential file was copied,
inspected or exported by the implementation lanes. This establishes owner-observed
onboarding completion only. Managed authenticated startup behavior, actual native
credential/sandbox enforcement, included capacity and matched-runner acceptance
remain unproven. D prepares only the smallest data/checker/settings proposal; C
reviews independently. Current785be all-tools-denied settings stay unchanged.
Exact approval is required before any new fixture provisioning, settings application
or native `!` action. No secret creation, SDK substitution or model trial follows
from this result.

### Historical temporary six-check synthetic sentinel proposal — not applied

The [checker template](../../test/acceptance/portable-claude-sentinel.mjs) and
[settings template](portable-claude-sentinel-settings.json) contain render markers,
not executable owner bindings. Exact rendered files and the literal argv/path map
are protected owner-local proposal data under this lane's
`.local/portable-native-sentinel-proposal/`; they are not installed in the
onboarded profile. The exact proposal map SHA-256 is
`d55150b3abc06af64597e8ec19b8a3668745b8cc393e2531b26e3cd6244d7cf4`.
Rendered checker SHA-256 is
`7d97369c54daa009ab7f487f476b19095b5a67e1b424143664538c238d151c8e`;
rendered proposed settings SHA-256 is
`b63c0e1e112f41aaa378b0c0f79f7bf65825ff25ae175c2b851b2af312958efe`.
At that checkpoint original settings785be and nativea59a16 were unchanged. The selected Node22.13.0
executable SHA-256 is
`5c79f8e198fd2456ea6660aaa6be218f9f44747f2306c7d0f5f97b087b2f2dfc`.
No live canary, listener, workspace checker or profile settings were created.

The proposed delta removes the original all-Bash denial only to allow one literal
`Bash(REVIEWED_NODE REVIEWED_CHECKER)` command. Other tools remain denied, and
startup retains `--tools Bash`, dontAsk, strict empty MCP and project/local setting
sources. Sandbox strict/failIfUnavailable stays enabled, no excluded commands or
unsandboxed retry, no hooks/plugins, no allow-all socket or tool network. Only the
one synthetic allowed socket is listed. The entire selected base and Node version
directory are denied writes, in addition to specific checker/settings/config/
canary/native files; workspace allowWrite cannot authorize their mutation or
parent-directory replacement. The checker does not need writable workspace.
Actual enforcement remains untested. Process-only DISABLE_UPDATES=1 and isolated
CLAUDE_CONFIG_DIR/GH_CONFIG_DIR remain; HOME, proxies, managed settings and the
original profile settings are unchanged.

Before any future launch, independently review the exact rendered code/settings
and applicable authenticated managed-policy startup hooks. Local policy-file
absence before login did not establish authenticated remote-policy absence, and
local disableAllHooks is not a managed-hook bypass. Unknown startup authority
stops the route. Recheck current ownership, physical parent/file identities and
hashes of Node, native, checker/settings and synthetic resources before/after the
interval. Reject presence, even empty, of NODE_OPTIONS, NODE_PATH and reviewed LD preload/search overrides or any DYLD_/OPENSSL_ key **before launching Node**; the checker's own
presence guard cannot undo a preload that already executed. Reject unintended
provider/API/startup overrides without printing values. No real authentication
key receives a fake sentinel value.

After that review, the requested owner operation is one bounded native interactive
startup using the private map's literal argv/cwd and a **non-secret custom**
REDUE_PREFLIGHT_SENTINEL process variable, then exactly the private map's
`!REVIEWED_NODE REVIEWED_CHECKER` command, followed by exit. There is no model
prompt, print/bare mode, hook, SDK or separate handcrafted sandbox. The parent
operation is capped at15s; socket operations each have an absolute1s deadline, including partial replies. Stop at an unexpected
onboarding/login/trust/permission gate without accepting it or retrying outside
the sandbox. This operation is **not yet approved or executed**.

The six checks are custom sentinel absence, synthetic protected-file open denial,
synthetic outside-write denial, one allowed synthetic socket's exact fixed reply,
other synthetic socket connect denial, and owned direct-loopback TCP connect
denial. Only EACCES/EPERM establish denial. Missing files, refused connections,
closed listeners, EEXIST, malformed replies and timeouts are unknown/failure.
The checker emits only booleans and fixed reason codes; no environment values,
OS error messages, file contents or responses leave it.

The owner-side fixture must prove the protected canary exists and is readable
outside the sandbox, the write target is absent with a writable existing parent,
and both Unix listeners and the fixed loopback listener are owned and live.
Pre/post listener control connects must return the fixed PING/OK protocol; they
must not forward commands or accept arbitrary input. The fixed loopback endpoint
is127.0.0.1:38187: occupied or unavailable means stop, never choose another port.
Retain any unexpected created write canary as a counterexample instead of deleting
it inside the checker. Missing live-target gates prevent any success claim even
if the checker reports all six expected results.

Successful native tracing plus these gates would establish only the custom env
sentinel and synthetic file/socket/network mechanics. No real OAuth/GitHub
credential, config, keychain or REDUE state file is opened by the checker. It does
not prove real secret removal, actual REDUE observer/probe access, matched-VM
applicability, subscription capacity or agent reuse. Secret-bearing VM child key
absence, the actual REDUE endpoint gate and model trials remain separate. Five
pure deterministic controls pass; they create no live fixtures and launch no
native/auth/tool/model process.

### Durable rebinding — disabled, no native action

The owner reports successfully launching the repaired durable187 setup. The
original temporary profile is now absent; saved historical proposal files remain
protected. This does not authorize a model or checker action. The working durable
native SHA remainsa59a16; its all-tools-denied settings SHA is
`5628de7667d4a5125c723ecbc3685336ef12cd80f15da83e6467b3826a337afc`
and unchanged launcher SHA iseebb1e55. No credential was copied. The launcher's
explicit secure-storage selection preserves the existing Keychain namespace in
place; the pinned187 implementation also leaves its plaintext fallback at the old
namespace path, not at the durable config path. This is not a new default login,
a token-validity/capacity claim or an environment change to a verification check.

The re-rendered disabled map is protected locally under
`.local/portable-native-sentinel-durable-proposal/`, SHA-256
`c321bb78cbd5dfacf6daaa9eb41db71f3d9aff4fa40456337d8d4e70f83edb1f`.
Rendered checker SHA-256 is
`b3bad6b2f056a28ee67886ee320703675fffc5c31185009983c228701ca70c6f`;
proposed settings SHA-256 is
`3018fc31cca7b676c9f24c84cf904ae8eefb2c4302a759b5a9013e0fed7817a7`.
These are proposal-only copies: working settings5628, launcher and authentication
are untouched; no checker, synthetic canary or listener was installed.

The durable base contains spaces, so the literal one-command permission and manual
shell input quote the checker argument. Two short synthetic socket basenames,
`a.sock` and `d.sock`, keep each reviewed absolute pathname at98 UTF-8 bytes; the
previous nested resource socket paths would be130 bytes and exceed macOS's Unix
socket pathname capacity. No other socket authority is added. Fixed loopback
port38187, six checks, absolute socket deadlines, strict policy and known-live
external controls are unchanged. Six pure deterministic controls pass; none
executes native code or proves the authenticated effective policy. The original
launcher cannot run this proposal: a separately reviewed exact settings selection,
synthetic-resource provisioning and owner approval remain required, alongside the
actual effective managed-hook/strict/excluded-command prerequisite.
