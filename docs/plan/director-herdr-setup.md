# REDUE director loop — Herdr installation and startup

**Prepared:** 2026-10-13. **Status:** installed project-local setup with an actual
coordination loop exercised in the existing primary Herdr/Codex thread. The current
[resume](portable-evidence-resume.md) records revisions, native role loading and
unexercised persistence controls; installation alone is not runtime acceptance.

This supplement adapts the existing Codex director kit to a Herdr-managed session.
It takes precedence over generic startup suggestions in PLAN.md; it does not change
REDUE-PE-001, its acceptance gates, the standing authorization, or host policy.

## Architecture: one coordinator, not two orchestration stacks

- Herdr owns the persistent terminal containing the Codex director.
- The Codex Goal owns task continuation and product decisions.
- Native Codex subagents perform implementation, independent review and research.
- Herdr's terminal status is lifecycle information, not proof that a task passed.
- Native subagents need not appear as separate Herdr panes. Inspect them through
  Codex's supported agent/thread interface. Do not create duplicate pane workers
  just to produce a more impressive layout.
- No additional agent orchestrator, SDK controller, cron, launchd job, UI automation,
  remote desktop, webhook or public socket bridge is needed for this initial setup.

## 1. Local discovery before any change

Operate from the owner's existing local REDUE agent, not an unrelated remote shell.
Read the latest repository instructions, real branch/worktree, canonical plan,
tracker, decisions, and resume. Do not restore to an old main commit.

Verify the kit manifest locally. Inventory Herdr/Codex versions and actual current
session/pane ownership. Use installed `--help`, and use `herdr --skill` where
supported to read the release-matched agent skill. `HERDR_ENV=1` identifies a
Herdr-managed pane; verify it instead of inventing a socket or pane identifier.
The installed `herdr api schema --json` is available on supporting releases.

Only inspect REDUE-owned resources and the metadata needed to resolve this session.
Do not read unrelated panes, transcripts, credentials or other projects.

Inspect the running Herdr server as well as the client before depending on a newer
command. Do not upgrade/restart Herdr or Codex automatically to make this setup fit.
Pinned product-acceptance agent installations must not be changed.

Read-only installed CLI examples, after checking support:

```sh
herdr --version
herdr --skill
herdr status
herdr pane current
codex --version
```

Missing HERDR_ENV or denied socket access is a real launch/access fact. Report one
specific permitted remedy; do not route a denied operation through another pane.
Herdr control can run commands in terminals outside an agent's own sandbox; it is
not a permission-escalation mechanism.

## 2. Preserve current work and appoint the director

The preferred minimal transition is to make the current REDUE primary Codex thread
inside Herdr the director, provided it can load the needed native roles/tools.

Before transition, let existing workers finish a safe checkpoint and collect their
actual uncommitted/committed work. Record active task owners. Do not kill another
pane, stash/reset unknown changes, or let the old autonomous coordinator keep
assigning production work after a new one takes over.

If roles/configuration require a fresh Codex session:
- Save a complete handoff and native thread identity.
- Pause the old coordinator's goal through supported controls.
- Leave the old pane and work intact.
- Use at most one explicitly owned sibling pane for the replacement director,
  only through supported Herdr commands permitted by effective host policy.
- Use the existing approved subscription and working directory, not a clean clone
  that loses the pending project state.
- Record which thread owns coordination before any new implementation writes.

Do not send input into this same active agent to try to control yourself. If the
client cannot be safely reloaded or handed off programmatically, return one exact
resume/launch step for the owner after completing all other preparation.

## 3. Install project-local role and instruction files

Use README.md's mapping. Preserve unrelated and modified managed content. Make a
backup of any existing file before a coherent reviewed edit; retain ownership and
original bytes for safe undo. Do not overwrite the original product plan.

Read the installed Herdr skill as operating guidance; install a project-local copy
only if useful and supported. Do not perform a global skills install or fetch an
unreviewed plugin. The installed binary's bundled guidance is preferable to a
possibly newer remote copy.

Merge the supported config fragment into the existing project configuration using
one table/key per TOML scope. Never blindly append a second [agents] table. Preserve
stricter managed policy, approved roots, credentials, and the current sandbox.
Review role sandbox declarations against their effective inherited permissions.
Do not use read-write mode to bypass a denied directory.

