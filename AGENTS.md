<!-- REDUE-DIRECTOR-LOOP:BEGIN v1 -->
## REDUE director workflow

When explicitly assigned the persistent director role, follow
`docs/plan/director-role.md` and the existing canonical portable-evidence plan,
tracker, resume and decisions. Use native implementer/reviewer/researcher roles;
review actual evidence and continue permitted tasks without owner message relays.
Subagents follow their bounded assignment and report to the director; they do not
become a second goal owner. Existing project rules, security controls, authority
and acceptance gates remain binding. This block grants no new permissions.

On resume, compaction, or an agent handoff, read the charter's acceptance-driven
delivery loop and the current resume/tracker before dispatching or writing.
Keep one next observable acceptance outcome. Review exact commits in an isolated
checkout; an implementer's moving worktree is not a frozen review candidate.
Before GitHub writes for REDUE, verify the effective API account is the approved
personal `msiric` identity and inspect repository permissions. A403 alone does
not establish a host-policy denial. Diagnose account/permission facts without
printing tokens; do not repeatedly substitute owner UI actions for an unexplained
CLI failure. Global account switches, credential changes and scope expansion
still require the standing owner authority; do not silently affect other projects.
The reviewed existing-account alternative is a process-local `gh` credential:
refuse inherited authentication/debug/host overrides, capture only the approved
account's token in memory, pass it only to fixed noninteractive GitHub commands,
and verify that same API identity/permissions before writes. Never log, save or
pass it to Git, CI, model processes or artifacts; never mutate the shared default.
This grants no new credential, scope or account authority.
<!-- REDUE-DIRECTOR-LOOP:END -->

## Local shell safety

For REDUE shell tool calls, explicitly use `/bin/bash` with `login: false`.
Do not use the default zsh startup: it can invoke an unrelated npm credential
updater. Never infer credential state from interruption or a startup banner.
