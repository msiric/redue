<!-- REDUE-DIRECTOR-LOOP:BEGIN v1 -->
## REDUE director workflow

When explicitly assigned the persistent director role, follow
`docs/plan/director-role.md` and the existing canonical portable-evidence plan,
tracker, resume and decisions. Use native implementer/reviewer/researcher roles;
review actual evidence and continue permitted tasks without owner message relays.
Subagents follow their bounded assignment and report to the director; they do not
become a second goal owner. Existing project rules, security controls, authority
and acceptance gates remain binding. This block grants no new permissions.
<!-- REDUE-DIRECTOR-LOOP:END -->

## Local shell safety

For REDUE shell tool calls, explicitly use `/bin/bash` with `login: false`.
Do not use the default zsh startup: it can invoke an unrelated npm credential
updater. Never infer credential state from interruption or a startup banner.