Keep at most three concurrent children plus the primary director, subject to
included capacity. Leave the actual model selection inherited unless the owner has
already approved a different available model. Do not invent a model identifier,
copy authentication stores, switch to API billing or select Copilot/Claude solely
because their product acceptance is currently blocked.

Where supported and permitted, Auto-review may handle eligible operational approval
requests. It is separate from independent code review. Preserve its safety policy;
never install an approve-everything rule or remove a host restriction.

## 4. Activate the existing goal

Use DIRECTOR_GOAL.md to update/transfer the existing objective. Do not maintain two
live REDUE program goals. Use actual documented native controls, not terminal
scraping or repetitive synthetic 'continue' messages.

The director reads source and evidence, delegates implementation, waits for its
result, commissions a fresh reviewer, decides, records the decision, and selects
the next unblocked task without requiring an owner relay.

Native completion tools are authoritative for subagent completion. If observing a
pane for a legitimate integration task, Herdr's idle/blocked state only tells you
when to inspect; it does not establish success or permission to answer an approval.
Never approve UI prompts by blindly pressing Enter.

A lack of Copilot CI billing confirmation is not a dependency of this local Codex
coordination setup. Real product-acceptance gates remain separate and unchanged.

## 5. Actually run the coordination smoke check

Complete SMOKE_CHECK.md on one genuine, bounded current project task. Use the
runtime's real implementer/reviewer threads; do not role-play their messages.

Required observation:

```text
Director assignment -> worker result -> source/evidence inspection
-> fresh independent review -> director decision -> next permitted task
```

Record the exact task/revision, actual tests, review outcome and next task. The owner
must not supply a 'continue' between those steps. Do not create a fake bug or risky
action to force a review/rejection branch.

If there is genuinely no permitted useful task, do not fabricate a loop PASS. State
SETUP_READY_WITH_BLOCKER and distinguish the loaded configuration from unexercised
behavior. Otherwise, continue implementation after the first loop.

No full historical REDUE CI rerun solely for installing role files. Run the checks
necessary for changed code/config and the actual assigned task.

## 6. Prove persistence without disrupting work

Document the installed Herdr detach/reattach controls. On documented releases,
Ctrl+B then Q detaches the terminal client; running `herdr` attaches again.
Do not use `herdr server stop` or close the director pane to 'test detach'.
Do not detach the owner's UI unannounced. An actual detach test is optional and
must be reported NOT RUN if not performed.

Persistence is not continued computation while the Mac is asleep, shut down or
without provider capacity. Keep an accurate distinction between a saved/restored
layout, a resumed native session and an actively continuing Goal. Do not change
system power settings, configure login services or enable unattended post-reboot
resumption without a separate explicit decision.

Herdr's session recovery capabilities vary by installed version/agent integration.
Record the director's native session identity and the existing durable resume
record. After recovery, reconcile real workers and worktrees before new writes.
Honor owner pauses and quota/permission stops; do not add a watchdog that cancels
those decisions.

## 7. Finish with a factual status

Return a short record containing:

```text
SETUP: RUNNING / SETUP_READY_RESTART_REQUIRED / BLOCKED
Herdr client/server versions:
owned session/workspace/pane:
Codex version/model/auth route (no secrets):
director thread and goal:
role files installed and effectively loaded:
current branch/worktree and single writer owner:
actual smoke task, test and review results:
next active task without owner relay:
remaining owner-only action, if any:
live behavior not tested:
```

Keep actual private pane/session/path metadata in the existing owner-local resume,
not a public issue. Do not claim RUNNING solely from a parsed TOML file, a created
pane, process existence, or a task's draft status. It requires actual loop evidence
and the continuing Goal, or an accurately named legitimate waiting condition.

## Sources checked for this supplement

- https://herdr.dev/docs/agent-skill/
- https://herdr.dev/docs/cli-reference/
- https://herdr.dev/docs/agent-automation/
- https://herdr.dev/docs/session-state/
- https://herdr.dev/docs/how-to-work/
- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex

Official current documentation describes capabilities, not the state or version of
the owner's installation. Local effective capability checks remain necessary.
