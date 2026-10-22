# Agent decision policy

Use the CLI with explicit project-local activation below, or add this policy to a
generic agent's instructions with the project owner's permission.

1. If fresh execution is already required, execute it; do not synchronize merely
   to confirm an irrelevant reuse opportunity. Use `redue run CHECK` when recording
   the configured check. An explicit npm-script request still requires npm.
2. For reuse of the explicitly configured direct compiler recipe
   (`qualification: "npm-typescript-direct-v1"`, direct compiler command; receipt
   `verification_recipe: "npm-direct-typescript@1"`), query once:
   `redue --config CONFIG status --sync --json`. Do not infer a recipe from its name.
   Cached status cannot establish its caller context. In mixed configurations,
   assess each check's contract separately; this is not a global sync-first policy.
3. For other/unknown recipes, query ordinary `status --json` first and decide whether
   synchronization is worthwhile. Ordinary status and `--short` remain cheap inspection.
4. Reuse only schema 1, healthy observation and the selected check's CURRENT/PASS
   with `reuse_eligible: true`. Missing eligibility means false. A historical FAIL
   is never green evidence. Do not rerun eligible evidence merely for freshness.
5. STALE requires execution when verification is needed. UNVERIFIED requires an
   honest choice of synchronization, permitted execution or reporting the limitation.
   Recording-only success can remain UNVERIFIED. A deliberate cheap-check rerun is
   permitted; there are no universal platform/package-manager timing thresholds.
6. Use a successful synchronized response for the current decision without repeated
   sync/explain calls unless edits, context changes or missing information require it.
   Do not loop until green or use an earlier response after a later query fails.

`redue explain CHECK --json` gives synchronized detail, including a known changed
input when available. It has the same cost caveat as synchronized status.

No previous conversation history is needed to read a persisted receipt. Still
consider independent task-specific reasons to run verification: the configured
check is not universal product correctness. Report additional uncaptured checks
separately. Do not infer that an outer invocation's success proves a specific
check ran or that an upstream cache was hit; inspect `target_provenance`.

Reassess at the decision point after edits or context changes; previous CURRENT is
not continuing authorization. A status exit code of zero is not proof of CURRENT.
An empty changed-input list does not prove nothing changed. `run CHECK --json`
streams check output; use a subsequent status/explain query for structured evidence.
Explicit fresh-execution requests still require execution.

On a CLI error, unhealthy observation, or unavailable context, do not infer
CURRENT. Do not delete state or reset receipts to make the output green.

REDUE tells you what evidence exists and whether it still applies. It does not
promise that establishing applicability is cheaper than every possible check.

## Connect once (experimental)

Alpha.5 and later support opt-in project-local activation and direct
TypeScript evidence, with fresh-session reuse demonstrated for Codex CLI 0.160.1
and subsequent 0.162.0 trials on macOS under the documented owner-approved checkout/state/socket route. CLI
mechanics are tested on macOS/Linux/Windows; model behavior is not claimed for
every host/platform or sandbox policy. Claude setup/removal mechanics are tested,
but Claude behavior and cross-host reuse remain untested. Reuse is not guaranteed,
and the existing subsecond example establishes no meaningful net time saving.

After installing REDUE and running `redue init` in a trusted project:

```sh
redue agent setup codex --dry-run
redue agent setup codex --apply
# Or: redue agent setup claude --apply
redue agent doctor
```

Start a fresh agent session in this checkout, then give it your ordinary task.
Interactive setup shows the changes and asks before applying; noninteractive
setup requires `--apply`. `--dry-run` never writes. Installing REDUE or running
`init` does not connect an agent automatically. Setup does not start an observer
or execute verification. With Claude Code, a SessionStart hook starts the
observer when a session starts (below); otherwise use `redue start`.

## Claude Code typecheck hook

