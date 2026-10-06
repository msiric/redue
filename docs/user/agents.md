# Agent decision policy

Use the CLI with explicit project-local activation below, or add this policy to a
generic agent's instructions with the project owner's permission.

1. Query ordinary `redue status --json` first.
2. Require schema 1 and healthy observation. If a check has `freshness: "CURRENT"`, `result: "PASS"`, and
   `reuse_eligible: true`, reuse it. Missing eligibility means false. Do not rerun merely for freshness.
3. If STALE, run `redue run CHECK` when that verification is needed.
4. If the historical `result` is FAIL, report it honestly. The human CLI calls
   this FAILED; applicability is a separate field, never an excuse to call it green.
5. If UNVERIFIED, inspect its reason. Use `status --sync --json` when establishing
   applicability is worthwhile, or rerun the underlying check when cheaper/simpler.
   Use `redue run CHECK` if a new receipt is wanted. Incomplete coverage can remain
   UNVERIFIED even after success.
6. Do not assume synchronization is cheaper than execution. There are no universal
   package-manager or OS thresholds. Inexpensive checks may be cheaper to rerun.

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

## Connect once (candidate)

After installing this candidate and running `redue init` in a trusted project:

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
or execute verification. Use `redue start` when you want observation.

Codex gets a short managed section in project `AGENTS.md` and
`.agents/skills/redue-verification/SKILL.md`. Claude Code gets a managed section
in `CLAUDE.md` and `.claude/skills/redue-verification/SKILL.md`. Each uses the same
policy source; detailed guidance is loaded when verification is relevant. Small
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
files do not prove the agent followed them. No hooks are installed. Doctor neither
executes checks nor starts observers, reconciles inputs, or installs a host.

Doctor separates missing/unreadable state, a missing or refused endpoint, an
explicit EPERM/EACCES access denial, and timeout/invalid response. A denial does
not identify whether OS permissions or host policy caused it. A live PID and
healthy cached observation do not prove control access. An older cached response
without receipt-selection validation gets stop/start guidance. Windows command
shims whose target has not been established are reported as unknown, not a
proven installation mismatch.

Codex CLI 0.160.1 on macOS has a tested limitation in the scoped socket route:
its enforced proxy permits the intended observer socket while denying other
destinations, and injects npm proxy configuration. This candidate admits the
observed `proxy`, `https_proxy`, `http_proxy`, and `noproxy` npm environment keys
(case-insensitive) for the reviewed npm 10.9.2 standalone `tsc --noEmit` contract.
`http_proxy` is a host-supplied, inert unknown key in that npm version, not an
official npm option. Conflicting aliases, invalid values, unknown overrides, and
unreviewed npm versions remain unsupported. Yarn/pnpm admission is unchanged.

All original npm context values remain fingerprinted. Same-context execution and
reuse pass, but independent Codex sessions were observed to receive different
loopback proxy ports. That difference makes prior evidence STALE on synchronized
inspection; ordinary cached status remains conservative when caller context is
unavailable. Do not unset the proxy, broaden permissions, or erase context
differences to force CURRENT. Eligible **fresh-session** reuse in this environment
has not been behaviorally established. Two fresh sessions correctly recorded new
executions instead of claiming inherited eligibility.

Before model trials, run `redue agent doctor --json` and
`redue status --sync --json` inside the agent's actual command boundary. The
contributor helper `test/acceptance/codex-preflight.mjs --config FILE --check CHECK`
performs the same bounded, read-only decision check and exits 2 when reuse is not
eligible. It neither executes verification nor grants access; synchronization
may run configured probes. A successful outside-shell result is insufficient.

Use the same setup command after a candidate upgrade; it updates intact managed
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
The generated instruction names its project-relative configuration and applies it
to status/run/explain. External configs or custom machine-local `--state-dir`
setups should use a reviewed generic instruction instead of committing absolute
paths. Other worktrees and remote containers have separate local evidence.

For another agent, put a short instruction in its documented project mechanism:
“Before deciding whether configured verification needs repeating, read REDUE's
agent policy, query ordinary `redue status --json` for the intended config, and
apply the schema/health/reuse rules.” Supply this document and the
[JSON contract](json.md) as the detailed policy. Review the agent's actual tool
trace before calling activation verified. A local npm installation does not install
REDUE in a remote container; that environment needs its own CLI, checkout,
dependencies and state. There is no cloud/team receipt synchronization.
