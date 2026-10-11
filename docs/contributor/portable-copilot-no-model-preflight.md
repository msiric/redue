# Copilot 1.0.91 no-model preflight candidate

Status: **documented candidate; effective boundary NOT ESTABLISHED**. This source
inspection authorizes no launch, settings change, credential use, inference or
policy bypass. The portable-evidence tracker owns the eventual host approval and
actual results. Do not treat this document as a passed model/preflight gate.

The current [official command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
documents `! COMMAND` and lone `!` interactive shell mode without a chat prompt.
The separate `$` shortcut hands over to a real shell and is **not** the candidate.
There is no observed standalone `copilot sandbox exec/test` route: actual pinned
`copilot sandbox --help` exposes only `ca`. Do not invoke CA administration.

## Pinned source evidence

The already inspected official npm distribution is
`@github/copilot-darwin-arm64@1.0.91`:

- Archive SHA-256: `fd5bddc8756e549e47c04a2f9082c50d04727e9dcdcc02ded8936e6e3d1bace0`.
- Native executable: 158,751,280 bytes,
  `87f04922933c139cf4af7cb6a80b96161428618a6275fea4b8dfe7e7a69c9518`.
- Extracted `app.js`: 7,593,700 bytes,
  `6d0149041a57d909979096bb0ca3b92c14d05b1a2768d21cce7e8461dc18300d`.
- Package version `1.0.91`, build metadata `216810c5`.

These are existing read-only distribution observations, not a new download,
installation, independent signature verification or permission grant. Local
protected records retain the archive URL and integrity. Offsets below are
zero-based JavaScript string offsets in this exact UTF-8 decoded `app.js`;
recheck its digest before using them.

| Offset / symbol | Observation |
| --- | --- |
| 7,160,767 onward, `bre` | Strips a leading `!`, resolves mentioned paths, installs an AbortController and calls `W.shell.executeUserRequested({requestId, command})`. This branch does not call `W.send` or request a model response. |
| 7,163,853 vicinity, queued-command branch | A queued `!` command calls the same UI handler. Do not use queuing for the proposed control. |
| 1,410,481 onward, session `shell` binding | `executeUserRequested` passes the current environment to the native secret filter, then invokes `session.shell.executeUserRequested`. Cancellation uses `session.shell.cancelUserRequested`. |
| 1,410,398 vicinity, session `shell` binding | The other shell entry is `session.shell.exec`. This is a **different native method**; source inspection does not establish identical enforcement. |
| 428,751 vicinity, `ndt` | The automatic-update selection predicate rejects `--no-auto-update`, `--prefer-version` or `COPILOT_AUTO_UPDATE=false`. |
| 139,507 vicinity, `VW` | Configuration resolution passes explicit configDir, `COPILOT_HOME`, then OS home to native path resolution. |
| 7,470,443 vicinity, shipped configuration help | Documents `disableAllHooks` and automatic IDE connection controls; actual hook/auth implementation is largely native. |

The JS dispatch is evidence of a no-model route, **not proof of an OS sandbox**,
credential isolation or equivalence with model-requested tools. The native
implementation behind these two shell methods is not available from this bounded
source review. Actual effective-policy/negative controls remain necessary.

## Startup and privacy prerequisites before a UI-only control

Use an owner-approved disposable workspace and fresh `COPILOT_HOME`,
`GH_CONFIG_DIR`, `COPILOT_CACHE_HOME` and package cache. Do not copy an owner's
login, settings, credentials or session history. Preserve all enforced policies.
A fresh Copilot config directory does **not** isolate every credential source:
[official authentication documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)
describes environment credentials, the system credential store and `gh` fallback.
The checked JS does not prove fresh paths disable native keychain lookup.
Therefore a no-auth startup requires a genuinely credential-free approved host
context; do not query, delete or copy an owner's keychain to create one. Missing
that guarantee is a prerequisite failure, not permission to authenticate.

The [configuration-directory reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
separates the configuration and cache roots. Pin the reviewed native executable
and use its documented `--no-auto-update` flag; do not allow update/restart or
assume changing `COPILOT_HOME` pins cached executable/module bytes. Confirm the
loaded package identity where observable. Use no prompt/interactive-prompt flag,
remote session, agent workflow, BYOK configuration or model API credential.
Keep telemetry exporters disabled by absence of their activation settings.

Review startup hooks and plugins before any native session. Fresh user state and
a fresh controlled workspace exclude copied user/repository customizations, but
[policy hooks](https://docs.github.com/en/copilot/reference/hooks-reference)
may exist outside those directories, run before folder trust, and cannot be
disabled with `disableAllHooks`. An administrator-provisioned policy remains
binding. If its startup effects are unknown or exceed the approved experiment,
stop and request the exact host prerequisite; do not disable managed hooks.
User/repository hook-disable and IDE/MCP controls may be prepared only in the
already reviewed disposable settings scope, never the owner's global settings.
No hooks, MCP servers or extensions are needed by REDUE's candidate route.

## Smallest eventual control

After independent source review and explicit scope approval, a normal native
interactive PTY may first demonstrate **UI startup only**, without entering a
prompt, `!`, login, CA command or settings mutation. Stop if it starts an
authentication flow, requires unknown trust, or fails startup. Record exit/status
and sanitized prerequisite classifications; no complete environment or credential
output. UI startup alone is not sandbox acceptance.

Only after that gate and effective-policy review should the supported `!` path
run the existing intended REDUE preflight and credential/path/socket/network
negative controls. Required workspace/state/socket grants stay exact; bypasses
remain denied. Do not substitute `$`, direct SDK/native method calls, a custom
sandbox, relaxed credentials, or a newer host version. Missing preconditions
launch zero model trials. Existing fresh receipt-free status remains an honest
`UNVERIFIED` baseline; actual imported eligibility is independently checked by
REDUE after approved authentication/import.

If the supported interactive entry cannot start under that approved host policy,
record **HOST_CAPABILITY_UNESTABLISHED** with the actual failed layer. The minimal
owner/provider action is provisioning a supported interactive 1.0.91 session with
the reviewed effective policy and credential-free startup context, not granting
broader access. No shell, native UI or model was executed for this source review.

## Disabled standard macOS runner first-start proposal

The first-start proposal is **BLOCKED before native UI launch**, not an enabled
workflow. It would use one standard `macos-26` ephemeral VM, the exact native
1.0.91 distribution above, an empty owned disposable workspace, and fresh
configuration/GitHub CLI/cache directories. Its scope is one bounded normal PTY
startup, no input, then termination. No secrets, model prompts, `!` commands,
credentials, policy installation, artifact uploads or signing are in this stage.
Workflow permissions would be empty; no checkout credentials would persist.
The later `!` sandbox/credential-denial control remains a distinct review gate.

Only two source approaches were used: the pinned distribution's JS/native
forwarding and the current official auth/configuration/hook documentation. Neither
provides an authoritative cheap read-only green absence check for every native
credential and managed-policy source. No native guard/helper or active workflow
was added to paper over that gap.

The concrete owner/provider prerequisite is an approved runner context known to
have no Copilot OAuth credential in its system credential store, no authenticated
`gh` fallback, and no injected authentication/BYOK credentials. A standard runner
label or fresh `HOME`, `COPILOT_HOME` and `GH_CONFIG_DIR` alone is insufficient
proof. Do not inspect, export, remove or relocate an owner's credential store.
Record how the disposable context was actually provisioned and the applicable
provider guarantee; if that cannot be established, no UI process starts.

Before enabling even the input-free stage, establish the actual managed-policy
and startup-hook scope. The documented macOS sources are the MDM preference domain
`com.github.copilot`, `/Library/Application Support/GitHubCopilot/managed-settings.json`
and `/etc/github-copilot/policy.d/*.json`. Fresh workspace/user directories do not
replace those sources. Record their known absent state or separately reviewed
applicable policy; unknown/unreadable/native-managed state fails the gate. Never
use `disableAllHooks`, a changed search path or a hand-built sandbox to bypass it.

After this prerequisite and independent review, the owner can approve one exact
input-free startup route on that provisioned VM. The resulting observation may
establish startup availability only; it cannot establish token-child denial,
REDUE applicability, no-model `!` enforcement or model adoption. If native startup
requests login or undisclosed host authority, retain that result and stop rather
than feeding input. This proposal has executed zero native/UI/model processes and
requires no new account, billing, trust-store or global settings change.