`redue agent setup claude --apply` also adds a PreToolUse hook and a
SessionStart hook to `.claude/settings.local.json`. Both run
`redue agent hook claude`, which needs a local REDUE install, so they are
per-developer; keep that file out of commits. Other settings in the file are kept,
but the file is rewritten as 2-space JSON. `.claude/settings.json` is not touched.
`redue agent remove claude --apply` removes only the entries REDUE added.

When a session starts, resumes, clears or compacts, the SessionStart hook starts
this project's observer if none is running. It launches `redue start` in the
background and returns at once, and prints nothing, so it adds nothing to the
agent's context. Until the observer's first index is done, checks are
UNVERIFIED and run as typed. An observer you stopped with `redue stop` starts
again with the next session; remove the hook to prevent that. Setups from
alpha.15 or earlier get the hook by running `redue agent setup claude --apply`
again.

The hook skips an exact rerun of a configured typecheck (a check with
`kind: "typecheck"` or named `typecheck`) or direct test check. It matches
these commands, run from the project root:

- `redue run CHECK`, or `redue --config FILE run CHECK` when the config is not
  `redue.config.json`
- the check's script through the project's package manager: `npm run SCRIPT`
  (and `npm test`), `pnpm SCRIPT`, `pnpm run SCRIPT`, `yarn SCRIPT` or
  `yarn run SCRIPT`. The short form is left out when the script is named like
  one of the package manager's own commands.
- the tool the check runs: `npx tsc ARGS` (and `pnpm exec tsc ARGS` with pnpm)
  for a direct TypeScript check, or the runner's command, alone or after `npx`,
  for a direct test check
- the check's `command`, when it has no `@` tokens
- for a workspace package's check: `pnpm --filter NAME SCRIPT` (also
  `--filter=NAME`, `-F NAME`, and with `run`), `yarn workspace NAME SCRIPT`, or
  `npm run SCRIPT -w NAME` (also `--workspace NAME`, `--workspace=NAME` and
  `npm -w NAME run SCRIPT`). After `cd` into the package's directory, the
  package-manager script forms and tool forms match that check.

A `turbo run TASK` (or `turbo TASK`, alone or after `npx` or `pnpm exec`) or,
in a pnpm project, `pnpm -r TASK` (`--recursive`, with or without `run`) that
runs a checked task in every workspace package is skipped only when every check
it would run is CURRENT, PASS and `reuse_eligible`. Every package with the
task's script must have a check. turbo must define the task, with `dependsOn`
listing at most `^TASK`, no `with`, no `PACKAGE#TASK` entries and no package
`turbo.json`; `pnpm -r` must not include the workspace root. A root script
whose text is such a command counts as that command, unless it has pre- or
post-scripts. In every other case the command runs as typed: turbo caches its
own results, so the hook never rewrites it. Filters (`--filter`) and nx are not
matched.

Each form may end with `2>&1` and then one `| tail -n N`, `| head -n N`,
`| tail -N` or `| head -N`. It may also be the first command of a `;` or `&&`
chain. Nothing else matches. Each form has its own `if` rule, so other Bash
commands never start the hook. The installed skill lists these exact commands,
so the agent uses forms the hook recognizes.

On a match, the hook runs `redue status --sync --json`. It waits up to half the
duration of the check's last completed run, at most 10 seconds, so waiting never
costs more than half a run. With no completed run it waits 2 seconds. A check
that takes a few hundred milliseconds is therefore rarely skipped; skipping it
would save almost nothing, and the hook does not rewrite it to `redue run`
either. Claude Code's own limit for the hook is 15 seconds.
It blocks the command only when the check is CURRENT, PASS and
`reuse_eligible: true`. The message names the check and the receipt's run ID. Every
other result allows the command: STALE, UNVERIFIED, FAILED, a timeout, an error, or
a missing `redue`. A command that starts with `REDUE_FORCE=1` always runs. A
blocked chain runs none of its commands; the message names the rest of the chain
so the agent can run it on its own.

When the check is not CURRENT but the observer answered for it, the hook rewrites
the command to `redue run CHECK` and allows it, keeping any `2>&1` and
`| tail`/`| head` suffix. It adds `--config FILE` when the config is not
`redue.config.json`. The run is recorded, so the next identical command can be
skipped. Without a healthy answer (timeout, error, no observer) the command runs
as typed. Claude Code still applies deny and ask rules to the rewritten command.
A chain is never rewritten: the rewrite is allowed without a prompt, and that
would also skip the prompt for the rest of the chain.

Limits:

- The hook judges its own environment, which Claude Code passes to it. The Bash
  tool can add variables from your shell profile. The hook cannot see those.
- Commands run from a session that started in a subdirectory, after a `cd`
  outside the project, or combined with `||`, `&` or other pipes, are not
  matched. After a `cd` into any other directory than the root or a checked
  package's, nothing matches.
- A skip writes nothing. If a typecheck command also emits files, later
  commands see the files from its last run.
- Only the Bash tool is covered, not PowerShell.
- Run setup again after you rename a check or script.
- The rewrite is allowed without a permission prompt, even where the original
  command would have prompted.

## Update an existing connection

Installing a newer package does **not** rewrite project instructions. From the
same project and installation, stop every observer using that installation before
replacing it. Keep the original config and state selection; do not create a second
config or delete receipts. Example for a default npm installation/config:

```sh
redue --config redue.config.json stop
npm install --global @redue/cli@alpha
redue --config redue.config.json agent setup codex --dry-run
redue --config redue.config.json agent setup codex --apply
redue --config redue.config.json start
redue --config redue.config.json status --sync --json
```

Use the **same `--prefix`** as the existing npm installation when it has a custom
prefix, and invoke its corresponding `redue` binary. Keep your actual config path
on every command. For Claude, select `claude` in both setup commands. Preserve any
existing `--state-dir` on lifecycle/status commands; setup does not embed custom
state locations, so retain the documented generic instruction path if your agent
workflow needs an explicit custom state. PowerShell may use the existing
`npm.cmd`/`redue.cmd` shims without changing script policy.

Review the preview before applying. Intact owned content updates; unrelated text
is preserved. Edited managed content is refused, not overwritten. If refused,
review/reconcile those edits deliberately; do not remove ownership records to force
an update. Restart the observer with its original selection even if you postpone
updating instructions, then start a **fresh agent session** after a successful
update. Setup creates no verification receipt.

Managed project metadata can itself be an observed input. Prior receipts remain
historical evidence, but setup may make them STALE or UNVERIFIED. Reassess normally
and run required checks; an upgrade is not a promise that existing receipts remain
CURRENT. Do not suppress that invalidation or reset state.

Codex gets a short managed section in project `AGENTS.md` that points to
`.agents/skills/redue-verification/SKILL.md`. Claude Code gets one in `CLAUDE.md`
that names the typecheck command the hook matches and says what a skip means,
plus `.claude/skills/redue-verification/SKILL.md`. The skill holds the reuse
rules and the exact commands for the selected config. When the hook matches a
typecheck, the `CLAUDE.md` section does not point to the skill: the hook does
the work, and the skill is there for agents that look for it. Small
ownership records in `.redue/agents/` support safe updates/removal. These are
portable project files, not receipts; review and commit them if the team wants
this integration. Do not ignore just the ownership records while committing the
managed files.

Existing instruction text is retained. Review it in the preview: setup cannot
prove arbitrary natural-language policies are consistent. Conflicts such as a
root `AGENTS.override.md` or an alternative `.claude/CLAUDE.md` are reported
instead of silently outranked. Global/managed policies, nested instructions,
Codex instruction-size limits, skill disabling, and host-specific exclusions
still apply. Complete the host's ordinary trust/permission prompts yourself;
REDUE never grants tool permission. Sandboxed hosts may need owner-approved access
to the checkout, owned state directory and local observer socket. A healthy daemon
does not establish that the agent can reach it; doctor reports control access
separately. Do not disable sandbox protections to make this work. Do not use a mode that disables project
instructions and expect automatic activation.

Control access is not simply file-read permission. The observer can reconcile and
write its owned index, run the trusted configuration's probes in its own process
context, reload receipts, and stop. Approve only the intended checkout/state and
endpoint, accounting for that authority. Doctor sends only a bounded metrics
request; it does not synchronize or run these probes.

`agent doctor [codex|claude] --json` is read-only. It distinguishes command lookup,
config resolution, cached observer health, a bounded read-only control-access probe,
managed-file integrity, detected host
version, and loading guidance. `behavior_verified: false` is deliberate: intact
files do not prove the agent followed them. For Claude, doctor reports whether the
typecheck hook is installed. Doctor neither
executes checks nor starts observers, reconciles inputs, or installs a host.

Doctor separates missing/unreadable state, a missing or refused endpoint, an
explicit EPERM/EACCES access denial, and timeout/invalid response. A denial does
not identify whether OS permissions or host policy caused it. A live PID and
healthy cached observation do not prove control access. An older cached response
without receipt-selection validation gets stop/start guidance. Windows command
shims whose target has not been established are reported as unknown, not a
proven installation mismatch.

Codex CLI 0.160.1 on macOS can use the approved exact observer-socket route while
other sockets and direct network access remain denied. Its independent sessions
receive different proxy values. Ordinary npm invocation is **not** equivalent
across arbitrary notifier state: REDUE withholds automatic npm-launcher
reuse. Do not change proxy settings or permissions to get green evidence.

The separate opt-in [direct local compiler recipe](direct-typescript.md) does not
run npm. Its reviewed compiler implementation does not consume npm/proxy settings;
a digest preserves their observed provenance without treating them as compiler
inputs. Other execution context remains strict, and cached status still cannot
assert caller eligibility. An explicit user request for `npm run typecheck` still
requires npm execution; direct compiler evidence is not a substitute.

Before model trials, run `redue agent doctor --json` and
`redue status --sync --json` inside the agent's actual command boundary. The
contributor helper `test/acceptance/codex-preflight.mjs --config FILE --check CHECK`
performs the same bounded, read-only decision check and exits 2 when reuse is not
eligible. It neither executes verification nor grants access; synchronization
may run configured probes. A successful outside-shell result is insufficient.

Use the same setup command after an upgrade; it updates intact managed
content idempotently. Changed skill text or a changed managed block causes a
conflict instead of an overwrite. Review your edits before retrying.

```sh
redue agent remove codex --dry-run
redue agent remove codex --apply
redue agent remove claude --apply
```

Removal deletes only intact REDUE-owned content for that host. Unrelated text,
other integrations, project config, receipts and installed dependencies remain.
User edits outside the managed section survive. Modified managed content is left
intact with a diagnostic; compare it with a preview and resolve manually. Empty
parent directories may remain. If the selected config has been deleted, restore
it or manually remove only the marked REDUE section, that host's skill, and its
`.redue/agents/HOST.json` ownership record after review. Do not delete an entire
instruction file containing user content.

## Project identity and generic agents

Commands from nested directories search toward the nearest Git root. If more than
one configuration applies, select one with `--config FILE`; REDUE refuses to guess.
The generated skill names its project-relative configuration and gives the exact
status and run commands for it. External configs or custom machine-local `--state-dir`
setups should use a reviewed generic instruction instead of committing absolute
paths. Other worktrees and remote containers have separate local evidence.

For another agent, put a short instruction in its documented project mechanism:
“Before deciding whether configured verification needs repeating, read REDUE's
agent policy, identify the selected recipe and use its decision query for the intended config.
Apply the schema/health/reuse rules.” Supply this document and the
[JSON contract](json.md) as the detailed policy. Review the agent's actual tool
trace before calling activation verified. A local npm installation does not install
REDUE in a remote container; that environment needs its own CLI, checkout,
dependencies and state. There is no cloud/team receipt synchronization.
